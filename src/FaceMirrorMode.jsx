import { useState, useEffect, useRef, useCallback } from "react";
import { X, Camera, ChevronLeft, Check, ArrowRight, Sparkles, Play, Pause, Volume2, VolumeX } from "lucide-react";
import FaceGuideIllustration from "./FaceGuideIllustration";
import { RITUALS, resolveLandmark as resolveRitualLandmark } from "./RitualSteps";

/* ═══════════════════════════════════════════
   RHEI — Mirror Mode  v3
   Reliable 4-phase ritual guidance system
   ═══════════════════════════════════════════ */

const B = {
  bgDeep: "#1A0F06", card: "#3A2516", cardDark: "#2A1A0C",
  gold: "#C49A4B", goldLight: "#D4AD6A",
  cream: "#F2E8D9", creamMuted: "#C9B99F", muted: "#8A7560",
  warmBlack: "#1A0F06",
  goldGrad: "linear-gradient(135deg, #C49A4B 0%, #D4AD6A 50%, #C49A4B 100%)",
  border: "rgba(196,154,75,0.14)",
  borderActive: "rgba(196,154,75,0.35)",
};
const F  = "'Fraunces', Georgia, 'Times New Roman', serif";
const SF = "'Inter', system-ui, -apple-system, sans-serif";

// ── Zone → tension profile → ritual ──────────────────────────────────────────
const ZONES = [
  { id:"jaw",      label:"Jaw & neck tight",     desc:"Clenching, tightness along the jaw, or tension in the neck", color:"#C4786A", zone:"jawline",  illustration:"jawline" },
  { id:"brow",     label:"Brow & forehead tense", desc:"Furrowed brow, forehead tension, or pressure above the eyes", color:"#A08BAA", zone:"brow",     illustration:"brow" },
  { id:"undereye", label:"Puffy under-eye",        desc:"Swelling, dark circles, or heaviness under and around the eyes", color:"#8A9BAF", zone:"undereye", illustration:"undereye" },
  { id:"full",     label:"All over / not sure",    desc:"General face tension, or I'm not sure where to start", color:B.gold,    zone:"full",    illustration:"full" },
];

const ZONE_TO_RITUAL = {
  jaw:      "gua-sha",
  brow:     "face-lift",
  undereye: "lymphatic",
  full:     "gua-sha",
};

// ── Scan status messages ──────────────────────────────────────────────────────
const SCAN_STEPS = [
  "Opening camera…",
  "Reading your face…",
  "Building your protocol…",
];

// ── Audio reset after ritual (Morning Reset — free for everyone) ──────────────
const POST_RITUAL_AUDIO = { id: 1, name: "Morning Reset", duration: "3 min",
  desc: "The vagal tone baseline. The perfect completion." };

// ── MediaPipe canvas overlay config per ritual × step ────────────────────────
const OVERLAYS = {
  "gua-sha":   ["full","neck_down","jawline_out","cheek_lift","undereye_out","brow_out","forehead_up","neck_down"],
  "lymphatic": ["nodes","neck_down","forehead_up","orbital","cheek_out","jawline_out","neck_down"],
  "face-lift": ["temples","brow_up","cheek_lift","nasolabial_up","jawline_up","marionette_up","neck_up","full"],
  "buccal":    ["jawline","jawline_out","cheek_lift","jawline_out","jawline_out","neck_down"],
  "pre-event": ["nodes","undereye_out","cheek_lift","jawline_out","forehead_up","full"],
  "eye-revival":["undereye_out","undereye_out","undereye_out","undereye_out","brow_out","undereye_out"],
};

// ── Zone to illustration zone name mapping ────────────────────────────────────
const OVERLAY_TO_ILLUS = {
  neck_down:"neck", jawline_out:"jawline", cheek_lift:"cheeks", undereye_out:"undereye",
  brow_out:"brow", forehead_up:"forehead", nodes:"nodes", orbital:"orbital",
  cheek_out:"cheeks", jawline_up:"jawline", brow_up:"brow", marionette_up:"marionette",
  neck_up:"neck", nasolabial_up:"nasolabial", temples:"temples", full:"full",
  jawline:"jawline",
};

// ── Bridge: ritual landmark name → MediaPipe Face Mesh index ─────────────────
// The new RitualSteps.js gesture system uses anatomical landmark names
// (chin_tip, cheekbone_l, brow_inner_r…). Mirror Mode tracks the user's actual
// face via MediaPipe Face Mesh (468 landmarks indexed 0..467). This table maps
// the name → MediaPipe index so the SAME gestures show in the SAME anatomical
// places on the user's real face.
//
// MediaPipe doesn't cover the neck or collarbones, so those are derived as
// offsets below the face. Offsets are in normalized [0..1] of the canvas.
const LM_MAP = {
  // Top / forehead
  forehead_top:      { idx: 10                          },
  forehead_center:   { idx: 10,   dy: 0.04              },
  forehead_left:     { idx: 67                          },
  forehead_right:    { idx: 297                         },
  // Brow
  brow_inner_l:      { idx: 107                         },
  brow_mid_l:        { idx: 66                          },
  brow_outer_l:      { idx: 70                          },
  brow_inner_r:      { idx: 336                         },
  brow_mid_r:        { idx: 296                         },
  brow_outer_r:      { idx: 300                         },
  // Eyes
  eye_center_l:      { idx: 159                         },  // upper lid center
  eye_center_r:      { idx: 386                         },
  eye_inner_l:       { idx: 173                         },
  eye_inner_r:       { idx: 398                         },
  eye_outer_l:       { idx: 33                          },
  eye_outer_r:       { idx: 263                         },
  // Temple
  temple_l:          { idx: 21                          },
  temple_r:          { idx: 251                         },
  // Cheekbone / cheek
  cheekbone_l:       { idx: 116                         },
  cheekbone_r:       { idx: 345                         },
  cheek_l:           { idx: 213                         },
  cheek_r:           { idx: 433                         },
  // Nose
  nose_tip:          { idx: 1                           },
  nose_bridge:       { idx: 6                           },
  nostril_l:         { idx: 64                          },
  nostril_r:         { idx: 294                         },
  // Mouth
  lip_top:           { idx: 13                          },
  lip_bottom:        { idx: 14                          },
  mouth_corner_l:    { idx: 61                          },
  mouth_corner_r:    { idx: 291                         },
  // Nasolabial fold
  nasolabial_l:      { idx: 129                         },
  nasolabial_r:      { idx: 358                         },
  // Jaw
  chin_tip:          { idx: 152                         },
  chin_left:         { idx: 169                         },
  chin_right:        { idx: 394                         },
  jaw_mid_l:         { idx: 172                         },
  jaw_mid_r:         { idx: 397                         },
  jaw_angle_l:       { idx: 58                          },
  jaw_angle_r:       { idx: 288                         },
  // Ear
  ear_l:             { idx: 234                         },
  ear_r:             { idx: 454                         },
  behind_ear_l:      { idx: 234, dx: -0.015, dy: 0.04   },
  behind_ear_r:      { idx: 454, dx:  0.015, dy: 0.04   },
  // Neck + collarbone — derived as offsets from chin/ears since MediaPipe
  // Face Mesh does not cover this region.
  neck_side_l:       { idx: 234, dy: 0.18                },
  neck_side_r:       { idx: 454, dy: 0.18                },
  neck_center:       { idx: 152, dy: 0.12                },
  collarbone_l:      { idx: 234, dy: 0.32                },
  collarbone_r:      { idx: 454, dy: 0.32                },
  collarbone_center: { idx: 152, dy: 0.28                },
  // Orbital fine work
  tear_trough_l:     { idx: 159, dy: 0.014               },
  tear_trough_r:     { idx: 386, dy: 0.014               },
  undereye_l:        { idx: 173                          },
  undereye_r:        { idx: 398                          },
  crowsfeet_l:       { idx: 33                           },
  crowsfeet_r:       { idx: 263                          },
};

