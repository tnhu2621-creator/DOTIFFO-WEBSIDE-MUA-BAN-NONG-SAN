(function() {
    'use strict';

    // ===== DOM REFS =====
    const tbody = document.getElementById('staffTableBody');
    const searchInput = document.getElementById('searchInput');
    const filterStatus = document.getElementById('filterStatus');
    const staffCount = document.getElementById('staffCount');
    const totalStaff = document.getElementById('totalStaff');
    const totalAdmin = document.getElementById('totalAdmin');
    const totalStaffCount = document.getElementById('totalStaffCount');
    const activeStaff = document.getElementById('activeStaff');
    const inactiveStaff = document.getElementById('inactiveStaff');
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
    let roles = [];
    let currentPage = 1;
    const itemsPerPage = 5;

    // ===== HÀM MỞ / ĐÓNG MODAL CHUẨN =====
    function openModal() {
        if (modal) {
            modal.classList.add('open');
            modal.style.display = 'flex';
        }
    }

    function closeModal() {
        if (modal) {
            modal.classList.remove('open');
            modal.style.display = 'none';
        }
        resetForm();
    }

    // ===== HELPERS CHUYỂN ĐỔI TRẠNG THÁI & VAI TRÒ =====
    function isStatusActive(status) {
        return status == 1 || status === '1' || status === 'Hoạt động';
    }

    function getStatusText(status) {
        return isStatusActive(status) ? 'Hoạt động' : 'Tạm ngưng';
    }

    function getStatusClass(status) {
        return isStatusActive(status) ? 'status-active' : 'status-inactive';
    }

    function getRoleClass(roleName) {
        const map = {
            'Quản trị viên': 'role-admin',
            'Quản lý': 'role-manager',
            'Nhân viên': 'role-staff'
        };
        return map[roleName] || 'role-staff';
    }

    function showToast(message, type = 'success') {
        const toastEl = document.getElementById('toast');
        const toastMsgEl = document.getElementById('toastMessage');

        if (toastMsgEl) {
            toastMsgEl.textContent = message;
        } else {
            alert(message);
            return;
        }

        if (toastEl) {
            toastEl.className = 'toast show';
            toastEl.style.borderLeftColor = (type === 'error') ? '#dc3545' : '#10b981';
            clearTimeout(toastEl._timer);
            toastEl._timer = setTimeout(() => toastEl.classList.remove('show'), 3000);
        }
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

    // ===== LOAD VAI TRÒ TỪ MYSQL =====
    function loadRoles() {
        return callAPI('get_roles')
            .then(result => {
                roles = result.data || [];
                let html = '';
                roles.forEach(r => {
                    html += `<option value="${r.id}">${r.name}</option>`;
                });
                if (staffRole) staffRole.innerHTML = html;
            })
            .catch(err => console.error('Lỗi tải vai trò:', err));
    }

    // ===== LOAD NHÂN VIÊN TỪ MYSQL =====
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

    // ===== UPDATE THỐNG KÊ (STATS) =====
    function updateStats() {
        const activeCount = staffs.filter(s => isStatusActive(s.status)).length;
        const inactiveCount = staffs.length - activeCount;

        if (totalStaff) totalStaff.textContent = staffs.length;
        if (activeStaff) activeStaff.textContent = activeCount;
        if (inactiveStaff) inactiveStaff.textContent = inactiveCount;
        if (totalAdmin) totalAdmin.textContent = staffs.filter(s => s.role === 'Quản trị viên' || s.role_id == 1).length;
        if (totalStaffCount) totalStaffCount.textContent = staffs.filter(s => s.role !== 'Quản trị viên' && s.role_id != 1).length;
    }

    // ===== LỌC DỮ LIỆU =====
    function getFilteredData() {
        const keyword = searchInput ? searchInput.value.toLowerCase().trim() : '';
        const statusFilter = filterStatus ? filterStatus.value : 'all';

        return staffs.filter(s => {
            const matchName = (s.name || '').toLowerCase().includes(keyword);
            const matchEmail = (s.email || '').toLowerCase().includes(keyword);
            
            let matchStatus = true;
            if (statusFilter !== 'all') {
                matchStatus = isStatusActive(s.status) === (statusFilter === '1');
            }

            return (matchName || matchEmail) && matchStatus;
        });
    }

    // ===== RENDER BẢNG =====
    function renderTable() {
        const filtered = getFilteredData();
        const totalItems = filtered.length;
        const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;

        if (currentPage > totalPages) currentPage = totalPages;

        const start = (currentPage - 1) * itemsPerPage;
        const pageItems = filtered.slice(start, start + itemsPerPage);

        if (staffCount) staffCount.textContent = `${totalItems} nhân viên`;
        if (pageInfo) pageInfo.textContent = `Trang ${currentPage} / ${totalPages}`;
        if (prevPageBtn) prevPageBtn.disabled = currentPage <= 1;
        if (nextPageBtn) nextPageBtn.disabled = currentPage >= totalPages;

        if (!tbody) return;

        if (pageItems.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align:center; padding:30px; color:#9ca3af;">
                        <i class="fas fa-users-slash" style="font-size:1.8rem; display:block; margin-bottom:8px;"></i>
                        Không tìm thấy nhân viên nào
                    </td>
                </tr>
            `;
            updateStats();
            return;
        }

        let html = '';
        pageItems.forEach(s => {
            const active = isStatusActive(s.status);
            const formattedId = typeof s.id === 'number' ? `#${String(s.id).padStart(3, '0')}` : s.id;

            // Active (Hoạt động)  -> Icon ổ khóa MỞ (fa-unlock) + Màu XANH (#10b981)
            // Inactive (Tạm ngưng) -> Icon ổ khóa ĐÓNG (fa-lock) + Màu ĐỎ (#ef4444)
            const lockIcon = active ? 'fa-unlock' : 'fa-lock';
            const lockColor = active ? '#10b981' : '#ef4444';
            const lockTitle = active ? 'Nhấn để khóa tài khoản' : 'Nhấn để mở khóa tài khoản';

            html += `
                <tr>
                    <td><strong>${formattedId}</strong></td>
                    <td><strong>${s.name}</strong></td>
                    <td>${s.email}</td>
                    <td>${s.phone || '—'}</td>
                    <td><span class="role-badge ${getRoleClass(s.role)}">${s.role}</span></td>
                    <td>
                        <span class="status ${active ? 'status-active' : 'status-inactive'}">
                            ${active ? 'Hoạt động' : 'Tạm ngưng'}
                        </span>
                    </td>
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

    // ===== BẮT SỰ KIỆN CLICK TRÊN BẢNG =====
    if (tbody) {
        tbody.addEventListener('click', function(e) {
            const btn = e.target.closest('.action-btn') || e.target.closest('button');
            if (!btn) return;

            const action = btn.getAttribute('data-action');
            const id = btn.getAttribute('data-id');

            if (!id) return;

            if (action === 'edit') {
                handleEdit(id);
            } else if (action === 'toggle') {
                handleToggle(id);
            }
        });
    }

    // ===== XỬ LÝ SỬA NHÂN VIÊN =====
    function handleEdit(id) {
        const s = staffs.find(item => item.id == id || String(item.id) === String(id) || `ND${String(item.id).padStart(2, '0')}` === String(id));

        if (!s) {
            console.error('Không tìm thấy nhân viên với ID:', id);
            showToast('Không tìm thấy dữ liệu nhân viên!', 'error');
            return;
        }

        if (modalTitle) modalTitle.textContent = 'Sửa thông tin nhân viên';
        if (editStaffId) editStaffId.value = s.id;
        if (staffName) staffName.value = s.name || '';
        if (staffEmail) staffEmail.value = s.email || '';
        if (staffPhone) staffPhone.value = s.phone || '';
        if (staffRole) staffRole.value = s.role_id || (roles[0] ? roles[0].id : '');
        if (staffStatus) staffStatus.value = isStatusActive(s.status) ? '1' : '0';
        if (staffPassword) {
            staffPassword.value = '';
            staffPassword.placeholder = 'Nhập mật khẩu mới nếu muốn thay đổi';
        }

        if (passwordGroup) {
            const smallNote = passwordGroup.querySelector('small');
            if (smallNote) smallNote.textContent = 'Bỏ trống nếu không muốn thay đổi mật khẩu.';
        }

        openModal();
    }

    // ===== XỬ LÝ KHÓA / MỞ KHÓA =====
    function handleToggle(id) {
        const s = staffs.find(item => item.id == id || String(item.id) === String(id) || `ND${String(item.id).padStart(2, '0')}` === String(id));
        if (!s) {
            showToast('Không tìm thấy nhân viên.', 'error');
            return;
        }

        const active = isStatusActive(s.status);
        const actionText = active ? 'khóa' : 'mở khóa';
        const confirmMsg = `Bạn có chắc muốn ${actionText} tài khoản "${s.name}"?`;

        if (!confirm(confirmMsg)) return;

        callAPI('toggle_staff', { id: s.id }, 'POST')
            .then(result => {
                s.status = result.data.newStatus;
                renderTable();
                showToast(`Đã ${actionText} tài khoản "${s.name}"`);
            })
            .catch(err => showToast(err.message, 'error'));
    }

    // ===== RESET FORM =====
    function resetForm() {
        if (editStaffId) editStaffId.value = '';
        if (staffName) staffName.value = '';
        if (staffEmail) staffEmail.value = '';
        if (staffPhone) staffPhone.value = '';
        if (staffRole && roles.length > 0) staffRole.value = roles[0].id;
        if (staffStatus) staffStatus.value = '1';
        if (staffPassword) {
            staffPassword.value = '';
            staffPassword.placeholder = 'Ít nhất 6 ký tự';
        }
        if (passwordGroup) {
            const smallNote = passwordGroup.querySelector('small');
            if (smallNote) smallNote.textContent = 'Nhập mật khẩu khi thêm mới. Bỏ trống nếu không muốn thay đổi khi sửa.';
        }
        if (modalTitle) modalTitle.textContent = 'Thêm nhân viên';
    }

    // ===== LƯU (THÊM / SỬA) =====
    function saveStaff() {
        const name = staffName ? staffName.value.trim() : '';
        const email = staffEmail ? staffEmail.value.trim() : '';
        const phone = staffPhone ? staffPhone.value.trim() : '';
        const role_id = staffRole ? staffRole.value : null;
        const status = staffStatus ? staffStatus.value : '1';
        const password = staffPassword ? staffPassword.value : '';
        const id = editStaffId ? editStaffId.value : '';

        if (!name || !email) {
            showToast('Vui lòng điền đầy đủ họ tên và email.', 'error');
            return;
        }

        const payload = { name, email, phone, role_id, status, password };
        let action = 'add_staff';
        if (id) {
            action = 'update_staff';
            payload.id = id;
        }

        callAPI(action, payload, 'POST')
            .then(result => {
                closeModal();
                loadStaffs();
                showToast(result.message);
            })
            .catch(err => showToast(err.message, 'error'));
    }

    // ===== PHÂN TRANG & BỘ LỌC =====
    if (prevPageBtn) {
        prevPageBtn.addEventListener('click', function() {
            if (currentPage > 1) { currentPage--; renderTable(); }
        });
    }

    if (nextPageBtn) {
        nextPageBtn.addEventListener('click', function() {
            const filtered = getFilteredData();
            const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
            if (currentPage < totalPages) { currentPage++; renderTable(); }
        });
    }

    if (searchInput) {
        searchInput.addEventListener('input', function() {
            currentPage = 1;
            renderTable();
        });
    }

    if (filterStatus) {
        filterStatus.addEventListener('change', function() {
            currentPage = 1;
            renderTable();
        });
    }

    // ===== MODAL EVENTS =====
    if (btnAdd) {
        btnAdd.addEventListener('click', function() {
            resetForm();
            openModal();
        });
    }

    if (btnSave) btnSave.addEventListener('click', saveStaff);
    if (btnCancel) btnCancel.addEventListener('click', closeModal);
    if (btnClose) btnClose.addEventListener('click', closeModal);

    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeModal();
            }
        });
    }

    // Bấm phím ESC để đóng Modal
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' || e.key === 'Esc') {
            closeModal();
        }
    });

    // ===== INIT =====
    loadRoles().then(() => {
        loadStaffs();
    });

})();