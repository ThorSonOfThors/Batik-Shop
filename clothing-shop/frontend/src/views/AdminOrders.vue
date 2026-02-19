<template>
  <div class="items-management">
    <h1>📦 Order Management</h1>

    <div class="action-bar">
      <div class="search-container">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search orders..."
          class="search-input"
          @input="handleSearch"
        />
        <span class="search-icon">🔍</span>
      </div>

      <div class="sort-controls">
        <label>Sort by:</label>
        <select v-model="sortField" class="sort-select">
          <option value="created_at">Date Created</option>
          <option value="id">Order ID</option>
          <option value="total_amount_cents">Amount</option>
          <option value="full_name">Customer Name</option>
          <option value="status">Status</option>
        </select>
        <button @click="toggleSortDirection" class="sort-order-btn">
          {{ sortDirection === 'asc' ? '↑' : '↓' }}
        </button>
        
        <label style="margin-left: 15px;">Status:</label>
        <select v-model="statusFilter" class="sort-select" @change="handleFilter">
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <button @click="fetchOrders" :disabled="loading" class="btn btn-primary">
        {{ loading ? 'Loading...' : '🔄 Refresh' }}
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="no-items">
      <div class="spinner"></div>
      <p>Loading orders...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="no-items error">
      <p>❌ {{ error }}</p>
      <button @click="fetchOrders" class="btn btn-primary" style="margin-top: 10px;">
        Retry
      </button>
    </div>

    <!-- Orders Table -->
    <div v-else class="table-container">
      <table class="items-table">
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Customer</th>
            <th>Amount</th>
            <th>Address</th>
            <th>Status</th>
            <th>Created</th>
            <th>Items</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="order in paginatedOrders" :key="order.id" class="item-row">
            <td class="order-id">
              #{{ order.id }}
              <div class="stripe-id" v-if="order.stripe_payment_intent_id">
                Stripe: {{ order.stripe_payment_intent_id.substring(0, 8) }}...
              </div>
            </td>
            <td class="customer-info">
              <div class="customer-name">{{ order.full_name }}</div>
              <div class="customer-email">{{ order.email }}</div>
              <div class="customer-country">
                <span class="flag">🌍</span> {{ order.country_code }}
              </div>
            </td>
            <td class="amount-cell">
              <div class="amount">{{ formatCurrency(order.total_amount_cents / 100) }}</div>
              <div class="currency">{{ order.currency }}</div>
            </td>
            <td class="address-cell">
              <div v-if="order.address">
                <div class="address-street">{{ order.address.street }}</div>
                <div class="address-city">{{ order.address.city }}{{ order.address.zip ? `, ${order.address.zip}` : '' }}</div>
                <div v-if="order.address.state" class="address-state">{{ order.address.state }}</div>
                <div v-if="order.address.phone" class="address-phone">📞 {{ order.address.phone }}</div>
              </div>
              <div v-else class="no-address">No address</div>
            </td>
            <td>
              <span :class="['status-badge', getStatusClass(order.status)]">
                {{ order.status }}
              </span>
              <div v-if="order.finalized_at" class="finalized-date">
                Finalized: {{ formatDate(order.finalized_at, 'short') }}
              </div>
            </td>
            <td class="date-cell">
              {{ formatDate(order.created_at, 'date') }}
              <div class="date-time">{{ formatDate(order.created_at, 'time') }}</div>
            </td>
            <td class="items-cell">
              <div class="items-count">{{ order.items.length }} item{{ order.items.length !== 1 ? 's' : '' }}</div>
              <div class="items-preview">
                <div v-for="item in order.items.slice(0, 2)" :key="item.id" class="item-preview">
                  <div class="item-quantity">{{ item.quantity }}× #{{ item.product_id }}</div>
                  <div class="item-price">{{ formatCurrency(item.price_cents / 100) }}</div>
                  <div v-if="item.images && item.images.length > 0" class="item-images">
                    <span class="image-count">🖼️ {{ item.images.length }}</span>
                    <span class="view-more-btn" @click="viewItemImages(item)">view</span>
                  </div>
                </div>
                <div v-if="order.items.length > 2" class="more-items">
                  +{{ order.items.length - 2 }} more
                </div>
              </div>
            </td>
            <td class="action-buttons">
              <button @click="viewOrder(order)" class="btn-icon view-btn" title="View Details">
                👁️
              </button>
              <button @click="openEditModal(order)" class="btn-icon edit-btn" title="Edit Order">
                ✏️
              </button>
              <button @click="deleteOrder(order)" class="btn-icon delete-btn" title="Delete Order">
                🗑️
              </button>
            </td>
          </tr>
          <tr v-if="filteredOrders.length === 0">
            <td colspan="8" class="no-items">
              No orders found
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Pagination -->
      <div v-if="filteredOrders.length > 0" class="pagination">
        <button 
          @click="prevPage" 
          :disabled="currentPage === 1"
          class="btn btn-secondary"
        >
          ← Previous
        </button>
        <span class="page-info">
          Page {{ currentPage }} of {{ totalPages }}
        </span>
        <button 
          @click="nextPage" 
          :disabled="currentPage === totalPages"
          class="btn btn-secondary"
        >
          Next →
        </button>
      </div>
    </div>

    <!-- Order Details Modal -->
    <div v-if="selectedOrder" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <button @click="closeModal" class="close-btn">×</button>
        <div class="modal-header">
          <h2>Order #{{ selectedOrder.id }}</h2>
          <span :class="['status-badge', getStatusClass(selectedOrder.status)]">
            {{ selectedOrder.status }}
          </span>
        </div>

        <div class="item-form">
          <!-- Customer Info -->
          <div class="section">
            <h3>Customer Information</h3>
            <div class="form-row">
              <div class="form-group">
                <label>Full Name</label>
                <input :value="selectedOrder.full_name" readonly />
              </div>
              <div class="form-group">
                <label>Email</label>
                <input :value="selectedOrder.email" readonly />
              </div>
              <div class="form-group">
                <label>Country</label>
                <input :value="selectedOrder.country_code" readonly />
              </div>
            </div>
          </div>

          <!-- Order Info -->
          <div class="section">
            <h3>Order Information</h3>
            <div class="form-row">
              <div class="form-group">
                <label>Order ID</label>
                <input :value="selectedOrder.id" readonly />
              </div>
              <div class="form-group">
                <label>Stripe Payment ID</label>
                <input :value="selectedOrder.stripe_payment_intent_id || 'N/A'" readonly />
              </div>
              <div class="form-group">
                <label>Currency</label>
                <input :value="selectedOrder.currency" readonly />
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Total Amount</label>
                <input :value="formatCurrency(selectedOrder.total_amount_cents / 100)" readonly />
              </div>
              <div class="form-group">
                <label>Created</label>
                <input :value="formatDate(selectedOrder.created_at)" readonly />
              </div>
              <div class="form-group">
                <label>Finalized</label>
                <input :value="selectedOrder.finalized_at ? formatDate(selectedOrder.finalized_at) : 'Not finalized'" readonly />
              </div>
            </div>
          </div>

          <!-- Address -->
          <div v-if="selectedOrder.address" class="section">
            <h3>Shipping Address</h3>
            <div class="form-row">
              <div class="form-group">
                <label>Street</label>
                <input :value="selectedOrder.address.street" readonly />
              </div>
              <div class="form-group">
                <label>City</label>
                <input :value="selectedOrder.address.city" readonly />
              </div>
              <div class="form-group">
                <label>ZIP Code</label>
                <input :value="selectedOrder.address.zip || 'Not provided'" readonly />
              </div>
            </div>
            <div class="form-row">
              <div v-if="selectedOrder.address.state" class="form-group">
                <label>State</label>
                <input :value="selectedOrder.address.state" readonly />
              </div>
              <div v-if="selectedOrder.address.phone" class="form-group">
                <label>Phone</label>
                <input :value="selectedOrder.address.phone" readonly />
              </div>
            </div>
          </div>

          <!-- Order Items -->
          <div class="section">
            <h3>Order Items ({{ selectedOrder.items.length }})</h3>
            <div class="items-table-container">
              <table class="items-table">
                <thead>
                  <tr>
                    <th>Product ID</th>
                    <th>Quantity</th>
                    <th>Price</th>
                    <th>Status</th>
                    <th>Subtotal</th>
                    <th>Images</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in selectedOrder.items" :key="item.id">
                    <td>#{{ item.product_id }}</td>
                    <td>{{ item.quantity }}</td>
                    <td>{{ formatCurrency(item.price_cents / 100) }}</td>
                    <td>
                      <span :class="['status-badge', getItemStatusClass(item.status)]">
                        {{ item.status }}
                      </span>
                    </td>
                    <td>{{ formatCurrency((item.price_cents * item.quantity) / 100) }}</td>
                    <td>
                      <div v-if="item.images && item.images.length > 0" class="image-gallery">
                        <img 
                          v-for="(img, index) in item.images.slice(0, 2)" 
                          :key="index"
                          :src="getFullImagePath(img)" 
                          class="item-image"
                          @click="viewImageGallery(item.images, index)"
                        />
                        <span v-if="item.images.length > 2" class="view-more-btn" @click="viewImageGallery(item.images)">
                          +{{ item.images.length - 2 }} more
                        </span>
                      </div>
                      <span v-else class="no-images">No images</span>
                    </td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr>
                    <td colspan="4" style="text-align: right; font-weight: bold;">Total:</td>
                    <td colspan="2" style="font-weight: bold; color: #007bff;">
                      {{ formatCurrency(selectedOrder.total_amount_cents / 100) }}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <div class="form-actions">
            <button @click="printOrder" class="btn btn-print">
              🖨️ Print
            </button>
            <button @click="closeModal" class="btn btn-secondary close-modal-btn">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit Order Modal (Independent) -->
    <div v-if="editingOrder" class="modal-overlay" @click="cancelEdit">
      <div class="modal-content" @click.stop>
        <button @click="cancelEdit" class="close-btn">×</button>
        <div class="modal-header">
          <h2>Edit Order #{{ editingOrder.id }}</h2>
          <span :class="['status-badge', getStatusClass(editingOrder.status)]">
            {{ editingOrder.status }}
          </span>
        </div>

        <div class="item-form">
          <!-- Customer Info (Read-only in edit) -->
          <div class="section">
            <h3>Customer Information</h3>
            <div class="form-row">
              <div class="form-group">
                <label>Full Name</label>
                <input :value="editingOrder.full_name" readonly />
              </div>
              <div class="form-group">
                <label>Email</label>
                <input :value="editingOrder.email" readonly />
              </div>
              <div class="form-group">
                <label>Country</label>
                <input :value="editingOrder.country_code" readonly />
              </div>
            </div>
          </div>

          <!-- Order Info (Editable fields) -->
          <div class="section">
            <h3>Order Information</h3>
            <div class="form-row">
              <div class="form-group">
                <label>Order ID</label>
                <input :value="editingOrder.id" readonly />
              </div>
              <div class="form-group">
                <label>Stripe Payment ID</label>
                <input :value="editingOrder.stripe_payment_intent_id || 'N/A'" readonly />
              </div>
              <div class="form-group">
                <label>Currency</label>
                <input :value="editingOrder.currency" readonly />
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Total Amount</label>
                <input :value="formatCurrency(editingOrder.total_amount_cents / 100)" readonly />
              </div>
              <div class="form-group">
                <label>Created</label>
                <input :value="formatDate(editingOrder.created_at)" readonly />
              </div>
              <div class="form-group">
                <label>Finalized</label>
                <input :value="editingOrder.finalized_at ? formatDate(editingOrder.finalized_at) : 'Not finalized'" readonly />
              </div>
            </div>
            
            <!-- Editable Status -->
            <div class="form-row">
              <div class="form-group">
                <label>Status *</label>
                <select v-model="editForm.status" class="form-select">
                  <option value="pending">Pending</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <div v-if="editErrors.status" class="error-message">{{ editErrors.status }}</div>
              </div>
            </div>
          </div>

          <!-- Address (Editable) -->
          <div v-if="editingOrder.address" class="section">
            <h3>Shipping Address</h3>
            <div class="form-row">
              <div class="form-group">
                <label>Street</label>
                <input v-model="editForm.address.street" />
              </div>
              <div class="form-group">
                <label>City</label>
                <input v-model="editForm.address.city" />
              </div>
              <div class="form-group">
                <label>ZIP Code</label>
                <input v-model="editForm.address.zip" />
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>State</label>
                <input v-model="editForm.address.state" />
              </div>
              <div class="form-group">
                <label>Phone</label>
                <input v-model="editForm.address.phone" />
              </div>
            </div>
          </div>

          <!-- Order Items (Read-only in edit) -->
          <div class="section">
            <h3>Order Items ({{ editingOrder.items.length }})</h3>
            <div class="items-table-container">
              <table class="items-table">
                <thead>
                  <tr>
                    <th>Product ID</th>
                    <th>Quantity</th>
                    <th>Price</th>
                    <th>Status</th>
                    <th>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in editingOrder.items" :key="item.id">
                    <td>#{{ item.product_id }}</td>
                    <td>{{ item.quantity }}</td>
                    <td>{{ formatCurrency(item.price_cents / 100) }}</td>
                    <td>{{ item.status }}</td>
                    <td>{{ formatCurrency((item.price_cents * item.quantity) / 100) }}</td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr>
                    <td colspan="3" style="text-align: right; font-weight: bold;">Total:</td>
                    <td colspan="2" style="font-weight: bold; color: #007bff;">
                      {{ formatCurrency(editingOrder.total_amount_cents / 100) }}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <div class="form-actions">
            <button @click="cancelEdit" class="btn btn-secondary">
              Cancel
            </button>
            <button @click="saveOrder" :disabled="editLoading" class="btn btn-primary">
              {{ editLoading ? 'Saving...' : 'Save Changes' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Image Gallery Modal -->
    <div v-if="showImageGallery" class="modal-overlay" @click="closeImageGallery">
      <div class="image-modal-content" @click.stop>
        <button @click="closeImageGallery" class="close-btn">×</button>
        <div v-if="galleryImages && galleryImages.length > 0">
          <img :src="getFullImagePath(galleryImages[currentImageIndex] || '')" class="gallery-image" />
          <div class="gallery-controls">
            <button 
              @click="prevImage" 
              :disabled="currentImageIndex === 0"
              class="gallery-btn"
            >
              ← Previous
            </button>
            <span class="image-counter">
              {{ currentImageIndex + 1 }} / {{ galleryImages.length }}
            </span>
            <button 
              @click="nextImage" 
              :disabled="currentImageIndex === galleryImages.length - 1"
              class="gallery-btn"
            >
              Next →
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import api from '@/api/axios'

// Define types based on your new data structure
interface Address {
  street: string
  city: string
  zip: string
  state?: string
  phone?: string
}

interface OrderItem {
  id: number
  order_id: number
  product_id: number
  quantity: number
  price_cents: number
  status: string
  created_at: string
  images: string[]
}

interface Order {
  id: number
  stripe_payment_intent_id: string
  email: string
  full_name: string
  total_amount_cents: number
  currency: string
  address: Address | null
  country_code: string
  status: string
  created_at: string
  finalized_at: string | null
  items: OrderItem[]
}

// Get base URL from environment
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000'
const IMAGE_BASE_URL = 'http://localhost:5000' // Your image server URL

// Reactive state
const orders = ref<Order[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const searchQuery = ref('')
const statusFilter = ref('all')
const sortField = ref<keyof Order>('created_at')
const sortDirection = ref<'asc' | 'desc'>('desc')
const currentPage = ref(1)
const itemsPerPage = ref(10)
const selectedOrder = ref<Order | null>(null) // For view modal
const editingOrder = ref<Order | null>(null)  // For edit modal (separate!)
const showImageGallery = ref(false)
const galleryImages = ref<string[]>([])
const currentImageIndex = ref(0)

// Edit modal state
const editForm = ref({
  status: '',
  address: {
    street: '',
    city: '',
    zip: '',
    state: '',
    phone: ''
  }
})
const editErrors = ref<Record<string, string>>({})
const editLoading = ref(false)

// Fetch orders from API
const fetchOrders = async () => {
  loading.value = true
  error.value = null
  
  try {
    const response = await api.get('/orders')
    orders.value = response.data
  } catch (err: any) {
    if (err.response) {
      if (err.response.status === 401) {
        error.value = 'Unauthorized - Please login again'
      } else if (err.response.status === 403) {
        error.value = 'You do not have permission to view orders'
      } else {
        error.value = `Failed to load orders: ${err.response.status} - ${err.response.data?.message || err.response.statusText}`
      }
    } else if (err.request) {
      error.value = 'Network error - Please check your connection'
    } else {
      error.value = err.message || 'Failed to load orders'
    }
    console.error('Error fetching orders:', err)
  } finally {
    loading.value = false
  }
}

// Filter and sort orders
const filteredOrders = computed(() => {
  let filtered = [...orders.value]

  // Filter by search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(order =>
      order.id.toString().includes(query) ||
      order.email.toLowerCase().includes(query) ||
      order.full_name.toLowerCase().includes(query) ||
      order.country_code.toLowerCase().includes(query) ||
      (order.address && (
        order.address.street.toLowerCase().includes(query) ||
        order.address.city.toLowerCase().includes(query) ||
        (order.address.zip && order.address.zip.toLowerCase().includes(query))
      ))
    )
  }

  // Filter by status
  if (statusFilter.value !== 'all') {
    filtered = filtered.filter(order => order.status === statusFilter.value)
  }

  // Sort orders
  filtered.sort((a, b) => {
    let aVal = a[sortField.value]
    let bVal = b[sortField.value]

    // Handle null values
    if (aVal === null) return 1
    if (bVal === null) return -1

    // Convert to string for comparison if needed
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      aVal = aVal.toLowerCase()
      bVal = bVal.toLowerCase()
    }

    if (aVal < bVal) return sortDirection.value === 'asc' ? -1 : 1
    if (aVal > bVal) return sortDirection.value === 'asc' ? 1 : -1
    return 0
  })

  return filtered
})

