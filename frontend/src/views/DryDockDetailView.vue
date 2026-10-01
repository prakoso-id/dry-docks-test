<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { RouterLink } from "vue-router";
import DryDockFactForm from "../components/DryDockFactForm.vue";
import DryDockForm from "../components/DryDockForm.vue";
import CostSummary from "../components/CostSummary.vue";
import CostsSection from "../components/CostsSection.vue";
import DailyReportForm from "../components/DailyReportForm.vue";
import SourcingSection from "../components/SourcingSection.vue";
import PurchaseOrdersSection from "../components/PurchaseOrdersSection.vue";
import ExecutionUpdateForm from "../components/ExecutionUpdateForm.vue";
import SpecificationGroupForm from "../components/SpecificationGroupForm.vue";
import TaskForm from "../components/TaskForm.vue";
import WorkOrderForm from "../components/WorkOrderForm.vue";
import { dryDockTabs } from "./dryDockTabs.js";
import { getDryDock, updateDryDock } from "../services/dryDocks.js";
import { createReport, deleteReport as deleteReportRecord, listReports, updateReport } from "../services/reports.js";
import { getCostSummary } from "../services/costSummary.js";
import { listCosts } from "../services/costs.js";
import { listAccountCodes, listShipyards, listSpecificationGroups, listVessels, createSpecificationGroup } from "../services/masterData.js";
import {
  createDryDockFact, createTask, createWorkOrder, createWorkOrderUpdate,
    listDryDockFacts, listTasks, listWorkOrders, listWorkOrderUpdates,
    updateTask, updateWorkOrder, uploadWorkOrderImage
} from "../services/workItems.js";

const props = defineProps({ id: { type: String, required: true } });
const dock = ref(null);
const vessels = ref([]);
const shipyards = ref([]);
const accountCodes = ref([]);
const specificationGroups = ref([]);
const workOrders = ref([]);
const costSummary = ref(null);
const costRows = ref([]);
const costsLoading = ref(true);
const tasks = ref([]);
const facts = ref([]);
const reports = ref([]);
const updatesByOrder = ref({});
const activeTab = ref("General");
const loading = ref(true);
const loadingUpdates = ref(false);
const loadingReports = ref(false);
const saving = ref(false);
const pageError = ref(null);
const formError = ref(null);
const notice = ref("");

const dockFormOpen = ref(false);
const workOrderFormOpen = ref(false);
const taskFormOpen = ref(false);
const factFormOpen = ref(false);
const updateFormOpen = ref(false);
const reportFormOpen = ref(false);
const specificationGroupFormOpen = ref(false);
const editingTask = ref(null);
const editingWorkOrder = ref(null);
const updatingWorkOrder = ref(null);
const editingReport = ref(null);
const reportFormType = ref("Daily");

const tabs = dryDockTabs;
const totalWorkOrderUpdates = computed(() => Object.values(updatesByOrder.value).reduce((sum, rows) => sum + rows.length, 0));

async function load() {
  loading.value = true;
  costsLoading.value = true;
  pageError.value = null;
  try {
    const [currentDock, orders, dockTasks, dockFacts, vesselRows, yardRows, accountRows, summary, costRowsResult, reportRows] = await Promise.all([
      getDryDock(props.id), listWorkOrders(props.id), listTasks(props.id), listDryDockFacts(props.id),
      listVessels(), listShipyards(), listAccountCodes(), getCostSummary(props.id), listCosts(props.id), listReports(props.id)
    ]);
    dock.value = currentDock;
    workOrders.value = orders;
    costSummary.value = summary;
    costRows.value = costRowsResult;
    reports.value = reportRows;
    tasks.value = dockTasks;
    facts.value = dockFacts;
    vessels.value = vesselRows;
    shipyards.value = yardRows;
    accountCodes.value = accountRows;
    specificationGroups.value = await listSpecificationGroups(currentDock.vesselId);
  } catch (error) {
    pageError.value = error;
  } finally {
    loading.value = false;
    costsLoading.value = false;
  }
}

