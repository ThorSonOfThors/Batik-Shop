<template>
  <div class="checkout-container">
    <div class="checkout-wrapper">
      <div class="checkout-header">
        <h1 class="title">Complete Your Purchase</h1>
        <p class="subtitle">Secure checkout powered by Stripe</p>
      </div>

      <!-- CART ITEMS SECTION -->
      <div class="section">
        <h2 class="section-title">
          <i class="icon">🛒</i> Order Summary
        </h2>
        <div class="cart-items">
          <div
            v-for="item in cart.items"
            :key="item.id"
            class="cart-item"
            @mouseenter="item.images && item.images.length > 1 ? startImageRotation(item.id) : null"
            @mouseleave="item.images && item.images.length > 1 ? stopImageRotation(item.id) : null"
          >
            <div class="item-image-container">
              <div class="image-wrapper">
                <img
                  :src="getCurrentImageUrl(item)"
                  :alt="item.name"
                  class="item-image"
                  @error="handleImageError"
                />
                <div v-if="item.images && item.images.length > 1" class="image-indicator">
                  {{ getCurrentImageIndex(item.id) + 1 }}/{{ item.images.length }}
                </div>
              </div>
            </div>

            <div class="item-details">
              <h3 class="item-name">{{ item.name }}</h3>
              <div class="item-meta">
                <span class="quantity">Qty: {{ item.quantity }}</span>
                <span class="unit-price">{{ formatPrice(item.price) }} each</span>
              </div>
              <p class="item-total">
                {{ formatPrice(item.price * item.quantity) }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- PRICE BREAKDOWN -->
      <div class="section">
        <h2 class="section-title">
          <i class="icon">🧾</i> Price Breakdown
        </h2>
        <div class="price-breakdown">
          <div class="price-row">
            <span>Subtotal</span>
            <span>{{ formatPrice(cart.totalPrice) }}</span>
          </div>
          <div class="price-row">
            <span>
              Tax 
              <span class="tax-rate">({{ (cart.getTax * 100).toFixed(1) }}%)</span>
            </span>
            <span>{{ formatPrice(taxAmount) }}</span>
          </div>
          <div class="price-row total">
            <span>Total Amount</span>
            <strong>{{ formatPrice(totalWithTax) }}</strong>
          </div>
        </div>
      </div>

      <!-- CUSTOMER INFORMATION -->
      <div class="section">
        <h2 class="section-title">
          <i class="icon">👤</i> Customer Information
        </h2>
        
        <!-- Full Name -->
        <div class="field">
          <label for="fullName">
            <i class="icon">👤</i> Full Name *
          </label>
          <input
            id="fullName"
            type="text"
            v-model="customerInfo.fullName"
            required
            placeholder="John Doe"
            :class="{ 'has-value': customerInfo.fullName }"
          />
        </div>

        <!-- Email -->
        <div class="field">
          <label for="email">
            <i class="icon">✉️</i> Email Address *
          </label>
          <input
            id="email"
            type="email"
            v-model="customerInfo.email"
            required
            placeholder="your.email@example.com"
            :class="{ 'has-value': customerInfo.email }"
          />
          <p class="field-note">Receipt will be sent to this email</p>
        </div>

        <!-- Address Fields -->
        <div class="address-grid">
          <div class="field">
            <label for="street">
              <i class="icon">🏠</i> Street Address *
            </label>
            <input
              id="street"
              type="text"
              v-model="customerInfo.street"
              required
              placeholder="123 Main St"
              :class="{ 'has-value': customerInfo.street }"
              @input="updateMapPreview"
            />
          </div>

          <div class="field">
            <label for="city">
              <i class="icon">🏙️</i> City *
            </label>
            <input
              id="city"
              type="text"
              v-model="customerInfo.city"
              required
              placeholder="New York"
              :class="{ 'has-value': customerInfo.city }"
              @input="updateMapPreview"
            />
          </div>

          <div class="field">
            <label for="state">
              <i class="icon">🗺️</i> State/Province *
            </label>
            <input
              id="state"
              type="text"
              v-model="customerInfo.state"
              required
              placeholder="NY"
              :class="{ 'has-value': customerInfo.state }"
              @input="updateMapPreview"
            />
          </div>

          <div class="field">
            <label for="zipCode">
              <i class="icon">📮</i> ZIP/Postal Code *
            </label>
            <input
              id="zipCode"
              type="text"
              v-model="customerInfo.zipCode"
              required
              placeholder="10001"
              :class="{ 'has-value': customerInfo.zipCode }"
              @input="updateMapPreview"
            />
          </div>

          <div class="field">
            <label for="country">
              <i class="icon">🌎</i> Country Code *
            </label>
            <input
              id="country"
              type="text"
              v-model="customerInfo.country"
              required
              placeholder="United States"
              :class="{ 'has-value': customerInfo.country }"
              @input="updateMapPreview"
            />
          </div>
        </div>

        <!-- Map Preview -->
        <div class="field" v-if="showMapPreview">
          <label>
            <i class="icon">🗺️</i> Address Preview
          </label>
          <div class="map-container">
            <div class="map-placeholder">
              <div class="map-content">
                <div class="map-marker">
                  <i class="icon">📍</i>
                </div>
                <div class="address-display">
                  <p><strong>{{ formattedAddress }}</strong></p>
                  <p class="map-note">Map preview of your delivery address</p>
                </div>
              </div>
              <div class="map-actions">
                <button class="map-btn" @click="openInGoogleMaps">
                  <i class="icon">🗺️</i> Open in Google Maps
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- PAYMENT INFORMATION -->
      <div class="section">
        <h2 class="section-title">
          <i class="icon">💳</i> Payment Details
        </h2>
        <div class="field">
          <label for="card-element">
            <i class="icon">🔒</i> Credit Card
          </label>
          <div id="card-element" class="card-element"></div>
          <div class="card-icons">
            <span>✅ Secure</span>
            <span>🔒 Encrypted</span>
            <span>💳 Visa/Mastercard/Amex</span>
          </div>
        </div>
      </div>

      <!-- PAYMENT BUTTON -->
      <div class="payment-section">
        <button
          class="pay-button"
          :disabled="loading || !customerInfo.email || !customerInfo.fullName || !isAddressComplete || cart.items.length === 0"
          @click="pay"
        >
          <span v-if="!loading">
            <i class="icon">💎</i>
            Pay {{ formatPrice(totalWithTax) }}
            <i class="icon">→</i>
          </span>
          <span v-else class="loading-content">
            <div class="spinner"></div>
            Processing Payment...
          </span>
        </button>

        <div class="security-note">
          <i class="icon">🛡️</i>
          <span>Your payment is secure and encrypted. We never store your card details.</span>
        </div>
      </div>

      <!-- ERROR MESSAGE -->
      <div v-if="error" class="error-message">
        <i class="icon">⚠️</i>
        <div>
          <strong>Payment Failed</strong>
          <p>{{ error }}</p>
        </div>
      </div>
    </div>

    <!-- BACKGROUND DECORATION -->
    <div class="background-decoration"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, reactive, watch } from 'vue'
