import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LogOut,
  PlusCircle,
  LayoutDashboard,
  Ticket,
  Menu,
  X,
  Shield,
} from "lucide-react";
import { User } from "../types";
import { motion, AnimatePresence } from "motion/react";

interface NavbarProps {
  user: User | null;
  onLogout: () => void;
}

export default function Navbar({ user, onLogout }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { pathname } = useLocation();

  const close = () => setIsOpen(false);

  const isCreatorOrAdmin = user?.role === "creator" || user?.role === "admin";
  const isAdmin = user?.role === "admin";

  return (
    <nav className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-xl border-b border-slate-800 shadow-xl">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16 sm:h-20 items-center">
          {/* Logo */}
          <Link to="/" onClick={close} className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 transform group-hover:rotate-6 transition-transform">
              <Ticket size={20} className="text-white" />
            </div>
            <span className="text-lg sm:text-xl font-black tracking-tighter text-white italic">
              GG<span className="text-indigo-500">RIFAS</span>
            </span>
          </Link>

          {/* Desktop */}
          <div className="hidden md:flex items-center space-x-6">
            <NavLink to="/" label="Início" active={pathname === "/"} />

            {user ? (
              <div className="flex items-center space-x-4">
                {isAdmin && (
                  <NavLink
                    to="/admin"
                    label="Admin"
                    icon={<Shield size={15} className="text-amber-400" />}
                    active={pathname === "/admin"}
                  />
                )}
                {isCreatorOrAdmin && (
                  <>
                    <Link
                      to="/create-raffle"
                      className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-lg shadow-indigo-600/20"
                    >
                      <PlusCircle size={16} />
                      <span>Criar Sorteio</span>
                    </Link>
                    <NavLink
                      to="/dashboard"
                      label="Dashboard"
                      icon={<LayoutDashboard size={15} />}
                      active={pathname === "/dashboard"}
                    />
                  </>
                )}
                <div className="flex items-center space-x-3 border-l border-slate-800 pl-5">
                  <div className="flex items-center space-x-2.5 text-slate-300">
                    <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-black text-indigo-400">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="hidden lg:block">
                      <p className="text-sm font-semibold leading-none">{user.name}</p>
                      <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mt-0.5">
                        {user.role}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={onLogout}
                    className="p-2 text-slate-500 hover:text-red-400 transition-colors rounded-lg hover:bg-slate-900 border border-transparent hover:border-slate-800"
                    title="Sair"
                  >
                    <LogOut size={16} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  to="/login"
                  className="text-sm font-semibold text-slate-400 hover:text-white px-4 py-2 transition-colors"
                >
                  Entrar
                </Link>
                <Link
                  to="/register"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-lg text-sm font-bold shadow-lg shadow-indigo-600/20 transition-all hover:scale-[1.02]"
                >
                  Começar Agora
                </Link>
              </div>
            )}
          </div>

          {/* Mobile burger */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 text-slate-400 hover:text-white transition-colors"
            aria-label="Menu"
          >
            {isOpen ? <X size={26} /> : <Menu size={26} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-slate-950 border-t border-slate-800 overflow-hidden"
          >
            <div className="px-4 py-6 space-y-4">
              <MobileLink to="/" label="Início" onClick={close} />

              {user ? (
                <>
                  {isAdmin && (
                    <MobileLink
                      to="/admin"
                      label="Painel Admin"
                      icon={<Shield size={18} className="text-amber-400" />}
                      onClick={close}
                    />
                  )}
                  {isCreatorOrAdmin && (
                    <>
                      <MobileLink
                        to="/create-raffle"
                        label="Criar Nova Rifa"
                        icon={<PlusCircle size={18} className="text-indigo-400" />}
                        onClick={close}
                      />
                      <MobileLink
                        to="/dashboard"
                        label="Dashboard"
                        icon={<LayoutDashboard size={18} />}
                        onClick={close}
                      />
                    </>
                  )}
                  <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-sm font-black text-indigo-400">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-white font-bold text-sm">{user.name}</p>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                          {user.role}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => { onLogout(); close(); }}
                      className="p-2.5 text-red-400 bg-red-500/10 rounded-xl border border-red-500/10"
                    >
                      <LogOut size={18} />
                    </button>
                  </div>
                </>
              ) : (
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <Link
                    to="/login"
                    onClick={close}
                    className="flex items-center justify-center py-3 rounded-xl bg-slate-900 text-white font-bold text-sm border border-slate-800"
                  >
                    Entrar
                  </Link>
                  <Link
                    to="/register"
                    onClick={close}
                    className="flex items-center justify-center py-3 rounded-xl bg-indigo-600 text-white font-bold text-sm"
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

function NavLink({
  to,
  label,
  icon,
  active,
}: {
  to: string;
  label: string;
  icon?: React.ReactNode;
  active?: boolean;
}) {
  return (
    <Link
      to={to}
      className={`flex items-center gap-1.5 text-sm font-semibold transition-colors ${
        active ? "text-white" : "text-slate-400 hover:text-white"
      }`}
    >
      {icon}
      <span>{label}</span>
    </Link>
  );
}

function MobileLink({
  to,
  label,
  icon,
  onClick,
}: {
  to: string;
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="flex items-center space-x-3 text-base font-bold text-slate-300 hover:text-white transition-colors py-1"
    >
      {icon && <span className="text-slate-400">{icon}</span>}
      <span>{label}</span>
    </Link>
  );
}
