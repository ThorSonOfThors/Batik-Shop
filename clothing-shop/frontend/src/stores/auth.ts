// src/stores/auth.ts
import { defineStore } from 'pinia';
import { ref } from 'vue';
import axios from 'axios';

axios.defaults.withCredentials = true;

const BASE_URL = import.meta.env.VITE_API_URL; 

export const useAuthStore = defineStore('auth', () => {
  const user = ref<{ username: string; role: string } | null>(null);

  async function login(username: string, password: string) {
    const res = await axios.post(
      `${BASE_URL}/api/auth/login`,
      { username, password },
      { withCredentials: true }
    );
    user.value = res.data.user;
    localStorage.setItem('user', JSON.stringify(user.value));
    return true;
  }

  async function refresh() {
    try {
      const res = await axios.post(
        `${BASE_URL}/api/auth/refresh`,
        {},
        { withCredentials: true }
      );
      user.value = res.data.user;
      localStorage.setItem('user', JSON.stringify(user.value));
      return true;
    } catch (err) {
      user.value = null;
      localStorage.removeItem('user');
      return false;
    }
  }

  async function logout() {
    await axios.post(
      `${BASE_URL}/api/auth/logout`,
      {},
      { withCredentials: true }
    );
    user.value = null;
    localStorage.removeItem('user');
    window.location.href = '/login';
  }

  // restore from localStorage on startup
  const savedUser = localStorage.getItem('user');
  if (savedUser) {
    try {
      user.value = JSON.parse(savedUser);
    } catch {
      localStorage.removeItem('user');
    }
  } else {
    // optional: call refresh() from your main.ts if you want auto-login
  }

  return {
    user,
    login,
    refresh,
    logout,
    isAuthenticated: () => !!user.value,
    isAdmin: () => user.value?.role === 'admin'
  };
});
