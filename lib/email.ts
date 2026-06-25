type EmailCompraAprobada = {
  email: string;
  ordenId: string;
  pagoId: string;
  montoTotal?: number | null;
  moneda?: string | null;
};

const RESEND_API_URL = "https://api.resend.com/emails";

function escaparHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatearMonto(monto?: number | null, moneda?: string | null) {
  if (typeof monto !== "number" || Number.isNaN(monto)) {
    return null;
  }

  try {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: moneda || "ARS",
    }).format(monto);
  } catch {
    return `$${monto.toFixed(2)}`;
  }
}

export async function enviarEmailCompraAprobada({
  email,
  ordenId,
  pagoId,
  montoTotal,
  moneda,
}: EmailCompraAprobada) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.MAIL_FROM?.trim();

  if (!apiKey || !from) {
    console.log(
      "Email de compra aprobada omitido: falta configurar RESEND_API_KEY o MAIL_FROM."
    );
    return { ok: false, skipped: true };
  }

  const montoFormateado = formatearMonto(montoTotal, moneda);
  const ordenSegura = escaparHtml(ordenId);
  const pagoSeguro = escaparHtml(pagoId);
  const montoSeguro = montoFormateado ? escaparHtml(montoFormateado) : null;

  const html = `
    <div style="font-family: Arial, sans-serif; color: #17211d; line-height: 1.5;">
      <h1 style="margin-bottom: 12px;">Tu compra fue aprobada</h1>
      <p>Recibimos la confirmacion del pago de tu compra en LAMA Payments.</p>
      <div style="background: #f2f6ef; border-radius: 12px; padding: 16px; margin: 20px 0;">
        <p style="margin: 0 0 8px;"><strong>Orden:</strong> ${ordenSegura}</p>
        <p style="margin: 0 0 8px;"><strong>Pago:</strong> ${pagoSeguro}</p>
        ${
          montoSeguro
            ? `<p style="margin: 0;"><strong>Total:</strong> ${montoSeguro}</p>`
            : ""
        }
      </div>
      <p>El vendedor ya fue notificado para continuar con la preparacion de la orden.</p>
      <p style="color: #607066; font-size: 13px;">Si no reconoces esta compra, contacta al soporte de LAMA.</p>
    </div>
  `;

  const text = [
    "Tu compra fue aprobada.",
    `Orden: ${ordenId}`,
    `Pago: ${pagoId}`,
    montoFormateado ? `Total: ${montoFormateado}` : null,
    "El vendedor ya fue notificado para continuar con la preparacion de la orden.",
  ]
    .filter(Boolean)
    .join("\n");

  const res = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: email,
      subject: `Tu compra ${ordenId} fue aprobada`,
      html,
      text,
    }),
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    console.error("No se pudo enviar el email de compra aprobada:", {
      status: res.status,
      response: data,
      orden_id: ordenId,
    });

    return { ok: false, skipped: false };
  }

  console.log("Email de compra aprobada enviado:", {
    orden_id: ordenId,
    email,
    response: data,
  });

  return { ok: true, skipped: false };
}
