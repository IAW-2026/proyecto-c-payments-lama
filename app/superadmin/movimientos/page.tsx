import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { Pagination } from "../../components/design";

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
    periodo?: string | string[];
    semana?: string | string[];
    mes?: string | string[];
    comprador?: string | string[];
    vendedor?: string | string[];
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

function obtenerParametro(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function obtenerPeriodo(value: string | string[] | undefined) {
  const periodo = obtenerParametro(value);

  return periodo === "semana" || periodo === "mes" ? periodo : "todos";
}

function obtenerMes(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function obtenerSemana(date: Date) {
  const target = new Date(date.valueOf());
  const dayNumber = (date.getDay() + 6) % 7;

  target.setDate(target.getDate() - dayNumber + 3);

  const firstThursday = new Date(target.getFullYear(), 0, 4);
  const firstDayNumber = (firstThursday.getDay() + 6) % 7;

  firstThursday.setDate(firstThursday.getDate() - firstDayNumber + 3);

  const weekNumber =
    1 + Math.round((target.getTime() - firstThursday.getTime()) / 604800000);

  return `${target.getFullYear()}-W${String(weekNumber).padStart(2, "0")}`;
}

function filtrarPagos({
  pagos,
  periodo,
  semana,
  mes,
  comprador,
  vendedor,
}: {
  pagos: Pago[];
  periodo: string;
  semana: string;
  mes: string;
  comprador: string;
  vendedor: string;
}) {
  const compradorNormalizado = comprador.trim().toLowerCase();
  const vendedorNormalizado = vendedor.trim().toLowerCase();

  return pagos.filter((pago) => {
    const fecha = new Date(pago.fecha_creacion);
    const coincidePeriodo =
      periodo === "semana"
        ? obtenerSemana(fecha) === semana
        : periodo === "mes"
          ? obtenerMes(fecha) === mes
          : true;
    const coincideComprador =
      compradorNormalizado === "" ||
      pago.comprador_id.toLowerCase().includes(compradorNormalizado);
    const coincideVendedor =
      vendedorNormalizado === "" ||
      pago.vendedor_id.toLowerCase().includes(vendedorNormalizado);

    return coincidePeriodo && coincideComprador && coincideVendedor;
  });
}

function formatearFecha(fecha: string) {
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(fecha));
}

function estadoClase(estado: string) {
  if (estado === "aprobado") {
    return "border-[#a8bba0]/45 bg-[#a8bba0]/20 text-[#d8e5d2]";
  }

  if (estado === "pendiente") {
    return "border-[#d8ccb8]/40 bg-[#d8ccb8]/16 text-[#f2e8d7]";
  }

  return "border-white/18 bg-white/10 text-white/70";
}

function MetricGlass({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string | number;
  accent?: boolean;
}) {
  return (
    <div className="lama-compact-metric border border-white/12 bg-white/[0.08] shadow-[0_18px_58px_rgba(0,0,0,0.22)] backdrop-blur-xl">
      <p
        className={`lama-compact-metric-value font-black ${accent ? "text-[#a8bba0]" : "text-white"}`}
      >
        {value}
      </p>
      <p className="mt-2 text-[0.68rem] font-bold uppercase tracking-[0.16em] text-white/48">
        {label}
      </p>
    </div>
  );
}

function DetailBox({
  label,
  value,
  dark = false,
}: {
  label: string;
  value: string;
  dark?: boolean;
}) {
  return (
    <div
      className={`lama-compact-detail ${dark ? "bg-[#17211f] text-white" : "bg-[#f6f1e7] text-[#37413d]"}`}
    >
      <p
        className={`text-xs font-bold uppercase tracking-[0.16em] ${dark ? "text-[#b7c8af]" : "text-[#6f7f6d]"}`}
      >
        {label}
      </p>
      <p className="mt-2 min-w-0 overflow-wrap-anywhere break-words font-black">
        {value}
      </p>
    </div>
  );
}

function LoginRequired() {
  return (
    <main className="lama-home relative grid min-h-screen place-items-center overflow-hidden bg-[#17211f] px-6 text-white">
      <div className="lama-hero-image absolute inset-0 opacity-45" />
      <div className="absolute inset-0 bg-[#17211f]/82" />
      <section className="relative max-w-md rounded-3xl border border-white/12 bg-white/[0.08] p-8 text-center shadow-[0_24px_70px_rgba(0,0,0,0.3)] backdrop-blur-xl">
        <p className="text-xs font-black uppercase tracking-[0.34em] text-[#b7c8af]">
          LAMA Payments
        </p>
        <h1 className="mt-4 text-3xl font-black">Debés iniciar sesión</h1>
        <p className="mt-3 leading-7 text-white/68">
          Para ver los movimientos administrativos necesitás estar logueado.
        </p>
        <Link
          href="/sign-in"
          className="mt-6 inline-flex rounded-full bg-[#a8bba0] px-6 py-3 font-black text-[#17211f] transition hover:-translate-y-0.5 hover:bg-[#c1d0ba]"
        >
          Iniciar sesión
        </Link>
      </section>
    </main>
  );
}

export default async function MovimientosPage({ searchParams }: PageProps) {
  const { userId } = await auth();
  const params = await searchParams;

  if (!userId) {
    return <LoginRequired />;
  }

  const periodo = obtenerPeriodo(params?.periodo);
  const semanaSeleccionada =
    obtenerParametro(params?.semana) || obtenerSemana(new Date());
  const mesSeleccionado = obtenerParametro(params?.mes) || obtenerMes(new Date());
  const comprador = obtenerParametro(params?.comprador) || "";
  const vendedor = obtenerParametro(params?.vendedor) || "";
  const pagos = await obtenerPagos();
  const pagosFiltrados = filtrarPagos({
    pagos,
    periodo,
    semana: semanaSeleccionada,
    mes: mesSeleccionado,
    comprador,
    vendedor,
  });
  const totalPages = Math.max(1, Math.ceil(pagosFiltrados.length / PAGE_SIZE));
  const currentPage = Math.min(obtenerPagina(params?.page), totalPages);
  const pagosPaginados = pagosFiltrados.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );
  const pendientes = pagosFiltrados.filter(
    (pago) => pago.estado === "pendiente"
  ).length;
  const aprobados = pagosFiltrados.filter(
    (pago) => pago.estado === "aprobado"
  ).length;
  const montoTotal = pagosFiltrados.reduce(
    (total, pago) => total + pago.monto_total,
    0
  );
  const comisiones = pagosFiltrados.reduce(
    (total, pago) => total + pago.comision,
    0
  );

  return (
    <main className="lama-home relative min-h-screen overflow-x-hidden bg-[#17211f] text-white">
      <div className="lama-hero-image absolute inset-0 opacity-45" />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(23,33,31,0.97)_0%,rgba(23,33,31,0.9)_48%,rgba(23,33,31,0.52)_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_18%,rgba(168,187,160,0.2),transparent_28%),linear-gradient(180deg,rgba(10,14,13,0.02),rgba(10,14,13,0.74))]" />
      <div className="lama-grain absolute inset-0 opacity-[0.1]" />
      <div className="lama-scan absolute inset-x-0 top-0 h-28" />

      <header className="relative z-20 flex items-center justify-between px-5 py-5 sm:px-8 lg:px-12">
        <Link href="/seleccionar-rol" className="group flex items-center gap-3">
          <span className="text-3xl font-black tracking-[0.22em] text-white sm:text-4xl">
            LAMA
          </span>
          <span className="rounded-md border border-white/24 px-2 py-1 text-[0.65rem] font-bold uppercase tracking-[0.22em] text-white/60 transition group-hover:border-[#a8bba0] group-hover:text-[#c7d7bf]">
            payments
          </span>
        </Link>

        <div className="flex items-center gap-4">
          <Link
            href="/seleccionar-rol"
            className="hidden rounded-full border border-white/16 bg-white/5 px-5 py-3 text-sm font-black text-white/74 backdrop-blur transition hover:-translate-y-0.5 hover:border-white/36 hover:text-white sm:inline-flex"
          >
            Cambiar rol
          </Link>
          <UserButton />
        </div>
      </header>

      <section className="relative z-10 px-5 pb-10 sm:px-8 lg:px-12">
        <div className="grid gap-6 lg:grid-cols-[0.68fr_1.32fr] 2xl:grid-cols-[0.62fr_1.38fr]">
          <div className="pt-8 lg:pt-14">
            <div className="lama-kicker flex items-center gap-4 text-xs font-black uppercase tracking-[0.48em] text-[#b7c8af] sm:text-sm">
              <span className="h-px w-14 bg-[#b7c8af]/70" />
              Superadmin
            </div>

            <h1 className="lama-compact-heading mt-7 max-w-3xl font-black leading-[0.92] tracking-normal">
              Movimientos
              <span className="block text-[#a8bba0]">globales</span>
            </h1>

            <p className="mt-7 max-w-2xl text-lg font-medium leading-8 text-white/72 sm:text-xl sm:leading-9">
              Vista administrativa para controlar pagos, estados, comisiones y
              montos netos de toda la plataforma.
            </p>

            <div className="mt-7 grid max-w-xl grid-cols-2 gap-2">
              <MetricGlass label="Movimientos" value={pagosFiltrados.length} />
              <MetricGlass label="Pendientes" value={pendientes} />
              <MetricGlass label="Aprobados" value={aprobados} />
              <MetricGlass
                label="Total"
                value={formatearMonto(montoTotal)}
                accent
              />
              <MetricGlass
                label="Comisiones"
                value={formatearMonto(comisiones)}
              />
            </div>
          </div>

          <div className="relative lg:pt-10">
            <div className="lama-orbit absolute right-[4%] top-[8%] hidden h-[520px] w-[520px] rounded-full border border-white/10 xl:block" />
            <div className="lama-compact-panel relative border border-white/12 bg-[#f6f1e7]/95 p-3 text-[#17211f] shadow-[0_34px_100px_rgba(0,0,0,0.34)] backdrop-blur-xl sm:p-4">
              <div className="flex flex-col gap-2 border-b border-[#d9ddcf] pb-5 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.24em] text-[#6f7f6d]">
                    Auditoría de pagos
                  </p>
                  <h2 className="mt-2 text-2xl font-black text-[#17211f]">
                    Pagos registrados
                  </h2>
                </div>
                <p className="text-sm font-bold text-[#6f7f6d]">
                  Página {currentPage} de {totalPages}
                </p>
              </div>

              <form className="mt-4 grid gap-2 rounded-2xl border border-[#d9ddcf] bg-white/60 p-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
                <label className="grid min-w-0 gap-2 text-sm font-bold text-[#37413d]">
                  Período
                  <select
                    name="periodo"
                    defaultValue={periodo}
                    className="min-w-0 rounded-xl border border-[#d9ddcf] bg-white px-3 py-2.5 font-semibold text-[#37413d]"
                  >
                    <option value="todos">Todos</option>
                    <option value="semana">Semana</option>
                    <option value="mes">Mes</option>
                  </select>
                </label>
                <label className="grid min-w-0 gap-2 text-sm font-bold text-[#37413d]">
                  Semana
                  <input
                    type="week"
                    name="semana"
                    defaultValue={semanaSeleccionada}
                    className="min-w-0 rounded-xl border border-[#d9ddcf] bg-white px-3 py-2.5 font-semibold text-[#37413d]"
                  />
                </label>
                <label className="grid min-w-0 gap-2 text-sm font-bold text-[#37413d]">
                  Mes
                  <input
                    type="month"
                    name="mes"
                    defaultValue={mesSeleccionado}
                    className="min-w-0 rounded-xl border border-[#d9ddcf] bg-white px-3 py-2.5 font-semibold text-[#37413d]"
                  />
                </label>
                <label className="grid min-w-0 gap-2 text-sm font-bold text-[#37413d]">
                  Comprador
                  <input
                    type="search"
                    name="comprador"
                    defaultValue={comprador}
                    placeholder="ID comprador"
                    className="min-w-0 rounded-xl border border-[#d9ddcf] bg-white px-3 py-2.5 font-semibold text-[#37413d] placeholder:text-[#9aadb0]"
                  />
                </label>
                <label className="grid min-w-0 gap-2 text-sm font-bold text-[#37413d]">
                  Vendedor
                  <input
                    type="search"
                    name="vendedor"
                    defaultValue={vendedor}
                    placeholder="ID vendedor"
                    className="min-w-0 rounded-xl border border-[#d9ddcf] bg-white px-3 py-2.5 font-semibold text-[#37413d] placeholder:text-[#9aadb0]"
                  />
                </label>
                <button
                  type="submit"
                  className="self-end rounded-xl bg-[#17211f] px-4 py-2.5 font-black text-white transition hover:-translate-y-0.5 hover:bg-[#2f3c38]"
                >
                  Aplicar
                </button>
                <Link
                  href="?"
                  className="self-end rounded-xl border border-[#d9ddcf] px-4 py-2.5 text-center font-black text-[#37413d] transition hover:-translate-y-0.5 hover:bg-[#f6f1e7]"
                >
                  Limpiar
                </Link>
              </form>

              {pagosFiltrados.length === 0 ? (
                <div className="mt-5 rounded-2xl border border-dashed border-[#9aadb0] bg-white/60 p-6 text-[#5f7269]">
                  No hay pagos registrados para los filtros seleccionados.
                </div>
              ) : (
                <div className="mt-5 grid gap-4">
                  {pagosPaginados.map((pago) => (
                    <article
                      key={pago.pago_id}
                      className="group rounded-2xl border border-[#d9ddcf] bg-white p-4 shadow-[0_12px_34px_rgba(55,65,61,0.08)] transition hover:-translate-y-1 hover:border-[#a8bba0] hover:shadow-[0_22px_48px_rgba(55,65,61,0.14)]"
                    >
                      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div>
                          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#6f7f6d]">
                            Orden
                          </p>
                          <h3 className="mt-2 text-xl font-black text-[#17211f]">
                            {pago.orden_id}
                          </h3>
                        </div>

                        <span
                          className={`w-fit rounded-full border px-4 py-2 text-sm font-black capitalize ${estadoClase(
                            pago.estado
                          )}`}
                        >
                          {pago.estado}
                        </span>
                      </div>

                      <div className="mt-5 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                        <DetailBox label="Comprador" value={pago.comprador_id} />
                        <DetailBox label="Vendedor" value={pago.vendedor_id} />
                        <DetailBox label="Proveedor" value={pago.proveedor} />
                        <DetailBox
                          label="Fecha"
                          value={formatearFecha(pago.fecha_creacion)}
                        />
                        <DetailBox
                          label="Total pagado"
                          value={formatearMonto(pago.monto_total)}
                          dark
                        />
                      </div>

                      <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
                        <DetailBox
                          label="Producto"
                          value={formatearMonto(pago.monto_producto)}
                        />
                        <DetailBox
                          label="Envío"
                          value={formatearMonto(pago.monto_envio)}
                        />
                        <DetailBox
                          label="Comisión"
                          value={formatearMonto(pago.comision)}
                        />
                        <div className="lama-compact-detail bg-[#a8bba0] text-[#17211f]">
                          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#37413d]/70">
                            Neto vendedor
                          </p>
                          <p className="mt-2 text-2xl font-black">
                            {formatearMonto(pago.monto_neto)}
                          </p>
                        </div>
                      </div>
                    </article>
                  ))}

                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={pagosFiltrados.length}
                    pageSize={PAGE_SIZE}
                    itemLabel="pagos"
                    searchParams={{
                      periodo,
                      semana: semanaSeleccionada,
                      mes: mesSeleccionado,
                      comprador,
                      vendedor,
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
