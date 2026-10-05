import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, test } from "vite-plus/test";

const CLI = new URL("../src/cli.ts", import.meta.url).pathname;
const EXAMPLE = new URL("../../../examples/harvest-commons", import.meta.url).pathname;

function pdt(...args: string[]) {
  const r = spawnSync(
    process.execPath,
    ["--conditions=development", "--experimental-strip-types", "--no-warnings", CLI, ...args],
    {
      encoding: "utf8",
      env: { ...process.env, NO_COLOR: "1" },
    },
  );
  return { code: r.status, out: r.stdout, err: r.stderr };
}

describe("pdt42", () => {
  test("validate passes on the example and fails on errors", () => {
    expect(pdt("--dir", EXAMPLE, "validate")).toMatchObject({ code: 0 });
    const dir = mkdtempSync(join(tmpdir(), "pdt-"));
    writeFileSync(
      join(dir, "x.pdt42.md"),
      "## X\n\nProse.\n\n```pdt42\n:::relationship\nid: r\ntitle: R\nbetween: a, b\n:::\n```\n",
    );
    const r = pdt("--dir", dir, "validate");
    expect(r.code).toBe(1);
    expect(r.out).toContain('E002 x.pdt42.md:6  between: "a" does not exist');
  });

  test("guide and next start a blank workspace at D1; guide step hands out the template", () => {
    const dir = mkdtempSync(join(tmpdir(), "pdt-"));
    expect(pdt("--dir", dir, "next").out).toContain("Next: D1 · Map the ecosystem");
    expect(JSON.parse(pdt("--dir", dir, "next", "--format", "json").out)).toMatchObject({
      step: "D1",
      title: "Map the ecosystem",
      state: "todo",
    });
    expect(JSON.parse(pdt("--dir", EXAMPLE, "next", "--format", "json").out)).toBeNull();
    const overview = pdt("--dir", dir, "guide").out;
    expect(overview).toContain("[ ] D5  Identify the elementary transactions and channels");
    expect(overview).toContain(":::transaction, :::channel");
    expect(overview).toContain(":::job, :::entity with layer");
    expect(overview).toContain(":::platform, :::entity + role, clusters");
    const d5 = pdt("--dir", dir, "guide", "step", "D5").out;
    expect(d5).toContain("Write this step in `2-design/d5-transactions.pdt42.md`");
    expect(d5).toContain(
      "- `:::entity` from E2 — required via transaction.from, transaction.to; none yet ← write these first",
    );
    expect(d5).toContain(
      "- `:::entity`: referenced from here; its blocks live in their home chapter, `1-exploration/e2-scan.pdt42.md` (E2). If you discover a new entity here, add it there, not in this step's chapter.",
    );
    const d1 = pdt("--dir", dir, "guide", "step", "D1").out;
    expect(d1).toContain(
      "- `:::entity`: add role, clusters to the existing blocks in their home chapter, `1-exploration/e2-scan.pdt42.md` (E2). If you discover a new entity here, add it there, not in this step's chapter.",
    );
    expect(d1).toContain("### :::entity — add role, clusters, in 1-exploration/e2-scan.pdt42.md");
    const template = d1.slice(d1.indexOf("## Starter template"));
    expect(template).toContain(
      "In 1-exploration/e2-scan.pdt42.md, an existing :::entity with what D1 adds:",
    );
    expect(template).not.toContain("pressures:");
    const d2 = pdt("--dir", dir, "guide", "step", "D2").out;
    expect(d2).toContain(
      "- `:::entity`: add context, assets, capabilities, potential, goals, pressures, convenience-gains, reach-gains, value-gains to the existing blocks in their home chapter, `1-exploration/e2-scan.pdt42.md` (E2). If you discover a new entity here, add it there, not in this step's chapter.",
    );
    const e2 = pdt("--dir", dir, "guide", "step", "E2").out;
    expect(e2).toContain("### :::entity — with layer");
    expect(e2).toContain(
      ":::entity\nid: e-farmers\ntitle: Small-scale farmers\nlayer: long-tail\n:::",
    );
    expect(d5).toContain("- `pdt42 explain transaction`");
    expect(d5).toContain("## Starter template");
    expect(pdt("init").code).toBe(2);
  });

  test("guide step shows the brief and the step's findings", () => {
    const dir = mkdtempSync(join(tmpdir(), "pdt-"));
    writeFileSync(
      join(dir, "d.pdt42.md"),
      "## Farmers\n\nThey grow.\n\n```pdt42\n:::entity\nid: e-f\ntitle: Farmers\nrole: peer-producer\n:::\n```\n",
    );
    const out = pdt("--dir", dir, "guide", "step", "d2").out;
    expect(out).toContain("# D2 · Portray the entity-roles");
    expect(out).toContain("H104 hint d.pdt42.md:6 — Farmers's portrait lacks");
  });

  test("explain, roles, canvas and rules render; json is parseable", () => {
    const entity = pdt("explain", "entity").out;
    expect(entity).toContain("| `reach-gains` |");
    expect(entity).toContain(
      "Home: step E2 Scan the ecosystem (`pdt42 guide step E2`), chapter `1-exploration/e2-scan.pdt42.md`. Every :::entity is written there, also one discovered in a later step. Later steps fill it in there: D1 (role, clusters), D2 (portrait).",
    );
    expect(pdt("guide", "roles").out).toContain("Peer producer** (PP");
    expect(pdt("guide", "canvas", "transactions-board").out).toContain("`transaction.value-unit`");
    expect(JSON.parse(pdt("rules", "--format", "json").out).length).toBeGreaterThan(30);
    expect(JSON.parse(pdt("--dir", EXAMPLE, "get", "--format", "json").out).length).toBe(90);
  });

  test("usage errors exit with 2", () => {
    expect(pdt("frobnicate").code).toBe(2);
    expect(pdt("guide", "step").code).toBe(2);
  });
});

