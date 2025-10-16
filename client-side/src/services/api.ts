import axios from 'axios';


// Handles API_BASE
const API_BASE = (import.meta as any)?.env?.VITE_API_BASE || '/api';
console.log('[api] base URL =', API_BASE);

const api = axios.create({ baseURL: API_BASE });


api.interceptors.request.use((config: any) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});



// Handles register Business
export async function registerBusiness(payload: any) {
  try {
    const isFormData = typeof FormData !== 'undefined' && payload instanceof FormData;
    const config: any = { timeout: 10000 };
    if (isFormData) {
      config.headers = { 'Content-Type': 'multipart/form-data' };
    }
    const { data } = await api.post('/auth/register', payload, config);
    if (data.success && data.data) {
      return data.data;
    }
    throw new Error(data.message || 'Registration failed');
  } catch (err: any) {
    if (err.response) {
      throw new Error(`Server ${err.response.status}: ${err.response.data?.message || 'Error'}`);
    } else if (err.request) {
      throw new Error('No response from server (network/CORS/timeout). Check backend URL and CORS.');
    } else {
      throw new Error(err.message || 'Unknown error');
    }
  }
}



// Handles login
export async function login(email: string, password: string) {
  try {
    const { data } = await api.post('/auth/login', { email, password }, { timeout: 10000 });
    if (data.success) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('businessName', data.user.businessName);
      if (data.user?.category) localStorage.setItem('businessCategory', data.user.category);
      if (data.user?.business_id) localStorage.setItem('businessId', String(data.user.business_id));
      if (data.user?.slug) localStorage.setItem('businessSlug', String(data.user.slug));
      if (data.user?.role) localStorage.setItem('role', String(data.user.role));
      if (data.user?.is_admin != null) localStorage.setItem('is_admin', String(data.user.is_admin ? 1 : 0));
      if (data.qr?.qr_code_img) localStorage.setItem('qrImage', data.qr.qr_code_img);
      if (data.qr?.qr_code_url) localStorage.setItem('qrUrl', data.qr.qr_code_url);
      return data;
    }
    throw new Error(data.message || 'Login failed');
  } catch (err: any) {
    if (err.response) {
      throw new Error(`Server ${err.response.status}: ${err.response.data?.message || 'Error'}`);
    } else if (err.request) {
      throw new Error('No response from server (network/CORS/timeout). Check backend URL and CORS.');
    } else {
      throw new Error(err.message || 'Unknown error');
    }
  }
}



export function getStoredQR() { return localStorage.getItem('qrImage'); }


export function getStoredBusinessName() { return localStorage.getItem('businessName'); }


export function getStoredBusinessCategory() { return localStorage.getItem('businessCategory'); }



export async function fetchPublicQR(slug: string) {
  const { data } = await api.get(`/public/businesses/${slug}/qrcode`);
  return data;
}



export async function fetchPublicBusinessById(business_id: number) {
  const { data } = await api.get(`/public/businesses/id/${business_id}`);
  if (data.success) return data.data as { business_id: number; name: string; category: string; slug?: string };
  throw new Error(data.message || 'Failed to load business');
}



export async function fetchPublicMenu(business_id: number) {
  const { data } = await api.get('/public/menu', { params: { business_id, _t: Date.now() } });
  if (data.success) return data.data as Array<{ id: number; name: string; description?: string; price: number; category?: string; duration?: number; is_available: boolean }>;
  throw new Error(data.message || 'Failed to load menu');
}



export async function fetchPublicServices(business_id: number) {
  const { data } = await api.get('/public/services', { params: { business_id, _t: Date.now() } });
  if (data.success) return data.data as Array<{ id: number; name: string; description?: string; price: number; duration?: number; is_available: boolean }>;
  throw new Error(data.message || 'Failed to load services');
}



// Handles public Join Queue
export async function publicJoinQueue(payload: { business_id: number; customer_name: string; customer_email?: string; customer_phone?: string; party_size?: number; order_items?: any[]; order_total?: number; notes?: string; }) {
  const { data } = await api.post('/public/join', payload);
  if (data.success) return data.data as { id: number; queue_number: number };
  throw new Error(data.message || 'Failed to join queue');
}



export async function fetchPublicQueueLive(business_id: number) {
  const { data } = await api.get('/public/queue-live', { params: { business_id, _t: Date.now() } });
  if (data.success) return data.data as { inQueue: number; nowServing: number };
  throw new Error(data.message || 'Failed to load queue live');
}



export async function fetchPublicMyStatus(params: { business_id: number; id?: number; queue_number?: number; }) {
  const { business_id, id, queue_number } = params;
  const qp: any = { business_id, _t: Date.now() };
  if (id != null) qp.id = id;
  if (queue_number != null) qp.queue_number = queue_number;
  const { data } = await api.get('/public/my-status', { params: qp });
  if (data.success) return data.data as { id: number; queue_number: number; status: string; payment_status: string; estimated_wait_time: number; ahead: number; order_total: number };
  throw new Error(data.message || 'Failed to load my status');
}



