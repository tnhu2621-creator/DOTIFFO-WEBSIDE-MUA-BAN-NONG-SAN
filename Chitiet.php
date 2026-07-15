<?php
require_once 'config/database.php';

// --- Lấy thông tin sản phẩm (có JOIN khohang) ---
$product = null;
$relatedProducts = [];

if (isset($_GET['id']) && trim($_GET['id']) !== '') {
    $id = $_GET['id'];

    $stmt = $pdo->prepare("
        SELECT s.*, dm.TenDanhMuc, k.SoLuongTon
        FROM sanpham s
        LEFT JOIN danhmuc dm ON s.MaDanhMuc = dm.MaDanhMuc
        LEFT JOIN khohang k ON s.MaSanPham = k.MaSanPham
        WHERE s.MaSanPham = ?
    ");
    $stmt->execute([$id]);
    $product = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($product) {
        // Lấy TẤT CẢ sản phẩm cùng danh mục (không giới hạn)
        $stmtRelated = $pdo->prepare("
            SELECT s.*, k.SoLuongTon
            FROM sanpham s
            LEFT JOIN khohang k ON s.MaSanPham = k.MaSanPham
            WHERE s.MaDanhMuc = ? AND s.MaSanPham != ?
        ");
        $stmtRelated->execute([$product['MaDanhMuc'], $id]);
        $relatedProducts = $stmtRelated->fetchAll(PDO::FETCH_ASSOC);
    }
}

if (!$product) {
    header('Location: index.php');
    exit;
}

// Xác định số lượng tồn kho (nếu NULL thì coi là 0)
$soLuongTon = isset($product['SoLuongTon']) ? (int)$product['SoLuongTon'] : 0;

// ===== XỬ LÝ NÚT QUAY LẠI =====
// Lấy trang trước đó từ HTTP_REFERER
$referer = isset($_SERVER['HTTP_REFERER']) ? $_SERVER['HTTP_REFERER'] : '';
$backUrl = 'index.php'; // mặc định

// Nếu có referer và không phải là chính trang Chitiet.php
if (!empty($referer) && strpos($referer, 'Chitiet.php') === false) {
    // Kiểm tra nếu referer chứa sanphamKH.php hoặc index.php
    if (strpos($referer, 'sanphamKH.php') !== false) {
        $backUrl = 'sanphamKH.php';
    } elseif (strpos($referer, 'index.php') !== false || strpos($referer, '/dotifood/') !== false) {
        // Nếu referer là index.php hoặc đường dẫn gốc
        $backUrl = 'index.php';
    } else {
        // Trường hợp khác (ví dụ từ trang khác), mặc định về index
        $backUrl = 'index.php';
    }
}
// Nếu không có referer, giữ mặc định index.php
?>
<!-- ===== CSS RIÊNG ===== -->
<link rel="stylesheet" href="css/Chitiet.css" />

<div class="container product-detail-wrapper" id="product-detail">
    <!-- Nút quay lại với URL động -->
    <div class="back-home">
        <a href="<?= htmlspecialchars($backUrl) ?>" class="btn-back">
            <i class="fas fa-arrow-left"></i> Quay lại
        </a>
    </div>

    <div class="product-detail">
        <div class="product-detail-left">
            <img src="images/<?= htmlspecialchars($product['HinhAnh']) ?>" alt="<?= htmlspecialchars($product['TenSanPham']) ?>">
        </div>
        <div class="product-detail-right" data-product-id="<?= htmlspecialchars($product['MaSanPham']) ?>">
            <h1><?= htmlspecialchars($product['TenSanPham']) ?></h1>
            <p class="product-detail-category">
                <i class="fas fa-tag"></i> 
                <?= htmlspecialchars($product['TenDanhMuc'] ?? 'Danh mục khác') ?>
            </p>
            <p class="product-detail-price">
                <?= number_format($product['GiaBan'], 0, ',', '.') ?> 
                <small>VNĐ</small>
                <?php if (!empty($product['DonViTinh'])): ?>
                    <span style="font-size:14px; color:#555;"> / <?= htmlspecialchars($product['DonViTinh']) ?></span>
                <?php endif; ?>
            </p>
            <!-- Hiển thị số lượng tồn kho -->
            <p class="product-detail-stock">
                <i class="fas fa-boxes"></i> 
                Tồn kho: <strong><?= $soLuongTon ?></strong> sản phẩm
                <?php if ($soLuongTon == 0): ?>
                    <span style="color: #e74c3c; font-weight: bold;">(Hết hàng)</span>
                <?php endif; ?>
            </p>
            <div class="product-detail-desc">
                <?= nl2br(htmlspecialchars($product['MoTa'])) ?>
            </div>

            <!-- Khu vực chọn số lượng và nút hành động -->
            <div class="product-detail-actions">
                <div class="quantity-selector">
                    <label for="quantity-input">Số lượng:</label>
                    <input type="number" id="quantity-input" 
                           name="quantity" 
                           value="1" 
                           min="1" 
                           max="<?= max($soLuongTon, 1) ?>" 
                           step="1" 
                           <?= $soLuongTon == 0 ? 'disabled' : '' ?>>
                </div>
                <div class="action-buttons">
                    <button class="btn-primary" id="add-to-cart-btn" <?= $soLuongTon == 0 ? 'disabled' : '' ?>>
                        <i class="fas fa-cart-plus"></i> Thêm vào giỏ
                    </button>
                    <button class="btn-buynow" id="buy-now-btn" <?= $soLuongTon == 0 ? 'disabled' : '' ?>>
                        <i class="fas fa-bolt"></i> Mua ngay
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- Sản phẩm cùng danh mục (tất cả) -->
    <?php if (count($relatedProducts) > 0): ?>
        <div class="related-products">
            <div class="section-title">
                <h3>Sản phẩm cùng danh mục</h3>
                <div class="line"></div>
            </div>
            <div class="product-grid">
                <?php foreach ($relatedProducts as $rel): ?>
                    <a href="chitiet.php?id=<?= $rel['MaSanPham'] ?>" class="product-link">
                        <div class="product-card">
                            <div class="product-img">
                                <img src="images/<?= htmlspecialchars($rel['HinhAnh']) ?>" alt="<?= htmlspecialchars($rel['TenSanPham']) ?>">
                            </div>
                            <h3 class="product-name"><?= htmlspecialchars($rel['TenSanPham']) ?></h3>
                            <p class="product-desc"><?= htmlspecialchars($rel['MoTa']) ?></p>
                            <div class="product-meta">
                                <span class="product-price"><?= number_format($rel['GiaBan'], 0, ',', '.') ?> đ</span>
                                <?php if (isset($rel['SoLuongTon']) && $rel['SoLuongTon'] > 0): ?>
                                    <span class="stock-info">Còn <?= (int)$rel['SoLuongTon'] ?></span>
                                <?php else: ?>
                                    <span class="stock-info out-of-stock">Hết hàng</span>
                                <?php endif; ?>
                            </div>
                            <div class="product-actions">
                                <button class="btn-cart" 
                                        data-name="<?= htmlspecialchars($rel['TenSanPham']) ?>" 
                                        data-price="<?= $rel['GiaBan'] ?>" 
                                        data-icon="images/<?= htmlspecialchars($rel['HinhAnh']) ?>" 
                                        onclick="event.stopPropagation();">
                                    <i class="fas fa-cart-plus"></i> Thêm giỏ
                                </button>
                            </div>
                        </div>
                    </a>
                <?php endforeach; ?>
            </div>
        </div>
    <?php endif; ?>
</div>

<!-- ===== JS RIÊNG ===== -->
<script src="js/Chitiet.js"></script>