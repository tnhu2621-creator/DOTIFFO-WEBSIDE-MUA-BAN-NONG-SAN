<?php
session_start();
require_once 'config/database.php';

// Nếu có action=get_stats thì trả về JSON
if (isset($_GET['action']) && $_GET['action'] === 'get_stats') {
    header('Content-Type: application/json');
    try {
        $period = isset($_GET['period']) ? $_GET['period'] : 'month';

        // Xác định khoảng thời gian
        $startDate = date('Y-m-d');
        $endDate = date('Y-m-d');
        if ($period === 'month') {
            $startDate = date('Y-m-01');
            $endDate = date('Y-m-t');
        } elseif ($period === 'week') {
            $startDate = date('Y-m-d', strtotime('monday this week'));
            $endDate = date('Y-m-d', strtotime('sunday this week'));
        } elseif ($period === 'year') {
            $startDate = date('Y-01-01');
            $endDate = date('Y-12-31');
        }

        // --- 1. Doanh thu theo thời gian ---
        if ($period === 'today') {
            $stmt = $pdo->prepare("
                SELECT HOUR(NgayDat) AS gio, COALESCE(SUM(TongTien), 0) AS revenue
                FROM donhang
                WHERE DATE(NgayDat) = ? AND TrangThai = 'Đã giao'
                GROUP BY HOUR(NgayDat)
                ORDER BY gio ASC
            ");
            $stmt->execute([$startDate]);
            $hourlyData = $stmt->fetchAll(PDO::FETCH_ASSOC);

            $labels = [];
            $values = [];
            for ($i = 0; $i < 24; $i++) {
                $labels[] = sprintf("%02d:00", $i);
                $found = false;
                foreach ($hourlyData as $row) {
                    if ((int)$row['gio'] === $i) {
                        $values[] = (float)$row['revenue'];
                        $found = true;
                        break;
                    }
                }
                if (!$found) $values[] = 0;
            }
            $revenueData = ['labels' => $labels, 'values' => $values];

        } elseif ($period === 'week' || $period === 'month') {
            $stmt = $pdo->prepare("
                SELECT DATE(NgayDat) AS ngay, COALESCE(SUM(TongTien), 0) AS revenue
                FROM donhang
                WHERE DATE(NgayDat) BETWEEN ? AND ? AND TrangThai = 'Đã giao'
                GROUP BY DATE(NgayDat)
                ORDER BY ngay ASC
            ");
            $stmt->execute([$startDate, $endDate]);
            $dailyData = $stmt->fetchAll(PDO::FETCH_ASSOC);

            $labels = [];
            $values = [];
            $current = strtotime($startDate);
            $end = strtotime($endDate);
            while ($current <= $end) {
                $dateKey = date('Y-m-d', $current);
                $labels[] = date('d/m', $current);
                $found = false;
                foreach ($dailyData as $row) {
                    if ($row['ngay'] === $dateKey) {
                        $values[] = (float)$row['revenue'];
                        $found = true;
                        break;
                    }
                }
                if (!$found) $values[] = 0;
                $current = strtotime('+1 day', $current);
            }
            $revenueData = ['labels' => $labels, 'values' => $values];

        } else {
            // NĂM NAY: Lấy đúng 12 tháng năm 2026
            $monthlyRevenue = [];
            $monthLabels = [];
            $currentYear = date('Y');

            for ($m = 1; $m <= 12; $m++) {
                $monthStr = sprintf('%s-%02d', $currentYear, $m);
                $stmt = $pdo->prepare("SELECT COALESCE(SUM(TongTien), 0) FROM donhang WHERE NgayDat LIKE ? AND TrangThai = 'Đã giao'");
                $stmt->execute([$monthStr . '%']);
                $monthlyRevenue[] = (float) $stmt->fetchColumn();
                $monthLabels[] = "T" . $m . "/" . $currentYear;
            }
            $revenueData = ['labels' => $monthLabels, 'values' => $monthlyRevenue];
        }

        // --- 2. Doanh thu theo danh mục (Lọc theo mốc thời gian) ---
        $stmt = $pdo->prepare("
            SELECT dm.TenDanhMuc, COALESCE(SUM(ct.SoLuong * ct.DonGia), 0) AS revenue
            FROM chitietdonhang ct
            JOIN sanpham sp ON ct.MaSanPham = sp.MaSanPham
            JOIN danhmuc dm ON sp.MaDanhMuc = dm.MaDanhMuc
            JOIN donhang d ON ct.MaDonHang = d.MaDonHang
            WHERE d.TrangThai = 'Đã giao' AND DATE(d.NgayDat) BETWEEN ? AND ?
            GROUP BY dm.TenDanhMuc
            ORDER BY revenue DESC
        ");
        $stmt->execute([$startDate, $endDate]);
        $categoryData = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $categoryLabels = array_column($categoryData, 'TenDanhMuc');
        $categoryValues = array_column($categoryData, 'revenue');

        // --- 3. Top sản phẩm bán chạy (Lọc theo mốc thời gian) ---
        $stmt = $pdo->prepare("
            SELECT sp.TenSanPham, SUM(ct.SoLuong) AS total_sold
            FROM chitietdonhang ct
            JOIN sanpham sp ON ct.MaSanPham = sp.MaSanPham
            JOIN donhang d ON ct.MaDonHang = d.MaDonHang
            WHERE d.TrangThai = 'Đã giao' AND DATE(d.NgayDat) BETWEEN ? AND ?
            GROUP BY sp.MaSanPham
            ORDER BY total_sold DESC
            LIMIT 5
        ");
        $stmt->execute([$startDate, $endDate]);
        $topProducts = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $topProductLabels = array_column($topProducts, 'TenSanPham');
        $topProductValues = array_column($topProducts, 'total_sold');

        // --- 4. Đơn hàng theo trạng thái (Lọc theo mốc thời gian) ---
        $stmt = $pdo->prepare("
            SELECT TrangThai, COUNT(*) AS count 
            FROM donhang 
            WHERE DATE(NgayDat) BETWEEN ? AND ? 
            GROUP BY TrangThai
        ");
        $stmt->execute([$startDate, $endDate]);
        $statusData = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $statusLabels = array_column($statusData, 'TrangThai');
        $statusValues = array_column($statusData, 'count');

        // --- 5. Đơn hàng gần đây ---
        $stmt = $pdo->query("
            SELECT d.MaDonHang, n.HoTen AS customer_name, d.TongTien, d.TrangThai
            FROM donhang d
            LEFT JOIN nguoidung n ON d.MaNguoidung = n.MaNguoiDung
            ORDER BY d.NgayDat DESC
            LIMIT 5
        ");
        $recentOrders = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // --- 6. Tổng số liệu tổng quan (Lọc theo mốc thời gian) ---
        $stmt = $pdo->prepare("SELECT COALESCE(SUM(TongTien), 0) FROM donhang WHERE DATE(NgayDat) BETWEEN ? AND ? AND TrangThai = 'Đã giao'");
        $stmt->execute([$startDate, $endDate]);
        $totalRevenue = (float) $stmt->fetchColumn();

        $stmt = $pdo->prepare("SELECT COUNT(*) FROM donhang WHERE DATE(NgayDat) BETWEEN ? AND ?");
        $stmt->execute([$startDate, $endDate]);
        $totalOrders = (int) $stmt->fetchColumn();

        $stmt = $pdo->query("SELECT COUNT(*) FROM nguoidung WHERE MaVaiTro = 333");
        $totalCustomers = (int) $stmt->fetchColumn();

        $stmt = $pdo->prepare("SELECT COALESCE(SUM(ct.SoLuong), 0) FROM chitietdonhang ct JOIN donhang d ON ct.MaDonHang = d.MaDonHang WHERE d.TrangThai = 'Đã giao' AND DATE(d.NgayDat) BETWEEN ? AND ?");
        $stmt->execute([$startDate, $endDate]);
        $totalProductsSold = (int) $stmt->fetchColumn();

        $revenueChange = '+12.5%';
        $ordersChange = '+8.2%';
        $customersChange = '+15.3%';
        $productsChange = '-2.1%';

        echo json_encode([
            'success' => true,
            'stats' => [
                'totalRevenue' => $totalRevenue,
                'totalOrders' => $totalOrders,
                'totalCustomers' => $totalCustomers,
                'totalProducts' => $totalProductsSold,
                'revenueChange' => $revenueChange,
                'ordersChange' => $ordersChange,
                'customersChange' => $customersChange,
                'productsChange' => $productsChange
            ],
            'revenue' => $revenueData,
            'category' => ['labels' => $categoryLabels, 'values' => $categoryValues],
            'topProducts' => ['labels' => $topProductLabels, 'values' => $topProductValues],
            'orderStatus' => ['labels' => $statusLabels, 'values' => $statusValues],
            'recentOrders' => $recentOrders
        ]);
        exit;
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
        exit;
    }
}
?>
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>DOTIFOOD - Thống kê báo cáo</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,400;14..32,500;14..32,600;14..32,700;14..32,800&display=swap" rel="stylesheet" />
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <link rel="stylesheet" href="css/ThongkeBaocao.css" />
    <link rel="stylesheet" href="admin/menu.css" />
    <link rel="stylesheet" href="admin/header.css" />
</head>
<body>
    <div class="admin-wrapper">
        <?php include 'admin/menu.php'; ?>

        <main class="main-content">
            <?php include 'admin/header.php'; ?>

            <div class="content-area">
                <div class="filter-bar">
                    <div class="filter-right">
                        <select id="reportPeriod" class="filter-select">
                            <option value="today">Hôm nay</option>
                            <option value="week">Tuần này</option>
                            <option value="month" selected>Tháng này</option>
                            <option value="year">Năm nay</option>
                        </select>
                        <button class="btn-primary btn-sm" id="btnRefresh"><i class="fas fa-sync-alt"></i> Làm mới</button>
                        <button class="btn-export btn-sm" id="btnExportReport">
                            <i class="fas fa-file-excel"></i> Xuất báo cáo
                        </button>
                    </div>
                </div>

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

                <div class="chart-row">
                    <div class="chart-card chart-main">
                        <div class="chart-header">
                            <h3><i class="fas fa-chart-line"></i> Doanh thu theo <span id="revenuePeriodLabel">tháng</span></h3>
                            <span id="revenuePeriod" class="period-label"></span>
                        </div>
                        <canvas id="revenueChart"></canvas>
                    </div>
                </div>

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
                        <div class="recent-orders" id="recentOrders"></div>
                    </div>
                </div>

            </div>
        </main>
    </div>

    <div class="toast" id="toast">
        <i class="fas fa-check-circle"></i>
        <span id="toastMessage">Thành công!</span>
    </div>

    <script src="admin/menu.js"></script>
    <script src="admin/header.js"></script>
    <script src="js/ThongkeBaocao.js"></script>
</body>
</html>