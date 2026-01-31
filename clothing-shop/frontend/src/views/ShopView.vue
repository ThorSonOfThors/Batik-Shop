<template>
  <div>
  <div class="shop-container" :style="bgImage">
    <h1 class="shop-title">🛍️ Our Collection</h1>

    <!-- 🔍 Search Bar -->
    <div class="search-bar">
      <input
        v-model="searchQuery"
        @input="filterItems"
        type="text"
        placeholder="Search by name, category, material, or producer..."
      />
    </div>

    <!-- 🧾 Items Grid -->
    <div class="items-grid">
      <div 
        v-for="item in filteredItems" 
        :key="item.id" 
        class="item-card"
        :style="cardStyle"
        @click="openItemModal(item)" 
      >
        <!-- Image Carousel -->
        <div class="image-carousel">
          <div class="image-wrapper">
            <img
              :src="currentImage(item)"
              :alt="item.name"
              class="item-image"
              @click.stop="nextImage(item)"
            />
          </div>
          <div class="carousel-controls">
            <button @click.stop="prevImage(item)" class="carousel-btn">‹</button>
            <button @click.stop="nextImage(item)" class="carousel-btn">›</button>
          </div>
          <!-- Image Indicators -->
          <div v-if="item.images && item.images.length > 1" class="image-indicators">
            <span 
              v-for="(img, index) in item.images" 
              :key="index" 
              class="indicator" 
              :class="{ active: currentImageIndex(item.id) === index }"
            ></span>
          </div>
        </div>

        <!-- Item Details -->
        <div class="item-details">
          <h2 class="item-name">{{ item.name }}</h2>
          <div class="item-info-grid">
            <p class="item-category"><span>Category:</span> {{ item.category }}</p>
            <p class="item-material"><span>Material:</span> {{ item.material }}</p>
            <p class="item-producer"><span>Producer:</span> {{ item.producer }}</p>
            <p class="item-size"><span>Size:</span> {{ item.size }}</p>
          </div>
          <p class="item-price">{{ formatCurrency(item.price) }}</p>

          <button class="add-to-cart-btn" @click.stop="addToCart(item)">
            <span class="cart-icon">🛒</span> Add to Cart
          </button>
        </div>
      </div>
    </div>

    <!-- Item Detail Modal -->
    <div v-if="selectedItem" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <button class="modal-close" @click="closeModal">×</button>
        
        <div class="modal-body">
          <!-- Left Column - Images -->
          <div class="modal-images">
            <div class="modal-main-image">
              <img 
                :src="currentImage(selectedItem)" 
                :alt="selectedItem.name"
                class="modal-image"
              />
            </div>
            
            <!-- Thumbnails -->
            <div v-if="selectedItem.images && selectedItem.images.length > 1" class="modal-thumbnails">
              <div 
                v-for="(img, index) in selectedItem.images" 
                :key="index"
                class="thumbnail-container"
                :class="{ active: currentImageIndex(selectedItem.id) === index }"
                @click="setImageIndex(selectedItem.id, index)"
              >
                <img :src="img" :alt="`${selectedItem.name} - image ${index + 1}`" class="thumbnail" />
              </div>
            </div>
            
            <!-- Mobile Carousel Controls -->
            <div class="modal-carousel-controls">
              <button @click="prevImage(selectedItem)" class="modal-carousel-btn">‹</button>
              <button @click="nextImage(selectedItem)" class="modal-carousel-btn">›</button>
            </div>
          </div>

          <!-- Right Column - Details -->
          <div class="modal-details">
            <h2 class="modal-item-name">{{ selectedItem.name }}</h2>
            
            <!-- Description -->
            <div class="modal-description">
              <h3>Description</h3>
              <p>{{ selectedItem.description || 'No description available.' }}</p>
            </div>

            <!-- Specifications -->
            <div class="modal-specs">
              <div class="spec-grid">
                <div class="spec-item">
                  <span class="spec-label">Category:</span>
                  <span class="spec-value">{{ selectedItem.category }}</span>
                </div>
                <div class="spec-item">
                  <span class="spec-label">Material:</span>
                  <span class="spec-value">{{ selectedItem.material }}</span>
                </div>
                <div class="spec-item">
                  <span class="spec-label">Producer:</span>
                  <span class="spec-value">{{ selectedItem.producer }}</span>
                </div>
                <div class="spec-item">
                  <span class="spec-label">Size:</span>
                  <span class="spec-value">{{ selectedItem.size }}</span>
                </div>
              </div>
            </div>

            <!-- Price & Action -->
            <div class="modal-action">
              <div class="modal-price">{{ formatCurrency(selectedItem.price) }}</div>
              <button class="modal-add-to-cart" @click="addToCart(selectedItem)">
                <span class="cart-icon">🛒</span> Add to Cart
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import api from "../api/axios";
import { useCartStore } from "../stores/cart";
import { useBackgroundStore } from '@/stores/backgroundStore';
import type { Item } from "@/types/Item";

