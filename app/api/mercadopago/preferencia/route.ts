import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import {
  obtenerMercadoPagoWebhookApiKey,
  obtenerPaymentsApiKey,
} from "@/lib/api-keys";
import { preferenceClient } from "@/lib/mercadopago";
import { supabase } from "@/lib/supabase";

const baseUrl =
  process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const buyerAppUrl = (
  process.env.BUYER_APP_URL || "https://proyecto-c-buyer2-lama.vercel.app"
).replace(/\/$/, "");

type OrdenCheckoutBuyer = {
  orden_id?: unknown;
  comprador?: {
    comprador_id?: unknown;
    nombre?: unknown;
    email?: unknown;
  };
  vendedor_id?: unknown;
  producto?: {
    titulo?: unknown;
    precio?: unknown;
  };
  titulo?: unknown;
  monto_producto?: unknown;
  monto_envio?: unknown;
  monto_total?: unknown;
};

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

function obtenerNumero(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function importesIguales(a: number, b: number) {
  return Math.round(a * 100) === Math.round(b * 100);
}

function normalizarOrden(data: OrdenCheckoutBuyer, ordenId: string) {
  const ordenIdRecibida = obtenerTexto(data.orden_id);
  const compradorId = obtenerTexto(data.comprador?.comprador_id);
  const compradorNombre = obtenerTexto(data.comprador?.nombre);
  const compradorEmail = obtenerTexto(data.comprador?.email);
  const vendedorId = obtenerTexto(data.vendedor_id);
  const titulo =
    obtenerTexto(data.producto?.titulo) ||
    obtenerTexto(data.titulo) ||
    "Producto de la orden";
  const montoProducto =
    obtenerNumero(data.producto?.precio) ?? obtenerNumero(data.monto_producto);
  const montoEnvio = obtenerNumero(data.monto_envio) ?? 0;
  const montoTotalInformado = obtenerNumero(data.monto_total);

  if (ordenIdRecibida && ordenIdRecibida !== ordenId) {
    return null;
  }

  if (
    !compradorId ||
    !compradorNombre ||
    !compradorEmail ||
    !vendedorId ||
    montoProducto === null ||
    montoProducto <= 0 ||
    montoEnvio < 0
  ) {
    return null;
  }

  const montoTotal = montoProducto + montoEnvio;

  if (
    montoTotalInformado !== null &&
    !importesIguales(montoTotalInformado, montoTotal)
  ) {
    return null;
  }

  return {
    ordenId,
    titulo,
    compradorId,
    compradorNombre,
    compradorEmail,
    vendedorId,
    montoProducto,
    montoEnvio,
    montoTotal,
  };
}

async function obtenerOrdenVerificada(ordenId: string) {
  const paymentsApiKey = obtenerPaymentsApiKey();

  if (!paymentsApiKey) {
    throw new Error("Falta configurar PAYMENTS_API_KEY");
  }

  const buyerRes = await fetch(
    `${buyerAppUrl}/api/ordenes/${encodeURIComponent(ordenId)}/checkout`,
    {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${paymentsApiKey}`,
      },
      cache: "no-store",
    }
  );
  const data = (await buyerRes.json().catch(() => null)) as
    | OrdenCheckoutBuyer
    | null;

  if (!buyerRes.ok) {
    return {
      orden: null,
      error:
        (data && "error" in data && obtenerTexto(data.error)) ||
        "Buyer App no pudo verificar la orden",
      status: buyerRes.status === 404 ? 404 : 502,
    };
  }

  const orden = data ? normalizarOrden(data, ordenId) : null;

  if (!orden) {
    return {
      orden: null,
      error: "Buyer App devolvio una orden incompleta o inconsistente",
      status: 502,
    };
  }

  return { orden, error: null, status: 200 };
}

function obtenerWebhookUrlMercadoPago() {
  const url = new URL(`${baseUrl}/api/mercadopago/webhook`);
  const apiKey = obtenerMercadoPagoWebhookApiKey();

  if (apiKey) {
    url.searchParams.set("api_key", apiKey);
  }

  return url.toString();
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
    const ordenId = obtenerTexto(body?.orden_id);

    if (!ordenId) {
      return NextResponse.json(
        { error: "Falta el identificador de la orden" },
        { status: 400 }
      );
    }

    const resultadoOrden = await obtenerOrdenVerificada(ordenId);

    if (!resultadoOrden.orden) {
      return NextResponse.json(
        { error: resultadoOrden.error },
        { status: resultadoOrden.status }
      );
    }

    const orden = resultadoOrden.orden;

    if (orden.compradorId !== userId) {
      return NextResponse.json(
        { error: "Esta orden pertenece a otro comprador" },
        { status: 403 }
      );
    }

    const pagoExistente = await supabase
      .from("pago")
      .select(
        "pago_id, comprador_id, vendedor_id, monto_producto, monto_envio, monto_total, moneda, estado"
      )
      .eq("orden_id", ordenId)
      .maybeSingle();

    if (pagoExistente.error) {
      return NextResponse.json(
        { error: pagoExistente.error.message },
        { status: 500 }
      );
    }

    if (pagoExistente.data) {
      const pago = pagoExistente.data;
      const coincideConOrden =
        pago.comprador_id === orden.compradorId &&
        pago.vendedor_id === orden.vendedorId &&
        pago.moneda === "ARS" &&
        importesIguales(pago.monto_producto, orden.montoProducto) &&
        importesIguales(pago.monto_envio, orden.montoEnvio) &&
        importesIguales(pago.monto_total, orden.montoTotal);

      if (!coincideConOrden) {
        return NextResponse.json(
          {
            error:
              "El pago registrado no coincide con los datos oficiales de la orden",
          },
          { status: 409 }
        );
      }

      if (["aprobado", "cancelado"].includes(pago.estado)) {
        return NextResponse.json(
          { error: `No se puede iniciar el pago porque ya esta ${pago.estado}` },
          { status: 409 }
        );
      }
    } else {
      const porcentajeComision = 0.1;
      const comision = orden.montoProducto * porcentajeComision;
      const montoNeto = orden.montoProducto - comision;

      const { error: errorPago } = await supabase
        .from("pago")
        .insert([
          {
            orden_id: orden.ordenId,
            comprador_id: orden.compradorId,
            comprador_nombre: orden.compradorNombre,
            comprador_email: orden.compradorEmail,
            vendedor_id: orden.vendedorId,
            monto_producto: orden.montoProducto,
            monto_envio: orden.montoEnvio,
            comision,
            monto_neto: montoNeto,
            monto_total: orden.montoTotal,
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
    const notificationUrl = obtenerWebhookUrlMercadoPago();

    console.log("Notification URL enviada a Mercado Pago:", {
      url: `${baseUrl}/api/mercadopago/webhook`,
      protegida_con_api_key: Boolean(obtenerMercadoPagoWebhookApiKey()),
    });
    console.log("Orden enviada a Mercado Pago:", {
      orden_id: orden.ordenId,
      monto_total: orden.montoTotal,
      monto_producto: orden.montoProducto,
      monto_envio: orden.montoEnvio,
    });

    const preference = await preferenceClient.create({
      body: {
        items: [
          {
            id: orden.ordenId,
            title: orden.titulo,
            quantity: 1,
            unit_price: orden.montoTotal,
            currency_id: "ARS",
          },
        ],

        payer: {
          email: orden.compradorEmail,
        },

        external_reference: orden.ordenId,

        metadata: {
          orden_id: orden.ordenId,
        },

        back_urls: {
          success: buyerAppUrl,
          failure: buyerAppUrl,
          pending: buyerAppUrl,
        },

        notification_url: notificationUrl,
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
