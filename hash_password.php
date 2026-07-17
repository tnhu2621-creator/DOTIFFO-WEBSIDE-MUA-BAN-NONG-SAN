<?php
require_once 'config/database.php';

// Lấy tất cả người dùng
$stmt = $pdo->query("SELECT MaNguoiDung, MatKhau FROM nguoidung");
$users = $stmt->fetchAll(PDO::FETCH_ASSOC);

foreach ($users as $user) {
    // Nếu mật khẩu chưa băm (không bắt đầu bằng $2y$ hoặc độ dài < 20)
    if (strpos($user['MatKhau'], '$2y$') !== 0) {
        $hashed = password_hash($user['MatKhau'], PASSWORD_DEFAULT);
        $update = $pdo->prepare("UPDATE nguoidung SET MatKhau = ? WHERE MaNguoiDung = ?");
        $update->execute([$hashed, $user['MaNguoiDung']]);
        echo "Đã băm cho user ID: {$user['MaNguoiDung']}<br>";
    }
}
echo "Hoàn tất!";