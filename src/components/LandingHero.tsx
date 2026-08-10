import React from "react";
import { ArrowUpRight, Activity, Layers } from "lucide-react";

interface LandingHeroProps {
  status: "authenticated" | "loading" | "unauthenticated";
  startInterview: (forceNew?: boolean) => Promise<void>;
  signIn: (provider: string) => void;
}

export const LandingHero: React.FC<LandingHeroProps> = ({
  status,
  startInterview,
  signIn,
}) => {
  return (
    <div className="flex-1 flex flex-col gap-16 py-4">
      {/* Hero Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* Left Column: Bold Text */}
        <div className="lg:col-span-7 space-y-6 text-left">
          <div className="inline-block px-3 py-1 rounded bg-[#E7B511] border-2 border-[#111111] text-[10px] uppercase font-bold tracking-wider text-[#111111] shadow-[2px_2px_0px_0px_rgba(17,17,17,1)]">
            ⚡ Career transition calibrator
          </div>

          <h1 className="text-4xl lg:text-6xl font-extrabold tracking-tight leading-tight text-[#111111]">
            Plan your career leap. <br />
            <span className="underline decoration-[#E7B511] decoration-4 underline-offset-4">
              Master your runway.
            </span>
          </h1>

          <p className="text-[#5c5950] text-sm lg:text-base leading-relaxed max-w-xl">
            Runway360 is a minimalist, math-backed planning workspace for career transitions. We analyze your monthly budget runway, identify skill pivots, trigger custom adaptive queries via Gemini AI, and compile a clear roadmap checklist to help you land safely.
          </p>

          <div className="pt-2">
            <button
              onClick={() => (status === "authenticated" ? startInterview() : signIn("google"))}
              className="group relative inline-flex items-center gap-2 bg-[#111111] text-white hover:bg-neutral-900 active:translate-y-0.5 font-bold px-8 py-4 rounded-xl border-2 border-[#111111] transition-all shadow-[4px_4px_0px_0px_rgba(231,181,17,1)] active:shadow-none cursor-pointer"
            >
              {status === "authenticated" ? "Start Interactive Audit" : "Sign In to Start Audit"}
              <ArrowUpRight className="h-4.5 w-4.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </button>
          </div>
        </div>

        {/* Right Column: Clean Interactive Mockup Panel */}
        <div className="lg:col-span-5">
          <div className="border-2 border-[#111111] bg-white rounded-2xl p-6 shadow-[6px_6px_0px_0px_rgba(17,17,17,1)] space-y-5">
            <div className="flex items-center justify-between border-b-2 border-neutral-100 pb-3">
              <span className="font-extrabold text-xs uppercase tracking-wider text-neutral-400">Runway Sandbox Mockup</span>
              <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
            </div>

            <div className="space-y-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">Est. Savings Runway</span>
                <div className="text-3xl font-extrabold text-[#111111] mt-0.5">8.4 months</div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-neutral-500">
                  <span>Runway Progress</span>
                  <span>80% Buffer</span>
                </div>
                <div className="w-full bg-[#EFDFBB]/40 h-4 rounded-lg border-2 border-[#111111] overflow-hidden p-0.5">
                  <div className="h-full bg-[#E7B511] rounded-md" style={{ width: "80%" }}></div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t-2 border-neutral-100 pt-3 text-xs">
                <div>
                  <span className="text-[9px] font-bold text-neutral-400 uppercase">Monthly Spend</span>
                  <span className="font-extrabold text-neutral-800 block">₹50,000/mo</span>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-neutral-400 uppercase">Buffer Gap</span>
                  <span className="font-extrabold text-emerald-700 block">₹0 (Funded)</span>
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-[#EFDFBB]/30 border border-[#111111]/10 p-3.5 text-xs text-[#5c5950] leading-relaxed">
              Adjust simulation parameters inside the audit to forecast runway calculations under custom budget cuts.
            </div>
          </div>
        </div>
      </div>

      {/* Clean Feature Pillars Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border-2 border-[#111111] rounded-2xl p-6 shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] space-y-3">
          <div className="h-8 w-8 rounded bg-[#EFDFBB] border border-[#111111] flex items-center justify-center text-[#111111] font-bold text-sm">
            ₹
          </div>
          <h2 className="font-extrabold text-[#111111] text-base">Runway Calibrator</h2>
          <p className="text-xs text-[#5c5950] leading-relaxed">
            Real-time interactive financial modeling. Tweak savings, monthly expenses, and targets to calculate emergency safety buffers and timeline viability.
          </p>
        </div>

        <div className="bg-white border-2 border-[#111111] rounded-2xl p-6 shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] space-y-3">
          <div className="h-8 w-8 rounded bg-[#EFDFBB] border border-[#111111] flex items-center justify-center text-[#111111] font-bold text-sm">
            A
          </div>
          <h2 className="font-extrabold text-[#111111] text-base">Adaptive Prompts</h2>
          <p className="text-xs text-[#5c5950] leading-relaxed">
            Once baseline parameters are set, Gemini AI generates dynamic custom queries (Q8-Q10) to probe specific skills gaps, transition risks, and commitments.
          </p>
        </div>

        <div className="bg-white border-2 border-[#111111] rounded-2xl p-6 shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] space-y-3">
          <div className="h-8 w-8 rounded bg-[#EFDFBB] border border-[#111111] flex items-center justify-center text-[#111111] font-bold text-sm">
            M
          </div>
          <h2 className="font-extrabold text-[#111111] text-base">Actionable Maps</h2>
          <p className="text-xs text-[#5c5950] leading-relaxed">
            Export structured transition checklists (30 days, 3 months, mid-term) alongside a milestone-based timeline mapping emotional and mental pivot phases.
          </p>
        </div>
      </div>

      {/* Additional Landing Page Assets */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        {/* Transition Metrics Index */}
        <div className="lg:col-span-5 bg-white border-2 border-[#111111] rounded-2xl p-6 shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] flex flex-col justify-between space-y-6">
          <div>
            <h2 className="font-extrabold text-[#111111] text-lg uppercase tracking-wider flex items-center gap-2">
              <Activity className="h-5 w-5 text-[#E7B511]" />
              Calibration Index
            </h2>
            <p className="text-xs text-[#5c5950] mt-1">Recommended baseline metrics for Gen Z transition readiness.</p>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-neutral-100 pb-2.5">
              <span className="text-xs text-[#5c5950] font-semibold">Min Reserve Runway</span>
              <span className="text-xs font-bold bg-[#EFDFBB] border border-[#111111] px-2 py-0.5 rounded">6.0 Months</span>
            </div>
            <div className="flex justify-between items-center border-b border-neutral-100 pb-2.5">
              <span className="text-xs text-[#5c5950] font-semibold">Frictional Quit Window</span>
              <span className="text-xs font-bold bg-[#EFDFBB] border border-[#111111] px-2 py-0.5 rounded">180 Days</span>
            </div>
            <div className="flex justify-between items-center border-b border-neutral-100 pb-2.5">
              <span className="text-xs text-[#5c5950] font-semibold">Typical Skill Acquisition Cap</span>
              <span className="text-xs font-bold bg-[#EFDFBB] border border-[#111111] px-2 py-0.5 rounded">90 Days</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-[#5c5950] font-semibold">Self-Employment Buffer Rate</span>
              <span className="text-xs font-bold bg-[#E7B511] border border-[#111111] px-2 py-0.5 rounded">+15% Savings</span>
            </div>
          </div>

          <div className="text-[10px] text-neutral-400 leading-relaxed border-t border-neutral-100 pt-3">
            *Index values are derived from standard demographic averages and cost-of-living adjustments across municipal centers.
          </div>
        </div>

        {/* Checklist Blueprint Preview */}
        <div className="lg:col-span-7 bg-white border-2 border-[#111111] rounded-2xl p-6 shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] space-y-5">
          <div>
            <h2 className="font-extrabold text-[#111111] text-lg uppercase tracking-wider flex items-center gap-2">
              <Layers className="h-5 w-5 text-[#E7B511]" />
              Example Blueprint Checklist
            </h2>
            <p className="text-xs text-[#5c5950] mt-1">A glimpse of the visual phased task maps generated at checkout.</p>
          </div>

          <div className="space-y-3">
            <div className="flex gap-3 items-start border border-[#111111]/10 bg-[#FAF5EB]/40 p-3 rounded-xl">
              <span className="h-4.5 w-4.5 rounded-full bg-[#EFDFBB] border border-[#111111] text-[9px] font-bold flex items-center justify-center text-[#111111] shrink-0 mt-0.5">1</span>
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-[#111111] block">Establish Cash Cost Survival Budget</span>
                <span className="text-[10px] text-[#5c5950] block">Reduce auxiliary costs to create the absolute bare minimum reserve.</span>
              </div>
            </div>
            <div className="flex gap-3 items-start border border-[#111111]/10 bg-[#FAF5EB]/40 p-3 rounded-xl">
              <span className="h-4.5 w-4.5 rounded-full bg-[#EFDFBB] border border-[#111111] text-[9px] font-bold flex items-center justify-center text-[#111111] shrink-0 mt-0.5">2</span>
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-[#111111] block">Acquire Core Skill Credentials</span>
                <span className="text-[10px] text-[#5c5950] block">Commit to 1-3 certifications or specialized public portfolio builds.</span>
              </div>
            </div>
            <div className="flex gap-3 items-start border border-[#111111]/10 bg-[#FAF5EB]/40 p-3 rounded-xl">
              <span className="h-4.5 w-4.5 rounded-full bg-[#EFDFBB] border border-[#111111] text-[9px] font-bold flex items-center justify-center text-[#111111] shrink-0 mt-0.5">3</span>
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-[#111111] block">Secure Bridge Income & Freelance Gig</span>
                <span className="text-[10px] text-[#5c5950] block">Secure a 10-15 hour bridge gig weekly before officially quitting.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
