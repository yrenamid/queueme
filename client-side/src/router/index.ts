import { createRouter, createWebHistory } from '@ionic/vue-router';
import { RouteRecordRaw } from 'vue-router';
import FrontPage from '../views/FrontPage.vue';
import Register from  '../views/RegisterBusiness.vue';
import Login from '../views/Login.vue';
import Dashboard from '../views/Dashboard.vue'
import CustomerFoodBased from '../views/CustomerFoodBased.vue'
import CustomerServiceBased from '../views/CustomerServiceBased.vue'
import SuperAdmin from '../views/SuperAdmin.vue'

// Handles CustomerLanding
const CustomerLanding = () => import('../views/CustomerLanding.vue');

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    redirect: '/home'
  },
  {
    path: '/home',
    name: 'Home',
    component: FrontPage
  },
  {
    path: '/register',
    name: 'Register',
    component: Register
  },
  {
    path: '/login',
    name: 'Login',
    component: Login
  },
  {
    path: '/dashboard/:slug',
    name: 'Dashboard',
    component: Dashboard,
    meta: { requiresAuth: true }
  },
  {
    path: '/customer/food/:business_id',
    name: 'CustomerFoodBased',
    component: CustomerFoodBased
  },
  {
    path: '/customer/service/:business_id',
    name: 'CustomerServiceBased',
    component: CustomerServiceBased
  },
  {
    path: '/customer/:slug',
    name: 'CustomerLanding',
    component: CustomerLanding
  },
  {
    path: '/super-admin',
    name: 'SuperAdmin',
    component: SuperAdmin,
    meta: { requiresAuth: true }
  },
]

const router = createRouter({
  history: createWebHistory(((import.meta as any)?.env?.BASE_URL) || '/'),
  routes
});


router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token');
  const isAuthRoute = to.matched.some(r => r.meta.requiresAuth);


  if (isAuthRoute && !token) {
    return next({ path: '/login', replace: true, query: { redirect: to.fullPath } });
  }

  // Admin-only route guard
  if (to.path === '/super-admin') {
    const isAdmin = localStorage.getItem('is_admin');
    if (!token || String(isAdmin) !== '1') {
      return next({ path: '/login', replace: true });
    }
  }


  if (to.path === '/login') {
    if (token) {
      const slug = localStorage.getItem('businessSlug');
      if (slug) return next({ path: `/dashboard/${slug}`, replace: true });
    }
    return next();
  }

  if (token && (to.path === '/food-based-dashboard' || to.path === '/service-based-dashboard')) {
    const slug = localStorage.getItem('businessSlug');
    if (slug) return next({ path: `/dashboard/${slug}`, replace: true });
    return next({ path: '/login', replace: true });
  }



  next();
});

export default router
