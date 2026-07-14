<?php
session_start();
require_once 'config/database.php';

header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Chưa đăng nhập']);
    exit;
}

$user_id = $_SESSION['user_id'];
$product_id = isset($_POST['product_id']) ? (int)$_POST['product_id'] : 0;
$quantity = isset($_POST['quantity']) ? (int)$_POST['quantity'] : 1;

if ($product_id <= 0) {
    echo json_encode(['success' => false, 'message' => 'ID sản phẩm không hợp lệ']);
    exit;
}

try {
    // Lấy giỏ hàng đang hoạt động
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