import { useState, useEffect, useRef, useCallback } from "react";
import { X, Camera, ChevronLeft, Check, ArrowRight, Sparkles } from "lucide-react";

/* ═══════════════════════════════════════════
   RHEI — Face Mirror Mode
   Smart face scan + live AR ritual guidance
   ═══════════════════════════════════════════ */

const B = {
  bg: "#2D1B0E", bgDeep: "#231408", card: "#3A2516",
  gold: "#C49A4B", goldLight: "#D4AD6A",
  cream: "#F2E8D9", creamMuted: "#C9B99F", muted: "#8A7560",
  warmBlack: "#1A0F06",
  goldGrad: "linear-gradient(135deg, #C49A4B 0%, #D4AD6A 50%, #C49A4B 100%)",
};
const F = "'Georgia','Times New Roman',serif";
const SF = "system-ui,-apple-system,sans-serif";

// ── Key MediaPipe face landmark indices ──────────────────────────────────────
const LM = {
  chin:           152,
  leftJawHinge:   234,
  rightJawHinge:  454,
  leftJaw:        [172, 136, 150, 149, 148, 176],
  rightJaw:       [397, 365, 379, 378, 400, 377],
  leftBrowInner:  107,
  leftBrowOuter:  70,
  rightBrowInner: 336,
  rightBrowOuter: 300,
  leftUnderEye:   [173, 157, 158, 159, 160, 161],
  rightUnderEye:  [398, 384, 385, 386, 387, 388],
  leftCheek:      [116, 117, 118, 101],
  rightCheek:     [345, 346, 347, 330],
  leftTemple:     21,
  rightTemple:    251,
  foreheadCenter: 10,
  leftForeheadMid:66,
  rightForeheadMid:296,
  noseTip:        1,
  leftNasalWing:  64,
  rightNasalWing: 294,
  leftMouthCorner:61,
  rightMouthCorner:291,
};

// ── Per-step overlay config per ritual ───────────────────────────────────────
const STEP_OVERLAYS = {
  "gua-sha": [
    { dots: [],                                                                   type: null },
    { dots: [LM.chin, LM.leftJawHinge, LM.rightJawHinge],                       type: "neck_down" },
    { dots: [...LM.leftJaw, ...LM.rightJaw, LM.chin],                           type: "jawline_out" },
    { dots: [...LM.leftCheek, ...LM.rightCheek],                                 type: "cheek_lift" },
    { dots: [...LM.leftUnderEye, ...LM.rightUnderEye],                           type: "undereye_out" },
    { dots: [LM.leftBrowInner, LM.leftBrowOuter, LM.rightBrowInner, LM.rightBrowOuter], type: "brow_out" },
    { dots: [LM.foreheadCenter, LM.leftForeheadMid, LM.rightForeheadMid],        type: "forehead_up" },
    { dots: [LM.chin, LM.leftJawHinge, LM.rightJawHinge],                       type: "neck_down" },
  ],
  "lymphatic": [
    { dots: [LM.leftJawHinge, LM.rightJawHinge],                                 type: "pulse_nodes" },
    { dots: [LM.leftJawHinge, LM.rightJawHinge, LM.chin],                       type: "neck_down" },
    { dots: [LM.foreheadCenter, LM.leftForeheadMid, LM.rightForeheadMid],        type: "forehead_drain" },
    { dots: [...LM.leftUnderEye, ...LM.rightUnderEye],                           type: "orbital_circle" },
    { dots: [...LM.leftCheek, ...LM.rightCheek],                                 type: "cheek_out" },
    { dots: [...LM.leftJaw, ...LM.rightJaw],                                     type: "jawline_out" },
    { dots: [LM.chin, LM.leftJawHinge, LM.rightJawHinge],                       type: "neck_down" },
  ],
  "face-lift": [
    { dots: [LM.leftTemple, LM.rightTemple],                                     type: "temple_circles" },
    { dots: [LM.leftBrowInner, LM.leftBrowOuter, LM.rightBrowInner, LM.rightBrowOuter], type: "brow_up" },
    { dots: [...LM.leftCheek, ...LM.rightCheek],                                 type: "cheek_hook_up" },
    { dots: [LM.leftNasalWing, LM.rightNasalWing, ...LM.leftCheek.slice(0,2), ...LM.rightCheek.slice(0,2)], type: "nasolabial_up" },
    { dots: [...LM.leftJaw, ...LM.rightJaw],                                     type: "jawline_up" },
    { dots: [LM.leftMouthCorner, LM.rightMouthCorner],                           type: "marionette_up" },
    { dots: [LM.chin, ...LM.leftJaw.slice(0,2), ...LM.rightJaw.slice(0,2)],     type: "neck_up" },
    { dots: [],                                                                   type: null },
  ],
};

// ── Audio reset to pair with each ritual ─────────────────────────────────────
const RITUAL_AUDIO = {
  "gua-sha":    { id: 5, name: "General Reset",     duration: "3 min" },
  "lymphatic":  { id: 3, name: "The Transition",    duration: "4 min" },
  "face-lift":  { id: 1, name: "Morning Reset",     duration: "3 min" },
};

