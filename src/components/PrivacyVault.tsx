import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Trash2, Download, FileText, AlertTriangle, Loader2 } from "lucide-react";
import { db, auth } from "@/firebase";
import { collection, query, where, getDocs, deleteDoc, doc } from "firebase/firestore";

interface SavedResume {
  id: string;
  content: string;
  targetJob: string;
  createdAt: any;
}

export default function PrivacyVault({ onBack }: { onBack: () => void }) {
  const [resumes, setResumes] = useState<SavedResume[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    if (!auth.currentUser) {
      setIsLoading(false);
      return;
    }

    try {
      const q = query(collection(db, "resumes"), where("userId", "==", auth.currentUser.uid));
      const querySnapshot = await getDocs(q);
      const fetchedResumes: SavedResume[] = [];
      querySnapshot.forEach((doc) => {
        fetchedResumes.push({ id: doc.id, ...doc.data() } as SavedResume);
      });
      // Sort by newest first
      fetchedResumes.sort((a, b) => b.createdAt?.toMillis() - a.createdAt?.toMillis());
      setResumes(fetchedResumes);
    } catch (error) {
      console.error("Error fetching vault data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this item?")) return;
    
    setIsDeleting(id);
    try {
      await deleteDoc(doc(db, "resumes", id));
      setResumes(resumes.filter(r => r.id !== id));
    } catch (error) {
      console.error("Error deleting document:", error);
      alert("Failed to delete item.");
    } finally {
      setIsDeleting(null);
    }
  };

  const handleExportData = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(resumes, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "privacy_vault_export.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleDeleteAccount = async () => {
    if (!confirm("WARNING: This will permanently delete all your data and your account. This action cannot be undone. Are you absolutely sure?")) return;
    
    try {
      // 1. Delete all user data from Firestore
      for (const resume of resumes) {
        await deleteDoc(doc(db, "resumes", resume.id));
      }
      
      // Delete user profile doc if it exists
      if (auth.currentUser) {
        await deleteDoc(doc(db, "users", auth.currentUser.uid));
        
        // 2. Delete the auth user
        await auth.currentUser.delete();
        alert("Your account and all associated data have been permanently deleted.");
        window.location.href = "/";
      }
    } catch (error: any) {
      console.error("Error deleting account:", error);
      if (error.code === 'auth/requires-recent-login') {
        alert("For security reasons, please log out and log back in before deleting your account.");
      } else {
        alert("Failed to delete account. Please try again.");
      }
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Shield className="w-6 h-6 text-rose-400" />
            Privacy Vault
          </h2>
          <p className="text-slate-400">Your data is encrypted, private, and 100% under your control.</p>
        </div>
        <Button variant="outline" onClick={onBack} className="bg-transparent border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white">
          Back to Tools
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-400" />
                Saved Resumes & Documents
              </CardTitle>
              <CardDescription className="text-slate-400">
                Manage the optimized resumes you've generated.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-slate-500" />
                </div>
              ) : resumes.length === 0 ? (
                <div className="text-center py-8 text-slate-500 bg-slate-950/50 rounded-lg border border-slate-800 border-dashed">
                  No documents saved in your vault yet.
                </div>
              ) : (
                <div className="space-y-4">
                  {resumes.map((resume) => (
                    <div key={resume.id} className="flex items-center justify-between p-4 rounded-lg bg-slate-950 border border-slate-800">
                      <div>
                        <h4 className="text-slate-200 font-medium truncate max-w-[300px] sm:max-w-[400px]">
                          Target: {resume.targetJob.split('\n')[0].substring(0, 50)}...
                        </h4>
                        <p className="text-xs text-slate-500 mt-1">
                          Saved on {resume.createdAt?.toDate().toLocaleDateString() || 'Unknown date'}
                        </p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleDelete(resume.id)}
                        disabled={isDeleting === resume.id}
                        className="text-slate-400 hover:text-rose-400 hover:bg-rose-400/10"
                      >
                        {isDeleting === resume.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Data Portability</CardTitle>
              <CardDescription className="text-slate-400">
                Download a copy of everything stored in your vault.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={handleExportData}
                disabled={isLoading || resumes.length === 0}
                className="w-full bg-slate-800 hover:bg-slate-700 text-white border border-slate-700"
              >
                <Download className="w-4 h-4 mr-2" />
                Export All Data (JSON)
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-rose-950/20 border-rose-900/50">
            <CardHeader>
              <CardTitle className="text-rose-400 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Danger Zone
              </CardTitle>
              <CardDescription className="text-slate-400">
                Permanently delete your account and wipe all data from our servers.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                variant="destructive"
                onClick={handleDeleteAccount}
                className="w-full bg-rose-600 hover:bg-rose-700 text-white"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Account & Data
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
