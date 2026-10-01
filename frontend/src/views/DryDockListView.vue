<script setup>
import { computed, onMounted, reactive, ref } from "vue";
import { RouterLink } from "vue-router";
import DryDockForm from "../components/DryDockForm.vue";
import VesselForm from "../components/VesselForm.vue";
import { createDryDock, deleteDryDock, listDryDocks, updateDryDock } from "../services/dryDocks.js";
import { createVessel, listAccountCodes, listShipyards, listVessels } from "../services/masterData.js";

const docks = ref([]);
const vessels = ref([]);
const shipyards = ref([]);
const accountCodes = ref([]);
const pagination = ref({ page: 1, limit: 10, total: 0 });
const filters = reactive({ search: "", status: "", vesselId: "" });
const loading = ref(true);
const saving = ref(false);
const deletingId = ref(null);
const pageError = ref(null);
const formError = ref(null);
const notice = ref("");
const dockFormOpen = ref(false);
const vesselFormOpen = ref(false);
const editingDock = ref(null);
const addDockAfterVessel = ref(false);

const pageCount = computed(() => Math.max(1, Math.ceil(pagination.value.total / pagination.value.limit)));
const firstRow = computed(() => pagination.value.total ? (pagination.value.page - 1) * pagination.value.limit + 1 : 0);
const lastRow = computed(() => Math.min(pagination.value.page * pagination.value.limit, pagination.value.total));
const hasFilters = computed(() => Boolean(filters.search || filters.status || filters.vesselId));

async function loadLookups() {
  [vessels.value, shipyards.value, accountCodes.value] = await Promise.all([listVessels(), listShipyards(), listAccountCodes()]);
}

async function loadDocks() {
  loading.value = true;
  pageError.value = null;
  try {
    const result = await listDryDocks({ ...filters, page: pagination.value.page, limit: pagination.value.limit });
    docks.value = result.data;
    pagination.value = result.pagination;
  } catch (error) {
    pageError.value = error;
  } finally {
    loading.value = false;
  }
}

async function initialize() {
  try {
    await loadLookups();
    await loadDocks();
  } catch (error) {
    pageError.value = error;
    loading.value = false;
  }
}

function search() {
  pagination.value.page = 1;
  loadDocks();
}

function changePage(page) {
  if (page < 1 || page > pageCount.value) return;
  pagination.value.page = page;
  loadDocks();
}

function openAddDock() {
  formError.value = null;
  editingDock.value = null;
  if (!vessels.value.length) {
    addDockAfterVessel.value = true;
    vesselFormOpen.value = true;
    return;
  }
  dockFormOpen.value = true;
}

function openEditDock(dock) {
  formError.value = null;
  editingDock.value = dock;
  dockFormOpen.value = true;
}

async function saveDock(values) {
  saving.value = true;
  formError.value = null;
  try {
    if (editingDock.value) await updateDryDock(editingDock.value.id, values);
    else await createDryDock(values);
    dockFormOpen.value = false;
    notice.value = editingDock.value ? "Dry Dock updated." : "Dry Dock created.";
    await loadDocks();
  } catch (error) {
    formError.value = error;
  } finally {
    saving.value = false;
  }
}

async function saveVessel(values) {
  saving.value = true;
  formError.value = null;
  try {
    await createVessel(values);
    await loadLookups();
    vesselFormOpen.value = false;
    notice.value = "Vessel added.";
    if (addDockAfterVessel.value) {
      addDockAfterVessel.value = false;
      dockFormOpen.value = true;
    }
  } catch (error) {
    formError.value = error;
  } finally {
    saving.value = false;
  }
}

async function removeDock(dock) {
  if (!window.confirm(`Delete Dry Dock ${dock.dockNo}?`)) return;
  deletingId.value = dock.id;
  pageError.value = null;
  notice.value = "";
  try {
    await deleteDryDock(dock.id);
    if (docks.value.length === 1 && pagination.value.page > 1) pagination.value.page -= 1;
    notice.value = "Dry Dock deleted.";
    await loadDocks();
  } catch (error) {
    pageError.value = error;
  } finally {
    deletingId.value = null;
  }
}

