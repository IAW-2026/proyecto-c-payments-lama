import Link from "next/link";
import type { ReactNode } from "react";

type ShellProps = {
  children: ReactNode;
  maxWidth?: string;
  centered?: boolean;
};

export function AppPage({
  children,
  maxWidth = "max-w-6xl",
  centered = false,
}: ShellProps) {
  return (
    <main
      className={`min-h-screen bg-[#f6f1e7] px-4 py-6 text-[#37413d] sm:px-6 lg:px-8 ${
        centered ? "flex items-center justify-center" : ""
      }`}
    >
      <section
        className={`mx-auto w-full ${maxWidth} overflow-hidden rounded-2xl border border-[#d9ddcf] bg-[#fffdf8] shadow-[0_24px_70px_rgba(55,65,61,0.12)]`}
      >
        {children}
      </section>
    </main>
  );
}

export function HeroPanel({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <div className="relative overflow-hidden bg-[#8fa18d] px-6 py-8 text-white sm:px-8 sm:py-10">
      <div className="absolute inset-x-0 top-0 h-px bg-white/30" />
      <div className="absolute right-0 top-0 h-full w-24 bg-[#b3b68d]/20" />
      <div className="absolute bottom-0 right-8 h-20 w-px bg-white/20" />

      <div className="relative z-10">
        {children}
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#eef0ea]">
          {eyebrow}
        </p>
        <h1 className="mt-3 max-w-3xl text-3xl font-semibold leading-tight sm:text-4xl">
          {title}
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-[#eef0ea] sm:text-base">
          {description}
        </p>
      </div>
    </div>
  );
}

export function SplitHero({
  children,
  eyebrow,
  title,
  description,
  note,
}: {
  children: ReactNode;
  eyebrow: string;
  title: string;
  description: string;
  note?: string;
}) {
  return (
    <AppPage centered>
      <div className="grid md:grid-cols-[0.95fr_1.05fr]">
        <HeroPanel eyebrow={eyebrow} title={title} description={description}>
          <div className="mb-10 flex items-center gap-3">
            <span className="h-2.5 w-2.5 rounded-full bg-[#d8ccb8]" />
            <span className="h-px w-12 bg-white/35" />
          </div>
        </HeroPanel>

        <div className="px-6 py-8 sm:px-8 sm:py-10">{children}</div>

        {note && (
          <div className="border-t border-[#d9ddcf] bg-white/60 px-6 py-4 text-sm text-[#6f7f6d] md:col-span-2 sm:px-8">
            {note}
          </div>
        )}
      </div>
    </AppPage>
  );
}

export function BackLink({ href = "/seleccionar-rol" }: { href?: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 rounded-full border border-white/30 px-3 py-2 text-sm font-medium text-white/90 transition hover:bg-white/10"
    >
      <span aria-hidden="true">←</span>
      Volver
    </Link>
  );
}

export function MetricCard({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: ReactNode;
  accent?: boolean;
}) {
  return (
    <div className="rounded-xl border border-[#d9ddcf] bg-white px-5 py-4 shadow-[0_10px_30px_rgba(55,65,61,0.06)]">
      <p className="text-sm text-[#6f7f6d]">{label}</p>
      <p
        className={`mt-2 text-2xl font-semibold ${
          accent ? "text-[#6f7f6d]" : "text-[#37413d]"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

export function StatusPill({ children }: { children: ReactNode }) {
  return (
    <span className="w-fit rounded-full border border-[#b3b68d]/50 bg-[#b3b68d]/20 px-3 py-1.5 text-sm font-medium capitalize text-[#515922]">
      {children}
    </span>
  );
}

export function DetailTile({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: ReactNode;
  accent?: boolean;
}) {
  return (
    <div className="rounded-xl bg-[#f6f1e7] px-4 py-3">
      <p className="text-xs text-[#6f7f6d]">{label}</p>
      <p className={`mt-1 font-semibold ${accent ? "text-[#515922]" : ""}`}>
        {value}
      </p>
    </div>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-[#d9ddcf] bg-[#f6f1e7]/60 p-6 text-[#6f7f6d]">
      {children}
    </div>
  );
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  itemLabel,
}: {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  itemLabel: string;
}) {
  if (totalPages <= 1) {
    return null;
  }

  const firstItem = (currentPage - 1) * pageSize + 1;
  const lastItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="mt-6 flex flex-col gap-3 border-t border-[#d9ddcf] pt-5 text-sm text-[#6f7f6d] sm:flex-row sm:items-center sm:justify-between">
      <p>
        Mostrando {firstItem}-{lastItem} de {totalItems} {itemLabel}
      </p>

      <div className="flex items-center gap-2">
        <Link
          href={`?page=${currentPage - 1}`}
          aria-disabled={currentPage === 1}
          className={`rounded-xl border px-4 py-2 font-medium transition ${
            currentPage === 1
              ? "pointer-events-none border-[#d9ddcf] text-[#9aadb0]"
              : "border-[#8fa18d] text-[#37413d] hover:bg-[#ede6d8]"
          }`}
        >
          Anterior
        </Link>

        <span className="rounded-xl bg-[#ede6d8] px-4 py-2 font-semibold text-[#37413d]">
          {currentPage} / {totalPages}
        </span>

        <Link
          href={`?page=${currentPage + 1}`}
          aria-disabled={currentPage === totalPages}
          className={`rounded-xl border px-4 py-2 font-medium transition ${
            currentPage === totalPages
              ? "pointer-events-none border-[#d9ddcf] text-[#9aadb0]"
              : "border-[#8fa18d] text-[#37413d] hover:bg-[#ede6d8]"
          }`}
        >
          Siguiente
        </Link>
      </div>
    </div>
  );
}
