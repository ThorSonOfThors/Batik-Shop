<template>
  <nav class="navbar">
    <ul>
      <li><RouterLink to="/">Home</RouterLink></li>
      <li><RouterLink to="/shop">Shop</RouterLink></li>
      <li><RouterLink to="/cart">Cart</RouterLink></li>

      <!-- Admin-only link -->
      <li v-if="auth.isAdmin()">
        <RouterLink to="/admin">Admin</RouterLink>
      </li>

      <!-- Logout for admin -->
      <li v-if="auth.isAdmin()">
        <button @click="logout">Logout</button>
      </li>
    </ul>
  </nav>
</template>

<script setup lang="ts">
import { useAuthStore } from '../stores/auth';

const auth = useAuthStore();

const logout = () => {
  auth.logout();
};
</script>

<style scoped>
.navbar {
  display: flex;
  background: #111;
  padding: 1rem;
}

ul {
  display: flex;
  gap: 1rem;
  list-style: none;
  margin: 0;
  padding: 0;
}

a {
  color: white;
  text-decoration: none;
  font-weight: bold;
}

a.router-link-active {
  border-bottom: 2px solid #fff;
}
</style>
