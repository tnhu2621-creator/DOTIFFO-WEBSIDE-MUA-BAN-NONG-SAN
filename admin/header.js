(function() {
    'use strict';

    function loadHeader() {
        const placeholder = document.getElementById('header-placeholder');
        if (!placeholder) return;

        fetch('admin/header.php')
            .then(response => {
                if (!response.ok) throw new Error('Network response was not ok');
                return response.text();
            })
            .then(html => {
                placeholder.innerHTML = html;
                initHeaderEvents();
                updatePageTitle(); // Cập nhật tiêu đề ngay sau khi load
            })
            .catch(err => {
                console.warn('Không thể tải header:', err);
                placeholder.innerHTML = '<p style="color:red; padding:20px; text-align:center;">⚠️ Không thể tải header.</p>';
            });
    }

    function initHeaderEvents() {
        // Menu toggle - mở/đóng sidebar (mobile)
        const menuToggle = document.getElementById('menuToggle');
        if (menuToggle) {
            menuToggle.addEventListener('click', function(e) {
                e.preventDefault();
                const sidebar = document.querySelector('.admin-sidebar');
                if (sidebar) {
                    sidebar.classList.toggle('open');
                } else {
                    document.dispatchEvent(new CustomEvent('toggleSidebar'));
                }
            });
        }

        // Sự kiện tìm kiếm
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('keyup', function(e) {
                if (e.key === 'Enter') {
                    const keyword = this.value.trim();
                    if (keyword) {
                        console.log('🔍 Tìm kiếm:', keyword);
                        document.dispatchEvent(new CustomEvent('search', { detail: { keyword } }));
                    }
                }
            });
        }
    }

    // Hàm cập nhật tiêu đề header theo trang hiện tại
    function updatePageTitle() {
        const currentPage = window.location.pathname.split('/').pop() || 'Tongquan.php';
        const titleMap = {
            'Tongquan.php': 'Tổng quan',
            'Qlsanpham.php': 'Quản lý sản phẩm',
            'Donhang.php': 'Đơn hàng',
            'Qlkho.php': 'Quản lý kho',
            'QuanlyNhanvien.php': 'Quản lý nhân viên',
            'ThongtinKhachhang.php': 'Thông tin khách hàng',
            'ThongkeBaocao.php': 'Thống kê báo cáo'
        };
        const pageTitle = document.getElementById('pageTitle');
        if (pageTitle) {
            pageTitle.textContent = titleMap[currentPage] || 'Tổng quan';
            console.log(`📌 Đã cập nhật tiêu đề: ${pageTitle.textContent}`);
        } else {
            console.warn('⚠️ Không tìm thấy phần tử #pageTitle');
        }
    }

    // Tự động load header khi DOM sẵn sàng
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadHeader);
    } else {
        loadHeader();
    }

    // Lắng nghe sự kiện toggle sidebar
    document.addEventListener('toggleSidebar', function() {
        const sidebar = document.querySelector('.admin-sidebar');
        if (sidebar) {
            sidebar.classList.toggle('open');
        }
    });

    // Xuất hàm để có thể gọi từ bên ngoài (nếu cần)
    window.updatePageTitle = updatePageTitle;
})();