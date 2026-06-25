import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { supabase } from "@/lib/supabase";

type RouteContext = {
  params: Promise<{
    pago_id: string;
  }>;
};

type PagoComprobante = {
  pago_id: string;
  orden_id: string;
  comprador_id: string;
  comprador_nombre: string | null;
  comprador_email: string | null;
  vendedor_id: string;
  vendedor_nombre: string | null;
  monto_producto: number;
  monto_envio: number;
  monto_total: number;
  comision: number | null;
  monto_neto: number | null;
  moneda: string | null;
  estado: string;
  proveedor: string | null;
  pago_proveedor_id: string | null;
  fecha_creacion: string;
  fecha_aprobado: string | null;
};

function toRoleList(value: unknown) {
  if (Array.isArray(value)) {
    return value.map(String);
  }

  return typeof value === "string" ? [value] : [];
}

function limpiarPdfTexto(value: unknown) {
  return String(value ?? "No informado")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7E]/g, "")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function formatearMonto(monto: number, moneda: string | null) {
  return `${moneda || "ARS"} ${Math.round(monto).toLocaleString("es-AR")}`;
}

function formatearFecha(fecha: string | null) {
  if (!fecha) {
    return "No informado";
  }

  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(fecha));
}

function crearComprobantePdf(pago: PagoComprobante) {
  const text = (
    texto: string,
    x: number,
    y: number,
    size = 11,
    bold = false,
    color = "0.10 0.14 0.13"
  ) =>
    [
      "BT",
      `${color} rg`,
      `/${bold ? "F2" : "F1"} ${size} Tf`,
      `1 0 0 1 ${x} ${y} Tm`,
      `(${limpiarPdfTexto(texto)}) Tj`,
      "ET",
    ].join("\n");

  const rect = (
    x: number,
    y: number,
    width: number,
    height: number,
    color: string,
    stroke?: string
  ) =>
    stroke
      ? `${color} rg ${stroke} RG ${x} ${y} ${width} ${height} re B`
      : `${color} rg ${x} ${y} ${width} ${height} re f`;

  const line = (x1: number, y1: number, x2: number, y2: number, color: string) =>
    `${color} RG 1 w ${x1} ${y1} m ${x2} ${y2} l S`;

  const proveedor = pago.proveedor || "MERCADO_PAGO";
  const comprador = pago.comprador_nombre || pago.comprador_id;
  const vendedor = pago.vendedor_nombre || pago.vendedor_id;
  const pagoProveedor = pago.pago_proveedor_id || "No informado";

  const contenido = [
    rect(0, 0, 595, 842, "0.97 0.95 0.90"),
    rect(0, 690, 595, 152, "0.09 0.13 0.12"),
    rect(40, 650, 515, 92, "1 1 1"),
    rect(40, 452, 515, 158, "1 1 1"),
    rect(40, 246, 515, 158, "1 1 1"),
    rect(40, 116, 515, 82, "0.09 0.13 0.12"),
    rect(420, 770, 116, 30, "0.66 0.73 0.63"),
    rect(40, 640, 515, 4, "0.66 0.73 0.63"),
    line(62, 548, 532, 548, "0.86 0.86 0.81"),
    line(62, 340, 532, 340, "0.86 0.86 0.81"),

    text("LAMA", 56, 782, 30, true, "1 1 1"),
    text("PAYMENTS", 58, 764, 9, true, "0.72 0.78 0.69"),
    text("Comprobante de pago", 56, 724, 23, true, "1 1 1"),
    text("Pago confirmado y registrado en la plataforma", 56, 704, 11, false, "0.82 0.87 0.80"),
    text("APROBADO", 442, 780, 11, true, "0.09 0.13 0.12"),

    text("Total pagado", 62, 706, 10, true, "0.42 0.50 0.40"),
    text(formatearMonto(pago.monto_total, pago.moneda), 62, 674, 28, true),
    text("Proveedor", 328, 705, 10, true, "0.42 0.50 0.40"),
    text(proveedor, 328, 682, 16, true),
    text(`ID proveedor: ${pagoProveedor}`, 328, 662, 9, false, "0.40 0.45 0.43"),

    text("Datos de la operacion", 62, 584, 15, true),
    text("Orden", 62, 558, 9, true, "0.42 0.50 0.40"),
    text(pago.orden_id, 62, 532, 13, true),
    text("Pago interno", 320, 558, 9, true, "0.42 0.50 0.40"),
    text(pago.pago_id, 320, 532, 10),
    text("Fecha de creacion", 62, 506, 9, true, "0.42 0.50 0.40"),
    text(formatearFecha(pago.fecha_creacion), 62, 482, 12),
    text("Fecha de aprobacion", 320, 506, 9, true, "0.42 0.50 0.40"),
    text(formatearFecha(pago.fecha_aprobado), 320, 482, 12),

    text("Participantes", 62, 378, 15, true),
    text("Comprador", 62, 352, 9, true, "0.42 0.50 0.40"),
    text(comprador, 62, 326, 13, true),
    text("Email comprador", 62, 304, 9, true, "0.42 0.50 0.40"),
    text(pago.comprador_email || "No informado", 62, 282, 11),
    text("Vendedor", 320, 352, 9, true, "0.42 0.50 0.40"),
    text(vendedor, 320, 326, 13, true),

    text("Detalle de importes", 62, 172, 14, true, "1 1 1"),
    text("Producto", 62, 146, 10, true, "0.72 0.78 0.69"),
    text(formatearMonto(pago.monto_producto, pago.moneda), 62, 126, 13, true, "1 1 1"),
    text("Envio", 310, 146, 10, true, "0.72 0.78 0.69"),
    text(formatearMonto(pago.monto_envio, pago.moneda), 310, 126, 13, true, "1 1 1"),

    text("Este comprobante fue generado con los datos registrados por LAMA Payments.", 56, 70, 9, false, "0.42 0.46 0.43"),
    text("La confirmacion del pago llega desde el webhook de Mercado Pago.", 56, 54, 9, false, "0.42 0.46 0.43"),
  ].join("\n");

  const objetos = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>",
    `<< /Length ${Buffer.byteLength(contenido, "latin1")} >>\nstream\n${contenido}\nendstream`,
  ];

  let pdf = "%PDF-1.4\n";
  const offsets = [0];

  objetos.forEach((objeto, index) => {
    offsets.push(Buffer.byteLength(pdf, "latin1"));
    pdf += `${index + 1} 0 obj\n${objeto}\nendobj\n`;
  });

  const xrefOffset = Buffer.byteLength(pdf, "latin1");
  pdf += `xref\n0 ${objetos.length + 1}\n`;
  pdf += "0000000000 65535 f \n";

  for (const offset of offsets.slice(1)) {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  }

  pdf += `trailer\n<< /Size ${objetos.length + 1} /Root 1 0 R >>\n`;
  pdf += `startxref\n${xrefOffset}\n%%EOF`;

  return Buffer.from(pdf, "latin1");
}

