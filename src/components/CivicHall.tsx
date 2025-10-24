import React, { useEffect, useMemo, useRef, useState } from "react";

// Civic Hall — SVG overhead map of PAGIs with autonomic movement and rule-based linking
// Drop into your Next.js app (e.g., app/civic/hall/page.tsx) and render <CivicHall />
// No external libs. Fully scalable via SVG viewBox.

export type Topic = {
  key: string;
  color: string; // any CSS color
  label: string;
};

export type PagiNode = {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  intent: [number, number]; // 2D intent direction (unit-ish)
  openness: number; // 0..1 readiness to connect
  capacity: number; // max simultaneous links
  links: string[]; // current link partner ids
  memory: number; // 0..1 fill; grows with sustained links
  mood: number; // -1..1 (color tint)
};

export type Link = {
  id: string;
  a: string; // node id
  b: string; // node id
  age: number; // seconds
  ttl: number; // seconds
};

type Size = { w: number; h: number };

const DEFAULT_TOPICS: Topic[] = [
  { key: "open_models", color: "#60a5fa", label: "Open Models" },
  { key: "privacy", color: "#f59e0b", label: "Privacy" },
  { key: "safety", color: "#ef4444", label: "Safety" },
  { key: "education", color: "#10b981", label: "Education" },
  { key: "governance", color: "#a78bfa", label: "Governance" },
];

const RNG = (seed: number) => () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32;

function clamp(v: number, a = 0, b = 1) { return Math.max(a, Math.min(b, v)); }
function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }
function dist(ax: number, ay: number, bx: number, by: number) {
  const dx = ax - bx, dy = ay - by;
  return Math.hypot(dx, dy);
}
function norm2(x: number, y: number) {
  const m = Math.hypot(x, y) || 1;
  return [x / m, y / m] as [number, number];
}

function useAnimationFrame(cb: (dt: number) => void) {
  const ref = useRef<number | null>(null);
  const last = useRef<number>(performance.now());
  useEffect(() => {
    const loop = (t: number) => {
      const dt = (t - last.current) / 1000;
      last.current = t;
      cb(dt);
      ref.current = requestAnimationFrame(loop);
    };
    ref.current = requestAnimationFrame(loop);
    return () => { if (ref.current) cancelAnimationFrame(ref.current); };
  }, [cb]);
}

// Compute cluster centers on a ring at ~35% inset
function topicCenters(size: Size, topics: Topic[]) {
  const cx = size.w / 2, cy = size.h / 2;
  const r = Math.min(size.w, size.h) * 0.35;
  const centers: Record<string, { x: number; y: number; color: string; label: string }> = {};
  topics.forEach((t, i) => {
    const a = (i / topics.length) * Math.PI * 2 - Math.PI / 2;
    centers[t.key] = { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a), color: t.color, label: t.label };
  });
  return centers;
}

function initNodes(count: number, size: Size, seed = 42): PagiNode[] {
  const rnd = RNG(seed);
  const nodes: PagiNode[] = [];
  for (let i = 0; i < count; i++) {
    const x = lerp(size.w * 0.15, size.w * 0.85, rnd());
    const y = lerp(size.h * 0.2, size.h * 0.85, rnd());
    const [ix, iy] = norm2(rnd() - 0.5, rnd() - 0.5);
    nodes.push({
      id: `p${i}`,
      x, y,
      vx: (rnd() - 0.5) * 10,
      vy: (rnd() - 0.5) * 10,
      intent: [ix, iy],
      openness: 0.5 + 0.5 * rnd(),
      capacity: 1 + Math.floor(rnd() * 3),
      links: [],
      memory: 0,
      mood: rnd() * 2 - 1,
    });
  }
  return nodes;
}

function choose<T>(arr: T[], n: number) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, n);
}

