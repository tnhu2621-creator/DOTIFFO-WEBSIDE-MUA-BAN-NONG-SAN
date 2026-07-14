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
    function loadAvatar() {
        const savedAvatar = localStorage.getItem('userAvatar');
        if (savedAvatar) {
            avatarPreview.src = savedAvatar;
            avatarSamples.forEach(sample => {
                if (savedAvatar === sample.url) {
                    selectedAvatarId = sample.id;
                }
            });
        }
    }

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
                avatarPreview.src = imageData;
                const avatarHidden = document.getElementById('avatarHidden');
                if (avatarHidden) avatarHidden.value = imageData;
                localStorage.setItem('userAvatar', imageData);
                showToast('Đã cập nhật ảnh đại diện!');
                closeAvatarModal();
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
        e.preventDefault();
        const fullname = document.getElementById('fullname').value.trim();
        const email = document.getElementById('email').value.trim();
        const phone = document.getElementById('phone').value.trim();
        const address = document.getElementById('address').value.trim();

        if (!fullname || !email) {
            showFormMessage(profileMessage, 'Vui lòng điền đầy đủ họ tên và email.', 'error');
            return;
        }
        if (!email.includes('@')) {
            showFormMessage(profileMessage, 'Email không hợp lệ.', 'error');
            return;
        }

        const avatarNameEl = document.querySelector('.avatar-name');
        if (avatarNameEl) avatarNameEl.textContent = fullname;

        if (!localStorage.getItem('userAvatar')) {
            const newAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(fullname)}&background=008919&color=fff&size=120`;
            avatarPreview.src = newAvatar;
            try { localStorage.setItem('userAvatar', newAvatar); } catch(e) {}
        }

        console.log('Cập nhật thông tin:', { fullname, email, phone, address });
        showFormMessage(profileMessage, '✅ Cập nhật thông tin thành công!', 'success');
        showToast('Đã cập nhật thông tin cá nhân!');
        // Không reload vì form sẽ gửi thực tế nếu bỏ e.preventDefault()? 
        // Ở đây profileForm vẫn dùng e.preventDefault() và không gửi form, nhưng bạn có thể thay đổi nếu muốn.
        // Tôi giữ nguyên cho profile vì không ảnh hưởng đến yêu cầu hiện tại.
    });

    // ===== CHANGE PASSWORD (đã sửa để gửi form) =====
    passwordForm.addEventListener('submit', function(e) {
        // Không dùng e.preventDefault() để form gửi đi bình thường
        // Nhưng vẫn kiểm tra client trước khi submit

        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        // Nếu có lỗi client thì chặn submit và hiển thị lỗi
        if (!currentPassword || !newPassword || !confirmPassword) {
            e.preventDefault();
            showFormMessage(passwordMessage, 'Vui lòng điền đầy đủ các trường.', 'error');
            return;
        }
        if (newPassword.length < 6) {
            e.preventDefault();
            showFormMessage(passwordMessage, 'Mật khẩu mới phải có ít nhất 6 ký tự.', 'error');
            return;
        }
        if (newPassword !== confirmPassword) {
            e.preventDefault();
            showFormMessage(passwordMessage, 'Mật khẩu xác nhận không khớp.', 'error');
            return;
        }

        console.log('Đang gửi form đổi mật khẩu...');
        // Không có e.preventDefault() ở đây → form sẽ submit.
    });

    // ===== INIT =====
    loadAvatar();
    console.log('👤 Trang thông tin tài khoản đã sẵn sàng!');
})();