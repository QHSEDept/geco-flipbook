import type { Context, Config } from "@netlify/functions";
import { getStore } from "@netlify/blobs";

function slugify(title: string) {
  return (title || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 40);
}

function randomId(len = 6) {
  const chars = "abcdefghijkmnpqrstuvwxyz23456789";
  let out = "";
  for (let i = 0; i < len; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

export default async (req: Request, context: Context) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  const expectedPassword = Netlify.env.get("FLIPBOOK_PASSWORD");
  if (!expectedPassword || body.password !== expectedPassword) {
    return new Response(JSON.stringify({ error: "Incorrect password" }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }

  const images: { filename?: string; dataBase64: string }[] = body.images;
  if (!Array.isArray(images) || images.length === 0) {
    return new Response(JSON.stringify({ error: "No images provided" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  const title: string = (body.title || "GECO Flipbook").toString().slice(0, 80);
  const slugBase = slugify(title);
  const slug = (slugBase ? slugBase + "-" : "") + randomId();

  const assetStore = getStore("flipbook-assets");
  const manifestStore = getStore("flipbooks");

  // Store each image as its own blob: flipbook-assets store, key "{slug}/{index}"
  for (let i = 0; i < images.length; i++) {
    const dataUrl = images[i].dataBase64;
    const commaIdx = dataUrl.indexOf(",");
    const b64 = commaIdx >= 0 ? dataUrl.slice(commaIdx + 1) : dataUrl;
    const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    await assetStore.set(`${slug}/${i}`, bytes.buffer as ArrayBuffer);
  }

  const manifest = {
    slug,
    title,
    createdAt: new Date().toISOString(),
    imageCount: images.length,
  };
  await manifestStore.setJSON(slug, manifest);

  const origin = new URL(req.url).origin;
  const url = `${origin}/f/${slug}`;

  return new Response(JSON.stringify({ slug, url, ...manifest }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
};

export const config: Config = {
  path: "/api/create-flipbook",
};
