export class ApiError extends Error {
  constructor({ status, code, message, details = [] }) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export async function request(path, { method = "GET", body, signal } = {}) {
  const url = path.startsWith("/") ? `/api/v1${path}` : `/api/v1/${path}`;
  let response;
  try {
    response = await fetch(url, {
      method,
      signal,
      headers: body === undefined ? undefined : { "content-type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body)
    });
  } catch {
    throw new ApiError({ status: 0, code: "NETWORK_ERROR", message: "Could not connect to the server" });
  }

  const payload = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiError({
      status: response.status,
      code: payload?.error?.code ?? "REQUEST_FAILED",
      message: payload?.error?.message ?? "The request could not be completed",
      details: payload?.error?.details ?? []
    });
  }
  return payload;
}

export async function uploadImage(path, file) {
  let response;
  try {
    response = await fetch(path.startsWith("/") ? `/api/v1${path}` : `/api/v1/${path}`, {
      method: "POST",
      headers: { "content-type": file.type, "x-file-name": encodeURIComponent(file.name) },
      body: file
    });
  } catch {
    throw new ApiError({ status: 0, code: "NETWORK_ERROR", message: "Could not connect to the server" });
  }

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiError({
      status: response.status,
      code: payload?.error?.code ?? "REQUEST_FAILED",
      message: payload?.error?.message ?? "The upload could not be completed",
      details: payload?.error?.details ?? []
    });
  }
  return payload;
}
