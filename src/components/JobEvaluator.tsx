import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, Sparkles, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface JobEvaluatorProps {
  onBack: () => void;
}

export default function JobEvaluator({ onBack }: JobEvaluatorProps) {
  const [jobDescription, setJobDescription] = useState("");
  const [profile, setProfile] = useState("");
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleEvaluate = async () => {
    if (!jobDescription.trim() || !profile.trim()) {
      setError("Please provide both a job description and your profile.");
      return;
    }

    setIsEvaluating(true);
    setError(null);
    setResult(null);

    try {
      let parsedProfile;
      try {
        parsedProfile = JSON.parse(profile);
      } catch (e) {
        // If it's not valid JSON, just pass it as a string
        parsedProfile = { text: profile };
      }

      const response = await fetch("/api/evaluate-job", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jobDescription,
          profile: parsedProfile,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || "Failed to evaluate job");
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsEvaluating(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="icon" onClick={onBack} className="text-slate-400 hover:text-white">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-white">Job Evaluator Dashboard</h1>
          <p className="text-slate-400">Paste a job description to see if you're a match and generate a tailored cover letter.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <CardTitle className="text-lg text-white">1. Your Profile</CardTitle>
            <CardDescription className="text-slate-400">Paste your resume text or JSON profile here.</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea 
              placeholder="Paste your resume, skills, and experience here..." 
              className="min-h-[250px] bg-slate-950 border-slate-800 text-slate-300"
              value={profile}
              onChange={(e) => setProfile(e.target.value)}
            />
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <CardTitle className="text-lg text-white">2. Job Description</CardTitle>
            <CardDescription className="text-slate-400">Paste the job description from LinkedIn, Indeed, etc.</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea 
              placeholder="Paste the full job description here..." 
              className="min-h-[250px] bg-slate-950 border-slate-800 text-slate-300"
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
            />
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-center">
        <Button 
          size="lg" 
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-8"
          onClick={handleEvaluate}
          disabled={isEvaluating}
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
      </div>

      {error && (
        <Card className="bg-red-500/10 border-red-500/20">
          <CardContent className="pt-6">
            <div className="flex items-start space-x-3 text-red-400">
              <XCircle className="w-5 h-5 mt-0.5 shrink-0" />
              <p>{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {result && (
        <Card className="bg-slate-900/50 border-slate-800 overflow-hidden">
          <div className="h-2 w-full bg-slate-800">
            <div 
              className={`h-full ${result.matchScore >= 70 ? 'bg-emerald-500' : result.matchScore >= 40 ? 'bg-amber-500' : 'bg-rose-500'}`} 
              style={{ width: `${result.matchScore}%` }}
            />
          </div>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl text-white flex items-center">
                Match Results
                <Badge className={`ml-3 ${result.matchScore >= 70 ? 'bg-emerald-500/20 text-emerald-400' : result.matchScore >= 40 ? 'bg-amber-500/20 text-amber-400' : 'bg-rose-500/20 text-rose-400'}`}>
                  {result.matchScore}% Match
                </Badge>
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-sm font-medium text-slate-400 mb-2 uppercase tracking-wider">Analysis</h3>
              <p className="text-slate-200">{result.analysis}</p>
            </div>

            {result.tailoredBullets && result.tailoredBullets.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-slate-400 mb-2 uppercase tracking-wider">Tailored Resume Bullets</h3>
                <ul className="space-y-2">
                  {result.tailoredBullets.map((bullet: string, i: number) => (
                    <li key={i} className="flex items-start space-x-2 text-slate-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-1 shrink-0" />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {result.tailoredCoverLetter && (
              <div>
                <h3 className="text-sm font-medium text-slate-400 mb-2 uppercase tracking-wider">Tailored Cover Letter</h3>
                <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 text-slate-300 whitespace-pre-wrap text-sm">
                  {result.tailoredCoverLetter}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
