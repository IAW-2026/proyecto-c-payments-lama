"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { UserButton, useUser } from "@clerk/nextjs";

type RoleOptionProps = {
  title: string;
  description: string;
  metric: string;
  eyebrow: string;
  onClick: () => void;
};

function toRoleList(value: unknown) {
  if (Array.isArray(value)) {
    return value.map(String);
  }

  return typeof value === "string" ? [value] : [];
}

function RoleOption({
  title,
  description,
  metric,
  eyebrow,
  onClick,
}: RoleOptionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="lama-role-card group relative overflow-hidden rounded-[1.6rem] border border-white/14 bg-white/[0.08] p-5 text-left text-white shadow-[0_22px_70px_rgba(0,0,0,0.24)] backdrop-blur-xl transition duration-300 hover:-translate-y-2 hover:border-[#a8bba0]/60 hover:bg-white/[0.13] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#a8bba0]"
    >
      <span className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-[#a8bba0]/15 transition duration-300 group-hover:scale-125" />
      <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent" />

      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.24em] text-[#b7c8af]">
            {eyebrow}
          </p>
          <h2 className="mt-3 text-3xl font-black tracking-normal">{title}</h2>
        </div>

        <span className="grid h-12 w-12 place-items-center rounded-full border border-white/18 bg-white/10 text-xl font-black transition group-hover:translate-x-1 group-hover:border-[#a8bba0] group-hover:bg-[#a8bba0] group-hover:text-[#17211f]">
          →
        </span>
      </div>

      <p className="relative mt-5 max-w-md text-base font-medium leading-7 text-white/70">
        {description}
      </p>

      <div className="relative mt-7 flex items-center justify-between border-t border-white/12 pt-4">
        <span className="text-sm font-bold uppercase tracking-[0.18em] text-white/45">
          Acceso habilitado
        </span>
        <span className="rounded-full bg-[#a8bba0]/18 px-4 py-2 text-sm font-black text-[#d8e5d2]">
          {metric}
        </span>
      </div>
    </button>
  );
}

function LoadingScreen() {
  return (
    <main className="lama-home relative grid min-h-screen place-items-center overflow-hidden bg-[#17211f] text-white">
      <div className="lama-hero-image absolute inset-0 opacity-45" />
      <div className="absolute inset-0 bg-[#17211f]/80" />
      <div className="relative rounded-3xl border border-white/12 bg-white/[0.08] px-8 py-6 text-center shadow-[0_24px_70px_rgba(0,0,0,0.3)] backdrop-blur-xl">
        <p className="text-xs font-black uppercase tracking-[0.34em] text-[#b7c8af]">
          LAMA Payments
        </p>
        <p className="mt-3 text-xl font-black">Cargando acceso...</p>
      </div>
    </main>
  );
}

