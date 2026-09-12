const RELEASE = "agnos-19.6.3-compat-20260912";
const BASE = `https://github.com/ajouatom/openpilot-installer-generator/releases/download/${RELEASE}/`;
const SIZE = 1401224;
const HASHES = {
  "carrot-wip": "c84e5baa897b2b3e29f20584553049ebc659002cd02f718a5253da576afe0f4f",
  "carrot-cinque_v2": "1d33a7ca29c2caf4a9b8942b5bb2f063f2d333960180c9d7a36d38c07c706b04",
  "carrot-bmr_v6": "3fd8171a928736dda91d9cfb0172873254c53e86f0ee615e271c48b27eb3c054",
  "carrot-cinque-terre": "37ded80e7e5b9cfca7d06a1aa497d4b990ca2ce75cf1f5cd1a2a079c95a573af",
};

export default {
  async fetch(request, env, ctx) {
    if (request.method !== "GET" && request.method !== "HEAD") {
      return new Response("Use GET or HEAD", { status: 405, headers: { Allow: "GET, HEAD" } });
    }
    const url = new URL(request.url);
    const path = url.pathname.replace(/^\//, "").replace(/\/$/, "");
    const branch = path === "" ? "carrot-wip" : path.startsWith("carrot-") ? path : `carrot-${path}`;
    if (!Object.hasOwn(HASHES, branch)) return new Response("Unknown installer branch", { status: 404 });

    // The release is part of the cache key; a future release cannot reuse old bytes.
    const cacheKey = new Request(`${url.origin}/__verified/${RELEASE}/${branch}`);
    const cache = caches.default;
    try {
      let response = await cache.match(cacheKey);
      if (!response) {
        // Do not forward device serials, cookies, or other incoming headers upstream.
        const upstream = await fetch(BASE + branch, {
          redirect: "follow",
          headers: { "User-Agent": "CarrotInstaller/1" },
        });
        if (!upstream.ok) throw new Error("upstream failure");
        const bytes = new Uint8Array(await upstream.arrayBuffer());
        const digest = await crypto.subtle.digest("SHA-256", bytes);
        const hash = Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, "0")).join("");
        if (bytes.length !== SIZE || hash !== HASHES[branch]) throw new Error("integrity failure");
        response = new Response(bytes, { headers: {
          "Content-Type": "application/octet-stream",
          "Content-Length": String(SIZE),
          "Content-Disposition": `attachment; filename="${branch}"`,
          "Cache-Control": "public, max-age=3600",
          "X-Content-Type-Options": "nosniff",
          "X-Installer-Release": RELEASE,
          "X-Installer-SHA256": hash,
        } });
        ctx.waitUntil(cache.put(cacheKey, response.clone()));
      }
      return request.method === "HEAD" ? new Response(null, response) : response;
    } catch {
      return new Response("Installer temporarily unavailable. Please retry.", {
        status: 502, headers: { "Cache-Control": "no-store" },
      });
    }
  },
};
