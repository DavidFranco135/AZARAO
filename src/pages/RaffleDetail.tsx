import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { Ticket, Calendar, ShieldCheck, Share2, ShoppingCart, CheckCircle2, Wallet, X, Sparkles } from "lucide-react";
import { Raffle, User } from "../types";

interface RaffleDetailProps {
  user: User | null;
}

export default function RaffleDetail({ user }: RaffleDetailProps) {
  const { id } = useParams();
  const [raffle, setRaffle] = useState<Raffle | null>(null);
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(false);
  const [orderComplete, setOrderComplete] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`/api/raffles/${id}`)
      .then(res => res.json())
      .then(data => {
        setRaffle(data);
        setLoading(false);
      });
  }, [id]);

  const toggleNumber = (num: number) => {
    if (raffle?.soldNumbers?.includes(num)) return;
    if (selectedNumbers.includes(num)) {
      setSelectedNumbers(selectedNumbers.filter(n => n !== num));
    } else {
      setSelectedNumbers([...selectedNumbers, num]);
    }
  };

  const handleBuy = async () => {
    if (!user) {
      navigate("/login");
      return;
    }

    setBuying(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ raffleId: id, numbers: selectedNumbers })
      });
      
      const data = await res.json();
      if (res.ok) {
        // Simulate payment automatically for this demo
        await fetch(`/api/orders/${data.orderId}/pay`, { method: "POST" });
        setOrderComplete(data.orderId);
        // Refresh raffle data
        const refresh = await fetch(`/api/raffles/${id}`);
        setRaffle(await refresh.json());
        setSelectedNumbers([]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setBuying(false);
    }
  };

  if (loading) return <div className="p-10 text-center text-slate-400">Carregando detalhes...</div>;
  if (!raffle) return <div className="p-10 text-center text-slate-400 font-bold">Infelizmente, não encontramos este sorteio.</div>;

  const progress = (raffle.soldNumbers?.length || 0) / raffle.total_numbers * 100;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 md:py-16">
      <div className="mb-8 md:mb-12">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-3 text-slate-500 hover:text-white font-bold transition-all group"
        >
          <div className="bg-slate-900 p-2 rounded-lg border border-slate-800 group-hover:border-slate-700 transition-all">
            <X size={18} className="rotate-45" />
          </div>
          <span className="text-sm uppercase tracking-widest">Voltar para Sorteios</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left: Main Content Selection */}
        <div className="lg:col-span-8 space-y-12">
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900/50 rounded-[3rem] border border-slate-800 p-10 md:p-14 relative overflow-hidden backdrop-blur-sm shadow-xl"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/5 rounded-full blur-[80px]"></div>
            
            <div className="flex items-center gap-3 mb-8">
              <div className="bg-indigo-600/10 p-2 rounded-lg text-indigo-400 border border-indigo-500/20">
                <Ticket size={24} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Sorteio Exclusivo</span>
            </div>

            <h1 className="text-4xl md:text-5xl font-black text-white mb-8 tracking-tight leading-none">{raffle.title}</h1>
            
            <div className="flex flex-wrap gap-6 mb-12">
              <div className="flex items-center gap-2 bg-slate-950 px-5 py-3 rounded-2xl border border-slate-800">
                <Calendar size={18} className="text-indigo-500" />
                <span className="text-sm font-bold text-slate-300">Data: {new Date(raffle.draw_date).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2 bg-indigo-600/10 px-5 py-3 rounded-2xl border border-indigo-600/20">
                <Wallet size={18} className="text-indigo-400" />
                <span className="text-sm font-black text-indigo-400 text-lg">R$ {raffle.price_per_number.toFixed(2)}</span>
              </div>
            </div>

            <p className="text-slate-400 font-medium text-lg leading-relaxed mb-12 border-l-4 border-indigo-600 pl-8">
              {raffle.description}
            </p>

            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">ARRECADAÇÃO ATUAL</span>
                <span className="text-3xl font-black text-white">{progress.toFixed(0)}%</span>
              </div>
              <div className="h-6 bg-slate-950 rounded-full border border-slate-800 p-1.5 shadow-inner">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-indigo-600 to-indigo-400 rounded-full shadow-lg shadow-indigo-600/40 relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.1)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.1)_50%,rgba(255,255,255,0.1)_75%,transparent_75%,transparent)] bg-[length:20px_20px] animate-[slide_1s_linear_infinite]"></div>
                </motion.div>
              </div>
              <div className="flex items-center justify-between text-[10px] font-black tracking-widest uppercase text-slate-500">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></div>
                  <span>{raffle.soldNumbers?.length || 0} Cotas Vendidas</span>
                </div>
                <span>Meta: {raffle.total_numbers}</span>
              </div>
            </div>
          </motion.div>

          <div className="bg-slate-900 rounded-[3rem] border border-slate-800 p-10 md:p-14 shadow-xl relative overflow-hidden">
             <div className="flex items-center justify-between mb-12 flex-wrap gap-6">
              <div>
                <h2 className="text-2xl font-black text-white mb-2">Quadro de <span className="text-indigo-400 italic">Números</span></h2>
                <p className="text-slate-500 font-medium">Escolha suas cotas da sorte clicando nos números abaixo.</p>
              </div>
              <div className="flex gap-6 text-[10px] font-black uppercase tracking-widest">
                <div className="flex items-center gap-2 text-slate-500">
                  <div className="w-3 h-3 bg-slate-800 rounded shadow-sm"></div>
                  <span>Livre</span>
                </div>
                <div className="flex items-center gap-2 text-indigo-400">
                  <div className="w-3 h-3 bg-indigo-600 rounded shadow-lg shadow-indigo-600/20"></div>
                  <span>Sua Cota</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <div className="w-3 h-3 bg-slate-950 rounded line-through border border-white/5"></div>
                  <span>Vendido</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-3 max-h-[500px] overflow-y-auto px-1 py-1 custom-scrollbar">
              {Array.from({ length: raffle.total_numbers }).map((_, i) => {
                const num = i + 1;
                const isSold = raffle.soldNumbers?.includes(num);
                const isSelected = selectedNumbers.includes(num);

                return (
                  <button
                    key={num}
                    disabled={isSold}
                    onClick={() => toggleNumber(num)}
                    className={`
                      aspect-square rounded-2xl text-xs font-black transition-all transform flex items-center justify-center
                      ${isSold ? 'bg-slate-950 text-slate-800 cursor-not-allowed line-through border border-white/5 opacity-50' : 
                        isSelected ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/30 scale-110 z-10' : 
                        'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white border border-slate-700 hover:scale-105 active:scale-95'
                      }
                    `}
                  >
                    {num.toString().padStart(3, '0')}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Cart Sidebar Sticky */}
        <div className="lg:col-span-4 lg:sticky lg:top-24 h-fit space-y-12">
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-slate-900 rounded-[3rem] border border-slate-800 shadow-2xl overflow-hidden"
          >
            <div className="h-72 relative">
              <img 
                src={JSON.parse(raffle.images)[0] || `https://picsum.photos/seed/${raffle.id}/800/600`} 
                alt={raffle.title}
                className="w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 transition-all duration-1000"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent"></div>
              <div className="absolute top-6 left-6 flex items-center gap-2 bg-indigo-600 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white shadow-xl border border-indigo-400/20">
                <Sparkles size={14} />
                <span>Prêmio Principal</span>
              </div>
            </div>

            <div className="p-10 space-y-8">
              <div className="flex items-center justify-between gap-6 pb-8 border-b border-slate-800">
                <div className="flex items-center gap-4">
                  <div className="bg-indigo-600/10 p-3 rounded-2xl text-indigo-400 border border-indigo-500/20">
                    <ShoppingCart size={24} />
                  </div>
                  <div>
                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Carrinho</h3>
                    <p className="text-xl font-black text-white">{selectedNumbers.length} Cotas</p>
                  </div>
                </div>
                <div className="text-right">
                  <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">SUBTOTAL</h3>
                  <p className="text-2xl font-black text-indigo-400 leading-none">R$ {(selectedNumbers.length * raffle.price_per_number).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 min-h-[40px] max-h-32 overflow-y-auto custom-scrollbar p-1">
                <AnimatePresence>
                  {selectedNumbers.length > 0 ? selectedNumbers.map(num => (
                    <motion.div 
                      key={num}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      className="bg-slate-950 text-indigo-400 px-3 py-1.5 rounded-xl text-[10px] font-black border border-indigo-500/10 inline-flex items-center gap-2 group"
                    >
                      <span>#{num.toString().padStart(3, '0')}</span>
                      <button onClick={() => toggleNumber(num)} className="hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100">
                        <X size={12} />
                      </button>
                    </motion.div>
                  )) : (
                    <p className="text-slate-600 text-xs font-bold italic w-full text-center py-4">Nenhum número selecionado</p>
                  )}
                </AnimatePresence>
              </div>

              <button
                disabled={selectedNumbers.length === 0 || buying}
                onClick={handleBuy}
                className="w-full bg-indigo-600 text-white py-6 rounded-2xl font-black text-xl shadow-xl shadow-indigo-600/20 hover:bg-indigo-500 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-4 group"
              >
                {buying ? (
                  <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Wallet size={24} className="group-hover:rotate-12 transition-transform" />
                    <span>FINALIZAR COMPRA</span>
                  </>
                )}
              </button>

              <div className="space-y-6 pt-8 border-t border-slate-800">
                <div className="flex items-center gap-4 grayscale opacity-50">
                  <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center text-slate-400">
                    <ShieldCheck size={20} />
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Pagamento PIX com Confirmação Imediata</p>
                </div>
                <div className="flex items-center justify-between">
                  <button className="flex items-center gap-2 text-[10px] font-black text-slate-500 hover:text-indigo-400 transition-colors uppercase tracking-widest">
                    <Share2 size={16} />
                    <span>Divulgar Sorteio</span>
                  </button>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 size={14} className="text-emerald-500" />
                    <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Verificado</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Success Modal Overlay */}
      <AnimatePresence>
        {orderComplete && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-xl">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-slate-900 w-full max-w-xl rounded-[3rem] overflow-hidden shadow-2xl border border-slate-800 text-center p-12 md:p-20 relative"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-[50px]"></div>
              
              <button 
                onClick={() => setOrderComplete(null)}
                className="absolute top-10 right-10 text-slate-500 hover:text-white transition-colors"
              >
                <X size={28} />
              </button>

              <div className="w-32 h-32 bg-emerald-500/10 text-emerald-400 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 shadow-2xl shadow-emerald-500/20 border border-emerald-500/20">
                <CheckCircle2 size={64} />
              </div>

              <h2 className="text-4xl font-black text-white mb-6 tracking-tight leading-none">Cotas Reservadas com <span className="text-emerald-500 italic">Sucesso</span></h2>
              <p className="text-slate-500 font-medium text-lg mb-12 leading-relaxed">
                Excelente escolha! Seus números foram validados e o sistema já sincronizou seu pagamento. Agora é torcer pelo sorteio!
              </p>

              <div className="p-8 bg-slate-950 rounded-[2rem] border border-slate-800 mb-12 text-left relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-100 transition-opacity">
                   <ShieldCheck className="text-indigo-400" size={40} />
                </div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">Protocolo de Segurança</p>
                <p className="text-xs font-mono text-indigo-400 break-all font-black">{orderComplete}</p>
              </div>

              <button 
                onClick={() => setOrderComplete(null)}
                className="w-full bg-slate-800 hover:bg-slate-700 text-white py-6 rounded-2xl font-black text-lg transition-all border border-slate-700 hover:scale-[1.02] active:scale-[0.98]"
              >
                VOLTAR AOS SORTEIOS
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
