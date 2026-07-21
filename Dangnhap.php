<?php
session_start();
require_once 'config/database.php';

// Xử lý logout khi có tham số ?logout=1
if (isset($_GET['logout'])) {
    session_destroy();
    header('Location: Dangnhap.php');
    exit;
}

// Nếu đã đăng nhập, chuyển hướng theo vai trò
if (isset($_SESSION['user_id'])) {
    $role = $_SESSION['user_role'] ?? 0;
    if ($role == 111) {
        header('Location: Tongquan.php');
    } else {
        header('Location: index.php');
    }
    exit;
}

$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = trim($_POST['username'] ?? '');
    $password = $_POST['password'] ?? '';

    if (empty($username) || empty($password)) {
        $error = 'Vui lòng nhập tên đăng nhập và mật khẩu.';
    } else {
        try {
            // Lấy thêm cột HinhAnh
            $sql = "SELECT MaNguoiDung, HoTen, Email, TenDangNhap, MatKhau, TrangThai, MaVaiTro, HinhAnh 
                    FROM nguoidung 
                    WHERE TenDangNhap = :username OR Email = :username";
            
            $stmt = $pdo->prepare($sql);
            $stmt->execute([':username' => $username]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$user) {
                $error = 'Tài khoản hoặc mật khẩu không đúng.';
            } 
            elseif ($user['TrangThai'] != 1) {
                $error = 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.';
            } 
            elseif (!password_verify($password, $user['MatKhau'])) {
                $error = 'Tài khoản hoặc mật khẩu không đúng.';
            } 
            else {
                // Đăng nhập thành công
                $_SESSION['user_id'] = $user['MaNguoiDung'];
                $_SESSION['user_name'] = $user['HoTen'];
                $_SESSION['user_email'] = $user['Email'];
                $_SESSION['username'] = $user['TenDangNhap'];
                $_SESSION['user_role'] = $user['MaVaiTro'];
                $_SESSION['user_avatar'] = $user['HinhAnh'] ?? ''; // Lưu avatar

                // Ghi session ngay lập tức
                session_write_close();

                // Ghi nhớ đăng nhập (cookie)
                if (isset($_POST['remember'])) {
                    setcookie('username', $username, time() + 86400 * 30, '/');
                }

                // Phân quyền chuyển hướng
                if ($user['MaVaiTro'] == 111) {
                    header('Location: Tongquan.php');
                } else {
                    header('Location: index.php');
                }
                exit;
            }
        } catch (PDOException $e) {
            $error = 'Lỗi hệ thống, vui lòng thử lại sau.';
        }
    }
}
?>
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>DOTIFOOD - Đăng nhập</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,400;14..32,500;14..32,600;14..32,700;14..32,800&display=swap" rel="stylesheet" />
    <link rel="stylesheet" href="css/Dangnhap.css" />
</head>
<body>
    <section class="login-page">
        <div class="container login-container">
            <div class="login-card">
                <div class="login-header">
                    <i class="fas fa-sign-in-alt"></i>
                    <h2>Đăng nhập</h2>
                    <p>Chào mừng bạn quay trở lại DOTIFOOD</p>
                </div>

                <?php if ($error): ?>
                    <div class="form-message error">
                        <i class="fas fa-exclamation-circle"></i> <?= htmlspecialchars($error) ?>
                    </div>
                <?php endif; ?>

                <form id="loginForm" class="login-form" method="POST" action="">
                    <div class="form-group">
                        <label for="loginUsername"><i class="fas fa-user"></i> Tên đăng nhập hoặc Email</label>
                        <input type="text" id="loginUsername" name="username" placeholder="Nhập tên đăng nhập hoặc email" required
                               value="<?= htmlspecialchars($_COOKIE['username'] ?? '') ?>" />
                    </div>

                    <div class="form-group">
                        <label for="loginPassword"><i class="fas fa-lock"></i> Mật khẩu</label>
                        <div class="password-wrapper">
                            <input type="password" id="loginPassword" name="password" placeholder="Nhập mật khẩu" required />
                            <button type="button" class="toggle-password" id="togglePassword">
                                <i class="fas fa-eye"></i>
                            </button>
                        </div>
                    </div>

                    <div class="form-options">
                        <label class="checkbox-label">
                            <input type="checkbox" id="rememberMe" name="remember" <?= isset($_COOKIE['username']) ? 'checked' : '' ?> />
                            <span>Ghi nhớ đăng nhập</span>
                        </label>
                        <a href="#" class="forgot-link">Quên mật khẩu?</a>
                    </div>

                    <button type="submit" class="btn-primary btn-login">
                        <i class="fas fa-sign-in-alt"></i> Đăng nhập
                    </button>
                </form>

                <div class="login-footer">
                    <p>Chưa có tài khoản? <a href="Dangky.php">Đăng ký ngay</a></p>
                </div>
            </div>

            <div class="login-side">
                <div class="side-content">
                    <i class="fas fa-seedling"></i>
                    <h3>Chào mừng trở lại!</h3>
                    <p>Đăng nhập để mua sắm và theo dõi đơn hàng của bạn.</p>
                    <ul>
                        <li><i class="fas fa-check-circle"></i> Xem lịch sử đơn hàng</li>
                        <li><i class="fas fa-check-circle"></i> Quản lý thông tin cá nhân</li>
                        <li><i class="fas fa-check-circle"></i> Nhận ưu đãi dành riêng</li>
                    </ul>
                </div>
            </div>
        </div>
    </section>

    <script src="js/Dangnhap.js"></script>
</body>
</html>