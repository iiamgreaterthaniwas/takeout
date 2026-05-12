import { request } from '../../../utils/request';

Page({
  data: {
    products: [],
    statusMap: {
      pending: '审核中',
      approved: '已上架',
      rejected: '被拒绝',
      off: '已下架'
    },
    showModal: false,
    editingId: null,
    submitting: false,
    allProducts: [], // 用于本地搜索
    formData: {
      name: '',
      price: '',
      stock: '',
      description: '',
      category: '',
      imageUrl: ''
    }
  },

  onInputChange(e) {
    const field = e.currentTarget.dataset.field;
    const value = e.detail.value;
    this.setData({
      [`formData.${field}`]: value
    });
  },

  onSearch(e) {
    const value = e.detail.value.toLowerCase();
    const filtered = this.data.allProducts.filter(item => 
      item.name.toLowerCase().includes(value) || 
      (item.category && item.category.toLowerCase().includes(value))
    );
    this.setData({ products: filtered });
  },

  stopBubble() {
    // 阻止点击弹窗内容时关闭弹窗
  },

  onLoad() {
    this.fetchProducts();
  },

  fetchProducts() {
    wx.showLoading({ title: '加载中' });
    request({
      url: '/products/my'
    }).then((res) => {
      this.setData({ 
        products: res,
        allProducts: res 
      });
    }).finally(() => {
      wx.hideLoading();
    });
  },

  showAddModal() {
    this.setData({
      showModal: true,
      editingId: null,
      formData: { name: '', price: '', stock: '', description: '', category: '', imageUrl: '' }
    });
  },

  showEditModal(e) {
    const id = e.currentTarget.dataset.id;
    const product = this.data.allProducts.find(p => p.id === id);
    if (product) {
      this.setData({
        showModal: true,
        editingId: id,
        formData: {
          name: product.name,
          price: product.price,
          stock: product.stock,
          description: product.description || '',
          category: product.category || '',
          imageUrl: product.imageUrl || ''
        }
      });
    }
  },

  hideAddModal() {
    this.setData({ showModal: false, editingId: null });
  },

  chooseImage() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath;
        this.uploadImage(tempFilePath);
      }
    });
  },

  uploadImage(filePath) {
    wx.showLoading({ title: '上传中...' });
    const token = wx.getStorageSync('token');
    wx.uploadFile({
      url: getApp().globalData.baseUrl + '/upload?type=products',
      filePath: filePath,
      name: 'file',
      header: {
        'Authorization': `Bearer ${token}`
      },
      success: (res) => {
        wx.hideLoading();
        const data = JSON.parse(res.data);
        if (data.url) {
          this.setData({ 'formData.imageUrl': data.url });
        } else {
          wx.showToast({ title: '上传失败', icon: 'none' });
        }
      },
      fail: () => {
        wx.hideLoading();
        wx.showToast({ title: '上传失败，请重试', icon: 'none' });
      }
    });
  },

  submitProduct() {
    const { name, price, stock, description, category, imageUrl } = this.data.formData;
    const { editingId } = this.data;

    if (!name || !price || !stock) {
      return wx.showToast({ title: '名称、价格和库存必填', icon: 'none' });
    }

    this.setData({ submitting: true });
    
    const method = editingId ? 'PUT' : 'POST';
    const url = editingId ? `/products/${editingId}` : '/products';
    const successMsg = editingId ? '更新成功' : '添加成功，等待审核';

    request({
      url,
      method,
      data: {
        name,
        price: Number(price),
        stock: Number(stock),
        description,
        category,
        imageUrl
      }
    }).then(() => {
      wx.showToast({ title: successMsg, icon: 'success' });
      this.hideAddModal();
      this.fetchProducts();
    }).catch((err) => {
      wx.showToast({ title: err.data?.message || '操作失败', icon: 'none' });
    }).finally(() => {
      this.setData({ submitting: false });
    });
  },

  deleteProduct(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这个商品吗？',
      success: (res) => {
        if (res.confirm) {
          request({
            url: `/products/${id}`,
            method: 'DELETE'
          }).then(() => {
            wx.showToast({ title: '删除成功', icon: 'success' });
            this.fetchProducts();
          });
        }
      }
    });
  }
});
