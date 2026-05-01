/* global React */
// Sakura cursor garden + audio engine
// Exposes: <CursorGarden />, useSoundEngine()

const { useEffect, useRef, useState, useCallback } = React;

// ----------------- Audio (Web Audio piano) -----------------
// Notes: Do Re Mi Fa Sol — C5 D5 E5 F5 G5
const NOTE_FREQS = [523.25, 587.33, 659.25, 698.46, 783.99];

function useSoundEngine(externalEnabled, setExternalEnabled) {
  const ctxRef = useRef(null);
  const [internalEnabled, setInternalEnabled] = useState(false);
  // If external state is provided, use it; otherwise fall back to internal
  const useExternal = externalEnabled !== undefined;
  const enabled = useExternal ? externalEnabled : internalEnabled;
  const enabledRef = useRef(false);
  enabledRef.current = enabled;
  const lastPlay = useRef(0);
  const noteIdx = useRef(0);

  // Listen for first user gesture to unlock audio
  useEffect(() => {
    const unlock = () => {
      if (!ctxRef.current) {
        try {
          const Ctx = window.AudioContext || window.webkitAudioContext;
          ctxRef.current = new Ctx();
        } catch (e) { return; }
      }
      if (ctxRef.current && ctxRef.current.state === "suspended") {
        ctxRef.current.resume();
      }
      // First click turns sound on if the user hasn't explicitly toggled it off
      if (useExternal) {
        if (externalEnabled !== false) setExternalEnabled(true);
      } else {
        setInternalEnabled(true);
      }
    };
    const onClick = () => { unlock(); };
    window.addEventListener("click", onClick, { once: true });
    return () => window.removeEventListener("click", onClick);
  }, [useExternal, externalEnabled, setExternalEnabled]);

  const toggle = useCallback(() => {
    if (ctxRef.current && ctxRef.current.state === "suspended") {
      ctxRef.current.resume();
    }
    if (useExternal) {
      setExternalEnabled(!externalEnabled);
    } else {
      setInternalEnabled(v => !v);
    }
  }, [useExternal, externalEnabled, setExternalEnabled]);

  const playNote = useCallback(() => {
    if (!enabledRef.current) return;
    const ctx = ctxRef.current;
    if (!ctx) return;
    const now = ctx.currentTime;
    // Throttle to ~one note every 120ms
    if (now - lastPlay.current < 0.12) return;
    lastPlay.current = now;
    const f = NOTE_FREQS[noteIdx.current % NOTE_FREQS.length];
    noteIdx.current++;

    // Soft piano-like: triangle + slight detuned sine, gentle envelope
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();
    osc1.type = "triangle"; osc1.frequency.value = f;
    osc2.type = "sine";     osc2.frequency.value = f * 2.001;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.07, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.7);
    osc1.connect(gain); osc2.connect(gain); gain.connect(ctx.destination);
    osc1.start(now); osc2.start(now);
    osc1.stop(now + 0.75); osc2.stop(now + 0.75);
  }, []);

  return { enabled, toggle, playNote };
}
window.useSoundEngine = useSoundEngine;

// ----------------- Cursor + petal/star trail -----------------
function SakuraSVG({ color1, color2, dark }) {
  if (dark) {
    // 4-point sparkle star
    return (
      <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="sg" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={color1} stopOpacity="1" />
            <stop offset="100%" stopColor={color2} stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="16" cy="16" r="14" fill="url(#sg)" opacity="0.4" />
        <path d="M16 1 L17.5 14.5 L31 16 L17.5 17.5 L16 31 L14.5 17.5 L1 16 L14.5 14.5 Z"
              fill={color1} />
      </svg>
    );
  }
  // 5-petal sakura
  return (
    <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
      <g transform="translate(16,16)">
        {[0,72,144,216,288].map(a => (
          <ellipse key={a}
            cx="0" cy="-9" rx="5.5" ry="8"
            fill={color1}
            transform={`rotate(${a})`}
            opacity="0.92"
          />
        ))}
        <circle cx="0" cy="0" r="3" fill={color2} />
      </g>
    </svg>
  );
}

