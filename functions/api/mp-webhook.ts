/**
 * Cloudflare Pages Function — CORRIGIDO
 * Arquivo: functions/api/mp-webhook.ts  (raiz do repositório)
 * Rota: POST /api/mp-webhook
 *
 * Recebe notificações de pagamento do Mercado Pago.
 * Configure no painel MP: Configurações → Notificações IPN → URL do webhook.
 *
 * Variáveis de ambiente necessárias:
 *   MP_ACCESS_TOKEN — seu Access Token do Mercado Pago
 *   FIREBASE_API_KEY — sua Web API Key do Firebase
 *   FIREBASE_PROJECT_ID — ID do projeto Firebase
 */

interface Env {
  MP_ACCESS_TOKEN: string;
  FIREBASE_API_KEY: string;
  FIREBASE_PROJECT_ID: string;
}

interface MPNotification {
  type: string;
  data: { id: string };
}

interface MPPayment {
  status: string;
  external_reference: string; // orderId
  id: number;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const body = (await context.request.json()) as MPNotification;

    // Só processa notificações de pagamento
    if (body.type !== "payment") {
      return new Response("ignored", { status: 200 });
    }

    const paymentId = body.data.id;

    // Busca detalhes do pagamento no MP
    const mpRes = await fetch(
      `https://api.mercadopago.com/v1/payments/${paymentId}`,
      {
        headers: {
          Authorization: `Bearer ${context.env.MP_ACCESS_TOKEN}`,
        },
      }
    );

    if (!mpRes.ok) return new Response("mp error", { status: 500 });

    const payment = (await mpRes.json()) as MPPayment;

    // Só confirma se o pagamento foi aprovado
    if (payment.status !== "approved") {
      return new Response("not approved", { status: 200 });
    }

    const orderId = payment.external_reference;

    // Atualiza o pedido no Firestore via REST API (sem SDK)
    const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${context.env.FIREBASE_PROJECT_ID}/databases/(default)/documents/orders/${orderId}?updateMask.fieldPaths=status&updateMask.fieldPaths=mpPaymentId&key=${context.env.FIREBASE_API_KEY}`;

    await fetch(firestoreUrl, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fields: {
          status: { stringValue: "paid" },
          mpPaymentId: { stringValue: String(paymentId) },
        },
      }),
    });

    return new Response("ok", { status: 200 });
  } catch (err) {
    console.error("Webhook error:", err);
    return new Response("error", { status: 500 });
  }
};
