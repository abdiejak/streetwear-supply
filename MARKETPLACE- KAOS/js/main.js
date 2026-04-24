// ===== PAYMENT PROOF =====
let paymentProofImage = null;

function previewPaymentProof(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
        showNotification('⚠️ Ukuran gambar terlalu besar! Maksimal 2MB');
        event.target.value = '';
        return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
        paymentProofImage = e.target.result;
        const preview = document.getElementById('proofPreview');
        if (preview) {
            preview.innerHTML = `<img src="${paymentProofImage}" alt="Payment proof">`;
        }
    };
    reader.readAsDataURL(file);
}

// ===== GLOBAL VARIABLES =====
let cart = JSON.parse(localStorage.getItem('swCart')) || [];
let currentProduct = null;
let selectedSize = null;
let selectedColor = null;
let selectedPayment = null;
const currentPage = window.location.pathname.split('/').pop() || 'index.html';
const PRODUCTS_PER_PAGE = 6;

// ===== INIT =====
document.addEventListener('DOMContentLoaded', function () {
    updateCartBadge();
    initPage();
});

function initPage() {
    window.scrollTo(0, 0);
    window.addEventListener('scroll', handleNavbarScroll);

    if (currentPage === 'index.html' || currentPage === '') {
        initHomePage();
    } else if (currentPage === 'shop.html') {
        initShopPage();
    } else if (currentPage === 'brands.html') {
        initBrandsPage();
    } else if (currentPage === 'about.html') {
        initAboutPage();
    } else if (currentPage === 'cart.html') {
        initCartPage();
    }
}

// ===== SPLASH SCREEN =====
function enterSite() {
    const splash = document.getElementById('splashScreen');
    const main = document.getElementById('mainWebsite');
    if (splash) {
        splash.style.opacity = '0';
        splash.style.visibility = 'hidden';
        setTimeout(() => {
            splash.style.display = 'none';
            if (main) main.classList.add('active');
        }, 500);
    }
}

if (document.getElementById('splashScreen')) {
    setTimeout(() => {
        const splash = document.getElementById('splashScreen');
        if (splash && splash.classList.contains('active')) {
            enterSite();
        }
    }, 4000);
}

// ===== NAVBAR =====
function handleNavbarScroll() {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        if (currentPage === 'index.html' || currentPage === '') {
            navbar.classList.remove('scrolled');
        }
    }
}

// ===== MOBILE MENU =====
function toggleMobileMenu() {
    const menu = document.getElementById('mobileMenu');
    if (menu) menu.classList.toggle('active');
}

// ===== SEARCH =====
function toggleSearch() {
    const overlay = document.getElementById('searchOverlay');
    if (!overlay) return;
    overlay.classList.toggle('active');
    if (overlay.classList.contains('active')) {
        const input = document.getElementById('searchInput');
        if (input) input.focus();
    }
}

document.addEventListener('DOMContentLoaded', function () {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', function (e) {
            const term = e.target.value.toLowerCase().trim();
            const resultsDiv = document.getElementById('searchResults');
            if (!resultsDiv) return;

            if (term.length < 2) {
                resultsDiv.innerHTML = '';
                return;
            }

            const allProducts = getActiveProducts();
            const filtered = allProducts.filter(p =>
                p.name.toLowerCase().includes(term) ||
                p.brand.toLowerCase().includes(term)
            );

            if (filtered.length === 0) {
                resultsDiv.innerHTML = `
                    <div class="search-no-result">
                        No products found for "${term}"
                    </div>`;
                return;
            }

            resultsDiv.innerHTML = filtered.map(p => `
                <div class="search-item" onclick="goToProduct(${p.id})">
                    <div class="search-item-img">
                        ${p.image && (p.image.startsWith('http') || p.image.startsWith('data:'))
                            ? `<img src="${p.image}" alt="${p.name}" style="width:50px;height:50px;object-fit:cover;">`
                            : p.image || '👕'}
                    </div>
                    <div class="search-item-info">
                        <div class="search-item-brand">${p.brand}</div>
                        <div class="search-item-name">${p.name}</div>
                        <div class="search-item-price">Rp ${formatPrice(p.price)}</div>
                    </div>
                </div>
            `).join('');
        });
    }
});

function goToProduct(id) {
    window.location.href = `shop.html?product=${id}`;
    toggleSearch();
}

// ===== GET PRODUCTS =====
function getActiveProducts() {
    const adminProducts = localStorage.getItem('swAdminProducts');
    if (adminProducts) {
        return JSON.parse(adminProducts).filter(p => p.status !== 'inactive');
    }
    return PRODUCTS;
}

