import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Shield, Users, Ticket, DollarSign, TrendingUp,
  Trash2, Edit2, Check, X, BarChart3, Settings,
  Eye, RefreshCw,
} from "lucide-react";
import { User, Raffle, Order } from "../types";
import {
  getAllUsers, getAllRaffles, getAllOrders,
  updateUserRole, deleteRaffle,
  getCommissionRate, setCommissionRate, tsToDate,
} from "../lib/firebaseService";

interface AdminPanelProps { user: User | null }
type Tab = "overview" | "users" | "raffles" | "orders" | "settings";

export default function AdminPanel({ user }: AdminPanelProps) {
  const [tab, setTab] = useState<Tab>("overview");
  const [users, setUsers] = useState<User[]>([]);
  const [raffles, setRaffles] = useState<Raffle[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [commissionRate, setCommissionRateState] = useState(10);
  const [newRate, setNewRate] = useState("10");
  const [loading, setLoading] = useState(true);
  const [savingRate, setSavingRate] = useState(false);
  const [savedOk, setSavedOk] = useState(false);
  const [editingRole, setEditingRole] = useState<string | null>(null);
  const [roleValue, setRoleValue] = useState<User["role"]>("user");

  const load = async () => {
    setLoading(true);
    const [u, r, o, rate] = await Promise.all([
      getAllUsers(), getAllRaffles(), getAllOrders(), getCommissionRate(),
    ]);
    setUsers(u); setRaffles(r); setOrders(o);
    setCommissionRateState(rate);
    setNewRate(String(rate));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSaveRate = async () => {
    const val = Number(newRate);
    if (isNaN(val) || val < 0 || val > 99) return;
    setSavingRate(true);
    setSavedOk(false);
    try {
      await setCommissionRate(val);
      setCommissionRateState(val);
      setSavedOk(true);
      setTimeout(() => setSavedOk(false), 3000);
    } catch (e) {
      alert("Erro ao salvar. Verifique as regras do Firestore.");
    } finally {
      setSavingRate(false);
    }
  };

  const handleDeleteRaffle = async (id: string) => {
    if (!confirm("Excluir esta rifa?")) return;
    await deleteRaffle(id);
    setRaffles((p) => p.filter((r) => r.id !== id));
  };

  const handleSaveRole = async (userId: string) => {
    await updateUserRole(userId, roleValue);
    setUsers((p) => p.map((u) => u.id === userId ? { ...u, role: roleValue } : u));
    setEditingRole(null);
  };

  const totalRevenue = orders.filter((o) => o.status === "paid")
    .reduce((s, o) => s + o.totalAmount, 0);
  const platformCommission = totalRevenue * (commissionRate / 100);

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "overview",  label: "Visão Geral",   icon: <BarChart3 size={15} /> },
    { id: "users",     label: "Usuários",       icon: <Users size={15} /> },
    { id: "raffles",   label: "Rifas",          icon: <Ticket size={15} /> },
    { id: "orders",    label: "Pedidos",        icon: <DollarSign size={15} /> },
    { id: "settings",  label: "Configurações",  icon: <Settings size={15} /> },
  ];

  if (loading)
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-400 border border-amber-500/20">
            <Shield size={24} />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">
              Painel <span className="text-amber-400 italic">Administrativo</span>
            </h1>
            <p className="text-slate-500 text-sm font-medium">
              Bem-vindo, {user?.name}
            </p>
          </div>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white px-4 py-2 rounded-xl text-sm font-bold transition-all self-start sm:self-auto"
        >
          <RefreshCw size={14} />
          Atualizar
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-900 p-1 rounded-2xl border border-slate-800 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${
              tab === t.id ? "bg-indigo-600 text-white shadow-lg" : "text-slate-500 hover:text-white"
            }`}
          >
            {t.icon}
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {/* Tab content — sem AnimatePresence/motion para evitar o insertBefore */}

      {/* ── OVERVIEW ── */}
      <div style={{ display: tab === "overview" ? "block" : "none" }} className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={<Users size={20} />}      label="Usuários"        value={users.length.toString()}                                       color="bg-indigo-600" />
          <StatCard icon={<Ticket size={20} />}     label="Rifas"           value={raffles.length.toString()}                                     color="bg-emerald-600" />
          <StatCard icon={<DollarSign size={20} />} label="Receita Total"   value={`R$ ${totalRevenue.toLocaleString("pt-BR")}`}                  color="bg-amber-500" />
          <StatCard icon={<TrendingUp size={20} />} label="Comissão GGRIFAS" value={`R$ ${platformCommission.toLocaleString("pt-BR")}`}           color="bg-rose-600" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6">
            <h3 className="text-sm font-black text-white uppercase tracking-widest mb-4">Rifas Recentes</h3>
            <div className="space-y-3">
              {raffles.slice(0, 5).map((r) => (
                <div key={r.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg overflow-hidden bg-slate-800 shrink-0">
                      <img src={r.images?.[0] ?? `https://picsum.photos/seed/${r.id}/100`} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
                    </div>
                    <p className="text-sm font-medium text-slate-300 truncate">{r.title}</p>
                  </div>
                  <span className={`text-[10px] font-black uppercase ml-2 shrink-0 ${r.status === "active" ? "text-emerald-400" : "text-slate-500"}`}>
                    {r.status === "active" ? "Ativa" : "Encerrada"}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6">
            <h3 className="text-sm font-black text-white uppercase tracking-widest mb-4">Pedidos Recentes</h3>
            <div className="space-y-3">
              {orders.slice(0, 5).map((o) => (
                <div key={o.id} className="flex items-center justify-between">
                  <p className="text-xs font-mono text-slate-400 truncate">{o.id.slice(0, 16)}...</p>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-sm font-bold text-white">R$ {o.totalAmount.toFixed(2)}</span>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg ${o.status === "paid" ? "bg-emerald-500/10 text-emerald-400" : "bg-slate-800 text-slate-500"}`}>
                      {o.status === "paid" ? "Pago" : "Pendente"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── USERS ── */}
      <div style={{ display: tab === "users" ? "block" : "none" }}>
        <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
          <div className="p-5 border-b border-slate-800">
            <h3 className="font-black text-white">Usuários ({users.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-950/30">
                <tr>
                  {["Nome", "E-mail", "Papel", ""].map((h) => (
                    <th key={h} className="px-5 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/20 transition-all">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-600/20 flex items-center justify-center text-indigo-400 text-xs font-black">
                          {u.name?.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm font-medium text-white">{u.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-400">{u.email}</td>
                    <td className="px-5 py-4">
                      {editingRole === u.id ? (
                        <select value={roleValue} onChange={(e) => setRoleValue(e.target.value as User["role"])} className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white outline-none">
                          {["user", "creator", "admin"].map((r) => <option key={r} value={r} className="bg-slate-900">{r}</option>)}
                        </select>
                      ) : (
                        <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border ${
                          u.role === "admin" ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                          : u.role === "creator" ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
                          : "bg-slate-800 text-slate-500 border-slate-700"
                        }`}>{u.role}</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      {editingRole === u.id ? (
                        <div className="flex gap-2">
                          <button onClick={() => handleSaveRole(u.id)} className="p-1.5 bg-emerald-600/20 text-emerald-400 rounded-lg"><Check size={13} /></button>
                          <button onClick={() => setEditingRole(null)} className="p-1.5 bg-slate-800 text-slate-400 rounded-lg"><X size={13} /></button>
                        </div>
                      ) : (
                        <button onClick={() => { setEditingRole(u.id); setRoleValue(u.role); }} className="p-1.5 text-slate-500 hover:text-white bg-slate-800 rounded-lg border border-slate-700">
                          <Edit2 size={13} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── RAFFLES ── */}
      <div style={{ display: tab === "raffles" ? "block" : "none" }}>
        <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
          <div className="p-5 border-b border-slate-800">
            <h3 className="font-black text-white">Todas as Rifas ({raffles.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-950/30">
                <tr>
                  {["Título", "Criador", "Status", "Cotas", "Preço", ""].map((h) => (
                    <th key={h} className="px-5 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {raffles.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-800/20 transition-all">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-800 shrink-0">
                          <img src={r.images?.[0] ?? `https://picsum.photos/seed/${r.id}/100`} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
                        </div>
                        <p className="text-sm font-medium text-white line-clamp-1 max-w-[180px]">{r.title}</p>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-400">{r.creatorName ?? "—"}</td>
                    <td className="px-5 py-4">
                      <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg ${r.status === "active" ? "bg-emerald-500/10 text-emerald-400" : "bg-slate-800 text-slate-500"}`}>
                        {r.status === "active" ? "Ativa" : "Encerrada"}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm font-bold text-white">{r.soldNumbers.length}/{r.totalNumbers}</td>
                    <td className="px-5 py-4 text-sm font-bold text-indigo-400">R$ {r.pricePerNumber.toFixed(2)}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <Link to={`/raffle/${r.id}`} className="p-1.5 text-slate-500 hover:text-white bg-slate-800 rounded-lg border border-slate-700">
                          <Eye size={13} />
                        </Link>
                        <button onClick={() => handleDeleteRaffle(r.id)} className="p-1.5 text-slate-500 hover:text-red-400 bg-slate-800 rounded-lg border border-slate-700">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── ORDERS ── */}
      <div style={{ display: tab === "orders" ? "block" : "none" }}>
        <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
          <div className="p-5 border-b border-slate-800 flex items-center justify-between">
            <h3 className="font-black text-white">Pedidos ({orders.length})</h3>
            <p className="text-sm font-bold text-emerald-400">
              Total pago: R$ {totalRevenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-950/30">
                <tr>
                  {["ID", "Cotas", "Valor", "Status", "Data"].map((h) => (
                    <th key={h} className="px-5 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-800/20 transition-all">
                    <td className="px-5 py-4 text-xs font-mono text-slate-500">{o.id.slice(0, 14)}...</td>
                    <td className="px-5 py-4 text-sm font-bold text-white">{o.numbers.length}</td>
                    <td className="px-5 py-4 text-sm font-bold text-white">R$ {o.totalAmount.toFixed(2)}</td>
                    <td className="px-5 py-4">
                      <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg ${o.status === "paid" ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"}`}>
                        {o.status === "paid" ? "Pago" : "Pendente"}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-500">
                      {tsToDate(o.createdAt).toLocaleDateString("pt-BR")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── SETTINGS ── */}
      <div style={{ display: tab === "settings" ? "block" : "none" }} className="max-w-xl space-y-6">
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-8 space-y-6">
          <h3 className="font-black text-white text-lg">Taxa de Comissão da Plataforma</h3>
          <p className="text-slate-500 text-sm leading-relaxed">
            Percentual cobrado sobre o valor arrecadado de cada rifa. Taxa atual:{" "}
            <span className="text-amber-400 font-bold">{commissionRate}%</span>
          </p>

          {/* Input + Botão — sem conditional rendering de ícone */}
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <input
                type="number"
                min="0"
                max="99"
                step="0.5"
                value={newRate}
                onChange={(e) => setNewRate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white font-bold text-lg outline-none focus:border-indigo-500 pr-10"
              />
              <span className="absolute right-4 inset-y-0 flex items-center text-slate-500 font-bold pointer-events-none">
                %
              </span>
            </div>
            <button
              onClick={handleSaveRate}
              disabled={savingRate}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-bold transition-all disabled:opacity-60 min-w-[110px] text-center"
            >
              {savingRate ? "Salvando..." : savedOk ? "✓ Salvo!" : "Salvar"}
            </button>
          </div>

          {savedOk && (
            <p className="text-emerald-400 text-sm font-bold">
              ✓ Taxa de {commissionRate}% salva com sucesso!
            </p>
          )}
        </div>

        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-8 space-y-4">
          <h3 className="font-black text-white text-lg">Conta Admin</h3>
          <p className="text-sm text-slate-400">
            <span className="text-slate-500 font-bold">E-mail: </span>{user?.email}
          </p>
          <p className="text-sm text-slate-400">
            <span className="text-slate-500 font-bold">Papel: </span>
            <span className="text-amber-400 font-black uppercase">{user?.role}</span>
          </p>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div className="bg-slate-900/50 p-5 sm:p-6 rounded-2xl border border-slate-800 space-y-4 hover:border-slate-700 transition-all">
      <div className={`${color} w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg`}>
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{label}</p>
        <p className="text-xl font-black text-white leading-none">{value}</p>
      </div>
    </div>
  );
}
