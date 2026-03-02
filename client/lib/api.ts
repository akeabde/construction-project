const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  token?: string;
  body?: unknown;
};

// Lire un message d erreur renvoye par l API (si present).
const getApiErrorMessage = (payload: unknown, fallback: string) => {
  if (payload && typeof payload === "object" && "message" in payload) {
    const message = (payload as { message?: unknown }).message;
    if (typeof message === "string") {
      return message;
    }
  }

  return fallback;
};

export const apiRequest = async <T>(path: string, options: RequestOptions = {}): Promise<T> => {
  // Fonction unique pour tous les appels API du frontend.
  const response = await fetch(`${API_URL}${path}`, {
    method: options.method || "GET",
    headers: {
      "Content-Type": "application/json",
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  // Tenter de lire la reponse JSON.
  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  // Si HTTP n est pas OK, lever une erreur explicite.
  if (!response.ok) {
    throw new Error(getApiErrorMessage(payload, "Request failed"));
  }

  // Sinon, retourner les donnees typées.
  return payload as T;
};
