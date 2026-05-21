import { useState, useEffect, useRef, useCallback } from "react";
import { ChevronLeft, Play, Pause, Plus, Trash2, Save, BookOpen, Sparkles, Volume2, VolumeX, Music2, Mic, MicOff, Square, CircleDot, X, ArrowRight, Lock } from "lucide-react";
import { DramaticGodRays, StarburstPlinth, CornerBrackets, PrecisionStamp, Hairline, EditorialPhoto, RheiMark } from "./Atmosphere";

/* ═══════════════════════════════════════════
   RHEI — Affirmations
   Quietly powerful. Spoken by your nervous system, not at it.
   ═══════════════════════════════════════════ */

const B = {
  bg: "#2D1B0E", bgDeep: "#231408", card: "#3A2516", cardHover: "#45301E",
  gold: "#C49A4B", goldLight: "#D4AD6A", goldMuted: "#A07D3A",
  cream: "#F2E8D9", creamMuted: "#C9B99F", muted: "#8A7560",
  white: "#FFFAF3", warmBlack: "#1A0F06",
  border: "rgba(196,154,75,0.12)", borderSoft: "rgba(196,154,75,0.18)", borderActive: "rgba(196,154,75,0.3)",
  goldGrad: "linear-gradient(135deg, #C49A4B 0%, #D4AD6A 50%, #C49A4B 100%)",
};
const F  = "'Fraunces', Georgia, 'Times New Roman', serif";
const SF = "'Inter', system-ui, -apple-system, sans-serif";

// ── Curated starter affirmations — "quietly powerful" voice ──
export const AFFIRMATION_CATEGORIES = [
  {
    id: "self-worth",
    label: "Self-worth",
    sublabel: "For the quiet days when you forget",
    accent: "#C9A472",
    isPremium: true,
    affirmations: [
      "My presence is enough. I do not need to perform.",
      "What I am, before I do anything, is already worthy.",
      "I am allowed to take up space without justifying it.",
      "Other people's approval is not the measure of me.",
      "I trust what I know about myself.",
      "I do not have to earn rest, ease, or pleasure.",
      "My value does not fluctuate with my output.",
      "I belong to my own life first.",
    ],
  },
  {
    id: "calm",
    label: "Calm",
    sublabel: "For when the body is running ahead of you",
    accent: "#8E9BA0",
    isPremium: false,
    affirmations: [
      "My body knows the way back to ease. I do not need to push.",
      "There is nothing I have to solve in this exact minute.",
      "I exhale and the day softens with me.",
      "I am safe to slow down. The work will hold.",
      "The thought is not the truth. I let it pass.",
      "I am not behind. I am here.",
      "My nervous system is wise. It knows when to soften.",
      "I am allowed to do less and still be doing enough.",
    ],
  },
  {
    id: "abundance",
    label: "Abundance",
    sublabel: "For expanding what feels possible",
    accent: "#A6957A",
    isPremium: true,
    affirmations: [
      "There is more than enough. I do not need to grip.",
      "Good things are arranging themselves in my favour.",
      "I receive easily. I do not have to deserve it twice.",
      "Money is allowed to come to me in calm, ordinary ways.",
      "I am not in competition with anyone, including who I used to be.",
      "My desires are not too much. They are the map.",
      "I am building a life that does not require me to be exhausted.",
      "What is mine will find me. I do not have to chase it.",
    ],
  },
  {
    id: "body-acceptance",
    label: "Body acceptance",
    sublabel: "For coming home to yourself",
    accent: "#B68870",
    isPremium: true,
    affirmations: [
      "My body is not a project. It is the place I live.",
      "I am allowed to be at home in this skin, today, as it is.",
      "My face does not have to be still to be loved.",
      "I thank my body for carrying me here.",
      "I am not a before picture. There is no after.",
      "Softness in my body is not weakness. It is intelligence.",
      "I release the version of myself that needed to be smaller.",
      "I treat this body the way I would treat someone I love.",
    ],
  },
  {
    id: "creative-power",
    label: "Creative power",
    sublabel: "For the work only you can make",
    accent: "#889080",
    isPremium: true,
    affirmations: [
      "I have something to make that no one else can make.",
      "I do not have to be ready. I only have to begin.",
      "My taste is a form of knowing.",
      "I am allowed to make things that are only for me.",
      "I trust the first instinct. It is not random.",
      "What I create does not need to be approved to be real.",
      "I am the one who decides what is finished.",
      "My work and my rest are both part of the practice.",
    ],
  },
];

// ── localStorage helpers (mirror parent app pattern) ──
const KEY_CUSTOM = "rhei_custom_affirmations";
const KEY_FAVS = "rhei_favorite_affirmations";

const loadJSON = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
};
const saveJSON = (key, value) => {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
};

