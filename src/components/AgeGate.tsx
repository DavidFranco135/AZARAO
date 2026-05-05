import { useState } from "react";
import { motion } from "motion/react";
import { AlertTriangle, Shield, X, Check } from "lucide-react";

interface Props { onConfirm: () => void; }

export default function AgeGate({ onConfirm }: Props) {
  const [checked, setChecked] = useState(false);

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-2xl">
      <motion.div
        initial={{ scale:0.9, opacity:0 }}
        animate={{ scale:1, opacity:1 }}
        className="bg-slate-900 w-full max-w-md rounded-[2rem] border border-slate-800 shadow-2xl overflow-hidden"
      >
        <div className="bg-red-500/10 border-b border-red-500/20 p-6 text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-500/20">
            <AlertTriangle size={32} className="text-red-400"/>
          </div>
          <h2 className="text-2xl font-black text-white mb-2">Verificação de Idade</h2>
          <p className="text-red-300 font-bold text-sm">
            ⛔ ACESSO PROIBIDO PARA MENORES DE 18 ANOS
          </p>
        </div>

        <div className="p-6 space-y-5">
          <p className="text-slate-300 text-sm leading-relaxed text-center">
            Esta plataforma contém conteúdo destinado exclusivamente a <strong className="text-white">adultos maiores de 18 anos</strong>. Ao continuar, você declara ter a idade mínima exigida.
          </p>

          <div className="p-4 bg-slate-800 rounded-2xl border border-slate-700">
            <label className="flex items-start gap-3 cursor-pointer">
              <div
                onClick={() => setChecked(!checked)}
                className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all cursor-pointer ${
                  checked ? "bg-emerald-500 border-emerald-500" : "border-slate-600 hover:border-slate-400"
                }`}
              >
                {checked && <Check size={12} className="text-white"/>}
              </div>
              <span className="text-sm text-slate-300 font-medium leading-relaxed">
                Confirmo que tenho <strong className="text-white">18 anos ou mais</strong> e aceito os{" "}
                <a href="/termos" target="_blank" className="text-indigo-400 hover:underline">Termos de Uso</a>
                {" "}e a{" "}
                <a href="/privacidade" target="_blank" className="text-indigo-400 hover:underline">Política de Privacidade</a>.
              </span>
            </label>
          </div>

          <button
            onClick={() => { if (checked) onConfirm(); }}
            disabled={!checked}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-4 rounded-2xl font-black text-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-xl shadow-indigo-600/20"
          >
            <Shield size={20}/> CONFIRMAR E ENTRAR
          </button>

          <p className="text-center text-[10px] text-slate-600 font-bold uppercase tracking-widest">
            Menores de 18 anos devem sair desta página imediatamente
          </p>
        </div>
      </motion.div>
    </div>
  );
}
