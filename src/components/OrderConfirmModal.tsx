import { motion } from "motion/react";
import { CheckCircle2, Ticket, Calendar, Hash, Share2, X, Clock } from "lucide-react";
import { Link } from "react-router-dom";

interface Props {
  orderId:     string;
  raffleTitle: string;
  raffleId:    string;
  numbers:     number[];
  totalAmount: number;
  status:      "paid" | "pending";
  paidAt?:     Date;
  onClose:     () => void;
}

export default function OrderConfirmModal({
  orderId, raffleTitle, raffleId, numbers, totalAmount, status, paidAt, onClose
}: Props) {
  const protocol = orderId.slice(0,8).toUpperCase();

  const share = () => {
    const msg = `🎟️ Comprei ${numbers.length} cota(s) na rifa "${raffleTitle}"!\nMeus números: ${numbers.map(n=>"#"+String(n).padStart(3,"0")).join(", ")}\nPlataforma: AZARÃO`;
    if (navigator.share) navigator.share({ text: msg });
    else navigator.clipboard.writeText(msg);
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/90 backdrop-blur-xl">
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-slate-900 w-full sm:max-w-md rounded-t-[2rem] sm:rounded-[2rem] border border-slate-800 shadow-2xl overflow-hidden"
      >
        {/* Header status */}
        <div className={`p-6 text-center border-b border-slate-800 ${status === "paid" ? "bg-emerald-500/5" : "bg-amber-500/5"}`}>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.1 }}
            className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-3 ${
              status === "paid"
                ? "bg-emerald-500/20 border-2 border-emerald-500/30"
                : "bg-amber-500/20 border-2 border-amber-500/30"
            }`}
          >
            {status === "paid"
              ? <CheckCircle2 size={36} className="text-emerald-400"/>
              : <Clock size={36} className="text-amber-400"/>
            }
          </motion.div>
          <h2 className="text-xl font-black text-white mb-1">
            {status === "paid" ? "Pagamento Confirmado! 🎉" : "Cotas Reservadas!"}
          </h2>
          <p className="text-sm text-slate-400">
            {status === "paid"
              ? "Suas cotas estão garantidas no sorteio."
              : "Suas cotas estão reservadas. Aguardando confirmação do pagamento."}
          </p>
        </div>

        <div className="p-6 space-y-5">
          {/* Protocolo */}
          <div className="bg-slate-950 rounded-2xl border border-slate-800 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Hash size={16} className="text-indigo-400"/>
              <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Protocolo</p>
                <p className="text-lg font-black text-white font-mono">{protocol}</p>
              </div>
            </div>
            {paidAt && (
              <div className="text-right">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Confirmado em</p>
                <p className="text-xs font-bold text-emerald-400">
                  {paidAt.toLocaleDateString("pt-BR")} {paidAt.toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"})}
                </p>
              </div>
            )}
          </div>

          {/* Rifa */}
          <div className="bg-slate-950 rounded-2xl border border-slate-800 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Ticket size={15} className="text-indigo-400"/>
              <p className="text-sm font-black text-white">{raffleTitle}</p>
            </div>

            {/* Números comprados */}
            <div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                Suas {numbers.length} cota(s) reservada(s):
              </p>
              <div className="flex flex-wrap gap-1.5">
                {numbers.map((n) => (
                  <motion.span
                    key={n}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.05 * (numbers.indexOf(n)) }}
                    className={`text-xs font-black px-2.5 py-1.5 rounded-xl border ${
                      status === "paid"
                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                        : "bg-amber-500/20 text-amber-300 border-amber-500/30"
                    }`}
                  >
                    #{String(n).padStart(3,"0")}
                  </motion.span>
                ))}
              </div>
            </div>

            {/* Valor */}
            <div className="flex justify-between items-center pt-1 border-t border-slate-800">
              <span className="text-xs text-slate-500 font-bold">Valor pago</span>
              <span className="text-sm font-black text-emerald-400">
                R$ {totalAmount.toLocaleString("pt-BR",{minimumFractionDigits:2})}
              </span>
            </div>
          </div>

          {/* Status pending aviso */}
          {status === "pending" && (
            <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
              <Clock size={16} className="text-amber-400 shrink-0 mt-0.5"/>
              <p className="text-xs text-amber-300 leading-relaxed">
                Seus números já estão reservados. Assim que o pagamento for confirmado pelo banco, o status será atualizado automaticamente.
              </p>
            </div>
          )}

          {/* Ações */}
          <div className="flex gap-3">
            <button onClick={share}
              className="flex-1 flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 py-3.5 rounded-2xl font-bold text-sm transition-all border border-slate-700">
              <Share2 size={16}/> Compartilhar
            </button>
            <Link to="/my-orders" onClick={onClose}
              className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white py-3.5 rounded-2xl font-bold text-sm transition-all">
              <Ticket size={16}/> Meus Pedidos
            </Link>
          </div>

          <button onClick={onClose} className="w-full text-center text-xs text-slate-600 hover:text-slate-400 transition-colors py-1">
            Fechar
          </button>
        </div>
      </motion.div>
    </div>
  );
}
