<?php
include 'config/database.php';
include 'includes/functions.php';

// ---- XỬ LÝ AJAX ----
if (isset($_GET['action']) || isset($_POST['action'])) {
    $action = $_GET['action'] ?? $_POST['action'];
    header('Content-Type: application/json');

    // ==================== SẢN PHẨM ====================

    // Lấy danh sách sản phẩm
    if ($action === 'get_products') {
        $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
        $limit = 10;
        $offset = ($page - 1) * $limit;
        $category_id = isset($_GET['category_id']) ? $_GET['category_id'] : '';

        $where = '';
        $params = [];
        if ($category_id !== '' && $category_id !== 'all') {
            $where = 'WHERE sp.MaDanhMuc = ?';
            $params[] = $category_id;
        }

        // Đếm tổng
        $countSql = "SELECT COUNT(*) FROM sanpham sp $where";
        $stmt = $pdo->prepare($countSql);
        $stmt->execute($params);
        $total = (int)$stmt->fetchColumn();
        $totalPages = ceil($total / $limit);

        // Lấy danh sách có JOIN danhmuc (dùng đúng tên cột)
        $sql = "SELECT sp.*, dm.TenDanhMuc AS TenDanhMuc 
            FROM sanpham sp 
            LEFT JOIN danhmuc dm ON sp.MaDanhMuc = dm.MaDanhMuc 
            $where 
            ORDER BY sp.MaSanPham ASC 
            LIMIT $limit OFFSET $offset";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $products = $stmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($products as &$p) {
            $p['GiaBanFormatted'] = formatCurrency($p['GiaBan']);
            $p['HinAnhUrl'] = !empty($p['HinAnh']) ? 'uploads/' . $p['HinAnh'] : 'assets/no-image.png';
        }

        echo json_encode([
            'products' => $products,
            'total' => $total,
            'totalPages' => $totalPages,
            'currentPage' => $page
        ]);
        exit;
    }

    // Thêm sản phẩm
    if ($action === 'add_product') {
        $maSanPham = $_POST['MaSanPham'];
        $tenSanPham = $_POST['TenSanPham'];
        $maDanhMuc = $_POST['MaDanhMuc'] ?: null;
        $giaBan = $_POST['GiaBan'];
        $moTa = $_POST['MoTa'] ?? '';
        $hanSuDung = $_POST['HanSuDung'] ?? '';
        $hinAnh = '';
        if (isset($_FILES['HinAnh']) && $_FILES['HinAnh']['error'] === UPLOAD_ERR_OK) {
            $uploadDir = 'uploads/';
            if (!is_dir($uploadDir)) mkdir($uploadDir, 0777, true);
            $ext = pathinfo($_FILES['HinAnh']['name'], PATHINFO_EXTENSION);
            $fileName = $maSanPham . '.' . $ext;
            move_uploaded_file($_FILES['HinAnh']['tmp_name'], $uploadDir . $fileName);
            $hinAnh = $fileName;
        }

        $sql = "INSERT INTO sanpham (MaSanPham, TenSanPham, MaDanhMuc, GiaBan, HinAnh, MoTa, HanSuDung)
                VALUES (?, ?, ?, ?, ?, ?, ?)";
        $stmt = $pdo->prepare($sql);
        $success = $stmt->execute([$maSanPham, $tenSanPham, $maDanhMuc, $giaBan, $hinAnh, $moTa, $hanSuDung]);
        echo json_encode(['success' => $success]);
        exit;
    }

    // Sửa sản phẩm
    if ($action === 'edit_product') {
        $maSanPham = $_POST['MaSanPham'];
        $tenSanPham = $_POST['TenSanPham'];
        $maDanhMuc = $_POST['MaDanhMuc'] ?: null;
        $giaBan = $_POST['GiaBan'];
        $moTa = $_POST['MoTa'] ?? '';
        $hanSuDung = $_POST['HanSuDung'] ?? '';
        $hinAnh = $_POST['HinAnhOld'] ?? '';

        if (isset($_FILES['HinAnh']) && $_FILES['HinAnh']['error'] === UPLOAD_ERR_OK) {
            $uploadDir = 'uploads/';
            if (!is_dir($uploadDir)) mkdir($uploadDir, 0777, true);
            $ext = pathinfo($_FILES['HinAnh']['name'], PATHINFO_EXTENSION);
            $fileName = $maSanPham . '.' . $ext;
            move_uploaded_file($_FILES['HinAnh']['tmp_name'], $uploadDir . $fileName);
            $hinAnh = $fileName;
        }

        $sql = "UPDATE sanpham SET TenSanPham=?, MaDanhMuc=?, GiaBan=?, HinAnh=?, MoTa=?, HanSuDung=?
                WHERE MaSanPham=?";
        $stmt = $pdo->prepare($sql);
        $success = $stmt->execute([$tenSanPham, $maDanhMuc, $giaBan, $hinAnh, $moTa, $hanSuDung, $maSanPham]);
        echo json_encode(['success' => $success]);
        exit;
    }

    // Xóa sản phẩm
    if ($action === 'delete_product') {
        $maSanPham = $_POST['MaSanPham'];
        $stmt = $pdo->prepare("SELECT HinAnh FROM sanpham WHERE MaSanPham = ?");
        $stmt->execute([$maSanPham]);
        $row = $stmt->fetch();
        if ($row && !empty($row['HinAnh'])) {
            $file = 'uploads/' . $row['HinAnh'];
            if (file_exists($file)) unlink($file);
        }
        $stmt = $pdo->prepare("DELETE FROM sanpham WHERE MaSanPham = ?");
        $success = $stmt->execute([$maSanPham]);
        echo json_encode(['success' => $success]);
        exit;
    }

    // Lấy chi tiết sản phẩm
    if ($action === 'get_product') {
        $maSanPham = $_GET['id'];
        $stmt = $pdo->prepare("SELECT * FROM sanpham WHERE MaSanPham = ?");
        $stmt->execute([$maSanPham]);
        $product = $stmt->fetch(PDO::FETCH_ASSOC);
        echo json_encode($product ?: null);
        exit;
    }

    // ==================== DANH MỤC ====================

    // Lấy danh sách danh mục
    if ($action === 'get_categories') {
        // Thay thế dòng query cũ bằng dòng dưới đây:
        $stmt = $pdo->query("SELECT MaDanhMuc AS MaDanhMuc, TenDanhMuc AS TenDanhMuc, MoTa AS MoTa FROM danhmuc ORDER BY MaDanhMuc ASC");
        
        $categories = $stmt->fetchAll(PDO::FETCH_ASSOC);
        foreach ($categories as &$c) {
            $stmt2 = $pdo->prepare("SELECT COUNT(*) FROM sanpham WHERE MaDanhMuc = ?");
            $stmt2->execute([$c['MaDanhMuc']]);
            $c['product_count'] = (int)$stmt2->fetchColumn();
        }
        echo json_encode(['categories' => $categories]);
        exit;
    }

    // Thêm danh mục
    if ($action === 'add_category') {
        $maDanhMuc = $_POST['MaDanhMuc'];
        $tenDanhMuc = $_POST['TenDanhMuc'];
        $moTa = $_POST['MoTa'] ?? '';
        $sql = "INSERT INTO danhmuc (MaDanhMuc, TenDanhMuc, MoTa) VALUES (?, ?, ?)";
        $stmt = $pdo->prepare($sql);
        $success = $stmt->execute([$maDanhMuc, $tenDanhMuc, $moTa]);
        echo json_encode(['success' => $success]);
        exit;
    }

    // Sửa danh mục
    if ($action === 'edit_category') {
        $maDanhMuc = $_POST['MaDanhMuc'];
        $tenDanhMuc = $_POST['TenDanhMuc'];
        $moTa = $_POST['MoTa'] ?? '';
        $sql = "UPDATE danhmuc SET TenDanhmuc=?, Mota=? WHERE MaDanhmuc=?";
        $stmt = $pdo->prepare($sql);
        $success = $stmt->execute([$tenDanhMuc, $moTa, $maDanhMuc]);
        echo json_encode(['success' => $success]);
        exit;
    }

    // Xóa danh mục
    if ($action === 'delete_category') {
        $maDanhMuc = $_POST['MaDanhMuc'];
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM sanpham WHERE MaDanhMuc = ?");
        $stmt->execute([$maDanhMuc]);
        $count = (int)$stmt->fetchColumn();
        if ($count > 0) {
            echo json_encode(['success' => false, 'message' => 'Danh mục đang có sản phẩm, không thể xóa.']);
            exit;
        }
        $stmt = $pdo->prepare("DELETE FROM danhmuc WHERE MaDanhmuc = ?");
        $success = $stmt->execute([$maDanhMuc]);
        echo json_encode(['success' => $success]);
        exit;
    }

    // Lấy chi tiết danh mục
    if ($action === 'get_category') {
        $maDanhMuc = $_GET['id'];
        $stmt = $pdo->prepare("SELECT MaDanhMuc AS MaDanhMuc, TenDanhMuc AS TenDanhMuc, MoTa AS MoTa FROM danhmuc WHERE MaDanhMuc = ?");
        $category = $stmt->fetch(PDO::FETCH_ASSOC);
        echo json_encode($category ?: null);
        exit;
    }

    echo json_encode(['error' => 'Invalid action']);
    exit;
}
?>
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>DOTIFOOD - Quản lý sản phẩm</title>

    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,400;14..32,500;14..32,600;14..32,700;14..32,800&display=swap" rel="stylesheet" />

    <link rel="stylesheet" href="css/Qlsanpham.css" />
    <link rel="stylesheet" href="admin/menu.css" />
    <link rel="stylesheet" href="admin/header.css" />
