import { request } from "./apiClient.js";

export const listPurchaseOrders = async (dockId) => (await request(`dry-docks/${dockId}/purchase-orders`)).data;
export const createPurchaseOrder = async (dockId, values) => (await request(`dry-docks/${dockId}/purchase-orders`, { method: "POST", body: values })).data;
export const updatePurchaseOrder = async (id, values) => (await request(`purchase-orders/${id}`, { method: "PATCH", body: values })).data;
export const deletePurchaseOrder = async (id) => request(`purchase-orders/${id}`, { method: "DELETE" });
