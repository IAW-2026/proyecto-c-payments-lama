import { NextRequest, NextResponse } from "next/server";
import { preferenceClient } from "@/lib/mercadopago";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      orden_id,
      titulo,
      monto_total,
      comprador_email,
    } = body;

    if (!orden_id || !titulo || !monto_total || !comprador_email) {
      return NextResponse.json(
        { error: "Faltan datos obligatorios para crear la preferencia" },
        { status: 400 }
      );
    }

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
        back_urls: {
          success: `http://localhost:3000/pago/${orden_id}/exito`,
          failure: `http://localhost:3000/pago/${orden_id}/fallo`,
          pending: `http://localhost:3000/pago/${orden_id}/pendiente`,
        },
      },
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
    console.error(error);

    return NextResponse.json(
      { error: "Error al crear la preferencia de Mercado Pago" },
      { status: 500 }
    );
  }
}