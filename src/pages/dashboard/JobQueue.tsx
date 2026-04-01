import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, X, ExternalLink, Building2, MapPin, DollarSign, BrainCircuit, Loader2, Bot } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { auth, db } from "../../firebase";
import { collection, query, onSnapshot, doc, setDoc, deleteDoc } from "firebase/firestore";

declare global {
  interface Window {
    chrome?: any;
  }
}
const chrome = window.chrome;

// The Chrome Extension ID would normally be fixed, but for a local unpacked extension,
// we can use window.postMessage or just assume the extension is listening to external messages.
// For this UAT demo, we'll use a generic approach or assume the user has the extension installed.
const EXTENSION_ID = "your_extension_id_here"; // In a real scenario, this is the published ID

export default function JobQueue() {
  const [queue, setQueue] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!auth.currentUser) return;

    // Listen to the matched_jobs collection in Firestore
    const q = query(collection(db, "users", auth.currentUser.uid, "matched_jobs"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const jobs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Sort by match score descending
      jobs.sort((a: any, b: any) => b.match_score - a.match_score);
      setQueue(jobs);
    });

    return () => unsubscribe();
  }, []);

  const triggerSearch = async () => {
    if (!auth.currentUser) return;
    setIsSearching(true);
    setErrorMsg(null);

    try {
      const response = await fetch('/api/trigger-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: auth.currentUser.uid,
          preferences: { roles: "Frontend Engineer", location: "Remote" } // Mock preferences for demo
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to trigger search");
      }

      // Save the matches to Firestore
      for (const job of data.matches) {
        const jobRef = doc(db, "users", auth.currentUser.uid, "matched_jobs", job.id);
        await setDoc(jobRef, job);
      }

    } catch (error: any) {
      console.error("Search error:", error);
      setErrorMsg(error.message);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    if (!auth.currentUser) return;
    try {
      // Remove from queue (Firestore)
      await deleteDoc(doc(db, "users", auth.currentUser.uid, "matched_jobs", id));
    } catch (error) {
      console.error("Error removing job:", error);
    }
  };

  const handleCopilotApply = (job: any) => {
    // Send message to the Chrome Extension
    // Note: In a real app, you need the actual extension ID.
    // For this demo, we'll try to send it, and also show an alert.
    try {
      if (window.chrome && chrome.runtime && chrome.runtime.sendMessage) {
        // This requires the web app to be listed in "externally_connectable" in manifest.json
        chrome.runtime.sendMessage(EXTENSION_ID, {
          type: "COPILOT_APPLY",
          data: {
            jobUrl: job.url,
            inferredAnswers: job.inferred_answers,
            coverLetter: job.cover_letter
          }
        }, (response) => {
          if (chrome.runtime.lastError) {
            console.warn("Extension not found or error:", chrome.runtime.lastError);
            alert("Chrome Extension not detected! For this UAT demo, please ensure the AutoApply Copilot extension is installed and loaded.");
          } else {
            console.log("Copilot engaged:", response);
          }
        });
      } else {
        alert("Chrome Extension API not available. Please install the AutoApply Copilot extension to use this feature.");
      }
    } catch (e) {
      console.error(e);
      alert("Failed to communicate with the Copilot extension.");
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Review Queue</h1>
          <p className="text-slate-400">Approve jobs for the AI to apply to, or reject them to improve matching.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-sm font-medium">
            <span className="text-indigo-400">{queue.length}</span> jobs pending
          </div>
          <Button 
            onClick={triggerSearch} 
            disabled={isSearching}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            {isSearching ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Bot className="w-4 h-4 mr-2" />}
            Trigger AI Search
          </Button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-sm">
          {errorMsg}
        </div>
      )}

      <div className="space-y-6">
        <AnimatePresence>
          {queue.length === 0 && !isSearching ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20 bg-slate-900/50 border border-slate-800 rounded-2xl"
            >
              <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-emerald-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Queue Empty!</h3>
              <p className="text-slate-400">Click "Trigger AI Search" to find high-match jobs.</p>
            </motion.div>
          ) : queue.length === 0 && isSearching ? (
             <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20 bg-slate-900/50 border border-slate-800 rounded-2xl"
            >
              <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Scanning Job Boards...</h3>
              <p className="text-slate-400">The Sidecar Microservice is scraping and scoring jobs via Gemini.</p>
            </motion.div>
          ) : (
            queue.map((job) => (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100, transition: { duration: 0.2 } }}
              >
                <Card className="bg-slate-900/80 border-slate-800 overflow-hidden">
                  <CardContent className="p-0">
                    <div className="p-6 border-b border-slate-800">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h2 className="text-2xl font-bold text-slate-50 mb-2">{job.title}</h2>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400">
                            <span className="flex items-center gap-1"><Building2 className="w-4 h-4" /> {job.company}</span>
                            <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {job.location}</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end">
                          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-bold mb-2">
                            <BrainCircuit className="w-4 h-4" />
                            {job.match_score}% Match
                          </div>
                          <a href={job.url} target="_blank" rel="noreferrer" className="text-xs text-slate-500 hover:text-indigo-400 flex items-center gap-1">
                            View original <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>

                      <p className="text-slate-300 text-sm leading-relaxed mb-6">
                        {job.description}
                      </p>

                      <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800 mb-6">
                        <h4 className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-2">AI Reasoning</h4>
                        <p className="text-sm text-slate-300">{job.reasoning}</p>
                      </div>
                    </div>
                    
                    <div className="bg-slate-950/50 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="text-sm text-slate-500">
                        Ready to apply? Use the AI Copilot to inject your details.
                      </div>
                      <div className="flex w-full sm:w-auto gap-3">
                        <Button 
                          variant="outline" 
                          className="flex-1 sm:flex-none border-rose-500/50 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300"
                          onClick={() => handleAction(job.id, 'reject')}
                        >
                          <X className="w-4 h-4 mr-2" /> Reject
                        </Button>
                        <Button 
                          className="flex-1 sm:flex-none bg-indigo-600 hover:bg-indigo-700 text-white"
                          onClick={() => handleCopilotApply(job)}
                        >
                          <Bot className="w-4 h-4 mr-2" /> Copilot Apply
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
