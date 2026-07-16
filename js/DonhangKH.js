(function() {
    'use strict';

    // Lấy dữ liệu từ server (được gắn vào window)
    let orders = window.ordersData || [];
    const lastOrderId = window.lastOrderId || null;

    // DOM elements
    const activeOrdersEl = document.getElementById('activeOrders');
    const historyOrdersEl = document.getElementById('historyOrders');
    const activeBadge = document.getElementById('activeBadge');
    const tabBtns = document.querySelectorAll('.tab-btn');

    // Modal detail
    const detailModal = document.getElementById('orderDetailModal');
    const detailContent = document.getElementById('orderDetailContent');
    const detailModalClose = document.getElementById('detailModalClose');
    const detailModalCancel = document.getElementById('detailModalCancel');

    // Modal cancel
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
        return Number(price).toLocaleString('vi-VN') + ' đ';
    }

    function formatDate(dateStr) {
        const d = new Date(dateStr);
        return d.toLocaleDateString('vi-VN');
    }

    function getStatusClass(status) {
        const map = {
            'Chờ xác nhận': 'status-pending',
            'Đang xử lý': 'status-processing',
            'Đang giao': 'status-shipped',
            'Đã giao': 'status-delivered',
            'Đã hủy': 'status-cancelled'
        };
        return map[status] || '';
    }

    function getStatusText(status) {
        return status || 'Chờ xác nhận';
    }

    function showToast(message, type = 'success') {
        toastMsg.textContent = message;
        toast.className = 'toast show';
        toast.style.borderLeftColor = (type === 'error') ? '#dc3545' : '#e83e8c';
        clearTimeout(toast._timer);
        toast._timer = setTimeout(() => toast.classList.remove('show'), 3000);
    }

    // ===== RENDER ORDERS =====
    function renderOrders() {
        const activeStatuses = ['Chờ xác nhận', 'Đang xử lý', 'Đang giao'];
        const activeOrders = orders.filter(o => activeStatuses.includes(o.TrangThai));
        const historyOrders = orders.filter(o => !activeStatuses.includes(o.TrangThai));

        activeBadge.textContent = activeOrders.length;

        // Render active
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

        // Render history
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
                cancelOrder(this.dataset.id);
            });
        });
        document.querySelectorAll('.btn-view-order').forEach(btn => {
            btn.addEventListener('click', function() {
                viewOrderDetail(this.dataset.id);
            });
        });

        // Highlight đơn hàng mới (nếu có)
        if (lastOrderId) {
            const card = document.querySelector(`.order-card[data-id="${lastOrderId}"]`);
            if (card) {
                card.style.border = '2px solid #28a745';
                card.style.boxShadow = '0 0 0 3px rgba(40,167,69,0.3)';
                setTimeout(() => {
                    card.style.border = '';
                    card.style.boxShadow = '';
                }, 5000);
            }
        }
    }

    function renderOrderCard(order, isHistory = false) {
        const canCancel = !isHistory && (order.TrangThai === 'Chờ xác nhận' || order.TrangThai === 'Đang xử lý');
        const itemsPreview = order.items ? order.items.map(item => `${item.TenSanPham} x${item.SoLuong}`).join(', ') : '';

        return `
            <div class="order-card" data-id="${order.MaDonHang}">
                <div class="order-card-header">
                    <div>
                        <div class="order-code"><i class="fas fa-receipt"></i> ${order.MaDonHang}</div>
                        <div class="order-date"><i class="far fa-calendar-alt"></i> ${formatDate(order.NgayDat)}</div>
                    </div>
                    <span class="order-status ${getStatusClass(order.TrangThai)}">${getStatusText(order.TrangThai)}</span>
                </div>
                <div class="order-card-body">
                    <div class="order-products">
                        <div class="order-product-item">
                            <span class="name">${itemsPreview}</span>
                            <span class="price">${formatPrice(order.TongTien)}</span>
                        </div>
                    </div>
                </div>
                <div class="order-card-footer">
                    <div class="order-total">
                        Tổng: <span>${formatPrice(order.TongTien)}</span>
                    </div>
                    <div class="order-actions">
                        <button class="btn-view btn-view-order" data-id="${order.MaDonHang}"><i class="fas fa-eye"></i> Xem chi tiết</button>
                        ${canCancel ? `<button class="btn-danger btn-cancel-order" data-id="${order.MaDonHang}"><i class="fas fa-times"></i> Hủy đơn</button>` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    // ===== VIEW ORDER DETAIL =====
    function viewOrderDetail(id) {
        const order = orders.find(o => o.MaDonHang === id);
        if (!order) return;

        const itemsHtml = order.items ? order.items.map(item => `
            <tr>
                <td>${item.TenSanPham}</td>
                <td>${item.SoLuong}</td>
                <td>${formatPrice(item.DonGia)}</td>
                <td>${formatPrice(item.SoLuong * item.DonGia)}</td>
            </tr>
        `).join('') : '';

        detailContent.innerHTML = `
            <div class="detail-grid">
                <div class="detail-item"><strong>Mã đơn</strong><span>${order.MaDonHang}</span></div>
                <div class="detail-item"><strong>Ngày đặt</strong><span>${formatDate(order.NgayDat)}</span></div>
                <div class="detail-item"><strong>Trạng thái</strong><span class="status-badge ${getStatusClass(order.TrangThai)}">${getStatusText(order.TrangThai)}</span></div>
                <div class="detail-item"><strong>Thanh toán</strong><span>${order.PhuongThucThanhToan || 'COD'}</span></div>
                <div class="detail-item" style="grid-column: 1 / -1;"><strong>Địa chỉ giao hàng</strong><span>${order.DiaChiGiaoHang}</span></div>
                ${order.GhiChu ? `<div class="detail-item" style="grid-column: 1 / -1;"><strong>Ghi chú</strong><span>${order.GhiChu}</span></div>` : ''}
            </div>
            <div class="detail-products">
                <h4>Sản phẩm</h4>
                <table>
                    <thead><tr><th>Tên sản phẩm</th><th>Số lượng</th><th>Đơn giá</th><th>Thành tiền</th></tr></thead>
                    <tbody>${itemsHtml}</tbody>
                </table>
                <div class="detail-total">Tổng cộng: <span>${formatPrice(order.TongTien)}</span></div>
            </div>
        `;
        detailModal.classList.add('open');
    }

    // ===== CANCEL ORDER (gửi AJAX lên server) =====
    function cancelOrder(id) {
        const order = orders.find(o => o.MaDonHang === id);
        if (!order) return;
        if (order.TrangThai !== 'Chờ xác nhận' && order.TrangThai !== 'Đang xử lý') {
            showToast('Đơn hàng này không thể hủy.', 'error');
            return;
        }
        cancelOrderCode.textContent = order.MaDonHang;
        cancelOrderId.value = id;
        cancelModal.classList.add('open');
    }

    function confirmCancelOrder() {
        const id = cancelOrderId.value;
        // Gửi AJAX đến server để hủy đơn
        fetch('huy_don_hang.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: 'id=' + encodeURIComponent(id)
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                cancelModal.classList.remove('open');
                showToast('Hủy đơn hàng thành công');
                // Tải lại trang để cập nhật dữ liệu mới từ server
                window.location.reload();
            } else {
                showToast(data.message || 'Hủy đơn thất bại', 'error');
            }
        })
        .catch(err => {
            showToast('Lỗi kết nối server', 'error');
            console.error(err);
        });
    }

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

    // ===== MODAL EVENTS =====
    detailModalClose.addEventListener('click', () => detailModal.classList.remove('open'));
    detailModalCancel.addEventListener('click', () => detailModal.classList.remove('open'));
    detailModal.addEventListener('click', e => { if (e.target === detailModal) detailModal.classList.remove('open'); });

    cancelModalClose.addEventListener('click', () => cancelModal.classList.remove('open'));
    cancelModalCancel.addEventListener('click', () => cancelModal.classList.remove('open'));
    cancelModal.addEventListener('click', e => { if (e.target === cancelModal) cancelModal.classList.remove('open'); });
    cancelModalConfirm.addEventListener('click', confirmCancelOrder);

    // ===== INIT =====
    renderOrders();
    console.log('📦 Đơn hàng đã được tải từ server.');
})();