import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import RaffleDetail from "./pages/RaffleDetail";
import Dashboard from "./pages/Dashboard";
import CreateRaffle from "./pages/CreateRaffle";
import { User } from "./types";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      }
    } catch (err) {
      console.error("Auth check failed", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-slate-950">
        <div className="flex flex-col items-center space-y-6">
          <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin shadow-2xl shadow-indigo-500/20"></div>
          <p className="text-slate-400 font-black text-xs uppercase tracking-[0.3em] animate-pulse">Carregando GGRIFAS...</p>
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
              <Route path="/login" element={user ? <Navigate to="/" /> : <Auth mode="login" onAuth={setUser} />} />
              <Route path="/register" element={user ? <Navigate to="/" /> : <Auth mode="register" onAuth={setUser} />} />
              <Route path="/raffle/:id" element={<RaffleDetail user={user} />} />
              
              {/* Protected Routes */}
              <Route 
                path="/dashboard" 
                element={user ? <Dashboard user={user} /> : <Navigate to="/login" />} 
              />
              <Route 
                path="/create-raffle" 
                element={user ? <CreateRaffle user={user} /> : <Navigate to="/login" />} 
              />
            </Routes>
          </AnimatePresence>
        </main>

        <footer className="bg-slate-900 border-t border-slate-800 py-20 mt-24">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <div className="flex justify-center items-center space-x-2 mb-8">
              <div className="bg-indigo-600 p-2 rounded-xl text-white italic font-black">GG</div>
              <span className="text-2xl font-black text-white italic tracking-tighter">GG<span className="text-indigo-500">RIFAS</span></span>
            </div>
            <p className="text-slate-500 font-medium text-lg max-w-lg mx-auto mb-12 leading-relaxed">
              Infraestrutura profissional para lançar sorteios online com automação total de pagamentos e gestão estratégica.
            </p>
            <div className="flex justify-center space-x-12 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-12">
              <a href="#" className="hover:text-indigo-400 transition-colors">Termos de Uso</a>
              <a href="#" className="hover:text-indigo-400 transition-colors">Privacidade</a>
              <a href="#" className="hover:text-indigo-400 transition-colors">Suporte</a>
            </div>
            <div className="pt-12 border-t border-slate-800 text-[10px] text-slate-600 font-bold uppercase tracking-widest">
              © {new Date().getFullYear()} GGRIFAS SaaS. Todos os direitos reservados.
            </div>
          </div>
        </footer>
      </div>
    </Router>
  );
}
