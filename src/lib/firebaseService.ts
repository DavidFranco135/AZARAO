import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  setDoc,
  serverTimestamp,
  arrayUnion,
  writeBatch,
  Timestamp,
} from "firebase/firestore";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth, db } from "./firebase";
import { User, Raffle, Order, DashboardRaffle } from "../types";

export type { DashboardRaffle } from "../types";

const ADMIN_EMAIL = "ggrifasadm@gmail.com";

// ─── HELPERS ─────────────────────────────────────────────────────────────────

export const tsToDate = (ts: unknown): Date => {
  if (!ts) return new Date();
  if (ts instanceof Timestamp) return ts.toDate();
  if (typeof ts === "string") return new Date(ts);
  return new Date();
};

// ─── AUTH ────────────────────────────────────────────────────────────────────

export const registerUser = async (
  email: string,
  password: string,
  name: string,
  role: "user" | "creator",
  phone?: string,
  cpf?: string,
): Promise<User> => {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  const uid = cred.user.uid;
  const finalRole: User["role"] = email === ADMIN_EMAIL ? "admin" : role;
  const profileComplete = !!(phone && cpf);
  const userData: User = { id: uid, email, name, role: finalRole, phone, cpf, profileComplete };
  // Registra aceitação dos termos
  await setDoc(doc(db, "users", uid), {
    ...userData,
    termsAcceptedAt: serverTimestamp(),
    termsVersion: "1.0",
    createdAt: serverTimestamp(),
  });
  return userData;
};

/** Agenda contagem regressiva para o sorteio */
export const scheduleDrawCountdown = async (raffleId: string) => {
  await updateDoc(doc(db, "raffles", raffleId), {
    drawScheduledAt: serverTimestamp(),
  });
};

/** Marca que o criador aceitou os termos do criador */
export const markCreatorTermsAccepted = async (uid: string, commissionRate: number) => {
  await updateDoc(doc(db, "users", uid), {
    creatorTermsAcceptedAt: serverTimestamp(),
    creatorTermsVersion: "1.0",
    creatorTermsCommission: commissionRate,
  });
};

/** Atualiza perfil do usuário (phone, cpf) */
export const updateUserProfile = async (
  uid: string,
  data: { phone?: string; cpf?: string }
): Promise<void> => {
  const profileComplete = !!(data.phone && data.cpf);
  await updateDoc(doc(db, "users", uid), { ...data, profileComplete });
};

export const loginUser = async (
  email: string,
  password: string
): Promise<User> => {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  const snap = await getDoc(doc(db, "users", cred.user.uid));
  if (!snap.exists()) throw new Error("Usuário não encontrado.");
  return snap.data() as User;
};

export const logoutUser = () => signOut(auth);

export const resetPassword = (email: string) =>
  sendPasswordResetEmail(auth, email);

export const fetchUserProfile = async (uid: string): Promise<User | null> => {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? (snap.data() as User) : null;
};

// ─── RAFFLES ─────────────────────────────────────────────────────────────────

export const getRaffles = async (): Promise<Raffle[]> => {
  const snap = await getDocs(collection(db, "raffles"));
  return snap.docs
    .map((d) => ({ ...d.data(), id: d.id } as Raffle))
    .filter((r) => r.status === "active" || r.status === "finished")
    .sort(
      (a, b) =>
        tsToDate(b.createdAt).getTime() - tsToDate(a.createdAt).getTime()
    );
};

export const getRaffle = async (id: string): Promise<Raffle | null> => {
  const snap = await getDoc(doc(db, "raffles", id));
  return snap.exists() ? ({ ...snap.data(), id: snap.id } as Raffle) : null;
};

export const createRaffle = async (
  data: Omit<Raffle, "id" | "createdAt" | "soldNumbers" | "status">
): Promise<string> => {
  const ref = await addDoc(collection(db, "raffles"), {
    ...data,
    soldNumbers: [],
    status: "active",
    createdAt: serverTimestamp(),
  });
  return ref.id;
};

export const updateRaffle = async (id: string, data: Partial<Raffle>) => {
  await updateDoc(doc(db, "raffles", id), data as Record<string, unknown>);
};

export const deleteRaffle = async (id: string) => {
  await deleteDoc(doc(db, "raffles", id));
};

// ─── SORTEIO (DRAW) ──────────────────────────────────────────────────────────

/**
 * Realiza o sorteio: sorteia aleatoriamente um número entre os vendidos,
 * busca quem comprou esse número e salva o resultado na rifa.
 */
export const performDraw = async (raffleId: string): Promise<{
  winnerNumber: number;
  winnerId: string;
  winnerName: string;
}> => {
  const raffle = await getRaffle(raffleId);
  if (!raffle) throw new Error("Rifa não encontrada.");
  if (raffle.soldNumbers.length === 0)
    throw new Error("Nenhum número vendido ainda.");

  // Sorteia número aleatório entre os vendidos
  const idx = Math.floor(Math.random() * raffle.soldNumbers.length);
  const winnerNumber = raffle.soldNumbers[idx];

  // Encontra o pedido que contém esse número
  const q = query(
    collection(db, "orders"),
    where("raffleId", "==", raffleId)
  );
  const ordersSnap = await getDocs(q);
  const winnerOrder = ordersSnap.docs
    .map((d) => ({ ...d.data(), id: d.id } as Order))
    .filter((o) => o.status === "paid")
    .find((o) => o.numbers.includes(winnerNumber));

  if (!winnerOrder) throw new Error("Pedido do ganhador não encontrado.");

  const winnerName = winnerOrder.userName ?? "Participante";

  // Salva resultado na rifa e encerra
  await updateDoc(doc(db, "raffles", raffleId), {
    status: "finished",
    winnerNumber,
    winnerId: winnerOrder.userId,
    winnerName,
    drawnAt: serverTimestamp(),
  });

  return { winnerNumber, winnerId: winnerOrder.userId, winnerName };
};

