<script setup>
import { computed, onMounted, ref, watch } from "vue";
import RecordFormModal from "./RecordFormModal.vue";
import { createShipyard, listShipyards } from "../services/masterData.js";
import { formatCostAmount } from "../services/costSummary.js";
import {
  compareQuotes, createInvitation, createQuotation, createRfq, deleteInvitation, deleteQuotation,
  deleteRfq, listInvitations, listQuotations, listRfqs, updateInvitation, updateQuotation, updateRfq
} from "../services/sourcing.js";

const props = defineProps({ dryDockId: { type: [Number, String], required: true }, currency: { type: String, default: "USD" }, accountCodes: { type: Array, default: () => [] } });
const rfqs = ref([]);
const shipyards = ref([]);
const invitationGroups = ref({});
const expandedRfqId = ref(null);
const comparison = ref(null);
const comparisonRfqId = ref(null);
const loading = ref(true);
const saving = ref(false);
const error = ref(null);
const notice = ref("");
const modalKind = ref("");
const editing = ref(null);
const currentRfq = ref(null);
const currentInvitation = ref(null);

const shipyardOptions = computed(() => shipyards.value.map(({ id, name }) => ({ value: id, label: name })));
const rfqFields = computed(() => [
  { name: "rfqNo", label: "RFQ Number", required: true, maxlength: 100 },
  { name: "requestDate", label: "Request Date", type: "date" },
  { name: "expiryDate", label: "Expiry Date", type: "date" },
  { name: "status", label: "Status", maxlength: 30 },
  { name: "subject", label: "Subject", maxlength: 255 },
  { name: "requisitionType", label: "Requisition Type", maxlength: 100 },
  { name: "requisitionDate", label: "Requisition Date", type: "date" },
  { name: "requisitionNature", label: "Requisition Nature", maxlength: 100 },
  { name: "voyageNumber", label: "Voyage Number", maxlength: 100 },
  { name: "accountCodeId", label: "Account Code", type: "select", numeric: true, options: accountOptions.value },
  { name: "supplyPort", label: "Supply Port", maxlength: 200 },
  { name: "supplyDate", label: "Supply Date", type: "date" },
  { name: "comments", label: "Comments", type: "textarea", full: true }
]);
const invitationFields = computed(() => [
  { name: "shipyardId", label: "Shipyard", type: "select", numeric: true, required: true, options: shipyardOptions.value },
  { name: "status", label: "Status", default: "NOT SENT", maxlength: 30 }
]);
const quotationFields = computed(() => [
  { name: "quoteNo", label: "Quotation Number", maxlength: 100 },
  { name: "quoteDate", label: "Quotation Date", type: "date" },
  { name: "currency", label: "Currency", required: true, maxlength: 3, default: props.currency },
  { name: "totalCost", label: "Total Cost", type: "number" },
  { name: "tax", label: "Tax", type: "number" },
  { name: "terms", label: "Terms", type: "textarea", full: true },
  { name: "comments", label: "Comments", type: "textarea", full: true }
]);
const shipyardFields = [
  { name: "name", label: "Shipyard Name", required: true, maxlength: 200 },
  { name: "contactPerson", label: "Contact Person", maxlength: 200 },
  { name: "email", label: "Email", type: "email", maxlength: 254 },
  { name: "phone", label: "Phone", maxlength: 50 },
  { name: "city", label: "City", maxlength: 100 },
  { name: "country", label: "Country", maxlength: 100 },
  { name: "address", label: "Address", type: "textarea", full: true, maxlength: 500 }
];
const fields = computed(() => modalKind.value === "rfq" ? rfqFields.value : modalKind.value === "invitation" ? invitationFields.value : modalKind.value === "quotation" ? quotationFields.value : shipyardFields);
const modalTitle = computed(() => ({ rfq: editing.value ? "Edit RFQ" : "Add RFQ", invitation: "Invite Shipyard", quotation: editing.value ? "Edit Quotation" : "Add Quotation", shipyard: "Add Shipyard" })[modalKind.value] || "");

const accountOptions = computed(() => props.accountCodes.map(({ id, code, description }) => ({ value: id, label: description ? `${code} — ${description}` : code })));

async function load() {
  loading.value = true; error.value = null;
  try { [rfqs.value, shipyards.value] = await Promise.all([listRfqs(props.dryDockId), listShipyards()]); }
  catch (caught) { error.value = caught; }
  finally { loading.value = false; }
}

