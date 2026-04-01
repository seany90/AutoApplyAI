import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bot, Github, Linkedin, Loader2, Mail, Phone } from "lucide-react";
import { motion } from "motion/react";
import { 
  auth, 
  db,
  googleProvider, 
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  RecaptchaVerifier,
  signInWithPhoneNumber
} from "@/firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

declare global {
  interface Window {
    recaptchaVerifier: any;
  }
}

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const navigate = useNavigate();

  // Email/Password state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Phone Auth state
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<any>(null);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const origin = event.origin;
      if (!origin.endsWith('.run.app') && !origin.includes('localhost')) {
        return;
      }
      if (event.data?.type === 'LINKEDIN_AUTH_SUCCESS') {
        setIsLoading(false);
        navigate("/onboarding");
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [navigate]);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Create user doc if it doesn't exist
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        await setDoc(userDocRef, {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          subscriptionStatus: "free",
          notificationSettings: {
            email: true,
            push: true,
            marketing: false
          },
          createdAt: serverTimestamp()
        });
      }
      
      navigate("/onboarding");
    } catch (error: any) {
      console.error("Google login error:", error);
      setErrorMsg(error.message);
      setIsLoading(false);
    }
  };

  const handleLinkedInLogin = async () => {
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

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        const user = result.user;
        
        // Create user doc
        await setDoc(doc(db, "users", user.uid), {
          uid: user.uid,
          email: user.email,
          displayName: name,
          subscriptionStatus: "free",
          notificationSettings: {
            email: true,
            push: true,
            marketing: false
          },
          createdAt: serverTimestamp()
        });
      }
      navigate("/onboarding");
    } catch (error: any) {
      console.error("Email auth error:", error);
      setErrorMsg(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const setupRecaptcha = () => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        'size': 'invisible',
        'callback': () => {
          // reCAPTCHA solved
        }
      });
    }
  };

  const handleSendPhoneCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber) return;
    
    setIsLoading(true);
    setErrorMsg(null);
    try {
      setupRecaptcha();
      const appVerifier = window.recaptchaVerifier;
      // Phone number must be in E.164 format (e.g., +1234567890)
      const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
      const confirmation = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
      setConfirmationResult(confirmation);
      setIsCodeSent(true);
    } catch (error: any) {
      console.error("Phone auth error:", error);
      setErrorMsg(error.message);
      // Reset recaptcha if error
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyPhoneCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationCode || !confirmationResult) return;

    setIsLoading(true);
    setErrorMsg(null);
    try {
      const cleanCode = verificationCode.replace(/\D/g, '');
      const result = await confirmationResult.confirm(cleanCode);
      const user = result.user;

      // Create user doc if it doesn't exist
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        await setDoc(userDocRef, {
          uid: user.uid,
          phoneNumber: user.phoneNumber,
          subscriptionStatus: "free",
          notificationSettings: {
            email: true,
            push: true,
            marketing: false
          },
          createdAt: serverTimestamp()
        });
      }

      navigate("/onboarding");
    } catch (error: any) {
      console.error("Verification error:", error);
      if (error.code === 'auth/invalid-verification-code') {
        setErrorMsg("Invalid verification code. Please try again.");
      } else if (error.code === 'auth/code-expired') {
        setErrorMsg("Verification code expired. Please request a new one.");
      } else {
        setErrorMsg(`Verification failed: ${error.message || "Please try again."}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 selection:bg-indigo-500/30">
      <div className="w-full max-w-md">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl"
        >
          <div className="flex justify-center mb-8">
            <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center">
              <Bot className="w-7 h-7 text-white" />
            </div>
          </div>
          
          <h2 className="text-2xl font-bold text-white text-center mb-2">
            {isLogin ? "Welcome back" : "Create your account"}
          </h2>
          <p className="text-slate-400 text-center mb-8">
            {isLogin ? "Enter your details to access your dashboard." : "Start your 7-day unlimited trial today."}
          </p>

          <div className="space-y-4 mb-8">
            <Button 
              variant="outline" 
              className="w-full h-12 bg-slate-800 border-slate-700 text-white hover:bg-slate-700 hover:text-white" 
              onClick={handleGoogleLogin}
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : (
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
              )}
              Continue with Google
            </Button>
            <Button 
              variant="outline" 
              className="w-full h-12 bg-[#0A66C2] border-[#0A66C2] text-white hover:bg-[#004182] hover:text-white" 
              onClick={handleLinkedInLogin}
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Linkedin className="w-5 h-5 mr-2" />}
              Connect LinkedIn
            </Button>
          </div>

          <div className="relative mb-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-800"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-slate-900 text-slate-500">Or continue with</span>
            </div>
          </div>

          <div className="flex gap-2 mb-6">
            <Button 
              type="button"
              variant={authMethod === 'email' ? 'default' : 'outline'}
              className={`flex-1 h-10 ${authMethod === 'email' ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-white'}`}
              onClick={() => { setAuthMethod('email'); setErrorMsg(null); }}
            >
              <Mail className="w-4 h-4 mr-2" />
              Email
            </Button>
            <Button 
              type="button"
              variant={authMethod === 'phone' ? 'default' : 'outline'}
              className={`flex-1 h-10 ${authMethod === 'phone' ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-white'}`}
              onClick={() => { setAuthMethod('phone'); setErrorMsg(null); }}
            >
              <Phone className="w-4 h-4 mr-2" />
              Phone
            </Button>
          </div>

          {errorMsg && (
            <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm text-center">
              {errorMsg}
            </div>
          )}

          {authMethod === 'email' ? (
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              {!isLogin && (
                <div>
                  <Input 
                    type="text" 
                    placeholder="Full Name" 
                    className="h-12 bg-slate-950 border-slate-800 text-white placeholder:text-slate-500" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required 
                  />
                </div>
              )}
              <div>
                <Input 
                  type="email" 
                  placeholder="Email address" 
                  className="h-12 bg-slate-950 border-slate-800 text-white placeholder:text-slate-500" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required 
                />
              </div>
              <div>
                <Input 
                  type="password" 
                  placeholder="Password" 
                  className="h-12 bg-slate-950 border-slate-800 text-white placeholder:text-slate-500" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                />
              </div>
              <Button type="submit" disabled={isLoading} className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white text-base font-medium mt-2">
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isLogin ? "Sign In" : "Start Free Trial")}
              </Button>
            </form>
          ) : (
            <div className="space-y-4">
              <div id="recaptcha-container"></div>
              {!isCodeSent ? (
                <form onSubmit={handleSendPhoneCode} className="space-y-4">
                  <div>
                    <Input 
                      type="tel" 
                      placeholder="Phone number (e.g. +1234567890)" 
                      className="h-12 bg-slate-950 border-slate-800 text-white placeholder:text-slate-500" 
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      required 
                    />
                    <p className="text-xs text-slate-500 mt-2">Include your country code (e.g., +1 for US)</p>
                  </div>
                  <Button type="submit" disabled={isLoading || !phoneNumber} className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white text-base font-medium mt-2">
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Send Code"}
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleVerifyPhoneCode} className="space-y-4">
                  <div>
                    <Input 
                      type="text" 
                      placeholder="Enter 6-digit code" 
                      className="h-12 bg-slate-950 border-slate-800 text-white placeholder:text-slate-500 text-center tracking-[0.5em] text-lg" 
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                      maxLength={6}
                      required 
                    />
                  </div>
                  <Button type="submit" disabled={isLoading || verificationCode.length !== 6} className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white text-base font-medium mt-2">
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Verify & Continue"}
                  </Button>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    className="w-full text-slate-400 hover:text-white"
                    onClick={() => {
                      setIsCodeSent(false);
                      setVerificationCode("");
                      setErrorMsg(null);
                    }}
                  >
                    Use a different number
                  </Button>
                </form>
              )}
            </div>
          )}

          <div className="mt-8 text-center text-sm text-slate-400">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button 
              onClick={() => {
                setIsLogin(!isLogin);
                setErrorMsg(null);
              }} 
              className="text-indigo-400 hover:text-indigo-300 font-medium"
            >
              {isLogin ? "Sign up" : "Log in"}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
