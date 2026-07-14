<?php
include 'config/database.php';
?>
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>DOTIFOOD - Đơn hàng của tôi</title>

    <!-- Font Awesome -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css" />
    <!-- Google Font -->
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,400;14..32,500;14..32,600;14..32,700;14..32,800&display=swap" rel="stylesheet" />
    <link href="https://fonts.googleapis.com/css2?family=Bona+Nova:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet" />

    <link rel="stylesheet" href="css/DonhangKH.css" />

</head>
<body>

    <!-- ===== BREADCRUMB ===== -->
    <div class="breadcrumb">
        <div class="container">
            <a href="index.php">Trang chủ</a> <span>/</span>
            <span>Đơn hàng của tôi</span>
        </div>
    </div>

    <!-- ===== MAIN CONTENT ===== -->
    <section class="orders-page">
        <div class="container">
            <div class="orders-header">
                <h1><i class="fas fa-box"></i> Đơn hàng của tôi</h1>
                <p>Quản lý và theo dõi tất cả đơn hàng của bạn</p>
            </div>

            <!-- Tabs -->
            <div class="orders-tabs">
                <button class="tab-btn active" data-tab="active">Đơn hàng đang hoạt động <span id="activeBadge" class="badge">0</span></button>
                <button class="tab-btn" data-tab="history">Lịch sử đơn hàng</button>
            </div>

            <!-- Tab nội dung -->
            <div class="tab-content active" id="tab-active">
                <div class="orders-list" id="activeOrders">
                    <!-- Dữ liệu được render bằng JS -->
                </div>
            </div>

            <div class="tab-content" id="tab-history">
                <div class="orders-list" id="historyOrders">
                    <!-- Dữ liệu được render bằng JS -->
                </div>
            </div>
        </div>
    </section>

    <!-- ===== MODAL CHI TIẾT ĐƠN HÀNG ===== -->
    <div class="modal-overlay" id="orderDetailModal">
        <div class="modal modal-lg">
            <div class="modal-header">
                <h3 id="detailModalTitle">Chi tiết đơn hàng</h3>
                <button class="modal-close" id="detailModalClose"><i class="fas fa-times"></i></button>
            </div>
            <div class="modal-body">
                <div id="orderDetailContent">
                    <!-- Nội dung chi tiết sẽ được render bằng JS -->
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn-outline btn-sm" id="detailModalCancel">Đóng</button>
            </div>
        </div>
    </div>

    <!-- ===== MODAL XÁC NHẬN HỦY ===== -->
    <div class="modal-overlay" id="cancelModal">
        <div class="modal modal-sm">
            <div class="modal-header">
                <h3>Xác nhận hủy đơn hàng</h3>
                <button class="modal-close" id="cancelModalClose"><i class="fas fa-times"></i></button>
            </div>
            <div class="modal-body">
                <p style="margin-bottom:12px;">Bạn có chắc chắn muốn hủy đơn hàng <strong id="cancelOrderCode"></strong>?</p>
                <p style="color:var(--gray-400); font-size:0.9rem;">Hành động này không thể hoàn tác.</p>
                <input type="hidden" id="cancelOrderId" />
            </div>
            <div class="modal-footer">
                <button class="btn-outline btn-sm" id="cancelModalCancel">Quay lại</button>
                <button class="btn-danger btn-sm" id="cancelModalConfirm"><i class="fas fa-times"></i> Hủy đơn</button>
            </div>
        </div>
    </div>

    <!-- ===== TOAST ===== -->
    <div class="toast" id="toast">
        <i class="fas fa-check-circle"></i>
        <span id="toastMessage">Thành công!</span>
    </div>

    <script src="js/DonhangKH.js"></script>

</body>
</html>