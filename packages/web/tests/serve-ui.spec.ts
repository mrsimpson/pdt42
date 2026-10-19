import { execFileSync, spawn, type ChildProcess } from "node:child_process";
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { expect, test } from "@playwright/test";

// The web view as `pdt42 serve --diff` shows a change: Harvest Commons in a throwaway Git
// repository, committed twice (the second commit changes a motivation), then changed again in
// the working tree.

const ROOT = resolve(import.meta.dirname, "../../..");
const MOTIVATIONS = "2-design/d3-motivations.pdt42.md";
let server: ChildProcess;
let repo: string;
let url: string;

function git(...args: string[]) {
  return execFileSync(
    "git",
    ["-C", repo, "-c", "user.name=Ann", "-c", "user.email=ann@example.org", ...args],
    { encoding: "utf8" },
  );
}

function edit(file: string, from: string, to: string) {
  const path = join(repo, "ws", file);
  writeFileSync(path, readFileSync(path, "utf8").replace(from, to));
}

test.beforeAll(async () => {
  repo = mkdtempSync(join(tmpdir(), "pdt42-ui-"));
  cpSync(join(ROOT, "examples/harvest-commons"), join(repo, "ws"), { recursive: true });
  git("init", "-q");
  git("add", "-A");
  git("commit", "-qm", "Harvest Commons");
  edit(MOTIVATIONS, "status: potential", "status: current");
  git("commit", "-qam", "Farmers grow to order now");
  edit(MOTIVATIONS, "kind: money", "kind: reputation");
  const port = 4400 + test.info().workerIndex;
  url = `http://127.0.0.1:${port}/`;
  server = spawn(
    process.execPath,
    [
      "--conditions=development",
      "--experimental-strip-types",
      "--no-warnings",
      join(ROOT, "packages/cli/src/cli.ts"),
      "--dir",
      join(repo, "ws"),
      "serve",
      "--port",
      String(port),
      "--diff",
    ],
    { stdio: "ignore" },
  );
  for (let i = 0; ; i++) {
    try {
      if ((await fetch(`${url}api/workspace`)).ok) break;
    } catch {
      // not up yet
    }
    if (i > 50) throw new Error("pdt42 serve did not start");
    await new Promise((ok) => setTimeout(ok, 200));
  }
});

test.afterAll(() => {
  server.kill();
  rmSync(repo, { recursive: true, force: true });
});

test("an id mentioned in prose links to its element and scrolls to its prose", async ({ page }) => {
  await page.goto(`${url}#2-design/d5-transactions.pdt42.md`);
  const mention = page.locator("main a[data-id='x-weekly-box']").first();
  await expect(mention).toBeVisible();
  await expect(mention).toHaveAttribute(
    "href",
    "#2-design/d7-experiences.pdt42.md:el-x-weekly-box",
  );
  await mention.click();
  // The prose of the element is at the top of the view, its model box stays closed
  await expect(page.locator("div.run#el-x-weekly-box")).toBeVisible();
  await expect
    .poll(
      () =>
        page.evaluate(
          () => document.getElementById("el-x-weekly-box")?.getBoundingClientRect().top ?? 1e6,
        ),
      { timeout: 8000 },
    )
    .toBeLessThan(24);
  await expect(page.locator("section.card#el-x-weekly-box")).toHaveCount(0);
});

test("what was opened in a chapter is closed when another chapter is navigated to", async ({
  page,
}) => {
  await page.goto(`${url}#2-design/d5-transactions.pdt42.md`);
  await page.locator("button.run__stripe").first().click();
  await expect(page.locator("section.card")).toHaveCount(1);

  await page.goto(`${url}#2-design/d7-experiences.pdt42.md`);
  await expect(page.locator("button.run__stripe").first()).toBeVisible();
  await expect(page.locator("section.card")).toHaveCount(0);

  await page.goto(`${url}#2-design/d5-transactions.pdt42.md`);
  await expect(page.locator("button.run__stripe").first()).toBeVisible();
  await expect(page.locator("section.card")).toHaveCount(0);
});

test("still reaches an element's prose when the page is zoomed in", async ({ page }) => {
  // 200 % zoom of a 1280 px window: text wraps more, the page reflows after the scroll
  await page.setViewportSize({ width: 640, height: 400 });
  await page.goto(`${url}#2-design/d7-experiences.pdt42.md:el-x-weekly-box`);
  await expect
    .poll(
      () =>
        page.evaluate(
          () => document.getElementById("el-x-weekly-box")?.getBoundingClientRect().top ?? 1e6,
        ),
      { timeout: 8000 },
    )
    .toBeLessThan(24);
});

test("the change opens on the changes view and shows inline in its chapter", async ({ page }) => {
  await page.goto(url);
  await expect(page.getByTestId("changes-view")).toBeVisible();
  await expect(page.getByTestId("diff-index-document")).toHaveCount(1);
  await page.getByTestId("diff-index-document-link").click();
  await expect(page.getByTestId("chapter-diff")).toBeVisible();
  await expect(page.getByTestId("attribute-change").first()).toContainText("money");
});

test("the history lists the commits, shows one and browses its version", async ({ page }) => {
  await page.goto(`${url}#history`);
  const pearls = page.getByTestId("history-pearl");
  await expect(pearls).toHaveCount(3);
  await expect(pearls.nth(1)).toContainText("Farmers grow to order now");
  await pearls.nth(1).getByTestId("pearl-select").click();
  await expect(page.getByTestId("changes-view")).toContainText("Farmers grow to order now");
  await page.getByTestId("browse-version").click();
  await expect(page.getByTestId("version-banner")).toBeVisible();
  await expect(page.locator("main h1").first()).toBeVisible();
  await expect(page.locator("main")).not.toContainText("Could not load");
});