async function refreshWorkOrders() {
  const [orders, summary] = await Promise.all([listWorkOrders(props.id), getCostSummary(props.id)]);
  workOrders.value = orders;
  costSummary.value = summary;
}
async function refreshCostSummary() {
  costsLoading.value = true;
  try {
    const [summary, rows] = await Promise.all([getCostSummary(props.id), listCosts(props.id)]);
    costSummary.value = summary;
    costRows.value = rows;
  } catch (error) {
    pageError.value = error;
  } finally {
    costsLoading.value = false;
  }
}
async function refreshTasks() { tasks.value = await listTasks(props.id); }
async function refreshFacts() { facts.value = await listDryDockFacts(props.id); }
async function refreshReports() { reports.value = await listReports(props.id); }

async function loadUpdates() {
  loadingUpdates.value = true;
  try {
    const pairs = await Promise.all(workOrders.value.map(async (order) => [order.id, await listWorkOrderUpdates(order.id)]));
    updatesByOrder.value = Object.fromEntries(pairs);
  } catch (error) {
    pageError.value = error;
  } finally {
    loadingUpdates.value = false;
  }
}

function selectTab(tab) {
  activeTab.value = tab;
  if (tab === "Execution") loadUpdates();
  if (tab === "Reporting") loadReports();
}

async function loadReports() {
  loadingReports.value = true;
  try { await refreshReports(); }
  catch (error) { pageError.value = error; }
  finally { loadingReports.value = false; }
}

async function saveDock(values) {
  saving.value = true;
  formError.value = null;
  try {
    dock.value = await updateDryDock(props.id, values);
    await refreshCostSummary();
    dockFormOpen.value = false;
    notice.value = "Dry Dock updated.";
  } catch (error) { formError.value = error; }
  finally { saving.value = false; }
}

async function saveWorkOrder({ values, attachmentFile }) {
  saving.value = true;
  formError.value = null;
  const isEditing = Boolean(editingWorkOrder.value);
  let savedOrder = null;
  try {
    savedOrder = editingWorkOrder.value
      ? await updateWorkOrder(editingWorkOrder.value.id, values)
      : await createWorkOrder(props.id, values);
    if (attachmentFile) {
      editingWorkOrder.value = savedOrder;
      await uploadWorkOrderImage(savedOrder.id, attachmentFile);
    }
    workOrderFormOpen.value = false;
    notice.value = isEditing ? "Work Order updated." : "Work Order added.";
    await refreshWorkOrders();
  } catch (error) {
    if (savedOrder) {
      editingWorkOrder.value = savedOrder;
      await refreshWorkOrders().catch(() => {});
    }
    formError.value = error;
  }
  finally { saving.value = false; }
}

async function saveTask(values) {
  saving.value = true;
  formError.value = null;
  try {
    if (editingTask.value) await updateTask(editingTask.value.id, values);
    else await createTask(props.id, values);
    taskFormOpen.value = false;
    notice.value = editingTask.value ? "Task updated." : "Task added.";
    await refreshTasks();
  } catch (error) { formError.value = error; }
  finally { saving.value = false; }
}

async function saveFact(values) {
  saving.value = true;
  formError.value = null;
  try {
    await createDryDockFact(props.id, values);
    factFormOpen.value = false;
    notice.value = "Dry Dock Fact added.";
    await refreshFacts();
  } catch (error) { formError.value = error; }
  finally { saving.value = false; }
}

async function saveUpdate(values) {
  if (!updatingWorkOrder.value) return;
  saving.value = true;
  formError.value = null;
  try {
    await createWorkOrderUpdate(updatingWorkOrder.value.id, values);
    updateFormOpen.value = false;
    notice.value = "Execution update added.";
    await refreshWorkOrders();
    await loadUpdates();
  } catch (error) { formError.value = error; }
  finally { saving.value = false; }
}

function startAddReport(type) {
  editingReport.value = null;
  reportFormType.value = type;
  formError.value = null;
  reportFormOpen.value = true;
}

function startEditReport(report) {
  editingReport.value = report;
  reportFormType.value = report.reportType;
  formError.value = null;
  reportFormOpen.value = true;
}

async function saveReport(values) {
  saving.value = true;
  formError.value = null;
  try {
    if (editingReport.value) await updateReport(editingReport.value.id, values);
    else await createReport(props.id, values);
    reportFormOpen.value = false;
    notice.value = editingReport.value ? "Report updated." : "Report added.";
    await refreshReports();
  } catch (error) { formError.value = error; }
  finally { saving.value = false; }
}

