// ===== ADMIN CONFIG =====
const ADMIN_CONFIG = {
    username: "admin",       // Ganti username
    password: "admin123",    // Ganti password
    sessionKey: "swAdminSession"
};

// ===== LOGIN =====
function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('adminUsername').value;
    const password = document.getElementById('adminPassword').value;
    const errorEl = document.getElementById('loginError');

    if (username === ADMIN_CONFIG.username && 
        password === ADMIN_CONFIG.password) {
        sessionStorage.setItem(ADMIN_CONFIG.sessionKey, 'true');
        window.location.href = 'dashboard.html';
    } else {
        errorEl.classList.add('show');
        setTimeout(() => errorEl.classList.remove('show'), 3000);
    }
}

function togglePassword() {
    const input = document.getElementById('adminPassword');
    const icon = document.getElementById('eyeIcon');
    if (input.type === 'password') {
        input.type = 'text';
        icon.className = 'fas fa-eye-slash';
    } else {
        input.type = 'password';
        icon.className = 'fas fa-eye';
    }
}

// ===== AUTH CHECK =====
function checkAuth() {
    if (!sessionStorage.getItem(ADMIN_CONFIG.sessionKey)) {
        window.location.href = 'login.html';
    }
}

function handleLogout() {
    if (confirm('Are you sure you want to logout?')) {
        sessionStorage.removeItem(ADMIN_CONFIG.sessionKey);
        window.location.href = 'login.html';
    }
}

// ===== STORAGE =====
function getOrders() {
    return JSON.parse(localStorage.getItem('swOrders')) || [];
}

function saveOrders(orders) {
    localStorage.setItem('swOrders', JSON.stringify(orders));
}

function getAdminProducts() {
    const stored = localStorage.getItem('swAdminProducts');
    if (stored) return JSON.parse(stored);
    // Default dari config.js
    const defaultProducts = PRODUCTS.map(p => ({
        ...p,
        stock: {
            S: 5, M: 10, L: 10, XL: 10, XXL: 5
        },
        status: 'active'
    }));
    saveAdminProducts(defaultProducts);
    return defaultProducts;
}

function saveAdminProducts(products) {
    localStorage.setItem('swAdminProducts', JSON.stringify(products));
}

// ===== SIDEBAR =====
let sidebarOpen = true;

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.querySelector('.main-content');
    sidebarOpen = !sidebarOpen;
    if (window.innerWidth <= 768) {
        sidebar.classList.toggle('mobile-open');
    } else {
        sidebar.classList.toggle('hidden');
        mainContent.classList.toggle('expanded');
    }
}

// ===== NAVIGATION =====
let currentSection = 'dashboard';

function showSection(section) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(s => {
        s.classList.remove('active');
    });

    // Deactivate all links
    document.querySelectorAll('.sidebar-link').forEach(l => {
        l.classList.remove('active');
    });

    // Show target section
    const target = document.getElementById(`section-${section}`);
    if (target) target.classList.add('active');

    // Update topbar title
    const titles = {
        dashboard: 'Dashboard',
        orders: 'Orders',
        products: 'Products',
        stock: 'Stock Management'
    };
    const titleEl = document.getElementById('pageTitle');
    if (titleEl) titleEl.textContent = titles[section] || section;

    currentSection = section;

    // Load section data
    if (section === 'dashboard') loadDashboard();
    if (section === 'orders') loadOrders();
    if (section === 'products') loadProducts();
    if (section === 'stock') loadStock();

    // Close mobile sidebar
    if (window.innerWidth <= 768) {
        document.getElementById('sidebar').classList.remove('mobile-open');
    }
}

