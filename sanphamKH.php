<?php
require_once 'config/database.php';

// 1. TỰ ĐỘNG LẤY MÃ VÀ TÊN DANH MỤC TỪ BẢNG danhmuc (Không lo bị lệch mã DM01, DM02...)
try {
    $catStmt = $pdo->query("SELECT MaDanhMuc, TenDanhMuc FROM danhmuc");
    $categoriesData = $catStmt->fetchAll(PDO::FETCH_ASSOC);
} catch (PDOException $e) {
    // Phương án dự phòng nếu bảng danhmuc lỗi hoặc chưa đồng bộ
    $categoriesData = [
        ['MaDanhMuc' => 'DM01', 'TenDanhMuc' => 'Trái cây'],
        ['MaDanhMuc' => 'DM02', 'TenDanhMuc' => 'Trà & Sen'],
        ['MaDanhMuc' => 'DM03', 'TenDanhMuc' => 'Đặc sản']
    ];
}

// Tạo mảng danh sách tất cả MaDanhMuc để xử lý bộ lọc mặc định
$allCategoryIds = array_column($categoriesData, 'MaDanhMuc');

// Lấy tham số lọc từ GET
$selectedCategories = isset($_GET['category']) ? (array)$_GET['category'] : $allCategoryIds;
$priceRange = isset($_GET['price']) ? $_GET['price'] : 'all';
$sort = isset($_GET['sort']) ? $_GET['sort'] : 'default';
$page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
$limit = 6;
$offset = ($page - 1) * $limit;

// Xây dựng câu lệnh WHERE
$where = [];
$params = [];

if (!empty($selectedCategories)) {
    $placeholders = implode(',', array_fill(0, count($selectedCategories), '?'));
    $where[] = "MaDanhMuc IN ($placeholders)";
    $params = array_merge($params, $selectedCategories);
}

if ($priceRange === 'under100') {
    $where[] = "GiaBan < 100000";
} elseif ($priceRange === '100-200') {
    $where[] = "GiaBan BETWEEN 100000 AND 200000";
} elseif ($priceRange === 'over200') {
    $where[] = "GiaBan > 200000";
}

$whereClause = !empty($where) ? "WHERE " . implode(" AND ", $where) : "";

// Sắp xếp
$orderBy = "ORDER BY MaSanPham";
switch ($sort) {
    case 'price-asc': $orderBy = "ORDER BY GiaBan ASC"; break;
    case 'price-desc': $orderBy = "ORDER BY GiaBan DESC"; break;
    case 'name': $orderBy = "ORDER BY TenSanPham ASC"; break;
}

// Đếm tổng sản phẩm để phân trang
$countSql = "SELECT COUNT(*) FROM sanpham $whereClause";
$countStmt = $pdo->prepare($countSql);
$countStmt->execute($params);
$totalProducts = $countStmt->fetchColumn();
$totalPages = ceil($totalProducts / $limit);

// Lấy sản phẩm dữ liệu thực tế
$sql = "SELECT * FROM sanpham $whereClause $orderBy LIMIT " . (int)$limit . " OFFSET " . (int)$offset;
$stmt = $pdo->prepare($sql);
$stmt->execute($params);  
$products = $stmt->fetchAll(PDO::FETCH_ASSOC);

include 'menu/header.php';
?>
<link rel="stylesheet" href="css/sanphamKH.css" />

<div class="breadcrumb">
    <div class="container">
        <a href="index.php">Trang chủ</a> <span>/</span> <span>Sản phẩm</span>
    </div>
</div>

