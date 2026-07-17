import type { Context, Config } from "@netlify/functions";
import { getStore } from "@netlify/blobs";
import { buildFlipbookHtml } from "../../shared/flipbookHtml.mjs";

export default async (req: Request, context: Context) => {
  const url = new URL(req.url);
  const parts = url.pathname.split("/").filter(Boolean); // ["f", slug]
  const slug = parts[1];

  if (!slug) {
    return new Response("Not found", { status: 404 });
  }

  const manifestStore = getStore("flipbooks");
  const manifest = await manifestStore.get(slug, { type: "json" });

  if (!manifest) {
    return new Response("Flipbook not found", { status: 404 });
  }

  const imageUrls = Array.from(
    { length: manifest.imageCount },
    (_, i) => `/img/${slug}/${i}`
  );

  const html = buildFlipbookHtml(imageUrls, manifest.title);

  return new Response(html, {
    status: 200,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
};

export const config: Config = {
  path: "/f/*",
};