// Resolve a ritual landmark reference (string or [name, dx, dy]) to pixel
// coordinates on the canvas using MediaPipe landmarks.
function resolveLM(lm, ref, cw, ch) {
  let name = ref, addX = 0, addY = 0;
  if (Array.isArray(ref)) {
    [name, addX = 0, addY = 0] = ref;
  }
  const m = LM_MAP[name];
  if (!m || !lm[m.idx]) return null;
  const baseX = lm[m.idx].x + (m.dx || 0) + addX;
  const baseY = lm[m.idx].y + (m.dy || 0) + addY;
  return [baseX * cw, baseY * ch];
}

// ─────────────────────────────────────────────────────────────────────────────
export default function FaceMirrorMode({ onClose, onTransitionToReset, rituals, isPremium }) {

  const [phase,       setPhase]       = useState("checkin"); // checkin|results|mirror|complete
  const [scanStep,    setScanStep]    = useState(0);            // 0-2 scan status message index
  const [scanPct,     setScanPct]     = useState(0);            // 0-100 progress bar
  const [chosenZone,  setChosenZone]  = useState(null);         // which zone user tapped
  const [recommended, setRecommended] = useState(null);         // ritual object
  const [activeRitual,setActiveRitual]= useState(null);
  const [stepIdx,     setStepIdx]     = useState(0);
  const [stepSecs,    setStepSecs]    = useState(0);
  const [cameraReady, setCameraReady] = useState(false);
  const [mpLoaded,    setMpLoaded]    = useState(false);        // MediaPipe loaded flag
  const [voiceEnabled, setVoiceEnabled] = useState(() => {
    try { return localStorage.getItem("rhei_mirror_voice") !== "0"; } catch { return true; }
  });

  const videoRef  = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const fmRef     = useRef(null);
  const rafRef    = useRef(null);
  const stepTmr   = useRef(null);
  const scanTmr   = useRef(null);
  const phasRef   = useRef("permission");
  const ritualRef = useRef(null);
  const stepRef   = useRef(0);
  const pulseT    = useRef(0);
  const cycleT    = useRef(0); // 0..1 master cycle for gesture animations

  useEffect(() => { phasRef.current   = phase;        }, [phase]);
  useEffect(() => { ritualRef.current = activeRitual; }, [activeRitual]);
  useEffect(() => { stepRef.current   = stepIdx;      }, [stepIdx]);

  // Cleanup on unmount
  useEffect(() => () => {
    cancelAnimationFrame(rafRef.current);
    clearInterval(stepTmr.current);
    clearTimeout(scanTmr.current);
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    if (fmRef.current) try { fmRef.current.close(); } catch {}
  }, []);

  // ── Position canvas to exactly match the video's object-fit:cover crop region.
  //    This is the ONLY way to make MediaPipe landmark overlays land precisely on the face.
  //    Math: with cover, video scales to AT LEAST as big as the container in both dims, then crops the excess.
  //    We replicate that exact same display region on the canvas so normalized landmark coords map 1:1.
  const matchCanvasToVideo = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    const container = video.parentElement;
    if (!container) return;
    const cw = container.clientWidth;
    const ch = container.clientHeight;
    const vw = video.videoWidth  || 1280;
    const vh = video.videoHeight || 720;
    if (!cw || !ch || !vw || !vh) return;
    const scale = Math.max(cw / vw, ch / vh);
    const dispW = vw * scale;
    const dispH = vh * scale;
    const offX  = (cw - dispW) / 2;
    const offY  = (ch - dispH) / 2;
    canvas.style.width  = `${dispW}px`;
    canvas.style.height = `${dispH}px`;
    canvas.style.left   = `${offX}px`;
    canvas.style.top    = `${offY}px`;
  }, []);

  // Re-position canvas on every window resize / orientation change
  useEffect(() => {
    const onResize = () => matchCanvasToVideo();
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
    };
  }, [matchCanvasToVideo]);

  // ── Camera open (called on permission) ────────────────────────────────────
  const openCamera = useCallback(async () => {
    setPhase("scan");
    setScanStep(0); setScanPct(0);

    // Animate scan bar + messages over 2.8s then go to checkin
    let pct = 0;
    const interval = setInterval(() => {
      pct += 2.2;
      setScanPct(Math.min(100, Math.round(pct)));
      if (pct < 35) setScanStep(0);
      else if (pct < 75) setScanStep(1);
      else setScanStep(2);
      if (pct >= 100) {
        clearInterval(interval);
        setTimeout(() => setPhase("checkin"), 200);
      }
    }, 60);

    // Open camera in background (for mirror phase later)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode:"user", width:{ ideal:1280 }, height:{ ideal:720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        const vw = videoRef.current.videoWidth  || 640;
        const vh = videoRef.current.videoHeight || 480;
        if (canvasRef.current) { canvasRef.current.width = vw; canvasRef.current.height = vh; }
        // Position the canvas to exactly match the video's object-fit:cover display region.
        matchCanvasToVideo();
        setCameraReady(true);
      }
      // Load MediaPipe in background for mirror overlays
      loadMP().catch(() => {});
    } catch {
      // Camera denied — mirror mode still works without camera
    }
  }, []);

  // ── MediaPipe lazy-load ───────────────────────────────────────────────────
  const loadMP = useCallback(() => new Promise((res, rej) => {
    if (window.FaceMesh) { initMP(); res(); return; }
    const s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4.1633559619/face_mesh.js";
    s.crossOrigin = "anonymous";
    s.onload  = () => { initMP(); res(); };
    s.onerror = rej;
    document.head.appendChild(s);
  }), []);

  const initMP = useCallback(() => {
    if (fmRef.current) return;
    try {
      const fm = new window.FaceMesh({
        locateFile: f => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4.1633559619/${f}`,
      });
      fm.setOptions({ maxNumFaces:1, refineLandmarks:false, minDetectionConfidence:0.5, minTrackingConfidence:0.5 });
      fm.onResults(results => {
        const lm = results.multiFaceLandmarks?.[0];
        if (lm && canvasRef.current) drawCanvas(lm);
      });
      fmRef.current = fm;
      setMpLoaded(true);

      const loop = async () => {
        if (videoRef.current && !videoRef.current.paused && fmRef.current &&
            (phasRef.current === "scan" || phasRef.current === "mirror")) {
          try { await fmRef.current.send({ image: videoRef.current }); } catch {}
        }
        rafRef.current = requestAnimationFrame(loop);
      };
      rafRef.current = requestAnimationFrame(loop);
    } catch {}
  }, []);

  // ── Canvas overlay drawing ────────────────────────────────────────────────
  const drawCanvas = useCallback((lm) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const cw = canvas.width, ch = canvas.height;
    ctx.clearRect(0, 0, cw, ch);

    const px = i => lm[i] ? lm[i].x * cw : null;
    const py = i => lm[i] ? lm[i].y * ch : null;

    // During scan: draw animated face outline
    if (phasRef.current === "scan") {
      pulseT.current = (pulseT.current + 0.04) % (Math.PI * 2);
      const alpha = 0.25 + Math.sin(pulseT.current) * 0.2;
      const outline = [10,338,297,332,284,251,389,356,454,323,361,288,397,365,
                       379,378,400,377,152,148,176,149,150,136,172,58,132,93,234,
                       127,162,21,54,103,67,109,10];
      ctx.strokeStyle = `rgba(196,154,75,${alpha})`;
      ctx.lineWidth = 1.2; ctx.setLineDash([4,6]);
      ctx.beginPath();
      outline.forEach((idx,i) => {
        if (!lm[idx]) return;
        i===0 ? ctx.moveTo(px(idx), py(idx)) : ctx.lineTo(px(idx), py(idx));
      });
      ctx.stroke(); ctx.setLineDash([]);
      return;
    }

    // During mirror: draw the SAME gestures as the AnimatedRitualStep portrait,
    // but mapped to MediaPipe Face Mesh landmarks on the user's actual face.
    // The visual language matches the still portraits — same gold, same glow,
    // same animation pattern — just rendered on Canvas with live face tracking.
    if (phasRef.current !== "mirror" || !ritualRef.current) return;
    const ritual = RITUALS[ritualRef.current.id];
    if (!ritual) return;
    const step = ritual.steps[stepRef.current];
    if (!step) return;

    const GOLD        = "#E4C38A";
    const GOLD_BRIGHT = "#F2D9A6";
    pulseT.current = (pulseT.current + 0.018) % (Math.PI * 2);
    const p = (Math.sin(pulseT.current) + 1) / 2;
    // Animation cycle for arrow draw + circle orbit (0..1, repeats every ~5s at 60fps)
    cycleT.current = (cycleT.current + 0.0033) % 1;
    const cycle = cycleT.current;

    // Resolve helper bound to current canvas + landmarks
    const rp = (ref) => resolveLM(lm, ref, cw, ch);

    // ── Gesture rendering primitives (Canvas equivalents of AnimatedRitualStep) ──
    const drawSmoothPath = (pts, progress) => {
      // Draw a Catmull-Rom curve through points, up to `progress` (0..1) of length
      if (pts.length < 2) return [null, null, null];
      // Build dense interpolated points
      const samples = 60;
      const dense = [];
      if (pts.length === 2) {
        for (let i = 0; i <= samples; i++) {
          const t = i / samples;
          dense.push([
            pts[0][0] + (pts[1][0] - pts[0][0]) * t,
            pts[0][1] + (pts[1][1] - pts[0][1]) * t,
          ]);
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
      return [dense[lastIdx], dense[prevIdx], drawUpTo / dense.length];
    };

    const drawGoldStroke = (drawFn) => {
      // Layered drop-shadow + gold fill, mimics SVG drop-shadow glow
      ctx.save();
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      // Outer halo
      ctx.shadowColor = "rgba(228, 195, 138, 0.55)";
      ctx.shadowBlur = 14;
      ctx.strokeStyle = GOLD;
      ctx.lineWidth = 6;
      drawFn();
      // Sharper inner glow
      ctx.shadowBlur = 6;
      ctx.strokeStyle = GOLD_BRIGHT;
      ctx.lineWidth = 4.5;
      drawFn();
      ctx.restore();
    };

    const drawArrow = (g, delay = 0) => {
      const pts = g.points.map(rp).filter(Boolean);
      if (pts.length < 2) return;
      // Phase the animation: arrow draws over first 50% of cycle, holds for 30%, fades for 20%
      const local = ((cycle * 5 - delay) % 5) / 5; // 5s cycle
      let progress = 0, alpha = 1;
      if (local < 0.06)       { progress = 0;                 alpha = 0; }
      else if (local < 0.50)  { progress = (local - 0.06) / 0.44; alpha = 1; }
      else if (local < 0.80)  { progress = 1;                 alpha = 1; }
      else if (local < 0.92)  { progress = 1;                 alpha = 1 - (local - 0.80) / 0.12; }
      else                    { progress = 1;                 alpha = 0; }

      ctx.save();
      ctx.globalAlpha = alpha;
      let endPt = null, prevPt = null;
      drawGoldStroke(() => {
        const r = drawSmoothPath(pts, progress);
        endPt = r[0]; prevPt = r[1];
      });
      // Arrowhead when path is mostly drawn
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

    const drawCurve = (g, delay = 0) => {
      // Same as arrow but no arrowhead
      const pts = g.points.map(rp).filter(Boolean);
      if (pts.length < 2) return;
      const local = ((cycle * 5 - delay) % 5) / 5;
      let progress = 0, alpha = 1;
      if (local < 0.06)       { progress = 0;                 alpha = 0; }
      else if (local < 0.50)  { progress = (local - 0.06) / 0.44; alpha = 1; }
      else if (local < 0.80)  { progress = 1;                 alpha = 1; }
      else if (local < 0.92)  { progress = 1;                 alpha = 1 - (local - 0.80) / 0.12; }
      else                    { progress = 1;                 alpha = 0; }
      ctx.save();
      ctx.globalAlpha = alpha;
      drawGoldStroke(() => { drawSmoothPath(pts, progress); });
      ctx.restore();
    };

    const drawCircleGesture = (g, delay = 0) => {
      // Static dashed orbit + orbiting fingertip + center anchor
      const c = rp(g.center);
      if (!c) return;
      // Estimate radius in pixels — gesture.radius is normalized to image width
      // (the SVG version uses viewBox 0..1). MediaPipe is normalized to canvas
      // dimensions. We multiply by canvas width for consistent visual size.
      const r = (g.radius || 0.04) * cw;
      ctx.save();
      ctx.lineCap = "round";
      // Center anchor dot
      ctx.fillStyle = GOLD;
      ctx.shadowColor = "rgba(228, 195, 138, 0.65)";
      ctx.shadowBlur = 6;
      ctx.beginPath(); ctx.arc(c[0], c[1], 3.5, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
      // Static dashed orbit path
      ctx.strokeStyle = "rgba(228, 195, 138, 0.55)";
      ctx.lineWidth = 2.5;
      ctx.setLineDash([6, 8]);
      ctx.beginPath(); ctx.arc(c[0], c[1], r, 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([]);
      // Orbiting fingertip dot — 3.2s per rotation
      const orbit = ((cycle * 5 - delay) / 3.2) * Math.PI * 2;
      const dotX = c[0] + r * Math.cos(orbit);
      const dotY = c[1] + r * Math.sin(orbit);
      // Soft halo behind dot
      ctx.fillStyle = "rgba(228, 195, 138, 0.30)";
      ctx.beginPath(); ctx.arc(dotX, dotY, 10, 0, Math.PI * 2); ctx.fill();
      // Bright fingertip core
      ctx.shadowColor = "rgba(242, 217, 166, 0.95)";
      ctx.shadowBlur = 10;
      ctx.fillStyle = GOLD_BRIGHT;
      ctx.beginPath(); ctx.arc(dotX, dotY, 5, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    };

    const drawHold = (g, delay = 0) => {
      // Concentric pulsing rings (sonar ping) + bright center dot
      const c = rp(g.center);
      if (!c) return;
      const baseR = (g.radius || 0.035) * cw;
      ctx.save();
      // Three rings staggered by 0.55s each, 2.6s cycle
      for (let i = 0; i < 3; i++) {
        const ringPhase = ((cycle * 5 - delay - i * 0.55) / 2.6) % 1;
        if (ringPhase < 0 || ringPhase > 1) continue;
        const scale = 0.55 + ringPhase * 1.65;
        let ringAlpha = 0;
        if (ringPhase < 0.20) ringAlpha = ringPhase / 0.20;
        else                  ringAlpha = 1 - ringPhase;
        ctx.globalAlpha = ringAlpha;
        ctx.strokeStyle = GOLD;
        ctx.lineWidth = 3;
        ctx.shadowColor = "rgba(228, 195, 138, 0.55)";
        ctx.shadowBlur = 10;
        ctx.beginPath(); ctx.arc(c[0], c[1], baseR * scale, 0, Math.PI * 2); ctx.stroke();
      }
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 0.75 + p * 0.25;
      // Center dot
      ctx.fillStyle = GOLD_BRIGHT;
      ctx.shadowColor = "rgba(242, 217, 166, 0.95)";
      ctx.shadowBlur = 8;
      ctx.beginPath(); ctx.arc(c[0], c[1], Math.max(4, baseR * 0.30), 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    };

    const drawPoint = (g, delay = 0) => {
      const c = rp(g.center);
      if (!c) return;
      const r = (g.radius || 0.018) * cw;
      ctx.save();
      ctx.globalAlpha = 0.6 + p * 0.4;
      // Soft halo
      ctx.fillStyle = "rgba(228, 195, 138, 0.30)";
      ctx.beginPath(); ctx.arc(c[0], c[1], r * 2.4, 0, Math.PI * 2); ctx.fill();
      // Core
      ctx.shadowColor = "rgba(242, 217, 166, 0.95)";
      ctx.shadowBlur = 10;
      ctx.fillStyle = GOLD_BRIGHT;
      ctx.beginPath(); ctx.arc(c[0], c[1], r, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    };

    const drawWave = (g, delay = 0) => {
      const a = rp(g.from);
      const b = rp(g.to);
      if (!a || !b) return;
      const dx = b[0] - a[0], dy = b[1] - a[1];
      const len = Math.hypot(dx, dy);
      const ux = dx / len, uy = dy / len;
      const perpX = -uy, perpY = ux;
      const amp = 18;
      const local = ((cycle * 5 - delay) % 5) / 5;
      let progress = 0, alpha = 1;
      if (local < 0.06)       { progress = 0;                 alpha = 0; }
      else if (local < 0.50)  { progress = (local - 0.06) / 0.44; alpha = 1; }
      else if (local < 0.80)  { progress = 1;                 alpha = 1; }
      else if (local < 0.92)  { progress = 1;                 alpha = 1 - (local - 0.80) / 0.12; }
      else                    { progress = 1;                 alpha = 0; }
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

    // Render every gesture in the current step
    for (const g of step.gestures) {
      const delay = g.delay || 0;
      switch (g.type) {
        case "arrow":  drawArrow(g, delay);          break;
        case "curve":  drawCurve(g, delay);          break;
        case "circle": drawCircleGesture(g, delay);  break;
        case "hold":   drawHold(g, delay);           break;
        case "point":  drawPoint(g, delay);          break;
        case "wave":   drawWave(g, delay);           break;
      }
    }
  }, []);

  // ── Step timer during mirror phase ────────────────────────────────────────
  useEffect(() => {
    if (phase !== "mirror" || !activeRitual) return;
    const secs = activeRitual.steps[stepIdx]?.duration || 30;
    setStepSecs(secs);
    clearInterval(stepTmr.current);
    stepTmr.current = setInterval(() => {
      setStepSecs(t => { if (t <= 1) { clearInterval(stepTmr.current); return 0; } return t - 1; });
    }, 1000);
    return () => clearInterval(stepTmr.current);
  }, [phase, activeRitual, stepIdx]);

  // ── Voiceover: try ElevenLabs-generated MP3 first, fall back to browser TTS ─
  // Audio files (when present) should live at /audio/rituals/{ritualId}-{stepIdx}.mp3
  // To populate them, run an ElevenLabs generation script with the step.instruction text.
  const voiceAudioRef = useRef(null);
  useEffect(() => {
    if (!voiceEnabled || phase !== "mirror" || !activeRitual) return;
    const step = activeRitual.steps[stepIdx];
    if (!step) return;
    const text = `${step.title}. ${step.instruction || ""}`.trim();

    // Stop any prior speech / audio playback first
    try { window.speechSynthesis?.cancel(); } catch {}
    if (voiceAudioRef.current) { try { voiceAudioRef.current.pause(); } catch {} voiceAudioRef.current = null; }

    // Try recorded ElevenLabs audio
    const url = `/audio/rituals/${activeRitual.id}-${stepIdx}.mp3`;
    const audio = new Audio(url);
    audio.volume = 0.95;
    voiceAudioRef.current = audio;
    let speakingBrowserTts = false;
    audio.addEventListener("error", () => {
      // File doesn't exist yet — fall back to browser TTS so the feature still works
      if (!("speechSynthesis" in window)) return;
      try {
        const u = new SpeechSynthesisUtterance(text);
        u.rate = 0.88; u.pitch = 1.02; u.volume = 0.95;
        // Prefer a calm English voice if available
        const voices = window.speechSynthesis.getVoices();
        const preferred = voices.find(v => /en/i.test(v.lang) && /(samantha|ava|jenny|aria|female)/i.test(v.name))
                       || voices.find(v => /en/i.test(v.lang));
        if (preferred) u.voice = preferred;
        speakingBrowserTts = true;
        window.speechSynthesis.speak(u);
      } catch {}
    });
    audio.play().catch(() => { /* error event handles the fallback */ });

    return () => {
      try { audio.pause(); } catch {}
      if (speakingBrowserTts) { try { window.speechSynthesis.cancel(); } catch {} }
    };
  }, [phase, activeRitual, stepIdx, voiceEnabled]);

  // Persist voice toggle
  useEffect(() => {
    try { localStorage.setItem("rhei_mirror_voice", voiceEnabled ? "1" : "0"); } catch {}
  }, [voiceEnabled]);

  // Cancel speech when leaving the mirror phase entirely
  useEffect(() => {
    if (phase !== "mirror") {
      try { window.speechSynthesis?.cancel(); } catch {}
      if (voiceAudioRef.current) { try { voiceAudioRef.current.pause(); } catch {} voiceAudioRef.current = null; }
    }
  }, [phase]);

  const selectZone = (zoneId) => {
    setChosenZone(zoneId);
    setTimeout(() => {
      const ritualId = ZONE_TO_RITUAL[zoneId];
      const rec = rituals.find(r => r.id === ritualId) || rituals[0];
      setRecommended(rec);
      setPhase("results");
    }, 400);
  };

  const startRitual = async (ritual) => {
    setActiveRitual(ritual);
    setStepIdx(0);
    setPhase("mirror");
    // Open camera now — only when ritual actually starts
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode:"user", width:{ ideal:1280 }, height:{ ideal:720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        const vw = videoRef.current.videoWidth  || 640;
        const vh = videoRef.current.videoHeight || 480;
        if (canvasRef.current) { canvasRef.current.width = vw; canvasRef.current.height = vh; }
        // Position the canvas to exactly match the video's object-fit:cover display region.
        matchCanvasToVideo();
        setCameraReady(true);
        loadMP().catch(() => {});
      }
    } catch { /* camera denied — mirror still works without it */ }
  };

  const nextStep = () => {
    if (!activeRitual) return;
    if (stepIdx + 1 >= activeRitual.steps.length) setPhase("complete");
    else setStepIdx(s => s + 1);
  };

  const prevStep = () => { if (stepIdx > 0) setStepIdx(s => s - 1); };

  // ═══════════════════════════════════════
  // RENDER: PERMISSION
  // ═══════════════════════════════════════
  if (phase === "permission") return (
    <div style={{ position:"fixed", inset:0, background:B.bgDeep, zIndex:200, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"32px 24px" }}>
      <button onClick={onClose} style={{ position:"absolute", top:20, left:20, background:"none", border:"none", cursor:"pointer", display:"flex", alignItems:"center", gap:4, color:B.muted, fontFamily:SF, fontSize:12 }}>
        <ChevronLeft size={16}/><span>Back</span>
      </button>
      <div style={{ textAlign:"center", marginBottom:40 }}>
        <div style={{ width:80, height:80, borderRadius:"50%", background:"rgba(196,154,75,0.1)", border:"1px solid rgba(196,154,75,0.3)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 24px" }}>
          <Camera size={32} color={B.gold}/>
        </div>
        <p style={{ fontSize:9, letterSpacing:3, color:B.gold, textTransform:"uppercase", fontFamily:SF, marginBottom:10 }}>Smart Face Scan</p>
        <h1 style={{ fontSize:26, fontWeight:400, color:B.cream, margin:"0 0 14px", fontFamily:F, lineHeight:1.35 }}>RHEI reads<br/>your face</h1>
        <p style={{ fontSize:13, color:B.muted, lineHeight:1.7, maxWidth:300, margin:"0 auto", fontFamily:SF }}>In seconds, RHEI identifies where you're holding tension today and builds a personalized ritual for exactly that.</p>
      </div>
      <div style={{ background:B.card, borderRadius:14, padding:"16px 20px", marginBottom:32, maxWidth:300, width:"100%", border:B.border }}>
        {["Camera stays on your device only","Nothing is saved or transmitted","Analysis happens entirely locally"].map((t,i) => (
          <div key={i} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:i<2?10:0 }}>
            <Check size={12} color="#5A8A5A"/><span style={{ fontSize:12, color:B.creamMuted, fontFamily:SF }}>{t}</span>
          </div>
        ))}
      </div>
      <button onClick={openCamera} style={{ width:"100%", maxWidth:300, background:B.goldGrad, border:"none", borderRadius:28, padding:"16px", cursor:"pointer", color:B.warmBlack, fontSize:14, fontFamily:SF, letterSpacing:1, fontWeight:600, boxShadow:"0 6px 28px rgba(196,154,75,0.28)", marginBottom:12 }}>
        Begin Face Scan
      </button>
      <button onClick={() => setPhase("checkin")} style={{ background:"none", border:"none", color:B.muted, fontSize:12, fontFamily:SF, cursor:"pointer", padding:8 }}>
        Skip scan
      </button>
    </div>
  );

  // ═══════════════════════════════════════
  // RENDER: SCAN
  // ═══════════════════════════════════════
  if (phase === "scan") return (
    <div style={{ position:"fixed", inset:0, background:"#000", zIndex:200, overflow:"hidden" }}>
      <video ref={videoRef} playsInline muted autoPlay style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover", transform:"scaleX(-1)" }}/>
      <canvas ref={canvasRef} style={{ position:"absolute", inset:0, width:"100%", height:"100%", transform:"scaleX(-1)" }}/>
      <div style={{ position:"absolute", inset:0, background:"linear-gradient(to bottom, rgba(26,15,6,0.6) 0%, transparent 25%, transparent 65%, rgba(26,15,6,0.92) 100%)" }}/>
      {/* Face oval guide */}
      <div style={{ position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-54%)", width:175, height:235, borderRadius:"50% 50% 46% 46%", border:"1.5px solid rgba(196,154,75,0.5)", pointerEvents:"none" }}/>
      <p style={{ position:"absolute", top:28, left:0, right:0, textAlign:"center", fontSize:9, letterSpacing:3, color:B.gold, textTransform:"uppercase", fontFamily:SF }}>Reading your face</p>
      <div style={{ position:"absolute", bottom:56, left:0, right:0, padding:"0 44px", textAlign:"center" }}>
        <div style={{ width:"100%", height:2, background:"rgba(196,154,75,0.15)", borderRadius:1, marginBottom:14 }}>
          <div style={{ width:`${scanPct}%`, height:"100%", background:B.goldGrad, borderRadius:1, transition:"width 0.08s linear" }}/>
        </div>
        <p style={{ fontSize:13, color:B.cream, fontFamily:F, marginBottom:4 }}>{SCAN_STEPS[scanStep]}</p>
        <p style={{ fontSize:11, color:B.muted, fontFamily:SF }}>{scanPct}%</p>
      </div>
    </div>
  );

  // ═══════════════════════════════════════
  // RENDER: CHECKIN
  // ═══════════════════════════════════════
  if (phase === "checkin") return (
    <div style={{ position:"fixed", inset:0, background:B.bgDeep, zIndex:200, overflowY:"auto" }}>
      <video ref={videoRef} playsInline muted autoPlay style={{ position:"fixed", inset:0, width:"100%", height:"100%", objectFit:"cover", opacity:0.06, transform:"scaleX(-1)", pointerEvents:"none" }}/>
      <div style={{ position:"fixed", inset:0, background:"rgba(26,15,6,0.95)", pointerEvents:"none" }}/>
      <div style={{ position:"relative", zIndex:2, maxWidth:420, margin:"0 auto", padding:"56px 22px 80px" }}>
        <button onClick={onClose} style={{ position:"absolute", top:16, left:16, background:"none", border:"none", cursor:"pointer", display:"flex", alignItems:"center", gap:4, color:B.muted, fontFamily:SF, fontSize:12 }}>
          <ChevronLeft size={16}/><span>Back</span>
        </button>
        <div style={{ textAlign:"center", marginBottom:28 }}>
          <p style={{ fontSize:9, letterSpacing:3, color:B.gold, textTransform:"uppercase", fontFamily:SF, marginBottom:8 }}>Face Check-In</p>
          <h2 style={{ fontSize:22, fontWeight:400, color:B.cream, margin:"0 0 8px", fontFamily:F }}>Where do you feel tension today?</h2>
          <p style={{ fontSize:13, color:B.muted, fontStyle:"italic", fontFamily:F }}>Tap the area that feels tight, heavy, or held.</p>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {ZONES.map(z => {
            const isSelected = chosenZone === z.id;
            return (
              <button key={z.id} onClick={() => selectZone(z.id)}
                style={{ width:"100%", background: isSelected ? `${z.color}15` : B.card, border:`2px solid ${isSelected ? z.color : B.border}`, borderRadius:16, padding:"14px 16px", cursor:"pointer", textAlign:"left", display:"flex", alignItems:"center", gap:14, transition:"all 0.2s" }}>
                <div style={{ width:40, height:40, borderRadius:12, background:`${z.color}15`, border:`1px solid ${z.color}35`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                  <FaceGuideIllustration zone={z.illustration} size={30}/>
                </div>
                <div style={{ flex:1 }}>
                  <p style={{ fontSize:14, color:B.cream, margin:0, fontFamily:SF, fontWeight:500 }}>{z.label}</p>
                  <p style={{ fontSize:11, color:B.muted, margin:"2px 0 0", fontFamily:SF }}>{z.desc}</p>
                </div>
                {isSelected && <Check size={16} color={z.color}/>}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

  // ═══════════════════════════════════════
  // RENDER: RESULTS
  // ═══════════════════════════════════════
  if (phase === "results" && recommended) {
    const zone = ZONES.find(z => z.id === chosenZone) || ZONES[3];
    const isLocked = recommended.isPremium && !isPremium;
    const freeRitual = rituals.find(r => !r.isPremium) || rituals[0];
    return (
      <div style={{ position:"fixed", inset:0, background:B.bgDeep, zIndex:200, overflowY:"auto" }}>
        <video ref={videoRef} playsInline muted autoPlay style={{ position:"fixed", inset:0, width:"100%", height:"100%", objectFit:"cover", opacity:0.06, transform:"scaleX(-1)", pointerEvents:"none" }}/>
        <div style={{ position:"fixed", inset:0, background:"rgba(26,15,6,0.96)", pointerEvents:"none" }}/>
        <div style={{ position:"relative", zIndex:2, maxWidth:420, margin:"0 auto", padding:"56px 22px 100px" }}>
          <button onClick={onClose} style={{ position:"absolute", top:16, left:16, background:"none", border:"none", cursor:"pointer", display:"flex", alignItems:"center", gap:4, color:B.muted, fontFamily:SF, fontSize:12 }}>
            <ChevronLeft size={16}/><span>Back</span>
          </button>
          <div style={{ textAlign:"center", marginBottom:28 }}>
            <p style={{ fontSize:9, letterSpacing:3, color:B.gold, textTransform:"uppercase", fontFamily:SF, marginBottom:8 }}>Your Protocol</p>
            <h2 style={{ fontSize:22, fontWeight:400, color:B.cream, margin:"0 0 6px", fontFamily:F }}>
              {zone.id === "full" ? "A complete reset for your face." : `Your ${zone.label.toLowerCase()} needs attention.`}
            </h2>
          </div>
          {/* Editorial insight */}
          <div style={{ background:B.card, borderRadius:18, padding:"20px", marginBottom:16, border:B.border }}>
            <p style={{ fontSize:9, letterSpacing:2, color:B.gold, textTransform:"uppercase", fontFamily:SF, margin:"0 0 12px" }}>Your Focus Today</p>
            <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:14 }}>
              <div style={{ width:48, height:48, borderRadius:12, background:"rgba(196,154,75,0.08)", border:B.border, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                <FaceGuideIllustration zone={zone.illustration} size={36}/>
              </div>
              <div>
                <p style={{ fontSize:16, color:B.cream, fontWeight:400, margin:"0 0 2px", fontFamily:F }}>{zone.label}</p>
                <p style={{ fontSize:12, color:B.muted, margin:0, fontFamily:SF }}>{zone.desc}</p>
              </div>
            </div>
            <p style={{ fontSize:13, color:B.creamMuted, margin:0, fontFamily:SF, lineHeight:1.65, fontStyle:"italic" }}>
              {{
                jaw:      "The jaw is where stress lives first. The masseter and mandibular chain hold tension long after the moment has passed — often for days. Your ritual targets exactly this.",
                brow:     "The corrugator and frontalis muscles furrow and hold without you noticing. Your ritual works the temporal fascia and brow line to release what accumulated here.",
                undereye: "The orbital area is the first to show fatigue, fluid, and held emotion. Your ritual drains the lymphatic pathways that run through this zone and restore clarity.",
                full:     "A complete reset. Your ritual moves through every zone — jaw, cheeks, orbital, forehead — in sequence. The full arc of release.",
              }[chosenZone] || "Your ritual is built around what you're holding today."}
            </p>
          </div>
          {/* Recommended ritual */}
          <div style={{ background:B.card, borderRadius:18, padding:"20px", marginBottom:20, border:"1px solid rgba(196,154,75,0.3)" }}>
            <p style={{ fontSize:9, letterSpacing:2, color:B.gold, textTransform:"uppercase", fontFamily:SF, margin:"0 0 10px" }}>Recommended</p>
            <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:12 }}>
              <FaceGuideIllustration zone={zone.illustration} size={60}/>
              <div>
                <h3 style={{ fontSize:18, color:B.cream, fontWeight:400, margin:"0 0 3px", fontFamily:F }}>{recommended.title}</h3>
                <p style={{ fontSize:12, color:B.muted, margin:0, fontStyle:"italic" }}>{recommended.subtitle}</p>
              </div>
            </div>
            <p style={{ fontSize:12, color:B.creamMuted, margin:"0 0 12px", fontFamily:SF, lineHeight:1.55 }}>{recommended.description}</p>
            <div style={{ display:"flex", gap:16, fontSize:11, color:B.muted, fontFamily:SF }}>
              <span>⏱ {recommended.duration}</span>
              <span>✦ {recommended.steps.length} guided steps</span>
            </div>
          </div>
          <button onClick={() => !isLocked && startRitual(recommended)}
            style={{ width:"100%", background: isLocked ? B.card : B.goldGrad, border: isLocked ? B.border : "none", borderRadius:28, padding:"16px", cursor: isLocked ? "not-allowed" : "pointer", color: isLocked ? B.muted : B.warmBlack, fontSize:14, fontFamily:SF, letterSpacing:1, fontWeight:600, marginBottom:10, boxShadow: isLocked ? "none" : "0 6px 28px rgba(196,154,75,0.28)" }}>
            {isLocked ? "🔒 Premium — unlock to begin" : "Begin Guided Ritual"}
          </button>
          {isLocked && (
            <button onClick={() => startRitual(freeRitual)} style={{ width:"100%", background:"none", border:B.border, borderRadius:28, padding:"13px", cursor:"pointer", color:B.creamMuted, fontSize:12, fontFamily:SF, marginBottom:16 }}>
              Try {freeRitual.title} (free)
            </button>
          )}
          <p style={{ fontSize:9, letterSpacing:2, color:B.muted, textTransform:"uppercase", fontFamily:SF, margin:"8px 0 10px", textAlign:"center" }}>All rituals</p>
          {rituals.map(r => {
            const locked = r.isPremium && !isPremium;
            return (
              <button key={r.id} onClick={() => !locked && startRitual(r)}
                style={{ width:"100%", background:"rgba(58,37,22,0.5)", border:`1px solid ${r.id===recommended.id ? "rgba(196,154,75,0.35)" : B.border}`, borderRadius:13, padding:"12px 16px", marginBottom:8, cursor: locked ? "not-allowed" : "pointer", textAlign:"left", display:"flex", alignItems:"center", justifyContent:"space-between", opacity: locked ? 0.5 : 1 }}>
                <div>
                  <p style={{ fontSize:13, color:B.cream, margin:0, fontFamily:SF, fontWeight:500 }}>{r.title}</p>
                  <p style={{ fontSize:11, color:B.muted, margin:"2px 0 0", fontFamily:SF }}>{r.duration} · {r.steps.length} steps</p>
                </div>
                {locked ? <span style={{ fontSize:9, color:B.gold, fontFamily:SF, letterSpacing:1 }}>PREMIUM</span> : <ArrowRight size={14} color={B.gold}/>}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════
  // RENDER: MIRROR — split screen
  // ═══════════════════════════════════════
  if (phase === "mirror" && activeRitual) {
    const step      = activeRitual.steps[stepIdx];
    const total     = activeRitual.steps.length;
    const stepPct   = step ? ((step.duration - stepSecs) / step.duration) * 100 : 0;
    const overlayZ  = OVERLAYS[activeRitual.id]?.[stepIdx];
    const illustZ   = OVERLAY_TO_ILLUS[overlayZ] || step?.zone || "full";

    return (
      <div style={{ position:"fixed", inset:0, background:"#000", zIndex:200, overflow:"hidden" }}>
        {/* ── AR camera region ─────────────────────────────────────────────────────
           Video uses object-fit:cover (face fills the screen). Canvas is positioned
           absolutely and JS-sized to exactly match the video's cover-cropped display
           region (computed in matchCanvasToVideo). This makes MediaPipe landmark
           coordinates land precisely on the actual face position, regardless of phone
           aspect ratio. Re-runs on window resize / orientation change.
        ─────────────────────────────────────────────────────────────────────────── */}
        <video ref={videoRef} playsInline muted autoPlay
          style={{
            position:"absolute", inset:0, width:"100%", height:"100%",
            objectFit:"cover",
            transform:"scaleX(-1)",
          }}/>
        <canvas ref={canvasRef}
          style={{
            // width/height/left/top are set by matchCanvasToVideo() to match the cover crop region.
            position:"absolute",
            transform:"scaleX(-1)",
            pointerEvents:"none",
          }}/>

        {/* Top vignette + nav controls (translucent, overlay) */}
        <div style={{ position:"absolute", top:0, left:0, right:0, height:140, background:"linear-gradient(to bottom, rgba(26,15,6,0.88) 0%, rgba(26,15,6,0.5) 55%, transparent 100%)", pointerEvents:"none", zIndex:3 }}/>
        <div style={{ position:"absolute", top:18, left:0, right:0, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 20px", zIndex:5 }}>
          <button onClick={onClose} style={{ background:"rgba(26,15,6,0.55)", backdropFilter:"blur(10px)", border:"1px solid rgba(196,154,75,0.22)", borderRadius:22, padding:"8px 16px", cursor:"pointer", display:"flex", alignItems:"center", gap:5, color:B.cream, fontFamily:SF, fontSize:11 }}>
            <X size={13}/><span>Exit</span>
          </button>
          <p style={{ fontSize:11, letterSpacing:3, color:B.gold, textTransform:"uppercase", fontFamily:SF, textShadow:"0 1px 8px rgba(0,0,0,0.6)" }}>{activeRitual.title}</p>
          {/* Voice toggle — switches between recorded voiceover (or browser TTS fallback) and silent */}
          <button
            onClick={() => setVoiceEnabled(v => !v)}
            aria-label={voiceEnabled ? "Mute voice" : "Unmute voice"}
            style={{
              background:"rgba(26,15,6,0.55)", backdropFilter:"blur(10px)",
              border:"1px solid rgba(196,154,75,0.22)",
              borderRadius:"50%", width:38, height:38,
              cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center",
              color: voiceEnabled ? B.gold : B.muted,
              padding:0,
            }}>
            {voiceEnabled ? <Volume2 size={16}/> : <VolumeX size={16}/>}
          </button>
        </div>
        {/* Step dots — anchored to the top nav, not floating in the middle */}
        <div style={{ position:"absolute", top:60, left:0, right:0, display:"flex", gap:4, justifyContent:"center", zIndex:5 }}>
          {activeRitual.steps.map((_,i) => (
            <div key={i} style={{ width:i===stepIdx?22:6, height:3, borderRadius:2, background:i<stepIdx?B.gold:i===stepIdx?B.goldLight:"rgba(196,154,75,0.3)", transition:"all 0.4s", boxShadow:i===stepIdx?"0 0 8px rgba(196,154,75,0.4)":"none" }}/>
          ))}
        </div>

        {/* ── Reference diagram (small floating card, top-right) ── */}
        {/* Shows the abstract technique zone so the user has both their live face AND the reference at once */}
        <div style={{
          position:"absolute",
          top:84,
          right:14,
          zIndex:5,
          background:"rgba(26,15,6,0.55)",
          backdropFilter:"blur(12px)",
          border:"1px solid rgba(196,154,75,0.22)",
          borderRadius:14,
          padding:10,
          boxShadow:"0 6px 20px rgba(0,0,0,0.35)",
        }}>
          <FaceGuideIllustration zone={illustZ} size={70}/>
          <p style={{
            fontSize:7,
            letterSpacing:1.5,
            color:B.gold,
            textTransform:"uppercase",
            fontFamily:SF,
            margin:"6px 0 0",
            textAlign:"center",
          }}>Zone</p>
        </div>

        {/* ── Bottom: floating instruction card over translucent gradient ── */}
        <div style={{
          position:"absolute", bottom:0, left:0, right:0,
          background:"linear-gradient(to top, rgba(26,15,6,0.97) 0%, rgba(26,15,6,0.88) 50%, rgba(26,15,6,0.55) 85%, transparent 100%)",
          padding:"56px 20px 28px",
          zIndex:4,
        }}>
          {/* Time bar */}
          <div style={{ width:"100%", height:2, background:"rgba(196,154,75,0.18)", borderRadius:1, marginBottom:18 }}>
            <div style={{ width:`${stepPct}%`, height:"100%", background:B.goldGrad, borderRadius:1, transition:"width 0.8s linear", boxShadow:`0 0 6px rgba(196,154,75,0.4)` }}/>
          </div>

          {/* Step info — progressively revealed, larger type for readability */}
          {step && (
            <>
              {/* Progressive-reveal keyframes (scoped here, re-triggered per step via key) */}
              <style>{`@keyframes rhei-rise { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`}</style>

              {/* key={stepIdx} causes the wrapper to remount on each step, re-triggering the staggered fade-ins */}
              <div key={stepIdx} style={{ textAlign:"center", marginBottom:22 }}>
                <p style={{
                  fontSize:12, letterSpacing:2.5, color:B.gold, textTransform:"uppercase", fontFamily:SF, fontWeight:600,
                  margin:"0 0 14px",
                  animation:"rhei-rise 0.5s ease 0s both",
                  textShadow:"0 1px 6px rgba(0,0,0,0.7)",
                }}>Step {stepIdx+1} of {total} · {stepSecs}s</p>

                <h3 style={{
                  fontSize:34, color:B.cream, fontWeight:400, margin:"0 0 14px", fontFamily:F, lineHeight:1.22,
                  animation:"rhei-rise 0.6s ease 0.2s both",
                  textShadow:"0 2px 18px rgba(0,0,0,0.85), 0 1px 4px rgba(0,0,0,0.6)",
                }}>{step.title}</h3>

                {step.direction && (
                  <p style={{
                    fontSize:13, color:B.gold, fontFamily:SF, display:"inline-block",
                    background:"rgba(196,154,75,0.2)",
                    border:"1px solid rgba(196,154,75,0.35)",
                    padding:"5px 16px", borderRadius:16, margin:"0 0 14px",
                    letterSpacing:0.5, fontWeight:500,
                    animation:"rhei-rise 0.6s ease 0.4s both",
                  }}>{step.direction}</p>
                )}

                <p style={{
                  fontSize:18, color:B.cream, margin:"0 auto", fontFamily:F, fontStyle:"italic",
                  lineHeight:1.55, maxWidth:380,
                  animation:"rhei-rise 0.6s ease 0.5s both",
                  textShadow:"0 1px 12px rgba(0,0,0,0.8), 0 0 4px rgba(0,0,0,0.5)",
                }}>{step.instruction}</p>
              </div>

              {/* Controls — larger touch targets and clearer text for 1m-distance use */}
              <div style={{ display:"flex", gap:12, width:"100%", maxWidth:440, margin:"0 auto" }}>
                {stepIdx > 0 && <button onClick={prevStep} style={{ flex:"0 0 auto", background:"rgba(58,37,22,0.7)", backdropFilter:"blur(8px)", border:"1px solid rgba(196,154,75,0.22)", borderRadius:26, padding:"16px 22px", cursor:"pointer", color:B.cream, fontSize:18, fontFamily:SF }}>←</button>}
                <button onClick={nextStep}
                  style={{ flex:1, background: stepSecs<=0 ? B.goldGrad : "rgba(58,37,22,0.7)", backdropFilter: stepSecs<=0 ? "none" : "blur(8px)", border: stepSecs<=0 ? "none" : "1px solid rgba(196,154,75,0.22)", borderRadius:26, padding:"18px", cursor:"pointer", color: stepSecs<=0 ? B.warmBlack : B.cream, fontSize:16, fontFamily:SF, fontWeight: stepSecs<=0 ? 600 : 500, letterSpacing:0.8 }}>
                  {stepSecs<=0 ? (stepIdx+1>=total ? "Finish ✦" : "Next Step →") : "Skip →"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════
  // RENDER: COMPLETE
  // ═══════════════════════════════════════
  if (phase === "complete") return (
    <div style={{ position:"fixed", inset:0, background:B.bgDeep, zIndex:200, display:"flex", alignItems:"center", justifyContent:"center", padding:"32px 24px" }}>
      <video ref={videoRef} playsInline muted autoPlay style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover", opacity:0.06, transform:"scaleX(-1)" }}/>
      <div style={{ position:"absolute", inset:0, background:"rgba(26,15,6,0.94)" }}/>
      <div style={{ position:"relative", zIndex:2, textAlign:"center", maxWidth:340 }}>
        <div style={{ width:80, height:80, borderRadius:"50%", background:"rgba(196,154,75,0.1)", border:"1px solid rgba(196,154,75,0.3)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 24px" }}>
          <Sparkles size={32} color={B.gold}/>
        </div>
        <p style={{ fontSize:9, letterSpacing:3, color:B.gold, textTransform:"uppercase", fontFamily:SF, marginBottom:8 }}>Ritual Complete</p>
        <h2 style={{ fontSize:22, color:B.cream, fontWeight:400, margin:"0 0 10px", fontFamily:F, lineHeight:1.4 }}>Your face just released held tension.</h2>
        <p style={{ fontSize:13, color:B.muted, fontStyle:"italic", margin:"0 0 28px", fontFamily:F }}>Your nervous system is ready to complete the work.</p>
        <div style={{ background:B.card, borderRadius:16, padding:"18px 20px", marginBottom:22, border:B.border, textAlign:"left" }}>
          <p style={{ fontSize:9, letterSpacing:2, color:B.gold, textTransform:"uppercase", fontFamily:SF, margin:"0 0 6px" }}>Continue with</p>
          <p style={{ fontSize:16, color:B.cream, fontWeight:400, margin:"0 0 3px", fontFamily:F }}>{POST_RITUAL_AUDIO.name}</p>
          <p style={{ fontSize:12, color:B.muted, margin:0, fontFamily:SF }}>{POST_RITUAL_AUDIO.duration} · {POST_RITUAL_AUDIO.desc}</p>
        </div>
        <button onClick={() => { onTransitionToReset?.(POST_RITUAL_AUDIO.id); onClose(); }}
          style={{ width:"100%", background:B.goldGrad, border:"none", borderRadius:28, padding:"16px", cursor:"pointer", color:B.warmBlack, fontSize:14, fontFamily:SF, letterSpacing:1, fontWeight:600, marginBottom:12, boxShadow:"0 6px 28px rgba(196,154,75,0.28)" }}>
          Continue to Audio Reset
        </button>
        <button onClick={onClose} style={{ background:"none", border:"none", color:B.muted, fontSize:12, fontFamily:SF, cursor:"pointer", padding:8 }}>
          Done for now
        </button>
      </div>
    </div>
  );

  return null;
}
