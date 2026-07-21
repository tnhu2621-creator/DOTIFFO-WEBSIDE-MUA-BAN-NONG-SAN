<?php
// 1. Kết nối CSDL (PDO)
require_once 'config/database.php'; 

// 2. Lấy ID từ URL
$rawId = trim($_GET['id'] ?? '');

if (empty($rawId)) {
    die('Thiếu ID khách hàng.');
}

// Tách lấy số thuần túy (ví dụ: 'ND02' -> 2)
$numericId = (int) preg_replace('/[^0-9]/', '', $rawId);

// 3. Truy vấn linh hoạt: Tìm kiếm cả theo chuỗi gốc ('ND02') lẫn số ('2')
$sql = "SELECT * FROM nguoidung WHERE MaNguoiDung = ? OR MaNguoiDung = ?";
$stmt = $conn->prepare($sql);
$stmt->execute([$rawId, $numericId]);
$customer = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$customer) {
    die('Không tìm thấy khách hàng trong hệ thống.');
}

// Lấy mã ID thực tế tìm thấy trong DB
$actualId = $customer['MaNguoiDung'];

// Kiểm tra xem HinhAnh có phải là file ảnh hợp lệ (.jpg, .png, .webp...) hay không
$hasValidAvatar = !empty($customer['HinhAnh']) && preg_match('/\.(jpg|jpeg|png|gif|webp)$/i', $customer['HinhAnh']);

// --- Thống kê đơn hàng ---
// Tổng đơn hàng
$stmt = $conn->prepare("SELECT COUNT(*) FROM donhang WHERE MaNguoidung = ? OR MaNguoidung = ?");
$stmt->execute([$actualId, $numericId]);
$totalOrders = (int) $stmt->fetchColumn();

// Đơn hàng đã hủy
$stmt = $conn->prepare("SELECT COUNT(*) FROM donhang WHERE (MaNguoidung = ? OR MaNguoidung = ?) AND TrangThai = 'Đã hủy'");
$stmt->execute([$actualId, $numericId]);
$cancelledOrders = (int) $stmt->fetchColumn();

// Đơn hàng đã giao
$stmt = $conn->prepare("SELECT COUNT(*) FROM donhang WHERE (MaNguoidung = ? OR MaNguoidung = ?) AND TrangThai = 'Đã giao'");
$stmt->execute([$actualId, $numericId]);
$deliveredOrders = (int) $stmt->fetchColumn();

// Đơn hàng trong tháng
$monthStart = date('Y-m-01 00:00:00');
$monthEnd = date('Y-m-t 23:59:59');
$stmt = $conn->prepare("SELECT COUNT(*) FROM donhang WHERE (MaNguoidung = ? OR MaNguoidung = ?) AND NgayDat BETWEEN ? AND ?");
$stmt->execute([$actualId, $numericId, $monthStart, $monthEnd]);
$monthOrders = (int) $stmt->fetchColumn();

// Tổng chi tiêu
$stmt = $conn->prepare("SELECT SUM(TongTien) FROM donhang WHERE (MaNguoidung = ? OR MaNguoidung = ?) AND TrangThai = 'Đã giao'");
$stmt->execute([$actualId, $numericId]);
$totalSpent = (float) ($stmt->fetchColumn() ?: 0);

// Tỉ lệ hủy đơn
$cancelRate = $totalOrders > 0 ? round(($cancelledOrders / $totalOrders) * 100, 1) : 0;