const cart = useCartStore();
const backgroundStore = useBackgroundStore();

// Reactive state
const items = ref<Item[]>([]);
const filteredItems = ref<Item[]>([]);
const searchQuery = ref("");
const imageIndexes = ref<Record<number, number>>({});
const selectedItem = ref<Item | null>(null);

// Background images
const backgrounds = [
  new URL('../assets/newShopBackground2.jpg', import.meta.url).href,
  new URL('../assets/newShopBackground.jpg', import.meta.url).href,
  new URL('../assets/redBackgroundShop.jpg', import.meta.url).href
];

// Card gradients
const gradients = [
  "linear-gradient(135deg, #5a1ed0, #0c0221)",
  "linear-gradient(135deg, #7a7289, #afa51a)", 
  "linear-gradient(135deg, #960808, #000000)"
];

// Computed properties
const bgImage = computed(() => ({
  backgroundImage: `url(${backgrounds[backgroundStore.bgIndex]})`,
  backgroundSize: 'fit',
  backgroundPosition: 'center',
  backgroundRepeat: 'repeat',
  transition: 'background-image 2s ease-in-out',
  opacity: '1'
}));

const cardStyle = computed(() => ({
  background: gradients[backgroundStore.bgIndex],
}));

const BASE_URL = import.meta.env.VITE_API_URL;

// Fetch items
const fetchItems = async () => {
  try {
    const response = await api.get("/items");
    items.value = response.data
      .filter((item: Item) => item.status !== "sold" && item.status !== "pending")
      .map((item: any) => {
        const images = Array.isArray(item.image) 
          ? item.image 
          : JSON.parse(item.image || "[]");
        
        const fixedImages = images.map((img: string) => `${BASE_URL}${img}`);
        
        return {
          ...item,
          images: fixedImages,
        };
      });
    
    filteredItems.value = items.value;
  } catch (error) {
    console.error("Error fetching items:", error);
    alert("Error fetching items");
  }
};

// Search functionality
const filterItems = () => {
  const q = searchQuery.value.toLowerCase();
  filteredItems.value = items.value.filter((item) => 
    `${item.name} ${item.category} ${item.material} ${item.producer} ${item.size} ${item.description || ''}`
      .toLowerCase()
      .includes(q)
  );
};

// Image carousel helpers
const currentImageIndex = (itemId: number) => imageIndexes.value[itemId] || 0;

const currentImage = (item: Item) => {
  const index = currentImageIndex(item.id);
  return item.images?.length ? item.images[index] : "/default-placeholder.png";
};

const setImageIndex = (itemId: number, index: number) => {
  imageIndexes.value[itemId] = index;
};

const nextImage = (item: Item) => {
  if (!item.images?.length) return;
  const index = currentImageIndex(item.id);
  imageIndexes.value[item.id] = (index + 1) % item.images.length;
};

