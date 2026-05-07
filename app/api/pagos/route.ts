import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      orden_id,
      comprador_id,
      vendedor_id,
      monto_producto,
      monto_envio = 0,
      metodo_pago_id,
    } = body;

    if (
      !orden_id ||
      !comprador_id ||
      !vendedor_id ||
      !metodo_pago_id
    ) {
      return NextResponse.json(
        { error: "Faltan campos obligatorios" },
        { status: 400 }
      );
    }

    if (typeof monto_producto !== "number" || monto_producto <= 0) {
      return NextResponse.json(
        { error: "monto_producto debe ser un número positivo" },
        { status: 400 }
      );
    }

    if (typeof monto_envio !== "number" || monto_envio < 0) {
      return NextResponse.json(
        { error: "monto_envio debe ser un número mayor o igual a 0" },
        { status: 400 }
      );
    }

    const pagoExistente = await supabase
      .from("pago")
      .select("pago_id")
      .eq("orden_id", orden_id)
      .maybeSingle();

    if (pagoExistente.error) {
      return NextResponse.json(
        { error: pagoExistente.error.message },
        { status: 500 }
      );
    }

    if (pagoExistente.data) {
      return NextResponse.json(
        { error: "Ya existe un pago para esta orden" },
        { status: 409 }
      );
    }

    const porcentajeComision = 0.1;

    const comision = monto_producto * porcentajeComision;
    const monto_neto = monto_producto - comision;
    const monto_total = monto_producto + monto_envio;

    const { data, error } = await supabase
      .from("pago")
      .insert([
        {
          orden_id,
          comprador_id,
          vendedor_id,
          monto_producto,
          monto_envio,
          comision,
          monto_neto,
          monto_total,
          moneda: "ARS",
          estado: "pendiente",
          metodo_pago_id,
          proveedor: "MERCADO_PAGO",
        },
      ])
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}