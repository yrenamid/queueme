<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <div class="logo flex items-center justify-between mx-3">
          <div class="name flex justify-center items-center float-start">
            <img
              class="h-10 w-10 me-2"
              src="../images/favicon.png"
              alt="logo"
            />
            <p class="fname">{{ businessName }}</p>
          </div>
          <div class="text-[#1f2937] bg-white/80 px-2 py-0.5 rounded-sm border border-gray-200 shadow-sm">
            {{ currentTime }}
          </div>
          <div class="flex justify-center items-center gap-2">
            <div
              class="flex justify-center items-center border p-0.2 rounded-sm"
            >
              <ion-button
                @click="handleShowQrCode"
                fill="clear"
                class="normal-case"
              >
                <font-awesome-icon
                  :icon="['fas', 'qrcode']"
                  class="text-xl text-black me-2"
                />
                Show QRCode</ion-button
              >
            </div>
            
            <div>
              <div class="mx-2" id="click-trigger">
                <font-awesome-icon
                  :icon="['fas', 'gear']"
                  class="text-2xl text-black cursor-pointer"
                />
              </div>
              <ion-popover trigger="click-trigger" trigger-action="click">
                <ion-content>
                  <p class="px-3 py-2 font-bold text-lg text-[#283618]">
                    My Account
                  </p>
                  <div v-if="role!=='cashier'" class="border-b border-t text-[#283618]">
                    <ion-button
                      @click="notifications"
                      fill="clear"
                      class="normal-case w-full py-1"
                    >
                      <font-awesome-icon :icon="['fas', 'bell']" class="me-3" />
                      Notifications Settings
                    </ion-button>
                    <ion-button v-if="role==='owner' || role==='manager'"
                      @click="settings"
                      fill="clear"
                      class="normal-case w-full py-1"
                    >
                      <font-awesome-icon
                        :icon="['fas', 'users']"
                        class="me-3"
                      />
                      Staff/Queue Settings
                    </ion-button>
                  </div>
                  <ion-button
                    @click="logout"
                    fill="clear"
                    class="normal-case w-full py-1"
                  >
                    <font-awesome-icon
                      :icon="['fas', 'arrow-right-from-bracket']"
                      class="me-3"
                    />
                    Logout
                  </ion-button>
                </ion-content>
              </ion-popover>
            </div>
          </div>
        </div>
      </ion-toolbar>
    </ion-header>
    <ion-content fullscreen>
      <p class="text-[#283618] text-2xl font-bold mx-3 mt-3">Dashboard</p>
      <div class="mx-3">
        <ion-segment class="w-full md:w-3/4 mt-2 bg-[#4B5D0E29] rounded-sm p-1">
          <ion-segment-button
            @click="activeTab = 'overview'"
            :class="[
              activeTab === 'overview'
                ? 'rounded-sm bg-white font-bold text-[#283618]'
                : 'font-medium text-[#283618]/80 hover:text-[#283618] hover:bg-white/60 border border-transparent hover:border-white rounded-sm',
            ]"
            style="--indicator-color: transparent"
          >
            <ion-label>Overview</ion-label>
          </ion-segment-button>
          <ion-segment-button
            @click="activeTab = 'queueManagement'"
            :class="[
              activeTab === 'queueManagement'
                ? 'rounded-sm bg-white font-bold text-[#283618]'
                : 'font-medium text-[#283618]/80 hover:text-[#283618] hover:bg-white/60 border border-transparent hover:border-white rounded-sm',
            ]"
            style="--indicator-color: transparent"
          >
            <ion-label>Queue Management</ion-label>
          </ion-segment-button>
          <ion-segment-button v-if="role!=='cashier'"
            @click="activeTab = 'menu'"
            :class="[
              activeTab === 'menu'
                ? 'rounded-sm bg-white font-bold text-[#283618]'
                : 'font-medium text-[#283618]/80 hover:text-[#283618] hover:bg-white/60 border border-transparent hover:border-white rounded-sm',
            ]"
            style="--indicator-color: transparent"
          >
            <ion-label>Menu</ion-label>
          </ion-segment-button>
          <ion-segment-button v-if="role!=='cashier'"
            @click="activeTab = 'analytics'"
            :class="[
              activeTab === 'analytics'
                ? 'rounded-sm bg-white font-bold text-[#283618]'
                : 'font-medium text-[#283618]/80 hover:text-[#283618] hover:bg-white/60 border border-transparent hover:border-white rounded-sm',
            ]"
            style="--indicator-color: transparent"
          >
            <ion-label>Analytics</ion-label>
          </ion-segment-button>
        </ion-segment>
      </div>

      <div v-if="activeTab === 'overview'">
        <div class="mx-3">
          <Overview1 v-show="showOverview1" :metrics="overviewMetrics || { totalCustomers: overviewSummary.totalCustomers, avgWait: overviewSummary.avgWait, completedToday: overviewSummary.completedToday, cancelledToday: overviewSummary.cancelledToday }" />
          <div v-if="webhookBlink" class="mt-2 text-xs px-2 py-1 inline-flex items-center gap-2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span>Online payment verified via webhook</span>
            <span class="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
          </div>
          <div class="mt-4" v-if="settingsSummary">
            <div class="border border-gray-200 rounded-sm p-3 bg-[#f8f8f8] text-[#283618] text-xs flex gap-6 flex-wrap">
              <div><span class="font-semibold">Max Queue:</span> {{ settingsSummary.maxQueueLength }}</div>
              <div><span class="font-semibold">Reserve Slots:</span> {{ settingsSummary.reserveSlots }}</div>
              <div><span class="font-semibold">Notify Customer:</span> {{ settingsSummary.notifyCustomer ? 'Yes' : 'No' }}</div>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-3 gap-3 mx-3 mb-5">
          <CurrentOverview v-show="showCurrentOverview" :settings-summary="settingsSummary" @summary="onOverviewSummary" @baselines="onBaselines" />
          <RecentActivity />
        </div>
      </div>

      <div v-else-if="activeTab === 'queueManagement'">
        <div class="mx-3 mb-2" v-if="settingsSummary">
          <p class="text-[11px] text-gray-500">Configured Max: <strong>{{ settingsSummary.maxQueueLength }}</strong> | Reserve Slots: <strong>{{ settingsSummary.reserveSlots }}</strong> | Notify: <strong>{{ settingsSummary.notifyCustomer ? 'On' : 'Off' }}</strong></p>
        </div>
        <div class="grid grid-cols-3 my-5 mx-3 gap-4">
          
          <div class="col-span-3 lg:col-span-1" id="poppins">
            <div class="rounded-lg border border-gray-200 bg-white p-4">
              <p class="text-2xl font-semibold text-[#283618] mb-3">Queue Summary</p>
              <div class="grid grid-cols-2 gap-3">
                <div class="rounded-lg p-4 bg-[#FFFCDF] border border-[#f0eec6] text-center text-[#283618]">
                  <p class="font-semibold mb-2">In Queue</p>
                  <div class="flex items-center justify-center gap-2 text-3xl font-bold">
                    <font-awesome-icon :icon="['fas','users']" />
                    <span>{{ (queueSummary && queueSummary.inQueue) ?? overviewSummary.totalCustomers }}</span>
                  </div>
                </div>
                <div class="rounded-lg p-4 bg-[#FFFCDF] border border-[#f0eec6] text-center text-[#283618]">
                  <p class="font-semibold mb-2">Cancelled</p>
                  <div class="flex items-center justify-center gap-2 text-3xl font-bold">
                    <font-awesome-icon :icon="['fas','circle-dot']" />
                    <span>{{ (queueSummary && queueSummary.cancelled) ?? overviewSummary.cancelledToday }}</span>
                  </div>
                </div>
                <div class="rounded-lg p-4 bg-[#FFFCDF] border border-[#f0eec6] text-center text-[#283618]">
                  <p class="font-semibold mb-2">Avg Wait</p>
                  <div class="flex items-center justify-center gap-2 text-2xl font-bold">
                    <font-awesome-icon :icon="['fas','clock']" />
                    <span>{{ (queueSummary && queueSummary.avgWait) ?? overviewSummary.avgWait }}</span>
                  </div>
                </div>
                <div class="rounded-lg p-4 bg-[#FFFCDF] border border-[#f0eec6] text-center text-[#283618]">
                  <p class="font-semibold mb-2">Completed</p>
                  <div class="flex items-center justify-center gap-2 text-3xl font-bold">
                    <font-awesome-icon :icon="['fas','check']" />
                    <span>{{ (queueSummary && queueSummary.completedToday) ?? overviewSummary.completedToday }}</span>
                  </div>
                </div>
              </div>
              <div class="mt-4">
                <ion-button expand="block" class="normal-case bg-[#283618] hover:opacity-90" @click="showCallModal = true">
                  <font-awesome-icon :icon="['fas','bell']" class="me-2" />
                  CALL NEXT CUSTOMER
                </ion-button>
              </div>
            </div>
          </div>
          
          <CurrentOverview v-show="showCurrentOverview" :settings-summary="settingsSummary" @summary="onOverviewSummary" @baselines="onBaselines" />
        </div>
      </div>

      <div v-else-if="activeTab === 'menu'">
        <AdminMenu v-show="showMenu" />
      </div>

      <div v-else-if="activeTab === 'analytics'">
        <Analytics v-show="showChart" />
      </div>

      <Notifications
        v-if="showNotifications"
        :isOpen="showNotifications"
        @close="showNotifications = false"
      />

      <Settings
        v-if="showSettings"
        :isOpen="showSettings"
        @close="showSettings = false"
      />

      <QRModal
        v-if="showQRCode"
        :is-open="showQRCode"
        @close="showQRCode = false"
      />

      

      <CallCustomersModal
        v-if="showCallModal"
        :is-open="showCallModal"
        :is-service-based="false"
        :baselines="baselines"
        @close="showCallModal = false"
        @called="onCalled"
      />
    </ion-content>
  </ion-page>
