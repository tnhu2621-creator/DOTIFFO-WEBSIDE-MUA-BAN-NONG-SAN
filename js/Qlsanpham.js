document.addEventListener('DOMContentLoaded', function() {
    let currentPage = 1;
    let currentCategory = 'all';
    let isEditing = false;

    const productTableBody = document.getElementById('productTableBody');
    const productCount = document.getElementById('productCount');
    const pageInfo = document.getElementById('pageInfo');
    const prevPage = document.getElementById('prevPage');
    const nextPage = document.getElementById('nextPage');
    const filterCategory = document.getElementById('filterCategory');
    const btnAddProduct = document.getElementById('btnAddProduct');
    const productModal = document.getElementById('productModal');
    const modalTitle = document.getElementById('modalTitle');
    const editId = document.getElementById('editId');
    const hinhAnhOld = document.getElementById('hinhAnhOld');
    const productMa = document.getElementById('productMa');
    const productName = document.getElementById('productName');
    const productCategory = document.getElementById('productCategory');
    const productPrice = document.getElementById('productPrice');
    const productDonViTinh = document.getElementById('productDonViTinh');
    const productImage = document.getElementById('productImage');
    const currentImage = document.getElementById('currentImage');
    const productHan = document.getElementById('productHan');
    const productDesc = document.getElementById('productDesc');
    const modalSave = document.getElementById('modalSave');
    const modalCancel = document.getElementById('modalCancel');
    const modalClose = document.getElementById('modalClose');

    const categoryTableBody = document.getElementById('categoryTableBody');
    const categoryCount = document.getElementById('categoryCount');
    const btnAddCategory = document.getElementById('btnAddCategory');
    const categoryModal = document.getElementById('categoryModal');
    const categoryModalTitle = document.getElementById('categoryModalTitle');
    const editCategoryId = document.getElementById('editCategoryId');
    const categoryMa = document.getElementById('categoryMa');
    const categoryName = document.getElementById('categoryName');
    const categoryDesc = document.getElementById('categoryDesc');
    const categoryModalSave = document.getElementById('categoryModalSave');
    const categoryModalCancel = document.getElementById('categoryModalCancel');
    const categoryModalClose = document.getElementById('categoryModalClose');

    const tabs = document.querySelectorAll('.tab-btn');
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    let toastTimer;

    function showToast(msg, isSuccess = true) {
        toastMessage.textContent = msg;
        toast.className = 'toast show ' + (isSuccess ? '' : 'error');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => toast.classList.remove('show'), 3000);
    }

    function fetchAPI(action, params = {}, method = 'GET', formData = null) {
        let url = 'Qlsanpham.php?action=' + action;
        let options = { method: method };
        if (formData) {
            options.body = formData;
        } else if (method === 'POST') {
            options.headers = { 'Content-Type': 'application/x-www-form-urlencoded' };
            options.body = new URLSearchParams(params);
        } else {
            const query = new URLSearchParams(params).toString();
            if (query) url += '&' + query;
        }
        return fetch(url, options).then(res => res.json());
    }

    function loadProducts(page, category) {
        const params = { page, category_id: category === 'all' ? '' : category };
        fetchAPI('get_products', params).then(data => {
            if (data.products) {
                renderProducts(data.products);
                productCount.textContent = data.total + ' sản phẩm';
                const totalPages = data.totalPages || 1;
                pageInfo.textContent = 'Trang ' + page + ' / ' + totalPages;
                currentPage = page;
                prevPage.disabled = (page <= 1);
                nextPage.disabled = (page >= totalPages);
            } else {
                showToast('Không thể tải sản phẩm', false);
            }
        }).catch(() => showToast('Lỗi kết nối', false));
    }

    function renderProducts(products) {
        if (!products || products.length === 0) {
            productTableBody.innerHTML = '<tr><td colspan="9" style="text-align:center;">Không có sản phẩm nào</td></tr>';
            return;
        }
        let html = '';
        products.forEach(p => {
            // Đường dẫn ảnh từ thư mục images/
            const textAnh = p.HinhAnh ? p.HinhAnh.trim() : '';
            const srcAnh = textAnh ? 'images/' + textAnh : 'https://placehold.co/50x50?text=No+Image';
            const imgHtml = `
                <div style="width: 50px; height: 50px; display: flex; align-items: center; justify-content: center; overflow: hidden; border-radius: 6px; border: 1px solid #e2e8f0; background: #f8fafc; margin: 0 auto;">
                    <img src="${srcAnh}" 
                        alt="${p.TenSanPham}" 
                        style="width: 100%; height: 100%; object-fit: cover; object-position: center;" 
                        onerror="this.onerror=null; this.src='https://placehold.co/50x50?text=No+Image';">
                </div>
            `;

            html += `
                <tr>
                    <td><strong>${p.MaSanPham}</strong></td>
                    <td>${p.TenSanPham}</td>
                    <td>${p.MaDanhMuc || 'Chưa phân loại'}</td>
                    <td>${p.GiaBan}</td>
                    <td>${p.DonViTinh || ''}</td>
                    <td>${imgHtml}</td>
                    <td>${p.NgayCapNhat ? new Date(p.NgayCapNhat).toLocaleDateString('vi-VN') : ''}</td>
                    <td>${p.HanSuDung || ''}</td>
                    <td class="table-actions">
                        <button class="btn-icon edit-btn" data-id="${p.MaSanPham}" title="Sửa"><i class="fas fa-edit"></i></button>
                        <button class="btn-icon delete-btn" data-id="${p.MaSanPham}" title="Xóa"><i class="fas fa-trash-alt"></i></button>
                    </td>
                </tr>
            `;
        });
        productTableBody.innerHTML = html;

        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                openProductModal(this.dataset.id);
            });
        });
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                if (confirm('Xóa sản phẩm này?')) {
                    deleteProduct(this.dataset.id);
                }
            });
        });
    }

    function deleteProduct(maSanPham) {
        fetchAPI('delete_product', { MaSanPham: maSanPham }, 'POST').then(data => {
            if (data.success) {
                showToast('Xóa sản phẩm thành công!');
                loadProducts(currentPage, currentCategory);
            } else {
                showToast('Xóa thất bại', false);
            }
        }).catch(() => showToast('Lỗi kết nối', false));
    }

    function openProductModal(maSanPham = null) {
        isEditing = !!maSanPham;
        if (maSanPham) {
            modalTitle.textContent = 'Sửa sản phẩm';
            editId.value = maSanPham;
            fetchAPI('get_product', { id: maSanPham }).then(data => {
                if (data) {
                    productMa.value = data.MaSanPham;
                    productMa.readOnly = true;
                    productName.value = data.TenSanPham;
                    productCategory.value = data.MaDanhMuc || '';
                    productPrice.value = data.GiaBan;
                    productDonViTinh.value = data.DonViTinh || '';
                    productHan.value = data.HanSuDung || '';
                    productDesc.value = data.MoTa || '';
                    hinhAnhOld.value = data.HinhAnh || '';
                    if (data.HinhAnh) {
                        currentImage.innerHTML = 'Ảnh hiện tại: <img src="images/' + data.HinhAnh + '" style="max-width:150px;">';
                    } else {
                        currentImage.textContent = 'Chưa có ảnh';
                    }
                }
            });
        } else {
            modalTitle.textContent = 'Thêm sản phẩm';
            editId.value = '';
            hinhAnhOld.value = '';
            productMa.readOnly = false;
            productMa.value = '';
            productName.value = '';
            productCategory.value = '';
            productPrice.value = '';
            productDonViTinh.value = '';
            productHan.value = '';
            productDesc.value = '';
            productImage.value = '';
            currentImage.textContent = '';
        }
        productModal.classList.add('active');
    }

    function closeProductModal() {
        productModal.classList.remove('active');
    }

    function saveProduct() {
        const ma = productMa.value.trim();
        const ten = productName.value.trim();
        const danhMuc = productCategory.value;
        const gia = parseFloat(productPrice.value);
        const donViTinh = productDonViTinh.value.trim();
        const han = productHan.value.trim();
        const moTa = productDesc.value.trim();

        if (!ma || !ten || !danhMuc || isNaN(gia) || gia <= 0) {
            showToast('Vui lòng điền đầy đủ thông tin', false);
            return;
        }

        const formData = new FormData();
        const isEdit = !!editId.value;
        formData.append('MaSanPham', ma);
        formData.append('TenSanPham', ten);
        formData.append('MaDanhMuc', danhMuc);
        formData.append('GiaBan', gia);
        formData.append('DonViTinh', donViTinh);
        formData.append('HanSuDung', han);
        formData.append('MoTa', moTa);
        if (productImage.files[0]) {
            formData.append('HinhAnh', productImage.files[0]);
        }
        if (isEdit) {
            formData.append('HinhAnhOld', hinhAnhOld.value);
        }

        const action = isEdit ? 'edit_product' : 'add_product';
        fetchAPI(action, {}, 'POST', formData).then(data => {
            if (data.success) {
                showToast(isEdit ? 'Cập nhật thành công!' : 'Thêm sản phẩm thành công!');
                closeProductModal();
                loadProducts(currentPage, currentCategory);
            } else {
                showToast('Lưu thất bại', false);
            }
        }).catch(() => showToast('Lỗi kết nối', false));
    }

    // ========== DANH MỤC ==========
    function loadCategories() {
        return fetchAPI('get_categories').then(data => {
            if (data.categories) {
                renderCategories(data.categories);
                categoryCount.textContent = data.categories.length + ' danh mục';
                populateCategoryDropdown(data.categories);
            }
        }).catch(() => showToast('Không thể tải danh mục', false));
    }

    function renderCategories(categories) {
        if (!categories || categories.length === 0) {
            categoryTableBody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Chưa có danh mục nào</td></tr>';
            return;
        }
        let html = '';
        categories.forEach(c => {
            html += `
                <tr>
                    <td>${c.MaDanhMuc}</td>
                    <td>${c.TenDanhMuc}</td>
                    <td>${c.MoTa || ''}</td>
                    <td>${c.product_count || 0}</td>
                    <td class="table-actions">
                        <button class="btn-icon edit-category" data-id="${c.MaDanhMuc}" title="Sửa"><i class="fas fa-edit"></i></button>
                        <button class="btn-icon delete-category" data-id="${c.MaDanhMuc}" title="Xóa"><i class="fas fa-trash-alt"></i></button>
                    </td>
                </tr>
            `;
        });
        categoryTableBody.innerHTML = html;

        document.querySelectorAll('.edit-category').forEach(btn => {
            btn.addEventListener('click', function() {
                openCategoryModal(this.dataset.id);
            });
        });
        document.querySelectorAll('.delete-category').forEach(btn => {
            btn.addEventListener('click', function() {
                if (confirm('Xóa danh mục này?')) {
                    deleteCategory(this.dataset.id);
                }
            });
        });
    }

    function populateCategoryDropdown(categories) {
        const filter = document.getElementById('filterCategory');
        filter.innerHTML = '<option value="all">Tất cả danh mục</option>';
        categories.forEach(c => {
            filter.innerHTML += `<option value="${c.MaDanhMuc}">${c.TenDanhMuc}</option>`;
        });

        const select = document.getElementById('productCategory');
        select.innerHTML = '<option value="">Chọn danh mục</option>';
        categories.forEach(c => {
            select.innerHTML += `<option value="${c.MaDanhMuc}">${c.TenDanhMuc}</option>`;
        });
    }

    function deleteCategory(maDanhMuc) {
        fetchAPI('delete_category', { MaDanhMuc: maDanhMuc }, 'POST').then(data => {
            if (data.success) {
                showToast('Xóa danh mục thành công!');
                loadCategories();
                loadProducts(currentPage, currentCategory);
            } else {
                showToast(data.message || 'Xóa thất bại', false);
            }
        }).catch(() => showToast('Lỗi kết nối', false));
    }

    function openCategoryModal(maDanhMuc = null) {
        if (maDanhMuc) {
            categoryModalTitle.textContent = 'Sửa danh mục';
            editCategoryId.value = maDanhMuc;
            fetchAPI('get_category', { id: maDanhMuc }).then(data => {
                if (data) {
                    categoryMa.value = data.MaDanhMuc;
                    categoryMa.readOnly = true;
                    categoryName.value = data.TenDanhMuc;
                    categoryDesc.value = data.MoTa || '';
                }
            });
        } else {
            categoryModalTitle.textContent = 'Thêm danh mục';
            editCategoryId.value = '';
            categoryMa.readOnly = false;
            categoryMa.value = '';
            categoryName.value = '';
            categoryDesc.value = '';
        }
        categoryModal.classList.add('active');
    }

    function closeCategoryModal() {
        categoryModal.classList.remove('active');
    }

    function saveCategory() {
        const ma = categoryMa.value.trim();
        const ten = categoryName.value.trim();
        const moTa = categoryDesc.value.trim();
        if (!ma || !ten) {
            showToast('Vui lòng nhập mã và tên danh mục', false);
            return;
        }
        const isEdit = !!editCategoryId.value;
        const action = isEdit ? 'edit_category' : 'add_category';
        const params = { MaDanhMuc: ma, TenDanhMuc: ten, MoTa: moTa };
        fetchAPI(action, params, 'POST').then(data => {
            if (data.success) {
                showToast(isEdit ? 'Cập nhật danh mục thành công!' : 'Thêm danh mục thành công!');
                closeCategoryModal();
                loadCategories();
                loadProducts(currentPage, currentCategory);
            } else {
                showToast('Lưu thất bại', false);
            }
        }).catch(() => showToast('Lỗi kết nối', false));
    }

    // ========== SỰ KIỆN ==========
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            tabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            const tabName = this.dataset.tab;
            document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
            document.getElementById('tab-' + tabName).classList.add('active');
            if (tabName === 'categories') {
                loadCategories();
            }
        });
    });

    prevPage.addEventListener('click', function() {
        if (currentPage > 1) loadProducts(currentPage - 1, currentCategory);
    });
    nextPage.addEventListener('click', function() {
        loadProducts(currentPage + 1, currentCategory);
    });

    filterCategory.addEventListener('change', function() {
        currentCategory = this.value;
        loadProducts(1, currentCategory);
    });

    btnAddProduct.addEventListener('click', function() {
        openProductModal(null);
    });

    modalSave.addEventListener('click', saveProduct);
    modalCancel.addEventListener('click', closeProductModal);
    modalClose.addEventListener('click', closeProductModal);
    productModal.addEventListener('click', function(e) {
        if (e.target === this) closeProductModal();
    });

    btnAddCategory.addEventListener('click', function() {
        openCategoryModal(null);
    });
    categoryModalSave.addEventListener('click', saveCategory);
    categoryModalCancel.addEventListener('click', closeCategoryModal);
    categoryModalClose.addEventListener('click', closeCategoryModal);
    categoryModal.addEventListener('click', function(e) {
        if (e.target === this) closeCategoryModal();
    });

    // Khởi tạo
    loadCategories().then(() => {
        loadProducts(1, 'all');
    });
});