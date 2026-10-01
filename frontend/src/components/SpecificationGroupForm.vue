<script setup>
import { reactive, watch } from "vue";
import FormErrors from "./FormErrors.vue";
import ModalDialog from "./ModalDialog.vue";

const props = defineProps({ open: Boolean, vessel: { type: Object, default: null }, saving: Boolean, error: { type: Object, default: null } });
const emit = defineEmits(["close", "submit"]);
const form = reactive({ groupNo: "", name: "" });

watch(() => props.open, (open) => { if (open) Object.assign(form, { groupNo: "", name: "" }); });

function submit() {
  if (props.vessel && form.groupNo.trim() && form.name.trim()) {
    emit("submit", { vesselId: Number(props.vessel.id), groupNo: form.groupNo.trim(), name: form.name.trim() });
  }
}
</script>

<template>
  <ModalDialog :open="open" title="Add Specification Group" @close="emit('close')">
    <form @submit.prevent="submit">
      <div class="modal__body">
        <FormErrors :error="error" />
        <div class="notice">This group will be added to {{ vessel?.name || 'the selected vessel' }}.</div>
        <div class="form-grid">
          <div class="field">
            <label for="group-number">Group No <span aria-hidden="true">*</span></label>
            <input id="group-number" v-model="form.groupNo" required maxlength="100" />
          </div>
          <div class="field">
            <label for="group-name">Group Name <span aria-hidden="true">*</span></label>
            <input id="group-name" v-model="form.name" required maxlength="255" />
          </div>
        </div>
      </div>
      <footer class="modal__footer">
        <button class="button button--secondary" type="button" @click="emit('close')">Cancel</button>
        <button class="button" type="submit" :disabled="saving || !form.groupNo.trim() || !form.name.trim()">{{ saving ? 'Saving…' : 'Save Group' }}</button>
      </footer>
    </form>
  </ModalDialog>
</template>
