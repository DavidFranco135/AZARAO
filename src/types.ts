export interface User {
  id: string;
  email: string;
  name: string;
  role: "admin" | "creator" | "user";
  mpAccessToken?: string;
  phone?: string;   // WhatsApp com DDD
  cpf?: string;     // CPF (apenas dígitos)
  profileComplete?: boolean; // true quando phone e cpf estão preenchidos
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
  isTest: boolean;
  winnerNumber?: number;
  winnerId?: string;
  winnerName?: string;
  drawnAt?: unknown;
  drawScheduledAt?: unknown; // timestamp quando criador agendou o sorteio
}

export interface Order {
  id: string;
  raffleId: string;
  raffleTitle?: string;
  userId: string;
  userName?: string;
  userPhone?: string;
  userCpf?: string;
  numbers: number[];
  totalAmount: number;
  status: "pending" | "paid";
  mpPaymentId?: string;
  createdAt?: unknown;
}

export interface DashboardRaffle extends Raffle {
  totalArrecadado: number;
  comissao: number;
  lucro: number;
}
