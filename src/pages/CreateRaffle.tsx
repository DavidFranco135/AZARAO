import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import {
  PlusCircle,
  Upload,
  Link as LinkIcon,
  Calendar,
  Ticket,
  ArrowRight,
  Sparkles,
  LayoutDashboard,
  DollarSign,
  FlaskConical,
  CreditCard,
  X,
  ImageIcon,
  Loader2,
} from "lucide-react";
import { User } from "../types";
import { createRaffle, getCommissionRate } from "../lib/firebaseService";
import { uploadImageToImgBB } from "../lib/imgbb";

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
  const [imageMode, setImageMode] = useState<"url" | "upload">("upload");
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isTest, setIsTest] = useState(false);
  const [loading, setLoading] = useState(false);
  const [commissionRate, setCommissionRate] = useState(10);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    getCommissionRate().then(setCommissionRate);
  }, []);

  if (!user || (user.role !== "creator" && user.role !== "admin")) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 px-4 text-center">
        <Ticket size={48} className="text-slate-700" />
        <p className="text-slate-400 font-bold text-lg">
          Apenas criadores podem criar sorteios.
        </p>
        <p className="text-slate-500 text-sm">
          Registre-se como{" "}
          <strong className="text-indigo-400">Criador</strong> para ter acesso.
        </p>
      </div>
    );
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview local imediato
    const localUrl = URL.createObjectURL(file);
    setImagePreview(localUrl);

    setUploading(true);
    setError("");
    try {
      const url = await uploadImageToImgBB(file);
      setImageUrl(url);
      setImagePreview(url);
    } catch {
      setError("Falha no upload da imagem. Tente novamente.");
      setImagePreview(null);
    } finally {
      setUploading(false);
    }
  };

  const clearImage = () => {
    setImageUrl("");
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!pricePerNumber || parseFloat(pricePerNumber) <= 0) {
      setError("Informe um valor válido por cota.");
      return;
    }
    if (uploading) {
      setError("Aguarde o upload da imagem terminar.");
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
        isTest,
      });
      navigate("/dashboard");
    } catch {
      setError("Erro ao criar a rifa. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const estimatedProfit =
    parseFloat(pricePerNumber || "0") *
    parseInt(totalNumbers) *
    (1 - commissionRate / 100);

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-900 rounded-[2.5rem] border border-slate-800 shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="p-10 md:p-14 border-b border-slate-800 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-600/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 bg-indigo-500/10 text-indigo-400 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest mb-6 border border-indigo-500/20">
              <Sparkles size={13} />
              <span>Painel do Criador</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black text-white mb-4">
              Nova{" "}
              <span className="text-indigo-500 italic">Oportunidade</span>
            </h1>
            <p className="text-slate-400 font-medium max-w-xl">
              Configure sua campanha e escolha o modo de pagamento.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 sm:p-12 space-y-10">
          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-4 bg-red-500/10 text-red-400 rounded-2xl text-sm font-bold border border-red-500/20"
            >
              {error}
            </motion.div>
          )}

          {/* ── Modo de Pagamento ─────────────────────────────────────── */}
          <div className="space-y-4">
            <SectionHeader
              icon={<CreditCard size={16} />}
              label="Modo de Pagamento"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Live */}
              <button
                type="button"
                onClick={() => setIsTest(false)}
                className={`p-5 rounded-2xl border-2 text-left transition-all ${
                  !isTest
                    ? "border-indigo-500 bg-indigo-500/10"
                    : "border-slate-800 bg-slate-950 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      !isTest ? "border-indigo-500" : "border-slate-600"
                    }`}
                  >
                    {!isTest && (
                      <div className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                    )}
                  </div>
                  <CreditCard
                    size={18}
                    className={!isTest ? "text-indigo-400" : "text-slate-500"}
                  />
                  <span
                    className={`font-black text-sm uppercase tracking-widest ${
                      !isTest ? "text-white" : "text-slate-500"
                    }`}
                  >
                    Mercado Pago Real
                  </span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Pagamentos reais via PIX, cartão e boleto. Split automático
                  de comissão.
                </p>
              </button>

              {/* Test */}
              <button
                type="button"
                onClick={() => setIsTest(true)}
                className={`p-5 rounded-2xl border-2 text-left transition-all ${
                  isTest
                    ? "border-amber-500 bg-amber-500/10"
                    : "border-slate-800 bg-slate-950 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      isTest ? "border-amber-500" : "border-slate-600"
                    }`}
                  >
                    {isTest && (
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    )}
                  </div>
                  <FlaskConical
                    size={18}
                    className={isTest ? "text-amber-400" : "text-slate-500"}
                  />
                  <span
                    className={`font-black text-sm uppercase tracking-widest ${
                      isTest ? "text-amber-400" : "text-slate-500"
                    }`}
                  >
                    Simulação / Teste
                  </span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Nenhum pagamento real. Ideal para testar o fluxo completo da
                  plataforma.
                </p>
              </button>
            </div>

            {isTest && (
              <div className="flex items-center gap-2 p-3 bg-amber-500/10 rounded-xl border border-amber-500/20">
                <FlaskConical size={14} className="text-amber-400 shrink-0" />
                <p className="text-xs text-amber-300 font-medium">
                  Esta rifa é um teste — aparecerá com o selo{" "}
                  <strong>SIMULAÇÃO</strong> para todos os usuários.
                </p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* ── Left: Info ─────────────────────────────────────────── */}
            <div className="space-y-7">
              <SectionHeader
                icon={<LayoutDashboard size={16} />}
                label="Informações Essenciais"
              />

              <Field label="Título do Sorteio">
                <input
                  type="text"
                  required
                  placeholder="Ex: iPhone 15 Pro Max 256GB"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="input-field"
                />
              </Field>

              <Field label="Descrição">
                <textarea
                  required
                  placeholder="Descreva o prêmio, regras e informações importantes..."
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="input-field resize-none"
                />
              </Field>

              {/* Image Upload */}
              <Field label="Imagem do Prêmio">
                {/* Tab switcher */}
                <div className="flex p-1 bg-slate-950 rounded-xl border border-slate-800 mb-3">
                  <button
                    type="button"
                    onClick={() => setImageMode("upload")}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
                      imageMode === "upload"
                        ? "bg-indigo-600 text-white"
                        : "text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    <Upload size={13} />
                    Do dispositivo
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageMode("url")}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
                      imageMode === "url"
                        ? "bg-indigo-600 text-white"
                        : "text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    <LinkIcon size={13} />
                    Por URL
                  </button>
                </div>

                {imageMode === "upload" ? (
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                      id="img-upload"
                    />
                    {imagePreview ? (
                      <div className="relative rounded-2xl overflow-hidden border border-slate-700">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-full h-40 object-cover"
                        />
                        {uploading && (
                          <div className="absolute inset-0 bg-slate-950/70 flex items-center justify-center gap-2 text-white text-sm font-bold">
                            <Loader2 size={20} className="animate-spin" />
                            Enviando...
                          </div>
                        )}
                        {!uploading && (
                          <button
                            type="button"
                            onClick={clearImage}
                            className="absolute top-2 right-2 bg-slate-900/80 p-1.5 rounded-lg text-white hover:bg-red-600 transition-colors"
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>
                    ) : (
                      <label
                        htmlFor="img-upload"
                        className="flex flex-col items-center justify-center gap-3 h-36 border-2 border-dashed border-slate-700 rounded-2xl cursor-pointer hover:border-indigo-500 hover:bg-indigo-500/5 transition-all"
                      >
                        <ImageIcon size={28} className="text-slate-600" />
                        <div className="text-center">
                          <p className="text-sm font-bold text-slate-400">
                            Clique para escolher
                          </p>
                          <p className="text-xs text-slate-600">
                            JPG, PNG ou WEBP — máx. 32MB
                          </p>
                        </div>
                      </label>
                    )}
                  </div>
                ) : (
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/..."
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="input-field"
                  />
                )}
              </Field>
            </div>

            {/* ── Right: Finance ─────────────────────────────────────── */}
            <div className="space-y-7">
              <SectionHeader
                icon={<DollarSign size={16} />}
                label="Configuração Financeira"
              />

              <div className="grid grid-cols-2 gap-5">
                <Field label="Valor por Cota (R$)">
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    placeholder="0,00"
                    value={pricePerNumber}
                    onChange={(e) => setPricePerNumber(e.target.value)}
                    className="input-field"
                  />
                </Field>

                <Field label="Qtd. de Cotas">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-600">
                      <Ticket size={14} />
                    </div>
                    <select
                      value={totalNumbers}
                      onChange={(e) => setTotalNumbers(e.target.value)}
                      className="input-field pl-10 appearance-none cursor-pointer"
                    >
                      {[10, 25, 50, 100, 200, 500, 1000, 5000, 10000].map(
                        (n) => (
                          <option key={n} value={n} className="bg-slate-900">
                            {n}
                          </option>
                        )
                      )}
                    </select>
                  </div>
                </Field>
              </div>

              <Field label="Data do Sorteio">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-600">
                    <Calendar size={14} />
                  </div>
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().split("T")[0]}
                    value={drawDate}
                    onChange={(e) => setDrawDate(e.target.value)}
                    className="input-field pl-10"
                  />
                </div>
              </Field>

              {/* Financial summary */}
              <div className="p-6 bg-slate-950 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    Taxa Plataforma GGRIFAS
                  </span>
                  <span className="text-sm font-bold text-amber-400">
                    {commissionRate}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    Receita Total (100%)
                  </span>
                  <span className="text-sm font-bold text-slate-300">
                    R${" "}
                    {(
                      parseFloat(pricePerNumber || "0") * parseInt(totalNumbers)
                    ).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                  <span className="text-[10px] font-black text-white uppercase tracking-widest">
                    Seu Lucro Estimado
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
              disabled={loading || uploading}
              className={`w-full text-white py-5 rounded-2xl font-bold text-xl shadow-2xl transition-all disabled:opacity-50 flex items-center justify-center gap-4 hover:scale-[1.01] active:scale-[0.99] ${
                isTest
                  ? "bg-amber-500 hover:bg-amber-400 shadow-amber-500/20"
                  : "bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/20"
              }`}
            >
              {loading ? (
                <Loader2 size={24} className="animate-spin" />
              ) : (
                <>
                  {isTest ? (
                    <FlaskConical size={24} />
                  ) : (
                    <PlusCircle size={24} />
                  )}
                  <span>
                    {isTest ? "CRIAR RIFA DE TESTE" : "LANÇAR SORTEIO AGORA"}
                  </span>
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>

      <style>{`
        .input-field {
          width: 100%;
          background: rgb(2 6 23);
          border: 1px solid rgb(30 41 59);
          border-radius: 0.875rem;
          padding: 0.875rem 1rem;
          font-size: 0.875rem;
          font-weight: 600;
          color: white;
          outline: none;
          transition: all 0.15s;
        }
        .input-field:focus { border-color: rgb(99 102 241); box-shadow: 0 0 0 2px rgba(99,102,241,0.1); }
        .input-field::placeholder { color: rgb(51 65 85); }
      `}</style>
    </div>
  );
}

function SectionHeader({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
      <span className="text-indigo-500">{icon}</span>
      <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
        {label}
      </h3>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">
        {label}
      </label>
      {children}
    </div>
  );
}
