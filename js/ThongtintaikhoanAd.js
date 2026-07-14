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
    const avatarInput = document.getElementById('avatarInput');

    // Avatar Modal
    const avatarModal = document.getElementById('avatarModal');
    const avatarGrid = document.getElementById('avatarGrid');
    const avatarModalClose = document.getElementById('avatarModalClose');
    const avatarModalCancel = document.getElementById('avatarModalCancel');
    const btnUploadAvatar = document.getElementById('btnUploadAvatar');
    const avatarUploadInput = document.getElementById('avatarUploadInput');

    // Toast
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toastMessage');

    // ===== AVATAR SAMPLE DATA =====
    const avatarSamples = [
        { id: 1, icon: 'fa-user-tie', bg: '#008919' },
        { id: 2, icon: 'fa-user-tie', bg: '#FF0090' },
        { id: 3, icon: 'fa-user-tie', bg: '#2563eb' },
        { id: 4, icon: 'fa-user-tie', bg: '#f59e0b' },
        { id: 5, icon: 'fa-user-tie', bg: '#dc2626' },
        { id: 6, icon: 'fa-user-astronaut', bg: '#7c3aed' },
        { id: 7, icon: 'fa-user-ninja', bg: '#ea580c' },
        { id: 8, icon: 'fa-user-secret', bg: '#0d9488' },
        { id: 9, icon: 'fa-user-graduate', bg: '#1e293b' },
        { id: 10, icon: 'fa-user-tie', bg: '#6b7280' },
    ];
    let selectedAvatarId = null;

    // ===== HELPERS =====
    function showToast(message, type = 'success') {
        toastMsg.textContent = message;
        toast.className = 'toast show';
        if (type === 'error') {
            toast.style.borderLeftColor = '#dc3545';
        } else {
            toast.style.borderLeftColor = '#FF0090';
        }
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
        const savedAvatar = localStorage.getItem('adminAvatar');
        if (savedAvatar) {
            avatarPreview.src = savedAvatar;
        }
    }

    function saveAvatar(imageData) {
        try {
            localStorage.setItem('adminAvatar', imageData);
            avatarPreview.src = imageData;
            showToast('Đã cập nhật ảnh đại diện!');
            closeAvatarModal();
        } catch (e) {
            showToast('Không thể lưu ảnh. Vui lòng thử lại.', 'error');
        }
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
        ctx.fillText('\uf0d0', 60, 64);

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
                <i class="fas ${sample.icon}" style="color:#fff; font-size:2rem;"></i>
                <div class="check-mark"><i class="fas fa-check"></i></div>
            `;
            if (selectedAvatarId === sample.id) {
                div.classList.add('selected');
            }
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
        if (e.target === avatarModal) {
            closeAvatarModal();
        }
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
                if (content.id === `tab-${tabId}`) {
                    content.classList.add('active');
                }
            });
        });
    });

    // ===== TOGGLE PASSWORD =====
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

        if (!fullname || !email) {
            showFormMessage(profileMessage, 'Vui lòng điền đầy đủ họ tên và email.', 'error');
            return;
        }

        if (!email.includes('@')) {
            showFormMessage(profileMessage, 'Email không hợp lệ.', 'error');
            return;
        }

        // Cập nhật tên hiển thị
        const avatarNameEl = document.querySelector('.avatar-name');
        if (avatarNameEl) avatarNameEl.textContent = fullname;

        console.log('Cập nhật thông tin admin:', { fullname, email, phone });
        showFormMessage(profileMessage, '✅ Cập nhật thông tin thành công!', 'success');
        showToast('Đã cập nhật thông tin cá nhân!');
    });

    // ===== CHANGE PASSWORD =====
    passwordForm.addEventListener('submit', function(e) {
        e.preventDefault();

        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (!currentPassword || !newPassword || !confirmPassword) {
            showFormMessage(passwordMessage, 'Vui lòng điền đầy đủ các trường.', 'error');
            return;
        }

        if (newPassword.length < 6) {
            showFormMessage(passwordMessage, 'Mật khẩu mới phải có ít nhất 6 ký tự.', 'error');
            return;
        }

        if (newPassword !== confirmPassword) {
            showFormMessage(passwordMessage, 'Mật khẩu xác nhận không khớp.', 'error');
            return;
        }

        console.log('Đổi mật khẩu admin thành công');
        showFormMessage(passwordMessage, '✅ Đổi mật khẩu thành công!', 'success');
        passwordForm.reset();
        showToast('Mật khẩu đã được thay đổi!');
    });

    // ===== SIDEBAR TOGGLE =====
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');

    if (menuToggle) {
        menuToggle.addEventListener('click', function(e) {
            e.stopPropagation();
            if (sidebar) sidebar.classList.toggle('open');
        });
    }

    document.addEventListener('click', function(e) {
        if (window.innerWidth <= 480) {
            if (sidebar && sidebar.classList.contains('open')) {
                if (!sidebar.contains(e.target) && e.target !== menuToggle) {
                    sidebar.classList.remove('open');
                }
            }
        }
    });

    // ===== INIT =====
    loadAvatar();
    console.log('👤 Thông tin tài khoản Admin đã sẵn sàng!');
})();