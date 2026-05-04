import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  Ticket,
  Calendar,
  ShieldCheck,
  Share2,
  ShoppingCart,
  CheckCircle2,
  Wallet,
  X,
  Sparkles,
  ArrowLeft,
  Zap,
  Copy,
  QrCode,
  RefreshCw,
  Users,
} from "lucide-react";
import { Raffle, User, Order } from "../types";
import {
  getRaffle,
  createOrder,
  confirmOrderPayment,
  getRaffleOrders,
  tsToDate,
} from "../lib/firebaseService";

interface RaffleDetailProps {
  user: User | null;
}

type ModalStep = "pix" | "confirming" | "success";

export default function RaffleDetail({ user }: RaffleDetailProps) {
  const { id } = useParams<{ id: string }>();
  const [raffle, setRaffle] = useState<Raffle | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<ModalStep | null>(null);
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);
  const [quickQty, setQuickQty] = useState(1);
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  const loadRaffle = useCallback(async () => {
    if (!id) return;
    const [data, orderData] = await Promise.all([
      getRaffle(id),
      getRaffleOrders(id),
    ]);
    setRaffle(data);
    setOrders(orderData);
  }, [id]);

  useEffect(() => {
    loadRaffle().finally(() => setLoading(false));
  }, [loadRaffle]);

  const toggleNumber = (num: number) => {
    if (!raffle) return;
    if (raffle.soldNumbers.includes(num)) return;
    setSelectedNumbers((prev) =>
      prev.includes(num) ? prev.filter((n) => n !== num) : [...prev, num]
    );
  };

  const quickPick = () => {
    if (!raffle) return;
    const available = Array.from({ length: raffle.totalNumbers }, (_, i) => i + 1).filter(
      (n) => !raffle.soldNumbers.includes(n) && !selectedNumbers.includes(n)
    );
    const picks: number[] = [];
    for (let i = 0; i < quickQty && available.length > 0; i++) {
      const idx = Math.floor(Math.random() * available.length);
      picks.push(available.splice(idx, 1)[0]);
    }
    setSelectedNumbers((prev) => [...new Set([...prev, ...picks])]);
  };

  const handleBuy = async () => {
    if (!user) { navigate("/login"); return; }
    if (!raffle || selectedNumbers.length === 0) return;
    const total = selectedNumbers.length * raffle.pricePerNumber;
    const orderId = await createOrder(raffle.id, user.id, selectedNumbers, total);
    setPendingOrderId(orderId);
    setModal("pix");
  };

  const handleConfirmPayment = async () => {
    if (!pendingOrderId || !raffle) return;
    setModal("confirming");
    await confirmOrderPayment(pendingOrderId, raffle.id, selectedNumbers);
    await loadRaffle();
    setSelectedNumbers([]);
    setModal("success");
  };

  const copyPixKey = () => {
    navigator.clipboard.writeText("ggrifas@financeiro.com.br");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareRaffle = async () => {
    if (navigator.share) {
      await navigator.share({ title: raffle?.title, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  if (loading)
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 text-sm font-medium">Carregando sorteio...</p>
        </div>
      </div>
    );

  if (!raffle)
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6 px-4">
        <Ticket size={48} className="text-slate-700" />
        <p className="text-slate-400 font-bold text-xl">Sorteio não encontrado</p>
        <Link to="/" className="text-indigo-400 font-bold hover:underline">
          ← Voltar para Home
        </Link>
      </div>
    );

  const progress =
    raffle.totalNumbers > 0
      ? (raffle.soldNumbers.length / raffle.totalNumbers) * 100
      : 0;
  const totalSelected = selectedNumbers.length * raffle.pricePerNumber;
  const img = raffle.images?.[0] ?? `https://picsum.photos/seed/${raffle.id}/800/600`;

  // Build unique participant count
  const participantIds = new Set(orders.map((o) => o.userId));

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 md:py-14">
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-slate-500 hover:text-white font-bold transition-all group mb-8"
      >
        <div className="bg-slate-900 p-2 rounded-lg border border-slate-800 group-hover:border-slate-600 transition-all">
          <ArrowLeft size={16} />
        </div>
        <span className="text-sm uppercase tracking-widest">Voltar</span>
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        {/* ── LEFT ───────────────────────────────────────────────────── */}
        <div className="lg:col-span-8 space-y-8">
          {/* Info Card */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-900/50 rounded-[2.5rem] border border-slate-800 p-8 md:p-12 relative overflow-hidden backdrop-blur-sm"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/5 rounded-full blur-[80px]" />
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-indigo-600/10 p-2 rounded-lg text-indigo-400 border border-indigo-500/20">
                <Ticket size={20} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
                Sorteio Exclusivo
              </span>
              {raffle.status === "finished" && (
                <span className="ml-auto bg-slate-800 text-slate-400 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg border border-slate-700">
                  Encerrado
                </span>
              )}
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-6 tracking-tight leading-none">
              {raffle.title}
            </h1>

            <div className="flex flex-wrap gap-3 mb-8">
              <div className="flex items-center gap-2 bg-slate-950 px-4 py-2.5 rounded-2xl border border-slate-800">
                <Calendar size={16} className="text-indigo-500" />
                <span className="text-sm font-bold text-slate-300">
                  {tsToDate(raffle.drawDate).toLocaleDateString("pt-BR")}
                </span>
              </div>
              <div className="flex items-center gap-2 bg-indigo-600/10 px-4 py-2.5 rounded-2xl border border-indigo-600/20">
                <Wallet size={16} className="text-indigo-400" />
                <span className="text-base font-black text-indigo-400">
                  R$ {raffle.pricePerNumber.toFixed(2)} / cota
                </span>
              </div>
              <div className="flex items-center gap-2 bg-slate-950 px-4 py-2.5 rounded-2xl border border-slate-800">
                <Users size={16} className="text-emerald-400" />
                <span className="text-sm font-bold text-slate-300">
                  {participantIds.size} participantes
                </span>
              </div>
            </div>

            <p className="text-slate-400 font-medium text-base leading-relaxed mb-10 border-l-4 border-indigo-600 pl-6">
              {raffle.description}
            </p>

            {/* Progress Bar */}
            <div className="space-y-3">
              <div className="flex justify-between items-end">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  Progresso das Cotas
                </span>
                <span className="text-2xl font-black text-white">
                  {progress.toFixed(0)}%
                </span>
              </div>
              <div className="h-5 bg-slate-950 rounded-full border border-slate-800 p-1 shadow-inner">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-indigo-600 to-indigo-400 rounded-full shadow-lg shadow-indigo-600/30"
                />
              </div>
              <div className="flex items-center justify-between text-[10px] font-black tracking-widest uppercase text-slate-500">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                  <span>{raffle.soldNumbers.length} vendidas</span>
                </div>
                <span>Meta: {raffle.totalNumbers}</span>
              </div>
            </div>
          </motion.div>

          {/* Number Grid */}
          <div className="bg-slate-900 rounded-[2.5rem] border border-slate-800 p-8 md:p-12">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
              <div>
                <h2 className="text-2xl font-black text-white mb-1">
                  Quadro de{" "}
                  <span className="text-indigo-400 italic">Números</span>
                </h2>
                <p className="text-slate-500 font-medium text-sm">
                  Clique para selecionar suas cotas da sorte.
                </p>
              </div>
              <div className="flex flex-wrap gap-3 text-[10px] font-black uppercase tracking-widest">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <div className="w-3 h-3 bg-slate-800 rounded border border-slate-700" />
                  <span>Livre</span>
                </div>
                <div className="flex items-center gap-1.5 text-indigo-400">
                  <div className="w-3 h-3 bg-indigo-600 rounded" />
                  <span>Selecionado</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-600">
                  <div className="w-3 h-3 bg-slate-950 rounded border border-slate-800" />
                  <span>Vendido</span>
                </div>
              </div>
            </div>

            {/* Quick Pick */}
            {raffle.status === "active" && (
              <div className="flex items-center gap-3 mb-6 p-4 bg-slate-950 rounded-2xl border border-slate-800">
                <Zap size={16} className="text-indigo-400 shrink-0" />
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">
                  Compra Rápida:
                </span>
                <select
                  value={quickQty}
                  onChange={(e) => setQuickQty(Number(e.target.value))}
                  className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-white outline-none"
                >
                  {[1, 5, 10, 25, 50].map((n) => (
                    <option key={n} value={n}>
                      {n} {n === 1 ? "cota" : "cotas"}
                    </option>
                  ))}
                </select>
                <button
                  onClick={quickPick}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-1.5 rounded-xl text-xs font-black transition-all"
                >
                  Sortear!
                </button>
                {selectedNumbers.length > 0 && (
                  <button
                    onClick={() => setSelectedNumbers([])}
                    className="ml-auto text-slate-500 hover:text-red-400 transition-colors text-xs font-bold"
                  >
                    Limpar
                  </button>
                )}
              </div>
            )}

            <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2 max-h-[400px] overflow-y-auto px-1 py-1 custom-scrollbar">
              {Array.from({ length: raffle.totalNumbers }).map((_, i) => {
                const num = i + 1;
                const isSold = raffle.soldNumbers.includes(num);
                const isSelected = selectedNumbers.includes(num);
                return (
                  <button
                    key={num}
                    disabled={isSold || raffle.status === "finished"}
                    onClick={() => toggleNumber(num)}
                    className={`aspect-square rounded-xl text-[10px] font-black transition-all flex items-center justify-center
                      ${isSold
                        ? "bg-slate-950 text-slate-700 cursor-not-allowed border border-slate-900"
                        : isSelected
                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 scale-110 z-10"
                        : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white border border-slate-700 hover:scale-105 active:scale-95 cursor-pointer"
                      }`}
                  >
                    {num.toString().padStart(raffle.totalNumbers >= 100 ? 3 : 2, "0")}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── RIGHT (Sticky Cart) ─────────────────────────────────────── */}
        <div className="lg:col-span-4 lg:sticky lg:top-24 h-fit space-y-6">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-slate-900 rounded-[2.5rem] border border-slate-800 shadow-2xl overflow-hidden"
          >
            <div className="relative h-56 sm:h-64">
              <img
                src={img}
                alt={raffle.title}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
              <div className="absolute top-4 left-4 flex items-center gap-2 bg-indigo-600 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-white shadow-xl">
                <Sparkles size={12} />
                <span>Prêmio Principal</span>
              </div>
            </div>

            <div className="p-8 space-y-6">
              {/* Cart Summary */}
              <div className="flex items-center justify-between pb-5 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="bg-indigo-600/10 p-2.5 rounded-xl text-indigo-400 border border-indigo-500/20">
                    <ShoppingCart size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                      Carrinho
                    </p>
                    <p className="text-lg font-black text-white">
                      {selectedNumbers.length} cotas
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    Total
                  </p>
                  <p className="text-xl font-black text-indigo-400">
                    R$ {totalSelected.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              {/* Selected chips */}
              <div className="min-h-[36px] max-h-28 overflow-y-auto custom-scrollbar flex flex-wrap gap-1.5">
                <AnimatePresence>
                  {selectedNumbers.length > 0 ? (
                    selectedNumbers.map((num) => (
                      <motion.button
                        key={num}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        onClick={() => toggleNumber(num)}
                        className="bg-slate-950 text-indigo-400 px-2.5 py-1 rounded-lg text-[10px] font-black border border-indigo-500/20 hover:border-red-500/30 hover:text-red-400 transition-colors"
                      >
                        #{num.toString().padStart(3, "0")}
                      </motion.button>
                    ))
                  ) : (
                    <p className="text-slate-600 text-xs font-bold italic w-full text-center py-2">
                      Nenhum número selecionado
                    </p>
                  )}
                </AnimatePresence>
              </div>

              {raffle.status === "active" ? (
                <button
                  disabled={selectedNumbers.length === 0}
                  onClick={handleBuy}
                  className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black text-lg shadow-xl shadow-indigo-600/20 hover:bg-indigo-500 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-40 flex items-center justify-center gap-3"
                >
                  <Wallet size={22} />
                  <span>FINALIZAR COMPRA</span>
                </button>
              ) : (
                <div className="w-full bg-slate-800 text-slate-500 py-5 rounded-2xl font-black text-base text-center border border-slate-700">
                  Sorteio Encerrado
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2 text-slate-600">
                  <ShieldCheck size={14} />
                  <p className="text-[10px] font-bold uppercase tracking-widest">
                    Pagamento Seguro via PIX
                  </p>
                </div>
                <button
                  onClick={shareRaffle}
                  className="flex items-center gap-1.5 text-[10px] font-black text-slate-500 hover:text-indigo-400 transition-colors uppercase tracking-widest"
                >
                  <Share2 size={14} />
                  <span>Partilhar</span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── PIX / Payment Modal ─────────────────────────────────────── */}
      <AnimatePresence>
        {modal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xl">
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 20 }}
              className="bg-slate-900 w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-2xl border border-slate-800"
            >
              {/* PIX Step */}
              {modal === "pix" && (
                <div className="p-8 sm:p-10 space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-black text-white">
                      Pagamento via{" "}
                      <span className="text-indigo-400">PIX</span>
                    </h2>
                    <button
                      onClick={() => setModal(null)}
                      className="text-slate-500 hover:text-white transition-colors"
                    >
                      <X size={24} />
                    </button>
                  </div>

                  <div className="bg-slate-950 rounded-3xl p-6 text-center border border-slate-800 space-y-4">
                    <div className="w-36 h-36 mx-auto bg-white rounded-2xl flex items-center justify-center shadow-lg">
                      <QrCode size={100} className="text-slate-900" />
                    </div>
                    <p className="text-xs text-slate-500 font-medium">
                      Escaneie o QR Code ou use a chave PIX abaixo
                    </p>
                  </div>

                  <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">
                        Chave PIX
                      </p>
                      <p className="text-sm font-bold text-indigo-400">
                        ggrifas@financeiro.com.br
                      </p>
                    </div>
                    <button
                      onClick={copyPixKey}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
                        copied
                          ? "bg-emerald-600 text-white"
                          : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                      }`}
                    >
                      {copied ? (
                        <CheckCircle2 size={14} />
                      ) : (
                        <Copy size={14} />
                      )}
                      {copied ? "Copiado!" : "Copiar"}
                    </button>
                  </div>

                  <div className="bg-indigo-600/10 rounded-2xl p-4 border border-indigo-500/20 text-center">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">
                      Valor a pagar
                    </p>
                    <p className="text-3xl font-black text-indigo-400">
                      R${" "}
                      {totalSelected.toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                      })}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {selectedNumbers.length} cota(s) ×{" "}
                      R$ {raffle.pricePerNumber.toFixed(2)}
                    </p>
                  </div>

                  <button
                    onClick={handleConfirmPayment}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-5 rounded-2xl font-black text-lg shadow-xl shadow-emerald-600/20 transition-all hover:scale-[1.01] flex items-center justify-center gap-3"
                  >
                    <CheckCircle2 size={22} />
                    <span>JÁ PAGUEI – CONFIRMAR</span>
                  </button>
                  <p className="text-center text-[10px] text-slate-600 font-bold uppercase tracking-widest">
                    Seus números serão reservados após a confirmação
                  </p>
                </div>
              )}

              {/* Confirming Step */}
              {modal === "confirming" && (
                <div className="p-10 text-center space-y-6">
                  <div className="w-20 h-20 mx-auto bg-indigo-600/10 rounded-3xl flex items-center justify-center border border-indigo-500/20">
                    <RefreshCw size={40} className="text-indigo-400 animate-spin" />
                  </div>
                  <h2 className="text-2xl font-black text-white">
                    Confirmando pagamento...
                  </h2>
                  <p className="text-slate-500 font-medium">
                    Aguarde enquanto validamos sua transação.
                  </p>
                </div>
              )}

              {/* Success Step */}
              {modal === "success" && (
                <div className="p-8 sm:p-10 text-center space-y-6">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-[50px]" />
                  <div className="w-24 h-24 bg-emerald-500/10 text-emerald-400 rounded-[2rem] flex items-center justify-center mx-auto shadow-2xl shadow-emerald-500/20 border border-emerald-500/20">
                    <CheckCircle2 size={52} />
                  </div>
                  <h2 className="text-3xl font-black text-white tracking-tight">
                    Cotas Confirmadas!{" "}
                    <span className="text-emerald-500 italic">🎉</span>
                  </h2>
                  <p className="text-slate-500 font-medium leading-relaxed">
                    Seus números foram reservados com sucesso. Boa sorte no
                    sorteio!
                  </p>

                  <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800 text-left">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                      Protocolo
                    </p>
                    <p className="text-xs font-mono text-indigo-400 break-all">
                      {pendingOrderId}
                    </p>
                  </div>

                  <button
                    onClick={() => setModal(null)}
                    className="w-full bg-slate-800 hover:bg-slate-700 text-white py-5 rounded-2xl font-black text-lg transition-all border border-slate-700"
                  >
                    FECHAR
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
