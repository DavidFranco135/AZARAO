import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import {
  TrendingUp, Users, DollarSign, ChevronRight, PlusCircle,
  Ticket, BarChart3, Calendar, Trash2, Eye, Trophy,
  FlaskConical, Shuffle, Loader2, Radio, Edit2,
} from "lucide-react";
import { DrawAnimation } from "./DrawLive";
import { User, DashboardRaffle } from "../types";
import {
  getCreatorDashboard, deleteRaffle, performDraw, scheduleDrawCountdown, tsToDate,
} from "../lib/firebaseService";

export default function Dashboard({ user }: { user: User | null }) {
  const [raffles, setRaffles] = useState<DashboardRaffle[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [drawing, setDrawing] = useState<string | null>(null);
  const [drawLiveData, setDrawLiveData] = useState<{ raffle: DashboardRaffle } | null>(null);
  const [countdown, setCountdown] = useState<{ raffleId: string; raffleTitle: string; seconds: number } | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [drawResult, setDrawResult] = useState<{
    raffleTitle: string;
    winnerNumber: number;
    winnerName: string;
  } | null>(null);

  const load = async () => {
    if (!user) return;
    const data = await getCreatorDashboard(user.id);
    setRaffles(data);
    setLoading(false);
  };

  // Recarrega sem interferir no countdown ativo
  const safeLoad = async () => {
    if (countdown !== null) return; // não recarrega durante contagem
    await load();
  };

  useEffect(() => { load(); }, [user]);

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir esta rifa? Ação irreversível.")) return;
    setDeleting(id);
    await deleteRaffle(id);
    setRaffles((p) => p.filter((r) => r.id !== id));
    setDeleting(null);
  };

  const handleDraw = async (raffle: DashboardRaffle) => {
    if (raffle.soldNumbers.length === 0) {
      alert("Nenhum número vendido ainda. Não é possível realizar o sorteio.");
      return;
    }
    if (!confirm(`Iniciar contagem regressiva de 1 minuto para o sorteio de "${raffle.title}"?\n\nCompartilhe o link ao vivo antes de confirmar!`)) return;

    // Salva no Firestore para sincronizar com página ao vivo
    await scheduleDrawCountdown(raffle.id);

    // Usa timestamp real para sincronizar com viewers
    const startMs = Date.now();
    const getRemaining = () => Math.max(0, 60 - Math.floor((Date.now() - startMs) / 1000));

    setCountdown({ raffleId: raffle.id, raffleTitle: raffle.title, seconds: getRemaining() });

    countdownRef.current = setInterval(async () => {
      const rem = getRemaining();
      setCountdown((prev) => prev ? { ...prev, seconds: rem } : null);

      if (rem <= 0) {
        if (countdownRef.current) clearInterval(countdownRef.current);
        setCountdown(null);
        setDrawing(raffle.id);
        try {
          const result = await performDraw(raffle.id);
          // Mostra animação — load() só é chamado quando animação terminar (onComplete)
          setDrawLiveData({
            raffle: {
              ...raffle,
              winnerNumber: result.winnerNumber,
              winnerName: result.winnerName,
              status: "finished"
            }
          });
        } catch (err: unknown) {
          alert((err as Error).message ?? "Erro ao realizar o sorteio.");
          await load();
        } finally {
          setDrawing(null);
        }
      }
    }, 500); // 500ms para precisão
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
    <div className="max-w-7xl mx-auto px-4 py-10 space-y-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Visão <span className="text-indigo-500 italic">Estratégica</span>
          </h1>
          <p className="text-slate-500 font-medium">
            Olá, <span className="text-white font-bold">{user?.name}</span>
          </p>
        </div>
        {(user?.role === "creator" || user?.role === "admin") && (
          <Link
            to="/create-raffle"
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-3 shadow-xl shadow-indigo-600/20 transition-all hover:-translate-y-0.5 self-start sm:self-auto"
          >
            <PlusCircle size={20} />
            Novo Sorteio
          </Link>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={<DollarSign size={20} />} label="Volume Total"
          value={`R$ ${totalGeral.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`} color="bg-emerald-500" />
        <StatCard icon={<TrendingUp size={20} />} label="Seu Lucro"
          value={`R$ ${lucroTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`} color="bg-indigo-600" />
        <StatCard icon={<Users size={20} />} label="Taxas Plataforma"
          value={`R$ ${comissaoTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`} color="bg-slate-700" />
        <StatCard icon={<Ticket size={20} />} label="Rifas Ativas"
          value={raffles.filter((r) => r.status === "active").length.toString()} color="bg-slate-800" />
      </div>

      {/* Table */}
      <div className="bg-slate-900/50 rounded-[2rem] border border-slate-800 shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-indigo-600/10 rounded-xl flex items-center justify-center text-indigo-400 border border-indigo-500/20">
              <BarChart3 size={18} />
            </div>
            <h2 className="text-lg font-bold text-white">Minhas Campanhas</h2>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest hidden sm:block">
              Ao Vivo
            </span>
          </div>
        </div>

        {/* Desktop */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-950/30">
              <tr>
                {["Rifa", "Modo", "Status", "Sorteio", "Cotas", "Volume", "Lucro", ""].map((h) => (
                  <th key={h} className="px-5 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {raffles.map((raffle) => {
                const img = raffle.images?.[0] ?? `https://picsum.photos/seed/${raffle.id}/200`;
                const progress = raffle.totalNumbers > 0
                  ? (raffle.soldNumbers.length / raffle.totalNumbers) * 100 : 0;
                return (
                  <tr key={raffle.id} className="group hover:bg-slate-800/20 transition-all">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl overflow-hidden bg-slate-800 border border-slate-700 shrink-0">
                          <img src={img} alt={raffle.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </div>
                        <div>
                          <p className="font-bold text-white text-sm group-hover:text-indigo-400 transition-colors line-clamp-1 max-w-[160px]">
                            {raffle.title}
                          </p>
                          {raffle.winnerNumber && (
                            <p className="text-[10px] text-yellow-400 font-black flex items-center gap-1">
                              <Trophy size={10} /> #{raffle.winnerNumber} — {raffle.winnerName}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      {raffle.isTest ? (
                        <span className="flex items-center gap-1.5 text-[10px] font-black text-amber-400 bg-amber-500/10 px-2 py-1 rounded-lg border border-amber-500/20 w-fit">
                          <FlaskConical size={11} /> Teste
                        </span>
                      ) : (
                        <span className="text-[10px] font-black text-[#00b1ea] bg-[#00b1ea]/10 px-2 py-1 rounded-lg border border-[#00b1ea]/20 w-fit">
                          MP Real
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${
                        raffle.status === "active"
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : "bg-slate-800 text-slate-500 border-slate-700"
                      }`}>
                        {raffle.status === "active" ? "Ativa" : "Finalizada"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <Calendar size={13} className="text-indigo-400" />
                        <span className="text-xs">{tsToDate(raffle.drawDate).toLocaleDateString("pt-BR")}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="space-y-1 min-w-[70px]">
                        <div className="flex justify-between text-[10px] text-slate-500 font-bold">
                          <span>{raffle.soldNumbers.length}</span>
                          <span>{raffle.totalNumbers}</span>
                        </div>
                        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${progress}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-bold text-white text-sm">R$ {raffle.totalArrecadado.toLocaleString("pt-BR")}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-black text-emerald-400 text-sm">R$ {raffle.lucro.toLocaleString("pt-BR")}</p>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <Link to={`/raffle/${raffle.id}`} className="p-2 text-slate-500 hover:text-white bg-slate-800 rounded-lg border border-slate-700 transition-all" title="Ver rifa">
                          <Eye size={13} />
                        </Link>
                        {raffle.status === "active" && (
                          <>
                            <Link
                              to={`/draw/${raffle.id}`}
                              target="_blank"
                              className="p-2 text-slate-500 hover:text-indigo-400 bg-slate-800 rounded-lg border border-slate-700 transition-all"
                              title="Ver página ao vivo"
                            >
                              <Radio size={13} />
                            </Link>
                            <button
                              onClick={() => handleDraw(raffle)}
                              disabled={drawing === raffle.id}
                              className="p-2 text-slate-500 hover:text-yellow-400 bg-slate-800 rounded-lg border border-slate-700 transition-all disabled:opacity-40"
                              title="Realizar Sorteio"
                            >
                              {drawing === raffle.id
                                ? <Loader2 size={13} className="animate-spin" />
                                : <Shuffle size={13} />
                              }
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleDelete(raffle.id)}
                          disabled={deleting === raffle.id}
                          className="p-2 text-slate-500 hover:text-red-400 bg-slate-800 rounded-lg border border-slate-700 transition-all disabled:opacity-40"
                          title="Excluir"
                        >
                          <Trash2 size={13} />
                        </button>
                        <Link to={`/raffle/${raffle.id}`} className="hidden xl:flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-white bg-slate-800 px-3 py-2 rounded-xl transition-all border border-slate-700">
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
                  <td colSpan={8} className="px-6 py-24 text-center">
                    <div className="max-w-xs mx-auto space-y-4">
                      <div className="w-16 h-16 bg-indigo-600/5 rounded-2xl flex items-center justify-center mx-auto text-indigo-400/20 border-2 border-dashed border-indigo-400/20">
                        <Ticket size={32} />
                      </div>
                      <p className="text-white font-bold">Nenhuma campanha ainda</p>
                      <Link to="/create-raffle" className="inline-block bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-xl font-bold transition-all">
                        Criar Sorteio
                      </Link>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile */}
        <div className="md:hidden divide-y divide-slate-800/50">
          {raffles.length === 0 ? (
            <div className="p-8 text-center space-y-4">
              <Ticket size={32} className="text-slate-700 mx-auto" />
              <Link to="/create-raffle" className="inline-block bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm">Criar Sorteio</Link>
            </div>
          ) : raffles.map((raffle) => {
            const img = raffle.images?.[0] ?? `https://picsum.photos/seed/${raffle.id}/200`;
            const progress = raffle.totalNumbers > 0 ? (raffle.soldNumbers.length / raffle.totalNumbers) * 100 : 0;
            return (
              <div key={raffle.id} className="p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-800 shrink-0">
                    <img src={img} alt={raffle.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-white text-sm line-clamp-1">{raffle.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-[10px] font-black ${raffle.status === "active" ? "text-emerald-400" : "text-slate-500"}`}>
                        {raffle.status === "active" ? "● Ativa" : "● Encerrada"}
                      </span>
                      {raffle.isTest && <span className="text-[10px] text-amber-400 font-black">TESTE</span>}
                    </div>
                    {raffle.winnerNumber && (
                      <p className="text-[10px] text-yellow-400 font-black mt-0.5">
                        🏆 #{raffle.winnerNumber} — {raffle.winnerName}
                      </p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-slate-950 rounded-xl p-2.5 text-center border border-slate-800">
                    <p className="text-[9px] text-slate-600 font-black uppercase mb-0.5">Volume</p>
                    <p className="text-xs font-black text-white">R$ {raffle.totalArrecadado.toLocaleString("pt-BR")}</p>
                  </div>
                  <div className="bg-slate-950 rounded-xl p-2.5 text-center border border-slate-800">
                    <p className="text-[9px] text-slate-600 font-black uppercase mb-0.5">Lucro</p>
                    <p className="text-xs font-black text-emerald-400">R$ {raffle.lucro.toLocaleString("pt-BR")}</p>
                  </div>
                  <div className="bg-slate-950 rounded-xl p-2.5 text-center border border-slate-800">
                    <p className="text-[9px] text-slate-600 font-black uppercase mb-0.5">Cotas</p>
                    <p className="text-xs font-black text-white">{raffle.soldNumbers.length}/{raffle.totalNumbers}</p>
                  </div>
                </div>
                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${progress}%` }} />
                </div>
                <div className="flex gap-2">
                  <Link to={`/raffle/${raffle.id}`} className="flex-1 flex items-center justify-center gap-2 bg-slate-800 text-white py-2.5 rounded-xl text-xs font-bold border border-slate-700">
                    <Eye size={13} /> Ver
                  </Link>
                  {raffle.status === "active" && (
                    <button
                      onClick={() => handleDraw(raffle)}
                      disabled={drawing === raffle.id}
                      className="flex-1 flex items-center justify-center gap-2 bg-yellow-500/10 text-yellow-400 py-2.5 rounded-xl text-xs font-bold border border-yellow-500/20 disabled:opacity-40"
                    >
                      {drawing === raffle.id ? <Loader2 size={13} className="animate-spin" /> : <Shuffle size={13} />}
                      Sortear
                    </button>
                  )}
                  <button onClick={() => handleDelete(raffle.id)} disabled={deleting === raffle.id} className="p-2.5 bg-slate-800 text-red-400 rounded-xl border border-slate-700 disabled:opacity-40">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Countdown Modal */}
      {countdown && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-2xl">
          <div className="bg-slate-900 w-full max-w-sm sm:max-w-md rounded-[2rem] border border-slate-800 shadow-2xl p-6 sm:p-10 text-center space-y-5">
            <div className="text-4xl">⏳</div>
            <div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">
                Sorteio começando em
              </p>
              {/* Contador com barra de progresso */}
              <div className="relative w-36 h-36 sm:w-44 sm:h-44 mx-auto flex items-center justify-center">
                <svg viewBox="0 0 180 180" className="absolute inset-0 w-full h-full -rotate-90">
                  <circle cx="90" cy="90" r="78" fill="none" stroke="#1e1e2e" strokeWidth="10"/>
                  <circle
                    cx="90" cy="90" r="78"
                    fill="none" stroke="#6366f1" strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 78}`}
                    strokeDashoffset={`${2 * Math.PI * 78 * (1 - countdown.seconds / 60)}`}
                    style={{ transition: "stroke-dashoffset 0.8s ease" }}
                  />
                </svg>
                <div className="relative z-10 text-center">
                  <p className="text-5xl sm:text-6xl font-black text-white leading-none tabular-nums">
                    {String(countdown.seconds).padStart(2,"0")}
                  </p>
                  <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1">seg</p>
                </div>
              </div>
            </div>
            <div className="space-y-1.5 px-2">
              <p className="text-sm font-bold text-white line-clamp-1">{countdown.raffleTitle}</p>
              <p className="text-xs text-indigo-300 font-medium leading-relaxed">
                📡 Compartilhe o link ao vivo com seus participantes agora!
              </p>
            </div>
            <button
              onClick={() => {
                if (countdownRef.current) clearInterval(countdownRef.current);
                setCountdown(null);
              }}
              className="text-xs text-slate-500 hover:text-red-400 font-bold uppercase tracking-widest transition-colors"
            >
              Cancelar sorteio
            </button>
          </div>
        </div>
      )}

      {/* Live Draw Animation */}
      {drawLiveData && drawLiveData.raffle.soldNumbers.length > 0 && drawLiveData.raffle.winnerNumber && (
        <DrawAnimation
          soldNumbers={drawLiveData.raffle.soldNumbers}
          winnerNumber={drawLiveData.raffle.winnerNumber}
          winnerName={drawLiveData.raffle.winnerName ?? "Ganhador"}
          totalNumbers={drawLiveData.raffle.totalNumbers}
          onComplete={async () => {
            setDrawResult({
              raffleTitle: drawLiveData.raffle.title,
              winnerNumber: drawLiveData.raffle.winnerNumber!,
              winnerName: drawLiveData.raffle.winnerName ?? "Ganhador",
            });
            setDrawLiveData(null);
            await load(); // atualiza lista APÓS animação terminar
          }}
        />
      )}

      {/* Draw Result Modal */}
      {drawResult && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xl">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-slate-900 w-full max-w-md rounded-[2.5rem] p-10 text-center space-y-6 border border-yellow-500/30 shadow-2xl shadow-yellow-500/10"
          >
            <div className="w-24 h-24 bg-yellow-500/20 rounded-3xl flex items-center justify-center mx-auto">
              <Trophy size={52} className="text-yellow-400" />
            </div>
            <div>
              <p className="text-[10px] font-black text-yellow-500 uppercase tracking-widest mb-2">🎉 Sorteio Realizado!</p>
              <h2 className="text-2xl font-black text-white mb-1">{drawResult.raffleTitle}</h2>
              <p className="text-slate-400 text-sm">Número Sorteado:</p>
              <p className="text-5xl font-black text-yellow-400 my-3">
                #{String(drawResult.winnerNumber).padStart(3, "0")}
              </p>
              <p className="text-xl font-black text-white">{drawResult.winnerName}</p>
            </div>
            <button
              onClick={() => setDrawResult(null)}
              className="w-full bg-yellow-500 hover:bg-yellow-400 text-slate-900 py-4 rounded-2xl font-black text-lg transition-all"
            >
              FECHAR
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <motion.div whileHover={{ y: -4 }} className="bg-slate-900/50 p-5 sm:p-7 rounded-[1.75rem] border border-slate-800 flex flex-col justify-between group hover:border-indigo-500/30 transition-all">
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
