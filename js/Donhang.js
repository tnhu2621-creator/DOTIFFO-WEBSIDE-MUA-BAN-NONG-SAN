
        document.addEventListener('DOMContentLoaded', function() {
            let currentStatus = 'all';
            let currentPage = 1;
            let dateFrom = '';
            let dateTo = '';

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
            const statusModal = document.getElementById('statusModal');
            const statusModalClose = document.getElementById('statusModalClose');
            const statusModalCancel = document.getElementById('statusModalCancel');
            const statusOrderId = document.getElementById('statusOrderId');
            const newStatusSelect = document.getElementById('newStatus');
            const statusModalSave = document.getElementById('statusModalSave');

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
                    return fetch(url).then(res => res.json());
                } else {
                    return fetch(url, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                        body: new URLSearchParams(params)
                    }).then(res => res.json());
                }
            }

            function loadStats() {
                fetchAPI('get_stats').then(data => {
                    totalOrdersEl.textContent = data.total || 0;
                    pendingOrdersEl.textContent = data.pending || 0;
                    shippingOrdersEl.textContent = data.shipped || 0;
                    completedOrdersEl.textContent = data.delivered || 0;
                }).catch(() => showToast('Không thể tải thống kê', false));
            }

            function loadOrders(status, page, from, to) {
                const params = { status, page, dateFrom: from || '', dateTo: to || '' };
                fetchAPI('get_orders', params).then(data => {
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
                }).catch(() => showToast('Lỗi kết nối', false));
            }

            function renderOrders(orders) {
                if (!orders || orders.length === 0) {
                    orderTableBody.innerHTML = '<tr><td colspan="7" style="text-align:center;">Không có đơn hàng nào</td></tr>';
                    return;
                }
                let html = '';
                orders.forEach(order => {
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
                                <a href="#" data-id="${order.MaDonHang}" class="edit-status"><i class="fas fa-edit"></i></a>
                            </td>
                        </tr>
                    `;
                });
                orderTableBody.innerHTML = html;

                document.querySelectorAll('.view-detail').forEach(btn => {
                    btn.addEventListener('click', function(e) {
                        e.preventDefault();
                        viewOrderDetail(this.dataset.id);
                    });
                });
                document.querySelectorAll('.edit-status').forEach(btn => {
                    btn.addEventListener('click', function(e) {
                        e.preventDefault();
                        openStatusModal(this.dataset.id);
                    });
                });
            }

            function viewOrderDetail(id) {
                fetchAPI('get_detail', { id }).then(data => {
                    if (data.success) {
                        orderDetailContent.innerHTML = data.php;
                        orderModal.classList.add('active');
                    } else {
                        showToast(data.message || 'Không tìm thấy đơn hàng', false);
                    }
                }).catch(() => showToast('Lỗi tải chi tiết', false));
            }

            function openStatusModal(id) {
                statusOrderId.value = id;
                statusModal.classList.add('active');
            }

            function closeOrderModal() {
                orderModal.classList.remove('active');
            }

            function closeStatusModal() {
                statusModal.classList.remove('active');
            }

            function updateStatus() {
                const orderId = statusOrderId.value;
                const newStatus = newStatusSelect.value;
                if (!orderId) return;
                fetchAPI('update_status', { orderId, newStatus }, 'POST').then(data => {
                    if (data.success) {
                        showToast('Cập nhật trạng thái thành công!');
                        closeStatusModal();
                        loadOrders(currentStatus, currentPage, dateFrom, dateTo);
                        loadStats();
                    } else {
                        showToast(data.message || 'Cập nhật thất bại', false);
                    }
                }).catch(() => showToast('Lỗi kết nối', false));
            }

            // Sự kiện filter tabs
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
