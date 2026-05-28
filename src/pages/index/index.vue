<template>
  <view class="page">
    <!-- 状态卡片 -->
    <view class="status-card">
      <view class="status-header">
        <view class="status-indicator">
          <view :class="['dot', { active: hasCookie }]"></view>
          <text class="status-text">{{ hasCookie ? '已配置Cookie' : '演示模式' }}</text>
        </view>
        <view class="version-tag">v2.5.0</view>
      </view>
      
      <view class="stats-row" v-if="stats">
        <view class="stat-item">
          <text class="stat-num">{{ stats.today_total }}</text>
          <text class="stat-label">今日下单</text>
        </view>
        <view class="stat-item">
          <text class="stat-num success-num">{{ stats.today_success }}</text>
          <text class="stat-label">成功</text>
        </view>
        <view class="stat-item">
          <text class="stat-num fail-num">{{ stats.today_failed }}</text>
          <text class="stat-label">失败</text>
        </view>
      </view>
    </view>

    <!-- 快捷入口 -->
    <view class="action-grid">
      <view class="action-item" @tap="navigate('/pages/order/manual-order')">
        <text class="action-icon">📝</text>
        <text class="action-label">手动下单</text>
      </view>
      <view class="action-item" @tap="navigate('/pages/order/query')">
        <text class="action-icon">🔍</text>
        <text class="action-label">订单查询</text>
      </view>
      <view class="action-item" @tap="navigate('/pages/schedule/query')">
        <text class="action-icon">📅</text>
        <text class="action-label">排班查询</text>
      </view>
      <view class="action-item" @tap="navigate('/pages/settings/settings')">
        <text class="action-icon">⚙️</text>
        <text class="action-label">设置</text>
      </view>
      <view class="action-item" @tap="navigate('/pages/order/cash-settlement')">
        <text class="action-icon">💰</text>
        <text class="action-label">现金结算</text>
      </view>
    </view>
    
    <!-- 最近订单 -->
    <view class="card" v-if="recentOrders.length > 0">
      <view class="card-title">最近下单</view>
      <view
        v-for="order in recentOrders"
        :key="order.id"
        class="order-item"
      >
        <view class="order-left">
          <text class="order-category">{{ order.category }}</text>
          <text class="order-time">{{ formatTime(order.time) }}</text>
        </view>
        <view :class="['order-status', order.success ? 'success' : 'fail']">
          {{ order.success ? '成功' : '失败' }}
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getCookie } from '@/api/index.js'

const hasCookie = ref(false)
const stats = ref({ today_total: 0, today_success: 0, today_failed: 0 })
const recentOrders = ref([])

onMounted(() => {
  hasCookie.value = !!getCookie()
  loadStats()
})

function loadStats() {
  try {
    const logs = uni.getStorageSync('app_logs') || []
    const today = new Date().toDateString()
    const todayLogs = logs.filter(l => new Date(l.time).toDateString() === today)
    const success = todayLogs.filter(l => l.level === 'success').length
    const fail = todayLogs.filter(l => l.level === 'error').length
    stats.value = { today_total: success + fail, today_success: success, today_failed: fail }
    
    // 最近5条订单记录
    recentOrders.value = todayLogs.slice(0, 5).map(l => ({
      category: l.msg?.substring(0, 20) || '',
      time: l.time,
      success: l.level === 'success'
    }))
  } catch (e) {}
}

function navigate(url) {
  uni.navigateTo({ url }).catch(() => uni.switchTab({ url }))
}

function formatTime(iso) {
  try {
    const d = new Date(iso)
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  } catch (e) { return '' }
}
</script>

<style scoped>
.page {
  background: #f5f5f5;
  min-height: 100vh;
  padding: 24rpx;
}

.status-card {
  background: linear-gradient(135deg, #1a73e8, #0d47a1);
  border-radius: 20rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
  color: #fff;
}

.status-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24rpx;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.dot {
  width: 16rpx;
  height: 16rpx;
  border-radius: 50%;
  background: rgba(255,255,255,0.4);
}

.dot.active { background: #69f0ae; }

.status-text { font-size: 28rpx; color: rgba(255,255,255,0.9); }
.version-tag { font-size: 22rpx; color: rgba(255,255,255,0.6); }

.stats-row {
  display: flex;
  justify-content: space-around;
}

.stat-item { text-align: center; }
.stat-num { font-size: 44rpx; font-weight: 700; display: block; }
.stat-label { font-size: 22rpx; color: rgba(255,255,255,0.7); }
.success-num { color: #69f0ae; }
.fail-num { color: #ff5252; }

.action-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16rpx;
  margin-bottom: 24rpx;
}

.action-item {
  background: #fff;
  border-radius: 16rpx;
  padding: 32rpx 24rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12rpx;
  box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.06);
}

.action-icon { font-size: 56rpx; }
.action-label { font-size: 28rpx; color: #333; font-weight: 500; }

.card {
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.06);
}

.card-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 16rpx;
}

.order-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12rpx 0;
  border-bottom: 1rpx solid #f5f5f5;
}

.order-item:last-child { border-bottom: none; }

.order-left { display: flex; flex-direction: column; gap: 4rpx; }
.order-category { font-size: 26rpx; color: #333; }
.order-time { font-size: 22rpx; color: #999; }

.order-status {
  font-size: 24rpx;
  padding: 4rpx 16rpx;
  border-radius: 20rpx;
}

.order-status.success { background: #e8f5e9; color: #2e7d32; }
.order-status.fail { background: #ffebee; color: #c62828; }
</style>
