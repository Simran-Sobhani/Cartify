// ══════════════════════════════════════════════
//  STATE
// ══════════════════════════════════════════════
let products         = [];   // all products from API (normalised)
let categories       = [];   // unique category strings extracted from products
let cart             = [];
let wishlist         = new Set();   // liked product IDs
let currentProduct   = null;
let detailQty        = 1;
let maxPrice         = Infinity;
let activeCategories = new Set(['all']); // 'all' = no category filter

// ══════════════════════════════════════════════
//  SKELETON LOADER
// ══════════════════════════════════════════════
function skeletonCard(small = false) {
  const w = small ? 'width:180px;' : '';
  return `<div class="product-card" style="${w}background:var(--surface2);border:none;animation:pulse 1.4s ease infinite alternate;">
    <div style="width:100%;height:200px;background:var(--border);"></div>
    <div class="card-body">
      <div style="height:14px;background:var(--border);border-radius:6px;margin-bottom:8px;width:80%"></div>
      <div style="height:12px;background:var(--border);border-radius:6px;margin-bottom:8px;width:55%"></div>
      <div style="height:16px;background:var(--border);border-radius:6px;width:40%"></div>
    </div>
  </div>`;
}

function showGridSkeleton(containerId, count = 8, small = false) {
  const el = document.getElementById(containerId);
  if (el) el.innerHTML = Array(count).fill(0).map(() => skeletonCard(small)).join('');
}

// ══════════════════════════════════════════════
//  HAMBURGER / MOBILE MENU
// ══════════════════════════════════════════════
function toggleMenu() {
  const hamburger = document.getElementById('hamburger');
  const menu      = document.getElementById('mobile-menu');
  const overlay   = document.getElementById('mobile-overlay');
  const isOpen    = menu.classList.contains('open');
  hamburger.classList.toggle('open', !isOpen);
  menu.classList.toggle('open', !isOpen);
  overlay.classList.toggle('show', !isOpen);
  document.body.style.overflow = isOpen ? '' : 'hidden';
}

function closeMenu() {
  document.getElementById('hamburger').classList.remove('open');
  document.getElementById('mobile-menu').classList.remove('open');
  document.getElementById('mobile-overlay').classList.remove('show');
  document.body.style.overflow = '';
}

// ══════════════════════════════════════════════
//  SIDEBAR TOGGLE (products page, mobile)
// ══════════════════════════════════════════════
function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  const isOpen  = sidebar.classList.contains('open');
  sidebar.classList.toggle('open', !isOpen);
  overlay.classList.toggle('show', !isOpen);
  document.body.style.overflow = isOpen ? '' : 'hidden';
}

// ══════════════════════════════════════════════
//  PAGE NAVIGATION
// ══════════════════════════════════════════════
function showPage(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));

  ['nb-', 'mb-'].forEach(prefix => {
    document.querySelectorAll(`[id^="${prefix}"]`).forEach(b => b.classList.remove('active'));
    const btn = document.getElementById(prefix + page);
    if (btn) btn.classList.add('active');
  });

  document.getElementById('page-' + page).classList.add('active');
  window.scrollTo(0, 0);

  if (page === 'products') {
    if (products.length === 0) showGridSkeleton('products-grid', 8);
    else renderProductsGrid(applyCurrentFilters());
  }
  if (page === 'cart') renderCart();

  closeMenu();
  closeProfileMenu();
  if (page !== 'products') {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    if (sidebar) sidebar.classList.remove('open');
    if (overlay) overlay.classList.remove('show');
    document.body.style.overflow = '';
  }
}

