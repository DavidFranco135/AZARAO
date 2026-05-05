import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  PlusCircle, Upload, Link as LinkIcon, Calendar, Ticket,
  ArrowRight, Sparkles, DollarSign, FlaskConical, CreditCard,
  X, ImageIcon, Loader2,
} from "lucide-react";
import { User } from "../types";
import { createRaffle, getCommissionRate } from "../lib/firebaseService";
import { uploadImageToImgBB } from "../lib/imgbb";

export default function CreateRaffle({ user }: { user: User | null }) {
  const [title, setTitle]               = useState("");
  const [description, setDescription]   = useState("");
  const [price, setPrice]               = useState("");       // valor por cota
  const [qty, setQty]                   = useState(100);      // quantidade de cotas (number)
  const [drawDate, setDrawDate]         = useState("");
  const [imageUrl, setImageUrl]         = useState("");
  const [imageMode, setImageMode]       = useState<"upload"|"url">("upload");
  const [preview, setPreview]           = useState<string|null>(null);
  const [uploading, setUploading]       = useState(false);
  const [isTest, setIsTest]             = useState(false);
  const [loading, setLoading]           = useState(false);
  const [rate, setRate]                 = useState(10);       // taxa da plataforma
  const [error, setError]               = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    getCommissionRate().then((r) => setRate(Number(r) || 10));
  }, []);

  // ── cálculos em tempo real ──────────────────────────────────────────
  const priceNum    = parseFloat(price.replace(",", ".")) || 0;
  const grossTotal  = priceNum * qty;
  const commission  = grossTotal * (rate / 100);
  const profit      = grossTotal - commission;

  const fmt = (v: number) => v.toLocaleString("pt-BR", { minimumFractionDigits: 2 });

  if (!user || (user.role !== "creator" && user.role !== "admin")) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 px-4 text-center">
        <Ticket size={48} className="text-slate-700" />
        <p className="text-slate-400 font-bold text-lg">Apenas criadores podem criar sorteios.</p>
        <p className="text-slate-500 text-sm">
          Registre-se como <strong className="text-indigo-400">Criador</strong> para ter acesso.
        </p>
      </div>
    );
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    setUploading(true);
    setError("");
    try {
      const url = await uploadImageToImgBB(file);
      setImageUrl(url);
      setPreview(url);
    } catch {
      setError("Falha no upload. Tente novamente.");
      setPreview(null);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (priceNum <= 0) { setError("Informe um valor válido por cota."); return; }
    if (uploading)     { setError("Aguarde o upload da imagem."); return; }
    setLoading(true);
    try {
      await createRaffle({
        title, description,
        pricePerNumber: priceNum,
        totalNumbers: qty,
        drawDate,
        images: imageUrl ? [imageUrl] : [],
        creatorId: user.id,
        creatorName: user.name,
        commissionPercentage: rate,
        isTest,
      });
      navigate("/dashboard");
    } catch {
      setError("Erro ao criar a rifa. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="bg-slate-900 rounded-[2.5rem] border border-slate-800 shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="p-10 md:p-14 border-b border-slate-800 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-600/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 bg-indigo-500/10 text-indigo-400 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest mb-6 border border-indigo-500/20">
              <Sparkles size={13} /> <span>Painel do Criador</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black text-white mb-4">
              Nova <span className="text-indigo-500 italic">Oportunidade</span>
            </h1>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 sm:p-12 space-y-10">
          {error && (
            <div className="p-4 bg-red-500/10 text-red-400 rounded-2xl text-sm font-bold border border-red-500/20">
              {error}
            </div>
          )}

          {/* ── Modo de pagamento ─────────────────────────────────── */}
          <div className="space-y-4">
            <Label icon={<CreditCard size={15} />} text="Modo de Pagamento" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { val: false, icon: <CreditCard size={17}/>, label: "Mercado Pago Real",    color: "indigo", desc: "Pagamentos reais via PIX, cartão e boleto." },
                { val: true,  icon: <FlaskConical size={17}/>, label: "Simulação / Teste", color: "amber",  desc: "Nenhum pagamento real. Ideal para testes." },
              ].map((opt) => (
                <button
                  key={String(opt.val)}
                  type="button"
                  onClick={() => setIsTest(opt.val)}
                  className={`p-5 rounded-2xl border-2 text-left transition-all ${
                    isTest === opt.val
                      ? opt.color === "indigo" ? "border-indigo-500 bg-indigo-500/10" : "border-amber-500 bg-amber-500/10"
                      : "border-slate-800 bg-slate-950 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${isTest === opt.val ? (opt.color === "indigo" ? "border-indigo-500" : "border-amber-500") : "border-slate-600"}`}>
                      {isTest === opt.val && <div className={`w-2 h-2 rounded-full ${opt.color === "indigo" ? "bg-indigo-500" : "bg-amber-500"}`} />}
                    </div>
                    <span className={`font-black text-sm uppercase tracking-widest ${isTest === opt.val ? "text-white" : "text-slate-500"}`}>{opt.label}</span>
                  </div>
                  <p className="text-xs text-slate-500 pl-7">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">

            {/* ── Esquerda: informações ──────────────────────────── */}
            <div className="space-y-6">
              <Label icon={<DollarSign size={15} />} text="Informações Essenciais" />

              <Field label="Título do Sorteio">
                <input type="text" required placeholder="Ex: iPhone 15 Pro Max 256GB"
                  value={title} onChange={(e) => setTitle(e.target.value)}
                  className="inp" />
              </Field>

              <Field label="Descrição">
                <textarea required placeholder="Descreva o prêmio e as regras..." rows={4}
                  value={description} onChange={(e) => setDescription(e.target.value)}
                  className="inp resize-none" />
              </Field>

              {/* Imagem */}
              <Field label="Imagem do Prêmio">
                <div className="flex p-1 bg-slate-950 rounded-xl border border-slate-800 mb-3">
                  {(["upload","url"] as const).map((m) => (
                    <button key={m} type="button" onClick={() => setImageMode(m)}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${imageMode === m ? "bg-indigo-600 text-white" : "text-slate-500 hover:text-slate-300"}`}>
                      {m === "upload" ? <><Upload size={12}/> Dispositivo</> : <><LinkIcon size={12}/> URL</>}
                    </button>
                  ))}
                </div>

                {imageMode === "upload" ? (
                  preview ? (
                    <div className="relative rounded-2xl overflow-hidden border border-slate-700">
                      <img src={preview} alt="Preview" className="w-full h-40 object-cover" />
                      {uploading && (
                        <div className="absolute inset-0 bg-slate-950/70 flex items-center justify-center gap-2 text-white text-sm font-bold">
                          <Loader2 size={18} className="animate-spin" /> Enviando...
                        </div>
                      )}
                      {!uploading && (
                        <button type="button" onClick={() => { setPreview(null); setImageUrl(""); if(fileRef.current) fileRef.current.value=""; }}
                          className="absolute top-2 right-2 bg-slate-900/80 p-1.5 rounded-lg text-white hover:bg-red-600 transition-colors">
                          <X size={14}/>
                        </button>
                      )}
                    </div>
                  ) : (
                    <>
                      <input ref={fileRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" id="img-up" />
                      <label htmlFor="img-up" className="flex flex-col items-center justify-center gap-3 h-36 border-2 border-dashed border-slate-700 rounded-2xl cursor-pointer hover:border-indigo-500 hover:bg-indigo-500/5 transition-all">
                        <ImageIcon size={26} className="text-slate-600" />
                        <div className="text-center">
                          <p className="text-sm font-bold text-slate-400">Clique para escolher</p>
                          <p className="text-xs text-slate-600">JPG, PNG ou WEBP — máx. 32MB</p>
                        </div>
                      </label>
                    </>
                  )
                ) : (
                  <input type="url" placeholder="https://images.unsplash.com/..."
                    value={imageUrl} onChange={(e) => setImageUrl(e.target.value)}
                    className="inp" />
                )}
              </Field>
            </div>

            {/* ── Direita: financeiro ────────────────────────────── */}
            <div className="space-y-6">
              <Label icon={<DollarSign size={15} />} text="Configuração Financeira" />

              <div className="grid grid-cols-2 gap-4">
                <Field label="Valor por Cota (R$)">
                  <input
                    type="number" step="0.01" min="0.01" required
                    placeholder="0,00"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="inp"
                  />
                </Field>

                <Field label="Qtd. de Cotas">
                  <select
                    value={qty}
                    onChange={(e) => setQty(Number(e.target.value))}
                    className="inp appearance-none cursor-pointer"
                  >
                    {[10, 25, 50, 100, 200, 500, 1000, 5000, 10000].map((n) => (
                      <option key={n} value={n} className="bg-slate-900">{n}</option>
                    ))}
                  </select>
                </Field>
              </div>

              <Field label="Data do Sorteio">
                <div className="relative">
                  <Calendar size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none" />
                  <input type="date" required
                    min={new Date().toISOString().split("T")[0]}
                    value={drawDate} onChange={(e) => setDrawDate(e.target.value)}
                    className="inp pl-10" />
                </div>
              </Field>

              {/* ── Resumo financeiro — atualiza em tempo real ─── */}
              <div className="p-6 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Taxa Plataforma GGRIFAS</span>
                  <span className="text-sm font-bold text-amber-400">{rate}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Receita Total (100%)</span>
                  <span className="text-sm font-bold text-slate-300">R$ {fmt(grossTotal)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Comissão Plataforma</span>
                  <span className="text-sm font-bold text-red-400">- R$ {fmt(commission)}</span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-slate-800">
                  <span className="text-[10px] font-black text-white uppercase tracking-widest">Seu Lucro Estimado</span>
                  <span className="text-2xl font-black text-emerald-400">R$ {fmt(profit)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Botão submit ──────────────────────────────────────── */}
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
              {loading
                ? <Loader2 size={24} className="animate-spin" />
                : <>
                    {isTest ? <FlaskConical size={22} /> : <PlusCircle size={22} />}
                    <span>{isTest ? "CRIAR RIFA DE TESTE" : "LANÇAR SORTEIO AGORA"}</span>
                    <ArrowRight size={20} />
                  </>
              }
            </button>
            <p className="text-center text-slate-600 text-[10px] mt-4 font-black uppercase tracking-[0.2em]">
              Publicada instantaneamente após o envio
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

function Label({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
      <span className="text-indigo-500">{icon}</span>
      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{text}</span>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">{label}</label>
      {children}
    </div>
  );
}

/* Tailwind não processa classes dinâmicas — estilo inline para o input */
declare module "react" {
  interface HTMLAttributes<T> {
    className?: string;
  }
}

// Injetar estilo global do input (evita classe .inp não processada pelo Tailwind)
if (typeof document !== "undefined" && !document.getElementById("cr-style")) {
  const s = document.createElement("style");
  s.id = "cr-style";
  s.textContent = `.inp{width:100%;background:rgb(2 6 23);border:1px solid rgb(30 41 59);border-radius:.875rem;padding:.875rem 1rem;font-size:.875rem;font-weight:600;color:white;outline:none;transition:all .15s}.inp:focus{border-color:rgb(99 102 241);box-shadow:0 0 0 2px rgba(99,102,241,.1)}.inp::placeholder{color:rgb(51 65 85)}`;
  document.head.appendChild(s);
}
