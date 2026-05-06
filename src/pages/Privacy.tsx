import { Link } from "react-router-dom";
import { ArrowLeft, Lock } from "lucide-react";

export default function Privacy() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <Link to="/" className="flex items-center gap-2 text-slate-500 hover:text-white font-bold mb-8 transition-all group">
        <div className="bg-slate-900 p-2 rounded-lg border border-slate-800 group-hover:border-slate-600">
          <ArrowLeft size={16}/>
        </div>
        <span className="text-sm uppercase tracking-widest">Voltar</span>
      </Link>

      <div className="bg-slate-900 rounded-[2rem] border border-slate-800 overflow-hidden">
        <div className="p-8 border-b border-slate-800 bg-indigo-600/5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-indigo-600/10 rounded-xl flex items-center justify-center text-indigo-400 border border-indigo-500/20">
              <Lock size={20}/>
            </div>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Documento Legal</span>
          </div>
          <h1 className="text-3xl font-black text-white mb-2">Política de Privacidade</h1>
          <p className="text-slate-500 text-sm">Última atualização: {new Date().toLocaleDateString("pt-BR")}</p>
        </div>

        <div className="p-8 space-y-8 text-slate-300 text-sm leading-relaxed">
          <p>A AZARÃO se compromete a proteger sua privacidade em conformidade com a <strong className="text-white">Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018)</strong>.</p>

          <Section title="1. Dados Coletados">
            <ul className="list-disc pl-5 space-y-2">
              <li><strong className="text-white">Nome completo</strong> — identificação do usuário</li>
              <li><strong className="text-white">CPF</strong> — prevenção de fraudes e identificação</li>
              <li><strong className="text-white">E-mail</strong> — autenticação e comunicações</li>
              <li><strong className="text-white">Telefone/WhatsApp</strong> — contato em caso de premiação</li>
              <li><strong className="text-white">Dados de pagamento</strong> — processados pelo Mercado Pago (não armazenamos cartões)</li>
              <li><strong className="text-white">Dados de uso</strong> — números comprados, histórico de pedidos</li>
            </ul>
          </Section>

          <Section title="2. Finalidade do Tratamento">
            <ul className="list-disc pl-5 space-y-2">
              <li>Execução do contrato de uso da plataforma</li>
              <li>Prevenção e detecção de fraudes</li>
              <li>Processamento de pagamentos</li>
              <li>Comunicação de resultados de sorteios</li>
              <li>Cumprimento de obrigações legais</li>
            </ul>
          </Section>

          <Section title="3. Compartilhamento de Dados">
            <p>Seus dados podem ser compartilhados com:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong className="text-white">Criadores do sorteio</strong> — nome e telefone do ganhador para entrega do prêmio</li>
              <li><strong className="text-white">Mercado Pago</strong> — processamento de pagamentos</li>
              <li><strong className="text-white">Autoridades competentes</strong> — quando exigido por lei</li>
            </ul>
            <p>Não vendemos seus dados a terceiros.</p>
          </Section>

          <Section title="4. Seus Direitos (LGPD)">
            <p>Você tem direito a:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Confirmar a existência de tratamento de seus dados</li>
              <li>Acessar seus dados</li>
              <li>Corrigir dados incorretos</li>
              <li>Solicitar a exclusão dos seus dados (quando não houver obrigação legal de retenção)</li>
              <li>Revogar o consentimento a qualquer momento</li>
            </ul>
            <p>Para exercer seus direitos, entre em contato: <a href="mailto:azaraoadm@gmail.com" className="text-indigo-400 hover:underline">azaraoadm@gmail.com</a></p>
          </Section>

          <Section title="5. Segurança">
            <p>Utilizamos criptografia Firebase (Google) para armazenar seus dados. Senhas são armazenadas com hash seguro. Dados de pagamento são processados diretamente pelo Mercado Pago, não passando pelos nossos servidores.</p>
          </Section>

          <Section title="6. Retenção de Dados">
            <p>Mantemos seus dados enquanto sua conta estiver ativa. Após a exclusão da conta, dados são anonimizados em até 30 dias, exceto quando há obrigação legal de retenção (ex.: dados fiscais por 5 anos).</p>
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h2 className="text-lg font-black text-white border-b border-slate-800 pb-2">{title}</h2>
      <div className="space-y-3">{children}</div>
    </div>
  );
}