async function expand(rfq) {
  if (expandedRfqId.value === rfq.id) { expandedRfqId.value = null; comparison.value = null; return; }
  expandedRfqId.value = rfq.id; error.value = null; comparison.value = null;
  try {
    const rows = await listInvitations(rfq.id);
    const invitations = await Promise.all(rows.map(async (invitation) => ({ ...invitation, quotations: await listQuotations(invitation.id) })));
    invitationGroups.value = { ...invitationGroups.value, [rfq.id]: invitations };
  } catch (caught) { error.value = caught; }
}

function openForm(kind, record = null, rfq = null, invitation = null) {
  modalKind.value = kind; editing.value = record; currentRfq.value = rfq; currentInvitation.value = invitation; error.value = null;
}
function closeForm() { modalKind.value = ""; editing.value = null; }

async function refreshExpanded() {
  const rfq = rfqs.value.find((row) => row.id === expandedRfqId.value);
  if (rfq) {
    const rows = await listInvitations(rfq.id);
    const invitations = await Promise.all(rows.map(async (invitation) => ({ ...invitation, quotations: await listQuotations(invitation.id) })));
    invitationGroups.value = { ...invitationGroups.value, [rfq.id]: invitations };
    if (comparisonRfqId.value === rfq.id && comparison.value) comparison.value = await compareQuotes(props.dryDockId, rfq.id);
  }
}

async function submit(values) {
  saving.value = true; error.value = null;
  try {
    if (modalKind.value === "rfq") {
      if (editing.value) await updateRfq(editing.value.id, values); else await createRfq(props.dryDockId, values);
      rfqs.value = await listRfqs(props.dryDockId);
    } else if (modalKind.value === "invitation") {
      await createInvitation(currentRfq.value.id, values); await refreshExpanded();
    } else if (modalKind.value === "quotation") {
      if (editing.value) await updateQuotation(editing.value.id, values); else await createQuotation(currentInvitation.value.id, values);
      await refreshExpanded();
    } else {
      await createShipyard(values); shipyards.value = await listShipyards();
    }
    notice.value = `${modalTitle.value.replace(/^(Add|Edit) /, "")} saved.`; closeForm();
  } catch (caught) { error.value = caught; }
  finally { saving.value = false; }
}

async function remove(kind, record) {
  if (!window.confirm(`Delete ${kind} “${record.rfqNo || record.quoteNo || record.shipyardName || "record"}”?`)) return;
  error.value = null;
  try {
    if (kind === "RFQ") { await deleteRfq(record.id); rfqs.value = await listRfqs(props.dryDockId); expandedRfqId.value = null; }
    else if (kind === "invitation") { await deleteInvitation(record.id); await refreshExpanded(); }
    else { await deleteQuotation(record.id); await refreshExpanded(); }
    notice.value = `${kind} deleted.`;
  } catch (caught) { error.value = caught; }
}

async function markInvitation(invitation) {
  try { await updateInvitation(invitation.id, { status: invitation.status === "SENT" ? "RESPONDED" : "SENT" }); await refreshExpanded(); }
  catch (caught) { error.value = caught; }
}

async function showComparison(rfq) {
  comparisonRfqId.value = rfq.id; error.value = null;
  try { comparison.value = await compareQuotes(props.dryDockId, rfq.id); }
  catch (caught) { error.value = caught; }
}

function money(value, currency) { return value == null ? "—" : formatCostAmount(value, currency); }
onMounted(load);
watch(() => props.dryDockId, () => { invitationGroups.value = {}; expandedRfqId.value = null; load(); });
</script>

