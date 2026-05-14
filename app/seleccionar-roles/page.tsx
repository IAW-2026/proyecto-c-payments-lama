"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserButton, useUser } from "@clerk/nextjs";

export default function SeleccionarRolesPage() {
  const router = useRouter();

  const { user: clerkUser, isLoaded } = useUser();

  const [rolesSeleccionados, setRolesSeleccionados] = useState<string[]>([]);
  const [guardando, setGuardando] = useState(false);

  if (!isLoaded) {
    return (
      <main className="min-h-screen bg-[#f6f1e7] flex items-center justify-center">
        <p className="text-[#37413d]">Cargando...</p>
      </main>
    );
  }

  if (!clerkUser) {
    router.push("/sign-in");
    return null;
  }

  function toggleRol(rol: string) {
    setRolesSeleccionados((rolesActuales) =>
      rolesActuales.includes(rol)
        ? rolesActuales.filter((r) => r !== rol)
        : [...rolesActuales, rol]
    );
  }

async function guardarRoles() {
  if (!clerkUser) {
    router.push("/sign-in");
    return;
  }

  if (rolesSeleccionados.length === 0) {
    alert("Tenés que elegir al menos un rol.");
    return;
  }

  setGuardando(true);

  await clerkUser.update({
    unsafeMetadata: {
      roles: rolesSeleccionados,
    },
  });

  router.push("/seleccionar-rol");
}

  return (
    <main className="min-h-screen bg-[#f6f1e7] px-6 py-8 flex items-center justify-center">
      <section className="grid w-full max-w-6xl overflow-hidden rounded-[32px] bg-white shadow-xl md:grid-cols-2">
        <div className="relative bg-[#8fa18d] px-8 py-12 text-white">
          <div className="absolute right-[-80px] top-[-80px] h-56 w-56 rounded-full bg-[#b3b68d]/40" />
          <div className="absolute left-[-40px] bottom-[-40px] h-40 w-40 rounded-full bg-[#9aadb0]/35" />

          <div className="relative z-10 flex h-full flex-col justify-between">
            <div>
              <p className="text-sm uppercase tracking-wide text-[#eef0ea]">
                LAMA Payments
              </p>

              <h1 className="mt-3 text-4xl font-bold">
                Elegí tus roles
              </h1>

              <p className="mt-4 max-w-md text-[#eef0ea]">
                Podés usar la plataforma como comprador, vendedor o ambos.
                Estos roles van a definir qué vistas vas a poder usar.
              </p>
            </div>

            <div className="mt-12 rounded-3xl bg-white/15 p-5">
              <p className="text-sm text-[#eef0ea]">
                El rol superadmin no se puede elegir al registrarse. Se asigna
                manualmente para evitar accesos administrativos indebidos.
              </p>
            </div>
          </div>
        </div>

        <div className="px-8 py-12">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <p className="text-sm uppercase tracking-wide text-[#6f7f6d]">
                Configuración inicial
              </p>

              <h2 className="mt-2 text-3xl font-bold text-[#37413d]">
                ¿Qué querés hacer en LAMA?
              </h2>
            </div>

            <UserButton />
          </div>

          <p className="mb-8 text-[#6f7f6d]">
            Seleccioná uno o más roles. Después vas a poder elegir con cuál
            operar en cada sesión.
          </p>

          <div className="grid gap-4">
            <button
              type="button"
              onClick={() => toggleRol("comprador")}
              className={`rounded-3xl border p-5 text-left transition hover:scale-[1.01] hover:shadow-md ${
                rolesSeleccionados.includes("comprador")
                  ? "border-[#8fa18d] bg-[#b3b68d]/50"
                  : "border-[#d9ddcf] bg-[#ede6d8]"
              }`}
            >
              <p className="text-sm text-[#6f7f6d]">
                Rol disponible
              </p>

              <p className="mt-1 text-2xl font-bold text-[#37413d]">
                Comprador
              </p>

              <p className="mt-2 text-sm text-[#6f7f6d]">
                Comprar ropa usada y consultar pagos realizados.
              </p>
            </button>

            <button
              type="button"
              onClick={() => toggleRol("vendedor")}
              className={`rounded-3xl border p-5 text-left transition hover:scale-[1.01] hover:shadow-md ${
                rolesSeleccionados.includes("vendedor")
                  ? "border-[#8fa18d] bg-[#b3b68d]/50"
                  : "border-[#d9ddcf] bg-[#ede6d8]"
              }`}
            >
              <p className="text-sm text-[#6f7f6d]">
                Rol disponible
              </p>

              <p className="mt-1 text-2xl font-bold text-[#37413d]">
                Vendedor
              </p>

              <p className="mt-2 text-sm text-[#6f7f6d]">
                Vender prendas y consultar cobros recibidos.
              </p>
            </button>

            <button
              type="button"
              onClick={guardarRoles}
              disabled={guardando}
              className="mt-4 rounded-3xl bg-[#8fa18d] px-5 py-4 text-left font-semibold text-white transition hover:bg-[#7d907b] disabled:opacity-60"
            >
              {guardando
                ? "Guardando roles..."
                : "Guardar y continuar"}
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}