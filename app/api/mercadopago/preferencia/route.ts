import { NextRequest, NextResponse } from "next/server";
import { preferenceClient } from "@/lib/mercadopago";

const baseUrl =
  process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { orden_id, titulo, monto_total, comprador_email } = body;

    if (!orden_id || !titulo || !monto_total || !comprador_email) {
      return NextResponse.json(
        {
          error: "Faltan datos obligatorios para crear la preferencia",
        },
        { status: 400 }
      );
    }

    console.log("Base URL usada:", baseUrl);
    console.log(
      "Notification URL enviada a Mercado Pago:",
      `${baseUrl}/api/mercadopago/webhook`
    );
    console.log("Orden enviada a Mercado Pago:", orden_id);

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
          success: `${baseUrl}/pago/${orden_id}/exito`,
          failure: `${baseUrl}/pago/${orden_id}/fallo`,
          pending: `${baseUrl}/pago/${orden_id}/pendiente`,
        },

        notification_url: `${baseUrl}/api/mercadopago/webhook`,
      },
    });

    console.log("Preferencia creada en Mercado Pago:", {
      id: preference.id,
      init_point: preference.init_point,
      sandbox_init_point: preference.sandbox_init_point,
    });

    return NextResponse.json(
      {
        preference_id: preference.id,
        init_point: preference.init_point,
        sandbox_init_point: preference.sandbox_init_point,
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