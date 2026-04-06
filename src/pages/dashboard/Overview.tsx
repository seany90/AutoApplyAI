import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Briefcase, CheckCircle, Eye, MessageSquare, TrendingUp } from "lucide-react";

const data = [
  { name: 'Mon', applied: 4, viewed: 2, interviews: 0 },
  { name: 'Tue', applied: 7, viewed: 3, interviews: 1 },
  { name: 'Wed', applied: 12, viewed: 5, interviews: 0 },
  { name: 'Thu', applied: 8, viewed: 6, interviews: 2 },
  { name: 'Fri', applied: 15, viewed: 8, interviews: 1 },
  { name: 'Sat', applied: 5, viewed: 4, interviews: 0 },
  { name: 'Sun', applied: 9, viewed: 7, interviews: 1 },
];

export default function Overview() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Dashboard</h1>
        <p className="text-slate-400">Here's an overview of your job search progress.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Applied" 
          value="60" 
          trend="+12% from last week" 
          icon={<Briefcase className="w-5 h-5 text-indigo-400" />} 
        />
        <StatCard 
          title="Applications Viewed" 
          value="35" 
          trend="58% view rate" 
          icon={<Eye className="w-5 h-5 text-amber-400" />} 
        />
        <StatCard 
          title="Interview Requests" 
          value="5" 
          trend="8.3% conversion" 
          icon={<MessageSquare className="w-5 h-5 text-emerald-400" />} 
        />
        <StatCard 
          title="Avg Match Score" 
          value="91%" 
          trend="Quality first approach" 
          icon={<CheckCircle className="w-5 h-5 text-purple-400" />} 
        />
      </div>

      {/* Main Chart */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-400" />
            Application Funnel
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorApplied" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorViewed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#fbbf24" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' }}
                  itemStyle={{ color: '#f8fafc' }}
                />
                <Area type="monotone" dataKey="applied" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorApplied)" />
                <Area type="monotone" dataKey="viewed" stroke="#fbbf24" strokeWidth={2} fillOpacity={1} fill="url(#colorViewed)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <CardTitle className="text-lg font-medium">Recent Matches</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { role: "Senior Frontend Engineer", company: "Stripe", score: 95, time: "2h ago" },
                { role: "React Developer", company: "Vercel", score: 92, time: "4h ago" },
                { role: "Full Stack Engineer", company: "Netflix", score: 88, time: "5h ago" },
              ].map((job, i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
                  <div>
                    <h4 className="font-medium text-slate-200">{job.role}</h4>
                    <p className="text-sm text-slate-400">{job.company} • {job.time}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-medium border border-emerald-500/20">
                      {job.score}% Match
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <CardTitle className="text-lg font-medium">Rejection Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 mb-4">
              <h4 className="font-medium text-rose-400 mb-1 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                Common Feedback: Missing AWS Certification
              </h4>
              <p className="text-sm text-slate-300">3 recent rejections mentioned AWS experience. Consider adding AWS to your skills or taking a quick certification.</p>
            </div>
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <h4 className="font-medium text-amber-400 mb-1 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                Salary Mismatch
              </h4>
              <p className="text-sm text-slate-300">Your minimum salary expectation ($120k) is higher than the average for "React Developer" roles in your area ($105k).</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ title, value, trend, icon }: { title: string, value: string, trend: string, icon: React.ReactNode }) {
  return (
    <Card className="bg-slate-900/50 border-slate-800">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-slate-400">{title}</h3>
          <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center">
            {icon}
          </div>
        </div>
        <div className="text-3xl font-bold text-slate-50 mb-1">{value}</div>
        <p className="text-sm text-slate-500">{trend}</p>
      </CardContent>
    </Card>
  );
}
