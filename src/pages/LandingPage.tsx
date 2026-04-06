import { useState } from "react";
import { Link } from "react-router-dom";
import { Button, buttonVariants } from "@/components/ui/button";
import { motion, AnimatePresence } from "motion/react";
import { Bot, Zap, Shield, LineChart, BrainCircuit, Menu, X, Play, Linkedin } from "lucide-react";
import InstructionalVideoModal from "@/components/InstructionalVideoModal";
import { cn } from "@/lib/utils";

export default function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans selection:bg-indigo-500/30 relative">
      {/* Navigation */}
      <nav className="container mx-auto px-6 py-4 flex items-center justify-between border-b border-white/10 relative z-50 bg-slate-950/80 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight">AutoApply AI</span>
        </div>
        
        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-4">
          <Link to="/auth" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
            Log in
          </Link>
          <Link to="/auth" className={cn(buttonVariants(), "bg-white text-slate-950 hover:bg-slate-200 hover:text-slate-950")}>
            Start 7-Day Trial
          </Link>
        </div>

        {/* Mobile Menu Toggle */}
        <button 
          className="md:hidden p-2 text-slate-300 hover:text-white"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </nav>

      {/* Mobile Nav Dropdown */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-[73px] left-0 right-0 bg-slate-900 border-b border-slate-800 p-6 flex flex-col gap-4 md:hidden z-40 shadow-2xl"
          >
            <Link 
              to="/auth" 
              className="w-full text-center py-3 text-lg font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
            >
              Log in
            </Link>
            <Link to="/auth" className={cn(buttonVariants(), "w-full h-12 text-lg bg-indigo-600 hover:bg-indigo-700 text-white hover:text-white rounded-xl")}>
              Start 7-Day Trial
            </Link>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <main className="container mx-auto px-6 pt-24 md:pt-32 pb-24 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-sm font-medium mb-8 border border-indigo-500/20">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            True 24/7 Cloud Agent Operation
          </div>
          <h1 className="text-5xl sm:text-6xl md:text-8xl font-bold tracking-tighter mb-8 bg-gradient-to-br from-white via-white to-slate-500 text-transparent bg-clip-text leading-tight">
            Land your dream job <br className="hidden sm:block" /> while you sleep.
          </h1>
          <p className="text-lg md:text-xl text-slate-400 mb-12 max-w-2xl mx-auto leading-relaxed px-4">
            The only human-grade AI that applies to jobs skill-for-skill. 
            No hallucinations. No credits. Just quality matches and real interviews.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 px-4">
            <Link to="/auth" className={cn(buttonVariants({ size: "lg" }), "h-14 px-8 text-lg bg-indigo-600 hover:bg-indigo-700 text-white hover:text-white rounded-full w-full sm:w-auto")}>
              Start 7-Day Free Trial
            </Link>
            <Button 
              size="lg" 
              variant="outline" 
              onClick={() => setIsVideoModalOpen(true)}
              className="h-14 px-8 text-lg rounded-full w-full sm:w-auto border-slate-700 bg-slate-900/50 hover:bg-slate-800 text-white hover:text-white"
            >
              <Play className="w-5 h-5 mr-2" />
              See How It Works
            </Button>
          </div>
          <p className="mt-6 text-sm text-slate-500">No credit card required for trial. 30-day refund policy.</p>
        </motion.div>

        {/* Features Grid */}
        <div className="mt-32 md:mt-40 grid sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8 text-left">
          <FeatureCard 
            icon={<BrainCircuit className="w-6 h-6 text-indigo-400" />}
            title="Quality-First Matching"
            description="Real-time match scoring with explainability. Only applies if you meet the minimum score (e.g., 92% match)."
          />
          <FeatureCard 
            icon={<Zap className="w-6 h-6 text-amber-400" />}
            title="Smart Auto-Apply Engine"
            description="Generates unique, ATS-optimized resumes and cover letters per job. Submits with human-like timing."
          />
          <FeatureCard 
            icon={<Shield className="w-6 h-6 text-emerald-400" />}
            title="Privacy Vault"
            description="Your data is encrypted and never sold. Optional approval queue gives you full control over every application."
          />
          <FeatureCard 
            icon={<Linkedin className="w-6 h-6 text-[#0A66C2]" />}
            title="LinkedIn Sync"
            description="Import your profile, skills, and experience directly from LinkedIn. Keep your resume perfectly in sync with your professional profile."
          />
        </div>
      </main>
      <InstructionalVideoModal 
        isOpen={isVideoModalOpen} 
        onClose={() => setIsVideoModalOpen(false)} 
      />
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="p-6 md:p-8 rounded-3xl bg-slate-900/50 border border-slate-800 backdrop-blur-sm"
    >
      <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center mb-6">
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-3">{title}</h3>
      <p className="text-slate-400 leading-relaxed">{description}</p>
    </motion.div>
  );
}
