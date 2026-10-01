import { request } from "./apiClient.js";

const summaryFields = ["budget", "yardEstimates", "ownerEstimates", "totalEstimates", "actualYardCosts", "actualOwnerCosts", "totalCosts", "variance"];
const statusOrder = ["Open", "In Progress", "On Hold", "Complete"];

export async function getCostSummary(dockId) {
  return (await request(`dry-docks/${dockId}/cost-summary`)).data;
}

export function formatCostAmount(value, currency, locale) {
  const negative = String(value).startsWith("-");
  const [whole, fraction = "00"] = String(value).replace(/^-/, "").split(".");
  const parts = new Intl.NumberFormat(locale, {
    style: "currency", currency, minimumFractionDigits: 2, maximumFractionDigits: 2
  }).formatToParts(negative ? -1 : 1);
  const integer = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(BigInt(whole));
  return parts.map((part) => {
    if (part.type === "integer") return integer;
    if (part.type === "fraction") return fraction.padEnd(2, "0");
    if (part.type === "sign" && !negative) return "";
    return part.value;
  }).join("");
}

export function formatCostSummary(summary, locale) {
  return {
    currency: summary.currency,
    ...Object.fromEntries(summaryFields.map((field) => [field, formatCostAmount(summary[field] ?? "0.00", summary.currency, locale)]))
  };
}

export function buildWorkOrderStatusSegments(workOrders = []) {
  const counts = new Map();
  for (const order of workOrders) {
    const status = String(order.status ?? "").trim() || "Unspecified";
    counts.set(status, (counts.get(status) ?? 0) + 1);
  }
  return [...counts].map(([label, count]) => ({ label, count })).sort((a, b) => {
    const aRank = statusOrder.indexOf(a.label);
    const bRank = statusOrder.indexOf(b.label);
    if (aRank !== -1 || bRank !== -1) return (aRank === -1 ? Infinity : aRank) - (bRank === -1 ? Infinity : bRank);
    return a.label.localeCompare(b.label);
  });
}

export function buildCostComparisonGroups(costs = []) {
  const groups = new Map();
  for (const cost of costs) {
    const label = String(cost.specificationGroupName ?? "").trim() || "Unassigned";
    const group = groups.get(label) ?? { label, totalBudget: 0, totalEstimates: 0, totalCosts: 0 };
    for (const field of ["totalBudget", "totalEstimates", "totalCosts"]) {
      const amount = Number(cost[field] ?? 0);
      if (Number.isFinite(amount)) group[field] += amount;
    }
    groups.set(label, group);
  }
  return [...groups.values()];
}
