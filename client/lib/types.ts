// --- TYPES DE BASE ---
export type Role = "admin" | "user";

export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

// --- SESSION ---
// Représente l'utilisateur connecté avec son jeton de sécurité.
export type Session = {
  token: string;
  user: User;
};

// --- PRODUIT ---
export type Product = {
  _id: string;
  title: string;
  description: string;
  price: number;
  imageUrl: string;
  category: string;
  stock: number;
  unit: string;
  featured: boolean; // Mis en avant ?
  specs: string[];   // Liste de caractéristiques
  createdAt: string;
};

// --- COMMANDE ---
export type OrderItem = {
  product: string;
  title: string;
  imageUrl: string;
  price: number;
  quantity: number;
  lineTotal: number;
};

// L'utilisateur peut être juste un ID (string) ou un objet complet.
type OrderUser = string | { _id: string; name: string; email: string };

export type Order = {
  _id: string;
  user: OrderUser;
  items: OrderItem[];
  totalAmount: number;
  fullName: string;
  phone: string;
  city: string;
  address: string;
  notes?: string;
  status: string;
  createdAt: string;
};

// --- MESSAGE DE CONTACT ---
export type ContactMessage = {
  _id: string;
  user?: string;
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
  status: string;
  adminReply?: string;
  repliedAt?: string;
  createdAt: string;
};
