// Free NZ Thesis Tools — shared calculation core.
// Pure functions, no DOM, no dependencies. Used by the GitHub Pages tools and tested with node --test.
// All money is NZD. Binding prices are ex GST unless a rate says otherwise.

export function round2(n) { return Math.round((n + Number.EPSILON) * 100) / 100; }

/** Validate thesis inputs. Returns {} when valid, otherwise {field: message}. */
export function validate(s, cfg) {
  const e = {};
  if (!Number.isInteger(s.pages) || s.pages < cfg.minPages) e.pages = `Enter at least ${cfg.minPages} pages.`;
  else if (s.pages > cfg.maxPages) e.pages = `Over ${cfg.maxPages} pages a copy is quoted individually by binderies.`;
  if (!Number.isInteger(s.colour) || s.colour < 0) e.colour = "Enter 0 or more colour pages.";
  else if (Number.isInteger(s.pages) && s.colour > s.pages) e.colour = "Colour pages cannot exceed the page count.";
  if (!Number.isInteger(s.copies) || s.copies < 1) e.copies = "Enter at least 1 copy.";
  return e;
}

/** Printed sides for a run, assuming one page = one printed side (double-sided sheets). */
export function sides(s) {
  const total = s.pages * s.copies, colour = Math.min(s.colour, s.pages) * s.copies;
  return { total, colour, bw: total - colour };
}

/** Printing cost at one published per-side rate. gstRate is applied only when rate.gst === "ex". */
export function printingCost(s, rate, gstRate) {
  const x = sides(s);
  const ex = round2(x.bw * rate.bw + x.colour * rate.colour);
  const incl = rate.gst === "ex" ? round2(ex * (1 + gstRate)) : ex;
  return { ...x, ex, incl, gstKnown: rate.gst !== "unknown", perCopyIncl: round2(incl / s.copies) };
}

/** MyThesis-style package: tiered binding price with printing included. Returns null when outside the published tiers. */
export function packageQuote(s, pkg, gstRate, opts = {}) {
  const tier = pkg.copyTiers.find(t => t.copies === s.copies);
  if (!tier || s.pages > pkg.maxPages) return null;
  const binding = tier.price;
  const material = round2((opts.materialPerCopy || 0) * s.copies);
  const rush = opts.rush ? round2((binding + material) * pkg.rushPercent) : 0;
  const courier = opts.courier ? pkg.courierFee : 0;
  const subtotal = round2(binding + material + rush + courier), gst = round2(subtotal * gstRate);
  return { binding, material, rush, courier, subtotal, gst, total: round2(subtotal + gst), perCopyIncl: round2((subtotal + gst) / s.copies) };
}

/** Compare: for each reference rate, what the printing alone would cost, next to a package that includes it. */
export function compare(s, cfg) {
  const rows = cfg.referenceRates.map(r => ({ rate: r, printing: printingCost(s, r, cfg.gstRate) }));
  const pkg = packageQuote(s, cfg.package, cfg.gstRate);
  return { rows, pkg };
}

/** Budget planner: total for N copies at a package, and the printing value included at a chosen rate. */
export function budget(s, cfg, rateId) {
  const rate = cfg.referenceRates.find(r => r.id === rateId) || cfg.referenceRates[0];
  return { pkg: packageQuote(s, cfg.package, cfg.gstRate), printing: printingCost(s, rate, cfg.gstRate), rate };
}

export const nzd = n => new Intl.NumberFormat("en-NZ", { style: "currency", currency: "NZD" }).format(n);