import { loadStripe } from '@stripe/stripe-js'
import { useCartStore } from '@/stores/cart'
import type { Item } from '@/types/Item'
import { normalizeCountryToISO } from '@/utils/country'



const BASE_URL = 'http://localhost:5000'
const STRIPE_PUBLIC_KEY = import.meta.env.VITE_STRIPE_PUBLIC_KEY

const cart = useCartStore()
const loading = ref(false)
const error = ref<string | null>(null)
const imageIndexMap = ref<Record<number, number>>({})
const rotationIntervals = ref<Record<number, number>>({})

let stripe: any
let cardElement: any

// Customer information object
const customerInfo = reactive({
  fullName: '',
  email: '',
  street: '',
  city: '',
  state: '',
  zipCode: '',
  country: 'United States' // Default value
})

// Computed properties for tax calculation
const taxAmount = computed(() => {
  return cart.totalPrice * cart.getTax
})

const totalWithTax = computed(() => {
  return cart.totalPrice + taxAmount.value
})

// Check if address is complete
const isAddressComplete = computed(() => {
  return (
    customerInfo.street.trim() !== '' &&
    customerInfo.city.trim() !== '' &&
    customerInfo.state.trim() !== '' &&
    customerInfo.zipCode.trim() !== '' &&
    customerInfo.country.trim() !== ''
  )
})