// ─── ORDERS ──────────────────────────────────────────────────────────────────

export const createOrder = async (
  raffleId: string,
  raffleTitle: string,
  userId: string,
  userName: string,
  numbers: number[],
  totalAmount: number,
  userPhone?: string,
  userCpf?: string,
): Promise<string> => {
  const ref = await addDoc(collection(db, "orders"), {
    raffleId,
    raffleTitle,
    userId,
    userName,
    numbers,
    totalAmount,
    status: "pending",
    ...(userPhone ? { userPhone } : {}),
    ...(userCpf ? { userCpf } : {}),
    createdAt: serverTimestamp(),
  });
  return ref.id;
};

export const confirmOrderPayment = async (
  orderId: string,
  raffleId: string,
  numbers: number[],
  mpPaymentId?: string
) => {
  const batch = writeBatch(db);
  batch.update(doc(db, "orders", orderId), {
    status: "paid",
    ...(mpPaymentId ? { mpPaymentId } : {}),
  });
  batch.update(doc(db, "raffles", raffleId), {
    soldNumbers: arrayUnion(...numbers),
  });
  await batch.commit();
};

export const getUserOrders = async (userId: string): Promise<Order[]> => {
  const q = query(collection(db, "orders"), where("userId", "==", userId));
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => ({ ...d.data(), id: d.id } as Order))
    .sort(
      (a, b) =>
        tsToDate(b.createdAt).getTime() - tsToDate(a.createdAt).getTime()
    );
};

export const getRaffleOrders = async (raffleId: string): Promise<Order[]> => {
  const q = query(
    collection(db, "orders"),
    where("raffleId", "==", raffleId)
  );
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => ({ ...d.data(), id: d.id } as Order))
    .filter((o) => o.status === "paid");
};

export const cancelPendingOrder = async (orderId: string) => {
  await deleteDoc(doc(db, "orders", orderId));
};

// ─── DASHBOARD ───────────────────────────────────────────────────────────────

export const getCreatorDashboard = async (
  creatorId: string
): Promise<DashboardRaffle[]> => {
  const q = query(
    collection(db, "raffles"),
    where("creatorId", "==", creatorId)
  );
  const raffleSnap = await getDocs(q);
  const raffles = raffleSnap.docs
    .map((d) => ({ ...d.data(), id: d.id } as Raffle))
    .sort(
      (a, b) =>
        tsToDate(b.createdAt).getTime() - tsToDate(a.createdAt).getTime()
    );

  return Promise.all(
    raffles.map(async (raffle) => {
      const oq = query(
        collection(db, "orders"),
        where("raffleId", "==", raffle.id)
      );
      const oSnap = await getDocs(oq);
      const paid = oSnap.docs
        .map((d) => d.data())
        .filter((o) => o.status === "paid");
      const totalArrecadado = paid.reduce(
        (sum, d) => sum + (d.totalAmount as number),
        0
      );
      const comissao =
        totalArrecadado * ((raffle.commissionPercentage ?? 10) / 100);
      const lucro = totalArrecadado - comissao;
      return { ...raffle, totalArrecadado, comissao, lucro };
    })
  );
};

// ─── ADMIN ───────────────────────────────────────────────────────────────────

export const getAllUsers = async (): Promise<User[]> => {
  const snap = await getDocs(collection(db, "users"));
  return snap.docs.map((d) => d.data() as User);
};

export const getAllRaffles = async (): Promise<Raffle[]> => {
  const snap = await getDocs(collection(db, "raffles"));
  return snap.docs
    .map((d) => ({ ...d.data(), id: d.id } as Raffle))
    .sort(
      (a, b) =>
        tsToDate(b.createdAt).getTime() - tsToDate(a.createdAt).getTime()
    );
};

export const getAllOrders = async (): Promise<Order[]> => {
  const snap = await getDocs(collection(db, "orders"));
  return snap.docs
    .map((d) => ({ ...d.data(), id: d.id } as Order))
    .sort(
      (a, b) =>
        tsToDate(b.createdAt).getTime() - tsToDate(a.createdAt).getTime()
    );
};

export const updateUserRole = async (userId: string, role: User["role"]) => {
  await updateDoc(doc(db, "users", userId), { role });
};

// ─── SETTINGS ────────────────────────────────────────────────────────────────

export const getCommissionRate = async (): Promise<number> => {
  const snap = await getDoc(doc(db, "settings", "commission"));
  return snap.exists() ? (snap.data().rate as number) : 10;
};

export const setCommissionRate = async (rate: number) => {
  await setDoc(doc(db, "settings", "commission"), { rate });
};
