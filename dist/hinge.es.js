/**
* @vue/shared v3.5.39
* (c) 2018-present Yuxi (Evan) You and Vue contributors
* @license MIT
**/
// @__NO_SIDE_EFFECTS__
function tt(e) {
  const t = /* @__PURE__ */ Object.create(null);
  for (const n of e.split(",")) t[n] = 1;
  return (n) => n in t;
}
const k = process.env.NODE_ENV !== "production" ? Object.freeze({}) : {}, $t = process.env.NODE_ENV !== "production" ? Object.freeze([]) : [], se = () => {
}, us = () => !1, ln = (e) => e.charCodeAt(0) === 111 && e.charCodeAt(1) === 110 && // uppercase letter
(e.charCodeAt(2) > 122 || e.charCodeAt(2) < 97), tn = (e) => e.startsWith("onUpdate:"), Z = Object.assign, Wo = (e, t) => {
  const n = e.indexOf(t);
  n > -1 && e.splice(n, 1);
}, Ci = Object.prototype.hasOwnProperty, B = (e, t) => Ci.call(e, t), T = Array.isArray, gt = (e) => un(e) === "[object Map]", fs = (e) => un(e) === "[object Set]", mr = (e) => un(e) === "[object Date]", P = (e) => typeof e == "function", X = (e) => typeof e == "string", Ae = (e) => typeof e == "symbol", G = (e) => e !== null && typeof e == "object", Bo = (e) => (G(e) || P(e)) && P(e.then) && P(e.catch), as = Object.prototype.toString, un = (e) => as.call(e), Ko = (e) => un(e).slice(8, -1), ps = (e) => un(e) === "[object Object]", Go = (e) => X(e) && e !== "NaN" && e[0] !== "-" && "" + parseInt(e, 10) === e, qt = /* @__PURE__ */ tt(
  // the leading comma is intentional so empty string "" is also included
  ",key,ref,ref_for,ref_key,onVnodeBeforeMount,onVnodeMounted,onVnodeBeforeUpdate,onVnodeUpdated,onVnodeBeforeUnmount,onVnodeUnmounted"
), Si = /* @__PURE__ */ tt(
  "bind,cloak,else-if,else,for,html,if,model,on,once,pre,show,slot,text,memo"
), qn = (e) => {
  const t = /* @__PURE__ */ Object.create(null);
  return ((n) => t[n] || (t[n] = e(n)));
}, Ti = /-\w/g, ge = qn(
  (e) => e.replace(Ti, (t) => t.slice(1).toUpperCase())
), $i = /\B([A-Z])/g, et = qn(
  (e) => e.replace($i, "-$1").toLowerCase()
), zn = qn((e) => e.charAt(0).toUpperCase() + e.slice(1)), dt = qn(
  (e) => e ? `on${zn(e)}` : ""
), le = (e, t) => !Object.is(e, t), xt = (e, ...t) => {
  for (let n = 0; n < e.length; n++)
    e[n](...t);
}, Mn = (e, t, n, o = !1) => {
  Object.defineProperty(e, t, {
    configurable: !0,
    enumerable: !1,
    writable: o,
    value: n
  });
}, qo = (e) => {
  const t = parseFloat(e);
  return isNaN(t) ? e : t;
};
let _r;
const fn = () => _r || (_r = typeof globalThis < "u" ? globalThis : typeof self < "u" ? self : typeof window < "u" ? window : typeof global < "u" ? global : {});
function an(e) {
  if (T(e)) {
    const t = {};
    for (let n = 0; n < e.length; n++) {
      const o = e[n], r = X(o) ? Ii(o) : an(o);
      if (r)
        for (const s in r)
          t[s] = r[s];
    }
    return t;
  } else if (X(e) || G(e))
    return e;
}
const Pi = /;(?![^(]*\))/g, Ai = /:([^]+)/, Mi = /\/\*[^]*?\*\//g;
function Ii(e) {
  const t = {};
  return e.replace(Mi, "").split(Pi).forEach((n) => {
    if (n) {
      const o = n.split(Ai);
      o.length > 1 && (t[o[0].trim()] = o[1].trim());
    }
  }), t;
}
function Yn(e) {
  let t = "";
  if (X(e))
    t = e;
  else if (T(e))
    for (let n = 0; n < e.length; n++) {
      const o = Yn(e[n]);
      o && (t += o + " ");
    }
  else if (G(e))
    for (const n in e)
      e[n] && (t += n + " ");
  return t.trim();
}
const Ri = "html,body,base,head,link,meta,style,title,address,article,aside,footer,header,hgroup,h1,h2,h3,h4,h5,h6,nav,section,div,dd,dl,dt,figcaption,figure,picture,hr,img,li,main,ol,p,pre,ul,a,b,abbr,bdi,bdo,br,cite,code,data,dfn,em,i,kbd,mark,q,rp,rt,ruby,s,samp,small,span,strong,sub,sup,time,u,var,wbr,area,audio,map,track,video,embed,object,param,source,canvas,script,noscript,del,ins,caption,col,colgroup,table,thead,tbody,td,th,tr,button,datalist,fieldset,form,input,label,legend,meter,optgroup,option,output,progress,select,textarea,details,dialog,menu,summary,template,blockquote,iframe,tfoot", Li = "svg,animate,animateMotion,animateTransform,circle,clipPath,color-profile,defs,desc,discard,ellipse,feBlend,feColorMatrix,feComponentTransfer,feComposite,feConvolveMatrix,feDiffuseLighting,feDisplacementMap,feDistantLight,feDropShadow,feFlood,feFuncA,feFuncB,feFuncG,feFuncR,feGaussianBlur,feImage,feMerge,feMergeNode,feMorphology,feOffset,fePointLight,feSpecularLighting,feSpotLight,feTile,feTurbulence,filter,foreignObject,g,hatch,hatchpath,image,line,linearGradient,marker,mask,mesh,meshgradient,meshpatch,meshrow,metadata,mpath,path,pattern,polygon,polyline,radialGradient,rect,set,solidcolor,stop,switch,symbol,text,textPath,title,tspan,unknown,use,view", Fi = "annotation,annotation-xml,maction,maligngroup,malignmark,math,menclose,merror,mfenced,mfrac,mfraction,mglyph,mi,mlabeledtr,mlongdiv,mmultiscripts,mn,mo,mover,mpadded,mphantom,mprescripts,mroot,mrow,ms,mscarries,mscarry,msgroup,msline,mspace,msqrt,msrow,mstack,mstyle,msub,msubsup,msup,mtable,mtd,mtext,mtr,munder,munderover,none,semantics", ji = /* @__PURE__ */ tt(Ri), Hi = /* @__PURE__ */ tt(Li), ki = /* @__PURE__ */ tt(Fi), Ui = "itemscope,allowfullscreen,formnovalidate,ismap,nomodule,novalidate,readonly", Wi = /* @__PURE__ */ tt(Ui);
function ds(e) {
  return !!e || e === "";
}
function Bi(e, t) {
  if (e.length !== t.length) return !1;
  let n = !0;
  for (let o = 0; n && o < e.length; o++)
    n = zo(e[o], t[o]);
  return n;
}
function zo(e, t) {
  if (e === t) return !0;
  let n = mr(e), o = mr(t);
  if (n || o)
    return n && o ? e.getTime() === t.getTime() : !1;
  if (n = Ae(e), o = Ae(t), n || o)
    return e === t;
  if (n = T(e), o = T(t), n || o)
    return n && o ? Bi(e, t) : !1;
  if (n = G(e), o = G(t), n || o) {
    if (!n || !o)
      return !1;
    const r = Object.keys(e).length, s = Object.keys(t).length;
    if (r !== s)
      return !1;
    for (const i in e) {
      const c = e.hasOwnProperty(i), u = t.hasOwnProperty(i);
      if (c && !u || !c && u || !zo(e[i], t[i]))
        return !1;
    }
  }
  return String(e) === String(t);
}
const hs = (e) => !!(e && e.__v_isRef === !0), Tt = (e) => X(e) ? e : e == null ? "" : T(e) || G(e) && (e.toString === as || !P(e.toString)) ? hs(e) ? Tt(e.value) : JSON.stringify(e, gs, 2) : String(e), gs = (e, t) => hs(t) ? gs(e, t.value) : gt(t) ? {
  [`Map(${t.size})`]: [...t.entries()].reduce(
    (n, [o, r], s) => (n[fo(o, s) + " =>"] = r, n),
    {}
  )
} : fs(t) ? {
  [`Set(${t.size})`]: [...t.values()].map((n) => fo(n))
} : Ae(t) ? fo(t) : G(t) && !T(t) && !ps(t) ? String(t) : t, fo = (e, t = "") => {
  var n;
  return (
    // Symbol.description in es2019+ so we need to cast here to pass
    // the lib: es2016 check
    Ae(e) ? `Symbol(${(n = e.description) != null ? n : t})` : e
  );
};
/**
* @vue/reactivity v3.5.39
* (c) 2018-present Yuxi (Evan) You and Vue contributors
* @license MIT
**/
function Me(e, ...t) {
  console.warn(`[Vue warn] ${e}`, ...t);
}
let ce;
class Ki {
  // TODO isolatedDeclarations "__v_skip"
  constructor(t = !1) {
    this.detached = t, this._active = !0, this._on = 0, this.effects = [], this.cleanups = [], this._isPaused = !1, this._warnOnRun = !0, this.__v_skip = !0, !t && ce && (ce.active ? (this.parent = ce, this.index = (ce.scopes || (ce.scopes = [])).push(
      this
    ) - 1) : (this._active = !1, this._warnOnRun = !1));
  }
  get active() {
    return this._active;
  }
  pause() {
    if (this._active) {
      this._isPaused = !0;
      let t, n;
      if (this.scopes)
        for (t = 0, n = this.scopes.length; t < n; t++)
          this.scopes[t].pause();
      for (t = 0, n = this.effects.length; t < n; t++)
        this.effects[t].pause();
    }
  }
  /**
   * Resumes the effect scope, including all child scopes and effects.
   */
  resume() {
    if (this._active && this._isPaused) {
      this._isPaused = !1;
      let t, n;
      if (this.scopes)
        for (t = 0, n = this.scopes.length; t < n; t++)
          this.scopes[t].resume();
      for (t = 0, n = this.effects.length; t < n; t++)
        this.effects[t].resume();
    }
  }
  run(t) {
    if (this._active) {
      const n = ce;
      try {
        return ce = this, t();
      } finally {
        ce = n;
      }
    } else process.env.NODE_ENV !== "production" && this._warnOnRun && Me("cannot run an inactive effect scope.");
  }
  /**
   * This should only be called on non-detached scopes
   * @internal
   */
  on() {
    ++this._on === 1 && (this.prevScope = ce, ce = this);
  }
  /**
   * This should only be called on non-detached scopes
   * @internal
   */
  off() {
    if (this._on > 0 && --this._on === 0) {
      if (ce === this)
        ce = this.prevScope;
      else {
        let t = ce;
        for (; t; ) {
          if (t.prevScope === this) {
            t.prevScope = this.prevScope;
            break;
          }
          t = t.prevScope;
        }
      }
      this.prevScope = void 0;
    }
  }
  stop(t) {
    if (this._active) {
      this._active = !1;
      let n, o;
      for (n = 0, o = this.effects.length; n < o; n++)
        this.effects[n].stop();
      for (this.effects.length = 0, n = 0, o = this.cleanups.length; n < o; n++)
        this.cleanups[n]();
      if (this.cleanups.length = 0, this.scopes) {
        for (n = 0, o = this.scopes.length; n < o; n++)
          this.scopes[n].stop(!0);
        this.scopes.length = 0;
      }
      if (!this.detached && this.parent && !t) {
        const r = this.parent.scopes.pop();
        r && r !== this && (this.parent.scopes[this.index] = r, r.index = this.index);
      }
      this.parent = void 0;
    }
  }
}
function Gi() {
  return ce;
}
let J;
const ao = /* @__PURE__ */ new WeakSet();
class ms {
  constructor(t) {
    this.fn = t, this.deps = void 0, this.depsTail = void 0, this.flags = 5, this.next = void 0, this.cleanup = void 0, this.scheduler = void 0, ce && (ce.active ? ce.effects.push(this) : this.flags &= -2);
  }
  pause() {
    this.flags |= 64;
  }
  resume() {
    this.flags & 64 && (this.flags &= -65, ao.has(this) && (ao.delete(this), this.trigger()));
  }
  /**
   * @internal
   */
  notify() {
    this.flags & 2 && !(this.flags & 32) || this.flags & 8 || vs(this);
  }
  run() {
    if (!(this.flags & 1))
      return this.fn();
    this.flags |= 2, vr(this), Es(this);
    const t = J, n = Pe;
    J = this, Pe = !0;
    try {
      return this.fn();
    } finally {
      process.env.NODE_ENV !== "production" && J !== this && Me(
        "Active effect was not restored correctly - this is likely a Vue internal bug."
      ), Ns(this), J = t, Pe = n, this.flags &= -3;
    }
  }
  stop() {
    if (this.flags & 1) {
      for (let t = this.deps; t; t = t.nextDep)
        Xo(t);
      this.deps = this.depsTail = void 0, vr(this), this.onStop && this.onStop(), this.flags &= -2;
    }
  }
  trigger() {
    this.flags & 64 ? ao.add(this) : this.scheduler ? this.scheduler() : this.runIfDirty();
  }
  /**
   * @internal
   */
  runIfDirty() {
    Oo(this) && this.run();
  }
  get dirty() {
    return Oo(this);
  }
}
let _s = 0, zt, Yt;
function vs(e, t = !1) {
  if (e.flags |= 8, t) {
    e.next = Yt, Yt = e;
    return;
  }
  e.next = zt, zt = e;
}
function Yo() {
  _s++;
}
function Jo() {
  if (--_s > 0)
    return;
  if (Yt) {
    let t = Yt;
    for (Yt = void 0; t; ) {
      const n = t.next;
      t.next = void 0, t.flags &= -9, t = n;
    }
  }
  let e;
  for (; zt; ) {
    let t = zt;
    for (zt = void 0; t; ) {
      const n = t.next;
      if (t.next = void 0, t.flags &= -9, t.flags & 1)
        try {
          t.trigger();
        } catch (o) {
          e || (e = o);
        }
      t = n;
    }
  }
  if (e) throw e;
}
function Es(e) {
  for (let t = e.deps; t; t = t.nextDep)
    t.version = -1, t.prevActiveLink = t.dep.activeLink, t.dep.activeLink = t;
}
function Ns(e) {
  let t, n = e.depsTail, o = n;
  for (; o; ) {
    const r = o.prevDep;
    o.version === -1 ? (o === n && (n = r), Xo(o), qi(o)) : t = o, o.dep.activeLink = o.prevActiveLink, o.prevActiveLink = void 0, o = r;
  }
  e.deps = t, e.depsTail = n;
}
function Oo(e) {
  for (let t = e.deps; t; t = t.nextDep)
    if (t.dep.version !== t.version || t.dep.computed && (bs(t.dep.computed) || t.dep.version !== t.version))
      return !0;
  return !!e._dirty;
}
function bs(e) {
  if (e.flags & 4 && !(e.flags & 16) || (e.flags &= -17, e.globalVersion === nn) || (e.globalVersion = nn, !e.isSSR && e.flags & 128 && (!e.deps && !e._dirty || !Oo(e))))
    return;
  e.flags |= 2;
  const t = e.dep, n = J, o = Pe;
  J = e, Pe = !0;
  try {
    Es(e);
    const r = e.fn(e._value);
    (t.version === 0 || le(r, e._value)) && (e.flags |= 128, e._value = r, t.version++);
  } catch (r) {
    throw t.version++, r;
  } finally {
    J = n, Pe = o, Ns(e), e.flags &= -3;
  }
}
function Xo(e, t = !1) {
  const { dep: n, prevSub: o, nextSub: r } = e;
  if (o && (o.nextSub = r, e.prevSub = void 0), r && (r.prevSub = o, e.nextSub = void 0), process.env.NODE_ENV !== "production" && n.subsHead === e && (n.subsHead = r), n.subs === e && (n.subs = o, !o && n.computed)) {
    n.computed.flags &= -5;
    for (let s = n.computed.deps; s; s = s.nextDep)
      Xo(s, !0);
  }
  !t && !--n.sc && n.map && n.map.delete(n.key);
}
function qi(e) {
  const { prevDep: t, nextDep: n } = e;
  t && (t.nextDep = n, e.prevDep = void 0), n && (n.prevDep = t, e.nextDep = void 0);
}
let Pe = !0;
const ys = [];
function xe() {
  ys.push(Pe), Pe = !1;
}
function De() {
  const e = ys.pop();
  Pe = e === void 0 ? !0 : e;
}
function vr(e) {
  const { cleanup: t } = e;
  if (e.cleanup = void 0, t) {
    const n = J;
    J = void 0;
    try {
      t();
    } finally {
      J = n;
    }
  }
}
let nn = 0;
class zi {
  constructor(t, n) {
    this.sub = t, this.dep = n, this.version = n.version, this.nextDep = this.prevDep = this.nextSub = this.prevSub = this.prevActiveLink = void 0;
  }
}
class Jn {
  // TODO isolatedDeclarations "__v_skip"
  constructor(t) {
    this.computed = t, this.version = 0, this.activeLink = void 0, this.subs = void 0, this.map = void 0, this.key = void 0, this.sc = 0, this.__v_skip = !0, process.env.NODE_ENV !== "production" && (this.subsHead = void 0);
  }
  track(t) {
    if (!J || !Pe || J === this.computed)
      return;
    let n = this.activeLink;
    if (n === void 0 || n.sub !== J)
      n = this.activeLink = new zi(J, this), J.deps ? (n.prevDep = J.depsTail, J.depsTail.nextDep = n, J.depsTail = n) : J.deps = J.depsTail = n, Os(n);
    else if (n.version === -1 && (n.version = this.version, n.nextDep)) {
      const o = n.nextDep;
      o.prevDep = n.prevDep, n.prevDep && (n.prevDep.nextDep = o), n.prevDep = J.depsTail, n.nextDep = void 0, J.depsTail.nextDep = n, J.depsTail = n, J.deps === n && (J.deps = o);
    }
    return process.env.NODE_ENV !== "production" && J.onTrack && J.onTrack(
      Z(
        {
          effect: J
        },
        t
      )
    ), n;
  }
  trigger(t) {
    this.version++, nn++, this.notify(t);
  }
  notify(t) {
    Yo();
    try {
      if (process.env.NODE_ENV !== "production")
        for (let n = this.subsHead; n; n = n.nextSub)
          n.sub.onTrigger && !(n.sub.flags & 8) && n.sub.onTrigger(
            Z(
              {
                effect: n.sub
              },
              t
            )
          );
      for (let n = this.subs; n; n = n.prevSub)
        n.sub.notify() && n.sub.dep.notify();
    } finally {
      Jo();
    }
  }
}
function Os(e) {
  if (e.dep.sc++, e.sub.flags & 4) {
    const t = e.dep.computed;
    if (t && !e.dep.subs) {
      t.flags |= 20;
      for (let o = t.deps; o; o = o.nextDep)
        Os(o);
    }
    const n = e.dep.subs;
    n !== e && (e.prevSub = n, n && (n.nextSub = e)), process.env.NODE_ENV !== "production" && e.dep.subsHead === void 0 && (e.dep.subsHead = e), e.dep.subs = e;
  }
}
const wo = /* @__PURE__ */ new WeakMap(), mt = /* @__PURE__ */ Symbol(
  process.env.NODE_ENV !== "production" ? "Object iterate" : ""
), Vo = /* @__PURE__ */ Symbol(
  process.env.NODE_ENV !== "production" ? "Map keys iterate" : ""
), on = /* @__PURE__ */ Symbol(
  process.env.NODE_ENV !== "production" ? "Array iterate" : ""
);
function re(e, t, n) {
  if (Pe && J) {
    let o = wo.get(e);
    o || wo.set(e, o = /* @__PURE__ */ new Map());
    let r = o.get(n);
    r || (o.set(n, r = new Jn()), r.map = o, r.key = n), process.env.NODE_ENV !== "production" ? r.track({
      target: e,
      type: t,
      key: n
    }) : r.track();
  }
}
function Ke(e, t, n, o, r, s) {
  const i = wo.get(e);
  if (!i) {
    nn++;
    return;
  }
  const c = (u) => {
    u && (process.env.NODE_ENV !== "production" ? u.trigger({
      target: e,
      type: t,
      key: n,
      newValue: o,
      oldValue: r,
      oldTarget: s
    }) : u.trigger());
  };
  if (Yo(), t === "clear")
    i.forEach(c);
  else {
    const u = T(e), d = u && Go(n);
    if (u && n === "length") {
      const a = Number(o);
      i.forEach((f, h) => {
        (h === "length" || h === on || !Ae(h) && h >= a) && c(f);
      });
    } else
      switch ((n !== void 0 || i.has(void 0)) && c(i.get(n)), d && c(i.get(on)), t) {
        case "add":
          u ? d && c(i.get("length")) : (c(i.get(mt)), gt(e) && c(i.get(Vo)));
          break;
        case "delete":
          u || (c(i.get(mt)), gt(e) && c(i.get(Vo)));
          break;
        case "set":
          gt(e) && c(i.get(mt));
          break;
      }
  }
  Jo();
}
function Ot(e) {
  const t = /* @__PURE__ */ R(e);
  return t === e ? t : (re(t, "iterate", on), /* @__PURE__ */ me(e) ? t : t.map(Re));
}
function Xn(e) {
  return re(e = /* @__PURE__ */ R(e), "iterate", on), e;
}
function Be(e, t) {
  return /* @__PURE__ */ Ie(e) ? Mt(/* @__PURE__ */ lt(e) ? Re(t) : t) : Re(t);
}
const Yi = {
  __proto__: null,
  [Symbol.iterator]() {
    return po(this, Symbol.iterator, (e) => Be(this, e));
  },
  concat(...e) {
    return Ot(this).concat(
      ...e.map((t) => T(t) ? Ot(t) : t)
    );
  },
  entries() {
    return po(this, "entries", (e) => (e[1] = Be(this, e[1]), e));
  },
  every(e, t) {
    return qe(this, "every", e, t, void 0, arguments);
  },
  filter(e, t) {
    return qe(
      this,
      "filter",
      e,
      t,
      (n) => n.map((o) => Be(this, o)),
      arguments
    );
  },
  find(e, t) {
    return qe(
      this,
      "find",
      e,
      t,
      (n) => Be(this, n),
      arguments
    );
  },
  findIndex(e, t) {
    return qe(this, "findIndex", e, t, void 0, arguments);
  },
  findLast(e, t) {
    return qe(
      this,
      "findLast",
      e,
      t,
      (n) => Be(this, n),
      arguments
    );
  },
  findLastIndex(e, t) {
    return qe(this, "findLastIndex", e, t, void 0, arguments);
  },
  // flat, flatMap could benefit from ARRAY_ITERATE but are not straight-forward to implement
  forEach(e, t) {
    return qe(this, "forEach", e, t, void 0, arguments);
  },
  includes(...e) {
    return ho(this, "includes", e);
  },
  indexOf(...e) {
    return ho(this, "indexOf", e);
  },
  join(e) {
    return Ot(this).join(e);
  },
  // keys() iterator only reads `length`, no optimization required
  lastIndexOf(...e) {
    return ho(this, "lastIndexOf", e);
  },
  map(e, t) {
    return qe(this, "map", e, t, void 0, arguments);
  },
  pop() {
    return Ht(this, "pop");
  },
  push(...e) {
    return Ht(this, "push", e);
  },
  reduce(e, ...t) {
    return Er(this, "reduce", e, t);
  },
  reduceRight(e, ...t) {
    return Er(this, "reduceRight", e, t);
  },
  shift() {
    return Ht(this, "shift");
  },
  // slice could use ARRAY_ITERATE but also seems to beg for range tracking
  some(e, t) {
    return qe(this, "some", e, t, void 0, arguments);
  },
  splice(...e) {
    return Ht(this, "splice", e);
  },
  toReversed() {
    return Ot(this).toReversed();
  },
  toSorted(e) {
    return Ot(this).toSorted(e);
  },
  toSpliced(...e) {
    return Ot(this).toSpliced(...e);
  },
  unshift(...e) {
    return Ht(this, "unshift", e);
  },
  values() {
    return po(this, "values", (e) => Be(this, e));
  }
};
function po(e, t, n) {
  const o = Xn(e), r = o[t]();
  return o !== e && !/* @__PURE__ */ me(e) && (r._next = r.next, r.next = () => {
    const s = r._next();
    return s.done || (s.value = n(s.value)), s;
  }), r;
}
const Ji = Array.prototype;
function qe(e, t, n, o, r, s) {
  const i = Xn(e), c = i !== e && !/* @__PURE__ */ me(e), u = i[t];
  if (u !== Ji[t]) {
    const f = u.apply(e, s);
    return c ? Re(f) : f;
  }
  let d = n;
  i !== e && (c ? d = function(f, h) {
    return n.call(this, Be(e, f), h, e);
  } : n.length > 2 && (d = function(f, h) {
    return n.call(this, f, h, e);
  }));
  const a = u.call(i, d, o);
  return c && r ? r(a) : a;
}
function Er(e, t, n, o) {
  const r = Xn(e), s = r !== e && !/* @__PURE__ */ me(e);
  let i = n, c = !1;
  r !== e && (s ? (c = o.length === 0, i = function(d, a, f) {
    return c && (c = !1, d = Be(e, d)), n.call(this, d, Be(e, a), f, e);
  }) : n.length > 3 && (i = function(d, a, f) {
    return n.call(this, d, a, f, e);
  }));
  const u = r[t](i, ...o);
  return c ? Be(e, u) : u;
}
function ho(e, t, n) {
  const o = /* @__PURE__ */ R(e);
  re(o, "iterate", on);
  const r = o[t](...n);
  return (r === -1 || r === !1) && /* @__PURE__ */ In(n[0]) ? (n[0] = /* @__PURE__ */ R(n[0]), o[t](...n)) : r;
}
function Ht(e, t, n = []) {
  xe(), Yo();
  const o = (/* @__PURE__ */ R(e))[t].apply(e, n);
  return Jo(), De(), o;
}
const Xi = /* @__PURE__ */ tt("__proto__,__v_isRef,__isVue"), ws = new Set(
  /* @__PURE__ */ Object.getOwnPropertyNames(Symbol).filter((e) => e !== "arguments" && e !== "caller").map((e) => Symbol[e]).filter(Ae)
);
function Zi(e) {
  Ae(e) || (e = String(e));
  const t = /* @__PURE__ */ R(this);
  return re(t, "has", e), t.hasOwnProperty(e);
}
class Vs {
  constructor(t = !1, n = !1) {
    this._isReadonly = t, this._isShallow = n;
  }
  get(t, n, o) {
    if (n === "__v_skip") return t.__v_skip;
    const r = this._isReadonly, s = this._isShallow;
    if (n === "__v_isReactive")
      return !r;
    if (n === "__v_isReadonly")
      return r;
    if (n === "__v_isShallow")
      return s;
    if (n === "__v_raw")
      return o === (r ? s ? $s : Ts : s ? Ss : Cs).get(t) || // receiver is not the reactive proxy, but has the same prototype
      // this means the receiver is a user proxy of the reactive proxy
      Object.getPrototypeOf(t) === Object.getPrototypeOf(o) ? t : void 0;
    const i = T(t);
    if (!r) {
      let u;
      if (i && (u = Yi[n]))
        return u;
      if (n === "hasOwnProperty")
        return Zi;
    }
    const c = Reflect.get(
      t,
      n,
      // if this is a proxy wrapping a ref, return methods using the raw ref
      // as receiver so that we don't have to call `toRaw` on the ref in all
      // its class methods
      /* @__PURE__ */ te(t) ? t : o
    );
    if ((Ae(n) ? ws.has(n) : Xi(n)) || (r || re(t, "get", n), s))
      return c;
    if (/* @__PURE__ */ te(c)) {
      const u = i && Go(n) ? c : c.value;
      return r && G(u) ? /* @__PURE__ */ Do(u) : u;
    }
    return G(c) ? r ? /* @__PURE__ */ Do(c) : /* @__PURE__ */ pn(c) : c;
  }
}
class xs extends Vs {
  constructor(t = !1) {
    super(!1, t);
  }
  set(t, n, o, r) {
    let s = t[n];
    const i = T(t) && Go(n);
    if (!this._isShallow) {
      const d = /* @__PURE__ */ Ie(s);
      if (!/* @__PURE__ */ me(o) && !/* @__PURE__ */ Ie(o) && (s = /* @__PURE__ */ R(s), o = /* @__PURE__ */ R(o)), !i && /* @__PURE__ */ te(s) && !/* @__PURE__ */ te(o))
        return d ? (process.env.NODE_ENV !== "production" && Me(
          `Set operation on key "${String(n)}" failed: target is readonly.`,
          t[n]
        ), !0) : (s.value = o, !0);
    }
    const c = i ? Number(n) < t.length : B(t, n), u = Reflect.set(
      t,
      n,
      o,
      /* @__PURE__ */ te(t) ? t : r
    );
    return t === /* @__PURE__ */ R(r) && u && (c ? le(o, s) && Ke(t, "set", n, o, s) : Ke(t, "add", n, o)), u;
  }
  deleteProperty(t, n) {
    const o = B(t, n), r = t[n], s = Reflect.deleteProperty(t, n);
    return s && o && Ke(t, "delete", n, void 0, r), s;
  }
  has(t, n) {
    const o = Reflect.has(t, n);
    return (!Ae(n) || !ws.has(n)) && re(t, "has", n), o;
  }
  ownKeys(t) {
    return re(
      t,
      "iterate",
      T(t) ? "length" : mt
    ), Reflect.ownKeys(t);
  }
}
class Ds extends Vs {
  constructor(t = !1) {
    super(!0, t);
  }
  set(t, n) {
    return process.env.NODE_ENV !== "production" && Me(
      `Set operation on key "${String(n)}" failed: target is readonly.`,
      t
    ), !0;
  }
  deleteProperty(t, n) {
    return process.env.NODE_ENV !== "production" && Me(
      `Delete operation on key "${String(n)}" failed: target is readonly.`,
      t
    ), !0;
  }
}
const Qi = /* @__PURE__ */ new xs(), ec = /* @__PURE__ */ new Ds(), tc = /* @__PURE__ */ new xs(!0), nc = /* @__PURE__ */ new Ds(!0), xo = (e) => e, On = (e) => Reflect.getPrototypeOf(e);
function oc(e, t, n) {
  return function(...o) {
    const r = this.__v_raw, s = /* @__PURE__ */ R(r), i = gt(s), c = e === "entries" || e === Symbol.iterator && i, u = e === "keys" && i, d = r[e](...o), a = n ? xo : t ? Mt : Re;
    return !t && re(
      s,
      "iterate",
      u ? Vo : mt
    ), Z(
      // inheriting all iterator properties
      Object.create(d),
      {
        // iterator protocol
        next() {
          const { value: f, done: h } = d.next();
          return h ? { value: f, done: h } : {
            value: c ? [a(f[0]), a(f[1])] : a(f),
            done: h
          };
        }
      }
    );
  };
}
function wn(e) {
  return function(...t) {
    if (process.env.NODE_ENV !== "production") {
      const n = t[0] ? `on key "${t[0]}" ` : "";
      Me(
        `${zn(e)} operation ${n}failed: target is readonly.`,
        /* @__PURE__ */ R(this)
      );
    }
    return e === "delete" ? !1 : e === "clear" ? void 0 : this;
  };
}
function rc(e, t) {
  const n = {
    get(r) {
      const s = this.__v_raw, i = /* @__PURE__ */ R(s), c = /* @__PURE__ */ R(r);
      e || (le(r, c) && re(i, "get", r), re(i, "get", c));
      const { has: u } = On(i), d = t ? xo : e ? Mt : Re;
      if (u.call(i, r))
        return d(s.get(r));
      if (u.call(i, c))
        return d(s.get(c));
      s !== i && s.get(r);
    },
    get size() {
      const r = this.__v_raw;
      return !e && re(/* @__PURE__ */ R(r), "iterate", mt), r.size;
    },
    has(r) {
      const s = this.__v_raw, i = /* @__PURE__ */ R(s), c = /* @__PURE__ */ R(r);
      return e || (le(r, c) && re(i, "has", r), re(i, "has", c)), r === c ? s.has(r) : s.has(r) || s.has(c);
    },
    forEach(r, s) {
      const i = this, c = i.__v_raw, u = /* @__PURE__ */ R(c), d = t ? xo : e ? Mt : Re;
      return !e && re(u, "iterate", mt), c.forEach((a, f) => r.call(s, d(a), d(f), i));
    }
  };
  return Z(
    n,
    e ? {
      add: wn("add"),
      set: wn("set"),
      delete: wn("delete"),
      clear: wn("clear")
    } : {
      add(r) {
        const s = /* @__PURE__ */ R(this), i = On(s), c = /* @__PURE__ */ R(r), u = !t && !/* @__PURE__ */ me(r) && !/* @__PURE__ */ Ie(r) ? c : r;
        return i.has.call(s, u) || le(r, u) && i.has.call(s, r) || le(c, u) && i.has.call(s, c) || (s.add(u), Ke(s, "add", u, u)), this;
      },
      set(r, s) {
        !t && !/* @__PURE__ */ me(s) && !/* @__PURE__ */ Ie(s) && (s = /* @__PURE__ */ R(s));
        const i = /* @__PURE__ */ R(this), { has: c, get: u } = On(i);
        let d = c.call(i, r);
        d ? process.env.NODE_ENV !== "production" && Nr(i, c, r) : (r = /* @__PURE__ */ R(r), d = c.call(i, r));
        const a = u.call(i, r);
        return i.set(r, s), d ? le(s, a) && Ke(i, "set", r, s, a) : Ke(i, "add", r, s), this;
      },
      delete(r) {
        const s = /* @__PURE__ */ R(this), { has: i, get: c } = On(s);
        let u = i.call(s, r);
        u ? process.env.NODE_ENV !== "production" && Nr(s, i, r) : (r = /* @__PURE__ */ R(r), u = i.call(s, r));
        const d = c ? c.call(s, r) : void 0, a = s.delete(r);
        return u && Ke(s, "delete", r, void 0, d), a;
      },
      clear() {
        const r = /* @__PURE__ */ R(this), s = r.size !== 0, i = process.env.NODE_ENV !== "production" ? gt(r) ? new Map(r) : new Set(r) : void 0, c = r.clear();
        return s && Ke(
          r,
          "clear",
          void 0,
          void 0,
          i
        ), c;
      }
    }
  ), [
    "keys",
    "values",
    "entries",
    Symbol.iterator
  ].forEach((r) => {
    n[r] = oc(r, e, t);
  }), n;
}
function Zn(e, t) {
  const n = rc(e, t);
  return (o, r, s) => r === "__v_isReactive" ? !e : r === "__v_isReadonly" ? e : r === "__v_raw" ? o : Reflect.get(
    B(n, r) && r in o ? n : o,
    r,
    s
  );
}
const sc = {
  get: /* @__PURE__ */ Zn(!1, !1)
}, ic = {
  get: /* @__PURE__ */ Zn(!1, !0)
}, cc = {
  get: /* @__PURE__ */ Zn(!0, !1)
}, lc = {
  get: /* @__PURE__ */ Zn(!0, !0)
};
function Nr(e, t, n) {
  const o = /* @__PURE__ */ R(n);
  if (o !== n && t.call(e, o)) {
    const r = Ko(e);
    Me(
      `Reactive ${r} contains both the raw and reactive versions of the same object${r === "Map" ? " as keys" : ""}, which can lead to inconsistencies. Avoid differentiating between the raw and reactive versions of an object and only use the reactive version if possible.`
    );
  }
}
const Cs = /* @__PURE__ */ new WeakMap(), Ss = /* @__PURE__ */ new WeakMap(), Ts = /* @__PURE__ */ new WeakMap(), $s = /* @__PURE__ */ new WeakMap();
function uc(e) {
  switch (e) {
    case "Object":
    case "Array":
      return 1;
    case "Map":
    case "Set":
    case "WeakMap":
    case "WeakSet":
      return 2;
    default:
      return 0;
  }
}
// @__NO_SIDE_EFFECTS__
function pn(e) {
  return /* @__PURE__ */ Ie(e) ? e : Qn(
    e,
    !1,
    Qi,
    sc,
    Cs
  );
}
// @__NO_SIDE_EFFECTS__
function fc(e) {
  return Qn(
    e,
    !1,
    tc,
    ic,
    Ss
  );
}
// @__NO_SIDE_EFFECTS__
function Do(e) {
  return Qn(
    e,
    !0,
    ec,
    cc,
    Ts
  );
}
// @__NO_SIDE_EFFECTS__
function Ge(e) {
  return Qn(
    e,
    !0,
    nc,
    lc,
    $s
  );
}
function Qn(e, t, n, o, r) {
  if (!G(e))
    return process.env.NODE_ENV !== "production" && Me(
      `value cannot be made ${t ? "readonly" : "reactive"}: ${String(
        e
      )}`
    ), e;
  if (e.__v_raw && !(t && e.__v_isReactive) || e.__v_skip || !Object.isExtensible(e))
    return e;
  const s = r.get(e);
  if (s)
    return s;
  const i = uc(Ko(e));
  if (i === 0)
    return e;
  const c = new Proxy(
    e,
    i === 2 ? o : n
  );
  return r.set(e, c), c;
}
// @__NO_SIDE_EFFECTS__
function lt(e) {
  return /* @__PURE__ */ Ie(e) ? /* @__PURE__ */ lt(e.__v_raw) : !!(e && e.__v_isReactive);
}
// @__NO_SIDE_EFFECTS__
function Ie(e) {
  return !!(e && e.__v_isReadonly);
}
// @__NO_SIDE_EFFECTS__
function me(e) {
  return !!(e && e.__v_isShallow);
}
// @__NO_SIDE_EFFECTS__
function In(e) {
  return e ? !!e.__v_raw : !1;
}
// @__NO_SIDE_EFFECTS__
function R(e) {
  const t = e && e.__v_raw;
  return t ? /* @__PURE__ */ R(t) : e;
}
function ac(e) {
  return !B(e, "__v_skip") && Object.isExtensible(e) && Mn(e, "__v_skip", !0), e;
}
const Re = (e) => G(e) ? /* @__PURE__ */ pn(e) : e, Mt = (e) => G(e) ? /* @__PURE__ */ Do(e) : e;
// @__NO_SIDE_EFFECTS__
function te(e) {
  return e ? e.__v_isRef === !0 : !1;
}
// @__NO_SIDE_EFFECTS__
function ut(e) {
  return Ps(e, !1);
}
// @__NO_SIDE_EFFECTS__
function br(e) {
  return Ps(e, !0);
}
function Ps(e, t) {
  return /* @__PURE__ */ te(e) ? e : new pc(e, t);
}
class pc {
  constructor(t, n) {
    this.dep = new Jn(), this.__v_isRef = !0, this.__v_isShallow = !1, this._rawValue = n ? t : /* @__PURE__ */ R(t), this._value = n ? t : Re(t), this.__v_isShallow = n;
  }
  get value() {
    return process.env.NODE_ENV !== "production" ? this.dep.track({
      target: this,
      type: "get",
      key: "value"
    }) : this.dep.track(), this._value;
  }
  set value(t) {
    const n = this._rawValue, o = this.__v_isShallow || /* @__PURE__ */ me(t) || /* @__PURE__ */ Ie(t);
    t = o ? t : /* @__PURE__ */ R(t), le(t, n) && (this._rawValue = t, this._value = o ? t : Re(t), process.env.NODE_ENV !== "production" ? this.dep.trigger({
      target: this,
      type: "set",
      key: "value",
      newValue: t,
      oldValue: n
    }) : this.dep.trigger());
  }
}
function Ce(e) {
  return /* @__PURE__ */ te(e) ? e.value : e;
}
const dc = {
  get: (e, t, n) => t === "__v_raw" ? e : Ce(Reflect.get(e, t, n)),
  set: (e, t, n, o) => {
    const r = e[t];
    return /* @__PURE__ */ te(r) && !/* @__PURE__ */ te(n) ? (r.value = n, !0) : Reflect.set(e, t, n, o);
  }
};
function As(e) {
  return /* @__PURE__ */ lt(e) ? e : new Proxy(e, dc);
}
class hc {
  constructor(t) {
    this.__v_isRef = !0, this._value = void 0;
    const n = this.dep = new Jn(), { get: o, set: r } = t(n.track.bind(n), n.trigger.bind(n));
    this._get = o, this._set = r;
  }
  get value() {
    return this._value = this._get();
  }
  set value(t) {
    this._set(t);
  }
}
function gc(e) {
  return new hc(e);
}
class mc {
  constructor(t, n, o) {
    this.fn = t, this.setter = n, this._value = void 0, this.dep = new Jn(this), this.__v_isRef = !0, this.deps = void 0, this.depsTail = void 0, this.flags = 16, this.globalVersion = nn - 1, this.next = void 0, this.effect = this, this.__v_isReadonly = !n, this.isSSR = o;
  }
  /**
   * @internal
   */
  notify() {
    if (this.flags |= 16, !(this.flags & 8) && // avoid infinite self recursion
    J !== this)
      return vs(this, !0), !0;
    process.env.NODE_ENV;
  }
  get value() {
    const t = process.env.NODE_ENV !== "production" ? this.dep.track({
      target: this,
      type: "get",
      key: "value"
    }) : this.dep.track();
    return bs(this), t && (t.version = this.dep.version), this._value;
  }
  set value(t) {
    this.setter ? this.setter(t) : process.env.NODE_ENV !== "production" && Me("Write operation failed: computed value is readonly");
  }
}
// @__NO_SIDE_EFFECTS__
function _c(e, t, n = !1) {
  let o, r;
  P(e) ? o = e : (o = e.get, r = e.set);
  const s = new mc(o, r, n);
  return process.env.NODE_ENV, s;
}
const Vn = {}, Rn = /* @__PURE__ */ new WeakMap();
let ht;
function vc(e, t = !1, n = ht) {
  if (n) {
    let o = Rn.get(n);
    o || Rn.set(n, o = []), o.push(e);
  } else process.env.NODE_ENV !== "production" && !t && Me(
    "onWatcherCleanup() was called when there was no active watcher to associate with."
  );
}
function Ec(e, t, n = k) {
  const { immediate: o, deep: r, once: s, scheduler: i, augmentJob: c, call: u } = n, d = (C) => {
    (n.onWarn || Me)(
      "Invalid watch source: ",
      C,
      "A watch source can only be a getter/effect function, a ref, a reactive object, or an array of these types."
    );
  }, a = (C) => r ? C : /* @__PURE__ */ me(C) || r === !1 || r === 0 ? Xe(C, 1) : Xe(C);
  let f, h, E, D, V = !1, I = !1;
  if (/* @__PURE__ */ te(e) ? (h = () => e.value, V = /* @__PURE__ */ me(e)) : /* @__PURE__ */ lt(e) ? (h = () => a(e), V = !0) : T(e) ? (I = !0, V = e.some((C) => /* @__PURE__ */ lt(C) || /* @__PURE__ */ me(C)), h = () => e.map((C) => {
    if (/* @__PURE__ */ te(C))
      return C.value;
    if (/* @__PURE__ */ lt(C))
      return a(C);
    if (P(C))
      return u ? u(C, 2) : C();
    process.env.NODE_ENV !== "production" && d(C);
  })) : P(e) ? t ? h = u ? () => u(e, 2) : e : h = () => {
    if (E) {
      xe();
      try {
        E();
      } finally {
        De();
      }
    }
    const C = ht;
    ht = f;
    try {
      return u ? u(e, 3, [D]) : e(D);
    } finally {
      ht = C;
    }
  } : (h = se, process.env.NODE_ENV !== "production" && d(e)), t && r) {
    const C = h, ee = r === !0 ? 1 / 0 : r;
    h = () => Xe(C(), ee);
  }
  const j = Gi(), A = () => {
    f.stop(), j && j.active && Wo(j.effects, f);
  };
  if (s && t) {
    const C = t;
    t = (...ee) => {
      const L = C(...ee);
      return A(), L;
    };
  }
  let F = I ? new Array(e.length).fill(Vn) : Vn;
  const Q = (C) => {
    if (!(!(f.flags & 1) || !f.dirty && !C))
      if (t) {
        const ee = f.run();
        if (C || r || V || (I ? ee.some((L, q) => le(L, F[q])) : le(ee, F))) {
          E && E();
          const L = ht;
          ht = f;
          try {
            const q = [
              ee,
              // pass undefined as the old value when it's changed for the first time
              F === Vn ? void 0 : I && F[0] === Vn ? [] : F,
              D
            ];
            F = ee, u ? u(t, 3, q) : (
              // @ts-expect-error
              t(...q)
            );
          } finally {
            ht = L;
          }
        }
      } else
        f.run();
  };
  return c && c(Q), f = new ms(h), f.scheduler = i ? () => i(Q, !1) : Q, D = (C) => vc(C, !1, f), E = f.onStop = () => {
    const C = Rn.get(f);
    if (C) {
      if (u)
        u(C, 4);
      else
        for (const ee of C) ee();
      Rn.delete(f);
    }
  }, process.env.NODE_ENV !== "production" && (f.onTrack = n.onTrack, f.onTrigger = n.onTrigger), t ? o ? Q(!0) : F = f.run() : i ? i(Q.bind(null, !0), !0) : f.run(), A.pause = f.pause.bind(f), A.resume = f.resume.bind(f), A.stop = A, A;
}
function Xe(e, t = 1 / 0, n) {
  if (t <= 0 || !G(e) || e.__v_skip || (n = n || /* @__PURE__ */ new Map(), (n.get(e) || 0) >= t))
    return e;
  if (n.set(e, t), t--, /* @__PURE__ */ te(e))
    Xe(e.value, t, n);
  else if (T(e))
    for (let o = 0; o < e.length; o++)
      Xe(e[o], t, n);
  else if (fs(e) || gt(e))
    e.forEach((o) => {
      Xe(o, t, n);
    });
  else if (ps(e)) {
    for (const o in e)
      Xe(e[o], t, n);
    for (const o of Object.getOwnPropertySymbols(e))
      Object.prototype.propertyIsEnumerable.call(e, o) && Xe(e[o], t, n);
  }
  return e;
}
/**
* @vue/runtime-core v3.5.39
* (c) 2018-present Yuxi (Evan) You and Vue contributors
* @license MIT
**/
const _t = [];
function Dn(e) {
  _t.push(e);
}
function Cn() {
  _t.pop();
}
let go = !1;
function b(e, ...t) {
  if (go) return;
  go = !0, xe();
  const n = _t.length ? _t[_t.length - 1].component : null, o = n && n.appContext.config.warnHandler, r = Nc();
  if (o)
    It(
      o,
      n,
      11,
      [
        // eslint-disable-next-line no-restricted-syntax
        e + t.map((s) => {
          var i, c;
          return (c = (i = s.toString) == null ? void 0 : i.call(s)) != null ? c : JSON.stringify(s);
        }).join(""),
        n && n.proxy,
        r.map(
          ({ vnode: s }) => `at <${En(n, s.type)}>`
        ).join(`
`),
        r
      ]
    );
  else {
    const s = [`[Vue warn]: ${e}`, ...t];
    r.length && s.push(`
`, ...bc(r)), console.warn(...s);
  }
  De(), go = !1;
}
function Nc() {
  let e = _t[_t.length - 1];
  if (!e)
    return [];
  const t = [];
  for (; e; ) {
    const n = t[0];
    n && n.vnode === e ? n.recurseCount++ : t.push({
      vnode: e,
      recurseCount: 0
    });
    const o = e.component && e.component.parent;
    e = o && o.vnode;
  }
  return t;
}
function bc(e) {
  const t = [];
  return e.forEach((n, o) => {
    t.push(...o === 0 ? [] : [`
`], ...yc(n));
  }), t;
}
function yc({ vnode: e, recurseCount: t }) {
  const n = t > 0 ? `... (${t} recursive calls)` : "", o = e.component ? e.component.parent == null : !1, r = ` at <${En(
    e.component,
    e.type,
    o
  )}`, s = ">" + n;
  return e.props ? [r, ...Oc(e.props), s] : [r + s];
}
function Oc(e) {
  const t = [], n = Object.keys(e);
  return n.slice(0, 3).forEach((o) => {
    t.push(...Ms(o, e[o]));
  }), n.length > 3 && t.push(" ..."), t;
}
function Ms(e, t, n) {
  return X(t) ? (t = JSON.stringify(t), n ? t : [`${e}=${t}`]) : typeof t == "number" || typeof t == "boolean" || t == null ? n ? t : [`${e}=${t}`] : /* @__PURE__ */ te(t) ? (t = Ms(e, /* @__PURE__ */ R(t.value), !0), n ? t : [`${e}=Ref<`, t, ">"]) : P(t) ? [`${e}=fn${t.name ? `<${t.name}>` : ""}`] : (t = /* @__PURE__ */ R(t), n ? t : [`${e}=`, t]);
}
const Zo = {
  sp: "serverPrefetch hook",
  bc: "beforeCreate hook",
  c: "created hook",
  bm: "beforeMount hook",
  m: "mounted hook",
  bu: "beforeUpdate hook",
  u: "updated",
  bum: "beforeUnmount hook",
  um: "unmounted hook",
  a: "activated hook",
  da: "deactivated hook",
  ec: "errorCaptured hook",
  rtc: "renderTracked hook",
  rtg: "renderTriggered hook",
  0: "setup function",
  1: "render function",
  2: "watcher getter",
  3: "watcher callback",
  4: "watcher cleanup function",
  5: "native event handler",
  6: "component event handler",
  7: "vnode hook",
  8: "directive hook",
  9: "transition hook",
  10: "app errorHandler",
  11: "app warnHandler",
  12: "ref function",
  13: "async component loader",
  14: "scheduler flush",
  15: "component update",
  16: "app unmount cleanup function"
};
function It(e, t, n, o) {
  try {
    return o ? e(...o) : e();
  } catch (r) {
    dn(r, t, n);
  }
}
function Le(e, t, n, o) {
  if (P(e)) {
    const r = It(e, t, n, o);
    return r && Bo(r) && r.catch((s) => {
      dn(s, t, n);
    }), r;
  }
  if (T(e)) {
    const r = [];
    for (let s = 0; s < e.length; s++)
      r.push(Le(e[s], t, n, o));
    return r;
  } else process.env.NODE_ENV !== "production" && b(
    `Invalid value type passed to callWithAsyncErrorHandling(): ${typeof e}`
  );
}
function dn(e, t, n, o = !0) {
  const r = t ? t.vnode : null, { errorHandler: s, throwUnhandledErrorInProduction: i } = t && t.appContext.config || k;
  if (t) {
    let c = t.parent;
    const u = t.proxy, d = process.env.NODE_ENV !== "production" ? Zo[n] : `https://vuejs.org/error-reference/#runtime-${n}`;
    for (; c; ) {
      const a = c.ec;
      if (a) {
        for (let f = 0; f < a.length; f++)
          if (a[f](e, u, d) === !1)
            return;
      }
      c = c.parent;
    }
    if (s) {
      xe(), It(s, null, 10, [
        e,
        u,
        d
      ]), De();
      return;
    }
  }
  wc(e, n, r, o, i);
}
function wc(e, t, n, o = !0, r = !1) {
  if (process.env.NODE_ENV !== "production") {
    const s = Zo[t];
    if (n && Dn(n), b(`Unhandled error${s ? ` during execution of ${s}` : ""}`), n && Cn(), o)
      throw e;
    console.error(e);
  } else {
    if (r)
      throw e;
    console.error(e);
  }
}
const de = [];
let We = -1;
const Pt = [];
let it = null, Dt = 0;
const Is = /* @__PURE__ */ Promise.resolve();
let Ln = null;
const Vc = 100;
function xc(e) {
  const t = Ln || Is;
  return e ? t.then(this ? e.bind(this) : e) : t;
}
function Dc(e) {
  let t = We + 1, n = de.length;
  for (; t < n; ) {
    const o = t + n >>> 1, r = de[o], s = rn(r);
    s < e || s === e && r.flags & 2 ? t = o + 1 : n = o;
  }
  return t;
}
function eo(e) {
  if (!(e.flags & 1)) {
    const t = rn(e), n = de[de.length - 1];
    !n || // fast path when the job id is larger than the tail
    !(e.flags & 2) && t >= rn(n) ? de.push(e) : de.splice(Dc(t), 0, e), e.flags |= 1, Rs();
  }
}
function Rs() {
  Ln || (Ln = Is.then(js));
}
function Ls(e) {
  T(e) ? Pt.push(...e) : it && e.id === -1 ? it.splice(Dt + 1, 0, e) : e.flags & 1 || (Pt.push(e), e.flags |= 1), Rs();
}
function yr(e, t, n = We + 1) {
  for (process.env.NODE_ENV !== "production" && (t = t || /* @__PURE__ */ new Map()); n < de.length; n++) {
    const o = de[n];
    if (o && o.flags & 2) {
      if (e && o.id !== e.uid || process.env.NODE_ENV !== "production" && Qo(t, o))
        continue;
      de.splice(n, 1), n--, o.flags & 4 && (o.flags &= -2), o(), o.flags & 4 || (o.flags &= -2);
    }
  }
}
function Fs(e) {
  if (Pt.length) {
    const t = [...new Set(Pt)].sort(
      (n, o) => rn(n) - rn(o)
    );
    if (Pt.length = 0, it) {
      it.push(...t);
      return;
    }
    for (it = t, process.env.NODE_ENV !== "production" && (e = e || /* @__PURE__ */ new Map()), Dt = 0; Dt < it.length; Dt++) {
      const n = it[Dt];
      process.env.NODE_ENV !== "production" && Qo(e, n) || (n.flags & 4 && (n.flags &= -2), n.flags & 8 || n(), n.flags &= -2);
    }
    it = null, Dt = 0;
  }
}
const rn = (e) => e.id == null ? e.flags & 2 ? -1 : 1 / 0 : e.id;
function js(e) {
  process.env.NODE_ENV !== "production" && (e = e || /* @__PURE__ */ new Map());
  const t = process.env.NODE_ENV !== "production" ? (n) => Qo(e, n) : se;
  try {
    for (We = 0; We < de.length; We++) {
      const n = de[We];
      if (n && !(n.flags & 8)) {
        if (process.env.NODE_ENV !== "production" && t(n))
          continue;
        n.flags & 4 && (n.flags &= -2), It(
          n,
          n.i,
          n.i ? 15 : 14
        ), n.flags & 4 || (n.flags &= -2);
      }
    }
  } finally {
    for (; We < de.length; We++) {
      const n = de[We];
      n && (n.flags &= -2);
    }
    We = -1, de.length = 0, Fs(e), Ln = null, (de.length || Pt.length) && js(e);
  }
}
function Qo(e, t) {
  const n = e.get(t) || 0;
  if (n > Vc) {
    const o = t.i, r = o && Ni(o.type);
    return dn(
      `Maximum recursive updates exceeded${r ? ` in component <${r}>` : ""}. This means you have a reactive effect that is mutating its own dependencies and thus recursively triggering itself. Possible sources include component template, render function, updated hook or watcher source function.`,
      null,
      10
    ), !0;
  }
  return e.set(t, n + 1), !1;
}
let Ne = !1;
const Or = (e) => {
  try {
    return Ne;
  } finally {
    Ne = e;
  }
}, Sn = /* @__PURE__ */ new Map();
process.env.NODE_ENV !== "production" && (fn().__VUE_HMR_RUNTIME__ = {
  createRecord: mo(Hs),
  rerender: mo(Tc),
  reload: mo($c)
});
const Et = /* @__PURE__ */ new Map();
function Cc(e) {
  const t = e.type.__hmrId;
  let n = Et.get(t);
  n || (Hs(t, e.type), n = Et.get(t)), n.instances.add(e);
}
function Sc(e) {
  Et.get(e.type.__hmrId).instances.delete(e);
}
function Hs(e, t) {
  return Et.has(e) ? !1 : (Et.set(e, {
    initialDef: Fn(t),
    instances: /* @__PURE__ */ new Set()
  }), !0);
}
function Fn(e) {
  return bi(e) ? e.__vccOpts : e;
}
function Tc(e, t) {
  const n = Et.get(e);
  n && (n.initialDef.render = t, [...n.instances].forEach((o) => {
    t && (o.render = t, Fn(o.type).render = t), o.renderCache = [], Ne = !0, o.job.flags & 8 || o.update(), Ne = !1;
  }));
}
function $c(e, t) {
  const n = Et.get(e);
  if (!n) return;
  t = Fn(t), wr(n.initialDef, t);
  const o = [...n.instances];
  for (let r = 0; r < o.length; r++) {
    const s = o[r], i = Fn(s.type);
    let c = Sn.get(i);
    c || (i !== n.initialDef && wr(i, t), Sn.set(i, c = /* @__PURE__ */ new Set())), c.add(s), s.appContext.propsCache.delete(s.type), s.appContext.emitsCache.delete(s.type), s.appContext.optionsCache.delete(s.type), s.ceReload ? (c.add(s), s.ceReload(t.styles), c.delete(s)) : s.parent ? eo(() => {
      s.job.flags & 8 || (Ne = !0, s.parent.update(), Ne = !1, c.delete(s));
    }) : s.appContext.reload ? s.appContext.reload() : typeof window < "u" ? window.location.reload() : console.warn(
      "[HMR] Root or manually mounted instance modified. Full reload required."
    ), s.root.ce && s !== s.root && s.root.ce._removeChildStyle(i);
  }
  Ls(() => {
    Sn.clear();
  });
}
function wr(e, t) {
  Z(e, t);
  for (const n in e)
    n !== "__file" && !(n in t) && delete e[n];
}
function mo(e) {
  return (t, n) => {
    try {
      return e(t, n);
    } catch (o) {
      console.error(o), console.warn(
        "[HMR] Something went wrong during Vue component hot-reload. Full reload required."
      );
    }
  };
}
let Te, Wt = [], Co = !1;
function hn(e, ...t) {
  Te ? Te.emit(e, ...t) : Co || Wt.push({ event: e, args: t });
}
function er(e, t) {
  var n, o;
  Te = e, Te ? (Te.enabled = !0, Wt.forEach(({ event: r, args: s }) => Te.emit(r, ...s)), Wt = []) : /* handle late devtools injection - only do this if we are in an actual */ /* browser environment to avoid the timer handle stalling test runner exit */ /* (#4815) */ typeof window < "u" && // some envs mock window but not fully
  window.HTMLElement && // also exclude jsdom
  // eslint-disable-next-line no-restricted-syntax
  !((o = (n = window.navigator) == null ? void 0 : n.userAgent) != null && o.includes("jsdom")) ? ((t.__VUE_DEVTOOLS_HOOK_REPLAY__ = t.__VUE_DEVTOOLS_HOOK_REPLAY__ || []).push((s) => {
    er(s, t);
  }), setTimeout(() => {
    Te || (t.__VUE_DEVTOOLS_HOOK_REPLAY__ = null, Co = !0, Wt = []);
  }, 3e3)) : (Co = !0, Wt = []);
}
function Pc(e, t) {
  hn("app:init", e, t, {
    Fragment: we,
    Text: _n,
    Comment: Oe,
    Static: $n
  });
}
function Ac(e) {
  hn("app:unmount", e);
}
const Mc = /* @__PURE__ */ tr(
  "component:added"
  /* COMPONENT_ADDED */
), ks = /* @__PURE__ */ tr(
  "component:updated"
  /* COMPONENT_UPDATED */
), Ic = /* @__PURE__ */ tr(
  "component:removed"
  /* COMPONENT_REMOVED */
), Rc = (e) => {
  Te && typeof Te.cleanupBuffer == "function" && // remove the component if it wasn't buffered
  !Te.cleanupBuffer(e) && Ic(e);
};
// @__NO_SIDE_EFFECTS__
function tr(e) {
  return (t) => {
    hn(
      e,
      t.appContext.app,
      t.uid,
      t.parent ? t.parent.uid : void 0,
      t
    );
  };
}
const Lc = /* @__PURE__ */ Us(
  "perf:start"
  /* PERFORMANCE_START */
), Fc = /* @__PURE__ */ Us(
  "perf:end"
  /* PERFORMANCE_END */
);
function Us(e) {
  return (t, n, o) => {
    hn(e, t.appContext.app, t.uid, t, n, o);
  };
}
function jc(e, t, n) {
  hn(
    "component:emit",
    e.appContext.app,
    e,
    t,
    n
  );
}
let he = null, Ws = null;
function jn(e) {
  const t = he;
  return he = e, Ws = e && e.type.__scopeId || null, t;
}
function Hc(e, t = he, n) {
  if (!t || e._n)
    return e;
  const o = (...r) => {
    o._d && kr(-1);
    const s = jn(t);
    let i;
    try {
      i = e(...r);
    } finally {
      jn(s), o._d && kr(1);
    }
    return process.env.NODE_ENV !== "production" && ks(t), i;
  };
  return o._n = !0, o._c = !0, o._d = !0, o;
}
function Bs(e) {
  Si(e) && b("Do not use built-in directive ids as custom directive id: " + e);
}
function kc(e, t) {
  if (he === null)
    return process.env.NODE_ENV !== "production" && b("withDirectives can only be used inside render functions."), e;
  const n = io(he), o = e.dirs || (e.dirs = []);
  for (let r = 0; r < t.length; r++) {
    let [s, i, c, u = k] = t[r];
    s && (P(s) && (s = {
      mounted: s,
      updated: s
    }), s.deep && Xe(i), o.push({
      dir: s,
      instance: n,
      value: i,
      oldValue: void 0,
      arg: c,
      modifiers: u
    }));
  }
  return e;
}
function at(e, t, n, o) {
  const r = e.dirs, s = t && t.dirs;
  for (let i = 0; i < r.length; i++) {
    const c = r[i];
    s && (c.oldValue = s[i].value);
    let u = c.dir[o];
    u && (xe(), Le(u, n, 8, [
      e.el,
      c,
      e,
      t
    ]), De());
  }
}
function Uc(e, t) {
  if (process.env.NODE_ENV !== "production" && (!oe || oe.isMounted) && b("provide() can only be used inside setup()."), oe) {
    let n = oe.provides;
    const o = oe.parent && oe.parent.provides;
    o === n && (n = oe.provides = Object.create(o)), n[e] = t;
  }
}
function Tn(e, t, n = !1) {
  const o = lr();
  if (o || At) {
    let r = At ? At._context.provides : o ? o.parent == null || o.ce ? o.vnode.appContext && o.vnode.appContext.provides : o.parent.provides : void 0;
    if (r && e in r)
      return r[e];
    if (arguments.length > 1)
      return n && P(t) ? t.call(o && o.proxy) : t;
    process.env.NODE_ENV !== "production" && b(`injection "${String(e)}" not found.`);
  } else process.env.NODE_ENV !== "production" && b("inject() can only be used inside setup() or functional components.");
}
const Wc = /* @__PURE__ */ Symbol.for("v-scx"), Bc = () => {
  {
    const e = Tn(Wc);
    return e || process.env.NODE_ENV !== "production" && b(
      "Server rendering context not provided. Make sure to only call useSSRContext() conditionally in the server build."
    ), e;
  }
};
function Kc(e, t) {
  return to(e, null, t);
}
function Gc(e, t) {
  return to(
    e,
    null,
    process.env.NODE_ENV !== "production" ? Z({}, t, { flush: "sync" }) : { flush: "sync" }
  );
}
function Jt(e, t, n) {
  return process.env.NODE_ENV !== "production" && !P(t) && b(
    "`watch(fn, options?)` signature has been moved to a separate API. Use `watchEffect(fn, options?)` instead. `watch` now only supports `watch(source, cb, options?) signature."
  ), to(e, t, n);
}
function to(e, t, n = k) {
  const { immediate: o, deep: r, flush: s, once: i } = n;
  process.env.NODE_ENV !== "production" && !t && (o !== void 0 && b(
    'watch() "immediate" option is only respected when using the watch(source, callback, options?) signature.'
  ), r !== void 0 && b(
    'watch() "deep" option is only respected when using the watch(source, callback, options?) signature.'
  ), i !== void 0 && b(
    'watch() "once" option is only respected when using the watch(source, callback, options?) signature.'
  ));
  const c = Z({}, n);
  process.env.NODE_ENV !== "production" && (c.onWarn = b);
  const u = t && o || !t && s !== "post";
  let d;
  if (cn) {
    if (s === "sync") {
      const E = Bc();
      d = E.__watcherHandles || (E.__watcherHandles = []);
    } else if (!u) {
      const E = () => {
      };
      return E.stop = se, E.resume = se, E.pause = se, E;
    }
  }
  const a = oe;
  c.call = (E, D, V) => Le(E, a, D, V);
  let f = !1;
  s === "post" ? c.scheduler = (E) => {
    pe(E, a && a.suspense);
  } : s !== "sync" && (f = !0, c.scheduler = (E, D) => {
    D ? E() : eo(E);
  }), c.augmentJob = (E) => {
    t && (E.flags |= 4), f && (E.flags |= 2, a && (E.id = a.uid, E.i = a));
  };
  const h = Ec(e, t, c);
  return cn && (d ? d.push(h) : u && h()), h;
}
function qc(e, t, n) {
  const o = this.proxy, r = X(e) ? e.includes(".") ? Ks(o, e) : () => o[e] : e.bind(o, o);
  let s;
  P(t) ? s = t : (s = t.handler, n = t);
  const i = vn(this), c = to(r, s.bind(o), n);
  return i(), c;
}
function Ks(e, t) {
  const n = t.split(".");
  return () => {
    let o = e;
    for (let r = 0; r < n.length && o; r++)
      o = o[n[r]];
    return o;
  };
}
const st = /* @__PURE__ */ new WeakMap(), Gs = /* @__PURE__ */ Symbol("_vte"), zc = (e) => e.__isTeleport, Ze = (e) => e && (e.disabled || e.disabled === ""), Yc = (e) => e && (e.defer || e.defer === ""), Vr = (e) => typeof SVGElement < "u" && e instanceof SVGElement, xr = (e) => typeof MathMLElement == "function" && e instanceof MathMLElement, So = (e, t) => {
  const n = e && e.to;
  if (X(n))
    if (t) {
      const o = t(n);
      return process.env.NODE_ENV !== "production" && !o && !Ze(e) && b(
        `Failed to locate Teleport target with selector "${n}". Note the target element must exist before the component is mounted - i.e. the target cannot be rendered by the component itself, and ideally should be outside of the entire Vue component tree.`
      ), o;
    } else
      return process.env.NODE_ENV !== "production" && b(
        "Current renderer does not support string target for Teleports. (missing querySelector renderer option)"
      ), null;
  else
    return process.env.NODE_ENV !== "production" && !n && !Ze(e) && b(`Invalid Teleport target: ${n}`), n;
}, Jc = {
  name: "Teleport",
  __isTeleport: !0,
  process(e, t, n, o, r, s, i, c, u, d) {
    const {
      mc: a,
      pc: f,
      pbc: h,
      o: { insert: E, querySelector: D, createText: V, createComment: I, parentNode: j }
    } = d, A = Ze(t.props);
    let { dynamicChildren: F } = t;
    process.env.NODE_ENV !== "production" && Ne && (u = !1, F = null);
    const Q = (L, q, U) => {
      L.shapeFlag & 16 && a(
        L.children,
        q,
        U,
        r,
        s,
        i,
        c,
        u
      );
    }, C = (L = t) => {
      const q = Ze(L.props), U = L.target = So(L.props, D), _e = To(U, L, V, E);
      U ? (i !== "svg" && Vr(U) ? i = "svg" : i !== "mathml" && xr(U) && (i = "mathml"), r && r.isCE && (r.ce._teleportTargets || (r.ce._teleportTargets = /* @__PURE__ */ new Set())).add(U), q || (Q(L, U, _e), Bt(L, !1))) : process.env.NODE_ENV !== "production" && !q && b("Invalid Teleport target on mount:", U, `(${typeof U})`);
    }, ee = (L) => {
      const q = () => {
        if (st.get(L) === q) {
          if (st.delete(L), Ze(L.props)) {
            const U = j(L.el) || n;
            Q(L, U, L.anchor), Bt(L, !0);
          }
          C(L);
        }
      };
      st.set(L, q), pe(q, s);
    };
    if (e == null) {
      const L = t.el = process.env.NODE_ENV !== "production" ? I("teleport start") : V(""), q = t.anchor = process.env.NODE_ENV !== "production" ? I("teleport end") : V("");
      if (E(L, n, o), E(q, n, o), Yc(t.props) || s && s.pendingBranch) {
        ee(t);
        return;
      }
      A && (Q(t, n, q), Bt(t, !0)), C();
    } else {
      t.el = e.el;
      const L = t.anchor = e.anchor, q = st.get(e);
      if (q) {
        q.flags |= 8, st.delete(e), ee(t);
        return;
      }
      t.targetStart = e.targetStart;
      const U = t.target = e.target, _e = t.targetAnchor = e.targetAnchor, be = Ze(e.props), ve = be ? n : U, Nt = be ? L : _e;
      if (i === "svg" || Vr(U) ? i = "svg" : (i === "mathml" || xr(U)) && (i = "mathml"), F ? (h(
        e.dynamicChildren,
        F,
        ve,
        r,
        s,
        i,
        c
      ), Qt(e, t, process.env.NODE_ENV === "production")) : u || f(
        e,
        t,
        ve,
        Nt,
        r,
        s,
        i,
        c,
        !1
      ), A)
        be ? t.props && e.props && t.props.to !== e.props.to && (t.props.to = e.props.to) : xn(
          t,
          n,
          L,
          d,
          1
        );
      else if ((t.props && t.props.to) !== (e.props && e.props.to)) {
        const bt = So(t.props, D);
        bt ? (t.target = bt, xn(
          t,
          bt,
          null,
          d,
          0
        )) : process.env.NODE_ENV !== "production" && b(
          "Invalid Teleport target on update:",
          U,
          `(${typeof U})`
        );
      } else be && xn(
        t,
        U,
        _e,
        d,
        1
      );
      Bt(t, A);
    }
  },
  remove(e, t, n, { um: o, o: { remove: r } }, s) {
    const {
      shapeFlag: i,
      children: c,
      anchor: u,
      targetStart: d,
      targetAnchor: a,
      target: f,
      props: h
    } = e, E = Ze(h), D = s || !E, V = st.get(e);
    if (V && (V.flags |= 8, st.delete(e)), f && (r(d), r(a)), s && r(u), !V && (E || f) && i & 16)
      for (let I = 0; I < c.length; I++) {
        const j = c[I];
        o(
          j,
          t,
          n,
          D,
          !!j.dynamicChildren
        );
      }
  },
  move: xn,
  hydrate: Xc
};
function xn(e, t, n, { o: { insert: o }, m: r }, s = 2) {
  s === 0 && o(e.targetAnchor, t, n);
  const { el: i, anchor: c, shapeFlag: u, children: d, props: a } = e, f = s === 2;
  if (f && o(i, t, n), !st.has(e) && (!f || Ze(a)) && u & 16)
    for (let h = 0; h < d.length; h++)
      r(
        d[h],
        t,
        n,
        2
      );
  f && o(c, t, n);
}
function Xc(e, t, n, o, r, s, {
  o: { nextSibling: i, parentNode: c, querySelector: u, insert: d, createText: a }
}, f) {
  function h(I, j) {
    let A = j;
    for (; A; ) {
      if (A && A.nodeType === 8) {
        if (A.data === "teleport start anchor")
          t.targetStart = A;
        else if (A.data === "teleport anchor") {
          t.targetAnchor = A, I._lpa = t.targetAnchor && i(t.targetAnchor);
          break;
        }
      }
      A = i(A);
    }
  }
  function E(I, j) {
    j.anchor = f(
      i(I),
      j,
      c(I),
      n,
      o,
      r,
      s
    );
  }
  const D = t.target = So(
    t.props,
    u
  ), V = Ze(t.props);
  if (D) {
    const I = D._lpa || D.firstChild;
    t.shapeFlag & 16 && (V ? (E(e, t), h(D, I), t.targetAnchor || To(
      D,
      t,
      a,
      d,
      // if target is the same as the main view, insert anchors before current node
      // to avoid hydrating mismatch
      c(e) === D ? e : null
    )) : (t.anchor = i(e), h(D, I), t.targetAnchor || To(D, t, a, d), f(
      I && i(I),
      t,
      D,
      n,
      o,
      r,
      s
    ))), Bt(t, V);
  } else V && t.shapeFlag & 16 && (E(e, t), t.targetStart = e, t.targetAnchor = i(e));
  return t.anchor && i(t.anchor);
}
const Zc = Jc;
function Bt(e, t) {
  const n = e.ctx;
  if (n && n.ut) {
    let o, r;
    for (t ? (o = e.el, r = e.anchor) : (o = e.targetStart, r = e.targetAnchor); o && o !== r; )
      o.nodeType === 1 && o.setAttribute("data-v-owner", n.uid), o = o.nextSibling;
    n.ut();
  }
}
function To(e, t, n, o, r = null) {
  const s = t.targetStart = n(""), i = t.targetAnchor = n("");
  return s[Gs] = i, e && (o(s, e, r), o(i, e, r)), i;
}
const _o = /* @__PURE__ */ Symbol("_leaveCb");
function nr(e, t) {
  e.shapeFlag & 6 && e.component ? (e.transition = t, nr(e.component.subTree, t)) : e.shapeFlag & 128 ? (e.ssContent.transition = t.clone(e.ssContent), e.ssFallback.transition = t.clone(e.ssFallback)) : e.transition = t;
}
// @__NO_SIDE_EFFECTS__
function gn(e, t) {
  return P(e) ? (
    // #8236: extend call and options.name access are considered side-effects
    // by Rollup, so we have to wrap it in a pure-annotated IIFE.
    Z({ name: e.name }, t, { setup: e })
  ) : e;
}
function qs(e) {
  e.ids = [e.ids[0] + e.ids[2]++ + "-", 0, 0];
}
const Dr = /* @__PURE__ */ new WeakSet();
function Cr(e, t) {
  let n;
  return !!((n = Object.getOwnPropertyDescriptor(e, t)) && !n.configurable);
}
const Hn = /* @__PURE__ */ new WeakMap();
function Xt(e, t, n, o, r = !1) {
  if (T(e)) {
    e.forEach(
      (V, I) => Xt(
        V,
        t && (T(t) ? t[I] : t),
        n,
        o,
        r
      )
    );
    return;
  }
  if (Zt(o) && !r) {
    o.shapeFlag & 512 && o.type.__asyncResolved && o.component.subTree.component && Xt(e, t, n, o.component.subTree);
    return;
  }
  const s = o.shapeFlag & 4 ? io(o.component) : o.el, i = r ? null : s, { i: c, r: u } = e;
  if (process.env.NODE_ENV !== "production" && !c) {
    b(
      "Missing ref owner context. ref cannot be used on hoisted vnodes. A vnode with ref must be created inside the render function."
    );
    return;
  }
  const d = t && t.r, a = c.refs === k ? c.refs = {} : c.refs, f = c.setupState, h = /* @__PURE__ */ R(f), E = f === k ? us : (V) => process.env.NODE_ENV !== "production" && (B(h, V) && !/* @__PURE__ */ te(h[V]) && b(
    `Template ref "${V}" used on a non-ref value. It will not work in the production build.`
  ), Dr.has(h[V])) || Cr(a, V) ? !1 : B(h, V), D = (V, I) => !(process.env.NODE_ENV !== "production" && Dr.has(V) || I && Cr(a, I));
  if (d != null && d !== u) {
    if (Sr(t), X(d))
      a[d] = null, E(d) && (f[d] = null);
    else if (/* @__PURE__ */ te(d)) {
      const V = t;
      D(d, V.k) && (d.value = null), V.k && (a[V.k] = null);
    }
  }
  if (P(u)) {
    xe();
    try {
      It(u, c, 12, [i, a]);
    } finally {
      De();
    }
  } else {
    const V = X(u), I = /* @__PURE__ */ te(u);
    if (V || I) {
      const j = () => {
        if (e.f) {
          const A = V ? E(u) ? f[u] : a[u] : D(u) || !e.k ? u.value : a[e.k];
          if (r)
            T(A) && Wo(A, s);
          else if (T(A))
            A.includes(s) || A.push(s);
          else if (V)
            a[u] = [s], E(u) && (f[u] = a[u]);
          else {
            const F = [s];
            D(u, e.k) && (u.value = F), e.k && (a[e.k] = F);
          }
        } else V ? (a[u] = i, E(u) && (f[u] = i)) : I ? (D(u, e.k) && (u.value = i), e.k && (a[e.k] = i)) : process.env.NODE_ENV !== "production" && b("Invalid template ref type:", u, `(${typeof u})`);
      };
      if (i) {
        const A = () => {
          j(), Hn.delete(e);
        };
        A.id = -1, Hn.set(e, A), pe(A, n);
      } else
        Sr(e), j();
    } else process.env.NODE_ENV !== "production" && b("Invalid template ref type:", u, `(${typeof u})`);
  }
}
function Sr(e) {
  const t = Hn.get(e);
  t && (t.flags |= 8, Hn.delete(e));
}
fn().requestIdleCallback;
fn().cancelIdleCallback;
const Zt = (e) => !!e.type.__asyncLoader, or = (e) => e.type.__isKeepAlive;
function Qc(e, t) {
  zs(e, "a", t);
}
function el(e, t) {
  zs(e, "da", t);
}
function zs(e, t, n = oe) {
  const o = e.__wdc || (e.__wdc = () => {
    let r = n;
    for (; r; ) {
      if (r.isDeactivated)
        return;
      r = r.parent;
    }
    return e();
  });
  if (no(t, o, n), n) {
    let r = n.parent;
    for (; r && r.parent; )
      or(r.parent.vnode) && tl(o, t, n, r), r = r.parent;
  }
}
function tl(e, t, n, o) {
  const r = no(
    t,
    e,
    o,
    !0
    /* prepend */
  );
  mn(() => {
    Wo(o[t], r);
  }, n);
}
function no(e, t, n = oe, o = !1) {
  if (n) {
    const r = n[e] || (n[e] = []), s = t.__weh || (t.__weh = (...i) => {
      xe();
      const c = vn(n), u = Le(t, n, e, i);
      return c(), De(), u;
    });
    return o ? r.unshift(s) : r.push(s), s;
  } else if (process.env.NODE_ENV !== "production") {
    const r = dt(Zo[e].replace(/ hook$/, ""));
    b(
      `${r} is called when there is no active component instance to be associated with. Lifecycle injection APIs can only be used during execution of setup(). If you are using async setup(), make sure to register lifecycle hooks before the first await statement.`
    );
  }
}
const nt = (e) => (t, n = oe) => {
  (!cn || e === "sp") && no(e, (...o) => t(...o), n);
}, nl = nt("bm"), oo = nt("m"), ol = nt(
  "bu"
), rl = nt("u"), sl = nt(
  "bum"
), mn = nt("um"), il = nt(
  "sp"
), cl = nt("rtg"), ll = nt("rtc");
function ul(e, t = oe) {
  no("ec", e, t);
}
const fl = /* @__PURE__ */ Symbol.for("v-ndc");
function al(e, t, n, o) {
  let r;
  const s = n, i = T(e);
  if (i || X(e)) {
    const c = i && /* @__PURE__ */ lt(e);
    let u = !1, d = !1;
    c && (u = !/* @__PURE__ */ me(e), d = /* @__PURE__ */ Ie(e), e = Xn(e)), r = new Array(e.length);
    for (let a = 0, f = e.length; a < f; a++)
      r[a] = t(
        u ? d ? Mt(Re(e[a])) : Re(e[a]) : e[a],
        a,
        void 0,
        s
      );
  } else if (typeof e == "number")
    if (process.env.NODE_ENV !== "production" && (!Number.isInteger(e) || e < 0))
      b(
        `The v-for range expects a positive integer value but got ${e}.`
      ), r = [];
    else {
      r = new Array(e);
      for (let c = 0; c < e; c++)
        r[c] = t(c + 1, c, void 0, s);
    }
  else if (G(e))
    if (e[Symbol.iterator])
      r = Array.from(
        e,
        (c, u) => t(c, u, void 0, s)
      );
    else {
      const c = Object.keys(e);
      r = new Array(c.length);
      for (let u = 0, d = c.length; u < d; u++) {
        const a = c[u];
        r[u] = t(e[a], a, u, s);
      }
    }
  else
    r = [];
  return r;
}
const $o = (e) => e ? vi(e) ? io(e) : $o(e.parent) : null, vt = (
  // Move PURE marker to new line to workaround compiler discarding it
  // due to type annotation
  /* @__PURE__ */ Z(/* @__PURE__ */ Object.create(null), {
    $: (e) => e,
    $el: (e) => e.vnode.el,
    $data: (e) => e.data,
    $props: (e) => process.env.NODE_ENV !== "production" ? /* @__PURE__ */ Ge(e.props) : e.props,
    $attrs: (e) => process.env.NODE_ENV !== "production" ? /* @__PURE__ */ Ge(e.attrs) : e.attrs,
    $slots: (e) => process.env.NODE_ENV !== "production" ? /* @__PURE__ */ Ge(e.slots) : e.slots,
    $refs: (e) => process.env.NODE_ENV !== "production" ? /* @__PURE__ */ Ge(e.refs) : e.refs,
    $parent: (e) => $o(e.parent),
    $root: (e) => $o(e.root),
    $host: (e) => e.ce,
    $emit: (e) => e.emit,
    $options: (e) => Xs(e),
    $forceUpdate: (e) => e.f || (e.f = () => {
      eo(e.update);
    }),
    $nextTick: (e) => e.n || (e.n = xc.bind(e.proxy)),
    $watch: (e) => qc.bind(e)
  })
), rr = (e) => e === "_" || e === "$", vo = (e, t) => e !== k && !e.__isScriptSetup && B(e, t), Ys = {
  get({ _: e }, t) {
    if (t === "__v_skip")
      return !0;
    const { ctx: n, setupState: o, data: r, props: s, accessCache: i, type: c, appContext: u } = e;
    if (process.env.NODE_ENV !== "production" && t === "__isVue")
      return !0;
    if (t[0] !== "$") {
      const h = i[t];
      if (h !== void 0)
        switch (h) {
          case 1:
            return o[t];
          case 2:
            return r[t];
          case 4:
            return n[t];
          case 3:
            return s[t];
        }
      else {
        if (vo(o, t))
          return i[t] = 1, o[t];
        if (r !== k && B(r, t))
          return i[t] = 2, r[t];
        if (B(s, t))
          return i[t] = 3, s[t];
        if (n !== k && B(n, t))
          return i[t] = 4, n[t];
        Po && (i[t] = 0);
      }
    }
    const d = vt[t];
    let a, f;
    if (d)
      return t === "$attrs" ? (re(e.attrs, "get", ""), process.env.NODE_ENV !== "production" && Wn()) : process.env.NODE_ENV !== "production" && t === "$slots" && re(e, "get", t), d(e);
    if (
      // css module (injected by vue-loader)
      (a = c.__cssModules) && (a = a[t])
    )
      return a;
    if (n !== k && B(n, t))
      return i[t] = 4, n[t];
    if (
      // global properties
      f = u.config.globalProperties, B(f, t)
    )
      return f[t];
    process.env.NODE_ENV !== "production" && he && (!X(t) || // #1091 avoid internal isRef/isVNode checks on component instance leading
    // to infinite warning loop
    t.indexOf("__v") !== 0) && (r !== k && rr(t[0]) && B(r, t) ? b(
      `Property ${JSON.stringify(
        t
      )} must be accessed via $data because it starts with a reserved character ("$" or "_") and is not proxied on the render context.`
    ) : e === he && b(
      `Property ${JSON.stringify(t)} was accessed during render but is not defined on instance.`
    ));
  },
  set({ _: e }, t, n) {
    const { data: o, setupState: r, ctx: s } = e;
    return vo(r, t) ? (r[t] = n, !0) : process.env.NODE_ENV !== "production" && r.__isScriptSetup && B(r, t) ? (b(`Cannot mutate <script setup> binding "${t}" from Options API.`), !1) : o !== k && B(o, t) ? (o[t] = n, !0) : B(e.props, t) ? (process.env.NODE_ENV !== "production" && b(`Attempting to mutate prop "${t}". Props are readonly.`), !1) : t[0] === "$" && t.slice(1) in e ? (process.env.NODE_ENV !== "production" && b(
      `Attempting to mutate public property "${t}". Properties starting with $ are reserved and readonly.`
    ), !1) : (process.env.NODE_ENV !== "production" && t in e.appContext.config.globalProperties ? Object.defineProperty(s, t, {
      enumerable: !0,
      configurable: !0,
      value: n
    }) : s[t] = n, !0);
  },
  has({
    _: { data: e, setupState: t, accessCache: n, ctx: o, appContext: r, props: s, type: i }
  }, c) {
    let u;
    return !!(n[c] || e !== k && c[0] !== "$" && B(e, c) || vo(t, c) || B(s, c) || B(o, c) || B(vt, c) || B(r.config.globalProperties, c) || (u = i.__cssModules) && u[c]);
  },
  defineProperty(e, t, n) {
    return n.get != null ? e._.accessCache[t] = 0 : B(n, "value") && this.set(e, t, n.value, null), Reflect.defineProperty(e, t, n);
  }
};
process.env.NODE_ENV !== "production" && (Ys.ownKeys = (e) => (b(
  "Avoid app logic that relies on enumerating keys on a component instance. The keys will be empty in production mode to avoid performance overhead."
), Reflect.ownKeys(e)));
function pl(e) {
  const t = {};
  return Object.defineProperty(t, "_", {
    configurable: !0,
    enumerable: !1,
    get: () => e
  }), Object.keys(vt).forEach((n) => {
    Object.defineProperty(t, n, {
      configurable: !0,
      enumerable: !1,
      get: () => vt[n](e),
      // intercepted by the proxy so no need for implementation,
      // but needed to prevent set errors
      set: se
    });
  }), t;
}
function dl(e) {
  const {
    ctx: t,
    propsOptions: [n]
  } = e;
  n && Object.keys(n).forEach((o) => {
    Object.defineProperty(t, o, {
      enumerable: !0,
      configurable: !0,
      get: () => e.props[o],
      set: se
    });
  });
}
function hl(e) {
  const { ctx: t, setupState: n } = e;
  Object.keys(/* @__PURE__ */ R(n)).forEach((o) => {
    if (!n.__isScriptSetup) {
      if (rr(o[0])) {
        b(
          `setup() return property ${JSON.stringify(
            o
          )} should not start with "$" or "_" which are reserved prefixes for Vue internals.`
        );
        return;
      }
      Object.defineProperty(t, o, {
        enumerable: !0,
        configurable: !0,
        get: () => n[o],
        set: se
      });
    }
  });
}
function kn(e) {
  return T(e) ? e.reduce(
    (t, n) => (t[n] = null, t),
    {}
  ) : e;
}
function Tr(e, t) {
  return !e || !t ? e || t : T(e) && T(t) ? e.concat(t) : Z({}, kn(e), kn(t));
}
function gl() {
  const e = /* @__PURE__ */ Object.create(null);
  return (t, n) => {
    e[n] ? b(`${t} property "${n}" is already defined in ${e[n]}.`) : e[n] = t;
  };
}
let Po = !0;
function ml(e) {
  const t = Xs(e), n = e.proxy, o = e.ctx;
  Po = !1, t.beforeCreate && $r(t.beforeCreate, e, "bc");
  const {
    // state
    data: r,
    computed: s,
    methods: i,
    watch: c,
    provide: u,
    inject: d,
    // lifecycle
    created: a,
    beforeMount: f,
    mounted: h,
    beforeUpdate: E,
    updated: D,
    activated: V,
    deactivated: I,
    beforeDestroy: j,
    beforeUnmount: A,
    destroyed: F,
    unmounted: Q,
    render: C,
    renderTracked: ee,
    renderTriggered: L,
    errorCaptured: q,
    serverPrefetch: U,
    // public API
    expose: _e,
    inheritAttrs: be,
    // assets
    components: ve,
    directives: Nt,
    filters: bt
  } = t, ot = process.env.NODE_ENV !== "production" ? gl() : null;
  if (process.env.NODE_ENV !== "production") {
    const [W] = e.propsOptions;
    if (W)
      for (const H in W)
        ot("Props", H);
  }
  if (d && _l(d, o, ot), i)
    for (const W in i) {
      const H = i[W];
      P(H) ? (process.env.NODE_ENV !== "production" ? Object.defineProperty(o, W, {
        value: H.bind(n),
        configurable: !0,
        enumerable: !0,
        writable: !0
      }) : o[W] = H.bind(n), process.env.NODE_ENV !== "production" && ot("Methods", W)) : process.env.NODE_ENV !== "production" && b(
        `Method "${W}" has type "${typeof H}" in the component definition. Did you reference the function correctly?`
      );
    }
  if (r) {
    process.env.NODE_ENV !== "production" && !P(r) && b(
      "The data option must be a function. Plain object usage is no longer supported."
    );
    const W = r.call(n, n);
    if (process.env.NODE_ENV !== "production" && Bo(W) && b(
      "data() returned a Promise - note data() cannot be async; If you intend to perform data fetching before component renders, use async setup() + <Suspense>."
    ), !G(W))
      process.env.NODE_ENV !== "production" && b("data() should return an object.");
    else if (e.data = /* @__PURE__ */ pn(W), process.env.NODE_ENV !== "production")
      for (const H in W)
        ot("Data", H), rr(H[0]) || Object.defineProperty(o, H, {
          configurable: !0,
          enumerable: !0,
          get: () => W[H],
          set: se
        });
  }
  if (Po = !0, s)
    for (const W in s) {
      const H = s[W], Fe = P(H) ? H.bind(n, n) : P(H.get) ? H.get.bind(n, n) : se;
      process.env.NODE_ENV !== "production" && Fe === se && b(`Computed property "${W}" has no getter.`);
      const co = !P(H) && P(H.set) ? H.set.bind(n) : process.env.NODE_ENV !== "production" ? () => {
        b(
          `Write operation failed: computed property "${W}" is readonly.`
        );
      } : se, Rt = ur({
        get: Fe,
        set: co
      });
      Object.defineProperty(o, W, {
        enumerable: !0,
        configurable: !0,
        get: () => Rt.value,
        set: (yt) => Rt.value = yt
      }), process.env.NODE_ENV !== "production" && ot("Computed", W);
    }
  if (c)
    for (const W in c)
      Js(c[W], o, n, W);
  if (u) {
    const W = P(u) ? u.call(n) : u;
    Reflect.ownKeys(W).forEach((H) => {
      Uc(H, W[H]);
    });
  }
  a && $r(a, e, "c");
  function Ee(W, H) {
    T(H) ? H.forEach((Fe) => W(Fe.bind(n))) : H && W(H.bind(n));
  }
  if (Ee(nl, f), Ee(oo, h), Ee(ol, E), Ee(rl, D), Ee(Qc, V), Ee(el, I), Ee(ul, q), Ee(ll, ee), Ee(cl, L), Ee(sl, A), Ee(mn, Q), Ee(il, U), T(_e))
    if (_e.length) {
      const W = e.exposed || (e.exposed = {});
      _e.forEach((H) => {
        Object.defineProperty(W, H, {
          get: () => n[H],
          set: (Fe) => n[H] = Fe,
          enumerable: !0
        });
      });
    } else e.exposed || (e.exposed = {});
  C && e.render === se && (e.render = C), be != null && (e.inheritAttrs = be), ve && (e.components = ve), Nt && (e.directives = Nt), U && qs(e);
}
function _l(e, t, n = se) {
  T(e) && (e = Ao(e));
  for (const o in e) {
    const r = e[o];
    let s;
    G(r) ? "default" in r ? s = Tn(
      r.from || o,
      r.default,
      !0
    ) : s = Tn(r.from || o) : s = Tn(r), /* @__PURE__ */ te(s) ? Object.defineProperty(t, o, {
      enumerable: !0,
      configurable: !0,
      get: () => s.value,
      set: (i) => s.value = i
    }) : t[o] = s, process.env.NODE_ENV !== "production" && n("Inject", o);
  }
}
function $r(e, t, n) {
  Le(
    T(e) ? e.map((o) => o.bind(t.proxy)) : e.bind(t.proxy),
    t,
    n
  );
}
function Js(e, t, n, o) {
  let r = o.includes(".") ? Ks(n, o) : () => n[o];
  if (X(e)) {
    const s = t[e];
    P(s) ? Jt(r, s) : process.env.NODE_ENV !== "production" && b(`Invalid watch handler specified by key "${e}"`, s);
  } else if (P(e))
    Jt(r, e.bind(n));
  else if (G(e))
    if (T(e))
      e.forEach((s) => Js(s, t, n, o));
    else {
      const s = P(e.handler) ? e.handler.bind(n) : t[e.handler];
      P(s) ? Jt(r, s, e) : process.env.NODE_ENV !== "production" && b(`Invalid watch handler specified by key "${e.handler}"`, s);
    }
  else process.env.NODE_ENV !== "production" && b(`Invalid watch option: "${o}"`, e);
}
function Xs(e) {
  const t = e.type, { mixins: n, extends: o } = t, {
    mixins: r,
    optionsCache: s,
    config: { optionMergeStrategies: i }
  } = e.appContext, c = s.get(t);
  let u;
  return c ? u = c : !r.length && !n && !o ? u = t : (u = {}, r.length && r.forEach(
    (d) => Un(u, d, i, !0)
  ), Un(u, t, i)), G(t) && s.set(t, u), u;
}
function Un(e, t, n, o = !1) {
  const { mixins: r, extends: s } = t;
  s && Un(e, s, n, !0), r && r.forEach(
    (i) => Un(e, i, n, !0)
  );
  for (const i in t)
    if (o && i === "expose")
      process.env.NODE_ENV !== "production" && b(
        '"expose" option is ignored when declared in mixins or extends. It should only be declared in the base component itself.'
      );
    else {
      const c = vl[i] || n && n[i];
      e[i] = c ? c(e[i], t[i]) : t[i];
    }
  return e;
}
const vl = {
  data: Pr,
  props: Ar,
  emits: Ar,
  // objects
  methods: Kt,
  computed: Kt,
  // lifecycle
  beforeCreate: ae,
  created: ae,
  beforeMount: ae,
  mounted: ae,
  beforeUpdate: ae,
  updated: ae,
  beforeDestroy: ae,
  beforeUnmount: ae,
  destroyed: ae,
  unmounted: ae,
  activated: ae,
  deactivated: ae,
  errorCaptured: ae,
  serverPrefetch: ae,
  // assets
  components: Kt,
  directives: Kt,
  // watch
  watch: Nl,
  // provide / inject
  provide: Pr,
  inject: El
};
function Pr(e, t) {
  return t ? e ? function() {
    return Z(
      P(e) ? e.call(this, this) : e,
      P(t) ? t.call(this, this) : t
    );
  } : t : e;
}
function El(e, t) {
  return Kt(Ao(e), Ao(t));
}
function Ao(e) {
  if (T(e)) {
    const t = {};
    for (let n = 0; n < e.length; n++)
      t[e[n]] = e[n];
    return t;
  }
  return e;
}
function ae(e, t) {
  return e ? [...new Set([].concat(e, t))] : t;
}
function Kt(e, t) {
  return e ? Z(/* @__PURE__ */ Object.create(null), e, t) : t;
}
function Ar(e, t) {
  return e ? T(e) && T(t) ? [.../* @__PURE__ */ new Set([...e, ...t])] : Z(
    /* @__PURE__ */ Object.create(null),
    kn(e),
    kn(t ?? {})
  ) : t;
}
function Nl(e, t) {
  if (!e) return t;
  if (!t) return e;
  const n = Z(/* @__PURE__ */ Object.create(null), e);
  for (const o in t)
    n[o] = ae(e[o], t[o]);
  return n;
}
function Zs() {
  return {
    app: null,
    config: {
      isNativeTag: us,
      performance: !1,
      globalProperties: {},
      optionMergeStrategies: {},
      errorHandler: void 0,
      warnHandler: void 0,
      compilerOptions: {}
    },
    mixins: [],
    components: {},
    directives: {},
    provides: /* @__PURE__ */ Object.create(null),
    optionsCache: /* @__PURE__ */ new WeakMap(),
    propsCache: /* @__PURE__ */ new WeakMap(),
    emitsCache: /* @__PURE__ */ new WeakMap()
  };
}
let bl = 0;
function yl(e, t) {
  return function(o, r = null) {
    P(o) || (o = Z({}, o)), r != null && !G(r) && (process.env.NODE_ENV !== "production" && b("root props passed to app.mount() must be an object."), r = null);
    const s = Zs(), i = /* @__PURE__ */ new WeakSet(), c = [];
    let u = !1;
    const d = s.app = {
      _uid: bl++,
      _component: o,
      _props: r,
      _container: null,
      _context: s,
      _instance: null,
      version: Kr,
      get config() {
        return s.config;
      },
      set config(a) {
        process.env.NODE_ENV !== "production" && b(
          "app.config cannot be replaced. Modify individual options instead."
        );
      },
      use(a, ...f) {
        return i.has(a) ? process.env.NODE_ENV !== "production" && b("Plugin has already been applied to target app.") : a && P(a.install) ? (i.add(a), a.install(d, ...f)) : P(a) ? (i.add(a), a(d, ...f)) : process.env.NODE_ENV !== "production" && b(
          'A plugin must either be a function or an object with an "install" function.'
        ), d;
      },
      mixin(a) {
        return s.mixins.includes(a) ? process.env.NODE_ENV !== "production" && b(
          "Mixin has already been applied to target app" + (a.name ? `: ${a.name}` : "")
        ) : s.mixins.push(a), d;
      },
      component(a, f) {
        return process.env.NODE_ENV !== "production" && Ho(a, s.config), f ? (process.env.NODE_ENV !== "production" && s.components[a] && b(`Component "${a}" has already been registered in target app.`), s.components[a] = f, d) : s.components[a];
      },
      directive(a, f) {
        return process.env.NODE_ENV !== "production" && Bs(a), f ? (process.env.NODE_ENV !== "production" && s.directives[a] && b(`Directive "${a}" has already been registered in target app.`), s.directives[a] = f, d) : s.directives[a];
      },
      mount(a, f, h) {
        if (u)
          process.env.NODE_ENV !== "production" && b(
            "App has already been mounted.\nIf you want to remount the same app, move your app creation logic into a factory function and create fresh app instances for each mount - e.g. `const createMyApp = () => createApp(App)`"
          );
        else {
          process.env.NODE_ENV !== "production" && a.__vue_app__ && b(
            "There is already an app instance mounted on the host container.\n If you want to mount another app on the same host container, you need to unmount the previous app by calling `app.unmount()` first."
          );
          const E = d._ceVNode || Ve(o, r);
          return E.appContext = s, h === !0 ? h = "svg" : h === !1 && (h = void 0), process.env.NODE_ENV !== "production" && (s.reload = () => {
            const D = ft(E);
            D.el = null, e(D, a, h);
          }), e(E, a, h), u = !0, d._container = a, a.__vue_app__ = d, process.env.NODE_ENV !== "production" && (d._instance = E.component, Pc(d, Kr)), io(E.component);
        }
      },
      onUnmount(a) {
        process.env.NODE_ENV !== "production" && typeof a != "function" && b(
          `Expected function as first argument to app.onUnmount(), but got ${typeof a}`
        ), c.push(a);
      },
      unmount() {
        u ? (Le(
          c,
          d._instance,
          16
        ), e(null, d._container), process.env.NODE_ENV !== "production" && (d._instance = null, Ac(d)), delete d._container.__vue_app__) : process.env.NODE_ENV !== "production" && b("Cannot unmount an app that is not mounted.");
      },
      provide(a, f) {
        return process.env.NODE_ENV !== "production" && a in s.provides && (B(s.provides, a) ? b(
          `App already provides property with key "${String(a)}". It will be overwritten with the new value.`
        ) : b(
          `App already provides property with key "${String(a)}" inherited from its parent element. It will be overwritten with the new value.`
        )), s.provides[a] = f, d;
      },
      runWithContext(a) {
        const f = At;
        At = d;
        try {
          return a();
        } finally {
          At = f;
        }
      }
    };
    return d;
  };
}
let At = null;
function Ol(e, t, n = k) {
  const o = lr();
  if (process.env.NODE_ENV !== "production" && !o)
    return b("useModel() called without active instance."), /* @__PURE__ */ ut();
  const r = ge(t);
  if (process.env.NODE_ENV !== "production" && !o.propsOptions[0][r])
    return b(`useModel() called with prop "${t}" which is not declared.`), /* @__PURE__ */ ut();
  const s = et(t), i = Qs(e, r), c = gc((u, d) => {
    let a, f = k, h;
    return Gc(() => {
      const E = e[r];
      le(a, E) && (a = E, d());
    }), {
      get() {
        return u(), n.get ? n.get(a) : a;
      },
      set(E) {
        const D = n.set ? n.set(E) : E;
        if (!le(D, a) && !(f !== k && le(E, f)))
          return;
        const V = o.vnode.props, I = !!(V && // check if parent has passed v-model
        (t in V || r in V || s in V) && (`onUpdate:${t}` in V || `onUpdate:${r}` in V || `onUpdate:${s}` in V));
        I || (a = E, d()), o.emit(`update:${t}`, D), le(E, f) && (le(E, D) && !le(D, h) || // #13524: browsers differ in when they flush microtasks between
        // event listeners. If a v-model listener emits an intermediate value
        // and a following listener restores the model to its previous prop
        // value before parent updates are flushed, the parent render can be
        // deduped as having no prop change. Force a local update so DOM state
        // such as an input's value is synchronized back to the current model.
        I && f !== k && !le(D, a)) && d(), f = E, h = D;
      }
    };
  });
  return c[Symbol.iterator] = () => {
    let u = 0;
    return {
      next() {
        return u < 2 ? { value: u++ ? i || k : c, done: !1 } : { done: !0 };
      }
    };
  }, c;
}
const Qs = (e, t) => t === "modelValue" || t === "model-value" ? e.modelModifiers : e[`${t}Modifiers`] || e[`${ge(t)}Modifiers`] || e[`${et(t)}Modifiers`];
function wl(e, t, ...n) {
  if (e.isUnmounted) return;
  const o = e.vnode.props || k;
  if (process.env.NODE_ENV !== "production") {
    const {
      emitsOptions: a,
      propsOptions: [f]
    } = e;
    if (a)
      if (!(t in a))
        (!f || !(dt(ge(t)) in f)) && b(
          `Component emitted event "${t}" but it is neither declared in the emits option nor as an "${dt(ge(t))}" prop.`
        );
      else {
        const h = a[t];
        P(h) && (h(...n) || b(
          `Invalid event arguments: event validation failed for event "${t}".`
        ));
      }
  }
  let r = n;
  const s = t.startsWith("update:"), i = s && Qs(o, t.slice(7));
  if (i && (i.trim && (r = n.map((a) => X(a) ? a.trim() : a)), i.number && (r = n.map(qo))), process.env.NODE_ENV !== "production" && jc(e, t, r), process.env.NODE_ENV !== "production") {
    const a = t.toLowerCase();
    a !== t && o[dt(a)] && b(
      `Event "${a}" is emitted in component ${En(
        e,
        e.type
      )} but the handler is registered for "${t}". Note that HTML attributes are case-insensitive and you cannot use v-on to listen to camelCase events when using in-DOM templates. You should probably use "${et(
        t
      )}" instead of "${t}".`
    );
  }
  let c, u = o[c = dt(t)] || // also try camelCase event handler (#2249)
  o[c = dt(ge(t))];
  !u && s && (u = o[c = dt(et(t))]), u && Le(
    u,
    e,
    6,
    r
  );
  const d = o[c + "Once"];
  if (d) {
    if (!e.emitted)
      e.emitted = {};
    else if (e.emitted[c])
      return;
    e.emitted[c] = !0, Le(
      d,
      e,
      6,
      r
    );
  }
}
const Vl = /* @__PURE__ */ new WeakMap();
function ei(e, t, n = !1) {
  const o = n ? Vl : t.emitsCache, r = o.get(e);
  if (r !== void 0)
    return r;
  const s = e.emits;
  let i = {}, c = !1;
  if (!P(e)) {
    const u = (d) => {
      const a = ei(d, t, !0);
      a && (c = !0, Z(i, a));
    };
    !n && t.mixins.length && t.mixins.forEach(u), e.extends && u(e.extends), e.mixins && e.mixins.forEach(u);
  }
  return !s && !c ? (G(e) && o.set(e, null), null) : (T(s) ? s.forEach((u) => i[u] = null) : Z(i, s), G(e) && o.set(e, i), i);
}
function ro(e, t) {
  return !e || !ln(t) ? !1 : (t = t.slice(2), t = t === "Once" ? t : t.replace(/Once$/, ""), B(e, t[0].toLowerCase() + t.slice(1)) || B(e, et(t)) || B(e, t));
}
let Mo = !1;
function Wn() {
  Mo = !0;
}
function Mr(e) {
  const {
    type: t,
    vnode: n,
    proxy: o,
    withProxy: r,
    propsOptions: [s],
    slots: i,
    attrs: c,
    emit: u,
    render: d,
    renderCache: a,
    props: f,
    data: h,
    setupState: E,
    ctx: D,
    inheritAttrs: V
  } = e, I = jn(e);
  let j, A;
  process.env.NODE_ENV !== "production" && (Mo = !1);
  try {
    if (n.shapeFlag & 4) {
      const C = r || o, ee = process.env.NODE_ENV !== "production" && E.__isScriptSetup ? new Proxy(C, {
        get(L, q, U) {
          return b(
            `Property '${String(
              q
            )}' was accessed via 'this'. Avoid using 'this' in templates.`
          ), Reflect.get(L, q, U);
        }
      }) : C;
      j = Se(
        d.call(
          ee,
          C,
          a,
          process.env.NODE_ENV !== "production" ? /* @__PURE__ */ Ge(f) : f,
          E,
          h,
          D
        )
      ), A = c;
    } else {
      const C = t;
      process.env.NODE_ENV !== "production" && c === f && Wn(), j = Se(
        C.length > 1 ? C(
          process.env.NODE_ENV !== "production" ? /* @__PURE__ */ Ge(f) : f,
          process.env.NODE_ENV !== "production" ? {
            get attrs() {
              return Wn(), /* @__PURE__ */ Ge(c);
            },
            slots: i,
            emit: u
          } : { attrs: c, slots: i, emit: u }
        ) : C(
          process.env.NODE_ENV !== "production" ? /* @__PURE__ */ Ge(f) : f,
          null
        )
      ), A = t.props ? c : xl(c);
    }
  } catch (C) {
    en.length = 0, dn(C, e, 1), j = Ve(Oe);
  }
  let F = j, Q;
  if (process.env.NODE_ENV !== "production" && j.patchFlag > 0 && j.patchFlag & 2048 && ([F, Q] = ti(j)), A && V !== !1) {
    const C = Object.keys(A), { shapeFlag: ee } = F;
    if (C.length) {
      if (ee & 7)
        s && C.some(tn) && (A = Dl(
          A,
          s
        )), F = ft(F, A, !1, !0);
      else if (process.env.NODE_ENV !== "production" && !Mo && F.type !== Oe) {
        const L = Object.keys(c), q = [], U = [];
        for (let _e = 0, be = L.length; _e < be; _e++) {
          const ve = L[_e];
          ln(ve) ? tn(ve) || q.push(ve[2].toLowerCase() + ve.slice(3)) : U.push(ve);
        }
        U.length && b(
          `Extraneous non-props attributes (${U.join(", ")}) were passed to component but could not be automatically inherited because component renders fragment or text or teleport root nodes.`
        ), q.length && b(
          `Extraneous non-emits event listeners (${q.join(", ")}) were passed to component but could not be automatically inherited because component renders fragment or text root nodes. If the listener is intended to be a component custom event listener only, declare it using the "emits" option.`
        );
      }
    }
  }
  return n.dirs && (process.env.NODE_ENV !== "production" && !Ir(F) && b(
    "Runtime directive used on component with non-element root node. The directives will not function as intended."
  ), F = ft(F, null, !1, !0), F.dirs = F.dirs ? F.dirs.concat(n.dirs) : n.dirs), n.transition && (process.env.NODE_ENV !== "production" && !Ir(F) && b(
    "Component inside <Transition> renders non-element root node that cannot be animated."
  ), nr(F, n.transition)), process.env.NODE_ENV !== "production" && Q ? Q(F) : j = F, jn(I), j;
}
const ti = (e) => {
  const t = e.children, n = e.dynamicChildren, o = sr(t, !1);
  if (o) {
    if (process.env.NODE_ENV !== "production" && o.patchFlag > 0 && o.patchFlag & 2048)
      return ti(o);
  } else return [e, void 0];
  const r = t.indexOf(o), s = n ? n.indexOf(o) : -1, i = (c) => {
    t[r] = c, n && (s > -1 ? n[s] = c : c.patchFlag > 0 && (e.dynamicChildren = [...n, c]));
  };
  return [Se(o), i];
};
function sr(e, t = !0) {
  let n;
  for (let o = 0; o < e.length; o++) {
    const r = e[o];
    if (so(r)) {
      if (r.type !== Oe || r.children === "v-if") {
        if (n)
          return;
        if (n = r, process.env.NODE_ENV !== "production" && t && n.patchFlag > 0 && n.patchFlag & 2048)
          return sr(n.children);
      }
    } else
      return;
  }
  return n;
}
const xl = (e) => {
  let t;
  for (const n in e)
    (n === "class" || n === "style" || ln(n)) && ((t || (t = {}))[n] = e[n]);
  return t;
}, Dl = (e, t) => {
  const n = {};
  for (const o in e)
    (!tn(o) || !(o.slice(9) in t)) && (n[o] = e[o]);
  return n;
}, Ir = (e) => e.shapeFlag & 7 || e.type === Oe;
function Cl(e, t, n) {
  const { props: o, children: r, component: s } = e, { props: i, children: c, patchFlag: u } = t, d = s.emitsOptions;
  if (process.env.NODE_ENV !== "production" && (r || c) && Ne || t.dirs || t.transition)
    return !0;
  if (n && u >= 0) {
    if (u & 1024)
      return !0;
    if (u & 16)
      return o ? Rr(o, i, d) : !!i;
    if (u & 8) {
      const a = t.dynamicProps;
      for (let f = 0; f < a.length; f++) {
        const h = a[f];
        if (ni(i, o, h) && !ro(d, h))
          return !0;
      }
    }
  } else
    return (r || c) && (!c || !c.$stable) ? !0 : o === i ? !1 : o ? i ? Rr(o, i, d) : !0 : !!i;
  return !1;
}
function Rr(e, t, n) {
  const o = Object.keys(t);
  if (o.length !== Object.keys(e).length)
    return !0;
  for (let r = 0; r < o.length; r++) {
    const s = o[r];
    if (ni(t, e, s) && !ro(n, s))
      return !0;
  }
  return !1;
}
function ni(e, t, n) {
  const o = e[n], r = t[n];
  return n === "style" && G(o) && G(r) ? !zo(o, r) : o !== r;
}
function Sl({ vnode: e, parent: t, suspense: n }, o) {
  for (; t; ) {
    const r = t.subTree;
    if (r.suspense && r.suspense.activeBranch === e && (r.suspense.vnode.el = r.el = o, e = r), r === e)
      (e = t.vnode).el = o, t = t.parent;
    else
      break;
  }
  n && n.activeBranch === e && (n.vnode.el = o);
}
const oi = {}, ri = () => Object.create(oi), si = (e) => Object.getPrototypeOf(e) === oi;
function Tl(e, t, n, o = !1) {
  const r = {}, s = ri();
  e.propsDefaults = /* @__PURE__ */ Object.create(null), ii(e, t, r, s);
  for (const i in e.propsOptions[0])
    i in r || (r[i] = void 0);
  process.env.NODE_ENV !== "production" && li(t || {}, r, e), n ? e.props = o ? r : /* @__PURE__ */ fc(r) : e.type.props ? e.props = r : e.props = s, e.attrs = s;
}
function $l(e) {
  for (; e; ) {
    if (e.type.__hmrId) return !0;
    e = e.parent;
  }
}
function Pl(e, t, n, o) {
  const {
    props: r,
    attrs: s,
    vnode: { patchFlag: i }
  } = e, c = /* @__PURE__ */ R(r), [u] = e.propsOptions;
  let d = !1;
  if (
    // always force full diff in dev
    // - #1942 if hmr is enabled with sfc component
    // - vite#872 non-sfc component used by sfc component
    !(process.env.NODE_ENV !== "production" && $l(e)) && (o || i > 0) && !(i & 16)
  ) {
    if (i & 8) {
      const a = e.vnode.dynamicProps;
      for (let f = 0; f < a.length; f++) {
        let h = a[f];
        if (ro(e.emitsOptions, h))
          continue;
        const E = t[h];
        if (u)
          if (B(s, h))
            E !== s[h] && (s[h] = E, d = !0);
          else {
            const D = ge(h);
            r[D] = Io(
              u,
              c,
              D,
              E,
              e,
              !1
            );
          }
        else
          E !== s[h] && (s[h] = E, d = !0);
      }
    }
  } else {
    ii(e, t, r, s) && (d = !0);
    let a;
    for (const f in c)
      (!t || // for camelCase
      !B(t, f) && // it's possible the original props was passed in as kebab-case
      // and converted to camelCase (#955)
      ((a = et(f)) === f || !B(t, a))) && (u ? n && // for camelCase
      (n[f] !== void 0 || // for kebab-case
      n[a] !== void 0) && (r[f] = Io(
        u,
        c,
        f,
        void 0,
        e,
        !0
      )) : delete r[f]);
    if (s !== c)
      for (const f in s)
        (!t || !B(t, f)) && (delete s[f], d = !0);
  }
  d && Ke(e.attrs, "set", ""), process.env.NODE_ENV !== "production" && li(t || {}, r, e);
}
function ii(e, t, n, o) {
  const [r, s] = e.propsOptions;
  let i = !1, c;
  if (t)
    for (let u in t) {
      if (qt(u))
        continue;
      const d = t[u];
      let a;
      r && B(r, a = ge(u)) ? !s || !s.includes(a) ? n[a] = d : (c || (c = {}))[a] = d : ro(e.emitsOptions, u) || (!(u in o) || d !== o[u]) && (o[u] = d, i = !0);
    }
  if (s) {
    const u = /* @__PURE__ */ R(n), d = c || k;
    for (let a = 0; a < s.length; a++) {
      const f = s[a];
      n[f] = Io(
        r,
        u,
        f,
        d[f],
        e,
        !B(d, f)
      );
    }
  }
  return i;
}
function Io(e, t, n, o, r, s) {
  const i = e[n];
  if (i != null) {
    const c = B(i, "default");
    if (c && o === void 0) {
      const u = i.default;
      if (i.type !== Function && !i.skipFactory && P(u)) {
        const { propsDefaults: d } = r;
        if (n in d)
          o = d[n];
        else {
          const a = vn(r);
          o = d[n] = u.call(
            null,
            t
          ), a();
        }
      } else
        o = u;
      r.ce && r.ce._setProp(n, o);
    }
    i[
      0
      /* shouldCast */
    ] && (s && !c ? o = !1 : i[
      1
      /* shouldCastTrue */
    ] && (o === "" || o === et(n)) && (o = !0));
  }
  return o;
}
const Al = /* @__PURE__ */ new WeakMap();
function ci(e, t, n = !1) {
  const o = n ? Al : t.propsCache, r = o.get(e);
  if (r)
    return r;
  const s = e.props, i = {}, c = [];
  let u = !1;
  if (!P(e)) {
    const a = (f) => {
      u = !0;
      const [h, E] = ci(f, t, !0);
      Z(i, h), E && c.push(...E);
    };
    !n && t.mixins.length && t.mixins.forEach(a), e.extends && a(e.extends), e.mixins && e.mixins.forEach(a);
  }
  if (!s && !u)
    return G(e) && o.set(e, $t), $t;
  if (T(s))
    for (let a = 0; a < s.length; a++) {
      process.env.NODE_ENV !== "production" && !X(s[a]) && b("props must be strings when using array syntax.", s[a]);
      const f = ge(s[a]);
      Lr(f) && (i[f] = k);
    }
  else if (s) {
    process.env.NODE_ENV !== "production" && !G(s) && b("invalid props options", s);
    for (const a in s) {
      const f = ge(a);
      if (Lr(f)) {
        const h = s[a], E = i[f] = T(h) || P(h) ? { type: h } : Z({}, h), D = E.type;
        let V = !1, I = !0;
        if (T(D))
          for (let j = 0; j < D.length; ++j) {
            const A = D[j], F = P(A) && A.name;
            if (F === "Boolean") {
              V = !0;
              break;
            } else F === "String" && (I = !1);
          }
        else
          V = P(D) && D.name === "Boolean";
        E[
          0
          /* shouldCast */
        ] = V, E[
          1
          /* shouldCastTrue */
        ] = I, (V || B(E, "default")) && c.push(f);
      }
    }
  }
  const d = [i, c];
  return G(e) && o.set(e, d), d;
}
function Lr(e) {
  return e[0] !== "$" && !qt(e) ? !0 : (process.env.NODE_ENV !== "production" && b(`Invalid prop name: "${e}" is a reserved property.`), !1);
}
function Ml(e) {
  return e === null ? "null" : typeof e == "function" ? e.name || "" : typeof e == "object" && e.constructor && e.constructor.name || "";
}
function li(e, t, n) {
  const o = /* @__PURE__ */ R(t), r = n.propsOptions[0], s = Object.keys(e).map((i) => ge(i));
  for (const i in r) {
    let c = r[i];
    c != null && Il(
      i,
      o[i],
      c,
      process.env.NODE_ENV !== "production" ? /* @__PURE__ */ Ge(o) : o,
      !s.includes(i)
    );
  }
}
function Il(e, t, n, o, r) {
  const { type: s, required: i, validator: c, skipCheck: u } = n;
  if (i && r) {
    b('Missing required prop: "' + e + '"');
    return;
  }
  if (!(t == null && !i)) {
    if (s != null && s !== !0 && !u) {
      let d = !1;
      const a = T(s) ? s : [s], f = [];
      for (let h = 0; h < a.length && !d; h++) {
        const { valid: E, expectedType: D } = Ll(t, a[h]);
        f.push(D || ""), d = E;
      }
      if (!d) {
        b(Fl(e, t, f));
        return;
      }
    }
    c && !c(t, o) && b('Invalid prop: custom validator check failed for prop "' + e + '".');
  }
}
const Rl = /* @__PURE__ */ tt(
  "String,Number,Boolean,Function,Symbol,BigInt"
);
function Ll(e, t) {
  let n;
  const o = Ml(t);
  if (o === "null")
    n = e === null;
  else if (Rl(o)) {
    const r = typeof e;
    n = r === o.toLowerCase(), !n && r === "object" && (n = e instanceof t);
  } else o === "Object" ? n = G(e) : o === "Array" ? n = T(e) : n = e instanceof t;
  return {
    valid: n,
    expectedType: o
  };
}
function Fl(e, t, n) {
  if (n.length === 0)
    return `Prop type [] for prop "${e}" won't match anything. Did you mean to use type Array instead?`;
  let o = `Invalid prop: type check failed for prop "${e}". Expected ${n.map(zn).join(" | ")}`;
  const r = n[0], s = Ko(t), i = Fr(t, r), c = Fr(t, s);
  return n.length === 1 && jr(r) && jl(r, s) && (o += ` with value ${i}`), o += `, got ${s} `, jr(s) && (o += `with value ${c}.`), o;
}
function Fr(e, t) {
  return Ae(e) ? e.toString() : t === "String" ? `"${e}"` : t === "Number" ? `${Number(e)}` : `${e}`;
}
function jr(e) {
  return ["string", "number", "boolean"].some((n) => e.toLowerCase() === n);
}
function jl(...e) {
  return e.every((t) => {
    const n = t.toLowerCase();
    return n !== "boolean" && n !== "symbol";
  });
}
const ir = (e) => e === "_" || e === "_ctx" || e === "$stable", cr = (e) => T(e) ? e.map(Se) : [Se(e)], Hl = (e, t, n) => {
  if (t._n)
    return t;
  const o = Hc((...r) => (process.env.NODE_ENV !== "production" && oe && !(n === null && he) && !(n && n.root !== oe.root) && b(
    `Slot "${e}" invoked outside of the render function: this will not track dependencies used in the slot. Invoke the slot function inside the render function instead.`
  ), cr(t(...r))), n);
  return o._c = !1, o;
}, ui = (e, t, n) => {
  const o = e._ctx;
  for (const r in e) {
    if (ir(r)) continue;
    const s = e[r];
    if (P(s))
      t[r] = Hl(r, s, o);
    else if (s != null) {
      process.env.NODE_ENV !== "production" && b(
        `Non-function value encountered for slot "${r}". Prefer function slots for better performance.`
      );
      const i = cr(s);
      t[r] = () => i;
    }
  }
}, fi = (e, t) => {
  process.env.NODE_ENV !== "production" && !or(e.vnode) && b(
    "Non-function value encountered for default slot. Prefer function slots for better performance."
  );
  const n = cr(t);
  e.slots.default = () => n;
}, Ro = (e, t, n) => {
  for (const o in t)
    (n || !ir(o)) && (e[o] = t[o]);
}, kl = (e, t, n) => {
  const o = e.slots = ri();
  if (e.vnode.shapeFlag & 32) {
    const r = t._;
    r ? (Ro(o, t, n), n && Mn(o, "_", r, !0)) : ui(t, o);
  } else t && fi(e, t);
}, Ul = (e, t, n) => {
  const { vnode: o, slots: r } = e;
  let s = !0, i = k;
  if (o.shapeFlag & 32) {
    const c = t._;
    c ? process.env.NODE_ENV !== "production" && Ne ? (Ro(r, t, n), Ke(e, "set", "$slots")) : n && c === 1 ? s = !1 : Ro(r, t, n) : (s = !t.$stable, ui(t, r)), i = t;
  } else t && (fi(e, t), i = { default: 1 });
  if (s)
    for (const c in r)
      !ir(c) && i[c] == null && delete r[c];
};
let kt, Ye;
function wt(e, t) {
  e.appContext.config.performance && Bn() && Ye.mark(`vue-${t}-${e.uid}`), process.env.NODE_ENV !== "production" && Lc(e, t, Bn() ? Ye.now() : Date.now());
}
function Vt(e, t) {
  if (e.appContext.config.performance && Bn()) {
    const n = `vue-${t}-${e.uid}`, o = n + ":end", r = `<${En(e, e.type)}> ${t}`;
    Ye.mark(o), Ye.measure(r, n, o), Ye.clearMeasures(r), Ye.clearMarks(n), Ye.clearMarks(o);
  }
  process.env.NODE_ENV !== "production" && Fc(e, t, Bn() ? Ye.now() : Date.now());
}
function Bn() {
  return kt !== void 0 || (typeof window < "u" && window.performance ? (kt = !0, Ye = window.performance) : kt = !1), kt;
}
function Wl() {
  const e = [];
  if (process.env.NODE_ENV !== "production" && e.length) {
    const t = e.length > 1;
    console.warn(
      `Feature flag${t ? "s" : ""} ${e.join(", ")} ${t ? "are" : "is"} not explicitly defined. You are running the esm-bundler build of Vue, which expects these compile-time feature flags to be globally injected via the bundler config in order to get better tree-shaking in the production bundle.

For more details, see https://link.vuejs.org/feature-flags.`
    );
  }
}
const pe = zl;
function Bl(e) {
  return Kl(e);
}
function Kl(e, t) {
  Wl();
  const n = fn();
  n.__VUE__ = !0, process.env.NODE_ENV !== "production" && er(n.__VUE_DEVTOOLS_GLOBAL_HOOK__, n);
  const {
    insert: o,
    remove: r,
    patchProp: s,
    createElement: i,
    createText: c,
    createComment: u,
    setText: d,
    setElementText: a,
    parentNode: f,
    nextSibling: h,
    setScopeId: E = se,
    insertStaticContent: D
  } = e, V = (l, p, g, N = null, _ = null, m = null, w = void 0, O = null, y = process.env.NODE_ENV !== "production" && Ne ? !1 : !!p.dynamicChildren) => {
    if (l === p)
      return;
    l && !Ut(l, p) && (N = yn(l), rt(l, _, m, !0), l = null), p.patchFlag === -2 && (y = !1, p.dynamicChildren = null);
    const { type: v, ref: $, shapeFlag: x } = p;
    switch (v) {
      case _n:
        I(l, p, g, N);
        break;
      case Oe:
        j(l, p, g, N);
        break;
      case $n:
        l == null ? A(p, g, N, w) : process.env.NODE_ENV !== "production" && F(l, p, g, w);
        break;
      case we:
        Nt(
          l,
          p,
          g,
          N,
          _,
          m,
          w,
          O,
          y
        );
        break;
      default:
        x & 1 ? ee(
          l,
          p,
          g,
          N,
          _,
          m,
          w,
          O,
          y
        ) : x & 6 ? bt(
          l,
          p,
          g,
          N,
          _,
          m,
          w,
          O,
          y
        ) : x & 64 || x & 128 ? v.process(
          l,
          p,
          g,
          N,
          _,
          m,
          w,
          O,
          y,
          Ft
        ) : process.env.NODE_ENV !== "production" && b("Invalid VNode type:", v, `(${typeof v})`);
    }
    $ != null && _ ? Xt($, l && l.ref, m, p || l, !p) : $ == null && l && l.ref != null && Xt(l.ref, null, m, l, !0);
  }, I = (l, p, g, N) => {
    if (l == null)
      o(
        p.el = c(p.children),
        g,
        N
      );
    else {
      const _ = p.el = l.el;
      p.children !== l.children && d(_, p.children);
    }
  }, j = (l, p, g, N) => {
    l == null ? o(
      p.el = u(p.children || ""),
      g,
      N
    ) : p.el = l.el;
  }, A = (l, p, g, N) => {
    [l.el, l.anchor] = D(
      l.children,
      p,
      g,
      N,
      l.el,
      l.anchor
    );
  }, F = (l, p, g, N) => {
    if (p.children !== l.children) {
      const _ = h(l.anchor);
      C(l), [p.el, p.anchor] = D(
        p.children,
        g,
        _,
        N
      );
    } else
      p.el = l.el, p.anchor = l.anchor;
  }, Q = ({ el: l, anchor: p }, g, N) => {
    let _;
    for (; l && l !== p; )
      _ = h(l), o(l, g, N), l = _;
    o(p, g, N);
  }, C = ({ el: l, anchor: p }) => {
    let g;
    for (; l && l !== p; )
      g = h(l), r(l), l = g;
    r(p);
  }, ee = (l, p, g, N, _, m, w, O, y) => {
    if (p.type === "svg" ? w = "svg" : p.type === "math" && (w = "mathml"), l == null)
      L(
        p,
        g,
        N,
        _,
        m,
        w,
        O,
        y
      );
    else {
      const v = l.el && l.el._isVueCE ? l.el : null;
      try {
        v && v._beginPatch(), _e(
          l,
          p,
          _,
          m,
          w,
          O,
          y
        );
      } finally {
        v && v._endPatch();
      }
    }
  }, L = (l, p, g, N, _, m, w, O) => {
    let y, v;
    const { props: $, shapeFlag: x, transition: S, dirs: M } = l;
    if (y = l.el = i(
      l.type,
      m,
      $ && $.is,
      $
    ), x & 8 ? a(y, l.children) : x & 16 && U(
      l.children,
      y,
      null,
      N,
      _,
      Eo(l, m),
      w,
      O
    ), M && at(l, null, N, "created"), q(y, l, l.scopeId, w, N), $) {
      for (const Y in $)
        Y !== "value" && !qt(Y) && s(y, Y, null, $[Y], m, N);
      "value" in $ && s(y, "value", null, $.value, m), (v = $.onVnodeBeforeMount) && Ue(v, N, l);
    }
    process.env.NODE_ENV !== "production" && (Mn(y, "__vnode", l, !0), Mn(y, "__vueParentComponent", N, !0)), M && at(l, null, N, "beforeMount");
    const K = Gl(_, S);
    if (K && S.beforeEnter(y), o(y, p, g), (v = $ && $.onVnodeMounted) || K || M) {
      const Y = process.env.NODE_ENV !== "production" && Ne;
      pe(() => {
        let z;
        process.env.NODE_ENV !== "production" && (z = Or(Y));
        try {
          v && Ue(v, N, l), K && S.enter(y), M && at(l, null, N, "mounted");
        } finally {
          process.env.NODE_ENV !== "production" && Or(z);
        }
      }, _);
    }
  }, q = (l, p, g, N, _) => {
    if (g && E(l, g), N)
      for (let m = 0; m < N.length; m++)
        E(l, N[m]);
    if (_) {
      let m = _.subTree;
      if (process.env.NODE_ENV !== "production" && m.patchFlag > 0 && m.patchFlag & 2048 && (m = sr(m.children) || m), p === m || di(m.type) && (m.ssContent === p || m.ssFallback === p)) {
        const w = _.vnode;
        q(
          l,
          w,
          w.scopeId,
          w.slotScopeIds,
          _.parent
        );
      }
    }
  }, U = (l, p, g, N, _, m, w, O, y = 0) => {
    for (let v = y; v < l.length; v++) {
      const $ = l[v] = O ? Je(l[v]) : Se(l[v]);
      V(
        null,
        $,
        p,
        g,
        N,
        _,
        m,
        w,
        O
      );
    }
  }, _e = (l, p, g, N, _, m, w) => {
    const O = p.el = l.el;
    process.env.NODE_ENV !== "production" && (O.__vnode = p);
    let { patchFlag: y, dynamicChildren: v, dirs: $ } = p;
    y |= l.patchFlag & 16;
    const x = l.props || k, S = p.props || k;
    let M;
    if (g && pt(g, !1), (M = S.onVnodeBeforeUpdate) && Ue(M, g, p, l), $ && at(p, l, g, "beforeUpdate"), g && pt(g, !0), // HMR updated, force full diff
    (process.env.NODE_ENV !== "production" && Ne || // #6385 the old vnode may be a user-wrapped non-isomorphic block
    // Force full diff when block metadata is unstable.
    v && (!l.dynamicChildren || l.dynamicChildren.length !== v.length)) && (y = 0, w = !1, v = null), (x.innerHTML && S.innerHTML == null || x.textContent && S.textContent == null) && a(O, ""), v ? (be(
      l.dynamicChildren,
      v,
      O,
      g,
      N,
      Eo(p, _),
      m
    ), process.env.NODE_ENV !== "production" && Qt(l, p)) : w || Fe(
      l,
      p,
      O,
      null,
      g,
      N,
      Eo(p, _),
      m,
      !1
    ), y > 0) {
      if (y & 16)
        ve(O, x, S, g, _);
      else if (y & 2 && x.class !== S.class && s(O, "class", null, S.class, _), y & 4 && s(O, "style", x.style, S.style, _), y & 8) {
        const K = p.dynamicProps;
        for (let Y = 0; Y < K.length; Y++) {
          const z = K[Y], ne = x[z], ie = S[z];
          (ie !== ne || z === "value") && s(O, z, ne, ie, _, g);
        }
      }
      y & 1 && l.children !== p.children && a(O, p.children);
    } else !w && v == null && ve(O, x, S, g, _);
    ((M = S.onVnodeUpdated) || $) && pe(() => {
      M && Ue(M, g, p, l), $ && at(p, l, g, "updated");
    }, N);
  }, be = (l, p, g, N, _, m, w) => {
    for (let O = 0; O < p.length; O++) {
      const y = l[O], v = p[O], $ = (
        // oldVNode may be an errored async setup() component inside Suspense
        // which will not have a mounted element
        y.el && // - In the case of a Fragment, we need to provide the actual parent
        // of the Fragment itself so it can move its children.
        (y.type === we || // - In the case of different nodes, there is going to be a replacement
        // which also requires the correct parent container
        !Ut(y, v) || // - In the case of a component, it could contain anything.
        y.shapeFlag & 198) ? f(y.el) : (
          // In other cases, the parent container is not actually used so we
          // just pass the block element here to avoid a DOM parentNode call.
          g
        )
      );
      V(
        y,
        v,
        $,
        null,
        N,
        _,
        m,
        w,
        !0
      );
    }
  }, ve = (l, p, g, N, _) => {
    if (p !== g) {
      if (p !== k)
        for (const m in p)
          !qt(m) && !(m in g) && s(
            l,
            m,
            p[m],
            null,
            _,
            N
          );
      for (const m in g) {
        if (qt(m)) continue;
        const w = g[m], O = p[m];
        w !== O && m !== "value" && s(l, m, O, w, _, N);
      }
      "value" in g && s(l, "value", p.value, g.value, _);
    }
  }, Nt = (l, p, g, N, _, m, w, O, y) => {
    const v = p.el = l ? l.el : c(""), $ = p.anchor = l ? l.anchor : c("");
    let { patchFlag: x, dynamicChildren: S, slotScopeIds: M } = p;
    process.env.NODE_ENV !== "production" && // #5523 dev root fragment may inherit directives
    (Ne || x & 2048) && (x = 0, y = !1, S = null), M && (O = O ? O.concat(M) : M), l == null ? (o(v, g, N), o($, g, N), U(
      // #10007
      // such fragment like `<></>` will be compiled into
      // a fragment which doesn't have a children.
      // In this case fallback to an empty array
      p.children || [],
      g,
      $,
      _,
      m,
      w,
      O,
      y
    )) : x > 0 && x & 64 && S && // #2715 the previous fragment could've been a BAILed one as a result
    // of renderSlot() with no valid children
    l.dynamicChildren && l.dynamicChildren.length === S.length ? (be(
      l.dynamicChildren,
      S,
      g,
      _,
      m,
      w,
      O
    ), process.env.NODE_ENV !== "production" ? Qt(l, p) : (
      // #2080 if the stable fragment has a key, it's a <template v-for> that may
      //  get moved around. Make sure all root level vnodes inherit el.
      // #2134 or if it's a component root, it may also get moved around
      // as the component is being moved.
      (p.key != null || _ && p === _.subTree) && Qt(
        l,
        p,
        !0
        /* shallow */
      )
    )) : Fe(
      l,
      p,
      g,
      $,
      _,
      m,
      w,
      O,
      y
    );
  }, bt = (l, p, g, N, _, m, w, O, y) => {
    p.slotScopeIds = O, l == null ? p.shapeFlag & 512 ? _.ctx.activate(
      p,
      g,
      N,
      w,
      y
    ) : ot(
      p,
      g,
      N,
      _,
      m,
      w,
      y
    ) : Ee(l, p, y);
  }, ot = (l, p, g, N, _, m, w) => {
    const O = l.component = nu(
      l,
      N,
      _
    );
    if (process.env.NODE_ENV !== "production" && O.type.__hmrId && Cc(O), process.env.NODE_ENV !== "production" && (Dn(l), wt(O, "mount")), or(l) && (O.ctx.renderer = Ft), process.env.NODE_ENV !== "production" && wt(O, "init"), ru(O, !1, w), process.env.NODE_ENV !== "production" && Vt(O, "init"), process.env.NODE_ENV !== "production" && Ne && (l.el = null), O.asyncDep) {
      if (_ && _.registerDep(O, W, w), !l.el) {
        const y = O.subTree = Ve(Oe);
        j(null, y, p, g), l.placeholder = y.el;
      }
    } else
      W(
        O,
        l,
        p,
        g,
        _,
        m,
        w
      );
    process.env.NODE_ENV !== "production" && (Cn(), Vt(O, "mount"));
  }, Ee = (l, p, g) => {
    const N = p.component = l.component;
    if (Cl(l, p, g))
      if (N.asyncDep && !N.asyncResolved) {
        process.env.NODE_ENV !== "production" && Dn(p), H(N, p, g), process.env.NODE_ENV !== "production" && Cn();
        return;
      } else
        N.next = p, N.update();
    else
      p.el = l.el, N.vnode = p;
  }, W = (l, p, g, N, _, m, w) => {
    const O = () => {
      if (l.isMounted) {
        let { next: x, bu: S, u: M, parent: K, vnode: Y } = l;
        {
          const He = ai(l);
          if (He) {
            x && (x.el = Y.el, H(l, x, w)), He.asyncDep.then(() => {
              pe(() => {
                l.isUnmounted || v();
              }, _);
            });
            return;
          }
        }
        let z = x, ne;
        process.env.NODE_ENV !== "production" && Dn(x || l.vnode), pt(l, !1), x ? (x.el = Y.el, H(l, x, w)) : x = Y, S && xt(S), (ne = x.props && x.props.onVnodeBeforeUpdate) && Ue(ne, K, x, Y), pt(l, !0), process.env.NODE_ENV !== "production" && wt(l, "render");
        const ie = Mr(l);
        process.env.NODE_ENV !== "production" && Vt(l, "render");
        const je = l.subTree;
        l.subTree = ie, process.env.NODE_ENV !== "production" && wt(l, "patch"), V(
          je,
          ie,
          // parent may have changed if it's in a teleport
          f(je.el),
          // anchor may have changed if it's in a fragment
          yn(je),
          l,
          _,
          m
        ), process.env.NODE_ENV !== "production" && Vt(l, "patch"), x.el = ie.el, z === null && Sl(l, ie.el), M && pe(M, _), (ne = x.props && x.props.onVnodeUpdated) && pe(
          () => Ue(ne, K, x, Y),
          _
        ), process.env.NODE_ENV !== "production" && ks(l), process.env.NODE_ENV !== "production" && Cn();
      } else {
        let x;
        const { el: S, props: M } = p, { bm: K, m: Y, parent: z, root: ne, type: ie } = l, je = Zt(p);
        pt(l, !1), K && xt(K), !je && (x = M && M.onVnodeBeforeMount) && Ue(x, z, p), pt(l, !0);
        {
          ne.ce && ne.ce._hasShadowRoot() && ne.ce._injectChildStyle(
            ie,
            l.parent ? l.parent.type : void 0
          ), process.env.NODE_ENV !== "production" && wt(l, "render");
          const He = l.subTree = Mr(l);
          process.env.NODE_ENV !== "production" && Vt(l, "render"), process.env.NODE_ENV !== "production" && wt(l, "patch"), V(
            null,
            He,
            g,
            N,
            l,
            _,
            m
          ), process.env.NODE_ENV !== "production" && Vt(l, "patch"), p.el = He.el;
        }
        if (Y && pe(Y, _), !je && (x = M && M.onVnodeMounted)) {
          const He = p;
          pe(
            () => Ue(x, z, He),
            _
          );
        }
        (p.shapeFlag & 256 || z && Zt(z.vnode) && z.vnode.shapeFlag & 256) && l.a && pe(l.a, _), l.isMounted = !0, process.env.NODE_ENV !== "production" && Mc(l), p = g = N = null;
      }
    };
    l.scope.on();
    const y = l.effect = new ms(O);
    l.scope.off();
    const v = l.update = y.run.bind(y), $ = l.job = y.runIfDirty.bind(y);
    $.i = l, $.id = l.uid, y.scheduler = () => eo($), pt(l, !0), process.env.NODE_ENV !== "production" && (y.onTrack = l.rtc ? (x) => xt(l.rtc, x) : void 0, y.onTrigger = l.rtg ? (x) => xt(l.rtg, x) : void 0), v();
  }, H = (l, p, g) => {
    p.component = l;
    const N = l.vnode.props;
    l.vnode = p, l.next = null, Pl(l, p.props, N, g), Ul(l, p.children, g), xe(), yr(l), De();
  }, Fe = (l, p, g, N, _, m, w, O, y = !1) => {
    const v = l && l.children, $ = l ? l.shapeFlag : 0, x = p.children, { patchFlag: S, shapeFlag: M } = p;
    if (S > 0) {
      if (S & 128) {
        Rt(
          v,
          x,
          g,
          N,
          _,
          m,
          w,
          O,
          y
        );
        return;
      } else if (S & 256) {
        co(
          v,
          x,
          g,
          N,
          _,
          m,
          w,
          O,
          y
        );
        return;
      }
    }
    M & 8 ? ($ & 16 && Lt(v, _, m), x !== v && a(g, x)) : $ & 16 ? M & 16 ? Rt(
      v,
      x,
      g,
      N,
      _,
      m,
      w,
      O,
      y
    ) : Lt(v, _, m, !0) : ($ & 8 && a(g, ""), M & 16 && U(
      x,
      g,
      N,
      _,
      m,
      w,
      O,
      y
    ));
  }, co = (l, p, g, N, _, m, w, O, y) => {
    l = l || $t, p = p || $t;
    const v = l.length, $ = p.length, x = Math.min(v, $);
    let S;
    for (S = 0; S < x; S++) {
      const M = p[S] = y ? Je(p[S]) : Se(p[S]);
      V(
        l[S],
        M,
        g,
        null,
        _,
        m,
        w,
        O,
        y
      );
    }
    v > $ ? Lt(
      l,
      _,
      m,
      !0,
      !1,
      x
    ) : U(
      p,
      g,
      N,
      _,
      m,
      w,
      O,
      y,
      x
    );
  }, Rt = (l, p, g, N, _, m, w, O, y) => {
    let v = 0;
    const $ = p.length;
    let x = l.length - 1, S = $ - 1;
    for (; v <= x && v <= S; ) {
      const M = l[v], K = p[v] = y ? Je(p[v]) : Se(p[v]);
      if (Ut(M, K))
        V(
          M,
          K,
          g,
          null,
          _,
          m,
          w,
          O,
          y
        );
      else
        break;
      v++;
    }
    for (; v <= x && v <= S; ) {
      const M = l[x], K = p[S] = y ? Je(p[S]) : Se(p[S]);
      if (Ut(M, K))
        V(
          M,
          K,
          g,
          null,
          _,
          m,
          w,
          O,
          y
        );
      else
        break;
      x--, S--;
    }
    if (v > x) {
      if (v <= S) {
        const M = S + 1, K = M < $ ? p[M].el : N;
        for (; v <= S; )
          V(
            null,
            p[v] = y ? Je(p[v]) : Se(p[v]),
            g,
            K,
            _,
            m,
            w,
            O,
            y
          ), v++;
      }
    } else if (v > S)
      for (; v <= x; )
        rt(l[v], _, m, !0), v++;
    else {
      const M = v, K = v, Y = /* @__PURE__ */ new Map();
      for (v = K; v <= S; v++) {
        const fe = p[v] = y ? Je(p[v]) : Se(p[v]);
        fe.key != null && (process.env.NODE_ENV !== "production" && Y.has(fe.key) && b(
          "Duplicate keys found during update:",
          JSON.stringify(fe.key),
          "Make sure keys are unique."
        ), Y.set(fe.key, v));
      }
      let z, ne = 0;
      const ie = S - K + 1;
      let je = !1, He = 0;
      const jt = new Array(ie);
      for (v = 0; v < ie; v++) jt[v] = 0;
      for (v = M; v <= x; v++) {
        const fe = l[v];
        if (ne >= ie) {
          rt(fe, _, m, !0);
          continue;
        }
        let ke;
        if (fe.key != null)
          ke = Y.get(fe.key);
        else
          for (z = K; z <= S; z++)
            if (jt[z - K] === 0 && Ut(fe, p[z])) {
              ke = z;
              break;
            }
        ke === void 0 ? rt(fe, _, m, !0) : (jt[ke - K] = v + 1, ke >= He ? He = ke : je = !0, V(
          fe,
          p[ke],
          g,
          null,
          _,
          m,
          w,
          O,
          y
        ), ne++);
      }
      const dr = je ? ql(jt) : $t;
      for (z = dr.length - 1, v = ie - 1; v >= 0; v--) {
        const fe = K + v, ke = p[fe], hr = p[fe + 1], gr = fe + 1 < $ ? (
          // #13559, #14173 fallback to el placeholder for unresolved async component
          hr.el || pi(hr)
        ) : N;
        jt[v] === 0 ? V(
          null,
          ke,
          g,
          gr,
          _,
          m,
          w,
          O,
          y
        ) : je && (z < 0 || v !== dr[z] ? yt(ke, g, gr, 2) : z--);
      }
    }
  }, yt = (l, p, g, N, _ = null) => {
    const { el: m, type: w, transition: O, children: y, shapeFlag: v } = l;
    if (v & 6) {
      yt(l.component.subTree, p, g, N);
      return;
    }
    if (v & 128) {
      l.suspense.move(p, g, N);
      return;
    }
    if (v & 64) {
      w.move(l, p, g, Ft);
      return;
    }
    if (w === we) {
      o(m, p, g);
      for (let x = 0; x < y.length; x++)
        yt(y[x], p, g, N);
      o(l.anchor, p, g);
      return;
    }
    if (w === $n) {
      Q(l, p, g);
      return;
    }
    if (N !== 2 && v & 1 && O)
      if (N === 0)
        O.persisted && !m[_o] ? o(m, p, g) : (O.beforeEnter(m), o(m, p, g), pe(() => O.enter(m), _));
      else {
        const { leave: x, delayLeave: S, afterLeave: M } = O, K = () => {
          l.ctx.isUnmounted ? r(m) : o(m, p, g);
        }, Y = () => {
          const z = m._isLeaving || !!m[_o];
          m._isLeaving && m[_o](
            !0
            /* cancelled */
          ), O.persisted && !z ? K() : x(m, () => {
            K(), M && M();
          });
        };
        S ? S(m, K, Y) : Y();
      }
    else
      o(m, p, g);
  }, rt = (l, p, g, N = !1, _ = !1) => {
    const {
      type: m,
      props: w,
      ref: O,
      children: y,
      dynamicChildren: v,
      shapeFlag: $,
      patchFlag: x,
      dirs: S,
      cacheIndex: M,
      memo: K
    } = l;
    if (x === -2 && (_ = !1), O != null && (xe(), Xt(O, null, g, l, !0), De()), M != null && (p.renderCache[M] = void 0), $ & 256) {
      p.ctx.deactivate(l);
      return;
    }
    const Y = $ & 1 && S, z = !Zt(l);
    let ne;
    if (z && (ne = w && w.onVnodeBeforeUnmount) && Ue(ne, p, l), $ & 6)
      Di(l.component, g, N);
    else {
      if ($ & 128) {
        l.suspense.unmount(g, N);
        return;
      }
      Y && at(l, null, p, "beforeUnmount"), $ & 64 ? l.type.remove(
        l,
        p,
        g,
        Ft,
        N
      ) : v && // #5154
      // when v-once is used inside a block, setBlockTracking(-1) marks the
      // parent block with hasOnce: true
      // so that it doesn't take the fast path during unmount - otherwise
      // components nested in v-once are never unmounted.
      !v.hasOnce && // #1153: fast path should not be taken for non-stable (v-for) fragments
      (m !== we || x > 0 && x & 64) ? Lt(
        v,
        p,
        g,
        !1,
        !0
      ) : (m === we && x & 384 || !_ && $ & 16) && Lt(y, p, g), N && lo(l);
    }
    const ie = K != null && M == null;
    (z && (ne = w && w.onVnodeUnmounted) || Y || ie) && pe(() => {
      ne && Ue(ne, p, l), Y && at(l, null, p, "unmounted"), ie && (l.el = null);
    }, g);
  }, lo = (l) => {
    const { type: p, el: g, anchor: N, transition: _ } = l;
    if (p === we) {
      process.env.NODE_ENV !== "production" && l.patchFlag > 0 && l.patchFlag & 2048 && _ && !_.persisted ? l.children.forEach((w) => {
        w.type === Oe ? r(w.el) : lo(w);
      }) : xi(g, N);
      return;
    }
    if (p === $n) {
      C(l);
      return;
    }
    const m = () => {
      r(g), _ && !_.persisted && _.afterLeave && _.afterLeave();
    };
    if (l.shapeFlag & 1 && _ && !_.persisted) {
      const { leave: w, delayLeave: O } = _, y = () => w(g, m);
      O ? O(l.el, m, y) : y();
    } else
      m();
  }, xi = (l, p) => {
    let g;
    for (; l !== p; )
      g = h(l), r(l), l = g;
    r(p);
  }, Di = (l, p, g) => {
    process.env.NODE_ENV !== "production" && l.type.__hmrId && Sc(l);
    const { bum: N, scope: _, job: m, subTree: w, um: O, m: y, a: v } = l;
    Hr(y), Hr(v), N && xt(N), _.stop(), m && (m.flags |= 8, rt(w, l, p, g)), O && pe(O, p), pe(() => {
      l.isUnmounted = !0;
    }, p), process.env.NODE_ENV !== "production" && Rc(l);
  }, Lt = (l, p, g, N = !1, _ = !1, m = 0) => {
    for (let w = m; w < l.length; w++)
      rt(l[w], p, g, N, _);
  }, yn = (l) => {
    if (l.shapeFlag & 6)
      return yn(l.component.subTree);
    if (l.shapeFlag & 128)
      return l.suspense.next();
    const p = h(l.anchor || l.el), g = p && p[Gs];
    return g ? h(g) : p;
  };
  let uo = !1;
  const pr = (l, p, g) => {
    let N;
    l == null ? p._vnode && (rt(p._vnode, null, null, !0), N = p._vnode.component) : V(
      p._vnode || null,
      l,
      p,
      null,
      null,
      null,
      g
    ), p._vnode = l, uo || (uo = !0, yr(N), Fs(), uo = !1);
  }, Ft = {
    p: V,
    um: rt,
    m: yt,
    r: lo,
    mt: ot,
    mc: U,
    pc: Fe,
    pbc: be,
    n: yn,
    o: e
  };
  return {
    render: pr,
    hydrate: void 0,
    createApp: yl(pr)
  };
}
function Eo({ type: e, props: t }, n) {
  return n === "svg" && e === "foreignObject" || n === "mathml" && e === "annotation-xml" && t && t.encoding && t.encoding.includes("html") ? void 0 : n;
}
function pt({ effect: e, job: t }, n) {
  n ? (e.flags |= 32, t.flags |= 4) : (e.flags &= -33, t.flags &= -5);
}
function Gl(e, t) {
  return (!e || e && !e.pendingBranch) && t && !t.persisted;
}
function Qt(e, t, n = !1) {
  const o = e.children, r = t.children;
  if (T(o) && T(r))
    for (let s = 0; s < o.length; s++) {
      const i = o[s];
      let c = r[s];
      c.shapeFlag & 1 && !c.dynamicChildren && ((c.patchFlag <= 0 || c.patchFlag === 32) && (c = r[s] = Je(r[s]), c.el = i.el), !n && c.patchFlag !== -2 && Qt(i, c)), c.type === _n && (c.patchFlag === -1 && (c = r[s] = Je(c)), c.el = i.el), c.type === Oe && !c.el && (c.el = i.el), process.env.NODE_ENV !== "production" && c.el && (c.el.__vnode = c);
    }
}
function ql(e) {
  const t = e.slice(), n = [0];
  let o, r, s, i, c;
  const u = e.length;
  for (o = 0; o < u; o++) {
    const d = e[o];
    if (d !== 0) {
      if (r = n[n.length - 1], e[r] < d) {
        t[o] = r, n.push(o);
        continue;
      }
      for (s = 0, i = n.length - 1; s < i; )
        c = s + i >> 1, e[n[c]] < d ? s = c + 1 : i = c;
      d < e[n[s]] && (s > 0 && (t[o] = n[s - 1]), n[s] = o);
    }
  }
  for (s = n.length, i = n[s - 1]; s-- > 0; )
    n[s] = i, i = t[i];
  return n;
}
function ai(e) {
  const t = e.subTree.component;
  if (t)
    return t.asyncDep && !t.asyncResolved ? t : ai(t);
}
function Hr(e) {
  if (e)
    for (let t = 0; t < e.length; t++)
      e[t].flags |= 8;
}
function pi(e) {
  if (e.placeholder)
    return e.placeholder;
  const t = e.component;
  return t ? pi(t.subTree) : null;
}
const di = (e) => e.__isSuspense;
function zl(e, t) {
  t && t.pendingBranch ? T(e) ? t.effects.push(...e) : t.effects.push(e) : Ls(e);
}
const we = /* @__PURE__ */ Symbol.for("v-fgt"), _n = /* @__PURE__ */ Symbol.for("v-txt"), Oe = /* @__PURE__ */ Symbol.for("v-cmt"), $n = /* @__PURE__ */ Symbol.for("v-stc"), en = [];
let ye = null;
function $e(e = !1) {
  en.push(ye = e ? null : []);
}
function Yl() {
  en.pop(), ye = en[en.length - 1] || null;
}
let sn = 1;
function kr(e, t = !1) {
  sn += e, e < 0 && ye && t && (ye.hasOnce = !0);
}
function hi(e) {
  return e.dynamicChildren = sn > 0 ? ye || $t : null, Yl(), sn > 0 && ye && ye.push(e), e;
}
function ct(e, t, n, o, r, s) {
  return hi(
    ue(
      e,
      t,
      n,
      o,
      r,
      s,
      !0
    )
  );
}
function Lo(e, t, n, o, r) {
  return hi(
    Ve(
      e,
      t,
      n,
      o,
      r,
      !0
    )
  );
}
function so(e) {
  return e ? e.__v_isVNode === !0 : !1;
}
function Ut(e, t) {
  if (process.env.NODE_ENV !== "production" && t.shapeFlag & 6 && e.component) {
    const n = Sn.get(t.type);
    if (n && n.has(e.component))
      return e.shapeFlag &= -257, t.shapeFlag &= -513, !1;
  }
  return e.type === t.type && e.key === t.key;
}
const Jl = (...e) => mi(
  ...e
), gi = ({ key: e }) => e ?? null, Pn = ({
  ref: e,
  ref_key: t,
  ref_for: n
}) => (typeof e == "number" && (e = "" + e), e != null ? X(e) || /* @__PURE__ */ te(e) || P(e) ? { i: he, r: e, k: t, f: !!n } : e : null);
function ue(e, t = null, n = null, o = 0, r = null, s = e === we ? 0 : 1, i = !1, c = !1) {
  const u = {
    __v_isVNode: !0,
    __v_skip: !0,
    type: e,
    props: t,
    key: t && gi(t),
    ref: t && Pn(t),
    scopeId: Ws,
    slotScopeIds: null,
    children: n,
    component: null,
    suspense: null,
    ssContent: null,
    ssFallback: null,
    dirs: null,
    transition: null,
    el: null,
    anchor: null,
    target: null,
    targetStart: null,
    targetAnchor: null,
    staticCount: 0,
    shapeFlag: s,
    patchFlag: o,
    dynamicProps: r,
    dynamicChildren: null,
    appContext: null,
    ctx: he
  };
  return c ? (Kn(u, n), s & 128 && e.normalize(u)) : n && (u.shapeFlag |= X(n) ? 8 : 16), process.env.NODE_ENV !== "production" && u.key !== u.key && b("VNode created with invalid key (NaN). VNode type:", u.type), sn > 0 && // avoid a block node from tracking itself
  !i && // has current parent block
  ye && // presence of a patch flag indicates this node needs patching on updates.
  // component nodes also should always be patched, because even if the
  // component doesn't need to update, it needs to persist the instance on to
  // the next vnode so that it can be properly unmounted later.
  (u.patchFlag > 0 || s & 6) && // the EVENTS flag is only for hydration and if it is the only flag, the
  // vnode should not be considered dynamic due to handler caching.
  u.patchFlag !== 32 && ye.push(u), u;
}
const Ve = process.env.NODE_ENV !== "production" ? Jl : mi;
function mi(e, t = null, n = null, o = 0, r = null, s = !1) {
  if ((!e || e === fl) && (process.env.NODE_ENV !== "production" && !e && b(`Invalid vnode type when creating vnode: ${e}.`), e = Oe), so(e)) {
    const c = ft(
      e,
      t,
      !0
      /* mergeRef: true */
    );
    return n && Kn(c, n), sn > 0 && !s && ye && (c.shapeFlag & 6 ? ye[ye.indexOf(e)] = c : ye.push(c)), c.patchFlag = -2, c;
  }
  if (bi(e) && (e = e.__vccOpts), t) {
    t = Xl(t);
    let { class: c, style: u } = t;
    c && !X(c) && (t.class = Yn(c)), G(u) && (/* @__PURE__ */ In(u) && !T(u) && (u = Z({}, u)), t.style = an(u));
  }
  const i = X(e) ? 1 : di(e) ? 128 : zc(e) ? 64 : G(e) ? 4 : P(e) ? 2 : 0;
  return process.env.NODE_ENV !== "production" && i & 4 && /* @__PURE__ */ In(e) && (e = /* @__PURE__ */ R(e), b(
    "Vue received a Component that was made a reactive object. This can lead to unnecessary performance overhead and should be avoided by marking the component with `markRaw` or using `shallowRef` instead of `ref`.",
    `
Component that was made reactive: `,
    e
  )), ue(
    e,
    t,
    n,
    o,
    r,
    i,
    s,
    !0
  );
}
function Xl(e) {
  return e ? /* @__PURE__ */ In(e) || si(e) ? Z({}, e) : e : null;
}
function ft(e, t, n = !1, o = !1) {
  const { props: r, ref: s, patchFlag: i, children: c, transition: u } = e, d = t ? Ql(r || {}, t) : r, a = {
    __v_isVNode: !0,
    __v_skip: !0,
    type: e.type,
    props: d,
    key: d && gi(d),
    ref: t && t.ref ? (
      // #2078 in the case of <component :is="vnode" ref="extra"/>
      // if the vnode itself already has a ref, cloneVNode will need to merge
      // the refs so the single vnode can be set on multiple refs
      n && s ? T(s) ? s.concat(Pn(t)) : [s, Pn(t)] : Pn(t)
    ) : s,
    scopeId: e.scopeId,
    slotScopeIds: e.slotScopeIds,
    children: process.env.NODE_ENV !== "production" && i === -1 && T(c) ? c.map(_i) : c,
    target: e.target,
    targetStart: e.targetStart,
    targetAnchor: e.targetAnchor,
    staticCount: e.staticCount,
    shapeFlag: e.shapeFlag,
    // if the vnode is cloned with extra props, we can no longer assume its
    // existing patch flag to be reliable and need to add the FULL_PROPS flag.
    // note: preserve flag for fragments since they use the flag for children
    // fast paths only.
    patchFlag: t && e.type !== we ? i === -1 ? 16 : i | 16 : i,
    dynamicProps: e.dynamicProps,
    dynamicChildren: e.dynamicChildren,
    appContext: e.appContext,
    dirs: e.dirs,
    transition: u,
    // These should technically only be non-null on mounted VNodes. However,
    // they *should* be copied for kept-alive vnodes. So we just always copy
    // them since them being non-null during a mount doesn't affect the logic as
    // they will simply be overwritten.
    component: e.component,
    suspense: e.suspense,
    ssContent: e.ssContent && ft(e.ssContent),
    ssFallback: e.ssFallback && ft(e.ssFallback),
    placeholder: e.placeholder,
    el: e.el,
    anchor: e.anchor,
    ctx: e.ctx,
    ce: e.ce
  };
  return u && o && nr(
    a,
    u.clone(a)
  ), a;
}
function _i(e) {
  const t = ft(e);
  return T(e.children) && (t.children = e.children.map(_i)), t;
}
function Zl(e = " ", t = 0) {
  return Ve(_n, null, e, t);
}
function Fo(e = "", t = !1) {
  return t ? ($e(), Lo(Oe, null, e)) : Ve(Oe, null, e);
}
function Se(e) {
  return e == null || typeof e == "boolean" ? Ve(Oe) : T(e) ? Ve(
    we,
    null,
    // #3666, avoid reference pollution when reusing vnode
    e.slice()
  ) : so(e) ? Je(e) : Ve(_n, null, String(e));
}
function Je(e) {
  return e.el === null && e.patchFlag !== -1 || e.memo ? e : ft(e);
}
function Kn(e, t) {
  let n = 0;
  const { shapeFlag: o } = e;
  if (t == null)
    t = null;
  else if (T(t))
    n = 16;
  else if (typeof t == "object")
    if (o & 65) {
      const r = t.default;
      r && (r._c && (r._d = !1), Kn(e, r()), r._c && (r._d = !0));
      return;
    } else {
      n = 32;
      const r = t._;
      !r && !si(t) ? t._ctx = he : r === 3 && he && (he.slots._ === 1 ? t._ = 1 : (t._ = 2, e.patchFlag |= 1024));
    }
  else if (P(t)) {
    if (o & 65) {
      Kn(e, { default: t });
      return;
    }
    t = { default: t, _ctx: he }, n = 32;
  } else
    t = String(t), o & 64 ? (n = 16, t = [Zl(t)]) : n = 8;
  e.children = t, e.shapeFlag |= n;
}
function Ql(...e) {
  const t = {};
  for (let n = 0; n < e.length; n++) {
    const o = e[n];
    for (const r in o)
      if (r === "class")
        t.class !== o.class && (t.class = Yn([t.class, o.class]));
      else if (r === "style")
        t.style = an([t.style, o.style]);
      else if (ln(r)) {
        const s = t[r], i = o[r];
        i && s !== i && !(T(s) && s.includes(i)) ? t[r] = s ? [].concat(s, i) : i : i == null && s == null && // mergeProps({ 'onUpdate:modelValue': undefined }) should not retain
        // the model listener.
        !tn(r) && (t[r] = i);
      } else r !== "" && (t[r] = o[r]);
  }
  return t;
}
function Ue(e, t, n, o = null) {
  Le(e, t, 7, [
    n,
    o
  ]);
}
const eu = Zs();
let tu = 0;
function nu(e, t, n) {
  const o = e.type, r = (t ? t.appContext : e.appContext) || eu, s = {
    uid: tu++,
    vnode: e,
    type: o,
    parent: t,
    appContext: r,
    root: null,
    // to be immediately set
    next: null,
    subTree: null,
    // will be set synchronously right after creation
    effect: null,
    update: null,
    // will be set synchronously right after creation
    job: null,
    scope: new Ki(
      !0
      /* detached */
    ),
    render: null,
    proxy: null,
    exposed: null,
    exposeProxy: null,
    withProxy: null,
    provides: t ? t.provides : Object.create(r.provides),
    ids: t ? t.ids : ["", 0, 0],
    accessCache: null,
    renderCache: [],
    // local resolved assets
    components: null,
    directives: null,
    // resolved props and emits options
    propsOptions: ci(o, r),
    emitsOptions: ei(o, r),
    // emit
    emit: null,
    // to be set immediately
    emitted: null,
    // props default value
    propsDefaults: k,
    // inheritAttrs
    inheritAttrs: o.inheritAttrs,
    // state
    ctx: k,
    data: k,
    props: k,
    attrs: k,
    slots: k,
    refs: k,
    setupState: k,
    setupContext: null,
    // suspense related
    suspense: n,
    suspenseId: n ? n.pendingId : 0,
    asyncDep: null,
    asyncResolved: !1,
    // lifecycle hooks
    // not using enums here because it results in computed properties
    isMounted: !1,
    isUnmounted: !1,
    isDeactivated: !1,
    bc: null,
    c: null,
    bm: null,
    m: null,
    bu: null,
    u: null,
    um: null,
    bum: null,
    da: null,
    a: null,
    rtg: null,
    rtc: null,
    ec: null,
    sp: null
  };
  return process.env.NODE_ENV !== "production" ? s.ctx = pl(s) : s.ctx = { _: s }, s.root = t ? t.root : s, s.emit = wl.bind(null, s), e.ce && e.ce(s), s;
}
let oe = null;
const lr = () => oe || he;
let Gn, jo;
{
  const e = fn(), t = (n, o) => {
    let r;
    return (r = e[n]) || (r = e[n] = []), r.push(o), (s) => {
      r.length > 1 ? r.forEach((i) => i(s)) : r[0](s);
    };
  };
  Gn = t(
    "__VUE_INSTANCE_SETTERS__",
    (n) => oe = n
  ), jo = t(
    "__VUE_SSR_SETTERS__",
    (n) => cn = n
  );
}
const vn = (e) => {
  const t = oe;
  return Gn(e), e.scope.on(), () => {
    e.scope.off(), Gn(t);
  };
}, Ur = () => {
  oe && oe.scope.off(), Gn(null);
}, ou = /* @__PURE__ */ tt("slot,component");
function Ho(e, { isNativeTag: t }) {
  (ou(e) || t(e)) && b(
    "Do not use built-in or reserved HTML elements as component id: " + e
  );
}
function vi(e) {
  return e.vnode.shapeFlag & 4;
}
let cn = !1;
function ru(e, t = !1, n = !1) {
  t && jo(t);
  const { props: o, children: r } = e.vnode, s = vi(e);
  Tl(e, o, s, t), kl(e, r, n || t);
  const i = s ? su(e, t) : void 0;
  return t && jo(!1), i;
}
function su(e, t) {
  const n = e.type;
  if (process.env.NODE_ENV !== "production") {
    if (n.name && Ho(n.name, e.appContext.config), n.components) {
      const r = Object.keys(n.components);
      for (let s = 0; s < r.length; s++)
        Ho(r[s], e.appContext.config);
    }
    if (n.directives) {
      const r = Object.keys(n.directives);
      for (let s = 0; s < r.length; s++)
        Bs(r[s]);
    }
    n.compilerOptions && iu() && b(
      '"compilerOptions" is only supported when using a build of Vue that includes the runtime compiler. Since you are using a runtime-only build, the options should be passed via your build tool config instead.'
    );
  }
  e.accessCache = /* @__PURE__ */ Object.create(null), e.proxy = new Proxy(e.ctx, Ys), process.env.NODE_ENV !== "production" && dl(e);
  const { setup: o } = n;
  if (o) {
    xe();
    const r = e.setupContext = o.length > 1 ? lu(e) : null, s = vn(e), i = It(
      o,
      e,
      0,
      [
        process.env.NODE_ENV !== "production" ? /* @__PURE__ */ Ge(e.props) : e.props,
        r
      ]
    ), c = Bo(i);
    if (De(), s(), (c || e.sp) && !Zt(e) && qs(e), c) {
      if (i.then(Ur, Ur), t)
        return i.then((u) => {
          Wr(e, u, t);
        }).catch((u) => {
          dn(u, e, 0);
        });
      if (e.asyncDep = i, process.env.NODE_ENV !== "production" && !e.suspense) {
        const u = En(e, n);
        b(
          `Component <${u}>: setup function returned a promise, but no <Suspense> boundary was found in the parent component tree. A component with async setup() must be nested in a <Suspense> in order to be rendered.`
        );
      }
    } else
      Wr(e, i, t);
  } else
    Ei(e, t);
}
function Wr(e, t, n) {
  P(t) ? e.type.__ssrInlineRender ? e.ssrRender = t : e.render = t : G(t) ? (process.env.NODE_ENV !== "production" && so(t) && b(
    "setup() should not return VNodes directly - return a render function instead."
  ), process.env.NODE_ENV !== "production" && (e.devtoolsRawSetupState = t), e.setupState = As(t), process.env.NODE_ENV !== "production" && hl(e)) : process.env.NODE_ENV !== "production" && t !== void 0 && b(
    `setup() should return an object. Received: ${t === null ? "null" : typeof t}`
  ), Ei(e, n);
}
const iu = () => !0;
function Ei(e, t, n) {
  const o = e.type;
  e.render || (e.render = o.render || se);
  {
    const r = vn(e);
    xe();
    try {
      ml(e);
    } finally {
      De(), r();
    }
  }
  process.env.NODE_ENV !== "production" && !o.render && e.render === se && !t && (o.template ? b(
    'Component provided template option but runtime compilation is not supported in this build of Vue. Configure your bundler to alias "vue" to "vue/dist/vue.esm-bundler.js".'
  ) : b("Component is missing template or render function: ", o));
}
const Br = process.env.NODE_ENV !== "production" ? {
  get(e, t) {
    return Wn(), re(e, "get", ""), e[t];
  },
  set() {
    return b("setupContext.attrs is readonly."), !1;
  },
  deleteProperty() {
    return b("setupContext.attrs is readonly."), !1;
  }
} : {
  get(e, t) {
    return re(e, "get", ""), e[t];
  }
};
function cu(e) {
  return new Proxy(e.slots, {
    get(t, n) {
      return re(e, "get", "$slots"), t[n];
    }
  });
}
function lu(e) {
  const t = (n) => {
    if (process.env.NODE_ENV !== "production" && (e.exposed && b("expose() should be called only once per setup()."), n != null)) {
      let o = typeof n;
      o === "object" && (T(n) ? o = "array" : /* @__PURE__ */ te(n) && (o = "ref")), o !== "object" && b(
        `expose() should be passed a plain object, received ${o}.`
      );
    }
    e.exposed = n || {};
  };
  if (process.env.NODE_ENV !== "production") {
    let n, o;
    return Object.freeze({
      get attrs() {
        return n || (n = new Proxy(e.attrs, Br));
      },
      get slots() {
        return o || (o = cu(e));
      },
      get emit() {
        return (r, ...s) => e.emit(r, ...s);
      },
      expose: t
    });
  } else
    return {
      attrs: new Proxy(e.attrs, Br),
      slots: e.slots,
      emit: e.emit,
      expose: t
    };
}
function io(e) {
  return e.exposed ? e.exposeProxy || (e.exposeProxy = new Proxy(As(ac(e.exposed)), {
    get(t, n) {
      if (n in t)
        return t[n];
      if (n in vt)
        return vt[n](e);
    },
    has(t, n) {
      return n in t || n in vt;
    }
  })) : e.proxy;
}
const uu = /(?:^|[-_])\w/g, fu = (e) => e.replace(uu, (t) => t.toUpperCase()).replace(/[-_]/g, "");
function Ni(e, t = !0) {
  return P(e) ? e.displayName || e.name : e.name || t && e.__name;
}
function En(e, t, n = !1) {
  let o = Ni(t);
  if (!o && t.__file) {
    const r = t.__file.match(/([^/\\]+)\.\w+$/);
    r && (o = r[1]);
  }
  if (!o && e) {
    const r = (s) => {
      for (const i in s)
        if (s[i] === t)
          return i;
    };
    o = r(e.components) || e.parent && r(
      e.parent.type.components
    ) || r(e.appContext.components);
  }
  return o ? fu(o) : n ? "App" : "Anonymous";
}
function bi(e) {
  return P(e) && "__vccOpts" in e;
}
const ur = (e, t) => {
  const n = /* @__PURE__ */ _c(e, t, cn);
  if (process.env.NODE_ENV !== "production") {
    const o = lr();
    o && o.appContext.config.warnRecursiveComputed && (n._warnRecursive = !0);
  }
  return n;
};
function au() {
  if (process.env.NODE_ENV === "production" || typeof window > "u")
    return;
  const e = { style: "color:#3ba776" }, t = { style: "color:#1677ff" }, n = { style: "color:#f5222d" }, o = { style: "color:#eb2f96" }, r = {
    __vue_custom_formatter: !0,
    header(f) {
      if (!G(f))
        return null;
      if (f.__isVue)
        return ["div", e, "VueInstance"];
      if (/* @__PURE__ */ te(f)) {
        xe();
        const h = f.value;
        return De(), [
          "div",
          {},
          ["span", e, a(f)],
          "<",
          c(h),
          ">"
        ];
      } else {
        if (/* @__PURE__ */ lt(f))
          return [
            "div",
            {},
            ["span", e, /* @__PURE__ */ me(f) ? "ShallowReactive" : "Reactive"],
            "<",
            c(f),
            `>${/* @__PURE__ */ Ie(f) ? " (readonly)" : ""}`
          ];
        if (/* @__PURE__ */ Ie(f))
          return [
            "div",
            {},
            ["span", e, /* @__PURE__ */ me(f) ? "ShallowReadonly" : "Readonly"],
            "<",
            c(f),
            ">"
          ];
      }
      return null;
    },
    hasBody(f) {
      return f && f.__isVue;
    },
    body(f) {
      if (f && f.__isVue)
        return [
          "div",
          {},
          ...s(f.$)
        ];
    }
  };
  function s(f) {
    const h = [];
    f.type.props && f.props && h.push(i("props", /* @__PURE__ */ R(f.props))), f.setupState !== k && h.push(i("setup", f.setupState)), f.data !== k && h.push(i("data", /* @__PURE__ */ R(f.data)));
    const E = u(f, "computed");
    E && h.push(i("computed", E));
    const D = u(f, "inject");
    return D && h.push(i("injected", D)), h.push([
      "div",
      {},
      [
        "span",
        {
          style: o.style + ";opacity:0.66"
        },
        "$ (internal): "
      ],
      ["object", { object: f }]
    ]), h;
  }
  function i(f, h) {
    return h = Z({}, h), Object.keys(h).length ? [
      "div",
      { style: "line-height:1.25em;margin-bottom:0.6em" },
      [
        "div",
        {
          style: "color:#476582"
        },
        f
      ],
      [
        "div",
        {
          style: "padding-left:1.25em"
        },
        ...Object.keys(h).map((E) => [
          "div",
          {},
          ["span", o, E + ": "],
          c(h[E], !1)
        ])
      ]
    ] : ["span", {}];
  }
  function c(f, h = !0) {
    return typeof f == "number" ? ["span", t, f] : typeof f == "string" ? ["span", n, JSON.stringify(f)] : typeof f == "boolean" ? ["span", o, f] : G(f) ? ["object", { object: h ? /* @__PURE__ */ R(f) : f }] : ["span", n, String(f)];
  }
  function u(f, h) {
    const E = f.type;
    if (P(E))
      return;
    const D = {};
    for (const V in f.ctx)
      d(E, V, h) && (D[V] = f.ctx[V]);
    return D;
  }
  function d(f, h, E) {
    const D = f[E];
    if (T(D) && D.includes(h) || G(D) && h in D || f.extends && d(f.extends, h, E) || f.mixins && f.mixins.some((V) => d(V, h, E)))
      return !0;
  }
  function a(f) {
    return /* @__PURE__ */ me(f) ? "ShallowRef" : f.effect ? "ComputedRef" : "Ref";
  }
  window.devtoolsFormatters ? window.devtoolsFormatters.push(r) : window.devtoolsFormatters = [r];
}
const Kr = "3.5.39", Qe = process.env.NODE_ENV !== "production" ? b : se;
process.env.NODE_ENV;
process.env.NODE_ENV;
/**
* @vue/runtime-dom v3.5.39
* (c) 2018-present Yuxi (Evan) You and Vue contributors
* @license MIT
**/
let ko;
const Gr = typeof window < "u" && window.trustedTypes;
if (Gr)
  try {
    ko = /* @__PURE__ */ Gr.createPolicy("vue", {
      createHTML: (e) => e
    });
  } catch (e) {
    process.env.NODE_ENV !== "production" && Qe(`Error creating trusted types policy: ${e}`);
  }
