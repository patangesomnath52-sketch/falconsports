// =====================================================
// FALCONSPORTS – main.js (shared across all pages)
// =====================================================

(function() {
  'use strict';

  // ---------- FIREBASE CONFIG ----------
  const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
  };

  // Initialize Firebase ONLY if SDK is loaded
  let auth = null;
  if (typeof firebase !== 'undefined') {
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }
    auth = firebase.auth();
    console.log('✅ Firebase initialized');
  } else {
    console.warn('⚠️ Firebase SDK not loaded. Auth features will not work.');
  }

  // ---------- API CONFIG ----------
  const API_URL = '/api';

  // ---------- THEME TOGGLE ----------
  (function initTheme() {
    const toggle = document.getElementById('themeToggle');
    if (!toggle) return;
    const icon = toggle.querySelector('i');
    if (!icon) return;

    const body = document.body;   // declared only here

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
  function showNotification(message, duration = 3000) {
    const notification = document.getElementById('notification');
    if (!notification) return;
    notification.textContent = message;
    notification.style.display = 'block';
    clearTimeout(notification._timeout);
    notification._timeout = setTimeout(() => {
      notification.style.display = 'none';
    }, duration);
  }
  window.showNotification = showNotification;

  // ---------- CART ----------
  let cart = JSON.parse(localStorage.getItem('falconCart')) || [];

  function saveCart() {
    localStorage.setItem('falconCart', JSON.stringify(cart));
    updateCartUI();
  }

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
  window.addToCart = addToCart;

  function removeFromCart(index) {
    cart.splice(index, 1);
    saveCart();
    showNotification('Item removed from cart');
  }
  window.removeFromCart = removeFromCart;

  function updateCartUI() {
    const cartCountEl = document.getElementById('cartCount');
    if (cartCountEl) cartCountEl.textContent = cart.length;

    const cartPage = document.getElementById('cartPageItems');
    if (cartPage) {
      if (cart.length === 0) {
        cartPage.innerHTML = '<p style="color:#999; text-align:center;">Your cart is empty.</p>';
      } else {
        cartPage.innerHTML = cart.map((item, idx) => `
          <div style="display:flex; justify-content:space-between; align-items:center; padding:12px; background:var(--surface); margin:8px 0; border-radius:8px;">
            <span>${item.name} ${item.size ? '(' + item.size + ')' : ''} × ${item.qty}</span>
            <span>₹${item.price * item.qty}</span>
            <button onclick="removeFromCart(${idx})" style="background:none; border:none; color:var(--accent); cursor:pointer; font-size:1.2rem;">✕</button>
          </div>
        `).join('') + `
          <div style="font-weight:800; margin-top:16px; text-align:right;">
            Total: ₹${cart.reduce((sum, i) => sum + i.price * i.qty, 0)}
          </div>
        `;
      }
    }
  }

  // ---------- KIT BUILDER ----------
  let kitItems = JSON.parse(localStorage.getItem('falconKit')) || [];

  function saveKit() {
    localStorage.setItem('falconKit', JSON.stringify(kitItems));
    updateKitUI();
  }

  function addToKit(name, price, type, options = {}) {
    kitItems = kitItems.filter(i => i.type !== type);
    kitItems.push({
      name,
      price,
      type,
      size: options.size || '',
      image: options.image || '',
      id: Date.now()
    });
    saveKit();
    showNotification(`${name} added to kit!`);
  }
  window.addToKit = addToKit;

  function removeFromKit(id) {
    kitItems = kitItems.filter(i => i.id !== id);
    saveKit();
    showNotification('Item removed from kit');
  }
  window.removeFromKit = removeFromKit;

  function updateKitUI() {
    const floatCount = document.getElementById('kitCount');
    const floatTotal = document.getElementById('kitTotalFloat');
    const floatingKit = document.getElementById('floatingKit');
    if (floatCount && floatTotal && floatingKit) {
      floatCount.textContent = kitItems.length;
      floatTotal.textContent = kitItems.reduce((sum, i) => sum + i.price, 0);
      floatingKit.classList.toggle('visible', kitItems.length > 0);
    }

    const summaryItems = document.getElementById('summaryItems');
    if (summaryItems) {
      if (kitItems.length === 0) {
        summaryItems.innerHTML = '<p style="color:#999;">No items selected</p>';
      } else {
        summaryItems.innerHTML = kitItems.map(i => `
          <div class="kit-summary-item">
            <span>${i.name} <small>(${i.type})</small></span>
            <span>₹${i.price} <span class="remove-kit" onclick="removeFromKit(${i.id})">✕</span></span>
          </div>
        `).join('');
      }

      const subtotalEl = document.getElementById('subtotal');
      const discountRow = document.getElementById('discountRow');
      const discountAmt = document.getElementById('discountAmt');
      const grandTotal = document.getElementById('grandTotal');
      if (subtotalEl) {
        const subtotal = kitItems.reduce((sum, i) => sum + i.price, 0);
        subtotalEl.textContent = '₹' + subtotal;
        const hasAllThree = kitItems.some(i => i.type === 'tshirt') &&
                            kitItems.some(i => i.type === 'bottom') &&
                            kitItems.some(i => i.type === 'shoes');
        const discountPercent = 10;
        const discount = hasAllThree ? Math.round(subtotal * discountPercent / 100) : 0;
        if (discountRow) discountRow.style.display = hasAllThree ? 'flex' : 'none';
        if (discountAmt) discountAmt.textContent = '-₹' + discount;
        if (grandTotal) grandTotal.textContent = '₹' + (subtotal - discount);
      }
    }
  }

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

  // ---------- AUTH STATE LISTENER (only if Firebase loaded) ----------
  if (auth) {
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
  }

  // ---------- INITIAL UI UPDATE ----------
  document.addEventListener('DOMContentLoaded', () => {
    updateCartUI();
    updateKitUI();
  });

})();