<template>
  <div>
    <p v-if="error" class="notice notice--error" role="alert">{{ error.message }}</p>
    <p v-if="notice" class="notice notice--success" role="status">{{ notice }}</p>
    <div class="section-heading"><div><h2>Sourcing</h2><p>Manage requests for quotation, shipyard invitations, and supplier quotations.</p></div><div class="heading-actions"><button class="button button--secondary" type="button" @click="openForm('shipyard')">＋ Add Shipyard</button><button class="button" type="button" @click="openForm('rfq')">＋ Add RFQ</button></div></div>
    <div v-if="loading" class="loading-line" role="status">Loading sourcing records…</div>
    <div v-else-if="!rfqs.length" class="empty-state"><h3>No RFQs yet</h3><p>Create an RFQ, invite shipyards, and compare quotations.</p><button class="button" type="button" @click="openForm('rfq')">Add RFQ</button></div>
    <div v-else class="cards">
      <article v-for="rfq in rfqs" :key="rfq.id" class="record-card">
        <div class="record-card__head"><div><span class="status-badge">{{ rfq.status || 'RFQ' }}</span><h3>{{ rfq.rfqNo }}<span v-if="rfq.subject"> · {{ rfq.subject }}</span></h3><p>{{ rfq.requisitionType || 'Requisition' }}<span v-if="rfq.requisitionNature"> · {{ rfq.requisitionNature }}</span><span v-if="rfq.voyageNumber"> · Voyage {{ rfq.voyageNumber }}</span></p></div><div class="row-actions"><button class="button button--secondary button--small" type="button" @click="openForm('rfq', rfq)">Edit</button><button class="button button--danger button--small" type="button" @click="remove('RFQ', rfq)">Delete</button><button class="button button--small" type="button" @click="expand(rfq)">{{ expandedRfqId === rfq.id ? 'Hide details' : 'Open' }}</button></div></div>
        <div class="record-meta"><span>Request {{ rfq.requestDate || '—' }}</span><span>Expires {{ rfq.expiryDate || '—' }}</span><span>Supply {{ rfq.supplyPort || '—' }} · {{ rfq.supplyDate || '—' }}</span></div>
        <div v-if="expandedRfqId === rfq.id" class="sourcing-details">
          <div class="section-heading"><div><h3>Shipyard Invitations</h3><p>Invite suppliers to submit a quotation for {{ rfq.rfqNo }}.</p></div><div class="heading-actions"><button class="button button--secondary button--small" type="button" @click="showComparison(rfq)">Compare quotations</button><button class="button button--small" type="button" :disabled="!shipyards.length" @click="openForm('invitation', null, rfq)">＋ Invite Shipyard</button></div></div>
          <p v-if="!shipyards.length" class="notice">Add a shipyard before creating an invitation.</p>
          <div v-if="!invitationGroups[rfq.id]?.length" class="empty-state empty-state--compact"><p>No shipyards invited yet.</p></div>
          <article v-for="invitation in invitationGroups[rfq.id] || []" :key="invitation.id" class="record-card record-card--nested">
            <div class="record-card__head"><div><h4>{{ invitation.shipyardName }}</h4><p>Invitation status: {{ invitation.status || 'NOT SENT' }}</p></div><div class="row-actions"><button class="button button--secondary button--small" type="button" @click="markInvitation(invitation)">{{ invitation.status === 'SENT' ? 'Mark Responded' : 'Mark Sent' }}</button><button class="button button--small" type="button" @click="openForm('quotation', null, rfq, invitation)">＋ Add Quotation</button><button class="button button--danger button--small" type="button" @click="remove('invitation', invitation)">Delete</button></div></div>
            <div v-if="!invitation.quotations.length" class="record-meta">No quotation submitted.</div>
            <div v-for="quote in invitation.quotations" :key="quote.id" class="record-meta sourcing-quote"><strong>{{ quote.quoteNo || 'Quotation' }}</strong><span>{{ quote.quoteDate || '—' }}</span><strong>{{ money(quote.totalCost, quote.currency) }}</strong><span>{{ quote.terms || 'No terms' }}</span><span class="row-actions"><button class="button button--secondary button--small" type="button" @click="openForm('quotation', quote, rfq, invitation)">Edit</button><button class="button button--danger button--small" type="button" @click="remove('quotation', quote)">Delete</button></span></div>
          </article>
          <section v-if="comparisonRfqId === rfq.id && comparison" class="comparison-block"><h3>Quotation Comparison</h3><p v-if="!comparison.currencies.length" class="record-meta">No quotations available for comparison.</p><div v-for="group in comparison.currencies" :key="group.currency" class="table-wrap"><h4>{{ group.currency }}</h4><table class="data-table"><thead><tr><th>Shipyard</th><th>Quotation</th><th>Total</th></tr></thead><tbody><tr v-for="quote in group.quotes" :key="quote.id"><td>{{ quote.shipyardName }}</td><td>{{ quote.quoteNo || '—' }}</td><td>{{ money(quote.totalCost, group.currency) }}</td></tr></tbody></table></div></section>
        </div>
      </article>
    </div>
    <RecordFormModal :open="!!modalKind" :title="modalTitle" :fields="fields" :initial-values="editing" :saving="saving" :error="error" @close="closeForm" @submit="submit" />
  </div>
</template>
