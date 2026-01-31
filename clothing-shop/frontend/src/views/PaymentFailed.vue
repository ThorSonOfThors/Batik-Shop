<template>
  <div class="payment-container">
    <div class="payment-wrapper" v-if="paymentData">
      <div class="payment-content">
        <!-- Error Icon -->
        <div class="icon-container error">
          <div class="icon-circle">
            <div class="exclamation-mark">!</div>
          </div>
          <div class="error-shake">
            <div class="shake-piece" v-for="n in 8" :key="n" :style="shakeStyle(n)"></div>
          </div>
        </div>

        <!-- Error Message -->
        <h1 class="title">Payment Failed 😔</h1>
        <p class="subtitle">We couldn't process your payment</p>

        <!-- Error Details -->
        <div class="details-card">
          <div class="detail-row">
            <span class="detail-label">
              <i class="icon">📧</i> Email
            </span>
            <span class="detail-value">{{ paymentData.email }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">
              <i class="icon">💰</i> Attempted Amount
            </span>
            <span class="detail-value">{{ formatPrice(paymentData.amount) }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">
              <i class="icon">🆔</i> Reference
            </span>
            <span class="detail-value">{{ paymentReference }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">
              <i class="icon">🕒</i> Time
            </span>
            <span class="detail-value">{{ formattedDate }}</span>
          </div>
        </div>

        <!-- Error Message -->
        <div class="message-box error-message">
          <i class="icon">⚠️</i>
          <div>
            <h3>Payment Declined</h3>
            <p>{{ paymentData.error || 'Your payment could not be processed. Please try again.' }}</p>
          </div>
        </div>

        <!-- Cart Items (Preserved for retry) -->
        <div class="order-items" v-if="paymentData.cart && paymentData.cart.length > 0">
          <h3 class="section-subtitle">
            <i class="icon">🛒</i> Your Cart Items (Preserved)
          </h3>
          <div class="items-list">
            <div v-for="item in paymentData.cart" :key="item.id" class="order-item">
              <div class="item-info">
                <strong>{{ item.name }}</strong>
                <span>Qty: {{ item.quantity }} × {{ formatPrice(item.price) }}</span>
              </div>
              <span class="item-total">{{ formatPrice(item.price * item.quantity) }}</span>
            </div>
          </div>
          <p class="cart-note"><i class="icon">💾</i> Your cart items have been saved for retry</p>
        </div>

        <!-- Solutions -->
        <div class="solutions-card">
          <h3><i class="icon">💡</i> Try These Solutions:</h3>
          <div class="solution-grid">
            <div class="solution" @click="retryWithSameCard">
              <i class="icon">🔄</i>
              <p>Retry with same card</p>
            </div>
            <div class="solution" @click="useDifferentCard">
              <i class="icon">💳</i>
              <p>Use different card</p>
            </div>
            <div class="solution" @click="contactBank">
              <i class="icon">🏦</i>
              <p>Contact your bank</p>
            </div>
            <div class="solution" @click="contactSupport">
              <i class="icon">📞</i>
              <p>Contact support</p>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="action-buttons">
          <button class="primary-btn" @click="goToShop">
            <i class="icon">🛍️</i> Continue Shopping
            <i class="icon">→</i>
          </button>
          <button class="secondary-btn" @click="retryPayment">
            <i class="icon">🔄</i> Try Payment Again
          </button>
        </div>

        <!-- Support Info -->
        <div class="support-info">
          <p><i class="icon">📞</i> Need immediate help? <a href="tel:+1234567890">Call +1 (234) 567-890</a></p>
          <p><i class="icon">💬</i> Or <a href="mailto:support@example.com">email our support team</a></p>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-else class="loading-state">
      <div class="spinner"></div>
      <p>Loading payment details...</p>
    </div>

    <!-- Background Decoration -->
    <div class="background-decoration"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { formatPrice } from '@/utils/priceFormatter'

const router = useRouter()
const paymentData = ref<any>(null)

const formattedDate = computed(() => {
  return new Date().toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
})

const paymentReference = computed(() => {
  if (paymentData.value?.paymentIntent?.id) {
    return paymentData.value.paymentIntent.id.slice(-8)
  }
  return 'PAY-' + Math.random().toString(36).substr(2, 6).toUpperCase()
})

const shakeStyle = (index: number) => {
  const angle = (index / 8) * 360
  const distance = 20 + Math.random() * 15
  return {
    transform: `rotate(${angle}deg) translate(${distance}px)`,
    backgroundColor: `hsl(${15 + Math.random() * 30}, 100%, 60%)`,
    animationDelay: `${Math.random() * 0.5}s`
  }
}

const goToShop = () => {
  router.push('/shop')
}

const retryPayment = () => {
  // Store cart items for retry
  if (paymentData.value?.cart) {
    localStorage.setItem('retryCart', JSON.stringify(paymentData.value.cart))
  }
  router.push('/payment')
}

const retryWithSameCard = () => {
  // In a real app, you might store card token for retry
  retryPayment()
}

const useDifferentCard = () => {
  retryPayment()
}

const contactBank = () => {
  window.open('tel:+11234567890', '_blank')
}

const contactSupport = () => {
  window.open('mailto:support@example.com?subject=Payment%20Failed%20Support', '_blank')
}

onMounted(() => {
  // Try to get payment data from different sources
  const sessionData = sessionStorage.getItem('currentPayment')
  const localData = localStorage.getItem('lastFailedPayment')
  
  if (sessionData) {
    paymentData.value = JSON.parse(sessionData)
    // Clear session storage after reading
    sessionStorage.removeItem('currentPayment')
  } else if (localData) {
    paymentData.value = JSON.parse(localData)
  } else {
    // If no data found, redirect to home
    router.push('/')
  }
  
  // Store in history for reference
  if (paymentData.value) {
    localStorage.setItem('lastFailedPayment', JSON.stringify(paymentData.value))
  }
})
</script>

<style scoped>
/* ... keep all existing styles ... */

.cart-note {
  margin-top: 1rem;
  padding: 0.75rem;
  background: rgba(245, 101, 101, 0.1);
  border-radius: 8px;
  color: #c53030;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.solution {
  cursor: pointer;
}

.solution:hover {
  transform: translateY(-2px);
  border-color: #f56565;
  background: #fff5f5;
}

/* Add to existing styles */
.order-items {
  background: #f8fafc;
  border-radius: 16px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  border: 1px solid #e2e8f0;
}

.section-subtitle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 0 1rem 0;
  color: #4a5568;
  font-size: 1.125rem;
}

.items-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.order-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: white;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.item-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.item-info span {
  font-size: 0.875rem;
  color: #718096;
}

.item-total {
  font-weight: 600;
  color: #4a5568;
}

.loading-state {
  text-align: center;
  color: white;
}

.loading-state .spinner {
  width: 50px;
  height: 50px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}
</style>

<style scoped>
.payment-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background: linear-gradient(135deg, #f56565 0%, #c53030 100%);
  position: relative;
  overflow: hidden;
}

.background-decoration {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: 
    radial-gradient(circle at 20% 80%, rgba(255,255,255,0.1) 0%, transparent 20%),
    radial-gradient(circle at 80% 20%, rgba(255,255,255,0.1) 0%, transparent 20%);
  z-index: 0;
}

.payment-wrapper {
  width: 100%;
  max-width: 600px;
  background: white;
  border-radius: 24px;
  box-shadow: 
    0 20px 60px rgba(0, 0, 0, 0.3),
    0 0 0 1px rgba(255, 255, 255, 0.1);
  padding: 3rem;
  position: relative;
  z-index: 1;
  backdrop-filter: blur(10px);
  animation: slideUp 0.6s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.payment-content {
  text-align: center;
}

.icon-container {
  position: relative;
  width: 120px;
  height: 120px;
  margin: 0 auto 2rem;
}

.icon-circle {
  width: 120px;
  height: 120px;
  background: linear-gradient(135deg, #f56565 0%, #c53030 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 2;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

.exclamation-mark {
  color: white;
  font-size: 3rem;
  font-weight: bold;
  line-height: 1;
}

.error-shake {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1;
}

.shake-piece {
  position: absolute;
  width: 4px;
  height: 12px;
  left: 50%;
  top: 50%;
  margin-left: -2px;
  margin-top: -6px;
  border-radius: 2px;
  animation: shakeAnim 0.5s ease-in-out infinite alternate;
}

@keyframes shakeAnim {
  from { transform: translateX(-2px) rotate(0deg); }
  to { transform: translateX(2px) rotate(5deg); }
}

.title {
  font-size: 2.5rem;
  font-weight: 700;
  color: #2d3748;
  margin: 0 0 0.5rem 0;
  background: linear-gradient(135deg, #f56565 0%, #c53030 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.subtitle {
  color: #718096;
  font-size: 1.25rem;
  margin-bottom: 2rem;
}

.details-card {
  background: #f8fafc;
  border-radius: 16px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  border: 1px solid #e2e8f0;
  text-align: left;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
  border-bottom: 1px solid #e2e8f0;
}

.detail-row:last-child {
  border-bottom: none;
}

.detail-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #4a5568;
  font-weight: 600;
}

.detail-value {
  color: #2d3748;
  font-weight: 500;
}

.message-box {
  display: flex;
  gap: 1rem;
  padding: 1.5rem;
  border-radius: 12px;
  margin-bottom: 2rem;
  text-align: left;
  align-items: flex-start;
}

.error-message {
  background: #fed7d7;
  border: 1px solid #fc8181;
  color: #c53030;
}

.message-box .icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.message-box h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.125rem;
}

.message-box p {
  margin: 0;
  font-size: 0.95rem;
  line-height: 1.5;
}

.reasons-list {
  background: #fff5f5;
  border: 1px solid #fed7d7;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  text-align: left;
}

.reasons-list h3 {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 0 1rem 0;
  color: #c53030;
}

.reasons-list ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.reasons-list li {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0;
  color: #744210;
}

.solutions-card {
  background: #f0fff4;
  border: 1px solid #9ae6b4;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;
}

.solutions-card h3 {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 0 1.5rem 0;
  color: #22543d;
  text-align: center;
}

.solution-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

@media (max-width: 640px) {
  .solution-grid {
    grid-template-columns: 1fr;
  }
}

.solution {
  background: white;
  border-radius: 8px;
  padding: 1rem;
  text-align: center;
  border: 1px solid #e2e8f0;
  transition: transform 0.2s;
}

.solution:hover {
  transform: translateY(-2px);
  border-color: #48bb78;
}

.solution .icon {
  font-size: 2rem;
  display: block;
  margin-bottom: 0.5rem;
}

.solution p {
  margin: 0;
  font-size: 0.875rem;
  color: #4a5568;
}

.action-buttons {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.primary-btn, .secondary-btn {
  flex: 1;
  padding: 1rem 1.5rem;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.primary-btn {
  background: linear-gradient(135deg, #f56565 0%, #c53030 100%);
  color: white;
  border: none;
}

.primary-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(245, 101, 101, 0.3);
}

.secondary-btn {
  background: white;
  color: #4a5568;
  border: 2px solid #e2e8f0;
}

.secondary-btn:hover {
  border-color: #f56565;
  color: #f56565;
  transform: translateY(-2px);
}

.support-info {
  border-top: 1px solid #e2e8f0;
  padding-top: 1.5rem;
  color: #718096;
  font-size: 0.875rem;
}

.support-info p {
  margin: 0.5rem 0;
}

.support-info a {
  color: #f56565;
  text-decoration: none;
  font-weight: 600;
}

.support-info a:hover {
  text-decoration: underline;
}

.icon {
  font-size: 1.25rem;
}

@media (max-width: 768px) {
  .payment-container {
    padding: 1rem;
  }

  .payment-wrapper {
    padding: 1.5rem;
  }

  .title {
    font-size: 2rem;
  }

  .action-buttons {
    flex-direction: column;
  }

  .detail-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
  }

  .detail-value {
    font-size: 0.95rem;
  }
}
</style>