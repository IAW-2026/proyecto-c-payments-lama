import { NextRequest, NextResponse } from "next/server";
import { merchantOrderClient, paymentClient } from "@/lib/mercadopago";
import { supabase } from "@/lib/supabase";

type WebhookMercadoPago = {
  action?: string;
  data?: {
    id?: string | number;
  };
  id?: string | number;
  resource?: string;
  topic?: string;
  type?: string;
};

function mapearEstadoMercadoPago(status: string) {
  if (status === "approved") return "aprobado";
  if (status === "rejected") return "rechazado";
  if (status === "cancelled") return "cancelado";
  return "pendiente";
}

function obtenerTipoTransaccion(status: string) {
  if (status === "approved") return "captura";
  if (status === "rejected") return "rechazo";
  if (status === "cancelled") return "cancelacion";
  return "autorizacion";
}

function extraerIdRecurso(body: WebhookMercadoPago) {
  if (body.data?.id || body.id) {
    return body.data?.id || body.id;
  }

  if (!body.resource) {
    return null;
  }

  try {
    const resourceUrl = new URL(body.resource);
    return resourceUrl.pathname.split("/").filter(Boolean).pop() || null;
  } catch {
    return body.resource.split("/").filter(Boolean).pop() || null;
  }
}

function obtenerTipoNotificacion(body: WebhookMercadoPago) {
  const tipo = body.type || body.topic || body.action || "";

  if (tipo.includes("merchant_order") || body.resource?.includes("merchant_orders")) {
    return "merchant_order";
  }

  if (tipo.includes("payment") || body.resource?.includes("payments")) {
    return "payment";
  }

  return tipo;
}

async function obtenerPaymentIdDesdeWebhook(body: WebhookMercadoPago) {
  const recursoId = extraerIdRecurso(body);

  if (!recursoId) {
    return null;
  }

  const tipoNotificacion = obtenerTipoNotificacion(body);

  console.log("Resolviendo webhook Mercado Pago:", {
    tipo_notificacion: tipoNotificacion,
    recurso_id: recursoId,
  });

  if (tipoNotificacion !== "merchant_order") {
    return String(recursoId);
  }

  const merchantOrder = await merchantOrderClient.get({
    merchantOrderId: String(recursoId),
  });

  console.log("Merchant order obtenida desde Mercado Pago:", {
    id: merchantOrder.id,
    status: merchantOrder.status,
    order_status: merchantOrder.order_status,
    external_reference: merchantOrder.external_reference,
    payments: merchantOrder.payments,
  });

  const pagoPreferido =
    merchantOrder.payments?.find((payment) =>
      ["approved", "pending", "in_process", "authorized"].includes(
        payment.status || ""
      )
    ) || merchantOrder.payments?.find((payment) => payment.id);

  return pagoPreferido?.id ? String(pagoPreferido.id) : null;
}

async function notificarSellerApp({
  ordenId,
  estadoPago,
  pagoId,
  motivo,
}: {
  ordenId: string;
  estadoPago: "pendiente" | "aprobado" | "rechazado" | "cancelado";
  pagoId: string;
  motivo?: string;
}) {
  if (estadoPago === "rechazado") {
    console.log("Mock Seller App - pago rechazado:", {
      endpoint: `POST /api/ordenes-ventas/${ordenId}/pago-rechazado`,
      request: {
        orden_id: ordenId,
        pago_id: pagoId,
        motivo_rechazo: motivo || "Pago rechazado por el proveedor",
        fecha_rechazo: new Date().toISOString(),
      },
    });

    return;
  }

  console.log("Mock Seller App - actualizar estado de pago:", {
    endpoint: `PATCH /api/ordenes-ventas/${ordenId}/estado-pago`,
    request: {
      orden_id: ordenId,
      estado_pago: estadoPago,
      pago_id: pagoId,
      motivo: motivo || "Actualización recibida desde Payments App",
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as WebhookMercadoPago;

    console.log("Webhook Mercado Pago recibido:", body);

    const mercadoPagoPaymentId = await obtenerPaymentIdDesdeWebhook(body);

    if (!mercadoPagoPaymentId) {
      console.log("Webhook de prueba recibido sin payment id:", body);

      return NextResponse.json(
        {
          message:
            "Webhook recibido correctamente. No se procesó pago porque no se pudo resolver un payment_id.",
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
      .single();

    if (errorPago) {
      console.log("Error actualizando pago:", errorPago);

      return NextResponse.json({ error: errorPago.message }, { status: 500 });
    }

    console.log("Pago actualizado:", pagoActualizado);

    await notificarSellerApp({
      ordenId,
      estadoPago,
      pagoId: pagoActualizado.pago_id,
      motivo: pagoMercadoPago.status_detail || undefined,
    });

    const { data: transaccionExistente, error: errorBuscandoTransaccion } =
      await supabase
        .from("transaccion_de_pago")
        .select("transaccion_id")
        .eq("pago_id", pagoActualizado.pago_id)
        .eq("tipo_transaccion", tipoTransaccion)
        .eq("transaccion_proveedor_id", String(mercadoPagoPaymentId))
        .maybeSingle();

    if (errorBuscandoTransaccion) {
      console.log(
        "Error buscando transaccion existente:",
        errorBuscandoTransaccion
      );

      return NextResponse.json(
        { error: errorBuscandoTransaccion.message },
        { status: 500 }
      );
    }

    if (transaccionExistente) {
      return NextResponse.json(
        {
          message: "Webhook procesado correctamente. Transaccion ya existia.",
          orden_id: ordenId,
          estado: estadoPago,
        },
        { status: 200 }
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
