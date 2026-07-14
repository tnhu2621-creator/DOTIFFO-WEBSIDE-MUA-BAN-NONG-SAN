(function() {
    'use strict';

    let cart = [];
    let selectedIds = new Set();

    function formatPrice(price) {
        return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') + ' đ';
    }

    function showToast(message, type) {
        const toast = document.getElementById('toast');
        const toastMsg = document.getElementById('toastMessage');
        if (!toast || !toastMsg) return;
        toastMsg.textContent = message;
        toast.className = 'toast show';
        if (type === 'error') {
            toast.style.borderLeftColor = '#dc3545';
        } else {
            toast.style.borderLeftColor = '#FF0090';
        }
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
            const checkoutBtn = document.getElementById('checkoutBtn');
            if (checkoutBtn) {
                checkoutBtn.disabled = true;
                checkoutBtn.style.opacity = '0.6';
                checkoutBtn.title = 'Giỏ hàng trống';
            }
            return;
        }

        let html = '', total = 0;

        cart.forEach((item, index) => {
            const subtotal = item.price * item.quantity;
            const isOutOfStock = item.is_out_of_stock === true;

            const isDisabled = isOutOfStock;
            const isChecked = !isDisabled && selectedIds.has(item.id);

            if (isChecked) {
                total += subtotal;
            }

            let iconHtml = '';
            if (item.icon && (item.icon.startsWith('http') || item.icon.startsWith('images/'))) {
                iconHtml = `<img src="${item.icon}" alt="${item.name}" style="width:56px;height:56px;object-fit:cover;border-radius:8px;">`;
            } else {
                iconHtml = `<i class="fas ${item.icon || 'fa-box'}"></i>`;
            }

            html += `
                <li class="cart-item ${isOutOfStock ? 'out-of-stock' : ''}" data-index="${index}">
                    <div class="cart-item-check">
                        <input type="checkbox" class="item-checkbox" data-id="${item.id}" 
                               ${isChecked ? 'checked' : ''} 
                               ${isDisabled ? 'disabled' : ''}>
                    </div>
                    <div class="cart-item-img">${iconHtml}</div>
                    <div class="cart-item-info">
                        <h4>${item.name} ${isOutOfStock ? '<span style="color:red; font-size:0.8rem;">(Hết hàng)</span>' : ''}</h4>
                        <p>${formatPrice(item.price)}</p>
                    </div>
                    <div class="cart-item-qty">
                        <button class="qty-minus" data-index="${index}">−</button>
                        <span>${item.quantity}</span>
                        ${!isOutOfStock ? `<button class="qty-plus" data-index="${index}">+</button>` : ''}
                    </div>
                    <button class="cart-item-remove" data-index="${index}"><i class="fas fa-trash-alt"></i></button>
                </li>
            `;
        });

        cartItems.innerHTML = html;
        cartTotal.textContent = formatPrice(total);

        // ===== CẬP NHẬT TRẠNG THÁI NÚT THANH TOÁN (ĐÃ SỬA LỖI) =====
        const checkoutBtn = document.getElementById('checkoutBtn');
        if (checkoutBtn) {
            const selectedItems = cart.filter(item => selectedIds.has(item.id));
            const hasSelectedOutOfStock = selectedItems.some(item => item.is_out_of_stock);

            if (cart.length === 0) {
                checkoutBtn.disabled = true;
                checkoutBtn.style.opacity = '0.6';
                checkoutBtn.title = 'Giỏ hàng trống';
            } else if (selectedItems.length === 0) { 
                // Kiểm tra dựa trên số lượng phần tử thực tế tìm thấy trong giỏ hàng
                checkoutBtn.disabled = true;
                checkoutBtn.style.opacity = '0.6';
                checkoutBtn.style.cursor = 'not-allowed';
                checkoutBtn.title = 'Vui lòng chọn ít nhất một sản phẩm';
            } else if (hasSelectedOutOfStock) {
                checkoutBtn.disabled = true;
                checkoutBtn.style.opacity = '0.6';
                checkoutBtn.style.cursor = 'not-allowed';
                checkoutBtn.title = 'Sản phẩm đã chọn có hàng hết hàng';
            } else {
                checkoutBtn.disabled = false;
                checkoutBtn.style.opacity = '1';
                checkoutBtn.style.cursor = 'pointer';
                checkoutBtn.title = '';
            }
        }
    }

    // ===== HÀM ĐĂNG KÝ SỰ KIỆN GIỎ HÀNG (ĐÃ SỬA LỖI LAN TRUYỀN SỰ KIỆN) =====
    function initCartEvents() {
        const cartItems = document.getElementById('cartItems');
        if (!cartItems) return;

        // Lắng nghe sự kiện thay đổi của checkbox chọn sản phẩm
        cartItems.addEventListener('change', function(e) {
            const target = e.target;
            if (target && target.classList && target.classList.contains('item-checkbox')) {
                // Ngăn chặn sự kiện lan truyền lên các bộ lắng nghe khác
                e.stopPropagation(); 
                
                const id = String(target.dataset.id);
                if (id === '') return;

                if (target.checked) {
                    selectedIds.add(id);
                } else {
                    selectedIds.delete(id);
                }
                updateCartUI(); // Cập nhật lại UI và tổng tiền sau khi chọn
            }
        });

        // Lắng nghe sự kiện click trên các nút cộng, trừ, xóa sản phẩm
        cartItems.addEventListener('click', function(e) {
            // Chỉ xử lý nếu mục tiêu click thực sự nằm trong một thẻ button
            const target = e.target.closest('button');
            if (!target) return;
            
            if (target.classList.contains('qty-minus') || target.classList.contains('qty-plus') || target.classList.contains('cart-item-remove')) {
                e.preventDefault();
                e.stopPropagation();
                
                const index = parseInt(target.dataset.index);
                if (isNaN(index) || index < 0 || index >= cart.length) {
                    showToast('Không thể xác định vị trí sản phẩm', 'error');
                    return;
                }

                if (target.classList.contains('qty-minus')) {
                    changeQuantity(index, -1);
                } else if (target.classList.contains('qty-plus')) {
                    changeQuantity(index, 1);
                } else if (target.classList.contains('cart-item-remove')) {
                    removeItem(index);
                }
            }
        });
    }

    function loadCartFromServer() {
        fetch('get_cart.php')
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    cart = data.data.map(item => ({
                        id: String(item.id),
                        name: item.name,
                        price: parseInt(item.price),
                        quantity: parseInt(item.quantity),
                        icon: item.icon || 'fa-box',
                        stock: parseInt(item.stock || 0),
                        is_out_of_stock: (parseInt(item.quantity) > parseInt(item.stock || 0))
                    }));
                    // Giữ lại các sản phẩm đã chọn nếu vẫn còn trong giỏ và không hết hàng
                    selectedIds = new Set([...selectedIds].filter(id => {
                        const item = cart.find(p => p.id === id);
                        return item && !item.is_out_of_stock;
                    }));
                    updateCartUI();
                } else {
                    console.warn('Lỗi tải giỏ hàng:', data.message);
                    cart = [];
                    selectedIds.clear();
                    updateCartUI();
                }
            })
            .catch(error => {
                console.error('Lỗi fetch:', error);
                cart = [];
                selectedIds.clear();
                updateCartUI();
            });
    }

    function addToCart(productId, name, price, icon) {
        const formData = new FormData();
        formData.append('product_id', productId);
        formData.append('quantity', 1);

        fetch('ThemGiohang.php', {
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

    function changeQuantity(index, delta) {
        const item = cart[index];
        if (!item || !item.id) {
            showToast('Không thể xác định sản phẩm', 'error');
            return;
        }
        const newQty = (item.quantity || 0) + delta;
        if (newQty < 0) return;

        if (newQty > item.stock) {
            showToast('Số lượng vượt quá tồn kho', 'error');
            return;
        }

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
                selectedIds.delete(item.id);
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

    function checkout() {
        if (cart.length === 0) {
            showToast('Giỏ hàng trống! Hãy thêm sản phẩm.');
            return;
        }

        const selectedItems = cart.filter(item => selectedIds.has(item.id));
        if (selectedItems.length === 0) {
            showToast('Vui lòng chọn ít nhất một sản phẩm để thanh toán');
            return;
        }

        const hasOutOfStock = selectedItems.some(item => item.is_out_of_stock);
        if (hasOutOfStock) {
            showToast('Không thể thanh toán vì có sản phẩm đã hết hàng', 'error');
            return;
        }

        const ids = selectedItems.map(item => item.id).join(',');
        window.location.href = `Thanhtoan.php?ids=${ids}`;
    }

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
                checkout();
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
            initCartEvents(); 
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
                initCartEvents(); 
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

    // ===== ACTIVE DROPDOWN =====
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