// ===== DASHBOARD =====
function loadDashboard() {
    const orders = getOrders();
    const products = getAdminProducts();

    // Update stats
    const totalEl = document.getElementById('totalOrders');
    const confirmedEl = document.getElementById('confirmedOrders');
    const pendingEl = document.getElementById('pendingOrders');
    const productsEl = document.getElementById('totalProducts');

    if (totalEl) totalEl.textContent = orders.length;
    if (confirmedEl) confirmedEl.textContent = 
        orders.filter(o => o.status === 'confirmed' || 
                          o.status === 'shipped' || 
                          o.status === 'done').length;
    if (pendingEl) pendingEl.textContent = 
        orders.filter(o => o.status === 'pending').length;
    if (productsEl) productsEl.textContent = products.length;

    // Update order badge
    const pendingCount = orders.filter(o => o.status === 'pending').length;
    const badge = document.getElementById('newOrderBadge');
    if (badge) {
        badge.textContent = pendingCount;
        badge.style.display = pendingCount > 0 ? 'flex' : 'none';
    }

    // Recent orders table
    renderOrdersTable('recentOrdersBody', orders.slice(-5).reverse());
}

// ===== ORDERS =====
let currentFilter = 'all';

function loadOrders() {
    const orders = getOrders();
    const pending = orders.filter(o => o.status === 'pending').length;
    const badge = document.getElementById('newOrderBadge');
    if (badge) {
        badge.textContent = pending;
        badge.style.display = pending > 0 ? 'flex' : 'none';
    }
    renderOrdersTable('ordersTableBody', getFilteredOrders('all'));
}

function getFilteredOrders(filter) {
    const orders = getOrders();
    if (filter === 'all') return orders.reverse();
    return orders.filter(o => o.status === filter).reverse();
}

