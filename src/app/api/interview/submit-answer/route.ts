import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { generateAdaptiveQuestions } from "@/lib/llm";

// Standard static questions for reference/validation
const STATIC_QUESTIONS: Record<number, string> = {
  1: "What's your name?",
  2: "What is your current job or role?",
  3: "What is your current annual income and total savings (if any)?",
  4: "Where are you located (city/country)?",
  5: "What are your average monthly expenses?",
  6: "How much time do you need to achieve your goal—be specific (e.g., '6 months', '2 years').",
  7: "What do you want to pursue after quitting?",
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { interviewId, step, answer, financialData } = body;

    if (!interviewId || typeof step !== "number" || answer === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: interviewId, step, or answer." },
        { status: 400 }
      );
    }

    // If Supabase is not configured or in mock mode, run in mock mode
    if (!supabaseAdmin || String(interviewId).startsWith("mock-")) {
      let nextStep = step + 1;
      let nextQuestion = "";
      if (nextStep <= 7) {
        nextQuestion = STATIC_QUESTIONS[nextStep];
      } else if (nextStep === 8) {
        try {
          const adaptive = await generateAdaptiveQuestions({
            name: "Candidate",
            currentRole: "Professional",
            location: "Worldwide",
            timeframe: "6 months",
            targetRole: answer,
          });
          return NextResponse.json({
            interviewId,
            currentStep: 8,
            status: "in_progress",
            nextQuestion: adaptive.practicalQuestion,
            mockAdaptive: [
              { id: 8, question: adaptive.practicalQuestion, answer: null, type: "practical" },
              { id: 9, question: adaptive.psychologicalQuestion, answer: null, type: "psychological" },
              { id: 10, question: adaptive.wildcardQuestion, answer: null, type: "wildcard" },
            ]
          });
        } catch (err) {
          nextQuestion = "What practical barriers do you anticipate in this pivot?";
        }
      } else if (nextStep === 9) {
        nextQuestion = "How do you plan to handle psychological challenges?";
      } else if (nextStep === 10) {
        nextQuestion = "If offered a stable bridge job, would you take it?";
      } else {
        nextStep = 11;
        nextQuestion = "";
      }

      return NextResponse.json({
        interviewId,
        currentStep: nextStep,
        status: nextStep === 11 ? "completed" : "in_progress",
        nextQuestion,
      });
    }

    // 1. Fetch current interview progress
    const { data: interview, error: fetchError } = await supabaseAdmin
      .from("interviews")
      .select("*")
      .eq("id", interviewId)
      .single();

    if (fetchError || !interview) {
      console.error("Error fetching interview:", fetchError);
      if (fetchError?.message?.includes("API key") || fetchError?.message?.includes("JWT") || fetchError?.code === "PGRST301") {
        console.warn("⚠️ Fallback: Invalid Supabase API keys on submit-answer. Swapping to Mock Session.");
        let nextStep = step + 1;
        let nextQuestion = "";
        if (nextStep <= 7) {
          nextQuestion = STATIC_QUESTIONS[nextStep];
        } else if (nextStep === 8) {
          try {
            const adaptive = await generateAdaptiveQuestions({
              name: "Candidate",
              currentRole: "Professional",
              location: "Worldwide",
              timeframe: "6 months",
              targetRole: answer,
            });
            return NextResponse.json({
              interviewId: "mock-interview-id-" + Date.now(),
              currentStep: 8,
              status: "in_progress",
              nextQuestion: adaptive.practicalQuestion,
              mockAdaptive: [
                { id: 8, question: adaptive.practicalQuestion, answer: null, type: "practical" },
                { id: 9, question: adaptive.psychologicalQuestion, answer: null, type: "psychological" },
                { id: 10, question: adaptive.wildcardQuestion, answer: null, type: "wildcard" },
              ]
            });
          } catch (err) {
            nextQuestion = "What practical barriers do you anticipate in this pivot?";
          }
        } else if (nextStep === 9) {
          nextQuestion = "How do you plan to handle psychological challenges?";
        } else if (nextStep === 10) {
          nextQuestion = "If offered a stable bridge job, would you take it?";
        } else {
          nextStep = 11;
          nextQuestion = "";
        }

        return NextResponse.json({
          interviewId: "mock-interview-id-" + Date.now(),
          currentStep: nextStep,
          status: nextStep === 11 ? "completed" : "in_progress",
          nextQuestion,
        });
      }
      return NextResponse.json({ error: "Interview session not found." }, { status: 404 });
    }

    if (interview.status === "completed") {
      return NextResponse.json({
        message: "Interview is already completed.",
        currentStep: interview.current_step,
        status: interview.status,
      });
    }

    // Prepare fields to update
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    let nextStep = step + 1;
    let nextQuestion = "";
    let adaptiveQuestionsList = interview.adaptive_questions || [];

    // State machine based on current step
    switch (step) {
      case 1:
        updateData.name = answer;
        updateData.current_step = 2;
        nextQuestion = STATIC_QUESTIONS[2];
        break;

      case 2:
        updateData.current_role = answer;
        updateData.current_step = 3;
        nextQuestion = STATIC_QUESTIONS[3];
        break;

      case 3:
        // Handle if frontend provides structured details or raw string
        if (financialData && typeof financialData === "object") {
          updateData.annual_income = financialData.annualIncome || answer;
          updateData.savings = financialData.savings || answer;
        } else {
          // If simple string answer, parse or save directly
          updateData.annual_income = answer;
          updateData.savings = answer;
        }
        updateData.current_step = 4;
        nextQuestion = STATIC_QUESTIONS[4];
        break;

      case 4:
        updateData.location = answer;
        updateData.current_step = 5;
        nextQuestion = STATIC_QUESTIONS[5];
        break;

      case 5:
        updateData.monthly_expenses = answer;
        updateData.current_step = 6;
        nextQuestion = STATIC_QUESTIONS[6];
        break;

      case 6:
        updateData.timeframe = answer;
        updateData.current_step = 7;
        nextQuestion = STATIC_QUESTIONS[7];
        break;

      case 7:
        updateData.target_role = answer;
        updateData.current_step = 8;

        // Generate adaptive Q8-Q10 via Gemini using Q1-Q7 answers
        const name = interview.name || updateData.name;
        const currentRole = interview.current_role;
        const location = interview.location;
        const timeframe = interview.timeframe;
        const targetRole = answer; // updated target_role

        try {
          const adaptive = await generateAdaptiveQuestions({
            name,
            currentRole,
            location,
            timeframe,
            targetRole,
          });

          adaptiveQuestionsList = [
            { id: 8, question: adaptive.practicalQuestion, answer: null, type: "practical" },
            { id: 9, question: adaptive.psychologicalQuestion, answer: null, type: "psychological" },
            { id: 10, question: adaptive.wildcardQuestion, answer: null, type: "wildcard" },
          ];
          updateData.adaptive_questions = adaptiveQuestionsList;
          nextQuestion = adaptive.practicalQuestion;
        } catch (apiErr) {
          console.error("Failed to generate adaptive questions:", apiErr);
          return NextResponse.json({ error: "Failed to generate follow-up questions." }, { status: 500 });
        }
        break;

      case 8:
        if (adaptiveQuestionsList.length > 0) {
          adaptiveQuestionsList[0].answer = answer;
          updateData.adaptive_questions = adaptiveQuestionsList;
        }
        updateData.current_step = 9;
        nextQuestion = adaptiveQuestionsList[1]?.question || "How do you plan to handle psychological challenges?";
        break;

      case 9:
        if (adaptiveQuestionsList.length > 1) {
          adaptiveQuestionsList[1].answer = answer;
          updateData.adaptive_questions = adaptiveQuestionsList;
        }
        updateData.current_step = 10;
        nextQuestion = adaptiveQuestionsList[2]?.question || "If offered a stable bridge job, would you take it?";
        break;

      case 10:
        if (adaptiveQuestionsList.length > 2) {
          adaptiveQuestionsList[2].answer = answer;
          updateData.adaptive_questions = adaptiveQuestionsList;
        }
        updateData.current_step = 11;
        updateData.status = "completed";
        nextStep = 11;
        nextQuestion = ""; // No more questions
        break;

      default:
        return NextResponse.json({ error: "Invalid step." }, { status: 400 });
    }

    // 2. Update the interview row in Supabase
    const { error: updateError } = await supabaseAdmin
      .from("interviews")
      .update(updateData)
      .eq("id", interviewId);

    if (updateError) {
      console.error("Error updating interview step:", updateError);
      return NextResponse.json({ error: "Failed to save answer." }, { status: 500 });
    }

    return NextResponse.json({
      interviewId,
      currentStep: nextStep,
      status: updateData.status || interview.status,
      nextQuestion,
    });
  } catch (error) {
    console.error("Server error submitting answer:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