// --- Lấy danh sách đơn hàng gần đây (20 đơn) ---
$stmt = $conn->prepare("
    SELECT 
        d.MaDonHang,
        d.NgayDat,
        d.TongTien,
        d.TrangThai,
        (SELECT COUNT(*) FROM chitietdonhang WHERE MaDonHang = d.MaDonHang) AS total_items
    FROM donhang d
    WHERE d.MaNguoidung = ? OR d.MaNguoidung = ?
    ORDER BY d.NgayDat DESC
    LIMIT 20
");
$stmt->execute([$actualId, $numericId]);
$orders = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Hàm định dạng tiền tệ
function formatCurrency($amount) {
    return number_format($amount, 0, ',', '.') . ' ₫';
}

// Hàm lấy class CSS cho trạng thái
function getStatusClass($status) {
    $map = [
        'Chờ xác nhận' => 'status-warning',
        'Đang xử lý'   => 'status-info',
        'Đang giao'    => 'status-primary',
        'Đã giao'      => 'status-success',
        'Đã hủy'       => 'status-danger'
    ];
    return $map[$status] ?? 'status-secondary';
}
?>
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>DOTIFOOD - Chi tiết khách hàng</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,400;14..32,500;14..32,600;14..32,700;14..32,800&display=swap" rel="stylesheet" />
    <link href="https://fonts.googleapis.com/css2?family=Bona+Nova:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet" />
    <link rel="stylesheet" href="css/ChitietKhachhang.css" />
    <link rel="stylesheet" href="admin/header.css" />
</head>
<body>
    <div class="admin-wrapper">
        <main class="main-content">
            <?php include 'admin/header.php'; ?>
            
            <div class="content-area">

                <!-- Breadcrumb -->
                <div class="breadcrumb-custom">
                    <a href="QuanlyKhachhang.php"><i class="fas fa-arrow-left"></i> Quay lại danh sách</a>
                    <span>/</span>
                    <span>Chi tiết khách hàng</span>
                </div>

                <!-- Thông tin khách hàng -->
                <div class="customer-header">
                    <div class="customer-avatar">
                        <?php if ($hasValidAvatar): ?>
                            <img src="images/<?= htmlspecialchars($customer['HinhAnh']) ?>" alt="Avatar" />
                        <?php else: ?>
                            <div class="avatar-placeholder"><i class="fas fa-user"></i></div>
                        <?php endif; ?>
                    </div>
                    <div class="customer-info">
                        <h1><?= htmlspecialchars($customer['HoTen']) ?></h1>
                        <div class="customer-meta">
                            <span><i class="fas fa-envelope"></i> <?= htmlspecialchars($customer['Email']) ?></span>
                            <span><i class="fas fa-phone"></i> <?= htmlspecialchars($customer['SoDienThoai'] ?? 'Chưa cập nhật') ?></span>
                            <span><i class="fas fa-map-marker-alt"></i> <?= htmlspecialchars($customer['DiaChi'] ?? 'Chưa cập nhật') ?></span>
                        </div>
                        <div class="customer-status">
                            <span class="status-badge <?= $customer['TrangThai'] == 1 ? 'status-active' : 'status-inactive' ?>">
                                <?= $customer['TrangThai'] == 1 ? '✅ Hoạt động' : '⛔ Tạm ngưng' ?>
                            </span>
                            <span class="customer-id">ID: <?= htmlspecialchars($customer['MaNguoiDung']) ?></span>
                        </div>
                    </div>
                </div>

                <!-- Thống kê -->
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-icon"><i class="fas fa-shopping-bag"></i></div>
                        <div class="stat-info"><h3><?= $totalOrders ?></h3><p>Tổng đơn hàng</p></div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-icon"><i class="fas fa-check-circle"></i></div>
                        <div class="stat-info"><h3><?= $deliveredOrders ?></h3><p>Đã giao thành công</p></div>
                    </div>
                    
                    <!-- ĐÃ THÊM icon-red -->
                    <div class="stat-card">
                        <div class="stat-icon icon-red"><i class="fas fa-times-circle"></i></div>
                        <div class="stat-info"><h3><?= $cancelledOrders ?></h3><p>Đã hủy</p></div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-icon"><i class="fas fa-calendar-alt"></i></div>
                        <div class="stat-info"><h3><?= $monthOrders ?></h3><p>Đơn trong tháng</p></div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-icon"><i class="fas fa-money-bill-wave"></i></div>
                        <div class="stat-info"><h3><?= formatCurrency($totalSpent) ?></h3><p>Tổng chi tiêu</p></div>
                    </div>
                    
                    <!-- ĐÃ THÊM icon-pink -->
                    <div class="stat-card">
                        <div class="stat-icon icon-pink"><i class="fas fa-percent"></i></div>
                        <div class="stat-info"><h3><?= $cancelRate ?>%</h3><p>Tỉ lệ hủy đơn</p></div>
                    </div>
                </div>

                <!-- Lịch sử đơn hàng -->
                <div class="table-card">
                    <div class="table-header">
                        <h3><i class="fas fa-list"></i> Lịch sử đơn hàng</h3>
                        <span><?= count($orders) ?> đơn hàng gần đây</span>
                    </div>
                    <div class="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th>Mã đơn</th>
                                    <th>Ngày đặt</th>
                                    <th>Số lượng SP</th>
                                    <th>Tổng tiền</th>
                                    <th>Trạng thái</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php if (count($orders) > 0): ?>
                                    <?php foreach ($orders as $order): ?>
                                    <tr>
                                        <td><strong><?= htmlspecialchars($order['MaDonHang']) ?></strong></td>
                                        <td><?= date('d/m/Y H:i', strtotime($order['NgayDat'])) ?></td>
                                        <td><?= $order['total_items'] ?></td>
                                        <td><?= formatCurrency($order['TongTien']) ?></td>
                                        <td><span class="status <?= getStatusClass($order['TrangThai']) ?>"><?= htmlspecialchars($order['TrangThai']) ?></span></td>
                                    </tr>
                                    <?php endforeach; ?>
                                <?php else: ?>
                                    <tr><td colspan="5" style="text-align:center; padding:40px; color:var(--text-muted);"><i class="fas fa-box-open" style="font-size:2rem; display:block; margin-bottom:8px;"></i>Khách hàng chưa có đơn hàng nào.</td></tr>
                                <?php endif; ?>
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </main>
    </div>

    <!-- File JS Cấu trúc Admin Header -->
    <script src="admin/header.js"></script>

    <!-- Script cập nhật tiêu đề Header -->
    <script>
        function fixAdminHeader() {
            const headerTitles = document.querySelectorAll('.header h1, .header h2, .main-header h1, .header-title, .header-left h2, header h1');
            headerTitles.forEach(el => {
                el.textContent = "Chi tiết khách hàng";
            });
        }

        window.addEventListener('load', function () {
            fixAdminHeader();
            setTimeout(fixAdminHeader, 200);
        });
    </script>
</body>
</html>