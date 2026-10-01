<script setup>
import { computed, ref } from "vue";
import CostForm from "./CostForm.vue";
import CostSummary from "./CostSummary.vue";
import { createCost, copyYardEstimatesToActual, deleteCost, updateCost } from "../services/costs.js";
import { formatCostAmount } from "../services/costSummary.js";

const props = defineProps({
  dryDockId: { type: [String, Number], required: true }, currency: { type: String, default: "USD" },
  specificationGroups: { type: Array, default: () => [] }, workOrders: { type: Array, default: () => [] },
  summary: { type: Object, default: null }, costs: { type: Array, default: () => [] }, loading: { type: Boolean, default: false }
});
const emit = defineEmits(["changed"]);
const saving = ref(false);
const notice = ref("");
const error = ref(null);
const formOpen = ref(false);
const editing = ref(null);

const money = (value) => formatCostAmount(value ?? "0.00", props.currency);
const costSummary = computed(() => props.summary ? { ...props.summary, budget: props.summary.costBudget ?? "0.00" } : null);

function add() {
  editing.value = null;
  error.value = null;
  formOpen.value = true;
}

function edit(cost) {
  editing.value = cost;
  error.value = null;
  formOpen.value = true;
}

async function save(values) {
  saving.value = true;
  error.value = null;
  try {
    if (editing.value) await updateCost(editing.value.id, values);
    else await createCost(props.dryDockId, values);
    formOpen.value = false;
    notice.value = editing.value ? "Cost updated." : "Cost added.";
    emit("changed");
  } catch (cause) { error.value = cause; }
  finally { saving.value = false; }
}

async function copyEstimates() {
  error.value = null;
  try {
    const result = await copyYardEstimatesToActual(props.dryDockId);
    notice.value = `Prepared ${result.updatedCount} Cost item${result.updatedCount === 1 ? "" : "s"} from Work Orders.`;
    emit("changed");
  } catch (cause) { error.value = cause; }
}

async function remove(cost) {
  if (!window.confirm(`Delete Cost “${cost.jobName}”?`)) return;
  error.value = null;
  try {
    await deleteCost(cost.id);
    notice.value = "Cost deleted.";
    emit("changed");
  } catch (cause) { error.value = cause; }
}

</script>

<template>
  <section class="costs-section">
    <div class="section-heading">
      <div><h2>Costs</h2><p>Estimates and actuals for this Dry Dock.</p></div>
      <div class="heading-actions">
        <button class="button button--secondary" type="button" :disabled="loading || !workOrders.length" @click="copyEstimates">Copy Yard Estimates to Actual</button>
        <button class="button" type="button" @click="add">＋ Add Cost</button>
      </div>
    </div>
    <p v-if="notice" class="notice" role="status">{{ notice }}</p>
    <p v-if="error" class="notice notice--error" role="alert">{{ error.message || 'The request could not be completed.' }}</p>
    <CostSummary :summary="costSummary" :work-orders="workOrders" :costs="costs" :currency="currency" />
    <div v-if="loading" class="loading-line" role="status">Loading costs…</div>
    <div v-else-if="!costs.length" class="empty-state"><h3>No Costs yet</h3><p>Add a cost item to include it in the summary.</p><button class="button" type="button" @click="add">Add Cost</button></div>
    <div v-else class="table-wrap">
      <table class="data-table">
        <thead><tr><th>Job</th><th>Specification Group</th><th>Status</th><th>Budget</th><th>Total Estimates</th><th>Actual Yard Costs</th><th>Actual Owner Costs</th><th>Total Costs</th><th>Variance</th><th>Actions</th></tr></thead>
        <tbody>
          <tr v-for="cost in costs" :key="cost.id">
            <td><span class="table-primary">{{ cost.jobName }}</span><span class="table-secondary">{{ cost.jobCode || 'No job code' }}</span></td>
            <td>{{ cost.specificationGroupName || '—' }}</td><td>{{ cost.status || '—' }}</td><td>{{ money(cost.totalBudget) }}</td>
            <td>{{ money(cost.totalEstimates) }}</td><td>{{ money(cost.actualYardCost) }}</td><td>{{ money(cost.actualOwnerCost) }}</td><td>{{ money(cost.totalCosts) }}</td><td>{{ money(cost.variance) }}</td>
            <td><div class="row-actions"><button class="button button--secondary button--small" type="button" @click="edit(cost)">Edit</button><button class="button button--danger button--small" type="button" @click="remove(cost)">Delete</button></div></td>
          </tr>
        </tbody>
      </table>
    </div>
    <CostForm :open="formOpen" :initial-values="editing" :specification-groups="specificationGroups" :currency="currency" :saving="saving" :error="error" @close="formOpen = false" @submit="save" />
  </section>
</template>
