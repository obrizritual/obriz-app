// ════════════════════════════════════════════════════════════════
// RHEI — Ritual step configurations
//
// Each ritual step is a list of "gestures" — primitive animated
// marks that overlay the woman's portrait to show the technique.
//
// Coordinate system: all positions are normalized [0..1] of the
// portrait image. (0,0) is top-left, (1,1) is bottom-right.
//
// Gesture shapes:
//   { type:"arrow", points:[[x,y], ...], width?, color? }
//     A directional arrow that DRAWS ITSELF along the path then
//     repeats. Used for strokes (jaw scrape, cheek lift).
//
//   { type:"curve", points:[[x,y], ...], width?, color? }
//     Same as arrow but no arrowhead. For direction-agnostic traces.
//
//   { type:"circle", center:[x,y], radius:r, count?:N }
//     Hollow circle that PULSES (rotates / scales). Used for
//     rotational moves (parotid pulse, eye orbit circles). Optional
//     `count` shows how many rotations.
//
//   { type:"point", center:[x,y], radius?, color? }
//     A solid dot with a soft halo that fades in/out.
//
//   { type:"hold", center:[x,y], radius?, color? }
//     Concentric rings that PULSE OUTWARD like sonar pings.
//     Used for pressure holds (brow trio, terminus pumps).
//
//   { type:"wave", from:[x,y], to:[x,y], width? }
//     A wavy line that animates between two points — used for
//     the pumping motion of the lymphatic terminus.
//
// Each gesture can also have a `delay` (seconds) to stagger
// animations across multiple gestures in the same step.
// ════════════════════════════════════════════════════════════════

