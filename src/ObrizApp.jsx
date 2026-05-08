import { useState, useEffect, useRef, useCallback } from "react";
import { Play, Pause, ChevronLeft, Moon, Sun, Wind, Shield, ShoppingBag, Home, Headphones, BarChart3, Heart, Clock, Check, Flame, X, ArrowRight, Brain, Activity, Zap, Sunset, Timer, Waves, RefreshCw, Sparkles, Lock, Star, Crown, User, ChevronRight, Hand, Mail, LogOut, Camera } from "lucide-react";
import { supabase } from "./supabaseClient";
import FaceMirrorMode from "./FaceMirrorMode";
import FaceGuideIllustration from "./FaceGuideIllustration";

/* ═══════════════════════════════════════════
   RHEI — Your face is where your nervous system shows.
   v3.0 — Face-first. Everything else follows.
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

// ── Audio Resets ──
const sessions = [
  { id:1, title:"Morning", subtitle:"Before the day begins", duration:179, icon:Sun, description:"Your cortisol peaks in the first hour. This sets the tone before anything else can.", technique:"Extended exhale · Somatic grounding · Vagal humming", bestFor:"First minutes after waking", timeOfDay:"morning", audioFile:"/audio/morning-reset.mp3", occasion:"morning" },
  { id:2, title:"Before", subtitle:"Walk in composed", duration:200, icon:Shield, description:"The body reads a high-stakes moment as threat. This returns it to choice.", technique:"Physiological sigh · Grounding · Cognitive anchor", bestFor:"Five minutes before anything that matters", timeOfDay:"any", audioFile:"/audio/pre-meeting-reset.mp3", occasion:"event" },
  { id:3, title:"After", subtitle:"Come home to yourself", duration:234, icon:Sunset, description:"Performance mode lingers. This is the release valve between who you are at work and who you are at home.", technique:"Progressive release · Body scan · Identity shift", bestFor:"The commute. The threshold. Before you walk in.", timeOfDay:"evening", audioFile:"/audio/transition-reset.mp3", occasion:"evening" },
  { id:4, title:"Release", subtitle:"Put down what isn't yours", duration:194, icon:Wind, description:"After a hard conversation, the body stays activated. This is how you actually leave it.", technique:"Bilateral stimulation · Physiological sigh · Self-return", bestFor:"After conflict, emotional labor, or anything that cost you", timeOfDay:"any", audioFile:"/audio/post-conflict-reset.mp3", occasion:"recovery" },
  { id:5, title:"Return", subtitle:"Come back", duration:172, icon:RefreshCw, description:"The anchor. Anytime. Anywhere. Three minutes to find yourself again.", technique:"Diaphragmatic breathing · Body awareness · Vagal activation", bestFor:"Any moment you've lost the thread", timeOfDay:"any", audioFile:"/audio/general-reset.mp3", occasion:"any" },
];

const nsStates = [
  { id:"wired", label:"Wired", sublabel:"Jaw tight. Edges up. Can't land.", icon:Zap, color:"#C4786A", recommended:[2,4], ritualId:"gua-sha", score:25 },
  { id:"foggy", label:"Heavy", sublabel:"Face puffy. Running on empty.", icon:Brain, color:"#8A9BAF", recommended:[1,3], ritualId:"lymphatic", score:35 },
  { id:"reactive", label:"Raw", sublabel:"Everything close to the surface.", icon:Activity, color:"#A08BAA", recommended:[4,2], ritualId:"buccal", score:30 },
  { id:"exhausted", label:"Depleted", sublabel:"Drained but can't rest.", icon:Moon, color:"#7A8B99", recommended:[5,3], ritualId:"eye-revival", score:20 },
  { id:"steady", label:"Present", sublabel:"Here. Almost settled.", icon:Waves, color:"#8BAA8B", recommended:[1,5], ritualId:"gua-sha", score:60 },
  { id:"composed", label:"Clear", sublabel:"Arrived.", icon:Heart, color:"#5A8A5A", recommended:[1], ritualId:"gua-sha", score:85 },
];

// ── Ritual Guide Data ──
const rituals = [
  {
    id: "gua-sha", title: "The Sculptor", subtitle: "Define what stress has softened",
    duration: "8 min", isPremium: false, svgFile: "/svgs/gua-sha-zones.svg",
    description: "Your jawline is where you've been clenching. Your cheekbones are where stress accumulates. This moves everything held there — defines, lifts, and releases in one arc.",
    tools: "Gua sha stone or clean fingers · facial oil",
    occasion: "morning", audioFollowUp: 1,
    steps: [
      { title: "Ground yourself first", duration: 30, instruction: "Oil your hands. Warm the stone between your palms until it disappears into heat. One slow breath before you touch your face.", zone: "full" },
      { title: "Open the path", duration: 45, instruction: "Start behind the ear — where your jaw tension drains. Long, slow strokes down each side of your neck. You're making space for what's about to release.", zone: "neck", direction: "↓ Ear to collarbone" },
      { title: "Find your jaw", duration: 60, instruction: "Start at the center of your chin. Feel the line of your jaw — that ridge where you've been holding everything. Sweep firmly outward toward the ear. Five times each side.", zone: "jawline", direction: "→ Outward from chin" },
      { title: "Lift the cheek", duration: 60, instruction: "From the corner of your mouth, sweep upward across your cheekbone toward the temple. Slow, deliberate pressure. You're asking the muscle to let go.", zone: "cheeks", direction: "↗ Up and outward" },
      { title: "The lightest touch", duration: 45, instruction: "Under your eye — lightest touch you own. From inner corner outward along the bone. This area holds what you haven't said yet. Gentle.", zone: "undereye", direction: "→ Inner to outer" },
      { title: "Between your brows", duration: 45, instruction: "Between your brows is where concentration lives. Sweep outward toward the temple. Feel the muscle soften as you go.", zone: "brow", direction: "→ Brow to temple" },
      { title: "Sweep upward", duration: 60, instruction: "Brows to hairline. Center, then sides. Your forehead holds more than you think. Sweep it up.", zone: "forehead", direction: "↑ Up to hairline" },
      { title: "Let it drain", duration: 30, instruction: "Back to the neck. Three long strokes from behind each ear down to the collarbone. You've done the work. Let it go.", zone: "neck", direction: "↓ Final release" },
    ]
  },
  {
    id: "lymphatic", title: "The Revival", subtitle: "Restore what fatigue has taken",
    duration: "6 min", isPremium: true, svgFile: "/svgs/lymphatic-paths.svg",
    description: "When your face reads tired before you feel it — swollen, dull, drawn — this is the reason. Fluid has pooled where it should move. The Revival moves it.",
    tools: "Clean fingertips only — no tools",
    occasion: "morning", audioFollowUp: 5,
    steps: [
      { title: "Start here", duration: 30, instruction: "Find the groove behind each ear where your skull meets your neck. Press gently and pulse. Ten times. This is where everything begins.", zone: "nodes" },
      { title: "Open the path", duration: 45, instruction: "Flat fingers down each side of the neck. Light — you're not working muscle, you're asking fluid to move. Ear to collarbone. Twice.", zone: "neck", direction: "↓ Ear to collarbone" },
      { title: "The forehead", duration: 40, instruction: "All fingers across your forehead. Sweep outward toward the temples, then down in front of the ears. You're draining what accumulated while you were thinking.", zone: "forehead", direction: "→ then ↓" },
      { title: "Around the eye", duration: 45, instruction: "Ring fingers only. Under the eye from inner corner outward, up and over the brow, back to start. A full slow circle. This is where fatigue shows first.", zone: "orbital", direction: "○ Full orbital" },
      { title: "Across the cheek", duration: 45, instruction: "Beside the nose, sweep outward toward the ears. The skin here remembers every hard day. Move it gently.", zone: "cheeks", direction: "→ Nose to ears" },
      { title: "Along the jaw", duration: 40, instruction: "Trace your jaw from chin to ear. Gentle. This chain carries everything the jaw has been holding.", zone: "jawline", direction: "→ Chin to ear" },
      { title: "End at the collar", duration: 45, instruction: "Return to the neck. Down from ear to collarbone. End at the collarbone — press and hold for ten counts. Everything goes here. Let it.", zone: "neck", direction: "↓ Final flush" },
    ]
  },
  {
    id: "face-lift", title: "The Lift", subtitle: "Reclaim what gravity has borrowed",
    duration: "7 min", isPremium: true, svgFile: "/svgs/face-lifting-points.svg",
    description: "Gravity and tension pull down over time. Not through surgery — through muscle fatigue. The Lift works the pressure points that counteract the downward pull. You'll feel it immediately.",
    tools: "Clean fingertips · facial oil",
    occasion: "evening", audioFollowUp: 3,
    steps: [
      { title: "The temples", duration: 35, instruction: "Fingertips on your temples. Firm, slow circles for ten rotations. The temporal fascia holds everything above it. Release it first.", zone: "temples" },
      { title: "The brow bone", duration: 45, instruction: "Find the bony ridge above your eye. Three pressure points: inner, middle, outer. Hold each five seconds. Then sweep the whole thing upward.", zone: "brow", direction: "↑ Press, then lift" },
      { title: "The cheekbone", duration: 50, instruction: "Hook your fingertips under the cheekbone. Lift upward while you open your mouth slightly. Hold five seconds. Release. Do it five times each side. Feel it.", zone: "cheeks", direction: "↑ Hook and lift" },
      { title: "The nasolabial fold", duration: 45, instruction: "Beside each nostril. Sweep firmly outward and upward toward the cheekbone. You're redirecting the pull of the face upward.", zone: "nasolabial", direction: "↗ Out and up" },
      { title: "The jawline", duration: 50, instruction: "Make a fist. Knuckles along the jaw from chin to ear — firm, slow, upward pressure. This lifts the whole lower face.", zone: "jawline", direction: "→↑ Knuckle sweep" },
      { title: "The corners", duration: 40, instruction: "Fingers at the corners of your mouth. Press and sweep upward toward the cheekbone. This is what the marionette lines are asking for.", zone: "marionette", direction: "↑ Corner to cheek" },
      { title: "The neck", duration: 50, instruction: "Both hands flat on your chest. Sweep upward along the front of the neck to the chin. The platysma — the muscle that pulls the jaw down — releases here.", zone: "neck", direction: "↑ Chest to chin" },
      { title: "Hold it", duration: 30, instruction: "Cup your entire face in your palms. Light lifting pressure. Hold ten seconds. Release slowly. Notice the difference.", zone: "full" },
    ]
  },
  {
    id: "buccal", title: "The Release", subtitle: "Reach what no surface massage can",
    duration: "5 min", isPremium: true, svgFile: "/svgs/face-base.svg",
    description: "The jaw holds more than you know. The Release targets the deep muscles no gua sha stone reaches — the masseter, the buccinator, the TMJ. This is where years of holding live.",
    tools: "Clean hands · facial oil",
    occasion: "recovery", audioFollowUp: 4,
    steps: [
      { title: "The jaw hinge", duration: 45, instruction: "Press your fingertips into the hinge of your jaw — where it opens and closes. Apply firm, slow circles inward and upward. You're reaching the muscle that's been clenching since before you noticed.", zone: "jawline", direction: "○ Inward and up" },
      { title: "The cheek", duration: 50, instruction: "Move to your cheeks. Press firmly against the bone. Hold three seconds, then drag slowly upward toward the cheekbone. Feel what releases under your fingers.", zone: "cheeks", direction: "↑ Hold, then lift" },
      { title: "The deep hold", duration: 45, instruction: "Knuckle pressure into the fleshy center of each cheek — between cheekbone and jaw. Hold five seconds, release, move along the line. There will be more tension here than you expected.", zone: "cheeks", direction: "— Hold and release" },
      { title: "Jaw Decompression", duration: 60, instruction: "Interlock fingers under your chin. Apply gentle upward traction while slowly tilting your head back slightly. Hold 5 seconds. This decompresses the jaw joint — you may hear a subtle release.", zone: "jawline", direction: "↑ Gentle traction" },
      { title: "TMJ Integration", duration: 40, instruction: "Return to the jaw hinge. Alternate between pressing and releasing rhythmically, allowing the joint to settle. Finish with three slow, wide jaw openings. Exhale on each open.", zone: "jawline", direction: "○ Press, breathe, release" },
      { title: "Final Drain", duration: 40, instruction: "Long, slow strokes from behind the ears down the neck to the collarbone. Three passes each side. This drains everything the jaw just released into the lymphatic system.", zone: "neck", direction: "↓ Behind ear to collar" },
    ]
  },
  {
    id: "pre-event", title: "Before", subtitle: "Show up at your best",
    duration: "5 min", isPremium: true, svgFile: "/svgs/face-base.svg",
    description: "Before a presentation, shoot, dinner — anything that requires you at full capacity. Five minutes. The result is immediate and visible.",
    tools: "Gua sha stone or clean fingertips · facial oil",
    occasion: "event", audioFollowUp: 2,
    steps: [
      { title: "Open the drain", duration: 30, instruction: "Five quick taps behind each ear, then sweep down both sides of the neck. Opens the lymphatic path before anything else moves. Do this first. Always.", zone: "nodes", direction: "↓ Neck first" },
      { title: "The eyes", duration: 45, instruction: "Ring fingers or a cold tool. Under each eye, sweep from inner corner outward. Lightest touch. Three passes. You'll see the difference before you're done.", zone: "undereye", direction: "→ Inner to outer" },
      { title: "The cheekbone", duration: 45, instruction: "Hook under the cheekbone. Sweep upward and outward in one fluid motion. Five passes each side, increasing firmness. Visible lift within seconds.", zone: "cheeks", direction: "↗ Hook and lift" },
      { title: "The jaw", duration: 45, instruction: "From center of chin, sweep firmly along the jawline to the ear. Five passes each side. This is the most visible single move. Don't skip it.", zone: "jawline", direction: "→ Chin to ear" },
      { title: "The forehead", duration: 30, instruction: "Three sweeping passes from brow to hairline. Lifts the brow. Smooths what's been furrowed. Use the flat of the tool or all four fingers together.", zone: "forehead", direction: "↑ Brow to hairline" },
      { title: "You're ready", duration: 30, instruction: "One complete pass: neck down, jaw out, cheek up, forehead up. Light, fast, fluid. This seals it.", zone: "full", direction: "The seal" },
    ]
  },
  {
    id: "eye-revival", title: "The Eye", subtitle: "Return light to where it's been lost",
    duration: "5 min", isPremium: true, svgFile: "/svgs/face-base.svg",
    description: "The eye area is where fatigue reads before you feel it — dark, puffy, heavy. The Eye drains what's pooled there and releases the tension that makes the lid drop and the brow furrow.",
    tools: "Ring fingers · eye cream or serum",
    occasion: "morning", audioFollowUp: 5,
    steps: [
      { title: "The full orbit", duration: 40, instruction: "Trace the full orbital bone — inner corner, under the eye, outer corner, over the brow, back to start. Three full slow circles. Light as you've ever touched anything.", zone: "undereye", direction: "○ Full orbital circle" },
      { title: "The tear duct", duration: 35, instruction: "Press your ring finger into the inner corner of each eye. Hold five seconds. Breathe. Release. This is where dark circles drain from. Press it.", zone: "undereye", direction: "● Hold 5 seconds" },
      { title: "The outer corner", duration: 45, instruction: "Ring fingers at the outer corner of each eye. Tiny, gentle circles. Lightest possible pressure. The orbicularis oculi muscle holds more tension here than you know.", zone: "undereye", direction: "○ Tiny circles" },
      { title: "The upper lid", duration: 40, instruction: "Eyes closed. Ring fingers on your upper lids. Sweep from inner corner to outer — featherlight, three slow passes. You're moving what's been pooling here while you slept.", zone: "undereye", direction: "→ Inner to outer lid" },
      { title: "The brow bone", duration: 35, instruction: "Three pressure points along the brow bone: inner, middle, outer edge. Press firmly, five seconds each. This releases the corrugator — the muscle that pulls the brow down and makes the eye look heavy.", zone: "brow", direction: "● Three points" },
      { title: "The drain", duration: 45, instruction: "From the bridge of the nose, sweep under each eye to the temple, then down in front of the ear to the jaw. The complete orbital drainage path. End here and feel what's shifted.", zone: "undereye", direction: "→ ↓ Full drain" },
    ]
  },
];

const fmt = (s) => `${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,"0")}`;
const greetUser = (name) => { const h=new Date().getHours(); const g=h<12?"Good morning":h<17?"Good afternoon":"Good evening"; return name?`${g}, ${name}`:g; };
const greetShort = () => { const h=new Date().getHours(); if(h<10)return"This morning"; if(h<14)return"This midday"; if(h<18)return"This afternoon"; return"This evening"; };
const timeCtx = () => { const h=new Date().getHours(); if(h<6)return"night"; if(h<10)return"morning"; if(h<14)return"midday"; if(h<18)return"afternoon"; if(h<21)return"evening"; return"night"; };
// Recommend a ritual + audio arc based on state and time
const getArc = (checkinState, tc) => {
  if(checkinState) {
    const r = rituals.find(x=>x.id===checkinState.ritualId) || rituals[0];
    const a = sessions.find(x=>x.id===(r.audioFollowUp||1)) || sessions[0];
    return { ritual:r, audio:a };
  }
  if(tc==="morning") return { ritual:rituals[0], audio:sessions[0] };
  if(tc==="evening") return { ritual:rituals[2], audio:sessions[2] };
  return { ritual:rituals[0], audio:sessions[4] };
};
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
      <h2 style={{fontSize:22,color:B.cream,fontWeight:400,margin:"0 0 6px",fontFamily:F}}>You showed up.</h2>
      <p style={{fontSize:13,color:B.muted,fontStyle:"italic",margin:"0 0 8px",fontFamily:F}}>Your face, your nervous system — both listened.</p>
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
            <FaceGuideIllustration
              zone={ritual.id==="gua-sha"?"jawline":ritual.id==="lymphatic"?"nodes":"cheeks"}
              size={160}
            />
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
          <button onClick={()=>setStep(0)} style={{width:"100%",background:B.goldGrad,border:"none",borderRadius:28,padding:"16px",cursor:"pointer",color:B.warmBlack,fontSize:14,fontFamily:SF,letterSpacing:1,fontWeight:600,boxShadow:`0 6px 28px ${B.gold}30`}}>Begin</button>
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
          <h2 style={{fontSize:24,color:B.cream,fontWeight:400,margin:"0 0 8px",fontFamily:F}}>You showed up.</h2>
          <p style={{fontSize:14,color:B.muted,fontStyle:"italic",margin:"0 0 6px",fontFamily:F}}>{ritual.title} — {ritual.duration}</p>
          <p style={{fontSize:12,color:B.gold,fontFamily:SF,margin:"0 0 36px"}}>Your face held this. Now it's released.</p>
          <button onClick={onClose} style={{background:B.goldGrad,border:"none",borderRadius:28,padding:"14px 40px",cursor:"pointer",color:B.warmBlack,fontSize:14,fontFamily:SF,letterSpacing:1,fontWeight:500}}>Continue</button>
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

        {/* Face illustration + timer */}
        <div style={{position:"relative",width:"100%",display:"flex",justifyContent:"center",alignItems:"center",marginBottom:16}}>
          {/* Timer ring top-right of illustration */}
          <div style={{position:"relative",display:"flex",alignItems:"center",justifyContent:"center"}}>
            <FaceGuideIllustration zone={currentStep.zone||"full"} size={170}/>
            {/* Floating timer pill */}
            <div style={{position:"absolute",bottom:8,right:-8,background:B.card,border:`1px solid ${B.borderActive}`,borderRadius:20,padding:"5px 12px",display:"flex",alignItems:"center",gap:6,boxShadow:`0 4px 16px ${B.warmBlack}60`}}>
              <div style={{position:"relative",width:28,height:28,display:"flex",alignItems:"center",justifyContent:"center"}}>
                <Ring progress={pct} size={28} sw={2.5}/>
                <span style={{fontSize:9,color:B.cream,fontWeight:500,zIndex:2,fontFamily:SF}}>{timeLeft}</span>
              </div>
              <span style={{fontSize:9,color:B.muted,letterSpacing:1.5,textTransform:"uppercase",fontFamily:SF}}>sec</span>
            </div>
          </div>
        </div>

        {/* Instruction */}
        <h3 style={{fontSize:20,color:B.cream,fontWeight:400,fontFamily:F,marginBottom:8,textAlign:"center"}}>{currentStep.title}</h3>
        {currentStep.direction && <p style={{fontSize:11,color:B.gold,fontFamily:SF,margin:"0 0 12px",background:`${B.gold}12`,padding:"4px 12px",borderRadius:20,letterSpacing:1}}>{currentStep.direction}</p>}
        <p style={{fontSize:13,color:B.creamMuted,fontFamily:SF,lineHeight:1.6,textAlign:"center",maxWidth:320,margin:"0 0 28px"}}>{currentStep.instruction}</p>

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
            <p style={{fontSize:20,color:B.cream,fontWeight:400,fontFamily:F,margin:"0 0 12px",lineHeight:1.4}}>Your face is where<br/>your nervous system shows.</p>
            <p style={{fontSize:13,color:B.muted,fontStyle:"italic",lineHeight:1.55}}>The tension in your jaw. The weight under your eyes. The furrow that won't release. RHEI works there — precisely.</p>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:32}}>
            {["6 guided face rituals","Audio resets that follow each ritual","Quick interventions for any moment","Your face as the diagnostic surface"].map((f,i)=>(
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
  const [showMirrorMode,setShowMirrorMode]=useState(false);
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

  const handleMirrorTransitionToReset=(sessionId)=>{
    setShowMirrorMode(false);
    startSession(sessionId);
    setScreen("player");
  };
  const completeMicro=(msg,scoreBoost)=>{setMicroDone(true);setMicroMsg(msg);setNsScore(s=>Math.min(100,s+scoreBoost));setScoreHistory(h=>[...h.slice(-6),Math.min(100,nsScore+scoreBoost)]);};

  const cur=activeSession?sessions.find(s=>s.id===activeSession):null;
  const suggested=getSuggested();
  const effDur=audioDuration||(cur?.duration||0);
  const progress=effDur>0?(elapsed/effDur)*100:0;
  const remaining=Math.max(0,effDur-elapsed);

  const container={width:"100%",maxWidth:430,margin:"0 auto",minHeight:"100vh",background:B.darkGrad,color:B.cream,fontFamily:F,position:"relative",overflow:"hidden"};

  const navBtn=(id,Icon,label)=>{
    const a=screen===id||(id==="rituals"&&(screen==="player"||screen==="library"));
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

  // ══════════ TODAY ══════════
  const renderHome=()=>{
    const tc = timeCtx();
    const arc = getArc(checkinDone?checkinState:null, tc);
    const isFirstTime = totalSessions === 0;
    const ritualLocked = arc.ritual.isPremium && !isPremium;

    return (
    <div style={{padding:"52px 22px 120px"}}>

      {/* Header */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:32}}>
        <div>
          <h1 style={{fontSize:18,letterSpacing:10,color:B.gold,fontWeight:400,margin:0,fontFamily:F}}>RHEI</h1>
          <p style={{fontSize:13,color:B.muted,margin:"4px 0 0",fontStyle:"italic",fontFamily:F}}>Your face is where it shows.</p>
        </div>
        <button onClick={()=>setScreen("premium")} style={{background:"none",border:`1px solid ${B.border}`,borderRadius:20,padding:"6px 12px",cursor:"pointer",display:"flex",alignItems:"center",gap:5}}>
          <Crown size={12} color={isPremium?B.gold:B.muted}/>
          <span style={{fontSize:10,color:isPremium?B.gold:B.muted,fontFamily:SF,letterSpacing:0.5}}>{isPremium?"Premium":"Unlock"}</span>
        </button>
      </div>

      {/* Install prompt */}
      {showInstallPrompt&&!isStandalone&&(
        <div style={{width:"100%",background:`${B.gold}08`,border:`1px solid ${B.borderActive}`,borderRadius:14,padding:"12px 16px",marginBottom:16,display:"flex",alignItems:"center",gap:12,position:"relative"}}>
          <button onClick={dismissInstall} style={{position:"absolute",top:8,right:8,background:"none",border:"none",cursor:"pointer",padding:4}}><X size={12} color={B.muted}/></button>
          <button onClick={installApp} style={{flex:1,background:"none",border:"none",cursor:"pointer",textAlign:"left",padding:0}}>
            <p style={{fontSize:12,color:B.cream,margin:0,fontFamily:SF}}>Add to your home screen</p>
            <p style={{fontSize:10,color:B.muted,margin:"2px 0 0",fontFamily:SF}}>Open RHEI like an app</p>
          </button>
          <ArrowRight size={13} color={B.gold} style={{flexShrink:0}}/>
        </div>
      )}

      {/* First ritual banner */}
      {isFirstTime&&(
        <div style={{background:`linear-gradient(135deg, ${B.card} 0%, #2A1A0C 100%)`,border:`1px solid ${B.borderActive}`,borderRadius:20,padding:"22px 20px",marginBottom:20,position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",top:-20,right:-20,width:120,height:120}}><Orb active={false} size={120}/></div>
          <div style={{position:"relative",zIndex:2}}>
            <p style={{fontSize:9,letterSpacing:3,color:B.gold,textTransform:"uppercase",fontFamily:SF,margin:"0 0 8px"}}>Start here</p>
            <h2 style={{fontSize:20,color:B.cream,fontWeight:400,margin:"0 0 6px",fontFamily:F}}>Your First Ritual</h2>
            <p style={{fontSize:12,color:B.muted,margin:"0 0 16px",fontFamily:SF,lineHeight:1.55}}>Before you explore anything else — do this. The Sculptor followed by Morning. You'll feel the difference before you finish.</p>
            <button onClick={()=>{setActiveRitual(rituals[0]);}} style={{background:B.goldGrad,border:"none",borderRadius:22,padding:"11px 24px",cursor:"pointer",color:B.warmBlack,fontSize:12,fontFamily:SF,letterSpacing:1,fontWeight:600}}>Begin</button>
          </div>
        </div>
      )}

      {/* Face check-in */}
      {!checkinDone?(
        <button onClick={()=>setShowCheckin(true)} style={{width:"100%",background:B.card,border:`1px solid ${B.border}`,borderRadius:18,padding:"16px 18px",cursor:"pointer",textAlign:"left",marginBottom:20,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div>
            <p style={{fontSize:9,letterSpacing:2,color:B.gold,textTransform:"uppercase",fontFamily:SF,margin:"0 0 4px"}}>Before you begin</p>
            <p style={{fontSize:14,color:B.cream,margin:0,fontFamily:F}}>How is your face today?</p>
          </div>
          <div style={{width:36,height:36,borderRadius:"50%",background:`${B.gold}12`,display:"flex",alignItems:"center",justifyContent:"center"}}>
            <ArrowRight size={14} color={B.gold}/>
          </div>
        </button>
      ):(
        <div style={{background:B.card,border:`1px solid ${B.border}`,borderRadius:18,padding:"14px 18px",marginBottom:20,display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:8,height:8,borderRadius:"50%",background:checkinState?.color||B.gold,flexShrink:0}}/>
          <div style={{flex:1}}>
            <p style={{fontSize:13,color:B.cream,margin:0,fontFamily:SF}}>{checkinState?.label}</p>
            <p style={{fontSize:11,color:B.muted,margin:"2px 0 0",fontFamily:SF}}>{checkinState?.sublabel}</p>
          </div>
          <button onClick={()=>{setCheckinDone(false);setCheckinState(null);setShowCheckin(true);}} style={{background:"none",border:`1px solid ${B.border}`,borderRadius:10,padding:"4px 10px",cursor:"pointer",color:B.muted,fontSize:10,fontFamily:SF}}>Change</button>
        </div>
      )}

      {/* Today's arc — face ritual + audio */}
      <div style={{marginBottom:24}}>
        <p style={{fontSize:9,letterSpacing:3,color:B.muted,textTransform:"uppercase",marginBottom:12,fontFamily:SF}}>
          {checkinDone?"Your ritual today":greetShort()}
        </p>

        {/* Face ritual card */}
        <button onClick={()=>{if(ritualLocked){setScreen("premium");}else{setActiveRitual(arc.ritual);}}}
          style={{width:"100%",background:B.card,border:`1px solid ${B.borderActive}`,borderRadius:20,padding:"22px 20px",cursor:"pointer",textAlign:"left",marginBottom:8,position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",top:-30,right:-30,width:160,height:160}}><Orb active={false} size={160}/></div>
          {ritualLocked&&<div style={{position:"absolute",top:14,right:14,display:"flex",alignItems:"center",gap:4,background:`${B.gold}12`,padding:"3px 8px",borderRadius:7}}><Lock size={9} color={B.gold}/><span style={{fontSize:8,color:B.gold,fontFamily:SF,letterSpacing:1}}>PREMIUM</span></div>}
          <div style={{position:"relative",zIndex:2}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
              <FaceGuideIllustration zone={arc.ritual.id==="gua-sha"?"jawline":arc.ritual.id==="lymphatic"?"nodes":arc.ritual.id==="face-lift"?"cheeks":arc.ritual.id==="buccal"?"jawline":arc.ritual.id==="pre-event"?"full":"undereye"} size={36}/>
              <div>
                <p style={{fontSize:9,letterSpacing:2,color:B.gold,textTransform:"uppercase",fontFamily:SF,margin:0}}>Face first</p>
                <h2 style={{fontSize:20,color:B.cream,margin:0,fontWeight:400,fontFamily:F}}>{arc.ritual.title}</h2>
              </div>
            </div>
            <p style={{fontSize:12,color:B.muted,margin:"0 0 14px",fontStyle:"italic",fontFamily:F}}>{arc.ritual.subtitle}</p>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <div style={{background:B.goldGrad,borderRadius:20,padding:"8px 20px",display:"flex",alignItems:"center",gap:6,boxShadow:`0 4px 16px ${B.gold}22`}}>
                <span style={{fontSize:12,color:B.warmBlack,fontFamily:SF,fontWeight:600}}>Begin</span>
              </div>
              <span style={{fontSize:11,color:B.muted,fontFamily:SF}}>{arc.ritual.duration}</span>
            </div>
          </div>
        </button>

        {/* Audio reset — second movement */}
        <button onClick={()=>{const locked=arc.audio.id!==1&&!isPremium;if(locked){setScreen("premium");}else{startSession(arc.audio.id);}}}
          style={{width:"100%",background:`${B.card}88`,border:`1px solid ${B.border}`,borderRadius:16,padding:"14px 18px",cursor:"pointer",textAlign:"left",display:"flex",alignItems:"center",gap:14}}>
          <div style={{width:36,height:36,borderRadius:"50%",background:`${B.gold}10`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
            <Play size={13} color={B.gold} fill={B.gold}/>
          </div>
          <div style={{flex:1}}>
            <p style={{fontSize:9,letterSpacing:1.5,color:B.muted,textTransform:"uppercase",fontFamily:SF,margin:"0 0 2px"}}>Then · Audio reset</p>
            <p style={{fontSize:14,color:B.cream,margin:0,fontFamily:F}}>{arc.audio.title}</p>
            <p style={{fontSize:11,color:B.muted,margin:"1px 0 0",fontFamily:SF}}>{arc.audio.subtitle}</p>
          </div>
          <span style={{fontSize:10,color:B.muted,fontFamily:SF}}>{Math.ceil(arc.audio.duration/60)}m</span>
        </button>
      </div>

      {/* When you only have a moment */}
      <div style={{marginBottom:8}}>
        <p style={{fontSize:9,letterSpacing:3,color:B.muted,textTransform:"uppercase",marginBottom:12,fontFamily:SF}}>When you only have a moment</p>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          {[
            {id:"sigh",title:"The Sigh",badge:"60 sec",desc:"Fastest nervous system reset that exists."},
            {id:"jaw",title:"The Jaw",badge:"40 sec",desc:"Release where you've been holding everything."},
            {id:"ground",title:"Ground",badge:"90 sec",desc:"Anchor to the present through your senses."},
            {id:"tap",title:"Tap",badge:"30 sec",desc:"Bilateral reset. Calms the reactive mind."},
          ].map(mi=>(
            <button key={mi.id} onClick={()=>openMicro(mi.id)} style={{background:B.card,border:`1px solid ${B.border}`,borderRadius:14,padding:"14px 12px",cursor:"pointer",textAlign:"left"}}>
              <p style={{fontSize:9,color:B.gold,fontFamily:SF,background:`${B.gold}10`,padding:"2px 8px",borderRadius:6,display:"inline-block",marginBottom:8,letterSpacing:0.5}}>{mi.badge}</p>
              <p style={{fontSize:13,color:B.cream,margin:"0 0 3px",fontFamily:F,fontWeight:400}}>{mi.title}</p>
              <p style={{fontSize:11,color:B.muted,margin:0,fontFamily:SF,lineHeight:1.35}}>{mi.desc}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );};

  // ══════════ LIBRARY (hidden — absorbed into Rituals) ══════════
  const renderLibrary=()=>renderRituals();

  // ══════════ PLAYER ══════════
  const renderPlayer=()=>{
    if(!cur)return null;
    return(
      <div style={{padding:"36px 22px 120px",minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center"}}>
        <button onClick={exitPlayer} style={{position:"absolute",top:18,left:18,background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:4,color:B.muted,fontFamily:SF,fontSize:12}}><ChevronLeft size={16}/><span>Back</span></button>
        <div style={{textAlign:"center",marginTop:36,marginBottom:36}}>
          <p style={{fontSize:9,letterSpacing:3,color:B.gold,textTransform:"uppercase",fontFamily:SF,marginBottom:8}}>Audio reset</p>
          <h1 style={{fontSize:26,fontWeight:400,color:B.cream,margin:"0 0 4px",fontFamily:F}}>{cur.title}</h1>
          <p style={{fontSize:13,color:B.muted,fontStyle:"italic",fontFamily:F}}>{cur.subtitle}</p>
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
              <h2 style={{fontSize:22,color:B.cream,fontWeight:400,margin:"0 0 6px",fontFamily:F}}>You showed up.</h2>
              <p style={{fontSize:13,color:B.muted,fontStyle:"italic",margin:"0 0 8px",fontFamily:F}}>{cur.title}{userName?` · ${userName}`:""}</p>
              <p style={{fontSize:12,color:B.gold,fontFamily:SF,margin:"0 0 28px"}}>{Math.ceil(cur.duration/60)} minutes for your nervous system</p>
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
      <div style={{textAlign:"center",marginBottom:28}}>
        <p style={{fontSize:9,letterSpacing:3,color:B.muted,textTransform:"uppercase",fontFamily:SF,marginBottom:6}}>All Rituals</p>
        <h1 style={{fontSize:22,fontWeight:400,color:B.cream,margin:0,fontFamily:F}}>Face first.</h1>
        <p style={{fontSize:13,color:B.muted,marginTop:6,fontStyle:"italic",fontFamily:F}}>Then the audio reset follows. One arc.</p>
      </div>

      {/* ── Smart Scan Hero Card ── */}
      <button
        onClick={()=>setShowMirrorMode(true)}
        style={{width:"100%",background:`linear-gradient(135deg, ${B.card} 0%, #2A1A0C 100%)`,border:`1px solid ${B.borderActive}`,borderRadius:22,padding:"24px 22px",cursor:"pointer",textAlign:"left",marginBottom:20,position:"relative",overflow:"hidden"}}>
        {/* Subtle orb bg */}
        <div style={{position:"absolute",top:-30,right:-30,width:160,height:160,borderRadius:"50%",background:`radial-gradient(circle, ${B.gold}08 0%, transparent 70%)`}}/>
        <div style={{position:"relative",zIndex:2}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
            <div style={{width:38,height:38,borderRadius:"50%",background:`${B.gold}12`,border:`1px solid ${B.gold}25`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              <Camera size={16} color={B.gold}/>
            </div>
            <div>
              <p style={{fontSize:9,letterSpacing:2,color:B.gold,textTransform:"uppercase",fontFamily:SF,margin:0}}>New · Smart Face Scan</p>
              <h3 style={{fontSize:16,color:B.cream,margin:0,fontWeight:400,fontFamily:F}}>Mirror Mode</h3>
            </div>
          </div>
          <p style={{fontSize:12,color:B.creamMuted,margin:"0 0 14px",fontFamily:SF,lineHeight:1.55}}>RHEI reads your face, maps where you're holding tension today, and guides your ritual live — on your actual face.</p>
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            <span style={{fontSize:11,color:B.gold,fontFamily:SF,fontWeight:500}}>Begin Smart Scan</span>
            <ArrowRight size={12} color={B.gold}/>
          </div>
        </div>
      </button>

      {/* ── Occasion tags ── */}
      <div style={{display:"flex",gap:8,marginBottom:20,overflowX:"auto",paddingBottom:4}}>
        {[{label:"All",tag:null},{label:"Morning",tag:"morning"},{label:"Pre-Event",tag:"event"},{label:"Recovery",tag:"recovery"},{label:"Deep Work",tag:"deep"}].map((t,i)=>(
          <div key={i} style={{flexShrink:0,background:i===0?B.card:"transparent",border:`1px solid ${i===0?B.borderActive:B.border}`,borderRadius:20,padding:"6px 14px",cursor:"pointer",fontSize:11,color:i===0?B.gold:B.muted,fontFamily:SF,letterSpacing:0.5,whiteSpace:"nowrap"}}>{t.label}</div>
        ))}
      </div>

      {/* ── Ritual cards ── */}
      {rituals.map((r,idx)=>{
        const locked = r.isPremium && !isPremium;
        const zoneMap = {"gua-sha":"jawline","lymphatic":"nodes","face-lift":"cheeks","buccal":"jawline","pre-event":"full","eye-revival":"undereye"};
        const tagMap  = {"gua-sha":"Sculpting","lymphatic":"Drainage","face-lift":"Lifting","buccal":"Deep release","pre-event":"Pre-event","eye-revival":"Eye"};
        const timeMap = {"gua-sha":"Any time","lymphatic":"Morning","face-lift":"Evening","buccal":"Recovery","pre-event":"Before anything that matters","eye-revival":"Morning"};
        return (
          <button key={r.id} onClick={()=>{if(locked){setScreen("premium");}else{setActiveRitual(r);}}}
            style={{width:"100%",background:B.card,border:`1px solid ${locked?B.border:B.borderActive}`,borderRadius:20,padding:"18px 16px",marginBottom:12,cursor:"pointer",textAlign:"left",position:"relative",overflow:"hidden",opacity:locked?0.72:1}}>
            {locked && <div style={{position:"absolute",top:13,right:13,display:"flex",alignItems:"center",gap:4,background:`${B.gold}12`,padding:"3px 8px",borderRadius:7}}>
              <Lock size={9} color={B.gold}/><span style={{fontSize:8,letterSpacing:1.5,color:B.gold,fontFamily:SF,textTransform:"uppercase"}}>Premium</span>
            </div>}
            {!locked&&!r.isPremium&&<div style={{position:"absolute",top:13,right:13,fontSize:8,letterSpacing:1.5,color:"#5A8A5A",background:"#5A8A5A15",padding:"3px 8px",borderRadius:7,fontFamily:SF,textTransform:"uppercase"}}>Free</div>}
            <div style={{display:"flex",alignItems:"flex-start",gap:14}}>
              {/* Illustration thumbnail */}
              <div style={{width:60,height:60,borderRadius:14,background:`${B.gold}08`,border:`1px solid ${B.border}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                <FaceGuideIllustration zone={zoneMap[r.id]||"full"} size={46}/>
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:3}}>
                  <h3 style={{fontSize:16,color:B.cream,margin:0,fontWeight:400,fontFamily:F}}>{r.title}</h3>
                </div>
                <p style={{fontSize:12,color:B.goldMuted,margin:"0 0 6px",fontStyle:"italic"}}>{r.subtitle}</p>
                <p style={{fontSize:11,color:B.muted,margin:"0 0 10px",lineHeight:1.5,fontFamily:SF,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{r.description}</p>
                <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                  <span style={{fontSize:9,color:B.gold,fontFamily:SF,background:`${B.gold}10`,padding:"3px 8px",borderRadius:6,letterSpacing:0.5}}>{tagMap[r.id]}</span>
                  <span style={{fontSize:9,color:B.muted,fontFamily:SF,background:"rgba(196,154,75,0.06)",padding:"3px 8px",borderRadius:6,letterSpacing:0.5}}>{timeMap[r.id]}</span>
                  <span style={{fontSize:11,color:B.muted,fontFamily:SF,marginLeft:"auto",display:"flex",alignItems:"center",gap:4}}><Clock size={10}/>{r.duration}</span>
                </div>
              </div>
            </div>
          </button>
        );
      })}

      {/* Teaser */}
      {!isPremium && (
        <div style={{background:`linear-gradient(135deg, ${B.card} 0%, #3A2516 100%)`,borderRadius:18,padding:"24px 20px",marginTop:4,border:`1px solid ${B.borderActive}`,textAlign:"center"}}>
          <Crown size={22} color={B.gold} style={{marginBottom:10}}/>
          <h3 style={{fontSize:16,color:B.cream,fontWeight:400,margin:"0 0 6px",fontFamily:F}}>The complete practice.</h3>
          <p style={{fontSize:12,color:B.muted,margin:"0 0 16px",fontFamily:SF,lineHeight:1.55}}>The Sculptor · The Revival · The Lift · The Release · Before · The Eye — every ritual, every audio reset, everything added in future.</p>
          <button onClick={()=>setScreen("premium")} style={{background:B.goldGrad,border:"none",borderRadius:24,padding:"12px 28px",cursor:"pointer",color:B.warmBlack,fontSize:12,fontFamily:SF,letterSpacing:1,fontWeight:600}}>Unlock All Rituals</button>
        </div>
      )}
    </div>
  );

  // ══════════ PREMIUM (replaces shop) ══════════
  const renderPremium=()=>(
    <div style={{padding:"56px 22px 120px"}}>
      <div style={{textAlign:"center",marginBottom:36}}>
        <Crown size={28} color={B.gold} style={{marginBottom:12}}/>
        <h1 style={{fontSize:24,fontWeight:400,color:B.cream,margin:"0 0 6px",fontFamily:F}}>The full practice.</h1>
        <p style={{fontSize:13,color:B.muted,fontStyle:"italic",fontFamily:F}}>Every ritual. Every reset. The complete arc.</p>
      </div>

      {/* What you get */}
      <div style={{background:B.card,borderRadius:18,padding:"22px 20px",marginBottom:16,border:`1px solid ${B.border}`}}>
        <p style={{fontSize:10,letterSpacing:2,color:B.gold,textTransform:"uppercase",fontFamily:SF,margin:"0 0 16px"}}>Everything included</p>
        {[
          {text:"Morning (audio reset, free forever)", free:true},
          {text:"Before (audio reset)", free:false},
          {text:"After (audio reset)", free:false},
          {text:"Release (audio reset)", free:false},
          {text:"Return (audio reset)", free:false},
          {text:"4 quick interventions", free:true},
          {text:"The Sculptor (face ritual)", free:true},
          {text:"The Revival", free:false},
          {text:"The Lift", free:false},
          {text:"The Release", free:false},
          {text:"Before", free:false},
          {text:"The Eye", free:false},
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

  // ══════════ JOURNEY ══════════
  const renderProgress=()=>{
    const recentRituals=[...rituals].filter(r=>completedToday.length>0||totalSessions>0);
    return(
      <div style={{padding:"56px 22px 120px"}}>
        <div style={{marginBottom:32}}>
          <p style={{fontSize:9,letterSpacing:3,color:B.muted,textTransform:"uppercase",fontFamily:SF,marginBottom:6}}>Journey</p>
          <h1 style={{fontSize:22,fontWeight:400,color:B.cream,margin:0,fontFamily:F}}>{userName||"Your practice"}</h1>
          <p style={{fontSize:13,color:B.muted,marginTop:4,fontStyle:"italic",fontFamily:F}}>Your face is the record of what you've shown up for.</p>
        </div>

        {/* Tension tracking — face-focused bars */}
        <div style={{background:B.card,borderRadius:18,padding:"20px",marginBottom:14,border:`1px solid ${B.border}`}}>
          <p style={{fontSize:9,letterSpacing:2,color:B.gold,textTransform:"uppercase",fontFamily:SF,margin:"0 0 14px"}}>Tension over time</p>
          <div style={{marginBottom:12}}>
            {[{label:"Jaw",key:"wired"},{label:"Under-eye",key:"foggy"},{label:"Brow",key:"reactive"}].map((z,i)=>(
              <div key={i} style={{marginBottom:i<2?10:0}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                  <span style={{fontSize:11,color:B.creamMuted,fontFamily:SF}}>{z.label}</span>
                  <span style={{fontSize:11,color:totalSessions>0?"#5A8A5A":B.muted,fontFamily:SF}}>{totalSessions>0?"Improving":"Start to track"}</span>
                </div>
                <div style={{width:"100%",height:3,background:`${B.gold}10`,borderRadius:2}}>
                  <div style={{width:totalSessions>0?`${Math.max(20,100-totalSessions*8)}%`:"80%",height:"100%",background:totalSessions>0?"#5A8A5A":"#C4786A",borderRadius:2,opacity:0.7,transition:"width 1s ease"}}/>
                </div>
              </div>
            ))}
          </div>
          <p style={{fontSize:10,color:B.muted,fontFamily:SF,margin:"8px 0 0"}}>Tracked from your check-ins and rituals</p>
        </div>

        {/* What you've done */}
        <div style={{background:B.card,borderRadius:18,padding:"20px",marginBottom:14,border:`1px solid ${B.border}`}}>
          <p style={{fontSize:9,letterSpacing:2,color:B.gold,textTransform:"uppercase",fontFamily:SF,margin:"0 0 14px"}}>What you've done</p>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            {[{v:totalSessions,l:"Rituals completed"},{v:`${totalMinutes}m`,l:"Time invested"},{v:completedToday.length,l:"Today"},{v:streak>0?`${streak}d`:"—",l:"Days in a row"}].map((s,i)=>(
              <div key={i} style={{textAlign:"left"}}>
                <p style={{fontSize:26,color:B.cream,margin:"0 0 2px",fontFamily:SF,fontWeight:300}}>{s.v}</p>
                <p style={{fontSize:10,color:B.muted,margin:0,fontFamily:SF}}>{s.l}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Photo journal placeholder */}
        <div style={{background:B.card,borderRadius:18,padding:"20px",marginBottom:14,border:`1px solid ${B.border}`}}>
          <p style={{fontSize:9,letterSpacing:2,color:B.gold,textTransform:"uppercase",fontFamily:SF,margin:"0 0 8px"}}>Before & after</p>
          <p style={{fontSize:12,color:B.muted,fontFamily:SF,lineHeight:1.55,margin:"0 0 14px"}}>The real measure isn't sessions — it's your face over time. Take a photo after each ritual. The change is visible within a week.</p>
          <div style={{display:"flex",gap:10}}>
            <div style={{flex:1,background:`${B.gold}06`,borderRadius:12,padding:"16px",textAlign:"center",border:`1px dashed ${B.border}`}}>
              <p style={{fontSize:10,color:B.muted,fontFamily:SF,margin:0}}>Before</p>
            </div>
            <div style={{flex:1,background:`${B.gold}06`,borderRadius:12,padding:"16px",textAlign:"center",border:`1px dashed ${B.border}`}}>
              <p style={{fontSize:10,color:B.muted,fontFamily:SF,margin:0}}>After</p>
            </div>
          </div>
          <p style={{fontSize:10,color:`${B.gold}80`,fontFamily:SF,margin:"10px 0 0",textAlign:"center"}}>Coming in next update</p>
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
          <p style={{fontSize:9,letterSpacing:3,color:B.gold,textTransform:"uppercase",fontFamily:SF,marginBottom:10}}>Your face today</p>
          <h2 style={{fontSize:20,color:B.cream,fontWeight:400,margin:"0 0 6px",fontFamily:F}}>How is your face{userName?`, ${userName}`:""}?</h2>
          <p style={{fontSize:12,color:B.muted,fontStyle:"italic",marginBottom:4}}>Your face holds the answer before you do.</p>
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
          {selectedCheckin?`Build my ritual →`:"Choose to continue"}
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
      {showMirrorMode&&<FaceMirrorMode onClose={()=>setShowMirrorMode(false)} onTransitionToReset={handleMirrorTransitionToReset} rituals={rituals} isPremium={isPremium}/>}
      {/* Bottom Nav — 3 tabs */}
      <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:430,background:`${B.bgDeep}F0`,backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)",borderTop:`1px solid ${B.border}`,display:"flex",justifyContent:"space-around",padding:"11px 0 env(safe-area-inset-bottom, 26px)",paddingBottom:"max(env(safe-area-inset-bottom), 26px)",zIndex:50}}>
        {navBtn("home",Home,"Today")}
        {navBtn("rituals",Sparkles,"Rituals")}
        {navBtn("progress",Heart,"Journey")}
      </div>
    </div>
  );
}
