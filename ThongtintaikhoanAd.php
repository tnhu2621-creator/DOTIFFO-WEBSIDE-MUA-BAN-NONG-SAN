<?php
include 'admin/menu.php';
include 'admin/header.php';
?>

<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>DOTIFOOD - Thông tin tài khoản</title>

    <!-- Font Awesome -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css" />
    <!-- Google Font -->
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,400;14..32,500;14..32,600;14..32,700;14..32,800&display=swap" rel="stylesheet" />
    <link href="https://fonts.googleapis.com/css2?family=Bona+Nova:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet" />

    <link rel="stylesheet" href="css/ThongtintaikhoanAd.css" />

</head>
<body>

    <!-- ===== WRAPPER ===== -->
    <div class="admin-wrapper">

        <!-- ===== SIDEBAR ===== -->
        <div id="admin-layout-placeholder"></div>

        <!-- ===== MAIN CONTENT ===== -->
        <main class="main-content">

            <!-- ===== HEADER ===== -->
            <div id="header-placeholder"></div>

            <!-- ===== CONTENT ===== -->
            <div class="content-area">

                <!-- Page Header -->
                <div class="page-header">
                    <h2><i class="fas fa-user-cog"></i> Thông tin tài khoản</h2>
                    <p>Quản lý thông tin cá nhân và bảo mật tài khoản</p>
                </div>

                <!-- Tabs -->
                <div class="account-tabs">
                    <button class="tab-btn active" data-tab="profile"><i class="fas fa-user"></i> Thông tin cá nhân</button>
                    <button class="tab-btn" data-tab="password"><i class="fas fa-lock"></i> Đổi mật khẩu</button>
                </div>

                <!-- Tab Thông tin cá nhân -->
                <div class="tab-content active" id="tab-profile">
                    <div class="account-card">
                        <div class="account-card-header">
                            <h3><i class="fas fa-address-card"></i> Thông tin cá nhân</h3>
                            <span class="status-badge status-active"><i class="fas fa-check-circle"></i> Đã xác thực</span>
                        </div>

                        <!-- Avatar Section -->
                        <div class="avatar-section">
                            <div class="avatar-wrapper" id="avatarWrapper">
                                <img id="avatarPreview" src="https://ui-avatars.com/api/?name=Admin&background=008919&color=fff&size=120" alt="Avatar" />
                                <div class="avatar-overlay">
                                    <i class="fas fa-camera"></i>
                                    <span>Đổi ảnh</span>
                                </div>
                            </div>
                            <div class="avatar-info">
                                <p class="avatar-name">Nguyễn Văn Admin</p>
                                <p class="avatar-role"><span class="role-badge role-admin">Quản trị viên</span></p>
                                <button class="btn-outline btn-sm" id="btnChangeAvatar"><i class="fas fa-images"></i> Chọn avatar</button>
                                <input type="file" id="avatarInput" accept="image/*" style="display:none;" />
                            </div>
                        </div>

                        <form id="profileForm" class="account-form">
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="fullname">Họ và tên <span class="required">*</span></label>
                                    <input type="text" id="fullname" placeholder="Nguyễn Văn Admin" value="Nguyễn Văn Admin" required />
                                </div>
                                <div class="form-group">
                                    <label for="email">Email <span class="required">*</span></label>
                                    <input type="email" id="email" placeholder="admin@dotifood.vn" value="admin@dotifood.vn" required />
                                </div>
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="phone">Số điện thoại</label>
                                    <input type="tel" id="phone" placeholder="0909 123 456" value="0909123456" />
                                </div>
                                <div class="form-group">
                                    <label for="username">Tên đăng nhập</label>
                                    <input type="text" id="username" value="admin" readonly disabled />
                                    <small style="color:var(--gray-400); font-size:0.75rem;">Tên đăng nhập không thể thay đổi</small>
                                </div>
                            </div>
                            <div class="form-actions">
                                <button type="submit" class="btn-primary"><i class="fas fa-save"></i> Cập nhật thông tin</button>
                            </div>
                            <div id="profileMessage" class="form-message"></div>
                        </form>
                    </div>
                </div>

                <!-- Tab Đổi mật khẩu -->
                <div class="tab-content" id="tab-password">
                    <div class="account-card">
                        <div class="account-card-header">
                            <h3><i class="fas fa-key"></i> Đổi mật khẩu</h3>
                        </div>
                        <form id="passwordForm" class="account-form">
                            <div class="form-group">
                                <label for="currentPassword">Mật khẩu hiện tại <span class="required">*</span></label>
                                <div class="password-wrapper">
                                    <input type="password" id="currentPassword" placeholder="Nhập mật khẩu hiện tại" required />
                                    <button type="button" class="toggle-password" data-target="currentPassword"><i class="fas fa-eye"></i></button>
                                </div>
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="newPassword">Mật khẩu mới <span class="required">*</span></label>
                                    <div class="password-wrapper">
                                        <input type="password" id="newPassword" placeholder="Ít nhất 6 ký tự" required minlength="6" />
                                        <button type="button" class="toggle-password" data-target="newPassword"><i class="fas fa-eye"></i></button>
                                    </div>
                                </div>
                                <div class="form-group">
                                    <label for="confirmPassword">Xác nhận mật khẩu mới <span class="required">*</span></label>
                                    <div class="password-wrapper">
                                        <input type="password" id="confirmPassword" placeholder="Nhập lại mật khẩu mới" required />
                                        <button type="button" class="toggle-password" data-target="confirmPassword"><i class="fas fa-eye"></i></button>
                                    </div>
                                </div>
                            </div>
                            <div class="form-actions">
                                <button type="submit" class="btn-primary"><i class="fas fa-key"></i> Đổi mật khẩu</button>
                            </div>
                            <div id="passwordMessage" class="form-message"></div>
                        </form>
                    </div>
                </div>

            </div>
        </main>
    </div>

    <!-- ===== MODAL CHỌN AVATAR MẪU ===== -->
    <div class="modal-overlay" id="avatarModal">
        <div class="modal modal-avatar">
            <div class="modal-header">
                <h3><i class="fas fa-images"></i> Chọn avatar</h3>
                <button class="modal-close" id="avatarModalClose"><i class="fas fa-times"></i></button>
            </div>
            <div class="modal-body">
                <p style="color:var(--gray-600); margin-bottom:16px;">Chọn một avatar mẫu hoặc tải ảnh lên của riêng bạn.</p>
                <div class="avatar-grid" id="avatarGrid">
                    <!-- Các avatar mẫu sẽ được render bằng JS -->
                </div>
                <div style="text-align:center; margin-top:16px; padding-top:16px; border-top:1px solid var(--gray-200);">
                    <button class="btn-outline btn-sm" id="btnUploadAvatar"><i class="fas fa-upload"></i> Tải ảnh lên</button>
                    <input type="file" id="avatarUploadInput" accept="image/*" style="display:none;" />
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn-outline btn-sm" id="avatarModalCancel">Đóng</button>
            </div>
        </div>
    </div>

    <!-- ===== TOAST ===== -->
    <div class="toast" id="toast">
        <i class="fas fa-check-circle"></i>
        <span id="toastMessage">Thành công!</span>
    </div>

    <!-- ===== SCRIPT ===== -->
    <script src="js/ThongtintaikhoanAd.js"></script>

</body>
</html>