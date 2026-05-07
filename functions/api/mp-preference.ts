/**
 * Cloudflare Pages Function — POST /api/mp-preference
 * Cria preferência de pagamento no Mercado Pago e retorna URL de checkout.
 *
 * Variáveis de ambiente necessárias no Cloudflare Pages:
 *   MP_ACCESS_TOKEN  → seu Access Token de PRODUÇÃO do Mercado Pago
 *                      (começa com APP_USR- para produção)
 */

interface Env {
  MP_ACCESS_TOKEN: string;
}

interface PreferenceBody {
  orderId:             string;
  raffleId:            string;
  raffleTitle:         string;
  quantity:            number;
  unitPrice:           number;
  payerEmail:          string;
  payerName:           string;
  commissionPercentage: number;
}

export const onRequestPost: PagesFunction<Env> = async (ctx) => {
  try {
    const body = await ctx.request.json() as PreferenceBody;
    const { orderId, raffleId, raffleTitle, quantity, unitPrice, payerEmail, payerName } = body;

    if (!ctx.env.MP_ACCESS_TOKEN) {
      return Response.json({ error: "MP_ACCESS_TOKEN não configurado no Cloudflare." }, { status: 500 });
    }

    const origin     = new URL(ctx.request.url).origin;
    const totalAmount = parseFloat((quantity * unitPrice).toFixed(2));

    const preference = {
      items: [
        {
          id:          raffleId,
          title:       `${quantity}x cota(s) — ${raffleTitle}`,
          quantity:    1,
          unit_price:  totalAmount,
          currency_id: "BRL",
        },
      ],
      payer: {
        email: payerEmail,
        name:  payerName,
      },
      back_urls: {
        success: `${origin}/raffle/${raffleId}?mp_status=approved&order_id=${orderId}`,
        failure: `${origin}/raffle/${raffleId}?mp_status=failure&order_id=${orderId}`,
        pending: `${origin}/raffle/${raffleId}?mp_status=pending&order_id=${orderId}`,
      },
      auto_return:          "approved",
      external_reference:   orderId,
      statement_descriptor: "AZARAO",
      // Expira em 30 minutos para não bloquear cotas indefinidamente
      expires:              true,
      expiration_date_to:   new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    };

    const mpRes = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method:  "POST",
      headers: {
        Authorization:  `Bearer ${ctx.env.MP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(preference),
    });

    if (!mpRes.ok) {
      const errText = await mpRes.text();
      console.error("MP API error:", mpRes.status, errText);
      return Response.json(
        { error: "Erro ao criar preferência no Mercado Pago.", detail: errText },
        { status: 500 }
      );
    }

    const mpData = await mpRes.json() as {
      id: string;
      init_point: string;
      sandbox_init_point: string;
    };

    return Response.json({
      preferenceId: mpData.id,
      checkoutUrl:  mpData.init_point,        // produção
      sandboxUrl:   mpData.sandbox_init_point, // teste
    });

  } catch (err) {
    console.error("mp-preference error:", err);
    return Response.json({ error: "Erro interno.", detail: String(err) }, { status: 500 });
  }
};
