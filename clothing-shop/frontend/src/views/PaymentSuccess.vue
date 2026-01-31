<template>
  <div class="payment-container">
    <div class="payment-wrapper" v-if="paymentData">
      <div class="payment-content">
        <!-- Success Icon Animation -->
        <div class="icon-container success">
          <div class="icon-circle">
            <div class="checkmark"></div>
          </div>
          <div class="confetti">
            <div class="confetti-piece" v-for="n in 12" :key="n" :style="confettiStyle(n)"></div>
          </div>
        </div>

        <!-- Success Message -->
        <h1 class="title">Payment Successful!</h1>
        <span class="emoji-title">🎉</span>
        <p class="subtitle">Thank you for your purchase, {{ paymentData.customerInfo?.fullName || 'Valued Customer' }}</p>

        <!-- Order Details -->
        <div class="details-card">
          <!-- Add Order ID here -->
          <div class="detail-row" v-if="paymentData.id">
            <span class="detail-label">
              <i class="icon">📋</i> Order ID
            </span>
            <span class="detail-value order-id">{{ paymentData.id }}</span>
          </div>
          
          <div class="detail-row">
            <span class="detail-label">
              <i class="icon">📧</i> Email
            </span>
            <span class="detail-value">{{ paymentData.email }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">
              <i class="icon">💰</i> Amount Paid
            </span>
            <span class="detail-value">{{ formatPrice(convertAmount(paymentData.amount)) }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">
              <i class="icon">🧾</i> Subtotal
            </span>
            <span class="detail-value">{{ formatPrice(convertAmount(paymentData.amount - (paymentData.taxAmount || 0))) }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">
              <i class="icon">🏛️</i> Tax
            </span>
            <span class="detail-value">{{ formatPrice(convertAmount(paymentData.taxAmount || 0)) }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">
              <i class="icon">🆔</i> Payment ID
            </span>
            <span class="detail-value">{{ paymentData.paymentIntent?.id?.slice(-8) || 'N/A' }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">
              <i class="icon">📅</i> Date & Time
            </span>
            <span class="detail-value">{{ formattedDate }}</span>
          </div>
        </div>

        <!-- Shipping Address -->
        <div class="details-card" v-if="paymentData.customerInfo?.address">
          <h3 class="section-subtitle">
            <i class="icon">📦</i> Shipping Address
          </h3>
          <div class="address-display">
            <p>{{ paymentData.customerInfo.fullName }}</p>
            <p>{{ paymentData.customerInfo.address.street }}</p>
            <p>{{ paymentData.customerInfo.address.city }}, {{ paymentData.customerInfo.address.state }} {{ paymentData.customerInfo.address.zipCode }}</p>
            <p>{{ paymentData.customerInfo.address.country }}</p>
          </div>
        </div>

        <!-- Order Items -->
        <div class="order-items" v-if="paymentData.cart && paymentData.cart.length > 0">
          <h3 class="section-subtitle">
            <i class="icon">🛒</i> Order Items ({{ paymentData.cart.length }})
          </h3>
          <div class="items-list">
            <div v-for="item in paymentData.cart" :key="item.id" class="order-item">
              <div class="item-info">
                <strong>{{ item.name }}</strong>
                <span>Qty: {{ item.quantity }} × {{ formatPrice(convertAmount(item.price)) }}</span>
              </div>
              <span class="item-total">{{ formatPrice(convertAmount(item.price * item.quantity)) }}</span>
            </div>
          </div>
        </div>

        <!-- Success Message - Updated to include Order ID -->
        <div class="message-box success-message">
          <i class="icon">✅</i>
          <div>
            <h3>Order Confirmed!</h3>
            <p>Your order has been successfully processed. 
              <span v-if="paymentData.id">
                Your Order ID is <strong class="order-id-highlight">{{ paymentData.id }}</strong>.
              </span>
              A confirmation email has been sent to <strong>{{ paymentData.email }}</strong> with all the details.
            </p>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="action-buttons">
          <button class="primary-btn" @click="goToShop">
            <i class="icon">🛍️</i> Continue Shopping
            <i class="icon">→</i>
          </button>
          <button class="secondary-btn" @click="printReceipt">
            <i class="icon">🖨️</i> Print Receipt
          </button>
          <!-- Optional: Copy Order ID button -->
          <button class="tertiary-btn" v-if="paymentData.id" @click="copyOrderId">
            <i class="icon">📋</i> Copy Order ID
          </button>
        </div>

        <!-- Support Info - Updated to mention Order ID -->
        <div class="support-info">
          <p><i class="icon">💬</i> Need help? 
            <span v-if="paymentData.id">Please reference Order ID: <strong>{{ paymentData.id }}</strong> when contacting </span>
            <a href="mailto:support@example.com">our support team</a>
          </p>
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
import api from '@/api/axios' // ✅ your axios instance

const router = useRouter()
const paymentData = ref<any>(null)

const formattedDate = computed(() => {
  if (!paymentData.value?.paymentIntent?.created) {
    return new Date().toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const date = new Date(paymentData.value.paymentIntent.created * 1000)
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
})

const confettiStyle = (index: number) => {
  const angle = (index / 12) * 360
  const distance = 60 + Math.random() * 40
  return {
    transform: `rotate(${angle}deg) translate(${distance}px)`,
    backgroundColor: `hsl(${Math.random() * 360}, 100%, 60%)`,
    animationDelay: `${Math.random() * 1}s`
  }
}

const convertAmount = (amount: number): number => {
  if (!amount) return 0
  if (amount > 100) return amount / 100
  return amount
}

const goToShop = () => {
  router.push('/shop')
}

const printReceipt = () => {
  window.print()
}

const copyOrderId = async () => {
  if (paymentData.value?.id) {
    try {
      await navigator.clipboard.writeText(paymentData.value.id)
      alert('Order ID copied to clipboard!')
    } catch {
      const textArea = document.createElement('textarea')
      textArea.value = paymentData.value.id
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      alert('Order ID copied to clipboard!')
    }
  }
}

/* 🔁 Bulletproof waiting mechanism */
const waitForOrderId = async (checkoutId: string) => {
  for (let i = 0; i < 6; i++) {
    try {
      const res = await api.get(
        `/orders/by-checkout/${checkoutId}`
      )

      if (res.data?.orderId) {
        return res.data.orderId
      }
    } catch {
      // order not ready yet
    }

    await new Promise(r => setTimeout(r, 1200))
  }

  throw new Error('Order creation timeout')
}

onMounted(async () => {
  const sessionData = sessionStorage.getItem('currentPayment')
  const localData = localStorage.getItem('lastSuccessfulPayment')

  if (sessionData) {
    paymentData.value = JSON.parse(sessionData)
    sessionStorage.removeItem('currentPayment')
  } else if (localData) {
    paymentData.value = JSON.parse(localData)
  } else {
    router.push('/')
    return
  }

  if (!paymentData.value) return

  localStorage.setItem(
    'lastSuccessfulPayment',
    JSON.stringify(paymentData.value)
  )

  /* 🚀 Fetch real order ID from backend */
  try {
    console.log("Payment data:", paymentData.value)

    const checkoutId = sessionStorage.getItem('checkoutId')

    console.log("Checkout ID:", checkoutId)

    if (!checkoutId) {
      console.error("❌ checkoutId missing in sessionStorage")
      return
    }

    const orderId = await waitForOrderId(checkoutId)

    console.log("Order ID received:", orderId)

    paymentData.value.id = orderId

  } catch (err) {
    console.error('Order ID fetch failed:', err)
  }

})
</script>



<style scoped>


  /* Simple inline solution */
.emoji-title {
  display: inline-block;
  font-size: 2rem; /* Match your title font-size */
  margin-left: 15px;
  vertical-align: middle;
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% {
    transform: translateY(-20px);
  }
  50% {
    transform: translateY(0px);
  }
}

/* Ensure title and emoji are in same line */
.payment-content h1 {
  display: inline;
}
/* ... keep all existing styles ... */

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

.section-subtitle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 0 1rem 0;
  color: #4a5568;
  font-size: 1.125rem;
}

.address-display {
  color: #4a5568;
  line-height: 1.6;
}

.address-display p {
  margin: 0.25rem 0;
}

.order-items {
  background: #f8fafc;
  border-radius: 16px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  border: 1px solid #e2e8f0;
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
  color: #48bb78;
}

@media print {
  .payment-container {
    background: white !important;
  }
  
  .background-decoration,
  .action-buttons,
  .support-info {
    display: none !important;
  }
  
  .payment-wrapper {
    box-shadow: none !important;
    max-width: 100% !important;
  }
}


.payment-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
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
  background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 2;
  animation: scaleIn 0.5s ease-out;
}

@keyframes scaleIn {
  from {
    transform: scale(0);
  }
  to {
    transform: scale(1);
  }
}

.checkmark {
  width: 50px;
  height: 25px;
  border-left: 5px solid white;
  border-bottom: 5px solid white;
  transform: rotate(-45deg);
  margin-top: -10px;
}

.confetti {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1;
}

.confetti-piece {
  position: absolute;
  width: 8px;
  height: 16px;
  left: 50%;
  top: 50%;
  margin-left: -4px;
  margin-top: -8px;
  border-radius: 4px;
  animation: confettiFall 1s ease-out forwards;
}

@keyframes confettiFall {
  to {
    transform: translateY(100px) rotate(360deg);
    opacity: 0;
  }
}

.title {
  font-size: 2.5rem;
  font-weight: 700;
  color: #2d3748;
  margin: 0 0 0.5rem 0;
  background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
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

.success-message {
  background: #c6f6d5;
  border: 1px solid #9ae6b4;
  color: #22543d;
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

.next-steps {
  background: #f0f9ff;
  border: 1px solid #bee3f8;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  text-align: left;
}

.next-steps h3 {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 0 1rem 0;
  color: #2c5282;
}

.next-steps ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.next-steps li {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0;
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
  background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
  color: white;
  border: none;
}

.primary-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(72, 187, 120, 0.3);
}

.secondary-btn {
  background: white;
  color: #4a5568;
  border: 2px solid #e2e8f0;
}

.secondary-btn:hover {
  border-color: #48bb78;
  color: #48bb78;
  transform: translateY(-2px);
}

.support-info {
  border-top: 1px solid #e2e8f0;
  padding-top: 1.5rem;
  color: #718096;
  font-size: 0.875rem;
}

.support-info a {
  color: #48bb78;
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