const yi = ko ? (e) => ko.createHTML(e) : (e) => e, pu = "http://www.w3.org/2000/svg", du = "http://www.w3.org/1998/Math/MathML", ze = typeof document < "u" ? document : null, qr = ze && /* @__PURE__ */ ze.createElement("template"), hu = {
  insert: (e, t, n) => {
    t.insertBefore(e, n || null);
  },
  remove: (e) => {
    const t = e.parentNode;
    t && t.removeChild(e);
  },
  createElement: (e, t, n, o) => {
    const r = t === "svg" ? ze.createElementNS(pu, e) : t === "mathml" ? ze.createElementNS(du, e) : n ? ze.createElement(e, { is: n }) : ze.createElement(e);
    return e === "select" && o && o.multiple != null && r.setAttribute("multiple", o.multiple), r;
  },
  createText: (e) => ze.createTextNode(e),
  createComment: (e) => ze.createComment(e),
  setText: (e, t) => {
    e.nodeValue = t;
  },
  setElementText: (e, t) => {
    e.textContent = t;
  },
  parentNode: (e) => e.parentNode,
  nextSibling: (e) => e.nextSibling,
  querySelector: (e) => ze.querySelector(e),
  setScopeId(e, t) {
    e.setAttribute(t, "");
  },
  // __UNSAFE__
  // Reason: innerHTML.
  // Static content here can only come from compiled templates.
  // As long as the user only uses trusted templates, this is safe.
  insertStaticContent(e, t, n, o, r, s) {
    const i = n ? n.previousSibling : t.lastChild;
    if (r && (r === s || r.nextSibling))
      for (; t.insertBefore(r.cloneNode(!0), n), !(r === s || !(r = r.nextSibling)); )
        ;
    else {
      qr.innerHTML = yi(
        o === "svg" ? `<svg>${e}</svg>` : o === "mathml" ? `<math>${e}</math>` : e
      );
      const c = qr.content;
      if (o === "svg" || o === "mathml") {
        const u = c.firstChild;
        for (; u.firstChild; )
          c.appendChild(u.firstChild);
        c.removeChild(u);
      }
      t.insertBefore(c, n);
    }
    return [
      // first
      i ? i.nextSibling : t.firstChild,
      // last
      n ? n.previousSibling : t.lastChild
    ];
  }
}, gu = /* @__PURE__ */ Symbol("_vtc");
function mu(e, t, n) {
  const o = e[gu];
  o && (t = (t ? [t, ...o] : [...o]).join(" ")), t == null ? e.removeAttribute("class") : n ? e.setAttribute("class", t) : e.className = t;
}
const zr = /* @__PURE__ */ Symbol("_vod"), _u = /* @__PURE__ */ Symbol("_vsh"), vu = /* @__PURE__ */ Symbol(process.env.NODE_ENV !== "production" ? "CSS_VAR_TEXT" : ""), Eu = /(?:^|;)\s*display\s*:/;
function Nu(e, t, n) {
  const o = e.style, r = X(n);
  let s = !1;
  if (n && !r) {
    if (t)
      if (X(t))
        for (const i of t.split(";")) {
          const c = i.slice(0, i.indexOf(":")).trim();
          n[c] == null && Gt(o, c, "");
        }
      else
        for (const i in t)
          n[i] == null && Gt(o, i, "");
    for (const i in n) {
      i === "display" && (s = !0);
      const c = n[i];
      c != null ? Ou(
        e,
        i,
        !X(t) && t ? t[i] : void 0,
        c
      ) || Gt(o, i, c) : Gt(o, i, "");
    }
  } else if (r) {
    if (t !== n) {
      const i = o[vu];
      i && (n += ";" + i), o.cssText = n, s = Eu.test(n);
    }
  } else t && e.removeAttribute("style");
  zr in e && (e[zr] = s ? o.display : "", e[_u] && (o.display = "none"));
}
const bu = /[^\\];\s*$/, Yr = /\s*!important$/;
function Gt(e, t, n) {
  if (T(n))
    n.forEach((o) => Gt(e, t, o));
  else if (n == null && (n = ""), process.env.NODE_ENV !== "production" && bu.test(n) && Qe(
    `Unexpected semicolon at the end of '${t}' style value: '${n}'`
  ), t.startsWith("--"))
    e.setProperty(t, n);
  else {
    const o = yu(e, t);
    Yr.test(n) ? e.setProperty(
      et(o),
      n.replace(Yr, ""),
      "important"
    ) : e[o] = n;
  }
}
const Jr = ["Webkit", "Moz", "ms"], No = {};
function yu(e, t) {
  const n = No[t];
  if (n)
    return n;
  let o = ge(t);
  if (o !== "filter" && o in e)
    return No[t] = o;
  o = zn(o);
  for (let r = 0; r < Jr.length; r++) {
    const s = Jr[r] + o;
    if (s in e)
      return No[t] = s;
  }
  return t;
}
function Ou(e, t, n, o) {
  return e.tagName === "TEXTAREA" && (t === "width" || t === "height") && X(o) && n === o;
}
const Xr = "http://www.w3.org/1999/xlink";
function Zr(e, t, n, o, r, s = Wi(t)) {
  o && t.startsWith("xlink:") ? n == null ? e.removeAttributeNS(Xr, t.slice(6, t.length)) : e.setAttributeNS(Xr, t, n) : n == null || s && !ds(n) ? e.removeAttribute(t) : e.setAttribute(
    t,
    s ? "" : Ae(n) ? String(n) : n
  );
}
function Qr(e, t, n, o, r) {
  if (t === "innerHTML" || t === "textContent") {
    n != null && (e[t] = t === "innerHTML" ? yi(n) : n);
    return;
  }
  const s = e.tagName;
  if (t === "value" && s !== "PROGRESS" && // custom elements may use _value internally
  !s.includes("-")) {
    const c = s === "OPTION" ? e.getAttribute("value") || "" : e.value, u = n == null ? (
      // #11647: value should be set as empty string for null and undefined,
      // but <input type="checkbox"> should be set as 'on'.
      e.type === "checkbox" ? "on" : ""
    ) : String(n);
    (c !== u || !("_value" in e)) && (e.value = u), n == null && e.removeAttribute(t), e._value = n;
    return;
  }
  let i = !1;
  if (n === "" || n == null) {
    const c = typeof e[t];
    c === "boolean" ? n = ds(n) : n == null && c === "string" ? (n = "", i = !0) : c === "number" && (n = 0, i = !0);
  }
  try {
    e[t] = n;
  } catch (c) {
    process.env.NODE_ENV !== "production" && !i && Qe(
      `Failed setting prop "${t}" on <${s.toLowerCase()}>: value ${n} is invalid.`,
      c
    );
  }
  i && e.removeAttribute(r || t);
}
function Ct(e, t, n, o) {
  e.addEventListener(t, n, o);
}
function wu(e, t, n, o) {
  e.removeEventListener(t, n, o);
}
const es = /* @__PURE__ */ Symbol("_vei");
function Vu(e, t, n, o, r = null) {
  const s = e[es] || (e[es] = {}), i = s[t];
  if (o && i)
    i.value = process.env.NODE_ENV !== "production" ? ts(o, t) : o;
  else {
    const [c, u] = Cu(t);
    if (o) {
      const d = s[t] = $u(
        process.env.NODE_ENV !== "production" ? ts(o, t) : o,
        r
      );
      Ct(e, c, d, u);
    } else i && (wu(e, c, i, u), s[t] = void 0);
  }
}
const xu = /(Once|Passive|Capture)$/, Du = /^on:?(?:Once|Passive|Capture)$/;
function Cu(e) {
  let t, n;
  for (; (n = e.match(xu)) && !Du.test(e); )
    t || (t = {}), e = e.slice(0, e.length - n[1].length), t[n[1].toLowerCase()] = !0;
  return [e[2] === ":" ? e.slice(3) : et(e.slice(2)), t];
}
let bo = 0;
const Su = /* @__PURE__ */ Promise.resolve(), Tu = () => bo || (Su.then(() => bo = 0), bo = Date.now());
function $u(e, t) {
  const n = (o) => {
    if (!o._vts)
      o._vts = Date.now();
    else if (o._vts <= n.attached)
      return;
    const r = n.value;
    if (T(r)) {
      const s = o.stopImmediatePropagation;
      o.stopImmediatePropagation = () => {
        s.call(o), o._stopped = !0;
      };
      const i = r.slice(), c = [o];
      for (let u = 0; u < i.length && !o._stopped; u++) {
        const d = i[u];
        d && Le(
          d,
          t,
          5,
          c
        );
      }
    } else
      Le(
        r,
        t,
        5,
        [o]
      );
  };
  return n.value = e, n.attached = Tu(), n;
}
function ts(e, t) {
  return P(e) || T(e) ? e : (Qe(
    `Wrong type passed as event handler to ${t} - did you forget @ or : in front of your prop?
Expected function or array of functions, received type ${typeof e}.`
  ), se);
}
const ns = (e) => e.charCodeAt(0) === 111 && e.charCodeAt(1) === 110 && // lowercase letter
e.charCodeAt(2) > 96 && e.charCodeAt(2) < 123, Pu = (e, t, n, o, r, s) => {
  const i = r === "svg";
  t === "class" ? mu(e, o, i) : t === "style" ? Nu(e, n, o) : ln(t) ? tn(t) || Vu(e, t, n, o, s) : (t[0] === "." ? (t = t.slice(1), !0) : t[0] === "^" ? (t = t.slice(1), !1) : Au(e, t, o, i)) ? (Qr(e, t, o), !e.tagName.includes("-") && (t === "value" || t === "checked" || t === "selected") && Zr(e, t, o, i, s, t !== "value")) : /* #11081 force set props for possible async custom element */ e._isVueCE && // #12408 check if it's declared prop or it's async custom element
  (Mu(e, t) || // @ts-expect-error _def is private
  e._def.__asyncLoader && (/[A-Z]/.test(t) || !X(o))) ? Qr(e, ge(t), o, s, t) : (t === "true-value" ? e._trueValue = o : t === "false-value" && (e._falseValue = o), Zr(e, t, o, i));
};
function Au(e, t, n, o) {
  if (o)
    return !!(t === "innerHTML" || t === "textContent" || t in e && ns(t) && P(n));
  if (t === "spellcheck" || t === "draggable" || t === "translate" || t === "autocorrect" || t === "sandbox" && e.tagName === "IFRAME" || t === "form" || t === "list" && e.tagName === "INPUT" || t === "type" && e.tagName === "TEXTAREA")
    return !1;
  if (t === "width" || t === "height") {
    const r = e.tagName;
    if (r === "IMG" || r === "VIDEO" || r === "CANVAS" || r === "SOURCE")
      return !1;
  }
  return ns(t) && X(n) ? !1 : t in e;
}
function Mu(e, t) {
  const n = (
    // @ts-expect-error _def is private
    e._def.props
  );
  if (!n)
    return !1;
  const o = ge(t);
  return Array.isArray(n) ? n.some((r) => ge(r) === o) : Object.keys(n).some((r) => ge(r) === o);
}
const os = (e) => {
  const t = e.props["onUpdate:modelValue"] || !1;
  return T(t) ? (n) => xt(t, n) : t;
};
function Iu(e) {
  e.target.composing = !0;
}
function rs(e) {
  const t = e.target;
  t.composing && (t.composing = !1, t.dispatchEvent(new Event("input")));
}
const yo = /* @__PURE__ */ Symbol("_assign");
function ss(e, t, n) {
  return t && (e = e.trim()), n && (e = qo(e)), e;
}
const Ru = {
  created(e, { modifiers: { lazy: t, trim: n, number: o } }, r) {
    e[yo] = os(r);
    const s = o || r.props && r.props.type === "number";
    Ct(e, t ? "change" : "input", (i) => {
      i.target.composing || e[yo](ss(e.value, n, s));
    }), (n || s) && Ct(e, "change", () => {
      e.value = ss(e.value, n, s);
    }), t || (Ct(e, "compositionstart", Iu), Ct(e, "compositionend", rs), Ct(e, "change", rs));
  },
  // set value on mounted so it's after min/max for type="range"
  mounted(e, { value: t }) {
    e.value = t ?? "";
  },
  beforeUpdate(e, { value: t, oldValue: n, modifiers: { lazy: o, trim: r, number: s } }, i) {
    if (e[yo] = os(i), e.composing) return;
    const c = (s || e.type === "number") && !/^0\d/.test(e.value) ? qo(e.value) : e.value, u = t ?? "";
    if (c === u)
      return;
    const d = e.getRootNode();
    (d instanceof Document || d instanceof ShadowRoot) && d.activeElement === e && e.type !== "range" && (o && t === n || r && e.value.trim() === u) || (e.value = u);
  }
}, Lu = /* @__PURE__ */ Z({ patchProp: Pu }, hu);
let is;
function Fu() {
  return is || (is = Bl(Lu));
}
const ju = ((...e) => {
  const t = Fu().createApp(...e);
  process.env.NODE_ENV !== "production" && (ku(t), Uu(t));
  const { mount: n } = t;
  return t.mount = (o) => {
    const r = Wu(o);
    if (!r) return;
    const s = t._component;
    !P(s) && !s.render && !s.template && (s.template = r.innerHTML), r.nodeType === 1 && (r.textContent = "");
    const i = n(r, !1, Hu(r));
    return r instanceof Element && (r.removeAttribute("v-cloak"), r.setAttribute("data-v-app", "")), i;
  }, t;
});
function Hu(e) {
  if (e instanceof SVGElement)
    return "svg";
  if (typeof MathMLElement == "function" && e instanceof MathMLElement)
    return "mathml";
}
function ku(e) {
  Object.defineProperty(e.config, "isNativeTag", {
    value: (t) => ji(t) || Hi(t) || ki(t),
    writable: !1
  });
}
function Uu(e) {
  {
    const t = e.config.isCustomElement;
    Object.defineProperty(e.config, "isCustomElement", {
      get() {
        return t;
      },
      set() {
        Qe(
          "The `isCustomElement` config option is deprecated. Use `compilerOptions.isCustomElement` instead."
        );
      }
    });
    const n = e.config.compilerOptions, o = 'The `compilerOptions` config option is only respected when using a build of Vue.js that includes the runtime compiler (aka "full build"). Since you are using the runtime-only build, `compilerOptions` must be passed to `@vue/compiler-dom` in the build setup instead.\n- For vue-loader: pass it via vue-loader\'s `compilerOptions` loader option.\n- For vue-cli: see https://cli.vuejs.org/guide/webpack.html#modifying-options-of-a-loader\n- For vite: pass it via @vitejs/plugin-vue options. See https://github.com/vitejs/vite-plugin-vue/tree/main/packages/plugin-vue#example-for-passing-options-to-vuecompiler-sfc';
    Object.defineProperty(e.config, "compilerOptions", {
      get() {
        return Qe(o), n;
      },
      set() {
        Qe(o);
      }
    });
  }
}
function Wu(e) {
  if (X(e)) {
    const t = document.querySelector(e);
    return process.env.NODE_ENV !== "production" && !t && Qe(
      `Failed to mount app: mount target selector "${e}" returned null.`
    ), t;
  }
  return process.env.NODE_ENV !== "production" && window.ShadowRoot && e instanceof window.ShadowRoot && e.mode === "closed" && Qe(
    'mounting on a ShadowRoot with `{mode: "closed"}` may lead to unpredictable bugs'
  ), e;
}
/**
* vue v3.5.39
* (c) 2018-present Yuxi (Evan) You and Vue contributors
* @license MIT
**/
function Bu() {
  au();
}
process.env.NODE_ENV !== "production" && Bu();
const Ku = {
  class: "cog-target",
  "aria-live": "polite"
}, Gu = /* @__PURE__ */ gn({
  __name: "HingeCog",
  props: {
    open: { type: Boolean },
    cogStyle: {},
    targetLabel: {}
  },
  emits: ["pointerdown", "pointermove", "pointerup", "pointercancel", "contextmenu"],
  setup(e) {
    return (t, n) => ($e(), ct("div", {
      class: "cog-wrap",
      style: an(e.cogStyle)
    }, [
      ue("div", {
        class: Yn(["cog-icon", { "cog-icon--open": e.open }]),
        onPointerdown: n[0] || (n[0] = (o) => t.$emit("pointerdown", o)),
        onPointermove: n[1] || (n[1] = (o) => t.$emit("pointermove", o)),
        onPointerup: n[2] || (n[2] = (o) => t.$emit("pointerup", o)),
        onPointercancel: n[3] || (n[3] = (o) => t.$emit("pointercancel", o)),
        onContextmenu: n[4] || (n[4] = (o) => t.$emit("contextmenu", o))
      }, " ⚙️ ", 34),
      ue("div", Ku, Tt(e.targetLabel), 1)
    ], 4));
  }
}), Nn = (e, t) => {
  const n = e.__vccOpts || e;
  for (const [o, r] of t)
    n[o] = r;
  return n;
}, qu = /* @__PURE__ */ Nn(Gu, [["__scopeId", "data-v-e377029b"]]), zu = /* @__PURE__ */ gn({
  __name: "HingeHighlight",
  props: {
    rect: {}
  },
  setup(e) {
    const t = e, n = ur(() => {
      const { rect: o } = t;
      return o ? {
        top: `${o.top}px`,
        left: `${o.left}px`,
        width: `${o.width}px`,
        height: `${o.height}px`
      } : { display: "none" };
    });
    return (o, r) => ($e(), ct("div", {
      class: "hinge-highlight",
      style: an(n.value)
    }, null, 4));
  }
}), Yu = /* @__PURE__ */ Nn(zu, [["__scopeId", "data-v-198af5a9"]]), Ju = { class: "attention" }, Xu = { class: "attention__row" }, Zu = { class: "attention__name" }, Qu = {
  key: 0,
  class: "attention__row"
}, ef = { class: "attention__dom" }, tf = {
  key: 1,
  class: "attention__props"
}, nf = /* @__PURE__ */ gn({
  __name: "HingeAttention",
  props: {
    target: {}
  },
  setup(e) {
    function t(n) {
      if (typeof n == "string") return n;
      try {
        return JSON.stringify(n);
      } catch {
        return String(n);
      }
    }
    return (n, o) => ($e(), ct("div", Ju, [
      ue("div", Xu, [
        o[0] || (o[0] = ue("span", { class: "attention__label" }, "Component", -1)),
        ue("span", Zu, Tt(e.target.component), 1)
      ]),
      e.target.dom && e.target.dom !== e.target.component ? ($e(), ct("div", Qu, [
        o[1] || (o[1] = ue("span", { class: "attention__label" }, "DOM", -1)),
        ue("span", ef, Tt(e.target.dom), 1)
      ])) : Fo("", !0),
      Object.keys(e.target.props).length ? ($e(), ct("dl", tf, [
        ($e(!0), ct(we, null, al(e.target.props, (r, s) => ($e(), ct(we, { key: s }, [
          ue("dt", null, Tt(s), 1),
          ue("dd", null, Tt(t(r)), 1)
        ], 64))), 128))
      ])) : Fo("", !0)
    ]));
  }
}), of = /* @__PURE__ */ Nn(nf, [["__scopeId", "data-v-c6f5cddc"]]), rf = { class: "panel" }, sf = { class: "actions" }, cf = /* @__PURE__ */ gn({
  __name: "HingePanel",
  props: /* @__PURE__ */ Tr({
    target: {}
  }, {
    modelValue: { required: !0 },
    modelModifiers: {}
  }),
  emits: /* @__PURE__ */ Tr(["send", "close"], ["update:modelValue"]),
  setup(e) {
    const t = Ol(e, "modelValue");
    return (n, o) => ($e(), ct("div", rf, [
      Ve(of, { target: e.target }, null, 8, ["target"]),
      kc(ue("textarea", {
        "onUpdate:modelValue": o[0] || (o[0] = (r) => t.value = r),
        placeholder: "Enter queue info..."
      }, null, 512), [
        [Ru, t.value]
      ]),
      ue("div", sf, [
        ue("button", {
          type: "button",
          onClick: o[1] || (o[1] = (r) => n.$emit("send"))
        }, "Send"),
        ue("button", {
          type: "button",
          onClick: o[2] || (o[2] = (r) => n.$emit("close"))
        }, "Close")
      ])
    ]));
  }
}), lf = /* @__PURE__ */ Nn(cf, [["__scopeId", "data-v-60e0425e"]]), Uo = 40, uf = 6, ff = 500, af = "hinge-app";
function pf({
  position: e,
  clampPosition: t,
  onTap: n,
  onPanelToggle: o,
  onMove: r
}) {
  const s = /* @__PURE__ */ pn({
    active: !1,
    moved: !1,
    offsetX: 0,
    offsetY: 0,
    startX: 0,
    startY: 0,
    longPressTriggered: !1,
    longPressTimer: null
  });
  function i() {
    s.longPressTimer && (clearTimeout(s.longPressTimer), s.longPressTimer = null);
  }
  function c(f) {
    const h = f.currentTarget;
    h && (s.active = !0, s.moved = !1, s.longPressTriggered = !1, s.startX = f.clientX, s.startY = f.clientY, s.offsetX = f.clientX - e.x, s.offsetY = f.clientY - e.y, h.setPointerCapture(f.pointerId), i(), s.longPressTimer = setTimeout(() => {
      s.longPressTriggered = !0, o();
    }, ff));
  }
  function u(f) {
    if (!s.active) return;
    const h = f.clientX - s.startX, E = f.clientY - s.startY;
    if (!s.moved) {
      if (Math.hypot(h, E) < uf) {
        r == null || r();
        return;
      }
      i(), s.moved = !0;
    }
    e.x = f.clientX - s.offsetX, e.y = f.clientY - s.offsetY, t(), r == null || r();
  }
  function d(f) {
    if (!s.active) return;
    const h = f.currentTarget;
    s.active = !1, i(), h != null && h.hasPointerCapture(f.pointerId) && h.releasePointerCapture(f.pointerId), !(s.longPressTriggered || s.moved) && n();
  }
  function a(f) {
    f.preventDefault(), i(), s.longPressTriggered = !0, o();
  }
  return {
    onCogPointerDown: c,
    onCogPointerMove: u,
    onCogPointerUp: d,
    onCogContextMenu: a
  };
}
function df() {
  const e = window.visualViewport;
  return {
    width: (e == null ? void 0 : e.width) ?? window.innerWidth,
    height: (e == null ? void 0 : e.height) ?? window.innerHeight
  };
}
function hf() {
  const e = /* @__PURE__ */ pn({ x: 20, y: 20 }), t = ur(() => ({
    transform: `translate3d(${e.x}px, ${e.y}px, 0)`
  }));
  function n() {
    const { width: o, height: r } = df(), s = Math.max(0, o - Uo), i = Math.max(0, r - Uo);
    e.x = Math.min(Math.max(0, e.x), s), e.y = Math.min(Math.max(0, e.y), i);
  }
  return oo(() => {
    var o, r;
    n(), window.addEventListener("resize", n), (o = window.visualViewport) == null || o.addEventListener("resize", n), (r = window.visualViewport) == null || r.addEventListener("scroll", n);
  }), mn(() => {
    var o, r;
    window.removeEventListener("resize", n), (o = window.visualViewport) == null || o.removeEventListener("resize", n), (r = window.visualViewport) == null || r.removeEventListener("scroll", n);
  }), { position: e, cogStyle: t, clampPosition: n };
}
function gf(e) {
  const t = /* @__PURE__ */ ut(null);
  function n() {
    const o = e.value;
    if (!o || !o.isConnected) {
      t.value = null;
      return;
    }
    t.value = o.getBoundingClientRect();
  }
  return Jt(e, n, { flush: "sync" }), oo(() => {
    var o, r;
    n(), window.addEventListener("resize", n), window.addEventListener("scroll", n, !0), (o = window.visualViewport) == null || o.addEventListener("resize", n), (r = window.visualViewport) == null || r.addEventListener("scroll", n);
  }), mn(() => {
    var o, r;
    window.removeEventListener("resize", n), window.removeEventListener("scroll", n, !0), (o = window.visualViewport) == null || o.removeEventListener("resize", n), (r = window.visualViewport) == null || r.removeEventListener("scroll", n);
  }), { rect: t, update: n };
}
const mf = [
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
], cs = 6e3;
function _f(e) {
  if (!e || !e.isConnected) return null;
  const t = e.getBoundingClientRect(), n = Ef(e);
  return {
    html: vf(e),
    styles: n,
    rect: {
      top: Math.round(t.top),
      left: Math.round(t.left),
      width: Math.round(t.width),
      height: Math.round(t.height)
    }
  };
}
function vf(e) {
  let t = e.outerHTML;
  return t = t.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ""), t.length <= cs ? t : `${t.slice(0, cs)}
<!-- hinge: truncated -->`;
}
function Ef(e) {
  if (!(e instanceof HTMLElement))
    return {};
  const t = window.getComputedStyle(e), n = {};
  for (const o of mf) {
    const r = t[o];
    typeof r == "string" && r.length > 0 && (n[o] = r);
  }
  return n;
}
function Nf({ getTarget: e, getElement: t }) {
  const n = /* @__PURE__ */ ut("");
  async function o(r) {
    const s = e(), i = _f(t()), c = {
      note: n.value,
      url: window.location.href,
      component: s.component,
      dom: s.dom,
      props: s.props
    };
    i && (c.elementHtml = i.html, c.computedStyles = i.styles, c.elementRect = i.rect), await fetch("/api/queue", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(c)
    }), n.value = "", r == null || r();
  }
  return { note: n, sendNote: o };
}
const ls = {
  component: "unknown",
  dom: "unknown",
  props: {}
}, bf = /* @__PURE__ */ new Set([
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
]), yf = ["v-application", "v-main", "v-overlay", "v-toolbar"];
function Of(e) {
  return !!e.closest(`#${af}`);
}
function St(e) {
  const t = e.tagName.toLowerCase();
  return !!(t === "html" || t === "body" || [...e.classList].some((o) => yf.some((r) => o.startsWith(r))) || t === "div" && !e.id && bn(e).length === 0);
}
function bn(e) {
  return [...e.classList].filter(
    (t) => !t.startsWith("v-") && !t.includes("data-v-")
  );
}
function An(e, t = 36) {
  const n = e.trim().replace(/\s+/g, " ");
  return n.length > t ? `${n.slice(0, t - 1)}…` : n;
}
function fr(e) {
  return [...e.classList].find((n) => n.startsWith("mdi-") && n !== "mdi" && n !== "mdi-set") ?? null;
}
function wf(e) {
  return fr(e) ? e : e.querySelector('i[class*="mdi-"]');
}
function ar(e) {
  const t = e.tagName.toLowerCase();
  return t === "path" || t === "use" ? e.closest("svg") ?? e.closest(".v-icon") ?? e.closest("i") ?? e.closest(".skill-icon") ?? e : e;
}
function Vf(e) {
  const t = e.tagName.toLowerCase();
  return !!(t === "img" || t === "svg" || t === "i" && fr(e) || e.classList.contains("v-icon") || e.classList.contains("skill-icon") || bn(e).some((o) => /icon|badge/i.test(o)));
}
function Oi(e) {
  var o;
  const t = e.tagName.toLowerCase();
  if (t !== "span" && t !== "p") return !1;
  const n = (o = e.textContent) == null ? void 0 : o.trim();
  return !!n && n.length > 0 && n.length < 60;
}
function xf(e) {
  const t = e.tagName.toLowerCase();
  return bf.has(t) || t.startsWith("h");
}
function Df(e) {
  return e.id || e.getAttribute("data-testid") || e.getAttribute("aria-label") ? !0 : bn(e).length > 0;
}
function wi(e) {
  const t = e.tagName.toLowerCase();
  if (t === "html" || t === "body") return t;
  const n = e.id ? `#${e.id}` : "", o = e.getAttribute("data-testid");
  if (o) return `${t}[data-testid="${o}"]`;
  const r = e.getAttribute("aria-label");
  if (r) return `${t}[aria-label="${r}"]`;
  const s = bn(e).slice(0, 2), i = s.length ? `.${s.join(".")}` : "", c = `${t}${n}${i}`;
  return c.length > 48 ? `${c.slice(0, 45)}…` : c;
}
function Cf(e) {
  const t = wf(e), n = t ? fr(t) : null;
  if (n)
    return e.classList.contains("skill-icon") ? `icon ${n} (.skill-icon)` : `icon ${n}`;
  const o = e.tagName.toLowerCase();
  if (o === "img") {
    const r = e.getAttribute("alt");
    return r ? `img[alt="${An(r)}"]` : wi(e);
  }
  return e.classList.contains("skill-icon") ? "div.skill-icon" : o === "svg" ? "svg icon" : null;
}
function Sf(e) {
  const t = ar(e), n = Cf(t);
  if (n) return n;
  const o = t.tagName.toLowerCase();
  if (Oi(t)) {
    const r = An(t.textContent ?? ""), s = bn(t);
    return s.length ? `${o}.${s[0]} "${r}"` : `${o} "${r}"`;
  }
  if (o === "button" || o === "a" || o.startsWith("h")) {
    const r = An(t.textContent ?? "");
    if (r) return `${o} "${r}"`;
  }
  if (o === "input" || o === "textarea") {
    const r = t.getAttribute("placeholder"), s = t.getAttribute("name");
    if (r) return `${o}[placeholder="${An(r, 24)}"]`;
    if (s) return `${o}[name="${s}"]`;
  }
  return wi(t);
}
function Tf() {
  var t, n, o;
  const e = (o = (n = (t = window.__hingeRouter) == null ? void 0 : t.currentRoute) == null ? void 0 : n.value) == null ? void 0 : o.name;
  return e != null && e !== "" ? String(e) : null;
}
function $f(e, t, n) {
  const o = e + n / 2, r = t + n / 2;
  return document.elementsFromPoint(o, r).filter((s) => !Of(s));
}
function Pf(e) {
  if (e.length === 0) return null;
  for (const t of e.slice(0, 20))
    if (!St(t) && Vf(t))
      return ar(t);
  for (const t of e.slice(0, 20))
    if (!St(t) && Oi(t))
      return t;
  for (const t of e.slice(0, 20))
    if (!St(t) && xf(t))
      return t;
  for (const t of e.slice(0, 20))
    if (!St(t) && Df(t))
      return t;
  return e.find((t) => !St(t)) ?? e[0];
}
function Af(e, t, n) {
  const o = $f(e, t, n), r = /* @__PURE__ */ new Set(), s = [], i = Pf(o);
  i && (r.add(i), s.push(i));
  for (const c of o.slice(0, 24)) {
    if (St(c)) continue;
    const u = ar(c);
    r.has(u) || (r.add(u), s.push(u));
  }
  return s;
}
const Mf = /* @__PURE__ */ new Set([
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
function Vi(e) {
  var t, n, o;
  return ((t = e.type) == null ? void 0 : t.displayName) ?? ((n = e.type) == null ? void 0 : n.name) ?? ((o = e.type) == null ? void 0 : o.__name) ?? null;
}
function If(e) {
  return e.__vueParentComponent ?? null;
}
function Rf(e) {
  const t = [];
  let n = If(e);
  for (; n; )
    t.push(n), n = n.parent ?? null;
  return t;
}
function Lf(e) {
  const t = Rf(e);
  for (const n of t) {
    const o = Vi(n);
    if (o && !Mf.has(o))
      return n;
  }
  return t[0] ?? null;
}
function Ff(e) {
  const t = {};
  for (const [n, o] of Object.entries(e))
    if (typeof o != "function" && o !== void 0)
      try {
        JSON.stringify(o), t[n] = o;
      } catch {
        t[n] = String(o);
      }
  return t;
}
function jf(e, t = 4) {
  const n = Object.entries(e).slice(0, t);
  if (n.length === 0) return "";
  const o = n.map(([s, i]) => {
    const c = typeof i == "string" ? `"${i}"` : JSON.stringify(i);
    return `${s}=${c}`;
  }), r = Object.keys(e).length > t ? " …" : "";
  return o.join(" ") + r;
}
function Hf(e) {
  if (!e)
    return { component: null, props: {} };
  const t = Lf(e);
  return t ? {
    component: Vi(t),
    props: Ff(t.props ?? {})
  } : { component: null, props: {} };
}
function kf(e, t = 0, n = 1) {
  const o = n > 1 ? `[${t + 1}/${n}] ` : "", r = jf(e.props, 3);
  return r ? `${o}${e.component} · ${r}` : `${o}${e.component}`;
}
function Uf(e) {
  if (!e) {
    const o = Tf();
    return {
      component: o ?? "unknown",
      dom: o ?? "unknown",
      props: {}
    };
  }
  const t = Sf(e), n = Hf(e);
  return {
    component: n.component ?? t,
    dom: t,
    props: n.props
  };
}
function Wf(e) {
  const t = /* @__PURE__ */ ut({ ...ls }), n = /* @__PURE__ */ ut(ls.component), o = /* @__PURE__ */ br(null), r = /* @__PURE__ */ br([]), s = /* @__PURE__ */ ut(0);
  function i() {
    const d = r.value, a = d[s.value] ?? null;
    o.value = a, t.value = Uf(a), n.value = kf(
      t.value,
      s.value,
      d.length
    );
  }
  function c() {
    r.value = Af(e.x, e.y, Uo), s.value = 0, i();
  }
  function u() {
    const d = r.value;
    if (d.length === 0) {
      c();
      return;
    }
    s.value = (s.value + 1) % d.length, i();
  }
  return Kc(() => {
    e.x, e.y, c();
  }), oo(() => {
    var d, a;
    c(), window.addEventListener("resize", c), (d = window.visualViewport) == null || d.addEventListener("resize", c), (a = window.visualViewport) == null || a.addEventListener("scroll", c);
  }), mn(() => {
    var d, a;
    window.removeEventListener("resize", c), (d = window.visualViewport) == null || d.removeEventListener("resize", c), (a = window.visualViewport) == null || a.removeEventListener("scroll", c);
  }), { target: t, targetLabel: n, selectedElement: o, cycleTarget: u, updateHighlight: i };
}
const Bf = { id: "hinge-app" }, Kf = /* @__PURE__ */ gn({
  __name: "Hinge",
  setup(e) {
    const t = /* @__PURE__ */ ut(!1), { position: n, cogStyle: o, clampPosition: r } = hf(), { target: s, targetLabel: i, selectedElement: c, cycleTarget: u } = Wf(n), { rect: d, update: a } = gf(c), { note: f, sendNote: h } = Nf({
      getTarget: () => s.value,
      getElement: () => c.value
    });
    Jt(c, () => a());
    function E() {
      t.value = !t.value;
    }
    const { onCogPointerDown: D, onCogPointerMove: V, onCogPointerUp: I, onCogContextMenu: j } = pf({
      position: n,
      clampPosition: r,
      onTap: () => {
        u(), a();
      },
      onPanelToggle: E
    });
    async function A() {
      await h(() => {
        t.value = !1;
      });
    }
    return (F, Q) => ($e(), Lo(Zc, { to: "body" }, [
      ue("div", Bf, [
        Ve(Yu, { rect: Ce(d) }, null, 8, ["rect"]),
        Ve(qu, {
          open: t.value,
          "cog-style": Ce(o),
          "target-label": Ce(i),
          onPointerdown: Ce(D),
          onPointermove: Ce(V),
          onPointerup: Ce(I),
          onPointercancel: Ce(I),
          onContextmenu: Ce(j)
        }, null, 8, ["open", "cog-style", "target-label", "onPointerdown", "onPointermove", "onPointerup", "onPointercancel", "onContextmenu"]),
        t.value ? ($e(), Lo(lf, {
          key: 0,
          modelValue: Ce(f),
          "onUpdate:modelValue": Q[0] || (Q[0] = (C) => /* @__PURE__ */ te(f) ? f.value = C : null),
          target: Ce(s),
          onSend: A,
          onClose: Q[1] || (Q[1] = (C) => t.value = !1)
        }, null, 8, ["modelValue", "target"])) : Fo("", !0)
      ])
    ]));
  }
}), Gf = /* @__PURE__ */ Nn(Kf, [["__scopeId", "data-v-c85b2f17"]]);
function zf(e = "body") {
  const t = document.querySelector(e);
  if (!t) {
    console.warn(`[hinge] mount target "${e}" not found`);
    return;
  }
  const n = document.createElement("div");
  n.className = "hinge-mount", Object.assign(n.style, {
    position: "fixed",
    top: "0",
    left: "0",
    width: "0",
    height: "0",
    overflow: "visible",
    pointerEvents: "none",
    zIndex: "99997"
  }), t.appendChild(n), ju(Gf).mount(n);
}
export {
  zf as mountHinge
};
