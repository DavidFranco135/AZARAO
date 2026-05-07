/**
 * Cloudflare Pages Function — POST /api/mp-process-payment
 * Processa pagamento via token gerado pelo Checkout Bricks (cartão ou PIX).
 */

interface Env {
  MP_ACCESS_TOKEN: string;
}

interface PaymentBody {
  token?:             string;   // cartão tokenizado pelo Brick
  payment_method_id:  string;   // ex: "visa", "pix"
  transaction_amount: number;
  installments?:      number;
  issuer_id?:         string;
  orderId:            string;
  raffleId:           string;
  payerEmail:         string;
  payerCpf:           string;
  payerName:          string;
}

export const onRequestPost: PagesFunction<Env> = async (ctx) => {
  try {
    const body = await ctx.request.json() as PaymentBody;

    const nameParts = body.payerName.trim().split(" ");
    const firstName = nameParts[0];
    const lastName  = nameParts.slice(1).join(" ") || firstName;

    const payment: Record<string, unknown> = {
      transaction_amount: parseFloat(body.transaction_amount.toFixed(2)),
      payment_method_id:  body.payment_method_id,
      external_reference: body.orderId,
      description:        "Cotas - AZARÃO",
      payer: {
        email:      body.payerEmail,
        first_name: firstName,
        last_name:  lastName,
        identification: {
          type:   "CPF",
          number: body.payerCpf.replace(/\D/g, ""),
        },
      },
    };

    // Campos extras apenas para cartão
    if (body.token) {
      payment.token        = body.token;
      payment.installments = body.installments ?? 1;
      if (body.issuer_id) payment.issuer_id = body.issuer_id;
    }

    const mpRes = await fetch("https://api.mercadopago.com/v1/payments", {
      method:  "POST",
      headers: {
        Authorization:       `Bearer ${ctx.env.MP_ACCESS_TOKEN}`,
        "Content-Type":      "application/json",
        "X-Idempotency-Key": body.orderId,
      },
      body: JSON.stringify(payment),
    });

    const data = await mpRes.json() as {
      id:                    number;
      status:                string;
      status_detail:         string;
      point_of_interaction?: {
        transaction_data?: {
          qr_code?:        string;
          qr_code_base64?: string;
        };
      };
    };

    // PIX — retorna QR code
    if (body.payment_method_id === "pix") {
      return Response.json({
        status:    data.status,
        paymentId: data.id,
        qrCode:    data.point_of_interaction?.transaction_data?.qr_code,
        qrBase64:  data.point_of_interaction?.transaction_data?.qr_code_base64,
      });
    }

    // Cartão
    return Response.json({
      status:       data.status,
      statusDetail: data.status_detail,
      paymentId:    data.id,
    });

  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 });
  }
};
