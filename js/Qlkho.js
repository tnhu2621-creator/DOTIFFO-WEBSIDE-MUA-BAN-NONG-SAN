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
    let outOfStockCountEl = document.getElementById('outOfStockCount');
    let prevPageBtn = document.getElementById('prevPage');
    let nextPageBtn = document.getElementById('nextPage');
    let pageInfo = document.getElementById('pageInfo');
    let searchInput = document.getElementById('searchInput');

    // ===== HÀM XÁC ĐỊNH TRẠNG THÁI =====
    function getStatus(quantity) {
        if (quantity <= 0) return { text: 'Hết hàng', class: 'status-danger' };
        if (quantity <= 10) return { text: 'Sắp hết hàng', class: 'status-warning' };
        return { text: 'Đủ hàng', class: 'status-success' };
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

    // ===== UPDATE THỐNG KÊ =====
    function updateStats() {
        const total = stockData.length;
        const totalStock = stockData.reduce((sum, item) => sum + (item.quantity || 0), 0);
        const lowStock = stockData.filter(item => item.quantity > 0 && item.quantity <= 10).length;
        const outOfStock = stockData.filter(item => item.quantity <= 0).length;

        if (totalProductsEl) totalProductsEl.textContent = total;
        if (totalStockEl) totalStockEl.textContent = totalStock;
        if (lowStockCountEl) lowStockCountEl.textContent = lowStock;
        if (outOfStockCountEl) outOfStockCountEl.textContent = outOfStock;
    }

    // ===== LỌC DỮ LIỆU =====
    function getFilteredData() {
        const keyword = searchInput ? searchInput.value.toLowerCase().trim() : '';
        const category = filterCategory ? filterCategory.value : '';
        const statusFilter = filterStatus ? filterStatus.value : '';

        return stockData.filter(item => {
            const matchName = item.name.toLowerCase().includes(keyword);
            const matchCategory = !category || category === 'all' || item.category === category;
            const status = getStatus(item.quantity).text;
            const matchStatus = !statusFilter || statusFilter === 'all' || status === statusFilter;
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
            html += `
                <tr>
                    <td>#${String(item.id).padStart(3, '0')}</td>
                    <td><strong>${item.name}</strong></td>
                    <td>${item.category}</td>
                    <td>${item.quantity}</td>
                    <td>${formatPrice(giaNhap)}</td>
                    <td><span class="status ${status.class}">${status.text}</span></td>
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
        const item = stockData.find(p => p.id === id);
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

    // ===== XUẤT EXCEL CÓ ĐỊNH DẠNG (FONT TIMES NEW ROMAN) =====
    function exportExcel() {
        const filtered = getFilteredData();
        if (filtered.length === 0) {
            showToast('Không có dữ liệu để xuất.', 'error');
            return;
        }

        // Tạo bảng HTML với CSS inline để Excel hiểu
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
                    /* Định dạng chung: Times New Roman, cỡ chữ 12 */
                    body {
                        font-family: 'Times New Roman', serif;
                        font-size: 12pt;
                    }
                    table {
                        border-collapse: collapse;
                        width: 100%;
                        font-family: 'Times New Roman', serif;
                        font-size: 12pt;
                    }
                    th, td {
                        border: 1px solid #ddd;
                        padding: 6px 10px;
                        text-align: left;
                        vertical-align: middle;
                        font-family: 'Times New Roman', serif;
                        font-size: 12pt;
                    }
                    th {
                        background-color: #008919;
                        color: #ffffff;
                        font-weight: 700;
                        text-align: center;
                        border-color: #006e14;
                    }
                    td {
                        background-color: #ffffff;
                    }
                    .status-ok {
                        color: #155724;
                        background-color: #d4edda;
                        font-weight: 600;
                        padding: 2px 8px;
                        border-radius: 12px;
                    }
                    .status-warning {
                        color: #856404;
                        background-color: #fff3cd;
                        font-weight: 600;
                        padding: 2px 8px;
                        border-radius: 12px;
                    }
                    .status-danger {
                        color: #721c24;
                        background-color: #f8d7da;
                        font-weight: 600;
                        padding: 2px 8px;
                        border-radius: 12px;
                    }
                    .price {
                        text-align: right;
                        font-weight: 500;
                    }
                    .text-center {
                        text-align: center;
                    }
                    /* Tiêu đề chính: cỡ chữ 15, Times New Roman */
                    .header-title {
                        font-size: 15pt;
                        font-weight: 700;
                        color: #008919;
                        margin-bottom: 10px;
                        font-family: 'Times New Roman', serif;
                    }
                </style>
            </head>
            <body>
                <div class="header-title">📦 DANH SÁCH TỒN KHO</div>
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
                            <th>Trạng thái</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        filtered.forEach(item => {
            const status = getStatus(item.quantity);
            const statusClass = status.text === 'Đủ hàng' ? 'status-ok' : 
                               (status.text === 'Sắp hết hàng' ? 'status-warning' : 'status-danger');
            const giaNhap = item.GiaNhap || 0;
            htmlContent += `
                <tr>
                    <td class="text-center">${item.id}</td>
                    <td><strong>${item.name}</strong></td>
                    <td>${item.category}</td>
                    <td class="text-center">${item.quantity}</td>
                    <td class="price">${formatPrice(giaNhap)}</td>
                    <td><span class="${statusClass}">${status.text}</span></td>
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

        // Tạo blob và tải file
        const blob = new Blob([htmlContent], { 
            type: 'application/vnd.ms-excel;charset=utf-8' 
        });
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
    document.getElementById('modalSave').addEventListener('click', saveAdjustment);
    document.getElementById('modalCancel').addEventListener('click', function() {
        document.getElementById('adjustModal').classList.remove('open');
    });
    document.getElementById('modalClose').addEventListener('click', function() {
        document.getElementById('adjustModal').classList.remove('open');
    });
    document.getElementById('adjustModal').addEventListener('click', function(e) {
        if (e.target === this) this.classList.remove('open');
    });

    // ===== MODAL LỊCH SỬ =====
    document.getElementById('historyModalClose').addEventListener('click', function() {
        document.getElementById('historyModal').classList.remove('open');
    });
    document.getElementById('historyModalCancel').addEventListener('click', function() {
        document.getElementById('historyModal').classList.remove('open');
    });
    document.getElementById('historyModal').addEventListener('click', function(e) {
        if (e.target === this) this.classList.remove('open');
    });

    // ===== NHẬP KHO =====
    document.getElementById('addImportRow').addEventListener('click', function() {
        const tbodyImport = document.getElementById('importTableBody');
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

    function attachRowEvents(row) {
        const qtyInput = row.querySelector('.qty-input');
        const priceInput = row.querySelector('.price-input');
        const removeBtn = row.querySelector('.remove-row');

        qtyInput.addEventListener('input', updateImportTotals);
        priceInput.addEventListener('input', updateImportTotals);
        removeBtn.addEventListener('click', function() {
            if (document.getElementById('importTableBody').children.length > 1) {
                row.remove();
                updateImportTotals();
            } else {
                showToast('Phải có ít nhất một dòng sản phẩm', 'error');
            }
        });
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

        document.getElementById('totalItems').textContent = totalItems;
        document.getElementById('totalQuantity').textContent = totalQty;
        document.getElementById('totalValue').textContent = formatPrice(totalValue);
    }

    document.getElementById('btnAddStock').addEventListener('click', function() {
        const now = new Date();
        const code = 'NK' + now.getFullYear() + String(now.getMonth()+1).padStart(2,'0') + String(now.getDate()).padStart(2,'0') + '-' + String(Date.now()).slice(-4);
        document.getElementById('importCode').value = code;
        document.getElementById('importDate').value = now.toISOString().slice(0,10);
        const tbody = document.getElementById('importTableBody');
        if (tbody.children.length === 0) {
            document.getElementById('addImportRow').click();
        }
        document.getElementById('importModal').classList.add('open');
    });

    document.getElementById('importModalClose').addEventListener('click', function() {
        document.getElementById('importModal').classList.remove('open');
    });
    document.getElementById('importModalCancel').addEventListener('click', function() {
        document.getElementById('importModal').classList.remove('open');
    });
    document.getElementById('importModal').addEventListener('click', function(e) {
        if (e.target === this) this.classList.remove('open');
    });

    document.getElementById('importModalSave').addEventListener('click', function() {
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
                document.getElementById('importTableBody').innerHTML = '';
                document.getElementById('addImportRow').click();
            } else {
                showToast(result.message, 'error');
            }
        })
        .catch(err => {
            showToast('Lỗi kết nối đến server', 'error');
        });
    });

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

    console.log('📦 Quản lý kho đã sẵn sàng');
})();