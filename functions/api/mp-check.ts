interface Env { MP_ACCESS_TOKEN: string; }

export const onRequestGet: PagesFunction<Env> = async (ctx) => {
  const token = ctx.env.MP_ACCESS_TOKEN;
  if (!token) {
    return new Response(JSON.stringify({ ok: false, error: "MP_ACCESS_TOKEN não configurado" }), {
      status: 200, headers: { "Content-Type": "application/json" },
    });
  }

  const res  = await fetch("https://api.mercadopago.com/v1/account", {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json() as Record<string, unknown>;

  return new Response(JSON.stringify(
    res.ok
      ? { ok: true, tokenPrefix: token.slice(0,20)+"...", accountId: data.id, email: data.email, siteId: data.site_id, status: data.status }
      : { ok: false, status: res.status, error: data }
  ), { status: 200, headers: { "Content-Type": "application/json" } });
};
