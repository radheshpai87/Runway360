import React from "react";

interface InteractiveSandboxProps {
  sandboxExpenses: number;
  sandboxSavings: number;
  sandboxTimeline: number;
  setSandboxExpenses: (val: number) => void;
  setSandboxSavings: (val: number) => void;
  setSandboxTimeline: (val: number) => void;
  liveRunway: number;
  liveBuffer: number;
  liveShortfall: number;
  liveStatus: "safe" | "moderate" | "underfunded";
}

export const InteractiveSandbox: React.FC<InteractiveSandboxProps> = ({
  sandboxExpenses,
  sandboxSavings,
  sandboxTimeline,
  setSandboxExpenses,
  setSandboxSavings,
  setSandboxTimeline,
  liveRunway,
  liveBuffer,
  liveShortfall,
  liveStatus,
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Interactive slider adjustments */}
      <div className="bg-white border-2 border-[#111111] rounded-2xl p-6 lg:p-8 space-y-6 shadow-[4px_4px_0px_0px_rgba(17,17,17,1)]">
        <div>
          <h3 className="font-bold text-[#111111] text-lg mb-1">Adjust Parameters</h3>
          <p className="text-xs text-[#5c5950]">Simulate alternative financial safety scenarios.</p>
        </div>

        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-xs text-neutral-400 mb-1">
              <span>Total Savings Available</span>
              <span className="text-neutral-800 font-bold">
                ₹{sandboxSavings.toLocaleString("en-IN")}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="2500000"
              step="25000"
              value={sandboxSavings}
              onChange={(e) => setSandboxSavings(parseInt(e.target.value))}
              className="w-full accent-[#111111] h-1.5 bg-[#EFDFBB] rounded-lg appearance-none cursor-pointer border border-[#111111]"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs text-neutral-400 mb-1">
              <span>Average Monthly Cost</span>
              <span className="text-neutral-800 font-bold">
                ₹{sandboxExpenses.toLocaleString("en-IN")}/mo
              </span>
            </div>
            <input
              type="range"
              min="5000"
              max="250000"
              step="5000"
              value={sandboxExpenses}
              onChange={(e) => setSandboxExpenses(parseInt(e.target.value))}
              className="w-full accent-[#111111] h-1.5 bg-[#EFDFBB] rounded-lg appearance-none cursor-pointer border border-[#111111]"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs text-neutral-400 mb-1">
              <span>Transition Target Duration</span>
              <span className="text-neutral-800 font-bold">
                {sandboxTimeline} months
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="24"
              step="1"
              value={sandboxTimeline}
              onChange={(e) => setSandboxTimeline(parseInt(e.target.value))}
              className="w-full accent-[#111111] h-1.5 bg-[#EFDFBB] rounded-lg appearance-none cursor-pointer border border-[#111111]"
            />
          </div>
        </div>
      </div>

      {/* Mathematical output results */}
      <div className="lg:col-span-2 bg-white border-2 border-[#111111] rounded-2xl p-6 lg:p-8 grid grid-cols-1 md:grid-cols-2 gap-8 items-center shadow-[4px_4px_0px_0px_rgba(17,17,17,1)]">
        <div className="space-y-5">
          <div>
            <span className="text-xs text-neutral-400 block uppercase font-bold text-[9px]">
              Est. Savings Runway
            </span>
            <div className="text-4xl font-extrabold text-[#111111] flex items-baseline gap-1 mt-1">
              {liveRunway}{" "}
              <span className="text-sm font-normal text-neutral-500">months</span>
            </div>
          </div>

          <div>
            <span className="text-xs text-neutral-400 block uppercase font-bold text-[9px]">
              Standard Emergency Buffer (6m)
            </span>
            <div className="text-xl font-bold text-[#111111] mt-1">
              ₹{liveBuffer.toLocaleString("en-IN")}
            </div>
          </div>

          <div>
            <span className="text-xs text-neutral-400 block uppercase font-bold text-[9px]">
              Total Savings Shortfall
            </span>
            <div className="text-xl font-bold text-[#B85A38] mt-1">
              {liveShortfall > 0
                ? `₹${liveShortfall.toLocaleString("en-IN")}`
                : "₹0 (Secure Runway)"}
            </div>
          </div>
        </div>

        <div className="bg-[#FAF5EB] border-2 border-[#111111] rounded-2xl p-6 space-y-4">
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#111111]">
            Runway360 Assessment
          </h4>

          <div className="flex items-center gap-3">
            <div
              className={`h-8 w-8 rounded-full border-2 border-[#111111] flex items-center justify-center font-bold text-white text-xs ${
                liveStatus === "safe"
                  ? "bg-[#4A6B53]"
                  : liveStatus === "moderate"
                  ? "bg-[#E7B511]"
                  : "bg-[#B85A38]"
              }`}
            >
              {liveStatus === "safe" ? "✓" : "!"}
            </div>
            <div>
              <span className="text-[10px] text-neutral-500 block uppercase">
                Calculated Status
              </span>
              <span className="text-xs font-bold text-[#111111] capitalize">
                {liveStatus} Safety Net
              </span>
            </div>
          </div>

          <p className="text-xs text-[#5c5950] leading-relaxed">
            {liveStatus === "safe" &&
              "Your financial plan is solid. You have a runway extending beyond 6 months, giving you a strong emergency buffer to focus on acquiring skills and networking without immediate financial pressure."}
            {liveStatus === "moderate" &&
              "You are in a moderate safety zone. While your savings runway is decent, it does not fully cover a prolonged transition. You should secure side-gigs or contract roles early on to extend your runway."}
            {liveStatus === "underfunded" &&
              "Your runway is currently underfunded. We strongly suggest delaying your quit date to build a stronger buffer, or prioritizing part-time bridge roles immediately upon starting your pivot."}
          </p>
        </div>
      </div>
    </div>
  );
};