export default function CivicHall() {
  const [size, setSize] = useState<Size>({ w: 1200, h: 800 });
  const [topics, setTopics] = useState<Topic[]>(DEFAULT_TOPICS);
  const centers = useMemo(() => topicCenters(size, topics), [size, topics]);
  const [roomIntent, setRoomIntent] = useState<string>(topics[0].key);
  const [live, setLive] = useState(false);
  const [representative, setRepresentative] = useState<any>(null);

  const [nodes, setNodes] = useState<PagiNode[]>(() => initNodes(48, size));
  const [links, setLinks] = useState<Link[]>([]);

  const viewRef = useRef<SVGSVGElement>(null);
  useEffect(() => {
    // Responsive bounds
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) {
        const cr = e.contentRect;
        setSize({ w: cr.width, h: cr.height });
      }
    });
    if (viewRef.current?.parentElement) ro.observe(viewRef.current.parentElement);
    return () => ro.disconnect();
  }, []);

  // Load topics from API on mount
  useEffect(() => {
    fetch("/api/topics/live").then(r => r.json()).then(j => {
      if (Array.isArray(j.topics) && j.topics.length) setTopics(j.topics);
      if (j.active) setRoomIntent(j.active);
    }).catch(() => { /* keep defaults */ });
  }, []);

  // Load representative when live mode enabled
  useEffect(() => {
    if (!live) return;
    (async () => {
      try {
        const rep = await fetch("/api/civic/representative").then(r => r.json());
        setRepresentative(rep);
      } catch (e) {
        console.warn("Failed to load representative:", e);
      }
    })();
  }, [live]);

  // Update first node when representative loads
  useEffect(() => {
    if (!representative || !live) return;
    setNodes(prev => {
      const next = [...prev];
      if (next.length) {
        next[0] = {
          ...next[0],
          id: representative.id || "self",
          mood: 0.2, // or derive from humanSignals later
          capacity: Math.max(2, next[0].capacity),
          openness: 0.7,
        };
      }
      return next;
    });
  }, [representative, live]);

  // Rule weights
  const ATTR_TO_INTENT = 20;     // attraction to room intent center
  const REPULSION = 700;         // node-node repulsion strength
  const EDGE_LEN = 80;           // preferred link length
  const DAMPING = 0.93;          // velocity damping per tick
  const WALL_REPEL = 400;        // keep inside

  // Main simulation
  useAnimationFrame((dt) => {
    setNodes((prev) => {
      const next = prev.map((n) => ({ ...n }));
      const c = centers[roomIntent];

      // --- Forces ---
      for (let i = 0; i < next.length; i++) {
        const a = next[i];
        // Attraction to intent center
        const dir = norm2(c.x - a.x, c.y - a.y);
        a.vx += dir[0] * ATTR_TO_INTENT * dt;
        a.vy += dir[1] * ATTR_TO_INTENT * dt;

        // Gentle drift by intent vector (personal tendency)
        a.vx += a.intent[0] * 8 * dt;
        a.vy += a.intent[1] * 8 * dt;

        // Wall repel
        a.vx += (a.x < 60 ? (60 - a.x) : a.x > size.w - 60 ? (size.w - 60 - a.x) : 0) * (dt * (WALL_REPEL / 200));
        a.vy += (a.y < 80 ? (80 - a.y) : a.y > size.h - 80 ? (size.h - 80 - a.y) : 0) * (dt * (WALL_REPEL / 200));
      }

      // Pairwise repulsion
      for (let i = 0; i < next.length; i++) {
        for (let j = i + 1; j < next.length; j++) {
          const a = next[i], b = next[j];
          const dx = a.x - b.x, dy = a.y - b.y; const d2 = dx * dx + dy * dy + 0.001;
          const f = REPULSION / d2;
          a.vx += (dx / Math.sqrt(d2)) * f * dt;
          a.vy += (dy / Math.sqrt(d2)) * f * dt;
          b.vx -= (dx / Math.sqrt(d2)) * f * dt;
          b.vy -= (dy / Math.sqrt(d2)) * f * dt;
        }
      }

      // Integrate + damping
      for (let i = 0; i < next.length; i++) {
        const a = next[i];
        a.vx *= DAMPING; a.vy *= DAMPING;
        a.x += a.vx * dt; a.y += a.vy * dt;
        a.x = clamp(a.x, 30, size.w - 30);
        a.y = clamp(a.y, 60, size.h - 30);
      }

      return next;
    });

    // Link lifecycle + formation rules
    setLinks((old) => {
      let cur = old.map((l) => ({ ...l, age: l.age + dt }));
      // Expire old links
      cur = cur.filter((l) => l.age < l.ttl);

      // Index links by node
      const byNode = new Map<string, Link[]>();
      for (const l of cur) {
        if (!byNode.has(l.a)) byNode.set(l.a, []);
        if (!byNode.has(l.b)) byNode.set(l.b, []);
        byNode.get(l.a)!.push(l); byNode.get(l.b)!.push(l);
      }

      // Update node link lists & memory growth
      setNodes((prev) => prev.map((n) => {
        const lst = byNode.get(n.id) || [];
        const engaged = lst.length;
        const memGain = engaged > 0 ? dt * 0.05 : -dt * 0.02;
        return { ...n, links: lst.map((l) => l.a === n.id ? l.b : l.a), memory: clamp(n.memory + memGain, 0, 1) };
      }));

      // Attempt new links probabilistically near intent center
      const c = centers[roomIntent];
      const candidates = choose(nodes, 12);
      for (let i = 0; i < candidates.length - 1; i++) {
        const A = candidates[i];
        const B = candidates[i + 1];
        if (!A || !B || A.id === B.id) continue;
        const near = dist(A.x, A.y, c.x, c.y) + dist(B.x, B.y, c.x, c.y) < Math.min(size.w, size.h) * 0.9;
        const availability = (A.links.length < A.capacity) && (B.links.length < B.capacity);
        const intentAlign = Math.abs(A.intent[0] * B.intent[0] + A.intent[1] * B.intent[1]); // cosine proxy (since normalized)
        const willing = (A.openness + B.openness) * 0.5;
        const p = clamp((intentAlign * 0.7 + willing * 0.3) * (near ? 1.0 : 0.6));
        if (availability && Math.random() < p * 0.03) {
          // Avoid duplicates
          const exists = cur.some((l) => (l.a === A.id && l.b === B.id) || (l.a === B.id && l.b === A.id));
          if (!exists) {
            cur.push({ id: `L${Date.now()}_${Math.random()}`, a: A.id, b: B.id, age: 0, ttl: 6 + Math.random() * 12 });
          }
        }
      }

      return cur;
    });
  });

  // Click to nudge intent vector for a node
  const onNodeClick = (id: string) => {
    setNodes((prev) => prev.map((n) => n.id === id ? { ...n, intent: norm2(Math.random() - 0.5, Math.random() - 0.5) as [number,number] } : n));
  };

  // Room top bar: global topic switcher controls the intent gravity center
  const TopBar = () => (
    <div className="absolute inset-x-0 top-0 p-3 flex items-center justify-between pointer-events-auto">
      <div className="flex gap-2 flex-wrap">
        {topics.map((t) => (
          <button
            key={t.key}
            onClick={() => setRoomIntent(t.key)}
            className={`px-3 py-1 rounded-full text-sm border ${roomIntent === t.key ? "bg-white text-black" : "bg-black/40 text-white border-white/20"}`}
            style={{ borderColor: t.color }}
          >{t.label}</button>
        ))}
      </div>
      <div className="flex items-center gap-4">
        <div className="text-xs opacity-80 text-white/80">Room Intent → <b>{topics.find(x=>x.key===roomIntent)?.label}</b></div>
        <label className="flex items-center gap-2 text-xs text-white/80">
          <input type="checkbox" checked={live} onChange={e=>setLive(e.target.checked)} />
          Live data (beta)
        </label>
      </div>
    </div>
  );

  // Legend
  const Legend = () => (
    <div className="absolute left-3 bottom-3 text-xs text-white/80 bg-black/40 px-3 py-2 rounded-lg pointer-events-none">
      <div>● PAGI (size = capacity, ring = memory)</div>
      <div>⟂ Curved line = active dialogue (ages → fades)</div>
      <div>Click a node to randomize its personal intent vector</div>
    </div>
  );

  // Compute node visual radius
  const rOf = (n: PagiNode) => 6 + 3 * n.capacity;

  const vb = `0 0 ${size.w} ${size.h}`;
  const center = centers[roomIntent];

  return (
    <div className="relative w-full h-full min-h-[480px] bg-neutral-950 rounded-xl overflow-hidden">
      <TopBar />

      <svg ref={viewRef} viewBox={vb} preserveAspectRatio="xMidYMid meet" className="w-full h-full block">
        {/* Background grid */}
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
          </pattern>
          <filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" result="glow" />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <rect x={0} y={0} width={size.w} height={size.h} fill="url(#grid)" />

        {/* Topic centers (soft beacons) */}
        {Object.entries(centers).map(([k, c]) => (
          <g key={k} opacity={k === roomIntent ? 0.35 : 0.12}>
            <circle cx={c.x} cy={c.y} r={52} fill={c.color} filter="url(#softGlow)" />
            <text x={c.x} y={c.y - 70} textAnchor="middle" fill="white" fontSize={12} opacity={0.8}>{c.label}</text>
          </g>
        ))}

        {/* Links (curved) */}
        <g>
          {links.map((l) => {
            const A = nodes.find((n) => n.id === l.a);
            const B = nodes.find((n) => n.id === l.b);
            if (!A || !B) return null;
            const midx = (A.x + B.x) / 2;
            const midy = (A.y + B.y) / 2;
            const dx = B.y - A.y; const dy = A.x - B.x; // perpendicular for slight arc
            const k = 0.18; // curvature factor
            const cx = midx + dx * k;
            const cy = midy + dy * k;
            const ageT = clamp(l.age / l.ttl, 0, 1);
            const alpha = 0.9 * (1 - ageT);
            const path = `M ${A.x} ${A.y} Q ${cx} ${cy} ${B.x} ${B.y}`;
            return (
              <path key={l.id} d={path} stroke={`rgba(255,255,255,${alpha})`} strokeWidth={1.6} fill="none" />
            );
          })}
        </g>

        {/* Nodes */}
        {nodes.map((n, idx) => {
          const r = rOf(n);
          const hue = 200 + n.mood * 40; // slight mood tint
          const fill = `hsl(${hue} 70% 55%)`;
          const mem = n.memory; // 0..1
          const memR = r + 3 + mem * 7;
          const isFocus = dist(n.x, n.y, center.x, center.y) < Math.min(size.w, size.h) * 0.18;
          const isSelf = live && representative && idx === 0;
          return (
            <g key={n.id} style={{ cursor: "pointer" }} onClick={() => onNodeClick(n.id)}>
              {/* memory ring */}
              <circle cx={n.x} cy={n.y} r={memR} fill="none" stroke={`rgba(255,255,255,${0.15 + mem * 0.35})`} strokeDasharray="4 6" />
              {/* node core */}
              <circle cx={n.x} cy={n.y} r={r} fill={fill} stroke="white" strokeOpacity={0.25} />
              {/* openness wedge */}
              <path d={describeArc(n.x, n.y, r + 1.5, -90, -90 + 360 * n.openness)} fill="none" stroke="white" strokeOpacity={0.45} strokeWidth={1.5} />
              {/* focus highlight if near intent center */}
              {isFocus && (<circle cx={n.x} cy={n.y} r={r + 10} fill="none" stroke="rgba(255,255,255,0.18)" />)}
              {/* YOU badge for self node */}
              {isSelf && (
                <text x={n.x} y={n.y - (r + 14)} textAnchor="middle" fontSize={10} fill="#fff" opacity={0.9}>YOU</text>
              )}
            </g>
          );
        })}

        {/* Frame & title */}
        <rect x={0.5} y={0.5} width={size.w - 1} height={size.h - 1} rx={16} ry={16} stroke="rgba(255,255,255,0.12)" fill="none" />
      </svg>

      <Legend />
    </div>
  );
}

// --- SVG helper: describe an arc path (for openness wedge)
function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const a = (angleDeg - 90) * (Math.PI / 180.0);
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}
function describeArc(x: number, y: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(x, y, r, endAngle);
  const end = polarToCartesian(x, y, r, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  return ["M", start.x, start.y, "A", r, r, 0, largeArcFlag, 0, end.x, end.y].join(" ");
}
