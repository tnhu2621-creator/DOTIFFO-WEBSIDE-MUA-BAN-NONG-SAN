document.addEventListener('DOMContentLoaded', function() {
    let allCustomers = [];
    let filteredCustomers = [];
    let currentPage = 1;
    const itemsPerPage = 10;

    const customerTableBody = document.getElementById('customerTableBody');
    const totalCustomersEl = document.getElementById('totalCustomers');
    const activeCustomersEl = document.getElementById('activeCustomers');
    const inactiveCustomersEl = document.getElementById('inactiveCustomers');
    const newTodayEl = document.getElementById('newToday');
    const customerCountEl = document.getElementById('customerCount');
    const pageInfoEl = document.getElementById('pageInfo');
    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');
    const searchInput = document.getElementById('searchInput');
    const filterStatus = document.getElementById('filterStatus');

    const modal = document.getElementById('customerModal');
    const modalTitle = document.getElementById('modalTitle');
    const editId = document.getElementById('editCustomerId');
    const customerName = document.getElementById('customerName');
    const customerEmail = document.getElementById('customerEmail');
    const customerPhone = document.getElementById('customerPhone');
    const customerStatus = document.getElementById('customerStatus');
    const customerPassword = document.getElementById('customerPassword');
    const modalClose = document.getElementById('modalClose');
    const modalCancel = document.getElementById('modalCancel');
    const modalSave = document.getElementById('modalSave');
    const btnAdd = document.getElementById('btnAddCustomer');

    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toastMessage');

    function showToast(message, type = 'success') {
        toastMsg.textContent = message;
        toast.className = 'toast show';
        toast.style.borderLeftColor = (type === 'error') ? '#dc3545' : '#e83e8c';
        clearTimeout(toast._timer);
        toast._timer = setTimeout(() => toast.classList.remove('show'), 3000);
    }

    function apiFetch(action, data = {}, method = 'POST') {
        const url = 'QuanlyKhachhang.php?action=' + action;
        const options = {
            method: method,
            headers: { 'Content-Type': 'application/json' }
        };
        if (method !== 'GET') {
            options.body = JSON.stringify(data);
        }
        return fetch(url, options)
            .then(response => {
                if (!response.ok) {
                    return response.text().then(text => {
                        throw new Error('HTTP ' + response.status + ': ' + text.substring(0, 200));
                    });
                }
                return response.json();
            })
            .catch(err => {
                console.error('API Error:', err);
                throw new Error('Lỗi kết nối server: ' + err.message);
            });
    }

    function loadCustomers() {
        apiFetch('get_customers', {}, 'GET')
            .then(res => {
                if (res.success) {
                    console.log('📦 Dữ liệu khách hàng:', res.data);
                    allCustomers = res.data || [];
                    applyFilters();
                } else {
                    showToast(res.message || 'Không thể tải dữ liệu', 'error');
                }
            })
            .catch(err => {
                showToast(err.message || 'Lỗi kết nối server', 'error');
            });
    }

    function applyFilters() {
        const keyword = searchInput.value.trim().toLowerCase();
        const statusFilter = filterStatus.value;

        filteredCustomers = allCustomers.filter(c => {
            const matchName = c.name.toLowerCase().includes(keyword);
            const matchEmail = c.email.toLowerCase().includes(keyword);
            const matchStatus = statusFilter === 'all' || c.status === statusFilter;
            return (matchName || matchEmail) && matchStatus;
        });

        updateStats();
        renderPage(1);
    }

    function updateStats() {
        const total = allCustomers.length;
        const active = allCustomers.filter(c => c.status === 'Hoạt động').length;
        const inactive = allCustomers.filter(c => c.status === 'Tạm ngưng').length;
        const today = new Date().toISOString().slice(0, 10);
        const newTodayCount = allCustomers.filter(c => {
            if (!c.created_at) return false;
            const d = new Date(c.created_at);
            return d.toISOString().slice(0, 10) === today;
        }).length;

        totalCustomersEl.textContent = total;
        activeCustomersEl.textContent = active;
        inactiveCustomersEl.textContent = inactive;
        newTodayEl.textContent = newTodayCount;
    }

    function renderPage(page) {
        currentPage = page;
        const total = filteredCustomers.length;
        const totalPages = Math.ceil(total / itemsPerPage) || 1;
        if (currentPage > totalPages) currentPage = totalPages;
        const start = (currentPage - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        const pageItems = filteredCustomers.slice(start, end);

        customerCountEl.textContent = `${total} khách hàng`;
        pageInfoEl.textContent = `Trang ${currentPage} / ${totalPages}`;
        prevBtn.disabled = currentPage <= 1;
        nextBtn.disabled = currentPage >= totalPages;

        if (pageItems.length === 0) {
            customerTableBody.innerHTML = `
                <tr><td colspan="6" style="text-align:center; padding:40px; color:var(--gray-400);">
                    <i class="fas fa-user-slash" style="font-size:2rem; display:block; margin-bottom:8px;"></i>
                    Không tìm thấy khách hàng
                </td></tr>
            `;
            return;
        }

        let html = '';
        pageItems.forEach(c => {
            // Lấy ID số nguyên thuần túy
            const customerId = c.id || c.MaNguoiDung || '';
            
            // Định dạng hiển thị mã KH dạng #ND02, #ND04 cho đẹp mắt
            const formattedDisplayId = '#ND' + String(customerId).padStart(2, '0');

            const statusClass = c.status === 'Hoạt động' ? 'status-active' : 'status-inactive';
            html += `
                <tr>
                    <td>${formattedDisplayId}</td>
                    <td><strong>${c.name}</strong></td>
                    <td>${c.email}</td>
                    <td>${c.phone || ''}</td>
                    <td><span class="status ${statusClass}">${c.status}</span></td>
                    <td>
                        <button class="action-btn view-detail" data-id="${customerId}" title="Xem chi tiết"><i class="fas fa-eye"></i></button>
                        <button class="action-btn edit" data-id="${customerId}" title="Sửa"><i class="fas fa-edit"></i></button>
                        <button class="action-btn toggle" data-id="${customerId}" title="${c.status === 'Hoạt động' ? 'Khóa' : 'Mở khóa'}"><i class="fas ${c.status === 'Hoạt động' ? 'fa-lock' : 'fa-unlock'}"></i></button>
                    </td>
                </tr>
            `;
        });
        customerTableBody.innerHTML = html;

        // Sự kiện: Xem chi tiết
        document.querySelectorAll('.view-detail').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = this.dataset.id;
                if (!id || id === 'undefined' || id === '') {
                    showToast('Không tìm thấy ID khách hàng.', 'error');
                    return;
                }
                // Chuyển hướng truyền ID số thuần túy sang ChitietKhachhang.php
                window.location.href = 'ChitietKhachhang.php?id=' + id;
            });
        });

        // Sự kiện: Sửa
        document.querySelectorAll('.edit').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = this.dataset.id;
                if (!id || id === 'undefined') {
                    showToast('Không tìm thấy ID khách hàng.', 'error');
                    return;
                }
                openEditModal(id);
            });
        });

        // Sự kiện: Khóa/Mở khóa
        document.querySelectorAll('.toggle').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = this.dataset.id;
                if (!id || id === 'undefined') {
                    showToast('Không tìm thấy ID khách hàng.', 'error');
                    return;
                }
                toggleCustomer(id);
            });
        });
    }

    function openEditModal(id) {
        const customer = allCustomers.find(c => c.id == id || c.MaNguoiDung == id);
        if (!customer) return;
        modalTitle.textContent = 'Sửa khách hàng';
        editId.value = customer.id || customer.MaNguoiDung;
        customerName.value = customer.name;
        customerEmail.value = customer.email;
        customerPhone.value = customer.phone || '';
        customerStatus.value = customer.status;
        customerPassword.value = '';
        customerPassword.placeholder = 'Để trống nếu không đổi mật khẩu';
        
        const reqBadge = document.querySelector('#passwordGroup .required');
        if (reqBadge) reqBadge.style.display = 'none';
        
        modal.classList.add('open');
    }

    function openAddModal() {
        modalTitle.textContent = 'Thêm khách hàng';
        editId.value = '';
        customerName.value = '';
        customerEmail.value = '';
        customerPhone.value = '';
        customerStatus.value = 'Hoạt động';
        customerPassword.value = '';
        customerPassword.placeholder = 'Ít nhất 6 ký tự';
        
        const reqBadge = document.querySelector('#passwordGroup .required');
        if (reqBadge) reqBadge.style.display = 'inline';
        
        modal.classList.add('open');
    }

    function closeModal() {
        modal.classList.remove('open');
    }

    function saveCustomer() {
        const id = editId.value;
        const name = customerName.value.trim();
        const email = customerEmail.value.trim();
        const phone = customerPhone.value.trim();
        const status = customerStatus.value;
        const password = customerPassword.value.trim();

        if (!name || !email) {
            showToast('Vui lòng nhập họ tên và email.', 'error');
            return;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            showToast('Email không hợp lệ.', 'error');
            return;
        }
        if (!id && (!password || password.length < 6)) {
            showToast('Mật khẩu phải có ít nhất 6 ký tự.', 'error');
            return;
        }
        if (id && password && password.length < 6) {
            showToast('Mật khẩu mới phải có ít nhất 6 ký tự.', 'error');
            return;
        }

        const action = id ? 'update_customer' : 'add_customer';
        const payload = { id, name, email, phone, status, password };

        apiFetch(action, payload)
            .then(res => {
                if (res.success) {
                    showToast(res.message);
                    closeModal();
                    loadCustomers();
                } else {
                    showToast(res.message, 'error');
                }
            })
            .catch(err => {
                showToast(err.message || 'Lỗi kết nối', 'error');
                console.error(err);
            });
    }

    function toggleCustomer(id) {
        if (!confirm('Bạn có chắc muốn thay đổi trạng thái của khách hàng này?')) return;
        apiFetch('toggle_customer', { id })
            .then(res => {
                if (res.success) {
                    showToast(res.message);
                    loadCustomers();
                } else {
                    showToast(res.message, 'error');
                }
            })
            .catch(err => {
                showToast(err.message || 'Lỗi kết nối', 'error');
                console.error(err);
            });
    }

    // ===== SỰ KIỆN =====
    btnAdd.addEventListener('click', openAddModal);
    modalClose.addEventListener('click', closeModal);
    modalCancel.addEventListener('click', closeModal);
    modal.addEventListener('click', function(e) {
        if (e.target === this) closeModal();
    });
    modalSave.addEventListener('click', saveCustomer);

    searchInput.addEventListener('input', function() {
        applyFilters();
    });
    filterStatus.addEventListener('change', function() {
        applyFilters();
    });

    prevBtn.addEventListener('click', function() {
        if (currentPage > 1) renderPage(currentPage - 1);
    });
    nextBtn.addEventListener('click', function() {
        const total = filteredCustomers.length;
        const totalPages = Math.ceil(total / itemsPerPage) || 1;
        if (currentPage < totalPages) renderPage(currentPage + 1);
    });

    // ===== KHỞI TẠO =====
    loadCustomers();
});