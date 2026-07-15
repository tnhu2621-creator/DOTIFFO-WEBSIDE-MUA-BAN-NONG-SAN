<?php
// Kiểm tra session trước khi bắt đầu để tránh lỗi
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// --- Xử lý đăng xuất ---
if (isset($_GET['logout'])) {
    $_SESSION = array();
    if (ini_get("session.use_cookies")) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000,
            $params["path"], $params["domain"],
            $params["secure"], $params["httponly"]
        );
    }
    session_destroy();
    header('Location: Dangnhap.php');
    exit();
}

// --- Lấy thông tin người dùng nếu đã đăng nhập ---
$isLoggedIn = isset($_SESSION['user_id']);
$userName = '';
$userAvatar = '';

if ($isLoggedIn) {
    $userName = $_SESSION['user_name'] ?? 'Tài khoản';
    $userAvatar = $_SESSION['user_avatar'] ?? '';

    // Nếu avatar chưa có trong session, lấy từ DB
    if (empty($userAvatar)) {
        require_once 'config/database.php';
        $stmt = $pdo->prepare("SELECT HinhAnh FROM nguoidung WHERE MaNguoiDung = ?");
        $stmt->execute([$_SESSION['user_id']]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($row && !empty($row['HinhAnh'])) {
            $userAvatar = $row['HinhAnh'];
            $_SESSION['user_avatar'] = $userAvatar;
        }
    }

    // Fallback avatar nếu vẫn trống
    if (empty($userAvatar) || !file_exists($userAvatar)) {
        $userAvatar = 'https://ui-avatars.com/api/?name=' . urlencode($userName) . '&background=008919&color=fff&size=120';
    }
}

// --- Lấy số lượng và chi tiết sản phẩm trong giỏ hàng ---
$cartCount = 0;
$dbCartItems = [];

require_once 'config/database.php';

if ($isLoggedIn) {
    try {
        // Đếm số sản phẩm khác nhau trong giỏ (không tính số lượng)
        $stmt = $pdo->prepare("
            SELECT COUNT(*) as total 
            FROM giohang_chitiet gc 
            JOIN giohang g ON gc.MaGioHang = g.MaGioHang 
            WHERE g.MaNguoiDung = ? AND g.TrangThai = 0
        ");
        $stmt->execute([$_SESSION['user_id']]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        $cartCount = $row['total'] ?? 0;

        // Lấy chi tiết giỏ hàng, thêm sp.DonViTinh để hiển thị đơn vị
        $stmtItems = $pdo->prepare("
            SELECT 
                sp.MaSanPham AS MaSanPham,
                sp.TenSanPham AS name, 
                sp.GiaBan AS price, 
                sp.DonViTinh AS don_vi,          -- <-- THÊM CỘT ĐƠN VỊ
                gc.SoLuong AS quantity, 
                CONCAT('images/', sp.HinhAnh) AS icon
            FROM giohang_chitiet gc
            JOIN giohang g ON gc.MaGioHang = g.MaGioHang
            JOIN sanpham sp ON gc.MaSanPham = sp.MaSanPham
            WHERE g.MaNguoiDung = ? AND g.TrangThai = 0
        ");
        $stmtItems->execute([$_SESSION['user_id']]);
        $dbCartItems = $stmtItems->fetchAll(PDO::FETCH_ASSOC);

    } catch (Exception $e) {
        error_log('Lỗi lấy giỏ hàng từ CSDL: ' . $e->getMessage());
    }
}
?>
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>DOTIFOOD - Tinh Hoa Nông Sản Việt</title>

    <!-- Font Awesome 6 -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css" />
    <!-- Google Font -->
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,400;14..32,500;14..32,600;14..32,700;14..32,800&display=swap" rel="stylesheet" />

    <link rel="stylesheet" href="menu/header.css" />
    <link rel="stylesheet" href="footer/footer.css" />
</head>
<body>

<!-- ===== HEADER ===== -->
<header class="header" id="header">
    <div class="container header-inner">
        <a href="index.php" class="logo">
            <i class="fas fa-leaf"></i>
            <span class="logo-text">DOTIFOOD</span>
        </a>

        <ul class="nav-menu" id="navMenu">
            <li><a href="index.php">Trang Chủ</a></li>
            <li><a href="sanphamKH.php">Sản Phẩm</a></li>
            <li class="dropdown">
                <a href="Gioithieu.php">Giới Thiệu <i class="fas fa-chevron-down"></i></a>
                <ul class="dropdown-menu-nav">
                    <li><a href="Gioithieu.php#about">Về chúng tôi</a></li>
                    <li><a href="Gioithieu.php#product-intro">Về sản phẩm</a></li>
                </ul>
            </li>
            <li><a href="Lienhe.php">Liên Hệ</a></li>
        </ul>

        <div class="header-actions">
            <!-- Giỏ hàng -->
            <div class="cart-icon" id="cartToggle" title="Giỏ hàng" onclick="openCart()">
                <i class="fas fa-shopping-bag"></i>
                <span class="cart-badge" id="cartBadge"><?= $cartCount ?></span>
            </div>

            <!-- Avatar + Dropdown -->
            <div class="user-account" id="userAccount">
                <div class="avatar-wrapper <?= $isLoggedIn ? '' : 'not-logged-in' ?>" id="avatarToggle">
                    <?php if ($isLoggedIn): ?>
                        <?php if (!empty($userAvatar)): ?>
                            <img src="<?= htmlspecialchars($userAvatar) ?>" alt="Avatar" style="width:32px;height:32px;border-radius:50%; object-fit:cover;">
                        <?php else: ?>
                            <i class="fas fa-user-circle"></i>
                        <?php endif; ?>
                    <?php else: ?>
                        <span class="login-text" onclick="window.location.href='Dangnhap.php'">Đăng nhập</span>
                    <?php endif; ?>
                </div>
                <!-- dropdown -->
                <div class="dropdown-menu" id="dropdownMenu">
                    <ul>
                        <?php if ($isLoggedIn): ?>
                            <li><a href="ThongtintaikhoanKH.php"><i class="fas fa-user"></i> <?= htmlspecialchars($userName) ?></a></li>
                            <li><a href="DonhangKH.php"><i class="fas fa-list-ul"></i> Đơn hàng</a></li>
                            <li><a href="javascript:void(0)" id="logoutBtn" onclick="window.location.href='?logout=1';"><i class="fas fa-sign-out-alt"></i> Đăng xuất</a></li>
                        <?php else: ?>
                            <li><a href="Dangnhap.php"><i class="fas fa-sign-in-alt"></i> Đăng nhập</a></li>
                            <li><a href="Dangky.php"><i class="fas fa-user-plus"></i> Đăng ký</a></li>
                        <?php endif; ?>
                    </ul>
                </div>
            </div>

            <!-- Mobile toggle -->
            <button class="mobile-toggle" id="mobileToggle" aria-label="Toggle menu">
                <i class="fas fa-bars"></i>
            </button>
        </div>

        <!-- ===== CART SIDEBAR ===== -->
        <div class="cart-overlay" id="cartOverlay"></div>
        <div class="cart-sidebar" id="cartSidebar">
            <div class="cart-header">
                <h3><i class="fas fa-shopping-bag"></i> Giỏ hàng</h3>
                <button class="cart-close" id="cartClose"><i class="fas fa-times"></i></button>
            </div>
            <ul class="cart-items" id="cartItems">
                <li class="cart-empty">
                    <i class="fas fa-shopping-cart"></i>
                    Giỏ hàng trống<br />
                    <span style="font-size:0.85rem;">Hãy thêm sản phẩm nhé!</span>
                </li>
            </ul>
            <div class="cart-footer">
                <div class="cart-total">
                    <span>Tổng cộng</span>
                    <span id="cartTotal">0 đ</span>
                </div>
                <button class="btn-primary" id="checkoutBtn">
                    <i class="fas fa-credit-card"></i> Thanh toán ngay
                </button>
            </div>
        </div>

        <!-- ===== TOAST ===== -->
        <div class="toast" id="toast">
            <i class="fas fa-check-circle"></i>
            <span id="toastMessage">Đã thêm vào giỏ hàng!</span>
        </div>

    </div>
</header>

<!-- Truyền dữ liệu giỏ hàng cho JavaScript (bao gồm MaSanPham và don_vi) -->
<script>
    const dbCartData = <?= json_encode($dbCartItems) ?>;
</script>

<script src="menu/header.js"></script>

</body>
</html>