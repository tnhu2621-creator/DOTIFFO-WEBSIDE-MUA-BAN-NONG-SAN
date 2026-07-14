(function() {
    'use strict';

    let cart = [];

    function formatPrice(price) {
        return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') + ' đ';
    }

    function showToast(message) {
        const toast = document.getElementById('toast');
        const toastMsg = document.getElementById('toastMessage');
        if (!toast || !toastMsg) return;
        toastMsg.textContent = message;
        toast.classList.add('show');
        clearTimeout(toast._timer);
        toast._timer = setTimeout(() => {
            toast.classList.remove('show');
        }, 2600);
    }

    function updateCartUI() {
        const cartBadge = document.getElementById('cartBadge');
        const cartItems = document.getElementById('cartItems');
        const cartTotal = document.getElementById('cartTotal');

        const totalItems = cart.length;
        if (cartBadge) {
            cartBadge.textContent = totalItems;
            cartBadge.style.display = totalItems > 0 ? 'flex' : 'none';
        }

        if (!cartItems) return;

        if (cart.length === 0) {
            cartItems.innerHTML = `
                <li class="cart-empty">
                    <i class="fas fa-shopping-cart"></i>
                    Giỏ hàng trống<br />
                    <span style="font-size:0.85rem;">Hãy thêm sản phẩm nhé!</span>
                </li>
            `;
            if (cartTotal) cartTotal.textContent = '0 đ';
            return;
        }

        let html = '', total = 0;
        cart.forEach((item, index) => {
            const subtotal = item.price * item.quantity;
            total += subtotal;
            let iconHtml = '';
            if (item.icon && (item.icon.startsWith('http') || item.icon.startsWith('images/'))) {
                iconHtml = `<img src="${item.icon}" alt="${item.name}" style="width:56px;height:56px;object-fit:cover;border-radius:8px;">`;
            } else {
                iconHtml = `<i class="fas ${item.icon || 'fa-box'}"></i>`;
            }
            html += `
                <li class="cart-item" data-index="${index}">
                    <div class="cart-item-img">${iconHtml}</div>
                    <div class="cart-item-info">
                        <h4>${item.name}</h4>
                        <p>${formatPrice(item.price)}</p>
                    </div>
                    <div class="cart-item-qty">
                        <button class="qty-minus" data-index="${index}">−</button>
                        <span>${item.quantity}</span>
                        <button class="qty-plus" data-index="${index}">+</button>
                    </div>
                    <button class="cart-item-remove" data-index="${index}"><i class="fas fa-trash-alt"></i></button>
                </li>
            `;
        });

        cartItems.innerHTML = html;
        if (cartTotal) cartTotal.textContent = formatPrice(total);

        document.querySelectorAll('.qty-minus').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                const idx = parseInt(this.dataset.index);
                changeQuantity(idx, -1);
            });
        });
        document.querySelectorAll('.qty-plus').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                const idx = parseInt(this.dataset.index);
                changeQuantity(idx, 1);
            });
        });
        document.querySelectorAll('.cart-item-remove').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                const idx = parseInt(this.dataset.index);
                removeItem(idx);
            });
        });
    }

    function loadCartFromServer() {
        fetch('get_cart.php')
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    cart = data.data.map(item => ({
                        id: parseInt(item.id),          // ép kiểu int
                        name: item.name,
                        price: parseInt(item.price),
                        quantity: parseInt(item.quantity),
                        icon: item.icon || 'fa-box'
                    }));
                    updateCartUI();
                } else {
                    console.warn('Lỗi tải giỏ hàng:', data.message);
                    cart = [];
                    updateCartUI();
                }
            })
            .catch(error => {
                console.error('Lỗi fetch:', error);
                cart = [];
                updateCartUI();
            });
    }

    function addToCart(productId, name, price, icon) {
        const formData = new FormData();
        formData.append('product_id', productId);
        formData.append('quantity', 1);

        fetch('add_to_cart.php', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                loadCartFromServer();
                showToast(`Đã thêm "${name}" vào giỏ hàng!`);
                openCart();
            } else {
                showToast('Lỗi: ' + data.message, 'error');
            }
        })
        .catch(error => {
            showToast('Lỗi kết nối server', 'error');
            console.error(error);
        });
    }

    function openCart() {
        loadCartFromServer();
        const overlay = document.getElementById('cartOverlay');
        const sidebar = document.getElementById('cartSidebar');
        if (overlay) {
            overlay.style.display = 'block';
            overlay.classList.add('open');
        }
        if (sidebar) {
            sidebar.style.right = '0';
            sidebar.classList.add('open');
            sidebar.style.display = 'flex';
        }
        document.body.style.overflow = 'hidden';
    }

    function closeCart() {
        const overlay = document.getElementById('cartOverlay');
        const sidebar = document.getElementById('cartSidebar');
        if (overlay) {
            overlay.style.display = 'none';
            overlay.classList.remove('open');
        }
        if (sidebar) {
            sidebar.style.right = '-420px';
            sidebar.classList.remove('open');
        }
        document.body.style.overflow = '';
    }

    // ===== CẬP NHẬT SỐ LƯỢNG =====
    function changeQuantity(index, delta) {
        const item = cart[index];
        if (!item || !item.id) {
            showToast('Không thể xác định sản phẩm', 'error');
            return;
        }
        const newQty = (item.quantity || 0) + delta;
        if (newQty < 0) return;

        const formData = new FormData();
        formData.append('product_id', item.id);
        formData.append('quantity', newQty);
        
        fetch('update_cart_item.php', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                loadCartFromServer();
            } else {
                showToast('Lỗi: ' + data.message, 'error');
            }
        })
        .catch(error => {
            showToast('Lỗi kết nối server', 'error');
            console.error(error);
        });
    }

    // ===== XÓA SẢN PHẨM =====
    function removeItem(index) {
        const item = cart[index];
        if (!item || !item.id) {
            showToast('Không thể xác định sản phẩm', 'error');
            return;
        }
        if (!confirm('Bạn có chắc muốn xóa sản phẩm này?')) return;
        
        const formData = new FormData();
        formData.append('product_id', item.id);
        
        fetch('remove_cart_item.php', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                loadCartFromServer();
                showToast('Đã xóa sản phẩm khỏi giỏ hàng');
            } else {
                showToast('Lỗi: ' + data.message, 'error');
            }
        })
        .catch(error => {
            showToast('Lỗi kết nối server', 'error');
            console.error(error);
        });
    }

    // ===== CÁC HÀM KHÁC =====
    function logout() {
        if (confirm('Bạn có chắc muốn đăng xuất?')) {
            localStorage.removeItem('isLoggedIn');
            window.location.href = 'Dangnhap.php';
        }
    }

    function highlightActiveMenu() {
        const currentPath = window.location.pathname;
        let fileName = currentPath.substring(currentPath.lastIndexOf('/') + 1);
        if (fileName === '') fileName = 'index.php';
        const nameWithoutExt = fileName.replace(/\.[^/.]+$/, '');

        document.querySelectorAll('.nav-menu a').forEach(link => {
            link.classList.remove('active');
            const href = link.getAttribute('href');
            if (href) {
                const cleanHref = href.split('?')[0];
                const hrefWithoutExt = cleanHref.replace(/\.[^/.]+$/, '');
                if (hrefWithoutExt === nameWithoutExt) {
                    link.classList.add('active');
                }
            }
        });
    }

    window.addToCart = addToCart;
    window.openCart = openCart;
    window.closeCart = closeCart;
    window.showToast = showToast;
    window.updateCartUI = updateCartUI;

    function initHeaderEvents() {
        const mobileToggle = document.getElementById('mobileToggle');
        const navMenu = document.getElementById('navMenu');
        if (mobileToggle && navMenu) {
            mobileToggle.addEventListener('click', function(e) {
                e.preventDefault();
                navMenu.classList.toggle('open');
                const icon = this.querySelector('i');
                if (icon) {
                    icon.classList.toggle('fa-bars');
                    icon.classList.toggle('fa-times');
                }
            });
            navMenu.querySelectorAll('a').forEach(link => {
                link.addEventListener('click', function() {
                    navMenu.classList.remove('open');
                    const icon = mobileToggle.querySelector('i');
                    if (icon) {
                        icon.classList.add('fa-bars');
                        icon.classList.remove('fa-times');
                    }
                });
            });
        }

        const cartToggle = document.getElementById('cartToggle');
        if (cartToggle) {
            cartToggle.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                openCart();
            });
        }

        const cartClose = document.getElementById('cartClose');
        const cartOverlay = document.getElementById('cartOverlay');
        if (cartClose) {
            cartClose.addEventListener('click', closeCart);
        }
        if (cartOverlay) {
            cartOverlay.addEventListener('click', closeCart);
        }

        const checkoutBtn = document.getElementById('checkoutBtn');
        if (checkoutBtn) {
            checkoutBtn.addEventListener('click', function(e) {
                e.preventDefault();
                if (cart.length === 0) {
                    showToast('Giỏ hàng trống! Hãy thêm sản phẩm.');
                    return;
                }
                window.location.href = 'Thanhtoan.php';
            });
        }

        const avatarToggle = document.getElementById('avatarToggle');
        const dropdownMenu = document.getElementById('dropdownMenu');
        if (avatarToggle) {
            const loginText = avatarToggle.querySelector('span.login-text');
            if (!loginText) {
                avatarToggle.addEventListener('click', function(e) {
                    e.stopPropagation();
                    if (dropdownMenu) {
                        dropdownMenu.classList.toggle('open');
                    }
                });
                document.addEventListener('click', function(e) {
                    const userAccount = document.getElementById('userAccount');
                    if (userAccount && !userAccount.contains(e.target)) {
                        if (dropdownMenu) dropdownMenu.classList.remove('open');
                    }
                });
            }
        }

        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', function(e) {
                e.preventDefault();
                logout();
            });
        }

        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                if (document.getElementById('cartSidebar')?.classList.contains('open')) {
                    closeCart();
                }
                if (document.getElementById('navMenu')?.classList.contains('open')) {
                    document.getElementById('navMenu').classList.remove('open');
                    const icon = document.getElementById('mobileToggle')?.querySelector('i');
                    if (icon) {
                        icon.classList.add('fa-bars');
                        icon.classList.remove('fa-times');
                    }
                }
                if (document.getElementById('dropdownMenu')?.classList.contains('open')) {
                    document.getElementById('dropdownMenu').classList.remove('open');
                }
            }
        });
    }

    function loadHeader() {
        const placeholder = document.getElementById('header-placeholder');
        const existingHeader = document.querySelector('.header');
        if (existingHeader) {
            loadCartFromServer();
            initHeaderEvents();
            highlightActiveMenu();
            return;
        }

        if (!placeholder) return;

        fetch('menu/header.php')
            .then(response => {
                if (!response.ok) throw new Error('Không thể tải header');
                return response.text();
            })
            .then(phpContent => {
                placeholder.innerHTML = phpContent;
                loadCartFromServer();
                initHeaderEvents();
                highlightActiveMenu();
            })
            .catch(err => {
                console.warn('Lỗi tải header:', err);
                placeholder.innerHTML = '<p style="color:red; padding:20px; text-align:center;">⚠️ Không thể tải thanh menu.</p>';
            });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadHeader);
    } else {
        loadHeader();
    }

    // ===== XỬ LÝ ACTIVE CHO DROPDOWN GIỚI THIỆU =====
    document.addEventListener('DOMContentLoaded', function() {
        updateActiveLink();
    });

    function updateActiveLink() {
        const currentPath = window.location.pathname;
        if (!currentPath.includes('Gioithieu.php')) return;

        const hash = window.location.hash;
        const links = document.querySelectorAll('.nav-menu li.dropdown .dropdown-menu-nav li a');
        links.forEach(link => link.classList.remove('active'));

        let activeLink = null;
        if (hash === '#about') {
            activeLink = document.querySelector('.nav-menu li.dropdown .dropdown-menu-nav li a[href*="#about"]');
        } else if (hash === '#product-intro') {
            activeLink = document.querySelector('.nav-menu li.dropdown .dropdown-menu-nav li a[href*="#product-intro"]');
        }
        if (activeLink) {
            activeLink.classList.add('active');
        }
    }

    document.addEventListener('click', function(e) {
        const target = e.target.closest('.nav-menu li.dropdown .dropdown-menu-nav li a');
        if (target) {
            const parentDropdown = target.closest('.dropdown-menu-nav');
            if (parentDropdown) {
                parentDropdown.querySelectorAll('li a').forEach(link => link.classList.remove('active'));
            }
            target.classList.add('active');
        }
    });

    window.addEventListener('hashchange', function() {
        updateActiveLink();
    });
})();