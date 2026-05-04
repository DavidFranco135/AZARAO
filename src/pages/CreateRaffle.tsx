import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import {
  PlusCircle,
  Image as ImageIcon,
  Calendar,
  Ticket,
  ArrowRight,
  Sparkles,
  LayoutDashboard,
  DollarSign,
} from "lucide-react";
import { User } from "../types";
import { createRaffle, getCommissionRate } from "../lib/firebaseService";

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
  const [commissionRate, setCommissionRate] = useState(10);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    getCommissionRate().then(setCommissionRate);
  }, []);

  if (!user || (user.role !== "creator" && user.role !== "admin")) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 px-4">
        <Ticket size={48} className="text-slate-700" />
        <p className="text-slate-400 font-bold text-lg text-center">
          Apenas criadores podem criar sorteios.
        </p>
        <p className="text-slate-500 text-sm text-center">
          Registre-se como <strong className="text-indigo-400">Criador</strong>{" "}
          para ter acesso a este painel.
        </p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!pricePerNumber || parseFloat(pricePerNumber) <= 0) {
      setError("Informe um valor válido por cota.");
      return;
    }
    setLoading(true);
    try {
      await createRaffle({
        title,
        description,
        pricePerNumber: parseFloat(pricePerNumber),
        totalNumbers: parseInt(totalNumbers),
        drawDate,
        images: imageUrl ? [imageUrl] : [],
        creatorId: user.id,
        creatorName: user.name,
        commissionPercentage: commissionRate,
      });
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      setError("Erro ao criar a rifa. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const estimatedProfit =
    (parseFloat(pricePerNumber || "0") *
      parseInt(totalNumbers) *
      (1 - commissionRate / 100));

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 sm:py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-900 rounded-[2.5rem] border border-slate-800 shadow-2xl shadow-indigo-500/5 overflow-hidden"
      >
        {/* Header */}
        <div className="bg-slate-900 p-10 md:p-14 border-b border-slate-800 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-600/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
          <div className="relative z-10">
            <div className="inline-flex items-center space-x-2 bg-indigo-500/10 text-indigo-400 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest mb-6 border border-indigo-500/20">
              <Sparkles size={13} />
              <span>Painel do Criador</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black text-white mb-4">
              Nova{" "}
              <span className="text-indigo-500 italic">Oportunidade</span>
            </h1>
            <p className="text-slate-400 font-medium text-base sm:text-lg max-w-xl">
              Configure sua campanha em segundos e deixe a infraestrutura
              automatizada cuidar das vendas.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 sm:p-12 md:p-14 space-y-10">
          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-4 bg-red-500/10 text-red-400 rounded-2xl text-sm font-bold border border-red-500/20"
            >
              {error}
            </motion.div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* Left */}
            <div className="space-y-7">
              <SectionHeader icon={<LayoutDashboard size={16} />} label="Informações Essenciais" />

              <Field label="Título do Sorteio">
                <input
                  type="text"
                  required
                  placeholder="Ex: PC Gamer High End + Setup"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="input-base"
                />
              </Field>

              <Field label="Descrição">
                <textarea
                  required
                  placeholder="Descreva o prêmio e as regras..."
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="input-base resize-none"
                />
              </Field>

              <Field label="URL da Imagem Principal">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-600">
                    <ImageIcon size={16} />
                  </div>
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/..."
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="input-base pl-11"
                  />
                </div>
              </Field>
            </div>

            {/* Right */}
            <div className="space-y-7">
              <SectionHeader icon={<DollarSign size={16} />} label="Configuração Financeira" />

              <div className="grid grid-cols-2 gap-5">
                <Field label="Valor p/ Cota (R$)">
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    placeholder="0,00"
                    value={pricePerNumber}
                    onChange={(e) => setPricePerNumber(e.target.value)}
                    className="input-base"
                  />
                </Field>

                <Field label="Quantidade de Cotas">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-600">
                      <Ticket size={15} />
                    </div>
                    <select
                      value={totalNumbers}
                      onChange={(e) => setTotalNumbers(e.target.value)}
                      className="input-base pl-11 appearance-none cursor-pointer"
                    >
                      {[10, 50, 100, 200, 500, 1000, 5000, 10000].map((n) => (
                        <option key={n} value={n} className="bg-slate-900">
                          {n}
                        </option>
                      ))}
                    </select>
                  </div>
                </Field>
              </div>

              <Field label="Data do Sorteio">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-600">
                    <Calendar size={15} />
                  </div>
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().split("T")[0]}
                    value={drawDate}
                    onChange={(e) => setDrawDate(e.target.value)}
                    className="input-base pl-11"
                  />
                </div>
              </Field>

              <div className="p-7 bg-slate-950 rounded-[1.5rem] border border-slate-800 space-y-5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    Taxa de Serviço Plataforma
                  </span>
                  <span className="text-sm font-bold text-amber-400">
                    {commissionRate}% SaaS Fee
                  </span>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                    Seu Lucro Estimado (100%)
                  </span>
                  <span className="text-2xl font-black text-emerald-400">
                    R${" "}
                    {estimatedProfit.toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-800">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-5 sm:py-6 rounded-2xl font-bold text-lg sm:text-xl shadow-2xl shadow-indigo-600/20 hover:bg-indigo-500 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center gap-4"
            >
              {loading ? (
                <div className="w-7 h-7 border-4 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <PlusCircle size={24} />
                  <span>LANÇAR SORTEIO AGORA</span>
                  <ArrowRight size={22} />
                </>
              )}
            </button>
            <p className="text-center text-slate-600 text-[10px] mt-5 font-black uppercase tracking-[0.2em]">
              Publicada instantaneamente após o envio
            </p>
          </div>
        </form>
      </motion.div>

      {/* Tailwind custom classes via global style trick */}
      <style>{`
        .input-base {
          width: 100%;
          background: rgb(2 6 23);
          border: 1px solid rgb(30 41 59);
          border-radius: 1rem;
          padding: 1rem 1.25rem;
          font-size: 0.875rem;
          font-weight: 700;
          color: white;
          outline: none;
          transition: all 0.15s;
        }
        .input-base:focus {
          border-color: rgb(99 102 241);
          box-shadow: 0 0 0 2px rgba(99,102,241,0.15);
        }
        .input-base::placeholder {
          color: rgb(51 65 85);
        }
      `}</style>
    </div>
  );
}

function SectionHeader({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
      <span className="text-indigo-500">{icon}</span>
      <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
        {label}
      </h3>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">
        {label}
      </label>
      {children}
    </div>
  );
}
