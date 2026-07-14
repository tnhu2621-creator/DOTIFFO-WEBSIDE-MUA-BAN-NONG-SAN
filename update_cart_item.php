<?php
session_start();
require_once 'config/database.php';

header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Chưa đăng nhập']);
    exit;
}

$user_id = $_SESSION['user_id'];
$product_id = isset($_POST['product_id']) ? trim($_POST['product_id']) : '';  // KHÔNG ÉP SỐ
$quantity = isset($_POST['quantity']) ? (int)$_POST['quantity'] : 0;

if (empty($product_id)) {
    echo json_encode(['success' => false, 'message' => 'ID sản phẩm không hợp lệ']);
    exit;
}
if ($quantity < 0) {
    echo json_encode(['success' => false, 'message' => 'Số lượng không hợp lệ']);
    exit;
}

try {
    // Lấy giỏ hàng
    $stmt = $pdo->prepare("SELECT MaGioHang FROM giohang WHERE MaNguoiDung = ? AND TrangThai = 0");
    $stmt->execute([$user_id]);
    $cart = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$cart) {
        echo json_encode(['success' => false, 'message' => 'Không tìm thấy giỏ hàng']);
        exit;
    }
    $cart_id = $cart['MaGioHang'];

    if ($quantity == 0) {
        // Nếu quantity = 0, xóa sản phẩm khỏi giỏ
        $stmt = $pdo->prepare("DELETE FROM giohang_chitiet WHERE MaGioHang = ? AND MaSanPham = ?");
        $stmt->execute([$cart_id, $product_id]);
        echo json_encode(['success' => true]);
        exit;
    }

    // Kiểm tra tồn kho
    $stmt = $pdo->prepare("SELECT SoLuongTon FROM khohang WHERE MaSanPham = ?");
    $stmt->execute([$product_id]);
    $stock = $stmt->fetchColumn();
    if ($stock === false) $stock = 0;
    if ($quantity > $stock) {
        echo json_encode(['success' => false, 'message' => 'Số lượng vượt quá tồn kho']);
        exit;
    }

    // Cập nhật số lượng
    $stmt = $pdo->prepare("UPDATE giohang_chitiet SET SoLuong = ? WHERE MaGioHang = ? AND MaSanPham = ?");
    $stmt->execute([$quantity, $cart_id, $product_id]);
    echo json_encode(['success' => true]);

} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>