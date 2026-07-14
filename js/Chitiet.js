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
    const cartCountElement = document.querySelector('.cart-count'); // đổi tên cho phù hợp với header

    // ---- Lấy mã sản phẩm từ data attribute ----
    const productDetail = document.querySelector('.product-detail-right');
    if (!productDetail) return;
    const productId = productDetail.getAttribute('data-product-id');

    // ---- Hàm thêm vào giỏ (dùng fetch) ----
    function addToCart(quantity, redirect = false) {
        const formData = new FormData();
        formData.append('id', productId);
        formData.append('quantity', quantity);

        // Ví dụ logic xử lý nút Thêm vào giỏ hàng bằng JS của bạn
        fetch('ThemGiohang.php', {
            method: 'POST',
            body: formData
        })
        .then(res => res.json())
        .then(data => {
            if(data.success) {
                // Cập nhật mảng giỏ hàng toàn cục trong header.js từ dữ liệu MySQL vừa trả về
                cart.length = 0;
                data.cart_items.forEach(item => {
                    cart.push({
                        name: item.name,
                        price: parseInt(item.price),
                        quantity: parseInt(item.quantity),
                        icon: item.icon
                    });
                });

                // Vẽ lại giao diện sidebar và cập nhật badge
                updateCartUI(); 
                openCart();
            } else {
                alert(data.message);
            }
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