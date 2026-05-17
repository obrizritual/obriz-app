import { useState, useEffect, useRef } from "react";
import { ChevronLeft, Play, Pause, Plus, Trash2, Save, BookOpen, Sparkles } from "lucide-react";

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
const F  = "'Georgia','Times New Roman',serif";
const SF = "system-ui,-apple-system,sans-serif";

// ── Curated starter affirmations — "quietly powerful" voice ──
export const AFFIRMATION_CATEGORIES = [
  {
    id: "self-worth",
    label: "Self-worth",
    sublabel: "For the quiet days when you forget",
    accent: "#C49A4B",
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
    accent: "#8A9BAF",
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
    accent: "#A08BAA",
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
    accent: "#C4786A",
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
    accent: "#5A8A5A",
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
export default function AffirmationsScreen({ onBack }) {
  const [view, setView] = useState("home"); // home | category | custom | player
  const [activeCategory, setActiveCategory] = useState(null);
  const [activeList, setActiveList] = useState([]);          // affirmations being played
  const [customList, setCustomList] = useState(() => loadJSON(KEY_CUSTOM, []));
  const [draft, setDraft] = useState("");
  const [playerIdx, setPlayerIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const timerRef = useRef(null);

  // Persist custom list
  useEffect(() => { saveJSON(KEY_CUSTOM, customList); }, [customList]);

  // Player auto-advance (every 7 seconds when playing)
  useEffect(() => {
    if (!playing) return;
    timerRef.current = setTimeout(() => {
      setPlayerIdx(i => (i + 1) % activeList.length);
    }, 7000);
    return () => clearTimeout(timerRef.current);
  }, [playing, playerIdx, activeList.length]);

  const startCategory = (cat) => {
    setActiveCategory(cat);
    setActiveList(cat.affirmations);
    setPlayerIdx(0);
    setPlaying(true);
    setView("player");
  };

  const startCustom = () => {
    if (customList.length === 0) return;
    setActiveCategory({ label: "Your affirmations", accent: B.gold });
    setActiveList(customList);
    setPlayerIdx(0);
    setPlaying(true);
    setView("player");
  };

  const addCustom = () => {
    const trimmed = draft.trim();
    if (!trimmed || customList.length >= 20) return;
    setCustomList(list => [...list, trimmed]);
    setDraft("");
  };
  const removeCustom = (i) => setCustomList(list => list.filter((_, idx) => idx !== i));

  // ── Home view (category grid + custom entry) ──
  if (view === "home") {
    return (
      <div className="rhei-page" style={{ padding: "56px 22px 120px", minHeight: "100vh", background: B.bg }}>
        <style>{ORB_CSS}</style>
        {onBack && (
          <button onClick={onBack} style={{ background: "none", border: "none", color: B.muted, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, marginBottom: 24, padding: 0 }}>
            <ChevronLeft size={16} /> <span style={{ fontSize: 11, letterSpacing: 1.5, fontFamily: SF, textTransform: "uppercase" }}>Back</span>
          </button>
        )}
        <div style={{ marginBottom: 32 }}>
          <p style={{ fontSize: 9, letterSpacing: 3, color: B.muted, textTransform: "uppercase", fontFamily: SF, marginBottom: 6 }}>Affirmations</p>
          <h1 style={{ fontSize: 22, fontWeight: 400, color: B.cream, margin: 0, fontFamily: F }}>What you tell yourself, becomes you.</h1>
          <p style={{ fontSize: 13, color: B.muted, marginTop: 6, fontStyle: "italic", fontFamily: F, lineHeight: 1.5 }}>
            Pick a category, or write your own. Read them. Hear them. Let them land.
          </p>
        </div>

        {/* Categories */}
        <div style={{ marginBottom: 22 }}>
          <p style={{ fontSize: 9, letterSpacing: 3, color: B.muted, textTransform: "uppercase", fontFamily: SF, margin: "0 0 12px" }}>Categories</p>
          {AFFIRMATION_CATEGORIES.map(cat => (
            <button key={cat.id} onClick={() => startCategory(cat)}
              style={{ width: "100%", background: B.card, border: `1px solid ${B.border}`, borderRadius: 16, padding: "18px 18px", cursor: "pointer", textAlign: "left", marginBottom: 10, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 15, color: B.cream, margin: 0, fontFamily: F, fontWeight: 400 }}>{cat.label}</p>
                <p style={{ fontSize: 11, color: B.muted, margin: "2px 0 0", fontFamily: SF, fontStyle: "italic" }}>{cat.sublabel}</p>
              </div>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: `${cat.accent}14`, border: `1px solid ${cat.accent}30`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Sparkles size={15} color={cat.accent} />
              </div>
            </button>
          ))}
        </div>

        {/* Build your own */}
        <div style={{ marginTop: 28 }}>
          <p style={{ fontSize: 9, letterSpacing: 3, color: B.muted, textTransform: "uppercase", fontFamily: SF, margin: "0 0 12px" }}>Your own</p>
          <button onClick={() => setView("custom")}
            style={{ width: "100%", background: B.card, border: `1px solid ${B.borderActive}`, borderRadius: 16, padding: "18px 18px", cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 15, color: B.cream, margin: 0, fontFamily: F, fontWeight: 400 }}>Write your own</p>
              <p style={{ fontSize: 11, color: B.muted, margin: "2px 0 0", fontFamily: SF, fontStyle: "italic" }}>
                {customList.length > 0 ? `${customList.length} saved` : "Up to 20, saved on this device"}
              </p>
            </div>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: `${B.gold}14`, border: `1px solid ${B.borderActive}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <BookOpen size={15} color={B.gold} />
            </div>
          </button>
          {customList.length > 0 && (
            <button onClick={startCustom}
              style={{ width: "100%", marginTop: 8, background: B.goldGrad, border: "none", borderRadius: 22, padding: "11px 26px", cursor: "pointer", color: B.warmBlack, fontSize: 12, fontFamily: SF, letterSpacing: 1.5, fontWeight: 600, textTransform: "uppercase" }}>
              Play your own
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── Custom editor view ──
  if (view === "custom") {
    return (
      <div className="rhei-page" style={{ padding: "56px 22px 120px", minHeight: "100vh", background: B.bg }}>
        <button onClick={() => setView("home")} style={{ background: "none", border: "none", color: B.muted, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, marginBottom: 24, padding: 0 }}>
          <ChevronLeft size={16} /> <span style={{ fontSize: 11, letterSpacing: 1.5, fontFamily: SF, textTransform: "uppercase" }}>Back</span>
        </button>
        <div style={{ marginBottom: 24 }}>
          <p style={{ fontSize: 9, letterSpacing: 3, color: B.muted, textTransform: "uppercase", fontFamily: SF, marginBottom: 6 }}>Your affirmations</p>
          <h1 style={{ fontSize: 22, fontWeight: 400, color: B.cream, margin: 0, fontFamily: F }}>Write what you need to hear.</h1>
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

        {/* List */}
        {customList.length === 0 ? (
          <p style={{ fontSize: 13, color: B.muted, fontStyle: "italic", fontFamily: F, lineHeight: 1.6, textAlign: "center", marginTop: 40 }}>
            Nothing here yet. Try writing one — short, present-tense, in your own voice.
          </p>
        ) : (
          <div>
            <p style={{ fontSize: 9, letterSpacing: 3, color: B.muted, textTransform: "uppercase", fontFamily: SF, margin: "0 0 12px" }}>Saved</p>
            {customList.map((text, i) => (
              <div key={i} style={{ background: B.card, border: `1px solid ${B.border}`, borderRadius: 12, padding: "12px 14px", marginBottom: 8, display: "flex", alignItems: "flex-start", gap: 10 }}>
                <p style={{ flex: 1, fontSize: 14, color: B.cream, margin: 0, fontFamily: F, lineHeight: 1.5 }}>{text}</p>
                <button onClick={() => removeCustom(i)} style={{ background: "none", border: "none", cursor: "pointer", color: B.muted, padding: 4, flexShrink: 0 }}>
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
            <button onClick={startCustom}
              style={{ width: "100%", marginTop: 16, background: B.goldGrad, border: "none", borderRadius: 22, padding: "12px 26px", cursor: "pointer", color: B.warmBlack, fontSize: 12, fontFamily: SF, letterSpacing: 1.5, fontWeight: 600, textTransform: "uppercase" }}>
              Play your affirmations
            </button>
          </div>
        )}
      </div>
    );
  }

  // ── Player view ──
  if (view === "player") {
    const current = activeList[playerIdx] || "";
    const accent = activeCategory?.accent || B.gold;
    return (
      <div className="rhei-page" style={{ minHeight: "100vh", background: B.bgDeep, display: "flex", flexDirection: "column", padding: "56px 22px 56px", position:"relative", overflow:"hidden" }}>
        <style>{ORB_CSS}</style>
        {/* Calming animated background — two soft glow orbs that slowly drift and breathe,
            instead of the static black. Sits behind everything else with low opacity. */}
        <div style={{
          position:"absolute", top:"50%", left:"50%",
          width:"160vmin", height:"160vmin", borderRadius:"50%",
          background:`radial-gradient(circle at 50% 50%, ${accent}40 0%, ${accent}18 30%, transparent 65%)`,
          animation:"rhei-breath 22s ease-in-out infinite",
          pointerEvents:"none", zIndex:0, filter:"blur(40px)",
        }}/>
        <div style={{
          position:"absolute", top:"30%", left:"40%",
          width:"120vmin", height:"120vmin", borderRadius:"50%",
          background:`radial-gradient(circle at 50% 50%, ${B.gold}30 0%, ${B.goldMuted}14 35%, transparent 70%)`,
          animation:"rhei-breath-2 28s ease-in-out infinite",
          pointerEvents:"none", zIndex:0, filter:"blur(60px)",
        }}/>
        <button onClick={() => { setPlaying(false); setView("home"); }} style={{ background: "none", border: "none", color: B.creamMuted, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, padding: 0, alignSelf: "flex-start", zIndex:1 }}>
          <ChevronLeft size={16} /> <span style={{ fontSize: 11, letterSpacing: 1.5, fontFamily: SF, textTransform: "uppercase" }}>Done</span>
        </button>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", position:"relative", zIndex:1 }}>
          <div style={{ position: "relative", width: 200, height: 200, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 38 }}>
            <Orb active={playing} size={200} accent={accent} />
          </div>
          <p style={{ fontSize: 11, letterSpacing: 3, color: B.creamMuted, textTransform: "uppercase", fontFamily: SF, margin: "0 0 20px", textShadow:"0 1px 8px rgba(0,0,0,0.5)" }}>{activeCategory?.label}</p>
          <p key={playerIdx} style={{ fontSize: 26, lineHeight: 1.4, color: B.cream, fontFamily: F, fontWeight: 400, margin: 0, maxWidth: 360, animation: "rhei-fade 0.8s ease both", textShadow:"0 2px 14px rgba(0,0,0,0.45)" }}>
            {current}
          </p>
          <p style={{ fontSize: 11, color: B.creamMuted, fontFamily: SF, marginTop: 32, letterSpacing: 1, textShadow:"0 1px 6px rgba(0,0,0,0.4)" }}>
            {playerIdx + 1} of {activeList.length}
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 24, marginTop: 24, position:"relative", zIndex:1 }}>
          <button onClick={() => setPlayerIdx(i => (i - 1 + activeList.length) % activeList.length)}
            style={{ background: "none", border: `1px solid ${B.border}`, borderRadius: "50%", width: 44, height: 44, cursor: "pointer", color: B.cream, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <ChevronLeft size={20} />
          </button>
          <button onClick={() => setPlaying(p => !p)}
            style={{ background: B.goldGrad, border: "none", borderRadius: "50%", width: 64, height: 64, cursor: "pointer", color: B.warmBlack, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {playing ? <Pause size={24} /> : <Play size={24} style={{ marginLeft: 3 }} />}
          </button>
          <button onClick={() => setPlayerIdx(i => (i + 1) % activeList.length)}
            style={{ background: "none", border: `1px solid ${B.border}`, borderRadius: "50%", width: 44, height: 44, cursor: "pointer", color: B.cream, display: "flex", alignItems: "center", justifyContent: "center", transform: "rotate(180deg)" }}>
            <ChevronLeft size={20} />
          </button>
        </div>

        <style>{`@keyframes rhei-fade { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }`}</style>
      </div>
    );
  }

  return null;
}
