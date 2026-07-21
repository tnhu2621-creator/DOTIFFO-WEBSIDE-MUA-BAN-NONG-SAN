<?php
// ===== KIỂM TRA ACTION (API ENDPOINT) =====
$action = $_GET['action'] ?? $_POST['action'] ?? '';

if ($action) {
    header('Content-Type: application/json; charset=utf-8');
    require_once 'config/database.php';

    function response($success, $message, $data = null) {
        echo json_encode(['success' => $success, 'message' => $message, 'data' => $data], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // ===== HÀM TỰ ĐỘNG TÍNH MÃ 5 CHỮ SỐ (00001, 00002...) =====
    function getNextStaffId($pdo) {
        // Chỉ lọc lấy MaNguoiDung là thuần số và có độ dài <= 5 ký tự (Bỏ qua các mã rác như 422038646)
        $sql = "SELECT MaNguoiDung 
                FROM nguoidung 
                WHERE MaNguoiDung REGEXP '^[0-9]+$' AND LENGTH(MaNguoiDung) <= 5 
                ORDER BY CAST(MaNguoiDung AS UNSIGNED) DESC 
                LIMIT 1";
        $stmt = $pdo->query($sql);
        $lastId = $stmt->fetchColumn();

        $lastNum = $lastId ? (int)$lastId : 0;
        return sprintf("%05d", $lastNum + 1);
    }

    try {
        switch ($action) {
            // ===== LẤY DANH SÁCH NHÂN VIÊN (MÃ VAI TRÒ 222) =====
            case 'get_staff':
                $sql = "
                    SELECT 
                        nd.MaNguoiDung AS id,
                        nd.MaNguoiDung AS display_id,
                        nd.HoTen AS name,
                        nd.Email AS email,
                        nd.SoDienThoai AS phone,
                        nd.MaVaiTro AS role_id,
                        COALESCE(vt.TenVaiTro, 'Nhân viên') AS role,
                        nd.TrangThai AS status
                    FROM nguoidung nd
                    LEFT JOIN vaitro vt ON nd.MaVaiTro = vt.MaVaiTro
                    WHERE nd.MaVaiTro = 222
                    ORDER BY LENGTH(nd.MaNguoiDung) ASC, nd.MaNguoiDung ASC
                ";
                $stmt = $pdo->prepare($sql);
                $stmt->execute();
                $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
                response(true, 'Thành công', $rows);
                break;

            // ===== LẤY MÃ ID TỰ ĐỘNG TIẾP THEO =====
            case 'get_next_id':
                $nextId = getNextStaffId($pdo);
                response(true, 'Thành công', ['next_id' => $nextId]);
                break;

            // ===== THÊM NHÂN VIÊN MỚI =====
            case 'add_staff':
                $data = json_decode(file_get_contents('php://input'), true);
                $staffCode = trim($data['staff_code'] ?? '');
                $name = trim($data['name'] ?? '');
                $email = trim($data['email'] ?? '');
                $phone = trim($data['phone'] ?? '');
                $status = $data['status'] ?? 1;
                $password = $data['password'] ?? '';
                $role_id = 222;

                // Nếu tên đăng nhập để trống thì tự động lấy Email làm Tên đăng nhập
                $username = !empty($data['username']) ? trim($data['username']) : $email;

                if (empty($name) || empty($email) || empty($password) || strlen($password) < 6) {
                    response(false, 'Vui lòng điền đầy đủ thông tin và mật khẩu từ 6 ký tự trở lên.');
                }
                if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                    response(false, 'Định dạng Email không hợp lệ.');
                }

                // Tự động sinh mã 5 chữ số nếu chưa có hoặc bị rỗng
                if (empty($staffCode)) {
                    $staffCode = getNextStaffId($pdo);
                }

                $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
                
                // INSERT ĐẦY ĐỦ MaNguoiDung VÀ TenDangnhap
                $sql = "INSERT INTO nguoidung (MaNguoiDung, HoTen, Email, SoDienThoai, TenDangnhap, MaVaiTro, TrangThai, MatKhau) 
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
                $stmt = $pdo->prepare($sql);
                $stmt->execute([$staffCode, $name, $email, $phone, $username, $role_id, $status, $hashedPassword]);
                
                response(true, 'Thêm nhân viên thành công!');
                break;

            // ===== CẬP NHẬT NHÂN VIÊN =====
            case 'update_staff':
                $data = json_decode(file_get_contents('php://input'), true);
                $id = $data['id'] ?? '';
                $name = trim($data['name'] ?? '');
                $email = trim($data['email'] ?? '');
                $phone = trim($data['phone'] ?? '');
                $status = $data['status'] ?? 1;
                $password = $data['password'] ?? '';
                $role_id = 222;

                if (empty($id) || empty($name) || empty($email)) {
                    response(false, 'Dữ liệu không hợp lệ.');
                }
                if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                    response(false, 'Định dạng Email không hợp lệ.');
                }

                $params = [$name, $email, $phone, $role_id, $status, $id];
                $sql = "UPDATE nguoidung SET HoTen=?, Email=?, SoDienThoai=?, MaVaiTro=?, TrangThai=? 
                        WHERE MaNguoiDung=? AND MaVaiTro=222";

                if (!empty($password)) {
                    if (strlen($password) < 6) {
                        response(false, 'Mật khẩu mới phải từ 6 ký tự trở lên.');
                    }
                    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
                    $sql = "UPDATE nguoidung SET HoTen=?, Email=?, SoDienThoai=?, MaVaiTro=?, TrangThai=?, MatKhau=? 
                            WHERE MaNguoiDung=? AND MaVaiTro=222";
                    $params = [$name, $email, $phone, $role_id, $status, $hashedPassword, $id];
                }

                $stmt = $pdo->prepare($sql);
                $stmt->execute($params);
                response(true, 'Cập nhật nhân viên thành công!');
                break;

            // ===== KHÓA / MỞ KHÓA TÀI KHOẢN =====
            case 'toggle_staff':
                $data = json_decode(file_get_contents('php://input'), true);
                $id = $data['id'] ?? '';
                if (empty($id)) response(false, 'Thiếu ID nhân viên.');

                $stmt = $pdo->prepare("SELECT TrangThai FROM nguoidung WHERE MaNguoiDung = ? AND MaVaiTro = 222");
                $stmt->execute([$id]);
                $currentStatus = $stmt->fetchColumn();

                if ($currentStatus === false) response(false, 'Không tìm thấy nhân viên.');

                $newStatus = ($currentStatus == 1 || $currentStatus === 'Hoạt động') ? 0 : 1;
                $updateStmt = $pdo->prepare("UPDATE nguoidung SET TrangThai = ? WHERE MaNguoiDung = ? AND MaVaiTro = 222");
                $updateStmt->execute([$newStatus, $id]);
                response(true, 'Thay đổi trạng thái thành công!', ['newStatus' => $newStatus]);
                break;

            default:
                response(false, 'Hành động không hợp lệ.');
        }
    } catch (PDOException $e) {
        http_response_code(500);
        response(false, 'Lỗi CSDL: ' . $e->getMessage());
    }
    exit;
}
?>
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>DOTIFOOD - Quản lý nhân viên</title>

    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />

    <link rel="stylesheet" href="css/QuanlyNhanvien.css" />
    <link rel="stylesheet" href="admin/menu.css" />
    <link rel="stylesheet" href="admin/header.css" />
