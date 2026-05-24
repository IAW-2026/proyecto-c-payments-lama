import Link from "next/link";

const stats = [
  { label: "Pagos", value: "24 hs" },
  { label: "Comisiones", value: "$12.4k" },
  { label: "Roles", value: "3" },
];

export default function HomePage() {
  return (
    <main className="lama-home relative min-h-screen overflow-hidden bg-[#17211f] text-white">
      <div className="lama-hero-image absolute inset-0" />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(23,33,31,0.94)_0%,rgba(23,33,31,0.76)_43%,rgba(23,33,31,0.28)_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_24%,rgba(160,184,151,0.24),transparent_32%),radial-gradient(circle_at_72%_18%,rgba(188,133,94,0.16),transparent_26%),linear-gradient(180deg,rgba(10,14,13,0.1),rgba(10,14,13,0.58))]" />

      <div className="lama-grain absolute inset-0 opacity-[0.13]" />
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

        <nav className="flex items-center gap-3 text-sm font-bold sm:text-base">
          <Link
            href="/sign-in"
            className="rounded-full bg-white px-5 py-3 text-[#25302d] shadow-[0_18px_42px_rgba(0,0,0,0.28)] transition hover:-translate-y-0.5 hover:bg-[#eef3eb] sm:px-7"
          >
            Iniciar sesión
          </Link>
        </nav>
      </header>

      <section className="relative z-10 grid min-h-[calc(100vh-88px)] items-center px-5 pb-6 sm:px-8 lg:grid-cols-[1.02fr_0.98fr] lg:px-12 lg:pb-0">
        <div className="max-w-5xl pt-8 lg:pt-0">
          <div className="lama-kicker flex items-center gap-4 text-xs font-black uppercase tracking-[0.54em] text-[#b7c8af] sm:text-sm">
            <span className="h-px w-14 bg-[#b7c8af]/70" />
            Gestión de pagos LAMA
          </div>

          <h1 className="mt-7 max-w-4xl text-[clamp(3.25rem,7.5vw,7.8rem)] font-black leading-[0.9] tracking-normal">
            <span className="block whitespace-nowrap">Vendé moda</span>
            <span className="block text-[#a8bba0]">con historia</span>
          </h1>

          <p className="mt-7 max-w-2xl text-lg font-medium leading-8 text-white/78 sm:text-xl sm:leading-9">
            Iniciá sesión para consultar compras, ventas, comisiones y
            movimientos según el rol que tengas habilitado.
          </p>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <Link
              href="/sign-in"
              className="group inline-flex items-center justify-center gap-3 rounded-full bg-[#a8bba0] px-8 py-5 text-lg font-black text-[#17211f] shadow-[0_22px_58px_rgba(168,187,160,0.34)] transition hover:-translate-y-1 hover:bg-[#c1d0ba]"
            >
              Iniciar sesión
              <span className="transition group-hover:translate-x-1" aria-hidden="true">
                →
              </span>
            </Link>
          </div>

          <div className="mt-9 grid max-w-2xl grid-cols-3 gap-3">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-white/12 bg-white/[0.07] px-4 py-4 backdrop-blur-md"
              >
                <p className="text-2xl font-black text-white sm:text-3xl">
                  {stat.value}
                </p>
                <p className="mt-1 text-xs font-bold uppercase tracking-[0.18em] text-white/50">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="pointer-events-none relative hidden h-full min-h-[620px] lg:block">
          <div className="lama-orbit absolute right-[8%] top-[8%] h-[520px] w-[520px] rounded-full border border-white/14" />
          <div className="lama-orbit lama-orbit-two absolute right-[2%] top-[18%] h-[390px] w-[390px] rounded-full border border-[#a8bba0]/22" />

          <div className="lama-product lama-product-main absolute right-[6%] top-[12%] h-[510px] w-[360px] overflow-hidden rounded-[2rem] border border-white/16 bg-[#28322f]/72 shadow-[0_40px_110px_rgba(0,0,0,0.42)] backdrop-blur">
            <div className="absolute inset-0 bg-[url('/lama-fashion-collage.svg')] bg-cover bg-center" />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent,rgba(23,33,31,0.28))]" />
          </div>

          <div className="lama-float-card absolute right-[44%] top-[20%] w-56 rounded-2xl border border-white/14 bg-white/10 p-4 shadow-[0_22px_58px_rgba(0,0,0,0.26)] backdrop-blur-xl">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#c7d7bf]">
              Último cobro
            </p>
            <p className="mt-2 text-3xl font-black">$4.200</p>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/14">
              <span className="lama-progress block h-full w-4/5 rounded-full bg-[#a8bba0]" />
            </div>
          </div>

          <div className="lama-float-card lama-float-card-two absolute bottom-[16%] right-[2%] w-64 rounded-2xl border border-white/14 bg-[#f6f1e7]/92 p-4 text-[#17211f] shadow-[0_26px_70px_rgba(0,0,0,0.32)]">
            <div className="flex items-center justify-between">
              <p className="font-black">Campera vintage</p>
              <span className="rounded-full bg-[#a8bba0] px-3 py-1 text-xs font-black">
                aprobado
              </span>
            </div>
            <p className="mt-2 text-sm font-semibold text-[#5c665e]">
              Comisión calculada y movimiento listo.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
