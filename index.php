<?php
include 'menu/header.php';
require_once 'config/database.php';

// --- Lấy dữ liệu sản phẩm (có kiểm tra lỗi) ---
$randomProducts = [];
$allProducts = [];

try {
    $stmtRandom = $pdo->query("SELECT * FROM sanpham ORDER BY RAND() LIMIT 8");
    if ($stmtRandom) {
        $randomProducts = $stmtRandom->fetchAll(PDO::FETCH_ASSOC);
    }

    $stmtAll = $pdo->query("SELECT * FROM sanpham ORDER BY MaSanPham");
    if ($stmtAll) {
        $allProducts = $stmtAll->fetchAll(PDO::FETCH_ASSOC);
    }
} catch (PDOException $e) {
    // Nếu có lỗi CSDL, gán mảng rỗng và có thể log lỗi
    error_log('Database error: ' . $e->getMessage());
}

// Đảm bảo biến luôn là mảng (tránh lỗi foreach)
if (!is_array($randomProducts)) $randomProducts = [];
if (!is_array($allProducts)) $allProducts = [];
?>
<link rel="stylesheet" href="css/style.css" />

<section class="hero">
    <div class="container hero-grid">
        <div class="hero-content">
            <h1>Tinh Hoa Nông Sản <span>Việt</span></h1>
            <p>Hương vị tự nhiên từ vùng đất Đồng Tháp mới</p>
            <a href="#products" class="btn-primary"><i class="fas fa-store"></i> Xem Sản Phẩm</a>
            <div class="hero-badges">
                <span class="hero-badge"><i class="fas fa-check-circle"></i> Tươi ngon mỗi ngày</span>
                <span class="hero-badge"><i class="fas fa-truck"></i> Giao hàng nhanh</span>
                <span class="hero-badge"><i class="fas fa-award"></i> Nông sản sạch</span>
            </div>
        </div>
        <div class="hero-image">
            <div class="hero-image-box">
                <i class="fas fa-seedling"></i>
                <h3>Đặc sản miền Tây</h3>
                <p>Trà sen Tháp Mười · Xoài Cát Hòa Lộc</p>
            </div>
        </div>
    </div>
</section>

<div class="container" id="products">
    <div class="section-title">
        <h2>Sản Phẩm <span>Nổi Bật</span></h2>
        <p>Chọn lọc từ những vườn trái ngon nhất</p>
        <div class="line"></div>
    </div>

    <div class="filter-bar" id="filterBar">
        <button class="filter-btn active" data-filter="all">Tất cả</button>
        <button class="filter-btn" data-filter="DM01">Trái &amp; Cây</button>
        <button class="filter-btn" data-filter="DM02">Trà</button>
        <button class="filter-btn" data-filter="DM03">Đặc sản</button>
    </div>

    <div class="product-grid" id="productGrid">
        <?php if (empty($randomProducts) && empty($allProducts)): ?>
            <p class="no-products">Hiện chưa có sản phẩm nào.</p>
        <?php else: ?>
            <!-- ===== SẢN PHẨM NGẪU NHIÊN (hiển thị mặc định) ===== -->
            <?php foreach ($randomProducts as $product): ?>
                <a href="Chitiet.php?id=<?= $product['MaSanPham'] ?>" class="product-link">
                    <div class="product-card random-pool" data-category="all">
                        <span class="product-badge">Mới</span>
                        <div class="product-img">
                            <img src="images/<?= htmlspecialchars($product['HinhAnh']) ?>" alt="<?= htmlspecialchars($product['TenSanPham']) ?>">
                        </div>
                        <h3 class="product-name"><?= htmlspecialchars($product['TenSanPham']) ?></h3>
                        <p class="product-desc"><?= htmlspecialchars($product['MoTa']) ?></p>
                        <div class="product-meta">
                            <span class="product-price"><?= number_format($product['GiaBan'], 0, ',', '.') ?> <small>đ</small></span>
                            <span class="product-rating">★ ★ ★ ★ ★ <span>(10)</span></span>
                        </div>
                        <div class="product-actions">
                            <button class="btn-cart" 
                                    data-name="<?= htmlspecialchars($product['TenSanPham']) ?>" 
                                    data-price="<?= $product['GiaBan'] ?>" 
                                    data-icon="images/<?= htmlspecialchars($product['HinhAnh']) ?>" 
                                    onclick="event.stopPropagation();">
                                <i class="fas fa-cart-plus"></i> Thêm giỏ
                            </button>
                            <button class="btn-wish" title="Yêu thích"><i class="far fa-heart"></i></button>
                        </div>
                    </div>
                </a>
            <?php endforeach; ?>

            <!-- ===== TOÀN BỘ SẢN PHẨM (ẩn mặc định, dùng cho lọc) ===== -->
            <?php foreach ($allProducts as $product): ?>
                <a href="Chitiet.php?id=<?= $product['MaSanPham'] ?>" class="product-link">
                    <div class="product-card filter-pool" data-category="<?= htmlspecialchars($product['MaDanhMuc']) ?>" style="display: none;">
                        <span class="product-badge">Nổi bật</span>
                        <div class="product-img">
                            <img src="images/<?= htmlspecialchars($product['HinhAnh']) ?>" alt="<?= htmlspecialchars($product['TenSanPham']) ?>">
                        </div>
                        <h3 class="product-name"><?= htmlspecialchars($product['TenSanPham']) ?></h3>
                        <p class="product-desc"><?= htmlspecialchars($product['MoTa']) ?></p>
                        <div class="product-meta">
                            <span class="product-price"><?= number_format($product['GiaBan'], 0, ',', '.') ?> <small>đ</small></span>
                            <span class="product-rating">★ ★ ★ ★ ★ <span>(5)</span></span>
                        </div>
                        <div class="product-actions">
                            <button class="btn-cart" 
                                    data-name="<?= htmlspecialchars($product['TenSanPham']) ?>" 
                                    data-price="<?= $product['GiaBan'] ?>" 
                                    data-icon="images/<?= htmlspecialchars($product['HinhAnh']) ?>" 
                                    onclick="event.stopPropagation();">
                                <i class="fas fa-cart-plus"></i> Thêm giỏ
                            </button>
                            <button class="btn-wish" title="Yêu thích"><i class="far fa-heart"></i></button>
                        </div>
                    </div>
                </a>
            <?php endforeach; ?>
        <?php endif; ?>
    </div>
</div>

<script src="js/main.js"></script>
<?php include 'footer/footer.php'; ?>