// Pagination
const totalPages = computed(() => 
  Math.ceil(filteredOrders.value.length / itemsPerPage.value)
)

const paginatedOrders = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredOrders.value.slice(start, end)
})

// Image handling methods
const getFullImagePath = (relativePath: string) => {
  // Remove any leading slashes if they exist
  const cleanPath = relativePath.startsWith('/') ? relativePath.substring(1) : relativePath
  return `${IMAGE_BASE_URL}/${cleanPath}`
}

const viewItemImages = (item: OrderItem) => {
  if (item.images && item.images.length > 0) {
    galleryImages.value = item.images
    currentImageIndex.value = 0
    showImageGallery.value = true
  }
}

const viewImageGallery = (images: string[], startIndex = 0) => {
  galleryImages.value = images
  currentImageIndex.value = startIndex
  showImageGallery.value = true
}

// Order methods
const toggleSortDirection = () => {
  sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
}

const handleSearch = () => {
  currentPage.value = 1
}

const handleFilter = () => {
  currentPage.value = 1
}

const prevPage = () => {
  if (currentPage.value > 1) currentPage.value--
}

const nextPage = () => {
  if (currentPage.value < totalPages.value) currentPage.value++
}

const viewOrder = (order: Order) => {
  selectedOrder.value = order
}

