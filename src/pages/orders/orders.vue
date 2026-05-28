<template>
  <view class="page">
    <!-- 状态筛选标签 -->
    <scroll-view scroll-x class="status-tabs">
      <view class="tabs-wrap">
        <view
          v-for="tab in statusTabs"
          :key="tab.value"
          :class="['tab-item', { active: currentStatus === tab.value }]"
          @tap="switchStatus(tab.value)"
        >
          {{ tab.label }}
        </view>
      </view>
    </scroll-view>

    <!-- 搜索栏 -->
    <view class="search-bar">
      <input
        class="search-input"
        v-model="searchKeyword"
        placeholder="搜索订单号/手机号"
        @confirm="doSearch"
      />
      <button class="search-btn" @tap="doSearch">搜索</button>
    </view>

    <!-- 订单列表 -->
    <scroll-view
      scroll-y
      class="order-list"
      @scrolltolower="loadMore"
      :refresher-enabled="true"
      :refresher-triggered="isRefreshing"
      @refresherrefresh="onRefresh"
    >
      <view v-if="orders.length === 0 && !isLoading" class="empty-state">
        <text class="empty-icon">📋</text>
        <text class="empty-text">暂无订单数据</text>
      </view>

      <view
        v-for="order in orders"
        :key="order.orderId || order.id"
        class="order-card"
        @tap="goDetail(order)"
      >
        <!-- 顶栏：订单ID + 状态 -->
        <view class="order-header">
          <text class="order-no">{{ order.orderNo || order.orderId || order.id }}</text>
          <view :class="['status-badge', statusClass(order.status)]">
            {{ order.statusText || statusMap[order.status] || '未知' }}
          </view>
        </view>

        <!-- 服务信息 -->
        <view class="order-body">
          <view class="order-row">
            <text class="order-label">服务类型</text>
            <text class="order-value">{{ order.serviceName || order.orderTypeName || '-' }}</text>
          </view>
          <view class="order-row">
            <text class="order-label">服务时间</text>
            <text class="order-value">{{ order.serviceTime || '-' }}</text>
          </view>
          <view class="order-row">
            <text class="order-label">服务地址</text>
            <text class="order-value addr">{{ order.address || '-' }}</text>
          </view>
          <view class="order-row">
            <text class="order-label">客户手机</text>
            <text class="order-value">{{ order.userMobile || order.userPhone || '-' }}</text>
          </view>
          <view class="order-row" v-if="order.sellerName">
            <text class="order-label">保洁师</text>
            <text class="order-value seller">{{ order.sellerName }}</text>
          </view>
        </view>

        <!-- 底栏：金额 + 时间 -->
        <view class="order-footer">
          <text class="order-amount" v-if="order.amount || order.payAmount">
            ¥{{ order.amount || order.payAmount }}
          </text>
          <text class="order-time">{{ order.createTime || order.createDate || '' }}</text>
        </view>
      </view>

      <!-- 加载更多提示 -->
      <view v-if="isLoadingMore" class="load-more">
        <text>加载中...</text>
      </view>
      <view v-if="noMore && orders.length > 0" class="load-more">
        <text>— 没有更多了 —</text>
      </view>
    </scroll-view>

    <!-- 初始加载 -->
    <view v-if="isLoading && orders.length === 0" class="loading-center">
      <view class="loading-spinner"></view>
      <text class="loading-text">加载订单列表...</text>
    </view>
  </view>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { getCookie, queryOrderList } from '@/api/index.js'

// 状态映射
const statusMap = { 0: '待分配', 1: '待服务', 2: '服务中', 3: '已完成', 4: '已取消', 5: '已评价' }

const statusTabs = [
  { label: '全部', value: '' },
  { label: '待分配', value: '0' },
  { label: '待服务', value: '1' },
  { label: '服务中', value: '2' },
  { label: '已完成', value: '3' },
  { label: '已取消', value: '4' }
]

const currentStatus = ref('')
const searchKeyword = ref('')
const orders = ref([])
const isLoading = ref(false)
const isLoadingMore = ref(false)
const isRefreshing = ref(false)
const noMore = ref(false)
const pageNo = ref(1)
const pageSize = 20

function statusClass(status) {
  return ['s-pending', 's-assigned', 's-serving', 's-done', 's-cancelled', 's-rated'][status] || 's-unknown'
}

function switchStatus(val) {
  currentStatus.value = val
  resetAndLoad()
}

function doSearch() {
  resetAndLoad()
}

async function resetAndLoad() {
  pageNo.value = 1
  orders.value = []
  noMore.value = false
  await loadOrders()
}

