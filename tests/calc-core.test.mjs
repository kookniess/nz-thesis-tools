import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { validate, sides, printingCost, packageQuote, compare, round2 } from "../assets/calc-core.js";

const cfg = JSON.parse(readFileSync(new URL("../assets/pricing.json", import.meta.url), "utf8"));
const base = { pages: 320, colour: 35, copies: 2 };

test("sides: 320 pages, 35 colour, 2 copies", () => {
  assert.deepEqual(sides(base), { total: 640, colour: 70, bw: 570 });
});

test("printing at bindery rate matches the worked example ($293.10 ex GST)", () => {
  const r = cfg.referenceRates.find(x => x.id === "bindery");
  const p = printingCost(base, r, cfg.gstRate);
  assert.equal(p.ex, 293.1);
  assert.equal(p.incl, round2(293.1 * 1.15));
});

test("printing at print-shop rate = $92.90 ex GST", () => {
  const r = cfg.referenceRates.find(x => x.id === "printshop");
  assert.equal(printingCost(base, r, cfg.gstRate).ex, 92.9);
});

test("campus rate with unknown GST is not grossed up", () => {
  const r = cfg.referenceRates.find(x => x.id === "campus-vuw");
  const p = printingCost(base, r, cfg.gstRate);
  assert.equal(p.ex, 35.5); assert.equal(p.incl, 35.5); assert.equal(p.gstKnown, false);
});

test("package tiers: 1/2/3/4/5 copies, GST added", () => {
  for (const t of cfg.package.copyTiers) {
    const q = packageQuote({ ...base, copies: t.copies }, cfg.package, cfg.gstRate);
    assert.equal(q.binding, t.price);
    assert.equal(q.total, round2(t.price * 1.15));
  }
});

test("package: rush is 40% of binding + material, courier flat", () => {
  const q = packageQuote({ ...base, copies: 3 }, cfg.package, cfg.gstRate, { rush: true, courier: true, materialPerCopy: 20 });
  assert.equal(q.material, 60); assert.equal(q.rush, round2((594 + 60) * 0.4)); assert.equal(q.courier, 11.5);
  assert.equal(q.subtotal, 927.1); assert.equal(q.total, 1066.17);
});

test("package returns null outside published tiers or over max pages", () => {
  assert.equal(packageQuote({ ...base, copies: 6 }, cfg.package, cfg.gstRate), null);
  assert.equal(packageQuote({ ...base, pages: 501 }, cfg.package, cfg.gstRate), null);
});

test("validate catches colour > pages, too few/many pages, zero copies", () => {
  assert.ok(validate({ pages: 100, colour: 120, copies: 1 }, cfg).colour);
  assert.ok(validate({ pages: 5, colour: 0, copies: 1 }, cfg).pages);
  assert.ok(validate({ pages: 600, colour: 0, copies: 1 }, cfg).pages);
  assert.ok(validate({ pages: 100, colour: 0, copies: 0 }, cfg).copies);
  assert.deepEqual(validate(base, cfg), {});
});

test("compare returns one row per reference rate plus the package", () => {
  const c = compare(base, cfg);
  assert.equal(c.rows.length, cfg.referenceRates.length);
  assert.equal(c.pkg.binding, 498);
});
