<template>
  <nav class="navbar" :class="{ 'navbar-scrolled': isScrolled }">
    <ul>
      <li><RouterLink to="/">Home</RouterLink></li>
      <li><RouterLink to="/shop">Shop</RouterLink></li>

      <!-- CART LINK WITH HOVER DROPDOWN -->
      <li 
        class="cart-wrapper"
        :class="{ 'cart-not-empty': cart.totalItems > 0 }"
      >
        <RouterLink to="/cart" class="cart-link">
          {{ cart.totalItems > 0 ? `Cart (${cart.totalItems})` : 'Cart' }}
        </RouterLink>

        <!-- HOVER DROPDOWN -->
        <div class="cart-dropdown" v-if="cart.totalItems > 0">
          <h3>Your Cart</h3>

          <div v-for="item in cart.items" :key="item.id" class="cart-item">
            <img
              class="cart-item-image"
              :src="resolveImage(item.images)"
              alt="item"
            />

            <div class="cart-item-details">
              <h4>{{ item.name }}</h4>
              <div class="cart-item-info">
                <span>Price: ${{ item.price }}</span>
                <span>Qty: {{ item.quantity }}</span>
              </div>
            </div>

            <button 
              class="remove-btn"
              @click="cart.removeFromCart(item.id)"
            >
              Remove
            </button>
          </div>

          <div class="cart-summary">
            <strong>Total: </strong>${{ cart.totalPrice.toFixed(2) }}
          </div>

          <RouterLink to="/payment" class="payment-btn">
            Go to Cart / Payment
          </RouterLink>
        </div>
      </li>

      <!-- Admin-only -->
      <li v-if="auth.isAdmin()">
        <RouterLink to="/admin">Admin</RouterLink>
      </li>

      <li v-if="auth.isAdmin()">
        <RouterLink to="/adminOrders">Admin Orders</RouterLink>
      </li>

      <li v-if="auth.isAdmin()">
        <button @click="logout">Logout</button>
      </li>
    </ul>
  </nav>
</template>

<script setup lang="ts">
import { useAuthStore } from '../stores/auth'
import { useCartStore } from '../stores/cart'
import { ref, onMounted, onUnmounted } from 'vue'

const auth = useAuthStore()
const cart = useCartStore()
const BASE_URL = "http://localhost:5000"

const isScrolled = ref(false)

const handleScroll = () => {
  isScrolled.value = window.scrollY > 5
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll, { passive: true })
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})

const logout = () => {
  auth.logout()
}

const fullImageUrl = (path: string) => {
  if (path.startsWith("http")) return path
  const normalizedPath = path.startsWith("/") ? path : `/${path}`
  return `${BASE_URL}${normalizedPath}`
}

const resolveImage = (images?: string[]) => {
  const first = images?.[0]
  return first ? fullImageUrl(first) : ""
}
</script>

<style scoped>
/* -------------------------------------------------------------
   NAVBAR (ALWAYS VISIBLE)
------------------------------------------------------------- */
.navbar {
  display: flex;
  background: #111;
  padding: 1rem;

  position: fixed; /* ALWAYS visible */
  top: 0;
  left: 0;
  width: 100%;

  z-index: 1000;

  transition: 
    background 0.3s ease,
    backdrop-filter 0.3s ease;
}

/* SCROLLED STATE */
.navbar-scrolled {
  background: rgba(17, 17, 17, 0.65);
  backdrop-filter: blur(8px);
}

/* ------------------------------------------------------------- */
ul {
  display: flex;
  gap: 1rem;
  list-style: none;
  margin: 0;
  padding: 0;
}

a, .cart-link {
  color: white;
  text-decoration: none;
  font-weight: bold;
}

/* -------------------------------------------------------------
   CART LINK ANIMATION
------------------------------------------------------------- */
.cart-not-empty > .cart-link {
  animation: colorPulse 1.2s infinite alternate;
}

