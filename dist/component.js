import { defineComponent as C, openBlock as m, createElementBlock as h, normalizeStyle as Y, createElementVNode as u, normalizeClass as Q, toDisplayString as y, computed as X, createCommentVNode as L, Fragment as M, renderList as Z, useModel as tt, createVNode as x, withDirectives as et, vModelText as nt, mergeModels as z, reactive as B, onMounted as S, onUnmounted as V, ref as w, watch as W, shallowRef as O, watchEffect as ot, createBlock as A, Teleport as it, unref as g, isRef as rt } from "vue";
const st = {
  class: "cog-target",
  "aria-live": "polite"
}, at = /* @__PURE__ */ C({
  __name: "HingeCog",
  props: {
    open: { type: Boolean },
    cogStyle: {},
    targetLabel: {}
  },
  emits: ["pointerdown", "pointermove", "pointerup", "pointercancel", "contextmenu"],
  setup(t) {
    return (e, n) => (m(), h("div", {
      class: "cog-wrap",
      style: Y(t.cogStyle)
    }, [
      u("div", {
        class: Q(["cog-icon", { "cog-icon--open": t.open }]),
        onPointerdown: n[0] || (n[0] = (o) => e.$emit("pointerdown", o)),
        onPointermove: n[1] || (n[1] = (o) => e.$emit("pointermove", o)),
        onPointerup: n[2] || (n[2] = (o) => e.$emit("pointerup", o)),
        onPointercancel: n[3] || (n[3] = (o) => e.$emit("pointercancel", o)),
        onContextmenu: n[4] || (n[4] = (o) => e.$emit("contextmenu", o))
      }, " ⚙️ ", 34),
      u("div", st, y(t.targetLabel), 1)
    ], 4));
  }
}), $ = (t, e) => {
  const n = t.__vccOpts || t;
  for (const [o, i] of e)
    n[o] = i;
  return n;
}, lt = /* @__PURE__ */ $(at, [["__scopeId", "data-v-e377029b"]]), ct = /* @__PURE__ */ C({
  __name: "HingeHighlight",
  props: {
    rect: {}
  },
  setup(t) {
    const e = t, n = X(() => {
      const { rect: o } = e;
      return o ? {
        top: `${o.top}px`,
        left: `${o.left}px`,
        width: `${o.width}px`,
        height: `${o.height}px`
      } : { display: "none" };
    });
    return (o, i) => (m(), h("div", {
      class: "hinge-highlight",
      style: Y(n.value)
    }, null, 4));
  }
}), ut = /* @__PURE__ */ $(ct, [["__scopeId", "data-v-198af5a9"]]), dt = { class: "attention" }, ft = { class: "attention__row" }, gt = { class: "attention__name" }, mt = {
  key: 0,
  class: "attention__row"
}, pt = { class: "attention__dom" }, ht = {
  key: 1,
  class: "attention__props"
}, vt = /* @__PURE__ */ C({
  __name: "HingeAttention",
  props: {
    target: {}
  },
  setup(t) {
    function e(n) {
      if (typeof n == "string") return n;
      try {
        return JSON.stringify(n);
      } catch {
        return String(n);
      }
    }
    return (n, o) => (m(), h("div", dt, [
      u("div", ft, [
        o[0] || (o[0] = u("span", { class: "attention__label" }, "Component", -1)),
        u("span", gt, y(t.target.component), 1)
      ]),
      t.target.dom && t.target.dom !== t.target.component ? (m(), h("div", mt, [
        o[1] || (o[1] = u("span", { class: "attention__label" }, "DOM", -1)),
        u("span", pt, y(t.target.dom), 1)
      ])) : L("", !0),
      Object.keys(t.target.props).length ? (m(), h("dl", ht, [
        (m(!0), h(M, null, Z(t.target.props, (i, r) => (m(), h(M, { key: r }, [
          u("dt", null, y(r), 1),
          u("dd", null, y(e(i)), 1)
        ], 64))), 128))
      ])) : L("", !0)
    ]));
  }
}), wt = /* @__PURE__ */ $(vt, [["__scopeId", "data-v-c6f5cddc"]]), yt = { class: "panel" }, Ct = { class: "actions" }, $t = /* @__PURE__ */ C({
  __name: "HingePanel",
  props: /* @__PURE__ */ z({
    target: {}
  }, {
    modelValue: { required: !0 },
    modelModifiers: {}
  }),
  emits: /* @__PURE__ */ z(["send", "close"], ["update:modelValue"]),
  setup(t) {
    const e = tt(t, "modelValue");
    return (n, o) => (m(), h("div", yt, [
      x(wt, { target: t.target }, null, 8, ["target"]),
      et(u("textarea", {
        "onUpdate:modelValue": o[0] || (o[0] = (i) => e.value = i),
        placeholder: "Enter queue info..."
      }, null, 512), [
        [nt, e.value]
      ]),
      u("div", Ct, [
        u("button", {
          type: "button",
          onClick: o[1] || (o[1] = (i) => n.$emit("send"))
        }, "Send"),
        u("button", {
          type: "button",
          onClick: o[2] || (o[2] = (i) => n.$emit("close"))
        }, "Close")
      ])
    ]));
  }
}), Et = /* @__PURE__ */ $($t, [["__scopeId", "data-v-60e0425e"]]), T = 40, bt = 6, Pt = 500, _t = "hinge-app";
function Lt({
  position: t,
  clampPosition: e,
  onTap: n,
  onPanelToggle: o,
  onMove: i
}) {
  const r = B({
    active: !1,
    moved: !1,
    offsetX: 0,
    offsetY: 0,
    startX: 0,
    startY: 0,
    longPressTriggered: !1,
    longPressTimer: null
  });
  function a() {
    r.longPressTimer && (clearTimeout(r.longPressTimer), r.longPressTimer = null);
  }
  function s(l) {
    const f = l.currentTarget;
    f && (r.active = !0, r.moved = !1, r.longPressTriggered = !1, r.startX = l.clientX, r.startY = l.clientY, r.offsetX = l.clientX - t.x, r.offsetY = l.clientY - t.y, f.setPointerCapture(l.pointerId), a(), r.longPressTimer = setTimeout(() => {
      r.longPressTriggered = !0, o();
    }, Pt));
  }
  function p(l) {
    if (!r.active) return;
    const f = l.clientX - r.startX, _ = l.clientY - r.startY;
    if (!r.moved) {
      if (Math.hypot(f, _) < bt) {
        i == null || i();
        return;
      }
      a(), r.moved = !0;
    }
    t.x = l.clientX - r.offsetX, t.y = l.clientY - r.offsetY, e(), i == null || i();
  }
  function c(l) {
    if (!r.active) return;
    const f = l.currentTarget;
    r.active = !1, a(), f != null && f.hasPointerCapture(l.pointerId) && f.releasePointerCapture(l.pointerId), !(r.longPressTriggered || r.moved) && n();
  }
  function d(l) {
    l.preventDefault(), a(), r.longPressTriggered = !0, o();
  }
  return {
    onCogPointerDown: s,
    onCogPointerMove: p,
    onCogPointerUp: c,
    onCogContextMenu: d
  };
}
function xt() {
  const t = window.visualViewport;
  return {
    width: (t == null ? void 0 : t.width) ?? window.innerWidth,
    height: (t == null ? void 0 : t.height) ?? window.innerHeight
  };
}
function Tt() {
  const t = B({ x: 20, y: 20 }), e = X(() => ({
    transform: `translate3d(${t.x}px, ${t.y}px, 0)`
  }));
  function n() {
    const { width: o, height: i } = xt(), r = Math.max(0, o - T), a = Math.max(0, i - T);
    t.x = Math.min(Math.max(0, t.x), r), t.y = Math.min(Math.max(0, t.y), a);
  }
  return S(() => {
    var o, i;
    n(), window.addEventListener("resize", n), (o = window.visualViewport) == null || o.addEventListener("resize", n), (i = window.visualViewport) == null || i.addEventListener("scroll", n);
  }), V(() => {
    var o, i;
    window.removeEventListener("resize", n), (o = window.visualViewport) == null || o.removeEventListener("resize", n), (i = window.visualViewport) == null || i.removeEventListener("scroll", n);
  }), { position: t, cogStyle: e, clampPosition: n };
}
function St(t) {
  const e = w(null);
  function n() {
    const o = t.value;
    if (!o || !o.isConnected) {
      e.value = null;
      return;
    }
    e.value = o.getBoundingClientRect();
  }
  return W(t, n, { flush: "sync" }), S(() => {
    var o, i;
    n(), window.addEventListener("resize", n), window.addEventListener("scroll", n, !0), (o = window.visualViewport) == null || o.addEventListener("resize", n), (i = window.visualViewport) == null || i.addEventListener("scroll", n);
  }), V(() => {
    var o, i;
    window.removeEventListener("resize", n), window.removeEventListener("scroll", n, !0), (o = window.visualViewport) == null || o.removeEventListener("resize", n), (i = window.visualViewport) == null || i.removeEventListener("scroll", n);
  }), { rect: e, update: n };
}
const Vt = [
  "display",
  "position",
  "top",
  "right",
  "bottom",
  "left",
  "width",
  "height",
  "minWidth",
  "minHeight",
  "maxWidth",
  "maxHeight",
  "margin",
  "padding",
  "border",
  "borderRadius",
  "backgroundColor",
  "background",
  "color",
  "fontSize",
  "fontWeight",
  "fontFamily",
  "lineHeight",
  "textAlign",
  "flex",
  "flexDirection",
  "alignItems",
  "justifyContent",
  "gap",
  "gridTemplateColumns",
  "opacity",
  "zIndex",
  "overflow",
  "boxSizing",
  "transform",
  "boxShadow",
  "cursor",
  "pointerEvents"
], R = 6e3;
function Ht(t) {
  if (!t || !t.isConnected) return null;
  const e = t.getBoundingClientRect(), n = Nt(t);
  return {
    html: It(t),
    styles: n,
    rect: {
      top: Math.round(e.top),
      left: Math.round(e.left),
      width: Math.round(e.width),
      height: Math.round(e.height)
    }
  };
}
function It(t) {
  let e = t.outerHTML;
  return e = e.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ""), e.length <= R ? e : `${e.slice(0, R)}
<!-- hinge: truncated -->`;
}
function Nt(t) {
  if (!(t instanceof HTMLElement))
    return {};
  const e = window.getComputedStyle(t), n = {};
  for (const o of Vt) {
    const i = e[o];
    typeof i == "string" && i.length > 0 && (n[o] = i);
  }
  return n;
}
function kt({ getTarget: t, getElement: e }) {
  const n = w("");
  async function o(i) {
    const r = t(), a = Ht(e()), s = {
      note: n.value,
      url: window.location.href,
      component: r.component,
      dom: r.dom,
      props: r.props
    };
    a && (s.elementHtml = a.html, s.computedStyles = a.styles, s.elementRect = a.rect), await fetch("/api/queue", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(s)
    }), n.value = "", i == null || i();
  }
  return { note: n, sendNote: o };
}
const D = {
  component: "unknown",
  dom: "unknown",
  props: {}
}, Mt = /* @__PURE__ */ new Set([
  "button",
  "a",
  "input",
  "textarea",
  "select",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "label",
  "nav",
  "form"
]), zt = ["v-application", "v-main", "v-overlay", "v-toolbar"];
function Ot(t) {
  return !!t.closest(`#${_t}`);
}
function v(t) {
  const e = t.tagName.toLowerCase();
  return !!(e === "html" || e === "body" || [...t.classList].some((o) => zt.some((i) => o.startsWith(i))) || e === "div" && !t.id && E(t).length === 0);
}
function E(t) {
  return [...t.classList].filter(
    (e) => !e.startsWith("v-") && !e.includes("data-v-")
  );
}
function P(t, e = 36) {
  const n = t.trim().replace(/\s+/g, " ");
  return n.length > e ? `${n.slice(0, e - 1)}…` : n;
}
function H(t) {
  return [...t.classList].find((n) => n.startsWith("mdi-") && n !== "mdi" && n !== "mdi-set") ?? null;
}
function At(t) {
  return H(t) ? t : t.querySelector('i[class*="mdi-"]');
}
function I(t) {
  const e = t.tagName.toLowerCase();
  return e === "path" || e === "use" ? t.closest("svg") ?? t.closest(".v-icon") ?? t.closest("i") ?? t.closest(".skill-icon") ?? t : t;
}
function Rt(t) {
  const e = t.tagName.toLowerCase();
  return !!(e === "img" || e === "svg" || e === "i" && H(t) || t.classList.contains("v-icon") || t.classList.contains("skill-icon") || E(t).some((o) => /icon|badge/i.test(o)));
}
function j(t) {
  var o;
  const e = t.tagName.toLowerCase();
  if (e !== "span" && e !== "p") return !1;
  const n = (o = t.textContent) == null ? void 0 : o.trim();
  return !!n && n.length > 0 && n.length < 60;
}
function Dt(t) {
  const e = t.tagName.toLowerCase();
  return Mt.has(e) || e.startsWith("h");
}
function Yt(t) {
  return t.id || t.getAttribute("data-testid") || t.getAttribute("aria-label") ? !0 : E(t).length > 0;
}
function G(t) {
  const e = t.tagName.toLowerCase();
  if (e === "html" || e === "body") return e;
  const n = t.id ? `#${t.id}` : "", o = t.getAttribute("data-testid");
  if (o) return `${e}[data-testid="${o}"]`;
  const i = t.getAttribute("aria-label");
  if (i) return `${e}[aria-label="${i}"]`;
  const r = E(t).slice(0, 2), a = r.length ? `.${r.join(".")}` : "", s = `${e}${n}${a}`;
  return s.length > 48 ? `${s.slice(0, 45)}…` : s;
}
function Xt(t) {
  const e = At(t), n = e ? H(e) : null;
  if (n)
    return t.classList.contains("skill-icon") ? `icon ${n} (.skill-icon)` : `icon ${n}`;
  const o = t.tagName.toLowerCase();
  if (o === "img") {
    const i = t.getAttribute("alt");
    return i ? `img[alt="${P(i)}"]` : G(t);
  }
  return t.classList.contains("skill-icon") ? "div.skill-icon" : o === "svg" ? "svg icon" : null;
}
function Bt(t) {
  const e = I(t), n = Xt(e);
  if (n) return n;
  const o = e.tagName.toLowerCase();
  if (j(e)) {
    const i = P(e.textContent ?? ""), r = E(e);
    return r.length ? `${o}.${r[0]} "${i}"` : `${o} "${i}"`;
  }
  if (o === "button" || o === "a" || o.startsWith("h")) {
    const i = P(e.textContent ?? "");
    if (i) return `${o} "${i}"`;
  }
  if (o === "input" || o === "textarea") {
    const i = e.getAttribute("placeholder"), r = e.getAttribute("name");
    if (i) return `${o}[placeholder="${P(i, 24)}"]`;
    if (r) return `${o}[name="${r}"]`;
  }
  return G(e);
}
function Wt() {
  var e, n, o;
  const t = (o = (n = (e = window.__hingeRouter) == null ? void 0 : e.currentRoute) == null ? void 0 : n.value) == null ? void 0 : o.name;
  return t != null && t !== "" ? String(t) : null;
}
function jt(t, e, n) {
  const o = t + n / 2, i = e + n / 2;
  return document.elementsFromPoint(o, i).filter((r) => !Ot(r));
}
function Gt(t) {
  if (t.length === 0) return null;
  for (const e of t.slice(0, 20))
    if (!v(e) && Rt(e))
      return I(e);
  for (const e of t.slice(0, 20))
    if (!v(e) && j(e))
      return e;
  for (const e of t.slice(0, 20))
    if (!v(e) && Dt(e))
      return e;
  for (const e of t.slice(0, 20))
    if (!v(e) && Yt(e))
      return e;
  return t.find((e) => !v(e)) ?? t[0];
}
function Ft(t, e, n) {
  const o = jt(t, e, n), i = /* @__PURE__ */ new Set(), r = [], a = Gt(o);
  a && (i.add(a), r.push(a));
  for (const s of o.slice(0, 24)) {
    if (v(s)) continue;
    const p = I(s);
    i.has(p) || (i.add(p), r.push(p));
  }
  return r;
}
const Ut = /* @__PURE__ */ new Set([
  "AsyncComponentWrapper",
  "BaseTransition",
  "KeepAlive",
  "RouterView",
  "Teleport",
  "Transition",
  "VApp",
  "VBtn",
  "VCard",
  "VIcon",
  "VMain",
  "VOverlay",
  "VToolbar"
]);
function F(t) {
  var e, n, o;
  return ((e = t.type) == null ? void 0 : e.displayName) ?? ((n = t.type) == null ? void 0 : n.name) ?? ((o = t.type) == null ? void 0 : o.__name) ?? null;
}
function qt(t) {
  return t.__vueParentComponent ?? null;
}
function Jt(t) {
  const e = [];
  let n = qt(t);
  for (; n; )
    e.push(n), n = n.parent ?? null;
  return e;
}
function Kt(t) {
  const e = Jt(t);
  for (const n of e) {
    const o = F(n);
    if (o && !Ut.has(o))
      return n;
  }
  return e[0] ?? null;
}
function Qt(t) {
  const e = {};
  for (const [n, o] of Object.entries(t))
    if (typeof o != "function" && o !== void 0)
      try {
        JSON.stringify(o), e[n] = o;
      } catch {
        e[n] = String(o);
      }
  return e;
}
function Zt(t, e = 4) {
  const n = Object.entries(t).slice(0, e);
  if (n.length === 0) return "";
  const o = n.map(([r, a]) => {
    const s = typeof a == "string" ? `"${a}"` : JSON.stringify(a);
    return `${r}=${s}`;
  }), i = Object.keys(t).length > e ? " …" : "";
  return o.join(" ") + i;
}
function te(t) {
  if (!t)
    return { component: null, props: {} };
  const e = Kt(t);
  return e ? {
    component: F(e),
    props: Qt(e.props ?? {})
  } : { component: null, props: {} };
}
function ee(t, e = 0, n = 1) {
  const o = n > 1 ? `[${e + 1}/${n}] ` : "", i = Zt(t.props, 3);
  return i ? `${o}${t.component} · ${i}` : `${o}${t.component}`;
}
function ne(t) {
  if (!t) {
    const o = Wt();
    return {
      component: o ?? "unknown",
      dom: o ?? "unknown",
      props: {}
    };
  }
  const e = Bt(t), n = te(t);
  return {
    component: n.component ?? e,
    dom: e,
    props: n.props
  };
}
function oe(t) {
  const e = w({ ...D }), n = w(D.component), o = O(null), i = O([]), r = w(0);
  function a() {
    const c = i.value, d = c[r.value] ?? null;
    o.value = d, e.value = ne(d), n.value = ee(
      e.value,
      r.value,
      c.length
    );
  }
  function s() {
    i.value = Ft(t.x, t.y, T), r.value = 0, a();
  }
  function p() {
    const c = i.value;
    if (c.length === 0) {
      s();
      return;
    }
    r.value = (r.value + 1) % c.length, a();
  }
  return ot(() => {
    t.x, t.y, s();
  }), S(() => {
    var c, d;
    s(), window.addEventListener("resize", s), (c = window.visualViewport) == null || c.addEventListener("resize", s), (d = window.visualViewport) == null || d.addEventListener("scroll", s);
  }), V(() => {
    var c, d;
    window.removeEventListener("resize", s), (c = window.visualViewport) == null || c.removeEventListener("resize", s), (d = window.visualViewport) == null || d.removeEventListener("scroll", s);
  }), { target: e, targetLabel: n, selectedElement: o, cycleTarget: p, updateHighlight: a };
}
const ie = { id: "hinge-app" }, re = /* @__PURE__ */ C({
  __name: "Hinge",
  setup(t) {
    const e = w(!1), { position: n, cogStyle: o, clampPosition: i } = Tt(), { target: r, targetLabel: a, selectedElement: s, cycleTarget: p } = oe(n), { rect: c, update: d } = St(s), { note: l, sendNote: f } = kt({
      getTarget: () => r.value,
      getElement: () => s.value
    });
    W(s, () => d());
    function _() {
      e.value = !e.value;
    }
    const { onCogPointerDown: U, onCogPointerMove: q, onCogPointerUp: N, onCogContextMenu: J } = Lt({
      position: n,
      clampPosition: i,
      onTap: () => {
        p(), d();
      },
      onPanelToggle: _
    });
    async function K() {
      await f(() => {
        e.value = !1;
      });
    }
    return (se, b) => (m(), A(it, { to: "body" }, [
      u("div", ie, [
        x(ut, { rect: g(c) }, null, 8, ["rect"]),
        x(lt, {
          open: e.value,
          "cog-style": g(o),
          "target-label": g(a),
          onPointerdown: g(U),
          onPointermove: g(q),
          onPointerup: g(N),
          onPointercancel: g(N),
          onContextmenu: g(J)
        }, null, 8, ["open", "cog-style", "target-label", "onPointerdown", "onPointermove", "onPointerup", "onPointercancel", "onContextmenu"]),
        e.value ? (m(), A(Et, {
          key: 0,
          modelValue: g(l),
          "onUpdate:modelValue": b[0] || (b[0] = (k) => rt(l) ? l.value = k : null),
          target: g(r),
          onSend: K,
          onClose: b[1] || (b[1] = (k) => e.value = !1)
        }, null, 8, ["modelValue", "target"])) : L("", !0)
      ])
    ]));
  }
}), le = /* @__PURE__ */ $(re, [["__scopeId", "data-v-c85b2f17"]]);
export {
  le as Hinge
};
