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

if (empty($product_id)) {
    echo json_encode(['success' => false, 'message' => 'ID sản phẩm không hợp lệ']);
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

    // Xóa sản phẩm
    $stmt = $pdo->prepare("DELETE FROM giohang_chitiet WHERE MaGioHang = ? AND MaSanPham = ?");
    $stmt->execute([$cart_id, $product_id]);
    echo json_encode(['success' => true]);

} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>