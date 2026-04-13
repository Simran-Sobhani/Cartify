# 🛒 Cartify

**A modern, fully responsive e-commerce web app built with vanilla HTML, CSS, and JavaScript.**

🌐 **Live Site:** [https://cartify013.netlify.app/](https://cartify013.netlify.app/)

---

## 📸 Overview

Cartify is a feature-rich front-end e-commerce application that fetches real product data from a public API, supports category filtering, cart management, dark/light theming, and is fully responsive across all screen sizes — all without any frameworks or build tools.

---

## ✨ Features

### 🏠 Home Page
- Hero banner with a call-to-action
- "Why Shop With Us" section with feature highlights
- Featured deal / sale banner
- Dynamic category chips built from live API data
- New products grid (first 6 products from the API)

### 🛍️ Products Page
- Full product grid fetched from the API
- **Sidebar filter** — filter by category (checkboxes built dynamically from product data) and price range (slider auto-sets max from API)
- **Sort** — Featured, Price Low→High, Price High→Low, Rating
- **Live search** from the navbar — searches name, category, sub-category, and keywords
- Skeleton loading cards shown while data fetches
- Mobile: slide-in filter sidebar with overlay

### 📄 Product Detail Page
- Product image, name, brand, category, price, star rating and review count
- Size selector (XS / S / M / L / XL)
- Quantity picker (+ / −)
- Add to Cart and Buy Now buttons
- Review breakdown bar chart
- Delivery info panel
- "You May Also Like" horizontal carousel (same-category products first)

### 🛒 Cart Page
- Add, remove, and adjust quantity of items
- Per-item **View Details →** button navigates back to the product page
- Real-time price summary: subtotal, 10% discount, and total
- Empty cart state with a prompt to start shopping
- Progress steps (Cart → Address → Payment → Summary)

### 👤 Profile Dropdown
- Accessible from the profile icon in the navbar
- Links to Profile, Orders, and Wishlist
- **Theme toggle button** with sun/moon icon and pill switch

### 🌗 Dark / Light Mode
- Toggle from the profile dropdown (desktop) or the mobile menu
- Smooth animated transition
- Preference saved to `localStorage` — persists across page reloads
- Footer and hero section are pinned to their original dark styling in both modes
- Product card buttons, size selectors, and all UI elements have explicit dark mode overrides

### 📱 Responsive Design
- **Desktop (>1024px):** Full sidebar + grid layout
- **Tablet (≤1024px):** Icon-only nav, condensed padding
- **Mobile (≤768px):** Hamburger menu, 2-column product grid, stacked detail page, slide-in filter sidebar
- **Small mobile (≤420px):** Single-column layout throughout

### ♡ Wishlist
- Heart button on every product card
- Toggles filled ♥ / empty ♡ with colour change
- State tracked in memory during the session

---

## 🗂️ Project Structure

```
cartify/
├── index.html      # All pages (Home, Products, Detail, About, Cart) as <div class="page"> sections
├── styles.css      # All styles — variables, components, dark mode, media queries
└── script.js       # All JS — API fetch, rendering, filters, cart, theme, navigation
```

No build step, no bundler, no frameworks. Open `index.html` directly in a browser or deploy as static files.

---

## 🔌 API

Products are fetched from:

```
GET https://kolzsticks.github.io/Free-Ecommerce-Products-Api/main/products.json
```

**Product object shape:**
```json
{
  "id": "50",
  "image": "https://...",
  "name": "Adjustable Knee Pads",
  "rating": { "stars": 4.3, "count": 70 },
  "priceCents": 4000,
  "category": "Health & Fitness",
  "subCategory": "Sports Gear & Accessories",
  "keywords": ["knee pads", "sports", "gear", "fitness"],
  "description": "..."
}
```

**Key normalisation applied in `script.js`:**
| API field | Internal field | Transform |
|---|---|---|
| `p.id` | `id` | `String(p.id)` |
| `p.name` | `name` | — |
| `p.priceCents` | `price` | `Math.round(p.priceCents / 100)` → ₹ |
| `p.rating.stars` | `rating` | — |
| `p.rating.count` | `ratingCount` | — |
| `p.image` | `img` | — |
| `p.description` | `summary` | — |
| `p.category` | `category` | Exact casing preserved for filtering |
| `p.subCategory` | `subCategory` / `brand` | Used as brand label |
| `p.keywords` | `keywords` | Used in live search |

Categories are **not** fetched from a separate endpoint — they are extracted as unique values from the products array and sorted A–Z.

---

## 🎨 Design Tokens

All colours are CSS custom properties on `:root`, swapped out by `body.dark`:

| Token | Light | Dark |
|---|---|---|
| `--bg` | `#f7f5f0` | `#0f0f0e` |
| `--surface` | `#ffffff` | `#1a1a18` |
| `--surface2` | `#f0ede6` | `#242420` |
| `--ink` | `#1a1a18` | `#f0ede6` |
| `--muted` | `#8a8880` | `#6b6966` |
| `--accent` | `#c8522a` | `#c8522a` (unchanged) |
| `--accent2` | `#e8b84b` | `#e8b84b` (unchanged) |
| `--border` | `#ddd9d0` | `#2e2e2a` |

Fonts: **Playfair Display** (headings) + **DM Sans** (body) via Google Fonts.

---

## 🚀 Getting Started

### Run locally
```bash
# No install needed — just open the file
open index.html
```
Or serve with any static file server:
```bash
npx serve .
# then visit http://localhost:3000
```

### Deploy
The project is already live at **[https://cartify013.netlify.app/](https://cartify013.netlify.app/)**.

To deploy your own copy on Netlify:
1. Push the three files (`index.html`, `styles.css`, `script.js`) to a GitHub repo
2. Connect the repo to [Netlify](https://netlify.com)
3. Set publish directory to `/` (root)
4. Deploy — no build command needed

---

## 🧩 Key Functions Reference

| Function | Purpose |
|---|---|
| `fetchProducts()` | Fetches API, normalises data, extracts categories, sets price slider, triggers renders |
| `buildSidebarCategories()` | Dynamically creates category checkboxes from product data |
| `buildHomeCategoryChips()` | Populates the home page category chip row |
| `renderProductsGrid(list)` | Renders a filtered/sorted list into the products grid |
| `applyCurrentFilters()` | Returns filtered array based on `activeCategories` + `maxPrice` |
| `filterCat(catName)` | Navigates to products page and applies a category filter |
| `liveSearch(val)` | Filters products by name, category, subCategory, keywords |
| `openDetail(id)` | Populates and shows the product detail page |
| `addToCart(id, qty)` | Adds a product to cart or increments quantity |
| `renderCart()` | Rebuilds the cart UI with current cart state |
| `toggleTheme()` | Switches dark/light mode and saves to localStorage |
| `toggleProfileMenu(e)` | Opens/closes the profile dropdown |

---

## 📋 Browser Support

Works in all modern browsers (Chrome, Firefox, Safari, Edge). Uses:
- CSS custom properties
- `fetch` API
- `localStorage`
- ES6+ (template literals, arrow functions, optional chaining, spread)

No polyfills included — targets evergreen browsers only.

---

## 📄 License

This project is open source and free to use for personal and educational purposes.

---

*Built with ❤️ using vanilla HTML, CSS & JavaScript — no frameworks, no dependencies.*
