/**
 * Cloudflare Pages Function
 * Rota: POST /api/mp-preference
 *
 * Cria uma preferência de pagamento no Mercado Pago e retorna o link de checkout.
 * Configure a variável de ambiente MP_ACCESS_TOKEN no painel do Cloudflare Pages.
 */

interface Env {
  MP_ACCESS_TOKEN: string;
}

interface PreferenceBody {
  orderId: string;
  raffleId: string;
  raffleTitle: string;
  quantity: number;
  unitPrice: number;
  payerEmail: string;
  payerName: string;
  commissionPercentage: number;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const body = (await context.request.json()) as PreferenceBody;

    const {
      orderId,
      raffleId,
      raffleTitle,
      quantity,
      unitPrice,
      payerEmail,
      payerName,
      commissionPercentage,
    } = body;

    const baseUrl =
      new URL(context.request.url).origin;

    // Calcula marketplace_fee (comissão da plataforma em R$)
    const totalAmount = quantity * unitPrice;
    const marketplaceFee = parseFloat(
      (totalAmount * (commissionPercentage / 100)).toFixed(2)
    );

    const preference = {
      items: [
        {
          id: raffleId,
          title: `${quantity}x cota(s) — ${raffleTitle}`,
          quantity: 1,
          unit_price: totalAmount,
          currency_id: "BRL",
        },
      ],
      payer: {
        email: payerEmail,
        name: payerName,
      },
      // Comissão da plataforma (GGRIFAS Admin recebe)
      marketplace_fee: marketplaceFee,
      back_urls: {
        success: `${baseUrl}/raffle/${raffleId}?mp_status=approved&order_id=${orderId}`,
        failure: `${baseUrl}/raffle/${raffleId}?mp_status=failure&order_id=${orderId}`,
        pending: `${baseUrl}/raffle/${raffleId}?mp_status=pending&order_id=${orderId}`,
      },
      auto_return: "approved",
      external_reference: orderId,
      statement_descriptor: "GGRIFAS",
    };

    const mpResponse = await fetch(
      "https://api.mercadopago.com/checkout/preferences",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${context.env.MP_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(preference),
      }
    );

    if (!mpResponse.ok) {
      const err = await mpResponse.text();
      return Response.json(
        { error: "Falha ao criar preferência MP", detail: err },
        { status: 500 }
      );
    }

    const mpData = (await mpResponse.json()) as {
      id: string;
      init_point: string;
      sandbox_init_point: string;
    };

    return Response.json({
      preferenceId: mpData.id,
      checkoutUrl: mpData.init_point,
      sandboxUrl: mpData.sandbox_init_point,
    });
  } catch (err) {
    return Response.json(
      { error: "Erro interno", detail: String(err) },
      { status: 500 }
    );
  }
};
