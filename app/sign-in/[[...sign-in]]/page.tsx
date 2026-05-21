import Link from "next/link";
import { SignIn } from "@clerk/nextjs";

export default function Page() {
  return (
    <main className="min-h-screen bg-[#f6f1e7] px-4 py-8 text-[#37413d] sm:px-6">
      <section className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-6xl overflow-hidden rounded-2xl border border-[#d9ddcf] bg-[#fffdf8] shadow-[0_24px_70px_rgba(55,65,61,0.12)] lg:grid-cols-[0.9fr_1.1fr]">
        <div className="relative hidden overflow-hidden bg-[#8fa18d] px-8 py-10 text-white lg:block">
          <div className="absolute right-0 top-0 h-full w-24 bg-[#b3b68d]/20" />
          <div className="absolute bottom-10 left-8 right-8 h-px bg-white/25" />

          <Link
            href="/"
            className="relative z-10 inline-flex items-center gap-2 rounded-full border border-white/30 px-3 py-2 text-sm font-medium text-white/90 transition hover:bg-white/10"
          >
            <span aria-hidden="true">←</span>
            Inicio
          </Link>

          <div className="relative z-10 mt-24">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#eef0ea]">
              Lama Payments
            </p>
            <h1 className="mt-3 max-w-sm text-4xl font-semibold leading-tight">
              Entrá a tu panel de pagos
            </h1>
            <p className="mt-4 max-w-md leading-7 text-[#eef0ea]">
              Una vista clara para compras, ventas y movimientos, según el rol
              que tengas habilitado.
            </p>
          </div>

          <div className="relative z-10 mt-12 rounded-2xl border border-white/25 bg-white/10 p-5 backdrop-blur">
            <div className="flex items-center justify-between">
              <p className="text-sm text-[#eef0ea]">Acceso protegido</p>
              <span className="rounded-full bg-white/15 px-3 py-1 text-sm">
                Clerk
              </span>
            </div>
            <div className="mt-5 grid grid-cols-3 gap-3">
              <span className="h-20 rounded-xl bg-white/15" />
              <span className="h-20 rounded-xl bg-[#b3b68d]/35" />
              <span className="h-20 rounded-xl bg-white/15" />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center px-4 py-8 sm:px-8">
          <div className="w-full max-w-md">
            <div className="mb-6 lg:hidden">
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-full border border-[#d9ddcf] px-3 py-2 text-sm font-medium text-[#6f7f6d] transition hover:bg-[#ede6d8]"
              >
                <span aria-hidden="true">←</span>
                Inicio
              </Link>
            </div>

            <SignIn
              appearance={{
                variables: {
                  colorPrimary: "#8fa18d",
                  colorText: "#37413d",
                  colorTextSecondary: "#6f7f6d",
                  colorBackground: "#fffdf8",
                  colorInputBackground: "#ffffff",
                  colorInputText: "#37413d",
                  borderRadius: "0.75rem",
                },
                elements: {
                  rootBox: "w-full",
                  card:
                    "w-full border border-[#d9ddcf] bg-white shadow-[0_14px_35px_rgba(55,65,61,0.08)]",
                  headerTitle: "text-[#37413d]",
                  headerSubtitle: "text-[#6f7f6d]",
                  formButtonPrimary:
                    "bg-[#8fa18d] text-white shadow-[0_12px_30px_rgba(143,161,141,0.35)] hover:bg-[#7d907b]",
                  footerActionLink: "text-[#6f7f6d] hover:text-[#37413d]",
                },
              }}
            />
          </div>
        </div>
      </section>
    </main>
  );
}
