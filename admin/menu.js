(function() {
    'use strict';

    function loadSidebarAndHeader() {
        const placeholder = document.getElementById('admin-layout-placeholder');
        const sidebar = document.querySelector('.admin-sidebar');

        // === Nếu sidebar đã có sẵn trong DOM (trang include trực tiếp) ===
        if (sidebar && !placeholder) {
            // Vẫn khởi tạo sự kiện và highlight menu
            initSidebarEvents();
            highlightActiveMenu();
            updatePageTitle();
            return;
        }

        if (!placeholder) return;

        fetch('admin/menu.php')
            .then(response => {
                if (!response.ok) throw new Error('Network response was not ok');
                return response.text();
            })
            .then(html => {
                placeholder.innerHTML = html;
                initSidebarEvents();
                highlightActiveMenu();
                updatePageTitle();
            })
            .catch(err => {
                console.warn('Không thể tải layout:', err);
                placeholder.innerHTML = '<p style="color:red; padding:20px; text-align:center;">⚠️ Không thể tải thanh menu.</p>';
            });
    }

    function initSidebarEvents() {
        const menuToggle = document.getElementById('menuToggle');
        const sidebar = document.querySelector('.admin-sidebar');
        if (menuToggle && sidebar) {
            menuToggle.addEventListener('click', function(e) {
                e.stopPropagation();
                sidebar.classList.toggle('open');
            });
        }

        document.addEventListener('click', function(e) {
            if (window.innerWidth <= 480 && sidebar) {
                if (sidebar.classList.contains('open')) {
                    if (!sidebar.contains(e.target) && e.target !== menuToggle) {
                        sidebar.classList.remove('open');
                    }
                }
            }
        });

        const navLinks = document.querySelectorAll('.admin-sidebar-nav ul li a');
        navLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                const page = this.dataset.page;
                if (page) {
                    e.preventDefault();
                    const pageMap = {
                        'dashboard': 'Tongquan.php',
                        'products': 'Qlsanpham.php',
                        'orders': 'Donhang.php',
                        'inventory': 'Qlkho.php',
                        'staff': 'QuanlyNhanvien.php',
                        'customers': 'QuanlyKhachhang.php',
                        'reports': 'ThongkeBaocao.php'
                    };
                    if (pageMap[page]) {
                        window.location.href = pageMap[page];
                    }
                }
            });
        });

        const logoutBtn = document.querySelector('.admin-sidebar-footer .logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', function(e) {
                e.preventDefault();
                if (confirm('Bạn có chắc muốn đăng xuất?')) {
                    window.location.href = 'Dangnhap.php?logout=1';
                }
            });
        }
    }

    function highlightActiveMenu() {
        const currentPage = window.location.pathname.split('/').pop() || 'Tongquan.php';
        const pageMap = {
            'Tongquan.php': 'dashboard',
            'Qlsanpham.php': 'products',
            'Donhang.php': 'orders',
            'Qlkho.php': 'inventory',
            'QuanlyNhanvien.php': 'staff',
            'QuanlyKhachhang.php': 'customers',
            'ThongkeBaocao.php': 'reports'
        };
        const activePage = pageMap[currentPage] || 'dashboard';

        // Dùng setTimeout để đảm bảo DOM đã render
        setTimeout(() => {
            const links = document.querySelectorAll('.admin-sidebar-nav ul li a');
            links.forEach(link => {
                const li = link.closest('li');
                if (li) li.classList.remove('active');
                if (link.dataset.page === activePage) {
                    if (li) li.classList.add('active');
                }
            });
        }, 100);
    }

    function updatePageTitle() {
    // 1. Lấy tên file và chuyển hết về chữ thường để tránh lỗi viết Hoa/Thường
    const path = window.location.pathname.split('/').pop();
    const currentPage = path ? path.toLowerCase() : 'tongquan.php';

    const titleMap = {
        'tongquan.php': 'Tổng quan',
        'qlsanpham.php': 'Quản lý sản phẩm',
        'donhang.php': 'Quản lý đơn hàng',
        'qlkho.php': 'Quản lý kho',
        'quanlynhanvien.php': 'Quản lý nhân viên',
        'quanlykhachhang.php': 'Thông tin khách hàng',
        'thongkebaocao.php': 'Thống kê báo cáo'
    };

    // 2. Dùng setTimeout để đợi (~150ms) cho fetch() kịp đổ HTML vào giao diện
    setTimeout(() => {
        const pageTitle = document.getElementById('pageTitle');
        if (pageTitle) {
            pageTitle.textContent = titleMap[currentPage] || 'Tổng quan';
            
            // 3. Ép kiểu hiển thị và màu sắc trực tiếp đề phòng CSS ẩn mất tiêu đề
            pageTitle.style.display = 'block'; 
            pageTitle.style.color = '#27ae60'; // Màu xanh lá giống màu thương hiệu của bạn
            pageTitle.style.fontWeight = 'bold';
            
            console.log(`📌 Đã cập nhật tiêu đề Header: ${pageTitle.textContent}`);
        } else {
            console.warn('⚠️ Vẫn chưa tìm thấy phần tử #pageTitle trong DOM');
        }
    }, 150); // Đợi 150 mili-giây
}

    // Tự động load layout khi DOM sẵn sàng
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadSidebarAndHeader);
    } else {
        loadSidebarAndHeader();
    }
})();