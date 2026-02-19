<template>
  <div class="cart-container">
    <h1 class="title">Your Shopping Cart:</h1>

    <div v-if="cartItems.length === 0" class="empty-cart">
      <div class="empty-cart-icon">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 3H5L5.4 5M7 13H17L21 5H5.4M7 13L5.4 5M7 13L4.7 15.3C4.3 15.7 4.6 16.4 5.2 16.4H17M17 13V16.4M9 19C9 19.6 8.6 20 8 20C7.4 20 7 19.6 7 19C7 18.4 7.4 18 8 18C8.6 18 9 18.4 9 19ZM17 19C17 19.6 16.6 20 16 20C15.4 20 15 19.6 15 19C15 18.4 15.4 18 16 18C16.6 18 17 18.4 17 19Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <p class="empty-message">Your cart is empty</p>
      <p class="empty-subtitle">Browse our shop to add items to your cart</p>
      <button class="continue-shopping-btn" @click="$router.push('/shop')">Continue Shopping</button>
    </div>

    <div v-else class="cart-content">
      <div class="cart-list">
        <div v-for="item in cartItems" :key="item.id" class="cart-item-card">
          <!-- Image Carousel -->
          <div class="image-section">
            <div class="carousel-wrapper">
              <div class="carousel">
                <img
                  v-for="(img, index) in item.images"
                  :key="index"
                  :src="fullImageUrl(img)"
                  :alt="`${item.name} image ${index + 1}`"
                  class="item-image"
                  :class="{ active: currentImageIndex(item.id) === index }"
                />
              </div>
              
              <!-- Carousel Controls -->
              <button 
                v-if="item.images && item.images.length > 1" 
                class="carousel-btn prev-btn" 
                @click="prevImage(item.id, item.images.length)"
                aria-label="Previous image"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>
              <button 
                v-if="item.images && item.images.length > 1" 
                class="carousel-btn next-btn" 
                @click="nextImage(item.id, item.images.length)"
                aria-label="Next image"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 18L15 12L9 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>
              
              <!-- Image Indicators -->
              <div v-if="item.images && item.images.length > 1" class="image-indicators">
                <span 
                  v-for="(img, index) in item.images" 
                  :key="index" 
                  class="indicator" 
                  :class="{ active: currentImageIndex(item.id) === index }"
                  @click="setImageIndex(item.id, index)"
                ></span>
              </div>
            </div>
          </div>

          <!-- Item Info -->
          <div class="info-section">
            <div class="item-header">
              <h2 class="item-name">{{ item.name }}</h2>
              <button class="remove-btn" @click="remove(item.id)" aria-label="Remove item">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>
            </div>
            
            <p class="item-price">{{ formatCurrency(item.price) }}</p>
            
            <div class="item-details">
              <p v-if="item.category" class="detail"><span>Category:</span> {{ item.category }}</p>
              <p v-if="item.material" class="detail"><span>Material:</span> {{ item.material }}</p>
              <p v-if="item.producer" class="detail"><span>Producer:</span> {{ item.producer }}</p>
              <p v-if="item.size"     class="detail"><span>Size:</span>     {{ item.size }}</p>

            </div>

            <div class="quantity-control">
              <label for="quantity">Quantity:</label>
              <div class="quantity-input-wrapper">
                <button 
                  class="quantity-btn minus" 
                  @click="decreaseQuantity(item)"
                  :disabled="item.quantity <= 1"
                  aria-label="Decrease quantity"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M5 12H19" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </button>
                <input
                  id="quantity"
                  type="number"
                  min="1"
                  v-model.number="item.quantity"
                  @change="updateQuantity(item)"
                  class="quantity-input"
                />
                <button 
                  class="quantity-btn plus" 
                  @click="increaseQuantity(item)"
                  aria-label="Increase quantity"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 5V19M5 12H19" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </button>
              </div>
            </div>

            <div class="subtotal">
              <p>Subtotal: <strong>{{ formatCurrency(item.price * (item.quantity ?? 1)) }}</strong></p>
            </div>
          </div>
        </div>
      </div>

      <!-- Cart Summary -->
      <div class="cart-summary">
        <div class="summary-card">
          <h2 class="summary-title">Order Summary</h2>
          
          <div class="summary-row">
            <span>Subtotal ({{ cartItems.length }} {{ cartItems.length === 1 ? 'item' : 'items' }})</span>
            <span>{{ formatCurrency(totalPrice) }}</span>
          </div>
          
          <div class="summary-row">
            <span>Shipping</span>
            <span>{{ formatCurrency(0) }}</span>
          </div>
          
          <div class="summary-row">
            <span>Tax</span>
            <span>{{ formatCurrency(taxAmount) }}</span>
          </div>
          
          <div class="summary-divider"></div>
          
          <div class="summary-row total">
            <span>Total</span>
            <span>{{ formatCurrency(totalPrice + taxAmount) }}</span>
          </div>
          
          <button class="pay-btn" @click="proceedToPayment">
            Proceed to Payment
          </button>
          
          <button class="continue-shopping-btn secondary" @click="$router.push('/shop')">
            Continue Shopping
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useCartStore } from "@/stores/cart";

