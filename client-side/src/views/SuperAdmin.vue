<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <div class="flex items-center justify-between px-4">
          <h1 id="poppins" class="text-white text-xl font-semibold">Super Admin Dashboard</h1>
          <div class="flex items-center gap-2">
            <div class="hidden md:block text-white/80 text-sm">{{ nowText }}</div>
            <ion-button size="small" fill="outline" @click="openSettings" style="--border-color:#DDA15E; --color:#FEFAE0; --border-radius:8px; --padding-start:12px; --padding-end:12px;">
              <ion-icon :icon="settingsOutline" class="mr-1"></ion-icon>
              Settings
            </ion-button>
          </div>
        </div>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <div class="max-w-7xl mx-auto p-4">
        <!-- Stats Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <div class="rounded-lg bg-[#283618] text-[#FEFAE0] p-3 border border-white/10 hover:shadow-md transition" title="All registered businesses">
            <p class="text-xs opacity-80">Total Businesses</p>
            <p class="text-2xl font-bold">{{ globalTotal }}</p>
          </div>
          <div class="rounded-lg bg-[#283618] text-[#FEFAE0] p-3 border border-white/10 hover:shadow-md transition" title="Food category">
            <p class="text-xs opacity-80">Food Businesses</p>
            <p class="text-2xl font-bold">{{ foodCount }}</p>
          </div>
          <div class="rounded-lg bg-[#283618] text-[#FEFAE0] p-3 border border-white/10 hover:shadow-md transition" title="Service category">
            <p class="text-xs opacity-80">Service Businesses</p>
            <p class="text-2xl font-bold">{{ serviceCount }}</p>
          </div>
        </div>

        <!-- Table Card -->
        <div class="rounded-lg bg-[#283618] text-white p-4 border border-white/10">
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
            <h2 class="text-lg font-semibold">Registered Businesses</h2>
            <div class="flex items-center gap-2">
              <ion-button size="small" fill="outline" @click="exportAll" style="--border-color:#DDA15E; --color:#FEFAE0; --border-radius:8px;">
                <ion-icon :icon="downloadOutline" class="mr-1"></ion-icon>
                Export List
              </ion-button>
            </div>
          </div>
          <!-- Filters -->
          <div class="grid md:grid-cols-2 gap-3 mb-3">
            <div class="relative">
              <label class="block leading-3 text-[10px] text-white/80 mb-1">Search</label>
              <ion-icon :icon="searchOutline" class="absolute left-2 top-[34px] -translate-y-1/2 text-white/70"></ion-icon>
              <input v-model="search" class="w-full pl-7 pr-2 py-2 rounded text-sm bg-[#f9f9f1] text-[#222222] placeholder:text-[#6b7280]" placeholder="Search name, email, or phone" style="color:#222 !important; background:#f9f9f1 !important;" />
            </div>
            <div class="flex items-end gap-2 justify-start md:justify-end">
              <div class="min-w-[160px]">
                <label class="block leading-3 text-[10px] text-white/80 mb-1">Category</label>
                <ion-select v-model="category" interface="popover" :interface-options="{ cssClass: 'sa-select-popover' }" placeholder="All"
                  class="w-full text-sm border rounded-lg custom-select-outline"
                  style="--padding-start:10px; --highlight-color:none; --border-color:#8fa870; --border-radius:0.5rem; --background:#2d3a22; --color:#f8f8f8; --placeholder-color:#f8f8f8; --button-color:#f8f8f8; --button-background:#2d3a22;">
                <ion-select-option value="">All</ion-select-option>
                <ion-select-option value="food">Food</ion-select-option>
                <ion-select-option value="service">Service</ion-select-option>
                </ion-select>
              </div>
              <ion-button size="small" fill="solid" @click="applyFilters" style="--background:#DDA15E; --background-activated:#c3894d; --color:#283618; --border-radius:8px;">Apply</ion-button>
              <ion-button size="small" fill="outline" @click="clearFilters" style="--border-color:#DDA15E; --color:#FEFAE0; --border-radius:8px;">Clear</ion-button>
            </div>
          </div>

          <!-- Table -->
          <div class="overflow-x-auto rounded-md border border-white/10 bg-white/5">
            <table class="w-full text-sm">
              <thead class="bg-white/10">
                <tr>
                  <th class="text-left p-3 font-semibold text-[13px]">Name</th>
                  <th class="text-left p-3 font-semibold text-[13px]">Email</th>
                  <th class="text-left p-3 font-semibold text-[13px]">Phone</th>
                  <th class="text-left p-3 font-semibold text-[13px]">Category</th>
                  <th class="text-left p-3 font-semibold text-[13px]">Owner Email</th>
                  <th class="text-left p-3 font-semibold text-[13px]">Created</th>
                  <th class="text-left p-3 font-semibold text-[13px]">Proof</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in rows" :key="row.id" class="odd:bg-white/5 hover:bg-white/10 transition-colors border-b border-white/10">
                  <td class="p-3 whitespace-nowrap overflow-hidden text-ellipsis" :title="row.name">{{ row.name }}</td>
                  <td class="p-3 whitespace-nowrap overflow-hidden text-ellipsis" :title="row.email">{{ row.email }}</td>
                  <td class="p-3 whitespace-nowrap overflow-hidden text-ellipsis" :title="row.phone || ''">{{ row.phone || '' }}</td>
                  <td class="p-3">
                    <span v-if="row.category==='food'" class="px-2 py-0.5 rounded text-xs bg-orange-600/80">FOOD</span>
                    <span v-else-if="row.category==='service'" class="px-2 py-0.5 rounded text-xs bg-blue-600/80">SERVICE</span>
                    <span v-else class="opacity-70">—</span>
                  </td>
                  <td class="p-3 whitespace-nowrap overflow-hidden text-ellipsis" :title="row.owner_email || ''">{{ row.owner_email || '' }}</td>
                  <td class="p-3 whitespace-nowrap overflow-hidden text-ellipsis" :title="new Date(row.created_at).toLocaleString()">{{ new Date(row.created_at).toLocaleString() }}</td>
                  <td class="p-3">
                    <a v-if="row.proof_url" :href="row.proof_url" target="_blank" class="inline-flex items-center gap-1 text-[#FEFAE0] hover:text-white underline underline-offset-2" title="Open proof">
                      <ion-icon :icon="attachOutline"></ion-icon>
                      View
                    </a>
                    <span v-else class="text-white/80 italic">No file</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          <div class="flex items-center justify-center gap-2 mt-4">
            <ion-button size="small" fill="outline" :disabled="page<=1" @click="prevPage" style="--border-color:#DDA15E; --color:#FEFAE0; --border-radius:8px;">Previous</ion-button>
            <div class="text-xs opacity-80">Page {{ page }}</div>
            <ion-button size="small" fill="outline" :disabled="page*pageSize>=total" @click="nextPage" style="--border-color:#DDA15E; --color:#FEFAE0; --border-radius:8px;">Next</ion-button>
          </div>
        </div>
      </div>

      <!-- Settings modal (change password + logout) -->
      <SuperAdminSettings :is-open="settingsOpen" @close="settingsOpen=false" @logout="logout" />
    </ion-content>
  </ion-page>
