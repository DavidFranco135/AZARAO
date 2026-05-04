import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import Database from "better-sqlite3";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JWT_SECRET = process.env.JWT_SECRET || "rifatech_secret_key_123";
const db = new Database("rifatech.db");

// Initialize Database Schema
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS raffles (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    images TEXT, -- JSON array
    price_per_number REAL NOT NULL,
    total_numbers INTEGER NOT NULL,
    draw_date TEXT,
    creator_id TEXT NOT NULL,
    status TEXT DEFAULT 'active',
    commission_percentage REAL DEFAULT 10.0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (creator_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    raffle_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    numbers TEXT NOT NULL, -- JSON array of numbers
    total_amount REAL NOT NULL,
    status TEXT DEFAULT 'pending', -- pending, paid
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (raffle_id) REFERENCES raffles(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  -- Initial Admin (optional, but good for setup)
  INSERT OR IGNORE INTO users (id, email, password, name, role) VALUES (
    'admin-123', 
    'Davidbhmg147@gmail.com', 
    '$2a$10$x6.e6Xh.66Vp2wB66L66Be66Xh.66Vp2wB66L66Be66Xh.66Vp2wB', -- dummy hash, will need register
    'David Admin', 
    'admin'
  );

  -- Seed some sample raffles
  INSERT OR IGNORE INTO raffles (id, title, description, images, price_per_number, total_numbers, draw_date, creator_id, status) VALUES (
    'raffle-1',
    'iPhone 15 Pro Max - 256GB Titanium',
    'Sua chance de levar o melhor smartphone da Apple para casa por apenas R$ 5,00!',
    '["https://images.unsplash.com/photo-1695048133142-1a20484d2569?q=80&w=2070&auto=format&fit=crop"]',
    5.00,
    1000,
    '2026-06-01',
    'admin-123',
    'active'
  );
  
  INSERT OR IGNORE INTO raffles (id, title, description, images, price_per_number, total_numbers, draw_date, creator_id, status) VALUES (
    'raffle-2',
    'PlayStation 5 Slim + 2 Controles',
    'Participe e jogue os melhores títulos com o novo PS5 Slim.',
    '["https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?q=80&w=2070&auto=format&fit=crop"]',
    2.00,
    500,
    '2026-05-15',
    'admin-123',
    'active'
  );
`);

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(cookieParser());

// Auth Middleware
const authenticateToken = (req: any, res: any, next: any) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ message: "Não autorizado" });

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.status(403).json({ message: "Sessão expirada" });
    req.user = user;
    next();
  });
};

// --- API ROUTES ---

// Auth
app.post("/api/auth/register", async (req, res) => {
  try {
    const { email, password, name, role } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const id = uuidv4();
    
    const stmt = db.prepare("INSERT INTO users (id, email, password, name, role) VALUES (?, ?, ?, ?, ?)");
    stmt.run(id, email, hashedPassword, name, role || "user");
    
    const token = jwt.sign({ id, email, role: role || "user", name }, JWT_SECRET);
    res.cookie("token", token, { httpOnly: true });
    res.json({ user: { id, email, name, role: role || "user" } });
  } catch (error: any) {
    if (error.code === 'SQLITE_CONSTRAINT') {
      return res.status(400).json({ message: "E-mail já cadastrado" });
    }
    res.status(500).json({ message: "Erro ao registrar usuário" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  const user: any = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
  
  if (user && await bcrypt.compare(password, user.password)) {
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, JWT_SECRET);
    res.cookie("token", token, { httpOnly: true });
    res.json({ user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  } else {
    res.status(400).json({ message: "Credenciais inválidas" });
  }
});

app.post("/api/auth/logout", (req, res) => {
  res.clearCookie("token");
  res.json({ message: "Logout realizado" });
});

app.get("/api/auth/me", (req, res) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ message: "Não autorizado" });

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.status(401).json({ message: "Sessão expirada" });
    res.json({ user });
  });
});

// Raffles
app.get("/api/raffles", (req, res) => {
  const raffles = db.prepare("SELECT * FROM raffles ORDER BY created_at DESC").all();
  res.json(raffles);
});

app.get("/api/raffles/:id", (req, res) => {
  const raffle: any = db.prepare("SELECT * FROM raffles WHERE id = ?").get(req.params.id);
  if (!raffle) return res.status(404).json({ message: "Rifa não encontrada" });

  const soldNumbers: any = db.prepare(`
    SELECT numbers FROM orders 
    WHERE raffle_id = ? AND status = 'paid'
  `).all();
  
  const allSoldNumbers = soldNumbers.flatMap((o: any) => JSON.parse(o.numbers));
  
  res.json({ ...raffle, soldNumbers: allSoldNumbers });
});

app.post("/api/raffles", authenticateToken, (req: any, res) => {
  if (req.user.role !== 'creator' && req.user.role !== 'admin') {
    return res.status(403).json({ message: "Apenas criadores podem criar rifas" });
  }

  const { title, description, images, pricePerNumber, totalNumbers, drawDate } = req.body;
  const id = uuidv4();
  
  const stmt = db.prepare(`
    INSERT INTO raffles (id, title, description, images, price_per_number, total_numbers, draw_date, creator_id) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(id, title, description, JSON.stringify(images), pricePerNumber, totalNumbers, drawDate, req.user.id);
  
  res.json({ id, title });
});

// Orders & Buying
app.post("/api/orders", authenticateToken, (req: any, res) => {
  const { raffleId, numbers } = req.body;
  const raffle: any = db.prepare("SELECT * FROM raffles WHERE id = ?").get(raffleId);
  
  if (!raffle) return res.status(404).json({ message: "Rifa não encontrada" });
  
  const totalAmount = numbers.length * raffle.price_per_number;
  const orderId = uuidv4();
  
  const stmt = db.prepare(`
    INSERT INTO orders (id, raffle_id, user_id, numbers, total_amount) 
    VALUES (?, ?, ?, ?, ?)
  `);
  stmt.run(orderId, raffleId, req.user.id, JSON.stringify(numbers), totalAmount);
  
  res.json({ orderId, totalAmount });
});

app.post("/api/orders/:id/pay", authenticateToken, (req, res) => {
  // Simulate payment
  db.prepare("UPDATE orders SET status = 'paid' WHERE id = ?").run(req.params.id);
  res.json({ message: "Pagamento confirmado" });
});

// Dashboard Data
app.get("/api/dashboard/creator", authenticateToken, (req: any, res) => {
  if (req.user.role !== 'creator' && req.user.role !== 'admin') {
    return res.status(403).json({ message: "Acesso negado" });
  }

  const raffles = db.prepare("SELECT * FROM raffles WHERE creator_id = ?").all(req.user.id);
  
  const stats = raffles.map((r: any) => {
    const orders = db.prepare("SELECT total_amount FROM orders WHERE raffle_id = ? AND status = 'paid'").all(r.id);
    const totalArrecadado = orders.reduce((acc: number, curr: any) => acc + curr.total_amount, 0);
    const comissao = Number(totalArrecadado) * (Number(r.commission_percentage) / 100);
    const lucro = Number(totalArrecadado) - Number(comissao);
    
    return {
      ...r,
      totalArrecadado,
      comissao,
      lucro
    };
  });
  
  res.json(stats);
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
