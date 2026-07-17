<?php
session_start();
require_once 'config/database.php';

// Kiểm tra đăng nhập
if (!isset($_SESSION['user_id'])) {
    header('Location: Dangnhap.php');
    exit;
}

// Lưu trang trước để quay lại
if (isset($_SERVER['HTTP_REFERER']) && !strpos($_SERVER['HTTP_REFERER'], 'Thanhtoan.php')) {
    $_SESSION['previous_page'] = $_SERVER['HTTP_REFERER'];
}
if (!isset($_SESSION['previous_page'])) {
    $_SESSION['previous_page'] = 'sanphamKH.php';
}

// Lấy danh sách sản phẩm từ GET
$ids = isset($_GET['ids']) ? $_GET['ids'] : '';
if (empty($ids)) {
    header('Location: ' . $_SESSION['previous_page']);
    exit;
}
$idArray = array_filter(array_map('trim', explode(',', $ids)));
if (empty($idArray)) {
    header('Location: ' . $_SESSION['previous_page']);
    exit;
}
$placeholders = implode(',', array_fill(0, count($idArray), '?'));

$user_id = $_SESSION['user_id'];

// Lấy giỏ hàng
$stmt = $pdo->prepare("SELECT MaGioHang FROM giohang WHERE MaNguoiDung = ? AND TrangThai = 0");
$stmt->execute([$user_id]);
$cart = $stmt->fetch(PDO::FETCH_ASSOC);
if (!$cart) {
    header('Location: ' . $_SESSION['previous_page']);
    exit;
}
$cart_id = $cart['MaGioHang'];

// Lấy chi tiết giỏ hàng
$sql = "SELECT sp.MaSanPham, sp.TenSanPham, sp.GiaBan, sp.HinhAnh, gc.SoLuong
        FROM giohang_chitiet gc
        JOIN sanpham sp ON gc.MaSanPham = sp.MaSanPham
        WHERE gc.MaGioHang = ? AND sp.MaSanPham IN ($placeholders)";
$stmt = $pdo->prepare($sql);
$params = array_merge([$cart_id], $idArray);
$stmt->execute($params);
$cartItems = $stmt->fetchAll(PDO::FETCH_ASSOC);
if (empty($cartItems)) {
    header('Location: ' . $_SESSION['previous_page']);
    exit;
}

// Tính tổng
$totalPrice = 0;
foreach ($cartItems as $item) {
    $totalPrice += $item['GiaBan'] * $item['SoLuong'];
}

// Lấy thông tin người dùng
$userInfo = [];
$stmt = $pdo->prepare("SELECT HoTen, SoDienThoai, DiaChi FROM nguoidung WHERE MaNguoiDung = ?");
$stmt->execute([$user_id]);
$userInfo = $stmt->fetch(PDO::FETCH_ASSOC) ?: ['HoTen' => '', 'SoDienThoai' => '', 'DiaChi' => ''];