// ══════════════════════════════════════════════
//  PRODUCTS API
//  Single fetch — categories extracted from response
// ══════════════════════════════════════════════
function fetchProducts() {
  showGridSkeleton('home-products', 6);
  showGridSkeleton('products-grid', 8);

  fetch('https://kolzsticks.github.io/Free-Ecommerce-Products-Api/main/products.json')
    .then(r => {
      if (!r.ok) throw new Error('Network error ' + r.status);
      return r.json();
    })
    .then(data => {
      // ── Normalise API shape ──────────────────────────────────────────────
      // Product object shape:
      //   id, image, name, rating: { stars, count }, priceCents,
      //   category, subCategory, keywords[], description
      products = data.map(p => ({
        id:          String(p.id),
        name:        p.name,
        price:       Math.round(p.priceCents / 100),   // pence → rupees (treat as paise)
        rating:      p.rating?.stars  ?? 4.0,
        ratingCount: p.rating?.count  ?? 0,
        brand:       p.subCategory    || p.category || 'Brand',
        category:    p.category       || 'General',    // keep exact casing — filter matches on this
        subCategory: p.subCategory    || '',
        img:         p.image,
        summary:     p.description,
        keywords:    p.keywords       || [],
        sizes:       ['XS', 'S', 'M', 'L', 'XL'],     // API has no size field, use defaults
      }));

      // ── Extract unique categories (sorted A-Z) from the products array ──
      categories = [...new Set(products.map(p => p.category))].sort();

      // ── Price slider: set max to highest product price ──────────────────
      const highest = Math.max(...products.map(p => p.price));
      maxPrice = highest;
      const slider = document.querySelector('.price-range');
      if (slider) {
        slider.max   = highest;
        slider.value = highest;
        document.getElementById('price-label').textContent = `Up to ₹${highest.toLocaleString()}`;
      }

      // ── Build UI ─────────────────────────────────────────────────────────
      buildSidebarCategories();
      buildHomeCategoryChips();
      renderHome();

      if (document.getElementById('page-products').classList.contains('active')) {
        renderProductsGrid(products);
      }
    })
    .catch(err => {
      console.error('Product fetch error:', err);
      ['home-products', 'products-grid'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerHTML =
          `<p style="color:var(--muted);padding:20px;grid-column:1/-1">
             ⚠️ Could not load products. Please check your connection.
           </p>`;
      });
    });
}

// ══════════════════════════════════════════════
//  SIDEBAR CATEGORIES  (built from products)
// ══════════════════════════════════════════════
function buildSidebarCategories() {
  const container = document.getElementById('sidebar-cats');
  if (!container) return;
  container.innerHTML = '';

  // "All" checkbox
  const allItem = makeSidebarCheckbox('cat-all', 'All', 'all', true);
  allItem.querySelector('input').addEventListener('change', function () {
    if (this.checked) {
      container.querySelectorAll('input:not(#cat-all)').forEach(cb => cb.checked = false);
      activeCategories = new Set(['all']);
      applyFilters();
    }
  });
  container.appendChild(allItem);

  // One checkbox per unique category.
  // value = exact category string from API (e.g. "Health & Fitness")
  // applyFilters() compares p.category === value directly — no lowercasing needed
  categories.forEach((catName, i) => {
    const item = makeSidebarCheckbox('cat-' + i, catName, catName, false);
    item.querySelector('input').addEventListener('change', function () {
      document.getElementById('cat-all').checked = false;
      activeCategories = new Set(
        [...container.querySelectorAll('input:not(#cat-all):checked')].map(cb => cb.value)
      );
      if (activeCategories.size === 0) {
        document.getElementById('cat-all').checked = true;
        activeCategories = new Set(['all']);
      }
      applyFilters();
    });
    container.appendChild(item);
  });
}

function makeSidebarCheckbox(id, label, value, checked) {
  const wrap = document.createElement('div');
  wrap.className = 'filter-item';
  wrap.innerHTML = `<input type="checkbox" id="${id}" value="${value}" ${checked ? 'checked' : ''}/>
                    <label for="${id}">${label}</label>`;
  return wrap;
}

