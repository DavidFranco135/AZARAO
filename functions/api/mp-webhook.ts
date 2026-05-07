interface Env {
  MP_ACCESS_TOKEN:     string;
  FIREBASE_PROJECT_ID: string;
  FIREBASE_API_KEY:    string;
}

const base = (p: string) =>
  `https://firestore.googleapis.com/v1/projects/${p}/databases/(default)/documents`;

function fromVal(v: Record<string, unknown>): unknown {
  if ("stringValue"  in v) return v.stringValue;
  if ("integerValue" in v) return Number(v.integerValue);
  if ("booleanValue" in v) return v.booleanValue;
  if ("arrayValue"   in v) {
    const a = v.arrayValue as { values?: Record<string,unknown>[] };
    return (a.values ?? []).map(fromVal);
  }
  if ("mapValue" in v) {
    const m = v.mapValue as { fields?: Record<string,Record<string,unknown>> };
    const o: Record<string,unknown> = {};
    for (const [k, val] of Object.entries(m.fields ?? {})) o[k] = fromVal(val);
    return o;
  }
  return null;
}

function parseDoc(doc: Record<string,unknown>): Record<string,unknown> {
  const fields = doc.fields as Record<string,Record<string,unknown>> ?? {};
  const result: Record<string,unknown> = {};
  for (const [k,v] of Object.entries(fields)) result[k] = fromVal(v);
  return result;
}

async function getOrder(orderId: string, env: Env) {
  const res = await fetch(`${base(env.FIREBASE_PROJECT_ID)}/orders/${orderId}`, {
    headers: { "x-goog-api-key": env.FIREBASE_API_KEY },
  });
  if (!res.ok) return null;
  return parseDoc(await res.json() as Record<string,unknown>);
}

async function confirmOrder(orderId: string, paymentId: string, env: Env) {
  const order = await getOrder(orderId, env);
  if (!order || order.status === "paid") return;

  await fetch(
    `${base(env.FIREBASE_PROJECT_ID)}/orders/${orderId}` +
    `?updateMask.fieldPaths=status&updateMask.fieldPaths=mpPaymentId`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-goog-api-key": env.FIREBASE_API_KEY },
      body: JSON.stringify({
        fields: {
          status:      { stringValue: "paid" },
          mpPaymentId: { stringValue: String(paymentId) },
        },
      }),
    }
  );
}

async function processPaymentId(id: string, env: Env) {
  if (!id || id === "123456") return;
  const res = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, {
    headers: { Authorization: `Bearer ${env.MP_ACCESS_TOKEN}` },
  });
  if (!res.ok) return;
  const p = await res.json() as { status: string; external_reference: string; id: number };
  if (p.status === "approved" && p.external_reference) {
    await confirmOrder(p.external_reference, String(p.id), env);
  }
}

// ── Todos os handlers criam o Response DENTRO da função ──────────────────────

export const onRequestGet: PagesFunction<Env> = async (ctx) => {
  const url = new URL(ctx.request.url);
  const topic = url.searchParams.get("topic");
  const id    = url.searchParams.get("id");
  if (topic === "payment" && id) ctx.waitUntil(processPaymentId(id, ctx.env));
  return new Response(JSON.stringify({ status: "ok" }), {
    status: 200,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  });
};

export const onRequestPost: PagesFunction<Env> = async (ctx) => {
  try {
    const url   = new URL(ctx.request.url);
    const topic = url.searchParams.get("topic");
    const id    = url.searchParams.get("id");
    if (topic === "payment" && id) {
      ctx.waitUntil(processPaymentId(id, ctx.env));
    } else {
      const body = await ctx.request.json() as { type?: string; data?: { id?: string } };
      if (body?.type === "payment" && body?.data?.id) {
        ctx.waitUntil(processPaymentId(String(body.data.id), ctx.env));
      }
    }
  } catch { /* ignora */ }
  return new Response(JSON.stringify({ status: "ok" }), {
    status: 200,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  });
};

export const onRequest: PagesFunction<Env> = async () =>
  new Response(JSON.stringify({ status: "ok" }), {
    status: 200,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  });
