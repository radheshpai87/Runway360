import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { calculateFinancialMetrics } from "@/lib/calculations";
import { generateTransitionPlanAndJourneyMap } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { interviewId } = body;

    if (!interviewId) {
      return NextResponse.json({ error: "Missing interviewId." }, { status: 400 });
    }

    // 1. Fetch the interview record
    const { data: interview, error: fetchError } = await supabaseAdmin
      .from("interviews")
      .select("*")
      .eq("id", interviewId)
      .single();

    if (fetchError || !interview) {
      console.error("Error fetching interview for plan generation:", fetchError);
      return NextResponse.json({ error: "Interview session not found." }, { status: 404 });
    }

    // Optional constraint: Ensure interview is completed
    if (interview.status !== "completed") {
      return NextResponse.json(
        { error: "Interview has not been completed. Please answer all questions first." },
        { status: 400 }
      );
    }

    // 2. Perform the mathematical calculations
    const financialMetrics = calculateFinancialMetrics(
      interview.savings,
      interview.annual_income,
      interview.monthly_expenses,
      interview.timeframe
    );

    // 3. Extract the adaptive answers
    interface AdaptiveQuestion {
      id: number;
      question: string;
      answer: string;
      type: string;
    }
    const adaptiveQs = (interview.adaptive_questions as unknown as AdaptiveQuestion[]) || [];
    const q8 = adaptiveQs.find((q) => q.id === 8) || { question: "", answer: "" };
    const q9 = adaptiveQs.find((q) => q.id === 9) || { question: "", answer: "" };
    const q10 = adaptiveQs.find((q) => q.id === 10) || { question: "", answer: "" };

    // 4. Call Gemini to generate the personalized plan and journey map
    let result;
    try {
      result = await generateTransitionPlanAndJourneyMap(
        {
          name: interview.name || "Pivot Candidate",
          currentRole: interview.current_role || "Professional",
          annualIncome: interview.annual_income || "",
          savings: interview.savings || "",
          location: interview.location || "Unknown",
          monthlyExpenses: interview.monthly_expenses || "",
          timeframe: interview.timeframe || "6 months",
          targetRole: interview.target_role || "New Career Path",
          answers: { q8, q9, q10 },
        },
        financialMetrics
      );
    } catch (geminiError) {
      console.error("Gemini plan generation error:", geminiError);
      return NextResponse.json(
        { error: "AI plan generation failed. Check your API configuration." },
        { status: 500 }
      );
    }

    // 5. Store the generated plan in the transition_plans table
    const { data: storedPlan, error: saveError } = await supabaseAdmin
      .from("transition_plans")
      .upsert(
        {
          interview_id: interviewId,
          user_id: interview.user_id,
          plan_data: result.plan,
          journey_data: result.journey,
          financial_metrics: financialMetrics,
        },
        { onConflict: "interview_id" }
      )
      .select()
      .single();

    if (saveError) {
      console.error("Error storing transition plan in DB:", saveError);
      // We still return the generated plan to the frontend even if saving failed,
      // but warn about persistence issues.
    }

    return NextResponse.json({
      planId: storedPlan?.id || null,
      financialMetrics,
      plan: result.plan,
      journey: result.journey,
    });
  } catch (error) {
    console.error("Server error generating transition plan:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