// Open edit modal from table button
const openEditModal = (order: Order) => {
  editingOrder.value = order
  editForm.value = {
    status: order.status,
    address: order.address ? {
      street: order.address.street || '',
      city: order.address.city || '',
      zip: order.address.zip || '',
      state: order.address.state || '',
      phone: order.address.phone || ''
    } : {
      street: '',
      city: '',
      zip: '',
      state: '',
      phone: ''
    }
  }
  editErrors.value = {}
}

const saveOrder = async () => {
  if (!editingOrder.value) return

  editErrors.value = {}
  editLoading.value = true

  try {
    // Validation
    if (!editForm.value.status) {
      editErrors.value.status = 'Status is required'
      return
    }

    // Build payload based on backend controller
    const updateData: any = {
      status: editForm.value.status
    }

    if (editForm.value.address) {
      updateData.address = {
        street: editForm.value.address.street,
        city: editForm.value.address.city,
        zip: editForm.value.address.zip,
        state: editForm.value.address.state
      }
    }

    console.log('PATCH payload:', updateData)

    // ✅ CORRECT URL
    const response = await api.patch(
      `/orders/${editingOrder.value.id}`,
      updateData
    )

    // Refresh local state
    const index = orders.value.findIndex(
      o => o.id === editingOrder.value!.id
    )

    if (index !== -1) {
      orders.value[index] = {
        ...orders.value[index],
        ...updateData
      }
    }

    cancelEdit()
    alert('Order updated successfully')

  } catch (err: any) {
    console.error('Update failed:', err)

    if (err.response) {
      alert(err.response.data?.error || 'Update failed')
    } else {
      alert('Network error')
    }

  } finally {
    editLoading.value = false
  }
}



