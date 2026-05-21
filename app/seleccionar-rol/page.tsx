"use client";

import { useRouter } from "next/navigation";
import { UserButton, useUser } from "@clerk/nextjs";
import { EmptyState, SplitHero } from "../components/design";

function toRoleList(value: unknown) {
  if (Array.isArray(value)) {
    return value.map(String);
  }

  return typeof value === "string" ? [value] : [];
}

function RoleOption({
  title,
  description,
  onClick,
}: {
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group rounded-xl border border-[#d9ddcf] bg-white p-5 text-left shadow-[0_10px_30px_rgba(55,65,61,0.06)] transition hover:-translate-y-0.5 hover:border-[#8fa18d] hover:shadow-[0_18px_40px_rgba(55,65,61,0.10)]"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6f7f6d]">
            Operar como
          </p>
          <p className="mt-2 text-2xl font-semibold text-[#37413d]">{title}</p>
        </div>
        <span className="rounded-full border border-[#d9ddcf] px-3 py-1 text-[#6f7f6d] transition group-hover:bg-[#ede6d8]">
          →
        </span>
      </div>
      <p className="mt-3 text-sm leading-6 text-[#6f7f6d]">{description}</p>
    </button>
  );
}

export default function SeleccionarRolPage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();

  if (!isLoaded) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f6f1e7]">
        <p className="text-[#37413d]">Cargando...</p>
      </main>
    );
  }

  if (!user) {
    router.push("/sign-in");
    return null;
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
  const esSuperadmin =
    roles.includes("super_admin") || roles.includes("superadmin");

  return (
    <SplitHero
      eyebrow="LAMA Payments"
      title="Elegí con qué rol querés operar"
      description="Tu usuario puede tener uno o más roles habilitados. Seleccioná cómo querés entrar a Payments App."
      note="Payments App administra compras, ventas, comisiones y movimientos de la plataforma."
    >
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6f7f6d]">
            Selección de rol
          </p>
          <h2 className="mt-3 text-3xl font-semibold text-[#37413d]">
            ¿Cómo querés ingresar?
          </h2>
        </div>

        <UserButton />
      </div>

      <p className="mb-6 leading-7 text-[#6f7f6d]">
        Solo se muestran los roles habilitados para tu usuario.
      </p>

      <div className="grid gap-4">
        {puedeComprar && (
          <RoleOption
            title="Comprador"
            description="Consultá compras realizadas, pagos y estados asociados."
            onClick={() => router.push(`/comprador/${userId}/pagos`)}
          />
        )}

        {puedeVender && (
          <RoleOption
            title="Vendedor"
            description="Consultá ventas, comisiones y monto neto a recibir."
            onClick={() => router.push(`/vendedor/${userId}/ventas`)}
          />
        )}

        {esSuperadmin && (
          <RoleOption
            title="Superadmin"
            description="Visualizá todos los movimientos registrados en Payments App."
            onClick={() => router.push("/superadmin/movimientos")}
          />
        )}

        {roles.length === 0 && (
          <EmptyState>Tu usuario todavía no tiene roles asignados.</EmptyState>
        )}

        <button
          onClick={() => router.push("/")}
          className="mt-2 rounded-xl border border-[#8fa18d] px-5 py-3 font-semibold text-[#37413d] transition hover:bg-[#ede6d8]"
        >
          Volver al inicio
        </button>
      </div>
    </SplitHero>
  );
}