function formatDate(value) {
  if (!value) return "—";
  return new Intl.DateTimeFormat(undefined, { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`));
}

onMounted(initialize);
</script>

<template>
  <div class="app-shell">
    <header class="topbar">
      <RouterLink class="brand" :to="{ name: 'dry-docks' }" aria-label="Dry Docks home">
        <span class="brand-mark">D</span><span>Dry Dock Operations</span>
      </RouterLink>
      <div class="topbar__right"><span>CRUD workspace</span><span class="avatar" aria-hidden="true">DD</span></div>
    </header>

    <main class="page">
      <div class="page-heading">
        <div><p class="eyebrow">Docking management</p><h1>Dry Docks</h1><p class="page-subtitle">Manage vessel docking schedules, status, and budgets.</p></div>
        <div class="heading-actions">
          <button class="button button--secondary" type="button" @click="vesselFormOpen = true; formError = null">＋ Add Vessel</button>
          <button class="button" type="button" @click="openAddDock">＋ Add Dry Dock</button>
        </div>
      </div>

      <p v-if="notice" class="notice notice--success" role="status">{{ notice }}</p>
      <p v-if="pageError" class="notice notice--error" role="alert">{{ pageError.message }}</p>
      <div v-if="!vessels.length && !loading" class="notice">Add a Vessel first so it can be selected when creating a Dry Dock.</div>

      <section class="panel" aria-label="Dry Dock list">
        <form class="filters" @submit.prevent="search">
          <div class="field"><label for="dock-search">Search</label><input id="dock-search" v-model="filters.search" placeholder="Dock number, vessel, shipyard…" /></div>
          <div class="field"><label for="filter-status">Status</label><select id="filter-status" v-model="filters.status"><option value="">All statuses</option><option>Planning</option><option>Execution</option><option>Completed</option></select></div>
          <div class="field"><label for="filter-vessel">Vessel</label><select id="filter-vessel" v-model="filters.vesselId"><option value="">All vessels</option><option v-for="vessel in vessels" :key="vessel.id" :value="vessel.id">{{ vessel.name }}</option></select></div>
          <button class="button" type="submit">Search</button>
        </form>

        <div v-if="loading" class="loading-line" aria-live="polite">Loading Dry Docks…</div>
        <div v-else-if="!docks.length" class="empty-state">
          <div class="empty-state__icon" aria-hidden="true">▤</div>
          <h2>{{ hasFilters ? 'No matching Dry Docks' : 'No Dry Docks yet' }}</h2>
          <p>{{ hasFilters ? 'Adjust the search or filters and try again.' : 'Create a Dry Dock to start planning a vessel docking.' }}</p>
          <button v-if="!hasFilters && vessels.length" class="button" type="button" @click="openAddDock">Add first Dry Dock</button>
          <button v-else-if="!hasFilters" class="button" type="button" @click="vesselFormOpen = true">Add first Vessel</button>
          <button v-else class="button button--secondary" type="button" @click="filters.search = ''; filters.status = ''; filters.vesselId = ''; search()">Clear filters</button>
        </div>
        <div v-else class="table-wrap">
          <table class="data-table">
            <thead><tr><th>Dock No</th><th>Vessel</th><th>Shipyard</th><th>Planned dates</th><th>Priority</th><th>Status</th><th><span class="sr-only">Actions</span></th></tr></thead>
            <tbody>
              <tr v-for="dock in docks" :key="dock.id">
                <td><RouterLink class="table-primary" :to="{ name: 'dry-dock-detail', params: { id: dock.id } }">{{ dock.dockNo }}</RouterLink><span class="table-secondary">{{ dock.description }}</span></td>
                <td><span class="table-primary">{{ dock.vesselName }}</span></td>
                <td>{{ dock.shipyardName || '—' }}</td>
                <td>{{ formatDate(dock.plannedStart) }}<span class="table-secondary">to {{ formatDate(dock.plannedEnd) }}</span></td>
                <td><span class="priority">{{ dock.priority || 'Medium' }}</span></td>
                <td><span class="status-badge" :class="`status-badge--${(dock.status || 'planning').toLowerCase().replaceAll(' ', '-')}`">{{ dock.status }}</span></td>
                <td><div class="row-actions">
                  <button class="button button--secondary button--small" type="button" :aria-label="`Edit ${dock.dockNo}`" @click="openEditDock(dock)">Edit</button>
                  <button class="button button--danger button--small" type="button" :disabled="deletingId === dock.id" :aria-label="`Delete ${dock.dockNo}`" @click="removeDock(dock)">{{ deletingId === dock.id ? 'Deleting…' : 'Delete' }}</button>
                </div></td>
              </tr>
            </tbody>
          </table>
        </div>

        <footer v-if="!loading && pagination.total" class="pagination">
          <span>Showing {{ firstRow }}–{{ lastRow }} of {{ pagination.total }} Dry Docks</span>
          <div class="pagination__actions">
            <button class="button button--secondary button--small" type="button" :disabled="pagination.page <= 1" @click="changePage(pagination.page - 1)">Previous</button>
            <span class="button button--secondary button--small" aria-live="polite">{{ pagination.page }} / {{ pageCount }}</span>
            <button class="button button--secondary button--small" type="button" :disabled="pagination.page >= pageCount" @click="changePage(pagination.page + 1)">Next</button>
          </div>
        </footer>
      </section>
    </main>

    <DryDockForm :open="dockFormOpen" :initial-values="editingDock" :vessels="vessels" :shipyards="shipyards" :account-codes="accountCodes" :saving="saving" :error="formError" @close="dockFormOpen = false" @submit="saveDock" />
    <VesselForm :open="vesselFormOpen" :saving="saving" :error="formError" @close="vesselFormOpen = false; addDockAfterVessel = false" @submit="saveVessel" />
  </div>
</template>
