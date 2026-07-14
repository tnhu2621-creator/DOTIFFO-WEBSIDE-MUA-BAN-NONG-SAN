<?php
session_start();
require_once 'config/database.php';

$response = ['success' => false, 'data' => []];

if (isset($_SESSION['user_id'])) {
    $user_id = $_SESSION['user_id'];
    try {
        $stmt = $pdo->prepare("
            SELECT sp.MaSanPham AS id, sp.TenSanPham AS name, sp.GiaBan AS price, gc.SoLuong AS quantity, CONCAT('images/', sp.HinhAnh) AS icon
            FROM giohang_chitiet gc
            JOIN giohang g ON gc.MaGioHang = g.MaGioHang
            JOIN sanpham sp ON gc.MaSanPham = sp.MaSanPham
            WHERE g.MaNguoiDung = ? AND g.TrangThai = 0
        ");
        $stmt->execute([$user_id]);
        $items = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $response['success'] = true;
        $response['data'] = $items;
    } catch (Exception $e) {
        $response['message'] = $e->getMessage();
    }
} else {
    $response['message'] = 'Chưa đăng nhập';
}

header('Content-Type: application/json');
echo json_encode($response);
?>