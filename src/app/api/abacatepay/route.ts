import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { verifyWebhookSignature } from "@/lib/abacate/client";
import { markChargePaid } from "@/lib/actions/premium";

function safeEqual(a: string, b: string): boolean {
  const A = Buffer.from(a);
  const B = Buffer.from(b);
  if (A.length !== B.length) return false;
  return timingSafeEqual(A, B);
}

/**
 * Webhook endpoint do AbacatePay.
 *
 * Configurar no dashboard como:
 *   https://<seu-app>.vercel.app/api/abacatepay?webhookSecret=<TROCAS_WEBHOOK_SECRET>
 *
 * Dois layers de segurança:
 * 1. Query param webhookSecret == env TROCAS_WEBHOOK_SECRET
 * 2. Header X-Webhook-Signature == HMAC-SHA256(body, ABACATEPAY_PUBLIC_KEY)
 */
export async function POST(request: Request) {
  const url = new URL(request.url);
  const queryparamSecret = url.searchParams.get("webhookSecret") ?? "";
  const expectedSecret = process.env.TROCAS_WEBHOOK_SECRET ?? "";

  if (!expectedSecret || !safeEqual(queryparamSecret, expectedSecret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rawBody = await request.text();
  const signature = request.headers.get("x-webhook-signature") ?? "";

  if (!signature || !(await verifyWebhookSignature(rawBody, signature))) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
  }

  let payload: { event?: string; data?: { id?: string; status?: string } };
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const event = payload.event ?? "";
  const chargeId = payload.data?.id;
  if (!chargeId) {
    return NextResponse.json({ received: true, skipped: "no chargeId" });
  }

  // Eventos de pagamento confirmado: billing.paid (PIX QR Code v1) ou
  // transparent.completed (v2 checkout transparente). Tratamos ambos.
  const isPaid =
    event === "billing.paid" ||
    event === "transparent.completed" ||
    payload.data?.status === "PAID";

  if (isPaid) {
    try {
      await markChargePaid(chargeId);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "unknown";
      console.error("[abacatepay webhook] markChargePaid failed:", msg);
      return NextResponse.json({ error: msg }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true, event, chargeId });
}
