(function() {
    'use strict';

    function loadFooter() {
        const placeholder = document.getElementById('footer-placeholder');
        if (!placeholder) return;

        fetch('footer/footer.html')
            .then(response => {
                if (!response.ok) throw new Error('Network response was not ok');
                return response.text();
            })
            .then(html => {
                placeholder.innerHTML = html;
                // Cập nhật năm tự động (nếu có)
                const yearSpan = placeholder.querySelector('.footer-bottom');
                if (yearSpan) {
                    const currentYear = new Date().getFullYear();
                    yearSpan.innerHTML = yearSpan.innerHTML.replace('2026', currentYear);
                }
            })
            .catch(err => {
                console.warn('Không thể tải footer:', err);
                placeholder.innerHTML = '<p style="color:red; padding: 20px; text-align:center;">⚠️ Không thể tải chân trang.</p>';
            });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadFooter);
    } else {
        loadFooter();
    }
})();