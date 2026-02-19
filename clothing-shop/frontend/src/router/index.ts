import { createRouter, createWebHistory } from 'vue-router';
import Home from '../views/HomeView.vue';
import Shop from '../views/ShopView.vue';
import Login from '../views/LoginView.vue';
import Admin from '../views/AdminView.vue';
import Cart from '../views/CartView.vue';
import Payment from '@/views/Payment.vue';
import PaymentSuccess from '@/views/PaymentSuccess.vue';
import PaymentFailed from '@/views/PaymentFailed.vue';
import AdminOrders from '../views/AdminOrders.vue'

import { useAuthStore } from '../stores/auth';

const routes = [
  { path: '/', name: 'home', component: Home },
  { path: '/shop', name: 'shop', component: Shop },
  { path: '/login', name: 'login', component: Login },
  { path: '/cart', name: 'cart', component: Cart },
  { path: '/payment', name: 'payment', component: Payment },
  { path: '/payment-success', name: 'payment-sucess', component: PaymentSuccess },
  { path: '/payment-fail', name: 'payment-fail', component: PaymentFailed },

  { 
    path: '/admin', 
    name: 'admin', 
    component: Admin,
    meta: { requiresAdmin: true }
  },

  { 
    path: '/adminOrders', 
    name: 'Admin Orders', 
    component: AdminOrders,
    meta: { requiresAdmin: true }
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,

  // ✅ PREVENT SCROLL SNAP DURING PAGE TRANSITIONS
  scrollBehavior(to, from, savedPosition) {
    // browser back/forward → restore scroll
    if (savedPosition) {
      return savedPosition
    }

    // normal navigation → keep current scroll position
    return false
  },
});

// Global guard using real Pinia auth state
router.beforeEach((to, from, next) => {
  const auth = useAuthStore()
  const storedUser = localStorage.getItem('user')
  if (storedUser && !auth.user) {
    auth.user = JSON.parse(storedUser)
  }

  if (to.meta.requiresAdmin && !auth.isAdmin()) {
    return next('/login')
  }
  next()
})

export default router;
