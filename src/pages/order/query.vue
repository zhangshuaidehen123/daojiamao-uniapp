<template>
  <view class="page">
    <!-- 搜索栏 -->
    <view class="search-bar">
      <view class="search-row">
        <input
          class="search-input"
          v-model="queryInput"
          placeholder="输入订单号查询"
          type="number"
          @confirm="handleQuery"
        />
        <button class="search-btn" @tap="handleQuery" :disabled="isLoading">
          {{ isLoading ? '查询中' : '查询' }}
        </button>
      </view>
    </view>

    <!-- 结果卡片 -->
    <view v-if="orderInfo" class="result-card">
      <view class="result-header">
        <text class="order-id">订单号: {{ orderInfo.orderId }}</text>
        <view :class="['status-tag', getStatusClass(orderInfo.status)]">
          {{ orderInfo.statusText }}
        </view>
      </view>

      <view class="info-section">
        <view class="info-row">
          <text class="info-label">客户手机</text>
          <text class="info-value">{{ orderInfo.userMobile || '-' }}</text>
        </view>
        <view class="info-row">
          <text class="info-label">客户姓名</text>
          <text class="info-value">{{ orderInfo.userName || '-' }}</text>
        </view>
        <view class="info-row">
          <text class="info-label">服务时间</text>
          <text class="info-value">{{ orderInfo.serviceTime || '-' }}</text>
        </view>
        <view class="info-row">
          <text class="info-label">服务地址</text>
          <text class="info-value">{{ orderInfo.address || '-' }}</text>
        </view>
        <view class="info-row">
          <text class="info-label">服务类型</text>
          <text class="info-value">{{ orderInfo.serviceName || orderInfo.orderType || '-' }}</text>
        </view>
        <view class="info-row" v-if="orderInfo.specName">
          <text class="info-label">规格</text>
          <text class="info-value">{{ orderInfo.specName }}</text>
        </view>
        <view class="info-row">
          <text class="info-label">保洁师</text>
          <text class="info-value">
            {{ orderInfo.sellerName || '-' }}
            {{ orderInfo.sellerMobile ? `(${orderInfo.sellerMobile})` : '' }}
          </text>
        </view>
        <view class="info-row">
          <text class="info-label">金额</text>
          <text class="info-value amount">¥{{ orderInfo.amount || orderInfo.payAmount || '-' }}</text>
        </view>
        <view class="info-row" v-if="orderInfo.remark">
          <text class="info-label">备注</text>
          <text class="info-value">{{ orderInfo.remark }}</text>
        </view>
        <view class="info-row" v-if="orderInfo.comboName">
          <text class="info-label">套餐名称</text>
          <text class="info-value">{{ orderInfo.comboName }}</text>
        </view>
      </view>
    </view>

    <!-- 空状态 -->
    <view v-else-if="searched && !isLoading" class="empty-state">
      <text class="empty-icon">🔍</text>
      <text class="empty-text">未找到订单信息</text>
    </view>

    <!-- 加载中 -->
    <view v-if="isLoading" class="loading-center">
      <view class="loading-spinner"></view>
      <text class="loading-text">查询中...</text>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { getCookie, queryOrderById } from '@/api/index.js'

const queryInput = ref('')
const orderInfo = ref(null)
const isLoading = ref(false)
const searched = ref(false)

async function handleQuery() {
  const id = queryInput.value.trim()
  if (!id) {
    uni.showToast({ title: '请输入订单号', icon: 'none' })
    return
  }
  
  const cookie = getCookie()
  if (!cookie) {
    uni.showToast({ title: '请先配置Cookie', icon: 'none', duration: 3000 })
    return
  }
  
  isLoading.value = true
  orderInfo.value = null
  searched.value = false
  
  try {
    const result = await queryOrderById(id, cookie)
    if (result && result.orderId) {
      orderInfo.value = result
    } else {
      searched.value = true
    }
  } catch (e) {
    uni.showToast({ title: e.message || '查询失败', icon: 'none', duration: 3000 })
    searched.value = true
  } finally {
    isLoading.value = false
  }
}

function getStatusClass(status) {
  const map = {
    0: 'status-pending',
    1: 'status-assigned',
    2: 'status-serving',
    3: 'status-done',
    4: 'status-cancelled',
    5: 'status-rated'
  }
  return map[status] || 'status-unknown'
}
</script>

<style scoped>
.page {
  background: #f5f5f5;
  min-height: 100vh;
  padding: 24rpx;
}

.search-bar {
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
}

.search-row {
  display: flex;
  gap: 16rpx;
  align-items: center;
}

.search-input {
  flex: 1;
  border: 1rpx solid #e0e0e0;
  border-radius: 12rpx;
  padding: 18rpx 24rpx;
  font-size: 28rpx;
  background: #fafafa;
}

.search-btn {
  background: #1a73e8;
  color: #fff;
  border-radius: 12rpx;
  padding: 18rpx 32rpx;
  font-size: 28rpx;
  border: none;
  white-space: nowrap;
}

.search-btn[disabled] { background: #b0c4de; }

.result-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.06);
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
  padding-bottom: 16rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.order-id {
  font-size: 26rpx;
  color: #333;
  font-weight: 500;
}

.status-tag {
  padding: 6rpx 20rpx;
  border-radius: 20rpx;
  font-size: 22rpx;
}

.status-pending { background: #fff3e0; color: #e65100; }
.status-assigned { background: #e3f2fd; color: #1565c0; }
.status-serving { background: #e8f5e9; color: #2e7d32; }
.status-done { background: #e8f5e9; color: #2e7d32; }
.status-cancelled { background: #ffebee; color: #c62828; }
.status-rated { background: #e3f2fd; color: #1565c0; }
.status-unknown { background: #f5f5f5; color: #666; }

.info-section {}

.info-row {
  display: flex;
  padding: 14rpx 0;
  border-bottom: 1rpx solid #f5f5f5;
}

.info-row:last-child { border-bottom: none; }

.info-label {
  width: 160rpx;
  font-size: 26rpx;
  color: #999;
  flex-shrink: 0;
}

.info-value {
  flex: 1;
  font-size: 26rpx;
  color: #333;
  word-break: break-all;
}

.info-value.amount {
  color: #e53e3e;
  font-weight: 600;
}

.empty-state {
  text-align: center;
  padding: 80rpx;
  color: #999;
}

.empty-icon {
  font-size: 80rpx;
  display: block;
  margin-bottom: 16rpx;
}

.empty-text { font-size: 28rpx; }

.loading-center {
  text-align: center;
  padding: 60rpx;
}

.loading-spinner {
  width: 64rpx;
  height: 64rpx;
  border: 6rpx solid #e0e0e0;
  border-top-color: #1a73e8;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 20rpx;
}

@keyframes spin { to { transform: rotate(360deg); } }
.loading-text { font-size: 28rpx; color: #666; }
</style>
