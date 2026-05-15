import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { UserButton } from "@clerk/nextjs";

type Pago = {
  pago_id: string;
  orden_id: string;
  comprador_id: string;
  vendedor_id: string;
  monto_producto: number;
  monto_envio: number;
  comision: number;
  monto_neto: number;
  monto_total: number;
  moneda: string;
  estado: string;
  proveedor: string;
  fecha_creacion: string;
};

const baseUrl =
  process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

async function obtenerPagos(): Promise<Pago[]> {
  const res = await fetch(`${baseUrl}/api/pagos?rol=superadmin`, {
    cache: "no-store",
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "Error al obtener los pagos");
  }

  return data;
}

function formatearMonto(monto: number) {
  return `$${Math.round(monto).toLocaleString("es-AR")}`;
}

export default async function MovimientosPage() {
  const { userId } = await auth();

  if (!userId) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#f6f1e7] px-6">
        <section className="rounded-3xl bg-white p-8 shadow-xl text-center">
          <h1 className="text-2xl font-bold text-[#37413d]">
            Debes iniciar sesión
          </h1>

          <p className="mt-3 text-[#5f7269]">
            Para ver los movimientos tenés que estar logueado.
          </p>
        </section>
      </main>
    );
  }

  const pagos = await obtenerPagos();

  return (
    <main className="min-h-screen bg-[#f6f1e7] px-6 py-8">
      <section className="mx-auto max-w-6xl overflow-hidden rounded-[32px] bg-white shadow-xl">
        <div className="relative bg-[#8fa18d] px-8 py-10 text-white">
          <div className="absolute right-[-80px] top-[-80px] h-56 w-56 rounded-full bg-[#b3b68d]/40" />

          <div className="absolute right-24 bottom-4 h-24 w-24 rounded-full bg-[#9aadb0]/35" />

          <div className="relative z-10">
            <div className="mb-10 flex items-center justify-between">
          <div className="mb-10 flex items-center justify-between">
            <Link
            href="/seleccionar-rol"
          >
            <span className="text-4xl font-black leading-none text-[#d8ccb8]">
              ⬅
            </span>
          </Link>
          </div>
            <UserButton />
            </div>

            <p className="text-sm uppercase tracking-wide text-[#eef0ea]">
              Payments App
            </p>

            <h1 className="mt-2 text-4xl font-bold">Movimientos</h1>

            <p className="mt-3 max-w-2xl text-[#eef0ea]">
              Vista administrativa para consultar todos los pagos registrados en
              la plataforma LAMA.
            </p>
          </div>
        </div>

        <div className="grid gap-4 px-8 py-6 md:grid-cols-4">
          <div className="rounded-3xl bg-[#ede6d8] p-5">
            <p className="text-sm text-[#5f7269]">Total movimientos</p>

            <p className="mt-2 text-2xl font-bold text-[#37413d]">
              {pagos.length}
            </p>
          </div>

          <div className="rounded-3xl bg-[#ede6d8] p-5">
            <p className="text-sm text-[#5f7269]">Pendientes</p>

            <p className="mt-2 text-2xl font-bold text-[#37413d]">
              {pagos.filter((p) => p.estado === "pendiente").length}
            </p>
          </div>

          <div className="rounded-3xl bg-[#ede6d8] p-5">
            <p className="text-sm text-[#5f7269]">Aprobados</p>

            <p className="mt-2 text-2xl font-bold text-[#37413d]">
              {pagos.filter((p) => p.estado === "aprobado").length}
            </p>
          </div>

          <div className="rounded-3xl bg-[#ede6d8] p-5">
            <p className="text-sm text-[#5f7269]">Monto total</p>

            <p className="mt-2 text-2xl font-bold text-[#37413d]">
              {formatearMonto(
                pagos.reduce(
                  (total, pago) => total + pago.monto_total,
                  0
                )
              )}
            </p>
          </div>
        </div>

        <div className="px-8 pb-8">
          <h2 className="mb-4 text-xl font-bold text-[#37413d]">
            Pagos registrados
          </h2>

          <div className="grid gap-4">
            {pagos.map((pago) => (
              <article
                key={pago.pago_id}
                className="rounded-3xl border border-[#d9ddcf] bg-white p-5 shadow-sm"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm text-[#5f7269]">Orden</p>

                    <h3 className="text-xl font-bold text-[#37413d]">
                      {pago.orden_id}
                    </h3>
                  </div>

                  <span className="w-fit rounded-full bg-[#b3b68d]/40 px-4 py-2 text-sm font-medium text-[#515922]">
                    {pago.estado}
                  </span>
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-4">
                  <div>
                    <p className="text-sm text-[#5f7269]">Comprador</p>

                    <p className="font-medium text-[#37413d]">
                      {pago.comprador_id}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-[#5f7269]">Vendedor</p>

                    <p className="font-medium text-[#37413d]">
                      {pago.vendedor_id}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-[#5f7269]">Proveedor</p>

                    <p className="font-medium text-[#37413d]">
                      {pago.proveedor}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-[#5f7269]">Total pagado</p>

                    <p className="text-lg font-bold text-[#37413d]">
                      {formatearMonto(pago.monto_total)}
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-4">
                  <div className="rounded-2xl bg-[#ede6d8] p-4">
                    <p className="text-xs text-[#5f7269]">Producto</p>

                    <p className="font-bold text-[#37413d]">
                      {formatearMonto(pago.monto_producto)}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-[#ede6d8] p-4">
                    <p className="text-xs text-[#5f7269]">Envío</p>

                    <p className="font-bold text-[#37413d]">
                      {formatearMonto(pago.monto_envio)}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-[#ede6d8] p-4">
                    <p className="text-xs text-[#5f7269]">Comisión</p>

                    <p className="font-bold text-[#37413d]">
                      {formatearMonto(pago.comision)}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-[#ede6d8] p-4">
                    <p className="text-xs text-[#5f7269]">
                      Neto vendedor
                    </p>

                    <p className="font-bold text-[#515922]">
                      {formatearMonto(pago.monto_neto)}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}