"use client";

import { useState } from "react";
import { useParams } from "next/navigation";

const baseUrl =
  process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export default function PagoPage() {
  const params = useParams();
  const ordenId = params.orden_id as string;

  const [cargando, setCargando] = useState(false);

  const orden = {
    orden_id: ordenId,
    comprador_id: "comp_1",
    vendedor_id: "vend_1",
    producto: {
      titulo: "Campera Vintage Denim",
      precio: 25000,
    },
    envio: 3500,
  };

  const total = orden.producto.precio + orden.envio;

  async function pagar() {
    try {
      setCargando(true);

      const pagoRes = await fetch(`${baseUrl}/api/pagos`, {
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
        alert(pagoData.error || "Error al crear el pago");
        return;
      }

      const mpRes = await fetch(`${baseUrl}/api/mercadopago/preferencia`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orden_id: orden.orden_id,
          titulo: orden.producto.titulo,
          monto_total: total,
          comprador_email: "test_user_7906625558558336324@testuser.com",
        }),
      });

      const mpData = await mpRes.json();

      if (!mpRes.ok) {
        alert(mpData.error || "Error al crear preferencia MP");
        return;
      }

      window.location.href = mpData.sandbox_init_point;
    } catch (error) {
      console.error(error);
      alert("Error inesperado");
    } finally {
      setCargando(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f6f1e7] px-6 py-8">
      <section className="mx-auto max-w-4xl overflow-hidden rounded-[32px] bg-white shadow-xl">
        <div className="relative bg-[#8fa18d] px-8 py-10 text-white">
          <div className="absolute right-[-80px] top-[-80px] h-56 w-56 rounded-full bg-[#b3b68d]/40" />

          <div className="relative z-10">
            <p className="text-sm uppercase tracking-wide text-[#eef0ea]">
              Payments App
            </p>

            <h1 className="mt-2 text-4xl font-bold">Confirmar pago</h1>

            <p className="mt-3 text-[#eef0ea]">
              Revisá el resumen antes de continuar con el pago.
            </p>
          </div>
        </div>

        <div className="px-8 py-8">
          <div className="rounded-3xl bg-[#ede6d8] p-6">
            <p className="text-sm text-[#6f7f6d]">Orden</p>

            <h2 className="mt-1 text-2xl font-bold text-[#37413d]">
              {orden.orden_id}
            </h2>

            <div className="mt-6 grid gap-4">
              <div className="rounded-2xl bg-white p-5">
                <p className="text-sm text-[#6f7f6d]">Producto</p>

                <p className="mt-1 text-xl font-bold text-[#37413d]">
                  {orden.producto.titulo}
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl bg-white p-5">
                  <p className="text-sm text-[#6f7f6d]">Precio producto</p>

                  <p className="mt-1 text-2xl font-bold text-[#37413d]">
                    ${orden.producto.precio.toLocaleString("es-AR")}
                  </p>
                </div>

                <div className="rounded-2xl bg-white p-5">
                  <p className="text-sm text-[#6f7f6d]">Envío</p>

                  <p className="mt-1 text-2xl font-bold text-[#37413d]">
                    ${orden.envio.toLocaleString("es-AR")}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl bg-[#b3b68d]/40 p-5">
                <p className="text-sm text-[#6f7f6d]">Total a pagar</p>

                <p className="mt-1 text-3xl font-bold text-[#37413d]">
                  ${total.toLocaleString("es-AR")}
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={pagar}
            disabled={cargando}
            className="mt-8 w-full rounded-3xl bg-[#8fa18d] px-5 py-5 text-lg font-semibold text-white transition hover:bg-[#7d907b] disabled:opacity-60"
          >
            {cargando ? "Procesando pago..." : "Pagar con Mercado Pago"}
          </button>
        </div>
      </section>
    </main>
  );
}