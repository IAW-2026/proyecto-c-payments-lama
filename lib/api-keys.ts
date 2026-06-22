import { timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";

type ServicioApi =
  | "admin"
  | "seller"
  | "shipping"
  | "analytics"
  | "mercadopago";

const variablesPorServicio: Record<ServicioApi, string[]> = {
  admin: ["PAYMENTS_API_KEY", "CONTROL_PLANE_API_KEY", "PAYMENTS_ADMIN_API_KEY"],
  seller: ["SELLER_API_KEY", "PAYMENTS_SELLER_API_KEY", "SELLER_APP_API_KEY"],
  shipping: [
    "SHIPPING_API_KEY",
    "PAYMENTS_SHIPPING_API_KEY",
    "SHIPPING_APP_API_KEY",
  ],
  analytics: ["ANALYTICS_API_KEY"],
  mercadopago: ["PAYMENTS_MERCADO_PAGO_WEBHOOK_KEY"],
};

export function obtenerApiKeyServicio(servicio: ServicioApi) {
  for (const variable of variablesPorServicio[servicio]) {
    const value = process.env[variable]?.trim();

    if (value) {
      return value;
    }
  }

  return null;
}

export function obtenerPaymentsApiKey() {
  return process.env.PAYMENTS_API_KEY?.trim() || null;
}

function compararApiKeys(apiKeyRecibida: string, apiKeyEsperada: string) {
  const recibida = Buffer.from(apiKeyRecibida);
  const esperada = Buffer.from(apiKeyEsperada);

  return (
    recibida.length === esperada.length &&
    timingSafeEqual(recibida, esperada)
  );
}

function obtenerApiKeyDeRequest(req: NextRequest) {
  const authorization = req.headers.get("authorization") || "";

  if (authorization.toLowerCase().startsWith("bearer ")) {
    return authorization.slice(7).trim();
  }

  return (
    req.headers.get("x-api-key")?.trim() ||
    req.nextUrl.searchParams.get("api_key")?.trim() ||
    ""
  );
}

export function validarApiKeyServicio(
  req: NextRequest,
  serviciosPermitidos: ServicioApi[],
  { requerida = true }: { requerida?: boolean } = {}
): { servicio: ServicioApi | null; response: NextResponse | null } {
  const apiKeyRecibida = obtenerApiKeyDeRequest(req);

  if (!apiKeyRecibida && !requerida) {
    return { servicio: null, response: null };
  }

  if (!apiKeyRecibida) {
    return {
      servicio: null,
      response: NextResponse.json(
        { error: "Falta API key del servicio" },
        { status: 401 }
      ),
    };
  }

  for (const servicio of serviciosPermitidos) {
    const apiKeyEsperada = obtenerApiKeyServicio(servicio);

    if (!apiKeyEsperada) {
      continue;
    }

    if (compararApiKeys(apiKeyRecibida, apiKeyEsperada)) {
      return { servicio, response: null };
    }
  }

  const hayAlgunaKeyConfigurada = serviciosPermitidos.some((servicio) =>
    Boolean(obtenerApiKeyServicio(servicio))
  );

  return {
    servicio: null,
    response: NextResponse.json(
      {
        error: hayAlgunaKeyConfigurada
          ? "API key invalida para este servicio"
          : "Falta configurar la API key del servicio",
      },
      { status: hayAlgunaKeyConfigurada ? 401 : 500 }
    ),
  };
}

export function obtenerMercadoPagoWebhookApiKey() {
  return obtenerApiKeyServicio("mercadopago");
}
