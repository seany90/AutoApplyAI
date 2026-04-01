import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Languages, Sparkles, Copy, Check } from "lucide-react";
import { getGemini } from "@/lib/gemini";
import Markdown from "react-markdown";

const LANGUAGES = [
  "Spanish", "French", "German", "Mandarin Chinese", "Japanese", 
  "Hindi", "Arabic", "Portuguese", "Russian", "Korean", 
  "Italian", "Dutch", "Polish", "Turkish", "Vietnamese"
];

export default function FormatTranslator({ onBack }: { onBack: () => void }) {
  const [sourceText, setSourceText] = useState("");
  const [targetLanguage, setTargetLanguage] = useState("");
  const [isTranslating, setIsTranslating] = useState(false);
  const [translatedText, setTranslatedText] = useState("");
  const [copied, setCopied] = useState(false);

  const handleTranslate = async () => {
    if (!sourceText || !targetLanguage) return;
    setIsTranslating(true);
    setTranslatedText("");

    try {
      const ai = getGemini();
      const prompt = `
        You are an expert, native-level translator.
        
        Translate the following text into ${targetLanguage}.
        
        CRITICAL INSTRUCTIONS:
        1. Preserve ALL Markdown formatting exactly as it appears (e.g., **bold**, *italics*, bullet points, headers).
        2. Do NOT translate technical terms or proper nouns if they are typically left in English in the target language.
        3. Ensure the tone remains professional and suitable for a resume or formal document.
        4. Output ONLY the translated text. Do not include any conversational filler or explanations.
        
        Source Text:
        ${sourceText}
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });

      setTranslatedText(response.text || "Failed to translate document.");
    } catch (error) {
      console.error("Translation error:", error);
      setTranslatedText("An error occurred during translation. Please try again.");
    } finally {
      setIsTranslating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(translatedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Languages className="w-6 h-6 text-purple-400" />
            Format-Preserving Translator
          </h2>
          <p className="text-slate-400">Translate your resume while keeping the exact Markdown formatting intact.</p>
        </div>
        <Button variant="outline" onClick={onBack} className="bg-transparent border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white">
          Back to Tools
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Source Document</CardTitle>
              <CardDescription className="text-slate-400">
                Paste your Markdown resume or cover letter here.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea 
                placeholder="Paste your document here..."
                className="min-h-[300px] bg-slate-950 border-slate-800 text-slate-200 placeholder:text-slate-600 font-mono text-sm"
                value={sourceText}
                onChange={(e) => setSourceText(e.target.value)}
              />
              
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Select value={targetLanguage} onValueChange={setTargetLanguage}>
                    <SelectTrigger className="w-full bg-slate-950 border-slate-800 text-slate-200 hover:text-white">
                      <SelectValue placeholder="Select target language..." />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
                      {LANGUAGES.map(lang => (
                        <SelectItem key={lang} value={lang} className="hover:bg-slate-800 focus:bg-slate-800 hover:text-white focus:text-white cursor-pointer">
                          {lang}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  className="bg-purple-600 hover:bg-purple-700 text-white flex-1"
                  onClick={handleTranslate}
                  disabled={!sourceText || !targetLanguage || isTranslating}
                >
                  {isTranslating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Translating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Translate
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="h-full">
          <Card className="bg-slate-900 border-slate-800 h-full flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <CardTitle className="text-white">Translated Result</CardTitle>
                <CardDescription className="text-slate-400">
                  {targetLanguage ? `Translated to ${targetLanguage}` : "Awaiting translation..."}
                </CardDescription>
              </div>
              {translatedText && (
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
                      Copy Markdown
                    </>
                  )}
                </Button>
              )}
            </CardHeader>
            <CardContent className="flex-1 p-0">
              {translatedText ? (
                <div className="p-6 prose prose-invert max-w-none h-[400px] overflow-y-auto custom-scrollbar text-white">
                  <Markdown>{translatedText}</Markdown>
                </div>
              ) : (
                <div className="h-[400px] flex flex-col items-center justify-center text-slate-500 space-y-4 p-6 text-center">
                  <div className="w-16 h-16 rounded-full bg-slate-800/50 flex items-center justify-center">
                    <Languages className="w-8 h-8 text-slate-600" />
                  </div>
                  <p>Your perfectly formatted translation will appear here.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
