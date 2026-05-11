import { auth } from "@clerk/nextjs/server";

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
};

const baseUrl =
  process.env.NEXT_PUBLIC_APP_URL|| "http://localhost:3000";

async function obtenerVentas(vendedorId: string): Promise<Pago[]> {
  const res = await fetch(
    `${baseUrl}/api/pagos?rol=vendedor&vendedor_id=${vendedorId}`,
    {
      cache: "no-store",
    }
  );

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "Error al obtener ventas");
  }

  return data;
}

function formatearMonto(monto: number) {
  return `$${Math.round(monto).toLocaleString("es-AR")}`;
}

export default async function VentasPage() {
  const { userId } = await auth();

  if (!userId) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#f6f1e7] px-6">
        <section className="rounded-3xl bg-white p-8 shadow-xl text-center">
          <h1 className="text-2xl font-bold text-[#37413d]">
            Debes iniciar sesión
          </h1>
          <p className="mt-3 text-[#6f7f6d]">
            Para ver tus ventas tenés que estar logueado.
          </p>
        </section>
      </main>
    );
  }

  const ventas = await obtenerVentas(userId);

  return (
    <main className="min-h-screen bg-[#f6f1e7] px-6 py-8">
      <section className="mx-auto max-w-6xl overflow-hidden rounded-[32px] bg-white shadow-xl">
        <div className="relative bg-[#8fa18d] px-8 py-10 text-white">
          <div className="absolute right-[-80px] top-[-80px] h-56 w-56 rounded-full bg-[#b3b68d]/40" />
          <div className="absolute right-24 bottom-4 h-24 w-24 rounded-full bg-[#9aadb0]/35" />

          <div className="relative z-10">
            <p className="text-sm uppercase tracking-wide text-[#eef0ea]">
              Payments App
            </p>

            <h1 className="mt-2 text-4xl font-bold">Mis ventas</h1>

            <p className="mt-3 max-w-2xl text-[#eef0ea]">
              Vista del vendedor para consultar pagos asociados a sus ventas.
            </p>

            <p className="mt-2 text-sm text-[#eef0ea]">
              Vendedor: {userId}
            </p>
          </div>
        </div>

        <div className="grid gap-4 px-8 py-6 md:grid-cols-3">
          <div className="rounded-3xl bg-[#ede6d8] p-5">
            <p className="text-sm text-[#6f7f6d]">Ventas registradas</p>
            <p className="mt-2 text-2xl font-bold text-[#37413d]">
              {ventas.length}
            </p>
          </div>

          <div className="rounded-3xl bg-[#ede6d8] p-5">
            <p className="text-sm text-[#6f7f6d]">Total vendido</p>
            <p className="mt-2 text-2xl font-bold text-[#37413d]">
              {formatearMonto(
                ventas.reduce((total, venta) => total + venta.monto_total, 0)
              )}
            </p>
          </div>

          <div className="rounded-3xl bg-[#ede6d8] p-5">
            <p className="text-sm text-[#6f7f6d]">Neto a recibir</p>
            <p className="mt-2 text-2xl font-bold text-[#6f7f6d]">
              {formatearMonto(
                ventas.reduce((total, venta) => total + venta.monto_neto, 0)
              )}
            </p>
          </div>
        </div>

        <div className="px-8 pb-8">
          <h2 className="mb-4 text-xl font-bold text-[#37413d]">
            Ventas registradas
          </h2>

          {ventas.length === 0 ? (
            <div className="rounded-3xl bg-[#ede6d8] p-6 text-[#6f7f6d]">
              No hay ventas registradas para este vendedor.
            </div>
          ) : (
            <div className="grid gap-4">
              {ventas.map((venta) => (
                <article
                  key={venta.pago_id}
                  className="rounded-3xl border border-[#d9ddcf] bg-white p-5 shadow-sm"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-sm text-[#6f7f6d]">Orden</p>
                      <h3 className="text-xl font-bold text-[#37413d]">
                        {venta.orden_id}
                      </h3>
                    </div>

                    <span className="w-fit rounded-full bg-[#b3b68d]/40 px-4 py-2 text-sm font-medium text-[#6f7f6d]">
                      {venta.estado}
                    </span>
                  </div>

                  <div className="mt-5 grid gap-4 md:grid-cols-3">
                    <div>
                      <p className="text-sm text-[#6f7f6d]">Comprador</p>
                      <p className="font-medium text-[#37413d]">
                        {venta.comprador_id}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-[#6f7f6d]">Proveedor</p>
                      <p className="font-medium text-[#37413d]">
                        {venta.proveedor}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-[#6f7f6d]">Total pagado</p>
                      <p className="text-lg font-bold text-[#37413d]">
                        {formatearMonto(venta.monto_total)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 md:grid-cols-3">
                    <div className="rounded-2xl bg-[#ede6d8] p-4">
                      <p className="text-xs text-[#6f7f6d]">Producto</p>
                      <p className="font-bold text-[#37413d]">
                        {formatearMonto(venta.monto_producto)}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-[#ede6d8] p-4">
                      <p className="text-xs text-[#6f7f6d]">Comisión</p>
                      <p className="font-bold text-[#37413d]">
                        {formatearMonto(venta.comision)}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-[#ede6d8] p-4">
                      <p className="text-xs text-[#6f7f6d]">Neto vendedor</p>
                      <p className="font-bold text-[#6f7f6d]">
                        {formatearMonto(venta.monto_neto)}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}