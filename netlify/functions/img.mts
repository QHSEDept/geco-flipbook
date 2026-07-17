import type { Context, Config } from "@netlify/functions";
import { getStore } from "@netlify/blobs";

export default async (req: Request, context: Context) => {
  const url = new URL(req.url);
  const parts = url.pathname.split("/").filter(Boolean); // ["img", slug, index]
  const slug = parts[1];
  const index = parts[2];

  if (!slug || index === undefined) {
    return new Response("Not found", { status: 404 });
  }

  const assetStore = getStore("flipbook-assets");
  const data = await assetStore.get(`${slug}/${index}`, { type: "arrayBuffer" });

  if (!data) {
    return new Response("Image not found", { status: 404 });
  }

  return new Response(data, {
    status: 200,
    headers: {
      "content-type": "image/jpeg",
      "cache-control": "public, max-age=31536000, immutable",
    },
  });
};

export const config: Config = {
  path: "/img/*",
};
