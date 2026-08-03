/**
 * Utility functions for parsed financial runway and risk calculations.
 * Used by Runway360 backend to analyze intake questionnaire responses.
 */

/**
 * Extracts numeric values from strings containing ranges, currencies, and suffixes (k/m).
 * Conservatively returns the average of a range, or the lower bound if specified.
 */
export function parseFinancialValue(val: string | null | undefined, fallback: number): number {
  if (!val) return fallback;

  // Clean the string (remove spaces, commas, dollar signs)
  const clean = val.toLowerCase().replace(/[\s$,]/g, "");

  // If the user refused/skipped
  if (clean.includes("secret") || clean.includes("skip") || clean.includes("none") || clean === "") {
    return fallback;
  }

  // Check if it's a range (e.g. "50k-70k", "2000-3000")
  const rangeParts = clean.split("-");
  if (rangeParts.length === 2) {
    const minVal = parseSingleNumber(rangeParts[0], fallback);
    const maxVal = parseSingleNumber(rangeParts[1], fallback);
    return Math.round((minVal + maxVal) / 2); // Return average of the range
  }

  return parseSingleNumber(clean, fallback);
}

/**
 * Helper to parse a single number string with optional k/m suffixes.
 */
function parseSingleNumber(str: string, fallback: number): number {
  // Match any digits with optional decimal point and suffixes (k, m)
  const match = str.match(/^([\d.]+)(k|m)?/);
  if (!match) {
    // If no numbers are matched, check if there are any digits at all
    const digitMatch = str.match(/[\d.]+/);
    if (digitMatch) {
      return parseFloat(digitMatch[0]);
    }
    return fallback;
  }

  let value = parseFloat(match[1]);
  const suffix = match[2];

  if (suffix === "k") {
    value *= 1000;
  } else if (suffix === "m") {
    value *= 1000000;
  }

  return value;
}

/**
 * Extracts the number of months from a timeline string (e.g., "6 months", "1 year", "2 years").
 */
export function parseTimelineToMonths(timeline: string | null | undefined, fallback: number = 6): number {
  if (!timeline) return fallback;

  const clean = timeline.toLowerCase().trim();
  const digitMatch = clean.match(/([\d.]+)/);
  if (!digitMatch) return fallback;

  const num = parseFloat(digitMatch[0]);

  if (clean.includes("year") || clean.includes("yr")) {
    return num * 12;
  }
  
  if (clean.includes("month") || clean.includes("mo")) {
    return num;
  }

  if (clean.includes("week") || clean.includes("wk")) {
    return Math.round(num / 4.33); // approx weeks to months
  }

  return num; // assume months as default if just a number
}

export interface FinancialMetrics {
  savings: number;
  annualIncome: number;
  monthlyExpenses: number;
  targetTimelineMonths: number;
  runwayMonths: number;
  runwayDeficitMonths: number;
  riskLevel: "low" | "medium" | "high";
  safetyNetStatus: "safe" | "moderate" | "underfunded";
  requiredBuffer: number;
  shortfallAmount: number;
  isCustomFormulaUsed: boolean;
}

/**
 * Calculates the primary financial transition metrics and runway status.
 */
export function calculateFinancialMetrics(
  savingsInput: string | null | undefined,
  incomeInput: string | null | undefined,
  expensesInput: string | null | undefined,
  timelineInput: string | null | undefined
): FinancialMetrics {
  // Check if custom formula baseline is used (i.e. user skipped financial details)
  const skippedExpenses = !expensesInput || expensesInput.toLowerCase().includes("skip") || expensesInput.toLowerCase().includes("secret");
  const skippedSavings = !savingsInput || savingsInput.toLowerCase().includes("skip") || savingsInput.toLowerCase().includes("secret");

  // Fallbacks: Expenses default to $2,500/mo, Savings to $0, Income to $0
  const savings = parseFinancialValue(savingsInput, 0);
  const annualIncome = parseFinancialValue(incomeInput, 0);
  const monthlyExpenses = parseFinancialValue(expensesInput, 2500);
  const targetTimelineMonths = parseTimelineToMonths(timelineInput, 6);

  // Math runway in months
  const runwayMonths = monthlyExpenses > 0 ? parseFloat((savings / monthlyExpenses).toFixed(1)) : 999;

  // Calculate buffer/shortfall
  const lowRiskRunwayThreshold = 6; // Standard safe zone: 6 months expenses
  const requiredBuffer = monthlyExpenses * lowRiskRunwayThreshold;
  const shortfallAmount = Math.max(0, requiredBuffer - savings);
  const runwayDeficitMonths = Math.max(0, targetTimelineMonths - runwayMonths);

  // Safety net and risk categorization
  let safetyNetStatus: "safe" | "moderate" | "underfunded" = "underfunded";
  let riskLevel: "low" | "medium" | "high" = "high";

  if (runwayMonths >= 6) {
    safetyNetStatus = "safe";
    riskLevel = "low";
  } else if (runwayMonths >= 3) {
    safetyNetStatus = "moderate";
    riskLevel = "medium";
  } else {
    safetyNetStatus = "underfunded";
    riskLevel = "high";
  }

  return {
    savings,
    annualIncome,
    monthlyExpenses,
    targetTimelineMonths,
    runwayMonths,
    runwayDeficitMonths,
    riskLevel,
    safetyNetStatus,
    requiredBuffer,
    shortfallAmount,
    isCustomFormulaUsed: skippedExpenses || skippedSavings,
  };
}
