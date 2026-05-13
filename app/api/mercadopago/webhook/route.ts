import { NextRequest, NextResponse } from "next/server";
import { paymentClient, merchantOrderClient } from "@/lib/mercadopago";
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

    console.log("Webhook Mercado Pago recibido:", body);

    const tipoNotificacion = body?.type || body?.topic;

    let mercadoPagoPaymentId: string | undefined;

    if (tipoNotificacion === "payment") {
      mercadoPagoPaymentId = body?.data?.id?.toString() || body?.id?.toString();
    }

    if (tipoNotificacion === "merchant_order") {
      const merchantOrderId = body?.resource?.split("/").pop();

      console.log("Consultando merchant order:", merchantOrderId);

      if (merchantOrderId) {
        const merchantOrder = await merchantOrderClient.get({
          merchantOrderId,
        });

        console.log("Merchant order obtenida:", merchantOrder);

        const primerPago = merchantOrder.payments?.[0];

        if (primerPago?.id) {
          mercadoPagoPaymentId = primerPago.id.toString();
        }
      }
    }

    if (!mercadoPagoPaymentId) {
      console.log("Webhook recibido sin payment_id procesable:", body);

      return NextResponse.json(
        {
          message:
            "Webhook recibido correctamente. No se procesó pago porque no vino payment_id.",
        },
        { status: 200 }
      );
    }

    let pagoMercadoPago;

    try {
      pagoMercadoPago = await paymentClient.get({
        id: String(mercadoPagoPaymentId),
      });
    } catch (error) {
      console.error(
        "No se pudo consultar el pago en Mercado Pago:",
        mercadoPagoPaymentId,
        error
      );

      return NextResponse.json(
        {
          message:
            "Webhook recibido, pero el pago no existe en Mercado Pago. Esto puede pasar con la prueba de configuración.",
          payment_id: mercadoPagoPaymentId,
        },
        { status: 200 }
      );
    }

    console.log("Pago obtenido desde Mercado Pago:", {
      id: pagoMercadoPago.id,
      status: pagoMercadoPago.status,
      status_detail: pagoMercadoPago.status_detail,
      external_reference: pagoMercadoPago.external_reference,
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
      .maybeSingle();

    if (errorPago) {
      console.log("Error actualizando pago:", errorPago);

      return NextResponse.json({ error: errorPago.message }, { status: 500 });
    }

    if (!pagoActualizado) {
      console.log("No existe pago interno para la orden:", ordenId);

      return NextResponse.json(
        {
          error: "No existe pago interno para esa orden",
          orden_id: ordenId,
        },
        { status: 404 }
      );
    }

    console.log("Pago actualizado:", pagoActualizado);

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
      console.log("Error creando transaccion:", errorTransaccion);

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
    console.error("Error webhook Mercado Pago:", error);

    return NextResponse.json(
      { error: "Error al procesar webhook de Mercado Pago" },
      { status: 500 }
    );
  }
}