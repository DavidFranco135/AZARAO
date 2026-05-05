import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import {
  TrendingUp,
  ShieldCheck,
  Zap,
  Users,
  ChevronRight,
  Ticket,
  Calendar,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { Raffle } from "../types";
import { getRaffles, tsToDate } from "../lib/firebaseService";

export default function Home() {
  const [raffles, setRaffles] = useState<Raffle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRaffles()
      .then(setRaffles)
      .finally(() => setLoading(false));
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
  };
  const itemVariants = { hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-20 sm:space-y-24 pb-24 text-slate-200"
    >
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="relative min-h-[600px] sm:min-h-[700px] flex items-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1626282874430-c11ae32d2898?q=80&w=2070&auto=format&fit=crop"
            alt="Hero"
            className="w-full h-full object-cover opacity-20"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-950/90 to-slate-950" />
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/4" />
        </div>

        <div className="max-w-7xl mx-auto px-4 relative z-10 w-full text-center md:text-left">
          <div className="max-w-3xl mx-auto md:mx-0">
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center space-x-2 bg-indigo-500/10 text-indigo-400 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest mb-6 border border-indigo-500/20 backdrop-blur-sm"
            >
              <Zap size={14} />
              <span>Plataforma SaaS Profissional de Sorteios</span>
            </motion.div>
            <motion.h1
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-4xl sm:text-6xl md:text-8xl font-black text-white leading-none mb-6 tracking-tight"
            >
              Crie sorteios em{" "}
              <span className="text-indigo-500">segundos</span>.
            </motion.h1>
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-lg sm:text-xl text-slate-400 mb-10 leading-relaxed max-w-xl mx-auto md:mx-0"
            >
              A GGRIFAS oferece infraestrutura completa para você lançar
              campanhas lucrativas com automação total de pagamentos.
            </motion.p>
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start"
            >
              <Link
                to="/register"
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 sm:px-10 py-4 sm:py-5 rounded-2xl font-bold text-base sm:text-lg shadow-2xl shadow-indigo-600/30 transition-all hover:scale-[1.02] active:scale-[0.98] text-center flex items-center justify-center gap-3"
              >
                <span>Começar Agora</span>
                <ChevronRight size={20} />
              </Link>
              <a
                href="#raffles"
                className="bg-slate-900/50 hover:bg-slate-800 backdrop-blur-md text-white px-8 sm:px-10 py-4 sm:py-5 rounded-2xl font-bold text-base sm:text-lg border border-slate-800 transition-all text-center flex items-center justify-center"
              >
                Explorar Rifas
              </a>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Stats ────────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 -mt-24 sm:-mt-32 relative z-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {[
            { label: "Arrecadação Total", value: "R$ 2.4M+", icon: <TrendingUp size={20} /> },
            { label: "Rifas Ativas", value: "142", icon: <Ticket size={20} /> },
            { label: "Usuários Reais", value: "85k+", icon: <Users size={20} /> },
            { label: "Segurança", value: "100%", icon: <ShieldCheck size={20} /> },
          ].map((stat, i) => (
            <div
              key={i}
              className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 p-4 sm:p-6 rounded-2xl sm:rounded-3xl text-center md:text-left"
            >
              <div className="text-indigo-500 mb-2 sm:mb-3 flex justify-center md:justify-start">
                {stat.icon}
              </div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                {stat.label}
              </p>
              <h4 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {stat.value}
              </h4>
            </div>
          ))}
        </div>
      </section>

      {/* ── Raffles ──────────────────────────────────────────────────── */}
      <section id="raffles" className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div className="text-center md:text-left">
            <h2 className="text-3xl sm:text-5xl font-black text-white mb-3 tracking-tighter">
              Rifas em <span className="text-indigo-500 italic">Destaque</span>
            </h2>
            <p className="text-slate-500 font-medium text-base sm:text-lg">
              Os sorteios mais populares esperando por você.
            </p>
          </div>
          <Link
            to="/#raffles"
            className="text-indigo-400 font-bold flex items-center gap-2 group mx-auto md:mx-0"
          >
            <span>Ver todas</span>
            <ChevronRight
              size={20}
              className="group-hover:translate-x-1 transition-transform"
            />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-10">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-slate-900 animate-pulse h-[460px] rounded-[2rem] border border-slate-800"
              />
            ))}
          </div>
        ) : raffles.length === 0 ? (
          <div className="text-center py-24">
            <Ticket size={48} className="text-slate-700 mx-auto mb-4" />
            <p className="text-slate-500 font-medium">
              Nenhuma rifa disponível no momento.
            </p>
          </div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-10"
          >
            {raffles.map((raffle) => {
              const img = raffle.images?.[0] ??
                `https://picsum.photos/seed/${raffle.id}/600/400`;
              const progress =
                raffle.totalNumbers > 0
                  ? (raffle.soldNumbers.length / raffle.totalNumbers) * 100
                  : 0;

              return (
                <motion.div
                  key={raffle.id}
                  variants={itemVariants}
                  className="group bg-slate-900/50 rounded-[2rem] overflow-hidden border border-slate-800 hover:border-indigo-500/50 transition-all duration-500 flex flex-col"
                >
                  <Link
                    to={`/raffle/${raffle.id}`}
                    className="relative h-56 sm:h-64 overflow-hidden block"
                  >
                    <img
                      src={img}
                      alt={raffle.title}
                      className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-1000 opacity-80 group-hover:opacity-100"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent" />
                    <div className="absolute top-4 right-4 bg-indigo-600 px-3 py-1.5 rounded-xl font-black text-white shadow-xl text-sm border border-indigo-400/20">
                      R$ {raffle.pricePerNumber.toFixed(2)}
                    </div>
                    {raffle.status === "finished" && (
                      <div className="absolute top-4 left-4 bg-slate-900/80 px-3 py-1.5 rounded-xl font-black text-slate-400 text-xs uppercase tracking-widest border border-slate-700">
                        Encerrada
                      </div>
                    )}
                  </Link>
                  <div className="p-6 sm:p-8 flex-grow flex flex-col">
                    <h3 className="text-xl font-bold text-white mb-2 tracking-tight group-hover:text-indigo-400 transition-colors line-clamp-2">
                      {raffle.title}
                    </h3>
                    <p className="text-slate-500 font-medium line-clamp-2 mb-4 flex-grow leading-relaxed text-sm">
                      {raffle.description}
                    </p>

                    {/* Progress */}
                    <div className="mb-5 space-y-2">
                      <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-widest">
                        <span>{raffle.soldNumbers.length} vendidos</span>
                        <span>{progress.toFixed(0)}%</span>
                      </div>
                      <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-500 rounded-full transition-all duration-700"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2 text-slate-400">
                        <Calendar size={14} />
                        <span className="text-xs font-bold uppercase tracking-widest">
                          {tsToDate(raffle.drawDate).toLocaleDateString("pt-BR")}
                        </span>
                      </div>
                      <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                        {raffle.totalNumbers} Cotas
                      </div>
                    </div>
                    <Link
                      to={`/raffle/${raffle.id}`}
                      className="w-full bg-slate-800 group-hover:bg-indigo-600 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg border border-slate-700 group-hover:border-indigo-400/20 text-sm"
                    >
                      <Ticket size={18} />
                      <span>Participar Agora</span>
                    </Link>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </section>

      {/* ── Trust Banner ─────────────────────────────────────────────── */}
      <section className="bg-slate-900 py-20 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-center">
          <div className="relative order-2 md:order-1">
            <div className="absolute inset-0 bg-indigo-600/20 rounded-[2rem] blur-3xl opacity-30" />
            <img
              src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop"
              alt="Dashboard Preview"
              className="relative rounded-[2rem] border border-slate-700 shadow-2xl w-full"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="space-y-6 sm:space-y-8 order-1 md:order-2">
            <h2 className="text-3xl sm:text-4xl font-black text-white leading-tight">
              Painel completo para{" "}
              <span className="text-indigo-500">gestão estratégica</span> de
              seus sorteios.
            </h2>
            <div className="space-y-5">
              {[
                {
                  title: "Relatórios em Tempo Real",
                  desc: "Acompanhe cada venda e comissão instantaneamente.",
                },
                {
                  title: "Gateway Automatizado",
                  desc: "PIX com liberação de números sem intervenção manual.",
                },
                {
                  title: "Controle de Usuários",
                  desc: "Gerencie seus compradores e participantes com facilidade.",
                },
              ].map((item, i) => (
                <div key={i} className="flex gap-4">
                  <div className="w-6 h-6 bg-indigo-600/20 text-indigo-400 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 size={14} />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-base sm:text-lg">
                      {item.title}
                    </h4>
                    <p className="text-slate-500 font-medium text-sm sm:text-base">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <Link
              to="/register"
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 sm:py-5 rounded-2xl font-bold shadow-xl shadow-indigo-600/20 transition-all inline-flex items-center gap-3"
            >
              <span>EXPLORAR FERRAMENTAS</span>
              <ArrowRight size={20} />
            </Link>
          </div>
        </div>
      </section>
    </motion.div>
  );
}
