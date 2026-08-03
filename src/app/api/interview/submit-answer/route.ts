import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { generateAdaptiveQuestions, executeFailoverLLM } from "@/lib/llm";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

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

    // 1. Fetch user session and past history context to enable "remembering"
    const session = await getServerSession(authOptions);
    const userId = session?.user ? (session.user as { id?: string }).id : null;

    let historyContext = "";
    if (userId && supabaseAdmin) {
      try {
        const { data: pastInterviews } = await supabaseAdmin
          .from("interviews")
          .select("*")
          .eq("user_id", userId)
          .eq("status", "completed")
          .order("created_at", { ascending: false })
          .limit(3);

        if (pastInterviews && pastInterviews.length > 0) {
          historyContext = pastInterviews.map((item: any, idx: number) => `
Past Session #${idx + 1}:
- Current Role: ${item.current_role || "Unknown"}
- Target Goal: ${item.target_role || "Unknown"}
- Savings: ${item.savings || "Unknown"}
- Monthly Expenses: ${item.monthly_expenses || "Unknown"}
- Timeline: ${item.timeframe || "Unknown"}
- Location: ${item.location || "Unknown"}
`).join("\n");
        }
      } catch (err) {
        // Suppress
      }
    }

    // 2. Identify the current question being asked
    let currentQuestion = "";
    if (step <= 7) {
      currentQuestion = STATIC_QUESTIONS[step];
    } else {
      let adaptiveQs: any[] = [];
      if (supabaseAdmin && !String(interviewId).startsWith("mock-")) {
        try {
          const { data: interview } = await supabaseAdmin
            .from("interviews")
            .select("adaptive_questions")
            .eq("id", interviewId)
            .single();
          adaptiveQs = interview?.adaptive_questions || [];
        } catch (e) {}
      } else if (body.adaptiveQuestions) {
        adaptiveQs = body.adaptiveQuestions;
      }
      const q = adaptiveQs.find((q: any) => q.id === step);
      currentQuestion = q ? q.question : "Please answer the follow-up question.";
    }

    // 3. Classify and resolve user input via LLM
    let isAnswer = true;
    let resolvedAnswer = answer;
    let replyMessage = "";

    try {
      const systemInstruction = `You are the Runway360 career transition coach.
The user is in the middle of a 10-question intake interview.
The current question they are asked to answer is: "${currentQuestion}".

Here is the user's historical profile from their previous sessions:
${historyContext || "None"}

Your job is to analyze the user's input: "${answer}".
Determine if they are answering the current question, OR if they are asking a free-form question / requesting ideas / seeking advice.

Rules for resolution:
1. If the user refers to their past history (e.g. "same as last time", "same role", "refer to my old budget", "yes, from my previous session"), resolve the exact value from the history context.
   Set "isAnswer" to true, and put the resolved actual value in "resolvedAnswer".
2. If they are directly answering the question (e.g. "I am a dev", "$5000", "New York"), set "isAnswer" to true, and put their response in "resolvedAnswer".
3. If they are asking a question, seeking ideas, or requesting guidance (e.g. "what ideas do you have?", "how much savings do I need?", "can you suggest some pivots?"), set "isAnswer" to false, and write a helpful, brief, conversational reply in "reply". Warn them that you will repeat the question when they are ready.

Format your response as a JSON object matching this schema exactly:
{
  "isAnswer": boolean,
  "resolvedAnswer": "string",
  "reply": "string"
}`;

      const llmResponse = await executeFailoverLLM(systemInstruction, `User input: "${answer}"`);
      const parsed = JSON.parse(llmResponse);
      isAnswer = parsed.isAnswer;
      resolvedAnswer = parsed.resolvedAnswer || answer;
      replyMessage = parsed.reply || "";
    } catch (llmErr) {
      console.warn("LLM classification failed, falling back to direct answer processing:", llmErr);
      isAnswer = true;
      resolvedAnswer = answer;
    }

    if (!isAnswer) {
      // The user asked a question or sought ideas. We return the reply without advancing the step!
      return NextResponse.json({
        interviewId,
        currentStep: step,
        status: "in_progress",
        nextQuestion: replyMessage,
      });
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
            targetRole: resolvedAnswer,
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
              targetRole: resolvedAnswer,
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
      console.error("Error fetching interview:", fetchError);
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
        updateData.name = resolvedAnswer;
        updateData.current_step = 2;
        nextQuestion = STATIC_QUESTIONS[2];
        break;

      case 2:
        updateData.current_role = resolvedAnswer;
        updateData.current_step = 3;
        nextQuestion = STATIC_QUESTIONS[3];
        break;

      case 3:
        if (financialData && typeof financialData === "object") {
          updateData.annual_income = financialData.annualIncome || resolvedAnswer;
          updateData.savings = financialData.savings || resolvedAnswer;
        } else {
          updateData.annual_income = resolvedAnswer;
          updateData.savings = resolvedAnswer;
        }
        updateData.current_step = 4;
        nextQuestion = STATIC_QUESTIONS[4];
        break;

      case 4:
        updateData.location = resolvedAnswer;
        updateData.current_step = 5;
        nextQuestion = STATIC_QUESTIONS[5];
        break;

      case 5:
        updateData.monthly_expenses = resolvedAnswer;
        updateData.current_step = 6;
        nextQuestion = STATIC_QUESTIONS[6];
        break;

      case 6:
        updateData.timeframe = resolvedAnswer;
        updateData.current_step = 7;
        nextQuestion = STATIC_QUESTIONS[7];
        break;

      case 7:
        updateData.target_role = resolvedAnswer;
        updateData.current_step = 8;

        // Generate adaptive Q8-Q10 via Gemini using Q1-Q7 answers
        const name = interview.name || updateData.name;
        const currentRole = interview.current_role;
        const location = interview.location;
        const timeframe = interview.timeframe;
        const targetRole = resolvedAnswer;

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
          adaptiveQuestionsList[0].answer = resolvedAnswer;
          updateData.adaptive_questions = adaptiveQuestionsList;
        }
        updateData.current_step = 9;
        nextQuestion = adaptiveQuestionsList[1]?.question || "How do you plan to handle psychological challenges?";
        break;

      case 9:
        if (adaptiveQuestionsList.length > 1) {
          adaptiveQuestionsList[1].answer = resolvedAnswer;
          updateData.adaptive_questions = adaptiveQuestionsList;
        }
        updateData.current_step = 10;
        nextQuestion = adaptiveQuestionsList[2]?.question || "If offered a stable bridge job, would you take it?";
        break;

      case 10:
        if (adaptiveQuestionsList.length > 2) {
          adaptiveQuestionsList[2].answer = resolvedAnswer;
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
