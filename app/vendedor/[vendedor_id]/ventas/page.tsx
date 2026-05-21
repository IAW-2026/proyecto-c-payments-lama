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
} from "../../../components/design";

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

type PageProps = {
  searchParams?: Promise<{
    page?: string | string[];
  }>;
};

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const PAGE_SIZE = 5;

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

function obtenerPagina(page: string | string[] | undefined) {
  const value = Array.isArray(page) ? page[0] : page;
  const parsed = Number(value || "1");

  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 1;
}

export default async function VentasPage({ searchParams }: PageProps) {
  const { userId } = await auth();
  const params = await searchParams;

  if (!userId) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f6f1e7] px-6">
        <section className="rounded-2xl border border-[#d9ddcf] bg-[#fffdf8] p-8 text-center shadow-[0_24px_70px_rgba(55,65,61,0.12)]">
          <h1 className="text-2xl font-semibold text-[#37413d]">
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
  const totalPages = Math.max(1, Math.ceil(ventas.length / PAGE_SIZE));
  const currentPage = Math.min(obtenerPagina(params?.page), totalPages);
  const ventasPaginadas = ventas.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  return (
    <AppPage>
      <HeroPanel
        eyebrow="Payments App"
        title="Mis ventas"
        description="Vista del vendedor para consultar pagos asociados a sus ventas."
      >
        <div className="mb-8 flex items-center justify-between gap-4">
          <BackLink />
          <UserButton />
        </div>
      </HeroPanel>

      <div className="grid gap-4 border-b border-[#d9ddcf] bg-white/50 px-6 py-6 md:grid-cols-3 sm:px-8">
        <MetricCard label="Ventas registradas" value={ventas.length} />
        <MetricCard
          label="Total vendido"
          value={formatearMonto(
            ventas.reduce((total, venta) => total + venta.monto_total, 0)
          )}
        />
        <MetricCard
          label="Neto a recibir"
          value={formatearMonto(
            ventas.reduce((total, venta) => total + venta.monto_neto, 0)
          )}
          accent
        />
      </div>

      <div className="px-6 py-8 sm:px-8">
        <h2 className="mb-4 text-xl font-semibold text-[#37413d]">
          Ventas registradas
        </h2>

        {ventas.length === 0 ? (
          <EmptyState>No hay ventas registradas para este vendedor.</EmptyState>
        ) : (
          <div className="grid gap-4">
            {ventasPaginadas.map((venta) => (
              <article
                key={venta.pago_id}
                className="rounded-xl border border-[#d9ddcf] bg-white p-5 shadow-[0_10px_30px_rgba(55,65,61,0.06)]"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm text-[#6f7f6d]">Orden</p>
                    <h3 className="mt-1 text-xl font-semibold text-[#37413d]">
                      {venta.orden_id}
                    </h3>
                  </div>

                  <StatusPill>{venta.estado}</StatusPill>
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
                    <p className="text-lg font-semibold text-[#37413d]">
                      {formatearMonto(venta.monto_total)}
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-3">
                  <DetailTile
                    label="Producto"
                    value={formatearMonto(venta.monto_producto)}
                  />
                  <DetailTile
                    label="Comisión"
                    value={formatearMonto(venta.comision)}
                  />
                  <DetailTile
                    label="Neto vendedor"
                    value={formatearMonto(venta.monto_neto)}
                    accent
                  />
                </div>
              </article>
            ))}

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={ventas.length}
              pageSize={PAGE_SIZE}
              itemLabel="ventas"
            />
          </div>
        )}
      </div>
    </AppPage>
  );
}
