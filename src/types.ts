export interface User {
  id: string;
  email: string;
  name: string;
  role: "admin" | "creator" | "user";
  mpAccessToken?: string;
  phone?: string; // WhatsApp
}

export interface Raffle {
  id: string;
  title: string;
  description: string;
  images: string[];
  pricePerNumber: number;
  totalNumbers: number;
  drawDate: string;
  creatorId: string;
  creatorName?: string;
  status: "active" | "finished";
  commissionPercentage: number;
  soldNumbers: number[];
  createdAt?: unknown;

  // Modo de pagamento
  isTest: boolean; // true = simulação | false = Mercado Pago real

  // Resultado do sorteio
  winnerNumber?: number;
  winnerId?: string;
  winnerName?: string;
  drawnAt?: unknown;
}

export interface Order {
  id: string;
  raffleId: string;
  raffleTitle?: string;
  userId: string;
  userName?: string;
  numbers: number[];
  totalAmount: number;
  status: "pending" | "paid";
  mpPaymentId?: string; // ID do pagamento no Mercado Pago
  createdAt?: unknown;
}

export interface DashboardRaffle extends Raffle {
  totalArrecadado: number;
  comissao: number;
  lucro: number;
}
