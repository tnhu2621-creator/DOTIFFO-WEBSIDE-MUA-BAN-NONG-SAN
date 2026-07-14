(function() {
    'use strict';

    // ===== DỮ LIỆU MẪU =====
    let customers = [
        { id: 1, name: 'Nguyễn Văn A', email: 'vana@email.com', phone: '0909123456', address: '123 Đường Nông Sản, Phường 1, Đồng Tháp', orders: 15, totalSpent: 3250000, status: 'Hoạt động' },
        { id: 2, name: 'Trần Thị B', email: 'thib@email.com', phone: '0909789012', address: '456 Đường Trái Cây, Phường 2, Tiền Giang', orders: 23, totalSpent: 4800000, status: 'Hoạt động' },
        { id: 3, name: 'Lê Văn C', email: 'lvc@email.com', phone: '0909567890', address: '789 Đường Đặc Sản, Phường 3, Đồng Tháp', orders: 8, totalSpent: 1250000, status: 'Tạm ngưng' },
        { id: 4, name: 'Phạm Thị D', email: 'phamthid@email.com', phone: '0909345678', address: '321 Đường Gạo Nàng, Phường 4, Tiền Giang', orders: 12, totalSpent: 2200000, status: 'Hoạt động' },
        { id: 5, name: 'Hoàng Văn E', email: 'hvane@email.com', phone: '0909234567', address: '654 Đường Sen, Phường 5, Đồng Tháp', orders: 7, totalSpent: 980000, status: 'Hoạt động' },
        { id: 6, name: 'Ngô Thị F', email: 'ngothif@email.com', phone: '0909456789', address: '987 Đường Tràm, Phường 6, Tiền Giang', orders: 19, totalSpent: 3100000, status: 'Hoạt động' },
    ];

    // ===== DOM REFS =====
    const tbody = document.getElementById('customerTableBody');
    const searchInput = document.getElementById('searchInput');
    const filterStatus = document.getElementById('filterStatus');
    const customerCount = document.getElementById('customerCount');
    const totalCustomers = document.getElementById('totalCustomers');
    const activeCustomers = document.getElementById('activeCustomers');
    const totalOrders = document.getElementById('totalOrders');
    const totalSpent = document.getElementById('totalSpent');
    const prevPageBtn = document.getElementById('prevPage');
    const nextPageBtn = document.getElementById('nextPage');
    const pageInfo = document.getElementById('pageInfo');

    // Modal chi tiết
    const modal = document.getElementById('customerModal');
    const modalTitle = document.getElementById('modalTitle');
    const detailContent = document.getElementById('customerDetailContent');
    const modalClose = document.getElementById('modalClose');
    const modalCloseBtn = document.getElementById('modalCloseBtn');

    // Toast
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toastMessage');

    // Pagination
    let currentPage = 1;
    const itemsPerPage = 5;

    // ===== HELPERS =====
    function formatPrice(price) {
        return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') + ' đ';
    }

    function getStatusClass(status) {
        return status === 'Hoạt động' ? 'status-active' : 'status-inactive';
    }

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

    // ===== UPDATE STATS =====
    function updateStats() {
        totalCustomers.textContent = customers.length;
        activeCustomers.textContent = customers.filter(c => c.status === 'Hoạt động').length;
        totalOrders.textContent = customers.reduce((sum, c) => sum + c.orders, 0);
        totalSpent.textContent = formatPrice(customers.reduce((sum, c) => sum + c.totalSpent, 0));
    }

    // ===== GET FILTERED DATA =====
    function getFilteredData() {
        const keyword = searchInput.value.toLowerCase().trim();
        const status = filterStatus.value;

        return customers.filter(c => {
            const matchName = c.name.toLowerCase().includes(keyword);
            const matchEmail = c.email.toLowerCase().includes(keyword);
            const matchPhone = c.phone.includes(keyword);
            const matchStatus = status === 'all' || c.status === status;
            return (matchName || matchEmail || matchPhone) && matchStatus;
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

        customerCount.textContent = `${totalItems} khách hàng`;
        pageInfo.textContent = `Trang ${currentPage} / ${totalPages}`;
        prevPageBtn.disabled = currentPage <= 1;
        nextPageBtn.disabled = currentPage >= totalPages;

        if (pageItems.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="9" style="text-align:center; padding:40px; color:var(--gray-400);">
                        <i class="fas fa-users-slash" style="font-size:2rem; display:block; margin-bottom:8px;"></i>
                        Không tìm thấy khách hàng
                    </td>
                </tr>
            `;
            return;
        }

        let html = '';
        pageItems.forEach(c => {
            html += `
                <tr>
                    <td>#${String(c.id).padStart(3, '0')}</td>
                    <td><strong>${c.name}</strong></td>
                    <td>${c.email}</td>
                    <td>${c.phone || '—'}</td>
                    <td>${c.address || '—'}</td>
                    <td>${c.orders}</td>
                    <td>${formatPrice(c.totalSpent)}</td>
                    <td><span class="status-badge ${getStatusClass(c.status)}">${c.status}</span></td>
                    <td>
                        <button class="action-btn view" onclick="viewCustomer(${c.id})" title="Xem chi tiết"><i class="fas fa-eye"></i></button>
                    </td>
                </tr>
            `;
        });
        tbody.innerHTML = html;
        updateStats();
    }

    // ===== VIEW CUSTOMER =====
    window.viewCustomer = function(id) {
        const c = customers.find(item => item.id === id);
        if (!c) return;

        modalTitle.textContent = 'Chi tiết khách hàng';

        const orderHistory = `
            <div class="detail-orders">
                <h4>Lịch sử đơn hàng</h4>
                <table>
                    <thead>
                        <tr><th>Mã đơn</th><th>Ngày</th><th>Tổng tiền</th><th>Trạng thái</th></tr>
                    </thead>
                    <tbody>
                        <tr><td>#ORD-001</td><td>27/06/2026</td><td>255,000 đ</td><td>Hoàn thành</td></tr>
                        <tr><td>#ORD-003</td><td>20/06/2026</td><td>180,000 đ</td><td>Đã giao</td></tr>
                        <tr><td>#ORD-005</td><td>15/06/2026</td><td>320,000 đ</td><td>Đang xử lý</td></tr>
                    </tbody>
                </table>
                <p style="margin-top:12px; font-size:0.9rem; color:var(--gray-400);">* Hiển thị 3 đơn hàng gần nhất</p>
            </div>
        `;

        detailContent.innerHTML = `
            <div class="detail-grid">
                <div class="detail-item">
                    <strong>Họ tên</strong>
                    <span>${c.name}</span>
                </div>
                <div class="detail-item">
                    <strong>Email</strong>
                    <span>${c.email}</span>
                </div>
                <div class="detail-item">
                    <strong>Số điện thoại</strong>
                    <span>${c.phone || '—'}</span>
                </div>
                <div class="detail-item">
                    <strong>Địa chỉ</strong>
                    <span>${c.address || '—'}</span>
                </div>
                <div class="detail-item">
                    <strong>Tổng đơn hàng</strong>
                    <span>${c.orders}</span>
                </div>
                <div class="detail-item">
                    <strong>Tổng chi tiêu</strong>
                    <span>${formatPrice(c.totalSpent)}</span>
                </div>
                <div class="detail-item">
                    <strong>Trạng thái</strong>
                    <span class="status-badge ${getStatusClass(c.status)}">${c.status}</span>
                </div>
            </div>
            ${orderHistory}
        `;
        modal.classList.add('open');
    };

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
    modalClose.addEventListener('click', function() {
        modal.classList.remove('open');
    });

    modalCloseBtn.addEventListener('click', function() {
        modal.classList.remove('open');
    });

    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.classList.remove('open');
        }
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

    // ===== LOGOUT =====
    document.querySelector('.logout-btn')?.addEventListener('click', function(e) {
        e.preventDefault();
        if (confirm('Bạn có chắc muốn đăng xuất?')) {
            window.location.href = '../Dangnhap.php';
        }
    });

    // ===== EXPORT BUTTON =====
    document.getElementById('btnExport')?.addEventListener('click', function() {
        showToast('📤 Đang xuất danh sách khách hàng ra Excel...');
        setTimeout(() => {
            showToast('✅ Xuất file thành công!');
        }, 1500);
    });

    // ===== INIT =====
    renderTable();
    console.log('👤 Thông tin khách hàng đã sẵn sàng!');
})();