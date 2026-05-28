<template>
  <view class="page">
    <!-- 查询表单 -->
    <view class="search-card">
      <view class="form-item">
        <text class="form-label required">保洁师</text>
        <view class="seller-search-row">
          <input
            class="form-input"
            v-model="searchKeyword"
            placeholder="输入姓名或手机号搜索"
            @input="onSearchInput"
          />
          <button class="btn-small" @tap="toggleSellerList">选择</button>
        </view>
        <view class="seller-dropdown" v-if="showSellerList && filteredSellers.length > 0">
          <view
            v-for="s in filteredSellers.slice(0, 10)"
            :key="s.id"
            class="seller-item"
            @tap="selectSeller(s)"
          >
            <text class="seller-name">{{ s.name }}</text>
            <text class="seller-group">{{ s.group }}</text>
          </view>
        </view>
        <view class="selected-seller" v-if="selectedSeller">
          已选: <text class="seller-highlight">{{ selectedSeller.name }}</text>
          ({{ selectedSeller.group }})
        </view>
      </view>
      
      <view class="form-item">
        <text class="form-label required">查询月份</text>
        <picker mode="date" fields="month" :value="monthValue" @change="onMonthChange">
          <view class="picker-view">
            <text>{{ monthValue || '选择月份' }}</text>
            <text class="picker-arrow">▼</text>
          </view>
        </picker>
      </view>
      
      <button class="query-btn" @tap="handleQuery" :disabled="!canQuery || isLoading">
        {{ isLoading ? '查询中...' : '查询排班' }}
      </button>
    </view>

    <!-- 月历视图 -->
    <view class="calendar-card" v-if="scheduleData.length > 0">
      <view class="calendar-header">
        <text class="calendar-title">{{ monthValue }} 排班</text>
        <text class="calendar-seller">{{ selectedSeller?.name }}</text>
      </view>
      
      <!-- 日历网格 -->
      <view class="calendar-grid">
        <view class="week-header">
          <text v-for="d in ['一','二','三','四','五','六','日']" :key="d" class="week-label">{{ d }}</text>
        </view>
        
        <view class="days-grid">
          <!-- 补空格 -->
          <view v-for="n in firstDayOfWeek" :key="'empty'+n" class="day-cell empty"></view>
          <!-- 实际日期 -->
          <view
            v-for="day in calendarDays"
            :key="day.date"
            :class="['day-cell', { 'has-schedule': day.hasSchedule, 'no-schedule': !day.hasSchedule, 'today': day.isToday }]"
            @tap="day.hasSchedule && showDayDetail(day)"
          >
            <text class="day-number">{{ day.day }}</text>
            <view v-if="day.timeSlots && day.timeSlots.length > 0" class="time-dots">
              <view
                v-for="(slot, si) in day.timeSlots.slice(0, 3)"
                :key="si"
                :class="['time-dot', slot.status === '0' ? 'dot-free' : 'dot-busy']"
              ></view>
            </view>
          </view>
        </view>
      </view>
      
      <!-- 图例 -->
      <view class="legend">
        <view class="legend-item"><view class="legend-dot dot-free"></view><text>空闲</text></view>
        <view class="legend-item"><view class="legend-dot dot-busy"></view><text>已排班</text></view>
      </view>
    </view>

    <!-- 日详情弹窗 -->
    <view class="day-detail-mask" v-if="selectedDay" @tap.self="selectedDay = null">
      <view class="day-detail-box">
        <view class="day-detail-title">{{ selectedDay.date }} 排班详情</view>
        <scroll-view class="time-slots-scroll" scroll-y>
          <view
            v-for="slot in selectedDay.timeSlots"
            :key="slot.time"
            :class="['time-slot-row', slot.status === '0' ? 'free' : 'busy']"
          >
            <text class="slot-time">{{ slot.time }}</text>
            <text class="slot-status">{{ slot.status === '0' ? '空闲' : '已排班' }}</text>
          </view>
        </scroll-view>
        <button class="close-btn" @tap="selectedDay = null">关闭</button>
      </view>
    </view>
    
    <!-- 空状态 -->
    <view v-if="searched && scheduleData.length === 0 && !isLoading" class="empty-state">
      <text class="empty-icon">📅</text>
      <text class="empty-text">该月无排班数据</text>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getCookie, querySellerScheduleMonth } from '@/api/index.js'
import { loadSellerDB } from '@/api/index.js'

