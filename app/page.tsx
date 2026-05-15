import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#f6f1e7] px-6 py-8 flex items-center justify-center">
      <section className="grid w-full max-w-6xl overflow-hidden rounded-[32px] bg-white shadow-xl md:grid-cols-2">
        <div className="relative bg-[#8fa18d] px-8 py-12 text-white">
          <div className="absolute right-[-80px] top-[-80px] h-56 w-56 rounded-full bg-[#b3b68d]/40" />
          <div className="absolute left-[-40px] bottom-[-40px] h-40 w-40 rounded-full bg-[#9aadb0]/35" />

          <div className="relative z-10">
            <p className="text-sm uppercase tracking-wide text-[#eef0ea]">
              Lama Payments
            </p>

            <h1 className="mt-3 text-5xl font-bold leading-tight">
              Pagos seguros para ropa usada
            </h1>

            <p className="mt-5 max-w-md text-[#eef0ea]">
              Lama permite registrar pagos, comisiones y movimientos de compra
              y venta dentro del marketplace.
            </p>
          </div>
        </div>

        <div className="px-8 py-12 flex flex-col justify-center">
          <p className="text-sm uppercase tracking-wide text-[#6f7f6d]">
            Payments App
          </p>

          <h2 className="mt-2 text-4xl font-bold text-[#37413d]">
            Bienvenida a Lama
          </h2>

          <p className="mt-4 text-[#6f7f6d]">
            Iniciá sesión para acceder según tu rol habilitado.
          </p>

          <Link
            href="/sign-in"
            className="mt-8 rounded-3xl bg-[#8fa18d] px-5 py-4 text-center font-semibold text-white transition hover:bg-[#7d907b]"
          >
            Iniciar sesión
          </Link>
        </div>
      </section>
    </main>
  );
}