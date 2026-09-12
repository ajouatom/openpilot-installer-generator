import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import worker from "./worker.mjs";

const base = readFileSync(new URL("../agnos_compat/installer-agnos-19.6.3-carrot-base", import.meta.url));
function fixture() {
  const bytes = Buffer.from(base);
  for (const [marker, value] of [
    ["https://github.com/commaai/openpilot.git?", "https://github.com/ajouatom/openpilot.git?"],
    ["release3?", "carrot-wip?"],
  ]) {
    const start = bytes.indexOf(marker);
    const end = bytes.indexOf(0, start);
    bytes.write(value.padEnd(end - start, " "), start, "ascii");
  }
  return bytes;
}
function setup(upstream) {
  const cached = new Map();
  const pending = [];
  globalThis.caches = { default: {
    async match(key) { return cached.get(key.url)?.clone(); },
    async put(key, value) { cached.set(key.url, value); },
  } };
  globalThis.fetch = upstream;
  return { ctx: { waitUntil(p) { pending.push(p); } }, async complete() { await Promise.all(pending); } };
}

test("root serves verified ELF and does not forward incoming device headers", async () => {
  let calls = 0;
  const state = setup(async (url, options) => {
    calls++;
    assert.match(url, /agnos-19\.6\.3-compat-20260912\/carrot-wip$/);
    assert.deepEqual(options.headers, { "User-Agent": "CarrotInstaller/1" });
    return new Response(fixture());
  });
  const response = await worker.fetch(new Request("https://example.workers.dev/", {
    headers: { "X-openpilot-serial": "test-only", Cookie: "test-only" },
  }), {}, state.ctx);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("Content-Type"), "application/octet-stream");
  assert.deepEqual(Buffer.from(await response.arrayBuffer()), fixture());
  await state.complete();
  const head = await worker.fetch(new Request("https://example.workers.dev/wip", { method: "HEAD" }), {}, state.ctx);
  assert.equal(head.status, 200);
  assert.equal(head.headers.get("Content-Length"), "1401224");
  assert.equal(await head.text(), "");
  assert.equal(calls, 1);
});

test("unknown branches and write methods never reach the upstream", async () => {
  const state = setup(() => { throw new Error("unexpected fetch"); });
  assert.equal((await worker.fetch(new Request("https://example.workers.dev/unknown"), {}, state.ctx)).status, 404);
  assert.equal((await worker.fetch(new Request("https://example.workers.dev/", { method: "POST" }), {}, state.ctx)).status, 405);
});

test("corrupt or HTML upstream responses are rejected", async () => {
  for (const body of ["<html>error</html>", Buffer.alloc(1401224)]) {
    const state = setup(async () => new Response(body));
    const response = await worker.fetch(new Request("https://example.workers.dev/"), {}, state.ctx);
    assert.equal(response.status, 502);
    assert.equal(response.headers.get("Cache-Control"), "no-store");
  }
});

test("upstream failure returns an uncached retryable error", async () => {
  const state = setup(async () => new Response("missing", { status: 404 }));
  const response = await worker.fetch(new Request("https://example.workers.dev/carrot-wip"), {}, state.ctx);
  assert.equal(response.status, 502);
});