// ──────────── LANDMARKS ────────────
// Manually calibrated landmarks for each woman's clean portrait.
// These match the actual anatomy on the photographs.
export const LANDMARKS = {
  "woman-a": {
    forehead_top:     [0.50, 0.14],
    forehead_left:    [0.32, 0.20],
    forehead_right:   [0.68, 0.20],
    forehead_center:  [0.50, 0.24],
    brow_inner_l:     [0.43, 0.32],
    brow_mid_l:       [0.40, 0.31],
    brow_outer_l:     [0.36, 0.32],
    brow_inner_r:     [0.57, 0.32],
    brow_mid_r:       [0.60, 0.31],
    brow_outer_r:     [0.64, 0.32],
    eye_inner_l:      [0.44, 0.37],
    eye_outer_l:      [0.36, 0.37],
    eye_center_l:     [0.40, 0.37],
    eye_inner_r:      [0.56, 0.37],
    eye_outer_r:      [0.64, 0.37],
    eye_center_r:     [0.60, 0.37],
    temple_l:         [0.22, 0.36],
    temple_r:         [0.78, 0.36],
    cheekbone_l:      [0.34, 0.48],
    cheekbone_r:      [0.66, 0.48],
    cheek_l:          [0.36, 0.55],
    cheek_r:          [0.64, 0.55],
    nose_bridge:      [0.50, 0.40],
    nose_tip:         [0.50, 0.53],
    nostril_l:        [0.46, 0.55],
    nostril_r:        [0.54, 0.55],
    lip_top:          [0.50, 0.62],
    lip_bottom:       [0.50, 0.65],
    mouth_corner_l:   [0.45, 0.63],
    mouth_corner_r:   [0.55, 0.63],
    nasolabial_l:     [0.46, 0.58],
    nasolabial_r:     [0.54, 0.58],
    chin_tip:         [0.50, 0.74],
    chin_left:        [0.46, 0.73],
    chin_right:       [0.54, 0.73],
    jaw_mid_l:        [0.38, 0.70],
    jaw_mid_r:        [0.62, 0.70],
    jaw_angle_l:      [0.28, 0.65],
    jaw_angle_r:      [0.72, 0.65],
    ear_l:            [0.18, 0.49],
    ear_r:            [0.82, 0.49],
    behind_ear_l:     [0.20, 0.58],
    behind_ear_r:     [0.80, 0.58],
    neck_side_l:      [0.30, 0.82],
    neck_side_r:      [0.70, 0.82],
    neck_center:      [0.50, 0.84],
    collarbone_l:     [0.32, 0.93],
    collarbone_r:     [0.68, 0.93],
    collarbone_center:[0.50, 0.93],
    tear_trough_l:    [0.44, 0.40],
    tear_trough_r:    [0.56, 0.40],
    undereye_l:       [0.40, 0.41],
    undereye_r:       [0.60, 0.41],
    crowsfeet_l:      [0.33, 0.38],
    crowsfeet_r:      [0.67, 0.38],
  },
  "woman-b": {
    forehead_top:     [0.50, 0.10],
    forehead_left:    [0.32, 0.18],
    forehead_right:   [0.68, 0.18],
    forehead_center:  [0.50, 0.22],
    brow_inner_l:     [0.44, 0.31],
    brow_mid_l:       [0.41, 0.30],
    brow_outer_l:     [0.37, 0.31],
    brow_inner_r:     [0.56, 0.31],
    brow_mid_r:       [0.59, 0.30],
    brow_outer_r:     [0.63, 0.31],
    eye_inner_l:      [0.45, 0.36],
    eye_outer_l:      [0.37, 0.37],
    eye_center_l:     [0.41, 0.37],
    eye_inner_r:      [0.55, 0.36],
    eye_outer_r:      [0.63, 0.37],
    eye_center_r:     [0.59, 0.37],
    temple_l:         [0.24, 0.35],
    temple_r:         [0.76, 0.35],
    cheekbone_l:      [0.35, 0.48],
    cheekbone_r:      [0.65, 0.48],
    cheek_l:          [0.37, 0.55],
    cheek_r:          [0.63, 0.55],
    nose_bridge:      [0.50, 0.40],
    nose_tip:         [0.50, 0.53],
    nostril_l:        [0.47, 0.55],
    nostril_r:        [0.53, 0.55],
    lip_top:          [0.50, 0.62],
    lip_bottom:       [0.50, 0.65],
    mouth_corner_l:   [0.45, 0.63],
    mouth_corner_r:   [0.55, 0.63],
    nasolabial_l:     [0.46, 0.58],
    nasolabial_r:     [0.54, 0.58],
    chin_tip:         [0.50, 0.75],
    chin_left:        [0.46, 0.74],
    chin_right:       [0.54, 0.74],
    jaw_mid_l:        [0.38, 0.71],
    jaw_mid_r:        [0.62, 0.71],
    jaw_angle_l:      [0.28, 0.66],
    jaw_angle_r:      [0.72, 0.66],
    ear_l:            [0.20, 0.49],
    ear_r:            [0.80, 0.49],
    behind_ear_l:     [0.22, 0.58],
    behind_ear_r:     [0.78, 0.58],
    neck_side_l:      [0.32, 0.82],
    neck_side_r:      [0.68, 0.82],
    neck_center:      [0.50, 0.84],
    collarbone_l:     [0.34, 0.94],
    collarbone_r:     [0.66, 0.94],
    collarbone_center:[0.50, 0.94],
    tear_trough_l:    [0.45, 0.40],
    tear_trough_r:    [0.55, 0.40],
    undereye_l:       [0.41, 0.41],
    undereye_r:       [0.59, 0.41],
    crowsfeet_l:      [0.34, 0.38],
    crowsfeet_r:      [0.66, 0.38],
  },
};

// Helper: a landmark reference can be a string ("temple_l"), a tuple
// of [string, dx, dy] for offsets, or a literal [x, y] coordinate.
// Resolved at render time inside the React component.
const ref = (name, dx = 0, dy = 0) => [name, dx, dy];

// ──────────── RITUAL CONFIGS ────────────
// Each ritual specifies its assigned woman and an ordered list of
// steps. Each step's `gestures` are rendered as animated SVG over
// the portrait.

