import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  Ticket, Calendar, Trophy, Users, TrendingUp,
  ShieldCheck, Zap, ArrowRight, PlusCircle,
  ChevronLeft, ChevronRight, Star, LayoutDashboard,
  BarChart3, Flame, Tag, Clock, Sparkles,
} from "lucide-react";
import { Raffle, User } from "../types";
import {
  getRaffles, getCreatorDashboard, DashboardRaffle, tsToDate,
} from "../lib/firebaseService";

// ─── Página do CRIADOR / ADMIN ───────────────────────────────────────────────
function CreatorHome({ user }: { user: User }) {
  const [raffles, setRaffles] = useState<DashboardRaffle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCreatorDashboard(user.id).then(setRaffles).finally(() => setLoading(false));
  }, [user.id]);

  const totalArrecadado = raffles.reduce((s, r) => s + r.totalArrecadado, 0);
  const lucroTotal = raffles.reduce((s, r) => s + r.lucro, 0);
  const ativas = raffles.filter((r) => r.status === "active").length;

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 space-y-10">
      {/* Banner boas-vindas */}
      <div className="relative bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-[2.5rem] overflow-hidden p-8 sm:p-12">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/4" />
        <div className="relative z-10">
          <p className="text-indigo-200 font-bold text-sm mb-2 uppercase tracking-widest">
            {user.role === "admin" ? "👑 Administrador" : "🎯 Criador"}
          </p>
          <h1 className="text-3xl sm:text-5xl font-black text-white mb-4 leading-none">
            Olá, {user.name.split(" ")[0]}!
          </h1>
          <p className="text-indigo-200 font-medium text-base sm:text-lg max-w-xl mb-8">
            Gerencie seus sorteios, acompanhe vendas e realize sorteios pelo seu painel.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link to="/create-raffle" className="flex items-center gap-2 bg-white text-indigo-700 px-6 py-3 rounded-2xl font-black text-sm shadow-xl transition-all hover:scale-[1.02]">
              <PlusCircle size={18} /> Criar Novo Sorteio
            </Link>
            <Link to="/dashboard" className="flex items-center gap-2 bg-indigo-500/30 border border-white/20 text-white px-6 py-3 rounded-2xl font-bold text-sm transition-all hover:bg-indigo-500/40">
              <LayoutDashboard size={18} /> Ir ao Painel
            </Link>
            {user.role === "admin" && (
              <Link to="/admin" className="flex items-center gap-2 bg-amber-500/20 border border-amber-400/30 text-amber-300 px-6 py-3 rounded-2xl font-bold text-sm transition-all hover:bg-amber-500/30">
                <ShieldCheck size={18} /> Painel Admin
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      {!loading && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { icon:<TrendingUp size={18}/>, label:"Arrecadado", value:`R$ ${totalArrecadado.toLocaleString("pt-BR",{minimumFractionDigits:2})}`, color:"bg-emerald-500/10 text-emerald-400" },
            { icon:<BarChart3 size={18}/>,  label:"Lucro",      value:`R$ ${lucroTotal.toLocaleString("pt-BR",{minimumFractionDigits:2})}`,      color:"bg-indigo-500/10 text-indigo-400" },
            { icon:<Ticket size={18}/>,     label:"Ativas",     value:String(ativas),                                                             color:"bg-amber-500/10 text-amber-400" },
          ].map((s) => (
            <div key={s.label} className="bg-slate-900 rounded-2xl border border-slate-800 p-5 text-center">
              <div className={`w-10 h-10 ${s.color} rounded-xl flex items-center justify-center mx-auto mb-3 border border-current/20`}>{s.icon}</div>
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">{s.label}</p>
              <p className="text-base font-black text-white leading-none">{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Rifas recentes */}
      {!loading && raffles.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-white">Minhas Campanhas</h2>
            <Link to="/dashboard" className="text-indigo-400 text-sm font-bold flex items-center gap-1">Ver todas <ChevronRight size={16}/></Link>
          </div>
          {raffles.slice(0,3).map((r) => {
            const pct = r.totalNumbers > 0 ? (r.soldNumbers.length / r.totalNumbers)*100 : 0;
            return (
              <Link key={r.id} to={`/dashboard/raffle/${r.id}`}
                className="flex items-center gap-4 bg-slate-900 rounded-2xl border border-slate-800 p-4 hover:border-indigo-500/30 transition-all group">
                <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-800 shrink-0">
                  <img src={r.images?.[0]??`https://picsum.photos/seed/${r.id}/100`} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer"/>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white text-sm line-clamp-1 group-hover:text-indigo-400 transition-colors">{r.title}</p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 rounded-full" style={{width:`${pct}%`}}/>
                    </div>
                    <span className="text-[10px] font-black text-slate-500 whitespace-nowrap">{r.soldNumbers.length}/{r.totalNumbers}</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-black text-emerald-400">R$ {r.lucro.toLocaleString("pt-BR")}</p>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">lucro</p>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {!loading && raffles.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-5">
          <div className="w-20 h-20 bg-indigo-600/5 rounded-3xl flex items-center justify-center border-2 border-dashed border-indigo-400/20">
            <Ticket size={36} className="text-indigo-400/30"/>
          </div>
          <p className="text-white font-bold text-lg">Nenhum sorteio criado ainda</p>
          <Link to="/create-raffle" className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-indigo-600/20">
            Criar Primeiro Sorteio
          </Link>
        </div>
      )}
    </div>
  );
}

// ─── CARROSSEL ───────────────────────────────────────────────────────────────
function HeroCarousel({ raffles }: { raffles: Raffle[] }) {
  const [current, setCurrent] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const start = () => {
    timer.current = setInterval(() => setCurrent((p) => (p+1) % raffles.length), 4000);
  };
  const stop = () => { if (timer.current) clearInterval(timer.current); };

  useEffect(() => { start(); return stop; }, [raffles.length]);

  const prev = () => { stop(); setCurrent((p) => (p-1+raffles.length)%raffles.length); start(); };
  const next = () => { stop(); setCurrent((p) => (p+1)%raffles.length); start(); };

  if (raffles.length === 0) return null;
  const r = raffles[current];
  const img = r.images?.[0] ?? `https://picsum.photos/seed/${r.id}/800/400`;
  const pct = r.totalNumbers > 0 ? (r.soldNumbers.length/r.totalNumbers)*100 : 0;

  return (
    <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-indigo-900/30">
      <AnimatePresence mode="wait">
        <motion.div key={r.id} initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:0.5}}>
          {/* Imagem */}
          <div className="relative h-56 sm:h-72">
            <img src={img} alt={r.title} className="w-full h-full object-cover" referrerPolicy="no-referrer"/>
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent"/>

            {/* Badge criador */}
            <div className="absolute top-4 left-4 bg-slate-950/70 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-slate-700">
              <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                por {r.creatorName ?? "Criador"}
              </p>
            </div>

            {/* Preço */}
            <div className="absolute top-4 right-4 bg-indigo-600 px-3 py-1.5 rounded-xl shadow-xl">
              <p className="text-[10px] text-indigo-200 font-bold">Por apenas</p>
              <p className="text-sm font-black text-white">R$ {r.pricePerNumber.toFixed(2)}</p>
            </div>

            {/* Info */}
            <div className="absolute bottom-4 left-4 right-20">
              <h2 className="text-xl sm:text-2xl font-black text-white leading-tight line-clamp-2">{r.title}</h2>
              <div className="flex items-center gap-3 mt-2">
                <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-indigo-500 to-indigo-400 rounded-full" style={{width:`${pct}%`}}/>
                </div>
                <span className="text-[10px] font-black text-slate-300 whitespace-nowrap">{pct.toFixed(0)}%</span>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="bg-slate-900 px-5 py-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs text-slate-500 font-bold">
                <Calendar size={11} className="inline mr-1"/>
                {tsToDate(r.drawDate).toLocaleDateString("pt-BR")}
                <span className="mx-2">·</span>
                {r.totalNumbers - r.soldNumbers.length} cotas disponíveis
              </p>
            </div>
            <Link to={`/raffle/${r.id}`}
              className="shrink-0 bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl font-black text-sm flex items-center gap-2 transition-all hover:scale-[1.02]">
              <Ticket size={16}/> Participar
            </Link>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Controles */}
      {raffles.length > 1 && (
        <>
          <button onClick={prev} className="absolute left-3 top-1/3 -translate-y-1/2 w-8 h-8 bg-slate-950/60 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-slate-950/90 transition-all border border-slate-700">
            <ChevronLeft size={16}/>
          </button>
          <button onClick={next} className="absolute right-3 top-1/3 -translate-y-1/2 w-8 h-8 bg-slate-950/60 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-slate-950/90 transition-all border border-slate-700">
            <ChevronRight size={16}/>
          </button>
          {/* Dots */}
          <div className="absolute bottom-16 right-5 flex gap-1.5">
            {raffles.map((_, i) => (
              <button key={i} onClick={() => { stop(); setCurrent(i); start(); }}
                className={`rounded-full transition-all ${i===current ? "w-5 h-2 bg-indigo-400" : "w-2 h-2 bg-slate-600"}`}/>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Página PÚBLICA (visitante ou participante logado) ───────────────────────
function PublicHome({ user }: { user: User | null }) {
  const [allRaffles, setAllRaffles] = useState<Raffle[]>([]);
  const [winners,    setWinners]    = useState<Raffle[]>([]);
  const [activeTab,  setActiveTab]  = useState("Destaques");
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    getRaffles().then((all) => {
      const active = all.filter((r) => r.status === "active");
      setAllRaffles(active);
      setWinners(all.filter((r) => r.status === "finished" && r.winnerName).slice(0, 5));
      // Tab inicial: Destaques se existir, senão a primeira categoria disponível
      const cats = getCategoryTabs(active);
      if (cats.length > 0) setActiveTab(cats[0]);
      setLoading(false);
    });
  }, []);

  const getCategoryTabs = (raffles: Raffle[]) => {
    const cats = new Set<string>();
    cats.add("Todos");
    // Destaques primeiro se existir
    if (raffles.some(r => (r as any).category === "Destaques")) cats.delete("Todos");
    raffles.forEach(r => {
      const cat = (r as any).category;
      if (cat) cats.add(cat);
    });
    if (raffles.length > 0) cats.add("Todos");
    // Reordena: Destaques primeiro, depois alfabético, Todos por último
    const arr = Array.from(cats);
    arr.sort((a, b) => {
      if (a === "Destaques") return -1;
      if (b === "Destaques") return  1;
      if (a === "Todos")     return  1;
      if (b === "Todos")     return -1;
      return a.localeCompare(b, "pt");
    });
    return arr;
  };

  const tabs = getCategoryTabs(allRaffles);
  const featured = allRaffles.filter(r => (r as any).category === "Destaques" || (!((r as any).category) && allRaffles.indexOf(r) < 5));

  const filtered = activeTab === "Todos"
    ? allRaffles
    : allRaffles.filter(r => (r as any).category === activeTab || (!((r as any).category) && activeTab === "Outros"));

  const now = Date.now();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <div className="max-w-2xl mx-auto px-4 pb-16">

        {/* Hero */}
        <div className="pt-8 pb-6 text-center">
          <div className="inline-flex items-center gap-2 bg-indigo-500/10 text-indigo-400 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest mb-5 border border-indigo-500/20">
            <Zap size={13}/> Sorteios Online Seguros
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white leading-none mb-3 tracking-tight">
            Sua chance de <span className="text-indigo-500">ganhar</span> começa aqui
          </h1>
          <p className="text-slate-400 text-sm sm:text-base mb-6">
            Participe dos melhores sorteios com segurança e transparência.
          </p>
          {!user ? (
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/register" className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3.5 rounded-2xl font-bold text-base shadow-xl shadow-indigo-600/30 transition-all flex items-center justify-center gap-2">
                <span>Criar Conta Grátis</span> <ChevronRight size={18}/>
              </Link>
              <a href="#rifas" className="bg-slate-900 border border-slate-800 text-white px-8 py-3.5 rounded-2xl font-bold text-base transition-all flex items-center justify-center">
                Ver Sorteios
              </a>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a href="#rifas" className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3.5 rounded-2xl font-bold text-base shadow-xl shadow-indigo-600/30 transition-all flex items-center justify-center gap-2">
                <Ticket size={18}/> Participar Agora
              </a>
              <Link to="/my-orders" className="bg-slate-900 border border-slate-800 text-white px-8 py-3.5 rounded-2xl font-bold text-base transition-all flex items-center justify-center">
                Meus Pedidos
              </Link>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { icon:<TrendingUp size={15}/>, label:"Arrecadado", value:"R$ 2.4M+" },
            { icon:<Users size={15}/>,      label:"Usuários",   value:"85k+" },
            { icon:<ShieldCheck size={15}/>,label:"Segurança",  value:"100%" },
          ].map((s) => (
            <div key={s.label} className="bg-slate-900 rounded-2xl border border-slate-800 p-3.5 text-center">
              <div className="flex justify-center text-indigo-500 mb-1.5">{s.icon}</div>
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">{s.label}</p>
              <p className="text-sm font-black text-white">{s.value}</p>
            </div>
          ))}
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1,2,3].map(i => <div key={i} className="h-48 bg-slate-900 rounded-3xl border border-slate-800 animate-pulse"/>)}
          </div>
        ) : allRaffles.length === 0 ? (
          <div className="text-center py-20">
            <Ticket size={40} className="text-slate-700 mx-auto mb-3"/>
            <p className="text-slate-500 font-medium">Nenhum sorteio disponível no momento.</p>
          </div>
        ) : (
          <>
            {/* Carrossel destaques */}
            {featured.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <Flame size={16} className="text-orange-400"/>
                  <h2 className="text-base font-black text-white uppercase tracking-widest">Em Destaque</h2>
                </div>
                <HeroCarousel raffles={featured}/>
              </div>
            )}

            {/* ── Abas de categorias ── */}
            <div id="rifas" className="mb-4">
              <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar snap-x snap-mandatory">
                {tabs.map((tab) => (
                  <button key={tab} onClick={() => setActiveTab(tab)}
                    className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all shrink-0 snap-start ${
                      activeTab === tab
                        ? tab === "Destaques"
                          ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 shadow-lg"
                          : "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                        : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
                    }`}>
                    {tab === "Destaques" && <Star size={11}/>}
                    {tab}
                    <span className="ml-0.5 text-[9px] opacity-60">
                      ({activeTab === tab
                        ? filtered.length
                        : tab === "Todos"
                          ? allRaffles.length
                          : allRaffles.filter(r => (r as any).category === tab).length
                      })
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* ── Lista de rifas da categoria ── */}
            {filtered.length === 0 ? (
              <div className="text-center py-12 bg-slate-900 rounded-2xl border border-slate-800">
                <Ticket size={32} className="text-slate-700 mx-auto mb-3"/>
                <p className="text-slate-500 font-medium text-sm">Nenhuma rifa nesta categoria.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filtered.map((raffle, idx) => {
                  const img      = raffle.images?.[0] ?? `https://picsum.photos/seed/${raffle.id}/600/300`;
                  const pct      = raffle.totalNumbers > 0 ? (raffle.soldNumbers.length/raffle.totalNumbers)*100 : 0;
                  const daysLeft = Math.ceil((tsToDate(raffle.drawDate).getTime()-now)/(1000*60*60*24));
                  const isHot    = pct > 70;

                  return (
                    <motion.div key={raffle.id}
                      initial={{ opacity:0, y:10 }}
                      animate={{ opacity:1, y:0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden hover:border-indigo-500/40 transition-all"
                    >
                      {/* Imagem */}
                      <Link to={`/raffle/${raffle.id}`} className="block relative h-44 sm:h-52 overflow-hidden">
                        <img src={img} alt={raffle.title}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                          referrerPolicy="no-referrer"/>
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent"/>

                        {/* Badges */}
                        <div className="absolute top-3 left-3 flex gap-2 flex-wrap">
                          {(raffle as any).category && (raffle as any).category !== "Outros" && (
                            <span className={`flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-lg ${
                              (raffle as any).category === "Destaques"
                                ? "bg-yellow-500/90 text-white"
                                : "bg-slate-950/80 text-slate-300 border border-slate-700"
                            }`}>
                              {(raffle as any).category === "Destaques" && <Star size={9}/>}
                              {(raffle as any).category}
                            </span>
                          )}
                          {isHot && (
                            <span className="flex items-center gap-1 bg-orange-500/90 text-white text-[10px] font-black px-2 py-1 rounded-lg">
                              <Flame size={10}/> QUENTE
                            </span>
                          )}
                          {daysLeft <= 3 && daysLeft > 0 && (
                            <span className="flex items-center gap-1 bg-red-600/90 text-white text-[10px] font-black px-2 py-1 rounded-lg">
                              <Clock size={10}/> {daysLeft}d
                            </span>
                          )}
                        </div>

                        <div className="absolute top-3 right-3 bg-indigo-600/90 px-2.5 py-1.5 rounded-xl">
                          <p className="text-[9px] text-indigo-200 font-bold leading-none">Por apenas</p>
                          <p className="text-sm font-black text-white">R$ {raffle.pricePerNumber.toFixed(2)}</p>
                        </div>

                        <div className="absolute bottom-3 left-3 right-3">
                          {raffle.creatorName && (
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-0.5">
                              por {raffle.creatorName}
                            </p>
                          )}
                          <h3 className="text-lg font-black text-white leading-tight line-clamp-2">{raffle.title}</h3>
                        </div>
                      </Link>

                      {/* Progresso + botão */}
                      <div className="px-4 py-4 space-y-3">
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center text-[10px] font-black tracking-widest uppercase">
                            <span className="text-slate-500">Progresso</span>
                            <span className="text-white">{pct.toFixed(0)}%</span>
                          </div>
                          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width:0 }}
                              animate={{ width:`${pct}%` }}
                              transition={{ duration:1, ease:"easeOut" }}
                              className={`h-full rounded-full ${pct > 70 ? "bg-gradient-to-r from-orange-500 to-red-500" : "bg-gradient-to-r from-indigo-600 to-indigo-400"}`}
                            />
                          </div>
                          <p className="text-[10px] text-slate-600 font-bold">
                            <Calendar size={9} className="inline mr-1"/>
                            {tsToDate(raffle.drawDate).toLocaleDateString("pt-BR")}
                          </p>
                        </div>

                        <Link to={`/raffle/${raffle.id}`}
                          className="flex items-center justify-between w-full bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-3.5 rounded-2xl font-black text-sm shadow-lg shadow-emerald-600/20 transition-all hover:scale-[1.01]">
                          <div className="flex items-center gap-2">
                            <Ticket size={18}/>
                            <div className="text-left">
                              <p className="text-sm font-black leading-none">PARTICIPAR</p>
                              <p className="text-[10px] text-emerald-200 font-bold">Garantir meus números</p>
                            </div>
                          </div>
                          <ArrowRight size={18}/>
                        </Link>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* Ganhadores */}
            {winners.length > 0 && (
              <div className="mt-10 space-y-4">
                <h2 className="text-xl font-black text-white flex items-center gap-2">
                  <Trophy size={18} className="text-yellow-400"/> Ganhadores
                </h2>
                {winners.map((r) => (
                  <Link key={r.id} to={`/raffle/${r.id}`}
                    className="flex items-center gap-4 bg-slate-900 rounded-2xl border border-slate-800 p-4 hover:border-yellow-500/30 transition-all group">
                    <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-800 shrink-0">
                      <img src={r.images?.[0]??`https://picsum.photos/seed/${r.id}/100`} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer"/>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <Trophy size={12} className="text-yellow-400 shrink-0"/>
                        <p className="text-sm font-black text-white line-clamp-1 group-hover:text-yellow-400 transition-colors">{r.winnerName}</p>
                      </div>
                      <p className="text-xs text-slate-500 line-clamp-1">{r.title}</p>
                    </div>
                    <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-black px-2.5 py-1 rounded-lg border border-emerald-500/20 uppercase tracking-widest shrink-0">
                      Concluído
                    </span>
                  </Link>
                ))}
              </div>
            )}

            {/* CTA cadastro */}
            {!user && (
              <div className="mt-10 bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-3xl p-8 text-center space-y-5">
                <h2 className="text-2xl font-black text-white">Quer criar seus próprios sorteios?</h2>
                <p className="text-indigo-200 font-medium text-sm">Cadastre-se como criador e lance sua campanha em minutos.</p>
                <Link to="/register" className="inline-flex items-center gap-3 bg-white text-indigo-700 px-8 py-4 rounded-2xl font-black text-base shadow-xl transition-all hover:scale-[1.02]">
                  <PlusCircle size={20}/> Começar Agora — Grátis
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Roteador principal ──────────────────────────────────────────────────────
export default function Home({ user }: { user: User | null }) {
  if (user?.role === "creator" || user?.role === "admin") {
    return <CreatorHome user={user}/>;
  }
  return <PublicHome user={user}/>;
}