const prevImage = (item: Item) => {
  if (!item.images?.length) return;
  const index = currentImageIndex(item.id);
  imageIndexes.value[item.id] = (index - 1 + item.images.length) % item.images.length;
};

// Modal functionality
const openItemModal = (item: Item) => {
  selectedItem.value = item;
  if (!imageIndexes.value[item.id]) imageIndexes.value[item.id] = 0;
  document.body.style.overflow = 'hidden';
};

const closeModal = () => {
  selectedItem.value = null;
  document.body.style.overflow = 'auto';
};

// Cart functionality
const addToCart = (item: Item) => {
  cart.addToCart(item);
  closeModal();
  alert(`✅ ${item.name} added to cart!`);
};

// Format currency
const formatCurrency = (value: number) => 
  new Intl.NumberFormat("en-US", { 
    style: "currency", 
    currency: "USD" 
  }).format(value);

// Lifecycle hooks
onMounted(() => {
  fetchItems();
  backgroundStore.startRotation(backgrounds.length);
});
</script>


<style scoped>

/* Fix for white space on small screens */
.shop-container {
  max-width: 100%;
  margin: 0 auto;
  padding: 1rem;
  min-height: 100vh;
  /*background: url('../assets/newShopBackground2.jpg') center/contain;*/
  /*background-size: contain;*/
  /* Add these lines to fix white space */
  transition: opacity 1s ease-in-out;
  width: 100%;
  overflow-x: hidden; /* Prevent horizontal scroll */
}

/* Add this to the very beginning of your style section */
:deep(*) {
  box-sizing: border-box;
}

/* Ensure all elements stay within container */
.shop-title,
.search-bar,
.items-grid {
  max-width: 100%;
  width: 100%;
}

/* Update items grid to prevent overflow */
.items-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
  padding: 0.5rem;
  width: 100%;
}

/* Mobile: 2 items per row - ensure they fit */
@media (max-width: 640px) {
  .items-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
    padding: 0.25rem;
  }
  
  /* Ensure items don't overflow */
  .item-card {
    max-width: 100%;
    min-width: 0; /* Prevent flex item from overflowing */
  }
}

@media (max-width: 480px) {
  .items-grid {
    grid-template-columns: 1fr;
    max-width: 100%;
    margin: 0 auto;
  }
}

/* Update modal to prevent overflow on mobile */
@media (max-width: 768px) {
  .modal-content {
    margin: 0.5rem;
    width: calc(100% - 1rem); /* Ensure it doesn't exceed viewport */
  }
}

/* Additional fix for any potential horizontal scroll */
@media (max-width: 768px) {
  .shop-container {
    padding: 0.5rem;
  }
  
  .search-bar {
    max-width: 100%;
    padding: 0 0.5rem;
  }
  
  .search-bar input {
    width: 100%;
  }
}

/* Add this as a last resort to completely eliminate horizontal scroll */
body {
  overflow-x: hidden;
}

/* Or if you want to be more specific */
:deep(body) {
  max-width: 100vw;
  overflow-x: hidden;
}


.shop-title {
  font-size: clamp(1.8rem, 4vw, 2.5rem);
  font-weight: 700;
  color: #ffffff;
  text-align: center;
  margin-bottom: 1.5rem;
  padding: 0.5rem;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
}

/* Search Bar */
.search-bar {
  margin-bottom: 1.5rem;
  max-width: 90%;
  margin-left: auto;
  margin-right: auto;
}

.search-bar input {
  width: 100%;
  padding: 0.75rem 1.25rem;
  border: 2px solid #e2e8f0;
  border-radius: 50px;
  font-size: clamp(0.9rem, 2vw, 1rem);
  transition: all 0.3s ease;
  background: linear-gradient(135deg, #4d0202 0%, #000000 100%);
  color: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.search-bar input:focus {
  outline: none;
  border-color: #ffffff;
  box-shadow: 0 4px 12px rgba(255, 255, 255, 0.15);
  transform: translateY(-1px);
}

.search-bar input::placeholder {
  color: rgba(255, 255, 255, 0.7);
}

/* Items Grid - Mobile Responsive */
.items-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
  padding: 0.5rem;
}

/* Mobile: 2 items per row */
@media (max-width: 640px) {
  .items-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }
}

