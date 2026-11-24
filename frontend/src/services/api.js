const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";

export async function sendChatMessage(message, sessionId) {
  const response = await fetch(`${API_BASE_URL}/api/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      message,
      session_id: sessionId,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Unable to connect to the AI agent.");
  }

  return data;
}

export async function checkBackendHealth() {
  const response = await fetch(`${API_BASE_URL}/api/health`);

  if (!response.ok) {
    throw new Error("Backend is unavailable.");
  }

  return response.json();
}

// --------------------------------------------------
// SECURITY & AUDIT API
// --------------------------------------------------

export async function authenticateAdmin(username, password) {
  const response = await fetch(`${API_BASE_URL}/api/admin/authenticate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ username, password }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Administrator authentication failed.");
  }

  return data;
}

export async function fetchAuditLogs(token) {
  const response = await fetch(`${API_BASE_URL}/api/admin/audit-logs`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Unable to retrieve audit logs.");
  }

  return data;
}

// --------------------------------------------------
// FLOCI EC2 INFRASTRUCTURE API
// --------------------------------------------------

export async function fetchFlociInstances() {
  const response = await fetch(
    `${API_BASE_URL}/api/infrastructure/ec2-instances`
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Unable to retrieve FLOCI instances.");
  }

  return data;
}
