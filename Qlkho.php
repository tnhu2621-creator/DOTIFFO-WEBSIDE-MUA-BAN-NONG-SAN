<?php
include 'config/database.php';
include 'admin/menu.php';
include 'admin/header.php';
?>
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>DOTIFOOD - Quản lý kho</title>

    <!-- Font Awesome -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css" />
    <!-- Google Font -->
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,400;14..32,500;14..32,600;14..32,700;14..32,800&display=swap" rel="stylesheet" />

    <link rel="stylesheet" href="css/Qlkho.css" />
    <link rel="stylesheet" href="admin/menu.css" />
    <link rel="stylesheet" href="admin/header.css" />
</head>
<body>

    <!-- ===== WRAPPER ===== -->
    <div class="admin-wrapper">

        <!-- ===== SIDEBAR ===== -->
        <div id="admin-layout-placeholder"></div>

        <!-- ===== MAIN CONTENT ===== -->
        <main class="main-content">

            <!-- ===== CONTENT ===== -->
            <div class="content-area">

                <!-- Stats -->
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-icon"><i class="fas fa-boxes"></i></div>
                        <div class="stat-info">
                            <h3 id="totalProducts">0</h3>
                            <p>Tổng sản phẩm</p>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon"><i class="fas fa-cubes"></i></div>
                        <div class="stat-info">
                            <h3 id="totalStock">0</h3>
                            <p>Tổng tồn kho</p>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon"><i class="fas fa-exclamation-triangle"></i></div>
                        <div class="stat-info">
                            <h3 id="lowStockCount">0</h3>
                            <p>Sắp hết hàng</p>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon"><i class="fas fa-times-circle"></i></div>
                        <div class="stat-info">
                            <h3 id="outOfStockCount">0</h3>
                            <p>Hết hàng</p>
                        </div>
                    </div>
                </div>

                <!-- Toolbar -->
                <div class="toolbar">
                    <div style="display:flex; gap:10px; flex-wrap:wrap;">
                        <button class="btn-primary btn-sm" id="btnAddStock"><i class="fas fa-plus-circle"></i> Nhập kho</button>
                        <button class="btn-export-excel" id="btnExportStock"><i class="fas fa-file-excel"></i> Xuất Excel</button>
                    </div>
                    <div class="toolbar-right">
                        <select class="custom-dropdown" id="filter-danhmuc" name="danhmuc">
                            <option value="">Tất cả danh mục</option>
                            <?php
                            try {
                                $stmt = $conn->query("SELECT MaDanhMuc, TenDanhMuc FROM danhmuc ORDER BY MaDanhMuc ASC");
                                while ($row = $stmt->fetch()) {
                                    echo "<option value='" . $row['TenDanhMuc'] . "'>" . $row['TenDanhMuc'] . "</option>";
                                }
                            } catch (PDOException $e) {
                                echo "<option>Lỗi SQL: " . $e->getMessage() . "</option>";
                            }
                            ?>
                        </select>

                        <select class="custom-dropdown" id="filter-trangthai" name="trangthai">
                            <option value="">Tất cả trạng thái</option>
                            <option value="Đủ hàng">Đủ hàng</option>
                            <option value="Sắp hết hàng">Sắp hết hàng</option>
                            <option value="Hết hàng">Hết hàng</option>
                        </select>
                    </div>
                </div>

                <!-- Bảng tồn kho -->
                <div class="table-card">
                    <div class="table-header">
                        <h3>Danh sách tồn kho</h3>
                        <span id="stockCount">0 sản phẩm</span>
                    </div>
                    <div class="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Tên sản phẩm</th>
                                    <th>Danh mục</th>
                                    <th>Tồn kho</th>
                                    <!-- ĐÃ SỬA: Ngưỡng cảnh báo → Giá nhập -->
                                    <th>Giá nhập</th>
                                    <th>Trạng thái</th>
                                    <th>Thao tác</th>
                                </tr>
                            </thead>
                            <tbody id="stockTableBody">
                                <!-- Dữ liệu được render bằng JS -->
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
        </main>
    </div>

    <!-- ===== MODAL NHẬP KHO ===== -->
    <div class="modal-overlay" id="importModal">
        <div class="modal modal-lg">
            <div class="modal-header">
                <h3>Nhập kho</h3>
                <button class="modal-close" id="importModalClose"><i class="fas fa-times"></i></button>
            </div>
            <div class="modal-body">
                <form id="importForm">
                    <div class="form-row">
                        <div class="form-group">
                            <label for="importCode">Mã phiếu nhập</label>
                            <input type="text" id="importCode" placeholder="Tự động sinh" readonly />
                        </div>
                        <div class="form-group">
                            <label for="importSupplier">Nhà cung cấp</label>
                            <input type="text" id="importSupplier" placeholder="Tên nhà cung cấp" />
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="importDate">Ngày nhập</label>
                        <input type="date" id="importDate" />
                    </div>

                    <hr style="margin: 16px 0;" />

                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                        <h4 style="color:var(--green-dark);">Danh sách sản phẩm</h4>
                        <button type="button" class="btn-primary btn-sm" id="addImportRow"><i class="fas fa-plus"></i> Thêm dòng</button>
                    </div>

                    <div class="table-wrapper">
                        <table class="import-table" id="importTable">
                            <thead>
                                <tr>
                                    <th style="width:45%;">Sản phẩm</th>
                                    <th style="width:25%;">Số lượng</th>
                                    <th style="width:15%;">Đơn giá</th>
                                    <th style="width:15%;">Thành tiền</th>
                                    <th style="width:5%;"></th>
                                </tr>
                            </thead>
                            <tbody id="importTableBody">
                                <!-- Dòng mẫu sẽ được thêm bằng JS -->
                            </tbody>
                        </table>
                    </div>

                    <div style="display:flex; justify-content:flex-end; gap:20px; margin-top:12px; padding-top:12px; border-top:2px solid var(--gray-200);">
                        <div><strong>Tổng sản phẩm:</strong> <span id="totalItems">0</span></div>
                        <div><strong>Tổng số lượng:</strong> <span id="totalQuantity">0</span></div>
                        <div><strong>Tổng giá trị:</strong> <span id="totalValue">0 đ</span></div>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button class="btn-outline btn-sm" id="importModalCancel">Hủy</button>
                <button class="btn-primary btn-sm" id="importModalSave"><i class="fas fa-save"></i> Lưu phiếu nhập</button>
            </div>
        </div>
    </div>

    <!-- ===== MODAL ĐIỀU CHỈNH TỒN KHO ===== -->
    <div class="modal-overlay" id="adjustModal">
        <div class="modal">
            <div class="modal-header">
                <h3 id="modalTitle">Điều chỉnh tồn kho</h3>
                <button class="modal-close" id="modalClose"><i class="fas fa-times"></i></button>
            </div>
            <div class="modal-body">
                <form id="adjustForm">
                    <input type="hidden" id="adjustProductId" />
                    <div class="form-group">
                        <label for="adjustProductName">Sản phẩm</label>
                        <input type="text" id="adjustProductName" disabled />
                    </div>
                    <div class="form-group">
                        <label for="adjustCurrentStock">Tồn kho hiện tại</label>
                        <input type="number" id="adjustCurrentStock" disabled />
                    </div>
                    <div class="form-group">
                        <label for="adjustNewStock">Số lượng mới <span class="required">*</span></label>
                        <input type="number" id="adjustNewStock" placeholder="Nhập số lượng mới" required min="0" />
                    </div>
                    <div class="form-group">
                        <label for="adjustReason">Lý do điều chỉnh</label>
                        <select id="adjustReason">
                            <option value="Nhập kho">Nhập kho</option>
                            <option value="Xuất kho">Xuất kho</option>
                            <option value="Kiểm kê">Kiểm kê</option>
                            <option value="Hủy bỏ">Hủy bỏ</option>
                            <option value="Khác">Khác</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="adjustNote">Ghi chú</label>
                        <textarea id="adjustNote" rows="2" placeholder="Ghi chú thêm..."></textarea>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button class="btn-outline btn-sm" id="modalCancel">Hủy</button>
                <button class="btn-primary btn-sm" id="modalSave"><i class="fas fa-save"></i> Lưu</button>
            </div>
        </div>
    </div>

    <!-- ===== MODAL LỊCH SỬ ===== -->
    <div class="modal-overlay" id="historyModal">
        <div class="modal">
            <div class="modal-header">
                <h3>Lịch sử nhập/xuất</h3>
                <button class="modal-close" id="historyModalClose"><i class="fas fa-times"></i></button>
            </div>
            <div class="modal-body">
                <div id="historyContent">
                    <!-- Nội dung lịch sử sẽ được render bằng JS -->
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn-outline btn-sm" id="historyModalCancel">Đóng</button>
            </div>
        </div>
    </div>

    <!-- ===== TOAST ===== -->
    <div class="toast" id="toast">
        <i class="fas fa-check-circle"></i>
        <span id="toastMessage">Thành công!</span>
    </div>

    <!-- ===== SCRIPT ===== -->
    <script src="js/Qlkho.js"></script>
    <script src="admin/menu.js"></script>
    <script src="admin/header.js"></script>
</body>
</html>