// ── Tension analysis from collected frames ────────────────────────────────────
function analyzeTension(frames) {
  if (!frames || frames.length < 5) {
    return { jawTension: 55, browTension: 45, puffiness: 40 };
  }

  // Average landmark positions across collected frames
  const avg = {};
  for (let i = 0; i < 468; i++) {
    let sx = 0, sy = 0, count = 0;
    for (const frame of frames) {
      if (frame[i]) { sx += frame[i].x; sy += frame[i].y; count++; }
    }
    if (count > 0) avg[i] = { x: sx / count, y: sy / count };
  }

  // Jaw tension: asymmetry between left and right jaw hinge Y positions
  const lJaw = avg[234], rJaw = avg[454], chin = avg[152], nose = avg[1];
  const jawAsym = lJaw && rJaw ? Math.abs(lJaw.y - rJaw.y) * 800 : 30;
  const jawComp = chin && nose ? Math.max(0, (0.18 - (chin.y - nose.y)) * 400) : 20;
  const jawTension = Math.min(95, Math.max(10, jawAsym + jawComp));

  // Brow tension: brow furrow and proximity to each other
  const lBrowI = avg[107], rBrowI = avg[336];
  const browGap = lBrowI && rBrowI ? (rBrowI.x - lBrowI.x) * 100 : 12;
  const browTension = Math.min(95, Math.max(10, (14 - browGap) * 5 + 20));

  // Puffiness: under-eye vertical extent relative to eye
  const lUnder = avg[159], lEyeLow = avg[145];
  const pufRaw = lUnder && lEyeLow ? Math.abs(lEyeLow.y - lUnder.y) * 800 : 18;
  const puffiness = Math.min(95, Math.max(10, (22 - pufRaw) * 2.5 + 25));

  return {
    jawTension: Math.round(jawTension),
    browTension: Math.round(browTension),
    puffiness: Math.round(puffiness),
  };
}

function pickRitual(tension, rituals) {
  const { jawTension, browTension, puffiness } = tension;
  const max = Math.max(jawTension, browTension, puffiness);
  if (max === puffiness  && puffiness  > 45) return rituals.find(r => r.id === "lymphatic") || rituals[0];
  if (max === browTension && browTension > 45) return rituals.find(r => r.id === "face-lift") || rituals[0];
  return rituals.find(r => r.id === "gua-sha") || rituals[0];
}

// ── Canvas drawing helpers ───────────────────────────────────────────────────
function drawArrow(ctx, x1, y1, x2, y2, len = 9) {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  ctx.strokeStyle = B.gold;
  ctx.lineWidth = 1.5;
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - len * Math.cos(angle - Math.PI / 6), y2 - len * Math.sin(angle - Math.PI / 6));
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - len * Math.cos(angle + Math.PI / 6), y2 - len * Math.sin(angle + Math.PI / 6));
  ctx.stroke();
}

