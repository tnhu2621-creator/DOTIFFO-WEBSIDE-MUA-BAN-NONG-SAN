<?php
session_start();
require_once 'config/database.php';

// Kiểm tra đăng nhập và quyền admin (MaVaiTro = 111)
if (!isset($_SESSION['user_id']) || $_SESSION['user_role'] != 111) {
    header('Location: Dangnhap.php');
    exit();
}

$user_id = $_SESSION['user_id'];
$message = '';
$messageType = '';

// ---- XỬ LÝ AJAX CẬP NHẬT AVATAR ----
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['update_avatar'])) {
    header('Content-Type: application/json');
    $avatarData = $_POST['avatar'] ?? '';
    if (empty($avatarData)) {
        echo json_encode(['success' => false, 'message' => 'Không có dữ liệu ảnh']);
        exit;
    }

    $uploadDir = 'images/avatar/';
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }

    $ext = 'png';
    $filename = 'admin_avatar_' . $user_id . '_' . time() . '.' . $ext;
    $filepath = $uploadDir . $filename;

    $data = explode(',', $avatarData);
    if (count($data) === 2) {
        $imageData = base64_decode($data[1]);
        if (file_put_contents($filepath, $imageData)) {
            $avatarPath = $filepath;
            $stmt = $pdo->prepare("UPDATE nguoidung SET HinhAnh = ? WHERE MaNguoiDung = ?");
            if ($stmt->execute([$avatarPath, $user_id])) {
                $_SESSION['user_avatar'] = $avatarPath;
                session_write_close();
                echo json_encode(['success' => true, 'avatar' => $avatarPath]);
            } else {
                echo json_encode(['success' => false, 'message' => 'Lỗi cập nhật database']);
            }
        } else {
            echo json_encode(['success' => false, 'message' => 'Lỗi lưu file']);
        }
    } else {
        echo json_encode(['success' => false, 'message' => 'Dữ liệu ảnh không hợp lệ']);
    }
    exit;
}

// ---- Lấy thông tin admin ----
$stmt = $pdo->prepare("
    SELECT MaNguoiDung, TenDangNhap, HoTen, Email, SoDienThoai, DiaChi, HinhAnh, MatKhau
    FROM nguoidung
    WHERE MaNguoiDung = ? AND MaVaiTro = 111
");
$stmt->execute([$user_id]);
$admin = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$admin) {
    session_destroy();
    header('Location: Dangnhap.php');
    exit();
}

// ---- Xử lý cập nhật thông tin cá nhân ----
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['update_profile'])) {
    $hoTen = trim($_POST['fullname'] ?? '');
    $email = trim($_POST['email'] ?? '');
    $soDienThoai = trim($_POST['phone'] ?? '');
    $hinhAnh = trim($_POST['avatar'] ?? '');

    if (empty($hoTen) || empty($email)) {
        $message = 'Họ tên và email không được để trống.';
        $messageType = 'error';
    } elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $message = 'Email không hợp lệ.';
        $messageType = 'error';
    } else {
        $sql = "UPDATE nguoidung SET HoTen = ?, Email = ?, SoDienThoai = ?";
        $params = [$hoTen, $email, $soDienThoai];
        if (!empty($hinhAnh) && $hinhAnh !== $admin['HinhAnh']) {
            $sql .= ", HinhAnh = ?";
            $params[] = $hinhAnh;
        }
        $sql .= " WHERE MaNguoiDung = ?";
        $params[] = $user_id;

        $stmt = $pdo->prepare($sql);
        if ($stmt->execute($params)) {
            $_SESSION['user_name'] = $hoTen;
            if (!empty($hinhAnh)) {
                $_SESSION['user_avatar'] = $hinhAnh;
            }
            $admin = array_merge($admin, [
                'HoTen' => $hoTen,
                'Email' => $email,
                'SoDienThoai' => $soDienThoai,
                'HinhAnh' => $hinhAnh ?: $admin['HinhAnh']
            ]);
            $message = 'Cập nhật thông tin thành công!';
            $messageType = 'success';
        } else {
            $message = 'Có lỗi xảy ra, vui lòng thử lại.';
            $messageType = 'error';
        }
    }
}

