<script setup>
import { computed, onMounted, ref, watch } from "vue";
import RecordFormModal from "./RecordFormModal.vue";
import { listShipyards } from "../services/masterData.js";
import { listRfqs } from "../services/sourcing.js";
import { formatCostAmount } from "../services/costSummary.js";
import { createPurchaseOrder, deletePurchaseOrder, listPurchaseOrders, updatePurchaseOrder } from "../services/purchaseOrders.js";

const props = defineProps({ dryDockId: { type: [Number, String], required: true }, currency: { type: String, default: "USD" }, accountCodes: { type: Array, default: () => [] } });
const orders = ref([]);
const shipyards = ref([]);
const rfqs = ref([]);
const loading = ref(true);
const saving = ref(false);
const error = ref(null);
const notice = ref("");
const open = ref(false);
const editing = ref(null);

const fields = computed(() => [
  { name: "poNo", label: "Purchase Order Number", required: true, maxlength: 100 },
  { name: "poDate", label: "PO Date", type: "date" },
  { name: "shipyardId", label: "Shipyard", type: "select", numeric: true, required: true, options: shipyards.value.map(({ id, name }) => ({ value: id, label: name })) },
  { name: "rfqId", label: "Source RFQ", type: "select", numeric: true, options: rfqs.value.map(({ id, rfqNo }) => ({ value: id, label: rfqNo })) },
  { name: "expenseCategory", label: "Expense Category", maxlength: 100 },
  { name: "currency", label: "Currency", required: true, maxlength: 3, default: props.currency },
  { name: "totalCost", label: "Total Cost", type: "number" },
  { name: "totalCostUsd", label: "Total Cost (USD)", type: "number" },
  { name: "accountCodeId", label: "Account Code", type: "select", numeric: true, options: props.accountCodes.map(({ id, code, description }) => ({ value: id, label: description ? `${code} — ${description}` : code })) },
  { name: "supplyPort", label: "Supply Port", maxlength: 200 },
  { name: "deliveryDate", label: "Delivery Date", type: "date" },
  { name: "status", label: "Status", maxlength: 30 },
  { name: "comments", label: "Comments", type: "textarea", full: true }
]);
const categories = computed(() => {
  const groups = new Map();
  for (const order of orders.value) {
    const name = order.expenseCategory || "Uncategorized";
    if (!groups.has(name)) groups.set(name, []);
    groups.get(name).push(order);
  }
  return [...groups].map(([name, rows]) => ({ name, orders: rows }));
});

async function load() {
  loading.value = true; error.value = null;
  try { [orders.value, shipyards.value, rfqs.value] = await Promise.all([listPurchaseOrders(props.dryDockId), listShipyards(), listRfqs(props.dryDockId)]); }
  catch (caught) { error.value = caught; }
  finally { loading.value = false; }
}
function startAdd() { editing.value = null; error.value = null; open.value = true; }
function startEdit(order) { editing.value = order; error.value = null; open.value = true; }
async function submit(values) {
  saving.value = true; error.value = null;
  try {
    if (editing.value) await updatePurchaseOrder(editing.value.id, values);
    else await createPurchaseOrder(props.dryDockId, values);
    orders.value = await listPurchaseOrders(props.dryDockId);
    notice.value = editing.value ? "Purchase Order updated." : "Purchase Order added.";
    open.value = false;
  } catch (caught) { error.value = caught; }
  finally { saving.value = false; }
}
async function remove(order) {
  if (!window.confirm(`Delete Purchase Order “${order.poNo}”?`)) return;
  try { await deletePurchaseOrder(order.id); orders.value = await listPurchaseOrders(props.dryDockId); notice.value = "Purchase Order deleted."; }
  catch (caught) { error.value = caught; }
}
function money(value, currency) { return value == null ? "—" : formatCostAmount(value, currency); }
onMounted(load);
watch(() => props.dryDockId, () => { open.value = false; load(); });
</script>

<template>
  <div>
    <p v-if="error" class="notice notice--error" role="alert">{{ error.message }}</p>
    <p v-if="notice" class="notice notice--success" role="status">{{ notice }}</p>
    <div class="section-heading"><div><h2>Purchase Orders</h2><p>Manage supplier orders by expense category.</p></div><button class="button" type="button" @click="startAdd">＋ Add Purchase Order</button></div>
    <div v-if="loading" class="loading-line" role="status">Loading Purchase Orders…</div>
    <div v-else-if="!orders.length" class="empty-state"><h3>No Purchase Orders</h3><p>Add supplier commitments for this Dry Dock.</p><button class="button" type="button" @click="startAdd">Add Purchase Order</button></div>
    <div v-else class="cost-groups">
      <section v-for="group in categories" :key="group.name" class="cost-group">
        <h3>{{ group.name }} <span class="record-count">{{ group.orders.length }}</span></h3>
        <div class="table-wrap"><table class="data-table"><thead><tr><th>PO Number</th><th>Shipyard</th><th>PO Date</th><th>Currency</th><th>Total</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody><tr v-for="order in group.orders" :key="order.id"><td><span class="table-primary">{{ order.poNo }}</span><span v-if="order.rfqId" class="table-secondary">{{ rfqs.find((rfq) => rfq.id === order.rfqId)?.rfqNo || 'RFQ' }}</span></td><td>{{ order.shipyardName }}</td><td>{{ order.poDate || '—' }}</td><td>{{ order.currency }}</td><td>{{ money(order.totalCost, order.currency) }}</td><td>{{ order.status || '—' }}</td><td><div class="row-actions"><button class="button button--secondary button--small" type="button" @click="startEdit(order)">Edit</button><button class="button button--danger button--small" type="button" @click="remove(order)">Delete</button></div></td></tr></tbody>
        </table></div>
      </section>
    </div>
    <RecordFormModal :open="open" :title="editing ? 'Edit Purchase Order' : 'Add Purchase Order'" :fields="fields" :initial-values="editing" :saving="saving" :error="error" @close="open = false" @submit="submit" />
  </div>
</template>
