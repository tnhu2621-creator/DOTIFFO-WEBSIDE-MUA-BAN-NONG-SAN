document.getElementById('contactForm').addEventListener('submit', function(e) {
    e.preventDefault();
    var formData = new FormData(this);
    fetch('', { method: 'POST', body: formData })
        .then(res => res.text())
        .then(html => {
            // Tạo DOM ảo, lấy nội dung .contact-form-wrapper từ response
            var temp = document.createElement('div');
            temp.innerHTML = html;
            var newContent = temp.querySelector('.contact-form-wrapper');
            if (newContent) {
                document.querySelector('.contact-form-wrapper').innerHTML = newContent.innerHTML;
            } else {
                // Fallback: gán toàn bộ (có thể bị lặp header)
                document.querySelector('.contact-form-wrapper').innerHTML = html;
            }
        })
        .catch(err => alert('Lỗi gửi tin nhắn!'));
});