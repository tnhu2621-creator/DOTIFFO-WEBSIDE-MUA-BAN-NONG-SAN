<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);
header('Content-Type: application/json; charset=utf-8');

require_once dirname(__DIR__) . '/config/database.php';

$input = json_decode(file_get_contents('php://input'), true);
$id = $input['id'] ?? '';
$newStock = (int)($input['newStock'] ?? 0);
$reason = $input['reason'] ?? 'Kiểm kê';
$note = $input['note'] ?? '';

if (empty($id)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Thiếu mã sản phẩm']);
    exit;
}

try {
    $pdo->beginTransaction();
    
    // Lấy tồn cũ
    $stmt = $pdo->prepare("SELECT SoLuongTon FROM khohang WHERE MaSanPham = ?");
    $stmt->execute([$id]);
    $oldStock = (int)$stmt->fetchColumn();
    $change = $newStock - $oldStock;

    // Cập nhật/insert tồn kho
    $sql = "INSERT INTO khohang (MaSanPham, SoLuongTon, NgayNhap) 
            VALUES (?, ?, NOW()) 
            ON DUPLICATE KEY UPDATE SoLuongTon = VALUES(SoLuongTon), NgayNhap = VALUES(NgayNhap)";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$id, $newStock]);

    // Ghi lịch sử
    $sqlHis = "INSERT INTO lichsu (MaSanPham, NgayThayDoi, SoLuongThayDoi, LyDo, GhiChu) 
               VALUES (?, NOW(), ?, ?, ?)";
    $stmtHis = $pdo->prepare($sqlHis);
    $stmtHis->execute([$id, $change, $reason, $note]);

    $pdo->commit();
    echo json_encode(['success' => true, 'message' => 'Cập nhật thành công']);
} catch (PDOException $e) {
    $pdo->rollBack();
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Lỗi DB: ' . $e->getMessage()]);
}