</template>

<script>
import { IonPage, IonHeader, IonToolbar, IonContent, IonButton, IonIcon, IonSelect, IonSelectOption } from '@ionic/vue';
import { settingsOutline, downloadOutline, searchOutline, attachOutline } from 'ionicons/icons';
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import { adminListBusinesses } from '@/services/api';
import SuperAdminSettings from '@/components/SuperAdminSettings.vue';

export default {
  name: 'SuperAdmin',
  components: { IonPage, IonHeader, IonToolbar, IonContent, IonButton, IonIcon, IonSelect, IonSelectOption, SuperAdminSettings },
  setup() {
    const router = useRouter();
    const rows = ref([]);
    const total = ref(0);
    const page = ref(1);
    const pageSize = ref(20);
    const search = ref('');
    const category = ref('');
    const settingsOpen = ref(false);
    const globalTotal = ref(0);
    const foodCount = ref(0);
    const serviceCount = ref(0);
    const nowText = ref('');
    let timer;

    const tick = () => { nowText.value = new Date().toLocaleString(); };

    const load = async () => {
      const token = localStorage.getItem('token');
      if (!token) { router.replace('/login'); return; }
      const data = await adminListBusinesses({ search: search.value, category: category.value, page: page.value, pageSize: pageSize.value });
      rows.value = data.rows;
      total.value = data.total;
      if (data.global) { globalTotal.value = data.global.total; foodCount.value = data.global.food; serviceCount.value = data.global.service; }
    };

    const applyFilters = () => { page.value = 1; load(); };
    const clearFilters = () => { search.value = ''; category.value = ''; page.value = 1; load(); };
    const prevPage = () => { if (page.value > 1) { page.value--; load(); } };
    const nextPage = () => { if (page.value * pageSize.value < total.value) { page.value++; load(); } };
    const exportAll = async () => {
      // Export all businesses by paging through all results
  const headers = ['Name','Email','Phone','Category','Owner Email','Created'];
      const items = [];
      let p = 1; const ps = 200; let fetched = 0;
      let hasMore = true;
      while (hasMore) {
  const data = await adminListBusinesses({ search: search.value, category: category.value, page: p, pageSize: ps });
  (data.rows || []).forEach(r => items.push([r.name, r.email, r.phone||'', r.category||'', r.owner_email||'', new Date(r.created_at).toLocaleString()]));
        fetched += (data.rows || []).length;
        if (fetched >= data.total || (data.rows || []).length === 0) { hasMore = false; break; }
        p++;
      }
      const csv = [headers, ...items].map(row => row.map(v => '"' + String(v ?? '').replace(/"/g,'""') + '"').join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `registered-businesses-${Date.now()}.csv`;
      document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    };
    const openSettings = () => { settingsOpen.value = true; };
    const logout = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) await fetch('/api/auth/logout', { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } }).catch(()=>{});
      } finally {
        ['token','businessName','businessSlug','role','qrImage','is_admin'].forEach(k => localStorage.removeItem(k));
        router.replace('/login');
      }
    };

    onMounted(() => { tick(); timer = setInterval(tick, 1000); load(); });
    onBeforeUnmount(() => { if (timer) clearInterval(timer); });

    return { rows, total, page, pageSize, search, category, settingsOpen, globalTotal, foodCount, serviceCount, nowText, applyFilters, clearFilters, prevPage, nextPage, exportAll, openSettings, logout, settingsOutline, downloadOutline, searchOutline, attachOutline };
  }
};
</script>

<style scoped>
ion-header, ion-toolbar { --background:#283618 !important; box-shadow:none !important; }
ion-content { --background:#FEFAE0 !important; }
</style>

<style>
.custom-select-outline::part(text) { color:#f8f8f8 !important; }
.custom-select-outline::part(container) { background:transparent !important; }
.custom-select-outline { background:#2d3a22 !important; color:#f8f8f8 !important; border-color:#8fa870 !important; }
.custom-select-outline.ion-focused,
.custom-select-outline.select-expanded { background:#f8f8e8 !important; color:#222 !important; border-color:#8fa870 !important; }
.custom-select-outline.ion-focused::part(text),
.custom-select-outline.select-expanded::part(text) { color:#222 !important; }

</style>
