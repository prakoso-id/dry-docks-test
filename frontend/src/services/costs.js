import { request } from "./apiClient.js";

const data = async (promise) => (await promise).data;

export const listCosts = (dryDockId) => data(request(`dry-docks/${dryDockId}/costs`));
export const createCost = (dryDockId, values) => data(request(`dry-docks/${dryDockId}/costs`, { method: "POST", body: values }));
export const updateCost = (id, values) => data(request(`costs/${id}`, { method: "PATCH", body: values }));
export const deleteCost = (id) => request(`costs/${id}`, { method: "DELETE" });
export const copyYardEstimatesToActual = (dryDockId) => data(request(`dry-docks/${dryDockId}/costs/copy-yard-estimates-to-actual`, { method: "POST" }));

export function sumCostAmounts(...values) {
  const cents = values.reduce((sum, value) => {
    if (value === "" || value === null || value === undefined) return sum;
    const match = /^(\d+)(?:\.(\d{1,2}))?$/.exec(String(value));
    return match ? sum + BigInt(match[1]) * 100n + BigInt((match[2] ?? "").padEnd(2, "0")) : sum;
  }, 0n);
  return `${cents / 100n}.${String(cents % 100n).padStart(2, "0")}`;
}

export function toCostPayload(form) {
  const amount = (value) => value === "" || value == null ? null : Number(value);
  const text = (value) => String(value ?? "").trim() || null;
  return {
    priority: text(form.priority), status: text(form.status),
    budget: amount(form.budget), itemBudget: amount(form.itemBudget),
    yardEstimate: amount(form.yardEstimate), ownerEstimate: amount(form.ownerEstimate),
    actualYardCost: amount(form.actualYardCost), actualOwnerCost: amount(form.actualOwnerCost),
    machineryGroup: text(form.machineryGroup), machinery: text(form.machinery),
    jobCode: text(form.jobCode), jobName: String(form.jobName ?? "").trim(), jobCategory: text(form.jobCategory),
    specificationGroupId: form.specificationGroupId ? Number(form.specificationGroupId) : null,
    sortOrder: form.sortOrder === "" || form.sortOrder == null ? 0 : Number(form.sortOrder),
    jobType: text(form.jobType), criticalJob: text(form.criticalJob), internalJob: text(form.internalJob),
    accountCodes: text(form.accountCodes), lastDoneDate: form.lastDoneDate || null,
    lastDoneValue: amount(form.lastDoneValue), estimatedHours: amount(form.estimatedHours),
    jobDescription: text(form.jobDescription)
  };
}
