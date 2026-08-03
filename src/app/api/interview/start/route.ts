import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user ? (session.user as { id?: string }).id : null;

    // If Supabase is not configured, run in mock mode
    if (!supabaseAdmin) {
      return NextResponse.json({
        interviewId: "mock-interview-id-" + Date.now(),
        currentStep: 1,
        status: "in_progress",
        isMock: true
      });
    }

    // Create a new blank interview entry in the database
    const { data, error } = await supabaseAdmin
      .from("interviews")
      .insert({
        user_id: userId,
        current_step: 1,
        status: "in_progress",
        adaptive_questions: [],
      })
      .select()
      .single();

    if (error) {
      console.error("Supabase error starting interview:", error);
      if (error.message?.includes("API key") || error.message?.includes("JWT") || error.code === "PGRST301") {
        console.warn("⚠️ Fallback: Invalid Supabase API keys. Swapping to Mock Session.");
        return NextResponse.json({
          interviewId: "mock-interview-id-" + Date.now(),
          currentStep: 1,
          status: "in_progress",
          isMock: true,
          warning: "Invalid Supabase API key. Running in Mock Mode."
        });
      }
      return NextResponse.json({ error: "Failed to initialize interview session." }, { status: 500 });
    }

    return NextResponse.json({
      interviewId: data.id,
      currentStep: data.current_step,
      status: data.status,
    });
  } catch (error) {
    console.error("Server error starting interview:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
