"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserButton, useUser } from "@clerk/nextjs";
import { SplitHero } from "../components/design";

function SelectableRole({
  title,
  description,
  selected,
  onClick,
}: {
  title: string;
  description: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border p-5 text-left shadow-[0_10px_30px_rgba(55,65,61,0.06)] transition hover:-translate-y-0.5 ${
        selected
          ? "border-[#8fa18d] bg-[#b3b68d]/25"
          : "border-[#d9ddcf] bg-white hover:border-[#8fa18d]"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6f7f6d]">
            Rol disponible
          </p>
          <p className="mt-2 text-2xl font-semibold text-[#37413d]">{title}</p>
        </div>
        <span
          className={`rounded-full border px-3 py-1 text-sm font-semibold ${
            selected
              ? "border-[#8fa18d] bg-white text-[#37413d]"
              : "border-[#d9ddcf] text-[#6f7f6d]"
          }`}
        >
          {selected ? "Activo" : "Elegir"}
        </span>
      </div>
      <p className="mt-3 text-sm leading-6 text-[#6f7f6d]">{description}</p>
    </button>
  );
}

export default function SeleccionarRolesPage() {
  const router = useRouter();
  const { user: clerkUser, isLoaded } = useUser();

  const [rolesSeleccionados, setRolesSeleccionados] = useState<string[]>([]);
  const [guardando, setGuardando] = useState(false);

  if (!isLoaded) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f6f1e7]">
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
    <SplitHero
      eyebrow="LAMA Payments"
      title="Elegí tus roles"
      description="Podés usar la plataforma como comprador, vendedor o ambos. Estos roles definen qué vistas vas a poder usar."
      note="El rol super_admin se asigna manualmente para proteger los accesos administrativos."
    >
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6f7f6d]">
            Configuración inicial
          </p>
          <h2 className="mt-3 text-3xl font-semibold text-[#37413d]">
            ¿Qué querés hacer en LAMA?
          </h2>
        </div>

        <UserButton />
      </div>

      <p className="mb-6 leading-7 text-[#6f7f6d]">
        Seleccioná uno o más roles. Después vas a poder elegir con cuál operar
        en cada sesión.
      </p>

      <div className="grid gap-4">
        <SelectableRole
          title="Comprador"
          description="Comprar ropa usada y consultar pagos realizados."
          selected={rolesSeleccionados.includes("comprador")}
          onClick={() => toggleRol("comprador")}
        />

        <SelectableRole
          title="Vendedor"
          description="Vender prendas y consultar cobros recibidos."
          selected={rolesSeleccionados.includes("vendedor")}
          onClick={() => toggleRol("vendedor")}
        />

        <button
          type="button"
          onClick={guardarRoles}
          disabled={guardando}
          className="mt-2 rounded-xl bg-[#8fa18d] px-5 py-3 text-left font-semibold text-white shadow-[0_12px_30px_rgba(143,161,141,0.35)] transition hover:bg-[#7d907b] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {guardando ? "Guardando roles..." : "Guardar y continuar"}
        </button>
      </div>
    </SplitHero>
  );
}
