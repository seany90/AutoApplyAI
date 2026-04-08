import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, Loader2, FileDown, Clock, FileCheck } from "lucide-react";
import { auth, db } from "@/firebase";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { jsPDF } from "jspdf";
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";

interface Resume {
  id: string;
  content: string;
  fileName: string;
  targetJob: string;
  type: 'original' | 'generated';
  createdAt: any;
}

export default function MyResume() {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchResumes = async () => {
      if (!auth.currentUser) return;
      try {
        const q = query(
          collection(db, "resumes"),
          where("userId", "==", auth.currentUser.uid),
          orderBy("createdAt", "desc")
        );
        const querySnapshot = await getDocs(q);
        const fetchedResumes: Resume[] = [];
        querySnapshot.forEach((doc) => {
          fetchedResumes.push({ id: doc.id, ...doc.data() } as Resume);
        });
        setResumes(fetchedResumes);
      } catch (error) {
        console.error("Error fetching resumes:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchResumes();
  }, []);

  const downloadPDF = (resume: Resume) => {
    const doc = new jsPDF();
    
    // Split text into lines to fit page width
    const splitText = doc.splitTextToSize(resume.content, 180);
    
    let y = 20;
    for (let i = 0; i < splitText.length; i++) {
      if (y > 280) {
        doc.addPage();
        y = 20;
      }
      doc.text(splitText[i], 15, y);
      y += 7;
    }
    
    doc.save(`${resume.fileName || 'resume'}.pdf`);
  };

  const downloadDOCX = async (resume: Resume) => {
    const paragraphs = resume.content.split('\n').map(line => {
      return new Paragraph({
        children: [new TextRun(line)],
      });
    });

    const doc = new Document({
      sections: [{
        properties: {},
        children: paragraphs,
      }],
    });

    const blob = await Packer.toBlob(doc);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${resume.fileName || 'resume'}.docx`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const originalResumes = resumes.filter(r => r.type === 'original');
  const generatedResumes = resumes.filter(r => r.type === 'generated');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2 flex items-center gap-3">
          <FileText className="w-8 h-8 text-indigo-400" />
          My Resume
        </h1>
        <p className="text-slate-400">
          Manage your original baseline resume and all ATS-optimized versions generated for specific jobs.
        </p>
      </div>

      <div className="grid gap-8">
        {/* Original Resume Section */}
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <CardTitle className="text-slate-50 flex items-center gap-2">
              <Clock className="w-5 h-5 text-emerald-400" />
              Original Baseline Resume
            </CardTitle>
            <CardDescription>
              The resume you uploaded when you first signed up. We use this as the foundation.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {originalResumes.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {originalResumes.map(resume => (
                  <div key={resume.id} className="p-5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col gap-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5 text-emerald-400" />
                      </div>
                      <div>
                        <h4 className="font-medium text-slate-200 line-clamp-1">{resume.fileName || "Original Resume"}</h4>
                        <p className="text-xs text-slate-500 mt-1">
                          {resume.createdAt?.toDate ? resume.createdAt.toDate().toLocaleDateString() : 'Recently uploaded'}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-auto pt-2">
                      <Button variant="outline" size="sm" className="flex-1 bg-slate-900 border-slate-700 hover:bg-slate-800" onClick={() => downloadPDF(resume)}>
                        <FileDown className="w-4 h-4 mr-2" /> PDF
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1 bg-slate-900 border-slate-700 hover:bg-slate-800" onClick={() => downloadDOCX(resume)}>
                        <FileDown className="w-4 h-4 mr-2" /> DOCX
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center border border-dashed border-slate-800 rounded-xl bg-slate-950/50">
                <p className="text-slate-500">No original resume found. You can upload one in the Auto-Apply Agent Setup.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Generated ATS Resumes Section */}
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <CardTitle className="text-slate-50 flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-indigo-400" />
              Generated ATS Resumes
            </CardTitle>
            <CardDescription>
              Tailored resumes generated specifically for jobs you've evaluated.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {generatedResumes.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {generatedResumes.map(resume => (
                  <div key={resume.id} className="p-5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col gap-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5 text-indigo-400" />
                      </div>
                      <div>
                        <h4 className="font-medium text-slate-200 line-clamp-1">{resume.targetJob}</h4>
                        <p className="text-xs text-slate-500 mt-1">
                          {resume.createdAt?.toDate ? resume.createdAt.toDate().toLocaleDateString() : 'Recently generated'}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-auto pt-2">
                      <Button variant="outline" size="sm" className="flex-1 bg-slate-900 border-slate-700 hover:bg-slate-800" onClick={() => downloadPDF(resume)}>
                        <FileDown className="w-4 h-4 mr-2" /> PDF
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1 bg-slate-900 border-slate-700 hover:bg-slate-800" onClick={() => downloadDOCX(resume)}>
                        <FileDown className="w-4 h-4 mr-2" /> DOCX
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center border border-dashed border-slate-800 rounded-xl bg-slate-950/50">
                <p className="text-slate-500">No generated resumes yet. Use the Job Evaluator to create tailored ATS resumes.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
