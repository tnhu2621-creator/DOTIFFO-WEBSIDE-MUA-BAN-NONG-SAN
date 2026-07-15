<?php
session_start();
require_once 'config/database.php';

// Kiểm tra đăng nhập
if (!isset($_SESSION['user_id'])) {
    header('Location: Dangnhap.php');
    exit;
}
$user_id = $_SESSION['user_id'];

// Lấy tất cả đơn hàng của user
$stmt = $pdo->prepare("SELECT * FROM donhang WHERE MaNguoidung = ? ORDER BY NgayDat DESC");
$stmt->execute([$user_id]);
$orders = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Lấy chi tiết sản phẩm cho mỗi đơn
foreach ($orders as &$order) {
    $stmt = $pdo->prepare("
        SELECT ctdh.*, sp.TenSanPham 
        FROM chitietdonhang ctdh 
        JOIN sanpham sp ON ctdh.MaSanPham = sp.MaSanPham 
        WHERE ctdh.MaDonHang = ?
    ");
    $stmt->execute([$order['MaDonHang']]);
    $order['items'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
}
unset($order);

// Chuyển dữ liệu sang JSON cho JS
$ordersJson = json_encode($orders, JSON_UNESCAPED_UNICODE);
?>
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>DOTIFOOD - Đơn hàng của tôi</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,400;14..32,500;14..32,600;14..32,700;14..32,800&display=swap" rel="stylesheet" />
    <link href="https://fonts.googleapis.com/css2?family=Bona+Nova:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet" />
    <link rel="stylesheet" href="css/DonhangKH.css" />
</head>
<body>

    <!-- Breadcrumb -->
    <div class="breadcrumb">
        <div class="container">
            <a href="index.php">Trang chủ</a> <span>/</span>
            <span>Đơn hàng của tôi</span>
        </div>
    </div>

    <!-- Main content -->
    <section class="orders-page">
        <div class="container">
            <div class="orders-header">
                <h1><i class="fas fa-box"></i> Đơn hàng của tôi</h1>
                <p>Quản lý và theo dõi tất cả đơn hàng của bạn</p>
            </div>

            <div class="orders-tabs">
                <button class="tab-btn active" data-tab="active">Đơn hàng đang hoạt động <span id="activeBadge" class="badge">0</span></button>
                <button class="tab-btn" data-tab="history">Lịch sử đơn hàng</button>
            </div>

            <div class="tab-content active" id="tab-active">
                <div class="orders-list" id="activeOrders"></div>
            </div>
            <div class="tab-content" id="tab-history">
                <div class="orders-list" id="historyOrders"></div>
            </div>
        </div>
    </section>

    <!-- Modal chi tiết đơn hàng -->
    <div class="modal-overlay" id="orderDetailModal">
        <div class="modal modal-lg">
            <div class="modal-header">
                <h3 id="detailModalTitle">Chi tiết đơn hàng</h3>
                <button class="modal-close" id="detailModalClose"><i class="fas fa-times"></i></button>
            </div>
            <div class="modal-body">
                <div id="orderDetailContent"></div>
            </div>
            <div class="modal-footer">
                <button class="btn-outline btn-sm" id="detailModalCancel">Đóng</button>
            </div>
        </div>
    </div>

    <!-- Modal xác nhận hủy -->
    <div class="modal-overlay" id="cancelModal">
        <div class="modal modal-sm">
            <div class="modal-header">
                <h3>Xác nhận hủy đơn hàng</h3>
                <button class="modal-close" id="cancelModalClose"><i class="fas fa-times"></i></button>
            </div>
            <div class="modal-body">
                <p style="margin-bottom:12px;">Bạn có chắc chắn muốn hủy đơn hàng <strong id="cancelOrderCode"></strong>?</p>
                <p style="color:var(--gray-400); font-size:0.9rem;">Hành động này không thể hoàn tác.</p>
                <input type="hidden" id="cancelOrderId" />
            </div>
            <div class="modal-footer">
                <button class="btn-outline btn-sm" id="cancelModalCancel">Quay lại</button>
                <button class="btn-danger btn-sm" id="cancelModalConfirm"><i class="fas fa-times"></i> Hủy đơn</button>
            </div>
        </div>
    </div>

    <!-- Toast -->
    <div class="toast" id="toast">
        <i class="fas fa-check-circle"></i>
        <span id="toastMessage">Thành công!</span>
    </div>

    <!-- Truyền dữ liệu từ PHP sang JS -->
    <script>
        window.ordersData = <?= $ordersJson ?>;
        <?php if (isset($_SESSION['last_order_id'])): ?>
            window.lastOrderId = '<?= $_SESSION['last_order_id'] ?>';
            <?php unset($_SESSION['last_order_id']); ?>
        <?php endif; ?>
    </script>
    <script src="js/DonhangKH.js"></script>
</body>
</html>