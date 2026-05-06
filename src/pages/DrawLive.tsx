import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  Trophy, Ticket, Users, Calendar, Share2,
  ExternalLink, Loader2, Eye,
} from "lucide-react";
import { Raffle, Order } from "../types";
import { getRaffle, getRaffleOrders, tsToDate } from "../lib/firebaseService";

export default function DrawLive() {
  const { id } = useParams<{ id: string }>();
  const [raffle,  setRaffle]  = useState<Raffle | null>(null);
  const [orders,  setOrders]  = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    Promise.all([getRaffle(id), getRaffleOrders(id)]).then(([r, o]) => {
      setRaffle(r);
      setOrders(o);
      setLoading(false);
    });
  }, [id]);

  if (loading)
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 size={40} className="text-indigo-400 animate-spin" />
      </div>
    );

  if (!raffle)
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4">
        <Ticket size={48} className="text-slate-700" />
        <p className="text-slate-400 font-bold">Sorteio não encontrado.</p>
        <Link to="/" className="text-indigo-400 hover:underline font-bold">← Voltar</Link>
      </div>
    );

  return raffle.status === "finished" && raffle.winnerNumber
    ? <ResultView raffle={raffle} orders={orders} />
    : <WaitingView raffle={raffle} orders={orders} />;
}