export async function GET(_req: NextRequest, context: RouteContext) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json(
      { error: "Debes iniciar sesion para descargar el comprobante" },
      { status: 401 }
    );
  }

  const { pago_id } = await context.params;

  const { data: pago, error } = await supabase
    .from("pago")
    .select("*")
    .eq("pago_id", pago_id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const pagoComprobante = pago as PagoComprobante;

  const user = await currentUser();
  const roles = [
    ...toRoleList(user?.publicMetadata.roles),
    ...toRoleList(user?.publicMetadata.role),
    ...toRoleList(user?.unsafeMetadata.roles),
    ...toRoleList(user?.unsafeMetadata.role),
  ];
  const esSuperadmin = roles.includes("super_admin");

  if (pagoComprobante.comprador_id !== userId && !esSuperadmin) {
    return NextResponse.json(
      { error: "No tenes permiso para descargar este comprobante" },
      { status: 403 }
    );
  }

  if (pagoComprobante.estado !== "aprobado") {
    return NextResponse.json(
      { error: "El comprobante solo esta disponible para pagos aprobados" },
      { status: 409 }
    );
  }

  const pdf = crearComprobantePdf(pagoComprobante);

  return new NextResponse(pdf, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="comprobante-${limpiarPdfTexto(
        pagoComprobante.orden_id
      )}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
