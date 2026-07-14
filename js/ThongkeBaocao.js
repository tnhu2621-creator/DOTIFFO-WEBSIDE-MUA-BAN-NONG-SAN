(function() {
    'use strict';

    // ===== DỮ LIỆU MẪU =====
    // Giả lập dữ liệu thống kê
    const data = {
        revenue: {
            labels: ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6'],
            values: [120000000, 150000000, 180000000, 170000000, 210000000, 245000000]
        },
        category: {
            labels: ['Trà & Sen', 'Trái cây', 'Đặc sản'],
            values: [350000000, 300000000, 450000000]
        },
        topProducts: {
            labels: ['Trà Sen Tháp Mười', 'Xoài Cát Hòa Lộc', 'Mật ong Tràm', 'Gạo Nàng Hoa', 'Ánh Trà Sen'],
            values: [85, 72, 60, 55, 48]
        },
        orderStatus: {
            labels: ['Chờ xác nhận', 'Đang xử lý', 'Đang giao', 'Đã giao', 'Đã hủy'],
            values: [12, 18, 8, 45, 7]
        },
        stats: {
            totalRevenue: 1234567000,
            totalOrders: 1234,
            totalCustomers: 5678,
            totalProducts: 892,
            revenueChange: '+12.5%',
            ordersChange: '+8.2%',
            customersChange: '+15.3%',
            productsChange: '-2.1%'
        },
        recentOrders: [
            { code: '#ORD-001', customer: 'Nguyễn Văn A', amount: 255000, status: 'delivered' },
            { code: '#ORD-002', customer: 'Trần Thị B', amount: 360000, status: 'processing' },
            { code: '#ORD-003', customer: 'Lê Văn C', amount: 180000, status: 'cancelled' },
            { code: '#ORD-004', customer: 'Phạm Thị D', amount: 110000, status: 'delivered' },
            { code: '#ORD-005', customer: 'Nguyễn Văn E', amount: 195000, status: 'pending' }
        ]
    };

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

    // Toast
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toastMessage');

    // ===== HELPERS =====
    function formatPrice(price) {
        return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') + ' đ';
    }

    function showToast(message, type = 'success') {
        toastMsg.textContent = message;
        toast.className = 'toast show';
        if (type === 'error') {
            toast.style.borderLeftColor = '#dc3545';
        } else {
            toast.style.borderLeftColor = '#FF0090';
        }
        clearTimeout(toast._timer);
        toast._timer = setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    // ===== UPDATE STATS =====
    function updateStats() {
        const s = data.stats;
        totalRevenueEl.textContent = formatPrice(s.totalRevenue);
        totalOrdersEl.textContent = s.totalOrders;
        totalCustomersEl.textContent = s.totalCustomers;
        totalProductsEl.textContent = s.totalProducts;
        revenueChangeEl.textContent = s.revenueChange;
        ordersChangeEl.textContent = s.ordersChange;
        customersChangeEl.textContent = s.customersChange;
        productsChangeEl.textContent = s.productsChange;

        // Cập nhật màu sắc cho stat-change
        revenueChangeEl.className = 'stat-change ' + (s.revenueChange.startsWith('+') ? 'positive' : 'negative');
        ordersChangeEl.className = 'stat-change ' + (s.ordersChange.startsWith('+') ? 'positive' : 'negative');
        customersChangeEl.className = 'stat-change ' + (s.customersChange.startsWith('+') ? 'positive' : 'negative');
        productsChangeEl.className = 'stat-change ' + (s.productsChange.startsWith('+') ? 'positive' : 'negative');
    }

    // ===== RENDER RECENT ORDERS =====
    function renderRecentOrders() {
        const statusMap = {
            'pending': 'Chờ xác nhận',
            'processing': 'Đang xử lý',
            'shipped': 'Đang giao',
            'delivered': 'Đã giao',
            'cancelled': 'Đã hủy'
        };
        let html = '';
        data.recentOrders.forEach(o => {
            html += `
                <div class="recent-item">
                    <span class="recent-code">${o.code}</span>
                    <span class="recent-customer">${o.customer}</span>
                    <span class="recent-amount">${formatPrice(o.amount)}</span>
                    <span class="status status-${o.status}">${statusMap[o.status] || o.status}</span>
                </div>
            `;
        });
        recentOrdersEl.innerHTML = html;
    }

    // ===== INIT CHARTS =====
    let revenueChart, categoryChart, topProductsChart, orderStatusChart;

    function initCharts() {
        // Doanh thu theo tháng
        const revenueCtx = document.getElementById('revenueChart').getContext('2d');
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
                        grid: { color: 'rgba(0,0,0,0.04)' },
                        ticks: {
                            callback: function(value) {
                                return (value / 1000000) + 'tr';
                            }
                        }
                    },
                    x: {
                        grid: { display: false }
                    }
                }
            }
        });

        // Doanh thu theo danh mục
        const categoryCtx = document.getElementById('categoryChart').getContext('2d');
        categoryChart = new Chart(categoryCtx, {
            type: 'doughnut',
            data: {
                labels: data.category.labels,
                datasets: [{
                    data: data.category.values,
                    backgroundColor: ['#FF0090', '#008919', '#f59e0b'],
                    borderWidth: 0,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 16,
                            usePointStyle: true,
                            pointStyle: 'circle',
                            font: { size: 12 }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((context.parsed / total) * 100).toFixed(1);
                                return formatPrice(context.parsed) + ' (' + percentage + '%)';
                            }
                        }
                    }
                }
            }
        });

        // Top sản phẩm bán chạy
        const topProductsCtx = document.getElementById('topProductsChart').getContext('2d');
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
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(0,0,0,0.04)' },
                        ticks: { stepSize: 20 }
                    },
                    x: {
                        grid: { display: false }
                    }
                }
            }
        });

        // Đơn hàng theo trạng thái
        const orderStatusCtx = document.getElementById('orderStatusChart').getContext('2d');
        orderStatusChart = new Chart(orderStatusCtx, {
            type: 'bar',
            data: {
                labels: data.orderStatus.labels,
                datasets: [{
                    label: 'Số đơn hàng',
                    data: data.orderStatus.values,
                    backgroundColor: ['#f59e0b', '#cce5ff', '#d4edda', '#008919', '#dc3545'],
                    borderRadius: 4,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(0,0,0,0.04)' },
                        ticks: { stepSize: 5 }
                    },
                    x: {
                        grid: { display: false }
                    }
                }
            }
        });
    }

    // ===== REFRESH DATA =====
    function refreshData() {
        showToast('🔄 Đang cập nhật dữ liệu...');
        setTimeout(() => {
            // Giả lập cập nhật dữ liệu mới
            data.stats.totalRevenue += Math.floor(Math.random() * 100000000);
            data.stats.totalOrders += Math.floor(Math.random() * 50);
            data.stats.totalCustomers += Math.floor(Math.random() * 30);
            data.stats.totalProducts += Math.floor(Math.random() * 10);
            updateStats();
            renderRecentOrders();

            // Cập nhật biểu đồ với dữ liệu mới (giả lập)
            const newRevenue = data.revenue.values.map(v => v + Math.floor(Math.random() * 10000000 - 5000000));
            revenueChart.data.datasets[0].data = newRevenue;
            revenueChart.update();

            showToast('✅ Dữ liệu đã được làm mới!');
        }, 1000);
    }

    // ===== PERIOD CHANGE =====
    function changePeriod() {
        const period = reportPeriod.value;
        const periodLabels = {
            'today': 'Hôm nay',
            'week': 'Tuần này',
            'month': 'Tháng 6/2026',
            'quarter': 'Quý 2/2026',
            'year': 'Năm 2026',
            'custom': 'Tùy chọn'
        };
        document.getElementById('revenuePeriod').textContent = periodLabels[period] || 'Tháng 6/2026';
        showToast(`📊 Đã chuyển sang kỳ báo cáo: ${periodLabels[period]}`);
        // Thực tế có thể gọi API lấy dữ liệu theo kỳ ở đây
    }

    // ===== EVENTS =====
    btnRefresh.addEventListener('click', refreshData);
    reportPeriod.addEventListener('change', changePeriod);

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

    // ===== INIT =====
    updateStats();
    renderRecentOrders();
    initCharts();
    console.log('📊 Thống kê báo cáo đã sẵn sàng!');
})();