<template>
  <view class="page">
    <!-- 加载中 -->
    <view v-if="isLoading" class="loading-center">
      <view class="loading-spinner"></view>
      <text class="loading-text">加载订单详情...</text>
    </view>

    <!-- 订单详情 -->
    <template v-if="!isLoading && order">
      <!-- 状态头卡 -->
      <view class="status-card">
        <view :class="['status-icon-wrap', statusIconClass]">
          <text class="status-icon">{{ statusIcon }}</text>
        </view>
        <text class="status-text">{{ order.statusText || '未知状态' }}</text>
        <text class="status-sub">订单号: {{ order.orderId || order.orderNo }}</text>
      </view>

      <!-- 客户信息 -->
      <view class="info-card">
        <view class="card-title">客户信息</view>
        <view class="info-row">
          <text class="info-label">客户姓名</text>
          <text class="info-value">{{ order.userName || '-' }}</text>
        </view>
        <view class="info-row">
          <text class="info-label">手机号码</text>
          <text class="info-value link">{{ order.userMobile || '-' }}</text>
        </view>
      </view>

      <!-- 服务信息 -->
      <view class="info-card">
        <view class="card-title">服务信息</view>
        <view class="info-row">
          <text class="info-label">服务类型</text>
          <text class="info-value">{{ order.serviceName || order.orderTypeName || '-' }}</text>
        </view>
        <view class="info-row" v-if="order.specName">
          <text class="info-label">规格型号</text>
          <text class="info-value">{{ order.specName }}</text>
        </view>
        <view class="info-row">
          <text class="info-label">服务时间</text>
          <text class="info-value highlight">{{ order.serviceTime || '-' }}</text>
        </view>
        <view class="info-row">
          <text class="info-label">服务地址</text>
          <text class="info-value">{{ order.address || '-' }}</text>
        </view>
        <view class="info-row" v-if="order.duration || order.normalDuration">
          <text class="info-label">服务时长</text>
          <text class="info-value">{{ order.duration || order.normalDuration }}小时</text>
        </view>
      </view>

      <!-- 保洁师信息 -->
      <view class="info-card" v-if="order.sellerName || order.sellerMobile">
        <view class="card-title">保洁师信息</view>
        <view class="info-row">
          <text class="info-label">保洁师姓名</text>
          <text class="info-value seller-name">{{ order.sellerName || '-' }}</text>
        </view>
        <view class="info-row" v-if="order.sellerMobile">
          <text class="info-label">手机号码</text>
          <text class="info-value link">{{ order.sellerMobile }}</text>
        </view>
      </view>

      <!-- 套餐信息 -->
      <view class="info-card" v-if="order.comboName || order.comboId">
        <view class="card-title">套餐信息</view>
        <view class="info-row">
          <text class="info-label">套餐名称</text>
          <text class="info-value">{{ order.comboName || '-' }}</text>
        </view>
        <view class="info-row" v-if="order.comboId">
          <text class="info-label">套餐ID</text>
          <text class="info-value">{{ order.comboId }}</text>
        </view>
        <view class="info-row" v-if="order.comboRemainCount !== undefined">
          <text class="info-label">剩余次数</text>
          <text class="info-value highlight">{{ order.comboRemainCount }}</text>
        </view>
      </view>

      <!-- 费用信息 -->
      <view class="info-card">
        <view class="card-title">费用信息</view>
        <view class="info-row">
          <text class="info-label">订单金额</text>
          <text class="info-value amount">¥{{ order.amount || order.payAmount || order.totalFee || '0' }}</text>
        </view>
        <view class="info-row" v-if="order.couponAmount">
          <text class="info-label">优惠券</text>
          <text class="info-value coupon">-¥{{ order.couponAmount }}</text>
        </view>
        <view class="info-row" v-if="order.actualAmount || order.realAmount">
          <text class="info-label">实付金额</text>
          <text class="info-value amount">¥{{ order.actualAmount || order.realAmount }}</text>
        </view>
        <view class="info-row" v-if="order.payType || order.payTypeName">
          <text class="info-label">支付方式</text>
          <text class="info-value">{{ order.payTypeName || order.payTypeName || '在线支付' }}</text>
        </view>
        <view class="info-row" v-if="order.prePayType !== undefined">
          <text class="info-label">结算方式</text>
          <text class="info-value">{{ order.prePayType === 1 ? '预付' : '后付' }}</text>
        </view>
      </view>

      <!-- 备注 -->
      <view class="info-card" v-if="order.remark">
        <view class="card-title">备注信息</view>
        <view class="remark-text">{{ order.remark }}</view>
      </view>

      <!-- 底部间隔 -->
      <view style="height: 40rpx;"></view>
    </template>

    <!-- 空状态 -->
    <view v-if="!isLoading && !order" class="empty-state">
      <text class="empty-icon">📄</text>
      <text class="empty-text">未找到订单信息</text>
      <button class="back-btn" @tap="goBack">返回</button>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getCookie, queryOrderById } from '@/api/index.js'

