/**
 * Cliente AbacatePay minimal (sem SDK).
 *
 * Modo dev vs prod é determinado pela API key — mesma base URL.
 * Toda response segue { data, error, success }.
 *
 * Docs: https://docs.abacatepay.com
 */

const BASE_URL = "https://api.abacatepay.com";

// Envelope AbacatePay: { data, error }. NÃO existe campo `success` — sucesso é
// res.ok sem `error` (confirmado no SDK oficial, que decide por response.ok).
// Erros vêm em `error` (visto em prod) ou `message` (usado pelo SDK).
interface AbacateResponse<T> {
  data?: T | null;
  error?: string | null;
  message?: string | null;
}

interface AbacateCustomer {
  name?: string;
  email?: string;
  taxId?: string;
  cellphone?: string;
}

interface AbacateMetadata {
  [key: string]: string | number | boolean;
}

interface CreatePixPayload {
  amount: number; // centavos
  description?: string;
  expiresIn?: number; // segundos
  customer?: AbacateCustomer;
  metadata?: AbacateMetadata;
}

export interface PixCharge {
  id: string;
  amount: number;
  status: "PENDING" | "PAID" | "CANCELLED" | "EXPIRED" | "REFUNDED";
  devMode: boolean;
  brCode: string;
  brCodeBase64: string;
  platformFee: number;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
  metadata?: AbacateMetadata;
}

function getApiKey(): string {
  const key = process.env.ABACATEPAY_API_KEY;
  if (!key) throw new Error("Missing env: ABACATEPAY_API_KEY");
  return key;
}

async function request<T>(
  method: "GET" | "POST",
  path: string,
  body?: unknown,
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${getApiKey()}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });

  const json = (await res.json()) as AbacateResponse<T>;
  if (!res.ok || json.error) {
    throw new Error(
      json.error ?? json.message ?? `AbacatePay ${method} ${path} failed (${res.status})`,
    );
  }
  // Tolera tanto o envelope { data } quanto o recurso retornado "flat".
  return (json.data ?? (json as unknown)) as T;
}

export async function createPixCharge(payload: CreatePixPayload): Promise<PixCharge> {
  // Endpoint v2 transparents: a chave da conta é v2 (chamar /v1/pixQrCode/create
  // dá "API key version mismatch"). Estrutura { method, data }.
  // Docs: https://docs.abacatepay.com/pages/transparents/create
  // Só `method` e `data.amount` são obrigatórios; o resto é opcional.
  const data: Record<string, unknown> = {
    amount: payload.amount,
    description: payload.description,
    expiresIn: payload.expiresIn,
    metadata: payload.metadata,
  };
  // `customer` só vai se tiver cellphone: customer incompleto faz `data` falhar
  // o schema do transparents ("Value should be one of 'object', 'object'") — era
  // a causa original. Sem telefone no cadastro, omitimos; o pagador se
  // identifica no app do banco ao pagar o PIX.
  if (payload.customer?.cellphone) {
    data.customer = payload.customer;
  }
  return request<PixCharge>("POST", "/v2/transparents/create", { method: "PIX", data });
}

/**
 * Public HMAC key documented by AbacatePay. Yes, it's the same for all clients —
 * security comes from the URL-query `webhookSecret` (configured per webhook in
 * the dashboard) combined with the signature check.
 */
const ABACATEPAY_PUBLIC_KEY =
  "t9dXRhHHo3yDEj5pVDYz0frf7q6bMKyMRmxxCPIPp3RCplBfXRxqlC6ZpiWmOqj4L63qEaeUOtrCI8P0VMUgo6iIga2ri9ogaHFs0WIIywSMg0q7RmBfybe1E5XJcfC4IW3alNqym0tXoAKkzvfEjZxV6bE0oG2zJrNNYmUCKZyV0KZ3JS8Votf9EAWWYdiDkMkpbMdPggfh1EqHlVkMiTady6jOR3hyzGEHrIz2Ret0xHKMbiqkr9HS1JhNHDX9";

/**
 * Verifica HMAC do webhook contra a chave pública AbacatePay.
 */
export async function verifyWebhookSignature(
  rawBody: string,
  signatureFromHeader: string,
): Promise<boolean> {
  const { createHmac, timingSafeEqual } = await import("node:crypto");
  const expected = createHmac("sha256", ABACATEPAY_PUBLIC_KEY)
    .update(Buffer.from(rawBody, "utf8"))
    .digest("base64");
  const a = Buffer.from(expected);
  const b = Buffer.from(signatureFromHeader);
  return a.length === b.length && timingSafeEqual(a, b);
}

export const PREMIUM_PRICE_CENTS = 2490; // R$ 24,90
export const PREMIUM_DISCOUNT_CENTS = 500; // R$ 5,00 desconto com cupom
