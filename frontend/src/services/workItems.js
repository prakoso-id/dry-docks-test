import { request, uploadImage } from "./apiClient.js";

const data = async (promise) => (await promise).data;

export const listWorkOrders = (dockId) => data(request(`dry-docks/${dockId}/work-orders`));
export const createWorkOrder = (dockId, values) => data(request(`dry-docks/${dockId}/work-orders`, { method: "POST", body: values }));
export const updateWorkOrder = (id, values) => data(request(`work-orders/${id}`, { method: "PATCH", body: values }));
export const uploadWorkOrderImage = (id, file) => data(uploadImage(`work-orders/${id}/attachments`, file));
export const listWorkOrderUpdates = (id) => data(request(`work-orders/${id}/updates`));
export const createWorkOrderUpdate = (id, values) => data(request(`work-orders/${id}/updates`, { method: "POST", body: values }));
export const listTasks = (dockId) => data(request(`dry-docks/${dockId}/tasks`));
export const createTask = (dockId, values) => data(request(`dry-docks/${dockId}/tasks`, { method: "POST", body: values }));
export const updateTask = (id, values) => data(request(`tasks/${id}`, { method: "PATCH", body: values }));
export const listDryDockFacts = (dockId) => data(request(`dry-docks/${dockId}/facts`));
export const createDryDockFact = (dockId, values) => data(request(`dry-docks/${dockId}/facts`, { method: "POST", body: values }));
