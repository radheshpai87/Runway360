"use client";

import { useState, useEffect, useRef } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import { 
  TrendingUp, 
  Coins, 
  Calendar, 
  Map, 
  User, 
  Sparkles, 
  CheckCircle, 
  AlertCircle, 
  X, 
  ArrowRight, 
  Lock, 
  Unlock, 
  ArrowLeft, 
  HelpCircle, 
  Briefcase, 
  MapPin,
  RefreshCw,
  ChevronRight,
  ShieldAlert,
  Frown,
  Meh,
  Smile,
  Compass,
  ArrowUpRight,
  ShieldCheck,
  TrendingDown,
  Info,
  Layers,
  Activity,
  Sliders,
  DollarSign
} from "lucide-react";

interface Message {
  sender: "bot" | "user";
  text: string;
  isFinancial?: boolean;
}

interface FinancialMetrics {
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

interface PlanData {
  planId: string | null;
  financialMetrics: FinancialMetrics;
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

export default function Home() {
  const { data: session, status } = useSession();

  // App states
  const [started, setStarted] = useState(false);
  const [interviewId, setInterviewId] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  // Accumulated Answers for mock fallback and sidebar
  const [answers, setAnswers] = useState<Record<string, string>>({
    name: "",
    currentRole: "",
    annualIncome: "",
    savings: "",
    location: "",
    monthlyExpenses: "",
    timeframe: "",
    targetRole: "",
    q8Question: "",
    q8Answer: "",
    q9Question: "",
    q9Answer: "",
    q10Question: "",
    q10Answer: "",
  });

  // Adaptive list from step 8
  const [adaptiveQuestions, setAdaptiveQuestions] = useState<any[]>([]);

  // Generated Plan State
  const [planData, setPlanData] = useState<PlanData | null>(null);
  const [activeTab, setActiveTab] = useState<"plan" | "journey" | "runway">("plan");

  // Sidebar interactive sandbox state
  const [sandboxExpenses, setSandboxExpenses] = useState<number>(2500);
  const [sandboxSavings, setSandboxSavings] = useState<number>(10000);
  const [sandboxTimeline, setSandboxTimeline] = useState<number>(6);

  // Chat scroll anchor
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Synchronize sandbox inputs when answers are submitted
  useEffect(() => {
    if (answers.monthlyExpenses && !isNaN(parseFloat(answers.monthlyExpenses.replace(/[^0-9.]/g, "")))) {
      setSandboxExpenses(parseFloat(answers.monthlyExpenses.replace(/[^0-9.]/g, "")));
    }
    if (answers.savings && !isNaN(parseFloat(answers.savings.replace(/[^0-9.]/g, "")))) {
      setSandboxSavings(parseFloat(answers.savings.replace(/[^0-9.]/g, "")));
    }
    if (answers.timeframe) {
      const months = parseTimelineToMonths(answers.timeframe);
      setSandboxTimeline(months);
    }
  }, [answers.monthlyExpenses, answers.savings, answers.timeframe]);

  // Helper: Convert timeline string to months
  function parseTimelineToMonths(timeline: string): number {
    const clean = timeline.toLowerCase();
    const match = clean.match(/(\d+)/);
    if (!match) return 6;
    const num = parseInt(match[1]);
    if (clean.includes("year") || clean.includes("yr")) return num * 12;
    return num;
  }

  // Calculate live runway metrics in frontend for the sandbox
  const liveRunway = sandboxExpenses > 0 ? parseFloat((sandboxSavings / sandboxExpenses).toFixed(1)) : 999;
  const liveBuffer = sandboxExpenses * 6;
  const liveShortfall = Math.max(0, liveBuffer - sandboxSavings);
  const liveDeficit = Math.max(0, sandboxTimeline - liveRunway);
  const liveStatus = liveRunway >= 6 ? "safe" : liveRunway >= 3 ? "moderate" : "underfunded";

  // Start the interview session
  const startInterview = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/interview/start", { method: "POST" });
      const data = await res.json();
      
      if (res.ok) {
        setInterviewId(data.interviewId);
        setStep(1);
        setStarted(true);
        setMessages([
          { sender: "bot", text: "Welcome to Runway360. Let's design a secure, calculated roadmap for your career transition." },
          { sender: "bot", text: "To start: What's your name?" }
        ]);
      } else {
        console.error("Failed to start session:", data.error);
        alert("Failed to initialize session. Make sure your local server is running.");
      }
    } catch (err) {
      console.error(err);
      alert("Error starting interview. Check console.");
    } finally {
      setIsLoading(false);
    }
  };

