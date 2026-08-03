"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
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
  Info
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
  const [adaptiveQuestions, setAdaptiveQuestions] = useState<{ id: number; question: string; answer: string | null; type: string }[]>([]);

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

  // Helper: Convert timeline string to months
  function parseTimelineToMonths(timeline: string): number {
    const clean = timeline.toLowerCase();
    const match = clean.match(/(\d+)/);
    if (!match) return 6;
    const num = parseInt(match[1]);
    if (clean.includes("year") || clean.includes("yr")) return num * 12;
    return num;
  }

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
          { sender: "bot", text: "Welcome to Runway360. Let's design a secure, highly calibrated roadmap for your career transition." },
          { sender: "bot", text: "First, what is your name?" }
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
  const submitAnswer = async (customAnswer?: string, customFinancials?: { annualIncome?: string; savings?: string }) => {
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
      updatedAnswers.annualIncome = customFinancials.annualIncome || "";
      updatedAnswers.savings = customFinancials.savings || "";
    }
    setAnswers(updatedAnswers);

    try {
      const body: Record<string, unknown> = {
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
    setMessages((prev) => [...prev, { sender: "bot", text: "Analyzing calculations, configuring risk matrix, and calling coach protocols. Stand by..." }]);
    
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

  // Skip/Privacy Helper for Step 3 (Savings & Income)
  const handleFinancialPrivacy = () => {
    submitAnswer("Kept Private", { annualIncome: "0", savings: "0" });
  };

  // Skip/Privacy Helper for Step 5 (Expenses)
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
    <div className="flex flex-col flex-1 bg-[#090907] text-[#faf9f6] min-h-screen font-sans selection:bg-[#E7B511] selection:text-[#090907]">
      
      {/* Premium Navigation Header */}
      <header className="border-b border-[#E7B511]/10 bg-[#090907]/90 backdrop-blur-lg sticky top-0 z-50 px-6 py-4 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-[#E7B511] to-[#DCCDA8] flex items-center justify-center shadow-lg shadow-[#E7B511]/15">
            <Compass className="h-5 w-5 text-[#090907]" />
          </div>
          <div>
            <span className="font-bold tracking-wider text-xl uppercase bg-gradient-to-r from-[#faf9f6] via-[#DCCDA8] to-[#E7B511] bg-clip-text text-transparent">
              Runway360
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {started && (
            <button 
              onClick={resetApp} 
              className="flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-xl border border-[#DCCDA8]/20 text-[#DCCDA8] hover:text-white hover:bg-[#E7B511]/10 hover:border-[#E7B511]/50 transition-all duration-300 shadow-sm"
            >
              <RefreshCw className="h-3 w-3 animate-spin-slow" />
              Restart Audit
            </button>
          )}

          {status === "authenticated" ? (
            <div className="flex items-center gap-2.5 bg-[#12120e] border border-[#DCCDA8]/10 rounded-2xl p-1 pr-3">
              {session.user?.image ? (
                <img 
                  src={session.user.image} 
                  alt={session.user.name || "User"} 
                  className="h-7 w-7 rounded-lg object-cover ring-1 ring-[#E7B511]/40"
                />
              ) : (
                <div className="h-7 w-7 rounded-lg bg-[#E7B511] text-[#090907] flex items-center justify-center font-bold text-xs">
                  {session.user?.name?.[0] || "U"}
                </div>
              )}
              <span className="text-xs text-neutral-300 font-semibold hidden md:inline">{session.user?.name}</span>
              <button 
                onClick={() => signOut()}
                className="text-xs text-neutral-400 hover:text-rose-400 p-1 px-2.5 rounded-lg hover:bg-rose-500/10 transition-colors ml-1"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <button 
              onClick={() => signIn("google")}
              className="flex items-center gap-2 text-xs font-bold px-4 py-2.5 rounded-xl bg-gradient-to-tr from-[#E7B511] to-[#DCCDA8] text-[#090907] hover:scale-102 active:scale-98 transition-all duration-200 shadow-md shadow-[#E7B511]/5"
            >
              Sign In with Google
            </button>
          )}
        </div>
      </header>

      {/* Main Wrapper */}
      <div className="flex flex-1 flex-col lg:flex-row max-w-7xl w-full mx-auto p-4 lg:p-8 gap-8 items-stretch">
        
        {/* LANDING MARKETING PAGE STATE */}
        {!started && (
          <div className="flex-1 flex flex-col gap-16 py-8">
            
            {/* Hero & Marketing Graphic Split */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              
              {/* Left Column: Bold Copy */}
              <div className="lg:col-span-7 space-y-6 text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#E7B511]/20 bg-[#E7B511]/5 text-xs text-[#E7B511] font-semibold tracking-wider uppercase">
                  <Sparkles className="h-3.5 w-3.5" />
                  Calibrate Your Big Career Leap
                </div>

                <h1 className="text-4xl lg:text-6xl font-extrabold tracking-tight leading-tight">
                  Your Career Pivot, <br />
                  <span className="bg-gradient-to-r from-[#E7B511] to-[#DCCDA8] bg-clip-text text-transparent">
                    Fully Calibrated.
                  </span>
                </h1>

                <p className="text-[#DCCDA8] text-base lg:text-lg leading-relaxed max-w-xl">
                  Quitting is easy. Landing safely is the real work. Runway360 is a supportive, math-grounded transition system built for young professionals. We assess your financial runway sandbox, customize adaptive queries via Gemini AI, and map your emotional journey.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 pt-2">
                  <button 
                    onClick={startInterview}
                    className="flex items-center justify-center gap-2 bg-[#E7B511] hover:bg-[#E7B511]/90 active:scale-95 text-[#090907] font-bold px-8 py-4 rounded-2xl shadow-xl shadow-[#E7B511]/15 transition-all duration-300"
                  >
                    Start Interactive Audit
                    <ArrowUpRight className="h-4.5 w-4.5" />
                  </button>
                </div>
              </div>

              {/* Right Column: Generated 3D Visual Rendering */}
              <div className="lg:col-span-5 relative group">
                <div className="absolute -inset-1 rounded-2xl bg-gradient-to-tr from-[#E7B511] to-[#DCCDA8] opacity-35 blur-xl group-hover:opacity-50 transition duration-1000"></div>
                <div className="relative border border-[#E7B511]/20 bg-[#090907] rounded-2xl overflow-hidden shadow-2xl">
                  <Image 
                    src="/hero_graphic.jpg" 
                    alt="Runway360 Premium Graphics Render"
                    width={1000}
                    height={562}
                    className="w-full object-cover aspect-video hover:scale-[1.02] transition-transform duration-700"
                    priority
                  />
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-[#090907] via-[#090907]/40 to-transparent p-4 flex justify-between items-center text-xs text-[#DCCDA8]">
                    <span>Conceptual Path Render</span>
                    <span className="font-semibold text-[#E7B511]">Calculated Runway 360°</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Core Pillars / Three-Column Feature Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              <div className="bg-[#12120e]/60 border border-[#E7B511]/10 rounded-2xl p-6 hover:border-[#E7B511]/30 transition-all duration-300 space-y-4">
                <div className="h-10 w-10 rounded-xl bg-[#E7B511]/10 border border-[#E7B511]/30 flex items-center justify-center text-[#E7B511]">
                  <Coins className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-[#faf9f6] text-lg">Financial Risk Sandbox</h3>
                <p className="text-sm text-[#DCCDA8]/80 leading-relaxed">
                  Real-time interactive math modeling. Slide your savings, expenses, and timeline parameters to immediately evaluate your safety net and calculate cost buffers.
                </p>
              </div>

              <div className="bg-[#12120e]/60 border border-[#E7B511]/10 rounded-2xl p-6 hover:border-[#E7B511]/30 transition-all duration-300 space-y-4">
                <div className="h-10 w-10 rounded-xl bg-[#E7B511]/10 border border-[#E7B511]/30 flex items-center justify-center text-[#E7B511]">
                  <Sparkles className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-[#faf9f6] text-lg">Adaptive LLM Coaching</h3>
                <p className="text-sm text-[#DCCDA8]/80 leading-relaxed">
                  After assessing static parameters, Gemini AI generates three adaptive follow-ups custom-fit to test your psychological readiness, skill barriers, and pivot commitment.
                </p>
              </div>

              <div className="bg-[#12120e]/60 border border-[#E7B511]/10 rounded-2xl p-6 hover:border-[#E7B511]/30 transition-all duration-300 space-y-4">
                <div className="h-10 w-10 rounded-xl bg-[#E7B511]/10 border border-[#E7B511]/30 flex items-center justify-center text-[#E7B511]">
                  <Map className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-[#faf9f6] text-lg">Visual Blueprints & Charts</h3>
                <p className="text-sm text-[#DCCDA8]/80 leading-relaxed">
                  Get a phased 30-day, 3-month, and mid-term roadmap checklist, alongside emotional phase mapping to outline when you will experience standard pivot hurdles.
                </p>
              </div>

            </div>

            {/* How it Works / Trust Process */}
            <div className="border border-[#E7B511]/10 rounded-3xl p-8 bg-[#12120e]/20 max-w-4xl mx-auto w-full text-center space-y-8">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-[#faf9f6]">The Calibration Pipeline</h2>
                <p className="text-xs text-[#DCCDA8]">Four structured phases to map out your pivot</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 text-sm text-left">
                <div className="space-y-2 border-l-2 border-[#E7B511]/30 pl-4 py-1">
                  <span className="text-xs font-bold text-[#E7B511]">Phase 01</span>
                  <h4 className="font-semibold text-white">Profile Intake</h4>
                  <p className="text-xs text-[#DCCDA8]/80">Demographics, income metrics, and location criteria.</p>
                </div>
                <div className="space-y-2 border-l-2 border-[#E7B511]/30 pl-4 py-1">
                  <span className="text-xs font-bold text-[#E7B511]">Phase 02</span>
                  <h4 className="font-semibold text-white">Adaptive Prompts</h4>
                  <p className="text-xs text-[#DCCDA8]/80">Three dynamic questions testing target hurdles.</p>
                </div>
                <div className="space-y-2 border-l-2 border-[#E7B511]/30 pl-4 py-1">
                  <span className="text-xs font-bold text-[#E7B511]">Phase 03</span>
                  <h4 className="font-semibold text-white">Sandbox Modeling</h4>
                  <p className="text-xs text-[#DCCDA8]/80">Interactive sliding parameters to adjust metrics.</p>
                </div>
                <div className="space-y-2 border-l-2 border-[#E7B511]/30 pl-4 py-1">
                  <span className="text-xs font-bold text-[#E7B511]">Phase 04</span>
                  <h4 className="font-semibold text-white">Full Blueprint</h4>
                  <p className="text-xs text-[#DCCDA8]/80">Deliver complete phased roadmaps & obstacles checklists.</p>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* ACTIVE QUESTIONNAIRE STATE */}
        {started && step <= 10 && (
          <div className="flex-1 flex flex-col lg:flex-row gap-8 items-stretch w-full">
            
            {/* Left Box: Chatbot Panel */}
            <div className="flex-1 flex flex-col bg-[#12120e]/60 border border-[#E7B511]/15 rounded-3xl overflow-hidden shadow-2xl h-[600px] lg:h-[720px] backdrop-blur-xl">
              
              {/* Header inside Panel */}
              <div className="bg-[#090907]/60 border-b border-[#E7B511]/10 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-[#E7B511] animate-ping"></div>
                  <span className="text-xs font-bold uppercase tracking-wider text-[#DCCDA8]">Intake Pipeline ({step}/10)</span>
                </div>
                <span className="text-[10px] text-neutral-500 font-mono">ID: {interviewId?.substring(0, 13)}...</span>
              </div>

              {/* Message List */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {messages.map((msg, idx) => (
                  <div 
                    key={idx} 
                    className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div 
                      className={`max-w-[80%] rounded-2xl px-5 py-3.5 text-sm leading-relaxed shadow-lg ${
                        msg.sender === "user" 
                          ? "bg-gradient-to-tr from-[#E7B511] to-[#DCCDA8] text-[#090907] font-bold rounded-tr-none" 
                          : "bg-[#161612] border border-[#DCCDA8]/10 text-[#faf9f6] rounded-tl-none"
                      }`}
                    >
                      {msg.sender === "bot" ? (
                        <div className="flex gap-3">
                          <div className="h-6 w-6 rounded-full bg-[#E7B511]/10 border border-[#E7B511]/30 flex items-center justify-center shrink-0 mt-0.5 text-xs text-[#E7B511] font-bold">
                            C
                          </div>
                          <span className="text-[#faf9f6]/95">{msg.text}</span>
                        </div>
                      ) : (
                        <span>{msg.text}</span>
                      )}
                    </div>
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-[#161612] border border-[#DCCDA8]/10 text-neutral-400 rounded-2xl rounded-tl-none px-5 py-3 text-sm flex items-center gap-2 shadow-md">
                      <div className="flex gap-1.5">
                        <span className="w-2 h-2 bg-[#E7B511] rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                        <span className="w-2 h-2 bg-[#E7B511] rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                        <span className="w-2 h-2 bg-[#E7B511] rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
                      </div>
                      <span className="text-xs text-[#DCCDA8]">Coach writing...</span>
                    </div>
                  </div>
                )}
                
                <div ref={chatEndRef} />
              </div>

              {/* Chat Input Controls */}
              <div className="border-t border-[#E7B511]/10 bg-[#090907]/60 p-6 space-y-4">
                
                {/* Q3: Financial Config Options */}
                {step === 3 && (
                  <div className="bg-[#12120e] border border-[#E7B511]/20 rounded-2xl p-5 space-y-4 animate-fadeIn">
                    <div className="flex items-center gap-2 text-[#E7B511] font-bold text-xs uppercase tracking-wider">
                      <Coins className="h-4 w-4" />
                      Configure Savings & Income
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-[#DCCDA8]">Annual Income</label>
                        <input 
                          type="text" 
                          placeholder="e.g. 75k, $80,000" 
                          id="annualIncomeInput"
                          defaultValue={answers.annualIncome}
                          className="w-full bg-[#090907] border border-[#DCCDA8]/20 rounded-xl px-4 py-2.5 text-sm text-[#faf9f6] focus:outline-none focus:border-[#E7B511] focus:ring-1 focus:ring-[#E7B511] transition-all"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-[#DCCDA8]">Total Savings</label>
                        <input 
                          type="text" 
                          placeholder="e.g. 15000, 20k" 
                          id="savingsInput"
                          defaultValue={answers.savings}
                          className="w-full bg-[#090907] border border-[#DCCDA8]/20 rounded-xl px-4 py-2.5 text-sm text-[#faf9f6] focus:outline-none focus:border-[#E7B511] focus:ring-1 focus:ring-[#E7B511] transition-all"
                        />
                      </div>
                    </div>

                    <div className="flex gap-2 justify-end pt-2">
                      <button 
                        onClick={handleFinancialPrivacy}
                        className="text-xs px-4 py-2 rounded-xl border border-[#DCCDA8]/25 text-[#DCCDA8] hover:bg-[#E7B511]/5 hover:text-white transition-all"
                      >
                        Keep Details Private
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
                        className="text-xs px-5 py-2.5 rounded-xl bg-[#E7B511] hover:bg-[#E7B511]/90 text-[#090907] font-bold shadow-lg shadow-[#E7B511]/10 transition-all"
                      >
                        Submit Metrics
                      </button>
                    </div>
                  </div>
                )}

                {/* Q5: Expenses Slider Options */}
                {step === 5 && (
                  <div className="bg-[#12120e] border border-[#E7B511]/20 rounded-2xl p-5 space-y-4 animate-fadeIn">
                    <div className="flex items-center gap-2 text-[#E7B511] font-bold text-xs uppercase tracking-wider">
                      <TrendingDown className="h-4 w-4" />
                      Configure Monthly Expenses
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex justify-between text-xs text-[#DCCDA8]">
                        <span>Moderate ($1,000)</span>
                        <span className="text-[#E7B511] font-semibold">Slide to adjust</span>
                        <span>Premium ($10,000)</span>
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
                        className="w-full accent-[#E7B511] h-1.5 bg-[#090907] rounded-lg appearance-none cursor-pointer"
                      />
                      <div className="text-center text-xl font-extrabold text-white" id="expInd">
                        $2,500/mo
                      </div>
                    </div>

                    <div className="flex gap-2 justify-end pt-2">
                      <button 
                        onClick={handleExpensesPrivacy}
                        className="text-xs px-4 py-2 rounded-xl border border-[#DCCDA8]/25 text-[#DCCDA8] hover:bg-[#E7B511]/5 hover:text-white transition-all"
                      >
                        Use Default ($2,500/mo)
                      </button>
                      <button 
                        onClick={() => {
                          const val = (document.getElementById("expenseSlider") as HTMLInputElement)?.value || "2500";
                          submitAnswer(`$${val}/month`);
                        }}
                        className="text-xs px-5 py-2.5 rounded-xl bg-[#E7B511] hover:bg-[#E7B511]/90 text-[#090907] font-bold shadow-lg shadow-[#E7B511]/10 transition-all"
                      >
                        Submit Budget
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
                        className="text-xs font-semibold px-4 py-2 rounded-xl border border-[#DCCDA8]/20 bg-[#12120e] text-[#DCCDA8] hover:bg-[#E7B511] hover:text-[#090907] hover:border-[#E7B511] transition-all duration-200"
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
                        className="text-xs font-semibold px-4 py-2.5 rounded-xl border border-[#DCCDA8]/20 bg-[#12120e] text-[#DCCDA8] hover:bg-[#E7B511] hover:text-[#090907] hover:border-[#E7B511] transition-all duration-200"
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
                        ? "Select options above or type custom metrics..." 
                        : "Write your answer here..."
                    }
                    className="flex-1 bg-[#12120e] border border-[#DCCDA8]/20 rounded-2xl px-5 py-4 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-[#E7B511] focus:ring-1 focus:ring-[#E7B511]/50 transition-all"
                    disabled={isLoading}
                  />
                  <button 
                    type="submit" 
                    className="bg-[#E7B511] hover:bg-[#E7B511]/90 active:scale-95 text-[#090907] font-bold rounded-2xl p-4 px-5 shadow-lg shadow-[#E7B511]/10 flex items-center justify-center transition-all duration-200"
                    disabled={isLoading || (!inputValue.trim() && step !== 3 && step !== 5)}
                  >
                    <ArrowRight className="h-5 w-5" />
                  </button>
                </form>

              </div>

            </div>

            {/* Right Box: Live Metrics Dashboard Widget */}
            <div className="w-full lg:w-[380px] bg-[#12120e]/60 border border-[#E7B511]/15 rounded-3xl p-6 lg:p-8 flex flex-col justify-between shadow-2xl h-fit space-y-6">
              <div className="space-y-1">
                <h2 className="font-bold text-lg text-white flex items-center gap-2">
                  <Coins className="h-5 w-5 text-[#E7B511]" />
                  Live Runway Indicator
                </h2>
                <p className="text-xs text-[#DCCDA8]">Calibrate your emergency parameters dynamically.</p>
              </div>

              {/* Graphic Runway Meter */}
              <div className="bg-[#090907]/60 border border-[#DCCDA8]/15 rounded-2xl p-5 space-y-5">
                <div>
                  <div className="flex justify-between items-center text-xs text-[#DCCDA8] mb-1.5">
                    <span>Est. Savings Runway</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wide border ${
                      liveStatus === "safe" ? "bg-emerald-950/40 border-emerald-900 text-emerald-400" :
                      liveStatus === "moderate" ? "bg-amber-950/40 border-amber-900 text-amber-400" :
                      "bg-rose-950/40 border-rose-900 text-rose-400"
                    }`}>
                      {liveStatus} runway
                    </span>
                  </div>

                  <div className="text-4xl font-extrabold text-white flex items-baseline gap-1">
                    {liveRunway} <span className="text-sm font-normal text-neutral-500">months</span>
                  </div>
                </div>

                {/* Progress bar fill */}
                <div className="w-full bg-[#090907] h-3 rounded-full overflow-hidden border border-[#DCCDA8]/10">
                  <div 
                    className={`h-full transition-all duration-500 rounded-full ${
                      liveStatus === "safe" ? "bg-emerald-500" :
                      liveStatus === "moderate" ? "bg-amber-500" :
                      "bg-rose-500"
                    }`}
                    style={{ width: `${Math.min(100, (liveRunway / 12) * 100)}%` }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-[#DCCDA8]/10 pt-4 text-xs">
                  <div>
                    <span className="block text-neutral-500 uppercase text-[9px] font-bold">Pivot Window</span>
                    <span className="font-bold text-white text-sm">{sandboxTimeline} months</span>
                  </div>
                  <div>
                    <span className="block text-neutral-500 uppercase text-[9px] font-bold">Shortfall</span>
                    <span className="font-bold text-white text-sm">
                      {liveShortfall > 0 ? `$${liveShortfall.toLocaleString()}` : "Safe Runway"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Adjust sliders manually */}
              <div className="space-y-4 pt-2">
                <h3 className="text-xs font-bold text-[#E7B511] uppercase tracking-wider">Calibration Sandbox</h3>
                
                <div className="space-y-3 text-xs">
                  <div>
                    <div className="flex justify-between text-neutral-400 mb-1">
                      <span>Total Savings Available</span>
                      <span className="text-white font-bold">${sandboxSavings.toLocaleString()}</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="50000" 
                      step="500"
                      value={sandboxSavings}
                      onChange={(e) => setSandboxSavings(parseInt(e.target.value))}
                      className="w-full accent-[#E7B511] h-1 bg-[#090907] rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-neutral-400 mb-1">
                      <span>Monthly Expenses</span>
                      <span className="text-white font-bold">${sandboxExpenses.toLocaleString()}/mo</span>
                    </div>
                    <input 
                      type="range" 
                      min="500" 
                      max="10000" 
                      step="100"
                      value={sandboxExpenses}
                      onChange={(e) => setSandboxExpenses(parseInt(e.target.value))}
                      className="w-full accent-[#E7B511] h-1 bg-[#090907] rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-neutral-400 mb-1">
                      <span>Pivot Timeframe</span>
                      <span className="text-white font-bold">{sandboxTimeline} months</span>
                    </div>
                    <input 
                      type="range" 
                      min="1" 
                      max="24" 
                      step="1"
                      value={sandboxTimeline}
                      onChange={(e) => setSandboxTimeline(parseInt(e.target.value))}
                      className="w-full accent-[#E7B511] h-1 bg-[#090907] rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Text warning blocks */}
              <div className="rounded-xl border border-[#DCCDA8]/10 bg-[#090907]/30 p-4 text-xs text-[#DCCDA8]/90 leading-relaxed">
                {liveStatus === "safe" && (
                  <p className="flex gap-2 items-start text-emerald-400">
                    <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5" />
                    <span><strong>Low Risk:</strong> Savings support a 6+ month emergency runway. This provides optimal flexibility to acquire credentials and test network entries safely.</span>
                  </p>
                )}
                {liveStatus === "moderate" && (
                  <p className="flex gap-2 items-start text-amber-400">
                    <Info className="h-4 w-4 shrink-0 mt-0.5" />
                    <span><strong>Moderate Risk:</strong> 3-6 month runway is acceptable, but you should prioritize establishing a part-time/freelance bridge stream prior to quitting.</span>
                  </p>
                )}
                {liveStatus === "underfunded" && (
                  <p className="flex gap-2 items-start text-rose-400">
                    <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
                    <span><strong>High Risk:</strong> Emergency runway under 3 months. Postpone your quit date! Aim to save at least $15k or secure bridge income before resigning.</span>
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
              <div className="h-16 w-16 rounded-full border-4 border-[#E7B511] border-t-transparent animate-spin"></div>
              <Compass className="h-6 w-6 text-[#E7B511] absolute animate-pulse" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-2xl font-bold tracking-tight text-white">Generating Phased Calibration Roadmap...</h2>
              <p className="text-sm text-[#DCCDA8]">
                We are processing your interview variables, calculating standard runway thresholds, and querying the Gemini AI career path optimizer.
              </p>
            </div>

            <div className="bg-[#12120e]/60 border border-[#E7B511]/15 rounded-2xl p-5 text-xs text-left text-[#DCCDA8]/90 italic leading-relaxed shadow-lg">
              "A career transition is a sequence of risk-controlled milestones, not a blind jump. Autonomy and alignment require a bridge so you do not have to look back."
            </div>
          </div>
        )}

        {/* REPORT/DASHBOARD REPORT STATE */}
        {started && step === 12 && planData && (
          <div className="flex-1 flex flex-col gap-8 animate-fadeIn w-full">
            
            {/* Header Dashboard Banner */}
            <div className="relative rounded-3xl overflow-hidden border border-[#E7B511]/25 bg-gradient-to-r from-[#12120e] via-[#090907] to-[#090907] p-8 shadow-xl">
              <div className="absolute right-0 top-0 h-full w-[350px] opacity-10 blur-xl pointer-events-none">
                <Image src="/hero_graphic.jpg" alt="Overlay graphic background" fill className="object-cover" />
              </div>
              
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
                <div className="space-y-2">
                  <span className="text-xs font-bold text-[#E7B511] uppercase tracking-widest block">Calibration Report Complete</span>
                  <h1 className="text-3xl lg:text-4xl font-extrabold text-white">
                    {answers.name}'s Roadmap to {answers.targetRole}
                  </h1>
                  <p className="text-sm text-[#DCCDA8] max-w-xl">
                    Custom career path roadmap starting from {answers.currentRole} in {answers.location} over a {answers.timeframe} timeline.
                  </p>
                </div>

                {/* Score Widget */}
                <div className="bg-[#090907]/90 border border-[#E7B511]/20 rounded-2xl p-4 flex items-center gap-4 min-w-[220px]">
                  <div className={`h-12 w-12 rounded-xl flex items-center justify-center font-extrabold text-white text-lg ${
                    planData.financialMetrics.riskLevel === "low" ? "bg-emerald-600 shadow-md shadow-emerald-600/10" :
                    planData.financialMetrics.riskLevel === "medium" ? "bg-amber-600 shadow-md shadow-amber-600/10" :
                    "bg-rose-600 shadow-md shadow-rose-600/10"
                  }`}>
                    {planData.financialMetrics.runwayMonths}m
                  </div>
                  <div>
                    <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider block">Savings Runway</span>
                    <span className="text-white font-extrabold block text-sm">
                      {planData.financialMetrics.safetyNetStatus === "safe" ? "🟢 Secure safety net" : 
                       planData.financialMetrics.safetyNetStatus === "moderate" ? "🟡 Moderate safety net" : 
                       "🔴 Underfunded safety net"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-[#E7B511]/15 gap-2">
              <button 
                onClick={() => setActiveTab("plan")}
                className={`py-3 px-6 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
                  activeTab === "plan" 
                    ? "border-[#E7B511] text-[#E7B511]" 
                    : "border-transparent text-neutral-400 hover:text-neutral-200"
                }`}
              >
                <Calendar className="h-4 w-4" />
                Transition Blueprint
              </button>
              <button 
                onClick={() => setActiveTab("journey")}
                className={`py-3 px-6 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
                  activeTab === "journey" 
                    ? "border-[#E7B511] text-[#E7B511]" 
                    : "border-transparent text-neutral-400 hover:text-neutral-200"
                }`}
              >
                <Map className="h-4 w-4" />
                Journey & Obstacles
              </button>
              <button 
                onClick={() => setActiveTab("runway")}
                className={`py-3 px-6 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
                  activeTab === "runway" 
                    ? "border-[#E7B511] text-[#E7B511]" 
                    : "border-transparent text-neutral-400 hover:text-neutral-200"
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
                <div className="bg-[#12120e]/60 border border-[#E7B511]/10 rounded-2xl p-6 lg:p-8 space-y-4">
                  <div className="flex items-center gap-2.5 text-[#E7B511] font-bold text-sm border-b border-[#E7B511]/15 pb-4 mb-2">
                    <span className="h-7 w-7 rounded-lg bg-[#E7B511]/10 border border-[#E7B511]/30 flex items-center justify-center text-xs">1</span>
                    Immediate Steps (Next 30 Days)
                  </div>
                  <ul className="space-y-4">
                    {planData.plan.immediate.map((item, idx) => (
                      <li key={idx} className="text-xs text-[#faf9f6]/90 flex items-start gap-3 leading-relaxed">
                        <CheckCircle className="h-4 w-4 text-[#E7B511] shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Short term (1-3 months) */}
                <div className="bg-[#12120e]/60 border border-[#E7B511]/10 rounded-2xl p-6 lg:p-8 space-y-4">
                  <div className="flex items-center gap-2.5 text-[#E7B511] font-bold text-sm border-b border-[#E7B511]/15 pb-4 mb-2">
                    <span className="h-7 w-7 rounded-lg bg-[#E7B511]/10 border border-[#E7B511]/30 flex items-center justify-center text-xs">2</span>
                    Short-Term Goals (Months 1-3)
                  </div>
                  <ul className="space-y-4">
                    {planData.plan.shortTerm.map((item, idx) => (
                      <li key={idx} className="text-xs text-[#faf9f6]/90 flex items-start gap-3 leading-relaxed">
                        <CheckCircle className="h-4 w-4 text-[#E7B511] shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Mid term */}
                <div className="bg-[#12120e]/60 border border-[#E7B511]/10 rounded-2xl p-6 lg:p-8 space-y-4">
                  <div className="flex items-center gap-2.5 text-[#E7B511] font-bold text-sm border-b border-[#E7B511]/15 pb-4 mb-2">
                    <span className="h-7 w-7 rounded-lg bg-[#E7B511]/10 border border-[#E7B511]/30 flex items-center justify-center text-xs">3</span>
                    Mid-Term Strategy ({answers.timeframe})
                  </div>
                  <ul className="space-y-4">
                    {planData.plan.midTerm.map((item, idx) => (
                      <li key={idx} className="text-xs text-[#faf9f6]/90 flex items-start gap-3 leading-relaxed">
                        <CheckCircle className="h-4 w-4 text-[#E7B511] shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Gigs & Credentials Grid block */}
                <div className="lg:col-span-2 bg-[#12120e]/60 border border-[#E7B511]/10 rounded-2xl p-6 lg:p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="font-bold text-[#faf9f6] text-sm border-b border-[#E7B511]/15 pb-3 mb-4 flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-[#E7B511]" />
                      Credentials & Portfolios Required
                    </h3>
                    <ul className="space-y-3">
                      {planData.plan.skillBuilding.map((item, idx) => (
                        <li key={idx} className="text-xs text-[#DCCDA8] flex items-start gap-2.5 leading-relaxed">
                          <ChevronRight className="h-4 w-4 text-[#E7B511] shrink-0 mt-0.5" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-bold text-[#faf9f6] text-sm border-b border-[#E7B511]/15 pb-3 mb-4 flex items-center gap-2">
                      <Coins className="h-4 w-4 text-[#E7B511]" />
                      Freelance / Bridge Income Sources
                    </h3>
                    <ul className="space-y-3">
                      {planData.plan.incomeBridges.map((item, idx) => (
                        <li key={idx} className="text-xs text-[#DCCDA8] flex items-start gap-2.5 leading-relaxed">
                          <ChevronRight className="h-4 w-4 text-[#E7B511] shrink-0 mt-0.5" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Safety Net Report */}
                <div className="bg-[#12120e]/60 border border-[#E7B511]/10 rounded-2xl p-6 lg:p-8 flex flex-col justify-between shadow-md">
                  <div className="space-y-4">
                    <h3 className="font-bold text-[#faf9f6] text-sm border-b border-[#E7B511]/15 pb-3 mb-1">
                      🛡️ Financial Safety Net Evaluation
                    </h3>
                    <p className="text-xs text-[#DCCDA8]/90 leading-relaxed">
                      {planData.plan.safetyNet}
                    </p>
                  </div>
                  <div className="mt-6 p-4 bg-[#090907]/60 rounded-xl border border-[#DCCDA8]/10 text-[10px] text-neutral-500 leading-relaxed">
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
                  <h2 className="font-bold text-xl text-white">Obstacle Mitigation Matrix</h2>
                  <div className="space-y-4">
                    {planData.journey.obstacles.map((item, idx) => (
                      <div key={idx} className="bg-[#12120e]/60 border border-[#E7B511]/10 rounded-2xl p-6 space-y-3">
                        <h3 className="text-sm font-extrabold text-rose-400 flex items-center gap-2">
                          <ShieldAlert className="h-4 w-4 shrink-0" />
                          {item.obstacle}
                        </h3>
                        <p className="text-xs text-[#DCCDA8]/90 pl-6 leading-relaxed">
                          <strong className="text-[#E7B511]">Transition Strategy:</strong> {item.mitigation}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right Columns */}
                <div className="space-y-6">
                  
                  {/* Timeline Assessment Card */}
                  <div className="bg-[#12120e]/60 border border-[#E7B511]/10 rounded-2xl p-6 lg:p-8 space-y-4">
                    <h3 className="font-bold text-[#faf9f6] text-sm border-b border-[#E7B511]/15 pb-3 flex items-center justify-between">
                      Timeline Feasibility
                      <span className={`text-[10px] uppercase font-extrabold px-2 py-0.5 rounded border ${
                        planData.journey.timelineRealityCheck.rating === "realistic" ? "bg-emerald-950/40 border-emerald-900 text-emerald-400" :
                        planData.journey.timelineRealityCheck.rating === "optimistic" ? "bg-amber-950/40 border-amber-900 text-amber-400" :
                        "bg-rose-950/40 border-rose-900 text-rose-400"
                      }`}>
                        {planData.journey.timelineRealityCheck.rating}
                      </span>
                    </h3>
                    
                    <p className="text-xs text-[#DCCDA8]/90 leading-relaxed">
                      {planData.journey.timelineRealityCheck.assessment}
                    </p>

                    <div className="bg-[#090907]/60 border border-[#DCCDA8]/10 rounded-xl p-4 text-xs text-[#E7B511] leading-relaxed">
                      <strong>Coach Recommendation:</strong> {planData.journey.timelineRealityCheck.advice}
                    </div>
                  </div>

                  {/* Psychological wave */}
                  <div className="bg-[#12120e]/60 border border-[#E7B511]/10 rounded-2xl p-6 lg:p-8 space-y-4">
                    <h3 className="font-bold text-[#faf9f6] text-sm border-b border-[#E7B511]/15 pb-3">
                      Psychological Phase Calendar
                    </h3>

                    <div className="relative border-l border-[#DCCDA8]/10 pl-5 space-y-6 ml-2">
                      {planData.journey.emotionalPhases.map((phase, idx) => (
                        <div key={idx} className="relative">
                          <span className="absolute -left-[27px] top-0.5 h-4 w-4 rounded-full bg-[#E7B511] border-2 border-[#090907] flex items-center justify-center text-[8px] text-[#090907] font-bold">
                            {idx === 0 ? <Smile className="h-2.5 w-2.5" /> : idx === 1 ? <Frown className="h-2.5 w-2.5" /> : <Meh className="h-2.5 w-2.5" />}
                          </span>
                          <span className="block text-[9px] text-[#E7B511] font-bold uppercase tracking-wider">{phase.duration}</span>
                          <h4 className="text-xs font-bold text-[#faf9f6] mt-0.5">{phase.phaseName}</h4>
                          <p className="text-[11px] text-[#DCCDA8]/95 mt-1 leading-relaxed">{phase.description}</p>
                          <p className="text-[10px] text-neutral-500 mt-1 italic">💡 Tip: {phase.tips}</p>
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
                <div className="bg-[#12120e]/60 border border-[#E7B511]/10 rounded-2xl p-6 lg:p-8 space-y-6">
                  <div>
                    <h3 className="font-bold text-[#faf9f6] text-lg mb-1">Adjust Parameters</h3>
                    <p className="text-xs text-[#DCCDA8]">Simulate alternative financial safety scenarios.</p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-xs text-neutral-400 mb-1">
                        <span>Total Savings Available</span>
                        <span className="text-white font-bold">${sandboxSavings.toLocaleString()}</span>
                      </div>
                      <input 
                        type="range" 
                        min="0" 
                        max="50000" 
                        step="500"
                        value={sandboxSavings}
                        onChange={(e) => setSandboxSavings(parseInt(e.target.value))}
                        className="w-full accent-[#E7B511] h-1.5 bg-[#090907] rounded-lg appearance-none cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-xs text-neutral-400 mb-1">
                        <span>Average Monthly Cost</span>
                        <span className="text-white font-bold">${sandboxExpenses.toLocaleString()}/mo</span>
                      </div>
                      <input 
                        type="range" 
                        min="500" 
                        max="10000" 
                        step="100"
                        value={sandboxExpenses}
                        onChange={(e) => setSandboxExpenses(parseInt(e.target.value))}
                        className="w-full accent-[#E7B511] h-1.5 bg-[#090907] rounded-lg appearance-none cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-xs text-neutral-400 mb-1">
                        <span>Transition Target Duration</span>
                        <span className="text-white font-bold">{sandboxTimeline} months</span>
                      </div>
                      <input 
                        type="range" 
                        min="1" 
                        max="24" 
                        step="1"
                        value={sandboxTimeline}
                        onChange={(e) => setSandboxTimeline(parseInt(e.target.value))}
                        className="w-full accent-[#E7B511] h-1.5 bg-[#090907] rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                {/* Mathematical output results */}
                <div className="lg:col-span-2 bg-[#12120e]/60 border border-[#E7B511]/10 rounded-2xl p-6 lg:p-8 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                  
                  <div className="space-y-5">
                    <div>
                      <span className="text-xs text-neutral-500 block uppercase font-bold text-[9px]">Est. Savings Runway</span>
                      <div className="text-4xl font-extrabold text-white flex items-baseline gap-1 mt-1">
                        {liveRunway} <span className="text-sm font-normal text-neutral-400">months</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-xs text-neutral-500 block uppercase font-bold text-[9px]">Standard Emergency Buffer (6m)</span>
                      <div className="text-xl font-bold text-[#faf9f6] mt-1">
                        ${liveBuffer.toLocaleString()}
                      </div>
                    </div>

                    <div>
                      <span className="text-xs text-neutral-500 block uppercase font-bold text-[9px]">Total Savings Shortfall</span>
                      <div className="text-xl font-bold text-rose-400 mt-1">
                        {liveShortfall > 0 ? `$${liveShortfall.toLocaleString()}` : "$0 (Secure Runway)"}
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#090907]/60 border border-[#DCCDA8]/15 rounded-2xl p-6 space-y-4">
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#E7B511]">Runway360 Assessment</h4>
                    
                    <div className="flex items-center gap-3">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-white text-xs ${
                        liveStatus === "safe" ? "bg-emerald-600 shadow-md" :
                        liveStatus === "moderate" ? "bg-amber-600 shadow-md" :
                        "bg-rose-600 shadow-md"
                      }`}>
                        {liveStatus === "safe" ? "✓" : "!"}
                      </div>
                      <div>
                        <span className="text-[10px] text-neutral-500 block uppercase">Calculated Status</span>
                        <span className="text-xs font-bold text-neutral-200 capitalize">{liveStatus} Safety Net</span>
                      </div>
                    </div>

                    <p className="text-xs text-[#DCCDA8]/90 leading-relaxed">
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
