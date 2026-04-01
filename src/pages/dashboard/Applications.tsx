import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, Filter, MoreHorizontal, FileText, ExternalLink, Calendar } from "lucide-react";

const applications = [
  { id: 1, role: "Senior Frontend Engineer", company: "Stripe", status: "Interview Request", date: "2026-03-25", platform: "LinkedIn" },
  { id: 2, role: "React Developer", company: "Vercel", status: "Viewed", date: "2026-03-24", platform: "Company Site" },
  { id: 3, role: "Full Stack Engineer", company: "Netflix", status: "Applied", date: "2026-03-23", platform: "Indeed" },
  { id: 4, role: "Frontend Architect", company: "Meta", status: "Rejected", date: "2026-03-20", platform: "LinkedIn" },
  { id: 5, role: "Software Engineer, UI", company: "Apple", status: "Applied", date: "2026-03-19", platform: "Glassdoor" },
];

export default function Applications() {
  const [searchTerm, setSearchTerm] = useState("");

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Interview Request": return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "Viewed": return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "Applied": return "bg-indigo-500/10 text-indigo-400 border-indigo-500/20";
      case "Rejected": return "bg-rose-500/10 text-rose-400 border-rose-500/20";
      default: return "bg-slate-800 text-slate-400 border-slate-700";
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Applications</h1>
          <p className="text-slate-400">Track the status of every job the AI has applied to.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <Input 
              placeholder="Search companies or roles..." 
              className="pl-10 w-full sm:w-64 bg-slate-900 border-slate-800 text-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
            <Filter className="w-5 h-5" />
          </button>
        </div>
      </div>

      <Card className="bg-slate-900/50 border-slate-800">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs text-slate-400 uppercase bg-slate-900/80 border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4 font-medium">Role & Company</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Date Applied</th>
                  <th className="px-6 py-4 font-medium">Source</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {applications.filter(app => 
                  app.company.toLowerCase().includes(searchTerm.toLowerCase()) || 
                  app.role.toLowerCase().includes(searchTerm.toLowerCase())
                ).map((app) => (
                  <tr key={app.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-200">{app.role}</div>
                      <div className="text-slate-500">{app.company}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(app.status)}`}>
                        {app.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-400 flex items-center gap-2">
                      <Calendar className="w-4 h-4" /> {app.date}
                    </td>
                    <td className="px-6 py-4 text-slate-400">
                      {app.platform}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <button className="text-slate-500 hover:text-indigo-400 transition-colors" title="View Generated Resume">
                          <FileText className="w-4 h-4" />
                        </button>
                        <button className="text-slate-500 hover:text-indigo-400 transition-colors" title="View Job Posting">
                          <ExternalLink className="w-4 h-4" />
                        </button>
                        <button className="text-slate-500 hover:text-white transition-colors">
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
