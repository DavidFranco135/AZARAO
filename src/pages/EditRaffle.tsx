import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "motion/react";
import {
  Save, ArrowLeft, Loader2, Image as ImageIcon,
  Upload, X, DollarSign, Calendar, Hash,
  FlaskConical, CheckCircle2, Ticket, LinkIcon,
  AlertTriangle, Tag, Package,
} from "lucide-react";
import { User, Raffle } from "../types";
import { getRaffle, updateRaffle } from "../lib/firebaseService";
import CategorySelector from "../components/CategorySelector";
import PackagesEditor from "../components/PackagesEditor";
import { RafflePackage } from "../types";
import { uploadImageToImgBB } from "../lib/imgbb";

interface Props { user: User | null }

const INPUT = "w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3.5 text-sm text-white placeholder:text-slate-600 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all font-medium";

export default function EditRaffle({ user }: Props) {
  const { id }    = useParams<{ id: string }>();
  const navigate  = useNavigate();

  const [raffle,   setRaffle]   = useState<Raffle | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [saved,    setSaved]    = useState(false);
  const [error,    setError]    = useState("");
  const [uploading,setUploading]= useState(false);
  const [imgMode,  setImgMode]  = useState<"upload"|"url">("upload");
  const fileRef    = useRef<HTMLInputElement>(null);

  // Campos editáveis
  const [title,       setTitle]       = useState("");
  const [description, setDescription] = useState("");
  const [drawDate,    setDrawDate]    = useState("");
  const [pricePerNum, setPricePerNum] = useState("");
  const [images,      setImages]      = useState<string[]>([]);
  const [isTest,      setIsTest]      = useState(false);
  const [category,    setCategory]    = useState("");
  const [minQuantity, setMinQuantity] = useState(1);
  const [packages,    setPackages]    = useState<RafflePackage[]>([]);

  useEffect(() => {
    if (!id) return;
    getRaffle(id).then((r) => {
      if (!r) { navigate("/dashboard"); return; }
      // Só o criador ou admin pode editar
      if (user?.role !== "admin" && r.creatorId !== user?.id) {
        navigate("/dashboard"); return;
      }
      setRaffle(r);
      setTitle(r.title ?? "");
      setDescription(r.description ?? "");
      setDrawDate(r.drawDate?.slice?.(0, 10) ?? "");
      setPricePerNum(String(r.pricePerNumber ?? ""));
      setImages(r.images?.filter(Boolean) ?? []);
      setIsTest(r.isTest ?? false);
      setCategory((r as any).category ?? "");
      setMinQuantity((r as any).minQuantity ?? 1);
      setPackages((r as any).packages ?? []);
      setLoading(false);
    });
  }, [id]);

  const handleAddUrl = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") return;
    const url = (e.target as HTMLInputElement).value.trim();
    if (url.startsWith("http") && images.length < 8) {
      setImages(p => [...p, url]);
      (e.target as HTMLInputElement).value = "";
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const remaining = 8 - images.length;
    setUploading(true);
    for (const file of files.slice(0, remaining)) {
      const url = await uploadImageToImgBB(file);
      if (url) setImages(p => [...p, url]);
    }
    setUploading(false);
  };

  const handleSave = async () => {
    setError("");
    if (!title.trim())      { setError("Informe o título da rifa."); return; }
    if (!drawDate)          { setError("Informe a data do sorteio."); return; }
    if (images.length === 0){ setError("Adicione pelo menos uma foto."); return; }
    const price = parseFloat(pricePerNum);
    if (isNaN(price) || price <= 0) { setError("Valor por cota inválido."); return; }

    setSaving(true);
    try {
      await updateRaffle(id!, {
        title:          title.trim(),
        description:    description.trim(),
        drawDate,
        pricePerNumber: price,
        images,
        isTest,
        category: category || "Outros",
        minQuantity: minQuantity || 1,
        packages: packages.length > 0 ? packages : [],
      });
      setSaved(true);
      setTimeout(() => { setSaved(false); navigate(`/dashboard/raffle/${id}`); }, 1500);
    } catch (e) {
      setError("Erro ao salvar: " + String(e));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <Loader2 size={36} className="text-indigo-400 animate-spin"/>
    </div>
  );

  if (!raffle) return null;

  const canChangePrice = raffle.soldNumbers.length === 0;

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to={`/dashboard/raffle/${id}`}
          className="w-10 h-10 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:border-slate-600 transition-all">
          <ArrowLeft size={18}/>
        </Link>
        <div>
          <h1 className="text-2xl font-black text-white">Editar Rifa</h1>
          <p className="text-slate-500 text-sm">{raffle.title}</p>
        </div>
      </div>

      {/* Aviso se tem cotas vendidas */}
      {raffle.soldNumbers.length > 0 && (
        <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
          <AlertTriangle size={18} className="text-amber-400 shrink-0 mt-0.5"/>
          <div>
            <p className="text-sm font-black text-amber-300">Atenção</p>
            <p className="text-xs text-amber-400/80 leading-relaxed mt-0.5">
              Esta rifa já possui <strong>{raffle.soldNumbers.length} cota(s) vendida(s)</strong>. O valor por cota não pode mais ser alterado. As demais informações podem ser editadas normalmente.
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm font-bold">
          {error}
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-8">
        {/* ── Coluna esquerda ── */}
        <div className="space-y-6">
          <Section label="Informações Básicas">
            {/* Título */}
            <Field icon={<Ticket size={15}/>} label="Título da Rifa">
              <input type="text" value={title} onChange={e => setTitle(e.target.value)}
                placeholder="Ex: iPhone 15 Pro Max 256GB"
                className={INPUT}/>
            </Field>

            {/* Descrição */}
            <Field icon={<Hash size={15}/>} label="Descrição">
              <textarea value={description} onChange={e => setDescription(e.target.value)}
                rows={4} placeholder="Descreva o prêmio, condições de entrega..."
                className={INPUT + " resize-none"}/>
            </Field>
          </Section>

          <Section label="Configurações">
            {/* Valor por cota */}
            <Field icon={<DollarSign size={15}/>} label="Valor por Cota">
              {canChangePrice ? (
                <input type="number" value={pricePerNum}
                  onChange={e => setPricePerNum(e.target.value)}
                  min="0.01" step="0.01" placeholder="0.00"
                  className={INPUT}/>
              ) : (
                <div className="flex items-center gap-3 bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3.5">
                  <span className="text-sm font-black text-white">R$ {parseFloat(pricePerNum).toFixed(2)}</span>
                  <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20">Não editável — cotas vendidas</span>
                </div>
              )}
            </Field>

            {/* Data do sorteio */}
            <Field icon={<Calendar size={15}/>} label="Data do Sorteio">
              <input type="date" value={drawDate} onChange={e => setDrawDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className={INPUT}/>
            </Field>

            {/* Categoria */}
            <Field icon={<Tag size={15}/>} label="Categoria">
              <CategorySelector value={category} onChange={setCategory}/>
            </Field>

            {/* Mínimo de cotas */}
            <Field icon={<Hash size={15}/>} label="Mínimo de cotas por compra">
              <div className="flex items-center gap-3">
                <input type="number" value={minQuantity}
                  onChange={e => setMinQuantity(Math.max(1, parseInt(e.target.value)||1))}
                  min="1" max="100"
                  className={INPUT + " w-24 text-center font-black"}/>
                <p className="text-xs text-slate-400">
                  {minQuantity === 1 ? "Sem mínimo obrigatório" : `Participante deve comprar ao menos ${minQuantity} cotas`}
                </p>
              </div>
            </Field>

            {/* Pacotes */}
            <Field icon={<Package size={15}/>} label="Pacotes de cotas (opcional)">
              <PackagesEditor
                pricePerUnit={parseFloat(pricePerNum) || 0}
                packages={packages}
                onChange={setPackages}
              />
            </Field>

            {/* Modo */}
            <Field icon={<FlaskConical size={15}/>} label="Modo da Rifa">
              <div className="flex p-1 bg-slate-950 rounded-2xl border border-slate-800 gap-1">
                <button type="button" onClick={() => setIsTest(true)}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                    isTest ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" : "text-slate-500 hover:text-slate-300"
                  }`}>
                  <FlaskConical size={13}/> Teste (simulação)
                </button>
                <button type="button" onClick={() => setIsTest(false)}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                    !isTest ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "text-slate-500 hover:text-slate-300"
                  }`}>
                  <DollarSign size={13}/> Real (MP)
                </button>
              </div>
            </Field>
          </Section>
        </div>

        {/* ── Coluna direita — Fotos ── */}
        <div className="space-y-6">
          <Section label={`Fotos do Prêmio (${images.length}/8)`}>
            {/* Grid de fotos */}
            {images.length > 0 && (
              <div className="grid grid-cols-4 gap-2 mb-4">
                {images.map((img, i) => (
                  <div key={i}
                    className={`relative rounded-xl overflow-hidden group border-2 ${
                      i === 0 ? "col-span-2 row-span-2 border-indigo-500/50" : "border-slate-800"
                    }`}
                    style={{ aspectRatio: "1" }}
                  >
                    <img src={img} alt={`Foto ${i+1}`}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"/>

                    {i === 0 && (
                      <div className="absolute top-2 left-2 bg-indigo-600 text-white text-[8px] font-black px-2 py-0.5 rounded-lg uppercase tracking-widest">
                        Capa
                      </div>
                    )}

                    {/* Botão remover */}
                    <button type="button"
                      onClick={() => setImages(p => p.filter((_, idx) => idx !== i))}
                      className="absolute top-1.5 right-1.5 w-7 h-7 bg-slate-950/80 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 hover:bg-red-600 transition-all border border-slate-700">
                      <X size={13}/>
                    </button>

                    {/* Mover para capa */}
                    {i > 0 && (
                      <button type="button"
                        onClick={() => setImages(p => [p[i], ...p.filter((_, idx) => idx !== i)])}
                        className="absolute bottom-1.5 left-1.5 text-[8px] font-black text-white bg-slate-950/80 px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-all whitespace-nowrap">
                        ↑ capa
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Adicionar fotos */}
            {images.length < 8 && (
              <div className="space-y-3">
                {/* Toggle upload/url */}
                <div className="flex p-1 bg-slate-950 rounded-xl border border-slate-800">
                  {(["upload","url"] as const).map((m) => (
                    <button key={m} type="button" onClick={() => setImgMode(m)}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                        imgMode === m ? "bg-indigo-600 text-white" : "text-slate-500 hover:text-slate-300"
                      }`}>
                      {m === "upload" ? <><Upload size={11}/> Dispositivo</> : <><LinkIcon size={11}/> URL</>}
                    </button>
                  ))}
                </div>

                {imgMode === "upload" ? (
                  <>
                    <input ref={fileRef} type="file" accept="image/*" multiple onChange={handleUpload} className="hidden" id="edit-img-up"/>
                    <label htmlFor="edit-img-up"
                      className="flex flex-col items-center justify-center gap-2 h-28 border-2 border-dashed border-slate-700 rounded-2xl cursor-pointer hover:border-indigo-500 hover:bg-indigo-500/5 transition-all">
                      {uploading
                        ? <><Loader2 size={20} className="text-indigo-400 animate-spin"/><p className="text-xs text-slate-400 font-bold">Enviando...</p></>
                        : <><ImageIcon size={20} className="text-slate-600"/><p className="text-sm font-bold text-slate-400">Adicionar fotos</p><p className="text-xs text-slate-600">Selecione uma ou várias</p></>
                      }
                    </label>
                  </>
                ) : (
                  <input type="url" className={INPUT}
                    placeholder="https://... — pressione Enter para adicionar"
                    onKeyDown={handleAddUrl}/>
                )}
              </div>
            )}

            <p className="text-[10px] text-slate-600">
              A primeira foto é a capa. Passe o mouse para definir outra como capa ou remover.
            </p>
          </Section>

          {/* Preview da galeria */}
          {images.length > 0 && (
            <Section label="Preview">
              <div className="relative rounded-2xl overflow-hidden h-40 bg-slate-950">
                <img src={images[0]} alt="Capa"
                  className="w-full h-full object-cover opacity-80"
                  referrerPolicy="no-referrer"/>
                {images.length > 1 && (
                  <div className="absolute top-3 right-3 bg-slate-950/70 text-white text-[10px] font-black px-2 py-1 rounded-full border border-slate-700">
                    +{images.length - 1} foto(s)
                  </div>
                )}
              </div>
            </Section>
          )}
        </div>
      </div>

      {/* Botão salvar */}
      <div className="flex gap-3 justify-end">
        <Link to={`/dashboard/raffle/${id}`}
          className="px-8 py-4 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white rounded-2xl font-bold text-sm transition-all">
          Cancelar
        </Link>
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-3 px-10 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-base shadow-xl shadow-indigo-600/20 transition-all disabled:opacity-50">
          {saving
            ? <><Loader2 size={20} className="animate-spin"/> Salvando...</>
            : saved
            ? <><CheckCircle2 size={20}/> Salvo!</>
            : <><Save size={20}/> Salvar Alterações</>
          }
        </button>
      </div>
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
      <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-800 pb-3">
        {label}
      </h3>
      {children}
    </div>
  );
}

function Field({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
        <span className="text-slate-600">{icon}</span>{label}
      </label>
      {children}
    </div>
  );
}
