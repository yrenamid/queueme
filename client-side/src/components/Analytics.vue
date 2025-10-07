<template>
  <div class="border border-gray-200 rounded-lg mx-3 my-5 p-5 shadow-lg">
    <p class="text-2xl font-bold text-[#283618]">Analytics</p>
    <p class="text-sm font-light text-gray-500 mt-1">View detailed analytics about your business</p>

    <div class="flex flex-wrap items-center gap-3 my-3">
      <ion-select interface="popover" :value="range" @ionChange="onRangeChange" class="border border-gray-300 h-8 normal-case rounded-sm px-2">
        <ion-select-option value="today">Today</ion-select-option>
        <ion-select-option value="week">This Week</ion-select-option>
        <ion-select-option value="month">This Month</ion-select-option>
      </ion-select>
      <span v-if="dateLabel" class="text-xs text-gray-600">{{ dateLabel }}</span>
    </div>

    <ion-card>
      <div class="p-8">
        <canvas id="analyticsChart"></canvas>
      </div>
    </ion-card>
  </div>

  <div class="border border-[#E6E2CC] bg-[#FEFAE0] rounded-xl mx-3 my-5 p-5 shadow-sm">
    <div class="flex items-center gap-3 mb-1">
      <p class="text-2xl font-bold text-[#283618]">Customer Feedback</p>
      <span class="ml-auto"></span>
      <ion-button fill="clear" size="small" class="bg-[#283618] text-white normal-case rounded-md" @click="refreshFeedback">
        Refresh
      </ion-button>
    </div>
    <p class="text-sm font-light text-[#606C38] mb-4">Ratings and comments from your customers</p>

    <div class="flex items-center gap-6 mt-1 p-4 bg-white/60 rounded-lg border border-[#E6E2CC]">
      <div class="flex items-center gap-3 text-3xl text-[#283618]">
        <font-awesome-icon v-for="i in 5" :key="i" :icon="['fas','star']" class="text-[#DDA15E]" :style="{ opacity: i <= Math.round(feedbackStats.avg || 0) ? 1 : 0.25 }" />
        <span class="font-extrabold text-3xl">{{ feedbackStats.avg ? feedbackStats.avg.toFixed(2) : '0.00' }}</span>
        <span class="text-lg font-semibold text-[#283618]">/ 5</span>
      </div>
      <div class="text-sm text-[#283618]">Total responses: <span class="font-semibold">{{ feedbackStats.total }}</span></div>
    </div>

    <div class="mt-4 overflow-x-auto">
      <table class="min-w-full text-sm text-[#283618]">
        <thead>
          <tr class="text-left bg-white/70 border-b border-[#E6E2CC]">
            <th class="py-2 px-3 font-semibold">Date</th>
            <th class="py-2 px-3 font-semibold">Customer</th>
            <th class="py-2 px-3 font-semibold">Queue #</th>
            <th class="py-2 px-3 font-semibold">Rating</th>
            <th class="py-2 px-3 font-semibold">Comment</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="f in pagedFeedback" :key="f.id" class="border-b border-[#E6E2CC] odd:bg-[#F7F3D9] even:bg-[#FEFAE0]">
            <td class="py-2 px-3">{{ new Date(f.created_at).toLocaleString() }}</td>
            <td class="py-2 px-3">{{ f.customer_name || '\u2014' }}</td>
            <td class="py-2 px-3">{{ f.queue_number }}</td>
            <td class="py-2 px-3">
              <span class="inline-flex items-center gap-1">
                <font-awesome-icon v-for="i in 5" :key="i" :icon="[i<=f.rating?'fas':'far','star']" class="text-[#DDA15E]" />
              </span>
            </td>
            <td class="py-2 px-3">{{ f.comment || '' }}</td>
          </tr>
          <tr v-if="!feedbackList.length">
            <td class="py-4 text-gray-500" colspan="5">No feedback yet</td>
          </tr>
        </tbody>
      </table>
    </div>

    
    <div v-if="totalPages > 1" class="mt-4 flex items-center justify-end gap-2">
      <button
        class="px-3 py-1 border rounded text-sm text-[#283618] disabled:opacity-50 disabled:cursor-not-allowed"
        :disabled="currentPage === 1"
        @click="prevPage"
        aria-label="Previous page"
      >Previous</button>

      <button
        v-for="p in totalPages"
        :key="p"
        class="px-3 py-1 border rounded text-sm"
        :class="currentPage === p ? 'bg-[#283618] text-white' : 'text-[#283618] bg-white'"
        @click="goToPage(p)"
        :aria-current="currentPage === p ? 'page' : false"
      >{{ p }}</button>

      <button
        class="px-3 py-1 border rounded text-sm text-[#283618] disabled:opacity-50 disabled:cursor-not-allowed"
        :disabled="currentPage === totalPages"
        @click="nextPage"
        aria-label="Next page"
      >Next</button>
    </div>
  </div>
