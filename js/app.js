/* app.js - Core application logic */

let productsData = [];

// Global Toast function
window.showToast = function(msg) {
  const toast = document.getElementById('toastNotif');
  const msgEl = document.getElementById('toastMsg');
  if(!toast || !msgEl) return;
  msgEl.innerText = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
};

// Navbar Scroll Effect
window.addEventListener('scroll', () => {
  const nav = document.getElementById('mainNav');
  if(nav) {
    if(window.scrollY > 20) nav.classList.add('scrolled');
    else nav.classList.remove('scrolled');
  }
});

// Load products
async function fetchProducts() {
  try {
    const res = await fetch('../data/products.json');
    if(!res.ok) throw new Error('Failed to load products');
    productsData = await res.json();

    // Decrease stock based on local purchases
    const purchases = JSON.parse(localStorage.getItem('mcebu_purchases')) || {};
    productsData.forEach((product, idx) => {
      if (purchases[idx]) {
        product.stock = Math.max(0, product.stock - purchases[idx]);
      }
    });

    initPage();
  } catch (error) {
    console.error('Error fetching products:', error);
    alert('Products could not be loaded. Please ensure you are running this through a web server (like Live Server in VS Code) and not just opening the file directly.');
  }
}

// Generate a product card HTML
function generateProductCard(product, index) {
  // Use index as ID if no ID provided in JSON
  const productId = index; 
  
  let stockBadge = '';
  if (product.stock > 20) {
    stockBadge = `<span class="badge-stock badge-in-stock">In Stock</span>`;
  } else if (product.stock > 0) {
    stockBadge = `<span class="badge-stock badge-low-stock">Low Stock: ${product.stock} left</span>`;
  } else {
    stockBadge = `<span class="badge-stock badge-out-stock">Out of Stock</span>`;
  }

  let priceHTML = `₱${parseFloat(product.price.replace(/[^0-9.]/g, '')).toLocaleString('en-US', {minimumFractionDigits: 2})}`;
  if (product.originalPrice) {
    priceHTML += ` <span class="original-price">₱${parseFloat(product.originalPrice.replace(/[^0-9.]/g, '')).toLocaleString('en-US', {minimumFractionDigits: 2})}</span>`;
    stockBadge = `<span class="badge-stock badge-low-stock" style="background:var(--accent);color:#fff">SALE</span> ` + stockBadge;
  }

  return `
    <div class="col-sm-6 col-lg-4 d-flex align-items-stretch">
      <div class="product-card w-100">
        <a href="product-details.html?id=${productId}">
          <div class="product-card-img-wrap">
            ${stockBadge}
            <img src="${product.image}" alt="${product.name}" class="product-card-img" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&q=80'">
          </div>
        </a>
        <div class="product-card-body">
          <div class="product-card-brand">${product.brand}</div>
          <a href="product-details.html?id=${productId}"><h3 class="product-card-name">${product.name}</h3></a>
          <div class="product-card-price">${priceHTML}</div>
          <button class="btn btn-add-cart w-100 mt-auto" onclick="addToCart(${productId}, 1)" ${product.stock === 0 ? 'disabled' : ''}>
            <i class="bi bi-cart-plus-fill me-2"></i>${product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
          </button>
        </div>
      </div>
    </div>
  `;
}

// Initialize Active Page
function initPage() {
  const path = window.location.pathname;

  if (path.includes('index.html') || path.endsWith('/')) {
    initHome();
  } else if (path.includes('products.html')) {
    if(window.initProducts) window.initProducts(); // defined in filters.js/search.js
  } else if (path.includes('product-details.html')) {
    initProductDetail();
  } else if (path.includes('checkout.html')) {
    initCheckout();
  }

  // Global Cart initialization
  if(window.initCartSystem) window.initCartSystem();
}

function initHome() {
  const featuredContainer = document.getElementById('featuredProducts');
  if(!featuredContainer) return;

  // Grab the 6 most recently added products
  let featuredHTML = '';
  const total = productsData.length;
  for (let i = total - 1; i >= Math.max(0, total - 6); i--) {
    featuredHTML += generateProductCard(productsData[i], i);
  }
  featuredContainer.innerHTML = featuredHTML;
}

function initProductDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const productId = parseInt(urlParams.get('id'));
  
  if (isNaN(productId) || productId < 0 || productId >= productsData.length) {
    document.getElementById('productDetail').innerHTML = `<div class="col-12 text-center py-5"><h3>Product not found.</h3><a href="products.html" class="btn btn-primary-mcebu mt-3">Back to Shop</a></div>`;
    return;
  }

  const product = productsData[productId];
  
  document.title = `${product.name} — MadeInUbec`;
  document.getElementById('breadcrumbName').innerText = product.name;
  
  const imgEl = document.getElementById('detailImg');
  imgEl.src = product.image;
  imgEl.onerror = () => { imgEl.src = 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80'; };
  
  document.getElementById('detailBrand').innerText = product.brand;
  document.getElementById('detailName').innerText = product.name;
  
  // Price formatting
  let priceHTML = `₱${parseFloat(product.price.replace(/[^0-9.]/g, '')).toLocaleString('en-US', {minimumFractionDigits: 2})}`;
  if (product.originalPrice) {
    priceHTML += ` <span class="original-price ms-2" style="font-size:1.2rem">₱${parseFloat(product.originalPrice.replace(/[^0-9.]/g, '')).toLocaleString('en-US', {minimumFractionDigits: 2})}</span>`;
  }
  document.getElementById('detailPrice').innerHTML = priceHTML;
  document.getElementById('detailDesc').innerText = product.description;


  // Stock badge
  let stockBadge = '';
  if (product.stock > 20) {
    stockBadge = `<span class="badge" style="background:rgba(34,197,94,0.15);color:var(--success)">In Stock</span>`;
  } else if (product.stock > 0) {
    stockBadge = `<span class="badge" style="background:rgba(245,166,35,0.15);color:var(--warning)">Low Stock: ${product.stock} left</span>`;
  } else {
    stockBadge = `<span class="badge" style="background:rgba(239,68,68,0.15);color:var(--danger)">Out of Stock</span>`;
    document.getElementById('detailAddCart').disabled = true;
    document.getElementById('detailAddCart').innerHTML = 'Out of Stock';
  }
  document.getElementById('detailStockBadge').innerHTML = stockBadge;

  // Size Selector
  let selectedSize = '';
  const sizes = product.details.sizes || [];
  if (sizes.length > 0) {
    const sizeContainer = document.getElementById('sizeButtons');
    sizes.forEach((size, i) => {
      const btn = document.createElement('button');
      btn.className = `size-btn ${i === 0 ? 'active' : ''}`;
      btn.innerText = size;
      if (i === 0) selectedSize = size;
      
      btn.onclick = () => {
        document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedSize = size;
      };
      sizeContainer.appendChild(btn);
    });
  } else {
    document.getElementById('sizeWrap').style.display = 'none';
  }

  // Add to Cart Action
  document.getElementById('detailAddCart').onclick = () => {
    if(window.addToCart) {
      window.addToCart(productId, 1, selectedSize);
    }
  };

  // Specs List
  const specsDl = document.getElementById('detailSpecs');
  if (product.details) {
    for (const [key, val] of Object.entries(product.details)) {
      if (key === 'sizes' || key === 'features') continue; // Handled separately or skipped
      
      let formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
      let value = Array.isArray(val) ? val.join(', ') : val;
      
      specsDl.innerHTML += `
        <div class="row mb-2 pb-2" style="border-bottom:1px solid var(--border-color)">
          <dt class="col-sm-4">${formattedKey}</dt>
          <dd class="col-sm-8 mb-0">${value}</dd>
        </div>
      `;
    }
    
    if (product.details.features && Array.isArray(product.details.features)) {
      specsDl.innerHTML += `
        <div class="row mt-3">
          <dt class="col-12 mb-2">Features</dt>
          <dd class="col-12">
            <ul style="padding-left:20px;color:var(--text-secondary)">
              ${product.details.features.map(f => `<li>${f}</li>`).join('')}
            </ul>
          </dd>
        </div>
      `;
    }
  }

  // Reviews Loading
  loadReviews(productId);
}

function loadReviews(productId) {
  const reviewsList = document.getElementById('reviewsList');
  const reviewsJSON = localStorage.getItem(`mcebu_reviews_${productId}`);
  let reviews = [];

  if (reviewsJSON) {
    reviews = JSON.parse(reviewsJSON);
  } else {
    // Generate dummy review if empty
    reviews = [{
      name: "Alex M.",
      rating: 5,
      date: "Oct 12, 2025",
      text: "Material feels really premium and fits exactly as expected. Highly recommend this piece."
    }];
  }

  renderReviews(reviews, reviewsList);

  // Review Form Submit
  const form = document.getElementById('reviewForm');
  if(form) {
    form.onsubmit = (e) => {
      e.preventDefault();
      const nName = document.getElementById('reviewName').value;
      const nRating = parseInt(document.getElementById('reviewRating').value);
      const nText = document.getElementById('reviewText').value;

      reviews.unshift({
        name: nName,
        rating: nRating,
        date: new Date().toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'}),
        text: nText
      });

      localStorage.setItem(`mcebu_reviews_${productId}`, JSON.stringify(reviews));
      renderReviews(reviews, reviewsList);
      form.reset();
      showToast('Review submitted successfully!');
    };
  }
}

function renderReviews(reviews, container) {
  if (reviews.length === 0) {
    container.innerHTML = `<p class="text-secondary">No reviews yet. Be the first to review!</p>`;
    return;
  }
  
  container.innerHTML = reviews.map(r => {
    let stars = '';
    for(let i=0; i<5; i++) stars += i < r.rating ? '★' : '☆';
    
    return `
      <div class="review-card">
        <div class="d-flex justify-content-between mb-2">
          <span class="review-author">${r.name}</span>
          <span class="review-date">${r.date}</span>
        </div>
        <div class="review-stars">${stars}</div>
        <div class="review-text">${r.text}</div>
      </div>
    `;
  }).join('');
}


// Start application
document.addEventListener('DOMContentLoaded', fetchProducts);


