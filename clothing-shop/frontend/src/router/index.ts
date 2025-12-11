import { createRouter, createWebHistory } from 'vue-router';
import Home from '../views/HomeView.vue';
import Shop from '../views/ShopView.vue';
import Item from '../views/ItemView.vue';
import Login from '../views/LoginView.vue';
import Admin from '../views/AdminView.vue';
import Cart from '../views/CartView.vue';
import { useAuthStore } from '../stores/auth';

const routes = [
  { path: '/', name: 'home', component: Home },
  { path: '/shop', name: 'shop', component: Shop },
  { path: '/item/:id', name: 'item', component: Item },
  { path: '/login', name: 'login', component: Login },
  { path: '/cart', name: 'cart', component: Cart },

  { 
    path: '/admin', 
    name: 'admin', 
    component: Admin,
    meta: { requiresAdmin: true } // protected route
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
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