</template>

<script>

import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonLabel,
  IonSegment,
  IonSegmentButton,
  IonContent,
  IonButton,
  IonPopover,
} from "@ionic/vue";
import CurrentOverview from "../components/CurrentOverviewTable.vue";
import MenuComponent from "../components/Menu.vue";
import Overview1 from "../components/Overview1.vue";
import Analytics from "../components/Analytics.vue";
import QRModal from "../components/QRModal.vue";
import Notifications from "../components/AdminNotification.vue";
import RecentActivity from "../components/RecentActivity.vue";
import Settings from "../components/AdminSettings.vue";
 
import CallCustomersModal from "@/components/CallCustomersModal.vue";
import { ref, watch, computed } from "vue";
import { useAdminDashboard } from "@/composables/useAdminDashboard";
import { connectRealtime, onRealtime } from "@/composables/useRealtime";

export default {

  name: "AdminDashboard",
  components: {

    IonPage,
    IonHeader,
    IonToolbar,
    IonLabel,
    IonSegment,
    IonSegmentButton,
  CurrentOverview,
  AdminMenu: MenuComponent,
    Overview1,
    IonContent,
    IonButton,
    IonPopover,
    QRModal,
    Notifications,
    Settings,
  Analytics,
  RecentActivity,
    
    CallCustomersModal,
  },

  setup() {

    const {
      currentTime,
      activeTab,
      businessName,
      role,
      showCurrentOverview,
      showMenu,
      showOverview1,
      showChart,
      showQRCode,
      
      qrCodeDataUrl,
      showNotifications,
      showSettings,
      notifications,

      settings,

      handleShowQrCode,

      

      queueSummary,

      logout,
      settingsSummary,
      loadSettingsSummary
    } = useAdminDashboard();
  const overviewSummary = ref({ totalCustomers: 0, avgWait: 0, completedToday: 0, cancelledToday: 0 })

  function onOverviewSummary(s) { overviewSummary.value = s || overviewSummary.value }


  const overviewMetrics = computed(() => ({
    totalCustomers: overviewSummary.value.totalCustomers,
    avgWait: overviewSummary.value.avgWait,
    completedToday: overviewSummary.value.completedToday,
    cancelledToday: overviewSummary.value.cancelledToday,
  }));

  const baselines = ref({});

  function onBaselines(b) { baselines.value = b || {}; }


    try {

      const savedAdminTab = typeof window !== 'undefined' ? localStorage.getItem('adminActiveTab') : null;

      const allowed = (role.value === 'cashier') ? ['overview','queueManagement'] : ['overview','queueManagement','menu','analytics'];

      if (savedAdminTab && allowed.includes(savedAdminTab)) activeTab.value = savedAdminTab;
      else activeTab.value = allowed[0];
  } catch (e) { console.debug('[food-admin] failed to access localStorage for adminActiveTab', e); }
    watch(activeTab, (tab) => {
  try { localStorage.setItem('adminActiveTab', tab); } catch (e) { console.debug('[food-admin] could not persist adminActiveTab', e); }
    });
    const showCallModal = ref(false);
    const webhookBlink = ref(false);
  try { connectRealtime(); } catch (err) { console.debug('[food-admin] realtime connect failed', err); }
    try {
      onRealtime('payment:webhook', (ev) => {

        try {
          const myBiz = Number(localStorage.getItem('businessId') || '0');
          if (ev && Number(ev.business_id) === myBiz) {
            webhookBlink.value = true;
            setTimeout(() => { webhookBlink.value = false; }, 3000);
          }
  } catch(err) { console.debug('[food-admin] operation failed', err); }
      });
  } catch (err) { console.debug('[food-admin] error during cleanup', err); }

    const onCalled = () => {

    };


    return {

      currentTime,
      activeTab,
      businessName,
      role,
      showCurrentOverview,
      showMenu,
      showOverview1,
      showChart,
      showQRCode,
      
      qrCodeDataUrl,
      showNotifications,
      showSettings,
      notifications,
      settings,
      handleShowQrCode,
      
  queueSummary,
  overviewMetrics,
      logout,
      settingsSummary,
      loadSettingsSummary,
      showCallModal,
      onCalled,
      overviewSummary,
      onOverviewSummary,
      baselines,
      onBaselines,
      webhookBlink,
    };
  },
};
</script>

<style scoped>
ion-toolbar {
  --background: white !important;
}
ion-content {
  --background: white !important;
}
.fname {
  color: #283618;
}
.sname {
  color: #bc6c25;
}
</style>