// ══════════════════════════════════════════════
//  HOME CATEGORY CHIPS  (built from products)
// ══════════════════════════════════════════════
// Maps API category names → emoji. Falls back to 🏷️ for any unknown category.
const CAT_EMOJI = {
  'Fashion & Apparel'     : '👗',
  'Electronics'           : '📱',
  'Home & Living'         : '🏠',
  'Health & Fitness'      : '💪',
  'Sports & Outdoors'     : '⚽',
  'Beauty & Personal Care': '💄',
  'Books & Stationery'    : '📚',
  'Toys & Games'          : '🎮',
  'Food & Beverages'      : '🍳',
  'Automotive'            : '🚗',
  'Jewelry & Accessories' : '💍',
  'Pet Supplies'          : '🐾',
};

function buildHomeCategoryChips() {
  const grid = document.getElementById('home-cat-grid');
  if (!grid) return;
  grid.innerHTML = '';

  const allChip = makeChip('🛍️', 'All', true);
  allChip.onclick = () => { setActiveChip(allChip); filterCat('all'); };
  grid.appendChild(allChip);

  categories.forEach(catName => {
    const emoji = CAT_EMOJI[catName] || '🏷️';
    const chip  = makeChip(emoji, catName, false);
    chip.onclick = () => { setActiveChip(chip); filterCat(catName); };
    grid.appendChild(chip);
  });
}

function makeChip(emoji, label, active) {
  const div = document.createElement('div');
  div.className = 'cat-chip' + (active ? ' active' : '');
  div.innerHTML = `<span>${emoji}</span> ${label}`;
  return div;
}

function setActiveChip(activeEl) {
  document.querySelectorAll('#home-cat-grid .cat-chip').forEach(c => c.classList.remove('active'));
  activeEl.classList.add('active');
}

// ══════════════════════════════════════════════
//  PRODUCT CARD RENDERER
// ══════════════════════════════════════════════
function makeCard(p, small = false) {
  const r     = Number(p.rating) || 0;
  const stars = '★'.repeat(Math.min(5, Math.round(r))) + '☆'.repeat(Math.max(0, 5 - Math.round(r)));
  // p.id is a string like "50". Use single-quoted string literal inside the
  // double-quoted HTML attribute so the browser parses it correctly.
  const sid   = p.id;
  const liked = wishlist.has(String(p.id));
  const w     = small ? 'width:210px;flex-shrink:0;' : '';

  return `<div class="product-card" style="${w}">
    <button class="wishlist-btn ${liked ? 'liked' : ''}"
            onclick="event.stopPropagation(); toggleWishlist(this, '${sid}')"
            aria-label="Wishlist">
      ${liked ? '♥' : '♡'}
    </button>
    <img src="${p.img}" alt="${p.name}" loading="lazy"
         onerror="this.src='https://via.placeholder.com/400x200?text=No+Image'"
         onclick="openDetail('${sid}')"/>
    <div class="card-body">
      <div class="card-name" title="${p.name}">${p.name}</div>
      <div class="card-rating">${stars} ${r.toFixed(1)}
        <span style="color:var(--muted);font-size:11px">(${p.ratingCount})</span>
      </div>
      <div class="card-price">₹${p.price.toLocaleString()}</div>
      <div class="card-actions">
        <button class="card-btn" onclick="addToCart('${sid}')">Add</button>
        <button class="card-btn fill" onclick="openDetail('${sid}')">View</button>
      </div>
    </div>
  </div>`;
}

// Toggle wishlist heart
function toggleWishlist(btn, id) {
  const sid = String(id);
  if (wishlist.has(sid)) {
    wishlist.delete(sid);
    btn.classList.remove('liked');
    btn.textContent = '♡';
    showToast('Removed from wishlist');
  } else {
    wishlist.add(sid);
    btn.classList.add('liked');
    btn.textContent = '♥';
    showToast('Added to wishlist ♥');
  }
}

// ══════════════════════════════════════════════
//  HOME
// ══════════════════════════════════════════════
function renderHome() {
  const el = document.getElementById('home-products');
  if (!el) return;
  el.innerHTML = products.slice(0, 6).map(p => makeCard(p)).join('');
}

