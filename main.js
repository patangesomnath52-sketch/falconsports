// =====================================================
// FALCONSPORTS – main.js (shared across all pages)
// =====================================================

// ---------- API CONFIG ----------
const API_URL = '/api';

// ---------- THEME TOGGLE (safe – no errors if button missing) ----------
(function initTheme() {
  const body = document.body;
  const toggle = document.getElementById('themeToggle');
  if (!toggle) return;                     // page has no toggle
  const icon = toggle.querySelector('i');
  if (!icon) return;                       // no icon inside button

  if (localStorage.getItem('falconSportsTheme') === 'dark') {
    body.classList.add('dark');
    icon.className = 'fas fa-sun';
  }

  toggle.addEventListener('click', () => {
    body.classList.toggle('dark');
    const isDark = body.classList.contains('dark');
    icon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
    localStorage.setItem('falconSportsTheme', isDark ? 'dark' : 'light');
  });
})();

// ---------- MOBILE MENU ----------
function openMobileMenu() {
  const menu = document.getElementById('mobileMenu');
  const overlay = document.getElementById('menuOverlay');
  if (menu) menu.classList.add('open');
  if (overlay) overlay.classList.add('show');
}
function closeMobileMenu() {
  const menu = document.getElementById('mobileMenu');
  const overlay = document.getElementById('menuOverlay');
  if (menu) menu.classList.remove('open');
  if (overlay) overlay.classList.remove('show');
}
window.openMobileMenu = openMobileMenu;
window.closeMobileMenu = closeMobileMenu;

// ---------- NOTIFICATION SYSTEM ----------
function showNotification(message) {
  const notification = document.getElementById('notification');
  if (!notification) return;
  notification.textContent = message;
  notification.style.display = 'block';
  setTimeout(() => { notification.style.display = 'none'; }, 3000);
}
window.showNotification = showNotification;

// ---------- CART MANAGEMENT ----------
let cart = JSON.parse(localStorage.getItem('falconCart')) || [];

function saveCart() {
  localStorage.setItem('falconCart', JSON.stringify(cart));
  updateCartUI();
}

/**
 * Add an item to the cart.
 * @param {string} name
 * @param {number} price
 * @param {object} [options] - { size, qty, image }
 */
function addToCart(name, price, options = {}) {
  cart.push({
    name,
    price,
    size: options.size || '',
    qty: options.qty || 1,
    image: options.image || '',
    id: Date.now()
  });
  saveCart();
  showNotification(`${name} added to cart!`);
}

function removeFromCart(index) {
  cart.splice(index, 1);
  saveCart();
  showNotification('Item removed from cart');
}

function updateCartUI() {
  const cartCountEl = document.getElementById('cartCount');
  if (cartCountEl) cartCountEl.textContent = cart.length;

  const cartPage = document.getElementById('cartPageItems');
  if (cartPage) {
    if (cart.length === 0) {
      cartPage.innerHTML = '<p>Your cart is empty.</p>';
    } else {
      cartPage.innerHTML = cart.map((item, idx) => `
        <div style="display:flex; justify-content:space-between; padding:12px; background:var(--surface); margin:8px 0; border-radius:8px;">
          <span>${item.name} ${item.size ? '(' + item.size + ')' : ''} × ${item.qty}</span>
          <span>₹${item.price * item.qty}</span>
          <button onclick="removeFromCart(${idx})" style="background:none; border:none; color:var(--accent); cursor:pointer;">✕</button>
        </div>
      `).join('') + `<div style="font-weight:800; font-size:1.2rem; margin-top:16px;">Total: ₹${cart.reduce((sum, item) => sum + item.price * item.qty, 0)}</div>`;
    }
  }
}

window.addToCart = addToCart;
window.removeFromCart = removeFromCart;

// ---------- KIT BUILDER MANAGEMENT ----------
let kitItems = JSON.parse(localStorage.getItem('falconKit')) || [];

