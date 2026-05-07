import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X, User as UserIcon, Mail, Phone, CreditCard,
  Shield, Calendar, Save, Loader2, Trash2,
  CheckCircle2, AlertTriangle, Eye, EyeOff,
} from "lucide-react";
import { User } from "../types";
import { updateUserProfile, tsToDate } from "../lib/firebaseService";
import { doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "../lib/firebase";

interface Props {
  user: User & { createdAt?: unknown; termsAcceptedAt?: unknown };
  onClose:  () => void;
  onSaved:  (updated: User) => void;
  onDeleted?: (id: string) => void;
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

const formatCPF = (v?: string) => {
  if (!v) return "";
  const d = v.replace(/\D/g,"");
  if (d.length !== 11) return v;
  return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6,9)}-${d.slice(9)}`;
};

const formatPhone = (v?: string) => {
  if (!v) return "";
  const d = v.replace(/\D/g,"");
  if (d.length === 11) return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`;
  return v;
};

type Tab = "info" | "edit" | "danger";

export default function AdminUserEditModal({ user, onClose, onSaved, onDeleted }: Props) {
  const [tab,     setTab]     = useState<Tab>("info");
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [confirm, setConfirm] = useState(false);

  // Edit fields
  const [name,  setName]  = useState(user.name ?? "");
  const [phone, setPhone] = useState(formatPhone(user.phone));
  const [cpf,   setCpf]   = useState(formatCPF(user.cpf));
  const [role,  setRole]  = useState<User["role"]>(user.role);

  const handleSave = async () => {
    setSaving(true);
    try {
      const phoneDigits = phone.replace(/\D/g,"");
      const cpfDigits   = cpf.replace(/\D/g,"");
      await updateDoc(doc(db, "users", user.id), {
        name,
        phone:           phoneDigits || null,
        cpf:             cpfDigits || null,
        role,
        profileComplete: !!(phoneDigits && cpfDigits),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      onSaved({ ...user, name, phone: phoneDigits, cpf: cpfDigits, role });
    } catch (e) {
      alert("Erro ao salvar: " + String(e));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm) { setConfirm(true); return; }
    try {
      await deleteDoc(doc(db, "users", user.id));
      onDeleted?.(user.id);
      onClose();
    } catch (e) {
      alert("Erro ao deletar: " + String(e));
    }
  };

  const ROLE_COLORS: Record<string, string> = {
    admin:   "bg-amber-500/10 text-amber-400 border-amber-500/20",
    creator: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    user:    "bg-slate-800 text-slate-400 border-slate-700",
  };
  const ROLE_LABEL: Record<string, string> = {
    admin: "Administrador", creator: "Criador", user: "Participante"
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xl">
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="bg-slate-900 w-full max-w-lg rounded-[2rem] border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-800 shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600/10 flex items-center justify-center text-indigo-400 text-2xl font-black border border-indigo-500/20 shrink-0">
              {user.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="font-black text-white text-xl leading-tight">{user.name}</h2>
              <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg border mt-1 inline-block ${ROLE_COLORS[user.role]}`}>
                {ROLE_LABEL[user.role]}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors p-1">
            <X size={22}/>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-800 shrink-0">
          {([
            { id: "info",   label: "Dados" },
            { id: "edit",   label: "Editar" },
            { id: "danger", label: "Ações" },
          ] as {id:Tab;label:string}[]).map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex-1 py-3.5 text-xs font-black uppercase tracking-widest transition-all border-b-2 ${
                tab === t.id
                  ? "text-white border-indigo-500"
                  : "text-slate-500 border-transparent hover:text-slate-300"
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <AnimatePresence mode="wait">

            {/* ── ABA DADOS ── */}
            {tab === "info" && (
              <motion.div key="info" initial={{opacity:0}} animate={{opacity:1}} className="p-6 space-y-3">
                {[
                  { icon:<UserIcon size={15}/>,   label:"Nome Completo",   value: user.name },
                  { icon:<Mail size={15}/>,        label:"E-mail",          value: user.email },
                  { icon:<CreditCard size={15}/>,  label:"CPF",             value: formatCPF(user.cpf) || "Não informado" },
                  { icon:<Phone size={15}/>,       label:"WhatsApp",        value: formatPhone(user.phone) || "Não informado" },
                  { icon:<Shield size={15}/>,      label:"Perfil",          value: ROLE_LABEL[user.role] },
                  { icon:<CheckCircle2 size={15}/>,label:"Perfil completo", value: user.profileComplete ? "✅ Sim" : "⚠️ Incompleto" },
                  { icon:<Calendar size={15}/>,    label:"Cadastrado em",
                    value: user.createdAt
                      ? tsToDate(user.createdAt).toLocaleDateString("pt-BR",{day:"2-digit",month:"long",year:"numeric"})
                      : "—"
                  },
                  { icon:<CheckCircle2 size={15}/>,label:"Termos aceitos em",
                    value: (user as any).termsAcceptedAt
                      ? tsToDate((user as any).termsAcceptedAt).toLocaleDateString("pt-BR")
                      : "—"
                  },
                ].map((f) => (
                  <div key={f.label} className="flex items-start gap-3 py-2.5 border-b border-slate-800/50 last:border-0">
                    <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-500 shrink-0">
                      {f.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-0.5">{f.label}</p>
                      <p className="text-sm font-medium text-white break-all">{f.value ?? "—"}</p>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}

            {/* ── ABA EDITAR ── */}
            {tab === "edit" && (
              <motion.div key="edit" initial={{opacity:0}} animate={{opacity:1}} className="p-6 space-y-5">
                {/* Nome */}
                <Field icon={<UserIcon size={15}/>} label="Nome Completo">
                  <input type="text" value={name} onChange={e => setName(e.target.value)}
                    className="input-field"/>
                </Field>

                {/* CPF */}
                <Field icon={<CreditCard size={15}/>} label="CPF">
                  <input type="text" value={cpf}
                    onChange={e => setCpf(maskCPF(e.target.value))}
                    placeholder="000.000.000-00"
                    className="input-field"/>
                </Field>

                {/* Telefone */}
                <Field icon={<Phone size={15}/>} label="WhatsApp (com DDD)">
                  <input type="tel" value={phone}
                    onChange={e => setPhone(maskPhone(e.target.value))}
                    placeholder="(11) 99999-9999"
                    className="input-field"/>
                </Field>

                {/* Papel */}
                <Field icon={<Shield size={15}/>} label="Nível de Acesso">
                  <div className="flex gap-2">
                    {(["user","creator","admin"] as const).map((r) => (
                      <button key={r} onClick={() => setRole(r)}
                        className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                          role === r
                            ? ROLE_COLORS[r]
                            : "bg-slate-950 text-slate-500 border-slate-800 hover:border-slate-600"
                        }`}>
                        {r === "user" ? "Participante" : r === "creator" ? "Criador" : "Admin"}
                      </button>
                    ))}
                  </div>
                </Field>

                {/* E-mail (somente leitura) */}
                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">E-mail (não editável)</p>
                  <p className="text-sm text-slate-400">{user.email}</p>
                  <p className="text-[10px] text-slate-600 mt-1">Para alterar o e-mail, o usuário deve fazer pelo perfil.</p>
                </div>

                {/* Botão Salvar */}
                <button onClick={handleSave} disabled={saving}
                  className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-black text-base transition-all disabled:opacity-50 shadow-xl
                    bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20">
                  {saving
                    ? <><Loader2 size={20} className="animate-spin"/> Salvando...</>
                    : saved
                    ? <><CheckCircle2 size={20}/> Salvo!</>
                    : <><Save size={20}/> Salvar Alterações</>
                  }
                </button>
              </motion.div>
            )}

            {/* ── ABA AÇÕES ── */}
            {tab === "danger" && (
              <motion.div key="danger" initial={{opacity:0}} animate={{opacity:1}} className="p-6 space-y-4">

                {/* WhatsApp direto */}
                {user.phone && (
                  <a href={`https://wa.me/55${user.phone.replace(/\D/g,"")}`} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-3 p-5 bg-[#25D366]/10 border border-[#25D366]/20 rounded-2xl hover:bg-[#25D366]/20 transition-all">
                    <div className="w-10 h-10 bg-[#25D366]/20 rounded-xl flex items-center justify-center text-[#25D366]">
                      <Phone size={18}/>
                    </div>
                    <div>
                      <p className="font-black text-white text-sm">Enviar WhatsApp</p>
                      <p className="text-xs text-slate-400">{formatPhone(user.phone)}</p>
                    </div>
                  </a>
                )}

                {/* Redefinir senha (via e-mail) */}
                <button onClick={async () => {
                    const { resetPassword } = await import("../lib/firebaseService");
                    await resetPassword(user.email);
                    alert(`E-mail de redefinição enviado para ${user.email}`);
                  }}
                  className="w-full flex items-center gap-3 p-5 bg-slate-950 border border-slate-800 rounded-2xl hover:border-slate-600 transition-all">
                  <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400">
                    <EyeOff size={18}/>
                  </div>
                  <div className="text-left">
                    <p className="font-black text-white text-sm">Redefinir Senha</p>
                    <p className="text-xs text-slate-400">Envia e-mail de redefinição para o usuário</p>
                  </div>
                </button>

                {/* Deletar usuário */}
                <div className="border-t border-slate-800 pt-4">
                  <div className="flex items-start gap-3 p-4 bg-red-500/5 border border-red-500/15 rounded-2xl mb-3">
                    <AlertTriangle size={16} className="text-red-400 shrink-0 mt-0.5"/>
                    <p className="text-xs text-red-300 leading-relaxed">
                      Deletar o usuário remove apenas o registro no banco de dados. O acesso à autenticação (Firebase Auth) deve ser removido manualmente no console do Firebase.
                    </p>
                  </div>
                  <button onClick={handleDelete}
                    className={`w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-black text-sm transition-all ${
                      confirm
                        ? "bg-red-600 hover:bg-red-500 text-white animate-pulse"
                        : "bg-slate-950 border border-red-500/20 text-red-400 hover:bg-red-500/10"
                    }`}>
                    <Trash2 size={18}/>
                    {confirm ? "CONFIRMAR EXCLUSÃO" : "Excluir Usuário"}
                  </button>
                  {confirm && (
                    <button onClick={() => setConfirm(false)} className="w-full text-center text-xs text-slate-500 hover:text-white pt-2 transition-colors">
                      Cancelar
                    </button>
                  )}
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </motion.div>

      <style>{`
        .input-field {
          width: 100%;
          background: rgb(2 6 23);
          border: 1px solid rgb(30 30 46);
          border-radius: 1rem;
          padding: 0.875rem 1.25rem;
          color: white;
          font-size: 0.875rem;
          font-weight: 500;
          outline: none;
          transition: border-color 0.2s;
        }
        .input-field:focus { border-color: #6366f1; }
        .input-field::placeholder { color: rgb(100 116 139); }
      `}</style>
    </div>
  );
}

function Field({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
        <span className="text-slate-600">{icon}</span>
        {label}
      </label>
      {children}
    </div>
  );
}