// Handles request More Time
export async function requestMoreTime(payload: { business_id: number; id?: number; queue_number?: number; minutes: 2|4|6|8|10 }) {
  const { data } = await api.post('/public/request-more-time', payload);
  if (data.success) return data.data as { id: number; queue_number: number; estimated_wait_time: number };
  throw new Error(data.message || 'Failed to request more time');
}



// Handles initiate Payment
export async function initiatePayment(payload: { business_id: number; id?: number; queue_number?: number; customer_name?: string; customer_email?: string; customer_phone?: string }) {
  const { data } = await api.post('/public/pay/initiate', payload);
  if (data.success) return data.data as { payment_url: string; amount: number };
  throw new Error(data.message || 'Failed to initiate payment');
}



export async function getSettings() {
  const { data } = await api.get('/settings');
  if (data.success) return data.data;
  throw new Error(data.message || 'Failed to load settings');
}



export async function updateSettings(payload: any) {
  const { data } = await api.put('/settings', payload);
  if (data.success) return true;
  throw new Error(data.message || 'Failed to update settings');
}



export async function getNotificationSettings() {
  const { data } = await api.get('/notifications/settings');
  if (data.success) return data.data;
  throw new Error(data.message || 'Failed to load notification settings');
}



export async function updateNotificationSettings(payload: any) {
  const { data } = await api.put('/notifications/settings', payload);
  if (data.success) return true;
  throw new Error(data.message || 'Failed to update notification settings');
}



export async function getStaffList() {
  const { data } = await api.get('/staff');
  if (data.success) return data.data || [];
  throw new Error(data.message || 'Failed to load staff');
}



export async function createStaff(payload: { name: string; email: string; password: string; role: string; }) {
  const { data } = await api.post('/staff', payload);
  if (data.success) return data.data;
  throw new Error(data.message || 'Failed to create staff');
}



export async function updateStaff(id: number, payload: { name?: string; email?: string; password?: string; role?: string; }) {
  const { data } = await api.put(`/staff/${id}`, payload);
  if (data.success) return data.data;
  throw new Error(data.message || 'Failed to update staff');
}



export async function deleteStaff(id: number) {
  const { data } = await api.delete(`/staff/${id}`);
  if (data.success) return true;
  throw new Error(data.message || 'Failed to delete staff');
}


export interface MenuItemPayload {
  name: string;
  description?: string;
  price: number|string;
  category?: string|null;
  duration?: number|string|null;
  available?: boolean;
  is_available?: boolean;
}



export async function getMenuItems() {
  const { data } = await api.get('/menu');
  if (data.success) return data.data || [];
  throw new Error(data.message || 'Failed to load menu');
}



export async function createMenuItem(payload: MenuItemPayload) {
  const { data } = await api.post('/menu', payload);
  if (data.success) return data.data;
  throw new Error(data.message || 'Failed to create menu item');
}



export async function updateMenuItem(id: number, payload: Partial<MenuItemPayload>) {
  const { data } = await api.put(`/menu/${id}`, payload);
  if (data.success) return data.data;
  throw new Error(data.message || 'Failed to update menu item');
}



export async function deleteMenuItem(id: number) {
  const { data } = await api.delete(`/menu/${id}`);
  if (data.success) return true;
  throw new Error(data.message || 'Failed to delete menu item');
}


export interface ServicePayload {
  name: string;
  description?: string;
  price: number|string;
  duration?: number|string|null;
  available?: boolean;
  is_available?: boolean;
}



export async function getServices() {
  const { data } = await api.get('/services');
  if (data.success) return data.data || [];
  throw new Error(data.message || 'Failed to load services');
}



export async function createService(payload: ServicePayload) {
  const { data } = await api.post('/services', payload);
  if (data.success) return data.data;
  throw new Error(data.message || 'Failed to create service');
}



export async function updateService(id: number, payload: Partial<ServicePayload>) {
  const { data } = await api.put(`/services/${id}`, payload);
  if (data.success) return data.data;
  throw new Error(data.message || 'Failed to update service');
}



export async function deleteService(id: number) {
  const { data } = await api.delete(`/services/${id}`);
  if (data.success) return true;
  throw new Error(data.message || 'Failed to delete service');
}


export interface QueueItem {
  id?: number;
  name: string;
  price: number | string;
  quantity: number;
}


export interface JoinQueuePayload {
  customer_name: string;
  customer_email?: string | null;
  customer_phone?: string | null;
  party_size?: number | null;
  order_items: QueueItem[];
  order_total: number;
  is_priority?: boolean;
  notes?: string | null;
}



export async function listQueue(params?: { status?: string | string[] }) {
  const query: any = {};
  if (params?.status) query.status = Array.isArray(params.status) ? params.status.join(',') : params.status;

  query._t = Date.now();
  const { data } = await api.get('/queue', { params: query });
  if (data.success) return data.data || [];
  throw new Error(data.message || 'Failed to load queue');
}



export async function joinQueue(payload: JoinQueuePayload) {
  const { data } = await api.post('/queue/join', payload);
  if (data.success) return data.data;
  throw new Error(data.message || 'Failed to join queue');
}



