import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft, Trophy, Users, DollarSign, Ticket,
  Calendar, TrendingUp, Hash, CheckCircle2, Clock,
  Shuffle, Loader2, Eye, BarChart3, FlaskConical,
} from "lucide-react";
import { Raffle, Order, User } from "../types";
import {
  getRaffle, getRaffleOrders, performDraw, tsToDate,
} from "../lib/firebaseService";

export default function RaffleManage({ user }: { user: User | null }) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [raffle,  setRaffle]  = useState<Raffle | null>(null);
  const [orders,  setOrders]  = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawing, setDrawing] = useState(false);
  const [drawResult, setDrawResult] = useState<{ number: number; name: string } | null>(null);

  const load = async () => {
    if (!id) return;
    const [r, o] = await Promise.all([getRaffle(id), getRaffleOrders(id)]);
    setRaffle(r);
    setOrders(o);
    setLoading(false);
  };

  useEffect(() => { load(); }, [id]);

  const handleDraw = async () => {
    if (!raffle) return;
    if (orders.length === 0) { alert("Nenhum número vendido ainda."); return; }
    if (!confirm(`Realizar o sorteio de "${raffle.title}"? Esta ação é irreversível.`)) return;
    setDrawing(true);
    try {
      const result = await performDraw(raffle.id);
      setDrawResult({ number: result.winnerNumber, name: result.winnerName });
      await load();
    } catch (e: unknown) {
      alert((e as Error).message ?? "Erro ao sortear.");
    } finally {
      setDrawing(false);
    }
  };

  if (loading)
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );

  if (!raffle)
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <Ticket size={48} className="text-slate-700" />
        <p className="text-slate-400 font-bold">Rifa não encontrada.</p>
        <Link to="/dashboard" className="text-indigo-400 hover:underline font-bold">← Dashboard</Link>
      </div>
    );

  // ── métricas ────────────────────────────────────────────────────────
  const totalArrecadado = orders.reduce((s, o) => s + o.totalAmount, 0);
  const comissao        = totalArrecadado * (raffle.commissionPercentage / 100);
  const lucro           = totalArrecadado - comissao;
  const progress        = raffle.totalNumbers > 0
    ? (raffle.soldNumbers.length / raffle.totalNumbers) * 100 : 0;

  const brl = (n: number) =>
    n.toLocaleString("pt-BR", { minimumFractionDigits: 2 });

  // Mapa número → comprador
  const numberOwner: Record<number, string> = {};
  orders.forEach((o) => {
    o.numbers.forEach((n) => { numberOwner[n] = o.userName ?? "—"; });
  });

  const img = raffle.images?.[0] ?? `https://picsum.photos/seed/${raffle.id}/800/400`;

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 space-y-8">

      {/* Back */}
      <button onClick={() => navigate("/dashboard")}
        className="flex items-center gap-2 text-slate-500 hover:text-white font-bold transition-all group">
        <div className="bg-slate-900 p-2 rounded-lg border border-slate-800 group-hover:border-slate-600">
          <ArrowLeft size={16} />
        </div>
        <span className="text-sm uppercase tracking-widest">Dashboard</span>
      </button>

      {/* Header da rifa */}
      <div className="bg-slate-900 rounded-[2.5rem] border border-slate-800 overflow-hidden">
        <div className="relative h-48 sm:h-64">
          <img src={img} alt={raffle.title} className="w-full h-full object-cover opacity-60" referrerPolicy="no-referrer" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent" />
          <div className="absolute bottom-0 left-0 p-8">
            <div className="flex items-center gap-3 mb-2">
              {raffle.isTest && (
                <span className="flex items-center gap-1.5 bg-amber-500/20 text-amber-400 text-[10px] font-black px-3 py-1 rounded-lg border border-amber-500/20 uppercase tracking-widest">
                  <FlaskConical size={11} /> Teste
                </span>
              )}
              <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg border ${
                raffle.status === "active"
                  ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/20"
                  : "bg-slate-800 text-slate-400 border-slate-700"
              }`}>
                {raffle.status === "active" ? "● Ativa" : "● Encerrada"}
              </span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white">{raffle.title}</h1>
            <div className="flex items-center gap-3 mt-2 text-slate-400 text-sm">
              <Calendar size={14} className="text-indigo-400" />
              <span>Sorteio: {tsToDate(raffle.drawDate).toLocaleDateString("pt-BR")}</span>
              <span className="text-slate-600">·</span>
              <span>R$ {raffle.pricePerNumber.toFixed(2)} / cota</span>
            </div>
          </div>

          {/* Botão sortear */}
          {raffle.status === "active" && (
            <div className="absolute bottom-6 right-6 sm:bottom-8 sm:right-8">
              <button
                onClick={handleDraw}
                disabled={drawing}
                className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-400 text-slate-900 px-5 py-3 rounded-2xl font-black text-sm shadow-xl transition-all disabled:opacity-50"
              >
                {drawing ? <Loader2 size={16} className="animate-spin" /> : <Shuffle size={16} />}
                {drawing ? "Sorteando..." : "Realizar Sorteio"}
              </button>
            </div>
          )}
        </div>

        {/* Winner banner */}
        {raffle.status === "finished" && raffle.winnerNumber && (
          <div className="p-6 bg-gradient-to-r from-yellow-500/20 to-amber-500/10 border-t border-yellow-500/20 flex items-center gap-4">
            <div className="w-14 h-14 bg-yellow-500/20 rounded-2xl flex items-center justify-center shrink-0">
              <Trophy size={28} className="text-yellow-400" />
            </div>
            <div>
              <p className="text-[10px] font-black text-yellow-500 uppercase tracking-widest mb-0.5">
                🏆 Sorteado em {tsToDate(raffle.drawnAt).toLocaleDateString("pt-BR")}
              </p>
              <p className="text-xl font-black text-white">
                Número <span className="text-yellow-400">#{String(raffle.winnerNumber).padStart(3, "0")}</span>
                {" "}— {raffle.winnerName}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Cards de métricas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard icon={<DollarSign size={20} />}  label="Arrecadado"      value={`R$ ${brl(totalArrecadado)}`} color="bg-emerald-500" />
        <MetricCard icon={<TrendingUp size={20} />}  label="Seu Lucro"       value={`R$ ${brl(lucro)}`}           color="bg-indigo-600" />
        <MetricCard icon={<BarChart3 size={20} />}   label="Comissão"        value={`R$ ${brl(comissao)}`}        color="bg-amber-500" />
        <MetricCard icon={<Users size={20} />}       label="Participantes"   value={orders.length.toString()}     color="bg-slate-700" />
      </div>

      {/* Progresso */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm font-black text-white">Cotas vendidas</span>
          <span className="text-sm font-black text-white">
            {raffle.soldNumbers.length} / {raffle.totalNumbers} ({progress.toFixed(0)}%)
          </span>
        </div>
        <div className="h-4 bg-slate-950 rounded-full border border-slate-800 p-0.5">
          <div
            className="h-full bg-gradient-to-r from-indigo-600 to-indigo-400 rounded-full transition-all duration-700"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* ── Tabela de compradores ─────────────────────────────── */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
          <div className="p-5 border-b border-slate-800 flex items-center gap-3">
            <div className="w-9 h-9 bg-indigo-600/10 rounded-xl flex items-center justify-center text-indigo-400 border border-indigo-500/20">
              <Users size={17} />
            </div>
            <h2 className="font-black text-white">Compradores ({orders.length})</h2>
          </div>

          {orders.length === 0 ? (
            <div className="p-10 text-center">
              <Users size={32} className="text-slate-700 mx-auto mb-3" />
              <p className="text-slate-500 font-medium text-sm">Nenhuma venda ainda.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-950/40">
                  <tr>
                    {["Comprador", "Cotas", "Valor", "Status"].map((h) => (
                      <th key={h} className="px-5 py-3 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {orders.map((o) => (
                    <tr key={o.id} className="hover:bg-slate-800/20 transition-all">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-indigo-600/20 flex items-center justify-center text-indigo-400 text-xs font-black shrink-0">
                            {(o.userName ?? "?").charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm font-medium text-white">{o.userName ?? "—"}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-1 max-w-[140px]">
                          {o.numbers.slice(0, 5).map((n) => (
                            <span key={n} className={`text-[10px] font-black px-1.5 py-0.5 rounded border ${
                              raffle.winnerNumber === n
                                ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                                : "bg-slate-950 text-slate-400 border-slate-800"
                            }`}>
                              #{String(n).padStart(3,"0")}
                            </span>
                          ))}
                          {o.numbers.length > 5 && (
                            <span className="text-[10px] font-black text-slate-500 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                              +{o.numbers.length - 5}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm font-bold text-white">
                        R$ {o.totalAmount.toFixed(2)}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`flex items-center gap-1.5 text-[10px] font-black uppercase w-fit px-2 py-1 rounded-lg border ${
                          o.status === "paid"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                        }`}>
                          {o.status === "paid" ? <CheckCircle2 size={11}/> : <Clock size={11}/>}
                          {o.status === "paid" ? "Pago" : "Pendente"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Grid de números com dono ──────────────────────────── */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
          <div className="p-5 border-b border-slate-800 flex items-center gap-3">
            <div className="w-9 h-9 bg-indigo-600/10 rounded-xl flex items-center justify-center text-indigo-400 border border-indigo-500/20">
              <Hash size={17} />
            </div>
            <h2 className="font-black text-white">Números Vendidos</h2>
          </div>

          {raffle.soldNumbers.length === 0 ? (
            <div className="p-10 text-center">
              <Ticket size={32} className="text-slate-700 mx-auto mb-3" />
              <p className="text-slate-500 font-medium text-sm">Nenhum número vendido ainda.</p>
            </div>
          ) : (
            <div className="p-5 max-h-[480px] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 gap-2">
                {raffle.soldNumbers
                  .slice()
                  .sort((a, b) => a - b)
                  .map((n) => (
                    <div
                      key={n}
                      className={`flex items-center justify-between px-4 py-2.5 rounded-xl border transition-all ${
                        raffle.winnerNumber === n
                          ? "bg-yellow-500/10 border-yellow-500/30"
                          : "bg-slate-950 border-slate-800"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {raffle.winnerNumber === n && (
                          <Trophy size={14} className="text-yellow-400 shrink-0" />
                        )}
                        <span className={`text-sm font-black ${
                          raffle.winnerNumber === n ? "text-yellow-400" : "text-indigo-400"
                        }`}>
                          #{String(n).padStart(3, "0")}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-indigo-600/20 flex items-center justify-center text-indigo-400 text-[10px] font-black">
                          {(numberOwner[n] ?? "?").charAt(0).toUpperCase()}
                        </div>
                        <span className="text-xs font-medium text-slate-300">
                          {numberOwner[n] ?? "—"}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Link ver página pública */}
      <div className="flex justify-center">
        <Link
          to={`/raffle/${raffle.id}`}
          className="flex items-center gap-2 bg-slate-900 border border-slate-800 hover:border-indigo-500/40 text-slate-400 hover:text-white px-6 py-3 rounded-2xl font-bold text-sm transition-all"
        >
          <Eye size={16} />
          Ver página pública da rifa
        </Link>
      </div>

      {/* Draw result modal */}
      {drawResult && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xl">
          <div className="bg-slate-900 w-full max-w-md rounded-[2.5rem] p-10 text-center space-y-6 border border-yellow-500/30 shadow-2xl">
            <div className="w-24 h-24 bg-yellow-500/20 rounded-3xl flex items-center justify-center mx-auto">
              <Trophy size={52} className="text-yellow-400" />
            </div>
            <div>
              <p className="text-[10px] font-black text-yellow-500 uppercase tracking-widest mb-2">
                🎉 Sorteio Realizado!
              </p>
              <p className="text-5xl font-black text-yellow-400 my-4">
                #{String(drawResult.number).padStart(3, "0")}
              </p>
              <p className="text-2xl font-black text-white">{drawResult.name}</p>
            </div>
            <button
              onClick={() => setDrawResult(null)}
              className="w-full bg-yellow-500 hover:bg-yellow-400 text-slate-900 py-4 rounded-2xl font-black text-lg transition-all"
            >
              FECHAR
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function MetricCard({ icon, label, value, color }: {
  icon: React.ReactNode; label: string; value: string; color: string;
}) {
  return (
    <div className="bg-slate-900/50 p-5 rounded-2xl border border-slate-800 space-y-4 hover:border-slate-700 transition-all">
      <div className={`${color} w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg`}>
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{label}</p>
        <p className="text-lg sm:text-xl font-black text-white leading-none">{value}</p>
      </div>
    </div>
  );
}
