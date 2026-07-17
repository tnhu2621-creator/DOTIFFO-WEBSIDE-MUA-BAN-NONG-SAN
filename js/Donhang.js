document.addEventListener('DOMContentLoaded', function() {
    let currentStatus = 'all';
    let currentPage = 1;
    let dateFrom = '';
    let dateTo = '';
    let currentOrderId = null;

    const orderTableBody = document.getElementById('orderTableBody');
    const totalOrdersEl = document.getElementById('totalOrders');
    const pendingOrdersEl = document.getElementById('pendingOrders');
    const shippingOrdersEl = document.getElementById('shippingOrders');
    const completedOrdersEl = document.getElementById('completedOrders');
    const orderCountEl = document.getElementById('orderCount');
    const pageInfoEl = document.getElementById('pageInfo');
    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');
    const filterTabs = document.querySelectorAll('.filter-tab');
    const dateFromInput = document.getElementById('dateFrom');
    const dateToInput = document.getElementById('dateTo');
    const filterDateBtn = document.getElementById('btnFilterDate');

    const orderModal = document.getElementById('orderModal');
    const modalClose = document.getElementById('modalClose');
    const modalCloseBtn = document.getElementById('modalCloseBtn');
    const orderDetailContent = document.getElementById('orderDetailContent');
    const printOrderBtn = document.getElementById('printOrderBtn');

    const statusModal = document.getElementById('statusModal');
    const statusModalClose = document.getElementById('statusModalClose');
    const statusModalCancel = document.getElementById('statusModalCancel');
    const statusOrderId = document.getElementById('statusOrderId');
    const newStatusSelect = document.getElementById('newStatus');
    const statusModalSave = document.getElementById('statusModalSave');

    // Lý do hủy
    const cancelReasonGroup = document.getElementById('cancelReasonGroup');
    const cancelReason = document.getElementById('cancelReason');
    const otherReasonGroup = document.getElementById('otherReasonGroup');
    const otherReason = document.getElementById('otherReason');

    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    let toastTimer;

    function showToast(msg, isSuccess = true) {
        toastMessage.textContent = msg;
        toast.className = 'toast show ' + (isSuccess ? '' : 'error');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => toast.classList.remove('show'), 3000);
    }

    function fetchAPI(action, params = {}, method = 'GET') {
        let url = 'Donhang.php?action=' + action;
        if (method === 'GET') {
            const query = new URLSearchParams(params).toString();
            if (query) url += '&' + query;
            return fetch(url)
                .then(res => {
                    if (!res.ok) throw new Error('HTTP ' + res.status);
                    return res.json();
                })
                .catch(err => {
                    return fetch(url).then(res => res.text()).then(text => {
                        throw new Error('Server error: ' + text.substring(0, 200));
                    });
                });
        } else {
            return fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams(params)
            })
            .then(res => {
                if (!res.ok) throw new Error('HTTP ' + res.status);
                return res.json();
            })
            .catch(err => {
                return fetch(url, { method: 'POST', body: new URLSearchParams(params) })
                    .then(res => res.text())
                    .then(text => {
                        throw new Error('Server error: ' + text.substring(0, 200));
                    });
            });
        }
    }

    function loadStats() {
        fetchAPI('get_stats')
            .then(data => {
                if (data.error) {
                    showToast('Lỗi: ' + data.error, false);
                    return;
                }
                totalOrdersEl.textContent = data.total || 0;
                pendingOrdersEl.textContent = data.pending || 0;
                shippingOrdersEl.textContent = data.shipped || 0;
                completedOrdersEl.textContent = data.delivered || 0;
            })
            .catch(err => {
                showToast('Không thể tải thống kê: ' + err.message, false);
            });
    }

    function loadOrders(status, page, from, to) {
        const params = { status, page, dateFrom: from || '', dateTo: to || '' };
        fetchAPI('get_orders', params)
            .then(data => {
                if (data.error) {
                    showToast('Lỗi: ' + data.error, false);
                    return;
                }
                if (data.orders) {
                    renderOrders(data.orders);
                    const total = data.total || 0;
                    orderCountEl.textContent = total + ' đơn hàng';
                    const totalPages = data.totalPages || 1;
                    pageInfoEl.textContent = 'Trang ' + page + ' / ' + totalPages;
                    currentPage = page;
                    prevBtn.disabled = (page <= 1);
                    nextBtn.disabled = (page >= totalPages);
                } else {
                    showToast('Không thể tải danh sách đơn hàng', false);
                }
            })
            .catch(err => {
                showToast('Lỗi kết nối: ' + err.message, false);
            });
    }

    function renderOrders(orders) {
        if (!orders || orders.length === 0) {
            orderTableBody.innerHTML = '<tr><td colspan="7" style="text-align:center;">Không có đơn hàng nào</td></tr>';
            return;
        }
        let html = '';
        orders.forEach(order => {
            const isCancelled = order.TrangThai === 'Đã hủy';
            const editButton = isCancelled ? '' : `<a href="#" data-id="${order.MaDonHang}" data-status="${order.TrangThai}" class="edit-status"><i class="fas fa-edit"></i></a>`;

            html += `
                <tr>
                    <td><strong>${order.MaDonHang}</strong></td>
                    <td>${order.customer_name || 'N/A'}</td>
                    <td>${order.DiaChiGiaoHang || ''}</td>
                    <td>${order.TongTienFormatted}</td>
                    <td><span class="status ${order.statusClass}">${order.TrangThai}</span></td>
                    <td>${order.NgayDatFormatted}</td>
                    <td class="table-actions">
                        <a href="#" data-id="${order.MaDonHang}" class="view-detail"><i class="fas fa-eye"></i></a>
                        ${editButton}
                    </td>
                </tr>
            `;
        });
        orderTableBody.innerHTML = html;

        document.querySelectorAll('.view-detail').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                const orderId = this.dataset.id;
                currentOrderId = orderId;
                viewOrderDetail(orderId);
            });
        });
        document.querySelectorAll('.edit-status').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                const orderId = this.dataset.id;
                const currentStatus = this.dataset.status;
                openStatusModal(orderId, currentStatus);
            });
        });
    }

    function viewOrderDetail(id) {
        fetchAPI('get_detail', { id })
            .then(data => {
                if (data.error) {
                    showToast('Lỗi: ' + data.error, false);
                    return;
                }
                if (data.success) {
                    orderDetailContent.innerHTML = data.html;
                    if (data.TrangThai === 'Đang xử lý') {
                        printOrderBtn.style.display = 'inline-block';
                    } else {
                        printOrderBtn.style.display = 'none';
                    }
                    orderModal.classList.add('active');
                } else {
                    showToast(data.message || 'Không tìm thấy đơn hàng', false);
                }
            })
            .catch(err => {
                showToast('Lỗi tải chi tiết: ' + err.message, false);
            });
    }

    function openStatusModal(orderId, currentStatus) {
        statusOrderId.value = orderId;

        // Reset lý do hủy
        cancelReasonGroup.style.display = 'none';
        cancelReason.value = '';
        otherReasonGroup.style.display = 'none';
        otherReason.value = '';

        let allowedStatuses = [];
        switch (currentStatus) {
            case 'Chờ xác nhận':
                allowedStatuses = ['Chờ xác nhận', 'Đang xử lý', 'Đã hủy'];
                break;
            case 'Đang xử lý':
                allowedStatuses = ['Đang giao', 'Đã hủy'];
                break;
            case 'Đang giao':
                allowedStatuses = ['Đã giao', 'Đã hủy'];
                break;
            case 'Đã giao':
                allowedStatuses = ['Đã giao'];
                break;
            case 'Đã hủy':
                allowedStatuses = ['Đã hủy'];
                break;
            default:
                allowedStatuses = ['Chờ xác nhận', 'Đang xử lý', 'Đang giao', 'Đã giao', 'Đã hủy'];
                break;
        }

        const select = newStatusSelect;
        select.innerHTML = '';
        allowedStatuses.forEach(status => {
            const option = document.createElement('option');
            option.value = status;
            option.textContent = status;
            if (status === currentStatus) {
                option.selected = true;
            }
            select.appendChild(option);
        });

        // Hiện/ẩn lý do hủy khi chọn 'Đã hủy'
        select.addEventListener('change', function() {
            if (this.value === 'Đã hủy') {
                cancelReasonGroup.style.display = 'block';
            } else {
                cancelReasonGroup.style.display = 'none';
                cancelReason.value = '';
                otherReasonGroup.style.display = 'none';
                otherReason.value = '';
            }
        });

        // Hiện ô nhập lý do khác
        cancelReason.addEventListener('change', function() {
            if (this.value === 'Lý do khác (ghi rõ bên dưới)') {
                otherReasonGroup.style.display = 'block';
            } else {
                otherReasonGroup.style.display = 'none';
                otherReason.value = '';
            }
        });

        statusModal.classList.add('active');
    }

    function closeOrderModal() {
        orderModal.classList.remove('active');
    }

    function closeStatusModal() {
        statusModal.classList.remove('active');
        // Reset sự kiện change để tránh trùng lặp
        newStatusSelect.replaceWith(newStatusSelect.cloneNode(true));
        // Cập nhật lại biến tham chiếu
        // (do clone nên cần gán lại)
        // Thực tế có thể không cần vì modal sẽ được tạo lại mỗi lần mở
    }

    function updateStatus() {
        const orderId = statusOrderId.value;
        const newStatus = newStatusSelect.value;
        if (!orderId) return;

        let lyDoHuy = '';
        if (newStatus === 'Đã hủy') {
            lyDoHuy = cancelReason.value;
            if (lyDoHuy === 'Lý do khác (ghi rõ bên dưới)') {
                lyDoHuy = otherReason.value.trim();
            }
            if (!lyDoHuy) {
                showToast('Vui lòng chọn hoặc nhập lý do hủy.', 'error');
                return;
            }
        }

        const params = { orderId, newStatus };
        if (lyDoHuy) {
            params.ly_do_huy = lyDoHuy;
        }

        fetchAPI('update_status', params, 'POST')
            .then(data => {
                if (data.error) {
                    showToast('Lỗi: ' + data.error, false);
                    return;
                }
                if (data.success) {
                    showToast('Cập nhật trạng thái thành công!');
                    closeStatusModal();
                    loadOrders(currentStatus, currentPage, dateFrom, dateTo);
                    loadStats();
                } else {
                    showToast(data.message || 'Cập nhật thất bại', false);
                }
            })
            .catch(err => {
                showToast('Lỗi kết nối: ' + err.message, false);
            });
    }

    function printOrder() {
        if (!currentOrderId) {
            showToast('Không có đơn hàng để in.', false);
            return;
        }
        const printWindow = window.open(
            'Donhang.php?action=print_order&id=' + currentOrderId,
            '_blank',
            'width=800,height=600'
        );
        if (!printWindow) {
            showToast('Trình duyệt chặn cửa sổ mới. Vui lòng cho phép popup.', false);
        }
    }

    // ===== SỰ KIỆN =====
    filterTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            filterTabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            currentStatus = this.dataset.status;
            currentPage = 1;
            loadOrders(currentStatus, currentPage, dateFrom, dateTo);
        });
    });

    filterDateBtn.addEventListener('click', function() {
        dateFrom = dateFromInput.value;
        dateTo = dateToInput.value;
        currentPage = 1;
        loadOrders(currentStatus, currentPage, dateFrom, dateTo);
    });

    prevBtn.addEventListener('click', function() {
        if (currentPage > 1) loadOrders(currentStatus, currentPage - 1, dateFrom, dateTo);
    });
    nextBtn.addEventListener('click', function() {
        loadOrders(currentStatus, currentPage + 1, dateFrom, dateTo);
    });

    modalClose.addEventListener('click', closeOrderModal);
    modalCloseBtn.addEventListener('click', closeOrderModal);
    printOrderBtn.addEventListener('click', printOrder);

    statusModalClose.addEventListener('click', closeStatusModal);
    statusModalCancel.addEventListener('click', closeStatusModal);
    statusModalSave.addEventListener('click', updateStatus);

    orderModal.addEventListener('click', function(e) {
        if (e.target === this) closeOrderModal();
    });
    statusModal.addEventListener('click', function(e) {
        if (e.target === this) closeStatusModal();
    });

    // Khởi tạo
    loadStats();
    loadOrders('all', 1, '', '');
});