async function removeReport(report) {
  if (!window.confirm(`Delete report “${report.title}”?`)) return;
  try {
    await deleteReportRecord(report.id);
    notice.value = "Report deleted.";
    await refreshReports();
  } catch (error) { pageError.value = error; }
}

async function saveSpecificationGroup(values) {
  saving.value = true;
  formError.value = null;
  try {
    await createSpecificationGroup(values);
    specificationGroups.value = await listSpecificationGroups(dock.value.vesselId);
    specificationGroupFormOpen.value = false;
    notice.value = "Specification Group added.";
  } catch (error) { formError.value = error; }
  finally { saving.value = false; }
}

function startAddWorkOrder() {
  editingWorkOrder.value = null;
  formError.value = null;
  workOrderFormOpen.value = true;
}

function startEditWorkOrder(order) {
  editingWorkOrder.value = order;
  formError.value = null;
  workOrderFormOpen.value = true;
}

function startEditTask(task) {
  editingTask.value = task;
  formError.value = null;
  taskFormOpen.value = true;
}

function startAddUpdate(order) {
  updatingWorkOrder.value = order;
  formError.value = null;
  updateFormOpen.value = true;
}

function formatDate(value) {
  if (!value) return "—";
  return new Intl.DateTimeFormat(undefined, { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${String(value).slice(0, 10)}T00:00:00Z`));
}

function formatDateTime(value) {
  if (!value) return "—";
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function amount(value, currency = dock.value?.currency) {
  if (value == null || value === "") return "—";
  return new Intl.NumberFormat(undefined, { style: "currency", currency: currency || "USD", maximumFractionDigits: 2 }).format(Number(value));
}

onMounted(load);
watch(() => props.id, () => {
  dock.value = null;
  workOrders.value = [];
  costRows.value = [];
  costSummary.value = null;
  tasks.value = [];
  facts.value = [];
  updatesByOrder.value = {};
  load();
});
</script>

<template>
  <div class="app-shell">
    <header class="topbar">
      <RouterLink class="brand" :to="{ name: 'dry-docks' }"><span class="brand-mark">D</span><span>Dry Dock Operations</span></RouterLink>
      <div class="topbar__right"><span>CRUD workspace</span><span class="avatar" aria-hidden="true">DD</span></div>
    </header>

    <main class="page">
      <nav class="breadcrumb" aria-label="Breadcrumb"><RouterLink :to="{ name: 'dry-docks' }">Dry Docks</RouterLink><span aria-hidden="true">›</span><span>{{ dock?.dockNo || 'Dock detail' }}</span></nav>
      <div v-if="loading" class="loading-line" role="status">Loading Dry Dock…</div>
      <div v-else-if="!dock" class="not-found"><div><h1>Dry Dock not found</h1><p class="page-subtitle">{{ pageError?.message || 'This record may have been deleted.' }}</p><RouterLink class="button" :to="{ name: 'dry-docks' }">Back to Dry Docks</RouterLink></div></div>
      <template v-else>
        <p v-if="pageError" class="notice notice--error" role="alert">{{ pageError.message }}</p>
        <p v-if="notice" class="notice notice--success" role="status">{{ notice }}</p>
        <section class="summary-card">
          <div class="summary-card__title">
            <span class="summary-card__icon" aria-hidden="true">{{ dock.dockNo.slice(0, 1).toUpperCase() }}</span>
            <div><p class="eyebrow">Dry Dock detail</p><h1>{{ dock.dockNo }}</h1><p>{{ dock.vesselName }} <span v-if="dock.shipyardName">· {{ dock.shipyardName }}</span></p></div>
          </div>
          <div class="summary-card__meta"><span class="status-badge" :class="`status-badge--${(dock.status || 'planning').toLowerCase()}`">{{ dock.status }}</span><button class="button button--secondary button--small" type="button" @click="dockFormOpen = true; formError = null">Edit Dry Dock</button></div>
        </section>

        <nav class="tabs" aria-label="Dry Dock sections">
          <button v-for="tab in tabs" :key="tab" class="tab" :class="{ 'tab--active': activeTab === tab }" type="button" :aria-current="activeTab === tab ? 'page' : undefined" @click="selectTab(tab)">{{ tab }}</button>
        </nav>

        <section v-if="activeTab === 'General'" class="panel detail-panel">
          <div class="section-heading"><div><h2>General Information</h2><p>Schedule, responsibility, and budget for this docking.</p></div></div>
          <div class="detail-grid">
            <div class="detail-cell"><span class="detail-cell__label">Vessel</span><span class="detail-cell__value">{{ dock.vesselName }}</span></div>
            <div class="detail-cell"><span class="detail-cell__label">Dock Number</span><span class="detail-cell__value">{{ dock.dockNo }}</span></div>
            <div class="detail-cell"><span class="detail-cell__label">Status · Priority</span><span class="detail-cell__value">{{ dock.status }} · {{ dock.priority }}</span></div>
            <div class="detail-cell"><span class="detail-cell__label">Description</span><span class="detail-cell__value">{{ dock.description }}</span></div>
            <div class="detail-cell"><span class="detail-cell__label">Shipyard</span><span class="detail-cell__value">{{ dock.shipyardName || dock.shipyardDetails || '—' }}</span></div>
            <div class="detail-cell"><span class="detail-cell__label">Company</span><span class="detail-cell__value">{{ dock.company || '—' }}</span></div>
            <div class="detail-cell"><span class="detail-cell__label">Planned dates</span><span class="detail-cell__value">{{ formatDate(dock.plannedStart) }} — {{ formatDate(dock.plannedEnd) }}</span></div>
            <div class="detail-cell"><span class="detail-cell__label">Actual dates</span><span class="detail-cell__value">{{ formatDate(dock.actualStart) }} — {{ formatDate(dock.actualEnd) }}</span></div>
            <div class="detail-cell"><span class="detail-cell__label">Completed Date</span><span class="detail-cell__value">{{ formatDate(dock.completedDate) }}</span></div>
            <div class="detail-cell"><span class="detail-cell__label">Budget</span><span class="detail-cell__value">{{ amount(dock.budget) }}</span></div>
            <div class="detail-cell"><span class="detail-cell__label">Responsible Rank</span><span class="detail-cell__value">{{ dock.responsibleRank || '—' }}</span></div>
            <div class="detail-cell"><span class="detail-cell__label">Account Code</span><span class="detail-cell__value">{{ accountCodes.find((item) => item.id === dock.accountCodeId)?.code || '—' }}</span></div>
          </div>
          <CostSummary :summary="costSummary" :work-orders="workOrders" :costs="costRows" :currency="dock.currency" show-charts />
        </section>

        <section v-else-if="activeTab === 'Specifications'" class="panel detail-panel">
          <div class="section-heading"><div><h2>Work Orders</h2><p>{{ workOrders.length }} work order{{ workOrders.length === 1 ? '' : 's' }} linked to this Dry Dock.</p></div><div class="heading-actions"><button class="button button--secondary" type="button" @click="specificationGroupFormOpen = true; formError = null">＋ Add Specification Group</button><button class="button" type="button" @click="startAddWorkOrder">＋ Add Work Order</button></div></div>
          <div v-if="!specificationGroups.length" class="notice">A Specification Group is required to add a Work Order. Create one for {{ dock.vesselName }}.</div>
          <div v-if="!workOrders.length" class="empty-state"><div class="empty-state__icon" aria-hidden="true">⚙</div><h3>No Work Orders yet</h3><p>Add a Work Order to describe the jobs planned for this vessel's docking.</p><button class="button" type="button" @click="startAddWorkOrder">Add Work Order</button></div>
          <div v-else class="cards">
            <article v-for="order in workOrders" :key="order.id" class="record-card">
              <div class="record-card__head"><div><h3>{{ order.jobName }}</h3><p>{{ order.description }}</p></div><div class="row-actions"><span v-if="order.status" class="status-badge">{{ order.status }}</span><button class="button button--secondary button--small" type="button" @click="startEditWorkOrder(order)">Edit</button><button class="button button--small" type="button" @click="startAddUpdate(order)">Add Update</button></div></div>
              <div class="record-meta"><span>{{ order.jobCode || `WO-${order.id}` }}</span><span>{{ order.specificationGroupName || 'Specification group' }}</span><span>Budget {{ amount(order.totalBudget, order.currency) }}</span><span>{{ order.estimatedHours ?? '—' }} hours</span></div>
            </article>
          </div>
        </section>

        <section v-else-if="activeTab === 'Tasks'" class="panel detail-panel">
          <div class="section-heading"><div><h2>Tasks</h2><p>Tasks and follow-ups for this docking.</p></div><button class="button" type="button" @click="editingTask = null; formError = null; taskFormOpen = true">＋ Add Task</button></div>
          <div v-if="!tasks.length" class="empty-state"><div class="empty-state__icon" aria-hidden="true">✓</div><h3>No Tasks yet</h3><p>Create a task with an owner rank and due date.</p><button class="button" type="button" @click="editingTask = null; formError = null; taskFormOpen = true">Add Task</button></div>
          <div v-else class="cards">
            <article v-for="task in tasks" :key="task.id" class="record-card">
              <div class="record-card__head"><div><h3>{{ task.title }}</h3><p>{{ task.description || 'No description' }}</p></div><div class="row-actions"><span class="status-badge" :class="`status-badge--${(task.status || 'open').toLowerCase().replaceAll(' ', '-')}`">{{ task.status }}</span><button class="button button--secondary button--small" type="button" @click="startEditTask(task)">Edit</button></div></div>
              <div class="record-meta"><span>Due {{ formatDate(task.dueDate) }}</span><span>{{ task.responsibleRank || 'No responsible rank' }}</span></div>
            </article>
          </div>
        </section>

        <section v-else-if="activeTab === 'Sourcing'" class="panel detail-panel">
          <SourcingSection :dry-dock-id="id" :currency="dock.currency" :account-codes="accountCodes" />
        </section>

        <section v-else-if="activeTab === 'Execution'" class="panel detail-panel">
          <div class="section-heading"><div><h2>Execution Updates</h2><p>{{ totalWorkOrderUpdates }} recorded update{{ totalWorkOrderUpdates === 1 ? '' : 's' }} across the Work Orders.</p></div></div>
          <div v-if="loadingUpdates" class="loading-line">Loading execution history…</div>
          <div v-else-if="!workOrders.length" class="empty-state"><div class="empty-state__icon" aria-hidden="true">↗</div><h3>No Work Orders to update</h3><p>Add a Work Order first, then record progress and actual costs.</p><button class="button" type="button" @click="activeTab = 'Specifications'">View Specifications</button></div>
          <div v-else class="cards">
            <article v-for="order in workOrders" :key="order.id" class="record-card">
              <div class="record-card__head"><div><h3>{{ order.jobName }}</h3><p>{{ order.jobCode || `WO-${order.id}` }}</p></div><button class="button button--secondary button--small" type="button" @click="startAddUpdate(order)">＋ Add Update</button></div>
              <div v-if="!updatesByOrder[order.id]?.length" class="loading-line">No updates for this Work Order.</div>
              <div v-else class="timeline">
                <div v-for="update in updatesByOrder[order.id]" :key="update.id" class="timeline-item">
                  <span class="timeline-dot" aria-hidden="true"></span>
                  <div class="timeline-content"><strong>{{ update.actionType || 'Progress update' }}<span v-if="update.progress != null"> · {{ Number(update.progress) }}%</span></strong><p v-if="update.description">{{ update.description }}</p><small>{{ formatDateTime(update.createdAt) }} · Yard {{ amount(update.actualYardCost, order.currency) }} · Owner {{ amount(update.actualOwnerCost, order.currency) }}</small></div>
                </div>
              </div>
            </article>
          </div>
        </section>

        <section v-else-if="activeTab === 'Reporting'" class="panel detail-panel">
          <div class="section-heading"><div><h2>Reporting</h2><p>Daily activity and completion reports for this docking.</p></div><div class="heading-actions"><button class="button button--secondary" type="button" @click="startAddReport('Daily')">＋ Daily Report</button><button class="button" type="button" @click="startAddReport('Completion')">＋ Completion Report</button></div></div>
          <div v-if="loadingReports" class="loading-line" role="status">Loading reports…</div>
          <div v-else-if="!reports.length" class="empty-state"><h3>No reports yet</h3><p>Add a daily or completion report to record docking progress.</p><button class="button" type="button" @click="startAddReport('Daily')">Add Daily Report</button></div>
          <div v-else class="cards">
            <article v-for="report in reports" :key="report.id" class="record-card">
              <div class="record-card__head"><div><span class="status-badge">{{ report.reportType }}</span><h3>{{ report.title }}</h3><p>{{ report.updatedText || 'No update text' }}</p></div><div class="row-actions"><button class="button button--secondary button--small" type="button" @click="startEditReport(report)">Edit</button><button class="button button--danger button--small" type="button" @click="removeReport(report)">Delete</button></div></div>
              <div class="record-meta"><span>{{ formatDate(report.reportDate) }}</span><span>{{ report.lastUpdatedBy || 'No author' }}</span><span v-if="report.action">{{ report.action }}</span></div>
              <p v-if="report.extraNote" class="report-extra-note">{{ report.extraNote }}</p>
            </article>
          </div>
        </section>

        <section v-else-if="activeTab === 'Costs'" class="panel detail-panel">
          <CostsSection :dry-dock-id="id" :currency="dock.currency" :specification-groups="specificationGroups" :work-orders="workOrders" :summary="costSummary" :costs="costRows" :loading="costsLoading" @changed="refreshCostSummary" />
        </section>

        <section v-else-if="activeTab === 'Purchase Orders'" class="panel detail-panel">
          <PurchaseOrdersSection :dry-dock-id="id" :currency="dock.currency" :account-codes="accountCodes" />
        </section>

        <section v-else-if="activeTab === 'Dry Dock Facts'" class="panel detail-panel">
          <div class="section-heading"><div><h2>Dry Dock Facts</h2><p>Record milestone activity and its date/time.</p></div><button class="button" type="button" @click="formError = null; factFormOpen = true">＋ Add Fact</button></div>
          <div v-if="!facts.length" class="empty-state"><div class="empty-state__icon" aria-hidden="true">◷</div><h3>No facts recorded</h3><p>Add docking milestones such as arrival, flooding, or undocking.</p><button class="button" type="button" @click="formError = null; factFormOpen = true">Add Dry Dock Fact</button></div>
          <div v-else class="timeline">
            <div v-for="fact in facts" :key="fact.id" class="timeline-item"><span class="timeline-dot" aria-hidden="true"></span><div class="timeline-content"><strong>{{ fact.activity }}</strong><small>{{ formatDate(fact.factDate) }}<template v-if="fact.factTime"> · {{ String(fact.factTime).slice(0, 5) }}</template></small></div></div>
          </div>
        </section>
      </template>
    </main>

    <DryDockForm :open="dockFormOpen" :initial-values="dock" :vessels="vessels" :shipyards="shipyards" :account-codes="accountCodes" :saving="saving" :error="formError" @close="dockFormOpen = false" @submit="saveDock" />
    <WorkOrderForm :open="workOrderFormOpen" :initial-values="editingWorkOrder" :specification-groups="specificationGroups" :vessel-name="dock?.vesselName || ''" :currency="dock?.currency || 'USD'" :saving="saving" :error="formError" @close="workOrderFormOpen = false" @submit="saveWorkOrder" />
    <TaskForm :open="taskFormOpen" :initial-values="editingTask" :saving="saving" :error="formError" @close="taskFormOpen = false" @submit="saveTask" />
    <DryDockFactForm :open="factFormOpen" :saving="saving" :error="formError" @close="factFormOpen = false" @submit="saveFact" />
    <ExecutionUpdateForm :open="updateFormOpen" :work-order="updatingWorkOrder" :saving="saving" :error="formError" @close="updateFormOpen = false" @submit="saveUpdate" />
    <SpecificationGroupForm :open="specificationGroupFormOpen" :vessel="vessels.find((item) => item.id === dock?.vesselId)" :saving="saving" :error="formError" @close="specificationGroupFormOpen = false" @submit="saveSpecificationGroup" />
    <DailyReportForm :open="reportFormOpen" :initial-values="editingReport" :report-type="reportFormType" :saving="saving" :error="formError" @close="reportFormOpen = false" @submit="saveReport" />
  </div>
</template>