</head>
<body>

    <div class="admin-wrapper">
        <?php include 'admin/menu.php'; ?>

        <main class="main-content">
            <?php include 'admin/header.php'; ?>

            <div class="content-area">

                <!-- Thống kê nhanh -->
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-icon"><i class="fas fa-users"></i></div>
                        <div class="stat-info">
                            <h3 id="totalStaff">0</h3>
                            <p>Tổng nhân viên</p>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon"><i class="fas fa-user-check"></i></div>
                        <div class="stat-info">
                            <h3 id="activeStaff">0</h3>
                            <p>Đang hoạt động</p>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon"><i class="fas fa-user-slash"></i></div>
                        <div class="stat-info">
                            <h3 id="inactiveStaff">0</h3>
                            <p>Tạm ngưng</p>
                        </div>
                    </div>
                </div>

                <!-- Thanh công cụ -->
                <div class="toolbar">
                    <button class="btn-primary btn-sm" id="btnAddStaff"><i class="fas fa-user-plus"></i> Thêm nhân viên</button>
                    <div class="toolbar-right">
                        <input type="text" id="searchInput" class="search-input" placeholder="Tìm tên hoặc email..." />
                        <select class="filter-select" id="filterStatus">
                            <option value="all">Tất cả trạng thái</option>
                            <option value="1">Hoạt động</option>
                            <option value="0">Tạm ngưng</option>
                        </select>
                    </div>
                </div>

                <!-- Bảng danh sách -->
                <div class="table-card">
                    <div class="table-header">
                        <h3>Danh sách nhân viên (Mã 222)</h3>
                        <span id="staffCount">0 nhân viên</span>
                    </div>
                    <div class="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Họ tên</th>
                                    <th>Email</th>
                                    <th>Số điện thoại</th>
                                    <th>Vai trò</th>
                                    <th>Trạng thái</th>
                                    <th>Thao tác</th>
                                </tr>
                            </thead>
                            <tbody id="staffTableBody">
                                <!-- Dữ liệu được tải từ JS -->
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

    <!-- ===== MODAL THÊM / SỬA NHÂN VIÊN ===== -->
    <div class="modal-overlay" id="staffModal">
        <div class="modal">
            <div class="modal-header">
                <h3 id="modalTitle">Thêm nhân viên</h3>
                <button class="modal-close" id="modalClose"><i class="fas fa-times"></i></button>
            </div>
            <div class="modal-body">
                <form id="staffForm" onsubmit="return false;">
                    <input type="hidden" id="editStaffId" value="" />
                    
                    <!-- Mã ID tự động -->
                    <div class="form-group">
                        <label for="staffCode">Mã ID (Tự động)</label>
                        <input type="text" id="staffCode" placeholder="Tự động sinh mã..." readonly style="background:#f3f4f6; cursor:not-allowed; font-weight:600; color:#10b981;" />
                    </div>

                    <div class="form-group">
                        <label for="staffName">Họ tên <span class="required">*</span></label>
                        <input type="text" id="staffName" placeholder="Nhập họ tên" required />
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="staffEmail">Email <span class="required">*</span></label>
                            <input type="email" id="staffEmail" placeholder="email@example.com" required />
                        </div>
                        <div class="form-group">
                            <label for="staffPhone">Số điện thoại</label>
                            <input type="tel" id="staffPhone" placeholder="0909 123 456" />
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Vai trò</label>
                            <input type="text" value="Nhân viên (Mã 222)" disabled style="background:#f3f4f6; cursor:not-allowed;" />
                        </div>
                        <div class="form-group">
                            <label for="staffStatus">Trạng thái <span class="required">*</span></label>
                            <select id="staffStatus" required>
                                <option value="1">Hoạt động</option>
                                <option value="0">Tạm ngưng</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-group" id="passwordGroup">
                        <label for="staffPassword">Mật khẩu <span class="required">*</span></label>
                        <input type="password" id="staffPassword" placeholder="Ít nhất 6 ký tự" />
                        <small id="passwordNote" style="color:#6b7280; font-size:0.8rem; margin-top:4px; display:block;">Nhập mật khẩu khi thêm mới. Bỏ trống nếu không muốn thay đổi khi sửa.</small>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button class="btn-outline btn-sm" id="modalCancel">Hủy</button>
                <button class="btn-primary btn-sm" id="modalSave"><i class="fas fa-save"></i> Lưu</button>
            </div>
        </div>
    </div>

    <!-- ===== TOAST THÔNG BÁO ===== -->
    <div class="toast" id="toast">
        <i class="fas fa-check-circle"></i>
        <span id="toastMessage">Thành công!</span>
    </div>

    <script src="admin/menu.js"></script>
    <script src="admin/header.js"></script>
    <script src="js/QuanlyNhanvien.js"></script>
</body>
</html>