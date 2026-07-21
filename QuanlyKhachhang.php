<?php
// ===== KIỂM TRA ACTION =====
$action = $_GET['action'] ?? $_POST['action'] ?? '';

if ($action) {
    header('Content-Type: application/json; charset=utf-8');
    
    // Đường dẫn tuyệt đối đến config
    require_once __DIR__ . '/config/database.php';
    
    // Kiểm tra kết nối
    if (!isset($pdo) || !$pdo) {
        echo json_encode(['success' => false, 'message' => 'Không thể kết nối database']);
        exit;
    }

    function response($success, $message, $data = null) {
        echo json_encode(['success' => $success, 'message' => $message, 'data' => $data], JSON_UNESCAPED_UNICODE);
        exit;
    }

    try {
        switch ($action) {
            // ===== LẤY DANH SÁCH KHÁCH HÀNG (MaVaiTro = 333) =====
            case 'get_customers':
                $sql = "
                    SELECT 
                        nd.MaNguoiDung AS id,
                        nd.HoTen AS name,
                        nd.Email AS email,
                        nd.SoDienThoai AS phone,
                        nd.TrangThai AS status,
                        nd.NgayTao AS created_at
                    FROM nguoidung nd
                    WHERE nd.MaVaiTro = 333
                    ORDER BY nd.MaNguoiDung ASC
                ";
                $stmt = $pdo->prepare($sql);
                $stmt->execute();
                $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                // Chuyển đổi TrangThai từ số sang chuỗi
                foreach ($rows as &$row) {
                    $row['status'] = ($row['status'] == 1) ? 'Hoạt động' : 'Tạm ngưng';
                }
                
                response(true, 'Thành công', $rows);
                break;

            // ===== THÊM KHÁCH HÀNG =====
            case 'add_customer':
                $data = json_decode(file_get_contents('php://input'), true);
                $name = $data['name'] ?? '';
                $email = $data['email'] ?? '';
                $phone = $data['phone'] ?? '';
                $status = $data['status'] ?? 'Hoạt động';
                $password = $data['password'] ?? '';

                if (empty($name) || empty($email) || empty($password) || strlen($password) < 6) {
                    response(false, 'Vui lòng nhập đầy đủ thông tin và mật khẩu ít nhất 6 ký tự.');
                }
                if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                    response(false, 'Email không hợp lệ.');
                }

                // Kiểm tra email đã tồn tại
                $check = $pdo->prepare("SELECT COUNT(*) FROM nguoidung WHERE Email = ?");
                $check->execute([$email]);
                if ($check->fetchColumn() > 0) {
                    response(false, 'Email đã được sử dụng.');
                }

                // Chuyển đổi trạng thái từ chuỗi sang số (1: Hoạt động, 0: Tạm ngưng)
                $statusInt = ($status === 'Hoạt động') ? 1 : 0;
                
                $hashed = password_hash($password, PASSWORD_DEFAULT);
                $sql = "INSERT INTO nguoidung (HoTen, Email, SoDienThoai, MaVaiTro, TrangThai, MatKhau) 
                        VALUES (?, ?, ?, 333, ?, ?)";
                $stmt = $pdo->prepare($sql);
                $stmt->execute([$name, $email, $phone, $statusInt, $hashed]);
                response(true, 'Thêm khách hàng thành công!');
                break;

            // ===== CẬP NHẬT KHÁCH HÀNG =====
            case 'update_customer':
                $data = json_decode(file_get_contents('php://input'), true);
                $id = $data['id'] ?? 0;
                $name = $data['name'] ?? '';
                $email = $data['email'] ?? '';
                $phone = $data['phone'] ?? '';
                $status = $data['status'] ?? '';
                $password = $data['password'] ?? '';

                if (!$id || empty($name) || empty($email)) {
                    response(false, 'Dữ liệu không hợp lệ.');
                }
                if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                    response(false, 'Email không hợp lệ.');
                }

                // Kiểm tra email đã tồn tại (trừ chính nó)
                $check = $pdo->prepare("SELECT COUNT(*) FROM nguoidung WHERE Email = ? AND MaNguoiDung != ?");
                $check->execute([$email, $id]);
                if ($check->fetchColumn() > 0) {
                    response(false, 'Email đã được sử dụng bởi tài khoản khác.');
                }

                $statusInt = ($status === 'Hoạt động') ? 1 : 0;

                $params = [$name, $email, $phone, $statusInt, $id];
                $sql = "UPDATE nguoidung SET HoTen=?, Email=?, SoDienThoai=?, TrangThai=? WHERE MaNguoiDung=?";

                if (!empty($password)) {
                    if (strlen($password) < 6) {
                        response(false, 'Mật khẩu mới phải có ít nhất 6 ký tự.');
                    }
                    $hashed = password_hash($password, PASSWORD_DEFAULT);
                    $sql = "UPDATE nguoidung SET HoTen=?, Email=?, SoDienThoai=?, TrangThai=?, MatKhau=? WHERE MaNguoiDung=?";
                    $params = [$name, $email, $phone, $statusInt, $hashed, $id];
                }

                $stmt = $pdo->prepare($sql);
                $stmt->execute($params);
                response(true, 'Cập nhật khách hàng thành công!');
                break;

            // ===== KHÓA / MỞ KHÓA =====
            case 'toggle_customer':
                $data = json_decode(file_get_contents('php://input'), true);
                $id = $data['id'] ?? 0;
                if (!$id) response(false, 'Thiếu ID.');

                $stmt = $pdo->prepare("SELECT TrangThai FROM nguoidung WHERE MaNguoiDung = ? AND MaVaiTro = 333");
                $stmt->execute([$id]);
                $current = $stmt->fetchColumn();
                if ($current === false) response(false, 'Không tìm thấy khách hàng.');

                // Chuyển đổi: 1 -> 0, 0 -> 1
                $newStatusInt = ($current == 1) ? 0 : 1;
                $update = $pdo->prepare("UPDATE nguoidung SET TrangThai = ? WHERE MaNguoiDung = ?");
                $update->execute([$newStatusInt, $id]);
                
                $newStatusText = ($newStatusInt == 1) ? 'Hoạt động' : 'Tạm ngưng';
                response(true, 'Đã chuyển trạng thái', ['newStatus' => $newStatusText]);
                break;

            default:
                response(false, 'Action không hợp lệ.');
        }
    } catch (PDOException $e) {
        http_response_code(500);
        response(false, 'Lỗi database: ' . $e->getMessage());
    }
    exit;
}

