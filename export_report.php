<?php
session_start();
require_once 'config/database.php';

// Kiểm tra quyền
if (!isset($_SESSION['user_id']) || !in_array($_SESSION['user_role'], [111, 222])) {
    die('Bạn không có quyền truy cập.');
}

$period = isset($_GET['period']) ? $_GET['period'] : 'month';

// Xác định khoảng thời gian
$startDate = date('Y-m-01');
$endDate = date('Y-m-t');
if ($period === 'today') {
    $startDate = date('Y-m-d');
    $endDate = date('Y-m-d');
} elseif ($period === 'week') {
    $startDate = date('Y-m-d', strtotime('monday this week'));
    $endDate = date('Y-m-d', strtotime('sunday this week'));
} elseif ($period === 'quarter') {
    $month = ceil(date('n') / 3);
    $startDate = date('Y-' . sprintf('%02d', $month * 3 - 2) . '-01');
    $endDate = date('Y-' . sprintf('%02d', $month * 3) . '-t');
} elseif ($period === 'year') {
    $startDate = date('Y-01-01');
    $endDate = date('Y-12-31');
}

try {
    // --- 1. Doanh thu theo ngày/tháng ---
    if ($period === 'today' || $period === 'week' || $period === 'month') {
        $stmt = $pdo->prepare("
            SELECT DATE(NgayDat) AS ngay, COALESCE(SUM(TongTien), 0) AS revenue
            FROM donhang
            WHERE DATE(NgayDat) BETWEEN ? AND ? AND TrangThai = 'Đã giao'
            GROUP BY DATE(NgayDat)
            ORDER BY ngay ASC
        ");
        $stmt->execute([$startDate, $endDate]);
        $dailyData = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $revenueLabels = [];
        $revenueValues = [];
        $current = strtotime($startDate);
        $end = strtotime($endDate);
        while ($current <= $end) {
            $dateKey = date('Y-m-d', $current);
            $revenueLabels[] = date('d/m/Y', $current);
            $found = false;
            foreach ($dailyData as $row) {
                if ($row['ngay'] === $dateKey) {
                    $revenueValues[] = (float)$row['revenue'];
                    $found = true;
                    break;
                }
            }
            if (!$found) $revenueValues[] = 0;
            $current = strtotime('+1 day', $current);
        }
        $revenueTitle = 'DOANH THU THEO NGÀY';
        $subTitle = '(Chi tiết từng ngày)';
    } else {
        $monthlyRevenue = [];
        $monthLabels = [];
        if ($period === 'quarter') {
            $start = new DateTime($startDate);
            $end = new DateTime($endDate);
            while ($start <= $end) {
                $month = $start->format('Y-m');
                $stmt = $pdo->prepare("SELECT COALESCE(SUM(TongTien), 0) FROM donhang WHERE NgayDat LIKE ? AND TrangThai = 'Đã giao'");
                $stmt->execute([$month . '%']);
                $monthlyRevenue[] = (float) $stmt->fetchColumn();
                $monthLabels[] = $start->format('m/Y');
                $start->modify('+1 month');
            }
        } else { // year
            for ($i = 11; $i >= 0; $i--) {
                $month = date('Y-m', strtotime("-$i months"));
                $stmt = $pdo->prepare("SELECT COALESCE(SUM(TongTien), 0) FROM donhang WHERE NgayDat LIKE ? AND TrangThai = 'Đã giao'");
                $stmt->execute([$month . '%']);
                $monthlyRevenue[] = (float) $stmt->fetchColumn();
                $monthLabels[] = date('m/Y', strtotime($month));
            }
        }
        $revenueLabels = $monthLabels;
        $revenueValues = $monthlyRevenue;
        $revenueTitle = 'DOANH THU THEO THÁNG';
        $subTitle = '(Chi tiết từng tháng)';
    }

    // --- 2. Top sản phẩm bán chạy (ĐÃ THÊM BỘ LỌC THỜI GIAN) ---
    $stmt = $pdo->prepare("
        SELECT sp.TenSanPham, SUM(ct.SoLuong) AS total_sold
        FROM chitietdonhang ct
        JOIN sanpham sp ON ct.MaSanPham = sp.MaSanPham
        JOIN donhang d ON ct.MaDonHang = d.MaDonHang
        WHERE d.TrangThai = 'Đã giao' AND DATE(d.NgayDat) BETWEEN ? AND ?
        GROUP BY sp.MaSanPham
        ORDER BY total_sold DESC
        LIMIT 10
    ");
    $stmt->execute([$startDate, $endDate]);
    $topProducts = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // --- 3. Đơn hàng theo trạng thái (ĐÃ THÊM BỘ LỌC THỜI GIAN) ---
    $stmt = $pdo->prepare("
        SELECT TrangThai, COUNT(*) AS count 
        FROM donhang 
        WHERE DATE(NgayDat) BETWEEN ? AND ? 
        GROUP BY TrangThai
    ");
    $stmt->execute([$startDate, $endDate]);
    $orderStatus = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // --- 4. Đơn hàng gần đây ---
    $stmt = $pdo->prepare("
        SELECT d.MaDonHang, n.HoTen AS customer_name, d.TongTien, d.TrangThai, d.NgayDat
        FROM donhang d
        LEFT JOIN nguoidung n ON d.MaNguoidung = n.MaNguoiDung
        WHERE DATE(d.NgayDat) BETWEEN ? AND ?
        ORDER BY d.NgayDat DESC
        LIMIT 50
    ");
    $stmt->execute([$startDate, $endDate]);
    $recentOrders = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // --- 5. Tổng doanh thu và đơn hàng ---
    $stmt = $pdo->prepare("SELECT COALESCE(SUM(TongTien), 0) FROM donhang WHERE DATE(NgayDat) BETWEEN ? AND ? AND TrangThai = 'Đã giao'");
    $stmt->execute([$startDate, $endDate]);
    $totalRevenue = (float) $stmt->fetchColumn();

    $stmt = $pdo->prepare("SELECT COUNT(*) FROM donhang WHERE DATE(NgayDat) BETWEEN ? AND ?");
    $stmt->execute([$startDate, $endDate]);
    $totalOrders = (int) $stmt->fetchColumn();

} catch (PDOException $e) {
    die('Lỗi truy vấn: ' . $e->getMessage());
}

// ===== XUẤT EXCEL ĐỊNH DẠNG HTML =====
header('Content-Type: application/vnd.ms-excel; charset=utf-8');
header('Content-Disposition: attachment; filename="bao_cao_thong_ke_' . date('Y-m-d') . '.xls"');

// Hàm định dạng tiền cho Excel
function formatPriceExcel($amount) {
    return number_format($amount, 0, ',', '.') . ' đ';
}

// Màu sắc chủ đạo
$primaryColor = '#008919';
$secondaryColor = '#f0f2f5';
$textColor = '#1e2b2a';
$headerBg = '#e6f7e6';

?>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Báo cáo thống kê</title>
    <style>
        /* Định dạng toàn bộ */
        body { font-family: 'Times New Roman', Arial, sans-serif; font-size: 12pt; }
        .header { background-color: <?= $primaryColor ?>; color: #fff; padding: 12px 20px; text-align: center; }
        .header h1 { margin: 0; font-size: 22pt; }
        .header p { margin: 4px 0 0; font-size: 11pt; opacity: 0.9; }
        .info { margin: 16px 0 20px; padding: 10px 16px; background: <?= $secondaryColor ?>; border-left: 6px solid <?= $primaryColor ?>; }
        .info p { margin: 4px 0; font-size: 11pt; }
        table { width: 100%; border-collapse: collapse; margin-top: 12px; }
        th, td { border: 1px solid #aaa; padding: 6px 10px; text-align: left; vertical-align: middle; }
        th { background-color: <?= $primaryColor ?>; color: #fff; font-weight: 700; text-align: center; }
        td { background-color: #fff; }
        .total-row { background-color: <?= $headerBg ?>; font-weight: 700; }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .section-title { font-size: 14pt; font-weight: 700; color: <?= $primaryColor ?>; margin: 20px 0 8px; border-bottom: 2px solid <?= $primaryColor ?>; padding-bottom: 4px; }
        .sub-title { font-size: 10pt; color: #666; font-weight: normal; margin-left: 10px; }
        .footer { margin-top: 24px; padding-top: 12px; border-top: 2px solid #ccc; text-align: center; font-size: 10pt; color: #888; }
        .status-badge { display: inline-block; padding: 2px 10px; border-radius: 10px; font-size: 10pt; font-weight: 600; }
        .status-pending { background: #fff3cd; color: #856404; }
        .status-processing { background: #cce5ff; color: #004085; }
        .status-shipped { background: #d4edda; color: #155724; }
        .status-delivered { background: #28a745; color: #fff; }
        .status-cancelled { background: #f8d7da; color: #721c24; }
    </style>
</head>
<body>

    <!-- HEADER -->
    <div class="header">
        <h1>📦 DOTIFOOD</h1>
        <p>BÁO CÁO THỐNG KÊ</p>
    </div>

    <!-- THÔNG TIN CHUNG -->
    <div class="info">
        <p><strong>Ngày xuất:</strong> <?= date('d/m/Y H:i:s') ?></p>
        <p><strong>Kỳ báo cáo:</strong> <?= ucfirst($period) ?></p>
        <p><strong>Từ ngày:</strong> <?= date('d/m/Y', strtotime($startDate)) ?> &nbsp; <strong>Đến ngày:</strong> <?= date('d/m/Y', strtotime($endDate)) ?></p>
    </div>

    <!-- TỔNG QUAN -->
    <div class="section-title">📊 TỔNG QUAN</div>
    <table>
        <tr>
            <th width="50%">Chỉ tiêu</th>
            <th width="50%">Giá trị</th>
        </tr>
        <tr>
            <td><strong>Tổng doanh thu</strong></td>
            <td class="text-right"><strong><?= formatPriceExcel($totalRevenue) ?></strong></td>
        </tr>
        <tr>
            <td><strong>Tổng đơn hàng</strong></td>
            <td class="text-center"><?= $totalOrders ?></td>
        </tr>
    </table>

    <!-- DOANH THU THEO NGÀY/THÁNG -->
    <div class="section-title"><?= $revenueTitle ?> <span class="sub-title"><?= $subTitle ?></span></div>
    <table>
        <tr>
            <th width="50%">Kỳ</th>
            <th width="50%">Doanh thu</th>
        </tr>
        <?php foreach ($revenueLabels as $i => $label): ?>
        <tr>
            <td><?= $label ?></td>
            <td class="text-right"><?= formatPriceExcel($revenueValues[$i]) ?></td>
        </tr>
        <?php endforeach; ?>
        <tr class="total-row">
            <td><strong>TỔNG CỘNG</strong></td>
            <td class="text-right"><strong><?= formatPriceExcel(array_sum($revenueValues)) ?></strong></td>
        </tr>
    </table>

    <!-- TOP SẢN PHẨM BÁN CHẠY -->
    <div class="section-title">🏆 TOP SẢN PHẨM BÁN CHẠY</div>
    <?php if (count($topProducts) > 0): ?>
    <table>
        <tr>
            <th width="10%">#</th>
            <th width="60%">Sản phẩm</th>
            <th width="30%">Số lượng bán</th>
        </tr>
        <?php foreach ($topProducts as $i => $p): ?>
        <tr>
            <td class="text-center"><?= $i + 1 ?></td>
            <td><?= htmlspecialchars($p['TenSanPham']) ?></td>
            <td class="text-center"><?= $p['total_sold'] ?></td>
        </tr>
        <?php endforeach; ?>
    </table>
    <?php else: ?>
    <p style="color: #888;">Chưa có dữ liệu sản phẩm bán chạy trong khoảng thời gian này.</p>
    <?php endif; ?>

    <!-- ĐƠN HÀNG THEO TRẠNG THÁI -->
    <div class="section-title">📋 ĐƠN HÀNG THEO TRẠNG THÁI</div>
    <?php if (count($orderStatus) > 0): ?>
    <table>
        <tr>
            <th width="60%">Trạng thái</th>
            <th width="40%">Số lượng</th>
        </tr>
        <?php 
        $statusMap = [
            'Chờ xác nhận' => 'pending',
            'Đang xử lý' => 'processing',
            'Đang giao' => 'shipped',
            'Đã giao' => 'delivered',
            'Đã hủy' => 'cancelled'
        ];
        foreach ($orderStatus as $s): 
            $class = $statusMap[$s['TrangThai']] ?? 'pending';
        ?>
        <tr>
            <td><span class="status-badge status-<?= $class ?>"><?= htmlspecialchars($s['TrangThai']) ?></span></td>
            <td class="text-center"><?= $s['count'] ?></td>
        </tr>
        <?php endforeach; ?>
    </table>
    <?php else: ?>
    <p style="color: #888;">Chưa có dữ liệu đơn hàng trong khoảng thời gian này.</p>
    <?php endif; ?>

    <!-- ĐƠN HÀNG GẦN ĐÂY -->
    <div class="section-title">🕒 ĐƠN HÀNG GẦN ĐÂY</div>
    <?php if (count($recentOrders) > 0): ?>
    <table>
        <tr>
            <th width="15%">Mã đơn</th>
            <th width="25%">Khách hàng</th>
            <th width="20%">Tổng tiền</th>
            <th width="15%">Trạng thái</th>
            <th width="25%">Ngày đặt</th>
        </tr>
        <?php foreach ($recentOrders as $o): 
            $class = $statusMap[$o['TrangThai']] ?? 'pending';
        ?>
        <tr>
            <td><strong><?= htmlspecialchars($o['MaDonHang']) ?></strong></td>
            <td><?= htmlspecialchars($o['customer_name'] ?? 'N/A') ?></td>
            <td class="text-right"><?= formatPriceExcel($o['TongTien']) ?></td>
            <td><span class="status-badge status-<?= $class ?>"><?= htmlspecialchars($o['TrangThai']) ?></span></td>
            <td><?= date('d/m/Y H:i', strtotime($o['NgayDat'])) ?></td>
        </tr>
        <?php endforeach; ?>
    </table>
    <?php else: ?>
    <p style="color: #888;">Chưa có đơn hàng trong khoảng thời gian này.</p>
    <?php endif; ?>

    <!-- FOOTER -->
    <div class="footer">
        <p>Báo cáo được tạo tự động từ hệ thống DOTIFOOD</p>
    </div>

</body>
</html>