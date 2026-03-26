/* filters.js - Product filtering and sorting logic */

// Expose main init function
window.initProducts = initProducts;

let filteredProducts = [];

function initProducts() {
  const grid = document.getElementById('productGrid');
  if (!grid) return;

  // 1. Initial Render (with default data)
  filteredProducts = [...productsData];
  
  // 2. Setup Filter Inputs
  const brandCheckboxes = document.querySelectorAll('.brand-filter');
  const priceRange = document.getElementById('priceRange');
  const sortSelect = document.getElementById('sortSelect');
  const clearBtn = document.getElementById('clearFilters');
  const searchInput = document.getElementById('searchInput');

  // Load params from URL (e.g., if clicked from suppliers page)
  const urlParams = new URLSearchParams(window.location.search);
  const initialBrand = urlParams.get('brand');
  if (initialBrand) {
    const cb = document.querySelector(`.brand-filter[value="${initialBrand}"]`);
    if (cb) cb.checked = true;
  }
  
  const initialQuery = urlParams.get('q');
  if (initialQuery && searchInput) {
    searchInput.value = initialQuery;
  }

  // 3. Attach Listeners
  brandCheckboxes.forEach(cb => cb.addEventListener('change', runFilters));
  
  if (priceRange) {
    const priceDisplay = document.getElementById('priceDisplay');
    priceRange.addEventListener('input', (e) => {
      priceDisplay.innerText = `₱${parseInt(e.target.value).toLocaleString('en-US')}`;
    });
    priceRange.addEventListener('change', runFilters);
  }

  if (sortSelect) {
    sortSelect.addEventListener('change', runFilters);
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      brandCheckboxes.forEach(cb => cb.checked = false);
      if (priceRange) {
        priceRange.value = 2000;
        document.getElementById('priceDisplay').innerText = `₱2,000`;
      }
      if (searchInput) searchInput.value = '';
      if (sortSelect) sortSelect.value = 'default';
      
      // Remove URL params cleanly without reload
      window.history.replaceState({}, '', 'products.html');
      runFilters();
    });
  }

  // 4. Initialize Search logic (from search.js)
  if (window.initSearch) {
    window.initSearch(runFilters);
  }

  // 5. Run first pass
  runFilters();
}

function runFilters() {
  const grid = document.getElementById('productGrid');
  const countDisplay = document.getElementById('resultCount');
  
  // Get active filters
  const selectedBrands = Array.from(document.querySelectorAll('.brand-filter:checked')).map(cb => cb.value);
  
  const priceRangeEl = document.getElementById('priceRange');
  const maxPrice = priceRangeEl ? parseInt(priceRangeEl.value) : 999999;
  
  const searchInput = document.getElementById('searchInput');
  const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
  
  const sortVal = document.getElementById('sortSelect')?.value || 'default';

  // Apply Filters
  filteredProducts = productsData.filter(product => {
    const priceNum = parseFloat(product.price.replace(/[^0-9.]/g, ''));
    
    // Brand Check
    const matchBrand = selectedBrands.length === 0 || selectedBrands.includes(product.brand);
    
    // Price Check
    const matchPrice = priceNum <= maxPrice;
    
    // Search Check (Name, description, or brand)
    const matchSearch = query === '' 
      || product.name.toLowerCase().includes(query) 
      || product.brand.toLowerCase().includes(query)
      || product.description.toLowerCase().includes(query);

    return matchBrand && matchPrice && matchSearch;
  });

  // Apply Sorting
  if (sortVal === 'price-low') {
    filteredProducts.sort((a, b) => parseFloat(a.price.replace(/[^0-9.]/g, '')) - parseFloat(b.price.replace(/[^0-9.]/g, '')));
  } else if (sortVal === 'price-high') {
    filteredProducts.sort((a, b) => parseFloat(b.price.replace(/[^0-9.]/g, '')) - parseFloat(a.price.replace(/[^0-9.]/g, '')));
  } else if (sortVal === 'name-az') {
    filteredProducts.sort((a, b) => a.name.localeCompare(b.name));
  } else if (sortVal === 'name-za') {
    filteredProducts.sort((a, b) => b.name.localeCompare(a.name));
  } else {
    // Default: Sort by brand name simply to group them (or leave original JSON order)
    // Here we'll just sort by original array order by mapping index
    const sortedMap = new Map(productsData.map((p, i) => [p.name, i]));
    filteredProducts.sort((a, b) => sortedMap.get(a.name) - sortedMap.get(b.name));
  }

  // Generate HTML
  if (filteredProducts.length === 0) {
    grid.innerHTML = `
      <div class="col-12 text-center py-5">
        <i class="bi bi-search" style="font-size:3rem;color:var(--border-light)"></i>
        <h4 class="mt-3">No products found</h4>
        <p class="text-secondary">Try adjusting your filters or search query.</p>
        <button class="btn btn-outline-mcebu mt-2" onclick="document.getElementById('clearFilters').click()">Clear All Filters</button>
      </div>
    `;
    if (countDisplay) countDisplay.innerText = `0 results found`;
  } else {
    // We need to keep the original index so `addToCart(index)` works correctly
    // Since filteredProducts creates a new array, the loop index won't match original productID
    grid.innerHTML = filteredProducts.map(product => {
      // Find original index
      const originalIndex = productsData.findIndex(p => p.name === product.name);
      return typeof generateProductCard === 'function' ? generateProductCard(product, originalIndex) : '';
    }).join('');
    
    if (countDisplay) countDisplay.innerText = `Showing ${filteredProducts.length} results`;
  }
}
