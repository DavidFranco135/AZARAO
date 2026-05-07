import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useSearchParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import CompleteProfileModal from "../components/CompleteProfileModal";
import PaymentModal from "../components/PaymentModal";
import OrderConfirmModal from "../components/OrderConfirmModal";
import ImageGallery from "../components/ImageGallery";
import {
  Ticket, Calendar, ShieldCheck, Share2, ShoppingCart,
  CheckCircle2, Wallet, X, Sparkles, ArrowLeft, Zap,
  Copy, QrCode, RefreshCw, Users, FlaskConical, Trophy,
  CreditCard, Loader2, Radio,
} from "lucide-react";
import { Raffle, User, Order } from "../types";
import {
  getRaffle, createOrder, confirmOrderPayment,
  getRaffleOrders, cancelPendingOrder, tsToDate,
} from "../lib/firebaseService";

interface Props { user: User | null }
type ModalStep = "choose" | "pix_sim" | "mp_redirect" | "confirming" | "success";

export default function RaffleDetail({ user }: Props) {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const [raffle, setRaffle] = useState<Raffle | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<ModalStep | null>(null);
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(user);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [confirmData, setConfirmData] = useState<{ orderId: string; numbers: number[]; total: number; status: "paid"|"pending" } | null>(null);
  const [pixData, setPixData] = useState<{ qrCode: string; qrBase64: string; paymentId: number } | null>(null);
  const [pixStatus, setPixStatus] = useState<"pending"|"approved"|"error">("pending");
  const [payMethod, setPayMethod] = useState<"pix"|"card">("pix");
  const [quickQty, setQuickQty] = useState(1);
  const [copied, setCopied] = useState(false);
  const [mpLoading, setMpLoading] = useState(false);
  const navigate = useNavigate();

  const load = useCallback(async () => {
    if (!id) return;
    // Raffle is always public
    const r = await getRaffle(id);
    setRaffle(r);
    // Orders require login — skip if not authenticated
    try {
      const o = await getRaffleOrders(id);
      setOrders(o);
    } catch {
      setOrders([]); // no orders visible if not logged in
    }
  }, [id]);

  useEffect(() => { load().finally(() => setLoading(false)); }, [load]);

  // Retorno do Mercado Pago
  useEffect(() => {
    const mpStatus = searchParams.get("mp_status");
    const orderId = searchParams.get("order_id");
    if (!mpStatus || !orderId) return;

    if (mpStatus === "approved") {
      setPendingOrderId(orderId);
      // Confirma via webhook — aqui só atualizamos a UI
      setModal("success");
      load();
    } else if (mpStatus === "failure") {
      cancelPendingOrder(orderId).catch(() => {});
      alert("Pagamento não aprovado. Tente novamente.");
    }
    // Limpa params da URL
    window.history.replaceState({}, "", window.location.pathname);
  }, [searchParams]);

  const toggleNumber = (num: number) => {
    if (!raffle || raffle.soldNumbers.includes(num)) return;
    setSelectedNumbers((p) =>
      p.includes(num) ? p.filter((n) => n !== num) : [...p, num]
    );
  };

  const quickPick = () => {
    if (!raffle) return;
    const available = Array.from({ length: raffle.totalNumbers }, (_, i) => i + 1)
      .filter((n) => !raffle.soldNumbers.includes(n) && !selectedNumbers.includes(n));
    const picks: number[] = [];
    for (let i = 0; i < quickQty && available.length > 0; i++) {
      picks.push(available.splice(Math.floor(Math.random() * available.length), 1)[0]);
    }
    setSelectedNumbers((p) => [...new Set([...p, ...picks])]);
  };

  const handleBuy = async () => {
    if (!currentUser) { navigate("/login"); return; }
    if (!raffle || selectedNumbers.length === 0) return;
    if (!currentUser.profileComplete) { setShowProfileModal(true); return; }
    // Rifas reais usam o PaymentModal com Checkout Bricks
    if (!raffle.isTest) { setShowPaymentModal(true); return; }
    setModal("choose"); // simulação
  };

  // ── Simulação (rifas de teste) ────────────────────────────────────────────

  const handleSimPayment = async () => {
    if (!raffle || !currentUser) return;
    const total = selectedNumbers.length * raffle.pricePerNumber;
    const orderId = await createOrder(
      raffle.id, raffle.title, currentUser.id, currentUser.name, selectedNumbers, total,
      currentUser.phone, currentUser.cpf
    );
    setPendingOrderId(orderId);
    setModal("pix_sim");
  };

  const handleConfirmSim = async () => {
    if (!pendingOrderId || !raffle) return;
    setModal("confirming");
    await confirmOrderPayment(pendingOrderId, raffle.id, selectedNumbers);
    await load();
    setSelectedNumbers([]);
    setModal("success");
  };

  // ── PIX direto (sem redirecionar) ────────────────────────────────────────
  const handlePixPayment = async () => {
    if (!raffle || !currentUser) return;
    setMpLoading(true);
    const total = selectedNumbers.length * raffle.pricePerNumber;
    const orderId = await createOrder(
      raffle.id, raffle.title, currentUser.id, currentUser.name,
      selectedNumbers, total, currentUser.phone, currentUser.cpf
    );
    setPendingOrderId(orderId);
    try {
      const res = await fetch("/api/mp-pix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          amount:     total,
          payerEmail: currentUser.email,
          payerName:  currentUser.name,
          payerCpf:   currentUser.cpf ?? "",
        }),
      });
      const data = await res.json();
      if (!data.qrCode) throw new Error(data.error ?? "Erro ao gerar PIX");
      setPixData({ qrCode: data.qrCode, qrBase64: data.qrBase64, paymentId: data.paymentId });
      setPixStatus("pending");
      setModal("pix_real");

      // Polling a cada 4s para verificar pagamento
      const poll = setInterval(async () => {
        try {
          const s = await fetch(`/api/mp-payment-status?id=${data.paymentId}`).then(r => r.json());
          if (s.status === "approved") {
            clearInterval(poll);
            setPixStatus("approved");
            setModal("success");
          }
        } catch { /* ignora */ }
      }, 4000);
      setTimeout(() => clearInterval(poll), 30 * 60 * 1000); // para após 30min
    } catch (err) {
      cancelPendingOrder(orderId).catch(() => {});
      alert("Erro ao gerar PIX. Tente novamente.");
      setModal("choose");
    } finally {
      setMpLoading(false);
    }
  };

  // ── Mercado Pago (rifas reais) ────────────────────────────────────────────

  const handleMpPayment = async () => {
    if (!raffle || !currentUser) return;
    setMpLoading(true);
    const total = selectedNumbers.length * raffle.pricePerNumber;

    // Cria pedido pendente primeiro
    const orderId = await createOrder(
      raffle.id, raffle.title, currentUser.id, currentUser.name, selectedNumbers, total,
      currentUser.phone, currentUser.cpf
    );
    setPendingOrderId(orderId);
    setModal("mp_redirect");

    try {
      const res = await fetch("/api/mp-preference", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          raffleId: raffle.id,
          raffleTitle: raffle.title,
          quantity: selectedNumbers.length,
          unitPrice: raffle.pricePerNumber,
          payerEmail: currentUser.email,
          payerName: currentUser.name,
          commissionPercentage: raffle.commissionPercentage,
        }),
      });

      const data = await res.json();
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        throw new Error("URL de checkout não recebida.");
      }
    } catch (err) {
      cancelPendingOrder(orderId).catch(() => {});
      setModal(null);
      alert("Erro ao iniciar pagamento. Tente novamente.");
    } finally {
      setMpLoading(false);
    }
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
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );

  if (!raffle)
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 px-4">
        <Ticket size={48} className="text-slate-700" />
        <p className="text-slate-400 font-bold text-xl">Sorteio não encontrado</p>
        <Link to="/" className="text-indigo-400 font-bold hover:underline">← Voltar</Link>
      </div>
    );

  const progress = raffle.totalNumbers > 0
    ? (raffle.soldNumbers.length / raffle.totalNumbers) * 100 : 0;
  const totalSelected = selectedNumbers.length * raffle.pricePerNumber;
  const img = raffle.images?.[0] ?? `https://picsum.photos/seed/${raffle.id}/800/600`;
  const participantIds = new Set(orders.map((o) => o.userId));
  const isCreatorOrAdmin = user?.role === "creator" || user?.role === "admin"
    || user?.id === raffle.creatorId;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 md:py-14">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-slate-500 hover:text-white font-bold transition-all group mb-8"
      >
        <div className="bg-slate-900 p-2 rounded-lg border border-slate-800 group-hover:border-slate-600">
          <ArrowLeft size={16} />
        </div>
        <span className="text-sm uppercase tracking-widest">Voltar</span>
      </button>

      {/* Test badge */}
      {raffle.isTest && (
        <div className="mb-6 flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 px-5 py-3 rounded-2xl w-fit">
          <FlaskConical size={16} className="text-amber-400" />
          <span className="text-xs font-black text-amber-400 uppercase tracking-widest">
            Rifa de Simulação — Nenhum pagamento real será cobrado
          </span>
        </div>
      )}

      {/* Botão ao vivo — visível quando sorteio está ativo */}
      {raffle.status === "active" && (
        <div className="mb-6 flex items-center gap-3">
          <a
            href={`/draw/${raffle.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-400 hover:text-red-300 px-5 py-2.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all"
          >
            <motion.span
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            >
              🔴
            </motion.span>
            <Radio size={14} />
            Assistir Sorteio ao Vivo
          </a>
          <span className="text-[10px] text-slate-600 font-bold hidden sm:block">
            Compartilhe este link com os participantes
          </span>
        </div>
      )}

      {/* Winner banner */}
      {raffle.status === "finished" && raffle.winnerNumber && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 p-6 bg-gradient-to-r from-yellow-500/20 to-amber-500/10 border border-yellow-500/30 rounded-3xl flex flex-col sm:flex-row items-center gap-4"
        >
          <div className="w-16 h-16 bg-yellow-500/20 rounded-2xl flex items-center justify-center shrink-0">
            <Trophy size={32} className="text-yellow-400" />
          </div>
          <div className="text-center sm:text-left">
            <p className="text-[10px] font-black text-yellow-500 uppercase tracking-widest mb-1">
              Sorteio Realizado em{" "}
              {tsToDate(raffle.drawnAt).toLocaleDateString("pt-BR")}
            </p>
            <p className="text-2xl font-black text-white">
              🏆 Ganhador:{" "}
              <span className="text-yellow-400">{raffle.winnerName}</span>
            </p>
            <p className="text-slate-400 font-bold">
              Número Sorteado:{" "}
              <span className="text-white font-black">
                #{String(raffle.winnerNumber).padStart(3, "0")}
              </span>
            </p>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        {/* ── LEFT ──────────────────────────────────────────────────── */}
        <div className="lg:col-span-8 space-y-8">

          {/* Galeria de fotos — visível apenas no mobile (lg esconde pois está no sidebar) */}
          {raffle.images?.filter(Boolean).length > 1 && (
            <div className="block lg:hidden">
              <ImageGallery
                images={raffle.images.filter(Boolean)}
                alt={raffle.title}
              />
            </div>
          )}
          {/* Info */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-900/50 rounded-[2.5rem] border border-slate-800 p-8 md:p-12 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/5 rounded-full blur-[80px]" />
            <div className="flex items-center gap-3 mb-5">
              <div className="bg-indigo-600/10 p-2 rounded-lg text-indigo-400 border border-indigo-500/20">
                <Ticket size={18} />
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
            <h1 className="text-3xl sm:text-4xl font-black text-white mb-5 tracking-tight leading-none">
              {raffle.title}
            </h1>
            <div className="flex flex-wrap gap-3 mb-7">
              <div className="flex items-center gap-2 bg-slate-950 px-4 py-2.5 rounded-xl border border-slate-800">
                <Calendar size={14} className="text-indigo-500" />
                <span className="text-sm font-bold text-slate-300">
                  {tsToDate(raffle.drawDate).toLocaleDateString("pt-BR")}
                </span>
              </div>
              <div className="flex items-center gap-2 bg-indigo-600/10 px-4 py-2.5 rounded-xl border border-indigo-600/20">
                <Wallet size={14} className="text-indigo-400" />
                <span className="text-base font-black text-indigo-400">
                  R$ {raffle.pricePerNumber.toFixed(2)} / cota
                </span>
              </div>
              <div className="flex items-center gap-2 bg-slate-950 px-4 py-2.5 rounded-xl border border-slate-800">
                <Users size={14} className="text-emerald-400" />
                <span className="text-sm font-bold text-slate-300">
                  {participantIds.size} participantes
                </span>
              </div>
            </div>
            <p className="text-slate-400 font-medium leading-relaxed mb-8 border-l-4 border-indigo-600 pl-5 text-sm sm:text-base">
              {raffle.description}
            </p>
            {/* Progress */}
            <div className="space-y-2">
              <div className="flex justify-between items-end">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  Progresso
                </span>
                <span className="text-xl font-black text-white">
                  {progress.toFixed(0)}%
                </span>
              </div>
              <div className="h-4 bg-slate-950 rounded-full border border-slate-800 p-0.5">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 1.2, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-indigo-600 to-indigo-400 rounded-full"
                />
              </div>
              {/* Meta e vendidas: apenas criador/admin */}
              {isCreatorOrAdmin && (
                <div className="flex justify-between text-[10px] font-black tracking-widest uppercase text-slate-600">
                  <span>{raffle.soldNumbers.length} vendidas</span>
                  <span>Meta: {raffle.totalNumbers}</span>
                </div>
              )}
            </div>
          </motion.div>

          {/* Number Grid */}
          <div className="bg-slate-900 rounded-[2.5rem] border border-slate-800 p-8 md:p-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
              <div>
                <h2 className="text-xl font-black text-white mb-1">
                  Quadro de{" "}
                  <span className="text-indigo-400 italic">Números</span>
                </h2>
                <p className="text-slate-500 text-sm">
                  Clique para selecionar suas cotas.
                </p>
              </div>
              <div className="flex flex-wrap gap-3 text-[10px] font-black uppercase tracking-widest">
                {[
                  { color: "bg-slate-800 border border-slate-700", label: "Livre" },
                  { color: "bg-indigo-600", label: "Selecionado" },
                  { color: "bg-slate-950 border border-slate-900", label: "Vendido" },
                ].map((l) => (
                  <div key={l.label} className="flex items-center gap-1.5 text-slate-400">
                    <div className={`w-3 h-3 rounded ${l.color}`} />
                    <span>{l.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {raffle.status === "active" && (
              <div className="flex items-center gap-3 mb-5 p-3 bg-slate-950 rounded-xl border border-slate-800 flex-wrap">
                <Zap size={15} className="text-indigo-400 shrink-0" />
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">
                  Compra Rápida:
                </span>
                <select
                  value={quickQty}
                  onChange={(e) => setQuickQty(Number(e.target.value))}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-bold text-white outline-none"
                >
                  {[1, 5, 10, 25, 50, 100].map((n) => (
                    <option key={n} value={n}>{n} {n === 1 ? "cota" : "cotas"}</option>
                  ))}
                </select>
                <button
                  onClick={quickPick}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-1.5 rounded-lg text-xs font-black transition-all"
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
                const isWinner = raffle.winnerNumber === num;
                return (
                  <button
                    key={num}
                    disabled={isSold || raffle.status === "finished"}
                    onClick={() => toggleNumber(num)}
                    className={`aspect-square rounded-xl text-[10px] font-black transition-all flex items-center justify-center
                      ${isWinner
                        ? "bg-yellow-500 text-slate-900 shadow-lg shadow-yellow-500/30 scale-110"
                        : isSold
                        ? "bg-slate-950 text-slate-700 cursor-not-allowed border border-slate-900"
                        : isSelected
                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 scale-110 z-10"
                        : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white border border-slate-700 hover:scale-105 active:scale-95"
                      }`}
                  >
                    {isWinner ? "🏆" : num.toString().padStart(raffle.totalNumbers >= 100 ? 3 : 2, "0")}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── RIGHT (Cart) ──────────────────────────────────────────── */}
        <div className="lg:col-span-4 lg:sticky lg:top-24 h-fit space-y-6">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-slate-900 rounded-[2.5rem] border border-slate-800 shadow-2xl overflow-hidden"
          >
            <div className="relative">
              <ImageGallery
                images={raffle.images?.filter(Boolean).length ? raffle.images.filter(Boolean) : [img]}
                alt={raffle.title}
                className="rounded-none"
              />
              <div className="absolute top-4 left-4 flex items-center gap-2 bg-indigo-600 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-white shadow-xl z-10">
                <Sparkles size={12} />
                <span>Prêmio</span>
              </div>
              {raffle.isTest && (
                <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-amber-500 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase text-slate-900 z-10">
                  <FlaskConical size={12} />
                  TESTE
                </div>
              )}
            </div>

            <div className="p-7 space-y-5">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="bg-indigo-600/10 p-2.5 rounded-xl text-indigo-400 border border-indigo-500/20">
                    <ShoppingCart size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Carrinho</p>
                    <p className="text-lg font-black text-white">{selectedNumbers.length} cotas</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total</p>
                  <p className="text-xl font-black text-indigo-400">
                    R$ {totalSelected.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              <div className="min-h-[32px] max-h-24 overflow-y-auto custom-scrollbar flex flex-wrap gap-1.5">
                <AnimatePresence>
                  {selectedNumbers.length > 0 ? (
                    selectedNumbers.map((num) => (
                      <motion.button
                        key={num}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        onClick={() => toggleNumber(num)}
                        className="bg-slate-950 text-indigo-400 px-2.5 py-1 rounded-lg text-[10px] font-black border border-indigo-500/20 hover:text-red-400 transition-colors"
                      >
                        #{num.toString().padStart(3, "0")}
                      </motion.button>
                    ))
                  ) : (
                    <p className="text-slate-600 text-xs font-bold italic w-full text-center py-1">
                      Nenhum número selecionado
                    </p>
                  )}
                </AnimatePresence>
              </div>

              {raffle.status === "active" ? (
                <button
                  disabled={selectedNumbers.length === 0}
                  onClick={handleBuy}
                  className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black text-lg shadow-xl shadow-indigo-600/20 hover:bg-indigo-500 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-40 flex items-center justify-center gap-3"
                >
                  <Wallet size={20} />
                  FINALIZAR COMPRA
                </button>
              ) : (
                <div className="w-full bg-slate-800 text-slate-500 py-4 rounded-2xl font-black text-base text-center border border-slate-700">
                  {raffle.status === "finished" ? "Sorteio Encerrado" : "Indisponível"}
                </div>
              )}

              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2 text-slate-600">
                  <ShieldCheck size={13} />
                  <p className="text-[10px] font-bold uppercase tracking-widest">
                    {raffle.isTest ? "Modo Simulação" : "Pagamento Seguro"}
                  </p>
                </div>
                <button
                  onClick={shareRaffle}
                  className="flex items-center gap-1.5 text-[10px] font-black text-slate-500 hover:text-indigo-400 transition-colors uppercase tracking-widest"
                >
                  <Share2 size={13} />
                  Partilhar
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── Order Confirmation Modal ── */}
      {confirmData && raffle && (
        <OrderConfirmModal
          orderId={confirmData.orderId}
          raffleTitle={raffle.title}
          raffleId={raffle.id}
          numbers={confirmData.numbers}
          totalAmount={confirmData.total}
          status={confirmData.status}
          paidAt={confirmData.status === "paid" ? new Date() : undefined}
          onClose={() => setConfirmData(null)}
        />
      )}

      {/* ── Payment Modal (rifas reais) ── */}
      {showPaymentModal && raffle && currentUser && (
        <PaymentModal
          raffleId={raffle.id}
          raffleTitle={raffle.title}
          amount={selectedNumbers.length * raffle.pricePerNumber}
          qtd={selectedNumbers.length}
          user={currentUser}
          selectedNumbers={selectedNumbers}
          onSuccess={async (orderId, numbers, total, status) => {
            setShowPaymentModal(false);
            setConfirmData({ orderId, numbers, total, status });
            setSelectedNumbers([]);
            // Atualiza rifa
            if (raffle) {
              const updated = await import("../lib/firebaseService").then(m => m.getRaffle(raffle.id));
              if (updated) setRaffle(updated);
            }
          }}
          onClose={() => setShowPaymentModal(false)}
        />
      )}

      {/* ── Complete Profile Modal ────────────────────────────────────── */}
      {showProfileModal && currentUser && (
        <CompleteProfileModal
          user={currentUser}
          onComplete={(updated) => {
            setCurrentUser(updated);
            setShowProfileModal(false);
            setModal("choose");
          }}
          onClose={() => setShowProfileModal(false)}
        />
      )}

      {/* ── MODALS ────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {modal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xl">
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0 }}
              className="bg-slate-900 w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-2xl border border-slate-800"
            >

              {/* ── Escolha forma de pagamento (rifas reais) ── */}
              {modal === "choose" && (
                <div className="p-8 space-y-5">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-black text-white">Forma de Pagamento</h2>
                    <button onClick={() => setModal(null)} className="text-slate-500 hover:text-white">
                      <X size={22} />
                    </button>
                  </div>
                  <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800 text-center">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Total a pagar</p>
                    <p className="text-3xl font-black text-indigo-400">
                      R$ {totalSelected.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">{selectedNumbers.length} cota(s)</p>
                  </div>

                  {raffle.isTest ? (
                    /* ── MODO TESTE ── */
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-2.5">
                        <FlaskConical size={15} className="text-amber-400 shrink-0" />
                        <p className="text-xs text-amber-300 font-medium">Rifa de simulação — nenhum valor real será cobrado</p>
                      </div>
                      <button
                        onClick={handleSimPayment}
                        className="w-full bg-amber-500 hover:bg-amber-400 text-slate-900 py-5 rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-3"
                      >
                        <FlaskConical size={22} />
                        SIMULAR PAGAMENTO (TESTE)
                      </button>
                    </div>
                  ) : (
                    /* ── PAGAMENTO REAL ── */
                    <div className="space-y-4">
                      {/* Resumo do valor */}
                      <div className="bg-slate-950 rounded-2xl border border-slate-800 divide-y divide-slate-800">
                        <div className="flex justify-between items-center px-5 py-3">
                          <span className="text-xs font-bold text-slate-500">{selectedNumbers.length} cota(s) × R$ {raffle.pricePerNumber.toFixed(2)}</span>
                          <span className="text-lg font-black text-emerald-400">R$ {totalSelected.toLocaleString("pt-BR",{minimumFractionDigits:2})}</span>
                        </div>
                      </div>

                      {/* Seleção do método */}
                      <div className="flex p-1 bg-slate-950 rounded-2xl border border-slate-800 gap-1">
                        <button
                          onClick={() => setPayMethod("pix")}
                          className={`flex-1 py-3 rounded-xl text-sm font-black transition-all flex items-center justify-center gap-2 ${payMethod === "pix" ? "bg-[#32BCAD] text-white shadow-lg" : "text-slate-400 hover:text-white"}`}
                        >
                          <span className="text-base">⚡</span> PIX
                        </button>
                        <button
                          onClick={() => setPayMethod("card")}
                          className={`flex-1 py-3 rounded-xl text-sm font-black transition-all flex items-center justify-center gap-2 ${payMethod === "card" ? "bg-indigo-600 text-white shadow-lg" : "text-slate-400 hover:text-white"}`}
                        >
                          <CreditCard size={16} /> Cartão
                        </button>
                      </div>

                      {/* PIX — QR Code direto */}
                      {payMethod === "pix" && (
                        <div className="space-y-3">
                          <div className="bg-slate-950 rounded-2xl border border-[#32BCAD]/20 p-4 space-y-2">
                            <div className="flex items-center gap-2 text-[#32BCAD]">
                              <span className="text-lg">⚡</span>
                              <p className="text-sm font-black">Aprovação instantânea</p>
                            </div>
                            <p className="text-xs text-slate-400 leading-relaxed">
                              Um QR Code será gerado na próxima tela. Abra o app do seu banco e escaneie — sem precisar de conta no Mercado Pago.
                            </p>
                          </div>
                          <button
                            onClick={handlePixPayment}
                            disabled={mpLoading}
                            className="w-full bg-[#32BCAD] hover:bg-[#28a99b] text-white py-5 rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-3 disabled:opacity-50 shadow-xl shadow-[#32BCAD]/20"
                          >
                            {mpLoading ? <><Loader2 size={22} className="animate-spin"/> Gerando PIX...</> : <>⚡ GERAR QR CODE PIX</>}
                          </button>
                        </div>
                      )}

                      {/* Cartão — redireciona para checkout MP */}
                      {payMethod === "card" && (
                        <div className="space-y-3">
                          <div className="bg-slate-950 rounded-2xl border border-indigo-500/20 p-4 space-y-2">
                            <div className="flex items-center gap-2 text-indigo-400">
                              <CreditCard size={16}/>
                              <p className="text-sm font-black">Débito ou Crédito</p>
                            </div>
                            <p className="text-xs text-slate-400 leading-relaxed">
                              Você será direcionado para o checkout seguro do Mercado Pago. Não é necessário ter conta — pode pagar como visitante.
                            </p>
                          </div>
                          <button
                            onClick={handleMpPayment}
                            disabled={mpLoading}
                            className="w-full bg-[#009ee3] hover:bg-[#0088c7] text-white py-5 rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-3 disabled:opacity-50 shadow-xl shadow-[#009ee3]/20"
                          >
                            {mpLoading ? <><Loader2 size={22} className="animate-spin"/> Redirecionando...</> : <><CreditCard size={22}/> PAGAR COM CARTÃO</>}
                          </button>
                        </div>
                      )}

                      <p className="text-center text-[10px] text-slate-600 font-bold">
                        🔒 Pagamento seguro · Seus dados são protegidos
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* ── PIX REAL — QR Code ── */}
              {modal === "pix_real" && pixData && (
                <div className="p-8 space-y-5">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-black text-white flex items-center gap-2">
                      <span className="text-[#32BCAD]">⚡</span> Pagar com PIX
                    </h2>
                    <button onClick={() => setModal(null)} className="text-slate-500 hover:text-white"><X size={22}/></button>
                  </div>

                  {pixStatus === "approved" ? (
                    <div className="text-center py-8 space-y-4">
                      <div className="text-6xl">✅</div>
                      <p className="text-xl font-black text-emerald-400">Pagamento confirmado!</p>
                    </div>
                  ) : (
                    <>
                      {/* QR Code */}
                      <div className="flex flex-col items-center gap-4">
                        {pixData.qrBase64 ? (
                          <img
                            src={`data:image/png;base64,${pixData.qrBase64}`}
                            alt="QR Code PIX"
                            className="w-52 h-52 rounded-2xl border-4 border-[#32BCAD]/30"
                          />
                        ) : (
                          <div className="w-52 h-52 bg-white rounded-2xl flex items-center justify-center">
                            <p className="text-xs text-slate-800 text-center px-4">QR Code indisponível</p>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-[#32BCAD] text-sm font-black">
                          <div className="w-2 h-2 rounded-full bg-[#32BCAD] animate-pulse"/>
                          Aguardando pagamento...
                        </div>
                      </div>

                      {/* Código copia e cola */}
                      <div className="space-y-2">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Ou copie o código PIX:</p>
                        <div className="flex gap-2">
                          <input
                            readOnly
                            value={pixData.qrCode}
                            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-300 font-mono"
                          />
                          <button
                            onClick={() => { navigator.clipboard.writeText(pixData.qrCode); }}
                            className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2.5 rounded-xl text-xs font-black transition-all border border-slate-700"
                          >
                            Copiar
                          </button>
                        </div>
                      </div>

                      <div className="bg-slate-950 rounded-2xl border border-slate-800 p-4 space-y-1.5 text-xs text-slate-400">
                        <p>1. Abra o app do seu banco</p>
                        <p>2. Vá em <strong className="text-white">Pix → Pagar com QR Code</strong></p>
                        <p>3. Escaneie o código acima</p>
                        <p>4. Confirme o pagamento de <strong className="text-emerald-400">R$ {totalSelected.toLocaleString("pt-BR",{minimumFractionDigits:2})}</strong></p>
                        <p className="text-slate-500">✓ Confirmação automática em segundos</p>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* ── PIX Simulação ── */}
              {modal === "pix_sim" && (
                <div className="p-8 space-y-5">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-black text-white">
                      <span className="text-amber-400">Simulação</span> — PIX
                    </h2>
                    <button onClick={() => setModal(null)} className="text-slate-500 hover:text-white"><X size={22} /></button>
                  </div>
                  <div className="bg-slate-950 rounded-2xl p-5 text-center border border-amber-500/20 space-y-3">
                    <div className="w-32 h-32 mx-auto bg-white rounded-2xl flex items-center justify-center shadow">
                      <QrCode size={90} className="text-slate-900" />
                    </div>
                    <p className="text-xs text-amber-400 font-bold">⚠️ QR Code de simulação — não é real</p>
                  </div>
                  <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-black text-slate-500 uppercase mb-1">Chave PIX (simulada)</p>
                      <p className="text-sm font-bold text-indigo-400">ggrifas@financeiro.com.br</p>
                    </div>
                    <button
                      onClick={copyPixKey}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-black transition-all ${copied ? "bg-emerald-600 text-white" : "bg-slate-800 text-slate-300"}`}
                    >
                      {copied ? <CheckCircle2 size={13} /> : <Copy size={13} />}
                      {copied ? "Copiado!" : "Copiar"}
                    </button>
                  </div>
                  <div className="bg-indigo-600/10 rounded-xl p-4 border border-indigo-500/20 text-center">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Valor</p>
                    <p className="text-2xl font-black text-indigo-400">
                      R$ {totalSelected.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <button
                    onClick={handleConfirmSim}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-5 rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-3"
                  >
                    <CheckCircle2 size={22} />
                    JÁ PAGUEI — CONFIRMAR
                  </button>
                </div>
              )}

              {/* ── Redirecionando para MP ── */}
              {modal === "mp_redirect" && (
                <div className="p-10 text-center space-y-5">
                  <div className="w-20 h-20 mx-auto bg-[#00b1ea]/10 rounded-3xl flex items-center justify-center">
                    <Loader2 size={40} className="text-[#00b1ea] animate-spin" />
                  </div>
                  <h2 className="text-xl font-black text-white">Redirecionando para o Mercado Pago...</h2>
                  <p className="text-slate-500 text-sm">Você será redirecionado para concluir o pagamento com segurança.</p>
                </div>
              )}

              {/* ── Confirmando ── */}
              {modal === "confirming" && (
                <div className="p-10 text-center space-y-5">
                  <div className="w-20 h-20 mx-auto bg-indigo-600/10 rounded-3xl flex items-center justify-center">
                    <RefreshCw size={40} className="text-indigo-400 animate-spin" />
                  </div>
                  <h2 className="text-xl font-black text-white">Confirmando pagamento...</h2>
                </div>
              )}

              {/* ── Sucesso ── */}
              {modal === "success" && (
                <div className="p-8 text-center space-y-5">
                  <div className="w-24 h-24 bg-emerald-500/10 text-emerald-400 rounded-[2rem] flex items-center justify-center mx-auto border border-emerald-500/20">
                    <CheckCircle2 size={52} />
                  </div>
                  <h2 className="text-3xl font-black text-white">Cotas Confirmadas! 🎉</h2>
                  <p className="text-slate-500 font-medium text-sm leading-relaxed">
                    Seus números foram reservados com sucesso. Boa sorte no sorteio!
                  </p>
                  <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-left">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Protocolo</p>
                    <p className="text-xs font-mono text-indigo-400 break-all">{pendingOrderId}</p>
                  </div>
                  <button
                    onClick={() => setModal(null)}
                    className="w-full bg-slate-800 hover:bg-slate-700 text-white py-4 rounded-2xl font-black text-base transition-all border border-slate-700"
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