</head>
<body>

    <div class="admin-wrapper">
        <?php include 'admin/menu.php'; ?>
        <main class="main-content">
            <?php include 'admin/header.php'; ?>
            <div class="content-area">

                <!-- Tabs -->
                <div class="tabs">
                    <button class="tab-btn active" data-tab="products"><i class="fas fa-box"></i> Sản phẩm</button>
                    <button class="tab-btn" data-tab="categories"><i class="fas fa-tags"></i> Danh mục</button>
                </div>

                <!-- TAB SẢN PHẨM -->
                <div class="tab-content active" id="tab-products">
                    <div class="toolbar">
                        <button class="btn-primary btn-sm" id="btnAddProduct"><i class="fas fa-plus"></i> Thêm sản phẩm</button>
                        <div class="toolbar-right">
                            <select class="filter-select" id="filterCategory">
                                <option value="all">Tất cả danh mục</option>
                            </select>
                        </div>
                    </div>

                    <div class="table-card">
                        <div class="table-header">
                            <h3>Danh sách sản phẩm</h3>
                            <span id="productCount">0 sản phẩm</span>
                        </div>
                        <div class="table-wrapper">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Mã SP</th>
                                        <th>Tên sản phẩm</th>
                                        <th>Danh mục</th>
                                        <th>Giá</th>
                                        <th>Ảnh</th>
                                        <th>Ngày cập nhật</th>
                                        <th>Hạn sử dụng</th>
                                        <th>Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody id="productTableBody">
                                    <!-- Render bằng JS -->
                                </tbody>
                            </table>
                        </div>
                        <div class="pagination-container" id="paginationContainer">
                            <button class="page-btn" id="prevPage"><i class="fas fa-chevron-left"></i></button>
                            <span id="pageInfo">Trang 1 / 1</span>
                            <button class="page-btn" id="nextPage"><i class="fas fa-chevron-right"></i></button>
                        </div>
                    </div>
                </div>

                <!-- TAB DANH MỤC -->
                <div class="tab-content" id="tab-categories">
                    <div class="toolbar">
                        <button class="btn-primary btn-sm" id="btnAddCategory"><i class="fas fa-plus"></i> Thêm danh mục</button>
                    </div>

                    <div class="table-card">
                        <div class="table-header">
                            <h3>Danh sách danh mục</h3>
                            <span id="categoryCount">0 danh mục</span>
                        </div>
                        <div class="table-wrapper">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Mã danh mục</th>
                                        <th>Tên danh mục</th>
                                        <th>Mô tả</th>
                                        <th>Số sản phẩm</th>
                                        <th>Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody id="categoryTableBody">
                                    <!-- Render bằng JS -->
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

            </div>
        </main>
    </div>

    <!-- MODAL SẢN PHẨM -->
    <div class="modal-overlay" id="productModal">
        <div class="modal modal-lg">
            <div class="modal-header">
                <h3 id="modalTitle">Thêm sản phẩm</h3>
                <button class="modal-close" id="modalClose"><i class="fas fa-times"></i></button>
            </div>
            <div class="modal-body">
                <form id="productForm" enctype="multipart/form-data">
                    <input type="hidden" id="editId" value="" />
                    <input type="hidden" id="hinAnhOld" value="" />
                    <div class="form-row">
                        <div class="form-group">
                            <label for="productMa">Mã sản phẩm <span class="required">*</span></label>
                            <input type="text" id="productMa" placeholder="VD: SP001" required />
                        </div>
                        <div class="form-group">
                            <label for="productName">Tên sản phẩm <span class="required">*</span></label>
                            <input type="text" id="productName" placeholder="Nhập tên sản phẩm" required />
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="productCategory">Danh mục <span class="required">*</span></label>
                            <select id="productCategory" required>
                                <option value="">Chọn danh mục</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="productPrice">Giá (VNĐ) <span class="required">*</span></label>
                            <input type="number" id="productPrice" placeholder="0" required />
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="productImage">Hình ảnh</label>
                            <input type="file" id="productImage" accept="image/*" />
                            <div id="currentImage" style="margin-top:5px;"></div>
                        </div>
                        <div class="form-group">
                            <label for="productHan">Hạn sử dụng</label>
                            <input type="text" id="productHan" placeholder="VD: 12 tháng" />
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="productDesc">Mô tả</label>
                        <textarea id="productDesc" rows="3" placeholder="Mô tả sản phẩm..."></textarea>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button class="btn-outline btn-sm" id="modalCancel">Hủy</button>
                <button class="btn-primary btn-sm" id="modalSave"><i class="fas fa-save"></i> Lưu</button>
            </div>
        </div>
    </div>

    <!-- MODAL DANH MỤC -->
    <div class="modal-overlay" id="categoryModal">
        <div class="modal">
            <div class="modal-header">
                <h3 id="categoryModalTitle">Thêm danh mục</h3>
                <button class="modal-close" id="categoryModalClose"><i class="fas fa-times"></i></button>
            </div>
            <div class="modal-body">
                <form id="categoryForm">
                    <input type="hidden" id="editCategoryId" value="" />
                    <div class="form-group">
                        <label for="categoryMa">Mã danh mục <span class="required">*</span></label>
                        <input type="text" id="categoryMa" placeholder="VD: DM001" required />
                    </div>
                    <div class="form-group">
                        <label for="categoryName">Tên danh mục <span class="required">*</span></label>
                        <input type="text" id="categoryName" placeholder="Nhập tên danh mục" required />
                    </div>
                    <div class="form-group">
                        <label for="categoryDesc">Mô tả</label>
                        <textarea id="categoryDesc" rows="3" placeholder="Mô tả danh mục..."></textarea>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button class="btn-outline btn-sm" id="categoryModalCancel">Hủy</button>
                <button class="btn-primary btn-sm" id="categoryModalSave"><i class="fas fa-save"></i> Lưu</button>
            </div>
        </div>
    </div>

    <!-- TOAST -->
    <div class="toast" id="toast">
        <i class="fas fa-check-circle"></i>
        <span id="toastMessage">Thành công!</span>
    </div>

    <script src="admin/menu.js"></script>
    <script src="admin/header.js"></script>
    <script src="js/Qlsanpham.js"></script>
</body>
</html>