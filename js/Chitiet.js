(function() {
    'use strict';

    // ---- Phóng to ảnh khi click ----
    const productImage = document.querySelector('.product-detail-left img');
    if (productImage) {
        productImage.addEventListener('click', function() {
            this.classList.toggle('zoomed');
        });
    }

    // ---- Lấy các phần tử ----
    const quantityInput = document.getElementById('quantity-input');
    const maxQuantity = parseInt(quantityInput ? quantityInput.getAttribute('max') : 999) || 999;
    const addToCartBtn = document.getElementById('add-to-cart-btn');
    const buyNowBtn = document.getElementById('buy-now-btn');

    // ---- Lấy mã sản phẩm từ data attribute ----
    const productDetail = document.querySelector('.product-detail-right');
    if (!productDetail) return;
    const productId = productDetail.getAttribute('data-product-id');

    // ---- Hàm thêm vào giỏ (dùng fetch) ----
    function addToCart(quantity, redirect = false) {
        const formData = new FormData();
        formData.append('id', productId);
        formData.append('quantity', quantity);

        fetch('ThemGiohang.php', {
            method: 'POST',
            body: formData
        })
        .then(res => {
            if (!res.ok) {
                throw new Error('Lỗi kết nối đến server (HTTP ' + res.status + ')');
            }
            return res.json();
        })
        .then(data => {
            if (data.success) {
                // Cập nhật giỏ hàng (nếu có biến toàn cục)
                if (typeof window.cart !== 'undefined' && Array.isArray(window.cart)) {
                    window.cart.length = 0;
                    if (data.cart_items && Array.isArray(data.cart_items)) {
                        data.cart_items.forEach(item => {
                            window.cart.push({
                                name: item.name,
                                price: parseInt(item.price),
                                quantity: parseInt(item.quantity),
                                icon: item.icon
                            });
                        });
                    }
                }
                // Cập nhật UI nếu có hàm toàn cục
                if (typeof window.updateCartUI === 'function') {
                    window.updateCartUI();
                }
                // Nếu là "Mua ngay" → chuyển đến trang thanh toán với sản phẩm này
                if (redirect) {
                    // Chuyển đến trang thanh toán với ids = sản phẩm hiện tại
                    window.location.href = 'Thanhtoan.php?ids=' + encodeURIComponent(productId);
                } else {
                    // "Thêm vào giỏ" → mở giỏ hàng (nếu có hàm)
                    if (typeof window.openCart === 'function') {
                        window.openCart();
                    }
                    alert('Đã thêm sản phẩm vào giỏ hàng!');
                }
            } else {
                alert(data.message || 'Có lỗi xảy ra khi thêm vào giỏ hàng.');
            }
        })
        .catch(error => {
            console.error('Lỗi:', error);
            alert('Không thể kết nối đến server. Vui lòng thử lại.');
        });
    }

    // ---- Sự kiện cho nút "Thêm vào giỏ" ----
    if (addToCartBtn) {
        addToCartBtn.addEventListener('click', function(e) {
            e.preventDefault();
            let qty = parseInt(quantityInput ? quantityInput.value : 1);
            if (isNaN(qty) || qty < 1) qty = 1;
            if (qty > maxQuantity) {
                alert('Số lượng vượt quá tồn kho!');
                return;
            }
            addToCart(qty, false);
        });
    }

    // ---- Sự kiện cho nút "Mua ngay" ----
    if (buyNowBtn) {
        buyNowBtn.addEventListener('click', function(e) {
            e.preventDefault();
            let qty = parseInt(quantityInput ? quantityInput.value : 1);
            if (isNaN(qty) || qty < 1) qty = 1;
            if (qty > maxQuantity) {
                alert('Số lượng vượt quá tồn kho!');
                return;
            }
            addToCart(qty, true);
        });
    }

    // ---- Tự động kiểm tra số lượng khi thay đổi ----
    if (quantityInput) {
        quantityInput.addEventListener('change', function() {
            let val = parseInt(this.value);
            if (isNaN(val) || val < 1) this.value = 1;
            if (val > maxQuantity) {
                alert('Chỉ còn ' + maxQuantity + ' sản phẩm trong kho');
                this.value = maxQuantity;
            }
        });
    }

    // ---- Cuộn đến chi tiết nếu có hash ----
    if (window.location.hash === '#product-detail') {
        const detail = document.querySelector('.product-detail');
        if (detail) {
            setTimeout(() => {
                detail.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 300);
        }
    }

    console.log('Chitiet.js đã được cập nhật');
})();