@media (max-width: 480px) {
  .items-grid {
    grid-template-columns: 1fr;
    max-width: 350px;
    margin: 0 auto;
  }
}

/* Item Card */
.item-card {
  background: var(--card-gradient, linear-gradient(135deg, #5a1ed0, #0c0221));
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  overflow: hidden;
    transition: 
    all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94),
    background 2s ease-in-out; 
  border: 1px solid rgba(255, 255, 255, 0.1);
  cursor: pointer;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.item-card:hover {
  transform: translateY(-8px) scale(1.02);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
}

/* Image Carousel */
.image-carousel {
  position: relative;
  height: 200px;
  overflow: hidden;
  background: #f8fafc;
  flex-shrink: 0;
}

.image-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.item-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.carousel-controls {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 0.5rem;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.item-card:hover .carousel-controls {
  opacity: 1;
}

.carousel-btn {
  background: rgba(255, 255, 255, 0.9);
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  font-weight: bold;
  color: #4a5568;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.carousel-btn:hover {
  background: white;
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.image-indicators {
  position: absolute;
  bottom: 8px;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  gap: 4px;
}

.indicator {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.5);
  transition: background-color 0.3s ease;
}

.indicator.active {
  background-color: white;
}

/* Item Details */
.item-details {
  padding: 1rem;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}

.item-name {
  font-size: clamp(0.9rem, 2vw, 1.1rem);
  font-weight: 600;
  color: #ffffff;
  margin: 0 0 0.75rem 0;
  line-height: 1.3;
  min-height: 2.6em;
}

.item-info-grid {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin-bottom: 0.75rem;
  flex-grow: 1;
}

.item-category,
.item-material,
.item-producer,
.item-size {
  font-size: clamp(0.75rem, 1.5vw, 0.875rem);
  color: rgba(255, 255, 255, 0.9);
  margin: 0;
  line-height: 1.3;
}

.item-category span,
.item-material span,
.item-producer span,
.item-size span {
  font-weight: 600;
  color: #ffffff;
  margin-right: 0.25rem;
}

.item-price {
  font-size: clamp(1rem, 2vw, 1.25rem);
  font-weight: 700;
  color: #ffffff;
  margin: 0.5rem 0 1rem 0;
}

/* Add to Cart Button */
.add-to-cart-btn {
  width: 100%;
  background: linear-gradient(135deg, #b0c60e, #2f855a);
  color: rgb(255, 255, 255);
  border: none;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-size: clamp(0.85rem, 1.5vw, 0.95rem);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  box-shadow: 0 2px 4px rgba(187, 89, 72, 0.2);
  margin-top: auto;
}

.add-to-cart-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(72, 187, 120, 0.3);
  background: linear-gradient(135deg, #123222, #555f0a);
}

.add-to-cart-btn:active {
  transform: translateY(0);
}

.cart-icon {
  font-size: 1rem;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(5px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.modal-content {
  background: linear-gradient(135deg, #5831d7, #524d5d);
  border-radius: 16px;
  max-width: 900px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  animation: slideUp 0.3s ease;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

@keyframes slideUp {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.modal-close {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: rgba(255, 255, 255, 0.9);
  border: none;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  font-size: 1.5rem;
  font-weight: bold;
  color: #333;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1001;
  transition: all 0.2s ease;


  background-color: nt(135deg, #7a7289, #afa51a)
 
}

.modal-close:hover {
  background: white;
  transform: scale(1.1);
}

.modal-body {
  display: flex;
  flex-direction: column;
  padding: 2rem;
}

@media (min-width: 768px) {
  .modal-body {
    flex-direction: row;
    gap: 2rem;
  }
}

.modal-images {
  flex: 1;
  position: relative;
}

.modal-main-image {
  width: 100%;
  height: 300px;
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 1rem;
}

.modal-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.modal-thumbnails {
  display: none;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.5rem;
  margin-bottom: 1rem;
}

@media (min-width: 350px) {
  .modal-thumbnails {
    display: grid;
  }
}

.thumbnail-container {
  width: 100%;
  height: 80px;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.2s ease;
}

.thumbnail-container.active {
  border-color: #ffffff;
}

.thumbnail {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.modal-carousel-controls {
  display: flex;
  justify-content: space-between;
  margin-top: 1rem;
}

@media (min-width: 350px) {
  .modal-carousel-controls {
    display: none;
  }
}

.modal-carousel-btn {
  background: rgba(255, 255, 255, 0.9);
  border: none;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  font-size: 1.5rem;
  font-weight: bold;
  color: #333;
  cursor: pointer;
  transition: all 0.2s ease;
}

.modal-carousel-btn:hover {
  background: white;
  transform: scale(1.1);
}

.modal-details {
  flex: 1;
  color: white;
}

.modal-item-name {
  font-size: clamp(1.5rem, 3vw, 2rem);
  font-weight: 700;
  margin-bottom: 1.5rem;
  color: #ffffff;
}

.modal-description {
  margin-bottom: 2rem;
}

.modal-description h3 {
  font-size: 1.2rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
  color: #ffffff;
}

.modal-description p {
  font-size: 1rem;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.9);
  margin: 0;
}

.modal-specs {
  margin-bottom: 2rem;
}

.spec-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

@media (max-width: 640px) {
  .spec-grid {
    grid-template-columns: 1fr;
  }
}

.spec-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.spec-label {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.7);
  font-weight: 500;
}

.spec-value {
  font-size: 1rem;
  color: #ffffff;
  font-weight: 600;
}

.modal-action {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding-top: 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
}

.modal-price {
  font-size: clamp(1.5rem, 3vw, 2rem);
  font-weight: 700;
  color: #ffffff;
}

.modal-add-to-cart {
  background: linear-gradient(135deg, #b0c60e, #2f855a);
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.modal-add-to-cart:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
  background: linear-gradient(135deg, #123222, #555f0a);
}

/* Responsive Design Improvements */
@media (max-width: 768px) {
  .shop-container {
    padding: 0.5rem;
  }
  
  .image-carousel {
    height: 180px;
  }
  
  .carousel-controls {
    opacity: 1;
  }
  
  .modal-content {
    max-height: 85vh;
    padding: 1rem;
  }
  
  .modal-body {
    padding: 1rem;
  }
  
  .modal-main-image {
    height: 250px;
  }
  
  .modal-action {
    flex-direction: column;
    align-items: stretch;
  }
  
  .modal-add-to-cart {
    width: 100%;
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .shop-title {
    margin-bottom: 1rem;
  }
  
  .search-bar {
    max-width: 95%;
  }
  
  .item-details {
    padding: 0.75rem;
  }
  
  .modal-overlay {
    padding: 0.5rem;
  }
  
  .modal-content {
    border-radius: 12px;
  }
  
  .modal-main-image {
    height: 200px;
  }
  
  .modal-item-name {
    font-size: 1.3rem;
  }
  
  .modal-description p {
    font-size: 0.9rem;
  }
  
  .spec-label {
    font-size: 0.8rem;
  }
  
  .spec-value {
    font-size: 0.9rem;
  }
}

/* Touch-friendly improvements */
@media (hover: none) and (pointer: coarse) {
  .item-card:hover {
    transform: none;
  }
  
  .carousel-btn,
  .modal-carousel-btn {
    min-width: 34px;
    min-height: 34px;
  }
  
  .add-to-cart-btn,
  .modal-add-to-cart {
    min-height: 44px;
  }
}

/* Scrollbar styling for modal */
.modal-content::-webkit-scrollbar {
  width: 8px;
}

.modal-content::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
}

.modal-content::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 4px;
}

.modal-content::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.5);
}
</style>