(function() {
    'use strict';

    // ===== DỮ LIỆU MẪU =====
    // Danh sách đơn hàng (giả lập)
    const ordersData = [
        {
            id: 1,
            code: 'ORD-20260115-001',
            date: '2026-01-15',
            status: 'pending', // pending, processing, shipped, delivered, cancelled
            statusText: 'Chờ xác nhận',
            total: 255000,
            items: [
                { name: 'Trà Sen Tháp Mười', qty: 3, price: 85000 },
                { name: 'Mật ong Tràm', qty: 1, price: 180000 }
            ],
            address: '123 Đường Nông Sản, Phường 1, Đồng Tháp',
            payment: 'Tiền mặt'
        },
        {
            id: 2,
            code: 'ORD-20260120-002',
            date: '2026-01-20',
            status: 'processing',
            statusText: 'Đang xử lý',
            total: 360000,
            items: [
                { name: 'Xoài Cát Hòa Lộc', qty: 3, price: 120000 }
            ],
            address: '456 Đường Trái Cây, Phường 2, Tiền Giang',
            payment: 'Chuyển khoản'
        },
        {
            id: 3,
            code: 'ORD-20260122-003',
            date: '2026-01-22',
            status: 'shipped',
            statusText: 'Đang giao',
            total: 180000,
            items: [
                { name: 'Gạo Nàng Hoa', qty: 2, price: 55000 },
                { name: 'Ánh Trà Sen', qty: 1, price: 65000 }
            ],
            address: '789 Đường Đặc Sản, Phường 3, Đồng Tháp',
            payment: 'Tiền mặt'
        },
        {
            id: 4,
            code: 'ORD-20260110-004',
            date: '2026-01-10',
            status: 'delivered',
            statusText: 'Đã giao',
            total: 320000,
            items: [
                { name: 'Trà Sen Tháp Mười', qty: 2, price: 85000 },
                { name: 'Xoài Cát Hòa Lộc', qty: 1, price: 120000 },
                { name: 'Mật ong Tràm', qty: 1, price: 180000 }
            ],
            address: '321 Đường Gạo Nàng, Phường 4, Tiền Giang',
            payment: 'Thẻ tín dụng'
        },
        {
            id: 5,
            code: 'ORD-20260105-005',
            date: '2026-01-05',
            status: 'cancelled',
            statusText: 'Đã hủy',
            total: 110000,
            items: [
                { name: 'Gạo Nàng Hoa', qty: 2, price: 55000 }
            ],
            address: '654 Đường Sen, Phường 5, Đồng Tháp',
            payment: 'Chuyển khoản'
        },
        {
            id: 6,
            code: 'ORD-20260125-006',
            date: '2026-01-25',
            status: 'pending',
            statusText: 'Chờ xác nhận',
            total: 220000,
            items: [
                { name: 'Mật ong Tràm', qty: 1, price: 180000 },
                { name: 'Ánh Trà Sen', qty: 1, price: 65000 }
            ],
            address: '987 Đường Tràm, Phường 6, Tiền Giang',
            payment: 'Tiền mặt'
        },
        {
            id: 7,
            code: 'ORD-20260118-007',
            date: '2026-01-18',
            status: 'delivered',
            statusText: 'Đã giao',
            total: 195000,
            items: [
                { name: 'Ánh Trà Sen', qty: 3, price: 65000 }
            ],
            address: '111 Đường Trà Sen, Phường 7, Đồng Tháp',
            payment: 'Tiền mặt'
        }
    ];

    // ===== DOM REFS =====
    const activeTab = document.getElementById('tab-active');
    const historyTab = document.getElementById('tab-history');
    const activeOrdersEl = document.getElementById('activeOrders');
    const historyOrdersEl = document.getElementById('historyOrders');
    const activeBadge = document.getElementById('activeBadge');
    const tabBtns = document.querySelectorAll('.tab-btn');

    // Modal chi tiết
    const detailModal = document.getElementById('orderDetailModal');
    const detailContent = document.getElementById('orderDetailContent');
    const detailModalClose = document.getElementById('detailModalClose');
    const detailModalCancel = document.getElementById('detailModalCancel');

    // Modal hủy đơn
    const cancelModal = document.getElementById('cancelModal');
    const cancelOrderCode = document.getElementById('cancelOrderCode');
    const cancelOrderId = document.getElementById('cancelOrderId');
    const cancelModalClose = document.getElementById('cancelModalClose');
    const cancelModalCancel = document.getElementById('cancelModalCancel');
    const cancelModalConfirm = document.getElementById('cancelModalConfirm');

    // Toast
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toastMessage');

    // ===== HELPERS =====
    function formatPrice(price) {
        return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') + ' đ';
    }

    function formatDate(dateStr) {
        const d = new Date(dateStr);
        return d.toLocaleDateString('vi-VN');
    }

    function getStatusClass(status) {
        const map = {
            'pending': 'status-pending',
            'processing': 'status-processing',
            'shipped': 'status-shipped',
            'delivered': 'status-delivered',
            'cancelled': 'status-cancelled'
        };
        return map[status] || '';
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

    // ===== CANCEL ORDER =====
    function cancelOrder(id) {
        const order = ordersData.find(o => o.id === id);
        if (!order) return;

        // Chỉ cho phép hủy nếu đang ở trạng thái pending hoặc processing
        if (order.status !== 'pending' && order.status !== 'processing') {
            showToast('Đơn hàng này không thể hủy.', 'error');
            return;
        }

        cancelOrderCode.textContent = order.code;
        cancelOrderId.value = id;
        cancelModal.classList.add('open');
    }

    function confirmCancelOrder() {
        const id = parseInt(cancelOrderId.value);
        const order = ordersData.find(o => o.id === id);
        if (!order) return;

        order.status = 'cancelled';
        order.statusText = 'Đã hủy';

        cancelModal.classList.remove('open');
        renderOrders();
        showToast(`Đã hủy đơn hàng ${order.code}`);
    }

    // ===== VIEW ORDER DETAIL =====
    function viewOrderDetail(id) {
        const order = ordersData.find(o => o.id === id);
        if (!order) return;

        let itemsHtml = order.items.map(item => `
            <tr>
                <td>${item.name}</td>
                <td>${item.qty}</td>
                <td>${formatPrice(item.price)}</td>
                <td>${formatPrice(item.qty * item.price)}</td>
            </tr>
        `).join('');

        detailContent.innerHTML = `
            <div class="detail-grid">
                <div class="detail-item">
                    <strong>Mã đơn hàng</strong>
                    <span>${order.code}</span>
                </div>
                <div class="detail-item">
                    <strong>Ngày đặt</strong>
                    <span>${formatDate(order.date)}</span>
                </div>
                <div class="detail-item">
                    <strong>Trạng thái</strong>
                    <span class="status-badge ${getStatusClass(order.status)}">${order.statusText}</span>
                </div>
                <div class="detail-item">
                    <strong>Phương thức thanh toán</strong>
                    <span>${order.payment}</span>
                </div>
                <div class="detail-item" style="grid-column: 1 / -1;">
                    <strong>Địa chỉ giao hàng</strong>
                    <span>${order.address}</span>
                </div>
            </div>
            <div class="detail-products">
                <h4 style="margin-bottom:8px; color:var(--green-dark);">Sản phẩm</h4>
                <table>
                    <thead>
                        <tr><th>Tên sản phẩm</th><th>Số lượng</th><th>Đơn giá</th><th>Thành tiền</th></tr>
                    </thead>
                    <tbody>${itemsHtml}</tbody>
                </table>
                <div class="detail-total">
                    Tổng cộng: <span>${formatPrice(order.total)}</span>
                </div>
            </div>
        `;

        detailModal.classList.add('open');
    }

    // ===== RENDER ORDERS =====
    function renderOrders() {
        // Active orders (pending, processing, shipped)
        const activeOrders = ordersData.filter(o => o.status === 'pending' || o.status === 'processing' || o.status === 'shipped');
        // History orders (delivered, cancelled)
        const historyOrders = ordersData.filter(o => o.status === 'delivered' || o.status === 'cancelled');

        // Update badge
        activeBadge.textContent = activeOrders.length;

        // Render active orders
        if (activeOrders.length === 0) {
            activeOrdersEl.innerHTML = `
                <div class="empty-orders">
                    <i class="fas fa-box-open"></i>
                    <h3>Không có đơn hàng nào đang hoạt động</h3>
                    <p>Bạn chưa có đơn hàng nào hoặc tất cả đều đã hoàn thành.</p>
                    <a href="sanphamKH.php" class="btn-primary" style="margin-top:16px; display:inline-block;"><i class="fas fa-shopping-cart"></i> Mua sắm ngay</a>
                </div>
            `;
        } else {
            activeOrdersEl.innerHTML = activeOrders.map(order => renderOrderCard(order)).join('');
        }

        // Render history orders
        if (historyOrders.length === 0) {
            historyOrdersEl.innerHTML = `
                <div class="empty-orders">
                    <i class="fas fa-history"></i>
                    <h3>Chưa có lịch sử đơn hàng</h3>
                    <p>Khi bạn có đơn hàng hoàn thành hoặc bị hủy, chúng sẽ xuất hiện ở đây.</p>
                </div>
            `;
        } else {
            historyOrdersEl.innerHTML = historyOrders.map(order => renderOrderCard(order, true)).join('');
        }

        // Gắn sự kiện cho các nút
        document.querySelectorAll('.btn-cancel-order').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = parseInt(this.dataset.id);
                cancelOrder(id);
            });
        });

        document.querySelectorAll('.btn-view-order').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = parseInt(this.dataset.id);
                viewOrderDetail(id);
            });
        });
    }

    function renderOrderCard(order, isHistory = false) {
        const canCancel = (order.status === 'pending' || order.status === 'processing') && !isHistory;
        const itemsPreview = order.items.map(item => `${item.name} x${item.qty}`).join(', ');

        return `
            <div class="order-card">
                <div class="order-card-header">
                    <div>
                        <div class="order-code"><i class="fas fa-receipt"></i> ${order.code}</div>
                        <div class="order-date"><i class="far fa-calendar-alt"></i> ${formatDate(order.date)}</div>
                    </div>
                    <span class="order-status ${getStatusClass(order.status)}">${order.statusText}</span>
                </div>
                <div class="order-card-body">
                    <div class="order-products">
                        <div class="order-product-item">
                            <span class="name">${itemsPreview}</span>
                            <span class="price">${formatPrice(order.total)}</span>
                        </div>
                    </div>
                </div>
                <div class="order-card-footer">
                    <div class="order-total">
                        Tổng: <span>${formatPrice(order.total)}</span>
                    </div>
                    <div class="order-actions">
                        <button class="btn-view btn-view-order" data-id="${order.id}"><i class="fas fa-eye"></i> Xem chi tiết</button>
                        ${canCancel ? `<button class="btn-danger btn-cancel-order" data-id="${order.id}"><i class="fas fa-times"></i> Hủy đơn</button>` : ''}
                    </div>
                </div>
            </div>
        `;
    }

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

    // ===== MODAL EVENTS =====
    // Detail modal
    detailModalClose.addEventListener('click', function() {
        detailModal.classList.remove('open');
    });

    detailModalCancel.addEventListener('click', function() {
        detailModal.classList.remove('open');
    });

    detailModal.addEventListener('click', function(e) {
        if (e.target === detailModal) {
            detailModal.classList.remove('open');
        }
    });

    // Cancel modal
    cancelModalClose.addEventListener('click', function() {
        cancelModal.classList.remove('open');
    });

    cancelModalCancel.addEventListener('click', function() {
        cancelModal.classList.remove('open');
    });

    cancelModal.addEventListener('click', function(e) {
        if (e.target === cancelModal) {
            cancelModal.classList.remove('open');
        }
    });

    cancelModalConfirm.addEventListener('click', confirmCancelOrder);

    // ===== INIT =====
    renderOrders();
    console.log('📦 Trang đơn hàng của tôi đã sẵn sàng!');
})();