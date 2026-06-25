import { appendFileSync as c } from "node:fs";
import { resolve as l } from "node:path";
function m(e) {
  return new Promise((n, i) => {
    const o = [];
    e.on("data", (t) => o.push(t)), e.on("end", () => n(Buffer.concat(o).toString())), e.on("error", i);
  });
}
function h(e) {
  const n = [
    "",
    "---",
    `Date: ${(/* @__PURE__ */ new Date()).toISOString()}`,
    `URL: ${e.url ?? "N/A"}`,
    `Component: ${e.component ?? "N/A"}`
  ];
  return e.dom && n.push(`DOM: ${e.dom}`), e.props && Object.keys(e.props).length > 0 && n.push(`Props: ${JSON.stringify(e.props)}`), e.elementRect && n.push(
    `Rect: top=${e.elementRect.top} left=${e.elementRect.left} width=${e.elementRect.width} height=${e.elementRect.height}`
  ), e.computedStyles && Object.keys(e.computedStyles).length > 0 && (n.push("Computed styles:"), n.push("```json"), n.push(JSON.stringify(e.computedStyles, null, 2)), n.push("```")), e.elementHtml && (n.push("Element HTML:"), n.push("```html"), n.push(e.elementHtml), n.push("```")), n.push(`Note: ${e.note ?? "N/A"}`), `${n.join(`
`)}
`;
}
function y(e = {}) {
  const n = e.queueFile ?? l(process.cwd(), "HINGE_QUEUE.md");
  return {
    name: "hinge-plugin",
    configureServer(i) {
      i.middlewares.use("/api/queue", async (o, t, u) => {
        if (o.method !== "POST") {
          u();
          return;
        }
        try {
          const s = await m(o), r = JSON.parse(s), p = r.queueInfo ?? r;
          c(n, h(p)), t.writeHead(200, { "Content-Type": "application/json" }), t.end(JSON.stringify({ status: "success" }));
        } catch (s) {
          const r = s instanceof Error ? s.message : String(s);
          console.error("[hinge] queue write error:", r), t.writeHead(500, { "Content-Type": "application/json" }), t.end(JSON.stringify({ status: "error", message: r }));
        }
      });
    }
  };
}
export {
  y as default
};
