import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GraduationCap, Send, Loader2, BookOpen, FileText, HelpCircle, TrendingUp, Search, RefreshCw, Maximize2, Minimize2, Copy, Edit2, Check } from "lucide-react";
import { GoogleGenAI } from "@google/genai";
import ReactMarkdown from "react-markdown";

const prompts = [
  {
    id: "20-hours",
    title: "Learn Anything in 20 Hours",
    icon: <BookOpen className="w-5 h-5 text-indigo-400" />,
    template: "I need to learn [topic] fast. Build me a 20-hour focused on 20% that drives 80% of results. Break it into 10 two-hour sessions with the best resources and a 15-minute review at the end of each session."
  },
  {
    id: "cheat-sheet",
    title: "Create a One-Page Cheat Sheet",
    icon: <FileText className="w-5 h-5 text-emerald-400" />,
    template: "Summarize the key concepts of [topic] on a single page. Use bullet points, diagrams, and examples so I can review it in 5 minutes."
  },
  {
    id: "quiz",
    title: "Quiz Me Until I Break",
    icon: <HelpCircle className="w-5 h-5 text-rose-400" />,
    template: "I just studied [topic]. Give me 10 progressively harder questions to test my understanding. After each answer, grade me and explain what I missed."
  },
  {
    id: "ladder",
    title: "Build a Learning Ladder",
    icon: <TrendingUp className="w-5 h-5 text-amber-400" />,
    template: "Break [topic] into 5 levels of difficulty. Show me how to go from level 1 (beginner) to level 5 (advanced) with a clear milestone at each step."
  },
  {
    id: "resources",
    title: "Find Best Resources",
    icon: <Search className="w-5 h-5 text-cyan-400" />,
    template: "List the top 5 resources (books, videos, courses, or people) for learning [topic] fast and explain why each is worth my time."
  },
  {
    id: "feynman",
    title: "Use Feynman Technique",
    icon: <RefreshCw className="w-5 h-5 text-purple-400" />,
    template: "Explain [topic] to me in the simplest terms. Then have me re-explain it back. Point out gaps, re-teach what I miss, and repeat until I can explain it clearly on my own."
  }
];