function CursorGarden({ theme, playNote, trailDensity = "regular", enabled = true }) {
  const [pos, setPos] = useState({ x: -100, y: -100 });
  const [hover, setHover] = useState(false);
  const [petals, setPetals] = useState([]);
  const lastDrop = useRef(0);
  const idRef = useRef(0);
  const lastMove = useRef({ x: -100, y: -100, t: 0 });

  // Distance threshold by density
  const distThresh = trailDensity === "sparse" ? 60
                   : trailDensity === "lush" ? 14
                   : 28;

  useEffect(() => {
    const onMove = (e) => {
      setPos({ x: e.clientX, y: e.clientY });

      // Hover detection — anything that's a link, button, or .project-card
      const tgt = e.target;
      const interactive =
        tgt.closest && tgt.closest("a, button, .project-card, .section-header, .modal-close, [data-hover]");
      setHover(!!interactive);

      // Drop a petal — spaced by distance
      const now = performance.now();
      const dx = e.clientX - lastMove.current.x;
      const dy = e.clientY - lastMove.current.y;
      const dist = Math.hypot(dx, dy);
      if (enabled && dist > distThresh && now - lastDrop.current > 60) {
        lastDrop.current = now;
        lastMove.current = { x: e.clientX, y: e.clientY, t: now };
        const id = idRef.current++;
        const driftX = (Math.random() - 0.5) * 80;
        const driftY = 60 + Math.random() * 80;        // falls down
        const r0 = Math.floor(Math.random() * 360);
        setPetals(p => [...p, {
          id, x: e.clientX + (Math.random() - 0.5) * 14,
          y: e.clientY + (Math.random() - 0.5) * 14,
          dx: driftX, dy: driftY, r0,
        }]);
        // remove after 3s
        setTimeout(() => {
          setPetals(p => p.filter(pt => pt.id !== id));
        }, 3000);
        playNote();
      }
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [playNote, enabled, distThresh]);

  // Hide native cursor (already done in CSS); also hide petals offscreen
  const dark = theme === "dark";
  const trailColors = dark
    ? () => {
        // Random colorful star tints
        const tints = [
          ["#FFFFFF", "#FFFFFF"],
          ["#B6FF3D", "#7BC400"],
          ["#FFC1A0", "#FF9E6B"],
          ["#B5A7FF", "#7C6BFF"],
          ["#94EAD8", "#3FB8A0"],
          ["#FFE873", "#FFD24A"],
          ["#FFB3C0", "#FF6F91"],
        ];
        return tints[Math.floor(Math.random() * tints.length)];
      }
    : () => {
        // Sakura pinks with variation
        const tints = [
          ["#FFD7DD", "#FF9EB1"],
          ["#FFB3C0", "#FF6F91"],
          ["#FFE6EC", "#FFB3C0"],
          ["#FFC1CE", "#FF8FA8"],
        ];
        return tints[Math.floor(Math.random() * tints.length)];
      };

  return (
    <>
      {/* Particle layer */}
      <div id="cursor-layer">
        {petals.map(p => {
          const [c1, c2] = trailColors();
          return (
            <div key={p.id}
                 className="trail-petal"
                 style={{
                   left: p.x, top: p.y,
                   "--dx": p.dx + "px",
                   "--dy": p.dy + "px",
                   "--r0": p.r0 + "deg",
                 }}>
              <SakuraSVG color1={c1} color2={c2} dark={dark} />
            </div>
          );
        })}
      </div>
      {/* Cursor itself — always a sakura/star at the tip */}
      <div className={"cursor-main " + (hover ? "cursor-hover" : "")}
           style={{ left: pos.x, top: pos.y }}>
        <SakuraSVG
          color1={dark ? "#B6FF3D" : "#FF6F91"}
          color2={dark ? "#FFFFFF" : "#FFD7DD"}
          dark={dark}
        />
      </div>
    </>
  );
}
window.CursorGarden = CursorGarden;
