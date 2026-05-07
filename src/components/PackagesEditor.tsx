import { useState } from "react";
import { Plus, Trash2, Star, Package } from "lucide-react";
import { RafflePackage } from "../types";

interface Props {
  pricePerUnit: number;
  packages:     RafflePackage[];
  onChange:     (pkgs: RafflePackage[]) => void;
}

const PRESETS = [
  { label: "Bronze",   quantity: 5,  discount: 0,  highlight: false },
  { label: "Prata",    quantity: 10, discount: 10, highlight: true  },
  { label: "Ouro",     quantity: 20, discount: 15, highlight: false },
  { label: "Diamante", quantity: 50, discount: 20, highlight: false },
];

export default function PackagesEditor({ pricePerUnit, packages, onChange }: Props) {
  const [showAdd, setShowAdd] = useState(false);
  const [newLabel,    setNewLabel]    = useState("");
  const [newQty,      setNewQty]      = useState("");
  const [newDiscount, setNewDiscount] = useState("0");
  const [newHighlight,setNewHighlight]= useState(false);

  const calcPrice = (qty: number, disc: number) =>
    parseFloat((qty * pricePerUnit * (1 - disc / 100)).toFixed(2));

  const addPreset = (preset: typeof PRESETS[0]) => {
    if (packages.find(p => p.label === preset.label)) return;
    onChange([...packages, {
      id:       Math.random().toString(36).slice(2),
      label:    preset.label,
      quantity: preset.quantity,
      discount: preset.discount,
      price:    calcPrice(preset.quantity, preset.discount),
      highlight:preset.highlight,
    }]);
  };

  const addCustom = () => {
    const qty  = parseInt(newQty);
    const disc = parseFloat(newDiscount) || 0;
    if (!newLabel.trim() || isNaN(qty) || qty < 1) return;
    onChange([...packages, {
      id:       Math.random().toString(36).slice(2),
      label:    newLabel.trim(),
      quantity: qty,
      discount: disc,
      price:    calcPrice(qty, disc),
      highlight:newHighlight,
    }]);
    setNewLabel(""); setNewQty(""); setNewDiscount("0"); setNewHighlight(false); setShowAdd(false);
  };

  const remove = (id: string) => onChange(packages.filter(p => p.id !== id));

  const toggleHighlight = (id: string) =>
    onChange(packages.map(p => p.id === id ? { ...p, highlight: !p.highlight } : { ...p, highlight: false }));

  return (
    <div className="space-y-4">
      {/* Pacotes existentes */}
      {packages.length > 0 && (
        <div className="space-y-2">
          {packages.map((pkg) => (
            <div key={pkg.id}
              className={`flex items-center gap-3 p-3.5 rounded-2xl border transition-all ${
                pkg.highlight
                  ? "bg-indigo-500/10 border-indigo-500/30"
                  : "bg-slate-950 border-slate-800"
              }`}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-black text-white text-sm">{pkg.label}</span>
                  {pkg.highlight && (
                    <span className="text-[9px] font-black text-indigo-400 bg-indigo-500/20 px-1.5 py-0.5 rounded border border-indigo-500/20 uppercase">
                      Popular
                    </span>
                  )}
                  {pkg.discount > 0 && (
                    <span className="text-[9px] font-black text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                      -{pkg.discount}%
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  {pkg.quantity} cotas ·{" "}
                  {pkg.discount > 0 && (
                    <span className="line-through text-slate-600 mr-1">
                      R$ {(pkg.quantity * pricePerUnit).toFixed(2)}
                    </span>
                  )}
                  <span className="text-white font-bold">R$ {pkg.price.toFixed(2)}</span>
                </p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button type="button" onClick={() => toggleHighlight(pkg.id)}
                  className={`p-1.5 rounded-lg transition-all ${pkg.highlight ? "text-indigo-400 bg-indigo-500/20" : "text-slate-600 hover:text-indigo-400 bg-slate-800"}`}
                  title="Destacar como popular">
                  <Star size={13}/>
                </button>
                <button type="button" onClick={() => remove(pkg.id)}
                  className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 bg-slate-800 transition-all">
                  <Trash2 size={13}/>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Presets rápidos */}
      {packages.length === 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Adicionar pacotes prontos:</p>
          <div className="grid grid-cols-2 gap-2">
            {PRESETS.map((p) => (
              <button key={p.label} type="button" onClick={() => addPreset(p)}
                className="flex items-center gap-2 p-3 bg-slate-950 border border-slate-800 rounded-xl hover:border-indigo-500/40 hover:bg-indigo-500/5 transition-all text-left">
                <Package size={14} className="text-slate-500 shrink-0"/>
                <div>
                  <p className="text-xs font-black text-white">{p.label}</p>
                  <p className="text-[10px] text-slate-500">
                    {p.quantity} cotas{p.discount > 0 ? ` · -${p.discount}%` : ""}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Botões de ação */}
      <div className="flex gap-2">
        <button type="button" onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-1.5 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors">
          <Plus size={13}/> Pacote personalizado
        </button>
        {packages.length > 0 && packages.length < 4 && (
          <span className="text-slate-700">·</span>
        )}
        {packages.length > 0 && packages.length < 4 && PRESETS.filter(p => !packages.find(pk => pk.label === p.label)).map(p => (
          <button key={p.label} type="button" onClick={() => addPreset(p)}
            className="text-xs font-bold text-slate-500 hover:text-white transition-colors">
            + {p.label}
          </button>
        ))}
      </div>

      {/* Form de pacote personalizado */}
      {showAdd && (
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Novo pacote</p>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-slate-500 font-bold uppercase">Nome</label>
              <input type="text" value={newLabel} onChange={e => setNewLabel(e.target.value)}
                placeholder="Ex: Mega"
                className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"/>
            </div>
            <div>
              <label className="text-[10px] text-slate-500 font-bold uppercase">Qtd. cotas</label>
              <input type="number" value={newQty} onChange={e => setNewQty(e.target.value)}
                placeholder="Ex: 15" min="1"
                className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"/>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 items-end">
            <div>
              <label className="text-[10px] text-slate-500 font-bold uppercase">Desconto %</label>
              <input type="number" value={newDiscount} onChange={e => setNewDiscount(e.target.value)}
                placeholder="0" min="0" max="90"
                className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"/>
            </div>
            <div>
              {newQty && (
                <div className="text-right">
                  <p className="text-[10px] text-slate-500">Total</p>
                  <p className="font-black text-emerald-400">
                    R$ {calcPrice(parseInt(newQty)||0, parseFloat(newDiscount)||0).toFixed(2)}
                  </p>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer" onClick={() => setNewHighlight(!newHighlight)}>
              <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${newHighlight ? "bg-indigo-600 border-indigo-600" : "border-slate-600"}`}>
                {newHighlight && <span className="text-white text-[8px] font-black">✓</span>}
              </div>
              <span className="text-xs text-slate-400">Destacar como popular</span>
            </label>
            <button type="button" onClick={addCustom}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-black transition-all">
              Adicionar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
