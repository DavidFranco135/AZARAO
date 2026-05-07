import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import {
  BarChart3, TrendingUp, DollarSign, Percent,
  Calendar, Download, Filter, ArrowLeft,
  ChevronDown, Ticket, Users, Search,
} from "lucide-react";
import { User } from "../types";
import { getAllRafflesAdmin, getAllOrdersAdmin, tsToDate } from "../lib/firebaseService";

interface Props { user: User | null }

// ─── Tipos locais ─────────────────────────────────────────────────────────────
interface RaffleRow {
  raffleId:         string;
  raffleCode:       string;
  title:            string;
  creatorId:        string;
  creatorName:      string;
  commissionPct:    number;
  totalRevenue:     number;
  commission:       number;
  creatorProfit:    number;
  qtdSold:          number;
  qtdOrders:        number;
  firstSaleAt:      Date | null;
  lastSaleAt:       Date | null;
}

type Period = "today" | "week" | "month" | "last_month" | "all" | "custom";

const PERIOD_LABELS: Record<Period, string> = {
  today:      "Hoje",
  week:       "Esta semana",
  month:      "Este mês",
  last_month: "Mês passado",
  all:        "Todo o período",
  custom:     "Personalizado",
};

function getPeriodRange(period: Period, from: string, to: string): [Date, Date] {
  const now   = new Date();
  const start = new Date(now); start.setHours(0,0,0,0);
  const end   = new Date(now); end.setHours(23,59,59,999);

  if (period === "today")      return [start, end];
  if (period === "week")       { start.setDate(now.getDate() - now.getDay()); return [start, end]; }
  if (period === "month")      { start.setDate(1); return [start, end]; }
  if (period === "last_month") {
    const s = new Date(now.getFullYear(), now.getMonth()-1, 1);
    const e = new Date(now.getFullYear(), now.getMonth(), 0, 23,59,59,999);
    return [s, e];
  }
  if (period === "custom") {
    const s = from ? new Date(from + "T00:00:00") : new Date(0);
    const e = to   ? new Date(to   + "T23:59:59") : new Date();
    return [s, e];
  }
  return [new Date(0), new Date()];
}

