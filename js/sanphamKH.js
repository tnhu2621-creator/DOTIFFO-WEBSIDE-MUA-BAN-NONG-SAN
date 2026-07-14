
document.getElementById('resetFilter').addEventListener('click', function(e) {
    e.preventDefault();
    window.location.href = window.location.pathname;
});
// Xử lý thêm giỏ hàng
document.addEventListener('click', function(e) {
    const btn = e.target.closest('.btn-cart');
    if (!btn) return;
    e.preventDefault();

    const productId = btn.dataset.id; // Lấy mã sản phẩm
    // Nếu không có data-id, thử lấy từ thuộc tính khác
    if (!productId) {
        // Có thể lấy từ data-name? Nhưng bạn cần mã sản phẩm để gửi lên server.
        // Hiện tại nút chỉ có data-name, data-price, data-icon. Bạn cần thêm data-id vào nút.
        // Hoặc bạn có thể lấy từ một thuộc tính khác, như data-masp.
        // Vì không có, ta sẽ dùng data-name (không an toàn nếu trùng tên)
        // Tốt nhất bạn nên sửa trong PHP thêm data-id.
        showToast('Lỗi: thiếu mã sản phẩm');
        return;
    }

    const quantity = 1; // mặc định

    fetch('ThemGiohang.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `id=${encodeURIComponent(productId)}&quantity=${quantity}`
    })
    .then(res => res.json())
    .then(response => {
        if (response.success) {
            // Cập nhật giỏ hàng từ server
            if (typeof window.setCartData === 'function') {
                window.setCartData(response.cart_items);
            } else {
                // Fallback: reload trang
                location.reload();
            }
            // Hiển thị thông báo (nếu hàm showToast có sẵn)
            if (typeof showToast === 'function') {
                showToast('Đã thêm vào giỏ hàng!');
            } else {
                alert('Đã thêm vào giỏ hàng!');
            }
            // Mở sidebar giỏ hàng (nếu có)
            if (typeof openCart === 'function') {
                openCart();
            }
        } else {
            // Xử lý lỗi
            if (typeof showToast === 'function') {
                showToast(response.message || 'Lỗi thêm giỏ hàng');
            } else {
                alert(response.message || 'Lỗi thêm giỏ hàng');
            }
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Có lỗi xảy ra');
    });
});