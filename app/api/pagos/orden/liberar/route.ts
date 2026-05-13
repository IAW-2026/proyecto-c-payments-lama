import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const { orden_id, envio_id } = await req.json();

    if (!orden_id || !envio_id) {
      return NextResponse.json(
        { error: "Faltan campos obligatorios: orden_id y envio_id" },
        { status: 400 }
      );
    }

    const { data: pago, error: errorPago } = await supabase
      .from("pago")
      .select("*")
      .eq("orden_id", orden_id)
      .single();

    if (errorPago || !pago) {
      return NextResponse.json(
        { error: "No se encontró un pago para esa orden" },
        { status: 404 }
      );
    }

    if (pago.estado !== "aprobado") {
      return NextResponse.json(
        {
          error: "El pago no puede liberarse porque no está aprobado",
          estado_actual: pago.estado,
        },
        { status: 409 }
      );
    }

    const { error: errorTransaccion } = await supabase
      .from("transaccion_de_pago")
      .insert([
        {
          pago_id: pago.pago_id,
          tipo_transaccion: "liberacion",
          monto: pago.monto_neto,
          estado: "aprobado",
          transaccion_proveedor_id: envio_id,
          codigo_proveedor: "ENVIO_ENTREGADO",
          mensaje_proveedor:
            "Pago liberado al vendedor luego de confirmarse la entrega",
        },
      ]);

    if (errorTransaccion) {
      return NextResponse.json(
        { error: errorTransaccion.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: "Pago liberado correctamente al vendedor",
        orden_id: pago.orden_id,
        envio_id,
        pago_id: pago.pago_id,
        vendedor_id: pago.vendedor_id,
        monto_liberado: pago.monto_neto,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error al liberar pago:", error);

    return NextResponse.json(
      { error: "Error interno al liberar el pago" },
      { status: 500 }
    );
  }
}