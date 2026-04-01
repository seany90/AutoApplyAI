import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DollarSign, Send, Bot, User, Loader2, ArrowLeft } from "lucide-react";
import { getGemini } from "@/lib/gemini";
import Markdown from "react-markdown";

type Message = {
  role: "user" | "model";
  text: string;
};

export default function SalaryCoach({ onBack }: { onBack: () => void }) {
  const [step, setStep] = useState<"setup" | "chat">("setup");
  
  // Setup State
  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");
  const [initialOffer, setInitialOffer] = useState("");
  const [targetSalary, setTargetSalary] = useState("");

  // Chat State
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  
  const chatRef = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const startRoleplay = async () => {
    if (!jobTitle || !company || !initialOffer || !targetSalary) return;
    
    setStep("chat");
    setIsTyping(true);
    setMessages([]);

    try {
      const ai = getGemini();
      chatRef.current = ai.chats.create({
        model: "gemini-3-flash-preview",
        config: {
          systemInstruction: `You are an experienced corporate recruiter at ${company} hiring for the position of ${jobTitle}. 
          You have just extended an initial job offer of $${initialOffer} to the candidate. 
          The candidate's secret target salary is $${targetSalary} (do NOT reveal that you know this).
          
          Your goal is to roleplay a realistic salary negotiation with the candidate. 
          - Be professional, polite, but firm—protecting the company's budget.
          - Do not immediately cave to their demands. Ask for justification (e.g., "What specific experience warrants that increase?").
          - You can offer non-salary perks (sign-on bonus, extra PTO, equity) if they push hard.
          - Keep your responses conversational, concise, and realistic for a phone call or email exchange.
          
          Start the conversation by welcoming them, officially extending the $${initialOffer} offer, and asking for their thoughts.`
        }
      });

      // Trigger the first message from the AI recruiter
      const response = await chatRef.current.sendMessage({ message: "Start the conversation." });
      setMessages([{ role: "model", text: response.text }]);
    } catch (error) {
      console.error("Failed to start chat:", error);
      setMessages([{ role: "model", text: "Error connecting to the negotiation simulator. Please try again." }]);
    } finally {
      setIsTyping(false);
    }
  };

  const sendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim() || isTyping || !chatRef.current) return;

    const userMsg = inputText.trim();
    setInputText("");
    setMessages(prev => [...prev, { role: "user", text: userMsg }]);
    setIsTyping(true);

    try {
      const response = await chatRef.current.sendMessage({ message: userMsg });
      setMessages(prev => [...prev, { role: "model", text: response.text }]);
    } catch (error) {
      console.error("Failed to send message:", error);
      setMessages(prev => [...prev, { role: "model", text: "Sorry, I encountered an error. Let's try that again." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-amber-400" />
            Salary Negotiation Coach
          </h2>
          <p className="text-slate-400">Practice negotiating your offer with an AI recruiter.</p>
        </div>
        <Button variant="outline" onClick={onBack} className="bg-transparent border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white">
          Back to Tools
        </Button>
      </div>

      {step === "setup" ? (
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">Set the Stage</CardTitle>
            <CardDescription className="text-slate-400">
              Provide the details of your job offer to calibrate the AI recruiter.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-slate-300">Job Title</Label>
                <Input 
                  placeholder="e.g. Senior Product Manager"
                  className="bg-slate-950 border-slate-800 text-slate-200"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Company Name</Label>
                <Input 
                  placeholder="e.g. TechCorp Inc."
                  className="bg-slate-950 border-slate-800 text-slate-200"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Initial Offer (What they offered)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <Input 
                    placeholder="120,000"
                    className="pl-9 bg-slate-950 border-slate-800 text-slate-200"
                    value={initialOffer}
                    onChange={(e) => setInitialOffer(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Target Salary (What you want)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <Input 
                    placeholder="140,000"
                    className="pl-9 bg-slate-950 border-slate-800 text-slate-200"
                    value={targetSalary}
                    onChange={(e) => setTargetSalary(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <Button 
              className="w-full bg-amber-600 hover:bg-amber-700 text-white h-12 text-lg"
              onClick={startRoleplay}
              disabled={!jobTitle || !company || !initialOffer || !targetSalary}
            >
              Start Negotiation Practice
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-slate-900 border-slate-800 flex flex-col h-[600px]">
          <CardHeader className="border-b border-slate-800 py-4 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <Bot className="w-5 h-5 text-amber-400" />
                Recruiter at {company}
              </CardTitle>
              <CardDescription className="text-slate-400">
                Roleplaying {jobTitle} offer
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setStep("setup")} className="text-slate-400 hover:text-white hover:bg-slate-800">
              <ArrowLeft className="w-4 h-4 mr-2" /> End Practice
            </Button>
          </CardHeader>
          
          <CardContent className="flex-1 p-0 overflow-hidden flex flex-col">
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar"
            >
              {messages.map((msg, idx) => (
                <div 
                  key={idx} 
                  className={`flex gap-4 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    msg.role === "user" ? "bg-indigo-600" : "bg-slate-800"
                  }`}>
                    {msg.role === "user" ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-amber-400" />}
                  </div>
                  <div className={`max-w-[80%] rounded-2xl px-5 py-3 ${
                    msg.role === "user" 
                      ? "bg-indigo-600 text-white rounded-tr-sm" 
                      : "bg-slate-800 text-slate-200 rounded-tl-sm"
                  }`}>
                    <div className="prose prose-invert max-w-none text-sm leading-relaxed">
                      <Markdown>{msg.text}</Markdown>
                    </div>
                  </div>
                </div>
              ))}
              
              {isTyping && (
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="bg-slate-800 rounded-2xl rounded-tl-sm px-5 py-4 flex items-center gap-1">
                    <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                    <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                    <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-900/50">
              <form 
                onSubmit={sendMessage}
                className="flex items-center gap-2"
              >
                <Input 
                  placeholder="Type your response..."
                  className="flex-1 bg-slate-950 border-slate-800 text-slate-200 h-12"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  disabled={isTyping}
                />
                <Button 
                  type="submit" 
                  size="icon"
                  className="h-12 w-12 bg-amber-600 hover:bg-amber-700 text-white shrink-0"
                  disabled={!inputText.trim() || isTyping}
                >
                  <Send className="w-5 h-5" />
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