// ─── Página de espera (sorteio ainda não realizado) ──────────────────────────
function WaitingView({ raffle, orders }: { raffle: Raffle; orders: Order[] }) {
  const progress = raffle.totalNumbers > 0
    ? (raffle.soldNumbers.length / raffle.totalNumbers) * 100 : 0;
  const img = raffle.images?.[0] ?? `https://picsum.photos/seed/${raffle.id}/800/400`;

  const share = () => {
    const url = window.location.href;
    if (navigator.share) navigator.share({ title: raffle.title, url });
    else navigator.clipboard.writeText(url);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="relative h-64 sm:h-80 overflow-hidden">
        <img src={img} alt={raffle.title} className="w-full h-full object-cover opacity-40" referrerPolicy="no-referrer" />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/30 via-slate-950/60 to-slate-950" />
        <div className="absolute bottom-6 left-0 right-0 px-6 text-center">
          <div className="inline-flex items-center gap-2 bg-amber-500/20 border border-amber-500/30 text-amber-400 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest mb-4">
            <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            Aguardando Sorteio
          </div>
          <h1 className="text-2xl sm:text-4xl font-black leading-tight">{raffle.title}</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-center">
            <Ticket size={20} className="text-indigo-400 mx-auto mb-2" />
            <p className="text-xl font-black">{raffle.soldNumbers.length}</p>
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Vendidas</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-center">
            <Users size={20} className="text-emerald-400 mx-auto mb-2" />
            <p className="text-xl font-black">{new Set(orders.map(o => o.userId)).size}</p>
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Participantes</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-center">
            <Calendar size={20} className="text-amber-400 mx-auto mb-2" />
            <p className="text-sm font-black">{tsToDate(raffle.drawDate).toLocaleDateString("pt-BR")}</p>
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Sorteio</p>
          </div>
        </div>

        {/* Progress */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
          <div className="flex justify-between text-sm font-black">
            <span className="text-emerald-400">{raffle.totalNumbers - raffle.soldNumbers.length} disponíveis</span>
            <span className="text-slate-400">{progress.toFixed(0)}% vendido</span>
          </div>
          <div className="h-4 bg-slate-800 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-indigo-600 to-indigo-400 rounded-full"
            />
          </div>
          <p className="text-center text-xs text-slate-500 font-bold uppercase tracking-widest">
            {raffle.soldNumbers.length} de {raffle.totalNumbers} cotas
          </p>
        </div>

        {/* Participantes */}
        {orders.length > 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-800 flex items-center gap-3">
              <Users size={18} className="text-indigo-400" />
              <h2 className="font-black text-white">Participantes ({orders.length})</h2>
            </div>
            <div className="divide-y divide-slate-800/50 max-h-72 overflow-y-auto custom-scrollbar">
              {orders.map((o) => (
                <div key={o.id} className="flex items-center justify-between px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-600/20 flex items-center justify-center text-indigo-400 text-xs font-black">
                      {(o.userName ?? "?").charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-white">{o.userName ?? "—"}</span>
                  </div>
                  <div className="flex gap-1 flex-wrap justify-end max-w-[160px]">
                    {o.numbers.slice(0, 4).map((n) => (
                      <span key={n} className="text-[10px] font-black bg-slate-950 text-slate-400 px-1.5 py-0.5 rounded border border-slate-800">
                        #{String(n).padStart(3, "0")}
                      </span>
                    ))}
                    {o.numbers.length > 4 && (
                      <span className="text-[10px] font-black text-slate-500">+{o.numbers.length - 4}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Ações */}
        <div className="flex gap-3">
          <button
            onClick={share}
            className="flex-1 flex items-center justify-center gap-2 bg-slate-900 border border-slate-800 text-slate-300 hover:text-white py-4 rounded-2xl font-bold text-sm transition-all"
          >
            <Share2 size={17} /> Compartilhar
          </button>
          <Link
            to={`/raffle/${raffle.id}`}
            className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white py-4 rounded-2xl font-bold text-sm transition-all"
          >
            <Ticket size={17} /> Comprar Cotas
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── Animação de sorteio (usada no Dashboard e aqui) ─────────────────────────
export function DrawAnimation({
  soldNumbers,
  winnerNumber,
  winnerName,
  onComplete,
}: {
  soldNumbers: number[];
  winnerNumber: number;
  winnerName: string;
  onComplete?: () => void;
}) {
  const [phase, setPhase] = useState<"spinning" | "slowing" | "reveal" | "done">("spinning");
  const [displayNum, setDisplayNum] = useState(soldNumbers[0] ?? 1);
  const [confetti, setConfetti] = useState<{ id: number; x: number; color: string; delay: number }[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const COLORS = ["#6366f1","#10b981","#f59e0b","#ef4444","#8b5cf6","#06b6d4"];

  const spin = useCallback(() => {
    let speed = 50;
    let elapsed = 0;
    const total = 4000;

    intervalRef.current = setInterval(() => {
      setDisplayNum(soldNumbers[Math.floor(Math.random() * soldNumbers.length)]);
      elapsed += speed;

      if (elapsed > total * 0.5) {
        speed = 120;
        setPhase("slowing");
      }
      if (elapsed > total * 0.8) speed = 300;

      if (elapsed >= total) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setDisplayNum(winnerNumber);
        setPhase("reveal");

        // Confetti
        setConfetti(Array.from({ length: 60 }, (_, i) => ({
          id: i,
          x: Math.random() * 100,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          delay: Math.random() * 0.5,
        })));

        timeoutRef.current = setTimeout(() => {
          setPhase("done");
          onComplete?.();
        }, 3000);
      }
    }, speed);
  }, [soldNumbers, winnerNumber, onComplete]);

  useEffect(() => {
    spin();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [spin]);

  return (
    <div className="fixed inset-0 z-[500] bg-slate-950/95 backdrop-blur-2xl flex flex-col items-center justify-center px-4 overflow-hidden">

      {/* Confetti */}
      {phase === "reveal" && confetti.map((c) => (
        <motion.div
          key={c.id}
          initial={{ y: -20, x: `${c.x}vw`, opacity: 1, scale: 1 }}
          animate={{ y: "110vh", opacity: 0, scale: 0.5, rotate: Math.random() * 720 }}
          transition={{ duration: 2.5 + Math.random(), delay: c.delay, ease: "easeIn" }}
          style={{ position: "fixed", top: 0, width: 10, height: 16, background: c.color, borderRadius: 2 }}
        />
      ))}

      {/* Número giratório */}
      <motion.div
        className="text-center space-y-6"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
      >
        <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">
          {phase === "spinning" ? "🎲 SORTEANDO..." : phase === "slowing" ? "✨ FINALIZANDO..." : "🏆 GANHADOR!"}
        </div>

        <div className="relative">
          <motion.div
            className={`text-8xl sm:text-[10rem] font-black tabular-nums leading-none ${
              phase === "reveal" || phase === "done" ? "text-yellow-400" : "text-white"
            }`}
            animate={phase === "spinning" || phase === "slowing"
              ? { scale: [1, 1.05, 1], opacity: [1, 0.8, 1] }
              : { scale: [0.8, 1.15, 1] }
            }
            transition={phase === "spinning"
              ? { repeat: Infinity, duration: 0.1 }
              : { duration: 0.6, ease: "backOut" }
            }
          >
            #{String(displayNum).padStart(3, "0")}
          </motion.div>

          {(phase === "reveal" || phase === "done") && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="absolute -top-4 -right-4 text-4xl"
            >
              🏆
            </motion.div>
          )}
        </div>

        <AnimatePresence>
          {(phase === "reveal" || phase === "done") && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-2"
            >
              <p className="text-xl sm:text-2xl font-black text-white">
                🎉 {winnerName}
              </p>
              <p className="text-sm text-slate-400 font-medium">
                É o grande ganhador desta rifa!
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {(phase === "spinning" || phase === "slowing") && (
          <div className="flex justify-center gap-2 mt-4">
            {[0,1,2].map((i) => (
              <motion.div
                key={i}
                animate={{ scale: [1, 1.4, 1], opacity: [0.4, 1, 0.4] }}
                transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.2 }}
                className="w-2.5 h-2.5 rounded-full bg-indigo-400"
              />
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}

// ─── Página de resultado público ─────────────────────────────────────────────
function ResultView({ raffle, orders }: { raffle: Raffle; orders: Order[] }) {
  const [showAnimation, setShowAnimation] = useState(true);
  const img = raffle.images?.[0] ?? `https://picsum.photos/seed/${raffle.id}/800/400`;

  const share = () => {
    const msg = `🏆 ${raffle.winnerName} ganhou a rifa "${raffle.title}" com o número #${String(raffle.winnerNumber).padStart(3,"0")}! 🎉`;
    if (navigator.share) navigator.share({ title: raffle.title, text: msg, url: window.location.href });
    else navigator.clipboard.writeText(msg + "\n" + window.location.href);
  };

  const winnerOrder = orders.find((o) => o.numbers.includes(raffle.winnerNumber!));

  return (
    <>
      {showAnimation && raffle.soldNumbers.length > 0 && (
        <DrawAnimation
          soldNumbers={raffle.soldNumbers}
          winnerNumber={raffle.winnerNumber!}
          winnerName={raffle.winnerName!}
          onComplete={() => setTimeout(() => setShowAnimation(false), 1500)}
        />
      )}

      <div className="min-h-screen bg-slate-950 text-white">
        {/* Hero */}
        <div className="relative h-56 sm:h-72 overflow-hidden">
          <img src={img} alt={raffle.title} className="w-full h-full object-cover opacity-30" referrerPolicy="no-referrer" />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/20 via-slate-950/60 to-slate-950" />
          <div className="absolute bottom-6 left-0 right-0 px-6 text-center">
            <div className="inline-flex items-center gap-2 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest mb-3">
              <div className="w-2 h-2 rounded-full bg-emerald-400" />
              Sorteio Concluído
            </div>
            <h1 className="text-2xl sm:text-3xl font-black leading-tight">{raffle.title}</h1>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">

          {/* Card do ganhador */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-gradient-to-br from-yellow-500/20 to-amber-500/10 border-2 border-yellow-500/40 rounded-3xl p-8 text-center space-y-4"
          >
            <div className="text-5xl">🏆</div>
            <div>
              <p className="text-[10px] font-black text-yellow-500 uppercase tracking-widest mb-2">
                Grande Ganhador
              </p>
              <p className="text-3xl sm:text-4xl font-black text-yellow-400">
                #{String(raffle.winnerNumber).padStart(3, "0")}
              </p>
              <p className="text-2xl font-black text-white mt-2">{raffle.winnerName}</p>
            </div>
            {raffle.drawnAt && (
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">
                Sorteado em {tsToDate(raffle.drawnAt).toLocaleDateString("pt-BR")} às {tsToDate(raffle.drawnAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
              </p>
            )}
          </motion.div>

          {/* Cotas do ganhador */}
          {winnerOrder && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">
                Cotas do ganhador
              </p>
              <div className="flex flex-wrap gap-1.5">
                {winnerOrder.numbers.map((n) => (
                  <span
                    key={n}
                    className={`text-xs font-black px-2.5 py-1 rounded-lg border ${
                      n === raffle.winnerNumber
                        ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30 scale-110"
                        : "bg-slate-950 text-slate-400 border-slate-800"
                    }`}
                  >
                    #{String(n).padStart(3, "0")}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
              <p className="text-lg font-black text-white">{raffle.soldNumbers.length}</p>
              <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Cotas Vendidas</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
              <p className="text-lg font-black text-white">{new Set(orders.map(o => o.userId)).size}</p>
              <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Participantes</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
              <p className="text-lg font-black text-white">R$ {(raffle.soldNumbers.length * raffle.pricePerNumber).toLocaleString("pt-BR")}</p>
              <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Arrecadado</p>
            </div>
          </div>

          {/* Todos os participantes */}
          {orders.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
              <div className="p-5 border-b border-slate-800 flex items-center gap-3">
                <Users size={16} className="text-indigo-400" />
                <h2 className="font-black text-white text-sm">Todos os Participantes</h2>
              </div>
              <div className="divide-y divide-slate-800/40 max-h-64 overflow-y-auto custom-scrollbar">
                {orders.map((o) => (
                  <div key={o.id} className={`flex items-center justify-between px-5 py-3 ${o.userId === raffle.winnerId ? "bg-yellow-500/5" : ""}`}>
                    <div className="flex items-center gap-3">
                      {o.userId === raffle.winnerId
                        ? <span className="text-lg">🏆</span>
                        : <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 text-xs font-black">{(o.userName ?? "?").charAt(0).toUpperCase()}</div>
                      }
                      <span className={`text-sm font-medium ${o.userId === raffle.winnerId ? "text-yellow-400 font-black" : "text-white"}`}>
                        {o.userName ?? "—"}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-500">{o.numbers.length} cota(s)</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Ações */}
          <div className="flex gap-3">
            <button
              onClick={share}
              className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white py-4 rounded-2xl font-bold text-sm transition-all"
            >
              <Share2 size={16} /> Compartilhar Resultado
            </button>
            <Link
              to="/"
              className="flex-1 flex items-center justify-center gap-2 bg-slate-900 border border-slate-800 text-slate-300 hover:text-white py-4 rounded-2xl font-bold text-sm transition-all"
            >
              <ExternalLink size={16} /> Ver Outras Rifas
            </Link>
          </div>

          {/* Replay */}
          {!showAnimation && (
            <button
              onClick={() => setShowAnimation(true)}
              className="w-full flex items-center justify-center gap-2 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all"
            >
              <Eye size={14} /> Rever Animação do Sorteio
            </button>
          )}
        </div>
      </div>
    </>
  );
}