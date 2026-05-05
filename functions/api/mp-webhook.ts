/**
 * Cloudflare Pages Function
 * Arquivo: functions/api/mp-webhook.ts  (raiz do repositório)
 * Suporta IPN (GET) e Webhook (POST) do Mercado Pago
 *
 * Variáveis de ambiente necessárias no Cloudflare Pages:
 *   MP_ACCESS_TOKEN     → Access Token do Mercado Pago
 *   FIREBASE_PROJECT_ID → niklaus-b2b
 *   FIREBASE_API_KEY    → sua Web API Key do Firebase
 */

interface Env {
  MP_ACCESS_TOKEN: string;
  FIREBASE_PROJECT_ID: string;
  FIREBASE_API_KEY: string;
}

// Processa o pagamento e atualiza o Firestore
async function processPayment(paymentId: string, env: Env): Promise<Response> {
  // Busca detalhes do pagamento no Mercado Pago
  const mpRes = await fetch(
    `https://api.mercadopago.com/v1/payments/${paymentId}`,
    {
      headers: { Authorization: `Bearer ${env.MP_ACCESS_TOKEN}` },
    }
  );

  if (!mpRes.ok) {
    console.error("MP error:", await mpRes.text());
    // Retorna 200 para o MP não ficar reenviando — erro é no lado deles
    return new Response(JSON.stringify({ status: "mp_error" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  const payment = (await mpRes.json()) as {
    status: string;
    external_reference: string;
    id: number;
  };

  // Só processa pagamentos aprovados
  if (payment.status !== "approved") {
    return new Response(
      JSON.stringify({ status: "not_approved", mp_status: payment.status }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }

  const orderId = payment.external_reference;
  if (!orderId) {
    return new Response(JSON.stringify({ status: "no_reference" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Atualiza pedido no Firestore via REST
  const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents/orders/${orderId}?updateMask.fieldPaths=status&updateMask.fieldPaths=mpPaymentId`;

  const fbRes = await fetch(firestoreUrl, {
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

  if (!fbRes.ok) {
    console.error("Firestore error:", await fbRes.text());
    return new Response(JSON.stringify({ status: "firestore_error" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ status: "ok", orderId }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

// ── IPN: Mercado Pago envia GET ?topic=payment&id=123456 ──────────────────────
export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const url = new URL(context.request.url);
    const topic = url.searchParams.get("topic");
    const id = url.searchParams.get("id");

    // Sempre retorna 200 para o teste do MP não reclamar
    if (!topic || !id) {
      return new Response(JSON.stringify({ status: "ok" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (topic !== "payment") {
      return new Response(JSON.stringify({ status: "ignored" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    return await processPayment(id, context.env);
  } catch (err) {
    console.error("IPN GET error:", err);
    // Retorna 200 mesmo com erro — o MP para de reenviar ao receber 200
    return new Response(JSON.stringify({ status: "error", detail: String(err) }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
};

// ── Webhook: Mercado Pago envia POST com JSON ────────────────────────────────
export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const body = (await context.request.json()) as {
      type: string;
      data: { id: string };
    };

    if (body.type !== "payment") {
      return new Response(JSON.stringify({ status: "ignored" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    return await processPayment(body.data.id, context.env);
  } catch (err) {
    console.error("Webhook POST error:", err);
    return new Response(JSON.stringify({ status: "error", detail: String(err) }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
};

// ── OPTIONS para CORS ─────────────────────────────────────────────────────────
export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    },
  });
};
