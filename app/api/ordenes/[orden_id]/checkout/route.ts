import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

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

function obtenerTexto(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function obtenerNumero(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function normalizarOrden(data: OrdenCheckoutBuyer, ordenId: string) {
  const orden_id = obtenerTexto(data.orden_id) || ordenId;
  const comprador_id = obtenerTexto(data.comprador?.comprador_id);
  const comprador_nombre = obtenerTexto(data.comprador?.nombre);
  const comprador_email = obtenerTexto(data.comprador?.email);
  const vendedor_id = obtenerTexto(data.vendedor_id);
  const producto_titulo =
    obtenerTexto(data.producto?.titulo) ||
    obtenerTexto(data.titulo) ||
    "Producto de la orden";
  const monto_producto =
    obtenerNumero(data.producto?.precio) ?? obtenerNumero(data.monto_producto);
  const monto_envio = obtenerNumero(data.monto_envio) ?? 0;
  const monto_total =
    obtenerNumero(data.monto_total) ??
    (monto_producto === null ? null : monto_producto + monto_envio);
  const errores = [];

  if (!orden_id) errores.push("orden_id");
  if (!comprador_id) errores.push("comprador.comprador_id");
  if (!comprador_nombre) errores.push("comprador.nombre");
  if (!comprador_email) errores.push("comprador.email");
  if (!vendedor_id) errores.push("vendedor_id");
  if (monto_producto === null || monto_producto <= 0) {
    errores.push("monto_producto o producto.precio");
  }
  if (monto_envio < 0) errores.push("monto_envio");
  if (monto_total === null) errores.push("monto_total");

  if (errores.length > 0) {
    return { orden: null, errores };
  }

  return {
    orden: {
      orden_id,
      comprador: {
        comprador_id,
        nombre: comprador_nombre,
        email: comprador_email,
      },
      vendedor_id,
      producto_titulo,
      monto_producto,
      monto_envio,
      monto_total,
    },
    errores: [],
  };
}

export async function GET(
  _req: NextRequest,
  context: RouteContext<"/api/ordenes/[orden_id]/checkout">
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json(
      { error: "Debes iniciar sesion para consultar la orden" },
      { status: 401 }
    );
  }

  const buyerAppUrl = (
    process.env.BUYER_APP_URL ||
    "https://proyecto-c-buyer2-lama.vercel.app"
  ).replace(/\/$/, "");

  const { orden_id } = await context.params;
  const headers: HeadersInit = {
    Accept: "application/json",
  };

  if (process.env.BUYER_APP_API_KEY) {
    headers.Authorization = `Bearer ${process.env.BUYER_APP_API_KEY}`;
  }

  const buyerRes = await fetch(
    `${buyerAppUrl}/api/ordenes/${encodeURIComponent(orden_id)}/checkout`,
    {
      headers,
      cache: "no-store",
    }
  );
  const data = await buyerRes.json().catch(() => null);

  if (!buyerRes.ok) {
    return NextResponse.json(
      {
        error:
          data?.error ||
          "Buyer App no pudo devolver los datos de la orden",
      },
      { status: buyerRes.status }
    );
  }

  const { orden, errores } = normalizarOrden(data, orden_id);

  if (!orden) {
    return NextResponse.json(
      {
        error: "Buyer App devolvio una orden incompleta o invalida",
        campos_faltantes_o_invalidos: errores,
        respuesta_buyer: data,
      },
      { status: 502 }
    );
  }

  if (orden.comprador.comprador_id !== userId) {
    return NextResponse.json(
      { error: "Esta orden pertenece a otro comprador" },
      { status: 403 }
    );
  }

  return NextResponse.json(orden, { status: 200 });
}
