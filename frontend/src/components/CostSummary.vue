<script setup>
import { computed } from "vue";
import { buildCostComparisonGroups, buildWorkOrderStatusSegments, formatCostAmount, formatCostSummary } from "../services/costSummary.js";

const props = defineProps({
  summary: { type: Object, default: null },
  workOrders: { type: Array, default: () => [] },
  costs: { type: Array, default: () => [] },
  currency: { type: String, default: "USD" },
  showCharts: { type: Boolean, default: false }
});
const metrics = computed(() => props.summary ? formatCostSummary(props.summary) : null);
const statuses = computed(() => buildWorkOrderStatusSegments(props.workOrders));
const statusTotal = computed(() => statuses.value.reduce((total, item) => total + item.count, 0));
const circumference = 276.46;
const statusColors = ["#169cf0", "#5c9f45", "#e75e98", "#00a1bb", "#bb8b2f", "#7856a7"];
const statusChart = computed(() => {
  let offset = 0;
  return statuses.value.map((status, index) => {
    const length = statusTotal.value ? status.count / statusTotal.value * circumference : 0;
    const segment = { ...status, color: statusColors[index % statusColors.length], dasharray: `${length} ${circumference - length}`, dashoffset: -offset };
    offset += length;
    return segment;
  });
});
const comparisonSeries = [
  { key: "totalCosts", label: "Total Costs", color: "#169cf0" },
  { key: "totalEstimates", label: "Total Estimates", color: "#5c9f45" },
  { key: "totalBudget", label: "Total Budget", color: "#e75e98" }
];
const comparisonGroups = computed(() => buildCostComparisonGroups(props.costs));
const comparisonMax = computed(() => Math.max(0, ...comparisonGroups.value.flatMap((group) => comparisonSeries.map(({ key }) => group[key]))));
const currency = computed(() => props.currency || props.summary?.currency || "USD");
const chartAmount = (amount) => formatCostAmount(amount.toFixed(2), currency.value);
const labels = [
  ["budget", "Budget"], ["yardEstimates", "Yard Estimates"], ["ownerEstimates", "Owner Estimates"],
  ["totalEstimates", "Total Estimates"], ["actualYardCosts", "Actual Yard Costs"],
  ["actualOwnerCosts", "Actual Owner Costs"], ["totalCosts", "Total Costs"], ["variance", "Variance"]
];
</script>

<template>
  <section class="cost-summary" aria-label="Cost Summary">
    <h2>Cost Summary</h2>
    <p v-if="!metrics" class="loading-line">Loading cost summary…</p>
    <div v-else>
      <div class="cost-summary__grid">
        <article v-for="[key, label] in labels" :key="key" class="cost-metric">
          <span>{{ label }}</span><strong>{{ metrics[key] }}</strong>
        </article>
      </div>
      <div v-if="showCharts" class="cost-charts">
        <section class="cost-chart" aria-label="Work Order status chart">
          <h3>Status</h3>
          <div v-if="!statusChart.length" class="chart-empty">No Work Orders to chart.</div>
          <div v-else class="status-chart">
            <div class="status-chart__donut">
              <svg viewBox="0 0 120 120" role="img" :aria-label="`${statusTotal} Work Orders by status`">
                <circle class="status-chart__track" cx="60" cy="60" r="44" />
                <circle v-for="segment in statusChart" :key="segment.label" class="status-chart__segment" cx="60" cy="60" r="44" :stroke="segment.color" :stroke-dasharray="segment.dasharray" :stroke-dashoffset="segment.dashoffset" transform="rotate(-90 60 60)" />
              </svg>
              <strong aria-hidden="true">{{ statusTotal }}</strong>
            </div>
            <ul class="chart-legend">
              <li v-for="segment in statusChart" :key="segment.label"><span class="chart-legend__swatch" :style="{ backgroundColor: segment.color }"></span><span>{{ segment.label }}</span><strong>{{ segment.count }}</strong></li>
            </ul>
          </div>
        </section>

        <section class="cost-chart" aria-label="Cost comparison chart">
          <h3>Comparison</h3>
          <ul class="chart-legend chart-legend--horizontal">
            <li v-for="series in comparisonSeries" :key="series.key"><span class="chart-legend__swatch" :style="{ backgroundColor: series.color }"></span><span>{{ series.label }}</span></li>
          </ul>
          <div v-if="!comparisonGroups.length" class="chart-empty">No Cost items to compare yet.</div>
          <div v-else class="comparison-chart__scroll">
            <div class="comparison-chart__plot" role="img" :aria-label="`Budget, estimates, and costs by Specification Group. Highest value ${chartAmount(comparisonMax)}.`">
              <div v-for="group in comparisonGroups" :key="group.label" class="comparison-chart__group">
                <div class="comparison-chart__bars">
                  <span v-for="series in comparisonSeries" :key="series.key" class="comparison-chart__bar" :style="{ height: comparisonMax && group[series.key] > 0 ? `${Math.max(2, group[series.key] / comparisonMax * 100)}%` : '0%', backgroundColor: series.color }" :title="`${series.label}: ${chartAmount(group[series.key])}`"></span>
                </div>
                <span class="comparison-chart__label" :title="group.label">{{ group.label }}</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  </section>
</template>
