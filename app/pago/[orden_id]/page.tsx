"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useParams, useRouter } from "next/navigation";
import { useClerk, useUser } from "@clerk/nextjs";

type OrdenCheckout = {
  orden_id: string;
  comprador: {
    comprador_id: string;
    nombre: string;
    email: string;
  };
  vendedor_id: string;
  producto_titulo: string;
  monto_producto: number;
  monto_envio: number;
  monto_total: number;
};

function formatMoney(value: number) {
  return `$${value.toLocaleString("es-AR")}`;
}

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
    <main className="lama-home relative grid min-h-screen place-items-center overflow-hidden bg-[#17211f] px-6 text-white">
      <div className="lama-hero-image absolute inset-0 opacity-45" />
      <div className="absolute inset-0 bg-[#17211f]/84" />
      <div className="lama-grain absolute inset-0 opacity-[0.1]" />

      <section className="relative max-w-md rounded-3xl border border-white/12 bg-white/[0.08] p-8 text-center shadow-[0_24px_70px_rgba(0,0,0,0.3)] backdrop-blur-xl">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-[#a8bba0]/35 bg-[#a8bba0]/18 text-2xl font-black text-[#d8e5d2]">
          !
        </div>

        <p className="mt-6 text-xs font-black uppercase tracking-[0.32em] text-[#b7c8af]">
          LAMA Payments
        </p>
        <h1 className="mt-3 text-3xl font-black">{title}</h1>
        <p className="mt-4 leading-7 text-white/70">{description}</p>

        {action}
      </section>
    </main>
  );
}

