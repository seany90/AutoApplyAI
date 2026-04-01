import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import AuthPage from "./pages/AuthPage";
import OnboardingPage from "./pages/OnboardingPage";
import DashboardLayout from "./pages/DashboardLayout";
import Overview from "./pages/dashboard/Overview";
import JobQueue from "./pages/dashboard/JobQueue";
import Applications from "./pages/dashboard/Applications";
import InterviewBuddy from "./pages/dashboard/InterviewBuddy";
import PowerTools from "./pages/dashboard/PowerTools";
import LearningLab from "./pages/dashboard/LearningLab";
import Settings from "./pages/dashboard/Settings";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<Navigate to="/dashboard/overview" replace />} />
          <Route path="overview" element={<Overview />} />
          <Route path="queue" element={<JobQueue />} />
          <Route path="applications" element={<Applications />} />
          <Route path="interview-buddy" element={<InterviewBuddy />} />
          <Route path="power-tools" element={<PowerTools />} />
          <Route path="learning-lab" element={<LearningLab />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