export default function Reports({ user }: Props) {
  const isAdmin = user?.role === "admin";

  const [loading,   setLoading]   = useState(true);
  const [rows,      setRows]      = useState<RaffleRow[]>([]);
  const [period,    setPeriod]    = useState<Period>("month");
  const [fromDate,  setFromDate]  = useState("");
  const [toDate,    setToDate]    = useState("");
  const [search,    setSearch]    = useState("");
  const [showPicker,setShowPicker]= useState(false);
  const [selCreator,setSelCreator]= useState<string>("all");

  const loadReport = useCallback(async () => {
    setLoading(true);
    try {
      const [start, end] = getPeriodRange(period, fromDate, toDate);
      const [allRaffles, allOrders] = await Promise.all([
        getAllRafflesAdmin(),
        getAllOrdersAdmin(),
      ]);

      // Filtra pedidos pagos no período
      const paidOrders = allOrders.filter((o) => {
        if (o.status !== "paid") return false;
        const d = tsToDate(o.createdAt);
        return d >= start && d <= end;
      });

      // Para criadores: filtra apenas as rifas deles
      const raffleMap = new Map(allRaffles.map((r) => [r.id, r]));
      const raffleIds = isAdmin
        ? new Set(allRaffles.map(r => r.id))
        : new Set(allRaffles.filter(r => r.creatorId === user?.id).map(r => r.id));

      // Agrupa pedidos por rifa
      const grouped = new Map<string, typeof paidOrders>();
      for (const o of paidOrders) {
        if (!raffleIds.has(o.raffleId)) continue;
        const arr = grouped.get(o.raffleId) ?? [];
        arr.push(o);
        grouped.set(o.raffleId, arr);
      }

      const result: RaffleRow[] = [];
      for (const [raffleId, orders] of grouped) {
        const raffle = raffleMap.get(raffleId);
        if (!raffle) continue;

        const dates        = orders.map(o => tsToDate(o.createdAt)).sort((a,b) => a.getTime()-b.getTime());
        const totalRevenue = orders.reduce((s,o) => s + (o.totalAmount ?? 0), 0);
        const commPct      = raffle.commissionPercentage ?? 10;
        const commission   = totalRevenue * (commPct / 100);

        result.push({
          raffleId,
          raffleCode:    (raffle as any).raffleCode ?? "—",
          title:         raffle.title,
          creatorId:     raffle.creatorId,
          creatorName:   (raffle as any).creatorName ?? "Criador",
          commissionPct: commPct,
          totalRevenue,
          commission:    parseFloat(commission.toFixed(2)),
          creatorProfit: parseFloat((totalRevenue - commission).toFixed(2)),
          qtdSold:       orders.reduce((s,o) => s + (o.numbers?.length ?? 0), 0),
          qtdOrders:     orders.length,
          firstSaleAt:   dates[0] ?? null,
          lastSaleAt:    dates[dates.length-1] ?? null,
        });
      }

      result.sort((a,b) => b.totalRevenue - a.totalRevenue);
      setRows(result);
    } finally {
      setLoading(false);
    }
  }, [period, fromDate, toDate, isAdmin, user?.id]);

  useEffect(() => { loadReport(); }, [loadReport]);

  // Filtragem local
  const creators = [...new Set(rows.map(r => r.creatorId))].map(id => ({
    id, name: rows.find(r => r.creatorId === id)?.creatorName ?? id,
  }));

  const filtered = rows.filter(r => {
    const matchSearch  = !search || r.title.toLowerCase().includes(search.toLowerCase()) || r.raffleCode.toLowerCase().includes(search.toLowerCase());
    const matchCreator = selCreator === "all" || r.creatorId === selCreator;
    return matchSearch && matchCreator;
  });

  // Totais
  const totalRevenue  = filtered.reduce((s,r) => s + r.totalRevenue,  0);
  const totalComm     = filtered.reduce((s,r) => s + r.commission,    0);
  const totalProfit   = filtered.reduce((s,r) => s + r.creatorProfit, 0);
  const totalCotas    = filtered.reduce((s,r) => s + r.qtdSold,       0);

  // Export CSV
  const exportCSV = () => {
    const header = isAdmin
      ? ["Código","Título","Criador","Comissão %","Cotas","Pedidos","Receita","Comissão","Lucro Criador","Primeira Venda","Última Venda"]
      : ["Código","Título","Comissão %","Cotas","Pedidos","Receita","Comissão","Lucro","Primeira Venda","Última Venda"];
    const fmt = (n: number) => `R$ ${n.toLocaleString("pt-BR",{minimumFractionDigits:2})}`;
    const fmtDate = (d: Date|null) => d ? d.toLocaleDateString("pt-BR") : "—";
    const rows_csv = filtered.map(r => isAdmin
      ? [r.raffleCode,r.title,r.creatorName,r.commissionPct+"%",r.qtdSold,r.qtdOrders,fmt(r.totalRevenue),fmt(r.commission),fmt(r.creatorProfit),fmtDate(r.firstSaleAt),fmtDate(r.lastSaleAt)]
      : [r.raffleCode,r.title,r.commissionPct+"%",r.qtdSold,r.qtdOrders,fmt(r.totalRevenue),fmt(r.commission),fmt(r.creatorProfit),fmtDate(r.firstSaleAt),fmtDate(r.lastSaleAt)]
    );
    const csv = [header, ...rows_csv].map(row => row.map(v => `"${v}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF"+csv], { type: "text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a"); a.href = url; a.download = `relatorio-azarao-${new Date().toISOString().slice(0,10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  const fmt = (n: number) => n.toLocaleString("pt-BR",{minimumFractionDigits:2,maximumFractionDigits:2});

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 space-y-8">
      {/* Volta */}
      <Link to={isAdmin ? "/admin" : "/dashboard"}
        className="inline-flex items-center gap-2 text-slate-500 hover:text-white font-bold text-sm transition-colors group">
        <div className="bg-slate-900 p-2 rounded-lg border border-slate-800 group-hover:border-slate-600">
          <ArrowLeft size={15}/>
        </div>
        Voltar
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 bg-indigo-600/10 rounded-xl flex items-center justify-center text-indigo-400 border border-indigo-500/20">
              <BarChart3 size={20}/>
            </div>
            <h1 className="text-3xl font-black text-white">
              {isAdmin ? "Relatório Financeiro" : "Meu Relatório"}
            </h1>
          </div>
          <p className="text-slate-500 text-sm ml-[52px]">
            {isAdmin ? "Receitas, comissões e lucros por criador" : "Suas receitas e comissões"}
          </p>
        </div>
        <button onClick={exportCSV}
          className="flex items-center gap-2 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 border border-emerald-500/20 px-5 py-2.5 rounded-xl font-bold text-sm transition-all">
          <Download size={16}/> Exportar CSV
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex flex-wrap gap-2 items-center">
          <Filter size={15} className="text-slate-500"/>
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mr-2">Período:</span>
          {(Object.entries(PERIOD_LABELS) as [Period, string][]).map(([p, label]) => (
            <button key={p} onClick={() => { setPeriod(p); if(p==="custom") setShowPicker(true); else setShowPicker(false); }}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                period === p
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-800 text-slate-400 hover:text-white border border-slate-700"
              }`}>
              {label}
            </button>
          ))}
        </div>

        {/* Datas custom */}
        {(period === "custom" || showPicker) && (
          <div className="flex flex-wrap gap-3 items-center pl-6">
            <div className="flex items-center gap-2">
              <Calendar size={13} className="text-slate-500"/>
              <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"/>
            </div>
            <span className="text-slate-600 font-bold">até</span>
            <div className="flex items-center gap-2">
              <input type="date" value={toDate} onChange={e => setToDate(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"/>
            </div>
          </div>
        )}

        {/* Busca e filtro por criador */}
        <div className="flex flex-wrap gap-3 items-center pl-6">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"/>
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar rifa ou código..."
              className="bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder:text-slate-600 outline-none focus:border-indigo-500 w-52"/>
          </div>
          {isAdmin && creators.length > 1 && (
            <select value={selCreator} onChange={e => setSelCreator(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-indigo-500">
              <option value="all">Todos os criadores</option>
              {creators.map(cr => <option key={cr.id} value={cr.id}>{cr.name}</option>)}
            </select>
          )}
        </div>
      </div>

      {/* Cards de totais */}
      {!loading && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon:<TrendingUp size={18}/>,  label:"Receita Total",      value:`R$ ${fmt(totalRevenue)}`, color:"bg-emerald-500/10 text-emerald-400 border-emerald-500/15" },
            { icon:<Percent size={18}/>,     label:"Comissão Plataforma", value:`R$ ${fmt(totalComm)}`,   color:"bg-indigo-500/10 text-indigo-400 border-indigo-500/15" },
            { icon:<DollarSign size={18}/>,  label:"Lucro Criadores",    value:`R$ ${fmt(totalProfit)}`,  color:"bg-amber-500/10 text-amber-400 border-amber-500/15" },
            { icon:<Ticket size={18}/>,      label:"Cotas Vendidas",     value:String(totalCotas),         color:"bg-slate-800 text-slate-300 border-slate-700" },
          ].map((s) => (
            <motion.div key={s.label} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 border ${s.color}`}>{s.icon}</div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{s.label}</p>
              <p className="text-xl font-black text-white leading-none">{s.value}</p>
            </motion.div>
          ))}
        </div>
      )}

      {/* Tabela */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <h2 className="font-black text-white">
            {filtered.length} rifa(s) no período
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            {PERIOD_LABELS[period]}{period === "custom" && fromDate ? ` · ${fromDate} → ${toDate || "hoje"}` : ""}
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"/>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-16 gap-3 text-slate-500">
            <BarChart3 size={36} className="text-slate-700"/>
            <p className="font-medium">Nenhuma venda encontrada neste período.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-950/40">
                <tr>
                  {[
                    "Código", "Rifa", ...(isAdmin ? ["Criador"] : []),
                    "Cotas", "Pedidos", "Comissão", "Receita Total", "Comissão", "Lucro Criador", "Período"
                  ].map(h => (
                    <th key={h} className="px-4 py-3.5 text-left text-[9px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {filtered.map((r) => (
                  <tr key={r.raffleId} className="hover:bg-slate-800/20 transition-all">
                    <td className="px-4 py-4">
                      <span className="text-[10px] font-black text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded-lg border border-indigo-500/20 whitespace-nowrap">
                        {r.raffleCode}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <Link to={`/dashboard/raffle/${r.raffleId}`}
                        className="text-sm font-medium text-white hover:text-indigo-400 transition-colors line-clamp-1 max-w-[180px] block">
                        {r.title}
                      </Link>
                    </td>
                    {isAdmin && (
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-indigo-600/10 flex items-center justify-center text-indigo-400 text-xs font-black shrink-0">
                            {r.creatorName.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm text-slate-300 whitespace-nowrap">{r.creatorName}</span>
                        </div>
                      </td>
                    )}
                    <td className="px-4 py-4 text-sm font-bold text-white text-center">{r.qtdSold}</td>
                    <td className="px-4 py-4 text-sm text-slate-400 text-center">{r.qtdOrders}</td>
                    <td className="px-4 py-4">
                      <span className="text-xs font-black text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded-lg">
                        {r.commissionPct}%
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm font-black text-emerald-400 whitespace-nowrap">
                      R$ {fmt(r.totalRevenue)}
                    </td>
                    <td className="px-4 py-4 text-sm font-black text-indigo-400 whitespace-nowrap">
                      R$ {fmt(r.commission)}
                    </td>
                    <td className="px-4 py-4 text-sm font-black text-amber-400 whitespace-nowrap">
                      R$ {fmt(r.creatorProfit)}
                    </td>
                    <td className="px-4 py-4 text-xs text-slate-500 whitespace-nowrap">
                      {r.firstSaleAt?.toLocaleDateString("pt-BR")}
                      {r.lastSaleAt && r.lastSaleAt !== r.firstSaleAt && (
                        <> → {r.lastSaleAt.toLocaleDateString("pt-BR")}</>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>

              {/* Linha de totais */}
              {filtered.length > 1 && (
                <tfoot className="bg-slate-950/60 border-t-2 border-slate-700">
                  <tr>
                    <td colSpan={isAdmin ? 5 : 4} className="px-4 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                      TOTAL ({filtered.length} rifas)
                    </td>
                    <td/>
                    <td className="px-4 py-4 text-sm font-black text-emerald-400 whitespace-nowrap">R$ {fmt(totalRevenue)}</td>
                    <td className="px-4 py-4 text-sm font-black text-indigo-400 whitespace-nowrap">R$ {fmt(totalComm)}</td>
                    <td className="px-4 py-4 text-sm font-black text-amber-400 whitespace-nowrap">R$ {fmt(totalProfit)}</td>
                    <td/>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
