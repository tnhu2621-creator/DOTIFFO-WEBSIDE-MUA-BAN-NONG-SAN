(function() {
    'use strict';

    // ===== DOM REFS =====
    const totalRevenueEl = document.getElementById('totalRevenue');
    const totalOrdersEl = document.getElementById('totalOrders');
    const totalCustomersEl = document.getElementById('totalCustomers');
    const totalProductsEl = document.getElementById('totalProducts');
    const revenueChangeEl = document.getElementById('revenueChange');
    const ordersChangeEl = document.getElementById('ordersChange');
    const customersChangeEl = document.getElementById('customersChange');
    const productsChangeEl = document.getElementById('productsChange');
    const recentOrdersEl = document.getElementById('recentOrders');
    const btnRefresh = document.getElementById('btnRefresh');
    const reportPeriod = document.getElementById('reportPeriod');
    const revenuePeriodEl = document.getElementById('revenuePeriod');
    const revenuePeriodLabel = document.getElementById('revenuePeriodLabel');
    const btnExport = document.getElementById('btnExportReport');

    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toastMessage');

    let revenueChart, categoryChart, topProductsChart, orderStatusChart;

    function formatPrice(price) {
        return Number(price).toLocaleString('vi-VN') + ' đ';
    }

    function showToast(message, type = 'success') {
        if (!toastMsg || !toast) return;
        toastMsg.textContent = message;
        toast.className = 'toast show';
        toast.style.borderLeftColor = (type === 'error') ? '#dc3545' : '#FF0090';
        clearTimeout(toast._timer);
        toast._timer = setTimeout(() => toast.classList.remove('show'), 3000);
    }

    // ===== FETCH DATA =====
    function fetchStats(period) {
        return fetch('ThongkeBaocao.php?action=get_stats&period=' + period)
            .then(response => {
                if (!response.ok) throw new Error('Network response was not ok');
                return response.json();
            })
            .then(data => {
                if (!data.success) throw new Error(data.error || 'Unknown error');
                return data;
            });
    }

    // ===== UPDATE STATS =====
    function updateStats(stats) {
        totalRevenueEl.textContent = formatPrice(stats.totalRevenue);
        totalOrdersEl.textContent = stats.totalOrders;
        totalCustomersEl.textContent = stats.totalCustomers;
        totalProductsEl.textContent = stats.totalProducts;

        revenueChangeEl.textContent = stats.revenueChange;
        ordersChangeEl.textContent = stats.ordersChange;
        customersChangeEl.textContent = stats.customersChange;
        productsChangeEl.textContent = stats.productsChange;

        revenueChangeEl.className = 'stat-change ' + (stats.revenueChange.startsWith('+') ? 'positive' : 'negative');
        ordersChangeEl.className = 'stat-change ' + (stats.ordersChange.startsWith('+') ? 'positive' : 'negative');
        customersChangeEl.className = 'stat-change ' + (stats.customersChange.startsWith('+') ? 'positive' : 'negative');
        productsChangeEl.className = 'stat-change ' + (stats.productsChange.startsWith('+') ? 'positive' : 'negative');
    }

    // ===== RENDER RECENT ORDERS =====
    function renderRecentOrders(orders) {
        const statusMap = {
            'Chờ xác nhận': 'pending',
            'Đang xử lý': 'processing',
            'Đang giao': 'shipped',
            'Đã giao': 'delivered',
            'Đã hủy': 'cancelled'
        };
        let html = '';
        orders.forEach(o => {
            const statusClass = statusMap[o.TrangThai] || 'pending';
            html += `
                <div class="recent-item">
                    <span class="recent-code">${o.MaDonHang}</span>
                    <span class="recent-customer">${o.customer_name || 'N/A'}</span>
                    <span class="recent-amount">${formatPrice(o.TongTien)}</span>
                    <span class="status status-${statusClass}">${o.TrangThai}</span>
                </div>
            `;
        });
        recentOrdersEl.innerHTML = html;
    }

    // ===== INIT CHARTS =====
    function initCharts(data) {
        // Doanh thu chính
        const revenueCtx = document.getElementById('revenueChart').getContext('2d');
        if (revenueChart) revenueChart.destroy();
        revenueChart = new Chart(revenueCtx, {
            type: 'line',
            data: {
                labels: data.revenue.labels,
                datasets: [{
                    label: 'Doanh thu (VNĐ)',
                    data: data.revenue.values,
                    borderColor: '#008919',
                    backgroundColor: 'rgba(0, 137, 25, 0.08)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#008919',
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return formatPrice(context.parsed.y);
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        suggestedMax: 1000000,
                        grid: { color: 'rgba(0,0,0,0.04)' },
                        ticks: {
                            callback: function(value) {
                                if (value === 0) return '0 đ';
                                if (value >= 1000000) {
                                    return (value / 1000000).toFixed(1).replace('.0', '') + 'tr';
                                }
                                return value.toLocaleString('vi-VN') + ' đ';
                            }
                        }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { maxRotation: 45, autoSkip: true, maxTicksLimit: 30 }
                    }
                }
            }
        });

        // Doanh thu theo danh mục
        const categoryCtx = document.getElementById('categoryChart').getContext('2d');
        if (categoryChart) categoryChart.destroy();
        categoryChart = new Chart(categoryCtx, {
            type: 'doughnut',
            data: {
                labels: data.category.labels,
                datasets: [{
                    data: data.category.values,
                    backgroundColor: ['#FF0090', '#008919', '#f59e0b', '#6366f1', '#ec4899', '#14b8a6'],
                    borderWidth: 0,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom', labels: { padding: 16, usePointStyle: true, pointStyle: 'circle', font: { size: 12 } } },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const total = context.dataset.data.reduce((a, b) => Number(a) + Number(b), 0);
                                const percentage = total > 0 ? ((context.parsed / total) * 100).toFixed(1) : 0;
                                return formatPrice(context.parsed) + ' (' + percentage + '%)';
                            }
                        }
                    }
                }
            }
        });

        // Top sản phẩm
        const topProductsCtx = document.getElementById('topProductsChart').getContext('2d');
        if (topProductsChart) topProductsChart.destroy();
        topProductsChart = new Chart(topProductsCtx, {
            type: 'bar',
            data: {
                labels: data.topProducts.labels,
                datasets: [{
                    label: 'Số lượng bán',
                    data: data.topProducts.values,
                    backgroundColor: ['#FF0090', '#008919', '#f59e0b', '#6366f1', '#ec4899'],
                    borderRadius: 6,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.04)' }, ticks: { stepSize: Math.ceil(Math.max(...data.topProducts.values) / 5) || 1 } },
                    x: { grid: { display: false } }
                }
            }
        });

        // Đơn hàng theo trạng thái
        const orderStatusCtx = document.getElementById('orderStatusChart').getContext('2d');
        if (orderStatusChart) orderStatusChart.destroy();
        const statusColors = {
            'Chờ xác nhận': '#f59e0b',
            'Đang xử lý': '#cce5ff',
            'Đang giao': '#d4edda',
            'Đã giao': '#008919',
            'Đã hủy': '#dc3545'
        };
        const backgroundColors = data.orderStatus.labels.map(label => statusColors[label] || '#6c757d');
        orderStatusChart = new Chart(orderStatusCtx, {
            type: 'bar',
            data: {
                labels: data.orderStatus.labels,
                datasets: [{
                    label: 'Số đơn hàng',
                    data: data.orderStatus.values,
                    backgroundColor: backgroundColors,
                    borderRadius: 4,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.04)' }, ticks: { stepSize: Math.ceil(Math.max(...data.orderStatus.values) / 5) || 1 } },
                    x: { grid: { display: false } }
                }
            }
        });
    }

    // ===== LOAD DATA =====
    function loadData(period) {
        period = period || reportPeriod.value;
        fetchStats(period)
            .then(data => {
                updateStats(data.stats);
                renderRecentOrders(data.recentOrders);
                initCharts(data);

                const periodLabels = {
                    'today': 'Hôm nay',
                    'week': 'Tuần này',
                    'month': 'Tháng ' + (new Date().getMonth() + 1) + '/' + new Date().getFullYear(),
                    'year': 'Năm ' + new Date().getFullYear()
                };
                if (revenuePeriodEl) {
                    revenuePeriodEl.textContent = periodLabels[period] || '';
                }
                if (revenuePeriodLabel) {
                    const labelMap = {
                        'today': 'giờ',
                        'week': 'ngày',
                        'month': 'ngày',
                        'year': 'tháng'
                    };
                    revenuePeriodLabel.textContent = labelMap[period] || 'tháng';
                }
            })
            .catch(error => {
                console.error('Fetch error:', error);
                showToast('Lỗi tải dữ liệu: ' + error.message, 'error');
            });
    }

    // ===== EXPORT REPORT =====
    function exportReport() {
        const period = reportPeriod.value;
        window.location.href = 'export_report.php?period=' + period;
    }

    // ===== EVENTS =====
    if (btnRefresh) btnRefresh.addEventListener('click', function() { loadData(); });
    if (reportPeriod) reportPeriod.addEventListener('change', function() { loadData(this.value); });
    if (btnExport) btnExport.addEventListener('click', exportReport);

    // ===== INIT =====
    loadData('month');
})();