// ════════════════════════════════════════════════════════════════
// RHEI — RitualMirrorView
//
// In-ritual live mirror. The user's own face is the main view, with
// gold gestures animating on their face via MediaPipe Face Mesh
// tracking. The woman's portrait sits as a small PiP in the upper-
// right corner with the SAME step's gestures animating on her —
// a reference for "what does this look like done well."
//
// Camera permission is requested on mount. If denied or unavailable,
// the parent should fall back to the static portrait experience.
// ════════════════════════════════════════════════════════════════
import { useRef, useEffect, useState, useCallback } from "react";
import { RITUALS } from "./RitualSteps";
import AnimatedRitualStep from "./AnimatedRitualStep";

// ──── Ritual landmark → MediaPipe Face Mesh index map ────────────
// Same mapping used in FaceMirrorMode. Duplicated here (rather than
// imported) so this component is self-contained and can be cleaned up
// without affecting the standalone Mirror Mode.
const LM_MAP = {
  forehead_top:      { idx: 10                          },
  forehead_center:   { idx: 10,   dy: 0.04              },
  forehead_left:     { idx: 67                          },
  forehead_right:    { idx: 297                         },
  brow_inner_l:      { idx: 107                         },
  brow_mid_l:        { idx: 66                          },
  brow_outer_l:      { idx: 70                          },
  brow_inner_r:      { idx: 336                         },
  brow_mid_r:        { idx: 296                         },
  brow_outer_r:      { idx: 300                         },
  eye_center_l:      { idx: 159                         },
  eye_center_r:      { idx: 386                         },
  eye_inner_l:       { idx: 173                         },
  eye_inner_r:       { idx: 398                         },
  eye_outer_l:       { idx: 33                          },
  eye_outer_r:       { idx: 263                         },
  temple_l:          { idx: 21                          },
  temple_r:          { idx: 251                         },
  cheekbone_l:       { idx: 116                         },
  cheekbone_r:       { idx: 345                         },
  cheek_l:           { idx: 213                         },
  cheek_r:           { idx: 433                         },
  nose_tip:          { idx: 1                           },
  nose_bridge:       { idx: 6                           },
  nostril_l:         { idx: 64                          },
  nostril_r:         { idx: 294                         },
  lip_top:           { idx: 13                          },
  lip_bottom:        { idx: 14                          },
  mouth_corner_l:    { idx: 61                          },
  mouth_corner_r:    { idx: 291                         },
  nasolabial_l:      { idx: 129                         },
  nasolabial_r:      { idx: 358                         },
  chin_tip:          { idx: 152                         },
  chin_left:         { idx: 169                         },
  chin_right:        { idx: 394                         },
  jaw_mid_l:         { idx: 172                         },
  jaw_mid_r:         { idx: 397                         },
  jaw_angle_l:       { idx: 58                          },
  jaw_angle_r:       { idx: 288                         },
  ear_l:             { idx: 234                         },
  ear_r:             { idx: 454                         },
  behind_ear_l:      { idx: 234, dx: -0.015, dy: 0.04   },
  behind_ear_r:      { idx: 454, dx:  0.015, dy: 0.04   },
  neck_side_l:       { idx: 234, dy: 0.18                },
  neck_side_r:       { idx: 454, dy: 0.18                },
  neck_center:       { idx: 152, dy: 0.12                },
  collarbone_l:      { idx: 234, dy: 0.32                },
  collarbone_r:      { idx: 454, dy: 0.32                },
  collarbone_center: { idx: 152, dy: 0.28                },
  tear_trough_l:     { idx: 159, dy: 0.014               },
  tear_trough_r:     { idx: 386, dy: 0.014               },
  undereye_l:        { idx: 173                          },
  undereye_r:        { idx: 398                          },
  crowsfeet_l:       { idx: 33                           },
  crowsfeet_r:       { idx: 263                          },
};

function resolveLM(lm, ref, cw, ch) {
  let name = ref, addX = 0, addY = 0;
  if (Array.isArray(ref)) {
    [name, addX = 0, addY = 0] = ref;
  }
  const m = LM_MAP[name];
  if (!m || !lm[m.idx]) return null;
  // NB: video is mirrored (transform: scaleX(-1)), so canvas x is also
  // mirrored. We flip x here so the gesture mirrors correctly on the
  // user's face — what shows on the user's left side anatomically appears
  // on the right of the canvas (and vice versa).
  const baseX = 1 - (lm[m.idx].x + (m.dx || 0) + addX);
  const baseY = lm[m.idx].y + (m.dy || 0) + addY;
  return [baseX * cw, baseY * ch];
}

