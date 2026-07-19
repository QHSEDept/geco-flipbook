import type { Context, Config } from "@netlify/functions";
import { getStore } from "@netlify/blobs";

export default async (req: Request, context: Context) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const body = await req.json().catch(() => ({}));
  const expectedPassword = process.env.FLIPBOOK_PASSWORD;
  if (!expectedPassword || body.password !== expectedPassword) {
    return new Response(JSON.stringify({ error: "Incorrect password" }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }

  const slug: string = body.slug;
  if (!slug) {
    return new Response(JSON.stringify({ error: "Missing slug" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  const manifestStore = getStore("flipbooks");
  const assetStore = getStore("flipbook-assets");

  const manifest = await manifestStore.get(slug, { type: "json" });
  if (manifest) {
    for (let i = 0; i < manifest.imageCount; i++) {
      await assetStore.delete(`${slug}/${i}`);
    }
  }
  await manifestStore.delete(slug);

  return new Response(JSON.stringify({ deleted: slug }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
};

export const config: Config = {
  path: "/api/delete-flipbook",
};
