import { NextRequest, NextResponse } from "next/server";
import {
  obtenerApiKeyServicio,
  validarApiKeyServicio,
} from "@/lib/api-keys";
import { supabase } from "@/lib/supabase";

const SELLER_APP_URL =
  (
    process.env.SELLER_APP_URL || "https://proyecto-c-seller-lama.vercel.app"
  ).replace(/\/$/, "");
const SELLER_APP_API_KEY = obtenerApiKeyServicio("seller");
const SHIPPING_APP_URL = (
  process.env.SHIPPING_APP_URL || "https://proyecto-c-shipping-lama.vercel.app"
).replace(/\/$/, "");
const SHIPPING_APP_API_KEY = obtenerApiKeyServicio("shipping");

async function patchJson({
  url,
  apiKey,
  body,
  appName,
}: {
  url: string;
  apiKey?: string | null;
  body: Record<string, unknown>;
  appName: string;
}) {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (apiKey) {
    headers.Authorization = `Bearer ${apiKey}`;
  }

  const res = await fetch(url, {
    method: "PATCH",
    headers,
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => null);

  if (!res.ok) {
    console.error(`${appName} rechazo la liquidacion:`, {
      status: res.status,
      response: data,
    });

    throw new Error(`No se pudo notificar la liquidacion a ${appName}`);
  }

  return data;
}

async function notificarLiquidacionVendedor({
  ordenId,
  fechaActualizacion,
}: {
  ordenId: string;
  fechaActualizacion: string;
}) {
  return patchJson({
    url: `${SELLER_APP_URL}/api/ordenes/${encodeURIComponent(
      ordenId
    )}/liquidacion-vendedor`,
    apiKey: SELLER_APP_API_KEY,
    appName: "Seller App",
    body: {
      fecha_actualizacion: fechaActualizacion,
    },
  });
}

async function notificarLiquidacionLogistico({
  ordenId,
  fechaActualizacion,
}: {
  ordenId: string;
  fechaActualizacion: string;
}) {
  return patchJson({
    url: `${SHIPPING_APP_URL}/api/envios/orden/${encodeURIComponent(
      ordenId
    )}/liquidacion-logistico`,
    apiKey: SHIPPING_APP_API_KEY,
    appName: "Shipping App",
    body: {
      "fecha_actualización": fechaActualizacion,
    },
  });
}

async function notificarLiquidacionesExternas({
  ordenId,
  fechaActualizacion,
}: {
  ordenId: string;
  fechaActualizacion: string;
}) {
  const [seller, shipping] = await Promise.allSettled([
    notificarLiquidacionVendedor({ ordenId, fechaActualizacion }),
    notificarLiquidacionLogistico({ ordenId, fechaActualizacion }),
  ]);

  return {
    seller:
      seller.status === "fulfilled"
        ? { ok: true, data: seller.value }
        : { ok: false, error: obtenerMensajeError(seller.reason) },
    shipping:
      shipping.status === "fulfilled"
        ? { ok: true, data: shipping.value }
        : { ok: false, error: obtenerMensajeError(shipping.reason) },
  };
}

function obtenerMensajeError(error: unknown) {
  return error instanceof Error ? error.message : "Error desconocido";
}

export async function POST(req: NextRequest) {
  try {
    const apiKey = validarApiKeyServicio(req, ["shipping"]);

    if (apiKey.response) {
      return apiKey.response;
    }

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

    const { data: transaccionesExistentes } = await supabase
      .from("transaccion_de_pago")
      .select("*")
      .eq("pago_id", pago.pago_id)
      .eq("tipo_transaccion", "captura")
      .eq("estado", "aprobado")
      .in("transaccion_proveedor_id", [
        `VENDEDOR-${pago.vendedor_id}`,
        `ENVIO-${envio_id}`,
      ]);

    if (transaccionesExistentes && transaccionesExistentes.length > 0) {
      const fechaActualizacion = new Date().toISOString();
      const notificaciones = await notificarLiquidacionesExternas({
        ordenId: pago.orden_id,
        fechaActualizacion,
      });

      return NextResponse.json(
        {
          message:
            "Este pago ya estaba liberado. Se reintentaron las notificaciones externas",
          orden_id: pago.orden_id,
          envio_id,
          transacciones: transaccionesExistentes,
          notificaciones,
        },
        { status: 200 }
      );
    }

    const fechaActualizacion = new Date().toISOString();
    const transacciones = [
      {
        pago_id: pago.pago_id,
        tipo_transaccion: "captura",
        monto: pago.monto_neto,
        estado: "aprobado",
        transaccion_proveedor_id: `VENDEDOR-${pago.vendedor_id}`,
        codigo_proveedor: "ENVIO_ENTREGADO",
        mensaje_proveedor: `Pago liberado al vendedor ${pago.vendedor_id} luego de confirmarse la entrega ${envio_id}`,
      },
      {
        pago_id: pago.pago_id,
        tipo_transaccion: "captura",
        monto: pago.monto_envio,
        estado: "aprobado",
        transaccion_proveedor_id: `ENVIO-${envio_id}`,
        codigo_proveedor: "ENVIO_ENTREGADO",
        mensaje_proveedor: `Pago del envío liberado luego de confirmarse la entrega ${envio_id}`,
      },
    ];

    const { data, error: errorTransacciones } = await supabase
      .from("transaccion_de_pago")
      .insert(transacciones)
      .select();

    if (errorTransacciones) {
      return NextResponse.json(
        { error: errorTransacciones.message },
        { status: 500 }
      );
    }

    const notificaciones = await notificarLiquidacionesExternas({
      ordenId: pago.orden_id,
      fechaActualizacion,
    });

    return NextResponse.json(
      {
        message: "Fondos liberados correctamente",
        orden_id: pago.orden_id,
        envio_id,
        vendedor_id: pago.vendedor_id,
        monto_liberado_vendedor: pago.monto_neto,
        monto_liberado_envio: pago.monto_envio,
        transacciones: data,
        notificaciones,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error al liberar fondos:", error);

    return NextResponse.json(
      { error: "Error interno al liberar fondos" },
      { status: 500 }
    );
  }
}
