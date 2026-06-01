import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { preferenceClient } from "@/lib/mercadopago";
import { supabase } from "@/lib/supabase";

const baseUrl =
  process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const buyerAppUrl = (
  process.env.BUYER_APP_URL || "https://proyecto-c-buyer2-lama.vercel.app"
).replace(/\/$/, "");

function obtenerCheckoutUrl({
  initPoint,
  sandboxInitPoint,
}: {
  initPoint?: string;
  sandboxInitPoint?: string;
}) {
  const checkoutMode = process.env.MERCADO_PAGO_CHECKOUT_MODE;

  if (checkoutMode === "sandbox") {
    return sandboxInitPoint || initPoint;
  }

  if (checkoutMode === "production") {
    return initPoint || sandboxInitPoint;
  }

  return initPoint || sandboxInitPoint;
}

function obtenerTexto(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Debes iniciar sesion para crear la preferencia" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const comprador = body.comprador;

    const comprador_id = obtenerTexto(
      comprador?.comprador_id ?? body.comprador_id
    );
    const comprador_nombre = obtenerTexto(
      comprador?.nombre ?? body.comprador_nombre
    );
    const comprador_email = obtenerTexto(
      comprador?.email ?? body.comprador_email
    );
    const vendedor_id = obtenerTexto(body.vendedor_id);

    const {
      orden_id,
      titulo,
      monto_producto,
      monto_envio = 0,
      monto_total,
    } = body;

    if (
      !orden_id ||
      !titulo ||
      !comprador_id ||
      !comprador_nombre ||
      !comprador_email ||
      !vendedor_id
    ) {
      return NextResponse.json(
        {
          error:
            "Faltan datos obligatorios para crear el pago y la preferencia",
        },
        { status: 400 }
      );
    }

    if (comprador_id !== userId) {
      return NextResponse.json(
        { error: "No podes crear una preferencia para otro comprador" },
        { status: 403 }
      );
    }

    if (typeof monto_producto !== "number" || monto_producto <= 0) {
      return NextResponse.json(
        { error: "monto_producto debe ser un numero positivo" },
        { status: 400 }
      );
    }

    if (typeof monto_envio !== "number" || monto_envio < 0) {
      return NextResponse.json(
        { error: "monto_envio debe ser un numero mayor o igual a 0" },
        { status: 400 }
      );
    }

    const montoTotalCalculado = monto_producto + monto_envio;

    if (
      typeof monto_total !== "number" ||
      monto_total !== montoTotalCalculado
    ) {
      return NextResponse.json(
        { error: "monto_total debe coincidir con producto + envio" },
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

    if (!pagoExistente.data) {
      const porcentajeComision = 0.1;
      const comision = monto_producto * porcentajeComision;
      const monto_neto = monto_producto - comision;

      const { error: errorPago } = await supabase
        .from("pago")
        .insert([
          {
            orden_id,
            comprador_id,
            comprador_nombre,
            comprador_email,
            vendedor_id,
            monto_producto,
            monto_envio,
            comision,
            monto_neto,
            monto_total: montoTotalCalculado,
            moneda: "ARS",
            estado: "pendiente",
            proveedor: "MERCADO_PAGO",
          },
        ])
        .select("pago_id")
        .single();

      if (errorPago) {
        return NextResponse.json(
          { error: errorPago.message },
          { status: 500 }
        );
      }
    }

    console.log("Base URL usada:", baseUrl);
    console.log(
      "Notification URL enviada a Mercado Pago:",
      `${baseUrl}/api/mercadopago/webhook`
    );
    console.log("Orden enviada a Mercado Pago:", {
      orden_id,
      monto_total,
      monto_producto,
      monto_envio,
    });

    const preference = await preferenceClient.create({
      body: {
        items: [
          {
            id: orden_id,
            title: titulo,
            quantity: 1,
            unit_price: monto_total,
            currency_id: "ARS",
          },
        ],

        payer: {
          email: comprador_email,
        },

        external_reference: orden_id,

        metadata: {
          orden_id,
        },

        back_urls: {
          success: buyerAppUrl,
          failure: buyerAppUrl,
          pending: buyerAppUrl,
        },

        notification_url: `${baseUrl}/api/mercadopago/webhook`,
      },
    });

    console.log("Preferencia creada en Mercado Pago:", {
      id: preference.id,
      init_point: preference.init_point,
      sandbox_init_point: preference.sandbox_init_point,
    });

    const checkoutUrl = obtenerCheckoutUrl({
      initPoint: preference.init_point,
      sandboxInitPoint: preference.sandbox_init_point,
    });

    console.log("Checkout URL seleccionada:", {
      modo: process.env.MERCADO_PAGO_CHECKOUT_MODE || "init_point_por_defecto",
      usa_sandbox: checkoutUrl === preference.sandbox_init_point,
      usa_produccion: checkoutUrl === preference.init_point,
    });

    return NextResponse.json(
      {
        preference_id: preference.id,
        init_point: preference.init_point,
        sandbox_init_point: preference.sandbox_init_point,
        checkout_url: checkoutUrl,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creando preferencia:", error);

    return NextResponse.json(
      {
        error: "Error al crear la preferencia de Mercado Pago",
      },
      { status: 500 }
    );
  }
}
