import { ref, onMounted, onBeforeUnmount } from 'vue';
import router from '@/router';
import { getSettings, getQueueSummary as apiGetQueueSummary, getOverviewMetrics as apiGetOverviewMetrics } from '@/services/api';



// Handles use Admin Dashboard
export function useAdminDashboard(options?: { defaultTab?: string }) {
  const currentTime = ref('');
  const activeTab = ref(options?.defaultTab || 'overview');
  const businessName = ref(localStorage.getItem('businessName') || '');
  const role = ref(localStorage.getItem('role') || '');


// Handles hydrate Role From Token
  function hydrateRoleFromToken() {
    try {
      if (role.value) return;
      const token = localStorage.getItem('token');
      if (!token) return;
      const parts = token.split('.');
      if (parts.length < 2) return;
      const payload = JSON.parse(atob(parts[1].replace(/-/g,'+').replace(/_/g,'/')));
      if (payload && typeof payload.role === 'string' && payload.role) {
        role.value = payload.role;
        try {
          localStorage.setItem('role', payload.role);
        } catch (err) {
        //safe to ignore
          console.debug('[admin] persist role failed', err);
        }
      }
    } catch (err) {
      console.debug('[admin] hydrateRoleFromToken failed', err);
    }
  }


  const showNotifications = ref(false);
  const showSettings = ref(false);
  const showQRCode = ref(false);
  


  const showCurrentOverview = ref(true);
  const showOverview1 = ref(true);
  const showChart = ref(true);
  const showMenu = ref(true); // Only in food-based
  const showServices = ref(true); // Only in service-based

  const qrCodeDataUrl = ref('');

  const queueSummary = ref<{ inQueue?: number; avgWait?: number; completedToday?: number; cancelled?: number } | null>(null);
  const overviewMetrics = ref<{ totalCustomers: number; avgWait: number; completedToday: number; cancelledToday: number } | null>(null);


  const settingsSummary = ref<{ maxQueueLength?: number; reserveSlots?: number; notifyCustomer?: boolean } | null>(null);
  const settingsLoading = ref(false);
  const settingsError = ref<string | null>(null);


// Handles load Settings Summary
  async function loadSettingsSummary() {
    settingsLoading.value = true;
    settingsError.value = null;
    try {
      if ((role.value || '').toLowerCase() === 'cashier') {
        settingsSummary.value = null;
        return;
      }
      const data = await getSettings();
      settingsSummary.value = {
        maxQueueLength: data.max_queue_length,
        reserveSlots: data.reserve_slots,
        notifyCustomer: data.notify_customer
      };
    } catch (e: any) {
      settingsError.value = e.message || 'Failed to load settings';
    } finally {
      settingsLoading.value = false;
    }
  }

  let intervalId: any;
  let summaryTimer: any;

  function updateTime() {
    currentTime.value = new Date().toLocaleString();
  }


  const closePopover = () => {
    const popover = document.querySelector('ion-popover') as any;
    if (popover) popover.dismiss();
  };


  const handleShowQrCode = () => { showQRCode.value = true; };
  
  const notifications = () => { closePopover(); showNotifications.value = true; };

  const settings = () => { closePopover(); showSettings.value = true; };


  const logout = async () => {
    closePopover();
    try {
      const token = localStorage.getItem('token');
      if (token) {
        await fetch('/api/auth/logout', { method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } }).catch(()=>{});
      }
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('businessName');
      localStorage.removeItem('role');
      localStorage.removeItem('qrImage');
      router.replace('/login');
    }
  };


  async function refreshQueueSummary() {
    try {
      const s = await apiGetQueueSummary();
      queueSummary.value = s;
    } catch (e) {
      console.debug('[admin] refreshQueueSummary failed', e);
    }
  }

  async function refreshOverviewMetrics() {
    try {
      if ((role.value || '').toLowerCase() === 'cashier') return;
      const m = await apiGetOverviewMetrics();
      overviewMetrics.value = m;
    } catch (e) {
      console.debug('[admin] refreshOverviewMetrics failed', e);
    }
  }


  hydrateRoleFromToken();

  onMounted(() => {
    hydrateRoleFromToken();
    updateTime();
    intervalId = setInterval(updateTime, 1000);
    const r = (role.value || '').toLowerCase();
    if (r !== 'cashier') {
      loadSettingsSummary();
      refreshOverviewMetrics();
      summaryTimer = setInterval(() => { refreshQueueSummary(); refreshOverviewMetrics(); }, 20000);
    } else {
      summaryTimer = setInterval(() => { refreshQueueSummary(); }, 20000);
    }
    refreshQueueSummary();
  });
  onBeforeUnmount(() => { clearInterval(intervalId); clearInterval(summaryTimer); });

  return {

    currentTime,
    activeTab,
    businessName,
    role,
    showNotifications,
    showSettings,
    showQRCode,
    
    showCurrentOverview,
    showOverview1,
    showChart,
    showMenu,
    showServices,
    qrCodeDataUrl,
    queueSummary,
    settingsSummary,
    overviewMetrics,
    settingsLoading,
    settingsError,

    handleShowQrCode,
    
    notifications,
    settings,
    logout,
    loadSettingsSummary
  };
}

export default useAdminDashboard;
