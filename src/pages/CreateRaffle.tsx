import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { PlusCircle, Image as ImageIcon, Calendar, Ticket, Hash, ArrowRight, Sparkles, LayoutDashboard, DollarSign } from "lucide-react";
import { User } from "../types";

interface CreateRaffleProps {
  user: User | null;
}

export default function CreateRaffle({ user }: CreateRaffleProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [pricePerNumber, setPricePerNumber] = useState("");
  const [totalNumbers, setTotalNumbers] = useState("100");
  const [drawDate, setDrawDate] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/raffles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          pricePerNumber: parseFloat(pricePerNumber),
          totalNumbers: parseInt(totalNumbers),
          drawDate,
          images: imageUrl ? [imageUrl] : []
        })
      });

      if (res.ok) {
        navigate("/dashboard");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-16">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-900 rounded-[3rem] border border-slate-800 shadow-2xl shadow-indigo-500/5 overflow-hidden"
      >
        <div className="bg-slate-900 p-12 md:p-16 border-b border-slate-800 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
          <div className="relative z-10">
            <motion.div 
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center space-x-2 bg-indigo-500/10 text-indigo-400 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest mb-8 border border-indigo-500/20"
            >
              <Sparkles size={14} />
              <span>Painel do Criador Profissional</span>
            </motion.div>
            <h1 className="text-4xl md:text-6xl font-black text-white mb-6">Nova <span className="text-indigo-500 italic">Oportunidade</span></h1>
            <p className="text-slate-400 font-medium text-lg max-w-xl">
              Configure sua campanha em segundos e deixe nossa infraestrutura automatizada cuidar das vendas e pagamentos.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-10 md:p-16 space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Basic Info */}
            <div className="space-y-8">
              <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
                <LayoutDashboard size={18} className="text-indigo-500" />
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Informações Essenciais</h3>
              </div>
              
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Título do Sorteio</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: PC Gamer High End + Setup"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-5 text-sm font-bold text-white focus:border-indigo-500 outline-none transition-all placeholder:text-slate-700"
                />
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Descrição</label>
                <textarea
                  required
                  placeholder="Explique detalhadamente o prêmio e as regras do sorteio..."
                  rows={5}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-5 text-sm font-bold text-white focus:border-indigo-500 outline-none transition-all placeholder:text-slate-700 resize-none"
                />
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Imagem Principal (URL)</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-600 group-focus-within:text-indigo-500 transition-colors">
                    <ImageIcon size={18} />
                  </div>
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/..."
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="w-full pl-14 pr-6 py-5 bg-slate-950 border border-slate-800 rounded-2xl text-sm font-bold text-white focus:border-indigo-500 outline-none transition-all placeholder:text-slate-700"
                  />
                </div>
              </div>
            </div>

            {/* Rules & Values */}
            <div className="space-y-8">
              <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
                <DollarSign size={18} className="text-indigo-500" />
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Configuração Financeira</h3>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Valor p/ Cota</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-600 group-focus-within:text-indigo-500 transition-colors">
                      <span className="text-xs font-black">R$</span>
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="0,00"
                      value={pricePerNumber}
                      onChange={(e) => setPricePerNumber(e.target.value)}
                      className="w-full pl-14 pr-6 py-5 bg-slate-950 border border-slate-800 rounded-2xl text-sm font-bold text-white focus:border-indigo-500 outline-none transition-all placeholder:text-slate-700"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Qtd Cotas</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-600 group-focus-within:text-indigo-500 transition-colors">
                      <Ticket size={18} />
                    </div>
                    <select
                      value={totalNumbers}
                      onChange={(e) => setTotalNumbers(e.target.value)}
                      className="w-full pl-14 pr-6 py-5 bg-slate-950 border border-slate-800 rounded-2xl text-sm font-bold text-white focus:border-indigo-500 outline-none transition-all appearance-none cursor-pointer"
                    >
                      {[10, 50, 100, 500, 1000, 5000, 10000].map(n => (
                        <option key={n} value={n} className="bg-slate-900 border-none">{n}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Data do Sorteio</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-600 group-focus-within:text-indigo-500 transition-colors">
                    <Calendar size={18} />
                  </div>
                  <input
                    type="date"
                    required
                    value={drawDate}
                    onChange={(e) => setDrawDate(e.target.value)}
                    className="w-full pl-14 pr-6 py-5 bg-slate-950 border border-slate-800 rounded-2xl text-sm font-bold text-white focus:border-indigo-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="p-8 bg-slate-950 rounded-[2rem] border border-slate-800 space-y-6">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Taxa de Serviço</span>
                  <span className="text-sm font-bold text-indigo-400">10% SaaS Fee</span>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Seu Lucro Estimado</span>
                  <span className="text-2xl font-black text-emerald-400">
                    R$ {(parseFloat(pricePerNumber || "0") * parseInt(totalNumbers) * 0.9).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-12 border-t border-slate-800">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-6 rounded-2xl font-bold text-xl shadow-2xl shadow-indigo-600/20 hover:bg-indigo-500 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center gap-4"
            >
              {loading ? (
                <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <PlusCircle size={28} />
                  <span>LANÇAR SORTEIO AGORA</span>
                  <ArrowRight size={24} />
                </>
              )}
            </button>
            <p className="text-center text-slate-600 text-[10px] mt-8 font-black uppercase tracking-[0.2em]">
              Sua campanha será publicada instantaneamente na rede global.
            </p>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
