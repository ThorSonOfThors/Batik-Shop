<template>
  <Navbar />
  <router-view />
</template>

<script setup lang="ts">
import Navbar from './components/NavBar.vue';
</script>

<style>
/* Global styling can go here later */
body {
  margin: 0;
  font-family: Arial, sans-serif;
}
</style>
