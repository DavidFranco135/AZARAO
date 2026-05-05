import React, { useState } from "react";
import { motion } from "motion/react";
import { X, Phone, CreditCard, CheckCircle2, UserCheck, Loader2 } from "lucide-react";
import { User } from "../types";
import { updateUserProfile, fetchUserProfile } from "../lib/firebaseService";

interface Props {
  user: User;
  onComplete: (updated: User) => void;
  onClose: () => void;
}

const maskCPF = (v: string) =>
  v.replace(/\D/g,"").slice(0,11)
   .replace(/(\d{3})(\d)/,"$1.$2")
   .replace(/(\d{3})(\d)/,"$1.$2")
   .replace(/(\d{3})(\d{1,2})$/,"$1-$2");

const maskPhone = (v: string) =>
  v.replace(/\D/g,"").slice(0,11)
   .replace(/(\d{2})(\d)/,"($1) $2")
   .replace(/(\d{5})(\d{1,4})$/,"$1-$2");

export default function CompleteProfileModal({ user, onComplete, onClose }: Props) {
  const [phone,   setPhone]   = useState(user.phone ?? "");
  const [cpf,     setCpf]     = useState(user.cpf ?? "");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const phoneDigits = phone.replace(/\D/g,"");
    const cpfDigits   = cpf.replace(/\D/g,"");
    if (phoneDigits.length < 10) { setError("Telefone inválido. Informe com DDD."); return; }
    if (cpfDigits.length !== 11) { setError("CPF inválido. Informe os 11 dígitos."); return; }

    setLoading(true);
    try {
      await updateUserProfile(user.id, { phone: phoneDigits, cpf: cpfDigits });
      const updated = await fetchUserProfile(user.id);
      onComplete(updated ?? { ...user, phone: phoneDigits, cpf: cpfDigits, profileComplete: true });
    } catch {
      setError("Erro ao salvar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xl">
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="bg-slate-900 w-full max-w-md rounded-[2rem] border border-slate-800 shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600/10 rounded-xl flex items-center justify-center text-indigo-400 border border-indigo-500/20">
              <UserCheck size={20} />
            </div>
            <div>
              <h2 className="font-black text-white text-lg">Complete seu Cadastro</h2>
              <p className="text-xs text-slate-500 font-medium">Necessário para finalizar a compra</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <X size={22} />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-5">
          <div className="p-4 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
            <p className="text-sm text-indigo-300 font-medium leading-relaxed">
              Para participar dos sorteios precisamos do seu <strong>CPF</strong> e{" "}
              <strong>WhatsApp</strong> para confirmação e contato em caso de premiação.
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 text-red-400 rounded-xl text-sm font-bold border border-red-500/20">
              {error}
            </div>
          )}

          {/* CPF */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">CPF</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-indigo-500 transition-colors">
                <CreditCard size={17} />
              </div>
              <input
                type="text"
                placeholder="000.000.000-00"
                required
                value={cpf}
                onChange={(e) => setCpf(maskCPF(e.target.value))}
                className="w-full pl-12 pr-5 py-3.5 bg-slate-950 border border-slate-800 rounded-2xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all font-medium text-white placeholder:text-slate-600 text-sm"
              />
            </div>
          </div>

          {/* WhatsApp */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">WhatsApp (com DDD)</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-indigo-500 transition-colors">
                <Phone size={17} />
              </div>
              <input
                type="tel"
                placeholder="(11) 99999-9999"
                required
                value={phone}
                onChange={(e) => setPhone(maskPhone(e.target.value))}
                className="w-full pl-12 pr-5 py-3.5 bg-slate-950 border border-slate-800 rounded-2xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all font-medium text-white placeholder:text-slate-600 text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-4 rounded-2xl font-black text-lg shadow-xl shadow-indigo-600/20 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
          >
            {loading
              ? <Loader2 size={22} className="animate-spin" />
              : <><CheckCircle2 size={22} /> SALVAR E CONTINUAR</>
            }
          </button>
        </form>
      </motion.div>
    </div>
  );
}