const router = useRouter();
const cartStore = useCartStore();

const BASE_URL = import.meta.env.VITE_API_URL;

const cartItems = computed(() => cartStore.items);
const totalPrice = computed(() => cartStore.totalPrice);


// Image indexes for each item
const imageIndexes = ref<Record<number, number>>({});

const remove = (id: number) => {
  cartStore.removeFromCart(id);
};

const updateQuantity = (item: any) => {
  if (item.quantity < 1) item.quantity = 1;
  cartStore.updateQuantity(item.id, item.quantity);
};

const increaseQuantity = (item: any) => {
  item.quantity += 1;
  updateQuantity(item);
};

const decreaseQuantity = (item: any) => {
  if (item.quantity > 1) {
    item.quantity -= 1;
    updateQuantity(item);
  }
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);

// Image handling functions
const fullImageUrl = (path: string) => {
  // Handle both cases where path might already be a full URL or just a path
  if (path.startsWith('http')) return path;
  
  // Ensure the path starts with a slash if it doesn't have one
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${BASE_URL}${normalizedPath}`;
};
const currentImageIndex = (itemId: number) => {
  return imageIndexes.value[itemId] || 0;
};

const nextImage = (itemId: number, totalImages: number) => {
  const currentIndex = currentImageIndex(itemId);
  imageIndexes.value[itemId] = (currentIndex + 1) % totalImages;
};

const prevImage = (itemId: number, totalImages: number) => {
  const currentIndex = currentImageIndex(itemId);
  imageIndexes.value[itemId] = (currentIndex - 1 + totalImages) % totalImages;
};

const setImageIndex = (itemId: number, index: number) => {
  imageIndexes.value[itemId] = index;
};

const taxAmount = computed(() => {
  // Assuming 8% tax rate
  return totalPrice.value * cartStore.getTax;
});

const proceedToPayment = () => {
  // Navigate to payment page or show payment modal
  alert('Proceeding to payment...');
  router.push('/payment');
};
</script>

<style scoped>
.cart-container {
  overflow: visible !important;
  max-width: relative;
  margin: 0 auto;
  padding: 2rem 1rem;
  background: linear-gradient(135deg, #8e9c24, #2f855a);
  min-height: 100vh;
  background-image: url('../assets/cartBackgroun.jpg');
}

.title {
  font-size: 2rem;
  font-weight: 700;
  color: #fbfbfb;
  padding-left: 1vh;
  margin-bottom: 2rem;
  text-align: left;
}

/* Empty Cart Styles */
.empty-cart {
  text-align: center;
  padding: 4rem 2rem;
  background: linear-gradient(135deg, #b0c60e, #2f855a);
  background-color: #f8fafc;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}

.empty-cart-icon {
  color: #cbd5e0;
  margin-bottom: 1.5rem;
}

.empty-message {
  font-size: 1.5rem;
  font-weight: 600;
  color: #4a5568;
  margin-bottom: 0.5rem;
}

.empty-subtitle {
  color: #718096;
  margin-bottom: 2rem;
}

.continue-shopping-btn {
  background-color: #4299e1;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
  justify-content: center;
}

.continue-shopping-btn:hover {
  background-color: #3182ce;
}

.continue-shopping-btn.secondary {
  background-color: transparent;
  color: #4299e1;
  border: 1px solid #4299e1;
  margin-top: 1rem;
}

.continue-shopping-btn.secondary:hover {
  background-color: #ebf8ff;
}

/* Cart Content Layout */
.cart-content {
  display: grid;
  grid-template-columns: 1fr 350px;
  gap: 1rem;
  align-items: start;
}

/* Cart Item Styles */
.cart-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.cart-item-card {
  
  display: flex;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  transition: transform 0.2s, box-shadow 0.2s;
}

.cart-item-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

/* Image Section */
.image-section {
  width: 200px;
  flex-shrink: 0;
  position: relative;
}

.carousel-wrapper {
  position: relative;
  height: 100%;
  overflow: hidden;
}

.carousel {
  position: relative;
  height: 100%;
}

.item-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.item-image.active {
  opacity: 1;
}

.carousel-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(255, 255, 255, 0.8);
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 10;
  transition: background-color 0.2s;
}

.carousel-btn:hover {
  background: rgba(255, 255, 255, 1);
}

.prev-btn {
  left: 8px;
}

.next-btn {
  right: 8px;
}

.image-indicators {
  position: absolute;
  bottom: 12px;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  gap: 6px;
  z-index: 10;
}

.indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  transition: background-color 0.2s;
}

.indicator.active {
  background-color: white;
}

/* Info Section */
.info-section {
  background: linear-gradient(135deg, #b0c60e, #2f855a);
  flex: 1;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.item-name {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1a202c;
  margin: 0;
}

.remove-btn {
  background: none;
  border: none;
  color: #a0aec0;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: color 0.2s, background-color 0.2s;
}

.remove-btn:hover {
  color: #e53e3e;
  background-color: #fed7d7;
}

.item-price {
  font-size: 1.125rem;
  font-weight: 600;
  color: #2d3748;
  margin: 0;
}

.item-details {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  
}

.detail {
  font-size: 0.875rem;
  color: #718096;
  margin: 0;
}

.detail span {
  font-weight: 500;
  color: #4a5568;
}

/* Quantity Control */
.quantity-control {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.quantity-control label {
  font-weight: 500;
  color: #4a5568;
}

.quantity-input-wrapper {
  display: flex;
  align-items: center;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  overflow: hidden;
}

.quantity-btn {
  background: #f7fafc;
  border: none;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.2s;
}

.quantity-btn:hover:not(:disabled) {
  background: #edf2f7;
}

.quantity-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.quantity-input {
  width: 50px;
  height: 36px;
  border: none;
  text-align: center;
  font-size: 1rem;
  -moz-appearance: textfield;
}

.quantity-input::-webkit-outer-spin-button,
.quantity-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.subtotal {
  margin-top: auto;
  font-size: 1.125rem;
  color: #2d3748;
}

.subtotal strong {
  color: #1a202c;
}

/* Cart Summary */
.cart-summary {
  position: sticky;
  top: 2rem;
}

.summary-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
  padding: 1.5rem;
}

.summary-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1a202c;
  margin-top: 0;
  margin-bottom: 1.5rem;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 1rem;
  color: #4a5568;
}

.summary-row.total {
  font-weight: 600;
  font-size: 1.125rem;
  color: #1a202c;
}

.summary-divider {  
  height: 1px;
  background: #e2e8f0;
  margin: 1rem 0;
}

.pay-btn {
  width: 100%;
  background-color: #48bb78;
  color: white;
  border: none;
  padding: 0.875rem;
  border-radius: 8px;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
  margin-top: 1rem;
}

.pay-btn:hover {
  background-color: #38a169;
}

@media (max-width: 1000px) {
  .summary-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
  max-width: 260px ;
  padding: 1.5rem;
  }

  .cart-list{
    max-width: 100vh;
    
  }
  
}



/* Responsive Design */
@media (max-width: 768px) {
  .cart-content {
    grid-template-columns: 1fr;
  }
  
  .cart-item-card {
    flex-direction: column;
  }
  
  .image-section {
    width: 100%;
    height: 200px;
  }
  
  .cart-summary {
    position: static;
    max-width: fit-content;
  }
  .summary-card{
    max-width: fit-content;
  }
}
</style>