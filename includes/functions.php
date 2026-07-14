<?php
function formatCurrency($amount) {
    return number_format($amount, 0, ',', '.') . ' đ';
}

function getStatusClass($status) {
    switch ($status) {
        case 'Đã giao':
        case 'Hoàn thành':
            return 'status-success';
        case 'Chờ xác nhận':
        case 'Đang xử lý':
            return 'status-warning';
        case 'Đã hủy':
            return 'status-danger';
        case 'Đang giao':
            return 'status-info';
        default:
            return '';
    }
}
?>