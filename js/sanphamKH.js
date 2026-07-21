// ===== KHÔNG ĐỊNH NGHĨA LẠI window.addToCart (dùng từ header.js) =====
// Chỉ giữ các sự kiện riêng cho trang sản phẩm

// ===== SỰ KIỆN CLICK VÀO SẢN PHẨM (CHUYỂN ĐẾN CHI TIẾT) =====
document.addEventListener('click', function(e) {
    const card = e.target.closest('.product-card');
    if (!card) return;

    // Nếu click vào nút (Thêm giỏ hoặc Yêu thích) thì không chuyển hướng
    if (e.target.closest('.btn-cart') || e.target.closest('.btn-wish')) {
        return;
    }

    const productId = card.dataset.id;
    if (productId) {
        window.location.href = 'Chitiet.php?id=' + encodeURIComponent(productId);
    }
});

// ===== RESET BỘ LỌC =====
document.getElementById('resetFilter').addEventListener('click', function(e) {
    e.preventDefault();
    window.location.href = window.location.pathname;
});