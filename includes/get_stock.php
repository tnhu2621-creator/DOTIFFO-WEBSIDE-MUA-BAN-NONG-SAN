<?php
error_reporting(0);
ini_set('display_errors', 0);

header('Content-Type: application/json; charset=utf-8');

require_once '../config/database.php';

try {
    $query = "
        SELECT 
            sp.MaSanPham AS id,
            sp.TenSanPham AS name,
            dm.TenDanhMuc AS category,
            COALESCE(SUM(kh.SoLuongTon), 0) AS quantity,
            COALESCE(AVG(kh.GiaNhap), 0) AS GiaNhap
        FROM sanpham sp
        LEFT JOIN danhmuc dm ON sp.MaDanhMuc = dm.MaDanhMuc
        LEFT JOIN khohang kh ON sp.MaSanPham = kh.MaSanPham
        GROUP BY sp.MaSanPham
        ORDER BY sp.MaSanPham ASC
    ";
    $stmt = $pdo->prepare($query);
    $stmt->execute();
    $rows = $stmt->fetchAll();

    $data = array_map(function($row) {
        return [
            'id'       => $row['id'],
            'name'     => $row['name'],
            'category' => $row['category'] ?? 'Chưa phân loại',
            'quantity' => (int)$row['quantity'],
            'GiaNhap'  => (float)$row['GiaNhap']
        ];
    }, $rows);

    echo json_encode($data, JSON_UNESCAPED_UNICODE);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Lỗi truy vấn: ' . $e->getMessage()]);
}
?>