function DetailBox({
  label,
  value,
  dark = false,
}: {
  label: string;
  value: ReactNode;
  dark?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl px-4 py-3 ${dark ? "bg-[#17211f] text-white" : "bg-[#f6f1e7] text-[#37413d]"}`}
    >
      <p
        className={`text-xs font-bold uppercase tracking-[0.16em] ${dark ? "text-[#b7c8af]" : "text-[#6f7f6d]"}`}
      >
        {label}
      </p>
      <div className="mt-2 font-black">{value}</div>
    </div>
  );
}

export default function PagoPage() {
  const params = useParams();
  const router = useRouter();
  const ordenId = params.orden_id as string;
  const redirectPath = `/pago/${ordenId}`;

  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();

  const [cargando, setCargando] = useState(false);
  const [cargandoOrden, setCargandoOrden] = useState(false);
  const [mensajeError, setMensajeError] = useState<string | null>(null);
  const [orden, setOrden] = useState<OrdenCheckout | null>(null);

  const total = orden?.monto_total || 0;
  const signInUrl = `/sign-in?redirect_url=${encodeURIComponent(
    redirectPath
  )}`;

  useEffect(() => {
    if (isLoaded && !user) {
      router.push(signInUrl);
    }
  }, [isLoaded, router, signInUrl, user]);

  useEffect(() => {
    if (!isLoaded || !user || !orden) {
      return;
    }

    if (user.id !== orden.comprador.comprador_id) {
      signOut({
        redirectUrl: signInUrl,
      });
    }
  }, [isLoaded, orden, signInUrl, signOut, user]);

  useEffect(() => {
    if (!isLoaded || !user) {
      return;
    }

    let cancelado = false;

    async function cargarOrden() {
      try {
        setCargandoOrden(true);
        setMensajeError(null);

        const res = await fetch(
          `/api/ordenes/${encodeURIComponent(ordenId)}/checkout`
        );
        const data = await res.json().catch(() => null);

        if (!res.ok) {
          if (res.status === 403) {
            await signOut({
              redirectUrl: `/sign-in?redirect_url=${encodeURIComponent(
                redirectPath
              )}`,
            });
            return;
          }

          setMensajeError(
            data?.error ||
              "No pudimos obtener los datos de la orden desde Buyer App."
          );
          return;
        }

        if (!cancelado) {
          setOrden(data as OrdenCheckout);
        }
      } catch (error) {
        console.error(error);
        setMensajeError("Ocurrió un error al buscar los datos de la orden.");
      } finally {
        if (!cancelado) {
          setCargandoOrden(false);
        }
      }
    }

    cargarOrden();

    return () => {
      cancelado = true;
    };
  }, [isLoaded, ordenId, redirectPath, signOut, user]);

  if (!isLoaded || cargandoOrden) {
    return (
      <main className="lama-home relative grid min-h-screen place-items-center overflow-hidden bg-[#17211f] text-white">
        <div className="lama-hero-image absolute inset-0 opacity-45" />
        <div className="absolute inset-0 bg-[#17211f]/82" />
        <div className="relative rounded-3xl border border-white/12 bg-white/[0.08] px-8 py-6 text-center shadow-[0_24px_70px_rgba(0,0,0,0.3)] backdrop-blur-xl">
          <p className="text-xs font-black uppercase tracking-[0.34em] text-[#b7c8af]">
            LAMA Payments
          </p>
          <p className="mt-3 text-xl font-black">Cargando pago...</p>
        </div>
      </main>
    );
  }

  if (!user) {
    return null;
  }

  if (!orden && !mensajeError) {
    return null;
  }

  if (!orden && mensajeError) {
    return (
      <PaymentMessage
        title="No se pudo cargar la orden"
        description={mensajeError}
        action={
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-6 w-full rounded-full bg-[#a8bba0] px-6 py-4 font-black text-[#17211f] shadow-[0_22px_58px_rgba(168,187,160,0.26)] transition hover:-translate-y-0.5 hover:bg-[#c1d0ba]"
          >
            Volver a intentar
          </button>
        }
      />
    );
  }

  if (!orden) {
    return null;
  }

  if (user.id !== orden.comprador.comprador_id) {
    return null;
  }

  if (mensajeError) {
    return (
      <PaymentMessage
        title="No se pudo continuar con el pago"
        description={mensajeError}
        action={
          <button
            type="button"
            onClick={() => setMensajeError(null)}
            className="mt-6 w-full rounded-full bg-[#a8bba0] px-6 py-4 font-black text-[#17211f] shadow-[0_22px_58px_rgba(168,187,160,0.26)] transition hover:-translate-y-0.5 hover:bg-[#c1d0ba]"
          >
            Volver a intentar
          </button>
        }
      />
    );
  }

  async function pagar() {
    if (!user) {
      router.push(signInUrl);
      return;
    }

    if (!orden) {
      setMensajeError("No se cargaron los datos de la orden.");
      return;
    }

    try {
      setCargando(true);
      setMensajeError(null);

      const mpRes = await fetch("/api/mercadopago/preferencia", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orden_id: orden.orden_id,
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

      const checkoutUrl =
        mpData.checkout_url || mpData.init_point || mpData.sandbox_init_point;

      if (!checkoutUrl) {
        setMensajeError(
          "Mercado Pago no devolviÃ³ una URL de checkout. IntentÃ¡ nuevamente."
        );
        return;
      }

      window.location.assign(checkoutUrl);
    } catch (error) {
      console.error(error);
      setMensajeError("Ocurrió un error inesperado. Intentá nuevamente.");
    } finally {
      setCargando(false);
    }
  }

  return (
    <main className="lama-home relative min-h-screen overflow-x-hidden bg-[#17211f] text-white">
      <div className="lama-hero-image absolute inset-0 opacity-48" />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(23,33,31,0.97)_0%,rgba(23,33,31,0.88)_48%,rgba(23,33,31,0.48)_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_18%,rgba(168,187,160,0.22),transparent_28%),radial-gradient(circle_at_76%_24%,rgba(0,158,227,0.12),transparent_24%),linear-gradient(180deg,rgba(10,14,13,0.02),rgba(10,14,13,0.74))]" />
      <div className="lama-grain absolute inset-0 opacity-[0.1]" />
      <div className="lama-scan absolute inset-x-0 top-0 h-28" />

      <header className="relative z-20 flex items-center justify-between px-5 py-5 sm:px-8 lg:px-12">
        <Link href="/" className="group flex items-center gap-3">
          <span className="text-3xl font-black tracking-[0.22em] text-white sm:text-4xl">
            LAMA
          </span>
          <span className="rounded-md border border-white/24 px-2 py-1 text-[0.65rem] font-bold uppercase tracking-[0.22em] text-white/60 transition group-hover:border-[#a8bba0] group-hover:text-[#c7d7bf]">
            payments
          </span>
        </Link>

        <span className="rounded-full border border-white/16 bg-white/5 px-5 py-3 text-sm font-black text-white/74 backdrop-blur">
          Mercado Pago
        </span>
      </header>

      <section className="relative z-10 grid min-h-[calc(100vh-88px)] gap-8 px-5 pb-10 sm:px-8 lg:px-12 2xl:grid-cols-[0.9fr_1.1fr]">
        <div className="flex flex-col justify-center">
          <div className="lama-kicker flex items-center gap-4 text-xs font-black uppercase tracking-[0.48em] text-[#b7c8af] sm:text-sm">
            <span className="h-px w-14 bg-[#b7c8af]/70" />
            Checkout seguro
          </div>

          <h1 className="mt-7 max-w-3xl text-[clamp(3.1rem,6.6vw,7rem)] font-black leading-[0.92] tracking-normal">
            Confirmá
            <span className="block text-[#a8bba0]">tu pago</span>
          </h1>

          <p className="mt-7 max-w-2xl text-lg font-medium leading-8 text-white/72 sm:text-xl sm:leading-9">
            Revisá la orden antes de continuar. El pago se registra en LAMA
            Payments y se completa con Mercado Pago.
          </p>

          <div className="mt-9 grid max-w-2xl grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/12 bg-white/[0.08] px-5 py-5 shadow-[0_18px_58px_rgba(0,0,0,0.22)] backdrop-blur-xl">
              <p className="text-3xl font-black text-white">
                {formatMoney(orden.monto_producto)}
              </p>
              <p className="mt-2 text-xs font-bold uppercase tracking-[0.2em] text-white/48">
                Producto
              </p>
            </div>
            <div className="rounded-2xl border border-white/12 bg-white/[0.08] px-5 py-5 shadow-[0_18px_58px_rgba(0,0,0,0.22)] backdrop-blur-xl">
              <p className="text-3xl font-black text-white">
                {formatMoney(orden.monto_envio)}
              </p>
              <p className="mt-2 text-xs font-bold uppercase tracking-[0.2em] text-white/48">
                Envío
              </p>
            </div>
            <div className="rounded-2xl border border-[#a8bba0]/24 bg-[#a8bba0]/14 px-5 py-5 shadow-[0_18px_58px_rgba(0,0,0,0.22)] backdrop-blur-xl">
              <p className="text-3xl font-black text-[#d8e5d2]">
                {formatMoney(total)}
              </p>
              <p className="mt-2 text-xs font-bold uppercase tracking-[0.2em] text-[#b7c8af]">
                Total
              </p>
            </div>
          </div>
        </div>

        <div className="relative flex items-center">
          <div className="lama-orbit absolute right-[5%] top-[8%] hidden h-[520px] w-[520px] rounded-full border border-white/10 lg:block" />
          <div className="lama-orbit lama-orbit-two absolute right-[20%] top-[20%] hidden h-[350px] w-[350px] rounded-full border border-[#a8bba0]/18 lg:block" />

          <div className="relative w-full rounded-[2rem] border border-white/12 bg-[#f6f1e7]/95 p-4 text-[#17211f] shadow-[0_34px_100px_rgba(0,0,0,0.34)] backdrop-blur-xl sm:p-6">
            <div className="flex flex-col gap-4 border-b border-[#d9ddcf] pb-5 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.24em] text-[#6f7f6d]">
                  Resumen de orden
                </p>
                <h2 className="mt-2 break-all text-3xl font-black text-[#17211f]">
                  {orden.orden_id}
                </h2>
              </div>

              <span className="w-fit rounded-full bg-[#d8ccb8]/55 px-4 py-2 text-sm font-black text-[#515922]">
                pendiente
              </span>
            </div>

            <div className="mt-5 grid gap-3">
              <DetailBox label="Producto" value={orden.producto_titulo} />

              <div className="grid gap-3 sm:grid-cols-2">
                <DetailBox
                  label="Precio producto"
                  value={formatMoney(orden.monto_producto)}
                />
                <DetailBox
                  label="Envío"
                  value={formatMoney(orden.monto_envio)}
                />
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <DetailBox
                  label="Total a pagar"
                  value={
                    <span className="text-4xl font-black">
                      {formatMoney(total)}
                    </span>
                  }
                  dark
                />
                <DetailBox label="Proveedor" value="Mercado Pago" />
              </div>
            </div>

            <button
              type="button"
              onClick={pagar}
              disabled={cargando}
              className="mt-5 w-full rounded-full bg-[#a8bba0] px-6 py-5 text-lg font-black text-[#17211f] shadow-[0_22px_58px_rgba(168,187,160,0.3)] transition hover:-translate-y-1 hover:bg-[#c1d0ba] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {cargando ? "Procesando pago..." : "Pagar con Mercado Pago"}
            </button>

            <p className="mt-4 text-center text-sm font-semibold text-[#6f7f6d]">
              Vas a salir momentáneamente de LAMA para completar el pago.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
