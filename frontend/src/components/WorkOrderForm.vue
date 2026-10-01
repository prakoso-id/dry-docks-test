<script setup>
import { computed, reactive, watch } from "vue";
import FormErrors from "./FormErrors.vue";
import ModalDialog from "./ModalDialog.vue";
import { toWorkOrderPayload } from "../services/workOrderForm.js";
import { sumCostAmounts } from "../services/costs.js";
import { formatCostAmount } from "../services/costSummary.js";

const props = defineProps({
  open: Boolean,
  initialValues: { type: Object, default: null },
  specificationGroups: { type: Array, default: () => [] },
  vesselName: { type: String, default: "" },
  currency: { type: String, default: "USD" },
  saving: Boolean,
  error: { type: Object, default: null }
});
const emit = defineEmits(["close", "submit"]);
const form = reactive({ jobName: "", description: "", attachmentFile: null });
const totalEstimates = computed(() => sumCostAmounts(form.yardEstimate, form.ownerEstimate));

function reset() {
  const initial = props.initialValues ?? {};
  Object.assign(form, {
    specificationGroupId: initial.specificationGroupId ?? "",
    jobName: initial.jobName ?? "",
    title: initial.title ?? "",
    description: initial.description ?? "",
    machineryGroup: initial.machineryGroup ?? "",
    machinery: initial.machinery ?? "",
    jobCode: initial.jobCode ?? "",
    jobCategory: initial.jobCategory ?? "",
    jobType: initial.jobType ?? "",
    standardJob: Boolean(initial.standardJob),
    criticalJob: Boolean(initial.criticalJob),
    internalJob: Boolean(initial.internalJob),
    accountCodes: initial.accountCodes ?? "",
    lastDoneDate: initial.lastDoneDate ?? "",
    lastDoneValue: initial.lastDoneValue ?? "",
    estimatedHours: initial.estimatedHours ?? "",
    responsibleRank: initial.responsibleRank ?? "",
    priority: initial.priority ?? "",
    status: initial.status ?? "",
    totalBudget: initial.totalBudget ?? "",
    yardEstimate: initial.yardEstimate ?? "",
    ownerEstimate: initial.ownerEstimate ?? "",
    inspectionTypes: initial.inspectionTypes ?? "",
    sortOrder: initial.sortOrder ?? 0,
    attachmentFile: null
  });
}

watch(() => [props.open, props.initialValues], ([open]) => { if (open) reset(); }, { immediate: true });

function submit() { emit("submit", { values: toWorkOrderPayload(form, props.currency), attachmentFile: form.attachmentFile }); }
function selectImage(event) { form.attachmentFile = event.target.files?.[0] ?? null; }
</script>

