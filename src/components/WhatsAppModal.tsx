import React, { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  X, MessageCircle, Phone, Trophy, Bell, CreditCard,
  Edit3, Send, ChevronDown,
} from "lucide-react";
import { User, Order, Raffle } from "../types";
import { openWhatsApp, templates } from "../lib/whatsapp";

interface Props {
  onClose: () => void;
  // Contexto opcional — preenche campos automaticamente
  targetUser?: User | null;
  raffle?: Raffle | null;
  order?: Order | null;
  defaultTemplate?: "winner" | "payment" | "reminder" | "custom";
}

type Template = "winner" | "payment" | "reminder" | "custom";

const TEMPLATE_LABELS: Record<Template, { label: string; icon: React.ReactNode; color: string }> = {
  winner:   { label: "🏆 Ganhador",          icon: <Trophy size={15}/>,      color: "text-yellow-400" },
  payment:  { label: "✅ Pagamento confirmado", icon: <CreditCard size={15}/>, color: "text-emerald-400" },
  reminder: { label: "🔔 Lembrete sorteio",   icon: <Bell size={15}/>,        color: "text-indigo-400" },
  custom:   { label: "✏️ Mensagem livre",      icon: <Edit3 size={15}/>,       color: "text-slate-300" },
};

export default function WhatsAppModal({
  onClose, targetUser, raffle, order, defaultTemplate = "custom",
}: Props) {
  const [phone,    setPhone]    = useState(targetUser?.phone ?? "");
  const [template, setTemplate] = useState<Template>(defaultTemplate);
  const [custom,   setCustom]   = useState("");
  const [showDrop, setShowDrop] = useState(false);

  // Gera a mensagem baseada no template selecionado
  const getMessage = (): string => {
    const name  = targetUser?.name ?? "Cliente";
    const title = raffle?.title ?? "—";

    switch (template) {
      case "winner":
        return templates.winner(name, title, raffle?.winnerNumber ?? 0);
      case "payment":
        return templates.payment(name, title, order?.totalAmount ?? 0);
      case "reminder":
        return templates.reminder(
          name, title,
          raffle?.drawDate
            ? new Date(raffle.drawDate).toLocaleDateString("pt-BR")
            : "—"
        );
      case "custom":
        return templates.custom(name, custom);
    }
  };

  const handleSend = () => {
    if (!phone.trim()) { alert("Informe o número de WhatsApp."); return; }
    if (template === "custom" && !custom.trim()) {
      alert("Escreva a mensagem."); return;
    }
    openWhatsApp(phone, getMessage());
  };

  const msg = getMessage();

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xl">
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-slate-900 w-full max-w-lg rounded-[2rem] border border-slate-800 shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-[#25D366]/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#25D366] rounded-xl flex items-center justify-center shadow-lg">
              <MessageCircle size={20} className="text-white" />
            </div>
            <div>
              <h2 className="font-black text-white text-lg">Enviar WhatsApp</h2>
              {targetUser && (
                <p className="text-xs text-slate-400 font-medium">para {targetUser.name}</p>
              )}
            </div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <X size={22} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Número */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
              Número WhatsApp
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-600">
                <Phone size={15} />
              </div>
              <input
                type="tel"
                placeholder="(11) 99999-9999"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm font-semibold text-white outline-none focus:border-[#25D366]/60 focus:ring-2 focus:ring-[#25D366]/10 placeholder:text-slate-600 transition-all"
              />
            </div>
            <p className="text-[10px] text-slate-600 px-1">
              Com ou sem DDD. Ex: 11999998888 ou (11) 9 9999-8888
            </p>
          </div>

          {/* Template dropdown */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
              Tipo de Mensagem
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowDrop(!showDrop)}
                className="w-full flex items-center justify-between bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold text-white hover:border-slate-700 transition-all"
              >
                <span className={`flex items-center gap-2 ${TEMPLATE_LABELS[template].color}`}>
                  {TEMPLATE_LABELS[template].icon}
                  {TEMPLATE_LABELS[template].label}
                </span>
                <ChevronDown size={16} className={`text-slate-500 transition-transform ${showDrop ? "rotate-180" : ""}`} />
              </button>

              {showDrop && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl z-10">
                  {(Object.keys(TEMPLATE_LABELS) as Template[]).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => { setTemplate(t); setShowDrop(false); }}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-bold transition-all hover:bg-slate-800 ${
                        template === t ? "bg-slate-800" : ""
                      } ${TEMPLATE_LABELS[t].color}`}
                    >
                      {TEMPLATE_LABELS[t].icon}
                      {TEMPLATE_LABELS[t].label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Mensagem customizada */}
          {template === "custom" && (
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                Sua Mensagem
              </label>
              <textarea
                rows={3}
                placeholder="Digite a mensagem aqui..."
                value={custom}
                onChange={(e) => setCustom(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-medium text-white outline-none focus:border-[#25D366]/60 focus:ring-2 focus:ring-[#25D366]/10 placeholder:text-slate-600 transition-all resize-none"
              />
            </div>
          )}

          {/* Preview */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
              Preview da Mensagem
            </label>
            <div className="bg-[#0d1117] rounded-xl p-4 border border-slate-800 max-h-40 overflow-y-auto">
              <div className="bg-[#25D366]/10 border border-[#25D366]/20 rounded-xl rounded-tl-none px-4 py-3 max-w-[85%]">
                <p className="text-xs text-slate-200 whitespace-pre-wrap leading-relaxed font-medium">
                  {msg || "Selecione um template..."}
                </p>
              </div>
            </div>
          </div>

          {/* Botão enviar */}
          <button
            onClick={handleSend}
            className="w-full bg-[#25D366] hover:bg-[#20bc5a] text-white py-4 rounded-2xl font-black text-base shadow-xl shadow-[#25D366]/20 transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-3"
          >
            <Send size={18} />
            ABRIR WHATSAPP E ENVIAR
          </button>
          <p className="text-center text-[10px] text-slate-600 font-bold uppercase tracking-widest">
            Abre o WhatsApp com a mensagem preenchida
          </p>
        </div>
      </motion.div>
    </div>
  );
}
