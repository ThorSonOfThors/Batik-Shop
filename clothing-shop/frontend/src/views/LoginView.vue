<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <h2>Welcome Back</h2>
        <p>Please sign in to your account</p>
      </div>
      
      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <input 
            v-model="username" 
            placeholder="Username"
            type="text"
            class="form-input"
            required
          />
        </div>
        
        <div class="form-group">
          <input 
            v-model="password" 
            placeholder="Password" 
            type="password" 
            class="form-input"
            required
          />
        </div>
        
        <button type="submit" class="login-btn">
          Sign In
        </button>
      </form>

      <div v-if="error" class="error-message">
        <i class="fas fa-exclamation-circle"></i>
        {{ error }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const auth = useAuthStore()

const username = ref('')
const password = ref('')
const error = ref('')

const handleLogin = async () => {
  error.value = ''

  try {
    // Call Pinia store's login action, which talks to backend
    const success = await auth.login(username.value, password.value)
    

    if (success) {
      // Redirect after login
      console.log("auth.login completed succesfully!");
      router.push('/admin')
    } else {
      error.value = 'Invalid username or password'
    }
  } catch (err: any) {
    console.error('Login failed:', err)
    error.value = err.response?.data?.message || 'Something went wrong. Please try again.'
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  position: relative;
}

.login-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: url('C:\Users\Filip\Desktop\clothing-shop\frontend\src\assets\backgroundImageForLoginView.jpg');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  opacity: 0.8;
  z-index: -1;
}

.login-card {
  background: white;
  padding: 40px;
  border-radius: 16px;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.login-header {
  text-align: center;
  margin-bottom: 32px;
}

.login-header h2 {
  color: #2d3748;
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 8px;
}

.login-header p {
  color: #718096;
  font-size: 16px;
  margin: 0;
}

.login-form {
  margin-bottom: 24px;
}

.form-group {
  margin-bottom: 20px;
}

.form-input {
  width: 100%;
  padding: 14px 16px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 16px;
  transition: all 0.3s ease;
  background-color: #fafafa;
  box-sizing: border-box;
}

.form-input:focus {
  outline: none;
  border-color: #4299e1;
  background-color: white;
  box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.1);
}

.form-input::placeholder {
  color: #a0aec0;
}

.login-btn {
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 10px;
}

.login-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
}

.login-btn:active {
  transform: translateY(0);
}

.error-message {
  background-color: #fed7d7;
  color: #c53030;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
  border-left: 4px solid #fc8181;
}

.error-message i {
  font-size: 16px;
}

/* Responsive design */
@media (max-width: 480px) {
  .login-card {
    padding: 30px 20px;
    margin: 20px;
  }
  
  .login-header h2 {
    font-size: 24px;
  }
}
</style>