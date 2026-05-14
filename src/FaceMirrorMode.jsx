import { useState, useEffect, useRef, useCallback } from "react";
import { X, Camera, ChevronLeft, Check, ArrowRight, Sparkles, Play, Pause } from "lucide-react";
import FaceGuideIllustration from "./FaceGuideIllustration";

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
const F  = "'Georgia','Times New Roman',serif";
const SF = "system-ui,-apple-system,sans-serif";

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

    // During mirror: draw step-specific overlay
    if (phasRef.current !== "mirror" || !ritualRef.current) return;
    const overlays = OVERLAYS[ritualRef.current.id];
    if (!overlays) return;
    const type = overlays[stepRef.current];

    const gold = "#C49A4B";
    pulseT.current = (pulseT.current + 0.025) % (Math.PI * 2);
    const p = (Math.sin(pulseT.current) + 1) / 2;

    // Draw a glow dot at a landmark
    const dot = (idx) => {
      const x = px(idx), y = py(idx);
      if (!x) return;
      ctx.beginPath(); ctx.arc(x, y, 8+p*3, 0, Math.PI*2);
      ctx.fillStyle = `rgba(196,154,75,0.1)`; ctx.fill();
      ctx.beginPath(); ctx.arc(x, y, 3.5, 0, Math.PI*2);
      ctx.fillStyle = gold; ctx.fill();
    };
    // Draw a dashed line with arrow
    const line = (x1,y1,x2,y2) => {
      ctx.strokeStyle = `rgba(196,154,75,${0.6+p*0.35})`; ctx.lineWidth=1.8;
      ctx.setLineDash([6,4]); ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke(); ctx.setLineDash([]);
      const a = Math.atan2(y2-y1,x2-x1);
      ctx.strokeStyle=gold; ctx.lineWidth=1.5; ctx.beginPath();
      ctx.moveTo(x2,y2); ctx.lineTo(x2-9*Math.cos(a-0.5),y2-9*Math.sin(a-0.5));
      ctx.moveTo(x2,y2); ctx.lineTo(x2-9*Math.cos(a+0.5),y2-9*Math.sin(a+0.5));
      ctx.stroke();
    };

    if (type==="jawline_out") {
      [234,152,454].forEach(dot);
      if(px(152)&&px(234)) line(px(152),py(152),px(234),py(234));
      if(px(152)&&px(454)) line(px(152),py(152),px(454),py(454));
    } else if (type==="neck_down") {
      if(px(152)) { line(px(152)-cw*.03,py(152),px(152)-cw*.03,py(152)+ch*.09);
                    line(px(152)+cw*.03,py(152),px(152)+cw*.03,py(152)+ch*.09); }
    } else if (type==="cheek_lift") {
      [116,345].forEach(dot);
      if(px(116)&&px(21))  line(px(116),py(116),px(21),py(21)-ch*.05);
      if(px(345)&&px(251)) line(px(345),py(345),px(251),py(251)-ch*.05);
    } else if (type==="undereye_out") {
      [173,157,398,384].forEach(dot);
      if(px(173)&&px(161)) line(px(173),py(173),px(161),py(161));
      if(px(398)&&px(388)) line(px(398),py(398),px(388),py(388));
    } else if (type==="brow_out") {
      [107,70,336,300].forEach(dot);
      if(px(107)&&px(70))  line(px(107),py(107),px(70),py(70));
      if(px(336)&&px(300)) line(px(336),py(336),px(300),py(300));
    } else if (type==="forehead_up") {
      [10,66,296].forEach(dot);
      if(px(10))  line(px(10), py(10), px(10), py(10)-ch*.09);
      if(px(66))  line(px(66), py(66), px(66), py(66)-ch*.07);
      if(px(296)) line(px(296),py(296),px(296),py(296)-ch*.07);
    } else if (type==="nodes") {
      [234,454].forEach(i => {
        const x=px(i),y=py(i); if(!x) return;
        const r = 14+Math.sin(pulseT.current)*5;
        ctx.strokeStyle=`rgba(196,154,75,${0.4+p*.35})`; ctx.lineWidth=2;
        ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.stroke();
        dot(i);
      });
    } else if (type==="temples") {
      [21,251].forEach(i => {
        const x=px(i),y=py(i); if(!x) return;
        const r=18+p*4; ctx.strokeStyle=gold; ctx.lineWidth=1.5; ctx.setLineDash([4,3]);
        ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.stroke(); ctx.setLineDash([]);
        dot(i);
      });
    } else if (type==="orbital") {
      [159,386].forEach(i => {
        const x=px(i),y=py(i); if(!x) return;
        ctx.strokeStyle=`rgba(196,154,75,${0.5+p*.3})`; ctx.lineWidth=1.5; ctx.setLineDash([4,3]);
        ctx.beginPath(); ctx.ellipse(x,y+ch*.015,cw*.055,ch*.022,0,0,Math.PI*2);
        ctx.stroke(); ctx.setLineDash([]);
      });
    } else if (type==="brow_up") {
      [107,336].forEach(i => { if(px(i)) line(px(i),py(i),px(i),py(i)-ch*.06); });
    } else if (type==="jawline_up") {
      if(px(152)&&px(234)) line(px(152),py(152),px(234),py(234)-ch*.02);
      if(px(152)&&px(454)) line(px(152),py(152),px(454),py(454)-ch*.02);
    } else if (type==="marionette_up") {
      [61,291].forEach(dot);
      if(px(61)&&px(116))  line(px(61),py(61),px(116),py(116)-ch*.05);
      if(px(291)&&px(345)) line(px(291),py(291),px(345),py(345)-ch*.05);
    } else if (type==="neck_up") {
      if(px(152)) { line(px(152)-cw*.03,py(152)+ch*.06,px(152)-cw*.03,py(152));
                    line(px(152)+cw*.03,py(152)+ch*.06,px(152)+cw*.03,py(152)); }
    } else if (type==="nasolabial_up") {
      if(px(64)&&px(116))  line(px(64),py(64),px(116),py(116)-ch*.04);
      if(px(294)&&px(345)) line(px(294),py(294),px(345),py(345)-ch*.04);
    } else if (type==="cheek_out") {
      if(px(116)&&px(234)) line(px(116),py(116),px(234)+cw*.02,py(234));
      if(px(345)&&px(454)) line(px(345),py(345),px(454)-cw*.02,py(454));
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
        {/* ── FULL-SCREEN camera ── face fills the viewport, MediaPipe overlay aligns 1:1 with the actual face position ── */}
        <video ref={videoRef} playsInline muted autoPlay
          style={{
            position:"absolute", inset:0, width:"100%", height:"100%",
            // objectFit:"contain" keeps the full video frame visible so the canvas overlay aligns
            // exactly with the face. cover would crop and create coordinate drift with the AR markers.
            objectFit:"contain",
            transform:"scaleX(-1)",
          }}/>
        <canvas ref={canvasRef}
          style={{
            position:"absolute", inset:0, width:"100%", height:"100%",
            // Canvas matches the video's contain-fit so landmarks render in exactly the right place
            objectFit:"contain",
            transform:"scaleX(-1)",
            pointerEvents:"none",
          }}/>

        {/* Top vignette + nav controls (translucent, overlay) */}
        <div style={{ position:"absolute", top:0, left:0, right:0, height:140, background:"linear-gradient(to bottom, rgba(26,15,6,0.88) 0%, rgba(26,15,6,0.5) 55%, transparent 100%)", pointerEvents:"none", zIndex:3 }}/>
        <div style={{ position:"absolute", top:18, left:0, right:0, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 20px", zIndex:5 }}>
          <button onClick={onClose} style={{ background:"rgba(26,15,6,0.55)", backdropFilter:"blur(10px)", border:"1px solid rgba(196,154,75,0.22)", borderRadius:22, padding:"8px 16px", cursor:"pointer", display:"flex", alignItems:"center", gap:5, color:B.cream, fontFamily:SF, fontSize:11 }}>
            <X size={13}/><span>Exit</span>
          </button>
          <p style={{ fontSize:10, letterSpacing:3, color:B.gold, textTransform:"uppercase", fontFamily:SF, textShadow:"0 1px 8px rgba(0,0,0,0.6)" }}>{activeRitual.title}</p>
          <div style={{ width:74 }}/>
        </div>
        {/* Step dots — anchored to the top nav, not floating in the middle */}
        <div style={{ position:"absolute", top:60, left:0, right:0, display:"flex", gap:4, justifyContent:"center", zIndex:5 }}>
          {activeRitual.steps.map((_,i) => (
            <div key={i} style={{ width:i===stepIdx?22:6, height:3, borderRadius:2, background:i<stepIdx?B.gold:i===stepIdx?B.goldLight:"rgba(196,154,75,0.3)", transition:"all 0.4s", boxShadow:i===stepIdx?"0 0 8px rgba(196,154,75,0.4)":"none" }}/>
          ))}
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

          {/* Step info */}
          {step && (
            <>
              <div style={{ textAlign:"center", marginBottom:14 }}>
                <p style={{ fontSize:9, letterSpacing:2.5, color:B.gold, textTransform:"uppercase", fontFamily:SF, margin:"0 0 6px" }}>Step {stepIdx+1} of {total} · {stepSecs}s</p>
                <h3 style={{ fontSize:20, color:B.cream, fontWeight:400, margin:"0 0 6px", fontFamily:F, lineHeight:1.3 }}>{step.title}</h3>
                {step.direction && <p style={{ fontSize:10, color:B.gold, fontFamily:SF, display:"inline-block", background:"rgba(196,154,75,0.14)", border:"1px solid rgba(196,154,75,0.25)", padding:"3px 12px", borderRadius:14, margin:"0 0 8px" }}>{step.direction}</p>}
                <p style={{ fontSize:12, color:B.creamMuted, margin:"0 auto", fontFamily:SF, lineHeight:1.55, maxWidth:340 }}>{step.instruction}</p>
              </div>

              {/* Controls */}
              <div style={{ display:"flex", gap:10, width:"100%", maxWidth:420, margin:"0 auto" }}>
                {stepIdx > 0 && <button onClick={prevStep} style={{ flex:"0 0 auto", background:"rgba(58,37,22,0.7)", backdropFilter:"blur(8px)", border:"1px solid rgba(196,154,75,0.18)", borderRadius:24, padding:"12px 18px", cursor:"pointer", color:B.creamMuted, fontSize:13, fontFamily:SF }}>←</button>}
                <button onClick={nextStep}
                  style={{ flex:1, background: stepSecs<=0 ? B.goldGrad : "rgba(58,37,22,0.7)", backdropFilter: stepSecs<=0 ? "none" : "blur(8px)", border: stepSecs<=0 ? "none" : "1px solid rgba(196,154,75,0.18)", borderRadius:24, padding:"13px", cursor:"pointer", color: stepSecs<=0 ? B.warmBlack : B.cream, fontSize:13, fontFamily:SF, fontWeight: stepSecs<=0 ? 600 : 400 }}>
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
