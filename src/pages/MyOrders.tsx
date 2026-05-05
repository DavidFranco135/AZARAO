import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Ticket, Trophy, Clock, CheckCircle2, ChevronRight,
  ShoppingBag, Calendar, Trash2, AlertTriangle,
} from "lucide-react";
import { User, Order, Raffle } from "../types";
import { getUserOrders, getRaffle, cancelPendingOrder, tsToDate } from "../lib/firebaseService";

interface OrderWithRaffle extends Order {
  raffle?: Raffle | null;
}

export default function MyOrders({ user }: { user: User | null }) {
  const [orders, setOrders] = useState<OrderWithRaffle[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const load = async () => {
    if (!user) return;
    const raw = await getUserOrders(user.id);
    const withRaffles = await Promise.all(
      raw.map(async (o) => ({ ...o, raffle: await getRaffle(o.raffleId) }))
    );
    setOrders(withRaffles);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const handleDelete = async (orderId: string) => {
    setDeleting(orderId);
    try {
      await cancelPendingOrder(orderId);
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
    } catch {
      alert("Erro ao apagar pedido. Tente novamente.");
    } finally {
      setDeleting(null);
      setConfirmDelete(null);
    }
  };

  if (loading)
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-10">
      <div>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
          Meus <span className="text-indigo-500 italic">Pedidos</span>
        </h1>
        <p className="text-slate-500 font-medium">
          Acompanhe suas participações e resultados de sorteio.
        </p>
      </div>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-5">
          <div className="w-20 h-20 bg-indigo-600/5 rounded-3xl flex items-center justify-center border-2 border-dashed border-indigo-400/20">
            <ShoppingBag size={36} className="text-indigo-400/30" />
          </div>
          <p className="text-white font-bold text-lg">Você ainda não participou de nenhuma rifa.</p>
          <Link to="/" className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-indigo-600/20">
            Ver Rifas Disponíveis
          </Link>
        </div>
      ) : (
        <div className="space-y-4">

          {/* Ganhadores em destaque */}
          {orders
            .filter((o) => o.raffle?.status === "finished" && o.raffle?.winnerId === user?.id)
            .map((o) => (
              <div key={`winner-${o.id}`} className="p-6 bg-gradient-to-r from-yellow-500/20 to-amber-500/10 border-2 border-yellow-500/40 rounded-3xl">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-yellow-500/20 rounded-2xl flex items-center justify-center shrink-0">
                    <Trophy size={32} className="text-yellow-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-black text-yellow-500 uppercase tracking-widest mb-1">🏆 VOCÊ GANHOU!</p>
                    <p className="text-lg font-black text-white line-clamp-1">{o.raffle?.title ?? o.raffleTitle}</p>
                    <p className="text-sm text-yellow-300 font-bold">
                      Número Sorteado: #{String(o.raffle?.winnerNumber).padStart(3, "0")}
                    </p>
                  </div>
                  <Link to={`/raffle/${o.raffleId}`} className="shrink-0 bg-yellow-500 text-slate-900 px-4 py-2 rounded-xl font-black text-xs uppercase tracking-widest">
                    Ver
                  </Link>
                </div>
              </div>
            ))}

          {/* Lista de pedidos */}
          {orders.map((order) => {
            const raffle = order.raffle;
            const isWinner = raffle?.winnerId === user?.id && raffle?.status === "finished";
            const isFinished = raffle?.status === "finished";
            const isPending = order.status === "pending";
            const img = raffle?.images?.[0] ?? `https://picsum.photos/seed/${order.raffleId}/200`;
            const isConfirmingDelete = confirmDelete === order.id;
            const isDeletingThis = deleting === order.id;

            return (
              <div
                key={order.id}
                className={`bg-slate-900 rounded-2xl border overflow-hidden transition-all ${
                  isWinner ? "border-yellow-500/30" : "border-slate-800"
                }`}
              >
                <div className="flex items-stretch">
                  {/* Imagem */}
                  <div className="w-24 sm:w-32 shrink-0">
                    <img src={img} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>

                  {/* Conteúdo */}
                  <div className="flex-1 p-4 sm:p-5 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="min-w-0">
                        <p className="font-black text-white text-sm sm:text-base line-clamp-1">
                          {raffle?.title ?? order.raffleTitle ?? "Rifa"}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Calendar size={11} className="text-slate-500" />
                          <span className="text-[10px] text-slate-500 font-bold">
                            {tsToDate(order.createdAt).toLocaleDateString("pt-BR")}
                          </span>
                        </div>
                      </div>

                      {/* Status badges + botão apagar */}
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <span className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border ${
                          order.status === "paid"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                        }`}>
                          {order.status === "paid" ? <CheckCircle2 size={11} /> : <Clock size={11} />}
                          {order.status === "paid" ? "Pago" : "Pendente"}
                        </span>

                        {isFinished && (
                          <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border ${
                            isWinner
                              ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                              : "bg-slate-800 text-slate-500 border-slate-700"
                          }`}>
                            {isWinner ? "🏆 Ganhador" : "Não ganhou"}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Números */}
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {order.numbers.slice(0, 10).map((n) => (
                        <span
                          key={n}
                          className={`text-[10px] font-black px-2 py-0.5 rounded-lg border ${
                            raffle?.winnerNumber === n
                              ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                              : "bg-slate-950 text-slate-400 border-slate-800"
                          }`}
                        >
                          #{String(n).padStart(3, "0")}
                        </span>
                      ))}
                      {order.numbers.length > 10 && (
                        <span className="text-[10px] font-black text-slate-500 bg-slate-950 px-2 py-0.5 rounded-lg border border-slate-800">
                          +{order.numbers.length - 10}
                        </span>
                      )}
                    </div>

                    {/* Rodapé: valor + ações */}
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <span className="text-xs text-slate-500 font-bold">{order.numbers.length} cota(s) · </span>
                        <span className="text-xs font-black text-white">R$ {order.totalAmount.toFixed(2)}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Link
                          to={`/raffle/${order.raffleId}`}
                          className="flex items-center gap-1 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
                        >
                          <span>Ver rifa</span>
                          <ChevronRight size={13} />
                        </Link>

                        {/* Botão apagar — sempre visível */}
                        {!isConfirmingDelete ? (
                          <button
                            onClick={() => setConfirmDelete(order.id)}
                            disabled={isDeletingThis}
                            className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-red-400 bg-slate-800 hover:bg-red-500/10 border border-slate-700 hover:border-red-500/20 px-3 py-1.5 rounded-xl transition-all disabled:opacity-40"
                          >
                            <Trash2 size={12} />
                            <span className="hidden sm:inline">Apagar</span>
                          </button>
                        ) : (
                          /* Confirmação inline */
                          <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 px-3 py-1.5 rounded-xl">
                            <AlertTriangle size={12} className="text-red-400 shrink-0" />
                            <span className="text-[10px] text-red-300 font-bold hidden sm:inline">Confirmar?</span>
                            <button
                              onClick={() => handleDelete(order.id)}
                              disabled={isDeletingThis}
                              className="text-[10px] font-black text-red-400 hover:text-red-300 uppercase tracking-widest disabled:opacity-40"
                            >
                              {isDeletingThis ? "..." : "Sim"}
                            </button>
                            <span className="text-slate-600 text-xs">|</span>
                            <button
                              onClick={() => setConfirmDelete(null)}
                              className="text-[10px] font-black text-slate-400 hover:text-white uppercase tracking-widest"
                            >
                              Não
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