// Check if we should show map preview
const showMapPreview = computed(() => {
  return (
    customerInfo.street.trim() !== '' &&
    customerInfo.city.trim() !== '' &&
    customerInfo.state.trim() !== ''
  )
})

// Format address for display
const formattedAddress = computed(() => {
  const parts = []
  if (customerInfo.street) parts.push(customerInfo.street)
  if (customerInfo.city) parts.push(customerInfo.city)
  if (customerInfo.state) parts.push(customerInfo.state)
  if (customerInfo.zipCode) parts.push(customerInfo.zipCode)
  if (customerInfo.country && customerInfo.country !== 'United States') parts.push(customerInfo.country)
  return parts.join(', ')
})

onMounted(async () => {
  if (STRIPE_PUBLIC_KEY) {
    stripe = await loadStripe(STRIPE_PUBLIC_KEY)
    if (stripe) {
      const elements = stripe.elements()
      cardElement = elements.create('card', {
        style: {
          base: {
            color: '#32325d',
            fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
            fontSmoothing: 'antialiased',
            fontSize: '16px',
            '::placeholder': {
              color: '#aab7c4'
            }
          },
          invalid: {
            color: '#fa755a',
            iconColor: '#fa755a'
          }
        }
      })
      cardElement.mount('#card-element')
    }
  }
})

onUnmounted(() => {
  // Clear all rotation intervals
  Object.values(rotationIntervals.value).forEach(interval => {
    clearInterval(interval)
  })
})

/* ---------- IMAGE HELPERS ---------- */

const getCurrentImageUrl = (item: Item): string => {
  // Check if item has images
  if (!item.images || item.images.length === 0) {
    return '/api/placeholder/150/150'
  }
  
  // Get current index
  const currentIndex = getCurrentImageIndex(item.id)
  
  // Ensure index is within bounds
  const safeIndex = Math.min(currentIndex, item.images.length - 1)
  
  // Get the image path - add type check here
  const imagePath = item.images[safeIndex]
  
  // Add this check before passing to fullImageUrl
  if (!imagePath) {
    return '/api/placeholder/150/150'
  }
  
  // Return full URL
  return fullImageUrl(imagePath)
}

const getCurrentImageIndex = (itemId: number): number => {
  const index = imageIndexMap.value[itemId]
  // Return 0 if undefined or NaN
  return index !== undefined && !isNaN(index) ? index : 0
}

const fullImageUrl = (path: string): string => {
  if (!path) return '/api/placeholder/150/150'
  if (path.startsWith('http')) return path
  const normalized = path.startsWith('/') ? path : `/${path}`
  return `${BASE_URL}${normalized}`
}

const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement
  img.src = 'https://via.placeholder.com/150?text=Product+Image'
}

const startImageRotation = (itemId: number) => {
  const item = cart.items.find(i => i.id === itemId)
  if (!item || !item.images || item.images.length <= 1) return

  stopImageRotation(itemId)

  rotationIntervals.value[itemId] = window.setInterval(() => {
    const currentIndex = getCurrentImageIndex(itemId)
    const nextIndex = (currentIndex + 1) % item.images.length
    imageIndexMap.value[itemId] = nextIndex
  }, 1000)
}

const stopImageRotation = (itemId: number) => {
  if (rotationIntervals.value[itemId]) {
    clearInterval(rotationIntervals.value[itemId])
    delete rotationIntervals.value[itemId]
  }
}


/* ---------- PAYMENT STORAGE ---------- */
const storeSuccessfulPayment = (paymentData: any) => {
  // Store in localStorage
  localStorage.setItem('lastSuccessfulPayment', JSON.stringify(paymentData))
  // Store in sessionStorage for immediate access
  sessionStorage.setItem('currentPayment', JSON.stringify(paymentData))
}

const storeFailedPayment = (paymentData: any) => {
  localStorage.setItem('lastFailedPayment', JSON.stringify(paymentData))
  sessionStorage.setItem('currentPayment', JSON.stringify({
    ...paymentData,
    status: 'failed'
  }))
}

/* ---------- ADDRESS HELPERS ---------- */

const updateMapPreview = () => {
  // This function is triggered on input to update the map preview
  // In a real implementation, you would call a geocoding API here
  console.log('Address updated:', formattedAddress.value)
}

