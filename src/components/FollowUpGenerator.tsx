import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2, Mail, Sparkles, Copy, Check } from "lucide-react";
import { getGemini } from "@/lib/gemini";

const TONES = [
  "Professional & Formal",
  "Enthusiastic & Warm",
  "Short & Direct",
  "Confident & Assertive"
];

export default function FollowUpGenerator({ onBack }: { onBack: () => void }) {
  const [interviewerName, setInterviewerName] = useState("");
  const [company, setCompany] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [keyTopics, setKeyTopics] = useState("");
  const [tone, setTone] = useState(TONES[0]);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedEmail, setGeneratedEmail] = useState("");
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (!interviewerName || !company || !jobTitle) return;
    setIsGenerating(true);
    setGeneratedEmail("");

    try {
      const ai = getGemini();
      const prompt = `
        You are an expert career coach and executive assistant.
        
        Write a highly effective, personalized post-interview follow-up email based on the following details:
        
        Interviewer Name: ${interviewerName}
        Company: ${company}
        Job Title Interviewed For: ${jobTitle}
        Key Topics Discussed (Optional): ${keyTopics || "None provided"}
        Desired Tone: ${tone}
        
        CRITICAL INSTRUCTIONS:
        1. The email should be ready to send immediately. Do not include placeholders like "[Your Name]" unless absolutely necessary at the very end.
        2. If key topics were provided, weave them in naturally to show active listening.
        3. Keep it concise, impactful, and grammatically perfect.
        4. Output ONLY the email subject line and body. Do not include any conversational filler.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });

      setGeneratedEmail(response.text || "Failed to generate email.");
    } catch (error) {
      console.error("Generation error:", error);
      setGeneratedEmail("An error occurred during generation. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedEmail);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Mail className="w-6 h-6 text-emerald-400" />
            Follow-up Email Generator
          </h2>
          <p className="text-slate-400">Draft the perfect post-interview thank you note in seconds.</p>
        </div>
        <Button variant="outline" onClick={onBack} className="bg-transparent border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white">
          Back to Tools
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Interview Details</CardTitle>
              <CardDescription className="text-slate-400">
                Provide the context of your interview to generate a personalized email.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">Interviewer Name *</Label>
                  <Input 
                    placeholder="e.g. Sarah Jenkins"
                    className="bg-slate-950 border-slate-800 text-slate-200"
                    value={interviewerName}
                    onChange={(e) => setInterviewerName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Company *</Label>
                  <Input 
                    placeholder="e.g. Acme Corp"
                    className="bg-slate-950 border-slate-800 text-slate-200"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Job Title *</Label>
                <Input 
                  placeholder="e.g. Senior Frontend Engineer"
                  className="bg-slate-950 border-slate-800 text-slate-200"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Key Topics Discussed (Optional)</Label>
                <Textarea 
                  placeholder="e.g. We talked about migrating to Next.js and my experience with React Server Components..."
                  className="min-h-[100px] bg-slate-950 border-slate-800 text-slate-200"
                  value={keyTopics}
                  onChange={(e) => setKeyTopics(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Tone</Label>
                <Select value={tone} onValueChange={setTone}>
                  <SelectTrigger className="w-full bg-slate-950 border-slate-800 text-slate-200 hover:text-white">
                    <SelectValue placeholder="Select tone..." />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
                    {TONES.map(t => (
                      <SelectItem key={t} value={t} className="hover:bg-slate-800 focus:bg-slate-800 hover:text-white focus:text-white cursor-pointer">
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button 
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white mt-4"
                onClick={handleGenerate}
                disabled={!interviewerName || !company || !jobTitle || isGenerating}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Drafting Email...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Email
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
                <CardTitle className="text-white">Drafted Email</CardTitle>
                <CardDescription className="text-slate-400">
                  Review, edit, and copy to your clipboard.
                </CardDescription>
              </div>
              {generatedEmail && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleCopy}
                  className="bg-slate-950 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800"
                >
                  {copied ? (
                    <span className="text-emerald-400 flex items-center gap-2"><Check className="w-4 h-4"/> Copied!</span>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-2" />
                      Copy Text
                    </>
                  )}
                </Button>
              )}
            </CardHeader>
            <CardContent className="flex-1 p-0">
              {generatedEmail ? (
                <div className="p-6 h-[400px]">
                  <Textarea 
                    value={generatedEmail}
                    onChange={(e) => setGeneratedEmail(e.target.value)}
                    className="w-full h-full resize-none bg-transparent border-none focus-visible:ring-0 text-slate-200 p-0 text-base leading-relaxed custom-scrollbar"
                  />
                </div>
              ) : (
                <div className="h-[400px] flex flex-col items-center justify-center text-slate-500 space-y-4 p-6 text-center">
                  <div className="w-16 h-16 rounded-full bg-slate-800/50 flex items-center justify-center">
                    <Mail className="w-8 h-8 text-slate-600" />
                  </div>
                  <p>Your personalized follow-up email will appear here.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
