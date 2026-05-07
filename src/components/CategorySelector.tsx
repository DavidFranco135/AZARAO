
import { useState, useEffect } from "react";
import { Tag, Plus, X, Star } from "lucide-react";
import { getRaffles } from "../lib/firebaseService";

const PRESET_CATEGORIES = [
  "Destaques", "Formaturas", "Beneficente",
  "Eletrônicos", "Veículos", "Moda", "Casa", "Viagens", "Outros",
];

interface Props {
  value:    string;
  onChange: (cat: string) => void;
}

export default function CategorySelector({ value, onChange }: Props) {
  const [categories, setCategories] = useState<string[]>(PRESET_CATEGORIES);
  const [custom,     setCustom]     = useState("");
  const [showInput,  setShowInput]  = useState(false);

  // Busca categorias já usadas nas rifas existentes
  useEffect(() => {
    getRaffles().then((raffles) => {
      const used = raffles
        .map((r) => (r as any).category)
        .filter((c): c is string => !!c);
      const merged = [...new Set([...PRESET_CATEGORIES, ...used])];
      setCategories(merged);
    }).catch(() => {});
  }, []);

  const addCustom = () => {
    const cat = custom.trim();
    if (!cat) return;
    if (!categories.includes(cat)) setCategories(p => [...p, cat]);
    onChange(cat);
    setCustom("");
    setShowInput(false);
  };

  return (
    <div className="space-y-3">
      {/* Grid de categorias */}
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button key={cat} type="button" onClick={() => onChange(cat)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all border ${
              value === cat
                ? cat === "Destaques"
                  ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                  : "bg-indigo-600/20 text-indigo-400 border-indigo-500/30"
                : "bg-slate-950 text-slate-500 border-slate-800 hover:border-slate-600 hover:text-slate-300"
            }`}>
            {cat === "Destaques" && <Star size={11}/>}
            {cat}
          </button>
        ))}

        {/* Botão nova categoria */}
        <button type="button" onClick={() => setShowInput(!showInput)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all border border-dashed border-slate-700 text-slate-500 hover:border-indigo-500 hover:text-indigo-400">
          <Plus size={11}/> Nova
        </button>
      </div>

      {/* Campo de categoria personalizada */}
      {showInput && (
        <div className="flex gap-2">
          <input
            type="text"
            value={custom}
            onChange={e => setCustom(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addCustom(); } }}
            placeholder="Nome da categoria..."
            autoFocus
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-slate-600 outline-none focus:border-indigo-500 transition-colors"
          />
          <button type="button" onClick={addCustom}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 rounded-xl font-bold text-sm transition-all">
            Adicionar
          </button>
          <button type="button" onClick={() => { setShowInput(false); setCustom(""); }}
            className="text-slate-500 hover:text-white px-2 transition-colors">
            <X size={16}/>
          </button>
        </div>
      )}

      {value && (
        <p className="text-[10px] text-slate-500 flex items-center gap-1.5">
          <Tag size={10}/>
          Categoria selecionada: <strong className="text-white">{value}</strong>
          <button type="button" onClick={() => onChange("")} className="text-red-400 hover:text-red-300 ml-1">×</button>
        </p>
      )}
    </div>
  );
}