const isLoading = ref(true)
const order = ref(null)
const orderId = ref('')

// 状态图标映射
const statusIconMap = {
  0: { icon: '⏳', cls: 'c-pending' },
  1: { icon: '📋', cls: 'c-assigned' },
  2: { icon: '🔧', cls: 'c-serving' },
  3: { icon: '✅', cls: 'c-done' },
  4: { icon: '❌', cls: 'c-cancelled' },
  5: { icon: '⭐', cls: 'c-rated' }
}

const statusIcon = computed(() => {
  const s = order.value?.status
  return statusIconMap[s]?.icon || '📦'
})

const statusIconClass = computed(() => {
  const s = order.value?.status
  return statusIconMap[s]?.cls || 'c-unknown'
})

onMounted(() => {
  // 从路由参数获取 orderId
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1]
  orderId.value = currentPage?.options?.orderId || currentPage?.$page?.options?.orderId || ''

  if (!orderId.value) {
    uni.showToast({ title: '缺少订单ID参数', icon: 'none' })
    isLoading.value = false
    return
  }

  loadOrderDetail()
})

async function loadOrderDetail() {
  const cookie = getCookie()
  if (!cookie) {
    uni.showToast({ title: '请先配置Cookie', icon: 'none', duration: 3000 })
    isLoading.value = false
    return
  }

  isLoading.value = true

  try {
    const result = await queryOrderById(orderId.value, cookie)
    if (result) {
      order.value = result
    }
  } catch (e) {
    console.error('[订单详情] 加载失败:', e.message)
    uni.showToast({ title: e.message || '加载失败', icon: 'none', duration: 3000 })
  } finally {
    isLoading.value = false
  }
}

function goBack() {
  uni.navigateBack()
}
</script>

<style scoped>
.page {
  background: #f5f5f5;
  min-height: 100vh;
  padding-bottom: 20rpx;
}

/* 状态头卡 */
.status-card {
  background: linear-gradient(135deg, #1a73e8, #4285f4);
  padding: 48rpx 32rpx;
  text-align: center;
  color: #fff;
  margin-bottom: 20rpx;
}

.status-icon-wrap {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  background: rgba(255,255,255,0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16rpx;
}

.status-icon {
  font-size: 40rpx;
}

.status-text {
  font-size: 36rpx;
  font-weight: 600;
  display: block;
  margin-bottom: 8rpx;
}

.status-sub {
  font-size: 22rpx;
  opacity: 0.8;
}

/* 信息卡片 */
.info-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin: 0 24rpx 20rpx;
  box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.04);
}

.card-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 16rpx;
  padding-bottom: 12rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.info-row {
  display: flex;
  padding: 12rpx 0;
  border-bottom: 1rpx solid #f8f8f8;
}

.info-row:last-child {
  border-bottom: none;
}

.info-label {
  width: 150rpx;
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

.info-value.link {
  color: #1a73e8;
}

.info-value.highlight {
  color: #e65100;
  font-weight: 500;
}

.info-value.amount {
  color: #e53e3e;
  font-weight: 600;
  font-size: 28rpx;
}

.info-value.coupon {
  color: #4caf50;
  font-weight: 500;
}

.info-value.seller-name {
  color: #1a73e8;
  font-weight: 500;
}

.remark-text {
  font-size: 26rpx;
  color: #666;
  padding: 8rpx 0;
  line-height: 1.6;
}

/* 加载 */
.loading-center {
  text-align: center;
  padding: 120rpx;
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

.loading-text {
  font-size: 28rpx;
  color: #666;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 120rpx 0;
  color: #999;
}

.empty-icon {
  font-size: 80rpx;
  display: block;
  margin-bottom: 16rpx;
}

.empty-text {
  font-size: 28rpx;
  display: block;
  margin-bottom: 32rpx;
}

.back-btn {
  display: inline-block;
  padding: 16rpx 48rpx;
  background: #1a73e8;
  color: #fff;
  border-radius: 12rpx;
  font-size: 26rpx;
  border: none;
}
</style>