const openInGoogleMaps = () => {
  if (formattedAddress.value) {
    const encodedAddress = encodeURIComponent(formattedAddress.value)
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, '_blank')
  }
}

/* ---------- PRICE HELPERS ---------- */

const formatPrice = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(value)
}

/* ---------- PAYMENT ---------- */

const pay = async () => {
  // Validate all required fields
  if (!customerInfo.email || !customerInfo.fullName || !isAddressComplete.value || !stripe || !cardElement) {
    error.value = 'Please fill in all required fields'
    return
  }

  error.value = null
  loading.value = true

  try {
    const res = await fetch('http://localhost:5000/api/payments/create-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: customerInfo.email,
        fullName: customerInfo.fullName,
        address: {
          street: customerInfo.street,
          city: customerInfo.city,
          state: customerInfo.state,
          zipCode: customerInfo.zipCode,
          country: customerInfo.country,
          formatted: formattedAddress.value
        },
        cart: cart.items,
        taxAmount: Math.round(taxAmount.value * 100),
        totalAmount: Math.round(totalWithTax.value * 100)
      }),
    })

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}))
      throw new Error(errorData.message || 'Payment initialization failed')
    }

    const { clientSecret, checkoutId} = await res.json()
    sessionStorage.setItem("checkoutId", checkoutId)
    console.log(
      'Country sent to Stripe:',
      normalizeCountryToISO(customerInfo.country)
    )



    const result = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: cardElement,
        billing_details: { 
          email: customerInfo.email,
          name: customerInfo.fullName,
          address: {
            line1: customerInfo.street,
            city: customerInfo.city,
            state: customerInfo.state,
            postal_code: customerInfo.zipCode,
            country: normalizeCountryToISO(customerInfo.country)
          }
        },
      },
    })

    if (result.error) {
      storeFailedPayment({
        email: customerInfo.email,
        amount: totalWithTax.value,
        error: result.error.message,
        cart: cart.items,
        customerInfo: { ...customerInfo }
      })

      window.location.href = '/payment-fail'
      
      throw new Error(result.error.message)
    } 

    if (result.paymentIntent.status === 'succeeded') {
       storeSuccessfulPayment({
        paymentIntent: result.paymentIntent,
        email: customerInfo.email,
        amount: totalWithTax.value,
        cart: cart.items,
        customerInfo: { ...customerInfo },
        taxAmount: taxAmount.value,
        checkoutId
      })

      cart.clearCart()
      window.location.href = '/payment-success'
    }
  } catch (e: any) {
    error.value = e.message || 'Payment failed. Please try again.'
    console.error('Payment error:', e)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.checkout-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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

.checkout-wrapper {
  width: 100%;
  max-width: 800px;
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

.checkout-header {
  text-align: center;
  margin-bottom: 2.5rem;
  border-bottom: 2px solid #f0f0f0;
  padding-bottom: 1.5rem;
}

.title {
  font-size: 2.5rem;
  font-weight: 700;
  color: #2d3748;
  margin: 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.subtitle {
  color: #718096;
  font-size: 1rem;
  margin-top: 0.5rem;
}

.section {
  background: #f8fafc;
  border-radius: 16px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  border: 1px solid #e2e8f0;
  transition: transform 0.2s, box-shadow 0.2s;
}

.section:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08);
}

.section-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #2d3748;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.icon {
  font-size: 1.25rem;
}

