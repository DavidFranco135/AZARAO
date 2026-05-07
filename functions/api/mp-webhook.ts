/**
 * Cloudflare Pages Function
 * Caminho no repositório: functions/api/mp-webhook.ts
 * IMPORTANTE: o arquivo deve estar na pasta /functions/api/ na RAIZ do repositório
 */

interface Env {
  MP_ACCESS_TOKEN: string;
  FIREBASE_PROJECT_ID: string;
  FIREBASE_API_KEY: string;
}

async function updateFirestore(orderId: string, paymentId: string, env: Env) {
  const url = `https://firestore.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents/orders/${orderId}?updateMask.fieldPaths=status&updateMask.fieldPaths=mpPaymentId`;
  await fetch(url, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": env.FIREBASE_API_KEY,
    },
    body: JSON.stringify({
      fields: {
        status:      { stringValue: "paid" },
        mpPaymentId: { stringValue: String(paymentId) },
      },
    }),
  });
}

async function processPaymentId(id: string, env: Env) {
  if (!id || id === "123456" || id === "0") return;
  const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, {
    headers: { Authorization: `Bearer ${env.MP_ACCESS_TOKEN}` },
  });
  if (!mpRes.ok) return;
  const payment = await mpRes.json() as { status: string; external_reference: string; id: number };
  if (payment.status !== "approved" || !payment.external_reference) return;
  await updateFirestore(payment.external_reference, String(payment.id), env);
}

export const onRequestGet: PagesFunction<Env> = async (ctx) => {
  const url = new URL(ctx.request.url);
  const topic = url.searchParams.get("topic");
  const id    = url.searchParams.get("id");
  if (topic === "payment" && id) {
    ctx.waitUntil(processPaymentId(id, ctx.env));
  }
  return new Response(JSON.stringify({ status: "ok" }), {
    status: 200,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  });
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
      if (body?.type === "payment" && body?.data?.id) {
        ctx.waitUntil(processPaymentId(String(body.data.id), ctx.env));
      }
    }
  } catch { /* ignora erros de parse */ }

  return new Response(JSON.stringify({ status: "ok" }), {
    status: 200,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  });
};

// Fallback para qualquer outro método
export const onRequest: PagesFunction<Env> = async () => {
  return new Response(JSON.stringify({ status: "ok" }), {
    status: 200,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  });
};