export default function LearningLab() {
  const [topic, setTopic] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<{role: 'user' | 'model', content: string}[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Store the chat instance in a ref so it persists across renders
  const chatRef = useRef<any>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory, isLoading]);

  const initChat = () => {
    if (!chatRef.current) {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });
      chatRef.current = ai.chats.create({
        model: "gemini-3.1-pro-preview",
        config: {
          systemInstruction: "You are an expert tutor and learning coach. Your goal is to help the user learn complex topics quickly and effectively using proven learning frameworks like the Feynman technique, spaced repetition, and active recall. Format your responses using Markdown for readability (bolding, lists, code blocks if necessary). Be encouraging but rigorous.",
        }
      });
    }
    return chatRef.current;
  };

  const handlePromptClick = (template: string) => {
    if (!topic.trim()) {
      setErrorMsg("Please enter a topic first!");
      return;
    }
    setErrorMsg(null);
    const finalPrompt = template.replace(/\[topic\]/g, topic);
    
    // Reset chat history when starting a new framework
    setChatHistory([]);
    chatRef.current = null; // Force new chat instance
    
    handleSend(finalPrompt);
  };

  const handleSend = async (message: string) => {
    if (!message.trim()) return;
    
    setChatHistory(prev => [...prev, { role: 'user', content: message }]);
    setIsLoading(true);
    setInputValue("");

    try {
      const chat = initChat();
      const response = await chat.sendMessage({ message });

      if (response.text) {
        setChatHistory(prev => [...prev, { role: 'model', content: response.text || "" }]);
      }
    } catch (error) {
      console.error("Error generating content:", error);
      setChatHistory(prev => [...prev, { role: 'model', content: "Sorry, I encountered an error. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className={isFullScreen ? "fixed inset-0 z-50 bg-slate-950 flex flex-col p-4 sm:p-6" : "space-y-6 lg:space-y-8 max-w-5xl mx-auto h-auto lg:h-[calc(100vh-120px)] flex flex-col"}>
      {!isFullScreen && (
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2 flex items-center gap-3">
            <GraduationCap className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-400" />
            Learning Lab
          </h1>
          <p className="text-sm sm:text-base text-slate-400">Master new skills required for your dream job using optimized AI learning techniques.</p>
        </div>
      )}

      <div className={`gap-6 flex-1 min-h-0 ${isFullScreen ? 'flex flex-col' : 'grid grid-cols-1 lg:grid-cols-3'}`}>
        {/* Prompts Sidebar */}
        {!isFullScreen && (
          <div className="lg:col-span-1 space-y-4 flex flex-col h-auto lg:h-full lg:overflow-y-auto pr-0 lg:pr-2 custom-scrollbar">
            <div className="sticky top-0 bg-slate-950 pb-4 z-10">
              <label className="block text-sm font-medium text-slate-400 mb-2">What do you want to learn?</label>
              <Input 
                placeholder="e.g. React Native, System Design, Python..." 
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="h-12 bg-slate-900 border-slate-800 text-white"
              />
              {errorMsg && (
                <p className="text-rose-400 text-sm mt-2">{errorMsg}</p>
              )}
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3 pb-4">
              {prompts.map((prompt) => (
                <button
                  key={prompt.id}
                  onClick={() => handlePromptClick(prompt.template)}
                  className="w-full text-left p-4 rounded-xl bg-slate-900/50 border border-slate-800 hover:bg-slate-800 hover:border-indigo-500/50 transition-all group"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 group-hover:border-slate-700 shrink-0">
                      {prompt.icon}
                    </div>
                    <h3 className="font-semibold text-slate-200 text-sm sm:text-base">{prompt.title}</h3>
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-2">
                    {prompt.template.replace(/\[topic\]/g, topic || "...")}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Chat Interface */}
        <Card className={`${isFullScreen ? 'flex-1 border-slate-800' : 'lg:col-span-2'} bg-slate-900/50 border-slate-800 flex flex-col min-h-[500px] lg:min-h-0 lg:h-full overflow-hidden`}>
          <div className="flex items-center justify-between p-3 border-b border-slate-800 bg-slate-900/80 shrink-0">
            <div className="flex items-center gap-2 px-2">
              <GraduationCap className="w-5 h-5 text-indigo-400" />
              <span className="font-medium text-slate-200">Learning Assistant</span>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setIsFullScreen(!isFullScreen)} className="text-slate-400 hover:text-white hover:bg-slate-800">
              {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>
          </div>
          <CardContent className="flex-1 p-0 flex flex-col h-full overflow-hidden">
            <div className="flex-1 p-6 overflow-y-auto space-y-6 custom-scrollbar">
              {chatHistory.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-4">
                  <GraduationCap className="w-16 h-16 text-slate-800" />
                  <p className="text-center max-w-sm">
                    Enter a topic on the left and select a learning framework to begin your accelerated learning journey.
                  </p>
                </div>
              ) : (
                chatHistory.map((msg, idx) => (
                  <div key={idx} className={`flex gap-4 group ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 ${
                      msg.role === 'user' ? 'bg-slate-700' : 'bg-indigo-600'
                    }`}>
                      {msg.role === 'user' ? 'You' : 'AI'}
                    </div>
                    <div className={`flex flex-col gap-1 max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                      <div className={`rounded-2xl px-5 py-4 text-sm overflow-hidden ${
                        msg.role === 'user' 
                          ? 'bg-indigo-600 text-white rounded-tr-none' 
                          : 'bg-slate-800 text-slate-200 rounded-tl-none prose prose-invert max-w-none'
                      }`}>
                        {msg.role === 'user' ? (
                          msg.content
                        ) : (
                          <div className="markdown-body">
                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                          </div>
                        )}
                      </div>
                      
                      {/* Action buttons */}
                      <div className={`flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity px-2 mt-1 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <button 
                          onClick={() => handleCopy(msg.content, idx)}
                          className="text-slate-500 hover:text-slate-300 flex items-center gap-1 text-xs font-medium transition-colors"
                        >
                          {copiedIndex === idx ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          {copiedIndex === idx ? <span className="text-emerald-400">Copied</span> : "Copy"}
                        </button>
                        {msg.role === 'user' && (
                          <button 
                            onClick={() => {
                              setInputValue(msg.content);
                              inputRef.current?.focus();
                            }}
                            className="text-slate-500 hover:text-slate-300 flex items-center gap-1 text-xs font-medium transition-colors"
                          >
                            <Edit2 className="w-3 h-3" />
                            Edit
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
              {isLoading && (
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center shrink-0 mt-1">
                    AI
                  </div>
                  <div className="bg-slate-800 rounded-2xl rounded-tl-none px-5 py-4 text-sm text-slate-200 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                    Generating response...
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            
            <div className="p-4 border-t border-slate-800 bg-slate-900/80 shrink-0">
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend(inputValue);
                }}
                className="relative"
              >
                <Input 
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Ask a follow-up question or provide your answer..." 
                  className="pr-12 bg-slate-950 border-slate-800 text-white h-12 rounded-xl"
                  disabled={isLoading}
                  autoComplete="off"
                />
                <Button 
                  type="submit"
                  size="icon" 
                  disabled={isLoading || !inputValue.trim()}
                  className="absolute right-1 top-1 h-10 w-10 bg-indigo-600 hover:bg-indigo-700 rounded-lg"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
