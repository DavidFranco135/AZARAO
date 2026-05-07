import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft, Trophy, Users, DollarSign, Ticket,
  Calendar, TrendingUp, Hash, CheckCircle2, Clock,
  Shuffle, Loader2, Eye, BarChart3, FlaskConical, MessageCircle,
} from "lucide-react";
import WhatsAppModal from "../components/WhatsAppModal";
import UserDetailsModal from "../components/UserDetailsModal";
import { fetchUserProfile } from "../lib/firebaseService";
import { Raffle, Order, User } from "../types";
import {
  getRaffle, getRaffleOrders, performDraw, scheduleDrawCountdown, tsToDate,
} from "../lib/firebaseService";
import { DrawAnimation } from "./DrawLive";

export default function RaffleManage({ user }: { user: User | null }) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [raffle,  setRaffle]  = useState<Raffle | null>(null);
  const [orders,  setOrders]  = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawing, setDrawing] = useState(false);
  const [drawResult, setDrawResult] = useState<{ number: number; name: string } | null>(null);
  const [selectedUser, setSelectedUser] = useState<(User & { createdAt?: unknown }) | null>(null);
  const [wpData, setWpData] = useState<{ user: User | null; templateType: "winner"|"payment"|"reminder"|"custom"; order?: Order } | null>(null);
  const [countdown,    setCountdown]    = useState<number | null>(null);
  const [drawLiveData, setDrawLiveData] = useState<{ winnerNumber: number; winnerName: string; soldNumbers: number[] } | null>(null);
  const countdownRef  = useRef<ReturnType<typeof setInterval> | null>(null);

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
    if (!confirm(`Iniciar contagem regressiva de 1 minuto para "${raffle.title}"?\n\nCompartilhe o link ao vivo com os participantes antes de confirmar!`)) return;

    // Salva timestamp no Firestore para sincronizar a página ao vivo
    await scheduleDrawCountdown(raffle.id);

    // Inicia contador local
    const startMs = Date.now();
    const getRemaining = () => Math.max(0, 60 - Math.floor((Date.now() - startMs) / 1000));

    setCountdown(getRemaining());

    countdownRef.current = setInterval(async () => {
      const rem = getRemaining();
      setCountdown(rem);

      if (rem <= 0) {
        if (countdownRef.current) clearInterval(countdownRef.current);
        setCountdown(null);
        setDrawing(true);
        try {
          const result = await performDraw(raffle.id);
          setDrawLiveData({
            winnerNumber: result.winnerNumber,
            winnerName:   result.winnerName,
            soldNumbers:  raffle.soldNumbers,
          });
        } catch (e: unknown) {
          alert((e as Error).message ?? "Erro ao sortear.");
          await load();
        } finally {
          setDrawing(false);
        }
      }
    }, 500);
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
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl sm:text-4xl font-black text-white">{raffle.title}</h1>
              {(raffle as any).raffleCode && (
                <span className="text-xs font-black text-indigo-400 bg-indigo-500/10 px-3 py-1.5 rounded-xl border border-indigo-500/20">
                  #{(raffle as any).raffleCode}
                </span>
              )}
            </div>
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
            <button
              onClick={async () => {
                if (raffle.winnerId) {
                  const u = await fetchUserProfile(raffle.winnerId);
                  setWpData({ user: u, templateType: "winner" });
                }
              }}
              className="flex items-center gap-2 bg-[#25D366]/20 hover:bg-[#25D366]/30 text-[#25D366] border border-[#25D366]/30 px-4 py-2 rounded-xl text-xs font-black transition-all ml-auto mt-2 sm:mt-0"
            >
              <MessageCircle size={14} />
              WhatsApp Ganhador
            </button>
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
                          <button onClick={async () => { const { fetchUserProfile } = await import("../lib/firebaseService"); const u = await fetchUserProfile(o.userId); if (u) setSelectedUser(u); }} className="text-sm font-medium text-white hover:text-indigo-400 transition-colors">{o.userName ?? "—"}</button>
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
                        <button
                          onClick={async () => {
                            const u = await fetchUserProfile(o.userId);
                            setWpData({ user: u, templateType: o.status === "paid" ? "payment" : "custom", order: o });
                          }}
                          className="p-1.5 text-slate-500 hover:text-[#25D366] bg-slate-800 rounded-lg border border-slate-700 transition-all mb-2 block" title="WhatsApp"
                        >
                          <MessageCircle size={13} />
                        </button>
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

      {/* Countdown Modal */}
      {countdown !== null && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-2xl">
          <div className="bg-slate-900 w-full max-w-sm rounded-[2rem] border border-slate-800 shadow-2xl p-8 text-center space-y-5">
            <div className="text-4xl">⏳</div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Sorteio começando em</p>
            <div className="relative w-36 h-36 mx-auto flex items-center justify-center">
              <svg viewBox="0 0 180 180" className="absolute inset-0 w-full h-full" style={{ transform: "rotate(-90deg)" }}>
                <circle cx="90" cy="90" r="78" fill="none" stroke="#1e1e2e" strokeWidth="10"/>
                <circle cx="90" cy="90" r="78" fill="none" stroke="#6366f1" strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 78}`}
                  strokeDashoffset={`${2 * Math.PI * 78 * (1 - countdown / 60)}`}
                  style={{ transition: "stroke-dashoffset 0.8s linear" }}
                />
              </svg>
              <div className="relative z-10 text-center">
                <p className="text-5xl font-black text-white tabular-nums leading-none">
                  {String(countdown).padStart(2,"0")}
                </p>
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">seg</p>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold text-white line-clamp-1">{raffle.title}</p>
              <a href={`/draw/${raffle.id}`} target="_blank"
                className="text-xs text-indigo-400 hover:underline font-bold flex items-center justify-center gap-1">
                📡 Abrir link ao vivo
              </a>
            </div>
            <button
              onClick={() => { if (countdownRef.current) clearInterval(countdownRef.current); setCountdown(null); }}
              className="text-xs text-slate-500 hover:text-red-400 font-bold uppercase tracking-widest transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Draw Animation */}
      {drawLiveData && (
        <DrawAnimation
          soldNumbers={drawLiveData.soldNumbers.length > 0 ? drawLiveData.soldNumbers : [drawLiveData.winnerNumber]}
          winnerNumber={drawLiveData.winnerNumber}
          winnerName={drawLiveData.winnerName}
          totalNumbers={raffle?.totalNumbers}
          onComplete={async () => {
            setDrawResult({ number: drawLiveData.winnerNumber, name: drawLiveData.winnerName });
            setDrawLiveData(null);
            await load();
          }}
        />
      )}

      {selectedUser && (
        <UserDetailsModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
        />
      )}

      {selectedUser && (
        <UserDetailsModal user={selectedUser} onClose={() => setSelectedUser(null)} />
      )}

      {/* WhatsApp Modal */}
      {wpData && (
        <WhatsAppModal
          onClose={() => setWpData(null)}
          targetUser={wpData.user}
          raffle={raffle}
          order={wpData.order}
          defaultTemplate={wpData.templateType}
        />
      )}

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
