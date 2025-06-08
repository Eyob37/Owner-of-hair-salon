import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { 
  getDatabase, 
  ref, 
  onValue, 
  query, 
  orderByChild, 
  remove 
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyBg3ZDrhUzFL028IaZ8vc7LNUDH7QPk60o",
  authDomain: "haymanot-tsegur-bet.firebaseapp.com",
  projectId: "haymanot-tsegur-bet",
  storageBucket: "haymanot-tsegur-bet.appspot.com",
  messagingSenderId: "225863250013",
  appId: "1:225863250013:web:81e7be55a59f205b939db4",
  measurementId: "G-F9PNTP7JZN"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const ordersRef = ref(database, "hairSalon");

// DOM Elements
const ordersContainer = document.getElementById('ordersContainer');
const noOrders = document.getElementById('noOrders');
const totalOrders = document.getElementById('totalOrders');
const todayOrders = document.getElementById('todayOrders');
const totalRevenue = document.getElementById('totalRevenue');
const refreshBtn = document.getElementById('refreshBtn');
const clearAllBtn = document.getElementById('clearAllBtn');
const dateFilter = document.getElementById('dateFilter');
const searchFilter = document.getElementById('searchFilter');

// Variables
let allOrders = [];
let today = new Date().toISOString().split('T')[0];

// Initialize the page
function init() {
  dateFilter.value = today;
  fetchOrders();
  setupEventListeners();
}

// Fetch orders from Firebase with the nested structure
// Fetch orders from Firebase with the nested structure - Fixed version
function fetchOrders() {
  onValue(ordersRef, (snapshot) => {
    allOrders = [];
    let ordersData = snapshot.val();
    
    if (ordersData) {
      // Loop through each phoneId
      Object.keys(ordersData).forEach(phoneId => {
        const phoneOrders = ordersData[phoneId];
        
        // Loop through each temporalId under phoneId
        Object.keys(phoneOrders).forEach(temporalId => {
          let order = phoneOrders[temporalId];
          // Make sure we're getting an actual order object
          if (order && typeof order === 'object' && order.date) {
            order.id = temporalId; // Use temporalId as order ID
            order.phoneId = phoneId; // Store phoneId reference
            allOrders.push(order);
          }
        });
      });
      
      updateSummary();
      filterOrders();
    } else {
      showNoOrders();
    }
  }, {
    onlyOnce: false
  });
}

// Update summary cards
function updateSummary() {
  totalOrders.textContent = allOrders.length;
  
  let todayCount = allOrders.filter(order => order.date === today).length;
  todayOrders.textContent = todayCount;
  
  let revenue = allOrders.reduce((total, order) => {
    if (order.service) {
      let orderTotal = Object.values(order.service).reduce((sum, service) => {
        return sum + (parseInt(service.price) || 0);
      }, 0);
      return total + orderTotal;
    }
    return total;
  }, 0);
  
  totalRevenue.textContent = `${revenue} ብር`;
}

// Filter orders based on date and search
function filterOrders() {
  let filtered = [...allOrders];
  const dateValue = dateFilter.value;
  const searchValue = searchFilter.value.toLowerCase();
  
  if (dateValue) {
    filtered = filtered.filter(order => order.date === dateValue);
  }
  
  if (searchValue) {
    filtered = filtered.filter(order => 
      (order.name && order.name.toLowerCase().includes(searchValue)) || 
      (order.phone && order.phone.includes(searchValue)));
  }
  
  displayOrders(filtered);
}

// Display orders in the UI
// Display orders in the UI
// Display orders in the UI - Fixed version
function displayOrders(orders) {
  if (orders.length === 0) {
    showNoOrders();
    return;
  }

  // Sort by timestamp (newest first)
  orders.sort((a, b) => (b.timestemp || 0) - (a.timestemp || 0));

  ordersContainer.innerHTML = '';

  orders.forEach(order => {
    let orderCard = document.createElement('div');
    orderCard.className = 'order-card';
    
    let servicesHTML = '';
    let orderTotal = 0;
    
    if (order.service) {
      servicesHTML = Object.values(order.service).map(service => {
        orderTotal += parseInt(service.price) || 0;
        return `
          <div class="service-item">
            <span>${service.name}</span>
            <span>${service.price} ብር</span>
          </div>
        `;
      }).join('');
    }
    
    orderCard.innerHTML = `
      <div class="order-header">
        <span class="order-id">የትዕዛዝ #${order.id.slice(-6)}</span>
        <span class="order-date">${formatDate(order.date)} ${order.time || ''}</span>
      </div>
      <div class="order-services">
        <div class="service-list">
          ${servicesHTML}
        </div>
        <div class="order-total">
          ጠቅላላ: ${orderTotal} ብር
        </div>
      </div>
      <div class="customer-info">
        <h3><i class="fas fa-user"></i> ደንበኛ መረጃ</h3>
        <p><strong>ስም:</strong> ${order.name || 'N/A'}</p>
        <p><strong>ስልክ:</strong> ${order.phone || 'N/A'}</p>
      </div>
      <div class="order-actions">
        <button class="btn danger delete-btn" data-phoneid="${order.phoneId}" data-temporalid="${order.id}">
          <i class="fas fa-trash"></i> ሰርዝ
        </button>
      </div>
    `;
    
    ordersContainer.appendChild(orderCard);
  });

  // Add event listeners to delete buttons
  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const phoneId = e.target.closest('.delete-btn').dataset.phoneid;
      const temporalId = e.target.closest('.delete-btn').dataset.temporalid;
      deleteOrder(phoneId, temporalId);
    });
  });
}

// Delete an order with the nested structure
function deleteOrder(phoneId, temporalId) {
  if (confirm('እርግጠኛ ነዎት ይህን ትዕዛዝ መሰረዝ ይፈልጋሉ?')) {
    const orderRef = ref(database, `hairSalon/${phoneId}/${temporalId}`);
    remove(orderRef)
      .then(() => {
        alert('ትዕዛዙ በትክክል ተሰርዟል!');
      })
      .catch(error => {
        console.error('Error deleting order:', error);
        alert('የትዕዛዝ ስረዛ አልተሳካም!');
      });
  }
}

// Clear all orders (now needs to handle nested structure)
function clearAllOrders() {
  if (confirm('እርግጠኛ ነዎት ሁሉንም ትዕዛዞች ማጥፋት ይፈልጋሉ? ይህ ተገላቢጦሽ አይደለም!')) {
    remove(ordersRef)
      .then(() => {
        alert('ሁሉም ትዕዛዞች በትክክል ተሰርዘዋል!');
      })
      .catch(error => {
        console.error('Error clearing all orders:', error);
        alert('የትዕዛዞች ማጥፋት አልተሳካም!');
      });
  }
}

// Format date for display
function formatDate(dateString) {
  if (!dateString) return '';
  const [year, month, day] = dateString.split('-');
  return `${year}/${month}/${day}`;
}

// Show no orders message
function showNoOrders() {
  ordersContainer.innerHTML = '';
  ordersContainer.appendChild(noOrders.cloneNode(true));
}

// Setup event listeners
function setupEventListeners() {
  refreshBtn.addEventListener('click', fetchOrders);
  clearAllBtn.addEventListener('click', clearAllOrders);
  dateFilter.addEventListener('change', filterOrders);
  searchFilter.addEventListener('input', filterOrders);
}

// Initialize the application
init();