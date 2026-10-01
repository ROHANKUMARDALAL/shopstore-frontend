import { readToken } from "@/lib/auth-storage";

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:43121";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export type Category = { id: string; name: string };

export type StockStatus = "in_stock" | "low" | "out_of_stock";

export type Product = {
  id: string;
  name: string;
  categoryId: string;
  categoryName: string;
  unit: string;
  cp: number;
  sp: number;
  stockQty: number;
  reorderLevel: number;
  marginPerUnit: number;
  marginPercent: number | null;
  lowStock: boolean;
  stockStatus: StockStatus;
};

export type PurchaseLine = {
  productId: string;
  productName: string;
  unit: string;
  qty: number;
  cp: number;
  lineTotal: number;
};

export type Purchase = {
  id: string;
  supplierName: string;
  date: string;
  lines: PurchaseLine[];
  total: number;
};

export type SaleLine = {
  productId: string;
  productName: string;
  unit: string;
  qty: number;
  sp: number;
  cpAtSale: number;
  lineTotal: number;
  margin: number;
};

export type Sale = {
  id: string;
  customerShopName: string;
  date: string;
  lines: SaleLine[];
  total: number;
  margin: number;
};

export type Dashboard = {
  stockValueAtCp: number;
  stockValueAtSp: number;
  todayPurchaseTotal: number;
  todaySalesTotal: number;
  grossMargin: number;
  lowStock: Product[];
};

export type AuthUser = {
  id: string;
  name: string;
  email: string;
};

export type AuthResponse = {
  user: AuthUser;
  token: string;
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = readToken();
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(init?.headers || {}),
      },
      cache: "no-store",
    });
  } catch {
    throw new ApiError(
      "The stock book did not answer. Check that the API is running on port 43121.",
      0,
    );
  }

  const text = await response.text();
  const body = text ? (JSON.parse(text) as { error?: string }) : null;
  if (!response.ok) {
    throw new ApiError(body?.error || `Request failed (${response.status}).`, response.status);
  }
  return body as T;
}

export const signup = (body: { name: string; email: string; password: string }) =>
  request<AuthResponse>("/api/auth/signup", {
    method: "POST",
    body: JSON.stringify(body),
  });

export const login = (body: { email: string; password: string }) =>
  request<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(body),
  });

export const getMe = () => request<{ user: AuthUser }>("/api/auth/me");

export const getCategories = () => request<Category[]>("/api/categories");
export const createCategory = (name: string) =>
  request<Category>("/api/categories", {
    method: "POST",
    body: JSON.stringify({ name }),
  });

export const getProducts = () => request<Product[]>("/api/products");
export const createProduct = (body: {
  name: string;
  category: string;
  unit: string;
  cp: number;
  sp: number;
  stockQty: number;
  reorderLevel: number;
}) =>
  request<Product>("/api/products", {
    method: "POST",
    body: JSON.stringify(body),
  });

export const getPurchases = () => request<Purchase[]>("/api/purchases");
export const createPurchase = (body: {
  supplierName: string;
  date: string;
  lines: { product: string; qty: number; cp: number }[];
}) =>
  request<Purchase>("/api/purchases", {
    method: "POST",
    body: JSON.stringify(body),
  });
export const deletePurchase = (id: string) =>
  request<{ ok: boolean }>(`/api/purchases/${id}`, { method: "DELETE" });

export const getSales = () => request<Sale[]>("/api/sales");
export const createSale = (body: {
  customerShopName: string;
  date: string;
  lines: { product: string; qty: number; sp: number }[];
}) =>
  request<Sale>("/api/sales", {
    method: "POST",
    body: JSON.stringify(body),
  });
export const deleteSale = (id: string) =>
  request<{ ok: boolean }>(`/api/sales/${id}`, { method: "DELETE" });

export const getDashboard = () => request<Dashboard>("/api/dashboard");
