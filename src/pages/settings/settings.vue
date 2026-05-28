<template>
  <view class="page">
    <!-- Cookie 设置 -->
    <view class="card">
      <view class="section-title">
        <text>Cookie 设置</text>
        <view :class="['status-dot', cookieStatus.valid ? 'dot-valid' : 'dot-invalid']"></view>
      </view>
      
      <view class="status-banner" :class="cookieStatus.valid ? 'banner-valid' : 'banner-invalid'">
        {{ cookieStatus.message }}
      </view>
      
      <view class="form-item" style="margin-top:20rpx;">
        <text class="form-label">Cookie 内容</text>
        <textarea
          class="cookie-input"
          v-model="cookieText"
          placeholder="请粘贴从浏览器复制的 Cookie 字符串"
          :auto-height="true"
          :maxlength="5000"
        />
        <text class="hint-text">
          获取方法：打开 jz-bjcrm.daojia-inc.com → F12 → Network → 任意请求 → Headers → Cookie
        </text>
      </view>
      
      <view class="btn-row">
        <button class="btn-secondary" @tap="handleTestCookie" :disabled="isTesting">
          {{ isTesting ? '验证中...' : '验证Cookie' }}
        </button>
        <button class="btn-primary" @tap="handleSaveCookie" :disabled="!cookieText.trim()">
          保存
        </button>
      </view>
    </view>

    <!-- 服务器配置 -->
    <view class="card">
      <view class="section-title">服务器配置</view>
      
      <view class="form-item">
        <text class="form-label">CRM地址</text>
        <input class="form-input" v-model="config.crmUrl" placeholder="https://jz-bjcrm.daojia-inc.com" />
      </view>
      
      <view class="form-item">
        <text class="form-label">城市ID</text>
        <input class="form-input" v-model="config.cityId" placeholder="102 (成都)" type="number" />
      </view>
      
      <button class="btn-primary" @tap="saveConfig" style="margin-top:16rpx;">保存配置</button>
    </view>

    <!-- 关于 -->
    <view class="card about-card">
      <view class="about-row">
        <text class="about-label">版本</text>
        <text class="about-value">v2.5.0</text>
      </view>
      <view class="about-row">
        <text class="about-label">功能</text>
        <text class="about-value">品类下单 · 套餐单次/周期 · 订单查询 · 排班查询</text>
      </view>
      <view class="about-row">
        <text class="about-label">支持品类</text>
        <text class="about-value">保洁、空调、冰箱、油烟机等28种</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { getCookie, setCookie, validateCookie } from '@/api/index.js'

const cookieText = ref('')
const isTesting = ref(false)
const cookieStatus = reactive({ valid: false, message: '未验证' })

const config = reactive({
  crmUrl: 'https://jz-bjcrm.daojia-inc.com',
  cityId: '102'
})

onMounted(() => {
  cookieText.value = getCookie()
  const savedConfig = uni.getStorageSync('app_config')
  if (savedConfig) Object.assign(config, savedConfig)
  
  // 自动验证已存 Cookie
  if (cookieText.value) {
    testCurrentCookie()
  }
})

async function testCurrentCookie() {
  const ck = cookieText.value.trim()
  if (!ck) return
  const result = await validateCookie(ck)
  Object.assign(cookieStatus, result)
}

async function handleTestCookie() {
  const ck = cookieText.value.trim()
  if (!ck) {
    uni.showToast({ title: '请输入Cookie', icon: 'none' })
    return
  }
  isTesting.value = true
  try {
    const result = await validateCookie(ck)
    Object.assign(cookieStatus, result)
    uni.showToast({
      title: result.valid ? '✓ Cookie有效' : '✗ ' + result.message,
      icon: result.valid ? 'success' : 'none',
      duration: 2500
    })
  } finally {
    isTesting.value = false
  }
}

function handleSaveCookie() {
  const ck = cookieText.value.trim()
  if (!ck) return
  setCookie(ck)
  uni.showToast({ title: '保存成功', icon: 'success' })
  testCurrentCookie()
}

function saveConfig() {
  uni.setStorageSync('app_config', config)
  uni.showToast({ title: '配置已保存', icon: 'success' })
}
</script>

<style scoped>
.page {
  background: #f5f5f5;
  min-height: 100vh;
  padding: 24rpx;
}

.card {
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.06);
}

.section-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 20rpx;
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.status-dot {
  width: 16rpx;
  height: 16rpx;
  border-radius: 50%;
}

.dot-valid { background: #4caf50; }
.dot-invalid { background: #f44336; }

.status-banner {
  border-radius: 10rpx;
  padding: 16rpx 20rpx;
  font-size: 26rpx;
  margin-bottom: 16rpx;
}

.banner-valid { background: #e8f5e9; color: #2e7d32; }
.banner-invalid { background: #fff3e0; color: #e65100; }

.form-item { margin-bottom: 20rpx; }

.form-label {
  font-size: 26rpx;
  color: #555;
  margin-bottom: 10rpx;
  display: block;
}

.form-input, .cookie-input {
  width: 100%;
  border: 1rpx solid #e0e0e0;
  border-radius: 12rpx;
  padding: 18rpx 24rpx;
  font-size: 26rpx;
  background: #fafafa;
  box-sizing: border-box;
}

.cookie-input {
  min-height: 120rpx;
  font-family: monospace;
  font-size: 22rpx;
}

.hint-text {
  font-size: 22rpx;
  color: #999;
  margin-top: 8rpx;
  display: block;
  line-height: 1.6;
}

.btn-row {
  display: flex;
  gap: 16rpx;
}

.btn-row button {
  flex: 1;
  border: none;
  border-radius: 12rpx;
  padding: 20rpx;
  font-size: 28rpx;
}

.btn-primary { background: #1a73e8; color: #fff; }
.btn-primary[disabled] { background: #b0c4de; }
.btn-secondary { background: #f0f4ff; color: #1a73e8; }
.btn-secondary[disabled] { background: #e0e0e0; color: #999; }

.about-card {}
.about-row {
  display: flex;
  padding: 12rpx 0;
  border-bottom: 1rpx solid #f5f5f5;
}
.about-row:last-child { border-bottom: none; }
.about-label { width: 140rpx; font-size: 24rpx; color: #999; flex-shrink: 0; }
.about-value { flex: 1; font-size: 24rpx; color: #333; }
</style>
