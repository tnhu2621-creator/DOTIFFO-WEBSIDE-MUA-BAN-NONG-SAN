<?php
include 'config/database.php';
include 'includes/functions.php';

// --- Lấy thống kê từ bảng donhang ---

// Doanh thu tháng này (chỉ đơn đã giao)
$monthStart = date('Y-m-01');
$monthEnd = date('Y-m-t');
$stmt = $pdo->prepare("SELECT SUM(TongTien) AS revenue FROM donhang WHERE NgayDat BETWEEN ? AND ? AND TrangThai = 'Đã giao'");
$stmt->execute([$monthStart, $monthEnd]);
$revenue = $stmt->fetchColumn() ?: 0;

// Tổng số đơn hàng
$stmt = $pdo->query("SELECT COUNT(*) FROM donhang");
$totalOrders = $stmt->fetchColumn();

// Tổng khách hàng (nếu có bảng nguoidung)
try {
    $stmt = $pdo->query("SELECT COUNT(*) FROM nguoidung");
    $totalCustomers = $stmt->fetchColumn() ?: 0;
} catch (PDOException $e) {
    $totalCustomers = 0; // nếu bảng chưa có
}

// Tổng sản phẩm (nếu có bảng sanpham)
try {
    $stmt = $pdo->query("SELECT COUNT(*) FROM sanpham");
    $totalProducts = $stmt->fetchColumn() ?: 0;
} catch (PDOException $e) {
    $totalProducts = 0;
}

// 5 đơn hàng gần nhất – kèm tên khách hàng (nếu có join)
$stmt = $pdo->query("
    SELECT d.MaDonHang, d.NgayDat, d.TongTien, d.TrangThai, n.HoTen AS customer_name
    FROM donhang d
    LEFT JOIN nguoidung n ON d.MaNguoiDung = n.MaNguoiDung
    ORDER BY d.NgayDat DESC
    LIMIT 5
");
$recentOrders = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Dữ liệu biểu đồ doanh thu 12 tháng
$labels = [];
$data = [];
for ($i = 11; $i >= 0; $i--) {
    $month = date('Y-m', strtotime("-$i months"));
    $labels[] = date('m/Y', strtotime($month));
    $start = $month . '-01';
    $end = date('Y-m-t', strtotime($month));
    $stmt = $pdo->prepare("SELECT SUM(TongTien) FROM donhang WHERE NgayDat BETWEEN ? AND ? AND TrangThai = 'Đã giao'");
    $stmt->execute([$start, $end]);
    $data[] = (float) $stmt->fetchColumn() ?: 0;
}

// Top sản phẩm (giả định - có thể thay thế sau)
$productLabels = ['Trà Sen', 'Xoài Cát', 'Mật ong', 'Gạo Nàng', 'Ánh Trà'];
$productData = [120, 90, 65, 50, 40];
?>
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>DOTIFOOD - Quản trị</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,400;14..32,500;14..32,600;14..32,700;14..32,800&display=swap" rel="stylesheet" />
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <link href="https://fonts.googleapis.com/css2?family=Bona+Nova:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet" />
    <link rel="stylesheet" href="css/Tongquan.css" />
    <link rel="stylesheet" href="admin/menu.css" />
    <link rel="stylesheet" href="admin/header.css" />
    
</head>
<body>
    <div class="admin-wrapper">
        <?php include 'admin/menu.php'; ?>
        <main class="main-content">
            <?php include 'admin/header.php'; ?>
            <div class="content-area" id="contentArea">
                <div class="page-content active" id="page-dashboard">
                    <div class="stats-grid">
                        <div class="stat-card">
                            <div class="stat-icon"><i class="fas fa-dollar-sign"></i></div>
                            <div class="stat-info">
                                <h3><?= formatCurrency($revenue) ?></h3>
                                <p>Doanh thu tháng này</p>
                            </div>
                            <span class="stat-change positive">+12.5%</span>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon"><i class="fas fa-shopping-bag"></i></div>
                            <div class="stat-info">
                                <h3><?= number_format($totalOrders) ?></h3>
                                <p>Đơn hàng</p>
                            </div>
                            <span class="stat-change positive">+8.2%</span>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon"><i class="fas fa-users"></i></div>
                            <div class="stat-info">
                                <h3><?= number_format($totalCustomers) ?></h3>
                                <p>Khách hàng</p>
                            </div>
                            <span class="stat-change positive">+15.3%</span>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon"><i class="fas fa-boxes"></i></div>
                            <div class="stat-info">
                                <h3><?= number_format($totalProducts) ?></h3>
                                <p>Sản phẩm</p>
                            </div>
                            <span class="stat-change negative">-2.1%</span>
                        </div>
                    </div>

                    <div class="charts-row">
                        <div class="chart-card">
                            <h3>Doanh thu theo tháng</h3>
                            <canvas id="revenueChart"></canvas>
                        </div>
                        <div class="chart-card">
                            <h3>Top sản phẩm bán chạy</h3>
                            <canvas id="topProductsChart"></canvas>
                        </div>
                    </div>

                    <div class="table-card">
                        <div class="table-header">
                            <h3>Đơn hàng gần đây</h3>
                            <a href="Donhang.php" class="view-all">Xem tất cả</a>
                        </div>
                        <table>
                            <thead>
                                <tr>
                                    <th>Mã đơn</th>
                                    <th>Khách hàng</th>
                                    <th>Sản phẩm</th>
                                    <th>Tổng tiền</th>
                                    <th>Trạng thái</th>
                                    <th>Ngày</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php if (count($recentOrders) > 0): ?>
                                    <?php foreach ($recentOrders as $order): ?>
                                    <tr>
                                        <td>#<?= htmlspecialchars($order['MaDonHang']) ?></td>
                                        <td><?= htmlspecialchars($order['customer_name'] ?? 'N/A') ?></td>
                                        <td><?= 'Xem chi tiết' ?></td>
                                        <td><?= formatCurrency($order['TongTien']) ?></td>
                                        <td><span class="status <?= getStatusClass($order['TrangThai']) ?>"><?= htmlspecialchars($order['TrangThai']) ?></span></td>
                                        <td><?= date('d/m/Y', strtotime($order['NgayDat'])) ?></td>
                                    </tr>
                                    <?php endforeach; ?>
                                <?php else: ?>
                                    <tr><td colspan="6" style="text-align:center;">Chưa có đơn hàng nào.</td></tr>
                                <?php endif; ?>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </main>
    </div>

    <script>
        const revenueLabels = <?= json_encode($labels) ?>;
        const revenueData = <?= json_encode($data) ?>;
        const productLabels = <?= json_encode($productLabels) ?>;
        const productData = <?= json_encode($productData) ?>;
    </script>

    <script src="js/Tongquan.js"></script>
    <script src="admin/menu.js"></script>
    <script src="admin/header.js"></script>
</body>
</html>