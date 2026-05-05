import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  PlusCircle, Upload, Link as LinkIcon, Calendar, Ticket,
  ArrowRight, Sparkles, DollarSign, FlaskConical, CreditCard,
  X, ImageIcon, Loader2,
} from "lucide-react";
import { User } from "../types";
import CreatorTermsModal from "../components/CreatorTermsModal";
import { createRaffle, getCommissionRate, markCreatorTermsAccepted } from "../lib/firebaseService";
import { uploadImageToImgBB } from "../lib/imgbb";

const INPUT = "w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3.5 text-sm font-semibold text-white outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 placeholder:text-slate-600";

export default function CreateRaffle({ user }: { user: User | null }) {
  const navigate = useNavigate();
  const fileRef  = useRef<HTMLInputElement>(null);

  // ── state ───────────────────────────────────────────────────────────
  const [title,       setTitle]       = useState("");
  const [description, setDescription] = useState("");
  const [priceStr,    setPriceStr]    = useState("");   // string do <input>
  const [qty,         setQty]         = useState("100");// string do <select>
  const [drawDate,    setDrawDate]    = useState("");
  const [imageUrl,    setImageUrl]    = useState("");
  const [imgMode,     setImgMode]     = useState<"upload"|"url">("upload");
  const [preview,     setPreview]     = useState<string|null>(null);
  const [uploading,   setUploading]   = useState(false);
  const [isTest,      setIsTest]      = useState(false);
  const [submitting,  setSubmitting]  = useState(false);
  const [taxaPlat,    setTaxaPlat]    = useState<number>(10);
  const [error,       setError]       = useState("");
  const [showTerms,   setShowTerms]   = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Carrega taxa do Firebase
  useEffect(() => {
    getCommissionRate()
      .then((v) => { if (typeof v === "number" && !isNaN(v)) setTaxaPlat(v); })
      .catch(() => setTaxaPlat(10));
  }, []);

  // ── cálculos — executam a cada render ───────────────────────────────
  const precoNum    = Number(priceStr)  || 0;
  const qtdNum      = Number(qty)       || 0;
  const receita     = precoNum * qtdNum;
  const comissao    = receita * (taxaPlat / 100);
  const lucro       = receita - comissao;

  const brl = (n: number) =>
    n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  if (!user || (user.role !== "creator" && user.role !== "admin")) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 px-4 text-center">
        <Ticket size={48} className="text-slate-700" />
        <p className="text-slate-400 font-bold text-lg">Apenas criadores podem criar sorteios.</p>
      </div>
    );
  }

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setPreview(URL.createObjectURL(f));
    setUploading(true);
    try {
      const url = await uploadImageToImgBB(f);
      setImageUrl(url);
      setPreview(url);
    } catch { setError("Falha no upload. Tente novamente."); setPreview(null); }
    finally   { setUploading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (precoNum <= 0) { setError("Informe um valor por cota."); return; }
    if (uploading)     { setError("Aguarde o upload da imagem."); return; }
    setSubmitting(true);
    try {
      await createRaffle({
        title, description,
        pricePerNumber: precoNum,
        totalNumbers: qtdNum,
        drawDate,
        images: imageUrl ? [imageUrl] : [],
        creatorId: user.id, creatorName: user.name,
        commissionPercentage: taxaPlat,
        isTest,
      });
      navigate("/dashboard");
    } catch { setError("Erro ao criar rifa. Tente novamente."); }
    finally  { setSubmitting(false); }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="bg-slate-900 rounded-[2.5rem] border border-slate-800 shadow-2xl overflow-hidden">

        {/* Cabeçalho */}
        <div className="p-10 md:p-14 border-b border-slate-800 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-600/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 bg-indigo-500/10 text-indigo-400 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest mb-6 border border-indigo-500/20">
              <Sparkles size={13}/><span>Painel do Criador</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black text-white mb-2">
              Nova <span className="text-indigo-500 italic">Oportunidade</span>
            </h1>
          </div>
        </div>

        <form id="create-raffle-form" onSubmit={handleSubmit} className="p-8 sm:p-12 space-y-10">
          {error && (
            <div className="p-4 bg-red-500/10 text-red-400 rounded-2xl text-sm font-bold border border-red-500/20">{error}</div>
          )}

          {/* Modo de pagamento */}
          <div className="space-y-3">
            <SectionTitle icon={<CreditCard size={15}/>} label="Modo de Pagamento"/>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ModeCard
                active={!isTest}
                color="indigo"
                icon={<CreditCard size={17}/>}
                title="Mercado Pago Real"
                desc="Pagamentos reais via PIX, cartão e boleto."
                onClick={() => setIsTest(false)}
              />
              <ModeCard
                active={isTest}
                color="amber"
                icon={<FlaskConical size={17}/>}
                title="Simulação / Teste"
                desc="Nenhum pagamento real. Ideal para testes."
                onClick={() => setIsTest(true)}
              />
            </div>
            {isTest && (
              <div className="flex items-center gap-2 p-3 bg-amber-500/10 rounded-xl border border-amber-500/20">
                <FlaskConical size={13} className="text-amber-400 shrink-0"/>
                <p className="text-xs text-amber-300 font-medium">
                  Rifa de teste — aparecerá com o selo <strong>SIMULAÇÃO</strong>.
                </p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">

            {/* ── Esquerda ───────────────────────────────────────── */}
            <div className="space-y-6">
              <SectionTitle icon={<DollarSign size={15}/>} label="Informações Essenciais"/>

              <FieldWrap label="Título do Sorteio">
                <input
                  type="text" required
                  placeholder="Ex: iPhone 15 Pro Max 256GB"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={INPUT}
                />
              </FieldWrap>

              <FieldWrap label="Descrição">
                <textarea
                  required rows={4}
                  placeholder="Descreva o prêmio e as regras..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={INPUT + " resize-none"}
                />
              </FieldWrap>

              <FieldWrap label="Imagem do Prêmio">
                {/* toggle */}
                <div className="flex p-1 bg-slate-950 rounded-xl border border-slate-800 mb-3">
                  {(["upload","url"] as const).map((m) => (
                    <button key={m} type="button" onClick={() => setImgMode(m)}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${imgMode===m?"bg-indigo-600 text-white":"text-slate-500 hover:text-slate-300"}`}>
                      {m==="upload"?<><Upload size={12}/>Dispositivo</>:<><LinkIcon size={12}/>URL</>}
                    </button>
                  ))}
                </div>
                {imgMode==="upload" ? (
                  preview ? (
                    <div className="relative rounded-2xl overflow-hidden border border-slate-700">
                      <img src={preview} alt="" className="w-full h-40 object-cover"/>
                      {uploading && (
                        <div className="absolute inset-0 bg-slate-950/70 flex items-center justify-center gap-2 text-white text-sm font-bold">
                          <Loader2 size={18} className="animate-spin"/>Enviando...
                        </div>
                      )}
                      {!uploading && (
                        <button type="button" onClick={()=>{setPreview(null);setImageUrl("");if(fileRef.current)fileRef.current.value="";}}
                          className="absolute top-2 right-2 bg-slate-900/80 p-1.5 rounded-lg text-white hover:bg-red-600 transition-colors">
                          <X size={14}/>
                        </button>
                      )}
                    </div>
                  ) : (
                    <>
                      <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" id="img-up"/>
                      <label htmlFor="img-up" className="flex flex-col items-center justify-center gap-3 h-36 border-2 border-dashed border-slate-700 rounded-2xl cursor-pointer hover:border-indigo-500 hover:bg-indigo-500/5 transition-all">
                        <ImageIcon size={26} className="text-slate-600"/>
                        <div className="text-center">
                          <p className="text-sm font-bold text-slate-400">Clique para escolher</p>
                          <p className="text-xs text-slate-600">JPG, PNG ou WEBP — máx. 32MB</p>
                        </div>
                      </label>
                    </>
                  )
                ) : (
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/..."
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className={INPUT}
                  />
                )}
              </FieldWrap>
            </div>

            {/* ── Direita ────────────────────────────────────────── */}
            <div className="space-y-6">
              <SectionTitle icon={<DollarSign size={15}/>} label="Configuração Financeira"/>

              <div className="grid grid-cols-2 gap-4">
                <FieldWrap label="Valor por Cota (R$)">
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    placeholder="0,00"
                    value={priceStr}
                    onChange={(e) => setPriceStr(e.target.value)}
                    className={INPUT}
                  />
                </FieldWrap>

                <FieldWrap label="Qtd. de Cotas">
                  <select
                    value={qty}
                    onChange={(e) => setQty(e.target.value)}
                    className={INPUT + " cursor-pointer"}
                  >
                    {[10,25,50,100,200,500,1000,5000,10000].map((n) => (
                      <option key={n} value={String(n)} className="bg-slate-900">{n}</option>
                    ))}
                  </select>
                </FieldWrap>
              </div>

              <FieldWrap label="Data do Sorteio">
                <div className="relative">
                  <Calendar size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none"/>
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().split("T")[0]}
                    value={drawDate}
                    onChange={(e) => setDrawDate(e.target.value)}
                    className={INPUT + " pl-10"}
                  />
                </div>
              </FieldWrap>

              {/* ── Resumo financeiro ── atualiza instantaneamente ── */}
              <div className="p-6 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Taxa Plataforma GGRIFAS</span>
                  <span className="text-sm font-bold text-amber-400">{taxaPlat}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Receita Total (100%)</span>
                  <span className="text-sm font-bold text-slate-300">R$ {brl(receita)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Comissão Plataforma</span>
                  <span className="text-sm font-bold text-red-400">- R$ {brl(comissao)}</span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-slate-800">
                  <span className="text-sm font-black text-white uppercase tracking-widest">Seu Lucro Estimado</span>
                  <span className="text-2xl font-black text-emerald-400">R$ {brl(lucro)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="pt-8 border-t border-slate-800">
            <button
              type="submit"
              disabled={submitting || uploading}
              className={`w-full text-white py-5 rounded-2xl font-bold text-xl shadow-2xl transition-all disabled:opacity-50 flex items-center justify-center gap-4 hover:scale-[1.01] active:scale-[0.99] ${
                isTest
                  ? "bg-amber-500 hover:bg-amber-400 shadow-amber-500/20"
                  : "bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/20"
              }`}
            >
              {submitting
                ? <Loader2 size={24} className="animate-spin"/>
                : <>
                    {isTest ? <FlaskConical size={22}/> : <PlusCircle size={22}/>}
                    <span>{isTest ? "CRIAR RIFA DE TESTE" : "LANÇAR SORTEIO AGORA"}</span>
                    <ArrowRight size={20}/>
                  </>
              }
            </button>
          </div>
        </form>
      </div>
    </div>

      {/* Termos do Criador */}
      {showTerms && (
        <CreatorTermsModal
          commissionRate={rate}
          onAccept={() => {
            setTermsAccepted(true);
            setShowTerms(false);
            // Salva no Firebase que o criador aceitou os termos
            markCreatorTermsAccepted(user.id, rate).catch(() => {});
            // Re-submit form after accepting
            setTimeout(() => {
              document.getElementById("create-raffle-form")?.dispatchEvent(
                new Event("submit", { cancelable: true, bubbles: true })
              );
            }, 100);
          }}
          onDecline={() => setShowTerms(false)}
        />
      )}
    </div>
  );
}

function SectionTitle({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
      <span className="text-indigo-500">{icon}</span>
      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</span>
    </div>
  );
}

function FieldWrap({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">{label}</label>
      {children}
    </div>
  );
}

function ModeCard({ active, color, icon, title, desc, onClick }: {
  active: boolean; color: "indigo"|"amber";
  icon: React.ReactNode; title: string; desc: string; onClick: () => void;
}) {
  const border = active ? (color==="indigo" ? "border-indigo-500 bg-indigo-500/10" : "border-amber-500 bg-amber-500/10") : "border-slate-800 bg-slate-950 hover:border-slate-700";
  const dot    = active ? (color==="indigo" ? "border-indigo-500" : "border-amber-500") : "border-slate-600";
  const dotFill= active ? (color==="indigo" ? "bg-indigo-500"     : "bg-amber-500")     : "";
  const txt    = active ? "text-white" : "text-slate-500";
  return (
    <button type="button" onClick={onClick} className={`p-5 rounded-2xl border-2 text-left transition-all ${border}`}>
      <div className="flex items-center gap-3 mb-2">
        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${dot}`}>
          {active && <div className={`w-2 h-2 rounded-full ${dotFill}`}/>}
        </div>
        <span className={`font-black text-sm uppercase tracking-widest ${txt}`}>{title}</span>
      </div>
      <p className="text-xs text-slate-500 pl-7">{desc}</p>
    </button>
  );
}