// ---- Xử lý đổi mật khẩu ----
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['change_password'])) {
    $current = $_POST['currentPassword'] ?? '';
    $new = $_POST['newPassword'] ?? '';
    $confirm = $_POST['confirmPassword'] ?? '';

    if (empty($current) || empty($new) || empty($confirm)) {
        $message = 'Vui lòng điền đầy đủ các trường.';
        $messageType = 'error';
    } elseif (strlen($new) < 6) {
        $message = 'Mật khẩu mới phải có ít nhất 6 ký tự.';
        $messageType = 'error';
    } elseif (!password_verify($current, $admin['MatKhau'])) {
        $message = 'Mật khẩu hiện tại không đúng.';
        $messageType = 'error';
    } elseif ($new !== $confirm) {
        $message = 'Mật khẩu xác nhận không khớp.';
        $messageType = 'error';
    } elseif (password_verify($new, $admin['MatKhau'])) {
        $message = 'Mật khẩu mới không được trùng với mật khẩu hiện tại.';
        $messageType = 'error';
    } else {
        $hashed = password_hash($new, PASSWORD_DEFAULT);
        $stmt = $pdo->prepare("UPDATE nguoidung SET MatKhau = ? WHERE MaNguoiDung = ?");
        if ($stmt->execute([$hashed, $user_id])) {
            $message = 'Đổi mật khẩu thành công!';
            $messageType = 'success';
            $admin['MatKhau'] = $hashed;
        } else {
            $message = 'Có lỗi xảy ra, vui lòng thử lại.';
            $messageType = 'error';
        }
    }
}

// === HIỂN THỊ AVATAR VỚI TIMESTAMP ===
$avatarSrc = '';
if (!empty($admin['HinhAnh']) && file_exists($admin['HinhAnh'])) {
    $avatarSrc = htmlspecialchars($admin['HinhAnh']) . '?v=' . filemtime($admin['HinhAnh']);
} else {
    $avatarSrc = 'https://ui-avatars.com/api/?name=' . urlencode($admin['HoTen']) . '&background=008919&color=fff&size=120';
}
?>
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>DOTIFOOD - Thông tin tài khoản</title>

    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,400;14..32,500;14..32,600;14..32,700;14..32,800&display=swap" rel="stylesheet" />
    <link rel="stylesheet" href="css/ThongtintaikhoanAd.css" />
