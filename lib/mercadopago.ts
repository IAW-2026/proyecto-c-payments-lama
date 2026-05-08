import { MercadoPagoConfig, Preference, Payment } from "mercadopago";

const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;

if (!accessToken) {
  throw new Error("Falta MERCADO_PAGO_ACCESS_TOKEN en .env.local");
}

export const mercadopagoClient = new MercadoPagoConfig({
  accessToken,
});

export const preferenceClient = new Preference(mercadopagoClient);

export const paymentClient = new Payment(mercadopagoClient);