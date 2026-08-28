import type {
  HealthResponse,
  LegalQueryRequest,
  LegalQueryResponse,
  LegalSearchResponse,
  VectorstoreStatsResponse,
} from "../types/legal";
import type {
  OnboardingQuestionnaireRequest,
  TokenResponse,
  UserDetail,
  UserProfile,
} from "../types/auth";

const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL)?.replace(/\/+$/, "") || "http://localhost:8000";

const TOKEN_KEY = "nyaya_auth_token";

export const tokenStorage = {
  get: (): string | null => localStorage.getItem(TOKEN_KEY),
  set: (token: string): void => localStorage.setItem(TOKEN_KEY, token),
  clear: (): void => localStorage.removeItem(TOKEN_KEY),
};

class ApiError extends Error {
  status: number;
  data?: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 75000): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } catch (err: any) {
    if (err.name === "AbortError") {
      throw new ApiError(`Connection timed out after ${timeoutMs / 1000}s connecting to ${API_BASE_URL}. Ensure backend is running and reachable.`, 408);
    }
    if (err.message && err.message.toLowerCase().includes("failed to fetch")) {
      if (API_BASE_URL.includes("localhost") && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") {
        throw new ApiError(`Cannot reach backend at ${API_BASE_URL} from ${window.location.hostname}. Please set VITE_API_BASE_URL in your deployment settings to your public backend URL.`, 503);
      }
      throw new ApiError(`Cannot connect to backend server at ${API_BASE_URL}. Please verify the server is running and accessible.`, 503);
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorDetail = `HTTP ${response.status}: ${response.statusText}`;
    try {
      const errorJson = await response.json();
      if (errorJson.detail) {
        errorDetail = typeof errorJson.detail === "string"
          ? errorJson.detail
          : JSON.stringify(errorJson.detail);
      }
    } catch {
      // Keep default error detail
    }
    throw new ApiError(errorDetail, response.status);
  }

  try {
    return (await response.json()) as T;
  } catch {
    throw new ApiError("Failed to parse response JSON from server", response.status);
  }
}

function getAuthHeaders(): HeadersInit {
  const token = tokenStorage.get();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

export const legalApi = {
  async checkHealth(): Promise<HealthResponse> {
    const res = await fetchWithTimeout(`${API_BASE_URL}/health`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    return handleResponse<HealthResponse>(res);
  },

  async getStats(): Promise<VectorstoreStatsResponse> {
    const res = await fetchWithTimeout(`${API_BASE_URL}/api/legal/stats`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    return handleResponse<VectorstoreStatsResponse>(res);
  },

  async searchStatutes(query: string, k: number = 8, act?: string | null): Promise<LegalSearchResponse> {
    const res = await fetchWithTimeout(`${API_BASE_URL}/api/legal/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: query.trim(),
        k,
        act: act || null,
      }),
    });
    return handleResponse<LegalSearchResponse>(res);
  },

  async queryLegalAssistant(request: LegalQueryRequest): Promise<LegalQueryResponse> {
    const res = await fetchWithTimeout(`${API_BASE_URL}/api/legal/query`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        question: request.question.trim(),
        top_k: request.top_k || 8,
        act_filter: request.act_filter || null,
        user_type: request.user_type || null,
        purpose: request.purpose || null,
      }),
    }, 75000);
    return handleResponse<LegalQueryResponse>(res);
  },

  async analyzeCaseEvidence(formData: FormData): Promise<LegalQueryResponse> {
    const token = tokenStorage.get();
    const headers: Record<string, string> = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetchWithTimeout(`${API_BASE_URL}/api/legal/analyze-case`, {
      method: "POST",
      headers,
      body: formData,
    }, 90000);
    return handleResponse<LegalQueryResponse>(res);
  },

  // --- Auth APIs ---
  async register(email: string, password: string, fullName?: string): Promise<TokenResponse> {
    const res = await fetchWithTimeout(`${API_BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: email.trim(),
        password,
        full_name: fullName?.trim() || null,
      }),
    });
    const data = await handleResponse<TokenResponse>(res);
    tokenStorage.set(data.access_token);
    return data;
  },

  async login(email: string, password: string): Promise<TokenResponse> {
    const res = await fetchWithTimeout(`${API_BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: email.trim(),
        password,
      }),
    });
    const data = await handleResponse<TokenResponse>(res);
    tokenStorage.set(data.access_token);
    return data;
  },

  async loginWithGoogle(idToken: string): Promise<TokenResponse> {
    const res = await fetchWithTimeout(`${API_BASE_URL}/api/auth/google`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id_token: idToken }),
    });
    const data = await handleResponse<TokenResponse>(res);
    tokenStorage.set(data.access_token);
    return data;
  },

  async getMe(): Promise<UserDetail> {
    const res = await fetchWithTimeout(`${API_BASE_URL}/api/auth/me`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    return handleResponse<UserDetail>(res);
  },

  // --- Onboarding & Profile APIs ---
  async submitOnboarding(payload: OnboardingQuestionnaireRequest): Promise<UserProfile> {
    const res = await fetchWithTimeout(`${API_BASE_URL}/api/user/onboarding`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse<UserProfile>(res);
  },

  async getProfile(): Promise<UserProfile> {
    const res = await fetchWithTimeout(`${API_BASE_URL}/api/user/profile`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    return handleResponse<UserProfile>(res);
  },

  logout(): void {
    tokenStorage.clear();
  },
};

export { ApiError, API_BASE_URL };
