import { API_BASE_URL } from "../config";

interface CustomRequestInit extends RequestInit {
  headers?: Record<string, string>;
}

export const apiFetch = async (endpoint: string, options: CustomRequestInit = {}) => {
  const token = localStorage.getItem("sessionToken");
  
  const headers: Record<string, string> = {
    ...(token ? { "Authorization": `Bearer ${token}` } : {}),
    ...options.headers,
  };

  if (options.body && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // Token might be expired, try to refresh
    const refreshToken = localStorage.getItem("refreshToken");
    
    if (refreshToken) {
      try {
        const refreshResponse = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ refreshToken }),
        });

        if (refreshResponse.ok) {
          const data = await refreshResponse.json();
          
          // Update tokens
          localStorage.setItem("sessionToken", data.sessionToken);
          localStorage.setItem("refreshToken", data.refreshToken);
          if (data.user) {
             localStorage.setItem("user", JSON.stringify(data.user));
          }

          // Retry original request with new token
          const newHeaders = {
            ...headers,
            "Authorization": `Bearer ${data.sessionToken}`,
          };

          return fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers: newHeaders,
          });
        } else {
          // Refresh failed, logout
          localStorage.removeItem("sessionToken");
          localStorage.removeItem("refreshToken");
          localStorage.removeItem("user");
          window.location.href = "/"; // Force redirect to login
          throw new Error("Session expired. Please login again.");
        }
      } catch (error) {
        console.error("Token refresh failed", error);
        localStorage.removeItem("sessionToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");
        window.location.href = "/";
        throw error;
      }
    } else {
      // No refresh token, just fail
      throw new Error("Unauthorized");
    }
  }

  return response;
};
