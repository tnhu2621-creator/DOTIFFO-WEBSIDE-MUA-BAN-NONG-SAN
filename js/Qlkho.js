(function() {
    'use strict';

    let stockData = [];
    let currentPage = 1;
    const itemsPerPage = 5;

    // DOM refs
    let tbody = document.getElementById('stockTableBody');
    // === SỬA ID CHO ĐÚNG VỚI HTML ===
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
    let searchInput = document.getElementById('searchInput'); // nếu có thêm sau

    // ===== HÀM XÁC ĐỊNH TRẠNG THÁI THEO SỐ LƯỢNG =====
    function getStatus(quantity) {
        if (quantity <= 0) return { text: 'Hết hàng', class: 'status-danger' };
        if (quantity <= 10) return { text: 'Sắp hết hàng', class: 'status-warning' };
        return { text: 'Đủ hàng', class: 'status-success' };
    }

    function formatPrice(price) {
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
        console.log('🔄 Đang tải dữ liệu...');
        fetch('includes/get_stock.php')
            .then(response => {
                if (!response.ok) {
                    return response.text().then(text => {
                        throw new Error(`HTTP ${response.status}: ${text.substring(0, 100)}`);
                    });
                }
                return response.json();
            })
            .then(data => {
                if (data.error) throw new Error(data.error);
                stockData = data;
                renderTable();
            })
            .catch(err => {
                console.error('❌ Lỗi:', err);
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
        const totalStock = stockData.reduce((sum, item) => sum + item.quantity, 0);
        const lowStock = stockData.filter(item => item.quantity > 0 && item.quantity <= 10).length;
        const outOfStock = stockData.filter(item => item.quantity <= 0).length;

        if (totalProductsEl) totalProductsEl.textContent = total;
        if (totalStockEl) totalStockEl.textContent = totalStock;
        if (lowStockCountEl) lowStockCountEl.textContent = lowStock;
        if (outOfStockCountEl) outOfStockCountEl.textContent = outOfStock;
    }

    // ===== LỌC DỮ LIỆU (SỬA ĐIỀU KIỆN) =====
    function getFilteredData() {
        const keyword = searchInput ? searchInput.value.toLowerCase().trim() : '';
        // Lấy giá trị từ dropdown
        const category = filterCategory ? filterCategory.value : '';
        const statusFilter = filterStatus ? filterStatus.value : '';

        return stockData.filter(item => {
            const matchName = item.name.toLowerCase().includes(keyword);
            // === QUAN TRỌNG: nếu category rỗng hoặc 'all' thì bỏ qua lọc ===
            const matchCategory = !category || category === 'all' || item.category === category;
            const status = getStatus(item.quantity).text;
            // Tương tự cho status
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
            html += `
                <tr>
                    <td>#${String(item.id).padStart(3, '0')}</td>
                    <td><strong>${item.name}</strong></td>
                    <td>${item.category}</td>
                    <td>${item.quantity}</td>
                    <td>${item.reorderLevel}</td>
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

    // ===== PAGINATION =====
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

    // ===== SỰ KIỆN MODAL =====
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

    // Nếu bạn dùng event 'headerLoaded' từ menu/header, vẫn giữ để tương thích
    document.addEventListener('headerLoaded', function() {
        // Cập nhật lại refs phòng trường hợp DOM thay đổi
        filterCategory = document.getElementById('filter-danhmuc');
        filterStatus = document.getElementById('filter-trangthai');
        searchInput = document.getElementById('searchInput');
        // Gắn lại sự kiện (nếu chưa có)
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

    console.log('📦 Quản lý kho đã sẵn sàng (đã sửa lọc)');
})();