// ===== STOCK CHECKING =====
function getProductStock(productId, size) {
    const products = getActiveProducts();
    const product = products.find(p => p.id === productId);
    if (!product || !product.stock) return 999; // Jika tidak ada sistem stok
    
    if (!size) {
        // Total semua size
        return Object.values(product.stock).reduce((a, b) => a + (b || 0), 0);
    }
    
    // Return 0 jika undefined/null
    return product.stock[size] || 0;
}

function isSizeInStock(productId, size) {
    const stock = getProductStock(productId, size);
    return stock !== undefined && stock > 0;
}

function isProductInStock(productId) {
    const products = getActiveProducts();
    const product = products.find(p => p.id === productId);
    if (!product) return false;
    if (!product.stock) return true; // Jika tidak ada sistem stok, anggap ada
    
    // CEK: Pastikan ada size yang stoknya > 0
    const totalStock = Object.values(product.stock).reduce((sum, val) => sum + (val || 0), 0);
    return totalStock > 0;
}

function getAvailableSizes(productId) {
    const products = getActiveProducts();
    const product = products.find(p => p.id === productId);
    if (!product || !product.sizes) return [];
    if (!product.stock) return product.sizes; // Jika tidak ada sistem stok
    
    // HANYA return size yang stoknya > 0
    return product.sizes.filter(size => {
        const stock = product.stock[size];
        return stock !== undefined && stock !== null && stock > 0;
    });
}

// ===== PAGINATION =====
function getCurrentPageNum() {
    const urlParams = new URLSearchParams(window.location.search);
    return parseInt(urlParams.get('page')) || 1;
}

function goToPage(page) {
    const urlParams = new URLSearchParams(window.location.search);
    urlParams.set('page', page);
    window.location.href = `${window.location.pathname}?${urlParams.toString()}`;
}

function renderPagination(totalProducts, currentPageNum, containerId = 'productsPagination') {
    const paginationDiv = document.getElementById(containerId);
    if (!paginationDiv) return;

    const totalPages = Math.ceil(totalProducts / PRODUCTS_PER_PAGE);

    if (totalPages <= 1) {
        paginationDiv.innerHTML = '';
        return;
    }

    let html = '';

    // Prev button
    html += `
        <button class="pagination-btn prev ${currentPageNum === 1 ? 'disabled' : ''}"
            onclick="${currentPageNum > 1 ? `goToPage(${currentPageNum - 1})` : ''}"
            ${currentPageNum === 1 ? 'disabled' : ''}>
            <i class="fas fa-chevron-left"></i> PREV
        </button>`;

    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        if (
            i === 1 ||
            i === totalPages ||
            (i >= currentPageNum - 1 && i <= currentPageNum + 1)
        ) {
            html += `
                <button class="pagination-btn ${currentPageNum === i ? 'active' : ''}"
                    onclick="goToPage(${i})">${i}
                </button>`;
        } else if (i === currentPageNum - 2 || i === currentPageNum + 2) {
            html += `<span class="pagination-ellipsis">...</span>`;
        }
    }

    // Next button
    html += `
        <button class="pagination-btn next ${currentPageNum === totalPages ? 'disabled' : ''}"
            onclick="${currentPageNum < totalPages ? `goToPage(${currentPageNum + 1})` : ''}"
            ${currentPageNum === totalPages ? 'disabled' : ''}>
            NEXT <i class="fas fa-chevron-right"></i>
        </button>`;

    paginationDiv.innerHTML = html;
}

// ===== HOME PAGE =====
function initHomePage() {
    renderFeaturedProducts();
}

function renderFeaturedProducts() {
    const grid = document.getElementById('featuredProducts');
    if (!grid) return;
    const products = getActiveProducts();
    const featured = products.filter(p => p.featured).slice(0, 6);
    const toRender = featured.length > 0 ? featured : products.slice(0, 6);
    grid.innerHTML = toRender.map(p => createProductCard(p)).join('');
}

