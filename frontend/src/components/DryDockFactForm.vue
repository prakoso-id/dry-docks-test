<script setup>
import { reactive, watch } from "vue";
import FormErrors from "./FormErrors.vue";
import ModalDialog from "./ModalDialog.vue";

const props = defineProps({ open: Boolean, saving: Boolean, error: { type: Object, default: null } });
const emit = defineEmits(["close", "submit"]);
const activities = [
  "Arriving Dock", "Bow Entering Dry Dock", "Gate Closed Floating Dock", "Commenced Emptying Dock",
  "Vessel on Blocks", "Dry Dock", "Commenced Flooding Dock", "Gate Opened Floating Dock",
  "Dock Master Onboard", "Undocking/Vessel Out of Dock", "Leaving Yard", "Along Side Pier From", "Along Side Pier To"
];
const form = reactive({ activity: "", factDate: "", factTime: "" });

watch(() => props.open, (open) => { if (open) Object.assign(form, { activity: "", factDate: "", factTime: "" }); });

function submit() {
  if (form.activity) emit("submit", { activity: form.activity, factDate: form.factDate || null, factTime: form.factTime || null });
}
</script>

<template>
  <ModalDialog :open="open" title="Add Dry Dock Fact" @close="emit('close')">
    <form @submit.prevent="submit">
      <div class="modal__body">
        <FormErrors :error="error" />
        <div class="form-grid">
          <div class="field field--full">
            <label for="fact-activity">Activity <span aria-hidden="true">*</span></label>
            <select id="fact-activity" v-model="form.activity" required><option value="" disabled>Select an activity</option><option v-for="activity in activities" :key="activity">{{ activity }}</option></select>
          </div>
          <div class="field"><label for="fact-date">Date</label><input id="fact-date" v-model="form.factDate" type="date" /></div>
          <div class="field"><label for="fact-time">Time</label><input id="fact-time" v-model="form.factTime" type="time" /></div>
        </div>
        <p class="field-help">The same activity can be recorded more than once.</p>
      </div>
      <footer class="modal__footer">
        <button class="button button--secondary" type="button" @click="emit('close')">Cancel</button>
        <button class="button" type="submit" :disabled="saving || !form.activity">{{ saving ? 'Saving…' : 'Save Fact' }}</button>
      </footer>
    </form>
  </ModalDialog>
</template>
