<script setup>
import { computed, reactive, watch } from "vue";
import FormErrors from "./FormErrors.vue";
import ModalDialog from "./ModalDialog.vue";

const props = defineProps({ open: Boolean, workOrder: { type: Object, default: null }, saving: Boolean, error: { type: Object, default: null } });
const emit = defineEmits(["close", "submit"]);
const form = reactive({ progress: "", actionType: "", description: "", actualYardCost: "", actualOwnerCost: "" });
const title = computed(() => props.workOrder ? `Add Update · ${props.workOrder.jobName}` : "Add Work Order Update");

watch(() => props.open, (open) => {
  if (open) Object.assign(form, { progress: "", actionType: "", description: "", actualYardCost: "", actualOwnerCost: "" });
});

function submit() {
  if (!form.actionType.trim() && !form.description.trim() && form.progress === "" && form.actualYardCost === "" && form.actualOwnerCost === "") return;
  emit("submit", {
    progress: form.progress === "" ? null : Number(form.progress),
    actionType: form.actionType.trim() || null,
    description: form.description.trim() || null,
    actualYardCost: form.actualYardCost === "" ? null : Number(form.actualYardCost),
    actualOwnerCost: form.actualOwnerCost === "" ? null : Number(form.actualOwnerCost)
  });
}
</script>

<template>
  <ModalDialog :open="open" :title="title" @close="emit('close')">
    <form @submit.prevent="submit">
      <div class="modal__body">
        <FormErrors :error="error" />
        <div class="form-grid">
          <div class="field"><label for="update-progress">Progress (%)</label><input id="update-progress" v-model="form.progress" type="number" min="0" max="100" step="0.01" /></div>
          <div class="field"><label for="update-action">Action Type</label><input id="update-action" v-model="form.actionType" maxlength="100" placeholder="Inspection, repair…" /></div>
          <div class="field field--full"><label for="update-description">Update Description</label><textarea id="update-description" v-model="form.description" maxlength="5000" rows="3"></textarea></div>
          <div class="field"><label for="update-yard-cost">Actual Yard Cost</label><input id="update-yard-cost" v-model="form.actualYardCost" type="number" min="0" step="0.01" /></div>
          <div class="field"><label for="update-owner-cost">Actual Owner Cost</label><input id="update-owner-cost" v-model="form.actualOwnerCost" type="number" min="0" step="0.01" /></div>
        </div>
      </div>
      <footer class="modal__footer">
        <button class="button button--secondary" type="button" @click="emit('close')">Cancel</button>
        <button class="button" type="submit" :disabled="saving || (!form.actionType.trim() && !form.description.trim() && form.progress === '' && form.actualYardCost === '' && form.actualOwnerCost === '')">{{ saving ? 'Saving…' : 'Save Update' }}</button>
      </footer>
    </form>
  </ModalDialog>
</template>
