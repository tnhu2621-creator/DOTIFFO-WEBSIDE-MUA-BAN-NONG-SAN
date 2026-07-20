(function() {
    'use strict';

    // ===== DOM REFS =====
    const tabBtns = document.querySelectorAll('.tab-btn');
    const profileForm = document.getElementById('profileForm');
    const passwordForm = document.getElementById('passwordForm');
    const profileMessage = document.getElementById('profileMessage');
    const passwordMessage = document.getElementById('passwordMessage');
    const avatarPreview = document.getElementById('avatarPreview');
    const avatarWrapper = document.getElementById('avatarWrapper');
    const btnChangeAvatar = document.getElementById('btnChangeAvatar');

    const avatarModal = document.getElementById('avatarModal');
    const avatarGrid = document.getElementById('avatarGrid');
    const avatarModalClose = document.getElementById('avatarModalClose');
    const avatarModalCancel = document.getElementById('avatarModalCancel');
    const btnUploadAvatar = document.getElementById('btnUploadAvatar');
    const avatarUploadInput = document.getElementById('avatarUploadInput');

    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toastMessage');

    // ===== AVATAR SAMPLE DATA =====
    const avatarSamples = [
        { id: 1, icon: 'fa-user', bg: '#008919', label: 'Xanh lá' },
        { id: 2, icon: 'fa-user', bg: '#FF0090', label: 'Hồng' },
        { id: 3, icon: 'fa-user', bg: '#2563eb', label: 'Xanh dương' },
        { id: 4, icon: 'fa-user', bg: '#f59e0b', label: 'Vàng' },
        { id: 5, icon: 'fa-user', bg: '#dc2626', label: 'Đỏ' },
        { id: 6, icon: 'fa-user-astronaut', bg: '#7c3aed', label: 'Tím' },
        { id: 7, icon: 'fa-user-ninja', bg: '#ea580c', label: 'Cam' },
        { id: 8, icon: 'fa-user-secret', bg: '#0d9488', label: 'Xanh ngọc' },
        { id: 9, icon: 'fa-user-tie', bg: '#1e293b', label: 'Xanh đậm' },
        { id: 10, icon: 'fa-user-graduate', bg: '#6b7280', label: 'Xám' },
    ];

    let selectedAvatarId = null;

    // ===== HELPERS =====
    function showToast(message, type = 'success') {
        toastMsg.textContent = message;
        toast.className = 'toast show';
        toast.style.borderLeftColor = type === 'error' ? '#dc3545' : 'var(--pink)';
        clearTimeout(toast._timer);
        toast._timer = setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    function showFormMessage(element, message, type = 'success') {
        if (!element) return;
        element.textContent = message;
        element.className = 'form-message ' + type;
        element.style.display = 'block';
        clearTimeout(element._timer);
        element._timer = setTimeout(() => {
            element.style.display = 'none';
        }, 5000);
    }

    // ===== AVATAR FUNCTIONS =====
    // KHÔNG dùng localStorage nữa → hoàn toàn dựa vào server

    function saveAvatar(imageData) {
        const formData = new FormData();
        formData.append('update_avatar', '1');
        formData.append('avatar', imageData);

        fetch(window.location.href, {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const newAvatar = data.avatar || imageData;
                // Thêm timestamp vào URL để tránh cache
                avatarPreview.src = newAvatar + '?v=' + Date.now();
                const avatarHidden = document.getElementById('avatarHidden');
                if (avatarHidden) avatarHidden.value = newAvatar;
                showToast('Đã cập nhật ảnh đại diện!');
                closeAvatarModal();
                // Reload trang để đồng bộ session và header
                setTimeout(() => window.location.reload(), 500);
            } else {
                showToast('Lỗi: ' + (data.message || 'Không thể cập nhật'), 'error');
            }
        })
        .catch(error => {
            showToast('Lỗi kết nối server', 'error');
            console.error(error);
        });
    }

    function selectAvatarSample(sample) {
        const canvas = document.createElement('canvas');
        canvas.width = 120;
        canvas.height = 120;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = sample.bg;
        ctx.beginPath();
        ctx.arc(60, 60, 60, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = '50px "Font Awesome 6 Free"';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('\uf007', 60, 64);
        const imageData = canvas.toDataURL('image/png');
        sample.url = imageData;
        selectedAvatarId = sample.id;
        saveAvatar(imageData);
    }

    function renderAvatarGrid() {
        avatarGrid.innerHTML = '';
        avatarSamples.forEach(sample => {
            const div = document.createElement('div');
            div.className = 'avatar-option';
            div.style.background = sample.bg;
            div.innerHTML = `
                <i class="fas ${sample.icon}" style="color:#fff; font-size:2.2rem;"></i>
                <div class="check-mark"><i class="fas fa-check"></i></div>
            `;
            if (selectedAvatarId === sample.id) div.classList.add('selected');
            div.addEventListener('click', function() {
                document.querySelectorAll('.avatar-option').forEach(el => el.classList.remove('selected'));
                this.classList.add('selected');
                selectAvatarSample(sample);
            });
            avatarGrid.appendChild(div);
        });
    }

    function openAvatarModal() {
        renderAvatarGrid();
        avatarModal.classList.add('open');
    }

    function closeAvatarModal() {
        avatarModal.classList.remove('open');
    }

    // ===== AVATAR EVENTS =====
    avatarWrapper.addEventListener('click', function(e) {
        e.stopPropagation();
        openAvatarModal();
    });
    btnChangeAvatar.addEventListener('click', function(e) {
        e.stopPropagation();
        openAvatarModal();
    });
    avatarModalClose.addEventListener('click', closeAvatarModal);
    avatarModalCancel.addEventListener('click', closeAvatarModal);
    avatarModal.addEventListener('click', function(e) {
        if (e.target === avatarModal) closeAvatarModal();
    });

    btnUploadAvatar.addEventListener('click', function() {
        avatarUploadInput.click();
    });
    avatarUploadInput.addEventListener('change', function(e) {
        const file = this.files[0];
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) {
            showToast('Ảnh quá lớn. Vui lòng chọn ảnh dưới 2MB.', 'error');
            this.value = '';
            return;
        }
        if (!file.type.startsWith('image/')) {
            showToast('Vui lòng chọn file ảnh (JPG, PNG, GIF).', 'error');
            this.value = '';
            return;
        }
        const reader = new FileReader();
        reader.onload = function(e) {
            const imageData = e.target.result;
            selectedAvatarId = null;
            saveAvatar(imageData);
            closeAvatarModal();
        };
        reader.onerror = function() {
            showToast('Không thể đọc file. Vui lòng thử lại.', 'error');
        };
        reader.readAsDataURL(file);
        this.value = '';
    });

    // ===== TAB SWITCH =====
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            tabBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            const tabId = this.dataset.tab;
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
                if (content.id === `tab-${tabId}`) content.classList.add('active');
            });
        });
    });

    // ===== TOGGLE PASSWORD VISIBILITY =====
    document.querySelectorAll('.toggle-password').forEach(btn => {
        btn.addEventListener('click', function() {
            const targetId = this.dataset.target;
            const input = document.getElementById(targetId);
            if (!input) return;
            const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
            input.setAttribute('type', type);
            const icon = this.querySelector('i');
            if (icon) {
                icon.classList.toggle('fa-eye');
                icon.classList.toggle('fa-eye-slash');
            }
        });
    });

    // ===== UPDATE PROFILE =====
    profileForm.addEventListener('submit', function(e) {
        const fullname = document.getElementById('fullname').value.trim();
        const email = document.getElementById('email').value.trim();

        if (!fullname || !email) {
            e.preventDefault();
            showFormMessage(profileMessage, 'Vui lòng điền đầy đủ họ tên và email.', 'error');
            return;
        }
        if (!email.includes('@')) {
            e.preventDefault();
            showFormMessage(profileMessage, 'Email không hợp lệ.', 'error');
            return;
        }
        // Cho phép form submit bình thường
    });

    // ===== CHANGE PASSWORD =====
    passwordForm.addEventListener('submit', function(e) {
        const current = document.getElementById('currentPassword').value;
        const newPass = document.getElementById('newPassword').value;
        const confirm = document.getElementById('confirmPassword').value;

        if (!current || !newPass || !confirm) {
            e.preventDefault();
            showFormMessage(passwordMessage, 'Vui lòng điền đầy đủ các trường.', 'error');
            return;
        }
        if (newPass.length < 6) {
            e.preventDefault();
            showFormMessage(passwordMessage, 'Mật khẩu mới phải có ít nhất 6 ký tự.', 'error');
            return;
        }
        if (newPass !== confirm) {
            e.preventDefault();
            showFormMessage(passwordMessage, 'Mật khẩu xác nhận không khớp.', 'error');
            return;
        }
        // Cho phép form submit
    });

    // ===== INIT =====
    console.log('👤 Trang thông tin tài khoản đã sẵn sàng!');
})();