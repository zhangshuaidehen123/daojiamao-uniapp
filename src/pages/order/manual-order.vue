<template>
  <view class="page">
    <!-- 订单类型选择 -->
    <view class="card">
      <view class="section-title">订单类型</view>
      <view class="type-tabs">
        <view
          v-for="tab in orderTypeTabs"
          :key="tab.value"
          :class="['type-tab', { active: form.order_type === tab.value }]"
          @tap="switchOrderType(tab.value)"
        >
          {{ tab.label }}
        </view>
      </view>
    </view>

    <!-- 基础信息 -->
    <view class="card">
      <view class="section-title">客户信息</view>
      
      <view class="form-item">
        <text class="form-label required">客户手机号</text>
        <input
          class="form-input"
          type="number"
          v-model="form.phone"
          placeholder="请输入11位手机号"
          maxlength="11"
        />
      </view>
      
      <view class="form-item">
        <text class="form-label required">服务地址</text>
        <textarea
          class="form-input"
          v-model="form.address"
          placeholder="请输入详细地址，如：成都市武侯区XX路XX号XX室"
          :auto-height="true"
          :maxlength="200"
        />
      </view>
      
      <view class="form-item" v-if="form.order_type !== 'combo_cycle'">
        <text class="form-label required">服务时间</text>
        <view class="date-row">
          <picker mode="date" :value="dateValue" @change="onDateChange">
            <view class="date-picker">
              <text>{{ dateValue || '选择日期' }}</text>
            </view>
          </picker>
          <picker mode="time" :value="timeValue" @change="onTimeChange">
            <view class="date-picker">
              <text>{{ timeValue || '选择时间' }}</text>
            </view>
          </picker>
        </view>
      </view>
    </view>

    <!-- 品类下单专属 -->
    <view class="card" v-if="form.order_type === 'category'">
      <view class="section-title">品类信息</view>
      
      <view class="form-item">
        <text class="form-label required">服务品类</text>
        <picker :range="categoryList" range-key="label" @change="onCategoryChange">
          <view class="picker-view">
            <text>{{ selectedCategoryName || '请选择品类' }}</text>
            <text class="picker-arrow">▼</text>
          </view>
        </picker>
      </view>
      
      <view class="form-item" v-if="form.category">
        <text class="form-label">规格描述（可选）</text>
        <input
          class="form-input"
          v-model="form.spec_text"
          placeholder="如：2台、80平等，不填自动匹配"
        />
      </view>
    </view>

    <!-- 套餐单次专属 -->
    <view class="card" v-if="form.order_type === 'combo_single'">
      <view class="section-title">套餐信息</view>
      
      <view class="form-item">
        <text class="form-label required">套餐类型</text>
        <picker :range="comboHintList" @change="e => form.combo_hint = comboHintList[e.detail.value]">
          <view class="picker-view">
            <text>{{ form.combo_hint || '请选择套餐' }}</text>
            <text class="picker-arrow">▼</text>
          </view>
        </picker>
      </view>
    </view>

    <!-- 套餐周期单专属 -->
    <view class="card" v-if="form.order_type === 'combo_cycle'">
      <view class="section-title">周期单信息</view>
      
      <view class="form-item">
        <text class="form-label required">套餐类型</text>
        <picker :range="comboHintList" @change="e => form.combo_hint = comboHintList[e.detail.value]">
          <view class="picker-view">
            <text>{{ form.combo_hint || '请选择套餐' }}</text>
            <text class="picker-arrow">▼</text>
          </view>
        </picker>
      </view>
      
      <view class="form-item">
        <text class="form-label required">每周服务日</text>
        <view class="weekday-group">
          <view
            v-for="wd in weekdays"
            :key="wd.value"
            :class="['weekday-item', { active: form.weekday_text === wd.label }]"
            @tap="form.weekday_text = wd.label"
          >
            {{ wd.label }}
          </view>
        </view>
      </view>
      
      <view class="form-item">
        <text class="form-label required">开始时间</text>
        <picker mode="date" :value="form.first_service_date" @change="e => form.first_service_date = e.detail.value">
          <view class="picker-view">
            <text>{{ form.first_service_date || '选择首次服务日期' }}</text>
            <text class="picker-arrow">▼</text>
          </view>
        </picker>
      </view>
      
      <view class="form-item">
        <text class="form-label required">服务时段</text>
        <picker mode="time" :value="form.time_slot" @change="e => form.time_slot = e.detail.value">
          <view class="picker-view">
            <text>{{ form.time_slot || '选择时间' }}</text>
            <text class="picker-arrow">▼</text>
          </view>
        </picker>
      </view>
      
      <view class="form-item">
        <text class="form-label required">服务频率</text>
        <picker :range="frequencyList" @change="e => form.frequency = frequencyList[e.detail.value]">
          <view class="picker-view">
            <text>{{ form.frequency }}</text>
            <text class="picker-arrow">▼</text>
          </view>
        </picker>
      </view>
    </view>

    <!-- 保洁师分配 -->
    <view class="card">
      <view class="section-title">保洁师分配</view>
      
      <view class="form-item">
        <text class="form-label">分配方式</text>
        <view class="radio-group">
          <view
            v-for="mode in assignModes"
            :key="mode"
            :class="['radio-item', { active: form.assign_mode === mode }]"
            @tap="form.assign_mode = mode"
          >
            {{ mode }}
          </view>
        </view>
      </view>
      
      <view class="form-item" v-if="form.assign_mode === '指定'">
        <text class="form-label required">保洁师手机号</text>
        <input
          class="form-input"
          type="number"
          v-model="form.seller_mobile"
          placeholder="请输入保洁师手机号"
          maxlength="11"
        />
      </view>
    </view>

    <!-- 备注 -->
    <view class="card">
      <view class="form-item">
        <text class="form-label">备注</text>
        <textarea
          class="form-input"
          v-model="form.remark"
          placeholder="可填写特殊要求，如：收现金"
          :auto-height="true"
          :maxlength="200"
        />
      </view>
    </view>

    <!-- 提交按钮 -->
    <view class="submit-area">
      <button
        :class="['btn-primary', 'submit-btn']"
        :disabled="!canSubmit || isSubmitting"
        @tap="handleSubmit"
      >
        {{ isSubmitting ? '下单中...' : '立即下单' }}
      </button>
    </view>

    <!-- 下单结果弹窗 -->
    <view class="result-mask" v-if="orderResult.show">
      <view class="result-box">
        <view :class="['result-icon', orderResult.success ? 'success' : 'error']">
          {{ orderResult.success ? '✓' : '✗' }}
        </view>
        <view class="result-title">{{ orderResult.success ? '下单成功' : '下单失败' }}</view>
        <view class="result-message">{{ orderResult.message }}</view>
        <view class="result-orderid" v-if="orderResult.orderId">
          订单号: {{ orderResult.orderId }}
        </view>
        <view class="result-actions">
          <button class="btn-secondary" @tap="orderResult.show = false">关闭</button>
          <button class="btn-primary" @tap="resetForm" v-if="orderResult.success">继续下单</button>
          <button class="btn-primary" style="background:#e53e3e;" @tap="handleSubmit" v-else>重试</button>
        </view>
      </view>
    </view>

    <!-- 加载遮罩 -->
    <view class="loading-mask" v-if="isSubmitting">
      <view class="loading-box">
        <view class="loading-spinner"></view>
        <text class="loading-text">{{ loadingText }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import {
  getCookie, validateCookie,
  createCategoryOrder, queryUserCombo, getComboServiceInfo, addComboServiceInfo,
  createComboSingleOrder, createComboCycleOrder, getComboDetail,
  checkAddress, getSellerIdByMobile, findNearestSeller, getOrderValidTimeBySeller,
  listFirstServiceTime
} from '@/api/index.js'
import {
  CATEGORY_CONFIG, KEYWORD_CATEGORY_MAP, getCategoryList, smartMatchSpec, calcOrderCount
} from '@/api/category.js'

// ===== 常量 =====
const orderTypeTabs = [
  { value: 'category', label: '品类单' },
  { value: 'combo_single', label: '套餐单次' },
  { value: 'combo_cycle', label: '套餐周期' }
]

const comboHintList = ['日常保洁', '做饭', '养宠', '除菌', '大扫除']
const assignModes = ['随机', '指定']
const weekdays = [
  { label: '周一', value: '1' }, { label: '周二', value: '2' },
  { label: '周三', value: '3' }, { label: '周四', value: '4' },
  { label: '周五', value: '5' }, { label: '周六', value: '6' },
  { label: '周日', value: '7' }
]
const frequencyList = ['每周一次', '两周一次', '每月一次']
const categoryList = getCategoryList()

// ===== 状态 =====
const dateValue = ref('')
const timeValue = ref('14:00')
const isSubmitting = ref(false)
const loadingText = ref('正在下单...')

const form = reactive({
  order_type: 'category',
  phone: '',
  address: '',
  category: '',        // 品类 serviceId
  spec_text: '',       // 规格描述
  service_time: '',    // 完整服务时间 "2026-05-28 14:00"
  assign_mode: '随机',
  seller_mobile: '',
  remark: '',
  combo_hint: '日常保洁',
  first_service_date: '',
  weekday_text: '周三',
  time_slot: '10:00',
  service_duration: 2,
  frequency: '两周一次'
})

const orderResult = reactive({
  show: false,
  success: false,
  message: '',
  orderId: ''
})

// ===== 计算属性 =====
const selectedCategoryName = computed(() => {
  if (!form.category) return ''
  const cfg = CATEGORY_CONFIG[form.category]
  return cfg ? cfg.name : ''
})

const cycleServiceTime = computed(() => {
  if (!form.first_service_date || !form.time_slot) return null
  return `${form.first_service_date} ${form.time_slot}`
})

const canSubmit = computed(() => {
  if (!form.phone || !form.address) return false
  if (form.order_type === 'category') {
    if (!form.category || !form.service_time) return false
  }
  if (form.order_type === 'combo_single') {
    if (!form.combo_hint || !form.service_time) return false
  }
  if (form.order_type === 'combo_cycle') {
    if (!form.combo_hint || !cycleServiceTime.value) return false
  }
  if (form.assign_mode === '指定' && !form.seller_mobile) return false
  return true
})

// ===== 方法 =====
function switchOrderType(type) {
  form.order_type = type
  if (type !== 'category') form.category = ''
  if (type === 'category') form.combo_hint = ''
  form.spec_text = ''
}

function onDateChange(e) {
  dateValue.value = e.detail.value
  updateServiceTime()
}

function onTimeChange(e) {
  timeValue.value = e.detail.value
  updateServiceTime()
}

function updateServiceTime() {
  if (dateValue.value && timeValue.value) {
    form.service_time = `${dateValue.value} ${timeValue.value}`
  }
}

function onCategoryChange(e) {
  const item = categoryList[e.detail.value]
  if (item) form.category = item.value
}

// 初始化默认日期（明天）
onMounted(() => {
  const tomorrow = new Date(Date.now() + 86400000)
  dateValue.value = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`
  form.first_service_date = dateValue.value
  updateServiceTime()
})

// ===== 下单核心逻辑 =====
async function handleSubmit() {
  if (!canSubmit.value) return
  
  const cookie = getCookie()
  if (!cookie) {
    uni.showToast({ title: '请先在设置页配置Cookie', icon: 'none', duration: 3000 })
    return
  }
  
  isSubmitting.value = true
  loadingText.value = '验证Cookie...'
  
  try {
    // 验证 Cookie
    const validation = await validateCookie(cookie)
    if (!validation.valid) {
      throw new Error(`Cookie无效: ${validation.message}`)
    }
    
    let result
    if (form.order_type === 'category') {
      result = await placeCategoryOrder(cookie)
    } else if (form.order_type === 'combo_single') {
      result = await placeComboSingleOrder(cookie)
    } else if (form.order_type === 'combo_cycle') {
      result = await placeComboCycleOrder(cookie)
    }
    
    orderResult.success = true
    orderResult.message = result.message || '下单成功'
    orderResult.orderId = result.orderId || ''
    orderResult.show = true
    
    // 记录日志
    saveLog('success', `下单成功: ${orderResult.orderId}`)
    
  } catch (e) {
    orderResult.success = false
    orderResult.message = e.message || '下单失败'
    orderResult.orderId = ''
    orderResult.show = true
    
    saveLog('error', `下单失败: ${e.message}`)
    
  } finally {
    isSubmitting.value = false
  }
}

/**
 * 品类下单流程
 */
async function placeCategoryOrder(cookie) {
  const categoryId = form.category
  const cfg = CATEGORY_CONFIG[categoryId]
  if (!cfg) throw new Error('请选择品类')
  
  const spuCode = cfg.spuCode
  const serviceId = categoryId
  
  loadingText.value = '解析地址坐标...'
  const { location, addressName } = await checkAddress(form.address, cookie)
  
  loadingText.value = '获取产品规格...'
  // Bug修复：原版尝试多种 serviceId/spuCode 组合
  const { getAllSpecs } = await import('@/api/index.js')
  // 直接调用 getProductAllSpecV3
  const specs = await getAllSpecs(serviceId, spuCode, cookie)
  if (!specs || specs.length === 0) throw new Error(`未找到品类规格: ${cfg.name}`)
  
  const bestSpec = smartMatchSpec(specs, categoryId, form.spec_text, form.detail)
  if (!bestSpec) throw new Error('规格匹配失败')
  
  const count = calcOrderCount(categoryId, bestSpec.specName, '', form.spec_text)
  const { specId, price, skuBarCode } = bestSpec
  
  loadingText.value = '获取优惠券...'
  // Bug修复：优惠券必须存在，否则报错
  const couponId = await getBestCoupon(form.phone, categoryId, skuBarCode, price, cookie)
  if (!couponId) throw new Error('无可用优惠券，或券金额为0，请检查')
  
  // 分配保洁师
  let sellerId = null
  if (form.assign_mode === '指定') {
    loadingText.value = '查找指定保洁师...'
    sellerId = await getSellerIdByMobile(form.seller_mobile, location, addressName, cookie)
    if (!sellerId) throw new Error(`未找到保洁师 ${form.seller_mobile}（未注册或超出50km范围）`)
  } else {
    loadingText.value = '搜索附近保洁师...'
    sellerId = await findNearestSeller(serviceId, form.service_time, 4, location, addressName, cookie)
    if (!sellerId) throw new Error('7km范围内无可用保洁师')
  }
  
  loadingText.value = '提交订单...'
  const res = await createCategoryOrder({
    userMobile: form.phone,
    sellerId,
    serviceId,
    spuCode,
    specId,
    count,
    address: addressName,
    doorNumber: '',
    location,
    serviceTime: form.service_time,
    couponId
  }, cookie)
  
  if (res.code !== 1 || !res.data) {
    const errMsg = res.message || JSON.stringify(res)
    throw new Error(`下单失败: ${errMsg}`)
  }
  
  return { message: `✓ 品类下单成功！订单号: ${res.data}`, orderId: String(res.data) }
}

/**
 * 套餐单次下单流程
 */
async function placeComboSingleOrder(cookie) {
  loadingText.value = '查询用户套餐...'
  const combo = await queryUserCombo(form.phone, form.combo_hint, cookie)
  if (!combo) throw new Error(`该用户无可用套餐（关键词: ${form.combo_hint}），请确认套餐是否已购或已用完`)
  
  const comboId = combo.comboId || combo.id
  
  loadingText.value = '解析地址坐标...'
  const { location, addressName } = await checkAddress(form.address, cookie)
  
  loadingText.value = '匹配服务地址...'
  const serviceInfoId = await findOrCreateServiceInfo(comboId, addressName, form.address, location, cookie)
  if (!serviceInfoId) throw new Error('无法获取套餐服务地址ID')
  
  loadingText.value = '分配保洁师...'
  let sellerId = null
  if (form.assign_mode === '指定') {
    sellerId = await getSellerIdByMobile(form.seller_mobile, location, addressName, cookie)
    if (!sellerId) throw new Error(`未找到保洁师 ${form.seller_mobile}`)
  } else {
    const detail = await getComboDetail(comboId, cookie)
    sellerId = await findNearestSeller(detail.serviceId, form.service_time, detail.duration, location, addressName, cookie)
    if (!sellerId) throw new Error('7km范围内无可用保洁师')
  }
  
  loadingText.value = '提交套餐单次订单...'
  const res = await createComboSingleOrder(comboId, sellerId, serviceInfoId, form.service_time, cookie)
  
  if (res.code !== 1 || !res.data) {
    throw new Error(`套餐单次下单失败: ${res.message || JSON.stringify(res)}`)
  }
  
  return { message: `✓ 套餐单次下单成功！`, orderId: String(res.data) }
}

/**
 * 套餐周期下单流程
 */
async function placeComboCycleOrder(cookie) {
  loadingText.value = '查询用户套餐...'
  const combo = await queryUserCombo(form.phone, form.combo_hint, cookie)
  if (!combo) throw new Error(`该用户无可用套餐（关键词: ${form.combo_hint}）`)
  
  const comboId = combo.comboId || combo.id
  
  loadingText.value = '解析地址坐标...'
  const { location, addressName } = await checkAddress(form.address, cookie)
  
  loadingText.value = '匹配服务地址...'
  const serviceInfoId = await findOrCreateServiceInfo(comboId, addressName, form.address, location, cookie)
  if (!serviceInfoId) throw new Error('无法获取套餐服务地址ID')
  
  loadingText.value = '分配保洁师...'
  let sellerId = null
  if (form.assign_mode === '指定') {
    sellerId = await getSellerIdByMobile(form.seller_mobile, location, addressName, cookie)
    if (!sellerId) throw new Error(`未找到保洁师 ${form.seller_mobile}`)
  } else {
    const detail = await getComboDetail(comboId, cookie)
    sellerId = await findNearestSeller(detail.serviceId, cycleServiceTime.value, detail.duration, location, addressName, cookie)
    if (!sellerId) throw new Error('7km范围内无可用保洁师')
  }
  
  // 解析周期参数
  const weekTypeMap = { '周一': '1', '周二': '2', '周三': '3', '周四': '4', '周五': '5', '周六': '6', '周日': '7', '周天': '7' }
  const weekType = weekTypeMap[form.weekday_text] || '3'
  
  const freqCycleMap = { '每周一次': 1, '两周一次': 2, '每月一次': 4 }
  const cycle = freqCycleMap[form.frequency] || 2
  
  // serverTimeCycles：时间组数组 [{ week, serviceTime }]
  const serverTimeCycles = [{ week: weekType, serviceTime: form.time_slot }]
  
  loadingText.value = '提交周期单...'
  const res = await createComboCycleOrder(
    comboId, sellerId, serviceInfoId,
    weekType, serverTimeCycles,
    cycleServiceTime.value,
    cookie
  )
  
  if (res.code !== 1 || !res.data) {
    // Bug修复：有时返回母单ID在不同字段
    const orderId = res.data?.comboLinkOrderId || res.data?.id || res.data
    if (!orderId) throw new Error(`周期单下单失败: ${res.message || JSON.stringify(res)}`)
  }
  
  const orderId = (res.data?.comboLinkOrderId || res.data?.id || res.data)
  return { message: `✓ 套餐周期单下单成功！母单号: ${orderId}`, orderId: String(orderId) }
}

/**
 * 地址模糊匹配或新建服务地址
 */
async function findOrCreateServiceInfo(comboId, addressName, rawAddress, location, cookie) {
  const existList = await getComboServiceInfo(comboId, cookie)
  
  if (existList && existList.length > 0 && rawAddress) {
    // 模糊匹配已有地址
    let best = null, bestScore = 0
    for (const item of existList) {
      const addr = item.address || ''
      if (!addr) continue
      let score = 0
      if (rawAddress.includes(addr.substring(0, 5)) || addr.includes(rawAddress.substring(0, 5))) score += 0.5
      if (rawAddress.includes(addr) || addr.includes(rawAddress)) score += 0.5
      const chunks = rawAddress.match(/[\u4e00-\u9fa5]{2,}/g) || []
      for (const c of chunks) if (addr.includes(c)) score += 0.1
      if (score > bestScore) { bestScore = score; best = item }
    }
    if (best && bestScore >= 0.35) {
      console.log(`✅ 模糊匹配命中已有地址: ${best.address} (score=${bestScore.toFixed(2)})`)
      return best.id
    }
    
    // 未命中，新建地址
    console.log('模糊匹配未命中，添加新服务地址')
  } else if (existList && existList.length > 0) {
    return existList[0].id
  }
  
  // 新建服务地址
  const id = await addComboServiceInfo(comboId, addressName, rawAddress, location, cookie)
  if (!id) throw new Error('添加服务地址失败')
  return id
}

/**
 * 获取最优优惠券
 */
async function getBestCoupon(phone, categoryId, skuBarCode, price, cookie) {
  const { apiGet } = await import('@/api/index.js')
  const { SERVICE_TYPE_MAP } = await import('@/api/category.js')
  const serviceType = SERVICE_TYPE_MAP[categoryId] || categoryId
  
  const res = await apiGet('/coupon/getListV3.do', {
    cityId: '102',
    skuBarCodes: skuBarCode,
    recommendPrice: parseInt(price),
    userMobile: phone,
    serviceType
  }, cookie)
  
  if (res.code === 1 && res.data?.length > 0) {
    return res.data[0].id
  }
  return null
}

/**
 * 保存日志
 */
function saveLog(level, msg) {
  try {
    const logs = uni.getStorageSync('app_logs') || []
    logs.unshift({ time: new Date().toISOString(), level, msg })
    if (logs.length > 200) logs.splice(200)
    uni.setStorageSync('app_logs', logs)
  } catch (e) {}
}

function resetForm() {
  form.phone = ''
  form.address = ''
  form.spec_text = ''
  form.seller_mobile = ''
  form.remark = ''
  orderResult.show = false
}
</script>

<style scoped>
.page {
  background: #f5f5f5;
  min-height: 100vh;
  padding-bottom: 40rpx;
}

.card {
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin: 20rpx 24rpx;
  box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.06);
}

.section-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 20rpx;
  padding-left: 12rpx;
  border-left: 4rpx solid #1a73e8;
}

/* 类型选择 */
.type-tabs {
  display: flex;
  gap: 16rpx;
}

.type-tab {
  flex: 1;
  padding: 16rpx;
  text-align: center;
  border-radius: 12rpx;
  font-size: 26rpx;
  background: #f0f4ff;
  color: #666;
  border: 2rpx solid transparent;
}

.type-tab.active {
  background: #1a73e8;
  color: #fff;
  border-color: #1a73e8;
}

/* 表单 */
.form-item {
  margin-bottom: 24rpx;
}

.form-label {
  font-size: 26rpx;
  color: #555;
  margin-bottom: 10rpx;
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
  background: #fafafa;
  min-height: 80rpx;
}

/* 日期选择 */
.date-row {
  display: flex;
  gap: 16rpx;
}

.date-picker {
  flex: 1;
  border: 1rpx solid #e0e0e0;
  border-radius: 12rpx;
  padding: 20rpx 24rpx;
  font-size: 28rpx;
  background: #fafafa;
  text-align: center;
  color: #333;
}

/* picker */
.picker-view {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border: 1rpx solid #e0e0e0;
  border-radius: 12rpx;
  padding: 20rpx 24rpx;
  font-size: 28rpx;
  background: #fafafa;
  color: #333;
}

.picker-arrow {
  font-size: 22rpx;
  color: #999;
}

/* 星期选择 */
.weekday-group {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.weekday-item {
  padding: 12rpx 20rpx;
  border-radius: 8rpx;
  background: #f0f4ff;
  color: #666;
  font-size: 26rpx;
  border: 2rpx solid transparent;
}

.weekday-item.active {
  background: #1a73e8;
  color: #fff;
  border-color: #1a73e8;
}

/* 分配方式 */
.radio-group {
  display: flex;
  gap: 24rpx;
}

.radio-item {
  padding: 16rpx 32rpx;
  border-radius: 12rpx;
  background: #f0f4ff;
  color: #666;
  font-size: 28rpx;
  border: 2rpx solid transparent;
}

.radio-item.active {
  background: #1a73e8;
  color: #fff;
  border-color: #1a73e8;
}

/* 提交 */
.submit-area {
  padding: 24rpx;
  margin-top: 8rpx;
}

.submit-btn {
  width: 100%;
  background: #1a73e8;
  color: #fff;
  border-radius: 16rpx;
  padding: 28rpx;
  font-size: 32rpx;
  font-weight: 600;
  text-align: center;
  border: none;
}

.submit-btn[disabled] {
  background: #b0c4de;
  color: #fff;
}

/* 结果弹窗 */
.result-mask {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.result-box {
  background: #fff;
  border-radius: 24rpx;
  padding: 48rpx 40rpx;
  width: 600rpx;
  text-align: center;
}

.result-icon {
  width: 96rpx;
  height: 96rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48rpx;
  color: #fff;
  margin: 0 auto 24rpx;
}

.result-icon.success { background: #4caf50; }
.result-icon.error { background: #f44336; }

.result-title {
  font-size: 34rpx;
  font-weight: 600;
  margin-bottom: 16rpx;
}

.result-message {
  font-size: 26rpx;
  color: #666;
  margin-bottom: 16rpx;
  word-break: break-all;
}

.result-orderid {
  font-size: 24rpx;
  color: #1a73e8;
  margin-bottom: 24rpx;
}

.result-actions {
  display: flex;
  gap: 16rpx;
  justify-content: center;
}

.result-actions button {
  flex: 1;
  padding: 20rpx;
  border-radius: 12rpx;
  font-size: 28rpx;
  border: none;
}

.btn-secondary {
  background: #f0f4ff;
  color: #1a73e8;
}

/* 加载 */
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
  padding: 48rpx 60rpx;
  text-align: center;
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

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-text {
  font-size: 28rpx;
  color: #666;
}
</style>
