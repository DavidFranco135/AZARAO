import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from "react-router-dom";
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
import MyOrders from "./pages/MyOrders";
import RaffleManage from "./pages/RaffleManage";
import DrawLive from "./pages/DrawLive";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import { User } from "./types";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        const profile = await fetchUserProfile(fbUser.uid);
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

  if (loading)
    return (
      <div className="min-h-screen grid place-items-center bg-slate-950">
        <div className="flex flex-col items-center space-y-6">
          <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin shadow-2xl shadow-indigo-500/20" />
          <p className="text-slate-400 font-black text-xs uppercase tracking-[0.3em] animate-pulse">
            Carregando AZARÃO...
          </p>
        </div>
      </div>
    );

  return (
    <Router>
      <div className="min-h-screen bg-slate-950 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
        <Navbar user={user} onLogout={handleLogout} />
        <main className="flex-grow">
          <AnimatePresence mode="wait">
            <Routes>
              <Route path="/" element={<Home user={user} />} />
              <Route path="/login" element={user ? <Navigate to="/" /> : <Auth mode="login" onAuth={setUser} />} />
              <Route path="/register" element={user ? <Navigate to="/" /> : <Auth mode="register" onAuth={setUser} />} />
              <Route path="/forgot-password" element={user ? <Navigate to="/" /> : <Auth mode="forgot" onAuth={setUser} />} />
              <Route path="/raffle/:id" element={<RaffleDetail user={user} />} />
              <Route path="/my-orders" element={user ? <MyOrders user={user} /> : <Navigate to="/login" />} />
              <Route path="/dashboard" element={user ? <Dashboard user={user} /> : <Navigate to="/login" />} />
              <Route path="/create-raffle" element={user ? <CreateRaffle user={user} /> : <Navigate to="/login" />} />
              <Route path="/dashboard/raffle/:id" element={user ? <RaffleManage user={user} /> : <Navigate to="/login" />} />
              <Route path="/draw/:id" element={<DrawLive />} />
              <Route path="/termos" element={<Terms />} />
              <Route path="/privacidade" element={<Privacy />} />
              <Route path="/admin" element={user?.role === "admin" ? <AdminPanel user={user} /> : <Navigate to="/" />} />
            </Routes>
          </AnimatePresence>
        </main>

        <footer className="bg-slate-900 border-t border-slate-800 py-14 mt-20">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <div className="flex justify-center items-center space-x-2 mb-5">
              <div className="bg-indigo-600 p-2 rounded-xl text-white italic font-black text-sm">GG</div>
              <span className="text-2xl font-black text-white italic tracking-tighter">
                AZA<span className="text-indigo-500">RÃO</span>
              </span>
            </div>
            <p className="text-slate-500 font-medium text-sm max-w-lg mx-auto mb-7 leading-relaxed">
              Infraestrutura profissional para lançar sorteios online com automação total de pagamentos.
            </p>
            <div className="flex justify-center flex-wrap gap-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-7">
              <Link to="/termos" className="hover:text-indigo-400 transition-colors">Termos de Uso</Link>
              <Link to="/privacidade" className="hover:text-indigo-400 transition-colors">Privacidade</Link>
              <a href="mailto:azaraoadm@gmail.com" className="hover:text-indigo-400 transition-colors">Suporte</a>
            </div>
            <div className="pt-7 border-t border-slate-800 text-[10px] text-slate-600 font-bold uppercase tracking-widest">
              © {new Date().getFullYear()} AZARÃO SaaS. Todos os direitos reservados.
            </div>
          </div>
        </footer>
      </div>
    </Router>
  );
}
