import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AuthPage from "./pages/AuthPage";
import MainApp from "./pages/MainApp";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "./firebase";
import { auth } from "./firebase";

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">Loading...</div>;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={user ? <Navigate to="/app" replace /> : <AuthPage />} />
        <Route path="/app" element={user ? <MainApp /> : <Navigate to="/auth" replace />} />
        {/* Redirect all other routes to app or auth */}
        <Route path="*" element={<Navigate to={user ? "/app" : "/auth"} replace />} />
      </Routes>
    </BrowserRouter>
  );
}
