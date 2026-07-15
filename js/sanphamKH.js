
document.getElementById('resetFilter').addEventListener('click', function(e) {
    e.preventDefault();
    window.location.href = window.location.pathname;
});
// Xử lý thêm giỏ hàng
document.addEventListener('click', function(e) {
    // Tìm thẻ product-card gần nhất
    const card = e.target.closest('.product-card');
    if (!card) return;

    // Nếu click vào nút (Thêm giỏ hoặc Yêu thích) thì không chuyển hướng
    if (e.target.closest('.btn-cart') || e.target.closest('.btn-wish')) {
        return;
    }

    // Lấy mã sản phẩm từ data-id
    const productId = card.dataset.id;
    if (productId) {
        window.location.href = 'chitiet.php?id=' + encodeURIComponent(productId);
    }
});