// ── customList migration: string[] → { id, text, hasRecording }[]  ──
// Old saved entries were plain strings. New entries are objects so we can
// track whether the user has recorded their own voice for them. This runs
// once on load — any string gets a stable random id and hasRecording=false.
const makeId = () =>
  (typeof crypto !== "undefined" && crypto.randomUUID)
    ? crypto.randomUUID()
    : `aff_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

const migrateCustomList = (raw) => {
  if (!Array.isArray(raw)) return [];
  return raw.map((entry) => {
    if (typeof entry === "string") {
      return { id: makeId(), text: entry, hasRecording: false, createdAt: Date.now() };
    }
    return {
      id: entry.id || makeId(),
      text: entry.text || "",
      hasRecording: !!entry.hasRecording,
      createdAt: entry.createdAt || Date.now(),
    };
  });
};

// ── IndexedDB helpers for storing voice recordings ──
// Audio blobs are too big for localStorage (~5 MB quota). IndexedDB gives us
// roughly 50% of available disk per origin on modern browsers, so a hundred
// 30-second voice clips fit comfortably. Keyed by affirmation id.
const IDB_NAME = "rhei_audio";
const IDB_VERSION = 1;
const IDB_STORE = "custom_recordings";

const openIDB = () => new Promise((resolve, reject) => {
  if (typeof indexedDB === "undefined") return reject(new Error("IndexedDB unavailable"));
  const req = indexedDB.open(IDB_NAME, IDB_VERSION);
  req.onupgradeneeded = () => {
    const db = req.result;
    if (!db.objectStoreNames.contains(IDB_STORE)) {
      db.createObjectStore(IDB_STORE); // key is the affirmation id (string)
    }
  };
  req.onsuccess = () => resolve(req.result);
  req.onerror = () => reject(req.error);
});

const idbPut = async (key, blob) => {
  const db = await openIDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, "readwrite");
    tx.objectStore(IDB_STORE).put(blob, key);
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
};

const idbGet = async (key) => {
  const db = await openIDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, "readonly");
    const req = tx.objectStore(IDB_STORE).get(key);
    req.onsuccess = () => { db.close(); resolve(req.result || null); };
    req.onerror = () => { db.close(); reject(req.error); };
  });
};

const idbDelete = async (key) => {
  const db = await openIDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, "readwrite");
    tx.objectStore(IDB_STORE).delete(key);
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
};

// ── Procedural ambient pad (Web Audio API — no external file needed) ──
// Generates a soft, slowly-drifting drone using three sine layers (root + fifth + octave)
// with subtle LFO detuning and a low-pass filter, so it sits warmly under the voiceover.
function startAmbientPad() {
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return null;
  const ctx = new Ctx();
  // Resume immediately in case the context starts suspended (autoplay policies)
  if (ctx.state === "suspended") { try { ctx.resume(); } catch {} }

  const master = ctx.createGain();
  master.gain.setValueAtTime(0, ctx.currentTime);
  master.gain.linearRampToValueAtTime(0.085, ctx.currentTime + 3); // gentle 3s fade-in
  master.connect(ctx.destination);

  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 560;
  filter.Q.value = 0.6;
  filter.connect(master);

  // Root A2 (110), Fifth E3 (164.81), Octave A3 (220) — open, modal, undemanding
  const freqs = [110, 164.81, 220];
  const layers = freqs.map((f, idx) => {
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = f;
    const oscGain = ctx.createGain();
    oscGain.gain.value = 1 / freqs.length;
    osc.connect(oscGain).connect(filter);

    // Each layer has its own slow LFO modulating detune in cents (subtle drift)
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.04 + idx * 0.018;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 4 + idx * 1.5;
    lfo.connect(lfoGain).connect(osc.detune);

    osc.start();
    lfo.start();
    return { osc, lfo };
  });

  return {
    stop: () => {
      try {
        master.gain.cancelScheduledValues(ctx.currentTime);
        master.gain.setValueAtTime(master.gain.value, ctx.currentTime);
        master.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.4);
      } catch {}
      setTimeout(() => {
        layers.forEach(({ osc, lfo }) => { try { osc.stop(); lfo.stop(); } catch {} });
        try { ctx.close(); } catch {}
      }, 1600);
    },
  };
}

// ── Breathing orb (matches existing app aesthetic) ──
const Orb = ({ active, size = 100, accent = B.gold }) => (
  <div style={{
    width: size, height: size, borderRadius: "50%",
    background: `radial-gradient(circle, ${accent}33 0%, ${accent}08 60%, transparent 100%)`,
    animation: active ? "rhei-pulse 5s ease-in-out infinite" : "none",
    transition: "opacity 0.4s",
  }} />
);

const ORB_CSS = `
  @keyframes rhei-pulse {
    0%, 100% { transform: scale(0.9); opacity: 0.55; }
    50%      { transform: scale(1.08); opacity: 1; }
  }
  @keyframes rhei-breath {
    0%, 100% { transform: translate(-50%, -50%) scale(1) rotate(0deg); opacity: 0.55; }
    50%      { transform: translate(-50%, -50%) scale(1.25) rotate(180deg); opacity: 0.85; }
  }
  @keyframes rhei-breath-2 {
    0%, 100% { transform: translate(-50%, -50%) scale(1.1) rotate(0deg); opacity: 0.35; }
    50%      { transform: translate(-50%, -50%) scale(0.85) rotate(-120deg); opacity: 0.6; }
  }