const searchKeyword = ref('')
const showSellerList = ref(false)
const selectedSeller = ref(null)
const sellers = ref([])
const monthValue = ref('')
const isLoading = ref(false)
const searched = ref(false)
const scheduleData = ref([])
const selectedDay = ref(null)

// 加载保洁师列表
onMounted(async () => {
  try {
    const db = await loadSellerDB()
    if (db && db.data) sellers.value = db.data
  } catch (e) {}
  
  // 默认当前月
  const now = new Date()
  monthValue.value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
})

const filteredSellers = computed(() => {
  if (!searchKeyword.value) return sellers.value.slice(0, 20)
  const kw = searchKeyword.value.toLowerCase()
  return sellers.value.filter(s =>
    s.name?.includes(kw) || s.group?.includes(kw) || s.id?.includes(kw)
  )
})

const canQuery = computed(() => selectedSeller.value && monthValue.value)

function onSearchInput() {
  showSellerList.value = true
}

function toggleSellerList() {
  showSellerList.value = !showSellerList.value
}

function selectSeller(s) {
  selectedSeller.value = s
  searchKeyword.value = s.name
  showSellerList.value = false
}

function onMonthChange(e) {
  monthValue.value = e.detail.value
}

async function handleQuery() {
  if (!canQuery.value) return
  
  const cookie = getCookie()
  if (!cookie) {
    uni.showToast({ title: '请先配置Cookie', icon: 'none', duration: 3000 })
    return
  }
  
  isLoading.value = true
  scheduleData.value = []
  searched.value = false
  
  try {
    const [year, month] = monthValue.value.split('-').map(Number)
    const data = await querySellerScheduleMonth(selectedSeller.value.id, year, month, cookie)
    scheduleData.value = data || []
    searched.value = true
  } catch (e) {
    uni.showToast({ title: e.message || '查询失败', icon: 'none', duration: 3000 })
    searched.value = true
  } finally {
    isLoading.value = false
  }
}

// 构建日历数据
const firstDayOfWeek = computed(() => {
  if (!monthValue.value) return 0
  const [y, m] = monthValue.value.split('-').map(Number)
  const first = new Date(y, m - 1, 1)
  // 周一=0, 周日=6
  return (first.getDay() + 6) % 7
})

const calendarDays = computed(() => {
  if (!monthValue.value) return []
  const [y, m] = monthValue.value.split('-').map(Number)
  const daysInMonth = new Date(y, m, 0).getDate()
  const today = new Date()
  const days = []
  
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    const item = scheduleData.value.find(s => (s.date || s.serviceDate || '').startsWith(dateStr))
    const isToday = today.getFullYear() === y && today.getMonth() + 1 === m && today.getDate() === d
    
    // 解析时间段
    let timeSlots = []
    if (item) {
      timeSlots = parseTimeSlots(item)
    }
    
    days.push({
      day: d,
      date: dateStr,
      hasSchedule: !!item,
      isToday,
      timeSlots,
      raw: item
    })
  }
  
  return days
})

function parseTimeSlots(item) {
  // 根据 API 返回格式解析时间段
  const slots = []
  
  // 格式1: item.timeSlots = [{time, status}]
  if (Array.isArray(item.timeSlots)) {
    return item.timeSlots
  }
  
  // 格式2: item.schedules = [{startTime, endTime, status}]
  if (Array.isArray(item.schedules)) {
    return item.schedules.map(s => ({
      time: s.startTime || s.time,
      status: s.status || (s.available ? '0' : '1')
    }))
  }
  
  // 格式3: 按时间段生成 7:00-22:00 每30分钟
  for (let h = 7; h < 22; h++) {
    for (const m of [0, 30]) {
      const time = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
      slots.push({ time, status: '0' }) // 默认空闲
    }
  }
  return slots
}

function showDayDetail(day) {
  selectedDay.value = day
}
</script>

<style scoped>
.page {
  background: #f5f5f5;
  min-height: 100vh;
  padding: 24rpx;
}

.search-card, .calendar-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.06);
}

.form-item { margin-bottom: 24rpx; }

.form-label {
  font-size: 26rpx;
  color: #555;
  margin-bottom: 10rpx;
  display: block;
}

