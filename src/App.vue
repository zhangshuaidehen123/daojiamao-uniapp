<template>
  <view class="app-root">
    <router-view />
  </view>
</template>

<script>
export default {
  onLaunch() {
    console.log('天鹅到家助手 v2.5.0 启动')
  },
  onShow() {},
  onHide() {}
}
</script>

<style>
/* 全局样式 */
page {
  background-color: #f5f5f5;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.container {
  padding: 20rpx;
}

/* 通用卡片 */
.card {
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.08);
}

/* 通用按钮 */
.btn-primary {
  background: #1a73e8;
  color: #fff;
  border-radius: 12rpx;
  padding: 20rpx 40rpx;
  text-align: center;
  font-size: 30rpx;
  font-weight: 500;
}

.btn-primary[disabled] {
  background: #b0c4de;
  color: #fff;
}

.btn-secondary {
  background: #f0f4ff;
  color: #1a73e8;
  border-radius: 12rpx;
  padding: 20rpx 40rpx;
  text-align: center;
  font-size: 30rpx;
  border: 1rpx solid #1a73e8;
}

/* 表单样式 */
.form-item {
  margin-bottom: 24rpx;
}

.form-label {
  font-size: 26rpx;
  color: #666;
  margin-bottom: 8rpx;
  display: block;
}

.form-label.required::before {
  content: '* ';
  color: #e53e3e;
}

.form-input {
  width: 100%;
  border: 1rpx solid #e0e0e0;
  border-radius: 12rpx;
  padding: 20rpx 24rpx;
  font-size: 28rpx;
  box-sizing: border-box;
  background: #fff;
}

.form-input:focus {
  border-color: #1a73e8;
}

/* 状态标签 */
.tag {
  display: inline-block;
  padding: 4rpx 16rpx;
  border-radius: 20rpx;
  font-size: 22rpx;
}

.tag-success { background: #e8f5e9; color: #2e7d32; }
.tag-warning { background: #fff3e0; color: #e65100; }
.tag-error { background: #ffebee; color: #c62828; }
.tag-info { background: #e3f2fd; color: #1565c0; }

/* 加载状态 */
.loading-mask {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.loading-box {
  background: #fff;
  border-radius: 20rpx;
  padding: 40rpx 60rpx;
  text-align: center;
}

.loading-text {
  font-size: 28rpx;
  color: #333;
  margin-top: 16rpx;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 80rpx 40rpx;
  color: #999;
}

.empty-icon {
  font-size: 80rpx;
  margin-bottom: 16rpx;
}

.empty-text {
  font-size: 28rpx;
}
</style>
