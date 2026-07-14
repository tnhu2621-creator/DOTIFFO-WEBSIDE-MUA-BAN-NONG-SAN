(function() {
    'use strict';

    // ===== FORM LIÊN HỆ =====
    const form = document.getElementById('contactForm');
    const formMessage = document.getElementById('formMessage');

    form.addEventListener('submit', function(e) {
        e.preventDefault();

        // Lấy dữ liệu
        const name = document.getElementById('contactName').value.trim();
        const email = document.getElementById('contactEmail').value.trim();
        const phone = document.getElementById('contactPhone').value.trim();
        const subject = document.getElementById('contactSubject').value;
        const message = document.getElementById('contactMessage').value.trim();

        // Validation cơ bản
        if (!name || !email || !message) {
            showFormMessage('Vui lòng điền đầy đủ các trường bắt buộc.', 'error');
            return;
        }

        if (!validateEmail(email)) {
            showFormMessage('Vui lòng nhập địa chỉ email hợp lệ.', 'error');
            return;
        }

        // Giả lập gửi thành công
        console.log('Dữ liệu liên hệ:', { name, email, phone, subject, message });

        showFormMessage('✅ Cảm ơn bạn! Tin nhắn của bạn đã được gửi thành công.', 'success');
        form.reset();

        // Tự động ẩn thông báo sau 5s
        setTimeout(() => {
            formMessage.style.display = 'none';
        }, 5000);
    });

    function validateEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    function showFormMessage(text, type) {
        formMessage.textContent = text;
        formMessage.className = 'form-message ' + type;
        formMessage.style.display = 'block';
    }

    // ===== GIỎ HÀNG (tích hợp giống các trang khác) =====
    let cart = [];

    const cartBadge = document.getElementById('cartBadge');
    const cartItems = document.getElementById('cartItems');
    const cartTotal = document.getElementById('cartTotal');
    const cartOverlay = document.getElementById('cartOverlay');
    const cartSidebar = document.getElementById('cartSidebar');
    const cartToggle = document.getElementById('cartToggle');
    const cartClose = document.getElementById('cartClose');
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toastMessage');

    function formatPrice(price) {
        return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') + ' đ';
    }

    function showToast(message) {
        toastMsg.textContent = message;
        toast.classList.add('show');
        clearTimeout(toast._timer);
        toast._timer = setTimeout(() => toast.classList.remove('show'), 2600);
    }

    function openCart() {
        cartOverlay.classList.add('open');
        cartSidebar.classList.add('open');
        document.body.style.overflow = 'hidden';
    }

    function closeCart() {
        cartOverlay.classList.remove('open');
        cartSidebar.classList.remove('open');
        document.body.style.overflow = '';
    }

    function updateCartUI() {
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
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
            html += `
                <li class="cart-item" data-index="${index}">
                    <div class="cart-item-img"><i class="fas ${item.icon || 'fa-box'}"></i></div>
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

    function changeQuantity(index, delta) {
        if (index < 0 || index >= cart.length) return;
        cart[index].quantity += delta;
        if (cart[index].quantity <= 0) cart.splice(index, 1);
        updateCartUI();
        saveCart();
    }

    function removeItem(index) {
        if (index < 0 || index >= cart.length) return;
        cart.splice(index, 1);
        updateCartUI();
        saveCart();
        showToast('Đã xóa sản phẩm khỏi giỏ hàng');
    }

    function saveCart() {
        try { localStorage.setItem('dotifood_cart', JSON.stringify(cart)); } catch(e) {}
    }

    function loadCart() {
        try {
            const data = localStorage.getItem('dotifood_cart');
            if (data) {
                const parsed = JSON.parse(data);
                cart.length = 0;
                parsed.forEach(item => cart.push(item));
                updateCartUI();
            }
        } catch(e) {}
    }

    // Sự kiện giỏ hàng
    if (cartToggle) {
        cartToggle.addEventListener('click', function(e) {
            e.preventDefault();
            openCart();
        });
    }

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
            const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
            showToast(`🧾 Cảm ơn bạn! Tổng đơn hàng: ${formatPrice(total)}`);
            setTimeout(() => {
                cart.length = 0;
                updateCartUI();
                saveCart();
                closeCart();
                showToast('Đơn hàng đã được gửi! 🎉');
            }, 1200);
        });
    }

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            if (cartSidebar && cartSidebar.classList.contains('open')) {
                closeCart();
            }
        }
    });

    // ===== KHỞI TẠO =====
    loadCart();
    if (cart.length === 0 && cartBadge) {
        cartBadge.style.display = 'none';
    }

    // Export các hàm để header.js có thể gọi
    window.openCart = openCart;
    window.closeCart = closeCart;
    window.updateCartUI = updateCartUI;
    window.showToast = showToast;

    console.log('📬 Trang Liên hệ DOTIFOOD đã sẵn sàng');
})();