// ===== ĐÃ XÓA 2 DÒNG INCLUDE SAI VỊ TRÍ TẠI ĐÂY =====
?>
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>DOTIFOOD - Quản lý khách hàng</title>

    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,400;14..32,500;14..32,600;14..32,700;14..32,800&display=swap" rel="stylesheet" />
    <link href="https://fonts.googleapis.com/css2?family=Bona+Nova:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet" />

    <link rel="stylesheet" href="css/QuanlyKhachhang.css" />
    <link rel="stylesheet" href="admin/menu.css" />
    <link rel="stylesheet" href="admin/header.css" />
</head>
<body>

    <div class="admin-wrapper">
        
        <!-- ĐÃ THÊM: Thay thế placeholder bằng menu chuẩn -->
        <?php include 'admin/menu.php'; ?>

        <main class="main-content">
            
            <!-- ĐÃ THÊM: Đưa header vào đúng vị trí đầu khu vực main-content -->
            <?php include 'admin/header.php'; ?>

            <div class="content-area">

                <!-- Stats -->
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-icon"><i class="fas fa-users"></i></div>
                        <div class="stat-info">
                            <h3 id="totalCustomers">0</h3>
                            <p>Tổng khách hàng</p>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon"><i class="fas fa-user-check"></i></div>
                        <div class="stat-info">
                            <h3 id="activeCustomers">0</h3>
                            <p>Đang hoạt động</p>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon"><i class="fas fa-user-slash"></i></div>
                        <div class="stat-info">
                            <h3 id="inactiveCustomers">0</h3>
                            <p>Tạm ngưng</p>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon"><i class="fas fa-user-plus"></i></div>
                        <div class="stat-info">
                            <h3 id="newToday">0</h3>
                            <p>Mới hôm nay</p>
                        </div>
                    </div>
                </div>

                <!-- Toolbar -->
                <div class="toolbar">
                    <button class="btn-primary btn-sm" id="btnAddCustomer"><i class="fas fa-user-plus"></i> Thêm khách hàng</button>
                    <div class="toolbar-right">
                        <input type="text" id="searchInput" class="search-input" placeholder="Tìm kiếm khách hàng..." />
                        <select class="filter-select" id="filterStatus">
                            <option value="all">Tất cả trạng thái</option>
                            <option value="Hoạt động">Hoạt động</option>
                            <option value="Tạm ngưng">Tạm ngưng</option>
                        </select>
                    </div>
                </div>

                <!-- Bảng -->
                <div class="table-card">
                    <div class="table-header">
                        <h3>Danh sách khách hàng</h3>
                        <span id="customerCount">0 khách hàng</span>
                    </div>
                    <div class="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Họ tên</th>
                                    <th>Email</th>
                                    <th>Số điện thoại</th>
                                    <th>Trạng thái</th>
                                    <th>Thao tác</th>
                                </tr>
                            </thead>
                            <tbody id="customerTableBody">
                                <!-- JS render -->
                            </tbody>
                        </table>
                    </div>
                    <div class="pagination-container">
                        <button class="page-btn" id="prevPage"><i class="fas fa-chevron-left"></i></button>
                        <span id="pageInfo">Trang 1 / 1</span>
                        <button class="page-btn" id="nextPage"><i class="fas fa-chevron-right"></i></button>
                    </div>
                </div>

            </div>
        </main>
    </div>

    <!-- ===== MODAL ===== -->
    <div class="modal-overlay" id="customerModal">
        <div class="modal">
            <div class="modal-header">
                <h3 id="modalTitle">Thêm khách hàng</h3>
                <button class="modal-close" id="modalClose"><i class="fas fa-times"></i></button>
            </div>
            <div class="modal-body">
                <form id="customerForm">
                    <input type="hidden" id="editCustomerId" value="" />
                    <div class="form-group">
                        <label for="customerName">Họ tên <span class="required">*</span></label>
                        <input type="text" id="customerName" placeholder="Nhập họ tên" required />
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="customerEmail">Email <span class="required">*</span></label>
                            <input type="email" id="customerEmail" placeholder="email@example.com" required />
                        </div>
                        <div class="form-group">
                            <label for="customerPhone">Số điện thoại</label>
                            <input type="tel" id="customerPhone" placeholder="0909 123 456" />
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="customerStatus">Trạng thái <span class="required">*</span></label>
                        <select id="customerStatus" required>
                            <option value="Hoạt động">Hoạt động</option>
                            <option value="Tạm ngưng">Tạm ngưng</option>
                        </select>
                    </div>
                    <div class="form-group" id="passwordGroup">
                        <label for="customerPassword">Mật khẩu <span class="required">*</span></label>
                        <input type="password" id="customerPassword" placeholder="Ít nhất 6 ký tự" />
                        <small style="color:var(--gray-400); font-size:0.8rem;">Nhập mật khẩu khi thêm mới. Bỏ trống nếu không muốn thay đổi khi sửa.</small>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button class="btn-outline btn-sm" id="modalCancel">Hủy</button>
                <button class="btn-primary btn-sm" id="modalSave"><i class="fas fa-save"></i> Lưu</button>
            </div>
        </div>
    </div>

    <!-- ===== TOAST ===== -->
    <div class="toast" id="toast">
        <i class="fas fa-check-circle"></i>
        <span id="toastMessage">Thành công!</span>
    </div>

    <script src="admin/menu.js"></script>
    <script src="admin/header.js"></script>
    <script src="js/QuanlyKhachhang.js"></script>
</body>
</html>