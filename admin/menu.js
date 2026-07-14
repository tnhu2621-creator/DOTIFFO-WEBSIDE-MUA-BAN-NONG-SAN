(function() {
    'use strict';

    function loadSidebarAndHeader() {
        const placeholder = document.getElementById('admin-layout-placeholder');
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
                updatePageTitle(); // Cập nhật tiêu đề theo trang hiện tại
            })
            .catch(err => {
                console.warn('Không thể tải layout:', err);
                placeholder.innerHTML = '<p style="color:red; padding:20px; text-align:center;">⚠️ Không thể tải thanh menu.</p>';
            });
    }

    function initSidebarEvents() {
        // --- Menu toggle cho mobile ---
        const menuToggle = document.getElementById('menuToggle');
        const sidebar = document.querySelector('.admin-sidebar');
        if (menuToggle && sidebar) {
            menuToggle.addEventListener('click', function(e) {
                e.stopPropagation();
                sidebar.classList.toggle('open');
            });
        }

        // Đóng sidebar khi click ra ngoài (mobile)
        document.addEventListener('click', function(e) {
            if (window.innerWidth <= 480 && sidebar) {
                if (sidebar.classList.contains('open')) {
                    if (!sidebar.contains(e.target) && e.target !== menuToggle) {
                        sidebar.classList.remove('open');
                    }
                }
            }
        });

        // --- Các link trong sidebar ---
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
                        'customers': 'ThongtinKhachhang.php',
                        'reports': 'ThongkeBaocao.php'
                    };
                    if (pageMap[page]) {
                        window.location.href = pageMap[page];
                    }
                }
            });
        });

        // --- Logout ---
        const logoutBtn = document.querySelector('.admin-sidebar-footer .logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', function(e) {
                e.preventDefault();
                if (confirm('Bạn có chắc muốn đăng xuất?')) {
                    window.location.href = '../Dangnhap.php';
                }
            });
        }
    }

    // Hàm highlight menu dựa trên URL hiện tại
    function highlightActiveMenu() {
        const currentPage = window.location.pathname.split('/').pop() || 'Tongquan.php';
        const pageMap = {
            'Tongquan.php': 'dashboard',
            'Qlsanpham.php': 'products',
            'Donhang.php': 'orders',
            'Qlkho.php': 'inventory',
            'QuanlyNhanvien.php': 'staff',
            'ThongtinKhachhang.php': 'customers',
            'ThongkeBaocao.php': 'reports'
        };
        const activePage = pageMap[currentPage] || 'dashboard';

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

    // Hàm cập nhật tiêu đề header theo trang hiện tại
    function updatePageTitle() {
        const currentPage = window.location.pathname.split('/').pop() || 'Tongquan.php';
        const titleMap = {
            'Tongquan.php': 'Tổng quan',
            'Qlsanpham.php': 'Quản lý sản phẩm',
            'Donhang.php': 'Quản lý đơn hàng',
            'Qlkho.php': 'Quản lý kho',
            'QuanlyNhanvien.php': 'Quản lý nhân viên',
            'ThongtinKhachhang.php': 'Thông tin khách hàng',
            'ThongkeBaocao.php': 'Thống kê báo cáo'
        };
        const pageTitle = document.getElementById('pageTitle');
        if (pageTitle) {
            pageTitle.textContent = titleMap[currentPage] || 'Tổng quan';
        }
    }

    // Tự động load layout khi DOM sẵn sàng
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadSidebarAndHeader);
    } else {
        loadSidebarAndHeader();
    }
})();
function loadSidebar() {
    const placeholder = document.getElementById('sidebar-placeholder');
    if (!placeholder) return;

    fetch('admin/menu.php')
        .then(response => response.text())
        .then(html => {
            placeholder.innerHTML = html;
            initSidebarEvents();
            highlightActiveMenu();
            // 🔔 Phát sự kiện khi menu load xong
            document.dispatchEvent(new CustomEvent('menuLoaded'));
        })
        .catch(err => {
            console.warn('Không thể tải sidebar:', err);
        });
}