`;

// ══════════ MAIN COMPONENT ══════════
export default function AffirmationsScreen({ onBack, hasAccess = true, onUpgrade }) {
  const [view, setView] = useState("home"); // home | category | custom | player
  const [activeCategory, setActiveCategory] = useState(null);
  const [activeList, setActiveList] = useState([]);          // affirmations being played
  const [customList, setCustomList] = useState(() => migrateCustomList(loadJSON(KEY_CUSTOM, [])));
  const [draft, setDraft] = useState("");
  const [recordingForId, setRecordingForId] = useState(null); // id of the affirmation currently being recorded
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordingError, setRecordingError] = useState("");
  const mediaRecorderRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);
  const MAX_RECORD_SECONDS = 30;
  const [playerIdx, setPlayerIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(() => {
    try { return localStorage.getItem("rhei_mirror_voice") !== "0"; } catch { return true; }
  });
  const [musicEnabled, setMusicEnabled] = useState(() => {
    try { return localStorage.getItem("rhei_affirmation_music") !== "0"; } catch { return true; }
  });
  const advanceTimerRef = useRef(null);
  const audioRef = useRef(null);
  const padRef = useRef(null);

  // Repeat pause: silent seconds after each affirmation so you can say it back yourself
  const REPEAT_PAUSE_MS = 5000;
  // Minimum dwell time on each affirmation (used when audio fails or doesn't load)
  const MIN_DWELL_MS = 7000;

  // Persist custom list
  useEffect(() => { saveJSON(KEY_CUSTOM, customList); }, [customList]);

  // Persist voice + music toggles
  useEffect(() => {
    try { localStorage.setItem("rhei_mirror_voice", voiceEnabled ? "1" : "0"); } catch {}
  }, [voiceEnabled]);
  useEffect(() => {
    try { localStorage.setItem("rhei_affirmation_music", musicEnabled ? "1" : "0"); } catch {}
  }, [musicEnabled]);

  // Helper: stop whatever's currently being said.
  // IMPORTANT: do NOT set audio.src = "" here — that triggers a synthetic `error`
  // event on the audio element which our error handler would (mis)interpret as a
  // missing file and fall back to browser TTS, causing a second voice to repeat
  // the affirmation Lulu just finished. pause() alone is sufficient.
  const stopVoice = useCallback(() => {
    try { window.speechSynthesis?.cancel(); } catch {}
    if (audioRef.current) {
      try { audioRef.current.pause(); } catch {}
      audioRef.current = null;
    }
    if (advanceTimerRef.current) {
      clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current = null;
    }
  }, []);

  const advanceNext = useCallback(() => {
    setPlayerIdx(i => (i + 1) % Math.max(1, activeList.length));
  }, [activeList.length]);

  // Ambient music: starts when playing + musicEnabled, stops otherwise
  useEffect(() => {
    if (playing && musicEnabled && !padRef.current) {
      padRef.current = startAmbientPad();
    } else if ((!playing || !musicEnabled) && padRef.current) {
      padRef.current.stop();
      padRef.current = null;
    }
  }, [playing, musicEnabled]);

  // Voiceover + auto-advance — audio-driven, with a repeat-pause built in.
  // Three playback paths:
  //   1. Built-in category → Lulu MP3 from /audio/affirmations/{id}-{idx}.mp3
  //   2. Custom + user has a recording → play their recording from IndexedDB
  //   3. Custom + no recording → browser TTS (or silent dwell if voice muted)
  useEffect(() => {
    if (!playing) { stopVoice(); return; }
    if (activeList.length === 0) return;
    const item = activeList[playerIdx];
    const text = (typeof item === "string") ? item : (item?.text || "");

    stopVoice();

    const scheduleAdvance = (delay) => {
      if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current = setTimeout(advanceNext, delay);
    };

    if (!voiceEnabled) {
      scheduleAdvance(MIN_DWELL_MS);
      return () => { if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current); };
    }

    const isCustom = !!activeCategory?.isCustom;
    const categoryId = activeCategory?.id;
    let usingTts = false;
    let stopped = false;
    let blobUrl = null;

    const playTts = () => {
      if (!("speechSynthesis" in window)) { scheduleAdvance(MIN_DWELL_MS); return; }
      try {
        const u = new SpeechSynthesisUtterance(text);
        u.rate = 0.85; u.pitch = 1.02; u.volume = 0.95;
        const voices = window.speechSynthesis.getVoices();
        const preferred = voices.find(v => /en/i.test(v.lang) && /(samantha|ava|jenny|aria|female)/i.test(v.name))
                       || voices.find(v => /en/i.test(v.lang));
        if (preferred) u.voice = preferred;
        u.onend = () => { if (!stopped) scheduleAdvance(REPEAT_PAUSE_MS); };
        usingTts = true;
        window.speechSynthesis.speak(u);
        scheduleAdvance(MIN_DWELL_MS + 4000); // safety net if onend never fires
      } catch {
        scheduleAdvance(MIN_DWELL_MS);
      }
    };

    const playUrl = (url, { fallbackToTts }) => {
      const audio = new Audio(url);
      audio.volume = 0.95;
      audioRef.current = audio;
      audio.addEventListener("ended", () => {
        if (stopped) return;
        scheduleAdvance(REPEAT_PAUSE_MS);
      });
      audio.addEventListener("error", () => {
        if (stopped) return;
        audioRef.current = null;
        if (fallbackToTts) playTts();
        else scheduleAdvance(MIN_DWELL_MS);
      });
      audio.play().catch(() => {
        setTimeout(() => {
          if (stopped) return;
          if (audioRef.current === audio && audio.paused && audio.currentTime === 0) {
            audioRef.current = null;
            if (fallbackToTts) playTts();
            else scheduleAdvance(MIN_DWELL_MS);
          }
        }, 350);
      });
    };

    if (isCustom) {
      // Custom affirmations NEVER use Lulu. Either the user's own recording, or TTS.
      if (item?.hasRecording && item?.id) {
        idbGet(item.id).then(blob => {
          if (stopped) return;
          if (!blob) { playTts(); return; }
          blobUrl = URL.createObjectURL(blob);
          playUrl(blobUrl, { fallbackToTts: true });
        }).catch(() => { if (!stopped) playTts(); });
      } else {
        playTts();
      }
    } else if (categoryId) {
      // Built-in category — play Lulu's pre-recorded MP3
      playUrl(`/audio/affirmations/${categoryId}-${playerIdx}.mp3`, { fallbackToTts: true });
    } else {
      playTts();
    }

    return () => {
      stopped = true;
      stopVoice();
      if (usingTts) { try { window.speechSynthesis.cancel(); } catch {} }
      if (blobUrl) { try { URL.revokeObjectURL(blobUrl); } catch {} }
    };
  }, [playing, playerIdx, voiceEnabled, activeList, activeCategory, advanceNext, stopVoice]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopVoice();
      if (padRef.current) { padRef.current.stop(); padRef.current = null; }
    };
  }, [stopVoice]);

  const startCategory = (cat) => {
    // Lock premium categories after the trial ends
    if (cat.isPremium && !hasAccess) {
      if (onUpgrade) onUpgrade();
      return;
    }
    setActiveCategory(cat);
    setActiveList(cat.affirmations);
    setPlayerIdx(0);
    setPlaying(true);
    setView("player");
  };

  const startCustom = () => {
    if (customList.length === 0) return;
    setActiveCategory({ label: "Your affirmations", accent: B.gold, isCustom: true });
    setActiveList(customList);
    setPlayerIdx(0);
    setPlaying(true);
    setView("player");
  };

  const addCustom = () => {
    const trimmed = draft.trim();
    if (!trimmed || customList.length >= 20) return;
    setCustomList(list => [...list, { id: makeId(), text: trimmed, hasRecording: false, createdAt: Date.now() }]);
    setDraft("");
  };
  const removeCustom = (i) => {
    const item = customList[i];
    if (item?.id) { idbDelete(item.id).catch(() => {}); }
    setCustomList(list => list.filter((_, idx) => idx !== i));
  };

  // ── Recording: MediaRecorder + IndexedDB ──
  const startRecording = async (affirmationId) => {
    setRecordingError("");
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setRecordingError("This browser doesn't support voice recording.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      recordedChunksRef.current = [];
      // Pick the best mime type the browser actually supports.
      const mimeCandidates = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg"];
      const mime = mimeCandidates.find(m => MediaRecorder.isTypeSupported(m)) || "";
      const rec = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
      mediaRecorderRef.current = rec;
      rec.ondataavailable = (e) => { if (e.data && e.data.size > 0) recordedChunksRef.current.push(e.data); };
      rec.onstop = async () => {
        try { stream.getTracks().forEach(t => t.stop()); } catch {}
        mediaStreamRef.current = null;
        const blob = new Blob(recordedChunksRef.current, { type: rec.mimeType || "audio/webm" });
        recordedChunksRef.current = [];
        if (blob.size === 0) { setRecordingError("No audio was captured. Try again."); return; }
        try {
          await idbPut(affirmationId, blob);
          setCustomList(list => list.map(item => item.id === affirmationId ? { ...item, hasRecording: true } : item));
        } catch (e) {
          setRecordingError("Couldn't save the recording. Your browser storage may be full.");
        }
      };
      rec.start();
      setRecordingForId(affirmationId);
      setRecordingSeconds(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds(s => {
          const next = s + 1;
          if (next >= MAX_RECORD_SECONDS) { stopRecording(); }
          return next;
        });
      }, 1000);
    } catch (e) {
      const msg = e?.name === "NotAllowedError"
        ? "Microphone access was blocked. Allow it in your browser to record."
        : "Couldn't start recording. Try again.";
      setRecordingError(msg);
    }
  };

  const stopRecording = () => {
    if (recordingTimerRef.current) { clearInterval(recordingTimerRef.current); recordingTimerRef.current = null; }
    try { mediaRecorderRef.current?.stop(); } catch {}
    mediaRecorderRef.current = null;
    setRecordingForId(null);
    setRecordingSeconds(0);
  };

  const cancelRecording = () => {
    if (recordingTimerRef.current) { clearInterval(recordingTimerRef.current); recordingTimerRef.current = null; }
    try { mediaRecorderRef.current?.stop(); } catch {}
    try { mediaStreamRef.current?.getTracks().forEach(t => t.stop()); } catch {}
    mediaRecorderRef.current = null;
    mediaStreamRef.current = null;
    recordedChunksRef.current = [];
    setRecordingForId(null);
    setRecordingSeconds(0);
  };

  const deleteRecording = async (affirmationId) => {
    try { await idbDelete(affirmationId); } catch {}
    setCustomList(list => list.map(item => item.id === affirmationId ? { ...item, hasRecording: false } : item));
  };

  // Stop any active recording if user navigates away
  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      try { mediaRecorderRef.current?.stop(); } catch {}
      try { mediaStreamRef.current?.getTracks().forEach(t => t.stop()); } catch {}
    };
  }, []);

  // ── Home view — Luminar tech-luxe edition ──
  if (view === "home") {
    return (
      <div className="rhei-page" style={{
        position:"relative",
        minHeight:"100vh",
        background:"linear-gradient(180deg, #0A0604 0%, #100804 38%, #0A0604 100%)",
        overflow:"hidden",
        padding:"calc(env(safe-area-inset-top, 0px) + 28px) 0 140px",
      }}>
        <style>{ORB_CSS}</style>
        <DramaticGodRays intensity={1} pierce="50%" />

        <div style={{ position:"relative", zIndex:1, maxWidth:480, margin:"0 auto", padding:"0 24px" }}>

          {/* Top bar — back + version stamp (tech-luxe corner detail) */}
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:32 }}>
            {onBack ? (
              <button onClick={onBack} style={{ background:"rgba(248,242,229,0.04)", border:"1px solid rgba(248,242,229,0.10)", color:"rgba(248,242,229,0.70)", cursor:"pointer", display:"flex", alignItems:"center", gap:5, padding:"7px 12px 7px 8px", borderRadius:100, backdropFilter:"blur(8px)" }}>
                <ChevronLeft size={14} /> <span style={{ fontSize:10, letterSpacing:"0.22em", fontFamily:SF, textTransform:"uppercase", fontWeight:500 }}>Back</span>
              </button>
            ) : <span/>}
            <PrecisionStamp label="RHEI" value="VOICE 0.1"/>
          </div>

          {/* HERO — editorial photograph + tight type */}
          <div className="rhei-rise rhei-rise-1" style={{ marginBottom:40, marginTop:8 }}>
            <div style={{ position:"relative", marginBottom:28, borderRadius:2, overflow:"hidden" }}>
              <EditorialPhoto src="/images/affirmations-hero.jpg" tone="linen" aspect="5 / 4" overlay={true}>
                <div style={{
                  position:"absolute", top:18, left:18, right:18,
                  display:"flex", justifyContent:"space-between", alignItems:"center",
                }}>
                  <PrecisionStamp label="RHEI" value="AFFIRMATIONS" color="rgba(242,235,220,0.85)"/>
                  <PrecisionStamp label="05" color="rgba(242,235,220,0.65)"/>
                </div>
                <div style={{ position:"absolute", bottom:24, left:22, right:22 }}>
                  <h1 style={{
                    fontFamily:F, fontSize:"clamp(32px, 8.5vw, 46px)",
                    fontWeight:300, color:"#F2EBDC",
                    letterSpacing:"-0.025em", lineHeight:0.98,
                    margin:0,
                    fontVariationSettings:"'opsz' 144",
                  }}>
                    Affirmations
                  </h1>
                </div>
              </EditorialPhoto>
            </div>
            <p style={{
              fontFamily:F, fontSize:16, fontWeight:300,
              color:"rgba(242,235,220,0.72)", lineHeight:1.45,
              margin:0, letterSpacing:"-0.005em",
              maxWidth:380,
            }}>
              Five collections. Read them, hear them, or record them in your own voice. What you tell yourself becomes you.
            </p>
          </div>

          {/* Section eyebrow with index */}
          <div style={{ display:"flex", alignItems:"baseline", justifyContent:"space-between", margin:"0 0 6px" }}>
            <PrecisionStamp label="Collections" color="rgba(242,235,220,0.65)"/>
            <span style={{ fontFamily:SF, fontSize:9, letterSpacing:"0.28em", textTransform:"uppercase", color:"rgba(248,242,229,0.40)", fontVariantNumeric:"tabular-nums" }}>
              05 / FIVE
            </span>
          </div>
          <Hairline color="rgba(245,200,120,0.22)" margin="0 0 14px"/>

          {/* Editorial vertical category list */}
          <div className="rhei-rise rhei-rise-2" style={{ display:"flex", flexDirection:"column" }}>
            {AFFIRMATION_CATEGORIES.map((cat, idx) => {
              const num = String(idx + 1).padStart(2, "0");
              const locked = cat.isPremium && !hasAccess;
              return (
                <button
                  key={cat.id}
                  onClick={() => startCategory(cat)}
                  className="rhei-press"
                  style={{
                    width:"100%",
                    background:"transparent",
                    border:"none",
                    borderBottom: idx === AFFIRMATION_CATEGORIES.length-1 ? "none" : "1px solid rgba(248,242,229,0.06)",
                    padding:"24px 4px",
                    cursor:"pointer",
                    textAlign:"left",
                    position:"relative",
                    display:"flex",
                    alignItems:"center",
                    gap:16,
                    opacity: locked ? 0.55 : 1,
                  }}>
                  {/* Tabular index */}
                  <span style={{
                    flexShrink:0, width:32,
                    fontFamily:SF, fontSize:10, fontWeight:500,
                    letterSpacing:"0.22em", color:"rgba(248,242,229,0.40)",
                    fontVariantNumeric:"tabular-nums",
                  }}>{num}</span>

                  {/* Glowing orb in category color */}
                  <div style={{
                    flexShrink:0,
                    width:48, height:48, borderRadius:"50%",
                    position:"relative",
                    background:`radial-gradient(circle, ${cat.accent}55 0%, ${cat.accent}18 45%, transparent 72%)`,
                    display:"flex", alignItems:"center", justifyContent:"center",
                  }}>
                    <div style={{
                      width:12, height:12, borderRadius:"50%",
                      background: `radial-gradient(circle, ${cat.accent} 0%, ${cat.accent}80 100%)`,
                      boxShadow: `0 0 12px ${cat.accent}, inset 0 0 5px rgba(255,255,255,0.4)`,
                    }}/>
                  </div>

                  {/* Content */}
                  <div style={{ flex:1, minWidth:0 }}>
                    <h3 style={{
                      fontFamily:F,
                      fontSize:"clamp(20px, 5vw, 24px)",
                      fontWeight:300,
                      color:"#F8F2E5",
                      letterSpacing:"-0.015em",
                      lineHeight:1.1,
                      margin:"0 0 4px",
                      fontVariationSettings:"'opsz' 48",
                    }}>
                      {cat.label}
                    </h3>
                    <p style={{
                      fontFamily:F, fontWeight:300,
                      fontSize:13.5, color:"rgba(242,235,220,0.65)",
                      margin:0, lineHeight:1.45, letterSpacing:"-0.005em",
                    }}>
                      {cat.sublabel}
                    </p>
                    <div style={{ display:"flex", alignItems:"center", gap:10, marginTop:8 }}>
                      <span style={{ fontFamily:SF, fontSize:9, letterSpacing:"0.28em", textTransform:"uppercase", color:"rgba(248,242,229,0.40)", fontVariantNumeric:"tabular-nums" }}>
                        {cat.affirmations.length} affirmations
                      </span>
                      {locked && (
                        <span style={{ fontFamily:SF, fontSize:9, letterSpacing:"0.28em", textTransform:"uppercase", color:"rgba(245,200,120,0.75)", fontWeight:500, display:"inline-flex", alignItems:"center", gap:5 }}>
                          <Lock size={9} strokeWidth={2}/> Members
                        </span>
                      )}
                    </div>
                  </div>

                  {locked
                    ? <Lock size={14} color="rgba(245,200,120,0.55)" strokeWidth={1.5} style={{ flexShrink:0 }}/>
                    : <ArrowRight size={15} color="rgba(248,242,229,0.45)" strokeWidth={1.5} style={{ flexShrink:0 }}/>
                  }
                </button>
              );
            })}
          </div>

          {/* Custom — your own voice section */}
          <div className="rhei-rise rhei-rise-3" style={{ marginTop:48 }}>
            <div style={{ display:"flex", alignItems:"baseline", justifyContent:"space-between", margin:"0 0 6px" }}>
              <PrecisionStamp label="Your Voice" color="rgba(245,200,120,0.65)"/>
              <span style={{ fontFamily:SF, fontSize:9, letterSpacing:"0.28em", textTransform:"uppercase", color:"rgba(248,242,229,0.40)", fontVariantNumeric:"tabular-nums" }}>
                {String(customList.length).padStart(2, "0")} / 20
              </span>
            </div>
            <Hairline color="rgba(245,200,120,0.22)" margin="0 0 20px"/>

            <button
              onClick={() => setView("custom")}
              className="rhei-press"
              style={{
                width:"100%",
                background:"rgba(248,242,229,0.04)",
                backdropFilter:"blur(10px)",
                WebkitBackdropFilter:"blur(10px)",
                border:"1px solid rgba(245,200,120,0.20)",
                borderRadius:18,
                padding:"22px 22px",
                cursor:"pointer",
                textAlign:"left",
                display:"flex", alignItems:"center", gap:14,
                position:"relative", overflow:"hidden",
              }}>
              <div style={{ position:"absolute", top:-30, right:-30, width:160, height:160, borderRadius:"50%", background:"radial-gradient(circle, rgba(245,200,120,0.18) 0%, transparent 65%)", filter:"blur(20px)", pointerEvents:"none" }}/>
              <div style={{
                width:42, height:42, borderRadius:"50%",
                background:"radial-gradient(circle, rgba(245,200,120,0.45) 0%, rgba(245,200,120,0.10) 45%, transparent 72%)",
                display:"flex", alignItems:"center", justifyContent:"center",
                flexShrink:0,
              }}>
                <BookOpen size={15} color="#F5C878" strokeWidth={1.5}/>
              </div>
              <div style={{ flex:1, position:"relative", zIndex:1 }}>
                <h3 style={{ fontFamily:F, fontSize:20, fontWeight:300, color:"#F8F2E5", letterSpacing:"-0.015em", lineHeight:1.15, margin:"0 0 3px", fontVariationSettings:"'opsz' 48" }}>
                  Write your own.
                </h3>
                <p style={{ fontFamily:F, fontWeight:300, fontSize:13, color:"rgba(242,235,220,0.65)", margin:0, lineHeight:1.45, letterSpacing:"-0.005em" }}>
                  {customList.length > 0 ? `${customList.length} saved — record yourself` : "Up to 20. In your own voice."}
                </p>
              </div>
              <ArrowRight size={15} color="rgba(248,242,229,0.45)" strokeWidth={1.5} style={{ flexShrink:0, position:"relative", zIndex:1 }}/>
            </button>

            {customList.length > 0 && (
              <button
                onClick={startCustom}
                className="rhei-press"
                style={{
                  width:"100%", marginTop:14,
                  background:"rgba(248,242,229,0.95)",
                  border:"none",
                  color:"#1A0F06",
                  fontFamily:SF, fontSize:13, fontWeight:600,
                  letterSpacing:"0.06em",
                  padding:"13px 30px",
                  borderRadius:100,
                  cursor:"pointer",
                  display:"inline-flex", alignItems:"center", justifyContent:"center", gap:8,
                  boxShadow:"0 16px 40px -14px rgba(248,242,229,0.40), 0 4px 14px rgba(15,9,5,0.4)",
                }}>
                <Play size={12} fill="#1A0F06" /> <span>Play your voice</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Custom editor view ──
  if (view === "custom") {
    return (
      <div className="rhei-page" style={{
        position:"relative",
        minHeight:"100vh",
        background:"linear-gradient(180deg, #0A0604 0%, #100804 38%, #0A0604 100%)",
        overflow:"hidden",
        padding:"calc(env(safe-area-inset-top, 0px) + 28px) 0 140px",
      }}>
        <style>{ORB_CSS}</style>
        <DramaticGodRays intensity={0.7} pierce="50%" motes={false} />
        <div style={{ position:"relative", zIndex:1, maxWidth:480, margin:"0 auto", padding:"0 24px" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:28 }}>
            <button onClick={() => setView("home")} style={{ background:"rgba(248,242,229,0.04)", border:"1px solid rgba(248,242,229,0.10)", color:"rgba(248,242,229,0.75)", cursor:"pointer", display:"flex", alignItems:"center", gap:5, padding:"7px 12px 7px 8px", borderRadius:100, backdropFilter:"blur(8px)" }}>
              <ChevronLeft size={14} /> <span style={{ fontSize:10, letterSpacing:"0.22em", fontFamily:SF, textTransform:"uppercase", fontWeight:500 }}>Back</span>
            </button>
            <PrecisionStamp label="Your Voice" value={`${String(customList.length).padStart(2,"0")} / 20`} color="rgba(245,200,120,0.65)"/>
          </div>
          <div style={{ marginBottom:32, textAlign:"center" }}>
            <div style={{ marginBottom:20 }}><StarburstPlinth size={42} glyph={22}/></div>
            <p style={{ fontFamily:SF, fontSize:10, fontWeight:500, letterSpacing:"0.4em", textTransform:"uppercase", color:"rgba(245,200,120,0.75)", margin:"0 0 14px" }}>Atelier</p>
            <h1 style={{ fontFamily:F, fontSize:"clamp(28px, 7vw, 36px)", fontWeight:300, color:"#F8F2E5", letterSpacing:"-0.02em", lineHeight:1.05, margin:"0 0 12px", fontVariationSettings:"'opsz' 96", textShadow:"0 2px 20px rgba(0,0,0,0.4)" }}>
              Write what you need to hear.
            </h1>
            <p style={{ fontFamily:F, fontSize:13, color:"rgba(248,242,229,0.62)", lineHeight:1.55, margin:"0 auto", maxWidth:300 }}>
              Short. Present tense. Yours.
            </p>
          </div>

        {/* Editor */}
        <div style={{ background: B.card, border: `1px solid ${B.border}`, borderRadius: 16, padding: 16, marginBottom: 20 }}>
          <textarea value={draft} onChange={e => setDraft(e.target.value)}
            placeholder="I am allowed to…"
            maxLength={140}
            rows={3}
            style={{ width: "100%", background: "transparent", border: "none", color: B.cream, fontFamily: F, fontSize: 15, lineHeight: 1.5, resize: "none", outline: "none" }}
          />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 10 }}>
            <span style={{ fontSize: 10, color: B.muted, fontFamily: SF }}>{draft.length}/140 · {customList.length}/20 saved</span>
            <button onClick={addCustom} disabled={!draft.trim() || customList.length >= 20}
              style={{ background: draft.trim() && customList.length < 20 ? B.goldGrad : "transparent", border: draft.trim() && customList.length < 20 ? "none" : `1px solid ${B.border}`, borderRadius: 18, padding: "7px 18px", cursor: draft.trim() && customList.length < 20 ? "pointer" : "not-allowed", color: draft.trim() && customList.length < 20 ? B.warmBlack : B.muted, fontSize: 11, fontFamily: SF, letterSpacing: 1, fontWeight: 600, textTransform: "uppercase", display: "flex", alignItems: "center", gap: 5 }}>
              <Save size={11} /> Save
            </button>
          </div>
        </div>

        {/* Recording error banner (sticky-ish) */}
        {recordingError && (
          <div style={{ background: `${B.cream}10`, border: `1px solid ${B.gold}40`, borderRadius: 10, padding: "10px 12px", margin: "0 0 16px", display: "flex", alignItems: "center", gap: 10 }}>
            <p style={{ flex: 1, fontSize: 12, color: B.cream, margin: 0, fontFamily: SF, lineHeight: 1.5 }}>{recordingError}</p>
            <button onClick={() => setRecordingError("")} style={{ background: "none", border: "none", cursor: "pointer", color: B.muted, padding: 4 }}>
              <X size={12} />
            </button>
          </div>
        )}

        {/* Inline science explainer — only show if there are saved affirmations to record */}
        {customList.length > 0 && (
          <div style={{ background: `${B.gold}08`, border: `1px solid ${B.gold}20`, borderRadius: 12, padding: "12px 14px", margin: "0 0 16px" }}>
            <p style={{ fontSize: 10, letterSpacing: 2, color: B.gold, textTransform: "uppercase", fontFamily: SF, margin: "0 0 6px" }}>Why your own voice</p>
            <p style={{ fontSize: 12, color: B.creamMuted, margin: 0, fontFamily: F, lineHeight: 1.6 }}>
              Words you wrote, spoken in your own voice, tie your identity to the belief in a way no recording from someone else can. Tap the mic on any affirmation to record yourself.
            </p>
          </div>
        )}

        {/* List */}
        {customList.length === 0 ? (
          <p style={{ fontSize: 13, color: B.muted, fontFamily: F, lineHeight: 1.6, textAlign: "center", marginTop: 40 }}>
            Nothing here yet. Try writing one — short, present-tense, in your own voice.
          </p>
        ) : (
          <div>
            <p style={{ fontSize: 9, letterSpacing: 3, color: B.muted, textTransform: "uppercase", fontFamily: SF, margin: "0 0 12px" }}>Saved</p>
            {customList.map((item, i) => {
              const isRecordingThis = recordingForId === item.id;
              const isRecordingSomethingElse = recordingForId && recordingForId !== item.id;
              return (
                <div key={item.id || i} style={{ background: B.card, border: `1px solid ${isRecordingThis ? B.gold + "60" : item.hasRecording ? B.gold + "30" : B.border}`, borderRadius: 12, padding: "12px 14px", marginBottom: 8 }}>
                  {isRecordingThis ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <CircleDot size={14} color="#E07A5F" style={{ animation: "rhei-rec-pulse 1.2s ease-in-out infinite", flexShrink: 0 }} />
                      <p style={{ flex: 1, fontSize: 13, color: B.cream, margin: 0, fontFamily: F, lineHeight: 1.4 }}>
                        Recording… <span style={{ color: B.muted, fontFamily: SF, fontSize: 11, letterSpacing: 0.5 }}>{String(Math.floor(recordingSeconds / 60)).padStart(1, "0")}:{String(recordingSeconds % 60).padStart(2, "0")} / 0:{String(MAX_RECORD_SECONDS).padStart(2, "0")}</span>
                      </p>
                      <button onClick={stopRecording} aria-label="Stop recording" style={{ background: B.gold, border: "none", borderRadius: 8, padding: "6px 10px", cursor: "pointer", color: B.warmBlack, display: "flex", alignItems: "center", gap: 4, fontFamily: SF, fontSize: 11, fontWeight: 600 }}>
                        <Square size={11} fill={B.warmBlack} /> Stop
                      </button>
                      <button onClick={cancelRecording} aria-label="Cancel recording" style={{ background: "none", border: "none", cursor: "pointer", color: B.muted, padding: 4, flexShrink: 0 }}>
                        <X size={13} />
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                      <p style={{ flex: 1, fontSize: 14, color: B.cream, margin: 0, fontFamily: F, lineHeight: 1.5 }}>
                        {item.text}
                        {item.hasRecording && (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, marginLeft: 8, fontSize: 10, color: B.gold, fontFamily: SF, letterSpacing: 0.5, textTransform: "uppercase", verticalAlign: "middle" }}>
                            <Mic size={9} /> Recorded
                          </span>
                        )}
                      </p>
                      <button
                        onClick={() => startRecording(item.id)}
                        disabled={isRecordingSomethingElse}
                        aria-label={item.hasRecording ? "Re-record voice" : "Record your voice"}
                        title={item.hasRecording ? "Re-record" : "Record your voice"}
                        style={{ background: item.hasRecording ? `${B.gold}18` : "none", border: `1px solid ${item.hasRecording ? B.gold + "40" : B.border}`, borderRadius: 8, padding: "5px 8px", cursor: isRecordingSomethingElse ? "not-allowed" : "pointer", color: item.hasRecording ? B.gold : B.creamMuted, opacity: isRecordingSomethingElse ? 0.4 : 1, display: "flex", alignItems: "center", flexShrink: 0 }}>
                        <Mic size={13} />
                      </button>
                      {item.hasRecording && (
                        <button onClick={() => deleteRecording(item.id)} aria-label="Delete recording" title="Delete recording" style={{ background: "none", border: `1px solid ${B.border}`, borderRadius: 8, padding: "5px 8px", cursor: "pointer", color: B.muted, display: "flex", alignItems: "center", flexShrink: 0 }}>
                          <MicOff size={13} />
                        </button>
                      )}
                      <button onClick={() => removeCustom(i)} aria-label="Delete affirmation" style={{ background: "none", border: "none", cursor: "pointer", color: B.muted, padding: 4, flexShrink: 0 }}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
            <button onClick={startCustom}
              style={{ width: "100%", marginTop: 16, background: B.goldGrad, border: "none", borderRadius: 22, padding: "12px 26px", cursor: "pointer", color: B.warmBlack, fontSize: 12, fontFamily: SF, letterSpacing: 1.5, fontWeight: 600, textTransform: "uppercase" }}>
              Play your affirmations
            </button>
          </div>
        )}
        <style>{`@keyframes rhei-rec-pulse { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(0.9); } }`}</style>
        </div>
      </div>
    );
  }

  // ── Player view — Luminar tech-luxe with breathing orb ──
  if (view === "player") {
    const currentItem = activeList[playerIdx];
    const current = (typeof currentItem === "string") ? currentItem : (currentItem?.text || "");
    const accent = activeCategory?.accent || B.gold;
    const progress = activeList.length > 0 ? ((playerIdx + 1) / activeList.length) : 0;
    return (
      <div className="rhei-page" style={{
        minHeight:"100vh",
        background:"linear-gradient(180deg, #0A0604 0%, #100804 38%, #0A0604 100%)",
        display:"flex", flexDirection:"column",
        padding:"calc(env(safe-area-inset-top, 0px) + 22px) 22px 36px",
        position:"relative", overflow:"hidden",
      }}>
        <style>{ORB_CSS}</style>
        <DramaticGodRays intensity={0.85} pierce="50%" vignette={false} />

        {/* Color-tinted bloom carrying the category's accent */}
        <div style={{
          position:"absolute", top:"50%", left:"50%",
          width:"140vmin", height:"140vmin", borderRadius:"50%",
          background:`radial-gradient(circle, ${accent}38 0%, ${accent}16 30%, transparent 65%)`,
          animation:"rhei-breath 22s ease-in-out infinite",
          filter:"blur(48px)", mixBlendMode:"screen",
          pointerEvents:"none", zIndex:0,
        }}/>

        {/* Top control bar — observatory style */}
        <div style={{ position:"relative", zIndex:2, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <button onClick={() => { setPlaying(false); setView("home"); }} style={{ background:"rgba(248,242,229,0.04)", backdropFilter:"blur(8px)", border:"1px solid rgba(248,242,229,0.10)", color:"rgba(248,242,229,0.75)", cursor:"pointer", display:"flex", alignItems:"center", gap:5, padding:"7px 12px 7px 8px", borderRadius:100 }}>
            <ChevronLeft size={14} /> <span style={{ fontSize:10, letterSpacing:"0.22em", fontFamily:SF, textTransform:"uppercase", fontWeight:500 }}>Done</span>
          </button>
          <PrecisionStamp label={activeCategory?.label || "Custom"} color="rgba(245,200,120,0.65)"/>
          <div style={{ display:"flex", gap:8 }}>
            <button
              onClick={() => setMusicEnabled(m => !m)}
              aria-label={musicEnabled ? "Mute background music" : "Play background music"}
              style={{ background:"rgba(248,242,229,0.04)", backdropFilter:"blur(8px)", border:`1px solid ${musicEnabled ? "rgba(245,200,120,0.40)" : "rgba(248,242,229,0.10)"}`, borderRadius:"50%", width:34, height:34, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color: musicEnabled ? "#F5C878" : "rgba(248,242,229,0.50)", padding:0 }}>
              <Music2 size={13} />
            </button>
            <button
              onClick={() => setVoiceEnabled(v => !v)}
              aria-label={voiceEnabled ? "Mute Lulu's voice" : "Unmute Lulu's voice"}
              style={{ background:"rgba(248,242,229,0.04)", backdropFilter:"blur(8px)", border:`1px solid ${voiceEnabled ? "rgba(245,200,120,0.40)" : "rgba(248,242,229,0.10)"}`, borderRadius:"50%", width:34, height:34, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color: voiceEnabled ? "#F5C878" : "rgba(248,242,229,0.50)", padding:0 }}>
              {voiceEnabled ? <Volume2 size={13}/> : <VolumeX size={13}/>}
            </button>
          </div>
        </div>

        {/* Stage */}
        <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", textAlign:"center", position:"relative", zIndex:1, padding:"0 8px" }}>
          {/* Orb stage with corner brackets */}
          <div style={{ position:"relative", width:240, height:240, display:"flex", alignItems:"center", justifyContent:"center", marginBottom:42 }}>
            <CornerBrackets inset={-6} size={18} color="rgba(245,200,120,0.40)"/>
            <Orb active={playing} size={200} accent={accent} />
            {/* Inner core dot */}
            <div style={{
              position:"absolute", top:"50%", left:"50%",
              transform:"translate(-50%, -50%)",
              width:6, height:6, borderRadius:"50%",
              background:accent,
              boxShadow:`0 0 16px ${accent}, 0 0 32px ${accent}80`,
              opacity: playing ? 0.9 : 0.5,
              transition:"opacity 0.4s",
            }}/>
          </div>

          <p key={playerIdx} style={{
            fontFamily:F, fontSize:"clamp(22px, 6vw, 28px)",
            fontWeight:300, color:"#F8F2E5",
            lineHeight:1.32, letterSpacing:"-0.015em",
            margin:0, maxWidth:380,
            animation:"rhei-fade 0.8s ease both",
            textShadow:"0 2px 14px rgba(0,0,0,0.45)",
            fontVariationSettings:"'opsz' 72",
          }}>
            {current}
          </p>
        </div>

        {/* Bottom rail — tech-luxe progress + transport */}
        <div style={{ position:"relative", zIndex:1, marginTop:24 }}>
          {/* Progress hairline */}
          <div style={{ display:"flex", alignItems:"center", gap:14, margin:"0 0 22px" }}>
            <span style={{ fontFamily:SF, fontSize:10, fontWeight:500, letterSpacing:"0.22em", color:"rgba(248,242,229,0.55)", fontVariantNumeric:"tabular-nums", flexShrink:0 }}>
              {String(playerIdx + 1).padStart(2, "0")}
            </span>
            <div style={{ flex:1, height:1, background:"rgba(248,242,229,0.10)", position:"relative", overflow:"hidden" }}>
              <div style={{
                position:"absolute", left:0, top:0, height:"100%",
                width:`${progress * 100}%`,
                background:`linear-gradient(90deg, ${accent}, #F5C878)`,
                boxShadow:`0 0 10px ${accent}80`,
                transition:"width 0.6s ease",
              }}/>
            </div>
            <span style={{ fontFamily:SF, fontSize:10, fontWeight:500, letterSpacing:"0.22em", color:"rgba(248,242,229,0.40)", fontVariantNumeric:"tabular-nums", flexShrink:0 }}>
              {String(activeList.length).padStart(2, "0")}
            </span>
          </div>

          {/* Transport */}
          <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:28 }}>
            <button onClick={() => setPlayerIdx(i => (i - 1 + activeList.length) % activeList.length)}
              style={{ background:"rgba(248,242,229,0.04)", backdropFilter:"blur(8px)", border:"1px solid rgba(248,242,229,0.12)", borderRadius:"50%", width:46, height:46, cursor:"pointer", color:"rgba(248,242,229,0.90)", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <ChevronLeft size={20} />
            </button>
            <button onClick={() => setPlaying(p => !p)}
              style={{
                background:"rgba(248,242,229,0.95)",
                border:"none", borderRadius:"50%",
                width:72, height:72, cursor:"pointer",
                color:"#1A0F06",
                display:"flex", alignItems:"center", justifyContent:"center",
                boxShadow:`0 16px 40px -10px rgba(248,242,229,0.45), 0 0 50px ${accent}30`,
              }}>
              {playing ? <Pause size={26} /> : <Play size={26} style={{ marginLeft:3 }} />}
            </button>
            <button onClick={() => setPlayerIdx(i => (i + 1) % activeList.length)}
              style={{ background:"rgba(248,242,229,0.04)", backdropFilter:"blur(8px)", border:"1px solid rgba(248,242,229,0.12)", borderRadius:"50%", width:46, height:46, cursor:"pointer", color:"rgba(248,242,229,0.90)", display:"flex", alignItems:"center", justifyContent:"center", transform:"rotate(180deg)" }}>
              <ChevronLeft size={20} />
            </button>
          </div>
        </div>

        <style>{`@keyframes rhei-fade { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }`}</style>
      </div>
    );
  }

  return null;
}
