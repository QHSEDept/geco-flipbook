import type { Context, Config } from "@netlify/functions";
import { getStore } from "@netlify/blobs";

export default async (req: Request, context: Context) => {
  let password: string | null = null;
  if (req.method === "POST") {
    const body = await req.json().catch(() => ({}));
    password = body.password;
  } else {
    password = new URL(req.url).searchParams.get("password");
  }

  const expectedPassword = Netlify.env.get("FLIPBOOK_PASSWORD");
  if (!expectedPassword || password !== expectedPassword) {
    return new Response(JSON.stringify({ error: "Incorrect password" }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }

  const manifestStore = getStore("flipbooks");
  const { blobs } = await manifestStore.list();

  const origin = new URL(req.url).origin;
  const items = await Promise.all(
    blobs.map(async (b) => {
      const manifest = await manifestStore.get(b.key, { type: "json" });
      return manifest
        ? { ...manifest, url: `${origin}/f/${manifest.slug}` }
        : null;
    })
  );

  const list = items
    .filter(Boolean)
    .sort((a: any, b: any) => (a.createdAt < b.createdAt ? 1 : -1));

  return new Response(JSON.stringify({ flipbooks: list }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
};

export const config: Config = {
  path: "/api/list-flipbooks",
};