<section class="product-page">
    <div class="container product-page-grid">
        <aside class="filter-sidebar">
            <h3><i class="fas fa-sliders-h"></i> Bộ lọc</h3>
            <form method="get" action="" id="filterForm">
                <div class="filter-group">
                    <h4>Danh mục</h4>
                    <?php foreach ($categoriesData as $cat): ?>
                        <label>
                            <input type="checkbox" name="category[]" value="<?= htmlspecialchars($cat['MaDanhMuc']) ?>" 
                                <?= in_array($cat['MaDanhMuc'], $selectedCategories) ? 'checked' : '' ?>>
                            <?= htmlspecialchars($cat['TenDanhMuc']) ?>
                        </label>
                    <?php endforeach; ?>
                </div>

                <div class="filter-group">
                    <h4>Khoảng giá</h4>
                    <label><input type="radio" name="price" value="all" <?= $priceRange == 'all' ? 'checked' : '' ?>> Tất cả</label>
                    <label><input type="radio" name="price" value="under100" <?= $priceRange == 'under100' ? 'checked' : '' ?>> Dưới 100.000đ</label>
                    <label><input type="radio" name="price" value="100-200" <?= $priceRange == '100-200' ? 'checked' : '' ?>> 100.000 – 200.000đ</label>
                    <label><input type="radio" name="price" value="over200" <?= $priceRange == 'over200' ? 'checked' : '' ?>> Trên 200.000đ</label>
                </div>

                <button type="submit" class="btn-primary btn-filter-apply">Áp dụng</button>
                <button type="reset" class="btn-outline btn-filter-reset" id="resetFilter">Đặt lại</button>
            </form>
        </aside>

        <div class="product-list">
            <div class="product-toolbar">
                <span id="productCount">Hiển thị <?= count($products) ?> sản phẩm</span>
                <div class="sort-options">
                    <label for="sortSelect">Sắp xếp:</label>
                    <?php 
                        $queryArgs = $_GET; 
                        unset($queryArgs['sort']); 
                        $queryString = http_build_query($queryArgs);
                    ?>
                    <select id="sortSelect" onchange="window.location.href='?sort='+this.value+'&<?= $queryString ?>'">
                        <option value="default" <?= $sort == 'default' ? 'selected' : '' ?>>Mặc định</option>
                        <option value="price-asc" <?= $sort == 'price-asc' ? 'selected' : '' ?>>Giá tăng dần</option>
                        <option value="price-desc" <?= $sort == 'price-desc' ? 'selected' : '' ?>>Giá giảm dần</option>
                    </select>
                </div>
            </div>

            <div class="product-grid" id="productGrid">
                <?php if (count($products) > 0): ?>
                    <?php foreach ($products as $product): 
                        // Bản đồ icon dựa trên mã danh mục
                        $iconMap = [
                            'DM01' => 'fa-apple-alt',
                            'DM02' => 'fa-mug-saucer',
                            'DM03' => 'fa-seedling'
                        ];
                        $icon = isset($iconMap[$product['MaDanhMuc']]) ? $iconMap[$product['MaDanhMuc']] : 'fa-box';
                        $folderPath = 'images/';
                        $imageSrc = $folderPath . $product['HinhAnh'];
                    ?>
                        <!-- Thêm data-id -->
                        <div class="product-card" data-category="<?= strtolower($product['MaDanhMuc']) ?>" data-id="<?= htmlspecialchars($product['MaSanPham']) ?>">
                            <div class="product-img">
                                <?php if (!empty($product['HinhAnh'])): ?>
                                    <img src="<?= htmlspecialchars($imageSrc) ?>" 
                                         alt="<?= htmlspecialchars($product['TenSanPham']) ?>"
                                         onerror="this.onerror=null; this.src='images/default-product.png';">
                                <?php else: ?>
                                    <i class="fas <?= $icon ?>"></i>
                                <?php endif; ?>
                            </div>
                            <h3 class="product-name"><?= htmlspecialchars($product['TenSanPham']) ?></h3>
                            <p class="product-desc"><?= htmlspecialchars($product['MoTa']) ?></p>
                            <div class="product-meta">
                                <span class="product-price">
                                    <?= number_format($product['GiaBan'], 0, ',', '.') ?> 
                                    <small>đ</small>
                                    <?php if (!empty($product['DonViTinh'])): ?>
                                        <span style="font-size:12px; color:#777;">/ <?= htmlspecialchars($product['DonViTinh']) ?></span>
                                    <?php endif; ?>
                                </span>
                                <span class="product-rating">★★★★★ <span>(0)</span></span>
                            </div>
                            <div class="product-actions">
                                <!-- Nút thêm giỏ đã có onclick, không cần stopPropagation vì trong JS sẽ kiểm tra -->
                                <button class="btn-cart" 
                                    onclick="window.addToCart(
                                        '<?= htmlspecialchars($product['MaSanPham']) ?>',
                                        '<?= htmlspecialchars(addslashes($product['TenSanPham'])) ?>',
                                        <?= (int)$product['GiaBan'] ?>,
                                        '<?= htmlspecialchars($icon) ?>'
                                    )">
                                    <i class="fas fa-cart-plus"></i> Thêm giỏ
                                </button>
                                <button class="btn-wish" title="Yêu thích"><i class="far fa-heart"></i></button>
                            </div>
                        </div>
                    <?php endforeach; ?>
                <?php else: ?>
                    <p class="no-products">Không tìm thấy sản phẩm phù hợp.</p>
                <?php endif; ?>
            </div>

            <?php if ($totalPages > 1): ?>
                <div class="pagination">
                    <?php 
                        $pageArgs = $_GET; 
                        unset($pageArgs['page']);
                        $pageQueryString = http_build_query($pageArgs);
                    ?>
                    <?php for ($i = 1; $i <= $totalPages; $i++): ?>
                        <a href="?page=<?= $i ?>&<?= $pageQueryString ?>" 
                           class="page-btn <?= ($i == $page) ? 'active' : '' ?>">
                            <?= $i ?>
                        </a>
                    <?php endfor; ?>
                </div>
            <?php endif; ?>
        </div>
    </div>
</section>

<!-- ===== JS RIÊNG ===== -->
<script src="js/sanphamKH.js"></script>

<?php include 'footer/footer.php'; ?>