export async function updateQueueDetails(id: number, payload: Partial<JoinQueuePayload>) {
  const { data } = await api.put(`/queue/${id}`, payload);
  if (data.success) return true;
  throw new Error(data.message || 'Failed to update order');
}



export async function approvePayment(id: number, payment_method: 'cash' | 'online' = 'cash') {
  const { data } = await api.patch(`/queue/${id}/status`, { status: 'waiting', payment_status: 'paid', payment_method });
  if (data.success) return true;
  throw new Error(data.message || 'Failed to approve payment');
}



export async function cancelOrder(id: number) {
  const { data } = await api.patch(`/queue/${id}/status`, { status: 'cancelled' });
  if (data.success) return true;
  throw new Error(data.message || 'Failed to cancel order');
}


export async function updateQueueStatus(
  id: number,
  payload: { status?: 'pending' | 'waiting' | 'called' | 'pending_payment' | 'served' | 'cancelled' | 'delayed'; payment_status?: 'pending' | 'paid' | 'cancelled'; payment_method?: 'cash' | 'online' }
) {
  const { data } = await api.patch(`/queue/${id}/status`, payload);
  if (data.success) return true;
  throw new Error(data.message || 'Failed to update queue status');
}



export async function listWaitingPaid() {
  const { data } = await api.get('/queue', { params: { status: 'waiting,delayed' } });
  if (data.success) {
    // Handles rows
    const rows = (data.data || []) as any[];
    return rows.filter(r => String(r.payment_status).toLowerCase() === 'paid');
  }
  throw new Error(data.message || 'Failed to load waiting queue');
}



export async function callSelected(ids: number[]) {
  const { data } = await api.post('/queue/call-selected', { ids });
  if (data.success) return data.data as { updated: number[]; skipped: number[] };
  throw new Error(data.message || 'Failed to call selected');
}

export default api;



export async function getQueueSummary() {
  const { data } = await api.get('/analytics/queue-summary', { params: { _t: Date.now() } });
  if (data.success) return data.data as { inQueue: number; avgWait: number; completedToday: number; cancelled: number };
  throw new Error(data.message || 'Failed to load queue summary');
}


// Admin endpoints
export async function adminListBusinesses(params: { search?: string; category?: string; page?: number; pageSize?: number }) {
  const { data } = await api.get('/admin/businesses', { params: { ...params, _t: Date.now() } });
  if (data.success) return data.data as { total: number; page: number; pageSize: number; rows: any[]; global?: { total: number; food: number; service: number } };
  throw new Error(data.message || 'Failed to load admin businesses');
}

export async function getAdminProfile() {
  const { data } = await api.get('/admin/profile');
  if (data.success) return data.data as { id: number; name: string; email: string };
  throw new Error(data.message || 'Failed to load admin profile');
}

export async function updateAdminProfile(payload: { name?: string; password?: string; current_password?: string }) {
  const { data } = await api.put('/admin/profile', payload);
  if (data.success) return true;
  throw new Error(data.message || 'Failed to update admin profile');
}


export async function getOverviewMetrics() {
  const { data } = await api.get('/analytics/overview', { params: { _t: Date.now() } });
  if (data.success) return data.data as { totalCustomers: number; avgWait: number; completedToday: number; cancelledToday: number };
  throw new Error(data.message || 'Failed to load overview metrics');
}



export async function getRecentActivity() {
  const { data } = await api.get('/analytics/recent-activity', { params: { _t: Date.now() } });
  if (data.success) return data.data as Array<{ id: number; queue_number: number; customer_name?: string; text: string; time: number }>;
  throw new Error(data.message || 'Failed to load recent activity');
}



export async function regenerateQR() {
  const { data } = await api.post('/qr/regenerate');
  if (data.success) return data.data as { url: string; image: string };
  throw new Error(data.message || 'Failed to regenerate QR');
}

// Forgot/Reset Password (businesses)
export async function forgotPassword(email: string) {
  const { data } = await api.post('/auth/forgot-password', { email });
  if (data.success) return true;
  throw new Error(data.message || 'Failed to request reset');
}

export async function resetPassword(token: string, newPassword: string) {
  const { data } = await api.post('/auth/reset-password', { token, newPassword });
  if (data.success) return true;
  throw new Error(data.message || 'Failed to reset password');
}


export async function changePassword(current_password: string, new_password: string) {
  const { data } = await api.post('/auth/change-password', { current_password, new_password });
  if (data.success) return true;
  throw new Error(data.message || 'Failed to change password');
}


export interface FeedbackItem {
  id: number;
  queue_id: number;
  queue_number: number;
  customer_name?: string;
  rating: number;
  comment?: string|null;
  created_at: string;
}



export async function submitFeedback(payload: { business_id: number; queue_id: number; rating: number; comment?: string|null; }) {
  const { data } = await api.post('/feedback', payload);
  if (data.success) return true;
  throw new Error(data.message || 'Failed to submit feedback');
}



export async function getBusinessFeedback(businessId: number) {
  const { data } = await api.get(`/feedback/${businessId}`, { params: { _t: Date.now() } });
  if (data.success) return data.data as { list: FeedbackItem[]; stats: { avg: number; total: number } };
  throw new Error(data.message || 'Failed to load feedback');
}
