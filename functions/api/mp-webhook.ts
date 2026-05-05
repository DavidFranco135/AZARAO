/**
 * Cloudflare Pages Function
 * Arquivo: functions/api/mp-webhook.ts  (raiz do repositório)
 * Handler universal — aceita GET, POST e qualquer método do MP IPN/Webhook
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
        status: { stringValue: "paid" },
        mpPaymentId: { stringValue: String(paymentId) },
      },
    }),
  });
}

async function processPaymentId(id: string, env: Env) {
  // ID "123456" é teste do painel MP — ignora sem chamar a API
  if (id === "123456" || id === "0") return;

  const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, {
    headers: { Authorization: `Bearer ${env.MP_ACCESS_TOKEN}` },
  });
  if (!mpRes.ok) return;

  const payment = (await mpRes.json()) as {
    status: string;
    external_reference: string;
    id: number;
  };

  if (payment.status !== "approved" || !payment.external_reference) return;

  await updateFirestore(payment.external_reference, String(payment.id), env);
}

// onRequest trata TODOS os métodos HTTP (GET, POST, etc.)
export const onRequest: PagesFunction<Env> = async (context) => {
  // Sempre responde 200 imediatamente — MP para de reenviar ao receber 200
  const respond200 = new Response(JSON.stringify({ status: "ok" }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });

  try {
    const reqUrl = new URL(context.request.url);
    const method = context.request.method.toUpperCase();

    let paymentId: string | null = null;

    // Formato 1 — IPN via query params: ?topic=payment&id=XXX  (GET ou POST)
    const topicParam = reqUrl.searchParams.get("topic");
    const idParam = reqUrl.searchParams.get("id");

    if (topicParam === "payment" && idParam) {
      paymentId = idParam;
    }

    // Formato 2 — Webhook novo via body JSON: { type: "payment", data: { id } }
    if (!paymentId && method === "POST") {
      try {
        const body = (await context.request.json()) as {
          type?: string;
          data?: { id?: string };
        };
        if (body?.type === "payment" && body?.data?.id) {
          paymentId = String(body.data.id);
        }
      } catch {
        // body vazio ou não-JSON — ignora
      }
    }

    // Processa em background sem segurar a resposta
    if (paymentId) {
      context.waitUntil(processPaymentId(paymentId, context.env));
    }
  } catch (err) {
    console.error("Webhook error:", err);
  }

  return respond200;
};
