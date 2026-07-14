document.addEventListener('DOMContentLoaded', function() {
    // Biểu đồ doanh thu
    const ctx1 = document.getElementById('revenueChart').getContext('2d');
    new Chart(ctx1, {
        type: 'bar',
        data: {
            labels: revenueLabels, // từ PHP
            datasets: [{
                label: 'Doanh thu (đ)',
                data: revenueData,
                backgroundColor: 'rgba(54, 162, 235, 0.6)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: { y: { beginAtZero: true } }
        }
    });

    // Biểu đồ top sản phẩm
    const ctx2 = document.getElementById('topProductsChart').getContext('2d');
    new Chart(ctx2, {
        type: 'doughnut',
        data: {
            labels: productLabels,
            datasets: [{
                data: productData,
                backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF']
            }]
        }
    });
});