const cancelEdit = () => {
  editingOrder.value = null
  editErrors.value = {}
}

const deleteOrder = async (order: Order) => {
  if (!confirm(`Are you sure you want to delete order #${order.id}?\n\nThis action cannot be undone and will delete:\n- Order information\n- ${order.items.length} item(s)\n- Payment reference: ${order.stripe_payment_intent_id || 'None'}`)) {
    return
  }

  try {
    await api.delete(`/orders/${order.id}`)

    // Remove from local state
    const index = orders.value.findIndex(o => o.id === order.id)
    if (index !== -1) {
      orders.value.splice(index, 1)
    }
    
    // Close modals if this was the selected order
    if (selectedOrder.value && selectedOrder.value.id === order.id) {
      closeModal()
    }
    if (editingOrder.value && editingOrder.value.id === order.id) {
      cancelEdit()
    }
    
    alert('Order deleted successfully')
  } catch (err) {
    alert(`Failed to delete order: ${err instanceof Error ? err.message : 'Unknown error'}`)
    console.error('Error deleting order:', err)
  }
}

const closeModal = () => {
  selectedOrder.value = null
}

const closeImageGallery = () => {
  showImageGallery.value = false
  galleryImages.value = []
  currentImageIndex.value = 0
}

const prevImage = () => {
  if (currentImageIndex.value > 0) {
    currentImageIndex.value--
  }
}

