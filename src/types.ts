export interface User {
  id: string;
  email: string;
  name: string;
  role: "admin" | "creator" | "user";
}

export interface Raffle {
  id: string;
  title: string;
  description: string;
  images: string[];          // array of image URLs
  pricePerNumber: number;
  totalNumbers: number;
  drawDate: string;
  creatorId: string;
  creatorName?: string;
  status: "active" | "finished";
  commissionPercentage: number;
  soldNumbers: number[];
  createdAt?: unknown;
}

export interface Order {
  id: string;
  raffleId: string;
  userId: string;
  numbers: number[];
  totalAmount: number;
  status: "pending" | "paid";
  createdAt?: unknown;
}

export interface DashboardRaffle extends Raffle {
  totalArrecadado: number;
  comissao: number;
  lucro: number;
}
