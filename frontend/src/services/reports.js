import { request } from "./apiClient.js";

const data = async (promise) => (await promise).data;

export const listReports = (dockId) => data(request(`dry-docks/${dockId}/reports`));
export const createReport = (dockId, values) => data(request(`dry-docks/${dockId}/reports`, { method: "POST", body: values }));
export const updateReport = (id, values) => data(request(`reports/${id}`, { method: "PATCH", body: values }));
export const deleteReport = (id) => request(`reports/${id}`, { method: "DELETE" });
