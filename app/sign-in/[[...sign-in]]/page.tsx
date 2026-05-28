import Link from "next/link";
import { SignIn } from "@clerk/nextjs";

export default function Page() {
  return (
    <main className="lama-home relative min-h-screen overflow-x-hidden bg-[#17211f] text-white">
      <div className="lama-hero-image absolute inset-0 opacity-50" />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(23,33,31,0.97)_0%,rgba(23,33,31,0.86)_46%,rgba(23,33,31,0.44)_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_18%,rgba(168,187,160,0.22),transparent_28%),radial-gradient(circle_at_76%_24%,rgba(188,133,94,0.12),transparent_24%),linear-gradient(180deg,rgba(10,14,13,0.02),rgba(10,14,13,0.74))]" />
      <div className="lama-grain absolute inset-0 opacity-[0.11]" />
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

        <Link
          href="/"
          className="rounded-full border border-white/16 bg-white/5 px-5 py-3 text-sm font-black text-white/74 backdrop-blur transition hover:-translate-y-0.5 hover:border-white/36 hover:text-white"
        >
          Inicio
        </Link>
      </header>

      <section className="relative z-10 grid min-h-[calc(100vh-88px)] gap-8 px-5 pb-10 sm:px-8 lg:grid-cols-[0.82fr_1.18fr] lg:px-12">
        <div className="flex flex-col justify-center">
          <div className="lama-kicker flex items-center gap-4 text-xs font-black uppercase tracking-[0.48em] text-[#b7c8af] sm:text-sm">
            <span className="h-px w-14 bg-[#b7c8af]/70" />
            Acceso protegido
          </div>

          <h1 className="mt-7 max-w-3xl text-[clamp(3.1rem,6.2vw,6.6rem)] font-black leading-[0.92] tracking-normal">
            Entrá a
            <span className="block text-[#a8bba0]">LAMA Payments</span>
          </h1>

          <p className="mt-7 max-w-2xl text-lg font-medium leading-8 text-white/72 sm:text-xl sm:leading-9">
            Iniciá sesión con tu usuario habilitado para operar como comprador,
            vendedor o superadmin.
          </p>

          <div className="mt-9 grid max-w-xl grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="lama-compact-metric border border-white/12 bg-white/[0.08] shadow-[0_18px_58px_rgba(0,0,0,0.22)] backdrop-blur-xl">
              <p className="lama-compact-metric-value font-black text-white">
                3
              </p>
              <p className="mt-2 text-[0.68rem] font-bold uppercase tracking-[0.16em] text-white/48">
                Roles
              </p>
            </div>
            <div className="lama-compact-metric border border-white/12 bg-white/[0.08] shadow-[0_18px_58px_rgba(0,0,0,0.22)] backdrop-blur-xl">
              <p className="lama-compact-metric-value font-black text-[#a8bba0]">
                ID
              </p>
              <p className="mt-2 text-[0.68rem] font-bold uppercase tracking-[0.16em] text-white/48">
                Validado
              </p>
            </div>
            <div className="lama-compact-metric border border-white/12 bg-white/[0.08] shadow-[0_18px_58px_rgba(0,0,0,0.22)] backdrop-blur-xl">
              <p className="lama-compact-metric-value font-black text-white">
                Pago
              </p>
              <p className="mt-2 text-[0.68rem] font-bold uppercase tracking-[0.16em] text-white/48">
                Seguro
              </p>
            </div>
          </div>
        </div>

        <div className="relative flex items-center justify-center">
          <div className="lama-orbit absolute right-[4%] top-[8%] hidden h-[500px] w-[500px] rounded-full border border-white/10 lg:block" />
          <div className="lama-orbit lama-orbit-two absolute right-[20%] top-[22%] hidden h-[340px] w-[340px] rounded-full border border-[#a8bba0]/18 lg:block" />

          <div className="relative w-full max-w-2xl rounded-[1.8rem] border border-white/12 bg-[#f6f1e7]/95 p-5 text-[#17211f] shadow-[0_34px_100px_rgba(0,0,0,0.34)] backdrop-blur-xl sm:p-8">
            <div className="mb-4 border-b border-[#d9ddcf] pb-4">
              <p className="text-xs font-black uppercase tracking-[0.24em] text-[#6f7f6d]">
                Inicio de sesión
              </p>
              <h2 className="mt-2 text-2xl font-black text-[#17211f]">
                Accedé a tu panel
              </h2>
            </div>

            <div className="mx-auto flex w-full max-w-md justify-center">
              <SignIn
                fallbackRedirectUrl="/seleccionar-rol"
                signUpUrl="/sign-in"
                appearance={{
                  variables: {
                    colorPrimary: "#8fa18d",
                    colorText: "#17211f",
                    colorTextSecondary: "#6f7f6d",
                    colorBackground: "#ffffff",
                    colorInputBackground: "#ffffff",
                    colorInputText: "#17211f",
                    borderRadius: "1rem",
                    fontFamily: "Arial, Helvetica, sans-serif",
                  },
                  elements: {
                    rootBox: "mx-auto w-full",
                    card:
                      "mx-auto w-full border-0 bg-transparent shadow-none p-0",
                    main: "mx-auto w-full",
                    header: "hidden",
                    headerTitle: "text-center text-[#17211f]",
                    headerSubtitle: "text-center text-[#6f7f6d]",
                    socialButtonsBlockButton:
                      "rounded-xl border border-[#d9ddcf] bg-white text-[#17211f] shadow-none hover:bg-[#f6f1e7]",
                    form: "mx-auto w-full",
                    formFieldInput:
                      "rounded-xl border-[#d9ddcf] bg-white text-[#17211f]",
                    formButtonPrimary:
                      "rounded-full bg-[#a8bba0] py-3 font-black text-[#17211f] shadow-[0_18px_44px_rgba(168,187,160,0.28)] hover:bg-[#c1d0ba]",
                    footer: "hidden",
                    footerAction: "hidden",
                    footerActionLink: "hidden",
                    formFieldLabel: "text-[#37413d] font-bold",
                    identityPreviewText: "text-[#17211f]",
                    formFieldAction: "text-[#6f7f6d] hover:text-[#17211f]",
                    alternativeMethodsBlockButton:
                      "rounded-xl border border-[#d9ddcf] bg-white text-[#17211f] hover:bg-[#f6f1e7]",
                  },
                }}
              />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
