<template>
  <div class="items-management">
    <h1>Items Management</h1>
    
    <!-- Add New Item Button -->
    <div class="action-bar">
      <button @click="showAddForm = true" class="btn btn-primary">
        <i class="fas fa-plus"></i> Add New Item
      </button>
      
      <!-- Search by ID -->
      <div class="search-container">
        <input 
          v-model="searchId" 
          @input="filterItems" 
          placeholder="Search by ID..." 
          type="text"
          class="search-input"
        >
        <i class="fas fa-search search-icon"></i>
      </div>

      <!-- Sort Controls -->
      <div class="sort-controls">
        <label>Sort by:</label>
        <select v-model="sortBy" @change="sortItems" class="sort-select">
          <option value="created_at">Creation Date</option>
          <option value="name">Name</option>
          <option value="price">Price</option>
        </select>
        <button @click="toggleSortOrder" class="sort-order-btn">
          {{ sortOrder === 'asc' ? '↑' : '↓' }}
        </button>
      </div>
    </div>

    <!-- Items Table -->
    <div class="table-container">
      <table class="items-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Image</th>
            <th>Name</th>
            <th>Size</th>
            <th>Material</th>
            <th>Producer</th>
            <th>Price</th>
            <th>Category</th>
            <th>Status</th>
            <th>Created At</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in filteredItems" :key="item.id" class="item-row">
            <td>{{ item.id }}</td>
            <td>
              <div class="image-gallery">
                <img 
                  v-for="(img, index) in item.images" 
                  :key="index" 
                  :src="getFullImagePath(img)" 
                  :alt="item.name"
                  class="item-image"
                  @click="showImageGallery(item.images, index)"
                >
              </div>
            </td>
            <td>{{ item.name }}</td>
            <td>{{ item.size }}</td>
            <td>{{ item.material || '-' }}</td>
            <td>{{ item.producer || '-' }}</td>
            <td>${{ item.price }}</td>
            <td>{{ item.category }}</td>
            <td>
              <span :class="['status-badge', getStatusClass(item.status)]">
                {{ item.status }}
              </span>
            </td>
            <td>{{ formatDate(item.created_at) }}</td>
            <td>
              <div class="action-buttons">
                <button @click="editItem(item)" class="btn-icon edit-btn" title="Edit">
                  <i class="fas fa-edit"></i>
                </button>
                <button @click="deleteItem(item.id)" class="btn-icon delete-btn" title="Delete">
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      
      <div v-if="filteredItems.length === 0" class="no-items">
        No items found
      </div>
    </div>

    <!-- Add Item Modal -->
    <div v-if="showAddForm" class="modal-overlay">
      <div class="modal-content">
        <div class="modal-header">
          <h2>Add New Item</h2>
          <button @click="closeModals" class="close-btn">&times;</button>
        </div>
        <form @submit.prevent="submitNewItem" class="item-form">
          <div class="form-row">
            <div class="form-group">
              <label>Name *</label>
              <input v-model="newItem.name" required type="text">
            </div>
            <div class="form-group">
              <label>Size *</label>
              <input v-model="newItem.size" required type="text">
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label>Material</label>
              <input v-model="newItem.material" type="text">
            </div>
            <div class="form-group">
              <label>Producer</label>
              <input v-model="newItem.producer" type="text">
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label>Price *</label>
              <input v-model="newItem.price" required type="number" step="0.01">
            </div>
            <div class="form-group">
              <label>Category *</label>
              <input v-model="newItem.category" required type="text">
            </div>
          </div>
          
          <div class="form-group">
            <label>Status</label>
            <select v-model="newItem.status">
              <option value="available">Available</option>
              <option value="pending">Pending</option>
              <option value="sold">Sold</option>
            </select>
          </div>
          
          <div class="form-group">
            <label>Images</label>
            <input 
              type="file" 
              multiple 
              accept="image/*" 
              @change="handleFileUpload"
              ref="fileInput"
            >
            <div v-if="newItem.images.length > 0" class="image-preview">
              <div 
                v-for="(file, index) in newItem.images" 
                :key="index" 
                class="preview-item"
              >
                <img :src="getObjectURL(file)" alt="Preview">
                <button @click="removeImage(index)" type="button" class="remove-image">
                  &times;
                </button>
              </div>
            </div>
          </div>
          
          <div class="form-actions">
            <button type="button" @click="closeModals" class="btn btn-secondary">Cancel</button>
            <button type="submit" class="btn btn-primary" :disabled="isSubmitting">
              {{ isSubmitting ? 'Creating...' : 'Create Item' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Edit Item Modal -->
    <div v-if="showEditForm" class="modal-overlay">
      <div class="modal-content">
        <div class="modal-header">
          <h2>Edit Item</h2>
          <button @click="closeModals" class="close-btn">&times;</button>
        </div>
        <form @submit.prevent="submitEditItem" class="item-form">
          <div class="form-row">
            <div class="form-group">
              <label>Name *</label>
              <input v-model="editingItem.name" required type="text">
            </div>
            <div class="form-group">
              <label>Size *</label>
              <input v-model="editingItem.size" required type="text">
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label>Material</label>
              <input v-model="editingItem.material" type="text">
            </div>
            <div class="form-group">
              <label>Producer</label>
              <input v-model="editingItem.producer" type="text">
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label>Price *</label>
              <input v-model="editingItem.price" required type="number" step="0.01">
            </div>
            <div class="form-group">
              <label>Category *</label>
              <input v-model="editingItem.category" required type="text">
            </div>
          </div>
          
          <div class="form-group">
            <label>Status</label>
            <select v-model="editingItem.status">
              <option value="available">Available</option>
              <option value="pending">Pending</option>
              <option value="sold">Sold</option>
            </select>
          </div>
          
          <div class="form-group">
            <label>Add More Images</label>
            <input 
              type="file" 
              multiple 
              accept="image/*" 
              @change="handleEditFileUpload"
              ref="editFileInput"
            >
            <div v-if="editingItem.existingImages.length > 0" class="existing-images">
              <h4>Existing Images:</h4>
              <div class="image-preview">
                <div 
                  v-for="(img, index) in editingItem.existingImages" 
                  :key="index" 
                  class="preview-item"
                >
                  <img :src="getFullImagePath(img)" alt="Existing">
                  <button @click="removeExistingImage(index)" type="button" class="remove-image">
                    &times;
                  </button>
                </div>
              </div>
            </div>
            <div v-if="editingItem.newImages.length > 0" class="new-images">
              <h4>New Images:</h4>
              <div class="image-preview">
                <div 
                  v-for="(file, index) in editingItem.newImages" 
                  :key="index" 
                  class="preview-item"
                >
                  <img :src="getObjectURL(file)" alt="New">
                  <button @click="removeNewImage(index)" type="button" class="remove-image">
                    &times;
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <div class="form-actions">
            <button type="button" @click="closeModals" class="btn btn-secondary">Cancel</button>
            <button type="submit" class="btn btn-primary" :disabled="isSubmitting">
              {{ isSubmitting ? 'Updating...' : 'Update Item' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Image Gallery Modal -->
    <div v-if="showImageModal" class="modal-overlay" @click="closeImageModal">
      <div class="image-modal-content" @click.stop>
        <button @click="closeImageModal" class="close-btn">&times;</button>
        <img :src="getFullImagePath(currentImage)" alt="Gallery" class="gallery-image">
        <div class="gallery-controls">
          <button @click="prevImage" :disabled="currentImageIndex === 0" class="gallery-btn">
            <i class="fas fa-chevron-left"></i>
          </button>
          <span class="image-counter">{{ currentImageIndex + 1 }} / {{ galleryImages.length }}</span>
          <button @click="nextImage" :disabled="currentImageIndex === galleryImages.length - 1" class="gallery-btn">
            <i class="fas fa-chevron-right"></i>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import api from "../api/axios";

export default {
  name: 'ItemsManagement',
  data() {
    return {
      items: [],
      filteredItems: [],
      searchId: '',
      sortBy: 'created_at',
      sortOrder: 'desc',
      showAddForm: false,
      showEditForm: false,
      showImageModal: false,
      isSubmitting: false,
      newItem: {
        name: '',
        size: '',
        material: '',
        producer: '',
        price: '',
        category: '',
        status: 'available',
        images: []
      },
      editingItem: {
        id: null,
        name: '',
        size: '',
        material: '',
        producer: '',
        price: '',
        category: '',
        status: 'available',
        existingImages: [],
        newImages: [],
        deletedImages: [] 
      },
      galleryImages: [],
      currentImageIndex: 0
    };
  },
  computed: {
    currentImage() {
      return this.galleryImages[this.currentImageIndex];
    }
  },
  async mounted() {
    await this.fetchItems();
  },
  methods: {
    async fetchItems() {
      try {
        const response = await api.get('/items');
        this.items = response.data.map(item => ({
          ...item,
          images: Array.isArray(item.image) ? item.image : JSON.parse(item.image || '[]'),
          created_at: item.created_at || new Date().toISOString()
        }));
        this.filterItems();
      } catch (error) {
        console.error('Error fetching items:', error);
        alert('Error fetching items');
      }
    },

    filterItems() {
      let filtered = this.items;
      
      // Filter by ID
      if (this.searchId) {
        filtered = filtered.filter(item => 
          item.id.toString().includes(this.searchId)
        );
      }
      
      // Sort items
      filtered = filtered.sort((a, b) => {
        let aVal = a[this.sortBy];
        let bVal = b[this.sortBy];
        
        if (this.sortBy === 'created_at') {
          aVal = new Date(aVal);
          bVal = new Date(bVal);
        }
        
        if (this.sortOrder === 'asc') {
          return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
        } else {
          return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
        }
      });
      
      this.filteredItems = filtered;
    },

    sortItems() {
      this.filterItems();
    },

    toggleSortOrder() {
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
      this.filterItems();
    },

    getStatusClass(status) {
      switch (status) {
        case 'available': return 'status-available';
        case 'pending': return 'status-pending';
        case 'sold': return 'status-sold';
        default: return 'status-unknown';
      }
    },

    getFullImagePath(relativePath) {
      return `http://localhost:5000${relativePath}`;
    },

    formatDate(dateString) {
      return new Date(dateString).toLocaleDateString();
    },

    handleFileUpload(event) {
      const files = Array.from(event.target.files);
      this.newItem.images = [...this.newItem.images, ...files];
    },

    handleEditFileUpload(event) {
      const files = Array.from(event.target.files);
      this.editingItem.newImages = [...this.editingItem.newImages, ...files];
    },

    getObjectURL(file) {
      return URL.createObjectURL(file);
    },

    removeImage(index) { 
      this.newItem.images.splice(index, 1); 
    },

    removeNewImage(index) {
      this.editingItem.newImages.splice(index, 1);
    },

    removeExistingImage(index , type = 'existing') {
       if (type === 'existing') {
        const removed = this.editingItem.existingImages.splice(index, 1)[0];
        if (removed) {
          this.editingItem.deletedImages.push(removed); // track for backend deletion
        }
      } else if (type === 'new') {
        this.editingItem.newImages.splice(index, 1);
      }
    },

    async submitNewItem() {
      this.isSubmitting = true;
      try {
        const formData = new FormData();
        formData.append('name', this.newItem.name);
        formData.append('size', this.newItem.size);
        formData.append('material', this.newItem.material);
        formData.append('producer', this.newItem.producer);
        formData.append('price', this.newItem.price);
        formData.append('category', this.newItem.category);
        formData.append('status', this.newItem.status);

        // Append all images
        this.newItem.images.forEach(file => {
          formData.append('image', file);
        });

        await api.post('/items', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });

        this.closeModals();
        this.resetNewItem();
        await this.fetchItems();
        alert('Item created successfully!');
      } catch (error) {
        console.error('Error creating item:', error);
        alert('Error creating item');
      } finally {
        this.isSubmitting = false;
      }
    },

    editItem(item) {
      this.editingItem = {
        id: item.id,
        name: item.name,
        size: item.size,
        material: item.material || '',
        producer: item.producer || '',
        price: item.price,
        category: item.category,
        status: item.status,
        existingImages: [...item.images],
        newImages: [],
        deletedImages: []
        
      };
      this.showEditForm = true;
    },

    async submitEditItem() {
      this.isSubmitting = true;
      try {
        const formData = new FormData();
        formData.append('name', this.editingItem.name);
        formData.append('size', this.editingItem.size);
        formData.append('material', this.editingItem.material);
        formData.append('producer', this.editingItem.producer);
        formData.append('price', this.editingItem.price);
        formData.append('category', this.editingItem.category);
        formData.append('status', this.editingItem.status);

        // Append new images
        this.editingItem.newImages.forEach(file => {
          formData.append('image', file);
        });

        // Append deleted images list (as JSON string)
        if (this.editingItem.deletedImages && this.editingItem.deletedImages.length > 0) {
          formData.append('deletedImages', JSON.stringify(this.editingItem.deletedImages));
        }

        await api.put(`/items/${this.editingItem.id}`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });

        this.closeModals();
        await this.fetchItems();
        alert('Item updated successfully!');
      } catch (error) {
        console.error('Error updating item:', error);
        alert('Error updating item');
      } finally {
        this.isSubmitting = false;
      }
    },

    async deleteItem(itemId) {
      if (confirm('Are you sure you want to delete this item?')) {
        try {
          await api.delete(`/items/${itemId}`);
          await this.fetchItems();
          alert('Item deleted successfully!');
        } catch (error) {
           if (error.response) {
            const status = error.response.status;

            if (status === 401) {
              // 🔒 Handle unauthorized access
              alert('Your session has expired. Please log in again.');
              // Optional: redirect to login page
              this.$router.push('/login');
            } else if (status === 403) {
              alert('You do not have permission to delete this item.');
            } else if (status === 404) {
              alert('Item not found — it may have already been deleted.');
            } else if (status >= 500) {
              alert('Server error — please try again later.');
            } else {
              alert('Error deleting item.');
            }

          } else if (error.request) {
            // Request made, but no response received
            alert('Network error. Please check your connection.');
          } else {
            // Something else happened
            alert('Unexpected error occurred.');
          }
          
        }
      }
    },

    closeModals() {
      this.showAddForm = false;
      this.showEditForm = false;
      this.resetNewItem();
    },

    resetNewItem() {
      this.newItem = {
        name: '',
        size: '',
        material: '',
        producer: '',
        price: '',
        category: '',
        status: 'available',
        images: []
      };
      if (this.$refs.fileInput) {
        this.$refs.fileInput.value = '';
      }
    },

    showImageGallery(images, startIndex = 0) {
      this.galleryImages = images;
      this.currentImageIndex = startIndex;
      this.showImageModal = true;
    },

    closeImageModal() {
      this.showImageModal = false;
      this.galleryImages = [];
      this.currentImageIndex = 0;
    },

    nextImage() {
      if (this.currentImageIndex < this.galleryImages.length - 1) {
        this.currentImageIndex++;
      }
    },

    prevImage() {
      if (this.currentImageIndex > 0) {
        this.currentImageIndex--;
      }
    }
  }
};
</script>

<style scoped>
.items-management {
  padding: 20px;
  max-width: 1481px;
  margin: 0 auto;
  position: relative;
  min-height: 100vh;
}

.items-management::before {
  content: '';
  position: fixed;  
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: url('C:\Users\Filip\Desktop\clothing-shop\frontend\src\assets\backgroundImageForAdminView.jpg'); /* Replace with your image path */
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  opacity: 0.99; /* Adjust opacity as needed (0.1 = 10% opacity) */
  z-index: -1;
}

h1 {
  text-align: center;
  color: #ffffff;
  margin-bottom: 30px;
}

.action-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  gap: 20px;
  flex-wrap: wrap;
}

.search-container {
  position: relative;
  display: flex;
  align-items: center;
}

.search-input {
  padding: 8px 35px 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  width: 200px;
}

.search-icon {
  position: absolute;
  right: 10px;
  color: #666;
}

.sort-controls {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #ffffff;
  
}

.sort-select {
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.sort-order-btn {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  cursor: pointer;
}

.table-container {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  overflow: hidden;
}

.items-table {
  width: 100%;
  border-collapse: collapse;
}

.items-table th,
.items-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.items-table th {
  background-color: #f8f9fa;
  font-weight: 600;
  color: #333;
}

.item-row:hover {
  background-color: #f8f9fa;
}

.image-gallery {
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
}

.item-image {
  width: 50px;
  height: 50px;
  object-fit: cover;
  border-radius: 4px;
  cursor: pointer;
  border: 1px solid #ddd;
}

.status-badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  text-transform: capitalize;
}

.status-available {
  background-color: #d4edda;
  color: #155724;
}

.status-pending {
  background-color: #fff3cd;
  color: #856404;
}

.status-sold {
  background-color: #f8d7da;
  color: #721c24;
}

.action-buttons {
  display: flex;
  gap: 8px;
}

.btn-icon {
  padding: 6px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

.edit-btn {
  background-color: #ffc107;
  color: white;
  padding: 10px 10px;
}

.edit-btn:hover {
  background-color: #e0a800;
}

.delete-btn {
  background-color: #dc3545;
  color: white;
  padding: 10px 10px; /* Increased from default */
  
}

.delete-btn:hover {
  background-color: #c82333;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

.btn-primary {
  background-color: #007bff;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: #0056b3;
}

.btn-secondary {
  background-color: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background-color: #545b62;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 8px;
  padding: 0;
  max-width: 600px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #eee;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
}

.item-form {
  padding: 20px;
}

.form-row {
  display: flex;
  gap: 15px;
  margin-bottom: 15px;
}

.form-group {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.form-group label {
  margin-bottom: 5px;
  font-weight: 500;
  color: #333;
}

.form-group input,
.form-group select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #eee;
}

.image-preview {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 10px;
}

.preview-item {
  position: relative;
  width: 80px;
  height: 80px;
}

.preview-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 4px;
  border: 1px solid #ddd;
}

.remove-image {
  position: absolute;
  top: -5px;
  right: -5px;
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  font-size: 12px;
  cursor: pointer;
}

.existing-images,
.new-images {
  margin-top: 15px;
}

.existing-images h4,
.new-images h4 {
  margin-bottom: 10px;
  font-size: 14px;
  color: #333;
}

.image-modal-content {
  position: relative;
  background: white;
  border-radius: 8px;
  padding: 20px;
  max-width: 90vw;
  max-height: 90vh;
}

.gallery-image {
  max-width: 100%;
  max-height: 70vh;
  object-fit: contain;
}

.gallery-controls {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  margin-top: 20px;
}

.gallery-btn {
  padding: 10px;
  border: none;
  background: #007bff;
  color: white;
  border-radius: 4px;
  cursor: pointer;
}

.gallery-btn:disabled {
  background: #6c757d;
  cursor: not-allowed;
}

.image-counter {
  font-weight: 500;
  color: #333;
}

.no-items {
  text-align: center;
  padding: 40px;
  color: #666;
  font-style: italic;
}

@media (max-width: 768px) {
  .action-bar {
    flex-direction: column;
    align-items: stretch;
  }
  
  .search-container,
  .sort-controls {
    width: 100%;
  }
  
  .search-input {
    width: 100%;
  }
  
  .form-row {
    flex-direction: column;
    gap: 0;
  }
  
  .items-table {
    font-size: 12px;
  }
  
  .items-table th,
  .items-table td {
    padding: 6px;
  }
}
</style>