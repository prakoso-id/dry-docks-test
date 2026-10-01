<script setup>
import { reactive, watch } from "vue";
import FormErrors from "./FormErrors.vue";
import ModalDialog from "./ModalDialog.vue";

const props = defineProps({
  open: Boolean,
  initialValues: { type: Object, default: null },
  vessels: { type: Array, default: () => [] },
  shipyards: { type: Array, default: () => [] },
  accountCodes: { type: Array, default: () => [] },
  saving: Boolean,
  error: { type: Object, default: null }
});
const emit = defineEmits(["close", "submit"]);
const form = reactive({ dockNo: "", description: "" });

function reset() {
  const initial = props.initialValues ?? {};
  Object.assign(form, {
    vesselId: initial.vesselId ?? "",
    dockNo: initial.dockNo ?? "",
    description: initial.description ?? "",
    shipyardId: initial.shipyardId ?? "",
    shipyardDetails: initial.shipyardDetails ?? "",
    plannedStart: initial.plannedStart ?? "",
    plannedEnd: initial.plannedEnd ?? "",
    actualStart: initial.actualStart ?? "",
    actualEnd: initial.actualEnd ?? "",
    completedDate: initial.completedDate ?? "",
    accountCodeId: initial.accountCodeId ?? "",
    company: initial.company ?? "",
    budget: initial.budget ?? "",
    currency: initial.currency ?? "USD",
    responsibleRank: initial.responsibleRank ?? "",
    status: initial.status ?? "Planning",
    priority: initial.priority ?? "Medium",
    imageUrl: initial.imageUrl ?? ""
  });
}

watch(() => [props.open, props.initialValues], ([open]) => { if (open) reset(); }, { immediate: true });

function submit() {
  if (form.plannedStart && form.plannedEnd && form.plannedEnd < form.plannedStart) return;
  if (form.actualStart && form.actualEnd && form.actualEnd < form.actualStart) return;
  emit("submit", {
    vesselId: Number(form.vesselId),
    dockNo: form.dockNo.trim(),
    description: form.description.trim(),
    shipyardId: form.shipyardId ? Number(form.shipyardId) : null,
    shipyardDetails: form.shipyardDetails.trim() || null,
    plannedStart: form.plannedStart || null,
    plannedEnd: form.plannedEnd || null,
    actualStart: form.actualStart || null,
    actualEnd: form.actualEnd || null,
    completedDate: form.completedDate || null,
    accountCodeId: form.accountCodeId ? Number(form.accountCodeId) : null,
    company: form.company.trim() || null,
    budget: form.budget === "" ? null : Number(form.budget),
    currency: form.currency,
    responsibleRank: form.responsibleRank.trim() || null,
    status: form.status,
    priority: form.priority,
    imageUrl: form.imageUrl.trim() || null
  });
}
</script>

<template>
  <ModalDialog :open="open" :title="initialValues ? 'Edit Dry Dock' : 'Add Dry Dock'" @close="emit('close')">
    <form @submit.prevent="submit">
      <div class="modal__body">
        <FormErrors :error="error" />
        <div v-if="vessels.length === 0" class="notice notice--error" role="status">
          Add a vessel before creating a Dry Dock.
        </div>
        <div class="form-grid">
          <div class="field">
            <label for="dock-vessel">Vessel <span aria-hidden="true">*</span></label>
            <select id="dock-vessel" v-model="form.vesselId" required :disabled="Boolean(initialValues)">
              <option value="" disabled>Select a vessel</option>
              <option v-for="vessel in vessels" :key="vessel.id" :value="vessel.id">{{ vessel.name }}</option>
            </select>
            <small v-if="initialValues" class="field-help">Vessel cannot be changed after work has been linked.</small>
          </div>
          <div class="field">
            <label for="dock-number">Dock List No <span aria-hidden="true">*</span></label>
            <input id="dock-number" v-model="form.dockNo" required maxlength="100" autocomplete="off" />
          </div>
          <div class="field field--full">
            <label for="dock-description">Description <span aria-hidden="true">*</span></label>
            <textarea id="dock-description" v-model="form.description" required maxlength="5000" rows="3"></textarea>
          </div>
          <div class="field">
            <label for="dock-status">Status</label>
            <select id="dock-status" v-model="form.status">
              <option>Planning</option><option>Execution</option><option>Completed</option>
            </select>
          </div>
          <div class="field">
            <label for="dock-priority">Priority</label>
            <select id="dock-priority" v-model="form.priority"><option>Medium</option><option>Low</option></select>
          </div>
          <div class="field">
            <label for="dock-shipyard">Shipyard</label>
            <select id="dock-shipyard" v-model="form.shipyardId">
              <option value="">Not selected</option>
              <option v-for="shipyard in shipyards" :key="shipyard.id" :value="shipyard.id">{{ shipyard.name }}</option>
            </select>
          </div>
          <div class="field">
            <label for="dock-company">Company</label>
            <input id="dock-company" v-model="form.company" maxlength="200" />
          </div>
          <div class="field field--full">
            <label for="dock-yard-details">Details of Shipyard</label>
            <textarea id="dock-yard-details" v-model="form.shipyardDetails" maxlength="5000" rows="2"></textarea>
          </div>
          <div class="field">
            <label for="dock-planned-start">Planned Start</label>
            <input id="dock-planned-start" v-model="form.plannedStart" type="date" />
          </div>
          <div class="field">
            <label for="dock-planned-end">Planned End</label>
            <input id="dock-planned-end" v-model="form.plannedEnd" type="date" :min="form.plannedStart || undefined" />
          </div>
          <div class="field">
            <label for="dock-actual-start">Actual Start</label>
            <input id="dock-actual-start" v-model="form.actualStart" type="date" />
          </div>
          <div class="field">
            <label for="dock-actual-end">Actual End</label>
            <input id="dock-actual-end" v-model="form.actualEnd" type="date" :min="form.actualStart || undefined" />
          </div>
          <div class="field">
            <label for="dock-completed-date">Completed Date</label>
            <input id="dock-completed-date" v-model="form.completedDate" type="date" />
          </div>
          <div class="field">
            <label for="dock-rank">Responsible Rank</label>
            <input id="dock-rank" v-model="form.responsibleRank" maxlength="100" />
          </div>
          <div class="field">
            <label for="dock-account-code">Account Code</label>
            <select id="dock-account-code" v-model="form.accountCodeId">
              <option value="">Not selected</option>
              <option v-for="account in accountCodes" :key="account.id" :value="account.id">{{ account.code }}{{ account.description ? ` · ${account.description}` : '' }}</option>
            </select>
          </div>
          <div class="field">
            <label for="dock-budget">Budget</label>
            <input id="dock-budget" v-model="form.budget" type="number" min="0" step="0.01" />
          </div>
          <div class="field">
            <label for="dock-currency">Currency <span aria-hidden="true">*</span></label>
            <input id="dock-currency" v-model="form.currency" required minlength="3" maxlength="3" pattern="[A-Z]{3}" autocapitalize="characters" />
          </div>
          <div class="field field--full">
            <label for="dock-image">Image URL</label>
            <input id="dock-image" v-model="form.imageUrl" type="url" maxlength="1000" />
          </div>
        </div>
      </div>
      <footer class="modal__footer">
        <button class="button button--secondary" type="button" @click="emit('close')">Cancel</button>
        <button class="button" type="submit" :disabled="saving || !vessels.length || !form.dockNo.trim() || !form.description.trim()">{{ saving ? 'Saving…' : 'Save Dry Dock' }}</button>
      </footer>
    </form>
  </ModalDialog>
</template>
