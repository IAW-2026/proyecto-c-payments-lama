"use client";

import { useRouter } from "next/navigation";
import { UserButton, useUser } from "@clerk/nextjs";

export default function SeleccionarRolPage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();

  if (!isLoaded) {
    return (
      <main className="min-h-screen bg-[#f6f1e7] flex items-center justify-center">
        <p className="text-[#37413d]">Cargando...</p>
      </main>
    );
  }

  if (!user) {
    router.push("/sign-in");
    return null;
  }

  const userId = user.id;

  const roles = (user.publicMetadata.roles as string[]) || [];

  const puedeComprar = roles.includes("comprador");
  const puedeVender = roles.includes("vendedor");
  const esSuperadmin = roles.includes("superadmin");

  return (
    <main className="min-h-screen bg-[#f6f1e7] px-6 py-8 flex items-center justify-center">
      <section className="grid w-full max-w-6xl overflow-hidden rounded-[32px] bg-white shadow-xl md:grid-cols-2">
        <div className="relative bg-[#8fa18d] px-8 py-12 text-white">
          <div className="absolute right-[-80px] top-[-80px] h-56 w-56 rounded-full bg-[#b3b68d]/40" />
          <div className="absolute left-[-40px] bottom-[-40px] h-40 w-40 rounded-full bg-[#9aadb0]/35" />

          <div className="relative z-10 flex h-full flex-col justify-between">
            <div>
              <p className="text-sm uppercase tracking-wide text-[#eef0ea]">
                ReWear Payments
              </p>

              <h1 className="mt-3 text-4xl font-bold">
                Elegí con qué rol querés operar
              </h1>

              <p className="mt-4 max-w-md text-[#eef0ea]">
                Tu usuario puede tener uno o más roles habilitados. Seleccioná
                cómo querés ingresar a Payments App.
              </p>
            </div>

            <div className="mt-12 rounded-3xl bg-white/15 p-5">
              <p className="text-sm text-[#eef0ea]">
                Payments App administra compras, ventas, comisiones y
                movimientos de la plataforma.
              </p>
            </div>
          </div>
        </div>

        <div className="px-8 py-12">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <p className="text-sm uppercase tracking-wide text-[#6f7f6d]">
                Selección de rol
              </p>

              <h2 className="mt-2 text-3xl font-bold text-[#37413d]">
                ¿Cómo querés ingresar?
              </h2>
            </div>

            <UserButton />
          </div>

          <p className="mb-8 text-[#6f7f6d]">
            Solo se muestran los roles habilitados para tu usuario.
          </p>

          <div className="grid gap-4">
            {puedeComprar && (
              <button
                onClick={() => router.push(`/comprador/${userId}/pagos`)}
                className="rounded-3xl border border-[#d9ddcf] bg-[#ede6d8] p-5 text-left transition hover:scale-[1.01] hover:shadow-md"
              >
                <p className="text-sm text-[#6f7f6d]">Operar como</p>
                <p className="mt-1 text-2xl font-bold text-[#37413d]">
                  Comprador
                </p>
                <p className="mt-2 text-sm text-[#6f7f6d]">
                  Consultá compras realizadas, pagos y estados asociados.
                </p>
              </button>
            )}

            {puedeVender && (
              <button
                onClick={() => router.push(`/vendedor/${userId}/ventas`)}
                className="rounded-3xl border border-[#d9ddcf] bg-[#ede6d8] p-5 text-left transition hover:scale-[1.01] hover:shadow-md"
              >
                <p className="text-sm text-[#6f7f6d]">Operar como</p>
                <p className="mt-1 text-2xl font-bold text-[#37413d]">
                  Vendedor
                </p>
                <p className="mt-2 text-sm text-[#6f7f6d]">
                  Consultá ventas, comisiones y monto neto a recibir.
                </p>
              </button>
            )}

            {esSuperadmin && (
              <button
                onClick={() => router.push("/superadmin/movimientos")}
                className="rounded-3xl border border-[#d9ddcf] bg-[#ede6d8] p-5 text-left transition hover:scale-[1.01] hover:shadow-md"
              >
                <p className="text-sm text-[#6f7f6d]">Operar como</p>
                <p className="mt-1 text-2xl font-bold text-[#37413d]">
                  Superadmin
                </p>
                <p className="mt-2 text-sm text-[#6f7f6d]">
                  Visualizá todos los movimientos registrados en Payments App.
                </p>
              </button>
            )}

            {roles.length === 0 && (
              <div className="rounded-3xl bg-[#ede6d8] p-5 text-[#37413d]">
                Tu usuario todavía no tiene roles asignados.
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}