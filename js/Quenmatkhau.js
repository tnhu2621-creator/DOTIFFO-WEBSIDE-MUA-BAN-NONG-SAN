(function() {
    'use strict';

    // ===== DOM REFS =====
    const form = document.getElementById('forgotForm');
    const emailInput = document.getElementById('email');
    const formMessage = document.getElementById('formMessage');
    const stepEmail = document.getElementById('stepEmail');
    const stepSuccess = document.getElementById('stepSuccess');
    const sentEmail = document.getElementById('sentEmail');

    // Toast
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toastMessage');

    // ===== HELPERS =====
    function showToast(message, type = 'success') {
        toastMsg.textContent = message;
        toast.className = 'toast show';
        if (type === 'error') {
            toast.style.borderLeftColor = '#dc3545';
        } else {
            toast.style.borderLeftColor = 'var(--pink)';
        }
        clearTimeout(toast._timer);
        toast._timer = setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    function showFormMessage(message, type = 'error') {
        formMessage.textContent = message;
        formMessage.className = 'form-message ' + type;
        formMessage.style.display = 'block';
        clearTimeout(formMessage._timer);
        formMessage._timer = setTimeout(() => {
            formMessage.style.display = 'none';
        }, 5000);
    }

    function validateEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    // ===== HANDLE SUBMIT =====
    form.addEventListener('submit', function(e) {
        e.preventDefault();

        const email = emailInput.value.trim();

        // Reset message
        formMessage.style.display = 'none';

        // Validate
        if (!email) {
            showFormMessage('Vui lòng nhập địa chỉ email.', 'error');
            emailInput.focus();
            return;
        }

        if (!validateEmail(email)) {
            showFormMessage('Email không hợp lệ. Vui lòng kiểm tra lại.', 'error');
            emailInput.focus();
            return;
        }

        // Giả lập gửi yêu cầu thành công
        // Trong thực tế, sẽ gửi request đến server tại đây
        console.log('📧 Gửi yêu cầu đặt lại mật khẩu cho:', email);

        // Ẩn form, hiển thị thông báo thành công
        stepEmail.style.display = 'none';
        sentEmail.textContent = email;
        stepSuccess.style.display = 'block';

        showToast('📧 Link đặt lại mật khẩu đã được gửi đến email của bạn!');
    });

    // ===== SIDEBAR TOGGLE (cho header mobile) =====
    // Header.js đã xử lý phần này, không cần thêm

    console.log('🔑 Trang quên mật khẩu đã sẵn sàng!');
})();