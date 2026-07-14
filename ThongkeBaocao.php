<?php
include 'admin/menu.php';
include 'admin/header.php';
?>

<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>DOTIFOOD - Thống kê báo cáo</title>

    <!-- Font Awesome -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css" />
    <!-- Google Font -->
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,400;14..32,500;14..32,600;14..32,700;14..32,800&display=swap" rel="stylesheet" />
    <link href="https://fonts.googleapis.com/css2?family=Bona+Nova:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet" />
    <!-- Chart.js -->
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>

    <link rel="stylesheet" href="css/ThongkeBaocao.css" />
    <link rel="stylesheet" href="admin/menu.css" />
    <link rel="stylesheet" href="admin/header.css" />
</head>
<body>

    <!-- ===== WRAPPER ===== -->
    <div class="admin-wrapper">

        <!-- ===== SIDEBAR ===== -->
        <div id="admin-layout-placeholder"></div>

        <!-- ===== MAIN CONTENT ===== -->
        <main class="main-content">

            <!-- ===== CONTENT ===== -->
            <div class="content-area">

                <!-- Bộ lọc thời gian -->
                <div class="filter-bar">
                    <div class="filter-left">
                        <h2><i class="fas fa-chart-bar"></i> Thống kê báo cáo</h2>
                    </div>
                    <div class="filter-right">
                        <select id="reportPeriod" class="filter-select">
                            <option value="today">Hôm nay</option>
                            <option value="week">Tuần này</option>
                            <option value="month" selected>Tháng này</option>
                            <option value="quarter">Quý này</option>
                            <option value="year">Năm nay</option>
                            <option value="custom">Tùy chọn</option>
                        </select>
                        <button class="btn-primary btn-sm" id="btnRefresh"><i class="fas fa-sync-alt"></i> Làm mới</button>
                    </div>
                </div>

                <!-- Stats Cards -->
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-icon"><i class="fas fa-dollar-sign"></i></div>
                        <div class="stat-info">
                            <h3 id="totalRevenue">0</h3>
                            <p>Tổng doanh thu</p>
                        </div>
                        <span class="stat-change positive" id="revenueChange">+0%</span>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon"><i class="fas fa-shopping-bag"></i></div>
                        <div class="stat-info">
                            <h3 id="totalOrders">0</h3>
                            <p>Tổng đơn hàng</p>
                        </div>
                        <span class="stat-change positive" id="ordersChange">+0%</span>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon"><i class="fas fa-users"></i></div>
                        <div class="stat-info">
                            <h3 id="totalCustomers">0</h3>
                            <p>Khách hàng</p>
                        </div>
                        <span class="stat-change positive" id="customersChange">+0%</span>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon"><i class="fas fa-boxes"></i></div>
                        <div class="stat-info">
                            <h3 id="totalProducts">0</h3>
                            <p>Sản phẩm đã bán</p>
                        </div>
                        <span class="stat-change negative" id="productsChange">-0%</span>
                    </div>
                </div>

                <!-- Biểu đồ chính: Doanh thu theo tháng -->
                <div class="chart-row">
                    <div class="chart-card chart-main">
                        <div class="chart-header">
                            <h3><i class="fas fa-chart-line"></i> Doanh thu theo tháng</h3>
                            <span id="revenuePeriod" class="period-label">Tháng 6/2026</span>
                        </div>
                        <canvas id="revenueChart"></canvas>
                    </div>
                </div>

                <!-- Biểu đồ phụ: Doanh thu theo danh mục & Top sản phẩm -->
                <div class="chart-row two-col">
                    <div class="chart-card">
                        <div class="chart-header">
                            <h3><i class="fas fa-pie-chart"></i> Doanh thu theo danh mục</h3>
                        </div>
                        <canvas id="categoryChart"></canvas>
                    </div>
                    <div class="chart-card">
                        <div class="chart-header">
                            <h3><i class="fas fa-trophy"></i> Top sản phẩm bán chạy</h3>
                        </div>
                        <canvas id="topProductsChart"></canvas>
                    </div>
                </div>

                <!-- Bảng đơn hàng gần đây và trạng thái -->
                <div class="chart-row two-col">
                    <div class="chart-card">
                        <div class="chart-header">
                            <h3><i class="fas fa-clipboard-list"></i> Đơn hàng theo trạng thái</h3>
                        </div>
                        <canvas id="orderStatusChart"></canvas>
                    </div>
                    <div class="chart-card">
                        <div class="chart-header">
                            <h3><i class="fas fa-clock"></i> Đơn hàng gần đây</h3>
                        </div>
                        <div class="recent-orders" id="recentOrders">
                            <div class="recent-item">
                                <span class="recent-code">#ORD-001</span>
                                <span class="recent-customer">Nguyễn Văn A</span>
                                <span class="recent-amount">255,000 đ</span>
                                <span class="status status-delivered">Đã giao</span>
                            </div>
                            <div class="recent-item">
                                <span class="recent-code">#ORD-002</span>
                                <span class="recent-customer">Trần Thị B</span>
                                <span class="recent-amount">360,000 đ</span>
                                <span class="status status-processing">Đang xử lý</span>
                            </div>
                            <div class="recent-item">
                                <span class="recent-code">#ORD-003</span>
                                <span class="recent-customer">Lê Văn C</span>
                                <span class="recent-amount">180,000 đ</span>
                                <span class="status status-cancelled">Đã hủy</span>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </main>
    </div>

    <!-- ===== TOAST ===== -->
    <div class="toast" id="toast">
        <i class="fas fa-check-circle"></i>
        <span id="toastMessage">Thành công!</span>
    </div>

    <!-- ===== SCRIPT ===== -->
    <script src="js/ThongkeBaocao.js"></script>
    <script src="admin/menu.js"></script>
    <script src="admin/header.js"></script>
</body>
</html>