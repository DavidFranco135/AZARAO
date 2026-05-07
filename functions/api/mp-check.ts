/**
 * GET /api/mp-check
 * Verifica se o token MP está configurado e válido.
 * USE APENAS PARA DIAGNÓSTICO — remova depois de testar!
 */
interface Env { MP_ACCESS_TOKEN: string; }

export const onRequestGet: PagesFunction<Env> = async (ctx) => {
  const token = ctx.env.MP_ACCESS_TOKEN;
  if (!token) return Response.json({ ok: false, error: "MP_ACCESS_TOKEN não configurado no Cloudflare" });

  // Testa o token buscando dados da conta
  const res = await fetch("https://api.mercadopago.com/v1/account", {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json() as Record<string, unknown>;

  if (!res.ok) return Response.json({ ok: false, status: res.status, error: data });

  return Response.json({
    ok:          true,
    tokenPrefix: token.slice(0, 20) + "...",
    accountId:   data.id,
    email:       data.email,
    siteId:      data.site_id, // deve ser "MLB" para Brasil
    status:      data.status,
  });
};
