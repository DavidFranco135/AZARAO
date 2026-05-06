import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { onSnapshot, doc } from "firebase/firestore";
import { db } from "../lib/firebase";
import {
  Trophy, Ticket, Users, Calendar, Share2,
  ExternalLink, Loader2,
} from "lucide-react";
import { Raffle, Order } from "../types";
import { getRaffleOrders, tsToDate } from "../lib/firebaseService";

// ─── Frases dramáticas de introdução ────────────────────────────────────────
const INTRO_PHRASES = [
  "🎲 Iniciando o sorteio...",
  "🔀 Embaralhando os números...",
  "✨ Que a sorte decida!",
  "🎯 Aqui vamos nós...",
];

export default function DrawLive() {
  const { id } = useParams<{ id: string }>();
  const [raffle,  setRaffle]  = useState<Raffle | null>(null);
  const [orders,  setOrders]  = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [triggerAnimation, setTriggerAnimation] = useState(false);
  const prevStatus = useRef<string | null>(null);

  // Carrega pedidos uma vez
  useEffect(() => {
    if (!id) return;
    getRaffleOrders(id).then(setOrders);
  }, [id]);

  // Firestore real-time listener — detecta quando criador realiza o sorteio
  useEffect(() => {
    if (!id) return;
    const unsub = onSnapshot(doc(db, "raffles", id), (snap) => {
      if (!snap.exists()) { setLoading(false); return; }
      const data = { ...snap.data(), id: snap.id } as Raffle;

      // Detecta transição active → finished e dispara animação
      if (
        prevStatus.current === "active" &&
        data.status === "finished" &&
        data.winnerNumber
      ) {
        setTriggerAnimation(true);
      }

      prevStatus.current = data.status;
      setRaffle(data);
      setLoading(false);
    });
    return unsub;
  }, [id]);

  if (loading)
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4">
        <Loader2 size={40} className="text-indigo-400 animate-spin" />
        <p className="text-slate-500 text-sm font-medium">Conectando ao sorteio ao vivo...</p>
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

  // Mostra animação quando sorteio acabou de ser realizado (em tempo real)
  if (triggerAnimation && raffle.status === "finished" && raffle.winnerNumber) {
    return (
      <DrawAnimation
        soldNumbers={raffle.soldNumbers}
        winnerNumber={raffle.winnerNumber}
        winnerName={raffle.winnerName ?? "Ganhador"}
        onComplete={() => setTriggerAnimation(false)}
      />
    );
  }

  return raffle.status === "finished" && raffle.winnerNumber
    ? <ResultView raffle={raffle} orders={orders} />
    : <WaitingView raffle={raffle} orders={orders} />;
}

