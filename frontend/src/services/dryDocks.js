import { request } from "./apiClient.js";

const data = (response) => response.data;

export async function listDryDocks(filters = {}) {
  const query = new URLSearchParams(Object.entries(filters).filter(([, value]) => value !== "" && value != null));
  const suffix = query.size ? `?${query}` : "";
  return request(`dry-docks${suffix}`);
}

export async function getDryDock(id) {
  return data(await request(`dry-docks/${id}`));
}

export async function createDryDock(values) {
  return data(await request("dry-docks", { method: "POST", body: values }));
}

export async function updateDryDock(id, values) {
  return data(await request(`dry-docks/${id}`, { method: "PATCH", body: values }));
}

export function deleteDryDock(id) {
  return request(`dry-docks/${id}`, { method: "DELETE" });
}
