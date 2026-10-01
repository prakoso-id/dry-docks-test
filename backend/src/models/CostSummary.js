import { validationError } from "../errors/AppError.js";

function toMinorUnits(value, field) {
  if (value === null || value === undefined || value === "") return 0n;
  const match = /^(-?)(\d+)(?:\.(\d{1,2}))?$/.exec(String(value));
  if (!match) throw validationError([{ field, message: "Amount must have at most two decimal places" }]);
  const amount = BigInt(match[2]) * 100n + BigInt((match[3] ?? "").padEnd(2, "0"));
  return match[1] ? -amount : amount;
}

function formatMinorUnits(value) {
  const sign = value < 0n ? "-" : "";
  const amount = value < 0n ? -value : value;
  return `${sign}${amount / 100n}.${String(amount % 100n).padStart(2, "0")}`;
}

export class CostSummary {
  static from({ budget, currency, costs = [] }) {
    if (!/^[A-Z]{3}$/.test(currency)) {
      throw validationError([{ field: "currency", message: "Currency must be a three-letter uppercase code" }]);
    }
    for (const [index, record] of costs.entries()) {
      if (record.currency !== currency) {
        throw validationError([{ field: `costs.${index}.currency`, message: "Cost currency must match the dry dock currency" }]);
      }
    }

    const sum = (field) => costs.reduce((total, record, index) => total + toMinorUnits(record[field], `costs.${index}.${field}`), 0n);
    const costBudget = sum("totalBudget");
    const yardEstimates = sum("yardEstimate");
    const ownerEstimates = sum("ownerEstimate");
    const actualYardCosts = sum("actualYardCost");
    const actualOwnerCosts = sum("actualOwnerCost");
    const totalEstimates = yardEstimates + ownerEstimates;
    const totalCosts = actualYardCosts + actualOwnerCosts;

    return {
      budget: formatMinorUnits(toMinorUnits(budget, "budget")),
      costBudget: formatMinorUnits(costBudget),
      currency,
      yardEstimates: formatMinorUnits(yardEstimates),
      ownerEstimates: formatMinorUnits(ownerEstimates),
      totalEstimates: formatMinorUnits(totalEstimates),
      actualYardCosts: formatMinorUnits(actualYardCosts),
      actualOwnerCosts: formatMinorUnits(actualOwnerCosts),
      totalCosts: formatMinorUnits(totalCosts),
      variance: formatMinorUnits(totalCosts - totalEstimates)
    };
  }
}
