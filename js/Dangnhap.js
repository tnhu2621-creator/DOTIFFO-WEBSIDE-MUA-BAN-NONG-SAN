(function() {
    'use strict';

    // ---- HIỂN THỊ / ẨN MẬT KHẨU ----
    const togglePasswordBtn = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('loginPassword');

    if (togglePasswordBtn && passwordInput) {
        togglePasswordBtn.addEventListener('click', function() {
            const isPassword = passwordInput.type === 'password';
            // Chuyển đổi kiểu input
            passwordInput.type = isPassword ? 'text' : 'password';
            // Đổi icon
            const icon = this.querySelector('i');
            if (isPassword) {
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            } else {
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            }
        });
    }

    // ---- XỬ LÝ SUBMIT FORM (kiểm tra trống) ----
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            const username = document.getElementById('loginUsername');
            const password = document.getElementById('loginPassword');

            let error = '';
            if (!username.value.trim()) {
                error = 'Vui lòng nhập tên đăng nhập hoặc email.';
                username.focus();
            } else if (!password.value.trim()) {
                error = 'Vui lòng nhập mật khẩu.';
                password.focus();
            }

            if (error) {
                e.preventDefault();
                // Hiển thị lỗi bằng alert (hoặc có thể cải tiến thành toast)
                alert(error);
                return false;
            }
            return true;
        });
    }

    console.log('Dangnhap.js đã sẵn sàng');
})();