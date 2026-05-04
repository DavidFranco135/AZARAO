export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'creator' | 'user';
}

export interface Raffle {
  id: string;
  title: string;
  description: string;
  images: string; // JSON string of string[]
  price_per_number: number;
  total_numbers: number;
  draw_date: string;
  creator_id: string;
  status: 'active' | 'finished';
  commission_percentage: number;
  created_at: string;
  soldNumbers?: number[];
}

export interface Order {
  id: string;
  raffle_id: string;
  user_id: string;
  numbers: string; // JSON string of number[]
  total_amount: number;
  status: 'pending' | 'paid';
  created_at: string;
}