  // Submit current step answer
  const submitAnswer = async (customAnswer?: string, customFinancials?: any) => {
    const finalAnswer = customAnswer !== undefined ? customAnswer : inputValue;
    if (!finalAnswer && !customFinancials) return;

    setMessages((prev) => [...prev, { sender: "user", text: finalAnswer || "Provided financial details" }]);
    setInputValue("");
    setIsLoading(true);

    // Update local answers mapping
    let field = "";
    switch (step) {
      case 1: field = "name"; break;
      case 2: field = "currentRole"; break;
      case 3: field = "savings"; break; 
      case 4: field = "location"; break;
      case 5: field = "monthlyExpenses"; break;
      case 6: field = "timeframe"; break;
      case 7: field = "targetRole"; break;
      case 8: field = "q8Answer"; break;
      case 9: field = "q9Answer"; break;
      case 10: field = "q10Answer"; break;
    }

    const updatedAnswers = { ...answers };
    if (field) {
      updatedAnswers[field] = finalAnswer;
    }
    if (customFinancials) {
      updatedAnswers.annualIncome = customFinancials.annualIncome;
      updatedAnswers.savings = customFinancials.savings;
    }
    setAnswers(updatedAnswers);

    try {
      const body: any = {
        interviewId,
        step,
        answer: finalAnswer,
      };

      if (customFinancials) {
        body.financialData = customFinancials;
      }

      const res = await fetch("/api/interview/submit-answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (res.ok) {
        setStep(data.currentStep);

        if (data.mockAdaptive) {
          setAdaptiveQuestions(data.mockAdaptive);
          setAnswers((prev) => ({
            ...prev,
            q8Question: data.mockAdaptive[0].question,
            q9Question: data.mockAdaptive[1].question,
            q10Question: data.mockAdaptive[2].question,
          }));
        }

        if (data.nextQuestion) {
          setMessages((prev) => [...prev, { sender: "bot", text: data.nextQuestion }]);
        }

        if (data.status === "completed" || data.currentStep === 11) {
          setStep(11);
          generatePlan(updatedAnswers);
        }
      } else {
        setMessages((prev) => [...prev, { sender: "bot", text: "Oops, I had an issue saving that answer. Let's try again." }]);
      }
    } catch (err) {
      console.error(err);
      setMessages((prev) => [...prev, { sender: "bot", text: "Connection error. Let's try that submission again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Generate transition plan
  const generatePlan = async (finalAnswersObj: typeof answers) => {
    setIsLoading(true);
    setMessages((prev) => [...prev, { sender: "bot", text: "Calculating runway safety buffers and compiling report. Stand by..." }]);
    
    try {
      const res = await fetch("/api/interview/generate-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          interviewId,
          answers: finalAnswersObj
        }),
      });
      const data = await res.json();

      if (res.ok) {
        setPlanData(data);
        setStep(12); // Enter dashboard
      } else {
        alert("Failed to generate plan: " + data.error);
      }
    } catch (err) {
      console.error(err);
      alert("Error generating plan.");
    } finally {
      setIsLoading(false);
    }
  };

  // Skip/Privacy Helpers
  const handleFinancialPrivacy = () => {
    submitAnswer("Kept Private", { annualIncome: "0", savings: "0" });
  };

  const handleExpensesPrivacy = () => {
    submitAnswer("Kept Private");
  };

  // Reset interview
  const resetApp = () => {
    setStarted(false);
    setInterviewId(null);
    setStep(1);
    setMessages([]);
    setPlanData(null);
    setAnswers({
      name: "",
      currentRole: "",
      annualIncome: "",
      savings: "",
      location: "",
      monthlyExpenses: "",
      timeframe: "",
      targetRole: "",
      q8Question: "",
      q8Answer: "",
      q9Question: "",
      q9Answer: "",
      q10Question: "",
      q10Answer: "",
    });
  };

  return (
    <div className="flex flex-col flex-1 bg-[#EFDFBB] text-[#111111] min-h-screen font-sans">
      
      {/* Editorial Navigation Header */}
      <header className="border-b-2 border-[#111111] bg-[#EFDFBB] sticky top-0 z-50 px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-[#111111] flex items-center justify-center">
            <Compass className="h-4.5 w-4.5 text-[#EFDFBB]" />
          </div>
          <span className="font-extrabold tracking-tight text-lg uppercase text-[#111111]">
            Runway360
          </span>
        </div>

        <div className="flex items-center gap-3">
          {started && (
            <button 
              onClick={resetApp} 
              className="text-xs font-bold px-4 py-2 border-2 border-[#111111] bg-white hover:bg-neutral-50 active:translate-y-0.5 transition-all shadow-[2px_2px_0px_0px_rgba(17,17,17,1)] active:shadow-none"
            >
              Restart
            </button>
          )}

          {status === "authenticated" ? (
            <div className="flex items-center gap-2 bg-white border-2 border-[#111111] p-1 pr-3 rounded-lg shadow-[2px_2px_0px_0px_rgba(17,17,17,1)]">
              {session.user?.image ? (
                <img 
                  src={session.user.image} 
                  alt={session.user.name || "User"} 
                  className="h-6 w-6 rounded border border-[#111111] object-cover"
                />
              ) : (
                <div className="h-6 w-6 rounded bg-[#E7B511] text-[#111111] flex items-center justify-center font-bold text-xs border border-[#111111]">
                  {session.user?.name?.[0] || "U"}
                </div>
              )}
              <span className="text-xs font-bold text-[#111111] hidden sm:inline">{session.user?.name}</span>
              <button 
                onClick={() => signOut()}
                className="text-[10px] font-bold uppercase tracking-wider text-rose-700 hover:text-rose-900 border-l border-neutral-300 pl-2 ml-1"
              >
                Exit
              </button>
            </div>
          ) : (
            <button 
              onClick={() => signIn("google")}
              className="text-xs font-bold px-4 py-2 border-2 border-[#111111] bg-[#E7B511] hover:bg-[#E7B511]/90 active:translate-y-0.5 transition-all shadow-[2px_2px_0px_0px_rgba(17,17,17,1)] active:shadow-none"
            >
              Sign In with Google
            </button>
          )}
        </div>
      </header>

      {/* Main Wrapper */}
      <div className="flex flex-1 flex-col lg:flex-row max-w-6xl w-full mx-auto p-4 lg:p-8 gap-8 items-stretch justify-center">
        
        {/* LANDING MARKETING PAGE STATE */}
        {!started && (
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
                  <span className="underline decoration-[#E7B511] decoration-wavy decoration-3">
                    Master your runway.
                  </span>
                </h1>

                <p className="text-[#5c5950] text-sm lg:text-base leading-relaxed max-w-xl">
                  Runway360 is a minimalist, math-backed planning workspace for career transitions. We analyze your monthly budget runway, identify skill pivots, trigger custom adaptive queries via Gemini AI, and compile a clear roadmap checklist to help you land safely.
                </p>

                <div className="pt-2">
                  <button 
                    onClick={startInterview}
                    className="group relative inline-flex items-center gap-2 bg-[#111111] text-white hover:bg-neutral-900 active:translate-y-0.5 font-bold px-8 py-4 rounded-xl border-2 border-[#111111] transition-all shadow-[4px_4px_0px_0px_rgba(231,181,17,1)] active:shadow-none cursor-pointer"
                  >
                    Start Interactive Audit
                    <ArrowUpRight className="h-4.5 w-4.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </button>
                </div>
              </div>

              {/* Right Column: Clean Interactive Mockup Panel (Replacing AI stock image) */}
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

                    {/* CSS Runway Bar graph representation */}
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
                        <span className="font-extrabold text-neutral-800 block">$2,500/mo</span>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-neutral-400 uppercase">Buffer Gap</span>
                        <span className="font-extrabold text-emerald-700 block">$0 (Funded)</span>
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
                  $
                </div>
                <h3 className="font-extrabold text-[#111111] text-base">Runway Calibrator</h3>
                <p className="text-xs text-[#5c5950] leading-relaxed">
                  Real-time interactive financial modeling. Tweak savings, monthly expenses, and targets to calculate emergency safety buffers and timeline viability.
                </p>
              </div>

              <div className="bg-white border-2 border-[#111111] rounded-2xl p-6 shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] space-y-3">
                <div className="h-8 w-8 rounded bg-[#EFDFBB] border border-[#111111] flex items-center justify-center text-[#111111] font-bold text-sm">
                  A
                </div>
                <h3 className="font-extrabold text-[#111111] text-base">Adaptive Prompts</h3>
                <p className="text-xs text-[#5c5950] leading-relaxed">
                  Once baseline parameters are set, Gemini AI generates dynamic custom queries (Q8-Q10) to probe specific skills gaps, transition risks, and commitments.
                </p>
              </div>

              <div className="bg-white border-2 border-[#111111] rounded-2xl p-6 shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] space-y-3">
                <div className="h-8 w-8 rounded bg-[#EFDFBB] border border-[#111111] flex items-center justify-center text-[#111111] font-bold text-sm">
                  M
                </div>
                <h3 className="font-extrabold text-[#111111] text-base">Actionable Maps</h3>
                <p className="text-xs text-[#5c5950] leading-relaxed">
                  Export structured transition checklists (30 days, 3 months, mid-term) alongside a milestone-based timeline mapping emotional and mental pivot phases.
                </p>
              </div>

            </div>

          </div>
        )}

        {/* ACTIVE QUESTIONNAIRE STATE */}
        {started && step <= 10 && (
          <div className="flex-1 flex flex-col lg:flex-row gap-8 items-stretch w-full">
            
            {/* Left Column: Chat Console */}
            <div className="flex-1 flex flex-col bg-white border-2 border-[#111111] rounded-3xl overflow-hidden shadow-[6px_6px_0px_0px_rgba(17,17,17,1)] h-[600px] lg:h-[720px]">
              
              {/* Header inside Panel */}
              <div className="bg-[#EFDFBB]/30 border-b-2 border-[#111111] px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-[#E7B511]"></div>
                  <span className="text-xs font-bold uppercase tracking-wider text-[#111111]">Audit Phase ({step}/10)</span>
                </div>
                <span className="text-[9px] text-[#5c5950] font-mono">ID: {interviewId?.substring(0, 8)}</span>
              </div>

              {/* Message List */}
              <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-[#FAF5EB]/20">
                {messages.map((msg, idx) => (
                  <div 
                    key={idx} 
                    className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div 
                      className={`max-w-[80%] rounded-2xl px-5 py-3.5 text-sm leading-relaxed ${
                        msg.sender === "user" 
                          ? "bg-[#E7B511] text-[#111111] border-2 border-[#111111] font-bold rounded-tr-none shadow-[2px_2px_0px_0px_rgba(17,17,17,1)]" 
                          : "bg-white border-2 border-[#111111] text-[#111111] rounded-tl-none shadow-[2px_2px_0px_0px_rgba(17,17,17,1)]"
                      }`}
                    >
                      {msg.sender === "bot" ? (
                        <div className="flex gap-2.5">
                          <div className="h-6 w-6 rounded bg-[#111111] flex items-center justify-center shrink-0 mt-0.5 text-[10px] text-[#EFDFBB] font-bold">
                            C
                          </div>
                          <span>{msg.text}</span>
                        </div>
                      ) : (
                        <span>{msg.text}</span>
                      )}
                    </div>
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white border-2 border-[#111111] text-neutral-500 rounded-2xl rounded-tl-none px-4 py-3 text-xs flex items-center gap-2 shadow-[2px_2px_0px_0px_rgba(17,17,17,1)]">
                      <div className="flex gap-1">
                        <span className="w-1.5 h-1.5 bg-[#111111] rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                        <span className="w-1.5 h-1.5 bg-[#111111] rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                        <span className="w-1.5 h-1.5 bg-[#111111] rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
                      </div>
                      <span className="font-semibold">Coach is drafting...</span>
                    </div>
                  </div>
                )}
                
                <div ref={chatEndRef} />
              </div>

              {/* Chat Input Controls */}
              <div className="border-t-2 border-[#111111] bg-white p-6 space-y-4">
                
                {/* Q3: Financial Config Options */}
                {step === 3 && (
                  <div className="bg-[#FAF5EB] border-2 border-[#111111] rounded-2xl p-5 space-y-4 animate-fadeIn">
                    <div className="flex items-center gap-2 text-[#111111] font-bold text-xs uppercase tracking-wider">
                      <Coins className="h-4 w-4" />
                      Savings & Income Input
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[9px] uppercase font-bold text-neutral-500">Annual Income</label>
                        <input 
                          type="text" 
                          placeholder="e.g. 80000, 75k" 
                          id="annualIncomeInput"
                          defaultValue={answers.annualIncome}
                          className="w-full bg-white border-2 border-[#111111] rounded-xl px-4 py-2.5 text-sm text-[#111111] focus:outline-none focus:bg-neutral-50"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] uppercase font-bold text-neutral-500">Total Savings</label>
                        <input 
                          type="text" 
                          placeholder="e.g. 15000, 20k" 
                          id="savingsInput"
                          defaultValue={answers.savings}
                          className="w-full bg-white border-2 border-[#111111] rounded-xl px-4 py-2.5 text-sm text-[#111111] focus:outline-none focus:bg-neutral-50"
                        />
                      </div>
                    </div>

                    <div className="flex gap-2 justify-end pt-2">
                      <button 
                        onClick={handleFinancialPrivacy}
                        className="text-xs font-bold px-4 py-2 rounded-xl border-2 border-[#111111] bg-white hover:bg-neutral-50 transition-all"
                      >
                        Keep Private (Skip)
                      </button>
                      <button 
                        onClick={() => {
                          const income = (document.getElementById("annualIncomeInput") as HTMLInputElement)?.value || "";
                          const savings = (document.getElementById("savingsInput") as HTMLInputElement)?.value || "";
                          submitAnswer(`Income: $${income || "0"}, Savings: $${savings || "0"}`, {
                            annualIncome: income,
                            savings: savings
                          });
                        }}
                        className="text-xs font-bold px-5 py-2.5 rounded-xl bg-[#E7B511] hover:bg-[#E7B511]/90 text-[#111111] border-2 border-[#111111] shadow-[2px_2px_0px_0px_rgba(17,17,17,1)] active:translate-y-0.5 active:shadow-none transition-all"
                      >
                        Save & Continue
                      </button>
                    </div>
                  </div>
                )}

                {/* Q5: Expenses Slider Options */}
                {step === 5 && (
                  <div className="bg-[#FAF5EB] border-2 border-[#111111] rounded-2xl p-5 space-y-4 animate-fadeIn">
                    <div className="flex items-center gap-2 text-[#111111] font-bold text-xs uppercase tracking-wider">
                      <TrendingDown className="h-4 w-4" />
                      Configure Monthly Budget
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex justify-between text-xs text-[#5c5950]">
                        <span>Standard ($500)</span>
                        <span className="text-[#111111] font-bold">Slider Tool</span>
                        <span>High Cost ($10,000)</span>
                      </div>
                      <input 
                        type="range" 
                        min="500" 
                        max="10000" 
                        step="100" 
                        defaultValue="2500"
                        id="expenseSlider"
                        onChange={(e) => {
                          const ind = document.getElementById("expInd");
                          if (ind) ind.innerText = `$${parseFloat(e.target.value).toLocaleString()}/mo`;
                        }}
                        className="w-full accent-[#111111] h-2 bg-[#EFDFBB] rounded-lg appearance-none cursor-pointer border border-[#111111]"
                      />
                      <div className="text-center text-xl font-extrabold text-[#111111]" id="expInd">
                        $2,500/mo
                      </div>
                    </div>

                    <div className="flex gap-2 justify-end pt-2">
                      <button 
                        onClick={handleExpensesPrivacy}
                        className="text-xs font-bold px-4 py-2 rounded-xl border-2 border-[#111111] bg-white hover:bg-neutral-50 transition-all"
                      >
                        Use Default ($2,500/mo)
                      </button>
                      <button 
                        onClick={() => {
                          const val = (document.getElementById("expenseSlider") as HTMLInputElement)?.value || "2500";
                          submitAnswer(`$${val}/month`);
                        }}
                        className="text-xs font-bold px-5 py-2.5 rounded-xl bg-[#E7B511] hover:bg-[#E7B511]/90 text-[#111111] border-2 border-[#111111] shadow-[2px_2px_0px_0px_rgba(17,17,17,1)] active:translate-y-0.5 active:shadow-none transition-all"
                      >
                        Save & Continue
                      </button>
                    </div>
                  </div>
                )}

                {/* Q6: Timeframe select pills */}
                {step === 6 && (
                  <div className="flex flex-wrap gap-2 mb-2 animate-fadeIn">
                    {["3 Months", "6 Months", "1 Year", "2 Years"].map((time) => (
                      <button 
                        key={time}
                        onClick={() => submitAnswer(time)}
                        className="text-xs font-bold px-4 py-2.5 rounded-xl border-2 border-[#111111] bg-white hover:bg-[#E7B511] transition-all cursor-pointer"
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                )}

                {/* Q7: Career Goal pills */}
                {step === 7 && (
                  <div className="flex flex-wrap gap-2 mb-2 animate-fadeIn">
                    {["Software Engineer", "Freelance Consultant", "Content Creator", "Founding a Startup", "Returning to School"].map((target) => (
                      <button 
                        key={target}
                        onClick={() => submitAnswer(target)}
                        className="text-xs font-bold px-4 py-2.5 rounded-xl border-2 border-[#111111] bg-white hover:bg-[#E7B511] transition-all cursor-pointer"
                      >
                        {target}
                      </button>
                    ))}
                  </div>
                )}

                {/* Standard Message Form */}
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    submitAnswer();
                  }}
                  className="flex gap-3"
                >
                  <input 
                    type="text" 
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder={
                      step === 3 || step === 5 
                        ? "Select options above or write custom metrics..." 
                        : "Type your answer here..."
                    }
                    className="flex-1 bg-white border-2 border-[#111111] rounded-xl px-5 py-4 text-sm text-[#111111] placeholder-neutral-400 focus:outline-none focus:bg-neutral-50 transition-all"
                    disabled={isLoading}
                  />
                  <button 
                    type="submit" 
                    className="bg-[#111111] hover:bg-neutral-900 active:translate-y-0.5 text-white font-bold rounded-xl p-4 px-5 border-2 border-[#111111] flex items-center justify-center transition-all cursor-pointer"
                    disabled={isLoading || (!inputValue.trim() && step !== 3 && step !== 5)}
                  >
                    <ArrowRight className="h-5 w-5" />
                  </button>
                </form>

              </div>

            </div>

            {/* Right Column: Live Runway Simulator Sandbox */}
            <div className="w-full lg:w-[380px] bg-white border-2 border-[#111111] rounded-3xl p-6 lg:p-8 flex flex-col justify-between shadow-[6px_6px_0px_0px_rgba(17,17,17,1)] h-fit space-y-6">
              
              <div className="space-y-1">
                <h2 className="font-extrabold text-base text-[#111111] uppercase tracking-wider flex items-center gap-2">
                  <Coins className="h-5 w-5 text-[#E7B511]" />
                  Live Sandbox
                </h2>
                <p className="text-xs text-[#5c5950]">Calibrate your parameters to simulate your transition safety net.</p>
              </div>

              {/* Graphic Runway Meter */}
              <div className="bg-[#FAF5EB] border-2 border-[#111111] rounded-2xl p-5 space-y-5">
                <div>
                  <div className="flex justify-between items-center text-xs text-[#5c5950] mb-2">
                    <span>Est. Runway Length</span>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wide border-2 border-[#111111] ${
                      liveStatus === "safe" ? "bg-[#4A6B53] text-white" :
                      liveStatus === "moderate" ? "bg-[#E7B511] text-[#111111]" :
                      "bg-[#B85A38] text-white"
                    }`}>
                      {liveStatus}
                    </span>
                  </div>

                  <div className="text-4xl font-extrabold text-[#111111] flex items-baseline gap-1">
                    {liveRunway} <span className="text-sm font-normal text-neutral-500">months</span>
                  </div>
                </div>

                {/* Progress bar fill */}
                <div className="w-full bg-white h-4 rounded-lg overflow-hidden border-2 border-[#111111] p-0.5">
                  <div 
                    className={`h-full transition-all duration-500 rounded-md ${
                      liveStatus === "safe" ? "bg-[#4A6B53]" :
                      liveStatus === "moderate" ? "bg-[#E7B511]" :
                      "bg-[#B85A38]"
                    }`}
                    style={{ width: `${Math.min(100, (liveRunway / 12) * 100)}%` }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-neutral-200 pt-4 text-xs">
                  <div>
                    <span className="block text-neutral-400 uppercase text-[9px] font-bold">Pivot Target</span>
                    <span className="font-extrabold text-[#111111] text-sm">{sandboxTimeline} months</span>
                  </div>
                  <div>
                    <span className="block text-neutral-400 uppercase text-[9px] font-bold">Savings Deficit</span>
                    <span className="font-extrabold text-[#111111] text-sm">
                      {liveShortfall > 0 ? `$${liveShortfall.toLocaleString()}` : "Safe Runway"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Adjust sliders manually */}
              <div className="space-y-4 pt-2">
                <h3 className="text-xs font-extrabold text-[#111111] uppercase tracking-wider border-b-2 border-neutral-100 pb-2">Sandbox Config</h3>
                
                <div className="space-y-3 text-xs">
                  <div>
                    <div className="flex justify-between text-neutral-500 mb-1">
                      <span>Total Savings Available</span>
                      <span className="text-neutral-800 font-bold">${sandboxSavings.toLocaleString()}</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="50000" 
                      step="500"
                      value={sandboxSavings}
                      onChange={(e) => setSandboxSavings(parseInt(e.target.value))}
                      className="w-full accent-[#111111] h-1.5 bg-[#EFDFBB] rounded-lg appearance-none cursor-pointer border border-[#111111]"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-neutral-500 mb-1">
                      <span>Monthly Expenses</span>
                      <span className="text-neutral-800 font-bold">${sandboxExpenses.toLocaleString()}/mo</span>
                    </div>
                    <input 
                      type="range" 
                      min="500" 
                      max="10000" 
                      step="100"
                      value={sandboxExpenses}
                      onChange={(e) => setSandboxExpenses(parseInt(e.target.value))}
                      className="w-full accent-[#111111] h-1.5 bg-[#EFDFBB] rounded-lg appearance-none cursor-pointer border border-[#111111]"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-neutral-500 mb-1">
                      <span>Pivot Timeframe</span>
                      <span className="text-neutral-800 font-bold">{sandboxTimeline} months</span>
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

              {/* Interactive warning text blocks */}
              <div className="rounded-xl border border-neutral-200 bg-[#FAF5EB] p-4 text-xs text-[#5c5950] leading-relaxed">
                {liveStatus === "safe" && (
                  <p className="flex gap-2 items-start text-emerald-800">
                    <ShieldCheck className="h-4.5 w-4.5 shrink-0 text-[#4A6B53]" />
                    <span><strong>Low Risk Profile:</strong> Savings support a 6+ month emergency runway. This provides optimal flexibility to acquire skills and test network entries safely.</span>
                  </p>
                )}
                {liveStatus === "moderate" && (
                  <p className="flex gap-2 items-start text-amber-800">
                    <Info className="h-4.5 w-4.5 shrink-0 text-[#D9A70D]" />
                    <span><strong>Moderate Risk Profile:</strong> 3-6 month runway is acceptable, but you should prioritize establishing a part-time/freelance bridge stream prior to quitting.</span>
                  </p>
                )}
                {liveStatus === "underfunded" && (
                  <p className="flex gap-2 items-start text-rose-800">
                    <ShieldAlert className="h-4.5 w-4.5 shrink-0 text-[#B85A38]" />
                    <span><strong>High Risk Profile:</strong> Emergency runway under 3 months. Postpone your quit date! Aim to save at least $15k or secure bridge income before resigning.</span>
                  </p>
                )}
              </div>
            </div>

          </div>
        )}

        {/* LOADING PROCESSING STATE */}
        {started && step === 11 && (
          <div className="flex-1 flex flex-col items-center justify-center py-24 text-center max-w-xl mx-auto space-y-6">
            <div className="relative flex items-center justify-center">
              <div className="h-16 w-16 rounded-full border-4 border-[#111111] border-t-transparent animate-spin"></div>
              <Compass className="h-6 w-6 text-[#111111] absolute animate-pulse" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-2xl font-extrabold tracking-tight text-[#111111]">Calibrating Phased Transition Blueprint...</h2>
              <p className="text-sm text-[#5c5950]">
                We are processing your interview variables, calculating standard runway thresholds, and querying the Gemini AI career path database.
              </p>
            </div>

            <div className="bg-white border-2 border-[#111111] rounded-2xl p-5 text-xs text-left text-[#5c5950] italic leading-relaxed shadow-[4px_4px_0px_0px_rgba(17,17,17,1)]">
              "A career transition is a sequence of risk-controlled milestones, not a blind jump. Autonomy and alignment require a bridge so you do not have to look back."
            </div>
          </div>
        )}

        {/* REPORT/DASHBOARD REPORT STATE */}
        {started && step === 12 && planData && (
          <div className="flex-1 flex flex-col gap-8 animate-fadeIn w-full">
            
            {/* Header Dashboard Banner */}
            <div className="relative rounded-3xl overflow-hidden border-2 border-[#111111] bg-white p-8 shadow-[6px_6px_0px_0px_rgba(17,17,17,1)]">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-[#E7B511] bg-[#111111] px-2.5 py-1 rounded uppercase tracking-wider block w-fit">
                    Calibration Report
                  </span>
                  <h1 className="text-3xl lg:text-4xl font-extrabold text-[#111111]">
                    {answers.name}'s Pivot Blueprint to {answers.targetRole}
                  </h1>
                  <p className="text-xs text-[#5c5950] max-w-xl">
                    Custom career path roadmap starting from {answers.currentRole} in {answers.location} over a {answers.timeframe} timeline.
                  </p>
                </div>

                {/* Score Widget */}
                <div className="bg-[#FAF5EB] border-2 border-[#111111] rounded-2xl p-4 flex items-center gap-4 min-w-[220px] shadow-[2px_2px_0px_0px_rgba(17,17,17,1)]">
                  <div className={`h-12 w-12 rounded-xl border-2 border-[#111111] flex items-center justify-center font-extrabold text-white text-lg ${
                    planData.financialMetrics.riskLevel === "low" ? "bg-[#4A6B53]" :
                    planData.financialMetrics.riskLevel === "medium" ? "bg-[#E7B511]" :
                    "bg-[#B85A38]"
                  }`}>
                    {planData.financialMetrics.runwayMonths}m
                  </div>
                  <div>
                    <span className="text-[9px] text-[#5c5950] font-bold uppercase tracking-wider block">Savings Runway</span>
                    <span className="text-[#111111] font-extrabold block text-sm">
                      {planData.financialMetrics.safetyNetStatus === "safe" ? "🟢 Secure Buffer" : 
                       planData.financialMetrics.safetyNetStatus === "moderate" ? "🟡 Moderate Buffer" : 
                       "🔴 Underfunded Runway"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b-2 border-[#111111] gap-2">
              <button 
                onClick={() => setActiveTab("plan")}
                className={`py-3 px-6 text-sm font-bold border-b-4 transition-all flex items-center gap-2 ${
                  activeTab === "plan" 
                    ? "border-[#111111] text-[#111111]" 
                    : "border-transparent text-neutral-500 hover:text-neutral-800"
                }`}
              >
                <Calendar className="h-4 w-4" />
                Transition Blueprint
              </button>
              <button 
                onClick={() => setActiveTab("journey")}
                className={`py-3 px-6 text-sm font-bold border-b-4 transition-all flex items-center gap-2 ${
                  activeTab === "journey" 
                    ? "border-[#111111] text-[#111111]" 
                    : "border-transparent text-neutral-500 hover:text-neutral-800"
                }`}
              >
                <Map className="h-4 w-4" />
                Journey & Obstacles
              </button>
              <button 
                onClick={() => setActiveTab("runway")}
                className={`py-3 px-6 text-sm font-bold border-b-4 transition-all flex items-center gap-2 ${
                  activeTab === "runway" 
                    ? "border-[#111111] text-[#111111]" 
                    : "border-transparent text-neutral-500 hover:text-neutral-800"
                }`}
              >
                <Coins className="h-4 w-4" />
                Simulation Sandbox
              </button>
            </div>

            {/* TAB CONTENT: PLAN */}
            {activeTab === "plan" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Immediate (30 days) */}
                <div className="bg-white border-2 border-[#111111] rounded-2xl p-6 lg:p-8 space-y-4 shadow-[4px_4px_0px_0px_rgba(17,17,17,1)]">
                  <div className="flex items-center gap-2.5 text-[#111111] font-bold text-sm border-b-2 border-neutral-100 pb-4 mb-2">
                    <span className="h-7 w-7 rounded-lg bg-[#EFDFBB] border border-[#111111] flex items-center justify-center text-xs text-[#111111]">1</span>
                    Immediate Steps (Next 30 Days)
                  </div>
                  <ul className="space-y-4">
                    {planData.plan.immediate.map((item, idx) => (
                      <li key={idx} className="text-xs text-neutral-700 flex items-start gap-3 leading-relaxed">
                        <CheckCircle className="h-4 w-4 text-[#4A6B53] shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Short term (1-3 months) */}
                <div className="bg-white border-2 border-[#111111] rounded-2xl p-6 lg:p-8 space-y-4 shadow-[4px_4px_0px_0px_rgba(17,17,17,1)]">
                  <div className="flex items-center gap-2.5 text-[#111111] font-bold text-sm border-b-2 border-neutral-100 pb-4 mb-2">
                    <span className="h-7 w-7 rounded-lg bg-[#EFDFBB] border border-[#111111] flex items-center justify-center text-xs text-[#111111]">2</span>
                    Short-Term Goals (Months 1-3)
                  </div>
                  <ul className="space-y-4">
                    {planData.plan.shortTerm.map((item, idx) => (
                      <li key={idx} className="text-xs text-neutral-700 flex items-start gap-3 leading-relaxed">
                        <CheckCircle className="h-4 w-4 text-[#4A6B53] shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Mid term */}
                <div className="bg-white border-2 border-[#111111] rounded-2xl p-6 lg:p-8 space-y-4 shadow-[4px_4px_0px_0px_rgba(17,17,17,1)]">
                  <div className="flex items-center gap-2.5 text-[#111111] font-bold text-sm border-b-2 border-neutral-100 pb-4 mb-2">
                    <span className="h-7 w-7 rounded-lg bg-[#EFDFBB] border border-[#111111] flex items-center justify-center text-xs text-[#111111]">3</span>
                    Mid-Term Strategy ({answers.timeframe})
                  </div>
                  <ul className="space-y-4">
                    {planData.plan.midTerm.map((item, idx) => (
                      <li key={idx} className="text-xs text-neutral-700 flex items-start gap-3 leading-relaxed">
                        <CheckCircle className="h-4 w-4 text-[#4A6B53] shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Gigs & Credentials Grid block */}
                <div className="lg:col-span-2 bg-white border-2 border-[#111111] rounded-2xl p-6 lg:p-8 grid grid-cols-1 md:grid-cols-2 gap-8 shadow-[4px_4px_0px_0px_rgba(17,17,17,1)]">
                  <div>
                    <h3 className="font-bold text-[#111111] text-sm border-b-2 border-neutral-100 pb-3 mb-4 flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-[#E7B511]" />
                      Credentials & Portfolios Required
                    </h3>
                    <ul className="space-y-3">
                      {planData.plan.skillBuilding.map((item, idx) => (
                        <li key={idx} className="text-xs text-[#5c5950] flex items-start gap-2.5 leading-relaxed">
                          <ChevronRight className="h-4 w-4 text-[#111111] shrink-0 mt-0.5" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-bold text-[#111111] text-sm border-b-2 border-neutral-100 pb-3 mb-4 flex items-center gap-2">
                      <Coins className="h-4 w-4 text-[#E7B511]" />
                      Freelance / Bridge Income Sources
                    </h3>
                    <ul className="space-y-3">
                      {planData.plan.incomeBridges.map((item, idx) => (
                        <li key={idx} className="text-xs text-[#5c5950] flex items-start gap-2.5 leading-relaxed">
                          <ChevronRight className="h-4 w-4 text-[#111111] shrink-0 mt-0.5" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Safety Net Report */}
                <div className="bg-white border-2 border-[#111111] rounded-2xl p-6 lg:p-8 flex flex-col justify-between shadow-[4px_4px_0px_0px_rgba(17,17,17,1)]">
                  <div className="space-y-4">
                    <h3 className="font-bold text-[#111111] text-sm border-b-2 border-neutral-100 pb-3 mb-1">
                      🛡️ Financial Safety Net Evaluation
                    </h3>
                    <p className="text-xs text-[#5c5950] leading-relaxed">
                      {planData.plan.safetyNet}
                    </p>
                  </div>
                  <div className="mt-6 p-4 bg-[#FAF5EB] rounded-xl border border-[#DCCDA8]/50 text-[10px] text-neutral-500 leading-relaxed">
                    This evaluation assumes standard 6-month survival thresholds calibrated against local demographic indices in {answers.location}.
                  </div>
                </div>

              </div>
            )}

            {/* TAB CONTENT: JOURNEY */}
            {activeTab === "journey" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Left Matrix Column */}
                <div className="lg:col-span-2 space-y-6">
                  <h2 className="font-bold text-xl text-[#111111]">Obstacle Mitigation Matrix</h2>
                  <div className="space-y-4">
                    {planData.journey.obstacles.map((item, idx) => (
                      <div key={idx} className="bg-white border-2 border-[#111111] rounded-2xl p-6 space-y-3 shadow-[4px_4px_0px_0px_rgba(17,17,17,1)]">
                        <h3 className="text-sm font-extrabold text-[#B85A38] flex items-center gap-2">
                          <ShieldAlert className="h-4.5 w-4.5 shrink-0" />
                          {item.obstacle}
                        </h3>
                        <p className="text-xs text-[#5c5950] pl-6 leading-relaxed">
                          <strong className="text-[#111111]">Transition Strategy:</strong> {item.mitigation}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right Columns */}
                <div className="space-y-6">
                  
                  {/* Timeline Assessment Card */}
                  <div className="bg-white border-2 border-[#111111] rounded-2xl p-6 lg:p-8 space-y-4 shadow-[4px_4px_0px_0px_rgba(17,17,17,1)]">
                    <h3 className="font-bold text-[#111111] text-sm border-b-2 border-neutral-100 pb-3 flex items-center justify-between">
                      Timeline Feasibility
                      <span className={`text-[10px] uppercase font-extrabold px-2 py-0.5 rounded border-2 border-[#111111] ${
                        planData.journey.timelineRealityCheck.rating === "realistic" ? "bg-[#4A6B53] text-white" :
                        planData.journey.timelineRealityCheck.rating === "optimistic" ? "bg-[#E7B511] text-[#111111]" :
                        "bg-[#B85A38] text-white"
                      }`}>
                        {planData.journey.timelineRealityCheck.rating}
                      </span>
                    </h3>
                    
                    <p className="text-xs text-[#5c5950] leading-relaxed">
                      {planData.journey.timelineRealityCheck.assessment}
                    </p>

                    <div className="bg-[#FAF5EB] border border-[#111111]/10 rounded-xl p-4 text-xs text-[#111111] leading-relaxed">
                      <strong>Coach Recommendation:</strong> {planData.journey.timelineRealityCheck.advice}
                    </div>
                  </div>

                  {/* Psychological wave */}
                  <div className="bg-white border-2 border-[#111111] rounded-2xl p-6 lg:p-8 space-y-4 shadow-[4px_4px_0px_0px_rgba(17,17,17,1)]">
                    <h3 className="font-bold text-[#111111] text-sm border-b-2 border-neutral-100 pb-3">
                      Psychological Phase Calendar
                    </h3>

                    <div className="relative border-l-2 border-[#111111] pl-5 space-y-6 ml-2">
                      {planData.journey.emotionalPhases.map((phase, idx) => (
                        <div key={idx} className="relative">
                          <span className="absolute -left-[28px] top-0.5 h-4 w-4 rounded-full bg-[#E7B511] border-2 border-[#111111] flex items-center justify-center text-[8px] text-[#111111] font-bold">
                            {idx === 0 ? <Smile className="h-2.5 w-2.5" /> : idx === 1 ? <Frown className="h-2.5 w-2.5" /> : <Meh className="h-2.5 w-2.5" />}
                          </span>
                          <span className="block text-[9px] text-[#E7B511] font-bold uppercase tracking-wider">{phase.duration}</span>
                          <h4 className="text-xs font-bold text-[#111111] mt-0.5">{phase.phaseName}</h4>
                          <p className="text-[11px] text-[#5c5950] mt-1 leading-relaxed">{phase.description}</p>
                          <p className="text-[10px] text-neutral-400 mt-1 italic">💡 Tip: {phase.tips}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

              </div>
            )}

            {/* TAB CONTENT: RUNWAY SANDBOX */}
            {activeTab === "runway" && (
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
                        <span className="text-neutral-800 font-bold">${sandboxSavings.toLocaleString()}</span>
                      </div>
                      <input 
                        type="range" 
                        min="0" 
                        max="50000" 
                        step="500"
                        value={sandboxSavings}
                        onChange={(e) => setSandboxSavings(parseInt(e.target.value))}
                        className="w-full accent-[#111111] h-1.5 bg-[#EFDFBB] rounded-lg appearance-none cursor-pointer border border-[#111111]"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-xs text-neutral-400 mb-1">
                        <span>Average Monthly Cost</span>
                        <span className="text-neutral-800 font-bold">${sandboxExpenses.toLocaleString()}/mo</span>
                      </div>
                      <input 
                        type="range" 
                        min="500" 
                        max="10000" 
                        step="100"
                        value={sandboxExpenses}
                        onChange={(e) => setSandboxExpenses(parseInt(e.target.value))}
                        className="w-full accent-[#111111] h-1.5 bg-[#EFDFBB] rounded-lg appearance-none cursor-pointer border border-[#111111]"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-xs text-neutral-400 mb-1">
                        <span>Transition Target Duration</span>
                        <span className="text-neutral-800 font-bold">{sandboxTimeline} months</span>
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
                      <span className="text-xs text-neutral-400 block uppercase font-bold text-[9px]">Est. Savings Runway</span>
                      <div className="text-4xl font-extrabold text-[#111111] flex items-baseline gap-1 mt-1">
                        {liveRunway} <span className="text-sm font-normal text-neutral-500">months</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-xs text-neutral-400 block uppercase font-bold text-[9px]">Standard Emergency Buffer (6m)</span>
                      <div className="text-xl font-bold text-[#111111] mt-1">
                        ${liveBuffer.toLocaleString()}
                      </div>
                    </div>

                    <div>
                      <span className="text-xs text-neutral-400 block uppercase font-bold text-[9px]">Total Savings Shortfall</span>
                      <div className="text-xl font-bold text-[#B85A38] mt-1">
                        {liveShortfall > 0 ? `$${liveShortfall.toLocaleString()}` : "$0 (Secure Runway)"}
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#FAF5EB] border-2 border-[#111111] rounded-2xl p-6 space-y-4">
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#111111]">Runway360 Assessment</h4>
                    
                    <div className="flex items-center gap-3">
                      <div className={`h-8 w-8 rounded-full border-2 border-[#111111] flex items-center justify-center font-bold text-white text-xs ${
                        liveStatus === "safe" ? "bg-[#4A6B53]" :
                        liveStatus === "moderate" ? "bg-[#E7B511]" :
                        "bg-[#B85A38]"
                      }`}>
                        {liveStatus === "safe" ? "✓" : "!"}
                      </div>
                      <div>
                        <span className="text-[10px] text-neutral-500 block uppercase">Calculated Status</span>
                        <span className="text-xs font-bold text-[#111111] capitalize">{liveStatus} Safety Net</span>
                      </div>
                    </div>

                    <p className="text-xs text-[#5c5950] leading-relaxed">
                      {liveStatus === "safe" && "Your financial plan is solid. You have a runway extending beyond 6 months, giving you a strong emergency buffer to focus on acquiring skills and networking without immediate financial pressure."}
                      {liveStatus === "moderate" && "You are in a moderate safety zone. While your savings runway is decent, it does not fully cover a prolonged transition. You should secure side-gigs or contract roles early on to extend your runway."}
                      {liveStatus === "underfunded" && "Your runway is currently underfunded. We strongly suggest delaying your quit date to build a stronger buffer, or prioritizing part-time bridge roles immediately upon starting your pivot."}
                    </p>
                  </div>

                </div>

              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
}
