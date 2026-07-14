<?php
// ===== KIỂM TRA ACTION =====
$action = $_GET['action'] ?? $_POST['action'] ?? '';

// Nếu có action => xử lý API
if ($action) {
    header('Content-Type: application/json; charset=utf-8');
    require_once 'config/database.php';

    // Hàm trả về JSON và thoát
    function response($success, $message, $data = null) {
        echo json_encode(['success' => $success, 'message' => $message, 'data' => $data], JSON_UNESCAPED_UNICODE);
        exit;
    }

    try {
        switch ($action) {
            // ===== LẤY DANH SÁCH NHÂN VIÊN (MaVaiTro = 222) =====
            case 'get_staff':
                $sql = "
                    SELECT 
                        nd.MaNguoiDung AS id,
                        nd.HoTen AS name,
                        nd.Email AS email,
                        nd.SoDienThoai AS phone,
                        vt.TenVaiTro AS role,
                        nd.TrangThai AS status
                    FROM nguoidung nd
                    LEFT JOIN vaitro vt ON nd.MaVaiTro = vt.MaVaiTro
                    WHERE nd.MaVaiTro = 222
                    ORDER BY nd.MaNguoiDung ASC
                ";
                $stmt = $pdo->prepare($sql);
                $stmt->execute();
                $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
                response(true, 'Thành công', $rows);
                break;

            // ===== THÊM NHÂN VIÊN =====
            case 'add_staff':
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

                $hashed = password_hash($password, PASSWORD_DEFAULT);
                $sql = "INSERT INTO nguoidung (HoTen, Email, SoDienThoai, MaVaiTro, TrangThai, MatKhau) 
                        VALUES (?, ?, ?, 222, ?, ?)";
                $stmt = $pdo->prepare($sql);
                $stmt->execute([$name, $email, $phone, $status, $hashed]);
                response(true, 'Thêm nhân viên thành công!');
                break;

            // ===== CẬP NHẬT NHÂN VIÊN =====
            case 'update_staff':
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

                $params = [$name, $email, $phone, $status, $id];
                $sql = "UPDATE nguoidung SET HoTen=?, Email=?, SoDienThoai=?, TrangThai=? WHERE MaNguoiDung=?";

                if (!empty($password)) {
                    if (strlen($password) < 6) {
                        response(false, 'Mật khẩu mới phải có ít nhất 6 ký tự.');
                    }
                    $hashed = password_hash($password, PASSWORD_DEFAULT);
                    $sql = "UPDATE nguoidung SET HoTen=?, Email=?, SoDienThoai=?, TrangThai=?, MatKhau=? WHERE MaNguoiDung=?";
                    $params = [$name, $email, $phone, $status, $hashed, $id];
                }

                $stmt = $pdo->prepare($sql);
                $stmt->execute($params);
                response(true, 'Cập nhật nhân viên thành công!');
                break;

            // ===== KHÓA / MỞ KHÓA =====
            case 'toggle_staff':
                $data = json_decode(file_get_contents('php://input'), true);
                $id = $data['id'] ?? 0;
                if (!$id) response(false, 'Thiếu ID.');

                $stmt = $pdo->prepare("SELECT TrangThai FROM nguoidung WHERE MaNguoiDung = ?");
                $stmt->execute([$id]);
                $current = $stmt->fetchColumn();
                if ($current === false) response(false, 'Không tìm thấy nhân viên.');

                $newStatus = ($current === 'Hoạt động') ? 'Tạm ngưng' : 'Hoạt động';
                $update = $pdo->prepare("UPDATE nguoidung SET TrangThai = ? WHERE MaNguoiDung = ?");
                $update->execute([$newStatus, $id]);
                response(true, 'Đã chuyển trạng thái', ['newStatus' => $newStatus]);
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

// ===== NẾU KHÔNG CÓ ACTION => HIỂN THỊ GIAO DIỆN =====
include 'admin/menu.php';
include 'admin/header.php';
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
    <link href="https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,400;14..32,500;14..32,600;14..32,700;14..32,800&display=swap" rel="stylesheet" />
    <link href="https://fonts.googleapis.com/css2?family=Bona+Nova:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet" />

    <link rel="stylesheet" href="css/QuanlyNhanvien.css" />
    <link rel="stylesheet" href="admin/menu.css" />
    <link rel="stylesheet" href="admin/header.css" />
</head>
<body>

    <div class="admin-wrapper">
        <div id="admin-layout-placeholder"></div>
        <main class="main-content">
            <div class="content-area">

                <!-- Stats -->
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-icon"><i class="fas fa-users"></i></div>
                        <div class="stat-info">
                            <h3 id="totalStaff">0</h3>
                            <p>Tổng nhân viên</p>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon"><i class="fas fa-user-tie"></i></div>
                        <div class="stat-info">
                            <h3 id="totalAdmin">0</h3>
                            <p>Quản trị viên</p>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon"><i class="fas fa-user"></i></div>
                        <div class="stat-info">
                            <h3 id="totalStaffCount">0</h3>
                            <p>Nhân viên</p>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon"><i class="fas fa-user-check"></i></div>
                        <div class="stat-info">
                            <h3 id="activeStaff">0</h3>
                            <p>Đang hoạt động</p>
                        </div>
                    </div>
                </div>

                <!-- Toolbar -->
                <div class="toolbar">
                    <button class="btn-primary btn-sm" id="btnAddStaff"><i class="fas fa-user-plus"></i> Thêm nhân viên</button>
                    <div class="toolbar-right">
                        <input type="text" id="searchInput" class="search-input" placeholder="Tìm kiếm nhân viên..." />
                        <!-- ĐÃ XÓA DROPDOWN LỌC VAI TRÒ -->
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
                        <h3>Danh sách nhân viên</h3>
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
    <div class="modal-overlay" id="staffModal">
        <div class="modal">
            <div class="modal-header">
                <h3 id="modalTitle">Thêm nhân viên</h3>
                <button class="modal-close" id="modalClose"><i class="fas fa-times"></i></button>
            </div>
            <div class="modal-body">
                <form id="staffForm">
                    <input type="hidden" id="editStaffId" value="" />
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
                            <label for="staffRole">Vai trò <span class="required">*</span></label>
                            <select id="staffRole" required>
                                <option value="Nhân viên">Nhân viên</option>
                                <option value="Quản lý">Quản lý</option>
                                <option value="Quản trị viên">Quản trị viên</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="staffStatus">Trạng thái <span class="required">*</span></label>
                            <select id="staffStatus" required>
                                <option value="Hoạt động">Hoạt động</option>
                                <option value="Tạm ngưng">Tạm ngưng</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-group" id="passwordGroup">
                        <label for="staffPassword">Mật khẩu <span class="required">*</span></label>
                        <input type="password" id="staffPassword" placeholder="Ít nhất 6 ký tự" />
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

    <!-- ===== MENU & HEADER JS ===== -->
    <script src="admin/menu.js"></script>
    <script src="admin/header.js"></script>
    <script src="js/QuanlyNhanvien.js"></script>
</body>
</html>