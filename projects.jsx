/* global React, PROJECTS */
const { useEffect, useState, useRef } = React;

function ProjectPlaceholder({ project }) {
  return (
    <div className="ph" style={{ "--ph-color": project.color, color: project.accent }}>
      <svg viewBox="0 0 400 500" preserveAspectRatio="xMidYMid slice"
        style={{ position: "relative", inset: 0, width: "100%", height: "100%" }}>
        <defs>
          <pattern id={`p-${project.id}`} width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M0 40 L40 0" stroke={project.accent} strokeWidth="0.6" opacity="0.3" />
          </pattern>
        </defs>
        <rect width="400" height="500" fill={project.color} />
        <rect width="400" height="500" fill={`url(#p-${project.id})`} />
        <text x="50%" y="52%" textAnchor="middle" fontFamily="Instrument Serif, serif"
          fontSize="220" fontStyle="italic" fill={project.accent} opacity="0.9">{project.no}</text>
        <text x="50%" y="92%" textAnchor="middle" fontFamily="JetBrains Mono, monospace"
          fontSize="14" letterSpacing="2" fill={project.accent} opacity="0.85">{project.title.toUpperCase()}</text>
      </svg>
    </div>
  );
}

function ProjectCard({ project, onOpen, theme }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const onMove = (e) => {
      const rect = el.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      el.style.transform = `perspective(900px) rotateX(${(-y * 6).toFixed(2)}deg) rotateY(${(x * 8).toFixed(2)}deg)`;
    };
    const onLeave = () => { el.style.transform = ""; };
    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
    return () => { el.removeEventListener("mousemove", onMove); el.removeEventListener("mouseleave", onLeave); };
  }, []);

  const innerRef = useRef(null);
  useEffect(() => {
    const inner = innerRef.current; if (!inner) return;
    const onScroll = () => {
      const r = inner.getBoundingClientRect();
      const center = r.top + r.height / 2 - window.innerHeight / 2;
      const t = Math.max(-1, Math.min(1, center / (window.innerHeight / 2)));
      inner.style.transform = `translateY(${(t * -18).toFixed(1)}px) scale(1.04)`;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div ref={ref} className={"project-card " + project.span} onClick={() => onOpen(project)}>
      <div className={"thumb " + project.aspect}
        style={project.images && project.images.hero ? { background: project.color } : undefined}>
        <div ref={innerRef} className="thumb-inner">
          {project.images && project.images.hero
            ? <img src={project.images.hero} alt={project.title}
                style={{ width: "100%", height: "100%", objectFit: "contain" }} />
            : <ProjectPlaceholder project={project} />}
        </div>
        <div className="arrow">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M5 19L19 5M19 5H8M19 5V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
      </div>
      <div className="project-meta">
        <div>
          <div className="title">{project.title}</div>
          <div style={{ marginTop: 4, fontFamily: "var(--font-mono)", fontSize: 11 }}>{project.subtitle}</div>
        </div>
        <div>{project.no} · {project.year}</div>
      </div>
    </div>
  );
}
window.ProjectCard = ProjectCard;

// ---- Project modal — lightbox is handled by App via onLightbox prop ----
function ProjectModal({ project, onClose, onLightbox }) {
  useEffect(() => {
    if (!project) return;
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [project, onClose]);

  const galleryImages = project && project.images && project.images.gallery
    ? project.images.gallery : [];

  return (
    <div className={"modal-root " + (project ? "open" : "")}>
      {project && <button className="modal-close" onClick={onClose} data-hover>Close</button>}
      <div className="modal-curtain">
        {project &&
          <div className="modal-content">
            <div className="modal-hero">
              <div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--ink-mute)", marginBottom: 18 }}>
                  Project {project.no} / {project.year}
                </div>
                <div className="meta">
                  <div>Role<strong>{project.role}</strong></div>
                  <div>Year<strong>{project.year}</strong></div>
                  {project.deliverables &&
                    <div style={{ gridColumn: "1 / -1" }}>Deliverables<strong>{project.deliverables.join(" · ")}</strong></div>
                  }
                </div>
              </div>
              <div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--ink-mute)", marginBottom: 12 }}>{project.subtitle}</div>
                <h1>{project.title}</h1>
                {project.awards &&
                  <div style={{ marginTop: 24, display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {project.awards.map((a) =>
                      <span key={a} style={{ padding: "8px 14px", border: "1px solid var(--accent)", color: "var(--accent)", borderRadius: 999, fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase" }}>★ {a}</span>
                    )}
                  </div>
                }
              </div>
            </div>

            <div className="modal-overview">
              <div className="lbl">Overview</div>
              <p style={{ fontFamily: "\"Instrument Sans\"", fontSize: "20px" }}>{project.desc}</p>
            </div>
            <div className="modal-overview">
              <div className="lbl">Challenge</div>
              <p style={{ fontStyle: "italic", fontSize: "20px", fontFamily: "\"Instrument Sans\"" }}>"{project.challenge}"</p>
            </div>

            <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--ink-mute)", marginBottom: 24 }}>Selected Visuals</div>

            {project.video &&
              <div style={{ marginBottom: 40 }}>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--ink-mute)", marginBottom: 14 }}>Brand video</div>
                <div style={{ position: "relative", paddingTop: "56.25%", background: project.color, borderRadius: "var(--radius)", overflow: "hidden", boxShadow: "var(--shadow-md)" }}>
                  <iframe
                    src={(() => { const m = project.video.match(/(?:v=|youtu\.be\/)([\w-]+)/); const id = m ? m[1] : ""; return `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1`; })()}
                    title={`${project.title} brand video`} frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: 0 }} />
                </div>
                <a href={project.video} target="_blank" rel="noopener" data-hover style={{ display: "inline-block", marginTop: 12, fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--ink-mute)" }}>Watch on YouTube ↗</a>
              </div>
            }

            <div className="modal-gallery">
              {galleryImages.length > 0
                ? galleryImages.map((g, i) =>
                    <div key={i} className="gph" style={{ gridColumn: `span ${g.span || 6}` }}>
                      <div
                        onClick={() => onLightbox(galleryImages, i)}
                        style={{ background: project.color, borderRadius: "var(--radius)", overflow: "hidden", position: "relative", cursor: "zoom-in", ...(g.rotate ? { aspectRatio: "16 / 9" } : {}) }}
                      >
                        {g.rotate
                          ? <img src={g.src} alt={g.label || ""} style={{ position: "absolute", top: "50%", left: "50%", width: "auto", height: "auto", maxWidth: "none", transform: `translate(-50%, -50%) rotate(${g.rotate}deg)`, transformOrigin: "center center", pointerEvents: "none" }}
                              onLoad={(e) => {
                                const img = e.currentTarget; const container = img.parentElement;
                                if (!container) return;
                                const cw = container.clientWidth; const iw = img.naturalWidth; const ih = img.naturalHeight;
                                if (!iw || !ih) return;
                                const scale = cw / ih;
                                img.style.width = (iw * scale) + "px"; img.style.height = ih * scale + "px";
                                container.style.aspectRatio = "auto"; container.style.height = (iw * scale) + "px";
                              }} />
                          : <img src={g.src} alt={g.label || ""} style={{ display: "block", width: "100%", height: "auto", objectFit: "cover", pointerEvents: "none" }} />
                        }
                        {g.label &&
                          <span style={{ position: "absolute", left: 14, bottom: 14, padding: "6px 12px", background: "rgba(0,0,0,0.65)", color: "#fff", fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", borderRadius: 999, zIndex: 2, pointerEvents: "none" }}>{g.label}</span>
                        }
                      </div>
                    </div>
                  )
                : [{ span: 12, h: 460, label: "HERO IMAGE" }, { span: 6, h: 360, label: "DETAIL 01" }, { span: 6, h: 360, label: "DETAIL 02" }, { span: 4, h: 320, label: "MARK" }, { span: 8, h: 320, label: "APPLICATION" }, { span: 12, h: 480, label: "FULL SPREAD" }]
                  .map((g, i) =>
                    <div key={i} className="gph" style={{ gridColumn: `span ${g.span}` }}>
                      <div className="ph" style={{ "--ph-color": project.color, color: project.accent, minHeight: g.h }}>
                        <span className="ph-label">{g.label}</span>
                      </div>
                    </div>
                  )
              }
            </div>

            <div style={{ marginTop: 100, borderTop: "1px solid var(--line)", paddingTop: 32, display: "flex", justifyContent: "space-between", fontFamily: "var(--font-mono)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.18em", color: "var(--ink-mute)" }}>
              <span>End of {project.no}</span>
              <button onClick={onClose} data-hover style={{ color: "var(--accent)", textTransform: "uppercase" }}>← Back to all work</button>
            </div>
          </div>
        }
      </div>
    </div>
  );
}
window.ProjectModal = ProjectModal;