function saveKit() {
  localStorage.setItem('falconKit', JSON.stringify(kitItems));
  updateKitUI();
}

/**
 * Add an item to the kit.
 * @param {string} name
 * @param {number} price
 * @param {string} type - 'tshirt', 'bottom', 'shoes', or 'general'
 * @param {object} [options] - { size, image }
 */
function addToKit(name, price, type, options = {}) {
  kitItems = kitItems.filter(item => item.type !== type);
  kitItems.push({
    name,
    price,
    type,
    size: options.size || '',
    image: options.image || '',
    id: Date.now()
  });
  saveKit();
  showNotification(`${name} added to your kit!`);
}

function removeFromKit(id) {
  kitItems = kitItems.filter(item => item.id !== id);
  saveKit();
  showNotification('Item removed from kit');
}

function updateKitUI() {
  const floatCount = document.getElementById('kitCount');
  const floatTotal = document.getElementById('kitTotalFloat');
  const floatingKit = document.getElementById('floatingKit');
  if (floatCount && floatTotal && floatingKit) {
    const count = kitItems.length;
    const total = kitItems.reduce((sum, item) => sum + item.price, 0);
    floatCount.textContent = count;
    floatTotal.textContent = total;
    floatingKit.classList.toggle('active', count > 0);
  }

  const summaryItems = document.getElementById('summaryItems');
  if (summaryItems) {
    if (kitItems.length === 0) {
      summaryItems.innerHTML = '<p style="color:#999;">No items selected</p>';
    } else {
      summaryItems.innerHTML = kitItems.map(item => `
        <div class="kit-summary-item">
          <span>${item.name} (${item.type})</span>
          <span>₹${item.price} <span class="remove-kit" onclick="removeFromKit(${item.id})">✕</span></span>
        </div>
      `).join('');
    }
    const subtotalEl = document.getElementById('subtotal');
    const discountRow = document.getElementById('discountRow');
    const discountAmt = document.getElementById('discountAmt');
    const grandTotal = document.getElementById('grandTotal');
    if (subtotalEl) {
      const subtotal = kitItems.reduce((s, i) => s + i.price, 0);
      subtotalEl.textContent = '₹' + subtotal;
      const hasAll = kitItems.some(i => i.type === 'tshirt') &&
                     kitItems.some(i => i.type === 'bottom') &&
                     kitItems.some(i => i.type === 'shoes');
      const discountPercent = 10;
      const discount = hasAll ? Math.round(subtotal * discountPercent / 100) : 0;
      if (discountRow) discountRow.style.display = hasAll ? 'flex' : 'none';
      if (discountAmt) discountAmt.textContent = '-₹' + discount;
      if (grandTotal) grandTotal.textContent = '₹' + (subtotal - discount);
    }
  }
}

window.addToKit = addToKit;
window.removeFromKit = removeFromKit;

// ---------- COUPON VALIDATION ----------
async function validateCoupon(code) {
  try {
    const res = await fetch(`${API_URL}/coupons/validate/${encodeURIComponent(code)}`);
    return await res.json();
  } catch (err) {
    console.error('Coupon validation error:', err);
    return { valid: false, message: 'Validation failed' };
  }
}
window.validateCoupon = validateCoupon;

// ---------- API HELPERS ----------
async function fetchProducts() {
  try {
    const res = await fetch(`${API_URL}/products`);
    return await res.json();
  } catch (err) {
    console.error('Failed to fetch products:', err);
    return [];
  }
}

async function fetchReviews(query = '') {
  try {
    const res = await fetch(`${API_URL}/reviews${query}`);
    return await res.json();
  } catch (err) {
    console.error('Failed to fetch reviews:', err);
    return [];
  }
}

window.fetchProducts = fetchProducts;
window.fetchReviews = fetchReviews;

// ---------- INITIAL UI UPDATE ----------
document.addEventListener('DOMContentLoaded', () => {
  updateCartUI();
  updateKitUI();
});