function filterOrders(filter, btn) {
    currentFilter = filter;
    document.querySelectorAll('.tab-btn').forEach(b => 
        b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    renderOrdersTable('ordersTableBody', getFilteredOrders(filter));
}

function renderOrdersTable(tbodyId, orders) {
    const tbody = document.getElementById(tbodyId);
    if (!tbody) return;

    if (tbodyId === 'ordersTableBody') {
        const startIndex = (currentOrdersPage - 1) * ADMIN_ITEMS_PER_PAGE;
        const endIndex = startIndex + ADMIN_ITEMS_PER_PAGE;
        orders = orders.slice(startIndex, endIndex);
        
        // Render pagination
        renderAdminPagination(
            getFilteredOrders(currentFilter).length,
            currentOrdersPage,
            'adminOrdersPagination',
            'changeOrdersPage'
        );
    }

    if (orders.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align:center;
                    padding:40px;opacity:0.4;">
                    No orders found
                </td>
            </tr>`;
        return;
    }

    tbody.innerHTML = orders.map(order => `
        <tr>
            <td>
                <strong style="color:var(--accent)">
                    ${order.orderId}
                </strong>
            </td>
            <td>${order.customerName}</td>
            <td>${order.items?.length || 0} item(s)</td>
            <td>Rp ${formatAdminPrice(order.total)}</td>
            <td>${order.paymentMethod?.toUpperCase() || '-'}</td>
            <td>${formatDate(order.date)}</td>
            <td>
                <span class="status-badge status-${order.status}">
                    ${order.status?.toUpperCase()}
                </span>
            </td>
            <td>
                <button class="action-btn action-view" 
                        onclick="viewOrderDetail('${order.orderId}')">
                    <i class="fas fa-eye"></i>
                </button>
                ${order.status === 'pending' ? `
                <button class="action-btn action-confirm" 
                        onclick="updateOrderStatus(
                            '${order.orderId}', 'confirmed')">
                    <i class="fas fa-check"></i>
                </button>` : ''}
                ${order.status === 'confirmed' ? `
                <button class="action-btn action-ship" 
                        onclick="updateOrderStatus(
                            '${order.orderId}', 'shipped')">
                    <i class="fas fa-truck"></i>
                </button>` : ''}
                ${order.status === 'shipped' ? `
                <button class="action-btn action-done" 
                        onclick="updateOrderStatus(
                            '${order.orderId}', 'done')">
                    <i class="fas fa-check-double"></i>
                </button>` : ''}
            </td>
        </tr>
    `).join('');
}

// ===== ORDER DETAIL =====
function viewOrderDetail(orderId) {
    const orders = getOrders();
    const order = orders.find(o => o.orderId === orderId);
    if (!order) return;

    const content = document.getElementById('orderDetailContent');
    content.innerHTML = `
        <div class="order-detail-grid">
            <div class="order-detail-section">
                <h4>CUSTOMER INFO</h4>
                <div class="order-detail-row">
                    <span>Name</span>
                    <span>${order.customerName}</span>
                </div>
                <div class="order-detail-row">
                    <span>WhatsApp</span>
                    <span>${order.customerPhone}</span>
                </div>
                <div class="order-detail-row">
                    <span>Address</span>
                    <span style="white-space:pre-line;line-height:1.5">${order.customerAddress}</span>
                </div>
                ${order.customerNotes ? `
                <div class="order-detail-row">
                    <span>Notes</span>
                    <span style="white-space:pre-line;line-height:1.5">${order.customerNotes}</span>
                </div>` : ''}
            </div>
            <div class="order-detail-section">
                <h4>ORDER INFO</h4>
                <div class="order-detail-row">
                    <span>Order ID</span>
                    <span style="color:var(--accent)">
                        ${order.orderId}
                    </span>
                </div>
                <div class="order-detail-row">
                    <span>Date</span>
                    <span>${formatDate(order.date)}</span>
                </div>
                <div class="order-detail-row">
                    <span>Payment</span>
                    <span>${order.paymentMethod?.toUpperCase()}</span>
                </div>
                <div class="order-detail-row">
                    <span>Status</span>
                    <span class="status-badge status-${order.status}">
                        ${order.status?.toUpperCase()}
                    </span>
                </div>
                
                <!-- ✨ TAMBAHKAN BUKTI PEMBAYARAN DISINI -->
                <div class="order-detail-row">
                    <span>Payment Proof</span>
                    <span>
                        ${order.paymentProof 
                            ? `<div class="proof-thumbnail" 
                                   onclick="viewPaymentProof('${order.orderId}')">
                                   <img src="${order.paymentProof}" alt="Payment proof">
                               </div>`
                            : `<div class="no-proof">No proof uploaded</div>`
                        }
                    </span>
                </div>
            </div>
        </div>

        <div class="order-detail-section">
            <h4>ORDER ITEMS</h4>
            <div class="order-items-list">
                ${order.items?.map(item => `
                    <div class="order-item-row">
                        <span>
                            ${item.image} ${item.name} 
                            (${item.brand}) - Size: ${item.size}
                        </span>
                        <span>x${item.quantity}</span>
                        <span>
                            Rp ${formatAdminPrice(
                                item.price * item.quantity)}
                        </span>
                    </div>
                `).join('') || ''}
                <div class="order-total-row">
                    <span>TOTAL</span>
                    <span style="color:var(--accent)">
                        Rp ${formatAdminPrice(order.total)}
                    </span>
                </div>
            </div>
        </div>

        <div class="update-status-section">
            <h4>UPDATE STATUS</h4>
            <div class="status-buttons">
                <button class="status-btn" 
                        style="background:rgba(255,193,7,0.2);
                               color:var(--yellow);
                               border:1px solid rgba(255,193,7,0.3)"
                        onclick="updateOrderStatus(
                            '${order.orderId}', 'pending')">
                    PENDING
                </button>
                <button class="status-btn"
                        style="background:rgba(76,175,80,0.2);
                               color:var(--green);
                               border:1px solid rgba(76,175,80,0.3)"
                        onclick="updateOrderStatus(
                            '${order.orderId}', 'confirmed')">
                    CONFIRMED
                </button>
                <button class="status-btn"
                        style="background:rgba(33,150,243,0.2);
                               color:var(--blue);
                               border:1px solid rgba(33,150,243,0.3)"
                        onclick="updateOrderStatus(
                            '${order.orderId}', 'shipped')">
                    SHIPPED
                </button>
                <button class="status-btn"
                        style="background:rgba(255,255,255,0.1);
                               color:var(--white);
                               border:1px solid var(--border)"
                        onclick="updateOrderStatus(
                            '${order.orderId}', 'done')">
                    DONE
                </button>
                <button class="status-btn"
                        style="background:rgba(255,0,0,0.1);
                               color:var(--accent);
                               border:1px solid rgba(255,0,0,0.3)"
                        onclick="updateOrderStatus(
                            '${order.orderId}', 'cancelled')">
                    CANCELLED
                </button>
            </div>
            <div style="margin-top:20px;">
                <button class="btn-primary-admin" 
                        onclick="contactCustomer(
                            '${order.customerPhone}',
                            '${order.orderId}')">
                    <i class="fab fa-whatsapp"></i>
                    CONTACT CUSTOMER
                </button>
            </div>
        </div>
    `;

    document.getElementById('orderModal').classList.add('active');
}

function viewPaymentProof(orderId) {
    const orders = getOrders();
    const order = orders.find(o => o.orderId === orderId);
    if (!order || !order.paymentProof) return;
    
    const container = document.getElementById('paymentProofImage');
    if (container) {
        container.innerHTML = `
            <img src="${order.paymentProof}" alt="Payment Proof">
            <p style="margin-top:15px;">Order ID: ${order.orderId}</p>
            <button class="btn-primary-admin" 
                    onclick="downloadPaymentProof('${order.orderId}')"
                    style="margin-top:20px;">
                <i class="fas fa-download"></i> DOWNLOAD BUKTI
            </button>
        `;
    }
    
    document.getElementById('paymentProofModal').classList.add('active');
}
// ===== ADMIN PAGINATION =====
const ADMIN_ITEMS_PER_PAGE = 10; // 10 items per page
let currentProductsPage = 1;
let currentOrdersPage = 1;

function renderAdminPagination(totalItems, currentPage, containerId, pageChangeFunction) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const totalPages = Math.ceil(totalItems / ADMIN_ITEMS_PER_PAGE);
    
    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }
    
    let paginationHTML = '';
    
    // Previous button
    paginationHTML += `
        <button class="admin-page-btn prev ${currentPage === 1 ? 'disabled' : ''}"
                onclick="${currentPage > 1 ? `${pageChangeFunction}(${currentPage - 1})` : ''}"
                ${currentPage === 1 ? 'disabled' : ''}>
            <i class="fas fa-chevron-left"></i> PREV
        </button>
    `;
    
    // Page numbers
    if (totalPages <= 5) {
        // Show all pages if 5 or fewer
        for (let i = 1; i <= totalPages; i++) {
            paginationHTML += `
                <button class="admin-page-btn ${currentPage === i ? 'active' : ''}"
                        onclick="${pageChangeFunction}(${i})">
                    ${i}
                </button>
            `;
        }
    } else {
        // First page
        paginationHTML += `
            <button class="admin-page-btn ${currentPage === 1 ? 'active' : ''}"
                    onclick="${pageChangeFunction}(1)">
                1
            </button>
        `;
        
        // Ellipsis or second page
        if (currentPage > 3) {
            paginationHTML += `<span>...</span>`;
        } else {
            paginationHTML += `
                <button class="admin-page-btn ${currentPage === 2 ? 'active' : ''}"
                        onclick="${pageChangeFunction}(2)">
                    2
                </button>
            `;
        }
        
        // Middle pages
        if (currentPage > 2 && currentPage < totalPages - 1) {
            paginationHTML += `
                <button class="admin-page-btn active">
                    ${currentPage}
                </button>
            `;
        }
        
        // Ellipsis or second-to-last page
        if (currentPage < totalPages - 2) {
            paginationHTML += `<span>...</span>`;
        } else if (totalPages > 2) {
            paginationHTML += `
                <button class="admin-page-btn ${currentPage === totalPages - 1 ? 'active' : ''}"
                        onclick="${pageChangeFunction}(${totalPages - 1})">
                    ${totalPages - 1}
                </button>
            `;
        }
        
        // Last page
        paginationHTML += `
            <button class="admin-page-btn ${currentPage === totalPages ? 'active' : ''}"
                    onclick="${pageChangeFunction}(${totalPages})">
                ${totalPages}
            </button>
        `;
    }
    
    // Next button
    paginationHTML += `
        <button class="admin-page-btn next ${currentPage === totalPages ? 'disabled' : ''}"
                onclick="${currentPage < totalPages ? `${pageChangeFunction}(${currentPage + 1})` : ''}"
                ${currentPage === totalPages ? 'disabled' : ''}>
            NEXT <i class="fas fa-chevron-right"></i>
        </button>
    `;
    
    container.innerHTML = paginationHTML;
}

function changeProductsPage(page) {
    currentProductsPage = page;
    loadProducts();
}

function changeOrdersPage(page) {
    currentOrdersPage = page;
    loadOrders();
}
// Fungsi untuk download bukti pembayaran
function downloadPaymentProof(orderId) {
    const orders = getOrders();
    const order = orders.find(o => o.orderId === orderId);
    if (!order || !order.paymentProof) return;
    
    // Buat element a untuk download
    const link = document.createElement('a');
    link.href = order.paymentProof;
    link.download = `bukti_bayar_${order.orderId}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showAdminNotif('Bukti pembayaran berhasil diunduh!', 'success');
}
function closeOrderModal() {
    document.getElementById('orderModal').classList.remove('active');
}

