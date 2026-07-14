(function() {
    'use strict';

    // DOM refs
    const tbody = document.getElementById('staffTableBody');
    const searchInput = document.getElementById('searchInput');
    const filterStatus = document.getElementById('filterStatus');
    const staffCount = document.getElementById('staffCount');
    const totalStaff = document.getElementById('totalStaff');
    const totalAdmin = document.getElementById('totalAdmin');
    const totalStaffCount = document.getElementById('totalStaffCount');
    const activeStaff = document.getElementById('activeStaff');
    const prevPageBtn = document.getElementById('prevPage');
    const nextPageBtn = document.getElementById('nextPage');
    const pageInfo = document.getElementById('pageInfo');

    const modal = document.getElementById('staffModal');
    const modalTitle = document.getElementById('modalTitle');
    const editStaffId = document.getElementById('editStaffId');
    const staffName = document.getElementById('staffName');
    const staffEmail = document.getElementById('staffEmail');
    const staffPhone = document.getElementById('staffPhone');
    const staffRole = document.getElementById('staffRole');
    const staffStatus = document.getElementById('staffStatus');
    const staffPassword = document.getElementById('staffPassword');
    const passwordGroup = document.getElementById('passwordGroup');
    const btnAdd = document.getElementById('btnAddStaff');
    const btnSave = document.getElementById('modalSave');
    const btnCancel = document.getElementById('modalCancel');
    const btnClose = document.getElementById('modalClose');

    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toastMessage');

    let staffs = [];
    let currentPage = 1;
    const itemsPerPage = 5;

    // ===== HELPERS =====
    function getRoleClass(role) {
        const map = {
            'Quản trị viên': 'role-admin',
            'Quản lý': 'role-manager',
            'Nhân viên': 'role-staff'
        };
        return map[role] || 'role-staff';
    }

    function getStatusClass(status) {
        return status === 'Hoạt động' ? 'status-active' : 'status-inactive';
    }

    function showToast(message, type = 'success') {
        toastMsg.textContent = message;
        toast.className = 'toast show';
        toast.style.borderLeftColor = type === 'error' ? '#dc3545' : 'var(--pink)';
        clearTimeout(toast._timer);
        toast._timer = setTimeout(() => toast.classList.remove('show'), 3000);
    }

    // ===== CALL API =====
    function callAPI(action, data = null, method = 'GET') {
        const options = {
            method: method,
            headers: { 'Content-Type': 'application/json' }
        };
        if (data) {
            options.body = JSON.stringify(data);
        }
        return fetch(`QuanlyNhanvien.php?action=${action}`, options)
            .then(res => res.json())
            .then(result => {
                if (!result.success) throw new Error(result.message);
                return result;
            });
    }

    // ===== LOAD DATA =====
    function loadStaffs() {
        callAPI('get_staff')
            .then(result => {
                staffs = result.data || [];
                renderTable();
            })
            .catch(err => {
                console.error(err);
                showToast('Lỗi tải dữ liệu: ' + err.message, 'error');
            });
    }

    // ===== UPDATE STATS =====
    function updateStats() {
        totalStaff.textContent = staffs.length;
        totalAdmin.textContent = staffs.filter(s => s.role === 'Quản trị viên').length;
        totalStaffCount.textContent = staffs.filter(s => s.role !== 'Quản trị viên').length;
        activeStaff.textContent = staffs.filter(s => s.status === 'Hoạt động').length;
    }

    // ===== FILTER =====
    function getFilteredData() {
        const keyword = searchInput.value.toLowerCase().trim();
        const status = filterStatus.value;

        return staffs.filter(s => {
            const matchName = s.name.toLowerCase().includes(keyword);
            const matchEmail = s.email.toLowerCase().includes(keyword);
            const matchStatus = status === 'all' || s.status === status;
            return (matchName || matchEmail) && matchStatus;
        });
    }

    // ===== RENDER =====
    function renderTable() {
        const filtered = getFilteredData();
        const totalItems = filtered.length;
        const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;

        if (currentPage > totalPages) currentPage = totalPages;

        const start = (currentPage - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        const pageItems = filtered.slice(start, end);

        staffCount.textContent = `${totalItems} nhân viên`;
        pageInfo.textContent = `Trang ${currentPage} / ${totalPages}`;
        prevPageBtn.disabled = currentPage <= 1;
        nextPageBtn.disabled = currentPage >= totalPages;

        if (pageItems.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align:center; padding:40px; color:var(--gray-400);">
                        <i class="fas fa-users-slash" style="font-size:2rem; display:block; margin-bottom:8px;"></i>
                        Không tìm thấy nhân viên
                    </td>
                </tr>
            `;
            return;
        }

        let html = '';
        pageItems.forEach(s => {
            const isActive = s.status === 'Hoạt động';
            const lockIcon = isActive ? 'fa-lock' : 'fa-unlock';
            const lockColor = isActive ? '#ef4444' : '#10b981';
            const lockTitle = isActive ? 'Khóa tài khoản' : 'Mở khóa tài khoản';

            html += `
                <tr>
                    <td>#${String(s.id).padStart(3, '0')}</td>
                    <td><strong>${s.name}</strong></td>
                    <td>${s.email}</td>
                    <td>${s.phone || '—'}</td>
                    <td><span class="role-badge ${getRoleClass(s.role)}">${s.role}</span></td>
                    <td><span class="status ${getStatusClass(s.status)}">${s.status}</span></td>
                    <td>
                        <button class="action-btn edit" data-action="edit" data-id="${s.id}" title="Sửa thông tin">
                            <i class="fas fa-edit" style="color:#f59e0b;"></i>
                        </button>
                        <button class="action-btn toggle" data-action="toggle" data-id="${s.id}" title="${lockTitle}">
                            <i class="fas ${lockIcon}" style="color:${lockColor};"></i>
                        </button>
                    </td>
                </tr>
            `;
        });
        tbody.innerHTML = html;
        updateStats();
    }

    // ===== XỬ LÝ SỰ KIỆN CLICK TRÊN TBODY (DELEGATION) =====
    tbody.addEventListener('click', function(e) {
        const button = e.target.closest('button');
        if (!button) return;

        const action = button.getAttribute('data-action');
        const id = button.getAttribute('data-id');
        if (!id) return;

        const staffId = Number(id);

        if (action === 'edit') {
            handleEdit(staffId);
        } else if (action === 'toggle') {
            handleToggle(staffId);
        }
    });

    // ===== XỬ LÝ SỬA =====
    function handleEdit(id) {
        const s = staffs.find(item => Number(item.id) === id);
        if (!s) {
            showToast('Không tìm thấy nhân viên để sửa.', 'error');
            return;
        }

        modalTitle.textContent = 'Sửa nhân viên';
        editStaffId.value = s.id;
        staffName.value = s.name;
        staffEmail.value = s.email;
        staffPhone.value = s.phone || '';
        staffRole.value = s.role;
        staffStatus.value = s.status;
        staffPassword.value = '';
        staffPassword.placeholder = 'Nhập mật khẩu mới nếu muốn thay đổi';
        passwordGroup.querySelector('small').textContent = 'Bỏ trống nếu không muốn thay đổi mật khẩu.';
        modal.classList.add('open');
    }

    // ===== XỬ LÝ KHÓA / MỞ KHÓA =====
    function handleToggle(id) {
        const s = staffs.find(item => Number(item.id) === id);
        if (!s) {
            showToast('Không tìm thấy nhân viên.', 'error');
            return;
        }

        const isActive = s.status === 'Hoạt động';
        const actionText = isActive ? 'khóa' : 'mở khóa';
        const confirmMsg = `Bạn có chắc muốn ${actionText} tài khoản "${s.name}"?`;

        if (!confirm(confirmMsg)) return;

        callAPI('toggle_staff', { id: id }, 'POST')
            .then(result => {
                s.status = result.data.newStatus;
                renderTable();
                showToast(`Đã ${actionText} tài khoản "${s.name}"`);
            })
            .catch(err => showToast(err.message, 'error'));
    }

    // ===== RESET FORM =====
    function resetForm() {
        editStaffId.value = '';
        staffName.value = '';
        staffEmail.value = '';
        staffPhone.value = '';
        staffRole.value = 'Nhân viên';
        staffStatus.value = 'Hoạt động';
        staffPassword.value = '';
        staffPassword.placeholder = 'Ít nhất 6 ký tự';
        passwordGroup.querySelector('small').textContent = 'Nhập mật khẩu khi thêm mới. Bỏ trống nếu không muốn thay đổi khi sửa.';
        modalTitle.textContent = 'Thêm nhân viên';
    }

    // ===== SAVE =====
    function saveStaff() {
        const name = staffName.value.trim();
        const email = staffEmail.value.trim();
        const phone = staffPhone.value.trim();
        const role = staffRole.value;
        const status = staffStatus.value;
        const password = staffPassword.value;
        const id = parseInt(editStaffId.value);

        if (!name || !email) {
            showToast('Vui lòng điền đầy đủ họ tên và email.', 'error');
            return;
        }
        if (!email.includes('@')) {
            showToast('Email không hợp lệ.', 'error');
            return;
        }

        const payload = { name, email, phone, role, status, password };
        let action = 'add_staff';
        if (id) {
            action = 'update_staff';
            payload.id = id;
        }

        callAPI(action, payload, 'POST')
            .then(result => {
                modal.classList.remove('open');
                resetForm();
                loadStaffs();
                showToast(result.message);
            })
            .catch(err => showToast(err.message, 'error'));
    }

    // ===== PAGINATION =====
    prevPageBtn.addEventListener('click', function() {
        if (currentPage > 1) { currentPage--; renderTable(); }
    });

    nextPageBtn.addEventListener('click', function() {
        const filtered = getFilteredData();
        const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
        if (currentPage < totalPages) { currentPage++; renderTable(); }
    });

    // ===== SEARCH & FILTER =====
    searchInput.addEventListener('input', function() {
        currentPage = 1;
        renderTable();
    });

    filterStatus.addEventListener('change', function() {
        currentPage = 1;
        renderTable();
    });

    // ===== MODAL EVENTS =====
    btnAdd.addEventListener('click', function() {
        resetForm();
        modal.classList.add('open');
    });

    btnSave.addEventListener('click', saveStaff);

    btnCancel.addEventListener('click', function() {
        modal.classList.remove('open');
        resetForm();
    });

    btnClose.addEventListener('click', function() {
        modal.classList.remove('open');
        resetForm();
    });

    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.classList.remove('open');
            resetForm();
        }
    });

    // ===== SIDEBAR =====
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

    document.querySelector('.logout-btn')?.addEventListener('click', function(e) {
        e.preventDefault();
        if (confirm('Bạn có chắc muốn đăng xuất?')) {
            window.location.href = '../Dangnhap.php';
        }
    });

    // ===== INIT =====
    loadStaffs();
    console.log('👥 Quản lý nhân viên đã sẵn sàng (Event Delegation)');
})();