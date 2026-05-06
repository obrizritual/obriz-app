import { useState, useEffect, useRef, useCallback } from "react";
import { Play, Pause, ChevronLeft, Moon, Sun, Wind, Shield, ShoppingBag, Home, Headphones, BarChart3, Heart, Clock, Check, Flame, X, ArrowRight, Brain, Activity, Zap, Sunset, Timer, Waves, RefreshCw, Sparkles, Lock, Star, Crown, User, ChevronRight, Hand, Mail, LogOut } from "lucide-react";
import { supabase } from "./supabaseClient";

/* ═══════════════════════════════════════════
   RHEI — Luxury Nervous System Wellness App
   v2.0 — Personalized + Ritual Guides + Premium
   ═══════════════════════════════════════════ */

const B = {
  bg: "#2D1B0E", bgDeep: "#231408", card: "#3A2516", cardHover: "#45301E",
  gold: "#C49A4B", goldLight: "#D4AD6A", goldMuted: "#A07D3A",
  cream: "#F2E8D9", creamMuted: "#C9B99F", muted: "#8A7560",
  white: "#FFFAF3", warmBlack: "#1A0F06",
  border: "rgba(196,154,75,0.12)", borderActive: "rgba(196,154,75,0.3)",
  goldGrad: "linear-gradient(135deg, #C49A4B 0%, #D4AD6A 50%, #C49A4B 100%)",
  darkGrad: "linear-gradient(180deg, #2D1B0E 0%, #231408 100%)",
  premiumGrad: "linear-gradient(135deg, #C49A4B 0%, #E8C97A 30%, #C49A4B 60%, #A07D3A 100%)",
};
const F = "'Georgia','Times New Roman',serif";
const SF = "system-ui,-apple-system,sans-serif";

// ── Data ──
const sessions = [
  { id:1, title:"Morning Reset", subtitle:"Before you reach for anything", duration:179, icon:Sun, description:"Regulates your cortisol awakening response. Sets your nervous system tone before the day begins.", technique:"Extended exhale breathing · Somatic grounding · Vagal humming", bestFor:"First minutes after waking", timeOfDay:"morning", audioFile:"/audio/morning-reset.mp3" },
  { id:2, title:"Pre-Meeting Reset", subtitle:"Walk in composed, not wired", duration:200, icon:Shield, description:"Activates vagal tone and grounds your nervous system before high-stakes moments.", technique:"Physiological sigh · Somatic grounding · Cognitive reframe", bestFor:"5 minutes before any demanding interaction", timeOfDay:"any", audioFile:"/audio/pre-meeting-reset.mp3" },
  { id:3, title:"The Transition", subtitle:"From performance to presence", duration:234, icon:Sunset, description:"Downregulates your nervous system during the shift from work to personal life.", technique:"Progressive release · Body scan · Identity unbinding", bestFor:"The commute home, or before walking through the door", timeOfDay:"evening", audioFile:"/audio/transition-reset.mp3" },
  { id:4, title:"Post-Conflict Reset", subtitle:"Release what isn't yours to carry", duration:194, icon:Wind, description:"Releases physiological activation that lingers after stressful interactions.", technique:"Bilateral stimulation · Physiological sigh · Self-compassion", bestFor:"After difficult conversations or emotional labor", timeOfDay:"any", audioFile:"/audio/post-conflict-reset.mp3" },
  { id:5, title:"General Reset", subtitle:"Your three-minute recalibration", duration:172, icon:RefreshCw, description:"The foundational nervous system reset. Use anytime, anywhere — your daily regulation anchor.", technique:"Diaphragmatic breathing · Body awareness · Vagal activation", bestFor:"Any moment you need to come back to yourself", timeOfDay:"any", audioFile:"/audio/general-reset.mp3" },
];

const nsStates = [
  { id:"wired", label:"Wired", sublabel:"Activated, on edge, can't settle", icon:Zap, color:"#C4786A", recommended:[2,4], score:25 },
  { id:"foggy", label:"Foggy", sublabel:"Disconnected, running on empty", icon:Brain, color:"#8A9BAF", recommended:[1,3], score:35 },
  { id:"reactive", label:"Reactive", sublabel:"Emotions close to the surface", icon:Activity, color:"#A08BAA", recommended:[4,2], score:30 },
  { id:"exhausted", label:"Exhausted", sublabel:"Tired but can't rest", icon:Moon, color:"#7A8B99", recommended:[5,3], score:20 },
  { id:"steady", label:"Steady", sublabel:"Present but not quite settled", icon:Waves, color:"#8BAA8B", recommended:[1,5], score:60 },
  { id:"composed", label:"Composed", sublabel:"Regulated and grounded", icon:Heart, color:"#5A8A5A", recommended:[1], score:85 },
];

// ── Ritual Guide Data ──
const rituals = [
  {
    id: "gua-sha", title: "Gua Sha Sculpt", subtitle: "Define your natural bone structure",
    duration: "8 min", isPremium: false, svgFile: "/svgs/gua-sha-zones.svg",
    description: "A sculpting routine that follows the natural contours of your face. Reduces puffiness, defines jawline and cheekbones.",
    tools: "Gua sha stone or clean fingers",
    steps: [
      { title: "Warm & Prepare", duration: 30, instruction: "Apply a few drops of facial oil. Warm the gua sha tool between your palms for a moment.", zone: "full" },
      { title: "Neck Drainage", duration: 45, instruction: "Starting behind the ears, use long downward strokes along each side of the neck to open lymphatic pathways.", zone: "neck", direction: "↓ Downward strokes" },
      { title: "Jawline Sculpting", duration: 60, instruction: "Place the tool at the center of your chin. Sweep firmly along the jawline toward the ear. Repeat 5 times each side.", zone: "jawline", direction: "→ Outward from chin" },
      { title: "Cheek Lifting", duration: 60, instruction: "Start at the corner of your mouth. Sweep upward across the cheekbone toward the temple. Firm, slow pressure.", zone: "cheeks", direction: "↗ Upward & outward" },
      { title: "Under-Eye Drainage", duration: 45, instruction: "Very gentle pressure only. Sweep from the inner corner of the eye outward along the orbital bone. Featherlight.", zone: "undereye", direction: "→ Gentle outward" },
      { title: "Brow Smoothing", duration: 45, instruction: "Start between your brows. Sweep outward along the brow bone toward the temple. Release tension in the frontalis muscle.", zone: "brow", direction: "→ Outward to temple" },
      { title: "Forehead Lifting", duration: 60, instruction: "Starting at the eyebrows, sweep upward toward the hairline. Alternate between center and sides.", zone: "forehead", direction: "↑ Upward to hairline" },
      { title: "Final Integration", duration: 30, instruction: "Return to the neck. Three long, slow drainage strokes from behind each ear down to the collarbone.", zone: "neck", direction: "↓ Final drainage" },
    ]
  },
  {
    id: "lymphatic", title: "Lymphatic Drainage", subtitle: "De-puff and restore natural glow",
    duration: "6 min", isPremium: true, svgFile: "/svgs/lymphatic-paths.svg",
    description: "Follows the lymphatic system's natural pathways to reduce fluid retention, decrease puffiness, and promote detoxification.",
    tools: "Clean fingertips — no tools needed",
    steps: [
      { title: "Activate Lymph Nodes", duration: 30, instruction: "Place fingertips behind each ear where the skull meets the neck. Apply gentle pulsing pressure 10 times.", zone: "nodes" },
      { title: "Open the Neck", duration: 45, instruction: "Using flat fingers, stroke down each side of the neck from ear to collarbone. Light pressure — you're moving fluid, not muscle.", zone: "neck", direction: "↓ Ear to collarbone" },
      { title: "Drain the Forehead", duration: 40, instruction: "Place all fingers across your forehead. Sweep outward from center to temples, then down in front of the ears.", zone: "forehead", direction: "→ then ↓" },
      { title: "Orbital Drainage", duration: 45, instruction: "Using ring fingers, trace the orbital bone from inner corner of eye, under the eye to outer corner, then up and over the brow back to start.", zone: "orbital", direction: "○ Circular path" },
      { title: "Cheek Drainage", duration: 45, instruction: "Starting beside the nose, sweep outward across the cheeks toward the ears. Follow the natural drainage pathways.", zone: "cheeks", direction: "→ Nose to ears" },
      { title: "Mandibular Line", duration: 40, instruction: "Trace the jawline from chin to ear with gentle sweeping pressure. This clears the mandibular lymph chain.", zone: "jawline", direction: "→ Chin to ear" },
      { title: "Final Flush", duration: 45, instruction: "Repeat the neck strokes from step 2. Finish with gentle pressure on the collarbone nodes for 10 counts.", zone: "neck", direction: "↓ Complete drainage" },
    ]
  },
  {
    id: "face-lift", title: "Face Lifting", subtitle: "Natural lift through targeted pressure",
    duration: "7 min", isPremium: true, svgFile: "/svgs/face-lifting-points.svg",
    description: "Strategic pressure point activation combined with lifting techniques. Targets areas most affected by gravity and tension.",
    tools: "Clean fingertips with facial oil",
    steps: [
      { title: "Temple Activation", duration: 35, instruction: "Place fingertips on temples. Apply firm circular pressure for 10 rotations. This releases the temporal fascia.", zone: "temples" },
      { title: "Brow Lift Points", duration: 45, instruction: "Find the bony ridge above your eyebrow. Press and hold at the inner, middle, and outer points for 5 seconds each. Then sweep upward.", zone: "brow", direction: "↑ Press & lift" },
      { title: "Cheekbone Definition", duration: 50, instruction: "Hook fingertips under the cheekbone. Apply upward pressure while slightly opening the mouth. Hold 5 seconds, release. Repeat 5 times.", zone: "cheeks", direction: "↑ Hook & lift" },
      { title: "Nasolabial Release", duration: 45, instruction: "Place index fingers beside each nostril. Sweep firmly outward and upward along the nasolabial fold toward the cheekbone.", zone: "nasolabial", direction: "↗ Outward & up" },
      { title: "Jawline Sculpt", duration: 50, instruction: "Make a fist. Use your knuckles to sweep along the jawline from chin to ear with firm upward pressure.", zone: "jawline", direction: "→↑ Knuckle sweep" },
      { title: "Marionette Lift", duration: 40, instruction: "Place fingers at the corners of your mouth. Press and sweep upward toward the cheekbone. Counteracts downward pull.", zone: "marionette", direction: "↑ Corner to cheek" },
      { title: "Neck & Platysma", duration: 50, instruction: "Place both hands flat on the chest. Sweep upward along the front of the neck to the chin. Firms the platysma muscle.", zone: "neck", direction: "↑ Chest to chin" },
      { title: "Integration Hold", duration: 30, instruction: "Cup your entire face gently. Hold with light lifting pressure for 10 seconds. Release slowly. Feel the difference.", zone: "full" },
    ]
  },
];

const fmt = (s) => `${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,"0")}`;
const greetUser = (name) => { const h=new Date().getHours(); const g=h<12?"Good morning":h<17?"Good afternoon":"Good evening"; return name?`${g}, ${name}`:g; };
const timeCtx = () => { const h=new Date().getHours(); if(h<6)return"night"; if(h<10)return"morning"; if(h<14)return"midday"; if(h<18)return"afternoon"; if(h<21)return"evening"; return"night"; };
const load = (k,fb) => { try { const v=localStorage.getItem(`obriz_${k}`); return v!==null?JSON.parse(v):fb; } catch{return fb;} };
const save = (k,v) => { try{localStorage.setItem(`obriz_${k}`,JSON.stringify(v));}catch{} };

// ── Circular Progress Ring ──
function Ring({ progress, size=120, sw=2.5, color=B.gold }) {
  const r=(size-sw)/2, c=r*2*Math.PI, off=c-(progress/100)*c;
  return (
    <svg width={size} height={size} style={{transform:"rotate(-90deg)",position:"absolute"}}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={`${color}15`} strokeWidth={sw}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={sw} strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round" style={{transition:"stroke-dashoffset 0.8s ease"}}/>
    </svg>
  );
}

