import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import {
  Ticket, Calendar, ChevronRight, Trophy, Users,
  TrendingUp, ShieldCheck, Zap, CheckCircle2, ArrowRight,
  PlusCircle, LayoutDashboard, BarChart3, Star,
} from "lucide-react";
import { Raffle, User } from "../types";
import { getRaffles, getCreatorDashboard, DashboardRaffle, tsToDate } from "../lib/firebaseService";

// ─── Página para CRIADORES e ADMIN ───────────────────────────────────────────
function CreatorHome({ user }: { user: User }) {
  const [raffles, setRaffles] = useState<DashboardRaffle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCreatorDashboard(user.id)
      .then(setRaffles)
      .finally(() => setLoading(false));
  }, [user.id]);

  const totalArrecadado = raffles.reduce((s, r) => s + r.totalArrecadado, 0);
  const lucroTotal = raffles.reduce((s, r) => s + r.lucro, 0);
  const ativas = raffles.filter((r) => r.status === "active").length;

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 space-y-10">
      {/* Boas vindas */}
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
            <Link
              to="/create-raffle"
              className="flex items-center gap-2 bg-white text-indigo-700 px-6 py-3 rounded-2xl font-black text-sm shadow-xl transition-all hover:scale-[1.02]"
            >
              <PlusCircle size={18} /> Criar Novo Sorteio
            </Link>
            <Link
              to="/dashboard"
              className="flex items-center gap-2 bg-indigo-500/30 border border-white/20 text-white px-6 py-3 rounded-2xl font-bold text-sm transition-all hover:bg-indigo-500/40"
            >
              <LayoutDashboard size={18} /> Ir ao Painel
            </Link>
            {user.role === "admin" && (
              <Link
                to="/admin"
                className="flex items-center gap-2 bg-amber-500/20 border border-amber-400/30 text-amber-300 px-6 py-3 rounded-2xl font-bold text-sm transition-all hover:bg-amber-500/30"
              >
                <ShieldCheck size={18} /> Painel Admin
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Stats rápidos */}
      {loading ? (
        <div className="grid grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="h-28 bg-slate-900 rounded-2xl border border-slate-800 animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 text-center">
            <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center mx-auto mb-3">
              <TrendingUp size={18} className="text-emerald-400" />
            </div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Arrecadado</p>
            <p className="text-lg font-black text-white">
              R$ {totalArrecadado.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 text-center">
            <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center mx-auto mb-3">
              <BarChart3 size={18} className="text-indigo-400" />
            </div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Lucro</p>
            <p className="text-lg font-black text-white">
              R$ {lucroTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 text-center">
            <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Ticket size={18} className="text-amber-400" />
            </div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Ativas</p>
            <p className="text-lg font-black text-white">{ativas}</p>
          </div>
        </div>
      )}

      {/* Minhas rifas recentes */}
      {!loading && raffles.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-white">Minhas Campanhas</h2>
            <Link to="/dashboard" className="text-indigo-400 text-sm font-bold flex items-center gap-1 hover:text-indigo-300">
              Ver todas <ChevronRight size={16} />
            </Link>
          </div>
          <div className="space-y-3">
            {raffles.slice(0, 3).map((r) => {
              const progress = r.totalNumbers > 0
                ? (r.soldNumbers.length / r.totalNumbers) * 100 : 0;
              return (
                <Link
                  key={r.id}
                  to={`/dashboard/raffle/${r.id}`}
                  className="flex items-center gap-4 bg-slate-900 rounded-2xl border border-slate-800 p-4 hover:border-indigo-500/30 transition-all group"
                >
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-800 shrink-0">
                    <img
                      src={r.images?.[0] ?? `https://picsum.photos/seed/${r.id}/100`}
                      alt="" className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-white text-sm line-clamp-1 group-hover:text-indigo-400 transition-colors">
                      {r.title}
                    </p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${progress}%` }} />
                      </div>
                      <span className="text-[10px] font-black text-slate-500 whitespace-nowrap">
                        {r.soldNumbers.length}/{r.totalNumbers}
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-black text-emerald-400">
                      R$ {r.lucro.toLocaleString("pt-BR")}
                    </p>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">lucro</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {!loading && raffles.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-5">
          <div className="w-20 h-20 bg-indigo-600/5 rounded-3xl flex items-center justify-center border-2 border-dashed border-indigo-400/20">
            <Ticket size={36} className="text-indigo-400/30" />
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

// ─── Página PÚBLICA (usuário logado ou visitante) ────────────────────────────
function PublicHome({ user }: { user: User | null }) {
  const [raffles, setRaffles]   = useState<Raffle[]>([]);
  const [loading, setLoading]   = useState(true);
  const [winners, setWinners]   = useState<Raffle[]>([]);

  useEffect(() => {
    getRaffles().then((all) => {
      setRaffles(all.filter((r) => r.status === "active"));
      setWinners(all.filter((r) => r.status === "finished" && r.winnerName).slice(0, 5));
      setLoading(false);
    });
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">

      {/* ── Hero mobile-first ─────────────────────────────────────── */}
      <section className="relative px-4 pt-10 pb-6 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-900/20 to-transparent pointer-events-none" />
        <div className="relative z-10 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-indigo-500/10 text-indigo-400 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest mb-5 border border-indigo-500/20">
            <Zap size={13} /> Sorteios Online Seguros
          </div>
          <h1 className="text-4xl sm:text-6xl font-black text-white leading-none mb-4 tracking-tight">
            Sua chance de <span className="text-indigo-500">ganhar</span> começa aqui
          </h1>
          <p className="text-slate-400 text-base sm:text-lg mb-8 leading-relaxed">
            Participe dos melhores sorteios online com total segurança e transparência.
          </p>
          {!user ? (
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/register" className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-xl shadow-indigo-600/30 transition-all hover:scale-[1.02] flex items-center justify-center gap-2">
                <span>Criar Conta Grátis</span> <ChevronRight size={20} />
              </Link>
              <a href="#rifas" className="bg-slate-900 border border-slate-800 text-white px-8 py-4 rounded-2xl font-bold text-lg transition-all flex items-center justify-center">
                Ver Sorteios
              </a>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a href="#rifas" className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-xl shadow-indigo-600/30 transition-all flex items-center justify-center gap-2">
                <Ticket size={20} /> Participar Agora
              </a>
              <Link to="/my-orders" className="bg-slate-900 border border-slate-800 text-white px-8 py-4 rounded-2xl font-bold text-lg transition-all flex items-center justify-center">
                Meus Pedidos
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ── Stats ─────────────────────────────────────────────────── */}
      <section className="px-4 py-4 max-w-2xl mx-auto">
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: <TrendingUp size={16}/>, label: "Arrecadado",  value: "R$ 2.4M+" },
            { icon: <Users size={16}/>,      label: "Usuários",    value: "85k+" },
            { icon: <ShieldCheck size={16}/>,label: "Segurança",   value: "100%" },
          ].map((s) => (
            <div key={s.label} className="bg-slate-900 rounded-2xl border border-slate-800 p-4 text-center">
              <div className="flex justify-center text-indigo-500 mb-2">{s.icon}</div>
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">{s.label}</p>
              <p className="text-base font-black text-white">{s.value}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Rifas ativas ──────────────────────────────────────────── */}
      <section id="rifas" className="px-4 py-6 max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-black text-white">
            🎟️ Sorteios <span className="text-indigo-500">Ativos</span>
          </h2>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
              {raffles.length} disponíveis
            </span>
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1,2,3].map((i) => (
              <div key={i} className="h-40 bg-slate-900 rounded-3xl border border-slate-800 animate-pulse" />
            ))}
          </div>
        ) : raffles.length === 0 ? (
          <div className="text-center py-16">
            <Ticket size={40} className="text-slate-700 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">Nenhum sorteio ativo no momento.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {raffles.map((raffle) => {
              const img = raffle.images?.[0] ?? `https://picsum.photos/seed/${raffle.id}/600/300`;
              const progress = raffle.totalNumbers > 0
                ? (raffle.soldNumbers.length / raffle.totalNumbers) * 100 : 0;
              const available = raffle.totalNumbers - raffle.soldNumbers.length;

              return (
                <motion.div
                  key={raffle.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden hover:border-indigo-500/40 transition-all"
                >
                  {/* Imagem */}
                  <Link to={`/raffle/${raffle.id}`} className="block relative h-44 sm:h-52 overflow-hidden">
                    <img src={img} alt={raffle.title}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                      referrerPolicy="no-referrer" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4">
                      <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-1">
                        🔥 Corre que está acabando!
                      </p>
                      <h3 className="text-xl font-black text-white leading-tight line-clamp-2">
                        {raffle.title}
                      </h3>
                      <p className="text-slate-300 text-xs font-medium mt-1">
                        ADQUIRA JÁ SEU BILHETE!
                      </p>
                    </div>
                    <div className="absolute top-4 right-4 bg-indigo-600 px-3 py-1.5 rounded-xl">
                      <p className="text-[10px] text-indigo-200 font-bold uppercase">Por apenas</p>
                      <p className="text-sm font-black text-white">R$ {raffle.pricePerNumber.toFixed(2)}</p>
                    </div>
                  </Link>

                  {/* Detalhes */}
                  <div className="p-5 space-y-4">
                    {/* Progresso */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                        <span className="text-emerald-400">Disponíveis {available}</span>
                        <span className="text-rose-400">Vendidos {raffle.soldNumbers.length}</span>
                      </div>
                      <div className="h-2.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-indigo-600 to-indigo-400 rounded-full transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] font-bold text-slate-500">
                        <span>Total: {raffle.totalNumbers} cotas</span>
                        <span className="flex items-center gap-1">
                          <Calendar size={11} /> {tsToDate(raffle.drawDate).toLocaleDateString("pt-BR")}
                        </span>
                      </div>
                    </div>

                    {/* Botão comprar */}
                    <Link
                      to={`/raffle/${raffle.id}`}
                      className="flex items-center justify-between w-full bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-4 rounded-2xl font-black text-lg shadow-xl shadow-emerald-600/20 transition-all hover:scale-[1.01] active:scale-[0.99]"
                    >
                      <div className="flex items-center gap-3">
                        <Ticket size={22} />
                        <div className="text-left">
                          <p className="text-sm font-black leading-none">COMPRAR</p>
                          <p className="text-[10px] text-emerald-200 font-bold">Garantir meus números</p>
                        </div>
                      </div>
                      <ArrowRight size={22} />
                    </Link>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Ganhadores ────────────────────────────────────────────── */}
      {winners.length > 0 && (
        <section className="px-4 py-6 max-w-2xl mx-auto">
          <h2 className="text-xl font-black text-white mb-5">
            🏆 Ganhadores{" "}
            <span className="text-sm font-medium text-slate-500">Pessoas reais, prêmios reais.</span>
          </h2>
          <div className="space-y-3">
            {winners.map((r) => (
              <Link
                key={r.id}
                to={`/raffle/${r.id}`}
                className="flex items-center gap-4 bg-slate-900 rounded-2xl border border-slate-800 p-4 hover:border-yellow-500/30 transition-all group"
              >
                <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-800 shrink-0">
                  <img
                    src={r.images?.[0] ?? `https://picsum.photos/seed/${r.id}/100`}
                    alt="" className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Trophy size={12} className="text-yellow-400 shrink-0" />
                    <p className="text-sm font-black text-white line-clamp-1 group-hover:text-yellow-400 transition-colors">
                      {r.winnerName}
                    </p>
                  </div>
                  <p className="text-xs text-slate-500 font-medium line-clamp-1">{r.title}</p>
                  <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest mt-0.5">
                    #{String(r.winnerNumber).padStart(3,"0")} · {tsToDate(r.drawnAt).toLocaleDateString("pt-BR")}
                  </p>
                </div>
                <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-black px-2.5 py-1 rounded-lg border border-emerald-500/20 uppercase tracking-widest shrink-0">
                  Concluído
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── Por que usar? ─────────────────────────────────────────── */}
      <section className="px-4 py-8 max-w-2xl mx-auto">
        <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 sm:p-8 space-y-5">
          <h2 className="text-xl font-black text-white">Por que a GGRIFAS?</h2>
          {[
            { icon: <Zap size={18}/>,        title: "Rápido e gratuito",       desc: "Ferramenta intuitiva para participar em segundos." },
            { icon: <ShieldCheck size={18}/>, title: "Segurança garantida",     desc: "Transações seguras e sorteios transparentes." },
            { icon: <Star size={18}/>,        title: "Sorteios verificados",    desc: "Todos os sorteios são monitorados pela plataforma." },
          ].map((f) => (
            <div key={f.title} className="flex gap-4">
              <div className="w-10 h-10 bg-indigo-600/10 text-indigo-400 rounded-xl flex items-center justify-center shrink-0 border border-indigo-500/20">
                {f.icon}
              </div>
              <div>
                <p className="font-bold text-white text-sm">{f.title}</p>
                <p className="text-slate-500 text-xs mt-0.5">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA cadastro ──────────────────────────────────────────── */}
      {!user && (
        <section className="px-4 pb-12 max-w-2xl mx-auto">
          <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-3xl p-8 text-center space-y-5">
            <h2 className="text-2xl font-black text-white">Quer criar seus próprios sorteios?</h2>
            <p className="text-indigo-200 font-medium text-sm leading-relaxed">
              Cadastre-se como criador e lance sua campanha em minutos com automação total.
            </p>
            <Link
              to="/register"
              className="inline-flex items-center gap-3 bg-white text-indigo-700 px-8 py-4 rounded-2xl font-black text-base shadow-xl transition-all hover:scale-[1.02]"
            >
              <PlusCircle size={20} /> Começar Agora — Grátis
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}

// ─── Componente principal — decide qual view mostrar ────────────────────────
export default function Home({ user }: { user: User | null }) {
  const isCreatorOrAdmin = user?.role === "creator" || user?.role === "admin";

  if (isCreatorOrAdmin) {
    return <CreatorHome user={user!} />;
  }

  return <PublicHome user={user} />;
}
