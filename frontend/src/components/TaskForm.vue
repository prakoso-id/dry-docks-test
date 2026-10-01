<script setup>
import { reactive, watch } from "vue";
import FormErrors from "./FormErrors.vue";
import ModalDialog from "./ModalDialog.vue";

const props = defineProps({
  open: Boolean,
  initialValues: { type: Object, default: null },
  saving: Boolean,
  error: { type: Object, default: null }
});
const emit = defineEmits(["close", "submit"]);
const form = reactive({ title: "", description: "", responsibleRank: "", dueDate: "", status: "Open" });

function reset() {
  const initial = props.initialValues ?? {};
  Object.assign(form, {
    title: initial.title ?? "",
    description: initial.description ?? "",
    responsibleRank: initial.responsibleRank ?? "",
    dueDate: initial.dueDate ?? "",
    status: initial.status ?? "Open"
  });
}

watch(() => [props.open, props.initialValues], ([open]) => { if (open) reset(); }, { immediate: true });

function submit() {
  emit("submit", {
    title: form.title.trim(),
    description: form.description.trim() || null,
    responsibleRank: form.responsibleRank.trim() || null,
    dueDate: form.dueDate,
    status: form.status
  });
}
</script>

<template>
  <ModalDialog :open="open" :title="initialValues ? 'Edit Task' : 'Add Task'" @close="emit('close')">
    <form @submit.prevent="submit">
      <div class="modal__body">
        <FormErrors :error="error" />
        <div class="form-grid">
          <div class="field field--full">
            <label for="task-title">Title <span aria-hidden="true">*</span></label>
            <input id="task-title" v-model="form.title" required maxlength="255" />
          </div>
          <div class="field field--full">
            <label for="task-description">Description</label>
            <textarea id="task-description" v-model="form.description" maxlength="5000" rows="3"></textarea>
          </div>
          <div class="field">
            <label for="task-due-date">Due Date <span aria-hidden="true">*</span></label>
            <input id="task-due-date" v-model="form.dueDate" type="date" required />
          </div>
          <div class="field">
            <label for="task-status">Status</label>
            <select id="task-status" v-model="form.status"><option>Open</option><option>In Progress</option><option>Closed</option></select>
          </div>
          <div class="field">
            <label for="task-rank">Responsible Rank</label>
            <input id="task-rank" v-model="form.responsibleRank" maxlength="100" />
          </div>
        </div>
      </div>
      <footer class="modal__footer">
        <button class="button button--secondary" type="button" @click="emit('close')">Cancel</button>
        <button class="button" type="submit" :disabled="saving || !form.title.trim() || !form.dueDate">{{ saving ? 'Saving…' : 'Save Task' }}</button>
      </footer>
    </form>
  </ModalDialog>
</template>
