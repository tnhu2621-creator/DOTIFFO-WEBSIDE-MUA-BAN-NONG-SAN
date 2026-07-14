<?php
// Tắt hiển thị lỗi để không làm hỏng JSON
error_reporting(0);
ini_set('display_errors', 0);

header('Content-Type: application/json; charset=utf-8');

require_once '../config/database.php';

try {
    $query = "
        SELECT 
            sp.MaSanPham AS id,
            sp.TenSanPham AS name,
            dm.TenDanhMuc AS category,           -- Lấy tên danh mục từ bảng danhmuc
            NguongCanhBao AS reorderLevel,
            COALESCE(kh.SoLuongTon, 0) AS quantity
        FROM sanpham sp
        LEFT JOIN danhmuc dm ON sp.MaDanhMuc = dm.MaDanhMuc   -- JOIN để lấy tên
        LEFT JOIN khohang kh ON sp.MaSanPham = kh.MaSanPham
    ";
    $stmt = $pdo->prepare($query);
    $stmt->execute();
    $rows = $stmt->fetchAll();

    $data = array_map(function($row) {
        return [
            'id'   => $row['id'],
            'name' => $row['name'],
            'category' => $row['category'] ?? 'Chưa phân loại', // phòng trường hợp null
            'quantity' => (int)$row['quantity'],
            'reorderLevel' => (int)($row['reorderLevel'] ?? 10)
        ];
    }, $rows);

    echo json_encode($data, JSON_UNESCAPED_UNICODE);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Lỗi truy vấn: ' . $e->getMessage()]);
}
?>