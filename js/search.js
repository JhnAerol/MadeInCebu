/* search.js - Handles Realtime Product Searching */

// Expose globally so it can be called alongside filters
window.initSearch = initSearch;

function initSearch(onSearchChange) {
  const searchInput = document.getElementById('searchInput');
  if (!searchInput) return;

  // Simple Debounce function to prevent rapid re-rendering
  let timeout = null;
  
  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().trim();
    
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      // Call the callback function provided (usually runFilters() in filters.js)
      if (typeof onSearchChange === 'function') {
        onSearchChange(query);
      }
    }, 300); // 300ms delay
  });

  // Check URL params for pre-filled search (e.g., from homepage)
  const urlParams = new URLSearchParams(window.location.search);
  const q = urlParams.get('q');
  if (q) {
    searchInput.value = q;
    // We don't trigger onSearchChange here directly, products.js will handle initial load
  }
}
