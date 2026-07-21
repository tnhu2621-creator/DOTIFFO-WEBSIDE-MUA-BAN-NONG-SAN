document.addEventListener("DOMContentLoaded", function () {
    const filterButtons = document.querySelectorAll(".filter-btn");
    
    // ĐÃ SỬA: Chọn .product-link thay vì .product-card để ẩn/hiển thị toàn bộ ô lưới
    const randomItems = document.querySelectorAll(".product-link.random-pool");
    const filterItems = document.querySelectorAll(".product-link.filter-pool");

    filterButtons.forEach(button => {
        button.addEventListener("click", function () {
            filterButtons.forEach(btn => btn.classList.remove("active"));
            this.classList.add("active");

            const filterValue = this.getAttribute("data-filter");

            if (filterValue === "all") {
                randomItems.forEach(item => item.style.display = "block");
                filterItems.forEach(item => item.style.display = "none");
            } else {
                randomItems.forEach(item => item.style.display = "none");
                let displayedCount = 0;
                filterItems.forEach(item => {
                    if (item.getAttribute("data-category") === filterValue && displayedCount < 8) {
                        item.style.display = "block";
                        displayedCount++;
                    } else {
                        item.style.display = "none";
                    }
                });
            }
        });
    });

    // Giữ nguyên đoạn xử lý click loại trừ nút mua hàng và yêu thích
    document.querySelectorAll('.product-link').forEach(link => {
        link.addEventListener('click', function(e) {
            if (e.target.closest('.btn-cart') || e.target.closest('.btn-wish')) {
                return;
            }
            const href = this.getAttribute('href');
            if (href && href !== '#') {
                window.location.href = href;
                e.preventDefault();
            }
        });
    });

    const activeFilter = document.querySelector('.filter-btn.active');
    if (activeFilter) {
        activeFilter.click();
    }
});