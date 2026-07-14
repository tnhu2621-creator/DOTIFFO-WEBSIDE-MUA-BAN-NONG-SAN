<?php
error_reporting(0);
ini_set('display_errors', 0);

header('Content-Type: application/json; charset=utf-8');
require_once '../config/database.php'; // Đường dẫn tới file database.php dùng PDO của bạn

try {
    // Lấy tham số lọc từ URL (nếu không có thì để rỗng)
    $danhmuc = $_GET['danhmuc'] ?? '';
    $trangthai = $_GET['trangthai'] ?? '';

    // Câu truy vấn gốc
    $query = "
        SELECT 
            sp.MaSanPham AS id,
            sp.TenSanPham AS name,
            sp.MaDanhMuc AS category,
            NguongCanhBao AS reorderLevel,
            COALESCE(kh.SoLuongTon, 0) AS quantity
        FROM sanpham sp
        LEFT JOIN khohang kh ON sp.MaSanPham = kh.MaSanPham
        WHERE 1=1
    ";

    $params = [];

    // Nếu người dùng chọn một danh mục cụ thể
    if (!empty($danhmuc)) {
        $query .= " AND sp.MaDanhMuc = :danhmuc";
        $params[':danhmuc'] = $danhmuc;
    }

    // Xử lý logic lọc Trạng thái dựa trên Số lượng tồn và Ngưỡng cảnh báo
    if (!empty($trangthai)) {
        if ($trangthai === 'Hết hàng') {
            $query .= " AND COALESCE(kh.SoLuongTon, 0) = 0";
        } elseif ($trangthai === 'Sắp hết hàng') {
            $query .= " AND COALESCE(kh.SoLuongTon, 0) > 0 AND COALESCE(kh.SoLuongTon, 0) <= sp.NguongCanhBao";
        } elseif ($trangthai === 'Đủ hàng') {
            $query .= " AND COALESCE(kh.SoLuongTon, 0) > sp.NguongCanhBao";
        }
    }

    $stmt = $pdo->prepare($query);
    $stmt->execute($params);
    $rows = $stmt->fetchAll();

    // Định dạng lại dữ liệu để trả về cho JavaScript nhận diện trạng thái dạng chữ giống giao diện
    $data = array_map(function($row) {
        $qty = (int)$row['quantity'];
        $level = (int)($row['reorderLevel'] ?? 10);
        
        // Tính toán trạng thái dạng chuỗi giống giao diện hiển thị
        $status = "Đủ hàng";
        if ($qty == 0) {
            $status = "Hết hàng";
        } elseif ($qty <= $level) {
            $status = "Sắp hết hàng";
        }

        return [
            'id'           => $row['id'],
            'name'         => $row['name'],
            'category'     => $row['category'],
            'quantity'     => $qty,
            'reorderLevel' => $level,
            'status'       => $status
        ];
    }, $rows);

    echo json_encode($data, JSON_UNESCAPED_UNICODE);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Lỗi kết nối hoặc truy vấn: ' . $e->getMessage()]);
}
?>