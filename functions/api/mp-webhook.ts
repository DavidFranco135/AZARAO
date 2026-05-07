/**
 * Cloudflare Pages Function — functions/api/mp-webhook.ts
 * Recebe notificações do Mercado Pago e confirma pedidos no Firestore.
 * Ao confirmar: atualiza order.status = "paid" E adiciona números ao raffle.soldNumbers
 */

interface Env {
  MP_ACCESS_TOKEN:    string;
  FIREBASE_PROJECT_ID: string;
  FIREBASE_API_KEY:   string;
}

const BASE = (projectId: string) =>
  `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;

// Busca documento do Firestore via REST
async function getDoc(path: string, env: Env): Promise<Record<string, unknown> | null> {
  const res = await fetch(`${BASE(env.FIREBASE_PROJECT_ID)}/${path}`, {
    headers: { "x-goog-api-key": env.FIREBASE_API_KEY },
  });
  if (!res.ok) return null;
  return (await res.json()) as Record<string, unknown>;
}

// Converte campo Firestore para valor JS
function fromFirestoreValue(val: Record<string, unknown>): unknown {
  if ("stringValue"  in val) return val.stringValue;
  if ("integerValue" in val) return Number(val.integerValue);
  if ("doubleValue"  in val) return Number(val.doubleValue);
  if ("booleanValue" in val) return val.booleanValue;
  if ("arrayValue"   in val) {
    const arr = val.arrayValue as { values?: Record<string, unknown>[] };
    return (arr.values ?? []).map(fromFirestoreValue);
  }
  if ("mapValue" in val) {
    const map = val.mapValue as { fields?: Record<string, Record<string, unknown>> };
    const obj: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(map.fields ?? {})) obj[k] = fromFirestoreValue(v);
    return obj;
  }
  return null;
}

// Extrai campos de um documento Firestore
function parseDoc(doc: Record<string, unknown>): Record<string, unknown> {
  const fields = doc.fields as Record<string, Record<string, unknown>> ?? {};
  const result: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(fields)) result[k] = fromFirestoreValue(v);
  return result;
}

async function confirmOrder(orderId: string, paymentId: string, env: Env) {
  // Verifica se já foi confirmado
  const orderDoc = await getDoc(`orders/${orderId}`, env);
  if (!orderDoc) { console.error("Order not found:", orderId); return; }
  const order = parseDoc(orderDoc);
  if (order.status === "paid") return; // idempotente

  // Os números já foram reservados no soldNumbers na criação do pedido (transação atômica).
  // O webhook apenas confirma o status do pedido para "paid".
  await fetch(
    `${BASE(env.FIREBASE_PROJECT_ID)}/orders/${orderId}` +
    `?updateMask.fieldPaths=status&updateMask.fieldPaths=mpPaymentId`,
    {
      method:  "PATCH",
      headers: { "Content-Type": "application/json", "x-goog-api-key": env.FIREBASE_API_KEY },
      body: JSON.stringify({
        fields: {
          status:      { stringValue: "paid" },
          mpPaymentId: { stringValue: String(paymentId) },
        },
      }),
    }
  );
  console.log(`Order ${orderId} confirmed as paid (payment ${paymentId})`);
}

async function processPaymentId(id: string, env: Env) {
  if (!id || id === "123456" || id === "0") return;

  const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, {
    headers: { Authorization: `Bearer ${env.MP_ACCESS_TOKEN}` },
  });
  if (!mpRes.ok) return;

  const payment = await mpRes.json() as {
    status:             string;
    external_reference: string;
    id:                 number;
  };

  if (payment.status !== "approved" || !payment.external_reference) return;
  await confirmOrder(payment.external_reference, String(payment.id), env);
}

const OK = new Response(JSON.stringify({ status: "ok" }), {
  status:  200,
  headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
});

export const onRequestGet: PagesFunction<Env> = async (ctx) => {
  const url   = new URL(ctx.request.url);
  const topic = url.searchParams.get("topic");
  const id    = url.searchParams.get("id");
  if (topic === "payment" && id) ctx.waitUntil(processPaymentId(id, ctx.env));
  return OK;
};

export const onRequestPost: PagesFunction<Env> = async (ctx) => {
  try {
    const url   = new URL(ctx.request.url);
    const topic = url.searchParams.get("topic");
    const id    = url.searchParams.get("id");
    if (topic === "payment" && id) {
      ctx.waitUntil(processPaymentId(id, ctx.env));
    } else {
      const body = await ctx.request.json() as { type?: string; data?: { id?: string } };
      if (body?.type === "payment" && body?.data?.id)
        ctx.waitUntil(processPaymentId(String(body.data.id), ctx.env));
    }
  } catch { /* ignora */ }
  return OK;
};

export const onRequest: PagesFunction<Env> = async () => OK;
