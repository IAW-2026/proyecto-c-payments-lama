import { UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import {
  AppPage,
  BackLink,
  DetailTile,
  EmptyState,
  HeroPanel,
  MetricCard,
  Pagination,
  StatusPill,
} from "../../components/design";

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

type PageProps = {
  searchParams?: Promise<{
    page?: string | string[];
  }>;
};

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const PAGE_SIZE = 5;

async function obtenerPagos(): Promise<Pago[]> {
  const res = await fetch(`${baseUrl}/api/pagos?rol=super_admin`, {
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

function obtenerPagina(page: string | string[] | undefined) {
  const value = Array.isArray(page) ? page[0] : page;
  const parsed = Number(value || "1");

  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 1;
}

export default async function MovimientosPage({ searchParams }: PageProps) {
  const { userId } = await auth();
  const params = await searchParams;

  if (!userId) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f6f1e7] px-6">
        <section className="rounded-2xl border border-[#d9ddcf] bg-[#fffdf8] p-8 text-center shadow-[0_24px_70px_rgba(55,65,61,0.12)]">
          <h1 className="text-2xl font-semibold text-[#37413d]">
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
  const totalPages = Math.max(1, Math.ceil(pagos.length / PAGE_SIZE));
  const currentPage = Math.min(obtenerPagina(params?.page), totalPages);
  const pagosPaginados = pagos.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  return (
    <AppPage>
      <HeroPanel
        eyebrow="Payments App"
        title="Movimientos"
        description="Vista administrativa para consultar todos los pagos registrados en la plataforma LAMA."
      >
        <div className="mb-8 flex items-center justify-between gap-4">
          <BackLink />
          <UserButton />
        </div>
      </HeroPanel>

      <div className="grid gap-4 border-b border-[#d9ddcf] bg-white/50 px-6 py-6 md:grid-cols-4 sm:px-8">
        <MetricCard label="Total movimientos" value={pagos.length} />
        <MetricCard
          label="Pendientes"
          value={pagos.filter((pago) => pago.estado === "pendiente").length}
        />
        <MetricCard
          label="Aprobados"
          value={pagos.filter((pago) => pago.estado === "aprobado").length}
        />
        <MetricCard
          label="Monto total"
          value={formatearMonto(
            pagos.reduce((total, pago) => total + pago.monto_total, 0)
          )}
          accent
        />
      </div>

      <div className="px-6 py-8 sm:px-8">
        <h2 className="mb-4 text-xl font-semibold text-[#37413d]">
          Pagos registrados
        </h2>

        {pagos.length === 0 ? (
          <EmptyState>No hay pagos registrados todavía.</EmptyState>
        ) : (
          <div className="grid gap-4">
            {pagosPaginados.map((pago) => (
              <article
                key={pago.pago_id}
                className="rounded-xl border border-[#d9ddcf] bg-white p-5 shadow-[0_10px_30px_rgba(55,65,61,0.06)]"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm text-[#5f7269]">Orden</p>
                    <h3 className="mt-1 text-xl font-semibold text-[#37413d]">
                      {pago.orden_id}
                    </h3>
                  </div>

                  <StatusPill>{pago.estado}</StatusPill>
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
                    <p className="text-lg font-semibold text-[#37413d]">
                      {formatearMonto(pago.monto_total)}
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-4">
                  <DetailTile
                    label="Producto"
                    value={formatearMonto(pago.monto_producto)}
                  />
                  <DetailTile
                    label="Envío"
                    value={formatearMonto(pago.monto_envio)}
                  />
                  <DetailTile
                    label="Comisión"
                    value={formatearMonto(pago.comision)}
                  />
                  <DetailTile
                    label="Neto vendedor"
                    value={formatearMonto(pago.monto_neto)}
                    accent
                  />
                </div>
              </article>
            ))}

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={pagos.length}
              pageSize={PAGE_SIZE}
              itemLabel="pagos"
            />
          </div>
        )}
      </div>
    </AppPage>
  );
}