</template>

<script>
import { onMounted, onUnmounted, ref } from "vue";
import { IonCard, IonSelect, IonSelectOption, IonButton } from "@ionic/vue";
import { Chart, registerables } from "chart.js";
import api, { getBusinessFeedback } from '@/services/api';
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";

Chart.register(...registerables);

export default {
  name: "AnalyticsPanel",
  components: { IonCard, IonSelect, IonSelectOption, IonButton, FontAwesomeIcon },
  setup() {
    const range = ref('today');
    const dateLabel = ref('');
    const feedbackList = ref([]);
    const feedbackStats = ref({ avg: 0, total: 0 });
    const businessId = Number(localStorage.getItem('businessId')) || null;


    const pageSize = 5;
    const currentPage = ref(1);
    const totalPages = ref(1);
    const pagedFeedback = ref([]);

    let chart;



    async function fetchSeries() {
      const params = { range: range.value };
      const { data } = await api.get('/analytics/series', { params: { ...params, _t: Date.now() } });
      if (data?.success) {
        renderChart(data.data.labels, data.data.servedCounts, data.data.avgWaits);

        dateLabel.value = `${data.data.start.split(' ')[0]} → ${data.data.end.split(' ')[0]}`;
      }
    }


    function renderChart(labels, servedCounts, avgWaits) {
      const ctx = document.getElementById('analyticsChart');
      if (chart) { chart.destroy(); }
      chart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels,
          datasets: [
            { label: 'Customers', backgroundColor: '#F47007', hoverBackgroundColor: '#F79345', data: servedCounts, yAxisID: 'y-customers' },
            { label: 'Average Wait (minutes)', backgroundColor: '#606C38', hoverBackgroundColor: '#91A35A', data: avgWaits, yAxisID: 'y-waitTime' }
          ]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { position: 'bottom' }, tooltip: { enabled: true, mode: 'index', intersect: false, callbacks: { label: (ctx) => { const dsLabel = ctx.dataset.label || ''; const v = ctx.parsed.y; if (ctx.dataset.yAxisID === 'y-waitTime') { return `${dsLabel}: ${v} min`; } return `${dsLabel}: ${v}`; } } } },
          interaction: { mode: 'index', intersect: false }, hover: { mode: 'index', intersect: false },
          scales: {
            'y-customers': { type: 'linear', position: 'left', ticks: { color: '#F47007' } },
            'y-waitTime': { type: 'linear', position: 'right', grid: { drawOnChartArea: false }, ticks: { color: '#606C38', callback: (v) => `${v} min` }, title: { display: true, text: 'Average Wait (minutes)' } }
          }
        }
      });
    }
    

    function onRangeChange(e){ range.value = e.detail.value; fetchSeries(); }

    onMounted(async () => {
      await fetchSeries();
      await refreshFeedback();


      const handler = async () => {
        try {
          await refreshFeedback();
        } catch (err) {

          console.debug('[analytics] refreshFeedback failed', err);
        }
      };
      window.addEventListener('feedback:submitted', handler);
      onUnmounted(() => { window.removeEventListener('feedback:submitted', handler); });
    });


    function recalcPagination(){
      const total = feedbackList.value?.length || 0;
      totalPages.value = Math.max(1, Math.ceil(total / pageSize));
      if (currentPage.value > totalPages.value) currentPage.value = totalPages.value;
      if (currentPage.value < 1) currentPage.value = 1;
      const start = (currentPage.value - 1) * pageSize;
      pagedFeedback.value = (feedbackList.value || []).slice(start, start + pageSize);
    }



    async function refreshFeedback(){
      if (!businessId) return;
      try {
        const fb = await getBusinessFeedback(businessId);
        feedbackList.value = fb.list || [];
        feedbackStats.value = fb.stats || { avg: 0, total: 0 };
        recalcPagination();
      } catch (e) {
        console.error('[feedback] load failed', e);
      }
    }



    function goToPage(p){ if (typeof p === 'number') { currentPage.value = p; recalcPagination(); } }

    function prevPage(){ if (currentPage.value > 1) { currentPage.value -= 1; recalcPagination(); } }

    function nextPage(){ if (currentPage.value < totalPages.value) { currentPage.value += 1; recalcPagination(); } }

    return { range, onRangeChange, dateLabel, feedbackList, feedbackStats, refreshFeedback, pagedFeedback, currentPage, totalPages, goToPage, prevPage, nextPage };
  },
};
</script>

<style scoped>
canvas {
  width: 90%;
  height: 500px !important;
}
</style>
