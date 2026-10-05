import { describe, expect, test } from "vite-plus/test";
import { parseWorkspace, progress, RULES, validate } from "../src/index.ts";
import { doc, farmers, kitchens, run } from "./helpers.ts";

describe("errors", () => {
  test("EG01 duplicate ids", () => {
    expect(run(doc(farmers, farmers)).codes).toContain("EG01");
  });

  test("E002 references must resolve to the right type — when set", () => {
    const missing = run(
      doc(farmers, ":::relationship\nid: r\ntitle: R\nbetween: e-farmers, e-nobody\n:::"),
    ).diagnostics;
    expect(missing.find((d) => d.code === "E002")?.message).toBe(
      'between: "e-nobody" does not exist',
    );
    const wrongType = run(doc(farmers, ":::learning-engine\nid: le\nentity: le\n:::")).diagnostics;
    expect(wrongType.find((d) => d.code === "E002")?.message).toContain(
      "is a learning-engine, expected entity",
    );
    // Optional forward references may be left out entirely.
    expect(run(doc(farmers, ":::platform\nid: p\ntitle: P\n:::")).codes).not.toContain("E002");
  });

  test("EG02 schema violations point at the block and name the attribute", () => {
    const { diagnostics } = run(doc(":::entity\nid: e-x\ntitle: E\nrole: customer\n:::"));
    const d = diagnostics.find((x) => x.code === "EG02")!;
    expect(d.message).toMatch(/^Invalid role 'customer' on entity — use one of:/);
    expect(d.line).toBe(6);
  });

  test("WG01 unknown attributes; EG02 unknown block types", () => {
    expect(run(doc(":::entity\nid: e-x\ntitle: E\ncolour: red\n:::")).codes).toContain("WG01");
    expect(run(doc(":::persona\nid: p\n:::")).codes).toContain("EG02");
  });

  test("E005 at most one platform", () => {
    expect(
      run(doc(":::platform\nid: p1\ntitle: A\n:::", ":::platform\nid: p2\ntitle: B\n:::")).codes,
    ).toContain("E005");
  });
});

describe("method rules", () => {
  test("W003 a transaction stays inside its relationship", () => {
    const other = ":::entity\nid: e-other\ntitle: Other\nrole: partner\n:::";
    const content = doc(
      farmers,
      kitchens,
      other,
      ":::relationship\nid: r\ntitle: R\nbetween: e-farmers, e-kitchens\n:::",
      ":::transaction\nid: t\ntitle: T\nrelationship: r\nfrom: e-other\nto: e-farmers\n:::",
    );
    expect(run(content).codes).toContain("W003");
  });

  test("W006 experience steps may only involve its roles", () => {
    const content = doc(
      farmers,
      kitchens,
      ":::transaction\nid: t\ntitle: T\nfrom: e-kitchens\nto: e-farmers\n:::",
      ":::experience\nid: x\ntitle: X\ncore-entity: e-farmers\nsteps: t\n:::",
    );
    expect(run(content).diagnostics.find((d) => d.code === "W006")?.message).toContain(
      "e-kitchens",
    );
  });

  test("H104 portraits need potential, compressors and gains", () => {
    expect(run(doc(farmers)).diagnostics.find((d) => d.code === "H104")?.message).toBe(
      "Farmers's portrait lacks potential, goals or pressures, gains",
    );
  });

  test("H114 an MVP tests business model, trust and attraction", () => {
    const content = doc(
      ":::mvp\nid: m\ntitle: M\n:::",
      ":::assumption\nid: a\ntitle: A\nmvp: m\nkind: attraction\nriskiest: yes\ntest: x\ncriteria: y\n:::",
    );
    expect(run(content).diagnostics.find((d) => d.code === "H114")?.message).toBe(
      "M tests no business-model, trust assumption",
    );
  });

  test("H010 orphans are reported, roots are not", () => {
    const { diagnostics } = run(doc(farmers, ":::platform\nid: p\ntitle: P\n:::"));
    expect(diagnostics.filter((d) => d.code === "H010").map((d) => d.element)).toEqual([
      "e-farmers",
    ]);
  });

  test("ignore directives suppress a rule for their file", () => {
    const content = doc(`:::ignore H104 portrait comes later :::\n\n${farmers}`);
    expect(run(content).codes).not.toContain("H104");
  });

  test("every rule is self-describing and step-tagged rules name a known step", () => {
    const codes = RULES.map((r) => r.meta.code);
    expect(new Set(codes).size).toBe(codes.length);
    for (const r of RULES) {
      expect(r.meta.rationale.length, r.meta.code).toBeGreaterThan(20);
      if (r.meta.step) expect(r.meta.step).toMatch(/^[EDG]\d$/);
    }
  });
});

