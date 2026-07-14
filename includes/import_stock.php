<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);
header('Content-Type: application/json; charset=utf-8');

require_once dirname(__DIR__) . '/config/database.php';

$input = json_decode(file_get_contents('php://input'), true);
$items = $input['items'] ?? [];

if (empty($items)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Không có sản phẩm nào']);
    exit;
}

try {
    $pdo->beginTransaction();
    foreach ($items as $item) {
        $id = $item['id'] ?? '';
        $qty = (int)($item['quantity'] ?? 0);
        $price = (float)($item['price'] ?? 0);
        if ($id && $qty > 0) {
            $sql = "INSERT INTO khohang (MaSanPham, SoLuongTon, NgayNhap, GiaNhap) 
                    VALUES (?, ?, NOW(), ?) 
                    ON DUPLICATE KEY UPDATE SoLuongTon = SoLuongTon + VALUES(SoLuongTon), 
                                            NgayNhap = VALUES(NgayNhap), 
                                            GiaNhap = VALUES(GiaNhap)";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([$id, $qty, $price]);

            $sqlHis = "INSERT INTO lichsu (MaSanPham, NgayThayDoi, SoLuongThayDoi, LyDo, GhiChu) 
                       VALUES (?, NOW(), ?, 'Nhập kho', ?)";
            $stmtHis = $pdo->prepare($sqlHis);
            $stmtHis->execute([$id, $qty, "Nhập $qty sản phẩm"]);
        }
    }
    $pdo->commit();
    echo json_encode(['success' => true, 'message' => 'Nhập kho thành công']);
} catch (PDOException $e) {
    $pdo->rollBack();
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Lỗi DB: ' . $e->getMessage()]);
}