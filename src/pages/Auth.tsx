import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import {
  Mail, Lock, User as UserIcon, ArrowRight, Ticket,
  CheckCircle2, Phone, CreditCard,
} from "lucide-react";
import { User } from "../types";
import { registerUser, loginUser, resetPassword } from "../lib/firebaseService";

type Mode = "login" | "register" | "forgot";

interface AuthProps {
  mode: Mode;
  onAuth: (user: User) => void;
}

// Formata CPF: 000.000.000-00
const maskCPF = (v: string) =>
  v.replace(/\D/g,"")
   .slice(0,11)
   .replace(/(\d{3})(\d)/,"$1.$2")
   .replace(/(\d{3})(\d)/,"$1.$2")
   .replace(/(\d{3})(\d{1,2})$/,"$1-$2");

// Formata telefone: (00) 00000-0000
const maskPhone = (v: string) =>
  v.replace(/\D/g,"")
   .slice(0,11)
   .replace(/(\d{2})(\d)/,"($1) $2")
   .replace(/(\d{5})(\d{1,4})$/,"$1-$2");

export default function Auth({ mode, onAuth }: AuthProps) {
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [name,     setName]     = useState("");
  const [phone,    setPhone]    = useState("");
  const [cpf,      setCpf]      = useState("");
  const [role,     setRole]     = useState<"user"|"creator">("user");
  const [error,    setError]    = useState("");
  const [success,  setSuccess]  = useState("");
  const [loading,  setLoading]  = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      if (mode === "forgot") {
        await resetPassword(email);
        setSuccess("E-mail de recuperação enviado! Verifique sua caixa de entrada.");
        setLoading(false);
        return;
      }

      if (mode === "register") {
        // Validações
        const cpfDigits = cpf.replace(/\D/g,"");
        if (cpfDigits.length !== 11) { setError("CPF inválido. Informe os 11 dígitos."); setLoading(false); return; }
        const phoneDigits = phone.replace(/\D/g,"");
        if (phoneDigits.length < 10) { setError("Telefone inválido. Informe com DDD."); setLoading(false); return; }

        const user = await registerUser(email, password, name, role, phoneDigits, cpfDigits);
        onAuth(user);
        navigate("/");
      } else {
        const user = await loginUser(email, password);
        onAuth(user);
        navigate("/");
      }
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code ?? "";
      if (code === "auth/email-already-in-use") setError("E-mail já cadastrado.");
      else if (code === "auth/wrong-password" || code === "auth/user-not-found") setError("E-mail ou senha incorretos.");
      else if (code === "auth/weak-password") setError("Senha fraca. Use pelo menos 6 caracteres.");
      else setError("Ocorreu um erro. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const titles: Record<Mode,string> = { login:"Bem-vindo", register:"Criar Conta", forgot:"Recuperar Senha" };
  const subtitles: Record<Mode,string> = {
    login:   "Acesse sua conta para participar.",
    register:"Preencha seus dados para começar.",
    forgot:  "Informe seu e-mail para redefinir a senha.",
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center p-4 sm:p-6 bg-slate-950">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-5xl bg-slate-900 rounded-[2rem] sm:rounded-[3rem] shadow-2xl shadow-indigo-500/10 border border-slate-800 overflow-hidden flex flex-col md:flex-row"
      >
        {/* Sidebar visual */}
        <div className="hidden md:block w-5/12 bg-indigo-600 relative p-12 lg:p-16 text-white overflow-hidden">
          <div className="absolute inset-0 z-0">
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-white/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-black/20 rounded-full blur-[60px] translate-y-1/2 -translate-x-1/2" />
          </div>
          <div className="relative z-10 h-full flex flex-col justify-between">
            <div className="space-y-10">
              <div className="flex items-center space-x-3">
                <div className="bg-white p-2.5 rounded-xl text-indigo-600 shadow-xl">
                  <Ticket size={26} />
                </div>
                <span className="text-2xl font-bold tracking-tight">GGRIFAS</span>
              </div>
              <div className="space-y-5">
                <h2 className="text-4xl font-black leading-none tracking-tight">
                  A próxima grande <span className="text-black/30 italic">vitória</span> começa aqui.
                </h2>
                <p className="text-indigo-100 font-medium text-lg leading-relaxed">
                  Plataforma SaaS profissional para gerenciamento de sorteios com automação total.
                </p>
              </div>
            </div>
            <div className="bg-white/10 p-6 rounded-3xl backdrop-blur-md border border-white/10">
              <div className="flex items-center gap-4 mb-3">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-200">Plataforma Ativa</span>
              </div>
              <p className="text-sm font-bold">Mais de 12k sorteios realizados este mês.</p>
            </div>
          </div>
        </div>

        {/* Formulário */}
        <div className="w-full md:w-7/12 p-8 sm:p-12 md:p-16 lg:p-20 bg-slate-900">
          <div className="max-w-md mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl sm:text-4xl font-black text-white mb-2">{titles[mode]}</h1>
              <p className="text-slate-500 font-medium text-base">{subtitles[mode]}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}
                  className="p-4 bg-red-500/10 text-red-400 rounded-2xl text-sm font-bold border border-red-500/20">
                  {error}
                </motion.div>
              )}
              {success && (
                <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}
                  className="p-4 bg-emerald-500/10 text-emerald-400 rounded-2xl text-sm font-bold border border-emerald-500/20 flex items-center gap-3">
                  <CheckCircle2 size={18} /> {success}
                </motion.div>
              )}

              {mode === "register" && (
                <>
                  {/* Nome */}
                  <InputField icon={<UserIcon size={18}/>} placeholder="Nome Completo" type="text"
                    value={name} onChange={setName} required />

                  {/* CPF */}
                  <InputField icon={<CreditCard size={18}/>} placeholder="CPF (000.000.000-00)" type="text"
                    value={cpf}
                    onChange={(v) => setCpf(maskCPF(v))}
                    required />

                  {/* Telefone */}
                  <InputField icon={<Phone size={18}/>} placeholder="WhatsApp com DDD" type="tel"
                    value={phone}
                    onChange={(v) => setPhone(maskPhone(v))}
                    required />

                  {/* Tipo de conta */}
                  <div className="flex p-1.5 bg-slate-950 rounded-2xl border border-slate-800">
                    {(["user","creator"] as const).map((r) => (
                      <button key={r} type="button" onClick={() => setRole(r)}
                        className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${
                          role === r ? "bg-indigo-600 text-white shadow-lg" : "text-slate-500 hover:text-slate-300"
                        }`}>
                        {r === "user" ? "👤 Participante" : "🎯 Criador"}
                      </button>
                    ))}
                  </div>
                </>
              )}

              {/* Email */}
              <InputField icon={<Mail size={18}/>} placeholder="E-mail" type="email"
                value={email} onChange={setEmail} required />

              {/* Senha */}
              {mode !== "forgot" && (
                <InputField icon={<Lock size={18}/>} placeholder="Senha" type="password"
                  value={password} onChange={setPassword} required />
              )}

              {mode === "login" && (
                <div className="text-right -mt-2">
                  <Link to="/forgot-password" className="text-xs font-bold text-slate-500 hover:text-indigo-400 transition-colors">
                    Esqueceu a senha?
                  </Link>
                </div>
              )}

              <button type="submit" disabled={loading}
                className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold text-lg shadow-xl shadow-indigo-600/20 hover:bg-indigo-500 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center gap-3 mt-2">
                {loading
                  ? <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <><span>{mode==="login"?"Entrar":mode==="register"?"Criar Conta":"Enviar E-mail"}</span><ArrowRight size={20}/></>
                }
              </button>
            </form>

            <div className="mt-8 text-center space-y-3">
              {mode !== "forgot" && (
                <p className="text-slate-500 font-medium text-sm">
                  {mode === "login" ? "Não tem conta?" : "Já tem cadastro?"}{" "}
                  <Link to={mode==="login"?"/register":"/login"}
                    className="text-indigo-400 font-bold hover:text-indigo-300 transition-colors ml-1">
                    {mode==="login"?"Cadastre-se":"Faça login"}
                  </Link>
                </p>
              )}
              {mode === "forgot" && (
                <Link to="/login" className="text-indigo-400 font-bold hover:text-indigo-300 transition-colors text-sm">
                  ← Voltar ao login
                </Link>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function InputField({ icon, placeholder, type, value, onChange, required }: {
  icon: React.ReactNode; placeholder: string; type: string;
  value: string; onChange: (v: string) => void; required?: boolean;
}) {
  return (
    <div className="relative group">
      <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-500 group-focus-within:text-indigo-500 transition-colors">
        {icon}
      </div>
      <input
        type={type}
        placeholder={placeholder}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pl-14 pr-6 py-4 bg-slate-950 border border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-medium text-white placeholder:text-slate-600 text-sm"
      />
    </div>
  );
}
