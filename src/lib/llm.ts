import { GoogleGenerativeAI } from "@google/generative-ai";
import { FinancialMetrics } from "./calculations";

// API Keys from environment
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Default Model Choices
const GROQ_MODEL = "llama-3.3-70b-versatile";
const MISTRAL_MODEL = "mistral-large-latest";
const GEMINI_MODEL = "gemini-2.0-flash";

// Timeout for HTTP requests in milliseconds
const REQUEST_TIMEOUT_MS = 8000;

export interface AdaptiveQuestions {
  practicalQuestion: string;
  psychologicalQuestion: string;
  wildcardQuestion: string;
}

export interface TransitionPlanResponse {
  plan: {
    immediate: string[];
    shortTerm: string[];
    midTerm: string[];
    safetyNet: string;
    skillBuilding: string[];
    incomeBridges: string[];
  };
  journey: {
    obstacles: Array<{
      obstacle: string;
      mitigation: string;
    }>;
    emotionalPhases: Array<{
      phaseName: string;
      duration: string;
      description: string;
      tips: string;
    }>;
    timelineRealityCheck: {
      assessment: string;
      rating: "realistic" | "optimistic" | "high_risk";
      advice: string;
    };
  };
}

/**
 * Helper: Perform a fetch request with timeout support
 */
async function fetchWithTimeout(url: string, options: RequestInit, timeout: number): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(id);
  }
}

/**
 * Orchestrator: Try Groq -> Mistral -> Gemini failover pipeline
 */
async function executeFailoverLLM(
  systemInstruction: string,
  userPrompt: string
): Promise<string> {
  const providers = [
    {
      name: "Groq",
      key: GROQ_API_KEY,
      fn: async () => {
        console.log(`[LLM Router] Routing request to Groq (${GROQ_MODEL})...`);
        const res = await fetchWithTimeout(
          "https://api.groq.com/openai/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${GROQ_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: GROQ_MODEL,
              messages: [
                { role: "system", content: systemInstruction },
                { role: "user", content: userPrompt },
              ],
              response_format: { type: "json_object" },
              temperature: 0.2,
            }),
          },
          REQUEST_TIMEOUT_MS
        );
        if (!res.ok) {
          throw new Error(`Groq returned HTTP ${res.status}: ${await res.text()}`);
        }
        const data = await res.json();
        return data.choices[0].message.content;
      },
    },
    {
      name: "Mistral",
      key: MISTRAL_API_KEY,
      fn: async () => {
        console.log(`[LLM Router] Routing request to Mistral (${MISTRAL_MODEL})...`);
        const res = await fetchWithTimeout(
          "https://api.mistral.ai/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${MISTRAL_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: MISTRAL_MODEL,
              messages: [
                { role: "system", content: systemInstruction },
                { role: "user", content: userPrompt },
              ],
              response_format: { type: "json_object" },
              temperature: 0.2,
            }),
          },
          REQUEST_TIMEOUT_MS
        );
        if (!res.ok) {
          throw new Error(`Mistral returned HTTP ${res.status}: ${await res.text()}`);
        }
        const data = await res.json();
        return data.choices[0].message.content;
      },
    },
    {
      name: "Gemini",
      key: GEMINI_API_KEY,
      fn: async () => {
        console.log(`[LLM Router] Routing request to Gemini (${GEMINI_MODEL})...`);
        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY as string);
        const model = genAI.getGenerativeModel({
          model: GEMINI_MODEL,
          systemInstruction,
        });

        // Wrap Gemini execution in a timeout promise
        const runGemini = async () => {
          const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: userPrompt }] }],
            generationConfig: {
              responseMimeType: "application/json",
              temperature: 0.2,
            },
          });
          return result.response.text();
        };

        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Gemini request timed out")), REQUEST_TIMEOUT_MS)
        );

        return await Promise.race([runGemini(), timeoutPromise]);
      },
    },
  ];

  const errors: string[] = [];

  for (const provider of providers) {
    if (!provider.key) {
      console.log(`[LLM Router] Skipping ${provider.name} (API key not configured)`);
      continue;
    }

    try {
      const responseText = await provider.fn();
      console.log(`[LLM Router] Successfully fetched response from ${provider.name}`);
      return responseText;
    } catch (err) {
      const errorObj = err as Error;
      const errMsg = `[LLM Router] Error on ${provider.name}: ${errorObj?.message || String(err)}`;
      console.warn(errMsg);
      errors.push(errMsg);
      // Fallback: Loop to the next provider in list
    }
  }

  throw new Error(`All LLM providers failed or were unconfigured. Errors: ${errors.join(" | ")}`);
}

