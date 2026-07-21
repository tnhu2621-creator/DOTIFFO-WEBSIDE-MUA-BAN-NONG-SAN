(function() {
    'use strict';

    let stockData = [];
    let currentPage = 1;
    const itemsPerPage = 5;

    // DOM refs
    let tbody = document.getElementById('stockTableBody');
    let filterCategory = document.getElementById('filter-danhmuc');
    let filterStatus = document.getElementById('filter-trangthai');
    let stockCount = document.getElementById('stockCount');
    let totalProductsEl = document.getElementById('totalProducts');
    let totalStockEl = document.getElementById('totalStock');
    let lowStockCountEl = document.getElementById('lowStockCount');
    let expiringCountEl = document.getElementById('expiringCount'); // Thống kê Sắp hết hạn
    let prevPageBtn = document.getElementById('prevPage');
    let nextPageBtn = document.getElementById('nextPage');
    let pageInfo = document.getElementById('pageInfo');
    let searchInput = document.getElementById('searchInput');

    // ===== HÀM XÁC ĐỊNH TRẠNG THÁI TỒN KHO =====
    function getStatus(quantity) {
        if (quantity <= 0) return { text: 'Hết hàng', class: 'status-danger' };
        if (quantity <= 10) return { text: 'Sắp hết hàng', class: 'status-warning' };
        return { text: 'Đủ hàng', class: 'status-success' };
    }

    // ===== HÀM XÁC ĐỊNH TRẠNG THÁI HẠN SỬ DỤNG (HSD) =====
    function getExpiryStatus(expiryDateStr) {
        if (!expiryDateStr) return { text: 'Không HSD', class: '', type: 'none' };

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const expDate = new Date(expiryDateStr);
        expDate.setHours(0, 0, 0, 0);

        if (isNaN(expDate.getTime())) return { text: 'Không HSD', class: '', type: 'none' };

        const diffTime = expDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
            return { text: `Đã hết hạn (${Math.abs(diffDays)} ngày)`, class: 'status-danger', type: 'expired' };
        } else if (diffDays <= 7) { // 👈 Cảnh báo khi HSD còn từ 7 ngày trở xuống
            return { text: `Sắp hết hạn (${diffDays} ngày)`, class: 'status-warning', type: 'expiring' };
        } else {
            return { text: `Còn HSD (${diffDays} ngày)`, class: 'status-success', type: 'ok' };
        }
    }

    function formatPrice(price) {
        if (!price && price !== 0) return '0 đ';
        return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') + ' đ';
    }

    function showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        const toastMsg = document.getElementById('toastMessage');
        if (!toast) return;
        toastMsg.textContent = message;
        toast.className = 'toast show';
        toast.style.borderLeftColor = (type === 'error') ? '#dc3545' : 'var(--pink)';
        clearTimeout(toast._timer);
        toast._timer = setTimeout(() => toast.classList.remove('show'), 3000);
    }

    // ===== LOAD DỮ LIỆU TỪ API =====
    function loadStockData() {
        fetch('includes/get_stock.php')
            .then(response => {
                if (!response.ok) throw new Error('HTTP ' + response.status);
                return response.json();
            })
            .then(data => {
                if (data.error) throw new Error(data.error);
                stockData = data;
                renderTable();
            })
            .catch(err => {
                console.error('Lỗi:', err);
                showToast('Không tải được dữ liệu: ' + err.message, 'error');
                if (tbody) {
                    tbody.innerHTML = `
                        <tr>
                            <td colspan="7" style="text-align:center; padding:40px; color:var(--gray-400);">
                                <i class="fas fa-exclamation-triangle" style="font-size:2rem; display:block; margin-bottom:8px;"></i>
                                Lỗi kết nối máy chủ
                            </td>
                        </tr>
                    `;
                }
            });
    }

    // ===== UPDATE THỐNG KÊ (ĐÃ SỬA LỖI DOM REF) =====
    function updateStats() {
        if (!expiringCountEl) expiringCountEl = document.getElementById('expiringCount');
        if (!totalProductsEl) totalProductsEl = document.getElementById('totalProducts');
        if (!totalStockEl) totalStockEl = document.getElementById('totalStock');
        if (!lowStockCountEl) lowStockCountEl = document.getElementById('lowStockCount');

        const total = stockData.length;
        const totalStock = stockData.reduce((sum, item) => sum + (item.quantity || 0), 0);
        const lowStock = stockData.filter(item => item.quantity > 0 && item.quantity <= 10).length;

        // 🎯 Đếm số lượng sản phẩm SẮP HẾT HẠN hoặc ĐÃ HẾT HẠN
        const expiringCount = stockData.filter(item => {
            const expiryDateRaw = item.NgayHetHan || item.ngay_het_han;
            const expiry = getExpiryStatus(expiryDateRaw);
            return expiry.type === 'expiring' || expiry.type === 'expired';
        }).length;

        if (totalProductsEl) totalProductsEl.textContent = total;
        if (totalStockEl) totalStockEl.textContent = totalStock;
        if (lowStockCountEl) lowStockCountEl.textContent = lowStock;
        if (expiringCountEl) expiringCountEl.textContent = expiringCount;
    }

    // ===== LỌC DỮ LIỆU =====
    function getFilteredData() {
        const keyword = searchInput ? searchInput.value.toLowerCase().trim() : '';
        const category = filterCategory ? filterCategory.value : '';
        const statusFilter = filterStatus ? filterStatus.value : '';

        return stockData.filter(item => {
            const matchName = (item.name || '').toLowerCase().includes(keyword) || (item.id || '').toString().toLowerCase().includes(keyword);
            const matchCategory = !category || category === 'all' || item.category === category;
            
            const stockStatus = getStatus(item.quantity).text;
            const expiry = getExpiryStatus(item.NgayHetHan || item.ngay_het_han);

            let matchStatus = true;
            if (statusFilter && statusFilter !== 'all') {
                if (statusFilter === 'expiring' || statusFilter === 'sap-het-han-hsd') {
                    matchStatus = expiry.type === 'expiring';
                } else if (statusFilter === 'expired' || statusFilter === 'het-han-hsd') {
                    matchStatus = expiry.type === 'expired';
                } else {
                    matchStatus = stockStatus === statusFilter;
                }
            }

            return matchName && matchCategory && matchStatus;
        });
    }

    // ===== RENDER BẢNG =====
    function renderTable() {
        if (!tbody) {
            tbody = document.getElementById('stockTableBody');
            if (!tbody) return;
        }

        const filtered = getFilteredData();
        const totalItems = filtered.length;
        const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;

        if (currentPage > totalPages) currentPage = totalPages;

        const start = (currentPage - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        const pageItems = filtered.slice(start, end);

        if (stockCount) stockCount.textContent = `${totalItems} sản phẩm`;
        if (pageInfo) pageInfo.textContent = `Trang ${currentPage} / ${totalPages}`;
        if (prevPageBtn) prevPageBtn.disabled = currentPage <= 1;
        if (nextPageBtn) nextPageBtn.disabled = currentPage >= totalPages;

        if (pageItems.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align:center; padding:40px; color:var(--gray-400);">
                        <i class="fas fa-warehouse" style="font-size:2rem; display:block; margin-bottom:8px;"></i>
                        Không tìm thấy sản phẩm
                    </td>
                </tr>
            `;
            return;
        }

        let html = '';
        pageItems.forEach(item => {
            const status = getStatus(item.quantity);
            const giaNhap = item.GiaNhap || 0;
            const expiryDateRaw = item.NgayHetHan || item.ngay_het_han;
            const expiry = getExpiryStatus(expiryDateRaw);

            // Dòng hiển thị ngày HSD dưới tên SP
            let expiryTextSub = '';
            if (expiryDateRaw) {
                const formattedDate = new Date(expiryDateRaw).toLocaleDateString('vi-VN');
                expiryTextSub = `<small style="display:block; color:#6b7280; font-size:0.78rem; margin-top:2px;"><i class="far fa-calendar-alt"></i> HSD: ${formattedDate}</small>`;
            }

            // Nhãn cảnh báo HSD
            let expiryBadge = '';
            if (expiry.type === 'expired') {
                expiryBadge = `<div style="margin-top:4px;"><span class="status status-danger" style="font-size:0.75rem;"><i class="fas fa-exclamation-circle"></i> ${expiry.text}</span></div>`;
            } else if (expiry.type === 'expiring') {
                expiryBadge = `<div style="margin-top:4px;"><span class="status status-warning" style="font-size:0.75rem;"><i class="fas fa-clock"></i> ${expiry.text}</span></div>`;
            }

            html += `
                <tr>
                    <td>#${String(item.id).padStart(3, '0')}</td>
                    <td>
                        <strong>${item.name}</strong>
                        ${expiryTextSub}
                    </td>
                    <td>${item.category}</td>
                    <td>${item.quantity}</td>
                    <td>${formatPrice(giaNhap)}</td>
                    <td>
                        <span class="status ${status.class}">${status.text}</span>
                        ${expiryBadge}
                    </td>
                    <td>
                        <button class="action-btn edit" onclick="openAdjustModal('${item.id}')"><i class="fas fa-edit"></i></button>
                        <button class="action-btn history" onclick="openHistoryModal('${item.id}')"><i class="fas fa-clock"></i></button>
                    </td>
                </tr>
            `;
        });
        tbody.innerHTML = html;
        updateStats();
    }

    // ===== MỞ MODAL ĐIỀU CHỈNH =====
    window.openAdjustModal = function(id) {
        const item = stockData.find(p => String(p.id) === String(id));
        if (!item) return;
        document.getElementById('adjustProductId').value = item.id;
        document.getElementById('adjustProductName').value = item.name;
        document.getElementById('adjustCurrentStock').value = item.quantity;
        document.getElementById('adjustNewStock').value = item.quantity;
        document.getElementById('adjustReason').value = 'Kiểm kê';
        document.getElementById('adjustNote').value = '';
        document.getElementById('adjustModal').classList.add('open');
    };

    // ===== LƯU ĐIỀU CHỈNH =====
    function saveAdjustment() {
        const id = document.getElementById('adjustProductId').value;
        const newStock = parseInt(document.getElementById('adjustNewStock').value);
        const reason = document.getElementById('adjustReason').value;
        const note = document.getElementById('adjustNote').value.trim();
        const adjustModal = document.getElementById('adjustModal');

        if (isNaN(newStock) || newStock < 0) {
            showToast('Vui lòng nhập số lượng hợp lệ.', 'error');
            return;
        }

        fetch('includes/update_stock.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, newStock, reason, note })
        })
        .then(res => res.json())
        .then(result => {
            if (result.success) {
                adjustModal.classList.remove('open');
                loadStockData();
                showToast(result.message);
            } else {
                showToast(result.message, 'error');
            }
        })
        .catch(err => {
            showToast('Lỗi kết nối đến server', 'error');
        });
    }

    // ===== LỊCH SỬ =====
    window.openHistoryModal = function(id) {
        fetch(`includes/get_history.php?id=${id}`)
            .then(res => res.json())
            .then(history => {
                const historyContent = document.getElementById('historyContent');
                if (history.length === 0) {
                    historyContent.innerHTML = `
                        <div class="history-empty">
                            <i class="fas fa-history"></i>
                            Chưa có lịch sử nhập/xuất
                        </div>
                    `;
                } else {
                    let html = '';
                    history.slice().reverse().forEach(record => {
                        const sign = record.change >= 0 ? '+' : '';
                        const cls = record.type === 'positive' ? 'positive' : 'negative';
                        html += `
                            <div class="history-item">
                                <div class="info">
                                    <span class="desc">${record.desc}</span>
                                    <span class="date">${new Date(record.date).toLocaleString('vi-VN', { hour12: false })}</span>
                                </div>
                                <span class="change ${cls}">${sign}${record.change}</span>
                            </div>
                        `;
                    });
                    historyContent.innerHTML = html;
                }
                document.getElementById('historyModal').classList.add('open');
            })
            .catch(err => {
                showToast('Không thể tải lịch sử', 'error');
            });
    };

    // ===== XUẤT EXCEL =====
    function exportExcel() {
        const filtered = getFilteredData();
        if (filtered.length === 0) {
            showToast('Không có dữ liệu để xuất.', 'error');
            return;
        }

        let htmlContent = `
            <html xmlns:o="urn:schemas-microsoft-com:office:office" 
                  xmlns:x="urn:schemas-microsoft-com:office:excel" 
                  xmlns="http://www.w3.org/TR/REC-html40">
            <head>
                <meta charset="UTF-8">
                <!--[if gte mso 9]>
                <xml>
                    <x:ExcelWorkbook>
                        <x:ExcelWorksheets>
                            <x:ExcelWorksheet>
                                <x:Name>Kho hàng</x:Name>
                                <x:WorksheetOptions>
                                    <x:DisplayGridlines/>
                                </x:WorksheetOptions>
                            </x:ExcelWorksheet>
                        </x:ExcelWorksheets>
                    </x:ExcelWorkbook>
                </xml>
                <![endif]-->
                <style>
                    body { font-family: 'Times New Roman', serif; font-size: 12pt; }
                    table { border-collapse: collapse; width: 100%; font-family: 'Times New Roman', serif; font-size: 12pt; }
                    th, td { border: 1px solid #ddd; padding: 6px 10px; text-align: left; vertical-align: middle; font-family: 'Times New Roman', serif; font-size: 12pt; }
                    th { background-color: #008919; color: #ffffff; font-weight: 700; text-align: center; border-color: #006e14; }
                    td { background-color: #ffffff; }
                    .status-ok { color: #155724; background-color: #d4edda; font-weight: 600; padding: 2px 8px; }
                    .status-warning { color: #856404; background-color: #fff3cd; font-weight: 600; padding: 2px 8px; }
                    .status-danger { color: #721c24; background-color: #f8d7da; font-weight: 600; padding: 2px 8px; }
                    .price { text-align: right; font-weight: 500; }
                    .text-center { text-align: center; }
                    .header-title { font-size: 15pt; font-weight: 700; color: #008919; margin-bottom: 10px; font-family: 'Times New Roman', serif; }
                </style>
            </head>
            <body>
                <div class="header-title">📦 DANH SÁCH TỒN KHO VÀ HẠN SỬ DỤNG</div>
                <p><strong>Ngày xuất:</strong> ${new Date().toLocaleDateString('vi-VN')}</p>
                <p><strong>Tổng số sản phẩm:</strong> ${filtered.length}</p>
                <br/>
                <table>
                    <thead>
                        <tr>
                            <th>Mã SP</th>
                            <th>Tên sản phẩm</th>
                            <th>Danh mục</th>
                            <th>Tồn kho</th>
                            <th>Giá nhập</th>
                            <th>Hạn sử dụng</th>
                            <th>Trạng thái Tồn kho</th>
                            <th>Trạng thái HSD</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        filtered.forEach(item => {
            const status = getStatus(item.quantity);
            const statusClass = status.text === 'Đủ hàng' ? 'status-ok' : 
                               (status.text === 'Sắp hết hàng' ? 'status-warning' : 'status-danger');
            const giaNhap = item.GiaNhap || 0;
            const expiryDateRaw = item.NgayHetHan || item.ngay_het_han;
            const expiry = getExpiryStatus(expiryDateRaw);
            
            const expFormatted = expiryDateRaw ? new Date(expiryDateRaw).toLocaleDateString('vi-VN') : '—';
            let expClass = 'status-ok';
            if (expiry.type === 'expired') expClass = 'status-danger';
            else if (expiry.type === 'expiring') expClass = 'status-warning';

            htmlContent += `
                <tr>
                    <td class="text-center">${item.id}</td>
                    <td><strong>${item.name}</strong></td>
                    <td>${item.category}</td>
                    <td class="text-center">${item.quantity}</td>
                    <td class="price">${formatPrice(giaNhap)}</td>
                    <td class="text-center">${expFormatted}</td>
                    <td><span class="${statusClass}">${status.text}</span></td>
                    <td><span class="${expClass}">${expiry.text}</span></td>
                </tr>
            `;
        });

        htmlContent += `
                    </tbody>
                </table>
                <br/>
                <p style="color: #999; font-size: 11pt; font-family: 'Times New Roman', serif;">* File được xuất từ hệ thống DOTIFOOD</p>
            </body>
            </html>
        `;

        const blob = new Blob([htmlContent], { type: 'application/vnd.ms-excel;charset=utf-8' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Danh_sach_ton_kho_${new Date().toISOString().slice(0,10)}.xls`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        showToast('Xuất Excel thành công!');
    }

    // ===== SỰ KIỆN PAGINATION =====
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

    // ===== SỰ KIỆN TÌM KIẾM & FILTER =====
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            currentPage = 1;
            renderTable();
        });
    }
    if (filterCategory) {
        filterCategory.addEventListener('change', function() {
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

    // ===== NÚT XUẤT EXCEL =====
    const btnExport = document.getElementById('btnExportStock');
    if (btnExport) {
        btnExport.addEventListener('click', exportExcel);
    }

    // ===== SỰ KIỆN MODAL ĐIỀU CHỈNH =====
    const modalSave = document.getElementById('modalSave');
    if (modalSave) modalSave.addEventListener('click', saveAdjustment);

    const modalCancel = document.getElementById('modalCancel');
    if (modalCancel) modalCancel.addEventListener('click', function() {
        document.getElementById('adjustModal').classList.remove('open');
    });

    const modalClose = document.getElementById('modalClose');
    if (modalClose) modalClose.addEventListener('click', function() {
        document.getElementById('adjustModal').classList.remove('open');
    });

    const adjustModal = document.getElementById('adjustModal');
    if (adjustModal) adjustModal.addEventListener('click', function(e) {
        if (e.target === this) this.classList.remove('open');
    });

    // ===== MODAL LỊCH SỬ =====
    const historyModalClose = document.getElementById('historyModalClose');
    if (historyModalClose) historyModalClose.addEventListener('click', function() {
        document.getElementById('historyModal').classList.remove('open');
    });

    const historyModalCancel = document.getElementById('historyModalCancel');
    if (historyModalCancel) historyModalCancel.addEventListener('click', function() {
        document.getElementById('historyModal').classList.remove('open');
    });

    const historyModal = document.getElementById('historyModal');
    if (historyModal) historyModal.addEventListener('click', function(e) {
        if (e.target === this) this.classList.remove('open');
    });

    // ===== NHẬP KHO =====
    const addImportRowBtn = document.getElementById('addImportRow');
    if (addImportRowBtn) {
        addImportRowBtn.addEventListener('click', function() {
            const tbodyImport = document.getElementById('importTableBody');
            if (!tbodyImport) return;
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>
                    <select class="product-select" style="width:100%; padding:6px 10px; border:2px solid var(--gray-200); border-radius:var(--radius-sm); font-size:0.9rem;">
                        <option value="">Chọn sản phẩm</option>
                        ${stockData.map(p => `<option value="${p.id}">${p.name}</option>`).join('')}
                    </select>
                </td>
                <td><input type="number" class="qty-input" value="1" min="1" style="width:80px; padding:6px 10px; border:2px solid var(--gray-200); border-radius:var(--radius-sm); text-align:center;"></td>
                <td><input type="number" class="price-input" value="0" min="0" step="1000" style="width:100px; padding:6px 10px; border:2px solid var(--gray-200); border-radius:var(--radius-sm); text-align:right;"></td>
                <td class="total-row">0 đ</td>
                <td><button type="button" class="remove-row"><i class="fas fa-trash-alt"></i></button></td>
            `;
            tbodyImport.appendChild(row);
            updateImportTotals();
            attachRowEvents(row);
        });
    }

    function attachRowEvents(row) {
        const qtyInput = row.querySelector('.qty-input');
        const priceInput = row.querySelector('.price-input');
        const removeBtn = row.querySelector('.remove-row');

        if (qtyInput) qtyInput.addEventListener('input', updateImportTotals);
        if (priceInput) priceInput.addEventListener('input', updateImportTotals);
        if (removeBtn) {
            removeBtn.addEventListener('click', function() {
                if (document.getElementById('importTableBody').children.length > 1) {
                    row.remove();
                    updateImportTotals();
                } else {
                    showToast('Phải có ít nhất một dòng sản phẩm', 'error');
                }
            });
        }
    }

    function updateImportTotals() {
        const rows = document.querySelectorAll('#importTableBody tr');
        let totalItems = rows.length;
        let totalQty = 0;
        let totalValue = 0;

        rows.forEach(row => {
            const qty = parseInt(row.querySelector('.qty-input')?.value) || 0;
            const price = parseFloat(row.querySelector('.price-input')?.value) || 0;
            const totalCell = row.querySelector('.total-row');
            if (totalCell) {
                const subtotal = qty * price;
                totalCell.textContent = formatPrice(subtotal);
                totalQty += qty;
                totalValue += subtotal;
            }
        });

        const totalItemsEl = document.getElementById('totalItems');
        const totalQuantityEl = document.getElementById('totalQuantity');
        const totalValueEl = document.getElementById('totalValue');

        if (totalItemsEl) totalItemsEl.textContent = totalItems;
        if (totalQuantityEl) totalQuantityEl.textContent = totalQty;
        if (totalValueEl) totalValueEl.textContent = formatPrice(totalValue);
    }

    const btnAddStock = document.getElementById('btnAddStock');
    if (btnAddStock) {
        btnAddStock.addEventListener('click', function() {
            const now = new Date();
            const code = 'NK' + now.getFullYear() + String(now.getMonth()+1).padStart(2,'0') + String(now.getDate()).padStart(2,'0') + '-' + String(Date.now()).slice(-4);
            
            const importCode = document.getElementById('importCode');
            const importDate = document.getElementById('importDate');
            if (importCode) importCode.value = code;
            if (importDate) importDate.value = now.toISOString().slice(0,10);

            const tbodyImport = document.getElementById('importTableBody');
            if (tbodyImport && tbodyImport.children.length === 0) {
                const addRowBtn = document.getElementById('addImportRow');
                if (addRowBtn) addRowBtn.click();
            }

            const importModal = document.getElementById('importModal');
            if (importModal) importModal.classList.add('open');
        });
    }

    const importModalClose = document.getElementById('importModalClose');
    if (importModalClose) importModalClose.addEventListener('click', function() {
        document.getElementById('importModal').classList.remove('open');
    });

    const importModalCancel = document.getElementById('importModalCancel');
    if (importModalCancel) importModalCancel.addEventListener('click', function() {
        document.getElementById('importModal').classList.remove('open');
    });

    const importModal = document.getElementById('importModal');
    if (importModal) importModal.addEventListener('click', function(e) {
        if (e.target === this) this.classList.remove('open');
    });

    const importModalSave = document.getElementById('importModalSave');
    if (importModalSave) {
        importModalSave.addEventListener('click', function() {
            const rows = document.querySelectorAll('#importTableBody tr');
            const items = [];
            rows.forEach(row => {
                const select = row.querySelector('.product-select');
                const qtyInput = row.querySelector('.qty-input');
                const priceInput = row.querySelector('.price-input');
                if (select && qtyInput && priceInput) {
                    const id = select.value;
                    const qty = parseInt(qtyInput.value) || 0;
                    const price = parseFloat(priceInput.value) || 0;
                    if (id && qty > 0) {
                        items.push({ id, quantity: qty, price });
                    }
                }
            });

            if (items.length === 0) {
                showToast('Vui lòng thêm ít nhất một sản phẩm hợp lệ', 'error');
                return;
            }

            fetch('includes/import_stock.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ items })
            })
            .then(res => res.json())
            .then(result => {
                if (result.success) {
                    document.getElementById('importModal').classList.remove('open');
                    loadStockData();
                    showToast(result.message);
                    const tbodyImport = document.getElementById('importTableBody');
                    if (tbodyImport) tbodyImport.innerHTML = '';
                    const addRowBtn = document.getElementById('addImportRow');
                    if (addRowBtn) addRowBtn.click();
                } else {
                    showToast(result.message, 'error');
                }
            })
            .catch(err => {
                showToast('Lỗi kết nối đến server', 'error');
            });
        });
    }

    // ===== KHỞI TẠO =====
    document.addEventListener('DOMContentLoaded', function() {
        loadStockData();
    });

    // ===== HEADER LOADED =====
    document.addEventListener('headerLoaded', function() {
        filterCategory = document.getElementById('filter-danhmuc');
        filterStatus = document.getElementById('filter-trangthai');
        searchInput = document.getElementById('searchInput');

        if (searchInput && !searchInput._listener) {
            searchInput.addEventListener('input', function() {
                currentPage = 1;
                renderTable();
            });
            searchInput._listener = true;
        }
        if (filterCategory && !filterCategory._listener) {
            filterCategory.addEventListener('change', function() {
                currentPage = 1;
                renderTable();
            });
            filterCategory._listener = true;
        }
        if (filterStatus && !filterStatus._listener) {
            filterStatus.addEventListener('change', function() {
                currentPage = 1;
                renderTable();
            });
            filterStatus._listener = true;
        }
        if (stockData.length === 0) {
            loadStockData();
        } else {
            renderTable();
        }
    });

    console.log('📦 Quản lý kho đã sẵn sàng (Đã cập nhật đếm Sắp hết hạn)');
})();