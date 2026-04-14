export class AuthError extends Error {
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "AuthError";
  }
}

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function handleResponse(res) {
  if (res.status === 401) {
    // If not authenticated, we throw a specific AuthError
    // that the router/components can catch to redirect.
    throw new AuthError();
  }
  
  const isJson = res.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await res.json() : null;

  if (!res.ok) {
    const errorMsg = data?.message || res.statusText || "Something went wrong";
    throw new ApiError(errorMsg, res.status);
  }

  return data;
}

export const api = {
  get: async (endpoint) => {
    const res = await fetch(`https://devboard-production-d06c.up.railway.app/api${endpoint}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    return handleResponse(res);
  },
  
  post: async (endpoint, data) => {
    const res = await fetch(`https://devboard-production-d06c.up.railway.app/api${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  patch: async (endpoint, data) => {
    const res = await fetch(`https://devboard-production-d06c.up.railway.app/api${endpoint}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  delete: async (endpoint) => {
    const res = await fetch(`https://devboard-production-d06c.up.railway.app/api${endpoint}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });
    return handleResponse(res);
  }
};
