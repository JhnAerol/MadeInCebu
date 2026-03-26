/* cart.js - Yellow Basket Logic */

let cart = JSON.parse(localStorage.getItem('mcebu_cart')) || [];

// Expose to global scope for HTML onclick access
window.initCartSystem = initCartSystem;
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.updateCartQty = updateCartQty;

function initCartSystem() {
  updateCartUI();

  // Drawer Toggle Logic
  const toggleBtn = document.getElementById('cartToggle');
  const closeBtn = document.getElementById('cartClose');
  const overlay = document.getElementById('cartOverlay');
  const drawer = document.getElementById('cartDrawer');

  function openCart(e) {
    if(e) e.preventDefault();
    drawer?.classList.add('open');
    overlay?.classList.add('open');
  }

  function closeCart() {
    drawer?.classList.remove('open');
    overlay?.classList.remove('open');
  }

  toggleBtn?.addEventListener('click', openCart);
  closeBtn?.addEventListener('click', closeCart);
  overlay?.addEventListener('click', closeCart);

  // Expose openCart for programmatic opening after adding an item
  window.openCartDrawer = openCart;
}

function addToCart(productId, qty = 1, size = '') {
  const product = productsData[productId];
  if (!product) return;

  // Use default size if none selected but available
  if (!size && product.details?.sizes?.length > 0) {
    size = product.details.sizes[0];
  }

  // Check if item already exists (same product + same size)
  const existingItemIndex = cart.findIndex(item => item.id === productId && item.size === size);

  if (existingItemIndex > -1) {
    // Check stock limit
    if (cart[existingItemIndex].qty + qty > product.stock) {
      if(window.showToast) window.showToast(`Only ${product.stock} items available in stock.`);
      return;
    }
    cart[existingItemIndex].qty += qty;
  } else {
    // Check stock
    if (qty > product.stock) {
      if(window.showToast) window.showToast(`Only ${product.stock} items available.`);
      return;
    }
    
    // Parse price to float
    const priceNum = parseFloat(product.price.replace(/[^0-9.]/g, ''));
    
    cart.push({
      id: productId,
      name: product.name,
      brand: product.brand,
      price: priceNum,
      image: product.image,
      size: size,
      qty: qty,
      maxStock: product.stock
    });
  }

  saveCart();
  updateCartUI();
  
  if(window.showToast) window.showToast(`${product.name} added to Yellow Basket`);
  if(window.openCartDrawer) window.openCartDrawer();
}

function removeFromCart(index) {
  cart.splice(index, 1);
  saveCart();
  updateCartUI();
  
  if (window.location.pathname.includes('checkout.html') && window.renderCheckoutItems) {
    window.renderCheckoutItems();
  }
}

function updateCartQty(index, change) {
  const item = cart[index];
  const newQty = item.qty + change;
  
  if (newQty > 0 && newQty <= item.maxStock) {
    item.qty = newQty;
    saveCart();
    updateCartUI();
    
    if (window.location.pathname.includes('checkout.html') && window.renderCheckoutItems) {
      window.renderCheckoutItems();
    }
  } else if (newQty > item.maxStock) {
    if(window.showToast) window.showToast(`Cannot add more. Max stock is ${item.maxStock}.`);
  }
}

function saveCart() {
  localStorage.setItem('mcebu_cart', JSON.stringify(cart));
}