.form-label.required::before { content: '* '; color: #e53e3e; }

.form-input {
  border: 1rpx solid #e0e0e0;
  border-radius: 12rpx;
  padding: 18rpx 24rpx;
  font-size: 28rpx;
  background: #fafafa;
}

.seller-search-row {
  display: flex;
  gap: 16rpx;
  align-items: center;
}

.seller-search-row .form-input { flex: 1; }

.btn-small {
  background: #f0f4ff;
  color: #1a73e8;
  border-radius: 12rpx;
  padding: 18rpx 24rpx;
  font-size: 26rpx;
  border: none;
  white-space: nowrap;
}

.seller-dropdown {
  border: 1rpx solid #e0e0e0;
  border-radius: 12rpx;
  margin-top: 8rpx;
  background: #fff;
  box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.1);
}

.seller-item {
  padding: 16rpx 24rpx;
  border-bottom: 1rpx solid #f5f5f5;
  display: flex;
  justify-content: space-between;
}

.seller-item:last-child { border-bottom: none; }

.seller-name { font-size: 28rpx; color: #333; }
.seller-group { font-size: 22rpx; color: #999; }

.selected-seller {
  margin-top: 10rpx;
  font-size: 24rpx;
  color: #666;
}

.seller-highlight { color: #1a73e8; font-weight: 500; }

.picker-view {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border: 1rpx solid #e0e0e0;
  border-radius: 12rpx;
  padding: 18rpx 24rpx;
  font-size: 28rpx;
  background: #fafafa;
}

.picker-arrow { font-size: 22rpx; color: #999; }

.query-btn {
  width: 100%;
  background: #1a73e8;
  color: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  font-size: 30rpx;
  font-weight: 500;
  border: none;
}

.query-btn[disabled] { background: #b0c4de; }

/* 日历 */
.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.calendar-title { font-size: 30rpx; font-weight: 600; color: #333; }
.calendar-seller { font-size: 26rpx; color: #1a73e8; }

.week-header {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  text-align: center;
  margin-bottom: 8rpx;
}

.week-label { font-size: 22rpx; color: #999; padding: 8rpx 0; }

.days-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4rpx;
}

.day-cell {
  border-radius: 8rpx;
  padding: 8rpx 0;
  text-align: center;
  min-height: 80rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.day-cell.empty {}

.day-cell.today .day-number {
  background: #1a73e8;
  color: #fff;
  width: 44rpx;
  height: 44rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.day-cell.has-schedule { background: #f0f9eb; }
.day-cell.no-schedule { background: #f9f9f9; }

.day-number { font-size: 26rpx; color: #333; }

.time-dots {
  display: flex;
  gap: 4rpx;
  margin-top: 4rpx;
}

.time-dot, .legend-dot {
  width: 10rpx;
  height: 10rpx;
  border-radius: 50%;
}

.dot-free { background: #4caf50; }
.dot-busy { background: #ff9800; }

.legend {
  display: flex;
  gap: 32rpx;
  justify-content: center;
  margin-top: 20rpx;
  padding-top: 16rpx;
  border-top: 1rpx solid #f0f0f0;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8rpx;
  font-size: 22rpx;
  color: #666;
}

/* 日详情弹窗 */
.day-detail-mask {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.4);
  display: flex;
  align-items: flex-end;
  z-index: 9999;
}

.day-detail-box {
  background: #fff;
  border-radius: 24rpx 24rpx 0 0;
  padding: 32rpx;
  width: 100%;
  max-height: 70vh;
  display: flex;
  flex-direction: column;
}

.day-detail-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 20rpx;
  text-align: center;
}

.time-slots-scroll { flex: 1; max-height: 500rpx; }

.time-slot-row {
  display: flex;
  justify-content: space-between;
  padding: 16rpx 0;
  border-bottom: 1rpx solid #f5f5f5;
}

.time-slot-row.free { background: transparent; }
.time-slot-row.busy { background: #fff3e0; }

.slot-time { font-size: 28rpx; color: #333; }
.slot-status { font-size: 26rpx; }

.time-slot-row.free .slot-status { color: #4caf50; }
.time-slot-row.busy .slot-status { color: #ff9800; }

.close-btn {
  margin-top: 20rpx;
  background: #f0f4ff;
  color: #1a73e8;
  border-radius: 12rpx;
  padding: 20rpx;
  font-size: 28rpx;
  border: none;
}

.empty-state {
  text-align: center;
  padding: 80rpx;
  color: #999;
}

.empty-icon { font-size: 80rpx; display: block; margin-bottom: 16rpx; }
.empty-text { font-size: 28rpx; }
</style>
