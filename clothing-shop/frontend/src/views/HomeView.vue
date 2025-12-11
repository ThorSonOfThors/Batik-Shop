<template>
  <div class="home-container">
    <!-- HERO SECTION -->
    <section class="hero":style="{ backgroundImage: `url(${heroImages[currentHero]})` }"> 
      <div class="hero-content">
        <h1 class="hero-title">Handcrafted Clothing from the Heart of Indonesia</h1>
        <p class="hero-subtitle">
          A small family dream, stitched one piece at a time.
        </p>

        <button class="shop-btn" @click="$router.push('/shop')">
          Explore the Collection
        </button>
      </div>
    </section>

    <!-- STORY / ARTICLE SECTION -->
    <section class="story-section">
      <div class="story-card">
        <h2 class="story-title">Our Story</h2>

        <p class="story-text">
          What started as a simple idea between a brother and sister has grown into a
          small, passionate clothing brand based in Indonesia. The two of us wanted to
          create pieces that celebrate comfort, quality, and the artistic spirit of our 
          local artisans.
        </p>

        <p class="story-text">
          Every fabric we choose comes from trusted local suppliers, and every product 
          is made with care — from the first sketch to the final stitch. We work closely 
          with small workshops across Java and Bali, ensuring that each piece reflects 
          the beauty, culture, and craftsmanship of our home.
        </p>

        <p class="story-text">
          We’re still a tiny business, but we’re growing with the support of customers 
          who value authenticity, sustainability, and quality. When you wear our clothes, 
          you’re not just choosing a style — you’re supporting local creators and a 
          family’s dream.
        </p>

        <button class="shop-btn secondary" @click="$router.push('/shop')">
          Start Shopping
        </button>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted, onBeforeUnmount } from 'vue';

  const heroImages = [
    new URL('@/assets/homeBackground.jpg', import.meta.url).href,
    new URL('@/assets/OrangeBackground.jpg', import.meta.url).href,
    new URL('@/assets/cartBackgroun.jpg', import.meta.url).href,
    
  ];

  const currentHero = ref(0);
  let intervalId: number;

  onMounted(() => {
    intervalId = setInterval(() => {
      currentHero.value = (currentHero.value + 1) % heroImages.length;
    }, 6000); // change every 6 seconds
  });

  onBeforeUnmount(() => {
    clearInterval(intervalId);
  });

</script>

<style scoped>
.home-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  min-height: 100vh;
  background: #f8f8f8;
}

/* HERO */
.hero {
  width: 100%;
  
  transition: background-image 2s ease-in-out;
  
  padding: 120px 20px;
  text-align: center;
}

.hero-content {
  max-width: 800px;
  margin: 0 auto;
  background: rgba(0, 0, 0, 0.45);
  padding: 40px;
  border-radius: 12px;
}

.hero-title {
  font-size: 2.8rem;
  color: white;
  font-weight: 700;
}

.hero-subtitle {
  font-size: 1.3rem;
  color: #eaeaea;
  margin-top: 10px;
  margin-bottom: 25px;
}

.shop-btn {
  background: black;
  color: white;
  padding: 12px 24px;
  font-size: 1.1rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: 0.2s ease;
}

.shop-btn:hover {
  background: #333;
}

/* STORY SECTION */
.story-section {
  display: flex;
  justify-content: center;
  background: linear-gradient(135deg, #fdfdfd, #000000);
  padding: 60px 20px;
}

.story-card {
  max-width: 900px;
  background: white;
  padding: 40px;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.1);
}

.story-title {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 20px;
}

.story-text {
  margin-bottom: 20px;
  line-height: 1.6;
  font-size: 1.1rem;
  color: #444;
}

.shop-btn.secondary {
  margin-top: 20px;
  background: #444;
}

.shop-btn.secondary:hover {
  background: #222;
}
</style>
