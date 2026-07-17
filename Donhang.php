<?php
include 'config/database.php';

// ---- Helper ----
if (!function_exists('formatCurrency')) {
    function formatCurrency($amount) {
        return number_format($amount, 0, ',', '.') . ' ₫';
    }
}

if (!function_exists('getStatusClass')) {
    function getStatusClass($status) {
        $map = [
            'Chờ xác nhận' => 'status-warning',
            'Đang xử lý'   => 'status-info',
            'Đang giao'    => 'status-primary',
            'Đã giao'      => 'status-success',
            'Đã hủy'       => 'status-danger'
        ];
        return $map[$status] ?? 'status-secondary';
    }
}

try {
    if (isset($_GET['action']) || isset($_POST['action'])) {
        $action = $_GET['action'] ?? $_POST['action'];
        header('Content-Type: application/json');

        // 1. Thống kê
        if ($action === 'get_stats') {
            $stats = [
                'total'      => (int) $pdo->query("SELECT COUNT(*) FROM donhang")->fetchColumn(),
                'pending'    => (int) $pdo->query("SELECT COUNT(*) FROM donhang WHERE TrangThai = 'Chờ xác nhận'")->fetchColumn(),
                'processing' => (int) $pdo->query("SELECT COUNT(*) FROM donhang WHERE TrangThai = 'Đang xử lý'")->fetchColumn(),
                'shipped'    => (int) $pdo->query("SELECT COUNT(*) FROM donhang WHERE TrangThai = 'Đang giao'")->fetchColumn(),
                'delivered'  => (int) $pdo->query("SELECT COUNT(*) FROM donhang WHERE TrangThai = 'Đã giao'")->fetchColumn(),
                'cancelled'  => (int) $pdo->query("SELECT COUNT(*) FROM donhang WHERE TrangThai = 'Đã hủy'")->fetchColumn(),
            ];
            echo json_encode($stats);
            exit;
        }

        // 2. Danh sách đơn hàng
        if ($action === 'get_orders') {
            $status   = $_GET['status'] ?? 'all';
            $dateFrom = $_GET['dateFrom'] ?? '';
            $dateTo   = $_GET['dateTo'] ?? '';
            $page     = isset($_GET['page']) ? (int) $_GET['page'] : 1;
            $limit    = 10;
            $offset   = ($page - 1) * $limit;

            $where = [];
            $params = [];

            if ($status !== 'all') {
                $where[] = "d.TrangThai = ?";
                $params[] = $status;
            }
            if ($dateFrom) {
                $where[] = "d.NgayDat >= ?";
                $params[] = $dateFrom . ' 00:00:00';
            }
            if ($dateTo) {
                $where[] = "d.NgayDat <= ?";
                $params[] = $dateTo . ' 23:59:59';
            }

            $whereSql = count($where) ? "WHERE " . implode(" AND ", $where) : "";

            $countSql = "SELECT COUNT(*) FROM donhang d $whereSql";
            $stmt = $pdo->prepare($countSql);
            $stmt->execute($params);
            $total = (int) $stmt->fetchColumn();
            $totalPages = ceil($total / $limit);

            $sql = "SELECT d.*, n.HoTen AS customer_name 
                    FROM donhang d 
                    LEFT JOIN nguoidung n ON d.MaNguoiDung = n.MaNguoiDung
                    $whereSql 
                    ORDER BY d.NgayDat DESC 
                    LIMIT $limit OFFSET $offset";
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            $orders = $stmt->fetchAll(PDO::FETCH_ASSOC);

            $orders = array_map(function ($order) {
                $order['TongTienFormatted'] = formatCurrency($order['TongTien']);
                $order['NgayDatFormatted']  = date('d/m/Y H:i', strtotime($order['NgayDat']));
                $order['statusClass']       = getStatusClass($order['TrangThai']);
                return $order;
            }, $orders);

            echo json_encode([
                'orders'      => $orders,
                'total'       => $total,
                'totalPages'  => $totalPages,
                'currentPage' => $page
            ]);
            exit;
        }

        // 3. Cập nhật trạng thái (có xử lý tồn kho + lý do hủy)
        if ($action === 'update_status') {
            $orderId   = $_POST['orderId'];
            $newStatus = $_POST['newStatus'];
            $lyDoHuy   = isset($_POST['ly_do_huy']) ? trim($_POST['ly_do_huy']) : '';

            $validStatuses = ['Chờ xác nhận', 'Đang xử lý', 'Đang giao', 'Đã giao', 'Đã hủy'];
            if (!in_array($newStatus, $validStatuses)) {
                echo json_encode(['success' => false, 'message' => 'Trạng thái không hợp lệ']);
                exit;
            }

            // Nếu chọn hủy mà không có lý do
            if ($newStatus === 'Đã hủy' && empty($lyDoHuy)) {
                echo json_encode(['success' => false, 'message' => 'Vui lòng chọn lý do hủy.']);
                exit;
            }

            $stmt = $pdo->prepare("SELECT TrangThai FROM donhang WHERE MaDonHang = ?");
            $stmt->execute([$orderId]);
            $oldStatus = $stmt->fetchColumn();

            if ($oldStatus === false) {
                echo json_encode(['success' => false, 'message' => 'Đơn hàng không tồn tại']);
                exit;
            }

            if ($oldStatus === $newStatus) {
                echo json_encode(['success' => true, 'message' => 'Trạng thái không thay đổi']);
                exit;
            }

            $pdo->beginTransaction();
            try {
                // Cập nhật trạng thái và lý do hủy (nếu có)
                if ($newStatus === 'Đã hủy') {
                    $stmt = $pdo->prepare("UPDATE donhang SET TrangThai = ?, LyDoHuy = ? WHERE MaDonHang = ?");
                    $stmt->execute([$newStatus, $lyDoHuy, $orderId]);
                } else {
                    $stmt = $pdo->prepare("UPDATE donhang SET TrangThai = ? WHERE MaDonHang = ?");
                    $stmt->execute([$newStatus, $orderId]);
                }

                // Xử lý tồn kho
                $stmt = $pdo->prepare("SELECT MaSanPham, SoLuong FROM chitietdonhang WHERE MaDonHang = ?");
                $stmt->execute([$orderId]);
                $items = $stmt->fetchAll(PDO::FETCH_ASSOC);

                $updateStock = function($items, $operator) use ($pdo) {
                    foreach ($items as $item) {
                        $sql = "UPDATE khohang SET SoLuongTon = SoLuongTon $operator ? WHERE MaSanPham = ?";
                        $stmt = $pdo->prepare($sql);
                        $stmt->execute([$item['SoLuong'], $item['MaSanPham']]);
                    }
                };

                if ($oldStatus === 'Chờ xác nhận' && $newStatus === 'Đang xử lý') {
                    $updateStock($items, '-');
                } elseif (($oldStatus === 'Đang giao' || $oldStatus === 'Đang xử lý') && $newStatus === 'Đã hủy') {
                    $updateStock($items, '+');
                }

                $pdo->commit();
                echo json_encode(['success' => true, 'message' => 'Cập nhật trạng thái thành công']);
            } catch (Exception $e) {
                $pdo->rollBack();
                echo json_encode(['success' => false, 'message' => 'Lỗi: ' . $e->getMessage()]);
            }
            exit;
        }

        // 4. Chi tiết đơn hàng (có kèm sản phẩm + lý do hủy)
        if ($action === 'get_detail') {
            $orderId = $_GET['id'];
            $stmt = $pdo->prepare("SELECT d.*, n.HoTen AS customer_name 
                                   FROM donhang d 
                                   LEFT JOIN nguoidung n ON d.MaNguoiDung = n.MaNguoiDung 
                                   WHERE d.MaDonHang = ?");
            $stmt->execute([$orderId]);
            $order = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$order) {
                echo json_encode(['success' => false, 'message' => 'Không tìm thấy đơn hàng.']);
                exit;
            }

            $stmt = $pdo->prepare("
                SELECT sp.TenSanPham, ct.SoLuong, ct.DonGia
                FROM chitietdonhang ct
                JOIN sanpham sp ON ct.MaSanPham = sp.MaSanPham
                WHERE ct.MaDonHang = ?
            ");
            $stmt->execute([$orderId]);
            $products = $stmt->fetchAll(PDO::FETCH_ASSOC);

            $html = '<div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">';
            $html .= '<p><strong>Mã đơn:</strong> ' . htmlspecialchars($order['MaDonHang']) . '</p>';
            $html .= '<p><strong>Khách hàng:</strong> ' . htmlspecialchars($order['customer_name'] ?? 'N/A') . '</p>';
            $html .= '<p><strong>Ngày đặt:</strong> ' . date('d/m/Y H:i', strtotime($order['NgayDat'])) . '</p>';
            $html .= '<p><strong>Tổng tiền:</strong> ' . formatCurrency($order['TongTien']) . '</p>';
            $html .= '<p><strong>Phương thức TT:</strong> ' . htmlspecialchars($order['PhuongThucThanhToan'] ?? '') . '</p>';
            $html .= '<p><strong>Trạng thái:</strong> <span class="status ' . getStatusClass($order['TrangThai']) . '">' . htmlspecialchars($order['TrangThai']) . '</span></p>';
            $html .= '<p style="grid-column: span 2;"><strong>Địa chỉ giao:</strong> ' . htmlspecialchars($order['DiaChiGiaoHang'] ?? '') . '</p>';
            $html .= '<p style="grid-column: span 2;"><strong>Ghi chú:</strong> ' . htmlspecialchars($order['GhiChu'] ?? '') . '</p>';
            
            // HIỂN THỊ LÝ DO HỦY NẾU CÓ
            if (!empty($order['LyDoHuy'])) {
                $html .= '<p style="grid-column: span 2;"><strong>Lý do hủy:</strong> ' . htmlspecialchars($order['LyDoHuy']) . '</p>';
            }

            if (count($products) > 0) {
                $html .= '<div style="grid-column: span 2; margin-top:10px;">';
                $html .= '<h4 style="margin-bottom:8px;">🛒 Sản phẩm đã đặt</h4>';
                $html .= '<table style="width:100%; border-collapse:collapse; font-size:0.9rem;">';
                $html .= '<thead><tr style="background:#f1f1f1;"><th style="padding:6px 10px; border:1px solid #ddd; text-align:left;">Tên sản phẩm</th><th style="padding:6px 10px; border:1px solid #ddd; text-align:center;">SL</th><th style="padding:6px 10px; border:1px solid #ddd; text-align:right;">Đơn giá</th><th style="padding:6px 10px; border:1px solid #ddd; text-align:right;">Thành tiền</th></tr></thead>';
                $html .= '<tbody>';
                foreach ($products as $p) {
                    $thanhTien = $p['SoLuong'] * $p['DonGia'];
                    $html .= '<tr>';
                    $html .= '<td style="padding:6px 10px; border:1px solid #ddd;">' . htmlspecialchars($p['TenSanPham']) . '</td>';
                    $html .= '<td style="padding:6px 10px; border:1px solid #ddd; text-align:center;">' . $p['SoLuong'] . '</td>';
                    $html .= '<td style="padding:6px 10px; border:1px solid #ddd; text-align:right;">' . formatCurrency($p['DonGia']) . '</td>';
                    $html .= '<td style="padding:6px 10px; border:1px solid #ddd; text-align:right;">' . formatCurrency($thanhTien) . '</td>';
                    $html .= '</tr>';
                }
                $html .= '</tbody></table></div>';
            }

            $html .= '</div>';
            echo json_encode([
                'success'    => true,
                'html'       => $html,
                'TrangThai'  => $order['TrangThai']
            ]);
            exit;
        }

        // 5. In đơn hàng
        if ($action === 'print_order') {
            $orderId = $_GET['id'] ?? '';
            if (empty($orderId)) {
                die('Thiếu mã đơn hàng.');
            }

            $stmt = $pdo->prepare("SELECT d.*, n.HoTen AS customer_name, n.SoDienThoai, n.Email 
                                   FROM donhang d 
                                   LEFT JOIN nguoidung n ON d.MaNguoiDung = n.MaNguoiDung 
                                   WHERE d.MaDonHang = ?");
            $stmt->execute([$orderId]);
            $order = $stmt->fetch(PDO::FETCH_ASSOC);
            if (!$order) {
                die('Đơn hàng không tồn tại.');
            }

            if ($order['TrangThai'] !== 'Đang xử lý') {
                die('<h2 style="color:red;text-align:center;padding:50px;">Chỉ có thể in đơn khi ở trạng thái <strong>"Đang xử lý"</strong>.<br>Trạng thái hiện tại: ' . htmlspecialchars($order['TrangThai']) . '</h2>');
            }

            $stmt = $pdo->prepare("
                SELECT sp.TenSanPham, ct.SoLuong, ct.DonGia
                FROM chitietdonhang ct
                JOIN sanpham sp ON ct.MaSanPham = sp.MaSanPham
                WHERE ct.MaDonHang = ?
            ");
            $stmt->execute([$orderId]);
            $products = $stmt->fetchAll(PDO::FETCH_ASSOC);

            header('Content-Type: text/html; charset=utf-8');
            echo '<!DOCTYPE html>
            <html>
            <head><meta charset="UTF-8"><title>Đơn hàng #' . $orderId . '</title>
            <style>
                body { font-family: "Times New Roman", serif; font-size: 12pt; padding: 20px; }
                .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #008919; padding-bottom: 10px; }
                .header h1 { color: #008919; margin: 0; }
                .info { margin-bottom: 15px; }
                .info p { margin: 4px 0; }
                table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                th, td { border: 1px solid #aaa; padding: 6px 10px; text-align: left; }
                th { background: #008919; color: #fff; }
                .text-center { text-align: center; }
                .text-right { text-align: right; }
                .total { font-weight: bold; font-size: 14pt; margin-top: 10px; text-align: right; }
                .footer { margin-top: 30px; border-top: 1px solid #ccc; padding-top: 10px; font-size: 10pt; text-align: center; color: #666; }
                .status-badge { display: inline-block; padding: 2px 10px; border-radius: 4px; background: #d4edda; color: #155724; }
            </style>
            </head>
            <body>
                <div class="header">
                    <h1>📦 DOTIFOOD</h1>
                    <p style="margin:0;">Phiếu đóng gói - Đơn hàng #' . $orderId . '</p>
                </div>
                <div class="info">
                    <p><strong>Khách hàng:</strong> ' . htmlspecialchars($order['customer_name'] ?? 'N/A') . '</p>
                    <p><strong>Điện thoại:</strong> ' . htmlspecialchars($order['SoDienThoai'] ?? '') . '</p>
                    <p><strong>Địa chỉ giao:</strong> ' . htmlspecialchars($order['DiaChiGiaoHang'] ?? '') . '</p>
                    <p><strong>Ngày đặt:</strong> ' . date('d/m/Y H:i', strtotime($order['NgayDat'])) . '</p>
                    <p><strong>Trạng thái:</strong> <span class="status-badge">' . htmlspecialchars($order['TrangThai']) . '</span></p>
                </div>
                <table>
                    <thead><tr><th>Tên sản phẩm</th><th class="text-center">SL</th><th class="text-right">Đơn giá</th><th class="text-right">Thành tiền</th></tr></thead>
                    <tbody>';
            foreach ($products as $p) {
                $thanhTien = $p['SoLuong'] * $p['DonGia'];
                echo '<tr>';
                echo '<td>' . htmlspecialchars($p['TenSanPham']) . '</td>';
                echo '<td class="text-center">' . $p['SoLuong'] . '</td>';
                echo '<td class="text-right">' . formatCurrency($p['DonGia']) . '</td>';
                echo '<td class="text-right">' . formatCurrency($thanhTien) . '</td>';
                echo '</tr>';
            }
            echo '</tbody></table>';
            echo '<div class="total">Tổng cộng: ' . formatCurrency($order['TongTien']) . '</div>';
            echo '<div class="footer">* Đơn hàng được in từ hệ thống DOTIFOOD - ' . date('d/m/Y H:i') . '</div>';
            echo '</body></html>';
            exit;
        }

        echo json_encode(['error' => 'Invalid action']);
        exit;
    }
} catch (PDOException $e) {
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
    exit;
} catch (Exception $e) {
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Server error: ' . $e->getMessage()]);
    exit;
}

// ---- PHẦN HTML GIAO DIỆN ----
?>
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>DOTIFOOD - Quản lý đơn hàng</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,400;14..32,500;14..32,600;14..32,700;14..32,800&display=swap" rel="stylesheet" />
    <link rel="stylesheet" href="css/Donhang.css" />
    <link rel="stylesheet" href="admin/menu.css" />
    <link rel="stylesheet" href="admin/header.css" />
    <style>
        .btn-success { background: #28a745; color: #fff; border: none; padding: 6px 16px; border-radius: 4px; cursor: pointer; }
        .btn-success:hover { background: #218838; }
        .modal-footer { display: flex; justify-content: space-between; align-items: center; }
        #cancelReasonGroup { margin-top: 12px; padding-top: 12px; border-top: 1px solid #ddd; }
        #cancelReasonGroup .form-group { margin-bottom: 12px; }
        #cancelReasonGroup label { font-weight: 600; display: block; margin-bottom: 4px; }
        #cancelReasonGroup select, #cancelReasonGroup input { width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; }
    </style>
</head>
<body>
    <div class="admin-wrapper">
        <?php include 'admin/menu.php'; ?>
        <main class="main-content">
            <?php include 'admin/header.php'; ?>
            <div class="content-area">
                <!-- Stats -->
                <div class="stats-grid">
                    <div class="stat-card"><div class="stat-icon"><i class="fas fa-shopping-bag"></i></div><div class="stat-info"><h3 id="totalOrders">0</h3><p>Tổng đơn hàng</p></div></div>
                    <div class="stat-card"><div class="stat-icon"><i class="fas fa-clock"></i></div><div class="stat-info"><h3 id="pendingOrders">0</h3><p>Chờ xác nhận</p></div></div>
                    <div class="stat-card"><div class="stat-icon"><i class="fas fa-truck"></i></div><div class="stat-info"><h3 id="shippingOrders">0</h3><p>Đang giao</p></div></div>
                    <div class="stat-card"><div class="stat-icon"><i class="fas fa-check-circle"></i></div><div class="stat-info"><h3 id="completedOrders">0</h3><p>Đã giao</p></div></div>
                </div>
                <!-- Toolbar -->
                <div class="toolbar">
                    <div class="filter-tabs" id="filterTabs">
                        <button class="filter-tab active" data-status="all">Tất cả</button>
                        <button class="filter-tab" data-status="Chờ xác nhận">Chờ xác nhận</button>
                        <button class="filter-tab" data-status="Đang xử lý">Đang xử lý</button>
                        <button class="filter-tab" data-status="Đang giao">Đang giao</button>
                        <button class="filter-tab" data-status="Đã giao">Đã giao</button>
                        <button class="filter-tab" data-status="Đã hủy">Đã hủy</button>
                    </div>
                    <div class="toolbar-right">
                        <input type="date" id="dateFrom" class="date-input" />
                        <span style="color:var(--gray-600); font-size:0.9rem;">đến</span>
                        <input type="date" id="dateTo" class="date-input" />
                        <button class="btn-primary btn-sm" id="btnFilterDate"><i class="fas fa-filter"></i> Lọc</button>
                    </div>
                </div>
                <!-- Table -->
                <div class="table-card">
                    <div class="table-header"><h3>Danh sách đơn hàng</h3><span id="orderCount">0 đơn hàng</span></div>
                    <div class="table-wrapper">
                        <table>
                            <thead><tr><th>Mã đơn</th><th>Khách hàng</th><th>Địa chỉ</th><th>Tổng tiền</th><th>Trạng thái</th><th>Ngày đặt</th><th>Thao tác</th></tr></thead>
                            <tbody id="orderTableBody"></tbody>
                        </table>
                    </div>
                    <div class="pagination-container" id="paginationContainer">
                        <button class="page-btn" id="prevPage"><i class="fas fa-chevron-left"></i></button>
                        <span id="pageInfo">Trang 1 / 1</span>
                        <button class="page-btn" id="nextPage"><i class="fas fa-chevron-right"></i></button>
                    </div>
                </div>
            </div>
        </main>
    </div>

    <!-- Modal chi tiết -->
    <div class="modal-overlay" id="orderModal">
        <div class="modal modal-lg">
            <div class="modal-header">
                <h3 id="modalTitle">Chi tiết đơn hàng</h3>
                <button class="modal-close" id="modalClose"><i class="fas fa-times"></i></button>
            </div>
            <div class="modal-body">
                <div id="orderDetailContent"></div>
            </div>
            <div class="modal-footer">
                <button class="btn-success btn-sm" id="printOrderBtn"><i class="fas fa-print"></i> In đơn</button>
                <button class="btn-outline btn-sm" id="modalCloseBtn">Đóng</button>
            </div>
        </div>
    </div>

    <!-- Modal cập nhật trạng thái -->
    <div class="modal-overlay" id="statusModal">
        <div class="modal modal-sm">
            <div class="modal-header"><h3>Cập nhật trạng thái</h3><button class="modal-close" id="statusModalClose"><i class="fas fa-times"></i></button></div>
            <div class="modal-body">
                <form id="statusForm">
                    <input type="hidden" id="statusOrderId" value="" />
                    <div class="form-group"><label for="newStatus">Trạng thái mới</label>
                        <select id="newStatus" class="form-control"></select>
                    </div>

                    <!-- Lý do hủy (ẩn mặc định) -->
                    <div id="cancelReasonGroup" style="display:none;">
                        <div class="form-group">
                            <label for="cancelReason">Lý do hủy <span style="color:red;">*</span></label>
                            <select id="cancelReason" class="form-control">
                                <option value="">-- Chọn lý do --</option>
                                <option value="Đổi ý, không mua nữa">Đổi ý, không mua nữa</option>
                                <option value="Chọn sai sản phẩm">Chọn sai sản phẩm</option>
                                <option value="Giá cao, tìm được nơi rẻ hơn">Giá cao, tìm được nơi rẻ hơn</option>
                                <option value="Thời gian giao hàng quá lâu">Thời gian giao hàng quá lâu</option>
                                <option value="Địa chỉ giao hàng không đúng">Địa chỉ giao hàng không đúng</option>
                                <option value="Không liên hệ được với người nhận">Không liên hệ được với người nhận</option>
                                <option value="Lý do khác (ghi rõ bên dưới)">Lý do khác (ghi rõ bên dưới)</option>
                            </select>
                        </div>
                        <div class="form-group" id="otherReasonGroup" style="display:none;">
                            <label for="otherReason">Ghi rõ lý do khác</label>
                            <input type="text" id="otherReason" class="form-control" placeholder="Nhập lý do ..." />
                        </div>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button class="btn-outline btn-sm" id="statusModalCancel">Hủy</button>
                <button class="btn-primary btn-sm" id="statusModalSave"><i class="fas fa-save"></i> Cập nhật</button>
            </div>
        </div>
    </div>

    <!-- Toast -->
    <div class="toast" id="toast"><i class="fas fa-check-circle"></i><span id="toastMessage">Thành công!</span></div>

    <script src="js/Donhang.js"></script>
    <script src="admin/menu.js"></script>
    <script src="admin/header.js"></script>
</body>
</html>