function drawLine(ctx, x1, y1, x2, y2, dashed = true) {
  ctx.strokeStyle = B.gold;
  ctx.lineWidth = 1.8;
  if (dashed) ctx.setLineDash([7, 5]);
  else ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawDot(ctx, x, y, pulse = 1) {
  // Outer glow
  ctx.beginPath();
  ctx.arc(x, y, 9 * pulse, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(196,154,75,0.12)`;
  ctx.fill();
  // Inner dot
  ctx.beginPath();
  ctx.arc(x, y, 3.5, 0, Math.PI * 2);
  ctx.fillStyle = B.gold;
  ctx.fill();
}

function renderOverlay(ctx, type, lm, cw, ch, pulse) {
  if (!type || !lm) return;

  const px = (idx) => lm[idx] ? lm[idx].x * cw : null;
  const py = (idx) => lm[idx] ? lm[idx].y * ch : null;

  const chin = { x: px(152), y: py(152) };
  const lJaw = { x: px(234), y: py(234) };
  const rJaw = { x: px(454), y: py(454) };
  const lBi = { x: px(107), y: py(107) };
  const lBo = { x: px(70),  y: py(70)  };
  const rBi = { x: px(336), y: py(336) };
  const rBo = { x: px(300), y: py(300) };
  const lCh = { x: px(116), y: py(116) };
  const rCh = { x: px(345), y: py(345) };
  const lTp = { x: px(21),  y: py(21)  };
  const rTp = { x: px(251), y: py(251) };
  const fhC = { x: px(10),  y: py(10)  };
  const fhL = { x: px(66),  y: py(66)  };
  const fhR = { x: px(296), y: py(296) };
  const lUE = { x: px(159), y: py(159) };
  const rUE = { x: px(386), y: py(386) };
  const lMo = { x: px(61),  y: py(61)  };
  const rMo = { x: px(291), y: py(291) };

  switch (type) {
    case "neck_down":
      if (chin.x && lJaw.x) {
        const offX = cw * 0.03;
        drawLine(ctx, chin.x - offX, chin.y, chin.x - offX, chin.y + ch * 0.09);
        drawLine(ctx, chin.x + offX, chin.y, chin.x + offX, chin.y + ch * 0.09);
        drawArrow(ctx, chin.x, chin.y + ch * 0.02, chin.x, chin.y + ch * 0.09);
      }
      break;

    case "jawline_out":
      if (chin.x && lJaw.x) {
        drawLine(ctx, chin.x, chin.y, lJaw.x, lJaw.y);
        drawArrow(ctx, chin.x, chin.y, lJaw.x, lJaw.y);
      }
      if (chin.x && rJaw.x) {
        drawLine(ctx, chin.x, chin.y, rJaw.x, rJaw.y);
        drawArrow(ctx, chin.x, chin.y, rJaw.x, rJaw.y);
      }
      break;

    case "cheek_lift":
    case "cheek_hook_up":
      if (lCh.x && lTp.x) {
        drawLine(ctx, lCh.x, lCh.y, lTp.x, lTp.y - ch * 0.05);
        drawArrow(ctx, lCh.x, lCh.y, lTp.x, lTp.y - ch * 0.05);
      }
      if (rCh.x && rTp.x) {
        drawLine(ctx, rCh.x, rCh.y, rTp.x, rTp.y - ch * 0.05);
        drawArrow(ctx, rCh.x, rCh.y, rTp.x, rTp.y - ch * 0.05);
      }
      break;

    case "undereye_out":
      if (lUE.x) {
        const lIn = { x: px(173), y: py(173) };
        const lOt = { x: px(161), y: py(161) };
        if (lIn.x && lOt.x) { drawLine(ctx, lIn.x, lIn.y, lOt.x, lOt.y); drawArrow(ctx, lIn.x, lIn.y, lOt.x, lOt.y); }
      }
      if (rUE.x) {
        const rIn = { x: px(398), y: py(398) };
        const rOt = { x: px(388), y: py(388) };
        if (rIn.x && rOt.x) { drawLine(ctx, rIn.x, rIn.y, rOt.x, rOt.y); drawArrow(ctx, rIn.x, rIn.y, rOt.x, rOt.y); }
      }
      break;

    case "brow_out":
      if (lBi.x && lBo.x) { drawLine(ctx, lBi.x, lBi.y, lBo.x, lBo.y); drawArrow(ctx, lBi.x, lBi.y, lBo.x, lBo.y); }
      if (rBi.x && rBo.x) { drawLine(ctx, rBi.x, rBi.y, rBo.x, rBo.y); drawArrow(ctx, rBi.x, rBi.y, rBo.x, rBo.y); }
      break;

    case "brow_up":
      if (lBi.x) { drawLine(ctx, lBi.x, lBi.y, lBi.x, lBi.y - ch * 0.06); drawArrow(ctx, lBi.x, lBi.y, lBi.x, lBi.y - ch * 0.06); }
      if (rBi.x) { drawLine(ctx, rBi.x, rBi.y, rBi.x, rBi.y - ch * 0.06); drawArrow(ctx, rBi.x, rBi.y, rBi.x, rBi.y - ch * 0.06); }
      break;

    case "forehead_up":
    case "forehead_drain":
      if (fhC.x) { drawLine(ctx, fhC.x, fhC.y, fhC.x, fhC.y - ch * 0.08); drawArrow(ctx, fhC.x, fhC.y, fhC.x, fhC.y - ch * 0.08); }
      if (fhL.x) { drawLine(ctx, fhL.x, fhL.y, fhL.x, fhL.y - ch * 0.07); }
      if (fhR.x) { drawLine(ctx, fhR.x, fhR.y, fhR.x, fhR.y - ch * 0.07); }
      break;

    case "orbital_circle":
      if (lUE.x) {
        ctx.strokeStyle = B.gold; ctx.lineWidth = 1.5; ctx.setLineDash([5, 4]);
        ctx.beginPath();
        ctx.ellipse(lUE.x, lUE.y + ch * 0.015, cw * 0.055, ch * 0.022, 0, 0, Math.PI * 2);
        ctx.stroke(); ctx.setLineDash([]);
      }
      if (rUE.x) {
        ctx.strokeStyle = B.gold; ctx.lineWidth = 1.5; ctx.setLineDash([5, 4]);
        ctx.beginPath();
        ctx.ellipse(rUE.x, rUE.y + ch * 0.015, cw * 0.055, ch * 0.022, 0, 0, Math.PI * 2);
        ctx.stroke(); ctx.setLineDash([]);
      }
      break;

    case "cheek_out":
      if (lCh.x && lJaw.x) { drawLine(ctx, lCh.x, lCh.y, lJaw.x + cw * 0.02, lJaw.y); drawArrow(ctx, lCh.x, lCh.y, lJaw.x + cw * 0.02, lJaw.y); }
      if (rCh.x && rJaw.x) { drawLine(ctx, rCh.x, rCh.y, rJaw.x - cw * 0.02, rJaw.y); drawArrow(ctx, rCh.x, rCh.y, rJaw.x - cw * 0.02, rJaw.y); }
      break;

    case "pulse_nodes":
      [234, 454].forEach(idx => {
        if (!lm[idx]) return;
        const nx = lm[idx].x * cw, ny = lm[idx].y * ch;
        const r = 14 + Math.sin(pulse * Math.PI * 2) * 5;
        ctx.strokeStyle = `rgba(196,154,75,${0.4 + Math.sin(pulse * Math.PI * 2) * 0.3})`;
        ctx.lineWidth = 2; ctx.setLineDash([]);
        ctx.beginPath(); ctx.arc(nx, ny, r, 0, Math.PI * 2); ctx.stroke();
      });
      break;

    case "temple_circles":
      [LM.leftTemple, LM.rightTemple].forEach(idx => {
        if (!lm[idx]) return;
        const tx = lm[idx].x * cw, ty = lm[idx].y * ch;
        const r = 18 + Math.sin(pulse * Math.PI * 2) * 4;
        ctx.strokeStyle = B.gold; ctx.lineWidth = 1.5; ctx.setLineDash([4, 3]);
        ctx.beginPath(); ctx.arc(tx, ty, r, 0, Math.PI * 2); ctx.stroke();
        ctx.setLineDash([]);
      });
      break;

    case "nasolabial_up":
      if (lm[64] && lCh.x) {
        const ns = { x: lm[64].x * cw, y: lm[64].y * ch };
        drawLine(ctx, ns.x, ns.y, lCh.x, lCh.y - ch * 0.04);
        drawArrow(ctx, ns.x, ns.y, lCh.x, lCh.y - ch * 0.04);
      }
      if (lm[294] && rCh.x) {
        const ns = { x: lm[294].x * cw, y: lm[294].y * ch };
        drawLine(ctx, ns.x, ns.y, rCh.x, rCh.y - ch * 0.04);
        drawArrow(ctx, ns.x, ns.y, rCh.x, rCh.y - ch * 0.04);
      }
      break;

    case "jawline_up":
      if (chin.x && lJaw.x) {
        drawLine(ctx, chin.x, chin.y, lJaw.x, lJaw.y - ch * 0.02);
        drawArrow(ctx, chin.x, chin.y, lJaw.x, lJaw.y - ch * 0.02);
      }
      if (chin.x && rJaw.x) {
        drawLine(ctx, chin.x, chin.y, rJaw.x, rJaw.y - ch * 0.02);
        drawArrow(ctx, chin.x, chin.y, rJaw.x, rJaw.y - ch * 0.02);
      }
      break;

    case "marionette_up":
      if (lMo.x && lCh.x) { drawLine(ctx, lMo.x, lMo.y, lCh.x, lCh.y - ch * 0.05); drawArrow(ctx, lMo.x, lMo.y, lCh.x, lCh.y - ch * 0.05); }
      if (rMo.x && rCh.x) { drawLine(ctx, rMo.x, rMo.y, rCh.x, rCh.y - ch * 0.05); drawArrow(ctx, rMo.x, rMo.y, rCh.x, rCh.y - ch * 0.05); }
      break;

    case "neck_up":
      if (chin.x) {
        const offX = cw * 0.03;
        drawLine(ctx, chin.x - offX, chin.y + ch * 0.06, chin.x - offX, chin.y);
        drawLine(ctx, chin.x + offX, chin.y + ch * 0.06, chin.x + offX, chin.y);
        drawArrow(ctx, chin.x, chin.y + ch * 0.06, chin.x, chin.y);
      }
      break;

    default: break;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
export default function FaceMirrorMode({ onClose, onTransitionToReset, rituals, isPremium }) {
  const [phase, setPhase] = useState("permission");
  const [scanProgress, setScanProgress] = useState(0);
  const [tension, setTension] = useState(null);
  const [recommended, setRecommended] = useState(null);
  const [activeRitual, setActiveRitual] = useState(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [stepTimeLeft, setStepTimeLeft] = useState(0);
  const [canvasSize, setCanvasSize] = useState({ w: 640, h: 480 });
  const [pulseT, setPulseT] = useState(0);

  const videoRef   = useRef(null);
  const canvasRef  = useRef(null);
  const streamRef  = useRef(null);
  const fmRef      = useRef(null);
  const rafRef       = useRef(null);
  const stepTmrRef   = useRef(null);
  const pulseRef     = useRef(null);
  const scanTmrRef   = useRef(null);   // fallback timeout if MediaPipe stalls

  // Refs to avoid stale closures in rAF callbacks
  const phaseRef       = useRef("permission");
  const activeRitRef   = useRef(null);
  const stepIdxRef     = useRef(0);
  const scanFramesRef  = useRef([]);
  const scanCountRef   = useRef(0);
  const pulseTRef      = useRef(0);

  useEffect(() => { phaseRef.current     = phase;       }, [phase]);
  useEffect(() => { activeRitRef.current = activeRitual; }, [activeRitual]);
  useEffect(() => { stepIdxRef.current   = stepIndex;   }, [stepIndex]);

  // Pulse animation for overlay effects
  useEffect(() => {
    pulseRef.current = setInterval(() => {
      pulseTRef.current = (pulseTRef.current + 0.03) % 1;
      setPulseT(pulseTRef.current);
    }, 30);
    return () => clearInterval(pulseRef.current);
  }, []);

  // Cleanup everything on unmount
  useEffect(() => {
    return () => {
      cancelAnimationFrame(rafRef.current);
      clearInterval(stepTmrRef.current);
      clearInterval(pulseRef.current);
      clearTimeout(scanTmrRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
      if (fmRef.current) try { fmRef.current.close(); } catch {}
    };
  }, []);

  // Load MediaPipe FaceMesh from CDN
  const loadFaceMesh = useCallback(() => new Promise((resolve, reject) => {
    if (window.FaceMesh) { resolve(); return; }
    const s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4.1633559619/face_mesh.js";
    s.crossOrigin = "anonymous";
    s.onload  = () => resolve();
    s.onerror = () => reject(new Error("MediaPipe failed to load"));
    document.head.appendChild(s);
  }), []);

  // Draw the canvas overlay frame
  const drawFrame = useCallback((landmarks) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx  = canvas.getContext("2d");
    const { w: cw, h: ch } = { w: canvas.width, h: canvas.height };

    ctx.clearRect(0, 0, cw, ch);

    const curPhase   = phaseRef.current;
    const curRitual  = activeRitRef.current;
    const curStep    = stepIdxRef.current;
    const pulse      = pulseTRef.current;

    if (!landmarks) return;

    // Scanning phase — just draw a gentle face outline
    if (curPhase === "scanning") {
      const facePoints = [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288,
                          397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136,
                          172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109, 10];
      ctx.strokeStyle = `rgba(196,154,75,${0.3 + pulse * 0.4})`;
      ctx.lineWidth   = 1;
      ctx.setLineDash([4, 6]);
      ctx.beginPath();
      facePoints.forEach((idx, i) => {
        if (!landmarks[idx]) return;
        const x = landmarks[idx].x * cw;
        const y = landmarks[idx].y * ch;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      });
      ctx.stroke();
      ctx.setLineDash([]);
      return;
    }

    if (curPhase !== "mirror" || !curRitual) return;

    const overlayDefs = STEP_OVERLAYS[curRitual.id];
    if (!overlayDefs || !overlayDefs[curStep]) return;
    const { dots, type } = overlayDefs[curStep];

    // Draw landmark dots
    if (dots && dots.length > 0) {
      dots.forEach(idx => {
        if (typeof idx !== "number" || !landmarks[idx]) return;
        const x = landmarks[idx].x * cw;
        const y = landmarks[idx].y * ch;
        drawDot(ctx, x, y, 1 + pulse * 0.15);
      });
    }

    // Draw directional stroke overlay
    renderOverlay(ctx, type, landmarks, cw, ch, pulse);
  }, []);

  // Start camera + face mesh pipeline
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        const vw = videoRef.current.videoWidth  || 640;
        const vh = videoRef.current.videoHeight || 480;
        setCanvasSize({ w: vw, h: vh });
        if (canvasRef.current) { canvasRef.current.width = vw; canvasRef.current.height = vh; }
      }

      await loadFaceMesh();

      const fm = new window.FaceMesh({
        locateFile: (f) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4.1633559619/${f}`,
      });
      fm.setOptions({ maxNumFaces: 1, refineLandmarks: false, minDetectionConfidence: 0.5, minTrackingConfidence: 0.5 });

      fm.onResults((results) => {
        const lm = results.multiFaceLandmarks?.[0];
        if (!lm) return;

        drawFrame(lm);

        // Collect scan frames (only during scanning phase)
        if (phaseRef.current === "scanning" && scanCountRef.current < 30) {
          scanFramesRef.current.push([...lm]);
          scanCountRef.current++;
          const pct = Math.round((scanCountRef.current / 30) * 100);
          setScanProgress(pct);

          if (scanCountRef.current >= 30) {
            clearTimeout(scanTmrRef.current);
            const result = analyzeTension(scanFramesRef.current);
            const rec    = pickRitual(result, rituals);
            setTension(result);
            setRecommended(rec);
            setPhase("results");
          }
        }
      });

      fmRef.current = fm;

      const loop = async () => {
        if (videoRef.current && !videoRef.current.paused && fmRef.current) {
          try { await fmRef.current.send({ image: videoRef.current }); } catch {}
        }
        rafRef.current = requestAnimationFrame(loop);
      };
      rafRef.current = requestAnimationFrame(loop);
      setPhase("scanning");

      // ── Fallback: if MediaPipe stalls or no face detected after 9s, skip ahead ──
      scanTmrRef.current = setTimeout(() => {
        if (phaseRef.current !== "scanning") return;
        const result = scanFramesRef.current.length > 3
          ? analyzeTension(scanFramesRef.current)
          : { jawTension: 58, browTension: 42, puffiness: 36 };
        const rec = pickRitual(result, rituals);
        setTension(result);
        setRecommended(rec);
        setPhase("results");
      }, 9000);

    } catch (err) {
      // Camera denied or MediaPipe failed — graceful fallback
      console.warn("Mirror mode fallback:", err.message);
      setTension({ jawTension: 60, browTension: 45, puffiness: 35 });
      setRecommended(rituals.find(r => r.id === "gua-sha") || rituals[0]);
      setPhase("results");
    }
  }, [loadFaceMesh, drawFrame, rituals]);

  // Step timer when in mirror phase
  useEffect(() => {
    if (phase !== "mirror" || !activeRitual) return;
    const step = activeRitual.steps[stepIndex];
    if (!step) return;
    setStepTimeLeft(step.duration);
    clearInterval(stepTmrRef.current);
    stepTmrRef.current = setInterval(() => {
      setStepTimeLeft(t => { if (t <= 1) { clearInterval(stepTmrRef.current); return 0; } return t - 1; });
    }, 1000);
    return () => clearInterval(stepTmrRef.current);
  }, [phase, activeRitual, stepIndex]);

  const startMirrorRitual = (ritual) => {
    setActiveRitual(ritual);
    setStepIndex(0);
    setPhase("mirror");
  };

  const nextStep = () => {
    if (!activeRitual) return;
    if (stepIndex + 1 >= activeRitual.steps.length) setPhase("complete");
    else setStepIndex(s => s + 1);
  };

  const prevStep = () => { if (stepIndex > 0) setStepIndex(s => s - 1); };

  // ── Shared video + canvas layer (rendered in all camera phases) ────────────
  const CameraLayer = () => (
    <>
      <video
        ref={videoRef}
        playsInline muted autoPlay
        style={{ position:"absolute", top:0, left:0, width:"100%", height:"100%", objectFit:"cover", transform:"scaleX(-1)" }}
      />
      <canvas
        ref={canvasRef}
        width={canvasSize.w}
        height={canvasSize.h}
        style={{ position:"absolute", top:0, left:0, width:"100%", height:"100%", transform:"scaleX(-1)" }}
      />
    </>
  );

  // ═══════════════════════════════════════
  // PHASE: PERMISSION
  // ═══════════════════════════════════════
  if (phase === "permission") return (
    <div style={{ position:"fixed", inset:0, background:B.bgDeep, zIndex:200, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"32px 24px" }}>
      <button onClick={onClose} style={{ position:"absolute", top:20, left:20, background:"none", border:"none", cursor:"pointer", display:"flex", alignItems:"center", gap:4, color:B.muted, fontFamily:SF, fontSize:12 }}>
        <ChevronLeft size={16}/><span>Back</span>
      </button>

      <div style={{ textAlign:"center", marginBottom:40 }}>
        <div style={{ width:80, height:80, borderRadius:"50%", background:`${B.gold}12`, border:`1px solid ${B.gold}30`, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 24px" }}>
          <Camera size={32} color={B.gold}/>
        </div>
        <p style={{ fontSize:9, letterSpacing:3, color:B.gold, textTransform:"uppercase", fontFamily:SF, marginBottom:10 }}>Smart Face Scan</p>
        <h1 style={{ fontSize:26, fontWeight:400, color:B.cream, margin:"0 0 14px", fontFamily:F, lineHeight:1.3 }}>RHEI reads<br/>your face</h1>
        <p style={{ fontSize:13, color:B.muted, lineHeight:1.7, maxWidth:300, margin:"0 auto", fontFamily:SF }}>
          In seconds, RHEI maps where you're holding tension today — jaw, brow, or under-eye — and guides your ritual
          directly on your face in real time.
        </p>
      </div>

      <div style={{ background:B.card, borderRadius:16, padding:"16px 20px", marginBottom:32, border:`1px solid rgba(196,154,75,0.12)`, maxWidth:320, width:"100%" }}>
        {[
          "Your camera never leaves your device",
          "No images are saved or transmitted",
          "All analysis runs locally in your browser",
        ].map((text, i) => (
          <div key={i} style={{ display:"flex", alignItems:"center", gap:10, marginBottom: i < 2 ? 10 : 0 }}>
            <Check size={12} color="#5A8A5A"/>
            <span style={{ fontSize:12, color:B.creamMuted, fontFamily:SF }}>{text}</span>
          </div>
        ))}
      </div>

      <button onClick={startCamera} style={{ width:"100%", maxWidth:320, background:B.goldGrad, border:"none", borderRadius:28, padding:"16px", cursor:"pointer", color:B.warmBlack, fontSize:14, fontFamily:SF, letterSpacing:1, fontWeight:600, boxShadow:`0 6px 28px ${B.gold}30`, marginBottom:12 }}>
        Allow Camera Access
      </button>
      <button
        onClick={() => { setTension({ jawTension:55, browTension:45, puffiness:35 }); setRecommended(rituals.find(r => !r.isPremium) || rituals[0]); setPhase("results"); }}
        style={{ background:"none", border:"none", color:B.muted, fontSize:12, fontFamily:SF, cursor:"pointer", padding:8 }}
      >
        Skip scan — choose ritual manually
      </button>
    </div>
  );

  // ═══════════════════════════════════════
  // PHASE: SCANNING
  // ═══════════════════════════════════════
  if (phase === "scanning") return (
    <div style={{ position:"fixed", inset:0, background:"#000", zIndex:200, overflow:"hidden" }}>
      <CameraLayer/>
      <div style={{ position:"absolute", inset:0, background:"linear-gradient(to bottom, rgba(26,15,6,0.55) 0%, transparent 25%, transparent 65%, rgba(26,15,6,0.9) 100%)", zIndex:2 }}/>

      {/* Face oval guide */}
      <div style={{ position:"absolute", top:"50%", left:"50%", transform:"translate(-50%, -54%)", zIndex:3, pointerEvents:"none" }}>
        <div style={{ width:180, height:240, border:`1.5px solid rgba(196,154,75,${0.3 + pulseT * 0.4})`, borderRadius:"50% 50% 46% 46%", transition:"border-color 0.1s" }}/>
      </div>

      {/* Top label */}
      <div style={{ position:"absolute", top:28, left:0, right:0, textAlign:"center", zIndex:4 }}>
        <p style={{ fontSize:9, letterSpacing:3, color:B.gold, textTransform:"uppercase", fontFamily:SF }}>Reading your face</p>
      </div>

      {/* Bottom progress */}
      <div style={{ position:"absolute", bottom:60, left:0, right:0, padding:"0 40px", textAlign:"center", zIndex:4 }}>
        <div style={{ width:"100%", height:2, background:"rgba(196,154,75,0.15)", borderRadius:1, marginBottom:14 }}>
          {scanProgress > 0
            ? <div style={{ width:`${scanProgress}%`, height:"100%", background:B.goldGrad, borderRadius:1, transition:"width 0.4s" }}/>
            : <div style={{ width:"30%", height:"100%", background:B.goldGrad, borderRadius:1, animation:"rhei-scan-shimmer 1.4s ease-in-out infinite" }}/>
          }
        </div>
        <p style={{ fontSize:13, color:B.cream, fontFamily:F }}>
          {scanProgress === 0 ? "Loading face model…" : "Mapping tension patterns…"}
        </p>
        <p style={{ fontSize:11, color:B.muted, fontFamily:SF, marginTop:4 }}>
          {scanProgress === 0 ? "This takes a few seconds on first load" : `${scanProgress}%`}
        </p>
      </div>
      <style>{`@keyframes rhei-scan-shimmer{0%{margin-left:0;width:30%}50%{margin-left:35%;width:30%}100%{margin-left:70%;width:30%}}`}</style>
    </div>
  );

  // ═══════════════════════════════════════
  // PHASE: RESULTS
  // ═══════════════════════════════════════
  if (phase === "results" && tension && recommended) {
    const zones = [
      { label:"Jaw tension",  value:tension.jawTension,  high: tension.jawTension  > 50 },
      { label:"Brow tension", value:tension.browTension, high: tension.browTension > 50 },
      { label:"Under-eye",    value:tension.puffiness,   high: tension.puffiness   > 50 },
    ];
    const isLocked = recommended.isPremium && !isPremium;

    return (
      <div style={{ position:"fixed", inset:0, background:B.bgDeep, zIndex:200, overflowY:"auto" }}>
        {/* Faint camera background */}
        <video ref={videoRef} playsInline muted autoPlay style={{ position:"fixed", top:0, left:0, width:"100%", height:"100%", objectFit:"cover", opacity:0.08, transform:"scaleX(-1)", pointerEvents:"none" }}/>
        <div style={{ position:"fixed", inset:0, background:"rgba(26,15,6,0.96)", pointerEvents:"none" }}/>

        <div style={{ position:"relative", zIndex:2, maxWidth:430, margin:"0 auto", padding:"60px 24px 100px" }}>
          <button onClick={onClose} style={{ position:"absolute", top:16, left:16, background:"none", border:"none", cursor:"pointer", display:"flex", alignItems:"center", gap:4, color:B.muted, fontFamily:SF, fontSize:12 }}>
            <ChevronLeft size={16}/><span>Back</span>
          </button>

          <div style={{ textAlign:"center", marginBottom:28 }}>
            <p style={{ fontSize:9, letterSpacing:3, color:B.gold, textTransform:"uppercase", fontFamily:SF, marginBottom:8 }}>Scan Complete</p>
            <h2 style={{ fontSize:22, fontWeight:400, color:B.cream, margin:"0 0 6px", fontFamily:F }}>Here's where you're<br/>holding today</h2>
          </div>

          {/* Tension map */}
          <div style={{ background:B.card, borderRadius:18, padding:"20px", marginBottom:16, border:`1px solid rgba(196,154,75,0.12)` }}>
            <p style={{ fontSize:9, letterSpacing:2, color:B.gold, textTransform:"uppercase", fontFamily:SF, margin:"0 0 16px" }}>Tension Map</p>
            {zones.map((z, i) => (
              <div key={i} style={{ marginBottom: i < 2 ? 14 : 0 }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
                  <span style={{ fontSize:12, color:B.creamMuted, fontFamily:SF }}>{z.label}</span>
                  <span style={{ fontSize:12, color: z.high ? "#C4786A" : "#5A8A5A", fontFamily:SF, fontWeight:500 }}>{z.high ? "Elevated" : "Relaxed"}</span>
                </div>
                <div style={{ width:"100%", height:4, background:`${B.gold}12`, borderRadius:2 }}>
                  <div style={{ width:`${z.value}%`, height:"100%", background: z.high ? "#C4786A" : "#5A8A5A", borderRadius:2, opacity:0.75, transition:"width 1.2s ease" }}/>
                </div>
              </div>
            ))}
          </div>

          {/* Recommended */}
          <div style={{ background:B.card, borderRadius:18, padding:"20px", marginBottom:20, border:`1px solid rgba(196,154,75,0.3)` }}>
            <p style={{ fontSize:9, letterSpacing:2, color:B.gold, textTransform:"uppercase", fontFamily:SF, margin:"0 0 10px" }}>Recommended for you now</p>
            <h3 style={{ fontSize:18, color:B.cream, fontWeight:400, margin:"0 0 4px", fontFamily:F }}>{recommended.title}</h3>
            <p style={{ fontSize:12, color:B.goldMuted, margin:"0 0 10px", fontStyle:"italic" }}>{recommended.subtitle}</p>
            <p style={{ fontSize:12, color:B.creamMuted, margin:"0 0 12px", fontFamily:SF, lineHeight:1.5 }}>{recommended.description}</p>
            <div style={{ display:"flex", gap:16, fontSize:11, color:B.muted, fontFamily:SF }}>
              <span>⏱ {recommended.duration}</span>
              <span>✦ {recommended.steps.length} guided steps</span>
              {isLocked && <span style={{ color:B.gold }}>Premium</span>}
            </div>
          </div>

          <button
            onClick={() => !isLocked && startMirrorRitual(recommended)}
            style={{ width:"100%", background: isLocked ? B.card : B.goldGrad, border: isLocked ? `1px solid rgba(196,154,75,0.25)` : "none", borderRadius:28, padding:"16px", cursor: isLocked ? "not-allowed" : "pointer", color: isLocked ? B.muted : B.warmBlack, fontSize:14, fontFamily:SF, letterSpacing:1, fontWeight:600, marginBottom:10, boxShadow: isLocked ? "none" : `0 6px 28px ${B.gold}28` }}
          >
            {isLocked ? "🔒 Unlock Premium to use Mirror Mode" : "Begin Mirror Mode ✦"}
          </button>

          <button
            onClick={() => { const free = rituals.find(r => !r.isPremium) || rituals[0]; startMirrorRitual(free); }}
            style={{ width:"100%", background:"none", border:`1px solid rgba(196,154,75,0.18)`, borderRadius:28, padding:"13px", cursor:"pointer", color:B.creamMuted, fontSize:12, fontFamily:SF, marginBottom:28 }}
          >
            Use standard guide instead
          </button>

          <p style={{ fontSize:9, letterSpacing:2, color:B.muted, textTransform:"uppercase", fontFamily:SF, margin:"0 0 12px", textAlign:"center" }}>Or choose a different ritual</p>
          {rituals.map(r => {
            const locked = r.isPremium && !isPremium;
            return (
              <button
                key={r.id}
                onClick={() => !locked && startMirrorRitual(r)}
                style={{ width:"100%", background:`${B.card}99`, border:`1px solid ${r.id===recommended.id ? "rgba(196,154,75,0.35)" : "rgba(196,154,75,0.1)"}`, borderRadius:14, padding:"14px 16px", marginBottom:8, cursor: locked ? "not-allowed" : "pointer", textAlign:"left", display:"flex", alignItems:"center", justifyContent:"space-between", opacity: locked ? 0.55 : 1 }}
              >
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
  // PHASE: MIRROR — Active ritual + live AR
  // ═══════════════════════════════════════
  if (phase === "mirror" && activeRitual) {
    const step      = activeRitual.steps[stepIndex];
    const total     = activeRitual.steps.length;
    const stepPct   = step ? ((step.duration - stepTimeLeft) / step.duration) * 100 : 0;

    return (
      <div style={{ position:"fixed", inset:0, background:"#000", zIndex:200, overflow:"hidden" }}>
        <CameraLayer/>

        {/* Gradient overlays */}
        <div style={{ position:"absolute", top:0, left:0, right:0, height:"28%", background:"linear-gradient(to bottom, rgba(26,15,6,0.88) 0%, transparent 100%)", zIndex:3, pointerEvents:"none" }}/>
        <div style={{ position:"absolute", bottom:0, left:0, right:0, height:"46%", background:"linear-gradient(to top, rgba(26,15,6,0.97) 0%, rgba(26,15,6,0.65) 60%, transparent 100%)", zIndex:3, pointerEvents:"none" }}/>

        {/* Top UI */}
        <div style={{ position:"absolute", top:0, left:0, right:0, zIndex:10, padding:"18px 20px 0" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
            <button onClick={onClose} style={{ background:"rgba(26,15,6,0.7)", border:"1px solid rgba(196,154,75,0.22)", borderRadius:20, padding:"6px 14px", cursor:"pointer", display:"flex", alignItems:"center", gap:4, color:B.creamMuted, fontFamily:SF, fontSize:11 }}>
              <X size={12}/><span>Exit</span>
            </button>
            <p style={{ fontSize:9, letterSpacing:3, color:B.gold, textTransform:"uppercase", fontFamily:SF }}>{activeRitual.title}</p>
            <div style={{ width:60 }}/>
          </div>
          {/* Step progress */}
          <div style={{ display:"flex", gap:3, justifyContent:"center" }}>
            {activeRitual.steps.map((_, i) => (
              <div key={i} style={{ width: i===stepIndex ? 22 : 6, height:3, borderRadius:2, background: i<stepIndex ? B.gold : i===stepIndex ? B.goldLight : "rgba(196,154,75,0.2)", transition:"all 0.4s" }}/>
            ))}
          </div>
        </div>

        {/* Bottom instruction panel */}
        <div style={{ position:"absolute", bottom:0, left:0, right:0, zIndex:10, padding:"0 20px 44px" }}>
          {step && (
            <>
              {/* Step time bar */}
              <div style={{ width:"100%", height:2, background:"rgba(196,154,75,0.15)", borderRadius:1, marginBottom:14 }}>
                <div style={{ width:`${stepPct}%`, height:"100%", background:B.goldGrad, borderRadius:1, transition:"width 0.8s linear" }}/>
              </div>

              <p style={{ fontSize:9, letterSpacing:2, color:B.gold, textTransform:"uppercase", fontFamily:SF, margin:"0 0 4px" }}>
                Step {stepIndex+1} of {total} · {stepTimeLeft}s
              </p>
              <h3 style={{ fontSize:20, color:B.cream, fontWeight:400, margin:"0 0 4px", fontFamily:F }}>{step.title}</h3>
              {step.direction && (
                <p style={{ fontSize:10, color:B.gold, fontFamily:SF, display:"inline-block", background:`${B.gold}12`, padding:"3px 10px", borderRadius:12, margin:"0 0 8px" }}>{step.direction}</p>
              )}
              <p style={{ fontSize:12, color:B.creamMuted, margin:"0 0 18px", fontFamily:SF, lineHeight:1.6 }}>{step.instruction}</p>

              <div style={{ display:"flex", gap:10 }}>
                {stepIndex > 0 && (
                  <button onClick={prevStep} style={{ flex:"0 0 auto", background:"rgba(58,37,22,0.85)", border:"1px solid rgba(196,154,75,0.2)", borderRadius:24, padding:"12px 20px", cursor:"pointer", color:B.creamMuted, fontSize:13, fontFamily:SF }}>←</button>
                )}
                <button
                  onClick={nextStep}
                  style={{ flex:1, background: stepTimeLeft<=0 ? B.goldGrad : "rgba(58,37,22,0.85)", border: stepTimeLeft<=0 ? "none" : "1px solid rgba(196,154,75,0.28)", borderRadius:24, padding:"13px", cursor:"pointer", color: stepTimeLeft<=0 ? B.warmBlack : B.creamMuted, fontSize:13, fontFamily:SF, fontWeight: stepTimeLeft<=0 ? 600 : 400, letterSpacing:0.5 }}
                >
                  {stepTimeLeft<=0 ? (stepIndex+1>=total ? "Finish ✦" : "Next Step →") : "Skip →"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════
  // PHASE: COMPLETE
  // ═══════════════════════════════════════
  if (phase === "complete") {
    const audioInfo = activeRitual ? RITUAL_AUDIO[activeRitual.id] : RITUAL_AUDIO["gua-sha"];

    return (
      <div style={{ position:"fixed", inset:0, background:B.bgDeep, zIndex:200, display:"flex", alignItems:"center", justifyContent:"center", padding:"32px 24px" }}>
        <video ref={videoRef} playsInline muted autoPlay style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover", opacity:0.07, transform:"scaleX(-1)" }}/>
        <div style={{ position:"absolute", inset:0, background:"rgba(26,15,6,0.93)" }}/>

        <div style={{ position:"relative", zIndex:2, textAlign:"center", maxWidth:340 }}>
          <div style={{ width:80, height:80, borderRadius:"50%", background:`${B.gold}12`, border:`1px solid ${B.gold}30`, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 24px" }}>
            <Sparkles size={32} color={B.gold}/>
          </div>
          <p style={{ fontSize:9, letterSpacing:3, color:B.gold, textTransform:"uppercase", fontFamily:SF, marginBottom:8 }}>Ritual Complete</p>
          <h2 style={{ fontSize:22, color:B.cream, fontWeight:400, margin:"0 0 10px", fontFamily:F, lineHeight:1.4 }}>Your face just released<br/>held tension.</h2>
          <p style={{ fontSize:13, color:B.muted, fontStyle:"italic", margin:"0 0 28px", fontFamily:F }}>Your nervous system is ready to complete the work.</p>

          <div style={{ background:B.card, borderRadius:16, padding:"18px 20px", marginBottom:24, border:`1px solid rgba(196,154,75,0.2)`, textAlign:"left" }}>
            <p style={{ fontSize:9, letterSpacing:2, color:B.gold, textTransform:"uppercase", fontFamily:SF, margin:"0 0 6px" }}>Continue with</p>
            <p style={{ fontSize:16, color:B.cream, fontWeight:400, margin:"0 0 4px", fontFamily:F }}>{audioInfo.name}</p>
            <p style={{ fontSize:12, color:B.muted, margin:0, fontFamily:SF }}>{audioInfo.duration} · Complete the regulation arc</p>
          </div>

          <button
            onClick={() => { onTransitionToReset?.(audioInfo.id); onClose(); }}
            style={{ width:"100%", background:B.goldGrad, border:"none", borderRadius:28, padding:"16px", cursor:"pointer", color:B.warmBlack, fontSize:14, fontFamily:SF, letterSpacing:1, fontWeight:600, marginBottom:12, boxShadow:`0 6px 28px ${B.gold}28` }}
          >
            Continue to Audio Reset
          </button>
          <button onClick={onClose} style={{ background:"none", border:"none", color:B.muted, fontSize:12, fontFamily:SF, cursor:"pointer", padding:8 }}>
            Done for now
          </button>
        </div>
      </div>
    );
  }

  return null;
}
