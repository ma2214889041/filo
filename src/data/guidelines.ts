export interface DrugGuideline {
  drugId: string;
  drugName: string;
  minEffectiveDuration: string;
  commonSideEffects: string[];
  allergyRedFlags: string[];
  whenToEscalate: string[];
  importantNotes: string[];
}

export const GUIDELINES: DrugGuideline[] = [
  {
    drugId: "amoxicillin",
    drugName: "Amoxicillin",
    minEffectiveDuration: "10 days (do not stop early even if symptoms improve)",
    commonSideEffects: [
      "Diarrhea",
      "Nausea",
      "Skin rash (non-allergic, maculopapular)",
      "Vomiting",
    ],
    allergyRedFlags: [
      "Urticaria (hives) or widespread rash appearing within hours",
      "Facial or throat swelling (angioedema)",
      "Difficulty breathing or wheezing",
      "Anaphylaxis symptoms (dizziness, rapid heartbeat, loss of consciousness)",
    ],
    whenToEscalate: [
      "Any rash appearing during treatment — may indicate allergy",
      "Symptoms worsening after 48–72 hours of treatment",
      "High fever (>39.5°C) persisting beyond 48 hours",
      "Difficulty swallowing or breathing",
      "Signs of peritonsillar abscess (unilateral swelling, trismus)",
    ],
    importantNotes: [
      "Complete the full 10-day course even if feeling better",
      "Take with or without food",
      "If a dose is missed, take it as soon as remembered unless close to next dose",
    ],
  },
  {
    drugId: "penicillin-v",
    drugName: "Penicillin V",
    minEffectiveDuration: "10 days (do not stop early even if symptoms improve)",
    commonSideEffects: [
      "Nausea",
      "Diarrhea",
      "Oral candidiasis (thrush)",
      "Mild skin rash",
    ],
    allergyRedFlags: [
      "Urticaria (hives) or widespread rash",
      "Facial or throat swelling",
      "Difficulty breathing",
      "Anaphylaxis symptoms",
    ],
    whenToEscalate: [
      "Any rash during treatment",
      "No improvement after 48–72 hours",
      "Worsening symptoms or high persistent fever",
      "Difficulty swallowing or breathing",
    ],
    importantNotes: [
      "Complete the full 10-day course",
      "Take on an empty stomach (1 hour before or 2 hours after meals) for best absorption",
      "Three-times-daily dosing requires good adherence",
    ],
  },
  {
    drugId: "azithromycin",
    drugName: "Azithromycin",
    minEffectiveDuration: "5 days (shortened course, do not stop at day 3)",
    commonSideEffects: [
      "Diarrhea",
      "Nausea and abdominal pain",
      "Headache",
      "Mild skin rash",
    ],
    allergyRedFlags: [
      "Severe skin reaction (Stevens-Johnson syndrome — rare but serious)",
      "Facial swelling",
      "Difficulty breathing",
      "Liver symptoms (jaundice, dark urine)",
    ],
    whenToEscalate: [
      "Any rash during treatment — possible allergic reaction",
      "Symptoms not improving after full course",
      "Cardiac symptoms (palpitations, dizziness) — QT prolongation risk",
      "Signs of liver dysfunction",
    ],
    importantNotes: [
      "Day 1: 500mg, Days 2–5: 250mg",
      "Can be taken with or without food",
      "Long tissue half-life means antibiotic activity continues after last dose",
    ],
  },
];

export function getGuidelineByDrugId(drugId: string): DrugGuideline | undefined {
  return GUIDELINES.find((g) => g.drugId === drugId);
}
