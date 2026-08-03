"use client";

import { useState, useEffect, useRef } from "react";
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
  LogOut,
  ChevronRight,
  ShieldAlert,
  Frown,
  Meh,
  Smile
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
    if (answers.monthlyExpenses && !isNaN(parseFloat(answers.monthlyExpenses))) {
      setSandboxExpenses(parseFloat(answers.monthlyExpenses));
    }
    if (answers.savings && !isNaN(parseFloat(answers.savings))) {
      setSandboxSavings(parseFloat(answers.savings));
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
          { sender: "bot", text: "Hey! I'm your Runway360 coach. Let's design a secure, calculated roadmap for your career transition." },
          { sender: "bot", text: "First things first: What's your name?" }
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
      case 3: field = "savings"; break; // we save standard string representation
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
    setMessages((prev) => [...prev, { sender: "bot", text: "Analyzing your answers, calculating risk tables, and mapping your journey. Give me a moment..." }]);
    
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
    <div className="flex flex-col flex-1 bg-neutral-950 text-neutral-50 min-h-screen selection:bg-indigo-500 selection:text-white">
      {/* Premium Header */}
      <header className="border-b border-neutral-900 bg-neutral-950/80 backdrop-blur-md sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20">
            R
          </div>
          <div>
            <span className="font-semibold tracking-tight text-lg">Runway<span className="text-indigo-400">360</span></span>
            <span className="ml-2 text-xs px-2 py-0.5 rounded-full border border-neutral-800 text-neutral-400 bg-neutral-900/50">Gen Z Career Coach</span>
          </div>
        </div>

        {started && (
          <button 
            onClick={resetApp} 
            className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg border border-neutral-800 text-neutral-400 hover:text-neutral-50 hover:bg-neutral-900 transition-all duration-200"
          >
            <RefreshCw className="h-3 w-3" />
            Reset Session
          </button>
        )}
      </header>

      {/* Main Container */}
      <div className="flex flex-1 flex-col lg:flex-row max-w-7xl w-full mx-auto p-4 lg:p-6 gap-6">
        
        {/* LANDING STATE */}
        {!started && (
          <div className="flex-1 flex flex-col items-center justify-center py-12 px-4 text-center max-w-2xl mx-auto">
            <div className="h-16 w-16 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-indigo-400 mb-6 animate-pulse">
              <Sparkles className="h-8 w-8" />
            </div>
            
            <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-white via-neutral-100 to-neutral-500 bg-clip-text text-transparent mb-4">
              Map Your Career Leap With Absolute Math
            </h1>
            
            <p className="text-neutral-400 text-lg mb-8 leading-relaxed">
              Quitting your job is terrifying. Runway360 builds a personalized transition plan, calculates your financial runway sandbox, and maps your psychological phases. Supportive, direct, and zero corporate fluff.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
              <button 
                onClick={startInterview}
                className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-medium px-8 py-3.5 rounded-xl shadow-lg shadow-indigo-600/20 transition-all duration-200"
              >
                Start Career Audit
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
            
            <div className="mt-12 grid grid-cols-3 gap-6 w-full max-w-md text-xs text-neutral-500">
              <div>
                <span className="block font-semibold text-neutral-300 mb-1">10 Steps</span>
                Interactive intake
              </div>
              <div>
                <span className="block font-semibold text-neutral-300 mb-1">Live Runway</span>
                Dashboard sandbox
              </div>
              <div>
                <span className="block font-semibold text-neutral-300 mb-1">Actionable Plan</span>
                30-day milestones
              </div>
            </div>
          </div>
        )}

        {/* INTERVIEW STATE */}
        {started && step <= 10 && (
          <>
            {/* Left Column: Conversational Chat */}
            <div className="flex-1 flex flex-col bg-neutral-900/40 border border-neutral-900 rounded-2xl overflow-hidden h-[600px] lg:h-[700px] shadow-xl">
              
              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-4">
                {messages.map((msg, idx) => (
                  <div 
                    key={idx} 
                    className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div 
                      className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                        msg.sender === "user" 
                          ? "bg-indigo-600 text-white rounded-tr-none" 
                          : "bg-neutral-900/90 border border-neutral-800 text-neutral-100 rounded-tl-none shadow-md"
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-neutral-900/90 border border-neutral-800 text-neutral-400 rounded-2xl rounded-tl-none px-4 py-3 text-sm flex items-center gap-2 shadow-md">
                      <div className="flex gap-1">
                        <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                        <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                        <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
                      </div>
                      Runway360 is thinking...
                    </div>
                  </div>
                )}
                
                <div ref={chatEndRef} />
              </div>

              {/* Dynamic Interactive Input Overlay */}
              <div className="border-t border-neutral-900/80 bg-neutral-950/60 p-4 lg:p-6">
                
                {/* Step 3 Component: Income & Savings */}
                {step === 3 && (
                  <div className="space-y-4 mb-4 bg-neutral-900/50 border border-neutral-800/80 rounded-xl p-4 animate-fadeIn">
                    <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Configure Financial Baseline</h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-neutral-400 mb-1.5">Annual Income (e.g. 50k, 120000)</label>
                        <input 
                          type="text" 
                          placeholder="Annual Income" 
                          id="annualIncomeInput"
                          defaultValue={answers.annualIncome}
                          className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-neutral-100 focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-neutral-400 mb-1.5">Total Savings Available</label>
                        <input 
                          type="text" 
                          placeholder="Savings Balance" 
                          id="savingsInput"
                          defaultValue={answers.savings}
                          className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-neutral-100 focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>

                    <div className="flex gap-2 justify-end pt-2">
                      <button 
                        onClick={handleFinancialPrivacy}
                        className="text-xs px-3 py-1.5 rounded-lg border border-neutral-800 hover:bg-neutral-900 text-neutral-400 hover:text-neutral-200 transition-colors"
                      >
                        Keep Private (Skip)
                      </button>
                      <button 
                        onClick={() => {
                          const incomeVal = (document.getElementById("annualIncomeInput") as HTMLInputElement)?.value || "";
                          const savingsVal = (document.getElementById("savingsInput") as HTMLInputElement)?.value || "";
                          submitAnswer(`Income: $${incomeVal || "0"}, Savings: $${savingsVal || "0"}`, {
                            annualIncome: incomeVal,
                            savings: savingsVal
                          });
                        }}
                        className="text-xs px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors"
                      >
                        Save & Continue
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 5 Component: Expenses */}
                {step === 5 && (
                  <div className="space-y-4 mb-4 bg-neutral-900/50 border border-neutral-800/80 rounded-xl p-4 animate-fadeIn">
                    <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Calibrate Average Monthly Expenses</h3>
                    
                    <div>
                      <div className="flex justify-between text-xs text-neutral-400 mb-1">
                        <span>Low Cost ($500)</span>
                        <span className="text-indigo-400 font-medium">Interactive Slider</span>
                        <span>High Cost ($10,000+)</span>
                      </div>
                      <input 
                        type="range" 
                        min="500" 
                        max="10000" 
                        step="100" 
                        defaultValue="2500"
                        id="expenseSlider"
                        onChange={(e) => {
                          const indicator = document.getElementById("expenseValIndicator");
                          if (indicator) indicator.innerText = `$${parseFloat(e.target.value).toLocaleString()}/mo`;
                        }}
                        className="w-full accent-indigo-500 h-1.5 bg-neutral-950 rounded-lg appearance-none cursor-pointer"
                      />
                      <div className="text-center font-bold text-lg text-white mt-2" id="expenseValIndicator">
                        $2,500/mo
                      </div>
                    </div>

                    <div className="flex gap-2 justify-end pt-2">
                      <button 
                        onClick={handleExpensesPrivacy}
                        className="text-xs px-3 py-1.5 rounded-lg border border-neutral-800 hover:bg-neutral-900 text-neutral-400 hover:text-neutral-200 transition-colors"
                      >
                        Keep Private ($2,500 default)
                      </button>
                      <button 
                        onClick={() => {
                          const val = (document.getElementById("expenseSlider") as HTMLInputElement)?.value || "2500";
                          submitAnswer(`$${val}/month`);
                        }}
                        className="text-xs px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors"
                      >
                        Save & Continue
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 6 Component: Timeline Quick Pills */}
                {step === 6 && (
                  <div className="mb-4 flex flex-wrap gap-2 animate-fadeIn">
                    {["3 months", "6 months", "1 year", "2 years"].map((time) => (
                      <button 
                        key={time}
                        onClick={() => submitAnswer(time)}
                        className="text-xs px-3.5 py-2 rounded-full border border-neutral-800 hover:border-indigo-500/50 bg-neutral-900 hover:bg-indigo-950/20 text-neutral-300 hover:text-indigo-200 transition-all duration-200"
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                )}

                {/* Step 7 Component: Target Role Suggestions */}
                {step === 7 && (
                  <div className="mb-4 flex flex-wrap gap-2 animate-fadeIn">
                    {["Freelance Consultant", "Software developer", "Digital creator / writer", "Startup founder", "Going back to study"].map((role) => (
                      <button 
                        key={role}
                        onClick={() => submitAnswer(role)}
                        className="text-xs px-3 py-1.5 rounded-full border border-neutral-800 hover:border-indigo-500/50 bg-neutral-900 hover:bg-indigo-950/20 text-neutral-300 hover:text-indigo-200 transition-all"
                      >
                        {role}
                      </button>
                    ))}
                  </div>
                )}

                {/* Standard Input Form */}
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    submitAnswer();
                  }}
                  className="flex gap-2"
                >
                  <input 
                    type="text" 
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder={
                      step === 3 || step === 5 
                        ? "Use interactive controls above or type custom here..." 
                        : "Type your answer..."
                    }
                    className="flex-1 bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500/80 transition-all"
                    disabled={isLoading}
                  />
                  <button 
                    type="submit" 
                    className="bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white rounded-xl p-3 px-4 shadow-lg shadow-indigo-600/10 flex items-center justify-center transition-all"
                    disabled={isLoading || (!inputValue.trim() && step !== 3 && step !== 5)}
                  >
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </form>
              </div>
            </div>

            {/* Right Column: Live Runway Sandbox */}
            <div className="w-full lg:w-[350px] flex flex-col bg-neutral-900/30 border border-neutral-900 rounded-2xl p-6 shadow-xl space-y-6 h-fit">
              <div>
                <h2 className="font-semibold text-neutral-200 text-lg mb-1 flex items-center gap-2">
                  <Coins className="h-5 w-5 text-indigo-400" />
                  Live Runway Sandbox
                </h2>
                <p className="text-xs text-neutral-500">Play with the parameters to simulate your career pivot safety net.</p>
              </div>

              {/* Metrics visual display */}
              <div className="space-y-4 bg-neutral-950/60 rounded-xl p-4 border border-neutral-900">
                <div>
                  <div className="flex justify-between items-center text-xs text-neutral-400 mb-1">
                    <span>Est. Runway Length</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${
                      liveStatus === "safe" ? "bg-emerald-950/50 border border-emerald-900 text-emerald-400" :
                      liveStatus === "moderate" ? "bg-amber-950/50 border border-amber-900 text-amber-400" :
                      "bg-rose-950/50 border border-rose-900 text-rose-400"
                    }`}>
                      {liveStatus}
                    </span>
                  </div>
                  <div className="text-3xl font-extrabold text-white">
                    {liveRunway} <span className="text-sm font-normal text-neutral-500">months</span>
                  </div>
                </div>

                {/* Progress bar visual */}
                <div className="w-full bg-neutral-900 h-2.5 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 ${
                      liveStatus === "safe" ? "bg-emerald-500" :
                      liveStatus === "moderate" ? "bg-amber-500" :
                      "bg-rose-500"
                    }`}
                    style={{ width: `${Math.min(100, (liveRunway / 12) * 100)}%` }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-neutral-900 pt-3 text-xs">
                  <div>
                    <span className="block text-neutral-500">Target Pivot</span>
                    <span className="font-semibold text-neutral-300">{sandboxTimeline} months</span>
                  </div>
                  <div>
                    <span className="block text-neutral-500">Shortfall</span>
                    <span className="font-semibold text-neutral-300">
                      {liveShortfall > 0 ? `$${liveShortfall.toLocaleString()}` : "$0 (Safe)"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Adjust sliders manually */}
              <div className="space-y-4">
                <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Adjust Simulation Parameters</h3>
                
                <div>
                  <div className="flex justify-between text-xs text-neutral-500 mb-1">
                    <span>Total Savings Available</span>
                    <span className="text-neutral-300 font-semibold">${sandboxSavings.toLocaleString()}</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="50000" 
                    step="500"
                    value={sandboxSavings}
                    onChange={(e) => setSandboxSavings(parseInt(e.target.value))}
                    className="w-full accent-indigo-500 h-1 bg-neutral-950 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs text-neutral-500 mb-1">
                    <span>Average Monthly Cost</span>
                    <span className="text-neutral-300 font-semibold">${sandboxExpenses.toLocaleString()}/mo</span>
                  </div>
                  <input 
                    type="range" 
                    min="500" 
                    max="10000" 
                    step="100"
                    value={sandboxExpenses}
                    onChange={(e) => setSandboxExpenses(parseInt(e.target.value))}
                    className="w-full accent-indigo-500 h-1 bg-neutral-950 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs text-neutral-500 mb-1">
                    <span>Transition Duration</span>
                    <span className="text-neutral-300 font-semibold">{sandboxTimeline} months</span>
                  </div>
                  <input 
                    type="range" 
                    min="1" 
                    max="24" 
                    step="1"
                    value={sandboxTimeline}
                    onChange={(e) => setSandboxTimeline(parseInt(e.target.value))}
                    className="w-full accent-indigo-500 h-1 bg-neutral-950 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>

              {/* Dynamic feedback snippet based on calculations */}
              <div className="rounded-xl bg-neutral-950/40 p-4 border border-neutral-900 text-xs text-neutral-400 leading-relaxed">
                {liveStatus === "safe" && (
                  <p className="text-emerald-400">
                    🟢 Your savings support a 6+ month emergency runway. This places you in a low-risk category. You have the flexibility to take your time studying and pivoting.
                  </p>
                )}
                {liveStatus === "moderate" && (
                  <p className="text-amber-400">
                    🟡 You have a moderate 3-6 month runway. It's adequate, but you will need an active bridge income stream (part-time or freelance gig) to secure your mid-term transition.
                  </p>
                )}
                {liveStatus === "underfunded" && (
                  <p className="text-rose-400">
                    🔴 High risk: Your current savings runway is less than 3 months. Do not quit your primary job yet! Prioritize building a $15,000 emergency buffer before taking the leap.
                  </p>
                )}
              </div>
            </div>
          </>
        )}

        {/* LOADING PROCESSING STATE */}
        {started && step === 11 && (
          <div className="flex-1 flex flex-col items-center justify-center py-24 text-center max-w-xl mx-auto">
            <div className="h-12 w-12 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin mb-6"></div>
            <h2 className="text-2xl font-bold mb-2">Analyzing Career Matrix...</h2>
            <p className="text-neutral-400 text-sm mb-4">
              We are compiling your answers, cross-referencing your budget runway against local cost indexes, and crafting a custom transition roadmap.
            </p>
            <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-xl p-4 text-xs text-left text-neutral-400 italic">
              "Gen Z values autonomy and alignment. Risk management doesn't mean stopping; it means having a bridge so you don't have to turn back."
            </div>
          </div>
        )}

        {/* DASHBOARD RESULT STATE */}
        {started && step === 12 && planData && (
          <div className="flex-1 flex flex-col gap-6 animate-fadeIn">
            
            {/* Summary Banner Card */}
            <div className="bg-gradient-to-r from-indigo-950/60 via-neutral-900 to-neutral-900 border border-indigo-500/20 rounded-2xl p-6 lg:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-xl">
              <div>
                <span className="text-xs font-semibold text-indigo-400 uppercase tracking-widest block mb-1">Pivot Strategy Confirmed</span>
                <h1 className="text-3xl font-extrabold text-white mb-2">
                  {answers.name}'s Roadmap to {answers.targetRole}
                </h1>
                <p className="text-neutral-400 text-sm max-w-xl">
                  A transition path starting from {answers.currentRole} in {answers.location} over a {answers.timeframe} timeline.
                </p>
              </div>

              {/* Financial Runway Metric Box */}
              <div className="bg-neutral-950/80 border border-neutral-800 rounded-xl p-4 min-w-[200px] flex items-center gap-4">
                <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-white shadow-lg ${
                  planData.financialMetrics.riskLevel === "low" ? "bg-emerald-600 shadow-emerald-600/10" :
                  planData.financialMetrics.riskLevel === "medium" ? "bg-amber-600 shadow-amber-600/10" :
                  "bg-rose-600 shadow-rose-600/10"
                }`}>
                  {planData.financialMetrics.runwayMonths}m
                </div>
                <div>
                  <span className="text-[10px] text-neutral-500 uppercase tracking-wider block">Savings Runway</span>
                  <span className="text-white font-extrabold block text-sm">
                    {planData.financialMetrics.safetyNetStatus === "safe" ? "🟢 Secure Buffer" : 
                     planData.financialMetrics.safetyNetStatus === "moderate" ? "🟡 Moderate Safety" : 
                     "🔴 Underfunded Runway"}
                  </span>
                </div>
              </div>
            </div>

            {/* Dashboard Tabs Navigation */}
            <div className="flex border-b border-neutral-900">
              <button 
                onClick={() => setActiveTab("plan")}
                className={`py-3 px-6 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
                  activeTab === "plan" 
                    ? "border-indigo-500 text-indigo-400" 
                    : "border-transparent text-neutral-400 hover:text-neutral-200"
                }`}
              >
                <Calendar className="h-4 w-4" />
                Transition Roadmap
              </button>
              <button 
                onClick={() => setActiveTab("journey")}
                className={`py-3 px-6 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
                  activeTab === "journey" 
                    ? "border-indigo-500 text-indigo-400" 
                    : "border-transparent text-neutral-400 hover:text-neutral-200"
                }`}
              >
                <Map className="h-4 w-4" />
                Journey & Obstacles
              </button>
              <button 
                onClick={() => setActiveTab("runway")}
                className={`py-3 px-6 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
                  activeTab === "runway" 
                    ? "border-indigo-500 text-indigo-400" 
                    : "border-transparent text-neutral-400 hover:text-neutral-200"
                }`}
              >
                <Coins className="h-4 w-4" />
                Runway Sandbox
              </button>
            </div>

            {/* TAB CONTENT: PLAN */}
            {activeTab === "plan" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Immediate Goals (30 days) */}
                <div className="bg-neutral-900/40 border border-neutral-900 rounded-xl p-6 space-y-4">
                  <div className="flex items-center gap-2 text-indigo-400 font-semibold border-b border-neutral-900 pb-3">
                    <span className="h-6 w-6 rounded bg-indigo-950/60 flex items-center justify-center text-xs">1</span>
                    Immediate Actions (Next 30 Days)
                  </div>
                  <ul className="space-y-3">
                    {planData.plan.immediate.map((item, idx) => (
                      <li key={idx} className="text-sm text-neutral-300 flex items-start gap-2.5">
                        <CheckCircle className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Short-Term Milestones (Months 1-3) */}
                <div className="bg-neutral-900/40 border border-neutral-900 rounded-xl p-6 space-y-4">
                  <div className="flex items-center gap-2 text-indigo-400 font-semibold border-b border-neutral-900 pb-3">
                    <span className="h-6 w-6 rounded bg-indigo-950/60 flex items-center justify-center text-xs">2</span>
                    Short-Term Milestones (Months 1-3)
                  </div>
                  <ul className="space-y-3">
                    {planData.plan.shortTerm.map((item, idx) => (
                      <li key={idx} className="text-sm text-neutral-300 flex items-start gap-2.5">
                        <CheckCircle className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Mid-Term Goals (Aligned to timeframe) */}
                <div className="bg-neutral-900/40 border border-neutral-900 rounded-xl p-6 space-y-4">
                  <div className="flex items-center gap-2 text-indigo-400 font-semibold border-b border-neutral-900 pb-3">
                    <span className="h-6 w-6 rounded bg-indigo-950/60 flex items-center justify-center text-xs">3</span>
                    Mid-Term Plan ({answers.timeframe})
                  </div>
                  <ul className="space-y-3">
                    {planData.plan.midTerm.map((item, idx) => (
                      <li key={idx} className="text-sm text-neutral-300 flex items-start gap-2.5">
                        <CheckCircle className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Lower Blocks: Skill-building & Gigs */}
                <div className="lg:col-span-2 bg-neutral-900/40 border border-neutral-900 rounded-xl p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-neutral-200 border-b border-neutral-900 pb-2 mb-3 flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-indigo-400" />
                      Required Credentials & Skills
                    </h3>
                    <ul className="space-y-2">
                      {planData.plan.skillBuilding.map((item, idx) => (
                        <li key={idx} className="text-xs text-neutral-300 flex items-start gap-2">
                          <ChevronRight className="h-3.5 w-3.5 text-indigo-500 mt-0.5" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold text-neutral-200 border-b border-neutral-900 pb-2 mb-3 flex items-center gap-2">
                      <Coins className="h-4 w-4 text-indigo-400" />
                      Freelance / Part-Time Income Bridges
                    </h3>
                    <ul className="space-y-2">
                      {planData.plan.incomeBridges.map((item, idx) => (
                        <li key={idx} className="text-xs text-neutral-300 flex items-start gap-2">
                          <ChevronRight className="h-3.5 w-3.5 text-indigo-500 mt-0.5" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Safety Net Card */}
                <div className="bg-neutral-900/40 border border-neutral-900 rounded-xl p-6 flex flex-col justify-between">
                  <div>
                    <h3 className="font-semibold text-neutral-200 border-b border-neutral-900 pb-2 mb-3">
                      🛡️ Financial Safety Net Analysis
                    </h3>
                    <p className="text-xs text-neutral-300 leading-relaxed">
                      {planData.plan.safetyNet}
                    </p>
                  </div>
                  <div className="mt-4 p-3 bg-neutral-950/60 rounded-lg text-[11px] text-neutral-500">
                    Calculated using standard 6-month buffer thresholds. Check the "Runway Sandbox" tab to customize these calculations dynamically.
                  </div>
                </div>

              </div>
            )}

            {/* TAB CONTENT: JOURNEY */}
            {activeTab === "journey" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Obstacle matrix */}
                <div className="lg:col-span-2 space-y-4">
                  <h2 className="font-semibold text-lg text-neutral-200">Obstacle Mitigation Matrix</h2>
                  <div className="space-y-4">
                    {planData.journey.obstacles.map((item, idx) => (
                      <div key={idx} className="bg-neutral-900/40 border border-neutral-900 rounded-xl p-5 space-y-2">
                        <h3 className="text-sm font-bold text-rose-400 flex items-center gap-2">
                          <ShieldAlert className="h-4 w-4 shrink-0" />
                          {item.obstacle}
                        </h3>
                        <p className="text-xs text-neutral-300 pl-6 leading-relaxed">
                          <strong className="text-indigo-400">Coaching Strategy:</strong> {item.mitigation}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Sidebar: Reality Check & Emotional phases */}
                <div className="space-y-6">
                  
                  {/* Timeline Reality Check Card */}
                  <div className="bg-neutral-900/40 border border-neutral-900 rounded-xl p-6 space-y-4">
                    <h3 className="font-semibold text-neutral-200 border-b border-neutral-900 pb-2 flex items-center justify-between">
                      Timeline Reality Check
                      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                        planData.journey.timelineRealityCheck.rating === "realistic" ? "bg-emerald-950/50 border border-emerald-900 text-emerald-400" :
                        planData.journey.timelineRealityCheck.rating === "optimistic" ? "bg-amber-950/50 border border-amber-900 text-amber-400" :
                        "bg-rose-950/50 border border-rose-900 text-rose-400"
                      }`}>
                        {planData.journey.timelineRealityCheck.rating}
                      </span>
                    </h3>
                    <p className="text-xs text-neutral-300 leading-relaxed">
                      {planData.journey.timelineRealityCheck.assessment}
                    </p>
                    <div className="bg-neutral-950/60 border border-neutral-900 rounded-lg p-3 text-xs text-indigo-400 leading-relaxed">
                      <strong>Coach's Advice:</strong> {planData.journey.timelineRealityCheck.advice}
                    </div>
                  </div>

                  {/* Emotional phases */}
                  <div className="bg-neutral-900/40 border border-neutral-900 rounded-xl p-6 space-y-4">
                    <h3 className="font-semibold text-neutral-200 border-b border-neutral-900 pb-2">
                      Psychological Phase Calendar
                    </h3>
                    <div className="relative border-l border-neutral-800 pl-4 space-y-6 ml-2">
                      {planData.journey.emotionalPhases.map((phase, idx) => (
                        <div key={idx} className="relative">
                          <span className="absolute -left-[21px] top-0.5 h-3.5 w-3.5 rounded-full bg-indigo-600 border-2 border-neutral-950 flex items-center justify-center">
                            {idx === 0 ? <Smile className="h-2 w-2 text-white" /> : idx === 1 ? <Frown className="h-2 w-2 text-white" /> : <Meh className="h-2 w-2 text-white" />}
                          </span>
                          <span className="block text-[10px] text-indigo-400 font-semibold uppercase">{phase.duration}</span>
                          <h4 className="text-xs font-bold text-neutral-100">{phase.phaseName}</h4>
                          <p className="text-[11px] text-neutral-400 mt-1">{phase.description}</p>
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
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Adjust sliders manually */}
                <div className="bg-neutral-900/40 border border-neutral-900 rounded-xl p-6 space-y-6">
                  <div>
                    <h3 className="font-semibold text-neutral-200 text-lg mb-1">Configure Parameters</h3>
                    <p className="text-xs text-neutral-500">Recalibrate the financial safety equations in real time.</p>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-xs text-neutral-500 mb-1">
                        <span>Total Savings Available</span>
                        <span className="text-neutral-300 font-semibold">${sandboxSavings.toLocaleString()}</span>
                      </div>
                      <input 
                        type="range" 
                        min="0" 
                        max="50000" 
                        step="500"
                        value={sandboxSavings}
                        onChange={(e) => setSandboxSavings(parseInt(e.target.value))}
                        className="w-full accent-indigo-500 h-1 bg-neutral-950 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-xs text-neutral-500 mb-1">
                        <span>Average Monthly Expenses</span>
                        <span className="text-neutral-300 font-semibold">${sandboxExpenses.toLocaleString()}/mo</span>
                      </div>
                      <input 
                        type="range" 
                        min="500" 
                        max="10000" 
                        step="100"
                        value={sandboxExpenses}
                        onChange={(e) => setSandboxExpenses(parseInt(e.target.value))}
                        className="w-full accent-indigo-500 h-1 bg-neutral-950 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-xs text-neutral-500 mb-1">
                        <span>Transition Target Duration</span>
                        <span className="text-neutral-300 font-semibold">{sandboxTimeline} months</span>
                      </div>
                      <input 
                        type="range" 
                        min="1" 
                        max="24" 
                        step="1"
                        value={sandboxTimeline}
                        onChange={(e) => setSandboxTimeline(parseInt(e.target.value))}
                        className="w-full accent-indigo-500 h-1 bg-neutral-950 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                {/* Visual results */}
                <div className="lg:col-span-2 bg-neutral-900/40 border border-neutral-900 rounded-xl p-6 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                  
                  <div className="space-y-4">
                    <div>
                      <span className="text-xs text-neutral-500 block">Est. Runway Length</span>
                      <div className="text-4xl font-extrabold text-white">
                        {liveRunway} <span className="text-sm font-normal text-neutral-400">months</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-xs text-neutral-500 block">Emergency Safety Buffer (6 Months)</span>
                      <div className="text-xl font-bold text-neutral-200">
                        ${liveBuffer.toLocaleString()}
                      </div>
                    </div>

                    <div>
                      <span className="text-xs text-neutral-500 block">Savings Deficit to Buffer</span>
                      <div className="text-xl font-bold text-rose-400">
                        {liveShortfall > 0 ? `$${liveShortfall.toLocaleString()}` : "$0 (Safe Runway)"}
                      </div>
                    </div>
                  </div>

                  <div className="bg-neutral-950/60 border border-neutral-900 rounded-xl p-5 space-y-4">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Runway360 Assessment</h4>
                    
                    <div className="flex items-center gap-3">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-white text-xs ${
                        liveStatus === "safe" ? "bg-emerald-600" :
                        liveStatus === "moderate" ? "bg-amber-600" :
                        "bg-rose-600"
                      }`}>
                        {liveStatus === "safe" ? "✓" : "!"}
                      </div>
                      <div>
                        <span className="text-xs text-neutral-500 block">Safety Net Level</span>
                        <span className="text-xs font-bold text-neutral-200 capitalize">{liveStatus} Runway</span>
                      </div>
                    </div>

                    <p className="text-xs text-neutral-400 leading-relaxed">
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
