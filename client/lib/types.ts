export type Role = "admin" | "user";

export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

export type Session = {
  token: string;
  user: User;
};

export type Product = {
  _id: string;
  title: string;
  description: string;
  price: number;
  imageUrl: string;
  category: string;
  stock: number;
  unit: string;
  featured: boolean;
  specs: string[];
  createdAt: string;
};

export type OrderItem = {
  product: string;
  title: string;
  imageUrl: string;
  price: number;
  quantity: number;
  lineTotal: number;
};

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
