import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  Clock, 
  ChevronRight, 
  PlusCircle, 
  Ticket,
  BarChart3,
  Calendar
} from "lucide-react";
import { User, Raffle } from "../types";

interface DashboardProps {
  user: User | null;
}

interface DashboardRaffle extends Raffle {
  totalArrecadado: number;
  comissao: number;
  lucro: number;
}

export default function Dashboard({ user }: DashboardProps) {
  const [raffles, setRaffles] = useState<DashboardRaffle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/creator")
      .then(res => res.json())
      .then(data => {
        setRaffles(data);
        setLoading(false);
      });
  }, []);

  const totalGeral = raffles.reduce((acc, r) => acc + r.totalArrecadado, 0);
  const lucroTotal = raffles.reduce((acc, r) => acc + r.lucro, 0);
  const comissaoTotal = raffles.reduce((acc, r) => acc + r.comissao, 0);

  if (loading) return <div className="p-10 text-center text-slate-400">Carregando painel...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 space-y-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight">Visão <span className="text-indigo-500 italic">Estratégica</span></h1>
          <p className="text-slate-500 font-medium text-lg">Gerenciamento centralizado de suas campanhas ativos.</p>
        </div>
        <Link 
          to="/create-raffle"
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-3 shadow-xl shadow-indigo-600/20 transition-all hover:-translate-y-1"
        >
          <PlusCircle size={24} />
          <span>Lançar Novo Sorteio</span>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard 
          icon={<DollarSign size={24} />} 
          label="Volume Total" 
          value={`R$ ${totalGeral.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} 
          color="bg-emerald-500" 
        />
        <StatCard 
          icon={<TrendingUp size={24} />} 
          label="Seu Lucro (SaaS)" 
          value={`R$ ${lucroTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} 
          color="bg-indigo-600" 
        />
        <StatCard 
          icon={<Users size={24} />} 
          label="Taxas Acumuladas" 
          value={`R$ ${comissaoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} 
          color="bg-slate-700" 
        />
        <StatCard 
          icon={<Ticket size={24} />} 
          label="Rifas Ativas" 
          value={raffles.filter(r => r.status === 'active').length.toString()} 
          color="bg-slate-800" 
        />
      </div>

      {/* Main Content Area */}
      <div className="bg-slate-900/50 rounded-[2.5rem] border border-slate-800 shadow-2xl overflow-hidden backdrop-blur-sm">
        <div className="p-8 border-b border-slate-800 flex items-center justify-between bg-slate-900/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600/10 rounded-xl flex items-center justify-center text-indigo-400 border border-indigo-500/20">
              <BarChart3 size={20} />
            </div>
            <h2 className="text-xl font-bold text-white">Minhas Campanhas</h2>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">Dados Atualizados</span>
          </div>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left">
            <thead className="bg-slate-950/30">
              <tr>
                <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Ativo</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Sorteio</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Volume</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Lucro Líquido</th>
                <th className="px-8 py-6 text-right text-[10px] font-black text-slate-500 uppercase tracking-widest">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {raffles.map(raffle => (
                <tr key={raffle.id} className="group hover:bg-slate-800/30 transition-all">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl overflow-hidden bg-slate-800 border border-slate-700 shrink-0 shadow-lg">
                        <img 
                          src={JSON.parse(raffle.images)[0] || `https://picsum.photos/seed/${raffle.id}/200`} 
                          alt={raffle.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div>
                        <p className="font-bold text-white group-hover:text-indigo-400 transition-colors leading-tight mb-1">{raffle.title}</p>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Ticket: R$ {raffle.price_per_number.toFixed(2)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`
                      px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest border
                      ${raffle.status === 'active' 
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                        : 'bg-slate-800 text-slate-500 border-slate-700'}
                    `}>
                      {raffle.status === 'active' ? 'Ativa' : 'Finalizada'}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2 text-slate-400">
                      <Calendar size={14} className="text-indigo-400" />
                      <span className="text-sm font-medium">{new Date(raffle.draw_date).toLocaleDateString()}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <p className="font-bold text-white leading-none">R$ {raffle.totalArrecadado.toLocaleString()}</p>
                  </td>
                  <td className="px-8 py-6">
                    <p className="font-black text-emerald-400 leading-none">R$ {raffle.lucro.toLocaleString()}</p>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <Link 
                      to={`/raffle/${raffle.id}`}
                      className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-white bg-slate-800 px-4 py-2 rounded-xl transition-all border border-slate-700"
                    >
                      <span>Gerenciar</span>
                      <ChevronRight size={14} />
                    </Link>
                  </td>
                </tr>
              ))}
              {raffles.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-8 py-32 text-center">
                    <div className="max-w-xs mx-auto space-y-6">
                      <div className="w-20 h-20 bg-indigo-600/5 rounded-3xl flex items-center justify-center mx-auto text-indigo-400/20 border-2 border-dashed border-indigo-400/20">
                        <Ticket size={40} />
                      </div>
                      <div className="space-y-2">
                        <p className="text-white font-bold text-lg">Nenhuma campanha encontrada</p>
                        <p className="text-slate-500 text-sm">Comece a faturar hoje criando seu primeiro sorteio automatizado.</p>
                      </div>
                      <Link to="/create-raffle" className="inline-block bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-indigo-600/20">Criar Primeiro Sorteio</Link>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: any, label: string, value: string, color: string }) {
  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-800 flex flex-col justify-between group transition-all hover:border-indigo-500/30"
    >
      <div className={`${color} w-12 h-12 rounded-2xl flex items-center justify-center text-white mb-8 shadow-2xl shadow-current/20 transform group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">{label}</p>
        <p className="text-2xl font-black text-white tracking-tight leading-none">{value}</p>
      </div>
    </motion.div>
  );
}