// ── Breathing Orb ──
function Orb({ active, size=200 }) {
  const [ph,setPh]=useState(0);
  useEffect(()=>{ if(!active)return; const iv=setInterval(()=>setPh(p=>(p+1)%720),40); return()=>clearInterval(iv); },[active]);
  const cyc=Math.sin((ph*Math.PI)/360), sc=active?0.85+cyc*0.15:0.9, op=active?0.25+cyc*0.2:0.15;
  return (
    <div style={{position:"relative",width:size,height:size,display:"flex",alignItems:"center",justifyContent:"center"}}>
      {[1,0.75,0.5].map((s,i)=>(
        <div key={i} style={{position:"absolute",width:size*s,height:size*s,borderRadius:"50%",
          background:`radial-gradient(circle,${B.gold}${Math.round((op-i*0.05)*255).toString(16).padStart(2,'0')} 0%,transparent 70%)`,
          transform:`scale(${sc+i*0.03})`,transition:active?"none":"transform 2s ease"}}/>
      ))}
    </div>
  );
}

// ── NS Score Ring ──
function NSScore({ score, size=100 }) {
  const r=42,c=r*2*Math.PI,off=c-(score/100)*c,col=score>=70?"#5A8A5A":score>=40?B.gold:"#C4786A";
  return (
    <div style={{position:"relative",width:size,height:size,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <svg width={size} height={size} style={{transform:"rotate(-90deg)",position:"absolute"}}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={`${col}15`} strokeWidth={3}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={col} strokeWidth={3} strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round" style={{transition:"stroke-dashoffset 1.5s ease"}}/>
      </svg>
      <span style={{fontSize:28,color:B.cream,fontFamily:SF,fontWeight:300,zIndex:2}}>{score}</span>
    </div>
  );
}

// ══════════════════════════════════════
// GUIDED MICRO-INTERVENTION COMPONENTS
// ══════════════════════════════════════

function GuideSigh({ onComplete }) {
  const [cycle,setCycle]=useState(0);
  const [phase,setPhase]=useState("prep");
  const [count,setCount]=useState(3);
  const totalCycles=4;
  const timerRef=useRef(null);

  useEffect(()=>{
    clearTimeout(timerRef.current);
    if(phase==="prep") timerRef.current=setTimeout(()=>{setPhase("inhale1");setCount(3);},1200);
    else if(phase==="inhale1") { if(count>1) timerRef.current=setTimeout(()=>setCount(c=>c-1),800); else timerRef.current=setTimeout(()=>{setPhase("inhale2");setCount(0);},800); }
    else if(phase==="inhale2") timerRef.current=setTimeout(()=>{setPhase("exhale");setCount(6);},900);
    else if(phase==="exhale") { if(count>1) timerRef.current=setTimeout(()=>setCount(c=>c-1),1000); else timerRef.current=setTimeout(()=>{ if(cycle+1>=totalCycles) onComplete?.(); else { setCycle(c=>c+1); setPhase("inhale1"); setCount(3); }},1000); }
    return()=>clearTimeout(timerRef.current);
  },[phase,count,cycle]);

  const scale=phase==="inhale1"?1.0:phase==="inhale2"?1.2:phase==="exhale"?0.7:0.85;
  const dur=phase==="inhale1"?"2.5s":phase==="inhale2"?"0.8s":phase==="exhale"?"6s":"0.5s";
  const instruction=phase==="prep"?"Prepare yourself...":phase==="inhale1"?"Inhale through your nose":phase==="inhale2"?"Quick second inhale":"Long slow exhale through mouth";

  return (
    <div style={{textAlign:"center",padding:"20px 16px",display:"flex",flexDirection:"column",alignItems:"center"}}>
      <p style={{fontSize:9,letterSpacing:3,color:B.gold,textTransform:"uppercase",fontFamily:SF,marginBottom:6}}>Physiological sigh</p>
      <p style={{fontSize:12,color:B.muted,marginBottom:36,fontFamily:SF}}>Cycle {cycle+1} of {totalCycles}</p>
      <div style={{position:"relative",width:160,height:160,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:36}}>
        <div style={{position:"absolute",width:160,height:160,borderRadius:"50%",background:`radial-gradient(circle,${B.gold}${phase==="exhale"?"0F":"2E"} 0%,transparent 70%)`,transform:`scale(${scale})`,transition:`transform ${dur} ease-in-out`}}/>
        <div style={{position:"absolute",width:112,height:112,borderRadius:"50%",border:`1px solid ${B.gold}${phase==="exhale"?"15":"30"}`,transform:`scale(${scale})`,transition:`transform ${dur} ease-in-out`}}/>
        <span style={{fontSize:32,color:B.cream,fontWeight:300,zIndex:2,fontFamily:F}}>{phase==="inhale2"?"":count||""}</span>
      </div>
      <p style={{fontSize:19,color:B.cream,fontWeight:400,fontFamily:F,marginBottom:6,minHeight:28}}>{instruction}</p>
      <div style={{display:"flex",gap:6,marginTop:32}}>
        {Array.from({length:totalCycles},(_,i)=>(<div key={i} style={{width:i<=cycle?24:16,height:3,borderRadius:2,background:i<cycle?B.gold:i===cycle?`${B.gold}80`:`${B.gold}20`,transition:"all 0.4s"}}/>))}
      </div>
    </div>
  );
}

const groundSenses = [
  { count:5,sense:"see",instruction:"Look around and name 5 things you can see",color:"#8BAA8B",prompt:"Notice colors, shapes, textures. Take your time with each one." },
  { count:4,sense:"touch",instruction:"Notice 4 things you can physically feel",color:"#C49A4B",prompt:"The chair beneath you. Fabric on your skin. Your feet on the floor." },
  { count:3,sense:"hear",instruction:"Listen for 3 sounds around you",color:"#8A9BAF",prompt:"Close your eyes if it helps. Distant sounds, near sounds, subtle ones." },
  { count:2,sense:"smell",instruction:"Notice 2 things you can smell",color:"#A08BAA",prompt:"If you can't detect anything, recall a scent you love." },
  { count:1,sense:"taste",instruction:"Notice 1 thing you can taste",color:"#C4786A",prompt:"The inside of your mouth. A lingering flavor. A sip of water." },
];

function GuideGround({ onComplete }) {
  const [step,setStep]=useState(0);
  const [timeLeft,setTimeLeft]=useState(10);
  const timerRef=useRef(null);
  useEffect(()=>{
    setTimeLeft(10); clearInterval(timerRef.current);
    if(step>=groundSenses.length) { onComplete?.(); return; }
    timerRef.current=setInterval(()=>{ setTimeLeft(t=>{ if(t<=1){clearInterval(timerRef.current);setTimeout(()=>setStep(s=>s+1),400);return 0;} return t-1; }); },1000);
    return()=>clearInterval(timerRef.current);
  },[step]);
  if(step>=groundSenses.length) return null;
  const sense=groundSenses[step]; const pct=((10-timeLeft)/10)*100;
  return (
    <div style={{textAlign:"center",padding:"20px 16px",display:"flex",flexDirection:"column",alignItems:"center"}}>
      <p style={{fontSize:9,letterSpacing:3,color:B.gold,textTransform:"uppercase",fontFamily:SF,marginBottom:6}}>5-4-3-2-1 Grounding</p>
      <p style={{fontSize:12,color:B.muted,marginBottom:32,fontFamily:SF}}>Step {step+1} of 5</p>
      <div style={{position:"relative",width:120,height:120,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:28}}>
        <Ring progress={pct} size={120} sw={2.5} color={sense.color}/><span style={{fontSize:38,color:B.cream,fontWeight:300,zIndex:2}}>{sense.count}</span>
      </div>
      <p style={{fontSize:18,color:B.cream,fontWeight:400,fontFamily:F,marginBottom:8,lineHeight:1.4,maxWidth:280}}>{sense.instruction}</p>
      <p style={{fontSize:12,color:B.muted,fontStyle:"italic",fontFamily:F,lineHeight:1.5,maxWidth:260,marginBottom:8}}>{sense.prompt}</p>
      <div style={{width:200,height:3,borderRadius:2,background:`${B.gold}15`,marginTop:24}}><div style={{width:`${pct}%`,height:"100%",borderRadius:2,background:sense.color,transition:"width 0.8s ease"}}/></div>
      <p style={{fontSize:10,color:B.muted,fontFamily:SF,marginTop:8}}>{timeLeft}s</p>
    </div>
  );
}

const jawSteps = [
  { title:"Let your jaw drop", instruction:"Allow your mouth to fall open naturally. Don't force it — just release the muscles holding it closed.", hold:10 },
  { title:"Release your tongue", instruction:"Let your tongue fall away from the roof of your mouth. Rest it gently behind your lower teeth.", hold:10 },
  { title:"Massage the hinge", instruction:"Place your fingertips where your jaw meets your skull. Apply gentle circular pressure on both sides.", hold:12 },
];

function GuideJaw({ onComplete }) {
  const [step,setStep]=useState(0);const [timeLeft,setTimeLeft]=useState(jawSteps[0].hold);const timerRef=useRef(null);
  useEffect(()=>{
    if(step>=jawSteps.length){onComplete?.();return;} setTimeLeft(jawSteps[step].hold); clearInterval(timerRef.current);
    timerRef.current=setInterval(()=>{ setTimeLeft(t=>{ if(t<=1){clearInterval(timerRef.current);setTimeout(()=>setStep(s=>s+1),500);return 0;} return t-1; }); },1000);
    return()=>clearInterval(timerRef.current);
  },[step]);
  if(step>=jawSteps.length) return null;
  const js=jawSteps[step]; const pct=((js.hold-timeLeft)/js.hold)*100;
  return (
    <div style={{textAlign:"center",padding:"20px 16px",display:"flex",flexDirection:"column",alignItems:"center"}}>
      <p style={{fontSize:9,letterSpacing:3,color:B.gold,textTransform:"uppercase",fontFamily:SF,marginBottom:6}}>Jaw release</p>
      <p style={{fontSize:12,color:B.muted,marginBottom:32,fontFamily:SF}}>Hold {step+1} of {jawSteps.length}</p>
      <div style={{position:"relative",width:140,height:140,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:28}}>
        <Ring progress={pct} size={140} sw={2.5}/>
        <div style={{textAlign:"center",zIndex:2}}><span style={{fontSize:32,color:B.cream,fontWeight:300,display:"block"}}>{timeLeft}</span><span style={{fontSize:9,color:B.muted,letterSpacing:1.5,textTransform:"uppercase",fontFamily:SF}}>hold</span></div>
      </div>
      <p style={{fontSize:19,color:B.cream,fontWeight:400,fontFamily:F,marginBottom:8}}>{js.title}</p>
      <p style={{fontSize:12,color:B.muted,fontStyle:"italic",fontFamily:F,lineHeight:1.5,maxWidth:270}}>{js.instruction}</p>
      <div style={{display:"flex",gap:6,marginTop:32}}>{jawSteps.map((_,i)=>(<div key={i} style={{width:i<=step?24:16,height:3,borderRadius:2,background:i<step?B.gold:i===step?`${B.gold}60`:`${B.gold}15`,transition:"all 0.4s"}}/>))}</div>
    </div>
  );
}

function GuideTap({ onComplete }) {
  const [timeLeft,setTimeLeft]=useState(30);const [side,setSide]=useState("left");const timerRef=useRef(null);const tapRef=useRef(null);
  useEffect(()=>{
    timerRef.current=setInterval(()=>{ setTimeLeft(t=>{ if(t<=1){clearInterval(timerRef.current);clearInterval(tapRef.current);onComplete?.();return 0;} return t-1; }); },1000);
    tapRef.current=setInterval(()=>setSide(s=>s==="left"?"right":"left"),900);
    return()=>{clearInterval(timerRef.current);clearInterval(tapRef.current);};
  },[]);
  const pct=((30-timeLeft)/30)*100; const isL=side==="left";
  return (
    <div style={{textAlign:"center",padding:"20px 16px",display:"flex",flexDirection:"column",alignItems:"center"}}>
      <p style={{fontSize:9,letterSpacing:3,color:B.gold,textTransform:"uppercase",fontFamily:SF,marginBottom:6}}>Butterfly tap</p>
      <p style={{fontSize:12,color:B.muted,marginBottom:8,fontFamily:SF}}>Cross your arms over your chest</p>
      <div style={{position:"relative",width:200,height:200,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:20}}>
        <Ring progress={pct} size={200} sw={2}/>
        <div style={{display:"flex",gap:28,zIndex:2}}>
          {["L","R"].map((l,i)=>{const active=i===0?isL:!isL;return(
            <div key={l} style={{width:60,height:60,borderRadius:"50%",background:active?`${B.gold}33`:`${B.gold}0D`,border:`1.5px solid ${active?`${B.gold}80`:`${B.gold}1A`}`,display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.15s ease",transform:`scale(${active?1.15:0.9})`}}>
              <span style={{fontSize:11,color:active?B.gold:B.muted,fontWeight:500,letterSpacing:1,fontFamily:SF}}>{l}</span>
            </div>
          );})}
        </div>
      </div>
      <p style={{fontSize:19,color:B.cream,fontWeight:400,fontFamily:F,marginBottom:4}}>Tap {isL?"left":"right"} shoulder</p>
      <p style={{fontSize:12,color:B.muted,fontStyle:"italic",fontFamily:F}}>Slow, gentle, rhythmic</p>
      <p style={{fontSize:28,color:B.cream,fontWeight:300,marginTop:20,fontFamily:SF}}>{timeLeft}s</p>
    </div>
  );
}

function GuideComplete({ message, onClose }) {
  return (
    <div style={{textAlign:"center",padding:"40px 20px",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:400}}>
      <div style={{width:72,height:72,borderRadius:"50%",background:`${B.gold}15`,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:20,border:`1px solid ${B.gold}30`}}>
        <Check size={30} color={B.gold}/>
      </div>
      <h2 style={{fontSize:22,color:B.cream,fontWeight:400,margin:"0 0 6px",fontFamily:F}}>Reset complete</h2>
      <p style={{fontSize:13,color:B.muted,fontStyle:"italic",margin:"0 0 8px",fontFamily:F}}>Your nervous system thanks you.</p>
      <p style={{fontSize:12,color:B.gold,fontFamily:SF,margin:"0 0 32px"}}>{message}</p>
      <button onClick={onClose} style={{background:B.goldGrad,border:"none",borderRadius:28,padding:"13px 36px",cursor:"pointer",color:B.warmBlack,fontSize:13,fontFamily:SF,letterSpacing:1,fontWeight:500}}>Continue</button>
    </div>
  );
}

// ══════════════════════════════════════
// RITUAL GUIDE PLAYER
// ══════════════════════════════════════
function RitualPlayer({ ritual, onClose }) {
  const [step,setStep]=useState(-1); // -1 = overview
  const [timeLeft,setTimeLeft]=useState(0);
  const [paused,setPaused]=useState(false);
  const timerRef=useRef(null);

  const currentStep = step >= 0 && step < ritual.steps.length ? ritual.steps[step] : null;
  const totalSteps = ritual.steps.length;

  useEffect(()=>{
    if(step < 0 || step >= totalSteps || paused) return;
    setTimeLeft(currentStep.duration);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(()=>{
      setTimeLeft(t=>{
        if(t<=1) { clearInterval(timerRef.current); return 0; }
        return t-1;
      });
    },1000);
    return()=>clearInterval(timerRef.current);
  },[step,paused]);

  const nextStep = () => {
    if(step+1 >= totalSteps) { setStep(totalSteps); } // completion
    else setStep(s=>s+1);
  };

  const prevStep = () => { if(step > 0) setStep(s=>s-1); };

  // Overview
  if(step === -1) {
    return (
      <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:`${B.warmBlack}F8`,zIndex:100,overflowY:"auto"}}>
        <div style={{maxWidth:430,margin:"0 auto",padding:"24px 22px 40px"}}>
          <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:4,color:B.muted,fontFamily:SF,fontSize:12,marginBottom:24}}><ChevronLeft size={16}/><span>Back</span></button>
          <div style={{textAlign:"center",marginBottom:28}}>
            <p style={{fontSize:9,letterSpacing:3,color:B.gold,textTransform:"uppercase",fontFamily:SF,marginBottom:8}}>Ritual Guide</p>
            <h1 style={{fontSize:24,fontWeight:400,color:B.cream,margin:"0 0 6px",fontFamily:F}}>{ritual.title}</h1>
            <p style={{fontSize:13,color:B.muted,fontStyle:"italic",margin:"0 0 16px"}}>{ritual.subtitle}</p>
          </div>
          <div style={{width:"100%",height:220,borderRadius:20,background:B.card,border:`1px solid ${B.border}`,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:24,overflow:"hidden"}}>
            <img src={ritual.svgFile} alt={ritual.title} style={{width:"70%",height:"80%",objectFit:"contain",opacity:0.85}} onError={(e)=>{e.target.style.display='none';}}/>
          </div>
          <div style={{background:B.card,borderRadius:16,padding:18,border:`1px solid ${B.border}`,marginBottom:16}}>
            <p style={{fontSize:12,color:B.creamMuted,margin:0,lineHeight:1.6,fontFamily:SF}}>{ritual.description}</p>
          </div>
          <div style={{display:"flex",gap:12,marginBottom:24}}>
            <div style={{flex:1,background:B.card,borderRadius:12,padding:"12px 14px",border:`1px solid ${B.border}`,textAlign:"center"}}>
              <Clock size={14} color={B.gold} style={{marginBottom:4}}/>
              <p style={{fontSize:13,color:B.cream,margin:0,fontFamily:SF}}>{ritual.duration}</p>
              <p style={{fontSize:9,color:B.muted,margin:"2px 0 0",textTransform:"uppercase",letterSpacing:1,fontFamily:SF}}>Duration</p>
            </div>
            <div style={{flex:1,background:B.card,borderRadius:12,padding:"12px 14px",border:`1px solid ${B.border}`,textAlign:"center"}}>
              <Hand size={14} color={B.gold} style={{marginBottom:4}}/>
              <p style={{fontSize:13,color:B.cream,margin:0,fontFamily:SF}}>{ritual.steps.length} steps</p>
              <p style={{fontSize:9,color:B.muted,margin:"2px 0 0",textTransform:"uppercase",letterSpacing:1,fontFamily:SF}}>Guided</p>
            </div>
          </div>
          <div style={{background:B.card,borderRadius:12,padding:"12px 16px",border:`1px solid ${B.border}`,marginBottom:28}}>
            <p style={{fontSize:10,color:B.gold,margin:"0 0 4px",fontFamily:SF,letterSpacing:1,textTransform:"uppercase"}}>You'll need</p>
            <p style={{fontSize:12,color:B.creamMuted,margin:0,fontFamily:SF}}>{ritual.tools}</p>
          </div>
          <button onClick={()=>setStep(0)} style={{width:"100%",background:B.goldGrad,border:"none",borderRadius:28,padding:"16px",cursor:"pointer",color:B.warmBlack,fontSize:14,fontFamily:SF,letterSpacing:1,fontWeight:600,boxShadow:`0 6px 28px ${B.gold}30`}}>Begin Ritual</button>
        </div>
      </div>
    );
  }

  // Completion
  if(step >= totalSteps) {
    return (
      <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:`${B.warmBlack}F8`,zIndex:100,display:"flex",alignItems:"center",justifyContent:"center"}}>
        <div style={{textAlign:"center",padding:32,maxWidth:340}}>
          <div style={{width:80,height:80,borderRadius:"50%",background:`${B.gold}15`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 24px",border:`1px solid ${B.gold}30`}}>
            <Sparkles size={32} color={B.gold}/>
          </div>
          <h2 style={{fontSize:24,color:B.cream,fontWeight:400,margin:"0 0 8px",fontFamily:F}}>Ritual Complete</h2>
          <p style={{fontSize:14,color:B.muted,fontStyle:"italic",margin:"0 0 6px",fontFamily:F}}>You showed up for yourself.</p>
          <p style={{fontSize:12,color:B.gold,fontFamily:SF,margin:"0 0 36px"}}>{ritual.title} · {ritual.duration}</p>
          <button onClick={onClose} style={{background:B.goldGrad,border:"none",borderRadius:28,padding:"14px 40px",cursor:"pointer",color:B.warmBlack,fontSize:14,fontFamily:SF,letterSpacing:1,fontWeight:500}}>Done</button>
        </div>
      </div>
    );
  }

  // Active step
  const pct = currentStep ? ((currentStep.duration - timeLeft) / currentStep.duration) * 100 : 0;
  return (
    <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:`${B.warmBlack}F8`,zIndex:100,overflowY:"auto"}}>
      <div style={{maxWidth:430,margin:"0 auto",padding:"24px 22px 40px",display:"flex",flexDirection:"column",alignItems:"center",minHeight:"100vh"}}>
        <button onClick={onClose} style={{position:"absolute",top:18,right:18,background:"none",border:"none",cursor:"pointer",zIndex:10}}><X size={18} color={B.muted}/></button>

        <p style={{fontSize:9,letterSpacing:3,color:B.gold,textTransform:"uppercase",fontFamily:SF,marginBottom:4,marginTop:8}}>{ritual.title}</p>
        <p style={{fontSize:12,color:B.muted,marginBottom:28,fontFamily:SF}}>Step {step+1} of {totalSteps}</p>

        {/* Progress dots */}
        <div style={{display:"flex",gap:4,marginBottom:28,flexWrap:"wrap",justifyContent:"center"}}>
          {ritual.steps.map((_,i)=>(<div key={i} style={{width:i===step?20:8,height:4,borderRadius:2,background:i<step?B.gold:i===step?B.goldLight:`${B.gold}20`,transition:"all 0.4s"}}/>))}
        </div>

        {/* Timer ring */}
        <div style={{position:"relative",width:160,height:160,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:32}}>
          <Ring progress={pct} size={160} sw={3}/>
          <div style={{textAlign:"center",zIndex:2}}>
            <span style={{fontSize:36,color:B.cream,fontWeight:300,display:"block",fontFamily:SF}}>{timeLeft}</span>
            <span style={{fontSize:9,color:B.muted,letterSpacing:1.5,textTransform:"uppercase",fontFamily:SF}}>seconds</span>
          </div>
        </div>

        {/* Instruction */}
        <h3 style={{fontSize:20,color:B.cream,fontWeight:400,fontFamily:F,marginBottom:8,textAlign:"center"}}>{currentStep.title}</h3>
        {currentStep.direction && <p style={{fontSize:11,color:B.gold,fontFamily:SF,margin:"0 0 12px",background:`${B.gold}12`,padding:"4px 12px",borderRadius:20,letterSpacing:1}}>{currentStep.direction}</p>}
        <p style={{fontSize:13,color:B.creamMuted,fontFamily:SF,lineHeight:1.6,textAlign:"center",maxWidth:320,margin:"0 0 32px"}}>{currentStep.instruction}</p>

        {/* Controls */}
        <div style={{display:"flex",gap:12,marginTop:"auto"}}>
          {step > 0 && <button onClick={prevStep} style={{background:B.card,border:`1px solid ${B.border}`,borderRadius:28,padding:"12px 24px",cursor:"pointer",color:B.cream,fontSize:12,fontFamily:SF}}>Previous</button>}
          <button onClick={timeLeft<=0?nextStep:()=>{clearInterval(timerRef.current);nextStep();}} style={{background:timeLeft<=0?B.goldGrad:B.card,border:timeLeft<=0?"none":`1px solid ${B.border}`,borderRadius:28,padding:"12px 32px",cursor:"pointer",color:timeLeft<=0?B.warmBlack:B.cream,fontSize:13,fontFamily:SF,fontWeight:500,letterSpacing:0.5}}>
            {timeLeft<=0?(step+1>=totalSteps?"Finish":"Next Step"):"Skip →"}
          </button>
        </div>
      </div>
    </div>
  );
}


