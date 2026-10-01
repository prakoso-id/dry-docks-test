<script setup>
import { computed, reactive, watch } from "vue";
import FormErrors from "./FormErrors.vue";
import ModalDialog from "./ModalDialog.vue";
import { sumCostAmounts, toCostPayload } from "../services/costs.js";
import { formatCostAmount } from "../services/costSummary.js";

const props = defineProps({
  open: Boolean, initialValues: { type: Object, default: null },
  specificationGroups: { type: Array, default: () => [] }, currency: { type: String, default: "USD" },
  saving: Boolean, error: { type: Object, default: null }
});
const emit = defineEmits(["close", "submit"]);
const form = reactive({});
const amount = (field) => form[field] === "" || form[field] == null ? "0.00" : String(form[field]);
const totalBudget = computed(() => sumCostAmounts(amount("budget"), amount("itemBudget")));
const totalEstimates = computed(() => sumCostAmounts(amount("yardEstimate"), amount("ownerEstimate")));
const totalCosts = computed(() => sumCostAmounts(amount("actualYardCost"), amount("actualOwnerCost")));
const variance = computed(() => {
  const costs = BigInt(totalCosts.value.replace(".", ""));
  const estimates = BigInt(totalEstimates.value.replace(".", ""));
  const value = costs - estimates;
  const abs = value < 0n ? -value : value;
  return `${value < 0n ? "-" : ""}${abs / 100n}.${String(abs % 100n).padStart(2, "0")}`;
});
const displayAmount = (value) => formatCostAmount(value, props.currency);

watch(() => [props.open, props.initialValues], ([open]) => {
  if (!open) return;
  for (const field of ["priority", "status", "budget", "itemBudget", "yardEstimate", "ownerEstimate", "actualYardCost", "actualOwnerCost", "machineryGroup", "machinery", "jobCode", "jobName", "jobCategory", "specificationGroupId", "sortOrder", "jobType", "criticalJob", "internalJob", "accountCodes", "lastDoneDate", "lastDoneValue", "estimatedHours", "jobDescription"]) {
    const value = props.initialValues?.[field] ?? (field === "sortOrder" ? 0 : "");
    form[field] = value == null ? "" : String(value).slice(0, field === "lastDoneDate" ? 10 : undefined);
  }
}, { immediate: true });

function submit() { emit("submit", toCostPayload(form)); }
</script>

<template>
  <ModalDialog :open="open" :title="initialValues ? 'Edit Cost' : 'Add Cost'" @close="emit('close')">
    <form @submit.prevent="submit">
      <div class="modal__body">
        <FormErrors :error="error" />
        <div class="form-grid">
          <div class="field"><label for="cost-priority">Priority</label><input id="cost-priority" v-model="form.priority" maxlength="30" /></div>
          <div class="field"><label for="cost-status">Status</label><input id="cost-status" v-model="form.status" maxlength="30" /></div>
          <div class="field"><label for="cost-budget">Budget</label><input id="cost-budget" v-model="form.budget" type="number" min="0" step="0.01" /></div>
          <div class="field"><label for="cost-item-budget">Item Budget</label><input id="cost-item-budget" v-model="form.itemBudget" type="number" min="0" step="0.01" /></div>
          <div class="field"><label for="cost-total-budget">Total Budget</label><input id="cost-total-budget" :value="displayAmount(totalBudget)" readonly /></div>
          <div class="field"><label for="cost-yard-estimate">Yard Estimates</label><input id="cost-yard-estimate" v-model="form.yardEstimate" type="number" min="0" step="0.01" /></div>
          <div class="field"><label for="cost-owner-estimate">Owner Estimate</label><input id="cost-owner-estimate" v-model="form.ownerEstimate" type="number" min="0" step="0.01" /></div>
          <div class="field"><label for="cost-total-estimates">Total Estimates</label><input id="cost-total-estimates" :value="displayAmount(totalEstimates)" readonly /></div>
          <div class="field"><label for="cost-actual-yard">Actual Yard Costs</label><input id="cost-actual-yard" v-model="form.actualYardCost" type="number" min="0" step="0.01" /></div>
          <div class="field"><label for="cost-actual-owner">Actual Owner Costs</label><input id="cost-actual-owner" v-model="form.actualOwnerCost" type="number" min="0" step="0.01" /></div>
          <div class="field"><label for="cost-total-costs">Total Costs</label><input id="cost-total-costs" :value="displayAmount(totalCosts)" readonly /></div>
          <div class="field"><label for="cost-variance">Variance</label><input id="cost-variance" :value="displayAmount(variance)" readonly /></div>
          <div class="field"><label for="cost-machinery-group">Machinery Group</label><input id="cost-machinery-group" v-model="form.machineryGroup" maxlength="200" /></div>
          <div class="field"><label for="cost-machinery">Machinery</label><input id="cost-machinery" v-model="form.machinery" maxlength="200" /></div>
          <div class="field"><label for="cost-job-code">Job Code</label><input id="cost-job-code" v-model="form.jobCode" maxlength="100" /></div>
          <div class="field"><label for="cost-job-name">Job Name <span aria-hidden="true">*</span></label><input id="cost-job-name" v-model="form.jobName" maxlength="255" required /></div>
          <div class="field"><label for="cost-job-category">Job Category</label><input id="cost-job-category" v-model="form.jobCategory" maxlength="100" /></div>
          <div class="field"><label for="cost-specification-group">Specification Group</label><select id="cost-specification-group" v-model="form.specificationGroupId"><option value="">Not selected</option><option v-for="group in specificationGroups" :key="group.id" :value="String(group.id)">{{ group.groupNo }} · {{ group.name }}</option></select></div>
          <div class="field"><label for="cost-sort-order">Sort Order</label><input id="cost-sort-order" v-model="form.sortOrder" type="number" step="1" /></div>
          <div class="field"><label for="cost-job-type">Job Type</label><input id="cost-job-type" v-model="form.jobType" maxlength="100" /></div>
          <div class="field"><label for="cost-critical-job">Critical Job</label><select id="cost-critical-job" v-model="form.criticalJob"><option value="">Not selected</option><option>Yes</option><option>No</option></select></div>
          <div class="field"><label for="cost-internal-job">Internal Job</label><select id="cost-internal-job" v-model="form.internalJob"><option value="">Not selected</option><option>Yes</option><option>No</option></select></div>
          <div class="field"><label for="cost-account-codes">Account codes</label><input id="cost-account-codes" v-model="form.accountCodes" maxlength="255" /></div>
          <div class="field"><label for="cost-last-date">Last Done Date</label><input id="cost-last-date" v-model="form.lastDoneDate" type="date" /></div>
          <div class="field"><label for="cost-last-value">Last Done Value</label><input id="cost-last-value" v-model="form.lastDoneValue" type="number" min="0" step="0.01" /></div>
          <div class="field"><label for="cost-hours">Estimated Hours</label><input id="cost-hours" v-model="form.estimatedHours" type="number" min="0" step="0.01" /></div>
          <div class="field field--full"><label for="cost-description">Job Description</label><textarea id="cost-description" v-model="form.jobDescription" maxlength="5000" rows="3" /></div>
        </div>
      </div>
      <footer class="modal__footer"><button class="button button--secondary" type="button" @click="emit('close')">Cancel</button><button class="button" type="submit" :disabled="saving || !form.jobName?.trim()">{{ saving ? 'Saving…' : 'Save Cost' }}</button></footer>
    </form>
  </ModalDialog>
</template>
