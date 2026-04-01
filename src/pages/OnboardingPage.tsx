import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, FileText, CheckCircle2, ChevronRight, Briefcase, MapPin, DollarSign, Target, Loader2, AlertCircle, X, Linkedin, ShieldAlert } from "lucide-react";
import { auth, db } from "@/firebase";
import { doc, updateDoc } from "firebase/firestore";
import mammoth from "mammoth";
import { getGemini } from "@/lib/gemini";

export default function OnboardingPage() {
  const ai = getGemini();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [matchScore, setMatchScore] = useState(85);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [showSecurityAlert, setShowSecurityAlert] = useState(false);
  const [securityAlertMessage, setSecurityAlertMessage] = useState("");
  const [fileToValidate, setFileToValidate] = useState<File | null>(null);
  const [preferences, setPreferences] = useState({
    roles: "",
    location: "",
    minSalary: ""
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        navigate("/auth");
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const origin = event.origin;
      if (!origin.endsWith('.run.app') && !origin.includes('localhost')) {
        return;
      }
      if (event.data?.type === 'LINKEDIN_AUTH_SUCCESS') {
        setIsLoading(false);
        // Simulate generating a resume file from LinkedIn profile data
        const mockResume = new File(["LinkedIn Profile Data"], "LinkedIn_Profile_Resume.pdf", { type: "application/pdf" });
        setUploadedFile(mockResume);
        setErrorMsg(null);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleLinkedInImport = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const response = await fetch('/api/auth/linkedin/url');
      if (!response.ok) {
        throw new Error('Failed to get LinkedIn auth URL');
      }
      const { url } = await response.json();

      const authWindow = window.open(
        url,
        'oauth_popup',
        'width=600,height=700'
      );

      if (!authWindow) {
        setErrorMsg('Please allow popups for this site to connect your account.');
        setIsLoading(false);
      }
    } catch (error: any) {
      console.error('LinkedIn OAuth error:', error);
      setErrorMsg(error.message);
      setIsLoading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      validateAndSetFile(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      validateAndSetFile(file);
    }
  };

  const validateAndSetFile = async (file: File) => {
    console.log("File type:", file.type);
    console.log("File size:", file.size);
    const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    if (validTypes.includes(file.type) && file.size <= 10 * 1024 * 1024) {
      await scanResumeForSensitiveInfo(file);
    } else {
      setErrorMsg("Please upload a valid PDF, DOCX, or TXT file under 10MB.");
    }
  };

  const scanResumeForSensitiveInfo = async (file: File) => {
    setIsLoading(true);
    setErrorMsg(null);
    
    try {
      let contents: any;
      let mimeType = file.type;

      if (file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        contents = { parts: [{ text: result.value }] };
      } else {
        const base64Data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => resolve((reader.result as string).split(',')[1]);
          reader.onerror = reject;
        });
        contents = {
          parts: [
            {
              inlineData: {
                mimeType: mimeType,
                data: base64Data,
              },
            },
          ],
        };
      }

      const prompt = "Scan this resume for personal details like NRIC/identification numbers, bank account details, credit card numbers, and anything personal that is not typically resume-related. If found, return a JSON object with 'sensitiveFound': true and a 'message' describing what was found. If not found, return 'sensitiveFound': false.";
      
      contents.parts.push({ text: prompt });

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: contents,
        config: {
          responseMimeType: "application/json",
        },
      });

      const result = JSON.parse(response?.text || "{}");
      if (result.sensitiveFound) {
        setSecurityAlertMessage(result.message);
        setFileToValidate(file);
        setShowSecurityAlert(true);
      } else {
        setUploadedFile(file);
      }
    } catch (error: any) {
      console.error("Error scanning resume:", error);
      // If the scan fails (e.g., due to quota), we show the alert so the user can still proceed
      setSecurityAlertMessage("We couldn't scan your resume for sensitive information due to a temporary service issue. Would you like to proceed anyway?");
      setFileToValidate(file);
      setShowSecurityAlert(true);
    } finally {
      setIsLoading(false);
    }
  };

  const nextStep = async () => {
    if (!auth.currentUser) return;

    setIsLoading(true);
    try {
      const userRef = doc(db, "users", auth.currentUser.uid);
      
      if (step === 1) {
        // In a real app, you'd upload the file to Firebase Storage here
        // For now, we'll just mark that a resume was provided
        await updateDoc(userRef, {
          hasResume: !!uploadedFile,
          resumeName: uploadedFile?.name || null
        });
      } else if (step === 2) {
        await updateDoc(userRef, {
          preferences: {
            roles: preferences.roles,
            location: preferences.location,
            minSalary: preferences.minSalary,
            matchScore: matchScore
          }
        });
      }

      if (step < 3) setStep(step + 1);
      else navigate("/dashboard");
    } catch (error) {
      console.error("Error saving onboarding data:", error);
      setErrorMsg("Failed to save your progress. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckout = async (planId: string) => {
    setIsLoading(true);
    setErrorMsg(null);
    setCheckoutUrl(null);
    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ planId }),
      });
      
      const data = await response.json();
      
      if (data.url) {
        const newWindow = window.open(data.url, '_blank');
        if (!newWindow) {
          setCheckoutUrl(data.url);
          setErrorMsg("Popup blocked by your browser. Please click the 'Proceed to Checkout' button below.");
        }
      } else {
        console.error("Checkout error:", data.error);
        setErrorMsg(`Checkout failed: ${data.error || "Unknown error"}. Please check your Stripe Secret Key.`);
      }
    } catch (error) {
      console.error("Network error:", error);
      setErrorMsg("Network error occurred while trying to connect to the payment server.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex flex-col items-center justify-center p-6 selection:bg-indigo-500/30">
      <div className="w-full max-w-2xl">
        {/* Progress Bar */}
        <div className="mb-12">
          <div className="flex justify-between mb-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className={`flex items-center justify-center w-10 h-10 rounded-full border-2 font-bold ${
                step >= i ? "bg-indigo-600 border-indigo-600 text-white" : "bg-slate-900 border-slate-800 text-slate-500"
              }`}>
                {step > i ? <CheckCircle2 className="w-6 h-6" /> : i}
              </div>
            ))}
          </div>
          <div className="h-2 bg-slate-900 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-indigo-600"
              initial={{ width: "33%" }}
              animate={{ width: `${(step / 3) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-10 shadow-2xl"
            >
              <div className="text-center mb-10">
                <h2 className="text-3xl font-bold mb-4">Upload your resume</h2>
                <p className="text-slate-400 text-lg">We'll extract your skills and experience to find perfect matches.</p>
              </div>

              <div 
                className={`border-2 border-dashed rounded-2xl p-12 text-center transition-colors cursor-pointer group ${
                  isDragging ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-700 hover:bg-slate-800/50'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input 
                  type="file" 
                  className="hidden" 
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".pdf,.docx,.txt"
                />
                
                {uploadedFile ? (
                  <div className="flex flex-col items-center justify-center">
                    <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                      <FileText className="w-10 h-10 text-emerald-400" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2 text-emerald-400">File Uploaded Successfully</h3>
                    <p className="text-slate-300 mb-4">{uploadedFile.name}</p>
                    <Button 
                      variant="outline" 
                      className="bg-slate-950 border-slate-700 text-white hover:bg-slate-800"
                      onClick={(e) => {
                        e.stopPropagation();
                        setUploadedFile(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                    >
                      <X className="w-4 h-4 mr-2" /> Remove File
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-indigo-600/20 transition-colors">
                      {isLoading ? (
                        <Loader2 className="w-10 h-10 text-indigo-400 animate-spin" />
                      ) : (
                        <Upload className="w-10 h-10 text-indigo-400" />
                      )}
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Drag & drop your resume</h3>
                    <p className="text-slate-500 mb-6">PDF, DOCX, or TXT up to 10MB</p>
                    <Button variant="outline" className="bg-slate-950 border-slate-700 text-white hover:bg-slate-800" onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}>
                      Browse Files
                    </Button>
                  </>
                )}
              </div>
              
              {errorMsg && step === 1 && (
                <div className="mt-4 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                  <p className="text-rose-200 text-sm">{errorMsg}</p>
                </div>
              )}

              <div className="mt-8 flex items-center justify-center gap-4">
                <div className="h-px bg-slate-800 flex-1"></div>
                <span className="text-slate-500 text-sm font-medium uppercase tracking-wider">or</span>
                <div className="h-px bg-slate-800 flex-1"></div>
              </div>

              <Button 
                variant="outline" 
                className="w-full mt-8 h-14 bg-[#0A66C2] border-[#0A66C2] text-white hover:bg-[#004182] hover:text-white text-lg rounded-xl"
                onClick={handleLinkedInImport}
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Linkedin className="w-5 h-5 mr-2" />}
                Import from LinkedIn
              </Button>

              <div className="mt-10 flex justify-between">
                <Button variant="ghost" onClick={() => navigate("/auth")} className="text-slate-400 hover:bg-indigo-600 hover:text-white h-12 px-6">
                  Back
                </Button>
                <Button onClick={nextStep} className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 h-12 rounded-xl text-lg">
                  Continue <ChevronRight className="ml-2 w-5 h-5" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* Security Alert Modal */}
          {showSecurityAlert && (
            <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-6 z-50">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-md w-full shadow-2xl"
              >
                <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <ShieldAlert className="w-8 h-8 text-amber-400" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-center">Sensitive Information Detected</h3>
                <p className="text-slate-400 mb-6 text-center">{securityAlertMessage}</p>
                <div className="flex flex-col gap-2 w-full">
                  <Button 
                    variant="outline" 
                    className="w-full bg-slate-800 border-slate-700 text-white hover:bg-slate-700 h-8 text-xs"
                    onClick={() => {
                      setShowSecurityAlert(false);
                      setFileToValidate(null);
                    }}
                  >
                    Re-upload
                  </Button>
                  <Button 
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white h-8 text-xs"
                    onClick={() => {
                      if (fileToValidate) setUploadedFile(fileToValidate);
                      setShowSecurityAlert(false);
                      setFileToValidate(null);
                    }}
                  >
                    Proceed Anyway
                  </Button>
                </div>
              </motion.div>
            </div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-10 shadow-2xl"
            >
              <div className="text-center mb-10">
                <h2 className="text-3xl font-bold mb-4">Set your preferences</h2>
                <p className="text-slate-400 text-lg">Tell us what your dream job looks like.</p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2 flex items-center gap-2">
                    <Briefcase className="w-4 h-4" /> Dream Roles
                  </label>
                  <Input 
                    placeholder="e.g. Senior Frontend Engineer, React Developer" 
                    className="h-14 bg-slate-950 border-slate-800 text-white text-lg rounded-xl" 
                    value={preferences.roles}
                    onChange={(e) => setPreferences({...preferences, roles: e.target.value})}
                  />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2 flex items-center gap-2">
                      <MapPin className="w-4 h-4" /> Location
                    </label>
                    <Input 
                      placeholder="e.g. Remote, New York" 
                      className="h-14 bg-slate-950 border-slate-800 text-white text-lg rounded-xl" 
                      value={preferences.location}
                      onChange={(e) => setPreferences({...preferences, location: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2 flex items-center gap-2">
                      <DollarSign className="w-4 h-4" /> Min Salary
                    </label>
                    <Input 
                      placeholder="e.g. $120,000" 
                      className="h-14 bg-slate-950 border-slate-800 text-white text-lg rounded-xl" 
                      value={preferences.minSalary}
                      onChange={(e) => setPreferences({...preferences, minSalary: e.target.value})}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2 flex items-center gap-2">
                    <Target className="w-4 h-4" /> Minimum Match Score
                  </label>
                  <div className="flex items-center gap-4">
                    <input 
                      type="range" 
                      min="50" 
                      max="100" 
                      value={matchScore} 
                      onChange={(e) => setMatchScore(parseInt(e.target.value))}
                      className="w-full accent-indigo-500" 
                    />
                    <span className="text-2xl font-bold text-indigo-400 w-16 text-right">{matchScore}%</span>
                  </div>
                  <p className="text-sm text-slate-500 mt-2">We'll only apply to jobs where your skills match at least this percentage.</p>
                </div>
              </div>

              <div className="mt-10 flex justify-between">
                <Button variant="ghost" onClick={() => setStep(1)} className="text-slate-400 hover:bg-indigo-600 hover:text-white h-12 px-6">
                  Back
                </Button>
                <Button onClick={nextStep} className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 h-12 rounded-xl text-lg">
                  Continue <ChevronRight className="ml-2 w-5 h-5" />
                </Button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-10 shadow-2xl"
            >
              <div className="text-center mb-10">
                <h2 className="text-3xl font-bold mb-4">Choose your plan</h2>
                <p className="text-slate-400 text-lg">Start your 7-day unlimited trial. No credit card required.</p>
              </div>

              {errorMsg && (
                <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/50 rounded-xl flex items-start gap-3 text-rose-400">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <p className="text-sm">{errorMsg}</p>
                </div>
              )}

              {checkoutUrl && (
                <div className="mb-8 flex justify-center">
                  <a href={checkoutUrl} target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto">
                    <Button className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-8 h-12 rounded-xl text-lg shadow-lg shadow-indigo-500/20">
                      Proceed to Checkout <ChevronRight className="ml-2 w-5 h-5" />
                    </Button>
                  </a>
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-6">
                <div className="border border-slate-800 bg-slate-950 rounded-2xl p-8 hover:border-indigo-500/50 transition-colors cursor-pointer relative overflow-hidden group">
                  <div className="absolute top-0 right-0 bg-slate-800 text-xs font-bold px-3 py-1 rounded-bl-lg text-slate-300">BASIC</div>
                  <h3 className="text-2xl font-bold mb-2">Review Queue</h3>
                  <div className="text-3xl font-bold text-indigo-400 mb-6">$29<span className="text-lg text-slate-500 font-normal">/mo</span></div>
                  <ul className="space-y-3 text-slate-400 mb-8">
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-indigo-500" /> 100 applications/mo</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-indigo-500" /> Manual approval required</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-indigo-500" /> Basic AI matching</li>
                  </ul>
                  <Button 
                    variant="outline" 
                    className="w-full border-slate-700 bg-slate-900 text-white group-hover:bg-slate-800"
                    onClick={() => handleCheckout('basic')}
                    disabled={isLoading}
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Select Plan"}
                  </Button>
                </div>

                <div className="border-2 border-indigo-500 bg-indigo-950/20 rounded-2xl p-8 cursor-pointer relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-indigo-500 text-xs font-bold px-3 py-1 rounded-bl-lg text-white">PRO</div>
                  <h3 className="text-2xl font-bold mb-2">Full Auto</h3>
                  <div className="text-3xl font-bold text-indigo-400 mb-6">$79<span className="text-lg text-slate-500 font-normal">/mo</span></div>
                  <ul className="space-y-3 text-slate-400 mb-8">
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-indigo-500" /> Unlimited applications</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-indigo-500" /> 24/7 Set-it-and-forget</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-indigo-500" /> Custom Cover Letters</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-indigo-500" /> Interview Buddy Access</li>
                  </ul>
                  <Button 
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                    onClick={() => handleCheckout('pro')}
                    disabled={isLoading}
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Start Free Trial"}
                  </Button>
                </div>
              </div>

              <div className="mt-10 flex justify-between items-center gap-2">
                <Button variant="ghost" onClick={() => setStep(2)} className="text-slate-400 hover:bg-indigo-600 hover:text-white h-10 sm:h-12 px-4 sm:px-6 text-sm sm:text-base">
                  Back
                </Button>
                <Button onClick={nextStep} className="bg-white text-slate-950 hover:bg-slate-200 px-4 sm:px-8 h-10 sm:h-12 rounded-lg sm:rounded-xl text-sm sm:text-lg font-bold whitespace-nowrap">
                  Go to Dashboard <ChevronRight className="ml-1 sm:ml-2 w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
