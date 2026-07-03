const firebaseConfig = {
  apiKey: "AIzaSyCRxgZqzsBPgpBmj33LGz733xvc8_SaEzY",
  authDomain: "pinrest-4k--wallpaper-gallery.firebaseapp.com",
  projectId: "pinrest-4k--wallpaper-gallery",
  storageBucket: "pinrest-4k--wallpaper-gallery.firebasestorage.app",
  messagingSenderId: "1069141898009",
  appId: "1:1069141898009:web:96a3dcde8f26b9f12d8b88"
};

// Initialise Firebase only once
if (typeof firebase !== 'undefined') {
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }
}
const auth = firebase.auth();

// ---------- API CONFIG ----------
const API_URL = '/api';   // use relative URL for production

// ---------- THEME TOGGLE ----------
(function initTheme() {
  const body = document.body;
  const toggle = document.getElementById('themeToggle');
  if (!toggle) return;
  const icon = toggle.querySelector('i');
  if (!icon) return;
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

// ---------- NOTIFICATION ----------
function showNotification(message) {
  const notification = document.getElementById('notification');
  if (!notification) return;
  notification.textContent = message;
  notification.style.display = 'block';
  setTimeout(() => { notification.style.display = 'none'; }, 3000);
}
window.showNotification = showNotification;

// ---------- CART (same as before) ----------
let cart = JSON.parse(localStorage.getItem('falconCart')) || [];
function saveCart() { localStorage.setItem('falconCart', JSON.stringify(cart)); updateCartUI(); }
function addToCart(name, price, options = {}) {
  cart.push({ name, price, size: options.size || '', qty: options.qty || 1, image: options.image || '', id: Date.now() });
  saveCart();
  showNotification(`${name} added to cart!`);
}
function removeFromCart(index) { cart.splice(index, 1); saveCart(); showNotification('Item removed'); }
function updateCartUI() {
  const cartCountEl = document.getElementById('cartCount');
  if (cartCountEl) cartCountEl.textContent = cart.length;
  const cartPage = document.getElementById('cartPageItems');
  if (cartPage) {
    cartPage.innerHTML = cart.length === 0 ? '<p>Your cart is empty.</p>' :
      cart.map((item, idx) => `
        <div style="display:flex; justify-content:space-between; padding:12px; background:var(--surface); margin:8px 0; border-radius:8px;">
          <span>${item.name} ${item.size ? '(' + item.size + ')' : ''} × ${item.qty}</span>
          <span>₹${item.price * item.qty}</span>
          <button onclick="removeFromCart(${idx})" style="background:none; border:none; color:var(--accent); cursor:pointer;">✕</button>
        </div>
      `).join('') + `<div style="font-weight:800; margin-top:16px;">Total: ₹${cart.reduce((s,i) => s + i.price * i.qty, 0)}</div>`;
  }
}
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;

// ---------- KIT BUILDER (same as before, with size/image) ----------
let kitItems = JSON.parse(localStorage.getItem('falconKit')) || [];
function saveKit() { localStorage.setItem('falconKit', JSON.stringify(kitItems)); updateKitUI(); }
function addToKit(name, price, type, options = {}) {
  kitItems = kitItems.filter(i => i.type !== type);
  kitItems.push({ name, price, type, size: options.size || '', image: options.image || '', id: Date.now() });
  saveKit();
  showNotification(`${name} added to kit!`);
}
function removeFromKit(id) { kitItems = kitItems.filter(i => i.id !== id); saveKit(); showNotification('Item removed from kit'); }
function updateKitUI() {
  const floatCount = document.getElementById('kitCount');
  const floatTotal = document.getElementById('kitTotalFloat');
  const floatingKit = document.getElementById('floatingKit');
  if (floatCount && floatTotal && floatingKit) {
    floatCount.textContent = kitItems.length;
    floatTotal.textContent = kitItems.reduce((s,i) => s + i.price, 0);
    floatingKit.classList.toggle('active', kitItems.length > 0);
  }
  const summaryItems = document.getElementById('summaryItems');
  if (summaryItems) {
    if (kitItems.length === 0) {
      summaryItems.innerHTML = '<p style="color:#999;">No items selected</p>';
    } else {
      summaryItems.innerHTML = kitItems.map(i => `
        <div class="kit-summary-item">
          <span>${i.name} (${i.type})</span>
          <span>₹${i.price} <span class="remove-kit" onclick="removeFromKit(${i.id})">✕</span></span>
        </div>
      `).join('');
    }
    const subtotalEl = document.getElementById('subtotal');
    const discountRow = document.getElementById('discountRow');
    const discountAmt = document.getElementById('discountAmt');
    const grandTotal = document.getElementById('grandTotal');
    if (subtotalEl) {
      const subtotal = kitItems.reduce((s,i) => s + i.price, 0);
      subtotalEl.textContent = '₹' + subtotal;
      const hasAll = kitItems.some(i => i.type === 'tshirt') && kitItems.some(i => i.type === 'bottom') && kitItems.some(i => i.type === 'shoes');
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

// ---------- AUTH STATE LISTENER (updates header icon) ----------
auth.onAuthStateChanged(user => {
  const accountIcon = document.querySelector('.header-actions .fa-user');
  if (!accountIcon) return;
  if (user) {
    accountIcon.classList.remove('fa-user');
    accountIcon.classList.add('fa-user-check');
    accountIcon.title = `Signed in as ${user.email}`;
    accountIcon.onclick = () => {
      auth.signOut();
      showNotification('Signed out');
    };
  } else {
    accountIcon.classList.remove('fa-user-check');
    accountIcon.classList.add('fa-user');
    accountIcon.title = 'Sign in';
    accountIcon.onclick = () => {
      window.location.href = 'signin.html';
    };
  }
});
// 👇 Add this to main.js (or product page script)
document.addEventListener('DOMContentLoaded', () => {
  // Listen for auth state changes
  auth.onAuthStateChanged(user => {
    const buttons = document.querySelectorAll('.add-to-cart-btn');
    
    if (!user) {
      // 🔒 Not signed in → disable all add‑to‑cart buttons
      buttons.forEach(btn => {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-lock"></i> Sign in to add';
        btn.style.opacity = '0.6';
        btn.style.cursor = 'not-allowed';
        // Override click to show notification
        btn.onclick = (e) => {
          e.preventDefault();
          showNotification('Please sign in to add items to your cart.', 'error');
          // (Optional) redirect to sign‑in page:
          // window.location.href = 'signin.html';
        };
      });
    } else {
      // ✅ Signed in → enable all buttons
      buttons.forEach(btn => {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-shopping-cart"></i> Add to Cart';
        btn.style.opacity = '1';
        btn.style.cursor = 'pointer';
        // Restore your original click handler (if you have one)
        // e.g., btn.onclick = yourOriginalAddToCartFunction;
        // If you use event listeners, you can just re‑attach them here.
      });
    }
  });
});
// Add this to your main.js or product page script
document.addEventListener('DOMContentLoaded', () => {
  // Watch auth state
  auth.onAuthStateChanged(user => {
    const addButtons = document.querySelectorAll('.add-to-cart-btn');
    if (!user) {
      // Disable all add-to-cart buttons and show a lock icon
      addButtons.forEach(btn => {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-lock"></i> Sign in to add';
        btn.style.opacity = '0.6';
        btn.style.cursor = 'not-allowed';
        btn.onclick = (e) => {
          e.preventDefault();
          showNotification('Please sign in to add items to your cart.', 'error');
          // Optionally redirect to sign-in page
          // window.location.href = 'signin.html';
        };
      });
    } else {
      // Enable buttons
      addButtons.forEach(btn => {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-shopping-cart"></i> Add to Cart';
        btn.style.opacity = '1';
        btn.style.cursor = 'pointer';
        // Restore original click handler (assumes you have one)
      });
    }
  });
});
// ---------- INITIAL UI UPDATE ----------
document.addEventListener('DOMContentLoaded', () => {
  updateCartUI();
  updateKitUI();
});