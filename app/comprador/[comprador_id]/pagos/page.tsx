import { auth } from "@clerk/nextjs/server";

type Pago = {
  pago_id: string;
  orden_id: string;
  comprador_id: string;
  vendedor_id: string;
  monto_producto: number;
  monto_envio: number;
  monto_total: number;
  estado: string;
  proveedor: string;
};

async function obtenerCompras(compradorId: string): Promise<Pago[]> {
  const res = await fetch(
    `http://localhost:3000/api/pagos?rol=comprador&comprador_id=${compradorId}`,
    {
      cache: "no-store",
    }
  );

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "Error al obtener compras");
  }

  return data;
}

function formatearMonto(monto: number) {
  return `$${Math.round(monto).toLocaleString("es-AR")}`;
}

export default async function PagosPage() {
  // 👇 Usuario logueado con Clerk
  const { userId } = await auth();

  // 👇 Si no está logueado
  if (!userId) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <h1 className="text-2xl font-bold">
          Debes iniciar sesión
        </h1>
      </main>
    );
  }

  // 👇 Usa el userId de Clerk como comprador_id
  const compras = await obtenerCompras(userId);

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

            <h1 className="mt-2 text-4xl font-bold">
              Mis compras
            </h1>

            <p className="mt-3 max-w-2xl text-[#eef0ea]">
              Vista del comprador para consultar pagos y estados de compra.
            </p>
          </div>
        </div>

        <div className="grid gap-4 px-8 py-6 md:grid-cols-3">
          <div className="rounded-3xl bg-[#ede6d8] p-5">
            <p className="text-sm text-[#6f7f6d]">
              Compras registradas
            </p>

            <p className="mt-2 text-2xl font-bold text-[#37413d]">
              {compras.length}
            </p>
          </div>

          <div className="rounded-3xl bg-[#ede6d8] p-5">
            <p className="text-sm text-[#6f7f6d]">
              Total gastado
            </p>

            <p className="mt-2 text-2xl font-bold text-[#37413d]">
              {formatearMonto(
                compras.reduce(
                  (total, compra) => total + compra.monto_total,
                  0
                )
              )}
            </p>
          </div>

          <div className="rounded-3xl bg-[#ede6d8] p-5">
            <p className="text-sm text-[#6f7f6d]">
              Pendientes
            </p>

            <p className="mt-2 text-2xl font-bold text-[#6f7f6d]">
              {
                compras.filter(
                  (compra) => compra.estado === "pendiente"
                ).length
              }
            </p>
          </div>
        </div>

        <div className="px-8 pb-8">
          <h2 className="mb-4 text-xl font-bold text-[#37413d]">
            Compras registradas
          </h2>

          <div className="grid gap-4">
            {compras.map((compra) => (
              <article
                key={compra.pago_id}
                className="rounded-3xl border border-[#d9ddcf] bg-white p-5 shadow-sm"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm text-[#6f7f6d]">
                      Orden
                    </p>

                    <h3 className="text-xl font-bold text-[#37413d]">
                      {compra.orden_id}
                    </h3>
                  </div>

                  <span className="w-fit rounded-full bg-[#b3b68d]/40 px-4 py-2 text-sm font-medium text-[#6f7f6d]">
                    {compra.estado}
                  </span>
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-3">
                  <div>
                    <p className="text-sm text-[#6f7f6d]">
                      Vendedor
                    </p>

                    <p className="font-medium text-[#37413d]">
                      {compra.vendedor_id}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-[#6f7f6d]">
                      Proveedor
                    </p>

                    <p className="font-medium text-[#37413d]">
                      {compra.proveedor}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-[#6f7f6d]">
                      Total pagado
                    </p>

                    <p className="text-lg font-bold text-[#37413d]">
                      {formatearMonto(compra.monto_total)}
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