// ══════════════════════════════════════════════
//  PRODUCTS GRID
// ══════════════════════════════════════════════
function renderProductsGrid(list) {
  const sortVal = document.querySelector('.sort-select')?.value || 'default';
  const sorted  = sortProducts(list, sortVal);
  const grid    = document.getElementById('products-grid');
  if (!grid) return;
  grid.innerHTML = sorted.length
    ? sorted.map(p => makeCard(p)).join('')
    : `<p style="color:var(--muted);padding:20px 0;grid-column:1/-1">No products match your filters.</p>`;
  document.getElementById('product-count').textContent =
    `Showing ${sorted.length} product${sorted.length !== 1 ? 's' : ''}`;
}

function sortProducts(list, method) {
  const arr = [...list];
  if (method === 'price-asc')  arr.sort((a, b) => a.price - b.price);
  if (method === 'price-desc') arr.sort((a, b) => b.price - a.price);
  if (method === 'rating')     arr.sort((a, b) => b.rating - a.rating);
  return arr;
}

// ══════════════════════════════════════════════
//  FILTERS
// ══════════════════════════════════════════════

// Returns the filtered list based on current activeCategories + maxPrice
function applyCurrentFilters() {
  let filtered = activeCategories.has('all')
    ? [...products]
    // Exact match on p.category — the API uses consistent Title Case so no lowercasing needed
    : products.filter(p => activeCategories.has(p.category));
  return filtered.filter(p => p.price <= maxPrice);
}

function applyFilters() {
  renderProductsGrid(applyCurrentFilters());
}

function updatePrice(val) {
  maxPrice = Number(val);
  document.getElementById('price-label').textContent = `Up to ₹${Number(val).toLocaleString()}`;
  applyFilters();
}

// Sidebar category search — hides non-matching labels visually
function filterSidebarSearch(val) {
  const q = val.toLowerCase().trim();
  document.querySelectorAll('#sidebar-cats .filter-item').forEach(item => {
    const label = item.querySelector('label')?.textContent.toLowerCase() || '';
    item.style.display = (!q || label.includes(q)) ? '' : 'none';
  });
}

// Called from home-page category chips
// catName is the exact API category string, e.g. "Health & Fitness", or 'all'
function filterCat(catName) {
  showPage('products');
  setTimeout(() => {
    const container = document.getElementById('sidebar-cats');
    if (!container) return;
    container.querySelectorAll('input[type=checkbox]').forEach(cb => cb.checked = false);
    if (catName === 'all') {
      const allCb = document.getElementById('cat-all');
      if (allCb) allCb.checked = true;
      activeCategories = new Set(['all']);
    } else {
      // Find the checkbox whose value exactly matches the category name
      const match = [...container.querySelectorAll('input:not(#cat-all)')]
        .find(cb => cb.value === catName);
      if (match) match.checked = true;
      activeCategories = new Set([catName]);
    }
    applyFilters();
  }, 0);
}

// Live search from navbar — searches name, category, subCategory, and keywords
function liveSearch(val) {
  const q = val.trim().toLowerCase();
  if (!document.getElementById('page-products').classList.contains('active')) {
    showPage('products');
  }
  if (!q) { renderProductsGrid(products); return; }
  renderProductsGrid(products.filter(p =>
    p.name.toLowerCase().includes(q) ||
    p.category.toLowerCase().includes(q) ||
    p.subCategory.toLowerCase().includes(q) ||
    p.keywords.some(k => k.toLowerCase().includes(q))
  ));
}

