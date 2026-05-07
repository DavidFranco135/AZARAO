import { motion } from "motion/react";
import {
  X, User as UserIcon, Mail, Phone, CreditCard,
  Shield, Calendar, Ticket,
} from "lucide-react";
import { User } from "../types";
import { tsToDate } from "../lib/firebaseService";
import { openWhatsApp, templates } from "../lib/whatsapp";

interface Props {
  user: User & { createdAt?: unknown; termsAcceptedAt?: unknown };
  onClose: () => void;
  onWhatsApp?: () => void;
}

const ROLE_LABEL: Record<string, { label: string; color: string }> = {
  admin:   { label: "Administrador", color: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  creator: { label: "Criador",       color: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" },
  user:    { label: "Participante",  color: "bg-slate-800 text-slate-300 border-slate-700" },
};

const formatCPF = (cpf?: string) => {
  if (!cpf) return "—";
  const d = cpf.replace(/\D/g,"");
  if (d.length !== 11) return cpf;
  return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6,9)}-${d.slice(9)}`;
};

const formatPhone = (p?: string) => {
  if (!p) return "—";
  const d = p.replace(/\D/g,"");
  if (d.length === 11) return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`;
  return p;
};

export default function UserDetailsModal({ user, onClose }: Props) {
  const role = ROLE_LABEL[user.role] ?? ROLE_LABEL.user;

  const handleWhatsApp = () => {
    if (!user.phone) { alert("Usuário não cadastrou telefone."); return; }
    openWhatsApp(user.phone, templates.custom(user.name, ""));
  };

  const fields = [
    { icon: <UserIcon size={15}/>,    label: "Nome Completo",   value: user.name },
    { icon: <Mail size={15}/>,        label: "E-mail",          value: user.email },
    { icon: <CreditCard size={15}/>,  label: "CPF",             value: formatCPF(user.cpf) },
    { icon: <Phone size={15}/>,       label: "WhatsApp",        value: formatPhone(user.phone) },
    { icon: <Shield size={15}/>,      label: "Perfil",          value: null, badge: role },
    { icon: <Calendar size={15}/>,    label: "Cadastrado em",
      value: user.createdAt
        ? tsToDate(user.createdAt).toLocaleDateString("pt-BR", { day:"2-digit", month:"long", year:"numeric" })
        : "—"
    },
    { icon: <Ticket size={15}/>,      label: "Termos aceitos",
      value: (user as any).termsAcceptedAt
        ? tsToDate((user as any).termsAcceptedAt).toLocaleDateString("pt-BR")
        : "—"
    },
  ];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xl">
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="bg-slate-900 w-full max-w-md rounded-[2rem] border border-slate-800 shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 flex items-center justify-center text-indigo-400 text-xl font-black border border-indigo-500/20">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="font-black text-white text-lg leading-none">{user.name}</h2>
              <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg border mt-1 inline-block ${role.color}`}>
                {role.label}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <X size={22} />
          </button>
        </div>

        {/* Dados */}
        <div className="p-6 space-y-3">
          {fields.map((f) => (
            <div key={f.label} className="flex items-start gap-3 py-2.5 border-b border-slate-800/60 last:border-0">
              <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-500 shrink-0">
                {f.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-0.5">{f.label}</p>
                {f.badge ? (
                  <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg border ${f.badge.color}`}>
                    {f.badge.label}
                  </span>
                ) : (
                  <p className="text-sm font-medium text-white break-all">{f.value ?? "—"}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Ações */}
        <div className="px-6 pb-6 flex gap-3">
          {user.phone && (
            <button
              onClick={handleWhatsApp}
              className="flex-1 flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20bc5a] text-white py-3 rounded-xl font-bold text-sm transition-all"
            >
              <Phone size={15}/> WhatsApp
            </button>
          )}
          <button
            onClick={onClose}
            className="flex-1 flex items-center justify-center bg-slate-800 hover:bg-slate-700 text-slate-300 py-3 rounded-xl font-bold text-sm transition-all border border-slate-700"
          >
            Fechar
          </button>
        </div>
      </motion.div>
    </div>
  );
}
