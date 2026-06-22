import { NextRequest, NextResponse } from "next/server";
import {
  obtenerMercadoPagoWebhookApiKey,
  obtenerApiKeyServicio,
  validarApiKeyServicio,
} from "@/lib/api-keys";
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

const SELLER_APP_URL =
  (
    process.env.SELLER_APP_URL || "https://proyecto-c-seller-lama.vercel.app"
  ).replace(/\/$/, "");
const SELLER_APP_API_KEY = obtenerApiKeyServicio("seller");

function mapearEstadoMercadoPago(status: string) {
  if (status === "approved") return "aprobado";
  if (status === "rejected") return "rechazado";
  if (status === "cancelled") return "cancelado";
  return "pendiente";
}

function mapearEstadoParaSellerApp(
  estadoPago: "pendiente" | "aprobado" | "rechazado" | "cancelado"
) {
  return estadoPago === "cancelado" ? "rechazado" : estadoPago;
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

  if (
    tipo.includes("merchant_order") ||
    body.resource?.includes("merchant_orders")
  ) {
    return "merchant_order";
  }

  if (tipo.includes("payment") || body.resource?.includes("payments")) {
    return "payment";
  }

  return tipo;
}

function esperar(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function obtenerMerchantOrderConPagos(merchantOrderId: string) {
  const intentos = 3;

  for (let intento = 1; intento <= intentos; intento++) {
    const merchantOrder = await merchantOrderClient.get({
      merchantOrderId,
    });

    console.log("Merchant order obtenida desde Mercado Pago:", {
      intento,
      id: merchantOrder.id,
      status: merchantOrder.status,
      order_status: merchantOrder.order_status,
      external_reference: merchantOrder.external_reference,
      payments: merchantOrder.payments,
    });

    if (merchantOrder.payments?.length) {
      return merchantOrder;
    }

    if (intento < intentos) {
      await esperar(1500);
    }
  }

  return null;
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

  const merchantOrder = await obtenerMerchantOrderConPagos(String(recursoId));

  const pagoPreferido =
    merchantOrder?.payments?.find((payment) =>
      ["approved", "pending", "in_process", "authorized"].includes(
        payment.status || ""
      )
    ) || merchantOrder?.payments?.find((payment) => payment.id);

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
  const estadoSeller = mapearEstadoParaSellerApp(estadoPago);
  const url = `${SELLER_APP_URL}/api/ordenes-ventas/${encodeURIComponent(
    ordenId
  )}/estado-pago`;
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (SELLER_APP_API_KEY) {
    headers.Authorization = `Bearer ${SELLER_APP_API_KEY}`;
  }

  const res = await fetch(url, {
    method: "PATCH",
    headers,
    body: JSON.stringify({
      estado_pago: estadoSeller,
      pago_id: pagoId,
      motivo: motivo || "Actualizacion recibida desde Payments App",
    }),
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    console.error("Seller App rechazo la actualizacion de pago:", {
      status: res.status,
      orden_id: ordenId,
      response: data,
    });

    throw new Error("No se pudo notificar el estado de pago a Seller App");
  }

  console.log("Seller App actualizada:", data);

  return data;
}

export async function POST(req: NextRequest) {
  try {
    const apiKey = validarApiKeyServicio(req, ["mercadopago"], {
      requerida: Boolean(obtenerMercadoPagoWebhookApiKey()),
    });

    if (apiKey.response) {
      return apiKey.response;
    }

    const body = (await req.json()) as WebhookMercadoPago;

    console.log("Webhook Mercado Pago recibido:", body);

    const mercadoPagoPaymentId = await obtenerPaymentIdDesdeWebhook(body);

    if (!mercadoPagoPaymentId) {
      console.log("Webhook recibido sin payment id:", body);

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
      .maybeSingle();

    if (errorPago) {
      console.log("Error actualizando pago:", {
        orden_id: ordenId,
        mercado_pago_payment_id: mercadoPagoPaymentId,
        error: errorPago,
      });

      return NextResponse.json({ error: errorPago.message }, { status: 500 });
    }

    if (!pagoActualizado) {
      console.log("No se encontro pago para actualizar desde webhook:", {
        orden_id: ordenId,
        mercado_pago_payment_id: mercadoPagoPaymentId,
        estado_mercado_pago: estadoMercadoPago,
      });

      return NextResponse.json(
        {
          error: "No se encontro un pago pendiente para esa orden",
          orden_id: ordenId,
        },
        { status: 404 }
      );
    }

    console.log("Pago actualizado:", pagoActualizado);

    try {
      await notificarSellerApp({
        ordenId,
        estadoPago,
        pagoId: pagoActualizado.pago_id,
        motivo: pagoMercadoPago.status_detail || undefined,
      });
    } catch (error) {
      console.error("Error notificando Seller App:", error);

      return NextResponse.json(
        { error: "No se pudo notificar el pago a Seller App" },
        { status: 502 }
      );
    }

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