async function loadOrders() {
  const cookie = getCookie()
  if (!cookie) {
    uni.showToast({ title: '请先在设置页配置Cookie', icon: 'none', duration: 3000 })
    return
  }

  if (pageNo.value === 1) {
    isLoading.value = true
  } else {
    isLoadingMore.value = true
  }

  try {
    const params = {
      pageNo: pageNo.value,
      pageSize,
      status: currentStatus.value || undefined,
      keyword: searchKeyword.value.trim() || undefined
    }
    console.log('[订单列表] 请求参数:', JSON.stringify(params))
    const result = await queryOrderList(params, cookie)
    
    if (result.list && result.list.length > 0) {
      orders.value = pageNo.value === 1
        ? result.list
        : [...orders.value, ...result.list]
      noMore.value = result.list.length < pageSize
    } else {
      noMore.value = true
    }
  } catch (e) {
    console.error('[订单列表] 加载失败:', e.message)
    uni.showToast({ title: e.message || '加载失败', icon: 'none', duration: 2000 })
  } finally {
    isLoading.value = false
    isLoadingMore.value = false
    isRefreshing.value = false
  }
}

async function loadMore() {
  if (isLoadingMore.value || noMore.value) return
  pageNo.value++
  await loadOrders()
}

async function onRefresh() {
  isRefreshing.value = true
  pageNo.value = 1
  await loadOrders()
}

function goDetail(order) {
  const orderId = order.orderId || order.id || order.orderNo
  if (!orderId) return
  uni.navigateTo({
    url: `/pages/order/detail?orderId=${orderId}`
  })
}

onMounted(() => {
  loadOrders()
})
</script>

<style scoped>
.page {
  background: #f5f5f5;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* 状态筛选 */
.status-tabs {
  background: #fff;
  white-space: nowrap;
  box-shadow: 0 1rpx 0 rgba(0,0,0,0.06);
}

.tabs-wrap {
  display: inline-flex;
  padding: 16rpx 20rpx;
  gap: 12rpx;
}

.tab-item {
  padding: 12rpx 24rpx;
  border-radius: 24rpx;
  font-size: 24rpx;
  color: #666;
  background: #f5f5f5;
  flex-shrink: 0;
}

.tab-item.active {
  background: #1a73e8;
  color: #fff;
}

/* 搜索栏 */
.search-bar {
  display: flex;
  padding: 16rpx 24rpx;
  background: #fff;
  gap: 16rpx;
  align-items: center;
}

.search-input {
  flex: 1;
  border: 1rpx solid #e0e0e0;
  border-radius: 24rpx;
  padding: 14rpx 24rpx;
  font-size: 26rpx;
  background: #f8f8f8;
}

.search-btn {
  background: #1a73e8;
  color: #fff;
  border-radius: 24rpx;
  padding: 14rpx 28rpx;
  font-size: 26rpx;
  border: none;
  white-space: nowrap;
}

/* 订单列表 */
.order-list {
  flex: 1;
  padding: 12rpx 24rpx;
}

.order-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 20rpx 24rpx;
  margin-bottom: 16rpx;
  box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.04);
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 14rpx;
  border-bottom: 1rpx solid #f0f0f0;
  margin-bottom: 12rpx;
}

.order-no {
  font-size: 26rpx;
  color: #333;
  font-weight: 500;
}

.status-badge {
  padding: 4rpx 16rpx;
  border-radius: 20rpx;
  font-size: 22rpx;
}

.s-pending { background: #fff3e0; color: #e65100; }
.s-assigned { background: #e3f2fd; color: #1565c0; }
.s-serving { background: #e8f5e9; color: #2e7d32; }
.s-done { background: #e8f5e9; color: #2e7d32; }
.s-cancelled { background: #ffebee; color: #c62828; }
.s-rated { background: #e3f2fd; color: #1565c0; }
.s-unknown { background: #f5f5f5; color: #666; }

.order-body {
  margin-bottom: 8rpx;
}

.order-row {
  display: flex;
  padding: 8rpx 0;
}

.order-label {
  width: 130rpx;
  font-size: 24rpx;
  color: #999;
  flex-shrink: 0;
}

.order-value {
  flex: 1;
  font-size: 24rpx;
  color: #333;
  word-break: break-all;
}

.order-value.addr {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.order-value.seller {
  color: #1a73e8;
}

.order-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12rpx;
  border-top: 1rpx solid #f5f5f5;
}

.order-amount {
  font-size: 26rpx;
  color: #e53e3e;
  font-weight: 600;
}

.order-time {
  font-size: 22rpx;
  color: #ccc;
}

/* 加载状态 */
.loading-center {
  text-align: center;
  padding: 80rpx;
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

.load-more {
  text-align: center;
  padding: 24rpx;
  font-size: 24rpx;
  color: #ccc;
}

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

.empty-text { font-size: 28rpx; }
</style>
