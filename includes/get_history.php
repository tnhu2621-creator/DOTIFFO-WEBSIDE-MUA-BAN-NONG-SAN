<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);
header('Content-Type: application/json; charset=utf-8');

require_once dirname(__DIR__) . '/config/database.php';

$id = $_GET['id'] ?? '';
if (empty($id)) {
    echo json_encode([]);
    exit;
}

try {
    $stmt = $pdo->prepare("
        SELECT 
            NgayThayDoi AS date, 
            CONCAT(LyDo, IF(GhiChu != '', CONCAT(': ', GhiChu), '')) AS `desc`, 
            SoLuongThayDoi AS `change`,
            IF(SoLuongThayDoi >= 0, 'positive', 'negative') AS type
        FROM lichsu
        WHERE MaSanPham = ?
        ORDER BY NgayThayDoi DESC
    ");
    $stmt->execute([$id]);
    $rows = $stmt->fetchAll();
    echo json_encode($rows);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Lỗi truy vấn: ' . $e->getMessage()]);
}