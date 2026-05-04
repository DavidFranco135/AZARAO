import { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AnimatePresence } from "motion/react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./lib/firebase";
import { fetchUserProfile, logoutUser } from "./lib/firebaseService";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import RaffleDetail from "./pages/RaffleDetail";
import Dashboard from "./pages/Dashboard";
import CreateRaffle from "./pages/CreateRaffle";
import AdminPanel from "./pages/AdminPanel";
import { User } from "./types";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const profile = await fetchUserProfile(firebaseUser.uid);
        setUser(profile);
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const handleLogout = async () => {
    await logoutUser();
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-slate-950">
        <div className="flex flex-col items-center space-y-6">
          <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin shadow-2xl shadow-indigo-500/20" />
          <p className="text-slate-400 font-black text-xs uppercase tracking-[0.3em] animate-pulse">
            Carregando GGRIFAS...
          </p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-slate-950 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
        <Navbar user={user} onLogout={handleLogout} />

        <main className="flex-grow">
          <AnimatePresence mode="wait">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route
                path="/login"
                element={
                  user ? <Navigate to="/" /> : <Auth mode="login" onAuth={setUser} />
                }
              />
              <Route
                path="/register"
                element={
                  user ? (
                    <Navigate to="/" />
                  ) : (
                    <Auth mode="register" onAuth={setUser} />
                  )
                }
              />
              <Route
                path="/forgot-password"
                element={
                  user ? (
                    <Navigate to="/" />
                  ) : (
                    <Auth mode="forgot" onAuth={setUser} />
                  )
                }
              />
              <Route
                path="/raffle/:id"
                element={<RaffleDetail user={user} />}
              />
              <Route
                path="/dashboard"
                element={
                  user ? (
                    <Dashboard user={user} />
                  ) : (
                    <Navigate to="/login" />
                  )
                }
              />
              <Route
                path="/create-raffle"
                element={
                  user ? (
                    <CreateRaffle user={user} />
                  ) : (
                    <Navigate to="/login" />
                  )
                }
              />
              <Route
                path="/admin"
                element={
                  user?.role === "admin" ? (
                    <AdminPanel user={user} />
                  ) : (
                    <Navigate to="/" />
                  )
                }
              />
            </Routes>
          </AnimatePresence>
        </main>

        <footer className="bg-slate-900 border-t border-slate-800 py-16 mt-24">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <div className="flex justify-center items-center space-x-2 mb-6">
              <div className="bg-indigo-600 p-2 rounded-xl text-white italic font-black text-sm">
                GG
              </div>
              <span className="text-2xl font-black text-white italic tracking-tighter">
                GG<span className="text-indigo-500">RIFAS</span>
              </span>
            </div>
            <p className="text-slate-500 font-medium text-base max-w-lg mx-auto mb-8 leading-relaxed">
              Infraestrutura profissional para lançar sorteios online com
              automação total de pagamentos e gestão estratégica.
            </p>
            <div className="flex justify-center flex-wrap gap-8 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-8">
              <a href="#" className="hover:text-indigo-400 transition-colors">
                Termos de Uso
              </a>
              <a href="#" className="hover:text-indigo-400 transition-colors">
                Privacidade
              </a>
              <a href="#" className="hover:text-indigo-400 transition-colors">
                Suporte
              </a>
            </div>
            <div className="pt-8 border-t border-slate-800 text-[10px] text-slate-600 font-bold uppercase tracking-widest">
              © {new Date().getFullYear()} GGRIFAS SaaS. Todos os direitos
              reservados.
            </div>
          </div>
        </footer>
      </div>
    </Router>
  );
}
