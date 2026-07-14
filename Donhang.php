<?php
include 'config/database.php';
include 'includes/functions.php';

// ---- Xử lý các action AJAX ----
if (isset($_GET['action']) || isset($_POST['action'])) {
    $action = $_GET['action'] ?? $_POST['action'];
    header('Content-Type: application/json');

    // 1. Lấy thống kê
    if ($action === 'get_stats') {
        $stats = [
            'total'     => (int) $pdo->query("SELECT COUNT(*) FROM donhang")->fetchColumn(),
            'pending'   => (int) $pdo->query("SELECT COUNT(*) FROM donhang WHERE TrangThai = 'Chờ xác nhận'")->fetchColumn(),
            'processing'=> (int) $pdo->query("SELECT COUNT(*) FROM donhang WHERE TrangThai = 'Đang xử lý'")->fetchColumn(),
            'shipped'   => (int) $pdo->query("SELECT COUNT(*) FROM donhang WHERE TrangThai = 'Đang giao'")->fetchColumn(),
            'delivered' => (int) $pdo->query("SELECT COUNT(*) FROM donhang WHERE TrangThai = 'Đã giao'")->fetchColumn(),
            'cancelled' => (int) $pdo->query("SELECT COUNT(*) FROM donhang WHERE TrangThai = 'Đã hủy'")->fetchColumn(),
        ];
        echo json_encode($stats);
        exit;
    }

    // 2. Lấy danh sách đơn hàng (có lọc + phân trang)
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
            $where[] = "TrangThai = ?";
            $params[] = $status;
        }
        if ($dateFrom) {
            $where[] = "NgayDat >= ?";
            $params[] = $dateFrom . ' 00:00:00';
        }
        if ($dateTo) {
            $where[] = "NgayDat <= ?";
            $params[] = $dateTo . ' 23:59:59';
        }

        $whereSql = count($where) ? "WHERE " . implode(" AND ", $where) : "";

        // Đếm tổng
        $countSql = "SELECT COUNT(*) FROM donhang $whereSql";
        $stmt = $pdo->prepare($countSql);
        $stmt->execute($params);
        $total = (int) $stmt->fetchColumn();
        $totalPages = ceil($total / $limit);

        // Lấy danh sách (join với bảng nguoidung nếu có)
        $sql = "SELECT d.*, n.HoTen AS customer_name 
                FROM donhang d 
                LEFT JOIN nguoidung n ON d.MaNguoiDung = n.MaNguoiDung
                $whereSql 
                ORDER BY d.NgayDat DESC 
                LIMIT $limit OFFSET $offset";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $orders = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Định dạng dữ liệu trả về
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

    // 3. Cập nhật trạng thái đơn hàng
    if ($action === 'update_status') {
        $orderId   = $_POST['orderId'];
        $newStatus = $_POST['newStatus'];
        // Chỉ cho phép các trạng thái hợp lệ
        $validStatuses = ['Chờ xác nhận', 'Đang xử lý', 'Đang giao', 'Đã giao', 'Đã hủy'];
        if (!in_array($newStatus, $validStatuses)) {
            echo json_encode(['success' => false, 'message' => 'Trạng thái không hợp lệ']);
            exit;
        }
        $stmt = $pdo->prepare("UPDATE donhang SET TrangThai = ? WHERE MaDonHang = ?");
        $success = $stmt->execute([$newStatus, $orderId]);
        echo json_encode(['success' => $success]);
        exit;
    }

    // 4. Lấy chi tiết đơn hàng (hiển thị modal)
    if ($action === 'get_detail') {
        $orderId = $_GET['id'];
        $stmt = $pdo->prepare("SELECT d.*, n.HoTen AS customer_name 
                               FROM donhang d 
                               LEFT JOIN nguoidung n ON d.MaNguoiDung = n.MaNguoiDung 
                               WHERE d.MaDonHang = ?");
        $stmt->execute([$orderId]);
        $order = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($order) {
            $html = '<div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">';
            $html .= '<p><strong>Mã đơn:</strong> ' . htmlspecialchars($order['MaDonHang']) . '</p>';
            $html .= '<p><strong>Khách hàng:</strong> ' . htmlspecialchars($order['customer_name'] ?? 'N/A') . '</p>';
            $html .= '<p><strong>Ngày đặt:</strong> ' . date('d/m/Y H:i', strtotime($order['NgayDat'])) . '</p>';
            $html .= '<p><strong>Tổng tiền:</strong> ' . formatCurrency($order['TongTien']) . '</p>';
            $html .= '<p><strong>Phương thức TT:</strong> ' . htmlspecialchars($order['PhuongThucThanhToan'] ?? '') . '</p>';
            $html .= '<p><strong>Trạng thái:</strong> <span class="status ' . getStatusClass($order['TrangThai']) . '">' . htmlspecialchars($order['TrangThai']) . '</span></p>';
            $html .= '<p style="grid-column: span 2;"><strong>Địa chỉ giao:</strong> ' . htmlspecialchars($order['DiaChiGiaoHang'] ?? '') . '</p>';
            $html .= '<p style="grid-column: span 2;"><strong>Ghi chú:</strong> ' . htmlspecialchars($order['GhiChu'] ?? '') . '</p>';
            $html .= '</div>';
            echo json_encode(['success' => true, 'html' => $html]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Không tìm thấy đơn hàng.']);
        }
        exit;
    }

    echo json_encode(['error' => 'Invalid action']);
    exit;
}
?>
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>DOTIFOOD - Quản lý đơn hàng</title>

    <!-- Font Awesome -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css" />
    <!-- Google Font -->
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,400;14..32,500;14..32,600;14..32,700;14..32,800&display=swap" rel="stylesheet" />
    <link href="https://fonts.googleapis.com/css2?family=Bona+Nova:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet" />

    <link rel="stylesheet" href="css/Donhang.css" />
    <link rel="stylesheet" href="admin/menu.css" />
    <link rel="stylesheet" href="admin/header.css" />

    <style>
        /* Bổ sung style nếu file CSS chưa có */
        .status { padding: 4px 10px; border-radius: 20px; font-size: 0.85rem; font-weight: 600; }
        .status-success { background: #d4edda; color: #155724; }
        .status-warning { background: #fff3cd; color: #856404; }
        .status-danger { background: #f8d7da; color: #721c24; }
        .status-info { background: #d1ecf1; color: #0c5460; }
        .status-secondary { background: #e2e3e5; color: #383d41; }
        .table-actions a { margin: 0 5px; color: #2c7be0; }
        .table-actions a:hover { color: #1a5bb5; }
        .table-actions .text-danger { color: #dc3545; }
        .table-actions .text-danger:hover { color: #bd2130; }

        /* Modal */
        .modal-overlay {
            display: none;
            position: fixed;
            top:0; left:0; width:100%; height:100%;
            background: rgba(0,0,0,0.5);
            justify-content: center;
            align-items: center;
            z-index: 9999;
        }
        .modal-overlay.active { display: flex; }
        .modal {
            background: #fff;
            border-radius: 8px;
            max-width: 600px;
            width: 90%;
            max-height: 90vh;
            overflow-y: auto;
            box-shadow: 0 4px 20px rgba(0,0,0,0.2);
        }
        .modal-lg { max-width: 700px; }
        .modal-sm { max-width: 400px; }
        .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 16px 20px;
            border-bottom: 1px solid #eee;
        }
        .modal-header h3 { margin:0; }
        .modal-close {
            background: none;
            border: none;
            font-size: 1.5rem;
            cursor: pointer;
            color: #999;
        }
        .modal-close:hover { color: #333; }
        .modal-body { padding: 20px; }
        .modal-footer {
            padding: 12px 20px;
            border-top: 1px solid #eee;
            text-align: right;
        }
        .btn-primary { background: #2c7be0; color: #fff; border: none; padding: 6px 16px; border-radius: 4px; cursor: pointer; }
        .btn-primary:hover { background: #1a5bb5; }
        .btn-outline { background: transparent; color: #2c7be0; border: 1px solid #2c7be0; padding: 6px 16px; border-radius: 4px; cursor: pointer; }
        .btn-outline:hover { background: #e9f0ff; }
        .btn-sm { font-size: 0.85rem; padding: 4px 12px; }
        .form-group { margin-bottom: 15px; }
        .form-group label { display: block; margin-bottom: 5px; font-weight: 600; }
        .form-control { width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; }

        /* Toast */
        .toast {
            position: fixed;
            bottom: 30px;
            right: 30px;
            background: #28a745;
            color: #fff;
            padding: 12px 24px;
            border-radius: 6px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            display: none;
            align-items: center;
            gap: 10px;
            z-index: 99999;
        }
        .toast.show { display: flex; }
        .toast.error { background: #dc3545; }
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
                    <div class="stat-card">
                        <div class="stat-icon"><i class="fas fa-shopping-bag"></i></div>
                        <div class="stat-info">
                            <h3 id="totalOrders">0</h3>
                            <p>Tổng đơn hàng</p>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon"><i class="fas fa-clock"></i></div>
                        <div class="stat-info">
                            <h3 id="pendingOrders">0</h3>
                            <p>Chờ xác nhận</p>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon"><i class="fas fa-truck"></i></div>
                        <div class="stat-info">
                            <h3 id="shippingOrders">0</h3>
                            <p>Đang giao</p>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon"><i class="fas fa-check-circle"></i></div>
                        <div class="stat-info">
                            <h3 id="completedOrders">0</h3>
                            <p>Đã giao</p>
                        </div>
                    </div>
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

                <!-- Bảng -->
                <div class="table-card">
                    <div class="table-header">
                        <h3>Danh sách đơn hàng</h3>
                        <span id="orderCount">0 đơn hàng</span>
                    </div>
                    <div class="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th>Mã đơn</th>
                                    <th>Khách hàng</th>
                                    <th>Địa chỉ</th>
                                    <th>Tổng tiền</th>
                                    <th>Trạng thái</th>
                                    <th>Ngày đặt</th>
                                    <th>Thao tác</th>
                                </tr>
                            </thead>
                            <tbody id="orderTableBody">
                                <!-- Render bằng JS -->
                            </tbody>
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
                <button class="btn-outline btn-sm" id="modalCloseBtn">Đóng</button>
            </div>
        </div>
    </div>

    <!-- Modal cập nhật trạng thái -->
    <div class="modal-overlay" id="statusModal">
        <div class="modal modal-sm">
            <div class="modal-header">
                <h3>Cập nhật trạng thái</h3>
                <button class="modal-close" id="statusModalClose"><i class="fas fa-times"></i></button>
            </div>
            <div class="modal-body">
                <form id="statusForm">
                    <input type="hidden" id="statusOrderId" value="" />
                    <div class="form-group">
                        <label for="newStatus">Trạng thái mới</label>
                        <select id="newStatus" class="form-control">
                            <option value="Chờ xác nhận">Chờ xác nhận</option>
                            <option value="Đang xử lý">Đang xử lý</option>
                            <option value="Đang giao">Đang giao</option>
                            <option value="Đã giao">Đã giao</option>
                            <option value="Đã hủy">Đã hủy</option>
                        </select>
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
    <div class="toast" id="toast">
        <i class="fas fa-check-circle"></i>
        <span id="toastMessage">Thành công!</span>
    </div>

    <!-- Nếu bạn có file JS riêng, có thể comment dòng dưới -->
    <script src="js/Donhang.js"></script>
    <script src="admin/menu.js"></script>
    <script src="admin/header.js"></script>
</body>
</html>