// Xử lý POST
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $hoTen = trim($_POST['hoTen'] ?? '');
    $soDienThoai = trim($_POST['soDienThoai'] ?? '');
    $diaChi = trim($_POST['diaChi'] ?? '');
    $ghiChu = trim($_POST['ghiChu'] ?? '');
    $phuongThucThanhToan = $_POST['phuongThucThanhToan'] ?? 'cod';

    if (empty($hoTen) || empty($soDienThoai) || empty($diaChi)) {
        $error = 'Vui lòng điền đầy đủ thông tin giao hàng.';
    } else {
        // Kiểm tra user tồn tại
        $checkUser = $pdo->prepare("SELECT MaNguoiDung FROM nguoidung WHERE MaNguoiDung = ?");
        $checkUser->execute([$user_id]);
        if (!$checkUser->fetch()) {
            $error = 'Người dùng không tồn tại. Vui lòng đăng nhập lại.';
        } else {
            $pdo->beginTransaction();
            try {
                // ===== HÀM TẠO MÃ ĐƠN HÀNG 7 KÝ TỰ =====
                function generateOrderId($length = 7) {
                    $characters = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
                    $randomString = '';
                    for ($i = 0; $i < $length; $i++) {
                        $randomString .= $characters[rand(0, strlen($characters) - 1)];
                    }
                    return $randomString;
                }

                // Kiểm tra và sửa bản ghi có MaDonHang rỗng (nếu có)
                $stmt = $pdo->prepare("SELECT COUNT(*) FROM donhang WHERE MaDonHang = ''");
                $stmt->execute();
                if ($stmt->fetchColumn() > 0) {
                    $newFakeId = 'FAKE_' . uniqid();
                    $update = $pdo->prepare("UPDATE donhang SET MaDonHang = ? WHERE MaDonHang = ''");
                    $update->execute([$newFakeId]);
                    error_log("Đã sửa bản ghi có MaDonHang rỗng thành $newFakeId");
                }

                // Tạo mã đơn hàng duy nhất (7 ký tự)
                $maDonHang = '';
                $attempt = 0;
                do {
                    $maDonHang = generateOrderId(7);
                    // Đảm bảo không vượt quá 20 ký tự (varchar(20))
                    if (strlen($maDonHang) > 20) {
                        $maDonHang = substr($maDonHang, 0, 20);
                    }
                    // Kiểm tra trùng
                    $check = $pdo->prepare("SELECT MaDonHang FROM donhang WHERE MaDonHang = ?");
                    $check->execute([$maDonHang]);
                    $attempt++;
                    if ($attempt > 10) {
                        throw new Exception('Không thể tạo mã đơn hàng duy nhất sau 10 lần thử.');
                    }
                } while ($check->fetch());

                // Kiểm tra cuối cùng
                if (empty($maDonHang)) {
                    throw new Exception('Mã đơn hàng rỗng, không thể tiếp tục.');
                }

                error_log("Đang tạo đơn hàng với mã: " . $maDonHang);

                // Insert đơn hàng
                $sql = "INSERT INTO donhang 
                        (MaDonHang, MaNguoidung, NgayDat, TongTien, PhuongThucThanhToan, TrangThai, GhiChu, DiaChiGiaoHang)
                        VALUES (?, ?, NOW(), ?, ?, 'Chờ xác nhận', ?, ?)";
                $stmt = $pdo->prepare($sql);
                $stmt->execute([
                    $maDonHang,
                    $user_id,
                    $totalPrice,
                    $phuongThucThanhToan,
                    $ghiChu,
                    $diaChi
                ]);

                if ($stmt->rowCount() === 0) {
                    throw new Exception('Không thể tạo đơn hàng (0 rows affected).');
                }

                // Insert chi tiết đơn hàng
                $sql = "INSERT INTO chitietdonhang (MaChiTiet, MaDonHang, MaSanPham, SoLuong, DonGia)
                        VALUES (?, ?, ?, ?, ?)";
                $stmt = $pdo->prepare($sql);

                foreach ($cartItems as $item) {
                    $maChiTiet = substr('CT' . uniqid(), 0, 20);
                    $stmt->execute([
                        $maChiTiet,
                        $maDonHang,
                        $item['MaSanPham'],
                        $item['SoLuong'],
                        $item['GiaBan']
                    ]);
                }

                // Xóa sản phẩm khỏi giỏ
                $sql = "DELETE FROM giohang_chitiet WHERE MaGioHang = ? AND MaSanPham IN ($placeholders)";
                $stmt = $pdo->prepare($sql);
                $stmt->execute(array_merge([$cart_id], $idArray));

                $pdo->commit();

                $_SESSION['order_success'] = true;
                $_SESSION['last_order_id'] = $maDonHang;

                header('Location: DonhangKH.php');
                exit;
            } catch (Exception $e) {
                $pdo->rollBack();
                $error = 'Có lỗi xảy ra khi đặt hàng: ' . $e->getMessage();
                error_log($e->getMessage());
            }
        }
    }
}
?>
<link rel="stylesheet" href="css/Thanhtoan.css">
<div class="checkout-page">
    <div class="container">
        <h1 class="page-title">Thanh toán đơn hàng</h1>
        <div class="checkout-grid">
            <!-- Cột trái -->
            <div class="checkout-left">
                <div class="checkout-section">
                    <h2><i class="fas fa-box"></i> Sản phẩm đã chọn</h2>
                    <div class="order-summary">
                        <?php foreach ($cartItems as $item): ?>
                            <div class="order-item">
                                <div class="order-item-img">
                                    <img src="images/<?= htmlspecialchars($item['HinhAnh'] ?: 'default-product.png') ?>" alt="<?= htmlspecialchars($item['TenSanPham']) ?>">
                                </div>
                                <div class="order-item-info">
                                    <h4><?= htmlspecialchars($item['TenSanPham']) ?></h4>
                                    <p>Số lượng: <?= $item['SoLuong'] ?></p>
                                    <p>Đơn giá: <?= number_format($item['GiaBan'], 0, ',', '.') ?> đ</p>
                                </div>
                                <div class="order-item-total">
                                    <?= number_format($item['GiaBan'] * $item['SoLuong'], 0, ',', '.') ?> đ
                                </div>
                            </div>
                        <?php endforeach; ?>
                    </div>
                    <div class="total-price">
                        <span>Tổng cộng:</span>
                        <span class="total-amount"><?= number_format($totalPrice, 0, ',', '.') ?> đ</span>
                    </div>
                </div>
            </div>
            <!-- Cột phải -->
            <div class="checkout-right">
                <div class="checkout-section">
                    <h2><i class="fas fa-user"></i> Thông tin nhận hàng</h2>
                    <?php if (isset($error)): ?>
                        <div class="alert alert-danger"><?= htmlspecialchars($error) ?></div>
                    <?php endif; ?>
                    <form method="post" class="checkout-form" id="checkoutForm">
                        <div class="form-group">
                            <label for="hoTen">Họ và tên *</label>
                            <input type="text" id="hoTen" name="hoTen" value="<?= htmlspecialchars($userInfo['HoTen']) ?>" required>
                        </div>
                        <div class="form-group">
                            <label for="soDienThoai">Số điện thoại *</label>
                            <input type="tel" id="soDienThoai" name="soDienThoai" value="<?= htmlspecialchars($userInfo['SoDienThoai']) ?>" required>
                        </div>
                        <div class="form-group">
                            <label for="diaChi">Địa chỉ giao hàng *</label>
                            <input type="text" id="diaChi" name="diaChi" value="<?= htmlspecialchars($userInfo['DiaChi']) ?>" required>
                        </div>
                        <div class="form-group">
                            <label for="ghiChu">Ghi chú (không bắt buộc)</label>
                            <textarea id="ghiChu" name="ghiChu" rows="2"></textarea>
                        </div>
                        <div class="form-group">
                            <label>Phương thức thanh toán</label>
                            <div class="payment-options">
                                <label class="payment-option">
                                    <input type="radio" name="phuongThucThanhToan" value="cod" checked>
                                    <span><i class="fas fa-money-bill-wave"></i> Thanh toán khi nhận hàng (COD)</span>
                                </label>
                                <label class="payment-option">
                                    <input type="radio" name="phuongThucThanhToan" value="bank">
                                    <span><i class="fas fa-university"></i> Chuyển khoản ngân hàng</span>
                                </label>
                            </div>
                        </div>
                        <div style="display: flex; gap: 10px; margin-top: 10px;">
                            <a href="<?= htmlspecialchars($_SESSION['previous_page']) ?>" class="btn-back">
                                <i class="fas fa-arrow-left"></i> Quay lại
                            </a>
                            <button type="submit" class="btn-confirm-order" style="flex: 1;">
                                <i class="fas fa-check-circle"></i> Xác nhận đặt hàng
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
</div>
<script src="js/Thanhtoan.js"></script>