const nextImage = () => {
  if (currentImageIndex.value < galleryImages.value.length - 1) {
    currentImageIndex.value++
  }
}

// Print functionality
const printOrder = () => {
  if (!selectedOrder.value) return
  
  const printWindow = window.open('', '_blank')
  if (!printWindow) {
    alert('Please allow popups to print')
    return
  }
  
  const order = selectedOrder.value
  
  const printContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Order #${order.id} - Invoice</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
        .order-info { margin-bottom: 30px; }
        .info-section { margin-bottom: 20px; }
        .info-section h3 { margin-bottom: 10px; color: #333; }
        .info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
        .info-item { margin-bottom: 8px; }
        .info-label { font-weight: bold; }
        .items-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .items-table th { background: #f5f5f5; padding: 10px; text-align: left; border: 1px solid #ddd; }
        .items-table td { padding: 10px; border: 1px solid #ddd; }
        .total-row { font-weight: bold; background: #f9f9f9; }
        .footer { margin-top: 40px; text-align: center; color: #666; font-size: 12px; }
        @media print {
          body { padding: 0; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Order Invoice</h1>
        <h2>Order #${order.id}</h2>
        <p>Date: ${formatDate(order.created_at)}</p>
        <p>Status: <strong>${order.status.toUpperCase()}</strong></p>
      </div>
      
      <div class="order-info">
        <div class="info-section">
          <h3>Customer Information</h3>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">Name:</span> ${order.full_name}
            </div>
            <div class="info-item">
              <span class="info-label">Email:</span> ${order.email}
            </div>
            <div class="info-item">
              <span class="info-label">Country:</span> ${order.country_code}
            </div>
          </div>
        </div>
        
        ${order.address ? `
        <div class="info-section">
          <h3>Shipping Address</h3>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">Street:</span> ${order.address.street}
            </div>
            <div class="info-item">
              <span class="info-label">City:</span> ${order.address.city}
            </div>
            <div class="info-item">
              <span class="info-label">ZIP:</span> ${order.address.zip || 'N/A'}
            </div>
            ${order.address.state ? `<div class="info-item"><span class="info-label">State:</span> ${order.address.state}</div>` : ''}
            ${order.address.phone ? `<div class="info-item"><span class="info-label">Phone:</span> ${order.address.phone}</div>` : ''}
          </div>
        </div>
        ` : ''}
        
        <div class="info-section">
          <h3>Order Details</h3>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">Order ID:</span> #${order.id}
            </div>
            <div class="info-item">
              <span class="info-label">Payment ID:</span> ${order.stripe_payment_intent_id || 'N/A'}
            </div>
            <div class="info-item">
              <span class="info-label">Currency:</span> ${order.currency}
            </div>
            <div class="info-item">
              <span class="info-label">Finalized:</span> ${order.finalized_at ? formatDate(order.finalized_at) : 'Not finalized'}
            </div>
          </div>
        </div>
      </div>
      
      <div class="items-section">
        <h3>Order Items (${order.items.length})</h3>
        <table class="items-table">
          <thead>
            <tr>
              <th>Product ID</th>
              <th>Quantity</th>
              <th>Price</th>
              <th>Status</th>
              <th>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${order.items.map(item => `
              <tr>
                <td>#${item.product_id}</td>
                <td>${item.quantity}</td>
                <td>${formatCurrency(item.price_cents / 100)}</td>
                <td>${item.status}</td>
                <td>${formatCurrency((item.price_cents * item.quantity) / 100)}</td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot>
            <tr class="total-row">
              <td colspan="4" style="text-align: right;">Total Amount:</td>
              <td>${formatCurrency(order.total_amount_cents / 100)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
      
      <div class="footer">
        <p>Printed on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
        <p>Thank you for your business!</p>
      </div>
      
      <div class="no-print" style="margin-top: 20px; text-align: center;">
        <button onclick="window.print()">🖨️ Print</button>
        <button onclick="window.close()">Close</button>
      </div>
    </body>
    </html>
  `
  
  printWindow.document.write(printContent)
  printWindow.document.close()
  printWindow.focus()
}

// Utility functions
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(amount)
}

const formatDate = (dateString: string, format: 'full' | 'date' | 'time' | 'short' = 'full') => {
  if (!dateString) return '-'
  
  const date = new Date(dateString)
  
  if (format === 'date') {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  } else if (format === 'time') {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  } else if (format === 'short') {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  } else {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }
}

const getStatusClass = (status: string) => {
  const statusLower = status.toLowerCase()
  if (statusLower.includes('pending')) return 'status-pending'
  if (statusLower.includes('shipped')) return 'status-pending'
  if (statusLower.includes('delivered')) return 'status-available'
  if (statusLower.includes('cancelled')) return 'status-sold'
  return 'status-pending'
}

const getItemStatusClass = (status: string) => {
  const statusLower = status.toLowerCase()
  if (statusLower.includes('shipped')) return 'status-available'
  if (statusLower.includes('pending')) return 'status-pending'
  return 'status-pending'
}

// Lifecycle
onMounted(() => {
  fetchOrders()
})
</script>






<style scoped>

.items-management {
  padding-top: 55px;        /* 20 + 55 navbar; adjust if needed */
  padding-left: 5vh;
  padding-right: 5vh;
  margin: 0 auto;
  position: relative;      /* keep if you want full-page coverage */
  z-index: 0;               /* ensures the pseudo-element sits behind */
  min-height: 100vh;
}

/* Background image layer */
.items-management::before {
  content: '';
  position: absolute;       /* CHANGE: was fixed */
  inset: 0;                 /* top:0 right:0 bottom:0 left:0 */
  background-image: url('../assets/backgroundImageForAdminView.jpg');
  background-size: cover;
  background-repeat: no-repeat;
  background-position: center;
  opacity: 0.99;
  z-index: -1;
  pointer-events: none;     /* so it never blocks clicks */
}

/* Add another pseudo-element for the dark overlay */
.items-management::after {
  content: '';
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.4); /* Adjust opacity for darkness */
  z-index: -1; /* Same z-index as background */
  pointer-events: none;
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
  background: white;
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
  overflow-x: auto;   
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
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

.order-id {
  font-weight: 600;
  color: #007bff;
}

.stripe-id {
  font-size: 11px;
  color: #666;
  margin-top: 3px;
  font-family: monospace;
}

.customer-info {
  min-width: 180px;
}

.customer-name {
  font-weight: 600;
  color: #333;
}

.customer-email {
  font-size: 13px;
  color: #666;
  margin-top: 2px;
}

.customer-country {
  font-size: 12px;
  color: #888;
  margin-top: 2px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.flag {
  font-size: 14px;
}

.amount-cell {
  min-width: 100px;
}

.amount {
  font-weight: 700;
  color: #333;
  font-size: 16px;
}

.currency {
  font-size: 13px;
  color: #666;
  margin-top: 2px;
}

.address-cell {
  min-width: 180px;
  max-width: 200px;
}

.address-street {
  font-weight: 500;
  color: #333;
}

.address-city {
  font-size: 13px;
  color: #666;
  margin-top: 2px;
}

.address-state {
  font-size: 12px;
  color: #888;
  margin-top: 2px;
}

.address-phone {
  font-size: 12px;
  color: #888;
  margin-top: 2px;
}

.no-address {
  font-style: italic;
  color: #999;
  font-size: 13px;
}

.status-badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  text-transform: capitalize;
  display: inline-block;
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

.finalized-date {
  font-size: 11px;
  color: #888;
  margin-top: 4px;
}

.date-cell {
  min-width: 120px;
}

.date-time {
  font-size: 12px;
  color: #666;
  margin-top: 2px;
}

.items-cell {
  min-width: 150px;
}

.items-count {
  font-size: 13px;
  color: #666;
  margin-bottom: 5px;
}

.items-preview {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.item-preview {
  background: #f8f9fa;
  padding: 6px;
  border-radius: 4px;
  border-left: 3px solid #007bff;
}

.item-quantity {
  font-weight: 500;
  font-size: 13px;
  color: #333;
}

.item-price {
  font-size: 12px;
  color: #666;
  margin-top: 2px;
}

.item-images {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-top: 3px;
  font-size: 12px;
}

.image-count {
  color: #666;
}

.view-more-btn {
  color: #007bff;
  cursor: pointer;
  font-size: 11px;
  text-decoration: underline;
}

.view-more-btn:hover {
  color: #0056b3;
}

.more-items {
  font-size: 12px;
  color: #888;
  font-style: italic;
  margin-top: 4px;
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

.view-btn {
  background-color: #17a2b8;
  color: white;
  padding: 10px 10px;
}

.view-btn:hover {
  background-color: #138496;
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
  padding: 10px 10px;
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

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  padding: 20px;
  border-top: 1px solid #eee;
}

.page-info {
  font-weight: 500;
  color: #333;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0,0,0,0.55);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
}

.modal-content {
  background: white;
  padding: 20px;
  width: 60%;
  max-width: 700px;
  border-radius: 8px;
  position: relative;
  max-height: 80vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #eee;
}

.modal-header h2 {
  margin: 0;
  color: #333;
}

.close-btn {
  position: absolute;
  top: 10px;
  right: 14px;
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  color: #666;
}

.section {
  margin-bottom: 25px;
  padding-bottom: 20px;
  border-bottom: 1px solid #eee;
}

.section:last-child {
  border-bottom: none;
}

.section h3 {
  margin: 0 0 15px 0;
  color: #333;
  font-size: 16px;
}

.item-form {
  padding: 0;
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
  font-size: 13px;
}

.form-group input {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  background: #f8f9fa;
}

.items-table-container {
  overflow-x: auto;
  margin-top: 15px;
  border: 1px solid #eee;
  border-radius: 4px;
}

.image-gallery {
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
  align-items: center;
}

.item-image {
  width: 50px;
  height: 50px;
  object-fit: cover;
  border-radius: 4px;
  cursor: pointer;
  border: 1px solid #ddd;
}

.no-images {
  font-style: italic;
  color: #999;
  font-size: 13px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #eee;
}

.close-modal-btn {
  margin-top: 0;
}

.no-items {
  text-align: center;
  padding: 40px;
  color: #666;
  font-style: italic;
}

.no-items.error {
  color: #dc3545;
  background: #f8d7da;
  border-radius: 8px;
  margin: 20px 0;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 15px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.image-modal-content {
  position: relative;
  background: white;
  border-radius: 8px;
  padding: 20px;
  max-width: 90vw;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  align-items: center;
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
  padding: 10px 15px;
  border: none;
  background: #007bff;
  color: white;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.gallery-btn:disabled {
  background: #6c757d;
  cursor: not-allowed;
}

.image-counter {
  font-weight: 500;
  color: #333;
  min-width: 80px;
  text-align: center;
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
    padding: 8px;
  }
  
  .modal-content {
    width: 90%;
    padding: 15px;
  }
  
  .btn-icon {
    padding: 8px;
    font-size: 12px;
  }

  .btn-print {
  background-color: #28a745;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-print:hover {
  background-color: #218838;
}

.btn-print:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
}

.form-select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  background-color: white;
}

.form-select:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}

.error-message {
  color: #dc3545;
  font-size: 12px;
  margin-top: 4px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #eee;
}



}
</style>