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
  /** 确定性管理建议分级 */
  managementBand: "symptomatic_only" | "consider_radt" | "radt_or_empiric";
  /** 面向 GP 的确定性管理指导文本 */
  managementAdvice: string;
  /** GAS 概率范围估计（基于文献数据，确定性映射） */
  gasProbability: string;
}

/**
 * Step A: 确定性计算 McIsaac 评分（修正版 Centor 评分）
 *
 * 基础 Centor (0-4): 每个阳性标准 +1
 * McIsaac 年龄修正: 3-14 岁 +1, 15-44 岁 0, 45+ 岁 -1
 * 总分范围: -1 到 5
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

  // Step B: 确定性管理映射（不使用 LLM）
  const management = getManagementMapping(score);

  return {
    score,
    breakdown: {
      tonsillarExudate,
      tenderNodes,
      fever,
      absenceOfCough,
      ageModifier,
    },
    ...management,
  };
}

/**
 * Step B: 确定性管理映射
 *
 * 基于 IDSA / ESCMID 指南和 McIsaac 评分：
 * - Score ≤1: 不需要检测或抗生素
 * - Score 2-3: 考虑 RADT，不经验性开抗生素
 * - Score 4-5: GAS 高概率，仍建议 RADT 确认
 */
function getManagementMapping(score: number): {
  managementBand: McIsaacResult["managementBand"];
  managementAdvice: string;
  gasProbability: string;
} {
  if (score <= 1) {
    return {
      managementBand: "symptomatic_only",
      managementAdvice:
        "No testing, no antibiotic. Symptomatic treatment only (NSAIDs, fluids, rest).",
      gasProbability: "~1–10% likelihood of GAS",
    };
  }

  if (score <= 3) {
    return {
      managementBand: "consider_radt",
      managementAdvice:
        "Consider rapid antigen detection test (RADT). Do not prescribe antibiotics empirically. If RADT positive, then guideline-matched antibiotic options below.",
      gasProbability: "~15–35% likelihood of GAS",
    };
  }

  // score 4-5
  return {
    managementBand: "radt_or_empiric",
    managementAdvice:
      "High likelihood of GAS (~51–53%). Current IDSA guidance still recommends confirmatory RADT before antibiotic. If RADT unavailable or positive, guideline-matched antibiotic options below.",
    gasProbability: "~51–53% likelihood of GAS",
  };
}