// ══════════════════════════════════════════════
//  PRODUCT DETAIL
// ══════════════════════════════════════════════
function openDetail(id) {
  currentProduct = products.find(p => p.id === String(id));
  if (!currentProduct) return;
  detailQty = 1;

  document.getElementById('detail-img').src = currentProduct.img;
  document.getElementById('detail-brand').textContent =
    currentProduct.subCategory
      ? `${currentProduct.subCategory} · ${currentProduct.category}`
      : currentProduct.category;
  document.getElementById('detail-name').textContent  = currentProduct.name;
  document.getElementById('detail-price').textContent = `₹${currentProduct.price.toLocaleString()}`;

  const r = Number(currentProduct.rating) || 0;
  document.getElementById('detail-stars').textContent =
    '★'.repeat(Math.min(5, Math.round(r))) + '☆'.repeat(Math.max(0, 5 - Math.round(r)));
  document.getElementById('detail-rating-text').textContent =
    `${r.toFixed(1)} · ${currentProduct.ratingCount} reviews`;

  document.getElementById('detail-summary').textContent = currentProduct.summary;
  document.getElementById('qty-val').textContent = 1;

  // Sizes
  const sizeRow = document.querySelector('.size-row');
  if (sizeRow) {
    sizeRow.innerHTML = (currentProduct.sizes || ['S','M','L','XL'])
      .map((s, i) => `<button class="size-btn ${i === 0 ? 'active' : ''}" onclick="selectSize(this)">${s}</button>`)
      .join('');
  }

  // "More like this" — same category first, then others
  const others  = products.filter(p => p.id !== currentProduct.id);
  const sameCat = others.filter(p => p.category === currentProduct.category);
  const rest    = others.filter(p => p.category !== currentProduct.category);
  document.getElementById('more-products').innerHTML =
    [...sameCat, ...rest].slice(0, 8).map(p => makeCard(p, true)).join('');

  showPage('detail');
}

function selectSize(btn) {
  document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}

function changeQty(d) {
  detailQty = Math.max(1, detailQty + d);
  document.getElementById('qty-val').textContent = detailQty;
}

function addCurrentToCart() {
  if (currentProduct) addToCart(currentProduct.id, detailQty);
}

// Carousel scroll
function scrollMore(dir) {
  const track = document.getElementById('more-products');
  if (track) track.scrollLeft += dir * 260;
}

// ══════════════════════════════════════════════
//  CART
// ══════════════════════════════════════════════
function addToCart(id, qty = 1) {
  const p = products.find(x => x.id === String(id));
  if (!p) return;
  const existing = cart.find(x => x.id === p.id);
  if (existing) existing.qty += qty;
  else cart.push({ ...p, qty });
  updateCartBadge();
  showToast('Added: ' + truncate(p.name, 28));
}

function removeFromCart(id) {
  cart = cart.filter(x => x.id !== String(id));
  updateCartBadge();
  renderCart();
}

function changeCartQty(id, delta) {
  const item = cart.find(x => x.id === String(id));
  if (!item) return;
  item.qty = Math.max(1, item.qty + delta);
  renderCart();
  updateCartBadge();
}

function updateCartBadge() {
  const total = cart.reduce((s, x) => s + x.qty, 0);
  ['cart-badge', 'cart-badge-mobile'].forEach(bid => {
    const badge = document.getElementById(bid);
    if (badge) {
      badge.textContent   = total;
      badge.style.display = total > 0 ? 'flex' : 'none';
    }
  });
}

function renderCart() {
  const empty  = document.getElementById('cart-empty');
  const filled = document.getElementById('cart-filled');
  if (cart.length === 0) {
    empty.style.display  = 'block';
    filled.style.display = 'none';
    return;
  }
  empty.style.display  = 'none';
  filled.style.display = 'block';

  document.getElementById('cart-items-list').innerHTML = cart.map(item => `
    <div class="cart-item">
      <img src="${item.img}" alt="${item.name}"
           onerror="this.src='https://via.placeholder.com/80?text=Img'"/>
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-meta">${item.category} · Size: M</div>
        <div class="cart-item-price">₹${(item.price * item.qty).toLocaleString()}</div>
        <div class="cart-qty-row">
          <button class="cart-qty-btn" onclick="changeCartQty('${item.id}', -1)">−</button>
          <span class="cart-qty-num">${item.qty}</span>
          <button class="cart-qty-btn" onclick="changeCartQty('${item.id}', 1)">+</button>
        </div>
      </div>
      <div class="cart-item-right">
        <button class="remove-btn" onclick="removeFromCart('${item.id}')">✕ Remove</button>
        <button class="view-details-btn" onclick="openDetail('${item.id}')">View Details →</button>
      </div>
    </div>`).join('');

  const sub  = cart.reduce((s, x) => s + x.price * x.qty, 0);
  const disc = Math.round(sub * 0.10);
  document.getElementById('sum-sub').textContent   = `₹${sub.toLocaleString()}`;
  document.getElementById('sum-disc').textContent  = `−₹${disc.toLocaleString()}`;
  document.getElementById('sum-total').textContent = `₹${(sub - disc).toLocaleString()}`;
}

