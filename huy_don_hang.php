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
$lyDo = isset($_POST['ly_do']) ? trim($_POST['ly_do']) : '';

if (empty($id)) {
    echo json_encode(['success' => false, 'message' => 'Mã đơn hàng không hợp lệ']);
    exit;
}

// Bắt buộc phải có lý do
if (empty($lyDo)) {
    echo json_encode(['success' => false, 'message' => 'Vui lòng chọn lý do hủy']);
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

    // Cập nhật trạng thái và lưu lý do hủy
    $update = $pdo->prepare("UPDATE donhang SET TrangThai = 'Đã hủy', LyDoHuy = ? WHERE MaDonHang = ?");
    $update->execute([$lyDo, $id]);

    // Nếu đơn đang ở trạng thái "Đang xử lý" → cộng lại tồn kho
    if ($currentStatus === 'Đang xử lý') {
        $stmt = $pdo->prepare("SELECT MaSanPham, SoLuong FROM chitietdonhang WHERE MaDonHang = ?");
        $stmt->execute([$id]);
        $items = $stmt->fetchAll(PDO::FETCH_ASSOC);
        foreach ($items as $item) {
            $updateStock = $pdo->prepare("UPDATE khohang SET SoLuongTon = SoLuongTon + ? WHERE MaSanPham = ?");
            $updateStock->execute([$item['SoLuong'], $item['MaSanPham']]);
        }
    }

    echo json_encode(['success' => true, 'message' => 'Hủy đơn hàng thành công']);

} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>