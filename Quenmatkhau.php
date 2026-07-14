<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>DOTIFOOD - Quên mật khẩu</title>

    <!-- Font Awesome -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css" />
    <!-- Google Font -->
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,400;14..32,500;14..32,600;14..32,700;14..32,800&display=swap" rel="stylesheet" />
    <link href="https://fonts.googleapis.com/css2?family=Bona+Nova:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet" />

    <link rel="stylesheet" href="css/Quenmatkhau.css" />

</head>
<body>

    <!-- ===== BREADCRUMB ===== -->
    <div class="breadcrumb">
        <div class="container">
            <a href="index.php">Trang chủ</a> <span>/</span>
            <span>Quên mật khẩu</span>
        </div>
    </div>

    <!-- ===== MAIN CONTENT ===== -->
    <section class="forgot-password-page">
        <div class="container">
            <div class="forgot-password-wrapper">

                <!-- Bước 1: Nhập email -->
                <div class="forgot-card" id="stepEmail">
                    <div class="forgot-header">
                        <i class="fas fa-key"></i>
                        <h2>Quên mật khẩu?</h2>
                        <p>Nhập địa chỉ email của bạn để nhận link đặt lại mật khẩu</p>
                    </div>

                    <form id="forgotForm" class="forgot-form">
                        <div class="form-group">
                            <label for="email"><i class="fas fa-envelope"></i> Email</label>
                            <input type="email" id="email" placeholder="example@email.com" required />
                            <small class="form-hint">Chúng tôi sẽ gửi link đặt lại mật khẩu đến email này.</small>
                        </div>

                        <button type="submit" class="btn-primary btn-submit">
                            <i class="fas fa-paper-plane"></i> Gửi yêu cầu
                        </button>
                    </form>

                    <div class="forgot-footer">
                        <p><a href="Dangnhap.php"><i class="fas fa-arrow-left"></i> Quay lại đăng nhập</a></p>
                    </div>

                    <div id="formMessage" class="form-message"></div>
                </div>

                <!-- Bước 2: Thành công (ẩn ban đầu) -->
                <div class="forgot-card success-card" id="stepSuccess" style="display:none;">
                    <div class="success-icon">
                        <i class="fas fa-check-circle"></i>
                    </div>
                    <h2>Đã gửi yêu cầu!</h2>
                    <p>Chúng tôi đã gửi link đặt lại mật khẩu đến <strong id="sentEmail"></strong></p>
                    <p class="success-note">Vui lòng kiểm tra email của bạn và làm theo hướng dẫn.</p>
                    <a href="Dangnhap.php" class="btn-primary btn-success-action"><i class="fas fa-sign-in-alt"></i> Quay lại đăng nhập</a>
                </div>

            </div>
        </div>
    </section>

    <!-- ===== TOAST ===== -->
    <div class="toast" id="toast">
        <i class="fas fa-check-circle"></i>
        <span id="toastMessage">Thành công!</span>
    </div>

    <script src="js/Quenmatkhau.js"></script>

</body>
</html>