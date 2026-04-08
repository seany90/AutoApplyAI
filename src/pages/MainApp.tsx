import { useState, useEffect } from "react";
import { Bot, FileText, Briefcase, Sparkles, Loader2, CheckCircle2, AlertTriangle, LogOut } from "lucide-react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { auth, signOut } from "@/firebase";
import { useNavigate } from "react-router-dom";

export default function MainApp() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Load profile from local storage on mount
  useEffect(() => {
    const savedProfile = localStorage.getItem("autoapply_profile");
    if (savedProfile) {
      setProfile(savedProfile);
    }
  }, []);

  // Save profile to local storage when it changes
  useEffect(() => {
    localStorage.setItem("autoapply_profile", profile);
  }, [profile]);

  const handleEvaluate = async () => {
    if (!profile.trim()) {
      setError("Please enter your profile/resume first.");
      return;
    }
    if (!jobDescription.trim()) {
      setError("Please enter a job description to evaluate.");
      return;
    }

    setIsEvaluating(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/evaluate-job", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile: profile,
          jobDescription: jobDescription,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || "Failed to evaluate job.");
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex flex-col selection:bg-indigo-500/30">
      {/* Header */}
      <header className="h-16 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight">AutoApply AI</span>
        </div>
        <Button variant="ghost" className="text-slate-400 hover:text-white hover:bg-slate-800" onClick={handleLogout}>
          <LogOut className="w-4 h-4 mr-2" />
          Log out
        </Button>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden flex flex-col lg:flex-row">
        
        {/* Left Pane: Source of Truth Profile */}
        <div className="flex-1 flex flex-col border-r border-slate-800 bg-slate-900/20">
          <div className="p-4 border-b border-slate-800 flex items-center gap-2 bg-slate-900/40">
            <FileText className="w-5 h-5 text-indigo-400" />
            <h2 className="font-semibold text-lg">Source of Truth Profile</h2>
          </div>
          <div className="flex-1 p-4 flex flex-col">
            <p className="text-sm text-slate-400 mb-3">
              Paste your resume, LinkedIn profile text, or a JSON representation of your experience here. This will be used to evaluate all jobs.
            </p>
            <textarea
              value={profile}
              onChange={(e) => setProfile(e.target.value)}
              placeholder="Paste your resume or profile details here..."
              className="flex-1 w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none font-mono text-sm"
            />
          </div>
        </div>

        {/* Right Pane: Job Evaluator */}
        <div className="flex-1 flex flex-col bg-slate-900/10">
          <div className="p-4 border-b border-slate-800 flex items-center gap-2 bg-slate-900/40">
            <Briefcase className="w-5 h-5 text-emerald-400" />
            <h2 className="font-semibold text-lg">Job Evaluator</h2>
          </div>
          
          <div className="flex-1 p-4 flex flex-col overflow-y-auto">
            <p className="text-sm text-slate-400 mb-3">
              Paste the job description you want to apply for.
            </p>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the job description here..."
              className="h-64 shrink-0 w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 resize-none font-mono text-sm mb-4"
            />

            <Button 
              onClick={handleEvaluate} 
              disabled={isEvaluating || !profile.trim() || !jobDescription.trim()}
              className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-base rounded-xl shadow-lg shadow-indigo-900/20 mb-6 shrink-0"
            >
              {isEvaluating ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Evaluating Match...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Evaluate Job Match
                </>
              )}
            </Button>

            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm mb-4 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                <p>{error}</p>
              </div>
            )}

            {result && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6"
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <h3 className="text-lg font-semibold">Evaluation Results</h3>
                  <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-bold ${
                    result.matchScore >= 70 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 
                    result.matchScore >= 40 ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 
                    'bg-red-500/10 text-red-400 border border-red-500/20'
                  }`}>
                    {result.matchScore >= 70 ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                    {result.matchScore}% Match
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-2">Analysis</h4>
                  <p className="text-slate-200 leading-relaxed">{result.analysis}</p>
                </div>

                {result.tailoredBullets && result.tailoredBullets.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-2">Tailored Resume Bullets</h4>
                    <ul className="space-y-2">
                      {result.tailoredBullets.map((bullet: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-slate-200">
                          <span className="text-indigo-400 mt-1">•</span>
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {result.tailoredCoverLetter && (
                  <div>
                    <h4 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-2">Cover Letter Draft</h4>
                    <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 text-sm text-slate-300 whitespace-pre-wrap font-serif leading-relaxed">
                      {result.tailoredCoverLetter}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