</head>
<body>

    <!-- ===== BREADCRUMB + NÚT QUAY LẠI ===== -->
    <div class="breadcrumb-bar">
        <div class="container breadcrumb-container">
            <a href="Tongquan.php" class="btn-back">
                <i class="fas fa-arrow-left"></i> Quay lại
            </a>
            <nav class="breadcrumb">
                <a href="Tongquan.php">Trang chủ</a>
                <span>/</span>
                <span>Thông tin tài khoản</span>
            </nav>
        </div>
    </div>

    <!-- ===== MAIN CONTENT ===== -->
    <div class="container account-container">
        <div class="page-header">
            <h2><i class="fas fa-user-cog"></i> Thông tin tài khoản</h2>
            <p>Quản lý thông tin cá nhân và bảo mật tài khoản</p>
        </div>

        <?php if (!empty($message)): ?>
            <div class="form-message <?= $messageType ?>" style="display:block; margin-bottom:20px;">
                <?= htmlspecialchars($message) ?>
            </div>
        <?php endif; ?>

        <div class="account-tabs">
            <button class="tab-btn active" data-tab="profile"><i class="fas fa-user"></i> Thông tin cá nhân</button>
            <button class="tab-btn" data-tab="password"><i class="fas fa-lock"></i> Đổi mật khẩu</button>
        </div>

        <!-- Tab Thông tin cá nhân -->
        <div class="tab-content active" id="tab-profile">
            <div class="account-card">
                <div class="account-card-header">
                    <h3><i class="fas fa-address-card"></i> Thông tin cá nhân</h3>
                    <span class="status-badge status-active"><i class="fas fa-check-circle"></i> Đã xác thực</span>
                </div>

                <div class="avatar-section">
                    <div class="avatar-wrapper" id="avatarWrapper">
                        <img id="avatarPreview" src="<?= $avatarSrc ?>" alt="Avatar" />
                        <div class="avatar-overlay">
                            <i class="fas fa-camera"></i>
                            <span>Đổi ảnh</span>
                        </div>
                    </div>
                    <div class="avatar-info">
                        <p class="avatar-name"><?= htmlspecialchars($admin['HoTen']) ?></p>
                        <p class="avatar-role"><span class="role-badge role-admin">Quản trị viên</span></p>
                        <button class="btn-outline btn-sm" id="btnChangeAvatar"><i class="fas fa-images"></i> Chọn avatar</button>
                    </div>
                </div>

                <form id="profileForm" class="account-form" method="POST">
                    <input type="hidden" name="update_profile" value="1">
                    <input type="hidden" name="avatar" id="avatarHidden" value="<?= htmlspecialchars($admin['HinhAnh'] ?? '') ?>">
                    <div class="form-row">
                        <div class="form-group">
                            <label for="fullname">Họ và tên <span class="required">*</span></label>
                            <input type="text" id="fullname" name="fullname" value="<?= htmlspecialchars($admin['HoTen']) ?>" required />
                        </div>
                        <div class="form-group">
                            <label for="email">Email <span class="required">*</span></label>
                            <input type="email" id="email" name="email" value="<?= htmlspecialchars($admin['Email']) ?>" required />
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="phone">Số điện thoại</label>
                            <input type="tel" id="phone" name="phone" value="<?= htmlspecialchars($admin['SoDienThoai'] ?? '') ?>" />
                        </div>
                        <div class="form-group">
                            <label for="username">Tên đăng nhập</label>
                            <input type="text" id="username" value="<?= htmlspecialchars($admin['TenDangNhap']) ?>" readonly disabled />
                            <small style="color:var(--gray-400); font-size:0.75rem;">Tên đăng nhập không thể thay đổi</small>
                        </div>
                    </div>
                    <div class="form-actions">
                        <button type="submit" class="btn-primary"><i class="fas fa-save"></i> Cập nhật thông tin</button>
                    </div>
                    <div id="profileMessage" class="form-message"></div>
                </form>
            </div>
        </div>

        <!-- Tab Đổi mật khẩu -->
        <div class="tab-content" id="tab-password">
            <div class="account-card">
                <div class="account-card-header">
                    <h3><i class="fas fa-key"></i> Đổi mật khẩu</h3>
                </div>
                <form id="passwordForm" class="account-form" method="POST">
                    <input type="hidden" name="change_password" value="1">
                    <div class="form-group">
                        <label for="currentPassword">Mật khẩu hiện tại <span class="required">*</span></label>
                        <div class="password-wrapper">
                            <input type="password" id="currentPassword" name="currentPassword" placeholder="Nhập mật khẩu hiện tại" required />
                            <button type="button" class="toggle-password" data-target="currentPassword"><i class="fas fa-eye"></i></button>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="newPassword">Mật khẩu mới <span class="required">*</span></label>
                            <div class="password-wrapper">
                                <input type="password" id="newPassword" name="newPassword" placeholder="Ít nhất 6 ký tự" required minlength="6" />
                                <button type="button" class="toggle-password" data-target="newPassword"><i class="fas fa-eye"></i></button>
                            </div>
                        </div>
                        <div class="form-group">
                            <label for="confirmPassword">Xác nhận mật khẩu mới <span class="required">*</span></label>
                            <div class="password-wrapper">
                                <input type="password" id="confirmPassword" name="confirmPassword" placeholder="Nhập lại mật khẩu mới" required />
                                <button type="button" class="toggle-password" data-target="confirmPassword"><i class="fas fa-eye"></i></button>
                            </div>
                        </div>
                    </div>
                    <div class="form-actions">
                        <button type="submit" class="btn-primary"><i class="fas fa-key"></i> Đổi mật khẩu</button>
                    </div>
                    <div id="passwordMessage" class="form-message"></div>
                </form>
            </div>
        </div>
    </div>

    <!-- ===== MODAL CHỌN AVATAR MẪU ===== -->
    <div class="modal-overlay" id="avatarModal">
        <div class="modal modal-avatar">
            <div class="modal-header">
                <h3><i class="fas fa-images"></i> Chọn avatar</h3>
                <button class="modal-close" id="avatarModalClose"><i class="fas fa-times"></i></button>
            </div>
            <div class="modal-body">
                <p style="color:var(--gray-600); margin-bottom:16px;">Chọn một avatar mẫu hoặc tải ảnh lên của riêng bạn.</p>
                <div class="avatar-grid" id="avatarGrid"></div>
                <div style="text-align:center; margin-top:16px; padding-top:16px; border-top:1px solid var(--gray-200);">
                    <button class="btn-outline btn-sm" id="btnUploadAvatar"><i class="fas fa-upload"></i> Tải ảnh lên</button>
                    <input type="file" id="avatarUploadInput" accept="image/*" style="display:none;" />
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn-outline btn-sm" id="avatarModalCancel">Đóng</button>
            </div>
        </div>
    </div>

    <!-- ===== TOAST ===== -->
    <div class="toast" id="toast">
        <i class="fas fa-check-circle"></i>
        <span id="toastMessage">Thành công!</span>
    </div>

    <script src="js/ThongtintaikhoanAd.js"></script>
</body>
</html>