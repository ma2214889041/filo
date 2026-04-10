export interface Antibiotic {
  id: string;
  name: string;
  dose: string;
  duration: string;
  line: string;
  contraindication: string | null;
  description: string;
}

export const ANTIBIOTICS: Antibiotic[] = [
  {
    id: "amoxicillin",
    name: "Amoxicillin",
    dose: "1g BID",
    duration: "10 days",
    line: "First-line",
    contraindication: "penicillin allergy",
    description:
      "Broad-spectrum penicillin. Standard first-line treatment for Group A Streptococcal pharyngitis per ESCMID/IDSA guidelines.",
  },
  {
    id: "penicillin-v",
    name: "Penicillin V",
    dose: "500mg TID",
    duration: "10 days",
    line: "First-line alternative",
    contraindication: "penicillin allergy",
    description:
      "Narrow-spectrum penicillin. Equally effective as amoxicillin; preferred when narrow spectrum is desired.",
  },
  {
    id: "azithromycin",
    name: "Azithromycin",
    dose: "500mg day 1, then 250mg days 2–5",
    duration: "5 days",
    line: "Penicillin allergy alternative",
    contraindication: null,
    description:
      "Macrolide antibiotic. Reserved for patients with confirmed penicillin allergy. Shorter course may improve adherence.",
  },
];