export default function RitualMirrorView({
  ritualId,
  stepIndex,
  width = 300,
  height = 380,
  onCameraStatus,
  pipPosition = "top-right",
}) {
  const videoRef     = useRef(null);
  const canvasRef    = useRef(null);
  const containerRef = useRef(null);
  const streamRef    = useRef(null);
  const fmRef        = useRef(null);
  const rafRef       = useRef(null);
  const cycleT       = useRef(0);
  const pulseT       = useRef(0);

  const ritualRef = useRef(ritualId);
  const stepRef   = useRef(stepIndex);
  useEffect(() => { ritualRef.current = ritualId; }, [ritualId]);
  useEffect(() => {
    stepRef.current = stepIndex;
    // Reset animation cycles so the new step's gestures start from frame 0
    // rather than picking up mid-cycle from the previous step.
    cycleT.current = 0;
    pulseT.current = 0;
  }, [stepIndex]);

  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState(null);

  // ── 1. Open camera ──
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError("unsupported");
        onCameraStatus?.("denied");
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
        if (!mounted) { stream.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = stream;
        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          video.muted = true;
          video.setAttribute("playsinline", "true");
          try { await video.play(); } catch {}
          setCameraReady(true);
          onCameraStatus?.("ready");
        }
      } catch (e) {
        if (!mounted) return;
        setCameraError(e?.name || "error");
        onCameraStatus?.("denied");
      }
    })();
    return () => {
      mounted = false;
      cancelAnimationFrame(rafRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
      if (fmRef.current) { try { fmRef.current.close(); } catch {} fmRef.current = null; }
    };
  }, []);

  // ── 2. Match canvas to the video object-fit:cover crop region ──
  // DPR-aware: the canvas internal resolution is multiplied by the device's
  // pixel ratio so gold strokes render crisp on Retina / HiDPI screens, then
  // the drawing context is scaled to match. CSS size stays in logical pixels.
  const matchCanvasToVideo = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!video || !canvas || !container) return;
    const cw = container.clientWidth, ch = container.clientHeight;
    const vw = video.videoWidth || 1280, vh = video.videoHeight || 720;
    if (!cw || !ch || !vw || !vh) return;
    const scale = Math.max(cw / vw, ch / vh);
    const dispW = vw * scale, dispH = vh * scale;
    const offX = (cw - dispW) / 2, offY = (ch - dispH) / 2;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.style.width  = `${dispW}px`;
    canvas.style.height = `${dispH}px`;
    canvas.style.left   = `${offX}px`;
    canvas.style.top    = `${offY}px`;
    canvas.width  = Math.round(dispW * dpr);
    canvas.height = Math.round(dispH * dpr);
    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // scale all draw ops to dpr
  }, []);

  useEffect(() => {
    if (!cameraReady) return;
    matchCanvasToVideo();
    const onResize = () => matchCanvasToVideo();
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
    };
  }, [cameraReady, matchCanvasToVideo]);

  // ── 3. Load MediaPipe Face Mesh + start detection loop ──
  useEffect(() => {
    if (!cameraReady) return;

    const start = () => {
      if (!window.FaceMesh) return;
      const fm = new window.FaceMesh({
        locateFile: f => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4.1633559619/${f}`,
      });
      fm.setOptions({
        maxNumFaces: 1, refineLandmarks: false,
        minDetectionConfidence: 0.5, minTrackingConfidence: 0.5,
      });
      fm.onResults(results => {
        const lm = results.multiFaceLandmarks?.[0];
        if (lm && canvasRef.current) drawCanvas(lm);
      });
      fmRef.current = fm;

      const loop = async () => {
        const v = videoRef.current;
        if (v && !v.paused && fmRef.current) {
          try { await fmRef.current.send({ image: v }); } catch {}
        }
        rafRef.current = requestAnimationFrame(loop);
      };
      rafRef.current = requestAnimationFrame(loop);
    };

    if (window.FaceMesh) { start(); return; }
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4.1633559619/face_mesh.js";
    script.async = true;
    script.onload = start;
    document.head.appendChild(script);
  }, [cameraReady]);

  // ── 4. Canvas drawing — same gesture vocabulary as portrait/SVG version ──
  const drawCanvas = useCallback((lm) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    // canvas.width/height are in DPR-scaled pixels; we draw in CSS logical
    // pixels because the context was setTransform'd to the DPR.
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cw = canvas.width / dpr;
    const ch = canvas.height / dpr;
    // Use raw pixel clearRect (clears the entire bitmap) — setTransform
    // affects draw ops but not clearRect's interpretation of raw pixels.
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.restore();

    const ritual = RITUALS[ritualRef.current];
    if (!ritual) return;
    const step = ritual.steps[stepRef.current - 1];
    if (!step) return;

    const GOLD = "#E4C38A";
    const GOLD_BRIGHT = "#F2D9A6";
    pulseT.current = (pulseT.current + 0.018) % (Math.PI * 2);
    const p = (Math.sin(pulseT.current) + 1) / 2;
    cycleT.current = (cycleT.current + 0.0033) % 1;
    const cycle = cycleT.current;
    const rp = (ref) => resolveLM(lm, ref, cw, ch);

    const drawSmoothPath = (pts, progress) => {
      if (pts.length < 2) return [null, null];
      const samples = 60;
      const dense = [];
      if (pts.length === 2) {
        for (let i = 0; i <= samples; i++) {
          const t = i / samples;
          dense.push([pts[0][0] + (pts[1][0] - pts[0][0]) * t, pts[0][1] + (pts[1][1] - pts[0][1]) * t]);
        }
      } else {
        const pad = [pts[0], ...pts, pts[pts.length - 1]];
        for (let i = 1; i < pad.length - 2; i++) {
          const p0 = pad[i - 1], p1 = pad[i], p2 = pad[i + 1], p3 = pad[i + 2];
          for (let j = 0; j < samples; j++) {
            const t = j / samples, tt = t * t, ttt = tt * t;
            dense.push([
              0.5 * ((2*p1[0]) + (-p0[0]+p2[0])*t + (2*p0[0]-5*p1[0]+4*p2[0]-p3[0])*tt + (-p0[0]+3*p1[0]-3*p2[0]+p3[0])*ttt),
              0.5 * ((2*p1[1]) + (-p0[1]+p2[1])*t + (2*p0[1]-5*p1[1]+4*p2[1]-p3[1])*tt + (-p0[1]+3*p1[1]-3*p2[1]+p3[1])*ttt),
            ]);
          }
        }
        dense.push(pts[pts.length - 1]);
      }
      const drawUpTo = Math.max(2, Math.floor(dense.length * progress));
      ctx.beginPath();
      ctx.moveTo(dense[0][0], dense[0][1]);
      for (let i = 1; i < drawUpTo; i++) ctx.lineTo(dense[i][0], dense[i][1]);
      ctx.stroke();
      const lastIdx = drawUpTo - 1;
      const prevIdx = Math.max(0, lastIdx - 1);
      return [dense[lastIdx], dense[prevIdx]];
    };

    const drawGoldStroke = (drawFn) => {
      ctx.save();
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.shadowColor = "rgba(228, 195, 138, 0.55)";
      ctx.shadowBlur = 14;
      ctx.strokeStyle = GOLD;
      ctx.lineWidth = 6;
      drawFn();
      ctx.shadowBlur = 6;
      ctx.strokeStyle = GOLD_BRIGHT;
      ctx.lineWidth = 4.5;
      drawFn();
      ctx.restore();
    };

    const localPhase = (delay) => {
      const local = ((cycle * 5 - delay) % 5) / 5;
      const t = local < 0 ? local + 1 : local;
      if (t < 0.06)       return { progress: 0,                   alpha: 0 };
      if (t < 0.50)       return { progress: (t - 0.06) / 0.44,   alpha: 1 };
      if (t < 0.80)       return { progress: 1,                   alpha: 1 };
      if (t < 0.92)       return { progress: 1, alpha: 1 - (t - 0.80) / 0.12 };
      return { progress: 1, alpha: 0 };
    };

    const drawArrow = (g) => {
      const delay = g.delay || 0;
      const pts = g.points.map(rp).filter(Boolean);
      if (pts.length < 2) return;
      const { progress, alpha } = localPhase(delay);
      ctx.save();
      ctx.globalAlpha = alpha;
      let endPt = null, prevPt = null;
      drawGoldStroke(() => { const r = drawSmoothPath(pts, progress); endPt = r[0]; prevPt = r[1]; });
      if (progress > 0.85 && endPt && prevPt) {
        const dx = endPt[0] - prevPt[0], dy = endPt[1] - prevPt[1];
        const len = Math.hypot(dx, dy) || 1;
        const ux = dx / len, uy = dy / len;
        const head = 16, spread = 0.5;
        const ax = endPt[0] - head * (ux * Math.cos(spread) - uy * Math.sin(spread));
        const ay = endPt[1] - head * (uy * Math.cos(spread) + ux * Math.sin(spread));
        const bx = endPt[0] - head * (ux * Math.cos(spread) + uy * Math.sin(spread));
        const by = endPt[1] - head * (uy * Math.cos(spread) - ux * Math.sin(spread));
        drawGoldStroke(() => {
          ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(endPt[0], endPt[1]); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(endPt[0], endPt[1]); ctx.stroke();
        });
      }
      ctx.restore();
    };

    const drawCurve = (g) => {
      const delay = g.delay || 0;
      const pts = g.points.map(rp).filter(Boolean);
      if (pts.length < 2) return;
      const { progress, alpha } = localPhase(delay);
      ctx.save();
      ctx.globalAlpha = alpha;
      drawGoldStroke(() => { drawSmoothPath(pts, progress); });
      ctx.restore();
    };

    const drawCircleGesture = (g) => {
      const delay = g.delay || 0;
      const c = rp(g.center);
      if (!c) return;
      const r = (g.radius || 0.04) * cw;
      ctx.save();
      ctx.lineCap = "round";
      ctx.fillStyle = GOLD;
      ctx.shadowColor = "rgba(228, 195, 138, 0.65)";
      ctx.shadowBlur = 6;
      ctx.beginPath(); ctx.arc(c[0], c[1], 3.5, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = "rgba(228, 195, 138, 0.55)";
      ctx.lineWidth = 2.5;
      ctx.setLineDash([6, 8]);
      ctx.beginPath(); ctx.arc(c[0], c[1], r, 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([]);
      const orbit = ((cycle * 5 - delay) / 3.2) * Math.PI * 2;
      const dotX = c[0] + r * Math.cos(orbit);
      const dotY = c[1] + r * Math.sin(orbit);
      ctx.fillStyle = "rgba(228, 195, 138, 0.30)";
      ctx.beginPath(); ctx.arc(dotX, dotY, 10, 0, Math.PI * 2); ctx.fill();
      ctx.shadowColor = "rgba(242, 217, 166, 0.95)";
      ctx.shadowBlur = 10;
      ctx.fillStyle = GOLD_BRIGHT;
      ctx.beginPath(); ctx.arc(dotX, dotY, 5, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    };

    const drawHold = (g) => {
      const delay = g.delay || 0;
      const c = rp(g.center);
      if (!c) return;
      const baseR = (g.radius || 0.035) * cw;
      ctx.save();
      for (let i = 0; i < 3; i++) {
        const ringPhase = (((cycle * 5 - delay - i * 0.55) / 2.6) % 1 + 1) % 1;
        const scale = 0.55 + ringPhase * 1.65;
        let ringAlpha = ringPhase < 0.20 ? ringPhase / 0.20 : 1 - ringPhase;
        ringAlpha = Math.max(0, ringAlpha);
        ctx.globalAlpha = ringAlpha;
        ctx.strokeStyle = GOLD;
        ctx.lineWidth = 3;
        ctx.shadowColor = "rgba(228, 195, 138, 0.55)";
        ctx.shadowBlur = 10;
        ctx.beginPath(); ctx.arc(c[0], c[1], baseR * scale, 0, Math.PI * 2); ctx.stroke();
      }
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 0.75 + p * 0.25;
      ctx.fillStyle = GOLD_BRIGHT;
      ctx.shadowColor = "rgba(242, 217, 166, 0.95)";
      ctx.shadowBlur = 8;
      ctx.beginPath(); ctx.arc(c[0], c[1], Math.max(4, baseR * 0.30), 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    };

    const drawPoint = (g) => {
      const c = rp(g.center);
      if (!c) return;
      const r = (g.radius || 0.018) * cw;
      ctx.save();
      ctx.globalAlpha = 0.6 + p * 0.4;
      ctx.fillStyle = "rgba(228, 195, 138, 0.30)";
      ctx.beginPath(); ctx.arc(c[0], c[1], r * 2.4, 0, Math.PI * 2); ctx.fill();
      ctx.shadowColor = "rgba(242, 217, 166, 0.95)";
      ctx.shadowBlur = 10;
      ctx.fillStyle = GOLD_BRIGHT;
      ctx.beginPath(); ctx.arc(c[0], c[1], r, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    };

    const drawWave = (g) => {
      const delay = g.delay || 0;
      const a = rp(g.from);
      const b = rp(g.to);
      if (!a || !b) return;
      const dx = b[0] - a[0], dy = b[1] - a[1];
      const len = Math.hypot(dx, dy);
      const ux = dx / len, uy = dy / len;
      const perpX = -uy, perpY = ux;
      const amp = 18;
      const { progress, alpha } = localPhase(delay);
      ctx.save();
      ctx.globalAlpha = alpha;
      const steps = 40;
      const drawUpTo = Math.max(2, Math.floor(steps * progress));
      const pts = [];
      for (let i = 0; i <= drawUpTo; i++) {
        const t = i / steps;
        const damp = Math.sin(Math.PI * t);
        const wave = Math.sin(Math.PI * 3 * t) * amp * damp;
        pts.push([a[0] + dx * t + perpX * wave, a[1] + dy * t + perpY * wave]);
      }
      drawGoldStroke(() => {
        ctx.beginPath();
        ctx.moveTo(pts[0][0], pts[0][1]);
        for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
        ctx.stroke();
      });
      ctx.restore();
    };

    for (const g of step.gestures) {
      switch (g.type) {
        case "arrow":  drawArrow(g);          break;
        case "curve":  drawCurve(g);          break;
        case "circle": drawCircleGesture(g);  break;
        case "hold":   drawHold(g);           break;
        case "point":  drawPoint(g);          break;
        case "wave":   drawWave(g);           break;
      }
    }
  }, []);

  // ── If camera failed, render nothing so the parent can fall back ──
  if (cameraError) return null;

  // ── PiP corner positioning ──
  // Slightly larger than v1 so the user can actually read the gestures
  // animating on the woman's face from a glance.
  const pipBase = { width: 108, height: 135, borderRadius: 10 };
  const pipPlacement = {
    "top-right":    { top: 14, right: 14 },
    "top-left":     { top: 14, left: 14 },
    "bottom-right": { bottom: 14, right: 14 },
    "bottom-left":  { bottom: 14, left: 14 },
  }[pipPosition] || { top: 14, right: 14 };

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        width,
        height,
        borderRadius: 14,
        overflow: "hidden",
        background: "#0C0907",
      }}
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{
          position: "absolute", inset: 0,
          width: "100%", height: "100%",
          objectFit: "cover",
          transform: "scaleX(-1)", // mirror — feels natural
          display: cameraReady ? "block" : "none",
        }}
      />
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          pointerEvents: "none",
        }}
      />
      {!cameraReady && (
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          gap: 12,
          background: "linear-gradient(180deg, #1A0F06 0%, #0C0907 100%)",
        }}>
          {/* Soft pulsing center dot — luxurious "preparing" state */}
          <div style={{
            width: 14, height: 14, borderRadius: "50%",
            background: "radial-gradient(circle, #F2D9A6 0%, #E4C38A 50%, transparent 80%)",
            animation: "rhei-pulse-dot 1.8s ease-in-out infinite",
            boxShadow: "0 0 16px rgba(228,195,138,0.6)",
          }}/>
          <p style={{
            color: "rgba(242,235,220,0.72)",
            fontFamily: "'Fraunces', Georgia, serif",
            fontSize: 13,
            fontWeight: 300,
            fontStyle: "italic",
            margin: 0,
            letterSpacing: "-0.005em",
          }}>
            preparing the mirror
          </p>
        </div>
      )}

      {/* Woman portrait PiP — the reference for "how this looks done well" */}
      <div style={{
        position: "absolute",
        ...pipPlacement,
        ...pipBase,
        overflow: "hidden",
        border: "1px solid rgba(242,235,220,0.25)",
        boxShadow: "0 6px 20px rgba(0,0,0,0.55)",
        backgroundColor: "#2D1B0E",
      }}>
        <AnimatedRitualStep
          ritualId={ritualId}
          stepIndex={stepIndex}
          width={pipBase.width}
          height={pipBase.height}
          showFrame={false}
        />
      </div>

      {/* Editorial corner brackets matching the portrait variant */}
      {[
        { top: 8, left: 8, transform: "rotate(0deg)" },
        { top: 8, right: 8, transform: "rotate(90deg)" },
        { bottom: 8, left: 8, transform: "rotate(-90deg)" },
        { bottom: 8, right: 8, transform: "rotate(180deg)" },
      ].map((pos, i) => (
        <div key={i} style={{
          position: "absolute", ...pos,
          width: 12, height: 12,
          borderTop: "1px solid rgba(242,235,220,0.45)",
          borderLeft: "1px solid rgba(242,235,220,0.45)",
          transformOrigin: "top left",
          pointerEvents: "none",
        }}/>
      ))}
    </div>
  );
}
