/**
 * Utilitário para envio de mensagens via WhatsApp
 * Usa wa.me — funciona sem API paga
 */

/** Limpa o número deixando só dígitos e adiciona +55 se necessário */
export const formatPhone = (phone: string): string => {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("55")) return digits;
  return "55" + digits;
};

/** Abre o WhatsApp Web/App com mensagem pré-preenchida */
export const openWhatsApp = (phone: string, message: string) => {
  const number  = formatPhone(phone);
  const encoded = encodeURIComponent(message);
  window.open(`https://wa.me/${number}?text=${encoded}`, "_blank");
};

/** Templates de mensagem prontos */
export const templates = {
  winner: (winnerName: string, raffleTitle: string, winnerNumber: number) =>
`🏆 *Parabéns, ${winnerName}!*

Você foi o grande ganhador da rifa *"${raffleTitle}"*!

🎯 Número sorteado: *#${String(winnerNumber).padStart(3, "0")}*
📅 Data: ${new Date().toLocaleDateString("pt-BR")}

Entre em contato para combinar a entrega do prêmio.

_Mensagem enviada pela plataforma AZARÃO_ 🎉`,

  payment: (name: string, raffleTitle: string, amount: number) =>
`Olá, *${name}*! 👋

Identificamos seu pagamento de *R$ ${amount.toFixed(2)}* na rifa *"${raffleTitle}"*.

✅ Seus números estão confirmados!

_AZARÃO_`,

  reminder: (name: string, raffleTitle: string, drawDate: string) =>
`Olá, *${name}*! 🎟️

Lembrete: o sorteio da rifa *"${raffleTitle}"* está se aproximando!

📅 Data do sorteio: *${drawDate}*

Ainda dá tempo de comprar mais cotas. Boa sorte! 🍀

_AZARÃO_`,

  custom: (name: string, message: string) =>
`Olá, *${name}*! 👋

${message}

_AZARÃO_`,
};
