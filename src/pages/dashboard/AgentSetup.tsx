import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Bot, Save, Plus, Trash2, Loader2, CheckCircle2, AlertCircle, FileSearch, Sparkles, Zap, Terminal, Download, Puzzle, Link, Play, ArrowRight, Shield, Copy } from "lucide-react";
import { auth, db } from "@/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { getGemini } from "@/lib/gemini";
import ReactMarkdown from "react-markdown";

export default function AgentSetup() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [activeTab, setActiveTab] = useState<'profile' | 'evaluator' | 'automation'>('profile');

  // Evaluator State
  const [jobDescription, setJobDescription] = useState("");
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState<{
    matchScore: number;
    analysis: string;
    tailoredCoverLetter: string;
    tailoredBullets: string[];
  } | null>(null);

  // Agent State (Source of Truth)
  const [profile, setProfile] = useState({
    personalInfo: {
      fullName: "",
      email: "",
      phone: "",
      location: "",
      linkedinUrl: "",
      githubUrl: "",
      portfolioUrl: ""
    },
    preferences: {
      targetRoles: [""],
      locations: [""],
      remoteOnly: false,
      salaryExpectation: ""
    },
    experience: [
      { company: "", title: "", startDate: "", endDate: "", description: "" }
    ],
    education: [
      { school: "", degree: "", field: "", graduationYear: "" }
    ],
    skills: [""]
  });

  useEffect(() => {
    const loadProfile = async () => {
      if (!auth.currentUser) return;
      setIsLoading(true);
      try {
        const docRef = doc(db, "users", auth.currentUser.uid, "agent", "profile");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProfile(docSnap.data() as any);
        }
      } catch (error) {
        console.error("Error loading profile:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadProfile();
  }, []);

  const handleSave = async () => {
    if (!auth.currentUser) return;
    setIsSaving(true);
    setSaveStatus('idle');
    try {
      await setDoc(doc(db, "users", auth.currentUser.uid, "agent", "profile"), profile);
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      console.error("Error saving profile:", error);
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEvaluate = async () => {
    if (!jobDescription.trim()) return;
    setIsEvaluating(true);
    setEvaluationResult(null);
    try {
      const ai = getGemini();
      const prompt = `
        You are an expert technical recruiter and career coach.
        I will provide you with my "Source of Truth" profile (JSON) and a Job Description.
        
        My Profile:
        ${JSON.stringify(profile, null, 2)}
        
        Job Description:
        ${jobDescription}
        
        Please evaluate the match and generate tailored content.
        Respond ONLY with a valid JSON object matching this exact structure:
        {
          "matchScore": 85,
          "analysis": "A brief paragraph explaining why it's a good match and what skills are missing.",
          "tailoredCoverLetter": "A full, professional cover letter tailored to this specific job using my profile.",
          "tailoredBullets": [
            "A tailored resume bullet point highlighting relevant experience.",
            "Another tailored bullet point."
          ]
        }
      `;
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        }
      });
      
      if (response.text) {
        setEvaluationResult(JSON.parse(response.text));
      }
    } catch (error) {
      console.error("Error evaluating job:", error);
    } finally {
      setIsEvaluating(false);
    }
  };

  const updatePersonalInfo = (field: string, value: string) => {
    setProfile(prev => ({
      ...prev,
      personalInfo: { ...prev.personalInfo, [field]: value }
    }));
  };

  const updateArrayItem = (category: 'experience' | 'education', index: number, field: string, value: string) => {
    setProfile(prev => {
      const newArray = [...prev[category]] as any[];
      newArray[index] = { ...newArray[index], [field]: value };
      return { ...prev, [category]: newArray };
    });
  };

  const addArrayItem = (category: 'experience' | 'education') => {
    setProfile(prev => {
      const newItem = category === 'experience' 
        ? { company: "", title: "", startDate: "", endDate: "", description: "" }
        : { school: "", degree: "", field: "", graduationYear: "" };
      return { ...prev, [category]: [...prev[category], newItem] };
    });
  };

  const removeArrayItem = (category: 'experience' | 'education', index: number) => {
    setProfile(prev => {
      const newArray = [...prev[category]];
      newArray.splice(index, 1);
      return { ...prev, [category]: newArray };
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2 flex items-center gap-3">
          <Bot className="w-8 h-8 text-indigo-400" />
          Auto-Apply Agent Setup
        </h1>
        <p className="text-slate-400">
          Build your "Source of Truth" JSON profile and use the Job Evaluator to generate perfectly tailored applications.
        </p>
      </div>

      <div className="flex p-1 bg-slate-900/50 border border-slate-800 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('profile')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'profile' 
              ? 'bg-indigo-600 text-white' 
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          Source of Truth Profile
        </button>
        <button
          onClick={() => setActiveTab('evaluator')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
            activeTab === 'evaluator' 
              ? 'bg-indigo-600 text-white' 
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <FileSearch className="w-4 h-4" />
          Job Evaluator
        </button>
        <button
          onClick={() => setActiveTab('automation')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
            activeTab === 'automation' 
              ? 'bg-indigo-600 text-white' 
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Zap className="w-4 h-4" />
          Automation Hub
        </button>
      </div>

      {activeTab === 'profile' && (
        <div className="grid gap-6">
          {/* Personal Info */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-slate-50">Personal Information</CardTitle>
              <CardDescription>Basic details used to fill out application forms.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-400">Full Name</label>
                <Input 
                  value={profile.personalInfo.fullName} 
                  onChange={e => updatePersonalInfo('fullName', e.target.value)}
                  className="bg-slate-950 border-slate-800 text-slate-50" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-400">Email</label>
                <Input 
                  type="email"
                  value={profile.personalInfo.email} 
                  onChange={e => updatePersonalInfo('email', e.target.value)}
                  className="bg-slate-950 border-slate-800 text-slate-50" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-400">Phone</label>
                <Input 
                  value={profile.personalInfo.phone} 
                  onChange={e => updatePersonalInfo('phone', e.target.value)}
                  className="bg-slate-950 border-slate-800 text-slate-50" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-400">Location (City, State)</label>
                <Input 
                  value={profile.personalInfo.location} 
                  onChange={e => updatePersonalInfo('location', e.target.value)}
                  className="bg-slate-950 border-slate-800 text-slate-50" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-400">LinkedIn URL</label>
                <Input 
                  value={profile.personalInfo.linkedinUrl} 
                  onChange={e => updatePersonalInfo('linkedinUrl', e.target.value)}
                  className="bg-slate-950 border-slate-800 text-slate-50" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-400">GitHub / Portfolio URL</label>
                <Input 
                  value={profile.personalInfo.githubUrl} 
                  onChange={e => updatePersonalInfo('githubUrl', e.target.value)}
                  className="bg-slate-950 border-slate-800 text-slate-50" 
                />
              </div>
            </CardContent>
          </Card>

          {/* Experience */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-slate-50">Work Experience</CardTitle>
                <CardDescription>The agent will use this to answer "Years of experience" questions.</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => addArrayItem('experience')} className="border-slate-700 hover:bg-slate-800">
                <Plus className="w-4 h-4 mr-2" /> Add Role
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              {profile.experience.map((exp, idx) => (
                <div key={idx} className="p-4 rounded-lg border border-slate-800 bg-slate-950/50 relative group">
                  <button 
                    onClick={() => removeArrayItem('experience', idx)}
                    className="absolute top-4 right-4 text-slate-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 pr-8">
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-slate-400">Company</label>
                      <Input value={exp.company} onChange={e => updateArrayItem('experience', idx, 'company', e.target.value)} className="bg-slate-900 border-slate-800 h-9 text-slate-50" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-slate-400">Job Title</label>
                      <Input value={exp.title} onChange={e => updateArrayItem('experience', idx, 'title', e.target.value)} className="bg-slate-900 border-slate-800 h-9 text-slate-50" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-slate-400">Start Date</label>
                      <Input value={exp.startDate} placeholder="MM/YYYY" onChange={e => updateArrayItem('experience', idx, 'startDate', e.target.value)} className="bg-slate-900 border-slate-800 h-9 text-slate-50" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-slate-400">End Date</label>
                      <Input value={exp.endDate} placeholder="MM/YYYY or Present" onChange={e => updateArrayItem('experience', idx, 'endDate', e.target.value)} className="bg-slate-900 border-slate-800 h-9 text-slate-50" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-slate-400">Description / Achievements (Bullet points)</label>
                    <Textarea 
                      value={exp.description} 
                      onChange={e => updateArrayItem('experience', idx, 'description', e.target.value)} 
                      className="bg-slate-900 border-slate-800 min-h-[100px] text-slate-50" 
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex items-center justify-end gap-4 pt-4">
            <Button 
              variant="outline" 
              onClick={() => {
                navigator.clipboard.writeText(JSON.stringify(profile, null, 2));
                alert("Profile JSON copied to clipboard! Paste this into the Extension popup.");
              }}
              className="border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              <Copy className="w-4 h-4 mr-2" /> Export to Extension
            </Button>
            {saveStatus === 'success' && (
              <span className="text-emerald-400 flex items-center text-sm"><CheckCircle2 className="w-4 h-4 mr-1" /> Saved successfully</span>
            )}
            {saveStatus === 'error' && (
              <span className="text-rose-400 flex items-center text-sm"><AlertCircle className="w-4 h-4 mr-1" /> Error saving</span>
            )}
            <Button onClick={handleSave} disabled={isSaving} className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[120px]">
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4 mr-2" /> Save Profile</>}
            </Button>
          </div>
        </div>
      )}

      {activeTab === 'evaluator' && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Input Section */}
          <Card className="bg-slate-900/50 border-slate-800 h-fit">
            <CardHeader>
              <CardTitle className="text-slate-50">Job Description</CardTitle>
              <CardDescription>Paste the job description you want to apply for.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea 
                placeholder="Paste the full job description here..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                className="bg-slate-950 border-slate-800 min-h-[300px] text-slate-50"
              />
              <Button 
                onClick={handleEvaluate} 
                disabled={isEvaluating || !jobDescription.trim()} 
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {isEvaluating ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analyzing Match...</>
                ) : (
                  <><Sparkles className="w-4 h-4 mr-2" /> Evaluate & Tailor Resume</>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Output Section */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-slate-50">Evaluation Results</CardTitle>
              <CardDescription>AI analysis based on your Source of Truth profile.</CardDescription>
            </CardHeader>
            <CardContent>
              {isEvaluating ? (
                <div className="flex flex-col items-center justify-center h-[300px] text-slate-500 space-y-4">
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                  <p>Comparing your profile against the job description...</p>
                </div>
              ) : evaluationResult ? (
                <div className="space-y-6">
                  {/* Match Score */}
                  <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <span className="font-medium text-slate-300">Match Score</span>
                    <div className="flex items-center gap-2">
                      <span className={`text-2xl font-bold ${
                        evaluationResult.matchScore >= 80 ? 'text-emerald-400' : 
                        evaluationResult.matchScore >= 60 ? 'text-amber-400' : 'text-rose-400'
                      }`}>
                        {evaluationResult.matchScore}%
                      </span>
                    </div>
                  </div>

                  {/* Analysis */}
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider">Analysis</h3>
                    <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 text-sm text-slate-300 leading-relaxed">
                      {evaluationResult.analysis}
                    </div>
                  </div>

                  {/* Tailored Bullets */}
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider">Tailored Resume Bullets</h3>
                    <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-3">
                      {evaluationResult.tailoredBullets.map((bullet, idx) => (
                        <div key={idx} className="flex gap-3 text-sm text-slate-300">
                          <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0 mt-1.5" />
                          <p>{bullet}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Cover Letter */}
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider">Tailored Cover Letter</h3>
                    <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">
                      {evaluationResult.tailoredCoverLetter}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[300px] text-slate-500 space-y-4">
                  <FileSearch className="w-12 h-12 text-slate-800" />
                  <p className="text-center max-w-xs">
                    Paste a job description and click Evaluate to see your match score and tailored content.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'automation' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-slate-50 flex items-center gap-2">
                <Puzzle className="w-5 h-5 text-blue-400" />
                The Execution Engine: Browser Extension
              </CardTitle>
              <CardDescription>
                In production, we use a secure Chrome Extension. This keeps your data safe, uses your existing browser session (no need to share passwords), and requires zero technical setup.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Steps */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Step 1 */}
                <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col items-center text-center gap-4 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-blue-500"></div>
                  <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                    <Download className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-200">1. Install Source</h4>
                    <p className="text-sm text-slate-400 mt-2">Download the extension source code and load it into Chrome via Developer Mode.</p>
                  </div>
                  <Button 
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white mt-auto"
                    onClick={() => {
                      alert("To install:\n1. Open chrome://extensions\n2. Enable 'Developer Mode'\n3. Click 'Load unpacked'\n4. Select the '/extension' folder in this project.");
                    }}
                  >
                    Installation Guide
                  </Button>
                </div>
                {/* Step 2 */}
                <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col items-center text-center gap-4 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500"></div>
                  <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
                    <Link className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-200">2. Sync Profile</h4>
                    <p className="text-sm text-slate-400 mt-2">Copy your Profile JSON from the first tab and paste it into the extension popup.</p>
                  </div>
                  <Button 
                    variant="outline" 
                    className="w-full border-slate-700 text-slate-300 hover:bg-slate-800 mt-auto"
                    onClick={() => setActiveTab('profile')}
                  >
                    Go to Profile
                  </Button>
                </div>
                {/* Step 3 */}
                <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col items-center text-center gap-4 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-purple-500"></div>
                  <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center">
                    <Play className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-200">3. Auto-Apply</h4>
                    <p className="text-sm text-slate-400 mt-2">Go to LinkedIn. The extension will add a magic "Auto-Apply" button to job listings.</p>
                  </div>
                  <Button variant="outline" className="w-full border-slate-700 text-slate-300 hover:bg-slate-800 mt-auto" onClick={() => window.open('https://www.linkedin.com/jobs/', '_blank')}>
                    Open LinkedIn <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>

              {/* How it works section */}
              <div className="p-6 rounded-xl bg-slate-900 border border-slate-800">
                <h3 className="text-lg font-medium text-slate-200 mb-4 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-emerald-400" />
                  Why this is secure & user-friendly
                </h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3 text-sm text-slate-300">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    <span><strong>No technical setup:</strong> Users just click "Install" like any other browser extension. No Python, no terminals.</span>
                  </li>
                  <li className="flex items-start gap-3 text-sm text-slate-300">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    <span><strong>Zero password sharing:</strong> The extension runs inside your active browser session. You never give us your LinkedIn password or session cookies.</span>
                  </li>
                  <li className="flex items-start gap-3 text-sm text-slate-300">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    <span><strong>Sandboxed execution:</strong> Chrome enforces strict security policies. The extension can only read the job description and fill out forms when you explicitly allow it.</span>
                  </li>
                  <li className="flex items-start gap-3 text-sm text-slate-300">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    <span><strong>Human-in-the-loop:</strong> You can review the AI-generated answers before the extension clicks "Submit", ensuring high quality applications.</span>
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
