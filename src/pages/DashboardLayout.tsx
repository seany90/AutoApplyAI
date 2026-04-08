import { useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  MessageSquare, 
  Wrench, 
  GraduationCap,
  Bell,
  Settings,
  LogOut,
  Bot,
  Menu,
  X,
  FileText
} from "lucide-react";

export default function DashboardLayout() {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { path: "/dashboard/overview", icon: <LayoutDashboard className="w-5 h-5" />, label: "Overview" },
    { path: "/dashboard/agent-setup", icon: <Bot className="w-5 h-5" />, label: "Auto-Apply Agent" },
    { path: "/dashboard/interview-buddy", icon: <MessageSquare className="w-5 h-5" />, label: "Interview Buddy" },
    { path: "/dashboard/power-tools", icon: <Wrench className="w-5 h-5" />, label: "Power Tools" },
    { path: "/dashboard/learning-lab", icon: <GraduationCap className="w-5 h-5" />, label: "Learning Lab" },
    { path: "/dashboard/my-resume", icon: <FileText className="w-5 h-5" />, label: "My Resume" },
  ];

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex selection:bg-indigo-500/30 overflow-hidden">
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/80 z-40 lg:hidden backdrop-blur-sm"
          onClick={closeMobileMenu}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 border-r border-slate-800 bg-slate-900 flex flex-col transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      }`}>
        <div className="flex items-center justify-between border-b border-slate-800 pr-4">
          <Link to="/" className="p-6 flex items-center gap-3 hover:bg-slate-800/50 transition-colors flex-1" onClick={closeMobileMenu}>
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">AutoApply AI</span>
          </Link>
          <button 
            className="lg:hidden p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
            onClick={closeMobileMenu}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 py-6 px-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={closeMobileMenu}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                  isActive 
                    ? "bg-indigo-600/10 text-indigo-400 font-medium" 
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </div>

        <div className="p-4 border-t border-slate-800 space-y-2 shrink-0">
          <Link 
            to="/dashboard/settings" 
            className={`flex items-center gap-3 px-4 py-3 w-full rounded-xl transition-colors ${
              location.pathname === "/dashboard/settings" 
                ? "bg-indigo-600/10 text-indigo-400 font-medium" 
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
            }`}
            onClick={closeMobileMenu}
          >
            <Settings className="w-5 h-5" />
            Settings
          </Link>
          <Link to="/" className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition-colors">
            <LogOut className="w-5 h-5" />
            Log out
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden w-full relative">
        {/* Header */}
        <header className="h-20 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between px-4 lg:px-8 shrink-0">
          <div className="flex items-center gap-4">
            <button 
              className="lg:hidden p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <button className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-indigo-500 rounded-full"></span>
            </button>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 border-2 border-slate-800 shrink-0"></div>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-6xl mx-auto pb-10">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
