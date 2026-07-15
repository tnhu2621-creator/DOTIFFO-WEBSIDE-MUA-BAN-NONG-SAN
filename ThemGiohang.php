<?php
session_start();
require_once 'config/database.php';

header('Content-Type: application/json');

// Kiểm tra đăng nhập
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Vui lòng đăng nhập để thêm vào giỏ hàng']);
    exit;
}

$user_id = $_SESSION['user_id'];

// Lấy dữ liệu từ POST (dùng key 'id' như JS gửi)
$product_id = isset($_POST['id']) ? trim($_POST['id']) : '';
$quantity = isset($_POST['quantity']) ? (int)$_POST['quantity'] : 1;

if (empty($product_id)) {
    echo json_encode(['success' => false, 'message' => 'Mã sản phẩm không hợp lệ']);
    exit;
}

if ($quantity < 1) {
    echo json_encode(['success' => false, 'message' => 'Số lượng phải lớn hơn 0']);
    exit;
}

try {
    // 1. Kiểm tra tồn kho
    $stmt = $pdo->prepare("SELECT SoLuongTon FROM khohang WHERE MaSanPham = ?");
    $stmt->execute([$product_id]);
    $stock = $stmt->fetchColumn();
    if ($stock === false) $stock = 0;
    if ($stock <= 0) {
        echo json_encode(['success' => false, 'message' => 'Sản phẩm đã hết hàng']);
        exit;
    }

    // 2. Lấy hoặc tạo giỏ hàng
    $stmt = $pdo->prepare("SELECT MaGioHang FROM giohang WHERE MaNguoiDung = ? AND TrangThai = 0");
    $stmt->execute([$user_id]);
    $cart = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$cart) {
        $stmt = $pdo->prepare("INSERT INTO giohang (MaNguoiDung, NgayTao, TrangThai) VALUES (?, NOW(), 0)");
        $stmt->execute([$user_id]);
        $cart_id = $pdo->lastInsertId();
    } else {
        $cart_id = $cart['MaGioHang'];
    }

    // 3. Kiểm tra sản phẩm đã có trong giỏ chưa
    $stmt = $pdo->prepare("SELECT SoLuong FROM giohang_chitiet WHERE MaGioHang = ? AND MaSanPham = ?");
    $stmt->execute([$cart_id, $product_id]);
    $existing = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($existing) {
        $newQty = $existing['SoLuong'] + $quantity;
        if ($newQty > $stock) {
            echo json_encode(['success' => false, 'message' => 'Số lượng vượt quá tồn kho']);
            exit;
        }
        $stmt = $pdo->prepare("UPDATE giohang_chitiet SET SoLuong = ? WHERE MaGioHang = ? AND MaSanPham = ?");
        $stmt->execute([$newQty, $cart_id, $product_id]);
    } else {
        // Kiểm tra nếu số lượng thêm lớn hơn tồn kho
        if ($quantity > $stock) {
            echo json_encode(['success' => false, 'message' => 'Số lượng vượt quá tồn kho']);
            exit;
        }
        $stmt = $pdo->prepare("INSERT INTO giohang_chitiet (MaGioHang, MaSanPham, SoLuong) VALUES (?, ?, ?)");
        $stmt->execute([$cart_id, $product_id, $quantity]);
    }

    // 4. Lấy danh sách sản phẩm trong giỏ để trả về (cập nhật UI)
    $stmt = $pdo->prepare("
        SELECT gc.SoLuong AS quantity, sp.GiaBan AS price, sp.TenSanPham AS name, sp.HinhAnh AS icon
        FROM giohang_chitiet gc
        JOIN sanpham sp ON gc.MaSanPham = sp.MaSanPham
        WHERE gc.MaGioHang = ?
    ");
    $stmt->execute([$cart_id]);
    $cartItems = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // 5. Trả về JSON thành công kèm dữ liệu giỏ
    echo json_encode([
        'success' => true,
        'message' => 'Thêm vào giỏ thành công',
        'cart_items' => $cartItems
    ]);

} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Lỗi server: ' . $e->getMessage()]);
}
?>