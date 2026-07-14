<?php
session_start();
require_once 'config/database.php';

header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Chưa đăng nhập']);
    exit;
}

$user_id = $_SESSION['user_id'];

// LẤY TRỰC TIẾP product_id DƯỚI DẠNG CHUỖI, KHÔNG ÉP SỐ
$product_id = isset($_POST['product_id']) ? trim($_POST['product_id']) : '';
$quantity = isset($_POST['quantity']) ? (int)$_POST['quantity'] : 1;

if (empty($product_id)) {
    echo json_encode(['success' => false, 'message' => 'ID sản phẩm không hợp lệ (rỗng)']);
    exit;
}

try {
    // Kiểm tra tồn kho - sử dụng WHERE MaSanPham = :product_id (chuỗi)
    $stmt = $pdo->prepare("SELECT SoLuongTon FROM khohang WHERE MaSanPham = ?");
    $stmt->execute([$product_id]);
    $stock = $stmt->fetchColumn();
    if ($stock === false) $stock = 0;
    if ($stock <= 0) {
        echo json_encode(['success' => false, 'message' => 'Sản phẩm đã hết hàng']);
        exit;
    }

    // Lấy giỏ hàng
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

    // Kiểm tra sản phẩm đã có trong giỏ chưa
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
        $stmt = $pdo->prepare("INSERT INTO giohang_chitiet (MaGioHang, MaSanPham, SoLuong) VALUES (?, ?, ?)");
        $stmt->execute([$cart_id, $product_id, $quantity]);
    }

    echo json_encode(['success' => true]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>