document.addEventListener("DOMContentLoaded", function () {
    const filterButtons = document.querySelectorAll(".filter-btn");
    const randomItems = document.querySelectorAll(".product-card.random-pool");
    const filterItems = document.querySelectorAll(".product-card.filter-pool");

    // ---- XỬ LÝ LỌC SẢN PHẨM (giữ nguyên) ----
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

    // ---- ĐẢM BẢO CHUYỂN HƯỚNG KHI CLICK VÀO LINK SẢN PHẨM ----
    document.querySelectorAll('.product-link').forEach(link => {
        link.addEventListener('click', function(e) {
            // Nếu click vào nút "Thêm giỏ" hoặc "Yêu thích" thì bỏ qua
            if (e.target.closest('.btn-cart') || e.target.closest('.btn-wish')) {
                return;
            }
            // Lấy href và chuyển hướng (nếu href có giá trị)
            const href = this.getAttribute('href');
            if (href && href !== '#') {
                window.location.href = href;
                e.preventDefault(); // ngăn hành vi mặc định (để an toàn)
            }
        });
    });
});