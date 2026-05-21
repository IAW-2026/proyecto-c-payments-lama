import Link from "next/link";
import { SplitHero } from "./components/design";

export default function HomePage() {
  return (
    <SplitHero
      eyebrow="Lama Payments"
      title="Pagos simples para ropa usada"
      description="Registrá pagos, comisiones y movimientos de compra y venta con una interfaz clara para cada rol del marketplace."
      note="Paleta LAMA: crema, salvia y tonos tierra suaves."
    >
      <div className="flex h-full flex-col justify-center">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6f7f6d]">
          Payments App
        </p>

        <h2 className="mt-3 text-3xl font-semibold text-[#37413d] sm:text-4xl">
          Bienvenida a LAMA
        </h2>

        <p className="mt-4 max-w-md leading-7 text-[#6f7f6d]">
          Iniciá sesión para acceder a tu panel según el rol que tengas
          habilitado.
        </p>

        <div className="mt-6 rounded-2xl border border-[#d9ddcf] bg-white p-4 shadow-[0_14px_35px_rgba(55,65,61,0.08)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6f7f6d]">
                Último movimiento
              </p>
              <p className="mt-2 text-lg font-semibold text-[#37413d]">
                Campera vintage
              </p>
            </div>
            <span className="rounded-full bg-[#b3b68d]/25 px-3 py-1 text-sm font-medium text-[#515922]">
              aprobado
            </span>
          </div>

          <div className="mt-4 grid grid-cols-[1fr_auto] items-end gap-4">
            <div className="space-y-2">
              <span className="block h-2 rounded-full bg-[#ede6d8]" />
              <span className="block h-2 w-4/5 rounded-full bg-[#d9ddcf]" />
              <span className="block h-2 w-2/3 rounded-full bg-[#ede6d8]" />
            </div>
            <div className="rounded-xl bg-[#8fa18d] px-4 py-3 text-right text-white">
              <p className="text-xs text-[#eef0ea]">Total</p>
              <p className="text-xl font-semibold">$4.200</p>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <Link
            href="/sign-in"
            className="inline-flex w-full items-center justify-center rounded-xl bg-[#8fa18d] px-5 py-3 text-center font-semibold text-white shadow-[0_12px_30px_rgba(143,161,141,0.35)] transition hover:bg-[#7d907b] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 sm:w-auto sm:min-w-64"
          >
            Iniciar sesión
          </Link>
        </div>

        <div className="mt-8 grid gap-3 text-sm text-[#6f7f6d] sm:grid-cols-3">
          <div className="border-l border-[#d9ddcf] pl-3">
            <strong className="block text-[#37413d]">Compras</strong>
            Seguimiento de pagos.
          </div>
          <div className="border-l border-[#d9ddcf] pl-3">
            <strong className="block text-[#37413d]">Ventas</strong>
            Neto y comisiones.
          </div>
          <div className="border-l border-[#d9ddcf] pl-3">
            <strong className="block text-[#37413d]">Admin</strong>
            Movimientos completos.
          </div>
        </div>
      </div>
    </SplitHero>
  );
}
