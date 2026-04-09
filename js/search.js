


window.initSearch = initSearch;


// this function is for initializing the search functionality
function initSearch(onSearchChange) {
  const searchInput = document.getElementById('searchInput');
  if (!searchInput) return;


  let timeout = null;

  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().trim();

    clearTimeout(timeout);
    timeout = setTimeout(() => {

      if (typeof onSearchChange === 'function') {
        onSearchChange(query);
      }
    }, 300); // 300ms delay
  });


  const urlParams = new URLSearchParams(window.location.search);
  const q = urlParams.get('q');
  if (q) {
    searchInput.value = q;

  }
}

