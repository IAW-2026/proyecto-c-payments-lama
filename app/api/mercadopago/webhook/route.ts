import { NextRequest, NextResponse } from "next/server";
import { paymentClient } from "@/lib/mercadopago";
import { supabase } from "@/lib/supabase";

function mapearEstadoMercadoPago(status: string) {
  if (status === "approved") return "aprobado";
  if (status === "rejected") return "rechazado";
  if (status === "cancelled") return "cancelado";

  return "pendiente";
}

function obtenerTipoTransaccion(status: string) {
  if (status === "approved") return "captura";
  if (status === "rejected") return "rechazo";

  return "autorizacion";
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const mercadoPagoPaymentId = body?.data?.id;

    if (!mercadoPagoPaymentId) {
      return NextResponse.json(
        { error: "No se recibió el ID del pago de Mercado Pago" },
        { status: 400 }
      );
    }

    const pagoMercadoPago = await paymentClient.get({
      id: mercadoPagoPaymentId,
    });

    const ordenId = pagoMercadoPago.external_reference;
    const estadoMercadoPago = pagoMercadoPago.status || "pending";
    const estadoPago = mapearEstadoMercadoPago(estadoMercadoPago);
    const tipoTransaccion = obtenerTipoTransaccion(estadoMercadoPago);
    const monto = pagoMercadoPago.transaction_amount || 0;

    if (!ordenId) {
      return NextResponse.json(
        { error: "El pago de Mercado Pago no tiene external_reference" },
        { status: 400 }
      );
    }

    const fechasActualizadas: Record<string, string> = {};

    if (estadoPago === "aprobado") {
      fechasActualizadas.fecha_aprobado = new Date().toISOString();
    }

    if (estadoPago === "rechazado") {
      fechasActualizadas.fecha_rechazo = new Date().toISOString();
    }

    if (estadoPago === "cancelado") {
      fechasActualizadas.fecha_cancelado = new Date().toISOString();
    }

    const { data: pagoActualizado, error: errorPago } = await supabase
      .from("pago")
      .update({
        estado: estadoPago,
        pago_proveedor_id: String(mercadoPagoPaymentId),
        fecha_actualizacion: new Date().toISOString(),
        ...fechasActualizadas,
      })
      .eq("orden_id", ordenId)
      .select()
      .single();

    if (errorPago) {
      return NextResponse.json(
        { error: errorPago.message },
        { status: 500 }
      );
    }

    const { error: errorTransaccion } = await supabase
      .from("transaccion_de_pago")
      .insert([
        {
          pago_id: pagoActualizado.pago_id,
          tipo_transaccion: tipoTransaccion,
          monto,
          estado: estadoPago,
          transaccion_proveedor_id: String(mercadoPagoPaymentId),
          codigo_proveedor: estadoMercadoPago,
          mensaje_proveedor:
            pagoMercadoPago.status_detail || "Sin detalle del proveedor",
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
        message: "Webhook procesado correctamente",
        orden_id: ordenId,
        estado: estadoPago,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Error al procesar webhook de Mercado Pago" },
      { status: 500 }
    );
  }
}