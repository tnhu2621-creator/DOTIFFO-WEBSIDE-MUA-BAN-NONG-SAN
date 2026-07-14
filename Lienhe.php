<?php
include 'menu/header.php';
?>
<link rel="stylesheet" href="css/Lienhe.css" />

<div class="breadcrumb">
    <div class="container">
        <a href="index.php">Trang chủ</a> <span>/</span> <span>Liên hệ</span>
    </div>
</div>

<!-- ===== CONTACT SECTION ===== -->
<section class="contact-page">
    <div class="container contact-grid">

        <!-- Cột trái: Form liên hệ -->
        <div class="contact-form-wrapper">
            <div class="section-header">
                <span class="tag">Liên hệ với chúng tôi</span>
                <h2>Gửi tin nhắn <span>ngay</span></h2>
                <p>Chúng tôi luôn sẵn sàng lắng nghe và hỗ trợ bạn.</p>
            </div>

            <form id="contactForm" class="contact-form" method="post" action="">
                <div class="form-row">
                    <div class="form-group">
                        <label for="contactName"><i class="fas fa-user"></i> Họ và tên</label>
                        <input type="text" id="contactName" name="fullname" placeholder="Nguyễn Văn A" required />
                    </div>
                    <div class="form-group">
                        <label for="contactEmail"><i class="fas fa-envelope"></i> Email</label>
                        <input type="email" id="contactEmail" name="email" placeholder="example@email.com" required />
                    </div>
                </div>
                <div class="form-group">
                    <label for="contactPhone"><i class="fas fa-phone"></i> Số điện thoại</label>
                    <input type="tel" id="contactPhone" name="phone" placeholder="0909 123 456" />
                </div>
                <div class="form-group">
                    <label for="contactSubject"><i class="fas fa-tag"></i> Chủ đề</label>
                    <select id="contactSubject" name="subject">
                        <option value="">Chọn chủ đề...</option>
                        <option value="order">Đơn hàng</option>
                        <option value="product">Sản phẩm</option>
                        <option value="partner">Hợp tác</option>
                        <option value="other">Khác</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="contactMessage"><i class="fas fa-comment"></i> Tin nhắn</label>
                    <textarea id="contactMessage" name="message" rows="5" placeholder="Nhập nội dung tin nhắn..." required></textarea>
                </div>
                <button type="submit" class="btn-primary btn-submit">
                    <i class="fas fa-paper-plane"></i> Gửi tin nhắn
                </button>
            </form>

            <div id="formMessage" class="form-message"></div>
        </div>

        <!-- Cột phải: Thông tin + Bản đồ -->
        <div class="contact-info-wrapper">
            <div class="info-card">
                <h3><i class="fas fa-address-card"></i> Thông tin liên hệ</h3>
                <ul class="info-list">
                    <li>
                        <i class="fas fa-map-marker-alt"></i>
                        <span>123 Đường Nông Sản, Phường 1, TP. Đồng Tháp</span>
                    </li>
                    <li>
                        <i class="fas fa-phone"></i>
                        <span>0909 123 456</span>
                    </li>
                    <li>
                        <i class="fas fa-envelope"></i>
                        <span>info@dotifood.vn</span>
                    </li>
                    <li>
                        <i class="fas fa-clock"></i>
                        <span>Thứ 2 – Thứ 7: 8:00 – 21:00<br />Chủ nhật: 8:00 – 17:00</span>
                    </li>
                </ul>
            </div>

            <div class="map-card">
                <h3><i class="fas fa-map"></i> Vị trí của chúng tôi</h3>
                <div class="map-placeholder">
                    <i class="fas fa-map-marked-alt"></i>
                    <p>Bản đồ sẽ hiển thị tại đây</p>
                    <span>(Tích hợp Google Maps nếu cần)</span>
                </div>
            </div>

            <div class="social-card">
                <h3><i class="fas fa-share-alt"></i> Kết nối với chúng tôi</h3>
                <div class="social-links">
                    <a href="#" aria-label="Facebook"><i class="fab fa-facebook-f"></i></a>
                    <a href="#" aria-label="Instagram"><i class="fab fa-instagram"></i></a>
                    <a href="#" aria-label="YouTube"><i class="fab fa-youtube"></i></a>
                    <a href="#" aria-label="Zalo"><i class="fab fa-sms"></i></a>
                    <a href="#" aria-label="Twitter"><i class="fab fa-twitter"></i></a>
                </div>
            </div>
        </div>

    </div>
</section>

<?php include 'footer/footer.php'; ?>