// ─── Animação de sorteio com frases de introdução ───────────────────────────
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
  type Phase = "intro" | "spinning" | "slowing" | "reveal" | "done";
  const [phase, setPhase]       = useState<Phase>("intro");
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [displayNum, setDisplayNum] = useState(soldNumbers[0] ?? 1);
  const [confetti, setConfetti] = useState<{ id: number; x: number; color: string; size: number }[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const COLORS = ["#6366f1","#10b981","#f59e0b","#ef4444","#8b5cf6","#06b6d4","#f472b6"];

  // Fase 1: frases de introdução (uma a cada 900ms)
  useEffect(() => {
    if (phase !== "intro") return;
    const total = INTRO_PHRASES.length;
    let idx = 0;
    const t = setInterval(() => {
      idx++;
      if (idx < total) {
        setPhraseIdx(idx);
      } else {
        clearInterval(t);
        setPhase("spinning");
      }
    }, 900);
    return () => clearInterval(t);
  }, [phase]);

  // Fase 2: números girando
  useEffect(() => {
    if (phase !== "spinning") return;
    let speed = 60;
    let elapsed = 0;
    const total = 4500;

    intervalRef.current = setInterval(() => {
      setDisplayNum(soldNumbers[Math.floor(Math.random() * soldNumbers.length)]);
      elapsed += speed;

      if (elapsed > total * 0.55) { speed = 130; setPhase("slowing"); }
      if (elapsed > total * 0.82) speed = 320;

      if (elapsed >= total) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setDisplayNum(winnerNumber);
        setPhase("reveal");
        setConfetti(Array.from({ length: 80 }, (_, i) => ({
          id: i,
          x: Math.random() * 100,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          size: 8 + Math.random() * 10,
        })));
        setTimeout(() => { setPhase("done"); onComplete?.(); }, 4000);
      }
    }, speed);

    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [phase === "spinning"]);

  return (
    <div className="fixed inset-0 z-[500] bg-slate-950 flex flex-col items-center justify-center px-4 overflow-hidden">

      {/* Glow de fundo */}
      <div className="absolute inset-0 bg-gradient-radial from-indigo-900/20 to-transparent pointer-events-none" />

      {/* Confetti */}
      {phase === "reveal" && confetti.map((c) => (
        <motion.div
          key={c.id}
          initial={{ y: -10, x: `${c.x}vw`, opacity: 1, rotate: 0 }}
          animate={{ y: "110vh", opacity: [1, 1, 0], rotate: 360 * (Math.random() > 0.5 ? 1 : -1) }}
          transition={{ duration: 2 + Math.random() * 1.5, delay: Math.random() * 0.4, ease: "easeIn" }}
          style={{ position: "fixed", top: 0, width: c.size, height: c.size * 1.6, background: c.color, borderRadius: 2 }}
        />
      ))}

      {/* ── FASE INTRO ── */}
      {phase === "intro" && (
        <motion.div
          key={phraseIdx}
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20 }}
          className="text-center space-y-6"
        >
          <div className="text-6xl mb-6">🎰</div>
          <p className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            {INTRO_PHRASES[phraseIdx]}
          </p>
          <div className="flex justify-center gap-2 mt-6">
            {INTRO_PHRASES.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === phraseIdx ? "w-8 bg-indigo-400" : i < phraseIdx ? "w-2 bg-indigo-700" : "w-2 bg-slate-800"
                }`}
              />
            ))}
          </div>
        </motion.div>
      )}

      {/* ── FASE SPINNING / SLOWING / REVEAL ── */}
      {phase !== "intro" && (
        <motion.div
          className="text-center space-y-6"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4 }}
        >
          {/* Label da fase */}
          <AnimatePresence mode="wait">
            <motion.p
              key={phase}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em]"
            >
              {phase === "spinning" && "🎲 SORTEANDO..."}
              {phase === "slowing" && "✨ FINALIZANDO..."}
              {(phase === "reveal" || phase === "done") && "🏆 GANHADOR!"}
            </motion.p>
          </AnimatePresence>

          {/* Número */}
          <div className="relative">
            <motion.div
              className={`text-[7rem] sm:text-[10rem] font-black tabular-nums leading-none tracking-tighter ${
                phase === "reveal" || phase === "done" ? "text-yellow-400" : "text-white"
              }`}
              animate={
                phase === "spinning"
                  ? { scale: [1, 1.04, 1], opacity: [1, 0.75, 1] }
                  : phase === "slowing"
                  ? { scale: [1, 1.02, 1] }
                  : { scale: [0.7, 1.2, 1] }
              }
              transition={
                phase === "spinning"
                  ? { repeat: Infinity, duration: 0.12 }
                  : phase === "slowing"
                  ? { repeat: Infinity, duration: 0.35 }
                  : { duration: 0.7, ease: "backOut" }
              }
            >
              #{String(displayNum).padStart(3, "0")}
            </motion.div>

            {(phase === "reveal" || phase === "done") && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: "spring" }}
                className="absolute -top-4 -right-6 text-4xl"
              >🏆</motion.div>
            )}
          </div>

          {/* Nome do ganhador */}
          <AnimatePresence>
            {(phase === "reveal" || phase === "done") && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="space-y-2"
              >
                <p className="text-2xl sm:text-3xl font-black text-white">🎉 {winnerName}</p>
                <p className="text-sm text-slate-400">É o grande ganhador desta rifa!</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Dots de loading */}
          {(phase === "spinning" || phase === "slowing") && (
            <div className="flex justify-center gap-2">
              {[0,1,2].map((i) => (
                <motion.div
                  key={i}
                  animate={{ scale: [1, 1.5, 1], opacity: [0.4, 1, 0.4] }}
                  transition={{ repeat: Infinity, duration: 0.7, delay: i * 0.2 }}
                  className="w-2.5 h-2.5 rounded-full bg-indigo-400"
                />
              ))}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}

// ─── Página de espera em tempo real ─────────────────────────────────────────
function WaitingView({ raffle, orders }: { raffle: Raffle; orders: Order[] }) {
  const progress = raffle.totalNumbers > 0
    ? (raffle.soldNumbers.length / raffle.totalNumbers) * 100 : 0;
  const img = raffle.images?.[0] ?? `https://picsum.photos/seed/${raffle.id}/800/400`;

  const share = () => {
    if (navigator.share) navigator.share({ title: raffle.title, url: window.location.href });
    else navigator.clipboard.writeText(window.location.href);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="relative h-64 sm:h-80 overflow-hidden">
        <img src={img} alt={raffle.title} className="w-full h-full object-cover opacity-40" referrerPolicy="no-referrer" />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/30 via-slate-950/60 to-slate-950" />
        <div className="absolute bottom-6 left-0 right-0 px-6 text-center">
          <div className="inline-flex items-center gap-2 bg-amber-500/20 border border-amber-500/30 text-amber-400 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest mb-4">
            <motion.div
              animate={{ scale: [1, 1.4, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="w-2 h-2 rounded-full bg-amber-400"
            />
            Ao Vivo — Aguardando Sorteio
          </div>
          <h1 className="text-2xl sm:text-4xl font-black leading-tight">{raffle.title}</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl text-center">
          <p className="text-sm font-medium text-indigo-300">
            📡 Esta página atualiza automaticamente quando o sorteio começar — não precisa recarregar!
          </p>
        </div>

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
        </div>

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
                  <span className="text-[10px] font-bold text-slate-500">{o.numbers.length} cota(s)</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <button onClick={share} className="flex-1 flex items-center justify-center gap-2 bg-slate-900 border border-slate-800 text-slate-300 hover:text-white py-4 rounded-2xl font-bold text-sm transition-all">
            <Share2 size={17} /> Compartilhar
          </button>
          <Link to={`/raffle/${raffle.id}`} className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white py-4 rounded-2xl font-bold text-sm transition-all">
            <Ticket size={17} /> Comprar Cotas
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── Resultado final ─────────────────────────────────────────────────────────
function ResultView({ raffle, orders }: { raffle: Raffle; orders: Order[] }) {
  const [showAnim, setShowAnim] = useState(false);
  const img = raffle.images?.[0] ?? `https://picsum.photos/seed/${raffle.id}/800/400`;

  const share = () => {
    const msg = `🏆 ${raffle.winnerName} ganhou a rifa "${raffle.title}" com o número #${String(raffle.winnerNumber).padStart(3,"0")}! 🎉`;
    if (navigator.share) navigator.share({ title: raffle.title, text: msg, url: window.location.href });
    else navigator.clipboard.writeText(msg + "\n" + window.location.href);
  };

  const winnerOrder = orders.find((o) => o.numbers.includes(raffle.winnerNumber!));

  if (showAnim) {
    return (
      <DrawAnimation
        soldNumbers={raffle.soldNumbers.length > 0 ? raffle.soldNumbers : [raffle.winnerNumber!]}
        winnerNumber={raffle.winnerNumber!}
        winnerName={raffle.winnerName!}
        onComplete={() => setShowAnim(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="relative h-56 sm:h-72 overflow-hidden">
        <img src={img} alt={raffle.title} className="w-full h-full object-cover opacity-30" referrerPolicy="no-referrer" />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/20 via-slate-950/60 to-slate-950" />
        <div className="absolute bottom-6 left-0 right-0 px-6 text-center">
          <div className="inline-flex items-center gap-2 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest mb-3">
            <div className="w-2 h-2 rounded-full bg-emerald-400" /> Sorteio Concluído
          </div>
          <h1 className="text-2xl sm:text-3xl font-black leading-tight">{raffle.title}</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-gradient-to-br from-yellow-500/20 to-amber-500/10 border-2 border-yellow-500/40 rounded-3xl p-8 text-center space-y-4"
        >
          <div className="text-5xl">🏆</div>
          <p className="text-[10px] font-black text-yellow-500 uppercase tracking-widest">Grande Ganhador</p>
          <p className="text-3xl sm:text-4xl font-black text-yellow-400">
            #{String(raffle.winnerNumber).padStart(3, "0")}
          </p>
          <p className="text-2xl font-black text-white">{raffle.winnerName}</p>
          {raffle.drawnAt && (
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">
              {tsToDate(raffle.drawnAt).toLocaleDateString("pt-BR")} às{" "}
              {tsToDate(raffle.drawnAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
            </p>
          )}
        </motion.div>

        {winnerOrder && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Cotas do ganhador</p>
            <div className="flex flex-wrap gap-1.5">
              {winnerOrder.numbers.map((n) => (
                <span key={n} className={`text-xs font-black px-2.5 py-1 rounded-lg border ${
                  n === raffle.winnerNumber
                    ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30 scale-110"
                    : "bg-slate-950 text-slate-400 border-slate-800"
                }`}>
                  #{String(n).padStart(3,"0")}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-3">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
            <p className="text-lg font-black text-white">{raffle.soldNumbers.length}</p>
            <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Cotas</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
            <p className="text-lg font-black text-white">{new Set(orders.map(o => o.userId)).size}</p>
            <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Participantes</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
            <p className="text-sm font-black text-white">R$ {(raffle.soldNumbers.length * raffle.pricePerNumber).toLocaleString("pt-BR")}</p>
            <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Arrecadado</p>
          </div>
        </div>

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
                      : <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-xs font-black text-slate-400">{(o.userName ?? "?").charAt(0).toUpperCase()}</div>
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

        <div className="flex gap-3">
          <button onClick={share} className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white py-4 rounded-2xl font-bold text-sm transition-all">
            <Share2 size={16} /> Compartilhar
          </button>
          <Link to="/" className="flex-1 flex items-center justify-center gap-2 bg-slate-900 border border-slate-800 text-slate-300 hover:text-white py-4 rounded-2xl font-bold text-sm transition-all">
            <ExternalLink size={16} /> Ver Rifas
          </Link>
        </div>

        <button
          onClick={() => setShowAnim(true)}
          className="w-full flex items-center justify-center gap-2 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all"
        >
          🎬 Rever Animação do Sorteio
        </button>
      </div>
    </div>
  );
}