function updateCartUI() {
  const badge = document.getElementById('cartBadge');
  const itemsContainer = document.getElementById('cartItems');
  const emptyMsg = document.getElementById('cartEmpty');
  const totalEl = document.getElementById('cartTotal');
  const checkoutBtn = document.getElementById('checkoutBtn');

  // Total Quantity
  const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
  if (badge) badge.innerText = totalItems;

  // Total Price
  const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  if (totalEl) totalEl.innerText = `₱${totalPrice.toLocaleString('en-US', {minimumFractionDigits: 2})}`;

  // Update Drawer Content
  if (itemsContainer && emptyMsg && checkoutBtn) {
    if (cart.length === 0) {
      itemsContainer.innerHTML = '';
      emptyMsg.style.display = 'block';
      checkoutBtn.disabled = true;
    } else {
      emptyMsg.style.display = 'none';
      checkoutBtn.disabled = false;
      
      itemsContainer.innerHTML = cart.map((item, index) => `
        <div class="cart-item">
          <img src="${item.image}" alt="${item.name}" class="cart-item-img">
          <div class="cart-item-info">
            <div class="cart-item-brand">${item.brand}</div>
            <div class="cart-item-name">${item.name}</div>
            <div class="text-secondary" style="font-size:0.75rem">Size: ${item.size || 'Standard'}</div>
            <div class="cart-item-price">₱${item.price.toLocaleString('en-US', {minimumFractionDigits: 2})}</div>
            <div class="cart-item-qty">
              <button class="qty-btn" onclick="updateCartQty(${index}, -1)">-</button>
              <span class="qty-value">${item.qty}</span>
              <button class="qty-btn" onclick="updateCartQty(${index}, 1)">+</button>
            </div>
          </div>
          <button class="cart-item-remove" onclick="removeFromCart(${index})">
            <i class="bi bi-trash-fill"></i>
          </button>
        </div>
      `).join('');
    }
  }
}

// ==== CHECKOUT LOGIC ====
window.initCheckout = function() {
  window.renderCheckoutItems = renderCheckoutItems;
  renderCheckoutItems();

  const checkoutForm = document.getElementById('checkoutForm');
  if (checkoutForm) {
    checkoutForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      if (cart.length === 0) {
        if(window.showToast) window.showToast('Your cart is empty!');
        return;
      }

      // Generate random order ID (e.g. MCEBU-XXXX)
      const orderId = 'MCEBU-' + Math.floor(1000 + Math.random() * 9000);
      
      // Save purchased quantities to localStorage to simulate stock decrease
      const purchases = JSON.parse(localStorage.getItem('mcebu_purchases')) || {};
      cart.forEach(item => {
        if (!purchases[item.id]) purchases[item.id] = 0;
        purchases[item.id] += item.qty;
      });
      localStorage.setItem('mcebu_purchases', JSON.stringify(purchases));

      // Clear cart
      cart = [];
      saveCart();
      updateCartUI();

      // Redirect to status track page with order param
      window.location.href = `order-status.html?order=${orderId}`;
    });
  }
}

function renderCheckoutItems() {
  const container = document.getElementById('checkoutItems');
  const subtotalEl = document.getElementById('checkoutSubtotal');
  const totalEl = document.getElementById('checkoutTotal');
  const placeOrderBtn = document.getElementById('placeOrderBtn');

  if (!container) return;

  if (cart.length === 0) {
    container.innerHTML = `<p class="text-secondary">Your basket is empty. <a href="products.html">Browse products</a>.</p>`;
    if (subtotalEl) subtotalEl.innerText = '₱0.00';
    if (totalEl) totalEl.innerText = '₱0.00';
    if (placeOrderBtn) placeOrderBtn.disabled = true;
    return;
  }

  if (placeOrderBtn) placeOrderBtn.disabled = false;

  container.innerHTML = cart.map((item, index) => `
    <div class="d-flex gap-3 mb-3 pb-3" style="border-bottom:1px solid var(--border-color)">
      <div class="position-relative">
        <img src="${item.image}" alt="${item.name}" style="width:70px;height:70px;object-fit:cover;border-radius:var(--radius-sm)">
        <span class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-secondary" style="font-size:0.7rem">${item.qty}</span>
      </div>
      <div class="flex-grow-1">
        <h6 class="mb-1 fw-bold" style="font-size:0.9rem">${item.name}</h6>
        <div class="text-secondary" style="font-size:0.75rem">${item.brand} • Size: ${item.size || 'Standard'}</div>
        <div class="d-flex justify-content-between align-items-center mt-2">
          <div class="fw-bold" style="color:var(--primary)">₱${(item.price * item.qty).toLocaleString('en-US', {minimumFractionDigits: 2})}</div>
          <button class="btn btn-sm btn-link text-danger p-0 text-decoration-none" onclick="removeFromCart(${index})" style="font-size:0.8rem">Remove</button>
        </div>
      </div>
    </div>
  `).join('');

  const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const formattedPrice = `₱${totalPrice.toLocaleString('en-US', {minimumFractionDigits: 2})}`;
  
  if (subtotalEl) subtotalEl.innerText = formattedPrice;
  if (totalEl) totalEl.innerText = formattedPrice;
}
