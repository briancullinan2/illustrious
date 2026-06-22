import { C as e, S as t, _ as n, a as r, b as i, c as a, d as o, f as s, g as c, h as l, i as u, l as d, m as f, n as p, o as m, p as h, r as g, s as _, t as v, u as y, v as b, x, y as S } from "./three-webgpu.js";
(function () {
  let e = document.createElement(`link`).relList;
  if (e && e.supports && e.supports(`modulepreload`))
    return;
  for (let e of document.querySelectorAll(`link[rel="modulepreload"]`))
    n(e);
  new MutationObserver(e => {
    for (let t of e)
      if (t.type === `childList`)
        for (let e of t.addedNodes)
          e.tagName === `LINK` && e.rel === `modulepreload` && n(e)
  }
  ).observe(document, {
    childList: !0,
    subtree: !0
  });
  function t(e) {
    let t = {};
    return e.integrity && (t.integrity = e.integrity),
      e.referrerPolicy && (t.referrerPolicy = e.referrerPolicy),
      e.crossOrigin === `use-credentials` ? t.credentials = `include` : e.crossOrigin === `anonymous` ? t.credentials = `omit` : t.credentials = `same-origin`,
      t
  }
  function n(e) {
    if (e.ep)
      return;
    e.ep = !0;
    let n = t(e);
    fetch(e.href, n)
  }
}
)();
var C = 1.5;
function w(e) {
  return e.maxLongEdge <= 1700 ? {
    name: `fast`,
    targetLongEdge: 1600
  } : e.maxFeatures >= 5e3 && e.maxLongEdge >= 2400 ? {
    name: `dense`,
    targetLongEdge: 2400
  } : e.maxLongEdge <= 2500 ? {
    name: `balanced`,
    targetLongEdge: 2e3
  } : {
    name: `dense`,
    targetLongEdge: 2400
  }
}
var T = 2200
  , E = 110
  , D = .9
  , O = 200
  , k = 3200;
function A(e) {
  debugger
  let t = {
    values: {
      ...e.current
    },
    changes: []
  };
  if (!e.enabled || e.nativeWidth <= 0 || e.nativeHeight <= 0)
    return t;
  let n = j(e.nativeSizes ?? [])
    , r = n.sampleCount > 0 ? n : j([{
      width: e.nativeWidth,
      height: e.nativeHeight
    }])
    , i = w(e.preset)
    , a = r.width
    , o = r.height
    , s = Math.max(a, o);
  e.current.maxLongEdge === e.preset.maxLongEdge && !e.lockMaxLongEdge && i.targetLongEdge < e.current.maxLongEdge && s > i.targetLongEdge && (t.values.maxLongEdge = i.targetLongEdge,
    t.changes.push({
      field: `maxLongEdge`,
      from: e.current.maxLongEdge,
      to: i.targetLongEdge,
      reason: `Local BRIEF descriptors remain patch-limited; capping long edge to ${i.targetLongEdge} px keeps descriptor support meaningful for ${s} px input`
    }));
  let c = Math.min(1, t.values.maxLongEdge / s)
    , l = Math.max(1, Math.round(a * c))
    , u = Math.max(1, Math.round(o * c))
    , d = Math.max(l, u)
    , f = l * u * C / 1e3
    , p = ee(Math.round(f / 100) * 100, 1500, 9e3)
    , m = e.preset.maxFeatures <= k
    , h = p < e.current.maxFeatures && !m ? e.current.maxFeatures : p;
  return e.current.maxFeatures === e.preset.maxFeatures && Math.abs(h - e.current.maxFeatures) >= O && (t.values.maxFeatures = h,
    t.changes.push({
      field: `maxFeatures`,
      from: e.current.maxFeatures,
      to: h,
      reason: `Targeting ${C} features / 1k px at ${l}x${u}` + (r.sampleCount > 1 ? ` representative image size from ${r.sampleCount} samples` : ``)
    })),
    d >= T && (e.current.matcherHammingMax === e.preset.matcherHammingMax && e.preset.matcherHammingMax < E && (t.values.matcherHammingMax = E,
      t.changes.push({
        field: `matcherHammingMax`,
        from: e.current.matcherHammingMax,
        to: E,
        reason: `Processed long edge >= ${T} px: BRIEF carries more variance, allowing a wider Hamming window`
      })),
      e.current.matcherRatio === e.preset.matcherRatio && e.preset.matcherRatio < D && (t.values.matcherRatio = D,
        t.changes.push({
          field: `matcherRatio`,
          from: e.current.matcherRatio,
          to: D,
          reason: `Processed long edge >= ${T} px: a slightly looser Lowe ratio keeps more candidates from the richer descriptor space`
        }))),
    t
}
function j(e) {
  let t = e.filter(e => Number.isFinite(e.width) && Number.isFinite(e.height) && e.width > 0 && e.height > 0).map(e => ({
    width: Math.round(e.width),
    height: Math.round(e.height)
  }));
  if (t.length === 0)
    return {
      width: 0,
      height: 0,
      sampleCount: 0
    };
  let n = t.slice().sort((e, t) => e.width * e.height - t.width * t.height);
  return {
    ...n[Math.min(n.length - 1, Math.ceil((n.length - 1) * .75))],
    sampleCount: t.length
  }
}
function ee(e, t, n) {
  return Number.isFinite(e) ? Math.max(t, Math.min(n, Math.round(e))) : t
}
var M = [1, 0, 0, 0, 1, 0, 0, 0, 1]
  , N = [0, -1, 0, 1, 0, 0, 0, 0, 1]
  , te = [0, 1, 0, -1, 0, 0, 0, 0, 1]
  , ne = Math.SQRT2
  , re = 5e7
  , P = 16384
  , ie = 2e8
  , ae = 65536
  , oe = 750
  , se = 24
  , ce = 8
  , le = 24
  , ue = 96
  , de = 8192
  , fe = 1e6
  , pe = 32
  , me = 512
  , F = 1e5
  , he = 128;
function ge(e, t, n, r, i, a = 320, o = 3, s = {}) {
  return be(e, t, n, r, i, a, o, s)
}
async function _e(e, t, n, r, i, a = 320, o = 3, s, c = {}) {
  let l = _t(c)
    , u = Fe(s) ? s : null;
  if (l === `five-point` && u && i.length >= 5 && a >= 16) {
    let s = await Se([e, t], [n, r], [{
      i: 0,
      j: 1
    }], [i], {
      ransacIterations: a,
      pixelThreshold: o,
      minMatches: 5,
      minInliers: c.minInliers,
      minGpuScoreTests: c.minGpuScoreTests,
      solver: l,
      localOptimization: c.localOptimization,
      seed: c.seed
    }, u);
    if (s[0])
      return s[0]
  }
  if (l !== `eight-point` || !s || i.length < 24 || a < 64)
    return xe(e, t, n, r, i, a, o, c);
  let d;
  try {
    d = await Pe(e, t, n, r, i, a, o, s, c)
  } catch {
    d = null
  }
  return d ?? xe(e, t, n, r, i, a, o, c)
}
function ve(e, t, n, r, i) {
  if (i.length < 8)
    return null;
  let a = i.map(i => {
    let [a, o] = ft(e.intrinsics, n.xs[i.a], n.ys[i.a])
      , [s, c] = ft(t.intrinsics, r.xs[i.b], r.ys[i.b]);
    return {
      match: i,
      x1: a,
      y1: o,
      x2: s,
      y2: c
    }
  }
  )
    , o = jt(a);
  if (!o)
    return null;
  let s = Kt(o);
  if (!s)
    return null;
  let c = qt(s, a, {
    minPositiveDepthRatio: .25,
    requireCheiralityMargin: !1,
    sampleLimit: 120
  });
  return c ? {
    R: c.R,
    t: c.t,
    inliers: [...i],
    score: i.length
  } : null
}
async function ye(e, t, n, r, i, a, o) {
  let s = Array(n.length).fill(null)
    , c = i.solver ?? `eight-point`
    , l = vt(c)
    , u = Math.max(l, i.minMatches ?? l)
    , d = Math.max(0, Math.round(i.ransacIterations))
    , f = i.pixelThreshold
    , p = Fe(a) ? a : null
    , m = {
      solver: c,
      localOptimization: i.localOptimization,
      seed: i.seed,
      minInliers: xt(c, i)
    };
  if (c === `five-point` && p)
    return Se(e, t, n, r, i, p, o);
  if (c !== `eight-point` || !p) {
    let i = r.reduce((e, t) => e + +((t?.length ?? 0) >= u), 0);
    if (i === 0)
      return s;
    let a = i * d
      , l = r.reduce((e, t) => e + ((t?.length ?? 0) >= u ? (t?.length ?? 0) * d : 0), 0);
    o?.(`CPU geometry: verifying ${i} candidate pair${i === 1 ? `` : `s`} with ${c} LO-RANSAC (${a.toLocaleString()} samples, ${l.toLocaleString()} Sampson tests)`);
    let p = wn()
      , h = 0
      , g = 0
      , _ = p
      , v = (e = !1) => {
        if (!o)
          return;
        let t = wn();
        if (!e && !(h >= i) && t - _ < oe)
          return;
        let n = Tn(t - p);
        o(`CPU geometry: ${h}/${i} pairs verified, ${g} accepted (${n})`),
          _ = t
      }
      ;
    for (let i = 0; i < n.length; i++) {
      let a = n[i]
        , c = r[i] ?? [];
      c.length < u || (s[i] = await xe(e[a.i], e[a.j], t[a.i], t[a.j], c, d, f, m, {
        label: `${e[a.i].name} ↔ ${e[a.j].name}`,
        onProgress: o,
        yieldIntervalMs: se,
        progressIntervalMs: oe
      }),
        h++,
        s[i] && g++,
        v())
    }
    return v(!0),
      o?.(`CPU geometry finished: ${g}/${i} pairs accepted`),
      s
  }
  let h = Math.max(1, i.maxScoreTestsPerBatch ?? re)
    , g = Math.max(1, i.maxHypothesesPerBatch ?? P)
    , _ = {
      last: wn()
    }
    , v = []
    , y = 0
    , b = 0
    , x = []
    , S = async () => {
      if (v.length === 0)
        return;
      let i = v;
      v = [],
        y = 0,
        b = 0;
      let c;
      try {
        x.length = i.length;
        for (let e = 0; e < i.length; e++)
          x[e] = i[e].job;
        c = await p.scoreBatched(x, {
          pixelThreshold: f,
          maxHypothesesPerPair: d
        }, o)
      } catch {
        c = null
      }
      if (!c || c.length !== i.length) {
        for (let o of i) {
          let i = n[o.job.pairIndex];
          s[o.job.pairIndex] = await _e(e[i.i], e[i.j], t[i.i], t[i.j], r[o.job.pairIndex] ?? [], d, f, a, m),
            await En(_)
        }
        return
      }
      let l = new Map;
      for (let e of c)
        l.set(e.pairIndex, e);
      for (let e of i) {
        let t = l.get(e.job.pairIndex);
        s[e.job.pairIndex] = t ? Re(e, t) : null
      }
      await En(_, 0)
    }
    ;
  for (let i = 0; i < n.length; i++) {
    let o = n[i]
      , c = r[i] ?? [];
    if (c.length < u)
      continue;
    if (c.length < 24 || d < 64) {
      await S(),
        s[i] = await _e(e[o.i], e[o.j], t[o.i], t[o.j], c, d, f, a, m),
        await En(_);
      continue
    }
    let l = Ie(i, e[o.i], e[o.j], t[o.i], t[o.j], o, c, d, f);
    if (!l) {
      await S(),
        s[i] = await _e(e[o.i], e[o.j], t[o.i], t[o.j], c, d, f, a, m),
        await En(_);
      continue
    }
    let p = l.job.matchCount * l.job.hypothesisCount;
    v.length > 0 && (y + p > h || b + l.job.hypothesisCount > g) && await S(),
      v.push(l),
      y += p,
      b += l.job.hypothesisCount,
      (y >= h || b >= g) && await S(),
      await En(_)
  }
  return await S(),
    s
}
function be(e, t, n, r, i, a = 320, o = 3, s = {}) {
  let c = _t(s)
    , l = vt(c);
  if (i.length < l)
    return null;
  let u = i.map(i => {
    let [a, o] = ft(e.intrinsics, n.xs[i.a], n.ys[i.a])
      , [s, c] = ft(t.intrinsics, r.xs[i.b], r.ys[i.b]);
    return {
      match: i,
      x1: a,
      y1: o,
      x2: s,
      y2: c
    }
  }
  )
    , d = Cn(e, t, o)
    , f = bn(St(i.length, c, s.seed))
    , p = null
    , m = []
    , h = 1 / 0
    , g = a;
  for (let e = 0; e < g; e++) {
    let e = Ct($t(u, l, f), c);
    for (let t of e) {
      let e = wt(t, u, d);
      if (Tt(e.inliers.length, e.tieBreakError, m.length, h)) {
        if (!Dt(t, e.inliers, c, s))
          continue;
        m = e.inliers,
          p = t,
          h = e.tieBreakError,
          g = en(m.length, u.length, a, l)
      }
    }
  }
  return Et(p, m, u, d, c, s)
}
async function xe(e, t, n, r, i, a = 320, o = 3, s = {}, c = {}) {
  let l = _t(s)
    , u = vt(l);
  if (i.length < u)
    return null;
  let d = i.map(i => {
    let [a, o] = ft(e.intrinsics, n.xs[i.a], n.ys[i.a])
      , [s, c] = ft(t.intrinsics, r.xs[i.b], r.ys[i.b]);
    return {
      match: i,
      x1: a,
      y1: o,
      x2: s,
      y2: c
    }
  }
  )
    , f = Cn(e, t, o)
    , p = bn(St(i.length, l, s.seed))
    , m = {
      last: wn()
    }
    , h = null
    , g = []
    , _ = 1 / 0
    , v = a
    , y = wn();
  for (let e = 0; e < v; e++) {
    let t = Ct($t(d, u, p), l);
    for (let e of t) {
      let t = wt(e, d, f);
      if (Tt(t.inliers.length, t.tieBreakError, g.length, _)) {
        if (!Dt(e, t.inliers, l, s))
          continue;
        g = t.inliers,
          h = e,
          _ = t.tieBreakError,
          v = en(g.length, d.length, a, u)
      }
    }
    if ((e + 1) % ce === 0 || e + 1 >= v) {
      let t = wn();
      c.onProgress && c.progressIntervalMs !== void 0 && t - y >= c.progressIntervalMs && (c.onProgress(`CPU geometry: ${c.label ?? `current pair`} sample ${e + 1}/${v}, best ${g.length}/${d.length} inliers`),
        y = t),
        await En(m, c.yieldIntervalMs ?? se)
    }
  }
  return Et(h, g, d, f, l, s)
}
async function Se(e, t, n, r, i, a, o) {
  let s = Array(n.length).fill(null)
    , c = Math.max(5, i.minMatches ?? 5)
    , l = xt(`five-point`, i)
    , u = Math.max(0, Math.round(i.ransacIterations))
    , d = i.pixelThreshold
    , f = Math.max(1, i.maxScoreTestsPerBatch ?? ie)
    , p = Math.max(1, i.maxHypothesesPerBatch ?? ae)
    , m = Math.max(0, i.minGpuScoreTests ?? F)
    , h = {
      solver: `five-point`,
      localOptimization: i.localOptimization,
      seed: i.seed,
      minInliers: l
    }
    , g = we(a)
    , _ = [];
  for (let a = 0; a < n.length; a++) {
    let o = n[a]
      , s = r[a] ?? [];
    s.length < c || _.push(Ce(a, o, e[o.i], e[o.j], t[o.i], t[o.j], s, u, d, l, i.seed, g))
  }
  if (_.length === 0)
    return s;
  let v = _.length >= le && u > pe
    , y = v ? ue : se
    , b = {
      pairs: _.length,
      samplesGenerated: 0,
      samplesWithNoHypotheses: 0,
      hypothesesGenerated: 0,
      hypothesesScoredOnGpu: 0,
      hypothesesScoredOnCpu: 0,
      sampsonTestsGpu: 0,
      sampsonTestsCpu: 0,
      rejectedByCheirality: 0,
      acceptedValidHypotheses: 0,
      generationMs: 0,
      gpuScoreMs: 0,
      cpuFallbackScoreMs: 0,
      finalizationMs: 0,
      gpuBatches: 0
    }
    , x = wn()
    , S = x
    , C = _.slice()
    , w = {
      last: x
    };
  for (o?.(`5-point hybrid verification: ${_.length} pair${_.length === 1 ? `` : `s`}, ${u.toLocaleString()} max samples each`),
    g && o?.(`5-point hybrid: Wasm chart solver enabled for hypothesis generation`),
    v && o?.(`5-point hybrid: throughput batching enabled (${de.toLocaleString()} hypotheses / ${fe.toLocaleString()} Sampson tests target per pair work item)`); C.length > 0;) {
    let e = []
      , t = 0
      , n = 0
      , r = !1;
    for (let i of C) {
      if (i.samplesTried >= i.dynamicSampleCap)
        continue;
      let a = null
        , o = Math.min(v ? Math.max(m, Math.min(fe, i.matchCount * de)) : m, Math.max(1, f - t));
      for (; i.samplesTried + (a?.sampleCount ?? 0) < i.dynamicSampleCap;) {
        let e = wn()
          , s = Te(i, pe, Math.max(1, Math.min(me, p - n - (a?.job.hypothesisCount ?? 0))), a?.sampleCount ?? 0);
        if (b.generationMs += wn() - e,
          s.sampleCount > 0 && (r = !0,
            b.samplesGenerated += s.sampleCount,
            b.samplesWithNoHypotheses += s.samplesWithNoHypotheses),
          s.hypothesesE.length === 0) {
          if (i.samplesTried += s.sampleCount,
            s.sampleCount === 0)
            break;
          await En(w, y);
          continue
        }
        b.hypothesesGenerated += s.hypothesesE.length,
          a ? De(a, s) : a = Ee(i, s);
        let c = a.job.hypothesisCount * a.job.matchCount;
        if (m <= 0 || c >= o || t + c >= f || n + a.job.hypothesisCount >= p)
          break;
        await En(w, y)
      }
      if (a) {
        if (e.push(a),
          n += a.job.hypothesisCount,
          t += a.job.hypothesisCount * a.job.matchCount,
          t >= f || n >= p)
          break;
        await En(w, y)
      }
    }
    if (e.length === 0) {
      if (C = C.filter(e => e.samplesTried < e.dynamicSampleCap),
        !r)
        break;
      await En(w, 0);
      continue
    }
    if (t >= m) {
      let r = wn(), i;
      try {
        Oe(e),
          i = await a.scoreBatched(e.map(e => e.job), {
            pixelThreshold: d,
            maxHypothesesPerPair: Math.max(me, ...e.map(e => e.job.hypothesisCount))
          }, o)
      } catch {
        i = null
      }
      if (b.gpuScoreMs += wn() - r,
        i && i.length === e.length) {
        b.gpuBatches++,
          b.hypothesesScoredOnGpu += n,
          b.sampsonTestsGpu += t;
        let r = new Map;
        for (let e of i)
          r.set(e.pairIndex, e);
        for (let t of e)
          Me(t, r.get(t.state.pairIndex) ?? null)
      } else
        ke(e, b)
    } else
      ke(e, b);
    C = C.filter(e => e.samplesTried < e.dynamicSampleCap);
    let i = wn();
    if (o && i - S >= oe) {
      let e = _.filter(e => e.bestInlierCount >= e.minConsensus).length;
      o(`5-point hybrid verification: ${_.length - C.length}/${_.length} pairs done, ${e} accepted so far, ${b.samplesGenerated.toLocaleString()} samples, ${b.hypothesesGenerated.toLocaleString()} hypotheses`),
        S = i
    }
    await En(w, 0)
  }
  let T = wn();
  for (let e of _)
    s[e.pairIndex] = Ne(e, h);
  return b.finalizationMs += wn() - T,
    b.acceptedValidHypotheses = _.reduce((e, t) => e + t.acceptedValidHypotheses, 0),
    b.rejectedByCheirality = _.reduce((e, t) => e + t.rejectedByCheirality, 0),
    o?.(`5-point hybrid stats: generated ${b.hypothesesGenerated.toLocaleString()} hypotheses from ${b.samplesGenerated.toLocaleString()} samples in ${Tn(b.generationMs)}, scored ${b.sampsonTestsGpu.toLocaleString()} batched-scorer / ${b.sampsonTestsCpu.toLocaleString()} CPU-fallback Sampson tests (${b.gpuBatches} scorer batch${b.gpuBatches === 1 ? `` : `es`}, ${Tn(b.gpuScoreMs)} scorer, ${Tn(b.cpuFallbackScoreMs)} CPU fallback; ${b.samplesWithNoHypotheses.toLocaleString()} empty samples, ${b.acceptedValidHypotheses.toLocaleString()} valid / ${b.rejectedByCheirality.toLocaleString()} cheirality-rejected winners)`),
    s
}
function Ce(e, t, n, r, i, a, o, s, c, l, u, d) {
  let f = o.map(e => {
    let [t, o] = ft(n.intrinsics, i.xs[e.a], i.ys[e.a])
      , [s, c] = ft(r.intrinsics, a.xs[e.b], a.ys[e.b]);
    return {
      match: e,
      x1: t,
      y1: o,
      x2: s,
      y2: c
    }
  }
  )
    , p = o.map(e => Le(n, r, i, a, e));
  return {
    pairIndex: e,
    leftIndex: t.i,
    rightIndex: t.j,
    aFrame: n,
    bFrame: r,
    bearings: f,
    pixels: p,
    packedPixels: ze(p),
    rng: bn(St(o.length, `five-point`, u, e, t.i, t.j)),
    maxSamples: s,
    samplesTried: 0,
    dynamicSampleCap: s,
    bestE: null,
    bestF: null,
    bestInlierCount: 0,
    bestTieBreakError: 1 / 0,
    generatedHypotheses: 0,
    rejectedHypotheses: 0,
    rejectedByCheirality: 0,
    acceptedValidHypotheses: 0,
    matchCount: o.length,
    minConsensus: l,
    sampsonThresholdSq: Cn(n, r, c),
    pixelThresholdSq: c * c,
    chartSolver: d
  }
}
function we(e) {
  let t = e;
  return typeof t.solveFivePointCharts == `function` ? {
    solveFivePointCharts: t.solveFivePointCharts.bind(t)
  } : null
}
function Te(e, t, n, r = 0) {
  let i = []
    , a = []
    , o = 0
    , s = 0;
  for (; o < t && i.length < n && e.samplesTried + r + o < e.dynamicSampleCap;) {
    let t = $t(e.bearings, 5, e.rng);
    o++;
    let r = Ft(t, e.chartSolver);
    r.length === 0 && s++;
    for (let t of r) {
      if (!t.every(Number.isFinite)) {
        e.rejectedHypotheses++;
        continue
      }
      if (i.push(t),
        a.push(Ve(t, e.aFrame.intrinsics, e.bFrame.intrinsics)),
        i.length >= n)
        break
    }
  }
  return {
    sampleCount: o,
    samplesWithNoHypotheses: s,
    hypothesesE: i,
    hypothesesF: a
  }
}
function Ee(e, t) {
  return {
    state: e,
    job: {
      pairIndex: e.pairIndex,
      leftIndex: e.leftIndex,
      rightIndex: e.rightIndex,
      points: e.packedPixels,
      hypothesesF: new Float32Array,
      matchCount: e.matchCount,
      hypothesisCount: t.hypothesesF.length
    },
    hypothesesE: t.hypothesesE,
    hypothesesF: t.hypothesesF,
    sampleCount: t.sampleCount
  }
}
function De(e, t) {
  e.hypothesesE.push(...t.hypothesesE),
    e.hypothesesF.push(...t.hypothesesF),
    e.sampleCount += t.sampleCount,
    e.job.hypothesisCount = e.hypothesesF.length
}
function Oe(e) {
  for (let t of e)
    t.job.hypothesesF.length !== t.job.hypothesisCount * 12 && (t.job.hypothesesF = Zt(t.hypothesesF))
}
function ke(e, t) {
  let n = wn();
  for (let n of e) {
    let e = -1
      , r = -1
      , i = 1 / 0;
    for (let t = 0; t < n.hypothesesF.length; t++) {
      let a = 0
        , o = 0
        , s = n.hypothesesF[t];
      for (let e of n.state.pixels) {
        let t = Be(s, e);
        t <= n.state.pixelThresholdSq && (a++,
          o += t)
      }
      (a > r || a === r && o < i) && (e = t,
        r = a,
        i = o)
    }
    Me(n, {
      pairIndex: n.state.pairIndex,
      bestHypothesis: e,
      bestInlierCount: r,
      bestTieBreakError: i
    }),
      t.hypothesesScoredOnCpu += n.job.hypothesisCount,
      t.sampsonTestsCpu += n.job.hypothesisCount * n.job.matchCount
  }
  t.cpuFallbackScoreMs += wn() - n
}
function Ae(e, t) {
  let n = [];
  for (let r = 0; r < e.pixels.length; r++)
    Be(t, e.pixels[r]) <= e.pixelThresholdSq && n.push(e.bearings[r]);
  return n
}
function je(e, t, n, r, i) {
  if (!Tt(r, i, e.bestInlierCount, e.bestTieBreakError))
    return !1;
  let a = Ae(e, n);
  return a.length < e.minConsensus ? !1 : Dt(t, a, `five-point`, {
    minInliers: e.minConsensus
  }) ? (e.bestE = t,
    e.bestF = n,
    e.bestInlierCount = a.length,
    e.bestTieBreakError = i,
    e.acceptedValidHypotheses++,
    !0) : (e.rejectedByCheirality++,
      !1)
}
function Me(e, t) {
  let n = e.state;
  t && t.bestHypothesis >= 0 && t.bestHypothesis < e.hypothesesE.length && je(n, e.hypothesesE[t.bestHypothesis], e.hypothesesF[t.bestHypothesis], t.bestInlierCount, t.bestTieBreakError),
    n.samplesTried += e.sampleCount,
    n.generatedHypotheses += e.job.hypothesisCount,
    n.dynamicSampleCap = en(n.bestInlierCount, n.matchCount, n.maxSamples, 5)
}
function Ne(e, t) {
  if (!e.bestE || !e.bestF || e.bestInlierCount < e.minConsensus)
    return null;
  let n = Ae(e, e.bestF);
  return n.length < e.minConsensus ? null : Et(e.bestE, n, e.bearings, e.sampsonThresholdSq, `five-point`, t)
}
async function Pe(e, t, n, r, i, a, o, s, c = {}) {
  if (i.length < 8)
    return null;
  let l = i.map(i => {
    let [a, o] = ft(e.intrinsics, n.xs[i.a], n.ys[i.a])
      , [s, c] = ft(t.intrinsics, r.xs[i.b], r.ys[i.b]);
    return {
      match: i,
      x1: a,
      y1: o,
      x2: s,
      y2: c
    }
  }
  )
    , u = Xt(l)
    , d = Cn(e, t, o)
    , f = bn(St(i.length, `eight-point`, c.seed))
    , p = Math.min(64, Math.max(8, a))
    , m = []
    , h = null
    , g = 0
    , _ = a
    , v = async () => {
      if (m.length === 0)
        return !0;
      let e = Zt(m)
        , t = await s.scoreEssentialMatrices(e, u, d, m.length, l.length);
      if (!t)
        return !1;
      for (let e = 0; e < m.length; e++)
        t[e] > g && (g = t[e],
          h = m[e]);
      return m.length = 0,
        _ = en(g, l.length, a),
        !0
    }
    ;
  for (let e = 0; e < _; e++) {
    let e = jt($t(l, 8, f));
    if (!e)
      continue;
    let t = Kt(e);
    if (t && (m.push(t),
      m.length >= p && !await v()))
      return null
  }
  if (!await v() || !h || g < 8)
    return null;
  let y = h;
  return Et(y, l.filter(e => Yt(y, e) < d), l, d, `eight-point`, c)
}
function Fe(e) {
  return !!e && e.supportsBatch === !0 && typeof e.scoreBatched == `function`
}
function Ie(e, t, n, r, i, a, o, s, c) {
  if (o.length < 8 || s <= 0)
    return null;
  let l = o.map(e => {
    let [a, o] = ft(t.intrinsics, r.xs[e.a], r.ys[e.a])
      , [s, c] = ft(n.intrinsics, i.xs[e.b], i.ys[e.b]);
    return {
      match: e,
      x1: a,
      y1: o,
      x2: s,
      y2: c
    }
  }
  )
    , u = o.map(e => Le(t, n, r, i, e))
    , d = bn(St(o.length, `eight-point`, void 0, e, a.i, a.j))
    , f = []
    , p = [];
  for (let e = 0; e < s; e++) {
    let e = jt(Qt(l, d));
    if (!e)
      continue;
    let r = Kt(e);
    r && (f.push(r),
      p.push(Ve(r, t.intrinsics, n.intrinsics)))
  }
  return f.length === 0 ? null : {
    job: {
      pairIndex: e,
      leftIndex: a.i,
      rightIndex: a.j,
      points: ze(u),
      hypothesesF: Zt(p),
      matchCount: o.length,
      hypothesisCount: f.length
    },
    bearings: l,
    pixels: u,
    hypothesesE: f,
    hypothesesF: p,
    pixelThresholdSq: c * c,
    sampsonThresholdSq: Cn(t, n, c)
  }
}
function Le(e, t, n, r, i) {
  let [a, o] = ft(e.intrinsics, n.xs[i.a], n.ys[i.a])
    , [s, c] = ft(t.intrinsics, r.xs[i.b], r.ys[i.b]);
  return {
    x1: e.intrinsics.fx * a + e.intrinsics.cx,
    y1: e.intrinsics.fy * o + e.intrinsics.cy,
    x2: t.intrinsics.fx * s + t.intrinsics.cx,
    y2: t.intrinsics.fy * c + t.intrinsics.cy
  }
}
function Re(e, t) {
  if (t.bestHypothesis < 0 || t.bestHypothesis >= e.hypothesesE.length || t.bestInlierCount < 8)
    return null;
  let n = e.hypothesesE[t.bestHypothesis]
    , r = e.hypothesesF[t.bestHypothesis]
    , i = [];
  for (let t = 0; t < e.pixels.length; t++)
    Be(r, e.pixels[t]) <= e.pixelThresholdSq && i.push(e.bearings[t]);
  return Et(n, i, e.bearings, e.sampsonThresholdSq, `eight-point`, {})
}
function ze(e) {
  let t = new Float32Array(e.length * 4);
  for (let n = 0; n < e.length; n++) {
    let r = e[n]
      , i = n * 4;
    t[i] = r.x1,
      t[i + 1] = r.y1,
      t[i + 2] = r.x2,
      t[i + 3] = r.y2
  }
  return t
}
function Be(e, t) {
  let n = e[0] * t.x1 + e[1] * t.y1 + e[2]
    , r = e[3] * t.x1 + e[4] * t.y1 + e[5]
    , i = e[6] * t.x1 + e[7] * t.y1 + e[8]
    , a = e[0] * t.x2 + e[3] * t.y2 + e[6]
    , o = e[1] * t.x2 + e[4] * t.y2 + e[7]
    , s = t.x2 * n + t.y2 * r + i
    , c = n * n + r * r + a * a + o * o;
  return c > 1e-12 ? s * s / c : 1 / 0
}
function Ve(e, t, n) {
  let r = He(t);
  return I(I(On(He(n)), e), r)
}
function He(e) {
  return [1 / e.fx, 0, -e.cx / e.fx, 0, 1 / e.fy, -e.cy / e.fy, 0, 0, 1]
}
function Ue(e, t, n, r) {
  let i = I(n, e)
    , a = Rn(kn(n, t), r);
  return {
    R: i,
    t: a,
    center: tt(i, a)
  }
}
function We(e, t) {
  if (e.length !== t.length || e.length < 3)
    return null;
  let n = e.length
    , r = 0
    , i = 0
    , a = 0
    , o = 0
    , s = 0
    , c = 0;
  for (let l = 0; l < n; l++)
    r += e[l][0],
      i += e[l][1],
      a += e[l][2],
      o += t[l][0],
      s += t[l][1],
      c += t[l][2];
  r /= n,
    i /= n,
    a /= n,
    o /= n,
    s /= n,
    c /= n;
  let l = 0
    , u = new Float64Array(9);
  for (let d = 0; d < n; d++) {
    let n = e[d][0] - r
      , f = e[d][1] - i
      , p = e[d][2] - a
      , m = t[d][0] - o
      , h = t[d][1] - s
      , g = t[d][2] - c;
    l += n * n + f * f + p * p,
      u[0] += m * n,
      u[1] += m * f,
      u[2] += m * p,
      u[3] += h * n,
      u[4] += h * f,
      u[5] += h * p,
      u[6] += g * n,
      u[7] += g * f,
      u[8] += g * p
  }
  l /= n;
  for (let e = 0; e < 9; e++)
    u[e] /= n;
  if (!Number.isFinite(l) || l < 1e-15)
    return null;
  let d = et([u[0], u[1], u[2], u[3], u[4], u[5], u[6], u[7], u[8]]);
  if (!d)
    return null;
  let { U: f, V: p, sigmas: m } = d;
  if (m[1] < 1e-9 * Math.max(1, m[0]))
    return null;
  let h = An(f) * An(p) >= 0 ? 1 : -1
    , g = I(I(f, [1, 0, 0, 0, 1, 0, 0, 0, h]), On(p))
    , _ = (m[0] + m[1] + h * m[2]) / l;
  if (!Number.isFinite(_) || _ <= 1e-9)
    return null;
  let v = kn(g, [r, i, a]);
  return {
    scale: _,
    R: g,
    t: [o - _ * v[0], s - _ * v[1], c - _ * v[2]]
  }
}
function Ge(e, t, n = {}) {
  if (e.length !== t.length || e.length < 3)
    return null;
  let r = e.length
    , i = Math.max(16, n.iterations ?? 256)
    , a = $e(n.minInlierRatio ?? .5)
    , o = n.inlierResidualScale ?? .05
    , s = bn(n.seed ?? (2654435769 ^ r * 2246822507) >>> 0)
    , c = Ze(t);
  if (!Number.isFinite(c) || c <= 1e-9)
    return null;
  let l = Math.max(.001, o * c)
    , u = []
    , d = null
    , f = (n, r, i) => {
      let a = [n, r, i];
      if (!Je(e, a))
        return;
      let o = Ke(e, t, a);
      if (!o)
        return;
      let s = Ye(o, e, t, l);
      s.length > u.length && (u = s,
        d = o)
    }
    ;
  if (r <= 8)
    for (let e = 0; e < r - 2; e++)
      for (let t = e + 1; t < r - 1; t++)
        for (let n = t + 1; n < r; n++)
          f(e, t, n);
  else
    for (let e = 0; e < i; e++) {
      let e = qe(r, s);
      f(e[0], e[1], e[2])
    }
  if (!d || u.length < 3 || u.length < Math.max(3, Math.ceil(a * r)))
    return null;
  let p = We(u.map(t => e[t]), u.map(e => t[e])) ?? d
    , m = Ye(p, e, t, l);
  return m.length < u.length * .9 ? {
    sim3: d,
    inliers: u,
    medianResidualInliers: Xe(d, e, t, u),
    destinationScale: c,
    iterations: i
  } : {
    sim3: p,
    inliers: m,
    medianResidualInliers: Xe(p, e, t, m),
    destinationScale: c,
    iterations: i
  }
}
function Ke(e, t, n) {
  return We([e[n[0]], e[n[1]], e[n[2]]], [t[n[0]], t[n[1]], t[n[2]]])
}
function qe(e, t) {
  let n = Math.min(e - 1, Math.floor(t() * e))
    , r = Math.min(e - 1, Math.floor(t() * e));
  for (; r === n;)
    r = Math.min(e - 1, Math.floor(t() * e));
  let i = Math.min(e - 1, Math.floor(t() * e));
  for (; i === n || i === r;)
    i = Math.min(e - 1, Math.floor(t() * e));
  return [n, r, i]
}
function Je(e, t) {
  let n = e[t[0]]
    , r = e[t[1]]
    , i = e[t[2]]
    , a = [r[0] - n[0], r[1] - n[1], r[2] - n[2]]
    , o = [i[0] - n[0], i[1] - n[1], i[2] - n[2]];
  return Qe(a) < 1e-6 || Qe(o) < 1e-6 ? !1 : Qe(In(a, o)) > 1e-9
}
function Ye(e, t, n, r) {
  let i = [];
  for (let a = 0; a < t.length; a++) {
    let o = kn(e.R, t[a])
      , s = n[a][0] - (e.scale * o[0] + e.t[0])
      , c = n[a][1] - (e.scale * o[1] + e.t[1])
      , l = n[a][2] - (e.scale * o[2] + e.t[2]);
    Math.hypot(s, c, l) <= r && i.push(a)
  }
  return i
}
function Xe(e, t, n, r) {
  if (r.length === 0)
    return 1 / 0;
  let i = [];
  for (let a of r) {
    let r = kn(e.R, t[a]);
    i.push(Math.hypot(n[a][0] - (e.scale * r[0] + e.t[0]), n[a][1] - (e.scale * r[1] + e.t[1]), n[a][2] - (e.scale * r[2] + e.t[2])))
  }
  return i.sort((e, t) => e - t),
    i[i.length >> 1]
}
function Ze(e) {
  if (e.length === 0)
    return 0;
  let t = 0
    , n = 0
    , r = 0;
  for (let i of e)
    t += i[0],
      n += i[1],
      r += i[2];
  t /= e.length,
    n /= e.length,
    r /= e.length;
  let i = e.map(e => Math.hypot(e[0] - t, e[1] - n, e[2] - r)).sort((e, t) => e - t);
  return Math.max(.25, i[i.length >> 1])
}
function Qe(e) {
  return Math.hypot(e[0], e[1], e[2])
}
function $e(e) {
  return e < 0 ? 0 : e > 1 ? 1 : e
}
function et(e) {
  let t = xn(Dn(I(On(e), e)), 3)
    , n = [0, 1, 2].sort((e, n) => t.values[n] - t.values[e])
    , r = [Math.sqrt(Math.max(0, t.values[n[0]])), Math.sqrt(Math.max(0, t.values[n[1]])), Math.sqrt(Math.max(0, t.values[n[2]]))]
    , i = [t.vectors[n[0]], t.vectors[n[1]], t.vectors[n[2]], t.vectors[3 + n[0]], t.vectors[3 + n[1]], t.vectors[3 + n[2]], t.vectors[6 + n[0]], t.vectors[6 + n[1]], t.vectors[6 + n[2]]]
    , a = [[0, 0, 0], [0, 0, 0], [0, 0, 0]]
    , o = [!1, !1, !1];
  for (let t = 0; t < 3; t++) {
    if (r[t] < 1e-9)
      continue;
    let n = kn(e, [i[t], i[3 + t], i[6 + t]]);
    a[t] = [n[0] / r[t], n[1] / r[t], n[2] / r[t]],
      o[t] = !0
  }
  for (let e = 0; e < 3; e++) {
    if (o[e])
      continue;
    let t = o[0] ? a[0] : null
      , n = o[1] ? a[1] : null
      , r = o[2] ? a[2] : null;
    t && n ? a[e] = Ln(In(t, n)) : t && r ? a[e] = Ln(In(r, t)) : n && r ? a[e] = Ln(In(n, r)) : a[e] = [+(e === 0), +(e === 1), +(e === 2)]
  }
  return {
    U: [a[0][0], a[1][0], a[2][0], a[0][1], a[1][1], a[2][1], a[0][2], a[1][2], a[2][2]],
    V: i,
    sigmas: r
  }
}
function tt(e, t) {
  return kn(On(e), [-t[0], -t[1], -t[2]])
}
function nt(e) {
  let t = e[0] + e[4] + e[8], n, r, i, a;
  if (t > 0) {
    let o = Math.sqrt(t + 1) * 2;
    n = .25 * o,
      r = (e[7] - e[5]) / o,
      i = (e[2] - e[6]) / o,
      a = (e[3] - e[1]) / o
  } else if (e[0] > e[4] && e[0] > e[8]) {
    let t = Math.sqrt(1 + e[0] - e[4] - e[8]) * 2;
    n = (e[7] - e[5]) / t,
      r = .25 * t,
      i = (e[1] + e[3]) / t,
      a = (e[2] + e[6]) / t
  } else if (e[4] > e[8]) {
    let t = Math.sqrt(1 + e[4] - e[0] - e[8]) * 2;
    n = (e[2] - e[6]) / t,
      r = (e[1] + e[3]) / t,
      i = .25 * t,
      a = (e[5] + e[7]) / t
  } else {
    let t = Math.sqrt(1 + e[8] - e[0] - e[4]) * 2;
    n = (e[3] - e[1]) / t,
      r = (e[2] + e[6]) / t,
      i = (e[5] + e[7]) / t,
      a = .25 * t
  }
  let o = Math.hypot(n, r, i, a) || 1;
  return [n / o, r / o, i / o, a / o]
}
function rt(e, t, n, r, i, a, o, s) {
  let c = [0, 0, 0];
  return it(c, e, t, n, r, i, a, o, s) ? c : null
}
function it(e, t, n, r, i, a, o, s, c) {
  let l = -(t[0] * n[0] + t[3] * n[1] + t[6] * n[2])
    , u = -(t[1] * n[0] + t[4] * n[1] + t[7] * n[2])
    , d = -(t[2] * n[0] + t[5] * n[1] + t[8] * n[2])
    , f = -(r[0] * i[0] + r[3] * i[1] + r[6] * i[2])
    , p = -(r[1] * i[0] + r[4] * i[1] + r[7] * i[2])
    , m = -(r[2] * i[0] + r[5] * i[1] + r[8] * i[2])
    , h = 1 / Math.hypot(a, o, 1)
    , g = 1 / Math.hypot(s, c, 1)
    , _ = t[0] * a * h + t[3] * o * h + t[6] * h
    , v = t[1] * a * h + t[4] * o * h + t[7] * h
    , y = t[2] * a * h + t[5] * o * h + t[8] * h
    , b = r[0] * s * g + r[3] * c * g + r[6] * g
    , x = r[1] * s * g + r[4] * c * g + r[7] * g
    , S = r[2] * s * g + r[5] * c * g + r[8] * g
    , C = Math.hypot(_, v, y) || 1
    , w = Math.hypot(b, x, S) || 1;
  _ /= C,
    v /= C,
    y /= C,
    b /= w,
    x /= w,
    S /= w;
  let T = l - f
    , E = u - p
    , D = d - m
    , O = _ * b + v * x + y * S
    , k = 1 - O * O;
  if (Math.abs(k) < 1e-6)
    return !1;
  let A = b * T + x * E + S * D
    , j = _ * T + v * E + y * D
    , ee = (O * A - j) / k
    , M = (A - O * j) / k;
  e[0] = (l + _ * ee + f + b * M) * .5,
    e[1] = (u + v * ee + p + x * M) * .5,
    e[2] = (d + y * ee + m + S * M) * .5;
  let N = t[6] * e[0] + t[7] * e[1] + t[8] * e[2] + n[2]
    , te = r[6] * e[0] + r[7] * e[1] + r[8] * e[2] + i[2];
  return N > 0 && te > 0
}
function at(e, t, n) {
  if (n.length < 2)
    return null;
  let r = new Float64Array(9)
    , i = new Float64Array(3);
  for (let a of n) {
    let n = e[0] * a.X[0] + e[1] * a.X[1] + e[2] * a.X[2]
      , o = e[3] * a.X[0] + e[4] * a.X[1] + e[5] * a.X[2]
      , s = e[6] * a.X[0] + e[7] * a.X[1] + e[8] * a.X[2]
      , [c, l] = ft(t, a.u, a.v);
    ot(r, i, 1, 0, -c, c * s - n),
      ot(r, i, 0, 1, -l, l * s - o)
  }
  r[0] += 1e-9,
    r[4] += 1e-9,
    r[8] += 1e-9;
  let a = st(r, i);
  if (!a)
    return null;
  let o = 0;
  for (let t of n)
    e[6] * t.X[0] + e[7] * t.X[1] + e[8] * t.X[2] + a[2] > 0 && o++;
  return o * 2 < n.length ? null : a
}
function ot(e, t, n, r, i, a) {
  e[0] += n * n,
    e[1] += n * r,
    e[2] += n * i,
    e[3] += r * n,
    e[4] += r * r,
    e[5] += r * i,
    e[6] += i * n,
    e[7] += i * r,
    e[8] += i * i,
    t[0] += n * a,
    t[1] += r * a,
    t[2] += i * a
}
function st(e, t) {
  let n = new Float64Array([e[0], e[1], e[2], t[0], e[3], e[4], e[5], t[1], e[6], e[7], e[8], t[2]]);
  for (let e = 0; e < 3; e++) {
    let t = e;
    for (let r = e + 1; r < 3; r++)
      Math.abs(n[r * 4 + e]) > Math.abs(n[t * 4 + e]) && (t = r);
    if (Math.abs(n[t * 4 + e]) < 1e-12)
      return null;
    if (t !== e)
      for (let r = e; r < 4; r++) {
        let i = n[e * 4 + r];
        n[e * 4 + r] = n[t * 4 + r],
          n[t * 4 + r] = i
      }
    let r = n[e * 4 + e];
    for (let t = e; t < 4; t++)
      n[e * 4 + t] /= r;
    for (let t = 0; t < 3; t++) {
      if (t === e)
        continue;
      let r = n[t * 4 + e];
      for (let i = e; i < 4; i++)
        n[t * 4 + i] -= r * n[e * 4 + i]
    }
  }
  return [n[3], n[7], n[11]]
}
function ct(e, t, n, r) {
  let i = [0, 0, 0];
  return lt(i, e, t, n, r),
    i
}
function lt(e, t, n, r, i) {
  let a = n[0] * i[0] + n[1] * i[1] + n[2] * i[2] + r[0]
    , o = n[3] * i[0] + n[4] * i[1] + n[5] * i[2] + r[1]
    , s = n[6] * i[0] + n[7] * i[1] + n[8] * i[2] + r[2];
  if (e[2] = s,
    s <= 1e-6)
    return e[0] = NaN,
      e[1] = NaN,
      !1;
  let [c, l] = dt(t.intrinsics, a / s, o / s);
  return e[0] = c,
    e[1] = l,
    Number.isFinite(e[0]) && Number.isFinite(e[1])
}
function ut(e) {
  return !!(e.k1 || e.k2 || e.p1 || e.p2)
}
function dt(e, t, n) {
  let [r, i] = mt(e, t, n);
  return [e.fx * r + e.cx, e.fy * i + e.cy]
}
function ft(e, t, n) {
  let r = (t - e.cx) / e.fx
    , i = (n - e.cy) / e.fy;
  return ut(e) ? ht(e, r, i) : [r, i]
}
function pt(e, t, n) {
  let r = e.k1 ?? 0
    , i = e.k2 ?? 0
    , a = e.p1 ?? 0
    , o = e.p2 ?? 0
    , s = t * t + n * n
    , c = 1 + r * s + i * s * s
    , l = 2 * r * t + 4 * i * t * s
    , u = 2 * r * n + 4 * i * n * s;
  return {
    xd: t * c + 2 * a * t * n + o * (s + 2 * t * t),
    yd: n * c + a * (s + 2 * n * n) + 2 * o * t * n,
    dxdDx: c + t * l + 2 * a * n + 6 * o * t,
    dxdDy: t * u + 2 * a * t + 2 * o * n,
    dydDx: n * l + 2 * a * t + 2 * o * n,
    dydDy: c + n * u + 6 * a * n + 2 * o * t
  }
}
function mt(e, t, n) {
  if (!ut(e))
    return [t, n];
  let r = pt(e, t, n);
  return [r.xd, r.yd]
}
function ht(e, t, n) {
  let r = t
    , i = n
    , a = r
    , o = i
    , s = 1 / 0;
  for (let c = 0; c < 12; c++) {
    let c = pt(e, r, i)
      , l = c.xd - t
      , u = c.yd - n
      , d = l * l + u * u;
    if (d < s && (s = d,
      a = r,
      o = i),
      Math.abs(l) + Math.abs(u) < 1e-12)
      break;
    let f = c.dxdDx * c.dydDy - c.dxdDy * c.dydDx;
    if (!Number.isFinite(f) || Math.abs(f) < 1e-14)
      break;
    let p = (-l * c.dydDy + c.dxdDy * u) / f
      , m = (c.dydDx * l - c.dxdDx * u) / f
      , h = Math.hypot(p, m);
    if (!Number.isFinite(h))
      break;
    h > 1 && (p /= h,
      m /= h),
      r += p,
      i += m
  }
  return [a, o]
}
function gt(e, t, n, r) {
  if (r <= 1e-6)
    return null;
  let i = 1 / r
    , a = t * i
    , o = n * i;
  if (!Number.isFinite(a) || !Number.isFinite(o))
    return null;
  let s = pt(e, a, o)
    , c = e.fx * s.dxdDx
    , l = e.fx * s.dxdDy
    , u = e.fy * s.dydDx
    , d = e.fy * s.dydDy
    , f = [c * i, l * i, -(c * a + l * o) * i, u * i, d * i, -(u * a + d * o) * i]
    , p = e.fx * s.xd + e.cx
    , m = e.fy * s.yd + e.cy;
  return !Number.isFinite(p) || !Number.isFinite(m) || !f.every(Number.isFinite) ? null : {
    u: p,
    v: m,
    xd: s.xd,
    yd: s.yd,
    jpi: f
  }
}
function _t(e) {
  return e?.solver ?? `eight-point`
}
function vt(e) {
  return e === `eight-point` ? 8 : 5
}
function yt(e) {
  return e === `five-point` ? 12 : 8
}
function bt(e, t) {
  let n = t?.minInliers
    , r = n !== void 0 && Number.isFinite(n) ? Math.ceil(n) : yt(e);
  return Math.max(vt(e), r)
}
function xt(e, t) {
  let n = t.minInliers ?? t.minMatches
    , r = n !== void 0 && Number.isFinite(n) ? Math.ceil(n) : yt(e);
  return Math.max(vt(e), yt(e), r)
}
function St(e, t, n, r = 0, i = 0, a = 0) {
  let o = n !== void 0 && Number.isFinite(n) ? n >>> 0 : 2654435769;
  return o = (o ^ Math.imul(e | 0, 2246822507)) >>> 0,
    o = (o ^ Math.imul(r | 0, 3266489909)) >>> 0,
    o = (o ^ Math.imul(i | 0, 668265261)) >>> 0,
    o = (o ^ Math.imul(a | 0, 374761393)) >>> 0,
    o = (o ^ (t === `five-point` ? 2135587861 : 1779033703)) >>> 0,
    o >>> 0
}
function Ct(e, t) {
  if (t === `eight-point`) {
    let t = jt(e)
      , n = t ? Kt(t) : null;
    return n ? [n] : []
  }
  return Ft(e)
}
function wt(e, t, n) {
  let r = []
    , i = 0;
  for (let a of t) {
    let t = Yt(e, a);
    t <= n ? (r.push(a),
      i += t) : i += n
  }
  return {
    inliers: r,
    tieBreakError: i
  }
}
function Tt(e, t, n, r) {
  return e > n || e === n && t < r
}
function Et(e, t, n, r, i, a) {
  let o = bt(i, a);
  if (!e || t.length < o)
    return null;
  let s = e
    , c = t;
  if (a.localOptimization !== !1) {
    let e = Ot(s, c, n, r, i);
    s = e.E,
      c = e.inliers
  }
  if (c.length < o)
    return null;
  let l = qt(s, c, {
    minPositiveDepthRatio: i === `five-point` ? .35 : .55,
    requireCheiralityMargin: i === `five-point` ? c.length >= 8 : !0,
    sampleLimit: 120
  });
  return l ? {
    R: l.R,
    t: l.t,
    inliers: c.map(e => e.match),
    score: c.length
  } : null
}
function Dt(e, t, n, r) {
  return t.length < bt(n, r) ? !1 : qt(e, t, {
    minPositiveDepthRatio: n === `five-point` ? .35 : .55,
    requireCheiralityMargin: n === `five-point` ? t.length >= 8 : !0,
    sampleLimit: 80
  }) !== null
}
function Ot(e, t, n, r, i) {
  let a = e
    , o = wt(a, n, r);
  t.length > o.inliers.length && (o = {
    inliers: t,
    tieBreakError: t.reduce((e, t) => e + Math.min(Yt(a, t), r), 0)
  });
  for (let e = 0; e < 3; e++) {
    let e = kt(a, o.inliers, i);
    if (!e)
      break;
    let t = wt(e, n, r);
    if (!Tt(t.inliers.length, t.tieBreakError, o.inliers.length, o.tieBreakError))
      break;
    a = e,
      o = t
  }
  return {
    E: a,
    inliers: o.inliers
  }
}
function kt(e, t, n) {
  if (t.length >= 8) {
    let e = jt(t);
    return e ? Kt(e) : null
  }
  if (n !== `five-point` || t.length !== 5)
    return e;
  let r = Ft(t);
  if (r.length === 0)
    return e;
  let i = e
    , a = At(e, t);
  for (let e of r) {
    let n = At(e, t);
    n < a && (i = e,
      a = n)
  }
  return i
}
function At(e, t) {
  let n = 0;
  for (let r of t) {
    let t = r.x2 * (e[0] * r.x1 + e[1] * r.y1 + e[2]) + r.y2 * (e[3] * r.x1 + e[4] * r.y1 + e[5]) + e[6] * r.x1 + e[7] * r.y1 + e[8];
    n += t * t
  }
  return n
}
function jt(e) {
  if (e.length < 8)
    return null;
  let t = e.length
    , n = 0
    , r = 0
    , i = 0
    , a = 0;
  for (let t of e)
    n += t.x1,
      r += t.y1,
      i += t.x2,
      a += t.y2;
  n /= t,
    r /= t,
    i /= t,
    a /= t;
  let o = 0
    , s = 0;
  for (let t of e)
    o += Math.hypot(t.x1 - n, t.y1 - r),
      s += Math.hypot(t.x2 - i, t.y2 - a);
  if (o /= t,
    s /= t,
    o < 1e-12 || s < 1e-12)
    return null;
  let c = ne / o
    , l = ne / s
    , u = new Float64Array(81);
  for (let t of e) {
    let e = c * (t.x1 - n)
      , o = c * (t.y1 - r)
      , s = l * (t.x2 - i)
      , d = l * (t.y2 - a);
    Mt(u, s * e, s * o, s, d * e, d * o, d, e, o, 1)
  }
  for (let e = 0; e < 9; e++)
    for (let t = 0; t < e; t++)
      u[e * 9 + t] = u[t * 9 + e];
  let d = xn(u, 9)
    , f = Sn(d.values)
    , p = Array.from({
      length: 9
    }, (e, t) => d.vectors[t * 9 + f])
    , m = Math.hypot(...p);
  if (!Number.isFinite(m) || m < 1e-12)
    return null;
  let h = p.map(e => e / m)
    , g = [c, 0, -c * n, 0, c, -c * r, 0, 0, 1];
  return I(I(On([l, 0, -l * i, 0, l, -l * a, 0, 0, 1]), h), g)
}
function Mt(e, t, n, r, i, a, o, s, c, l) {
  e[0] += t * t,
    e[1] += t * n,
    e[2] += t * r,
    e[3] += t * i,
    e[4] += t * a,
    e[5] += t * o,
    e[6] += t * s,
    e[7] += t * c,
    e[8] += t * l,
    e[10] += n * n,
    e[11] += n * r,
    e[12] += n * i,
    e[13] += n * a,
    e[14] += n * o,
    e[15] += n * s,
    e[16] += n * c,
    e[17] += n * l,
    e[20] += r * r,
    e[21] += r * i,
    e[22] += r * a,
    e[23] += r * o,
    e[24] += r * s,
    e[25] += r * c,
    e[26] += r * l,
    e[30] += i * i,
    e[31] += i * a,
    e[32] += i * o,
    e[33] += i * s,
    e[34] += i * c,
    e[35] += i * l,
    e[40] += a * a,
    e[41] += a * o,
    e[42] += a * s,
    e[43] += a * c,
    e[44] += a * l,
    e[50] += o * o,
    e[51] += o * s,
    e[52] += o * c,
    e[53] += o * l,
    e[60] += s * s,
    e[61] += s * c,
    e[62] += s * l,
    e[70] += c * c,
    e[71] += c * l,
    e[80] += l * l
}
var Nt = [[0, 0, 0], [1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1], [.5, .5, .5], [-.5, -.5, -.5], [1, 1, 1], [-1, -1, -1], [1, -1, .5], [-1, 1, -.5]]
  , Pt = new Float64Array(Nt.flat());
function Ft(e, t = null) {
  if (e.length < 5)
    return [];
  let n = Rt(e.slice(0, 5));
  if (!n)
    return [];
  let r = It(n);
  if (t) {
    let n = Lt(r, t, e);
    if (n.length > 0)
      return n
  }
  let i = [];
  for (let t of r)
    for (let n of Nt) {
      let r = zt(t, n);
      if (!r)
        continue;
      let a = Kt(r);
      a && (At(a, e) > 1e-4 || Gt(i, a))
    }
  return i
}
function It(e) {
  let t = [];
  for (let n = 0; n < e.length; n++)
    t.push({
      constant: e[n],
      basis: e.filter((e, t) => t !== n)
    });
  return t
}
function Lt(e, t, n) {
  let r = new Float64Array(e.length * 36);
  for (let t = 0; t < e.length; t++) {
    let n = e[t]
      , i = t * 36;
    r.set(n.constant, i),
      r.set(n.basis[0], i + 9),
      r.set(n.basis[1], i + 18),
      r.set(n.basis[2], i + 27)
  }
  let i = t.solveFivePointCharts(r, e.length, Pt, Nt.length, e.length * Nt.length);
  if (!i || i.length < 9)
    return [];
  let a = []
    , o = Math.floor(i.length / 9);
  for (let e = 0; e < o; e++) {
    let t = e * 9
      , r = Kt(Array.from(i.subarray(t, t + 9)));
    r && (At(r, n) > 1e-4 || Gt(a, r))
  }
  return a
}
function Rt(e) {
  let t = new Float64Array(81);
  for (let n of e)
    Mt(t, n.x2 * n.x1, n.x2 * n.y1, n.x2, n.y2 * n.x1, n.y2 * n.y1, n.y2, n.x1, n.y1, 1);
  for (let e = 0; e < 9; e++)
    for (let n = 0; n < e; n++)
      t[e * 9 + n] = t[n * 9 + e];
  let n = xn(t, 9)
    , r = Array.from({
      length: 9
    }, (e, t) => t).sort((e, t) => n.values[e] - n.values[t])
    , i = [];
  for (let e = 0; e < 4; e++) {
    let t = r[e]
      , a = Array.from({
        length: 9
      }, (e, r) => n.vectors[r * 9 + t])
      , o = Math.hypot(...a);
    if (!Number.isFinite(o) || o < 1e-12)
      return null;
    i.push(a.map(e => e / o))
  }
  return i
}
function zt(e, t) {
  let n = [t[0], t[1], t[2]]
    , r = .001
    , i = Vt(e, n);
  if (!i)
    return null;
  let a = Wt(i);
  for (let t = 0; t < 40; t++) {
    let t = Bt(e, n, i)
      , o = new Float64Array(9)
      , s = new Float64Array(3);
    for (let e = 0; e < i.length; e++) {
      let n = t[e * 3]
        , r = t[e * 3 + 1]
        , a = t[e * 3 + 2];
      o[0] += n * n,
        o[1] += n * r,
        o[2] += n * a,
        o[3] += r * n,
        o[4] += r * r,
        o[5] += r * a,
        o[6] += a * n,
        o[7] += a * r,
        o[8] += a * a,
        s[0] += n * i[e],
        s[1] += r * i[e],
        s[2] += a * i[e]
    }
    o[0] += r * (o[0] + 1e-9),
      o[4] += r * (o[4] + 1e-9),
      o[8] += r * (o[8] + 1e-9);
    let c = st(o, new Float64Array([-s[0], -s[1], -s[2]]));
    if (!c || !c.every(Number.isFinite)) {
      r *= 10;
      continue
    }
    if (Math.hypot(c[0], c[1], c[2]) < 1e-10)
      break;
    let l = [n[0] + c[0], n[1] + c[1], n[2] + c[2]]
      , u = Vt(e, l);
    if (!u) {
      r *= 10;
      continue
    }
    let d = Wt(u);
    if (d < a) {
      if (n = l,
        i = u,
        a = d,
        r = Math.max(1e-8, r * .35),
        a < 1e-14)
        break
    } else
      r = Math.min(1e8, r * 8)
  }
  return a > 1e-8 ? null : Ut(Ht(e, n))
}
function Bt(e, t, n) {
  let r = new Float64Array(n.length * 3);
  for (let i = 0; i < 3; i++) {
    let a = 1e-5 * (1 + Math.abs(t[i]))
      , o = [t[0], t[1], t[2]]
      , s = [t[0], t[1], t[2]];
    o[i] += a,
      s[i] -= a;
    let c = Vt(e, o)
      , l = Vt(e, s);
    for (let e = 0; e < n.length; e++)
      r[e * 3 + i] = c && l ? (c[e] - l[e]) / (2 * a) : 0
  }
  return r
}
function Vt(e, t) {
  let n = Ut(Ht(e, t));
  if (!n)
    return null;
  let r = I(n, On(n))
    , i = I(r, n)
    , a = r[0] + r[4] + r[8]
    , o = new Float64Array(10);
  for (let e = 0; e < 9; e++)
    o[e] = 2 * i[e] - a * n[e];
  return o[9] = An(n),
    o
}
function Ht(e, t) {
  let n = e.constant.slice();
  for (let r = 0; r < 9; r++)
    n[r] += t[0] * e.basis[0][r] + t[1] * e.basis[1][r] + t[2] * e.basis[2][r];
  return n
}
function Ut(e) {
  let t = Math.hypot(...e);
  return !Number.isFinite(t) || t < 1e-12 ? null : e.map(e => e / t)
}
function Wt(e) {
  let t = 0;
  for (let n of e)
    t += n * n;
  return t
}
function Gt(e, t) {
  let n = Ut(t);
  if (n) {
    for (let t of e) {
      let e = 0;
      for (let r = 0; r < 9; r++)
        e += t[r] * n[r];
      if (Math.abs(e) > .999)
        return
    }
    e.push(n)
  }
}
function Kt(e) {
  let t = Jt(e);
  if (!t)
    return null;
  let n = On(t.V)
    , r = [n[0], n[1], n[2], n[3], n[4], n[5], 0, 0, 0]
    , i = I(t.U, r)
    , a = Math.hypot(...i);
  return !Number.isFinite(a) || a < 1e-12 ? null : i.map(e => e / a)
}
function qt(e, t, n = {}) {
  let r = Jt(e);
  if (!r)
    return null;
  let i = r.U
    , a = r.V;
  An(i) < 0 && (i = Mn(i, 2)),
    An(a) < 0 && (a = Mn(a, 2));
  let o = On(a)
    , s = [{
      R: jn(I(I(i, N), o)),
      t: Ln([i[2], i[5], i[8]])
    }, {
      R: jn(I(I(i, N), o)),
      t: Ln([-i[2], -i[5], -i[8]])
    }, {
      R: jn(I(I(i, te), o)),
      t: Ln([i[2], i[5], i[8]])
    }, {
      R: jn(I(I(i, te), o)),
      t: Ln([-i[2], -i[5], -i[8]])
    }]
    , c = null
    , l = -1
    , u = -1
    , d = t.slice(0, Math.min(n.sampleLimit ?? 60, t.length));
  for (let e of s) {
    let t = 0;
    for (let n of d)
      rt(M, [0, 0, 0], e.R, e.t, n.x1, n.y1, n.x2, n.y2) && t++;
    t > l ? (u = l,
      c = e,
      l = t) : t > u && (u = t)
  }
  let f = Math.max(4, d.length * (n.minPositiveDepthRatio ?? .55))
    , p = l > u + 4 || l === d.length
    , m = n.requireCheiralityMargin ?? !0;
  return l >= f && (!m || p) ? c : null
}
function Jt(e) {
  let t = xn(Dn(I(On(e), e)), 3)
    , n = [0, 1, 2].sort((e, n) => t.values[n] - t.values[e])
    , r = n.map(e => Math.sqrt(Math.max(0, t.values[e])))
    , i = [t.vectors[n[0]], t.vectors[n[1]], t.vectors[n[2]], t.vectors[3 + n[0]], t.vectors[3 + n[1]], t.vectors[3 + n[2]], t.vectors[6 + n[0]], t.vectors[6 + n[1]], t.vectors[6 + n[2]]];
  i = Pn(i);
  let a = [];
  for (let t = 0; t < 2; t++) {
    let n = kn(e, [i[t], i[3 + t], i[6 + t]]);
    a.push(Ln(Bn(n, 1 / Math.max(r[t], 1e-9))))
  }
  return a.push(Ln(In(a[0], a[1]))),
  {
    U: Pn([a[0][0], a[1][0], a[2][0], a[0][1], a[1][1], a[2][1], a[0][2], a[1][2], a[2][2]]),
    V: i
  }
}
function Yt(e, t) {
  let n = [t.x1, t.y1, 1]
    , r = [t.x2, t.y2, 1]
    , i = kn(e, n)
    , a = kn(On(e), r)
    , o = Fn(r, i)
    , s = i[0] * i[0] + i[1] * i[1] + a[0] * a[0] + a[1] * a[1];
  return s > 1e-12 ? o * o / s : 1 / 0
}
function Xt(e) {
  let t = new Float32Array(e.length * 4);
  for (let n = 0; n < e.length; n++) {
    let r = e[n]
      , i = n * 4;
    t[i] = r.x1,
      t[i + 1] = r.y1,
      t[i + 2] = r.x2,
      t[i + 3] = r.y2
  }
  return t
}
function Zt(e) {
  let t = new Float32Array(e.length * 12);
  for (let n = 0; n < e.length; n++) {
    let r = e[n]
      , i = n * 12;
    t[i + 0] = r[0],
      t[i + 1] = r[1],
      t[i + 2] = r[2],
      t[i + 4] = r[3],
      t[i + 5] = r[4],
      t[i + 6] = r[5],
      t[i + 8] = r[6],
      t[i + 9] = r[7],
      t[i + 10] = r[8]
  }
  return t
}
function Qt(e, t) {
  return $t(e, 8, t)
}
function $t(e, t, n) {
  let r = []
    , i = new Set;
  for (; r.length < t && i.size < e.length;) {
    let t = Math.min(e.length - 1, Math.floor(n() * e.length));
    i.has(t) || (i.add(t),
      r.push(e[t]))
  }
  return r
}
function en(e, t, n, r = 8, i = .999) {
  if (t <= 0 || e < r)
    return n;
  let a = Math.min(.999, Math.max(1e-6, e / t)) ** +r;
  if (a >= .999999999)
    return Math.max(8, Math.floor(n * .05));
  let o = Math.log(1 - a);
  if (!Number.isFinite(o) || o >= 0)
    return n;
  let s = Math.log(1 - i) / o;
  return Number.isFinite(s) ? Math.max(8, Math.min(n, Math.ceil(s))) : n
}
function tn(e, t) {
  let n = Ln(e[0])
    , r = Ln(e[1])
    , i = Ln(e[2]);
  if (!cn(n) || !cn(r) || !cn(i))
    return [];
  let a = t[0]
    , o = t[1]
    , s = t[2]
    , c = sn(o, s)
    , l = sn(a, s)
    , u = sn(a, o);
  if (c < 1e-18 || l < 1e-18 || u < 1e-18)
    return [];
  let d = on(Fn(r, i), -1, 1)
    , f = on(Fn(n, i), -1, 1)
    , p = on(Fn(n, r), -1, 1)
    , m = Math.sqrt(c)
    , h = l / c
    , g = h - u / c
    , _ = -1 - g
    , v = 2 * g * d
    , y = 1 - g
    , b = -2 * p
    , x = 2 * f
    , S = -h
    , C = 2 * h * d
    , w = 1 - h
    , T = rn([_, v, y], [_, v, y])
    , E = an(rn([_, v, y], [b, x]))
    , D = rn(rn([b, x], [b, x]), [S, C, w])
    , O = ln([T[0] + D[0], T[1] - 2 * f * E[1] + D[1], T[2] - 2 * f * E[2] + D[2], T[3] - 2 * f * E[3] + D[3], T[4] - 2 * f * E[4] + D[4]])
    , k = [];
  for (let e of O) {
    if (!Number.isFinite(e) || e <= 0)
      continue;
    let t = 1 + e * e - 2 * e * d;
    if (t <= 1e-12)
      continue;
    let c = m / Math.sqrt(t);
    if (!Number.isFinite(c) || c <= 0)
      continue;
    let l = b + x * e;
    if (Math.abs(l) < 1e-9)
      continue;
    let u = (_ + v * e + y * e * e) / l;
    if (!Number.isFinite(u) || u <= 0)
      continue;
    let f = u * c
      , p = e * c
      , h = Bn(n, f)
      , g = Bn(r, c)
      , S = Bn(i, p)
      , C = pn([a, o, s], [h, g, S]);
    C && k.push(C)
  }
  return k
}
function nn(e, t, n = {}) {
  let r = Math.max(4, n.minInliers ?? 6);
  if (e.length < Math.max(4, r))
    return null;
  let i = Math.max(32, n.iterations ?? 256)
    , a = Math.max(.5, n.pixelThreshold ?? 4)
    , o = a * a
    , s = bn(n.seed ?? 12648430)
    , c = n.reprojectionScorer?.createPnPScoringContext(e, t) ?? null
    , l = Array(e.length);
  for (let n = 0; n < e.length; n++) {
    let r = e[n]
      , [i, a] = ft(t, r.u, r.v);
    l[n] = Ln([i, a, 1])
  }
  let u = []
    , d = null
    , f = 0
    , p = 1 / 0
    , m = i
    , h = []
    , g = (t, n, r) => {
      (n > f || n === f && r < p) && (f = n,
        p = r,
        d = t,
        m = en(n, e.length, i, 3, .999))
    }
    , _ = n => {
      let r = c?.scorePose(n.R, n.t, o);
      if (r) {
        g(n, r.inlierCount, r.errorSum);
        return
      }
      g(n, gn(e, n.R, n.t, t, o, null).length, 1 / 0)
    }
    , v = () => {
      if (h.length === 0)
        return;
      let e = h.splice(0, h.length)
        , t = c?.scorePoses?.(e, o) ?? null;
      if (t && t.length === e.length) {
        for (let n of t) {
          let t = e[n.poseIndex];
          t && g(t, n.inlierCount, n.errorSum)
        }
        return
      }
      for (let t of e)
        _(t)
    }
    ;
  for (let t = 0; t < m; t++) {
    let t = mn(e.length, s);
    if (!t)
      continue;
    let [n, r, i] = t
      , a = tn([l[n], l[r], l[i]], [e[n].X, e[r].X, e[i].X]);
    for (let e of a)
      c?.scorePoses ? (h.push(e),
        h.length >= he && v()) : _(e)
  }
  v();
  let y = d;
  if (!y || f < r || (u = gn(e, y.R, y.t, t, o, c),
    u.length < r))
    return null;
  let b = y;
  if (!n.skipRefine) {
    let n = _n(e, u, t, b, c);
    if (n) {
      let r = gn(e, n.R, n.t, t, o, c);
      r.length >= u.length && (b = n,
        u = r)
    }
  }
  let x = 0
    , S = c?.reprojectionErrors?.(b.R, b.t) ?? null;
  if (S)
    for (let e of u)
      x += S[e];
  else
    for (let n of u) {
      let r = e[n]
        , i = hn(r, b.R, b.t, t);
      x += i
    }
  let C = Math.sqrt(x / Math.max(1, u.length));
  return {
    R: b.R,
    t: b.t,
    inliers: u,
    iterations: m,
    meanReprojectionError: C
  }
}
function rn(e, t) {
  let n = Array(e.length + t.length - 1).fill(0);
  for (let r = 0; r < e.length; r++)
    if (e[r] !== 0)
      for (let i = 0; i < t.length; i++)
        n[r + i] += e[r] * t[i];
  return n
}
function an(e) {
  return [0, ...e]
}
function on(e, t, n) {
  return e < t ? t : e > n ? n : e
}
function sn(e, t) {
  let n = e[0] - t[0]
    , r = e[1] - t[1]
    , i = e[2] - t[2];
  return n * n + r * r + i * i
}
function cn(e) {
  return Number.isFinite(e[0]) && Number.isFinite(e[1]) && Number.isFinite(e[2]) && (e[0] !== 0 || e[1] !== 0 || e[2] !== 0)
}
function ln(e) {
  let [t, n, r, i, a] = e;
  if (Math.abs(a) < 1e-14)
    return un([t, n, r, i]);
  let o = i / a
    , s = r / a
    , c = n / a
    , l = t / a
    , u = s - 3 * o * o / 8
    , d = c - o * s / 2 + o * o * o / 8
    , f = l - o * c / 4 + o * o * s / 16 - 3 * o * o * o * o / 256
    , p = -o / 4
    , m = [];
  if (Math.abs(d) < 1e-12) {
    let e = u * u - 4 * f;
    if (e >= 0) {
      let t = Math.sqrt(e)
        , n = (-u + t) / 2
        , r = (-u - t) / 2;
      if (n >= 0) {
        let e = Math.sqrt(n);
        m.push(e, -e)
      }
      if (r >= 0) {
        let e = Math.sqrt(r);
        m.push(e, -e)
      }
    }
  } else {
    let e = un([4 * u * f - d * d, -8 * f, -4 * u, 8])
      , t = NaN;
    for (let n of e)
      if (2 * n - u > 1e-12) {
        t = n;
        break
      }
    if (Number.isFinite(t)) {
      let e = Math.sqrt(2 * t - u)
        , n = t + d / (2 * e)
        , r = t - d / (2 * e)
        , i = e * e - 4 * n
        , a = e * e - 4 * r;
      if (i >= 0) {
        let t = Math.sqrt(i);
        m.push((e + t) / 2),
          m.push((e - t) / 2)
      }
      if (a >= 0) {
        let t = Math.sqrt(a);
        m.push((-e + t) / 2),
          m.push((-e - t) / 2)
      }
    }
  }
  return m.map(e => e + p)
}
function un(e) {
  let [t, n, r, i] = e;
  if (Math.abs(i) < 1e-14)
    return dn(t, n, r);
  let a = r / i
    , o = n / i
    , s = t / i
    , c = o - a * a / 3
    , l = 2 * a * a * a / 27 - a * o / 3 + s
    , u = -a / 3;
  if (-4 * c * c * c - 27 * l * l > 1e-12) {
    let e = Math.sqrt(-c / 3)
      , t = Math.acos(on(3 * l / (2 * c) * Math.sqrt(-3 / c), -1, 1));
    return [2 * e * Math.cos(t / 3) + u, 2 * e * Math.cos((t - 2 * Math.PI) / 3) + u, 2 * e * Math.cos((t - 4 * Math.PI) / 3) + u]
  }
  let d = l * l / 4 + c * c * c / 27
    , f = Math.sqrt(Math.max(0, d));
  return [fn(-l / 2 + f) + fn(-l / 2 - f) + u]
}
function dn(e, t, n) {
  if (Math.abs(n) < 1e-14)
    return Math.abs(t) < 1e-14 ? [] : [-e / t];
  let r = t * t - 4 * n * e;
  if (r < 0)
    return [];
  let i = Math.sqrt(r);
  return [(-t + i) / (2 * n), (-t - i) / (2 * n)]
}
function fn(e) {
  return e >= 0 ? e ** (1 / 3) : -((-e) ** (1 / 3))
}
function pn(e, t) {
  let n = [(e[0][0] + e[1][0] + e[2][0]) / 3, (e[0][1] + e[1][1] + e[2][1]) / 3, (e[0][2] + e[1][2] + e[2][2]) / 3]
    , r = [(t[0][0] + t[1][0] + t[2][0]) / 3, (t[0][1] + t[1][1] + t[2][1]) / 3, (t[0][2] + t[1][2] + t[2][2]) / 3]
    , i = new Float64Array(9);
  for (let a = 0; a < 3; a++) {
    let o = e[a][0] - n[0]
      , s = e[a][1] - n[1]
      , c = e[a][2] - n[2]
      , l = t[a][0] - r[0]
      , u = t[a][1] - r[1]
      , d = t[a][2] - r[2];
    i[0] += o * l,
      i[1] += o * u,
      i[2] += o * d,
      i[3] += s * l,
      i[4] += s * u,
      i[5] += s * d,
      i[6] += c * l,
      i[7] += c * u,
      i[8] += c * d
  }
  let a = Jt([i[0], i[1], i[2], i[3], i[4], i[5], i[6], i[7], i[8]]);
  if (!a)
    return null;
  let o = I(a.V, On(a.U));
  An(o) < 0 && (o = I([a.V[0], a.V[1], -a.V[2], a.V[3], a.V[4], -a.V[5], a.V[6], a.V[7], -a.V[8]], On(a.U)));
  let s = [r[0] - (o[0] * n[0] + o[1] * n[1] + o[2] * n[2]), r[1] - (o[3] * n[0] + o[4] * n[1] + o[5] * n[2]), r[2] - (o[6] * n[0] + o[7] * n[1] + o[8] * n[2])]
    , c = o[6] * e[0][0] + o[7] * e[0][1] + o[8] * e[0][2] + s[2]
    , l = o[6] * e[1][0] + o[7] * e[1][1] + o[8] * e[1][2] + s[2]
    , u = o[6] * e[2][0] + o[7] * e[2][1] + o[8] * e[2][2] + s[2];
  return c <= 0 || l <= 0 || u <= 0 ? null : {
    R: Pn(o),
    t: s
  }
}
function mn(e, t) {
  if (e < 3)
    return null;
  let n = Math.min(e - 1, Math.floor(t() * e))
    , r = Math.min(e - 1, Math.floor(t() * e));
  for (; r === n;)
    r = Math.min(e - 1, Math.floor(t() * e));
  let i = Math.min(e - 1, Math.floor(t() * e));
  for (; i === n || i === r;)
    i = Math.min(e - 1, Math.floor(t() * e));
  return [n, r, i]
}
function hn(e, t, n, r) {
  let i = t[0] * e.X[0] + t[1] * e.X[1] + t[2] * e.X[2] + n[0]
    , a = t[3] * e.X[0] + t[4] * e.X[1] + t[5] * e.X[2] + n[1]
    , o = t[6] * e.X[0] + t[7] * e.X[1] + t[8] * e.X[2] + n[2];
  if (o <= 1e-6)
    return 1 / 0;
  let [s, c] = dt(r, i / o, a / o)
    , l = s - e.u
    , u = c - e.v;
  return l * l + u * u
}
function gn(e, t, n, r, i, a) {
  let o = a?.scorePose(t, n, i);
  if (o)
    return o.inliers;
  let s = [];
  for (let a = 0; a < e.length; a++)
    hn(e[a], t, n, r) < i && s.push(a);
  return s
}
function _n(e, t, n, r, i) {
  if (t.length < 4)
    return null;
  let a = r.R
    , o = r.t
    , s = vn(e, t, a, o, n, i);
  for (let r = 0; r < 12; r++) {
    let r = new Float64Array(36)
      , c = new Float64Array(6);
    for (let i of t) {
      let t = e[i]
        , s = a[0] * t.X[0] + a[1] * t.X[1] + a[2] * t.X[2]
        , l = a[3] * t.X[0] + a[4] * t.X[1] + a[5] * t.X[2]
        , u = a[6] * t.X[0] + a[7] * t.X[1] + a[8] * t.X[2]
        , d = gt(n, s + o[0], l + o[1], u + o[2]);
      if (!d)
        return null;
      let f = d.u - t.u
        , p = d.v - t.v
        , m = d.jpi
        , h = [m[0] * 0 + m[1] * -u + m[2] * l, m[0] * u + m[1] * 0 + m[2] * -s, m[0] * -l + m[1] * s + m[2] * 0, m[3] * 0 + m[4] * -u + m[5] * l, m[3] * u + m[4] * 0 + m[5] * -s, m[3] * -l + m[4] * s + m[5] * 0]
        , g = [h[0], h[1], h[2], m[0], m[1], m[2], h[3], h[4], h[5], m[3], m[4], m[5]];
      for (let e = 0; e < 6; e++) {
        for (let t = e; t < 6; t++)
          r[e * 6 + t] += g[e] * g[t] + g[6 + e] * g[6 + t];
        c[e] += g[e] * f + g[6 + e] * p
      }
    }
    for (let e = 0; e < 6; e++) {
      for (let t = e + 1; t < 6; t++)
        r[t * 6 + e] = r[e * 6 + t];
      r[e * 6 + e] += 1e-9 * Math.max(1, r[e * 6 + e])
    }
    let l = yn(r, c);
    if (!l)
      return null;
    let u = [-l[0], -l[1], -l[2]]
      , d = [-l[3], -l[4], -l[5]]
      , f = Pn(I(Nn(u), a))
      , p = [o[0] + d[0], o[1] + d[1], o[2] + d[2]]
      , m = vn(e, t, f, p, n, i);
    if (!Number.isFinite(m) || m > s * 1.0001 || (a = f,
      o = p,
      Math.abs(s - m) < 1e-9))
      break;
    s = m
  }
  return {
    R: a,
    t: o
  }
}
function vn(e, t, n, r, i, a) {
  let o = 0
    , s = a?.reprojectionErrors?.(n, r) ?? null;
  if (s)
    for (let e of t)
      o += s[e];
  else
    for (let a of t)
      o += hn(e[a], n, r, i);
  return Math.sqrt(o / Math.max(1, t.length))
}
function yn(e, t) {
  let n = new Float64Array(42);
  for (let r = 0; r < 6; r++) {
    for (let t = 0; t < 6; t++)
      n[r * 7 + t] = e[r * 6 + t];
    n[r * 7 + 6] = t[r]
  }
  for (let e = 0; e < 6; e++) {
    let t = e;
    for (let r = e + 1; r < 6; r++)
      Math.abs(n[r * 7 + e]) > Math.abs(n[t * 7 + e]) && (t = r);
    if (Math.abs(n[t * 7 + e]) < 1e-12)
      return null;
    if (t !== e)
      for (let r = e; r < 7; r++) {
        let i = n[e * 7 + r];
        n[e * 7 + r] = n[t * 7 + r],
          n[t * 7 + r] = i
      }
    let r = n[e * 7 + e];
    for (let t = e; t < 7; t++)
      n[e * 7 + t] /= r;
    for (let t = 0; t < 6; t++) {
      if (t === e)
        continue;
      let r = n[t * 7 + e];
      if (r !== 0)
        for (let i = e; i < 7; i++)
          n[t * 7 + i] -= r * n[e * 7 + i]
    }
  }
  let r = new Float64Array(6);
  for (let e = 0; e < 6; e++)
    r[e] = n[e * 7 + 6];
  return r
}
function bn(e) {
  let t = e | 0 ? e >>> 0 : 2654435769;
  return () => (t ^= t << 13,
    t ^= t >>> 17,
    t ^= t << 5,
    t >>>= 0,
    t / 4294967296)
}
function xn(e, t) {
  let n = new Float64Array(e)
    , r = new Float64Array(t * t);
  for (let e = 0; e < t; e++)
    r[e * t + e] = 1;
  for (let e = 0; e < t * t * 16; e++) {
    let e = 0
      , i = 1
      , a = 0;
    for (let r = 0; r < t; r++)
      for (let o = r + 1; o < t; o++) {
        let s = Math.abs(n[r * t + o]);
        s > a && (a = s,
          e = r,
          i = o)
      }
    if (a < 1e-10)
      break;
    let o = n[e * t + e]
      , s = n[i * t + i]
      , c = n[e * t + i]
      , l = .5 * Math.atan2(2 * c, s - o)
      , u = Math.cos(l)
      , d = Math.sin(l);
    for (let r = 0; r < t; r++) {
      let a = n[e * t + r]
        , o = n[i * t + r];
      n[e * t + r] = u * a - d * o,
        n[i * t + r] = d * a + u * o
    }
    for (let r = 0; r < t; r++) {
      let a = n[r * t + e]
        , o = n[r * t + i];
      n[r * t + e] = u * a - d * o,
        n[r * t + i] = d * a + u * o
    }
    for (let n = 0; n < t; n++) {
      let a = r[n * t + e]
        , o = r[n * t + i];
      r[n * t + e] = u * a - d * o,
        r[n * t + i] = d * a + u * o
    }
  }
  let i = new Float64Array(t);
  for (let e = 0; e < t; e++)
    i[e] = n[e * t + e];
  return {
    values: i,
    vectors: r
  }
}
function Sn(e) {
  let t = 0;
  for (let n = 1; n < e.length; n++)
    e[n] < e[t] && (t = n);
  return t
}
function Cn(e, t, n) {
  let r = .25 * (e.intrinsics.fx + e.intrinsics.fy + t.intrinsics.fx + t.intrinsics.fy);
  return (n / Math.max(1, r)) ** 2
}
function wn() {
  return globalThis.performance?.now?.() ?? Date.now()
}
function Tn(e) {
  return e < 1e3 ? `${Math.round(e)} ms` : `${(e / 1e3).toFixed(1)} s`
}
async function En(e, t = 32) {
  let n = wn();
  t > 0 && n - e.last < t || (await new Promise(e => setTimeout(e, 0)),
    e.last = wn())
}
function Dn(e) {
  return new Float64Array(e)
}
function On(e) {
  return [e[0], e[3], e[6], e[1], e[4], e[7], e[2], e[5], e[8]]
}
function I(e, t) {
  return [e[0] * t[0] + e[1] * t[3] + e[2] * t[6], e[0] * t[1] + e[1] * t[4] + e[2] * t[7], e[0] * t[2] + e[1] * t[5] + e[2] * t[8], e[3] * t[0] + e[4] * t[3] + e[5] * t[6], e[3] * t[1] + e[4] * t[4] + e[5] * t[7], e[3] * t[2] + e[4] * t[5] + e[5] * t[8], e[6] * t[0] + e[7] * t[3] + e[8] * t[6], e[6] * t[1] + e[7] * t[4] + e[8] * t[7], e[6] * t[2] + e[7] * t[5] + e[8] * t[8]]
}
function kn(e, t) {
  return [e[0] * t[0] + e[1] * t[1] + e[2] * t[2], e[3] * t[0] + e[4] * t[1] + e[5] * t[2], e[6] * t[0] + e[7] * t[1] + e[8] * t[2]]
}
function An(e) {
  return e[0] * (e[4] * e[8] - e[5] * e[7]) - e[1] * (e[3] * e[8] - e[5] * e[6]) + e[2] * (e[3] * e[7] - e[4] * e[6])
}
function jn(e) {
  return An(e) < 0 ? e.map(e => -e) : e
}
function Mn(e, t) {
  let n = e.slice();
  return n[t] *= -1,
    n[3 + t] *= -1,
    n[6 + t] *= -1,
    n
}
function Nn(e) {
  let t = Math.hypot(e[0], e[1], e[2]);
  if (t < 1e-12)
    return [1, 0, 0, 0, 1, 0, 0, 0, 1];
  let n = e[0] / t
    , r = e[1] / t
    , i = e[2] / t
    , a = Math.cos(t)
    , o = Math.sin(t)
    , s = 1 - a;
  return [a + n * n * s, n * r * s - i * o, n * i * s + r * o, r * n * s + i * o, a + r * r * s, r * i * s - n * o, i * n * s - r * o, i * r * s + n * o, a + i * i * s]
}
function Pn(e) {
  let t = Ln([e[0], e[3], e[6]])
    , n = [e[1], e[4], e[7]]
    , r = Ln(zn(n, Bn(t, Fn(t, n))))
    , i = Ln(In(t, r));
  return [t[0], r[0], i[0], t[1], r[1], i[1], t[2], r[2], i[2]]
}
function Fn(e, t) {
  return e[0] * t[0] + e[1] * t[1] + e[2] * t[2]
}
function In(e, t) {
  return [e[1] * t[2] - e[2] * t[1], e[2] * t[0] - e[0] * t[2], e[0] * t[1] - e[1] * t[0]]
}
function Ln(e) {
  let t = Math.hypot(e[0], e[1], e[2]) || 1;
  return [e[0] / t, e[1] / t, e[2] / t]
}
function Rn(e, t) {
  return [e[0] + t[0], e[1] + t[1], e[2] + t[2]]
}
function zn(e, t) {
  return [e[0] - t[0], e[1] - t[1], e[2] - t[2]]
}
function Bn(e, t) {
  return [e[0] * t, e[1] * t, e[2] * t]
}
function Vn(e, t) {
  return `${encodeURIComponent(e)}->${encodeURIComponent(t)}`
}
function Hn(e) {
  return {
    x: qn(e.x),
    y: qn(e.y)
  }
}
function Un(e, t, n) {
  let r = Hn(e);
  return {
    x: r.x * Jn(t),
    y: r.y * Jn(n)
  }
}
function Wn(e) {
  return {
    ...e,
    points: e.points.map(e => ({
      ...e,
      left: {
        ...e.left
      },
      right: {
        ...e.right
      }
    }))
  }
}
function Gn(e) {
  let t = [];
  Yn(e.id) && t.push(`Missing annotation id`),
    Yn(e.projectId) && t.push(`Missing projectId`),
    Yn(e.leftProjectAssetId) && t.push(`Missing leftProjectAssetId`),
    Yn(e.rightProjectAssetId) && t.push(`Missing rightProjectAssetId`);
  let n = Vn(e.leftProjectAssetId, e.rightProjectAssetId);
  e.pairKey !== n && t.push(`Mismatched pairKey: expected ${n}`),
    Number.isFinite(e.createdAt) || t.push(`Invalid annotation createdAt`),
    Number.isFinite(e.updatedAt) || t.push(`Invalid annotation updatedAt`);
  let r = new Set;
  for (let n of e.points)
    Yn(n.id) ? t.push(`Missing point id`) : r.has(n.id) ? t.push(`Duplicate point id: ${n.id}`) : r.add(n.id),
      Xn(n.left) || t.push(`Point ${n.id || `<missing>`} left is outside [0,1]`),
      Xn(n.right) || t.push(`Point ${n.id || `<missing>`} right is outside [0,1]`),
      Number.isFinite(n.createdAt) || t.push(`Invalid point ${n.id || `<missing>`} createdAt`),
      Number.isFinite(n.updatedAt) || t.push(`Invalid point ${n.id || `<missing>`} updatedAt`);
  return t
}
function Kn(e) {
  let t = e.map(e => ({
    id: e.id,
    projectId: e.projectId,
    leftProjectAssetId: e.leftProjectAssetId,
    rightProjectAssetId: e.rightProjectAssetId,
    pairKey: e.pairKey,
    points: e.points.map(e => ({
      id: e.id,
      left: Qn(e.left),
      right: Qn(e.right)
    })).sort(er)
  })).sort(er);
  return tr(JSON.stringify(t)).toString(16).padStart(8, `0`)
}
function qn(e) {
  return Number.isFinite(e) ? Math.min(1, Math.max(0, e)) : 0
}
function Jn(e) {
  return !Number.isFinite(e) || e <= 0 ? 0 : e
}
function Yn(e) {
  return e.trim().length === 0
}
function Xn(e) {
  return Zn(e.x) && Zn(e.y)
}
function Zn(e) {
  return Number.isFinite(e) && e >= 0 && e <= 1
}
function Qn(e) {
  return {
    x: $n(e.x),
    y: $n(e.y)
  }
}
function $n(e) {
  return Number.isFinite(e) ? Math.round(e * 1e6) / 1e6 : 0
}
function er(e, t) {
  let n = JSON.stringify(e)
    , r = JSON.stringify(t);
  return n < r ? -1 : +(n > r)
}
function tr(e) {
  let t = 2166136261;
  for (let n = 0; n < e.length; n += 1)
    t ^= e.charCodeAt(n),
      t = Math.imul(t, 16777619);
  return t >>> 0
}
var nr = 8
  , rr = [1, 0, 0, 0, 1, 0, 0, 0, 1]
  , ir = [0, 0, 0];
function ar(e, t, n) {
  let r = n.length;
  if (r < nr) {
    let e = nr - r;
    return {
      status: `needs-points`,
      requiredPoints: nr,
      pointCount: r,
      rotationDeg: null,
      medianParallaxDeg: null,
      medianReprojectionPx: null,
      triangulatedPoints: 0,
      unitBaseline: null,
      inlierCount: null,
      warnings: [`Add ${e} more point${e === 1 ? `` : `s`} to preview geometry.`]
    }
  }
  let i = sr(e, t, n);
  if (i)
    return or(r, i);
  let a = n.map(n => {
    let r = Un(n.left, e.width, e.height)
      , i = Un(n.right, t.width, t.height);
    return {
      leftX: r.x,
      leftY: r.y,
      rightX: i.x,
      rightY: i.y
    }
  }
  )
    , o = ge(e, t, lr(a, `left`), lr(a, `right`), a.map((e, t) => ({
      a: t,
      b: t,
      distance: 0
    })), 640, 3);
  if (!o)
    return or(r, `Could not estimate relative pose from the current manual points.`);
  let s = o.inliers
    , c = []
    , l = []
    , u = tt(o.R, o.t);
  for (let n of s) {
    let r = a[n.a];
    if (!r)
      continue;
    let [i, s] = ft(e.intrinsics, r.leftX, r.leftY)
      , [d, f] = ft(t.intrinsics, r.rightX, r.rightY)
      , p = rt(rr, ir, o.R, o.t, i, s, d, f);
    if (!p)
      continue;
    let m = ct(e, rr, ir, p)
      , h = ct(t, o.R, o.t, p)
      , g = fr(m[0], m[1], r.leftX, r.leftY)
      , _ = fr(h[0], h[1], r.rightX, r.rightY)
      , v = Math.max(g, _)
      , y = dr([0, 0, 0], u, p);
    Number.isFinite(v) && c.push(v),
      Number.isFinite(y) && l.push(y)
  }
  let d = ur(o.R)
    , f = pr(l)
    , p = pr(c)
    , m = mr(d, f, c.length, o.inliers.length, r);
  return {
    status: m.length > 0 ? `warning` : `ok`,
    requiredPoints: nr,
    pointCount: r,
    rotationDeg: d,
    medianParallaxDeg: f,
    medianReprojectionPx: p,
    triangulatedPoints: c.length,
    unitBaseline: 1,
    inlierCount: o.inliers.length,
    warnings: m
  }
}
function or(e, t) {
  return {
    status: `failed`,
    requiredPoints: nr,
    pointCount: e,
    rotationDeg: null,
    medianParallaxDeg: null,
    medianReprojectionPx: null,
    triangulatedPoints: 0,
    unitBaseline: null,
    inlierCount: null,
    warnings: [t]
  }
}
function sr(e, t, n) {
  let r = cr(e, `left`) ?? cr(t, `right`);
  if (r)
    return r;
  for (let e of n)
    if (!hr(e.left) || !hr(e.right))
      return `Manual point ${e.id || `<unknown>`} has invalid normalized coordinates.`;
  return null
}
function cr(e, t) {
  if (!_r(e.width) || !_r(e.height))
    return `Invalid ${t} frame dimensions for manual geometry preview.`;
  let n = e.intrinsics;
  return !_r(n.fx) || !_r(n.fy) || !Number.isFinite(n.cx) || !Number.isFinite(n.cy) || !vr(n.k1) || !vr(n.k2) || !vr(n.p1) || !vr(n.p2) ? `Invalid ${t} frame intrinsics for manual geometry preview.` : null
}
function lr(e, t) {
  let n = new Float32Array(e.length)
    , r = new Float32Array(e.length);
  for (let i = 0; i < e.length; i++)
    n[i] = t === `left` ? e[i].leftX : e[i].rightX,
      r[i] = t === `left` ? e[i].leftY : e[i].rightY;
  return {
    count: e.length,
    xs: n,
    ys: r,
    scores: new Float32Array(e.length),
    descriptors: new Uint32Array(e.length * 8),
    colors: new Uint8Array(e.length * 3)
  }
}
function ur(e) {
  let t = br((e[0] + e[4] + e[8] - 1) * .5, -1, 1);
  return Math.acos(t) * 180 / Math.PI
}
function dr(e, t, n) {
  let r = [n[0] - e[0], n[1] - e[1], n[2] - e[2]]
    , i = [n[0] - t[0], n[1] - t[1], n[2] - t[2]]
    , a = Math.hypot(...r) * Math.hypot(...i);
  if (a <= 1e-12)
    return NaN;
  let o = br(yr(r, i) / a, -1, 1);
  return Math.acos(o) * 180 / Math.PI
}
function fr(e, t, n, r) {
  return Math.hypot(e - n, t - r)
}
function pr(e) {
  let t = e.filter(Number.isFinite).sort((e, t) => e - t);
  if (t.length === 0)
    return null;
  let n = Math.floor(t.length / 2);
  return t.length % 2 == 1 ? t[n] : (t[n - 1] + t[n]) * .5
}
function mr(e, t, n, r, i) {
  let a = [];
  if (e > 25 && (t === null || t < 1) && a.push(`Rotation is steep while parallax is low; depth preview may be unstable.`),
    r < i) {
    let e = i - r
      , t = r / Math.max(1, i);
    a.push(t < .75 ? `${e} manual points were rejected as outliers; less than 75% support the geometry preview.` : `${e} manual point${e === 1 ? `` : `s`} were rejected as outliers.`)
  }
  return (n < nr || n < Math.ceil(i * .5)) && a.push(`Only ${n} of ${i} manual points triangulated cleanly for the preview.`),
    a
}
function hr(e) {
  return gr(e.x) && gr(e.y)
}
function gr(e) {
  return Number.isFinite(e) && e >= 0 && e <= 1
}
function _r(e) {
  return Number.isFinite(e) && e > 0
}
function vr(e) {
  return e === void 0 || Number.isFinite(e)
}
function yr(e, t) {
  return e[0] * t[0] + e[1] * t[1] + e[2] * t[2]
}
function br(e, t, n) {
  return Math.min(n, Math.max(t, e))
}
var xr = Sr();
function Sr() {
  let e = new Int8Array(256 * 4)
    , t = 305419896
    , n = () => (t ^= t << 13,
      t ^= t >>> 17,
      t ^= t << 5,
      t >>> 0);
  for (let t = 0; t < 256; t++)
    e[t * 4] = n() % 25 - 12,
      e[t * 4 + 1] = n() % 25 - 12,
      e[t * 4 + 2] = n() % 25 - 12,
      e[t * 4 + 3] = n() % 25 - 12;
  return e
}
var Cr;
async function wr() {
  let e = globalThis.navigator?.gpu;
  if (!e)
    return null;
  try {
    let t = await e.requestAdapter();
    if (!t)
      return null;
    let n = await t.requestDevice()
      , r = {
        adapter: t,
        device: n,
        limits: n.limits,
        lost: !1
      };
    return n.lost.then(() => {
      r.lost = !0
    }
    ),
      r
  } catch {
    return null
  }
}
function Tr() {
  if (Cr)
    return Cr;
  let e = wr().then(t => !t || t.lost ? (Cr === e && (Cr = void 0),
    null) : (t.device.lost.finally(() => {
      Cr === e && (Cr = void 0)
    }
    ),
      t)).catch(() => (Cr === e && (Cr = void 0),
        null));
  return Cr = e,
    e
}
function Er() {
  Cr = void 0
}
var Dr = 64;
function Or() {
  return `
struct Params {
  width: u32,
  height: u32,
  count: u32,
  _pad: u32
};

@group(0) @binding(0) var gray: texture_2d<f32>;
@group(0) @binding(1) var rgba: texture_2d<f32>;
@group(0) @binding(2) var<storage, read> keypoints: array<u32>;
@group(0) @binding(3) var<storage, read_write> descriptors: array<u32>;
@group(0) @binding(4) var<storage, read_write> colors: array<u32>;
@group(0) @binding(5) var<uniform> params: Params;

const BRIEF: array<vec4i, 256> = array<vec4i, 256>(
    ${Array.from({
    length: 256
  }, (e, t) => {
    let n = t * 4;
    return `vec4i(${xr[n]}, ${xr[n + 1]}, ${xr[n + 2]}, ${xr[n + 3]})`
  }
  ).join(`,
    `)}
);

fn clampCoord(v: i32, lo: i32, hi: i32) -> u32 {
  return u32(max(lo, min(hi, v)));
}

fn grayAt(x: u32, y: u32) -> u32 {
  return u32(round(textureLoad(gray, vec2<i32>(i32(x), i32(y)), 0).r * 255.0));
}

fn rgbAt(x: i32, y: i32) -> u32 {
  let texel = textureLoad(rgba, vec2<i32>(x, y), 0);
  let r = u32(round(texel.r * 255.0));
  let g = u32(round(texel.g * 255.0));
  let b = u32(round(texel.b * 255.0));
  return r | (g << 8u) | (b << 16u);
}

fn keypointX(v: u32) -> u32 {
  return v & 0xffffu;
}

fn keypointY(v: u32) -> u32 {
  return v >> 16u;
}

@compute @workgroup_size(${Dr}, 1, 1)
fn main(@builtin(global_invocation_id) gid: vec3u) {
  let idx = gid.x;
  if (idx >= params.count) {
    return;
  }

  let kp = keypoints[idx];
  let x = i32(keypointX(kp));
  let y = i32(keypointY(kp));
  let maxX = i32(params.width) - 1;
  let maxY = i32(params.height) - 1;

  var words = array<u32, 8>(0u, 0u, 0u, 0u, 0u, 0u, 0u, 0u);

  for (var bit = 0u; bit < 256u; bit = bit + 1u) {
    let p = BRIEF[bit];
    let ax = clampCoord(x + p.x, 0, maxX);
    let ay = clampCoord(y + p.y, 0, maxY);
    let bx = clampCoord(x + p.z, 0, maxX);
    let by = clampCoord(y + p.w, 0, maxY);

    if (grayAt(ax, ay) < grayAt(bx, by)) {
      let wordIndex = bit >> 5u;
      let bitIndex = bit & 31u;
      words[wordIndex] = words[wordIndex] | (1u << bitIndex);
    }
  }

  for (var w = 0u; w < 8u; w = w + 1u) {
    descriptors[idx * 8u + w] = words[w];
  }

  colors[idx] = rgbAt(x, y);
}
`
}
var kr = class e {
  device;
  pipeline;
  gray;
  grayView;
  rgba;
  rgbaView;
  keypoints;
  descriptors;
  colors;
  readback;
  params;
  grayWidth = 0;
  grayHeight = 0;
  rgbaWidth = 0;
  rgbaHeight = 0;
  keypointCapacity = 0;
  readbackBytes = 0;
  keypointScratch;
  paramsScratch = new Uint32Array(4);
  constructor(e, t) {
    this.device = e,
      this.pipeline = t
  }
  static async create(t) {
    try {
      let n = t ?? await Tr();
      if (!n || n.lost)
        return null;
      let { device: r } = n
        , i = r.createShaderModule({
          code: Or()
        });
      return new e(r, r.createComputePipeline({
        layout: `auto`,
        compute: {
          module: i,
          entryPoint: `main`
        }
      }))
    } catch {
      return null
    }
  }
  async describe(e, t) {
    return t.length === 0 ? {
      descriptors: new Uint32Array,
      colors: new Uint8Array
    } : (this.ensureFrameCapacity(e.width, e.height),
      !this.gray || !this.grayView || !this.rgba || !this.rgbaView ? null : (this.device.queue.writeTexture({
        texture: this.gray
      }, e.gray, {
        bytesPerRow: e.width,
        rowsPerImage: e.height
      }, {
        width: e.width,
        height: e.height,
        depthOrArrayLayers: 1
      }),
        this.device.queue.writeTexture({
          texture: this.rgba
        }, e.rgba, {
          bytesPerRow: e.width * 4,
          rowsPerImage: e.height
        }, {
          width: e.width,
          height: e.height,
          depthOrArrayLayers: 1
        }),
        this.describeFromTextures(this.grayView, this.rgbaView, e.width, e.height, t)))
  }
  async describeFrame(e, t) {
    return t.length === 0 ? {
      descriptors: new Uint32Array,
      colors: new Uint8Array
    } : e.rgbaView ? this.describeFromTextures(e.grayView, e.rgbaView, e.width, e.height, t) : null
  }
  async describeFromTextures(e, t, n, r, i) {
    let a = i.length;
    if (this.ensureKeypointCapacity(a),
      !this.keypoints || !this.descriptors || !this.colors || !this.readback || !this.params)
      return null;
    (!this.keypointScratch || this.keypointScratch.length < a) && (this.keypointScratch = new Uint32Array(this.keypointCapacity));
    for (let e = 0; e < a; e++) {
      let t = i[e].x & 65535
        , n = i[e].y & 65535;
      this.keypointScratch[e] = t | n << 16
    }
    this.paramsScratch[0] = n,
      this.paramsScratch[1] = r,
      this.paramsScratch[2] = a,
      this.paramsScratch[3] = 0,
      this.device.queue.writeBuffer(this.keypoints, 0, this.keypointScratch.subarray(0, a)),
      this.device.queue.writeBuffer(this.params, 0, this.paramsScratch);
    let o = this.device.createBindGroup({
      layout: this.pipeline.getBindGroupLayout(0),
      entries: [{
        binding: 0,
        resource: e
      }, {
        binding: 1,
        resource: t
      }, {
        binding: 2,
        resource: {
          buffer: this.keypoints
        }
      }, {
        binding: 3,
        resource: {
          buffer: this.descriptors
        }
      }, {
        binding: 4,
        resource: {
          buffer: this.colors
        }
      }, {
        binding: 5,
        resource: {
          buffer: this.params
        }
      }]
    }), s = a * 8 * 4, c = a * 4, l = Ar(s + c), u;
    try {
      u = this.device.createBuffer({
        size: s,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST
      })
    } catch {
      u = void 0
    }
    let d = this.device.createCommandEncoder()
      , f = d.beginComputePass();
    f.setPipeline(this.pipeline),
      f.setBindGroup(0, o),
      f.dispatchWorkgroups(Math.ceil(a / Dr)),
      f.end(),
      u && d.copyBufferToBuffer(this.descriptors, 0, u, 0, s),
      d.copyBufferToBuffer(this.descriptors, 0, this.readback, 0, s),
      d.copyBufferToBuffer(this.colors, 0, this.readback, s, c),
      this.device.queue.submit([d.finish()]);
    try {
      await this.readback.mapAsync(GPUMapMode.READ, 0, l);
      let e = this.readback.getMappedRange(0, l)
        , t = new Uint32Array(a * 8);
      t.set(new Uint32Array(e, 0, a * 8));
      let n = new Uint32Array(e, s, a)
        , r = new Uint8Array(a * 3);
      for (let e = 0; e < a; e++) {
        let t = n[e];
        r[e * 3 + 0] = t & 255,
          r[e * 3 + 1] = t >>> 8 & 255,
          r[e * 3 + 2] = t >>> 16 & 255
      }
      return this.readback.unmap(),
      {
        descriptors: t,
        colors: r,
        gpuDescriptors: u ? {
          device: this.device,
          buffer: u,
          count: a,
          words: a * 8
        } : void 0
      }
    } catch {
      try {
        this.readback.unmap()
      } catch { }
      return u?.destroy(),
        null
    }
  }
  ensureFrameCapacity(e, t) {
    (!this.gray || this.grayWidth < e || this.grayHeight < t) && (this.gray?.destroy(),
      this.grayWidth = e,
      this.grayHeight = t,
      this.gray = this.device.createTexture({
        size: {
          width: this.grayWidth,
          height: this.grayHeight,
          depthOrArrayLayers: 1
        },
        format: `r8unorm`,
        usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST
      }),
      this.grayView = this.gray.createView()),
      (!this.rgba || this.rgbaWidth < e || this.rgbaHeight < t) && (this.rgba?.destroy(),
        this.rgbaWidth = e,
        this.rgbaHeight = t,
        this.rgba = this.device.createTexture({
          size: {
            width: this.rgbaWidth,
            height: this.rgbaHeight,
            depthOrArrayLayers: 1
          },
          format: `rgba8unorm`,
          usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST
        }),
        this.rgbaView = this.rgba.createView())
  }
  ensureKeypointCapacity(e) {
    (!this.keypoints || this.keypointCapacity < e) && (this.keypoints?.destroy(),
      this.descriptors?.destroy(),
      this.colors?.destroy(),
      this.readback?.destroy(),
      this.keypointCapacity = jr(e),
      this.keypoints = this.device.createBuffer({
        size: this.keypointCapacity * 4,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
      }),
      this.descriptors = this.device.createBuffer({
        size: this.keypointCapacity * 8 * 4,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC
      }),
      this.colors = this.device.createBuffer({
        size: this.keypointCapacity * 4,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC
      }),
      this.readbackBytes = Ar(this.keypointCapacity * 8 * 4 + this.keypointCapacity * 4),
      this.readback = this.device.createBuffer({
        size: this.readbackBytes,
        usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST
      })),
      this.params ??= this.device.createBuffer({
        size: 16,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
      })
  }
}
  ;
function Ar(e) {
  return e + 3 & -4
}
function jr(e) {
  let t = 256;
  for (; t < e;)
    t *= 2;
  return t
}
var Mr = 16
  , Nr = `
struct ScoreParams {
  width: u32,
  height: u32,
  threshold: u32,
  _pad: u32,
};

@group(0) @binding(0) var gray: texture_2d<f32>;
@group(0) @binding(1) var<storage, read_write> scores: array<u32>;
@group(0) @binding(2) var<uniform> params: ScoreParams;

fn pix(x: i32, y: i32) -> u32 {
  return u32(round(textureLoad(gray, vec2<i32>(x, y), 0).r * 255.0));
}

@compute @workgroup_size(16, 16)
fn main(@builtin(global_invocation_id) gid: vec3<u32>) {
  if (gid.x >= params.width || gid.y >= params.height) {
    return;
  }
  let x = i32(gid.x);
  let y = i32(gid.y);
  let outIndex = gid.y * params.width + gid.x;
  if (x < 3 || y < 3 || x >= i32(params.width) - 3 || y >= i32(params.height) - 3) {
    scores[outIndex] = 0u;
    return;
  }

  let c = i32(pix(x, y));
  let t = i32(params.threshold);
  // Cheap necessary FAST-9 precheck. Any 9-pixel contiguous arc on the
  // 16-pixel circle must include at least two of the four cardinal samples
  // (0, 4, 8, 12) in the same bright/dark class. Using three here would be
  // too strict for FAST-9 and reject valid arcs such as positions 1..9.
  let d0 = i32(pix(x, y - 3)) - c;
  let d4 = i32(pix(x + 3, y)) - c;
  let d8 = i32(pix(x, y + 3)) - c;
  let d12 = i32(pix(x - 3, y)) - c;
  var bright4 = 0u;
  var dark4 = 0u;
  if (d0 > t) { bright4 = bright4 + 1u; } else if (d0 < -t) { dark4 = dark4 + 1u; }
  if (d4 > t) { bright4 = bright4 + 1u; } else if (d4 < -t) { dark4 = dark4 + 1u; }
  if (d8 > t) { bright4 = bright4 + 1u; } else if (d8 < -t) { dark4 = dark4 + 1u; }
  if (d12 > t) { bright4 = bright4 + 1u; } else if (d12 < -t) { dark4 = dark4 + 1u; }
  if (bright4 < 2u && dark4 < 2u) {
    scores[outIndex] = 0u;
    return;
  }
  // True FAST-9 needs nine *contiguous* bright (or dark) pixels on the
  // 16-pixel Bresenham circle, not just nine somewhere on it. We build
  // 16-bit cyclic masks and check for a 9-bit run via the same rolling AND
  // trick used on the CPU path so the two scorers agree bit-for-bit.
  var brightMask: u32 = 0u;
  var darkMask: u32 = 0u;
  var contrast: u32 = 0u;
  let xs = array<i32, 16>(0, 1, 2, 3, 3, 3, 2, 1, 0, -1, -2, -3, -3, -3, -2, -1);
  let ys = array<i32, 16>(-3, -3, -2, -1, 0, 1, 2, 3, 3, 3, 2, 1, 0, -1, -2, -3);
  for (var i = 0u; i < 16u; i = i + 1u) {
    let d = i32(pix(x + xs[i], y + ys[i])) - c;
    if (d > t) { brightMask = brightMask | (1u << i); }
    else if (d < -t) { darkMask = darkMask | (1u << i); }
    contrast = contrast + u32(abs(d));
  }
  if (fastArc9(brightMask) || fastArc9(darkMask)) {
    scores[outIndex] = contrast;
  } else {
    scores[outIndex] = 0u;
  }
}

// Returns true when the 16-bit cyclic mask contains nine consecutive set
// bits. Mirrors hasContiguousArc9 in src/features.ts so the CPU and GPU
// detectors stay bit-identical.
fn fastArc9(bits: u32) -> bool {
  let cyclic = bits | (bits << 16u);
  var arc = cyclic;
  arc = arc & (arc >> 1u);
  arc = arc & (arc >> 1u);
  arc = arc & (arc >> 1u);
  arc = arc & (arc >> 1u);
  arc = arc & (arc >> 1u);
  arc = arc & (arc >> 1u);
  arc = arc & (arc >> 1u);
  arc = arc & (arc >> 1u);
  return (arc & 0xffffu) != 0u;
}
`
  , Pr = `
struct CollectParams {
  width: u32,
  height: u32,
  capacity: u32,
  margin: u32,
  minScore: u32,
  _pad0: u32,
  _pad1: u32,
  _pad2: u32,
};

@group(0) @binding(0) var<storage, read> scores: array<u32>;
@group(0) @binding(1) var<storage, read_write> counter: array<atomic<u32>>;
@group(0) @binding(2) var<storage, read_write> outBuf: array<u32>;
@group(0) @binding(3) var<uniform> params: CollectParams;

fn at(x: u32, y: u32) -> u32 {
  return scores[y * params.width + x];
}

@compute @workgroup_size(16, 16)
fn collect(@builtin(global_invocation_id) gid: vec3<u32>) {
  let x = gid.x;
  let y = gid.y;
  if (x >= params.width || y >= params.height) { return; }
  if (x < params.margin || y < params.margin) { return; }
  if (x + params.margin >= params.width || y + params.margin >= params.height) { return; }
  let s = at(x, y);
  if (s <= params.minScore) { return; }
  // 4-neighborhood NMS — preserves the previous CPU semantics (>= ties allowed).
  if (s < at(x - 1u, y)) { return; }
  if (s < at(x + 1u, y)) { return; }
  if (s < at(x, y - 1u)) { return; }
  if (s < at(x, y + 1u)) { return; }
  let slot = atomicAdd(&counter[0], 1u);
  if (slot >= params.capacity) { return; }
  let off = slot * 3u;
  outBuf[off] = x;
  outBuf[off + 1u] = y;
  outBuf[off + 2u] = s;
}
`
  , Fr = 32768
  , Ir = 262144
  , Lr = .05
  , Rr = 16
  , zr = class e {
    device;
    scorePipeline;
    collectPipeline;
    input;
    inputView;
    scores;
    params;
    collectParams;
    counter;
    outBuf;
    counterReadback;
    outReadback;
    capacity = 0;
    collectCapacity = 0;
    collectBytes = 0;
    inputWidth = 0;
    inputHeight = 0;
    scoreParamBytes = 16;
    collectParamBytes = 32;
    scoreParamScratch = new Uint32Array(4);
    collectParamScratch = new ArrayBuffer(32);
    collectParamScratchU32 = new Uint32Array(this.collectParamScratch);
    counterZero = new Uint32Array([0]);
    constructor(e, t, n) {
      this.device = e,
        this.scorePipeline = t,
        this.collectPipeline = n
    }
    static async create(t) {
      try {
        let n = t ?? await Tr();
        if (!n || n.lost)
          return null;
        let { device: r } = n;
        return new e(r, r.createComputePipeline({
          layout: `auto`,
          compute: {
            module: r.createShaderModule({
              code: Nr
            }),
            entryPoint: `main`
          }
        }), r.createComputePipeline({
          layout: `auto`,
          compute: {
            module: r.createShaderModule({
              code: Pr
            }),
            entryPoint: `collect`
          }
        }))
      } catch {
        return null
      }
    }
    async scoreAndCollect(e, t, n, r, i = 0) {
      let a = t * n
        , o = Br(Math.ceil(a * Lr), Fr, Ir);
      if (this.ensureCapacity(t, n, a, o, !0),
        !this.input || !this.inputView)
        throw Error(`WebGPU corner scorer input texture is not initialised`);
      return this.device.queue.writeTexture({
        texture: this.input
      }, e, {
        bytesPerRow: t,
        rowsPerImage: n
      }, {
        width: t,
        height: n,
        depthOrArrayLayers: 1
      }),
        this.scoreAndCollectFromGrayTexture(this.inputView, t, n, r, i)
    }
    async scoreAndCollectFrame(e, t, n = 0) {
      let r = Br(Math.ceil(e.pixelCount * Lr), Fr, Ir);
      return this.ensureCapacity(e.width, e.height, e.pixelCount, r, !1),
        this.scoreAndCollectFromGrayTexture(e.grayView, e.width, e.height, t, n)
    }
    async scoreAndCollectFromGrayTexture(e, t, n, r, i) {
      if (!this.scores || !this.params || !this.collectParams || !this.counter || !this.outBuf || !this.counterReadback || !this.outReadback)
        throw Error(`WebGPU corner scorer buffers are not initialised`);
      this.scoreParamScratch[0] = t,
        this.scoreParamScratch[1] = n,
        this.scoreParamScratch[2] = r,
        this.scoreParamScratch[3] = 0,
        this.device.queue.writeBuffer(this.params, 0, this.scoreParamScratch),
        this.collectParamScratchU32[0] = t,
        this.collectParamScratchU32[1] = n,
        this.collectParamScratchU32[2] = this.collectCapacity,
        this.collectParamScratchU32[3] = Rr,
        this.collectParamScratchU32[4] = Math.max(0, Math.round(i)),
        this.device.queue.writeBuffer(this.collectParams, 0, this.collectParamScratch),
        this.device.queue.writeBuffer(this.counter, 0, this.counterZero);
      let a = this.device.createBindGroup({
        layout: this.scorePipeline.getBindGroupLayout(0),
        entries: [{
          binding: 0,
          resource: e
        }, {
          binding: 1,
          resource: {
            buffer: this.scores
          }
        }, {
          binding: 2,
          resource: {
            buffer: this.params
          }
        }]
      })
        , o = this.device.createBindGroup({
          layout: this.collectPipeline.getBindGroupLayout(0),
          entries: [{
            binding: 0,
            resource: {
              buffer: this.scores
            }
          }, {
            binding: 1,
            resource: {
              buffer: this.counter
            }
          }, {
            binding: 2,
            resource: {
              buffer: this.outBuf
            }
          }, {
            binding: 3,
            resource: {
              buffer: this.collectParams
            }
          }]
        })
        , s = this.device.createCommandEncoder();
      {
        let e = s.beginComputePass();
        e.setPipeline(this.scorePipeline),
          e.setBindGroup(0, a),
          e.dispatchWorkgroups(Math.ceil(t / Mr), Math.ceil(n / Mr)),
          e.end()
      }
      {
        let e = s.beginComputePass();
        e.setPipeline(this.collectPipeline),
          e.setBindGroup(0, o),
          e.dispatchWorkgroups(Math.ceil(t / Mr), Math.ceil(n / Mr)),
          e.end()
      }
      s.copyBufferToBuffer(this.counter, 0, this.counterReadback, 0, 4),
        s.copyBufferToBuffer(this.outBuf, 0, this.outReadback, 0, this.collectBytes),
        this.device.queue.submit([s.finish()]),
        await Promise.all([this.counterReadback.mapAsync(GPUMapMode.READ, 0, 4), this.outReadback.mapAsync(GPUMapMode.READ, 0, this.collectBytes)]);
      let c = new Uint32Array(this.counterReadback.getMappedRange(0, 4))[0]
        , l = Math.min(c, this.collectCapacity)
        , u = new Int32Array(l)
        , d = new Int32Array(l)
        , f = new Float32Array(l);
      if (l > 0) {
        let e = l * 12
          , t = this.outReadback.getMappedRange(0, e)
          , n = new Uint32Array(t);
        for (let e = 0; e < l; e++)
          u[e] = n[e * 3] | 0,
            d[e] = n[e * 3 + 1] | 0,
            f[e] = n[e * 3 + 2]
      }
      return this.counterReadback.unmap(),
        this.outReadback.unmap(),
      {
        count: l,
        xs: u,
        ys: d,
        scores: f,
        detected: c,
        overflow: c > l,
        capacity: this.collectCapacity
      }
    }
    ensureCapacity(e, t, n, r, i) {
      let a = n > this.capacity
        , o = r > this.collectCapacity
        , s = i && (!this.input || !this.inputView || this.inputWidth < e || this.inputHeight < t)
        , c = this.scores && (!i || this.input && this.inputView);
      if (!a && !o && !s && c && this.outBuf && this.outReadback) {
        this.params ??= this.makeParamsBuffer(),
          this.collectParams ??= this.makeCollectParamsBuffer(),
          this.counter ??= this.makeCounterBuffer(),
          this.counterReadback ??= this.makeCounterReadback();
        return
      }
      a && (this.scores?.destroy(),
        this.capacity = Math.ceil(n * 1.2),
        this.scores = this.device.createBuffer({
          size: this.capacity * 4,
          usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC
        })),
        s && (this.input?.destroy(),
          this.inputWidth = e,
          this.inputHeight = t,
          this.input = this.makeInputTexture(e, t),
          this.inputView = this.input.createView()),
        o && (this.outBuf?.destroy(),
          this.outReadback?.destroy(),
          this.collectCapacity = r,
          this.collectBytes = this.collectCapacity * 12,
          this.outBuf = this.device.createBuffer({
            size: this.collectBytes,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC
          }),
          this.outReadback = this.device.createBuffer({
            size: this.collectBytes,
            usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST
          })),
        this.params ??= this.makeParamsBuffer(),
        this.collectParams ??= this.makeCollectParamsBuffer(),
        this.counter ??= this.makeCounterBuffer(),
        this.counterReadback ??= this.makeCounterReadback()
    }
    makeInputTexture(e, t) {
      return this.device.createTexture({
        size: {
          width: e,
          height: t,
          depthOrArrayLayers: 1
        },
        format: `r8unorm`,
        usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST
      })
    }
    makeParamsBuffer() {
      return this.device.createBuffer({
        size: this.scoreParamBytes,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
      })
    }
    makeCollectParamsBuffer() {
      return this.device.createBuffer({
        size: this.collectParamBytes,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
      })
    }
    makeCounterBuffer() {
      return this.device.createBuffer({
        size: 4,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST
      })
    }
    makeCounterReadback() {
      return this.device.createBuffer({
        size: 4,
        usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST
      })
    }
  }
  ;
function Br(e, t, n) {
  return Math.max(t, Math.min(n, Math.round(e)))
}
var Vr = class {
  device;
  gray;
  grayView;
  rgba;
  rgbaView;
  width = 0;
  height = 0;
  pixelCount = 0;
  grayWidth = 0;
  grayHeight = 0;
  rgbaWidth = 0;
  rgbaHeight = 0;
  constructor(e) {
    this.device = e.device
  }
  upload(e, t) {
    let n = e.width * e.height;
    if (this.ensureCapacity(e.width, e.height, t),
      this.width = e.width,
      this.height = e.height,
      this.pixelCount = n,
      this.device.queue.writeTexture({
        texture: this.gray
      }, e.gray, {
        bytesPerRow: e.width,
        rowsPerImage: e.height
      }, {
        width: e.width,
        height: e.height,
        depthOrArrayLayers: 1
      }),
      t) {
      if (!this.rgba)
        throw Error(`GPU RGBA frame buffer was not allocated`);
      this.device.queue.writeTexture({
        texture: this.rgba
      }, e.rgba, {
        bytesPerRow: e.width * 4,
        rowsPerImage: e.height
      }, {
        width: e.width,
        height: e.height,
        depthOrArrayLayers: 1
      })
    }
  }
  destroy() {
    this.gray?.destroy(),
      this.rgba?.destroy(),
      this.grayWidth = 0,
      this.grayHeight = 0,
      this.rgbaWidth = 0,
      this.rgbaHeight = 0,
      this.pixelCount = 0
  }
  ensureCapacity(e, t, n) {
    (!this.gray || this.grayWidth < e || this.grayHeight < t) && (this.gray?.destroy(),
      this.grayWidth = e,
      this.grayHeight = t,
      this.gray = this.device.createTexture({
        size: {
          width: this.grayWidth,
          height: this.grayHeight,
          depthOrArrayLayers: 1
        },
        format: `r8unorm`,
        usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST
      }),
      this.grayView = this.gray.createView()),
      n && (!this.rgba || this.rgbaWidth < e || this.rgbaHeight < t) && (this.rgba?.destroy(),
        this.rgbaWidth = e,
        this.rgbaHeight = t,
        this.rgba = this.device.createTexture({
          size: {
            width: this.rgbaWidth,
            height: this.rgbaHeight,
            depthOrArrayLayers: 1
          },
          format: `rgba8unorm`,
          usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST
        }),
        this.rgbaView = this.rgba.createView())
  }
}
  ;
function Hr(e, t) {
  let n = Math.max(1, Math.floor(e))
    , r = Math.max(1, Math.floor(t));
  return {
    width: n,
    height: r,
    data: new Uint8Array(n * r)
  }
}
function Ur(e) {
  return {
    width: e.width,
    height: e.height,
    data: new Uint8Array(e.data)
  }
}
function Wr(e) {
  let t = qr(e.data);
  return t.length < e.data.length ? {
    width: e.width,
    height: e.height,
    encoding: `rle`,
    bytes: t
  } : {
    width: e.width,
    height: e.height,
    encoding: `raw`,
    bytes: new Uint8Array(e.data)
  }
}
function Gr(e) {
  let t = Math.max(1, Math.floor(e.width)), n = Math.max(1, Math.floor(e.height)), r = t * n, i;
  return e.encoding === `rle` ? i = Jr(e.bytes, r) : e.bytes.length === r ? i = new Uint8Array(e.bytes) : (i = new Uint8Array(r),
    i.set(e.bytes.subarray(0, r))),
  {
    width: t,
    height: n,
    data: i
  }
}
function Kr(e) {
  if (typeof e != `object` || !e)
    return !1;
  let t = e;
  return Number.isInteger(t.width) && Number.isInteger(t.height) && (t.encoding === `raw` || t.encoding === `rle`) && t.bytes instanceof Uint8Array
}
function qr(e) {
  let t = []
    , n = 0;
  for (; n < e.length;) {
    let r = e[n]
      , i = 1;
    for (; n + i < e.length && e[n + i] === r && i < 4294967295;)
      i++;
    t.push(r);
    let a = i;
    for (; a >= 128;)
      t.push(a & 127 | 128),
        a >>>= 7;
    t.push(a),
      n += i
  }
  return Uint8Array.from(t)
}
function Jr(e, t) {
  let n = new Uint8Array(t)
    , r = 0
    , i = 0;
  for (; i < e.length && r < t;) {
    let a = e[i++]
      , o = 0
      , s = 0;
    for (; i < e.length;) {
      let t = e[i++];
      if (o |= (t & 127) << s,
        !(t & 128))
        break;
      s += 7
    }
    o >>>= 0;
    let c = Math.min(t, r + o);
    a !== 0 && n.fill(a, r, c),
      r = c
  }
  return n
}
function Yr(e, t, n, r, i) {
  let a = Math.max(0, r)
    , o = a * a
    , s = Math.max(0, Math.floor(t - a))
    , c = Math.min(e.width - 1, Math.ceil(t + a))
    , l = Math.max(0, Math.floor(n - a))
    , u = Math.min(e.height - 1, Math.ceil(n + a))
    , d = +!!i;
  for (let r = l; r <= u; r++)
    for (let i = s; i <= c; i++) {
      let a = i - t
        , s = r - n;
      a * a + s * s <= o && (e.data[r * e.width + i] = d)
    }
}
function Xr(e) {
  if (!e)
    return !1;
  for (let t of e.data)
    if (t !== 0)
      return !0;
  return !1
}
function Zr(e, t, n, r, i, a = 16) {
  if (!e || e.width <= 0 || e.height <= 0 || e.data.length < e.width * e.height)
    return !1;
  let o = t / Math.max(1, r) * e.width
    , s = n / Math.max(1, i) * e.height
    , c = Math.max(0, a) * (e.width / Math.max(1, r))
    , l = Math.max(0, a) * (e.height / Math.max(1, i))
    , u = Math.max(0, Math.floor(o - c))
    , d = Math.min(e.width - 1, Math.ceil(o + c))
    , f = Math.max(0, Math.floor(s - l))
    , p = Math.min(e.height - 1, Math.ceil(s + l));
  for (let t = f; t <= p; t++) {
    let n = t * e.width;
    for (let t = u; t <= d; t++)
      if (e.data[n + t] !== 0)
        return !0
  }
  return !1
}
function Qr(e) {
  let t = 2166136261
    , n = 0;
  for (let r = 0; r < e.length; r++) {
    let i = e[r];
    if (Xr(i)) {
      n++,
        t = $r(t, r & 255),
        t = $r(t, r >>> 8 & 255),
        t = $r(t, i.width & 255),
        t = $r(t, i.width >>> 8 & 255),
        t = $r(t, i.height & 255),
        t = $r(t, i.height >>> 8 & 255);
      for (let e of i.data)
        t = $r(t, e)
    }
  }
  return n === 0 ? `nomask` : `mask:${n}:${t.toString(16).padStart(8, `0`)}`
}
function $r(e, t) {
  return e ^= t & 255,
    Math.imul(e, 16777619) >>> 0
}
var ei = new Int8Array([0, 1, 2, 3, 3, 3, 2, 1, 0, -1, -2, -3, -3, -3, -2, -1])
  , ti = new Int8Array([-3, -3, -2, -1, 0, 1, 2, 3, 3, 3, 2, 1, 0, -1, -2, -3])
  , ni = 4
  , ri = class {
    scorer = null;
    scorerReady;
    describer = null;
    describerReady;
    contextReady;
    gpuFrameBuffers;
    async extractAll(e, t, n) {
      let r = t.useGpu !== !1 && t.useWebGpuFastBrief === !0;
      r && this.scorerReady === void 0 && (this.contextReady ??= Tr(),
        this.scorerReady = this.contextReady.then(e => zr.create(e)).catch(() => null)),
        r && this.describerReady === void 0 && (this.contextReady ??= Tr(),
          this.describerReady = this.contextReady.then(e => kr.create(e)).catch(() => null)),
        this.scorer = r ? await this.scorerReady ?? null : null,
        this.describer = r ? await this.describerReady ?? null : null;
      let i = r && this.contextReady ? await this.contextReady ?? null : null
        , a = i?.lost ? null : i
        , o = []
        , s = !1
        , c = i?.lost === !0;
      c && this.invalidateGpuState();
      for (let r = 0; r < e.length; r++) {
        let i = e[r]
          , l = t.masks?.[r] ?? null
          , u = null
          , d = `CPU pyramid+oriented BRIEF`;
        if (this.scorer && !c)
          try {
            let e = null;
            a && (this.gpuFrameBuffers ??= new Vr(a),
              this.gpuFrameBuffers.upload(i, this.describer !== null),
              e = this.gpuFrameBuffers);
            let r = e ? await this.scorer.scoreAndCollectFrame(e, t.threshold) : await this.scorer.scoreAndCollect(i.gray, i.width, i.height, t.threshold);
            r.overflow && n(`${i.name}: GPU corner buffer overflow (${r.detected} detected, kept ${r.count} / capacity ${r.capacity}); raise FAST threshold or downscale input for a deterministic top-K.`);
            let o = ci(i, r, t.maxFeatures, l);
            if (this.describer)
              try {
                let t = e ? await this.describer.describeFrame(e, o) : await this.describer.describe(i, o);
                t && t.descriptors.length === o.length * 8 && t.colors.length === o.length * 3 ? (u = gi(o, t),
                  d = `WebGPU score+NMS+BRIEF`) : (n(`${i.name}: GPU BRIEF descriptor extraction failed; falling back to CPU BRIEF for the remaining frames.`),
                    this.invalidateGpuState(),
                    c = !0)
              } catch (e) {
                n(`${i.name}: GPU BRIEF descriptor extraction failed (${e?.message ?? `unknown error`}); falling back to CPU BRIEF for the remaining frames.`),
                  this.invalidateGpuState(),
                  c = !0
              }
            if (!u) {
              let e = hi(i, o, t.maxFeatures, t.briefDescriptorWriter);
              u = e,
                d = e.briefBackend === `wasm` ? `WebGPU score+NMS, Wasm BRIEF` : `WebGPU score+NMS, CPU BRIEF`
            }
            s = !0
          } catch (e) {
            n(`${i.name}: GPU corner scoring failed (${e?.message ?? `unknown error`}); falling back to CPU for the remaining frames.`),
              this.invalidateGpuState(),
              c = !0
          }
        if (!u) {
          let e = li(i, t.threshold, t.maxFeatures, l, t.pyramidOctaves ?? ni, t.fastScoreWriter, t.briefDescriptorWriter);
          u = e,
            d = mi(e.fastBackend, e.briefBackend)
        }
        o.push(u),
          n(`${i.name}: ${u.count} features (${d})`),
          await ii()
      }
      return {
        features: o,
        usedGpu: s
      }
    }
    invalidateGpuState() {
      this.scorer = null,
        this.scorerReady = void 0,
        this.describer = null,
        this.describerReady = void 0,
        this.contextReady = void 0,
        this.gpuFrameBuffers?.destroy(),
        this.gpuFrameBuffers = void 0,
        Er()
    }
  }
  ;
function ii() {
  return new Promise(e => {
    let t = globalThis.requestAnimationFrame;
    typeof t == `function` ? t(() => e()) : setTimeout(e, 0)
  }
  )
}
function ai(e, t, n, r) {
  let i = new Float32Array(t * n);
  for (let a = 3; a < n - 3; a++) {
    let n = a * t;
    for (let o = 3; o < t - 3; o++) {
      let s = e[n + o]
        , c = 0
        , l = 0
        , u = 0;
      for (let n = 0; n < 16; n++) {
        let i = e[(a + ti[n]) * t + o + ei[n]] - s;
        i > r ? c |= 1 << n : i < -r && (l |= 1 << n),
          u += Math.abs(i)
      }
      (si(c) || si(l)) && (i[n + o] = u)
    }
  }
  return i
}
function oi(e, t, n, r, i) {
  if (i) {
    let a = new Float32Array(t * n);
    try {
      if (i.writeFast9Scores(e, t, n, r, a))
        return {
          scores: a,
          backend: `wasm`
        }
    } catch { }
  }
  return {
    scores: ai(e, t, n, r),
    backend: `cpu`
  }
}
function si(e) {
  let t = (e | e << 16) >>> 0;
  return t &= t >>> 1,
    t &= t >>> 1,
    t &= t >>> 1,
    t &= t >>> 1,
    t &= t >>> 1,
    t &= t >>> 1,
    t &= t >>> 1,
    t &= t >>> 1,
    (t & 65535) != 0
}
function ci(e, t, n, r) {
  let i = e.width
    , a = e.height
    , o = Math.ceil(i / 24)
    , s = Math.ceil(a / 24)
    , c = Math.max(2, Math.ceil(n / Math.max(1, o * s)))
    , l = Array.from({
      length: o * s
    }, () => []);
  for (let e = 0; e < t.count; e++) {
    let n = t.xs[e]
      , u = t.ys[e];
    if (n < 16 || u < 16 || n >= i - 16 || u >= a - 16 || Zr(r, n, u, i, a, 16))
      continue;
    let d = Math.min(o - 1, Math.max(0, Math.floor(n / 24)));
    yi(l[Math.min(s - 1, Math.max(0, Math.floor(u / 24))) * o + d], {
      x: n,
      y: u,
      score: t.scores[e]
    }, c)
  }
  let u = [];
  for (let e of l)
    u.push(...e);
  return bi(u, n)
}
function li(e, t, n, r, i, a, o) {
  let s = ui(e.gray, e.width, e.height, i).filter(e => e.width > 32 && e.height > 32);
  if (s.length === 0)
    return {
      ...hi(e, [], n, o),
      fastBackend: `cpu`
    };
  let c = Math.max(1, Math.floor(Math.max(1, n) / s.length))
    , l = []
    , u = !1;
  for (let n of s) {
    let i = null;
    if (!r && a?.collectFast9GridCandidates)
      try {
        let e = a.collectFast9GridCandidates(n.gray, n.width, n.height, t, n.scale, c);
        e && (i = fi(e, n.scale),
          u = !0)
      } catch { }
    if (!i) {
      let o = oi(n.gray, n.width, n.height, t, a);
      o.backend === `wasm` && (u = !0),
        i = pi(e, o.scores, n.width, n.height, n.scale, c, r)
    }
    l.push(...bi(i, c))
  }
  return {
    ...hi(e, bi(xi(l), n), n, o),
    fastBackend: u ? `wasm` : `cpu`
  }
}
function ui(e, t, n, r) {
  let i = Hi(Math.floor(r), 1, 6)
    , a = [{
      gray: e,
      width: t,
      height: n,
      scale: 1
    }]
    , o = a[0];
  for (let e = 1; e < i && !(o.width < 48 || o.height < 48); e++) {
    let e = Math.floor(o.width / 2)
      , t = Math.floor(o.height / 2);
    if (e < 24 || t < 24)
      break;
    o = {
      gray: di(o.gray, o.width, o.height, e, t),
      width: e,
      height: t,
      scale: o.scale * 2
    },
      a.push(o)
  }
  return a
}
function di(e, t, n, r, i) {
  let a = new Uint8Array(r * i);
  for (let o = 0; o < i; o++) {
    let i = o * 2
      , s = Math.min(n - 1, i + 1);
    for (let n = 0; n < r; n++) {
      let c = n * 2
        , l = Math.min(t - 1, c + 1);
      a[o * r + n] = e[i * t + c] + e[i * t + l] + e[s * t + c] + e[s * t + l] + 2 >> 2
    }
  }
  return a
}
function fi(e, t) {
  let n = Math.min(Math.max(0, Math.floor(e.count)), e.xs.length, e.ys.length, e.scores.length)
    , r = [];
  for (let i = 0; i < n; i++)
    r.push({
      x: e.xs[i] * t,
      y: e.ys[i] * t,
      score: e.scores[i],
      scale: t
    });
  return r
}
function pi(e, t, n, r, i, a, o) {
  let s = Math.ceil(n / 24)
    , c = Math.ceil(r / 24)
    , l = Math.max(2, Math.ceil(a / (s * c)))
    , u = [];
  for (let a = 0; a < c; a++)
    for (let c = 0; c < s; c++) {
      let s = []
        , d = Math.max(3, Math.ceil(16 / i))
        , f = Math.max(d, c * 24)
        , p = Math.max(d, a * 24)
        , m = Math.min(n - d, (c + 1) * 24)
        , h = Math.min(r - d, (a + 1) * 24);
      if (!(m <= f || h <= p)) {
        for (let r = p; r < h; r++)
          for (let a = f; a < m; a++) {
            let c = t[r * n + a];
            if (c <= 0 || s.length >= l && c <= s[s.length - 1].score)
              continue;
            let u = a * i
              , d = r * i;
            Zr(o, u, d, e.width, e.height, 16) || vi(t, n, a, r, c) && yi(s, {
              x: u,
              y: d,
              score: c,
              scale: i
            }, l)
          }
        u.push(...s)
      }
    }
  return u
}
function mi(e, t) {
  return e === `wasm` && t === `wasm` ? `CPU pyramid+Wasm FAST+Wasm oriented BRIEF` : e === `wasm` ? `CPU pyramid+Wasm FAST+oriented BRIEF` : t === `wasm` ? `CPU pyramid+Wasm oriented BRIEF` : `CPU pyramid+oriented BRIEF`
}
function hi(e, t, n, r) {
  let i = Math.min(n, t.length)
    , a = new Float32Array(i)
    , o = new Float32Array(i)
    , s = new Float32Array(i)
    , c = new Float32Array(i)
    , l = new Float32Array(i)
    , u = new Uint32Array(i * 8)
    , d = new Uint8Array(i * 3);
  for (let n = 0; n < i; n++) {
    let r = t[n]
      , i = Oi(r.scale) ? r.scale : 1
      , u = r.orientation !== void 0 && Number.isFinite(r.orientation) ? r.orientation : ki(e.gray, e.width, e.height, r.x, r.y, i);
    a[n] = r.x,
      o[n] = r.y,
      s[n] = i,
      c[n] = u,
      l[n] = r.score,
      _i(e, r.x, r.y, d, n)
  }
  let f = i > 0 && r?.writeOrientedBriefDescriptors(e.gray, e.width, e.height, a, o, s, c, u, i) === !0;
  if (!f)
    for (let t = 0; t < i; t++)
      Ai(e.gray, e.width, e.height, a[t], o[t], u, t * 8, s[t], c[t]);
  return {
    count: i,
    xs: a,
    ys: o,
    scales: s,
    orientations: c,
    scores: l,
    descriptors: u,
    colors: d,
    briefBackend: f ? `wasm` : `cpu`
  }
}
function gi(e, t) {
  let n = e.length
    , r = new Float32Array(n)
    , i = new Float32Array(n)
    , a = new Float32Array(n)
    , o = new Float32Array(n)
    , s = new Float32Array(n);
  for (let t = 0; t < n; t++)
    r[t] = e[t].x,
      i[t] = e[t].y,
      a[t] = Oi(e[t].scale) ? e[t].scale : 1,
      o[t] = Number.isFinite(e[t].orientation) ? e[t].orientation : 0,
      s[t] = e[t].score;
  return {
    count: n,
    xs: r,
    ys: i,
    scales: a,
    orientations: o,
    scores: s,
    descriptors: t.descriptors,
    gpuDescriptors: t.gpuDescriptors,
    colors: t.colors
  }
}
function _i(e, t, n, r, i) {
  let a = Math.max(0, Math.min(e.width - 1, t | 0))
    , o = (Math.max(0, Math.min(e.height - 1, n | 0)) * e.width + a) * 4
    , s = i * 3;
  r[s] = e.rgba[o],
    r[s + 1] = e.rgba[o + 1],
    r[s + 2] = e.rgba[o + 2]
}
function vi(e, t, n, r, i) {
  let a = r * t + n;
  return i >= e[a - 1] && i >= e[a + 1] && i >= e[a - t] && i >= e[a + t]
}
function yi(e, t, n) {
  let r = 0;
  for (; r < e.length && e[r].score > t.score;)
    r++;
  r >= n || (e.splice(r, 0, t),
    e.length > n && e.pop())
}
function bi(e, t) {
  if (!Number.isFinite(t) || t <= 0)
    return [];
  let n = Math.min(Math.floor(t), e.length)
    , r = Array(n)
    , i = new Int32Array(n)
    , a = 0;
  for (let t = 0; t < e.length; t++) {
    let o = e[t];
    if (a < n) {
      r[a] = o,
        i[a] = t,
        Ti(r, i, a),
        a++;
      continue
    }
    Ci(o, t, r[0], i[0]) && (r[0] = o,
      i[0] = t,
      Ei(r, i, 0, a))
  }
  return Si(r, a, i)
}
function xi(e) {
  let t = new Map;
  for (let n = 0; n < e.length; n++) {
    let r = e[n]
      , i = `${Math.round(r.x * 1024)}:${Math.round(r.y * 1024)}`
      , a = t.get(i);
    (!a || Ci(r, n, a.candidate, a.sourceIndex)) && t.set(i, {
      candidate: r,
      sourceIndex: n
    })
  }
  return Array.from(t.values(), e => e.candidate)
}
function Si(e, t, n) {
  for (let r = t - 1; r > 0; r--)
    Di(e, n, 0, r),
      Ei(e, n, 0, r);
  return e
}
function Ci(e, t, n, r) {
  return e.score > n.score || e.score === n.score && t < r
}
function wi(e, t, n, r) {
  return e.score < n.score || e.score === n.score && t > r
}
function Ti(e, t, n) {
  let r = n;
  for (; r > 0;) {
    let n = r - 1 >> 1;
    if (!wi(e[r], t[r], e[n], t[n]))
      break;
    Di(e, t, r, n),
      r = n
  }
}
function Ei(e, t, n, r) {
  let i = n;
  for (; ;) {
    let n = i * 2 + 1;
    if (n >= r)
      return;
    let a = n + 1
      , o = n;
    if (a < r && wi(e[a], t[a], e[n], t[n]) && (o = a),
      !wi(e[o], t[o], e[i], t[i]))
      return;
    Di(e, t, i, o),
      i = o
  }
}
function Di(e, t, n, r) {
  let i = e[n];
  e[n] = e[r],
    e[r] = i;
  let a = t[n];
  t[n] = t[r],
    t[r] = a
}
function Oi(e) {
  return e !== void 0 && Number.isFinite(e) && e > 0
}
function ki(e, t, n, r, i, a) {
  let o = Hi(Math.round(r), 0, t - 1)
    , s = Hi(Math.round(i), 0, n - 1)
    , c = Math.max(3, Math.min(31, Math.round(15 * a)))
    , l = 0
    , u = 0;
  for (let r = -c; r <= c; r++) {
    let i = s + r;
    if (i < 0 || i >= n)
      continue;
    let a = i * t
      , d = Math.floor(Math.sqrt(Math.max(0, c * c - r * r)));
    for (let n = -d; n <= d; n++) {
      let i = o + n;
      if (i < 0 || i >= t)
        continue;
      let s = e[a + i];
      l += n * s,
        u += r * s
    }
  }
  return l === 0 && u === 0 ? 0 : Math.atan2(u, l)
}
function Ai(e, t, n, r, i, a, o, s, c) {
  for (let e = 0; e < 8; e++)
    a[o + e] = 0;
  let l = Math.max(.5, Math.min(8, s))
    , u = Math.cos(c)
    , d = Math.sin(c);
  for (let s = 0; s < 256; s++) {
    let c = xr[s * 4]
      , f = xr[s * 4 + 1]
      , p = xr[s * 4 + 2]
      , m = xr[s * 4 + 3]
      , h = Hi(Math.round(r + l * (u * c - d * f)), 0, t - 1)
      , g = Hi(Math.round(i + l * (d * c + u * f)), 0, n - 1)
      , _ = Hi(Math.round(r + l * (u * p - d * m)), 0, t - 1)
      , v = Hi(Math.round(i + l * (d * p + u * m)), 0, n - 1);
    e[g * t + h] < e[v * t + _] && (a[o + (s >> 5)] |= 1 << (s & 31))
  }
}
function ji(e, t, n = 82, r = .82) {
  if (e.count === 0 || t.count === 0)
    return [];
  let i = Ri(e, t, n, r)
    , a = Ri(t, e, n, r)
    , o = [];
  for (let n = 0; n < e.count; n++) {
    let r = i[n];
    r < 0 || a[r] === n && o.push({
      a: n,
      b: r,
      distance: zi(e, n, t, r)
    })
  }
  return o
}
async function Mi(e, t, n, r = 82, i = .82) {
  if (!n || e.count === 0 || t.count === 0 || e.count * t.count < 32768)
    return ji(e, t, r, i);
  let a, o;
  try {
    a = await n.bestMatches(e, t, r, i),
      o = await n.bestMatches(t, e, r, i)
  } catch {
    return Er(),
      ji(e, t, r, i)
  }
  return !a || !o ? (Er(),
    ji(e, t, r, i)) : Li(e, a, o)
}
async function Ni(e, t, n, r = 82, i = .82, a) {
  if (t.length === 0)
    return [];
  if (n?.matchPairsCompact && n.supportsCompactPairs !== !1)
    try {
      let o = await n.matchPairsCompact(e, t, r, i, a);
      if (o && o.length === t.length && o.every(Array.isArray))
        return o;
      if (o !== null)
        return Er(),
          Ii(e, t, r, i, a)
    } catch {
      return Er(),
        Ii(e, t, r, i, a)
    }
  if (n?.matchBatchPacked) {
    let o = Pi(n.maxDescriptorComparisonsPerDispatch)
      , s = o === null ? null : Array(t.length)
      , c = o === null ? null : []
      , l = Fi(e, t, o, s, c, r, i);
    if (s && c && l === 0)
      return s;
    let u = c ? l : t.length
      , d = {
        src: new Uint32Array(u * 2),
        dst: new Uint32Array(u * 2),
        length: u * 2
      };
    for (let e = 0; e < u; e++) {
      let n = c ? c[e] : e;
      d.src[e * 2] = t[n].i,
        d.dst[e * 2] = t[n].j,
        d.src[e * 2 + 1] = t[n].j,
        d.dst[e * 2 + 1] = t[n].i
    }
    let f;
    try {
      f = await n.matchBatchPacked(e, d, r, i, e => {
        a?.({
          stage: `directional-gpu`,
          completed: Math.min(t.length, Math.floor(e.completed / 2)),
          total: t.length
        })
      }
      )
    } catch {
      f = null
    }
    if (f && f.length === d.length) {
      let n = s ?? Array(t.length);
      for (let r = 0; r < u; r++) {
        let i = c ? c[r] : r
          , a = e[t[i].i]
          , o = e[t[i].j];
        if (a.count === 0 || o.count === 0) {
          n[i] = [];
          continue
        }
        n[i] = Li(a, f[r * 2], f[r * 2 + 1])
      }
      return n
    }
    if (Er(),
      s && c) {
      for (let n of c)
        s[n] = ji(e[t[n].i], e[t[n].j], r, i);
      return s
    }
    return Ii(e, t, r, i, a)
  }
  if (n?.matchBatch) {
    let o = Pi(n.maxDescriptorComparisonsPerDispatch)
      , s = o === null ? null : Array(t.length)
      , c = o === null ? null : []
      , l = Fi(e, t, o, s, c, r, i);
    if (s && c && l === 0)
      return s;
    let u = c ? l : t.length
      , d = Array(u * 2);
    for (let e = 0; e < u; e++) {
      let n = c ? c[e] : e;
      d[e * 2] = {
        src: t[n].i,
        dst: t[n].j
      },
        d[e * 2 + 1] = {
          src: t[n].j,
          dst: t[n].i
        }
    }
    let f;
    try {
      f = await n.matchBatch(e, d, r, i, e => {
        a?.({
          stage: `directional-gpu`,
          completed: Math.min(t.length, Math.floor(e.completed / 2)),
          total: t.length
        })
      }
      )
    } catch {
      f = null
    }
    if (f && f.length === d.length) {
      let n = s ?? Array(t.length);
      for (let r = 0; r < u; r++) {
        let i = c ? c[r] : r
          , a = e[t[i].i]
          , o = e[t[i].j];
        if (a.count === 0 || o.count === 0) {
          n[i] = [];
          continue
        }
        n[i] = Li(a, f[r * 2], f[r * 2 + 1])
      }
      return n
    }
    if (Er(),
      s && c) {
      for (let n of c)
        s[n] = ji(e[t[n].i], e[t[n].j], r, i);
      return s
    }
    return Ii(e, t, r, i, a)
  }
  let o = Array(t.length);
  for (let s = 0; s < t.length; s++)
    o[s] = await Mi(e[t[s].i], e[t[s].j], n, r, i),
      a?.({
        stage: `cpu`,
        completed: s + 1,
        total: t.length
      });
  return o
}
function Pi(e) {
  return Number.isFinite(e) && e !== void 0 && e > 0 ? e : null
}
function Fi(e, t, n, r, i, a, o) {
  if (n === null || !r || !i)
    return t.length;
  for (let s = 0; s < t.length; s++) {
    let c = t[s];
    e[c.i].count * e[c.j].count > n ? r[s] = ji(e[c.i], e[c.j], a, o) : i.push(s)
  }
  return i.length
}
function Ii(e, t, n, r, i) {
  let a = Array(t.length);
  for (let o = 0; o < t.length; o++)
    a[o] = ji(e[t[o].i], e[t[o].j], n, r),
      i?.({
        stage: `cpu`,
        completed: o + 1,
        total: t.length
      });
  return a
}
function Li(e, t, n) {
  let r = [];
  for (let i = 0; i < e.count; i++) {
    let e = t.best[i];
    e < 0 || n.best[e] === i && r.push({
      a: i,
      b: e,
      distance: t.distance[i]
    })
  }
  return r
}
function Ri(e, t, n, r) {
  let i = new Int32Array(e.count).fill(-1);
  for (let a = 0; a < e.count; a++) {
    let o = n + 1
      , s = n + 1
      , c = -1
      , l = a * 8;
    for (let n = 0; n < t.count; n++) {
      let r = n * 8
        , i = 0;
      for (let n = 0; n < 8 && (i += Vi(e.descriptors[l + n] ^ t.descriptors[r + n]),
        !(i >= s)); n++)
        ;
      i < o ? (s = o,
        o = i,
        c = n) : i < s && (s = i)
    }
    c >= 0 && o <= n && o < s * r && (i[a] = c)
  }
  return i
}
function zi(e, t, n, r) {
  let i = t * 8
    , a = r * 8
    , o = 0;
  for (let t = 0; t < 8; t++)
    o += Vi(e.descriptors[i + t] ^ n.descriptors[a + t]);
  return o
}
function Bi(e, t, n, r) {
  return zi(e, t, n, r)
}
function Vi(e) {
  return e -= e >>> 1 & 1431655765,
    e = (e & 858993459) + (e >>> 2 & 858993459),
    (e + (e >>> 4) & 252645135) * 16843009 >>> 24
}
function Hi(e, t, n) {
  return e < t ? t : e > n ? n : e | 0
}
function Ui(e, t) {
  return `${Math.min(e, t)}:${Math.max(e, t)}`
}
function Wi(e = []) {
  let t = e.map(e => ({
    annotationId: e.annotationId,
    leftIndex: e.leftIndex,
    rightIndex: e.rightIndex,
    pointIds: [...e.pointIds],
    points: e.points.map(e => ({
      id: e.id,
      left: ea(e.left),
      right: ea(e.right)
    }))
  }));
  return na(JSON.stringify(t)).toString(16).padStart(8, `0`)
}
function Gi(e, t, n = []) {
  let r = [...t]
    , i = new Map
    , a = new Map
    , o = new Set
    , s = new Map
    , c = new Map
    , l = new Map;
  for (let u of n) {
    if (u.leftIndex === u.rightIndex || !qi(u.leftIndex, e, t) || !qi(u.rightIndex, e, t))
      continue;
    let n = Math.min(u.leftIndex, u.rightIndex)
      , d = Math.max(u.leftIndex, u.rightIndex)
      , f = Ui(u.leftIndex, u.rightIndex);
    o.add(f);
    let p = a.get(f) ?? Ji(u.annotationId, u.leftIndex, u.rightIndex, a, s, f);
    s.get(f)?.add(u.annotationId),
      p.annotationId = Array.from(s.get(f) ?? []).sort().join(`,`);
    for (let t = 0; t < u.points.length; t += 1) {
      let a = u.points[t]
        , o = u.pointIds[t] ?? a.id
        , s = Zi(u.annotationId, o)
        , f = Xi(Yi(u.leftIndex, r, i), e[u.leftIndex], u.leftIndex, a.left, s, c)
        , m = Xi(Yi(u.rightIndex, r, i), e[u.rightIndex], u.rightIndex, a.right, s, c);
      u.annotationId.startsWith(`named:`) && (Ki(l, s, u.leftIndex, f),
        Ki(l, s, u.rightIndex, m)),
        p.pointIds.push(o),
        p.matches.push({
          a: u.leftIndex === n ? f : m,
          b: u.rightIndex === d ? m : f,
          distance: 0
        })
    }
  }
  for (let [e, t] of i)
    r[e] = Qi(t);
  return {
    features: r,
    manualMatchesByPair: a,
    manualPairCandidates: Array.from(o).map(e => {
      let [t, n] = e.split(`:`).map(Number);
      return {
        i: t,
        j: n
      }
    }
    ).sort((e, t) => e.i - t.i || e.j - t.j),
    trustedAnnotationTracks: Array.from(l.entries()).map(([e, t]) => ({
      trackId: e,
      observations: Array.from(t.entries()).map(([e, t]) => ({
        imageIndex: e,
        featureIndex: t
      })).sort((e, t) => e.imageIndex - t.imageIndex)
    })).filter(e => e.observations.length >= 2).sort((e, t) => e.trackId.localeCompare(t.trackId)),
    fingerprint: Wi(n)
  }
}
function Ki(e, t, n, r) {
  let i = e.get(t);
  i || (i = new Map,
    e.set(t, i)),
    i.set(n, r)
}
function qi(e, t, n) {
  return Number.isInteger(e) && e >= 0 && e < t.length && e < n.length
}
function Ji(e, t, n, r, i, a) {
  let o = {
    annotationId: e,
    leftIndex: t,
    rightIndex: n,
    pointIds: [],
    matches: []
  };
  return r.set(a, o),
    i.set(a, new Set),
    o
}
function Yi(e, t, n) {
  let r = n.get(e);
  if (r)
    return r;
  let i = t[e]
    , a = {
      count: i.count,
      xs: Array.from(i.xs),
      ys: Array.from(i.ys),
      scales: i.scales ? Array.from(i.scales) : void 0,
      orientations: i.orientations ? Array.from(i.orientations) : void 0,
      scores: Array.from(i.scores),
      descriptors: Array.from(i.descriptors),
      colors: Array.from(i.colors)
    };
  return n.set(e, a),
    a
}
function Xi(e, t, n, r, i, a) {
  let o = `${n}\0${i}`
    , s = a.get(o);
  if (s !== void 0)
    return s;
  let c = e.count
    , l = Un(r, t.width, t.height);
  e.count += 1,
    e.xs.push(l.x),
    e.ys.push(l.y),
    e.scales?.push(1),
    e.orientations?.push(0),
    e.scores.push(1),
    e.colors.push(255, 255, 255);
  for (let t = 0; t < 8; t += 1)
    e.descriptors.push($i(`${i}:${t}`));
  return a.set(o, c),
    c
}
function Zi(e, t) {
  return e.startsWith(`named:`) ? `named:${t}` : `${e}:${t}`
}
function Qi(e) {
  return {
    count: e.count,
    xs: Float32Array.from(e.xs),
    ys: Float32Array.from(e.ys),
    scales: e.scales ? Float32Array.from(e.scales) : void 0,
    orientations: e.orientations ? Float32Array.from(e.orientations) : void 0,
    scores: Float32Array.from(e.scores),
    descriptors: Uint32Array.from(e.descriptors),
    colors: Uint8Array.from(e.colors)
  }
}
function $i(e) {
  let t = 2166136261;
  for (let n = 0; n < e.length; n += 1)
    t ^= e.charCodeAt(n),
      t = Math.imul(t, 16777619);
  let n = t >>> 0;
  return n === 0 ? 2654435769 : n
}
function ea(e) {
  return {
    x: ta(e.x),
    y: ta(e.y)
  }
}
function ta(e) {
  return Number.isFinite(e) ? Math.round(e * 1e6) / 1e6 : 0
}
function na(e) {
  let t = 2166136261;
  for (let n = 0; n < e.length; n += 1)
    t ^= e.charCodeAt(n),
      t = Math.imul(t, 16777619);
  return t >>> 0
}
function ra(e, t, n, r, i = 4, a = 8) {
  return n.map(n => {
    let o = Ui(n.leftIndex, n.rightIndex)
      , s = r.get(o) ?? []
      , c = []
      , l = e[n.leftIndex]
      , u = e[n.rightIndex]
      , d = t[n.leftIndex]
      , f = t[n.rightIndex];
    if (l && u && d && f)
      for (let e of n.points) {
        let t = fa(n, e, l, u, d, f, s);
        t <= i && c.push(t)
      }
    return {
      leftIndex: n.leftIndex,
      rightIndex: n.rightIndex,
      manualPoints: n.points.length,
      automaticMatches: s.length,
      automaticMatchesNearGroundTruth: c.length,
      medianEndpointErrorPx: ma(c),
      manualVerificationStatus: `not-run`,
      manualVerificationInliers: 0,
      manualVerificationRequiredPoints: a,
      manualVerificationNote: null,
      verifiedWithManual: !1
    }
  }
  )
}
function ia(e, t) {
  let n = t.find(t => Ui(t.leftIndex, t.rightIndex) === Ui(e.leftIndex, e.rightIndex) && t.note.includes(`manual ground truth`));
  if (!n)
    return {
      ...e,
      manualVerificationStatus: `not-run`,
      manualVerificationInliers: 0,
      manualVerificationRequiredPoints: e.manualVerificationRequiredPoints,
      manualVerificationNote: null,
      verifiedWithManual: !1
    };
  let r = n.status === `ok` ? `verified` : n.status === `weak` ? `weak` : n.status === `rejected` ? `rejected` : `not-run`;
  return {
    ...e,
    manualVerificationStatus: r,
    manualVerificationInliers: n.inliers,
    manualVerificationNote: n.note,
    verifiedWithManual: r === `verified`
  }
}
function aa(e, t = !1, n) {
  let r = `auto ${e.automaticMatchesNearGroundTruth}/${e.manualPoints}`;
  if (t)
    return `${oa(e, n)}; ${r}`;
  let i = e.medianEndpointErrorPx === null ? `` : `, median ${e.medianEndpointErrorPx.toFixed(2)} px`;
  return `${sa(e, n)}; auto near GT ${e.automaticMatchesNearGroundTruth}/${e.manualPoints}${i}`
}
function oa(e, t) {
  let n = ca(e);
  switch (la(e, t)) {
    case `verified`:
      return `M ok`;
    case `weak`:
      return e.manualPoints < n ? `M needs ${n}` : `M weak`;
    case `rejected`:
      return `M rejected`;
    case `not-run`:
      return `M not run`
  }
}
function sa(e, t) {
  let n = la(e, t)
    , r = ua(e, n, t)
    , i = ca(e);
  switch (n) {
    case `verified`:
      return `Manual pose verified (${r}/${e.manualPoints})`;
    case `weak`:
      return e.manualPoints < i ? `Manual pose needs ${i} points (${e.manualPoints}/${i})` : `Manual pose weak (${r}/${e.manualPoints})`;
    case `rejected`:
      return `Manual pose rejected (${r}/${e.manualPoints})`;
    case `not-run`:
      return `Manual pose not run (${e.manualPoints} points)`
  }
}
function ca(e) {
  let t = e.manualVerificationRequiredPoints;
  return Number.isFinite(t) && t !== void 0 && t > 0 ? Math.ceil(t) : 8
}
function la(e, t) {
  return da(t) || (e.manualVerificationStatus ?? (e.verifiedWithManual ? `verified` : `not-run`))
}
function ua(e, t, n) {
  return n && da(n) ? n.inliers : Number.isFinite(e.manualVerificationInliers) ? e.manualVerificationInliers : t === `verified` ? e.manualPoints : 0
}
function da(e) {
  return e?.note.includes(`manual ground truth`) ? e.status === `ok` ? `verified` : e.status === `weak` ? `weak` : e.status === `rejected` ? `rejected` : `not-run` : null
}
function fa(e, t, n, r, i, a, o) {
  let s = Un(t.left, n.width, n.height)
    , c = Un(t.right, r.width, r.height)
    , l = Math.min(e.leftIndex, e.rightIndex);
  return o.reduce((t, n) => {
    let r = e.leftIndex === l ? n.a : n.b
      , o = e.rightIndex === l ? n.a : n.b
      , u = pa(i, r, s.x, s.y)
      , d = pa(a, o, c.x, c.y)
      , f = Math.max(u, d);
    return f < t ? f : t
  }
    , 1 / 0)
}
function pa(e, t, n, r) {
  if (!Number.isInteger(t) || t < 0 || t >= e.count)
    return 1 / 0;
  let i = e.xs[t]
    , a = e.ys[t];
  return !Number.isFinite(i) || !Number.isFinite(a) ? 1 / 0 : Math.hypot(i - n, a - r)
}
function ma(e) {
  if (e.length === 0)
    return null;
  let t = [...e].sort((e, t) => e - t)
    , n = Math.floor(t.length / 2);
  return t.length % 2 == 1 ? t[n] : (t[n - 1] + t[n]) / 2
}
var ha = 18
  , ga = 100;
function _a(e, t, n) {
  return t < e.x || n < e.y || t > e.x + e.width || n > e.y + e.height ? null : {
    x: Math.min(1, Math.max(0, (t - e.x) / e.width)),
    y: Math.min(1, Math.max(0, (n - e.y) / e.height))
  }
}
function va(e, t) {
  return {
    x: e.x + t.x * e.width,
    y: e.y + t.y * e.height
  }
}
function ya(e, t, n) {
  return t >= e.x && n >= e.y && t <= e.x + e.width && n <= e.y + e.height
}
function ba(e, t, n) {
  return {
    ...e,
    [t]: n
  }
}
function xa(e, t, n) {
  return {
    x: e.x + t,
    y: e.y + n
  }
}
function Sa(e, t, n) {
  let r = (e, t, n, r, i) => {
    if (r <= t)
      return e + (t - r) * .5 - n;
    let a = e + t - r
      , o = e
      , s = n + i;
    return Math.min(o, Math.max(a, s)) - n
  }
    ;
  return {
    x: r(e.x, e.width, t.x, t.width, n.x),
    y: r(e.y, e.height, t.y, t.height, n.y)
  }
}
function Ca(e, t, n, r) {
  let i = e.width || 1
    , a = e.height || 1
    , o = t.width / i
    , s = Math.max(.01, o * n)
    , c = i * s
    , l = a * s;
  return {
    x: t.x + (t.width - c) * .5 + r.x,
    y: t.y + (t.height - l) * .5 + r.y,
    width: c,
    height: l,
    imageWidth: i,
    imageHeight: a
  }
}
function wa(e, t, n) {
  let r = (n.x - e.x) / e.width
    , i = (n.y - e.y) / e.height;
  return {
    x: n.x - r * t.width - t.x,
    y: n.y - i * t.height - t.y
  }
}
var Ta = class {
  options;
  annotations = new Map;
  selectedPairKey = null;
  selectedLeftProjectAssetId = null;
  selectedRightProjectAssetId = null;
  leftImage = null;
  rightImage = null;
  leftImageUrl = null;
  rightImageUrl = null;
  pendingLeftPoint = null;
  selectedPointId = null;
  leftViewport = null;
  rightViewport = null;
  leftPane = null;
  rightPane = null;
  zoom = {
    left: 1,
    right: 1
  };
  pan = {
    left: {
      x: 0,
      y: 0
    },
    right: {
      x: 0,
      y: 0
    }
  };
  interactionMode = `annotate`;
  imageLoadToken = 0;
  activeDrag = null;
  activePan = null;
  openImageMenu = null;
  imageSearchQuery = {
    left: ``,
    right: ``
  };
  constructor(e) {
    this.options = e,
      e.elements.fit.addEventListener(`click`, () => {
        this.resetZoom(),
          this.resetPan(),
          this.draw()
      }
      ),
      e.elements.zoomIn.addEventListener(`click`, () => {
        this.zoomAllAroundPaneCenters(1.25)
      }
      ),
      e.elements.zoomOut.addEventListener(`click`, () => {
        this.zoomAllAroundPaneCenters(1 / 1.25)
      }
      ),
      e.elements.pan.addEventListener(`click`, () => {
        this.setInteractionMode(this.interactionMode === `pan` ? `annotate` : `pan`)
      }
      ),
      e.elements.canvas.addEventListener(`wheel`, e => {
        this.handleWheel(e)
      }
        , {
          passive: !1
        }),
      e.elements.canvas.addEventListener(`contextmenu`, e => {
        e.preventDefault()
      }
      ),
      e.elements.canvas.addEventListener(`pointerdown`, e => {
        this.handlePointerDown(e)
      }
      ),
      e.elements.canvas.addEventListener(`pointermove`, e => {
        this.handlePointerMove(e)
      }
      ),
      e.elements.canvas.addEventListener(`pointerup`, e => {
        this.handlePointerUp(e)
      }
      ),
      e.elements.canvas.addEventListener(`pointercancel`, e => {
        this.handlePointerUp(e)
      }
      ),
      e.elements.details.addEventListener(`change`, e => {
        this.handleDetailChange(e)
      }
      ),
      e.elements.details.addEventListener(`click`, e => {
        this.handleDetailClick(e)
      }
      ),
      document.addEventListener(`click`, e => {
        if (!this.openImageMenu)
          return;
        let t = e.target;
        t instanceof Node && this.options.elements.pairList.contains(t) || (this.openImageMenu = null,
          this.renderPairList())
      }
      )
  }
  async refresh() {
    this.annotations.clear();
    for (let e of await this.options.loadAnnotations())
      this.annotations.set(e.pairKey, Wn(e));
    this.selectedPairKey && !this.selectedPairAssets() && (this.clearPairSelection(),
      this.pendingLeftPoint = null,
      this.selectedPointId = null,
      this.releaseImages()),
      this.pruneSelectedImageIds(this.selectedAssets()),
      this.renderPairList(),
      this.renderDetails(),
      this.draw()
  }
  selectPair(e, t) {
    e !== t && (this.selectedLeftProjectAssetId = e,
      this.selectedRightProjectAssetId = t,
      this.selectedPairKey = Vn(e, t),
      this.openImageMenu = null,
      this.imageSearchQuery = {
        left: ``,
        right: ``
      },
      this.pendingLeftPoint = null,
      this.selectedPointId = null,
      this.resetZoom(),
      this.resetPan(),
      this.setInteractionMode(`annotate`),
      this.renderPairList(),
      this.renderDetails(),
      this.draw(),
      this.loadSelectedImages())
  }
  async deleteSelectedPoint(e) {
    let t = this.currentAnnotation();
    t && (t.points = t.points.filter(t => t.id !== e),
      t.updatedAt = Date.now(),
      this.selectedPointId === e && (this.selectedPointId = null),
      t.points.length === 0 ? (await this.options.deleteAnnotation(t.pairKey),
        this.annotations.delete(t.pairKey)) : (await this.options.saveAnnotation(t),
          this.annotations.set(t.pairKey, Wn(t))),
      this.renderPairList(),
      this.renderDetails(),
      this.draw())
  }
  renderPairList() {
    let e = this.selectedAssets();
    if (this.pruneSelectedImageIds(e),
      e.length < 2) {
      let e = document.createElement(`p`);
      e.className = `annotationEmpty`,
        e.textContent = `Select at least two setup images to annotate a pair.`,
        this.options.elements.pairList.replaceChildren(e)
    } else
      this.options.elements.pairList.replaceChildren(this.renderImagePairSelectors(e));
    let t = Array.from(this.annotations.values()).reduce((e, t) => e + t.points.length, 0);
    this.options.elements.summary.textContent = `${this.annotations.size} annotated pair${this.annotations.size === 1 ? `` : `s`}, ${t} point ${t === 1 ? `` : `s`}`
  }
  renderImagePairSelectors(e) {
    let t = document.createElement(`div`);
    return t.className = `annotationPairSelectors`,
      t.append(this.renderImageSelector(`left`, e), this.renderImageSelector(`right`, e)),
      t
  }
  renderImageSelector(e, t) {
    let n = document.createElement(`div`);
    n.className = `annotationPairDropdown`,
      n.dataset.annotationSide = e;
    let r = e === `left` ? this.selectedLeftProjectAssetId : this.selectedRightProjectAssetId
      , i = r ? t.find(e => e.projectAssetId === r) ?? null : null
      , a = e === `left` ? this.selectedRightProjectAssetId : this.selectedLeftProjectAssetId
      , o = this.openImageMenu === e
      , s = document.createElement(`button`);
    if (s.type = `button`,
      s.className = `annotationPairSelect`,
      s.dataset.annotationSide = e,
      s.setAttribute(`aria-haspopup`, `listbox`),
      s.setAttribute(`aria-expanded`, o ? `true` : `false`),
      s.append(this.renderImageThumb(i), this.renderImageLabel(i, e === `left` ? `Left image` : `Right image`)),
      s.addEventListener(`click`, t => {
        t.stopPropagation(),
          this.openImageMenu = o ? null : e,
          this.renderPairList(),
          o || requestAnimationFrame(() => {
            this.options.elements.pairList.querySelector(`.annotationPairSearch[data-annotation-side="${e}"]`)?.focus()
          }
          )
      }
      ),
      n.append(s),
      !o)
      return n;
    let c = document.createElement(`div`);
    c.className = `annotationPairMenu`;
    let l = document.createElement(`input`);
    l.className = `annotationPairSearch`,
      l.dataset.annotationSide = e,
      l.type = `search`,
      l.placeholder = e === `left` ? `Search left images` : `Search right images`,
      l.value = this.imageSearchQuery[e],
      l.addEventListener(`click`, e => e.stopPropagation()),
      l.addEventListener(`input`, () => {
        this.imageSearchQuery[e] = l.value,
          this.renderPairList(),
          requestAnimationFrame(() => {
            let t = this.options.elements.pairList.querySelector(`.annotationPairSearch[data-annotation-side="${e}"]`);
            t?.focus(),
              t?.setSelectionRange(t.value.length, t.value.length)
          }
          )
      }
      ),
      c.append(l);
    let u = document.createElement(`div`);
    u.className = `annotationPairOptions`,
      u.setAttribute(`role`, `listbox`);
    let d = this.imageSearchQuery[e].trim().toLowerCase()
      , f = t.filter(e => e.projectAssetId !== a && (!d || e.name.toLowerCase().includes(d)))
      , p = f.slice(0, ga);
    if (f.length === 0) {
      let e = document.createElement(`p`);
      e.className = `annotationEmpty`,
        e.textContent = `No matching images.`,
        u.append(e)
    } else {
      for (let t of p) {
        let n = document.createElement(`button`);
        n.type = `button`,
          n.className = `annotationPairButton`,
          n.dataset.annotationAssetId = t.projectAssetId,
          n.classList.toggle(`selected`, t.projectAssetId === r),
          n.setAttribute(`role`, `option`),
          n.setAttribute(`aria-selected`, t.projectAssetId === r ? `true` : `false`),
          n.append(this.renderImageThumb(t), this.renderImageLabel(t, this.imageOptionMeta(e, t))),
          n.addEventListener(`click`, n => {
            n.stopPropagation(),
              this.selectImageForPair(e, t.projectAssetId)
          }
          ),
          u.append(n)
      }
      if (f.length > p.length) {
        let e = document.createElement(`p`);
        e.className = `annotationEmpty`,
          e.textContent = `${(f.length - p.length).toLocaleString()} more matches. Refine the search.`,
          u.append(e)
      }
    }
    return c.append(u),
      n.append(c),
      n
  }
  renderImageLabel(e, t) {
    let n = document.createElement(`span`);
    n.className = `annotationPairLabel`;
    let r = document.createElement(`strong`);
    r.textContent = e?.name ?? `Choose image`;
    let i = document.createElement(`small`);
    return i.textContent = t,
      n.append(r, i),
      n
  }
  renderImageThumb(e) {
    let t = document.createElement(`span`);
    return t.className = `annotationPairThumbs`,
      t.append(e ? this.renderPairThumb(e) : this.renderPairThumbPlaceholder()),
      t
  }
  renderPairThumb(e) {
    if (e.thumbnailUrl) {
      let t = document.createElement(`img`);
      return t.src = e.thumbnailUrl,
        t.alt = e.name,
        t.loading = `lazy`,
        t.decoding = `async`,
        t
    }
    let t = document.createElement(`span`);
    return t.className = `annotationPairThumbPlaceholder`,
      t.textContent = e.name.slice(0, 1).toUpperCase(),
      t
  }
  renderPairThumbPlaceholder() {
    let e = document.createElement(`span`);
    return e.className = `annotationPairThumbPlaceholder`,
      e.textContent = `-`,
      e
  }
  renderDetails() {
    let e = this.currentAnnotation()
      , t = this.selectedPairAssets();
    if (!t) {
      this.options.elements.title.textContent = `Select a pair`,
        this.options.elements.details.textContent = `Choose an image pair to start annotating.`;
      return
    }
    this.options.elements.title.textContent = `${t.left.name} -> ${t.right.name}`;
    let n = [];
    n.push(this.renderGeometryCard(e, t));
    let r = this.currentEvaluation(t);
    if (r && n.push(this.renderEvaluationCard(r)),
      !e || e.points.length === 0) {
      let e = document.createElement(`div`);
      e.className = `annotationWarning`,
        e.textContent = `Click a point in the left image, then its matching point in the right image.`,
        n.push(e),
        this.options.elements.details.replaceChildren(...n);
      return
    }
    let i = e.points.map((e, t) => {
      let n = document.createElement(`div`);
      n.className = `annotationPointRow`,
        n.classList.toggle(`selected`, e.id === this.selectedPointId);
      let r = document.createElement(`strong`);
      r.textContent = `Point ${t + 1}`;
      let i = document.createElement(`div`);
      i.className = `annotationPointInputs`,
        i.append(this.coordinateInput(e, `left`, `x`), this.coordinateInput(e, `left`, `y`), this.coordinateInput(e, `right`, `x`), this.coordinateInput(e, `right`, `y`));
      let a = document.createElement(`button`);
      return a.type = `button`,
        a.dataset.deletePoint = e.id,
        a.textContent = `Delete`,
        n.append(r, i, a),
        n
    }
    );
    n.push(...i),
      this.options.elements.details.replaceChildren(...n)
  }
  draw() {
    let e = this.options.elements.canvas
      , t = e.getBoundingClientRect()
      , n = Math.max(1, t.width || e.clientWidth || 1)
      , r = Math.max(1, t.height || e.clientHeight || 1)
      , i = Math.min(window.devicePixelRatio || 1, 2);
    this.updateCanvasInteractionDataset(),
      e.width = Math.max(1, Math.round(n * i)),
      e.height = Math.max(1, Math.round(r * i));
    let a = e.getContext(`2d`);
    if (!a)
      return;
    if (a.setTransform(i, 0, 0, i, 0, 0),
      a.clearRect(0, 0, n, r),
      a.fillStyle = `#0f151d`,
      a.fillRect(0, 0, n, r),
      !this.leftImage || !this.rightImage) {
      e.dataset.ready = `false`,
        a.fillStyle = `#d9e6f2`,
        a.font = `12px system-ui`,
        a.fillText(this.selectedPairKey ? `Loading annotation images...` : `Select an image pair to annotate.`, 12, 24);
      return
    }
    e.dataset.ready = `true`;
    let [o, s] = this.computePanes(n, r)
      , [c, l] = this.computeViewports(n, r, this.leftImage, this.rightImage);
    this.leftViewport = c,
      this.rightViewport = l,
      this.leftPane = o,
      this.rightPane = s,
      a.imageSmoothingEnabled = !0,
      this.drawImageInPane(a, this.leftImage, c, o),
      this.drawImageInPane(a, this.rightImage, l, s),
      this.drawSplit(a, n, r),
      this.drawAnnotationPoints(a, c, l, o, s)
  }
  async handlePointerDown(e) {
    let t = this.canvasEventPoint(e)
      , n = this.sideForPoint(t);
    if (n && this.shouldStartPan(e)) {
      e.preventDefault(),
        this.activePan = {
          pointerId: e.pointerId,
          side: n,
          lastX: t.x,
          lastY: t.y
        },
        this.options.elements.canvas.setPointerCapture(e.pointerId),
        this.updateCanvasInteractionDataset();
      return
    }
    let r = this.nearestEndpoint(t.x, t.y);
    if (r) {
      e.preventDefault(),
        this.selectedPointId = r.pointId,
        this.activeDrag = {
          pointerId: e.pointerId,
          pointId: r.pointId,
          side: r.side,
          dirty: !1
        },
        this.options.elements.canvas.setPointerCapture(e.pointerId),
        this.renderDetails(),
        this.draw();
      return
    }
    if (!this.leftViewport || !this.rightViewport)
      return;
    let i = this.canvasToNormalizedPointInPane(`left`, t.x, t.y);
    if (i) {
      e.preventDefault(),
        this.pendingLeftPoint = i,
        this.selectedPointId = null,
        this.renderDetails(),
        this.draw();
      return
    }
    let a = this.canvasToNormalizedPointInPane(`right`, t.x, t.y);
    a && this.pendingLeftPoint && (e.preventDefault(),
      await this.addTiePoint(this.pendingLeftPoint, a),
      this.pendingLeftPoint = null)
  }
  handlePointerMove(e) {
    if (this.activePan) {
      if (this.activePan.pointerId !== e.pointerId)
        return;
      e.preventDefault();
      let t = this.canvasEventPoint(e)
        , n = t.x - this.activePan.lastX
        , r = t.y - this.activePan.lastY
        , i = xa(this.pan[this.activePan.side], n, r);
      this.pan[this.activePan.side] = this.containPanForSide(this.activePan.side, i),
        this.activePan.lastX = t.x,
        this.activePan.lastY = t.y,
        this.draw();
      return
    }
    if (!this.activeDrag)
      return;
    let t = this.canvasEventPoint(e)
      , n = this.canvasToNormalizedPointInPane(this.activeDrag.side, t.x, t.y);
    if (!n)
      return;
    let r = this.currentAnnotation()
      , i = r?.points.find(e => e.id === this.activeDrag?.pointId);
    !r || !i || (i[this.activeDrag.side] = n,
      i.updatedAt = Date.now(),
      r.updatedAt = i.updatedAt,
      this.activeDrag.dirty = !0,
      this.renderDetails(),
      this.draw())
  }
  async handlePointerUp(e) {
    if (this.activePan) {
      if (this.activePan.pointerId !== e.pointerId)
        return;
      this.activePan = null;
      try {
        this.options.elements.canvas.releasePointerCapture(e.pointerId)
      } catch { }
      this.updateCanvasInteractionDataset();
      return
    }
    if (!this.activeDrag || this.activeDrag.pointerId !== e.pointerId)
      return;
    let t = this.activeDrag.dirty;
    this.activeDrag = null;
    try {
      this.options.elements.canvas.releasePointerCapture(e.pointerId)
    } catch { }
    t && await this.persistCurrentAnnotation()
  }
  handleWheel(e) {
    if (!this.leftImage || !this.rightImage)
      return;
    let t = this.canvasEventPoint(e)
      , n = this.sideForPoint(t);
    if (!n)
      return;
    e.preventDefault();
    let r = Math.exp(-e.deltaY * .0015)
      , i = Aa(this.zoom[n] * r);
    this.zoomAroundPoint(i, t, n)
  }
  zoomAllAroundPaneCenters(e) {
    for (let t of [`left`, `right`])
      this.zoomAroundPaneCenter(t, Aa(this.zoom[t] * e), !1);
    this.draw()
  }
  zoomAroundPaneCenter(e, t, n = !0) {
    if (!this.leftImage || !this.rightImage) {
      this.zoom = ba(this.zoom, e, t),
        n && this.draw();
      return
    }
    let r = e === `left` ? this.leftViewport : this.rightViewport
      , i = e === `left` ? this.leftPane : this.rightPane
      , a = r ? Oa(r) : i ? ka(i) : {
        x: 0,
        y: 0
      };
    this.zoomAroundPoint(t, a, e, n)
  }
  zoomAroundPoint(e, t, n, r = !0) {
    if (!this.leftImage || !this.rightImage) {
      this.zoom = ba(this.zoom, n, e),
        r && this.draw();
      return
    }
    if (e === this.zoom[n])
      return;
    let i = n === `left` ? this.leftViewport : this.rightViewport;
    if (!i) {
      this.zoom = ba(this.zoom, n, e),
        r && this.draw();
      return
    }
    let { width: a, height: o } = this.canvasCssSize()
      , s = ba(this.zoom, n, e)
      , [c, l] = this.computeViewports(a, o, this.leftImage, this.rightImage, s, this.zeroPan())
      , u = wa(i, n === `left` ? c : l, t);
    this.zoom = s,
      this.pan[n] = this.containPanForSide(n, u, e),
      r && this.draw()
  }
  resetPan() {
    this.pan = {
      left: {
        x: 0,
        y: 0
      },
      right: {
        x: 0,
        y: 0
      }
    },
      this.updateCanvasInteractionDataset()
  }
  resetZoom() {
    this.zoom = {
      left: 1,
      right: 1
    },
      this.updateCanvasInteractionDataset()
  }
  zeroPan() {
    return {
      left: {
        x: 0,
        y: 0
      },
      right: {
        x: 0,
        y: 0
      }
    }
  }
  setInteractionMode(e) {
    this.interactionMode = e,
      this.options.elements.pan.classList.toggle(`active`, e === `pan`),
      this.options.elements.pan.setAttribute(`aria-pressed`, e === `pan` ? `true` : `false`),
      this.updateCanvasInteractionDataset()
  }
  shouldStartPan(e) {
    return this.interactionMode === `pan` || e.button === 1 || e.button === 2
  }
  sideForPoint(e) {
    if (!this.leftImage || !this.rightImage)
      return null;
    let { width: t, height: n } = this.canvasCssSize()
      , [r, i] = this.leftPane && this.rightPane ? [this.leftPane, this.rightPane] : this.computePanes(t, n);
    return ya(r, e.x, e.y) ? `left` : ya(i, e.x, e.y) ? `right` : null
  }
  async handleDetailChange(e) {
    let t = e.target;
    if (!(t instanceof HTMLInputElement))
      return;
    let n = t.dataset.pointId
      , r = t.dataset.side
      , i = t.dataset.axis;
    if (!n || !r || !i)
      return;
    let a = this.currentAnnotation()
      , o = a?.points.find(e => e.id === n);
    if (!a || !o)
      return;
    let s = Number(t.value);
    Number.isFinite(s) && (o[r] = Hn({
      ...o[r],
      [i]: s
    }),
      o.updatedAt = Date.now(),
      a.updatedAt = o.updatedAt,
      this.selectedPointId = o.id,
      await this.persistCurrentAnnotation(),
      this.renderDetails(),
      this.draw())
  }
  async handleDetailClick(e) {
    let t = e.target;
    if (!(t instanceof HTMLElement))
      return;
    let n = t.closest(`button[data-delete-point]`);
    n?.dataset.deletePoint && await this.deleteSelectedPoint(n.dataset.deletePoint)
  }
  selectedAssets() {
    return this.options.getAssets().filter(e => e.selected)
  }
  selectImageForPair(e, t) {
    e === `left` ? (this.selectedLeftProjectAssetId = t,
      this.selectedRightProjectAssetId === t && (this.selectedRightProjectAssetId = null)) : (this.selectedRightProjectAssetId = t,
        this.selectedLeftProjectAssetId === t && (this.selectedLeftProjectAssetId = null)),
      this.openImageMenu = null,
      this.imageSearchQuery[e] = ``;
    let n = this.selectedLeftProjectAssetId
      , r = this.selectedRightProjectAssetId;
    if (n && r && n !== r) {
      this.selectPair(n, r);
      return
    }
    this.selectedPairKey = null,
      this.pendingLeftPoint = null,
      this.selectedPointId = null,
      this.releaseImages(),
      this.renderPairList(),
      this.renderDetails(),
      this.draw()
  }
  clearPairSelection() {
    this.selectedPairKey = null,
      this.selectedLeftProjectAssetId = null,
      this.selectedRightProjectAssetId = null,
      this.openImageMenu = null,
      this.imageSearchQuery = {
        left: ``,
        right: ``
      }
  }
  pruneSelectedImageIds(e) {
    let t = new Set(e.map(e => e.projectAssetId));
    this.selectedLeftProjectAssetId && !t.has(this.selectedLeftProjectAssetId) && (this.selectedLeftProjectAssetId = null),
      this.selectedRightProjectAssetId && !t.has(this.selectedRightProjectAssetId) && (this.selectedRightProjectAssetId = null),
      this.selectedPairKey && (!this.selectedLeftProjectAssetId || !this.selectedRightProjectAssetId || this.selectedLeftProjectAssetId === this.selectedRightProjectAssetId) && (this.selectedPairKey = null,
        this.releaseImages())
  }
  imageOptionMeta(e, t) {
    let n = e === `left` ? this.selectedRightProjectAssetId : this.selectedLeftProjectAssetId;
    if (n && n !== t.projectAssetId) {
      let r = e === `left` ? t.projectAssetId : n
        , i = e === `right` ? t.projectAssetId : n
        , a = this.annotations.get(Vn(r, i))?.points.length ?? 0;
      return `${a} manual point${a === 1 ? `` : `s`}`
    }
    let r = Array.from(this.annotations.values()).reduce((e, n) => n.leftProjectAssetId === t.projectAssetId || n.rightProjectAssetId === t.projectAssetId ? e + n.points.length : e, 0);
    return r > 0 ? `${r} annotated point${r === 1 ? `` : `s`}` : `Image`
  }
  currentAnnotation() {
    return this.selectedPairKey ? this.annotations.get(this.selectedPairKey) ?? null : null
  }
  selectedPairAssets() {
    if (!this.selectedPairKey)
      return null;
    let [e, t] = this.selectedPairKey.split(`->`)
      , n = Ma(e)
      , r = Ma(t);
    if (!n || !r)
      return null;
    let i = this.options.getAssets()
      , a = i.find(e => e.projectAssetId === n)
      , o = i.find(e => e.projectAssetId === r);
    return a && o ? {
      left: a,
      right: o
    } : null
  }
  async addTiePoint(e, t) {
    let n = this.currentOrCreateAnnotation();
    if (!n)
      return;
    let r = Date.now()
      , i = {
        id: this.nextPointId(n),
        left: e,
        right: t,
        createdAt: r,
        updatedAt: r
      };
    n.points.push(i),
      n.updatedAt = r,
      this.selectedPointId = i.id,
      await this.options.saveAnnotation(n),
      this.annotations.set(n.pairKey, Wn(n)),
      this.renderPairList(),
      this.renderDetails(),
      this.draw()
  }
  currentOrCreateAnnotation() {
    let e = this.options.getProjectId()
      , t = this.selectedPairAssets();
    if (!e || !t)
      return null;
    let n = Vn(t.left.projectAssetId, t.right.projectAssetId)
      , r = this.annotations.get(n);
    if (r)
      return r;
    let i = Date.now();
    return {
      id: `manual-${i.toString(36)}`,
      projectId: e,
      leftProjectAssetId: t.left.projectAssetId,
      rightProjectAssetId: t.right.projectAssetId,
      pairKey: n,
      points: [],
      createdAt: i,
      updatedAt: i
    }
  }
  async persistCurrentAnnotation() {
    let e = this.currentAnnotation();
    e && (await this.options.saveAnnotation(e),
      this.annotations.set(e.pairKey, Wn(e)),
      this.renderPairList())
  }
  coordinateInput(e, t, n) {
    let r = document.createElement(`input`);
    return r.type = `number`,
      r.min = `0`,
      r.max = `1`,
      r.step = `0.0001`,
      r.value = e[t][n].toFixed(4),
      r.dataset.pointId = e.id,
      r.dataset.side = t,
      r.dataset.axis = n,
      r.setAttribute(`aria-label`, `${e.id} ${t} ${n}`),
      r
  }
  renderGeometryCard(e, t) {
    let n = document.createElement(`div`);
    n.className = `annotationStatCard`;
    let r = document.createElement(`strong`);
    if (r.textContent = `Geometry preview`,
      n.append(r),
      !e || e.points.length === 0)
      return n.append(this.statLine(`Points`, `0 / 8`)),
        n;
    let i = this.geometryPreview(e, t);
    n.append(this.statLine(`Points`, `${e.points.length} / ${i?.requiredPoints ?? 8}`), this.statLine(`Rotation`, Ea(i?.rotationDeg ?? null)), this.statLine(`Parallax`, Ea(i?.medianParallaxDeg ?? null)), this.statLine(`Reprojection`, Da(i?.medianReprojectionPx ?? null)), this.statLine(`Inliers`, i?.inlierCount === null || i?.inlierCount === void 0 ? `n/a` : String(i.inlierCount)), this.statLine(`Baseline`, i?.unitBaseline === null || i?.unitBaseline === void 0 ? `n/a` : i.unitBaseline.toFixed(2)));
    for (let e of i?.warnings ?? []) {
      let t = document.createElement(`small`);
      t.className = `annotationGeometryWarning`,
        t.textContent = e,
        n.append(t)
    }
    return n
  }
  renderEvaluationCard(e) {
    let t = document.createElement(`div`);
    t.className = `annotationStatCard`;
    let n = document.createElement(`strong`);
    return n.textContent = `Latest run comparison`,
      t.append(n, this.statLine(`Manual GT`, `${e.automaticMatchesNearGroundTruth}/${e.manualPoints} auto <= 4 px`), this.statLine(`Auto matches`, String(e.automaticMatches)), this.statLine(`Median endpoint`, Da(e.medianEndpointErrorPx)), this.statLine(`Manual pose`, aa(e, !0))),
      t
  }
  statLine(e, t) {
    let n = document.createElement(`div`);
    n.className = `annotationStatLine`;
    let r = document.createElement(`span`);
    r.textContent = e;
    let i = document.createElement(`strong`);
    return i.textContent = t,
      n.append(r, i),
      n
  }
  currentEvaluation(e) {
    let t = this.options.getEvaluations?.() ?? [];
    if (t.length === 0)
      return null;
    let n = this.options.getAssets().filter(e => e.selected)
      , r = n.findIndex(t => t.projectAssetId === e.left.projectAssetId)
      , i = n.findIndex(t => t.projectAssetId === e.right.projectAssetId);
    if (r < 0 || i < 0)
      return null;
    let a = Math.min(r, i)
      , o = Math.max(r, i);
    return t.find(e => Math.min(e.leftIndex, e.rightIndex) === a && Math.max(e.leftIndex, e.rightIndex) === o) ?? null
  }
  geometryPreview(e, t) {
    return !this.leftImage || !this.rightImage ? null : ar(this.frameFromImage(t.left, this.leftImage, 0), this.frameFromImage(t.right, this.rightImage, 1), e.points)
  }
  frameFromImage(e, t, n) {
    let r = t.naturalWidth || t.width || 1
      , i = t.naturalHeight || t.height || 1
      , a = Math.max(r, i) * .85;
    return {
      id: n,
      name: e.name,
      width: r,
      height: i,
      intrinsics: {
        width: r,
        height: i,
        fx: a,
        fy: a,
        cx: r / 2,
        cy: i / 2,
        nativeWidth: r,
        nativeHeight: i,
        source: `manual-annotation-preview`
      }
    }
  }
  async loadSelectedImages() {
    let e = this.selectedPairAssets()
      , t = ++this.imageLoadToken;
    if (this.releaseImages(),
      !e) {
      this.draw();
      return
    }
    try {
      let n = await this.loadImage(e.left.file)
        , r = await this.loadImage(e.right.file);
      if (t !== this.imageLoadToken) {
        URL.revokeObjectURL(n.url),
          URL.revokeObjectURL(r.url);
        return
      }
      this.leftImage = n.image,
        this.rightImage = r.image,
        this.leftImageUrl = n.url,
        this.rightImageUrl = r.url,
        this.renderDetails(),
        this.draw()
    } catch {
      t === this.imageLoadToken && (this.releaseImages(),
        this.draw())
    }
  }
  async loadImage(e) {
    let t = URL.createObjectURL(e)
      , n = new Image;
    n.decoding = `async`,
      n.src = t;
    try {
      await n.decode()
    } catch {
      await new Promise((t, r) => {
        n.onload = () => t(),
          n.onerror = () => r(Error(`Could not decode ${e.name}`))
      }
      )
    }
    return {
      image: n,
      url: t
    }
  }
  releaseImages() {
    this.leftImageUrl && URL.revokeObjectURL(this.leftImageUrl),
      this.rightImageUrl && URL.revokeObjectURL(this.rightImageUrl),
      this.leftImageUrl = null,
      this.rightImageUrl = null,
      this.leftImage = null,
      this.rightImage = null,
      this.leftViewport = null,
      this.rightViewport = null,
      this.leftPane = null,
      this.rightPane = null
  }
  computePanes(e, t) {
    let n = Math.max(1, (e - ha) * .5);
    return [{
      x: 0,
      y: 0,
      width: n,
      height: t
    }, {
      x: n + ha,
      y: 0,
      width: n,
      height: t
    }]
  }
  computeViewports(e, t, n, r, i = this.zoom, a = this.pan) {
    let [o, s] = this.computePanes(e, t);
    return [Ca({
      width: n.naturalWidth || n.width || 1,
      height: n.naturalHeight || n.height || 1
    }, o, i.left, a.left), Ca({
      width: r.naturalWidth || r.width || 1,
      height: r.naturalHeight || r.height || 1
    }, s, i.right, a.right)]
  }
  containPanForSide(e, t, n = this.zoom[e]) {
    if (!this.leftImage || !this.rightImage)
      return t;
    let { width: r, height: i } = this.canvasCssSize()
      , a = ba(this.zoom, e, n)
      , [o, s] = this.computePanes(r, i)
      , [c, l] = this.computeViewports(r, i, this.leftImage, this.rightImage, a, this.zeroPan());
    return e === `left` ? Sa(o, c, t) : Sa(s, l, t)
  }
  drawImageInPane(e, t, n, r) {
    e.save(),
      e.beginPath(),
      e.rect(r.x, r.y, r.width, r.height),
      e.clip(),
      e.drawImage(t, n.x, n.y, n.width, n.height),
      e.restore()
  }
  drawSplit(e, t, n) {
    e.save(),
      e.strokeStyle = `rgba(255, 255, 255, 0.28)`,
      e.setLineDash([5, 5]),
      e.beginPath(),
      e.moveTo(t * .5, 0),
      e.lineTo(t * .5, n),
      e.stroke(),
      e.restore()
  }
  drawAnnotationPoints(e, t, n, r, i) {
    let a = this.currentAnnotation();
    if (!a) {
      this.drawPendingPoint(e, t, r);
      return
    }
    e.save(),
      e.lineWidth = 1.5,
      e.font = `11px system-ui`,
      a.points.forEach((a, o) => {
        let s = va(t, a.left)
          , c = va(n, a.right)
          , l = a.id === this.selectedPointId
          , u = ya(r, s.x, s.y)
          , d = ya(i, c.x, c.y);
        e.strokeStyle = l ? `#ff7a18` : `rgba(255, 255, 255, 0.72)`,
          e.fillStyle = l ? `#ff7a18` : `#2dd4bf`,
          u && d && (e.beginPath(),
            e.moveTo(s.x, s.y),
            e.lineTo(c.x, c.y),
            e.stroke()),
          u && this.drawEndpoint(e, s.x, s.y, String(o + 1), l),
          d && this.drawEndpoint(e, c.x, c.y, String(o + 1), l)
      }
      ),
      e.restore(),
      this.drawPendingPoint(e, t, r)
  }
  drawPendingPoint(e, t, n) {
    if (!this.pendingLeftPoint)
      return;
    let r = va(t, this.pendingLeftPoint);
    ya(n, r.x, r.y) && (e.save(),
      e.fillStyle = `#f2c94c`,
      e.strokeStyle = `#0f151d`,
      e.lineWidth = 2,
      e.beginPath(),
      e.arc(r.x, r.y, 6, 0, Math.PI * 2),
      e.fill(),
      e.stroke(),
      e.restore())
  }
  drawEndpoint(e, t, n, r, i) {
    e.save(),
      e.fillStyle = i ? `#ff7a18` : `#2dd4bf`,
      e.strokeStyle = `#0f151d`,
      e.lineWidth = 2,
      e.beginPath(),
      e.arc(t, n, i ? 6 : 5, 0, Math.PI * 2),
      e.fill(),
      e.stroke(),
      e.fillStyle = `#ffffff`,
      e.fillText(r, t + 8, n - 8),
      e.restore()
  }
  nearestEndpoint(e, t) {
    let n = this.currentAnnotation();
    if (!n || !this.leftViewport || !this.rightViewport || !this.leftPane || !this.rightPane)
      return null;
    let r = null;
    for (let i of n.points) {
      let n = [{
        side: `left`,
        canvas: va(this.leftViewport, i.left),
        pane: this.leftPane
      }, {
        side: `right`,
        canvas: va(this.rightViewport, i.right),
        pane: this.rightPane
      }];
      for (let a of n) {
        if (!ya(a.pane, a.canvas.x, a.canvas.y))
          continue;
        let n = Math.hypot(a.canvas.x - e, a.canvas.y - t);
        n <= 10 && (!r || n < r.distance) && (r = {
          pointId: i.id,
          side: a.side,
          distance: n
        })
      }
    }
    return r ? {
      pointId: r.pointId,
      side: r.side
    } : null
  }
  canvasCssSize() {
    let e = this.options.elements.canvas
      , t = e.getBoundingClientRect();
    return {
      width: Math.max(1, t.width || e.clientWidth || 1),
      height: Math.max(1, t.height || e.clientHeight || 1)
    }
  }
  updateCanvasInteractionDataset() {
    let e = this.options.elements.canvas;
    e.dataset.annotationZoomLeft = this.zoom.left.toFixed(3),
      e.dataset.annotationZoomRight = this.zoom.right.toFixed(3),
      e.dataset.annotationZoom = Math.max(this.zoom.left, this.zoom.right).toFixed(3),
      e.dataset.annotationPanLeft = ja(this.pan.left),
      e.dataset.annotationPanRight = ja(this.pan.right),
      e.dataset.annotationMode = this.interactionMode,
      e.dataset.annotationPanning = this.activePan ? `true` : `false`
  }
  canvasToNormalizedPointInPane(e, t, n) {
    let r = e === `left` ? this.leftViewport : this.rightViewport
      , i = e === `left` ? this.leftPane : this.rightPane;
    return !r || !i || !ya(i, t, n) ? null : _a(r, t, n)
  }
  canvasEventPoint(e) {
    let t = this.options.elements.canvas.getBoundingClientRect();
    return {
      x: e.clientX - t.left,
      y: e.clientY - t.top
    }
  }
  nextPointId(e) {
    let t = new Set(e.points.map(e => e.id));
    for (let n = 1; n <= e.points.length + 1e3; n++) {
      let e = `p${n}`;
      if (!t.has(e))
        return e
    }
    return `p-${Date.now().toString(36)}`
  }
}
  ;
function Ea(e) {
  return e === null || !Number.isFinite(e) ? `n/a` : `${e.toFixed(2)} deg`
}
function Da(e) {
  return e === null || !Number.isFinite(e) ? `n/a` : `${e.toFixed(2)} px`
}
function Oa(e) {
  return {
    x: e.x + e.width * .5,
    y: e.y + e.height * .5
  }
}
function ka(e) {
  return {
    x: e.x + e.width * .5,
    y: e.y + e.height * .5
  }
}
function Aa(e) {
  return Math.max(.25, Math.min(8, e))
}
function ja(e) {
  return `${e.x.toFixed(1)},${e.y.toFixed(1)}`
}
function Ma(e) {
  if (!e)
    return null;
  try {
    return decodeURIComponent(e)
  } catch {
    return null
  }
}
function Na(e = `${Date.now()}:${Math.random()}`) {
  return `named-annotation-${Ja(e)}`
}
function Pa(e, t, n) {
  return `${e}\0${t}\0${n}`
}
function Fa(e) {
  return e.replace(/\s+/g, ` `).trim()
}
function Ia(e) {
  return Fa(e).toLocaleLowerCase()
}
function La(e) {
  return {
    ...e
  }
}
function Ra(e) {
  return {
    ...e,
    point: {
      ...e.point
    }
  }
}
function za(e) {
  let t = [];
  return Ua(e.annotationId) && t.push(`Missing annotationId`),
    Ua(e.projectId) && t.push(`Missing projectId`),
    Ua(Fa(e.name)) && t.push(`Missing name`),
    Ua(e.color) && t.push(`Missing color`),
    Number.isFinite(e.createdAt) || t.push(`Invalid createdAt`),
    Number.isFinite(e.updatedAt) || t.push(`Invalid updatedAt`),
    t
}
function Ba(e) {
  let t = [];
  return Ua(e.projectId) && t.push(`Missing projectId`),
    Ua(e.annotationId) && t.push(`Missing annotationId`),
    Ua(e.projectAssetId) && t.push(`Missing projectAssetId`),
    Wa(e.point) || t.push(`Point is outside [0,1]`),
    Number.isFinite(e.createdAt) || t.push(`Invalid createdAt`),
    Number.isFinite(e.updatedAt) || t.push(`Invalid updatedAt`),
    t
}
function Va(e) {
  let t = e.map(e => ({
    annotationId: e.annotationId,
    projectAssetId: e.projectAssetId,
    point: Ga(e.point)
  })).sort(Ka);
  return qa(JSON.stringify(t)).toString(16).padStart(8, `0`)
}
function Ha(e, t) {
  let n = new Map;
  t.forEach((e, t) => {
    n.set(e.projectAssetId, t)
  }
  );
  let r = new Map;
  for (let t of e) {
    let e = n.get(t.projectAssetId);
    if (e === void 0)
      continue;
    let i = r.get(t.annotationId) ?? [];
    i.push({
      ...Ra(t),
      imageIndex: e
    }),
      r.set(t.annotationId, i)
  }
  let i = new Map;
  for (let [e, t] of r) {
    let n = t.sort((e, t) => e.imageIndex - t.imageIndex);
    for (let t = 1; t < n.length; t += 1) {
      let r = n[t - 1]
        , a = n[t];
      if (r.imageIndex === a.imageIndex)
        continue;
      let o = Math.min(r.imageIndex, a.imageIndex)
        , s = Math.max(r.imageIndex, a.imageIndex)
        , c = `${o}:${s}`
        , l = i.get(c) ?? {
          leftIndex: o,
          rightIndex: s,
          points: []
        }
        , u = r.imageIndex === o ? r : a
        , d = a.imageIndex === s ? a : r;
      l.points.push({
        id: e,
        left: Hn(u.point),
        right: Hn(d.point),
        createdAt: Math.min(r.createdAt, a.createdAt),
        updatedAt: Math.max(r.updatedAt, a.updatedAt)
      }),
        i.set(c, l)
    }
  }
  return Array.from(i.values()).map(e => ({
    annotationId: `named:${e.leftIndex}:${e.rightIndex}`,
    leftIndex: e.leftIndex,
    rightIndex: e.rightIndex,
    pointIds: e.points.map(e => e.id),
    points: e.points.sort((e, t) => e.id.localeCompare(t.id))
  })).sort((e, t) => e.leftIndex - t.leftIndex || e.rightIndex - t.rightIndex)
}
function Ua(e) {
  return e.trim().length === 0
}
function Wa(e) {
  return Number.isFinite(e.x) && Number.isFinite(e.y) && e.x >= 0 && e.x <= 1 && e.y >= 0 && e.y <= 1
}
function Ga(e) {
  return {
    x: Math.round(e.x * 1e6) / 1e6,
    y: Math.round(e.y * 1e6) / 1e6
  }
}
function Ka(e, t) {
  let n = JSON.stringify(e)
    , r = JSON.stringify(t);
  return n < r ? -1 : +(n > r)
}
function qa(e) {
  let t = 2166136261;
  for (let n = 0; n < e.length; n += 1)
    t ^= e.charCodeAt(n),
      t = Math.imul(t, 16777619);
  return t >>> 0
}
function Ja(e) {
  return qa(e).toString(16).padStart(8, `0`)
}
var Ya = 5
  , Xa = 8
  , Za = 6
  , Qa = .006
  , $a = .015;
function eo(e) {
  let t = e.images.filter(e => e.selected)
    , n = new Map;
  t.forEach((e, t) => {
    n.set(e.projectAssetId, t)
  }
  );
  let r = to(e.manualAnnotations, n)
    , i = Ha(e.namedAnnotationObservations, t.map(e => ({
      projectAssetId: e.projectAssetId
    })))
    , a = no([...r, ...i])
    , o = io(e.namedAnnotationObservations, n)
    , s = ao(t.length, a)
    , c = oo(e.diagnostics ?? [])
    , l = t.filter(e => e.hasMask).length
    , u = new Set;
  for (let e of a)
    u.add(e.leftIndex),
      u.add(e.rightIndex);
  for (let t of e.namedAnnotationObservations) {
    let e = n.get(t.projectAssetId);
    e !== void 0 && u.add(e)
  }
  let d = {
    selectedImages: t.length,
    maskedImages: l,
    annotatedImages: u.size,
    manualPairCount: r.length,
    namedTrackCount: o.tracks,
    namedSingletonCount: o.singletons,
    totalPairConstraints: a.length,
    strongPairCount: a.filter(e => e.points.length >= Ya).length,
    robustPairCount: a.filter(mo).length,
    weakPairCount: a.filter(e => e.points.length < Ya).length,
    lowSpreadPairCount: a.filter(e => e.points.length >= Ya && e.spreadArea < Qa).length,
    collinearPairCount: a.filter(e => e.collinear).length,
    lowParallaxPairCount: a.filter(e => e.points.length >= Ya && e.medianDisplacement < $a).length,
    annotationComponents: s.components,
    largestAnnotationComponent: s.largestComponent,
    diagnosticWeakPairs: c.weak,
    diagnosticRejectedPairs: c.rejected
  }
    , f = []
    , p = []
    , m = [];
  if (t.length < 2)
    return p.push(`Select at least two images before running annotation analysis.`),
    {
      profileName: `Insufficient input`,
      confidence: .2,
      summary: `The advisor needs at least two selected images.`,
      metrics: d,
      settingsPatch: {},
      reasons: f,
      warnings: p,
      suggestedAnnotationActions: [`Select more source images, then analyze annotations again.`]
    };
  if (a.length === 0 && (p.push(`No manual or named annotation pairs are available for the selected images.`),
    m.push(`Add at least 5 shared points between nearby images, or mark the same named annotations across adjacent images.`)),
    d.weakPairCount > 0) {
    p.push(`${d.weakPairCount} annotated pair${xo(d.weakPairCount)} ha${d.weakPairCount === 1 ? `s` : `ve`} fewer than ${Ya} points.`);
    for (let e of a.filter(e => e.points.length < Ya).slice(0, 4))
      m.push(`Add ${Ya - e.points.length} more point${xo(Ya - e.points.length)} between ${vo(t, e.leftIndex)} and ${vo(t, e.rightIndex)}.`)
  }
  if ((d.lowSpreadPairCount > 0 || d.collinearPairCount > 0) && (p.push(`Some annotated pairs are spatially concentrated or nearly collinear.`),
    m.push(`Spread points across the subject and image extent; avoid putting all points on one small line or texture patch.`)),
    d.lowParallaxPairCount > 0 && d.lowParallaxPairCount === d.strongPairCount && (p.push(`Strong annotation pairs have very small normalized displacement, so they may not constrain depth well.`),
      m.push(`Include bridge points between images with a visibly wider viewpoint change, not only nearly identical frames.`)),
    s.components > 1 && a.length > 0) {
    p.push(`Strong annotations currently form ${s.components} disconnected components.`);
    for (let e of s.bridgeSuggestions.slice(0, 4))
      m.push(`Bridge ${vo(t, e.leftIndex)} to ${vo(t, e.rightIndex)} with ${Xa} well-spread points.`)
  }
  o.singletons > 0 && m.push(`Mark ${o.singletons} named annotation${xo(o.singletons)} in at least one more selected image so they become cross-image constraints.`),
    l > 0 && !e.settings.useMasksForSfm && p.push(`The current scene preset ignores ${l} selected mask${xo(l)} during SfM feature extraction.`),
    c.weak + c.rejected > 0 && f.push(`The last run reported ${c.weak} weak and ${c.rejected} rejected inspectable pair${xo(c.weak + c.rejected)}.`);
  let h = so(e.settings, t, d, c)
    , g = Object.keys(h).length;
  g > 0 && f.push(`Recommended ${g} setting override${xo(g)} based on annotation coverage, masks, and pair graph connectivity.`),
    d.robustPairCount > 0 && f.push(`${d.robustPairCount} annotated pair${xo(d.robustPairCount)} ha${d.robustPairCount === 1 ? `s` : `ve`} at least ${Xa} well-spread points.`),
    d.annotationComponents === 1 && d.annotatedImages === t.length && d.robustPairCount > 0 && f.push(`The selected images are covered by one robust annotation graph.`);
  let _ = uo(d, e.settings, t)
    , v = fo(_, d, h, p);
  return {
    profileName: _,
    confidence: po(d, p.length, c),
    summary: v,
    metrics: d,
    settingsPatch: h,
    reasons: f,
    warnings: p,
    suggestedAnnotationActions: m
  }
}
function to(e, t) {
  let n = [];
  for (let r of e) {
    let e = t.get(r.leftProjectAssetId)
      , i = t.get(r.rightProjectAssetId);
    e === void 0 || i === void 0 || e === i || n.push({
      leftIndex: e,
      rightIndex: i,
      points: r.points,
      source: `manual`
    })
  }
  return n
}
function no(e) {
  let t = new Map;
  for (let n of e) {
    let e = Math.min(n.leftIndex, n.rightIndex)
      , r = Math.max(n.leftIndex, n.rightIndex)
      , i = `${e}:${r}`
      , a = t.get(i) ?? {
        leftIndex: e,
        rightIndex: r,
        manualPoints: 0,
        namedPoints: 0,
        points: [],
        spreadArea: 0,
        collinear: !1,
        medianDisplacement: 0
      };
    n.source === `manual` ? a.manualPoints += n.points.length : a.namedPoints += n.points.length,
      a.points.push(...n.points.map(e => ({
        ...e,
        left: {
          ...e.left
        },
        right: {
          ...e.right
        }
      }))),
      t.set(i, a)
  }
  return Array.from(t.values()).map(e => ro(e)).sort((e, t) => e.leftIndex - t.leftIndex || e.rightIndex - t.rightIndex)
}
function ro(e) {
  let t = e.points.map(e => e.left)
    , n = e.points.map(e => e.right)
    , r = ho(t)
    , i = ho(n);
  return {
    ...e,
    spreadArea: Math.min(r, i),
    collinear: go(t) || go(n),
    medianDisplacement: _o(e.points.map(e => Math.hypot(e.right.x - e.left.x, e.right.y - e.left.y)))
  }
}
function io(e, t) {
  let n = new Map;
  for (let r of e) {
    let e = t.get(r.projectAssetId);
    if (e === void 0)
      continue;
    let i = n.get(r.annotationId) ?? new Set;
    i.add(e),
      n.set(r.annotationId, i)
  }
  let r = 0
    , i = 0;
  for (let e of n.values())
    e.size >= 2 ? r += 1 : e.size === 1 && (i += 1);
  return {
    tracks: r,
    singletons: i
  }
}
function ao(e, t) {
  if (e === 0)
    return {
      components: 0,
      largestComponent: 0,
      bridgeSuggestions: []
    };
  let n = new So(e);
  for (let e of t)
    e.points.length >= Ya && n.union(e.leftIndex, e.rightIndex);
  let r = new Map;
  for (let t = 0; t < e; t += 1) {
    let e = n.find(t)
      , i = r.get(e) ?? [];
    i.push(t),
      r.set(e, i)
  }
  let i = Array.from(r.values()).sort((e, t) => e[0] - t[0])
    , a = i.reduce((e, t) => Math.max(e, t.length), 0)
    , o = [];
  for (let e = 1; e < i.length; e += 1) {
    let t = i[e - 1]
      , n = i[e];
    o.push({
      leftIndex: t[t.length - 1],
      rightIndex: n[0]
    })
  }
  return {
    components: i.length,
    largestComponent: a,
    bridgeSuggestions: o
  }
}
function oo(e) {
  return {
    weak: e.filter(e => e.status === `weak`).length,
    rejected: e.filter(e => e.status === `rejected` || e.status === `skipped`).length
  }
}
function so(e, t, n, r) {
  let i = {}
    , a = n.totalPairConstraints > 0 || n.namedTrackCount > 0
    , o = n.weakPairCount > 0 || n.annotationComponents > 1 || n.robustPairCount === 0 || r.weak + r.rejected > 0
    , s = n.maskedImages > 0 && !e.useMasksForSfm
    , c = t.length > 0 && t.filter(e => e.origin === `video`).length / t.length > .65;
  e.quality !== `dense` && (a || o || n.maskedImages > 0) && (i.quality = `dense`);
  let l = lo(e.scene, n, t.length, c, s, a);
  l && l !== e.scene && (i.scene = l);
  let u = t.length <= 50 ? 6200 : n.maskedImages > 0 ? 6e3 : 5600;
  yo(e.maxFeatures) < u && (a || o || n.maskedImages > 0) && (i.maxFeatures = u);
  let d = o || n.maskedImages > 0 ? 16 : 18;
  yo(e.threshold) > d && (i.threshold = d);
  let f = t.length > 90 ? 2800 : 3200;
  if (e.scaleMode !== `custom` && (i.scaleMode = `custom`),
    (yo(e.maxLongEdge) < f || e.scaleMode !== `custom`) && (i.maxLongEdge = f),
    t.length <= 60 ? (e.pairStrategy !== `exhaustive` && (i.pairStrategy = `exhaustive`),
      yo(e.pairCandidateBudget) !== 0 && (i.pairCandidateBudget = 0),
      yo(e.geometryCandidateBudget) !== 0 && (i.geometryCandidateBudget = 0)) : (e.pairStrategy !== `retrieval` && (i.pairStrategy = `retrieval`),
        yo(e.retrievalTopK) < 64 && (i.retrievalTopK = 64),
        yo(e.pairCandidateBudget) < 4096 && (i.pairCandidateBudget = 4096),
        yo(e.geometryCandidateBudget) < 2400 && (i.geometryCandidateBudget = 2400)),
    o) {
    let n = t.length <= 60 ? `component-exhaustive` : `retrieval`;
    e.visualBridgeMode !== n && (i.visualBridgeMode = n),
      yo(e.visualBridgeCandidates) < 240 && (i.visualBridgeCandidates = 240),
      yo(e.visualBridgePairsPerComponent) < 8 && (i.visualBridgePairsPerComponent = 8),
      yo(e.relativePoseRansacIterations) < 3e3 && (i.relativePoseRansacIterations = 3e3),
      yo(e.pnpPixelThreshold) < 5 && (i.pnpPixelThreshold = 5),
      yo(e.triangulationReprojectionPx) < 6 && (i.triangulationReprojectionPx = 6),
      yo(e.triangulationMinParallaxDeg) > .45 && (i.triangulationMinParallaxDeg = .45),
      yo(e.minVerifiedParallaxDeg) > .3 && (i.minVerifiedParallaxDeg = .3)
  }
  let p = co(n);
  return p !== null && yo(e.pnpMinInliers) > p && (i.pnpMinInliers = p),
    yo(e.guidedTrackRadius) < 18 && (i.guidedTrackRadius = 18),
    yo(e.guidedDescriptorDistance) < 76 && (i.guidedDescriptorDistance = 76),
    e.localPointRefinement || (i.localPointRefinement = !0),
    e.localPoseRefinement || (i.localPoseRefinement = !0),
    e.refineIntrinsics || (i.refineIntrinsics = !0),
    bo(i)
}
function co(e) {
  return e.robustPairCount > 0 ? Xa : e.strongPairCount > 0 ? Za : null
}
function lo(e, t, n, r, i, a) {
  return r ? `video` : i ? n <= 60 ? `small-object` : `large-images` : e !== `general` || !a ? null : n <= 48 ? `small-object` : n >= 80 || t.maskedImages > 0 ? `large-images` : null
}
function uo(e, t, n) {
  return e.maskedImages > 0 && !t.useMasksForSfm ? `Mask-aware dense reconstruction` : e.annotationComponents > 1 || e.robustPairCount === 0 ? `Bridge weak annotation graph` : n.length > 80 ? `Large-set annotated reconstruction` : `Dense annotated reconstruction`
}
function fo(e, t, n, r) {
  if (t.selectedImages < 2)
    return `Select at least two images first.`;
  let i = Object.keys(n).length;
  return r.length > 0 ? `${e}: ${r[0]} ${i > 0 ? `${i} setting change${xo(i)} suggested.` : `No setting change is enough without more annotations.`}` : i > 0 ? `${e}: ${i} setting change${xo(i)} suggested.` : `${e}: current settings fit the annotation graph.`
}
function po(e, t, n) {
  if (e.selectedImages < 2)
    return .2;
  let r = .58;
  return e.totalPairConstraints > 0 && (r += .08),
    e.robustPairCount > 0 && (r += .08),
    n.weak + n.rejected > 0 && (r += .08),
    e.maskedImages > 0 && (r += .04),
    t > 0 && (r += .03),
    Math.max(.2, Math.min(.9, Math.round(r * 100) / 100))
}
function mo(e) {
  return e.points.length >= Xa && e.spreadArea >= Qa && !e.collinear
}
function ho(e) {
  if (e.length === 0)
    return 0;
  let t = 1 / 0
    , n = 1 / 0
    , r = -1 / 0
    , i = -1 / 0;
  for (let a of e)
    t = Math.min(t, a.x),
      n = Math.min(n, a.y),
      r = Math.max(r, a.x),
      i = Math.max(i, a.y);
  return Math.max(0, r - t) * Math.max(0, i - n)
}
function go(e) {
  if (e.length < 4)
    return !1;
  let t = e.reduce((e, t) => ({
    x: e.x + t.x,
    y: e.y + t.y
  }), {
    x: 0,
    y: 0
  });
  t.x /= e.length,
    t.y /= e.length;
  let n = 0
    , r = 0
    , i = 0;
  for (let a of e) {
    let e = a.x - t.x
      , o = a.y - t.y;
    n += e * e,
      r += e * o,
      i += o * o
  }
  n /= e.length,
    r /= e.length,
    i /= e.length;
  let a = n + i
    , o = n * i - r * r
    , s = Math.max(0, a * a - 4 * o)
    , c = (a + Math.sqrt(s)) / 2
    , l = (a - Math.sqrt(s)) / 2;
  return c <= 1e-8 ? !0 : l / c < .015
}
function _o(e) {
  if (e.length === 0)
    return 0;
  let t = [...e].sort((e, t) => e - t)
    , n = Math.floor(t.length / 2);
  return t.length % 2 == 1 ? t[n] : (t[n - 1] + t[n]) / 2
}
function vo(e, t) {
  let n = e[t]?.name?.trim();
  return n ? `"${n}"` : `image ${t + 1}`
}
function yo(e) {
  return Number.isFinite(e) ? e : 0
}
function bo(e) {
  return Object.fromEntries(Object.entries(e).filter(([, e]) => e !== void 0))
}
function xo(e) {
  return e === 1 ? `` : `s`
}
var So = class {
  parents;
  ranks;
  constructor(e) {
    this.parents = Array.from({
      length: e
    }, (e, t) => t),
      this.ranks = Array.from({
        length: e
      }, () => 0)
  }
  find(e) {
    let t = this.parents[e];
    if (t === void 0 || t === e)
      return e;
    let n = this.find(t);
    return this.parents[e] = n,
      n
  }
  union(e, t) {
    let n = this.find(e)
      , r = this.find(t);
    n !== r && (this.ranks[n] < this.ranks[r] && ([n, r] = [r, n]),
      this.parents[r] = n,
      this.ranks[n] === this.ranks[r] && (this.ranks[n] = this.ranks[n] + 1))
  }
}
  ;
function Co(e) {
  return {
    useFeatureCache: e !== `features`,
    usePairPlanCache: e !== `features` && e !== `pair-plan`,
    useDescriptorMatchCache: e === `latest` || e === `verification`
  }
}
function wo(e) {
  switch (e) {
    case `active`:
      return `running`;
    case `cached`:
      return `cached`;
    case `done`:
      return `current`;
    case `stale`:
      return `recompute`;
    case `pending`:
      return `pending`
  }
}
var To;
(function (e) {
  e[e.INVALID = -1] = `INVALID`,
    e[e.CAMERA = 0] = `CAMERA`,
    e[e.IMU = 1] = `IMU`
}
)(To ||= {});
function Eo(e) {
  return e instanceof ArrayBuffer ? new Uint8Array(e) : new Uint8Array(e.buffer, e.byteOffset, e.byteLength)
}
function Do(e) {
  let t = Eo(e)
    , n = new Uint8Array(t.byteLength);
  return n.set(t),
    n.buffer
}
var Oo = [{
  id: 0,
  name: `SIMPLE_PINHOLE`,
  numParams: 3,
  paramsInfo: `f, cx, cy`
}, {
  id: 1,
  name: `PINHOLE`,
  numParams: 4,
  paramsInfo: `fx, fy, cx, cy`
}, {
  id: 2,
  name: `SIMPLE_RADIAL`,
  numParams: 4,
  paramsInfo: `f, cx, cy, k`
}, {
  id: 3,
  name: `RADIAL`,
  numParams: 5,
  paramsInfo: `f, cx, cy, k1, k2`
}, {
  id: 4,
  name: `OPENCV`,
  numParams: 8,
  paramsInfo: `fx, fy, cx, cy, k1, k2, p1, p2`
}, {
  id: 5,
  name: `OPENCV_FISHEYE`,
  numParams: 8,
  paramsInfo: `fx, fy, cx, cy, k1, k2, k3, k4`
}, {
  id: 6,
  name: `FULL_OPENCV`,
  numParams: 12,
  paramsInfo: `fx, fy, cx, cy, k1, k2, p1, p2, k3, k4, k5, k6`
}, {
  id: 7,
  name: `FOV`,
  numParams: 5,
  paramsInfo: `fx, fy, cx, cy, omega`
}, {
  id: 8,
  name: `SIMPLE_RADIAL_FISHEYE`,
  numParams: 4,
  paramsInfo: `f, cx, cy, k`
}, {
  id: 9,
  name: `RADIAL_FISHEYE`,
  numParams: 5,
  paramsInfo: `f, cx, cy, k1, k2`
}, {
  id: 10,
  name: `THIN_PRISM_FISHEYE`,
  numParams: 12,
  paramsInfo: `fx, fy, cx, cy, k1, k2, p1, p2, k3, k4, sx1, sy1`
}, {
  id: 11,
  name: `RAD_TAN_THIN_PRISM_FISHEYE`,
  numParams: 16,
  paramsInfo: `fx, fy, cx, cy, k0, k1, k2, k3, k4, k5, p0, p1, s0, s1, s2, s3`
}, {
  id: 12,
  name: `SIMPLE_DIVISION`,
  numParams: 4,
  paramsInfo: `f, cx, cy, k`
}, {
  id: 13,
  name: `DIVISION`,
  numParams: 5,
  paramsInfo: `fx, fy, cx, cy, k`
}, {
  id: 14,
  name: `SIMPLE_FISHEYE`,
  numParams: 3,
  paramsInfo: `f, cx, cy`
}, {
  id: 15,
  name: `FISHEYE`,
  numParams: 4,
  paramsInfo: `fx, fy, cx, cy`
}];
new Map(Oo.map(e => [e.id, e])),
  new Map(Oo.map(e => [e.name, e]));
function ko(e) {
  return e instanceof ArrayBuffer || ArrayBuffer.isView(e)
}
async function Ao(e) {
  let t = e.getReader()
    , n = []
    , r = 0;
  try {
    for (; ;) {
      let { value: e, done: i } = await t.read();
      if (i)
        break;
      e && (n.push(e),
        r += e.byteLength)
    }
  } finally {
    t.releaseLock()
  }
  let i = new Uint8Array(r)
    , a = 0;
  for (let e of n)
    i.set(e, a),
      a += e.byteLength;
  return i.buffer
}
function jo(e) {
  let t = Eo(e);
  return new ReadableStream({
    start(e) {
      e.enqueue(t),
        e.close()
    }
  })
}
async function Mo(e) {
  return ko(e) ? Do(e) : e instanceof Blob ? await e.arrayBuffer() : await Ao(e)
}
function No() {
  if (typeof CompressionStream > `u`)
    throw Error(`CompressionStream is not available in this runtime`);
  return CompressionStream
}
function Po() {
  if (typeof DecompressionStream > `u`)
    throw Error(`DecompressionStream is not available in this runtime`);
  return DecompressionStream
}
function Fo(e, t = `gzip`) {
  let n = No();
  return e.pipeThrough(new n(t))
}
function Io(e, t = `gzip`) {
  let n = Po();
  return e.pipeThrough(new n(t))
}
async function Lo(e, t = `gzip`) {
  return await Ao(Fo(jo(e), t))
}
async function Ro(e, t = `gzip`) {
  return await Ao(Io(jo(e), t))
}
function zo(e, t = `path`) {
  if (typeof e != `string`)
    throw TypeError(`${t} must be a string`);
  if (e.includes(`\0`))
    throw Error(`${t} cannot contain a NUL byte`);
  let n = e.replace(/\\+/g, `/`).trim();
  if (n.length === 0)
    throw Error(`${t} cannot be empty`);
  if (n.startsWith(`/`))
    throw Error(`${t} must be relative, got absolute path ${e}`);
  if (/^[A-Za-z]:\//.test(n))
    throw Error(`${t} must be relative, got Windows absolute path ${e}`);
  let r = [];
  for (let i of n.split(`/`))
    if (!(i === `` || i === `.`)) {
      if (i === `..`)
        throw Error(`${t} cannot contain '..': ${e}`);
      r.push(i)
    }
  if (n = r.join(`/`),
    n.length === 0)
    throw Error(`${t} cannot be empty`);
  return n
}
function Bo(...e) {
  return zo(e.filter(e => e != null && e !== ``).join(`/`), `joined path`)
}
function Vo(e) {
  let t = zo(e);
  return t.slice(t.lastIndexOf(`/`) + 1)
}
function Ho(e) {
  let t = zo(e)
    , n = t.lastIndexOf(`/`);
  return n === -1 ? `` : t.slice(0, n)
}
function Uo(e, t) {
  let n = zo(e, `path`);
  if (t.trim() === ``)
    return !0;
  let r = zo(t, `prefix`);
  return n === r || n.startsWith(`${r}/`)
}
function Wo(e, t) {
  let n = zo(e, `path`);
  if (t.trim() === ``)
    return n;
  let r = zo(t, `prefix`);
  return n === r ? `` : n.startsWith(`${r}/`) ? n.slice(r.length + 1) : n
}
function Go(e, t) {
  let n = zo(e, `path`);
  if (t.trim() === ``)
    return n;
  let r = zo(t, `prefix`);
  return Uo(n, r) ? n : Bo(r, n)
}
function Ko(e, t) {
  return `${zo(e)}${t.startsWith(`.`) ? t : `.${t}`}`
}
function qo(e) {
  return new TextEncoder().encode(e)
}
function Jo(e, t, n, r) {
  let i = qo(r);
  e.set(i.subarray(0, n), t)
}
function Yo(e, t, n, r) {
  Jo(e, t, n, r.toString(8).padStart(n - 1, `0`).slice(-(n - 1)) + `\0`)
}
function Xo(e, t, n) {
  let r = e.subarray(t, t + n)
    , i = r.indexOf(0);
  return new TextDecoder().decode(i === -1 ? r : r.subarray(0, i)).trim()
}
function Zo(e, t, n) {
  let r = Xo(e, t, n).replace(/\s/g, ``).replace(/\0/g, ``);
  return r.length === 0 ? 0 : Number.parseInt(r, 8)
}
function Qo(e) {
  let t = 0;
  for (let n = 0; n < e.byteLength; n += 1)
    t += n >= 148 && n < 156 ? 32 : e[n];
  return t
}
function $o(e) {
  let t = Zo(e, 148, 8);
  if (t === 0)
    return;
  let n = Qo(e);
  if (n !== t)
    throw Error(`Invalid tar header checksum: expected ${t}, got ${n}`)
}
function es(e) {
  return (512 - e % 512) % 512
}
function ts(e) {
  let t = new TextEncoder;
  if (t.encode(e).length <= 100)
    return {
      name: e,
      prefix: ``
    };
  let n = [];
  for (let t = 0; t < e.length; t += 1)
    e[t] === `/` && n.push(t);
  for (let r = n.length - 1; r >= 0; --r) {
    let i = n[r]
      , a = e.slice(0, i)
      , o = e.slice(i + 1);
    if (t.encode(o).length <= 100 && t.encode(a).length <= 155)
      return {
        name: o,
        prefix: a
      }
  }
  throw Error(`Tar writer supports ustar paths with <=100 byte basename and <=155 byte prefix; got ${e}`)
}
function ns(e, t, n = Math.floor(Date.now() / 1e3)) {
  let { name: r, prefix: i } = ts(e)
    , a = new Uint8Array(512);
  Jo(a, 0, 100, r),
    Yo(a, 100, 8, 420),
    Yo(a, 108, 8, 0),
    Yo(a, 116, 8, 0),
    Yo(a, 124, 12, t),
    Yo(a, 136, 12, n);
  for (let e = 148; e < 156; e += 1)
    a[e] = 32;
  a[156] = 48,
    Jo(a, 257, 6, `ustar\0`),
    Jo(a, 263, 2, `00`),
    i && Jo(a, 345, 155, i);
  let o = 0;
  for (let e of a)
    o += e;
  return Jo(a, 148, 8, o.toString(8).padStart(6, `0`) + `\0 `),
    a
}
function rs(e) {
  let t = []
    , n = 1024;
  for (let [r, i] of Object.entries(e)) {
    let e = Eo(i)
      , a = ns(r, e.byteLength)
      , o = new Uint8Array(es(e.byteLength));
    t.push(a, e, o),
      n += a.byteLength + e.byteLength + o.byteLength
  }
  let r = new Uint8Array(n)
    , i = 0;
  for (let e of t)
    r.set(e, i),
      i += e.byteLength;
  return r
}
function is(e) {
  let t = Eo(e)
    , n = {}
    , r = 0;
  for (; r + 512 <= t.byteLength;) {
    let e = t.subarray(r, r + 512);
    if (e.every(e => e === 0))
      break;
    $o(e);
    let i = Xo(e, 0, 100)
      , a = Xo(e, 345, 155)
      , o = zo(a ? `${a}/${i}` : i, `tar entry path`)
      , s = Zo(e, 124, 12)
      , c = e[156];
    if (r += 512,
      r + s > t.byteLength)
      throw RangeError(`Tar entry ${o} is truncated`);
    let l = t.slice(r, r + s);
    if (c === 0 || c === 48) {
      if (n[o])
        throw Error(`Duplicate tar entry path: ${o}`);
      n[o] = l
    }
    r += s + es(s)
  }
  return n
}
async function as(e) {
  let t = await Lo(rs(e), `gzip`);
  return new Uint8Array(t)
}
async function os(e) {
  return is(await Ro(e, `gzip`))
}
function ss(e, t = {}) {
  let n = t.extension ?? `.png`;
  return Ko(zo(e, `COLMAP image name`), n)
}
function cs(e, t = {}) {
  let n = t.maskRoot ?? `masks`
    , r = ss(e, t);
  return n.trim() === `` ? r : Go(r, n)
}
function ls(e, t = {}) {
  let n = t.imageRoot ?? `images`
    , r = t.maskRoot ?? `masks`
    , i = t.extension ?? `.png`
    , a = t.appendImageExtension ?? !0
    , o = zo(e, `Nerfstudio frame file_path`)
    , s = n.trim() === `` ? o : Wo(o, n)
    , c = a ? Ko(s, i) : s.replace(/(\.[^./]+)?$/, i.startsWith(`.`) ? i : `.${i}`);
  return r.trim() === `` ? c : Go(c, r)
}
var us = 67324752
  , ds = 33639248
  , fs = 101010256;
async function ps(e) {
  let t = new Uint8Array(await Mo(e))
    , n = new DataView(t.buffer, t.byteOffset, t.byteLength)
    , r = {}
    , i = 0;
  for (; i + 4 <= t.byteLength;) {
    let e = n.getUint32(i, !0);
    if (e === ds || e === fs)
      break;
    if (e !== us)
      throw Error(`Invalid ZIP local file header at offset ${i}`);
    let a = n.getUint16(i + 6, !0)
      , o = n.getUint16(i + 8, !0)
      , s = n.getUint32(i + 18, !0)
      , c = n.getUint32(i + 22, !0)
      , l = n.getUint16(i + 26, !0)
      , u = n.getUint16(i + 28, !0);
    if (a & 8)
      throw Error(`ZIP data descriptors are not supported`);
    let d = i + 30
      , f = d + l + u
      , p = f + s;
    if (p > t.byteLength)
      throw RangeError(`ZIP entry at offset ${i} is truncated`);
    let m = zo(new TextDecoder().decode(t.subarray(d, d + l)), `zip entry path`);
    if (r[m])
      throw Error(`Duplicate zip entry path: ${m}`);
    let h = t.slice(f, p), g;
    if (o === 0)
      g = h;
    else if (o === 8)
      g = new Uint8Array(await Ro(h, `deflate-raw`));
    else
      throw Error(`Unsupported ZIP compression method ${o} for ${m}`);
    if (c !== 4294967295 && g.byteLength !== c)
      throw Error(`ZIP entry size mismatch for ${m}: expected ${c}, got ${g.byteLength}`);
    r[m] = g,
      i = p
  }
  return r
}
function ms(e) {
  return typeof e == `object` && !!e && !Array.isArray(e)
}
function hs(e) {
  return typeof e == `number` && Number.isFinite(e)
}
function gs(e, t) {
  let n = [];
  if (!Array.isArray(e) || e.length !== 4)
    return [`${t} must be a 4x4 array`];
  for (let r = 0; r < 4; r += 1) {
    let i = e[r];
    if (!Array.isArray(i) || i.length !== 4) {
      n.push(`${t}[${r}] must have 4 entries`);
      continue
    }
    for (let e = 0; e < 4; e += 1)
      hs(i[e]) || n.push(`${t}[${r}][${e}] must be a finite number`)
  }
  return n
}
function _s(e, t = {}) {
  let n = []
    , r = t.validateTransformMatrices ?? !0;
  if (!ms(e))
    return [`transforms must be a JSON object`];
  if (!Array.isArray(e.frames))
    return [`transforms.frames must be an array`];
  let i = e.frames
    , a = 0;
  for (let e = 0; e < i.length; e += 1) {
    let t = i[e];
    if (!ms(t)) {
      n.push(`frames[${e}] must be an object`);
      continue
    }
    (typeof t.file_path != `string` || t.file_path.length === 0) && n.push(`frames[${e}].file_path must be a non-empty string`),
      `mask_path` in t && (typeof t.mask_path != `string` || t.mask_path.length === 0 ? n.push(`frames[${e}].mask_path must be a non-empty string when present`) : a += 1),
      `depth_file_path` in t && (typeof t.depth_file_path != `string` || t.depth_file_path.length === 0) && n.push(`frames[${e}].depth_file_path must be a non-empty string when present`),
      r && n.push(...gs(t.transform_matrix, `frames[${e}].transform_matrix`))
  }
  t.requireMasks && a !== i.length ? n.push(`mask_path is required for every frame; found ${a}/${i.length}`) : !t.allowPartialMasks && a > 0 && a !== i.length && n.push(`Nerfstudio requires either zero masks or one mask per frame; found ${a}/${i.length}`);
  for (let t of [`fl_x`, `fl_y`, `cx`, `cy`, `w`, `h`]) {
    if (t in e)
      continue;
    let r = i.filter(e => ms(e) && t in e).length;
    r > 0 && r !== i.length && n.push(`${t} is per-frame for only ${r}/${i.length} frame(s); define it on every frame or at top level`)
  }
  return n
}
function vs(e, t = {}) {
  let n = _s(e, t);
  if (n.length > 0)
    throw Error(`Invalid Nerfstudio transforms.json:\n${n.map(e => `- ${e}`).join(`
`)}`)
}
function ys(e) {
  return typeof e == `string` ? e : new TextDecoder(`utf-8`, {
    fatal: !1
  }).decode(Eo(e))
}
function bs(e, t = {}) {
  let n = JSON.parse(ys(e));
  return vs(n, t),
    n
}
var xs = [.75, .85, .95, 1.05, 1.15];
async function Ss(e, t, n, r, i) {
  if (e.length < 8 || n.length === 0 || n.length !== r.length)
    return null;
  let a = Es(n, r, i);
  if (a.length < i.minAcceptedPairs)
    return null;
  let o = Rs(e.map(As))
    , s = [];
  for (let n of i.ratios) {
    let r = e.map(e => ks(e, n));
    s.push(Ds(r, t, a, i))
  }
  let c = Cs(s, o, i.minAcceptedPairs);
  return c ? (Ts(e, c.ratio),
  {
    selectedRatio: c.ratio,
    previousRatio: o,
    scores: s
  }) : null
}
function Cs(e, t, n) {
  let r = e.filter(e => e.acceptedPairs >= n);
  if (r.length === 0)
    return null;
  let i = ws(r, t)
    , a = r[0];
  for (let e of r.slice(1)) {
    if (e.score > a.score + 1e-9) {
      a = e;
      continue
    }
    Math.abs(e.score - a.score) <= 1e-9 && Math.abs(e.ratio - t) + 1e-9 < Math.abs(a.ratio - t) && (a = e)
  }
  return i && Math.abs(a.ratio - i.ratio) > 1e-9 && a.acceptedPairs <= i.acceptedPairs && a.totalInliers <= i.totalInliers ? i : a
}
function ws(e, t) {
  let n = null
    , r = 1 / 0;
  for (let i of e) {
    let e = Math.abs(i.ratio - t);
    e + 1e-9 < r && (n = i,
      r = e)
  }
  return n
}
function Ts(e, t) {
  for (let n of e) {
    let e = t * Math.max(n.width, n.height);
    n.intrinsics.fx = e,
      n.intrinsics.fy = e,
      n.intrinsics.source = `${n.intrinsics.source}; focal probe ${t.toFixed(2)}x`
  }
}
function Es(e, t, n) {
  let r = Math.max(n.minMatches, 24);
  return e.map((e, n) => ({
    pair: e,
    matches: t[n] ?? []
  })).filter(e => e.matches.length >= (e.pair.knownInliers ? 8 : r)).sort((e, t) => {
    let n = +!!e.pair.knownInliers
      , r = +!!t.pair.knownInliers;
    if (n !== r)
      return r - n;
    let i = +(Math.abs(e.pair.j - e.pair.i) === 1)
      , a = +(Math.abs(t.pair.j - t.pair.i) === 1);
    return i === a ? t.matches.length - e.matches.length : a - i
  }
  ).slice(0, n.maxPairs).map(e => ({
    pair: e.pair,
    matches: Os(e.matches, n.maxMatchesPerPair)
  }))
}
function Ds(e, t, n, r) {
  let i = 0
    , a = 0
    , o = []
    , s = [];
  for (let { pair: c, matches: l } of n) {
    let n = c.knownInliers ? ve(e[c.i], e[c.j], t[c.i], t[c.j], l) : ge(e[c.i], e[c.j], t[c.i], t[c.j], l, r.ransacIterations, r.pixelThreshold);
    !n || n.inliers.length < (c.knownInliers ? 8 : r.minMatches) || (i++,
      a += n.inliers.length,
      o.push(js(e[c.i], e[c.j], t[c.i], t[c.j], n)),
      s.push(Ms(e[c.i], e[c.j], t[c.i], t[c.j], n)))
  }
  let c = Rs(o)
    , l = Rs(s)
    , u = Number.isFinite(l) ? l : r.pixelThreshold * 2
    , d = i * 1e6 + a * 100 + c * 50 - u * 1e3;
  return {
    ratio: As(e[0]),
    testedPairs: n.length,
    acceptedPairs: i,
    totalInliers: a,
    medianParallaxDeg: c,
    medianReprojectionPx: l,
    score: d
  }
}
function Os(e, t) {
  return e.length <= t ? [...e] : [...e].sort((e, t) => e.distance - t.distance).slice(0, t)
}
function ks(e, t) {
  let n = t * Math.max(e.width, e.height);
  return {
    ...e,
    intrinsics: {
      ...e.intrinsics,
      fx: n,
      fy: n
    }
  }
}
function As(e) {
  return e.intrinsics.fx / Math.max(1, e.width, e.height)
}
function js(e, t, n, r, i) {
  let a = [0, 0, 0]
    , o = Ps(i.R, i.t)
    , s = Ls(i.inliers, 96)
    , c = [];
  for (let l of s) {
    let s = Fs(e, n.xs[l.a])
      , u = Is(e, n.ys[l.a])
      , d = Fs(t, r.xs[l.b])
      , f = Is(t, r.ys[l.b])
      , p = rt([1, 0, 0, 0, 1, 0, 0, 0, 1], [0, 0, 0], i.R, i.t, s, u, d, f);
    if (!p)
      continue;
    let m = p[0] - a[0]
      , h = p[1] - a[1]
      , g = p[2] - a[2]
      , _ = p[0] - o[0]
      , v = p[1] - o[1]
      , y = p[2] - o[2]
      , b = Math.hypot(m, h, g)
      , x = Math.hypot(_, v, y);
    if (b <= 1e-9 || x <= 1e-9)
      continue;
    let S = zs((m * _ + h * v + g * y) / (b * x), -1, 1);
    c.push(Math.acos(S) * 180 / Math.PI)
  }
  return Rs(c)
}
function Ms(e, t, n, r, i) {
  let a = Ls(i.inliers, 96)
    , o = [];
  for (let s of a) {
    let a = Fs(e, n.xs[s.a])
      , c = Is(e, n.ys[s.a])
      , l = Fs(t, r.xs[s.b])
      , u = Is(t, r.ys[s.b])
      , d = rt([1, 0, 0, 0, 1, 0, 0, 0, 1], [0, 0, 0], i.R, i.t, a, c, l, u);
    if (!d)
      continue;
    let f = Ns(e, d, [1, 0, 0, 0, 1, 0, 0, 0, 1], [0, 0, 0])
      , p = Ns(t, d, i.R, i.t);
    if (!f || !p)
      continue;
    let m = Math.hypot(f[0] - n.xs[s.a], f[1] - n.ys[s.a])
      , h = Math.hypot(p[0] - r.xs[s.b], p[1] - r.ys[s.b]);
    o.push(Math.max(m, h))
  }
  return Rs(o)
}
function Ns(e, t, n, r) {
  let i = n[0] * t[0] + n[1] * t[1] + n[2] * t[2] + r[0]
    , a = n[3] * t[0] + n[4] * t[1] + n[5] * t[2] + r[1]
    , o = n[6] * t[0] + n[7] * t[1] + n[8] * t[2] + r[2];
  return o <= 1e-9 ? null : [e.intrinsics.fx * (i / o) + e.intrinsics.cx, e.intrinsics.fy * (a / o) + e.intrinsics.cy]
}
function Ps(e, t) {
  return [-(e[0] * t[0] + e[3] * t[1] + e[6] * t[2]), -(e[1] * t[0] + e[4] * t[1] + e[7] * t[2]), -(e[2] * t[0] + e[5] * t[1] + e[8] * t[2])]
}
function Fs(e, t) {
  return (t - e.intrinsics.cx) / e.intrinsics.fx
}
function Is(e, t) {
  return (t - e.intrinsics.cy) / e.intrinsics.fy
}
function Ls(e, t) {
  if (e.length <= t)
    return [...e];
  let n = Array(t)
    , r = e.length / t;
  for (let i = 0; i < t; i++)
    n[i] = e[Math.floor(i * r)];
  return n
}
function Rs(e) {
  let t = e.filter(Number.isFinite).sort((e, t) => e - t);
  return t.length === 0 ? 0 : t[t.length >> 1]
}
function zs(e, t, n) {
  return Math.max(t, Math.min(n, e))
}
function Bs(e, t, n, r) {
  if (!Number.isFinite(r) || r <= 0 || e.length <= r)
    return e;
  let i = Math.floor(r);
  if (i <= 0)
    return [];
  let a = Array(i)
    , o = new Float64Array(i)
    , s = new Int32Array(i)
    , c = 0;
  for (let r = 0; r < e.length; r++) {
    let l = e[r]
      , u = t.scores[l.a] + n.scores[l.b];
    if (c < i) {
      a[c] = l,
        o[c] = u,
        s[c] = r,
        Us(a, o, s, c),
        c++;
      continue
    }
    Vs(u, r, o[0], s[0]) && (a[0] = l,
      o[0] = u,
      s[0] = r,
      Ws(a, o, s, 0, c))
  }
  for (let e = c - 1; e > 0; e--)
    Gs(a, o, s, 0, e),
      Ws(a, o, s, 0, e);
  return a
}
function Vs(e, t, n, r) {
  return e > n || e === n && t < r
}
function Hs(e, t, n, r) {
  return e < n || e === n && t > r
}
function Us(e, t, n, r) {
  let i = r;
  for (; i > 0;) {
    let r = i - 1 >> 1;
    if (!Hs(t[i], n[i], t[r], n[r]))
      break;
    Gs(e, t, n, i, r),
      i = r
  }
}
function Ws(e, t, n, r, i) {
  let a = r;
  for (; ;) {
    let r = a * 2 + 1;
    if (r >= i)
      return;
    let o = r + 1
      , s = r;
    if (o < i && Hs(t[o], n[o], t[r], n[r]) && (s = o),
      !Hs(t[s], n[s], t[a], n[a]))
      return;
    Gs(e, t, n, a, s),
      a = s
  }
}
function Gs(e, t, n, r, i) {
  let a = e[r];
  e[r] = e[i],
    e[i] = a;
  let o = t[r];
  t[r] = t[i],
    t[i] = o;
  let s = n[r];
  n[r] = n[i],
    n[i] = s
}
var Ks = class {
  parent = new Map;
  find(e) {
    let t = e
      , n = this.parent.get(t);
    for (; n !== void 0 && n !== t;) {
      let e = this.parent.get(n);
      e !== void 0 && e !== n && this.parent.set(t, e),
        t = n,
        n = this.parent.get(t)
    }
    return t
  }
  union(e, t) {
    let n = this.find(e)
      , r = this.find(t);
    if (n === r)
      return n;
    let i = Math.min(n, r)
      , a = Math.max(n, r);
    return this.parent.set(a, i),
      i
  }
}
  ;
function qs(e, t) {
  let n = e + t;
  return n * (n + 1) / 2 + t
}
function Js(e) {
  let t = Math.floor((Math.sqrt(8 * e + 1) - 1) / 2);
  return t - (e - t * (t + 1) / 2)
}
function Ys(e) {
  let t = Math.floor((Math.sqrt(8 * e + 1) - 1) / 2);
  return e - t * (t + 1) / 2
}
function Xs(e) {
  return Array.from({
    length: e
  }, () => new Map)
}
function Zs(e, t, n) {
  let r = e?.[t];
  r && r.set(n, (r.get(n) ?? 0) + 1)
}
function Qs(e, t, n) {
  let r = e?.[t];
  if (!r)
    return;
  let i = (r.get(n) ?? 0) - 1;
  i > 0 ? r.set(n, i) : r.delete(n)
}
function $s(e, t, n) {
  return e.get(qs(t, n))
}
function ec(e, t, n, r, i, a, o) {
  let s = $s(r, e, t);
  if (s !== void 0) {
    let e = i.find(s)
      , t = a[e - 1];
    if (t && t.track.length > 0)
      return {
        pointId: e,
        point: t
      }
  }
  if (o <= 0)
    return null;
  let c = n[e];
  if (!c || t < 0 || t >= c.count)
    return null;
  let l = c.xs[t]
    , u = c.ys[t];
  if (!Number.isFinite(l) || !Number.isFinite(u))
    return null;
  let d = o * o
    , f = null
    , p = d;
  for (let [n, o] of r) {
    if (Js(n) !== e)
      continue;
    let r = Ys(n);
    if (r === t || r < 0 || r >= c.count)
      continue;
    let s = c.xs[r] - l
      , d = c.ys[r] - u
      , m = s * s + d * d;
    if (!Number.isFinite(m) || m > p)
      continue;
    let h = i.find(o)
      , g = a[h - 1];
    !g || g.track.length === 0 || (p = m,
      f = {
        pointId: h,
        point: g
      })
  }
  return f
}
function tc(e, t, n, r, i) {
  let a = qs(n, r)
    , o = $s(e, n, r);
  o !== void 0 && o !== i && Qs(t, n, o),
    e.set(a, i),
    o !== i && Zs(t, n, i)
}
function nc(e, t, n, r) {
  let i = $s(e, n, r);
  e.delete(qs(n, r)),
    i !== void 0 && Qs(t, n, i)
}
function rc(e, t, n, r) {
  let i = new Set
    , a = t?.[n];
  if (a) {
    for (let e of a.keys())
      i.add(r.find(e));
    return i
  }
  for (let [t, a] of e)
    Js(t) === n && i.add(r.find(a));
  return i
}
var ic = 8
  , ac = 6
  , oc = 96
  , sc = 128
  , cc = 224
  , lc = 4
  , uc = 6e3
  , dc = 4.5
  , fc = 80
  , pc = .95
  , mc = 6
  , hc = 32
  , gc = 384
  , _c = 4096
  , vc = 4.5
  , yc = 12
  , bc = 8;
function xc(e) {
  let t = e.pairStrategy ?? `retrieval`
    , n = e.relativePoseRansacIterations ?? (t === `sequential` ? 320 : 1500);
  return {
    pairStrategy: t,
    retrievalTopK: Id(e.retrievalTopK ?? 32, 4, 256),
    pairCandidateBudget: Id(e.pairCandidateBudget ?? 0, 0, 5e4),
    geometryCandidateBudget: Id(e.geometryCandidateBudget ?? 0, 0, 5e4),
    sequentialGap: Id(e.maxTrackGap ?? 3, 1, 8),
    minMatches: e.minMatches,
    minInitialInliers: Math.max(e.minMatches + 24, 60),
    minInitialParallaxDeg: 1.5,
    pnpPixelThreshold: e.pnpPixelThreshold ?? 4,
    pnpMinInliers: Id(e.pnpMinInliers ?? 18, 6, 200),
    ransacIterations: Id(n, 64, 8e3),
    matcherHammingMax: Id(e.matcherHammingMax ?? 96, 32, 192),
    matcherRatio: Id(e.matcherRatio ?? .88, .5, .98),
    adaptiveMatcherThresholds: e.adaptiveMatcherThresholds ?? !0,
    autoFocalProbe: e.autoFocalProbe ?? !1,
    focalProbeRatios: e.focalProbeRatios && e.focalProbeRatios.length > 0 ? e.focalProbeRatios : xs,
    focalProbeMaxPairs: Id(e.focalProbeMaxPairs ?? 12, 4, 64),
    focalProbeMaxMatchesPerPair: Id(e.focalProbeMaxMatchesPerPair ?? 500, 64, 2e3),
    maxPointsPerPair: e.maxPointsPerPair && e.maxPointsPerPair > 0 ? e.maxPointsPerPair : 1 / 0,
    triangulationReprojectionPx: Id(e.triangulationReprojectionPx ?? 6, 1, 20),
    triangulationMinParallaxDeg: Id(e.triangulationMinParallaxDeg ?? .5, .05, 5),
    minVerifiedParallaxDeg: Id(e.minVerifiedParallaxDeg ?? .35, 0, 5),
    allowWeakInitialFallback: e.allowWeakInitialFallback ?? !1,
    allowMultiComponentBootstrap: !0,
    allowOrderedComponentMerge: !1,
    allowScaledRelativeEdgeRegistration: !0,
    allowRelativeEdgeRegistration: !1,
    relativePoseRansacIterations: e.relativePoseRansacIterations ?? null,
    relativePoseSolver: e.relativePoseSolver ?? `five-point`,
    pnpCoverageGridDim: Id(e.pnpCoverageGridDim ?? 4, 2, 16),
    localPointRefinement: e.localPointRefinement ?? !0,
    localPoseRefinement: e.localPoseRefinement ?? !0
  }
}
async function Sc(e, t, n, r, i, a, o, s, c = new Map, l, u = []) {
  if (e.length < 2)
    throw Error(`Select at least two overlapping images.`);
  let d = yd(e)
    , f = []
    , p = i?.supportsBatch === !0
    , m = Kc(n.manualPairCandidates, c, e.length)
    , h = o ? Gc(o, m, e.length) : Vc(e, t, {
      ...n,
      manualPairCandidates: m
    }, p)
    , g = h.pairs
    , _ = n.pairStrategy === h.effectiveStrategy ? `strategy=${h.effectiveStrategy}` : `strategy=${n.pairStrategy}->${h.effectiveStrategy}`;
  l?.({
    type: `pair-plan`,
    pairCount: g.length,
    imageCount: e.length,
    requestedStrategy: n.pairStrategy,
    effectiveStrategy: h.effectiveStrategy,
    reason: h.reason
  }),
    a(`View graph candidates: ${g.length} pairs from ${e.length} images (${_}${n.pairStrategy === `retrieval` ? `, topK=${n.retrievalTopK}` : ``}${h.reason ? `, ${h.reason}` : ``})`);
  let v = []
    , y = await Dl(e, t, g, n, r, i, f, v, a, s, c, l);
  if (y.length === 0)
    return a(`Mapper aborted: no pair survived geometric verification`),
    {
      poses: d,
      edges: y,
      diagnostics: f,
      registeredCount: 0,
      componentCount: 0,
      gaugeAnchorImageIds: [],
      seedPoints: []
    };
  a(`Verified ${y.length} pairs`);
  let b = tl(y, e.length);
  a(nl(`Verified view graph components`, b, e));
  let x = rl(b, y, e.length, t);
  if (x.length > 0) {
    let o = y.length;
    a(`Bridge retry: ${x.length} cross-component pairs with relaxed matcher gates`);
    let s = await ol(e, t, x, n, r, i, f, v, a);
    y.push(...s),
      s.length > 0 ? (b = tl(y, e.length),
        a(`Bridge retry accepted ${s.length} additional pair${s.length === 1 ? `` : `s`} (${o} -> ${y.length} verified)`),
        a(nl(`Verified view graph components after bridge retry`, b, e))) : a(`Bridge retry accepted 0 additional pairs`)
  }
  n.pairStrategy === `sequential` && e.length >= 40 && b.length > 1 && a(`Diagnostics: sequential pair graph remains split into ${b.length} components after bridge retry; drone grids and row-turn captures usually need Retrieval top-K or the Aerial / drone grid scene preset.`);
  let S = Sd(y, e.length)
    , C = ql(y, b, n, e, t);
  if (!C)
    return a(`Mapper aborted: no edge satisfied the initial-pair parallax / inlier threshold`),
    {
      poses: d,
      edges: y,
      diagnostics: f,
      registeredCount: 0,
      componentCount: 0,
      gaugeAnchorImageIds: [],
      seedPoints: []
    };
  a(`Initial pair: ${e[C.leftIndex].name} ↔ ${e[C.rightIndex].name} (${C.verifiedInlierCount} verified inliers, ${C.matches.length} kept, ${C.medianParallaxDeg.toFixed(1)} deg parallax)`);
  let w = []
    , T = new Map
    , E = Xs(e.length)
    , D = new Ks
    , O = new Map
    , k = new Map
    , A = 1
    , j = new Map;
  for (let t = 0; t < e.length; t++)
    j.set(e[t].id, t);
  let ee = r => {
    let i = vu(u, e, t, d, w, T, D, n, j, O, () => A++, E);
    if (i.created === 0 && i.updated === 0 && i.adoptedObservations === 0)
      return;
    let o = [];
    i.created > 0 && o.push(`${i.created} created`),
      i.updated > 0 && o.push(`${i.updated} refreshed`),
      i.adoptedObservations > 0 && o.push(`${i.adoptedObservations} observations adopted`),
      a(`Trusted annotation tracks ${r}: ${o.join(`, `)}`)
  }
    , M = [];
  for (let t = 0; t < e.length; t++)
    M.push(new Set);
  let N = Array(e.length).fill(null)
    , te = wu(r)
    , ne = Tu(r)
    , re = Eu(r)
    , P = y.indexOf(C)
    , ie = 1
    , ae = [e[C.leftIndex].id]
    , oe = e => ae[d[e]?.componentId ?? -1] ?? ae[0];
  N[C.leftIndex] = {
    method: `bootstrap`,
    edgeIndex: P,
    inliers: C.verifiedInlierCount,
    parallaxDeg: C.medianParallaxDeg,
    note: `bootstrap anchor`
  },
    N[C.rightIndex] = {
      method: `bootstrap`,
      anchorIndex: C.leftIndex,
      edgeIndex: P,
      inliers: C.verifiedInlierCount,
      parallaxDeg: C.medianParallaxDeg,
      note: `bootstrap pair`
    };
  let se = 0;
  se += $l(C, d, e, t, w, T, D, n, () => A++, E, te, 0),
    a(`Bootstrap triangulated ${w.length} seed points`),
    ee(`after bootstrap`);
  let ce = r => {
    let i = ie++;
    ae[i] = e[r.leftIndex].id;
    let o = y.indexOf(r);
    N[r.leftIndex] = {
      method: `bootstrap`,
      edgeIndex: o,
      inliers: r.verifiedInlierCount,
      parallaxDeg: r.medianParallaxDeg,
      note: `component ${i + 1} bootstrap anchor`
    },
      N[r.rightIndex] = {
        method: `bootstrap`,
        anchorIndex: r.leftIndex,
        edgeIndex: o,
        inliers: r.verifiedInlierCount,
        parallaxDeg: r.medianParallaxDeg,
        note: `component ${i + 1} bootstrap pair`
      };
    let s = w.length;
    return se += $l(r, d, e, t, w, T, D, n, () => A++, E, te, i, [i * 10, 0, 0]),
      a(`Component ${i + 1} initial pair: ${e[r.leftIndex].name} <-> ${e[r.rightIndex].name} (${r.verifiedInlierCount} verified inliers, ${r.matches.length} kept, ${r.medianParallaxDeg.toFixed(1)} deg parallax, ${w.length - s} seed points)`),
      ee(`after component ${i + 1} bootstrap`),
      !0
  }
    , le = async (r, i) => {
      if (!mu(r, d, y))
        return !1;
      tu(k, r.imageIndex);
      let o = M[r.imageIndex];
      for (let e of r.pnpRejectedLocalFeatures)
        o.add(e);
      se += Su(r.imageIndex, S, y, e, t, d, w, T, D, r.pnpRejectedLocalFeatures, n, () => A++, E, te),
        ee(`after ${e[r.imageIndex].name}`);
      let s = await ed(r.imageIndex, S, y, e, t, d, w, T, D, n, j, M, E, oe(r.imageIndex), ne, re)
        , c = y[r.edgeIndex];
      return N[r.imageIndex] = {
        method: `scaled-relative-edge`,
        anchorIndex: r.anchorIndex,
        edgeIndex: r.edgeIndex,
        inliers: r.inliers,
        observations: r.observations,
        meanReprojectionError: r.meanReprojectionError,
        parallaxDeg: c.medianParallaxDeg,
        scale: r.scale,
        note: i
      },
        a(`Registered ${e[r.imageIndex].name} via scaled relative edge from ${e[r.anchorIndex].name} (${r.inliers} / ${r.observations} scale inliers, scale ${r.scale.toFixed(3)}, ${r.meanReprojectionError.toFixed(2)} px, ${c.medianParallaxDeg.toFixed(2)} deg parallax${s})`),
        !0
    }
    , ue = e.length * 2 + 8;
  for (; ue-- > 0;) {
    let i = nu(d, S, y, e, t, T, D, w, n, k, f, u);
    if (!i) {
      let r = n.allowScaledRelativeEdgeRegistration ? au(d, S, y, e, t, T, D, w, n, void 0, f) : null;
      if (r && await le(r, `frontier scaled fallback`))
        continue;
      let i = n.allowMultiComponentBootstrap ? Jl(y, d, f, n, e, t) : null;
      if (i && ce(i))
        continue;
      if (!n.allowRelativeEdgeRegistration)
        break;
      let o = fu(d, S, y, n, void 0, f);
      if (!o || !pu(o, d, y))
        break;
      tu(k, o.imageIndex),
        se += Su(o.imageIndex, S, y, e, t, d, w, T, D, new Set, n, () => A++, E, te),
        ee(`after ${e[o.imageIndex].name}`);
      let s = await ed(o.imageIndex, S, y, e, t, d, w, T, D, n, j, M, E, oe(o.imageIndex), ne, re)
        , c = y[o.edgeIndex];
      N[o.imageIndex] = {
        method: `relative-edge`,
        anchorIndex: o.anchorIndex,
        edgeIndex: o.edgeIndex,
        inliers: c.verifiedInlierCount,
        parallaxDeg: c.medianParallaxDeg,
        note: `frontier fallback`
      },
        a(`Registered ${e[o.imageIndex].name} via relative edge from ${e[o.anchorIndex].name} (${c.verifiedInlierCount} verified inliers, ${c.medianParallaxDeg.toFixed(2)} deg parallax${s})`);
      continue
    }
    let o = gu(i, e, d, n, r);
    if (!o) {
      f.push(Cd(e, -1, i.imageIndex, 0, i.observations.length, 0, `rejected`, `PnP-RANSAC rejected ${i.observations.length} 2D-3D correspondences`)),
        k.set(eu(i.imageIndex, i.componentId), i.observations.length);
      let r = n.allowScaledRelativeEdgeRegistration ? au(d, S, y, e, t, T, D, w, n, i.imageIndex, f) : null;
      if (r && await le(r, `after PnP rejection`) || !n.allowRelativeEdgeRegistration)
        continue;
      let o = fu(d, S, y, n, i.imageIndex, f);
      if (o && pu(o, d, y)) {
        tu(k, i.imageIndex),
          se += Su(o.imageIndex, S, y, e, t, d, w, T, D, new Set, n, () => A++, E, te),
          ee(`after ${e[o.imageIndex].name}`);
        let r = await ed(o.imageIndex, S, y, e, t, d, w, T, D, n, j, M, E, oe(o.imageIndex), ne, re)
          , s = y[o.edgeIndex];
        N[o.imageIndex] = {
          method: `relative-edge`,
          anchorIndex: o.anchorIndex,
          edgeIndex: o.edgeIndex,
          inliers: s.verifiedInlierCount,
          parallaxDeg: s.medianParallaxDeg,
          note: `after PnP rejection`
        },
          a(`Registered ${e[o.imageIndex].name} via relative edge after PnP rejection from ${e[o.anchorIndex].name} (${s.verifiedInlierCount} verified inliers, ${s.medianParallaxDeg.toFixed(2)} deg parallax${r})`)
      }
      continue
    }
    tu(k, i.imageIndex);
    let s = M[i.imageIndex];
    for (let e of o.pnpRejectedLocalFeatures)
      s.add(e);
    let c = _u(i, o, e, w, T, D, E);
    se += Su(i.imageIndex, S, y, e, t, d, w, T, D, o.pnpRejectedLocalFeatures, n, () => A++, E, te),
      ee(`after ${e[i.imageIndex].name}`);
    let l = await ed(i.imageIndex, S, y, e, t, d, w, T, D, n, j, M, E, oe(i.imageIndex), ne, re);
    N[i.imageIndex] = {
      method: `pnp`,
      inliers: o.inliers,
      observations: i.observations.length,
      meanReprojectionError: o.meanReprojectionError
    },
      a(`Registered ${e[i.imageIndex].name} via PnP (${o.inliers} / ${i.observations.length} inliers, ${o.meanReprojectionError.toFixed(2)} px${l})`),
      c > 0 && a(`Adopted ${c} PnP inlier observation${c === 1 ? `` : `s`} into sparse tracks`)
  }
  v.length > 0 && a(`Retained ${v.length} low-parallax stitch-only pair${v.length === 1 ? `` : `s`}`);
  let de = Au(d, w, T, D, v.length > 0 ? y.concat(v) : y, j, t, e, n);
  de > 0 && a(`Metric-stitched ${de} secondary component${de === 1 ? `` : `s`} using cross-component 3D correspondences`);
  let fe = ku(n.allowOrderedComponentMerge, d, w, j, f);
  fe > 0 && a(`Aligned ${fe} secondary component${fe === 1 ? `` : `s`} using ordered camera-path continuity`),
    se > 0 && a(`Pruned ${se} match${se === 1 ? `` : `es`} rejected by triangulation hygiene gates from verified edges`);
  let pe = 0;
  for (let e of y) {
    let t = M[e.leftIndex]
      , n = M[e.rightIndex];
    if (t.size === 0 && n.size === 0)
      continue;
    let r = e.matches.length;
    e.matches = e.matches.filter(e => !t.has(e.a) && !n.has(e.b)),
      pe += r - e.matches.length
  }
  pe > 0 && a(`Pruned ${pe} match${pe === 1 ? `` : `es`} on PnP-rejected / refinement-demoted features from verified edges`);
  let me = n.allowOrderedComponentMerge ? Ru(d, f) : 0;
  me > 0 && a(`Merged ${me} ordered-aligned secondary component${me === 1 ? `` : `s`} into the primary camera path`);
  let F = Du(y, d);
  F > 0 && a(`Pruned ${F} cross-component match${F === 1 ? `` : `es`} from verified edges`);
  let he = w.filter(e => e.track.length > 0)
    , ge = d.filter(e => e.registered).length
    , _e = new Set;
  for (let e of d)
    e.registered && e.componentId >= 0 && _e.add(e.componentId);
  let ve = new Set;
  for (let e of d)
    e.registered && ve.add(e.imageId);
  let ye = ae.filter((e, t, n) => e !== void 0 && ve.has(e) && n.indexOf(e) === t)
    , be = [];
  for (let t = 0; t < d.length; t++)
    d[t].registered || (be.push(d[t].name),
      f.push(Cd(e, -1, t, 0, 0, 0, `skipped`, `not registered by graph-pnp`)));
  if (be.length > 0) {
    let e = be.slice(0, 12).join(`, `);
    a(`Unregistered images (${be.length}): ${e}${be.length > 12 ? ` ...` : ``}`)
  }
  let xe = Cc(y, e.length).orphans;
  xe > 0 && a(`Verified edge coverage: ${e.length - xe}/${e.length} images touched (${xe} orphan${xe === 1 ? `` : `s`})`);
  for (let t of wc(N, e, y))
    a(t);
  Dc(d, e, f);
  for (let t of Ec(d, e, f))
    a(t);
  return {
    poses: d,
    edges: y,
    diagnostics: f,
    registeredCount: ge,
    componentCount: _e.size,
    gaugeAnchorImageIds: ye,
    seedPoints: he
  }
}
function Cc(e, t) {
  let n = new Int32Array(t);
  for (let t of e)
    n[t.leftIndex]++,
      n[t.rightIndex]++;
  let r = 0;
  for (let e = 0; e < t; e++)
    n[e] === 0 && r++;
  return {
    perImage: n,
    orphans: r
  }
}
function wc(e, t, n) {
  let r = {
    bootstrap: 0,
    pnp: 0,
    "scaled-relative-edge": 0,
    "relative-edge": 0
  }
    , i = []
    , a = [];
  for (let t = 0; t < e.length; t++) {
    let n = e[t];
    n && (r[n.method]++,
      n.method === `scaled-relative-edge` && i.push({
        imageIndex: t,
        info: n
      }),
      n.method === `relative-edge` && a.push({
        imageIndex: t,
        info: n
      }))
  }
  if (r.bootstrap + r.pnp + r[`scaled-relative-edge`] + r[`relative-edge`] === 0)
    return [];
  let o = [`Registration methods: ${r.bootstrap} bootstrap, ${r.pnp} PnP, ${r[`scaled-relative-edge`]} scaled-relative, ${r[`relative-edge`]} relative-edge`];
  return i.length > 0 && o.push(Tc(`Scaled relative-edge registrations`, i, t, n)),
    a.length === 0 || o.push(Tc(`Relative-edge registrations`, a, t, n)),
    o
}
function Tc(e, t, n, r) {
  let i = t.slice(0, 8).map(({ imageIndex: e, info: t }) => {
    let i = t.anchorIndex === void 0 ? `` : ` from ${n[t.anchorIndex].name}`
      , a = t.edgeIndex === void 0 ? void 0 : r[t.edgeIndex]
      , o = a ? ` via ${n[a.leftIndex].name}<->${n[a.rightIndex].name}` : ``
      , s = t.inliers === void 0 ? `` : t.observations === void 0 ? `, ${t.inliers} verified inliers` : `, ${t.inliers}/${t.observations} inliers`
      , c = t.scale === void 0 ? `` : `, scale ${t.scale.toFixed(3)}`
      , l = t.meanReprojectionError === void 0 ? `` : `, ${t.meanReprojectionError.toFixed(2)} px`
      , u = t.parallaxDeg === void 0 ? `` : `, ${t.parallaxDeg.toFixed(2)} deg parallax`
      , d = t.note ? `, ${t.note}` : ``;
    return `${n[e].name}${i}${o} (${[s, c, l, u, d].join(``).replace(/^, /, ``)})`
  }
  )
    , a = t.length > i.length ? `; ${t.length - i.length} more` : ``;
  return `${e}: ${i.join(`; `)}${a}`
}
function Ec(e, t, n) {
  let r = Oc(e);
  if (!r)
    return [];
  let { steps: i, median: a, maxStep: o, jumps: s } = r
    , c = [`Camera path continuity: ${i.length}/${Math.max(0, e.length - 1)} adjacent registered steps, median ${Rc(a)}, max ${Rc(o.distance)}${s.length > 0 ? `, ${s.length} large jump${s.length === 1 ? `` : `s`}` : `, no large jumps`}`];
  if (s.length === 0)
    return c;
  let l = s.slice(0, 6).map(e => {
    let r = e.distance / a
      , i = kc(n, e.from, e.to);
    return `${t[e.from].name} -> ${t[e.to].name}: ${Rc(e.distance)} (${r.toFixed(1)}x median${i ? `, ${i}` : ``})`
  }
  )
    , u = s.length > l.length ? `; ${s.length - l.length} more` : ``;
  return c.push(`Camera path jumps: ${l.join(`; `)}${u}`),
    c
}
function Dc(e, t, n) {
  let r = Oc(e);
  if (!r || r.jumps.length === 0)
    return 0;
  let i = 0;
  for (let e of r.jumps) {
    let a = Ac(n, e.from, e.to);
    if (!a || a.status === `rejected` || a.status === `skipped`)
      continue;
    let o = e.distance / r.median;
    a.status = `weak`,
      a.note.includes(`large camera-center jump`) || (a.note = `large camera-center jump ${Rc(e.distance)} (${o.toFixed(1)}x median) despite ${a.note}`),
      a.leftImage = t[e.from].name,
      a.rightImage = t[e.to].name,
      i++
  }
  return i
}
function Oc(e) {
  let t = [];
  for (let n = 0; n + 1 < e.length; n++) {
    let r = e[n]
      , i = e[n + 1];
    if (!r.registered || !i.registered || r.componentId >= 0 && i.componentId >= 0 && r.componentId !== i.componentId)
      continue;
    let a = Fc(r.center, i.center);
    Number.isFinite(a) && t.push({
      from: n,
      to: n + 1,
      distance: a
    })
  }
  if (t.length < 2)
    return null;
  let n = Ic(t.map(e => e.distance));
  if (!Number.isFinite(n) || n <= 0)
    return null;
  let r = t[0];
  for (let e of t)
    e.distance > r.distance && (r = e);
  let i = n * 4
    , a = t.filter(e => e.distance > i).sort((e, t) => t.distance - e.distance);
  return {
    steps: t,
    median: n,
    maxStep: r,
    jumps: a
  }
}
function kc(e, t, n) {
  let r = Ac(e, t, n);
  return r ? `${r.status}: ${r.note}` : ``
}
function Ac(e, t, n) {
  return e.find(e => e.leftIndex === t && e.rightIndex === n || e.leftIndex === n && e.rightIndex === t)
}
function jc(e, t, n) {
  let r = Math.min(e, t)
    , i = Math.max(e, t);
  for (let e = r; e < i; e++) {
    let t = Ac(n, e, e + 1);
    if (t && Mc(t))
      return t
  }
  return null
}
function Mc(e) {
  return Math.abs(e.rightIndex - e.leftIndex) === 1 && e.status !== `ok`
}
function Nc(e, t) {
  if (e.source === `manual`)
    return !0;
  if (Math.abs(e.rightIndex - e.leftIndex) <= 1)
    return !1;
  let n = Pc(t)
    , r = Math.max(t.minVerifiedParallaxDeg, .5);
  return e.verifiedInlierCount >= n && e.medianParallaxDeg >= r
}
function Pc(e) {
  return Math.max(e.minMatches, Math.ceil(e.pnpMinInliers * .75))
}
function Fc(e, t) {
  return Math.hypot(e[0] - t[0], e[1] - t[1], e[2] - t[2])
}
function Ic(e) {
  let t = e.filter(Number.isFinite);
  if (t.length === 0)
    return NaN;
  let n = t.length >> 1
    , r = Lc(t, n);
  return (t.length & 1) == 1 ? r : (Lc(t, n - 1) + r) / 2
}
function Lc(e, t) {
  let n = 0
    , r = e.length - 1;
  for (; n < r;) {
    let i = e[n + r >> 1]
      , a = n
      , o = r;
    for (; a <= o;) {
      for (; e[a] < i;)
        a++;
      for (; e[o] > i;)
        o--;
      if (a <= o) {
        let t = e[a];
        e[a] = e[o],
          e[o] = t,
          a++,
          o--
      }
    }
    if (t <= o)
      r = o;
    else if (t >= a)
      n = a;
    else
      return e[t]
  }
  return e[n]
}
function Rc(e) {
  return Number.isFinite(e) ? Math.abs(e) >= 100 ? e.toFixed(1) : Math.abs(e) >= 10 ? e.toFixed(2) : e.toFixed(3) : `n/a`
}
var zc = 160
  , Bc = 64;
function Vc(e, t, n, r) {
  let i = e.length
    , a = e => Gc(Uc(e, n.pairCandidateBudget), n.manualPairCandidates, i);
  if (n.pairStrategy === `exhaustive`)
    return a({
      pairs: qc(i),
      effectiveStrategy: `exhaustive`
    });
  if (n.pairStrategy === `sequential`)
    return a({
      pairs: Jc(i, n.sequentialGap),
      effectiveStrategy: `sequential`
    });
  let o = Hc(n.pairCandidateBudget) > 0
    , s = i * (i - 1) / 2 <= n.retrievalTopK * i;
  if (!o && s && i <= Bc)
    return a({
      pairs: qc(i),
      effectiveStrategy: `exhaustive`,
      reason: `topK covers all pairs`
    });
  if (!o && r && i <= zc)
    return a({
      pairs: qc(i),
      effectiveStrategy: `exhaustive`,
      reason: `auto-upgrade N<=${zc}`
    });
  let c = Qc(t);
  return a({
    pairs: Yc([Jc(i, n.sequentialGap), Xc(i, c, n.retrievalTopK)]),
    effectiveStrategy: `retrieval`,
    reason: s && i > Bc ? `topK covers all pairs; retrieval kept bounded for N>${Bc}` : `sequential neighbours prioritized`
  })
}
function Hc(e) {
  return e === void 0 || !Number.isFinite(e) || e <= 0 ? 0 : Math.max(1, Math.floor(e))
}
function Uc(e, t) {
  let n = Hc(t);
  return n <= 0 || e.pairs.length <= n ? e : {
    ...e,
    pairs: e.pairs.slice(0, n),
    reason: Wc(e.reason, `candidate cap ${n}`)
  }
}
function Wc(e, t) {
  return e ? `${e}; ${t}` : t
}
function Gc(e, t, n) {
  if (!t || t.length === 0)
    return e;
  let r = new Set
    , i = [];
  for (let t of e.pairs) {
    let e = Math.min(t.i, t.j)
      , n = Math.max(t.i, t.j)
      , a = ll(e, n);
    r.has(a) || (r.add(a),
      i.push({
        i: e,
        j: n
      }))
  }
  let a = t.filter(e => Number.isInteger(e.i) && Number.isInteger(e.j) && e.i !== e.j && e.i >= 0 && e.j >= 0 && e.i < n && e.j < n).map(e => ({
    i: Math.min(e.i, e.j),
    j: Math.max(e.i, e.j)
  })).sort((e, t) => e.i - t.i || e.j - t.j)
    , o = !1;
  for (let e of a) {
    let t = ll(e.i, e.j);
    if (r.has(t)) {
      o = !0;
      continue
    }
    r.add(t),
      i.push(e),
      o = !0
  }
  return o ? {
    ...e,
    pairs: i,
    reason: e.reason ? `${e.reason}; manual pairs included` : `manual pairs included`
  } : e
}
function Kc(e, t, n) {
  if ((!e || e.length === 0) && t.size === 0)
    return e ? [...e] : void 0;
  let r = []
    , i = new Set
    , a = (e, t) => {
      if (!Number.isInteger(e) || !Number.isInteger(t) || e < 0 || t < 0 || e >= n || t >= n || e === t)
        return;
      let a = Math.min(e, t)
        , o = Math.max(e, t)
        , s = ll(a, o);
      i.has(s) || (i.add(s),
        r.push({
          i: a,
          j: o
        }))
    }
    ;
  for (let t of e ?? [])
    a(t.i, t.j);
  for (let e of t.keys()) {
    let [t, n] = e.split(`:`).map(Number);
    a(t, n)
  }
  return r.length > 0 ? r : void 0
}
function qc(e) {
  let t = [];
  for (let n = 0; n < e; n++)
    for (let r = n + 1; r < e; r++)
      t.push({
        i: n,
        j: r
      });
  return t
}
function Jc(e, t) {
  let n = []
    , r = Math.max(1, t);
  for (let t = 0; t < e; t++)
    for (let i = t + 1; i < Math.min(e, t + r + 1); i++)
      n.push({
        i: t,
        j: i
      });
  return n
}
function Yc(e) {
  let t = []
    , n = new Set;
  for (let r of e)
    for (let e of r) {
      let r = Math.min(e.i, e.j)
        , i = Math.max(e.i, e.j)
        , a = ll(r, i);
      n.has(a) || (n.add(a),
        t.push({
          i: r,
          j: i
        }))
    }
  return t
}
function Xc(e, t, n) {
  let r = new Map
    , i = Array(e - 1);
  for (let a = 0; a < e; a++) {
    let o = 0;
    for (let n = 0; n < e; n++)
      n !== a && (i[o++] = {
        j: n,
        d: $c(t[a], t[n])
      });
    i.length = o,
      i.sort((e, t) => e.d - t.d || e.j - t.j);
    let s = Math.min(n, i.length);
    for (let t = 0; t < s; t++) {
      let n = i[t].j
        , o = Math.min(a, n)
        , s = Math.max(a, n)
        , c = o * e + s
        , l = {
          i: o,
          j: s,
          distance: i[t].d,
          rank: t + 1,
          gap: s - o
        }
        , u = r.get(c);
      (!u || Zc(l, u) < 0) && r.set(c, l)
    }
  }
  return Array.from(r.values()).sort(Zc).map(({ i: e, j: t }) => ({
    i: e,
    j: t
  }))
}
function Zc(e, t) {
  return e.distance - t.distance || e.rank - t.rank || e.gap - t.gap || e.i - t.i || e.j - t.j
}
function Qc(e) {
  let t = new Int16Array(256);
  return e.map(e => {
    let n = new Uint32Array(ic);
    if (e.count === 0)
      return {
        words: n
      };
    let r = Math.min(384, e.count);
    t.fill(0);
    for (let n = 0; n < r; n++) {
      let r = n * ic;
      for (let n = 0; n < ic; n++) {
        let i = e.descriptors[r + n];
        for (let e = 0; e < 32; e++)
          t[n * 32 + e] += i & 1,
            i >>>= 1
      }
    }
    let i = r * .5;
    for (let e = 0; e < 256; e++)
      t[e] > i && (n[e >> 5] |= 1 << (e & 31));
    return {
      words: n
    }
  }
  )
}
function $c(e, t) {
  let n = 0;
  for (let r = 0; r < ic; r++)
    n += el(e.words[r] ^ t.words[r]);
  return n
}
function el(e) {
  return e >>>= 0,
    e -= e >>> 1 & 1431655765,
    e = (e & 858993459) + (e >>> 2 & 858993459),
    (e + (e >>> 4) & 252645135) * 16843009 >>> 24
}
function tl(e, t) {
  let n = new Int32Array(t)
    , r = new Int32Array(t);
  for (let e = 0; e < t; e++)
    n[e] = e;
  let i = e => {
    let t = e;
    for (; n[t] !== t;)
      t = n[t];
    for (; n[e] !== e;) {
      let r = n[e];
      n[e] = t,
        e = r
    }
    return t
  }
    , a = (e, t) => {
      let r = i(e)
        , a = i(t);
      if (r === a)
        return;
      let o = Math.min(r, a)
        , s = Math.max(r, a);
      n[s] = o
    }
    ;
  for (let t of e)
    a(t.leftIndex, t.rightIndex),
      r[t.leftIndex]++,
      r[t.rightIndex]++;
  let o = new Map;
  for (let e = 0; e < t; e++) {
    let t = i(e)
      , n = o.get(t);
    n ? n.push(e) : o.set(t, [e])
  }
  let s = [];
  for (let e of o.values()) {
    e.sort((e, t) => e - t);
    let t = 0;
    for (let n of e)
      t += r[n];
    s.push({
      id: s.length,
      indices: e,
      edgeCount: t / 2
    })
  }
  s.sort((e, t) => t.indices.length === e.indices.length ? e.indices[0] - t.indices[0] : t.indices.length - e.indices.length);
  for (let e = 0; e < s.length; e++)
    s[e].id = e;
  return s
}
function nl(e, t, n) {
  let r = t.map(e => e.indices.length).join(`, `)
    , i = t.slice(0, 4).map(e => {
      let t = e.indices[0]
        , r = e.indices[e.indices.length - 1];
      return `${t === r ? n[t].name : `${n[t].name}..${n[r].name}`} (${e.indices.length})`
    }
    ).join(`; `);
  return `${e}: ${t.length} component${t.length === 1 ? `` : `s`} [${r}]${i ? `; largest: ${i}` : ``}`
}
function rl(e, t, n, r) {
  if (e.length <= 1)
    return [];
  let i = new Int32Array(n).fill(-1);
  for (let t of e)
    for (let e of t.indices)
      i[e] = t.id;
  let a = new Set;
  for (let e of t)
    a.add(ll(e.leftIndex, e.rightIndex));
  let o = [];
  for (let t = 0; t < n; t++) {
    let r = i[t];
    if (r < 0)
      continue;
    let s = Math.min(n, t + ac + 1);
    for (let n = t + 1; n < s; n++) {
      let s = i[n];
      s < 0 || r === s || a.has(ll(t, n)) || o.push({
        i: t,
        j: n,
        gap: n - t,
        sizeRank: e[r].indices.length + e[s].indices.length
      })
    }
  }
  o.sort((e, t) => e.gap === t.gap ? t.sizeRank === e.sizeRank ? e.i - t.i || e.j - t.j : t.sizeRank - e.sizeRank : e.gap - t.gap);
  let s = o.slice(0, oc).map(({ i: e, j: t }) => ({
    i: e,
    j: t
  }))
    , c = new Set(a);
  for (let e of s)
    c.add(ll(e.i, e.j));
  let l = il(e, i, c, n, r, sc)
    , u = []
    , d = new Set;
  for (let e of s.concat(l)) {
    let t = ll(e.i, e.j);
    if (!d.has(t) && (d.add(t),
      u.push(e),
      u.length >= cc))
      break
  }
  return u
}
function il(e, t, n, r, i, a) {
  if (!i || i.length < r || a <= 0)
    return [];
  let o = Qc(i.slice(0, r))
    , s = e.map(e => e.indices.length)
    , c = []
    , l = new Set;
  for (let e = 0; e < r; e++) {
    let i = t[e];
    if (i < 0)
      continue;
    let a = [];
    for (let c = 0; c < r; c++) {
      if (e === c)
        continue;
      let r = t[c];
      if (r < 0 || i === r)
        continue;
      let u = Math.min(e, c)
        , d = Math.max(e, c)
        , f = ll(u, d);
      n.has(f) || l.has(f) || a.push({
        i: u,
        j: d,
        distance: $c(o[e], o[c]),
        gap: d - u,
        sizeRank: (s[i] ?? 0) + (s[r] ?? 0)
      })
    }
    a.sort((e, t) => e.distance === t.distance ? t.sizeRank === e.sizeRank ? e.gap === t.gap ? e.i - t.i || e.j - t.j : e.gap - t.gap : t.sizeRank - e.sizeRank : e.distance - t.distance);
    let u = Math.min(lc, a.length);
    for (let e = 0; e < u; e++) {
      let t = a[e];
      l.add(ll(t.i, t.j)),
        c.push(t)
    }
  }
  return c.sort((e, t) => e.distance === t.distance ? t.sizeRank === e.sizeRank ? e.gap === t.gap ? e.i - t.i || e.j - t.j : e.gap - t.gap : t.sizeRank - e.sizeRank : e.distance - t.distance),
    c.slice(0, a).map(({ i: e, j: t }) => ({
      i: e,
      j: t
    }))
}
function al(e, t, n, r = new Map) {
  let i = new Set;
  for (let e of n)
    e.status !== `ok` && Math.abs(e.rightIndex - e.leftIndex) === 1 && i.add(ll(e.leftIndex, e.rightIndex));
  for (let [e, t] of r) {
    let n = t.diagnostic;
    !n || n.status === `ok` || Math.abs(n.rightIndex - n.leftIndex) === 1 && i.add(e)
  }
  let a = [];
  for (let n of e) {
    if (Math.abs(n.j - n.i) !== 1)
      continue;
    let e = ll(n.i, n.j);
    t.has(e) || i.has(e) && a.push({
      i: n.i,
      j: n.j
    })
  }
  return a
}
async function ol(e, t, n, r, i, a, o, s, c) {
  if (n.length === 0)
    return [];
  let l = {
    ...r,
    matcherHammingMax: Math.min(192, Math.max(r.matcherHammingMax + 24, Math.round(r.matcherHammingMax * 1.25))),
    matcherRatio: Math.min(.98, Math.max(r.matcherRatio + .04, .94))
  }
    , u = Pc(r);
  c(`Bridge retry gates: Hamming <= ${l.matcherHammingMax}, ratio <= ${l.matcherRatio.toFixed(2)}, min inliers ${u}`);
  let d = await jl(t, n, a, l, c)
    , f = await Ol(e, t, n, d, i, Math.min(8e3, Math.max(r.ransacIterations, Math.floor(r.ransacIterations * 1.5))), 4.5, u, r.relativePoseSolver, c)
    , p = [];
  for (let a = 0; a < n.length; a++) {
    let c = n[a]
      , l = d[a] ?? [];
    if (l.length < u) {
      o.push(Cd(e, c.i, c.j, l.length, l.length, 0, `rejected`, `bridge retry: too few relaxed matches`));
      continue
    }
    let m = f ? f[a] : await _e(e[c.i], e[c.j], t[c.i], t[c.j], l, Math.min(8e3, Math.max(r.ransacIterations, Math.floor(r.ransacIterations * 1.5))), 4.5, i, Al(r));
    if (!m || m.inliers.length < u) {
      o.push(Cd(e, c.i, c.j, l.length, l.length, m?.inliers.length ?? 0, `rejected`, `bridge retry: epipolar verification rejected`));
      continue
    }
    let h = Vl(e[c.i], e[c.j], t[c.i], t[c.j], m);
    if (r.minVerifiedParallaxDeg > 0 && h < r.minVerifiedParallaxDeg) {
      bl(s, c, m, t[c.i], t[c.j], h, r),
        o.push(Cd(e, c.i, c.j, l.length, l.length, m.inliers.length, `weak`, `bridge retry: low parallax ${h.toFixed(2)} deg`));
      continue
    }
    let g = Bl(m.inliers, t[c.i], t[c.j], r.maxPointsPerPair);
    p.push({
      leftIndex: c.i,
      rightIndex: c.j,
      source: `automatic`,
      verifiedInlierCount: m.inliers.length,
      matches: g,
      medianParallaxDeg: h,
      relative: m
    }),
      o.push(Cd(e, c.i, c.j, l.length, l.length, m.inliers.length, `ok`, `bridge retry verified, ${h.toFixed(2)} deg parallax`))
  }
  return p
}
async function sl(e, t, n, r, i, a, o, s, c, l, u) {
  if (n.length === 0)
    return [];
  let d = {
    ...r,
    matcherHammingMax: Math.min(192, Math.max(r.matcherHammingMax + 24, Math.round(r.matcherHammingMax * 1.25))),
    matcherRatio: Math.min(.98, Math.max(r.matcherRatio + .04, .94))
  }
    , f = Math.min(8e3, Math.max(r.ransacIterations, uc, Math.floor(r.ransacIterations * 4)));
  u(`Adjacent retry gates: Hamming <= ${d.matcherHammingMax}, ratio <= ${d.matcherRatio.toFixed(2)}, ${f} RANSAC, ${dc.toFixed(1)} px`);
  let p = await jl(t, n, a, d, u)
    , m = await Ol(e, t, n, p, i, f, dc, r.minMatches, r.relativePoseSolver, u)
    , h = [];
  for (let a = 0; a < n.length; a++) {
    let u = n[a]
      , d = ll(u.i, u.j);
    if (s.has(d))
      continue;
    let g = p[a] ?? [];
    if (g.length < r.minMatches)
      continue;
    let _ = t[u.i]
      , v = t[u.j]
      , y = m ? m[a] : await _e(e[u.i], e[u.j], _, v, g, f, dc, i, Al(r));
    if (!y || y.inliers.length < r.minMatches)
      continue;
    let b = Vl(e[u.i], e[u.j], _, v, y);
    if (r.minVerifiedParallaxDeg > 0 && b < r.minVerifiedParallaxDeg) {
      bl(l, u, y, _, v, b, r);
      continue
    }
    let x = Bl(y.inliers, _, v, r.maxPointsPerPair);
    h.push({
      leftIndex: u.i,
      rightIndex: u.j,
      source: `automatic`,
      verifiedInlierCount: y.inliers.length,
      matches: x,
      medianParallaxDeg: b,
      relative: y
    }),
      s.add(d),
      c.delete(d),
      cl(o, u.i, u.j),
      o.push(Cd(e, u.i, u.j, g.length, g.length, y.inliers.length, `weak`, `adjacent retry verified, ${b.toFixed(2)} deg parallax`))
  }
  return h
}
function cl(e, t, n) {
  for (let r = e.length - 1; r >= 0; r--) {
    let i = e[r];
    (i.leftIndex === t && i.rightIndex === n || i.leftIndex === n && i.rightIndex === t) && e.splice(r, 1)
  }
}
function ll(e, t) {
  return e < t ? `${e}:${t}` : `${t}:${e}`
}
function ul(e, t, n) {
  let r = Math.round(Id(t, 32, 192))
    , i = Id(n, .5, .98);
  return {
    enabled: e,
    baseHammingMax: r,
    baseRatio: i,
    hammingMax: r,
    ratio: i,
    inlierDistances: [],
    inlierSampleCount: 0,
    selectScratch: [],
    acceptedEdges: 0,
    changed: !1
  }
}
function dl(e, t) {
  if (!e.enabled)
    return ml(e, !1);
  let n = 0;
  for (let r of t) {
    let t = r.distance;
    !Number.isFinite(t) || t < 0 || (fl(e, Math.min(256, Math.max(0, Math.round(t)))),
      n++)
  }
  if (n > 0 && e.acceptedEdges++,
    e.inlierSampleCount < fc || e.inlierDistances.length === 0)
    return ml(e, !1);
  let r = Math.min(e.inlierDistances.length - 1, Math.max(0, Math.ceil(e.inlierDistances.length * pc) - 1));
  e.selectScratch.length = e.inlierDistances.length;
  for (let t = 0; t < e.inlierDistances.length; t++)
    e.selectScratch[t] = e.inlierDistances[t];
  let i = Lc(e.selectScratch, r) + mc
    , a = Math.min(192, e.baseHammingMax + hc)
    , o = Math.round(Id(i, e.baseHammingMax, a));
  return o > e.hammingMax ? (e.hammingMax = o,
    e.changed = !0,
    ml(e, !0)) : ml(e, !1)
}
function fl(e, t) {
  if (e.inlierSampleCount++,
    e.inlierDistances.length < _c) {
    e.inlierDistances.push(t);
    return
  }
  let n = pl(e.inlierSampleCount);
  n < _c && (e.inlierDistances[n] = t)
}
function pl(e) {
  let t = Math.imul(e >>> 0, 2654435761);
  return t ^= t >>> 16,
    t = Math.imul(t, 2246822507),
    t ^= t >>> 13,
    (t >>> 0) % e
}
function ml(e, t) {
  return {
    changed: t,
    hammingMax: e.hammingMax,
    ratio: e.ratio,
    samples: e.inlierSampleCount,
    acceptedEdges: e.acceptedEdges
  }
}
function hl(e, t, n, r) {
  let i = ll(t.i, t.j)
    , a = e.get(i);
  if (a && a.baseMatches >= n) {
    !a.diagnostic && r && (a.diagnostic = r);
    return
  }
  e.set(i, {
    candidate: t,
    baseMatches: n,
    diagnostic: r
  })
}
function gl(e, t) {
  let n = Array.from(e.values()).filter(e => !t.has(ll(e.candidate.i, e.candidate.j))).sort((e, t) => t.baseMatches === e.baseMatches ? e.candidate.i === t.candidate.i ? e.candidate.j - t.candidate.j : e.candidate.i - t.candidate.i : t.baseMatches - e.baseMatches)
    , r = n.slice(0, gc).map(e => e.candidate);
  return {
    selected: r,
    total: n.length,
    truncated: Math.max(0, n.length - r.length)
  }
}
function _l(e, t, n) {
  for (let r of t.values())
    n.has(ll(r.candidate.i, r.candidate.j)) || r.diagnostic && e.push(r.diagnostic)
}
function vl(e, t) {
  return {
    pairs: e.map(e => ({
      i: e.i,
      j: e.j
    })),
    matches: t.map(e => [...e])
  }
}
function yl(e) {
  return e.length > 0 && e.every(e => /^EXIF\b/.test(e.intrinsics.source))
}
function bl(e, t, n, r, i, a, o) {
  let s = Bl(n.inliers, r, i, o.maxPointsPerPair);
  e.push({
    leftIndex: t.i,
    rightIndex: t.j,
    source: `automatic`,
    verifiedInlierCount: n.inliers.length,
    matches: s,
    medianParallaxDeg: a,
    relative: n
  })
}
function xl() {
  return {
    endpointFeatureCount: 0,
    tooFewMatches: 0,
    ransacFailed: 0,
    tooFewInliers: 0,
    lowParallax: 0,
    budgetSkipped: 0,
    accepted: 0
  }
}
function Sl(e) {
  let t = e.budgetSkipped ?? 0
    , n = t > 0 ? `, budgetSkipped=${t}` : ``;
  return `Verification rejection mix: endpoints<8=${e.endpointFeatureCount}, tooFewMatches=${e.tooFewMatches}, ransacFailed=${e.ransacFailed}, tooFewInliers=${e.tooFewInliers}, lowParallax=${e.lowParallax}${n}, accepted=${e.accepted}`
}
function Cl(e, t, n, r) {
  let i = wl(r.geometryCandidateBudget)
    , a = [];
  for (let i = 0; i < e.length; i += 1) {
    let o = e[i]
      , s = n[i] ?? [];
    s.length < r.minMatches || a.push({
      candidate: o,
      matches: s,
      sourceIndex: t[i],
      matchCount: s.length,
      gap: Math.abs(o.j - o.i)
    })
  }
  let o = i > 0 && a.length > i ? a.slice().sort((e, t) => Tl(e, t, r.sequentialGap)).slice(0, i) : a
    , s = new Set(o.map(e => e.sourceIndex))
    , c = new Set;
  for (let e of a)
    s.has(e.sourceIndex) || c.add(e.sourceIndex);
  return o.sort((e, t) => e.sourceIndex - t.sourceIndex),
  {
    candidates: o.map(e => e.candidate),
    matches: o.map(e => e.matches),
    sourceIndices: o.map(e => e.sourceIndex),
    skippedCandidateIndices: c,
    eligibleCount: a.length,
    budget: i
  }
}
function wl(e) {
  return e === void 0 || !Number.isFinite(e) || e <= 0 ? 0 : Math.max(1, Math.floor(e))
}
function Tl(e, t, n) {
  return El(e.gap, n) - El(t.gap, n) || t.matchCount - e.matchCount || e.gap - t.gap || e.candidate.i - t.candidate.i || e.candidate.j - t.candidate.j
}
function El(e, t) {
  return e === 1 ? 0 : e <= Math.max(1, t) ? 1 : 2
}
async function Dl(e, t, n, r, i, a, o, s, c, l, u = new Map, d) {
  let f = []
    , p = new Set
    , m = xl()
    , h = ul(r.adaptiveMatcherThresholds, r.matcherHammingMax, r.matcherRatio)
    , g = new Map
    , _ = []
    , v = [];
  for (let e = 0; e < n.length; e++) {
    let r = n[e];
    if (!u.has(Ui(r.i, r.j))) {
      if (t[r.i].count < 8 || t[r.j].count < 8) {
        m.endpointFeatureCount++;
        continue
      }
      _.push(r),
        v.push(e)
    }
  }
  let y = await Ml(t, _, a, r, c, l, d)
    , b = new Map;
  for (let e = 0; e < v.length; e += 1)
    b.set(v[e], y[e] ?? []);
  if (r.autoFocalProbe && yl(e))
    c(`Focal probe skipped: EXIF focal metadata available for all selected images`);
  else if (r.autoFocalProbe) {
    let n = Rl()
      , i = vl(_, y)
      , a = Math.min(4, Math.max(2, Math.ceil(Math.min(i.pairs.length, r.focalProbeMaxPairs) * .2)))
      , o = i.pairs.length >= a ? await Ss(e, t, i.pairs, i.matches, {
        ratios: r.focalProbeRatios,
        minMatches: r.minMatches,
        maxPairs: r.focalProbeMaxPairs,
        maxMatchesPerPair: r.focalProbeMaxMatchesPerPair,
        ransacIterations: Math.min(r.ransacIterations, 320),
        pixelThreshold: 3,
        minAcceptedPairs: a
      }) : null;
    if (o) {
      let e = o.scores.map(e => `${e.ratio.toFixed(2)}x:${e.acceptedPairs}/${e.testedPairs},${e.totalInliers}`).join(` `);
      c(`Focal probe: ${o.previousRatio.toFixed(2)}x -> ${o.selectedRatio.toFixed(2)}x in ${zl(Rl() - n)} (${e})`)
    } else
      c(`Focal probe skipped: insufficient reliable descriptor pairs`)
  }
  let x = Cl(_, v, y, r);
  x.skippedCandidateIndices.size > 0 && c(`Geometry budget: verifying ${x.candidates.length.toLocaleString()} / ${x.eligibleCount.toLocaleString()} match-qualified automatic pairs (budget ${x.budget.toLocaleString()}; skipped ${x.skippedCandidateIndices.size.toLocaleString()})`);
  let S = await Ol(e, t, x.candidates, x.matches, i, r.ransacIterations, 3, r.minMatches, r.relativePoseSolver, c)
    , C = new Map;
  if (S)
    for (let e = 0; e < x.sourceIndices.length; e += 1)
      C.set(x.sourceIndices[e], S[e] ?? null);
  let w = 0
    , T = vt(r.relativePoseSolver);
  for (let a = 0; a < n.length; a++) {
    let l = n[a]
      , d = a + 1
      , _ = u.get(Ui(l.i, l.j));
    if (_) {
      let n = t[l.i]
        , a = t[l.j];
      if (_.matches.length < T) {
        o.push(Cd(e, l.i, l.j, 0, _.matches.length, _.matches.length, `weak`, `manual ground truth: ${_.matches.length}/${T} points`)),
          d - w >= 256 && (c(`Verified ${f.length} / ${d} pairs so far`),
            w = d);
        continue
      }
      let s = `${r.relativePoseSolver} RANSAC`
        , u = await _e(e[l.i], e[l.j], n, a, _.matches, Math.max(r.ransacIterations, 640), 3, i, {
          ...Al(r),
          minInliers: T
        });
      if (!u || u.inliers.length < T) {
        o.push(Cd(e, l.i, l.j, 0, _.matches.length, u?.inliers.length ?? 0, `rejected`, `manual ground truth did not produce a stable relative pose`)),
          d - w >= 256 && (c(`Verified ${f.length} / ${d} pairs so far`),
            w = d);
        continue
      }
      let m = Pl(e[l.i], e[l.j], n, a, _.matches, u, vc);
      if (m.length < T) {
        o.push(Cd(e, l.i, l.j, 0, _.matches.length, m.length, `rejected`, `manual ground truth reprojection filter kept ${m.length}/${_.matches.length} points`)),
          d - w >= 256 && (c(`Verified ${f.length} / ${d} pairs so far`),
            w = d);
        continue
      }
      let h = {
        ...u,
        inliers: m
      }
        , g = Vl(e[l.i], e[l.j], n, a, h);
      f.push({
        leftIndex: l.i,
        rightIndex: l.j,
        source: `manual`,
        verifiedInlierCount: m.length,
        matches: m,
        medianParallaxDeg: g,
        relative: h
      }),
        p.add(ll(l.i, l.j)),
        o.push(Cd(e, l.i, l.j, 0, _.matches.length, m.length, `ok`, `manual ground truth verified (${s}, ${m.length}/${_.matches.length} inliers), ${g.toFixed(2)} deg parallax`)),
        d - w >= 256 && (c(`Verified ${f.length} / ${d} pairs so far`),
          w = d);
      continue
    }
    let v = b.get(a);
    if (!v) {
      d - w >= 256 && (c(`Verified ${f.length} / ${d} pairs so far`),
        w = d);
      continue
    }
    if (v.length >= r.minMatches) {
      if (x.skippedCandidateIndices.has(a)) {
        m.budgetSkipped = (m.budgetSkipped ?? 0) + 1,
          o.push(Cd(e, l.i, l.j, v.length, v.length, 0, `skipped`, `geometry budget skipped; ${x.candidates.length.toLocaleString()} strongest/nearest automatic pairs verified`)),
          d - w >= 256 && (c(`Verified ${f.length} / ${d} pairs so far`),
            w = d);
        continue
      }
      let n = t[l.i]
        , u = t[l.j]
        , _ = S ? C.get(a) ?? null : await _e(e[l.i], e[l.j], n, u, v, r.ransacIterations, 3, i, Al(r));
      if (!_ || _.inliers.length < r.minMatches) {
        _ ? m.tooFewInliers++ : m.ransacFailed++;
        let t = Cd(e, l.i, l.j, v.length, v.length, _?.inliers.length ?? 0, `rejected`, `epipolar verification rejected`);
        h.enabled ? hl(g, l, v.length, t) : o.push(t)
      } else {
        let t = Vl(e[l.i], e[l.j], n, u, _);
        if (r.minVerifiedParallaxDeg > 0 && t < r.minVerifiedParallaxDeg)
          m.lowParallax++,
            bl(s, l, _, n, u, t, r),
            o.push(Cd(e, l.i, l.j, v.length, v.length, _.inliers.length, `weak`, `low parallax ${t.toFixed(2)} deg`));
        else {
          m.accepted++;
          let i = Bl(_.inliers, n, u, r.maxPointsPerPair);
          f.push({
            leftIndex: l.i,
            rightIndex: l.j,
            source: `automatic`,
            verifiedInlierCount: _.inliers.length,
            matches: i,
            medianParallaxDeg: t,
            relative: _
          }),
            p.add(ll(l.i, l.j)),
            dl(h, _.inliers),
            o.push(Cd(e, l.i, l.j, v.length, v.length, _.inliers.length, `ok`, `verified, ${t.toFixed(2)} deg parallax`))
        }
      }
    } else
      h.enabled && v.length > 0 ? (m.tooFewMatches++,
        hl(g, l, v.length)) : m.tooFewMatches++;
    d - w >= 256 && (c(`Verified ${f.length} / ${d} pairs so far`),
      w = d)
  }
  if (c(Sl(m)),
    h.enabled && h.changed && g.size > 0) {
    let n = gl(g, p);
    if (n.selected.length > 0) {
      let l = {
        ...r,
        matcherHammingMax: h.hammingMax,
        matcherRatio: h.ratio,
        adaptiveMatcherThresholds: !1
      };
      c(`Session matcher gates: Hamming ${h.baseHammingMax} -> ${h.hammingMax} from ${h.inlierDistances.length} verified inlier descriptors; ratio remains ${h.ratio.toFixed(2)}; retrying ${n.selected.length} / ${n.total} candidate pairs` + (n.truncated > 0 ? ` (${n.truncated} deferred)` : ``));
      let u = await jl(t, n.selected, a, l, c)
        , d = await Ol(e, t, n.selected, u, i, r.ransacIterations, 3, r.minMatches, r.relativePoseSolver, c);
      for (let a = 0; a < n.selected.length; a++) {
        let c = n.selected[a]
          , l = ll(c.i, c.j)
          , m = u[a] ?? [];
        if (m.length < r.minMatches)
          continue;
        let _ = t[c.i]
          , v = t[c.j]
          , y = d ? d[a] : await _e(e[c.i], e[c.j], _, v, m, r.ransacIterations, 3, i, Al(r));
        if (!y || y.inliers.length < r.minMatches) {
          o.push(Cd(e, c.i, c.j, m.length, m.length, y?.inliers.length ?? 0, `rejected`, `session-adapted retry rejected (Hamming <= ${h.hammingMax})`)),
            g.delete(l);
          continue
        }
        let b = Vl(e[c.i], e[c.j], _, v, y);
        if (r.minVerifiedParallaxDeg > 0 && b < r.minVerifiedParallaxDeg) {
          bl(s, c, y, _, v, b, r),
            o.push(Cd(e, c.i, c.j, m.length, m.length, y.inliers.length, `weak`, `session-adapted retry: low parallax ${b.toFixed(2)} deg`)),
            g.delete(l);
          continue
        }
        let x = Bl(y.inliers, _, v, r.maxPointsPerPair);
        f.push({
          leftIndex: c.i,
          rightIndex: c.j,
          source: `automatic`,
          verifiedInlierCount: y.inliers.length,
          matches: x,
          medianParallaxDeg: b,
          relative: y
        }),
          p.add(l),
          g.delete(l),
          o.push(Cd(e, c.i, c.j, m.length, m.length, y.inliers.length, `ok`, `session-adapted retry verified, ${b.toFixed(2)} deg parallax`))
      }
    }
  }
  let E = al(n, p, o, g);
  if (E.length > 0) {
    c(`Adjacent retry: ${E.length} failed adjacent pair${E.length === 1 ? `` : `s`} with relaxed matcher and geometry gates`);
    let n = await sl(e, t, E, r, i, a, o, p, g, s, c);
    f.push(...n),
      n.length > 0 ? c(`Adjacent retry accepted ${n.length} additional pair${n.length === 1 ? `` : `s`}`) : c(`Adjacent retry accepted 0 additional pairs`)
  }
  return _l(o, g, p),
    f
}
async function Ol(e, t, n, r, i, a, o, s, c, l) {
  let u = kl(i)
    , d = c === `eight-point` && u
    , f = c === `five-point` && u
    , p = 0
    , m = 0;
  for (let e = 0; e < n.length; e++) {
    let t = r[e] ?? [];
    t.length < s || (p++,
      m += t.length * a)
  }
  return p === 0 ? Array(n.length).fill(null) : (l(d ? `Geometric verification: batching ${p} candidate pair${p === 1 ? `` : `s`} (${m.toLocaleString()} planned Sampson tests)` : f ? `Geometric verification: 5-point hybrid verification for ${p} candidate pair${p === 1 ? `` : `s`} (${m.toLocaleString()} planned Sampson tests before adaptive chunking)` : `Geometric verification: CPU ${c} verification for ${p} candidate pair${p === 1 ? `` : `s`} (${m.toLocaleString()} planned Sampson tests)`),
    ye(e, t, n, r, {
      ransacIterations: a,
      pixelThreshold: o,
      minMatches: s,
      solver: c === `eight-point` ? `eight-point` : `five-point`
    }, i, l))
}
function kl(e) {
  return !!e && e.supportsBatch === !0
}
function Al(e) {
  return {
    solver: e.relativePoseSolver
  }
}
async function jl(e, t, n, r, i, a) {
  if (t.length === 0)
    return [];
  if (Fl(n)) {
    let o = n.label ?? (n.supportsCompactPairs !== !1 && n.matchPairsCompact ? `WebGPU compact` : `WebGPU directional batch`)
      , s = Rl();
    a?.({
      type: `matching-start`,
      pairCount: t.length,
      matcher: o
    }),
      i(`Matching ${t.length} candidate pairs (${o})`);
    let c = null
      , l = Il(t.length, i)
      , u = await Ni(e, t, n, r.matcherHammingMax, r.matcherRatio, e => {
        c = e.stage,
          a?.({
            type: `matching-progress`,
            completed: Math.min(e.completed, t.length),
            total: t.length,
            stage: e.stage
          }),
          l(e)
      }
      )
      , d = c === `cpu` ? `${o} -> CPU fallback` : o
      , f = Rl() - s;
    return a?.({
      type: `matching-done`,
      pairCount: t.length,
      matcher: d,
      durationMs: f
    }),
      i(`Matched ${t.length} candidate pairs in ${zl(f)} (${d})`),
      u
  }
  let o = []
    , s = Rl()
    , c = `CPU fallback`;
  a?.({
    type: `matching-start`,
    pairCount: t.length,
    matcher: c
  }),
    i(`Matching ${t.length} candidate pairs (${c})`);
  for (let a = 0; a < t.length; a += 32) {
    let s = t.slice(a, Math.min(a + 32, t.length));
    o.push(...await Ni(e, s, n, r.matcherHammingMax, r.matcherRatio)),
      i(`Matched ${Math.min(a + s.length, t.length)} / ${t.length} candidate pairs (CPU fallback)`)
  }
  let l = Rl() - s;
  return a?.({
    type: `matching-done`,
    pairCount: t.length,
    matcher: c,
    durationMs: l
  }),
    i(`Matched ${t.length} candidate pairs in ${zl(l)} (CPU fallback)`),
    o
}
async function Ml(e, t, n, r, i, a, o) {
  let s = a?.precomputed;
  if (s && Ll(s, t))
    return o?.({
      type: `matching-cache-hit`,
      cachedPairs: t.length,
      runnablePairs: t.length,
      missingPairs: 0
    }),
      i(`Loaded cached descriptor matches for ${t.length} runnable candidate pair${t.length === 1 ? `` : `s`}`),
      s.matches;
  if (!s) {
    let s = await jl(e, t, n, r, i, o)
      , c = {
        runnablePairs: t.map(e => ({
          i: e.i,
          j: e.j
        })),
        matches: s
      };
    return a && (a.latest = c),
      await a?.onComputed?.(c),
      s
  }
  let c = Nl(s)
    , l = Array(t.length)
    , u = []
    , d = []
    , f = 0;
  for (let e = 0; e < t.length; e += 1) {
    let n = t[e]
      , r = c.get(ll(n.i, n.j));
    r ? (l[e] = r,
      f += 1) : (u.push(n),
        d.push(e))
  }
  if (f > 0 && o?.({
    type: `matching-cache-hit`,
    cachedPairs: f,
    runnablePairs: t.length,
    missingPairs: u.length
  }),
    f > 0 && u.length > 0 && i(`Loaded cached descriptor matches for ${f} / ${t.length} runnable candidate pairs; matching ${u.length} missing`),
    u.length > 0) {
    let t = await jl(e, u, n, r, i, o);
    for (let e = 0; e < d.length; e += 1)
      l[d[e]] = t[e] ?? []
  }
  let p = {
    runnablePairs: t.map(e => ({
      i: e.i,
      j: e.j
    })),
    matches: l.map(e => e ?? [])
  };
  return a && (a.latest = p),
    await a?.onComputed?.(p),
    p.matches
}
function Nl(e) {
  let t = new Map;
  for (let n = 0; n < e.runnablePairs.length; n += 1) {
    let r = e.runnablePairs[n]
      , i = e.matches[n];
    !r || !Array.isArray(i) || t.set(ll(r.i, r.j), i)
  }
  return t
}
function Pl(e, t, n, r, i, a, o) {
  let s = [1, 0, 0, 0, 1, 0, 0, 0, 1]
    , c = [0, 0, 0]
    , l = [];
  for (let u of i) {
    if (u.a < 0 || u.a >= n.count || u.b < 0 || u.b >= r.count)
      continue;
    let [i, d] = wd(e, n.xs[u.a], n.ys[u.a])
      , [f, p] = wd(t, r.xs[u.b], r.ys[u.b])
      , m = rt(s, c, a.R, a.t, i, d, f, p);
    if (!m)
      continue;
    let h = $u(m, e, s, c, n.xs[u.a], n.ys[u.a])
      , g = $u(m, t, a.R, a.t, r.xs[u.b], r.ys[u.b]);
    Math.max(h, g) <= o && l.push(u)
  }
  return l
}
function Fl(e) {
  return e?.supportsBatch === !0 && !!(e.matchPairsCompact || e.matchBatchPacked || e.matchBatch)
}
function Il(e, t) {
  let n = 0;
  return r => {
    let i = Math.min(r.completed, e);
    !(i >= e) && i - n < 256 || (t(`Matched ${i} / ${e} candidate pairs (${r.stage})`),
      n = i)
  }
}
function Ll(e, t) {
  if (e.runnablePairs.length !== t.length || e.matches.length !== t.length)
    return !1;
  for (let n = 0; n < t.length; n++)
    if (e.runnablePairs[n].i !== t[n].i || e.runnablePairs[n].j !== t[n].j || !Array.isArray(e.matches[n]))
      return !1;
  return !0
}
function Rl() {
  return globalThis.performance?.now?.() ?? Date.now()
}
function zl(e) {
  return e < 1e3 ? `${Math.round(e)} ms` : `${(e / 1e3).toFixed(1)} s`
}
function Bl(e, t, n, r) {
  return Bs(e, t, n, r)
}
function Vl(e, t, n, r, i) {
  let a = [0, 0, 0]
    , o = tt(i.R, i.t)
    , s = i.inliers.length > 128 ? Hl(i.inliers, 128) : i.inliers
    , c = [];
  for (let l of s) {
    let [s, u] = wd(e, n.xs[l.a], n.ys[l.a])
      , [d, f] = wd(t, r.xs[l.b], r.ys[l.b])
      , p = rt([1, 0, 0, 0, 1, 0, 0, 0, 1], [0, 0, 0], i.R, i.t, s, u, d, f);
    if (!p)
      continue;
    let m = p[0] - a[0]
      , h = p[1] - a[1]
      , g = p[2] - a[2]
      , _ = p[0] - o[0]
      , v = p[1] - o[1]
      , y = p[2] - o[2]
      , b = Math.hypot(m, h, g)
      , x = Math.hypot(_, v, y);
    if (b <= 1e-9 || x <= 1e-9)
      continue;
    let S = Id((m * _ + h * v + g * y) / (b * x), -1, 1);
    c.push(Math.acos(S) * 180 / Math.PI)
  }
  return c.length === 0 ? 0 : Lc(c, c.length >> 1)
}
function Hl(e, t) {
  if (e.length <= t)
    return [...e];
  let n = Array(t)
    , r = e.length / t;
  for (let i = 0; i < t; i++)
    n[i] = e[Math.floor(i * r)];
  return n
}
function Ul(e, t, n, r) {
  let i = null
    , a = -1 / 0
    , o = Wl(e, t);
  for (let s of e) {
    let e = Gl(s, t);
    if (s.verifiedInlierCount < e || s.medianParallaxDeg < t.minInitialParallaxDeg)
      continue;
    let c = s.verifiedInlierCount * Math.tanh(s.medianParallaxDeg / 3);
    if (n && r) {
      let i = Xl(s, n, r, t);
      if (i.accepted < e)
        continue;
      c = i.accepted * i.spatialCoverageScore * Math.tanh(i.medianParallaxDeg / 3)
    }
    c *= Kl(s, o),
      c > a && (a = c,
        i = s)
  }
  if (!i && t.allowWeakInitialFallback && e.length > 0) {
    let t = e[0];
    for (let n of e)
      n.verifiedInlierCount > t.verifiedInlierCount && (t = n);
    i = t
  }
  return i
}
function Wl(e, t) {
  let n = 0;
  for (let t of e)
    n = Math.max(n, t.leftIndex + 1, t.rightIndex + 1);
  let r = new Int32Array(n);
  for (let n of e)
    n.verifiedInlierCount < Gl(n, t) || n.medianParallaxDeg < t.minInitialParallaxDeg || (r[n.leftIndex]++,
      r[n.rightIndex]++);
  return r
}
function Gl(e, t) {
  return e.source === `manual` ? Math.max(vt(t.relativePoseSolver), Math.min(t.minInitialInliers, t.pnpMinInliers, bc)) : t.minInitialInliers
}
function Kl(e, t) {
  let n = Math.max(0, (t[e.leftIndex] ?? 0) - 1) + Math.max(0, (t[e.rightIndex] ?? 0) - 1);
  return 1 + Math.min(.35, Math.log1p(n) * .1)
}
function ql(e, t, n, r, i) {
  for (let a of t) {
    if (a.indices.length < 2)
      continue;
    let t = new Set(a.indices)
      , o = Ul(e.filter(e => t.has(e.leftIndex) && t.has(e.rightIndex)), n, r, i);
    if (o)
      return o
  }
  return Ul(e, n, r, i)
}
function Jl(e, t, n, r, i, a) {
  let o = Yl(t, e, n, r);
  return Ul(e.filter(e => !t[e.leftIndex]?.registered && !t[e.rightIndex]?.registered && o[e.leftIndex] === 0 && o[e.rightIndex] === 0 && (Nc(e, r) || !jc(e.leftIndex, e.rightIndex, n))), r, i, a)
}
function Yl(e, t, n, r) {
  let i = new Uint8Array(e.length)
    , a = []
    , o = Sd(t, e.length);
  for (let t = 0; t < e.length; t++)
    e[t]?.registered && (i[t] = 1,
      a.push(t));
  for (let e = 0; e < a.length; e++) {
    let s = a[e];
    for (let e of o[s]) {
      let o = t[e]
        , c = o.leftIndex === s ? o.rightIndex : o.leftIndex;
      i[c] || !Nc(o, r) && jc(s, c, n) || (i[c] = 1,
        a.push(c))
    }
  }
  return i
}
function Xl(e, t, n, r) {
  let i = t[e.leftIndex]
    , a = t[e.rightIndex]
    , o = n[e.leftIndex]
    , s = n[e.rightIndex];
  if (!i || !a || !o || !s)
    return {
      accepted: 0,
      medianParallaxDeg: 0,
      spatialCoverageScore: 0
    };
  let c = [1, 0, 0, 0, 1, 0, 0, 0, 1]
    , l = [0, 0, 0]
    , u = e.relative.R
    , d = e.relative.t
    , f = [0, 0, 0]
    , p = tt(u, d)
    , m = r.triangulationReprojectionPx
    , h = r.triangulationMinParallaxDeg
    , g = Math.max(1, Math.floor(r.pnpCoverageGridDim))
    , _ = new Uint8Array(g * g)
    , v = new Uint8Array(g * g)
    , y = [];
  for (let t of e.matches) {
    let e = o.xs[t.a]
      , n = o.ys[t.a]
      , r = s.xs[t.b]
      , b = s.ys[t.b]
      , [x, S] = wd(i, e, n)
      , [C, w] = wd(a, r, b)
      , T = rt(c, l, u, d, x, S, C, w);
    if (!T)
      continue;
    let E = Math.hypot(T[0], T[1], T[2]);
    if (!Number.isFinite(E) || E > 500)
      continue;
    let D = gd(T, i, a, c, l, u, d, e, n, r, b);
    if (!Number.isFinite(D) || D > m)
      continue;
    let O = vd(T, f, p);
    O < h || (y.push(O),
      Zl(_, g, i, e, n),
      Zl(v, g, a, r, b))
  }
  return y.length === 0 ? {
    accepted: 0,
    medianParallaxDeg: 0,
    spatialCoverageScore: 0
  } : {
    accepted: y.length,
    medianParallaxDeg: Ic(y),
    spatialCoverageScore: (Ql(_) + Ql(v)) / 2
  }
}
function Zl(e, t, n, r, i) {
  if (!Number.isFinite(r) || !Number.isFinite(i))
    return;
  let a = Math.max(0, Math.min(t - 1, Math.floor(r / Math.max(1, n.width) * t)))
    , o = Math.max(0, Math.min(t - 1, Math.floor(i / Math.max(1, n.height) * t)));
  e[o * t + a] = 1
}
function Ql(e) {
  let t = 0;
  for (let n = 0; n < e.length; n++)
    t += e[n];
  return t
}
function $l(e, t, n, r, i, a, o, s, c, l, u, d = 0, f = [0, 0, 0]) {
  let p = t[e.leftIndex]
    , m = t[e.rightIndex];
  bd(p, [1, 0, 0, 0, 1, 0, 0, 0, 1], [-f[0], -f[1], -f[2]]),
    p.registered = !0,
    p.componentId = d;
  let h = Ue(p.R, p.tvec, e.relative.R, e.relative.t);
  return bd(m, h.R, h.t),
    m.registered = !0,
    m.componentId = d,
    Qu(e, Ju(e.leftIndex, e.rightIndex, e.matches, n, r, t, i, a, o, s, c, l, u).rejectedMatchKeys)
}
function eu(e, t) {
  return `${e}:${t}`
}
function tu(e, t) {
  let n = `${t}:`;
  for (let t of Array.from(e.keys()))
    t.startsWith(n) && e.delete(t)
}
function nu(e, t, n, r, i, a, o, s, c, l, u, d = []) {
  let f = null
    , p = -1 / 0;
  for (let m = 0; m < e.length; m++) {
    if (e[m].registered)
      continue;
    let h = new Map;
    for (let r of t[m]) {
      let t = n[r]
        , l = t.leftIndex === m ? t.rightIndex : t.leftIndex;
      if (!e[l].registered)
        continue;
      let d = e[l].componentId;
      if (d < 0 || !Nc(t, c) && jc(m, l, u))
        continue;
      let f = h.get(d);
      f || (f = {
        usedFeatures: new Map,
        usedPointIds: new Set
      },
        h.set(d, f));
      for (let e of t.matches) {
        let n = m === t.leftIndex ? e.a : e.b
          , r = m === t.leftIndex ? e.b : e.a;
        if (f.usedFeatures.has(n))
          continue;
        let c = ec(l, r, i, a, o, s, t.source === `manual` ? yc : 0);
        if (!c)
          continue;
        let u = c.pointId;
        f.usedPointIds.has(u) || (f.usedFeatures.set(n, {
          X: c.point.xyz,
          pointId: u
        }),
          f.usedPointIds.add(u))
      }
    }
    ru(m, d, e, i, a, o, s, h);
    for (let [e, t] of h) {
      let n = t.usedFeatures;
      if (n.size < c.pnpMinInliers)
        continue;
      let a = l.get(eu(m, e));
      if (a !== void 0 && n.size <= a)
        continue;
      let o = []
        , s = []
        , u = []
        , d = i[m];
      for (let [e, { X: t, pointId: r }] of n)
        o.push({
          X: t,
          u: d.xs[e],
          v: d.ys[e]
        }),
          s.push(e),
          u.push(r);
      let h = iu(r[m], o, c.pnpCoverageGridDim)
        , g = o.length + h * 8;
      g > p && (p = g,
        f = {
          imageIndex: m,
          componentId: e,
          observations: o,
          featureIndices: s,
          pointIds: u
        })
    }
  }
  return f
}
function ru(e, t, n, r, i, a, o, s) {
  if (t.length === 0)
    return;
  let c = r[e];
  if (c)
    for (let r of t) {
      let t = r.observations.find(t => t.imageIndex === e);
      if (!(!t || t.featureIndex < 0 || t.featureIndex >= c.count))
        for (let c of r.observations) {
          if (c.imageIndex === e)
            continue;
          let r = n[c.imageIndex];
          if (!r?.registered || r.componentId < 0)
            continue;
          let l = $s(i, c.imageIndex, c.featureIndex);
          if (l === void 0)
            continue;
          let u = a.find(l)
            , d = o[u - 1];
          if (!d || d.track.length === 0)
            continue;
          let f = s.get(r.componentId);
          f || (f = {
            usedFeatures: new Map,
            usedPointIds: new Set
          },
            s.set(r.componentId, f)),
            !(f.usedFeatures.has(t.featureIndex) || f.usedPointIds.has(u)) && (f.usedFeatures.set(t.featureIndex, {
              X: d.xyz,
              pointId: u
            }),
              f.usedPointIds.add(u))
        }
    }
}
function iu(e, t, n) {
  let r = n * n
    , i = new Uint8Array(r)
    , a = 1 / Math.max(1, e.width)
    , o = 1 / Math.max(1, e.height);
  for (let e of t) {
    let t = Math.max(0, Math.min(n - 1, Math.floor(e.u * a * n)))
      , r = Math.max(0, Math.min(n - 1, Math.floor(e.v * o * n)));
    i[r * n + t] = 1
  }
  let s = 0;
  for (let e = 0; e < r; e++)
    s += i[e];
  return s
}
function au(e, t, n, r, i, a, o, s, c, l, u) {
  let d = null
    , f = l => {
      if (!e[l].registered)
        for (let f of t[l]) {
          let t = n[f];
          if (t.verifiedInlierCount < c.minMatches || c.minVerifiedParallaxDeg > 0 && t.medianParallaxDeg < c.minVerifiedParallaxDeg)
            continue;
          let p = t.leftIndex === l ? t.rightIndex : t.leftIndex;
          if (!e[p].registered || u && !Nc(t, c) && jc(l, p, u))
            continue;
          let m = ou(l, p, t, r, i, e, a, o, s, c);
          if (!m)
            continue;
          let h = m.inliers + m.coverage * 8 + Math.tanh(t.medianParallaxDeg / 3);
          (!d || h > d.score) && (d = {
            imageIndex: l,
            edgeIndex: f,
            anchorIndex: p,
            score: h,
            scale: m.scale,
            inliers: m.inliers,
            observations: m.observations,
            meanReprojectionError: m.meanReprojectionError,
            pnpRejectedLocalFeatures: m.pnpRejectedLocalFeatures
          })
        }
    }
    ;
  if (l !== void 0)
    f(l);
  else
    for (let t = 0; t < e.length; t++)
      f(t);
  return d
}
function ou(e, t, n, r, i, a, o, s, c, l) {
  let u = du(n, t, e);
  if (!u)
    return null;
  let d = su(e, t, n, u.R, u.t, r, i, a, o, s, c)
    , f = uu(l);
  if (d.length < f)
    return null;
  let p = d.map(e => e.scale).filter(e => Number.isFinite(e) && e > 1e-6);
  if (p.length < f)
    return null;
  let m = p.length > 128 ? Hl(p, 128) : p
    , h = null;
  for (let n of m) {
    let i = lu(n, d, e, t, u.R, u.t, r, a, l);
    (!h || i.inlierIndices.length > h.inlierIndices.length || i.inlierIndices.length === h.inlierIndices.length && i.meanError < h.meanError) && (h = i)
  }
  if (!h || h.inlierIndices.length < f)
    return null;
  let g = Ic(h.inlierIndices.map(e => d[e].scale));
  if (Number.isFinite(g) && g > 1e-6) {
    let n = lu(g, d, e, t, u.R, u.t, r, a, l);
    (n.inlierIndices.length > h.inlierIndices.length || n.inlierIndices.length === h.inlierIndices.length && n.meanError <= h.meanError) && (h = n)
  }
  if (h.inlierIndices.length < f || !Number.isFinite(h.meanError))
    return null;
  let _ = new Set(h.inlierIndices)
    , v = new Set;
  for (let e = 0; e < d.length; e++)
    _.has(e) || v.add(d[e].localFeature);
  return {
    scale: h.scale,
    inliers: h.inlierIndices.length,
    observations: d.length,
    meanReprojectionError: h.meanError,
    coverage: h.coverage,
    pnpRejectedLocalFeatures: v
  }
}
function su(e, t, n, r, i, a, o, s, c, l, u) {
  let d = s[t]
    , f = a[e]
    , p = o[e]
    , m = e === n.leftIndex
    , h = new Set
    , g = new Set
    , _ = [];
  for (let e of n.matches) {
    let a = m ? e.a : e.b
      , s = m ? e.b : e.a;
    if (h.has(a))
      continue;
    let v = ec(t, s, o, c, l, u, n.source === `manual` ? yc : 0);
    if (!v)
      continue;
    let y = v.pointId;
    if (g.has(y))
      continue;
    let b = p.xs[a]
      , x = p.ys[a]
      , S = cu(v.point.xyz, b, x, f, d.R, d.tvec, r, i);
    !Number.isFinite(S) || S <= 1e-6 || (h.add(a),
      g.add(y),
      _.push({
        X: v.point.xyz,
        u: b,
        v: x,
        localFeature: a,
        pointId: y,
        scale: S
      }))
  }
  return _
}
function cu(e, t, n, r, i, a, o, s) {
  let c = i[0] * e[0] + i[1] * e[1] + i[2] * e[2] + a[0]
    , l = i[3] * e[0] + i[4] * e[1] + i[5] * e[2] + a[1]
    , u = i[6] * e[0] + i[7] * e[1] + i[8] * e[2] + a[2]
    , d = [o[0] * c + o[1] * l + o[2] * u, o[3] * c + o[4] * l + o[5] * u, o[6] * c + o[7] * l + o[8] * u]
    , [f, p] = wd(r, t, n)
    , m = Math.hypot(f, p, 1) || 1
    , h = [f / m, p / m, 1 / m]
    , g = Fd(s, h)
    , _ = Fd(d, h)
    , v = Ed(g, g);
  return v <= 1e-12 ? NaN : -Ed(g, _) / v
}
function lu(e, t, n, r, i, a, o, s, c) {
  let l = [a[0] * e, a[1] * e, a[2] * e]
    , u = Ue(s[r].R, s[r].tvec, i, l)
    , d = Math.max(1e-6, c.pnpPixelThreshold)
    , f = []
    , p = []
    , m = 0;
  for (let e = 0; e < t.length; e++) {
    let r = t[e]
      , i = $u(r.X, o[n], u.R, u.t, r.u, r.v);
    !Number.isFinite(i) || i > d || (f.push(e),
      m += i,
      p.push({
        X: r.X,
        u: r.u,
        v: r.v
      }))
  }
  return {
    scale: e,
    inlierIndices: f,
    meanError: f.length > 0 ? m / f.length : 1 / 0,
    coverage: iu(o[n], p, c.pnpCoverageGridDim)
  }
}
function uu(e) {
  return Math.max(8, Math.min(e.minMatches, e.pnpMinInliers))
}
function du(e, t, n) {
  return t === e.leftIndex && n === e.rightIndex ? {
    R: e.relative.R,
    t: e.relative.t
  } : t === e.rightIndex && n === e.leftIndex ? hu(e.relative) : null
}
function fu(e, t, n, r, i, a) {
  let o = null
    , s = i => {
      if (!e[i].registered)
        for (let s of t[i]) {
          let t = n[s];
          if (t.verifiedInlierCount < r.minMatches || r.minVerifiedParallaxDeg > 0 && t.medianParallaxDeg < r.minVerifiedParallaxDeg)
            continue;
          let c = t.leftIndex === i ? t.rightIndex : t.leftIndex;
          if (!e[c].registered || a && !Nc(t, r) && jc(i, c, a))
            continue;
          let l = t.verifiedInlierCount * Math.tanh(t.medianParallaxDeg / 3);
          (!o || l > o.score) && (o = {
            imageIndex: i,
            edgeIndex: s,
            anchorIndex: c,
            score: l
          })
        }
    }
    ;
  if (i !== void 0)
    s(i);
  else
    for (let t = 0; t < e.length; t++)
      s(t);
  return o
}
function pu(e, t, n) {
  let r = n[e.edgeIndex]
    , i = t[e.anchorIndex];
  if (!i.registered)
    return !1;
  let a = du(r, e.anchorIndex, e.imageIndex);
  if (!a)
    return !1;
  let o = Ue(i.R, i.tvec, a.R, a.t);
  return bd(t[e.imageIndex], o.R, o.t),
    t[e.imageIndex].registered = !0,
    t[e.imageIndex].componentId = i.componentId >= 0 ? i.componentId : 0,
    !0
}
function mu(e, t, n) {
  let r = n[e.edgeIndex]
    , i = t[e.anchorIndex];
  if (!i.registered || !Number.isFinite(e.scale) || e.scale <= 1e-6)
    return !1;
  let a = du(r, e.anchorIndex, e.imageIndex);
  if (!a)
    return !1;
  let o = [a.t[0] * e.scale, a.t[1] * e.scale, a.t[2] * e.scale]
    , s = Ue(i.R, i.tvec, a.R, o);
  return bd(t[e.imageIndex], s.R, s.t),
    t[e.imageIndex].registered = !0,
    t[e.imageIndex].componentId = i.componentId >= 0 ? i.componentId : 0,
    !0
}
function hu(e) {
  let t = e.R
    , n = [t[0], t[3], t[6], t[1], t[4], t[7], t[2], t[5], t[8]]
    , r = e.t;
  return {
    R: n,
    t: [-(n[0] * r[0] + n[1] * r[1] + n[2] * r[2]), -(n[3] * r[0] + n[4] * r[1] + n[5] * r[2]), -(n[6] * r[0] + n[7] * r[1] + n[8] * r[2])]
  }
}
function gu(e, t, n, r, i) {
  let a = nn(e.observations, t[e.imageIndex].intrinsics, {
    iterations: r.ransacIterations,
    pixelThreshold: r.pnpPixelThreshold,
    minInliers: r.pnpMinInliers,
    reprojectionScorer: Cu(i)
  });
  if (!a)
    return null;
  bd(n[e.imageIndex], a.R, a.t),
    n[e.imageIndex].registered = !0,
    n[e.imageIndex].componentId = e.componentId;
  let o = new Set(a.inliers)
    , s = new Set;
  for (let t = 0; t < e.featureIndices.length; t++)
    o.has(t) || s.add(e.featureIndices[t]);
  return {
    inliers: a.inliers.length,
    meanReprojectionError: a.meanReprojectionError,
    inlierObservationIndices: a.inliers,
    pnpRejectedLocalFeatures: s
  }
}
function _u(e, t, n, r, i, a, o) {
  let s = 0
    , c = n[e.imageIndex]?.id;
  if (c === void 0)
    return 0;
  for (let n of t.inlierObservationIndices) {
    let t = e.featureIndices[n]
      , l = e.pointIds[n];
    if (t === void 0 || l === void 0)
      continue;
    let u = a.find(l)
      , d = r[u - 1];
    if (!d || d.track.length === 0)
      continue;
    let f = $s(i, e.imageIndex, t);
    if (f !== void 0 && a.find(f) !== u)
      continue;
    let p = d.track.length;
    tc(i, o, e.imageIndex, t, u),
      _d(d, c, t),
      d.track.length > p && s++
  }
  return s
}
function vu(e, t, n, r, i, a, o, s, c, l, u, d) {
  let f = {
    created: 0,
    updated: 0,
    adoptedObservations: 0
  };
  if (e.length === 0)
    return f;
  let p = Math.max(12, s.triangulationReprojectionPx, s.pnpPixelThreshold * 2);
  for (let s of e) {
    let e = new Map;
    for (let t of s.observations) {
      let i = r[t.imageIndex]
        , a = n[t.imageIndex];
      if (!i?.registered || i.componentId < 0 || !a || t.featureIndex < 0 || t.featureIndex >= a.count)
        continue;
      let o = e.get(i.componentId);
      o || (o = [],
        e.set(i.componentId, o)),
        o.push(t)
    }
    for (let [m, h] of e) {
      if (h.length < 2)
        continue;
      let e = hd(h.map(e => ({
        imageId: t[e.imageIndex].id,
        point2DIdx: e.featureIndex
      })), t, n, r, c);
      if (!e || !Number.isFinite(e.error) || e.error > p || !xu(e.xyz, h, t, n, r, p))
        continue;
      let g = Math.hypot(e.xyz[0], e.xyz[1], e.xyz[2]);
      if (!Number.isFinite(g) || g > 500)
        continue;
      let _ = bu(s.trackId, m)
        , v = l.get(_);
      if (v !== void 0 && (v = o.find(v),
        l.set(_, v)),
        v === void 0) {
        let e = yu(h, a, o, i);
        if (e === `conflict`)
          continue;
        e !== null && (v = e,
          l.set(_, v))
      }
      let y = v === void 0 ? void 0 : i[v - 1];
      if (!y || y.track.length === 0) {
        let t = h[0];
        v = u(),
          y = {
            id: v,
            xyz: e.xyz,
            rgb: Td(n[t.imageIndex], t.featureIndex),
            error: e.error,
            track: []
          },
          i.push(y),
          l.set(_, v),
          f.created++
      } else
        (Math.hypot(y.xyz[0] - e.xyz[0], y.xyz[1] - e.xyz[1], y.xyz[2] - e.xyz[2]) > 1e-6 || Math.abs(y.error - e.error) > 1e-6) && (y.xyz = e.xyz,
          y.error = e.error,
          f.updated++);
      if (v !== void 0)
        for (let e of h) {
          let n = $s(a, e.imageIndex, e.featureIndex);
          if (n !== void 0 && o.find(n) !== v)
            continue;
          let r = y.track.length;
          tc(a, d, e.imageIndex, e.featureIndex, v),
            _d(y, t[e.imageIndex].id, e.featureIndex),
            y.track.length > r && f.adoptedObservations++
        }
    }
  }
  return f
}
function yu(e, t, n, r) {
  let i = null;
  for (let a of e) {
    let e = $s(t, a.imageIndex, a.featureIndex);
    if (e === void 0)
      continue;
    let o = n.find(e)
      , s = r[o - 1];
    if (!(!s || s.track.length === 0)) {
      if (i === null)
        i = o;
      else if (i !== o)
        return `conflict`
    }
  }
  return i
}
function bu(e, t) {
  return `${e}\0${t}`
}
function xu(e, t, n, r, i, a) {
  for (let o of t) {
    let t = $u(e, n[o.imageIndex], i[o.imageIndex].R, i[o.imageIndex].tvec, r[o.imageIndex].xs[o.featureIndex], r[o.imageIndex].ys[o.featureIndex]);
    if (!Number.isFinite(t) || t > a)
      return !1
  }
  return !0
}
function Su(e, t, n, r, i, a, o, s, c, l, u, d, f, p) {
  let m = l.size > 0
    , h = 0;
  for (let g of t[e]) {
    let t = n[g]
      , _ = t.leftIndex === e ? t.rightIndex : t.leftIndex;
    if (!a[_].registered || a[_].componentId !== a[e].componentId)
      continue;
    let v = t.matches;
    if (m) {
      let n = e === t.leftIndex;
      v = t.matches.filter(e => {
        let t = n ? e.a : e.b;
        return !l.has(t)
      }
      )
    }
    if (v.length === 0)
      continue;
    let y = Ju(t.leftIndex, t.rightIndex, v, r, i, a, o, s, c, u, d, f, p);
    h += Qu(t, y.rejectedMatchKeys)
  }
  return h
}
function Cu(e) {
  return !e || typeof e.createPnPScoringContext != `function` ? null : e
}
function wu(e) {
  return !e || typeof e.triangulateNormalizedPairs != `function` ? null : e
}
function Tu(e) {
  return !e || typeof e.createBundleReprojectionCostContext != `function` ? null : e
}
function Eu(e) {
  return !e || typeof e.createBundleNormalEquationContext != `function` ? null : e
}
function Du(e, t) {
  let n = 0;
  for (let r of e) {
    let e = t[r.leftIndex]
      , i = t[r.rightIndex];
    !e?.registered || !i?.registered || e.componentId < 0 || i.componentId < 0 || e.componentId === i.componentId || (n += r.matches.length,
      r.matches = [])
  }
  return n
}
function Ou(e, t, n, r) {
  let i = new Set
    , a = 0;
  for (let o = 1; o < e.length; o++) {
    let s = o - 1
      , c = e[s]
      , l = e[o];
    if (!c.registered || !l.registered || c.componentId < 0 || l.componentId < 0 || c.componentId === l.componentId || i.has(l.componentId))
      continue;
    let u = Ac(r, s, o);
    if (!u || !Mc(u))
      continue;
    let d = Vu(e, s - 1, c.componentId)
      , f = Hu(e, o + 1, l.componentId);
    if (d < 0 || f < 0)
      continue;
    let p = Uu(e[d], c, l, e[f]);
    p && (Gu(l.componentId, p, e, t, n),
      i.add(l.componentId),
      a++)
  }
  return a
}
function ku(e, t, n, r, i) {
  return e ? Ou(t, n, r, i) : 0
}
function Au(e, t, n, r, i, a, o, s, c) {
  let l = 0;
  for (; ;) {
    let u = ju(e, t, n, r, i, o, s, c)
      , d = null
      , f = null;
    for (let e of u) {
      let t = Ge(e.records.map(e => e.src), e.records.map(e => e.dst), {
        iterations: 768,
        minInlierRatio: e.records.length >= 40 ? .3 : .45,
        inlierResidualScale: .06
      });
      !t || t.inliers.length < Math.max(8, Math.ceil(e.records.length * .3)) || t.inliers.length + e.score * .001 > (d && f ? d.inliers.length + f.score * .001 : -1 / 0) && (d = t,
        f = e)
    }
    if (!d || !f)
      break;
    Lu(f.records, d.inliers, i, e, f.sourceComponent, f.targetComponent),
      Gu(f.sourceComponent, d.sim3, e, t, a),
      Bu(e, f.sourceComponent, f.targetComponent),
      l++
  }
  return l
}
function ju(e, t, n, r, i, a, o, s) {
  let c = new Map;
  for (let l of i) {
    let i = e[l.leftIndex]
      , u = e[l.rightIndex];
    if (!i?.registered || !u?.registered)
      continue;
    let d = i.componentId
      , f = u.componentId;
    if (d < 0 || f < 0 || d === f)
      continue;
    let p = Math.max(d, f)
      , m = Math.min(d, f)
      , h = `${p}->${m}`
      , g = Mu(p, m, d === p, l, e, t, n, r, a, o, s);
    if (g.length === 0)
      continue;
    let _ = c.get(h);
    _ || (_ = {
      sourceComponent: p,
      targetComponent: m,
      records: [],
      score: 0
    },
      c.set(h, _)),
      _.records.push(...g),
      _.score += l.verifiedInlierCount
  }
  return Array.from(c.values()).filter(e => e.records.length >= 8)
}
function Mu(e, t, n, r, i, a, o, s, c, l, u) {
  let d = n ? r.leftIndex : r.rightIndex
    , f = n ? r.rightIndex : r.leftIndex;
  if (i[d]?.componentId !== e || i[f]?.componentId !== t)
    return [];
  let p = []
    , m = new Set
    , h = []
    , g = []
    , _ = []
    , v = []
    , y = [];
  for (let e of r.matches) {
    let t = n ? e.a : e.b
      , b = n ? e.b : e.a
      , x = r.source === `manual` && c ? yc : 0
      , S = ec(d, t, c ?? [], o, s, a, x)
      , C = ec(f, b, c ?? [], o, s, a, x)
      , w = Fu(r, i, l, c, e, u);
    if (w) {
      let t = n ? w.left : w.right
        , i = n ? w.right : w.left;
      S && (g.push(t),
        _.push(S.point.xyz)),
        C && (v.push(i),
          y.push(C.point.xyz)),
        h.push({
          edge: r,
          match: e,
          sourceResolved: S,
          targetResolved: C,
          sourceTemp: t,
          targetTemp: i,
          sourceTempId: -1 - h.length * 2,
          targetTempId: -2 - h.length * 2
        })
    }
    if (!S || !C)
      continue;
    let T = S.pointId
      , E = C.pointId;
    if (T === E)
      continue;
    let D = `${T}:${E}`;
    m.has(D) || (m.add(D),
      p.push({
        edge: r,
        match: e,
        sourceId: T,
        targetId: E,
        src: S.point.xyz,
        dst: C.point.xyz
      }))
  }
  return Nu(p, h, g, _, v, y, m),
    p
}
function Nu(e, t, n, r, i, a, o) {
  if (t.length === 0)
    return;
  let s = Pu(n, r)
    , c = Pu(i, a);
  for (let n of t) {
    if (n.sourceResolved && n.targetResolved)
      continue;
    let t = n.sourceResolved ? n.sourceResolved.point.xyz : s ? qu(n.sourceTemp, s.sim3) : null
      , r = n.targetResolved ? n.targetResolved.point.xyz : c ? qu(n.targetTemp, c.sim3) : null;
    if (!t || !r)
      continue;
    let i = n.sourceResolved?.pointId ?? n.sourceTempId
      , a = n.targetResolved?.pointId ?? n.targetTempId;
    if (i === a)
      continue;
    let l = `${i}:${a}`;
    o.has(l) || (o.add(l),
      e.push({
        edge: n.edge,
        match: n.match,
        sourceId: i,
        targetId: a,
        src: t,
        dst: r
      }))
  }
}
function Pu(e, t) {
  if (e.length !== t.length || e.length < 3)
    return null;
  let n = Ge([...e], [...t], {
    iterations: 128,
    minInlierRatio: e.length >= 6 ? .5 : .75,
    inlierResidualScale: .04
  });
  return !n || n.inliers.length < Math.min(e.length, 3) ? null : n
}
function Fu(e, t, n, r, i, a) {
  if (!n || !r || !a)
    return null;
  let o = t[e.leftIndex]
    , s = t[e.rightIndex]
    , c = n[e.leftIndex]
    , l = n[e.rightIndex]
    , u = r[e.leftIndex]
    , d = r[e.rightIndex];
  if (!o?.registered || !s?.registered || !c || !l || !u || !d || i.a < 0 || i.a >= u.count || i.b < 0 || i.b >= d.count)
    return null;
  let f = u.xs[i.a]
    , p = u.ys[i.a]
    , m = d.xs[i.b]
    , h = d.ys[i.b];
  if (!Number.isFinite(f) || !Number.isFinite(p) || !Number.isFinite(m) || !Number.isFinite(h))
    return null;
  let g = Ue(o.R, o.tvec, e.relative.R, e.relative.t)
    , _ = hu(e.relative)
    , v = Ue(s.R, s.tvec, _.R, _.t)
    , [y, b] = wd(c, f, p)
    , [x, S] = wd(l, m, h)
    , C = rt(o.R, o.tvec, g.R, g.t, y, b, x, S)
    , w = rt(v.R, v.t, s.R, s.tvec, y, b, x, S);
  if (!C || !w)
    return null;
  let T = Math.max(1, a.triangulationReprojectionPx * 2);
  return !Iu(C, c, l, o.R, o.tvec, g.R, g.t, f, p, m, h, T) || !Iu(w, c, l, v.R, v.t, s.R, s.tvec, f, p, m, h, T) ? null : {
    left: C,
    right: w
  }
}
function Iu(e, t, n, r, i, a, o, s, c, l, u, d) {
  let f = Math.hypot(e[0], e[1], e[2]);
  if (!Number.isFinite(f) || f > 500)
    return !1;
  let p = gd(e, t, n, r, i, a, o, s, c, l, u);
  return Number.isFinite(p) && p <= d
}
function Lu(e, t, n, r, i, a) {
  let o = new Map
    , s = new Set;
  for (let t of e)
    s.add(t.edge);
  for (let e of n) {
    let t = r[e.leftIndex]
      , n = r[e.rightIndex];
    !t?.registered || !n?.registered || (t.componentId === i && n.componentId === a || t.componentId === a && n.componentId === i) && s.add(e)
  }
  for (let n of t) {
    let t = e[n];
    if (!t)
      continue;
    let r = o.get(t.edge);
    r || (r = new Set,
      o.set(t.edge, r)),
      r.add(Zu(t.match))
  }
  for (let e of s) {
    let t = o.get(e) ?? new Set;
    e.matches = e.matches.filter(e => t.has(Zu(e)))
  }
}
function Ru(e, t) {
  let n = new Set
    , r = 0;
  for (let i = 1; i < e.length; i++) {
    let a = i - 1
      , o = e[a]
      , s = e[i];
    if (!o.registered || !s.registered)
      continue;
    let c = o.componentId
      , l = s.componentId;
    if (c < 0 || l < 0 || c === l || n.has(l))
      continue;
    let u = Ac(t, a, i);
    !u || !Mc(u) || zu(e, a, i, c, l) && (Bu(e, l, c),
      n.add(l),
      r++)
  }
  return r
}
function zu(e, t, n, r, i) {
  let a = Vu(e, t - 1, r)
    , o = Hu(e, n + 1, i);
  if (a < 0 || o < 0)
    return !1;
  let s = Ad(e[t].center, e[a].center)
    , c = Ad(e[n].center, e[t].center)
    , l = Ad(e[o].center, e[n].center)
    , u = Dd(s)
    , d = Dd(c)
    , f = Dd(l);
  if (!Number.isFinite(u) || !Number.isFinite(d) || !Number.isFinite(f) || u <= 1e-6 || d <= 1e-6 || f <= 1e-6)
    return !1;
  let p = Math.min(u, f)
    , m = Math.max(u, f);
  if (d < p * .25 || d > m * 3)
    return !1;
  let h = Od(s)
    , g = Od(c)
    , _ = Od(l);
  return !h || !g || !_ ? !1 : Ed(h, g) > -.25 && Ed(g, _) > -.25
}
function Bu(e, t, n) {
  for (let r of e)
    r.registered && r.componentId === t && (r.componentId = n)
}
function Vu(e, t, n) {
  for (let r = t; r >= 0; r--)
    if (e[r].registered && e[r].componentId === n)
      return r;
  return -1
}
function Hu(e, t, n) {
  for (let r = t; r < e.length; r++)
    if (e[r].registered && e[r].componentId === n)
      return r;
  return -1
}
function Uu(e, t, n, r) {
  let i = Ad(t.center, e.center)
    , a = Ad(r.center, n.center)
    , o = Dd(i)
    , s = Dd(a);
  if (!Number.isFinite(o) || !Number.isFinite(s) || o < 1e-6 || s < 1e-6)
    return null;
  let c = Wu(i, Md(t.R))
    , l = Wu(a, Md(n.R));
  if (!c || !l)
    return null;
  let u = Pn(I(c, Nd(l)))
    , d = o / s
    , f = kd(t.center, i)
    , p = Pd(u, n.center);
  return {
    R: u,
    scale: d,
    t: [f[0] - d * p[0], f[1] - d * p[1], f[2] - d * p[2]]
  }
}
function Wu(e, t) {
  let n = Od(e);
  if (!n)
    return null;
  let r = Od(Ad(t, jd(n, Ed(t, n))));
  if (r ||= Od(Math.abs(n[1]) < .9 ? Fd(n, [0, 1, 0]) : Fd(n, [1, 0, 0])),
    !r)
    return null;
  let i = Od(Fd(r, n));
  return i ? [n[0], i[0], r[0], n[1], i[1], r[1], n[2], i[2], r[2]] : null
}
function Gu(e, t, n, r, i) {
  let a = Nd(t.R);
  for (let r of n) {
    if (!r.registered || r.componentId !== e)
      continue;
    let n = qu(r.center, t)
      , i = Pn(I(r.R, a));
    bd(r, i, xd(i, n))
  }
  for (let a of r)
    a.track.length !== 0 && Ku(a, n, i) === e && (a.xyz = qu(a.xyz, t))
}
function Ku(e, t, n) {
  let r = -1;
  for (let i of e.track) {
    let e = n.get(i.imageId);
    if (e === void 0)
      continue;
    let a = t[e];
    if (!(!a?.registered || a.componentId < 0)) {
      if (r < 0)
        r = a.componentId;
      else if (r !== a.componentId)
        return -1
    }
  }
  return r
}
function qu(e, t) {
  let n = Pd(t.R, e);
  return [t.scale * n[0] + t.t[0], t.scale * n[1] + t.t[1], t.scale * n[2] + t.t[2]]
}
function Ju(e, t, n, r, i, a, o, s, c, l, u, d, f) {
  let p = a[e], m = a[t], h = i[e], g = i[t], _ = r[e], v = r[t], y = _.id, b = v.id, x = l.triangulationReprojectionPx, S = l.triangulationMinParallaxDeg, C = new Set, w, T = 0, E = 0, D = () => {
    T++
  }
    , O = e => {
      E++,
        C.add(Zu(e))
    }
    ;
  for (let r = 0; r < n.length; r++) {
    let i = n[r]
      , a = $s(s, e, i.a)
      , l = $s(s, t, i.b)
      , C = a === void 0 ? void 0 : c.find(a)
      , T = l === void 0 ? void 0 : c.find(l);
    if (C && T) {
      if (C === T) {
        D();
        continue
      }
      let n = o[C - 1]
        , r = o[T - 1];
      if (!n || !r || n.track.length === 0 || r.track.length === 0) {
        O(i);
        continue
      }
      let a = $u(n.xyz, v, m.R, m.tvec, g.xs[i.b], g.ys[i.b])
        , l = $u(r.xyz, _, p.R, p.tvec, h.xs[i.a], h.ys[i.a]);
      if (a > x || l > x) {
        O(i);
        continue
      }
      let u = c.union(C, T)
        , f = u === C ? T : C
        , y = o[u - 1]
        , b = o[f - 1];
      if (y && b) {
        for (let e of b.track)
          y.track.some(t => t.imageId === e.imageId && t.point2DIdx === e.point2DIdx) || y.track.push(e);
        b.track = [],
          b.error = NaN
      }
      tc(s, d, e, i.a, u),
        tc(s, d, t, i.b, u),
        D();
      continue
    }
    if (C && !T) {
      let e = o[C - 1];
      e && e.track.length > 0 && $u(e.xyz, v, m.R, m.tvec, g.xs[i.b], g.ys[i.b]) <= x ? (tc(s, d, t, i.b, C),
        _d(e, b, i.b),
        D()) : O(i);
      continue
    }
    if (T && !C) {
      let t = o[T - 1];
      t && t.track.length > 0 && $u(t.xyz, _, p.R, p.tvec, h.xs[i.a], h.ys[i.a]) <= x ? (tc(s, d, e, i.a, T),
        _d(t, y, i.a),
        D()) : O(i);
      continue
    }
    w === void 0 && (w = Yu(f, p, m, _, v, h, g, n));
    let E = w ? Xu(w, r) : (() => {
      let [e, t] = wd(_, h.xs[i.a], h.ys[i.a])
        , [n, r] = wd(v, g.xs[i.b], g.ys[i.b]);
      return rt(p.R, p.tvec, m.R, m.tvec, e, t, n, r)
    }
    )();
    if (!E) {
      O(i);
      continue
    }
    let k = Math.hypot(E[0], E[1], E[2]);
    if (!Number.isFinite(k) || k > 500) {
      O(i);
      continue
    }
    let A = gd(E, _, v, p.R, p.tvec, m.R, m.tvec, h.xs[i.a], h.ys[i.a], g.xs[i.b], g.ys[i.b]);
    if (!Number.isFinite(A) || A > x) {
      O(i);
      continue
    }
    if (vd(E, p.center, m.center) < S) {
      O(i);
      continue
    }
    let j = u();
    tc(s, d, e, i.a, j),
      tc(s, d, t, i.b, j),
      o.push({
        id: j,
        xyz: E,
        rgb: Td(h, i.a),
        error: A,
        track: [{
          imageId: y,
          point2DIdx: i.a
        }, {
          imageId: b,
          point2DIdx: i.b
        }]
      }),
      D()
  }
  return {
    accepted: T,
    rejected: E,
    rejectedMatchKeys: C
  }
}
function Yu(e, t, n, r, i, a, o, s) {
  if (!e || s.length === 0)
    return null;
  let c = new Float64Array(s.length * 4);
  for (let e = 0; e < s.length; e++) {
    let t = s[e]
      , n = e * 4
      , [l, u] = wd(r, a.xs[t.a], a.ys[t.a])
      , [d, f] = wd(i, o.xs[t.b], o.ys[t.b]);
    c[n] = l,
      c[n + 1] = u,
      c[n + 2] = d,
      c[n + 3] = f
  }
  try {
    let r = e.triangulateNormalizedPairs(t.R, t.tvec, n.R, n.tvec, c, s.length);
    return r && r.length >= s.length * 4 ? r : null
  } catch {
    return null
  }
}
function Xu(e, t) {
  let n = t * 4;
  if (n + 3 >= e.length || e[n + 3] <= 0)
    return null;
  let r = [e[n], e[n + 1], e[n + 2]];
  return Number.isFinite(r[0]) && Number.isFinite(r[1]) && Number.isFinite(r[2]) ? r : null
}
function Zu(e) {
  let t = e.a + e.b;
  return t * (t + 1) / 2 + e.b
}
function Qu(e, t) {
  if (t.size === 0)
    return 0;
  let n = e.matches.length
    , r = 0;
  for (let n = 0; n < e.matches.length; n++) {
    let i = e.matches[n];
    t.has(Zu(i)) || (e.matches[r++] = i)
  }
  return e.matches.length = r,
    n - r
}
function $u(e, t, n, r, i, a) {
  let o = ct(t, n, r, e);
  return !Number.isFinite(o[0]) || o[2] <= 0 ? 1 / 0 : Math.hypot(o[0] - i, o[1] - a)
}
async function ed(e, t, n, r, i, a, o, s, c, l, u, d, f, p, m, h) {
  let g = ``;
  if (l.localPointRefinement) {
    let t = cd(e, r, i, a, o, s, c, l, u, d, f);
    (t.refined > 0 || t.demoted > 0 || t.dropped > 0) && (g = `, refined ${t.refined} (demoted ${t.demoted}, dropped ${t.dropped})`)
  }
  if (!l.localPoseRefinement)
    return g;
  let _ = await nd(e, t, n, r, i, a, o, {
    depth: 2,
    iterations: 8,
    huberPx: 1.5,
    gaugeAnchorImageId: p,
    reprojectionCostScorer: m,
    normalEquationScorer: h
  });
  if (_.applied && _.acceptedSteps > 0)
    return `${g}, local BA ${_.acceptedSteps} (${_.errorBefore.toFixed(2)} -> ${_.errorAfter.toFixed(2)} px, ${_.windowCameras.length} cams/${_.pointCount} pts)`;
  let v = ud(e, r, i, a, o, 6, 1.5);
  return v.acceptedSteps > 0 && (g += `, pose BA ${v.acceptedSteps} (${v.errorBefore.toFixed(2)} -> ${v.errorAfter.toFixed(2)} px)`),
    g
}
function td(e, t, n, r, i) {
  if (!r[e]?.registered)
    return [];
  let a = r[e].componentId
    , o = Math.max(0, Math.floor(i))
    , s = new Set([e])
    , c = [e];
  for (let e = 0; e < o && c.length > 0; e++) {
    let e = [];
    for (let i of c)
      for (let o of t[i] ?? []) {
        let t = n[o];
        if (!t)
          continue;
        let c = t.leftIndex === i ? t.rightIndex : t.leftIndex;
        s.has(c) || !r[c]?.registered || r[c].componentId === a && (s.add(c),
          e.push(c))
      }
    c = e
  }
  return Array.from(s).sort((e, t) => e - t)
}
async function nd(e, t, n, r, i, a, o, s) {
  let c = td(e, t, n, a, s.depth)
    , l = (e = {}) => ({
      windowCameras: c,
      pointCount: 0,
      observations: 0,
      applied: !1,
      acceptedSteps: 0,
      errorBefore: 1 / 0,
      errorAfter: 1 / 0,
      optimisedCameras: 0,
      anchoredCameras: 0,
      ...e
    });
  if (c.length < 2)
    return l();
  let u = new Set(c)
    , d = new Set(c.map(e => r[e]?.id).filter(e => e !== void 0))
    , f = a.map((e, t) => ({
      imageId: e.imageId,
      name: e.name,
      center: [...e.center],
      R: [...e.R],
      qvec: [...e.qvec],
      tvec: [...e.tvec],
      registered: u.has(t) && e.registered,
      componentId: e.componentId
    }))
    , p = []
    , m = []
    , h = 0;
  for (let e = 0; e < o.length; e++) {
    let t = o[e];
    if (!t || t.track.length < 2)
      continue;
    let n = t.track.filter(e => d.has(e.imageId));
    n.length < 2 || (p.push({
      id: t.id,
      xyz: [...t.xyz],
      rgb: [...t.rgb],
      error: t.error,
      track: n.map(e => ({
        imageId: e.imageId,
        point2DIdx: e.point2DIdx
      }))
    }),
      m.push(e),
      h += n.length)
  }
  if (p.length === 0 || h < 4)
    return l({
      pointCount: p.length,
      observations: h
    });
  let g = ad(m, o, r, i, a, s.huberPx)
    , _ = ep(p, r, i, f, s.iterations, s.huberPx, s.gaugeAnchorImageId === void 0 ? void 0 : [s.gaugeAnchorImageId], {
      reprojectionCostScorer: s.reprojectionCostScorer ?? null,
      normalEquationScorer: s.normalEquationScorer ?? null
    })
    , v = l({
      pointCount: p.length,
      observations: h,
      acceptedSteps: _.acceptedSteps,
      errorBefore: _.errorBefore,
      errorAfter: _.errorAfter,
      optimisedCameras: _.optimisedCameras,
      anchoredCameras: _.anchoredCameras
    });
  if (_.acceptedSteps <= 0)
    return v;
  let y = c.map(e => rd(a[e]))
    , b = m.map(e => [...o[e].xyz]);
  for (let e of c)
    id(f[e], a[e]);
  for (let e = 0; e < m.length; e++) {
    let t = o[m[e]].xyz
      , n = p[e].xyz;
    t[0] = n[0],
      t[1] = n[1],
      t[2] = n[2]
  }
  let x = ad(m, o, r, i, a, s.huberPx);
  if (!(Number.isFinite(x.huberRms) && (!Number.isFinite(g.huberRms) || x.huberRms <= g.huberRms + 1e-9))) {
    for (let e = 0; e < c.length; e++)
      id(y[e], a[c[e]]);
    for (let e = 0; e < m.length; e++) {
      let t = o[m[e]].xyz;
      t[0] = b[e][0],
        t[1] = b[e][1],
        t[2] = b[e][2]
    }
    return v
  }
  let S = sd(r);
  for (let e of m)
    o[e].error = od(o[e], r, i, a, S);
  return {
    ...v,
    applied: !0
  }
}
function rd(e) {
  return {
    imageId: e.imageId,
    name: e.name,
    center: [...e.center],
    R: [...e.R],
    qvec: [...e.qvec],
    tvec: [...e.tvec],
    registered: e.registered,
    componentId: e.componentId
  }
}
function id(e, t) {
  t.imageId = e.imageId,
    t.name = e.name,
    t.registered = e.registered,
    t.componentId = e.componentId;
  for (let n = 0; n < 3; n++)
    t.center[n] = e.center[n],
      t.tvec[n] = e.tvec[n];
  for (let n = 0; n < 4; n++)
    t.qvec[n] = e.qvec[n];
  for (let n = 0; n < 9; n++)
    t.R[n] = e.R[n]
}
function ad(e, t, n, r, i, a) {
  let o = sd(n)
    , s = 0
    , c = 0
    , l = 0
    , u = Math.max(1e-6, a)
    , d = u * u;
  for (let a of e) {
    let e = t[a];
    if (!(!e || e.track.length === 0))
      for (let t of e.track) {
        let a = o.get(t.imageId);
        if (a === void 0 || !i[a]?.registered)
          continue;
        let f = $u(e.xyz, n[a], i[a].R, i[a].tvec, r[a].xs[t.point2DIdx], r[a].ys[t.point2DIdx]);
        if (!Number.isFinite(f))
          continue;
        let p = f * f;
        s += p,
          c += p <= d ? p : 2 * u * f - d,
          l++
      }
  }
  return l === 0 ? {
    l2Rms: 1 / 0,
    huberRms: 1 / 0,
    count: 0
  } : {
    l2Rms: Math.sqrt(s / l),
    huberRms: Math.sqrt(c / l),
    count: l
  }
}
function od(e, t, n, r, i) {
  let a = 0
    , o = 0;
  for (let s of e.track) {
    let c = i.get(s.imageId);
    if (c === void 0 || !r[c]?.registered)
      continue;
    let l = $u(e.xyz, t[c], r[c].R, r[c].tvec, n[c].xs[s.point2DIdx], n[c].ys[s.point2DIdx]);
    Number.isFinite(l) && (a += l,
      o++)
  }
  return o > 0 ? a / o : 1 / 0
}
function sd(e) {
  let t = new Map;
  for (let n = 0; n < e.length; n++)
    t.set(e[n].id, n);
  return t
}
function cd(e, t, n, r, i, a, o, s, c, l, u) {
  let d = s.triangulationReprojectionPx * 2
    , f = 0
    , p = 0
    , m = 0
    , h = rc(a, u, e, o);
  for (let e of h) {
    let o = i[e - 1];
    if (!o || o.track.length < 3)
      continue;
    let s = hd(o.track, t, n, r, c);
    if (!s)
      continue;
    let { survivors: h, stripped: g, totalError: _, count: v } = ld(s.xyz, o.track, t, n, r, c, d);
    if (h.length >= 2) {
      let e = v > 0 ? _ / v : 1 / 0
        , i = 0
        , m = 0;
      for (let e of h) {
        let a = c.get(e.imageId);
        if (a === void 0 || !r[a].registered)
          continue;
        let s = $u(o.xyz, t[a], r[a].R, r[a].tvec, n[a].xs[e.point2DIdx], n[a].ys[e.point2DIdx]);
        Number.isFinite(s) && (i += s,
          m++)
      }
      let y = m > 0 ? i / m : 1 / 0
        , b = Math.min(Number.isFinite(o.error) ? o.error : 1 / 0, y);
      if (Number.isFinite(e) && e <= d && e <= b + 1e-6) {
        o.xyz = s.xyz,
          o.track = h,
          o.error = e;
        for (let e of g) {
          let t = c.get(e.imageId);
          t !== void 0 && (nc(a, u, t, e.point2DIdx),
            l?.[t]?.add(e.point2DIdx))
        }
        g.length > 0 && (p += g.length),
          f++
      }
    } else {
      if (ld(o.xyz, o.track, t, n, r, c, d).survivors.length >= 2)
        continue;
      for (let e of o.track) {
        let t = c.get(e.imageId);
        t !== void 0 && (nc(a, u, t, e.point2DIdx),
          l?.[t]?.add(e.point2DIdx))
      }
      o.track = [],
        o.error = NaN,
        m++
    }
  }
  return {
    refined: f,
    demoted: p,
    dropped: m
  }
}
function ld(e, t, n, r, i, a, o) {
  let s = []
    , c = []
    , l = 0
    , u = 0;
  for (let d of t) {
    let t = a.get(d.imageId);
    if (t === void 0 || !i[t].registered) {
      s.push(d);
      continue
    }
    let f = $u(e, n[t], i[t].R, i[t].tvec, r[t].xs[d.point2DIdx], r[t].ys[d.point2DIdx]);
    Number.isFinite(f) && f <= o ? (s.push(d),
      l += f,
      u++) : c.push(d)
  }
  return {
    survivors: s,
    stripped: c,
    totalError: l,
    count: u
  }
}
function ud(e, t, n, r, i, a = 6, o = 1.5) {
  let s = dd(e, t, i)
    , c = fd(e, s, t, n, r, i, o)
    , l = {
      observations: s.length,
      acceptedSteps: 0,
      errorBefore: c.l2Rms,
      errorAfter: c.l2Rms
    };
  if (!r[e]?.registered || s.length < 6 || !Number.isFinite(c.huberRms))
    return l;
  let u = new Float64Array(36)
    , d = new Float64Array(6)
    , f = c.huberRms
    , p = 1e-4;
  for (let c = 0; c < a; c++) {
    u.fill(0),
      d.fill(0);
    let a = r[e]
      , c = t[e]
      , m = n[e]
      , h = a.R
      , g = a.tvec
      , _ = Math.max(1e-6, o)
      , v = new Float64Array(12);
    for (let e of s) {
      let t = i[e.pointIndex];
      if (!t || t.track.length === 0)
        continue;
      let n = t.xyz
        , r = h[0] * n[0] + h[1] * n[1] + h[2] * n[2] + g[0]
        , a = h[3] * n[0] + h[4] * n[1] + h[5] * n[2] + g[1]
        , o = h[6] * n[0] + h[7] * n[1] + h[8] * n[2] + g[2]
        , s = gt(c.intrinsics, r, a, o);
      if (!s)
        continue;
      let l = m.xs[e.point2DIdx] - s.u
        , f = m.ys[e.point2DIdx] - s.v
        , p = Math.hypot(l, f)
        , y = p <= _ ? 1 : _ / p
        , b = s.jpi
        , x = r - g[0]
        , S = a - g[1]
        , C = o - g[2]
        , w = [0, C, -S, -C, 0, x, S, -x, 0];
      for (let e = 0; e < 2; e++)
        for (let t = 0; t < 3; t++) {
          let n = 0;
          for (let r = 0; r < 3; r++)
            n += b[e * 3 + r] * w[r * 3 + t];
          v[e * 6 + t] = n,
            v[e * 6 + 3 + t] = b[e * 3 + t]
        }
      let T = y * l
        , E = y * f;
      for (let e = 0; e < 6; e++) {
        let t = v[e]
          , n = v[6 + e];
        d[e] += t * T + n * E;
        for (let r = e; r < 6; r++)
          u[e * 6 + r] += y * (t * v[r] + n * v[6 + r])
      }
    }
    for (let e = 0; e < 6; e++) {
      for (let t = e + 1; t < 6; t++)
        u[t * 6 + e] = u[e * 6 + t];
      u[e * 6 + e] += p * Math.max(1, u[e * 6 + e])
    }
    let y = pd(u, d);
    if (!y) {
      if (p *= 10,
        p > 1e6)
        break;
      continue
    }
    let b = md(y);
    if (!Number.isFinite(b) || b > .5) {
      if (p *= 10,
        p > 1e6)
        break;
      continue
    }
    let x = [...r[e].R]
      , S = [...r[e].tvec]
      , C = Pn(I(Nn([y[0], y[1], y[2]]), r[e].R))
      , w = [r[e].tvec[0] + y[3], r[e].tvec[1] + y[4], r[e].tvec[2] + y[5]];
    bd(r[e], C, w);
    let T = fd(e, s, t, n, r, i, o);
    if (Number.isFinite(T.huberRms) && T.huberRms < f) {
      if (f = T.huberRms,
        l.errorAfter = T.l2Rms,
        l.acceptedSteps++,
        p = Math.max(1e-8, p * .4),
        b < 1e-8)
        break
    } else if (bd(r[e], x, S),
      p *= 8,
      p > 1e6)
      break
  }
  return l
}
function dd(e, t, n) {
  let r = t[e]?.id;
  if (r === void 0)
    return [];
  let i = [];
  for (let e = 0; e < n.length; e++) {
    let t = n[e];
    if (!(!t || t.track.length < 3)) {
      for (let n of t.track)
        if (n.imageId === r) {
          i.push({
            pointIndex: e,
            point2DIdx: n.point2DIdx
          });
          break
        }
    }
  }
  return i
}
function fd(e, t, n, r, i, a, o) {
  if (!i[e]?.registered || t.length === 0)
    return {
      l2Rms: 1 / 0,
      huberRms: 1 / 0
    };
  let s = 0
    , c = 0
    , l = 0
    , u = Math.max(1e-6, o)
    , d = u * u
    , f = i[e]
    , p = n[e]
    , m = r[e];
  for (let e of t) {
    let t = a[e.pointIndex];
    if (!t || t.track.length === 0)
      continue;
    let n = ct(p, f.R, f.tvec, t.xyz);
    if (!Number.isFinite(n[0]) || n[2] <= 1e-6)
      return {
        l2Rms: 1 / 0,
        huberRms: 1 / 0
      };
    let r = m.xs[e.point2DIdx] - n[0]
      , i = m.ys[e.point2DIdx] - n[1]
      , o = r * r + i * i;
    s += o,
      c += o <= d ? o : 2 * u * Math.sqrt(o) - d,
      l++
  }
  return l === 0 ? {
    l2Rms: 1 / 0,
    huberRms: 1 / 0
  } : {
    l2Rms: Math.sqrt(s / l),
    huberRms: Math.sqrt(c / l)
  }
}
function pd(e, t) {
  let n = new Float64Array(42);
  for (let r = 0; r < 6; r++) {
    for (let t = 0; t < 6; t++)
      n[r * 7 + t] = e[r * 6 + t];
    n[r * 7 + 6] = t[r]
  }
  for (let e = 0; e < 6; e++) {
    let t = e;
    for (let r = e + 1; r < 6; r++)
      Math.abs(n[r * 7 + e]) > Math.abs(n[t * 7 + e]) && (t = r);
    if (Math.abs(n[t * 7 + e]) < 1e-12)
      return null;
    if (t !== e)
      for (let r = e; r < 7; r++) {
        let i = n[e * 7 + r];
        n[e * 7 + r] = n[t * 7 + r],
          n[t * 7 + r] = i
      }
    let r = n[e * 7 + e];
    for (let t = e; t < 7; t++)
      n[e * 7 + t] /= r;
    for (let t = 0; t < 6; t++) {
      if (t === e)
        continue;
      let r = n[t * 7 + e];
      if (r !== 0)
        for (let i = e; i < 7; i++)
          n[t * 7 + i] -= r * n[e * 7 + i]
    }
  }
  let r = new Float64Array(6);
  for (let e = 0; e < 6; e++)
    r[e] = n[e * 7 + 6];
  return r
}
function md(e) {
  let t = 0;
  for (let n = 0; n < e.length; n++)
    t += e[n] * e[n];
  return Math.sqrt(t)
}
function hd(e, t, n, r, i) {
  let a = [];
  for (let t of e) {
    let e = i.get(t.imageId);
    e === void 0 || !r[e].registered || a.push({
      idx: e,
      point2DIdx: t.point2DIdx
    })
  }
  if (a.length < 2)
    return null;
  let o = 0
    , s = 1
    , c = -1;
  for (let e = 0; e < a.length; e++)
    for (let t = e + 1; t < a.length; t++) {
      let n = r[a[e].idx].center
        , i = r[a[t].idx].center
        , l = Math.hypot(n[0] - i[0], n[1] - i[1], n[2] - i[2]);
      l > c && (c = l,
        o = e,
        s = t)
    }
  let l = a[o]
    , u = a[s]
    , d = t[l.idx]
    , f = t[u.idx]
    , p = n[l.idx]
    , m = n[u.idx]
    , h = r[l.idx]
    , g = r[u.idx]
    , [_, v] = wd(d, p.xs[l.point2DIdx], p.ys[l.point2DIdx])
    , [y, b] = wd(f, m.xs[u.point2DIdx], m.ys[u.point2DIdx])
    , x = rt(h.R, h.tvec, g.R, g.tvec, _, v, y, b);
  if (!x)
    return null;
  let S = 0
    , C = 0;
  for (let { idx: e, point2DIdx: i } of a) {
    let a = $u(x, t[e], r[e].R, r[e].tvec, n[e].xs[i], n[e].ys[i]);
    Number.isFinite(a) && (S += a,
      C++)
  }
  return {
    xyz: x,
    error: C > 0 ? S / C : 1 / 0
  }
}
function gd(e, t, n, r, i, a, o, s, c, l, u) {
  let d = ct(t, r, i, e)
    , f = ct(n, a, o, e);
  if (!Number.isFinite(d[0]) || !Number.isFinite(f[0]) || d[2] <= 0 || f[2] <= 0)
    return 1 / 0;
  let p = Math.hypot(d[0] - s, d[1] - c)
    , m = Math.hypot(f[0] - l, f[1] - u);
  return Math.max(p, m)
}
function _d(e, t, n) {
  for (let r of e.track)
    if (r.imageId === t && r.point2DIdx === n)
      return;
  e.track.push({
    imageId: t,
    point2DIdx: n
  })
}
function vd(e, t, n) {
  let r = e[0] - t[0]
    , i = e[1] - t[1]
    , a = e[2] - t[2]
    , o = e[0] - n[0]
    , s = e[1] - n[1]
    , c = e[2] - n[2]
    , l = Math.hypot(r, i, a)
    , u = Math.hypot(o, s, c);
  if (l <= 1e-9 || u <= 1e-9)
    return 0;
  let d = Math.max(-1, Math.min(1, (r * o + i * s + a * c) / (l * u)));
  return Math.acos(d) * 180 / Math.PI
}
function yd(e) {
  return e.map(e => ({
    imageId: e.id,
    name: e.name,
    center: [0, 0, 0],
    R: [1, 0, 0, 0, 1, 0, 0, 0, 1],
    qvec: [1, 0, 0, 0],
    tvec: [0, 0, 0],
    registered: !1,
    componentId: -1
  }))
}
function bd(e, t, n) {
  e.R = t,
    e.tvec = n,
    e.center = tt(t, n),
    e.qvec = nt(t)
}
function xd(e, t) {
  return [-(e[0] * t[0] + e[1] * t[1] + e[2] * t[2]), -(e[3] * t[0] + e[4] * t[1] + e[5] * t[2]), -(e[6] * t[0] + e[7] * t[1] + e[8] * t[2])]
}
function Sd(e, t) {
  let n = [];
  for (let e = 0; e < t; e++)
    n.push([]);
  for (let t = 0; t < e.length; t++) {
    let r = e[t];
    n[r.leftIndex].push(t),
      n[r.rightIndex].push(t)
  }
  return n
}
function Cd(e, t, n, r, i, a, o, s) {
  return {
    leftImage: t >= 0 ? e[t].name : `n/a`,
    rightImage: e[n].name,
    leftIndex: t,
    rightIndex: n,
    gap: t >= 0 ? n - t : 0,
    rawMatches: r,
    filteredMatches: i,
    inliers: a,
    status: o,
    note: s
  }
}
function wd(e, t, n) {
  return ft(e.intrinsics, t, n)
}
function Td(e, t) {
  let n = t * 3;
  return [e.colors[n], e.colors[n + 1], e.colors[n + 2]]
}
function Ed(e, t) {
  return e[0] * t[0] + e[1] * t[1] + e[2] * t[2]
}
function Dd(e) {
  return Math.hypot(e[0], e[1], e[2])
}
function Od(e) {
  let t = Dd(e);
  return !Number.isFinite(t) || t <= 1e-12 ? null : [e[0] / t, e[1] / t, e[2] / t]
}
function kd(e, t) {
  return [e[0] + t[0], e[1] + t[1], e[2] + t[2]]
}
function Ad(e, t) {
  return [e[0] - t[0], e[1] - t[1], e[2] - t[2]]
}
function jd(e, t) {
  return [e[0] * t, e[1] * t, e[2] * t]
}
function Md(e) {
  return Od([e[6], e[7], e[8]]) ?? [0, 0, 1]
}
function Nd(e) {
  return [e[0], e[3], e[6], e[1], e[4], e[7], e[2], e[5], e[8]]
}
function Pd(e, t) {
  return [e[0] * t[0] + e[1] * t[1] + e[2] * t[2], e[3] * t[0] + e[4] * t[1] + e[5] * t[2], e[6] * t[0] + e[7] * t[1] + e[8] * t[2]]
}
function Fd(e, t) {
  return [e[1] * t[2] - e[2] * t[1], e[2] * t[0] - e[0] * t[2], e[0] * t[1] - e[1] * t[0]]
}
function Id(e, t, n) {
  return Number.isFinite(e) ? Math.max(t, Math.min(n, e)) : t
}
async function Ld(e, t, n, r, i, a, o = {}) {
  return Rd(e, t, n, r, i, a, o)
}
async function Rd(e, t, n, r, i, a, o = {}) {
  if (e.length < 2)
    throw Error(`Select at least two overlapping images.`);
  let s = {
    ...n,
    relativePoseSolver: n.relativePoseSolver ?? `five-point`
  }
    , c = s.mapper ?? `graph-pnp`
    , l = Gi(e, t, s.manualPairs ?? [])
    , u = l.features
    , d = o.manualPairCandidates ?? l.manualPairCandidates
    , f = o.manualMatchesByPair ?? l.manualMatchesByPair
    , p = l.trustedAnnotationTracks
    , { poses: m, pairGeometries: h, poseGraphEdges: g, diagnostics: _, gaugeAnchorImageIds: v } = c === `classic` ? await Ud(e, u, s, r, i, a) : await Hd(e, u, s, r, i, a, o.pairCandidatePlan, o.descriptorMatches, d, f, o.onStageEvent, p)
    , y = o.descriptorMatches?.precomputed ?? o.descriptorMatches?.latest
    , b = new Map;
  if (y)
    for (let e = 0; e < y.runnablePairs.length; e += 1) {
      let n = y.runnablePairs[e];
      b.set(Ui(n.i, n.j), zd(n, y.matches[e] ?? [], t))
    }
  return Wd(e, u, s, m, h, g, _, v, ra(e, t, s.manualPairs ?? [], b, 4, vt(s.relativePoseSolver ?? `five-point`)).map(e => ia(e, _)), p, Bd(r), Vd(r), a)
}
function zd(e, t, n) {
  let r = n[e.i]?.count ?? 0
    , i = n[e.j]?.count ?? 0;
  return t.filter(e => e.a >= 0 && e.a < r && e.b >= 0 && e.b < i)
}
function Bd(e) {
  let t = e;
  return typeof t?.createBundleReprojectionCostContext == `function` ? t : null
}
function Vd(e) {
  let t = e;
  return typeof t?.createBundleNormalEquationContext == `function` ? t : null
}
async function Hd(e, t, n, r, i, a, o, s, c = [], l = new Map, u, d = []) {
  let f = xc(n);
  f.manualPairCandidates = c;
  let p = await Sc(e, t, f, r, i, a, o, s, l, u, d)
    , m = p.edges.map(e => ({
      matches: e.matches,
      leftIndex: e.leftIndex,
      rightIndex: e.rightIndex,
      reprojectionErrors: []
    }));
  return u?.({
    type: `mapper-summary`,
    registeredCount: p.registeredCount,
    imageCount: e.length,
    componentCount: p.componentCount,
    seedPointCount: p.seedPoints.length
  }),
    a(`Mapper: ${p.registeredCount}/${e.length} cameras registered, ${p.componentCount} component${p.componentCount === 1 ? `` : `s`}, ${p.seedPoints.length} seed points`),
  {
    poses: p.poses,
    pairGeometries: m,
    poseGraphEdges: [],
    diagnostics: p.diagnostics,
    gaugeAnchorImageIds: p.gaugeAnchorImageIds
  }
}
async function Ud(e, t, n, r, i, a) {
  let o = e.map((e, t) => ({
    imageId: e.id,
    name: e.name,
    center: [0, 0, 0],
    R: [1, 0, 0, 0, 1, 0, 0, 0, 1],
    qvec: [1, 0, 0, 0],
    tvec: [0, 0, 0],
    registered: t === 0,
    componentId: t === 0 ? 0 : -1
  }))
    , s = []
    , c = []
    , l = []
    , u = new Map
    , d = 0
    , f = 1
    , p = {
      hammingMax: Math.round(Af(n.matcherHammingMax ?? 96, 32, 192)),
      ratio: Af(n.matcherRatio ?? .88, .5, .98)
    };
  for (let h = 1; h < e.length; h++) {
    let g = null
      , _ = null
      , v = Math.max(1, n.maxTrackGap);
    for (let a = 1; a <= v; a++) {
      let s = h - a;
      if (s < 0)
        break;
      if (!o[s].registered)
        continue;
      let c = await hf(e, t, s, h, a === 1 ? 320 : 220, r, i, p, n.relativePoseSolver);
      a === 1 && (_ = c),
        !(!c.relative || c.relative.inliers.length < n.minMatches) && (!g || c.relative.inliers.length > g.attempt.relative.inliers.length) && (g = {
          anchor: s,
          attempt: c
        })
    }
    if (!g || !g.attempt.relative) {
      let t = h - 1
        , r = _;
      if (r) {
        let i = r.filtered.length < n.minMatches ? `skipped` : `rejected`
          , o = r.filtered.length < n.minMatches ? `too few spatially consistent matches` : `epipolar pose rejected`;
        l.push(Mf(e, t, h, r.rawMatches, r.filtered.length, r.relative?.inliers.length ?? 0, i, o)),
          s.push({
            matches: [],
            leftIndex: t,
            rightIndex: h,
            reprojectionErrors: []
          }),
          a(`${e[t].name} -> ${e[h].name}: ${r.filtered.length} matches, skipped`)
      } else
        l.push(Mf(e, t, h, 0, 0, 0, `skipped`, `no registered anchor within search gap`)),
          a(`${e[h].name}: skipped, no registered anchor within ${v} images`);
      let i = await m(h, f);
      i && (f++,
        h = i.nextTarget - 1);
      continue
    }
    let { anchor: y, attempt: b } = g
      , x = b.relative;
    if (!x)
      continue;
    if (y !== h - 1 && _) {
      let t = _.filtered.length < n.minMatches ? `skipped` : `rejected`
        , r = _.filtered.length < n.minMatches ? `too few spatially consistent matches` : `epipolar pose rejected`;
      l.push(Mf(e, h - 1, h, _.rawMatches, _.filtered.length, _.relative?.inliers.length ?? 0, t, r))
    }
    let S = Ue(o[y].R, o[y].tvec, x.R, x.t)
      , C = S.R
      , w = S.t
      , T = S.center
      , E = `unit`
      , D = Np(u, y, x.inliers, t[h]);
    if (D.length >= 3) {
      let t = at(S.R, e[h].intrinsics, D);
      t && Pp(S.R, t, D, e[h]) && (w = t,
        T = tt(S.R, t),
        E = `metric`,
        d++)
    }
    o[h].R = C,
      o[h].tvec = w,
      o[h].center = T,
      o[h].qvec = nt(C),
      o[h].registered = !0,
      o[h].componentId = o[y].componentId;
    let O = Gp(o[h].center, o[y].center);
    c.push(wp(y, h, o[y].R, x.R, x.t, O, x.inliers.length)),
      s.push({
        matches: Ip(x.inliers, t[y], t[h], n.maxPointsPerPair),
        leftIndex: y,
        rightIndex: h,
        reprojectionErrors: []
      }),
      l.push(Mf(e, y, h, b.rawMatches, b.filtered.length, x.inliers.length, Nf(x.inliers.length), `${h - y > 1 ? `bridge-${h - y} ` : ``}${Pf(x.inliers.length)}`)),
      a(`${e[y].name} -> ${e[h].name}: ${x.inliers.length}/${b.filtered.length} epipolar inliers${h - y > 1 ? ` (bridge)` : ``} [${E} baseline ${E === `metric` ? ` from ${D.length} shared points` : ``}]`),
      Fp(u, y, h, x.inliers, e, t, o, n.maxPointsPerPair)
  }
  async function m(d, f) {
    if (d >= e.length - 1)
      return null;
    let m = d + 1;
    if (o[d].registered || o[m].registered)
      return null;
    let h = await hf(e, t, d, m, 320, r, i, p, n.relativePoseSolver);
    if (!h.relative || h.relative.inliers.length < n.minMatches)
      return l.push(Mf(e, d, m, h.rawMatches, h.filtered.length, h.relative?.inliers.length ?? 0, h.filtered.length < n.minMatches ? `skipped` : `rejected`, h.filtered.length < n.minMatches ? `component bootstrap: too few spatially consistent matches` : `component bootstrap: epipolar pose rejected`)),
        null;
    let g = [f * 10, 0, 0];
    o[d].center = g,
      o[d].R = [1, 0, 0, 0, 1, 0, 0, 0, 1],
      o[d].tvec = zp(o[d].R, g),
      o[d].qvec = nt(o[d].R),
      o[d].registered = !0,
      o[d].componentId = f;
    let _ = h.relative
      , v = Ue(o[d].R, o[d].tvec, _.R, _.t);
    o[m].R = v.R,
      o[m].tvec = v.t,
      o[m].center = v.center,
      o[m].qvec = nt(v.R),
      o[m].registered = !0,
      o[m].componentId = f;
    let y = Gp(o[m].center, o[d].center);
    return c.push(wp(d, m, o[d].R, _.R, _.t, y, _.inliers.length)),
      s.push({
        matches: Ip(_.inliers, t[d], t[m], n.maxPointsPerPair),
        leftIndex: d,
        rightIndex: m,
        reprojectionErrors: []
      }),
      l.push(Mf(e, d, m, h.rawMatches, h.filtered.length, _.inliers.length, Nf(_.inliers.length), `component-${f + 1} bootstrap ${Pf(_.inliers.length)}`)),
      Fp(u, d, m, _.inliers, e, t, o, n.maxPointsPerPair),
      a(`${e[d].name} -> ${e[m].name}: ${_.inliers.length}/${h.filtered.length} epipolar inliers (new component ${f + 1})`),
    {
      nextTarget: m + 1
    }
  }
  async function h() {
    let d = 0;
    for (let f = 0; f < 4; f++) {
      let f = 0
        , m = xf(o);
      for (let h = 0; h + 1 < m.length; h++) {
        let g = m[h]
          , _ = m[h + 1];
        if (g.componentId < 0 || _.componentId < 0 || g.componentId === _.componentId)
          continue;
        let v = Sf(g.indices, 3)
          , y = Cf(_.indices, 3)
          , b = null
          , x = null;
        for (let a of v)
          for (let o of y) {
            if (o <= a)
              continue;
            let s = await gf(e, t, a, o, r, i, n.minMatches, p, n.relativePoseSolver);
            (!x || vf(s) > vf(x.attempt)) && (x = {
              left: a,
              right: o,
              attempt: s
            }),
              !(!s.relative || s.relative.inliers.length < n.minMatches) && (!b || s.relative.inliers.length > b.attempt.relative.inliers.length) && (b = {
                left: a,
                right: o,
                attempt: s
              })
          }
        if (!b || !b.attempt.relative || b.attempt.relative.inliers.length < 45) {
          x && l.push(Mf(e, x.left, x.right, x.attempt.rawMatches, x.attempt.filtered.length, x.attempt.relative?.inliers.length ?? 0, x.attempt.filtered.length < n.minMatches ? `skipped` : `rejected`, `component boundary search ${g.componentId}->${_.componentId}: no mergeable pose`));
          continue
        }
        let S = o[b.right].componentId
          , C = o[b.left].componentId
          , w = kp(o, u, S, C, b.left, b.right, b.attempt.relative);
        if (w.moved <= 0) {
          l.push(Mf(e, b.left, b.right, b.attempt.rawMatches, b.attempt.filtered.length, b.attempt.relative.inliers.length, `rejected`, `component boundary search ${S}->${C}: merge blocked [sim3 correspondences ${w.correspondences}${w.reason ? `, ${w.reason}` : ``}]`));
          continue
        }
        let T = Gp(o[b.right].center, o[b.left].center);
        c.push(wp(b.left, b.right, o[b.left].R, b.attempt.relative.R, b.attempt.relative.t, T, b.attempt.relative.inliers.length)),
          s.push({
            matches: Ip(b.attempt.relative.inliers, t[b.left], t[b.right], n.maxPointsPerPair),
            leftIndex: b.left,
            rightIndex: b.right,
            reprojectionErrors: []
          }),
          l.push(Mf(e, b.left, b.right, b.attempt.rawMatches, b.attempt.filtered.length, b.attempt.relative.inliers.length, Nf(b.attempt.relative.inliers.length), `component boundary merge ${S}->${C}, ${w.moved} cameras [${w.method}, sim3 correspondences ${w.correspondences}]${b.attempt.usedUnfiltered ? `, raw-match RANSAC` : ``}`)),
          Fp(u, b.left, b.right, b.attempt.relative.inliers, e, t, o, n.maxPointsPerPair),
          a(`Merged component ${S} into ${C} via ${e[b.left].name} -> ${e[b.right].name} (${b.attempt.relative.inliers.length} inliers, ${w.moved} cameras, ${w.method}${w.method === `sim3` ? ` from ${w.correspondences} shared points` : ``})`),
          d++,
          f++
      }
      if (f === 0)
        break
    }
    return d
  }
  async function g() {
    let d = n.visualBridgeMode ?? `retrieval`;
    if (d === `off`)
      return 0;
    let f = wf(t)
      , m = 0
      , h = Math.max(0, n.visualBridgeCandidates ?? Math.min(96, Math.max(24, e.length)))
      , g = Af(n.visualBridgeSignatureMax ?? 118, 0, 256)
      , _ = Math.max(n.minMatches, n.visualBridgeMinInliers ?? 60)
      , v = Math.max(1, n.visualBridgePairsPerComponent ?? (d === `component-exhaustive` ? 12 : 4));
    if (h === 0)
      return 0;
    for (let y = 0; y < 3; y++) {
      let y = Tf(o, f, n.maxTrackGap, h, g, v, d);
      if (y.length === 0)
        break;
      let b = 0
        , x = new Map;
      for (let a of y) {
        if (o[a.left].componentId === o[a.right].componentId)
          continue;
        let s = await _f(e, t, a.left, a.right, r, i, n.minMatches, p, n.relativePoseSolver);
        if (b++,
          !s.relative || s.relative.inliers.length < _) {
          s.rawMatches >= n.minMatches && l.push(Mf(e, a.left, a.right, s.rawMatches, s.filtered.length, s.relative?.inliers.length ?? 0, s.filtered.length < n.minMatches ? `skipped` : `rejected`, `visual-neighbor bridge rejected, signature distance ${a.signatureDistance}`));
          continue
        }
        let c = o[a.right].componentId
          , d = o[a.left].componentId
          , f = Ep(u, a.left, a.right, s.relative.inliers)
          , m = `${c}->${d}`
          , h = x.get(m);
        h || (h = {
          fromComponent: c,
          toComponent: d,
          observations: [],
          inliers: 0,
          correspondences: 0,
          bestSignatureDistance: a.signatureDistance
        },
          x.set(m, h)),
          h.observations.push({
            candidate: a,
            rawMatches: s.rawMatches,
            filteredMatches: s.filtered.length,
            relative: s.relative,
            src: f.src,
            dst: f.dst
          }),
          h.inliers += s.relative.inliers.length,
          h.correspondences += f.src.length,
          h.bestSignatureDistance = Math.min(h.bestSignatureDistance, a.signatureDistance)
      }
      let S = [...x.values()].sort((e, t) => {
        let n = t.correspondences - e.correspondences;
        if (n !== 0)
          return n;
        let r = t.inliers - e.inliers;
        return r === 0 ? e.bestSignatureDistance - t.bestSignatureDistance : r
      }
      )
        , C = 0;
      for (let r of S) {
        if (r.observations.length === 0 || !yf(o, r))
          continue;
        let i = Ap(o, u, r)
          , d = bf(r);
        if (i.moved <= 0) {
          d && l.push(Mf(e, d.candidate.left, d.candidate.right, d.rawMatches, d.filteredMatches, d.relative.inliers.length, `rejected`, `visual-neighbor bridge blocked ${r.fromComponent}->${r.toComponent} [${r.observations.length} pairs, sim3 correspondences ${i.correspondences}${i.reason ? `, ${i.reason}` : ``}], signature distance ${r.bestSignatureDistance}`));
          continue
        }
        for (let i of r.observations) {
          if (o[i.candidate.left].componentId !== r.toComponent || o[i.candidate.right].componentId !== r.toComponent)
            continue;
          let a = Gp(o[i.candidate.right].center, o[i.candidate.left].center);
          c.push(wp(i.candidate.left, i.candidate.right, o[i.candidate.left].R, i.relative.R, i.relative.t, a, i.relative.inliers.length * .75)),
            s.push({
              matches: Ip(i.relative.inliers, t[i.candidate.left], t[i.candidate.right], n.maxPointsPerPair),
              leftIndex: i.candidate.left,
              rightIndex: i.candidate.right,
              reprojectionErrors: []
            }),
            Fp(u, i.candidate.left, i.candidate.right, i.relative.inliers, e, t, o, n.maxPointsPerPair)
        }
        d && l.push(Mf(e, d.candidate.left, d.candidate.right, d.rawMatches, d.filteredMatches, d.relative.inliers.length, Nf(d.relative.inliers.length), `visual-neighbor component merge ${r.fromComponent}->${r.toComponent}, ${i.moved} cameras [${i.method}, ${r.observations.length} pairs, sim3 correspondences ${i.correspondences}], signature distance ${r.bestSignatureDistance}`)),
          a(`Visual-neighbor merged component ${r.fromComponent} into ${r.toComponent} from ${r.observations.length} pair${r.observations.length === 1 ? `` : `s`} (${r.inliers} inliers, ${i.method}, ${i.correspondences} Sim3 points)`),
          m++,
          C++
      }
      if (b > 0 && a(`${d === `component-exhaustive` ? `Component-exhaustive` : `Visual-neighbor`} bridge search evaluated ${b} candidate pairs across ${x.size} component edges ${C > 0 ? `, merged ${C}` : ``}`),
        C === 0)
        break
    }
    return m
  }
  let _ = Math.max(32, p.hammingMax - 8)
    , v = Math.max(.5, p.ratio - .02);
  for (let d = 2; d <= n.maxTrackGap; d++) {
    let f = 0;
    for (let p = 0; p + d < e.length; p++) {
      let m = p + d;
      if (!o[p].registered || !o[m].registered)
        continue;
      let h = await Mi(t[p], t[m], i, _, v)
        , g = h;
      if (g.length < n.minMatches)
        continue;
      let y = await _e(e[p], e[m], t[p], t[m], g, 320, 3.4, r, {
        solver: n.relativePoseSolver
      });
      if (!y || y.inliers.length < n.minMatches)
        continue;
      let b = `gap-${d} ${Pf(y.inliers.length)}`
        , x = o[p].componentId === o[m].componentId;
      if (!x && y.inliers.length >= 45) {
        let t = o[m].componentId
          , n = o[p].componentId
          , r = kp(o, u, t, n, p, m, y);
        if (r.moved > 0)
          x = !0,
            b = `component merge ${t}->${n}, ${r.moved} cameras [${r.method}, sim3 correspondences ${r.correspondences}], gap-${d} ${Pf(y.inliers.length)}`,
            a(`Merged component through ${e[p].name} -> ${e[m].name} using ${y.inliers.length} inliers (${r.moved} cameras, ${r.method}${r.method === `sim3` ? ` from ${r.correspondences} shared points` : ``})`);
        else {
          l.push(Mf(e, p, m, h.length, g.length, y.inliers.length, `rejected`, `cross-component link rejected [sim3 correspondences ${r.correspondences}${r.reason ? `, ${r.reason}` : ``}], gap-${d} ${Pf(y.inliers.length)}`));
          continue
        }
      }
      if (!x)
        continue;
      Fp(u, p, m, y.inliers, e, t, o, n.maxPointsPerPair);
      let S = Gp(o[m].center, o[p].center);
      c.push(wp(p, m, o[p].R, y.R, y.t, S, y.inliers.length * .65)),
        s.push({
          matches: Ip(y.inliers, t[p], t[m], n.maxPointsPerPair),
          leftIndex: p,
          rightIndex: m,
          reprojectionErrors: []
        }),
        l.push(Mf(e, p, m, h.length, g.length, y.inliers.length, Nf(y.inliers.length), b)),
        f++
    }
    f > 0 && a(`Accepted ${f} image-pair links at gap ${d} for track merging`)
  }
  let y = await g();
  y > 0 && a(`Merged ${y} component link${y === 1 ? `` : `s`} through visual-neighbor search`);
  let b = await h();
  b > 0 && a(`Merged ${b} component boundary link${b === 1 ? `` : `s`} after boundary search`);
  let x = Rp(o, c);
  return x > 0 && a(`Refreshed ${x} pose-graph constraints after component alignment`),
    d > 0 && a(`Resolved metric baselines for ${d}/${e.length - 1} cameras via shared-point resection`),
  {
    poses: o,
    pairGeometries: s,
    poseGraphEdges: c,
    diagnostics: l
  }
}
function Wd(e, t, n, r, i, a, o, s, c, l, u, d, f) {
  let p = Lp(r, a, 12);
  p.cameras > 0 && f(`Pose graph smoothed ${p.cameras} cameras with ${p.edges} direction constraints`);
  let m = []
    , h = 1
    , g = Ff(i, t, r, Af(n.trackDescriptorConsistencyMax ?? n.matcherHammingMax ?? 96, 0, 256))
    , _ = If(g, l, t, r)
    , v = Yf(r)
    , y = n.guidedTrackRadius > 0 ? Gf(g, e, t, r, n.guidedTrackRadius, n.guidedDescriptorDistance, v) : 0;
  f(`Merged ${g.length} candidate tracks from verified pair inliers and trusted annotations`),
    _ > 0 && f(`Merged ${_} trusted annotation track${_ === 1 ? `` : `s`} into sparse tracks`),
    y > 0 && f(`Guided track extension added ${y} projected observations`);
  for (let n of g) {
    let i = Jf(n, e, t, r, v);
    if (!i)
      continue;
    let a = Zf(i.xyz, n, e, t, r, 5)
      , o = Qf(a, n, e, t, r);
    if (!Number.isFinite(o) || o > 7.5)
      continue;
    let s = n[0];
    m.push({
      id: h++,
      xyz: a,
      rgb: Qp(t[s.imageIndex], s.featureIndex),
      error: o,
      track: n.map(t => ({
        imageId: e[t.imageIndex].id,
        point2DIdx: t.featureIndex
      }))
    })
  }
  let b = $p(m.map(e => e.error))
    , x = ep(m, e, t, r, 8, 1.5, s, {
      refineSharedFocal: n.refineIntrinsics ?? !1,
      refineSharedRadialK1: n.refineIntrinsics ?? !1,
      reprojectionCostScorer: u,
      normalEquationScorer: d
    });
  Gd(m, e, t, r);
  let S = m.filter(e => Number.isFinite(e.error) && e.error <= 7.5);
  m.length = 0,
    m.push(...S);
  let C = Hp(m, r);
  C.removed > 0 && (m.length = 0,
    m.push(...C.points));
  let w = null;
  m.length > 0 && (w = ep(m, e, t, r, 4, 1.5, s, {
    reprojectionCostScorer: u,
    normalEquationScorer: d
  }),
    Gd(m, e, t, r)),
    f(`Triangulated ${m.length} merged sparse points`),
    C.removed > 0 && f(`Removed ${C.removed} distant spatial outliers`);
  let T = [];
  (x.intrinsicSteps > x.distortionSteps || Math.abs(x.focalScale - 1) > 1e-8) && T.push(`focal scale ${L(x.focalScale)}`),
    (x.distortionSteps > 0 || Math.abs(x.radialK1) > 1e-8) && T.push(`k1 ${x.radialK1.toFixed(4)}`);
  let E = T.length > 0 ? `, ${T.join(`, `)} (${x.intrinsicSteps} intrinsic step ${x.intrinsicSteps === 1 ? `` : `s`})` : ``;
  x.acceptedSteps > 0 || x.intrinsicSteps > 0 ? f(`Bundle adjusted (R,t,X${x.optimisedIntrinsics > 0 ? `,K` : ``}) over ${x.outerIterations} iters / ${x.acceptedSteps} accepted (${L(b)} px -> ${L($p(m.map(e => e.error)))} px median, RMS ${L(x.errorBefore)} -> ${L(x.errorAfter)}; ${x.optimisedCameras} free / ${x.anchoredCameras} anchored ${E})`) : f(`Bundle adjustment converged at ${L(x.errorBefore)} px RMS (no step accepted; ${x.optimisedCameras} free / ${x.anchoredCameras} anchored)`),
    w && w.acceptedSteps > 0 && f(`Second-pass BA after spatial filter: ${w.acceptedSteps} steps, RMS ${L(w.errorBefore)} -> ${L(w.errorAfter)}`);
  let D = m.length ? m.reduce((e, t) => e + t.track.length, 0) / m.length : 0
    , O = m.reduce((e, t) => e + +(t.track.length >= 3), 0)
    , k = o.filter(e => e.gap === 1 && e.status !== `ok`).length
    , A = Xp(m)
    , j = {
      iterations: x.outerIterations,
      acceptedSteps: x.acceptedSteps,
      errorBefore: x.errorBefore,
      errorAfter: x.errorAfter,
      optimisedCameras: x.optimisedCameras,
      anchoredCameras: x.anchoredCameras,
      intrinsicSteps: x.intrinsicSteps,
      distortionSteps: x.distortionSteps,
      optimisedIntrinsics: x.optimisedIntrinsics,
      focalScale: x.focalScale,
      radialK1: x.radialK1,
      ...w ? {
        secondPass: {
          iterations: w.outerIterations,
          acceptedSteps: w.acceptedSteps,
          errorBefore: w.errorBefore,
          errorAfter: w.errorAfter
        }
      } : {}
    }
    , ee = {
      gpuScoring: !1,
      features: t.map(e => e.count),
      matches: i.map(e => e.matches.length),
      registeredImages: r.filter(e => e.registered).length,
      medianReprojectionError: $p(m.map(e => e.error)),
      candidateTracks: g.length,
      guidedObservations: y,
      meanTrackLength: D,
      longTracks: O,
      weakLinks: k,
      diagnostics: o,
      ...c.length > 0 ? {
        manualPairEvaluations: [...c]
      } : {},
      bundleAdjust: j
    };
  return {
    cameras: e.map(e => e.intrinsics),
    poses: r,
    points: m,
    images: e.flatMap((e, n) => r[n].registered ? [{
      id: e.id,
      cameraId: n + 1,
      name: e.name,
      qvec: r[n].qvec,
      tvec: r[n].tvec,
      xys: Array.from({
        length: t[n].count
      }, (e, r) => [t[n].xs[r], t[n].ys[r]]),
      point3DIds: Array.from({
        length: t[n].count
      }, (t, n) => A.get(`${e.id}:${n}`) ?? -1)
    }] : []),
    stats: ee
  }
}
function Gd(e, t, n, r) {
  let i = xp(t);
  for (let a of e)
    a.error = Kd(a, t, n, r, i)
}
function Kd(e, t, n, r, i = xp(t)) {
  let a = 0
    , o = 0
    , s = [0, 0, 0];
  for (let c of e.track) {
    let l = i.get(c.imageId);
    if (l === void 0 || l < 0 || l >= t.length)
      continue;
    let u = t[l]
      , d = n[l]
      , f = r[l];
    if (!lt(s, u, f.R, f.tvec, e.xyz))
      return 1 / 0;
    a += Math.hypot(s[0] - d.xs[c.point2DIdx], s[1] - d.ys[c.point2DIdx]),
      o++
  }
  return o ? a / o : 1 / 0
}
function qd(e, t = {}) {
  return t.binary === !1 ? Yd(e, t) : Jd(e, t)
}
function Jd(e, t) {
  let n = t.includeDiagnostics ?? !1
    , r = t.includeCameraCenters ?? !1
    , i = $d(e) + (r ? ef(e) : 0)
    , a = new TextEncoder().encode(Xd({
      format: `binary_little_endian`,
      vertexCount: i,
      includeDiagnostics: n
    }))
    , o = new ArrayBuffer(i * (n ? 21 : 15))
    , s = new DataView(o)
    , c = 0;
  for (let t of e.points)
    tf(t.xyz) && (c = Zd(s, c, t.xyz[0], t.xyz[1], t.xyz[2], t.rgb[0], t.rgb[1], t.rgb[2], n, t.error, t.track.length, 0));
  if (r)
    for (let t of e.poses)
      !t.registered || !tf(t.center) || (c = Zd(s, c, t.center[0], t.center[1], t.center[2], 255, 255, 255, n, 0, 0, 1));
  return new Blob([a, o], {
    type: `application/octet-stream`
  })
}
function Yd(e, t) {
  let n = t.includeDiagnostics ?? !1
    , r = t.includeCameraCenters ?? !1
    , i = [Xd({
      format: `ascii`,
      vertexCount: $d(e) + (r ? ef(e) : 0),
      includeDiagnostics: n
    })];
  for (let t of e.points)
    tf(t.xyz) && i.push(Qd(t.xyz[0], t.xyz[1], t.xyz[2], t.rgb[0], t.rgb[1], t.rgb[2], n, t.error, t.track.length, 0));
  if (r)
    for (let t of e.poses)
      !t.registered || !tf(t.center) || i.push(Qd(t.center[0], t.center[1], t.center[2], 255, 255, 255, n, 0, 0, 1));
  return new Blob(i, {
    type: `text/plain;charset=utf-8`
  })
}
function Xd(e) {
  let t = [`ply`, `format ${e.format} 1.0`, `comment Generated by WebSfM`, `comment Coordinates are in the reconstruction world frame`, `element vertex ${e.vertexCount}`, `property float x`, `property float y`, `property float z`, `property uchar red`, `property uchar green`, `property uchar blue`];
  return e.includeDiagnostics && t.push(`property float reprojection_error`, `property uchar track_length`, `property uchar kind`),
    t.push(`end_header`),
    `${t.join(`
`)}\n`
}
function Zd(e, t, n, r, i, a, o, s, c, l, u, d) {
  return e.setFloat32(t, nf(n), !0),
    t += 4,
    e.setFloat32(t, nf(r), !0),
    t += 4,
    e.setFloat32(t, nf(i), !0),
    t += 4,
    e.setUint8(t, rf(a)),
    t += 1,
    e.setUint8(t, rf(o)),
    t += 1,
    e.setUint8(t, rf(s)),
    t += 1,
    c && (e.setFloat32(t, nf(l), !0),
      t += 4,
      e.setUint8(t, rf(u)),
      t += 1,
      e.setUint8(t, rf(d)),
      t += 1),
    t
}
function Qd(e, t, n, r, i, a, o, s, c, l) {
  let u = [af(e), af(t), af(n), String(rf(r)), String(rf(i)), String(rf(a))];
  return o && u.push(af(s), String(rf(c)), String(rf(l))),
    `${u.join(` `)}\n`
}
function $d(e) {
  let t = 0;
  for (let n of e.points)
    tf(n.xyz) && t++;
  return t
}
function ef(e) {
  let t = 0;
  for (let n of e.poses)
    n.registered && tf(n.center) && t++;
  return t
}
function tf(e) {
  return Number.isFinite(e[0]) && Number.isFinite(e[1]) && Number.isFinite(e[2])
}
function nf(e) {
  return Number.isFinite(e) ? e : 0
}
function rf(e) {
  return Number.isFinite(e) ? Math.max(0, Math.min(255, e | 0)) : 0
}
function af(e) {
  return !Number.isFinite(e) || e === 0 ? `0` : Number(e).toPrecision(9).replace(/\.?0+($|e)/, `$1`)
}
function of(e, t = {}) {
  let n = t.imageResolution ?? `processed`
    , r = [`# Camera list with one line of data per camera:`, `#   CAMERA_ID, MODEL, WIDTH, HEIGHT, PARAMS[]`, `# Number of cameras: ${e.cameras.length}`];
  e.cameras.forEach((e, t) => {
    r.push(df(t + 1, lf(e, n)))
  }
  );
  let i = [`# Image list with two lines of data per image:`, `#   IMAGE_ID, QW, QX, QY, QZ, TX, TY, TZ, CAMERA_ID, IMAGE_NAME`, `#   POINTS2D[] as (X, Y, POINT3D_ID)`, `# Number of images: ${e.images.length}`];
  for (let r of e.images) {
    let [a, o] = uf(e, r.cameraId, n)
      , s = t.imageNameForImage?.(r) ?? r.name;
    i.push(`${r.id} ${r.qvec.map(L).join(` `)} ${r.tvec.map(L).join(` `)} ${r.cameraId} ${s}`),
      i.push(r.xys.map((e, t) => `${L(e[0] * a)} ${L(e[1] * o)} ${r.point3DIds[t]}`).join(` `))
  }
  let a = [`# 3D point list with one line of data per point:`, `#   POINT3D_ID, X, Y, Z, R, G, B, ERROR, TRACK[] as (IMAGE_ID, POINT2D_IDX)`, `# Number of points: ${e.points.length}`];
  for (let t of e.points)
    a.push(`${t.id} ${t.xyz.map(L).join(` `)} ${t.rgb.join(` `)} ${L(t.error)} ${t.track.map(e => `${e.imageId} ${e.point2DIdx}`).join(` `)}`);
  return {
    "cameras.txt": `${r.join(`
`)}\n`,
    "images.txt": `${i.join(`
`)}\n`,
    "points3D.txt": `${a.join(`
`)}\n`
  }
}
function sf(e, t = {}) {
  let n = new Map(e.poses.filter(e => e.registered).map(e => [e.imageId, e]))
    , r = [];
  for (let i of e.images) {
    let a = n.get(i.id)
      , o = e.cameras[i.cameraId - 1];
    if (!a || !o)
      continue;
    let s = cf(o, t.imageResolution ?? `original`)
      , c = {
        file_path: t.imagePathForImage?.(i) ?? `${t.imagePathPrefix ?? ``}${i.name}`,
        fl_x: mf(s.fx),
        fl_y: mf(s.fy),
        cx: mf(s.cx),
        cy: mf(s.cy),
        w: s.width,
        h: s.height,
        k1: mf(s.k1 ?? 0),
        k2: mf(s.k2 ?? 0),
        p1: mf(s.p1 ?? 0),
        p2: mf(s.p2 ?? 0),
        transform_matrix: pf(a)
      }
      , l = t.maskPathForImage?.(i);
    l && (c.mask_path = l),
      r.push(c)
  }
  let i = {
    camera_model: `OPENCV`,
    frames: r
  };
  return t.plyFilePath && (i.ply_file_path = t.plyFilePath),
    `${JSON.stringify(i, null, 2)}\n`
}
function cf(e, t) {
  if (t === `processed` || !e.nativeWidth || !e.nativeHeight)
    return e;
  let n = e.nativeWidth / Math.max(1, e.width)
    , r = e.nativeHeight / Math.max(1, e.height);
  return {
    width: e.nativeWidth,
    height: e.nativeHeight,
    fx: e.fx * n,
    fy: e.fy * r,
    cx: e.cx * n,
    cy: e.cy * r,
    k1: e.k1,
    k2: e.k2,
    p1: e.p1,
    p2: e.p2
  }
}
function lf(e, t) {
  if (t === `processed` || !e.nativeWidth || !e.nativeHeight)
    return e;
  let n = e.nativeWidth / Math.max(1, e.width)
    , r = e.nativeHeight / Math.max(1, e.height);
  return {
    ...e,
    width: e.nativeWidth,
    height: e.nativeHeight,
    fx: e.fx * n,
    fy: e.fy * r,
    cx: e.cx * n,
    cy: e.cy * r
  }
}
function uf(e, t, n) {
  if (n === `processed`)
    return [1, 1];
  let r = e.cameras[t - 1];
  return !r?.nativeWidth || !r.nativeHeight ? [1, 1] : [r.nativeWidth / Math.max(1, r.width), r.nativeHeight / Math.max(1, r.height)]
}
function df(e, t) {
  return ff(t) ? `${e} OPENCV ${t.width} ${t.height} ${L(t.fx)} ${L(t.fy)} ${L(t.cx)} ${L(t.cy)} ${L(t.k1 ?? 0)} ${L(t.k2 ?? 0)} ${L(t.p1 ?? 0)} ${L(t.p2 ?? 0)}` : `${e} PINHOLE ${t.width} ${t.height} ${L(t.fx)} ${L(t.fy)} ${L(t.cx)} ${L(t.cy)}`
}
function ff(e) {
  return Math.abs(e.k1 ?? 0) > 1e-12 || Math.abs(e.k2 ?? 0) > 1e-12 || Math.abs(e.p1 ?? 0) > 1e-12 || Math.abs(e.p2 ?? 0) > 1e-12
}
function pf(e) {
  let t = On(e.R)
    , n = e.center;
  return [[mf(t[0]), mf(-t[1]), mf(-t[2]), mf(n[0])], [mf(t[3]), mf(-t[4]), mf(-t[5]), mf(n[1])], [mf(t[6]), mf(-t[7]), mf(-t[8]), mf(n[2])], [0, 0, 0, 1]]
}
function mf(e) {
  return !Number.isFinite(e) || e === 0 ? 0 : Number(e.toPrecision(12))
}
async function hf(e, t, n, r, i, a, o, s, c) {
  let l = r - n === 1
    , u = l ? s.hammingMax : Math.max(32, s.hammingMax - 8)
    , d = l ? s.ratio : Math.max(.5, s.ratio - .02)
    , f = await Mi(t[n], t[r], o, u, d)
    , p = l ? jf(e[n], e[r], t[n], t[r], f) : f
    , m = await _e(e[n], e[r], t[n], t[r], p, i, 3, a, {
      solver: c
    });
  return {
    rawMatches: f.length,
    filtered: p,
    relative: m
  }
}
async function gf(e, t, n, r, i, a, o, s, c) {
  let l = Math.min(192, s.hammingMax + 16)
    , u = Math.min(.98, s.ratio + .04)
    , d = await Mi(t[n], t[r], a, l, u);
  if (d.length < o)
    return {
      rawMatches: d.length,
      filtered: d,
      relative: null
    };
  let f = await _e(e[n], e[r], t[n], t[r], d, 420, 3.8, i, {
    solver: c
  });
  return {
    rawMatches: d.length,
    filtered: d,
    relative: f,
    usedUnfiltered: !0
  }
}
async function _f(e, t, n, r, i, a, o, s, c) {
  let l = Math.min(192, s.hammingMax + 22)
    , u = Math.min(.98, s.ratio + .05)
    , d = await Mi(t[n], t[r], a, l, u);
  if (d.length < o)
    return {
      rawMatches: d.length,
      filtered: d,
      relative: null
    };
  let f = await _e(e[n], e[r], t[n], t[r], d, 480, 4, i, {
    solver: c
  });
  return {
    rawMatches: d.length,
    filtered: d,
    relative: f,
    usedUnfiltered: !0
  }
}
function vf(e) {
  return Math.max(e.filtered.length, e.relative?.inliers.length ?? 0, e.rawMatches)
}
function yf(e, t) {
  for (let n of t.observations)
    if (e[n.candidate.left].componentId === t.toComponent && e[n.candidate.right].componentId === t.fromComponent)
      return !0;
  return !1
}
function bf(e) {
  let t = null;
  for (let n of e.observations)
    (!t || n.relative.inliers.length > t.relative.inliers.length) && (t = n);
  return t
}
function xf(e) {
  let t = [];
  for (let n = 0; n < e.length; n++) {
    let r = e[n];
    if (!r.registered || r.componentId < 0)
      continue;
    let i = t[t.length - 1];
    i && i.componentId === r.componentId ? i.indices.push(n) : t.push({
      componentId: r.componentId,
      indices: [n]
    })
  }
  return t
}
function Sf(e, t) {
  return e.slice(Math.max(0, e.length - t))
}
function Cf(e, t) {
  return e.slice(0, t)
}
function wf(e) {
  let t = new Int16Array(256);
  return e.map(e => {
    let n = new Uint32Array(8);
    if (e.count === 0)
      return {
        words: n
      };
    let r = Math.min(384, e.count);
    t.fill(0);
    for (let n = 0; n < r; n++) {
      let r = n * 8;
      for (let n = 0; n < 8; n++) {
        let i = e.descriptors[r + n];
        for (let e = 0; e < 32; e++)
          t[n * 32 + e] += i & 1,
            i >>>= 1
      }
    }
    let i = r * .5;
    for (let e = 0; e < 256; e++)
      t[e] > i && (n[e >> 5] |= 1 << (e & 31));
    return {
      words: n
    }
  }
  )
}
function Tf(e, t, n, r, i, a, o) {
  let s = o === `component-exhaustive` ? xf(e).filter(e => e.componentId >= 0).map(e => e.indices) : Df(e)
    , c = []
    , l = new Set;
  for (let e = 0; e < s.length; e++) {
    let r = s[e];
    for (let a = e + 1; a < s.length; a++) {
      let e = s[a];
      for (let a of r)
        for (let r of e) {
          let e = Math.min(a, r)
            , s = Math.max(a, r)
            , u = s - e;
          if (u <= n)
            continue;
          let d = `${e}:${s}`;
          if (l.has(d))
            continue;
          l.add(d);
          let f = Of(t[e], t[s]);
          o !== `component-exhaustive` && f > i || c.push({
            left: e,
            right: s,
            signatureDistance: f,
            orderGap: u
          })
        }
    }
  }
  return c.sort((e, t) => {
    let n = e.signatureDistance - t.signatureDistance;
    return n === 0 ? e.orderGap - t.orderGap : n
  }
  ),
    Ef(c, e, a, r)
}
function Ef(e, t, n, r) {
  let i = new Map
    , a = [];
  for (let o of e) {
    let e = t[o.left].componentId
      , s = t[o.right].componentId;
    if (e < 0 || s < 0 || e === s)
      continue;
    let c = `${e}->${s}`
      , l = i.get(c) ?? 0;
    if (!(l >= n) && (i.set(c, l + 1),
      a.push(o),
      a.length >= r))
      break
  }
  return a
}
function Df(e) {
  return xf(e).filter(e => e.componentId >= 0).map(e => {
    let t = e.indices;
    if (t.length <= 5)
      return t;
    let n = new Set;
    return n.add(t[0]),
      n.add(t[Math.floor(t.length * .25)]),
      n.add(t[Math.floor(t.length * .5)]),
      n.add(t[Math.floor(t.length * .75)]),
      n.add(t[t.length - 1]),
      [...n].sort((e, t) => e - t)
  }
  )
}
function Of(e, t) {
  let n = 0;
  for (let r = 0; r < 8; r++)
    n += kf(e.words[r] ^ t.words[r]);
  return n
}
function kf(e) {
  return e >>>= 0,
    e -= e >>> 1 & 1431655765,
    e = (e & 858993459) + (e >>> 2 & 858993459),
    (e + (e >>> 4) & 252645135) * 16843009 >>> 24
}
function Af(e, t, n) {
  return Number.isFinite(e) ? Math.max(t, Math.min(n, e)) : t
}
function jf(e, t, n, r, i) {
  if (i.length < 12)
    return i;
  let a = i.map(i => r.xs[i.b] / t.width - n.xs[i.a] / e.width)
    , o = i.map(i => r.ys[i.b] / t.height - n.ys[i.a] / e.height)
    , s = $p(a)
    , c = $p(o)
    , l = i.map((e, t) => Math.hypot(a[t] - s, o[t] - c))
    , u = Math.max(.018, $p(l) * 2.8);
  return i.filter((e, t) => l[t] <= u)
}
function Mf(e, t, n, r, i, a, o, s) {
  return {
    leftImage: e[t].name,
    rightImage: e[n].name,
    leftIndex: t,
    rightIndex: n,
    gap: n - t,
    rawMatches: r,
    filteredMatches: i,
    inliers: a,
    status: o,
    note: s
  }
}
function Nf(e) {
  return e >= 45 ? `ok` : `weak`
}
function Pf(e) {
  return e >= 80 ? `strong registration` : e >= 45 ? `usable registration` : `weak registration, likely drift risk`
}
function Ff(e, t, n, r = 96) {
  let i = new Int32Array(t.length)
    , a = 0;
  for (let e = 0; e < t.length; e++)
    i[e] = a,
      a += t[e].count;
  let o = new tm(a)
    , s = new Uint8Array(a);
  for (let t of e) {
    let e = i[t.leftIndex]
      , r = i[t.rightIndex];
    if (!(!n[t.leftIndex].registered || !n[t.rightIndex].registered))
      for (let n of t.matches) {
        let t = e + n.a
          , i = r + n.b;
        s[t] = 1,
          s[i] = 1,
          o.union(t, i)
      }
  }
  let c = new Map;
  for (let e = 0; e < t.length; e++) {
    let r = i[e];
    for (let i = 0; i < t[e].count; i++) {
      let t = r + i;
      if (!n[e].registered || !s[t])
        continue;
      let a = o.find(t)
        , l = c.get(a);
      l || (l = [],
        c.set(a, l)),
        l.push({
          imageIndex: e,
          featureIndex: i
        })
    }
  }
  let l = [];
  for (let e of c.values())
    l.push(...Rf(e, t, r));
  return l
}
function If(e, t, n, r) {
  let i = 0;
  for (let a of t) {
    let t = new Map;
    for (let e of a.observations) {
      let i = r[e.imageIndex]
        , a = n[e.imageIndex];
      if (!i?.registered || i.componentId < 0 || !a || e.featureIndex < 0 || e.featureIndex >= a.count)
        continue;
      let o = t.get(i.componentId);
      o || (o = [],
        t.set(i.componentId, o)),
        o.push({
          imageIndex: e.imageIndex,
          featureIndex: e.featureIndex
        })
    }
    for (let r of t.values()) {
      let t = zf(r, n);
      if (t.length < 2)
        continue;
      let a = new Set(t.map(Lf))
        , o = e.findIndex(e => e.some(e => a.has(Lf(e))));
      if (o < 0) {
        e.push(t),
          i++;
        continue
      }
      let s = e[o].length;
      e[o] = zf([...e[o], ...t], n),
        e[o].length > s && i++
    }
  }
  return i
}
function Lf(e) {
  return `${e.imageIndex}:${e.featureIndex}`
}
function Rf(e, t, n) {
  if (e.length < 2)
    return [];
  if (!e.every(e => Vf(t, e))) {
    let n = zf(e, t);
    return n.length >= 2 ? [n] : []
  }
  let r = Math.max(0, Math.min(256, Math.round(n)))
    , i = [...e].sort(Uf)
    , a = []
    , o = [];
  for (let e of i) {
    let n = -1
      , i = 1 / 0;
    for (let a = 0; a < o.length; a++) {
      let s = Bi(t[e.imageIndex], e.featureIndex, t[o[a].imageIndex], o[a].featureIndex);
      s <= r && s < i && (i = s,
        n = a)
    }
    n < 0 ? (o.push(e),
      a.push([e])) : a[n].push(e)
  }
  let s = [];
  for (let e of a) {
    let n = Bf(e, t)
      , i = new Set(e.map(e => e.imageIndex)).size
      , a = new Map;
    for (let i of e) {
      let e = Bi(t[i.imageIndex], i.featureIndex, t[n.imageIndex], n.featureIndex);
      if (e > r)
        continue;
      let o = a.get(i.imageIndex);
      (!o || e < o.distance || e === o.distance && Hf(t, i) > Hf(t, o.obs)) && a.set(i.imageIndex, {
        obs: i,
        distance: e
      })
    }
    let o = Array.from(a.values(), e => e.obs).sort(Uf)
      , c = i >= 3 ? 3 : 2;
    o.length >= c && s.push(o)
  }
  return s.sort(Wf)
}
function zf(e, t) {
  let n = new Map;
  for (let r of e) {
    let e = n.get(r.imageIndex);
    (!e || Hf(t, r) > Hf(t, e)) && n.set(r.imageIndex, r)
  }
  return Array.from(n.values()).sort(Uf)
}
function Bf(e, t) {
  let n = e[0]
    , r = 1 / 0;
  for (let i of e) {
    let a = 0;
    for (let n of e)
      a += Bi(t[i.imageIndex], i.featureIndex, t[n.imageIndex], n.featureIndex);
    (a < r || a === r && Uf(i, n) < 0) && (n = i,
      r = a)
  }
  return n
}
function Vf(e, t) {
  let n = e[t.imageIndex];
  return !!n && t.featureIndex >= 0 && t.featureIndex < n.count && n.descriptors.length >= (t.featureIndex + 1) * 8
}
function Hf(e, t) {
  return e[t.imageIndex]?.scores[t.featureIndex] ?? -1 / 0
}
function Uf(e, t) {
  return e.imageIndex - t.imageIndex || e.featureIndex - t.featureIndex
}
function Wf(e, t) {
  let n = Uf(e[0], t[0]);
  return n === 0 ? e.length - t.length : n
}
function Gf(e, t, n, r, i, a, o) {
  let s = 0
    , c = i * i
    , l = n.map(e => new Uint8Array(e.count))
    , u = n.map((e, n) => qf(e, t[n], Math.max(4, i)));
  for (let t of e)
    for (let e of t)
      l[e.imageIndex][e.featureIndex] = 1;
  for (let i of e) {
    if (i.length < 2 || i.length >= 6)
      continue;
    let e = Jf(i, t, n, r, o);
    if (!e || e.error > 8)
      continue;
    let d = new Set(i.map(e => e.imageIndex))
      , f = i[Math.min(1, i.length - 1)];
    for (let o = 0; o < t.length; o++) {
      if (d.has(o) || !r[o].registered)
        continue;
      let p = ct(t[o], r[o].R, r[o].tvec, e.xyz);
      if (!Number.isFinite(p[0]) || p[2] <= 0 || p[0] < 16 || p[1] < 16 || p[0] > t[o].width - 16 || p[1] > t[o].height - 16)
        continue;
      let m = Kf(n[f.imageIndex], f.featureIndex, n[o], p[0], p[1], c, a, l[o], u[o]);
      m != null && (i.push({
        imageIndex: o,
        featureIndex: m
      }),
        l[o][m] = 1,
        d.add(o),
        s++)
    }
    i.sort((e, t) => e.imageIndex - t.imageIndex)
  }
  return s
}
function Kf(e, t, n, r, i, a, o, s, c) {
  let l = -1
    , u = 1 / 0
    , d = c => {
      if (s[c])
        return;
      let d = n.xs[c] - r
        , f = n.ys[c] - i
        , p = d * d + f * f;
      if (p > a)
        return;
      let m = Bi(e, t, n, c);
      if (m > o)
        return;
      let h = m + Math.sqrt(p) * 1.5;
      h < u && (u = h,
        l = c)
    }
    ;
  if (c) {
    let e = Math.sqrt(a)
      , t = Math.max(0, Math.floor((r - e) / c.cellSize))
      , n = Math.min(c.cols - 1, Math.floor((r + e) / c.cellSize))
      , o = Math.max(0, Math.floor((i - e) / c.cellSize))
      , s = Math.min(c.rows - 1, Math.floor((i + e) / c.cellSize));
    for (let e = o; e <= s; e++)
      for (let r = t; r <= n; r++) {
        let t = c.cells[e * c.cols + r];
        for (let e = 0; e < t.length; e++)
          d(t[e])
      }
  } else
    for (let e = 0; e < n.count; e++)
      d(e);
  return l >= 0 ? l : null
}
function qf(e, t, n) {
  let r = Math.max(1, Math.ceil(t.width / n))
    , i = Math.max(1, Math.ceil(t.height / n))
    , a = Array.from({
      length: r * i
    }, () => []);
  for (let t = 0; t < e.count; t++) {
    let o = Math.max(0, Math.min(r - 1, Math.floor(e.xs[t] / n)));
    a[Math.max(0, Math.min(i - 1, Math.floor(e.ys[t] / n))) * r + o].push(t)
  }
  return {
    cellSize: n,
    cols: r,
    rows: i,
    cells: a
  }
}
function Jf(e, t, n, r, i) {
  let a = new Int32Array(10)
    , o = new Int32Array(10)
    , s = new Float64Array(10)
    , c = 0;
  for (let t = 0; t < e.length - 1; t++)
    for (let n = t + 1; n < e.length; n++) {
      let i = r[e[t].imageIndex].center
        , l = r[e[n].imageIndex].center
        , u = Math.hypot(i[0] - l[0], i[1] - l[1], i[2] - l[2])
        , d = c < 10 ? c++ : -1;
      if (d < 0) {
        let e = 0;
        for (let t = 1; t < 10; t++)
          s[t] < s[e] && (e = t);
        if (u <= s[e])
          continue;
        d = e
      }
      a[d] = t,
        o[d] = n,
        s[d] = u
    }
  let l = null
    , u = [0, 0, 0];
  for (let s = 0; s < c; s++) {
    let c = e[a[s]]
      , d = e[o[s]]
      , f = t[c.imageIndex]
      , p = t[d.imageIndex]
      , m = n[c.imageIndex]
      , h = n[d.imageIndex]
      , g = r[c.imageIndex]
      , _ = r[d.imageIndex]
      , [v, y] = Zp(f, m.xs[c.featureIndex], m.ys[c.featureIndex])
      , [b, x] = Zp(p, h.xs[d.featureIndex], h.ys[d.featureIndex]);
    if (!it(u, g.R, g.tvec, _.R, _.tvec, v, y, b, x) || !Number.isFinite(u[0]) || Math.hypot(u[0], u[1], u[2]) > i || Wp(u, g.center, _.center) < .45)
      continue;
    let S = Qf(u, e, t, n, r);
    Number.isFinite(S) && (!l || S < l.error) && (l = {
      xyz: [u[0], u[1], u[2]],
      error: S
    })
  }
  return l
}
function Yf(e, t = 220) {
  let n = [];
  for (let t of e)
    t.registered && n.push(t.center);
  if (n.length < 2)
    return t;
  let r = [];
  for (let e = 0; e < n.length; e++)
    for (let t = e + 1; t < n.length; t++)
      r.push(Gp(n[e], n[t]));
  if (r.length === 0)
    return t;
  let i = Xf(r, r.length >> 1);
  return !Number.isFinite(i) || i <= 0 ? t : Math.max(t, i * 80)
}
function Xf(e, t) {
  let n = 0
    , r = e.length - 1;
  for (; n < r;) {
    let i = e[n + r >> 1]
      , a = n
      , o = r;
    for (; a <= o;) {
      for (; e[a] < i;)
        a++;
      for (; e[o] > i;)
        o--;
      if (a <= o) {
        let t = e[a];
        e[a] = e[o],
          e[o] = t,
          a++,
          o--
      }
    }
    if (t <= o)
      r = o;
    else if (t >= a)
      n = a;
    else
      return e[t]
  }
  return e[n]
}
function Zf(e, t, n, r, i, a) {
  let o = [e[0], e[1], e[2]]
    , s = new Float64Array(9)
    , c = new Float64Array(3)
    , l = new Float64Array(6)
    , u = new Float64Array(12)
    , d = [0, 0, 0];
  for (let e = 0; e < a; e++) {
    s.fill(0),
      c.fill(0);
    let e = 0;
    for (let a of t) {
      let t = n[a.imageIndex]
        , u = r[a.imageIndex]
        , d = i[a.imageIndex]
        , f = u.xs[a.featureIndex]
        , p = u.ys[a.featureIndex]
        , m = d.R
        , h = d.tvec
        , g = m[0] * o[0] + m[1] * o[1] + m[2] * o[2] + h[0]
        , _ = m[3] * o[0] + m[4] * o[1] + m[5] * o[2] + h[1]
        , v = m[6] * o[0] + m[7] * o[1] + m[8] * o[2] + h[2]
        , y = gt(t.intrinsics, g, _, v);
      if (!y)
        continue;
      for (let e = 0; e < 3; e++)
        l[e] = y.jpi[0] * m[e] + y.jpi[1] * m[3 + e] + y.jpi[2] * m[6 + e],
          l[3 + e] = y.jpi[3] * m[e] + y.jpi[4] * m[3 + e] + y.jpi[5] * m[6 + e];
      let b = f - y.u
        , x = p - y.v;
      for (let e = 0; e < 2; e++) {
        let t = e * 3
          , n = e === 0 ? b : x;
        for (let e = 0; e < 3; e++) {
          c[e] += l[t + e] * n;
          for (let n = 0; n < 3; n++)
            s[e * 3 + n] += l[t + e] * l[t + n]
        }
      }
      e += 2
    }
    if (e < 4 || (s[0] += .001,
      s[4] += .001,
      s[8] += .001,
      !em(s, c, u, d)))
      break;
    let a = Math.hypot(d[0], d[1], d[2]);
    if (!Number.isFinite(a) || a > 10 || (o = [o[0] + d[0], o[1] + d[1], o[2] + d[2]],
      a < 1e-5))
      break
  }
  return o
}
function Qf(e, t, n, r, i) {
  let a = 0
    , o = 0
    , s = [0, 0, 0];
  for (let c of t) {
    let t = n[c.imageIndex]
      , l = r[c.imageIndex]
      , u = i[c.imageIndex];
    if (!lt(s, t, u.R, u.tvec, e))
      return 1 / 0;
    a += Math.hypot(s[0] - l.xs[c.featureIndex], s[1] - l.ys[c.featureIndex]),
      o++
  }
  return o ? a / o : 1 / 0
}
function $f(e, t, n) {
  let r = new Float64Array(t);
  for (let t = 0; t < n; t++)
    for (let r = 0; r <= t; r++) {
      let i = e[t * n + r];
      for (let a = 0; a < r; a++)
        i -= e[t * n + a] * e[r * n + a];
      if (t === r) {
        if (!Number.isFinite(i) || i <= 1e-12)
          return null;
        e[t * n + r] = Math.sqrt(i)
      } else
        e[t * n + r] = i / e[r * n + r]
    }
  for (let t = 0; t < n; t++) {
    let i = r[t];
    for (let a = 0; a < t; a++)
      i -= e[t * n + a] * r[a];
    r[t] = i / e[t * n + t]
  }
  for (let t = n - 1; t >= 0; t--) {
    let i = r[t];
    for (let a = t + 1; a < n; a++)
      i -= e[a * n + t] * r[a];
    r[t] = i / e[t * n + t]
  }
  return r
}
function ep(e, t, n, r, i, a = 1.5, o, s = {}) {
  let c = new Int32Array(r.length).fill(-1)
    , l = 0
    , u = sp(r, o)
    , d = new Set;
  for (let e of u) {
    let t = r[e].componentId;
    t >= 0 && d.add(t)
  }
  let f = new Set
    , p = 0;
  for (let e = 0; e < r.length; e++) {
    if (!r[e].registered)
      continue;
    let t = r[e].componentId;
    if (!(t < 0)) {
      if (u.has(e)) {
        p++;
        continue
      }
      if (d.has(t)) {
        c[e] = l++;
        continue
      }
      if (!f.has(t)) {
        f.add(t),
          p++;
        continue
      }
      c[e] = l++
    }
  }
  let m = xp(t)
    , h = {
      outerIterations: 0,
      acceptedSteps: 0,
      errorBefore: 0,
      errorAfter: 0,
      huberBefore: 0,
      huberAfter: 0,
      optimisedCameras: l,
      anchoredCameras: p,
      intrinsicSteps: 0,
      distortionSteps: 0,
      optimisedIntrinsics: 0,
      focalScale: 1,
      radialK1: t[0]?.intrinsics.k1 ?? 0
    }
    , g = cp(e, r, c, m)
    , _ = s.reprojectionCostScorer ? fp(e, g, n, r.length) : null
    , v = _ ? s.reprojectionCostScorer?.createBundleReprojectionCostContext(_) ?? null : null
    , y = v ? mp(e.length, r.length) : null
    , b = s.normalEquationScorer ? pp(e, g, n, r.length, l) : null
    , x = b ? s.normalEquationScorer?.createBundleNormalEquationContext(b) ?? null : null
    , S = x ? mp(e.length, r.length) : null;
  if (e.length === 0)
    return h;
  let C = tp(t, s)
    , w = np(t, s);
  C && h.optimisedIntrinsics++,
    w && (h.optimisedIntrinsics++,
      h.radialK1 = w.k1);
  let T = bp(e, g, t, n, r, a, v, y);
  if (h.errorBefore = T.l2Rms,
    h.errorAfter = T.l2Rms,
    h.huberBefore = T.huberRms,
    h.huberAfter = T.huberRms,
    C) {
    let i = rp(e, g, t, n, r, a, C, v, y);
    i.accepted && (h.intrinsicSteps++,
      h.focalScale = C.scale,
      h.errorAfter = i.after.l2Rms,
      h.huberAfter = i.after.huberRms)
  }
  if (w) {
    let i = ap(e, g, t, n, r, a, w, v, y);
    i.accepted && (h.intrinsicSteps++,
      h.distortionSteps++,
      h.radialK1 = w.k1,
      h.errorAfter = i.after.l2Rms,
      h.huberAfter = i.after.huberRms)
  }
  if (l === 0)
    return h;
  let E = h.huberAfter
    , D = .001
    , O = l * 6
    , k = lp(l, e.length, g)
    , { U: A, bc: j, Vp: ee, bp: M, Wflat: N, S: te, rhs: ne, deltaPt: re, VinvByPoint: P, VinvValid: ie, Jpt: ae, Jcam: oe, savedR: se, savedT: ce, savedC: le, savedQ: ue, savedX: de } = k;
  for (let o = 0; o < i; o++) {
    h.outerIterations = o + 1;
    let i = vp(x, S, e, t, r, a, D, te, ne, P, ie);
    if (!i) {
      A.fill(0),
        j.fill(0),
        ee.fill(0),
        M.fill(0);
      for (let e of N)
        e.fill(0);
      if (!_p(x, S, e, t, r, a, A, j, ee, M, N))
        for (let i = 0; i < e.length; i++) {
          let o = g[i];
          if (o.length < 2)
            continue;
          let s = e[i]
            , c = N[i];
          for (let e = 0; e < o.length; e++) {
            let l = o.poseIndices[e]
              , u = o.camOpts[e]
              , d = o.point2DIdxs[e]
              , f = r[l]
              , p = t[l]
              , m = n[l]
              , h = s.xyz
              , g = f.R
              , _ = f.tvec
              , v = g[0] * h[0] + g[1] * h[1] + g[2] * h[2] + _[0]
              , y = g[3] * h[0] + g[4] * h[1] + g[5] * h[2] + _[1]
              , b = g[6] * h[0] + g[7] * h[1] + g[8] * h[2] + _[2]
              , x = gt(p.intrinsics, v, y, b);
            if (!x)
              continue;
            let S = m.xs[d] - x.u
              , C = m.ys[d] - x.v
              , w = x.jpi
              , T = Math.hypot(S, C)
              , E = T <= a ? 1 : a / T;
            for (let e = 0; e < 2; e++)
              for (let t = 0; t < 3; t++) {
                let n = 0;
                for (let r = 0; r < 3; r++)
                  n += w[e * 3 + r] * g[r * 3 + t];
                ae[e * 3 + t] = n
              }
            let D = i * 9
              , O = i * 3
              , k = E * S
              , N = E * C;
            for (let e = 0; e < 3; e++) {
              let t = ae[e]
                , n = ae[3 + e];
              M[O + e] += t * k + n * N;
              for (let r = 0; r < 3; r++)
                ee[D + e * 3 + r] += E * (t * ae[r] + n * ae[3 + r])
            }
            if (u < 0)
              continue;
            let te = v - _[0]
              , ne = y - _[1]
              , re = b - _[2]
              , P = [0, re, -ne, -re, 0, te, ne, -te, 0];
            for (let e = 0; e < 2; e++)
              for (let t = 0; t < 3; t++) {
                let n = 0;
                for (let r = 0; r < 3; r++)
                  n += w[e * 3 + r] * P[r * 3 + t];
                oe[e * 6 + t] = n,
                  oe[e * 6 + 3 + t] = w[e * 3 + t]
              }
            let ie = u * 36
              , se = u * 6;
            for (let e = 0; e < 6; e++) {
              let t = oe[e]
                , n = oe[6 + e];
              j[se + e] += t * k + n * N;
              for (let r = 0; r < 6; r++)
                A[ie + e * 6 + r] += E * (t * oe[r] + n * oe[6 + r])
            }
            let ce = e * 18;
            for (let e = 0; e < 6; e++)
              for (let t = 0; t < 3; t++)
                c[ce + e * 3 + t] = E * (oe[e] * ae[t] + oe[6 + e] * ae[3 + t])
          }
        }
      for (let e = 0; e < l; e++)
        for (let t = 0; t < 6; t++)
          A[e * 36 + t * 6 + t] += D;
      for (let t = 0; t < e.length; t++)
        for (let e = 0; e < 3; e++)
          ee[t * 9 + e * 3 + e] += D;
      te.fill(0),
        ne.fill(0);
      for (let e = 0; e < l; e++)
        for (let t = 0; t < 6; t++) {
          for (let n = 0; n < 6; n++)
            te[(e * 6 + t) * O + (e * 6 + n)] = A[e * 36 + t * 6 + n];
          ne[e * 6 + t] = j[e * 6 + t]
        }
      ie.fill(0);
      for (let t = 0; t < e.length; t++) {
        let e = g[t];
        if (e.length < 2)
          continue;
        let n = t * 9;
        if (!Sp(ee, t * 9, P, n))
          continue;
        ie[t] = 1;
        let r = N[t]
          , i = e.length
          , a = [P[n] * M[t * 3] + P[n + 1] * M[t * 3 + 1] + P[n + 2] * M[t * 3 + 2], P[n + 3] * M[t * 3] + P[n + 4] * M[t * 3 + 1] + P[n + 5] * M[t * 3 + 2], P[n + 6] * M[t * 3] + P[n + 7] * M[t * 3 + 1] + P[n + 8] * M[t * 3 + 2]];
        for (let t = 0; t < i; t++) {
          let n = e.camOpts[t];
          if (n < 0)
            continue;
          let i = t * 18;
          for (let e = 0; e < 6; e++)
            ne[n * 6 + e] -= r[i + e * 3] * a[0] + r[i + e * 3 + 1] * a[1] + r[i + e * 3 + 2] * a[2]
        }
        let o = k.ensureKScratch(i);
        for (let t = 0; t < i; t++) {
          if (e.camOpts[t] < 0)
            continue;
          let i = t * 18;
          for (let e = 0; e < 6; e++) {
            let t = r[i + e * 3]
              , a = r[i + e * 3 + 1]
              , s = r[i + e * 3 + 2];
            o[i + e * 3] = t * P[n] + a * P[n + 3] + s * P[n + 6],
              o[i + e * 3 + 1] = t * P[n + 1] + a * P[n + 4] + s * P[n + 7],
              o[i + e * 3 + 2] = t * P[n + 2] + a * P[n + 5] + s * P[n + 8]
          }
        }
        for (let t = 0; t < i; t++) {
          let n = e.camOpts[t];
          if (n < 0)
            continue;
          let a = t * 18;
          for (let t = 0; t < i; t++) {
            let i = e.camOpts[t];
            if (i < 0)
              continue;
            let s = t * 18;
            for (let e = 0; e < 6; e++) {
              let t = o[a + e * 3]
                , c = o[a + e * 3 + 1]
                , l = o[a + e * 3 + 2];
              for (let a = 0; a < 6; a++) {
                let o = t * r[s + a * 3] + c * r[s + a * 3 + 1] + l * r[s + a * 3 + 2];
                te[(n * 6 + e) * O + (i * 6 + a)] -= o
              }
            }
          }
        }
      }
    }
    let s = $f(te, ne, O);
    if (!s) {
      if (D *= 10,
        D > 1e6)
        break;
      continue
    }
    if (re.fill(0),
      i) {
      if (!yp(x, s, re)) {
        if (D *= 10,
          D > 1e6)
          break;
        continue
      }
    } else
      for (let t = 0; t < e.length; t++) {
        if (ie[t] === 0)
          continue;
        let e = t * 9
          , n = g[t]
          , r = N[t]
          , i = M[t * 3]
          , a = M[t * 3 + 1]
          , o = M[t * 3 + 2];
        for (let e = 0; e < n.length; e++) {
          let t = n.camOpts[e];
          if (t < 0)
            continue;
          let c = e * 18;
          for (let e = 0; e < 6; e++) {
            let n = s[t * 6 + e];
            i -= r[c + e * 3] * n,
              a -= r[c + e * 3 + 1] * n,
              o -= r[c + e * 3 + 2] * n
          }
        }
        re[t * 3] = P[e] * i + P[e + 1] * a + P[e + 2] * o,
          re[t * 3 + 1] = P[e + 3] * i + P[e + 4] * a + P[e + 5] * o,
          re[t * 3 + 2] = P[e + 6] * i + P[e + 7] * a + P[e + 8] * o
      }
    let u = Cp(s)
      , d = Cp(re);
    if (!Number.isFinite(u) || !Number.isFinite(d) || u > 1 || d > 5) {
      if (D *= 10,
        D > 1e6)
        break;
      continue
    }
    up(r, e, se, ce, le, ue, de);
    let f = [0, 0, 0];
    for (let e = 0; e < r.length; e++) {
      let t = c[e];
      if (t < 0)
        continue;
      f[0] = s[t * 6],
        f[1] = s[t * 6 + 1],
        f[2] = s[t * 6 + 2];
      let n = Nn(f)
        , i = r[e];
      i.R = Pn(I(n, i.R)),
        i.tvec[0] += s[t * 6 + 3],
        i.tvec[1] += s[t * 6 + 4],
        i.tvec[2] += s[t * 6 + 5];
      let a = tt(i.R, i.tvec);
      i.center[0] = a[0],
        i.center[1] = a[1],
        i.center[2] = a[2];
      let o = nt(i.R);
      i.qvec[0] = o[0],
        i.qvec[1] = o[1],
        i.qvec[2] = o[2],
        i.qvec[3] = o[3]
    }
    for (let t = 0; t < e.length; t++) {
      let n = e[t].xyz;
      n[0] += re[t * 3],
        n[1] += re[t * 3 + 1],
        n[2] += re[t * 3 + 2]
    }
    let p = bp(e, g, t, n, r, a, v, y);
    if (Number.isFinite(p.huberRms) && p.huberRms < E) {
      if (E = p.huberRms,
        h.errorAfter = p.l2Rms,
        h.huberAfter = p.huberRms,
        h.acceptedSteps++,
        D = Math.max(1e-7, D * .4),
        C) {
        let i = rp(e, g, t, n, r, a, C, v, y);
        i.accepted && (E = i.after.huberRms,
          h.errorAfter = i.after.l2Rms,
          h.huberAfter = i.after.huberRms,
          h.focalScale = C.scale,
          h.intrinsicSteps++)
      }
      if (w) {
        let i = ap(e, g, t, n, r, a, w, v, y);
        i.accepted && (E = i.after.huberRms,
          h.errorAfter = i.after.l2Rms,
          h.huberAfter = i.after.huberRms,
          h.radialK1 = w.k1,
          h.intrinsicSteps++,
          h.distortionSteps++)
      }
    } else if (dp(r, e, se, ce, le, ue, de),
      D *= 8,
      D > 1e6)
      break;
    if (u < 1e-6 && d < 1e-6)
      break
  }
  return h
}
function tp(e, t) {
  if (!t.refineSharedFocal || e.length === 0)
    return null;
  let n = new Float64Array(e.length)
    , r = new Float64Array(e.length);
  for (let t = 0; t < e.length; t++) {
    let i = e[t].intrinsics.fx
      , a = e[t].intrinsics.fy;
    if (!Number.isFinite(i) || !Number.isFinite(a) || i <= 1 || a <= 1)
      return null;
    n[t] = i,
      r[t] = a
  }
  let i = Af(t.focalScaleMin ?? .75, .5, 1)
    , a = Af(t.focalScaleMax ?? 1.35, 1, 2);
  return {
    baseFx: n,
    baseFy: r,
    scale: 1,
    minScale: i,
    maxScale: Math.max(a, i + 1e-6)
  }
}
function np(e, t) {
  if (!t.refineSharedRadialK1 || e.length === 0)
    return null;
  let n = 0;
  for (let t of e) {
    let e = t.intrinsics.k1 ?? 0;
    if (!Number.isFinite(e))
      return null;
    n += e
  }
  let r = Af(t.radialK1Min ?? -.75, -2, .25)
    , i = Af(t.radialK1Max ?? .75, -.25, 2)
    , a = {
      k1: Af(n / e.length, r, Math.max(i, r + 1e-6)),
      minK1: r,
      maxK1: Math.max(i, r + 1e-6)
    };
  return op(e, a.k1),
    a
}
function rp(e, t, n, r, i, a, o, s, c) {
  let l = bp(e, t, n, r, i, a, s, c);
  if (!Number.isFinite(l.huberRms))
    return {
      accepted: !1,
      before: l,
      after: l
    };
  let u = 0
    , d = 0
    , f = Math.max(1e-6, a);
  for (let a = 0; a < e.length; a++) {
    let o = t[a];
    if (o.length === 0)
      continue;
    let s = e[a].xyz;
    for (let e = 0; e < o.length; e++) {
      let t = o.poseIndices[e]
        , a = o.point2DIdxs[e]
        , c = i[t]
        , l = n[t]
        , p = r[t]
        , m = c.R[0] * s[0] + c.R[1] * s[1] + c.R[2] * s[2] + c.tvec[0]
        , h = c.R[3] * s[0] + c.R[4] * s[1] + c.R[5] * s[2] + c.tvec[1]
        , g = c.R[6] * s[0] + c.R[7] * s[1] + c.R[8] * s[2] + c.tvec[2]
        , _ = gt(l.intrinsics, m, h, g);
      if (!_)
        continue;
      let v = p.xs[a] - _.u
        , y = p.ys[a] - _.v
        , b = Math.hypot(v, y)
        , x = b <= f ? 1 : f / b
        , S = l.intrinsics.fx * _.xd
        , C = l.intrinsics.fy * _.yd;
      u += x * (S * S + C * C),
        d += S * x * v + C * x * y
    }
  }
  if (!Number.isFinite(u) || u < 1e-12 || !Number.isFinite(d))
    return {
      accepted: !1,
      before: l,
      after: l
    };
  let p = Af(d / u, -.12, .12);
  if (Math.abs(p) < 1e-8)
    return {
      accepted: !1,
      before: l,
      after: l
    };
  let m = Af(o.scale * (1 + p), o.minScale, o.maxScale);
  if (Math.abs(m - o.scale) < 1e-8)
    return {
      accepted: !1,
      before: l,
      after: l
    };
  let h = o.scale;
  ip(n, o, m);
  let g = bp(e, t, n, r, i, a, s, c);
  return Number.isFinite(g.huberRms) && g.huberRms < l.huberRms ? (o.scale = m,
  {
    accepted: !0,
    before: l,
    after: g
  }) : (ip(n, o, h),
  {
    accepted: !1,
    before: l,
    after: l
  })
}
function ip(e, t, n) {
  for (let r = 0; r < e.length; r++)
    e[r].intrinsics.fx = t.baseFx[r] * n,
      e[r].intrinsics.fy = t.baseFy[r] * n
}
function ap(e, t, n, r, i, a, o, s, c) {
  let l = bp(e, t, n, r, i, a, s, c);
  if (!Number.isFinite(l.huberRms))
    return {
      accepted: !1,
      before: l,
      after: l
    };
  let u = 0
    , d = 0
    , f = Math.max(1e-6, a);
  for (let a = 0; a < e.length; a++) {
    let o = t[a];
    if (o.length === 0)
      continue;
    let s = e[a].xyz;
    for (let e = 0; e < o.length; e++) {
      let t = o.poseIndices[e]
        , a = o.point2DIdxs[e]
        , c = i[t]
        , l = n[t]
        , p = r[t]
        , m = c.R[0] * s[0] + c.R[1] * s[1] + c.R[2] * s[2] + c.tvec[0]
        , h = c.R[3] * s[0] + c.R[4] * s[1] + c.R[5] * s[2] + c.tvec[1]
        , g = c.R[6] * s[0] + c.R[7] * s[1] + c.R[8] * s[2] + c.tvec[2]
        , _ = gt(l.intrinsics, m, h, g);
      if (!_ || g <= 1e-6)
        continue;
      let v = m / g
        , y = h / g
        , b = v * v + y * y
        , x = l.intrinsics.fx * v * b
        , S = l.intrinsics.fy * y * b
        , C = p.xs[a] - _.u
        , w = p.ys[a] - _.v
        , T = Math.hypot(C, w)
        , E = T <= f ? 1 : f / T;
      u += E * (x * x + S * S),
        d += x * E * C + S * E * w
    }
  }
  if (!Number.isFinite(u) || u < 1e-12 || !Number.isFinite(d))
    return {
      accepted: !1,
      before: l,
      after: l
    };
  let p = Af(d / u, -.25, .25);
  if (Math.abs(p) < 1e-10)
    return {
      accepted: !1,
      before: l,
      after: l
    };
  let m = Af(o.k1 + p, o.minK1, o.maxK1);
  if (Math.abs(m - o.k1) < 1e-10)
    return {
      accepted: !1,
      before: l,
      after: l
    };
  let h = o.k1;
  op(n, m);
  let g = bp(e, t, n, r, i, a, s, c);
  return Number.isFinite(g.huberRms) && g.huberRms < l.huberRms ? (o.k1 = m,
  {
    accepted: !0,
    before: l,
    after: g
  }) : (op(n, h),
  {
    accepted: !1,
    before: l,
    after: l
  })
}
function op(e, t) {
  for (let n of e)
    n.intrinsics.k1 = t
}
function sp(e, t) {
  let n = new Set;
  if (!t || t.length === 0)
    return n;
  for (let r of t) {
    let t = e.findIndex(e => e.imageId === r);
    if (t < 0)
      continue;
    let i = e[t];
    !i.registered || i.componentId < 0 || n.add(t)
  }
  return n
}
function cp(e, t, n, r) {
  return e.map(e => {
    let i = 0;
    for (let n of e.track) {
      let e = r.get(n.imageId);
      e === void 0 || e < 0 || e >= t.length || !t[e].registered || i++
    }
    let a = new Int32Array(i)
      , o = new Int32Array(i)
      , s = new Int32Array(i)
      , c = 0;
    for (let i of e.track) {
      let e = r.get(i.imageId);
      e === void 0 || e < 0 || e >= t.length || !t[e].registered || (a[c] = e,
        o[c] = n[e],
        s[c] = i.point2DIdx,
        c++)
    }
    return {
      poseIndices: a,
      camOpts: o,
      point2DIdxs: s,
      length: i
    }
  }
  )
}
function lp(e, t, n) {
  let r = e * 6
    , i = new Float64Array;
  return {
    U: new Float64Array(e * 36),
    bc: new Float64Array(e * 6),
    Vp: new Float64Array(t * 9),
    bp: new Float64Array(t * 3),
    Wflat: n.map(e => new Float64Array(e.length * 18)),
    VinvByPoint: new Float64Array(t * 9),
    VinvValid: new Uint8Array(t),
    S: new Float64Array(r * r),
    rhs: new Float64Array(r),
    deltaPt: new Float64Array(t * 3),
    Jpt: new Float64Array(6),
    Jcam: new Float64Array(12),
    savedR: [],
    savedT: [],
    savedC: [],
    savedQ: [],
    savedX: Array.from({
      length: t
    }, () => [0, 0, 0]),
    ensureKScratch(e) {
      let t = e * 18;
      return i.length < t && (i = new Float64Array(Math.max(t, i.length * 2))),
        i
    }
  }
}
function up(e, t, n, r, i, a, o) {
  for (; n.length < e.length;)
    n.push([1, 0, 0, 0, 1, 0, 0, 0, 1]);
  for (; r.length < e.length;)
    r.push([0, 0, 0]);
  for (; i.length < e.length;)
    i.push([0, 0, 0]);
  for (; a.length < e.length;)
    a.push([1, 0, 0, 0]);
  for (let t = 0; t < e.length; t++) {
    let o = e[t].R
      , s = e[t].tvec
      , c = e[t].center
      , l = e[t].qvec
      , u = n[t];
    for (let e = 0; e < 9; e++)
      u[e] = o[e];
    r[t][0] = s[0],
      r[t][1] = s[1],
      r[t][2] = s[2],
      i[t][0] = c[0],
      i[t][1] = c[1],
      i[t][2] = c[2],
      a[t][0] = l[0],
      a[t][1] = l[1],
      a[t][2] = l[2],
      a[t][3] = l[3]
  }
  for (; o.length < t.length;)
    o.push([0, 0, 0]);
  for (let e = 0; e < t.length; e++) {
    let n = t[e].xyz;
    o[e][0] = n[0],
      o[e][1] = n[1],
      o[e][2] = n[2]
  }
}
function dp(e, t, n, r, i, a, o) {
  for (let t = 0; t < e.length; t++) {
    let o = e[t]
      , s = o.R
      , c = n[t];
    for (let e = 0; e < 9; e++)
      s[e] = c[e];
    o.tvec[0] = r[t][0],
      o.tvec[1] = r[t][1],
      o.tvec[2] = r[t][2],
      o.center[0] = i[t][0],
      o.center[1] = i[t][1],
      o.center[2] = i[t][2],
      o.qvec[0] = a[t][0],
      o.qvec[1] = a[t][1],
      o.qvec[2] = a[t][2],
      o.qvec[3] = a[t][3]
  }
  for (let e = 0; e < t.length; e++) {
    let n = t[e].xyz;
    n[0] = o[e][0],
      n[1] = o[e][1],
      n[2] = o[e][2]
  }
}
function fp(e, t, n, r) {
  let i = 0;
  for (let e of t)
    i += e.length;
  if (e.length === 0 || r === 0 || i === 0)
    return null;
  let a = new Int32Array(i * 2)
    , o = new Float64Array(i * 2)
    , s = 0;
  for (let e = 0; e < t.length; e++) {
    let r = t[e];
    for (let t = 0; t < r.length; t++) {
      let i = r.poseIndices[t]
        , c = r.point2DIdxs[t]
        , l = n[i];
      if (!l || c < 0 || c >= l.xs.length || c >= l.ys.length)
        return null;
      a[s * 2] = e,
        a[s * 2 + 1] = i,
        o[s * 2] = l.xs[c],
        o[s * 2 + 1] = l.ys[c],
        s++
    }
  }
  return {
    pointCount: e.length,
    poseCount: r,
    observations: a,
    measurements: o,
    observationCount: i
  }
}
function pp(e, t, n, r, i) {
  let a = 0
    , o = 0;
  for (let e of t)
    e.length >= 2 && (a += e.length),
      o += e.length * 18;
  if (e.length === 0 || r === 0 || i === 0 || a === 0 || o === 0)
    return null;
  let s = new Int32Array(a * 4)
    , c = new Float64Array(a * 2)
    , l = new Int32Array(e.length * 2)
    , u = 0
    , d = 0;
  for (let e = 0; e < t.length; e++) {
    let r = t[e];
    if (r.length >= 2) {
      l[e * 2] = u,
        l[e * 2 + 1] = r.length;
      for (let t = 0; t < r.length; t++) {
        let i = r.poseIndices[t]
          , a = r.point2DIdxs[t]
          , o = n[i];
        if (!o || a < 0 || a >= o.xs.length || a >= o.ys.length)
          return null;
        s[u * 4] = e,
          s[u * 4 + 1] = i,
          s[u * 4 + 2] = r.camOpts[t],
          s[u * 4 + 3] = d + t * 18,
          c[u * 2] = o.xs[a],
          c[u * 2 + 1] = o.ys[a],
          u++
      }
    }
    d += r.length * 18
  }
  return {
    pointCount: e.length,
    poseCount: r,
    cameraCount: i,
    observations: s,
    pointObservationRanges: l,
    measurements: c,
    observationCount: a,
    wBlockCount: o
  }
}
function mp(e, t) {
  return {
    points: new Float64Array(e * 3),
    poses: new Float64Array(t * 12),
    intrinsics: new Float64Array(t * 8)
  }
}
function hp(e, t, n, r) {
  if (e.points.length < t.length * 3 || e.poses.length < r.length * 12 || e.intrinsics.length < r.length * 8)
    return !1;
  for (let n = 0; n < t.length; n++) {
    let r = t[n].xyz
      , i = n * 3;
    e.points[i] = r[0],
      e.points[i + 1] = r[1],
      e.points[i + 2] = r[2]
  }
  for (let t = 0; t < r.length; t++) {
    let i = r[t]
      , a = t * 12;
    e.poses.set([i.R[0], i.R[1], i.R[2], i.R[3], i.R[4], i.R[5], i.R[6], i.R[7], i.R[8], i.tvec[0], i.tvec[1], i.tvec[2]], a);
    let o = n[t]?.intrinsics;
    if (!o)
      return !1;
    let s = t * 8;
    e.intrinsics.set([o.fx, o.fy, o.cx, o.cy, o.k1 ?? 0, o.k2 ?? 0, o.p1 ?? 0, o.p2 ?? 0], s)
  }
  return !0
}
function gp(e, t, n, r, i, a) {
  if (!e || !t || !hp(t, n, r, i))
    return null;
  let o = e.score(t.points, t.poses, t.intrinsics, a);
  return !o || o.count <= 0 || !Number.isFinite(o.l2Sum) || !Number.isFinite(o.huberSum) ? null : {
    l2Rms: Math.sqrt(o.l2Sum / o.count),
    huberRms: Math.sqrt(o.huberSum / o.count),
    count: o.count
  }
}
function _p(e, t, n, r, i, a, o, s, c, l, u) {
  return !e || !t || !hp(t, n, r, i) ? !1 : e.accumulate(t.points, t.poses, t.intrinsics, a, o, s, c, l, u)
}
function vp(e, t, n, r, i, a, o, s, c, l, u) {
  return !e?.accumulateToSchur || !t || !hp(t, n, r, i) ? !1 : e.accumulateToSchur(t.points, t.poses, t.intrinsics, a, o, s, c, l, u)
}
function yp(e, t, n) {
  return e?.backSubstitute?.(t, n) ?? !1
}
function bp(e, t, n, r, i, a, o, s) {
  let c = gp(o, s, e, n, i, a);
  if (c)
    return c;
  let l = 0
    , u = 0
    , d = 0
    , f = Math.max(1e-6, a)
    , p = f * f;
  for (let a = 0; a < e.length; a++) {
    let o = t[a];
    if (o.length === 0)
      continue;
    let s = e[a].xyz;
    for (let e = 0; e < o.length; e++) {
      let t = o.poseIndices[e]
        , a = o.point2DIdxs[e]
        , c = i[t]
        , m = n[t]
        , h = r[t]
        , g = c.R[0] * s[0] + c.R[1] * s[1] + c.R[2] * s[2] + c.tvec[0]
        , _ = c.R[3] * s[0] + c.R[4] * s[1] + c.R[5] * s[2] + c.tvec[1]
        , v = c.R[6] * s[0] + c.R[7] * s[1] + c.R[8] * s[2] + c.tvec[2]
        , y = gt(m.intrinsics, g, _, v);
      if (!y)
        continue;
      let b = h.xs[a] - y.u
        , x = h.ys[a] - y.v
        , S = b * b + x * x;
      l += S,
        u += S <= p ? S : 2 * f * Math.sqrt(S) - p,
        d++
    }
  }
  return d === 0 ? {
    l2Rms: 1 / 0,
    huberRms: 1 / 0,
    count: 0
  } : {
    l2Rms: Math.sqrt(l / d),
    huberRms: Math.sqrt(u / d),
    count: d
  }
}
function xp(e) {
  let t = new Map;
  for (let n = 0; n < e.length; n++)
    t.set(e[n].id, n);
  return t
}
function Sp(e, t, n, r) {
  let i = e[t]
    , a = e[t + 1]
    , o = e[t + 2]
    , s = e[t + 3]
    , c = e[t + 4]
    , l = e[t + 5]
    , u = e[t + 6]
    , d = e[t + 7]
    , f = e[t + 8]
    , p = i * (c * f - l * d) - a * (s * f - l * u) + o * (s * d - c * u);
  if (!Number.isFinite(p) || Math.abs(p) < 1e-15)
    return !1;
  let m = 1 / p;
  return n[r] = (c * f - l * d) * m,
    n[r + 1] = (o * d - a * f) * m,
    n[r + 2] = (a * l - o * c) * m,
    n[r + 3] = (l * u - s * f) * m,
    n[r + 4] = (i * f - o * u) * m,
    n[r + 5] = (o * s - i * l) * m,
    n[r + 6] = (s * d - c * u) * m,
    n[r + 7] = (a * u - i * d) * m,
    n[r + 8] = (i * c - a * s) * m,
    !0
}
function Cp(e) {
  let t = 0;
  for (let n = 0; n < e.length; n++)
    t += e[n] * e[n];
  return Math.sqrt(t)
}
function wp(e, t, n, r, i, a, o) {
  let s = Vp(Bp(r), [-i[0], -i[1], -i[2]]);
  return {
    leftIndex: e,
    rightIndex: t,
    direction: Kp(Vp(Bp(n), s)),
    distance: Number.isFinite(a) && a > .001 ? a : Math.max(.35, t - e),
    weight: Math.min(4, Math.max(.5, o / 80))
  }
}
function Tp(e, t, n, r, i, a, o) {
  if (n < 0 || r < 0 || n === r)
    return 0;
  let s = e[i]
    , c = e[a];
  if (!s.registered || !c.registered || c.componentId !== n)
    return 0;
  let l = Ue(s.R, s.tvec, o.R, o.t)
    , u = I(Bp(l.R), c.R)
    , d = Vp(u, c.center)
    , f = [l.center[0] - d[0], l.center[1] - d[1], l.center[2] - d[2]]
    , p = Bp(u)
    , m = new Set
    , h = 0;
  for (let t = 0; t < e.length; t++) {
    let i = e[t];
    !i.registered || i.componentId !== n || (i.center = qp(Vp(u, i.center), f),
      i.R = Pn(I(i.R, p)),
      i.tvec = zp(i.R, i.center),
      i.qvec = nt(i.R),
      i.componentId = r,
      m.add(t),
      h++)
  }
  if (h > 0)
    for (let [e, n] of t) {
      let r = e.indexOf(`:`);
      if (r <= 0)
        continue;
      let i = Number(e.substring(0, r));
      if (!m.has(i))
        continue;
      let a = Vp(u, n);
      t.set(e, [a[0] + f[0], a[1] + f[1], a[2] + f[2]])
    }
  return h
}
function Ep(e, t, n, r) {
  let i = []
    , a = [];
  for (let o of r) {
    let r = e.get(`${t}:${o.a}`)
      , s = e.get(`${n}:${o.b}`);
    !r || !s || (i.push(s),
      a.push(r))
  }
  return {
    src: i,
    dst: a
  }
}
function Dp(e, t) {
  let n = Ge(e, t, {
    iterations: 256,
    minInlierRatio: e.length <= 6 ? .5 : .6,
    inlierResidualScale: .05
  });
  return n ? {
    sim3: n.sim3,
    inliers: n.inliers.length,
    total: e.length,
    medianResidual: n.medianResidualInliers,
    destinationScale: n.destinationScale
  } : null
}
function Op(e, t, n, r, i) {
  if (n < 0 || r < 0 || n === r)
    return 0;
  let a = new Set;
  for (let t = 0; t < e.length; t++)
    e[t].registered && e[t].componentId === n && a.add(t);
  if (a.size === 0)
    return 0;
  let o = Bp(i.R)
    , s = 0;
  for (let t of a) {
    let n = e[t]
      , a = Pn(I(n.R, o))
      , c = Vp(I(n.R, o), i.t);
    n.R = a,
      n.tvec = [i.scale * n.tvec[0] - c[0], i.scale * n.tvec[1] - c[1], i.scale * n.tvec[2] - c[2]],
      n.center = tt(n.R, n.tvec),
      n.qvec = nt(n.R),
      n.componentId = r,
      s++
  }
  for (let [e, n] of t) {
    let r = e.indexOf(`:`);
    if (r <= 0)
      continue;
    let o = Number(e.substring(0, r));
    if (!a.has(o))
      continue;
    let s = Vp(i.R, n);
    t.set(e, [i.scale * s[0] + i.t[0], i.scale * s[1] + i.t[1], i.scale * s[2] + i.t[2]])
  }
  return s
}
function kp(e, t, n, r, i, a, o) {
  let s = Ep(t, i, a, o.inliers);
  if (s.src.length >= 4) {
    let i = Dp(s.src, s.dst);
    if (i) {
      let a = Op(e, t, n, r, i.sim3);
      if (a > 0)
        return {
          moved: a,
          method: `sim3`,
          correspondences: i.inliers
        }
    }
    return {
      moved: 0,
      method: `none`,
      correspondences: s.src.length,
      reason: `sim3 RANSAC rejected`
    }
  }
  let c = Mp(e, n);
  if (!(c <= 2 && o.inliers.length >= 80 && s.src.length === 0))
    return {
      moved: 0,
      method: `none`,
      correspondences: s.src.length,
      reason: `unit-scale fallback gated for ${c} camera component`
    };
  let l = Tp(e, t, n, r, i, a, o);
  return {
    moved: l,
    method: l > 0 ? `se3` : `none`,
    correspondences: s.src.length
  }
}
function Ap(e, t, n) {
  let r = []
    , i = [];
  for (let e of n.observations)
    for (let t = 0; t < e.src.length; t++)
      r.push(e.src[t]),
        i.push(e.dst[t]);
  if (r.length >= 4) {
    let a = Dp(r, i);
    if (a) {
      let r = Op(e, t, n.fromComponent, n.toComponent, a.sim3);
      if (r > 0)
        return {
          moved: r,
          method: `sim3`,
          correspondences: a.inliers
        }
    }
    let o = jp(e, t, n);
    return o.moved > 0 ? {
      ...o,
      reason: `aggregated sim3 rejected; used strongest pair (${o.correspondences} points)`
    } : {
      moved: 0,
      method: `none`,
      correspondences: r.length,
      reason: `aggregated sim3 RANSAC rejected; ${o.reason ?? `single-pair fallback failed`}`
    }
  }
  let a = bf(n);
  if (!(Mp(e, n.fromComponent) <= 2 && n.inliers >= 120 && r.length === 0 && a !== null) || !a)
    return {
      moved: 0,
      method: `none`,
      correspondences: r.length,
      reason: `aggregated sim3 needs more shared points (${r.length})`
    };
  let o = Tp(e, t, n.fromComponent, n.toComponent, a.candidate.left, a.candidate.right, a.relative);
  return {
    moved: o,
    method: o > 0 ? `se3` : `none`,
    correspondences: r.length
  }
}
function jp(e, t, n) {
  let r = [...n.observations].sort((e, t) => {
    let n = t.src.length - e.src.length;
    return n === 0 ? t.relative.inliers.length - e.relative.inliers.length : n
  }
  )
    , i = null;
  for (let a of r) {
    if (e[a.candidate.left].componentId !== n.toComponent || e[a.candidate.right].componentId !== n.fromComponent)
      continue;
    let r = kp(e, t, n.fromComponent, n.toComponent, a.candidate.left, a.candidate.right, a.relative);
    if (r.moved > 0)
      return r;
    (!i || r.correspondences > i.correspondences) && (i = r)
  }
  return i ?? {
    moved: 0,
    method: `none`,
    correspondences: 0,
    reason: `no valid single-pair fallback`
  }
}
function Mp(e, t) {
  let n = 0;
  for (let r of e)
    r.registered && r.componentId === t && n++;
  return n
}
function Np(e, t, n, r) {
  let i = [];
  for (let a of n) {
    let n = e.get(`${t}:${a.a}`);
    n && i.push({
      X: n,
      u: r.xs[a.b],
      v: r.ys[a.b]
    })
  }
  i.length > 256 && (i.length = 256);
  let a = [];
  for (let e of i) {
    let t = !1;
    for (let n of a) {
      let r = n.X[0] - e.X[0]
        , i = n.X[1] - e.X[1]
        , a = n.X[2] - e.X[2];
      if (r * r + i * i + a * a < 1e-10) {
        t = !0;
        break
      }
    }
    t || a.push(e)
  }
  return a
}
function Pp(e, t, n, r) {
  let i = [];
  for (let a of n) {
    let n = ct(r, e, t, a.X);
    !Number.isFinite(n[0]) || n[2] <= 0 || i.push(Math.hypot(n[0] - a.u, n[1] - a.v))
  }
  return i.length < Math.max(2, n.length * .6) ? !1 : Xf(i, i.length >> 1) < 8
}
function Fp(e, t, n, r, i, a, o, s) {
  let c = o[t].R
    , l = o[t].tvec
    , u = o[n].R
    , d = o[n].tvec
    , f = a[t]
    , p = a[n]
    , m = i[t]
    , h = i[n]
    , g = Ip(r, f, p, s);
  for (let r of g) {
    let i = `${t}:${r.a}`
      , a = `${n}:${r.b}`;
    if (e.has(i) && e.has(a))
      continue;
    let [o, s] = Zp(m, f.xs[r.a], f.ys[r.a])
      , [g, _] = Zp(h, p.xs[r.b], p.ys[r.b])
      , v = rt(c, l, u, d, o, s, g, _);
    if (!v)
      continue;
    let y = Math.hypot(v[0], v[1], v[2]);
    !Number.isFinite(y) || y > 500 || (e.has(i) || e.set(i, v),
      e.has(a) || e.set(a, v))
  }
}
function Ip(e, t, n, r) {
  return Bs(e, t, n, r)
}
function Lp(e, t, n) {
  let r = t.filter(t => {
    let n = e[t.leftIndex]
      , r = e[t.rightIndex];
    return n.registered && r.registered && n.componentId >= 0 && n.componentId === r.componentId
  }
  );
  if (r.length === 0)
    return {
      cameras: 0,
      edges: 0
    };
  let i = new Uint8Array(e.length)
    , a = new Set;
  for (let t = 0; t < e.length; t++) {
    let n = e[t];
    !n.registered || n.componentId < 0 || a.has(n.componentId) || (a.add(n.componentId),
      i[t] = 1)
  }
  let o = e.map(e => [e.center[0], e.center[1], e.center[2]])
    , s = new Set;
  for (let t = 0; t < n; t++) {
    let t = o.map(() => [0, 0, 0])
      , n = new Float64Array(o.length);
    for (let e of r) {
      let r = o[e.leftIndex]
        , a = o[e.rightIndex]
        , s = Jp(a, qp(r, Yp(e.direction, e.distance)))
        , c = Math.min(.006, .0012 * e.weight);
      i[e.leftIndex] || (t[e.leftIndex] = qp(t[e.leftIndex], Yp(s, c)),
        n[e.leftIndex] += c),
        i[e.rightIndex] || (t[e.rightIndex] = qp(t[e.rightIndex], Yp(s, -c)),
          n[e.rightIndex] += c)
    }
    let a = 0;
    for (let r = 0; r < o.length; r++) {
      if (!e[r].registered || i[r] || n[r] === 0)
        continue;
      let c = t[r]
        , l = Math.hypot(c[0], c[1], c[2]);
      !Number.isFinite(l) || l > .25 || (o[r] = qp(o[r], c),
        l > 1e-5 && s.add(r),
        a = Math.max(a, l))
    }
    if (a < 1e-4)
      break
  }
  for (let t = 0; t < e.length; t++)
    !e[t].registered || i[t] || (e[t].center = o[t],
      e[t].tvec = zp(e[t].R, o[t]));
  return {
    cameras: s.size,
    edges: r.length
  }
}
function Rp(e, t) {
  let n = 0;
  for (let r of t) {
    let t = e[r.leftIndex]
      , i = e[r.rightIndex];
    if (!t.registered || !i.registered)
      continue;
    let a = Jp(i.center, t.center)
      , o = Math.hypot(a[0], a[1], a[2]);
    !Number.isFinite(o) || o <= 1e-6 || (r.direction = [a[0] / o, a[1] / o, a[2] / o],
      r.distance = o,
      n++)
  }
  return n
}
function zp(e, t) {
  let n = Vp(e, t);
  return [-n[0], -n[1], -n[2]]
}
function Bp(e) {
  return [e[0], e[3], e[6], e[1], e[4], e[7], e[2], e[5], e[8]]
}
function Vp(e, t) {
  return [e[0] * t[0] + e[1] * t[1] + e[2] * t[2], e[3] * t[0] + e[4] * t[1] + e[5] * t[2], e[6] * t[0] + e[7] * t[1] + e[8] * t[2]]
}
function Hp(e, t) {
  if (e.length < 32)
    return {
      points: e,
      removed: 0
    };
  let n = [];
  for (let r of e) {
    let e = Up(r.xyz, t);
    Number.isFinite(e) && n.push(e)
  }
  if (n.length < 32)
    return {
      points: e,
      removed: 0
    };
  let r = Xf(n, n.length >> 1)
    , i = Xf(n, Math.min(n.length - 1, Math.floor(n.length * .95)))
    , a = Math.max(r * 2.5, Math.min(i, r * 7))
    , o = e.filter(e => Up(e.xyz, t) <= a);
  return {
    points: o,
    removed: e.length - o.length
  }
}
function Up(e, t) {
  let n = 1 / 0;
  for (let r of t) {
    if (!r.registered)
      continue;
    let t = Math.hypot(e[0] - r.center[0], e[1] - r.center[1], e[2] - r.center[2]);
    t < n && (n = t)
  }
  return n
}
function Wp(e, t, n) {
  let r = e[0] - t[0]
    , i = e[1] - t[1]
    , a = e[2] - t[2]
    , o = e[0] - n[0]
    , s = e[1] - n[1]
    , c = e[2] - n[2]
    , l = Math.hypot(r, i, a)
    , u = Math.hypot(o, s, c);
  if (l <= 1e-9 || u <= 1e-9)
    return 0;
  let d = Math.max(-1, Math.min(1, (r * o + i * s + a * c) / (l * u)));
  return Math.acos(d) * 180 / Math.PI
}
function Gp(e, t) {
  return Math.hypot(e[0] - t[0], e[1] - t[1], e[2] - t[2])
}
function Kp(e) {
  let t = Math.hypot(e[0], e[1], e[2]) || 1;
  return [e[0] / t, e[1] / t, e[2] / t]
}
function qp(e, t) {
  return [e[0] + t[0], e[1] + t[1], e[2] + t[2]]
}
function Jp(e, t) {
  return [e[0] - t[0], e[1] - t[1], e[2] - t[2]]
}
function Yp(e, t) {
  return [e[0] * t, e[1] * t, e[2] * t]
}
function Xp(e) {
  let t = new Map;
  for (let n of e)
    for (let e of n.track)
      t.set(`${e.imageId}:${e.point2DIdx}`, n.id);
  return t
}
function Zp(e, t, n) {
  return ft(e.intrinsics, t, n)
}
function Qp(e, t) {
  let n = t * 3;
  return [e.colors[n], e.colors[n + 1], e.colors[n + 2]]
}
function $p(e) {
  if (e.length === 0)
    return 0;
  let t = e.filter(Number.isFinite);
  return t.length === 0 ? 0 : Xf(t, t.length >> 1)
}
function L(e) {
  if (!Number.isFinite(e) || e === 0)
    return `0`;
  if (Math.abs(e) >= 0x2386f26fc10000)
    return e.toString();
  let t = e.toFixed(8);
  return t.includes(`.`) ? t.replace(/\.?0+$/, ``) : t
}
function em(e, t, n, r) {
  n[0] = e[0],
    n[1] = e[1],
    n[2] = e[2],
    n[3] = t[0],
    n[4] = e[3],
    n[5] = e[4],
    n[6] = e[5],
    n[7] = t[1],
    n[8] = e[6],
    n[9] = e[7],
    n[10] = e[8],
    n[11] = t[2];
  for (let e = 0; e < 3; e++) {
    let t = e;
    for (let r = e + 1; r < 3; r++)
      Math.abs(n[r * 4 + e]) > Math.abs(n[t * 4 + e]) && (t = r);
    if (Math.abs(n[t * 4 + e]) < 1e-12)
      return !1;
    if (t !== e)
      for (let r = e; r < 4; r++) {
        let i = n[e * 4 + r];
        n[e * 4 + r] = n[t * 4 + r],
          n[t * 4 + r] = i
      }
    let r = n[e * 4 + e];
    for (let t = e; t < 4; t++)
      n[e * 4 + t] /= r;
    for (let t = 0; t < 3; t++) {
      if (t === e)
        continue;
      let r = n[t * 4 + e];
      for (let i = e; i < 4; i++)
        n[t * 4 + i] -= r * n[e * 4 + i]
    }
  }
  return r[0] = n[3],
    r[1] = n[7],
    r[2] = n[11],
    !0
}
var tm = class {
  parent;
  rank;
  constructor(e) {
    this.parent = new Int32Array(e),
      this.rank = new Uint8Array(e);
    for (let t = 0; t < e; t++)
      this.parent[t] = t
  }
  find(e) {
    let t = e;
    for (; this.parent[t] !== t;)
      t = this.parent[t];
    for (; this.parent[e] !== e;) {
      let n = this.parent[e];
      this.parent[e] = t,
        e = n
    }
    return t
  }
  union(e, t) {
    let n = this.find(e)
      , r = this.find(t);
    if (n !== r) {
      if (this.rank[n] < this.rank[r]) {
        let e = n;
        n = r,
          r = e
      }
      this.parent[r] = n,
        this.rank[n] === this.rank[r] && this.rank[n]++
    }
  }
}
  ;
function nm(e) {
  let t = new Map;
  for (let n = 0; n < e.poses.length; n++) {
    let r = e.poses[n];
    if (!r.registered || r.componentId < 0)
      continue;
    let i = t.get(r.componentId);
    i || (i = {
      id: r.componentId,
      poseIndices: [],
      imageIds: [],
      imageNames: [],
      pointIds: [],
      registeredImages: 0
    },
      t.set(r.componentId, i)),
      i.poseIndices.push(n),
      i.imageIds.push(r.imageId),
      i.imageNames.push(r.name),
      i.registeredImages += 1
  }
  for (let n of e.points) {
    let r = rm(e, n);
    r !== null && t.get(r)?.pointIds.push(n.id)
  }
  return Array.from(t.values()).sort((e, t) => e.poseIndices[0] - t.poseIndices[0] || e.id - t.id).map((e, t) => ({
    ...e,
    index: t,
    label: `Component ${t + 1}`,
    points: e.pointIds.length
  }))
}
function rm(e, t) {
  let n = cm(e)
    , r = null;
  for (let e of t.track) {
    let t = n.get(e.imageId);
    if (!(!t || !t.registered || t.componentId < 0)) {
      if (r === null)
        r = t.componentId;
      else if (r !== t.componentId)
        return null
    }
  }
  return r
}
function im(e, t) {
  let n = new Set(e.poses.filter(e => e.registered && e.componentId === t).map(e => e.imageId))
    , r = e.points.filter(n => rm(e, n) === t).map(e => ({
      ...e,
      track: e.track.filter(e => n.has(e.imageId))
    })).filter(e => e.track.length > 0)
    , i = new Set(r.map(e => e.id))
    , a = e.images.filter(e => n.has(e.id))
    , o = []
    , s = new Map;
  for (let t of a) {
    if (s.has(t.cameraId))
      continue;
    let n = e.cameras[t.cameraId - 1];
    n && (s.set(t.cameraId, o.length + 1),
      o.push({
        ...n
      }))
  }
  let c = a.map(e => ({
    ...e,
    cameraId: s.get(e.cameraId) ?? e.cameraId,
    xys: e.xys.map(e => [e[0], e[1]]),
    point3DIds: e.point3DIds.map(e => i.has(e) ? e : -1)
  }))
    , l = e.poses.filter(e => e.registered && e.componentId === t).map(e => ({
      ...e,
      center: [...e.center],
      tvec: [...e.tvec],
      R: [...e.R],
      qvec: [...e.qvec]
    }))
    , u = r.map(e => ({
      ...e,
      xyz: [...e.xyz],
      rgb: [...e.rgb],
      track: e.track.map(e => ({
        ...e
      }))
    }));
  return {
    cameras: o,
    poses: l,
    points: u,
    images: c,
    stats: {
      ...e.stats,
      registeredImages: l.length,
      medianReprojectionError: lm(u.map(e => e.error)),
      meanTrackLength: u.length > 0 ? u.reduce((e, t) => e + t.track.length, 0) / u.length : 0,
      longTracks: u.filter(e => e.track.length >= 3).length
    }
  }
}
function am(e, t) {
  if (typeof t == `number`)
    return [im(e, t)];
  let n = nm(e);
  return n.length === 0 ? [e] : [...n].sort((e, t) => t.registeredImages - e.registeredImages || t.points - e.points || e.index - t.index).map(t => im(e, t.id))
}
function om(e, t) {
  return typeof t == `number` ? im(e, t) : e
}
function sm(e, t) {
  if (typeof t == `number`)
    return im(e, t);
  let n = nm(e);
  if (n.length <= 1)
    return e;
  let r = [...n].sort((e, t) => t.registeredImages - e.registeredImages || t.points - e.points || e.index - t.index)[0];
  return im(e, r.id)
}
function cm(e) {
  return new Map(e.poses.map(e => [e.imageId, e]))
}
function lm(e) {
  let t = e.filter(Number.isFinite).sort((e, t) => e - t);
  return t.length === 0 ? 0 : t[Math.floor((t.length - 1) / 2)]
}
var um = 512 * 1024
  , dm = Math.hypot(36, 24)
  , fm = [137, 80, 78, 71, 13, 10, 26, 10];
async function pm(e, t, n) {
  return _m(e) ? hm(await e.slice(0, Math.min(e.size, um)).arrayBuffer(), t, n) : null
}
async function mm(e) {
  let t = _m(e)
    , n = vm(e);
  if (!t && !n)
    return null;
  let r = await e.slice(0, Math.min(e.size, um)).arrayBuffer()
    , i = new Uint8Array(r);
  return ym(i) ? gm(r) : bm(i) ? Cm(r) : t ? gm(r) : n ? Cm(r) : null
}
function hm(e, t, n) {
  let r = Sm(e);
  return r ? Mm(r, t, n) : null
}
function gm(e) {
  let t = Sm(e)?.orientation;
  return xm(t) ? t : null
}
function _m(e) {
  let t = e.type.toLowerCase();
  if (t.includes(`jpeg`) || t.includes(`jpg`))
    return !0;
  let n = `name` in e && typeof e.name == `string` ? e.name.toLowerCase() : ``;
  return n.endsWith(`.jpg`) || n.endsWith(`.jpeg`)
}
function vm(e) {
  return e.type.toLowerCase().includes(`png`) ? !0 : (`name` in e && typeof e.name == `string` ? e.name.toLowerCase() : ``).endsWith(`.png`)
}
function ym(e) {
  return e.length >= 2 && e[0] === 255 && e[1] === 216
}
function bm(e) {
  return e.length < fm.length ? !1 : fm.every((t, n) => e[n] === t)
}
function xm(e) {
  return e !== void 0 && Number.isInteger(e) && e >= 1 && e <= 8
}
function Sm(e) {
  let t = new Uint8Array(e);
  if (!ym(t))
    return null;
  let n = 2;
  for (; n + 4 <= t.length;) {
    if (t[n] !== 255)
      return null;
    for (; n < t.length && t[n] === 255;)
      n++;
    if (n >= t.length)
      return null;
    let e = t[n++];
    if (e === 218 || e === 217)
      break;
    if (e >= 208 && e <= 215)
      continue;
    if (n + 2 > t.length)
      return null;
    let r = t[n] << 8 | t[n + 1];
    if (n += 2,
      r < 2 || n + r - 2 > t.length)
      return null;
    let i = n
      , a = r - 2;
    if (e === 225 && a >= 14 && Em(t, i))
      return Dm(t, i + 6, a - 6);
    n += a
  }
  return null
}
function Cm(e) {
  let t = new Uint8Array(e);
  if (!bm(t))
    return null;
  let n = fm.length;
  for (; n + 12 <= t.length;) {
    let e = Tm(t, n)
      , r = n + 4
      , i = n + 8
      , a = i + e;
    if (a + 4 > t.length)
      return null;
    if (wm(t, r, `eXIf`)) {
      let n = Dm(t, i, e)?.orientation;
      return xm(n) ? n : null
    }
    if (wm(t, r, `IEND`))
      return null;
    n = a + 4
  }
  return null
}
function wm(e, t, n) {
  return e[t] === n.charCodeAt(0) && e[t + 1] === n.charCodeAt(1) && e[t + 2] === n.charCodeAt(2) && e[t + 3] === n.charCodeAt(3)
}
function Tm(e, t) {
  return (e[t] ?? 0) * 16777216 + ((e[t + 1] ?? 0) << 16) + ((e[t + 2] ?? 0) << 8) + (e[t + 3] ?? 0)
}
function Em(e, t) {
  return e[t] === 69 && e[t + 1] === 120 && e[t + 2] === 105 && e[t + 3] === 102 && e[t + 4] === 0 && e[t + 5] === 0
}
function Dm(e, t, n) {
  if (n < 8)
    return null;
  let r = e[t] === 73 && e[t + 1] === 73
    , i = e[t] === 77 && e[t + 1] === 77;
  if (!r && !i)
    return null;
  let a = new DataView(e.buffer, e.byteOffset + t, n)
    , o = e => e >= 0 && e + 2 <= n ? a.getUint16(e, r) : null
    , s = e => e >= 0 && e + 4 <= n ? a.getUint32(e, r) : null;
  if (o(2) !== 42)
    return null;
  let c = s(4);
  if (c === null)
    return null;
  let l = Om(a, n, c, r)
    , u = jm(l.get(34665))
    , d = u ? Om(a, n, u, r) : new Map;
  return {
    orientation: jm(l.get(274)),
    focalLengthMm: jm(d.get(37386)),
    focalLength35mm: jm(d.get(41989)),
    focalPlaneXResolution: jm(d.get(41486)),
    focalPlaneYResolution: jm(d.get(41487)),
    focalPlaneResolutionUnit: jm(d.get(41488))
  }
}
function Om(e, t, n, r) {
  let i = new Map;
  if (n < 0 || n + 2 > t)
    return i;
  let a = e.getUint16(n, r)
    , o = n + 2;
  if (o + a * 12 > t)
    return i;
  for (let n = 0; n < a; n++) {
    let a = o + n * 12
      , s = e.getUint16(a, r)
      , c = e.getUint16(a + 2, r)
      , l = e.getUint32(a + 4, r)
      , u = km(e, t, a + 8, c, l, r);
    u.length > 0 && i.set(s, u)
  }
  return i
}
function km(e, t, n, r, i, a) {
  let o = Am(r);
  if (!o || i <= 0 || i > 16)
    return [];
  let s = o * i
    , c = s <= 4 ? n : e.getUint32(n, a);
  if (c < 0 || c + s > t)
    return [];
  let l = [];
  for (let t = 0; t < i; t++) {
    let n = c + t * o;
    if (r === 3)
      l.push(e.getUint16(n, a));
    else if (r === 4)
      l.push(e.getUint32(n, a));
    else if (r === 5) {
      let t = e.getUint32(n, a)
        , r = e.getUint32(n + 4, a);
      r !== 0 && l.push(t / r)
    } else if (r === 9)
      l.push(e.getInt32(n, a));
    else if (r === 10) {
      let t = e.getInt32(n, a)
        , r = e.getInt32(n + 4, a);
      r !== 0 && l.push(t / r)
    }
  }
  return l.filter(Number.isFinite)
}
function Am(e) {
  switch (e) {
    case 3:
      return 2;
    case 4:
    case 9:
      return 4;
    case 5:
    case 10:
      return 8;
    default:
      return 0
  }
}
function jm(e) {
  let t = e?.[0];
  return typeof t == `number` && Number.isFinite(t) && t > 0 ? t : void 0
}
function Mm(e, t, n) {
  let r = e.focalLengthMm
    , i = Nm(e);
  if (r && i) {
    let t = r * i;
    if (Number.isFinite(t) && t > 0)
      return {
        nativeFocal: t,
        focalLengthMm: r,
        focalLength35mm: e.focalLength35mm,
        source: `EXIF ${Fm(r)}mm + focal-plane ${t.toFixed(0)} px`
      }
  }
  if (e.focalLength35mm) {
    let i = Math.hypot(t, n)
      , a = e.focalLength35mm * i / dm;
    if (Number.isFinite(a) && a > 0)
      return {
        nativeFocal: a,
        focalLengthMm: r,
        focalLength35mm: e.focalLength35mm,
        source: `EXIF 35mm-equiv ${Fm(e.focalLength35mm)}mm`
      }
  }
  return null
}
function Nm(e) {
  let t = e.focalPlaneResolutionUnit;
  if (!t)
    return null;
  let n = Pm(t);
  if (!n)
    return null;
  let r = [e.focalPlaneXResolution, e.focalPlaneYResolution].filter(e => typeof e == `number` && Number.isFinite(e) && e > 0).map(e => e * n);
  return r.length === 0 ? null : r.reduce((e, t) => e + t, 0) / r.length
}
function Pm(e) {
  switch (e) {
    case 2:
      return 1 / 25.4;
    case 3:
      return 1 / 10;
    case 4:
      return 1;
    case 5:
      return 1e3;
    default:
      return 0
  }
}
function Fm(e) {
  return Number.isInteger(e) ? e.toFixed(0) : e.toFixed(1)
}
var Im = new TextEncoder
  , Lm = 4294967295
  , Rm = 65535
  , zm = null;
async function Bm(e) {
  if (e.length > Rm)
    throw Error(`ZIP64 is not supported: ${e.length} entries exceeds the ZIP32 limit of ${Rm}`);
  let t = []
    , n = new Set
    , r = 0;
  for (let i of e) {
    let e = Vm(i.path);
    if (n.has(e))
      throw Error(`Duplicate zip entry path: ${e}`);
    if (n.add(e),
      i.data instanceof Blob && i.data.size > Lm)
      throw Error(`ZIP64 is not supported: entry '${e}' is larger than 4 GiB`);
    let a = await Hm(i.data)
      , o = Im.encode(e);
    if (o.byteLength > Rm)
      throw Error(`ZIP entry path is too long: ${e}`);
    if (a.byteLength > Lm)
      throw Error(`ZIP64 is not supported: entry '${e}' is larger than 4 GiB`);
    let s = r + 30 + o.byteLength + a.byteLength;
    if (r > Lm || s > Lm)
      throw Error(`ZIP64 is not supported: archive local data exceeds the ZIP32 4 GiB limit`);
    let { dosTime: c, dosDate: l } = qm(i.lastModified === void 0 ? new Date : new Date(i.lastModified));
    t.push({
      path: e,
      nameBytes: o,
      data: a,
      crc32: Jm(a),
      dosTime: c,
      dosDate: l,
      localHeaderOffset: r
    }),
      r = s
  }
  let i = r
    , a = [];
  for (let e of t)
    a.push(Um(Wm(e)), Um(e.data));
  for (let e of t) {
    let t = Gm(e);
    a.push(Um(t)),
      r += t.byteLength
  }
  let o = r - i;
  if (o > Lm || i > Lm || r > Lm)
    throw Error(`ZIP64 is not supported: central directory exceeds ZIP32 limits`);
  return a.push(Um(Km(t.length, o, i))),
    new Blob(a, {
      type: `application/zip`
    })
}
function Vm(e) {
  let t = e.replace(/\\/g, `/`).replace(/^\/+/, ``).replace(/\/{2,}/g, `/`);
  if (!t || t.endsWith(`/`) || t.split(`/`).some(e => e === `..`))
    throw Error(`Invalid zip entry path: ${e}`);
  return t
}
async function Hm(e) {
  return typeof e == `string` ? Im.encode(e) : e instanceof Uint8Array ? e : new Uint8Array(await e.arrayBuffer())
}
function Um(e) {
  return e
}
function Wm(e) {
  let t = new Uint8Array(30 + e.nameBytes.byteLength)
    , n = new DataView(t.buffer);
  return n.setUint32(0, 67324752, !0),
    n.setUint16(4, 20, !0),
    n.setUint16(6, 2048, !0),
    n.setUint16(8, 0, !0),
    n.setUint16(10, e.dosTime, !0),
    n.setUint16(12, e.dosDate, !0),
    n.setUint32(14, e.crc32, !0),
    n.setUint32(18, e.data.byteLength, !0),
    n.setUint32(22, e.data.byteLength, !0),
    n.setUint16(26, e.nameBytes.byteLength, !0),
    n.setUint16(28, 0, !0),
    t.set(e.nameBytes, 30),
    t
}
function Gm(e) {
  let t = new Uint8Array(46 + e.nameBytes.byteLength)
    , n = new DataView(t.buffer);
  return n.setUint32(0, 33639248, !0),
    n.setUint16(4, 20, !0),
    n.setUint16(6, 20, !0),
    n.setUint16(8, 2048, !0),
    n.setUint16(10, 0, !0),
    n.setUint16(12, e.dosTime, !0),
    n.setUint16(14, e.dosDate, !0),
    n.setUint32(16, e.crc32, !0),
    n.setUint32(20, e.data.byteLength, !0),
    n.setUint32(24, e.data.byteLength, !0),
    n.setUint16(28, e.nameBytes.byteLength, !0),
    n.setUint16(30, 0, !0),
    n.setUint16(32, 0, !0),
    n.setUint16(34, 0, !0),
    n.setUint16(36, 0, !0),
    n.setUint32(38, 0, !0),
    n.setUint32(42, e.localHeaderOffset, !0),
    t.set(e.nameBytes, 46),
    t
}
function Km(e, t, n) {
  let r = new Uint8Array(22)
    , i = new DataView(r.buffer);
  return i.setUint32(0, 101010256, !0),
    i.setUint16(4, 0, !0),
    i.setUint16(6, 0, !0),
    i.setUint16(8, e, !0),
    i.setUint16(10, e, !0),
    i.setUint32(12, t, !0),
    i.setUint32(16, n, !0),
    i.setUint16(20, 0, !0),
    r
}
function qm(e) {
  let t = Math.max(1980, Math.min(2107, e.getFullYear()));
  return {
    dosTime: e.getHours() << 11 | e.getMinutes() << 5 | Math.floor(e.getSeconds() / 2),
    dosDate: t - 1980 << 9 | e.getMonth() + 1 << 5 | e.getDate()
  }
}
function Jm(e) {
  let t = zm ??= Ym()
    , n = 4294967295;
  for (let r of e)
    n = t[(n ^ r) & 255] ^ n >>> 8;
  return (n ^ 4294967295) >>> 0
}
function Ym() {
  let e = new Uint32Array(256);
  for (let t = 0; t < e.length; t++) {
    let n = t;
    for (let e = 0; e < 8; e++)
      n = n & 1 ? 3988292384 ^ n >>> 1 : n >>> 1;
    e[t] = n >>> 0
  }
  return e
}
var Xm = `init.ply`;
async function Zm(e, t, n = {}) {
  let r = sm(e, n.componentScope)
    , i = $m(t, n.masks)
    , a = new Map
    , o = new Map
    , s = []
    , c = n.encodeMaskPng ?? rh;
  for (let e of r.images) {
    let t = i.get(e.name)?.shift();
    if (!t)
      throw Error(`Original image file is unavailable for '${e.name}'`);
    let n = t.file
      , r = await eh(n)
      , l = `images/${String(e.id).padStart(4, `0`)}_ ${r.pathSegment}`;
    if (a.set(e.id, l),
      s.push({
        path: l,
        data: r.data,
        lastModified: n.lastModified
      }),
      t.mask) {
      let r = ls(l);
      o.set(e.id, r),
        s.push({
          path: r,
          data: await c(t.mask, n),
          lastModified: n.lastModified
        })
    }
  }
  let l = sf(r, {
    plyFilePath: Xm,
    imageResolution: `original`,
    imagePathForImage: e => a.get(e.id) ?? e.name,
    maskPathForImage: e => o.get(e.id)
  });
  return s.unshift({
    path: Xm,
    data: qd(r, {
      binary: !0
    })
  }),
    s.unshift({
      path: `transforms.json`,
      data: l
    }),
    Bm(s)
}
async function Qm(e, t, n = {}) {
  let r = $m(t, n.masks)
    , i = n.encodeMaskPng ?? rh
    , a = am(e, n.componentScope)
    , o = []
    , s = new Map
    , c = a.flatMap(e => e.images);
  for (let e of c) {
    let t = r.get(e.name)?.shift();
    if (!t)
      throw Error(`Original image file is unavailable for '${e.name}'`);
    let n = t.file
      , a = await eh(n);
    s.set(e.id, a.pathSegment);
    let c = `images/${a.pathSegment}`;
    o.push({
      path: c,
      data: a.data,
      lastModified: n.lastModified
    }),
      t.mask && o.push({
        path: ls(c),
        data: await i(t.mask, n),
        lastModified: n.lastModified
      })
  }
  for (let e = 0; e < a.length; e++) {
    let t = of(a[e], {
      imageResolution: `original`,
      imageNameForImage: e => s.get(e.id) ?? e.name
    });
    o.push({
      path: `sparse/${e}/cameras.txt`,
      data: t[`cameras.txt`]
    }, {
      path: `sparse/${e}/images.txt`,
      data: t[`images.txt`]
    }, {
      path: `sparse/${e}/points3D.txt`,
      data: t[`points3D.txt`]
    })
  }
  return Bm(o)
}
function $m(e, t) {
  let n = new Map;
  for (let r = 0; r < e.length; r++) {
    let i = e[r]
      , a = Xr(t?.[r]) ? t[r] : null
      , o = n.get(i.name)
      , s = {
        file: i,
        mask: a
      };
    o ? o.push(s) : n.set(i.name, [s])
  }
  return n
}
async function eh(e) {
  let t = ch(e.name)
    , n = await mm(e);
  return !n || n === 1 ? {
    data: e,
    pathSegment: t
  } : {
    data: await th(e),
    pathSegment: lh(t)
  }
}
async function th(e) {
  if (typeof createImageBitmap != `function`)
    throw Error(`Cannot normalize EXIF-oriented image '${e.name}': createImageBitmap is unavailable`);
  let t = await createImageBitmap(e, {
    imageOrientation: `from-image`
  });
  try {
    return nh(t)
  } finally {
    t.close()
  }
}
async function nh(e) {
  let t = ah(e.width, e.height)
    , n = t.getContext(`2d`);
  if (!n)
    throw Error(`Could not create image export canvas`);
  return n.drawImage(e, 0, 0),
    sh(t, `image/jpeg`, .95)
}
async function rh(e, t) {
  let { width: n, height: r } = await ih(t, e)
    , i = ah(n, r)
    , a = i.getContext(`2d`);
  if (!a)
    throw Error(`Could not create mask export canvas`);
  let o = a.createImageData(n, r)
    , s = e.width / Math.max(1, n)
    , c = e.height / Math.max(1, r);
  for (let t = 0; t < r; t++) {
    let r = Math.min(e.height - 1, Math.floor((t + .5) * c)) * e.width;
    for (let i = 0; i < n; i++) {
      let a = Math.min(e.width - 1, Math.floor((i + .5) * s))
        , c = e.data[r + a] === 0 ? 255 : 0
        , l = (t * n + i) * 4;
      o.data[l] = c,
        o.data[l + 1] = c,
        o.data[l + 2] = c,
        o.data[l + 3] = c
    }
  }
  return a.putImageData(o, 0, 0),
    oh(i)
}
async function ih(e, t) {
  if (typeof createImageBitmap == `function`)
    try {
      let t = await createImageBitmap(e, {
        imageOrientation: `from-image`
      })
        , n = {
          width: t.width,
          height: t.height
        };
      return t.close(),
        n
    } catch { }
  return t
}
function ah(e, t) {
  if (typeof document < `u`) {
    let n = document.createElement(`canvas`);
    return n.width = e,
      n.height = t,
      n
  }
  if (typeof OffscreenCanvas < `u`)
    return new OffscreenCanvas(e, t);
  throw Error(`Mask export requires canvas support`)
}
async function oh(e) {
  return sh(e, `image/png`)
}
async function sh(e, t, n) {
  return `convertToBlob` in e ? e.convertToBlob({
    type: t,
    quality: n
  }) : new Promise((r, i) => {
    e.toBlob(e => {
      e ? r(e) : i(Error(`Could not encode ${t} canvas blob`))
    }
      , t, n)
  }
  )
}
function ch(e) {
  return e.replace(/[\\/]/g, `_`).replace(/[\u0000-\u001f\u007f]/g, `_`).trim() || `image`
}
function lh(e) {
  if (/\.jpe?g$/i.test(e))
    return e;
  let t = e.lastIndexOf(`.`);
  return t > 0 ? `${e.slice(0, t)}.jpg` : `${e}.jpg`
}
var uh = `Default project`;
function dh(e) {
  return `${e.path || e.name}\0${e.name}\0${e.size}\0${e.lastModified || 0}`
}
function fh(e = `${Date.now()}:${Math.random()}`) {
  return `project-${gh(e)}`
}
function ph(e) {
  return `asset-${gh(e)}`
}
function mh(e, t) {
  return `project-asset-${gh(`${e}\0${t}`)}`
}
async function hh(e) {
  let t = await e.listProjects();
  if (t.length > 0) {
    let n = await e.getActiveProjectId();
    return (n ? await e.getProject(n) : null) ?? t[0] ?? null
  }
  let n = await e.getLatestSourceAssetProject();
  if (!n || n.assets.length === 0)
    return null;
  let r = fh(`legacy:${n.projectId}:${n.updatedAt ?? 0}`)
    , i = await e.getSourceAssetMaskProject(n.projectId)
    , a = new Map((i?.masks ?? []).filter(e => _h(e.mask)).map(e => [e.identity, e.mask]))
    , o = []
    , s = [];
  for (let t = 0; t < n.assets.length; t += 1) {
    let c = n.assets[t]
      , l = dh({
        path: c.path,
        name: c.name,
        size: c.size,
        lastModified: c.lastModified || 0
      })
      , u = ph(l)
      , d = mh(r, l);
    await e.putProjectAsset({
      assetId: u,
      ...c.path ? {
        path: c.path
      } : {},
      name: c.name,
      type: c.type,
      size: c.size,
      lastModified: c.lastModified,
      origin: c.origin,
      blob: c.blob,
      createdAt: n.createdAt
    }),
      o.push({
        projectAssetId: d,
        assetId: u,
        selected: c.selected,
        order: t
      });
    let f = a.get(l);
    f && s.push({
      projectId: r,
      projectAssetId: d,
      mask: Ur(f),
      updatedAt: i?.updatedAt ?? n.updatedAt
    })
  }
  let c = {
    projectId: r,
    name: uh,
    assetRefs: o,
    createdAt: n.createdAt,
    updatedAt: n.updatedAt
  };
  return await e.putProject(c),
    await e.putProjectAssetMasks(r, s),
    await e.setActiveProjectId(r),
    await e.getProject(r) ?? c
}
function gh(e) {
  let t = 2166136261;
  for (let n = 0; n < e.length; n += 1)
    t ^= e.charCodeAt(n),
      t = Math.imul(t, 16777619);
  return (t >>> 0).toString(16).padStart(8, `0`)
}
function _h(e) {
  if (typeof e != `object` || !e)
    return !1;
  let t = e;
  return Number.isInteger(t.width) && Number.isInteger(t.height) && t.width > 0 && t.height > 0 && t.data instanceof Uint8Array && t.data.length === t.width * t.height
}
var vh = `application/vnd.websfm.project+gzip`
  , yh = `websfm-project.json`
  , bh = new TextEncoder
  , xh = new TextDecoder;
async function Sh(e) {
  let t = [...e.project.assetRefs].sort((e, t) => e.order - t.order)
    , n = new Map(e.assets.map(e => [e.assetId, e]))
    , r = new Map(e.masks.map(e => [e.projectAssetId, e]))
    , i = {}
    , a = []
    , o = new Set(t.map(e => e.projectAssetId));
  for (let e of t) {
    let t = n.get(e.assetId);
    if (!t)
      throw Error(`Project asset blob is unavailable for '${e.assetId}'`);
    let o = Uh(`assets/${t.assetId}/${Wh(t.name)}`);
    i[o] = new Uint8Array(await t.blob.arrayBuffer());
    let s = r.get(e.projectAssetId)
      , c = {
        assetId: t.assetId,
        projectAssetId: e.projectAssetId,
        ...t.path ? {
          path: t.path
        } : {},
        name: t.name,
        type: t.type,
        size: t.size,
        lastModified: t.lastModified,
        origin: t.origin,
        blobPath: o,
        selected: e.selected
      };
    if (s) {
      let t = Uh(`masks/${Wh(e.projectAssetId)}.mask`);
      i[t] = new Uint8Array(s.mask.data),
        c.mask = {
          path: t,
          width: s.mask.width,
          height: s.mask.height
        }
    }
    a.push(c)
  }
  let s = {
    format: `websfm.project`,
    version: 1,
    exportedAt: new Date().toISOString(),
    project: {
      projectId: e.project.projectId,
      name: e.project.name,
      ...e.project.description ? {
        description: e.project.description
      } : {},
      createdAt: e.project.createdAt ?? Date.now(),
      updatedAt: e.project.updatedAt ?? Date.now(),
      activeAssetIds: t.map(e => e.assetId),
      selectedAssetIds: t.filter(e => e.selected).map(e => e.assetId)
    },
    assets: a
  };
  e.annotations && e.annotations.length > 0 && (Eh(e.annotations, e.project.projectId, o),
    s.manualPairAnnotations = e.annotations.map(Wn)),
    e.namedAnnotations && e.namedAnnotations.length > 0 && (Oh(e.namedAnnotations, e.project.projectId),
      s.namedAnnotations = e.namedAnnotations.map(La)),
    e.namedAnnotationObservations && e.namedAnnotationObservations.length > 0 && (Ah(e.namedAnnotationObservations, e.project.projectId, new Set((e.namedAnnotations ?? []).map(e => e.annotationId)), o),
      s.namedAnnotationObservations = e.namedAnnotationObservations.map(Ra)),
    e.model && (s.model = {
      path: `models/latest-reconstruction.json`,
      source: `websfm`
    },
      i[s.model.path] = bh.encode(JSON.stringify(e.model))),
    i[yh] = bh.encode(JSON.stringify(s, null, 2));
  let c = await as(i);
  return new Blob([Gh(c)], {
    type: vh
  })
}
async function Ch(e, t = {}) {
  let n = await os(e instanceof Blob ? new Uint8Array(await e.arrayBuffer()) : e instanceof ArrayBuffer ? new Uint8Array(e) : new Uint8Array(e.buffer, e.byteOffset, e.byteLength))
    , r = n[yh];
  if (!r)
    throw Error(`Missing ${yh}`);
  let i = wh(r)
    , a = t.existingProjectIds?.has(i.project.projectId) ?? !1
    , o = a ? fh(`import:${i.project.projectId}:${Date.now()}`) : i.project.projectId
    , s = a ? `${i.project.name} imported` : i.project.name
    , c = i.assets.map((e, t) => ({
      projectAssetId: e.projectAssetId,
      assetId: e.assetId,
      selected: e.selected,
      order: t
    }))
    , l = {
      projectId: o,
      name: s,
      ...i.project.description ? {
        description: i.project.description
      } : {},
      assetRefs: c,
      createdAt: i.project.createdAt,
      updatedAt: i.project.updatedAt,
      importSource: `websfm`
    }
    , u = []
    , d = [];
  for (let e of i.assets) {
    let t = Uh(e.blobPath)
      , r = n[t];
    if (!r)
      throw Error(`Missing bundled asset: ${t}`);
    if (e.size !== r.byteLength)
      throw Error(`Bundled asset size mismatch for ${e.name}: manifest=${e.size}, actual=${r.byteLength}`);
    if (u.push({
      assetId: e.assetId,
      ...e.path ? {
        path: e.path
      } : {},
      name: e.name,
      type: e.type,
      size: e.size,
      lastModified: e.lastModified,
      origin: e.origin,
      blob: new Blob([Gh(r)], {
        type: e.type
      })
    }),
      e.mask) {
      let t = Uh(e.mask.path)
        , r = n[t];
      if (!r)
        throw Error(`Missing bundled mask: ${t}`);
      let i = e.mask.width * e.mask.height;
      if (r.byteLength !== i)
        throw Error(`Bundled mask size mismatch for ${e.name}: expected ${i}, got ${r.byteLength}`);
      let a = Hr(e.mask.width, e.mask.height);
      a.data.set(r),
        d.push({
          projectId: o,
          projectAssetId: e.projectAssetId,
          mask: Ur(a)
        })
    }
  }
  let f = null;
  if (i.model) {
    let e = n[Uh(i.model.path)];
    if (!e)
      throw Error(`Missing bundled model: ${i.model.path}`);
    f = JSON.parse(xh.decode(e))
  }
  return {
    project: l,
    assets: u,
    masks: d,
    annotations: (i.manualPairAnnotations ?? []).map(e => {
      let t = Wn(e);
      return a ? {
        ...t,
        projectId: o
      } : t
    }
    ),
    namedAnnotations: (i.namedAnnotations ?? []).map(e => {
      let t = La(e);
      return a ? {
        ...t,
        projectId: o
      } : t
    }
    ),
    namedAnnotationObservations: (i.namedAnnotationObservations ?? []).map(e => {
      let t = Ra(e);
      return a ? {
        ...t,
        projectId: o
      } : t
    }
    ),
    model: f
  }
}
function wh(e) {
  let t = JSON.parse(xh.decode(e));
  if (t.format !== `websfm.project`)
    throw Error(`Invalid WebSfM project bundle: format must be websfm.project`);
  if (t.version !== 1)
    throw Error(`Unsupported WebSfM project bundle version: ${String(t.version)}`);
  if (!t.project || typeof t.project.projectId != `string` || typeof t.project.name != `string`)
    throw Error(`Invalid WebSfM project bundle: project metadata is invalid`);
  if (!Array.isArray(t.assets))
    throw Error(`Invalid WebSfM project bundle: assets must be an array`);
  for (let e of t.assets)
    Hh(e);
  Th(t.manualPairAnnotations, t.project.projectId, new Set(t.assets.map(e => e.projectAssetId)));
  let n = Dh(t.namedAnnotations, t.project.projectId);
  return kh(t.namedAnnotationObservations, t.project.projectId, n, new Set(t.assets.map(e => e.projectAssetId))),
    t.model && Uh(t.model.path),
    t
}
function Th(e, t, n) {
  if (e !== void 0) {
    if (!Array.isArray(e))
      throw Error(`Invalid WebSfM project bundle: manualPairAnnotations must be an array`);
    e.forEach((e, r) => {
      let i = `manualPairAnnotations[${r}]`;
      Ih(e, `Invalid WebSfM project bundle: ${i}`),
        zh(e, `Invalid WebSfM project bundle: ${i}`),
        Bh(e, t, n, `Invalid WebSfM project bundle: ${i}`)
    }
    )
  }
}
function Eh(e, t, n) {
  e.forEach(e => {
    let r = `Manual pair annotation ${e.id || `<missing>`}`;
    Ih(e, r),
      zh(e, r),
      Bh(e, t, n, r)
  }
  )
}
function Dh(e, t) {
  let n = new Set;
  if (e === void 0)
    return n;
  if (!Array.isArray(e))
    throw Error(`Invalid WebSfM project bundle: namedAnnotations must be an array`);
  return e.forEach((e, r) => {
    let i = `namedAnnotations[${r}]`;
    if (jh(e, `Invalid WebSfM project bundle: ${i}`),
      Mh(e, `Invalid WebSfM project bundle: ${i}`),
      e.projectId !== t)
      throw Error(`Invalid WebSfM project bundle: ${i}: projectId mismatch`);
    if (n.has(e.annotationId))
      throw Error(`Invalid WebSfM project bundle: ${i}: duplicate annotationId`);
    n.add(e.annotationId)
  }
  ),
    n
}
function Oh(e, t) {
  let n = new Set;
  e.forEach(e => {
    let r = `Named annotation ${e.annotationId || `<missing>`}`;
    if (jh(e, r),
      Mh(e, r),
      e.projectId !== t)
      throw Error(`${r}: projectId mismatch`);
    if (n.has(e.annotationId))
      throw Error(`${r}: duplicate annotationId`);
    n.add(e.annotationId)
  }
  )
}
function kh(e, t, n, r) {
  if (e !== void 0) {
    if (!Array.isArray(e))
      throw Error(`Invalid WebSfM project bundle: namedAnnotationObservations must be an array`);
    e.forEach((e, i) => {
      let a = `namedAnnotationObservations[${i}]`;
      Nh(e, `Invalid WebSfM project bundle: ${a}`),
        Ph(e, `Invalid WebSfM project bundle: ${a}`),
        Fh(e, t, n, r, `Invalid WebSfM project bundle: ${a}`)
    }
    )
  }
}
function Ah(e, t, n, r) {
  e.forEach(e => {
    let i = `Named annotation observation ${e.annotationId || `<missing>`}/${e.projectAssetId || `<missing>`}`;
    Nh(e, i),
      Ph(e, i),
      Fh(e, t, n, r, i)
  }
  )
}
function jh(e, t) {
  if (typeof e != `object` || !e)
    throw Error(`${t}: annotation entry must be an object`);
  let n = e;
  if (typeof n.annotationId != `string`)
    throw Error(`${t}: annotationId is required`);
  if (typeof n.projectId != `string`)
    throw Error(`${t}: projectId is required`);
  if (typeof n.name != `string`)
    throw Error(`${t}: name is required`);
  if (typeof n.color != `string`)
    throw Error(`${t}: color is required`);
  if (!Number.isFinite(n.createdAt))
    throw Error(`${t}: createdAt is invalid`);
  if (!Number.isFinite(n.updatedAt))
    throw Error(`${t}: updatedAt is invalid`)
}
function Mh(e, t) {
  let n = za(e);
  if (n.length > 0)
    throw Error(`${t}: ${n.join(`, `)}`)
}
function Nh(e, t) {
  if (typeof e != `object` || !e)
    throw Error(`${t}: observation entry must be an object`);
  let n = e;
  if (typeof n.projectId != `string`)
    throw Error(`${t}: projectId is required`);
  if (typeof n.annotationId != `string`)
    throw Error(`${t}: annotationId is required`);
  if (typeof n.projectAssetId != `string`)
    throw Error(`${t}: projectAssetId is required`);
  if (typeof n.point != `object` || n.point === null)
    throw Error(`${t}: point is required`);
  if (!Number.isFinite(n.createdAt))
    throw Error(`${t}: createdAt is invalid`);
  if (!Number.isFinite(n.updatedAt))
    throw Error(`${t}: updatedAt is invalid`)
}
function Ph(e, t) {
  let n = Ba(e);
  if (n.length > 0)
    throw Error(`${t}: ${n.join(`, `)}`)
}
function Fh(e, t, n, r, i) {
  if (e.projectId !== t)
    throw Error(`${i}: projectId mismatch`);
  if (!n.has(e.annotationId))
    throw Error(`${i}: annotationId is not in namedAnnotations`);
  if (!r.has(e.projectAssetId))
    throw Error(`${i}: projectAssetId is not in project assets`)
}
function Ih(e, t) {
  if (typeof e != `object` || !e)
    throw Error(`${t}: annotation entry must be an object`);
  let n = e;
  if (typeof n.id != `string`)
    throw Error(`${t}: id is required`);
  if (typeof n.projectId != `string`)
    throw Error(`${t}: projectId is required`);
  if (typeof n.leftProjectAssetId != `string`)
    throw Error(`${t}: leftProjectAssetId is required`);
  if (typeof n.rightProjectAssetId != `string`)
    throw Error(`${t}: rightProjectAssetId is required`);
  if (typeof n.pairKey != `string`)
    throw Error(`${t}: pairKey is required`);
  if (!Number.isFinite(n.createdAt))
    throw Error(`${t}: createdAt is invalid`);
  if (!Number.isFinite(n.updatedAt))
    throw Error(`${t}: updatedAt is invalid`);
  if (!Array.isArray(n.points))
    throw Error(`${t}: points must be an array`);
  n.points.forEach((e, n) => Lh(e, `${t}.points[${n}]`))
}
function Lh(e, t) {
  if (typeof e != `object` || !e)
    throw Error(`${t}: point entry must be an object`);
  let n = e;
  if (typeof n.id != `string`)
    throw Error(`${t}: id is required`);
  if (!Number.isFinite(n.createdAt))
    throw Error(`${t}: createdAt is invalid`);
  if (!Number.isFinite(n.updatedAt))
    throw Error(`${t}: updatedAt is invalid`);
  Rh(n.left, `${t}.left`),
    Rh(n.right, `${t}.right`)
}
function Rh(e, t) {
  if (typeof e != `object` || !e)
    throw Error(`${t}: point coordinate must be an object`);
  let n = e;
  if (!Vh(n.x) || !Vh(n.y))
    throw Error(`${t}: coordinates must be finite normalized values in [0,1]`)
}
function zh(e, t) {
  let n = Gn(e);
  if (n.length > 0)
    throw Error(`${t}: ${n.join(`; `)}`)
}
function Bh(e, t, n, r) {
  if (e.projectId !== t)
    throw Error(`${r}: projectId must match project metadata`);
  if (!n.has(e.leftProjectAssetId))
    throw Error(`${r}: leftProjectAssetId is not in project assets`);
  if (!n.has(e.rightProjectAssetId))
    throw Error(`${r}: rightProjectAssetId is not in project assets`)
}
function Vh(e) {
  return typeof e == `number` && Number.isFinite(e) && e >= 0 && e <= 1
}
function Hh(e) {
  if (typeof e != `object` || !e)
    throw Error(`Invalid WebSfM project bundle: asset entry must be an object`);
  let t = e;
  if (typeof t.assetId != `string` || t.assetId.length === 0)
    throw Error(`Invalid WebSfM project bundle: assetId is required`);
  if (typeof t.projectAssetId != `string` || t.projectAssetId.length === 0)
    throw Error(`Invalid WebSfM project bundle: projectAssetId is required`);
  if (typeof t.name != `string` || t.name.length === 0)
    throw Error(`Invalid WebSfM project bundle: asset name is required`);
  if (typeof t.type != `string`)
    throw Error(`Invalid WebSfM project bundle: asset type is required`);
  if (typeof t.size != `number` || !Number.isInteger(t.size) || t.size < 0)
    throw Error(`Invalid WebSfM project bundle: asset size is invalid`);
  if (!Number.isFinite(t.lastModified))
    throw Error(`Invalid WebSfM project bundle: lastModified is invalid`);
  if (t.origin !== `upload` && t.origin !== `video` && t.origin !== `import`)
    throw Error(`Invalid WebSfM project bundle: asset origin is invalid`);
  if (typeof t.blobPath != `string`)
    throw Error(`Invalid WebSfM project bundle: blobPath is required`);
  if (Uh(t.blobPath),
    t.path && Uh(t.path),
    t.mask) {
    if (Uh(t.mask.path),
      !Number.isInteger(t.mask.width) || t.mask.width <= 0)
      throw Error(`Invalid WebSfM project bundle: mask width is invalid`);
    if (!Number.isInteger(t.mask.height) || t.mask.height <= 0)
      throw Error(`Invalid WebSfM project bundle: mask height is invalid`)
  }
}
function Uh(e) {
  return zo(e, `bundle path`)
}
function Wh(e) {
  return e.replace(/[\\/]/g, `_`).replace(/[\u0000-\u001f\u007f]/g, `_`).trim() || `asset`
}
function Gh(e) {
  let t = new Uint8Array(e.byteLength);
  return t.set(e),
    t.buffer
}
function Kh(e, t) {
  let n = new TextDecoder;
  return {
    cameras: Xh(n.decode(sg(e, `${t}/cameras.txt`))),
    images: Zh(n.decode(sg(e, `${t}/images.txt`))),
    points3D: Qh(n.decode(sg(e, `${t}/points3D.txt`)))
  }
}
function qh(e) {
  let t = new Map
    , n = e.cameras.map((e, n) => (t.set(e.cameraId, n + 1),
      $h(e)))
    , r = e.images.map(e => {
      let t = rg(e.qvec)
        , n = ig(t, e.tvec);
      return {
        imageId: e.imageId,
        name: xg(e.name),
        center: n,
        R: t,
        qvec: e.qvec,
        tvec: e.tvec,
        registered: !0,
        componentId: 0
      }
    }
    )
    , i = e.images.map(e => ({
      id: e.imageId,
      cameraId: t.get(e.cameraId) ?? e.cameraId,
      name: xg(e.name),
      qvec: e.qvec,
      tvec: e.tvec,
      xys: e.points2D.map(e => [e.x, e.y]),
      point3DIds: e.points2D.map(e => e.point3DId)
    }));
  return ag(n, r, e.points3D, i)
}
function Jh(e, t = []) {
  let n = []
    , r = []
    , i = [];
  for (let t = 0; t < e.frames.length; t += 1) {
    let a = e.frames[t]
      , o = eg(e, a)
      , s = t + 1
      , c = xg(a.file_path)
      , l = ng(a.transform_matrix, s, c);
    n.push(o),
      r.push(l),
      i.push({
        id: s,
        cameraId: s,
        name: c,
        qvec: l.qvec,
        tvec: l.tvec,
        xys: [],
        point3DIds: []
      })
  }
  return ag(n, r, t, i)
}
function Yh(e) {
  let { header: t, bodyOffset: n } = lg(e)
    , r = t.split(/\r?\n/).map(e => e.trim()).filter(Boolean);
  if (r[0] !== `ply`)
    throw Error(`Invalid PLY file: missing ply header`);
  let i = null
    , a = 0
    , o = !1
    , s = [];
  for (let e of r) {
    let t = e.split(/\s+/);
    if (t[0] === `format`) {
      t[1] === `ascii` && (i = `ascii`),
        t[1] === `binary_little_endian` && (i = `binary_little_endian`);
      continue
    }
    if (t[0] === `element`) {
      o = t[1] === `vertex`,
        o && (a = R(t[2], `PLY vertex count`));
      continue
    }
    if (o && t[0] === `property`) {
      if (t[1] === `list`)
        continue;
      let e = t[1]
        , n = t[2];
      e && n && s.push({
        type: e,
        name: n
      })
    }
  }
  if (!i)
    throw Error(`Unsupported PLY file: missing format`);
  if (a < 0)
    throw Error(`Invalid PLY vertex count: ${a}`);
  let c = ug(s, [`x`])
    , l = ug(s, [`y`])
    , u = ug(s, [`z`]);
  if (c < 0 || l < 0 || u < 0)
    throw Error(`Unsupported PLY file: vertex x/y/z properties are required`);
  let d = ug(s, [`red`, `r`])
    , f = ug(s, [`green`, `g`])
    , p = ug(s, [`blue`, `b`]);
  return i === `ascii` ? dg(e, n, a, s, c, l, u, d, f, p) : fg(e, n, a, s, c, l, u, d, f, p)
}
function Xh(e) {
  return og(e).map(e => {
    let t = e.split(/\s+/);
    if (t.length < 5)
      throw Error(`Invalid COLMAP camera line: ${e}`);
    return {
      cameraId: R(t[0], `CAMERA_ID`),
      model: t[1],
      width: R(t[2], `WIDTH`),
      height: R(t[3], `HEIGHT`),
      params: t.slice(4).map(e => R(e, `PARAM`))
    }
  }
  )
}
function Zh(e) {
  let t = og(e)
    , n = [];
  for (let e = 0; e < t.length; e += 2) {
    let r = t[e]
      , i = t[e + 1] ?? ``
      , a = r.split(/\s+/);
    if (a.length < 10)
      throw Error(`Invalid COLMAP image line: ${r}`);
    let o = i.trim() ? i.trim().split(/\s+/) : []
      , s = [];
    for (let e = 0; e + 2 < o.length; e += 3)
      s.push({
        x: R(o[e], `X`),
        y: R(o[e + 1], `Y`),
        point3DId: R(o[e + 2], `POINT3D_ID`)
      });
    n.push({
      imageId: R(a[0], `IMAGE_ID`),
      qvec: [R(a[1], `QW`), R(a[2], `QX`), R(a[3], `QY`), R(a[4], `QZ`)],
      tvec: [R(a[5], `TX`), R(a[6], `TY`), R(a[7], `TZ`)],
      cameraId: R(a[8], `CAMERA_ID`),
      name: a.slice(9).join(` `),
      points2D: s
    })
  }
  return n
}
function Qh(e) {
  return og(e).map(e => {
    let t = e.split(/\s+/);
    if (t.length < 8)
      throw Error(`Invalid COLMAP points3D line: ${e}`);
    let n = [];
    for (let e = 8; e + 1 < t.length; e += 2)
      n.push({
        imageId: R(t[e], `IMAGE_ID`),
        point2DIdx: R(t[e + 1], `POINT2D_IDX`)
      });
    return {
      id: R(t[0], `POINT3D_ID`),
      xyz: [R(t[1], `X`), R(t[2], `Y`), R(t[3], `Z`)],
      rgb: [R(t[4], `R`), R(t[5], `G`), R(t[6], `B`)],
      error: R(t[7], `ERROR`),
      track: n
    }
  }
  )
}
function $h(e) {
  let t = e.params;
  if (e.model === `PINHOLE`)
    return tg(e.width, e.height, t[0], t[1], t[2], t[3], `COLMAP PINHOLE`);
  if (e.model === `SIMPLE_PINHOLE`)
    return tg(e.width, e.height, t[0], t[0], t[1], t[2], `COLMAP ${e.model}`);
  if (e.model === `SIMPLE_RADIAL`)
    return tg(e.width, e.height, t[0], t[0], t[1], t[2], `COLMAP ${e.model}`, {
      k1: bg(t[3])
    });
  if (e.model === `RADIAL`)
    return tg(e.width, e.height, t[0], t[0], t[1], t[2], `COLMAP ${e.model}`, {
      k1: bg(t[3]),
      k2: bg(t[4])
    });
  if (e.model === `OPENCV`)
    return tg(e.width, e.height, t[0], t[1], t[2], t[3], `COLMAP ${e.model}`, {
      k1: bg(t[4]),
      k2: bg(t[5]),
      p1: bg(t[6]),
      p2: bg(t[7])
    });
  if (e.model === `OPENCV_FISHEYE`)
    return tg(e.width, e.height, t[0], t[1], t[2], t[3], `COLMAP ${e.model}`);
  throw Error(`Unsupported COLMAP camera model: ${e.model}`)
}
function eg(e, t) {
  return tg(cg(t.w ?? e.w, `w`), cg(t.h ?? e.h, `h`), cg(t.fl_x ?? e.fl_x, `fl_x`), cg(t.fl_y ?? e.fl_y, `fl_y`), cg(t.cx ?? e.cx, `cx`), cg(t.cy ?? e.cy, `cy`), `Nerfstudio ${e.camera_model ?? `camera`}`, {
    k1: bg(t.k1 ?? e.k1),
    k2: bg(t.k2 ?? e.k2),
    p1: bg(t.p1 ?? e.p1),
    p2: bg(t.p2 ?? e.p2)
  })
}
function tg(e, t, n, r, i, a, o, s = {}) {
  return {
    width: e,
    height: t,
    fx: n,
    fy: r,
    cx: i,
    cy: a,
    nativeWidth: e,
    nativeHeight: t,
    source: o,
    ...s
  }
}
function ng(e, t, n) {
  if (e.length !== 4 || e.some(e => !Array.isArray(e) || e.length !== 4))
    throw Error(`Invalid Nerfstudio transform for ${n}`);
  let r = [cg(e[0][0], `m00`), -cg(e[0][1], `m01`), -cg(e[0][2], `m02`), cg(e[1][0], `m10`), -cg(e[1][1], `m11`), -cg(e[1][2], `m12`), cg(e[2][0], `m20`), -cg(e[2][1], `m21`), -cg(e[2][2], `m22`)]
    , i = [r[0], r[3], r[6], r[1], r[4], r[7], r[2], r[5], r[8]]
    , a = [cg(e[0][3], `tx`), cg(e[1][3], `ty`), cg(e[2][3], `tz`)]
    , o = [-(i[0] * a[0] + i[1] * a[1] + i[2] * a[2]), -(i[3] * a[0] + i[4] * a[1] + i[5] * a[2]), -(i[6] * a[0] + i[7] * a[1] + i[8] * a[2])];
  return {
    imageId: t,
    name: n,
    center: a,
    R: i,
    qvec: nt(i),
    tvec: o,
    registered: !0,
    componentId: 0
  }
}
function rg(e) {
  let [t, n, r, i] = e
    , a = Math.hypot(t, n, r, i) || 1
    , o = t / a
    , s = n / a
    , c = r / a
    , l = i / a;
  return [1 - 2 * c * c - 2 * l * l, 2 * s * c - 2 * l * o, 2 * s * l + 2 * c * o, 2 * s * c + 2 * l * o, 1 - 2 * s * s - 2 * l * l, 2 * c * l - 2 * s * o, 2 * s * l - 2 * c * o, 2 * c * l + 2 * s * o, 1 - 2 * s * s - 2 * c * c]
}
function ig(e, t) {
  return [-(e[0] * t[0] + e[3] * t[1] + e[6] * t[2]), -(e[1] * t[0] + e[4] * t[1] + e[7] * t[2]), -(e[2] * t[0] + e[5] * t[1] + e[8] * t[2])]
}
function ag(e, t, n, r) {
  return {
    cameras: e,
    poses: t,
    points: n,
    images: r,
    stats: {
      gpuScoring: !1,
      features: r.map(e => e.xys.length),
      matches: [],
      registeredImages: t.filter(e => e.registered).length,
      medianReprojectionError: n.length > 0 ? Sg(n.map(e => e.error)) : 0,
      candidateTracks: n.length,
      guidedObservations: 0,
      meanTrackLength: n.length > 0 ? n.reduce((e, t) => e + t.track.length, 0) / n.length : 0,
      longTracks: n.filter(e => e.track.length >= 4).length,
      weakLinks: 0,
      diagnostics: []
    }
  }
}
function og(e) {
  return e.split(/\r?\n/).map(e => e.trim()).filter(e => e.length > 0 && !e.startsWith(`#`))
}
function sg(e, t) {
  let n = e[t];
  if (!n)
    throw Error(`Missing import file: ${t}`);
  return n
}
function R(e, t) {
  let n = Number(e);
  if (!Number.isFinite(n))
    throw Error(`Invalid numeric ${t}: ${String(e)}`);
  return n
}
function cg(e, t) {
  if (typeof e != `number` || !Number.isFinite(e))
    throw Error(`Invalid numeric ${t}: ${String(e)}`);
  return e
}
function lg(e) {
  let t = new TextEncoder().encode(`end_header`);
  for (let n = 0; n <= e.length - t.length; n += 1) {
    let r = !0;
    for (let i = 0; i < t.length; i += 1)
      if (e[n + i] !== t[i]) {
        r = !1;
        break
      }
    if (!r)
      continue;
    let i = n + t.length;
    if (e[i] === 13 && e[i + 1] === 10)
      i += 2;
    else if (e[i] === 10 || e[i] === 13)
      i += 1;
    else
      throw Error(`Invalid PLY file: end_header must be followed by a newline`);
    return {
      header: new TextDecoder().decode(e.slice(0, i)),
      bodyOffset: i
    }
  }
  throw Error(`Invalid PLY file: missing end_header`)
}
function ug(e, t) {
  let n = new Set(t.map(e => e.toLowerCase()));
  return e.findIndex(e => n.has(e.name.toLowerCase()))
}
function dg(e, t, n, r, i, a, o, s, c, l) {
  let u = new TextDecoder().decode(e.slice(t)).split(/\r?\n/)
    , d = [];
  for (let e = 0; e < n; e += 1) {
    let t = u[e]?.trim().split(/\s+/) ?? [];
    if (t.length < r.length)
      throw Error(`Invalid PLY vertex row ${e + 1}`);
    let n = [R(t[i], `PLY x`), R(t[a], `PLY y`), R(t[o], `PLY z`)];
    yg(n) && d.push({
      id: d.length + 1,
      xyz: n,
      rgb: [gg(t, s, 255), gg(t, c, 255), gg(t, l, 255)],
      error: 0,
      track: []
    })
  }
  return d
}
function fg(e, t, n, r, i, a, o, s, c, l) {
  let u = r.map(e => ({
    type: e.type,
    size: mg(e.type)
  }))
    , d = u.reduce((e, t) => e + t.size, 0)
    , f = pg(u);
  if (t + d * n > e.byteLength)
    throw Error(`Invalid PLY file: expected ${n} vertices but file is truncated`);
  let p = new DataView(e.buffer, e.byteOffset, e.byteLength)
    , m = [];
  for (let e = 0; e < n; e += 1) {
    let n = t + e * d
      , r = [hg(p, n + f[i], u[i].type), hg(p, n + f[a], u[a].type), hg(p, n + f[o], u[o].type)];
    yg(r) && m.push({
      id: m.length + 1,
      xyz: r,
      rgb: [_g(p, n, f, u, s, 255), _g(p, n, f, u, c, 255), _g(p, n, f, u, l, 255)],
      error: 0,
      track: []
    })
  }
  return m
}
function pg(e) {
  let t = []
    , n = 0;
  for (let r of e)
    t.push(n),
      n += r.size;
  return t
}
function mg(e) {
  switch (e.toLowerCase()) {
    case `char`:
    case `int8`:
    case `uchar`:
    case `uint8`:
      return 1;
    case `short`:
    case `int16`:
    case `ushort`:
    case `uint16`:
      return 2;
    case `int`:
    case `int32`:
    case `uint`:
    case `uint32`:
    case `float`:
    case `float32`:
      return 4;
    case `double`:
    case `float64`:
      return 8;
    default:
      throw Error(`Unsupported PLY scalar type: ${e}`)
  }
}
function hg(e, t, n) {
  switch (n.toLowerCase()) {
    case `char`:
    case `int8`:
      return e.getInt8(t);
    case `uchar`:
    case `uint8`:
      return e.getUint8(t);
    case `short`:
    case `int16`:
      return e.getInt16(t, !0);
    case `ushort`:
    case `uint16`:
      return e.getUint16(t, !0);
    case `int`:
    case `int32`:
      return e.getInt32(t, !0);
    case `uint`:
    case `uint32`:
      return e.getUint32(t, !0);
    case `float`:
    case `float32`:
      return e.getFloat32(t, !0);
    case `double`:
    case `float64`:
      return e.getFloat64(t, !0);
    default:
      throw Error(`Unsupported PLY scalar type: ${n}`)
  }
}
function gg(e, t, n) {
  return t < 0 ? n : vg(R(e[t], `PLY color`))
}
function _g(e, t, n, r, i, a) {
  return i < 0 ? a : vg(hg(e, t + n[i], r[i].type))
}
function vg(e) {
  return Math.max(0, Math.min(255, Math.round(e)))
}
function yg(e) {
  return e.every(Number.isFinite)
}
function bg(e) {
  return typeof e == `number` && Number.isFinite(e) ? e : void 0
}
function xg(e) {
  let t = e.replace(/\\/g, `/`);
  return t.slice(t.lastIndexOf(`/`) + 1)
}
function Sg(e) {
  if (e.length === 0)
    return 0;
  let t = [...e].sort((e, t) => e - t)
    , n = Math.floor(t.length / 2);
  return t.length % 2 == 1 ? t[n] : (t[n - 1] + t[n]) * .5
}
async function Cg(e, t = {}) {
  if (e.length === 0)
    throw Error(`No project import files provided`);
  if (e.length === 1 && /\.websfmproject$/i.test(e[0].name))
    return Ch(e[0], {
      existingProjectIds: t.existingProjectIds
    });
  let n = await wg(e);
  if (n[`websfm-project.json`])
    throw Error(`WebSfM project manifests must be imported as .websfmproject bundles`);
  let r = Mg(n);
  if (r)
    return Eg(n, r, t);
  let i = Ng(n);
  if (i)
    return Tg(n, i, t);
  throw Error(`Unsupported project import: expected a WebSfM project, COLMAP dataset, or Nerfstudio dataset`)
}
async function wg(e) {
  if (e.length === 1) {
    let t = e[0];
    if (/\.zip$/i.test(t.name))
      return ps(t);
    if (/\.(tar\.gz|tgz|gz)$/i.test(t.name))
      return os(new Uint8Array(await t.arrayBuffer()));
    if (/\.tar$/i.test(t.name))
      return is(new Uint8Array(await t.arrayBuffer()))
  }
  let t = {};
  for (let n of e) {
    let e = zo(n.webkitRelativePath || n.name, `import file path`);
    t[e] = new Uint8Array(await n.arrayBuffer())
  }
  return t
}
async function Tg(e, t, n) {
  let r = Kh(e, t)
    , i = qh(r)
    , a = r.images.map(e => e.name);
  return {
    ...await Og(`Imported COLMAP project`, `colmap`, a, e, `images`, kg(e, a, void 0, ``), n.decodeProjectMask),
    annotations: [],
    namedAnnotations: [],
    namedAnnotationObservations: [],
    model: i
  }
}
async function Eg(e, t, n) {
  let r = e[t];
  if (!r)
    throw Error(`Missing Nerfstudio transforms file: ${t}`);
  let i = bs(r, {
    allowPartialMasks: !0
  })
    , a = Ho(t)
    , o = Jh(i, Dg(e, i, a))
    , s = i.frames.map(e => e.file_path);
  return {
    ...await Og(`Imported Nerfstudio project`, `nerfstudio`, s, e, a, kg(e, s, i.frames.map(e => e.mask_path), a), n.decodeProjectMask),
    annotations: [],
    namedAnnotations: [],
    namedAnnotationObservations: [],
    model: o
  }
}
function Dg(e, t, n) {
  let r = typeof t.ply_file_path == `string` ? zo(t.ply_file_path, `Nerfstudio PLY path`) : ``;
  if (!r)
    return [];
  let i = e[Pg(r, n)] ?? e[r];
  if (!i)
    throw Error(`Missing imported Nerfstudio PLY asset: ${r}`);
  return Yh(i)
}
async function Og(e, t, n, r, i, a = new Map, o = Lg) {
  let s = fh(`${t}:${Date.now()}:${n.join(`|`)}`)
    , c = []
    , l = []
    , u = [];
  for (let e = 0; e < n.length; e += 1) {
    let t = zo(n[e], `image path`)
      , d = r[Pg(t, i)] ?? r[t];
    if (!d)
      throw Error(`Missing imported image asset: ${t}`);
    let f = Vo(t)
      , p = dh({
        path: t,
        name: f,
        size: d.byteLength,
        lastModified: 0
      })
      , m = ph(p)
      , h = mh(s, p);
    c.push({
      assetId: m,
      path: t,
      name: f,
      type: Vg(f),
      size: d.byteLength,
      lastModified: 0,
      origin: `import`,
      blob: new Blob([Hg(d)], {
        type: Vg(f)
      })
    }),
      l.push({
        projectAssetId: h,
        assetId: m,
        selected: !0,
        order: e
      });
    let g = a.get(t);
    if (g) {
      let e = await o(g.bytes, {
        path: g.path,
        imagePath: t
      });
      e && Xr(e) && u.push({
        projectId: s,
        projectAssetId: h,
        mask: Ur(e)
      })
    }
  }
  let d = Date.now();
  return {
    project: {
      projectId: s,
      name: e,
      assetRefs: l,
      createdAt: d,
      updatedAt: d,
      importSource: t
    },
    assets: c,
    masks: u,
    annotations: [],
    namedAnnotations: [],
    namedAnnotationObservations: []
  }
}
function kg(e, t, n, r) {
  let i = new Map;
  for (let a = 0; a < t.length; a += 1) {
    let o = zo(t[a], `image path`)
      , s = Ag(e, o, n?.[a], r);
    s && i.set(o, s)
  }
  return i
}
function Ag(e, t, n, r) {
  for (let i of jg(t, n)) {
    let t = Pg(i, r)
      , n = e[t] ?? e[i];
    if (n)
      return {
        path: e[t] ? t : i,
        bytes: n
      }
  }
  return null
}
function jg(e, t) {
  let n = zo(e, `image path`)
    , r = Fg(n, `images`)
    , i = [t, ls(n), ls(r, {
      imageRoot: ``
    }), cs(n), cs(r), `masks/${Ig(r, `.png`)}`, `masks/${Ig(r, `.mask.png`)}`].filter(e => typeof e == `string` && e.length > 0)
    , a = []
    , o = new Set;
  for (let e of i) {
    let t = zo(e, `mask path`);
    o.has(t) || (o.add(t),
      a.push(t))
  }
  return a
}
function Mg(e) {
  if (e[`transforms.json`])
    return `transforms.json`;
  let t = Object.keys(e).filter(e => e.endsWith(`/transforms.json`));
  if (t.length === 1)
    return t[0];
  if (t.length > 1)
    throw Error(`Multiple transforms.json files found: ${t.join(`, `)}`);
  return null
}
function Ng(e) {
  let t = new Set;
  for (let n of Object.keys(e))
    n.endsWith(`/cameras.txt`) && t.add(Ho(n));
  for (let n of t)
    if (e[`${n}/cameras.txt`] && e[`${n}/images.txt`] && e[`${n}/points3D.txt`])
      return n;
  return null
}
function Pg(e, t) {
  return t.trim() === `` ? e : zo(`${t}/${e}`, `import asset path`)
}
function Fg(e, t) {
  let n = zo(e, `path`)
    , r = zo(t, `path prefix`);
  return n.toLowerCase().startsWith(`${r.toLowerCase()}/`) ? n.slice(r.length + 1) : n
}
function Ig(e, t) {
  let n = zo(e, `path`)
    , r = n.lastIndexOf(`/`)
    , i = n.lastIndexOf(`.`)
    , a = t.startsWith(`.`) ? t : `.${t}`;
  return i > r ? `${n.slice(0, i)}${a}` : `${n}${a}`
}
async function Lg(e) {
  let t = new Blob([Hg(e)], {
    type: `image/png`
  });
  if (typeof createImageBitmap == `function`) {
    let e = await createImageBitmap(t);
    try {
      return Rg(e)
    } finally {
      e.close()
    }
  }
  if (typeof document < `u`) {
    let e = URL.createObjectURL(t);
    try {
      return Rg(await Bg(e))
    } finally {
      URL.revokeObjectURL(e)
    }
  }
  throw Error(`Importing dataset masks requires browser image decoding support`)
}
function Rg(e) {
  let t = Math.max(1, Math.round(e.width))
    , n = Math.max(1, Math.round(e.height))
    , r = zg(t, n).getContext(`2d`);
  if (!r)
    throw Error(`Could not create mask import canvas`);
  r.drawImage(e, 0, 0, t, n);
  let i = r.getImageData(0, 0, t, n).data
    , a = !1;
  for (let e = 3; e < i.length; e += 4)
    if (i[e] < 255) {
      a = !0;
      break
    }
  let o = Hr(t, n);
  for (let e = 0; e < t * n; e += 1) {
    let t = e * 4
      , n = a ? i[t + 3] >= 128 : i[t] >= 128;
    o.data[e] = +!n
  }
  return Xr(o) ? o : null
}
function zg(e, t) {
  if (typeof document < `u`) {
    let n = document.createElement(`canvas`);
    return n.width = e,
      n.height = t,
      n
  }
  if (typeof OffscreenCanvas < `u`)
    return new OffscreenCanvas(e, t);
  throw Error(`Importing dataset masks requires canvas support`)
}
function Bg(e) {
  return new Promise((t, n) => {
    let r = new Image;
    r.onload = () => t(r),
      r.onerror = () => n(Error(`Could not decode imported mask image`)),
      r.src = e
  }
  )
}
function Vg(e) {
  return /\.png$/i.test(e) ? `image/png` : /\.jpe?g$/i.test(e) ? `image/jpeg` : /\.webp$/i.test(e) ? `image/webp` : /\.avif$/i.test(e) ? `image/avif` : ``
}
function Hg(e) {
  let t = new Uint8Array(e.byteLength);
  return t.set(e),
    t.buffer
}
var Ug = 128 * 1024 * 1024;
function Wg(e, t, n) {
  let r = Math.max(1, Math.round(e))
    , i = Math.max(1, Math.round(t))
    , a = Math.max(r, i)
    , o = Math.max(256, n)
    , s = a > o ? o / a : 1;
  return {
    width: Math.max(1, Math.round(r * s)),
    height: Math.max(1, Math.round(i * s))
  }
}
function Gg(e, t, n) {
  return Math.max(0, e) * Math.max(1, t) * Math.max(1, n) * 5
}
function Kg(e) {
  return e.reduce((e, t) => e + t.gray.byteLength + t.rgba.byteLength, 0)
}
function qg(e) {
  let t = new TextEncoder().encode(JSON.stringify({
    schemaVersion: e.schemaVersion,
    frameCount: e.frameCount,
    totalPixels: e.totalPixels,
    frames: e.frames.map(e => ({
      id: e.id,
      name: e.name,
      width: e.width,
      height: e.height,
      intrinsics: e.intrinsics
    }))
  })).byteLength;
  return e.frames.reduce((e, t) => e + t.gray.byteLength + t.rgba.byteLength, t)
}
function Jg(e, t = Ug) {
  let n = Number.isFinite(e) ? Math.max(0, Math.ceil(e)) : 1 / 0;
  return Number.isFinite(n) ? n > t ? {
    useCache: !1,
    byteSize: n,
    reason: `estimated decoded image cache ${n} bytes exceeds the ${t} byte safety budget`
  } : {
    useCache: !0,
    byteSize: n
  } : {
    useCache: !1,
    byteSize: n,
    reason: `estimated decoded image cache size is not finite`
  }
}
var Yg = `wide`
  , Xg = {
    wide: .85,
    normal: 1,
    tele: 1.2
  };
function Zg(e) {
  return e === `manual` ? Xg[Yg] : Xg[e]
}
function Qg(e, t, n, r, i) {
  let a = Math.max(1, t, n);
  if (e === `manual` && Number.isFinite(r) && r > 0)
    return {
      mode: e,
      nativeFocal: r,
      ratio: r / a,
      source: `manual ${r.toFixed(0)} px`
    };
  if (i && Number.isFinite(i.nativeFocal) && i.nativeFocal > 0)
    return {
      mode: `exif`,
      nativeFocal: i.nativeFocal,
      ratio: i.nativeFocal / a,
      source: i.source
    };
  let o = e === `manual` ? Yg : e
    , s = Zg(o);
  return {
    mode: o,
    nativeFocal: a * s,
    ratio: s,
    source: `${o} ${s.toFixed(2)}x`
  }
}
function $g(e, t, n, r, i) {
  return {
    fx: t / Math.max(1, r) * e,
    fy: n / Math.max(1, i) * e
  }
}
var e_ = 2400;
function t_(e, t, n, r, i, a, o) {
  let s = Qg(a, n, r, i, o)
    , { fx: c, fy: l } = $g(s.nativeFocal, e, t, n, r)
    , u = Math.max(e / Math.max(1, n), t / Math.max(1, r))
    , d = s.mode === `manual` ? u === 1 ? s.source : `${s.source} @ ${(u * 100).toFixed(0)}%` : s.mode === `exif` ? `${s.source} -> ${c.toFixed(0)} processed px` : `${s.source} prior ${c.toFixed(0)} px`;
  return {
    width: e,
    height: t,
    fx: c,
    fy: l,
    cx: e * .5,
    cy: t * .5,
    nativeWidth: n,
    nativeHeight: r,
    source: d
  }
}
async function n_(e) {
  let t = await r_(e);
  if (t)
    return t;
  let n = await createImageBitmap(e, {
    imageOrientation: `from-image`
  })
    , r = {
      width: n.width,
      height: n.height
    };
  return n.close(),
    r
}
async function r_(e) {
  let t = new Uint8Array(await e.slice(0, Math.min(e.size, 1024 * 1024)).arrayBuffer())
    , n = a_(t);
  if (n)
    return n;
  let r = o_(t);
  return r ? i_(gm(t.buffer.slice(t.byteOffset, t.byteOffset + t.byteLength))) ? {
    width: r.height,
    height: r.width
  } : r : null
}
function i_(e) {
  return e !== null && e >= 5 && e <= 8
}
function a_(e) {
  if (e.length < 24 || e[0] !== 137 || e[1] !== 80 || e[2] !== 78 || e[3] !== 71 || e[4] !== 13 || e[5] !== 10 || e[6] !== 26 || e[7] !== 10)
    return null;
  let t = l_(e, 16)
    , n = l_(e, 20);
  return t > 0 && n > 0 ? {
    width: t,
    height: n
  } : null
}
function o_(e) {
  if (e.length < 4 || e[0] !== 255 || e[1] !== 216)
    return null;
  let t = 2;
  for (; t + 9 < e.length;) {
    for (; t < e.length && e[t] === 255;)
      t++;
    if (t >= e.length)
      break;
    let n = e[t++];
    if (n === 217 || n === 218)
      break;
    if (n === 1 || n >= 208 && n <= 215)
      continue;
    if (t + 2 > e.length)
      break;
    let r = c_(e, t);
    if (r < 2 || t + r > e.length)
      break;
    let i = t + 2;
    if (s_(n) && i + 5 < t + r) {
      let t = c_(e, i + 1)
        , n = c_(e, i + 3);
      return n > 0 && t > 0 ? {
        width: n,
        height: t
      } : null
    }
    t += r
  }
  return null
}
function s_(e) {
  return e >= 192 && e <= 195 || e >= 197 && e <= 199 || e >= 201 && e <= 203 || e >= 205 && e <= 207
}
function c_(e, t) {
  return (e[t] ?? 0) << 8 | (e[t + 1] ?? 0)
}
function l_(e, t) {
  return (e[t] ?? 0) * 16777216 + ((e[t + 1] ?? 0) << 16) + ((e[t + 2] ?? 0) << 8) + (e[t + 3] ?? 0)
}
async function u_(e, t = {}) {
  let n = t.focalOverride ?? 0
    , r = t.focalPrior ?? `wide`
    , i = Math.max(256, t.maxLongEdge ?? e_)
    , a = t.preserveOriginalMaxLongEdge ?? 1 / 0
    , o = [];
  for (let t = 0; t < e.length; t++) {
    let s = e.item(t);
    if (!s)
      continue;
    let c = await createImageBitmap(s, {
      imageOrientation: `from-image`
    })
      , l = c.width
      , u = c.height
      , d = n > 0 ? null : await pm(s, l, u)
      , f = Math.max(l, u);
    if (!Number.isFinite(i) && f > a)
      throw c.close(),
      Error(`Preserve original refused ${s.name}: native long edge ${f}px exceeds the safety cap ${a}px. Use Auto recommended or Custom max edge.`);
    let p = f > i ? i / f : 1
      , m = Math.max(1, Math.round(l * p))
      , h = Math.max(1, Math.round(u * p))
      , g = new OffscreenCanvas(m, h).getContext(`2d`, {
        willReadFrequently: !0
      });
    if (!g)
      throw c.close(),
      Error(`Could not create image decoder canvas`);
    g.imageSmoothingEnabled = p !== 1,
      g.imageSmoothingQuality = `high`,
      g.drawImage(c, 0, 0, m, h),
      c.close();
    let _ = g.getImageData(0, 0, m, h).data
      , v = new Uint8Array(m * h);
    for (let e = 0, t = 0; t < v.length; e += 4,
      t++)
      v[t] = _[e] * 77 + _[e + 1] * 150 + _[e + 2] * 29 >> 8;
    o.push({
      id: t + 1,
      name: s.name,
      width: m,
      height: h,
      gray: v,
      rgba: _,
      intrinsics: t_(m, h, l, u, n, r, d)
    })
  }
  return o
}
function d_(e, t, n) {
  return `features:${e}:${t}:${n}`
}
function f_(e, t, n) {
  return `pair-plan:${e}:${t}:${n}`
}
function p_(e, t) {
  return `matches:${e}:${t}`
}
function m_(e, t, n) {
  return `model:${e}:${t}:${n}`
}
function h_(e, t) {
  return `decode:${e}:${t}`
}
function g_(e) {
  return e.map(e => ({
    id: e.id,
    name: e.name,
    width: e.width,
    height: e.height,
    intrinsics: {
      ...e.intrinsics
    }
  }))
}
function __(e) {
  return e.map(e => ({
    id: e.id,
    name: e.name,
    width: e.width,
    height: e.height,
    gray: new Uint8Array(e.gray),
    rgba: new Uint8ClampedArray(e.rgba),
    intrinsics: M_(e.intrinsics)
  }))
}
function v_(e) {
  return e.map(e => ({
    id: e.id,
    name: e.name,
    width: e.width,
    height: e.height,
    gray: new Uint8Array(e.gray),
    rgba: new Uint8ClampedArray(e.rgba),
    intrinsics: M_(e.intrinsics)
  }))
}
function y_(e, t = {}) {
  let n = t.cloneBuffers === !1 ? e.map(e => ({
    id: e.id,
    name: e.name,
    width: e.width,
    height: e.height,
    gray: e.gray,
    rgba: e.rgba,
    intrinsics: M_(e.intrinsics)
  })) : __(e);
  return {
    schemaVersion: 1,
    frames: n,
    frameCount: n.length,
    totalPixels: n.reduce((e, t) => e + t.width * t.height, 0)
  }
}
function b_(e) {
  return e.map(e => ({
    count: e.count,
    xs: new Float32Array(e.xs),
    ys: new Float32Array(e.ys),
    ...e.scales ? {
      scales: new Float32Array(e.scales)
    } : {},
    ...e.orientations ? {
      orientations: new Float32Array(e.orientations)
    } : {},
    scores: new Float32Array(e.scores),
    descriptors: new Uint32Array(e.descriptors),
    colors: new Uint8Array(e.colors)
  }))
}
function x_(e) {
  return e.map(e => ({
    count: e.count,
    xs: new Float32Array(e.xs),
    ys: new Float32Array(e.ys),
    ...e.scales ? {
      scales: new Float32Array(e.scales)
    } : {},
    ...e.orientations ? {
      orientations: new Float32Array(e.orientations)
    } : {},
    scores: new Float32Array(e.scores),
    descriptors: new Uint32Array(e.descriptors),
    colors: new Uint8Array(e.colors)
  }))
}
function S_(e, t) {
  return {
    schemaVersion: 1,
    frames: g_(e),
    features: b_(t),
    totalFeatures: t.reduce((e, t) => e + t.count, 0)
  }
}
function C_(e) {
  return {
    pairs: e.pairs.map(e => ({
      i: e.i,
      j: e.j
    })),
    effectiveStrategy: e.effectiveStrategy,
    ...e.reason ? {
      reason: e.reason
    } : {}
  }
}
function w_(e) {
  return C_(e)
}
function T_(e) {
  let t = C_(e);
  return {
    schemaVersion: 1,
    plan: t,
    pairCount: t.pairs.length
  }
}
function E_(e, t) {
  if (e.length !== t.length)
    throw Error(`Descriptor match serialization requires one match list per pair`);
  return e.map((e, n) => {
    let r = t[n]
      , i = new Uint32Array(r.length * 3);
    for (let e = 0; e < r.length; e++) {
      let t = r[e];
      i[e * 3] = t.a,
        i[e * 3 + 1] = t.b,
        i[e * 3 + 2] = t.distance
    }
    return {
      i: e.i,
      j: e.j,
      count: r.length,
      triples: i
    }
  }
  )
}
function D_(e) {
  return {
    pairs: e.map(e => ({
      i: e.i,
      j: e.j
    })),
    matches: e.map(e => {
      let t = Array(e.count);
      for (let n = 0; n < e.count; n++)
        t[n] = {
          a: e.triples[n * 3],
          b: e.triples[n * 3 + 1],
          distance: e.triples[n * 3 + 2]
        };
      return t
    }
    )
  }
}
function O_(e, t) {
  let n = E_(e, t);
  return {
    schemaVersion: 1,
    pairs: n,
    pairCount: n.length,
    matchCount: t.reduce((e, t) => e + t.length, 0)
  }
}
function k_(e) {
  let t = A_(e);
  return {
    schemaVersion: 1,
    model: t,
    pointCount: t.points.length,
    registeredImages: t.stats.registeredImages
  }
}
function A_(e) {
  return {
    cameras: e.cameras.map(M_),
    poses: e.poses.map(N_),
    points: e.points.map(P_),
    images: e.images.map(e => ({
      id: e.id,
      cameraId: e.cameraId,
      name: e.name,
      qvec: R_(e.qvec),
      tvec: L_(e.tvec),
      xys: e.xys.map(e => [e[0], e[1]]),
      point3DIds: [...e.point3DIds]
    })),
    stats: {
      gpuScoring: e.stats.gpuScoring,
      features: [...e.stats.features],
      matches: [...e.stats.matches],
      registeredImages: e.stats.registeredImages,
      medianReprojectionError: e.stats.medianReprojectionError,
      candidateTracks: e.stats.candidateTracks,
      guidedObservations: e.stats.guidedObservations,
      meanTrackLength: e.stats.meanTrackLength,
      longTracks: e.stats.longTracks,
      weakLinks: e.stats.weakLinks,
      diagnostics: e.stats.diagnostics.map(F_),
      ...e.stats.bundleAdjust ? {
        bundleAdjust: I_(e.stats.bundleAdjust)
      } : {}
    }
  }
}
function j_(e) {
  let t = z_(e)
    , n = 2166136261;
  for (let e = 0; e < t.length; e++)
    n ^= t.charCodeAt(e),
      n = Math.imul(n, 16777619) >>> 0;
  return n.toString(16).padStart(8, `0`)
}
function M_(e) {
  return {
    ...e
  }
}
function N_(e) {
  return {
    ...e,
    center: L_(e.center),
    R: [...e.R],
    qvec: R_(e.qvec),
    tvec: L_(e.tvec)
  }
}
function P_(e) {
  return {
    id: e.id,
    xyz: L_(e.xyz),
    rgb: L_(e.rgb),
    error: e.error,
    track: e.track.map(e => ({
      imageId: e.imageId,
      point2DIdx: e.point2DIdx
    }))
  }
}
function F_(e) {
  return {
    ...e
  }
}
function I_(e) {
  return {
    iterations: e.iterations,
    acceptedSteps: e.acceptedSteps,
    errorBefore: e.errorBefore,
    errorAfter: e.errorAfter,
    optimisedCameras: e.optimisedCameras,
    anchoredCameras: e.anchoredCameras,
    intrinsicSteps: e.intrinsicSteps,
    distortionSteps: e.distortionSteps,
    optimisedIntrinsics: e.optimisedIntrinsics,
    focalScale: e.focalScale,
    radialK1: e.radialK1,
    ...e.secondPass ? {
      secondPass: {
        iterations: e.secondPass.iterations,
        acceptedSteps: e.secondPass.acceptedSteps,
        errorBefore: e.secondPass.errorBefore,
        errorAfter: e.secondPass.errorAfter
      }
    } : {}
  }
}
function L_(e) {
  return [e[0], e[1], e[2]]
}
function R_(e) {
  return [e[0], e[1], e[2], e[3]]
}
function z_(e) {
  if (e === void 0)
    return `"__undefined__"`;
  if (typeof e != `object` || !e)
    return JSON.stringify(e);
  if (Array.isArray(e))
    return `[${e.map(e => z_(e)).join(`,`)}]`;
  if (ArrayBuffer.isView(e))
    return e instanceof DataView ? z_(Array.from(new Uint8Array(e.buffer, e.byteOffset, e.byteLength))) : z_(Array.from(e));
  let t = e;
  return `{${Object.keys(t).sort().map(e => `${JSON.stringify(e)}:${z_(t[e])}`).join(`,`)}}`
}
function B_(e) {
  let t = W_(e.verifiedDiagnostics ?? []);
  return e.descriptorMatches?.runnablePairs.length ? e.descriptorMatches.runnablePairs.map((n, r) => {
    let i = K_(n.i, n.j)
      , a = t.get(i);
    if (a)
      return {
        ...a
      };
    let o = e.descriptorMatches?.matches[r]?.length ?? 0;
    return G_(e.frames, n.i, n.j, o, o, o > 0 ? `descriptor matches only; not geometrically verified` : `no descriptor matches`)
  }
  ) : e.pairPlan ? e.pairPlan.pairs.map(n => {
    let r = K_(n.i, n.j)
      , i = t.get(r);
    return i ? {
      ...i
    } : G_(e.frames, n.i, n.j, 0, 0, `candidate pair only; descriptor matching not available`)
  }
  ) : []
}
function V_(e) {
  return e.filter(e => H_(e))
}
function H_(e) {
  return e.leftIndex >= 0 && e.rightIndex >= 0
}
function U_(e) {
  return `${q_(e.leftIndex, e.leftImage)}->${q_(e.rightIndex, e.rightImage)}`
}
function W_(e) {
  let t = new Map;
  for (let n of e)
    t.set(K_(n.leftIndex, n.rightIndex), n);
  return t
}
function G_(e, t, n, r, i, a) {
  return {
    leftImage: e[t]?.name ?? `image ${t + 1}`,
    rightImage: e[n]?.name ?? `image ${n + 1}`,
    leftIndex: t,
    rightIndex: n,
    gap: Math.abs(n - t),
    rawMatches: r,
    filteredMatches: i,
    inliers: 0,
    status: `skipped`,
    note: a
  }
}
function K_(e, t) {
  return `${e}:${t}`
}
function q_(e, t) {
  return e >= 0 ? String(e + 1) : t || `n/a`
}
function J_(e) {
  return e === `dense` ? {
    maxFeatures: 4600,
    threshold: 18,
    minMatches: 18,
    maxPointsPerPair: 2800,
    maxTrackGap: 4,
    guidedTrackRadius: 18,
    guidedDescriptorDistance: 76,
    maxLongEdge: 3200,
    pyramidOctaves: 5,
    pairStrategy: `exhaustive`,
    retrievalTopK: 48,
    pairCandidateBudget: 0,
    geometryCandidateBudget: 0,
    pnpMinInliers: 22,
    pnpPixelThreshold: 4,
    relativePoseRansacIterations: 1500,
    triangulationReprojectionPx: 6,
    triangulationMinParallaxDeg: .5,
    minVerifiedParallaxDeg: .35,
    visualBridgeMode: `retrieval`,
    visualBridgeCandidates: 160,
    visualBridgeSignatureMax: 128,
    visualBridgeMinInliers: 70,
    visualBridgePairsPerComponent: 6,
    useMasksForSfm: !0
  } : e === `fast` ? {
    maxFeatures: 2200,
    threshold: 24,
    minMatches: 18,
    maxPointsPerPair: 1400,
    maxTrackGap: 2,
    guidedTrackRadius: 0,
    guidedDescriptorDistance: 0,
    maxLongEdge: 1600,
    pyramidOctaves: 4,
    pairStrategy: `sequential`,
    retrievalTopK: 16,
    pairCandidateBudget: 0,
    geometryCandidateBudget: 0,
    pnpMinInliers: 14,
    pnpPixelThreshold: 5,
    relativePoseRansacIterations: 320,
    triangulationReprojectionPx: 7,
    triangulationMinParallaxDeg: .4,
    minVerifiedParallaxDeg: .25,
    visualBridgeMode: `retrieval`,
    visualBridgeCandidates: 48,
    visualBridgeSignatureMax: 112,
    visualBridgeMinInliers: 70,
    visualBridgePairsPerComponent: 3,
    useMasksForSfm: !0
  } : {
    maxFeatures: 3200,
    threshold: 20,
    minMatches: 18,
    maxPointsPerPair: 2200,
    maxTrackGap: 3,
    guidedTrackRadius: 14,
    guidedDescriptorDistance: 70,
    maxLongEdge: 2400,
    pyramidOctaves: 4,
    pairStrategy: `retrieval`,
    retrievalTopK: 32,
    pairCandidateBudget: 0,
    geometryCandidateBudget: 0,
    pnpMinInliers: 18,
    pnpPixelThreshold: 4,
    relativePoseRansacIterations: 1500,
    triangulationReprojectionPx: 6,
    triangulationMinParallaxDeg: .5,
    minVerifiedParallaxDeg: .35,
    visualBridgeMode: `retrieval`,
    visualBridgeCandidates: 96,
    visualBridgeSignatureMax: 124,
    visualBridgeMinInliers: 60,
    visualBridgePairsPerComponent: 5,
    useMasksForSfm: !0
  }
}
function Y_(e, t) {
  return {
    ...J_(e),
    ...X_(t)
  }
}
function X_(e) {
  return e === `building-loop` ? {
    maxFeatures: 5200,
    threshold: 18,
    minMatches: 22,
    maxPointsPerPair: 3600,
    maxTrackGap: 4,
    guidedTrackRadius: 18,
    guidedDescriptorDistance: 76,
    maxLongEdge: 3200,
    pyramidOctaves: 5,
    pairStrategy: `exhaustive`,
    retrievalTopK: 128,
    pairCandidateBudget: 0,
    geometryCandidateBudget: 0,
    pnpMinInliers: 28,
    pnpPixelThreshold: 5,
    relativePoseRansacIterations: 2500,
    triangulationReprojectionPx: 6,
    triangulationMinParallaxDeg: .45,
    minVerifiedParallaxDeg: .3,
    visualBridgeMode: `component-exhaustive`,
    visualBridgeCandidates: 240,
    visualBridgeSignatureMax: 140,
    visualBridgeMinInliers: 70,
    visualBridgePairsPerComponent: 10,
    useMasksForSfm: !1
  } : e === `small-object` ? {
    maxFeatures: 6e3,
    threshold: 16,
    minMatches: 28,
    maxPointsPerPair: 3e3,
    guidedTrackRadius: 12,
    guidedDescriptorDistance: 68,
    maxLongEdge: 2400,
    pyramidOctaves: 4,
    pairStrategy: `exhaustive`,
    retrievalTopK: 64,
    pairCandidateBudget: 0,
    geometryCandidateBudget: 0,
    pnpMinInliers: 28,
    pnpPixelThreshold: 3.5,
    relativePoseRansacIterations: 8e3,
    triangulationReprojectionPx: 4.5,
    triangulationMinParallaxDeg: 1,
    minVerifiedParallaxDeg: .5,
    visualBridgeMode: `retrieval`,
    visualBridgeCandidates: 96,
    visualBridgeSignatureMax: 124,
    visualBridgeMinInliers: 55,
    visualBridgePairsPerComponent: 5,
    useMasksForSfm: !0
  } : e === `large-images` ? {
    maxFeatures: 6400,
    threshold: 16,
    minMatches: 20,
    maxPointsPerPair: 3600,
    guidedTrackRadius: 18,
    guidedDescriptorDistance: 76,
    maxLongEdge: 4096,
    pyramidOctaves: 6,
    pairStrategy: `retrieval`,
    retrievalTopK: 64,
    pairCandidateBudget: 4096,
    geometryCandidateBudget: 2400,
    pnpMinInliers: 24,
    pnpPixelThreshold: 4.5,
    relativePoseRansacIterations: 2200,
    triangulationReprojectionPx: 6,
    triangulationMinParallaxDeg: .5,
    visualBridgeMode: `retrieval`,
    visualBridgeCandidates: 160,
    visualBridgeSignatureMax: 132,
    visualBridgeMinInliers: 65,
    visualBridgePairsPerComponent: 6,
    useMasksForSfm: !0
  } : e === `aerial-drone` ? {
    maxFeatures: 5600,
    threshold: 18,
    minMatches: 16,
    maxPointsPerPair: 3200,
    maxTrackGap: 6,
    guidedTrackRadius: 18,
    guidedDescriptorDistance: 76,
    maxLongEdge: 2600,
    pyramidOctaves: 5,
    pairStrategy: `retrieval`,
    retrievalTopK: 48,
    pairCandidateBudget: 2400,
    geometryCandidateBudget: 1600,
    pnpMinInliers: 18,
    pnpPixelThreshold: 5,
    relativePoseRansacIterations: 1500,
    triangulationReprojectionPx: 7,
    triangulationMinParallaxDeg: .35,
    minVerifiedParallaxDeg: .2,
    visualBridgeMode: `retrieval`,
    visualBridgeCandidates: 192,
    visualBridgeSignatureMax: 150,
    visualBridgeMinInliers: 50,
    visualBridgePairsPerComponent: 8,
    useMasksForSfm: !1
  } : e === `video` ? {
    maxFeatures: 2400,
    threshold: 24,
    minMatches: 18,
    maxPointsPerPair: 1500,
    maxTrackGap: 3,
    guidedTrackRadius: 0,
    guidedDescriptorDistance: 0,
    maxLongEdge: 1800,
    pyramidOctaves: 4,
    pairStrategy: `sequential`,
    retrievalTopK: 16,
    pairCandidateBudget: 0,
    geometryCandidateBudget: 0,
    pnpMinInliers: 14,
    pnpPixelThreshold: 5,
    relativePoseRansacIterations: 320,
    triangulationReprojectionPx: 7,
    triangulationMinParallaxDeg: .4,
    minVerifiedParallaxDeg: .25,
    visualBridgeMode: `retrieval`,
    visualBridgeCandidates: 48,
    visualBridgeSignatureMax: 112,
    visualBridgeMinInliers: 70,
    visualBridgePairsPerComponent: 3,
    useMasksForSfm: !0
  } : {}
}
function Z_(e) {
  let t = 0;
  for (let n of e)
    n.gap === 1 && n.status === `weak` && n.note.includes(`large camera-center jump`) && t++;
  return t
}
function Q_(e) {
  let t = Z_(e);
  return t === 0 ? null : `Diagnostics: ${t} adjacent camera-path jump${t === 1 ? `` : `s`} remain after verification. Add the missing bridge frames or split the sequence around the jump before export.`
}
function $_(e) {
  let t = new Set;
  for (let n of e)
    n.registered && n.componentId >= 0 && t.add(n.componentId);
  return t.size <= 1 ? null : `Diagnostics: ${t.size} disconnected camera components remain. Their relative scale and orientation are not metric unless stitched by shared 3D correspondences; add manual bridge annotations or export/split components separately.`
}
var ev = `/splat_demo.html`
  , tv = `/splat_mesh_trainer.html`
  , nv = `websfm:splat-trainer-dataset`;
function rv(e) {
  return qd(e, {
    binary: !0
  })
}
function iv(e) {
  return ov(ev, e)
}
function av(e) {
  return ov(tv, e)
}
function ov(e, t) {
  let n = new URL(e, t.baseHref);
  return t.plyUrl && n.searchParams.set(`ply`, t.plyUrl),
    t.name && n.searchParams.set(`name`, t.name),
    t.datasetUrl && n.searchParams.set(`dataset`, t.datasetUrl),
    t.datasetName && n.searchParams.set(`datasetName`, t.datasetName),
    n.toString()
}
var sv = {
  light: {
    background: 16382715,
    gridMajor: 13686751,
    gridMinor: 15199215,
    cameraLine: 6252917,
    cameraAccent: 16742936
  },
  dark: {
    background: 725015,
    gridMajor: 3227732,
    gridMinor: 1778994,
    cameraLine: 10135736,
    cameraAccent: 16747060
  }
}
  , cv = [16747060, 5625520, 5941759, 15753087, 11832575, 15911244, 8116367, 16752506]
  , lv = class {
    host;
    renderer;
    canvas;
    scene = new S;
    camera = new l(50, 1, .01, 1e3);
    controls;
    grid;
    pointCloud;
    cameraLines;
    cameraCenters;
    cameraPaths;
    cameraImageSprites;
    retiredSceneObjects = [];
    cameraImagePreviews = [];
    cameraImagesVisible = !0;
    animation = 0;
    resizeObserver;
    model;
    cameraMode = `raw`;
    flipUp = !1;
    theme = `light`;
    needsRender = !0;
    rendererReady = !1;
    rendererUnavailable = !1;
    rendererInitPromise;
    disposed = !1;
    constructor(e) {
      this.host = e,
        this.canvas = document.createElement(`canvas`),
        this.canvas.dataset.rendererBackend = `webgpu-pending`,
        this.canvas.dataset.cameraImagesVisible = `true`,
        this.canvas.dataset.cameraImageCount = `0`,
        this.canvas.dataset.componentCount = `0`,
        this.canvas.dataset.cameraPathCount = `0`,
        e.appendChild(this.canvas),
        this.camera.position.set(4, 3, -8),
        this.controls = new v(this.camera, this.canvas),
        this.controls.enableDamping = !0,
        this.controls.target.set(1.5, 0, 8),
        this.controls.addEventListener(`change`, this.requestRender),
        this.scene.background = new _(sv.light.background),
        this.scene.add(new g(16777215, 1)),
        this.grid = new d(24, 24, sv.light.gridMajor, sv.light.gridMinor),
        this.grid.position.y = -1.5,
        this.scene.add(this.grid),
        this.applySceneTheme(),
        typeof ResizeObserver < `u` && (this.resizeObserver = new ResizeObserver(() => this.resize()),
          this.resizeObserver.observe(e)),
        window.addEventListener(`resize`, this.resize),
        this.resize(),
        this.tick()
    }
    setModel(e) {
      this.model = e,
        this.ensureRendererInitialized(),
        this.renderModel(e)
    }
    setCameraImagePreviews(e) {
      this.cameraImagePreviews = e.map(e => ({
        ...e
      })),
        this.model ? this.renderModel(this.model) : this.updateCameraImageDataset(0)
    }
    setCameraImagesVisible(e) {
      if (this.cameraImagesVisible === e) {
        this.updateCameraImageDataset(this.cameraImageSprites?.children.length ?? 0);
        return
      }
      this.cameraImagesVisible = e,
        this.cameraImageSprites && (this.cameraImageSprites.visible = e),
        this.updateCameraImageDataset(this.cameraImageSprites?.children.length ?? 0),
        this.requestRender()
    }
    setCameraDisplayMode(e) {
      this.cameraMode !== e && (this.cameraMode = e,
        this.model && this.renderModel(this.model))
    }
    setFlipUp(e) {
      this.flipUp !== e && (this.flipUp = e,
        this.model && this.renderModel(this.model))
    }
    setTheme(e) {
      this.theme !== e && (this.theme = e,
        this.applySceneTheme())
    }
    syncLayout() {
      this.resize()
    }
    dispose() {
      this.disposed || (this.disposed = !0,
        cancelAnimationFrame(this.animation),
        this.resizeObserver?.disconnect(),
        window.removeEventListener(`resize`, this.resize),
        this.controls.removeEventListener(`change`, this.requestRender),
        this.controls.dispose(),
        this.clearSceneObjects(),
        this.scene.traverse(e => {
          if (e instanceof f || e instanceof o || e instanceof c) {
            e.geometry?.dispose?.();
            let t = e.material;
            Array.isArray(t) ? t.forEach(e => e.dispose()) : t?.dispose?.()
          }
        }
        ),
        this.disposeRetiredSceneObjects(),
        this.renderer?.dispose(),
        this.canvas.remove())
    }
    renderModel(t) {
      this.clearSceneObjects();
      let i = nm(t)
        , a = kv(t, this.cameraMode, this.flipUp);
      if (t.points.length > 0) {
        let e = new Float32Array(t.points.length * 3)
          , i = new Float32Array(t.points.length * 3);
        for (let n = 0; n < t.points.length; n++) {
          let r = t.points[n]
            , o = Iv(a.transform, r.xyz);
          e[n * 3] = o[0],
            e[n * 3 + 1] = o[1],
            e[n * 3 + 2] = o[2],
            i[n * 3] = r.rgb[0] / 255,
            i[n * 3 + 1] = r.rgb[1] / 255,
            i[n * 3 + 2] = r.rgb[2] / 255
        }
        let o = new m;
        o.setAttribute(`position`, new r(e, 3)),
          o.setAttribute(`color`, new r(i, 3)),
          this.pointCloud = new c(o, new n({
            size: .035,
            vertexColors: !0,
            sizeAttenuation: !0
          })),
          this.scene.add(this.pointCloud)
      }
      let o = Ov(t, a)
        , l = Math.max(1, o.getSize(new e).length())
        , u = xv(t, l, a);
      pv(u) > 0 ? (this.cameraLines = new h(u, new s({
        color: sv[this.theme].cameraLine
      })),
        this.scene.add(this.cameraLines)) : u.dispose();
      let d = Cv(t, a);
      pv(d) > 0 ? (this.cameraCenters = new c(d, new n({
        size: Math.max(.025, l * .0035),
        sizeAttenuation: !0,
        vertexColors: !0
      })),
        this.scene.add(this.cameraCenters)) : d.dispose(),
        this.cameraPaths = wv(t, a),
        this.scene.add(this.cameraPaths),
        this.cameraImageSprites = Dv(t, l, a, this.cameraImagePreviews, () => this.requestRender()),
        this.cameraImageSprites.visible = this.cameraImagesVisible,
        this.scene.add(this.cameraImageSprites),
        this.updateCameraImageDataset(this.cameraImageSprites.children.length),
        this.updateComponentDataset(i.length, this.cameraPaths.children.length),
        this.placeGrid(o, l),
        this.frameModel(o),
        this.requestRender()
    }
    clearSceneObjects() {
      for (let e of [this.pointCloud, this.cameraLines, this.cameraCenters, this.cameraPaths, this.cameraImageSprites])
        e && (this.scene.remove(e),
          this.queueSceneObjectDisposal(e));
      this.pointCloud = void 0,
        this.cameraLines = void 0,
        this.cameraCenters = void 0,
        this.cameraPaths = void 0,
        this.cameraImageSprites = void 0,
        this.updateCameraImageDataset(0),
        this.updateComponentDataset(0, 0)
    }
    queueSceneObjectDisposal(e) {
      this.retiredSceneObjects.push(e)
    }
    disposeRetiredSceneObjects() {
      for (; this.retiredSceneObjects.length > 0;) {
        let e = this.retiredSceneObjects.pop();
        e && Rv(e)
      }
    }
    retireSceneObjectsAfterFrame() {
      this.disposeRetiredSceneObjects()
    }
    updateCameraImageDataset(e) {
      this.canvas.dataset.cameraImagesVisible = this.cameraImagesVisible ? `true` : `false`,
        this.canvas.dataset.cameraImageCount = String(this.cameraImagesVisible ? e : 0),
        this.canvas.dataset.cameraImageAvailableCount = String(e)
    }
    updateComponentDataset(e, t) {
      this.canvas.dataset.componentCount = String(e),
        this.canvas.dataset.cameraPathCount = String(t)
    }
    resize = () => {
      let e = this.host.getBoundingClientRect()
        , t = Math.round(e.width)
        , n = Math.round(e.height);
      if (t <= 0 || n <= 0)
        return;
      this.camera.aspect = t / n,
        this.camera.updateProjectionMatrix();
      let r = Math.min(window.devicePixelRatio || 1, 2);
      this.canvas.width = Math.max(1, Math.round(t * r)),
        this.canvas.height = Math.max(1, Math.round(n * r)),
        this.renderer?.setSize(t, n, !1),
        this.requestRender()
    }
      ;
    requestRender = () => {
      this.needsRender = !0
    }
      ;
    ensureRendererInitialized() {
      this.disposed || this.rendererReady || this.rendererInitPromise || (this.rendererUnavailable = !1,
        this.canvas.dataset.rendererBackend = `webgpu-pending`,
        delete this.canvas.dataset.rendererError,
        this.rendererInitPromise = this.initializeRenderer().finally(() => {
          this.rendererInitPromise = void 0
        }
        ))
    }
    tick = () => {
      this.disposed || (this.controls.update() && (this.needsRender = !0),
        this.rendererUnavailable ? this.needsRender && (this.renderFallback2d(),
          this.needsRender = !1,
          this.retireSceneObjectsAfterFrame()) : this.needsRender && this.rendererReady && this.renderer && (this.renderer.render(this.scene, this.camera),
            this.needsRender = !1,
            this.retireSceneObjectsAfterFrame()),
        this.animation = requestAnimationFrame(this.tick))
    }
      ;
    async initializeRenderer() {
      if (!navigator.gpu) {
        this.markRendererUnavailable(Error(`WebGPU is required for the reconstruction viewer.`));
        return
      }
      try {
        let e = await Tr();
        if (this.disposed)
          return;
        if (!e || e.lost)
          throw Error(`WebGPU adapter is unavailable for the reconstruction viewer.`);
        let t = this.canvas.getContext(`webgpu`);
        if (!t)
          throw Error(`WebGPU canvas context is unavailable for the reconstruction viewer.`);
        if (this.renderer = new p({
          antialias: !0,
          alpha: !0,
          canvas: this.canvas,
          context: t,
          device: e.device
        }),
          uv(this.renderer),
          this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2)),
          this.renderer.outputColorSpace = b,
          this.renderer.setClearColor(sv[this.theme].background, 1),
          this.resize(),
          await this.renderer.init(),
          this.disposed)
          return;
        if (!dv(this.renderer))
          throw Error(`Three.js initialized a non-WebGPU backend for the reconstruction viewer.`);
        this.rendererReady = !0,
          this.rendererUnavailable = !1,
          this.canvas.dataset.rendererBackend = `webgpu`,
          delete this.canvas.dataset.rendererError,
          this.requestRender()
      } catch (e) {
        try {
          this.renderer?.dispose()
        } catch { }
        this.renderer = void 0,
          this.rendererReady = !1,
          this.disposed || this.markRendererUnavailable(e)
      }
    }
    markRendererUnavailable(e) {
      this.rendererUnavailable = !0,
        this.canvas.dataset.rendererBackend = `webgpu-error`,
        this.canvas.dataset.rendererError = e instanceof Error ? e.message : String(e),
        this.requestRender(),
        console.warn(`Reconstruction viewer WebGPU initialization failed; using Canvas2D fallback when a model is available.`, e)
    }
    renderFallback2d() {
      let e = this.model
        , t = this.canvas.getContext(`2d`);
      if (!e || !t)
        return;
      let n = this.canvas.width
        , r = this.canvas.height;
      if (n <= 0 || r <= 0)
        return;
      let i = sv[this.theme];
      t.fillStyle = `#${i.background.toString(16).padStart(6, `0`)}`,
        t.fillRect(0, 0, n, r);
      let a = kv(e, this.cameraMode, this.flipUp)
        , o = mv(e, a, n, r);
      if (!o) {
        this.canvas.dataset.rendererBackend = `canvas2d-fallback`,
          delete this.canvas.dataset.rendererError;
        return
      }
      gv(t, n, r, i),
        vv(t, e, a, o),
        _v(t, e, a, o),
        yv(t, e, a, o),
        this.canvas.dataset.rendererBackend = `canvas2d-fallback`,
        delete this.canvas.dataset.rendererError
    }
    frameModel(t) {
      if (t.isEmpty())
        return;
      let n = t.getCenter(new e)
        , r = Math.max(1, t.getSize(new e).length());
      this.controls.target.copy(n),
        this.camera.position.set(n.x + r * .55, n.y + r * .82, n.z + r * .72),
        this.camera.near = Math.max(.01, r / 1e3),
        this.camera.far = r * 10,
        this.camera.updateProjectionMatrix()
    }
    placeGrid(t, n) {
      if (t.isEmpty()) {
        this.grid.position.set(0, -1.5, 0),
          this.grid.scale.set(1, 1, 1);
        return
      }
      let r = t.getCenter(new e);
      this.grid.position.set(r.x, t.min.y - n * .05, r.z);
      let i = Math.max(2, n * 1.5) / 24;
      this.grid.scale.setScalar(i)
    }
    applySceneTheme() {
      let e = sv[this.theme];
      this.scene.background = new _(e.background),
        this.renderer?.setClearColor(e.background, 1),
        this.canvas.style.backgroundColor = `#${e.background.toString(16).padStart(6, `0`)}`,
        this.updateGridColors(e.gridMajor, e.gridMinor),
        fv(this.cameraLines, e.cameraLine),
        this.requestRender()
    }
    updateGridColors(e, t) {
      let n = this.grid.geometry.getAttribute(`color`);
      if (!(n instanceof r))
        return;
      let i = new _(e)
        , a = new _(t)
        , o = new _;
      for (let e = 0; e < n.count; e++) {
        let t = Math.floor(e / 2)
          , r = t === 24 || t === 25;
        o.copy(r ? i : a),
          n.setXYZ(e, o.r, o.g, o.b)
      }
      n.needsUpdate = !0
    }
  }
  ;
function uv(e) {
  let t = e;
  t._getFallback = null
}
function dv(e) {
  return e.backend?.isWebGPUBackend === !0
}
function fv(e, t) {
  if (!e)
    return;
  let n = e.material;
  n.color.setHex(t),
    n.needsUpdate = !0
}
function pv(e) {
  return e.getAttribute(`position`)?.count ?? 0
}
function mv(e, t, n, r) {
  let i = [];
  for (let n of e.points)
    i.push(hv(Iv(t.transform, n.xyz)));
  for (let n = 0; n < e.poses.length; n++) {
    let r = e.poses[n];
    if (!r.registered)
      continue;
    let a = t.cameraCenters[n] ?? r.center;
    i.push(hv(Iv(t.transform, a)))
  }
  if (i.length === 0)
    return null;
  let a = 1 / 0
    , o = 1 / 0
    , s = -1 / 0
    , c = -1 / 0;
  for (let [e, t] of i)
    !Number.isFinite(e) || !Number.isFinite(t) || (a = Math.min(a, e),
      o = Math.min(o, t),
      s = Math.max(s, e),
      c = Math.max(c, t));
  if (!Number.isFinite(a) || !Number.isFinite(o))
    return null;
  s - a < 1e-6 && (--a,
    s += 1),
    c - o < 1e-6 && (--o,
      c += 1);
  let l = Math.max(16, Math.min(n, r) * .08)
    , u = Math.max(1e-6, Math.min((n - l * 2) / (s - a), (r - l * 2) / (c - o)));
  return {
    scale: u,
    project(e) {
      let [t, n] = hv(e);
      return [l + (t - a) * u, l + (n - o) * u]
    }
  }
}
function hv(e) {
  return [e[0], e[2] - e[1] * .35]
}
function gv(e, t, n, r) {
  e.save(),
    e.strokeStyle = `#${r.gridMinor.toString(16).padStart(6, `0`)}`,
    e.globalAlpha = .6,
    e.lineWidth = Math.max(1, Math.min(t, n) / 900);
  for (let r = 1; r < 8; r++) {
    let i = t * r / 8
      , a = n * r / 8;
    e.beginPath(),
      e.moveTo(i, 0),
      e.lineTo(i, n),
      e.stroke(),
      e.beginPath(),
      e.moveTo(0, a),
      e.lineTo(t, a),
      e.stroke()
  }
  e.restore()
}
function _v(e, t, n, r) {
  let i = Math.max(1, Math.ceil(t.points.length / 8e4))
    , a = Math.max(1, Math.min(2.2, r.scale * .01));
  e.save(),
    e.globalAlpha = .95;
  for (let o = 0; o < t.points.length; o += i) {
    let i = t.points[o]
      , [s, c] = r.project(Iv(n.transform, i.xyz));
    e.fillStyle = `rgb(${i.rgb[0]}, ${i.rgb[1]}, ${i.rgb[2]})`,
      e.fillRect(s - a * .5, c - a * .5, a, a)
  }
  e.restore()
}
function vv(e, t, n, r) {
  e.save(),
    e.globalAlpha = .9,
    e.lineWidth = 2;
  for (let i of nm(t)) {
    e.strokeStyle = bv(Ev(i.id)),
      e.beginPath();
    let a = !1;
    for (let o of i.poseIndices) {
      let i = t.poses[o];
      if (!i?.registered)
        continue;
      let s = Iv(n.transform, n.cameraCenters[o] ?? i.center)
        , [c, l] = r.project(s);
      a ? e.lineTo(c, l) : (e.moveTo(c, l),
        a = !0)
    }
    a && e.stroke()
  }
  e.restore()
}
function yv(e, t, n, r) {
  e.save();
  let i = Math.max(3, Math.min(7, r.scale * .035));
  for (let a = 0; a < t.poses.length; a++) {
    let o = t.poses[a];
    if (!o.registered)
      continue;
    let s = Iv(n.transform, n.cameraCenters[a] ?? o.center)
      , [c, l] = r.project(s);
    e.fillStyle = bv(Ev(o.componentId)),
      e.strokeStyle = `rgba(0, 0, 0, 0.45)`,
      e.lineWidth = 1,
      e.beginPath(),
      e.arc(c, l, i, 0, Math.PI * 2),
      e.fill(),
      e.stroke()
  }
  e.restore()
}
function bv(e) {
  return `#${e.toString(16).padStart(6, `0`)}`
}
function xv(e, t, n) {
  let r = []
    , i = Math.max(.025, Math.min(.095, t * .0038))
    , o = Sv(e);
  for (let t = 0; t < e.poses.length; t++) {
    let a = e.poses[t];
    if (!a.registered)
      continue;
    let s = o.get(a.imageId)
      , c = s && s.height ? s.width / s.height : 1.33
      , l = n.cameraCenters[t] ?? a.center
      , u = [Gv(a.R, l, [-i * c, -i, i * 1.8]), Gv(a.R, l, [i * c, -i, i * 1.8]), Gv(a.R, l, [i * c, i, i * 1.8]), Gv(a.R, l, [-i * c, i, i * 1.8])]
      , d = Iv(n.transform, l)
      , f = u.map(e => Iv(n.transform, e));
    for (let e of f)
      qv(r, d, e);
    qv(r, f[0], f[1]),
      qv(r, f[1], f[2]),
      qv(r, f[2], f[3]),
      qv(r, f[3], f[0])
  }
  let s = new m;
  return s.setAttribute(`position`, new a(r, 3)),
    s
}
function Sv(e) {
  let t = new Map;
  for (let n of e.images) {
    let r = e.cameras[n.cameraId - 1];
    r && t.set(n.id, r)
  }
  if (t.size === 0)
    for (let n = 0; n < e.poses.length; n++) {
      let r = e.cameras[n];
      r && t.set(e.poses[n].imageId, r)
    }
  return t
}
function Cv(e, t) {
  let n = []
    , r = [];
  for (let i = 0; i < e.poses.length; i++) {
    let a = e.poses[i];
    if (!a.registered)
      continue;
    let o = Iv(t.transform, t.cameraCenters[i] ?? a.center);
    n.push(o[0], o[1], o[2]);
    let s = new _(Ev(a.componentId));
    r.push(s.r, s.g, s.b)
  }
  let i = new m;
  return i.setAttribute(`position`, new a(n, 3)),
    i.setAttribute(`color`, new a(r, 3)),
    i
}
function wv(e, t) {
  let n = new y;
  for (let r of nm(e)) {
    let i = Tv(e, t, r.poseIndices);
    if (pv(i) < 2) {
      i.dispose();
      continue
    }
    let a = new o(i, new s({
      color: Ev(r.id),
      transparent: !0,
      opacity: .92
    }));
    a.userData.componentId = r.id,
      n.add(a)
  }
  return n
}
function Tv(e, t, n) {
  let r = [];
  for (let i of n) {
    let n = e.poses[i];
    if (!n.registered)
      continue;
    let a = Iv(t.transform, t.cameraCenters[i] ?? n.center);
    r.push(a[0], a[1], a[2])
  }
  let i = new m;
  return i.setAttribute(`position`, new a(r, 3)),
    i
}
function Ev(e) {
  return e < 0 ? cv[0] : cv[e % cv.length]
}
function Dv(e, n, r, a, o) {
  let s = new y
    , c = new Map(a.map(e => [e.name, e]))
    , l = n * .035
    , u = Math.max(.06, n * .055);
  for (let n = 0; n < e.poses.length; n++) {
    let a = e.poses[n];
    if (!a.registered)
      continue;
    let d = c.get(a.name);
    if (!d)
      continue;
    let f = new t().load(d.url, o);
    f.colorSpace = b;
    let p = new i(new x({
      map: f,
      transparent: !0,
      opacity: .82,
      depthWrite: !1
    }))
      , m = r.cameraCenters[n] ?? a.center
      , h = Zv(Iv(r.transform, m), Qv(Lv(r.transform, Kv(a.R, [0, 0, -1])), l));
    p.position.set(h[0], h[1], h[2]);
    let g = Sv(e).get(a.imageId)
      , _ = d.width && d.height ? d.width / d.height : g && g.height ? g.width / g.height : 1.33;
    p.scale.set(u * Math.max(.45, Math.min(2.4, _)), u, 1),
      s.add(p)
  }
  return s
}
function Ov(t, n) {
  let r = new u
    , i = new e;
  for (let e of t.points) {
    let t = Iv(n.transform, e.xyz);
    r.expandByPoint(i.set(t[0], t[1], t[2]))
  }
  for (let e of n.cameraCenters) {
    if (!e)
      continue;
    let t = Iv(n.transform, e);
    r.expandByPoint(i.set(t[0], t[1], t[2]))
  }
  return r
}
function kv(e, t, n) {
  let r = jv(e)
    , i = Mv(e, r)
    , a = e.poses.map(e => {
      if (!e.registered)
        return null;
      if (t === `raw`)
        return e.center;
      let n = Xv(r, Qv(Kv(e.R, [0, 0, 1]), i))
        , a = .92;
      return [e.center[0] * (1 - a) + n[0] * a, e.center[1] * (1 - a) + n[1] * a, e.center[2] * (1 - a) + n[2] * a]
    }
    );
  return {
    transform: Av(e, a, n),
    cameraCenters: a
  }
}
function Av(e, t, n) {
  let r = t.filter(e => !!e);
  if (r.length < 2)
    return {
      origin: [0, 0, 0],
      xAxis: [1, 0, 0],
      yAxis: n ? [0, -1, 0] : [0, 1, 0],
      zAxis: n ? [0, 0, -1] : [0, 0, 1]
    };
  let i = zv(r)
    , a = Bv(r, i)
    , o = Vv(a, [1, 0, 0])
    , s = Vv(Hv(a, o), [0, 0, 1]);
  s = $v(Xv(s, Qv(o, Jv(s, o)))),
    ey(s) < 1e-5 && (s = Uv(o));
  let c = $v(Yv(s, o));
  ey(c) < 1e-5 && (c = [0, 1, 0]);
  let l = Wv(e);
  return Jv(c, l) > 0 && (c = Qv(c, -1)),
    n && (c = Qv(c, -1)),
    s = $v(Yv(o, c)),
  {
    origin: i,
    xAxis: o,
    yAxis: c,
    zAxis: s
  }
}
function jv(e) {
  if (e.points.length === 0)
    return [0, 0, 0];
  let t = e.points.map(e => e.xyz[0]).sort((e, t) => e - t)
    , n = e.points.map(e => e.xyz[1]).sort((e, t) => e - t)
    , r = e.points.map(e => e.xyz[2]).sort((e, t) => e - t);
  return [Pv(t), Pv(n), Pv(r)]
}
function Mv(e, t) {
  let n = [];
  for (let r of e.poses)
    r.registered && n.push(ey(Xv(r.center, t)));
  n.sort((e, t) => e - t);
  let r = Pv(n)
    , i = Nv(e, t)
    , a = Math.max(1, i * .45);
  return !Number.isFinite(r) || r < a * .2 ? a : Math.max(a, Math.min(r, i * 1.6))
}
function Nv(e, t) {
  if (e.points.length === 0)
    return 1;
  let n = e.points.map(e => ey(Xv(e.xyz, t))).sort((e, t) => e - t);
  return Math.max(1, Fv(n, .82))
}
function Pv(e) {
  return Fv(e, .5)
}
function Fv(e, t) {
  return e.length === 0 ? 0 : e[Math.min(e.length - 1, Math.max(0, Math.floor((e.length - 1) * t)))]
}
function Iv(e, t) {
  let n = [t[0] - e.origin[0], t[1] - e.origin[1], t[2] - e.origin[2]];
  return [Jv(n, e.xAxis), Jv(n, e.yAxis), Jv(n, e.zAxis)]
}
function Lv(e, t) {
  return $v([Jv(t, e.xAxis), Jv(t, e.yAxis), Jv(t, e.zAxis)])
}
function Rv(e) {
  e.traverse(e => {
    let t = e;
    t.geometry?.dispose();
    let n = Array.isArray(t.material) ? t.material : t.material ? [t.material] : [];
    for (let e of n)
      e.map?.dispose(),
        e.dispose()
  }
  )
}
function zv(e) {
  let t = [0, 0, 0];
  for (let n of e)
    t[0] += n[0],
      t[1] += n[1],
      t[2] += n[2];
  return [t[0] / e.length, t[1] / e.length, t[2] / e.length]
}
function Bv(e, t) {
  let n = Array(9).fill(0);
  for (let r of e) {
    let e = r[0] - t[0]
      , i = r[1] - t[1]
      , a = r[2] - t[2];
    n[0] += e * e,
      n[1] += e * i,
      n[2] += e * a,
      n[3] += i * e,
      n[4] += i * i,
      n[5] += i * a,
      n[6] += a * e,
      n[7] += a * i,
      n[8] += a * a
  }
  return n.map(t => t / Math.max(1, e.length - 1))
}
function Vv(e, t) {
  let n = $v(t);
  for (let t = 0; t < 24; t++)
    n = $v([e[0] * n[0] + e[1] * n[1] + e[2] * n[2], e[3] * n[0] + e[4] * n[1] + e[5] * n[2], e[6] * n[0] + e[7] * n[1] + e[8] * n[2]]);
  return n
}
function Hv(e, t) {
  let n = Jv(t, [e[0] * t[0] + e[1] * t[1] + e[2] * t[2], e[3] * t[0] + e[4] * t[1] + e[5] * t[2], e[6] * t[0] + e[7] * t[1] + e[8] * t[2]])
    , r = e.slice();
  for (let e = 0; e < 3; e++)
    for (let i = 0; i < 3; i++)
      r[e * 3 + i] -= n * t[e] * t[i];
  return r
}
function Uv(e) {
  let t = Math.abs(e[1]) < .8 ? [0, 1, 0] : [0, 0, 1];
  return $v(Xv(t, Qv(e, Jv(t, e))))
}
function Wv(e) {
  let t = [0, 0, 0]
    , n = 0;
  for (let r of e.poses) {
    if (!r.registered)
      continue;
    let e = Kv(r.R, [0, 0, 1]);
    t[0] += e[0],
      t[1] += e[1],
      t[2] += e[2],
      n++
  }
  return n ? $v(t) : [0, 0, 1]
}
function Gv(e, t, n) {
  return [t[0] + e[0] * n[0] + e[3] * n[1] + e[6] * n[2], t[1] + e[1] * n[0] + e[4] * n[1] + e[7] * n[2], t[2] + e[2] * n[0] + e[5] * n[1] + e[8] * n[2]]
}
function Kv(e, t) {
  return $v([e[0] * t[0] + e[3] * t[1] + e[6] * t[2], e[1] * t[0] + e[4] * t[1] + e[7] * t[2], e[2] * t[0] + e[5] * t[1] + e[8] * t[2]])
}
function qv(e, t, n) {
  e.push(t[0], t[1], t[2], n[0], n[1], n[2])
}
function Jv(e, t) {
  return e[0] * t[0] + e[1] * t[1] + e[2] * t[2]
}
function Yv(e, t) {
  return [e[1] * t[2] - e[2] * t[1], e[2] * t[0] - e[0] * t[2], e[0] * t[1] - e[1] * t[0]]
}
function Xv(e, t) {
  return [e[0] - t[0], e[1] - t[1], e[2] - t[2]]
}
function Zv(e, t) {
  return [e[0] + t[0], e[1] + t[1], e[2] + t[2]]
}
function Qv(e, t) {
  return [e[0] * t, e[1] * t, e[2] * t]
}
function $v(e) {
  let t = ey(e);
  return t < 1e-9 ? [1, 0, 0] : [e[0] / t, e[1] / t, e[2] / t]
}
function ey(e) {
  return Math.hypot(e[0], e[1], e[2])
}
var ty = {
  dbName: `hyper-browser-store`,
  backend: `auto`,
  chunkBytes: 8 * 1024 * 1024,
  cacheBytes: 512 * 1024 * 1024,
  writeConcurrency: 2,
  maxInflightBytes: 64 * 1024 * 1024,
  abandonedWriteTtlMs: 1440 * 60 * 1e3
}
  , ny = class {
    worker;
    options;
    nextId = 1;
    pending = new Map;
    initPromise;
    constructor(e, t = {}) {
      this.options = {
        ...ty,
        ...t
      },
        typeof Worker < `u` && e instanceof Worker ? this.worker = e : this.worker = new Worker(e, {
          type: `module`,
          name: `project-blob-store`
        }),
        this.worker.onmessage = e => this.handleResponse(e.data),
        this.worker.onerror = e => {
          for (let { reject: t } of this.pending.values())
            t(Error(e.message || `Storage worker error`));
          this.pending.clear()
        }
    }
    async init() {
      return this.initPromise ||= this.call({
        type: `init`,
        options: this.options
      }),
        this.initPromise
    }
    async requestPersistentStorage() {
      return navigator.storage?.persist ? navigator.storage.persist() : !1
    }
    async estimate() {
      return await this.init(),
        this.call({
          type: `estimate`
        })
    }
    async put(e, t, n, r = {}) {
      await this.init();
      let i = ry(n)
        , a = await this.call({
          type: `startPut`,
          projectId: e,
          blobId: t,
          size: i,
          mime: r.mime ?? iy(n),
          metadata: r.metadata,
          chunkBytes: r.chunkBytes
        })
        , o = 0
        , s = 0
        , c = 0
        , l = 0
        , u = new Set
        , d = 0
        , f = async e => {
          for (; u.size >= this.options.writeConcurrency || u.size > 0 && d + e > this.options.maxInflightBytes;)
            await Promise.race(u)
        }
        ;
      try {
        for await (let e of ay(n, a.chunkBytes)) {
          let t = o++
            , n = s
            , p = e.byteLength;
          s += p,
            await f(p),
            d += p;
          let m = this.call({
            type: `putChunk`,
            writeId: a.writeId,
            index: t,
            offset: n,
            buffer: e
          }, [e]).then(() => {
            c += p,
              l += 1,
              r.onProgress?.({
                bytesWritten: c,
                totalBytes: i,
                chunksWritten: l
              })
          }
          ).finally(() => {
            d -= p,
              u.delete(m)
          }
          );
          u.add(m)
        }
        return await Promise.all(u),
          this.call({
            type: `commitPut`,
            writeId: a.writeId,
            chunks: o,
            size: s
          })
      } catch (e) {
        throw await this.call({
          type: `abortPut`,
          writeId: a.writeId
        }).catch(() => void 0),
        e
      }
    }
    async getMeta(e, t) {
      return await this.init(),
        this.call({
          type: `getMeta`,
          projectId: e,
          blobId: t
        })
    }
    stream(e, t, n = {}) {
      let r = n.policy ?? `transfer`, i, a = 0;
      return new ReadableStream({
        start: async () => {
          i = await this.getMeta(e, t)
        }
        ,
        pull: async o => {
          if (n.signal?.aborted) {
            o.error(n.signal.reason ?? new DOMException(`Aborted`, `AbortError`));
            return
          }
          if (i ||= await this.getMeta(e, t),
            a >= i.chunks) {
            o.close();
            return
          }
          let s = await this.call({
            type: `getChunk`,
            projectId: e,
            blobId: t,
            index: a++,
            policy: r
          });
          o.enqueue(new Uint8Array(s.buffer, 0, s.bytes))
        }
      })
    }
    async getBlob(e, t, n = {}) {
      let r = await this.getMeta(e, t)
        , i = this.stream(e, t, n).getReader()
        , a = [];
      for (; ;) {
        let { done: e, value: t } = await i.read();
        if (e)
          break;
        a.push(sy(t))
      }
      return new Blob(a, {
        type: r.mime
      })
    }
    async activateProject(e, t) {
      return await this.init(),
        this.call({
          type: `activateProject`,
          projectId: e,
          hotBytes: t
        })
    }
    async prewarmProject(e, t) {
      return await this.init(),
        this.call({
          type: `prewarmProject`,
          projectId: e,
          maxBytes: t
        })
    }
    async prewarmBlobs(e, t, n = {}) {
      return await this.init(),
        this.call({
          type: `prewarmBlobs`,
          projectId: e,
          blobIds: [...t],
          maxBytes: n.maxBytes,
          activate: n.activate
        })
    }
    async listProjects() {
      return await this.init(),
        this.call({
          type: `listProjects`
        })
    }
    async listBlobs(e) {
      return await this.init(),
        this.call({
          type: `listBlobs`,
          projectId: e
        })
    }
    async deleteBlob(e, t) {
      await this.init(),
        await this.call({
          type: `deleteBlob`,
          projectId: e,
          blobId: t
        })
    }
    async deleteProject(e) {
      await this.init(),
        await this.call({
          type: `deleteProject`,
          projectId: e
        })
    }
    async clearCache(e) {
      await this.init(),
        await this.call({
          type: `clearCache`,
          projectId: e
        })
    }
    async stats() {
      return await this.init(),
        this.call({
          type: `stats`
        })
    }
    dispose() {
      this.worker.terminate();
      for (let { reject: e } of this.pending.values())
        e(Error(`ProjectBlobStore disposed`));
      this.pending.clear()
    }
    call(e, t = []) {
      let n = this.nextId++;
      return new Promise((r, i) => {
        this.pending.set(n, {
          resolve: r,
          reject: i
        }),
          this.worker.postMessage({
            ...e,
            id: n
          }, t)
      }
      )
    }
    handleResponse(e) {
      let t = this.pending.get(e.id);
      if (t)
        if (this.pending.delete(e.id),
          e.ok)
          t.resolve(e.result);
        else {
          let n = Error(e.error.message);
          n.name = e.error.name,
            e.error.stack && (n.stack = e.error.stack),
            t.reject(n)
        }
    }
  }
  ;
function ry(e) {
  if (e instanceof Blob)
    return e.size;
  if (e instanceof ArrayBuffer || ArrayBuffer.isView(e))
    return e.byteLength
}
function iy(e) {
  return e instanceof Blob && e.type ? e.type : void 0
}
async function* ay(e, t) {
  if (e instanceof Blob) {
    for (let n = 0; n < e.size; n += t)
      yield await e.slice(n, n + t).arrayBuffer();
    return
  }
  if (e instanceof ArrayBuffer) {
    for (let n = 0; n < e.byteLength; n += t)
      yield e.slice(n, n + t);
    return
  }
  if (ArrayBuffer.isView(e)) {
    let n = new Uint8Array(e.buffer, e.byteOffset, e.byteLength);
    for (let e = 0; e < n.byteLength; e += t)
      yield sy(n.subarray(e, Math.min(n.byteLength, e + t)));
    return
  }
  yield* oy(e, t)
}
async function* oy(e, t) {
  let n = new Uint8Array;
  for await (let r of e) {
    let e = 0;
    for (; e < r.byteLength;) {
      let i = t - n.byteLength
        , a = Math.min(i, r.byteLength - e)
        , o = new Uint8Array(n.byteLength + a);
      o.set(n, 0),
        o.set(r.subarray(e, e + a), n.byteLength),
        n = o,
        e += a,
        n.byteLength === t && (yield sy(n),
          n = new Uint8Array)
    }
  }
  n.byteLength > 0 && (yield sy(n))
}
function sy(e) {
  if (e.byteOffset === 0 && e.byteLength === e.buffer.byteLength && e.buffer instanceof ArrayBuffer)
    return e.buffer;
  let t = new Uint8Array(e.byteLength);
  return t.set(e),
    t.buffer
}
var cy = `websfm-project-assets`
  , ly = `websfm-artifacts`
  , uy = class {
    dbName;
    dbPromise = null;
    constructor(e = `websfm-session-store`) {
      this.dbName = e
    }
    async putArtifact(e) {
      let t = await this.open()
        , n = {
          ...e,
          id: Ey(e.projectId, e.key),
          upstreamKeys: [...e.upstreamKeys],
          createdAt: e.createdAt ?? Date.now()
        };
      await z(my(t, `readwrite`).put(n)),
        await this.invalidateArtifactBytes(t, e.projectId)
    }
    async getArtifact(e, t) {
      return await z(my(await this.open(), `readonly`).get(Ey(e, t))) ?? null
    }
    async listArtifacts(e) {
      return (await z(my(await this.open(), `readonly`).getAll())).filter(t => t.projectId === e).sort((e, t) => (t.createdAt ?? 0) - (e.createdAt ?? 0))
    }
    async estimateBytes(e) {
      let t = await this.open()
        , n = await z(vy(t, `readonly`).get(Oy(e)));
      if (n && typeof n.value == `number` && Number.isFinite(n.value))
        return n.value;
      let r = (await this.listArtifacts(e)).reduce((e, t) => e + Math.max(0, t.byteSize || 0), 0);
      return await z(vy(t, `readwrite`).put({
        key: Oy(e),
        value: r
      })),
        r
    }
    async clearProject(e) {
      let t = await this.open()
        , n = await this.listArtifacts(e)
        , r = my(t, `readwrite`);
      await Promise.all(n.map(t => z(r.delete(Ey(e, t.key))))),
        await this.invalidateArtifactBytes(t, e)
    }
    async invalidateArtifactBytes(e, t) {
      try {
        await z(vy(e, `readwrite`).delete(Oy(t)))
      } catch { }
    }
    async putProject(e) {
      let t = await this.open()
        , n = Date.now()
        , r = eb({
          ...e,
          createdAt: e.createdAt ?? n,
          updatedAt: e.updatedAt ?? n
        });
      await z(hy(t, `readwrite`).put(r))
    }
    async getProject(e) {
      let t = await z(hy(await this.open(), `readonly`).get(e));
      return t ? eb(t) : null
    }
    async listProjects() {
      return (await z(hy(await this.open(), `readonly`).getAll())).sort((e, t) => (t.updatedAt ?? 0) - (e.updatedAt ?? 0)).map(eb)
    }
    async deleteProject(e) {
      let t = await this.open();
      await z(hy(t, `readwrite`).delete(e)),
        await this.getActiveProjectId() === e && await this.setActiveProjectId(null);
      let n = await this.getProjectAssetMasks(e)
        , r = _y(t, `readwrite`);
      await Promise.all(n.map(t => z(r.delete(ky(e, t.projectAssetId)))));
      let i = await this.listManualPairAnnotations(e)
        , a = Sy(t, `readwrite`);
      await Promise.all(i.map(t => z(a.delete(Ay(e, t.pairKey)))));
      let o = await this.listNamedAnnotations(e)
        , s = Cy(t, `readwrite`);
      await Promise.all(o.map(t => z(s.delete(jy(e, t.annotationId)))));
      let c = await this.listNamedAnnotationObservations(e)
        , l = wy(t, `readwrite`);
      await Promise.all(c.map(t => z(l.delete(My(e, t.annotationId, t.projectAssetId)))))
    }
    async setActiveProjectId(e) {
      let t = vy(await this.open(), `readwrite`);
      e === null ? await z(t.delete(`activeProjectId`)) : await z(t.put({
        key: `activeProjectId`,
        value: e
      }))
    }
    async getActiveProjectId() {
      let e = await z(vy(await this.open(), `readonly`).get(`activeProjectId`));
      return typeof e?.value == `string` ? e.value : null
    }
    async putProjectAsset(e) {
      let t = await this.open()
        , n = tb({
          ...e,
          createdAt: e.createdAt ?? Date.now()
        });
      await z(gy(t, `readwrite`).put(n))
    }
    async getProjectAssets(e) {
      let t = gy(await this.open(), `readonly`);
      return (await Promise.all(e.map(e => z(t.get(e))))).flatMap(e => e ? [tb(e)] : [])
    }
    async prewarmProjectAssets(e, t, n = {}) {
      return Dy()
    }
    async deleteUnreferencedProjectAssets() {
      let e = await this.open()
        , t = new Set;
      for (let e of await this.listProjects())
        for (let n of e.assetRefs)
          t.add(n.assetId);
      let n = await z(gy(e, `readonly`).getAll())
        , r = gy(e, `readwrite`);
      await Promise.all(n.filter(e => !t.has(e.assetId)).map(e => z(r.delete(e.assetId))))
    }
    async putProjectAssetMasks(e, t) {
      let n = await this.open()
        , r = await this.getProjectAssetMasks(e)
        , i = _y(n, `readwrite`);
      await Promise.all(r.map(t => z(i.delete(ky(e, t.projectAssetId))))),
        await Promise.all(t.map(t => z(i.put(nb(e, t.projectAssetId, t.mask, t.updatedAt ?? Date.now())))))
    }
    async putProjectAssetMask(e, t, n) {
      await z(_y(await this.open(), `readwrite`).put(nb(e, t, n, Date.now())))
    }
    async deleteProjectAssetMask(e, t) {
      await z(_y(await this.open(), `readwrite`).delete(ky(e, t)))
    }
    async getProjectAssetMasks(e) {
      return (await z(_y(await this.open(), `readonly`).getAll())).filter(t => t.projectId === e).map(rb)
    }
    async putSourceAssetProject(e) {
      let t = await this.open()
        , n = Date.now()
        , r = {
          ...e,
          assets: e.assets.map(ib),
          createdAt: e.createdAt ?? n,
          updatedAt: e.updatedAt ?? n
        };
      await z(yy(t, `readwrite`).put(r))
    }
    async getLatestSourceAssetProject() {
      return (await z(yy(await this.open(), `readonly`).getAll())).sort((e, t) => (t.updatedAt ?? 0) - (e.updatedAt ?? 0))[0] ?? null
    }
    async clearSourceAssetProject(e) {
      await z(yy(await this.open(), `readwrite`).delete(e))
    }
    async putSourceAssetMaskProject(e) {
      let t = await this.open()
        , n = Date.now()
        , r = {
          ...e,
          masks: e.masks.map(ab),
          createdAt: e.createdAt ?? n,
          updatedAt: e.updatedAt ?? n
        };
      await z(by(t, `readwrite`).put(r))
    }
    async getSourceAssetMaskProject(e) {
      let t = await z(by(await this.open(), `readonly`).get(e));
      return t ? {
        ...t,
        masks: t.masks.map(ab)
      } : null
    }
    async clearSourceAssetMaskProject(e) {
      await z(by(await this.open(), `readwrite`).delete(e))
    }
    async putRunSession(e) {
      let t = await this.open()
        , n = Date.now()
        , r = {
          ...e,
          stages: Ty(e.stages),
          createdAt: e.createdAt ?? n,
          updatedAt: e.updatedAt ?? n
        };
      await z(xy(t, `readwrite`).put(r))
    }
    async listRunSessions(e) {
      return (await z(xy(await this.open(), `readonly`).getAll())).filter(t => !e || t.sourceProjectId === e).sort((e, t) => (t.updatedAt ?? 0) - (e.updatedAt ?? 0)).map(e => ({
        ...e,
        stages: Ty(e.stages)
      }))
    }
    async getRunSession(e) {
      let t = await z(xy(await this.open(), `readonly`).get(e));
      return t ? {
        ...t,
        stages: Ty(t.stages)
      } : null
    }
    async clearRunSessionsForSourceProject(e) {
      let t = await this.open()
        , n = await this.listRunSessions(e)
        , r = xy(t, `readwrite`);
      await Promise.all(n.map(e => z(r.delete(e.runId))))
    }
    async putManualPairAnnotation(e) {
      let t = await this.open()
        , n = Date.now()
        , r = {
          ...Wn({
            ...e,
            createdAt: e.createdAt ?? n,
            updatedAt: e.updatedAt ?? n
          }),
          storeKey: Ay(e.projectId, e.pairKey)
        };
      await z(Sy(t, `readwrite`).put(r))
    }
    async getManualPairAnnotation(e, t) {
      let n = await z(Sy(await this.open(), `readonly`).get(Ay(e, t)));
      return n ? Ny(n) : null
    }
    async listManualPairAnnotations(e) {
      return (await z(Sy(await this.open(), `readonly`).getAll())).filter(t => t.projectId === e).sort((e, t) => e.pairKey.localeCompare(t.pairKey)).map(Ny)
    }
    async deleteManualPairAnnotation(e, t) {
      await z(Sy(await this.open(), `readwrite`).delete(Ay(e, t)))
    }
    async putNamedAnnotation(e) {
      let t = await this.open()
        , n = Date.now()
        , r = {
          ...La({
            ...e,
            createdAt: e.createdAt ?? n,
            updatedAt: e.updatedAt ?? n
          }),
          storeKey: jy(e.projectId, e.annotationId)
        };
      await z(Cy(t, `readwrite`).put(r))
    }
    async getNamedAnnotation(e, t) {
      let n = await z(Cy(await this.open(), `readonly`).get(jy(e, t)));
      return n ? Py(n) : null
    }
    async listNamedAnnotations(e) {
      return (await z(Cy(await this.open(), `readonly`).getAll())).filter(t => t.projectId === e).sort((e, t) => e.name.localeCompare(t.name) || e.annotationId.localeCompare(t.annotationId)).map(Py)
    }
    async deleteNamedAnnotation(e, t) {
      let n = await this.open();
      await z(Cy(n, `readwrite`).delete(jy(e, t)));
      let r = await this.listNamedAnnotationObservations(e)
        , i = wy(n, `readwrite`);
      await Promise.all(r.filter(e => e.annotationId === t).map(t => z(i.delete(My(e, t.annotationId, t.projectAssetId)))))
    }
    async putNamedAnnotationObservation(e) {
      let t = await this.open()
        , n = Date.now()
        , r = {
          ...Ra({
            ...e,
            createdAt: e.createdAt ?? n,
            updatedAt: e.updatedAt ?? n
          }),
          storeKey: My(e.projectId, e.annotationId, e.projectAssetId)
        };
      await z(wy(t, `readwrite`).put(r))
    }
    async getNamedAnnotationObservation(e, t, n) {
      let r = await z(wy(await this.open(), `readonly`).get(My(e, t, n)));
      return r ? Fy(r) : null
    }
    async listNamedAnnotationObservations(e) {
      return (await z(wy(await this.open(), `readonly`).getAll())).filter(t => t.projectId === e).sort((e, t) => e.annotationId.localeCompare(t.annotationId) || e.projectAssetId.localeCompare(t.projectAssetId)).map(Fy)
    }
    async deleteNamedAnnotationObservation(e, t, n) {
      await z(wy(await this.open(), `readwrite`).delete(My(e, t, n)))
    }
    async deleteNamedAnnotationObservationsForAsset(e, t) {
      let n = await this.open()
        , r = await this.listNamedAnnotationObservations(e)
        , i = wy(n, `readwrite`);
      await Promise.all(r.filter(e => e.projectAssetId === t).map(t => z(i.delete(My(e, t.annotationId, t.projectAssetId)))))
    }
    open() {
      return this.dbPromise ||= new Promise((e, t) => {
        let n = indexedDB.open(this.dbName, 7);
        n.onerror = () => t(n.error ?? Error(`IndexedDB open failed`)),
          n.onupgradeneeded = () => {
            let e = n.result;
            e.objectStoreNames.contains(`artifacts`) || e.createObjectStore(`artifacts`, {
              keyPath: `id`
            }),
              e.objectStoreNames.contains(`sourceProjects`) || e.createObjectStore(`sourceProjects`, {
                keyPath: `projectId`
              }),
              e.objectStoreNames.contains(`sourceMasks`) || e.createObjectStore(`sourceMasks`, {
                keyPath: `projectId`
              }),
              e.objectStoreNames.contains(`runSessions`) || e.createObjectStore(`runSessions`, {
                keyPath: `runId`
              }),
              e.objectStoreNames.contains(`projects`) || e.createObjectStore(`projects`, {
                keyPath: `projectId`
              }),
              e.objectStoreNames.contains(`projectAssets`) || e.createObjectStore(`projectAssets`, {
                keyPath: `assetId`
              }),
              e.objectStoreNames.contains(`projectMasks`) || e.createObjectStore(`projectMasks`, {
                keyPath: `id`
              }),
              e.objectStoreNames.contains(`projectMeta`) || e.createObjectStore(`projectMeta`, {
                keyPath: `key`
              }),
              e.objectStoreNames.contains(`manualPairAnnotations`) || e.createObjectStore(`manualPairAnnotations`, {
                keyPath: `storeKey`
              }),
              e.objectStoreNames.contains(`namedAnnotations`) || e.createObjectStore(`namedAnnotations`, {
                keyPath: `storeKey`
              }),
              e.objectStoreNames.contains(`namedAnnotationObservations`) || e.createObjectStore(`namedAnnotationObservations`, {
                keyPath: `storeKey`
              })
          }
          ,
          n.onsuccess = () => e(n.result)
      }
      ),
        this.dbPromise
    }
  }
  , dy = class {
    records;
    blobs;
    constructor(e, t) {
      this.records = e,
        this.blobs = t
    }
    async putArtifact(e) {
      try {
        let t = Wy(e.payload);
        await this.blobs.put(ly, Uy(e.projectId, e.key), t, {
          mime: Iy,
          metadata: {
            projectId: e.projectId,
            key: e.key,
            stepId: e.stepId,
            schemaVersion: e.schemaVersion
          }
        }),
          await this.records.putArtifact(By(e, t.size))
      } catch {
        await this.records.putArtifact(e)
      }
    }
    async getArtifact(e, t) {
      let n = await this.records.getArtifact(e, t);
      if (!n)
        return null;
      let r = Vy(n);
      if (!r)
        return Hy(n);
      try {
        let e = await Gy(await this.blobs.getBlob(r.projectId, r.blobId));
        return Hy({
          ...n,
          payload: e
        })
      } catch {
        return n.payload == null ? null : Hy(n)
      }
    }
    async listArtifacts(e) {
      return (await this.records.listArtifacts(e)).map(Hy)
    }
    async estimateBytes(e) {
      return this.records.estimateBytes(e)
    }
    async clearProject(e) {
      let t = await this.records.listArtifacts(e);
      try {
        for (let e of t) {
          let t = Vy(e);
          t && await this.blobs.deleteBlob(t.projectId, t.blobId)
        }
      } finally {
        await this.records.clearProject(e)
      }
    }
    async putProject(e) {
      await this.records.putProject(e)
    }
    async getProject(e) {
      return this.records.getProject(e)
    }
    async listProjects() {
      return this.records.listProjects()
    }
    async deleteProject(e) {
      await this.records.deleteProject(e)
    }
    async setActiveProjectId(e) {
      await this.records.setActiveProjectId(e)
    }
    async getActiveProjectId() {
      return this.records.getActiveProjectId()
    }
    async putProjectAsset(e) {
      let t = Date.now();
      try {
        await this.blobs.put(cy, e.assetId, e.blob, {
          mime: e.type || e.blob.type || void 0,
          metadata: {
            path: e.path,
            name: e.name,
            size: e.size,
            lastModified: e.lastModified,
            origin: e.origin
          }
        }),
          await this.records.putProjectAsset(Zy(e, t))
      } catch {
        await this.records.putProjectAsset(e)
      }
    }
    async getProjectAssets(e) {
      let t = await this.records.getProjectAssets(e)
        , n = [];
      for (let e of t) {
        let t = Qy(e);
        if (!t) {
          n.push($y(e)),
            await this.migrateLegacyProjectAsset(e).catch(() => void 0);
          continue
        }
        try {
          let r = await this.blobs.getBlob(t.projectId, t.blobId, {
            policy: `copy`
          });
          n.push($y({
            ...e,
            blob: r
          }))
        } catch {
          e.blob.size > 0 && n.push($y(e))
        }
      }
      return n
    }
    async prewarmProjectAssets(e, t, n = {}) {
      if (!this.blobs.prewarmBlobs || t.length === 0)
        return Dy();
      let r = await this.records.getProjectAssets(t)
        , i = []
        , a = new Set;
      for (let e of r) {
        let t = Qy(e);
        !t || t.projectId !== `websfm-project-assets` || a.has(t.blobId) || (a.add(t.blobId),
          i.push(t.blobId))
      }
      if (i.length === 0)
        return Dy();
      try {
        return await this.blobs.prewarmBlobs(cy, i, {
          maxBytes: n.maxBytes,
          activate: !0
        })
      } catch {
        return Dy()
      }
    }
    async deleteUnreferencedProjectAssets() {
      try {
        let e = new Set;
        for (let t of await this.records.listProjects())
          for (let n of t.assetRefs)
            e.add(n.assetId);
        for (let t of await this.blobs.listBlobs(cy))
          e.has(t.blobId) || await this.blobs.deleteBlob(cy, t.blobId)
      } finally {
        await this.records.deleteUnreferencedProjectAssets()
      }
    }
    async putProjectAssetMasks(e, t) {
      await this.records.putProjectAssetMasks(e, t)
    }
    async putProjectAssetMask(e, t, n) {
      await this.records.putProjectAssetMask(e, t, n)
    }
    async deleteProjectAssetMask(e, t) {
      await this.records.deleteProjectAssetMask(e, t)
    }
    async getProjectAssetMasks(e) {
      return this.records.getProjectAssetMasks(e)
    }
    async putSourceAssetProject(e) {
      await this.records.putSourceAssetProject(e)
    }
    async getLatestSourceAssetProject() {
      return this.records.getLatestSourceAssetProject()
    }
    async clearSourceAssetProject(e) {
      await this.records.clearSourceAssetProject(e)
    }
    async putSourceAssetMaskProject(e) {
      await this.records.putSourceAssetMaskProject(e)
    }
    async getSourceAssetMaskProject(e) {
      return this.records.getSourceAssetMaskProject(e)
    }
    async clearSourceAssetMaskProject(e) {
      await this.records.clearSourceAssetMaskProject(e)
    }
    async putRunSession(e) {
      await this.records.putRunSession(e)
    }
    async listRunSessions(e) {
      return this.records.listRunSessions(e)
    }
    async getRunSession(e) {
      return this.records.getRunSession(e)
    }
    async clearRunSessionsForSourceProject(e) {
      await this.records.clearRunSessionsForSourceProject(e)
    }
    async putManualPairAnnotation(e) {
      await this.records.putManualPairAnnotation(e)
    }
    async getManualPairAnnotation(e, t) {
      return this.records.getManualPairAnnotation(e, t)
    }
    async listManualPairAnnotations(e) {
      return this.records.listManualPairAnnotations(e)
    }
    async deleteManualPairAnnotation(e, t) {
      await this.records.deleteManualPairAnnotation(e, t)
    }
    async putNamedAnnotation(e) {
      await this.records.putNamedAnnotation(e)
    }
    async getNamedAnnotation(e, t) {
      return this.records.getNamedAnnotation(e, t)
    }
    async listNamedAnnotations(e) {
      return this.records.listNamedAnnotations(e)
    }
    async deleteNamedAnnotation(e, t) {
      await this.records.deleteNamedAnnotation(e, t)
    }
    async putNamedAnnotationObservation(e) {
      await this.records.putNamedAnnotationObservation(e)
    }
    async getNamedAnnotationObservation(e, t, n) {
      return this.records.getNamedAnnotationObservation(e, t, n)
    }
    async listNamedAnnotationObservations(e) {
      return this.records.listNamedAnnotationObservations(e)
    }
    async deleteNamedAnnotationObservation(e, t, n) {
      await this.records.deleteNamedAnnotationObservation(e, t, n)
    }
    async deleteNamedAnnotationObservationsForAsset(e, t) {
      await this.records.deleteNamedAnnotationObservationsForAsset(e, t)
    }
    async migrateLegacyProjectAsset(e) {
      e.blob.size !== 0 && await this.putProjectAsset(e)
    }
  }
  ;
function fy() {
  if (typeof indexedDB > `u`)
    return null;
  if (typeof Worker < `u`)
    try {
      return new dy(new uy, new ny(new Worker(new URL(`/components/sfm-processor/storage.worker.js`, `` + import.meta.url), {
        type: `module`,
        name: `project-blob-store`
      }), {
        dbName: `websfm-project-blob-store`
      }))
    } catch { }
  return new uy
}
async function py() {
  let e = globalThis.navigator?.storage;
  if (!e?.persist)
    return !1;
  try {
    return await e.persist()
  } catch {
    return !1
  }
}
function my(e, t) {
  return e.transaction(`artifacts`, t).objectStore(`artifacts`)
}
function hy(e, t) {
  return e.transaction(`projects`, t).objectStore(`projects`)
}
function gy(e, t) {
  return e.transaction(`projectAssets`, t).objectStore(`projectAssets`)
}
function _y(e, t) {
  return e.transaction(`projectMasks`, t).objectStore(`projectMasks`)
}
function vy(e, t) {
  return e.transaction(`projectMeta`, t).objectStore(`projectMeta`)
}
function yy(e, t) {
  return e.transaction(`sourceProjects`, t).objectStore(`sourceProjects`)
}
function by(e, t) {
  return e.transaction(`sourceMasks`, t).objectStore(`sourceMasks`)
}
function xy(e, t) {
  return e.transaction(`runSessions`, t).objectStore(`runSessions`)
}
function Sy(e, t) {
  return e.transaction(`manualPairAnnotations`, t).objectStore(`manualPairAnnotations`)
}
function Cy(e, t) {
  return e.transaction(`namedAnnotations`, t).objectStore(`namedAnnotations`)
}
function wy(e, t) {
  return e.transaction(`namedAnnotationObservations`, t).objectStore(`namedAnnotationObservations`)
}
function Ty(e) {
  return Object.fromEntries(Object.entries(e).map(([e, t]) => [e, {
    ...t,
    ...t.metrics ? {
      metrics: {
        ...t.metrics
      }
    } : {}
  }]))
}
function z(e) {
  return new Promise((t, n) => {
    e.onerror = () => n(e.error ?? Error(`IndexedDB request failed`)),
      e.onsuccess = () => t(e.result)
  }
  )
}
function Ey(e, t) {
  return `${e}\0${t}`
}
function Dy() {
  return {
    loadedBytes: 0,
    loadedChunks: 0,
    skippedBlobs: 0
  }
}
function Oy(e) {
  return `artifactBytes\0${e}`
}
function ky(e, t) {
  return `${e}\0${t}`
}
function Ay(e, t) {
  return `${e}\0${t}`
}
function jy(e, t) {
  return `${e}\0${t}`
}
function My(e, t, n) {
  return Pa(e, t, n)
}
function Ny(e) {
  let { storeKey: t, ...n } = e;
  return Wn(n)
}
function Py(e) {
  let { storeKey: t, ...n } = e;
  return La(n)
}
function Fy(e) {
  let { storeKey: t, ...n } = e;
  return Ra(n)
}
var Iy = `application/x-websfm-artifact-payload`
  , Ly = new TextEncoder().encode(`WSFA1
`)
  , Ry = 4
  , zy = `__websfmArtifactBuffer`;
function By(e, t) {
  return {
    ...e,
    payload: null,
    payloadStorage: {
      projectId: ly,
      blobId: Uy(e.projectId, e.key),
      codec: `websfm-artifact-v1`,
      size: t,
      updatedAt: Date.now()
    }
  }
}
function Vy(e) {
  let t = e.payloadStorage;
  return t?.codec !== `websfm-artifact-v1` || typeof t.projectId != `string` || typeof t.blobId != `string` || typeof t.size != `number` || typeof t.updatedAt != `number` ? null : t
}
function Hy(e) {
  let { payloadStorage: t, ...n } = e;
  return n
}
function Uy(e, t) {
  return `${e}\0${t}`
}
function Wy(e) {
  let t = []
    , n = []
    , r = {
      payload: Ky(e, t, n),
      buffers: n
    }
    , i = new TextEncoder().encode(JSON.stringify(r))
    , a = new Uint8Array(Ry);
  return new DataView(a.buffer).setUint32(0, i.byteLength, !0),
    new Blob([Ly, a, i, ...t], {
      type: Iy
    })
}
async function Gy(e) {
  let t = new Uint8Array(await e.arrayBuffer());
  if (t.byteLength < Ly.byteLength + Ry)
    throw Error(`Artifact payload blob is truncated`);
  for (let e = 0; e < Ly.byteLength; e++)
    if (t[e] !== Ly[e])
      throw Error(`Artifact payload blob has an unsupported format`);
  let n = Ly.byteLength
    , r = new DataView(t.buffer, t.byteOffset + n, Ry).getUint32(0, !0);
  n += Ry;
  let i = n + r;
  if (i > t.byteLength)
    throw Error(`Artifact payload header is truncated`);
  let a = JSON.parse(new TextDecoder().decode(t.subarray(n, i)));
  n = i;
  let o = a.buffers.map(e => {
    let r = n + e.byteLength;
    if (r > t.byteLength)
      throw Error(`Artifact payload buffer is truncated`);
    let i = Xy(t.subarray(n, r));
    return n = r,
      Yy(e.type, i, e.length)
  }
  );
  return qy(a.payload, o)
}
function Ky(e, t, n) {
  let r = Jy(e);
  if (r) {
    let e = t.length;
    return t.push(Xy(r.bytes)),
      n.push({
        type: r.type,
        byteLength: r.bytes.byteLength,
        length: r.length
      }),
    {
      [zy]: e
    }
  }
  return Array.isArray(e) ? e.map(e => Ky(e, t, n)) : e && typeof e == `object` ? Object.fromEntries(Object.entries(e).filter(([, e]) => e !== void 0).map(([e, r]) => [e, Ky(r, t, n)])) : e
}
function qy(e, t) {
  if (Array.isArray(e))
    return e.map(e => qy(e, t));
  if (e && typeof e == `object`) {
    let n = e
      , r = n[zy];
    if (typeof r == `number` && Number.isInteger(r)) {
      let e = t[r];
      if (!e)
        throw Error(`Artifact payload buffer ${r} is missing`);
      return e
    }
    return Object.fromEntries(Object.entries(n).map(([e, n]) => [e, qy(n, t)]))
  }
  return e
}
function Jy(e) {
  return e instanceof Int8Array || e instanceof Uint8Array || e instanceof Uint8ClampedArray || e instanceof Int16Array || e instanceof Uint16Array || e instanceof Int32Array || e instanceof Uint32Array || e instanceof Float32Array || e instanceof Float64Array ? {
    type: e.constructor.name,
    bytes: new Uint8Array(e.buffer, e.byteOffset, e.byteLength),
    length: e.length
  } : null
}
function Yy(e, t, n) {
  switch (e) {
    case `Int8Array`:
      return new Int8Array(t, 0, n);
    case `Uint8Array`:
      return new Uint8Array(t, 0, n);
    case `Uint8ClampedArray`:
      return new Uint8ClampedArray(t, 0, n);
    case `Int16Array`:
      return new Int16Array(t, 0, n);
    case `Uint16Array`:
      return new Uint16Array(t, 0, n);
    case `Int32Array`:
      return new Int32Array(t, 0, n);
    case `Uint32Array`:
      return new Uint32Array(t, 0, n);
    case `Float32Array`:
      return new Float32Array(t, 0, n);
    case `Float64Array`:
      return new Float64Array(t, 0, n)
  }
}
function Xy(e) {
  let t = new Uint8Array(e.byteLength);
  return t.set(e),
    t.buffer
}
function Zy(e, t) {
  return {
    ...e,
    createdAt: e.createdAt ?? t,
    blob: new Blob([], {
      type: e.type || e.blob.type || ``
    }),
    blobStorage: {
      projectId: cy,
      blobId: e.assetId,
      size: e.blob.size,
      mime: e.type || e.blob.type || ``,
      updatedAt: t
    }
  }
}
function Qy(e) {
  let t = e.blobStorage;
  return typeof t?.projectId != `string` || typeof t.blobId != `string` || typeof t.mime != `string` || typeof t.size != `number` || typeof t.updatedAt != `number` ? null : t
}
function $y(e) {
  let { blobStorage: t, ...n } = e;
  return n
}
function eb(e) {
  return {
    ...e,
    assetRefs: e.assetRefs.map(e => ({
      ...e
    })).sort((e, t) => e.order - t.order)
  }
}
function tb(e) {
  return {
    ...e
  }
}
function nb(e, t, n, r) {
  return {
    id: ky(e, t),
    projectId: e,
    projectAssetId: t,
    mask: Wr(n),
    updatedAt: r
  }
}
function rb(e) {
  let t = Kr(e.mask) ? Gr(e.mask) : Ur(e.mask);
  return {
    projectId: e.projectId,
    projectAssetId: e.projectAssetId,
    mask: t,
    updatedAt: e.updatedAt
  }
}
function ib(e) {
  return {
    ...e,
    mask: Xr(e.mask) ? Ur(e.mask) : null
  }
}
function ab(e) {
  return {
    identity: e.identity,
    mask: Ur(e.mask)
  }
}
var ob = 16
  , sb = 8
  , cb = 128
  , lb = 65535
  , ub = `
struct Params {
  thresholdSq: f32,
  matchCount: u32,
  hypothesisCount: u32,
  _pad: u32
};

@group(0) @binding(0) var<storage, read> hypotheses: array<vec4f>;
@group(0) @binding(1) var<storage, read> bearings: array<vec4f>;
@group(0) @binding(2) var<storage, read_write> counts: array<atomic<u32>>;
@group(0) @binding(3) var<uniform> params: Params;

@compute @workgroup_size(${ob}, ${sb}, 1)
fn main(@builtin(global_invocation_id) gid: vec3u) {
  let matchIndex = gid.x;
  let hypothesisIndex = gid.y;
  if (matchIndex >= params.matchCount || hypothesisIndex >= params.hypothesisCount) {
    return;
  }

  let b = bearings[matchIndex];
  let x1 = vec3f(b.x, b.y, 1.0);
  let x2 = vec3f(b.z, b.w, 1.0);
  let base = hypothesisIndex * 3u;
  let e0 = hypotheses[base].xyz;
  let e1 = hypotheses[base + 1u].xyz;
  let e2 = hypotheses[base + 2u].xyz;

  let ex1 = vec3f(dot(e0, x1), dot(e1, x1), dot(e2, x1));
  let etx2 = vec3f(
    e0.x * x2.x + e1.x * x2.y + e2.x,
    e0.y * x2.x + e1.y * x2.y + e2.y,
    e0.z * x2.x + e1.z * x2.y + e2.z
  );
  let x2ex1 = dot(x2, ex1);
  let den = ex1.x * ex1.x + ex1.y * ex1.y + etx2.x * etx2.x + etx2.y * etx2.y;
  if (den > 1e-12 && (x2ex1 * x2ex1) / den < params.thresholdSq) {
    atomicAdd(&counts[hypothesisIndex], 1u);
  }
}
`
  , db = `
struct PairMeta {
  matchOffset: u32,
  matchCount: u32,
  hypothesisOffset: u32,
  hypothesisCount: u32,
  thresholdSq: f32,
  blockCount: u32,
  _pad0: u32,
  _pad1: u32,
};

struct HypothesisMeta {
  pairIndex: u32,
  localHypothesis: u32,
  _pad0: u32,
  _pad1: u32,
};

struct PartialScore {
  count: u32,
  _pad0: u32,
  errorSum: f32,
  _pad1: f32,
};

struct BatchParams {
  blocksPerHyp: u32,
  hypothesisCount: u32,
  pairCount: u32,
  hypothesisGridX: u32,
};

@group(0) @binding(0) var<storage, read> pairMeta: array<PairMeta>;
@group(0) @binding(1) var<storage, read> matchesXY: array<vec4f>;
@group(0) @binding(2) var<storage, read> hypothesesF: array<vec4f>;
@group(0) @binding(3) var<storage, read> hypothesisMeta: array<HypothesisMeta>;
@group(0) @binding(4) var<storage, read_write> partials: array<PartialScore>;
@group(0) @binding(5) var<uniform> params: BatchParams;

var<workgroup> counts: array<u32, ${cb}>;
var<workgroup> errors: array<f32, ${cb}>;

@compute @workgroup_size(${cb})
fn main(
  @builtin(workgroup_id) wg: vec3<u32>,
  @builtin(local_invocation_index) lid: u32
) {
  let hypGlobal = wg.x + wg.z * params.hypothesisGridX;
  let matchBlock = wg.y;
  if (hypGlobal >= params.hypothesisCount) {
    return;
  }

  let h = hypothesisMeta[hypGlobal];
  let p = pairMeta[h.pairIndex];
  var c = 0u;
  var e = 0.0;
  if (matchBlock < p.blockCount) {
    let mLocal = matchBlock * ${cb}u + lid;
    if (mLocal < p.matchCount) {
      let xy = matchesXY[p.matchOffset + mLocal];
      let x1 = vec3f(xy.x, xy.y, 1.0);
      let x2 = vec3f(xy.z, xy.w, 1.0);

      let base = hypGlobal * 3u;
      let f0 = hypothesesF[base].xyz;
      let f1 = hypothesesF[base + 1u].xyz;
      let f2 = hypothesesF[base + 2u].xyz;

      let fx1 = vec3f(dot(f0, x1), dot(f1, x1), dot(f2, x1));
      let ftx2 = vec3f(
        f0.x * x2.x + f1.x * x2.y + f2.x,
        f0.y * x2.x + f1.y * x2.y + f2.y,
        f0.z * x2.x + f1.z * x2.y + f2.z
      );
      let num = dot(x2, fx1);
      let den = fx1.x * fx1.x + fx1.y * fx1.y + ftx2.x * ftx2.x + ftx2.y * ftx2.y;
      if (den > 1e-12) {
        let err = (num * num) / den;
        if (err <= p.thresholdSq) {
          c = 1u;
          e = err;
        }
      }
    }
  }

  counts[lid] = c;
  errors[lid] = e;
  workgroupBarrier();

  var stride = ${cb / 2}u;
  loop {
    if (stride == 0u) {
      break;
    }
    if (lid < stride) {
      counts[lid] = counts[lid] + counts[lid + stride];
      errors[lid] = errors[lid] + errors[lid + stride];
    }
    workgroupBarrier();
    stride = stride >> 1u;
  }

  if (lid == 0u) {
    partials[hypGlobal * params.blocksPerHyp + matchBlock] = PartialScore(counts[0], 0u, errors[0], 0.0);
  }
}
`
  , fb = `
struct PairMeta {
  matchOffset: u32,
  matchCount: u32,
  hypothesisOffset: u32,
  hypothesisCount: u32,
  thresholdSq: f32,
  blockCount: u32,
  _pad0: u32,
  _pad1: u32,
};

struct PartialScore {
  count: u32,
  _pad0: u32,
  errorSum: f32,
  _pad1: f32,
};

struct PairBest {
  bestHypothesis: u32,
  count: u32,
  errorSum: f32,
  _pad0: u32,
};

struct BatchParams {
  blocksPerHyp: u32,
  hypothesisCount: u32,
  pairCount: u32,
  hypothesisGridX: u32,
};

@group(0) @binding(0) var<storage, read> pairMeta: array<PairMeta>;
@group(0) @binding(1) var<storage, read> partials: array<PartialScore>;
@group(0) @binding(2) var<storage, read_write> pairBest: array<PairBest>;
@group(0) @binding(3) var<uniform> params: BatchParams;

var<workgroup> bestCounts: array<u32, ${cb}>;
var<workgroup> bestHypotheses: array<u32, ${cb}>;
var<workgroup> bestErrors: array<f32, ${cb}>;

fn better(count: u32, err: f32, hyp: u32, bestCount: u32, bestErr: f32, bestHyp: u32) -> bool {
  if (count > bestCount) { return true; }
  if (count < bestCount) { return false; }
  if (err < bestErr) { return true; }
  if (err > bestErr) { return false; }
  return hyp < bestHyp;
}

@compute @workgroup_size(${cb})
fn main(
  @builtin(workgroup_id) wg: vec3<u32>,
  @builtin(local_invocation_index) lid: u32
) {
  let pairIndex = wg.x;
  if (pairIndex >= params.pairCount) {
    return;
  }
  let p = pairMeta[pairIndex];
  var localBestCount = 0u;
  var localBestHyp = 0xffffffffu;
  var localBestErr = 3.402823e38;

  for (var h = lid; h < p.hypothesisCount; h = h + ${cb}u) {
    let hypGlobal = p.hypothesisOffset + h;
    var count = 0u;
    var err = 0.0;
    for (var block = 0u; block < p.blockCount; block = block + 1u) {
      let partial = partials[hypGlobal * params.blocksPerHyp + block];
      count = count + partial.count;
      err = err + partial.errorSum;
    }
    if (better(count, err, h, localBestCount, localBestErr, localBestHyp)) {
      localBestCount = count;
      localBestHyp = h;
      localBestErr = err;
    }
  }

  bestCounts[lid] = localBestCount;
  bestHypotheses[lid] = localBestHyp;
  bestErrors[lid] = localBestErr;
  workgroupBarrier();

  var stride = ${cb / 2}u;
  loop {
    if (stride == 0u) {
      break;
    }
    if (lid < stride) {
      let otherCount = bestCounts[lid + stride];
      let otherHyp = bestHypotheses[lid + stride];
      let otherErr = bestErrors[lid + stride];
      if (better(otherCount, otherErr, otherHyp, bestCounts[lid], bestErrors[lid], bestHypotheses[lid])) {
        bestCounts[lid] = otherCount;
        bestHypotheses[lid] = otherHyp;
        bestErrors[lid] = otherErr;
      }
    }
    workgroupBarrier();
    stride = stride >> 1u;
  }

  if (lid == 0u) {
    pairBest[pairIndex] = PairBest(bestHypotheses[0], bestCounts[0], bestErrors[0], 0u);
  }
}
`
  , pb = class e {
    device;
    pipeline;
    batchScorePipeline;
    batchReducePipeline;
    supportsBatch = !0;
    hypotheses;
    bearings;
    counts;
    countsReadback;
    params;
    hypothesesBytes = 0;
    bearingsBytes = 0;
    countsBytes = 0;
    batchPairMeta;
    batchMatches;
    batchHypotheses;
    batchHypothesisMeta;
    batchPartials;
    batchPairBest;
    batchPairBestReadback;
    batchParams;
    batchPairMetaBytes = 0;
    batchMatchesBytes = 0;
    batchHypothesesBytes = 0;
    batchHypothesisMetaBytes = 0;
    batchPartialsBytes = 0;
    batchPairBestBytes = 0;
    paramsScratch = new ArrayBuffer(16);
    paramsView = new DataView(this.paramsScratch);
    batchParamsScratch = new Uint32Array(4);
    stats = {
      batches: 0,
      hypotheses: 0,
      matchTests: 0
    };
    constructor(e, t, n, r) {
      this.device = e,
        this.pipeline = t,
        this.batchScorePipeline = n,
        this.batchReducePipeline = r
    }
    static async create(t) {
      try {
        let n = t ?? await Tr();
        if (!n || n.lost)
          return null;
        let { device: r } = n
          , i = r.createShaderModule({
            code: ub
          })
          , a = r.createShaderModule({
            code: db
          })
          , o = r.createShaderModule({
            code: fb
          });
        return new e(r, r.createComputePipeline({
          layout: `auto`,
          compute: {
            module: i,
            entryPoint: `main`
          }
        }), r.createComputePipeline({
          layout: `auto`,
          compute: {
            module: a,
            entryPoint: `main`
          }
        }), r.createComputePipeline({
          layout: `auto`,
          compute: {
            module: o,
            entryPoint: `main`
          }
        }))
      } catch {
        return null
      }
    }
    async scoreEssentialMatrices(e, t, n, r, i) {
      if (r <= 0 || i <= 0)
        return new Uint32Array;
      let a = e.byteLength
        , o = t.byteLength
        , s = mb(r * 4);
      if (this.ensureBuffers(a, o, s),
        !this.hypotheses || !this.bearings || !this.counts || !this.countsReadback || !this.params)
        return null;
      this.paramsView.setFloat32(0, n, !0),
        this.paramsView.setUint32(4, i, !0),
        this.paramsView.setUint32(8, r, !0),
        this.paramsView.setUint32(12, 0, !0),
        this.device.queue.writeBuffer(this.hypotheses, 0, e),
        this.device.queue.writeBuffer(this.bearings, 0, t),
        this.device.queue.writeBuffer(this.params, 0, this.paramsScratch);
      let c = this.device.createBindGroup({
        layout: this.pipeline.getBindGroupLayout(0),
        entries: [{
          binding: 0,
          resource: {
            buffer: this.hypotheses
          }
        }, {
          binding: 1,
          resource: {
            buffer: this.bearings
          }
        }, {
          binding: 2,
          resource: {
            buffer: this.counts
          }
        }, {
          binding: 3,
          resource: {
            buffer: this.params
          }
        }]
      })
        , l = this.device.createCommandEncoder();
      l.clearBuffer(this.counts, 0, s);
      let u = l.beginComputePass();
      u.setPipeline(this.pipeline),
        u.setBindGroup(0, c),
        u.dispatchWorkgroups(Math.ceil(i / ob), Math.ceil(r / sb)),
        u.end(),
        l.copyBufferToBuffer(this.counts, 0, this.countsReadback, 0, s),
        this.device.queue.submit([l.finish()]);
      try {
        await this.countsReadback.mapAsync(GPUMapMode.READ, 0, s);
        let e = this.countsReadback.getMappedRange(0, s)
          , t = new Uint32Array(r);
        return t.set(new Uint32Array(e, 0, r)),
          this.countsReadback.unmap(),
          this.stats.batches++,
          this.stats.hypotheses += r,
          this.stats.matchTests += r * i,
          t
      } catch {
        try {
          this.countsReadback.unmap()
        } catch { }
        return null
      }
    }
    async scoreBatched(e, t, n) {
      let r = e.filter(e => e.matchCount > 0 && e.hypothesisCount > 0);
      if (r.length === 0)
        return [];
      let i = r.length * 32
        , a = new ArrayBuffer(i)
        , o = new DataView(a)
        , s = 0
        , c = 0
        , l = 1
        , u = 0;
      for (let e of r)
        l = Math.max(l, Math.ceil(e.matchCount / cb)),
          s += e.matchCount,
          c += e.hypothesisCount,
          u += e.matchCount * e.hypothesisCount;
      let d = new Float32Array(s * 4)
        , f = new Float32Array(c * 12)
        , p = new Uint32Array(c * 4)
        , m = t.pixelThreshold * t.pixelThreshold
        , h = 0
        , g = 0;
      for (let e = 0; e < r.length; e++) {
        let t = r[e]
          , n = e * 32
          , i = Math.ceil(t.matchCount / cb);
        o.setUint32(n + 0, h, !0),
          o.setUint32(n + 4, t.matchCount, !0),
          o.setUint32(n + 8, g, !0),
          o.setUint32(n + 12, t.hypothesisCount, !0),
          o.setFloat32(n + 16, m, !0),
          o.setUint32(n + 20, i, !0),
          o.setUint32(n + 24, 0, !0),
          o.setUint32(n + 28, 0, !0),
          d.set(t.points, h * 4),
          f.set(t.hypothesesF, g * 12);
        for (let n = 0; n < t.hypothesisCount; n++) {
          let t = (g + n) * 4;
          p[t] = e,
            p[t + 1] = n,
            p[t + 2] = 0,
            p[t + 3] = 0
        }
        h += t.matchCount,
          g += t.hypothesisCount
      }
      let _ = mb(c * l * 16)
        , v = mb(r.length * 16);
      if (this.ensureBatchBuffers(i, d.byteLength, f.byteLength, p.byteLength, _, v),
        !this.batchPairMeta || !this.batchMatches || !this.batchHypotheses || !this.batchHypothesisMeta || !this.batchPartials || !this.batchPairBest || !this.batchPairBestReadback || !this.batchParams)
        return null;
      let y = Math.min(c, lb)
        , b = Math.ceil(c / y);
      this.batchParamsScratch[0] = l,
        this.batchParamsScratch[1] = c,
        this.batchParamsScratch[2] = r.length,
        this.batchParamsScratch[3] = y,
        this.device.queue.writeBuffer(this.batchPairMeta, 0, a),
        this.device.queue.writeBuffer(this.batchMatches, 0, d),
        this.device.queue.writeBuffer(this.batchHypotheses, 0, f),
        this.device.queue.writeBuffer(this.batchHypothesisMeta, 0, p),
        this.device.queue.writeBuffer(this.batchParams, 0, this.batchParamsScratch);
      let x = this.device.createBindGroup({
        layout: this.batchScorePipeline.getBindGroupLayout(0),
        entries: [{
          binding: 0,
          resource: {
            buffer: this.batchPairMeta
          }
        }, {
          binding: 1,
          resource: {
            buffer: this.batchMatches
          }
        }, {
          binding: 2,
          resource: {
            buffer: this.batchHypotheses
          }
        }, {
          binding: 3,
          resource: {
            buffer: this.batchHypothesisMeta
          }
        }, {
          binding: 4,
          resource: {
            buffer: this.batchPartials
          }
        }, {
          binding: 5,
          resource: {
            buffer: this.batchParams
          }
        }]
      })
        , S = this.device.createBindGroup({
          layout: this.batchReducePipeline.getBindGroupLayout(0),
          entries: [{
            binding: 0,
            resource: {
              buffer: this.batchPairMeta
            }
          }, {
            binding: 1,
            resource: {
              buffer: this.batchPartials
            }
          }, {
            binding: 2,
            resource: {
              buffer: this.batchPairBest
            }
          }, {
            binding: 3,
            resource: {
              buffer: this.batchParams
            }
          }]
        });
      n?.(`WebGPU geometry scoring: ${r.length} pairs, ${c} hypotheses, ${u.toLocaleString()} Sampson tests`);
      let C = this.device.createCommandEncoder()
        , w = C.beginComputePass();
      w.setPipeline(this.batchScorePipeline),
        w.setBindGroup(0, x),
        w.dispatchWorkgroups(y, l, b),
        w.end();
      let T = C.beginComputePass();
      T.setPipeline(this.batchReducePipeline),
        T.setBindGroup(0, S),
        T.dispatchWorkgroups(r.length),
        T.end(),
        C.copyBufferToBuffer(this.batchPairBest, 0, this.batchPairBestReadback, 0, v),
        this.device.queue.submit([C.finish()]);
      try {
        await this.batchPairBestReadback.mapAsync(GPUMapMode.READ, 0, v);
        let e = this.batchPairBestReadback.getMappedRange(0, v)
          , t = new DataView(e)
          , n = [];
        for (let e = 0; e < r.length; e++) {
          let i = e * 16;
          n.push({
            pairIndex: r[e].pairIndex,
            bestHypothesis: t.getUint32(i + 0, !0),
            bestInlierCount: t.getUint32(i + 4, !0),
            bestTieBreakError: t.getFloat32(i + 8, !0)
          })
        }
        return this.batchPairBestReadback.unmap(),
          this.stats.batches++,
          this.stats.hypotheses += c,
          this.stats.matchTests += u,
          n
      } catch {
        try {
          this.batchPairBestReadback.unmap()
        } catch { }
        return null
      }
    }
    getAndResetStats() {
      let e = {
        ...this.stats
      };
      return this.stats = {
        batches: 0,
        hypotheses: 0,
        matchTests: 0
      },
        e
    }
    ensureBuffers(e, t, n) {
      (!this.hypotheses || this.hypothesesBytes < e) && (this.hypotheses?.destroy(),
        this.hypothesesBytes = hb(e),
        this.hypotheses = this.device.createBuffer({
          size: this.hypothesesBytes,
          usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
        })),
        (!this.bearings || this.bearingsBytes < t) && (this.bearings?.destroy(),
          this.bearingsBytes = hb(t),
          this.bearings = this.device.createBuffer({
            size: this.bearingsBytes,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
          })),
        (!this.counts || this.countsBytes < n) && (this.counts?.destroy(),
          this.countsReadback?.destroy(),
          this.countsBytes = hb(n),
          this.counts = this.device.createBuffer({
            size: this.countsBytes,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST
          }),
          this.countsReadback = this.device.createBuffer({
            size: this.countsBytes,
            usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST
          })),
        this.params ??= this.device.createBuffer({
          size: 16,
          usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        })
    }
    ensureBatchBuffers(e, t, n, r, i, a) {
      (!this.batchPairMeta || this.batchPairMetaBytes < e) && (this.batchPairMeta?.destroy(),
        this.batchPairMetaBytes = hb(e),
        this.batchPairMeta = this.device.createBuffer({
          size: this.batchPairMetaBytes,
          usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
        })),
        (!this.batchMatches || this.batchMatchesBytes < t) && (this.batchMatches?.destroy(),
          this.batchMatchesBytes = hb(t),
          this.batchMatches = this.device.createBuffer({
            size: this.batchMatchesBytes,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
          })),
        (!this.batchHypotheses || this.batchHypothesesBytes < n) && (this.batchHypotheses?.destroy(),
          this.batchHypothesesBytes = hb(n),
          this.batchHypotheses = this.device.createBuffer({
            size: this.batchHypothesesBytes,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
          })),
        (!this.batchHypothesisMeta || this.batchHypothesisMetaBytes < r) && (this.batchHypothesisMeta?.destroy(),
          this.batchHypothesisMetaBytes = hb(r),
          this.batchHypothesisMeta = this.device.createBuffer({
            size: this.batchHypothesisMetaBytes,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
          })),
        (!this.batchPartials || this.batchPartialsBytes < i) && (this.batchPartials?.destroy(),
          this.batchPartialsBytes = hb(i),
          this.batchPartials = this.device.createBuffer({
            size: this.batchPartialsBytes,
            usage: GPUBufferUsage.STORAGE
          })),
        (!this.batchPairBest || this.batchPairBestBytes < a) && (this.batchPairBest?.destroy(),
          this.batchPairBestReadback?.destroy(),
          this.batchPairBestBytes = hb(a),
          this.batchPairBest = this.device.createBuffer({
            size: this.batchPairBestBytes,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC
          }),
          this.batchPairBestReadback = this.device.createBuffer({
            size: this.batchPairBestBytes,
            usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST
          })),
        this.batchParams ??= this.device.createBuffer({
          size: 16,
          usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        })
    }
  }
  ;
function mb(e) {
  return e + 3 & -4
}
function hb(e) {
  let t = 256;
  for (; t < e;)
    t *= 2;
  return t
}
var gb = 64
  , _b = 32 * 1024 * 1024
  , vb = 4 * 1024 * 1024
  , yb = 512
  , bb = 16e7
  , xb = 64
  , Sb = `
struct PairJob {
  srcOffset: u32,
  srcCount: u32,
  dstOffset: u32,
  dstCount: u32,
  outOffset: u32,
  maxDistance: u32,
  ratioScaled: u32,
  _pad: u32
};

struct BatchMeta {
  jobCount: u32,
  _pad0: u32,
  _pad1: u32,
  _pad2: u32
};

@group(0) @binding(0) var<storage, read> allDesc: array<u32>;
@group(0) @binding(1) var<storage, read_write> outBest: array<vec4u>;
@group(0) @binding(2) var<storage, read> jobs: array<PairJob>;
@group(0) @binding(3) var<uniform> batchMeta: BatchMeta;

var<workgroup> wgBest: array<u32, ${gb}>;
var<workgroup> wgSecond: array<u32, ${gb}>;
var<workgroup> wgBestJ: array<u32, ${gb}>;

fn insertCandidateBatch(slot: u32, candidateDistance: u32, candidateIndex: u32) {
  let best = wgBest[slot];
  let bestIndex = wgBestJ[slot];
  if (candidateDistance < best || (candidateDistance == best && candidateIndex < bestIndex)) {
    if (candidateIndex != bestIndex) {
      wgSecond[slot] = min(wgSecond[slot], best);
    }
    wgBest[slot] = candidateDistance;
    wgBestJ[slot] = candidateIndex;
  } else if (candidateIndex != bestIndex && candidateDistance < wgSecond[slot]) {
    wgSecond[slot] = candidateDistance;
  }
}

@compute @workgroup_size(${gb}, 1, 1)
fn main(@builtin(workgroup_id) groupId: vec3u, @builtin(local_invocation_id) localId: vec3u) {
  let jobIdx = groupId.y;
  let i = groupId.x;
  let lane = localId.x;
  if (jobIdx >= batchMeta.jobCount) {
    return;
  }
  let job = jobs[jobIdx];
  if (i >= job.srcCount) {
    return;
  }
  var localBest = job.maxDistance + 1u;
  var localSecond = job.maxDistance + 1u;
  var localBestJ = 0xffffffffu;
  let srcOffsetWords = job.srcOffset + i * 8u;

  for (var j = lane; j < job.dstCount; j = j + ${gb}u) {
    let dstOffsetWords = job.dstOffset + j * 8u;
    var d = 0u;
    for (var w = 0u; w < 8u; w = w + 1u) {
      d = d + countOneBits(allDesc[srcOffsetWords + w] ^ allDesc[dstOffsetWords + w]);
      if (d >= localSecond) {
        break;
      }
    }
    if (d < localBest) {
      localSecond = localBest;
      localBest = d;
      localBestJ = j;
    } else if (d < localSecond) {
      localSecond = d;
    }
  }

  wgBest[lane] = localBest;
  wgSecond[lane] = localSecond;
  wgBestJ[lane] = localBestJ;
  workgroupBarrier();

  for (var stride = ${gb / 2}u; stride > 0u; stride = stride / 2u) {
    if (lane < stride) {
      let other = lane + stride;
      insertCandidateBatch(lane, wgBest[other], wgBestJ[other]);
      insertCandidateBatch(lane, wgSecond[other], 0xffffffffu);
    }
    workgroupBarrier();
  }

  if (lane == 0u) {
    let best = wgBest[0];
    let second = wgSecond[0];
    let bestJ = wgBestJ[0];
    var accepted = 0xffffffffu;
    if (bestJ != 0xffffffffu && best <= job.maxDistance && best * 1024u < second * job.ratioScaled) {
      accepted = bestJ;
    }
    outBest[job.outOffset + i] = vec4u(accepted, best, second, 0u);
  }
}
`
  , Cb = `
struct MutualPair {
  srcCount: u32,
  fwdOffset: u32,
  revOffset: u32,
  outOffset: u32
};

struct MutualMeta {
  pairCount: u32,
  _pad0: u32,
  _pad1: u32,
  _pad2: u32
};

@group(0) @binding(0) var<storage, read> directional: array<vec4u>;
@group(0) @binding(1) var<storage, read_write> pairCounts: array<atomic<u32>>;
@group(0) @binding(2) var<storage, read_write> outMatches: array<vec4u>;
@group(0) @binding(3) var<storage, read> pairs: array<MutualPair>;
@group(0) @binding(4) var<uniform> mutualMeta: MutualMeta;

@compute @workgroup_size(${gb}, 1, 1)
fn main(@builtin(global_invocation_id) gid: vec3u) {
  let i = gid.x;
  let pairIndex = gid.y;
  if (pairIndex >= mutualMeta.pairCount) {
    return;
  }

  let spec = pairs[pairIndex];
  if (i >= spec.srcCount) {
    return;
  }

  let fwd = directional[spec.fwdOffset + i];
  let j = fwd.x;
  if (j == 0xffffffffu) {
    return;
  }

  let rev = directional[spec.revOffset + j];
  if (rev.x != i) {
    return;
  }

  let slot = atomicAdd(&pairCounts[pairIndex], 1u);
  if (slot < spec.srcCount) {
    outMatches[spec.outOffset + slot] = vec4u(i, j, fwd.y, 0u);
  }
}
`
  , wb = `
struct Params {
  srcCount: u32,
  dstCount: u32,
  maxDistance: u32,
  ratioScaled: u32
};

@group(0) @binding(0) var<storage, read> srcDesc: array<u32>;
@group(0) @binding(1) var<storage, read> dstDesc: array<u32>;
@group(0) @binding(2) var<storage, read_write> outBest: array<vec4u>;
@group(0) @binding(3) var<uniform> params: Params;

var<workgroup> wgBest: array<u32, ${gb}>;
var<workgroup> wgSecond: array<u32, ${gb}>;
var<workgroup> wgBestJ: array<u32, ${gb}>;

fn insertCandidate(slot: u32, candidateDistance: u32, candidateIndex: u32) {
  let best = wgBest[slot];
  let bestIndex = wgBestJ[slot];
  if (candidateDistance < best || (candidateDistance == best && candidateIndex < bestIndex)) {
    if (candidateIndex != bestIndex) {
      wgSecond[slot] = min(wgSecond[slot], best);
    }
    wgBest[slot] = candidateDistance;
    wgBestJ[slot] = candidateIndex;
  } else if (candidateIndex != bestIndex && candidateDistance < wgSecond[slot]) {
    wgSecond[slot] = candidateDistance;
  }
}

@compute @workgroup_size(${gb}, 1, 1)
fn main(@builtin(workgroup_id) groupId: vec3u, @builtin(local_invocation_id) localId: vec3u) {
  let i = groupId.x;
  let lane = localId.x;
  if (i >= params.srcCount) {
    return;
  }
  var localBest = params.maxDistance + 1u;
  var localSecond = params.maxDistance + 1u;
  var localBestJ = 0xffffffffu;
  let srcOffset = i * 8u;

  for (var j = lane; j < params.dstCount; j = j + ${gb}u) {
    let dstOffset = j * 8u;
    var d = 0u;
    for (var w = 0u; w < 8u; w = w + 1u) {
      d = d + countOneBits(srcDesc[srcOffset + w] ^ dstDesc[dstOffset + w]);
      if (d >= localSecond) {
        break;
      }
    }
    if (d < localBest) {
      localSecond = localBest;
      localBest = d;
      localBestJ = j;
    } else if (d < localSecond) {
      localSecond = d;
    }
  }

  wgBest[lane] = localBest;
  wgSecond[lane] = localSecond;
  wgBestJ[lane] = localBestJ;
  workgroupBarrier();

  for (var stride = ${gb / 2}u; stride > 0u; stride = stride / 2u) {
    if (lane < stride) {
      let other = lane + stride;
      insertCandidate(lane, wgBest[other], wgBestJ[other]);
      insertCandidate(lane, wgSecond[other], 0xffffffffu);
    }
    workgroupBarrier();
  }

  if (lane == 0u) {
    let best = wgBest[0];
    let second = wgSecond[0];
    let bestJ = wgBestJ[0];
    var accepted = 0xffffffffu;
    if (bestJ != 0xffffffffu && best <= params.maxDistance && best * 1024u < second * params.ratioScaled) {
      accepted = bestJ;
    }
    outBest[i] = vec4u(accepted, best, second, 0u);
  }
}
`
  , Tb = class e {
    device;
    pipeline;
    descriptorComparisonBudget;
    batchPipeline;
    mutualPipeline;
    src;
    dst;
    out;
    outReadback;
    params;
    srcBytes = 0;
    dstBytes = 0;
    outBytes = 0;
    batchAllDesc;
    batchAllDescBytes = 0;
    batchJobs;
    batchJobsBytes = 0;
    batchOut;
    batchOutReadback;
    batchOutBytes = 0;
    batchMeta;
    mutualPairs;
    mutualPairsBytes = 0;
    mutualCounts;
    mutualCountsReadback;
    mutualCountsBytes = 0;
    mutualOut;
    mutualOutBytes = 0;
    mutualCompactReadback;
    mutualCompactReadbackBytes = 0;
    mutualMeta;
    descriptorOffsetsScratch = new Uint32Array;
    batchJobScratch = new Uint32Array;
    mutualPairScratch = new Uint32Array;
    mutualCountsScratch = new Uint32Array;
    singleParamScratch = new Uint32Array(4);
    batchMetaScratch = new Uint32Array(4);
    mutualMetaScratch = new Uint32Array(4);
    stats = Nb();
    constructor(e, t, n, r, i) {
      this.device = e,
        this.pipeline = t,
        this.descriptorComparisonBudget = n,
        this.batchPipeline = r,
        this.mutualPipeline = i
    }
    get supportsBatch() {
      return this.batchPipeline !== void 0
    }
    get supportsCompactPairs() {
      return this.batchPipeline !== void 0 && this.mutualPipeline !== void 0
    }
    get maxDescriptorComparisonsPerDispatch() {
      return this.descriptorComparisonBudget
    }
    static async create(t = `auto`, n) {
      try {
        let r = n ?? await Tr();
        if (!r || r.lost)
          return null;
        let { device: i } = r;
        i.pushErrorScope(`validation`);
        let a = i.createShaderModule({
          code: wb
        })
          , o = i.createComputePipeline({
            layout: `auto`,
            compute: {
              module: a,
              entryPoint: `main`
            }
          });
        if (await i.popErrorScope())
          return null;
        let s = Eb(t);
        i.pushErrorScope(`validation`);
        let c = i.createShaderModule({
          code: Sb
        })
          , l = i.createComputePipeline({
            layout: `auto`,
            compute: {
              module: c,
              entryPoint: `main`
            }
          });
        if (await i.popErrorScope())
          return new e(i, o, s);
        i.pushErrorScope(`validation`);
        let u = i.createShaderModule({
          code: Cb
        })
          , d = i.createComputePipeline({
            layout: `auto`,
            compute: {
              module: u,
              entryPoint: `main`
            }
          });
        return new e(i, o, s, l, await i.popErrorScope() ? void 0 : d)
      } catch {
        return null
      }
    }
    async bestMatches(e, t, n, r) {
      if (e.count === 0 || t.count === 0)
        return {
          best: new Int32Array(e.count).fill(-1),
          distance: new Uint32Array(e.count)
        };
      if (e.count * t.count > this.comparisonBudget())
        return null;
      let i = e.count * 8 * 4
        , a = t.count * 8 * 4
        , o = Ib(e.count * 16);
      if (this.ensureBuffers(i, a, o),
        !this.src || !this.dst || !this.out || !this.outReadback || !this.params)
        return null;
      let s = Pb(e, this.device)
        , c = Pb(t, this.device);
      this.singleParamScratch[0] = e.count,
        this.singleParamScratch[1] = t.count,
        this.singleParamScratch[2] = n,
        this.singleParamScratch[3] = Math.max(1, Math.floor(r * 1024));
      try {
        s || this.device.queue.writeBuffer(this.src, 0, e.descriptors.subarray(0, e.count * 8)),
          c || this.device.queue.writeBuffer(this.dst, 0, t.descriptors.subarray(0, t.count * 8)),
          this.device.queue.writeBuffer(this.params, 0, this.singleParamScratch)
      } catch {
        return null
      }
      let l = this.device.createBindGroup({
        layout: this.pipeline.getBindGroupLayout(0),
        entries: [{
          binding: 0,
          resource: {
            buffer: s?.buffer ?? this.src
          }
        }, {
          binding: 1,
          resource: {
            buffer: c?.buffer ?? this.dst
          }
        }, {
          binding: 2,
          resource: {
            buffer: this.out
          }
        }, {
          binding: 3,
          resource: {
            buffer: this.params
          }
        }]
      })
        , u = this.device.createCommandEncoder()
        , d = u.beginComputePass();
      d.setPipeline(this.pipeline),
        d.setBindGroup(0, l),
        d.dispatchWorkgroups(e.count),
        d.end(),
        u.copyBufferToBuffer(this.out, 0, this.outReadback, 0, o),
        this.device.queue.submit([u.finish()]);
      try {
        await this.outReadback.mapAsync(GPUMapMode.READ, 0, o);
        let n = this.outReadback.getMappedRange(0, o)
          , r = new Uint32Array(n, 0, e.count * 4)
          , i = new Int32Array(e.count)
          , a = new Uint32Array(e.count);
        for (let t = 0; t < e.count; t++) {
          let e = r[t * 4];
          i[t] = e === 4294967295 ? -1 : e,
            a[t] = r[t * 4 + 1]
        }
        return this.outReadback.unmap(),
          this.recordBatch(`directional-gpu`, e.count * t.count, o),
        {
          best: i,
          distance: a
        }
      } catch {
        return null
      }
    }
    async matchBatch(e, t, n, r, i) {
      let a = new Uint32Array(t.length)
        , o = new Uint32Array(t.length);
      for (let e = 0; e < t.length; e++)
        a[e] = t[e].src,
          o[e] = t[e].dst;
      return this.matchBatchPackedInternal(e, a, o, t.length, n, r, i)
    }
    async matchBatchPacked(e, t, n, r, i) {
      return this.matchBatchPackedInternal(e, t.src, t.dst, t.length, n, r, i)
    }
    async matchBatchPackedInternal(e, t, n, r, i, a, o) {
      if (r === 0)
        return [];
      if (!this.batchPipeline)
        return null;
      let s = Array(r)
        , c = new Uint32Array(r)
        , l = new Uint32Array(r)
        , u = new Int32Array(r)
        , d = 0;
      for (let i = 0; i < r; i++) {
        let r = t[i]
          , a = n[i]
          , o = e[r].count
          , f = e[a].count;
        if (r === a || o === 0 || f === 0) {
          s[i] = {
            best: new Int32Array(o).fill(-1),
            distance: new Uint32Array(o)
          };
          continue
        }
        c[d] = r,
          l[d] = a,
          u[d] = i,
          d++
      }
      if (d === 0)
        return s;
      jb(e, c, l, u, d);
      let f = this.uploadAllDescriptors(e);
      if (!f)
        return null;
      let p = Math.max(1, Math.floor(a * 1024))
        , m = this.comparisonBudget();
      for (let t = 0; t < d; t++)
        if (kb(e, c[t], l[t]) > m)
          return null;
      let h = Db(e, c, l, d, m, xb);
      for (let t of h) {
        let n = t.start
          , r = t.end
          , a = r - n
          , m = a * 32
          , h = this.ensureBatchJobScratch(m)
          , g = 0
          , _ = 0
          , v = 0;
        for (let t = 0; t < a; t++) {
          let r = c[n + t]
            , a = l[n + t]
            , o = e[r]
            , s = e[a]
            , u = o.count
            , d = s.count;
          u > _ && (_ = u);
          let m = t * 8;
          h[m + 0] = f[r],
            h[m + 1] = u,
            h[m + 2] = f[a],
            h[m + 3] = d,
            h[m + 4] = g,
            h[m + 5] = i,
            h[m + 6] = p,
            h[m + 7] = 0,
            g += u,
            v += u * d
        }
        if (g === 0 || _ === 0) {
          for (let t = 0; t < a; t++) {
            let r = u[n + t];
            s[r] = {
              best: new Int32Array(e[c[n + t]].count).fill(-1),
              distance: new Uint32Array(e[c[n + t]].count)
            }
          }
          continue
        }
        let y = Ib(g * 16);
        if (this.ensureBatchOutput(y),
          this.ensureBatchJobs(m),
          this.ensureBatchMeta(),
          !this.batchAllDesc || !this.batchJobs || !this.batchOut || !this.batchOutReadback || !this.batchMeta)
          return null;
        this.device.queue.writeBuffer(this.batchJobs, 0, h.subarray(0, m / 4)),
          this.batchMetaScratch[0] = a,
          this.batchMetaScratch[1] = 0,
          this.batchMetaScratch[2] = 0,
          this.batchMetaScratch[3] = 0,
          this.device.queue.writeBuffer(this.batchMeta, 0, this.batchMetaScratch);
        let b = this.device.createBindGroup({
          layout: this.batchPipeline.getBindGroupLayout(0),
          entries: [{
            binding: 0,
            resource: {
              buffer: this.batchAllDesc
            }
          }, {
            binding: 1,
            resource: {
              buffer: this.batchOut
            }
          }, {
            binding: 2,
            resource: {
              buffer: this.batchJobs
            }
          }, {
            binding: 3,
            resource: {
              buffer: this.batchMeta
            }
          }]
        })
          , x = this.device.createCommandEncoder()
          , S = x.beginComputePass();
        S.setPipeline(this.batchPipeline),
          S.setBindGroup(0, b),
          S.dispatchWorkgroups(_, a),
          S.end(),
          x.copyBufferToBuffer(this.batchOut, 0, this.batchOutReadback, 0, y),
          this.device.queue.submit([x.finish()]);
        try {
          await this.batchOutReadback.mapAsync(GPUMapMode.READ, 0, y);
          let t = this.batchOutReadback.getMappedRange(0, y)
            , i = new Uint32Array(t, 0, g * 4)
            , l = 0;
          for (let t = 0; t < a; t++) {
            let r = u[n + t]
              , a = e[c[n + t]].count
              , o = new Int32Array(a)
              , d = new Uint32Array(a);
            for (let e = 0; e < a; e++) {
              let t = i[(l + e) * 4];
              o[e] = t === 4294967295 ? -1 : t,
                d[e] = i[(l + e) * 4 + 1]
            }
            s[r] = {
              best: o,
              distance: d
            },
              l += a
          }
          this.batchOutReadback.unmap(),
            this.recordBatch(`directional-gpu`, v, y),
            o?.({
              stage: `directional-gpu`,
              completed: r,
              total: d
            })
        } catch {
          try {
            this.batchOutReadback.unmap()
          } catch { }
          return null
        }
      }
      return s
    }
    async matchPairsCompact(e, t, n, r, i) {
      if (t.length === 0)
        return [];
      if (!this.batchPipeline || !this.mutualPipeline)
        return null;
      let a = Array(t.length)
        , o = []
        , s = [];
      for (let n = 0; n < t.length; n++) {
        let r = t[n]
          , i = e[r.i]
          , c = e[r.j];
        if (r.i === r.j || i.count === 0 || c.count === 0) {
          a[n] = [];
          continue
        }
        o.push(r),
          s.push(n)
      }
      if (o.length === 0)
        return a;
      Mb(e, o, s);
      let c = this.uploadAllDescriptors(e);
      if (!c)
        return null;
      let l = Math.max(1, Math.floor(r * 1024))
        , u = this.comparisonBudget();
      if (o.some(t => Ab(e, t) > u))
        return null;
      let d = Ob(e, o, this.compactStorageBudgetBytes(), this.compactPairLimit(), u);
      for (let t of d) {
        let r = t.start
          , u = t.end - t.start
          , d = u * 2 * 32
          , f = this.ensureBatchJobScratch(d)
          , p = this.ensureMutualPairScratch(u * 16)
          , m = 0
          , h = 0
          , g = 0
          , _ = 0
          , v = 0;
        for (let t = 0; t < u; t++) {
          let i = o[r + t]
            , a = e[i.i]
            , s = e[i.j]
            , u = m;
          Fb(f, t * 2, c[i.i], a.count, c[i.j], s.count, u, n, l),
            m += a.count;
          let d = m;
          Fb(f, t * 2 + 1, c[i.j], s.count, c[i.i], a.count, d, n, l),
            m += s.count,
            p[t * 4 + 0] = a.count,
            p[t * 4 + 1] = u,
            p[t * 4 + 2] = d,
            p[t * 4 + 3] = h,
            h += a.count,
            g = Math.max(g, a.count, s.count),
            _ = Math.max(_, a.count),
            v += a.count * s.count * 2
        }
        if (m === 0 || h === 0 || g === 0 || _ === 0) {
          for (let e = 0; e < u; e++)
            a[s[r + e]] = [];
          continue
        }
        let y = Ib(m * 16)
          , b = Ib(h * 16)
          , x = Ib(u * 4);
        if (this.ensureBatchOutput(y),
          this.ensureBatchJobs(d),
          this.ensureBatchMeta(),
          this.ensureMutualPairs(u * 16),
          this.ensureMutualCounts(x),
          this.ensureMutualOutput(b),
          this.ensureMutualMeta(),
          !this.batchAllDesc || !this.batchOut || !this.batchJobs || !this.batchMeta || !this.mutualPairs || !this.mutualCounts || !this.mutualCountsReadback || !this.mutualOut || !this.mutualMeta)
          return null;
        this.device.queue.writeBuffer(this.batchJobs, 0, f.subarray(0, d / 4)),
          this.batchMetaScratch[0] = u * 2,
          this.batchMetaScratch[1] = 0,
          this.batchMetaScratch[2] = 0,
          this.batchMetaScratch[3] = 0,
          this.device.queue.writeBuffer(this.batchMeta, 0, this.batchMetaScratch),
          this.device.queue.writeBuffer(this.mutualPairs, 0, p.subarray(0, u * 4)),
          this.mutualMetaScratch[0] = u,
          this.mutualMetaScratch[1] = 0,
          this.mutualMetaScratch[2] = 0,
          this.mutualMetaScratch[3] = 0,
          this.device.queue.writeBuffer(this.mutualMeta, 0, this.mutualMetaScratch);
        let S = this.device.createBindGroup({
          layout: this.batchPipeline.getBindGroupLayout(0),
          entries: [{
            binding: 0,
            resource: {
              buffer: this.batchAllDesc
            }
          }, {
            binding: 1,
            resource: {
              buffer: this.batchOut
            }
          }, {
            binding: 2,
            resource: {
              buffer: this.batchJobs
            }
          }, {
            binding: 3,
            resource: {
              buffer: this.batchMeta
            }
          }]
        })
          , C = this.device.createBindGroup({
            layout: this.mutualPipeline.getBindGroupLayout(0),
            entries: [{
              binding: 0,
              resource: {
                buffer: this.batchOut
              }
            }, {
              binding: 1,
              resource: {
                buffer: this.mutualCounts
              }
            }, {
              binding: 2,
              resource: {
                buffer: this.mutualOut
              }
            }, {
              binding: 3,
              resource: {
                buffer: this.mutualPairs
              }
            }, {
              binding: 4,
              resource: {
                buffer: this.mutualMeta
              }
            }]
          })
          , w = this.device.createCommandEncoder();
        w.clearBuffer(this.mutualCounts, 0, x);
        {
          let e = w.beginComputePass();
          e.setPipeline(this.batchPipeline),
            e.setBindGroup(0, S),
            e.dispatchWorkgroups(g, u * 2),
            e.end()
        }
        {
          let e = w.beginComputePass();
          e.setPipeline(this.mutualPipeline),
            e.setBindGroup(0, C),
            e.dispatchWorkgroups(Math.ceil(_ / gb), u),
            e.end()
        }
        if (this.ensureMutualCompactReadback(b),
          !this.mutualCompactReadback)
          return null;
        w.copyBufferToBuffer(this.mutualCounts, 0, this.mutualCountsReadback, 0, x),
          w.copyBufferToBuffer(this.mutualOut, 0, this.mutualCompactReadback, 0, b),
          this.device.queue.submit([w.finish()]);
        let T;
        try {
          await this.mutualCountsReadback.mapAsync(GPUMapMode.READ, 0, x),
            T = this.ensureMutualCountsScratch(u),
            T.set(new Uint32Array(this.mutualCountsReadback.getMappedRange(0, x), 0, u)),
            this.mutualCountsReadback.unmap()
        } catch {
          try {
            this.mutualCountsReadback.unmap()
          } catch { }
          return null
        }
        let E = 0;
        for (let e = 0; e < u; e++)
          E += Math.min(T[e], p[e * 4 + 0]);
        if (E === 0) {
          for (let e = 0; e < u; e++)
            a[s[r + e]] = [];
          this.recordBatch(`compact-gpu`, v, x),
            i?.({
              stage: `compact-gpu`,
              completed: t.end,
              total: o.length
            });
          continue
        }
        try {
          await this.mutualCompactReadback.mapAsync(GPUMapMode.READ, 0, b);
          let e = new Uint32Array(this.mutualCompactReadback.getMappedRange(0, b), 0, h * 4);
          for (let t = 0; t < u; t++) {
            let n = Math.min(T[t], p[t * 4 + 0])
              , i = Array(n)
              , o = p[t * 4 + 3];
            for (let t = 0; t < n; t++) {
              let n = (o + t) * 4;
              i[t] = {
                a: e[n],
                b: e[n + 1],
                distance: e[n + 2]
              }
            }
            a[s[r + t]] = i
          }
          this.mutualCompactReadback.unmap(),
            this.recordBatch(`compact-gpu`, v, x + b),
            i?.({
              stage: `compact-gpu`,
              completed: t.end,
              total: o.length
            })
        } catch {
          try {
            this.mutualCompactReadback.unmap()
          } catch { }
          return null
        }
      }
      return a
    }
    getAndResetStats() {
      let e = {
        ...this.stats
      };
      return this.stats = Nb(),
        e
    }
    recordBatch(e, t, n) {
      this.stats.batches++,
        this.stats.comparisons += t,
        this.stats.maxComparisonsPerBatch = Math.max(this.stats.maxComparisonsPerBatch ?? 0, t),
        this.stats.readbackBytes = (this.stats.readbackBytes ?? 0) + n,
        e === `compact-gpu` ? this.stats.compactBatches = (this.stats.compactBatches ?? 0) + 1 : this.stats.directionalBatches = (this.stats.directionalBatches ?? 0) + 1
    }
    ensureBuffers(e, t, n) {
      (!this.src || this.srcBytes < e) && (this.src?.destroy(),
        this.srcBytes = Lb(e),
        this.src = this.device.createBuffer({
          size: this.srcBytes,
          usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
        })),
        (!this.dst || this.dstBytes < t) && (this.dst?.destroy(),
          this.dstBytes = Lb(t),
          this.dst = this.device.createBuffer({
            size: this.dstBytes,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
          })),
        (!this.out || this.outBytes < n) && (this.out?.destroy(),
          this.outReadback?.destroy(),
          this.outBytes = Lb(n),
          this.out = this.device.createBuffer({
            size: this.outBytes,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC
          }),
          this.outReadback = this.device.createBuffer({
            size: this.outBytes,
            usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST
          })),
        this.params ??= this.device.createBuffer({
          size: 16,
          usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        })
    }
    ensureBatchAllDesc(e) {
      this.batchAllDesc && this.batchAllDescBytes >= e || (this.batchAllDesc?.destroy(),
        this.batchAllDescBytes = Lb(e),
        this.batchAllDesc = this.device.createBuffer({
          size: this.batchAllDescBytes,
          usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
        }))
    }
    ensureDescriptorOffsetsScratch(e) {
      return this.descriptorOffsetsScratch.length < e && (this.descriptorOffsetsScratch = new Uint32Array(Lb(e * 4) / 4)),
        this.descriptorOffsetsScratch.subarray(0, e)
    }
    ensureBatchJobScratch(e) {
      let t = e / 4;
      return this.batchJobScratch.length < t && (this.batchJobScratch = new Uint32Array(Lb(e) / 4)),
        this.batchJobScratch.subarray(0, t)
    }
    ensureMutualPairScratch(e) {
      let t = e / 4;
      return this.mutualPairScratch.length < t && (this.mutualPairScratch = new Uint32Array(Lb(e) / 4)),
        this.mutualPairScratch.subarray(0, t)
    }
    ensureMutualCountsScratch(e) {
      return this.mutualCountsScratch.length < e && (this.mutualCountsScratch = new Uint32Array(Lb(e * 4) / 4)),
        this.mutualCountsScratch.subarray(0, e)
    }
    ensureBatchOutput(e) {
      this.batchOut && this.batchOutBytes >= e || (this.batchOut?.destroy(),
        this.batchOutReadback?.destroy(),
        this.batchOutBytes = Lb(e),
        this.batchOut = this.device.createBuffer({
          size: this.batchOutBytes,
          usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC
        }),
        this.batchOutReadback = this.device.createBuffer({
          size: this.batchOutBytes,
          usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST
        }))
    }
    ensureBatchJobs(e) {
      this.batchJobs && this.batchJobsBytes >= e || (this.batchJobs?.destroy(),
        this.batchJobsBytes = Lb(e),
        this.batchJobs = this.device.createBuffer({
          size: this.batchJobsBytes,
          usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
        }))
    }
    ensureBatchMeta() {
      this.batchMeta ??= this.device.createBuffer({
        size: 16,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
      })
    }
    uploadAllDescriptors(e) {
      let t = this.ensureDescriptorOffsetsScratch(e.length)
        , n = 0;
      for (let r = 0; r < e.length; r++)
        t[r] = n,
          n += e[r].count * 8;
      if (n === 0)
        return t;
      if (this.ensureBatchAllDesc(n * 4),
        !this.batchAllDesc)
        return null;
      let r = null
        , i = 0
        , a = 0;
      try {
        for (let n = 0; n < e.length; n++) {
          let o = e[n];
          if (o.count === 0)
            continue;
          let s = o.count * 8 * 4
            , c = Pb(o, this.device);
          if (c) {
            r ??= this.device.createCommandEncoder(),
              r.copyBufferToBuffer(c.buffer, 0, this.batchAllDesc, t[n] * 4, s),
              a += s;
            continue
          }
          this.device.queue.writeBuffer(this.batchAllDesc, t[n] * 4, o.descriptors.subarray(0, o.count * 8)),
            i += s
        }
        r && this.device.queue.submit([r.finish()])
      } catch {
        return null
      }
      return this.stats.descriptorCpuUploadBytes = (this.stats.descriptorCpuUploadBytes ?? 0) + i,
        this.stats.descriptorGpuCopyBytes = (this.stats.descriptorGpuCopyBytes ?? 0) + a,
        t
    }
    ensureMutualPairs(e) {
      this.mutualPairs && this.mutualPairsBytes >= e || (this.mutualPairs?.destroy(),
        this.mutualPairsBytes = Lb(e),
        this.mutualPairs = this.device.createBuffer({
          size: this.mutualPairsBytes,
          usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
        }))
    }
    ensureMutualCounts(e) {
      this.mutualCounts && this.mutualCountsBytes >= e || (this.mutualCounts?.destroy(),
        this.mutualCountsReadback?.destroy(),
        this.mutualCountsBytes = Lb(e),
        this.mutualCounts = this.device.createBuffer({
          size: this.mutualCountsBytes,
          usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST
        }),
        this.mutualCountsReadback = this.device.createBuffer({
          size: this.mutualCountsBytes,
          usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST
        }))
    }
    ensureMutualOutput(e) {
      this.mutualOut && this.mutualOutBytes >= e || (this.mutualOut?.destroy(),
        this.mutualOutBytes = Lb(e),
        this.mutualOut = this.device.createBuffer({
          size: this.mutualOutBytes,
          usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC
        }))
    }
    ensureMutualCompactReadback(e) {
      this.mutualCompactReadback && this.mutualCompactReadbackBytes >= e || (this.mutualCompactReadback?.destroy(),
        this.mutualCompactReadbackBytes = Lb(e),
        this.mutualCompactReadback = this.device.createBuffer({
          size: this.mutualCompactReadbackBytes,
          usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST
        }))
    }
    ensureMutualMeta() {
      this.mutualMeta ??= this.device.createBuffer({
        size: 16,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
      })
    }
    compactStorageBudgetBytes() {
      let e = this.device.limits
        , t = e.maxStorageBufferBindingSize || _b
        , n = e.maxBufferSize || t;
      return Math.max(vb, Math.min(_b, Math.floor(t * .5), Math.floor(n * .5)))
    }
    compactPairLimit() {
      let e = this.device.limits.maxComputeWorkgroupsPerDimension || 65535;
      return Math.max(1, Math.min(yb, Math.floor(e / 2)))
    }
    comparisonBudget() {
      return this.descriptorComparisonBudget
    }
  }
  ;
function Eb(e) {
  return e === `conservative` ? 8e7 : e === `aggressive` ? 32e7 : bb
}
function Db(e, t, n, r, i, a) {
  let o = []
    , s = Math.max(1, i)
    , c = Math.max(1, a)
    , l = 0;
  for (; l < r;) {
    let i = l
      , a = 0;
    for (; i < r && i - l < c;) {
      let r = a + kb(e, t[i], n[i]);
      if (i > l && r > s)
        break;
      a = r,
        i++
    }
    i === l && i++,
      o.push({
        start: l,
        end: i
      }),
      l = i
  }
  return o
}
function Ob(e, t, n, r, i) {
  let a = []
    , o = Math.max(1, n)
    , s = Math.max(1, r)
    , c = Math.max(1, i)
    , l = 0;
  for (; l < t.length;) {
    let n = l
      , r = 0
      , i = 0
      , u = 0;
    for (; n < t.length && n - l < s;) {
      let a = t[n]
        , s = e[a.i].count
        , d = e[a.j].count
        , f = r + (s + d) * 16
        , p = i + s * 16
        , m = u + Ab(e, a);
      if (n > l && (f > o || p > o || m > c))
        break;
      r = f,
        i = p,
        u = m,
        n++
    }
    n === l && n++,
      a.push({
        start: l,
        end: n
      }),
      l = n
  }
  return a
}
function kb(e, t, n) {
  return e[t].count * e[n].count
}
function Ab(e, t) {
  return e[t.i].count * e[t.j].count * 2
}
function jb(e, t, n, r, i) {
  let a = Array.from({
    length: i
  }, (e, t) => t);
  a.sort((n, r) => e[t[r]].count - e[t[n]].count);
  let o = t.slice(0, i)
    , s = n.slice(0, i)
    , c = r.slice(0, i);
  for (let e = 0; e < i; e++)
    t[e] = o[a[e]],
      n[e] = s[a[e]],
      r[e] = c[a[e]]
}
function Mb(e, t, n) {
  let r = t.map((e, t) => t);
  r.sort((n, r) => {
    let i = Math.max(e[t[n].i].count, e[t[n].j].count);
    return Math.max(e[t[r].i].count, e[t[r].j].count) - i
  }
  );
  let i = t.slice()
    , a = n.slice();
  for (let e = 0; e < r.length; e++)
    t[e] = i[r[e]],
      n[e] = a[r[e]]
}
function Nb() {
  return {
    batches: 0,
    comparisons: 0,
    compactBatches: 0,
    directionalBatches: 0,
    maxComparisonsPerBatch: 0,
    descriptorCpuUploadBytes: 0,
    descriptorGpuCopyBytes: 0,
    readbackBytes: 0
  }
}
function Pb(e, t) {
  let n = e.gpuDescriptors;
  return !n || n.device !== t || n.count < e.count || n.words < e.count * 8 ? null : n
}
function Fb(e, t, n, r, i, a, o, s, c) {
  let l = t * 8;
  e[l + 0] = n,
    e[l + 1] = r,
    e[l + 2] = i,
    e[l + 3] = a,
    e[l + 4] = o,
    e[l + 5] = s,
    e[l + 6] = c,
    e[l + 7] = 0
}
function Ib(e) {
  return e + 3 & -4
}
function Lb(e) {
  let t = 256;
  for (; t < e;)
    t *= 2;
  return t
}
var Rb = `components/sfm-processor/geometry_kernels.simd.wasm`;
function zb() {
  debugger
  let e = globalThis.document?.baseURI;
  return e ? new URL(Rb, e).href : `/${Rb}`
}
async function Bb() {
  debugger
  if (typeof fetch > `u`)
    return null;
  let e = await fetch(zb());
  return e.ok ? e.arrayBuffer() : null
}
var Vb = new Int8Array([0, 1, 2, 3, 3, 3, 2, 1, 0, -1, -2, -3, -3, -3, -2, -1])
  , Hb = new Int8Array([-3, -3, -2, -1, 0, 1, 2, 3, 3, 3, 2, 1, 0, -1, -2, -3])
  , Ub = new Map;
function Wb(e) {
  let t = Ub.get(e);
  if (t)
    return t;
  let n = new Int32Array(Vb.length);
  for (let t = 0; t < n.length; t++)
    n[t] = Hb[t] * e + Vb[t];
  return Ub.set(e, n),
    n
}
var Gb = 128
  , Kb = class {
    config;
    supportsBatch = !0;
    minWebGpuScoreTests;
    constructor(e) {
      this.config = e,
        this.minWebGpuScoreTests = Math.max(1, Math.floor(e.minWebGpuScoreTests ?? 1))
    }
    async scoreEssentialMatrices(e, t, n, r, i) {
      let a = r * i;
      if (this.config.webGpu && a >= this.minWebGpuScoreTests) {
        let a = await this.config.webGpu.scoreEssentialMatrices(e, t, n, r, i);
        if (a)
          return a
      }
      if (this.config.wasm) {
        let a = await this.config.wasm.scoreEssentialMatrices(e, t, n, r, i);
        if (a)
          return a
      }
      return this.config.webGpu?.scoreEssentialMatrices(e, t, n, r, i) ?? null
    }
    async scoreBatched(e, t, n) {
      let r = e.reduce((e, t) => e + t.hypothesisCount * t.matchCount, 0);
      if (this.config.webGpu && r >= this.minWebGpuScoreTests) {
        let r = await this.config.webGpu.scoreBatched(e, t, n);
        if (r && r.length === e.filter(e => e.matchCount > 0 && e.hypothesisCount > 0).length)
          return r
      }
      return this.config.wasm ? this.config.wasm.scoreBatched(e, t, n) : this.config.webGpu?.scoreBatched(e, t, n) ?? null
    }
    getAndResetStats() {
      let e = this.config.webGpu?.getAndResetStats?.() ?? {
        batches: 0,
        hypotheses: 0,
        matchTests: 0
      }
        , t = this.config.wasm?.getAndResetStats?.() ?? {
          batches: 0,
          hypotheses: 0,
          matchTests: 0
        };
      return {
        batches: e.batches + t.batches,
        hypotheses: e.hypotheses + t.hypotheses,
        matchTests: e.matchTests + t.matchTests,
        webGpuBatches: e.batches,
        webGpuHypotheses: e.hypotheses,
        webGpuMatchTests: e.matchTests,
        wasmBatches: t.batches,
        wasmHypotheses: t.hypotheses,
        wasmMatchTests: t.matchTests
      }
    }
    createPnPScoringContext(e, t) {
      return this.config.wasm?.createPnPScoringContext?.(e, t) ?? this.config.webGpu?.createPnPScoringContext?.(e, t) ?? null
    }
    triangulateNormalizedPairs(e, t, n, r, i, a) {
      return this.config.wasm?.triangulateNormalizedPairs?.(e, t, n, r, i, a) ?? this.config.webGpu?.triangulateNormalizedPairs?.(e, t, n, r, i, a) ?? null
    }
    solveFivePointCharts(e, t, n, r, i) {
      return this.config.wasm?.solveFivePointCharts?.(e, t, n, r, i) ?? this.config.webGpu?.solveFivePointCharts?.(e, t, n, r, i) ?? null
    }
    createBundleReprojectionCostContext(e) {
      return this.config.wasm?.createBundleReprojectionCostContext?.(e) ?? this.config.webGpu?.createBundleReprojectionCostContext?.(e) ?? null
    }
    createBundleNormalEquationContext(e) {
      return this.config.wasm?.createBundleNormalEquationContext?.(e) ?? this.config.webGpu?.createBundleNormalEquationContext?.(e) ?? null
    }
  }
  , qb = class {
    wasm;
    supportsBatch = !0;
    simd = !0;
    stats = {
      batches: 0,
      hypotheses: 0,
      matchTests: 0
    };
    constructor(e) {
      this.wasm = e
    }
    writeFast9Scores(e, t, n, r, i) {
      let a = t * n;
      if (t <= 0 || n <= 0 || e.length < a || i.length < a)
        return !1;
      this.wasm.sfm_reset_arena();
      let o = this.alloc(a, 16)
        , s = this.alloc(Vb.length * 4, 16)
        , c = this.alloc(a * 4, 16);
      return new Uint8Array(this.wasm.memory.buffer, o, a).set(e.subarray(0, a)),
        new Int32Array(this.wasm.memory.buffer, s, Vb.length).set(Wb(t)),
        this.wasm.sfm_fast9_scores_offsets_f32(o, t, n, r, s, c) === a ? (i.set(new Float32Array(this.wasm.memory.buffer, c, a)),
          !0) : !1
    }
    collectFast9GridCandidates(e, t, n, r, i, a) {
      return this.collectFast9GridCandidatesFused(e, t, n, r, i, a)
    }
    collectFast9GridCandidatesFused(e, t, n, r, i, a) {
      let o = t * n
        , s = Math.floor(a);
      if (t <= 0 || n <= 0 || t > 65535 || n > 65535 || e.length < o || !Number.isFinite(i) || i <= 0 || s <= 0)
        return null;
      let c = Math.ceil(t / 24)
        , l = Math.ceil(n / 24)
        , u = Math.max(1, c * l)
        , d = u * Math.max(2, Math.ceil(s / u));
      this.wasm.sfm_reset_arena();
      let f = this.alloc(o, 16)
        , p = this.alloc(Vb.length * 4, 16)
        , m = this.alloc(d * 8, 16);
      new Uint8Array(this.wasm.memory.buffer, f, o).set(e.subarray(0, o)),
        new Int32Array(this.wasm.memory.buffer, p, Vb.length).set(Wb(t));
      let h = this.wasm.sfm_fast9_select_grid_fused_u16_f32(f, t, n, r, i, s, p, m, d);
      if (h < 0 || h > d)
        return null;
      let g = new DataView(this.wasm.memory.buffer, m, h * 8)
        , _ = new Uint16Array(h)
        , v = new Uint16Array(h)
        , y = new Float32Array(h);
      for (let e = 0; e < h; e++) {
        let t = e * 8;
        _[e] = g.getUint16(t, !0),
          v[e] = g.getUint16(t + 2, !0),
          y[e] = g.getFloat32(t + 4, !0)
      }
      return {
        count: h,
        xs: _,
        ys: v,
        scores: y
      }
    }
    writeOrientedBriefDescriptors(e, t, n, r, i, a, o, s, c = r.length) {
      let l = Math.min(Math.max(0, Math.floor(c)), r.length, i.length, a.length, o.length, Math.floor(s.length / 8));
      if (l <= 0)
        return !0;
      if (t <= 0 || n <= 0 || e.length < t * n)
        return !1;
      this.wasm.sfm_reset_arena();
      let u = this.alloc(t * n, 16)
        , d = this.alloc(l * 40, 16)
        , f = this.alloc(xr.length, 16)
        , p = this.alloc(l * 8 * 4, 16);
      new Uint8Array(this.wasm.memory.buffer, u, t * n).set(e.subarray(0, t * n)),
        new Int8Array(this.wasm.memory.buffer, f, xr.length).set(xr);
      let m = new Float64Array(this.wasm.memory.buffer, d, l * 5);
      for (let e = 0; e < l; e++) {
        let t = Number.isFinite(a[e]) && a[e] > 0 ? a[e] : 1
          , n = Number.isFinite(o[e]) ? o[e] : 0
          , s = e * 5;
        m[s] = r[e],
          m[s + 1] = i[e],
          m[s + 2] = Math.max(.5, Math.min(8, t)),
          m[s + 3] = Math.cos(n),
          m[s + 4] = Math.sin(n)
      }
      return this.wasm.sfm_write_oriented_brief_u32(u, t, n, d, l, f, p) === l ? (s.set(new Uint32Array(this.wasm.memory.buffer, p, l * 8), 0),
        !0) : !1
    }
    async scoreEssentialMatrices(e, t, n, r, i) {
      if (r <= 0 || i <= 0)
        return new Uint32Array;
      if (e.length < r * 12 || t.length < i * 4)
        return null;
      let a = this.scorePacked(t, i, e, r, n, -1);
      return this.stats.batches++,
        this.stats.hypotheses += r,
        this.stats.matchTests += r * i,
        a.counts
    }
    async scoreBatched(e, t, n) {
      let r = e.filter(e => e.matchCount > 0 && e.hypothesisCount > 0);
      if (r.length === 0)
        return [];
      let i = t.pixelThreshold * t.pixelThreshold
        , a = []
        , o = 0
        , s = 0;
      for (let e of r) {
        if (e.hypothesisCount > t.maxHypothesesPerPair || e.points.length < e.matchCount * 4 || e.hypothesesF.length < e.hypothesisCount * 12)
          return null;
        let n = this.scorePacked(e.points, e.matchCount, e.hypothesesF, e.hypothesisCount, i, e.pairIndex);
        a.push(n.best),
          o += e.hypothesisCount,
          s += e.hypothesisCount * e.matchCount
      }
      return n?.(`Wasm SIMD geometry scoring: ${r.length} pairs, ${o} hypotheses, ${s.toLocaleString()} Sampson tests`),
        this.stats.batches++,
        this.stats.hypotheses += o,
        this.stats.matchTests += s,
        a
    }
    getAndResetStats() {
      let e = {
        ...this.stats
      };
      return this.stats = {
        batches: 0,
        hypotheses: 0,
        matchTests: 0
      },
        e
    }
    createPnPScoringContext(e, t) {
      if (e.length <= 0)
        return null;
      this.wasm.sfm_reset_arena();
      let n = e.length
        , r = Math.ceil(n / 4)
        , i = this.alloc(n * 20, 16)
        , a = this.alloc(r * 80, 16)
        , o = this.alloc(32, 16)
        , s = this.alloc(48, 16)
        , c = this.alloc(Gb * 48, 16)
        , l = this.alloc(Gb * 8, 16)
        , u = this.alloc(n * 4, 16)
        , d = this.alloc(n * 4, 16)
        , f = this.alloc(16, 16)
        , p = new Float32Array(this.wasm.memory.buffer, i, n * 5);
      for (let t = 0; t < n; t++) {
        let n = e[t]
          , r = t * 5;
        p[r] = n.X[0],
          p[r + 1] = n.X[1],
          p[r + 2] = n.X[2],
          p[r + 3] = n.u,
          p[r + 4] = n.v
      }
      return new Float32Array(this.wasm.memory.buffer, o, 8).set([t.fx, t.fy, t.cx, t.cy, t.k1 ?? 0, t.k2 ?? 0, t.p1 ?? 0, t.p2 ?? 0]),
        this.wasm.sfm_make_pnp_tiles4_f32(i, n, a),
      {
        scorePose: (e, t, r) => this.scorePnPPose(n, a, o, s, u, d, f, e, t, r),
        scorePoses: (e, t) => this.scorePnPPoseBatch(n, a, o, c, l, u, d, f, e, t),
        reprojectionErrors: (e, t) => this.scorePnPReprojectionErrors(n, a, o, s, u, d, f, e, t)
      }
    }
    triangulateNormalizedPairs(e, t, n, r, i, a) {
      if (a <= 0)
        return new Float64Array;
      if (i.length < a * 4)
        return null;
      this.wasm.sfm_reset_arena();
      let o = this.alloc(a * 32, 16)
        , s = this.alloc(96, 16)
        , c = this.alloc(96, 16)
        , l = this.alloc(a * 32, 16);
      if (new Float64Array(this.wasm.memory.buffer, o, a * 4).set(i.subarray(0, a * 4)),
        this.writePoseF64(s, e, t),
        this.writePoseF64(c, n, r),
        this.wasm.sfm_triangulate_normalized_pairs_f64(o, a, s, c, l) !== a)
        return null;
      let u = new Float64Array(a * 4);
      return u.set(new Float64Array(this.wasm.memory.buffer, l, a * 4)),
        u
    }
    solveFivePointCharts(e, t, n, r, i) {
      let a = Math.max(0, Math.floor(t))
        , o = Math.max(0, Math.floor(r))
        , s = Math.max(0, Math.floor(i));
      if (a <= 0 || o <= 0 || s <= 0)
        return new Float64Array;
      if (e.length < a * 36 || n.length < o * 3)
        return null;
      this.wasm.sfm_reset_arena();
      let c = this.alloc(a * 36 * 8, 16)
        , l = this.alloc(o * 3 * 8, 16)
        , u = this.alloc(s * 9 * 8, 16);
      new Float64Array(this.wasm.memory.buffer, c, a * 36).set(e.subarray(0, a * 36)),
        new Float64Array(this.wasm.memory.buffer, l, o * 3).set(n.subarray(0, o * 3));
      let d = this.wasm.sfm_solve_five_point_charts_f64(c, a, l, o, u, s);
      if (d < 0 || d > s)
        return null;
      let f = new Float64Array(d * 9);
      return f.set(new Float64Array(this.wasm.memory.buffer, u, d * 9)),
        f
    }
    createBundleReprojectionCostContext(e) {
      let t = Math.max(0, Math.floor(e.observationCount))
        , n = Math.max(0, Math.floor(e.pointCount))
        , r = Math.max(0, Math.floor(e.poseCount));
      if (n <= 0 || r <= 0 || t <= 0 || e.observations.length < t * 2 || e.measurements.length < t * 2)
        return null;
      this.wasm.sfm_reset_arena();
      let i = this.alloc(n * 3 * 8, 16)
        , a = this.alloc(r * 12 * 8, 16)
        , o = this.alloc(r * 8 * 8, 16)
        , s = this.alloc(t * 2 * 4, 16)
        , c = this.alloc(t * 2 * 8, 16)
        , l = this.alloc(24, 16);
      return new Int32Array(this.wasm.memory.buffer, s, t * 2).set(e.observations.subarray(0, t * 2)),
        new Float64Array(this.wasm.memory.buffer, c, t * 2).set(e.measurements.subarray(0, t * 2)),
      {
        score: (u, d, f, p) => this.scoreBundleReprojectionCosts(n, r, t, i, a, o, s, c, l, e.observations, e.measurements, u, d, f, p)
      }
    }
    createBundleNormalEquationContext(e) {
      let t = Math.max(0, Math.floor(e.observationCount))
        , n = Math.max(0, Math.floor(e.pointCount))
        , r = Math.max(0, Math.floor(e.poseCount))
        , i = Math.max(0, Math.floor(e.cameraCount))
        , a = Math.max(0, Math.floor(e.wBlockCount));
      if (n <= 0 || r <= 0 || i <= 0 || t <= 0 || e.observations.length < t * 4 || e.pointObservationRanges.length < n * 2 || e.measurements.length < t * 2 || a <= 0)
        return null;
      this.wasm.sfm_reset_arena();
      let o = this.alloc(n * 3 * 8, 16)
        , s = this.alloc(r * 12 * 8, 16)
        , c = this.alloc(r * 8 * 8, 16)
        , l = this.alloc(t * 4 * 4, 16)
        , u = this.alloc(n * 2 * 4, 16)
        , d = this.alloc(t * 2 * 8, 16)
        , f = this.alloc(264, 16)
        , p = this.alloc(i * 36 * 8, 16)
        , m = this.alloc(i * 6 * 8, 16)
        , h = this.alloc(n * 9 * 8, 16)
        , g = this.alloc(n * 3 * 8, 16)
        , _ = this.alloc(a * 8, 16)
        , v = this.alloc(i * 6 * i * 6 * 8, 16)
        , y = this.alloc(i * 6 * 8, 16)
        , b = this.alloc(n * 9 * 8, 16)
        , x = this.alloc(n, 16)
        , S = this.alloc(i * 6 * 8, 16)
        , C = this.alloc(n * 3 * 8, 16);
      return new Int32Array(this.wasm.memory.buffer, l, t * 4).set(e.observations.subarray(0, t * 4)),
        new Int32Array(this.wasm.memory.buffer, u, n * 2).set(e.pointObservationRanges.subarray(0, n * 2)),
        new Float64Array(this.wasm.memory.buffer, d, t * 2).set(e.measurements.subarray(0, t * 2)),
      {
        accumulate: (v, y, b, x, S, C, w, T, E) => this.accumulateBundleNormalEquations(n, r, i, t, a, o, s, c, l, u, d, f, p, m, h, g, _, e.observations, e.pointObservationRanges, e.measurements, v, y, b, x, S, C, w, T, E),
        accumulateToSchur: (S, C, w, T, E, D, O, k, A) => this.accumulateBundleSchur(n, r, i, t, a, o, s, c, l, u, d, f, p, m, h, g, _, v, y, b, x, e.observations, e.pointObservationRanges, e.measurements, S, C, w, T, E, D, O, k, A),
        backSubstitute: (t, r) => this.backSubstituteBundlePoints(n, i, l, u, g, _, b, x, S, C, e.observations, e.pointObservationRanges, t, r)
      }
    }
    scorePacked(e, t, n, r, i, a) {
      this.wasm.sfm_reset_arena();
      let o = Math.ceil(t / 4)
        , s = this.alloc(t * 16, 16)
        , c = this.alloc(o * 64, 16)
        , l = this.alloc(r * 48, 16)
        , u = this.alloc(r * 4, 16)
        , d = this.alloc(r * 4, 16)
        , f = this.alloc(16, 16);
      new Float32Array(this.wasm.memory.buffer, s, t * 4).set(e.subarray(0, t * 4)),
        new Float32Array(this.wasm.memory.buffer, l, r * 12).set(n.subarray(0, r * 12)),
        this.wasm.sfm_make_pixel_tiles4_f32(s, t, c),
        this.wasm.sfm_score_fundamental_batch_f32(c, t, l, r, i, u, d),
        this.wasm.sfm_reduce_best_hypothesis(u, d, r, f);
      let p = new Uint32Array(r);
      p.set(new Uint32Array(this.wasm.memory.buffer, u, r));
      let m = new Float32Array(r);
      m.set(new Float32Array(this.wasm.memory.buffer, d, r));
      let h = new DataView(this.wasm.memory.buffer, f, 16);
      return {
        counts: p,
        errors: m,
        best: {
          pairIndex: a,
          bestHypothesis: h.getInt32(0, !0),
          bestInlierCount: h.getUint32(4, !0),
          bestTieBreakError: h.getFloat32(8, !0)
        }
      }
    }
    alloc(e, t) {
      let n = this.wasm.sfm_alloc(e, t);
      if (n <= 0)
        throw Error(`Wasm geometry allocation failed`);
      return n
    }
    scoreBundleReprojectionCosts(e, t, n, r, i, a, o, s, c, l, u, d, f, p, m) {
      if (d.length < e * 3 || f.length < t * 12 || p.length < t * 8 || !Number.isFinite(m))
        return null;
      new Float64Array(this.wasm.memory.buffer, r, e * 3).set(d.subarray(0, e * 3)),
        new Float64Array(this.wasm.memory.buffer, i, t * 12).set(f.subarray(0, t * 12)),
        new Float64Array(this.wasm.memory.buffer, a, t * 8).set(p.subarray(0, t * 8)),
        new Int32Array(this.wasm.memory.buffer, o, n * 2).set(l.subarray(0, n * 2)),
        new Float64Array(this.wasm.memory.buffer, s, n * 2).set(u.subarray(0, n * 2));
      let h = this.wasm.sfm_bundle_reprojection_costs_f64(r, i, a, o, s, n, m, c);
      if (h < 0 || h > n)
        return null;
      let g = new DataView(this.wasm.memory.buffer, c, 24);
      return {
        l2Sum: g.getFloat64(0, !0),
        huberSum: g.getFloat64(8, !0),
        count: g.getFloat64(16, !0)
      }
    }
    accumulateBundleNormalEquations(e, t, n, r, i, a, o, s, c, l, u, d, f, p, m, h, g, _, v, y, b, x, S, C, w, T, E, D, O) {
      if (b.length < e * 3 || x.length < t * 12 || S.length < t * 8 || w.length < n * 36 || T.length < n * 6 || E.length < e * 9 || D.length < e * 3 || !Number.isFinite(C))
        return !1;
      let k = 0;
      for (let e of O)
        k += e.length;
      if (k !== i)
        return !1;
      new Float64Array(this.wasm.memory.buffer, a, e * 3).set(b.subarray(0, e * 3)),
        new Float64Array(this.wasm.memory.buffer, o, t * 12).set(x.subarray(0, t * 12)),
        new Float64Array(this.wasm.memory.buffer, s, t * 8).set(S.subarray(0, t * 8)),
        new Int32Array(this.wasm.memory.buffer, c, r * 4).set(_.subarray(0, r * 4)),
        new Int32Array(this.wasm.memory.buffer, l, e * 2).set(v.subarray(0, e * 2)),
        new Float64Array(this.wasm.memory.buffer, u, r * 2).set(y.subarray(0, r * 2)),
        new Float64Array(this.wasm.memory.buffer, f, n * 36).fill(0),
        new Float64Array(this.wasm.memory.buffer, p, n * 6).fill(0),
        new Float64Array(this.wasm.memory.buffer, m, e * 9).fill(0),
        new Float64Array(this.wasm.memory.buffer, h, e * 3).fill(0),
        new Float64Array(this.wasm.memory.buffer, g, i).fill(0);
      let A = this.wasm.sfm_bundle_accumulate_normal_equations_f64(a, o, s, c, u, r, C, d, f, p, m, h, g);
      if (A < 0 || A > r)
        return !1;
      w.set(new Float64Array(this.wasm.memory.buffer, f, n * 36)),
        T.set(new Float64Array(this.wasm.memory.buffer, p, n * 6)),
        E.set(new Float64Array(this.wasm.memory.buffer, m, e * 9)),
        D.set(new Float64Array(this.wasm.memory.buffer, h, e * 3));
      let j = new Float64Array(this.wasm.memory.buffer, g, i)
        , ee = 0;
      for (let e of O)
        e.set(j.subarray(ee, ee + e.length)),
          ee += e.length;
      return !0
    }
    accumulateBundleSchur(e, t, n, r, i, a, o, s, c, l, u, d, f, p, m, h, g, _, v, y, b, x, S, C, w, T, E, D, O, k, A, j, ee) {
      let M = n * 6;
      if (w.length < e * 3 || T.length < t * 12 || E.length < t * 8 || k.length < M * M || A.length < M || j.length < e * 9 || ee.length < e || !Number.isFinite(D) || !Number.isFinite(O))
        return !1;
      new Float64Array(this.wasm.memory.buffer, a, e * 3).set(w.subarray(0, e * 3)),
        new Float64Array(this.wasm.memory.buffer, o, t * 12).set(T.subarray(0, t * 12)),
        new Float64Array(this.wasm.memory.buffer, s, t * 8).set(E.subarray(0, t * 8)),
        new Int32Array(this.wasm.memory.buffer, c, r * 4).set(x.subarray(0, r * 4)),
        new Int32Array(this.wasm.memory.buffer, l, e * 2).set(S.subarray(0, e * 2)),
        new Float64Array(this.wasm.memory.buffer, u, r * 2).set(C.subarray(0, r * 2)),
        new Float64Array(this.wasm.memory.buffer, f, n * 36).fill(0),
        new Float64Array(this.wasm.memory.buffer, p, n * 6).fill(0),
        new Float64Array(this.wasm.memory.buffer, m, e * 9).fill(0),
        new Float64Array(this.wasm.memory.buffer, h, e * 3).fill(0),
        new Float64Array(this.wasm.memory.buffer, g, i).fill(0);
      let N = this.wasm.sfm_bundle_accumulate_normal_equations_f64(a, o, s, c, u, r, D, d, f, p, m, h, g);
      if (N < 0 || N > r)
        return !1;
      let te = this.wasm.sfm_bundle_reduce_schur_f64(c, l, e, n, f, p, m, h, g, O, _, v, y, b);
      return te < 0 || te > e ? !1 : (k.set(new Float64Array(this.wasm.memory.buffer, _, M * M)),
        A.set(new Float64Array(this.wasm.memory.buffer, v, M)),
        j.set(new Float64Array(this.wasm.memory.buffer, y, e * 9)),
        ee.set(new Uint8Array(this.wasm.memory.buffer, b, e)),
        !0)
    }
    backSubstituteBundlePoints(e, t, n, r, i, a, o, s, c, l, u, d, f, p) {
      let m = t * 6;
      if (f.length < m || p.length < e * 3)
        return !1;
      new Int32Array(this.wasm.memory.buffer, n, u.length).set(u),
        new Int32Array(this.wasm.memory.buffer, r, e * 2).set(d.subarray(0, e * 2)),
        new Float64Array(this.wasm.memory.buffer, c, m).set(f.subarray(0, m)),
        new Float64Array(this.wasm.memory.buffer, l, e * 3).fill(0);
      let h = this.wasm.sfm_bundle_back_substitute_f64(n, r, e, i, a, o, s, c, l);
      return h < 0 || h > e ? !1 : (p.set(new Float64Array(this.wasm.memory.buffer, l, e * 3)),
        !0)
    }
    scorePnPPose(e, t, n, r, i, a, o, s, c, l) {
      if (e <= 0 || !Number.isFinite(l))
        return null;
      this.writePose(r, s, c),
        this.wasm.sfm_score_pnp_pose_f32(t, e, n, r, l, i, a, o);
      let u = new DataView(this.wasm.memory.buffer, o, 16)
        , d = u.getUint32(0, !0)
        , f = u.getFloat32(4, !0);
      return {
        inliers: Array.from(new Int32Array(this.wasm.memory.buffer, i, d)),
        inlierCount: d,
        errorSum: f
      }
    }
    scorePnPPoseBatch(e, t, n, r, i, a, o, s, c, l) {
      if (e <= 0 || c.length <= 0 || c.length > Gb || !Number.isFinite(l))
        return null;
      let u = new Float32Array(this.wasm.memory.buffer, r, c.length * 12);
      for (let e = 0; e < c.length; e++) {
        let t = c[e]
          , n = e * 12;
        u.set([t.R[0], t.R[1], t.R[2], t.R[3], t.R[4], t.R[5], t.R[6], t.R[7], t.R[8], t.t[0], t.t[1], t.t[2]], n)
      }
      if (this.wasm.sfm_score_pnp_pose_batch_f32(t, e, n, r, c.length, l, a, o, s, i) !== c.length)
        return null;
      let d = new DataView(this.wasm.memory.buffer, i, c.length * 8)
        , f = [];
      for (let e = 0; e < c.length; e++) {
        let t = e * 8;
        f.push({
          poseIndex: e,
          inlierCount: d.getUint32(t, !0),
          errorSum: d.getFloat32(t + 4, !0)
        })
      }
      return f
    }
    scorePnPReprojectionErrors(e, t, n, r, i, a, o, s, c) {
      if (e <= 0)
        return null;
      this.writePose(r, s, c),
        this.wasm.sfm_score_pnp_pose_f32(t, e, n, r, -1, i, a, o);
      let l = new Float32Array(e);
      return l.set(new Float32Array(this.wasm.memory.buffer, a, e)),
        l
    }
    writePose(e, t, n) {
      new Float32Array(this.wasm.memory.buffer, e, 12).set([t[0], t[1], t[2], t[3], t[4], t[5], t[6], t[7], t[8], n[0], n[1], n[2]])
    }
    writePoseF64(e, t, n) {
      new Float64Array(this.wasm.memory.buffer, e, 12).set([t[0], t[1], t[2], t[3], t[4], t[5], t[6], t[7], t[8], n[0], n[1], n[2]])
    }
  }
  ;
async function Jb() {
  debugger
  if (typeof WebAssembly > `u`)
    return null;
  try {
    let e = await Bb();
    return !e || !WebAssembly.validate(e) ? null : Yb(e)
  } catch {
    return null
  }
}
async function Yb(e) {
  let t = await WebAssembly.compile(e);
  if (WebAssembly.Module.imports(t).length > 0)
    throw Error(`Geometry Wasm module must not import host functions`);
  let n = (await WebAssembly.instantiate(t, {})).exports;
  if (!(n.memory instanceof WebAssembly.Memory) || typeof n.sfm_alloc != `function` || typeof n.sfm_reset_arena != `function` || typeof n.sfm_make_pixel_tiles4_f32 != `function` || typeof n.sfm_score_fundamental_batch_f32 != `function` || typeof n.sfm_reduce_best_hypothesis != `function` || typeof n.sfm_make_pnp_tiles4_f32 != `function` || typeof n.sfm_score_pnp_pose_f32 != `function` || typeof n.sfm_score_pnp_pose_batch_f32 != `function` || typeof n.sfm_fast9_scores_f32 != `function` || typeof n.sfm_fast9_scores_offsets_f32 != `function` || typeof n.sfm_fast9_select_grid_u16_f32 != `function` || typeof n.sfm_fast9_select_grid_fused_u16_f32 != `function` || typeof n.sfm_write_oriented_brief_u32 != `function` || typeof n.sfm_match_brief_directional_u32 != `function` || typeof n.sfm_triangulate_normalized_pairs_f64 != `function` || typeof n.sfm_solve_five_point_charts_f64 != `function` || typeof n.sfm_bundle_reprojection_costs_f64 != `function` || typeof n.sfm_bundle_accumulate_normal_equations_f64 != `function` || typeof n.sfm_bundle_reduce_schur_f64 != `function` || typeof n.sfm_bundle_back_substitute_f64 != `function`)
    throw Error(`Geometry Wasm module does not expose the expected ABI`);
  return new qb(n)
}
var Xb = 2e8
  , Zb = class {
    wasm;
    supportsBatch = !0;
    supportsCompactPairs = !0;
    label = `Wasm SIMD`;
    maxDescriptorComparisonsPerDispatch = Xb;
    stats = {
      batches: 0,
      comparisons: 0,
      compactBatches: 0,
      directionalBatches: 0,
      maxComparisonsPerBatch: 0,
      descriptorCpuUploadBytes: 0,
      descriptorGpuCopyBytes: 0,
      readbackBytes: 0
    };
    constructor(e) {
      this.wasm = e
    }
    async bestMatches(e, t, n, r) {
      return this.bestMatchesSync(e, t, n, r)
    }
    async matchPairsCompact(e, t, n, r, i) {
      let a = Array(t.length);
      for (let o = 0; o < t.length; o++) {
        let s = t[o]
          , c = e[s.i]
          , l = e[s.j];
        if (!c || !l || c.count === 0 || l.count === 0)
          a[o] = [];
        else {
          let e = this.bestMatchesSync(c, l, n, r)
            , t = this.bestMatchesSync(l, c, n, r);
          if (!e || !t)
            return null;
          a[o] = ex(e, t)
        }
        i?.({
          stage: `wasm`,
          completed: o + 1,
          total: t.length
        }),
          (o & 31) == 31 && await tx()
      }
      return a
    }
    getAndResetStats() {
      let e = {
        ...this.stats
      };
      return this.stats = {
        batches: 0,
        comparisons: 0,
        compactBatches: 0,
        directionalBatches: 0,
        maxComparisonsPerBatch: 0,
        descriptorCpuUploadBytes: 0,
        descriptorGpuCopyBytes: 0,
        readbackBytes: 0
      },
        e
    }
    bestMatchesSync(e, t, n, r) {
      if (e.count < 0 || t.count < 0 || e.descriptors.length < e.count * 8 || t.descriptors.length < t.count * 8)
        return null;
      let i = e.count
        , a = t.count
        , o = new Int32Array(i).fill(-1)
        , s = new Uint32Array(i);
      if (i === 0)
        return {
          best: o,
          distance: s
        };
      this.wasm.sfm_reset_arena();
      let c = i * 8 * 4
        , l = a * 8 * 4
        , u = this.alloc(c, 16)
        , d = this.alloc(Math.max(4, l), 16)
        , f = this.alloc(i * 4, 16)
        , p = this.alloc(i * 4, 16);
      new Uint32Array(this.wasm.memory.buffer, u, i * 8).set(e.descriptors.subarray(0, i * 8)),
        a > 0 && new Uint32Array(this.wasm.memory.buffer, d, a * 8).set(t.descriptors.subarray(0, a * 8));
      let m = Math.max(0, Math.min(256, Math.round(n)))
        , h = Math.fround(Math.max(0, Math.min(1, r)));
      return this.wasm.sfm_match_brief_directional_u32(u, i, d, a, m, h, f, p),
        o.set(new Int32Array(this.wasm.memory.buffer, f, i)),
        s.set(new Uint32Array(this.wasm.memory.buffer, p, i)),
        this.recordDirectional(i * a, c + l, i * 8),
      {
        best: o,
        distance: s
      }
    }
    recordDirectional(e, t, n) {
      this.stats.batches++,
        this.stats.directionalBatches++,
        this.stats.comparisons += e,
        this.stats.maxComparisonsPerBatch = Math.max(this.stats.maxComparisonsPerBatch, e),
        this.stats.descriptorCpuUploadBytes += t,
        this.stats.readbackBytes += n
    }
    alloc(e, t) {
      let n = this.wasm.sfm_alloc(Math.max(4, e), t);
      if (n <= 0)
        throw Error(`Wasm matcher allocation failed`);
      return n
    }
  }
  ;
async function Qb() {
  if (typeof WebAssembly > `u`)
    return null;
  try {
    let e = await Bb();
    return !e || !WebAssembly.validate(e) ? null : $b(e)
  } catch {
    return null
  }
}
async function $b(e) {
  let t = await WebAssembly.compile(e);
  if (WebAssembly.Module.imports(t).length > 0)
    throw Error(`Geometry Wasm module must not import host functions`);
  let n = (await WebAssembly.instantiate(t, {})).exports;
  if (!(n.memory instanceof WebAssembly.Memory) || typeof n.sfm_alloc != `function` || typeof n.sfm_reset_arena != `function` || typeof n.sfm_match_brief_directional_u32 != `function`)
    throw Error(`Geometry Wasm module does not expose the BRIEF matcher ABI`);
  return new Zb(n)
}
function ex(e, t) {
  let n = [];
  for (let r = 0; r < e.best.length; r++) {
    let i = e.best[r];
    i < 0 || t.best[i] === r && n.push({
      a: r,
      b: i,
      distance: e.distance[r]
    })
  }
  return n
}
function tx() {
  return new Promise(e => setTimeout(e, 0))
}
var nx = 0;
async function rx(e = ax()) {
  let t = e.now ?? Date.now
    , n = t()
    , r = [];
  for (let n of ox(e))
    r.push(await sx(n, t));
  let i = Math.max(0, t() - n);
  return {
    status: mx(r.map(e => e.status)),
    startedAt: n,
    durationMs: i,
    checks: r
  }
}
function ix(e) {
  let t = e.checks.filter(e => e.status === `pass`).length
    , n = e.checks.filter(e => e.status === `warn`).length
    , r = e.checks.filter(e => e.status === `fail`).length
    , i = [`${t} pass`];
  return n > 0 && i.push(`${n} warn`),
    r > 0 && i.push(`${r} fail`),
    `${e.status.toUpperCase()} - ${i.join(`, `)} in ${hx(e.durationMs)}`
}
function ax() {
  let e = globalThis;
  return {
    now: () => globalThis.performance?.now() ?? Date.now(),
    webAssembly: e.WebAssembly,
    offscreenCanvasCtor: e.OffscreenCanvas,
    createImageBitmap: e.createImageBitmap,
    fileCtor: e.File,
    blobCtor: e.Blob,
    indexedDB: e.indexedDB,
    navigator: e.navigator,
    requestAnimationFrame: e.requestAnimationFrame?.bind(e),
    cancelAnimationFrame: e.cancelAnimationFrame?.bind(e),
    setTimeout: globalThis.setTimeout.bind(globalThis),
    clearTimeout: globalThis.clearTimeout.bind(globalThis),
    createGeometryWasmScorer: Jb
  }
}
function ox(e) {
  return [{
    id: `browser-core`,
    label: `Browser image runtime`,
    run: () => Promise.resolve(cx(e))
  }, {
    id: `indexeddb`,
    label: `Persistent browser storage`,
    run: () => lx(e)
  }, {
    id: `render-loop`,
    label: `Render loop scheduling`,
    run: () => dx(e)
  }, {
    id: `wasm-geometry`,
    label: `Wasm geometry kernels`,
    run: () => fx(e)
  }, {
    id: `webgpu`,
    label: `WebGPU acceleration`,
    run: () => px(e)
  }]
}
async function sx(e, t) {
  let n = t();
  try {
    let r = await e.run();
    return {
      id: e.id,
      label: e.label,
      durationMs: Math.max(0, t() - n),
      ...r
    }
  } catch (r) {
    return {
      id: e.id,
      label: e.label,
      status: `fail`,
      detail: r instanceof Error ? r.message : String(r),
      durationMs: Math.max(0, t() - n)
    }
  }
}
function cx(e) {
  let t = [];
  return e.webAssembly || t.push(`WebAssembly`),
    e.offscreenCanvasCtor || t.push(`OffscreenCanvas`),
    e.createImageBitmap || t.push(`createImageBitmap`),
    e.fileCtor || t.push(`File`),
    e.blobCtor || t.push(`Blob`),
    t.length > 0 ? {
      status: `fail`,
      detail: `Missing required browser APIs: ${t.join(`, `)}`
    } : {
      status: `pass`,
      detail: `Image decode, canvas, file, and WebAssembly APIs are present`
    }
}
async function lx(e) {
  if (!e.indexedDB)
    return {
      status: `warn`,
      detail: `IndexedDB is unavailable; project and step cache persistence will fall back`
    };
  let t = `websfm-runtime-health-${++nx}`;
  try {
    return await ux(e.indexedDB, t),
    {
      status: `pass`,
      detail: `IndexedDB open and delete succeeded`
    }
  } catch (e) {
    return {
      status: `warn`,
      detail: `IndexedDB probe failed: ${e instanceof Error ? e.message : String(e)}`
    }
  }
}
function ux(e, t) {
  return new Promise((n, r) => {
    let i = e.open(t, 1);
    i.onupgradeneeded = () => {
      i.result.createObjectStore(`health`)
    }
      ,
      i.onerror = () => r(i.error ?? Error(`open failed`)),
      i.onsuccess = () => {
        i.result.close();
        let a = e.deleteDatabase(t);
        a.onerror = () => r(a.error ?? Error(`delete failed`)),
          a.onsuccess = () => n(),
          a.onblocked = () => r(Error(`delete blocked`))
      }
  }
  )
}
function dx(e) {
  if (!e.requestAnimationFrame || !e.cancelAnimationFrame)
    return Promise.resolve({
      status: `fail`,
      detail: `requestAnimationFrame or cancelAnimationFrame is unavailable`
    });
  let t = e.requestAnimationFrame
    , n = e.cancelAnimationFrame
    , r = e.setTimeout ?? globalThis.setTimeout.bind(globalThis)
    , i = e.clearTimeout ?? globalThis.clearTimeout.bind(globalThis);
  return new Promise(e => {
    let a = !1
      , o = 0
      , s = r(() => {
        a || (a = !0,
          n(o),
          e({
            status: `warn`,
            detail: `requestAnimationFrame did not respond within 250 ms`
          }))
      }
        , 250);
    o = t(() => {
      a || (a = !0,
        i(s),
        e({
          status: `pass`,
          detail: `Animation frame callback completed`
        }))
    }
    )
  }
  )
}
async function fx(e) {
  if (!e.webAssembly)
    return {
      status: `fail`,
      detail: `WebAssembly is unavailable`
    };
  if (!e.createGeometryWasmScorer)
    return {
      status: `warn`,
      detail: `Wasm geometry scorer factory is not available`
    };
  try {
    return await e.createGeometryWasmScorer() ? {
      status: `pass`,
      detail: `Wasm geometry kernels loaded`
    } : {
      status: `warn`,
      detail: `Wasm geometry kernels could not be loaded; JavaScript fallbacks will be used`
    }
  } catch (e) {
    return {
      status: `warn`,
      detail: `Wasm geometry probe failed: ${e instanceof Error ? e.message : String(e)}`
    }
  }
}
async function px(e) {
  let t = e.navigator?.gpu;
  if (!t)
    return {
      status: `warn`,
      detail: `WebGPU is unavailable; CPU/Wasm fallbacks will be used`
    };
  try {
    return await t.requestAdapter({
      powerPreference: `high-performance`
    }) ? {
      status: `pass`,
      detail: `WebGPU adapter is available`
    } : {
      status: `warn`,
      detail: `WebGPU adapter request returned no adapter`
    }
  } catch (e) {
    return {
      status: `warn`,
      detail: `WebGPU adapter probe failed: ${e instanceof Error ? e.message : String(e)}`
    }
  }
}
function mx(e) {
  return e.includes(`fail`) ? `fail` : e.includes(`warn`) ? `warn` : `pass`
}
function hx(e) {
  return e < 1e3 ? `${Math.round(e)} ms` : `${(e / 1e3).toFixed(1)} s`
}
var gx = 96
  , _x = .88
  , vx = 6e3
  , yx = 6e3
  , bx = 256
  , xx = 1024
  , Sx = 44
  , Cx = 32
  , wx = 1
  , Tx = 12
  , Ex = 5
  , Dx = `websfm_points.ply`
  , Ox = `websfm_nerfstudio_dataset.zip`
  , kx = 6e4
  , Ax = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='2' height='2' viewBox='0 0 2 2'%3E%3Crect width='2' height='2' fill='%23eef2f5'/%3E%3C/svg%3E`
  , jx = `last-source-assets`
  , Mx = `websfm-source-asset-selection`
  , Nx = `websfm-active-named-annotation`
  , Px = `websfm.experimentalWasmFast`
  , Fx = `websfm.experimentalWasmFastGrid`
  , Ix = `websfm.experimentalWasmFastFused`
  , Lx = `websfm.featureExtractionPath`
  , Rx = [`source`, `features`, `pair-plan`, `matches`, `geometry`, `bundle`, `exports`]
  , zx = [`#ff7a18`, `#1b8f6a`, `#2563eb`, `#d12f6a`, `#8a5cf6`, `#c97a00`, `#008aa8`, `#d13f2f`];
function Bx(e) {
  return e === `wasm-grid` || e === `wasm` || e === `wasm-fused` ? `wasm-grid` : e === `wasm-score-map` || e === `wasm-score` ? `wasm-score-map` : e === `webgpu` || e === `webgpu-legacy` || e === `gpu` ? `webgpu` : e === `javascript` || e === `js` || e === `cpu` ? `javascript` : null
}
function Vx() {
  try {
    let e = new URLSearchParams(window.location.search)
      , t = Bx(e.get(`featurePath`) ?? e.get(`fastPath`));
    if (t)
      return t;
    if (e.get(`wasmFastGrid`) === `1` || e.get(`wasmFastFused`) === `1`)
      return `wasm-grid`;
    if (e.get(`wasmFast`) === `1`)
      return `wasm-score-map`;
    if (e.get(`wasmFast`) === `0`)
      return `javascript`;
    let n = Bx(localStorage.getItem(Lx));
    if (n)
      return n;
    if (localStorage.getItem(Fx) === `1` || localStorage.getItem(Ix) === `1`)
      return `wasm-grid`;
    if (localStorage.getItem(Px) === `1`)
      return `wasm-score-map`
  } catch { }
  return `webgpu`
}
var Hx = {
  source: `Source`,
  features: `Features`,
  "pair-plan": `Pair plan`,
  matches: `Matches`,
  geometry: `Geometry`,
  bundle: `Bundle`,
  exports: `Exports`
}
  , Ux = document.querySelector(`#app`);
if (!Ux)
  throw Error(`Missing #app`);
Ux.innerHTML = Wx();
function Wx() {
  return `
    <main class="shell">
      <section class="workspace">
        <header class="topbar">
          <div class="brand">
            <div class="brandMark" aria-hidden="true">
              <svg id="brandLogo" viewBox="0 0 96 116" role="img">
                <path class="brandTree" d="M45 6 C35 25 24 39 12 54 C23 54 32 52 39 48 C28 67 18 80 3 94 C19 96 34 95 45 90 L45 112 L57 112 L57 6 Z" />
                <g class="brandGraph">
                  <path d="M57 6 L70 30 L87 38 L73 55 L82 73 L94 95 L75 82 L59 96 L57 112" />
                  <path d="M57 36 L70 30 L57 56 L73 55 L87 38" />
                  <path d="M57 70 L73 55 L59 96 L45 112" />
                  <path d="M59 96 L94 95" />
                </g>
                <g class="brandNodes">
                  <circle cx="57" cy="6" r="5" />
                  <circle cx="70" cy="30" r="4" />
                  <circle cx="87" cy="38" r="5" />
                  <circle cx="73" cy="55" r="4" />
                  <circle cx="82" cy="73" r="5" />
                  <circle cx="94" cy="95" r="5" />
                  <circle cx="59" cy="96" r="5" />
                </g>
              </svg>
            </div>
            <div>
              <h1>WebSfM</h1>
              <p>WebGPU based client side Structure-from-Motion</p>
            </div>
          </div>
          <nav class="topnav" aria-label="Workflow">
            <button class="topnavItem active" type="button" data-nav-target="result">3D View</button>
            <button class="topnavItem" type="button" data-nav-target="setup">Setup</button>
            <button class="topnavItem" type="button" data-nav-target="annotations">Annotations</button>
            <button class="topnavItem" type="button" data-nav-target="diagnostics">Diagnostics</button>
            <button class="topnavItem" type="button" data-nav-target="exports">Exports</button>
            <button class="topnavItem" type="button" data-nav-target="about">About</button>
          </nav>
          <label class="mobileNav">
            <span>View</span>
            <select id="mobileNavSelect" aria-label="Workflow view">
              <option value="result">3D View</option>
              <option value="setup">Setup</option>
              <option value="annotations">Annotations</option>
              <option value="diagnostics">Diagnostics</option>
              <option value="exports">Exports</option>
              <option value="about">About</option>
            </select>
          </label>
          <label class="topProjectSwitcher">
            <span>Project</span>
            <select id="topProjectSelect" aria-label="Active project"></select>
          </label>
          <div class="actions">
            <button id="themeToggle" class="themeToggle" type="button" aria-pressed="false" aria-label="Switch to dark mode" title="Switch to dark mode">
              <span class="themeToggleIcon" aria-hidden="true"></span>
              <span class="themeToggleText">Dark</span>
            </button>
            <button id="statusToggle" type="button" aria-pressed="false" hidden>Status</button>
            <button id="uploadAssets" type="button">Upload</button>
            <button id="run" type="button">Reconstruct</button>
          </div>
        </header>

        <div class="content statusClosed">
          <button id="settingsToggle" class="settingsIconToggle" type="button" aria-controls="settingsPanel" aria-expanded="true" aria-label="Hide settings" title="Hide settings">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M9.7 3.2 9.2 5.4a7.5 7.5 0 0 0-1.4.8L5.7 5.5 3.4 9.4l1.7 1.5a7.4 7.4 0 0 0 0 1.7l-1.7 1.5 2.3 3.9 2.1-.7c.4.3.9.6 1.4.8l.5 2.2h4.6l.5-2.2c.5-.2 1-.4 1.4-.8l2.1.7 2.3-3.9-1.7-1.5a7.4 7.4 0 0 0 0-1.7l1.7-1.5-2.3-3.9-2.1.7a7.5 7.5 0 0 0-1.4-.8l-.5-2.2H9.7Z" />
              <circle cx="12" cy="12" r="3.1" />
            </svg>
            <span class="srOnly">Toggle settings</span>
          </button>
          <aside id="settingsPanel" class="panel" aria-label="Settings drawer">
            <div class="panelTitle">
              <div>
                <span>Settings</span>
                <small>Start from a preset, then tune only the groups that diagnostics point at.</small>
              </div>
              <button id="panelMinimize" class="panelMinimize" type="button" aria-controls="settingsPanel" aria-expanded="true" aria-label="Hide settings drawer" title="Hide settings">
                <span aria-hidden="true"></span>
              </button>
            </div>

            <details class="settingsGroup" data-settings-section="run" open>
              <summary>Run preset</summary>
              <div class="groupBody">
                <div class="field">
                  <label for="quality">Quality mode</label>
                  <select id="quality">
                    <option value="fast">Fast</option>
                    <option value="balanced" selected>Balanced</option>
                    <option value="dense">Dense / Slow</option>
                  </select>
                  <small class="fieldHint">Sets the baseline feature count, matching breadth, and reconstruction strictness.</small>
                </div>
                <div class="field">
                  <label for="scenePreset">Scene type</label>
                  <select id="scenePreset">
                    <option value="general" selected>General photos</option>
                    <option value="building-loop">Building / loop</option>
                    <option value="small-object">Small object</option>
                    <option value="large-images">Very large images</option>
                    <option value="aerial-drone">Aerial / drone grid</option>
                    <option value="video">Video sequence</option>
                  </select>
                  <small class="fieldHint">Adjusts matching breadth, PnP strictness, and geometry gates for common capture shapes.</small>
                </div>
                <div class="field checkboxField">
                  <label for="autoTune">
                    <input id="autoTune" type="checkbox" checked />
                    <span>Auto-tune from images</span>
                  </label>
                  <small class="fieldHint">Softly adjusts scale and feature budgets for the first image resolution.</small>
                </div>
                <div class="field">
                  <label for="runMode">Run mode</label>
                  <select id="runMode">
                    <option value="auto" selected>Auto run</option>
                    <option value="step">Step by step</option>
                  </select>
                  <small class="fieldHint">Step mode stores feature data first, then lets you adjust reconstruction settings and continue from cache.</small>
                </div>
                <div class="field checkboxField">
                  <label for="persistArtifacts">
                    <input id="persistArtifacts" type="checkbox" checked />
                    <span>Persist step data</span>
                  </label>
                  <small class="fieldHint">Stores reusable reconstruction artifacts in this browser using IndexedDB when available.</small>
                </div>
                <div class="field">
                  <label for="clearSessionArtifacts">Step cache</label>
                  <button id="clearSessionArtifacts" type="button">Clear selected cache</button>
                  <small id="sessionStorageStatus" class="fieldHint">Persistent cache checking.</small>
                </div>
                <div class="field">
                  <label for="restartFrom">Restart from</label>
                  <select id="restartFrom">
                    <option value="latest" selected>Latest valid checkpoint</option>
                    <option value="features">Recompute features</option>
                    <option value="pair-plan">Recompute pair plan</option>
                    <option value="matching">Recompute descriptor matches</option>
                    <option value="verification">Rerun geometry only</option>
                  </select>
                  <small class="fieldHint">Controls the earliest cached stage to ignore on the next run. Later stages are rebuilt automatically.</small>
                </div>
              </div>
            </details>

            <details class="settingsGroup" data-settings-section="camera" open>
              <summary>Inputs and camera</summary>
              <div class="groupBody">
                <div class="field">
                  <label for="focalMode">Focal prior</label>
                  <select id="focalMode">
                    <option value="wide" selected>Wide / unknown (0.85x)</option>
                    <option value="normal">Normal (1.00x)</option>
                    <option value="tele">Tele (1.20x)</option>
                    <option value="manual">Manual</option>
                  </select>
                  <small id="focalResolved" class="fieldHint">Wide prior uses 0.85 x max(width, height). Use Manual when COLMAP/EXIF focal is known.</small>
                </div>
                <div class="field">
                  <label for="focal" title="Pixel focal length at the original image resolution.">Manual focal (native px)</label>
                  <input id="focal" type="number" min="1" step="1" placeholder="COLMAP / EXIF focal" disabled />
                  <small class="fieldHint">Native-pixel focal at the original image size. For COLMAP SIMPLE_RADIAL/PINHOLE, use the first focal parameter.</small>
                </div>
                <div class="field">
                  <label for="cameraMode">Camera view</label>
                  <select id="cameraMode">
                    <option value="raw" selected>Raw reconstruction</option>
                    <option value="fitted">Fitted diagnostic</option>
                  </select>
                  <small class="fieldHint">Raw shows recovered camera centers. Fitted is only a visual diagnostic for stretched paths.</small>
                </div>
                <div class="field checkboxField">
                  <label for="flipUp">
                    <input id="flipUp" type="checkbox" />
                    <span>Flip up axis</span>
                  </label>
                  <small class="fieldHint">Changes viewer orientation only; exports keep the reconstructed coordinate frame.</small>
                </div>
              </div>
            </details>

            <details class="settingsGroup" data-settings-section="features" open>
              <summary>Image scale and features</summary>
              <div class="groupBody">
                <div class="field">
                  <label for="scaleMode">Image scale</label>
                  <select id="scaleMode">
                    <option value="auto" selected>Auto recommended</option>
                    <option value="custom">Custom max edge</option>
                    <option value="original">Preserve original</option>
                  </select>
                  <small class="fieldHint">Downscaling is the biggest speed lever. Preserve original only for high-detail experiments.</small>
                </div>
                <div class="field" data-scale-custom>
                  <label for="customMaxLongEdge">Custom max edge</label>
                  <input id="customMaxLongEdge" type="number" min="256" max="6000" step="100" value="2400" />
                  <small class="fieldHint">Caps the processed long edge in pixels before feature extraction.</small>
                </div>
                <div class="field">
                  <label for="features">Max features / image</label>
                  <input id="features" type="number" min="300" max="9000" step="100" value="3200" />
                  <small class="fieldHint">More features help difficult overlap and texture-poor scenes, but matching cost rises quickly.</small>
                </div>
                <div class="field">
                  <label for="threshold">Corner threshold</label>
                  <input id="threshold" type="number" min="4" max="80" step="1" value="20" />
                  <small class="fieldHint">Lower finds weaker corners. Raise it when noisy points flood the image.</small>
                </div>
                <div class="field">
                  <label for="featurePath">Feature path</label>
                  <select id="featurePath">
                    <option value="webgpu" selected>WebGPU FAST + BRIEF</option>
                    <option value="wasm-grid">Wasm FAST + BRIEF</option>
                    <option value="wasm-score-map">Wasm score-map FAST</option>
                    <option value="javascript">JavaScript FAST + BRIEF</option>
                  </select>
                  <small class="fieldHint">WebGPU is the preferred browser path. Wasm and JavaScript keep compatibility baselines for debugging.</small>
                </div>
              </div>
            </details>

            <details class="settingsGroup" data-settings-section="matching" open>
              <summary>Matching</summary>
              <div class="groupBody">
                <div class="field" data-graph-pnp>
                  <label for="pairStrategy">Pair strategy</label>
                  <select id="pairStrategy">
                    <option value="exhaustive">Exhaustive (best <= ~200 imgs)</option>
                    <option value="retrieval" selected>Retrieval top-K</option>
                    <option value="sequential">Sequential window</option>
                  </select>
                  <small class="fieldHint">Controls which image pairs are tested. Exhaustive is strongest; retrieval scales better.</small>
                </div>
                <div class="field" data-graph-pnp>
                  <label for="retrievalTopK">Retrieval top-K</label>
                  <input id="retrievalTopK" type="number" min="4" max="256" step="1" value="32" />
                  <small class="fieldHint">How many visually similar neighbors each image proposes before geometric verification.</small>
                </div>
                <div class="field" data-graph-pnp>
                  <label for="pairCandidateBudget">Pair candidate cap</label>
                  <input id="pairCandidateBudget" type="number" min="0" max="50000" step="100" value="0" />
                  <small class="fieldHint">Caps automatic pair planning before descriptor matching. Zero disables; manual pairs are always kept.</small>
                </div>
                <div class="field">
                  <label for="trackGap">Track gap</label>
                  <input id="trackGap" type="number" min="1" max="8" step="1" value="3" />
                  <small class="fieldHint">Sequential and guided matching window. Larger helps skipped frames but adds pair work.</small>
                </div>
                <div class="field">
                  <label for="minMatches">Min inliers</label>
                  <input id="minMatches" type="number" min="8" max="80" step="1" value="18" />
                  <small class="fieldHint">Minimum epipolar inliers for a pair to survive. Lower is permissive; higher is cleaner.</small>
                </div>
              </div>
            </details>

            <details class="settingsGroup" data-settings-section="mapper" open>
              <summary>Mapper</summary>
              <div class="groupBody">
                <div class="field">
                  <label for="mapper">Mapper</label>
                  <select id="mapper">
                    <option value="graph-pnp" selected>Graph + PnP (default)</option>
                    <option value="classic">Classic (sequential, A/B only)</option>
                  </select>
                  <small class="fieldHint">Graph + PnP is the main pipeline. Classic is kept for sequence-only comparisons.</small>
                </div>
                <div class="field" data-graph-pnp>
                  <label for="pnpMinInliers">PnP min inliers</label>
                  <input id="pnpMinInliers" type="number" min="6" max="200" step="1" value="18" />
                  <small class="fieldHint">Minimum 2D-3D correspondences needed before a camera can register.</small>
                </div>
                <div class="field" data-graph-pnp>
                  <label for="pnpPixelThreshold">PnP threshold (px)</label>
                  <input id="pnpPixelThreshold" type="number" min="0.5" max="20" step="0.5" value="4" />
                  <small class="fieldHint">Pose-RANSAC reprojection gate. Larger can register noisy cameras, but may admit outliers.</small>
                </div>
              </div>
            </details>

            <details class="settingsGroup advanced" data-settings-section="advanced">
              <summary>Advanced matching and geometry</summary>
              <div class="groupBody">
                <div class="field">
                  <label for="gpuMode">GPU mode</label>
                  <select id="gpuMode">
                    <option value="auto" selected>Auto</option>
                    <option value="conservative">Conservative</option>
                    <option value="balanced">Balanced</option>
                    <option value="aggressive">Aggressive</option>
                    <option value="cpu">CPU only</option>
                  </select>
                  <small class="fieldHint">Use Conservative after WebGPU hangs; Aggressive batches more work per submit.</small>
                </div>
                <div class="field">
                  <label for="matcherHamming">Matcher Hamming</label>
                  <input id="matcherHamming" type="number" min="32" max="192" step="1" value="96" />
                  <small class="fieldHint">Maximum BRIEF descriptor distance. Raise when too few pairs match; lower for repetitive texture.</small>
                </div>
                <div class="field">
                  <label for="matcherRatio">Matcher ratio</label>
                  <input id="matcherRatio" type="number" min="0.5" max="0.98" step="0.01" value="0.88" />
                  <small class="fieldHint">Ambiguity filter. Lower is stricter; higher increases recall and outlier risk.</small>
                </div>
                <div class="field checkboxField">
                  <label for="adaptiveMatcherThresholds">
                    <input id="adaptiveMatcherThresholds" type="checkbox" checked />
                    <span>Adaptive matcher gates</span>
                  </label>
                  <small class="fieldHint">Learns a bounded BRIEF Hamming retry gate from verified inliers when fixed matching is too tight.</small>
                </div>
                <div class="field">
                  <label for="maxPointsPerPair">Max points / pair</label>
                  <input id="maxPointsPerPair" type="number" min="0" max="12000" step="100" value="2200" />
                  <small class="fieldHint">Caps how many verified inliers each pair contributes to triangulation volume.</small>
                </div>
                <div class="field">
                  <label for="relativeRansac">Relative RANSAC</label>
                  <input id="relativeRansac" type="number" min="64" max="8000" step="50" value="1500" />
                  <small class="fieldHint">Maximum essential-matrix hypotheses per candidate pair. More helps low-inlier pairs.</small>
                </div>
                <div class="field">
                  <label for="geometryCandidateBudget">Geometry pair cap</label>
                  <input id="geometryCandidateBudget" type="number" min="0" max="50000" step="100" value="0" />
                  <small class="fieldHint">Caps epipolar verification after descriptor matching, prioritizing adjacent and stronger matched pairs.</small>
                </div>
                <div class="field">
                  <label for="relativePoseSolver">Relative solver</label>
                  <select id="relativePoseSolver">
                    <option value="five-point" selected>5-point hybrid LO-RANSAC</option>
                    <option value="eight-point">8-point legacy</option>
                  </select>
                  <small class="fieldHint">5-point is calibrated default and uses hybrid WebGPU scoring when available; 8-point keeps legacy behavior for A/B checks.</small>
                </div>
                <div class="field">
                  <label for="triangulationReprojection">Triangulation px</label>
                  <input id="triangulationReprojection" type="number" min="1" max="20" step="0.5" value="6" />
                  <small class="fieldHint">Rejects points whose two seed observations reproject farther than this pixel cap.</small>
                </div>
                <div class="field">
                  <label for="triangulationParallax">Triangulation parallax</label>
                  <input id="triangulationParallax" type="number" min="0.05" max="5" step="0.05" value="0.5" />
                  <small class="fieldHint">Minimum baseline angle for creating new 3D points. Higher improves depth confidence.</small>
                </div>
                <div class="field">
                  <label for="verifiedParallax">Pair parallax floor</label>
                  <input id="verifiedParallax" type="number" min="0" max="5" step="0.05" value="0.35" />
                  <small class="fieldHint">Minimum median parallax for accepting a verified graph edge.</small>
                </div>
                <div class="field checkboxField">
                  <label for="allowWeakInitial">
                    <input id="allowWeakInitial" type="checkbox" />
                    <span>Weak bootstrap fallback</span>
                  </label>
                  <small class="fieldHint">Last-resort seed pair fallback. Use only when diagnostics show no strict initial pair.</small>
                </div>
                <div class="field checkboxField">
                  <label for="localPointRefinement">
                    <input id="localPointRefinement" type="checkbox" checked />
                    <span>Local point refinement</span>
                  </label>
                  <small class="fieldHint">Re-triangulates touched tracks after PnP and demotes bad observations.</small>
                </div>
                <div class="field checkboxField">
                  <label for="localPoseRefinement">
                    <input id="localPoseRefinement" type="checkbox" checked />
                    <span>Local pose refinement</span>
                  </label>
                  <small class="fieldHint">Runs a small pose-only BA pass on each newly registered PnP camera.</small>
                </div>
                <div class="field checkboxField">
                  <label for="refineIntrinsics">
                    <input id="refineIntrinsics" type="checkbox" checked />
                    <span>Refine intrinsics</span>
                  </label>
                  <small class="fieldHint">Lets global BA adjust one shared focal scale while keeping principal points fixed.</small>
                </div>
              </div>
            </details>

            <details class="settingsGroup" data-settings-section="classic" data-classic-only>
              <summary>Classic bridge search</summary>
              <div class="groupBody">
                <div class="field">
                  <label for="bridgeMode">Bridge search</label>
                  <select id="bridgeMode">
                    <option value="retrieval" selected>Visual retrieval</option>
                    <option value="component-exhaustive">Component exhaustive</option>
                    <option value="off">Off</option>
                  </select>
                  <small class="fieldHint">Attempts to connect classic mapper components after sequential registration stalls.</small>
                </div>
                <div class="field">
                  <label for="bridgeCandidates">Bridge candidates</label>
                  <input id="bridgeCandidates" type="number" min="0" max="2000" step="16" value="96" />
                  <small class="fieldHint">Maximum extra cross-component image pairs to verify.</small>
                </div>
                <div class="field">
                  <label for="bridgePairs">Pairs / component edge</label>
                  <input id="bridgePairs" type="number" min="1" max="64" step="1" value="4" />
                  <small class="fieldHint">How many candidate pairs are kept around each component boundary.</small>
                </div>
                <div class="field">
                  <label for="bridgeSignature">Signature max</label>
                  <input id="bridgeSignature" type="number" min="0" max="256" step="1" value="118" />
                  <small class="fieldHint">Descriptor-signature distance cutoff for bridge retrieval.</small>
                </div>
                <div class="field">
                  <label for="bridgeInliers">Bridge min inliers</label>
                  <input id="bridgeInliers" type="number" min="20" max="300" step="5" value="60" />
                  <small class="fieldHint">Minimum verified inliers required before merging two classic components.</small>
                </div>
              </div>
            </details>

            <details class="settingsGroup" data-settings-section="guided">
              <summary>Guided track extension</summary>
              <div class="groupBody">
                <div class="field">
                  <label for="guidedRadius">Guided radius</label>
                  <input id="guidedRadius" type="number" min="0" max="60" step="1" value="14" />
                  <small class="fieldHint">Search radius for adding observations to already-triangulated tracks. Zero disables it.</small>
                </div>
                <div class="field">
                  <label for="guidedDistance">Guided descriptor</label>
                  <input id="guidedDistance" type="number" min="0" max="128" step="1" value="70" />
                  <small class="fieldHint">Descriptor distance cap for guided track extension.</small>
                </div>
              </div>
            </details>
            <div class="runtimeHealthPanel" aria-label="Runtime health test">
              <button id="runtimeHealthRun" type="button">Run health test</button>
              <small id="runtimeHealthStatus" class="runtimeHealthStatus" aria-live="polite">Not run yet</small>
            </div>
          </aside>

          <section class="centerColumn">
            <section id="setupPage" class="setupPage workspacePage" aria-label="Setup upload" hidden>
              <div class="assetsHeader">
                <div>
                  <h2>Setup</h2>
                  <p>Drop photos, an image folder, or a browser-decodable video. Everything stays local in this browser.</p>
                  <small id="activeProjectName" class="projectStatus">No project yet</small>
                </div>
                <button id="setupNamedAnnotations" class="textButton" type="button">Named annotations</button>
              </div>
              <section class="projectManager" aria-label="Projects">
                <div class="projectManagerTitle">
                  <strong>Projects</strong>
                  <small id="projectManagerHint">Create a project or upload images to start the default project.</small>
                </div>
                <select id="projectSelect" aria-label="Project"></select>
                <div class="projectActions">
                  <button id="newProject" type="button">New</button>
                  <button id="renameProject" type="button" disabled>Rename</button>
                  <button id="deleteProject" type="button" disabled>Delete</button>
                  <button id="exportProject" type="button" disabled>Export project</button>
                  <label class="fileButton projectImportButton">
                    <input id="importProjectFile" type="file" accept=".websfmproject,.zip,.tar,.tgz,.gz,application/gzip,application/x-tar,application/zip" />
                    Import project
                  </label>
                </div>
              </section>
              <div id="assetDropzone" class="assetDropzone" tabindex="0" role="button" aria-label="Drop images, an image folder, or a video">
                <div class="assetDropIcon" aria-hidden="true"></div>
                <strong>Drop images, a folder, or one video file</strong>
                <span>Image sets are ready immediately. Videos are converted into sampled image frames before reconstruction.</span>
                <div class="assetActions">
                  <label class="fileButton">
                    <input id="files" type="file" accept="image/*" multiple />
                    Browse images
                  </label>
                  <label class="fileButton">
                    <input id="folderFiles" type="file" accept="image/*" multiple webkitdirectory directory />
                    Choose folder
                  </label>
                  <label class="fileButton">
                    <input id="videoFile" type="file" accept="video/*,.mp4,.mov,.m4v,.webm,.ogv,.avi,.mkv" />
                    Select video
                  </label>
                </div>
              </div>
              <small id="assetStatus" class="assetStatus">No assets selected yet.</small>

              <section id="imageListPanel" class="imageListPanel" aria-label="Images selected for reconstruction" hidden>
                <div class="imageListHeader">
                  <div>
                    <strong>Images for reconstruction</strong>
                    <small id="imageListHint">Uploaded images are pre-selected. Uncheck or delete frames that are blurry, duplicated, or otherwise poor inputs.</small>
                  </div>
                  <div class="imageListActions">
                    <button id="selectAllImages" type="button">Select all</button>
                    <button id="clearImageSelection" type="button">Clear</button>
                  </div>
                </div>
                <div id="imageGrid" class="imageGrid"></div>
              </section>

              <section id="videoSettings" class="videoSettings" hidden>
                <div class="videoHeader">
                  <div>
                    <strong>Video frame capture</strong>
                    <small>Sample browser-decodable video into images. MP4/H.264 and WebM usually work best.</small>
                  </div>
                  <button id="clearVideo" type="button" disabled>Clear video</button>
                </div>
                <video id="videoPreview" class="videoPreview" controls muted playsinline preload="metadata"></video>
                <canvas id="videoCanvas" class="videoCanvas"></canvas>
                <div class="videoGrid">
                  <div class="field">
                    <label for="videoFrameCount">Frames to extract</label>
                    <input id="videoFrameCount" type="number" min="2" max="2000" step="1" value="60" />
                    <small class="fieldHint">Evenly samples the selected time range. More frames improve coverage but add matching cost.</small>
                  </div>
                  <div class="field">
                    <label for="videoStart">Start time (s)</label>
                    <input id="videoStart" type="number" min="0" step="0.1" placeholder="0" />
                    <small class="fieldHint">Leave empty to start at the beginning.</small>
                  </div>
                  <div class="field">
                    <label for="videoEnd">End time (s)</label>
                    <input id="videoEnd" type="number" min="0" step="0.1" placeholder="Auto" />
                    <small class="fieldHint">Leave empty to use detected full duration; required if duration is unavailable.</small>
                  </div>
                  <div class="field">
                    <label for="videoMaxEdge">Extract max edge</label>
                    <input id="videoMaxEdge" type="number" min="0" max="6000" step="100" value="2000" />
                    <small class="fieldHint">Resizes frames during extraction. Use 0 to keep source video resolution.</small>
                  </div>
                  <div class="field">
                    <label for="videoFormat">Frame format</label>
                    <select id="videoFormat">
                      <option value="image/jpeg" selected>JPEG</option>
                      <option value="image/png">PNG</option>
                    </select>
                    <small class="fieldHint">JPEG is smaller and faster. PNG preserves exact pixels but uses more memory.</small>
                  </div>
                  <div class="field">
                    <label for="videoQuality">JPEG quality</label>
                    <input id="videoQuality" type="number" min="0.1" max="1" step="0.01" value="0.92" />
                    <small class="fieldHint">Only applies to JPEG output.</small>
                  </div>
                  <div class="field">
                    <label for="videoBaseName">Frame filename base</label>
                    <input id="videoBaseName" type="text" value="frame" />
                    <small class="fieldHint">Generated files are named like frame_000001.jpg.</small>
                  </div>
                </div>
                <div class="videoActions">
                  <button id="extractVideo" type="button" disabled>Extract frames</button>
                </div>
                <small id="videoStatus" class="videoStatus">Choose a video, configure sampling, then extract frames for reconstruction.</small>
              </section>

            </section>

            <div id="imagePreviewOverlay" class="imagePreviewOverlay" role="dialog" aria-modal="true" aria-label="Image preview" hidden>
              <div class="imagePreviewSurface">
                <div class="imagePreviewBar">
                  <div class="imagePreviewTitle">
                    <strong id="imagePreviewName">Image preview</strong>
                    <small id="imagePreviewMeta"></small>
                  </div>
                  <div class="imagePreviewActions">
                    <label class="imagePreviewUse">
                      <input id="imagePreviewUse" type="checkbox" />
                      <span>Use</span>
                    </label>
                    <div class="imageMaskTools" aria-label="Mask tools">
                      <button id="imageMaskBrush" type="button" class="active" aria-pressed="true">Brush</button>
                      <button id="imageMaskErase" type="button" aria-pressed="false">Erase</button>
                      <button id="imageMaskFlood" type="button" aria-pressed="false">Flood</button>
                      <label>
                        <span>Size</span>
                        <input id="imageMaskSize" type="range" min="8" max="140" value="44" />
                      </label>
                      <label>
                        <span>Threshold</span>
                        <input id="imageMaskFloodThreshold" type="range" min="0" max="180" value="32" />
                        <span id="imageMaskFloodThresholdValue" class="imageMaskValue">32</span>
                      </label>
                      <button id="imageMaskClear" type="button">Clear mask</button>
                    </div>
                    <div class="imageNamedAnnotationTools" aria-label="Named annotation tools">
                      <button id="imageAnnotationPointTool" type="button" aria-pressed="false">Point</button>
                      <span id="imageAnnotationActive">No named annotation</span>
                      <button id="imageAnnotationRemove" type="button">Remove point</button>
                      <button id="imageAnnotationPrevMarked" type="button">Prev marked</button>
                      <button id="imageAnnotationNextUnmarked" type="button">Next unmarked</button>
                    </div>
                    <span id="imagePreviewZoomLabel" class="imagePreviewZoomLabel">100%</span>
                    <button id="imagePreviewFit" class="imagePreviewFit" type="button">Fit</button>
                    <button id="imagePreviewDelete" type="button">Delete</button>
                    <button id="imagePreviewClose" type="button">Close</button>
                  </div>
                </div>
                <button id="imagePreviewPrev" class="imagePreviewArrow prev" type="button" aria-label="Previous image">‹</button>
                <button id="imagePreviewNext" class="imagePreviewArrow next" type="button" aria-label="Next image">›</button>
                <div id="imagePreviewStage" class="imagePreviewStage" data-preview-zoom="1.000">
                  <img id="imagePreviewFull" alt="" />
                  <canvas id="imageMaskCanvas" class="imageMaskCanvas" aria-label="Mask editor canvas"></canvas>
                </div>
              </div>
            </div>
            <div id="namedAnnotationModal" class="namedAnnotationModal" role="dialog" aria-modal="true" aria-labelledby="namedAnnotationModalTitle" hidden>
              <div class="namedAnnotationModalSurface">
                <div class="namedAnnotationModalHeader">
                  <div>
                    <strong id="namedAnnotationModalTitle">Named annotations</strong>
                    <small>Choose the active point label, then mark it across images.</small>
                  </div>
                  <button id="namedAnnotationModalClose" type="button">Close</button>
                </div>
                <section class="namedAnnotationPanel" aria-label="Named image annotations">
                  <div class="namedAnnotationCatalog">
                    <div class="namedAnnotationSearchRow">
                      <label for="namedAnnotationSearch">Named annotation</label>
                      <input id="namedAnnotationSearch" type="search" placeholder="Search or type a new name" autocomplete="off" />
                      <button id="namedAnnotationCreate" type="button">New</button>
                    </div>
                    <div id="namedAnnotationList" class="namedAnnotationList"></div>
                  </div>
                  <div class="namedAnnotationInspector">
                    <div>
                      <strong id="namedAnnotationActiveTitle">No named annotation selected</strong>
                      <small id="namedAnnotationActiveMeta">Create or select a named annotation to mark it across images.</small>
                    </div>
                    <div class="namedAnnotationEditRow">
                      <input id="namedAnnotationName" type="text" placeholder="Annotation name" disabled />
                      <button id="namedAnnotationRename" type="button" disabled>Rename</button>
                      <button id="namedAnnotationDelete" type="button" disabled>Delete</button>
                    </div>
                    <div class="namedAnnotationBrowseRow">
                      <button id="namedAnnotationOpenCurrent" type="button" disabled>Open image</button>
                      <button id="namedAnnotationPrevMarked" type="button" disabled>Prev marked</button>
                      <button id="namedAnnotationNextUnmarked" type="button" disabled>Next unmarked</button>
                    </div>
                  </div>
                </section>
              </div>
            </div>
            <div id="annotationAdvisorModal" class="annotationAdvisorModal" role="dialog" aria-modal="true" aria-labelledby="annotationAdvisorModalTitle" hidden>
              <div class="annotationAdvisorModalSurface">
                <div class="annotationAdvisorModalHeader">
                  <div>
                    <strong id="annotationAdvisorModalTitle">Annotation analysis</strong>
                    <small id="annotationAdvisorSummary">Run analysis to inspect annotation coverage and suggested settings.</small>
                  </div>
                  <button id="annotationAdvisorClose" type="button">Close</button>
                </div>
                <section class="annotationAdvisorBody" aria-label="Annotation reconstruction advice">
                  <div class="annotationAdvisorStatus">
                    <strong id="annotationAdvisorProfile">No analysis yet</strong>
                    <small id="annotationAdvisorConfidence">Confidence --</small>
                  </div>
                  <div id="annotationAdvisorMetrics" class="annotationAdvisorMetrics"></div>
                  <div class="annotationAdvisorColumns">
                    <section>
                      <h3>Reasons</h3>
                      <ul id="annotationAdvisorReasons"></ul>
                    </section>
                    <section>
                      <h3>Warnings</h3>
                      <ul id="annotationAdvisorWarnings"></ul>
                    </section>
                    <section>
                      <h3>Annotation actions</h3>
                      <ul id="annotationAdvisorActions"></ul>
                    </section>
                    <section>
                      <h3>Settings changes</h3>
                      <ul id="annotationAdvisorSettings"></ul>
                    </section>
                  </div>
                </section>
                <div class="annotationAdvisorFooter">
                  <button id="annotationAdvisorApply" type="button" disabled>Apply settings</button>
                </div>
              </div>
            </div>

            <section id="annotationsPage" class="annotationsPage workspacePage" aria-label="Manual pair annotations" hidden>
              <div class="workspacePageHeader">
                <div>
                  <h2>Annotations</h2>
                  <p>Create project-level ground-truth correspondences before reconstruction.</p>
                </div>
                <div class="workspaceHeaderActions">
                  <button id="annotationsAnalyze" class="textButton" type="button">Analyze annotations</button>
                  <button id="annotationsNamedAnnotations" class="textButton" type="button">Named annotations</button>
                  <small id="annotationSummary">No annotations yet</small>
                </div>
              </div>
              <div class="annotationWorkbench">
                <aside id="annotationPairList" class="annotationPairList" aria-label="Annotation pairs"></aside>
                <section class="annotationCanvasPanel" aria-label="Pair annotation canvas">
                  <div class="annotationCanvasToolbar">
                    <strong id="annotationPairTitle">Select a pair</strong>
                    <div class="annotationTools">
                      <button id="annotationFit" type="button">Fit</button>
                      <button id="annotationPan" type="button" aria-pressed="false">Pan</button>
                      <button id="annotationZoomIn" type="button">Zoom +</button>
                      <button id="annotationZoomOut" type="button">Zoom -</button>
                    </div>
                  </div>
                  <canvas id="annotationCanvas" class="annotationCanvas"></canvas>
                </section>
                <aside id="annotationDetails" class="annotationDetails" aria-label="Annotation details"></aside>
              </div>
            </section>

            <section class="viewer" aria-label="3D reconstruction preview">
              <div id="viewer"></div>
              <div class="viewerHeader">
                <div>
                  <span id="viewerModeTitle">3D view</span>
                  <small id="viewerModeSubtitle">Orbit, inspect camera path, then export.</small>
                </div>
                <div class="viewerHeaderActions">
                  <button id="viewerImagesToggle" class="viewerToggleButton" type="button" aria-pressed="true" title="Toggle camera image thumbnails">
                    <span class="viewerToggleMark" aria-hidden="true">x</span>
                    <span>Images</span>
                  </button>
                  <span id="gpuState" class="gpuPill">WebGPU: checking</span>
                </div>
              </div>
              <div class="hud">
                <span>Drag to orbit</span>
                <span>Scroll to zoom</span>
              </div>
              <div id="stageAnalysis" class="stageAnalysis" aria-live="polite">
                <div class="stageAnalysisHeader">
                  <div>
                    <span id="stageAnalysisEyebrow">Static analysis</span>
                    <strong id="stageAnalysisTitle">Source and decode</strong>
                  </div>
                  <span id="stageAnalysisAssessment" class="stageAnalysisAssessment neutral">Waiting</span>
                </div>
                <p id="stageAnalysisSummary" class="stageAnalysisSummary">Select images or a cached stage to inspect readiness.</p>
                <div id="stageAnalysisMetrics" class="stageAnalysisMetrics"></div>
                <div id="stageAnalysisBars" class="stageAnalysisBars"></div>
                <div id="stageAnalysisNotes" class="stageAnalysisNotes"></div>
              </div>
            </section>

            <section id="diagnosticsPage" class="diagnosticsPage workspacePage" aria-label="Diagnostics" hidden>
              <div class="workspacePageHeader">
                <div>
                  <h2>Diagnostics</h2>
                  <p>Review verified, weak, rejected, and skipped image pairs from the latest reconstruction run.</p>
                </div>
                <div class="diagnosticHeaderControls">
                  <small id="diagnosticSummary">No run yet</small>
                  <label class="diagnosticToggle">
                    <input id="showAllPairs" type="checkbox" />
                    <span>Show all pairs</span>
                  </label>
                </div>
              </div>
              <section class="runInspector" aria-label="Cached run stage inspector">
                <div class="runInspectorHeader">
                  <label for="runSessionSelect">Cached run</label>
                  <select id="runSessionSelect">
                    <option value="">No cached runs yet</option>
                  </select>
                </div>
                <div id="runStageTimeline" class="runStageTimeline"></div>
                <div id="runStageDetail" class="runStageDetail">Run a reconstruction to inspect cached stage data.</div>
              </section>
              <div class="diagnosticsGrid">
                <section class="pairInspector" aria-label="Matched pair visual inspector">
                  <div class="pairInspectorHeader">
                    <strong id="pairInspectorTitle">Matched pair view</strong>
                    <small id="pairInspectorMeta">Select a diagnostics row to inspect matches.</small>
                  </div>
                  <canvas id="pairInspectorCanvas" class="pairInspectorCanvas"></canvas>
                </section>
                <div id="diagnosticRows" class="diagnosticRows"></div>
              </div>
            </section>

            <section id="exportsPage" class="exportsPage workspacePage" aria-label="Exports" hidden>
              <div class="workspacePageHeader">
                <div>
                  <h2>Exports</h2>
                  <p>Package reconstruction outputs for downstream tools, inspection, and debugging.</p>
                </div>
              </div>
              <div class="exports">
                <div class="exportGroup exportRunGroup">
                  <strong>Cached run</strong>
                  <small>Select a previous cached reconstruction from this project and load it for export.</small>
                  <select id="exportRunSelect" aria-label="Cached run for export">
                    <option value="">No cached exports yet</option>
                  </select>
                  <button id="loadExportRun" type="button" disabled>Load run for export</button>
                  <span id="exportRunStatus">Run a reconstruction with persistent cache enabled to export older results.</span>
                </div>
                <div class="exportGroup">
                  <strong>Datasets</strong>
                  <small>Ready-to-open folders packaged as ZIP archives.</small>
                  <label class="exportScopeField" for="exportComponentScope">
                    <span>Component scope</span>
                    <select id="exportComponentScope" disabled>
                      <option value="all">All components</option>
                    </select>
                  </label>
                  <button id="exportColmapDataset" type="button" disabled>COLMAP dataset ZIP</button>
                  <button id="exportNerfstudioDataset" type="button" disabled>Nerfstudio dataset ZIP</button>
                  <span>Nerfstudio ZIP includes images, transforms.json, init.ply, and masks/ when image masks are present.</span>
                </div>
                <div class="exportGroup">
                  <strong>Single files</strong>
                  <small>Useful for inspection, scripts, and diagnostics.</small>
                  <button id="exportNerfstudio" type="button" disabled>transforms.json</button>
                  <button id="exportPly" type="button" disabled>points.ply</button>
                  <button id="exportPlyDebug" type="button" disabled>points + cameras.ply</button>
                  <button id="previewSplat" type="button" disabled>Open splat preview</button>
                  <button id="openMeshTrainer" type="button" disabled>Open splat trainer</button>
                  <button id="exportDiagnostics" type="button" disabled>diagnostics.csv</button>
                  <button id="exportCameraDiagnostics" type="button" disabled>camera_centers.csv</button>
                </div>
              </div>
            </section>

            <section class="bottomDock minimized" aria-label="Console">
              <div class="dockHeader">
                <div>
                  <span id="dockTitle">Console</span>
                </div>
                <button id="consoleToggle" class="dockToggle" type="button" aria-expanded="false">Show</button>
              </div>
              <div class="dockContent">
                <pre id="log">Ready. Upload images, a folder, or a video.</pre>
              </div>
            </section>

            <section id="aboutPage" class="aboutPage workspacePage" aria-label="About WebSfM" hidden>
              <div class="aboutHero">
                <h2>Experimental WebGPU Structure-from-Motion in your browser</h2>
                <p>WebSfM reconstructs a sparse camera path and colored point cloud entirely on the client side. Images and videos are decoded locally; nothing is sent to a server and no native COLMAP binary is required.</p>
                <p class="aboutCodeNotice">The code is planned to be open sourced during 2026. Until then, all rights for the code are reserved.</p>
              </div>
              <div class="aboutGrid">
                <section>
                  <h3>How it works</h3>
                  <p>The pipeline decodes images, scores multi-scale FAST-9 corners, writes oriented BRIEF descriptors, matches candidate pairs, verifies epipolar geometry, grows a graph + PnP reconstruction, triangulates tracks, and runs sparse bundle adjustment.</p>
                  <p>When WebGPU is available, compact descriptor matching and batched epipolar scoring run on the GPU with CPU fallbacks.</p>
                </section>
                <section>
                  <h3>Best inputs</h3>
                  <p>Use overlapping photos or sampled video frames with steady motion around the subject. The Balanced preset is the default; Dense adds features and pair work for difficult scenes, while Fast is better for quick ordered sequences.</p>
                  <p>Autotune adjusts image scale, feature count, and matcher thresholds from the first asset size unless you override those fields manually.</p>
                </section>
                <section>
                  <h3>Outputs</h3>
                  <p>Export a COLMAP dataset ZIP with images and sparse text files, a Nerfstudio dataset ZIP with transforms and init.ply, standalone PLY point clouds, and diagnostic CSVs for failed or weak pairs.</p>
                </section>
                <section>
                  <h3>Limitations</h3>
                  <p>This is experimental. Browser WebGPU backends vary, local binary features remain weaker than SIFT or learned features on difficult natural scenes, focal length is still heuristic unless supplied, and failed PnP cameras remain unregistered instead of forming separate components.</p>
                </section>
                <section>
                  <h3>Learn more</h3>
                  <p>For a deeper introduction to computer vision, camera geometry, and Structure-from-Motion, the <a href="https://visionbook.mit.edu/" target="_blank" rel="noreferrer">MIT Vision Book</a> is excellent learning material.</p>
                  <p>The OpenCV article <a href="https://opencv.org/blog/structure-from-motion-in-opencv/" target="_blank" rel="noreferrer">Structure from Motion in OpenCV</a> is also a practical overview of the SfM pipeline, camera intrinsics, matching, pose estimation, triangulation, and bundle adjustment.</p>
                  <p>The online edition is an external reference published under CC BY-NC-ND 4.0. WebSfM does not copy book text or code.</p>
                </section>
                <section>
                  <h3>Attributions and licenses</h3>
                  <p>Core methods follow standard published algorithms: Rosten and Drummond <a href="https://www.edwardrosten.com/work/fast.html" target="_blank" rel="noreferrer">FAST-9 corners</a>, Calonder et al. <a href="https://doi.org/10.1007/978-3-642-15561-1_56" target="_blank" rel="noreferrer">BRIEF descriptors</a>, <a href="https://www.cs.ubc.ca/~lowe/papers/ijcv04.pdf" target="_blank" rel="noreferrer">Lowe-style descriptor ratio tests</a>, <a href="https://www.robots.ox.ac.uk/~vgg/hzbook/" target="_blank" rel="noreferrer">Hartley-Zisserman multiple-view geometry</a> for normalized essential matrices, Sampson error, triangulation, RANSAC, and sparse bundle adjustment, Grunert P3P with <a href="https://doi.org/10.1364/JOSAA.4.000629" target="_blank" rel="noreferrer">Horn rigid alignment</a> for pose candidates, <a href="https://doi.org/10.1109/34.88573" target="_blank" rel="noreferrer">Umeyama Sim(3) alignment</a>, plus Huber and Levenberg-Marquardt style robust optimization.</p>
                  <p>The implementation is project-local TypeScript and WGSL; no third-party algorithm source is vendored for those steps. Export names describe file-format compatibility with COLMAP-style text models and Nerfstudio / Brush datasets; those projects are not bundled. Checked direct package metadata lists three.js, Vite, and Vitest as MIT; TypeScript and Playwright as Apache-2.0; and @webgpu/types as BSD-3-Clause.</p>
                </section>
              </div>
            </section>
          </section>

          <aside class="runRail">
            <section class="progressCard">
              <div class="progressRing" aria-label="Run state">
                <span id="runStateLabel">Idle</span>
              </div>
              <p>Upload images, a folder, or a video, then reconstruct a camera path and sparse point cloud.</p>
            </section>
            <section class="stats">
              <div><span id="imageCount">0</span><small>assets</small></div>
              <div><span id="pointCount">0</span><small>sparse points</small></div>
              <div><span id="error">-</span><small>median px</small></div>
            </section>
            <section class="phaseList" aria-label="Run phases and checkpoints">
              <button id="phaseDecode" class="phaseItem pending" type="button" data-stage-restart="features" title="Start over from the selected source images"><span aria-hidden="true"></span><div><strong>Decode images</strong><small>Waiting</small></div><span class="phaseBadges"><span class="checkpointBadge source">source</span></span></button>
              <button id="phaseFeatures" class="phaseItem pending" type="button" data-stage-restart="pair-plan" title="Use cached decoded images and features, then rerun later stages"><span aria-hidden="true"></span><div><strong>Extract features</strong><small>Waiting</small></div><span class="phaseBadges"><span id="checkpointFeatures" class="checkpointBadge pending">pending</span></span></button>
              <button id="phaseMatching" class="phaseItem pending" type="button" data-stage-restart="verification" title="Use cached pair matching, then rerun geometry and bundle adjustment"><span aria-hidden="true"></span><div><strong>Match pairs</strong><small>Waiting</small></div><span class="phaseBadges"><span id="checkpointPairPlan" class="checkpointBadge pending">plan</span><span id="checkpointMatches" class="checkpointBadge pending">matches</span></span></button>
              <button id="phaseMapping" class="phaseItem pending" type="button" data-stage-restart="verification" title="Rerun geometric verification, camera registration, and bundle adjustment"><span aria-hidden="true"></span><div><strong>Register cameras</strong><small>Waiting</small></div><span class="phaseBadges"><span id="checkpointGeometry" class="checkpointBadge pending">pending</span></span></button>
              <button id="phaseBundle" class="phaseItem pending" type="button" data-stage-restart="verification" title="Rerun geometry and bundle adjustment from cached matches"><span aria-hidden="true"></span><div><strong>Bundle adjust</strong><small>Waiting</small></div><span class="phaseBadges"><span class="checkpointBadge source">result</span></span></button>
              <button id="phaseExports" class="phaseItem pending" type="button" data-stage-restart="latest" title="Use the latest valid cached stages"><span aria-hidden="true"></span><div><strong>Exports</strong><small>Pending</small></div><span class="phaseBadges"><span class="checkpointBadge source">export</span></span></button>
            </section>
          </aside>
        </div>
        <footer class="appFooter">
          <span>(c) Matias Hiltunen 2026</span>
          <a href="https://github.com/MatiasHiltunen" target="_blank" rel="noreferrer">github.com/MatiasHiltunen</a>
        </footer>
      </section>
    </main>
  `
}
var Gx = Q(`uploadAssets`)
  , Kx = Q(`settingsToggle`)
  , qx = Q(`panelMinimize`)
  , Jx = Q(`runtimeHealthRun`)
  , Yx = Q(`runtimeHealthStatus`)
  , Xx = Q(`statusToggle`)
  , Zx = Q(`files`)
  , Qx = Q(`folderFiles`)
  , $x = Q(`assetDropzone`)
  , eS = Q(`assetStatus`)
  , tS = Q(`activeProjectName`)
  , nS = Q(`projectManagerHint`)
  , rS = Q(`projectSelect`)
  , iS = Q(`topProjectSelect`)
  , aS = Q(`newProject`)
  , oS = Q(`renameProject`)
  , sS = Q(`deleteProject`)
  , cS = Q(`exportProject`)
  , lS = Q(`importProjectFile`)
  , uS = Q(`imageListPanel`)
  , dS = Q(`imageListHint`)
  , fS = Q(`imageGrid`)
  , pS = Q(`setupNamedAnnotations`)
  , mS = Q(`selectAllImages`)
  , hS = Q(`clearImageSelection`)
  , gS = Q(`imagePreviewOverlay`)
  , _S = Q(`imagePreviewName`)
  , vS = Q(`imagePreviewMeta`)
  , yS = Q(`imagePreviewStage`)
  , bS = Q(`imagePreviewFull`)
  , xS = Q(`imageMaskCanvas`)
  , SS = Q(`imagePreviewClose`)
  , CS = Q(`imagePreviewPrev`)
  , wS = Q(`imagePreviewNext`)
  , TS = Q(`imagePreviewFit`)
  , ES = Q(`imagePreviewZoomLabel`)
  , DS = Q(`imagePreviewUse`)
  , OS = Q(`imagePreviewDelete`)
  , kS = Q(`imageMaskBrush`)
  , AS = Q(`imageMaskErase`)
  , jS = Q(`imageMaskFlood`)
  , MS = Q(`imageMaskSize`)
  , NS = Q(`imageMaskFloodThreshold`)
  , PS = Q(`imageMaskFloodThresholdValue`)
  , FS = Q(`imageMaskClear`)
  , IS = Q(`imageAnnotationPointTool`)
  , LS = Q(`imageAnnotationActive`)
  , RS = Q(`imageAnnotationRemove`)
  , zS = Q(`imageAnnotationPrevMarked`)
  , BS = Q(`imageAnnotationNextUnmarked`)
  , VS = Q(`videoFile`)
  , HS = Q(`videoSettings`)
  , B = Q(`videoPreview`)
  , US = Q(`videoCanvas`)
  , WS = Q(`videoFrameCount`)
  , GS = Q(`videoStart`)
  , KS = Q(`videoEnd`)
  , qS = Q(`videoMaxEdge`)
  , JS = Q(`videoFormat`)
  , YS = Q(`videoQuality`)
  , XS = Q(`videoBaseName`)
  , ZS = Q(`extractVideo`)
  , QS = Q(`clearVideo`)
  , $S = Q(`videoStatus`)
  , eC = Q(`run`)
  , tC = Q(`quality`)
  , nC = Q(`scenePreset`)
  , rC = Q(`autoTune`)
  , iC = Q(`runMode`)
  , aC = Q(`persistArtifacts`)
  , oC = Q(`restartFrom`)
  , sC = Q(`clearSessionArtifacts`)
  , cC = Q(`sessionStorageStatus`)
  , lC = Q(`focal`)
  , uC = Q(`focalMode`)
  , dC = Q(`focalResolved`)
  , fC = Q(`scaleMode`)
  , pC = Q(`customMaxLongEdge`)
  , mC = Q(`features`)
  , hC = Q(`threshold`)
  , gC = Q(`featurePath`)
  , _C = Q(`mapper`)
  , vC = Q(`pairStrategy`)
  , yC = Q(`retrievalTopK`)
  , bC = Q(`pairCandidateBudget`)
  , xC = Q(`geometryCandidateBudget`)
  , SC = Q(`pnpMinInliers`)
  , CC = Q(`pnpPixelThreshold`)
  , wC = Q(`trackGap`)
  , TC = Q(`minMatches`)
  , EC = Q(`bridgeMode`)
  , DC = Q(`bridgeCandidates`)
  , OC = Q(`bridgePairs`)
  , kC = Q(`bridgeSignature`)
  , AC = Q(`bridgeInliers`)
  , jC = Q(`guidedRadius`)
  , MC = Q(`guidedDistance`)
  , NC = Q(`gpuMode`)
  , PC = Q(`matcherHamming`)
  , FC = Q(`matcherRatio`)
  , IC = Q(`adaptiveMatcherThresholds`)
  , LC = Q(`maxPointsPerPair`)
  , RC = Q(`relativeRansac`)
  , zC = Q(`relativePoseSolver`)
  , BC = Q(`triangulationReprojection`)
  , VC = Q(`triangulationParallax`)
  , HC = Q(`verifiedParallax`)
  , UC = Q(`allowWeakInitial`)
  , WC = Q(`localPointRefinement`)
  , GC = Q(`localPoseRefinement`)
  , KC = Q(`refineIntrinsics`)
  , qC = Q(`cameraMode`)
  , JC = Q(`flipUp`)
  , YC = Q(`log`)
  , XC = Q(`pointCount`)
  , ZC = Q(`imageCount`)
  , QC = Q(`error`)
  , $C = Q(`gpuState`)
  , ew = Q(`exportColmapDataset`)
  , tw = Q(`exportNerfstudioDataset`)
  , nw = Q(`exportComponentScope`)
  , rw = Q(`exportNerfstudio`)
  , iw = Q(`exportPly`)
  , aw = Q(`exportPlyDebug`)
  , ow = Q(`previewSplat`)
  , sw = Q(`openMeshTrainer`)
  , cw = Q(`exportRunSelect`)
  , lw = Q(`loadExportRun`)
  , uw = Q(`exportRunStatus`)
  , dw = Q(`exportDiagnostics`)
  , fw = Q(`exportCameraDiagnostics`)
  , pw = Q(`diagnosticSummary`)
  , mw = Q(`diagnosticRows`)
  , hw = Q(`showAllPairs`)
  , gw = Q(`pairInspectorCanvas`)
  , _w = Q(`pairInspectorTitle`)
  , vw = Q(`pairInspectorMeta`)
  , yw = Q(`runSessionSelect`)
  , bw = Q(`runStageTimeline`)
  , xw = Q(`runStageDetail`)
  , Sw = Q(`consoleToggle`)
  , Cw = Q(`themeToggle`)
  , ww = Q(`viewerImagesToggle`)
  , Tw = Q(`viewerModeTitle`)
  , Ew = Q(`viewerModeSubtitle`)
  , Dw = Q(`stageAnalysis`)
  , Ow = Q(`stageAnalysisEyebrow`)
  , kw = Q(`stageAnalysisTitle`)
  , Aw = Q(`stageAnalysisAssessment`)
  , jw = Q(`stageAnalysisSummary`)
  , Mw = Q(`stageAnalysisMetrics`)
  , Nw = Q(`stageAnalysisBars`)
  , Pw = Q(`stageAnalysisNotes`)
  , Fw = Array.from(document.querySelectorAll(`[data-nav-target]`))
  , Iw = Q(`mobileNavSelect`)
  , Lw = document.querySelector(`.content`)
  , Rw = document.querySelector(`.panel`)
  , zw = document.querySelector(`.viewer`)
  , Bw = Q(`setupPage`)
  , Vw = Q(`annotationsPage`)
  , Hw = Q(`annotationSummary`)
  , Uw = Q(`annotationsAnalyze`)
  , Ww = Q(`annotationsNamedAnnotations`)
  , Gw = Q(`namedAnnotationModal`)
  , Kw = Q(`namedAnnotationModalClose`)
  , qw = Q(`namedAnnotationSearch`)
  , Jw = Q(`namedAnnotationCreate`)
  , Yw = Q(`namedAnnotationList`)
  , Xw = Q(`namedAnnotationActiveTitle`)
  , Zw = Q(`namedAnnotationActiveMeta`)
  , Qw = Q(`namedAnnotationName`)
  , $w = Q(`namedAnnotationRename`)
  , eT = Q(`namedAnnotationDelete`)
  , tT = Q(`namedAnnotationOpenCurrent`)
  , nT = Q(`namedAnnotationPrevMarked`)
  , rT = Q(`namedAnnotationNextUnmarked`)
  , iT = Q(`annotationAdvisorModal`)
  , aT = Q(`annotationAdvisorClose`)
  , oT = Q(`annotationAdvisorSummary`)
  , sT = Q(`annotationAdvisorProfile`)
  , cT = Q(`annotationAdvisorConfidence`)
  , lT = Q(`annotationAdvisorMetrics`)
  , uT = Q(`annotationAdvisorReasons`)
  , dT = Q(`annotationAdvisorWarnings`)
  , fT = Q(`annotationAdvisorActions`)
  , pT = Q(`annotationAdvisorSettings`)
  , mT = Q(`annotationAdvisorApply`)
  , hT = Q(`annotationPairList`)
  , gT = Q(`annotationCanvas`)
  , _T = Q(`annotationPairTitle`)
  , vT = Q(`annotationDetails`)
  , yT = Q(`annotationFit`)
  , bT = Q(`annotationPan`)
  , xT = Q(`annotationZoomIn`)
  , ST = Q(`annotationZoomOut`)
  , CT = Q(`diagnosticsPage`)
  , wT = Q(`exportsPage`)
  , TT = Q(`aboutPage`)
  , ET = document.querySelector(`.bottomDock`)
  , DT = document.querySelector(`.dockHeader`)
  , OT = document.querySelector(`.centerColumn`)
  , kT = Q(`runStateLabel`)
  , AT = kT.parentElement
  , jT = {
    decode: Q(`phaseDecode`),
    features: Q(`phaseFeatures`),
    matching: Q(`phaseMatching`),
    mapping: Q(`phaseMapping`),
    bundle: Q(`phaseBundle`),
    exports: Q(`phaseExports`)
  }
  , MT = {
    features: Q(`checkpointFeatures`),
    pairPlan: Q(`checkpointPairPlan`),
    matches: Q(`checkpointMatches`),
    geometry: Q(`checkpointGeometry`)
  }
  , NT = new lv(Q(`viewer`))
  , PT = new ri
  , V = fy()
  , FT = US.getContext(`2d`, {
    alpha: !1
  });
if (!FT)
  throw Error(`Could not create video extraction canvas context`);
var IT = FT;
gC.value = Vx();
var H = null
  , LT = []
  , U = null
  , RT = !1
  , zT = !0
  , W = []
  , BT = 1
  , VT = []
  , G = null
  , HT = !1
  , UT = null
  , WT = null
  , GT = []
  , KT = !1
  , qT = 0
  , JT = !0
  , YT = !1
  , XT = !1
  , ZT = localStorage.getItem(`websfm-settings-workflow`) === `notebook` ? `notebook` : `classic`
  , QT = !1
  , $T = null
  , eE = `brush`
  , tE = `mask`
  , nE = {
    scale: 1,
    panX: 0,
    panY: 0
  }
  , rE = !1
  , iE = !1
  , aE = !1
  , oE = null
  , sE = new Map
  , cE = null
  , lE = !1
  , uE = !1
  , dE = null
  , fE = null
  , pE = null
  , mE = null
  , hE = Promise.resolve()
  , gE = Promise.resolve()
  , _E = Promise.resolve()
  , vE = Promise.resolve()
  , yE = !1
  , bE = 0
  , xE = []
  , SE = []
  , CE = null
  , wE = null
  , TE = null
  , EE = null
  , K = null
  , DE = 0
  , OE = 0
  , q = null
  , kE = []
  , AE = `source`
  , jE = new Ta({
    elements: {
      summary: Hw,
      pairList: hT,
      canvas: gT,
      title: _T,
      details: vT,
      fit: yT,
      pan: bT,
      zoomIn: xT,
      zoomOut: ST
    },
    getProjectId: () => G,
    getAssets: () => W.map(e => ({
      projectAssetId: e.projectAssetId,
      name: e.file.name,
      file: e.file,
      selected: e.selected,
      thumbnailUrl: e.thumbnailUrl
    })),
    loadAnnotations: async () => G && V ? V.listManualPairAnnotations(G) : [],
    saveAnnotation: async e => {
      V && await V.putManualPairAnnotation(e)
    }
    ,
    deleteAnnotation: async e => {
      G && V && await V.deleteManualPairAnnotation(G, e)
    }
    ,
    getEvaluations: () => H?.stats.manualPairEvaluations
  })
  , ME = rM();
aM(ME),
  nM(`Idle`, .08),
  BE(),
  YD(!0),
  JD(),
  HD(`result`),
  vE = gk(),
  Tk(),
  zD(),
  Gx.addEventListener(`click`, () => {
    HD(`setup`),
      $x.focus()
  }
  ),
  rS.addEventListener(`change`, () => {
    Gk(rS.value)
  }
  ),
  iS.addEventListener(`change`, () => {
    Gk(iS.value)
  }
  ),
  aS.addEventListener(`click`, () => {
    Wk()
  }
  ),
  oS.addEventListener(`click`, () => {
    Kk()
  }
  ),
  sS.addEventListener(`click`, () => {
    qk()
  }
  ),
  cS.addEventListener(`click`, () => {
    Jk()
  }
  ),
  lS.addEventListener(`change`, () => {
    let e = lS.files?.item(0) ?? null;
    lS.value = ``,
      e && Yk(e)
  }
  ),
  Kx.addEventListener(`click`, () => {
    GD(!JT)
  }
  ),
  qx.addEventListener(`click`, () => {
    GD(!1)
  }
  ),
  Jx.addEventListener(`click`, () => {
    BD()
  }
  ),
  Xx.addEventListener(`click`, () => {
    YT && qD(!XT)
  }
  ),
  Cw.addEventListener(`click`, () => {
    iM(ME === `dark` ? `light` : `dark`)
  }
  ),
  ww.addEventListener(`click`, () => {
    zT = !zT,
      xk(),
      bk()
  }
  ),
  Zx.addEventListener(`change`, () => {
    Qx.value = ``,
      aj(Array.from(Zx.files ?? []), `selected images`),
      Zx.value = ``
  }
  ),
  Qx.addEventListener(`change`, () => {
    Zx.value = ``,
      aj(Array.from(Qx.files ?? []), `selected folder`),
      Qx.value = ``
  }
  ),
  VS.addEventListener(`change`, () => {
    let e = VS.files?.item(0) ?? null;
    e && yj(e)
  }
  ),
  $x.addEventListener(`dragenter`, e => {
    e.preventDefault(),
      $x.classList.add(`dragActive`)
  }
  ),
  $x.addEventListener(`dragover`, e => {
    e.preventDefault(),
      e.dataTransfer && (e.dataTransfer.dropEffect = `copy`),
      $x.classList.add(`dragActive`)
  }
  ),
  $x.addEventListener(`dragleave`, e => {
    $x.contains(e.relatedTarget) || $x.classList.remove(`dragActive`)
  }
  ),
  $x.addEventListener(`drop`, e => {
    e.preventDefault(),
      $x.classList.remove(`dragActive`),
      oj(e.dataTransfer)
  }
  ),
  fS.addEventListener(`change`, e => {
    let t = e.target;
    if (!(t instanceof HTMLInputElement) || t.type !== `checkbox`)
      return;
    let n = t.dataset.assetId
      , r = n ? W.find(e => e.id === n) : void 0;
    !r || U || (ik(),
      r.selected = t.checked,
      ak(),
      yk(),
      sA({
        renderGrid: !1
      }),
      WD())
  }
  ),
  fS.addEventListener(`click`, e => {
    let t = e.target;
    if (!(t instanceof HTMLElement))
      return;
    let n = t.closest(`button[data-asset-action]`);
    if (!n)
      return;
    let r = n.dataset.assetId
      , i = r ? W.find(e => e.id === r) : void 0;
    if (!i)
      return;
    let a = n.dataset.assetAction;
    a === `preview` ? hA(i) : a === `delete` && !U && nA(i.id)
  }
  ),
  mw.addEventListener(`click`, e => {
    let t = e.target;
    if (!(t instanceof HTMLElement))
      return;
    let n = t.closest(`.diagnosticRow`);
    if (!n)
      return;
    let r = Number(n.dataset.leftIndex)
      , i = Number(n.dataset.rightIndex);
    if (!(!Number.isInteger(r) || !Number.isInteger(i))) {
      for (let e of mw.querySelectorAll(`.diagnosticRow`))
        e.classList.toggle(`selected`, e === n);
      if (r < 0 || i < 0) {
        UM(),
          vw.textContent = `This image-level diagnostic has no matched image pair to inspect.`;
        return
      }
      WM(r, i)
    }
  }
  ),
  hw.addEventListener(`change`, () => {
    if (H) {
      PM(H);
      return
    }
    FM()
  }
  ),
  yw.addEventListener(`change`, () => {
    Ak(kE.find(e => e.runId === yw.value) ?? null, AE)
  }
  ),
  bw.addEventListener(`click`, e => {
    let t = e.target;
    if (!(t instanceof HTMLElement))
      return;
    let n = t.closest(`.runStageButton`);
    if (!n)
      return;
    let r = n.dataset.stageId;
    r && Ak(kE.find(e => e.runId === yw.value) ?? q, r)
  }
  ),
  mS.addEventListener(`click`, () => {
    if (!U) {
      ik();
      for (let e of W)
        e.selected = !0;
      ak(),
        yk(),
        sA({
          renderGrid: !1
        }),
        WD()
    }
  }
  ),
  hS.addEventListener(`click`, () => {
    if (!U) {
      ik();
      for (let e of W)
        e.selected = !1;
      ak(),
        yk(),
        sA({
          renderGrid: !1
        }),
        WD()
    }
  }
  ),
  pS.addEventListener(`click`, () => {
    dO()
  }
  ),
  Uw.addEventListener(`click`, () => {
    pO()
  }
  ),
  Ww.addEventListener(`click`, () => {
    dO()
  }
  ),
  Kw.addEventListener(`click`, () => {
    fO()
  }
  ),
  Gw.addEventListener(`click`, e => {
    e.target === Gw && fO()
  }
  ),
  aT.addEventListener(`click`, () => {
    mO()
  }
  ),
  iT.addEventListener(`click`, e => {
    e.target === iT && mO()
  }
  ),
  mT.addEventListener(`click`, () => {
    SO()
  }
  ),
  qw.addEventListener(`input`, () => {
    OO()
  }
  ),
  Jw.addEventListener(`click`, () => {
    jO()
  }
  ),
  Yw.addEventListener(`click`, e => {
    let t = e.target;
    if (!(t instanceof HTMLElement))
      return;
    let n = t.closest(`button[data-named-annotation-id]`);
    n && MO(n.dataset.namedAnnotationId ?? null)
  }
  ),
  $w.addEventListener(`click`, () => {
    NO()
  }
  ),
  eT.addEventListener(`click`, () => {
    PO()
  }
  ),
  tT.addEventListener(`click`, () => {
    let e = gA() ?? W[0] ?? null;
    e && hA(e)
  }
  ),
  nT.addEventListener(`click`, () => {
    qO(-1, `marked`)
  }
  ),
  rT.addEventListener(`click`, () => {
    qO(1, `unmarked`)
  }
  ),
  Qw.addEventListener(`keydown`, e => {
    e.key === `Enter` && NO()
  }
  ),
  SS.addEventListener(`click`, rj),
  CS.addEventListener(`click`, () => tj(-1)),
  wS.addEventListener(`click`, () => tj(1)),
  TS.addEventListener(`click`, () => {
    yA()
  }
  ),
  DS.addEventListener(`change`, () => {
    let e = gA();
    !e || U || (ik(),
      e.selected = DS.checked,
      ak(),
      yk(),
      sA({
        renderGrid: !1
      }),
      WD(),
      vA())
  }
  ),
  OS.addEventListener(`click`, () => {
    nj()
  }
  ),
  gS.addEventListener(`click`, e => {
    e.target === gS && rj()
  }
  ),
  bS.addEventListener(`load`, () => {
    YA()
  }
  ),
  xS.addEventListener(`wheel`, e => {
    bA(e)
  }
    , {
      passive: !1
    }),
  kS.addEventListener(`click`, () => {
    WO(`mask`),
      LA(`brush`)
  }
  ),
  AS.addEventListener(`click`, () => {
    WO(`mask`),
      LA(`erase`)
  }
  ),
  jS.addEventListener(`click`, () => {
    WO(`mask`),
      LA(`flood`)
  }
  ),
  NS.addEventListener(`input`, () => {
    RA()
  }
  ),
  FS.addEventListener(`click`, () => {
    VA()
  }
  ),
  IS.addEventListener(`click`, () => {
    WO(`named`)
  }
  ),
  RS.addEventListener(`click`, () => {
    zO()
  }
  ),
  zS.addEventListener(`click`, () => {
    KO(-1, `marked`)
  }
  ),
  BS.addEventListener(`click`, () => {
    KO(1, `unmarked`)
  }
  ),
  xS.addEventListener(`pointerdown`, e => {
    if (!U && !DA(e)) {
      if (tE === `named`) {
        iE = !0,
          aE = !1,
          xS.setPointerCapture(e.pointerId),
          LO(e);
        return
      }
      if (eE === `flood`) {
        UA(e),
          qA(),
          uk();
        return
      }
      rE = !0,
        xS.setPointerCapture(e.pointerId),
        HA(e)
    }
  }
  ),
  xS.addEventListener(`pointermove`, e => {
    if (!OA(e)) {
      if (iE && !U) {
        LO(e);
        return
      }
      !rE || U || HA(e)
    }
  }
  );
for (let e of [`pointerup`, `pointercancel`, `pointerleave`])
  xS.addEventListener(e, t => {
    if (!kA(t, e)) {
      if (rE) {
        rE = !1;
        try {
          xS.releasePointerCapture(t.pointerId)
        } catch { }
        qA(),
          uk()
      }
      if (iE) {
        iE = !1;
        try {
          xS.releasePointerCapture(t.pointerId)
        } catch { }
        RO()
      }
    }
  }
  );
window.addEventListener(`resize`, () => {
  gS.hidden || YA()
}
),
  ZS.addEventListener(`click`, () => {
    wj()
  }
  ),
  QS.addEventListener(`click`, () => {
    bj(!0),
      sA(),
      XC.textContent = `0`,
      QC.textContent = `-`,
      yk(),
      bM()
  }
  ),
  [WS, GS, KS, qS, JS, YS, XS].forEach(e => {
    e.addEventListener(`input`, () => {
      Sj(),
        Cj()
    }
    ),
      e.addEventListener(`change`, () => {
        Sj(),
          Cj()
      }
      )
  }
  );
function NE() {
  return Y_(tC.value, nC.value)
}
function PE() {
  return nC.options[nC.selectedIndex]?.textContent?.trim() || nC.value
}
function FE() {
  let e = NE();
  mC.value = String(e.maxFeatures),
    hC.value = String(e.threshold),
    pC.value = String(e.maxLongEdge),
    wC.value = String(e.maxTrackGap),
    TC.value = String(e.minMatches),
    vC.value = e.pairStrategy,
    yC.value = String(e.retrievalTopK),
    bC.value = String(e.pairCandidateBudget),
    xC.value = String(e.geometryCandidateBudget),
    SC.value = String(e.pnpMinInliers),
    CC.value = String(e.pnpPixelThreshold),
    EC.value = e.visualBridgeMode,
    DC.value = String(e.visualBridgeCandidates),
    OC.value = String(e.visualBridgePairsPerComponent),
    kC.value = String(e.visualBridgeSignatureMax),
    AC.value = String(e.visualBridgeMinInliers),
    jC.value = String(e.guidedTrackRadius),
    MC.value = String(e.guidedDescriptorDistance),
    NC.value = `auto`,
    zD(),
    PC.value = String(gx),
    FC.value = String(_x),
    IC.checked = !0,
    LC.value = String(e.maxPointsPerPair),
    RC.value = String(e.relativePoseRansacIterations),
    zC.value = `five-point`,
    BC.value = String(e.triangulationReprojectionPx),
    VC.value = String(e.triangulationMinParallaxDeg),
    HC.value = String(e.minVerifiedParallaxDeg),
    UC.checked = !1,
    WC.checked = !0,
    GC.checked = !0,
    KC.checked = !0,
    IE(),
    LE(),
    pD()
}
tC.addEventListener(`change`, FE),
  nC.addEventListener(`change`, FE),
  iC.addEventListener(`change`, () => {
    eM()
  }
  ),
  aC.addEventListener(`change`, () => {
    aC.checked ? (ck(),
      lk()) : (yE = !1,
        ok()),
      qj()
  }
  ),
  oC.addEventListener(`change`, () => {
    xM(),
      vM(_M(oC.value)),
      pD(),
      qj()
  }
  ),
  sC.addEventListener(`click`, () => {
    Jj()
  }
  );
for (let e of Object.keys(jT))
  jT[e].addEventListener(`click`, () => {
    yM(e)
  }
  );
_C.addEventListener(`change`, IE),
  fC.addEventListener(`change`, LE),
  uC.addEventListener(`change`, () => {
    RE()
  }
  ),
  lC.addEventListener(`input`, () => {
    RE()
  }
  ),
  NC.addEventListener(`change`, () => {
    zD()
  }
  ),
  gC.addEventListener(`change`, () => {
    try {
      localStorage.setItem(Lx, gC.value)
    } catch { }
    pD()
  }
  ),
  Sw.addEventListener(`click`, () => {
    YD(!ET?.classList.contains(`minimized`))
  }
  ),
  DT?.addEventListener(`click`, e => {
    e.target?.closest(`button`) || YD(!ET?.classList.contains(`minimized`))
  }
  ),
  DT?.addEventListener(`keydown`, e => {
    e.key !== `Enter` && e.key !== ` ` || (e.preventDefault(),
      YD(!ET?.classList.contains(`minimized`)))
  }
  ),
  Fw.forEach(e => {
    e.addEventListener(`click`, () => HD(e.dataset.navTarget ?? `result`))
  }
  ),
  Iw.addEventListener(`change`, () => HD(Iw.value)),
  qC.addEventListener(`change`, () => {
    NT.setCameraDisplayMode(qC.value)
  }
  ),
  JC.addEventListener(`change`, () => {
    NT.setFlipUp(JC.checked)
  }
  );
function IE() {
  let e = _C.value;
  document.querySelectorAll(`[data-graph-pnp]`).forEach(t => {
    t.style.display = e === `graph-pnp` ? `` : `none`
  }
  ),
    document.querySelectorAll(`[data-classic-only]`).forEach(t => {
      t.style.display = e === `classic` ? `` : `none`
    }
    ),
    pD()
}
function LE() {
  document.querySelectorAll(`[data-scale-custom]`).forEach(e => {
    e.style.display = fC.value === `custom` ? `` : `none`
  }
  ),
    pD()
}
function RE(e) {
  let t = uC.value
    , n = Number(lC.value || 0);
  lC.disabled = !(t === `manual` && !U);
  let r = e ? Qg(t, e.nativeWidth, e.nativeHeight, n) : null;
  if (r && e) {
    let t = $g(r.nativeFocal, e.processedWidth, e.processedHeight, e.nativeWidth, e.nativeHeight);
    dC.textContent = `${zE(r.mode)} focal: ${r.nativeFocal.toFixed(0)} native px (${t.fx.toFixed(0)} processed px, ${r.ratio.toFixed(2)}x max edge).`,
      lD();
    return
  }
  if (t === `manual`) {
    dC.textContent = n > 0 ? `Manual focal: ${n.toFixed(0)} native px.` : `Enter the native-pixel focal from COLMAP/EXIF before running.`,
      lD();
    return
  }
  dC.textContent = `${zE(t)} prior uses ${Zg(t).toFixed(2)} x max(width, height). Use Manual when COLMAP/EXIF focal is known.`,
    lD()
}
function zE(e) {
  switch (e) {
    case `exif`:
      return `EXIF`;
    case `wide`:
      return `Wide`;
    case `normal`:
      return `Normal`;
    case `tele`:
      return `Tele`;
    case `manual`:
      return `Manual`
  }
}
function BE() {
  Rw?.querySelectorAll(`.field`).forEach((e, t) => {
    let n = e.querySelector(`:scope > .fieldHint`);
    if (!n || e.querySelector(`.fieldHelp`))
      return;
    let r = e.querySelector(`:scope > label`)
      , i = VE(r)
      , a = document.createElement(`div`);
    if (a.className = `fieldMeta`,
      e.classList.contains(`checkboxField`) && r) {
      let t = r.querySelector(`input[type="checkbox"]`)
        , n = r.querySelector(`span`)
        , o = n?.textContent?.trim() || i
        , s = document.createElement(`span`);
      s.className = `fieldLabelText`,
        s.textContent = o,
        a.append(s),
        r.classList.add(`fieldControl`, `checkboxControl`),
        r.setAttribute(`aria-label`, o),
        n && (n.textContent = `Enabled`),
        t && (t.title = o),
        e.insertBefore(a, r)
    } else
      r && (e.insertBefore(a, r),
        a.append(r));
    let o = document.createElement(`button`);
    o.type = `button`,
      o.className = `fieldHelp`,
      o.textContent = `?`,
      o.title = n.textContent.trim(),
      o.setAttribute(`aria-label`, `Show help for ${i || `setting`}`);
    let s = n.id || `fieldHint-${t}`;
    n.id = s,
      n.hidden = !0,
      o.setAttribute(`aria-controls`, s),
      o.setAttribute(`aria-expanded`, `false`),
      o.addEventListener(`click`, () => {
        let e = n.hidden;
        n.hidden = !e,
          o.setAttribute(`aria-expanded`, String(e)),
          o.setAttribute(`aria-label`, `${e ? `Hide` : `Show`} help for ${i || `setting`}`)
      }
      ),
      a.append(o)
  }
  )
}
function VE(e) {
  return e ? (e.querySelector(`span`)?.textContent || e.textContent || ``).replace(/\s+/g, ` `).trim() : ``
}
var HE = [{
  key: `decode`,
  phase: `decode`,
  restartFrom: `features`,
  title: `Source and decode`,
  stageLabel: `Stage 1`,
  cacheBoundary: `Changing these invalidates decoded images and everything downstream.`,
  purpose: `Choose the source set, focal prior, scale, and persistence mode before feature extraction.`,
  controls: [`quality`, `scenePreset`, `runMode`, `persistArtifacts`, `autoTune`, `scaleMode`, `customMaxLongEdge`, `focalMode`, `focal`],
  inspectTargets: [{
    label: `Inspect setup`,
    navTarget: `setup`
  }]
}, {
  key: `features`,
  phase: `features`,
  restartFrom: `features`,
  title: `Feature extraction`,
  stageLabel: `Stage 2`,
  cacheBoundary: `Uses decoded images; changing these recomputes features and later caches.`,
  purpose: `Tune how many points each image contributes before pair planning begins.`,
  controls: [`features`, `threshold`, `featurePath`, `gpuMode`],
  inspectTargets: [{
    label: `Inspect diagnostics`,
    navTarget: `diagnostics`
  }]
}, {
  key: `pairPlan`,
  phase: `matching`,
  restartFrom: `pair-plan`,
  title: `Pair plan`,
  stageLabel: `Stage 3`,
  cacheBoundary: `Uses cached features; changing these rebuilds the candidate graph.`,
  purpose: `Decide which image pairs should be considered before descriptor matching.`,
  controls: [`mapper`, `pairStrategy`, `retrievalTopK`, `pairCandidateBudget`, `trackGap`],
  inspectTargets: [{
    label: `Inspect annotations`,
    navTarget: `annotations`
  }, {
    label: `Inspect diagnostics`,
    navTarget: `diagnostics`
  }]
}, {
  key: `matching`,
  phase: `matching`,
  restartFrom: `matching`,
  title: `Descriptor matching`,
  stageLabel: `Stage 4`,
  cacheBoundary: `Uses cached pair plan; changing these recomputes descriptor matches.`,
  purpose: `Adjust match recall and ambiguity before geometric verification.`,
  controls: [`matcherHamming`, `matcherRatio`, `adaptiveMatcherThresholds`],
  inspectTargets: [{
    label: `Inspect matched pairs`,
    navTarget: `diagnostics`
  }]
}, {
  key: `geometry`,
  phase: `mapping`,
  restartFrom: `verification`,
  title: `Geometry and component stitching`,
  stageLabel: `Stage 5`,
  cacheBoundary: `Uses cached descriptor matches; changing these reruns registration and component alignment.`,
  purpose: `Debug fragile component joins by changing epipolar, PnP, parallax, and bridge settings without rematching.`,
  controls: [`minMatches`, `maxPointsPerPair`, `geometryCandidateBudget`, `relativePoseSolver`, `relativeRansac`, `verifiedParallax`, `allowWeakInitial`, `pnpMinInliers`, `pnpPixelThreshold`, `triangulationReprojection`, `triangulationParallax`, `localPointRefinement`, `localPoseRefinement`, `bridgeMode`, `bridgeCandidates`, `bridgePairs`, `bridgeSignature`, `bridgeInliers`],
  inspectTargets: [{
    label: `Inspect components`,
    navTarget: `diagnostics`
  }, {
    label: `Open 3D view`,
    navTarget: `result`
  }]
}, {
  key: `bundle`,
  phase: `bundle`,
  restartFrom: `verification`,
  title: `Bundle and export review`,
  stageLabel: `Stage 6`,
  cacheBoundary: `Uses verified geometry; changing these reruns final geometry and BA.`,
  purpose: `Review final refinement, guided track growth, viewer orientation, and export scope.`,
  controls: [`guidedRadius`, `guidedDistance`, `refineIntrinsics`, `cameraMode`, `flipUp`],
  inspectTargets: [{
    label: `Open exports`,
    navTarget: `exports`
  }, {
    label: `Open diagnostics`,
    navTarget: `diagnostics`
  }]
}]
  , UE = []
  , WE = new Map
  , GE = new Map
  , KE = new Map
  , qE = new Map
  , JE = new Map(HE.map(e => [e.key, e]))
  , YE = {
    decode: `decode`,
    features: `features`,
    matching: `matching`,
    mapping: `geometry`,
    bundle: `bundle`,
    exports: `bundle`
  }
  , XE = `geometry`
  , ZE = null;
function QE() {
  if (!Rw)
    return;
  let e = Rw.querySelector(`.panelTitle`)
    , t = document.createElement(`div`);
  t.className = `settingsWorkflowSwitch`,
    t.setAttribute(`aria-label`, `Settings workflow`),
    t.append($E(`classic`, `Classic`), $E(`notebook`, `Stage notebook`)),
    ZE = document.createElement(`section`),
    ZE.id = `stageNotebook`,
    ZE.className = `stageNotebook`,
    ZE.setAttribute(`aria-label`, `Stage notebook settings`),
    ZE.hidden = !0,
    ZE.append(...HE.map(e => tD(e))),
    Rw.insertBefore(t, e?.nextSibling ?? Rw.firstChild),
    Rw.insertBefore(ZE, t.nextSibling),
    QT = !0,
    eD(ZT, {
      persist: !1
    }),
    pD()
}
function $E(e, t) {
  let n = document.createElement(`button`);
  return n.type = `button`,
    n.textContent = t,
    n.addEventListener(`click`, () => eD(e)),
    qE.set(e, n),
    n
}
function eD(e, t = {}) {
  ZT = e,
    (t.persist ?? !0) && localStorage.setItem(`websfm-settings-workflow`, e),
    Rw?.classList.toggle(`notebookMode`, e === `notebook`),
    ZE && (ZE.hidden = e !== `notebook`);
  for (let [t, n] of qE) {
    let r = t === e;
    n.classList.toggle(`active`, r),
      n.setAttribute(`aria-pressed`, String(r))
  }
  pD(),
    vD()
}
function tD(e) {
  let t = document.createElement(`details`);
  t.className = `stageNotebookCell`,
    t.dataset.stageNotebook = e.key,
    t.open = e.key === `geometry` || e.key === `matching`;
  let n = document.createElement(`summary`);
  n.addEventListener(`click`, () => uD(e.key));
  let r = document.createElement(`div`);
  r.className = `stageNotebookHeading`,
    r.innerHTML = `
    <span>${e.stageLabel}</span>
    <strong>${e.title}</strong>
    <small>${e.cacheBoundary}</small>
  `;
  let i = document.createElement(`span`);
  i.className = `stageNotebookStatus`,
    i.textContent = `Waiting`,
    n.append(r, i);
  let a = document.createElement(`div`);
  a.className = `stageNotebookBody`;
  let o = document.createElement(`p`);
  o.className = `stageNotebookPurpose`,
    o.textContent = e.purpose;
  let s = document.createElement(`div`);
  s.className = `stageNotebookControls`;
  for (let t of e.controls) {
    let e = nD(t);
    e && s.append(e)
  }
  let c = document.createElement(`div`);
  c.className = `stageNotebookFooter`;
  let l = document.createElement(`div`);
  l.className = `stageNotebookActions`;
  let u = document.createElement(`button`);
  u.type = `button`,
    u.textContent = `Use cache point`,
    u.addEventListener(`click`, () => dD(e));
  let d = document.createElement(`button`);
  d.type = `button`,
    d.className = `primaryStageRun`,
    d.textContent = e.key === `bundle` ? `Run review` : `Run from here`,
    d.addEventListener(`click`, () => {
      fD(e)
    }
    ),
    l.append(u, d);
  let f = document.createElement(`div`);
  f.className = `stageNotebookEvidence`;
  let p = document.createElement(`div`);
  p.className = `stageNotebookInspect`;
  for (let t of e.inspectTargets) {
    let e = document.createElement(`button`);
    e.type = `button`,
      e.textContent = t.label,
      e.addEventListener(`click`, () => HD(t.navTarget)),
      p.append(e)
  }
  return c.append(l, f, p),
    a.append(o, s, c),
    t.append(n, a),
    t.addEventListener(`toggle`, () => {
      t.open && uD(e.key, {
        syncPhase: !1
      })
    }
    ),
    WE.set(e.key, i),
    GE.set(e.key, f),
    KE.set(e.key, t),
    t
}
function nD(e) {
  let t = rD(e);
  if (!t)
    return null;
  let n = t.closest(`.field`)
    , r = iD(t)
    , i = n?.querySelector(`.fieldHint`)?.textContent?.trim()
    , a = document.createElement(`div`);
  a.className = `notebookField`,
    a.dataset.proxyFor = e;
  let o = document.createElement(`div`);
  o.className = `notebookFieldMeta`;
  let s = document.createElement(`label`)
    , c = `stageNotebook-${e}`;
  if (s.htmlFor = c,
    s.textContent = r,
    o.append(s),
    i) {
    let e = document.createElement(`small`);
    e.textContent = i,
      o.append(e)
  }
  let l = aD(t, c);
  l.addEventListener(t instanceof HTMLSelectElement ? `change` : `input`, () => {
    oD(t, l)
  }
  ),
    t instanceof HTMLInputElement && t.type === `checkbox` && l.addEventListener(`change`, () => oD(t, l));
  let u = () => sD(t, l, a);
  if (t.addEventListener(`input`, u),
    t.addEventListener(`change`, u),
    UE.push({
      source: t,
      proxy: l,
      row: a
    }),
    t instanceof HTMLInputElement && t.type === `checkbox`) {
    let e = document.createElement(`label`);
    e.className = `notebookCheckboxControl`,
      e.append(l, document.createElement(`span`)),
      e.querySelector(`span`).textContent = `Enabled`,
      a.append(o, e)
  } else
    a.append(o, l);
  return u(),
    a
}
function rD(e) {
  let t = document.getElementById(e);
  return t instanceof HTMLInputElement || t instanceof HTMLSelectElement ? t : null
}
function iD(e) {
  let t = e.closest(`.field`);
  return t?.querySelector(`.fieldLabelText`)?.textContent?.trim() || VE(t?.querySelector(`label`) ?? null) || e.id
}
function aD(e, t) {
  if (e instanceof HTMLSelectElement) {
    let n = document.createElement(`select`);
    n.id = t;
    for (let t of e.options)
      n.append(new Option(t.textContent ?? t.value, t.value));
    return n.value = e.value,
      n
  }
  let n = document.createElement(`input`);
  n.id = t,
    n.type = e.type;
  for (let t of [`min`, `max`, `step`, `placeholder`]) {
    let r = e.getAttribute(t);
    r !== null && n.setAttribute(t, r)
  }
  return e.type === `checkbox` ? n.checked = e.checked : n.value = e.value,
    n
}
function oD(e, t) {
  e instanceof HTMLInputElement && t instanceof HTMLInputElement && e.type === `checkbox` ? (e.checked = t.checked,
    e.dispatchEvent(new Event(`change`, {
      bubbles: !0
    }))) : (e.value = t.value,
      e.dispatchEvent(new Event(e instanceof HTMLSelectElement ? `change` : `input`, {
        bubbles: !0
      }))),
    pD()
}
function sD(e, t, n) {
  e instanceof HTMLInputElement && t instanceof HTMLInputElement && e.type === `checkbox` ? t.checked = e.checked : t.value = e.value,
    t.disabled = e.disabled || !!U,
    n.hidden = !cD(e)
}
function cD(e) {
  return !(e.closest(`[data-graph-pnp]`) && _C.value !== `graph-pnp` || e.closest(`[data-classic-only]`) && _C.value !== `classic` || e.closest(`[data-scale-custom]`) && fC.value !== `custom`)
}
function lD() {
  if (QT)
    for (let { source: e, proxy: t, row: n } of UE)
      sD(e, t, n)
}
function uD(e, t = {}) {
  XE = e;
  let n = JE.get(e);
  n && (t.syncPhase ?? !0) && vM(n.phase),
    pD(),
    vD()
}
function dD(e) {
  U || (uD(e.key),
    oC.value = e.restartFrom,
    oC.dispatchEvent(new Event(`change`, {
      bubbles: !0
    })),
    vM(e.phase),
    KD(!0, !0),
    HD(e.phase === `bundle` ? `exports` : `result`),
    pD())
}
async function fD(e) {
  U || (dD(e),
    await Xj())
}
function pD() {
  if (!QT)
    return;
  lD();
  let e = oC.value;
  for (let t of HE) {
    let n = KE.get(t.key)
      , r = WE.get(t.key)
      , i = GE.get(t.key);
    n && (n.classList.toggle(`selected`, t.key === XE),
      n.classList.toggle(`cacheSelected`, t.restartFrom === e),
      n.classList.toggle(`hasResult`, _D(t.key))),
      r && (r.textContent = mD(t)),
      i && (i.textContent = gD(t.key))
  }
  vD()
}
function mD(e) {
  let t = jT[e.phase]
    , n = t.classList.contains(`active`) ? `running` : t.classList.contains(`done`) ? `done` : t.classList.contains(`warn`) ? `review` : `waiting`;
  return e.key === `features` ? MT.features.textContent || n : e.key === `pairPlan` ? MT.pairPlan.textContent || n : e.key === `matching` ? MT.matches.textContent || n : e.key === `geometry` && MT.geometry.textContent || n
}
function hD(e) {
  return e?.matches.reduce((e, t) => e + t.length, 0) ?? 0
}
function gD(e) {
  if (e === `decode`) {
    let t = oA()
      , n = W.length;
    return FD(e, n > 0 ? `${t} / ${n} images selected` : `No source images selected`)
  }
  if (e === `features`) {
    let t = K?.features.reduce((e, t) => e + t.count, 0) ?? 0;
    return t > 0 ? FD(e, `${t.toLocaleString()} features across ${K?.features.length ?? 0} images`) : FD(e, `Features checkpoint: ${MT.features.textContent ?? `pending`}`)
  }
  if (e === `pairPlan`) {
    let t = K?.pairPlan?.pairs.length ?? 0;
    return t > 0 ? FD(e, `${t.toLocaleString()} candidate pairs`) : FD(e, `Pair plan: ${MT.pairPlan.textContent ?? `pending`}`)
  }
  if (e === `matching`) {
    let t = hD(K?.descriptorMatches);
    return t > 0 ? FD(e, `${t.toLocaleString()} descriptor matches`) : FD(e, `Matches: ${MT.matches.textContent ?? `pending`}`)
  }
  if (e === `geometry`) {
    let t = H ?? K?.model ?? null;
    if (!t)
      return FD(e, `Geometry: ${MT.geometry.textContent ?? `pending`}`);
    let n = nm(t);
    return FD(e, `${t.stats.registeredImages}/${t.poses.length} cameras, ${n.length} component${n.length === 1 ? `` : `s`}`)
  }
  let t = QC.textContent?.trim() || `-`
    , n = H ?? K?.model ?? null
    , r = H ? t : n ? n.stats.medianReprojectionError.toFixed(2) : t;
  return FD(e, n ? `${n.points.length.toLocaleString()} sparse points, median ${r} px` : `Run geometry before export review`)
}
function _D(e) {
  return e === `decode` ? W.length > 0 : e === `features` ? (K?.features.length ?? 0) > 0 || MT.features.classList.contains(`cached`) : e === `pairPlan` ? (K?.pairPlan?.pairs.length ?? 0) > 0 || MT.pairPlan.classList.contains(`cached`) : e === `matching` ? hD(K?.descriptorMatches) > 0 || MT.matches.classList.contains(`cached`) : !!(H ?? K?.model)
}
function vD() {
  let e = !H || ZT === `notebook`;
  Dw.hidden = !e,
    zw?.classList.toggle(`analysisMode`, e),
    zw?.classList.toggle(`hasModel`, !!H),
    ww.hidden = e,
    Tw.textContent = e ? `Stage analysis` : `3D view`,
    Ew.textContent = e ? `Static checks for the selected pipeline stage.` : `Orbit, inspect camera path, then export.`,
    e && bD(yD(XE))
}
function yD(e) {
  return e === `features` ? SD() : e === `pairPlan` ? CD() : e === `matching` ? wD() : e === `geometry` ? TD() : e === `bundle` ? ED() : xD()
}
function bD(e) {
  Ow.textContent = e.eyebrow,
    kw.textContent = e.title,
    Aw.textContent = e.assessment,
    Aw.className = `stageAnalysisAssessment ${e.tone}`,
    jw.textContent = e.summary,
    Mw.replaceChildren(...e.metrics.map(e => {
      let t = document.createElement(`div`);
      t.className = `stageAnalysisMetric ${e.tone ?? `neutral`}`;
      let n = document.createElement(`span`);
      n.textContent = e.label;
      let r = document.createElement(`strong`);
      if (r.textContent = e.value,
        t.append(n, r),
        e.detail) {
        let n = document.createElement(`small`);
        n.textContent = e.detail,
          t.append(n)
      }
      return t
    }
    )),
    Nw.replaceChildren(...e.bars.map(e => {
      let t = document.createElement(`div`);
      t.className = `stageAnalysisBar ${e.tone ?? `neutral`}`;
      let n = document.createElement(`div`)
        , r = document.createElement(`span`);
      r.textContent = e.label;
      let i = document.createElement(`strong`);
      i.textContent = e.valueLabel,
        n.append(r, i);
      let a = document.createElement(`div`);
      a.className = `stageAnalysisBarTrack`;
      let o = document.createElement(`span`)
        , s = e.max > 0 ? Math.max(0, Math.min(100, e.value / e.max * 100)) : 0;
      return o.style.width = `${s}%`,
        a.append(o),
        t.append(n, a),
        t
    }
    )),
    Pw.replaceChildren(...e.notes.map(e => {
      let t = document.createElement(`p`);
      return t.textContent = e,
        t
    }
    ))
}
function xD() {
  let e = oA()
    , t = W.length
    , n = K?.frames ?? []
    , r = e >= 2
    , i = r ? `good` : `warn`
    , a = n.map(e => e.width * e.height)
    , o = n.length > 0 ? uN([...a].sort((e, t) => e - t), .5) : 0
    , s = iO().reduce((e, t) => e + t.file.size, 0)
    , c = [r ? `${e.toLocaleString()} selected image${e === 1 ? `` : `s`} can feed feature extraction.` : `Select at least two overlapping images before running the pipeline.`, aC.checked ? `Persistent cache is enabled, so stage outputs can be reused for parameter sweeps.` : `Persistent cache is off; enable it for notebook-style reruns from cached stages.`, iC.value === `step` ? `Step mode will pause after cache boundaries so settings can be tuned stage by stage.` : `One-shot mode runs through all stages; switch to step mode when debugging parameters.`];
  return n.length > 0 && c.push(`${n.length.toLocaleString()} decoded frame record${n.length === 1 ? `` : `s`} are available for downstream analysis.`),
  {
    title: `Source and decode`,
    eyebrow: `Stage 1 readiness`,
    assessment: i === `good` ? `Ready` : `Needs input`,
    tone: i,
    summary: t > 0 ? `${e.toLocaleString()} of ${t.toLocaleString()} source image${t === 1 ? `` : `s`} selected.` : `No source images selected yet.`,
    metrics: [{
      label: `Selected`,
      value: `${e}/${Math.max(t, e)}`,
      tone: i
    }, PD(`source`, `decode/cache`), {
      label: `Input bytes`,
      value: EM(s),
      detail: e > 0 ? `source files` : `no images`
    }, {
      label: `Focal prior`,
      value: uC.options[uC.selectedIndex]?.textContent?.trim() || uC.value
    }, {
      label: `Scale`,
      value: fC.value === `custom` ? `${pC.value}px` : fC.value
    }],
    bars: [{
      label: `Selection`,
      value: e,
      max: Math.max(2, t),
      valueLabel: `${e}/${Math.max(2, t)}`,
      tone: i
    }, {
      label: `Decoded frames`,
      value: n.length,
      max: Math.max(2, e),
      valueLabel: n.length > 0 ? `${n.length}` : `pending`
    }, {
      label: `Median frame area`,
      value: o,
      max: Math.max(o, 1920 * 1080),
      valueLabel: o > 0 ? `${(o / 1e6).toFixed(1)} MP` : `pending`
    }],
    notes: c
  }
}
function SD() {
  let e = (K?.features ?? []).map(e => e.count)
    , t = OD(`features`)
    , n = e.length > 0 ? e.reduce((e, t) => e + t, 0) : jD(t, `features`)
    , r = e.length || jD(t, `images`) || oA()
    , i = r > 0 ? n / r : 0
    , a = e.length > 0 ? Math.min(...e) : 0
    , o = e.length > 0 ? Math.max(...e) : 0
    , s = Number(mC.value) || o || i || 1
    , c = n <= 0 || e.length > 0 && a < Math.max(32, i * .25) ? `warn` : `good`
    , l = [n > 0 ? `${n.toLocaleString()} feature${n === 1 ? `` : `s`} are available across ${r.toLocaleString()} image ${r === 1 ? `` : `s`}.` : `Run feature extraction to see per-image feature density.`];
  return e.length > 0 && a < Math.max(32, i * .25) ? l.push(`At least one image has far fewer features than the set average; inspect blur, masks, threshold, or scale before matching.`) : n > 0 && l.push(`Feature density is balanced enough for pair planning to try useful image links.`),
    l.push(`Current threshold is ${hC.value}; lowering it increases recall but may add noisy corners.`),
  {
    title: `Feature extraction`,
    eyebrow: `Stage 2 static checks`,
    assessment: c === `good` ? `Usable` : `Review`,
    tone: c,
    summary: n > 0 ? `${ID(n)} detected features, ${LD(i, 0)} per image on average.` : `No feature artifact has been produced in this session yet.`,
    metrics: [{
      label: `Features`,
      value: n > 0 ? ID(n) : `pending`,
      tone: c
    }, PD(`features`, t?.state === `cached` ? `cache load` : `extract`), {
      label: `Avg / image`,
      value: i > 0 ? LD(i, 0) : `pending`
    }, {
      label: `Weakest image`,
      value: a > 0 ? a.toLocaleString() : `pending`,
      tone: a > 0 && a < Math.max(32, i * .25) ? `warn` : `neutral`
    }, {
      label: `Target cap`,
      value: Number(mC.value).toLocaleString()
    }],
    bars: [{
      label: `Average density`,
      value: i,
      max: s,
      valueLabel: i > 0 ? `${LD(i, 0)} / ${LD(s, 0)}` : `pending`,
      tone: c
    }, {
      label: `Weakest image`,
      value: a,
      max: s,
      valueLabel: a > 0 ? `${a.toLocaleString()}` : `pending`,
      tone: a > 0 && a < Math.max(32, i * .25) ? `warn` : `neutral`
    }, {
      label: `Strongest image`,
      value: o,
      max: s,
      valueLabel: o > 0 ? `${o.toLocaleString()}` : `pending`
    }],
    notes: l
  }
}
function CD() {
  let e = K?.pairPlan ?? EE
    , t = OD(`pair-plan`)
    , n = K?.frames.length || jD(t, `images`) || oA()
    , r = e?.pairs.length ?? jD(t, `pairs`)
    , i = n > 1 ? n * (n - 1) / 2 : 0
    , a = i > 0 ? r / i : 0
    , o = n > 0 ? r * 2 / n : 0
    , s = e?.effectiveStrategy ?? String(t?.metrics?.strategy ?? vC.value)
    , c = n <= 1 || r >= n - 1
    , l = r <= 0 || !c ? `warn` : `good`
    , u = [r > 0 ? `${r.toLocaleString()} candidate pair${r === 1 ? `` : `s`} will be considered before descriptor matching.` : `Run pair planning to see graph coverage before matching.`];
  return c ? a > .75 && n > 10 ? u.push(`Pair coverage is broad; exhaustive-like matching can improve recall but will cost more time.`) : r > 0 && u.push(`Candidate graph has enough links for matching to attempt component growth.`) : u.push(`Candidate graph is thinner than a connected chain; increase retrieval top-K, use sequential overlap, or add manual annotations.`),
  {
    title: `Pair plan`,
    eyebrow: `Stage 3 graph checks`,
    assessment: l === `good` ? `Connected` : `Thin graph`,
    tone: l,
    summary: r > 0 ? `${s} plan covers ${RD(a)} of possible image pairs.` : `No pair plan artifact has been produced yet.`,
    metrics: [{
      label: `Pairs`,
      value: r > 0 ? r.toLocaleString() : `pending`,
      tone: l
    }, PD(`pair-plan`, t?.state === `cached` ? `cache load` : `plan`), {
      label: `Coverage`,
      value: i > 0 ? RD(a) : `pending`
    }, {
      label: `Avg degree`,
      value: o > 0 ? LD(o, 1) : `pending`
    }, {
      label: `Strategy`,
      value: s
    }],
    bars: [{
      label: `Pair coverage`,
      value: r,
      max: Math.max(1, i),
      valueLabel: i > 0 ? `${r}/${i}` : `pending`,
      tone: l
    }, {
      label: `Average graph degree`,
      value: o,
      max: Math.max(1, n - 1),
      valueLabel: o > 0 ? LD(o, 1) : `pending`,
      tone: l
    }],
    notes: u
  }
}
function wD() {
  let e = K?.descriptorMatches ?? TE
    , t = OD(`matches`)
    , n = e?.matches.map(e => e.length) ?? []
    , r = n.length || jD(t, `pairs`)
    , i = n.length > 0 ? n.reduce((e, t) => e + t, 0) : jD(t, `matches`)
    , a = r > 0 ? i / r : 0
    , o = Math.max(1, Number(TC.value) || 1)
    , s = n.length > 0 ? n.filter(e => e < o).length : 0
    , c = n.length > 0 ? n.length - s : 0
    , l = n.length > 0 ? s / n.length : 0
    , u = i <= 0 || n.length > 0 && (a < o || l > .3) ? `warn` : `good`
    , d = jD(t, `descriptorComparisons`)
    , f = jD(t, `descriptorReadbackBytes`)
    , p = [i > 0 ? `${i.toLocaleString()} descriptor match${i === 1 ? `` : `es`} are available across ${r.toLocaleString()} runnable pair ${r === 1 ? `` : `s`}.` : `Run descriptor matching to inspect pair-level match strength.`];
  n.length > 0 && s > 0 && p.push(`${s.toLocaleString()} pair${s === 1 ? `` : `s`} are below the current ${o} match geometry threshold.`),
    u === `warn` ? p.push(`For fragile component stitching, try more overlap, a higher hamming cap, a looser ratio, or stronger pair planning before changing PnP settings.`) : p.push(`Descriptor support is high enough for geometric verification to test stable edges.`),
    d > 0 && p.push(`${d.toLocaleString()} descriptor comparisons were measured in the last matching run.`),
    f > 0 && p.push(`${EM(f)} of descriptor readback was measured for the last matching run.`);
  let m = [{
    label: `Matches`,
    value: i > 0 ? ID(i) : `pending`,
    tone: u
  }, PD(`matches`, t?.state === `cached` ? `cache load` : `match`), {
    label: `Runnable pairs`,
    value: r > 0 ? r.toLocaleString() : `pending`
  }, {
    label: `Avg / pair`,
    value: a > 0 ? LD(a, 1) : `pending`,
    tone: u
  }, {
    label: `Below geometry min`,
    value: n.length > 0 ? s.toLocaleString() : `pending`,
    tone: s > 0 ? `warn` : `neutral`
  }];
  return d > 0 && m.push({
    label: `Descriptor compares`,
    value: ID(d),
    detail: String(t?.metrics?.matcher ?? `last run`)
  }),
  {
    title: `Descriptor matching`,
    eyebrow: `Stage 4 match checks`,
    assessment: u === `good` ? `Supported` : `Weak matches`,
    tone: u,
    summary: i > 0 ? `${LD(a, 1)} matches per runnable pair on average.` : `No descriptor match artifact has been produced yet.`,
    metrics: m,
    bars: [{
      label: `Average support`,
      value: a,
      max: Math.max(o * 2, a, 1),
      valueLabel: a > 0 ? `${LD(a, 1)} / ${o}` : `pending`,
      tone: u
    }, {
      label: `Strong pairs`,
      value: c,
      max: Math.max(1, r),
      valueLabel: n.length > 0 ? `${c}/${r}` : `pending`,
      tone: u
    }, {
      label: `Weak pairs`,
      value: s,
      max: Math.max(1, r),
      valueLabel: n.length > 0 ? `${s}/${r}` : `pending`,
      tone: s > 0 ? `warn` : `neutral`
    }],
    notes: p
  }
}
function TD() {
  let e = H ?? K?.model ?? null
    , t = OD(`geometry`);
  if (!e) {
    let e = wD();
    return {
      title: `Geometry and component stitching`,
      eyebrow: `Stage 5 readiness`,
      assessment: e.tone === `good` ? `Ready to verify` : `Needs matches`,
      tone: e.tone,
      summary: `Geometry has not produced a model yet; descriptor support is the best available predictor.`,
      metrics: [PD(`geometry`, t?.state === `running` ? `running` : `verify`), ...e.metrics.slice(0, 3)],
      bars: e.bars.slice(0, 2),
      notes: [`Run from this stage to test epipolar verification, PnP registration, triangulation, and bridge stitching without recomputing descriptor matches.`, ...e.notes.slice(0, 2)]
    }
  }
  let n = nm(e)
    , r = V_(e.stats.diagnostics)
    , i = r.filter(e => e.status === `ok`).length
    , a = r.length - i
    , o = e.stats.registeredImages
    , s = e.poses.length
    , c = s > 0 ? o / s : 0
    , l = e.points.length > 0 ? e.stats.longTracks / e.points.length : 0
    , u = e.stats.medianReprojectionError || 0
    , d = jD(t, `sampsonTests`)
    , f = jD(t, `webGpuBatches`)
    , p = jD(t, `wasmBatches`)
    , m = c < .75 || n.length > 1 || u > 5 ? `warn` : `good`
    , h = [`${o}/${s} cameras registered into ${n.length} component${n.length === 1 ? `` : `s`}.`];
  n.length > 1 && h.push(`Component stitching still left split components; inspect bridge candidate counts, bridge inliers, and weak pair diagnostics.`),
    c < .75 && h.push(`Many cameras did not register; try lower PnP inliers or pixel threshold only after confirming match support.`),
    a > i * .4 && h.push(`Weak/rejected pair diagnostics are high relative to accepted edges; review the diagnostics pair view before widening geometry thresholds.`),
    d > 0 && h.push(`${d.toLocaleString()} Sampson tests were scored in the last geometry run (${f} WebGPU batch${f === 1 ? `` : `es`}, ${p} Wasm batch ${p === 1 ? `` : `es`}).`),
    h.length === 1 && h.push(`Geometry looks coherent enough for bundle and export review.`);
  let g = [{
    label: `Cameras`,
    value: `${o}/${s}`,
    tone: m
  }, PD(`geometry`, t?.state === `cached` ? `cache load` : `verify/map`), {
    label: `Components`,
    value: n.length.toLocaleString(),
    tone: n.length > 1 ? `warn` : `neutral`
  }, {
    label: `Median error`,
    value: u > 0 ? `${u.toFixed(2)} px` : `-`,
    tone: u > 5 ? `warn` : `neutral`
  }, {
    label: `Long tracks`,
    value: e.stats.longTracks.toLocaleString()
  }];
  return d > 0 && g.push({
    label: `Sampson tests`,
    value: ID(d),
    detail: `${f} WebGPU / ${p} Wasm batches`
  }),
  {
    title: `Geometry and component stitching`,
    eyebrow: `Stage 5 model checks`,
    assessment: m === `good` ? `Coherent` : `Review joins`,
    tone: m,
    summary: `${e.points.length.toLocaleString()} sparse point${e.points.length === 1 ? `` : `s`}, ${RD(c)} camera registration.`,
    metrics: g,
    bars: [{
      label: `Registered cameras`,
      value: o,
      max: Math.max(1, s),
      valueLabel: `${o}/${s}`,
      tone: m
    }, {
      label: `Long-track share`,
      value: l,
      max: 1,
      valueLabel: RD(l),
      tone: l < .08 && e.points.length > 0 ? `warn` : `neutral`
    }, {
      label: `Accepted pair checks`,
      value: i,
      max: Math.max(1, i + a),
      valueLabel: r.length > 0 ? `${i}/${i + a}` : `none`
    }],
    notes: h
  }
}
function ED() {
  let e = H ?? K?.model ?? null
    , t = OD(`bundle`);
  if (!e)
    return {
      title: `Bundle and export review`,
      eyebrow: `Stage 6 waiting`,
      assessment: `No model`,
      tone: `warn`,
      summary: `Bundle analysis is available after geometry produces a sparse model.`,
      metrics: [{
        label: `Sparse points`,
        value: `pending`
      }, PD(`bundle`, t?.state === `running` ? `running` : `bundle`), {
        label: `Median error`,
        value: `pending`
      }, {
        label: `Exports`,
        value: `pending`
      }],
      bars: [],
      notes: [`Run geometry first, then use this stage to judge reprojection error, track length, and export readiness.`]
    };
  let n = e.stats.medianReprojectionError || 0
    , r = e.stats.bundleAdjust
    , i = r?.errorBefore ?? 0
    , a = r?.errorAfter ?? n
    , o = i > 0 ? Math.max(0, (i - a) / i) : 0
    , s = e.points.length > 0 ? e.stats.longTracks / e.points.length : 0
    , c = n > 5 || e.points.length > 0 && s < .08 ? `warn` : `good`
    , l = [n > 5 ? `Median reprojection error is high; inspect mismatched pairs or tighten geometry before exporting.` : `Median reprojection error is within a usable sparse-review range.`, s < .08 && e.points.length > 0 ? `Few points are observed in 3+ images; exports may be fragile for downstream dense processing.` : `Track support has enough multi-view observations for inspection exports.`];
  return r && l.push(`Bundle adjustment changed RMS from ${i.toFixed(2)} px to ${a.toFixed(2)} px.`),
  {
    title: `Bundle and export review`,
    eyebrow: `Stage 6 quality checks`,
    assessment: c === `good` ? `Exportable` : `Review`,
    tone: c,
    summary: `${e.points.length.toLocaleString()} sparse points with ${n > 0 ? n.toFixed(2) : `-`} px median reprojection error.`,
    metrics: [{
      label: `Sparse points`,
      value: e.points.length.toLocaleString()
    }, PD(`bundle`, t?.state === `cached` ? `cache load` : `bundle`), {
      label: `Median error`,
      value: n > 0 ? `${n.toFixed(2)} px` : `-`,
      tone: n > 5 ? `warn` : `neutral`
    }, {
      label: `Mean track`,
      value: e.stats.meanTrackLength.toFixed(2)
    }, {
      label: `Guided obs`,
      value: e.stats.guidedObservations.toLocaleString()
    }],
    bars: [{
      label: `Long-track share`,
      value: s,
      max: 1,
      valueLabel: RD(s),
      tone: s < .08 && e.points.length > 0 ? `warn` : `neutral`
    }, {
      label: `BA improvement`,
      value: o,
      max: 1,
      valueLabel: r ? RD(o) : `not run`
    }, {
      label: `Median error`,
      value: Math.min(n, 8),
      max: 8,
      valueLabel: n > 0 ? `${n.toFixed(2)} px` : `-`,
      tone: n > 5 ? `warn` : `neutral`
    }],
    notes: l
  }
}
function DD() {
  if (U && q)
    return q;
  let e = yw.value;
  if (e) {
    let t = kE.find(t => t.runId === e) ?? (q?.runId === e ? q : null);
    if (t)
      return t
  }
  return q
}
function OD(e) {
  return DD()?.stages[e] ?? null
}
function kD(e) {
  return OD(AD(e))
}
function AD(e) {
  return e === `decode` ? `source` : e === `pairPlan` ? `pair-plan` : e === `matching` ? `matches` : e
}
function jD(e, t) {
  let n = e?.metrics?.[t];
  if (typeof n == `number` && Number.isFinite(n))
    return n;
  if (typeof n == `string`) {
    let e = Number(n);
    if (Number.isFinite(e))
      return e
  }
  return 0
}
function MD(e) {
  return e !== void 0 && Number.isFinite(e) && e >= 0 ? e : void 0
}
function ND(e, t) {
  return {
    ...q?.stages[e]?.metrics ?? {},
    ...t
  }
}
function PD(e, t = `last run`) {
  let n = MD(OD(e)?.durationMs);
  return {
    label: `Runtime`,
    value: n === void 0 ? `pending` : TM(n),
    detail: n === void 0 ? `not measured` : t,
    tone: n === void 0 ? `neutral` : `good`
  }
}
function FD(e, t) {
  let n = MD(kD(e)?.durationMs);
  return n === void 0 ? t : `${t} - ${TM(n)}`
}
function ID(e) {
  return Math.round(e).toLocaleString()
}
function LD(e, t) {
  return Number.isFinite(e) ? e.toFixed(t) : `-`
}
function RD(e) {
  return `${Math.round(Math.max(0, Math.min(1, e)) * 100)}%`
}
QE();
async function zD() {
  let e = ++qT
    , t = NC.value;
  if (t === `cpu`) {
    $C.textContent = `WebGPU: disabled, CPU mode`;
    return
  }
  if (!globalThis.navigator?.gpu) {
    $C.textContent = `WebGPU: unavailable, CPU fallback`;
    return
  }
  $C.textContent = `WebGPU: checking`;
  try {
    let n = await Tr();
    if (e !== qT)
      return;
    if (!n || n.lost) {
      $C.textContent = `WebGPU: unavailable, CPU fallback`;
      return
    }
    $C.textContent = t === `conservative` ? `WebGPU: available, conservative mode` : `WebGPU: available`,
      n.device.lost.then(() => {
        e === qT && ($C.textContent = `WebGPU: device lost, CPU fallback`)
      }
      )
  } catch {
    e === qT && ($C.textContent = `WebGPU: unavailable, CPU fallback`)
  }
}
async function BD() {
  if (!RT) {
    RT = !0,
      Jx.disabled = !0,
      Jx.textContent = `Running health test`,
      VD(`Running checks...`, `warn`),
      Y(`Runtime health test: running`);
    try {
      let e = await rx()
        , t = ix(e);
      VD(t, e.status),
        Y(`Runtime health test: ${t}`);
      for (let t of e.checks)
        Y(`Runtime health: ${t.status.toUpperCase()} ${t.label} - ${t.detail} (${Math.round(t.durationMs)} ms)`)
    } catch (e) {
      let t = e instanceof Error ? e.message : String(e);
      VD(`FAIL - runtime health test crashed`, `fail`),
        Y(`Runtime health test failed: ${t}`)
    } finally {
      RT = !1,
        Jx.textContent = `Run health test`,
        Jx.disabled = U !== null
    }
  }
}
function VD(e, t) {
  Yx.textContent = e,
    Yx.classList.toggle(`pass`, t === `pass`),
    Yx.classList.toggle(`warn`, t === `warn`),
    Yx.classList.toggle(`fail`, t === `fail`)
}
function HD(e) {
  e === `annotations` && JT && window.matchMedia(`(max-width: 900px)`).matches && GD(!1);
  for (let t of Fw) {
    let n = t.dataset.navTarget === e;
    t.classList.toggle(`active`, n),
      t.setAttribute(`aria-current`, n ? `page` : `false`)
  }
  Iw.value = e,
    e === `setup` ? UD(`setup`) : e === `result` ? (UD(`workspace`),
      Rw?.scrollTo({
        top: 0,
        behavior: `smooth`
      }),
      OT?.scrollIntoView({
        block: `nearest`,
        behavior: `smooth`
      })) : e === `diagnostics` ? UD(`diagnostics`) : e === `exports` ? UD(`exports`) : e === `about` ? UD(`about`) : e === `annotations` && (UD(`annotations`),
        WD())
}
function UD(e) {
  let t = e !== `workspace`;
  OT?.classList.toggle(`showStandalone`, t),
    zw && (zw.hidden = t),
    ET && (ET.hidden = t),
    Bw.hidden = e !== `setup`,
    Vw.hidden = e !== `annotations`,
    CT.hidden = e !== `diagnostics`,
    wT.hidden = e !== `exports`,
    TT.hidden = e !== `about`,
    t || XD()
}
function WD() {
  jE.refresh(),
    sO()
}
function GD(e) {
  JT = e,
    JD()
}
function KD(e, t = e) {
  YT = e,
    XT = e && t,
    JD()
}
function qD(e) {
  XT = YT && e,
    JD()
}
function JD() {
  Lw?.classList.toggle(`settingsClosed`, !JT),
    Lw?.classList.toggle(`statusClosed`, !YT || !XT),
    Kx.classList.toggle(`active`, JT),
    Kx.setAttribute(`aria-label`, JT ? `Hide settings` : `Show settings`),
    Kx.setAttribute(`title`, JT ? `Hide settings` : `Show settings`),
    Kx.setAttribute(`aria-expanded`, JT ? `true` : `false`),
    qx.setAttribute(`aria-expanded`, JT ? `true` : `false`),
    Xx.hidden = !YT,
    Xx.textContent = XT ? `Hide status` : `Show status`,
    Xx.setAttribute(`aria-pressed`, XT ? `true` : `false`),
    XD()
}
function YD(e) {
  ET?.classList.toggle(`minimized`, e),
    OT?.classList.toggle(`consoleMinimized`, e),
    Sw.textContent = e ? `Show` : `Hide`,
    Sw.setAttribute(`aria-expanded`, e ? `false` : `true`),
    DT?.setAttribute(`tabindex`, `0`),
    DT?.setAttribute(`aria-expanded`, e ? `false` : `true`),
    DT?.setAttribute(`title`, e ? `Show console` : `Hide console`),
    XD()
}
function XD() {
  requestAnimationFrame(() => NT.syncLayout())
}
IE(),
  LE(),
  RE(),
  sA(),
  Cj(),
  xk(),
  eC.addEventListener(`click`, () => {
    if (U) {
      Y(`Cancelling reconstruction`),
        U.abort();
      return
    }
    Xj()
  }
  ),
  ew.addEventListener(`click`, () => {
    ZD()
  }
  ),
  tw.addEventListener(`click`, () => {
    QD()
  }
  ),
  rw.addEventListener(`click`, () => {
    if (!H)
      return;
    let e = sm(H, fM());
    DM(mM(`transforms`, `json`), sf(e))
  }
  ),
  iw.addEventListener(`click`, () => {
    let e = pM();
    e && OM(mM(`points`, `ply`), qd(e, {
      binary: !0
    }))
  }
  ),
  aw.addEventListener(`click`, () => {
    let e = pM();
    e && OM(mM(`points_with_cameras`, `ply`), qd(e, {
      binary: !0,
      includeDiagnostics: !0,
      includeCameraCenters: !0
    }))
  }
  ),
  ow.addEventListener(`click`, $D),
  sw.addEventListener(`click`, eO),
  lw.addEventListener(`click`, () => {
    Mk()
  }
  ),
  cw.addEventListener(`change`, () => {
    uw.textContent = cw.value ? `Select Load run for export to restore this cached reconstruction.` : `No cached export run selected.`
  }
  ),
  nw.addEventListener(`change`, () => {
    if (!H)
      return;
    let e = fM()
      , t = nm(H);
    if (typeof e == `number`) {
      let n = t.find(t => t.id === e);
      uw.textContent = n ? `${n.label} selected for exports: ${n.registeredImages} cameras, ${n.points.toLocaleString()} points.` : `Selected component is unavailable.`
    } else
      t.length > 1 && (uw.textContent = `All ${t.length} components selected; COLMAP ZIP writes separate sparse/N folders, while Nerfstudio exports use the largest component.`)
  }
  ),
  dw.addEventListener(`click`, () => H && DM(`diagnostics.csv`, tN(H))),
  fw.addEventListener(`click`, () => H && DM(`camera_centers.csv`, nN(H))),
  window.addEventListener(`beforeunload`, () => {
    WT && URL.revokeObjectURL(WT),
      rA()
  }
  ),
  window.addEventListener(`keydown`, e => {
    if (e.key === `Escape`) {
      if (!Gw.hidden) {
        fO();
        return
      }
      if (gS.hidden)
        return;
      rj()
    } else if (e.key === `ArrowLeft`) {
      if (gS.hidden)
        return;
      e.preventDefault(),
        tj(-1)
    } else if (e.key === `ArrowRight`) {
      if (gS.hidden)
        return;
      e.preventDefault(),
        tj(1)
    }
  }
  );
async function ZD() {
  if (H) {
    if (LT.length === 0) {
      Y(`COLMAP dataset export failed: source image files are unavailable`);
      return
    }
    ew.disabled = !0;
    try {
      let e = fM();
      Y(typeof e == `number` ? `Packaging COLMAP dataset zip for component ${e}` : `Packaging COLMAP dataset zip`),
        OM(mM(`colmap_dataset`, `zip`), await Qm(H, LT, {
          masks: oO(LT),
          componentScope: e
        })),
        Y(typeof e == `number` ? `COLMAP component dataset export ready: sparse/0/*.txt + images/ + masks/ when present` : `COLMAP dataset export ready: sparse/N/*.txt + images/ + masks/ when present`)
    } catch (e) {
      Y(`COLMAP dataset export failed: ${e instanceof Error ? e.message : String(e)}`)
    } finally {
      ew.disabled = !H
    }
  }
}
async function QD() {
  if (H) {
    if (LT.length === 0) {
      Y(`Nerfstudio dataset export failed: source image files are unavailable`);
      return
    }
    tw.disabled = !0;
    try {
      let e = fM()
        , t = nm(H);
      Y(typeof e == `number` ? `Packaging Nerfstudio dataset zip for component ${e}` : t.length > 1 ? `Packaging Nerfstudio dataset zip for the largest connected component` : `Packaging Nerfstudio dataset zip`),
        OM(mM(`nerfstudio_dataset`, `zip`), await Zm(H, LT, {
          masks: oO(LT),
          componentScope: e
        })),
        Y(`Nerfstudio dataset export ready: transforms.json + init.ply + images/ + masks/ when present (Brush-compatible)`)
    } catch (e) {
      Y(`Nerfstudio dataset export failed: ${e instanceof Error ? e.message : String(e)}`)
    } finally {
      tw.disabled = !H
    }
  }
}
function $D() {
  tO(`websfm-splat-preview`, iv, `Splat preview`)
}
function eO() {
  let e = tO(`websfm-mesh-trainer`, av, `Splat trainer`);
  e && nO(e)
}
function tO(e, t, n) {
  if (!H)
    return null;
  let r = rv(H)
    , i = URL.createObjectURL(r)
    , a = t({
      baseHref: window.location.href,
      plyUrl: i,
      name: Dx
    })
    , o = window.open(a, e);
  return o ? (setTimeout(() => URL.revokeObjectURL(i), kx),
    Y(`${n} opened with ${H.points.length.toLocaleString()} sparse points`),
    o) : (URL.revokeObjectURL(i),
      Y(`${n} blocked by the browser; allow popups for this page and try again.`),
      null)
}
async function nO(e) {
  if (!H)
    return;
  if (LT.length === 0) {
    Y(`Splat trainer opened without image targets: source image files are unavailable`);
    return
  }
  let t = H
    , n = LT.slice()
    , r = oO(n);
  try {
    Y(`Packaging Nerfstudio image targets for splat trainer`);
    let i = await Zm(t, n, {
      masks: r
    });
    if (e.closed) {
      Y(`Splat trainer image targets were packaged, but the trainer window was closed`);
      return
    }
    e.postMessage({
      type: nv,
      name: Ox,
      blob: i
    }, window.location.origin === `null` ? `*` : window.location.origin),
      Y(`Splat trainer image targets sent: ${EM(i.size)} Nerfstudio ZIP`)
  } catch (e) {
    Y(`Splat trainer image target handoff failed: ${e instanceof Error ? e.message : String(e)}`)
  }
}
function rO() {
  return iO().map(e => e.file)
}
function iO() {
  return W.filter(e => e.selected)
}
function aO(e, t) {
  let n = new Map;
  t.forEach((e, t) => {
    n.set(e.projectAssetId, t)
  }
  );
  let r = [];
  for (let t of e) {
    let e = n.get(t.leftProjectAssetId)
      , i = n.get(t.rightProjectAssetId);
    e === void 0 || i === void 0 || e === i || r.push({
      annotationId: t.id,
      leftIndex: e,
      rightIndex: i,
      pointIds: t.points.map(e => e.id),
      points: t.points
    })
  }
  return r
}
function oO(e) {
  return e.map(e => {
    let t = W.find(t => t.file === e || aA(t.file, e));
    return Xr(t?.mask) ? t.mask : null
  }
  )
}
async function sO() {
  let e = G;
  if (!e) {
    CE = null,
      OO(),
      UO();
    return
  }
  if (V && aC.checked)
    try {
      let [t, n] = await Promise.all([V.listNamedAnnotations(e), V.listNamedAnnotationObservations(e)]);
      xE = [...xE.filter(t => t.projectId !== e), ...t.map(La)],
        SE = [...SE.filter(t => t.projectId !== e), ...n.map(Ra)]
    } catch (e) {
      Y(`Named annotation restore failed: ${e instanceof Error ? e.message : String(e)}`)
    }
  let t = cO();
  (!CE || !uO()) && (CE = XO(e)),
    (!CE || !t.some(e => e.annotationId === CE)) && (CE = t[0]?.annotationId ?? null),
    OO(),
    UO()
}
function cO() {
  let e = G;
  return e ? xE.filter(t => t.projectId === e).sort((e, t) => e.name.localeCompare(t.name) || e.annotationId.localeCompare(t.annotationId)) : []
}
function lO() {
  let e = G;
  return e ? SE.filter(t => t.projectId === e) : []
}
function uO() {
  return !CE || !G ? null : xE.find(e => e.projectId === G && e.annotationId === CE) ?? null
}
function dO() {
  OO(),
    Gw.hidden = !1,
    requestAnimationFrame(() => qw.focus())
}
function fO() {
  Gw.hidden = !0
}
async function pO() {
  iT.hidden = !1,
    sT.textContent = `Analyzing annotations`,
    oT.textContent = `Inspecting selected images, masks, manual pairs, named observations, and last-run diagnostics.`,
    cT.textContent = `Confidence --`,
    lT.replaceChildren(),
    vO(uT, [], `Analysis running.`),
    vO(dT, [], `No warnings yet.`),
    vO(fT, [], `No annotation actions yet.`),
    vO(pT, [], `No settings changes yet.`),
    mT.disabled = !0;
  try {
    let e = G && V ? await V.listManualPairAnnotations(G) : []
      , t = G && V && aC.checked ? await V.listNamedAnnotationObservations(G) : lO()
      , n = eo({
        images: W.map(e => ({
          projectAssetId: e.projectAssetId,
          name: e.file.name,
          selected: e.selected,
          hasMask: Xr(e.mask),
          origin: e.origin
        })),
        manualAnnotations: e,
        namedAnnotationObservations: t,
        settings: hO(),
        diagnostics: H?.stats.diagnostics ?? K?.model?.stats.diagnostics ?? []
      });
    wE = n,
      gO(n)
  } catch (e) {
    wE = null,
      sT.textContent = `Analysis failed`,
      oT.textContent = e instanceof Error ? e.message : String(e),
      vO(dT, [`Could not read current annotation state.`]),
      mT.disabled = !0
  }
}
function mO() {
  iT.hidden = !0
}
function hO() {
  let e = NE();
  return {
    quality: tC.value,
    scene: nC.value,
    scaleMode: fC.value,
    maxLongEdge: DO(pC, e.maxLongEdge),
    maxFeatures: DO(mC, e.maxFeatures),
    threshold: DO(hC, e.threshold),
    pairStrategy: vC.value,
    retrievalTopK: DO(yC, e.retrievalTopK),
    pairCandidateBudget: DO(bC, e.pairCandidateBudget),
    geometryCandidateBudget: DO(xC, e.geometryCandidateBudget),
    minMatches: DO(TC, e.minMatches),
    pnpMinInliers: DO(SC, e.pnpMinInliers),
    pnpPixelThreshold: DO(CC, e.pnpPixelThreshold),
    relativePoseRansacIterations: DO(RC, e.relativePoseRansacIterations),
    triangulationReprojectionPx: DO(BC, e.triangulationReprojectionPx),
    triangulationMinParallaxDeg: DO(VC, e.triangulationMinParallaxDeg),
    minVerifiedParallaxDeg: DO(HC, e.minVerifiedParallaxDeg),
    visualBridgeMode: EC.value,
    visualBridgeCandidates: DO(DC, e.visualBridgeCandidates),
    visualBridgePairsPerComponent: DO(OC, e.visualBridgePairsPerComponent),
    guidedTrackRadius: DO(jC, e.guidedTrackRadius),
    guidedDescriptorDistance: DO(MC, e.guidedDescriptorDistance),
    allowWeakInitialFallback: UC.checked,
    localPointRefinement: WC.checked,
    localPoseRefinement: GC.checked,
    refineIntrinsics: KC.checked,
    useMasksForSfm: e.useMasksForSfm,
    autoTune: rC.checked
  }
}
function gO(e) {
  sT.textContent = e.profileName,
    oT.textContent = e.summary,
    cT.textContent = `Confidence ${Math.round(e.confidence * 100)}%`,
    _O(e),
    vO(uT, e.reasons, `No positive signals found yet.`),
    vO(dT, e.warnings, `No warnings.`),
    vO(fT, e.suggestedAnnotationActions, `No annotation changes suggested.`),
    vO(pT, yO(e.settingsPatch), `Current settings already match the recommendation.`),
    mT.disabled = U !== null || Object.keys(e.settingsPatch).length === 0
}
function _O(e) {
  let t = e.metrics
    , n = [[`Selected`, String(t.selectedImages)], [`Masked`, String(t.maskedImages)], [`Annotated images`, `${t.annotatedImages}/${t.selectedImages}`], [`Manual pairs`, String(t.manualPairCount)], [`Named tracks`, String(t.namedTrackCount)], [`Strong pairs`, String(t.strongPairCount)], [`Robust pairs`, String(t.robustPairCount)], [`Components`, String(t.annotationComponents)], [`Weak diagnostics`, String(t.diagnosticWeakPairs)], [`Rejected diagnostics`, String(t.diagnosticRejectedPairs)]];
  lT.replaceChildren(...n.map(([e, t]) => {
    let n = document.createElement(`div`);
    n.className = `annotationAdvisorMetric`;
    let r = document.createElement(`strong`);
    r.textContent = t;
    let i = document.createElement(`small`);
    return i.textContent = e,
      n.append(r, i),
      n
  }
  ))
}
function vO(e, t, n = `None.`) {
  let r = t.length > 0 ? t : [n];
  e.replaceChildren(...r.map(e => {
    let t = document.createElement(`li`);
    return t.textContent = e,
      t
  }
  ))
}
function yO(e) {
  return Object.entries(e).map(([e, t]) => `${bO(e)}: ${xO(t)}`)
}
function bO(e) {
  return {
    quality: `Quality`,
    scene: `Scene type`,
    scaleMode: `Image scale`,
    maxLongEdge: `Custom max edge`,
    maxFeatures: `Max features / image`,
    threshold: `Corner threshold`,
    pairStrategy: `Pair strategy`,
    retrievalTopK: `Retrieval top K`,
    pairCandidateBudget: `Pair candidate budget`,
    geometryCandidateBudget: `Geometry candidate budget`,
    minMatches: `Min matches`,
    pnpMinInliers: `PnP min inliers`,
    pnpPixelThreshold: `PnP threshold`,
    relativePoseRansacIterations: `Relative RANSAC`,
    triangulationReprojectionPx: `Triangulation reprojection`,
    triangulationMinParallaxDeg: `Triangulation parallax`,
    minVerifiedParallaxDeg: `Verified parallax`,
    visualBridgeMode: `Bridge search`,
    visualBridgeCandidates: `Bridge candidates`,
    visualBridgePairsPerComponent: `Pairs / component edge`,
    guidedTrackRadius: `Guided radius`,
    guidedDescriptorDistance: `Guided descriptor`,
    allowWeakInitialFallback: `Allow weak initial pair`,
    localPointRefinement: `Local point refinement`,
    localPoseRefinement: `Local pose refinement`,
    refineIntrinsics: `Refine intrinsics`
  }[e] ?? e
}
function xO(e) {
  return typeof e == `boolean` ? e ? `enabled` : `disabled` : typeof e == `number` ? Number.isInteger(e) ? String(e) : e.toFixed(2) : e === `small-object` ? `Small object` : e === `large-images` ? `Very large images` : e === `aerial-drone` ? `Aerial / drone grid` : e === `building-loop` ? `Building / loop` : e === `component-exhaustive` ? `Component exhaustive` : e === `exhaustive` ? `Exhaustive` : e === `retrieval` ? `Visual retrieval` : e === `dense` ? `Dense / Slow` : e === `balanced` ? `Balanced` : e === `fast` ? `Fast` : e === `custom` ? `Custom max edge` : String(e ?? ``)
}
function SO() {
  let e = wE;
  if (!e || U)
    return;
  let t = CO(e.settingsPatch);
  t !== 0 && (yk({
    refreshAnnotations: !1
  }),
    Y(`Annotation advisor applied ${t} setting change${t === 1 ? `` : `s`}: ${e.profileName}`),
    gO(e))
}
function CO(e) {
  if (Object.entries(e).filter(([, e]) => e !== void 0).length === 0)
    return 0;
  let t = 0
    , n = !1;
  return typeof e.quality == `string` && tC.value !== e.quality && (tC.value = e.quality,
    n = !0,
    t += 1),
    typeof e.scene == `string` && nC.value !== e.scene && (nC.value = e.scene,
      n = !0,
      t += 1),
    n && FE(),
    t += wO(fC, e.scaleMode),
    t += TO(pC, e.maxLongEdge),
    t += TO(mC, e.maxFeatures),
    t += TO(hC, e.threshold),
    t += wO(vC, e.pairStrategy),
    t += TO(yC, e.retrievalTopK),
    t += TO(bC, e.pairCandidateBudget),
    t += TO(xC, e.geometryCandidateBudget),
    t += TO(TC, e.minMatches),
    t += TO(SC, e.pnpMinInliers),
    t += TO(CC, e.pnpPixelThreshold),
    t += TO(RC, e.relativePoseRansacIterations),
    t += TO(BC, e.triangulationReprojectionPx),
    t += TO(VC, e.triangulationMinParallaxDeg),
    t += TO(HC, e.minVerifiedParallaxDeg),
    t += wO(EC, e.visualBridgeMode),
    t += TO(DC, e.visualBridgeCandidates),
    t += TO(OC, e.visualBridgePairsPerComponent),
    t += TO(jC, e.guidedTrackRadius),
    t += TO(MC, e.guidedDescriptorDistance),
    t += EO(UC, e.allowWeakInitialFallback),
    t += EO(WC, e.localPointRefinement),
    t += EO(GC, e.localPoseRefinement),
    t += EO(KC, e.refineIntrinsics),
    IE(),
    LE(),
    pD(),
    t
}
function wO(e, t) {
  return t === void 0 || e.value === t ? 0 : (e.value = t,
    e.dispatchEvent(new Event(`change`, {
      bubbles: !0
    })),
    1)
}
function TO(e, t) {
  if (t === void 0)
    return 0;
  let n = String(t);
  return e.value === n ? 0 : (e.value = n,
    e.dispatchEvent(new Event(`input`, {
      bubbles: !0
    })),
    1)
}
function EO(e, t) {
  return t === void 0 || e.checked === t ? 0 : (e.checked = t,
    e.dispatchEvent(new Event(`change`, {
      bubbles: !0
    })),
    1)
}
function DO(e, t) {
  let n = Number(e.value);
  return Number.isFinite(n) ? n : t
}
function OO() {
  let e = cO()
    , t = lO()
    , n = Ia(qw.value)
    , r = n ? e.filter(e => Ia(e.name).includes(n)) : e
    , i = Fa(qw.value)
    , a = i ? e.some(e => Ia(e.name) === Ia(i)) : !1;
  Jw.disabled = !!U || !i || a,
    Yw.replaceChildren(...r.length > 0 ? r.slice(0, 100).map(e => kO(e, t)) : [AO(n ? `No matching annotations.` : `No named annotations yet.`)]);
  let o = uO()
    , s = o ? t.filter(e => e.annotationId === o.annotationId) : [];
  Xw.textContent = o?.name ?? `No named annotation selected`,
    Zw.textContent = o ? W.length === 0 ? `No images loaded yet` : `${s.length} / ${W.length} image${W.length === 1 ? `` : `s`} marked` : `Create or select a named annotation to mark it across images.`,
    Qw.disabled = !o || !!U,
    Qw.value = o?.name ?? ``,
    $w.disabled = !o || !!U,
    eT.disabled = !o || !!U,
    tT.disabled = !o || W.length === 0,
    nT.disabled = !o || s.length === 0,
    rT.disabled = !o || W.length === s.length
}
function kO(e, t) {
  let n = t.filter(t => t.annotationId === e.annotationId).length
    , r = document.createElement(`button`);
  r.type = `button`,
    r.className = `namedAnnotationOption`,
    r.dataset.namedAnnotationId = e.annotationId,
    r.classList.toggle(`selected`, e.annotationId === CE);
  let i = document.createElement(`span`);
  i.className = `namedAnnotationSwatch`,
    i.style.backgroundColor = e.color;
  let a = document.createElement(`span`);
  a.className = `namedAnnotationLabel`;
  let o = document.createElement(`strong`);
  o.textContent = e.name;
  let s = document.createElement(`small`);
  return s.textContent = W.length === 0 ? `No images loaded` : `${n} of ${W.length} image${W.length === 1 ? `` : `s`} marked`,
    a.append(o, s),
    r.append(i, a),
    r
}
function AO(e) {
  let t = document.createElement(`p`);
  return t.className = `annotationEmpty`,
    t.textContent = e,
    t
}
async function jO() {
  let e = Bk() ?? Vk();
  if (U)
    return;
  let t = Fa(qw.value);
  if (!t)
    return;
  let n = cO().find(e => Ia(e.name) === Ia(t));
  if (n) {
    MO(n.annotationId);
    return
  }
  let r = Date.now()
    , i = {
      annotationId: Na(`${e.projectId}:${t}:${r}`),
      projectId: e.projectId,
      name: t,
      color: zx[xE.length % zx.length],
      createdAt: r,
      updatedAt: r
    };
  xE = [...xE, i],
    await VO(i),
    MO(i.annotationId),
    qw.value = ``,
    Y(`Named annotation created: ${t}`)
}
function MO(e) {
  let t = G;
  CE = e && xE.some(n => n.projectId === t && n.annotationId === e) ? e : null,
    t && ZO(t, CE),
    CE && WO(`named`),
    OO(),
    UO(),
    YA(),
    lA()
}
async function NO() {
  let e = uO();
  if (!e || U)
    return;
  let t = Fa(Qw.value);
  if (!t)
    return;
  if (cO().some(n => n.annotationId !== e.annotationId && Ia(n.name) === Ia(t))) {
    Y(`Named annotation rename skipped: "${t}" already exists`),
      OO();
    return
  }
  let n = {
    ...e,
    name: t,
    updatedAt: Date.now()
  };
  xE = xE.map(e => e.annotationId === n.annotationId && e.projectId === n.projectId ? n : e),
    await VO(n),
    OO(),
    UO(),
    Y(`Named annotation renamed: ${t}`)
}
async function PO() {
  let e = uO();
  !e || U || window.confirm(`Delete named annotation "${e.name}" from this project?`) && (xE = xE.filter(t => t.projectId !== e.projectId || t.annotationId !== e.annotationId),
    SE = SE.filter(t => t.projectId !== e.projectId || t.annotationId !== e.annotationId),
    V && aC.checked && await V.deleteNamedAnnotation(e.projectId, e.annotationId),
    CE = cO()[0]?.annotationId ?? null,
    G && ZO(G, CE),
    yk({
      refreshAnnotations: !1
    }),
    OO(),
    UO(),
    sA({
      renderGrid: !1
    }),
    YA())
}
function FO(e = gA(), t = CE) {
  return !e || !G || !t ? null : SE.find(n => n.projectId === G && n.annotationId === t && n.projectAssetId === e.projectAssetId) ?? null
}
function IO(e, t, n) {
  let r = uO();
  if (!r || !G)
    return;
  let i = Date.now()
    , a = FO(e, r.annotationId)
    , o = {
      projectId: G,
      annotationId: r.annotationId,
      projectAssetId: e.projectAssetId,
      point: {
        x: $(t.x, 0, 1),
        y: $(t.y, 0, 1)
      },
      createdAt: a?.createdAt ?? i,
      updatedAt: i
    };
  SE = [...SE.filter(e => e.projectId !== o.projectId || e.annotationId !== o.annotationId || e.projectAssetId !== o.projectAssetId), o],
    aE = !0,
    yk({
      refreshAnnotations: !1
    }),
    OO(),
    UO(),
    sA({
      renderGrid: !1,
      preserveRunState: !0
    }),
    YA(),
    n && HO(o)
}
function LO(e) {
  e.preventDefault();
  let t = gA()
    , n = uO();
  if (!t || !n)
    return;
  let r = ej();
  if (!r)
    return;
  let i = yS.getBoundingClientRect()
    , a = e.clientX - i.left
    , o = e.clientY - i.top;
  a < r.x || o < r.y || a > r.x + r.width || o > r.y + r.height || IO(t, {
    x: (a - r.x) / Math.max(1, r.width),
    y: (o - r.y) / Math.max(1, r.height)
  }, !1)
}
function RO() {
  if (!aE)
    return;
  aE = !1;
  let e = FO();
  e && HO(e)
}
async function zO() {
  let e = gA()
    , t = FO(e);
  !e || !t || U || (SE = SE.filter(e => e.projectId !== t.projectId || e.annotationId !== t.annotationId || e.projectAssetId !== t.projectAssetId),
    V && aC.checked && await V.deleteNamedAnnotationObservation(t.projectId, t.annotationId, t.projectAssetId),
    yk({
      refreshAnnotations: !1
    }),
    OO(),
    UO(),
    sA({
      renderGrid: !1,
      preserveRunState: !0
    }),
    YA())
}
function BO(e) {
  let t = G;
  t && (SE = SE.filter(n => n.projectId !== t || n.projectAssetId !== e),
    V && aC.checked && V.deleteNamedAnnotationObservationsForAsset(t, e),
    OO(),
    UO())
}
async function VO(e) {
  !V || !aC.checked || await V.putNamedAnnotation(e)
}
async function HO(e) {
  !V || !aC.checked || await V.putNamedAnnotationObservation(e)
}
function UO() {
  let e = uO()
    , t = FO(gA());
  LS.textContent = e ? `${e.name}${t ? ` marked` : ` unmarked`}` : `No named annotation`,
    IS.disabled = !e || !!U,
    IS.classList.toggle(`active`, tE === `named`),
    IS.setAttribute(`aria-pressed`, tE === `named` ? `true` : `false`),
    RS.disabled = !t || !!U,
    zS.disabled = !e || !JO(`marked`),
    BS.disabled = !e || !JO(`unmarked`)
}
function WO(e) {
  tE = e,
    xS.dataset.previewTool = e,
    IS.classList.toggle(`active`, e === `named`),
    IS.setAttribute(`aria-pressed`, e === `named` ? `true` : `false`),
    UO()
}
function GO(e) {
  let t = G;
  return t ? SE.filter(n => n.projectId === t && n.projectAssetId === e).length : 0
}
function KO(e, t) {
  let n = YO(_A(), e, t);
  n && ($T = n.id,
    vA())
}
function qO(e, t) {
  let n = YO(gA() ? _A() : -1, e, t);
  n && hA(n)
}
function JO(e) {
  return !!YO(_A(), 1, e)
}
function YO(e, t, n) {
  if (!CE || W.length === 0)
    return null;
  let r = W.length
    , i = e >= 0 ? e : t > 0 ? -1 : 0;
  for (let e = 1; e <= r; e += 1) {
    let a = (i + t * e + r) % r
      , o = W[a]
      , s = !!FO(o);
    if (n === `marked` && s || n === `unmarked` && !s)
      return o
  }
  return null
}
function XO(e) {
  try {
    return localStorage.getItem(QO(e))
  } catch {
    return null
  }
}
function ZO(e, t) {
  try {
    let n = QO(e);
    t ? localStorage.setItem(n, t) : localStorage.removeItem(n)
  } catch { }
}
function QO(e) {
  return `${Nx}:${e}`
}
function $O() {
  try {
    let e = localStorage.getItem(Mx);
    if (!e)
      return null;
    let t = JSON.parse(e);
    if (typeof t.projectId != `string` || !Array.isArray(t.assets))
      return null;
    let n = [];
    for (let e of t.assets) {
      if (typeof e != `object` || !e || typeof e.path != `string` || typeof e.name != `string` || typeof e.size != `number` || typeof e.lastModified != `number` || typeof e.selected != `boolean`)
        return null;
      n.push({
        path: e.path,
        name: e.name,
        size: e.size,
        lastModified: e.lastModified,
        selected: e.selected
      })
    }
    return {
      projectId: t.projectId,
      assets: n
    }
  } catch {
    return null
  }
}
function ek(e) {
  let t = $O();
  return !t || t.projectId !== e ? new Map : new Map(t.assets.map(e => [nk(e), e.selected]))
}
function tk() {
  return W.reduce((e, t) => e + t.file.size, 0)
}
function nk(e) {
  return `${e.path || e.name}\0${e.name}\0${e.size}\0${e.lastModified || 0}`
}
function rk(e) {
  return vj(e) || e.name
}
function ik() {
  bE += 1
}
function ak() {
  if (Uk(),
    sk(),
    aC.checked)
    try {
      if (W.length === 0) {
        localStorage.removeItem(Mx);
        return
      }
      let e = {
        projectId: G ?? jx,
        assets: W.map(e => ({
          path: rk(e.file),
          name: e.file.name,
          size: e.file.size,
          lastModified: e.file.lastModified || 0,
          selected: e.selected
        }))
      };
      localStorage.setItem(Mx, JSON.stringify(e))
    } catch { }
}
function ok() {
  try {
    localStorage.removeItem(Mx)
  } catch { }
}
function sk() {
  gE = gE.catch(() => void 0).then(() => pk())
}
function ck() {
  debugger
  hE = hE.catch(() => void 0).then(() => mk())
}
function lk() {
  _E = _E.catch(() => void 0).then(() => hk())
}
function uk() {
  _E = _E.catch(() => void 0).then(() => dk())
}
async function dk() {
  if (!V || !aC.checked)
    return;
  let e = Bk()
    , t = gA();
  if (!(!e || !t))
    try {
      Xr(t.mask) ? await V.putProjectAssetMask(e.projectId, t.projectAssetId, Ur(t.mask)) : await V.deleteProjectAssetMask(e.projectId, t.projectAssetId)
    } catch (e) {
      Y(`Source mask persistence failed: ${e instanceof Error ? e.message : String(e)}`)
    }
}
async function fk() {
  !V || !aC.checked || await V.setActiveProjectId(G)
}
async function pk() {
  if (!V || !aC.checked)
    return;
  let e = Bk();
  if (!e) {
    await V.setActiveProjectId(null);
    return
  }
  Uk(),
    await V.putProject(e),
    await V.setActiveProjectId(e.projectId)
}
async function mk() {
  debugger
  if (!(!V || !aC.checked)) {
    ak();
    try {
      let e = Bk();
      if (e) {
        Uk(),
          await py();
        for (let e of W) {
          let t = {
            assetId: e.assetId,
            path: rk(e.file),
            name: e.file.name,
            type: e.file.type || ``,
            size: e.file.size,
            lastModified: e.file.lastModified || 0,
            origin: e.origin,
            blob: e.file
          };
          await V.putProjectAsset(t)
        }
        await V.putProject(e),
          await V.setActiveProjectId(e.projectId)
      }
      if (W.length === 0) {
        await V.clearSourceAssetProject(jx),
          await V.clearSourceAssetMaskProject(jx),
          yE = !1,
          ok();
        return
      }
      yE = !0,
        cC.textContent = `Source images stored locally (${W.length} files, ${EM(tk())}).`
    } catch (e) {
      yE = !1;
      let t = e instanceof Error ? e.message : String(e);
      cC.textContent = `Source image persistence failed: ${t}`,
        Y(`Source image persistence failed: ${t}`)
    }
  }
}
async function hk() {
  if (!(!V || !aC.checked))
    try {
      let e = Bk();
      e && await V.putProjectAssetMasks(e.projectId, W.filter(e => Xr(e.mask)).map(t => ({
        projectId: e.projectId,
        projectAssetId: t.projectAssetId,
        mask: Ur(t.mask),
        updatedAt: Date.now()
      })))
    } catch (e) {
      Y(`Source mask persistence failed: ${e instanceof Error ? e.message : String(e)}`)
    }
}
async function gk() {
  let e = bE;
  if (!V || !aC.checked) {
    Hk(),
      await qj();
    return
  }
  if (W.length > 0) {
    Hk(),
      await qj();
    return
  }
  try {
    await hh(V);
    let t = await V.listProjects()
      , n = await V.getActiveProjectId();
    if (W.length > 0 || bE !== e) {
      Hk(),
        await qj();
      return
    }
    VT = t,
      G = n;
    let r = Bk();
    if (!r && VT.length > 0 && (r = VT[0],
      G = r.projectId,
      await V.setActiveProjectId(r.projectId)),
      Hk(),
      !r) {
      await qj();
      return
    }
    if (!await _k(r, {
      ifUnchangedSince: e
    })) {
      Hk(),
        await qj();
      return
    }
    GT = W.filter(e => e.origin === `video`).map(e => e.file),
      yE = !0,
      yk();
    let i = oA();
    sA({
      statusOverride: `Restored ${W.length} source image${W.length === 1 ? `` : `s`} from ${r.name}. ${i} / ${W.length} selected for reconstruction.`,
      renderGrid: !0
    }),
      WD(),
      dA(),
      Y(`Restored ${W.length} source image${W.length === 1 ? `` : `s`} from ${r.name}`),
      await Tk(),
      HD(`setup`)
  } catch (e) {
    cC.textContent = `Source image restore failed: ${e instanceof Error ? e.message : String(e)}`,
      await qj()
  }
}
async function _k(e, t = {}) {
  if (t.ifUnchangedSince !== void 0 && bE !== t.ifUnchangedSince)
    return !1;
  let n = [...e.assetRefs].sort((e, t) => e.order - t.order)
    , r = ek(e.projectId)
    , i = n.map(e => e.assetId);
  await V.prewarmProjectAssets(e.projectId, i);
  let a = await V.getProjectAssets(i)
    , o = new Map(a.map(e => [e.assetId, e]))
    , s = new Map((await V.getProjectAssetMasks(e.projectId)).filter(e => Ik(e.mask)).map(e => [e.projectAssetId, e.mask]));
  return t.ifUnchangedSince !== void 0 && bE !== t.ifUnchangedSince ? !1 : (rA(),
    W = n.flatMap(e => {
      let t = o.get(e.assetId);
      if (!t)
        return [];
      let n = dh({
        path: t.path,
        name: t.name,
        size: t.size,
        lastModified: t.lastModified || 0
      })
        , i = vk(t)
        , a = s.get(e.projectAssetId);
      return [{
        id: `asset-${BT++}`,
        assetId: t.assetId,
        projectAssetId: e.projectAssetId,
        file: i,
        url: URL.createObjectURL(i),
        thumbnailState: `pending`,
        origin: t.origin,
        selected: r.get(n) ?? e.selected,
        mask: Ik(a) ? Ur(a) : null
      }]
    }
    ),
    r.size > 0 && (Uk(),
      sk()),
    !0)
}
function vk(e) {
  let t = new File([e.blob], e.name, {
    type: e.type || e.blob.type || ``,
    lastModified: e.lastModified || Date.now()
  });
  return e.path && e.path !== e.name && Object.defineProperty(t, "webkitRelativePath", {
    value: e.path,
    configurable: !0
  }),
    t
}
function yk(e = {}) {
  H = null,
    LT = [],
    TE = null,
    EE = null,
    K = null,
    uM(!1),
    U || KD(!1),
    (e.refreshAnnotations ?? !0) && WD(),
    vD()
}
function bk() {
  let e = W.flatMap(e => e.thumbnailUrl ? [{
    name: e.file.name,
    url: e.thumbnailUrl
  }] : []);
  NT.setCameraImagePreviews(e),
    NT.setCameraImagesVisible(zT)
}
function xk() {
  ww.setAttribute(`aria-pressed`, zT ? `true` : `false`),
    ww.classList.toggle(`active`, zT);
  let e = ww.querySelector(`.viewerToggleMark`);
  e && (e.textContent = zT ? `x` : ``)
}
function Sk(e) {
  let t = Date.now();
  return {
    runId: `run-${t}-${Math.random().toString(36).slice(2, 8)}`,
    sourceProjectId: G ?? jx,
    selectedAssetFingerprint: e.assetFingerprint,
    settingsHash: e.settingsHash,
    imageCount: e.imageCount,
    selectedImageCount: e.selectedImageCount,
    createdAt: t,
    updatedAt: t,
    stages: {
      source: {
        state: `done`,
        summary: `${e.selectedImageCount} / ${e.imageCount} images selected`,
        metrics: {
          images: e.imageCount,
          selected: e.selectedImageCount
        },
        updatedAt: t
      }
    }
  }
}
async function Ck() {
  if (!(!V || !q || !aC.checked))
    try {
      await V.putRunSession(q),
        await Tk(q.runId)
    } catch (e) {
      Y(`Run manifest persistence failed: ${e instanceof Error ? e.message : String(e)}`)
    }
}
function J(e, t) {
  if (!q)
    return;
  let n = t.updatedAt ?? Date.now();
  q = {
    ...q,
    updatedAt: n,
    stages: {
      ...q.stages,
      [e]: {
        ...t,
        updatedAt: n
      }
    }
  },
    kk(q, e),
    pD(),
    vD(),
    Ck()
}
function wk() {
  if (!q)
    return;
  let e = AE
    , t = Date.now();
  q = {
    ...q,
    updatedAt: t,
    stages: {
      ...q.stages,
      geometry: {
        state: `pending`,
        summary: `Waiting for geometric verification`,
        updatedAt: t
      }
    }
  },
    kk(q, e),
    Ck()
}
async function Tk(e) {
  if (!V)
    kE = q ? [q] : [];
  else
    try {
      kE = await V.listRunSessions(G ?? jx)
    } catch {
      kE = q ? [q] : []
    }
  q && !kE.some(e => e.runId === q?.runId) && (kE = [q, ...kE]);
  let t = kE.find(t => t.runId === e) ?? kE[0] ?? null;
  Ek(t?.runId ?? ``),
    Dk(t?.runId ?? ``),
    kk(t, AE)
}
function Ek(e) {
  if (yw.replaceChildren(),
    kE.length === 0) {
    yw.append(new Option(`No cached runs yet`, ``)),
      yw.disabled = !0;
    return
  }
  yw.disabled = !1;
  for (let e of kE.slice(0, 20)) {
    let t = `${new Date(e.createdAt ?? e.updatedAt ?? Date.now()).toLocaleString()} - ${e.selectedImageCount}/${e.imageCount} images`;
    yw.append(new Option(t, e.runId))
  }
  yw.value = e
}
function Dk(e = cw.value) {
  cw.replaceChildren();
  let t = Ok();
  if (t.length === 0) {
    cw.append(new Option(`No cached exports yet`, ``)),
      cw.disabled = !0,
      lw.disabled = !0,
      uw.textContent = `Run a reconstruction with persistent cache enabled to export older results.`;
    return
  }
  cw.disabled = !!U,
    lw.disabled = !!U;
  for (let e of t.slice(0, 20)) {
    let t = new Date(e.createdAt ?? e.updatedAt ?? Date.now())
      , n = e.stages.geometry?.metrics?.cameras
      , r = e.stages.geometry?.metrics?.points
      , i = `${t.toLocaleString()} - ${e.selectedImageCount}/${e.imageCount} images` + (n || r ? `, ${n ?? `-`} cameras, ${r ?? `-`} pts` : ``);
    cw.append(new Option(i, e.runId))
  }
  cw.value = t.some(t => t.runId === e) ? e : t[0].runId,
    uw.textContent = `Select a cached run, then load it to enable exports from that reconstruction.`
}
function Ok() {
  return kE.filter(e => !!(e.stages.exports?.artifactKey ?? e.stages.bundle?.artifactKey ?? e.stages.geometry?.artifactKey))
}
function kk(e, t = AE) {
  AE = t,
    bw.replaceChildren();
  for (let n of Rx) {
    let r = e?.stages[n]
      , i = document.createElement(`button`);
    i.type = `button`,
      i.className = `runStageButton ${r?.state ?? `pending`}`,
      i.dataset.stageId = n,
      i.classList.toggle(`selected`, n === t);
    let a = r?.state ?? `pending`
      , o = MD(r?.durationMs);
    i.innerHTML = `<strong>${Hx[n]}</strong><small>${zk(a)}${o === void 0 ? `` : ` - ${zk(TM(o))}`}</small>`,
      bw.append(i)
  }
  let n = e?.stages[t];
  if (!e) {
    xw.textContent = `Run a reconstruction to inspect cached stage data.`;
    return
  }
  let r = n?.metrics ? Object.entries(n.metrics).map(([e, t]) => `<span>${zk(e)}: ${zk(String(t))}</span>`).join(``) : ``
    , i = MD(n?.durationMs);
  xw.innerHTML = `
    <strong>${Hx[t]}</strong>
    <p>${zk(n?.summary ?? `No cached data for this stage yet.`)}</p>
    ${i === void 0 ? `` : `<small>Runtime: ${zk(TM(i))}</small>`}
    ${n?.artifactKey ? `<small>Artifact: ${zk(n.artifactKey)}</small>` : ``}
    ${r ? `<div class="runStageMetrics">${r}</div>` : ``}
  `
}
async function Ak(e, t) {
  let n = ++OE;
  if (kk(e, t),
    !e || !V || ![`features`, `pair-plan`, `matches`, `geometry`, `bundle`, `exports`].includes(t))
    return;
  let r = jk(`Loading cached stage data...`);
  try {
    let i = await Nk(e, t);
    if (n !== OE)
      return;
    if (r.remove(),
      !i) {
      jk(`Cached artifact data is unavailable for this stage.`);
      return
    }
    HM(i.frames, i.features, i.pairPlan, i.descriptorMatches, i.model, i.sourceFiles),
      i.model && (t === `geometry` || t === `bundle` || t === `exports`) ? Qj(i.model, i.sourceFiles) : t === `features` ? (pw.textContent = `${i.featureCount.toLocaleString()} cached features loaded`,
        RM([]),
        UM()) : (FM(),
          UM()),
      jk(i.model ? `Loaded cached 3D result with ${i.model.points.length.toLocaleString()} points.` : t === `matches` && i.descriptorMatches ? `Loaded ${i.matchCount.toLocaleString()} descriptor matches for visual inspection.` : t === `pair-plan` || i.pairPlan ? `Loaded ${i.candidatePairCount.toLocaleString()} candidate pairs for visual inspection.` : `Loaded ${i.frames.length.toLocaleString()} frames and ${i.featureCount.toLocaleString()} features.`)
  } catch (e) {
    if (n !== OE)
      return;
    r.remove(),
      jk(`Could not load cached stage data: ${e instanceof Error ? e.message : String(e)}`)
  }
}
function jk(e) {
  let t = document.createElement(`small`);
  return t.textContent = e,
    xw.append(t),
    t
}
async function Mk() {
  let e = kE.find(e => e.runId === cw.value) ?? null;
  if (!e) {
    uw.textContent = `Choose a cached run before loading exports.`;
    return
  }
  if (!V) {
    uw.textContent = `Cached run artifacts are unavailable in this browser session.`;
    return
  }
  lw.disabled = !0,
    uw.textContent = `Loading cached reconstruction...`;
  try {
    let t = await Nk(e, `exports`);
    if (!t?.model) {
      uw.textContent = `Cached reconstruction artifact is unavailable for this run.`;
      return
    }
    HM(t.frames, t.features, t.pairPlan, t.descriptorMatches, t.model, t.sourceFiles),
      Qj(t.model, t.sourceFiles, {
        activateResult: !1
      }),
      uw.textContent = `Loaded cached run for export: ${t.model.stats.registeredImages}/${t.model.poses.length} cameras, ${t.model.points.length.toLocaleString()} points.`,
      Y(`Loaded cached run for export`)
  } catch (e) {
    uw.textContent = `Could not load cached run: ${e instanceof Error ? e.message : String(e)}`
  } finally {
    lw.disabled = !!U || cw.disabled
  }
}
async function Nk(e, t) {
  if (!V)
    return null;
  await vE.catch(() => void 0);
  let n = Vj(e.selectedAssetFingerprint, e.sourceProjectId)
    , r = e.stages.features?.artifactKey;
  if (!r)
    return null;
  let i = (await V.getArtifact(n, r))?.payload;
  if (!i || !Pk(i))
    return null;
  let a = g_(i.frames)
    , o = x_(i.features)
    , s = Rk(a)
    , c = null
    , l = null
    , u = null;
  if (t === `pair-plan` || t === `matches` || t === `geometry` || t === `bundle` || t === `exports`) {
    let t = e.stages[`pair-plan`]?.artifactKey;
    if (t) {
      let e = (await V.getArtifact(n, t))?.payload;
      e?.schemaVersion === 1 && kM(e.plan, a.length) && (c = w_(e.plan))
    }
  }
  if (t === `matches` || t === `geometry` || t === `bundle` || t === `exports`) {
    let t = e.stages.matches?.artifactKey;
    if (t) {
      let e = (await V.getArtifact(n, t))?.payload;
      if (e && MM(e, a.length)) {
        let t = D_(e.pairs);
        l = {
          runnablePairs: t.pairs,
          matches: t.matches
        }
      }
    }
  }
  if (t === `geometry` || t === `bundle` || t === `exports`) {
    let r = e.stages[t]?.artifactKey ?? e.stages.geometry?.artifactKey ?? e.stages.bundle?.artifactKey ?? e.stages.exports?.artifactKey;
    if (r) {
      let e = (await V.getArtifact(n, r))?.payload;
      e && Lk(e) && (u = A_(e.model))
    }
  }
  return {
    frames: a,
    features: o,
    pairPlan: c,
    descriptorMatches: l,
    model: u,
    sourceFiles: s,
    featureCount: i.totalFeatures,
    candidatePairCount: c?.pairs.length ?? 0,
    matchCount: l?.matches.reduce((e, t) => e + t.length, 0) ?? 0
  }
}
function Pk(e) {
  return e.schemaVersion === 1 && Array.isArray(e.frames) && Array.isArray(e.features) && e.frames.length === e.features.length && e.features.every(e => Number.isInteger(e.count) && e.count >= 0 && e.xs instanceof Float32Array && e.ys instanceof Float32Array && e.scores instanceof Float32Array && e.descriptors instanceof Uint32Array && e.colors instanceof Uint8Array)
}
function Fk(e, t) {
  return e.schemaVersion === 1 && e.frameCount === t && Array.isArray(e.frames) && e.frames.length === t && e.frames.every(e => {
    let t = e.width * e.height;
    return Number.isInteger(e.id) && typeof e.name == `string` && Number.isInteger(e.width) && Number.isInteger(e.height) && e.width > 0 && e.height > 0 && e.gray instanceof Uint8Array && e.rgba instanceof Uint8ClampedArray && e.gray.length === t && e.rgba.length === t * 4 && e.intrinsics?.width === e.width && e.intrinsics?.height === e.height
  }
  )
}
function Ik(e) {
  if (!e || typeof e != `object`)
    return !1;
  let t = e;
  return Number.isInteger(t.width) && Number.isInteger(t.height) && t.width > 0 && t.height > 0 && t.data instanceof Uint8Array && t.data.length === t.width * t.height
}
function Lk(e) {
  let t = e.model;
  return e.schemaVersion === 1 && !!t && Array.isArray(t.cameras) && Array.isArray(t.poses) && Array.isArray(t.points) && Array.isArray(t.images) && !!t.stats && Array.isArray(t.stats.features) && Array.isArray(t.stats.matches) && Array.isArray(t.stats.diagnostics)
}
function Rk(e) {
  let t = rO();
  if (t.length === e.length && t.every((t, n) => t.name === e[n]?.name))
    return t;
  let n = W.map(e => e.file)
    , r = new Set;
  return e.flatMap((e, t) => {
    let i = n.findIndex((t, n) => !r.has(n) && t.name === e.name)
      , a = i >= 0 ? i : t
      , o = n[a];
    return !o || r.has(a) ? [] : (r.add(a),
      [o])
  }
  )
}
function zk(e) {
  return e.replace(/[&<>"']/g, e => {
    switch (e) {
      case `&`:
        return `&amp;`;
      case `<`:
        return `&lt;`;
      case `>`:
        return `&gt;`;
      case `"`:
        return `&quot;`;
      case `'`:
        return `&#39;`;
      default:
        return e
    }
  }
  )
}
function Bk() {
  return VT.find(e => e.projectId === G) ?? null
}
function Vk() {
  let e = Bk();
  if (e)
    return e;
  if (VT.length > 0)
    return e = VT[0],
      G = e.projectId,
      fk(),
      Hk(),
      e;
  let t = Date.now();
  return e = {
    projectId: fh(`default:${t}`),
    name: uh,
    assetRefs: [],
    createdAt: t,
    updatedAt: t
  },
    VT = [e],
    G = e.projectId,
    Hk(),
    sk(),
    e
}
function Hk() {
  let e = Bk();
  tS.textContent = e ? e.name : `No project yet`;
  let t = e => {
    if (VT.length === 0 && e) {
      let e = document.createElement(`option`);
      return e.value = ``,
        e.textContent = `No project`,
        [e]
    }
    return VT.map(e => {
      let t = document.createElement(`option`);
      return t.value = e.projectId,
        t.textContent = e.name,
        t
    }
    )
  }
    ;
  rS.replaceChildren(...t(!1)),
    iS.replaceChildren(...t(!0));
  let n = VT.length === 0 || !!U;
  rS.disabled = n,
    iS.disabled = n,
    rS.value = e?.projectId ?? ``,
    iS.value = e?.projectId ?? ``,
    oS.disabled = !e || !!U,
    sS.disabled = !e || !!U,
    cS.disabled = !e || !!U,
    nS.textContent = e ? `${e.assetRefs.length} asset${e.assetRefs.length === 1 ? `` : `s`} in this project.` : `Create a project or upload images to start the default project.`
}
function Uk() {
  let e = Bk();
  e && (e.assetRefs = W.map((e, t) => ({
    projectAssetId: e.projectAssetId,
    assetId: e.assetId,
    selected: e.selected,
    order: t
  })),
    e.updatedAt = Date.now(),
    VT = VT.map(t => t.projectId === e.projectId ? {
      ...e,
      assetRefs: [...e.assetRefs]
    } : t))
}
async function Wk() {
  if (U)
    return;
  ik(),
    await Qk();
  let e = Date.now()
    , t = {
      projectId: fh(`project:${e}:${VT.length}`),
      name: $k(`Project`),
      assetRefs: [],
      createdAt: e,
      updatedAt: e
    };
  VT = [t, ...VT],
    G = t.projectId,
    V && aC.checked && (await V.putProject(t),
      await V.setActiveProjectId(t.projectId)),
    await Gk(t.projectId, {
      alreadyPersisted: !0
    })
}
async function Gk(e, t = {}) {
  if (U)
    return;
  ik(),
    t.alreadyPersisted || await Qk();
  let n = VT.find(t => t.projectId === e) ?? null;
  G = n?.projectId ?? null,
    V && aC.checked && await V.setActiveProjectId(G),
    n && V ? await _k(n) : (rA(),
      W = []),
    GT = W.filter(e => e.origin === `video`).map(e => e.file),
    yE = W.length > 0,
    yk(),
    Hk(),
    sA({
      statusOverride: n && W.length > 0 ? `${oA()} / ${W.length} image${W.length === 1 ? `` : `s`} selected for reconstruction.` : `No assets selected yet.`,
      renderGrid: !0
    }),
    WD(),
    dA(),
    await Tk()
}
async function Kk() {
  if (U)
    return;
  let e = Bk();
  if (!e)
    return;
  let t = window.prompt(`Project name`, e.name)?.trim();
  t && (ik(),
    e.name = t,
    e.updatedAt = Date.now(),
    VT = VT.map(t => t.projectId === e.projectId ? {
      ...e,
      assetRefs: [...e.assetRefs]
    } : t),
    await pk(),
    Hk())
}
async function qk() {
  if (U)
    return;
  let e = Bk();
  e && window.confirm(`Delete project "${e.name}"?`) && (ik(),
    V && (await V.deleteProject(e.projectId),
      await V.deleteUnreferencedProjectAssets()),
    VT = VT.filter(t => t.projectId !== e.projectId),
    G = VT[0]?.projectId ?? null,
    V && await V.setActiveProjectId(G),
    G ? await Gk(G, {
      alreadyPersisted: !0
    }) : (rA(),
      W = [],
      yk(),
      Hk(),
      sA({
        statusOverride: `No assets selected yet.`,
        renderGrid: !0
      }),
      WD(),
      await Tk()))
}
async function Jk() {
  let e = Bk();
  if (!e || U)
    return;
  await Qk();
  let t = V ? await V.getProjectAssets(e.assetRefs.map(e => e.assetId)) : Xk()
    , n = V ? await V.getProjectAssetMasks(e.projectId) : Zk(e.projectId)
    , r = V ? await V.listManualPairAnnotations(e.projectId) : []
    , i = V ? await V.listNamedAnnotations(e.projectId) : xE.filter(t => t.projectId === e.projectId)
    , a = V ? await V.listNamedAnnotationObservations(e.projectId) : SE.filter(t => t.projectId === e.projectId);
  try {
    let o = await Sh({
      project: e,
      assets: t,
      masks: n,
      annotations: r,
      namedAnnotations: i,
      namedAnnotationObservations: a,
      model: H
    });
    OM(`${eA(e.name)}.websfmproject`, o),
      Y(`Project export ready: ${e.name}`)
  } catch (e) {
    Y(`Project export failed: ${e instanceof Error ? e.message : String(e)}`)
  }
}
async function Yk(e) {
  if (!U)
    try {
      let t = await Cg([e], {
        existingProjectIds: new Set(VT.map(e => e.projectId))
      });
      if (await Qk(),
        V && aC.checked) {
        for (let e of t.assets)
          await V.putProjectAsset(e);
        await V.putProject(t.project),
          await V.putProjectAssetMasks(t.project.projectId, t.masks);
        for (let e of t.annotations)
          await V.putManualPairAnnotation(e);
        for (let e of t.namedAnnotations)
          await V.putNamedAnnotation(e);
        for (let e of t.namedAnnotationObservations)
          await V.putNamedAnnotationObservation(e);
        await V.setActiveProjectId(t.project.projectId)
      }
      xE = [...xE.filter(e => e.projectId !== t.project.projectId), ...t.namedAnnotations.map(La)],
        SE = [...SE.filter(e => e.projectId !== t.project.projectId), ...t.namedAnnotationObservations.map(Ra)],
        VT = [t.project, ...VT],
        G = t.project.projectId,
        await Gk(t.project.projectId, {
          alreadyPersisted: !0
        }),
        t.model && Qj(t.model, rO()),
        Y(`Imported project: ${t.project.name}`)
    } catch (e) {
      Y(`Project import failed: ${e instanceof Error ? e.message : String(e)}`)
    }
}
function Xk() {
  return W.map(e => ({
    assetId: e.assetId,
    path: rk(e.file),
    name: e.file.name,
    type: e.file.type || ``,
    size: e.file.size,
    lastModified: e.file.lastModified || 0,
    origin: e.origin,
    blob: e.file
  }))
}
function Zk(e) {
  return W.filter(e => Xr(e.mask)).map(t => ({
    projectId: e,
    projectAssetId: t.projectAssetId,
    mask: Ur(t.mask)
  }))
}
async function Qk() {
  debugger
  Bk() && (lk(),
    ck(),
    await _E.catch(() => void 0),
    await hE.catch(() => void 0),
    await gE.catch(() => void 0))
}
function $k(e) {
  let t = new Set(VT.map(e => e.name))
    , n = VT.length + 1
    , r = `${e} ${n}`;
  for (; t.has(r);)
    n += 1,
      r = `${e} ${n}`;
  return r
}
function eA(e) {
  return e.replace(/[\\/]/g, `_`).replace(/[\u0000-\u001f\u007f]+/g, `_`).trim() || `project`
}
function tA(e, t, n) {
  ik();
  let r = Vk()
    , i = [];
  for (let n of e) {
    if (W.some(e => aA(e.file, n)))
      continue;
    let e = dh({
      path: rk(n),
      name: n.name,
      size: n.size,
      lastModified: n.lastModified || 0
    })
      , a = ph(e);
    i.push({
      id: `asset-${BT++}`,
      assetId: a,
      projectAssetId: mh(r.projectId, e),
      file: n,
      url: URL.createObjectURL(n),
      thumbnailState: `pending`,
      origin: t,
      selected: !0,
      mask: null
    })
  }
  return i.length === 0 ? (eS.textContent = `No new supported image files found in ${n}.`,
    sA(),
    0) : (W = [...W, ...i].sort((e, t) => _j(e.file, t.file)),
      Uk(),
      yE = !1,
      yk(),
      sA({
        statusOverride: `${i.length} image${i.length === 1 ? `` : `s`} added from ${n}.`,
        renderGrid: !0
      }),
      WD(),
      dA(),
      ck(),
      i.length)
}
function nA(e) {
  let t = W.find(t => t.id === e);
  t && (ik(),
    BO(t.projectAssetId),
    iA(t),
    W = W.filter(t => t.id !== e),
    Uk(),
    yE = !1,
    t.origin === `video` && (GT = GT.filter(e => e !== t.file)),
    yk(),
    sA({
      statusOverride: `${t.file.name} removed.`,
      renderGrid: !0
    }),
    WD(),
    ck(),
    lk())
}
function rA() {
  for (let e of W)
    iA(e);
  W = []
}
function iA(e) {
  URL.revokeObjectURL(e.url),
    e.thumbnailUrl && URL.revokeObjectURL(e.thumbnailUrl),
    e.thumbnailUrl = void 0
}
function aA(e, t) {
  return rk(e) === rk(t) && e.name === t.name && e.size === t.size && e.lastModified === t.lastModified
}
function oA() {
  return W.reduce((e, t) => e + +!!t.selected, 0)
}
function sA(e = {}) {
  let t = e.renderGrid ?? !1
    , n = e.preserveRunState ?? !1
    , r = oA()
    , i = W.length;
  if (uS.hidden = i === 0,
    ZC.textContent = String(r),
    $x.classList.toggle(`hasAssets`, i > 0 || !!UT),
    mS.disabled = !!U || i === 0 || r === i,
    hS.disabled = !!U || r === 0,
    n || qj(),
    i === 0) {
    (t || fS.childElementCount > 0) && fS.replaceChildren(),
      eS.textContent = e.statusOverride ?? `No assets selected yet.`,
      dS.textContent = `Uploaded images are pre-selected. Uncheck or delete frames that are blurry, duplicated, or otherwise poor inputs.`,
      n || (nM(UT ? `Selected` : `Idle`, UT ? .12 : .08),
        X(`decode`, UT ? `active` : `pending`, UT ? `Video selected` : `Waiting`)),
      pD();
    return
  }
  eS.textContent = e.statusOverride ?? `${r} / ${i} image${i === 1 ? `` : `s`} selected for reconstruction.`,
    r >= 2 ? (dS.textContent = `${r} selected. You can start reconstruction now, or remove blurry/duplicate frames first.`,
      !U && !n && (nM(`Selected`, .14),
        X(`decode`, `active`, `${r} images selected`))) : r === 1 ? (dS.textContent = `Select at least one more image before reconstruction can start.`,
          !U && !n && nM(`Selected`, .1)) : (dS.textContent = `No images are selected. Select at least two images before reconstruction can start.`,
            !U && !n && nM(`Idle`, .08)),
    t || fS.childElementCount !== i ? cA() : lA(),
    pD()
}
function cA() {
  let e = !!U;
  fS.replaceChildren(...W.map(t => {
    let n = document.createElement(`article`)
      , r = Xr(t.mask)
      , i = GO(t.projectAssetId);
    n.className = `imageTile${t.selected ? ` selected` : ``}${r ? ` masked` : ``}${i > 0 ? ` annotated` : ``}`,
      n.dataset.assetId = t.id;
    let a = document.createElement(`button`);
    a.type = `button`,
      a.className = `imageThumbButton`,
      a.dataset.assetAction = `preview`,
      a.dataset.assetId = t.id,
      a.setAttribute(`aria-label`, `View ${t.file.name} full size`);
    let o = document.createElement(`img`);
    o.src = t.thumbnailUrl ?? Ax,
      o.alt = t.file.name,
      o.loading = `lazy`,
      o.decoding = `async`,
      o.dataset.thumbnailState = t.thumbnailState,
      a.append(o);
    let s = document.createElement(`div`);
    s.className = `imageTileBody`;
    let c = document.createElement(`label`);
    c.className = `imageCheck`;
    let l = document.createElement(`input`);
    l.type = `checkbox`,
      l.checked = t.selected,
      l.disabled = e,
      l.dataset.assetId = t.id;
    let u = document.createElement(`span`);
    u.textContent = `Use`,
      c.append(l, u);
    let d = document.createElement(`button`);
    d.type = `button`,
      d.className = `imageName`,
      d.dataset.assetAction = `preview`,
      d.dataset.assetId = t.id,
      d.textContent = t.file.name;
    let f = document.createElement(`small`);
    f.textContent = uA(t, r, i);
    let p = document.createElement(`span`);
    p.className = `imageMaskBadge`,
      p.textContent = `Masked`,
      p.hidden = !r;
    let m = document.createElement(`span`);
    m.className = `imageNamedAnnotationBadge`,
      m.textContent = `${i} named`,
      m.hidden = i === 0;
    let h = document.createElement(`button`);
    return h.type = `button`,
      h.className = `imageDelete`,
      h.dataset.assetAction = `delete`,
      h.dataset.assetId = t.id,
      h.disabled = e,
      h.setAttribute(`aria-label`, `Remove ${t.file.name}`),
      h.textContent = `Delete`,
      s.append(c, d, f, p, m, h),
      n.append(a, s),
      n
  }
  ))
}
function lA() {
  let e = !!U;
  for (let t of W) {
    let n = fS.querySelector(`.imageTile[data-asset-id="${pN(t.id)}"]`);
    if (!n)
      continue;
    let r = Xr(t.mask)
      , i = GO(t.projectAssetId);
    n.classList.toggle(`selected`, t.selected),
      n.classList.toggle(`masked`, r),
      n.classList.toggle(`annotated`, i > 0);
    let a = n.querySelector(`input[type="checkbox"]`);
    a && (a.checked = t.selected,
      a.disabled = e);
    let o = n.querySelector(`button[data-asset-action="delete"]`);
    o && (o.disabled = e);
    let s = n.querySelector(`.imageMaskBadge`);
    s && (s.hidden = !r);
    let c = n.querySelector(`.imageNamedAnnotationBadge`);
    c && (c.hidden = i === 0,
      c.textContent = `${i} named`);
    let l = n.querySelector(`.imageTileBody small`);
    l && (l.textContent = uA(t, r, i))
  }
}
function uA(e, t, n) {
  return `${e.origin === `video` ? `Video frame` : `Image`} · ${EM(e.file.size)}${t ? ` · Masked` : ``}${n > 0 ? ` · ${n} named` : ``}`
}
function dA() {
  HT || (HT = !0,
    fA())
}
async function fA() {
  try {
    for (; ;) {
      let e = W.find(e => e.thumbnailState === `pending`);
      if (!e)
        return;
      e.thumbnailState = `loading`,
        mA(e),
        await zj();
      let t = null;
      try {
        t = await pA(e.file);
        let n = W.find(t => t.id === e.id);
        if (!n) {
          URL.revokeObjectURL(t);
          continue
        }
        n.thumbnailUrl && URL.revokeObjectURL(n.thumbnailUrl),
          n.thumbnailUrl = t,
          n.thumbnailState = `ready`,
          mA(n),
          bk()
      } catch {
        t && URL.revokeObjectURL(t);
        let n = W.find(t => t.id === e.id);
        if (!n)
          continue;
        n.thumbnailState = `failed`,
          mA(n),
          bk()
      }
      await zj()
    }
  } finally {
    HT = !1,
      W.some(e => e.thumbnailState === `pending`) && dA()
  }
}
async function pA(e) {
  let t = await createImageBitmap(e, {
    imageOrientation: `from-image`
  });
  try {
    let e = Math.min(1, bx / Math.max(t.width, t.height))
      , n = Math.max(1, Math.round(t.width * e))
      , r = Math.max(1, Math.round(t.height * e))
      , i = document.createElement(`canvas`);
    i.width = n,
      i.height = r;
    let a = i.getContext(`2d`, {
      alpha: !1
    });
    if (!a)
      throw Error(`Could not create thumbnail canvas context`);
    a.drawImage(t, 0, 0, n, r);
    let o = await new Promise((e, t) => {
      i.toBlob(n => n ? e(n) : t(Error(`Could not encode thumbnail`)), `image/jpeg`, .78)
    }
    );
    return URL.createObjectURL(o)
  } finally {
    t.close()
  }
}
function mA(e) {
  let t = fS.querySelector(`.imageTile[data-asset-id="${pN(e.id)}"]`)?.querySelector(`img`);
  if (!t)
    return;
  let n = e.thumbnailUrl ?? Ax;
  t.getAttribute(`src`) !== n && (t.src = n),
    t.dataset.thumbnailState = e.thumbnailState
}
function hA(e) {
  $T = e.id,
    yA({
      render: !1
    }),
    vA(),
    gS.hidden = !1,
    SS.focus()
}
function gA() {
  return W.find(e => e.id === $T) ?? W[0] ?? null
}
function _A() {
  let e = W.findIndex(e => e.id === $T);
  return e >= 0 ? e : 0
}
function vA() {
  let e = gA();
  if (!e) {
    rj();
    return
  }
  $T = e.id,
    _S.textContent = e.file.name,
    bS.src = e.url,
    bS.alt = e.file.name,
    DS.checked = e.selected,
    DS.disabled = !!U,
    OS.disabled = !!U,
    TS.disabled = !1,
    kS.disabled = !!U,
    AS.disabled = !!U,
    jS.disabled = !!U,
    MS.disabled = !!U,
    NS.disabled = !!U,
    RA(),
    LA(eE),
    UO(),
    IA();
  let t = W.length <= 1;
  CS.disabled = t,
    wS.disabled = t,
    YA()
}
function yA(e = {}) {
  nE = {
    scale: 1,
    panX: 0,
    panY: 0
  },
    wA(),
    (e.render ?? !0) && YA()
}
function bA(e) {
  if (gS.hidden)
    return;
  let t = xA(e.clientX, e.clientY);
  t && (e.preventDefault(),
    SA(Math.exp(-e.deltaY * .0016), t))
}
function xA(e, t) {
  let n = yS.getBoundingClientRect();
  return n.width <= 0 || n.height <= 0 ? null : {
    x: e - n.left,
    y: t - n.top
  }
}
function SA(e, t) {
  let n = TA()
    , r = ej();
  !n || !r || !Number.isFinite(e) || e <= 0 || CA($(nE.scale * e, wx, Tx), t, $((t.x - r.x) / Math.max(1, r.width), 0, 1), $((t.y - r.y) / Math.max(1, r.height), 0, 1))
}
function CA(e, t, n, r) {
  let i = TA();
  if (!i)
    return;
  let a = $(e, wx, Tx)
    , o = i.width * a
    , s = i.height * a
    , c = i.x + (i.width - o) * .5
    , l = i.y + (i.height - s) * .5;
  nE = EA({
    scale: a,
    panX: t.x - n * o - c,
    panY: t.y - r * s - l
  }),
    wA(),
    YA()
}
function wA() {
  let e = ej();
  if (!e) {
    bS.style.left = ``,
      bS.style.top = ``,
      bS.style.width = ``,
      bS.style.height = ``,
      ES.textContent = `100%`,
      yS.dataset.previewZoom = `1.000`,
      xS.dataset.previewZoom = `1.000`;
    return
  }
  bS.style.left = `${e.x}px`,
    bS.style.top = `${e.y}px`,
    bS.style.width = `${e.width}px`,
    bS.style.height = `${e.height}px`,
    ES.textContent = `${Math.round(nE.scale * 100)}%`,
    yS.dataset.previewZoom = nE.scale.toFixed(3),
    xS.dataset.previewZoom = nE.scale.toFixed(3)
}
function TA() {
  let e = yS.getBoundingClientRect()
    , t = bS.naturalWidth
    , n = bS.naturalHeight;
  if (e.width <= 0 || e.height <= 0 || t <= 0 || n <= 0)
    return null;
  let r = Math.min(e.width / t, e.height / n)
    , i = t * r
    , a = n * r;
  return {
    x: (e.width - i) / 2,
    y: (e.height - a) / 2,
    width: i,
    height: a,
    stageWidth: e.width,
    stageHeight: e.height
  }
}
function EA(e) {
  let t = TA();
  if (!t)
    return {
      scale: 1,
      panX: 0,
      panY: 0
    };
  let n = $(e.scale, wx, Tx)
    , r = t.width * n
    , i = t.height * n
    , a = t.x + (t.width - r) * .5
    , o = t.y + (t.height - i) * .5;
  return {
    scale: n,
    panX: r <= t.stageWidth ? 0 : $(a + e.panX, t.stageWidth - r, 0) - a,
    panY: i <= t.stageHeight ? 0 : $(o + e.panY, t.stageHeight - i, 0) - o
  }
}
function DA(e) {
  return e.pointerType === `touch` ? (sE.set(e.pointerId, {
    x: e.clientX,
    y: e.clientY
  }),
    sE.size >= 2 ? (e.preventDefault(),
      MA(),
      NA(),
      !0) : (e.preventDefault(),
        oE = {
          pointerId: e.pointerId,
          tool: tE,
          startClientX: e.clientX,
          startClientY: e.clientY,
          lastClientX: e.clientX,
          lastClientY: e.clientY,
          activated: !1
        },
        xS.setPointerCapture(e.pointerId),
        !0)) : !1
}
function OA(e) {
  if (e.pointerType !== `touch`)
    return !1;
  if (sE.has(e.pointerId) && sE.set(e.pointerId, {
    x: e.clientX,
    y: e.clientY
  }),
    sE.size >= 2)
    return e.preventDefault(),
      PA(),
      !0;
  if (!oE || oE.pointerId !== e.pointerId)
    return !1;
  e.preventDefault(),
    oE.lastClientX = e.clientX,
    oE.lastClientY = e.clientY;
  let t = e.clientX - oE.startClientX
    , n = e.clientY - oE.startClientY;
  return !oE.activated && Math.hypot(t, n) < Ex ? !0 : (oE.activated = !0,
    AA(e, oE.tool),
    !0)
}
function kA(e, t) {
  if (e.pointerType !== `touch`)
    return !1;
  let n = sE.delete(e.pointerId);
  return cE ? (e.preventDefault(),
    sE.size < 2 && (cE = null),
    FA(e.pointerId),
    !0) : !oE || oE.pointerId !== e.pointerId ? n : (e.preventDefault(),
      oE.lastClientX = e.clientX,
      oE.lastClientY = e.clientY,
      t === `pointerup` && !oE.activated && AA(e, oE.tool),
      jA(oE.tool),
      oE = null,
      FA(e.pointerId),
      !0)
}
function AA(e, t) {
  if (!U) {
    if (t === `named`) {
      iE = !0,
        LO(e);
      return
    }
    rE = !0,
      HA(e)
  }
}
function jA(e) {
  if (e === `named`) {
    iE = !1,
      RO();
    return
  }
  rE = !1,
    qA(),
    uk()
}
function MA() {
  oE?.activated && jA(oE.tool),
    oE = null,
    iE = !1,
    rE = !1
}
function NA() {
  let e = Array.from(sE.values()).slice(0, 2);
  if (e.length < 2)
    return;
  let t = {
    x: (e[0].x + e[1].x) * .5,
    y: (e[0].y + e[1].y) * .5
  }
    , n = xA(t.x, t.y)
    , r = ej();
  !n || !r || (cE = {
    startDistance: Math.max(1, Math.hypot(e[0].x - e[1].x, e[0].y - e[1].y)),
    startScale: nE.scale,
    imageU: $((n.x - r.x) / Math.max(1, r.width), 0, 1),
    imageV: $((n.y - r.y) / Math.max(1, r.height), 0, 1)
  })
}
function PA() {
  let e = Array.from(sE.values()).slice(0, 2);
  if (e.length < 2 || (cE || NA(),
    !cE))
    return;
  let t = {
    x: (e[0].x + e[1].x) * .5,
    y: (e[0].y + e[1].y) * .5
  }
    , n = xA(t.x, t.y);
  if (!n)
    return;
  let r = Math.max(1, Math.hypot(e[0].x - e[1].x, e[0].y - e[1].y));
  CA(cE.startScale * (r / cE.startDistance), n, cE.imageU, cE.imageV)
}
function FA(e) {
  try {
    xS.releasePointerCapture(e)
  } catch { }
}
function IA() {
  let e = gA();
  if (!e)
    return;
  let t = _A()
    , n = Xr(e.mask)
    , r = GO(e.projectAssetId)
    , i = e.origin === `video` ? `Video frame` : `Image`;
  vS.textContent = `${t + 1} / ${W.length} - ${i} - ${EM(e.file.size)}${n ? ` - Masked` : ``}${r > 0 ? ` - ${r} named` : ``}`,
    FS.disabled = !!U || !n
}
function LA(e) {
  eE = e,
    kS.classList.toggle(`active`, e === `brush`),
    AS.classList.toggle(`active`, e === `erase`),
    jS.classList.toggle(`active`, e === `flood`),
    kS.setAttribute(`aria-pressed`, e === `brush` ? `true` : `false`),
    AS.setAttribute(`aria-pressed`, e === `erase` ? `true` : `false`),
    jS.setAttribute(`aria-pressed`, e === `flood` ? `true` : `false`),
    xS.dataset.maskTool = e
}
function RA() {
  PS.textContent = String(zA())
}
function zA() {
  return Math.round($(Number(NS.value || Cx), 0, 180))
}
function BA(e) {
  if (Xr(e.mask) || Ik(e.mask))
    return e.mask;
  let t = bS.naturalWidth
    , n = bS.naturalHeight;
  if (t <= 0 || n <= 0)
    return null;
  let r = Math.min(1, xx / Math.max(t, n));
  return e.mask = Hr(Math.max(1, Math.round(t * r)), Math.max(1, Math.round(n * r))),
    e.mask
}
function VA() {
  let e = gA();
  !e || U || !Xr(e.mask) || (e.mask = null,
    JA(!0),
    uk(),
    YA())
}
function HA(e) {
  if (eE === `flood`) {
    UA(e);
    return
  }
  KA(e)
}
function UA(e) {
  e.preventDefault();
  let t = gA();
  if (!t)
    return;
  let n = ej();
  if (!n)
    return;
  let r = yS.getBoundingClientRect()
    , i = e.clientX - r.left
    , a = e.clientY - r.top;
  if (i < n.x || a < n.y || i > n.x + n.width || a > n.y + n.height)
    return;
  let o = BA(t);
  if (!o)
    return;
  let s = Math.max(0, Math.min(o.width - 1, Math.floor((i - n.x) / Math.max(1, n.width) * o.width)))
    , c = Math.max(0, Math.min(o.height - 1, Math.floor((a - n.y) / Math.max(1, n.height) * o.height)))
    , l = WA(o);
  if (!l)
    return;
  let u = GA(o, l, s, c, zA());
  u && (lE || (lE = !0,
    yk()),
    XA(u.x0, u.y0, u.x1, u.y1),
    YA())
}
function WA(e) {
  if (bS.naturalWidth <= 0 || bS.naturalHeight <= 0)
    return null;
  let t = document.createElement(`canvas`);
  t.width = e.width,
    t.height = e.height;
  let n = t.getContext(`2d`, {
    willReadFrequently: !0
  });
  return n ? (n.drawImage(bS, 0, 0, e.width, e.height),
    n.getImageData(0, 0, e.width, e.height)) : null
}
function GA(e, t, n, r, i) {
  let a = e.width
    , o = e.height
    , s = a * o
    , c = r * a + n
    , l = t.data
    , u = c * 4
    , d = l[u] ?? 0
    , f = l[u + 1] ?? 0
    , p = l[u + 2] ?? 0
    , m = i * i
    , h = new Uint8Array(s)
    , g = new Int32Array(s)
    , _ = 0
    , v = a
    , y = o
    , b = -1
    , x = -1;
  for (g[_++] = c,
    h[c] = 1; _ > 0;) {
    let t = g[--_]
      , n = t * 4
      , r = (l[n] ?? 0) - d
      , i = (l[n + 1] ?? 0) - f
      , o = (l[n + 2] ?? 0) - p;
    if (r * r + i * i + o * o > m)
      continue;
    if (e.data[t] === 0) {
      e.data[t] = 1;
      let n = t % a
        , r = Math.floor(t / a);
      n < v && (v = n),
        n > b && (b = n),
        r < y && (y = r),
        r > x && (x = r)
    }
    let c = t - 1
      , u = t + 1
      , S = t - a
      , C = t + a
      , w = t % a;
    w > 0 && h[c] === 0 && (h[c] = 1,
      g[_++] = c),
      w < a - 1 && h[u] === 0 && (h[u] = 1,
        g[_++] = u),
      S >= 0 && h[S] === 0 && (h[S] = 1,
        g[_++] = S),
      C < s && h[C] === 0 && (h[C] = 1,
        g[_++] = C)
  }
  return b >= v && x >= y ? {
    x0: v,
    y0: y,
    x1: b,
    y1: x
  } : null
}
function KA(e) {
  e.preventDefault();
  let t = gA();
  if (!t)
    return;
  let n = ej();
  if (!n)
    return;
  let r = yS.getBoundingClientRect()
    , i = e.clientX - r.left
    , a = e.clientY - r.top;
  if (i < n.x || a < n.y || i > n.x + n.width || a > n.y + n.height)
    return;
  let o = BA(t);
  if (!o)
    return;
  let s = (i - n.x) / Math.max(1, n.width) * o.width
    , c = (a - n.y) / Math.max(1, n.height) * o.height
    , l = $(Number(MS.value || Sx), 8, 140)
    , u = Math.max(1, l * .5 * o.width / Math.max(1, n.width));
  Yr(o, s, c, u, eE === `brush`),
    XA(Math.max(0, Math.floor(s - u)), Math.max(0, Math.floor(c - u)), Math.min(o.width - 1, Math.ceil(s + u)), Math.min(o.height - 1, Math.ceil(c + u))),
    Xr(o) || (t.mask = null),
    lE || (lE = !0,
      yk()),
    YA()
}
function qA() {
  lE && (lE = !1,
    sA({
      renderGrid: !1,
      preserveRunState: !0
    }),
    IA(),
    qj())
}
function JA(e) {
  yk(),
    sA({
      renderGrid: !1,
      preserveRunState: !0
    }),
    IA(),
    e && vA(),
    qj()
}
function YA() {
  uE || (uE = !0,
    requestAnimationFrame(() => {
      uE = !1,
        QA()
    }
    ))
}
function XA(e, t, n, r) {
  if (!(n < e || r < t)) {
    if (!mE) {
      mE = {
        x0: e,
        y0: t,
        x1: n,
        y1: r
      };
      return
    }
    e < mE.x0 && (mE.x0 = e),
      t < mE.y0 && (mE.y0 = t),
      n > mE.x1 && (mE.x1 = n),
      r > mE.y1 && (mE.y1 = r)
  }
}
function ZA(e, t) {
  let n = `${e}:${t.width}x${t.height}`;
  (!dE || pE !== n) && (dE ||= document.createElement(`canvas`),
    dE.width = t.width,
    dE.height = t.height,
    fE = dE.getContext(`2d`),
    pE = n,
    mE = {
      x0: 0,
      y0: 0,
      x1: t.width - 1,
      y1: t.height - 1
    });
  let r = fE;
  if (!r)
    return null;
  let i = mE;
  if (i) {
    let e = i.x1 - i.x0 + 1
      , n = i.y1 - i.y0 + 1;
    if (e > 0 && n > 0) {
      let a = r.createImageData(e, n)
        , o = a.data;
      for (let r = 0; r < n; r++) {
        let n = (i.y0 + r) * t.width + i.x0
          , a = r * e * 4;
        for (let r = 0; r < e; r++)
          t.data[n + r] !== 0 && (o[a] = 255,
            o[a + 1] = 96,
            o[a + 2] = 24,
            o[a + 3] = 132),
            a += 4
      }
      r.putImageData(a, i.x0, i.y0)
    }
    mE = null
  }
  return dE
}
function QA() {
  wA();
  let e = yS.getBoundingClientRect()
    , t = window.devicePixelRatio || 1
    , n = Math.max(1, Math.round(e.width * t))
    , r = Math.max(1, Math.round(e.height * t));
  (xS.width !== n || xS.height !== r) && (xS.width = n,
    xS.height = r);
  let i = xS.getContext(`2d`);
  if (!i)
    return;
  i.setTransform(t, 0, 0, t, 0, 0),
    i.clearRect(0, 0, e.width, e.height);
  let a = gA()
    , o = a?.mask
    , s = ej();
  if (!a || !s) {
    pE = null,
      mE = null;
    return
  }
  if (Xr(o)) {
    let e = ZA(a.assetId, o);
    e && (i.imageSmoothingEnabled = !1,
      i.drawImage(e, s.x, s.y, s.width, s.height))
  } else
    pE = null,
      mE = null;
  $A(i, a, s)
}
function $A(e, t, n) {
  let r = G;
  if (!r)
    return;
  let i = SE.filter(e => e.projectId === r && e.projectAssetId === t.projectAssetId);
  if (i.length === 0)
    return;
  let a = new Map(xE.filter(e => e.projectId === r).map(e => [e.annotationId, e]));
  for (let t of i) {
    let r = a.get(t.annotationId);
    if (!r)
      continue;
    let i = t.annotationId === CE
      , o = n.x + t.point.x * n.width
      , s = n.y + t.point.y * n.height;
    if (e.save(),
      e.lineWidth = i ? 4 : 2,
      e.strokeStyle = `#ffffff`,
      e.fillStyle = r.color,
      e.beginPath(),
      e.arc(o, s, i ? 8 : 6, 0, Math.PI * 2),
      e.fill(),
      e.stroke(),
      i) {
      e.font = `600 12px system-ui, sans-serif`,
        e.textBaseline = `middle`;
      let t = r.name
        , i = e.measureText(t).width
        , a = Math.min(n.x + n.width - i - 12, o + 12)
        , c = Math.max(n.y + 12, Math.min(n.y + n.height - 12, s));
      e.fillStyle = `rgba(15, 21, 29, 0.86)`,
        e.fillRect(a - 5, c - 10, i + 10, 20),
        e.fillStyle = `#ffffff`,
        e.fillText(t, a, c)
    }
    e.restore()
  }
}
function ej() {
  let e = TA();
  if (!e)
    return null;
  let t = EA(nE);
  (t.scale !== nE.scale || t.panX !== nE.panX || t.panY !== nE.panY) && (nE = t);
  let n = e.width * t.scale
    , r = e.height * t.scale;
  return {
    x: e.x + (e.width - n) * .5 + t.panX,
    y: e.y + (e.height - r) * .5 + t.panY,
    width: n,
    height: r
  }
}
function tj(e) {
  if (gS.hidden || W.length === 0)
    return;
  let t = (_A() + e + W.length) % W.length;
  $T = W[t].id,
    yA({
      render: !1
    }),
    vA()
}
function nj() {
  if (U || !$T)
    return;
  let e = _A()
    , t = $T
    , n = W.length > 1 ? W[e < W.length - 1 ? e + 1 : e - 1] : null;
  nA(t),
    $T = n?.id ?? null,
    $T ? vA() : rj()
}
function rj() {
  gS.hidden = !0,
    rE = !1,
    iE = !1,
    oE = null,
    sE = new Map,
    cE = null,
    $T = null,
    yA({
      render: !1
    }),
    bS.removeAttribute(`src`),
    bS.alt = ``,
    vS.textContent = ``;
  let e = xS.getContext(`2d`);
  e && e.clearRect(0, 0, xS.width, xS.height)
}
function ij(e) {
  let t = new DataTransfer;
  for (let n of e)
    t.items.add(n);
  return t.files
}
function aj(e, t) {
  let n = e.filter(pj).sort(_j);
  if (n.length === 0) {
    eS.textContent = `No supported image files found.`,
      Y(`Asset import skipped: no supported image files in ${t}`);
    return
  }
  XC.textContent = `0`,
    QC.textContent = `-`,
    tA(n, `upload`, t),
    bM(),
    sA(),
    HD(`setup`)
}
async function oj(e) {
  if (e) {
    eS.textContent = `Reading dropped assets...`;
    try {
      let t = await sj(e)
        , n = t.filter(mj);
      if (n.length > 0) {
        t.some(pj) && Y(`Drop contained images and video; using the first video file.`),
          await yj(n[0]);
        return
      }
      aj(t, `drop`)
    } catch (e) {
      let t = e instanceof Error ? e.message : String(e);
      eS.textContent = `Drop failed: ${t}`,
        Y(`Asset drop failed: ${t}`)
    }
  }
}
async function sj(e) {
  let t = Array.from(e.items ?? []).map(cj).filter(e => !!e);
  if (t.length === 0)
    return Array.from(e.files ?? []);
  let n = [];
  for (let e of t)
    n.push(...await uj(e));
  return n
}
function cj(e) {
  let t = e.webkitGetAsEntry?.call(e);
  return lj(t) ? t : null
}
function lj(e) {
  return typeof e == `object` && !!e && `isFile` in e && `isDirectory` in e
}
async function uj(e) {
  if (e.isFile)
    return [await dj(e)];
  if (!e.isDirectory)
    return [];
  let t = e.createReader()
    , n = [];
  for (; ;) {
    let e = await fj(t);
    if (e.length === 0)
      break;
    for (let t of e)
      n.push(...await uj(t))
  }
  return n
}
function dj(e) {
  return new Promise((t, n) => {
    e.file(t, n)
  }
  )
}
function fj(e) {
  return new Promise((t, n) => {
    e.readEntries(t, n)
  }
  )
}
function pj(e) {
  return e.type.startsWith(`image/`) || /\.(avif|bmp|gif|jpe?g|png|tiff?|webp)$/i.test(e.name)
}
function mj(e) {
  return e.type.startsWith(`video/`) || /\.(avi|m4v|mkv|mov|mp4|ogv|webm)$/i.test(e.name)
}
function hj(e) {
  if (e.type)
    return e.type;
  switch (e.name.split(`.`).pop()?.toLowerCase() ?? ``) {
    case `mp4`:
    case `m4v`:
      return `video/mp4`;
    case `mov`:
      return `video/quicktime`;
    case `webm`:
      return `video/webm`;
    case `ogv`:
      return `video/ogg`;
    case `avi`:
      return `video/x-msvideo`;
    case `mkv`:
      return `video/x-matroska`;
    default:
      return ``
  }
}
function gj(e) {
  let t = hj(e);
  return t ? B.canPlayType(t) === `` ? `This browser does not report support for ${t}. Try MP4/H.264 or WebM if loading fails.` : `` : `This browser could not infer the video type. MP4/H.264 or WebM usually work best.`
}
function _j(e, t) {
  return vj(e).localeCompare(vj(t), void 0, {
    numeric: !0,
    sensitivity: `base`
  })
}
function vj(e) {
  return e.webkitRelativePath || e.name
}
async function yj(e) {
  bj(!1),
    Zx.value = ``,
    Qx.value = ``,
    $x.classList.add(`hasAssets`),
    eS.textContent = `Video selected: ${e.name}. Configure frame capture below.`,
    ZC.textContent = String(oA()),
    XC.textContent = `0`,
    QC.textContent = `-`,
    yk(),
    UT = e,
    WT = URL.createObjectURL(e),
    B.src = WT,
    B.classList.add(`loaded`),
    B.load();
  let t = gj(e);
  $S.textContent = t ? `Reading video information for ${e.name}. ${t}` : `Reading video information for ${e.name}`,
    Cj(),
    bM(),
    nM(`Selected`, .12),
    X(`decode`, `active`, `Video selected`),
    HD(`setup`);
  try {
    let t = await Tj(8e3);
    KS.placeholder = t.duration === null ? `Required if unknown` : t.duration.toFixed(2),
      $S.textContent = t.duration === null ? `${e.name}: ${t.width}x${t.height}. Duration is unavailable; enter an end time, then extract frames.` : `${e.name}: ${t.width}x${t.height}, ${t.duration.toFixed(2)} s. Configure sampling and extract frames.`
  } catch (e) {
    KS.placeholder = `Required if unknown`;
    let t = e instanceof Error ? e.message : String(e);
    $S.textContent = `Video file accepted. Browser video information is unavailable: ${t} You can still enter start/end times and try extraction.`,
      Y(`Video information unavailable: ${t}`)
  } finally {
    Cj()
  }
}
function bj(e) {
  UT = null,
    GT = [],
    KT = !1,
    xj(e),
    e && W.length === 0 && ($x.classList.remove(`hasAssets`),
      eS.textContent = `No assets selected yet.`),
    sA(),
    Cj()
}
function xj(e) {
  UT = null,
    B.pause(),
    B.removeAttribute(`src`),
    B.classList.remove(`loaded`),
    B.load(),
    WT &&= (URL.revokeObjectURL(WT),
      null),
    US.width = 0,
    US.height = 0,
    KS.placeholder = `Auto`,
    $S.textContent = `Choose a video, configure sampling, then extract frames for reconstruction.`,
    e && (VS.value = ``)
}
function Sj() {
  KT || GT.length === 0 || (GT = [],
    eS.textContent = `Video settings changed. Extract frames again before reconstruction.`,
    yk(),
    sA(),
    nM(UT ? `Selected` : `Idle`, UT ? .12 : .08),
    X(`decode`, UT ? `active` : `pending`, UT ? `Extract frames again` : `Waiting`),
    $S.textContent = `Video settings changed. Extract frames again before reconstruction.`)
}
function Cj() {
  let e = !!U || KT
    , t = !!UT;
  HS.hidden = !t,
    ZS.disabled = e || !t,
    QS.disabled = e || !t,
    WS.disabled = e,
    GS.disabled = e,
    KS.disabled = e,
    qS.disabled = e,
    JS.disabled = e,
    XS.disabled = e,
    YS.disabled = e || JS.value !== `image/jpeg`
}
async function wj() {
  if (!(!UT || KT)) {
    KT = !0,
      GT = [],
      yk(),
      sA(),
      Cj();
    try {
      Y(`Extracting video frames from ${UT.name}`),
        X(`decode`, `active`, `Extracting video frames`);
      let e = await Tj(3e4)
        , t = kj(e.duration)
        , n = Aj(t)
        , r = jj(e.width, e.height, t.maxEdge)
        , i = Math.max(6, String(t.count).length)
        , a = Nj(UT, Date.now())
        , o = [];
      for (let e = 0; e < n.length; e++) {
        await Fj(n[e]),
          IT.drawImage(B, 0, 0, r.width, r.height);
        let s = await Rj(t.mime, t.quality)
          , c = `${t.basename}_${String(e + 1).padStart(i, `0`)}.${t.ext}`;
        o.push(Pj(new File([s], c, {
          type: t.mime,
          lastModified: Date.now()
        }), `${a}/${c}`));
        let l = `Extracted ${e + 1}/${n.length} video frames`;
        $S.textContent = l,
          X(`decode`, `active`, l),
          e % 4 == 3 && await zj()
      }
      let s = UT.name;
      GT = o,
        Zx.value = ``,
        Qx.value = ``,
        XC.textContent = `0`,
        QC.textContent = `-`,
        xj(!0),
        Cj(),
        tA(o, `video`, `video extraction`),
        nM(`Selected`, .14),
        X(`decode`, `active`, `${oA()} images selected`),
        eS.textContent = `${GT.length} extracted video frames added. ${oA()} images selected for reconstruction.`,
        $S.textContent = `Ready: ${GT.length} frames at ${r.width}x${r.height}.`,
        Y(`Video frames ready: ${GT.length} extracted images from ${s}`)
    } catch (e) {
      GT = [],
        sA();
      let t = e instanceof Error ? e.message : String(e);
      $S.textContent = `Video extraction failed: ${t}`,
        Y(`Video extraction failed: ${t}`),
        X(`decode`, `warn`, `Video extraction failed`)
    } finally {
      KT = !1,
        Cj()
    }
  }
}
async function Tj(e) {
  return Ej() || await Ij([`loadedmetadata`, `loadeddata`, `durationchange`, `resize`, `progress`, `canplay`], e, () => Ej(), `Could not decode video frame information.`),
    Oj()
}
function Ej() {
  return B.readyState >= 1 && B.videoWidth > 0 && B.videoHeight > 0
}
function Dj() {
  return Number.isFinite(B.duration) && B.duration > 0 ? B.duration : null
}
function Oj() {
  if (!Ej())
    throw Lj(`Could not read video frame information.`);
  return {
    width: B.videoWidth,
    height: B.videoHeight,
    duration: Dj()
  }
}
function kj(e) {
  let t = $(Math.round(Number(WS.value || 60)), 2, 2e3)
    , n = Number(GS.value)
    , r = Number(KS.value)
    , i = e !== null
    , a = Number.isFinite(r) && KS.value.trim() !== ``
    , o = i ? $(Number.isFinite(n) ? n : 0, 0, Math.max(0, e - .001)) : Math.max(0, Number.isFinite(n) ? n : 0);
  if (!i && !a)
    throw Error(`Video duration is unavailable. Enter an End time in seconds before extracting frames.`);
  let s = e ?? o + 10
    , c = a ? r : s
    , l = i ? $(c, o + .001, e) : Math.max(o + .001, c)
    , u = $(Math.round(Number(qS.value || 0)), 0, 6e3)
    , d = JS.value === `image/png` ? `image/png` : `image/jpeg`
    , f = $(Number(YS.value || .92), .1, 1)
    , p = Mj(XS.value);
  return WS.value = String(t),
    GS.value = o === 0 && GS.value.trim() === `` ? `` : String(o),
    KS.value = a || !i ? String(l) : ``,
    qS.value = String(u),
    YS.value = f.toFixed(2),
    XS.value = p,
  {
    count: t,
    start: o,
    end: l,
    maxEdge: u,
    mime: d,
    ext: d === `image/png` ? `png` : `jpg`,
    quality: f,
    basename: p
  }
}
function Aj(e) {
  if (e.count <= 1)
    return [(e.start + e.end) / 2];
  let t = Math.max(e.start, e.end - .001) - e.start;
  return Array.from({
    length: e.count
  }, (n, r) => e.start + t * r / (e.count - 1))
}
function jj(e, t, n) {
  let r = Math.max(e, t)
    , i = n > 0 && r > n ? n / r : 1
    , a = Math.max(1, Math.round(e * i))
    , o = Math.max(1, Math.round(t * i));
  return US.width = a,
    US.height = o,
  {
    width: a,
    height: o
  }
}
function Mj(e) {
  return e.trim().replace(/[^A-Za-z0-9._-]+/g, `_`).replace(/^_+|_+$/g, ``) || `frame`
}
function Nj(e, t) {
  return `video/${Mj(e.name.replace(/\.[^.]*$/, ``))}_ ${Math.max(0, Math.round(t)).toString(36)}`
}
function Pj(e, t) {
  return Object.defineProperty(e, "webkitRelativePath", {
    value: t,
    configurable: !0
  }),
    e
}
async function Fj(e) {
  let t = Dj()
    , n = t === null ? Math.max(0, e) : $(e, 0, Math.max(0, t - .001));
  B.readyState >= 2 && Math.abs(B.currentTime - n) < .05 || await new Promise((e, t) => {
    let r = !1
      , i = () => {
        r || B.readyState < 2 || (r = !0,
          s(),
          e())
      }
      , a = e => {
        r || (r = !0,
          s(),
          t(e instanceof Error ? e : Lj(`Could not seek video frame.`)))
      }
      , o = window.setTimeout(() => {
        a()
      }
        , 3e4)
      , s = () => {
        window.clearTimeout(o),
          B.removeEventListener(`seeked`, i),
          B.removeEventListener(`loadeddata`, i),
          B.removeEventListener(`canplay`, i),
          B.removeEventListener(`error`, a)
      }
      ;
    B.addEventListener(`seeked`, i),
      B.addEventListener(`loadeddata`, i),
      B.addEventListener(`canplay`, i),
      B.addEventListener(`error`, a, {
        once: !0
      });
    try {
      B.currentTime = n
    } catch (e) {
      a(e)
    }
  }
  )
}
async function Ij(e, t, n, r) {
  n() || await new Promise((i, a) => {
    let o = !1
      , s = () => {
        o || (n() ? c() : B.error && l())
      }
      , c = () => {
        o || (o = !0,
          f(),
          i())
      }
      , l = () => {
        o || (o = !0,
          f(),
          a(Lj(r)))
      }
      , u = window.setTimeout(() => {
        n() ? c() : l()
      }
        , t)
      , d = window.setInterval(s, 100)
      , f = () => {
        window.clearTimeout(u),
          window.clearInterval(d);
        for (let t of e)
          B.removeEventListener(t, s);
        B.removeEventListener(`error`, l)
      }
      ;
    for (let t of e)
      B.addEventListener(t, s);
    B.addEventListener(`error`, l, {
      once: !0
    }),
      s()
  }
  )
}
function Lj(e) {
  let t = B.error
    , n = UT ? ` ${gj(UT)}` : ``;
  if (!t)
    return Error(`${e}${n}`.trim());
  let r = t.message ? `: ${t.message}` : ` (code ${t.code})`;
  return Error(`${e}${r}${n}`.trim())
}
function Rj(e, t) {
  return new Promise((n, r) => {
    US.toBlob(t => {
      t ? n(t) : r(Error(`Could not encode video frame as ${e}`))
    }
      , e, e === `image/jpeg` ? t : void 0)
  }
  )
}
function zj() {
  return new Promise(e => window.requestAnimationFrame(() => e()))
}
function Bj(e) {
  return j_(e.map(e => ({
    path: vj(e),
    name: e.name,
    type: e.type || ``,
    size: e.size,
    lastModified: e.lastModified || 0
  })))
}
function Vj(e, t = G ?? jx) {
  return `project:${t}:assets:${e}`
}
function Hj(e) {
  let t = new TextEncoder().encode(JSON.stringify({
    schemaVersion: e.schemaVersion,
    frames: e.frames,
    totalFeatures: e.totalFeatures
  })).byteLength;
  return e.features.reduce((e, t) => e + t.xs.byteLength + t.ys.byteLength + (t.scales?.byteLength ?? 0) + (t.orientations?.byteLength ?? 0) + t.scores.byteLength + t.descriptors.byteLength + t.colors.byteLength, t)
}
function Uj(e) {
  return new TextEncoder().encode(JSON.stringify(e)).byteLength
}
function Wj(e) {
  let t = new TextEncoder().encode(JSON.stringify({
    schemaVersion: e.schemaVersion,
    pairCount: e.pairCount,
    matchCount: e.matchCount,
    pairs: e.pairs.map(e => ({
      i: e.i,
      j: e.j,
      count: e.count
    }))
  })).byteLength;
  return e.pairs.reduce((e, t) => e + t.triples.byteLength, t)
}
function Gj(e) {
  let t = e.model
    , n = t.cameras.length * 96
    , r = t.poses.length * 220
    , i = t.points.reduce((e, t) => e + 64 + t.track.length * 12, 0)
    , a = t.images.reduce((e, t) => e + 96 + t.xys.length * 16 + t.point3DIds.length * 8, 0)
    , o = 256 + t.stats.diagnostics.length * 220;
  return n + r + i + a + o
}
var Kj = class extends Error {
  stateLabel;
  progress;
  constructor(e, t, n) {
    super(e),
      this.stateLabel = t,
      this.progress = n,
      this.name = `ReconstructionStepPause`
  }
}
  ;
async function qj() {
  if (!V) {
    cC.textContent = `Persistent cache is unavailable in this browser.`,
      sC.disabled = !0;
    return
  }
  let e = rO();
  if (sC.disabled = !!U || e.length === 0,
    !aC.checked) {
    cC.textContent = `Persistent cache is off. Step data will not be reused.`,
      xM();
    return
  }
  if (e.length === 0) {
    cC.textContent = `Persistent cache is ready once images are selected.`,
      xM();
    return
  }
  try {
    let t = Bj(e)
      , n = await V.estimateBytes(Vj(t))
      , r = tk()
      , i = r > 0 && yE ? ` Source images are stored locally (${EM(r)}).` : r > 0 ? ` Source images will be stored locally when browser storage is available.` : ``;
    cC.textContent = n > 0 ? `Persistent cache has ${EM(n)} for the selected images.${i}` : `Persistent cache is ready for the selected images.${i}`,
      !U && !H && SM(oC.value, n > 0)
  } catch (e) {
    cC.textContent = `Persistent cache unavailable: ${e instanceof Error ? e.message : String(e)}`
  }
}
async function Jj() {
  if (!V || U)
    return;
  let e = rO();
  if (e.length === 0) {
    cC.textContent = `Select images before clearing their step cache.`;
    return
  }
  try {
    let t = Bj(e);
    await V.clearProject(Vj(t)),
      await V.clearSourceAssetProject(jx),
      await V.clearSourceAssetMaskProject(jx),
      await V.clearRunSessionsForSourceProject(G ?? jx),
      ok(),
      q = null,
      await Tk(),
      cC.textContent = `Persistent reconstruction cache cleared for the current project.`,
      xM(),
      Y(`Cleared persistent step cache and stored source images`)
  } catch (e) {
    let t = e instanceof Error ? e.message : String(e);
    cC.textContent = `Persistent cache clear failed: ${t}`,
      Y(`Persistent cache clear failed: ${t}`)
  }
}
function Yj(e, t, n) {
  return {
    minMatches: $(Number(TC.value || e.minMatches), 8, 80),
    maxPointsPerPair: $(Number(LC.value || e.maxPointsPerPair), 0, 12e3),
    maxTrackGap: $(Number(wC.value || e.maxTrackGap), 1, 8),
    guidedTrackRadius: $(Number(jC.value || e.guidedTrackRadius), 0, 60),
    guidedDescriptorDistance: $(Number(MC.value || e.guidedDescriptorDistance), 0, 128),
    mapper: _C.value,
    pairStrategy: vC.value,
    retrievalTopK: $(Number(yC.value || e.retrievalTopK), 4, 256),
    pairCandidateBudget: $(Number(bC.value || e.pairCandidateBudget), 0, 5e4),
    geometryCandidateBudget: $(Number(xC.value || e.geometryCandidateBudget), 0, 5e4),
    gpuMode: n,
    pnpMinInliers: $(Number(SC.value || e.pnpMinInliers), 6, 200),
    pnpPixelThreshold: $(Number(CC.value || e.pnpPixelThreshold), .5, 20),
    matcherHammingMax: t.values.matcherHammingMax,
    matcherRatio: t.values.matcherRatio,
    adaptiveMatcherThresholds: IC.checked,
    autoFocalProbe: rC.checked && uC.value !== `manual`,
    focalProbeRatios: xs,
    focalProbeMaxPairs: 12,
    focalProbeMaxMatchesPerPair: 500,
    relativePoseRansacIterations: $(Number(RC.value || e.relativePoseRansacIterations), 64, 8e3),
    relativePoseSolver: zC.value,
    triangulationReprojectionPx: $(Number(BC.value || e.triangulationReprojectionPx), 1, 20),
    triangulationMinParallaxDeg: $(Number(VC.value || e.triangulationMinParallaxDeg), .05, 5),
    minVerifiedParallaxDeg: $(Number(HC.value || e.minVerifiedParallaxDeg), 0, 5),
    allowWeakInitialFallback: UC.checked,
    localPointRefinement: WC.checked,
    localPoseRefinement: GC.checked,
    refineIntrinsics: KC.checked,
    visualBridgeMode: EC.value,
    visualBridgeCandidates: $(Number(DC.value || e.visualBridgeCandidates), 0, 2e3),
    visualBridgeSignatureMax: $(Number(kC.value || e.visualBridgeSignatureMax), 0, 256),
    visualBridgeMinInliers: $(Number(AC.value || e.visualBridgeMinInliers), 20, 300),
    visualBridgePairsPerComponent: $(Number(OC.value || e.visualBridgePairsPerComponent), 1, 64)
  }
}
async function Xj() {
  debugger
  if (U)
    return;
  let e = rO();
  if (e.length < 2) {
    Y(UT && GT.length === 0 && W.length === 0 ? `Extract at least two frames from the selected video before reconstruction.` : `Select at least two checked images or extract frames from a video. A 5-20 image ordered sequence works better.`),
      HD(`setup`);
    return
  }
  let t = iO()
    , n = G && V ? await V.listManualPairAnnotations(G) : []
    , r = aO(n, t)
    , i = G && V && aC.checked ? await V.listNamedAnnotationObservations(G) : lO()
    , a = Ha(i, t)
    , o = [...r, ...a]
    , s = j_({
      pairAnnotations: Kn(n),
      namedAnnotations: Va(i)
    })
    , c = NE()
    , l = ij(e)
    , u = oO(e)
    , d = c.useMasksForSfm ? u : u.map(() => null)
    , f = Qr(d)
    , p = u.filter(Xr).length
    , m = null
    , h = new AbortController;
  U = h,
    $j(!0),
    KD(!0, !0),
    H = null,
    LT = [],
    EE = null,
    TE = null,
    K = null,
    uM(!1),
    bM(),
    nM(`Running`, .42),
    HD(`result`),
    pw.textContent = `Running`,
    mw.innerHTML = ``,
    UM(),
    YC.textContent = ``;
  try {
    let t = W.length;
    Y(`Reconstructing ${e.length} selected image${e.length === 1 ? `` : `s`}` + (t > 0 ? ` (${e.length} / ${t} available).` : `.`) + (p > 0 ? ` ${p} masked.` : ``));
    let n = $(Number(mC.value || c.maxFeatures), 300, 9e3)
      , r = $(Number(PC.value || gx), 32, 192)
      , i = $(Number(FC.value || _x), .5, .98);
    Y(`Inspecting selected images for autotune`),
      X(`decode`, `active`, `Inspecting image sizes`);
    let u = [];
    for (let t = 0; t < e.length; t++) {
      let n = e[t];
      n && (u.push(await n_(n)),
        t % 16 == 15 && await zj())
    }
    let g = u[0];
    if (!g)
      throw Error(`First image vanished from the file picker`);
    let _ = j(u);
    u.length > 1 && Y(`autotune: representative image size ${_.width}x${_.height} from ${u.length} selected images`);
    let v = Math.max(...u.map(e => Math.max(e.width, e.height)))
      , y = oM(c, fC.value === `original` ? {
        width: v,
        height: v
      } : _)
      , b = {
        maxLongEdge: c.maxLongEdge,
        maxFeatures: c.maxFeatures,
        matcherHammingMax: gx,
        matcherRatio: _x
      }
      , x = {
        maxLongEdge: y.autotuneMaxLongEdge,
        maxFeatures: n,
        matcherHammingMax: r,
        matcherRatio: i
      }
      , S = A({
        nativeWidth: _.width,
        nativeHeight: _.height,
        nativeSizes: u,
        preset: b,
        current: x,
        enabled: rC.checked,
        lockMaxLongEdge: y.lockMaxLongEdge
      });
    if (rC.checked)
      if (S.changes.length === 0)
        Y(`autotune: no changes for ${_.width}x${_.height} input`);
      else
        for (let e of S.changes)
          Y(`autotune: ${e.field} ${e.from} -> ${e.to} (${e.reason})`);
    p > 0 && !c.useMasksForSfm && Y(`masks: retained for export/training, ignored during ${PE()} SfM feature extraction`);
    let C = NC.value
      , w = uC.value
      , T = w === `manual` ? Number(lC.value || 0) : 0
      , E = Qg(w, g.width, g.height, T)
      , D = Bx(gC.value) ?? `webgpu`
      , O = D === `wasm-grid` || D === `wasm-score-map`
      , k = D === `wasm-score-map`
      , ee = D === `webgpu`
      , M = {
        focalOverride: E.mode === `manual` ? E.nativeFocal : 0,
        focalPrior: w,
        maxLongEdge: y.mode === `original` ? 1 / 0 : S.values.maxLongEdge,
        preserveOriginalMaxLongEdge: yx
      }
      , N = {
        maxFeatures: S.values.maxFeatures,
        threshold: $(Number(hC.value || c.threshold), 4, 80),
        useGpu: ee && C !== `cpu`,
        useWebGpuFastBrief: ee,
        pyramidOctaves: $(c.pyramidOctaves, 1, 6),
        masks: d
      }
      , te = Bj(e)
      , ne = j_({
        focalOverride: M.focalOverride,
        focalPrior: M.focalPrior,
        maxLongEdge: y.mode === `original` ? `original` : M.maxLongEdge,
        preserveOriginalMaxLongEdge: M.preserveOriginalMaxLongEdge
      })
      , re = j_({
        extractor: N.useWebGpuFastBrief ? `webgpu-fast-brief` : `cpu-pyramid-oriented-brief-v1`,
        maxFeatures: N.maxFeatures,
        threshold: N.threshold,
        useGpu: N.useGpu,
        useWebGpuFastBrief: N.useWebGpuFastBrief,
        pyramidOctaves: N.pyramidOctaves,
        maskFingerprint: f,
        featurePath: D,
        fastScore: D === `wasm-grid` ? `wasm-fast9-fused-grid-v2` : D === `wasm-score-map` ? `wasm-fast9-score-map-v1` : D === `webgpu` ? `webgpu-fast-nms-v1` : `javascript-fast9-v1`,
        brief: D === `wasm-grid` || D === `wasm-score-map` ? `wasm-oriented-brief-v1` : D === `webgpu` ? `webgpu-brief-v1` : `javascript-oriented-brief-v1`
      })
      , P = Vj(te);
    q = Sk({
      assetFingerprint: te,
      settingsHash: j_({
        decode: ne,
        feature: re,
        preset: {
          quality: tC.value,
          scene: nC.value
        },
        scale: fC.value,
        gpuMode: C,
        manualAnnotations: s
      }),
      imageCount: t,
      selectedImageCount: e.length
    }),
      await Ck();
    let ie = h_(te, ne)
      , ae = d_(te, ne, re)
      , oe = aC.checked && V !== null;
    debugger
    oe && await hE;
    let se = Wg(_.width, _.height, M.maxLongEdge)
      , ce = Wg(g.width, g.height, M.maxLongEdge)
      , le = $g(E.nativeFocal, ce.width, ce.height, g.width, g.height);
    RE({
      nativeWidth: g.width,
      nativeHeight: g.height,
      processedWidth: ce.width,
      processedHeight: ce.height
    }),
      Y(`focal: ${zE(E.mode).toLowerCase()} prior ${E.nativeFocal.toFixed(0)} native px -> ${le.fx.toFixed(0)} processed px (${E.ratio.toFixed(2)}x max edge)`);
    let ue = Jg(Gg(e.length, se.width, se.height))
      , de = oe && ue.useCache
      , fe = oC.value
      , pe = Co(fe)
      , me = iC.value === `step` && oe;
    iC.value === `step` && !oe && Y(`Step mode requested, but persistent cache is unavailable or disabled; continuing in one run.`);
    let F = null
      , he = null
      , ge = null
      , _e = !1
      , ve = !1;
    if (SM(fe, oe),
      oe && pe.useFeatureCache)
      try {
        await py();
        let n = Z()
          , r = await V.getArtifact(P, ae);
        r?.payload.schemaVersion === 1 && r.payload.frames.length === e.length && r.payload.features.length === r.payload.frames.length && (F = r.payload.frames,
          he = x_(r.payload.features),
          ve = !0,
          ZC.textContent = String(F.length),
          Y(`Loaded cached feature artifact (${F.length} images, ${r.payload.totalFeatures.toLocaleString()} features)`),
          CM(`features`, `cached`, `loaded from cache`),
          X(`decode`, `done`, `${F.length} cached images`),
          J(`source`, {
            state: `cached`,
            summary: `${F.length.toLocaleString()} decoded frame records loaded from feature cache`,
            durationMs: Z() - n,
            metrics: ND(`source`, {
              images: t,
              selected: e.length,
              decoded: F.length
            })
          }),
          X(`features`, `done`, `${r.payload.totalFeatures.toLocaleString()} cached features`),
          J(`features`, {
            state: `cached`,
            summary: `${r.payload.totalFeatures.toLocaleString()} features loaded from cache`,
            artifactKey: ae,
            durationMs: Z() - n,
            metrics: {
              images: F.length,
              features: r.payload.totalFeatures
            }
          }),
          HM(F, he, null, null, null, e),
          $C.textContent = `WebGPU: feature cache loaded`)
      } catch (e) {
        Y(`Persistent feature cache unavailable: ${e instanceof Error ? e.message : String(e)}`)
      }
    if (!F || !he) {
      if (CM(`features`, `active`, pe.useFeatureCache ? `building` : `forced recompute`),
        de)
        try {
          let n = Z()
            , r = await V.getArtifact(P, ie);
          r?.payload && Fk(r.payload, e.length) && (ge = v_(r.payload.frames),
            F = g_(ge),
            ZC.textContent = String(F.length),
            Y(`Loaded cached decoded images (${F.length} images, ${EM(r.byteSize || qg(r.payload))})`),
            X(`decode`, `done`, `${F.length} cached images`),
            J(`source`, {
              state: `cached`,
              summary: `${F.length.toLocaleString()} decoded images loaded from cache`,
              artifactKey: ie,
              durationMs: Z() - n,
              metrics: ND(`source`, {
                images: t,
                selected: e.length,
                decoded: F.length,
                bytes: r.byteSize || qg(r.payload)
              })
            }))
        } catch (e) {
          Y(`Persistent decode cache unavailable: ${e instanceof Error ? e.message : String(e)}`)
        }
      else
        oe && Y(`Decoded image cache skipped (${EM(ue.byteSize)} estimate exceeds ${EM(Ug)} safety budget); source images remain stored locally.`);
      if (!ge) {
        Y(`Decoding images`),
          X(`decode`, `active`, `Reading pixels`);
        let n = Z();
        if (ge = await u_(l, M),
          sM(h.signal),
          F = g_(ge),
          ZC.textContent = String(F.length),
          ge.forEach(e => Y(`${e.name}: ${e.width}x${e.height}, ${e.intrinsics.source}`)),
          Y(`Decoded ${F.length} images in ${TM(Z() - n)}`),
          J(`source`, {
            state: `done`,
            summary: `${F.length.toLocaleString()} images decoded`,
            durationMs: Z() - n,
            metrics: ND(`source`, {
              images: t,
              selected: e.length,
              decoded: F.length
            })
          }),
          X(`decode`, `done`, `${F.length} images`),
          de) {
          let e = Jg(Kg(ge));
          if (!e.useCache)
            Y(`Decoded image cache skipped (${EM(e.byteSize)} actual processed pixels exceed ${EM(Ug)} safety budget); source images remain stored locally.`);
          else {
            let e = y_(ge, {
              cloneBuffers: !1
            })
              , t = qg(e);
            try {
              await V.putArtifact({
                projectId: P,
                key: ie,
                stepId: `decode`,
                schemaVersion: e.schemaVersion,
                configHash: ne,
                upstreamKeys: [`assets:${te}`],
                byteSize: t,
                payload: e
              }),
                Y(`Stored decoded images in browser cache (${EM(t)})`),
                qj()
            } catch (e) {
              Y(`Could not store decoded images: ${e instanceof Error ? e.message : String(e)}`)
            }
          }
        }
      }
      if (!F)
        throw Error(`Decoded frame metadata unavailable`);
      Y(`Extracting features`),
        X(`features`, `active`, `Detecting corners`);
      let n = Z()
        , r = O ? await Jb() : null;
      r && Y(`Wasm: oriented BRIEF descriptor writer enabled`);
      let i = r && O ? k ? {
        writeFast9Scores: r.writeFast9Scores.bind(r)
      } : r : null;
      D === `javascript` ? Y(`Feature path: JavaScript FAST + oriented BRIEF`) : D === `webgpu` ? Y(C === `cpu` ? `Feature path: WebGPU requested, but GPU mode is CPU only; using JavaScript fallback` : `Feature path: WebGPU FAST + BRIEF`) : i ? Y(k ? `Feature path: Wasm FAST-9 score maps + Wasm oriented BRIEF` : `Feature path: Wasm FAST-9 fused grid + Wasm oriented BRIEF`) : O && Y(`Requested Wasm feature path, but the geometry Wasm module is unavailable; using JavaScript FAST + oriented BRIEF`);
      let a = await PT.extractAll(ge, {
        ...N,
        fastScoreWriter: i,
        briefDescriptorWriter: r
      }, Y);
      sM(h.signal),
        he = a.features,
        m = he,
        _e = a.usedGpu;
      let o = he.reduce((e, t) => e + t.count, 0);
      Y(`Feature extraction completed in ${TM(Z() - n)} (${o.toLocaleString()} features)`);
      let s = Z() - n;
      if (X(`features`, `done`, `${o.toLocaleString()} features`),
        $C.textContent = D === `webgpu` ? a.usedGpu ? `Feature extraction: WebGPU FAST+BRIEF` : `Feature extraction: WebGPU fallback to JavaScript` : D === `javascript` ? `Feature extraction: JavaScript FAST+BRIEF` : r ? k ? `Feature extraction: Wasm score-map FAST+BRIEF` : `Feature extraction: Wasm fused FAST+BRIEF` : `Feature extraction: JavaScript fallback`,
        HM(F, he, null, null, null, e),
        J(`features`, {
          state: `done`,
          summary: `${o.toLocaleString()} features extracted`,
          durationMs: s,
          metrics: ND(`features`, {
            images: F.length,
            features: o,
            gpu: a.usedGpu,
            wasmBrief: !!r
          })
        }),
        oe) {
        let t = S_(F, he)
          , n = Hj(t);
        try {
          await V.putArtifact({
            projectId: P,
            key: ae,
            stepId: `features`,
            schemaVersion: t.schemaVersion,
            configHash: re,
            upstreamKeys: [`assets:${te}`, ie],
            byteSize: n,
            payload: t
          }),
            Y(`Stored feature artifact in browser cache (${EM(n)})`),
            CM(`features`, `cached`, `stored`),
            J(`features`, {
              state: `cached`,
              summary: `${t.totalFeatures.toLocaleString()} features stored`,
              artifactKey: ae,
              durationMs: s,
              metrics: {
                images: t.frames.length,
                features: t.totalFeatures,
                gpu: a.usedGpu,
                wasmBrief: !!r
              }
            }),
            HM(F, he, null, null, null, e),
            qj()
        } catch (e) {
          Y(`Could not store feature artifact: ${e instanceof Error ? e.message : String(e)}`)
        }
      }
      if (me) {
        Y(`Step mode paused after feature extraction. Adjust matching or mapper settings, then press Run next to continue from the cached feature artifact.`),
          nM(`Features cached`, .42),
          X(`matching`, `pending`, `Waiting for next step`);
        return
      }
    } else
      ve && iC.value === `step` && Y(`Step mode continuing from cached features`);
    if (!F || !he)
      throw Error(`Feature extraction did not produce reconstruction inputs`);
    let ye = Yj(c, S, C);
    ye.manualPairs = o,
      o.length > 0 && Y(`Loaded ${o.length} manually annotated pair${o.length === 1 ? `` : `s`} for this run` + (a.length > 0 ? ` (${a.length} from named annotations)` : ``));
    let be = j_({
      mapper: ye.mapper ?? `graph-pnp`,
      pairStrategy: ye.pairStrategy ?? `retrieval`,
      retrievalTopK: ye.retrievalTopK ?? 32,
      pairCandidateBudget: ye.pairCandidateBudget ?? 0,
      maxTrackGap: ye.maxTrackGap,
      manualAnnotations: s
    })
      , xe = j_({
        ...ye,
        manualAnnotations: s
      })
      , Se = m_(ae, be, xe)
      , Ce = oe && (ye.mapper ?? `graph-pnp`) === `graph-pnp` ? {
        projectId: P,
        featureKey: ae,
        mapperConfigHash: be,
        pauseAfterStore: iC.value === `step`,
        usePairPlanCache: pe.usePairPlanCache,
        useDescriptorMatchCache: pe.useDescriptorMatchCache
      } : void 0;
    Y(`Matching and restructuring camera positions`),
      X(`matching`, `active`, `Building view graph`);
    let we = Z()
      , { model: Te, telemetry: Ee } = await NM(F, he, ye, h.signal, Ce, e);
    Te.stats.gpuScoring = _e,
      Y(`Reconstruction phase completed in ${TM(Z() - we)}`),
      HM(F, he, EE, TE, Te, e);
    let De;
    if (oe) {
      let e = k_(Te)
        , t = Gj(e);
      try {
        await V.putArtifact({
          projectId: P,
          key: Se,
          stepId: `finalise`,
          schemaVersion: e.schemaVersion,
          configHash: xe,
          upstreamKeys: [ae, ...q?.stages[`pair-plan`]?.artifactKey ? [q.stages[`pair-plan`].artifactKey] : [], ...q?.stages.matches?.artifactKey ? [q.stages.matches.artifactKey] : []],
          byteSize: t,
          payload: e
        }),
          De = Se,
          Y(`Stored 3D result in browser cache (${Te.points.length.toLocaleString()} points, ${EM(t)})`),
          qj()
      } catch (e) {
        Y(`Could not store 3D result artifact: ${e instanceof Error ? e.message : String(e)}`)
      }
    }
    let Oe = hD(TE);
    if (Ee.matchingDurationMs !== void 0 || Ee.descriptorMatching || Oe > 0) {
      let e = q?.stages.matches;
      J(`matches`, {
        state: e?.state === `cached` ? `cached` : `done`,
        summary: e?.summary ?? (Oe > 0 ? `${Oe.toLocaleString()} descriptor matches ready` : `Descriptor matching completed`),
        artifactKey: e?.artifactKey,
        durationMs: e?.durationMs ?? Ee.matchingDurationMs,
        metrics: ND(`matches`, {
          ...Oe > 0 ? {
            matches: Oe
          } : {},
          ...Ee.descriptorMatching ? {
            matcher: Ee.descriptorMatching.label,
            matcherBatches: Ee.descriptorMatching.batches,
            descriptorComparisons: Ee.descriptorMatching.comparisons,
            compactBatches: Ee.descriptorMatching.compactBatches ?? 0,
            directionalBatches: Ee.descriptorMatching.directionalBatches ?? 0,
            descriptorReadbackBytes: Ee.descriptorMatching.readbackBytes ?? 0,
            descriptorUploadBytes: Ee.descriptorMatching.descriptorCpuUploadBytes ?? 0
          } : {}
        })
      })
    }
    J(`geometry`, {
      state: `done`,
      summary: `${Te.stats.registeredImages}/${Te.poses.length} cameras, ${Te.points.length} sparse points`,
      artifactKey: De,
      durationMs: Ee.geometryDurationMs ?? Z() - we,
      metrics: ND(`geometry`, {
        cameras: Te.stats.registeredImages,
        images: Te.poses.length,
        points: Te.points.length,
        diagnostics: Te.stats.diagnostics.length,
        ...Ee.geometryScoring ? {
          epipolarBatches: Ee.geometryScoring.batches,
          epipolarHypotheses: Ee.geometryScoring.hypotheses,
          sampsonTests: Ee.geometryScoring.matchTests,
          webGpuBatches: Ee.geometryScoring.webGpuBatches ?? 0,
          wasmBatches: Ee.geometryScoring.wasmBatches ?? 0
        } : {}
      })
    }),
      J(`bundle`, {
        state: `done`,
        summary: `${Te.stats.medianReprojectionError.toFixed(2)} px median reprojection error`,
        artifactKey: De,
        durationMs: Ee.bundleDurationMs,
        metrics: ND(`bundle`, {
          medianPx: Te.stats.medianReprojectionError.toFixed(2),
          rmsBefore: Te.stats.bundleAdjust?.errorBefore.toFixed(2) ?? `-`,
          rmsAfter: Te.stats.bundleAdjust?.errorAfter.toFixed(2) ?? `-`,
          iterations: Te.stats.bundleAdjust?.iterations ?? 0,
          acceptedSteps: Te.stats.bundleAdjust?.acceptedSteps ?? 0
        })
      }),
      J(`exports`, {
        state: `done`,
        summary: `Exports ready`,
        artifactKey: De,
        metrics: ND(`exports`, {
          plyPoints: Te.points.length,
          cameras: Te.stats.registeredImages
        })
      }),
      Zj(Te, e)
  } catch (e) {
    e instanceof Kj ? (wk(),
      Y(e.message),
      nM(e.stateLabel, e.progress)) : cM(e) ? (Y(`Reconstruction cancelled`),
        nM(`Cancelled`, .12)) : (Y(`ERROR: ${e instanceof Error ? e.message : String(e)}`),
          nM(`Error`, .12),
          console.error(e))
  } finally {
    m && lM(m),
      U === h && (U = null),
      $j(!1)
  }
}
function Zj(e, t) {
  bk(),
    NT.setModel(e),
    H = e,
    LT = t,
    vD(),
    uM(!0),
    X(`mapping`, `done`, `${e.stats.registeredImages}/${e.poses.length} cameras`),
    X(`bundle`, `done`, `${e.stats.medianReprojectionError.toFixed(2)} px median`),
    X(`exports`, `done`, `Ready`),
    XC.textContent = String(e.points.length),
    QC.textContent = e.stats.medianReprojectionError ? e.stats.medianReprojectionError.toFixed(2) : `-`,
    Y(`Done: ${e.stats.registeredImages}/${e.poses.length} cameras, ${e.points.length} sparse points`),
    Y(`Matches per pair: ${e.stats.matches.join(`, `) || `none`}`),
    Y(`Track quality: ${e.stats.longTracks} points observed in 3+ images, mean track length ${e.stats.meanTrackLength.toFixed(2)}, guided observations ${e.stats.guidedObservations}`),
    PM(e),
    WD();
  for (let t of eN(e))
    Y(t);
  nM(`Ready`, 1),
    HD(`result`)
}
function Qj(e, t, n = {}) {
  bk(),
    NT.setModel(e),
    H = e,
    LT = t,
    vD(),
    uM(!0),
    KD(!0, !1),
    X(`mapping`, `done`, `${e.stats.registeredImages}/${e.poses.length} cameras`),
    X(`bundle`, `done`, `${e.stats.medianReprojectionError.toFixed(2)} px median`),
    X(`exports`, `done`, `Ready`),
    XC.textContent = String(e.points.length),
    QC.textContent = e.stats.medianReprojectionError ? e.stats.medianReprojectionError.toFixed(2) : `-`,
    PM(e),
    WD(),
    Y(`Restored cached 3D result: ${e.stats.registeredImages}/${e.poses.length} cameras, ${e.points.length} sparse points`),
    nM(`Ready`, 1),
    (n.activateResult ?? !0) && HD(`result`)
}
function $j(e) {
  eC.disabled = !1,
    eC.textContent = e ? `Cancel` : iC.value === `step` ? `Run next` : `Reconstruct`;
  for (let t of Object.values(jT))
    t instanceof HTMLButtonElement && (t.disabled = e);
  tM(e),
    Hk(),
    Dk(),
    RE(),
    sA({
      preserveRunState: !0
    }),
    Cj(),
    pD()
}
function eM() {
  debugger
  U || (eC.textContent = iC.value === `step` ? `Run next` : `Reconstruct`)
}
function tM(e) {
  Rw?.classList.toggle(`settingsLocked`, e),
    Rw?.querySelectorAll(`input, select, button`).forEach(t => {
      if (t !== qx) {
        if (t === Jx) {
          t.disabled = e || RT;
          return
        }
        t.disabled = e
      }
    }
    )
}
function nM(e, t) {
  kT.textContent = e,
    AT.style.setProperty(`--progress`, `${Math.max(.04, Math.min(1, t)).toFixed(2)}turn`),
    pD()
}
function rM() {
  let e = localStorage.getItem(`websfm-theme`);
  return e === `light` || e === `dark` ? e : window.matchMedia?.(`(prefers-color-scheme: dark)`).matches ? `dark` : `light`
}
function iM(e) {
  aM(e),
    localStorage.setItem(`websfm-theme`, e)
}
function aM(e) {
  ME = e,
    document.documentElement.dataset.theme = e,
    NT.setTheme(e);
  let t = e === `dark`;
  Cw.setAttribute(`aria-pressed`, String(t)),
    Cw.setAttribute(`aria-label`, t ? `Switch to light mode` : `Switch to dark mode`),
    Cw.title = t ? `Switch to light mode` : `Switch to dark mode`;
  let n = Cw.querySelector(`.themeToggleText`);
  n && (n.textContent = t ? `Light` : `Dark`)
}
function oM(e, t) {
  let n = fC.value;
  return n === `original` ? {
    mode: n,
    autotuneMaxLongEdge: Math.max(t.width, t.height),
    lockMaxLongEdge: !0
  } : n === `custom` ? {
    mode: n,
    autotuneMaxLongEdge: $(Number(pC.value || e.maxLongEdge), 256, vx),
    lockMaxLongEdge: !0
  } : {
    mode: `auto`,
    autotuneMaxLongEdge: e.maxLongEdge,
    lockMaxLongEdge: !1
  }
}
function sM(e) {
  if (e.aborted)
    throw new DOMException(`Reconstruction aborted`, `AbortError`)
}
function cM(e) {
  return e instanceof DOMException && e.name === `AbortError`
}
function lM(e) {
  for (let t of e)
    t.gpuDescriptors?.buffer.destroy(),
      t.gpuDescriptors = void 0
}
function uM(e) {
  ew.disabled = !e,
    tw.disabled = !e,
    rw.disabled = !e,
    iw.disabled = !e,
    aw.disabled = !e,
    ow.disabled = !e,
    sw.disabled = !e,
    dw.disabled = !e,
    fw.disabled = !e,
    dM()
}
function dM() {
  let e = nw.value;
  if (nw.replaceChildren(new Option(`All components`, `all`)),
    !H) {
    nw.disabled = !0;
    return
  }
  let t = nm(H);
  for (let e of t)
    nw.append(new Option(`${e.label} (${e.registeredImages} cams, ${e.points.toLocaleString()} pts)`, String(e.id)));
  nw.value = Array.from(nw.options).some(t => t.value === e) ? e : `all`,
    nw.disabled = t.length <= 1
}
function fM() {
  let e = nw.value;
  if (e === `all`)
    return `all`;
  let t = Number(e);
  return Number.isInteger(t) ? t : `all`
}
function pM() {
  return H ? om(H, fM()) : null
}
function mM(e, t) {
  let n = fM();
  return `${e}${typeof n == `number` ? `_component_${n}` : ``}.${t}`
}
function Y(e) {
  YC.textContent += `${e}\n`,
    YC.scrollTop = YC.scrollHeight,
    wM(e)
}
var hM = {
  decode: {
    active: .16,
    done: .24
  },
  features: {
    active: .32,
    done: .42
  },
  matching: {
    active: .54,
    done: .64
  },
  mapping: {
    active: .74,
    done: .84
  },
  bundle: {
    active: .92,
    done: .96
  },
  exports: {
    active: .98,
    done: 1
  }
}
  , gM = {
    decode: `features`,
    features: `pair-plan`,
    matching: `verification`,
    mapping: `verification`,
    bundle: `verification`,
    exports: `latest`
  };
function _M(e) {
  switch (e) {
    case `features`:
      return `decode`;
    case `pair-plan`:
      return `features`;
    case `matching`:
    case `verification`:
      return `matching`;
    case `latest`:
      return null
  }
}
function vM(e) {
  for (let t of Object.keys(jT))
    jT[t].classList.toggle(`selected`, t === e),
      jT[t].setAttribute(`aria-pressed`, t === e ? `true` : `false`)
}
function yM(e) {
  if (U)
    return;
  let t = gM[e];
  uD(YE[e], {
    syncPhase: !1
  }),
    oC.value = t,
    vM(e),
    qj(),
    KD(!0, !0),
    HD(`result`)
}
function bM() {
  for (let e of Object.keys(jT))
    X(e, `pending`, e === `exports` ? `Pending` : `Waiting`);
  xM()
}
function X(e, t, n) {
  let r = jT[e];
  r.classList.remove(`pending`, `active`, `done`, `warn`),
    r.classList.add(t);
  let i = r.querySelector(`small`);
  i && (i.textContent = n),
    (t === `active` || t === `done`) && nM(U ? `Running` : kT.textContent || `Idle`, hM[e][t]),
    pD()
}
function xM() {
  CM(`features`, `pending`, `features`),
    CM(`pairPlan`, `pending`, `pair plan`),
    CM(`matches`, `pending`, `matches`),
    CM(`geometry`, `pending`, `geometry`)
}
function SM(e, t) {
  if (!t || e === `latest`) {
    xM();
    return
  }
  let n = Co(e);
  CM(`features`, n.useFeatureCache ? `pending` : `stale`, n.useFeatureCache ? `features` : `will recompute`),
    CM(`pairPlan`, n.usePairPlanCache ? `pending` : `stale`, n.usePairPlanCache ? `pair plan` : `will recompute`),
    CM(`matches`, n.useDescriptorMatchCache ? `pending` : `stale`, n.useDescriptorMatchCache ? `matches` : `will recompute`),
    CM(`geometry`, e === `verification` ? `stale` : `pending`, e === `verification` ? `will rerun` : `geometry`)
}
function CM(e, t, n) {
  let r = MT[e];
  r.classList.remove(`pending`, `active`, `cached`, `stale`, `done`),
    r.classList.add(t),
    r.textContent = wo(t),
    r.title = n,
    r.setAttribute(`aria-label`, `${wo(t)}: ${n}`),
    pD()
}
function wM(e) {
  e.startsWith(`Matching `) || e.startsWith(`View graph candidates`) ? X(`matching`, `active`, e.startsWith(`Matching `) ? `Matching descriptors` : `Planning pairs`) : e.startsWith(`Matched `) || e.startsWith(`Verified `) ? (e.startsWith(`Verified `) && CM(`geometry`, `active`, `verifying pairs`),
    X(`matching`, `done`, e.startsWith(`Verified `) ? e : `Descriptor matches ready`)) : e.startsWith(`Initial pair`) || e.startsWith(`Registered `) || e.startsWith(`Mapper:`) ? (CM(`geometry`, `active`, `mapping cameras`),
      X(`mapping`, `active`, e.startsWith(`Mapper:`) ? e.replace(`Mapper: `, ``) : `Registering cameras`)) : e.startsWith(`Bundle adjusted`) || e.startsWith(`Second-pass BA`) ? (CM(`geometry`, `active`, `bundle adjustment`),
        X(`bundle`, `active`, `Optimising cameras`)) : e.startsWith(`Done:`) ? (X(`mapping`, `done`, e.replace(`Done: `, ``)),
          X(`exports`, `done`, `Ready`)) : e.startsWith(`Diagnostics:`) && !e.includes(`no major`) && X(`exports`, `warn`, `Review diagnostics`)
}
function Z() {
  return globalThis.performance?.now?.() ?? Date.now()
}
function TM(e) {
  return e < 1e3 ? `${Math.round(e)} ms` : `${(e / 1e3).toFixed(1)} s`
}
function EM(e) {
  if (e < 1024)
    return `${e} B`;
  let t = e / 1024;
  if (t < 1024)
    return `${t.toFixed(1)} KiB`;
  let n = t / 1024;
  return n < 1024 ? `${n.toFixed(1)} MiB` : `${(n / 1024).toFixed(2)} GiB`
}
function DM(e, t) {
  OM(e, new Blob([t], {
    type: `text/plain;charset=utf-8`
  }))
}
function OM(e, t) {
  let n = URL.createObjectURL(t)
    , r = document.createElement(`a`);
  r.href = n,
    r.download = e,
    document.body.appendChild(r),
    r.click(),
    r.remove(),
    setTimeout(() => URL.revokeObjectURL(n), 1e3)
}
function kM(e, t) {
  return Array.isArray(e.pairs) && e.pairs.every(e => Number.isInteger(e.i) && Number.isInteger(e.j) && e.i >= 0 && e.j > e.i && e.j < t)
}
function AM(e, t, n = []) {
  let r = new Set(n.map(e => Ui(e.leftIndex, e.rightIndex)));
  return e.pairs.filter(e => !r.has(Ui(e.i, e.j)) && t[e.i]?.count >= 8 && t[e.j]?.count >= 8).map(e => ({
    i: e.i,
    j: e.j
  }))
}
function jM(e, t) {
  if (e.runnablePairs.length !== t.length || e.matches.length !== t.length)
    return !1;
  for (let n = 0; n < t.length; n++)
    if (e.runnablePairs[n].i !== t[n].i || e.runnablePairs[n].j !== t[n].j)
      return !1;
  return !0
}
function MM(e, t) {
  return e.schemaVersion === 1 && Array.isArray(e.pairs) && e.pairs.every(e => Number.isInteger(e.i) && Number.isInteger(e.j) && e.i >= 0 && e.j > e.i && e.j < t && Number.isInteger(e.count) && e.count >= 0 && e.triples instanceof Uint32Array && e.triples.length === e.count * 3)
}
async function NM(e, t, n, r, i, a = LT) {
  if (r?.aborted)
    throw new DOMException(`Reconstruction aborted`, `AbortError`);
  let o = {}
    , s = n.gpuMode ?? `auto`
    , c = s === `cpu`
    , l = s !== `cpu` && s !== `conservative`
    , u = c ? null : await Tr()
    , d = u?.lost ? null : u;
  if (r?.aborted)
    throw new DOMException(`Reconstruction aborted`, `AbortError`);
  let f = d && l ? await pb.create(d) : null
    , p = await Jb()
    , m = f || p ? new Kb({
      webGpu: f,
      wasm: p
    }) : null
    , h = d && !c ? await Tb.create(s, d) : null
    , g = h ? null : await Qb()
    , _ = h ?? g;
  if (r?.aborted)
    throw new DOMException(`Reconstruction aborted`, `AbortError`);
  f && p ? Y(`Geometry scoring: WebGPU default with Wasm SIMD fallback`) : f && n.relativePoseSolver === `eight-point` ? Y(`WebGPU: batched epipolar inlier scoring enabled`) : f ? Y(`WebGPU: epipolar scorer available for 5-point hybrid verification`) : p && Y(`Wasm: SIMD epipolar inlier scoring enabled`),
    h ? Y(`WebGPU: BRIEF descriptor matching enabled`) : g && Y(`Wasm: SIMD BRIEF descriptor matching enabled`);
  let v, y;
  if (i && V) {
    let r = _?.supportsBatch === !0
      , c = j_({
        canBatchMatch: r,
        gpuMode: s
      })
      , l = f_(i.featureKey, i.mapperConfigHash, c);
    if (y = l,
      i.usePairPlanCache)
      try {
        let n = Z()
          , r = await V.getArtifact(i.projectId, l);
        r?.payload.schemaVersion === 1 && kM(r.payload.plan, e.length) && (v = w_(r.payload.plan),
          Y(`Loaded cached pair candidate plan (${r.payload.pairCount.toLocaleString()} pairs, strategy=${v.effectiveStrategy})`),
          o.pairPlanDurationMs = Z() - n,
          CM(`pairPlan`, `cached`, `loaded from cache`),
          J(`pair-plan`, {
            state: `cached`,
            summary: `${r.payload.pairCount.toLocaleString()} candidate pairs loaded from cache`,
            artifactKey: l,
            durationMs: o.pairPlanDurationMs,
            metrics: {
              pairs: r.payload.pairCount,
              images: e.length,
              strategy: v.effectiveStrategy
            }
          }),
          EE = v,
          HM(e, t, EE, TE, null, a))
      } catch (e) {
        Y(`Persistent pair-plan cache unavailable: ${e instanceof Error ? e.message : String(e)}`)
      }
    if (!v) {
      CM(`pairPlan`, `active`, i.usePairPlanCache ? `planning` : `forced recompute`);
      let s = Z();
      v = Vc(e, t, xc(n), r);
      let c = T_(v)
        , u = Uj(c);
      o.pairPlanDurationMs = Z() - s;
      try {
        if (await V.putArtifact({
          projectId: i.projectId,
          key: l,
          stepId: `pair-plan`,
          schemaVersion: c.schemaVersion,
          configHash: i.mapperConfigHash,
          upstreamKeys: [i.featureKey],
          byteSize: u,
          payload: c
        }),
          Y(`Stored pair candidate plan in browser cache (${c.pairCount.toLocaleString()} pairs, ${EM(u)})`),
          CM(`pairPlan`, `cached`, `stored`),
          J(`pair-plan`, {
            state: `cached`,
            summary: `${c.pairCount.toLocaleString()} candidate pairs stored`,
            artifactKey: l,
            durationMs: o.pairPlanDurationMs,
            metrics: {
              pairs: c.pairCount,
              images: e.length,
              strategy: v.effectiveStrategy
            }
          }),
          EE = v,
          HM(e, t, EE, TE, null, a),
          qj(),
          i.pauseAfterStore)
          throw X(`matching`, `done`, `${c.pairCount.toLocaleString()} candidate pairs cached`),
          new Kj(`Step mode paused after pair planning. Adjust matcher thresholds or geometry settings, then press Run next to continue from the cached pair plan.`, `Pair plan cached`, .54)
      } catch (e) {
        if (e instanceof Kj)
          throw e;
        Y(`Could not store pair candidate plan: ${e instanceof Error ? e.message : String(e)}`)
      }
    }
  }
  v && (EE = v,
    HM(e, t, EE, TE, null, a));
  let b, x;
  if (i && V && v && y) {
    let r = j_({
      hammingMax: n.matcherHammingMax ?? 96,
      ratio: n.matcherRatio ?? .88
    })
      , s = p_(y, r)
      , c = AM(v, t, n.manualPairs ?? []);
    if (i.useDescriptorMatchCache)
      try {
        let n = Z()
          , r = await V.getArtifact(i.projectId, s);
        if (r?.payload && MM(r.payload, e.length)) {
          let i = D_(r.payload.pairs)
            , l = {
              runnablePairs: i.pairs,
              matches: i.matches
            };
          jM(l, c) && (b = l,
            TE = l,
            Y(`Loaded cached descriptor matches (${r.payload.matchCount.toLocaleString()} matches across ${r.payload.pairCount.toLocaleString()} runnable pairs)`),
            o.matchingDurationMs = Z() - n,
            CM(`matches`, `cached`, `loaded from cache`),
            J(`matches`, {
              state: `cached`,
              summary: `${r.payload.matchCount.toLocaleString()} matches across ${r.payload.pairCount.toLocaleString()} candidate pairs loaded from cache`,
              artifactKey: s,
              durationMs: o.matchingDurationMs,
              metrics: {
                matches: r.payload.matchCount,
                pairs: r.payload.pairCount
              }
            }),
            HM(e, t, EE, TE, null, a))
        }
      } catch (e) {
        Y(`Persistent descriptor-match cache unavailable: ${e instanceof Error ? e.message : String(e)}`)
      }
    b || (CM(`matches`, `active`, i.useDescriptorMatchCache ? `matching` : `forced recompute`),
      x = async n => {
        let c = Z();
        b = n,
          TE = n;
        let l = O_(n.runnablePairs, n.matches)
          , u = Wj(l);
        try {
          if (await V.putArtifact({
            projectId: i.projectId,
            key: s,
            stepId: `matching`,
            schemaVersion: l.schemaVersion,
            configHash: r,
            upstreamKeys: [y],
            byteSize: u,
            payload: l
          }),
            Y(`Stored descriptor matches in browser cache (${l.matchCount.toLocaleString()} matches, ${EM(u)})`),
            CM(`matches`, `cached`, `stored`),
            J(`matches`, {
              state: `cached`,
              summary: `${l.matchCount.toLocaleString()} matches across ${l.pairCount.toLocaleString()} candidate pairs stored`,
              artifactKey: s,
              durationMs: o.matchingDurationMs ?? Z() - c,
              metrics: {
                matches: l.matchCount,
                pairs: l.pairCount
              }
            }),
            HM(e, t, EE, TE, null, a),
            qj(),
            i.pauseAfterStore)
            throw X(`matching`, `done`, `${l.matchCount.toLocaleString()} descriptor matches cached`),
            new Kj(`Step mode paused after descriptor matching. Adjust epipolar, PnP, or bundle settings, then press Run next to continue from cached matches.`, `Matches cached`, .64)
        } catch (e) {
          if (e instanceof Kj)
            throw e;
          Y(`Could not store descriptor matches: ${e instanceof Error ? e.message : String(e)}`)
        }
      }
    )
  }
  J(`geometry`, {
    state: `running`,
    summary: `Verifying pairs and registering cameras`,
    metrics: {
      mapper: n.mapper ?? `graph-pnp`
    }
  });
  let S = Z()
    , C = S
    , w = null
    , T = null
    , E = null
    , D = e => Number(e?.replace(/,/g, ``) ?? 0) || 0
    , O = e => {
      let t = Z()
        , r = /^View graph candidates: ([\d,]+) pairs from ([\d,]+) images \(([^)]*)\)/.exec(e);
      if (r) {
        let e = D(r[1])
          , i = D(r[2])
          , a = r[3]?.match(/strategy=([^,\s)]+)/)?.[1] ?? n.pairStrategy ?? `retrieval`;
        o.pairPlanDurationMs === void 0 && q?.stages[`pair-plan`]?.state !== `cached` && (o.pairPlanDurationMs = t - C,
          J(`pair-plan`, {
            state: `done`,
            summary: `${e.toLocaleString()} candidate pairs planned`,
            durationMs: o.pairPlanDurationMs,
            metrics: ND(`pair-plan`, {
              pairs: e,
              images: i,
              strategy: a
            })
          }));
        return
      }
      let i = /^Matching ([\d,]+) candidate pairs \(([^)]+)\)/.exec(e);
      if (i) {
        let e = D(i[1]);
        w = t,
          J(`matches`, {
            state: `running`,
            summary: `Matching ${e.toLocaleString()} candidate pairs`,
            metrics: ND(`matches`, {
              pairs: e,
              matcher: i[2] ?? `unknown`
            })
          });
        return
      }
      let a = /^Loaded cached descriptor matches for ([\d,]+)(?: \/ ([\d,]+))? runnable candidate pair/.exec(e);
      if (a) {
        T = t;
        let e = D(a[1])
          , n = D(a[2]) || e
          , r = q?.stages.matches;
        J(`matches`, {
          state: r?.state === `cached` ? `cached` : `done`,
          summary: r?.summary ?? `${e.toLocaleString()} cached descriptor pair${e === 1 ? `` : `s`} ready`,
          artifactKey: r?.artifactKey,
          durationMs: r?.durationMs ?? o.matchingDurationMs,
          metrics: ND(`matches`, {
            pairs: n,
            cachedPairs: e
          })
        });
        return
      }
      let s = /^Matched ([\d,]+) candidate pairs in /.exec(e);
      if (s) {
        let e = D(s[1]);
        w !== null && (o.matchingDurationMs = t - w),
          T = t;
        let n = q?.stages.matches;
        J(`matches`, {
          state: n?.state === `cached` ? `cached` : `done`,
          summary: n?.summary ?? `${e.toLocaleString()} candidate pairs matched`,
          artifactKey: n?.artifactKey,
          durationMs: n?.durationMs ?? o.matchingDurationMs,
          metrics: ND(`matches`, {
            pairs: e
          })
        });
        return
      }
      let c = /^Mapper: ([\d,]+)\/([\d,]+) cameras registered, ([\d,]+) component(?:s)?, ([\d,]+) seed points/.exec(e);
      if (c && E === null) {
        T ??= S,
          o.geometryDurationMs ??= t - T,
          E = t,
          J(`geometry`, {
            state: `running`,
            summary: `${D(c[1])}/${D(c[2])} cameras registered before bundle`,
            durationMs: o.geometryDurationMs,
            metrics: ND(`geometry`, {
              mapper: n.mapper ?? `graph-pnp`,
              registered: D(c[1]),
              images: D(c[2]),
              components: D(c[3]),
              seedPoints: D(c[4])
            })
          }),
          J(`bundle`, {
            state: `running`,
            summary: `Triangulating tracks and bundle adjusting`,
            metrics: ND(`bundle`, {})
          });
        return
      }
      e.startsWith(`Merged `) && e.includes(` candidate tracks`) && E === null && (E = t,
        T ??= S,
        o.geometryDurationMs ??= t - T,
        J(`bundle`, {
          state: `running`,
          summary: `Triangulating tracks and bundle adjusting`,
          metrics: ND(`bundle`, {})
        }))
    }
    , k = await Ld(e, t, n, m, _, e => {
      if (r?.aborted)
        throw new DOMException(`Reconstruction aborted`, `AbortError`);
      O(e),
        Y(e)
    }
      , {
        pairCandidatePlan: v,
        descriptorMatches: b || x ? {
          precomputed: b,
          onComputed: x
        } : void 0,
        onStageEvent: e => {
          let t = Z();
          if (e.type === `pair-plan`) {
            o.pairPlanDurationMs === void 0 && q?.stages[`pair-plan`]?.state !== `cached` && (o.pairPlanDurationMs = t - C,
              J(`pair-plan`, {
                state: `done`,
                summary: `${e.pairCount.toLocaleString()} candidate pairs planned`,
                durationMs: o.pairPlanDurationMs,
                metrics: ND(`pair-plan`, {
                  pairs: e.pairCount,
                  images: e.imageCount,
                  strategy: e.effectiveStrategy,
                  requestedStrategy: e.requestedStrategy,
                  ...e.reason ? {
                    reason: e.reason
                  } : {}
                })
              }));
            return
          }
          if (e.type === `matching-start`) {
            J(`matches`, {
              state: `running`,
              summary: `Matching ${e.pairCount.toLocaleString()} candidate pairs`,
              metrics: ND(`matches`, {
                pairs: e.pairCount,
                matcher: e.matcher
              })
            });
            return
          }
          if (e.type === `matching-cache-hit`) {
            e.missingPairs === 0 && (T = t);
            let n = q?.stages.matches;
            J(`matches`, {
              state: n?.state === `cached` || e.missingPairs === 0 ? n?.state === `cached` ? `cached` : `done` : `running`,
              summary: n?.summary ?? (e.missingPairs === 0 ? `${e.cachedPairs.toLocaleString()} cached descriptor pair${e.cachedPairs === 1 ? `` : `s`} ready` : `${e.cachedPairs.toLocaleString()} cached descriptor pair${e.cachedPairs === 1 ? `` : `s`}, matching ${e.missingPairs.toLocaleString()} missing`),
              artifactKey: n?.artifactKey,
              durationMs: n?.durationMs ?? o.matchingDurationMs,
              metrics: ND(`matches`, {
                pairs: e.runnablePairs,
                cachedPairs: e.cachedPairs,
                missingPairs: e.missingPairs
              })
            });
            return
          }
          if (e.type === `matching-done`) {
            o.matchingDurationMs = e.durationMs,
              T = t;
            let n = q?.stages.matches;
            J(`matches`, {
              state: n?.state === `cached` ? `cached` : `done`,
              summary: n?.summary ?? `${e.pairCount.toLocaleString()} candidate pairs matched`,
              artifactKey: n?.artifactKey,
              durationMs: n?.durationMs ?? o.matchingDurationMs,
              metrics: ND(`matches`, {
                pairs: e.pairCount,
                matcher: e.matcher
              })
            });
            return
          }
          if (e.type === `mapper-summary`) {
            T ??= S,
              o.geometryDurationMs ??= t - T,
              E = t,
              J(`geometry`, {
                state: `running`,
                summary: `${e.registeredCount}/${e.imageCount} cameras registered before bundle`,
                durationMs: o.geometryDurationMs,
                metrics: ND(`geometry`, {
                  mapper: n.mapper ?? `graph-pnp`,
                  registered: e.registeredCount,
                  images: e.imageCount,
                  components: e.componentCount,
                  seedPoints: e.seedPointCount
                })
              }),
              J(`bundle`, {
                state: `running`,
                summary: `Triangulating tracks and bundle adjusting`,
                metrics: ND(`bundle`, {})
              });
            return
          }
          e.type
        }
      });
  E !== null && (o.bundleDurationMs = Z() - E),
    T !== null && o.geometryDurationMs === void 0 && (o.geometryDurationMs = Z() - T),
    CM(`geometry`, `done`, `current result`);
  let A = m?.getAndResetStats();
  if (A && A.batches > 0) {
    o.geometryScoring = A;
    let e = [];
    (A.wasmBatches ?? 0) > 0 && e.push(`${A.wasmBatches} Wasm batch${A.wasmBatches === 1 ? `` : `es`} (${(A.wasmMatchTests ?? 0).toLocaleString()} tests)`),
      (A.webGpuBatches ?? 0) > 0 && e.push(`${A.webGpuBatches} WebGPU batch${A.webGpuBatches === 1 ? `` : `es`} (${(A.webGpuMatchTests ?? 0).toLocaleString()} tests)`),
      Y(`Geometry epipolar scoring: ${e.length > 0 ? e.join(`, `) : `${A.batches} batch${A.batches === 1 ? `` : `es`}`}; ${A.hypotheses} hypotheses, ${A.matchTests.toLocaleString()} Sampson tests total`)
  }
  let j = _?.getAndResetStats?.();
  if (j && j.batches > 0) {
    o.descriptorMatching = {
      ...j,
      label: _?.label ?? `WebGPU`
    };
    let e = Math.round(j.comparisons / j.batches)
      , t = j.maxComparisonsPerBatch ?? 0
      , n = j.compactBatches ?? 0
      , r = j.directionalBatches ?? 0
      , i = _?.label ?? `WebGPU`;
    Y(`${i} descriptor matching: ${j.batches} batches (${n} compact / ${r} directional), ${j.comparisons.toLocaleString()} descriptor comparisons (${e.toLocaleString()} avg, ${t.toLocaleString()} max / batch)`),
      ((j.descriptorGpuCopyBytes ?? 0) > 0 || (j.descriptorCpuUploadBytes ?? 0) > 0 || (j.readbackBytes ?? 0) > 0) && Y(`${i} descriptor traffic: ${EM(j.descriptorGpuCopyBytes ?? 0)} GPU-buffer copies, ${EM(j.descriptorCpuUploadBytes ?? 0)} CPU descriptor uploads, ${EM(j.readbackBytes ?? 0)} readback`)
  }
  return {
    model: k,
    telemetry: o
  }
}
function PM(e) {
  let t = V_(e.stats.diagnostics)
    , n = e.stats.diagnostics.length - t.length
    , r = t.filter(e => e.status === `ok`)
    , i = t.filter(e => e.status !== `ok`)
    , a = VM(t)
    , o = new Set(t.map(e => LM(e)))
    , s = a.filter(e => !o.has(LM(e)))
    , c = t.length > 0 ? [...t, ...s] : a
    , l = [...i, ...r.slice(0, Math.max(0, 80 - i.length))].slice(0, 80)
    , u = hw.checked ? c : l.length > 0 ? l : a.slice(0, 80);
  pw.textContent = IM(t.length > 0 ? `${i.length} weak / ${r.length} accepted${n > 0 ? `, ${n} image notes` : ``}` : `${a.length} cached descriptor pairs`, c.length, u.length),
    RM(u)
}
function FM() {
  let e = VM(K?.model ? V_(K.model.stats.diagnostics) : null)
    , t = hw.checked ? e : e.slice(0, 80)
    , n = K?.descriptorMatches?.runnablePairs.length ?? 0
    , r = K?.pairPlan?.pairs.length ?? 0
    , i = n > 0 ? `${n.toLocaleString()} cached descriptor pairs` : `${r.toLocaleString()} cached candidate pairs`;
  pw.textContent = e.length > 0 ? IM(i, e.length, t.length) : `No run yet`,
    RM(t)
}
function IM(e, t, n) {
  return t === 0 ? e : hw.checked || t <= n ? `${e}, all shown` : `${e}, ${n}/${t} shown`
}
function LM(e) {
  return `${e.leftIndex}:${e.rightIndex}`
}
function RM(e) {
  mw.innerHTML = ``;
  let t = H ?? K?.model ?? null;
  for (let n of e) {
    let e = t ? zM(t, n.leftIndex, n.rightIndex) : null
      , r = document.createElement(`button`);
    r.type = `button`,
      r.className = `diagnosticRow ${n.status}`,
      r.dataset.leftIndex = String(n.leftIndex),
      r.dataset.rightIndex = String(n.rightIndex),
      r.title = `${n.leftImage} -> ${n.rightImage}: ${n.note}${e ? `; ${BM(e, !1, n)}` : ``}`,
      r.innerHTML = `
      <span class="status">${n.status}</span>
      <span class="pair">${U_(n)}</span>
      <span class="manualGt">${e ? BM(e, !0, n) : ``}</span>
      <span class="count">${n.rawMatches}/${n.filteredMatches}/${n.inliers}</span>
    `,
      mw.appendChild(r)
  }
}
function zM(e, t, n) {
  let r = e.stats.manualPairEvaluations ?? []
    , i = Math.min(t, n)
    , a = Math.max(t, n);
  return r.find(e => Math.min(e.leftIndex, e.rightIndex) === i && Math.max(e.leftIndex, e.rightIndex) === a) ?? null
}
function BM(e, t = !1, n) {
  return aa(e, t, n)
}
function VM(e) {
  let t = K;
  return t ? B_({
    frames: t.frames,
    pairPlan: t.pairPlan,
    descriptorMatches: t.descriptorMatches,
    verifiedDiagnostics: e
  }) : []
}
function HM(e, t, n, r, i, a) {
  K = {
    frames: e,
    features: t,
    pairPlan: n,
    descriptorMatches: r,
    model: i,
    sourceFiles: a,
    masks: oO(a)
  },
    vD()
}
function UM() {
  DE++,
    _w.textContent = `Matched pair view`,
    vw.textContent = `Select a diagnostics row to inspect matches.`;
  let e = gw.getBoundingClientRect()
    , t = window.devicePixelRatio || 1
    , n = Math.max(320, Math.round((e.width || 720) * t))
    , r = Math.max(220, Math.round((e.height || 360) * t));
  gw.width = n,
    gw.height = r;
  let i = gw.getContext(`2d`);
  i && (i.fillStyle = `#0f151d`,
    i.fillRect(0, 0, n, r),
    i.fillStyle = `#95a3b2`,
    i.font = `${13 * t}px ui-sans-serif, system-ui, sans-serif`,
    i.fillText(`Select a diagnostics row to view image matches.`, 18 * t, 30 * t))
}
async function WM(e, t) {
  let n = ++DE
    , r = K;
  if (!r) {
    UM(),
      vw.textContent = `No cached pair data is available for this run.`;
    return
  }
  let i = r.frames[e]
    , a = r.frames[t]
    , o = r.sourceFiles[e]
    , s = r.sourceFiles[t];
  if (!i || !a || !o || !s) {
    UM(),
      vw.textContent = `Source images for this pair are unavailable.`;
    return
  }
  _w.textContent = `${i.name} -> ${a.name}`,
    vw.textContent = `Loading pair images...`;
  let c, l;
  try {
    [c, l] = await Promise.all([qM(o), qM(s)])
  } catch (e) {
    if (n !== DE)
      return;
    UM(),
      vw.textContent = `Could not load pair images: ${e instanceof Error ? e.message : String(e)}`;
    return
  }
  if (n !== DE)
    return;
  let u = GM(r.descriptorMatches, e, t)
    , d = KM(r.model, r.frames, e, t);
  JM({
    leftFrame: i,
    rightFrame: a,
    leftImage: c,
    rightImage: l,
    leftMask: r.masks[e] ?? null,
    rightMask: r.masks[t] ?? null,
    leftFeatures: r.features[e],
    rightFeatures: r.features[t],
    rawMatches: u,
    trackMatches: d
  });
  let f = [r.masks[e] ? `left mask` : ``, r.masks[t] ? `right mask` : ``].filter(Boolean)
    , p = r.model ? zM(r.model, e, t) : null
    , m = r.model ? r.model.stats.diagnostics.find(n => Math.min(n.leftIndex, n.rightIndex) === Math.min(e, t) && Math.max(n.leftIndex, n.rightIndex) === Math.max(e, t)) ?? null : null;
  vw.textContent = `${u.length.toLocaleString()} descriptor matches, ${d.length.toLocaleString()} shared tracks` + (f.length > 0 ? `, ${f.join(` + `)}` : ``) + (p ? `, ${BM(p, !1, m)}` : ``)
}
function GM(e, t, n) {
  if (!e)
    return [];
  let r = e.runnablePairs.findIndex(e => e.i === t && e.j === n || e.i === n && e.j === t);
  if (r < 0)
    return [];
  let i = e.runnablePairs[r]
    , a = e.matches[r] ?? [];
  return i.i === t && i.j === n ? a : a.map(e => ({
    a: e.b,
    b: e.a,
    distance: e.distance
  }))
}
function KM(e, t, n, r) {
  if (!e)
    return [];
  let i = e.images.find(e => e.id === t[n]?.id)
    , a = e.images.find(e => e.id === t[r]?.id);
  if (!i || !a)
    return [];
  let o = new Map;
  for (let e = 0; e < a.point3DIds.length; e++) {
    let t = a.point3DIds[e];
    t >= 0 && o.set(t, e)
  }
  let s = [];
  for (let e = 0; e < i.point3DIds.length; e++) {
    let t = i.point3DIds[e];
    if (t < 0)
      continue;
    let n = o.get(t);
    n !== void 0 && s.push({
      a: e,
      b: n,
      distance: 0
    })
  }
  return s
}
function qM(e) {
  return new Promise((t, n) => {
    let r = new Image
      , i = URL.createObjectURL(e);
    r.onload = () => {
      URL.revokeObjectURL(i),
        t(r)
    }
      ,
      r.onerror = () => {
        URL.revokeObjectURL(i),
          n(Error(`Could not load ${e.name}`))
      }
      ,
      r.src = i
  }
  )
}
function JM(e) {
  let t = gw.getBoundingClientRect()
    , n = window.devicePixelRatio || 1
    , r = Math.max(420, t.width || 820)
    , i = Math.max(280, t.height || 380);
  gw.width = Math.round(r * n),
    gw.height = Math.round(i * n);
  let a = gw.getContext(`2d`);
  if (!a)
    return;
  a.setTransform(n, 0, 0, n, 0, 0),
    a.clearRect(0, 0, r, i),
    a.fillStyle = `#0f151d`,
    a.fillRect(0, 0, r, i);
  let o = (r - 18) / 2
    , s = i - 34 - 30
    , c = XM(8, 34, o - 16, s, e.leftFrame)
    , l = XM(o + 18 + 8, 34, o - 16, s, e.rightFrame);
  a.drawImage(e.leftImage, c.x, c.y, c.w, c.h),
    a.drawImage(e.rightImage, l.x, l.y, l.w, l.h),
    YM(a, e.leftMask, c),
    YM(a, e.rightMask, l),
    a.fillStyle = `#e5ecf3`,
    a.font = `12px ui-sans-serif, system-ui, sans-serif`,
    a.fillText(e.leftFrame.name, c.x, 19),
    a.fillText(e.rightFrame.name, l.x, 19),
    ZM(a, e.rawMatches, e.leftFeatures, e.rightFeatures, e.leftFrame, e.rightFrame, c, l, `rgba(250, 204, 21, 0.26)`, 160),
    ZM(a, e.trackMatches, e.leftFeatures, e.rightFeatures, e.leftFrame, e.rightFrame, c, l, `rgba(85, 214, 176, 0.72)`, 220),
    a.fillStyle = `#cbd5e1`,
    a.font = `12px ui-sans-serif, system-ui, sans-serif`,
    a.fillText(`${e.rawMatches.length} descriptor matches - ${e.trackMatches.length} shared reconstructed tracks`, 12, i - 11)
}
function YM(e, t, n) {
  if (!t || !Xr(t))
    return;
  let r = document.createElement(`canvas`);
  r.width = t.width,
    r.height = t.height;
  let i = r.getContext(`2d`);
  if (!i)
    return;
  let a = i.createImageData(t.width, t.height);
  for (let e = 0; e < t.data.length; e++) {
    if (t.data[e] === 0)
      continue;
    let n = e * 4;
    a.data[n] = 255,
      a.data[n + 1] = 56,
      a.data[n + 2] = 96,
      a.data[n + 3] = 120
  }
  i.putImageData(a, 0, 0),
    e.drawImage(r, n.x, n.y, n.w, n.h)
}
function XM(e, t, n, r, i) {
  let a = Math.min(n / i.width, r / i.height)
    , o = i.width * a
    , s = i.height * a;
  return {
    x: e + (n - o) / 2,
    y: t + (r - s) / 2,
    w: o,
    h: s
  }
}
function ZM(e, t, n, r, i, a, o, s, c, l) {
  if (t.length === 0)
    return;
  e.save(),
    e.strokeStyle = c,
    e.lineWidth = 1;
  let u = Math.min(l, t.length);
  for (let c = 0; c < u; c++) {
    let l = t[Math.floor(c * t.length / u)]
      , d = QM(n, l.a, i, o)
      , f = $M(n, l.a, i, o)
      , p = QM(r, l.b, a, s)
      , m = $M(r, l.b, a, s);
    [d, f, p, m].every(Number.isFinite) && (e.beginPath(),
      e.moveTo(d, f),
      e.lineTo(p, m),
      e.stroke())
  }
  e.restore()
}
function QM(e, t, n, r) {
  return r.x + e.xs[t] / n.width * r.w
}
function $M(e, t, n, r) {
  return r.y + e.ys[t] / n.height * r.h
}
function eN(e) {
  let t = e.stats.diagnostics.filter(e => e.gap === 1)
    , n = t.filter(e => e.status === `weak`)
    , r = t.filter(e => e.status === `skipped` || e.status === `rejected`)
    , i = [];
  r.length > 0 && i.push(`Diagnostics: ${r.length} adjacent links failed. Split the sequence around the first failed pair or increase features before export.`);
  let a = Q_(e.stats.diagnostics);
  a && i.push(a);
  let o = $_(e.poses);
  o && i.push(o),
    n.length > Math.max(2, t.length * .15) && i.push(`Diagnostics: ${n.length} weak adjacent links. Full-set drift risk is high; try Dense mode or remove blurry/low-overlap frames.`),
    e.stats.longTracks < Math.max(20, e.points.length * .08) && i.push(`Diagnostics: few 3+ image tracks. More non-adjacent matching or higher feature count should improve stability.`),
    e.stats.medianReprojectionError > 5 && i.push(`Diagnostics: median reprojection error is ${e.stats.medianReprojectionError.toFixed(2)} px. Inspect weak pair rows before using this export for splatting.`);
  let s = iN(e);
  return s.degeneracy > 4.5 && i.push(`Diagnostics: raw camera path is highly elongated (${s.degeneracy.toFixed(1)}:1). Compare Raw reconstruction vs Fitted diagnostic camera view before export.`),
    i.length === 0 && i.push(`Diagnostics: no major weak-link warnings in this run.`),
    i
}
function tN(e) {
  return `left_index,right_index,gap,left_image,right_image,raw_matches,filtered_matches,inliers,status,note\n${e.stats.diagnostics.map(e => [e.leftIndex + 1, e.rightIndex + 1, e.gap, fN(e.leftImage), fN(e.rightImage), e.rawMatches, e.filteredMatches, e.inliers, e.status, fN(e.note)].join(`,`)).join(`
`)}\n`
}
function nN(e) {
  let t = rN(e);
  return `image_id,name,registered,component_id,raw_x,raw_y,raw_z,fitted_x,fitted_y,fitted_z,fit_delta,forward_x,forward_y,forward_z\n${e.poses.map((e, n) => {
    let r = t[n] ?? e.center
      , i = sN(e.R);
    return [e.imageId, fN(e.name), +!!e.registered, e.componentId, dN(e.center[0]), dN(e.center[1]), dN(e.center[2]), dN(r[0]), dN(r[1]), dN(r[2]), dN(lN(e.center, r)), dN(i[0]), dN(i[1]), dN(i[2])].join(`,`)
  }
  ).join(`
`)}\n`
}
function rN(e) {
  let t = aN(e)
    , n = oN(e, t);
  return e.poses.map(e => {
    if (!e.registered)
      return null;
    let r = sN(e.R)
      , i = [t[0] - r[0] * n, t[1] - r[1] * n, t[2] - r[2] * n]
      , a = .92;
    return [e.center[0] * (1 - a) + i[0] * a, e.center[1] * (1 - a) + i[1] * a, e.center[2] * (1 - a) + i[2] * a]
  }
  )
}
function iN(e) {
  let t = e.poses.filter(e => e.registered).map(e => e.center);
  if (t.length < 3)
    return {
      degeneracy: 0
    };
  let n = [0, 1, 2].map(e => {
    let n = t.map(t => t[e]);
    return Math.max(...n) - Math.min(...n)
  }
  ).sort((e, t) => t - e);
  return {
    degeneracy: n[0] / Math.max(1e-6, n[1])
  }
}
function aN(e) {
  if (e.points.length === 0)
    return [0, 0, 0];
  let t = e.points.map(e => e.xyz[0]).sort((e, t) => e - t)
    , n = e.points.map(e => e.xyz[1]).sort((e, t) => e - t)
    , r = e.points.map(e => e.xyz[2]).sort((e, t) => e - t);
  return [uN(t, .5), uN(n, .5), uN(r, .5)]
}
function oN(e, t) {
  let n = e.poses.filter(e => e.registered).map(e => lN(e.center, t)).sort((e, t) => e - t)
    , r = e.points.map(e => lN(e.xyz, t)).sort((e, t) => e - t)
    , i = Math.max(1, uN(r, .82))
    , a = Math.max(1, i * .45)
    , o = uN(n, .5);
  return !Number.isFinite(o) || o < a * .2 ? a : Math.max(a, Math.min(o, i * 1.6))
}
function sN(e) {
  return cN([e[6], e[7], e[8]])
}
function cN(e) {
  let t = Math.hypot(e[0], e[1], e[2]) || 1;
  return [e[0] / t, e[1] / t, e[2] / t]
}
function lN(e, t) {
  return Math.hypot(e[0] - t[0], e[1] - t[1], e[2] - t[2])
}
function uN(e, t) {
  return e.length === 0 ? 0 : e[Math.min(e.length - 1, Math.max(0, Math.floor((e.length - 1) * t)))]
}
function dN(e) {
  return Number.isFinite(e) ? Math.abs(e) >= 0x2386f26fc10000 ? e.toString() : e.toFixed(8) : ``
}
function fN(e) {
  return `"${e.replaceAll(`"`, `""`)}"`
}
function pN(e) {
  let t = globalThis.CSS?.escape;
  return t ? t(e) : e.replace(/["\\]/g, `\\$&`)
}
function Q(e) {
  let t = document.getElementById(e);
  if (!t)
    throw Error(`Missing #${e}`);
  return t
}
function $(e, t, n) {
  return Math.max(t, Math.min(n, e))
}