describe("canvases", () => {
  const board = (of?: string) =>
    `:::canvas\nid: cv-board\ncanvas: transactions-board\n${of ? `of: ${of}\n` : ""}:::`;
  const relationship = ":::relationship\nid: r\ntitle: R\nbetween: e-farmers, e-kitchens\n:::";
  const transaction =
    ":::transaction\nid: t\ntitle: T\nrelationship: r\nfrom: e-kitchens\nto: e-farmers\n:::";

  test("are views, not elements", () => {
    const { ws } = run(doc(farmers, kitchens, relationship, transaction, board("r")));
    expect(ws.canvases.map((c) => c.id)).toEqual(["cv-board"]);
    expect(ws.byId.has("cv-board")).toBe(false);
  });

  test("E006 unknown canvas, missing or wrong `of`, `of` on a workspace canvas", () => {
    const messages = (content: string) =>
      run(content)
        .diagnostics.filter((d) => d.code === "E006")
        .map((d) => d.message);
    expect(messages(doc(":::canvas\nid: c\ncanvas: poster\n:::"))[0]).toMatch(/^:::canvas canvas:/);
    expect(messages(doc(board()))[0]).toContain("add `of: <relationship id>`");
    expect(messages(doc(farmers, board("e-farmers")))[0]).toBe(
      'of: "e-farmers" is a entity, expected relationship',
    );
    expect(messages(doc(":::canvas\nid: c\ncanvas: ecosystem\nof: x\n:::"))[0]).toContain(
      "remove `of`",
    );
  });

  test("W011 a started step's chapter shows its canvas, per element where the canvas says so", () => {
    const missing = run(doc(farmers, kitchens, relationship, transaction)).diagnostics.filter(
      (d) => d.code === "W011",
    );
    expect(missing.map((d) => [d.step, d.message])).toEqual([
      [
        "E2",
        "model.pdt42.md (E2 Scan the ecosystem) shows no Ecosystem Scan — add a `:::canvas` block with `canvas: ecosystem-scan`",
      ],
      [
        "D1",
        "model.pdt42.md (D1 Map the ecosystem) shows no Ecosystem Canvas — add a `:::canvas` block with `canvas: ecosystem`",
      ],
      [
        "D5",
        "No Transactions Board for R in model.pdt42.md — add a `:::canvas` block with `canvas: transactions-board` and `of: r`",
      ],
    ]);
    const placed = run(
      doc(
        farmers,
        kitchens,
        relationship,
        transaction,
        board("r"),
        ":::canvas\nid: cv-eco\ncanvas: ecosystem\n:::",
        ":::canvas\nid: cv-scan\ncanvas: ecosystem-scan\n:::",
      ),
    ).codes;
    expect(placed).not.toContain("W011");
  });

  test("W011 wants the canvas in the step's own chapter file", () => {
    const ws = parseWorkspace([
      { file: "d1.pdt42.md", content: doc(farmers) },
      { file: "elsewhere.pdt42.md", content: doc(":::canvas\nid: cv-eco\ncanvas: ecosystem\n:::") },
    ]);
    expect(validate(ws).some((d) => d.code === "W011" && d.step === "D1")).toBe(true);
  });
});

describe("home chapters (EG03)", () => {
  const E2 = "1-exploration/e2-scan.pdt42.md";
  const D1 = "2-design/d1-ecosystem.pdt42.md";
  const platform = ":::platform\nid: platform\ntitle: P\nowners: e-farmers\n:::";
  const workspace = (files: Record<string, string[]>) =>
    parseWorkspace(
      Object.entries(files).map(([file, blocks]) => ({ file, content: doc(...blocks) })),
    );
  const eg03 = (files: Record<string, string[]>) =>
    validate(workspace(files)).filter((d) => d.code === "EG03");

  test("an entity's home is the Ecosystem Scan (E2)", () => {
    expect(eg03({ [E2]: [farmers], [D1]: [platform] })).toEqual([]);
  });

  test("an entity written in D1 is an error naming its home chapter", () => {
    const [d] = eg03({ [D1]: [farmers, platform] });
    expect(d).toMatchObject({ file: D1, severity: "error" });
    expect(d!.message).toBe(
      `entity 'e-farmers' belongs in its home chapter ${E2} (E2 Scan the ecosystem), but is documented in ${D1} — move it there: an entity found in a later step is still written down in its home chapter`,
    );
  });

  test("files outside the chapter convention may hold any element", () => {
    expect(eg03({ "model.pdt42.md": [farmers, platform] })).toEqual([]);
  });

  test("D1 counts as started by the roles it gives entities in their home chapter", () => {
    const counts = (files: Record<string, string[]>) => {
      const ws = workspace(files);
      return Object.fromEntries(
        progress(ws, validate(ws))
          .filter((s) => ["E2", "D1", "D2"].includes(s.step.id))
          .map((s) => [s.step.id, s.count]),
      );
    };
    const unroled = ":::entity\nid: e-x\ntitle: X\nlayer: long-tail\n:::";
    expect(counts({ [E2]: [unroled] })).toEqual({ E2: 1, D1: 0, D2: 0 });
    expect(counts({ [E2]: [farmers, unroled] })).toEqual({ E2: 2, D1: 1, D2: 0 });
    expect(counts({ [E2]: [farmers], [D1]: [platform] })).toEqual({ E2: 1, D1: 2, D2: 0 });
  });
});