describe("pdt42 serve and build", () => {
  test("serve answers /api/workspace with the payload", async () => {
    const { serve } = await import("../src/serve.ts");
    const server = await serve(EXAMPLE, { port: 0, host: "127.0.0.1" });
    try {
      const { port } = server.address() as { port: number };
      const payload = (await (await fetch(`http://127.0.0.1:${port}/api/workspace`)).json()) as {
        name: string;
        canvases: unknown[];
      };
      expect(payload.name).toBe("Harvest Commons");
      expect(payload.canvases.length).toBeGreaterThan(20);
    } finally {
      server.close();
    }
  });

  test("build replaces an earlier build's assets and keeps everything else", async () => {
    const web = mkdtempSync(join(tmpdir(), "pdt42-web-"));
    mkdirSync(join(web, "assets"));
    writeFileSync(join(web, "index.html"), '<html><head><meta charset="UTF-8" /></head></html>');
    writeFileSync(join(web, "assets", "index-new.js"), "");
    const out = mkdtempSync(join(tmpdir(), "pdt42-out-"));
    mkdirSync(join(out, "assets"));
    writeFileSync(join(out, "assets", "index-old.js"), "");
    writeFileSync(join(out, "notes.txt"), "not ours");
    const previous = process.env.PDT42_WEB_DIR;
    process.env.PDT42_WEB_DIR = web;
    try {
      const { build } = await import("../src/serve.ts");
      await build(EXAMPLE, out, false);
    } finally {
      if (previous === undefined) delete process.env.PDT42_WEB_DIR;
      else process.env.PDT42_WEB_DIR = previous;
    }
    expect(readdirSync(join(out, "assets"))).toEqual(["index-new.js"]);
    expect(existsSync(join(out, "notes.txt"))).toBe(true);
  });

  test("build injects the workspace after the charset declaration", async () => {
    const { injectWorkspace, inlineJson } = await import("../src/serve.ts");
    expect(inlineJson({ a: "</script><b>" })).toBe('{"a":"\\u003c/script>\\u003cb>"}');
    const html = injectWorkspace(
      '<html><head><meta charset="UTF-8" /><title>x</title></head><body></body></html>',
      { name: "Harvest Commons" } as never,
    );
    expect(html).toMatch(/^<html><head><meta charset="UTF-8" \/><script>window.__WORKSPACE__=/);
    expect(html).toContain("<title>Harvest Commons · pdt42</title>");
  });
});