export const RITUALS = {
  "gua-sha": {
    woman: "woman-a",
    label: "GUA SHA SCULPT",
    steps: [
      { step: "01 · WARM THE STONE", note: "ONE SLOW EXHALE",
        gestures: [{ type: "hold", center: "collarbone_center", radius: 0.035 }] },
      { step: "02 · DRAIN THE NECK", note: "× 5 EACH SIDE · 15°",
        gestures: [
          { type: "arrow", points: ["behind_ear_l", "neck_side_l", "collarbone_l"] },
          { type: "arrow", points: ["behind_ear_r", "neck_side_r", "collarbone_r"], delay: 0.6 },
        ] },
      { step: "03 · SCRAPE THE JAW", note: "× 5 EACH SIDE",
        gestures: [
          { type: "arrow", points: ["chin_tip", "jaw_mid_l", "jaw_angle_l", "behind_ear_l"] },
          { type: "arrow", points: ["chin_tip", "jaw_mid_r", "jaw_angle_r", "behind_ear_r"], delay: 0.6 },
        ] },
      // FIX: marionette arrow now ends at temple (top of ear region) per red mark
      { step: "04 · LIFT THE MARIONETTE", note: "× 5 EACH SIDE",
        gestures: [
          { type: "arrow", points: ["mouth_corner_l", ref("cheek_l", -0.01, -0.04), ref("cheekbone_l", -0.01, -0.04), "temple_l"] },
          { type: "arrow", points: ["mouth_corner_r", ref("cheek_r", 0.01, -0.04), ref("cheekbone_r", 0.01, -0.04), "temple_r"], delay: 0.6 },
        ] },
      // FIX: undersweep — cleaner under-cheekbone path on both sides
      { step: "05 · UNDERSWEEP THE CHEEKBONE", note: "× 5 EACH SIDE",
        gestures: [
          { type: "arrow", points: [ref("cheekbone_l", 0.06, 0.02), ref("cheekbone_l", 0.02, 0.0), ref("cheekbone_l", -0.02, -0.02), "temple_l"] },
          { type: "arrow", points: [ref("cheekbone_r", -0.06, 0.02), ref("cheekbone_r", -0.02, 0.0), ref("cheekbone_r", 0.02, -0.02), "temple_r"], delay: 0.6 },
        ] },
      { step: "06 · DISSOLVE THE NASOLABIAL", note: "× 5 EACH SIDE",
        gestures: [
          { type: "arrow", points: ["nasolabial_l", ref("cheekbone_l", 0.02, -0.02), "temple_l"] },
          { type: "arrow", points: ["nasolabial_r", ref("cheekbone_r", -0.02, -0.02), "temple_r"], delay: 0.6 },
        ] },
      // FIX: brow holds — sit ON the brow line per red mark
      { step: "07 · LIFT THE BROW BONE", note: "HOLD 3S EACH",
        gestures: [
          { type: "hold", center: "brow_inner_l", radius: 0.028, delay: 0.0 },
          { type: "hold", center: "brow_mid_l",   radius: 0.028, delay: 0.2 },
          { type: "hold", center: "brow_outer_l", radius: 0.028, delay: 0.4 },
          { type: "hold", center: "brow_inner_r", radius: 0.028, delay: 0.0 },
          { type: "hold", center: "brow_mid_r",   radius: 0.028, delay: 0.2 },
          { type: "hold", center: "brow_outer_r", radius: 0.028, delay: 0.4 },
        ] },
      { step: "08 · FINISH AT THE FOREHEAD", note: "× 3 SWEEPS",
        gestures: [
          { type: "arrow", points: [ref("forehead_center", 0, 0.06), "forehead_center", "forehead_top"] },
          { type: "arrow", points: [ref("brow_outer_l", -0.02, 0.0), ref("forehead_left", 0, 0.02), "forehead_left"], delay: 0.4 },
          { type: "arrow", points: [ref("brow_outer_r", 0.02, 0.0), ref("forehead_right", 0, 0.02), "forehead_right"], delay: 0.6 },
        ] },
    ],
  },

  "lymphatic": {
    woman: "woman-b",
    label: "LYMPHATIC DRAINAGE",
    steps: [
      // FIX: terminus — animated wavy pump motion between two collarbones
      { step: "01 · OPEN THE TERMINUS", note: "PUMP × 10",
        gestures: [
          { type: "hold", center: "collarbone_l", radius: 0.038, delay: 0.0 },
          { type: "hold", center: "collarbone_r", radius: 0.038, delay: 0.3 },
          { type: "wave", from: "collarbone_l", to: "collarbone_r" },
        ] },
      // Parotid — rotating pulse circles
      { step: "02 · PULSE THE PAROTID", note: "× 8 CIRCLES",
        gestures: [
          { type: "circle", center: ref("ear_l", 0.04, -0.02), radius: 0.038 },
          { type: "circle", center: ref("ear_r", -0.04, -0.02), radius: 0.038, delay: 0.4 },
        ] },
      // Submandibular pump — sequential wave of pumps along the jaw
      { step: "03 · UNDER THE JAW", note: "PUMP × 10",
        gestures: [
          { type: "hold", center: "jaw_mid_l", radius: 0.025, delay: 0.0 },
          { type: "hold", center: ref("jaw_mid_l", 0.04, 0.01), radius: 0.025, delay: 0.15 },
          { type: "hold", center: ref("chin_left", -0.03, 0.02), radius: 0.025, delay: 0.30 },
          { type: "hold", center: ref("chin_right", 0.03, 0.02), radius: 0.025, delay: 0.45 },
          { type: "hold", center: ref("jaw_mid_r", -0.04, 0.01), radius: 0.025, delay: 0.60 },
          { type: "hold", center: "jaw_mid_r", radius: 0.025, delay: 0.75 },
        ] },
      { step: "04 · LIFT THE CHEEK", note: "× 8 EACH SIDE",
        gestures: [
          { type: "arrow", points: [ref("nostril_l", -0.02, 0.02), "cheek_l", ref("ear_l", 0.04, -0.02)] },
          { type: "arrow", points: [ref("nostril_r", 0.02, 0.02), "cheek_r", ref("ear_r", -0.04, -0.02)], delay: 0.5 },
        ] },
      { step: "05 · RING-FINGER EYE CIRCLES", note: "× 3 EACH EYE",
        gestures: [
          { type: "circle", center: "eye_center_l", radius: 0.075 },
          { type: "circle", center: "eye_center_r", radius: 0.075, delay: 0.4 },
        ] },
      { step: "06 · CASCADE THE FOREHEAD", note: "× 10 PASSES",
        gestures: [
          { type: "arrow", points: ["forehead_center", ref("forehead_left", 0.02, 0.0), "temple_l"] },
          { type: "arrow", points: ["forehead_center", ref("forehead_right", -0.02, 0.0), "temple_r"], delay: 0.5 },
        ] },
      { step: "07 · DRAIN BEHIND THE EAR", note: "× 3 EACH SIDE",
        gestures: [
          { type: "arrow", points: ["temple_l", "ear_l", "behind_ear_l", "neck_side_l"] },
          { type: "arrow", points: ["temple_r", "ear_r", "behind_ear_r", "neck_side_r"], delay: 0.5 },
        ] },
      { step: "08 · CLOSE THE TERMINUS", note: "PUMP × 10",
        gestures: [
          { type: "hold", center: "collarbone_l", radius: 0.038, delay: 0.0 },
          { type: "hold", center: "collarbone_r", radius: 0.038, delay: 0.3 },
          { type: "wave", from: "collarbone_l", to: "collarbone_r" },
        ] },
    ],
  },

  "face-lift": {
    woman: "woman-a",
    label: "FACE LIFT",
    steps: [
      { step: "01 · SETTLE THE BREATH", note: "× 3 EXHALES",
        gestures: [{ type: "hold", center: "collarbone_center", radius: 0.040 }] },
      { step: "02 · FOREHEAD RESISTANCE", note: "HOLD 10S × 5",
        gestures: [
          { type: "point", center: "brow_mid_l", radius: 0.018 },
          { type: "point", center: ref("forehead_center", 0, 0.05), radius: 0.018, delay: 0.15 },
          { type: "point", center: "brow_mid_r", radius: 0.018, delay: 0.30 },
          { type: "arrow", points: [ref("forehead_center", 0, 0.08), ref("forehead_top", 0, 0.02)], delay: 0.6 },
        ] },
      { step: "03 · WIDE-EYE FLASH", note: "HOLD 5S × 3",
        gestures: [
          { type: "point", center: "temple_l", radius: 0.022 },
          { type: "point", center: "temple_r", radius: 0.022, delay: 0.15 },
          { type: "circle", center: "eye_center_l", radius: 0.055, delay: 0.3 },
          { type: "circle", center: "eye_center_r", radius: 0.055, delay: 0.45 },
        ] },
      // FIX: cheekbone lift arrows continue UPWARD to temple per red mark
      { step: "04 · CHEEKBONE LIFT", note: "HOLD 8S × 8",
        gestures: [
          { type: "point", center: "cheekbone_l", radius: 0.018 },
          { type: "point", center: "cheekbone_r", radius: 0.018, delay: 0.15 },
          { type: "arrow", points: ["mouth_corner_l", ref("cheekbone_l", 0.02, 0.02), "cheekbone_l", "temple_l"], delay: 0.4 },
          { type: "arrow", points: ["mouth_corner_r", ref("cheekbone_r", -0.02, 0.02), "cheekbone_r", "temple_r"], delay: 0.6 },
        ] },
      { step: "05 · THE SLOW O", note: "HOLD 10S × 5",
        gestures: [{ type: "circle", center: ref("lip_top", 0, 0.015), radius: 0.045 }] },
      { step: "06 · SMILE AGAINST RESISTANCE", note: "HOLD 8S × 6",
        gestures: [
          { type: "point", center: "mouth_corner_l", radius: 0.018 },
          { type: "point", center: "mouth_corner_r", radius: 0.018, delay: 0.15 },
          { type: "arrow", points: ["mouth_corner_l", ref("mouth_corner_l", -0.06, 0)], delay: 0.4 },
          { type: "arrow", points: ["mouth_corner_r", ref("mouth_corner_r", 0.06, 0)], delay: 0.6 },
        ] },
      { step: "07 · PLATYSMA ENGAGE", note: "HOLD 10S × 5",
        gestures: [{ type: "arrow", points: ["lip_bottom", ref("chin_tip", 0, 0.02), ref("neck_center", 0, -0.04)] }] },
      { step: "08 · CUP AND RELEASE", note: "HOLD 10S",
        gestures: [{ type: "circle", center: ref("nose_tip", 0, -0.06), radius: 0.32 }] },
    ],
  },

  "buccal": {
    woman: "woman-b",
    label: "BUCCAL RELEASE",
    steps: [
      { step: "01 · CLEANSE THE THRESHOLD", note: "WASH HANDS FIRST",
        gestures: [{ type: "hold", center: "lip_top", radius: 0.045 }] },
      { step: "02 · WARM THE MASSETER", note: "× 20S CIRCLES",
        gestures: [
          { type: "circle", center: ref("ear_l", 0.04, 0.05), radius: 0.04 },
          { type: "circle", center: ref("ear_r", -0.04, 0.05), radius: 0.04, delay: 0.4 },
        ] },
      { step: "03 · MILK THE MASSETER", note: "× 5 EACH SIDE",
        gestures: [
          { type: "arrow", points: [ref("cheek_l", -0.02, -0.04), ref("cheek_l", -0.02, 0.04), ref("jaw_mid_l", 0.02, 0.0)] },
          { type: "arrow", points: [ref("cheek_r", 0.02, -0.04), ref("cheek_r", 0.02, 0.04), ref("jaw_mid_r", -0.02, 0.0)], delay: 0.5 },
        ] },
      { step: "04 · CIRCLE THE CHEEK PILLOW", note: "× 5 EACH SIDE",
        gestures: [
          { type: "circle", center: "cheek_l", radius: 0.05 },
          { type: "circle", center: "cheek_r", radius: 0.05, delay: 0.4 },
        ] },
      { step: "05 · PINCH FROM BOTH SIDES", note: "× 3 EACH SIDE",
        gestures: [
          { type: "arrow", points: ["mouth_corner_l", ref("cheek_l", 0.0, -0.02), ref("ear_l", 0.04, 0.0)] },
          { type: "arrow", points: ["mouth_corner_r", ref("cheek_r", 0.0, -0.02), ref("ear_r", -0.04, 0.0)], delay: 0.5 },
        ] },
      { step: "06 · SWEEP THE UPPER BUCCAL", note: "× 3 PASSES",
        gestures: [
          { type: "arrow", points: [ref("mouth_corner_l", -0.02, -0.03), ref("lip_top", 0, -0.03), ref("mouth_corner_r", 0.02, -0.03)] },
        ] },
      { step: "07 · RETURN TO THE SURFACE", note: "WASH HANDS AGAIN",
        gestures: [{ type: "circle", center: ref("nose_tip", 0, -0.04), radius: 0.30 }] },
    ],
  },

  "pre-event": {
    woman: "woman-a",
    label: "PRE-EVENT GLOW",
    steps: [
      { step: "01 · COLD PREP ON EYES", note: "HOLD 30S",
        gestures: [
          { type: "hold", center: "eye_center_l", radius: 0.05 },
          { type: "hold", center: "eye_center_r", radius: 0.05, delay: 0.2 },
        ] },
      { step: "02 · SPEED DRAINAGE", note: "× 8 FAST EACH SIDE",
        gestures: [
          { type: "arrow", points: ["behind_ear_l", "neck_side_l", "collarbone_l"], width: 14 },
          { type: "arrow", points: ["behind_ear_r", "neck_side_r", "collarbone_r"], width: 14, delay: 0.3 },
        ] },
      { step: "03 · PERCUSSION TAPPING", note: "45 SECONDS",
        gestures: [
          { type: "point", center: "forehead_center", radius: 0.012 },
          { type: "point", center: "forehead_left", radius: 0.012, delay: 0.1 },
          { type: "point", center: "forehead_right", radius: 0.012, delay: 0.2 },
          { type: "point", center: "cheekbone_l", radius: 0.012, delay: 0.3 },
          { type: "point", center: "cheekbone_r", radius: 0.012, delay: 0.4 },
          { type: "point", center: "cheek_l", radius: 0.012, delay: 0.5 },
          { type: "point", center: "cheek_r", radius: 0.012, delay: 0.6 },
          { type: "point", center: "jaw_mid_l", radius: 0.012, delay: 0.7 },
          { type: "point", center: "jaw_mid_r", radius: 0.012, delay: 0.8 },
          { type: "point", center: "chin_tip", radius: 0.012, delay: 0.9 },
        ] },
      { step: "04 · SNAP-LIFT THE CHEEKBONE", note: "× 8 FAST EACH",
        gestures: [
          { type: "arrow", points: [ref("cheek_l", 0.02, 0.02), "cheekbone_l", "temple_l"] },
          { type: "arrow", points: [ref("cheek_r", -0.02, 0.02), "cheekbone_r", "temple_r"], delay: 0.4 },
        ] },
      { step: "05 · BROW FLICKS", note: "× 10 EACH SIDE",
        gestures: [
          { type: "arrow", points: [ref("brow_outer_l", 0, 0.03), "brow_outer_l"], delay: 0.0 },
          { type: "arrow", points: [ref("brow_mid_l", 0, 0.03), "brow_mid_l"], delay: 0.1 },
          { type: "arrow", points: [ref("brow_inner_l", 0, 0.03), "brow_inner_l"], delay: 0.2 },
          { type: "arrow", points: [ref("brow_inner_r", 0, 0.03), "brow_inner_r"], delay: 0.3 },
          { type: "arrow", points: [ref("brow_mid_r", 0, 0.03), "brow_mid_r"], delay: 0.4 },
          { type: "arrow", points: [ref("brow_outer_r", 0, 0.03), "brow_outer_r"], delay: 0.5 },
        ] },
      { step: "06 · COLD SEAL", note: "HOLD 10S",
        gestures: [{ type: "circle", center: ref("nose_tip", 0, -0.06), radius: 0.30 }] },
    ],
  },

  "eye-revival": {
    woman: "woman-b",
    label: "EYE REVIVAL",
    steps: [
      { step: "01 · COLD COMPRESS", note: "HOLD 30S",
        gestures: [
          { type: "hold", center: "eye_center_l", radius: 0.05 },
          { type: "hold", center: "eye_center_r", radius: 0.05, delay: 0.2 },
        ] },
      { step: "02 · TEAR TROUGH PRESS", note: "HOLD 5S × 3",
        gestures: [
          { type: "hold", center: "tear_trough_l", radius: 0.025 },
          { type: "hold", center: "tear_trough_r", radius: 0.025, delay: 0.2 },
        ] },
      { step: "03 · INNER TO OUTER", note: "× 5 EACH SIDE",
        gestures: [
          { type: "arrow", points: ["tear_trough_l", "undereye_l", ref("crowsfeet_l", 0, 0.02), ref("crowsfeet_l", -0.04, 0.03)] },
          { type: "arrow", points: ["tear_trough_r", "undereye_r", ref("crowsfeet_r", 0, 0.02), ref("crowsfeet_r", 0.04, 0.03)], delay: 0.5 },
        ] },
      { step: "04 · BROW BONE TRIO", note: "HOLD 5S EACH",
        gestures: [
          { type: "hold", center: "brow_inner_l", radius: 0.025, delay: 0.0 },
          { type: "hold", center: "brow_mid_l",   radius: 0.025, delay: 0.2 },
          { type: "hold", center: "brow_outer_l", radius: 0.025, delay: 0.4 },
          { type: "hold", center: "brow_inner_r", radius: 0.025, delay: 0.0 },
          { type: "hold", center: "brow_mid_r",   radius: 0.025, delay: 0.2 },
          { type: "hold", center: "brow_outer_r", radius: 0.025, delay: 0.4 },
        ] },
      { step: "05 · CROWS-FEET ANCHOR", note: "× 10 CIRCLES",
        gestures: [
          { type: "point", center: "temple_l", radius: 0.022 },
          { type: "point", center: "temple_r", radius: 0.022, delay: 0.15 },
          { type: "circle", center: "crowsfeet_l", radius: 0.028, delay: 0.3 },
          { type: "circle", center: "crowsfeet_r", radius: 0.028, delay: 0.45 },
        ] },
      { step: "06 · UPPER LID GLIDE", note: "× 3 EACH SIDE",
        gestures: [
          { type: "arrow", points: [ref("eye_outer_l", 0, -0.01), ref("eye_center_l", 0, -0.01), ref("eye_inner_l", 0, -0.01)] },
          { type: "arrow", points: [ref("eye_outer_r", 0, -0.01), ref("eye_center_r", 0, -0.01), ref("eye_inner_r", 0, -0.01)], delay: 0.5 },
        ] },
      { step: "07 · DRAIN TO THE EAR", note: "× 3 EACH SIDE",
        gestures: [
          { type: "arrow", points: ["crowsfeet_l", "ear_l", "jaw_angle_l"] },
          { type: "arrow", points: ["crowsfeet_r", "ear_r", "jaw_angle_r"], delay: 0.5 },
        ] },
    ],
  },
};

// Resolve a landmark reference to [x, y] in normalized coords.
export function resolveLandmark(ref_, landmarks) {
  if (typeof ref_ === "string") return landmarks[ref_];
  if (Array.isArray(ref_) && typeof ref_[0] === "string") {
    const [name, dx = 0, dy = 0] = ref_;
    const base = landmarks[name];
    if (!base) return [0.5, 0.5];
    return [base[0] + dx, base[1] + dy];
  }
  return ref_;
}
