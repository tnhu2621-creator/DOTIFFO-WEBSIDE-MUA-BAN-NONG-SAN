document.addEventListener('DOMContentLoaded', function () {
    // ---- Khai báo State điều khiển hệ thống ----
    let currentStatusFilter = 'all';
    let currentDateFrom = '';
    let currentDateTo = '';
    let currentPage = 1;
    let currentSelectedOrderIdForPrint = null;

    // ---- DOM Elements ----
    const orderTableBody = document.getElementById('orderTableBody');
    const orderCountText = document.getElementById('orderCount');
    const pageInfo = document.getElementById('pageInfo');
    const prevPageBtn = document.getElementById('prevPage');
    const nextPageBtn = document.getElementById('nextPage');

    // Thống kê
    const totalOrdersEl = document.getElementById('totalOrders');
    const pendingOrdersEl = document.getElementById('pendingOrders');
    const shippingOrdersEl = document.getElementById('shippingOrders');
    const completedOrdersEl = document.getElementById('completedOrders');

    // Bộ lọc
    const filterTabs = document.getElementById('filterTabs');
    const dateFromInput = document.getElementById('dateFrom');
    const dateToInput = document.getElementById('dateTo');
    const btnFilterDate = document.getElementById('btnFilterDate');

    // Modal Chi tiết
    const orderModal = document.getElementById('orderModal');
    const orderDetailContent = document.getElementById('orderDetailContent');
    const modalClose = document.getElementById('modalClose');
    const modalCloseBtn = document.getElementById('modalCloseBtn');
    const printOrderBtn = document.getElementById('printOrderBtn');

    // Modal Cập nhật trạng thái
    const statusModal = document.getElementById('statusModal');
    const statusModalClose = document.getElementById('statusModalClose');
    const statusModalCancel = document.getElementById('statusModalCancel');
    const statusModalSave = document.getElementById('statusModalSave');
    const newStatusSelect = document.getElementById('newStatus');
    const cancelReasonGroup = document.getElementById('cancelReasonGroup');
    const cancelReasonSelect = document.getElementById('cancelReason');
    const otherReasonGroup = document.getElementById('otherReasonGroup');
    const otherReasonInput = document.getElementById('otherReason');
    const statusOrderIdInput = document.getElementById('statusOrderId');

    // ---- Khởi chạy lần đầu ----
    fetchStats();
    fetchOrders();

    // ---- Đọc Dữ liệu Thống Kê ----
    function fetchStats() {
        fetch('Donhang.php?action=get_stats')
            .then(res => res.json())
            .then(data => {
                if(data.error) return;
                totalOrdersEl.textContent = data.total;
                pendingOrdersEl.textContent = data.pending;
                shippingOrdersEl.textContent = data.shipped;
                completedOrdersEl.textContent = data.delivered;
            })
            .catch(err => console.error("Lỗi tải thống kê:", err));
    }

    // ---- Đọc Danh sách Đơn hàng ----
    function fetchOrders() {
        let url = `Donhang.php?action=get_orders&status=${currentStatusFilter}&page=${currentPage}`;
        if (currentDateFrom) url += `&dateFrom=${currentDateFrom}`;
        if (currentDateTo) url += `&dateTo=${currentDateTo}`;

        fetch(url)
            .then(res => res.json())
            .then(data => {
                renderTable(data.orders);
                orderCountText.textContent = `${data.total} đơn hàng`;
                pageInfo.textContent = `Trang ${data.currentPage} / ${data.totalPages || 1}`;
                
                currentPage = data.currentPage;
                prevPageBtn.disabled = (currentPage <= 1);
                nextPageBtn.disabled = (currentPage >= data.totalPages);
            })
            .catch(err => console.error("Lỗi tải danh sách:", err));
    }

    // ---- Hiển thị Bảng Dữ Liệu ----
    function renderTable(orders) {
        orderTableBody.innerHTML = '';
        if (!orders || orders.length === 0) {
            orderTableBody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 20px; color: #888;">Không tìm thấy đơn hàng phù hợp</td></tr>`;
            return;
        }

        orders.forEach(order => {
            const tr = document.createElement('tr');
            
            // Khóa nút sửa nếu đơn hàng ở trạng thái Đã giao hoặc Đã hủy
            const isLocked = (order.TrangThai === 'Đã giao' || order.TrangThai === 'Đã hủy') ? 'disabled' : '';

            tr.innerHTML = `
                <td><strong>#${order.MaDonHang}</strong></td>
                <td>${escapeHtml(order.customer_name || 'Khách vãng lai')}</td>
                <td><span class="text-truncate" style="max-width:200px; display:inline-block;">${escapeHtml(order.DiaChiGiaoHang || '')}</span></td>
                <td><span style="font-weight:600; color:#28a745;">${order.TongTienFormatted}</span></td>
                <td><span class="status ${order.statusClass}">${order.TrangThai}</span></td>
                <td><small>${order.NgayDatFormatted}</small></td>
                <td>
                    <button class="btn-action btn-view" title="Xem chi tiết" data-id="${order.MaDonHang}"><i class="fas fa-eye"></i></button>
                    <button class="btn-action btn-edit" title="Đổi trạng thái" data-id="${order.MaDonHang}" data-status="${order.TrangThai}" ${isLocked}><i class="fas fa-edit"></i></button>
                </td>
            `;
            orderTableBody.appendChild(tr);
        });

        // Đăng ký sự kiện click cho các nút động trong bảng
        trigggerTableButtons();
    }

    // ---- ĐÃ SỬA LỖI TẠI HÀM NÀY ----
    function trigggerTableButtons() {
        document.querySelectorAll('.btn-view').forEach(btn => {
            btn.onclick = function() { viewOrderDetails(this.getAttribute('data-id')); };
        });
        document.querySelectorAll('.btn-edit').forEach(btn => {
            // Thay thế "this" bằng "btn" để nhận diện đúng trạng thái của button
            if(!btn.hasAttribute('disabled')) {
                btn.onclick = function() { 
                    openStatusModal(this.getAttribute('data-id'), this.getAttribute('data-status')); 
                };
            }
        });
    }

    // ---- Điều khiển Bộ lọc & Phân trang ----
    filterTabs.addEventListener('click', function (e) {
        if (e.target.classList.contains('filter-tab')) {
            document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
            e.target.classList.add('active');
            currentStatusFilter = e.target.getAttribute('data-status');
            currentPage = 1;
            fetchOrders();
        }
    });

    btnFilterDate.onclick = function () {
        currentDateFrom = dateFromInput.value;
        currentDateTo = dateToInput.value;
        currentPage = 1;
        fetchOrders();
    };

    prevPageBtn.onclick = function () { if (currentPage > 1) { currentPage--; fetchOrders(); } };
    nextPageBtn.onclick = function () { currentPage++; fetchOrders(); };

    // ---- Xem Chi tiết Đơn hàng ----
    function viewOrderDetails(id) {
        fetch(`Donhang.php?action=get_detail&id=${id}`)
            .then(res => res.json())
            .then(data => {
                if(data.success) {
                    orderDetailContent.innerHTML = data.html;
                    currentSelectedOrderIdForPrint = id;
                    
                    // Chỉ cho phép in khi đơn hàng ở trạng thái "Đang xử lý"
                    if(data.TrangThai === 'Đang xử lý') {
                        printOrderBtn.style.display = 'inline-block';
                    } else {
                        printOrderBtn.style.display = 'none';
                    }
                    orderModal.style.display = 'flex';
                } else {
                    showToast(data.message, true);
                }
            });
    }

    printOrderBtn.onclick = function() {
        if(currentSelectedOrderIdForPrint) {
            window.open(`Donhang.php?action=print_order&id=${currentSelectedOrderIdForPrint}`, '_blank');
        }
    };

    // ---- CÀI ĐẶT RÀNG BUỘC LOGIC TRÊN DROPDOWN MODAL ----
    function openStatusModal(orderId, currentStatus) {
        statusOrderIdInput.value = orderId;
        newStatusSelect.innerHTML = ''; // Làm rỗng các option cũ

        let allowedOptions = [];

        // Kiểm tra chặt chẽ luồng nghiệp vụ tại Front-end
        if (currentStatus === 'Chờ xác nhận') {
            allowedOptions = [
                { value: 'Chờ xác nhận', text: 'Chờ xác nhận' },
                { value: 'Đang xử lý', text: 'Đang xử lý' },
                { value: 'Đã hủy', text: 'Đã hủy' }
            ];
        } else if (currentStatus === 'Đang xử lý') {
            allowedOptions = [
                { value: 'Đang xử lý', text: 'Đang xử lý' },
                { value: 'Đang giao', text: 'Đang giao' },
                { value: 'Đã hủy', text: 'Đã hủy' }
            ];
        } else if (currentStatus === 'Đang giao') {
            allowedOptions = [
                { value: 'Đang giao', text: 'Đang giao' },
                { value: 'Đã giao', text: 'Đã giao' },
                { value: 'Đã hủy', text: 'Đã hủy' }
            ];
        } else {
            showToast('Đơn hàng đã chốt trạng thái (Đã giao/Đã hủy), không được phép chỉnh sửa!', true);
            return;
        }

        // Tạo giao diện dropdown động
        allowedOptions.forEach(opt => {
            const option = document.createElement('option');
            option.value = opt.value;
            option.textContent = opt.text;
            if (opt.value === currentStatus) option.selected = true;
            newStatusSelect.appendChild(option);
        });

        // Reset lại form lý do hủy về ban đầu
        cancelReasonGroup.style.display = 'none';
        otherReasonGroup.style.display = 'none';
        cancelReasonSelect.value = '';
        otherReasonInput.value = '';

        statusModal.style.display = 'flex';
    }

    // Lắng nghe thay đổi của Dropdown trạng thái mới để đóng mở form hủy
    newStatusSelect.onchange = function () {
        if (this.value === 'Đã hủy') {
            cancelReasonGroup.style.display = 'block';
        } else {
            cancelReasonGroup.style.display = 'none';
            otherReasonGroup.style.display = 'none';
        }
    };

    // Lắng nghe lý do hủy khác
    cancelReasonSelect.onchange = function () {
        if (this.value === 'Lý do khác (ghi rõ bên dưới)') {
            otherReasonGroup.style.display = 'block';
        } else {
            otherReasonGroup.style.display = 'none';
        }
    };

    // ---- Lưu Cập Nhật Trạng Thái ----
    statusModalSave.onclick = function () {
        const orderId = statusOrderIdInput.value;
        const newStatus = newStatusSelect.value;
        
        let finalReason = '';
        if (newStatus === 'Đã hủy') {
            const selectedReason = cancelReasonSelect.value;
            if (!selectedReason) {
                showToast('Vui lòng chọn lý do hủy đơn!', true);
                return;
            }
            if (selectedReason === 'Lý do khác (ghi rõ bên dưới)') {
                finalReason = otherReasonInput.value.trim();
                if (!finalReason) {
                    showToast('Vui lòng nhập lý do cụ thể!', true);
                    return;
                }
            } else {
                finalReason = selectedReason;
            }
        }

        // Tạo dữ liệu POST gửi lên PHP
        const formData = new FormData();
        formData.append('action', 'update_status');
        formData.append('orderId', orderId);
        formData.append('newStatus', newStatus);
        formData.append('ly_do_huy', finalReason);

        fetch('Donhang.php', { method: 'POST', body: formData })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    showToast(data.message);
                    statusModal.style.display = 'none';
                    fetchStats();
                    fetchOrders();
                } else {
                    showToast(data.message, true);
                }
            })
            .catch(err => {
                console.error(err);
                showToast('Đã có lỗi kết nối đến máy chủ.', true);
            });
    };

    // ---- Đóng mở đóng mở Modals và Toast hệ thống ----
    function closeModal() {
        orderModal.style.display = 'none';
        statusModal.style.display = 'none';
    }

    modalClose.onclick = closeModal;
    modalCloseBtn.onclick = closeModal;
    statusModalClose.onclick = closeModal;
    statusModalCancel.onclick = closeModal;

    window.onclick = function (e) {
        if (e.target === orderModal || e.target === statusModal) closeModal();
    };

    function showToast(message, isError = false) {
        const toast = document.getElementById('toast');
        const msg = document.getElementById('toastMessage');
        msg.textContent = message;
        
        if (isError) {
            toast.style.background = '#dc3545';
            toast.querySelector('i').className = 'fas fa-exclamation-circle';
        } else {
            toast.style.background = '#28a745';
            toast.querySelector('i').className = 'fas fa-check-circle';
        }
        
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3000);
    }

    function escapeHtml(text) {
        if(!text) return '';
        const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
        return text.replace(/[&<>"']/g, function(m) { return map[m]; });
    }
});