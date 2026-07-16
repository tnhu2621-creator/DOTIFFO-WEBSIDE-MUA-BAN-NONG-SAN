<?php
session_start();
require_once 'config/database.php';

header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Chưa đăng nhập']);
    exit;
}

$user_id = $_SESSION['user_id'];
$id = isset($_POST['id']) ? trim($_POST['id']) : '';

if (empty($id)) {
    echo json_encode(['success' => false, 'message' => 'Mã đơn hàng không hợp lệ']);
    exit;
}

try {
    // Kiểm tra đơn hàng thuộc về user và trạng thái có thể hủy
    $stmt = $pdo->prepare("SELECT TrangThai FROM donhang WHERE MaDonHang = ? AND MaNguoidung = ?");
    $stmt->execute([$id, $user_id]);
    $order = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$order) {
        echo json_encode(['success' => false, 'message' => 'Đơn hàng không tồn tại']);
        exit;
    }

    $currentStatus = $order['TrangThai'];
    if ($currentStatus !== 'Chờ xác nhận' && $currentStatus !== 'Đang xử lý') {
        echo json_encode(['success' => false, 'message' => 'Đơn hàng không thể hủy ở trạng thái hiện tại']);
        exit;
    }

    // Cập nhật trạng thái thành 'Đã hủy'
    $update = $pdo->prepare("UPDATE donhang SET TrangThai = 'Đã hủy' WHERE MaDonHang = ?");
    $update->execute([$id]);

    // (Tùy chọn) Có thể hoàn lại số lượng tồn kho nếu cần
    // ...

    echo json_encode(['success' => true, 'message' => 'Hủy đơn hàng thành công']);

} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>