/**
 * Cloudflare Pages Function — POST /api/mp-pix
 * Cria um pagamento PIX e retorna o QR Code para exibir na tela.
 * O comprador NÃO precisa ter conta no Mercado Pago.
 */

interface Env {
  MP_ACCESS_TOKEN: string;
}

interface PixBody {
  orderId:       string;
  amount:        number;
  payerEmail:    string;
  payerName:     string;
  payerCpf:      string;
}

export const onRequestPost: PagesFunction<Env> = async (ctx) => {
  try {
    const { orderId, amount, payerEmail, payerName, payerCpf } =
      await ctx.request.json() as PixBody;

    if (!ctx.env.MP_ACCESS_TOKEN) {
      return Response.json({ error: "MP_ACCESS_TOKEN não configurado." }, { status: 500 });
    }

    // Separa primeiro e último nome
    const nameParts = payerName.trim().split(" ");
    const firstName = nameParts[0];
    const lastName  = nameParts.slice(1).join(" ") || firstName;

    const payment = {
      transaction_amount:  parseFloat(amount.toFixed(2)),
      payment_method_id:   "pix",
      external_reference:  orderId,
      description:         `Cotas - AZARÃO`,
      payer: {
        email:      payerEmail,
        first_name: firstName,
        last_name:  lastName,
        identification: {
          type:   "CPF",
          number: payerCpf.replace(/\D/g, ""),
        },
      },
    };

    const mpRes = await fetch("https://api.mercadopago.com/v1/payments", {
      method:  "POST",
      headers: {
        Authorization:          `Bearer ${ctx.env.MP_ACCESS_TOKEN}`,
        "Content-Type":         "application/json",
        "X-Idempotency-Key":    orderId,
      },
      body: JSON.stringify(payment),
    });

    if (!mpRes.ok) {
      const err = await mpRes.text();
      return Response.json({ error: "Erro MP", detail: err }, { status: 500 });
    }

    const data = await mpRes.json() as {
      id:                    number;
      status:                string;
      point_of_interaction?: {
        transaction_data?: {
          qr_code?:        string;
          qr_code_base64?: string;
        };
      };
    };

    const qrCode    = data.point_of_interaction?.transaction_data?.qr_code;
    const qrBase64  = data.point_of_interaction?.transaction_data?.qr_code_base64;

    if (!qrCode) {
      return Response.json({ error: "QR Code não gerado pelo MP." }, { status: 500 });
    }

    return Response.json({
      paymentId:  data.id,
      status:     data.status,
      qrCode,
      qrBase64,
    });

  } catch (err) {
    return Response.json({ error: "Erro interno.", detail: String(err) }, { status: 500 });
  }
};
