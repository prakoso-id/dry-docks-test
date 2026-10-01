<script setup>
import { reactive, watch } from "vue";
import FormErrors from "./FormErrors.vue";
import ModalDialog from "./ModalDialog.vue";

const props = defineProps({ open: Boolean, saving: Boolean, error: { type: Object, default: null } });
const emit = defineEmits(["close", "submit"]);
const form = reactive({ name: "" });

watch(() => props.open, (open) => { if (open) form.name = ""; });

function submit() {
  if (form.name.trim()) emit("submit", { name: form.name.trim() });
}
</script>

<template>
  <ModalDialog :open="open" title="Add Vessel" @close="emit('close')">
    <form @submit.prevent="submit">
      <div class="modal__body">
        <FormErrors :error="error" />
        <div class="field">
          <label for="vessel-name">Vessel name <span aria-hidden="true">*</span></label>
          <input id="vessel-name" v-model="form.name" maxlength="200" required autofocus autocomplete="off" />
        </div>
      </div>
      <footer class="modal__footer">
        <button class="button button--secondary" type="button" @click="emit('close')">Cancel</button>
        <button class="button" type="submit" :disabled="saving || !form.name.trim()">{{ saving ? "Saving…" : "Save Vessel" }}</button>
      </footer>
    </form>
  </ModalDialog>
</template>
