<?php
// Bật báo lỗi (tắt khi chạy thật)
error_reporting(E_ALL);
ini_set('display_errors', 1);

session_start();

// Cấu hình kết nối CSDL
$host = 'localhost';
$dbname = 'dotifood';   // Tên CSDL của bạn
$username = 'root';     // Tên đăng nhập MySQL
$password = '';         // Mật khẩu (nếu có)

$error = '';
$success = '';

// Xử lý khi submit form
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $fullname = trim($_POST['fullname'] ?? '');
    $email    = trim($_POST['email'] ?? '');
    $phone    = trim($_POST['phone'] ?? '');
    $pass     = $_POST['password'] ?? '';
    $confirm  = $_POST['confirmPassword'] ?? '';
    $agree    = isset($_POST['agreeTerms']);

    // --- Validation ---
    if (empty($fullname) || empty($email) || empty($pass) || empty($confirm)) {
        $error = 'Vui lòng điền đầy đủ các trường bắt buộc.';
    } elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $error = 'Email không đúng định dạng.';
    } elseif (strlen($pass) < 6) {
        $error = 'Mật khẩu phải có ít nhất 6 ký tự.';
    } elseif ($pass !== $confirm) {
        $error = 'Xác nhận mật khẩu không khớp.';
    } elseif (!$agree) {
        $error = 'Bạn phải đồng ý với điều khoản.';
    } else {
        try {
            // Kết nối PDO
            $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
            $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

            // 1. SỬA: Kiểm tra email đã tồn tại chưa (Sửa 'users' -> 'nguoidung', 'email' -> 'Email')
            $stmt = $pdo->prepare("SELECT MaNguoiDung FROM nguoidung WHERE Email = ?");
            $stmt->execute([$email]);
            if ($stmt->fetch()) {
                $error = 'Email này đã được đăng ký.';
            } else {
                // Mã hóa mật khẩu
                $hashed = password_hash($pass, PASSWORD_DEFAULT);

                // 2. SỬA: Tạo mã người dùng ngẫu nhiên (vì MaNguoiDung của bạn là varchar(20) và không tự động tăng)
                $maNguoiDung = 'ND' . substr(time(), -6) . rand(100, 999); 

                // 3. SỬA: Câu lệnh INSERT khớp hoàn toàn với cấu trúc bảng `nguoidung` của bạn
                $sql = "INSERT INTO nguoidung (MaNguoiDung, TenDangnhap, MatKhau, HoTen, Email, SoDienThoai, MaVaiTro)
                        VALUES (:MaNguoiDung, :TenDangnhap, :MatKhau, :HoTen, :Email, :SoDienThoai, 333)";
                
                $stmt = $pdo->prepare($sql);
                $stmt->execute([
                    ':MaNguoiDung'  => $maNguoiDung,
                    ':TenDangnhap'  => $email, // Tạm thời lấy Email làm Tên đăng nhập để đồng bộ
                    ':MatKhau'      => $hashed,
                    ':HoTen'        => $fullname,
                    ':Email'        => $email,
                    ':SoDienThoai'  => $phone
                ]);

                $success = 'Đăng ký thành công! Chuyển đến trang đăng nhập...';
                // Sau 2 giây chuyển hướng sang Dangnhap.php
                header("Refresh: 2; url=Dangnhap.php");
                // Xóa dữ liệu POST để form trống
                $_POST = [];
            }
        } catch (PDOException $e) {
            $error = 'Lỗi CSDL: ' . $e->getMessage();
        }
    }
}
?>
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>DOTIFOOD - Đăng ký</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css" />
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,400;14..32,500;14..32,600;14..32,700;14..32,800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="css/Dangky.css">
</head>
<body>
    <section class="register-page">
        <div class="container register-container">
            <div class="register-card">
                <div class="register-header">
                    <i class="fas fa-user-plus"></i>
                    <h2>Đăng ký tài khoản</h2>
                    <p>Tham gia DOTIFOOD để trải nghiệm mua sắm tuyệt vời</p>
                </div>

                <?php if ($error): ?>
                    <div class="form-message error"><?= htmlspecialchars($error) ?></div>
                <?php elseif ($success): ?>
                    <div class="form-message success"><?= htmlspecialchars($success) ?></div>
                <?php endif; ?>

                <form method="POST" action="" class="register-form">
                    <div class="form-group">
                        <label><i class="fas fa-user"></i> Họ và tên</label>
                        <input type="text" name="fullname" placeholder="Nguyễn Văn A" required
                               value="<?= htmlspecialchars($_POST['fullname'] ?? '') ?>">
                    </div>
                    <div class="form-group">
                        <label><i class="fas fa-envelope"></i> Email</label>
                        <input type="email" name="email" placeholder="example@email.com" required
                               value="<?= htmlspecialchars($_POST['email'] ?? '') ?>">
                    </div>
                    <div class="form-group">
                        <label><i class="fas fa-phone"></i> Số điện thoại (tùy chọn)</label>
                        <input type="tel" name="phone" placeholder="0909 123 456"
                               value="<?= htmlspecialchars($_POST['phone'] ?? '') ?>">
                    </div>
                    <div class="form-group">
                        <label><i class="fas fa-lock"></i> Mật khẩu</label>
                        <div class="password-wrapper">
                            <input type="password" name="password" placeholder="Ít nhất 6 ký tự" required>
                            <button type="button" class="toggle-password"><i class="fas fa-eye"></i></button>
                        </div>
                    </div>
                    <div class="form-group">
                        <label><i class="fas fa-check-circle"></i> Xác nhận mật khẩu</label>
                        <div class="password-wrapper">
                            <input type="password" name="confirmPassword" placeholder="Nhập lại mật khẩu" required>
                            <button type="button" class="toggle-password"><i class="fas fa-eye"></i></button>
                        </div>
                    </div>
                    <div class="form-group checkbox-group">
                        <label class="checkbox-label">
                            <input type="checkbox" name="agreeTerms" required <?= isset($_POST['agreeTerms']) ? 'checked' : '' ?>>
                            <span>Tôi đồng ý với <a href="#">điều khoản</a> và <a href="#">chính sách bảo mật</a></span>
                        </label>
                    </div>
                    <button type="submit" class="btn-primary btn-register">
                        <i class="fas fa-user-plus"></i> Đăng ký ngay
                    </button>
                </form>

                <div class="register-footer">
                    <p>Đã có tài khoản? <a href="Dangnhap.php">Đăng nhập ngay</a></p>
                </div>
            </div>
            <div class="register-side">
                <div class="side-content">
                    <i class="fas fa-seedling"></i>
                    <h3>Chào mừng bạn!</h3>
                    <p>Đăng ký ngay để nhận ưu đãi đặc biệt dành cho thành viên mới.</p>
                    <ul>
                        <li><i class="fas fa-check-circle"></i> Giao hàng miễn phí đơn đầu tiên</li>
                        <li><i class="fas fa-check-circle"></i> Tích điểm đổi quà</li>
                        <li><i class="fas fa-check-circle"></i> Ưu đãi thành viên độc quyền</li>
                    </ul>
                </div>
            </div>
        </div>
    </section>

    <!-- Giỏ hàng (giữ nguyên) -->
    <div class="cart-overlay" id="cartOverlay"></div>
    <div class="cart-sidebar" id="cartSidebar">...</div>
    <div class="toast" id="toast">...</div>

    <script src="js/Dangky.js"></script>
</body>
</html>