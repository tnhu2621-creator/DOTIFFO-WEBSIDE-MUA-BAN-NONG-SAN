<?php
$host = 'localhost';
$dbname = 'dotifood';
$username = 'root';
$password = '';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
    
    // THÊM DÒNG NÀY VÀO ĐÂY:
    $conn = $pdo; 

} catch (PDOException $e) {
    header('Content-Type: application/json; charset=utf-8');
    http_response_code(500);
    die(json_encode(['error' => 'Không thể kết nối database: ' . $e->getMessage()]));
}
?>