"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useParams, useRouter } from "next/navigation";
import { useClerk, useUser } from "@clerk/nextjs";
import { DetailTile, MetricCard, SplitHero } from "../../components/design";

function PaymentMessage({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f6f1e7] px-6">
      <section className="max-w-md rounded-2xl border border-[#d9ddcf] bg-[#fffdf8] p-8 text-center shadow-[0_24px_70px_rgba(55,65,61,0.12)]">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#b3b68d]/25 text-2xl font-semibold text-[#515922]">
          !
        </div>

        <h1 className="text-2xl font-semibold text-[#37413d]">{title}</h1>

        <p className="mt-3 leading-7 text-[#6f7f6d]">{description}</p>

        {action}
      </section>
    </main>
  );
}

export default function PagoPage() {
  const params = useParams();
  const router = useRouter();
  const ordenId = params.orden_id as string;

  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();

  const [cargando, setCargando] = useState(false);
  const [mensajeError, setMensajeError] = useState<string | null>(null);

  const orden = {
    orden_id: ordenId,
    comprador_id: "user_3DRaFo6JeyL5La245RLPa5SjHP5",
    vendedor_id: "vend_1",
    producto: {
      titulo: "Campera Vintage Denim",
      precio: 1,
    },
    envio: 3,
  };

  const total = orden.producto.precio + orden.envio;
  const signInUrl = `/sign-in?redirect_url=${encodeURIComponent(
    `/pago/${ordenId}`
  )}`;

  useEffect(() => {
    if (isLoaded && !user) {
      router.push(signInUrl);
    }
  }, [isLoaded, router, signInUrl, user]);

  if (!isLoaded) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f6f1e7]">
        <p className="text-[#37413d]">Cargando...</p>
      </main>
    );
  }

  if (!user) {
    return null;
  }

  if (user.id !== orden.comprador_id) {
    return (
      <PaymentMessage
        title="No tenés permiso para pagar esta orden"
        description="Esta orden pertenece a otro comprador."
        action={
          <button
            onClick={async () => {
              await signOut({
                redirectUrl: signInUrl,
              });
            }}
            className="mt-6 w-full rounded-xl bg-[#8fa18d] px-5 py-3 font-semibold text-white shadow-[0_12px_30px_rgba(143,161,141,0.35)] transition hover:bg-[#7d907b]"
          >
            Cerrar sesión e ingresar con otro usuario
          </button>
        }
      />
    );
  }

  if (mensajeError) {
    return (
      <PaymentMessage
        title="No se pudo continuar con el pago"
        description={mensajeError}
        action={
          <button
            onClick={() => setMensajeError(null)}
            className="mt-6 w-full rounded-xl bg-[#8fa18d] px-5 py-3 font-semibold text-white shadow-[0_12px_30px_rgba(143,161,141,0.35)] transition hover:bg-[#7d907b]"
          >
            Volver a intentar
          </button>
        }
      />
    );
  }

  async function pagar() {
    try {
      setCargando(true);
      setMensajeError(null);

      const pagoRes = await fetch("/api/pagos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orden_id: orden.orden_id,
          comprador_id: orden.comprador_id,
          vendedor_id: orden.vendedor_id,
          monto_producto: orden.producto.precio,
          monto_envio: orden.envio,
          metodo_pago_id: "8b18b150-269f-44bb-870c-c9fabc0543fc",
        }),
      });

      const pagoData = await pagoRes.json();

      if (!pagoRes.ok) {
        setMensajeError(
          pagoData.error ||
            "No pudimos registrar el pago. Revisá la orden e intentá nuevamente."
        );
        return;
      }

      const mpRes = await fetch("/api/mercadopago/preferencia", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orden_id: orden.orden_id,
          titulo: orden.producto.titulo,
          monto_total: total,
          comprador_email: "test_user_503484223242855649@testuser.com",
        }),
      });

      const mpData = await mpRes.json();

      if (!mpRes.ok) {
        setMensajeError(
          mpData.error ||
            "No pudimos abrir Mercado Pago. Intentá nuevamente en unos segundos."
        );
        return;
      }

      window.location.assign(mpData.sandbox_init_point);
    } catch (error) {
      console.error(error);
      setMensajeError("Ocurrió un error inesperado. Intentá nuevamente.");
    } finally {
      setCargando(false);
    }
  }

  return (
    <SplitHero
      eyebrow="Lama Payments"
      title="Confirmá tu pago"
      description="Revisá el detalle de la orden antes de continuar. El cobro se procesa con Mercado Pago en un entorno seguro."
      note="Tu pago queda registrado en Payments App para que comprador y vendedor puedan consultar el estado."
    >
      <div className="rounded-2xl border border-[#d9ddcf] bg-white p-5 shadow-[0_14px_35px_rgba(55,65,61,0.08)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6f7f6d]">
              Resumen de orden
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-[#37413d]">
              {orden.orden_id}
            </h2>
          </div>
          <span className="rounded-full bg-[#b3b68d]/25 px-3 py-1 text-sm font-medium text-[#515922]">
            pendiente
          </span>
        </div>

        <div className="my-5 border-t border-dashed border-[#d9ddcf]" />

        <DetailTile label="Producto" value={orden.producto.titulo} />

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <MetricCard
            label="Precio producto"
            value={`$${orden.producto.precio.toLocaleString("es-AR")}`}
          />
          <MetricCard
            label="Envío"
            value={`$${orden.envio.toLocaleString("es-AR")}`}
          />
        </div>

        <div className="mt-4 rounded-2xl border border-[#b3b68d]/50 bg-[#b3b68d]/20 p-5">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-sm text-[#6f7f6d]">Total a pagar</p>
              <p className="mt-1 text-4xl font-semibold text-[#37413d]">
                ${total.toLocaleString("es-AR")}
              </p>
            </div>
            <div className="hidden rounded-xl bg-white/65 px-4 py-3 text-right sm:block">
              <p className="text-xs text-[#6f7f6d]">Proveedor</p>
              <p className="font-semibold text-[#37413d]">Mercado Pago</p>
            </div>
          </div>
        </div>

        <button
          onClick={pagar}
          disabled={cargando}
          className="mt-5 w-full rounded-xl bg-[#8fa18d] px-5 py-4 text-lg font-semibold text-white shadow-[0_12px_30px_rgba(143,161,141,0.35)] transition hover:bg-[#7d907b] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {cargando ? "Procesando pago..." : "Pagar con Mercado Pago"}
        </button>

        <p className="mt-4 text-center text-sm text-[#6f7f6d]">
          Vas a salir momentáneamente de LAMA para completar el pago.
        </p>
      </div>
    </SplitHero>
  );
}