export default function SeleccionarRolPage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();

  useEffect(() => {
    if (isLoaded && !user) {
      router.push("/sign-in");
    }
  }, [isLoaded, router, user]);

  if (!isLoaded || !user) {
    return <LoadingScreen />;
  }

  const userId = user.id;
  const roles = [
    ...toRoleList(user.publicMetadata.roles),
    ...toRoleList(user.publicMetadata.role),
    ...toRoleList(user.unsafeMetadata.roles),
    ...toRoleList(user.unsafeMetadata.role),
  ];

  const puedeComprar = roles.includes("comprador");
  const puedeVender = roles.includes("vendedor");
  const esSuperadmin = roles.includes("super_admin");
  const rolesDisponibles = [
    puedeComprar,
    puedeVender,
    esSuperadmin,
  ].filter(Boolean).length;

  return (
    <main className="lama-home relative min-h-screen overflow-hidden bg-[#17211f] text-white">
      <div className="lama-hero-image absolute inset-0 opacity-55" />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(23,33,31,0.96)_0%,rgba(23,33,31,0.84)_46%,rgba(23,33,31,0.42)_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_18%,rgba(168,187,160,0.22),transparent_28%),radial-gradient(circle_at_78%_28%,rgba(188,133,94,0.16),transparent_26%),linear-gradient(180deg,rgba(10,14,13,0.04),rgba(10,14,13,0.64))]" />
      <div className="lama-grain absolute inset-0 opacity-[0.12]" />
      <div className="lama-scan absolute inset-x-0 top-0 h-28" />

      <header className="relative z-20 flex items-center justify-between px-5 py-5 sm:px-8 lg:px-12">
        <button
          type="button"
          onClick={() => router.push("/")}
          className="group flex items-center gap-3 text-left"
        >
          <span className="text-3xl font-black tracking-[0.22em] text-white sm:text-4xl">
            LAMA
          </span>
          <span className="rounded-md border border-white/24 px-2 py-1 text-[0.65rem] font-bold uppercase tracking-[0.22em] text-white/60 transition group-hover:border-[#a8bba0] group-hover:text-[#c7d7bf]">
            payments
          </span>
        </button>

        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="hidden rounded-full border border-white/16 bg-white/5 px-5 py-3 text-sm font-black text-white/74 backdrop-blur transition hover:-translate-y-0.5 hover:border-white/36 hover:text-white sm:inline-flex"
          >
            Inicio
          </button>
          <UserButton />
        </div>
      </header>

      <section className="relative z-10 grid min-h-[calc(100vh-88px)] gap-8 px-5 pb-8 sm:px-8 lg:grid-cols-[0.92fr_1.08fr] lg:px-12 lg:pb-10">
        <div className="flex flex-col justify-center">
          <div className="lama-kicker flex items-center gap-4 text-xs font-black uppercase tracking-[0.48em] text-[#b7c8af] sm:text-sm">
            <span className="h-px w-14 bg-[#b7c8af]/70" />
            Selección de rol
          </div>

          <h1 className="mt-7 max-w-3xl text-[clamp(3.1rem,6.8vw,7.2rem)] font-black leading-[0.92] tracking-normal">
            Entrá al panel
            <span className="block text-[#a8bba0]">correcto</span>
          </h1>

          <p className="mt-7 max-w-2xl text-lg font-medium leading-8 text-white/74 sm:text-xl sm:leading-9">
            Elegí cómo operar en LAMA Payments. Solo aparecen los roles que tu
            usuario ya tiene habilitados.
          </p>

          <div className="mt-9 grid max-w-2xl grid-cols-3 gap-3">
            <div className="rounded-2xl border border-white/12 bg-white/[0.07] px-4 py-4 backdrop-blur-md">
              <p className="text-2xl font-black text-white sm:text-3xl">
                {rolesDisponibles}
              </p>
              <p className="mt-1 text-xs font-bold uppercase tracking-[0.18em] text-white/50">
                Roles
              </p>
            </div>
            <div className="rounded-2xl border border-white/12 bg-white/[0.07] px-4 py-4 backdrop-blur-md">
              <p className="text-2xl font-black text-white sm:text-3xl">3</p>
              <p className="mt-1 text-xs font-bold uppercase tracking-[0.18em] text-white/50">
                Paneles
              </p>
            </div>
            <div className="rounded-2xl border border-white/12 bg-white/[0.07] px-4 py-4 backdrop-blur-md">
              <p className="text-2xl font-black text-white sm:text-3xl">ID</p>
              <p className="mt-1 text-xs font-bold uppercase tracking-[0.18em] text-white/50">
                Seguro
              </p>
            </div>
          </div>
        </div>

        <div className="relative flex items-center">
          <div className="lama-orbit absolute right-[4%] top-[8%] hidden h-[520px] w-[520px] rounded-full border border-white/10 lg:block" />
          <div className="lama-orbit lama-orbit-two absolute right-[18%] top-[20%] hidden h-[350px] w-[350px] rounded-full border border-[#a8bba0]/18 lg:block" />

          <div className="relative w-full space-y-4 lg:pl-8">
            {puedeComprar && (
              <RoleOption
                title="Comprador"
                eyebrow="Compras"
                metric="Pagos"
                description="Consultá compras realizadas, pagos y estados asociados a tus órdenes."
                onClick={() => router.push(`/comprador/${userId}/pagos`)}
              />
            )}

            {puedeVender && (
              <RoleOption
                title="Vendedor"
                eyebrow="Ventas"
                metric="Neto"
                description="Revisá ventas, comisiones y el monto neto a recibir por cada operación."
                onClick={() => router.push(`/vendedor/${userId}/ventas`)}
              />
            )}

            {esSuperadmin && (
              <RoleOption
                title="Superadmin"
                eyebrow="Administración"
                metric="Global"
                description="Visualizá todos los movimientos registrados en la plataforma de pagos."
                onClick={() => router.push("/superadmin/movimientos")}
              />
            )}

            {rolesDisponibles === 0 && (
              <div className="rounded-[1.6rem] border border-white/14 bg-white/[0.08] p-6 text-white shadow-[0_22px_70px_rgba(0,0,0,0.24)] backdrop-blur-xl">
                <p className="text-xs font-black uppercase tracking-[0.24em] text-[#b7c8af]">
                  Sin roles activos
                </p>
                <h2 className="mt-3 text-3xl font-black">
                  Tu usuario todavía no tiene roles asignados.
                </h2>
                <p className="mt-4 text-base font-medium leading-7 text-white/70">
                  Cuando se habilite un rol, vas a poder entrar al panel
                  correspondiente desde esta pantalla.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
