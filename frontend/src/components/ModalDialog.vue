<script setup>
import { nextTick, ref, watch } from "vue";

const props = defineProps({ open: Boolean, title: { type: String, required: true } });
const emit = defineEmits(["close"]);
const dialog = ref(null);
const titleId = `modal-title-${Math.random().toString(36).slice(2)}`;

watch(() => props.open, async (open) => {
  await nextTick();
  if (!dialog.value) return;
  if (open && !dialog.value.open) dialog.value.showModal();
  if (!open && dialog.value.open) dialog.value.close();
}, { immediate: true });

function close() {
  emit("close");
}
</script>

<template>
  <dialog ref="dialog" class="modal" :aria-labelledby="titleId" @cancel.prevent="close" @click.self="close">
    <div class="modal__panel">
      <header class="modal__header">
        <h2 :id="titleId">{{ title }}</h2>
        <button class="icon-button" type="button" :aria-label="`Close ${title}`" @click="close">×</button>
      </header>
      <slot />
    </div>
  </dialog>
</template>
