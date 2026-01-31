import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import axios from 'axios'
import App from './App.vue'
import router from './router/index'
import { useAuthStore } from './stores/auth'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

// ✅ Always send cookies with requests
axios.defaults.withCredentials = true
axios.defaults.baseURL = 'http://localhost:5000/api'

// ✅ Axios interceptor for auto-refreshing tokens
axios.interceptors.response.use(
  response => response,
  async error => {
    const auth = useAuthStore()

    // If no response or status, just reject
    if (!error.response) return Promise.reject(error)

    const originalRequest = error.config
    const status = error.response.status
    const isAuthRoute = originalRequest.url?.includes('/auth/login') || originalRequest.url?.includes('/auth/refresh')

    // 🚫 Prevent infinite refresh loops
    if (status === 401 && !originalRequest._retry && !isAuthRoute) {
      originalRequest._retry = true
      try {
        await axios.post('/auth/refresh', {}, { withCredentials: true })
        return axios(originalRequest) // retry original
      } catch (refreshErr) {
        console.warn('Token refresh failed, logging out.')
        auth.logout()
        router.push('/login')
      }
    }

    return Promise.reject(error)
  }
)


const app = createApp(App)

//initVanta()

const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

app.use(pinia)

app.use(router)
app.mount('#app')