.cart-items {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.cart-item {
  display: flex;
  gap: 1.5rem;
  align-items: center;
  padding: 1.25rem;
  background: white;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  transition: all 0.3s ease;
}

.cart-item:hover {
  border-color: #667eea;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.1);
}

.item-image-container {
  flex-shrink: 0;
}

.image-wrapper {
  position: relative;
  width: 100px;
  height: 100px;
  border-radius: 12px;
  overflow: hidden;
}

.item-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.cart-item:hover .item-image {
  transform: scale(1.05);
}

.image-indicator {
  position: absolute;
  bottom: 8px;
  right: 8px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 0.75rem;
}

.item-details {
  flex: 1;
}

.item-name {
  font-size: 1.125rem;
  font-weight: 600;
  color: #2d3748;
  margin: 0 0 0.75rem 0;
}

.item-meta {
  display: flex;
  gap: 1rem;
  margin-bottom: 0.75rem;
  font-size: 0.875rem;
  color: #718096;
}

.item-total {
  font-size: 1.25rem;
  font-weight: 600;
  color: #667eea;
  margin: 0;
}

.price-breakdown {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
}

.price-row {
  display: flex;
  justify-content: space-between;
  padding: 0.75rem 0;
  border-bottom: 1px solid #e2e8f0;
  color: #4a5568;
}

.price-row:last-child {
  border-bottom: none;
}

.tax-rate {
  font-size: 0.875rem;
  color: #718096;
  margin-left: 0.5rem;
}

.price-row.total {
  font-size: 1.25rem;
  padding-top: 1.5rem;
  border-top: 2px solid #e2e8f0;
  color: #2d3748;
  font-weight: 600;
}

.field {
  margin-bottom: 1.5rem;
}

.field:last-child {
  margin-bottom: 0;
}

label {
  display: block;
  font-weight: 600;
  color: #4a5568;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

input {
  width: 100%;
  padding: 1rem 1.25rem;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  font-size: 1rem;
  transition: all 0.3s ease;
  background: white;
  box-sizing: border-box;
}

input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

input.has-value {
  border-color: #48bb78;
}

.field-note {
  font-size: 0.875rem;
  color: #718096;
  margin-top: 0.5rem;
}

/* Address Grid */
.address-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-top: 1rem;
}

@media (max-width: 768px) {
  .address-grid {
    grid-template-columns: 1fr;
  }
}

/* Map Container */
.map-container {
  margin-top: 0.5rem;
}

.map-placeholder {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  padding: 1.5rem;
  color: white;
  position: relative;
  overflow: hidden;
}

.map-placeholder::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: 
    radial-gradient(circle at 20% 80%, rgba(255,255,255,0.1) 0%, transparent 20%),
    radial-gradient(circle at 80% 20%, rgba(255,255,255,0.1) 0%, transparent 20%);
}

.map-content {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.map-marker {
  font-size: 2.5rem;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

.address-display {
  flex: 1;
}

.address-display p {
  margin: 0;
}

.map-note {
  font-size: 0.875rem;
  opacity: 0.9;
  margin-top: 0.5rem;
}

.map-actions {
  margin-top: 1.5rem;
  position: relative;
  z-index: 1;
}

.map-btn {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.map-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
}

.card-element {
  padding: 1rem 1.25rem;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  background: white;
}

.card-icons {
  display: flex;
  gap: 1rem;
  margin-top: 0.75rem;
  font-size: 0.875rem;
  color: #718096;
  flex-wrap: wrap;
}

.payment-section {
  margin-top: 2.5rem;
  text-align: center;
}

.pay-button {
  width: 100%;
  padding: 1.25rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 16px;
  font-size: 1.125rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
}

.pay-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 12px 40px rgba(102, 126, 234, 0.4);
}

.pay-button:active:not(:disabled) {
  transform: translateY(0);
}

.pay-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  background: #a0aec0;
}

.loading-content {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.spinner {
  width: 20px;
  height: 20px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.security-note {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 1rem;
  color: #718096;
  font-size: 0.875rem;
}

.error-message {
  margin-top: 1.5rem;
  padding: 1.25rem;
  background: #fed7d7;
  border: 1px solid #fc8181;
  border-radius: 12px;
  color: #c53030;
  display: flex;
  gap: 0.75rem;
  align-items: flex-start;
  animation: shake 0.5s ease-in-out;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}

@media (max-width: 768px) {
  .checkout-container {
    padding: 1rem;
  }

  .checkout-wrapper {
    padding: 1.5rem;
  }

  .title {
    font-size: 2rem;
  }

  .cart-item {
    flex-direction: column;
    text-align: center;
    gap: 1rem;
  }

  .item-meta {
    justify-content: center;
  }

  .card-icons {
    justify-content: center;
  }

  .map-content {
    flex-direction: column;
    text-align: center;
    gap: 1rem;
  }
}

input[type="email"],
input[type="text"] {
  width: 100%;
  box-sizing: border-box;
  max-width: 100%;
  padding: 1rem 1.25rem;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  font-size: 1rem;
  transition: all 0.3s ease;
  background: white;
  display: block;
}

input[type="email"]:focus,
input[type="text"]:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

input[type="email"].has-value,
input[type="text"].has-value {
  border-color: #48bb78;
}
</style>