// ===== SHOP PAGE =====
function initShopPage() {
    const urlParams = new URLSearchParams(window.location.search);
    const brand = urlParams.get('brand');
    const productId = urlParams.get('product');

    if (brand) {
        const select = document.getElementById('brandFilter');
        if (select) select.value = brand;
    }

    renderAllProducts();

    if (productId) {
        setTimeout(() => viewProductDetail(parseInt(productId)), 300);
    }

    if (getCurrentPageNum() > 1) {
        setTimeout(() => {
            const sec = document.querySelector('.products-section');
            if (sec) sec.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    }
}

function renderAllProducts(products = null) {
    const grid = document.getElementById('productsGrid');
    if (!grid) return;

    const allProducts = products || getFilteredProducts();
    const pageNum = getCurrentPageNum();
    const startIndex = (pageNum - 1) * PRODUCTS_PER_PAGE;
    const productsForPage = allProducts.slice(startIndex, startIndex + PRODUCTS_PER_PAGE);

    if (allProducts.length === 0) {
        grid.innerHTML = `
            <div style="grid-column:1/-1;text-align:center;padding:80px;opacity:0.5;">
                <i class="fas fa-search" style="font-size:3rem;margin-bottom:20px;display:block;"></i>
                <p>No products found</p>
            </div>`;
    } else if (productsForPage.length === 0) {
        goToPage(1);
        return;
    } else {
        grid.innerHTML = productsForPage.map(p => createProductCard(p)).join('');
    }

    renderPagination(allProducts.length, pageNum, 'productsPagination');
}

function getFilteredProducts() {
    const brandFilter = document.getElementById('brandFilter');
    const sortFilter = document.getElementById('sortFilter');
    let filtered = [...getActiveProducts()];

    if (brandFilter && brandFilter.value !== 'all') {
        filtered = filtered.filter(p => p.brand === brandFilter.value);
    }

    if (sortFilter) {
        switch (sortFilter.value) {
            case 'price-low': filtered.sort((a, b) => a.price - b.price); break;
            case 'price-high': filtered.sort((a, b) => b.price - a.price); break;
            case 'name': filtered.sort((a, b) => a.name.localeCompare(b.name)); break;
        }
    }

    return filtered;
}

function filterProducts() {
    const urlParams = new URLSearchParams(window.location.search);
    urlParams.set('page', '1');
    window.history.replaceState({}, '', `${window.location.pathname}?${urlParams.toString()}`);
    renderAllProducts();
}

// ===== BRANDS PAGE =====
function initBrandsPage() {
    const urlParams = new URLSearchParams(window.location.search);
    const selectedBrand = urlParams.get('selected');
    if (selectedBrand) {
        showBrandProducts(selectedBrand);
    }
}

function showBrandProducts(brand) {
    const allProducts = getActiveProducts();
    const brandProducts = allProducts.filter(p =>
        p.brand.toLowerCase() === brand.toLowerCase()
    );

    const brandSection = document.getElementById('brandProductsSection');
    const brandTitle = document.getElementById('selectedBrandTitle');

    if (brandSection) brandSection.style.display = 'block';
    if (brandTitle) brandTitle.textContent = brand.toUpperCase();

    const pageNum = getCurrentPageNum();
    const startIndex = (pageNum - 1) * PRODUCTS_PER_PAGE;
    const productsForPage = brandProducts.slice(startIndex, startIndex + PRODUCTS_PER_PAGE);

    const grid = document.getElementById('brandProductsGrid');
    if (grid) {
        if (brandProducts.length === 0) {
            grid.innerHTML = `
                <div style="grid-column:1/-1;text-align:center;padding:80px;opacity:0.5;">
                    <p>No products found for this brand</p>
                </div>`;
        } else {
            grid.innerHTML = productsForPage.map(p => createProductCard(p)).join('');
        }
    }

    renderPagination(brandProducts.length, pageNum, 'brandPagination');

    setTimeout(() => {
        if (brandSection) brandSection.scrollIntoView({ behavior: 'smooth' });
    }, 100);
}

// ===== PRODUCT CARD =====
function createProductCard(product) {
    const inStock = isProductInStock(product.id);

    const imgHtml = product.image && (product.image.startsWith('http') || product.image.startsWith('data:'))
        ? `<img src="${product.image}" alt="${product.name}">`
        : `<span style="font-size:5rem;">${product.image || '👕'}</span>`;

    return `
        <div class="product-card">
            <div class="product-image" onclick="viewProductDetail(${product.id})">
                ${imgHtml}
                ${product.badge ? `<div class="product-badge">${product.badge}</div>` : ''}
                ${!inStock ? `<div class="out-of-stock-overlay"><span>OUT OF STOCK</span></div>` : ''}
            </div>
            <div class="product-info">
                <div class="product-brand">${product.brand}</div>
                <h3 class="product-name">${product.name}</h3>
                <div class="product-price">Rp ${formatPrice(product.price)}</div>
                <div class="product-actions">
                    <button class="add-to-cart-btn"
                        onclick="${inStock ? `quickAddToCart(${product.id})` : 'showOutOfStockNotification()'}"
                        ${!inStock ? 'disabled' : ''}>
                        <i class="fas fa-shopping-bag"></i>
                        ${inStock ? 'ADD TO BAG' : 'OUT OF STOCK'}
                    </button>
                    <button class="view-details-btn" onclick="viewProductDetail(${product.id})">
                        <i class="fas fa-eye"></i>
                    </button>
                </div>
            </div>
        </div>`;
}

function showOutOfStockNotification() {
    showNotification('⚠️ This product is out of stock!');
}

// ===== PRODUCT DETAIL MODAL =====
function viewProductDetail(productId) {
    const products = getActiveProducts();
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const availableSizes = getAvailableSizes(productId);
    currentProduct = product;
    selectedSize = availableSizes.length > 0 ? availableSizes[0] : null;
    selectedColor = product.colors ? product.colors[0] : '#000000';

    const modal = document.getElementById('productModal');
    const detail = document.getElementById('productDetail');

    if (!modal || !detail) {
        window.location.href = `shop.html?product=${productId}`;
        return;
    }

    const imgHtml = product.image && (product.image.startsWith('http') || product.image.startsWith('data:'))
        ? `<img src="${product.image}" alt="${product.name}">`
        : `<span style="font-size:8rem;">${product.image || '👕'}</span>`;

    detail.innerHTML = `
        <div class="detail-image">
            ${imgHtml}
            ${availableSizes.length === 0 ? `<div class="out-of-stock-badge">OUT OF STOCK</div>` : ''}
        </div>
        <div class="detail-info">
            <div class="detail-brand">${product.brand}</div>
            <h2>${product.name}</h2>
            <div class="detail-price">Rp ${formatPrice(product.price)}</div>

            <div class="stock-status ${availableSizes.length === 0 ? 'no-stock' : 'in-stock'}">
                <i class="fas ${availableSizes.length === 0 ? 'fa-times-circle' : 'fa-check-circle'}"></i>
                <span>${availableSizes.length === 0 ? 'Out of stock' : 'In stock'}</span>
            </div>

            <p class="detail-description">${product.description}</p>

            <div class="size-selector">
                <h4>SIZE:</h4>
                <div class="size-options">
                    ${product.sizes.map(size => {
                        const inStock = isSizeInStock(product.id, size);
                        return `
                            <button class="size-option ${size === selectedSize ? 'selected' : ''} ${!inStock ? 'out-of-stock' : ''}"
                                onclick="${inStock ? `selectSize(this, '${size}')` : ''}"
                                ${!inStock ? 'disabled' : ''}>
                                ${size}${!inStock ? ' <span class="size-oos">OOS</span>' : ''}
                            </button>`;
                    }).join('')}
                </div>
            </div>

            ${product.colors ? `
            <div class="color-selector">
                <h4>COLOR:</h4>
                <div class="color-options">
                    ${product.colors.map(color => `
                        <button class="color-option ${color === selectedColor ? 'selected' : ''}"
                            style="background:${color};"
                            onclick="selectColor(this, '${color}')">
                        </button>`).join('')}
                </div>
            </div>` : ''}

            <div class="detail-actions">
                <button class="detail-add-cart"
                    onclick="addDetailToCart()"
                    ${availableSizes.length === 0 ? 'disabled' : ''}>
                    ${availableSizes.length === 0 ? 'OUT OF STOCK' : 'ADD TO BAG'}
                </button>
                <button class="detail-buy-now"
                    onclick="buyNow()"
                    ${availableSizes.length === 0 ? 'disabled' : ''}>
                    ${availableSizes.length === 0 ? 'OUT OF STOCK' : 'BUY NOW'}
                </button>
            </div>
        </div>`;

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeProductModal() {
    const modal = document.getElementById('productModal');
    if (modal) modal.classList.remove('active');
    document.body.style.overflow = '';
    currentProduct = null;
}

function selectSize(el, size) {
    selectedSize = size;
    document.querySelectorAll('.size-option').forEach(btn => btn.classList.remove('selected'));
    el.classList.add('selected');
}

function selectColor(el, color) {
    selectedColor = color;
    document.querySelectorAll('.color-option').forEach(btn => btn.classList.remove('selected'));
    el.classList.add('selected');
}

// ===== ADD TO CART =====
function addDetailToCart() {
    if (!currentProduct) return;

    if (!selectedSize) {
        showNotification('⚠️ Please select a size!');
        return;
    }

    if (!isSizeInStock(currentProduct.id, selectedSize)) {
        showNotification('⚠️ Sorry, the selected size is out of stock!');
        return;
    }

    const item = {
        id: currentProduct.id,
        name: currentProduct.name,
        brand: currentProduct.brand,
        price: currentProduct.price,
        image: currentProduct.image,
        size: selectedSize,
        color: selectedColor || '#000000',
        quantity: 1
    };

    addToCart(item);
    closeProductModal();
    showNotification(`${currentProduct.name} added to bag! 🛍️`);
}

function quickAddToCart(productId) {
    const products = getActiveProducts();
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const availableSizes = getAvailableSizes(productId);
    if (availableSizes.length === 0) {
        showNotification('⚠️ Sorry, this product is out of stock!');
        return;
    }

    // CEK STOK SIZE PERTAMA
    const firstSize = availableSizes[0];
    const stock = getProductStock(productId, firstSize);
    if (stock <= 0) {
        showNotification('⚠️ Sorry, this product is out of stock!');
        return;
    }

    const item = {
        id: product.id,
        name: product.name,
        brand: product.brand,
        price: product.price,
        image: product.image,
        size: firstSize,
        color: product.colors ? product.colors[0] : '#000000',
        quantity: 1
    };

    addToCart(item);
    showNotification(`${product.name} added to bag! 🛍️`);
}

function buyNow() {
    addDetailToCart();
    setTimeout(() => { window.location.href = 'cart.html'; }, 500);
}

// ===== CART FUNCTIONS =====
function addToCart(item) {
    const stockAvailable = getProductStock(item.id, item.size);
    
    // BLOKIR jika stok 0 atau undefined
    if (stockAvailable === 0 || stockAvailable === undefined) {
        showNotification('⚠️ Sorry, this item is out of stock!');
        return;
    }
    
    const existing = cart.find(c =>
        c.id === item.id && c.size === item.size && c.color === item.color
    );

    if (existing) {
        if (existing.quantity + 1 > stockAvailable) {
            showNotification(`⚠️ Only ${stockAvailable} items available in stock!`);
            return;
        }
        existing.quantity += 1;
    } else {
        cart.push(item);
    }

    saveCart();
    updateCartBadge();
}
function removeFromCart(index) {
    cart.splice(index, 1);
    saveCart();
    updateCartBadge();
    if (currentPage === 'cart.html') renderCartPage();
}

function updateQuantity(index, change) {
    if (!cart[index]) return;

    if (change > 0) {
        const stockAvailable = getProductStock(cart[index].id, cart[index].size);
        
        // BLOKIR jika stok tidak cukup
        if (stockAvailable === 0 || cart[index].quantity >= stockAvailable) {
            showNotification(`⚠️ Only ${stockAvailable} items available in stock!`);
            return;
        }
    }

    cart[index].quantity += change;
    
    if (cart[index].quantity < 1) {
        removeFromCart(index);
    } else {
        saveCart();
        updateCartBadge();
        if (currentPage === 'cart.html') renderCartPage();
    }
}

function saveCart() {
    localStorage.setItem('swCart', JSON.stringify(cart));
}

function updateCartBadge() {
    const badge = document.getElementById('cartCount');
    if (!badge) return;
    const total = cart.reduce((s, i) => s + i.quantity, 0);
    badge.textContent = total;
}

function getCartTotal() {
    return cart.reduce((s, i) => s + (i.price * i.quantity), 0);
}

// ===== CART PAGE =====
function initCartPage() {
    renderCartPage();
}

function renderCartPage() {
    const container = document.getElementById('cartPageItems');
    const subtotalEl = document.getElementById('cartSubtotal');
    const totalEl = document.getElementById('cartTotal');
    if (!container) return;

    if (cart.length === 0) {
        container.innerHTML = `
            <div class="empty-cart-page">
                <i class="fas fa-shopping-bag"></i>
                <h3>YOUR BAG IS EMPTY</h3>
                <p>Looks like you haven't added anything yet.</p>
                <a href="shop.html" class="btn-primary">START SHOPPING</a>
            </div>`;
    } else {
        container.innerHTML = cart.map((item, index) => {
            const imgHtml = item.image && (item.image.startsWith('http') || item.image.startsWith('data:'))
                ? `<img src="${item.image}" alt="${item.name}" style="width:100%;height:100%;object-fit:cover;">`
                : `<span style="font-size:2.5rem;">${item.image || '👕'}</span>`;

            return `
                <div class="cart-page-item">
                    <div class="cart-page-img">${imgHtml}</div>
                    <div class="cart-page-info">
                        <div class="cart-page-brand">${item.brand}</div>
                        <div class="cart-page-name">${item.name}</div>
                        <div class="cart-page-meta">
                            <span>Size: ${item.size}</span>
                            <span class="color-dot" style="background:${item.color || '#000'}"></span>
                        </div>
                        <div class="cart-page-price">Rp ${formatPrice(item.price)}</div>
                        <div class="cart-page-controls">
                            <button class="qty-btn" onclick="updateQuantity(${index}, -1)">
                                <i class="fas fa-minus"></i>
                            </button>
                            <span class="qty-display">${item.quantity}</span>
                            <button class="qty-btn" onclick="updateQuantity(${index}, 1)">
                                <i class="fas fa-plus"></i>
                            </button>
                            <button class="remove-item-btn" onclick="removeFromCart(${index})">
                                <i class="fas fa-trash"></i> REMOVE
                            </button>
                        </div>
                    </div>
                    <div class="cart-page-subtotal">
                        Rp ${formatPrice(item.price * item.quantity)}
                    </div>
                </div>`;
        }).join('');
    }

    const totalAmount = getCartTotal();
    if (subtotalEl) subtotalEl.textContent = `Rp ${formatPrice(totalAmount)}`;
    if (totalEl) totalEl.textContent = `Rp ${formatPrice(totalAmount)}`;
}

// ===== CHECKOUT =====
function openCheckout() {
    if (cart.length === 0) {
        showNotification('Your bag is empty!');
        return;
    }

    // VALIDASI STOK SETIAP ITEM
    for (let i = cart.length - 1; i >= 0; i--) {
        const item = cart[i];
        const stock = getProductStock(item.id, item.size);
        
        // HAPUS item jika stok 0
        if (stock === 0) {
            showNotification(`⚠️ ${item.name} (${item.size}) is out of stock and removed from cart!`);
            cart.splice(i, 1);
            continue;
        }
        
        // KURANGI quantity jika melebihi stok
        if (item.quantity > stock) {
            showNotification(`⚠️ ${item.name} (${item.size}) quantity adjusted to ${stock}!`);
            cart[i].quantity = stock;
        }
    }

    saveCart();
    updateCartBadge();
    
    // Cek lagi setelah pembersihan
    if (cart.length === 0) {
        showNotification('All items are out of stock!');
        if (currentPage === 'cart.html') renderCartPage();
        return;
    }

    const modal = document.getElementById('checkoutModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        renderCheckoutSummary();
        updateStepIndicator(1);

        document.querySelectorAll('.checkout-step').forEach(s => s.classList.remove('active'));
        document.getElementById('step1').classList.add('active');

        selectedPayment = null;
        paymentProofImage = null;

        const confirmBtn = document.getElementById('confirmPaymentBtn');
        if (confirmBtn) confirmBtn.disabled = true;

        const paymentDetails = document.getElementById('paymentDetails');
        if (paymentDetails) paymentDetails.style.display = 'none';

        const paymentProofSection = document.getElementById('paymentProofSection');
        if (paymentProofSection) paymentProofSection.style.display = 'none';

        const proofPreview = document.getElementById('proofPreview');
        if (proofPreview) {
            proofPreview.innerHTML = `<i class="fas fa-image"></i><span>No image selected</span>`;
        }
    }
}
function closeCheckout() {
    const modal = document.getElementById('checkoutModal');
    if (modal) modal.classList.remove('active');
    document.body.style.overflow = '';
}

function renderCheckoutSummary() {
    const items = document.getElementById('checkoutItems');
    const total = document.getElementById('checkoutTotal');

    if (items) {
        items.innerHTML = cart.map(item => `
            <div class="summary-item">
                <span>${item.name} (${item.size}) x${item.quantity}</span>
                <span>Rp ${formatPrice(item.price * item.quantity)}</span>
            </div>`).join('');
    }

    if (total) total.textContent = `Rp ${formatPrice(getCartTotal())}`;
}

function goToPayment() {
    const name = document.getElementById('customerName')?.value.trim();
    const phone = document.getElementById('customerPhone')?.value.trim();
    const address = document.getElementById('customerAddress')?.value.trim();

    if (!name) { showNotification('⚠️ Please enter your full name!'); return; }
    if (!phone) { showNotification('⚠️ Please enter your WhatsApp number!'); return; }
    if (!address) { showNotification('⚠️ Please enter your shipping address!'); return; }

    document.getElementById('step1').classList.remove('active');
    document.getElementById('step2').classList.add('active');
    updateStepIndicator(2);
}

function backToInfo() {
    document.getElementById('step2').classList.remove('active');
    document.getElementById('step1').classList.add('active');
    updateStepIndicator(1);
}

function selectPayment(method) {
    selectedPayment = method;
    const confirmBtn = document.getElementById('confirmPaymentBtn');
    const paymentDetails = document.getElementById('paymentDetails');
    const paymentProofSection = document.getElementById('paymentProofSection');

    if (confirmBtn) confirmBtn.disabled = false;
    if (paymentProofSection) paymentProofSection.style.display = 'block';
    if (!paymentDetails) return;

    paymentDetails.style.display = 'block';

    if (method === 'qris') {
        paymentDetails.innerHTML = `
            <div class="payment-qr">
                <h4>SCAN QRIS CODE</h4>
                <div class="qr-code">
                    ${STORE_CONFIG.qrisImage
                        ? `<img src="${STORE_CONFIG.qrisImage}" alt="QRIS">`
                        : `<div class="qr-placeholder">
                               <i class="fas fa-qrcode" style="font-size:4rem;color:#ccc;display:block;margin-bottom:10px;"></i>
                               <p>QRIS image not set</p>
                           </div>`}
                </div>
                <p>Scan dengan GoPay / OVO / DANA / ShopeePay</p>
                <p style="margin-top:15px;font-size:1.2rem;">
                    <strong>Total: Rp ${formatPrice(getCartTotal())}</strong>
                </p>
            </div>`;
    } else if (method === 'bank') {
        paymentDetails.innerHTML = `
            <div class="bank-details">
                <h4>TRANSFER TO:</h4>
                <div class="bank-info-row">
                    <span>Bank</span>
                    <strong>${STORE_CONFIG.rekening.bank}</strong>
                </div>
                <div class="bank-info-row">
                    <span>Account Number</span>
                    <div class="copy-group">
                        <strong>${STORE_CONFIG.rekening.noRekening}</strong>
                        <button class="copy-btn" onclick="copyText('${STORE_CONFIG.rekening.noRekening}')">
                            <i class="fas fa-copy"></i> COPY
                        </button>
                    </div>
                </div>
                <div class="bank-info-row">
                    <span>Account Name</span>
                    <strong>${STORE_CONFIG.rekening.atasNama}</strong>
                </div>
                <div class="bank-info-row amount-row">
                    <span>Transfer Amount</span>
                    <div class="copy-group">
                        <strong class="amount-text">Rp ${formatPrice(getCartTotal())}</strong>
                        <button class="copy-btn" onclick="copyText('${getCartTotal()}')">
                            <i class="fas fa-copy"></i> COPY
                        </button>
                    </div>
                </div>
            </div>`;
    }
}

// ===== CONFIRM PAYMENT =====
function confirmPayment() {
    if (!selectedPayment) {
        showNotification('⚠️ Please select a payment method!');
        return;
    }

    if (!paymentProofImage) {
        showNotification('⚠️ Upload bukti pembayaran dulu!');
        return;
    }

    const orderId = generateOrderId();
    const customerName = document.getElementById('customerName')?.value.trim() || '';
    const customerPhone = document.getElementById('customerPhone')?.value.trim() || '';
    const customerAddress = document.getElementById('customerAddress')?.value.trim() || '';
    const customerNotes = document.getElementById('customerNotes')?.value.trim() || '';

    const orderData = {
        orderId,
        customerName,
        customerPhone,
        customerAddress,
        customerNotes,
        items: JSON.parse(JSON.stringify(cart)),
        total: getCartTotal(),
        paymentMethod: selectedPayment,
        paymentProof: paymentProofImage,
        status: 'pending',
        date: new Date().toISOString()
    };

    // Simpan order
    const existingOrders = JSON.parse(localStorage.getItem('swOrders')) || [];
    existingOrders.push(orderData);
    localStorage.setItem('swOrders', JSON.stringify(existingOrders));

    // Kurangi stok
    decreaseStock(orderData);

    const orderIdEl = document.getElementById('orderId');
    if (orderIdEl) orderIdEl.textContent = orderId;

    document.getElementById('step2').classList.remove('active');
    document.getElementById('step3').classList.add('active');
    updateStepIndicator(3);

    showNotification('✅ Order placed successfully!');
}

function decreaseStock(order) {
    const products = JSON.parse(localStorage.getItem('swAdminProducts'));
    if (!products) return;

    order.items.forEach(item => {
        const idx = products.findIndex(p => p.id === item.id);
        if (idx === -1) return;
        if (!products[idx].stock) return;
        if (products[idx].stock[item.size] !== undefined) {
            products[idx].stock[item.size] = Math.max(
                0,
                products[idx].stock[item.size] - item.quantity
            );
        }
    });

    localStorage.setItem('swAdminProducts', JSON.stringify(products));
}

function sendToWhatsApp() {
    const name = document.getElementById('customerName')?.value || '';
    const phone = document.getElementById('customerPhone')?.value || '';
    const address = document.getElementById('customerAddress')?.value || '';
    const notes = document.getElementById('customerNotes')?.value || '';
    const orderId = document.getElementById('orderId')?.textContent || '';

    let msg = `🛍️ *ORDER BARU - STREETWEAR SUPPLY*\n\n`;
    msg += `*Order ID:* ${orderId}\n\n`;
    msg += `━━━━━━━━━━━━━━━━━━━\n`;
    msg += `*DATA PEMBELI:*\n`;
    msg += `Nama: ${name}\n`;
    msg += `WhatsApp: ${phone}\n`;
    msg += `Alamat: ${address}\n`;
    if (notes) msg += `Catatan: ${notes}\n`;
    msg += `━━━━━━━━━━━━━━━━━━━\n`;
    msg += `*DETAIL PESANAN:*\n`;
    cart.forEach((item, i) => {
        msg += `${i + 1}. ${item.name} (${item.brand})\n`;
        msg += `   Size: ${item.size} | Qty: ${item.quantity}\n`;
        msg += `   Subtotal: Rp ${formatPrice(item.price * item.quantity)}\n\n`;
    });
    msg += `━━━━━━━━━━━━━━━━━━━\n`;
    msg += `*TOTAL: Rp ${formatPrice(getCartTotal())}*\n`;
    msg += `Pembayaran: ${selectedPayment === 'qris' ? 'QRIS' : 'Transfer Bank'}\n`;
    msg += `━━━━━━━━━━━━━━━━━━━\n`;
    msg += `_Bukti pembayaran terlampir_`;

    window.open(`https://wa.me/${STORE_CONFIG.whatsappAdmin}?text=${encodeURIComponent(msg)}`, '_blank');
}

function finishOrder() {
    cart = [];
    saveCart();
    updateCartBadge();
    closeCheckout();
    showNotification('🎉 Thank you for your order!');
    setTimeout(() => { window.location.href = 'index.html'; }, 1500);
}

function updateStepIndicator(step) {
    for (let i = 1; i <= 3; i++) {
        const dot = document.getElementById(`dot${i}`);
        if (!dot) continue;
        dot.classList.remove('active', 'completed');
        if (i < step) dot.classList.add('completed');
        else if (i === step) dot.classList.add('active');
    }
}

// ===== ABOUT PAGE =====
function initAboutPage() {
    const statsSection = document.querySelector('.about-stats');
    if (!statsSection) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateCounters();
                observer.disconnect();
            }
        });
    }, { threshold: 0.5 });

    observer.observe(statsSection);
}

