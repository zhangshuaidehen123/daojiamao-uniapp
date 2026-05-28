<template>
  <view class="page">
    <view class="toolbar">
      <text class="log-count">共 {{ logs.length }} 条日志</text>
      <button class="clear-btn" @tap="clearLogs">清空</button>
    </view>
    
    <scroll-view class="log-list" scroll-y>
      <view
        v-for="(log, i) in logs"
        :key="i"
        :class="['log-item', `log-${log.level}`]"
      >
        <text class="log-time">{{ formatTime(log.time) }}</text>
        <text class="log-msg">{{ log.msg }}</text>
      </view>
      <view v-if="logs.length === 0" class="empty-state">
        <text class="empty-icon">📋</text>
        <text class="empty-text">暂无日志记录</text>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const logs = ref([])

onMounted(loadLogs)

function loadLogs() {
  logs.value = (uni.getStorageSync('app_logs') || []).slice(0, 200)
}

function clearLogs() {
  uni.showModal({
    title: '确认',
    content: '清空所有日志？',
    success(res) {
      if (res.confirm) {
        uni.setStorageSync('app_logs', [])
        logs.value = []
      }
    }
  })
}

function formatTime(iso) {
  try {
    const d = new Date(iso)
    return `${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}`
  } catch (e) { return iso || '' }
}
</script>

<style scoped>
.page { background: #f5f5f5; min-height: 100vh; display: flex; flex-direction: column; }

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16rpx 24rpx;
  background: #fff;
  border-bottom: 1rpx solid #e0e0e0;
}

.log-count { font-size: 24rpx; color: #666; }

.clear-btn {
  background: #ffebee;
  color: #c62828;
  border-radius: 8rpx;
  padding: 10rpx 20rpx;
  font-size: 24rpx;
  border: none;
}

.log-list { flex: 1; height: calc(100vh - 100rpx); }

.log-item {
  padding: 16rpx 24rpx;
  border-bottom: 1rpx solid #f5f5f5;
  display: flex;
  gap: 16rpx;
  align-items: flex-start;
}

.log-item.log-success { background: #f0fff0; }
.log-item.log-error { background: #fff0f0; }
.log-item.log-warn { background: #fffbe6; }
.log-item.log-info { background: #fff; }

.log-time { font-size: 22rpx; color: #999; white-space: nowrap; flex-shrink: 0; }
.log-msg { font-size: 24rpx; color: #333; flex: 1; word-break: break-all; }

.empty-state { text-align: center; padding: 80rpx; color: #999; }
.empty-icon { font-size: 80rpx; display: block; margin-bottom: 16rpx; }
.empty-text { font-size: 28rpx; }
</style>