/**
 * Public API: Generates adaptive questions (Q8, Q9, Q10) based on intake answers Q1-Q7
 */
export async function generateAdaptiveQuestions(userData: {
  name: string;
  currentRole: string;
  timeframe: string;
  targetRole: string;
  location: string;
}): Promise<AdaptiveQuestions> {
  const systemInstruction = `You are a career transition coach specializing in risk assessment and planning for Gen Z professionals.
Your task is to generate 3 customized follow-up questions (Questions 8, 9, and 10 of a 10-question intake interview) based on the user's details.
The questions must cover:
1. Practical Barriers (specific to target career: skill gaps, market entries, saturation)
2. Psychological/Personal Challenges (pressures, doubts, family expectations)
3. Wildcard/Commitment Test (a tough, concrete scenario checking commitment)

Format your response as a JSON object matching this schema:
{
  "practicalQuestion": "question text",
  "psychologicalQuestion": "question text",
  "wildcardQuestion": "question text"
}`;

  const prompt = `User name: ${userData.name}
Current role: ${userData.currentRole}
Location: ${userData.location}
Pivot timeline: ${userData.timeframe}
Target career pivot: ${userData.targetRole}

Generate the three tailored, engaging, and direct questions. Keep the tone supportive but sharp and conversational. No corporate fluff.`;

  try {
    const rawResponse = await executeFailoverLLM(systemInstruction, prompt);
    return JSON.parse(rawResponse) as AdaptiveQuestions;
  } catch (error) {
    console.error("[LLM API] Fallback to mock adaptive questions due to total provider failure:", error);
    // Graceful fallback to maintain application usability
    return {
      practicalQuestion: `Transitioning to ${userData.targetRole} usually requires specific hands-on experience. What projects or portfolios do you have, and how will you close the skill gap in ${userData.timeframe}?`,
      psychologicalQuestion: `Stepping away from a role as a ${userData.currentRole} can be stressful. How do you plan to handle the loss of status or stability, and what support systems do you have in ${userData.location}?`,
      wildcardQuestion: `If you were offered a promotion in your current ${userData.currentRole} role with a 30% raise, but it delayed your transition to ${userData.targetRole} by a year, what would you do?`,
    };
  }
}

/**
 * Public API: Generates the full transition plan and journey map after all 10 questions are answered.
 */