function updateOrderStatus(orderId, newStatus) {
    const orders = getOrders();
    const idx = orders.findIndex(o => o.orderId === orderId);
    if (idx === -1) return;

    orders[idx].status = newStatus;
    saveOrders(orders);

    closeOrderModal();
    showAdminNotif(
        `Order ${orderId} updated to ${newStatus.toUpperCase()}!`, 
        'success'
    );

    if (currentSection === 'orders') loadOrders();
    if (currentSection === 'dashboard') loadDashboard();
}

function contactCustomer(phone, orderId) {
    const msg = encodeURIComponent(
        `Halo! Ini admin STREETWEAR SUPPLY.\n` +
        `Mengenai pesanan Anda dengan Order ID: *${orderId}*\n\n` +
        `Ada yang bisa kami bantu?`
    );
    window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
}

// ===== PRODUCTS =====
let editingProductId = null;

function loadProducts() {
    const products = getAdminProducts();
    const tbody = document.getElementById('productsTableBody');
    if (!tbody) return;
    
    const startIndex = (currentProductsPage - 1) * ADMIN_ITEMS_PER_PAGE;
    const endIndex = startIndex + ADMIN_ITEMS_PER_PAGE;
    const productsForPage = products.slice(startIndex, endIndex);

    tbody.innerHTML = productsForPage.map(p => {
        const totalStock = Object.values(p.stock || {})
            .reduce((a, b) => a + b, 0);
        return `
            <tr>
                <td>
                    <div style="display:flex;
                                align-items:center;gap:15px">
                        <div class="product-thumb">
                            ${p.image && (p.image.startsWith('http') || p.image.startsWith('data:')) ? 
                              `<img src="${p.image}" alt="${p.name}">` :
                              `<span>${p.image || '👕'}</span>`}
                        </div>
                        <div>
                            <div style="font-weight:700">
                                ${p.name}
                            </div>
                            <div style="opacity:0.5;font-size:0.8rem">
                                ID: ${p.id}
                            </div>
                        </div>
                    </div>
                </td>
                <td>${p.brand}</td>
                <td>Rp ${formatAdminPrice(p.price)}</td>
                <td class="${totalStock <= 5 ? 'stock-low' : 
                            totalStock <= 15 ? 'stock-medium' : 
                            'stock-ok'}">
                    ${totalStock} pcs
                </td>
                <td>
                    <span class="status-badge ${p.status === 'active' ? 
                        'status-confirmed' : 'status-cancelled'}">
                        ${p.status?.toUpperCase() || 'ACTIVE'}
                    </span>
                </td>
                <td>
                    <button class="action-btn action-edit" 
                            onclick="openEditProduct(${p.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn action-delete" 
                            onclick="deleteProduct(${p.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
    
    // Render pagination
    renderAdminPagination(
        products.length, 
        currentProductsPage, 
        'adminProductsPagination', 
        'changeProductsPage'
    );
}

function openAddProduct() {
    editingProductId = null;
    document.getElementById('productModalTitle').textContent = 
        'ADD PRODUCT';
    document.getElementById('productForm').reset();
    document.getElementById('pImage').value = '👕';
    document.getElementById('productModal').classList.add('active');
}

function openEditProduct(id) {
    const products = getAdminProducts();
    const product = products.find(p => p.id === id);
    if (!product) return;

    editingProductId = id;
    document.getElementById('productModalTitle').textContent = 
        'EDIT PRODUCT';

    // Fill form
    document.getElementById('pName').value = product.name;
    document.getElementById('pBrand').value = product.brand;
    document.getElementById('pPrice').value = product.price;
    document.getElementById('pBadge').value = product.badge || '';
    document.getElementById('pImage').value = product.image;
    document.getElementById('pDescription').value = product.description;
    document.getElementById('pFeatured').value = 
        product.featured ? 'true' : 'false';

    // Sizes checkboxes
    document.querySelectorAll('input[name="sizes"]').forEach(cb => {
        cb.checked = product.sizes?.includes(cb.value);
    });

    // Stock
    const stock = product.stock || {};
    document.getElementById('stockS').value = stock.S || 0;
    document.getElementById('stockM').value = stock.M || 0;
    document.getElementById('stockL').value = stock.L || 0;
    document.getElementById('stockXL').value = stock.XL || 0;
    document.getElementById('stockXXL').value = stock.XXL || 0;

    document.getElementById('productModal').classList.add('active');
}

function closeProductModal() {
    document.getElementById('productModal').classList.remove('active');
    editingProductId = null;
}

function saveProduct() {
    const name = document.getElementById('pName').value.trim();
    const brand = document.getElementById('pBrand').value;
    const price = parseInt(document.getElementById('pPrice').value);
    const badge = document.getElementById('pBadge').value;
    const image = document.getElementById('pImage').value || '👕';
    const description = document.getElementById('pDescription').value.trim();
    const featured = document.getElementById('pFeatured').value === 'true';

    if (!name || !brand || !price || !description) {
        showAdminNotif('Please fill all required fields!', 'error');
        return;
    }

    const sizes = Array.from(
        document.querySelectorAll('input[name="sizes"]:checked')
    ).map(cb => cb.value);

    if (sizes.length === 0) {
        showAdminNotif('Please select at least one size!', 'error');
        return;
    }

    const stock = {
        S: parseInt(document.getElementById('stockS').value) || 0,
        M: parseInt(document.getElementById('stockM').value) || 0,
        L: parseInt(document.getElementById('stockL').value) || 0,
        XL: parseInt(document.getElementById('stockXL').value) || 0,
        XXL: parseInt(document.getElementById('stockXXL').value) || 0
    };

    const products = getAdminProducts();

    if (editingProductId) {
        // Edit existing
        const idx = products.findIndex(p => p.id === editingProductId);
        if (idx !== -1) {
            products[idx] = {
                ...products[idx],
                name, brand, price, badge, image,
                description, featured, sizes, stock,
                status: products[idx].status || 'active'
            };
            showAdminNotif('Product updated successfully!', 'success');
        }
    } else {
        // Add new
        const newId = Math.max(...products.map(p => p.id), 0) + 1;
        products.push({
            id: newId,
            name, brand, price, badge, image,
            description, featured, sizes, stock,
            colors: ["#000000", "#FFFFFF"],
            status: 'active'
        });
        showAdminNotif('Product added successfully!', 'success');
    }

    saveAdminProducts(products);
    closeProductModal();
    loadProducts();
}

function deleteProduct(id) {
    if (!confirm('Are you sure you want to delete this product?')) return;
    const products = getAdminProducts().filter(p => p.id !== id);
    saveAdminProducts(products);
    loadProducts();
    showAdminNotif('Product deleted!', 'success');
}

// ===== STOCK MANAGEMENT =====
let editingStockId = null;

function loadStock() {
    const products = getAdminProducts();
    const tbody = document.getElementById('stockTableBody');
    if (!tbody) return;

    tbody.innerHTML = products.map(p => {
        const stock = p.stock || {};
        const total = Object.values(stock).reduce((a,b) => a+b, 0);
        return `
            <tr>
                <td>
                    <div style="display:flex;
                                align-items:center;gap:10px">
                        <span>${p.image}</span>
                        <span>${p.name}</span>
                    </div>
                </td>
                <td>${p.brand}</td>
                ${['S','M','L','XL','XXL'].map(size => `
                    <td class="${(stock[size]||0) === 0 ? 'stock-low' : 
                                (stock[size]||0) <= 5 ? 'stock-medium' : 
                                'stock-ok'}">
                        ${stock[size] || 0}
                    </td>
                `).join('')}
                <td class="${total === 0 ? 'stock-low' : 
                            total <= 10 ? 'stock-medium' : 'stock-ok'}">
                    <strong>${total} pcs</strong>
                </td>
                <td>
                    <button class="action-btn action-edit" 
                            onclick="openStockModal(${p.id})">
                        <i class="fas fa-edit"></i> UPDATE
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function openStockModal(id) {
    editingStockId = id;
    const products = getAdminProducts();
    const product = products.find(p => p.id === id);
    if (!product) return;

    const stock = product.stock || {};
    document.getElementById('stockModalContent').innerHTML = `
        <div style="margin-bottom:20px">
            <strong style="font-size:1.1rem">${product.image} 
                ${product.name}
            </strong>
            <div style="opacity:0.5;font-size:0.8rem;margin-top:5px">
                ${product.brand}
            </div>
        </div>
        <div class="stock-inputs">
            ${['S','M','L','XL','XXL'].map(size => `
                <div class="stock-input-item">
                    <label>${size}</label>
                    <input type="number" 
                           id="editStock${size}" 
                           min="0" 
                           value="${stock[size] || 0}">
                </div>
            `).join('')}
        </div>
    `;

    document.getElementById('stockModal').classList.add('active');
}

function closeStockModal() {
    document.getElementById('stockModal').classList.remove('active');
    editingStockId = null;
}

function saveStock() {
    if (!editingStockId) return;
    const products = getAdminProducts();
    const idx = products.findIndex(p => p.id === editingStockId);
    if (idx === -1) return;

    products[idx].stock = {
        S: parseInt(document.getElementById('editStockS').value) || 0,
        M: parseInt(document.getElementById('editStockM').value) || 0,
        L: parseInt(document.getElementById('editStockL').value) || 0,
        XL: parseInt(document.getElementById('editStockXL').value) || 0,
        XXL: parseInt(document.getElementById('editStockXXL').value) || 0
    };

    saveAdminProducts(products);
    closeStockModal();
    loadStock();
    showAdminNotif('Stock updated successfully!', 'success');
}

// ===== UTILS =====
function formatAdminPrice(price) {
    return price?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") || '0';
}

function formatDate(dateStr) {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return `${d.getDate()}/${d.getMonth()+1}/${d.getFullYear()} 
            ${d.getHours()}:${String(d.getMinutes()).padStart(2,'0')}`;
}

function showAdminNotif(msg, type = 'default') {
    const existing = document.querySelector('.admin-notif');
    if (existing) existing.remove();

    const notif = document.createElement('div');
    notif.className = `admin-notif ${type}`;
    notif.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : 
                       type === 'warning' ? 'fa-exclamation-triangle' : 
                       'fa-info-circle'}"></i>
        <span>${msg}</span>
    `;
    document.body.appendChild(notif);

    setTimeout(() => notif.classList.add('show'), 100);
    setTimeout(() => {
        notif.classList.remove('show');
        setTimeout(() => notif.remove(), 300);
    }, 3000);
}

// ===== SAVE ORDER (dipanggil dari main.js) =====
function saveNewOrder(orderData) {
    const orders = getOrders();
    orders.push({
        ...orderData,
        status: 'pending',
        date: new Date().toISOString()
    });
    saveOrders(orders);
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', function() {
    const isDashboard = window.location.pathname
        .includes('dashboard.html');
    const isLogin = window.location.pathname
        .includes('login.html');

    if (isDashboard) {
        checkAuth();
        loadDashboard();
    }
});