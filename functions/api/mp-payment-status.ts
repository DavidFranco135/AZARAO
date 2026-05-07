/**
 * Cloudflare Pages Function — GET /api/mp-payment-status?id=XXX
 * Consulta o status de um pagamento MP para confirmar o PIX.
 */

interface Env { MP_ACCESS_TOKEN: string; }

export const onRequestGet: PagesFunction<Env> = async (ctx) => {
  const id = new URL(ctx.request.url).searchParams.get("id");
  if (!id) return Response.json({ error: "id obrigatório" }, { status: 400 });

  const res = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, {
    headers: { Authorization: `Bearer ${ctx.env.MP_ACCESS_TOKEN}` },
  });

  if (!res.ok) return Response.json({ error: "Erro MP" }, { status: 500 });
  const data = await res.json() as { status: string };
  return Response.json({ status: data.status });
};
