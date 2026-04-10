import type { CentorCriteria } from "./schemas";

export interface McIsaacResult {
  score: number;
  breakdown: {
    tonsillarExudate: number;
    tenderNodes: number;
    fever: number;
    absenceOfCough: number;
    ageModifier: number;
  };
  interpretation: "no antibiotic" | "consider test" | "consider antibiotic";
  interpretationDetail: string;
}

/**
 * 确定性计算 McIsaac 评分（修正版 Centor 评分）
 * 基础 Centor (0-4): 每个阳性标准 +1
 * McIsaac 年龄修正: 3-14 岁 +1, 15-44 岁 0, 45+ 岁 -1
 * 总分范围: -1 到 5（但实际临床意义范围 0-5）
 */
export function calculateMcIsaac(criteria: CentorCriteria): McIsaacResult {
  const tonsillarExudate = criteria.tonsillar_exudate === true ? 1 : 0;
  const tenderNodes = criteria.tender_anterior_cervical_nodes === true ? 1 : 0;
  const fever = criteria.fever_over_38 === true ? 1 : 0;
  const absenceOfCough = criteria.absence_of_cough === true ? 1 : 0;

  let ageModifier = 0;
  if (criteria.age_band === "3-14") ageModifier = 1;
  else if (criteria.age_band === "45+") ageModifier = -1;

  const rawScore = tonsillarExudate + tenderNodes + fever + absenceOfCough + ageModifier;
  const score = Math.max(0, Math.min(5, rawScore));

  let interpretation: McIsaacResult["interpretation"];
  let interpretationDetail: string;

  if (score <= 1) {
    interpretation = "no antibiotic";
    interpretationDetail =
      "Score 0–1: Low probability of GAS pharyngitis (~1–10%). Symptomatic treatment recommended. Antibiotics not indicated.";
  } else if (score <= 3) {
    interpretation = "consider test";
    interpretationDetail =
      "Score 2–3: Moderate probability of GAS pharyngitis (~15–35%). Rapid antigen detection test (RADT) or throat culture recommended before deciding on antibiotic therapy.";
  } else {
    interpretation = "consider antibiotic";
    interpretationDetail =
      "Score 4–5: High probability of GAS pharyngitis (~50–75%). Empirical antibiotic therapy may be considered, or confirm with RADT.";
  }

  return {
    score,
    breakdown: {
      tonsillarExudate,
      tenderNodes,
      fever,
      absenceOfCough,
      ageModifier,
    },
    interpretation,
    interpretationDetail,
  };
}
