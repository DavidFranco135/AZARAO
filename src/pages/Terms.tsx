import { Link } from "react-router-dom";
import { ArrowLeft, Shield, AlertTriangle, FileText } from "lucide-react";

export default function Terms() {
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
              <FileText size={20}/>
            </div>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Documento Legal</span>
          </div>
          <h1 className="text-3xl font-black text-white mb-2">Termos de Uso</h1>
          <p className="text-slate-500 text-sm">Última atualização: {new Date().toLocaleDateString("pt-BR")}</p>
        </div>

        <div className="p-8 prose prose-invert max-w-none space-y-8 text-slate-300 text-sm leading-relaxed">

          {/* Aviso 18+ */}
          <div className="flex items-start gap-4 p-5 bg-red-500/10 border-2 border-red-500/30 rounded-2xl">
            <AlertTriangle size={24} className="text-red-400 shrink-0 mt-0.5"/>
            <div>
              <p className="font-black text-red-400 text-base mb-1">⛔ ACESSO PROIBIDO PARA MENORES DE 18 ANOS</p>
              <p className="text-red-300 font-medium">Esta plataforma é destinada exclusivamente a pessoas com 18 anos ou mais. O acesso, cadastro ou participação por menores de idade é estritamente proibido e constitui violação destes Termos.</p>
            </div>
          </div>

          <Section title="1. Das Partes e Definições">
            <p><strong className="text-white">AZARÃO</strong> ("Plataforma") é uma plataforma tecnológica de intermediação que disponibiliza infraestrutura para que terceiros ("Criadores") organizem e divulguem campanhas promocionais ("Sorteios") para usuários participantes ("Participantes").</p>
            <p>A AZARÃO <strong className="text-white">NÃO É ORGANIZADORA</strong> dos sorteios. É exclusivamente uma prestadora de serviços tecnológicos, sem qualquer responsabilidade sobre a realização, legalidade, premiação ou resultado dos sorteios criados por terceiros.</p>
          </Section>

          <Section title="2. Natureza Jurídica dos Sorteios">
            <p>Os sorteios divulgados nesta plataforma são de inteira responsabilidade dos Criadores. A AZARÃO não realiza, organiza, financia ou garante qualquer sorteio.</p>
            <p>Nos termos da <strong className="text-white">Lei nº 5.768/1971</strong> e do <strong className="text-white">Decreto nº 70.951/1972</strong>, promoções comerciais com distribuição gratuita de prêmios a título de propaganda podem exigir autorização prévia da SEAE/ME. <strong className="text-white">É obrigação exclusiva do Criador</strong> verificar e obter todas as autorizações legais necessárias antes de publicar qualquer sorteio nesta plataforma.</p>
            <p>A AZARÃO se reserva o direito de remover qualquer sorteio que viole a legislação vigente, sem aviso prévio e sem qualquer compensação.</p>
          </Section>

          <Section title="3. Responsabilidades do Criador">
            <p>Ao criar um sorteio nesta plataforma, o Criador declara e concorda que:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Tem <strong className="text-white">18 anos ou mais</strong> e capacidade civil plena;</li>
              <li>É o único responsável pela <strong className="text-white">legalidade do sorteio</strong>, incluindo a obtenção de autorizações junto à SEAE/ME quando exigido por lei;</li>
              <li>O prêmio anunciado <strong className="text-white">existe e será entregue</strong> ao ganhador conforme divulgado;</li>
              <li>Responsabiliza-se por qualquer dano causado a Participantes decorrente de sorteio fraudulento, cancelado ou não realizado;</li>
              <li>Isenta a AZARÃO de qualquer responsabilidade civil, administrativa ou criminal decorrente de seus sorteios;</li>
              <li>Não utilizará a plataforma para fins ilegais, incluindo lavagem de dinheiro, estelionato ou fraude;</li>
              <li>Arcará com eventuais multas, penalidades ou indenizações impostas por autoridades competentes em razão de seus sorteios.</li>
            </ul>
          </Section>

          <Section title="4. Responsabilidades do Participante">
            <p>Ao participar de qualquer sorteio, o Participante declara e concorda que:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Tem <strong className="text-white">18 anos ou mais</strong>;</li>
              <li>Participa por livre e espontânea vontade, ciente dos riscos;</li>
              <li>Compreende que a AZARÃO não garante a entrega do prêmio por parte do Criador;</li>
              <li>Em caso de disputa com o Criador, deverá acionar diretamente o Criador e, se necessário, os órgãos de defesa do consumidor (PROCON) ou o Poder Judiciário;</li>
              <li>Forneceu dados verdadeiros no cadastro, especialmente CPF e telefone.</li>
            </ul>
          </Section>

          <Section title="5. Limitação de Responsabilidade da AZARÃO">
            <p>A AZARÃO <strong className="text-white">NÃO SE RESPONSABILIZA</strong> por:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Não entrega ou não cumprimento de prêmios por parte de Criadores;</li>
              <li>Fraudes praticadas por Criadores ou Participantes;</li>
              <li>Danos diretos, indiretos, incidentais ou consequentes decorrentes do uso da plataforma;</li>
              <li>Legalidade dos sorteios publicados pelos Criadores;</li>
              <li>Interrupções no serviço por motivos técnicos, de manutenção ou força maior;</li>
              <li>Perdas financeiras decorrentes da participação em sorteios.</li>
            </ul>
            <p>A responsabilidade total máxima da AZARÃO, em qualquer hipótese, fica limitada ao valor das taxas de serviço pagas pelo Criador nos últimos 30 dias.</p>
          </Section>

          <Section title="6. Taxa de Serviço e Pagamentos">
            <p>A AZARÃO cobra uma <strong className="text-white">taxa de serviço (SaaS Fee)</strong> sobre o valor arrecadado em cada sorteio, conforme percentual definido no momento da criação do sorteio.</p>
            <p>Os pagamentos são processados por gateways terceiros (ex.: Mercado Pago). A AZARÃO não armazena dados de cartão de crédito e não é responsável por falhas nos gateways de pagamento.</p>
            <p>Não há reembolso de taxas de serviço já processadas, salvo erro comprovado da plataforma.</p>
          </Section>

          <Section title="7. Proibições">
            <p>É expressamente proibido:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Criar sorteios com prêmios inexistentes ou fraudulentos;</li>
              <li>Participar ou criar sorteios tendo menos de 18 anos;</li>
              <li>Utilizar a plataforma para lavagem de dinheiro ou atividades criminosas;</li>
              <li>Criar múltiplas contas para manipular sorteios;</li>
              <li>Praticar qualquer forma de estelionato ou fraude;</li>
              <li>Fazer uso indevido de dados pessoais de outros usuários.</li>
            </ul>
            <p>O descumprimento pode resultar em suspensão imediata da conta, retenção de valores e comunicação às autoridades competentes.</p>
          </Section>

          <Section title="8. Privacidade e Dados Pessoais">
            <p>O tratamento de dados pessoais na plataforma observa a <strong className="text-white">Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018)</strong>. Os dados coletados (nome, CPF, e-mail, telefone) são utilizados exclusivamente para:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Identificação e autenticação do usuário;</li>
              <li>Processamento de pagamentos;</li>
              <li>Contato em caso de premiação;</li>
              <li>Cumprimento de obrigações legais.</li>
            </ul>
            <p>O CPF é coletado para fins de identificação e prevenção de fraudes, conforme permitido pela LGPD.</p>
          </Section>

          <Section title="9. Foro e Legislação Aplicável">
            <p>Estes Termos são regidos pela legislação brasileira. Fica eleito o foro da comarca de domicílio do usuário para dirimir quaisquer controvérsias, nos termos do art. 101, I do Código de Defesa do Consumidor.</p>
          </Section>

          <Section title="10. Alterações dos Termos">
            <p>A AZARÃO reserva-se o direito de alterar estes Termos a qualquer momento, mediante comunicação prévia aos usuários. O uso continuado da plataforma após a comunicação implica aceitação das novas condições.</p>
          </Section>

          <div className="p-5 bg-slate-800 rounded-2xl border border-slate-700 mt-6">
            <div className="flex items-center gap-3 mb-2">
              <Shield size={18} className="text-indigo-400"/>
              <p className="font-black text-white text-sm">Contato e Suporte</p>
            </div>
            <p>Para dúvidas sobre estes Termos, entre em contato pelo e-mail: <a href="mailto:azaraoadm@gmail.com" className="text-indigo-400 hover:underline">azaraoadm@gmail.com</a></p>
          </div>
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
