import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
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
      .in("tipo_transaccion", ["liberacion_vendedor", "pago_envio"]);

    if (transaccionesExistentes && transaccionesExistentes.length > 0) {
      return NextResponse.json(
        {
          error: "Este pago ya fue liberado anteriormente",
          transacciones: transaccionesExistentes,
        },
        { status: 409 }
      );
    }

    const transacciones = [
      {
        pago_id: pago.pago_id,
        tipo_transaccion: "liberacion_vendedor",
        monto: pago.monto_neto,
        estado: "aprobado",
        transaccion_proveedor_id: `VENDEDOR-${pago.vendedor_id}`,
        codigo_proveedor: "ENVIO_ENTREGADO",
        mensaje_proveedor: `Pago liberado al vendedor ${pago.vendedor_id} luego de confirmarse la entrega ${envio_id}`,
      },
      {
        pago_id: pago.pago_id,
        tipo_transaccion: "pago_envio",
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

    return NextResponse.json(
      {
        message: "Fondos liberados correctamente",
        orden_id: pago.orden_id,
        envio_id,
        vendedor_id: pago.vendedor_id,
        monto_liberado_vendedor: pago.monto_neto,
        monto_liberado_envio: pago.monto_envio,
        transacciones: data,
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