function animateCounters() {
    document.querySelectorAll('.stat-number').forEach(counter => {
        const target = parseInt(counter.getAttribute('data-count'));
        if (!target) return;
        const step = target / (2000 / 16);
        let current = 0;
        const update = () => {
            current += step;
            if (current < target) {
                counter.textContent = Math.floor(current).toLocaleString();
                requestAnimationFrame(update);
            } else {
                counter.textContent = target.toLocaleString();
            }
        };
        update();
    });
}

// ===== CONTACT WHATSAPP =====
function contactWhatsApp() {
    const msg = encodeURIComponent(`Halo STREETWEAR SUPPLY! Saya ingin bertanya tentang produk kalian.`);
    window.open(`https://wa.me/${STORE_CONFIG.whatsappAdmin}?text=${msg}`, '_blank');
}

// ===== UTILITIES =====
function formatPrice(price) {
    return (price || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function generateOrderId() {
    const d = new Date();
    const date = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
    const rand = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `SW-${date}-${rand}`;
}

function copyText(text) {
    navigator.clipboard.writeText(String(text)).then(() => {
        showNotification('✅ Copied to clipboard!');
    }).catch(() => {
        const el = document.createElement('textarea');
        el.value = String(text);
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
        showNotification('✅ Copied!');
    });
}

function showNotification(message) {
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();

    const notif = document.createElement('div');
    notif.className = 'notification';
    notif.textContent = message;
    document.body.appendChild(notif);

    setTimeout(() => notif.classList.add('show'), 100);
    setTimeout(() => {
        notif.classList.remove('show');
        setTimeout(() => notif.remove(), 300);
    }, 3000);
}

// ===== CLOSE MODAL ON OVERLAY CLICK =====
document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', function () {
            closeProductModal();
            closeCheckout();
        });
    });
});