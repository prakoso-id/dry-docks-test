import { request } from "./apiClient.js";

export const listRfqs = async (dockId) => (await request(`dry-docks/${dockId}/rfqs`)).data;
export const createRfq = async (dockId, values) => (await request(`dry-docks/${dockId}/rfqs`, { method: "POST", body: values })).data;
export const updateRfq = async (id, values) => (await request(`rfqs/${id}`, { method: "PATCH", body: values })).data;
export const deleteRfq = async (id) => request(`rfqs/${id}`, { method: "DELETE" });
export const listInvitations = async (rfqId) => (await request(`rfqs/${rfqId}/invitations`)).data;
export const createInvitation = async (rfqId, values) => (await request(`rfqs/${rfqId}/invitations`, { method: "POST", body: values })).data;
export const updateInvitation = async (id, values) => (await request(`rfq-invitations/${id}`, { method: "PATCH", body: values })).data;
export const deleteInvitation = async (id) => request(`rfq-invitations/${id}`, { method: "DELETE" });
export const listQuotations = async (invitationId) => (await request(`rfq-invitations/${invitationId}/quotations`)).data;
export const createQuotation = async (invitationId, values) => (await request(`rfq-invitations/${invitationId}/quotations`, { method: "POST", body: values })).data;
export const updateQuotation = async (id, values) => (await request(`quotations/${id}`, { method: "PATCH", body: values })).data;
export const deleteQuotation = async (id) => request(`quotations/${id}`, { method: "DELETE" });
export const compareQuotes = async (dockId, rfqId) => (await request(`dry-docks/${dockId}/quotation-comparison?rfqId=${encodeURIComponent(rfqId)}`)).data;
