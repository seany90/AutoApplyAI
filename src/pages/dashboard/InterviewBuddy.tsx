import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mic, Video, MessageSquare, Play, Square, Settings2, Check, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { GoogleGenAI } from "@google/genai";
import ReactMarkdown from "react-markdown";

interface Message {
  role: 'user' | 'model';
  text: string;
}

export default function InterviewBuddy() {
  const [isRecording, setIsRecording] = useState(false);
  const [mode, setMode] = useState<'text' | 'voice'>('text');
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const chatRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initChat = async () => {
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });
        chatRef.current = ai.chats.create({
          model: "gemini-3-flash-preview",
          config: {
            systemInstruction: `You are an expert technical interviewer and hiring manager at Stripe interviewing a candidate for a Senior React Developer role. 
            The candidate's resume highlights: Led migration from Redux to Zustand, built payment flow using Stripe Elements, mentored 3 junior developers. 
            Company culture keywords: Writing-heavy, High agency, User-first.
            
            Instructions:
            1. Ask ONE interview question at a time.
            2. Wait for the candidate's response.
            3. Provide brief, constructive feedback on their previous answer (highlighting what they did well and how they could improve based on their resume/company culture).
            4. Ask the next question.
            5. Keep your responses concise and conversational.`
          }
        });
        
        // Initial greeting
        setMessages([{
          role: 'model',
          text: "Hello! I'm the hiring manager for the Senior React Developer role at Stripe. Let's start by discussing your experience with state management in large applications. Can you walk me through a complex state problem you solved recently?"
        }]);
      } catch (error) {
        console.error("Failed to initialize chat:", error);
      }
    };
    initChat();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputText.trim() || isLoading || !chatRef.current) return;
    
    const userMsg = inputText.trim();
    setInputText("");
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);
    
    try {
      const response = await chatRef.current.sendMessage({ message: userMsg });
      setMessages(prev => [...prev, { role: 'model', text: response.text }]);
    } catch (error) {
      console.error("Failed to send message:", error);
      setMessages(prev => [...prev, { role: 'model', text: "Sorry, I encountered an error. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Interview Buddy 2.0</h1>
          <p className="text-slate-400">Real-time coaching grounded in your resume and company research.</p>
        </div>
        <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-xl border border-slate-800 w-full sm:w-auto">
          <button 
            onClick={() => setMode('text')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-medium transition-colors ${mode === 'text' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            Text Chat
          </button>
          <button 
            onClick={() => setMode('voice')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-medium transition-colors ${mode === 'voice' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            Voice/Video
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Interface */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-slate-900/50 border-slate-800 h-[500px] sm:h-[600px] flex flex-col">
            <CardHeader className="border-b border-slate-800 pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-medium flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                  Mock Interview: Senior React Developer @ Stripe
                </CardTitle>
                <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                  <Settings2 className="w-5 h-5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex-1 p-6 flex flex-col justify-end space-y-4 overflow-y-auto">
              {/* Chat History */}
              <div className="space-y-6">
                {messages.map((msg, idx) => (
                  <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-slate-700' : 'bg-indigo-600'}`}>
                      <span className="text-xs font-bold">{msg.role === 'user' ? 'You' : 'AI'}</span>
                    </div>
                    <div className={`rounded-2xl px-5 py-3 text-sm max-w-[80%] ${
                      msg.role === 'user' 
                        ? 'bg-indigo-600 text-white rounded-tr-none' 
                        : 'bg-slate-800 text-slate-200 rounded-tl-none'
                    }`}>
                      <div className="prose prose-invert prose-sm max-w-none">
                        <ReactMarkdown>{msg.text}</ReactMarkdown>
                      </div>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold">AI</span>
                    </div>
                    <div className="bg-slate-800 rounded-2xl rounded-tl-none px-5 py-4 text-sm text-slate-200 max-w-[80%] flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                      <span className="text-slate-400">Thinking...</span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </CardContent>
            
            {/* Input Area */}
            <div className="p-4 border-t border-slate-800 bg-slate-900">
              {mode === 'text' ? (
                <div className="relative">
                  <Input 
                    placeholder="Type your answer..." 
                    className="pr-12 bg-slate-950 border-slate-800 text-white h-12 rounded-xl"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={isLoading}
                  />
                  <Button 
                    size="icon" 
                    className="absolute right-1 top-1 h-10 w-10 bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-50"
                    onClick={handleSendMessage}
                    disabled={isLoading || !inputText.trim()}
                  >
                    <MessageSquare className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-4 py-4">
                  <Button 
                    size="lg" 
                    className={`rounded-full w-16 h-16 ${isRecording ? 'bg-rose-600 hover:bg-rose-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                    onClick={() => setIsRecording(!isRecording)}
                  >
                    {isRecording ? <Square className="w-6 h-6 fill-current" /> : <Mic className="w-6 h-6" />}
                  </Button>
                  {isRecording && (
                    <motion.div 
                      initial={{ opacity: 0 }} 
                      animate={{ opacity: 1 }} 
                      className="text-rose-400 font-medium animate-pulse"
                    >
                      Recording... 00:14
                    </motion.div>
                  )}
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Sidebar Context */}
        <div className="space-y-6">
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-lg font-medium">Company Context</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Company</h4>
                <p className="text-sm text-slate-300">Stripe</p>
              </div>
              <div>
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Recent News</h4>
                <p className="text-sm text-slate-300">Recently launched Stripe Capital for more regions. Focus heavily on developer experience and API design.</p>
              </div>
              <div>
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Culture Keywords</h4>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="px-2 py-1 bg-slate-800 rounded text-xs text-slate-300">Writing-heavy</span>
                  <span className="px-2 py-1 bg-slate-800 rounded text-xs text-slate-300">High agency</span>
                  <span className="px-2 py-1 bg-slate-800 rounded text-xs text-slate-300">User-first</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-lg font-medium">Your Resume Highlights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                <p className="text-sm text-slate-300">Led migration from Redux to Zustand (mention this for state mgmt questions).</p>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                <p className="text-sm text-slate-300">Built payment flow using Stripe Elements at previous job (highly relevant!).</p>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                <p className="text-sm text-slate-300">Mentored 3 junior developers.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
