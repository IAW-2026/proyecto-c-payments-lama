import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { supabase } from "@/lib/supabase";

function toRoleList(value: unknown) {
  if (Array.isArray(value)) {
    return value.map(String);
  }

  return typeof value === "string" ? [value] : [];
}

function obtenerTexto(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function GET(req: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json(
      { error: "Debes iniciar sesion para consultar pagos" },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(req.url);

  const rol = searchParams.get("rol");

  if (
    !rol ||
    !["comprador", "vendedor", "super_admin"].includes(rol)
  ) {
    return NextResponse.json(
      { error: "Rol inválido. Usar comprador, vendedor o super_admin" },
      { status: 400 }
    );
  }

  let query = supabase
    .from("pago")
    .select("*")
    .order("fecha_creacion", { ascending: false });

  if (rol === "comprador") {
    query = query.eq("comprador_id", userId);
  }

  if (rol === "vendedor") {
    query = query.eq("vendedor_id", userId);
  }

  if (rol === "super_admin") {
    const user = await currentUser();
    const roles = [
      ...toRoleList(user?.publicMetadata.roles),
      ...toRoleList(user?.publicMetadata.role),
      ...toRoleList(user?.unsafeMetadata.roles),
      ...toRoleList(user?.unsafeMetadata.role),
    ];
    const esSuperadmin = roles.includes("super_admin");

    if (!esSuperadmin) {
      return NextResponse.json(
        { error: "No tenes permiso para consultar todos los pagos" },
        { status: 403 }
      );
    }
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  const pagoIds = (data || []).map((pago) => pago.pago_id);

  if (pagoIds.length === 0) {
    return NextResponse.json(data, { status: 200 });
  }

  const { data: liberaciones, error: errorLiberaciones } = await supabase
    .from("transaccion_de_pago")
    .select("pago_id")
    .in("pago_id", pagoIds)
    .eq("tipo_transaccion", "liberacion_vendedor")
    .eq("estado", "aprobado");

  if (errorLiberaciones) {
    return NextResponse.json(
      { error: errorLiberaciones.message },
      { status: 500 }
    );
  }

  const pagosLiquidados = new Set(
    (liberaciones || []).map((transaccion) => transaccion.pago_id)
  );
  const pagosConLiquidacion = data.map((pago) => ({
    ...pago,
    liquidado: pagosLiquidados.has(pago.pago_id),
  }));

  return NextResponse.json(pagosConLiquidacion, { status: 200 });
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Debes iniciar sesion para registrar un pago" },
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
      monto_producto,
      monto_envio = 0,
      monto_total,
    } = body;

    if (
      !orden_id ||
      !comprador_id ||
      !comprador_nombre ||
      !comprador_email ||
      !vendedor_id
    ) {
      return NextResponse.json(
        {
          error:
            "Faltan campos obligatorios: orden_id, comprador y vendedor_id",
        },
        { status: 400 }
      );
    }

    if (comprador_id !== userId) {
      return NextResponse.json(
        { error: "No podes registrar un pago para otro comprador" },
        { status: 403 }
      );
    }

    if (typeof monto_producto !== "number" || monto_producto <= 0) {
      return NextResponse.json(
        { error: "monto_producto debe ser un número positivo" },
        { status: 400 }
      );
    }

    if (typeof monto_envio !== "number" || monto_envio < 0) {
      return NextResponse.json(
        { error: "monto_envio debe ser un número mayor o igual a 0" },
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

    if (pagoExistente.data) {
      return NextResponse.json(
        { error: "Ya existe un pago para esta orden" },
        { status: 409 }
      );
    }

    const porcentajeComision = 0.1;

    const comision = monto_producto * porcentajeComision;
    const monto_neto = monto_producto - comision;
    const montoTotalCalculado = monto_producto + monto_envio;

    if (
      monto_total !== undefined &&
      (typeof monto_total !== "number" || monto_total !== montoTotalCalculado)
    ) {
      return NextResponse.json(
        { error: "monto_total debe coincidir con producto + envio" },
        { status: 400 }
      );
    }

    const { error } = await supabase
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

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return new NextResponse(null, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