<template>
  <ModalDialog :open="open" :title="initialValues ? 'Edit Work Order' : 'Add Work Order'" @close="emit('close')">
    <form @submit.prevent="submit">
      <div class="modal__body">
        <FormErrors :error="error" />
        <div v-if="specificationGroups.length === 0" class="notice notice--error" role="status">Add a specification group for this vessel before adding a Work Order.</div>
        <div class="form-grid">
          <div class="field"><label for="wo-vessel-name">Vessel Name</label><input id="wo-vessel-name" :value="vesselName" readonly aria-readonly="true" /></div>
          <div class="field"><label for="wo-machinery-group">Machinery Group</label><input id="wo-machinery-group" v-model="form.machineryGroup" maxlength="200" /></div>
          <div class="field"><label for="wo-machinery">Machinery</label><input id="wo-machinery" v-model="form.machinery" maxlength="200" /></div>
          <div class="field"><label for="wo-code">Job Code</label><input id="wo-code" v-model="form.jobCode" maxlength="100" /></div>
          <div class="field"><label for="wo-job-name">Job Name <span aria-hidden="true">*</span></label><input id="wo-job-name" v-model="form.jobName" required maxlength="255" /></div>
          <div class="field"><label for="wo-category">Job Category</label><input id="wo-category" v-model="form.jobCategory" maxlength="100" /></div>
          <div class="field field--full checkbox-row">
            <label><input v-model="form.standardJob" type="checkbox" /> Standard Job</label>
            <label><input v-model="form.criticalJob" type="checkbox" /> Critical Job</label>
            <label><input v-model="form.internalJob" type="checkbox" /> Internal Job</label>
          </div>
          <div class="field"><label for="wo-account">Account codes</label><input id="wo-account" v-model="form.accountCodes" maxlength="255" /></div>
          <div class="field field--full">
            <label for="wo-spec-group">Specification Group <span aria-hidden="true">*</span></label>
            <select id="wo-spec-group" v-model="form.specificationGroupId" required>
              <option value="" disabled>Select a group</option>
              <option v-for="group in specificationGroups" :key="group.id" :value="group.id">{{ group.groupNo }} · {{ group.name }}</option>
            </select>
          </div>
          <div class="field"><label for="wo-job-type">Job Type</label><input id="wo-job-type" v-model="form.jobType" maxlength="100" /></div>
          <div class="field"><label for="wo-last-date">Last Done Date</label><input id="wo-last-date" v-model="form.lastDoneDate" type="date" /></div>
          <div class="field"><label for="wo-last-value">Last Done Value</label><input id="wo-last-value" v-model="form.lastDoneValue" type="number" min="0" step="0.01" /></div>
          <div class="field"><label for="wo-est-hours">Estimated Hours</label><input id="wo-est-hours" v-model="form.estimatedHours" type="number" min="0" step="0.01" /></div>
          <div class="field field--full"><label for="wo-description">Job Description <span aria-hidden="true">*</span></label><textarea id="wo-description" v-model="form.description" required maxlength="5000" rows="3"></textarea></div>
          <div class="field field--full"><label for="wo-attachments">Attachments</label><input id="wo-attachments" type="file" accept="image/*" @change="selectImage" /><span v-if="form.attachmentFile" class="table-secondary">{{ form.attachmentFile.name }}</span><a v-else-if="initialValues?.attachments?.[0]?.url" class="table-secondary" :href="initialValues.attachments[0].url" target="_blank" rel="noopener noreferrer">{{ initialValues.attachments[0].fileName }}</a><span v-else class="table-secondary">Choose an image…</span></div>
          <div class="field"><label for="wo-rank">Responsible Rank</label><input id="wo-rank" v-model="form.responsibleRank" maxlength="100" /></div>
          <div class="field"><label for="wo-priority">Priority</label><input id="wo-priority" v-model="form.priority" maxlength="30" /></div>
          <div class="field"><label for="wo-status">Status</label><input id="wo-status" v-model="form.status" maxlength="30" /></div>
          <div class="field"><label for="wo-total-budget">Total Budget</label><input id="wo-total-budget" v-model="form.totalBudget" type="number" min="0" step="0.01" /></div>
          <div class="field"><label for="wo-owner-estimate">Owner Estimate</label><input id="wo-owner-estimate" v-model="form.ownerEstimate" type="number" min="0" step="0.01" /></div>
          <div class="field"><label for="wo-title">Title</label><input id="wo-title" v-model="form.title" maxlength="255" /></div>
          <div class="field field--full"><label for="wo-inspections">Inspection Types</label><textarea id="wo-inspections" v-model="form.inspectionTypes" maxlength="5000" rows="2"></textarea></div>
          <div class="field"><label for="wo-sort-order">Sort Order</label><input id="wo-sort-order" v-model="form.sortOrder" type="number" step="1" /></div>
          <div class="field"><label for="wo-yard-estimate">Yard Estimates</label><input id="wo-yard-estimate" v-model="form.yardEstimate" type="number" min="0" step="0.01" /></div>
          <div class="field"><label for="wo-total-estimates">Total Estimates</label><input id="wo-total-estimates" :value="formatCostAmount(totalEstimates, currency)" readonly aria-readonly="true" /></div>
        </div>
      </div>
      <footer class="modal__footer">
        <button class="button button--secondary" type="button" @click="emit('close')">Cancel</button>
        <button class="button" type="submit" :disabled="saving || !specificationGroups.length || !form.jobName.trim() || !form.description.trim()">{{ saving ? 'Saving…' : 'Save Work Order' }}</button>
      </footer>
    </form>
  </ModalDialog>
</template>
