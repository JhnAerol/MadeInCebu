

let productsData = [];


window.showToast = function (msg) {
  const toast = document.getElementById('toastNotif');
  const msgEl = document.getElementById('toastMsg');
  if (!toast || !msgEl) return;
  msgEl.innerText = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
};


window.addEventListener('scroll', () => {
  const nav = document.getElementById('mainNav');
  if (nav) {
    if (window.scrollY > 20) nav.classList.add('scrolled');
    else nav.classList.remove('scrolled');
  }
});

async function fetchProducts() {
  showSkeletons();
  try {
    await new Promise(resolve => setTimeout(resolve, 2000));

    if (window.productsData && window.productsData.length > 0) {
      productsData = window.productsData;
    } else {
      const res = await fetch('../data/products.json');
      if (!res.ok) throw new Error('Failed to load products');
      productsData = await res.json();
    }


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


function generateProductCard(product, index) {

  const productId = index;

  let stockBadge = '';
  if (product.stock > 20) {
    stockBadge = `<span class="badge-stock badge-in-stock">In Stock</span>`;
  } else if (product.stock > 0) {
    stockBadge = `<span class="badge-stock badge-low-stock">Low Stock: ${product.stock} left</span>`;
  } else {
    stockBadge = `<span class="badge-stock badge-out-stock">Out of Stock</span>`;
  }

  let priceHTML = `₱${parseFloat(product.price.replace(/[^0-9.]/g, '')).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  if (product.originalPrice) {
    priceHTML += ` <span class="original-price">₱${parseFloat(product.originalPrice.replace(/[^0-9.]/g, '')).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>`;
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


function generateSkeletonCard() {
  return `
    <div class="col-sm-6 col-lg-4 d-flex align-items-stretch">
      <div class="product-card w-100 border-0" style="background:transparent shadow:none">
        <div class="skeleton skeleton-img"></div>
        <div class="product-card-body p-0">
          <div class="skeleton skeleton-text short"></div>
          <div class="skeleton skeleton-text medium"></div>
          <div class="skeleton skeleton-text short"></div>
          <div class="skeleton skeleton-btn"></div>
        </div>
      </div>
    </div>
  `;
}


function generateDetailSkeleton() {
  return `
    <div class="col-lg-6">
      <div class="skeleton skeleton-img" style="aspect-ratio: 1; height: auto;"></div>
    </div>
    <div class="col-lg-6">
      <div class="skeleton skeleton-text short" style="height: 20px; width: 30%; margin-bottom: 15px;"></div>
      <div class="skeleton skeleton-text" style="height: 48px; margin-bottom: 20px;"></div>
      <div class="skeleton skeleton-text medium" style="height: 32px; margin-bottom: 30px;"></div>
      <div class="skeleton skeleton-text" style="height: 100px; margin-bottom: 30px;"></div>
      <div class="d-flex gap-2 mb-4">
        <div class="skeleton" style="width: 60px; height: 40px; border-radius: 8px;"></div>
        <div class="skeleton" style="width: 60px; height: 40px; border-radius: 8px;"></div>
        <div class="skeleton" style="width: 60px; height: 40px; border-radius: 8px;"></div>
      </div>
      <div class="skeleton skeleton-btn" style="height: 56px;"></div>
    </div>
  `;
}


function initPage() {
  const path = window.location.pathname;

  if (path.includes('index.html') || path.endsWith('/')) {
    initHome();
  } else if (path.includes('products.html')) {
    if (window.initProducts) window.initProducts(); // defined in filters.js/search.js
  } else if (path.includes('product-details.html')) {
    initProductDetail();
  } else if (path.includes('checkout.html')) {
    initCheckout();
  }


  if (window.initCartSystem) window.initCartSystem();
}

function showSkeletons() {
  const featured = document.getElementById('featuredProducts');
  const grid = document.getElementById('productGrid');
  const detail = document.getElementById('productDetail');

  const skeletonHTML = Array(6).fill(generateSkeletonCard()).join('');

  if (featured) featured.innerHTML = skeletonHTML;
  if (grid) {
    grid.innerHTML = skeletonHTML;
    const resultCount = document.getElementById('resultCount');
    if (resultCount) resultCount.innerText = 'Searching for finest products...';
  }
  if (detail) {
    detail.innerHTML = generateDetailSkeleton();
  }
}

function initHome() {
  const featuredContainer = document.getElementById('featuredProducts');
  if (!featuredContainer) return;


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

  const detailContainer = document.getElementById('productDetail');
  if (!detailContainer) return;

  if (isNaN(productId) || productId < 0 || productId >= productsData.length) {
    detailContainer.innerHTML = `<div class="col-12 text-center py-5"><h3>Product not found.</h3><a href="products.html" class="btn btn-primary-mcebu mt-3">Back to Shop</a></div>`;
    return;
  }

  const product = productsData[productId];


  detailContainer.innerHTML = `
    <div class="col-lg-6">
      <img src="" alt="" class="detail-img" id="detailImg">
    </div>
    <div class="col-lg-6">
      <span class="detail-brand" id="detailBrand"></span>
      <h1 class="detail-name" id="detailName"></h1>
      <div class="detail-price" id="detailPrice"></div>
      <div id="detailStockBadge" class="mt-2"></div>
      <p class="detail-desc" id="detailDesc"></p>
      <div class="mb-3" id="sizeWrap">
        <label class="form-label-dark">Select Size</label>
        <div class="d-flex gap-2 flex-wrap" id="sizeButtons"></div>
      </div>
      <dl class="detail-specs" id="detailSpecs"></dl>
      <button class="btn btn-primary-mcebu w-100 mt-3" id="detailAddCart" style="padding:16px">
        <i class="bi bi-basket2-fill me-2"></i>Add to Yellow Basket
      </button>
    </div>
  `;

  document.title = `${product.name} — MadeInUbec`;
  document.getElementById('breadcrumbName').innerText = product.name;

  const imgEl = document.getElementById('detailImg');
  imgEl.src = product.image;
  imgEl.alt = product.name;
  imgEl.onerror = () => { imgEl.src = 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80'; };

  document.getElementById('detailBrand').innerText = product.brand;
  document.getElementById('detailName').innerText = product.name;


  let priceHTML = `₱${parseFloat(product.price.replace(/[^0-9.]/g, '')).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  if (product.originalPrice) {
    priceHTML += ` <span class="original-price ms-2" style="font-size:1.2rem">₱${parseFloat(product.originalPrice.replace(/[^0-9.]/g, '')).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>`;
  }
  document.getElementById('detailPrice').innerHTML = priceHTML;
  document.getElementById('detailDesc').innerText = product.description;


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


  document.getElementById('detailAddCart').onclick = () => {
    if (window.addToCart) {
      window.addToCart(productId, 1, selectedSize);
    }
  };


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


  loadReviews(productId);
}

function loadReviews(productId) {
  const reviewsList = document.getElementById('reviewsList');
  const reviewsJSON = localStorage.getItem(`mcebu_reviews_${productId}`);
  let reviews = [];

  if (reviewsJSON) {
    reviews = JSON.parse(reviewsJSON);
  } else {

    reviews = [{
      name: "Alex M.",
      rating: 5,
      date: "Oct 12, 2025",
      text: "Material feels really premium and fits exactly as expected. Highly recommend this piece."
    }];
  }

  renderReviews(reviews, reviewsList);


  const form = document.getElementById('reviewForm');
  if (form) {
    form.onsubmit = (e) => {
      e.preventDefault();
      const nName = document.getElementById('reviewName').value;
      const nRating = parseInt(document.getElementById('reviewRating').value);
      const nText = document.getElementById('reviewText').value;

      reviews.unshift({
        name: nName,
        rating: nRating,
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
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
    for (let i = 0; i < 5; i++) stars += i < r.rating ? '★' : '☆';

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



document.addEventListener('DOMContentLoaded', fetchProducts);



