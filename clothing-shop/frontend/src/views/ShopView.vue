<template>
  <div class="shop-container">
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
      <div v-for="item in filteredItems" :key="item.id" class="item-card">
        <!-- Image Carousel -->
        <div class="image-carousel">
          <div class="image-wrapper">
            <img
              :src="currentImage(item)"
              alt="Item image"
              class="item-image"
            />
          </div>
          <div class="carousel-controls">
            <button @click="prevImage(item)" class="carousel-btn">‹</button>
            <button @click="nextImage(item)" class="carousel-btn">›</button>
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

          <button class="add-to-cart-btn" @click="addToCart(item)">
            <span class="cart-icon">🛒</span> Add to Cart
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import api from "../api/axios";
import { useCartStore } from "../stores/cart";
import type { Item } from "@/types/Item";


const cart = useCartStore();
const items = ref<Item[]>([]);
const filteredItems = ref<Item[]>([]);
const searchQuery = ref("");
const imageIndexes = ref<Record<number, number>>({});

// 🚀 IMPORTANT FIX — BACKEND URL (adjust if needed)

const BASE_URL = import.meta.env.VITE_API_URL; // your backend URL


const fetchItems = async () => {
  try {
    const response = await api.get("/items");

    items.value = response.data
      .filter((item: Item) => item.status !== "sold" && item.status !== "pending")
      .map((item: any) => {
        const images = Array.isArray(item.image)
          ? item.image
          : JSON.parse(item.image || "[]");

        // 🔥 Fix: Prepend backend URL to images
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

const filterItems = () => {
  const q = searchQuery.value.toLowerCase();
  filteredItems.value = items.value.filter((item) =>
    `${item.name} ${item.category} ${item.material} ${item.producer} ${item.size}`
      .toLowerCase()
      .includes(q)
  );
};

const currentImageIndex = (itemId: number) => {
  return imageIndexes.value[itemId] || 0;
};

const currentImage = (item: Item) => {
  const index = currentImageIndex(item.id);
  return item.images?.length ? item.images[index] : "/default-placeholder.png";
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

const addToCart = (item: Item) => {
  cart.addToCart(item);
  alert(`✅ ${item.name} added to cart!`);
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);

onMounted(() => {
  fetchItems();
});
</script>

<style scoped>
.shop-container {
  max-width: relative;
  margin: 0 auto;
  padding: 2rem 1rem;
  min-height: 100vh;
  
  background-color: #ab4a16;
  background-image: url('C:\Users\Filip\Desktop\clothing-shop\frontend\src\assets\OrangeBackground.jpg');
}

.shop-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: #ffffff;
  text-align: center;
  margin-bottom: 2rem;
  background: linear-gradient(135deg, #ffffff 0%, #f1eded 100%);

  background-clip: text;
}

/* Search Bar */
.search-bar {
  margin-bottom: 2rem;
  max-width: 69%;
  margin-left: auto;
  margin-right: auto;
  
}

.search-bar input {
  width: 100%;
  padding: 0.875rem 1.5rem;
  border: 2px solid #e2e8f0;
  border-radius: 50px;
  font-size: 1rem;
  transition: all 0.3s ease;
  background: rgb(238, 238, 238);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  background: linear-gradient(135deg, #4d0202 0%, #000000 100%);
}

.search-bar input:focus {
  outline: none;
  border-color: #000000;
  box-shadow: 0 4px 12px rgba(66, 153, 225, 0.15);
  transform: translateY(-1px);
}

.search-bar input::placeholder {
  color: #a0aec0;
}

/* Items Grid */
.items-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 2rem;
  padding: 1rem 0;
}

/* Item Card */
.item-card {
  
  background: linear-gradient(135deg,  #ff9100,#0f012c);
  border-radius: 16px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  transition: all 0.3s ease;
  border: 1px solid #f7fafc;
}

.item-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.15);
}

/* Image Carousel */
.image-carousel {
  position: relative;
  height: 250px;
  overflow: hidden;
  background: #f8fafc;
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

.item-card:hover .item-image {
  transform: scale(1.05);
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
  padding: 0 1rem;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.item-card:hover .carousel-controls {
  opacity: 1;
}

.carousel-btn {
  background: rgba(255, 255, 255, 0.9);
  border: none;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
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
  bottom: 12px;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  gap: 6px;
}

.indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.5);
  transition: background-color 0.3s ease;
}

.indicator.active {
  background-color: white;
}

/* Item Details */
.item-details {
  padding: 1.5rem;
}

.item-name {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1a202c;
  margin: 0 0 1rem 0;
  line-height: 1.4;
}

.item-info-grid {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.item-category,
.item-material,
.item-producer,
.item-size {
  font-size: 0.875rem;
  color: #718096;
  margin: 0;
  line-height: 1.4;
}

.item-category span,
.item-material span,
.item-producer span,
.item-size span {
  font-weight: 600;
  color: #4a5568;
}

.item-price {
  font-size: 1.5rem;
  font-weight: 700;
  color: #2d3748;
  margin: 0 0 1.5rem 0;
}

/* Add to Cart Button */
.add-to-cart-btn {
  width: 100%;
  background: linear-gradient(135deg, #b0c60e, #2f855a);
  color: rgb(255, 255, 255);
  border: none;
  padding: 0.875rem 1.5rem;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  box-shadow: 0 2px 4px rgba(187, 89, 72, 0.2);
}

.add-to-cart-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(72, 187, 120, 0.3);
  background: linear-gradient(135deg,  #123222,#555f0a);
}

.add-to-cart-btn:active {
  transform: translateY(0);
}

.cart-icon {
  font-size: 1.125rem;
}

/* Responsive Design */
@media (max-width: 768px) {
  .shop-container {
    padding: 1rem;
  }
  
  .shop-title {
    font-size: 2rem;
  }
  
  .items-grid {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 1.5rem;
  }
  
  .image-carousel {
    height: 220px;
  }
  
  .carousel-controls {
    opacity: 1; /* Always show on mobile for better UX */
  }
  
  .item-details {
    padding: 1.25rem;
  }
}

@media (max-width: 480px) {
  .items-grid {
    grid-template-columns: 1fr;
  }
  
  .search-bar input {
    padding: 0.75rem 1.25rem;
  }
}
</style>