@keyframes colorPulse {
  0% { color: #ff4747; }
  50% { color: #ffd447; }
  100% { color: #47ff7a; }
}

/* -------------------------------------------------------------
   DROPDOWN - IMPROVED HOVER BEHAVIOR
------------------------------------------------------------- */
.cart-wrapper {
  position: relative;
}

/* Create an invisible hover zone between navbar and dropdown */
.cart-wrapper::after {
  content: "";
  position: absolute;
  top: 100%;
  left: 50%;

  height: 45px; /* Increased hover zone */
  width: 45px;
  background: transparent;
  z-index: 1001;
}

.cart-wrapper:hover .cart-dropdown,
.cart-dropdown:hover {
  opacity: 1;
  visibility: visible;
  transform: translateY(0);
  pointer-events: auto;
}

.cart-dropdown {
  position: absolute;
  top: 2.6rem;
  right: 1;

  width: 360px;
  max-width: calc(100vw - 20px);
  max-height: 420px;

  background: rgba(34, 34, 34, 0.95); /* Slightly transparent */
  color: #fff;
  padding: 1rem;
  border-radius: 10px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.7);
  border: 1px solid rgba(255, 255, 255, 0.1);

  overflow-y: auto;
  overflow-x: hidden;

  opacity: 0;
  visibility: hidden;
  transform: translateY(12px);
  pointer-events: none;

  transition: all 0.2s ease;
  z-index: 1002;
}

/* -------------------------------------------------------------
   CART ITEM - IMPROVED LAYOUT
------------------------------------------------------------- */
.cart-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: rgba(51, 51, 51, 0.8);
  padding: 0.75rem;
  border-radius: 8px;
  margin-bottom: 0.75rem;
  width: 100%;
}

.cart-item-image {
  width: 60px;
  height: 60px;
  flex-shrink: 0;
  border-radius: 6px;
  object-fit: cover;
}

.cart-item-details {
  flex: 1;
  min-width: 0;
}

.cart-item-details h4 {
  font-size: 0.95rem;
  margin: 0 0 0.25rem 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cart-item-info {
  display: flex;
  gap: 1rem;
  font-size: 0.8rem;
  color: #ccc;
}

.cart-item-info span {
  display: inline-block;
}

/* -------------------------------------------------------------
   REMOVE BUTTON
------------------------------------------------------------- */
.remove-btn {
  background: #cc0000;
  border: none;
  padding: 0.4rem 0.7rem;
  border-radius: 5px;
  color: white;
  font-size: 0.75rem;
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
  transition: background 0.2s ease;
}

.remove-btn:hover {
  background: #ff0000;
}

/* -------------------------------------------------------------
   CART SUMMARY
------------------------------------------------------------- */
.cart-summary {
  text-align: right;
  margin: 1rem 0;
  padding-top: 0.75rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 1.1rem;
}

.payment-btn {
  display: block;
  width: 100%;
  background: #1db954;
  padding: 0.75rem;
  border-radius: 6px;
  font-weight: bold;
  text-align: center;
  color: white;
  transition: background 0.2s ease;
}

.payment-btn:hover {
  background: #20d464;
}

/* -------------------------------------------------------------
   MOBILE
------------------------------------------------------------- */
@media (max-width: 768px) {
  ul {
    gap: 0.5rem;
  }

  a {
    font-size: 0.9rem;
  }

  .navbar {
    padding: 0.6rem;
  }

  .cart-dropdown {
    width: 280px;
    max-width: 92vw;
    padding: 0.8rem;
  }

  .cart-item {
    padding: 0.6rem;
    gap: 0.6rem;
  }

  .cart-item-image {
    width: 45px;
    height: 45px;
  }

  .cart-item-info {
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .payment-btn {
    padding: 0.6rem;
    font-size: 0.85rem;
  }
  
  .remove-btn {
    padding: 0.3rem 0.5rem;
    font-size: 0.7rem;
  }
}
</style>