<script setup>
import { reactive, watch } from "vue";
import FormErrors from "./FormErrors.vue";
import ModalDialog from "./ModalDialog.vue";

const props = defineProps({
  open: Boolean, title: { type: String, required: true }, fields: { type: Array, required: true },
  initialValues: { type: Object, default: null }, saving: Boolean, error: { type: Object, default: null }
});
const emit = defineEmits(["close", "submit"]);
const form = reactive({});

watch(() => [props.open, props.initialValues, props.fields], ([open]) => {
  if (!open) return;
  for (const field of props.fields) {
    const value = props.initialValues?.[field.name] ?? field.default ?? "";
    form[field.name] = value === "" || value == null ? ""
      : field.type === "date" ? String(value).slice(0, 10)
        : field.type === "number" || field.type === "select" ? String(value) : value;
  }
}, { immediate: true });

function submit() {
  const values = {};
  for (const field of props.fields) {
    const value = form[field.name];
    values[field.name] = field.type === "number" ? (value === "" ? null : Number(value))
      : field.numeric ? (value === "" ? null : Number(value))
        : typeof value === "string" ? value.trim() || null : value;
  }
  emit("submit", values);
}
</script>

<template>
  <ModalDialog :open="open" :title="title" @close="emit('close')">
    <form @submit.prevent="submit">
      <div class="modal__body">
        <FormErrors :error="error" />
        <div class="form-grid">
          <div v-for="field in fields" :key="field.name" class="field" :class="{ 'field--full': field.full }">
            <label :for="`record-${field.name}`">{{ field.label }}<span v-if="field.required" aria-hidden="true"> *</span></label>
            <textarea v-if="field.type === 'textarea'" :id="`record-${field.name}`" v-model="form[field.name]" :required="field.required" :maxlength="field.maxlength" :rows="field.rows || 3" />
            <select v-else-if="field.type === 'select'" :id="`record-${field.name}`" v-model="form[field.name]" :required="field.required">
              <option value="">{{ field.placeholder || 'Select…' }}</option>
              <option v-for="option in field.options || []" :key="option.value" :value="String(option.value)">{{ option.label }}</option>
            </select>
            <input v-else :id="`record-${field.name}`" v-model="form[field.name]" :type="field.type || 'text'" :required="field.required" :maxlength="field.maxlength" :min="field.type === 'number' ? 0 : undefined" :step="field.type === 'number' ? (field.step || '0.01') : undefined" />
          </div>
        </div>
      </div>
      <footer class="modal__footer"><button class="button button--secondary" type="button" @click="emit('close')">Cancel</button><button class="button" type="submit" :disabled="saving">{{ saving ? 'Saving…' : 'Save' }}</button></footer>
    </form>
  </ModalDialog>
</template>
