import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2, Linkedin, Sparkles, Save, UserCheck } from "lucide-react";
import { getGemini } from "@/lib/gemini";
import { db, auth } from "@/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import Markdown from "react-markdown";

export default function ResumeOptimizer({ onBack }: { onBack: () => void }) {
  const [linkedInText, setLinkedInText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [useHumanizer, setUseHumanizer] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [optimizedResume, setOptimizedResume] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleOptimize = async () => {
    if (!linkedInText || !jobDescription) return;
    setIsProcessing(true);
    setOptimizedResume("");

    try {
      const ai = getGemini();
      const prompt = `
        You are an expert resume writer and career coach.
        
        Here is the user's raw LinkedIn profile text:
        ${linkedInText}
        
        Here is the target job description:
        ${jobDescription}
        
        Task:
        1. Parse the LinkedIn profile into a structured resume format (Experience, Education, Skills).
        2. Optimize the bullet points to align perfectly with the target job description. Highlight relevant metrics, action verbs, and keywords.
        3. Do NOT invent facts or experience. Only reframe existing experience.
        ${useHumanizer ? "4. CRITICAL: Use your 'Humanizer AI' capability. Ensure the tone sounds completely natural, authentic, and human-written. Avoid robotic, overly-dense corporate jargon. Write as if a highly articulate professional is describing their own genuine impact." : ""}
        
        Output the final optimized resume in clean Markdown format.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });

      setOptimizedResume(response.text || "Failed to generate resume.");
    } catch (error) {
      console.error("Optimization error:", error);
      setOptimizedResume("An error occurred during optimization. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveToVault = async () => {
    if (!auth.currentUser) {
      alert("You must be logged in to save to your Privacy Vault.");
      return;
    }
    
    setIsSaving(true);
    try {
      await addDoc(collection(db, "resumes"), {
        userId: auth.currentUser.uid,
        content: optimizedResume,
        targetJob: jobDescription.substring(0, 100) + "...",
        createdAt: serverTimestamp(),
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error("Error saving to vault:", error);
      alert("Failed to save to Privacy Vault.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Linkedin className="w-6 h-6 text-[#0A66C2]" />
            LinkedIn to Resume Optimizer
          </h2>
          <p className="text-slate-400">Import your profile, target a job, and let AI do the rest.</p>
        </div>
        <Button variant="outline" onClick={onBack} className="bg-transparent border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white">
          Back to Tools
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">1. Your Profile</CardTitle>
              <CardDescription className="text-slate-400">
                Paste your LinkedIn profile text or upload your PDF export.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea 
                placeholder="Paste your LinkedIn experience, about section, and skills here..."
                className="min-h-[200px] bg-slate-950 border-slate-800 text-slate-200 placeholder:text-slate-600"
                value={linkedInText}
                onChange={(e) => setLinkedInText(e.target.value)}
              />
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">2. Target Job</CardTitle>
              <CardDescription className="text-slate-400">
                Paste the job description you want to optimize for.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea 
                placeholder="Paste the job description here..."
                className="min-h-[200px] bg-slate-950 border-slate-800 text-slate-200 placeholder:text-slate-600"
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
              />
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="pt-6 space-y-6">
              <div className="flex items-center justify-between p-4 rounded-lg bg-slate-950 border border-slate-800">
                <div className="space-y-0.5">
                  <Label className="text-white flex items-center gap-2 text-base">
                    <UserCheck className="w-4 h-4 text-emerald-400" />
                    Humanizer AI
                  </Label>
                  <p className="text-sm text-slate-400">
                    Rewrite to sound natural and authentic, avoiding robotic AI jargon.
                  </p>
                </div>
                <Switch 
                  checked={useHumanizer} 
                  onCheckedChange={setUseHumanizer} 
                  className="data-[state=checked]:bg-emerald-500"
                />
              </div>

              <Button 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 text-lg"
                onClick={handleOptimize}
                disabled={!linkedInText || !jobDescription || isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Optimizing & Humanizing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Generate Optimized Resume
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="h-full">
          <Card className="bg-slate-900 border-slate-800 h-full flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <CardTitle className="text-white">Optimized Result</CardTitle>
                <CardDescription className="text-slate-400">Ready for your application.</CardDescription>
              </div>
              {optimizedResume && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleSaveToVault}
                  disabled={isSaving || saveSuccess}
                  className="bg-slate-950 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800"
                >
                  {saveSuccess ? (
                    <span className="text-emerald-400 flex items-center gap-2">Saved!</span>
                  ) : isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save to Vault
                    </>
                  )}
                </Button>
              )}
            </CardHeader>
            <CardContent className="flex-1 p-0">
              {optimizedResume ? (
                <div className="p-6 prose prose-invert max-w-none h-[700px] overflow-y-auto custom-scrollbar">
                  <Markdown>{optimizedResume}</Markdown>
                </div>
              ) : (
                <div className="h-[700px] flex flex-col items-center justify-center text-slate-500 space-y-4 p-6 text-center">
                  <div className="w-16 h-16 rounded-full bg-slate-800/50 flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-slate-600" />
                  </div>
                  <p>Your optimized, humanized resume will appear here.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