export async function generateTransitionPlanAndJourneyMap(
  userData: {
    name: string;
    currentRole: string;
    annualIncome: string;
    savings: string;
    location: string;
    monthlyExpenses: string;
    timeframe: string;
    targetRole: string;
    answers: {
      q8: { question: string; answer: string };
      q9: { question: string; answer: string };
      q10: { question: string; answer: string };
    };
  },
  financialMetrics: FinancialMetrics
): Promise<TransitionPlanResponse> {
  const systemInstruction = `You are Runway360, a premium career transition coach chatbot for Gen Z.
Your job is to analyze the user's complete 10-question intake interview, location factors, and financial metrics to build:
1. A hyper-personalized Transition Plan (Immediate, Short, Mid term actions, Skill credentials, Safety net advice, Bridge income suggestions).
2. A Realistic Journey Map (Obstacles and concrete mitigations, Emotional phases, Timeline reality check).

Ensure your tone is direct, supportive, and grounded in math. No corporate speak. Address the user by name.

Your response MUST be a JSON object matching this schema exactly:
{
  "plan": {
    "immediate": ["action item 1", "action item 2", ...],
    "shortTerm": ["action item 1", "action item 2", ...],
    "midTerm": ["action item 1", "action item 2", ...],
    "safetyNet": "advice about financial readiness and runway target",
    "skillBuilding": ["credential or skill step 1", "credential or skill step 2", ...],
    "incomeBridges": ["bridge option 1", "bridge option 2", ...]
  },
  "journey": {
    "obstacles": [
      { "obstacle": "obstacle description", "mitigation": "how to mitigate" }
    ],
    "emotionalPhases": [
      { "phaseName": "phase name", "duration": "expected duration", "description": "what they will experience", "tips": "coaching advice" }
    ],
    "timelineRealityCheck": {
      "assessment": "objective analysis of feasibility",
      "rating": "realistic" | "optimistic" | "high_risk",
      "advice": "concrete final advice to de-risk the pivot"
    }
  }
}`;

  const prompt = `### User Profile & Responses:
Name: ${userData.name}
Current Role: ${userData.currentRole}
Annual Income: ${userData.annualIncome}
Savings: ${userData.savings}
Location: ${userData.location}
Monthly Expenses: ${userData.monthlyExpenses}
Transition Timeframe: ${userData.timeframe}
Target Career Goal: ${userData.targetRole}

### Adaptive Question Answers:
Q8: [${userData.answers.q8.question}]
A8: ${userData.answers.q8.answer}

Q9: [${userData.answers.q9.question}]
A9: ${userData.answers.q9.answer}

Q10: [${userData.answers.q10.question}]
A10: ${userData.answers.q10.answer}

### Calculated Financial Metrics:
- Calculated Runway: ${financialMetrics.runwayMonths} months
- Required Buffer (6 months): $${financialMetrics.requiredBuffer}
- Financial Shortfall: $${financialMetrics.shortfallAmount}
- Runway Deficit against Target Timeline: ${financialMetrics.runwayDeficitMonths} months
- Risk Level: ${financialMetrics.riskLevel} (Safety Net Status: ${financialMetrics.safetyNetStatus})
- Custom Formula Used: ${financialMetrics.isCustomFormulaUsed ? "Yes (due to skipped financials)" : "No"}

Synthesize this data and output the JSON response containing the Personalized Transition Plan and Realistic Journey Map.`;

  try {
    const rawResponse = await executeFailoverLLM(systemInstruction, prompt);
    return JSON.parse(rawResponse) as TransitionPlanResponse;
  } catch (error) {
    console.error("[LLM API] Fallback to mock plan response due to total provider failure:", error);
    // Graceful fallback to maintain app functionality
    return {
      plan: {
        immediate: [
          "Audit the core skills needed for " + userData.targetRole + " (compare job postings).",
          "Set up a dedicated learning schedule of at least 10 hours per week.",
          "Identify and join 3 local or online professional communities related to the new field."
        ],
        shortTerm: [
          "Complete an introductory certification or build a first mini-project.",
          "Optimize LinkedIn profile and draft a transition narrative resume.",
          financialMetrics.runwayDeficitMonths > 0 
            ? "Research and source a freelance/part-time gig to cover the monthly expense deficit."
            : "Start saving a dedicated 'Pivot Fund' from remaining income."
        ],
        midTerm: [
          "Apply for bridge roles or entry-level contracts to gain practical exposure.",
          "Build a portfolio showcasing 3 high-quality transition projects.",
          "Target full-time job search in the final 2 months of the " + userData.timeframe + " timeframe."
        ],
        safetyNet: `Based on your expenses of $${financialMetrics.monthlyExpenses}/mo and savings of $${financialMetrics.savings}, you have a runway of ${financialMetrics.runwayMonths} months. We recommend a minimum of 6 months ($${financialMetrics.requiredBuffer}). You are ${financialMetrics.runwayDeficitMonths > 0 ? "underfunded" : "adequately funded"} for your ${userData.timeframe} pivot timeline.`,
        skillBuilding: [
          "Learn industry-standard tools for " + userData.targetRole + ".",
          "Seek a mentor active in the field."
        ],
        incomeBridges: [
          "Look into consulting in your current field (" + userData.currentRole + ") on a part-time basis.",
          "Leverage freelance platforms for quick-turnaround projects."
        ]
      },
      journey: {
        obstacles: [
          {
            obstacle: "Competing with candidates who have formal degrees in " + userData.targetRole,
            mitigation: "Highlight your unique transferable skills from " + userData.currentRole + " and showcase a portfolio of practical work."
          },
          {
            obstacle: "Running out of savings before securing a new role",
            mitigation: "Establish a part-time bridge income streams early in the transition phase."
          }
        ],
        emotionalPhases: [
          {
            phaseName: "Honeymoon Phase",
            duration: "Weeks 1-4",
            description: "Excitement and high energy about quitting and starting the new path.",
            tips: "Document your 'why' to look back on when the self-doubt kicks in."
          },
          {
            phaseName: "Self-Doubt Dip",
            duration: "Months 2-3",
            description: "Feeling overwhelmed by the skill gap and facing initial rejections.",
            tips: "Focus on daily micro-wins and progress tracking rather than end outcomes."
          }
        ],
        timelineRealityCheck: {
          assessment: `A transition timeline of ${userData.timeframe} is ${financialMetrics.riskLevel === "high" ? "extremely tight given your current runway" : "reasonable, but requires execution of safety measures"}.`,
          rating: financialMetrics.riskLevel === "high" ? "high_risk" : financialMetrics.runwayMonths >= 6 ? "realistic" : "optimistic",
          advice: financialMetrics.riskLevel === "high" 
            ? "We strongly advise postponing your quit date until you save at least " + financialMetrics.requiredBuffer + " or establish a guaranteed bridge income."
            : "Monitor your expenses closely and execute on the timeline aggressively."
        }
      }
    };
  }
}
