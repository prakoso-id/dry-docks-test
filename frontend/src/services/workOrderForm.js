const nullableNumber = (value) => value === "" || value === null || value === undefined ? null : Number(value);
const nullableText = (value) => String(value ?? "").trim() || null;

export function toWorkOrderPayload(form, dockCurrency) {
  return {
    specificationGroupId: Number(form.specificationGroupId),
    jobName: String(form.jobName).trim(),
    title: nullableText(form.title),
    description: String(form.description).trim(),
    machineryGroup: nullableText(form.machineryGroup),
    machinery: nullableText(form.machinery),
    jobCode: nullableText(form.jobCode),
    jobCategory: nullableText(form.jobCategory),
    jobType: nullableText(form.jobType),
    standardJob: Boolean(form.standardJob),
    criticalJob: Boolean(form.criticalJob),
    internalJob: Boolean(form.internalJob),
    accountCodes: nullableText(form.accountCodes),
    lastDoneDate: form.lastDoneDate || null,
    lastDoneValue: nullableNumber(form.lastDoneValue),
    estimatedHours: nullableNumber(form.estimatedHours),
    responsibleRank: nullableText(form.responsibleRank),
    priority: nullableText(form.priority),
    status: nullableText(form.status),
    totalBudget: nullableNumber(form.totalBudget),
    yardEstimate: nullableNumber(form.yardEstimate),
    ownerEstimate: nullableNumber(form.ownerEstimate),
    sortOrder: Number(form.sortOrder ?? 0),
    currency: String(dockCurrency).toUpperCase(),
    inspectionTypes: nullableText(form.inspectionTypes)
  };
}
