import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user ? (session.user as { id?: string }).id : null;
    const userName = session?.user?.name || null;
    const hasName = !!userName;

    let forceNew = false;
    try {
      const body = await req.json();
      forceNew = !!body?.forceNew;
    } catch (e) {
      // Request might not have a body, which is fine
    }

    // If Supabase is not configured, run in mock mode
    if (!supabaseAdmin) {
      return NextResponse.json({
        interviewId: "mock-interview-id-" + Date.now(),
        currentStep: hasName ? 2 : 1,
        status: "in_progress",
        isMock: true,
        userName: userName
      });
    }

    // 1. If there's an existing in-progress session for the authenticated user, resume it
    if (userId && !forceNew) {
      const { data: existing, error: findError } = await supabaseAdmin
        .from("interviews")
        .select("*")
        .eq("user_id", userId)
        .eq("status", "in_progress")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (findError) {
        if (!findError.message?.includes("API key") && !findError.message?.includes("JWT") && findError.code !== "PGRST301") {
          console.error("Error finding existing interview:", findError);
        }
      } else if (existing) {
        // Construct the saved answers object
        const savedAnswers: Record<string, string> = {
          name: existing.name || "",
          currentRole: existing.current_role || "",
          annualIncome: existing.annual_income || "",
          savings: existing.savings || "",
          location: existing.location || "",
          monthlyExpenses: existing.monthly_expenses || "",
          timeframe: existing.timeframe || "",
          targetRole: existing.target_role || "",
        };

        // Parse adaptive answers if any exist
        const adaptiveQs = existing.adaptive_questions || [];
        adaptiveQs.forEach((q: any) => {
          if (q.id === 8) {
            savedAnswers.q8Question = q.question || "";
            savedAnswers.q8Answer = q.answer || "";
          } else if (q.id === 9) {
            savedAnswers.q9Question = q.question || "";
            savedAnswers.q9Answer = q.answer || "";
          } else if (q.id === 10) {
            savedAnswers.q10Question = q.question || "";
            savedAnswers.q10Answer = q.answer || "";
          }
        });

        return NextResponse.json({
          interviewId: existing.id,
          currentStep: existing.current_step,
          status: existing.status,
          userName: userName,
          answers: savedAnswers,
          adaptiveQuestions: adaptiveQs,
          isResumed: true
        });
      }
    }

    // 2. If forcing new, mark any other in-progress interviews as abandoned
    if (userId && forceNew) {
      await supabaseAdmin
        .from("interviews")
        .update({ status: "abandoned" })
        .eq("user_id", userId)
        .eq("status", "in_progress");
    }

    // 3. Create a new interview entry in the database
    const { data, error } = await supabaseAdmin
      .from("interviews")
      .insert({
        user_id: userId,
        name: userName,
        current_step: hasName ? 2 : 1,
        status: "in_progress",
        adaptive_questions: [],
      })
      .select()
      .single();

    if (error) {
      if (error.message?.includes("API key") || error.message?.includes("JWT") || error.code === "PGRST301") {
        console.warn("⚠️ Fallback: Invalid Supabase API keys. Swapping to Mock Session.");
        return NextResponse.json({
          interviewId: "mock-interview-id-" + Date.now(),
          currentStep: hasName ? 2 : 1,
          status: "in_progress",
          isMock: true,
          userName: userName,
          warning: "Invalid Supabase API key. Running in Mock Mode."
        });
      }
      console.error("Supabase error starting interview:", error);
      return NextResponse.json({ error: "Failed to initialize interview session." }, { status: 500 });
    }

    return NextResponse.json({
      interviewId: data.id,
      currentStep: data.current_step,
      status: data.status,
      userName: userName
    });
  } catch (error) {
    console.error("Server error starting interview:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
