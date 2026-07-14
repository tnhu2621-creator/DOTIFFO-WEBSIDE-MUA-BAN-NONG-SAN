(function() {
    'use strict';

    // ===== DOM REFS =====
    const form = document.getElementById('registerForm');
    const fullname = document.getElementById('fullname');
    const email = document.getElementById('email');
    const phone = document.getElementById('phone');
    const password = document.getElementById('password');
    const confirmPassword = document.getElementById('confirmPassword');
    const agreeTerms = document.getElementById('agreeTerms');
    const messageDiv = document.getElementById('formMessage');

    // Toggle password visibility
    const togglePassword = document.getElementById('togglePassword');
    const toggleConfirm = document.getElementById('toggleConfirm');

    togglePassword.addEventListener('click', function() {
        const type = password.getAttribute('type') === 'password' ? 'text' : 'password';
        password.setAttribute('type', type);
        this.querySelector('i').classList.toggle('fa-eye');
        this.querySelector('i').classList.toggle('fa-eye-slash');
    });

    toggleConfirm.addEventListener('click', function() {
        const type = confirmPassword.getAttribute('type') === 'password' ? 'text' : 'password';
        confirmPassword.setAttribute('type', type);
        this.querySelector('i').classList.toggle('fa-eye');
        this.querySelector('i').classList.toggle('fa-eye-slash');
    });

    // ===== VALIDATION =====
    function showMessage(text, type) {
        messageDiv.textContent = text;
        messageDiv.className = 'form-message ' + type;
        messageDiv.style.display = 'block';
        // Auto hide after 5s
        clearTimeout(messageDiv._timer);
        messageDiv._timer = setTimeout(() => {
            messageDiv.style.display = 'none';
        }, 5000);
    }

    function validateEmail(emailStr) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailStr);
    }

    function validatePhone(phoneStr) {
        if (phoneStr === '') return true; // optional
        return /^[0-9]{10,11}$/.test(phoneStr.replace(/\s/g, ''));
    }

    function validatePassword(pw) {
        return pw.length >= 6;
    }

    // ===== SUBMIT =====
    form.addEventListener('submit', function(e) {
        e.preventDefault();

        // Reset message
        messageDiv.style.display = 'none';

        // Validate
        const nameVal = fullname.value.trim();
        const emailVal = email.value.trim();
        const phoneVal = phone.value.trim();
        const passVal = password.value;
        const confirmVal = confirmPassword.value;

        if (!nameVal) {
            showMessage('Vui lòng nhập họ và tên.', 'error');
            fullname.focus();
            return;
        }

        if (!emailVal || !validateEmail(emailVal)) {
            showMessage('Vui lòng nhập địa chỉ email hợp lệ.', 'error');
            email.focus();
            return;
        }

        if (phoneVal && !validatePhone(phoneVal)) {
            showMessage('Số điện thoại không hợp lệ (10-11 chữ số).', 'error');
            phone.focus();
            return;
        }

        if (!passVal || !validatePassword(passVal)) {
            showMessage('Mật khẩu phải có ít nhất 6 ký tự.', 'error');
            password.focus();
            return;
        }

        if (passVal !== confirmVal) {
            showMessage('Mật khẩu xác nhận không khớp.', 'error');
            confirmPassword.focus();
            return;
        }

        if (!agreeTerms.checked) {
            showMessage('Vui lòng đồng ý với điều khoản sử dụng.', 'error');
            agreeTerms.focus();
            return;
        }

        // ===== ĐĂNG KÝ THÀNH CÔNG (giả lập) =====
        // Ở đây bạn có thể gửi dữ liệu lên server bằng fetch/ajax
        console.log('Đăng ký thành công!', {
            fullname: nameVal,
            email: emailVal,
            phone: phoneVal || '(không cung cấp)',
            password: passVal
        });

        showMessage('🎉 Đăng ký thành công! Chào mừng bạn đến với DOTIFOOD.', 'success');

        // Reset form (tùy chọn)
        // form.reset();

        // Chuyển hướng sau 2 giây (giả lập)
        setTimeout(() => {
            // window.location.href = 'login.html'; // Bỏ comment khi có trang login
            showMessage('Đang chuyển hướng đến trang đăng nhập...', 'success');
        }, 2000);
    });

    // ===== GIỎ HÀNG (tích hợp giống các trang khác) =====
    // Khởi tạo giỏ hàng từ localStorage
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

    function updateCartUI() {
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartBadge.textContent = totalItems;
        cartBadge.style.display = totalItems > 0 ? 'flex' : 'none';

        if (cart.length === 0) {
            cartItems.innerHTML = `<li class="cart-empty"><i class="fas fa-shopping-cart"></i> Giỏ hàng trống<br /><span style="font-size:0.85rem;">Hãy thêm sản phẩm nhé!</span></li>`;
            cartTotal.textContent = '0 đ';
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
        cartTotal.textContent = formatPrice(total);

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

    // Cart events
    cartToggle.addEventListener('click', openCart);
    cartClose.addEventListener('click', closeCart);
    cartOverlay.addEventListener('click', closeCart);

    document.getElementById('checkoutBtn').addEventListener('click', function(e) {
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

    // Mobile menu
    const mobileToggle = document.getElementById('mobileToggle');
    const navMenu = document.getElementById('navMenu');
    mobileToggle.addEventListener('click', function() {
        navMenu.classList.toggle('open');
        const icon = this.querySelector('i');
        icon.classList.toggle('fa-bars');
        icon.classList.toggle('fa-times');
    });
    navMenu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', function() {
            navMenu.classList.remove('open');
            const icon = mobileToggle.querySelector('i');
            if (icon) { icon.classList.add('fa-bars'); icon.classList.remove('fa-times'); }
        });
    });

    // ESC
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            if (cartSidebar.classList.contains('open')) closeCart();
            if (navMenu.classList.contains('open')) {
                navMenu.classList.remove('open');
                const icon = mobileToggle.querySelector('i');
                if (icon) { icon.classList.add('fa-bars'); icon.classList.remove('fa-times'); }
            }
        }
    });

    // Init cart
    loadCart();
    if (cart.length === 0) cartBadge.style.display = 'none';

    console.log('📝 Trang đăng ký DOTIFOOD đã sẵn sàng');
})();