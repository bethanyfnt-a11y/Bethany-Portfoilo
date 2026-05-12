/* global React, PROJECTS, CursorGarden, ProjectCard, ProjectModal, useSoundEngine,
          useTweaks, TweaksPanel, TweakSection, TweakToggle, TweakRadio, TweakSelect */
const { useState, useEffect, useRef } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "soundEnabled": true,
  "trailDensity": "regular",
  "showSakuraTrail": true,
  "themeOverride": "dark"
}/*EDITMODE-END*/;

// ---------- Hero background (sakura petals or stars) ----------
function HeroBackground({ theme }) {
  const dark = theme === "dark";
  const dots = useRef(null);

  useEffect(() => {
    if (!dots.current) {
      // Pre-compute random positions ONCE per theme so they don't re-shuffle each render
      dots.current = Array.from({ length: dark ? 80 : 40 }, () => ({
        x: Math.random() * 100,
        y: Math.random() * 100,
        s: Math.random() * 0.7 + 0.3,
        d: Math.random() * 4 + 2,
        delay: Math.random() * 4,
      }));
    }
  }, [dark]);
  if (!dots.current) {
    dots.current = Array.from({ length: dark ? 80 : 40 }, () => ({
      x: Math.random() * 100, y: Math.random() * 100,
      s: Math.random() * 0.7 + 0.3, d: Math.random() * 4 + 2,
      delay: Math.random() * 4,
    }));
  }

  return (
    <div className="hero-bg">
      {dots.current.map((d, i) => (
        <div key={i}
             className={dark ? "star-bg" : "blossom-bg"}
             style={{
               left: d.x + "%", top: d.y + "%",
               width: (dark ? 3 : 16) * d.s + "px",
               height: (dark ? 3 : 16) * d.s + "px",
               background: dark
                 ? ["#FFFFFF", "#B6FF3D", "#FFC1A0", "#B5A7FF", "#94EAD8"][i % 5]
                 : ["#FFD7DD", "#FFB3C0", "#FFE6EC"][i % 3],
               boxShadow: dark
                 ? `0 0 ${6*d.s}px currentColor`
                 : "none",
               animation: `twinkle ${d.d}s ease-in-out ${d.delay}s infinite`,
               opacity: dark ? 0.8 : 0.6,
             }} />
      ))}
      <style>{`
        @keyframes twinkle {
          0%,100% { transform: scale(1); opacity: 0.4; }
          50% { transform: scale(1.4); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// ---------- Section that folds ----------
function FoldSection({ id, title, count, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section id={id} className={"section " + (open ? "" : "collapsed")}>
      <div className="section-header" onClick={() => setOpen(o => !o)} data-hover>
        <h2>{title}</h2>
        {count && <div className="count">{count}</div>}
        <div className="toggle">
          <span>{open ? "Collapse" : "Expand"}</span>
          <span className="chev">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </span>
        </div>
      </div>
      <div className="section-body">
        {children}
      </div>
    </section>
  );
}

// ---------- Header / Nav ----------
function Nav({ onNav, theme, setTheme }) {
  return (
    <nav className="nav">
      <a className="nav-mark" href="#top" onClick={(e) => { e.preventDefault(); onNav("top"); }} data-hover>
        <span className="star"></span>
        Bethany Fung
      </a>
      <div className="nav-links">
        <a href="#work" onClick={(e) => { e.preventDefault(); onNav("work"); }} data-hover>Work</a>
        <a href="#about" onClick={(e) => { e.preventDefault(); onNav("about"); }} data-hover>About</a>
        <a href="#contact" onClick={(e) => { e.preventDefault(); onNav("contact"); }} data-hover>Contact</a>
      </div>
      <div className="nav-tools">
        <button className="tool-btn" data-hover
                onClick={() => setTheme(t => t === "dark" ? "light" : "dark")}
                aria-label="toggle theme">
          {theme === "dark"
            ? <svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="4" fill="currentColor"/><g stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="2" x2="12" y2="5"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="2" y1="12" x2="5" y2="12"/><line x1="19" y1="12" x2="22" y2="12"/><line x1="4.6" y1="4.6" x2="6.7" y2="6.7"/><line x1="17.3" y1="17.3" x2="19.4" y2="19.4"/><line x1="4.6" y1="19.4" x2="6.7" y2="17.3"/><line x1="17.3" y1="6.7" x2="19.4" y2="4.6"/></g></svg>
            : <svg viewBox="0 0 24 24" fill="currentColor"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>
          }
        </button>
      </div>
    </nav>
  );
}

// ---------- Loader ----------
function Loader({ done }) {
  return (
    <div id="loader" className={done ? "gone" : ""}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <img src="assets/icon.png" alt="" className="loader-mark"
             style={{ filter: "hue-rotate(15deg) saturate(1.4) brightness(0.5)" }} />
        <div className="loader-bar"></div>
        <div style={{
          marginTop: 18, fontFamily: "var(--font-mono)", fontSize: 11,
          letterSpacing: "0.3em", textTransform: "uppercase",
          color: "var(--ink-mute)"
        }}>
          A garden of ideas, blooming…
        </div>
      </div>
    </div>
  );
}

// ---------- App ----------
function App() {
  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [systemTheme, setSystemTheme] = useState(() => {
    if (typeof window === "undefined") return "light";
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });
  const theme = tweaks.themeOverride === "auto" ? systemTheme : tweaks.themeOverride;
  const setTheme = (next) => {
    const v = typeof next === "function" ? next(theme) : next;
    setTweak("themeOverride", v);
  };
  const [openProject, setOpenProject] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [easter, setEaster] = useState(false);
  const { enabled: soundOn, toggle: toggleSound, playNote } = useSoundEngine(
    tweaks.soundEnabled,
    (v) => setTweak("soundEnabled", v)
  );

  // Apply theme to root
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  // Loader timing
  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 1600);
    return () => clearTimeout(t);
  }, []);

  // Easter egg — type 'sakura'
  useEffect(() => {
    let buf = "";
    const onKey = (e) => {
      if (e.key.length === 1) {
        buf = (buf + e.key.toLowerCase()).slice(-10);
        if (buf.includes("sakura") || buf.includes("bethany")) {
          setEaster(true);
          setTimeout(() => setEaster(false), 4000);
          buf = "";
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const onNav = (id) => {
    if (id === "top") { window.scrollTo({ top: 0, behavior: "smooth" }); return; }
    const el = document.getElementById(id);
    if (el) {
      const y = el.getBoundingClientRect().top + window.pageYOffset - 80;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  return (
    <>
      <Loader done={loaded} />
      <CursorGarden theme={theme}
                    playNote={tweaks.showSakuraTrail ? playNote : () => {}}
                    trailDensity={tweaks.trailDensity}
                    enabled={tweaks.showSakuraTrail} />
      <Nav onNav={onNav} theme={theme} setTheme={setTheme} />

      <main id="top">
        {/* Hero */}
        <section className="hero">
          <HeroBackground theme={theme} />
          <div className="hero-inner">
            <div className="hero-eyebrow">Portfolio · 2022—2025</div>
            <div className="hero-name">
              <img src="assets/name.png" alt="Bethany Fung" />
            </div>
            <p className="hero-tag">
              Graphic designer telling stories through<br/>
              brand, editorial &amp; experimental type.
            </p>
            <div className="hero-meta">
              <div>Based in<span>Toronto, ON</span></div>
              <div>From<span>Hong Kong</span></div>
              <div>Available<span>Freelance / FT 2026</span></div>
            </div>
          </div>
          <div className="scroll-hint">
            <span>Scroll</span>
            <span className="line"></span>
          </div>
        </section>

        {/* Work */}
        <FoldSection id="work" title={<><em>Selected</em> Work</>} count={`${PROJECTS.length} Projects · 2023—2025`}>
          <div className="project-grid">
            {PROJECTS.map(p => (
              <ProjectCard key={p.id} project={p} onOpen={setOpenProject} theme={theme} />
            ))}
          </div>
        </FoldSection>

        {/* About */}
        <FoldSection id="about" title={<><em>About</em> Me</>} count="Hello!">
          <div className="about-grid">
            <div className="about-portrait">
  <img 
    src="assets/about-me_Portfolio.png" 
    alt="Bethany Fung portrait"
    style={{ width: "100%", height: "100%", objectFit: "contain", borderRadius: "16px" }}
  />
</div>
            <div className="about-text">
              <p>
                Hello, I'm Bethany — a graphic designer from Hong Kong, now based in Toronto since 2022.
              </p>
              <p>
                I'm passionate about design that tells a story and sparks connection. Inspired by
                everyday moments and pop culture — especially the bold visuals of K-pop — I bring a
                unique eye for detail and emotional sensitivity to my work.
              </p>
              <p>
                In my free time, I love discovering new cafés, exploring the city, and going to
                concerts. I'm excited to keep growing as a designer and turn my passion into a
                meaningful creative career.
              </p>
              <div className="about-tags">
                <span>Brand Identity</span><span>Editorial</span><span>Packaging</span>
                <span>Type Design</span><span>Posters</span><span>Illustration</span>
                <span>Bilingual Cantonese/EN</span>
              </div>
            </div>
          </div>
        </FoldSection>

        {/* Contact */}
        <FoldSection id="contact" title={<><em>Let's</em> Talk</>} count="Open to work">
          <div className="contact-block">
            <div className="contact-big">
              <a href="mailto:bethanyfnt@gmail.com" data-hover>
                bethanyfnt<br/>@gmail.com
              </a>
            </div>
            <div className="contact-list">
              <a href="https://www.linkedin.com/in/bethany-fung-34259a26b/" target="_blank" rel="noopener" data-hover>
                <span>LinkedIn</span><span>↗</span>
              </a>
              <a href="https://www.instagram.com/bybethany.design/" target="_blank" rel="noopener" data-hover>
                <span>Instagram · @bybethany.design</span><span>↗</span>
              </a>
              <a href="mailto:bethanyfnt@gmail.com" data-hover>
                <span>Email</span><span>↗</span>
              </a>
            </div>
          </div>
        </FoldSection>

        <footer className="foot">
          <div>© 2026 Bethany Fung · Designed &amp; built with care</div>
          <div>Try typing <span style={{color:"var(--accent)"}}>SAKURA</span> ✿</div>
        </footer>
      </main>

      <ProjectModal project={openProject} onClose={() => setOpenProject(null)} />

      {/* Sound pill */}
      <div className={"sound-pill " + (soundOn ? "" : "muted")}
           onClick={toggleSound} data-hover style={{ cursor: "none" }}>
        <span className="dot"></span>
        <span>{soundOn ? "Sound On · Do Re Mi" : "Sound Off"}</span>
      </div>

      {/* Easter */}
      <div className={"easter " + (easter ? "show" : "")}>
        <div className="easter-card">
          ✿ thanks for finding me ✿
          <small>— Bethany</small>
        </div>
      </div>

      <TweaksPanel title="Tweaks">
        <TweakSection label="Sound" />
        <TweakToggle label="Piano notes (Do Re Mi)"
                     value={tweaks.soundEnabled}
                     onChange={(v) => setTweak("soundEnabled", v)} />

        <TweakSection label="Cursor garden" />
        <TweakToggle label="Show sakura trail"
                     value={tweaks.showSakuraTrail}
                     onChange={(v) => setTweak("showSakuraTrail", v)} />
        <TweakRadio  label="Trail density"
                     value={tweaks.trailDensity}
                     options={["sparse", "regular", "lush"]}
                     onChange={(v) => setTweak("trailDensity", v)} />

        <TweakSection label="Theme" />
        <TweakRadio  label="Mode"
                     value={tweaks.themeOverride}
                     options={["auto", "light", "dark"]}
                     onChange={(v) => setTweak("themeOverride", v)} />
      </TweaksPanel>
    </>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
