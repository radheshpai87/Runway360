import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user ? (session.user as { id?: string }).id : null;

    if (!userId || !supabaseAdmin) {
      return NextResponse.json({ interviews: [] });
    }

    const { data, error } = await supabaseAdmin
      .from("interviews")
      .select(`
        *,
        transition_plans (
          id,
          plan_data,
          journey_data,
          financial_metrics
        )
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      // Check for API key / connection issue first
      if (error.message?.includes("API key") || error.message?.includes("JWT") || error.code === "PGRST301") {
        console.warn("⚠️ Warning: Supabase API key issues in history fetch. Returning empty list.");
        return NextResponse.json({ interviews: [] });
      }
      console.error("Error fetching interview history:", error);
      return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 });
    }

    // Map transition_plans to make it easier for frontend consumption
    const formattedData = data.map((item: any) => {
      const plan = item.transition_plans?.[0] || item.transition_plans || null;
      return {
        ...item,
        plan: plan
          ? {
              planId: plan.id,
              financialMetrics: plan.financial_metrics,
              plan: plan.plan_data,
              journey: plan.journey_data,
            }
          : null,
      };
    });

    return NextResponse.json({ interviews: formattedData });
  } catch (error) {
    console.error("History API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
