import { useState, useRef } from "react";
import { motion } from "motion/react";
import {
  FileText, Check, AlertTriangle, ChevronDown,
  Percent, Calendar, Shield, Ban, CheckCircle2,
} from "lucide-react";

interface Props {
  commissionRate: number;
  onAccept: () => void;
  onDecline: () => void;
}

export default function CreatorTermsModal({ commissionRate, onAccept, onDecline }: Props) {
  const [scrolledToBottom, setScrolledToBottom] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 20;
    if (atBottom) setScrolledToBottom(true);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl">
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 16 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="bg-slate-900 w-full max-w-2xl rounded-[2rem] border border-slate-800 shadow-2xl flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 bg-indigo-600/10 rounded-xl flex items-center justify-center text-indigo-400 border border-indigo-500/20">
              <FileText size={20} />
            </div>
            <div>
              <h2 className="font-black text-white text-xl">Termos do Criador</h2>
              <p className="text-xs text-slate-500 font-medium">Leia com atenção antes de criar sua rifa</p>
            </div>
          </div>
        </div>

        {/* Cards de resumo — pontos mais importantes */}
        <div className="px-6 pt-5 shrink-0">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Resumo do que você precisa saber</p>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <SummaryCard
              icon={<Percent size={16} />}
              color="amber"
              title={`Comissão: ${commissionRate}%`}
              desc="Descontada automaticamente do valor arrecadado"
            />
            <SummaryCard
              icon={<Shield size={16} />}
              color="indigo"
              title="Você é responsável"
              desc="Pela legalidade e entrega do prêmio"
            />
            <SummaryCard
              icon={<Calendar size={16} />}
              color="emerald"
              title="Realize o sorteio"
              desc="Na data definida, sem atrasos"
            />
            <SummaryCard
              icon={<Ban size={16} />}
              color="red"
              title="Fraude = suspensão"
              desc="Conta suspensa e repasse bloqueado"
            />
          </div>
        </div>

        {/* Conteúdo com scroll */}
        <div className="px-6 shrink-0">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Termos Completos</p>
            {!scrolledToBottom && (
              <div className="flex items-center gap-1.5 text-[10px] text-amber-400 font-black animate-bounce">
                <ChevronDown size={13} /> Role para baixo para continuar
              </div>
            )}
          </div>
        </div>

        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="mx-6 mb-4 flex-1 overflow-y-auto bg-slate-950 rounded-2xl border border-slate-800 p-5 space-y-5 text-sm text-slate-400 leading-relaxed custom-scrollbar min-h-0"
          style={{ maxHeight: "260px" }}
        >
          <TermsSection title="1. Comissão e Pagamentos">
            A GGRIFAS cobra uma taxa de serviço de <strong className="text-white">{commissionRate}%</strong> sobre o valor total arrecadado em cada rifa. Esta taxa é calculada automaticamente e descontada antes do repasse ao Criador. Não há cobranças adicionais ocultas. O repasse ao Criador é de responsabilidade do sistema após confirmação dos pagamentos.
          </TermsSection>

          <TermsSection title="2. Responsabilidade do Criador">
            O Criador é o <strong className="text-white">único responsável</strong> pela organização, legalidade e execução do sorteio. Isso inclui: (a) garantir que o prêmio existe e será entregue; (b) realizar o sorteio na data divulgada; (c) obter eventuais autorizações legais junto à SEAE/ME quando exigidas pela Lei 5.768/1971; (d) comunicar aos participantes o resultado do sorteio.
          </TermsSection>

          <TermsSection title="3. Prêmio e Entrega">
            O Criador garante que o prêmio anunciado <strong className="text-white">existe, está disponível e será entregue</strong> ao ganhador no prazo máximo de 30 dias após o sorteio. Sorteios com prêmios inexistentes ou não entregues resultarão em suspensão permanente da conta e possível comunicação às autoridades.
          </TermsSection>

          <TermsSection title="4. Realização do Sorteio">
            O sorteio deve ser realizado <strong className="text-white">na data definida no momento da criação da rifa</strong>. Atrasos de mais de 7 dias sem comunicação prévia poderão resultar em intervenção da plataforma para proteger os participantes. Em caso de cancelamento, o Criador é responsável por reembolsar os participantes.
          </TermsSection>

          <TermsSection title="5. Conteúdo Proibido">
            É proibido criar rifas para: arrecadação de dinheiro sem prêmio real (crowdfunding disfarçado), sorteios com prêmios ilegais, lavagem de dinheiro, ou qualquer atividade que viole a legislação brasileira. A GGRIFAS pode remover rifas sem aviso prévio.
          </TermsSection>

          <TermsSection title="6. Suspensão e Bloqueio">
            A GGRIFAS se reserva o direito de <strong className="text-white">suspender a conta</strong> e <strong className="text-white">reter valores</strong> pendentes em caso de: denúncias de fraude, não entrega de prêmio, violação destes Termos ou determinação judicial. Valores retidos poderão ser utilizados para reembolsar participantes lesados.
          </TermsSection>

          <TermsSection title="7. Aceitação e Vigência">
            Ao aceitar estes Termos, o Criador declara ter lido, compreendido e concordado com todas as cláusulas acima. Estes Termos entram em vigor imediatamente e permanecem válidos enquanto a conta estiver ativa na plataforma.
          </TermsSection>

          <div className="text-center text-slate-600 text-xs pt-2 pb-1">— Fim dos Termos do Criador —</div>
        </div>

        {/* Aceite e botões */}
        <div className="px-6 pb-6 space-y-4 shrink-0">
          {/* Checkbox */}
          <label
            className={`flex items-start gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all ${
              accepted
                ? "bg-emerald-500/10 border-emerald-500/30"
                : scrolledToBottom
                ? "bg-slate-800 border-slate-700 hover:border-slate-600"
                : "bg-slate-800/50 border-slate-800 opacity-50 pointer-events-none"
            }`}
            onClick={() => scrolledToBottom && setAccepted((v) => !v)}
          >
            <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${
              accepted ? "bg-emerald-500 border-emerald-500" : "border-slate-500"
            }`}>
              {accepted && <Check size={12} className="text-white" />}
            </div>
            <span className="text-sm text-slate-300 font-medium leading-relaxed select-none">
              Li, compreendi e aceito integralmente os <strong className="text-white">Termos do Criador</strong>, incluindo a taxa de comissão de <strong className="text-white">{commissionRate}%</strong> e minhas responsabilidades sobre o sorteio.
            </span>
          </label>

          {!scrolledToBottom && (
            <p className="text-center text-[10px] text-amber-400 font-bold uppercase tracking-widest">
              ↑ Role o texto acima até o final para habilitar o aceite
            </p>
          )}

          {/* Botões */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={onDecline}
              className="py-3.5 rounded-2xl font-bold text-sm text-slate-400 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all"
            >
              Cancelar
            </button>
            <button
              onClick={() => { if (accepted) onAccept(); }}
              disabled={!accepted}
              className="py-3.5 rounded-2xl font-black text-sm text-white bg-indigo-600 hover:bg-indigo-500 shadow-xl shadow-indigo-600/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <CheckCircle2 size={18} /> ACEITAR E CONTINUAR
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function SummaryCard({ icon, color, title, desc }: {
  icon: React.ReactNode; color: string; title: string; desc: string;
}) {
  const colors: Record<string, string> = {
    amber:   "bg-amber-500/10 text-amber-400 border-amber-500/20",
    indigo:  "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    red:     "bg-red-500/10 text-red-400 border-red-500/20",
  };
  return (
    <div className={`p-3.5 rounded-2xl border ${colors[color]} space-y-1.5`}>
      <div className="flex items-center gap-2">
        <span>{icon}</span>
        <span className="text-xs font-black leading-none">{title}</span>
      </div>
      <p className="text-[10px] font-medium text-slate-500 leading-relaxed">{desc}</p>
    </div>
  );
}

function TermsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h3 className="text-xs font-black text-white uppercase tracking-widest">{title}</h3>
      <p>{children}</p>
    </div>
  );
}
