import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import {
  TrendingUp,
  Users,
  DollarSign,
  ChevronRight,
  PlusCircle,
  Ticket,
  BarChart3,
  Calendar,
  Trash2,
  Eye,
} from "lucide-react";
import { User, DashboardRaffle } from "../types";
import {
  getCreatorDashboard,
  deleteRaffle,
  tsToDate,
} from "../lib/firebaseService";

interface DashboardProps {
  user: User | null;
}

export default function Dashboard({ user }: DashboardProps) {
  const [raffles, setRaffles] = useState<DashboardRaffle[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = async () => {
    if (!user) return;
    const data = await getCreatorDashboard(user.id);
    setRaffles(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta rifa?")) return;
    setDeleting(id);
    await deleteRaffle(id);
    setRaffles((prev) => prev.filter((r) => r.id !== id));
    setDeleting(null);
  };

  const totalGeral = raffles.reduce((a, r) => a + r.totalArrecadado, 0);
  const lucroTotal = raffles.reduce((a, r) => a + r.lucro, 0);
  const comissaoTotal = raffles.reduce((a, r) => a + r.comissao, 0);

  if (loading)
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 sm:py-12 space-y-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Visão <span className="text-indigo-500 italic">Estratégica</span>
          </h1>
          <p className="text-slate-500 font-medium">
            Olá, <span className="text-white font-bold">{user?.name}</span> —
            gerenciamento centralizado das suas campanhas.
          </p>
        </div>
        {(user?.role === "creator" || user?.role === "admin") && (
          <Link
            to="/create-raffle"
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-3 shadow-xl shadow-indigo-600/20 transition-all hover:-translate-y-0.5 self-start sm:self-auto"
          >
            <PlusCircle size={20} />
            <span>Novo Sorteio</span>
          </Link>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={<DollarSign size={22} />}
          label="Volume Total"
          value={`R$ ${totalGeral.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
          color="bg-emerald-500"
        />
        <StatCard
          icon={<TrendingUp size={22} />}
          label="Seu Lucro"
          value={`R$ ${lucroTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
          color="bg-indigo-600"
        />
        <StatCard
          icon={<Users size={22} />}
          label="Taxas Plataforma"
          value={`R$ ${comissaoTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
          color="bg-slate-700"
        />
        <StatCard
          icon={<Ticket size={22} />}
          label="Rifas Ativas"
          value={raffles.filter((r) => r.status === "active").length.toString()}
          color="bg-slate-800"
        />
      </div>

      {/* Table */}
      <div className="bg-slate-900/50 rounded-[2rem] border border-slate-800 shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/30">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-indigo-600/10 rounded-xl flex items-center justify-center text-indigo-400 border border-indigo-500/20">
              <BarChart3 size={18} />
            </div>
            <h2 className="text-lg font-bold text-white">Minhas Campanhas</h2>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest hidden sm:block">
              Dados Atualizados
            </span>
          </div>
        </div>

        {/* Mobile cards / Desktop table */}
        <div className="hidden md:block overflow-x-auto custom-scrollbar">
          <table className="w-full text-left">
            <thead className="bg-slate-950/30">
              <tr>
                {["Rifa", "Status", "Sorteio", "Cotas", "Volume", "Lucro Líquido", ""].map((h) => (
                  <th
                    key={h}
                    className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {raffles.map((raffle) => {
                const img = raffle.images?.[0] ??
                  `https://picsum.photos/seed/${raffle.id}/200`;
                const progress =
                  raffle.totalNumbers > 0
                    ? (raffle.soldNumbers.length / raffle.totalNumbers) * 100
                    : 0;
                return (
                  <tr
                    key={raffle.id}
                    className="group hover:bg-slate-800/20 transition-all"
                  >
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-800 border border-slate-700 shrink-0">
                          <img
                            src={img}
                            alt={raffle.title}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div>
                          <p className="font-bold text-white text-sm group-hover:text-indigo-400 transition-colors leading-tight mb-0.5 line-clamp-1">
                            {raffle.title}
                          </p>
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                            R$ {raffle.pricePerNumber.toFixed(2)} / cota
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${
                          raffle.status === "active"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : "bg-slate-800 text-slate-500 border-slate-700"
                        }`}
                      >
                        {raffle.status === "active" ? "Ativa" : "Finalizada"}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2 text-slate-400">
                        <Calendar size={13} className="text-indigo-400" />
                        <span className="text-xs font-medium">
                          {tsToDate(raffle.drawDate).toLocaleDateString("pt-BR")}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="space-y-1.5 min-w-[80px]">
                        <div className="flex justify-between text-[10px] text-slate-500 font-bold">
                          <span>{raffle.soldNumbers.length}</span>
                          <span>{raffle.totalNumbers}</span>
                        </div>
                        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-indigo-500 rounded-full"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <p className="font-bold text-white text-sm">
                        R$ {raffle.totalArrecadado.toLocaleString("pt-BR")}
                      </p>
                    </td>
                    <td className="px-6 py-5">
                      <p className="font-black text-emerald-400 text-sm">
                        R$ {raffle.lucro.toLocaleString("pt-BR")}
                      </p>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/raffle/${raffle.id}`}
                          className="p-2 text-slate-500 hover:text-white bg-slate-800 rounded-lg border border-slate-700 transition-all"
                        >
                          <Eye size={14} />
                        </Link>
                        <button
                          onClick={() => handleDelete(raffle.id)}
                          disabled={deleting === raffle.id}
                          className="p-2 text-slate-500 hover:text-red-400 bg-slate-800 rounded-lg border border-slate-700 transition-all disabled:opacity-40"
                        >
                          <Trash2 size={14} />
                        </button>
                        <Link
                          to={`/raffle/${raffle.id}`}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-white bg-slate-800 px-3 py-2 rounded-xl transition-all border border-slate-700"
                        >
                          <span>Gerenciar</span>
                          <ChevronRight size={12} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {raffles.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-24 text-center">
                    <div className="max-w-xs mx-auto space-y-5">
                      <div className="w-16 h-16 bg-indigo-600/5 rounded-2xl flex items-center justify-center mx-auto text-indigo-400/20 border-2 border-dashed border-indigo-400/20">
                        <Ticket size={32} />
                      </div>
                      <p className="text-white font-bold">Nenhuma campanha</p>
                      <p className="text-slate-500 text-sm">
                        Crie sua primeira rifa agora.
                      </p>
                      <Link
                        to="/create-raffle"
                        className="inline-block bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-xl font-bold transition-all"
                      >
                        Criar Sorteio
                      </Link>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden divide-y divide-slate-800/50">
          {raffles.length === 0 ? (
            <div className="p-8 text-center space-y-4">
              <Ticket size={32} className="text-slate-700 mx-auto" />
              <p className="text-slate-500 font-medium text-sm">
                Nenhuma campanha encontrada.
              </p>
              <Link
                to="/create-raffle"
                className="inline-block bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm"
              >
                Criar Sorteio
              </Link>
            </div>
          ) : (
            raffles.map((raffle) => {
              const img = raffle.images?.[0] ??
                `https://picsum.photos/seed/${raffle.id}/200`;
              const progress =
                raffle.totalNumbers > 0
                  ? (raffle.soldNumbers.length / raffle.totalNumbers) * 100
                  : 0;
              return (
                <div key={raffle.id} className="p-5 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-800 shrink-0">
                      <img src={img} alt={raffle.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-white text-sm line-clamp-1">{raffle.title}</p>
                      <span className={`text-[10px] font-black uppercase tracking-widest ${raffle.status === "active" ? "text-emerald-400" : "text-slate-500"}`}>
                        {raffle.status === "active" ? "● Ativa" : "● Finalizada"}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-slate-950 rounded-xl p-3 text-center border border-slate-800">
                      <p className="text-[9px] text-slate-600 font-black uppercase mb-1">Volume</p>
                      <p className="text-sm font-black text-white">R$ {raffle.totalArrecadado.toLocaleString("pt-BR")}</p>
                    </div>
                    <div className="bg-slate-950 rounded-xl p-3 text-center border border-slate-800">
                      <p className="text-[9px] text-slate-600 font-black uppercase mb-1">Lucro</p>
                      <p className="text-sm font-black text-emerald-400">R$ {raffle.lucro.toLocaleString("pt-BR")}</p>
                    </div>
                    <div className="bg-slate-950 rounded-xl p-3 text-center border border-slate-800">
                      <p className="text-[9px] text-slate-600 font-black uppercase mb-1">Cotas</p>
                      <p className="text-sm font-black text-white">{raffle.soldNumbers.length}/{raffle.totalNumbers}</p>
                    </div>
                  </div>
                  <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${progress}%` }} />
                  </div>
                  <div className="flex gap-2">
                    <Link to={`/raffle/${raffle.id}`} className="flex-1 flex items-center justify-center gap-2 bg-slate-800 text-white py-2.5 rounded-xl text-xs font-bold border border-slate-700">
                      <Eye size={14} /> Ver
                    </Link>
                    <button onClick={() => handleDelete(raffle.id)} disabled={deleting === raffle.id} className="p-2.5 bg-slate-800 text-red-400 rounded-xl border border-slate-700 disabled:opacity-40">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="bg-slate-900/50 p-5 sm:p-7 rounded-[1.75rem] border border-slate-800 flex flex-col justify-between group hover:border-indigo-500/30 transition-all"
    >
      <div className={`${color} w-10 h-10 rounded-xl flex items-center justify-center text-white mb-5 shadow-xl group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">{label}</p>
        <p className="text-xl sm:text-2xl font-black text-white tracking-tight leading-none">{value}</p>
      </div>
    </motion.div>
  );
}
