<script setup>
import { reactive, watch } from "vue";
import FormErrors from "./FormErrors.vue";
import ModalDialog from "./ModalDialog.vue";

const props = defineProps({
  open: Boolean,
  initialValues: { type: Object, default: null },
  reportType: { type: String, default: "Daily" },
  saving: Boolean,
  error: { type: Object, default: null }
});
const emit = defineEmits(["close", "submit"]);
const form = reactive({ title: "", reportDate: "", reportType: "Daily", lastUpdatedBy: "", updatedText: "", extraNote: "", action: "" });

watch(() => [props.open, props.initialValues, props.reportType], ([open]) => {
  if (!open) return;
  const initial = props.initialValues ?? {};
  Object.assign(form, {
    title: initial.title ?? "", reportDate: initial.reportDate ?? new Date().toISOString().slice(0, 10),
    reportType: initial.reportType ?? props.reportType, lastUpdatedBy: initial.lastUpdatedBy ?? "",
    updatedText: initial.updatedText ?? "", extraNote: initial.extraNote ?? "", action: initial.action ?? ""
  });
}, { immediate: true });

function submit() {
  emit("submit", {
    title: form.title.trim(), reportDate: form.reportDate, reportType: form.reportType,
    lastUpdatedBy: form.lastUpdatedBy.trim() || null, updatedText: form.updatedText.trim() || null,
    extraNote: form.extraNote.trim() || null, action: form.action.trim() || null
  });
}
</script>

<template>
  <ModalDialog :open="open" :title="initialValues ? 'Edit Report' : reportType === 'Completion' ? 'Add Completion Report' : 'Add Daily Report'" @close="emit('close')">
    <form @submit.prevent="submit">
      <div class="modal__body">
        <FormErrors :error="error" />
        <div class="form-grid">
          <div class="field field--full"><label for="report-title">Title <span aria-hidden="true">*</span></label><input id="report-title" v-model="form.title" required maxlength="255" /></div>
          <div class="field"><label for="report-date">Report Date <span aria-hidden="true">*</span></label><input id="report-date" v-model="form.reportDate" type="date" required /></div>
          <div class="field"><label for="report-type">Report Type</label><select id="report-type" v-model="form.reportType"><option>Daily</option><option>Completion</option></select></div>
          <div class="field"><label for="report-user">Last Updated By</label><input id="report-user" v-model="form.lastUpdatedBy" maxlength="200" /></div>
          <div class="field"><label for="report-action">Action</label><input id="report-action" v-model="form.action" maxlength="255" /></div>
          <div class="field field--full"><label for="report-updated">Updated</label><textarea id="report-updated" v-model="form.updatedText" maxlength="5000" rows="3"></textarea></div>
          <div class="field field--full"><label for="report-extra-note">Extra Note</label><textarea id="report-extra-note" v-model="form.extraNote" maxlength="5000" rows="2"></textarea></div>
        </div>
      </div>
      <footer class="modal__footer">
        <button class="button button--secondary" type="button" @click="emit('close')">Cancel</button>
        <button class="button" type="submit" :disabled="saving || !form.title.trim() || !form.reportDate">{{ saving ? 'Saving…' : 'Save Report' }}</button>
      </footer>
    </form>
  </ModalDialog>
</template>