// ══════════════════════════════════
// ONBOARDING COMPONENT
// ══════════════════════════════════
function Onboarding({ onComplete }) {
  const [name,setName]=useState("");
  const [step,setStep]=useState(0); // 0=welcome, 1=name

  if(step===0) {
    return (
      <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:B.darkGrad,zIndex:200,display:"flex",alignItems:"center",justifyContent:"center"}}>
        <div style={{textAlign:"center",padding:"32px 28px",maxWidth:380}}>
          <div style={{marginBottom:40}}>
            <h1 style={{fontSize:22,letterSpacing:14,color:B.gold,fontWeight:400,margin:"0 0 12px",fontFamily:F}}>RHEI</h1>
            <div style={{width:50,height:1,background:B.gold,margin:"0 auto 20px",opacity:0.4}}/>
            <p style={{fontSize:20,color:B.cream,fontWeight:400,fontFamily:F,margin:"0 0 12px",lineHeight:1.4}}>Your nervous system<br/>deserves precision.</p>
            <p style={{fontSize:13,color:B.muted,fontStyle:"italic",lineHeight:1.5}}>Not another meditation app. A regulation system for those who do too much and feel too deeply.</p>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:32}}>
            {["5 guided reset sessions","Micro-interventions in under 60 seconds","Daily nervous system tracking","Face ritual guides"].map((f,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",gap:10,textAlign:"left"}}>
                <div style={{width:20,height:20,borderRadius:"50%",background:`${B.gold}15`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                  <Check size={10} color={B.gold}/>
                </div>
                <span style={{fontSize:12,color:B.creamMuted,fontFamily:SF}}>{f}</span>
              </div>
            ))}
          </div>
          <button onClick={()=>setStep(1)} style={{width:"100%",background:B.goldGrad,border:"none",borderRadius:28,padding:"16px",cursor:"pointer",color:B.warmBlack,fontSize:14,fontFamily:SF,letterSpacing:1,fontWeight:600,boxShadow:`0 6px 28px ${B.gold}30`}}>Begin Your Journey</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:B.darkGrad,zIndex:200,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{textAlign:"center",padding:"32px 28px",maxWidth:380,width:"100%"}}>
        <p style={{fontSize:9,letterSpacing:3,color:B.gold,textTransform:"uppercase",fontFamily:SF,marginBottom:20}}>Personalize your experience</p>
        <h2 style={{fontSize:22,color:B.cream,fontWeight:400,margin:"0 0 8px",fontFamily:F}}>What should we call you?</h2>
        <p style={{fontSize:13,color:B.muted,fontStyle:"italic",marginBottom:36}}>This is your space. Make it yours.</p>
        <input
          type="text" value={name} onChange={e=>setName(e.target.value)}
          placeholder="Your first name"
          autoFocus
          style={{width:"100%",background:B.card,border:`1px solid ${name?B.borderActive:B.border}`,borderRadius:14,padding:"16px 18px",color:B.cream,fontSize:16,fontFamily:SF,outline:"none",textAlign:"center",boxSizing:"border-box",transition:"border-color 0.3s"}}
        />
        <button onClick={()=>{if(name.trim()){save('userName',name.trim());onComplete(name.trim());}}} disabled={!name.trim()} style={{width:"100%",marginTop:20,background:name.trim()?B.goldGrad:`${B.gold}20`,border:"none",borderRadius:28,padding:"16px",cursor:name.trim()?"pointer":"not-allowed",color:name.trim()?B.warmBlack:B.muted,fontSize:14,fontFamily:SF,letterSpacing:1,fontWeight:600,opacity:name.trim()?1:0.5,transition:"all 0.3s"}}>
          Continue
        </button>
        <button onClick={()=>{save('userName','');onComplete('');}} style={{background:"none",border:"none",cursor:"pointer",color:B.muted,fontSize:12,fontFamily:SF,marginTop:16,padding:8}}>Skip for now</button>
      </div>
    </div>
  );
}


