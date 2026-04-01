import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Linkedin, Languages, Mail, DollarSign, Shield, ArrowRight } from "lucide-react";
import ResumeOptimizer from "@/components/ResumeOptimizer";
import PrivacyVault from "@/components/PrivacyVault";
import FormatTranslator from "@/components/FormatTranslator";
import FollowUpGenerator from "@/components/FollowUpGenerator";
import SalaryCoach from "@/components/SalaryCoach";

export default function PowerTools() {
  const [activeTool, setActiveTool] = useState<string | null>(null);

  const tools = [
    {
      id: "linkedin-resume",
      title: "LinkedIn to Resume",
      description: "One-click import and optimization. Converts your LinkedIn profile into an ATS-friendly resume.",
      icon: <Linkedin className="w-6 h-6 text-[#0A66C2]" />,
      action: "Import Profile",
      color: "bg-[#0A66C2]/10 border-[#0A66C2]/20"
    },
    {
      id: "translator",
      title: "Format-Preserving Translator",
      description: "Translate your resume into 50+ languages while keeping the exact PDF/Word formatting intact.",
      icon: <Languages className="w-6 h-6 text-purple-400" />,
      action: "Translate Document",
      color: "bg-purple-500/10 border-purple-500/20"
    },
    {
      id: "follow-up",
      title: "Follow-up Generator",
      description: "Create personalized follow-up emails for after interviews or when you haven't heard back.",
      icon: <Mail className="w-6 h-6 text-emerald-400" />,
      action: "Draft Email",
      color: "bg-emerald-500/10 border-emerald-500/20"
    },
    {
      id: "salary-coach",
      title: "Salary Negotiation Coach",
      description: "Roleplay salary negotiations with an AI trained on thousands of successful tech industry scripts.",
      icon: <DollarSign className="w-6 h-6 text-amber-400" />,
      action: "Start Practice",
      color: "bg-amber-500/10 border-amber-500/20"
    },
    {
      id: "privacy-vault",
      title: "Privacy Vault",
      description: "Manage your encrypted personal data. Export all applications or permanently delete your account.",
      icon: <Shield className="w-6 h-6 text-rose-400" />,
      action: "Manage Data",
      color: "bg-rose-500/10 border-rose-500/20"
    }
  ];

  if (activeTool === "linkedin-resume") {
    return <ResumeOptimizer onBack={() => setActiveTool(null)} />;
  }

  if (activeTool === "translator") {
    return <FormatTranslator onBack={() => setActiveTool(null)} />;
  }

  if (activeTool === "follow-up") {
    return <FollowUpGenerator onBack={() => setActiveTool(null)} />;
  }

  if (activeTool === "salary-coach") {
    return <SalaryCoach onBack={() => setActiveTool(null)} />;
  }

  if (activeTool === "privacy-vault") {
    return <PrivacyVault onBack={() => setActiveTool(null)} />;
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Power Tools</h1>
        <p className="text-slate-400">Extra utilities to give you an unfair advantage in your job search.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tools.map((tool) => (
          <Card key={tool.id} className="bg-slate-900/50 border-slate-800 hover:border-slate-700 transition-colors group">
            <CardHeader>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 border ${tool.color}`}>
                {tool.icon}
              </div>
              <CardTitle className="text-xl text-white">{tool.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-400 text-sm mb-6 min-h-[60px]">
                {tool.description}
              </p>
              <Button 
                variant="outline" 
                onClick={() => setActiveTool(tool.id)}
                className="w-full bg-slate-950 border-slate-800 text-slate-300 group-hover:bg-slate-800 group-hover:text-white transition-colors"
              >
                {tool.action} <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
