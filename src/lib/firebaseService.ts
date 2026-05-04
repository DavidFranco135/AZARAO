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
  orderBy,
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

// ─── AUTH ────────────────────────────────────────────────────────────────────

export const registerUser = async (
  email: string,
  password: string,
  name: string,
  role: "user" | "creator"
): Promise<User> => {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  const uid = cred.user.uid;
  const finalRole: User["role"] = email === ADMIN_EMAIL ? "admin" : role;

  const userData: User = { id: uid, email, name, role: finalRole };
  await setDoc(doc(db, "users", uid), {
    ...userData,
    createdAt: serverTimestamp(),
  });
  return userData;
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
  const q = query(
    collection(db, "raffles"),
    where("status", "in", ["active", "finished"]),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ ...d.data(), id: d.id } as Raffle));
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

// ─── ORDERS ──────────────────────────────────────────────────────────────────

export const createOrder = async (
  raffleId: string,
  userId: string,
  numbers: number[],
  totalAmount: number
): Promise<string> => {
  const ref = await addDoc(collection(db, "orders"), {
    raffleId,
    userId,
    numbers,
    totalAmount,
    status: "pending",
    createdAt: serverTimestamp(),
  });
  return ref.id;
};

export const confirmOrderPayment = async (
  orderId: string,
  raffleId: string,
  numbers: number[]
) => {
  const batch = writeBatch(db);
  batch.update(doc(db, "orders", orderId), { status: "paid" });
  batch.update(doc(db, "raffles", raffleId), {
    soldNumbers: arrayUnion(...numbers),
  });
  await batch.commit();
};

export const getUserOrders = async (userId: string): Promise<Order[]> => {
  const q = query(
    collection(db, "orders"),
    where("userId", "==", userId),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ ...d.data(), id: d.id } as Order));
};

export const getRaffleOrders = async (raffleId: string): Promise<Order[]> => {
  const q = query(
    collection(db, "orders"),
    where("raffleId", "==", raffleId),
    where("status", "==", "paid")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ ...d.data(), id: d.id } as Order));
};

// ─── DASHBOARD ───────────────────────────────────────────────────────────────

export const getCreatorDashboard = async (
  creatorId: string
): Promise<DashboardRaffle[]> => {
  const q = query(
    collection(db, "raffles"),
    where("creatorId", "==", creatorId),
    orderBy("createdAt", "desc")
  );
  const raffleSnap = await getDocs(q);
  const raffles = raffleSnap.docs.map(
    (d) => ({ ...d.data(), id: d.id } as Raffle)
  );

  return Promise.all(
    raffles.map(async (raffle) => {
      const oq = query(
        collection(db, "orders"),
        where("raffleId", "==", raffle.id),
        where("status", "==", "paid")
      );
      const oSnap = await getDocs(oq);
      const totalArrecadado = oSnap.docs.reduce(
        (sum, d) => sum + (d.data().totalAmount as number),
        0
      );
      const comissao = totalArrecadado * ((raffle.commissionPercentage ?? 10) / 100);
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
  const snap = await getDocs(
    query(collection(db, "raffles"), orderBy("createdAt", "desc"))
  );
  return snap.docs.map((d) => ({ ...d.data(), id: d.id } as Raffle));
};

export const getAllOrders = async (): Promise<Order[]> => {
  const snap = await getDocs(
    query(collection(db, "orders"), orderBy("createdAt", "desc"))
  );
  return snap.docs.map((d) => ({ ...d.data(), id: d.id } as Order));
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

// ─── HELPERS ─────────────────────────────────────────────────────────────────

export const tsToDate = (ts: unknown): Date => {
  if (!ts) return new Date();
  if (ts instanceof Timestamp) return ts.toDate();
  if (typeof ts === "string") return new Date(ts);
  return new Date();
};