// ══════════════════════════════════
// MAIN APP COMPONENT
// ══════════════════════════════════
export default function ObrizApp() {
  // Onboarding
  const [onboarded,setOnboarded]=useState(()=>load('onboarded',false));
  const [userName,setUserName]=useState(()=>load('userName',''));
  const [isPremium,setIsPremium]=useState(()=>load('isPremium',false));

  // Navigation
  const [screen,setScreen]=useState("home");
  const [activeSession,setActiveSession]=useState(null);
  const [isPlaying,setIsPlaying]=useState(false);
  const [elapsed,setElapsed]=useState(0);
  const [audioDuration,setAudioDuration]=useState(0);
  const [completedToday,setCompletedToday]=useState(()=>load('completedToday',[]));
  const [streak,setStreak]=useState(()=>load('streak',1));
  const [totalSessions,setTotalSessions]=useState(()=>load('totalSessions',0));
  const [totalMinutes,setTotalMinutes]=useState(()=>load('totalMinutes',0));
  const [checkinState,setCheckinState]=useState(null);
  const [showCheckin,setShowCheckin]=useState(false);
  const [checkinDone,setCheckinDone]=useState(false);
  const [selectedCheckin,setSelectedCheckin]=useState(null);
  const [showComplete,setShowComplete]=useState(false);
  const [nsScore,setNsScore]=useState(()=>load('nsScore',50));
  const [scoreHistory,setScoreHistory]=useState(()=>load('scoreHistory',[45,42,48,52,55,50]));
  const [audioLoading,setAudioLoading]=useState(false);
  const [microActive,setMicroActive]=useState(null);
  const [microDone,setMicroDone]=useState(false);
  const [microMsg,setMicroMsg]=useState("");
  const [activeRitual,setActiveRitual]=useState(null);
  const [showInstallPrompt,setShowInstallPrompt]=useState(false);
  const [installDismissed,setInstallDismissed]=useState(()=>load('installDismissed',false));
  const [isIOS]=useState(()=>/iPad|iPhone|iPod/.test(navigator.userAgent));
  const [isStandalone]=useState(()=>window.matchMedia('(display-mode: standalone)').matches||window.navigator.standalone===true);
  const [checkoutLoading,setCheckoutLoading]=useState(false);

  // Auth state (Supabase)
  const [authUser,setAuthUser]=useState(null);
  const [authLoading,setAuthLoading]=useState(!!supabase);
  const [authEmail,setAuthEmail]=useState('');
  const [authSent,setAuthSent]=useState(false);
  const [authError,setAuthError]=useState('');

  const audioRef=useRef(null);
  const animRef=useRef(null);
  const deferredPromptRef=useRef(null);

  // PWA install prompt — show for both Android (beforeinstallprompt) and iOS (manual instructions)
  useEffect(()=>{
    if(isStandalone||installDismissed)return; // Already installed or dismissed
    const handler=(e)=>{e.preventDefault();deferredPromptRef.current=e;setShowInstallPrompt(true);};
    window.addEventListener('beforeinstallprompt',handler);
    // On iOS or if beforeinstallprompt doesn't fire within 2s, show manual install banner
    const timeout=setTimeout(()=>{if(!deferredPromptRef.current)setShowInstallPrompt(true);},2000);
    return()=>{window.removeEventListener('beforeinstallprompt',handler);clearTimeout(timeout);};
  },[isStandalone,installDismissed]);

  // Supabase auth listener
  useEffect(()=>{
    if(!supabase) { setAuthLoading(false); return; }
    supabase.auth.getSession().then(({data:{session}})=>{
      setAuthUser(session?.user||null);
      if(session?.user?.email){
        // Check subscription in Supabase
        fetch('/api/check-subscription',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:session.user.email})})
          .then(r=>r.json())
          .then(data=>{ if(data.isPremium){setIsPremium(true);save('isPremium',true);save('premiumPlan',data.plan);} })
          .catch(()=>{});
        save('customerEmail',session.user.email);
        if(!userName && session.user.user_metadata?.name){setUserName(session.user.user_metadata.name);save('userName',session.user.user_metadata.name);}
      }
      setAuthLoading(false);
    });
    const {data:{subscription:authSub}}=supabase.auth.onAuthStateChange((_event,session)=>{
      setAuthUser(session?.user||null);
      if(session?.user?.email){
        fetch('/api/check-subscription',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:session.user.email})})
          .then(r=>r.json())
          .then(data=>{ if(data.isPremium){setIsPremium(true);save('isPremium',true);} })
          .catch(()=>{});
        save('customerEmail',session.user.email);
      }
    });
    return()=>authSub.unsubscribe();
  },[]);

  // Auth helpers
  const signInWithEmail=async()=>{
    if(!supabase||!authEmail.trim())return;
    setAuthError('');setAuthSent(false);
    try{
      const {error}=await supabase.auth.signInWithOtp({email:authEmail.trim(),options:{emailRedirectTo:window.location.origin}});
      if(error)setAuthError(error.message);
      else setAuthSent(true);
    }catch(e){setAuthError('Connection error. Try again.');}
  };
  const signOut=async()=>{
    if(!supabase)return;
    await supabase.auth.signOut();
    setAuthUser(null);
  };

  // Stripe payment success detection
  useEffect(()=>{
    const params=new URLSearchParams(window.location.search);
    const payment=params.get('payment');
    const sessionId=params.get('session_id');
    if(payment==='success'&&sessionId){
      // Verify the session with our API
      fetch('/api/verify-session',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({session_id:sessionId})})
        .then(r=>r.json())
        .then(data=>{
          if(data.verified){
            setIsPremium(true);save('isPremium',true);
            save('premiumPlan',data.plan);
            if(data.customer_email)save('customerEmail',data.customer_email);
          }
        })
        .catch(()=>{
          // If verify fails, still unlock (better UX, can re-verify later)
          setIsPremium(true);save('isPremium',true);
        });
      // Clean URL
      window.history.replaceState({},'','/');
    } else if(payment==='cancelled'){
      window.history.replaceState({},'','/');
    }
  },[]);

  // Stripe checkout handler
  const handleCheckout=async(plan)=>{
    setCheckoutLoading(true);
    try{
      const userEmail=authUser?.email||load('customerEmail','');
      const res=await fetch('/api/create-checkout-session',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({plan,email:userEmail||undefined})});
      const data=await res.json();
      if(data.url){window.location.href=data.url;}
      else{alert('Something went wrong. Please try again.');setCheckoutLoading(false);}
    }catch(err){
      alert('Connection error. Please try again.');setCheckoutLoading(false);
    }
  };

  const installApp=async()=>{
    if(deferredPromptRef.current){deferredPromptRef.current.prompt();deferredPromptRef.current=null;setShowInstallPrompt(false);}
    else if(isIOS){alert("To add RHEI to your home screen:\n\n1. Tap the Share button (square with arrow) at the bottom of Safari\n2. Scroll down and tap \"Add to Home Screen\"\n3. Tap \"Add\"");}
    else{alert("To install RHEI:\n\nOpen this page in Chrome or Safari, then use your browser menu to \"Add to Home Screen\" or \"Install App\".");}
  };
  const dismissInstall=()=>{setShowInstallPrompt(false);setInstallDismissed(true);save('installDismissed',true);};

  // Persist
  useEffect(()=>{save('completedToday',completedToday);},[completedToday]);
  useEffect(()=>{save('streak',streak);},[streak]);
  useEffect(()=>{save('totalSessions',totalSessions);},[totalSessions]);
  useEffect(()=>{save('totalMinutes',totalMinutes);},[totalMinutes]);
  useEffect(()=>{save('nsScore',nsScore);},[nsScore]);
  useEffect(()=>{save('scoreHistory',scoreHistory);},[scoreHistory]);
  useEffect(()=>{save('isPremium',isPremium);},[isPremium]);

  // Audio
  const trackTime=useCallback(()=>{if(audioRef.current&&!audioRef.current.paused){setElapsed(audioRef.current.currentTime);animRef.current=requestAnimationFrame(trackTime);}},[]);
  useEffect(()=>{return()=>{if(audioRef.current){audioRef.current.pause();audioRef.current.src='';}if(animRef.current)cancelAnimationFrame(animRef.current);};},[]);

  const startSession=(id)=>{
    const s=sessions.find(x=>x.id===id);
    setActiveSession(id);setElapsed(0);setIsPlaying(false);setShowComplete(false);setAudioLoading(true);setScreen("player");
    if(audioRef.current){audioRef.current.pause();audioRef.current.src='';}
    const a=new Audio(s.audioFile);a.preload='auto';audioRef.current=a;
    a.addEventListener('loadedmetadata',()=>{setAudioDuration(a.duration);setAudioLoading(false);});
    a.addEventListener('canplay',()=>setAudioLoading(false));
    a.addEventListener('ended',()=>{
      cancelAnimationFrame(animRef.current);setIsPlaying(false);setElapsed(a.duration);
      if(!completedToday.includes(id)){
        setCompletedToday(c=>[...c,id]);setTotalSessions(t=>t+1);setTotalMinutes(t=>t+Math.ceil(s.duration/60));
        setNsScore(sc=>Math.min(100,sc+8));setScoreHistory(h=>[...h.slice(-6),Math.min(100,nsScore+8)]);
      }
      setShowComplete(true);
    });
    a.addEventListener('error',()=>setAudioLoading(false));
  };

  const togglePlay=()=>{
    if(!audioRef.current)return;
    if(isPlaying){audioRef.current.pause();cancelAnimationFrame(animRef.current);setIsPlaying(false);}
    else{audioRef.current.play().then(()=>{setIsPlaying(true);animRef.current=requestAnimationFrame(trackTime);}).catch(()=>{});}
  };

  const seekAudio=(e)=>{if(!audioRef.current||!audioDuration)return;const r=e.currentTarget.getBoundingClientRect();const pct=Math.max(0,Math.min(1,(e.clientX-r.left)/r.width));audioRef.current.currentTime=pct*audioDuration;setElapsed(audioRef.current.currentTime);};

  const exitPlayer=()=>{
    if(audioRef.current){audioRef.current.pause();audioRef.current.src='';}
    cancelAnimationFrame(animRef.current);setIsPlaying(false);setActiveSession(null);setElapsed(0);setAudioDuration(0);setShowComplete(false);setScreen("library");
  };

  const doCheckin=(state)=>{setCheckinState(state);setCheckinDone(true);setSelectedCheckin(null);setShowCheckin(false);setNsScore(state.score);setScoreHistory(h=>[...h.slice(-6),state.score]);};

  const getSuggested=()=>{
    if(checkinDone&&checkinState) return sessions.find(s=>s.id===checkinState.recommended[0]);
    const c=timeCtx();
    if(c==="morning")return sessions[0]; if(c==="midday"||c==="afternoon")return sessions[1]; if(c==="evening")return sessions[2]; return sessions[4];
  };

  const openMicro=(id)=>{setMicroActive(id);setMicroDone(false);setMicroMsg("");};
  const closeMicro=()=>{setMicroActive(null);setMicroDone(false);};
  const completeMicro=(msg,scoreBoost)=>{setMicroDone(true);setMicroMsg(msg);setNsScore(s=>Math.min(100,s+scoreBoost));setScoreHistory(h=>[...h.slice(-6),Math.min(100,nsScore+scoreBoost)]);};

  const cur=activeSession?sessions.find(s=>s.id===activeSession):null;
  const suggested=getSuggested();
  const effDur=audioDuration||(cur?.duration||0);
  const progress=effDur>0?(elapsed/effDur)*100:0;
  const remaining=Math.max(0,effDur-elapsed);

  const container={width:"100%",maxWidth:430,margin:"0 auto",minHeight:"100vh",background:B.darkGrad,color:B.cream,fontFamily:F,position:"relative",overflow:"hidden"};

  const navBtn=(id,Icon,label)=>{
    const a=screen===id||(id==="library"&&screen==="player");
    return(
      <button key={id} onClick={()=>id!=="player"&&setScreen(id)} style={{background:"none",border:"none",display:"flex",flexDirection:"column",alignItems:"center",gap:4,cursor:"pointer",opacity:a?1:0.35,transition:"opacity 0.3s",padding:"0 6px"}}>
        <Icon size={19} color={a?B.gold:B.cream} strokeWidth={a?2:1.5}/>
        <span style={{fontSize:8,color:a?B.gold:B.creamMuted,letterSpacing:1.5,textTransform:"uppercase",fontFamily:SF}}>{label}</span>
      </button>
    );
  };

  // ══════════ ONBOARDING ══════════
  if(!onboarded) {
    return <Onboarding onComplete={(name)=>{setUserName(name);setOnboarded(true);save('onboarded',true);}} />;
  }

  // ══════════ HOME ══════════
  const renderHome=()=>(
    <div style={{padding:"56px 22px 120px"}}>
      <div style={{textAlign:"center",marginBottom:40}}>
        <h1 style={{fontSize:20,letterSpacing:12,color:B.gold,fontWeight:400,margin:"0 0 6px",fontFamily:F}}>RHEI</h1>
        <div style={{width:40,height:1,background:B.gold,margin:"12px auto",opacity:0.4}}/>
        <p style={{fontSize:22,fontWeight:400,color:B.cream,margin:"16px 0 0",fontFamily:F}}>{greetUser(userName)}</p>
        <p style={{fontSize:13,color:B.muted,marginTop:6,fontStyle:"italic"}}>Your nervous system is listening.</p>
      </div>

      {/* Install prompt */}
      {showInstallPrompt&&!isStandalone&&(
        <div style={{width:"100%",background:`${B.gold}0D`,border:`1px solid ${B.borderActive}`,borderRadius:14,padding:"14px 16px",marginBottom:16,display:"flex",alignItems:"center",gap:12,textAlign:"left",position:"relative"}}>
          <button onClick={dismissInstall} style={{position:"absolute",top:8,right:8,background:"none",border:"none",cursor:"pointer",padding:4}}><X size={12} color={B.muted}/></button>
          <Sparkles size={18} color={B.gold} style={{flexShrink:0}}/>
          <button onClick={installApp} style={{flex:1,background:"none",border:"none",cursor:"pointer",textAlign:"left",padding:0}}>
            <p style={{fontSize:13,color:B.cream,margin:0,fontFamily:SF}}>Add to Home Screen</p>
            <p style={{fontSize:11,color:B.muted,margin:"2px 0 0",fontFamily:SF}}>{isIOS?"Tap here for instructions":"Open RHEI like an app — one tap away"}</p>
          </button>
          <ArrowRight size={14} color={B.gold} style={{flexShrink:0}}/>
        </div>
      )}

      {/* NS Score + Check-in */}
      <div style={{display:"flex",gap:14,marginBottom:24}}>
        <div style={{flex:"0 0 auto",background:B.card,borderRadius:18,padding:"18px 20px",border:`1px solid ${B.border}`,display:"flex",flexDirection:"column",alignItems:"center"}}>
          <p style={{fontSize:9,letterSpacing:2,color:B.muted,textTransform:"uppercase",fontFamily:SF,margin:"0 0 8px"}}>NS Score</p>
          <NSScore score={nsScore} size={86}/>
          <p style={{fontSize:10,color:nsScore>=70?"#5A8A5A":nsScore>=40?B.goldMuted:"#C4786A",margin:"6px 0 0",fontFamily:SF}}>
            {nsScore>=70?"Regulated":nsScore>=40?"Settling":"Activated"}
          </p>
        </div>
        <div style={{flex:1}}>
          {!checkinDone?(
            <button onClick={()=>setShowCheckin(true)} style={{width:"100%",height:"100%",background:B.card,border:`1px solid ${B.border}`,borderRadius:18,padding:"18px 16px",cursor:"pointer",textAlign:"left",display:"flex",flexDirection:"column",justifyContent:"space-between"}}>
              <div>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                  <Activity size={15} color={B.gold}/><span style={{fontSize:12,color:B.cream,fontFamily:SF,fontWeight:500}}>Daily Check-In</span>
                </div>
                <p style={{fontSize:12,color:B.muted,margin:0,fontFamily:SF,lineHeight:1.4}}>Where is your nervous system right now?</p>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:4,color:B.gold,fontSize:12,fontFamily:SF,marginTop:10}}><span>Begin</span><ArrowRight size={12}/></div>
            </button>
          ):(
            <div style={{width:"100%",height:"100%",background:B.card,border:`1px solid ${B.border}`,borderRadius:18,padding:"18px 16px",display:"flex",flexDirection:"column",justifyContent:"space-between"}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}><Check size={14} color="#5A8A5A"/><span style={{fontSize:12,color:B.cream,fontFamily:SF}}>Checked in</span></div>
              <p style={{fontSize:13,color:B.creamMuted,margin:"8px 0 0",fontFamily:SF}}>Feeling <strong style={{color:B.cream}}>{checkinState?.label?.toLowerCase()}</strong></p>
              <p style={{fontSize:11,color:B.muted,margin:"4px 0 0",fontFamily:SF}}>{checkinState?.recommended?.length} sessions recommended</p>
            </div>
          )}
        </div>
      </div>

      {/* Suggested */}
      <div style={{marginBottom:28}}>
        <p style={{fontSize:9,letterSpacing:3,color:B.muted,textTransform:"uppercase",marginBottom:12,fontFamily:SF}}>{checkinDone?"Recommended for you":"Suggested reset"}</p>
        <button onClick={()=>{const locked=suggested.id!==1&&!isPremium;if(locked){setScreen("premium");}else{startSession(suggested.id);}}} style={{width:"100%",background:B.card,border:`1px solid ${B.borderActive}`,borderRadius:20,padding:"26px 22px",cursor:"pointer",textAlign:"left",position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",top:-40,right:-40,width:180,height:180}}><Orb active={false} size={180}/></div>
          <div style={{position:"relative",zIndex:2}}>
            <p style={{fontSize:9,letterSpacing:2,color:B.gold,textTransform:"uppercase",margin:"0 0 10px",fontFamily:SF}}>{checkinDone?"Based on your check-in":`${timeCtx()} reset`}</p>
            <h2 style={{fontSize:21,color:B.cream,margin:"0 0 5px",fontWeight:400,fontFamily:F}}>{suggested.title}</h2>
            <p style={{fontSize:13,color:B.muted,margin:"0 0 18px",fontStyle:"italic"}}>{suggested.subtitle}</p>
            <div style={{display:"flex",alignItems:"center",gap:16}}>
              <div style={{width:42,height:42,borderRadius:"50%",background:B.goldGrad,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 4px 20px ${B.gold}25`}}>
                <Play size={16} color={B.warmBlack} fill={B.warmBlack} style={{marginLeft:2}}/>
              </div>
              <span style={{fontSize:12,color:B.muted,fontFamily:SF,display:"flex",alignItems:"center",gap:4}}><Clock size={12}/>{Math.ceil(suggested.duration/60)} min</span>
            </div>
          </div>
        </button>
      </div>

      {/* Micro-Interventions */}
      <div style={{marginBottom:28}}>
        <p style={{fontSize:9,letterSpacing:3,color:B.muted,textTransform:"uppercase",marginBottom:12,fontFamily:SF}}>No headphones needed</p>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          {[
            {id:"sigh",title:"Physiological Sigh",badge:"4 cycles",desc:"The fastest science-backed way to calm your nervous system."},
            {id:"ground",title:"5-4-3-2-1 Ground",badge:"5 senses",desc:"Anchor to the present moment through each sense."},
            {id:"jaw",title:"Jaw Release",badge:"3 holds",desc:"Release hidden tension. Activates your vagus nerve."},
            {id:"tap",title:"Butterfly Tap",badge:"30 sec",desc:"Bilateral stimulation that calms the amygdala."},
          ].map(mi=>(
            <button key={mi.id} onClick={()=>openMicro(mi.id)} style={{background:B.card,border:`1px solid ${B.border}`,borderRadius:14,padding:"16px 14px",cursor:"pointer",textAlign:"left"}}>
              <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:8}}>
                <Timer size={13} color={B.gold}/>
                <span style={{fontSize:9,color:B.gold,fontFamily:SF,background:`${B.gold}12`,padding:"2px 6px",borderRadius:6}}>{mi.badge}</span>
              </div>
              <p style={{fontSize:13,color:B.cream,margin:"0 0 3px",fontFamily:SF,fontWeight:500}}>{mi.title}</p>
              <p style={{fontSize:11,color:B.muted,margin:0,fontFamily:SF,lineHeight:1.3}}>{mi.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:28}}>
        {[{value:streak,label:"Streak",icon:Flame,color:"#C4786A"},{value:totalSessions,label:"Sessions",icon:Headphones,color:B.gold},{value:`${totalMinutes}m`,label:"Regulated",icon:Heart,color:"#5A8A5A"}].map((s,i)=>(
          <div key={i} style={{background:B.card,borderRadius:14,padding:"16px 12px",textAlign:"center",border:`1px solid ${B.border}`}}>
            <s.icon size={14} color={s.color} style={{marginBottom:6}}/><p style={{fontSize:20,color:B.cream,margin:"0 0 2px",fontFamily:SF,fontWeight:300}}>{s.value}</p>
            <p style={{fontSize:9,color:B.muted,margin:0,letterSpacing:1,textTransform:"uppercase",fontFamily:SF}}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Today's resets */}
      <p style={{fontSize:9,letterSpacing:3,color:B.muted,textTransform:"uppercase",marginBottom:10,fontFamily:SF}}>Today's resets</p>
      <div style={{display:"flex",gap:6,marginBottom:6}}>{sessions.map(s=><div key={s.id} style={{flex:1,height:3,borderRadius:2,background:completedToday.includes(s.id)?B.gold:`${B.gold}12`,transition:"background 0.5s"}}/>)}</div>
      <p style={{fontSize:11,color:B.muted,fontFamily:SF}}>{completedToday.length} of 5</p>
    </div>
  );

  // ══════════ LIBRARY ══════════
  const renderLibrary=()=>(
    <div style={{padding:"56px 22px 120px"}}>
      <div style={{textAlign:"center",marginBottom:36}}>
        <p style={{fontSize:9,letterSpacing:3,color:B.muted,textTransform:"uppercase",fontFamily:SF,marginBottom:6}}>Reset Library</p>
        <h1 style={{fontSize:22,fontWeight:400,color:B.cream,margin:0}}>Your Sessions</h1>
        <p style={{fontSize:13,color:B.muted,marginTop:6,fontStyle:"italic"}}>Precision regulation for every moment.</p>
      </div>
      {sessions.map(s=>{
        const Icon=s.icon; const done=completedToday.includes(s.id); const rec=checkinDone&&checkinState?.recommended?.includes(s.id);
        const premiumLocked = s.id!==1 && !isPremium;
        return(
          <button key={s.id} onClick={()=>{if(premiumLocked){setScreen("premium");}else{startSession(s.id);}}} style={{width:"100%",background:B.card,border:`1px solid ${rec?B.borderActive:B.border}`,borderRadius:18,padding:"20px 18px",marginBottom:12,cursor:"pointer",textAlign:"left",position:"relative",overflow:"hidden",opacity:premiumLocked?0.7:1}}>
            {premiumLocked&&<div style={{position:"absolute",top:14,right:14,display:"flex",alignItems:"center",gap:4,background:`${B.gold}12`,padding:"4px 10px",borderRadius:8}}>
              <Lock size={9} color={B.gold}/><span style={{fontSize:8,letterSpacing:1.5,color:B.gold,fontFamily:SF,textTransform:"uppercase"}}>Premium</span>
            </div>}
            {!premiumLocked&&rec&&<div style={{position:"absolute",top:14,right:14,fontSize:8,letterSpacing:1.5,color:B.gold,background:`${B.gold}15`,padding:"3px 8px",borderRadius:8,fontFamily:SF,textTransform:"uppercase"}}>Recommended</div>}
            <div style={{display:"flex",alignItems:"flex-start",gap:14}}>
              <div style={{width:44,height:44,borderRadius:"50%",background:`${B.gold}12`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:2}}>
                {done?<Check size={18} color="#5A8A5A"/>:<Icon size={18} color={B.gold}/>}
              </div>
              <div style={{flex:1}}>
                <h3 style={{fontSize:16,color:B.cream,margin:"0 0 3px",fontWeight:400,fontFamily:F}}>{s.title}</h3>
                <p style={{fontSize:12,color:B.goldMuted,margin:"0 0 8px",fontStyle:"italic"}}>{s.subtitle}</p>
                <p style={{fontSize:11,color:B.muted,margin:"0 0 10px",lineHeight:1.5,fontFamily:SF}}>{s.description}</p>
                <div style={{display:"flex",alignItems:"center",gap:14}}>
                  <span style={{fontSize:11,color:B.muted,fontFamily:SF,display:"flex",alignItems:"center",gap:4}}><Clock size={11}/>{Math.ceil(s.duration/60)} min</span>
                  <span style={{fontSize:11,color:premiumLocked?B.muted:B.gold,fontFamily:SF}}>{premiumLocked?"Unlock →":"Begin →"}</span>
                </div>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );

  // ══════════ PLAYER ══════════
  const renderPlayer=()=>{
    if(!cur)return null;
    return(
      <div style={{padding:"36px 22px 120px",minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center"}}>
        <button onClick={exitPlayer} style={{position:"absolute",top:18,left:18,background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:4,color:B.muted,fontFamily:SF,fontSize:12}}><ChevronLeft size={16}/><span>Back</span></button>
        <div style={{textAlign:"center",marginTop:36,marginBottom:36}}>
          <p style={{fontSize:9,letterSpacing:3,color:B.gold,textTransform:"uppercase",fontFamily:SF,marginBottom:8}}>Now playing</p>
          <h1 style={{fontSize:24,fontWeight:400,color:B.cream,margin:"0 0 4px"}}>{cur.title}</h1>
          <p style={{fontSize:13,color:B.muted,fontStyle:"italic"}}>{cur.subtitle}</p>
        </div>
        <div style={{position:"relative",width:220,height:220,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:44}}>
          <Orb active={isPlaying} size={220}/><Ring progress={progress} size={220}/>
          <div style={{position:"absolute",textAlign:"center",zIndex:5}}>
            <p style={{fontSize:36,color:B.cream,margin:0,fontFamily:SF,fontWeight:300}}>{fmt(remaining)}</p>
            <p style={{fontSize:9,color:B.muted,margin:"4px 0 0",letterSpacing:2,textTransform:"uppercase",fontFamily:SF}}>remaining</p>
          </div>
        </div>
        <button onClick={togglePlay} disabled={audioLoading} style={{width:68,height:68,borderRadius:"50%",background:audioLoading?B.card:B.goldGrad,border:"none",cursor:audioLoading?"wait":"pointer",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:36,boxShadow:audioLoading?"none":`0 6px 28px ${B.gold}30`,opacity:audioLoading?0.6:1,transition:"opacity 0.3s"}}>
          {audioLoading?<div style={{width:24,height:24,border:`2px solid ${B.gold}40`,borderTop:`2px solid ${B.gold}`,borderRadius:"50%",animation:"spin 1s linear infinite"}}/>:isPlaying?<Pause size={24} color={B.warmBlack}/>:<Play size={24} color={B.warmBlack} fill={B.warmBlack} style={{marginLeft:3}}/>}
        </button>
        <div style={{width:"100%",marginBottom:32}}>
          <div onClick={seekAudio} style={{width:"100%",height:16,display:"flex",alignItems:"center",cursor:"pointer",padding:"6px 0"}}>
            <div style={{width:"100%",height:3,borderRadius:2,background:`${B.gold}12`,position:"relative"}}>
              <div style={{width:`${progress}%`,height:"100%",borderRadius:2,background:B.goldGrad,transition:"width 0.3s linear",position:"relative"}}>
                <div style={{position:"absolute",right:-5,top:-4,width:10,height:10,borderRadius:"50%",background:B.gold,boxShadow:`0 0 8px ${B.gold}50`,opacity:isPlaying?1:0,transition:"opacity 0.3s"}}/>
              </div>
            </div>
          </div>
          <div style={{display:"flex",justifyContent:"space-between",marginTop:2}}>
            <span style={{fontSize:10,color:B.muted,fontFamily:SF}}>{fmt(elapsed)}</span>
            <span style={{fontSize:10,color:B.muted,fontFamily:SF}}>{fmt(effDur)}</span>
          </div>
        </div>
        <div style={{width:"100%",background:B.card,borderRadius:16,padding:"18px",border:`1px solid ${B.border}`}}>
          <p style={{fontSize:9,letterSpacing:2,color:B.gold,textTransform:"uppercase",fontFamily:SF,margin:"0 0 10px"}}>Technique</p>
          <p style={{fontSize:12,color:B.creamMuted,margin:"0 0 12px",lineHeight:1.5,fontFamily:SF}}>{cur.technique}</p>
          <div style={{display:"flex",alignItems:"center",gap:5,opacity:0.6}}><Clock size={11} color={B.muted}/><span style={{fontSize:11,color:B.muted,fontFamily:SF}}>Best for: {cur.bestFor}</span></div>
        </div>
        {showComplete&&(
          <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:`${B.warmBlack}F2`,display:"flex",alignItems:"center",justifyContent:"center",zIndex:100}}>
            <div style={{textAlign:"center",padding:32,maxWidth:340}}>
              <div style={{width:72,height:72,borderRadius:"50%",background:`${B.gold}15`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px",border:`1px solid ${B.gold}30`}}><Check size={30} color={B.gold}/></div>
              <h2 style={{fontSize:22,color:B.cream,fontWeight:400,margin:"0 0 6px",fontFamily:F}}>Reset Complete</h2>
              <p style={{fontSize:13,color:B.muted,fontStyle:"italic",margin:"0 0 8px"}}>Your nervous system thanks you{userName?`, ${userName}`:""}</p>
              <p style={{fontSize:12,color:B.gold,fontFamily:SF,margin:"0 0 28px"}}>NS Score: {nsScore} (+8)</p>
              <div style={{display:"flex",gap:8,justifyContent:"center",marginBottom:24}}>
                {[{v:`${Math.ceil(cur.duration/60)}m`,l:"Duration"},{v:completedToday.length,l:"Today"},{v:streak,l:"Streak"}].map((s,i)=>(
                  <div key={i} style={{background:B.card,borderRadius:12,padding:"12px 18px",border:`1px solid ${B.border}`}}>
                    <p style={{fontSize:18,color:B.cream,margin:0,fontFamily:SF,fontWeight:300}}>{s.v}</p>
                    <p style={{fontSize:9,color:B.muted,margin:"2px 0 0",letterSpacing:1,textTransform:"uppercase",fontFamily:SF}}>{s.l}</p>
                  </div>
                ))}
              </div>
              <button onClick={exitPlayer} style={{background:B.goldGrad,border:"none",borderRadius:28,padding:"13px 36px",cursor:"pointer",color:B.warmBlack,fontSize:13,fontFamily:SF,letterSpacing:1,fontWeight:500}}>Continue</button>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ══════════ RITUALS ══════════
  const renderRituals=()=>(
    <div style={{padding:"56px 22px 120px"}}>
      <div style={{textAlign:"center",marginBottom:36}}>
        <p style={{fontSize:9,letterSpacing:3,color:B.muted,textTransform:"uppercase",fontFamily:SF,marginBottom:6}}>Face Rituals</p>
        <h1 style={{fontSize:22,fontWeight:400,color:B.cream,margin:0}}>Ritual Guides</h1>
        <p style={{fontSize:13,color:B.muted,marginTop:6,fontStyle:"italic"}}>Sculpt, de-puff, and lift — guided step by step.</p>
      </div>

      {rituals.map(r=>{
        const locked = r.isPremium && !isPremium;
        return (
          <button key={r.id} onClick={()=>{if(locked){setScreen("premium");}else{setActiveRitual(r);}}} style={{width:"100%",background:B.card,border:`1px solid ${locked?B.border:B.borderActive}`,borderRadius:18,padding:"20px 18px",marginBottom:14,cursor:"pointer",textAlign:"left",position:"relative",overflow:"hidden",opacity:locked?0.75:1}}>
            {locked && <div style={{position:"absolute",top:14,right:14,display:"flex",alignItems:"center",gap:4,background:`${B.gold}12`,padding:"4px 10px",borderRadius:8}}>
              <Lock size={10} color={B.gold}/><span style={{fontSize:8,letterSpacing:1.5,color:B.gold,fontFamily:SF,textTransform:"uppercase"}}>Premium</span>
            </div>}
            {!locked && !r.isPremium && <div style={{position:"absolute",top:14,right:14,fontSize:8,letterSpacing:1.5,color:"#5A8A5A",background:"#5A8A5A15",padding:"3px 8px",borderRadius:8,fontFamily:SF,textTransform:"uppercase"}}>Free</div>}
            <div style={{display:"flex",alignItems:"center",gap:14}}>
              <div style={{width:56,height:56,borderRadius:14,background:`${B.gold}08`,border:`1px solid ${B.border}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,overflow:"hidden"}}>
                <img src={r.svgFile} alt="" style={{width:40,height:40,objectFit:"contain",opacity:0.7}} onError={(e)=>{e.target.style.display='none';}}/>
              </div>
              <div style={{flex:1}}>
                <h3 style={{fontSize:16,color:B.cream,margin:"0 0 3px",fontWeight:400,fontFamily:F}}>{r.title}</h3>
                <p style={{fontSize:12,color:B.goldMuted,margin:"0 0 6px",fontStyle:"italic"}}>{r.subtitle}</p>
                <div style={{display:"flex",alignItems:"center",gap:12}}>
                  <span style={{fontSize:11,color:B.muted,fontFamily:SF,display:"flex",alignItems:"center",gap:4}}><Clock size={11}/>{r.duration}</span>
                  <span style={{fontSize:11,color:B.muted,fontFamily:SF}}>{r.steps.length} steps</span>
                  <span style={{fontSize:11,color:locked?B.muted:B.gold,fontFamily:SF}}>{locked?"Unlock →":"Begin →"}</span>
                </div>
              </div>
            </div>
          </button>
        );
      })}

      {/* Teaser */}
      {!isPremium && (
        <div style={{background:`linear-gradient(135deg, ${B.card} 0%, #3A2516 100%)`,borderRadius:18,padding:"24px 20px",marginTop:8,border:`1px solid ${B.borderActive}`,textAlign:"center"}}>
          <Crown size={24} color={B.gold} style={{marginBottom:10}}/>
          <h3 style={{fontSize:16,color:B.cream,fontWeight:400,margin:"0 0 6px",fontFamily:F}}>Unlock All Rituals</h3>
          <p style={{fontSize:12,color:B.muted,margin:"0 0 16px",fontFamily:SF,lineHeight:1.5}}>Get full access to every guided face ritual — gua sha, lymphatic drainage, face lifting, and all future guides.</p>
          <button onClick={()=>setScreen("premium")} style={{background:B.goldGrad,border:"none",borderRadius:24,padding:"12px 28px",cursor:"pointer",color:B.warmBlack,fontSize:12,fontFamily:SF,letterSpacing:1,fontWeight:600}}>See Premium Plans</button>
        </div>
      )}
    </div>
  );

  // ══════════ PREMIUM (replaces shop) ══════════
  const renderPremium=()=>(
    <div style={{padding:"56px 22px 120px"}}>
      <div style={{textAlign:"center",marginBottom:36}}>
        <Crown size={28} color={B.gold} style={{marginBottom:12}}/>
        <h1 style={{fontSize:24,fontWeight:400,color:B.cream,margin:"0 0 6px",fontFamily:F}}>RHEI Premium</h1>
        <p style={{fontSize:13,color:B.muted,fontStyle:"italic"}}>The complete nervous system + beauty ritual experience.</p>
      </div>

      {/* What you get */}
      <div style={{background:B.card,borderRadius:18,padding:"22px 20px",marginBottom:16,border:`1px solid ${B.border}`}}>
        <p style={{fontSize:10,letterSpacing:2,color:B.gold,textTransform:"uppercase",fontFamily:SF,margin:"0 0 16px"}}>Everything included</p>
        {[
          {text:"Morning Reset (free forever)", free:true},
          {text:"Pre-Meeting Reset", free:false},
          {text:"The Transition Reset", free:false},
          {text:"Post-Conflict Reset", free:false},
          {text:"General Reset", free:false},
          {text:"4 micro-interventions", free:true},
          {text:"Gua Sha Sculpt ritual guide", free:true},
          {text:"Lymphatic Drainage ritual guide", free:false},
          {text:"Face Lifting ritual guide", free:false},
          {text:"Daily NS Score tracking", free:true},
          {text:"All future ritual guides & sessions", free:false},
          {text:"Priority access to new features", free:false},
        ].map((f,i)=>(
          <div key={i} style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
            <div style={{width:18,height:18,borderRadius:"50%",background:f.free?`#5A8A5A20`:`${B.gold}15`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              {f.free?<Check size={9} color={"#5A8A5A"}/>:<Crown size={9} color={B.gold}/>}
            </div>
            <span style={{fontSize:12,color:f.free?B.creamMuted:B.cream,fontFamily:SF}}>{f.text}{f.free?" ✓":""}</span>
          </div>
        ))}
      </div>

      {/* Pricing */}
      {checkoutLoading && <div style={{textAlign:"center",padding:16,marginBottom:12}}><p style={{fontSize:12,color:B.muted,fontFamily:SF}}>Opening checkout...</p></div>}
      <div style={{display:"flex",gap:12,marginBottom:20}}>
        <button onClick={()=>handleCheckout('monthly')} disabled={checkoutLoading} style={{flex:1,background:B.card,borderRadius:16,padding:"20px 16px",textAlign:"center",border:`1px solid ${B.border}`,cursor:checkoutLoading?"wait":"pointer",opacity:checkoutLoading?0.6:1}}>
          <p style={{fontSize:26,color:B.cream,margin:"0 0 2px",fontFamily:SF,fontWeight:300}}>$9<span style={{fontSize:14,color:B.muted}}>.99</span></p>
          <p style={{fontSize:10,color:B.muted,margin:"0 0 8px",fontFamily:SF,textTransform:"uppercase",letterSpacing:1}}>per month</p>
          <div style={{background:`${B.gold}15`,borderRadius:12,padding:"8px",color:B.gold,fontSize:11,fontFamily:SF}}>Subscribe</div>
        </button>
        <button onClick={()=>handleCheckout('yearly')} disabled={checkoutLoading} style={{flex:1,background:B.card,borderRadius:16,padding:"20px 16px",textAlign:"center",border:`1px solid ${B.borderActive}`,cursor:checkoutLoading?"wait":"pointer",position:"relative",opacity:checkoutLoading?0.6:1}}>
          <div style={{position:"absolute",top:-8,left:"50%",transform:"translateX(-50%)",background:B.goldGrad,padding:"3px 10px",borderRadius:10,fontSize:8,color:B.warmBlack,fontWeight:600,letterSpacing:1,fontFamily:SF,textTransform:"uppercase"}}>Save 59%</div>
          <p style={{fontSize:26,color:B.cream,margin:"0 0 2px",fontFamily:SF,fontWeight:300}}>$49</p>
          <p style={{fontSize:10,color:B.muted,margin:"0 0 8px",fontFamily:SF,textTransform:"uppercase",letterSpacing:1}}>per year</p>
          <div style={{background:B.goldGrad,borderRadius:12,padding:"8px",color:B.warmBlack,fontSize:11,fontFamily:SF,fontWeight:600}}>Best Value</div>
        </button>
      </div>

      {/* Restore / Already premium */}
      <div style={{textAlign:"center",marginTop:8}}>
        {supabase && !authUser ? (
          <div style={{background:B.card,borderRadius:14,padding:"16px 18px",border:`1px solid ${B.border}`,textAlign:"center",marginTop:8}}>
            <p style={{fontSize:11,color:B.muted,fontFamily:SF,margin:"0 0 10px"}}>Already purchased? Sign in to restore access.</p>
            <div style={{display:"flex",gap:8,maxWidth:340,margin:"0 auto"}}>
              <input type="email" placeholder="your@email.com" value={authEmail} onChange={e=>setAuthEmail(e.target.value)} onKeyDown={e=>e.key==='Enter'&&signInWithEmail()} style={{flex:1,background:B.bgDeep,border:`1px solid ${B.border}`,borderRadius:8,padding:"8px 12px",color:B.cream,fontSize:12,fontFamily:SF,outline:"none"}}/>
              <button onClick={signInWithEmail} style={{background:`${B.gold}15`,border:`1px solid ${B.border}`,borderRadius:8,padding:"8px 14px",cursor:"pointer",color:B.gold,fontSize:11,fontFamily:SF,whiteSpace:"nowrap"}}>Sign in</button>
            </div>
            {authSent && <p style={{fontSize:11,color:"#5A8A5A",fontFamily:SF,margin:"8px 0 0"}}>Check your email for a sign-in link.</p>}
            {authError && <p style={{fontSize:11,color:"#C4786A",fontFamily:SF,margin:"8px 0 0"}}>{authError}</p>}
          </div>
        ) : (
          <button onClick={()=>{
            if(authUser?.email){
              fetch('/api/check-subscription',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:authUser.email})})
                .then(r=>r.json()).then(data=>{if(data.isPremium){setIsPremium(true);save('isPremium',true);}else{alert('No active subscription found for this email.');}}).catch(()=>alert('Could not verify. Try again.'));
            } else {setIsPremium(true);save('isPremium',true);}
          }} style={{background:"none",border:"none",color:B.muted,fontSize:11,fontFamily:SF,cursor:"pointer",padding:8,textDecoration:"underline"}}>Already purchased? Restore access</button>
        )}
      </div>

    </div>
  );

  // ══════════ PROGRESS ══════════
  const renderProgress=()=>{
    const wd=["M","T","W","T","F","S","S"];
    return(
      <div style={{padding:"56px 22px 120px"}}>
        <div style={{textAlign:"center",marginBottom:36}}>
          <p style={{fontSize:9,letterSpacing:3,color:B.muted,textTransform:"uppercase",fontFamily:SF,marginBottom:6}}>Your Journey</p>
          <h1 style={{fontSize:22,fontWeight:400,color:B.cream,margin:0}}>Progress</h1>
          {userName && <p style={{fontSize:13,color:B.muted,marginTop:6,fontStyle:"italic"}}>Keep showing up, {userName}.</p>}
        </div>
        <div style={{background:B.card,borderRadius:18,padding:"22px 20px",marginBottom:16,border:`1px solid ${B.border}`}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
            <div>
              <p style={{fontSize:9,letterSpacing:2,color:B.gold,textTransform:"uppercase",fontFamily:SF,margin:"0 0 6px"}}>Nervous System Score</p>
              <div style={{display:"flex",alignItems:"baseline",gap:8}}>
                <span style={{fontSize:36,color:B.cream,fontFamily:SF,fontWeight:300}}>{nsScore}</span>
                <span style={{fontSize:12,color:"#5A8A5A",fontFamily:SF}}>{scoreHistory.length>1&&nsScore>scoreHistory[scoreHistory.length-2]?"↑ Improving":nsScore>=60?"Stable":"↓ Monitor"}</span>
              </div>
            </div>
            <NSScore score={nsScore} size={70}/>
          </div>
          <div style={{display:"flex",alignItems:"end",gap:6,height:50,marginTop:8}}>
            {scoreHistory.map((s,i)=>{const h=(s/100)*45;const col=s>=70?"#5A8A5A":s>=40?B.gold:"#C4786A";
              return <div key={i} style={{flex:1}}><div style={{width:"100%",height:h,borderRadius:3,background:i===scoreHistory.length-1?col:`${col}50`,transition:"height 0.8s ease"}}/></div>;
            })}
          </div>
          <p style={{fontSize:10,color:B.muted,fontFamily:SF,marginTop:8,textAlign:"center"}}>Last 7 check-ins</p>
        </div>
        <div style={{background:B.card,borderRadius:18,padding:"22px 20px",marginBottom:16,border:`1px solid ${B.border}`,textAlign:"center"}}>
          <Flame size={22} color="#C4786A" style={{marginBottom:8}}/>
          <p style={{fontSize:36,color:B.cream,margin:"0 0 4px",fontFamily:SF,fontWeight:300}}>{streak}</p>
          <p style={{fontSize:9,color:B.muted,letterSpacing:2,textTransform:"uppercase",fontFamily:SF,margin:"0 0 18px"}}>Day streak</p>
          <div style={{display:"flex",justifyContent:"center",gap:8}}>
            {wd.map((d,i)=>(
              <div key={i} style={{textAlign:"center"}}>
                <div style={{width:30,height:30,borderRadius:"50%",background:i===new Date().getDay()-1||(i===6&&new Date().getDay()===0)?`${B.gold}25`:`${B.gold}08`,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:3,border:i<streak?`1px solid ${B.gold}30`:"none"}}>
                  {i<streak&&<Check size={12} color={B.gold}/>}
                </div>
                <span style={{fontSize:9,color:B.muted,fontFamily:SF}}>{d}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
          {[{v:totalSessions,l:"Total Sessions",sub:"All time"},{v:`${totalMinutes}m`,l:"Regulated",sub:"All time"},{v:completedToday.length,l:"Today",sub:"of 5 sessions"},{v:"3m",l:"Avg Session",sub:"This week"}].map((s,i)=>(
            <div key={i} style={{background:B.card,borderRadius:14,padding:"16px 14px",border:`1px solid ${B.border}`}}>
              <p style={{fontSize:24,color:B.cream,margin:"0 0 4px",fontFamily:SF,fontWeight:300}}>{s.v}</p>
              <p style={{fontSize:11,color:B.cream,margin:"0 0 2px",fontFamily:SF}}>{s.l}</p>
              <p style={{fontSize:10,color:B.muted,margin:0,fontFamily:SF}}>{s.sub}</p>
            </div>
          ))}
        </div>

        {/* Profile & Account */}
        <div style={{background:B.card,borderRadius:14,padding:"16px 18px",border:`1px solid ${B.border}`,marginTop:16}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:authUser?12:0}}>
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              <div style={{width:36,height:36,borderRadius:"50%",background:`${B.gold}15`,display:"flex",alignItems:"center",justifyContent:"center"}}>
                <User size={16} color={B.gold}/>
              </div>
              <div>
                <p style={{fontSize:13,color:B.cream,margin:0,fontFamily:SF}}>{userName||"Set your name"}</p>
                <p style={{fontSize:10,color:B.muted,margin:"2px 0 0",fontFamily:SF}}>{isPremium?"Premium Member":"Free Plan"}</p>
              </div>
            </div>
            <button onClick={()=>{const n=prompt("What should we call you?",userName);if(n!==null){setUserName(n);save('userName',n);}}} style={{background:"none",border:`1px solid ${B.border}`,borderRadius:8,padding:"6px 12px",cursor:"pointer",color:B.muted,fontSize:10,fontFamily:SF}}>Edit</button>
          </div>
          {supabase && authUser && (
            <div style={{borderTop:`1px solid ${B.border}`,paddingTop:12,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <Mail size={12} color={B.muted}/>
                <span style={{fontSize:11,color:B.muted,fontFamily:SF}}>{authUser.email}</span>
              </div>
              <button onClick={signOut} style={{background:"none",border:`1px solid ${B.border}`,borderRadius:8,padding:"5px 10px",cursor:"pointer",color:B.muted,fontSize:10,fontFamily:SF,display:"flex",alignItems:"center",gap:4}}>
                <LogOut size={10}/>Sign out
              </button>
            </div>
          )}
          {supabase && !authUser && (
            <div style={{borderTop:`1px solid ${B.border}`,paddingTop:12,marginTop:12}}>
              <p style={{fontSize:10,color:B.muted,fontFamily:SF,margin:"0 0 8px"}}>Sign in to sync your premium access across devices</p>
              <div style={{display:"flex",gap:8}}>
                <input type="email" placeholder="your@email.com" value={authEmail} onChange={e=>setAuthEmail(e.target.value)} onKeyDown={e=>e.key==='Enter'&&signInWithEmail()} style={{flex:1,background:B.bgDeep,border:`1px solid ${B.border}`,borderRadius:8,padding:"8px 12px",color:B.cream,fontSize:12,fontFamily:SF,outline:"none"}}/>
                <button onClick={signInWithEmail} style={{background:`${B.gold}15`,border:`1px solid ${B.border}`,borderRadius:8,padding:"8px 14px",cursor:"pointer",color:B.gold,fontSize:11,fontFamily:SF,whiteSpace:"nowrap"}}>Sign in</button>
              </div>
              {authSent && <p style={{fontSize:11,color:"#5A8A5A",fontFamily:SF,margin:"8px 0 0"}}>Check your email for a sign-in link.</p>}
              {authError && <p style={{fontSize:11,color:"#C4786A",fontFamily:SF,margin:"8px 0 0"}}>{authError}</p>}
            </div>
          )}
        </div>
      </div>
    );
  };

  // ══════════ CHECK-IN MODAL (Redesigned) ══════════
  const renderCheckin=()=>(
    <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:`${B.warmBlack}F5`,zIndex:100,display:"flex",alignItems:"center",justifyContent:"center",overflowY:"auto"}}>
      <div style={{width:"100%",maxWidth:390,padding:"32px 22px"}}>
        <button onClick={()=>{setShowCheckin(false);setSelectedCheckin(null);}} style={{position:"absolute",top:18,right:18,background:"none",border:"none",cursor:"pointer"}}><X size={18} color={B.muted}/></button>
        <div style={{textAlign:"center",marginBottom:24}}>
          <p style={{fontSize:9,letterSpacing:3,color:B.gold,textTransform:"uppercase",fontFamily:SF,marginBottom:10}}>Nervous System Check-In</p>
          <h2 style={{fontSize:20,color:B.cream,fontWeight:400,margin:"0 0 6px",fontFamily:F}}>How are you arriving{userName?`, ${userName}`:""}?</h2>
          <p style={{fontSize:12,color:B.muted,fontStyle:"italic",marginBottom:4}}>No judgment. Just awareness.</p>
          <p style={{fontSize:11,color:B.gold,fontFamily:SF,background:`${B.gold}0D`,display:"inline-block",padding:"4px 12px",borderRadius:20,marginTop:8}}>↓ Select one state below</p>
        </div>
        {nsStates.map(state=>{const Icon=state.icon; const selected=selectedCheckin?.id===state.id; return(
          <button key={state.id} onClick={()=>setSelectedCheckin(state)} style={{width:"100%",background:selected?`${state.color}15`:B.card,border:`2px solid ${selected?state.color:B.border}`,borderRadius:14,padding:"15px 16px",marginBottom:8,cursor:"pointer",display:"flex",alignItems:"center",gap:12,textAlign:"left",transition:"all 0.2s",position:"relative"}}>
            {/* Radio indicator */}
            <div style={{width:22,height:22,borderRadius:"50%",border:`2px solid ${selected?state.color:`${B.gold}30`}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all 0.2s"}}>
              {selected && <div style={{width:12,height:12,borderRadius:"50%",background:state.color,transition:"all 0.2s"}}/>}
            </div>
            <div style={{width:36,height:36,borderRadius:"50%",background:`${state.color}15`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              <Icon size={16} color={state.color}/>
            </div>
            <div style={{flex:1}}>
              <p style={{fontSize:14,color:selected?B.cream:B.creamMuted,margin:"0 0 2px",fontFamily:SF,fontWeight:selected?500:400}}>{state.label}</p>
              <p style={{fontSize:11,color:B.muted,margin:0,fontFamily:SF}}>{state.sublabel}</p>
            </div>
            {selected && <div style={{position:"absolute",top:8,right:12,fontSize:8,letterSpacing:1,color:state.color,fontFamily:SF,textTransform:"uppercase",fontWeight:600}}>Selected</div>}
          </button>
        );})}
        <button onClick={()=>{if(selectedCheckin) doCheckin(selectedCheckin);}} disabled={!selectedCheckin} style={{width:"100%",marginTop:12,background:selectedCheckin?B.goldGrad:`${B.gold}20`,border:"none",borderRadius:28,padding:"15px",cursor:selectedCheckin?"pointer":"not-allowed",color:selectedCheckin?B.warmBlack:B.muted,fontSize:14,fontFamily:SF,letterSpacing:1,fontWeight:600,opacity:selectedCheckin?1:0.4,transition:"all 0.3s"}}>
          {selectedCheckin?`Continue as "${selectedCheckin.label}"`:"Select a state to continue"}
        </button>
      </div>
    </div>
  );

  // ══════════ MICRO-INTERVENTION MODAL ══════════
  const renderMicro=()=>{
    if(!microActive)return null;
    return(
      <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:`${B.warmBlack}F8`,zIndex:100,display:"flex",alignItems:"center",justifyContent:"center",overflowY:"auto"}}>
        <div style={{width:"100%",maxWidth:390}}>
          <button onClick={closeMicro} style={{position:"absolute",top:18,right:18,background:"none",border:"none",cursor:"pointer",zIndex:10}}><X size={18} color={B.muted}/></button>
          {microDone ? <GuideComplete message={microMsg} onClose={closeMicro}/> : (
            <>
              {microActive==="sigh"&&<GuideSigh onComplete={()=>completeMicro("NS Score +3 · Cortisol reduced",3)}/>}
              {microActive==="ground"&&<GuideGround onComplete={()=>completeMicro("NS Score +3 · Grounded in the present",3)}/>}
              {microActive==="jaw"&&<GuideJaw onComplete={()=>completeMicro("NS Score +2 · Vagus nerve activated",2)}/>}
              {microActive==="tap"&&<GuideTap onComplete={()=>completeMicro("NS Score +2 · Amygdala calmed",2)}/>}
            </>
          )}
        </div>
      </div>
    );
  };

  // ══════════ RENDER ══════════
  return(
    <div style={container}>
      <style>{`@keyframes spin{to{transform:rotate(360deg);}} @keyframes fadeIn{from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:translateY(0);}}`}</style>
      {screen==="home"&&renderHome()}
      {screen==="library"&&renderLibrary()}
      {screen==="player"&&renderPlayer()}
      {screen==="rituals"&&renderRituals()}
      {screen==="premium"&&renderPremium()}
      {screen==="progress"&&renderProgress()}
      {showCheckin&&renderCheckin()}
      {microActive&&renderMicro()}
      {activeRitual&&<RitualPlayer ritual={activeRitual} onClose={()=>setActiveRitual(null)}/>}
      {/* Bottom Nav */}
      <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:430,background:`${B.bgDeep}F0`,backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)",borderTop:`1px solid ${B.border}`,display:"flex",justifyContent:"space-around",padding:"11px 0 env(safe-area-inset-bottom, 26px)",paddingBottom:"max(env(safe-area-inset-bottom), 26px)",zIndex:50}}>
        {navBtn("home",Home,"Home")}
        {navBtn("library",Headphones,"Resets")}
        {navBtn("rituals",Sparkles,"Rituals")}
        {navBtn("premium",Crown,"Premium")}
        {navBtn("progress",BarChart3,"Journey")}
      </div>
    </div>
  );
}
