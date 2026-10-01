<script setup>
defineProps({ error: { type: Object, default: null } });
</script>

<template>
  <div v-if="error" class="form-error" role="alert">
    <strong>{{ error.message }}</strong>
    <ul v-if="error.details?.length">
      <li v-for="(detail, index) in error.details" :key="`${detail.field}-${index}`">
        <span v-if="detail.field">{{ detail.field }}: </span>{{ detail.message }}
      </li>
    </ul>
  </div>
</template>
