import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { 
  User, 
  Lock, 
  CreditCard, 
  Bell, 
  Shield, 
  Mail, 
  UserCircle,
  Loader2,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { motion } from "motion/react";
import { auth, db } from "@/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { updatePassword, deleteUser, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { useNavigate } from "react-router-dom";

export default function Settings() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Profile State
  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    email: "",
    bio: "",
    subscriptionStatus: "free",
    linkedInConnected: false,
    notificationSettings: {
      email: true,
      push: true,
      marketing: false
    }
  });

  // Password State
  const [passwords, setPasswords] = useState({
    current: "",
    new: "",
    confirm: ""
  });

  useEffect(() => {
    const handleAuthSuccess = async (profile?: any) => {
      console.log("[LinkedIn Settings] Handling success...", profile);
      setIsLoading(false);
      setProfile(prev => ({ ...prev, linkedInConnected: true }));
      if (auth.currentUser) {
        try {
          await updateDoc(doc(db, "users", auth.currentUser.uid), { 
            linkedInConnected: true,
            linkedInProfile: profile || null
          });
          setSuccessMsg("LinkedIn connected successfully!");
          setTimeout(() => setSuccessMsg(null), 3000);
          console.log("[LinkedIn Settings] Firestore updated successfully.");
        } catch (error) {
          console.error("[LinkedIn Settings] Error updating LinkedIn connection status:", error);
          setErrorMsg("Failed to update LinkedIn connection status.");
        }
      }
    };

    const handleMessage = async (event: MessageEvent) => {
      const origin = event.origin;
      console.log(`[LinkedIn Settings] Received message from origin: ${origin}`, event.data);
      
      // Allow messages from the same origin or trusted domains
      const isTrusted = 
        origin === window.location.origin || 
        origin.endsWith('.run.app') || 
        origin.includes('localhost') ||
        origin.includes('google.com');

      if (!isTrusted) {
        // Only log warning if it's not a known internal message (like recaptcha)
        if (typeof event.data !== 'string' || !event.data.includes('recaptcha')) {
          console.warn("[LinkedIn Settings] Ignored message from untrusted origin:", origin);
        }
        return;
      }
      
      if (event.data?.type === 'LINKEDIN_AUTH_SUCCESS') {
        console.log("[LinkedIn Settings] Success message received via postMessage.");
        handleAuthSuccess(event.data.profile);
      } else if (event.data?.type === 'LINKEDIN_AUTH_ERROR') {
        console.error("[LinkedIn Settings] Error message received via postMessage:", event.data.error);
        setIsLoading(false);
        setErrorMsg(event.data.error || "LinkedIn authentication failed.");
      }
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key === 'linkedin_auth_success') {
        console.log("[LinkedIn Settings] Detected success via storage event.");
        const profileStr = localStorage.getItem('linkedin_profile');
        const profile = profileStr ? JSON.parse(profileStr) : undefined;
        handleAuthSuccess(profile);
        localStorage.removeItem('linkedin_auth_success');
      }
    };

    // BroadcastChannel for more reliable communication
    const bc = new BroadcastChannel('linkedin_auth');
    bc.onmessage = (event) => {
      console.log("[LinkedIn Settings] Received message via BroadcastChannel:", event.data);
      if (event.data?.type === 'LINKEDIN_AUTH_SUCCESS') {
        handleAuthSuccess(event.data.profile);
      } else if (event.data?.type === 'LINKEDIN_AUTH_ERROR') {
        setIsLoading(false);
        setErrorMsg(event.data.error || "LinkedIn authentication failed.");
      }
    };

    window.addEventListener('message', handleMessage);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('message', handleMessage);
      window.removeEventListener('storage', handleStorage);
      bc.close();
    };
  }, []);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setProfile({
              firstName: data.firstName || "",
              lastName: data.lastName || "",
              email: user.email || "",
              bio: data.bio || "",
              subscriptionStatus: data.subscriptionStatus || "free",
              linkedInConnected: data.linkedInConnected || false,
              notificationSettings: data.notificationSettings || {
                email: true,
                push: true,
                marketing: false
              }
            });
          } else {
            setProfile(prev => ({ ...prev, email: user.email || "" }));
          }
        } catch (error) {
          console.error("Error fetching profile:", error);
          setErrorMsg("Failed to load profile data.");
        } finally {
          setIsPageLoading(false);
        }
      } else {
        navigate("/auth");
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;

    setIsLoading(true);
    setErrorMsg(null);
    try {
      await updateDoc(doc(db, "users", auth.currentUser.uid), {
        firstName: profile.firstName,
        lastName: profile.lastName,
        bio: profile.bio,
        linkedInConnected: profile.linkedInConnected,
        notificationSettings: profile.notificationSettings
      });
      setSuccessMsg("Profile updated successfully!");
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (error) {
      console.error("Error updating profile:", error);
      setErrorMsg("Failed to update profile. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!auth.currentUser || !auth.currentUser.email) return;
    if (passwords.new !== passwords.confirm) {
      setErrorMsg("New passwords do not match.");
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    try {
      // Re-authenticate user first (required for sensitive operations)
      const credential = EmailAuthProvider.credential(auth.currentUser.email, passwords.current);
      await reauthenticateWithCredential(auth.currentUser, credential);
      
      await updatePassword(auth.currentUser, passwords.new);
      setSuccessMsg("Password updated successfully!");
      setPasswords({ current: "", new: "", confirm: "" });
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (error: any) {
      console.error("Error updating password:", error);
      setErrorMsg(error.message || "Failed to update password. Ensure your current password is correct.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!auth.currentUser || !window.confirm("Are you absolutely sure? This action is irreversible and all your data will be deleted.")) return;

    setIsLoading(true);
    setErrorMsg(null);
    try {
      // Note: Re-authentication might be needed here too if the session is old
      await deleteUser(auth.currentUser);
      navigate("/auth");
    } catch (error: any) {
      console.error("Error deleting account:", error);
      setErrorMsg("Failed to delete account. You may need to log out and log back in to perform this action.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLinkedInConnect = async () => {
    if (profile.linkedInConnected) {
      // Disconnect
      setProfile(prev => ({ ...prev, linkedInConnected: false }));
      if (auth.currentUser) {
        try {
          await updateDoc(doc(db, "users", auth.currentUser.uid), { linkedInConnected: false });
          setSuccessMsg("LinkedIn disconnected.");
          setTimeout(() => setSuccessMsg(null), 3000);
        } catch (error) {
          console.error("Error disconnecting LinkedIn:", error);
          setErrorMsg("Failed to disconnect LinkedIn.");
        }
      }
      return;
    }

    // Connect
    setIsLoading(true);
    setErrorMsg(null);
    
    // Open window synchronously to avoid popup blockers
    const authWindow = window.open(
      '',
      'oauth_popup',
      'width=600,height=700'
    );

    if (!authWindow) {
      setErrorMsg('Please allow popups for this site to connect your account.');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/linkedin/url');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to get LinkedIn auth URL');
      }
      const { url } = await response.json();
      authWindow.location.href = url;

      // Monitor window closure to reset loading state
      const checkWindow = setInterval(() => {
        if (authWindow.closed) {
          clearInterval(checkWindow);
          // Small delay to allow postMessage/storage events to process first
          setTimeout(() => setIsLoading(false), 1000);
          console.log("[LinkedIn Settings] Popup window closed.");
        }
      }, 500);
    } catch (error: any) {
      console.error('LinkedIn OAuth error:', error);
      setErrorMsg(error.message);
      setIsLoading(false);
      authWindow.close();
    }
  };

  if (isPageLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Settings</h1>
        <p className="text-slate-400">Manage your account settings and preferences.</p>
      </div>

      {successMsg && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-3 text-emerald-400"
        >
          <CheckCircle2 className="w-5 h-5" />
          {successMsg}
        </motion.div>
      )}

      {errorMsg && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-3 text-rose-400"
        >
          <AlertCircle className="w-5 h-5" />
          {errorMsg}
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Navigation Sidebar (Mobile friendly) */}
        <div className="md:col-span-1 space-y-2">
          <SettingsNavButton icon={<UserCircle className="w-5 h-5" />} label="Profile" active />
          <SettingsNavButton icon={<Lock className="w-5 h-5" />} label="Password" />
          <SettingsNavButton icon={<CreditCard className="w-5 h-5" />} label="Billing & Plan" />
          <SettingsNavButton icon={<Bell className="w-5 h-5" />} label="Notifications" />
          <SettingsNavButton icon={<Shield className="w-5 h-5" />} label="Privacy & Security" />
          <SettingsNavButton icon={<User className="w-5 h-5" />} label="Connected Accounts" />
        </div>

        {/* Settings Content */}
        <div className="md:col-span-2 space-y-8">
          {/* Profile Section */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <User className="w-5 h-5 text-indigo-400" />
                Personal Information
              </CardTitle>
              <CardDescription>Update your personal details and how others see you.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="flex items-center gap-6 mb-6">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 border-4 border-slate-800 shrink-0"></div>
                  <Button variant="outline" className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700">
                    Change Avatar
                  </Button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-white">First Name</Label>
                    <Input 
                      id="firstName" 
                      value={profile.firstName} 
                      onChange={(e) => setProfile({...profile, firstName: e.target.value})}
                      className="bg-slate-950 border-slate-800 text-white" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-white">Last Name</Label>
                    <Input 
                      id="lastName" 
                      value={profile.lastName} 
                      onChange={(e) => setProfile({...profile, lastName: e.target.value})}
                      className="bg-slate-950 border-slate-800 text-white" 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-400">Email Address</Label>
                  <Input id="email" type="email" value={profile.email} disabled className="bg-slate-950 border-slate-800 text-white opacity-50 cursor-not-allowed" />
                  <p className="text-xs text-slate-500">Email cannot be changed directly for security reasons.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bio" className="text-white">Bio</Label>
                  <Input 
                    id="bio" 
                    value={profile.bio} 
                    onChange={(e) => setProfile({...profile, bio: e.target.value})}
                    className="bg-slate-950 border-slate-800 text-white" 
                  />
                </div>
                <Button type="submit" disabled={isLoading} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Save Changes
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Password Section */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Lock className="w-5 h-5 text-indigo-400" />
                Change Password
              </CardTitle>
              <CardDescription>Ensure your account is using a long, random password to stay secure.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword" className="text-white">Current Password</Label>
                <Input 
                  id="currentPassword" 
                  type="password" 
                  value={passwords.current}
                  onChange={(e) => setPasswords({...passwords, current: e.target.value})}
                  className="bg-slate-950 border-slate-800 text-white" 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword" className="text-white">New Password</Label>
                <Input 
                  id="newPassword" 
                  type="password" 
                  value={passwords.new}
                  onChange={(e) => setPasswords({...passwords, new: e.target.value})}
                  className="bg-slate-950 border-slate-800 text-white" 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-white">Confirm New Password</Label>
                <Input 
                  id="confirmPassword" 
                  type="password" 
                  value={passwords.confirm}
                  onChange={(e) => setPasswords({...passwords, confirm: e.target.value})}
                  className="bg-slate-950 border-slate-800 text-white" 
                />
              </div>
              <Button 
                onClick={handleUpdatePassword} 
                disabled={isLoading || !passwords.current || !passwords.new}
                className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Update Password
              </Button>
            </CardContent>
          </Card>

          {/* Subscription Section */}
          <Card className={`bg-slate-900/50 border-slate-800 ${profile.subscriptionStatus !== 'free' ? 'border-indigo-500/30' : ''}`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <CreditCard className="w-5 h-5 text-indigo-400" />
                Subscription Plan
              </CardTitle>
              <CardDescription>You are currently on the {profile.subscriptionStatus.toUpperCase()} Plan.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className={`p-4 rounded-xl mb-6 ${profile.subscriptionStatus !== 'free' ? 'bg-indigo-500/10 border border-indigo-500/20' : 'bg-slate-800/50 border border-slate-700'}`}>
                <div className="flex justify-between items-center mb-2">
                  <span className={`font-bold ${profile.subscriptionStatus !== 'free' ? 'text-indigo-400' : 'text-slate-400'}`}>
                    {profile.subscriptionStatus.toUpperCase()} Plan
                  </span>
                  <span className="text-sm text-slate-400">
                    {profile.subscriptionStatus === 'pro' ? '$79/mo' : profile.subscriptionStatus === 'basic' ? '$29/mo' : 'Free'}
                  </span>
                </div>
                <p className="text-sm text-slate-300">
                  {profile.subscriptionStatus === 'free' ? 'Upgrade to unlock AI-powered features.' : 'Your next billing date is April 24, 2026.'}
                </p>
              </div>
              <div className="flex gap-4">
                <Button 
                  onClick={() => navigate("/onboarding")}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  {profile.subscriptionStatus === 'free' ? 'Upgrade Plan' : 'Change Plan'}
                </Button>
                {profile.subscriptionStatus !== 'free' && (
                  <Button variant="outline" className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700">
                    Manage Billing
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Notifications Section */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Bell className="w-5 h-5 text-indigo-400" />
                Notifications
              </CardTitle>
              <CardDescription>Control how you receive updates and alerts.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-white">Email Notifications</Label>
                  <p className="text-sm text-slate-400">Receive daily summaries of job applications.</p>
                </div>
                <Switch 
                  checked={profile.notificationSettings.email} 
                  className="data-checked:bg-indigo-500 data-unchecked:bg-slate-700"
                  onCheckedChange={(checked) => setProfile({
                    ...profile, 
                    notificationSettings: {...profile.notificationSettings, email: checked}
                  })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-white">Push Notifications</Label>
                  <p className="text-sm text-slate-400">Get alerted when an interview is requested.</p>
                </div>
                <Switch 
                  checked={profile.notificationSettings.push} 
                  className="data-checked:bg-indigo-500 data-unchecked:bg-slate-700"
                  onCheckedChange={(checked) => setProfile({
                    ...profile, 
                    notificationSettings: {...profile.notificationSettings, push: checked}
                  })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-white">Marketing Emails</Label>
                  <p className="text-sm text-slate-400">Receive tips on improving your resume.</p>
                </div>
                <Switch 
                  checked={profile.notificationSettings.marketing} 
                  className="data-checked:bg-indigo-500 data-unchecked:bg-slate-700"
                  onCheckedChange={(checked) => setProfile({
                    ...profile, 
                    notificationSettings: {...profile.notificationSettings, marketing: checked}
                  })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Connected Accounts Section */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <User className="w-5 h-5 text-indigo-400" />
                Connected Accounts
              </CardTitle>
              <CardDescription>Link external accounts to enhance AI capabilities.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 rounded-xl border border-slate-800 bg-slate-950/50">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-[#0A66C2] rounded-lg flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>
                  </div>
                  <div>
                    <h4 className="text-white font-medium">LinkedIn</h4>
                    <p className="text-sm text-slate-400">
                      {profile.linkedInConnected ? "Connected" : "Not connected"}
                    </p>
                  </div>
                </div>
                <Button 
                  variant={profile.linkedInConnected ? "outline" : "default"}
                  className={profile.linkedInConnected ? "border-slate-700 text-slate-300" : "bg-[#0A66C2] hover:bg-[#004182] text-white"}
                  onClick={handleLinkedInConnect}
                  disabled={isLoading}
                >
                  {profile.linkedInConnected ? "Disconnect" : "Connect"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="bg-rose-500/5 border-rose-500/20">
            <CardHeader>
              <CardTitle className="text-rose-400 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Danger Zone
              </CardTitle>
              <CardDescription className="text-rose-400/60">Irreversible actions for your account.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                variant="destructive" 
                onClick={handleDeleteAccount}
                disabled={isLoading}
                className="bg-rose-600 hover:bg-rose-500 text-white font-bold"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Delete Account
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function SettingsNavButton({ icon, label, active = false }: { icon: React.ReactNode, label: string, active?: boolean }) {
  return (
    <button className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
      active 
        ? "bg-indigo-600/10 text-indigo-400 font-medium" 
        : "text-slate-400 hover:bg-slate-800 hover:text-white"
    }`}>
      {icon}
      {label}
    </button>
  );
}

