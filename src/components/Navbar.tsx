import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LogOut, User as UserIcon, PlusCircle, LayoutDashboard, Ticket, Menu, X } from "lucide-react";
import { User } from "../types";
import { motion, AnimatePresence } from "motion/react";

interface NavbarProps {
  user: User | null;
  onLogout: () => void;
}

export default function Navbar({ user, onLogout }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800 shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 transform group-hover:rotate-6 transition-transform">
              <Ticket size={24} className="text-white" />
            </div>
            <span className="text-xl font-black tracking-tighter text-white italic">GG<span className="text-indigo-500">RIFAS</span></span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Início</Link>
            {user ? (
              <div className="flex items-center space-x-6">
                {(user.role === 'creator' || user.role === 'admin') && (
                  <>
                    <Link 
                      to="/create-raffle" 
                      className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-lg shadow-indigo-600/20"
                    >
                      <PlusCircle size={18} />
                      <span>Criar Sorteio</span>
                    </Link>
                    <Link 
                      to="/dashboard" 
                      className="flex items-center space-x-2 text-slate-400 hover:text-white transition-colors"
                    >
                      <LayoutDashboard size={18} />
                      <span className="text-sm font-medium">Dashboard</span>
                    </Link>
                  </>
                )}
                <div className="flex items-center space-x-4 border-l border-slate-800 pl-6">
                  <div className="flex items-center space-x-3 text-slate-300">
                    <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-indigo-400">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-semibold">{user.name}</span>
                  </div>
                  <button 
                    onClick={onLogout}
                    className="p-2 text-slate-500 hover:text-red-400 transition-colors rounded-lg hover:bg-slate-900 border border-transparent hover:border-slate-800"
                  >
                    <LogOut size={18} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link 
                  to="/login" 
                  className="text-sm font-semibold text-slate-400 hover:text-white px-4 py-2 transition-colors"
                >
                  Entrar
                </Link>
                <Link 
                  to="/register" 
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-lg text-sm font-bold shadow-lg shadow-indigo-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  Começar Agora
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 text-slate-400 hover:text-white transition-colors"
          >
            {isOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-slate-950 border-t border-slate-800 overflow-hidden"
          >
            <div className="px-4 py-8 space-y-6">
              <Link 
                to="/" 
                onClick={() => setIsOpen(false)}
                className="block text-lg font-bold text-slate-300 hover:text-white"
              >
                Início
              </Link>
              {user ? (
                <>
                  {(user.role === 'creator' || user.role === 'admin') && (
                    <>
                      <Link 
                        to="/create-raffle" 
                        onClick={() => setIsOpen(false)}
                        className="flex items-center space-x-3 text-lg font-bold text-indigo-400"
                      >
                        <PlusCircle size={20} />
                        <span>Criar Nova Rifa</span>
                      </Link>
                      <Link 
                        to="/dashboard" 
                        onClick={() => setIsOpen(false)}
                        className="flex items-center space-x-3 text-lg font-bold text-slate-300"
                      >
                        <LayoutDashboard size={20} />
                        <span>Dashboard</span>
                      </Link>
                    </>
                  )}
                  <div className="pt-6 border-t border-slate-800 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-sm font-bold text-indigo-400">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-white font-bold">{user.name}</span>
                    </div>
                    <button 
                      onClick={() => {
                        onLogout();
                        setIsOpen(false);
                      }}
                      className="p-3 text-red-500 bg-red-500/10 rounded-xl"
                    >
                      <LogOut size={20} />
                    </button>
                  </div>
                </>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <Link 
                    to="/login"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-center py-4 rounded-2xl bg-slate-900 text-white font-bold text-sm border border-slate-800"
                  >
                    Entrar
                  </Link>
                  <Link 
                    to="/register"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-center py-4 rounded-2xl bg-indigo-600 text-white font-bold text-sm"
                  >
                    Cadastrar
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
