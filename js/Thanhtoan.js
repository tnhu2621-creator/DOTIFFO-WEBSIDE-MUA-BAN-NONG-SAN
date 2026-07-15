document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('checkoutForm');
    if (form) {
        form.addEventListener('submit', function(e) {
            const hoTen = document.getElementById('hoTen').value.trim();
            const soDienThoai = document.getElementById('soDienThoai').value.trim();
            const diaChi = document.getElementById('diaChi').value.trim();

            if (!hoTen || !soDienThoai || !diaChi) {
                e.preventDefault();
                alert('Vui lòng điền đầy đủ thông tin giao hàng.');
                return false;
            }

            if (!/^[0-9]{10,11}$/.test(soDienThoai)) {
                e.preventDefault();
                alert('Số điện thoại không hợp lệ (10-11 chữ số).');
                return false;
            }

            return true;
        });
    }
});