// ══════════════════════════════════════════════
//  FAQ
// ══════════════════════════════════════════════
function toggleFaq(el) {
  const ans  = el.nextElementSibling;
  const icon = el.querySelector('span');
  ans.classList.toggle('open');
  icon.textContent = ans.classList.contains('open') ? '−' : '+';
}

// ══════════════════════════════════════════════
//  TOAST
// ══════════════════════════════════════════════
let toastTimer;
function showToast(msg) {
  const t = document.getElementById('toast');
  document.getElementById('toast-msg').textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2800);
}

// ══════════════════════════════════════════════
//  UTILS
// ══════════════════════════════════════════════
function cap(str) {
  return (str || '').replace(/\b\w/g, c => c.toUpperCase());
}
function truncate(str, len) {
  return str.length > len ? str.slice(0, len) + '…' : str;
}

// ══════════════════════════════════════════════
//  THEME TOGGLE
// ══════════════════════════════════════════════
let isDark = false;

function toggleTheme() {
  isDark = !isDark;
  document.body.classList.add('dark-transitioning');
  document.body.classList.toggle('dark', isDark);
  updateThemeUI();
  localStorage.setItem('cartify-theme', isDark ? 'dark' : 'light');
  setTimeout(() => document.body.classList.remove('dark-transitioning'), 350);
}

function updateThemeUI() {
  const icon   = document.getElementById('theme-icon');
  const label  = document.getElementById('theme-label');
  const mIcon  = document.getElementById('mobile-theme-icon');
  const mLabel = document.getElementById('mobile-theme-label');

  if (isDark) {
    if (icon)  icon.innerHTML   = `<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>`;
    if (label)  label.textContent  = 'Dark Mode';
    if (mIcon)  mIcon.textContent  = '🌙';
    if (mLabel) mLabel.textContent = 'Dark Mode';
  } else {
    if (icon) icon.innerHTML = `
      <circle cx="12" cy="12" r="5"/>
      <line x1="12" y1="1" x2="12" y2="3"/>
      <line x1="12" y1="21" x2="12" y2="23"/>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="1" y1="12" x2="3" y2="12"/>
      <line x1="21" y1="12" x2="23" y2="12"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>`;
    if (label)  label.textContent  = 'Light Mode';
    if (mIcon)  mIcon.textContent  = '☀️';
    if (mLabel) mLabel.textContent = 'Light Mode';
  }
}

// Restore saved theme before first paint
(function initTheme() {
  if (localStorage.getItem('cartify-theme') === 'dark') {
    isDark = true;
    document.body.classList.add('dark');
  }
})();

document.addEventListener('DOMContentLoaded', () => {
  updateThemeUI();
});

// ══════════════════════════════════════════════
//  PROFILE DROPDOWN
// ══════════════════════════════════════════════
function toggleProfileMenu(e) {
  e.stopPropagation();
  const dropdown = document.getElementById('profile-dropdown');
  const isOpen   = dropdown.classList.contains('open');
  closeMenu();
  dropdown.classList.toggle('open', !isOpen);
}

function closeProfileMenu() {
  const dropdown = document.getElementById('profile-dropdown');
  if (dropdown) dropdown.classList.remove('open');
}

// Click outside → close profile dropdown
document.addEventListener('click', (e) => {
  const wrap = document.querySelector('.profile-wrap');
  if (wrap && !wrap.contains(e.target)) closeProfileMenu();
});

// ══════════════════════════════════════════════
//  INIT — single API call, categories come from it
// ══════════════════════════════════════════════
fetchProducts();