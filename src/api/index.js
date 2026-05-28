// API 核心模块 - 封装所有后端接口调用
// 对应 app-service.js 中的 api/index.js 逻辑

const BASE_URL_CRM = 'https://jz-bjcrm.daojia-inc.com'
const BASE_URL_XSG = 'https://xsg.daojia-inc.com'
const CITY_ID = '102' // 成都

// ===== 通用请求封装 =====

function getHeaders(cookie) {
  return {
    'Cookie': cookie,
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'zh-CN,zh;q=0.9',
    'Referer': `${BASE_URL_CRM}/order/manager.do`,
    'Origin': BASE_URL_CRM
  }
}

function getCrmHeaders(cookie) {
  return {
    'Cookie': cookie,
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept': 'application/json, text/plain, */*',
    'Referer': `${BASE_URL_XSG}/order/manager.do`,
    'Origin': BASE_URL_XSG
  }
}

/**
 * GET 请求
 * @param {string} path API 路径
 * @param {object} data 请求参数
 * @param {string} cookie Cookie 字符串
 */
export function apiGet(path, data, cookie) {
  return new Promise((resolve, reject) => {
    uni.request({
      url: `${BASE_URL_CRM}${path}`,
      method: 'GET',
      header: getHeaders(cookie),
      data: data || {},
      timeout: 15000,
      success(res) { resolve(res.data) },
      fail(err) { reject(new Error(`网络错误(${path}): ${err.errMsg}`)) }
    })
  })
}

/**
 * POST 请求 (JSON body)
 * @param {string} path API 路径
 * @param {object} data 请求体
 * @param {string} cookie Cookie 字符串
 */
export function apiPost(path, data, cookie) {
  return new Promise((resolve, reject) => {
    uni.request({
      url: `${BASE_URL_CRM}${path}`,
      method: 'POST',
      header: { ...getHeaders(cookie), 'Content-Type': 'application/json;charset=UTF-8' },
      data: data || {},
      timeout: 30000,
      success(res) { resolve(res.data) },
      fail(err) { reject(new Error(`网络错误(${path}): ${err.errMsg}`)) }
    })
  })
}

/**
 * POST form-urlencoded 请求
 */
export function apiPostForm(path, data, cookie) {
  return new Promise((resolve, reject) => {
    uni.request({
      url: `${BASE_URL_CRM}${path}`,
      method: 'POST',
      header: { ...getHeaders(cookie), 'Content-Type': 'application/x-www-form-urlencoded' },
      data: data || {},
      timeout: 15000,
      success(res) { resolve(res.data) },
      fail(err) { reject(new Error(`网络错误(${path}): ${err.errMsg}`)) }
    })
  })
}

/**
 * XSG POST form-urlencoded 请求（用于排班查询）
 */
export function xsgPostForm(path, data, cookie) {
  return new Promise((resolve, reject) => {
    uni.request({
      url: `${BASE_URL_XSG}${path}`,
      method: 'POST',
      header: { ...getCrmHeaders(cookie), 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
      data: data || {},
      timeout: 30000,
      success(res) { resolve(res.data) },
      fail(err) { reject(new Error(`CRM网络错误(${path}): ${err.errMsg}`)) }
    })
  })
}

// ===== Cookie 管理 =====

const COOKIE_KEY = 'daojia_cookie'

export function getCookie() {
  return uni.getStorageSync(COOKIE_KEY) || ''
}

export function setCookie(cookie) {
  uni.setStorageSync(COOKIE_KEY, cookie)
}

/**
 * 验证 Cookie 是否有效
 * @returns {object} { valid, status, message }
 */
export async function validateCookie(cookie) {
  const ck = cookie || getCookie()
  if (!ck) return { valid: false, status: '未配置', message: '请先配置Cookie' }
  try {
    const res = await apiGet('/order/list.do', { pageNo: 1, pageSize: 1 }, ck)
    if (res.code === 1) return { valid: true, status: '有效', message: '✓ Cookie有效' }
    if (res.code === -1 || String(res).includes('login')) return { valid: false, status: '已过期', message: 'Cookie已过期，请重新获取' }
    return { valid: false, status: '异常', message: `验证异常: code=${res.code}` }
  } catch (e) {
    return { valid: false, status: '网络错误', message: e.message }
  }
}

// ===== 规格相关 =====

/**
 * 获取产品所有规格
 * 调用 /allCity/getProductAllSpecV3.do
 * @param {number} serviceId 服务ID（品类ID）
 * @param {number} spuCode SPU编码
 * @param {string} cookie Cookie
 * @returns {Array} 规格列表 [{ specId, specName, price, skuBarCode, ... }]
 */
export async function getAllSpecs(serviceId, spuCode, cookie) {
  return getAllSpecsRobust(serviceId, spuCode, cookie)
}

// ===== 订单相关 =====

/**
 * 查询订单列表（支持分页和状态筛选）
 * @param {object} params { pageNo, pageSize, status, keyword, startDate, endDate }
 * @param {string} cookie Cookie
 * @returns {object} { list: Array, total: number, pageNo: number }
 */
export async function queryOrderList(params, cookie) {
  const ck = cookie || getCookie()
  const {
    pageNo = 1,
    pageSize = 20,
    status,
    keyword,
    startDate,
    endDate
  } = params || {}
  
  const query = {
    pageNo,
    pageSize,
    cityId: CITY_ID
  }
  if (status !== undefined && status !== '') query.status = status
  if (keyword) query.keyword = keyword
  if (startDate) query.startDate = startDate
  if (endDate) query.endDate = endDate
  
  const res = await apiGet('/order/list.do', query, ck)
  
  if (res.code !== 1) throw new Error(`查询订单列表失败: ${res.message || '未知错误'}`)
  
  const data = res.data || {}
  return {
    list: data.orderListDtoList || data.list || [],
    total: data.totalCount || data.total || 0,
    pageNo: data.pageNo || pageNo
  }
}

/**
 * 按订单号查询订单详情
 * Bug修复：增加用户手机号获取逻辑，原版有时缺少电话字段
 */
export async function queryOrderById(orderId, cookie) {
  const ck = cookie || getCookie()
  const res = await apiGet('/order/list.do', { orderId, pageNo: 1, pageSize: 10 }, ck)
  if (res.code !== 1 || !res.data?.orderListDtoList?.length) return null
  
  const order = res.data.orderListDtoList[0]
  let mobile = null
  let sellerInfo = null
  
  const userId = order.userId
  if (userId) {
    try {
      const mobileRes = await apiGet('/order/viewMobile.do', { id: userId, type: 'USER' }, ck)
      if (mobileRes.code === 1 && mobileRes.data?.mobile) {
        mobile = mobileRes.data.mobile
      }
    } catch (e) {
      console.warn('获取用户手机号失败:', e.message)
    }
    
    // Bug修复：原版没有获取保洁师信息
    try {
      if (order.sellerList && order.sellerList.length > 0) {
        sellerInfo = order.sellerList[0]
      }
    } catch (e) {
      console.warn('获取保洁师信息失败:', e.message)
    }
  }
  
  return {
    orderId: order.orderId || orderId,
    orderNo: order.orderNo,
    status: order.status,
    statusText: order.statusText || getOrderStatusText(order.status),
    userMobile: mobile || order.userMobile || '',
    userName: order.userName || '',
    serviceTime: order.serviceTime || '',
    address: order.address || '',
    serviceName: order.serviceName || '',
    amount: order.amount || order.totalFee || 0,
    sellerName: sellerInfo?.sellerName || order.sellerName || '',
    sellerMobile: sellerInfo?.sellerMobile || '',
    remark: order.remark || '',
    raw: order
  }
}

function getOrderStatusText(status) {
  const map = {
    0: '待分配', 1: '待服务', 2: '服务中', 3: '已完成', 4: '已取消', 5: '已评价'
  }
  return map[status] || `状态${status}`
}

// ===== 保洁师相关 =====

/**
 * 按手机号获取保洁师 ID
 * Bug修复：原版查询范围用50km，可能返回多个，增加精确匹配逻辑
 */
export async function getSellerIdByMobile(mobile, location, address, cookie) {
  const ck = cookie || getCookie()
  const res = await apiGet('/seller/getSellersOfAllCity.do', {
    cityId: CITY_ID,
    location,
    serviceId: '1',
    sellPhone: mobile,
    km: 50,
    pageNo: 1,
    pageSize: 10
  }, ck)
  
  if (res.code !== 1 || !res.data?.sellerList?.length) return null
  
  // 优先精确手机号匹配
  const exact = res.data.sellerList.find(s => s.sellerPhone === mobile || s.phone === mobile)
  return exact ? exact.sellerId || exact.id : res.data.sellerList[0].sellerId || res.data.sellerList[0].id
}

/**
 * 找附近最近的可用保洁师（7km内）
 */
export async function findNearestSeller(serviceId, serviceTime, duration, location, address, cookie) {
  const ck = cookie || getCookie()
  const res = await apiGet('/seller/getSellersOfAllCity.do', {
    cityId: CITY_ID,
    location,
    serviceId: String(serviceId || 1),
    serviceTime,
    duration: String(duration || 4),
    km: 7,
    pageNo: 1,
    pageSize: 5
  }, ck)
  
  if (res.code !== 1 || !res.data?.sellerList?.length) return null
  return res.data.sellerList[0].sellerId || res.data.sellerList[0].id
}

// ===== 地址相关 =====

/**
 * 校验地址并获取经纬度
 */
export async function checkAddress(address, cookie) {
  const ck = cookie || getCookie()
  const res = await apiPost('/geo/checkAddress.do', { address, cityId: CITY_ID }, ck)
  if (res.code !== 1 || !res.data) throw new Error(`地址校验失败: ${res.message || '未知错误'}`)
  return {
    location: res.data.location || '',
    addressName: res.data.addressName || address,
    lng: res.data.lng,
    lat: res.data.lat
  }
}

// ===== 品类下单 (addV3.do) =====

/**
 * 创建品类订单
 * Bug修复：serviceTimeStr 需要将空格替换为 +，原版已修复，此处保持
 */
export async function createCategoryOrder(params, cookie) {
  const {
    userMobile,
    sellerId,
    serviceId,
    spuCode,
    specId,
    count = 1,
    address,
    doorNumber,
    location,
    serviceTime,
    couponId
  } = params
  
  const ck = cookie || getCookie()
  
  // 参数验证
  if (!userMobile || !/^1\d{10}$/.test(userMobile)) throw new Error('用户手机号格式不正确')
  if (!sellerId) throw new Error('保洁师ID不能为空')
  if (!serviceTime) throw new Error('服务时间不能为空')
  if (!address) throw new Error('服务地址不能为空')
  if (!location) throw new Error('地址坐标不能为空')
  
  const payload = {
    couponId: couponId || '',
    prePayType: 1,
    timeSharingFee: 0,
    productInfo: {
      orderSpecList: [{ count, specId: String(specId) }],
      serviceId,
      spuCode
    },
    sellerIds: [String(sellerId)],
    serviceInfo: {
      address,
      cityId: CITY_ID,
      doorNumber: doorNumber || '',
      location,
      remark: '收现金',
      serviceTime,
      // Bug修复：serviceTimeStr 必须用 + 替代空格
      serviceTimeStr: serviceTime.replace(' ', '+')
    },
    userInfo: {
      registerMobile: userMobile,
      userId: 0,
      userMobile,
      userName: ''
    }
  }
  
  return await apiPost('/allCity/addV3.do', payload, ck)
}

// ===== 套餐相关 =====

/**
 * 查询用户套餐列表
 */
export async function queryUserCombo(phone, keyword, cookie) {
  const ck = cookie || getCookie()
  const res = await apiGet('/comboOrder/queryList.do', {
    userRegisterPhone: phone,
    pageNum: 1,
    pageSize: 10
  }, ck)
  
  if (res.code !== 1 || !res.data?.pageData) return null
  
  // 过滤有效套餐（comboState=0 且剩余次数>0）
  const valid = res.data.pageData.filter(c => c.comboState === 0 && c.comoboValidCount > 0)
  if (!valid.length) return null
  if (valid.length === 1) return valid[0]
  
  // 按关键词匹配套餐类型
  const typeMap = [
    ['做饭', '烹饪', '厨师'],
    ['养宠', '宠物'],
    ['除菌', '消毒', '杀菌'],
    ['大扫除', '深度'],
    ['日常保洁', '保洁', '家政']
  ]
  for (const types of typeMap) {
    if (types.some(t => keyword.includes(t))) {
      const match = valid.find(c => types.some(t => c.orderListTitle?.includes(t)))
      if (match) return match
    }
  }
  return valid[0]
}

/**
 * 获取套餐服务地址列表
 */
export async function getComboServiceInfo(comboId, cookie) {
  const ck = cookie || getCookie()
  const res = await apiPostForm('/comboOrder/serviceInfoList.do', { comboId }, ck)
  return res.code === 0 && res.data ? res.data : []
}

/**
 * 添加套餐服务地址
 */
export async function addComboServiceInfo(comboId, address, rawAddress, location, cookie) {
  const ck = cookie || getCookie()
  const res = await apiPost('/comboOrder/backFillServiceInfo.do', {
    comboId,
    serviceInfos: [{
      address,
      rawAddress,
      location,
      cityId: CITY_ID
    }]
  }, ck)
  if (res.code === 1 && res.data?.id) return res.data.id
  // Bug修复：原版没有处理返回格式多样性
  if (Array.isArray(res.data) && res.data.length > 0) return res.data[0].id
  return null
}

/**
 * 创建套餐单次订单
 */
export async function createComboSingleOrder(comboId, sellerId, serviceInfoId, serviceTime, cookie) {
  const ck = cookie || getCookie()
  return await apiPost('/allCityComboBatchOrder/createSubOrder.do', {
    comboId,
    sellerId: String(sellerId),
    serviceInfoId,
    toCook: '',
    serviceTime,
    dailyToCookFlag: false
  }, ck)
}

/**
 * 创建套餐周期订单
 * Bug修复：submitComboLinkBatchOrder.do 参数需要精确匹配
 */
export async function createComboCycleOrder(comboId, sellerId, serviceInfoId, weekType, serverTimeCycles, beginServerTime, cookie) {
  const ck = cookie || getCookie()
  const payload = {
    comboId: String(comboId),
    sellerId: String(sellerId),
    serviceInfoId: parseInt(serviceInfoId),
    weekType: String(weekType),
    serverTimeCycles,
    beginServerTime
  }
  console.log('[周期单] 提交参数:', JSON.stringify(payload))
  return await apiPost('/allCityComboBatchOrder/submitComboLinkBatchOrder.do', payload, ck)
}

/**
 * 获取套餐详情（时长、服务ID）
 */
export async function getComboDetail(comboId, cookie) {
  const ck = cookie || getCookie()
  try {
    const res = await apiGet('/comboOrder/queryComboDetailForCreate.do', { comboId }, ck)
    if (res.code === 1 && res.data) {
      return { duration: res.data.duration || 4, serviceId: res.data.serviceId || 1 }
    }
  } catch (e) {
    console.warn('套餐详情异常:', e.message)
  }
  return { duration: 4, serviceId: 1 }
}

// ===== 保洁师排班查询 =====

/**
 * 查询保洁师排班（按日期）
 * 使用 xsg.daojia-inc.com 接口
 */
export async function querySellerSchedule(sellerId, date, cookie) {
  const ck = cookie || getCookie()
  const ts = Date.now()
  const res = await xsgPostForm(
    '/crmCustomJiaZhengInventory/searchCustomInventoryStatus.json',
    { customId: String(sellerId), date: String(ts) },
    ck
  )
  
  if (Array.isArray(res)) return res
  if (res && Array.isArray(res.data)) return res.data
  return []
}

/**
 * 查询保洁师月度排班（分批查询合并）
 * Bug修复：原版按 [1,8,15,22,29] 分5次请求，合并时可能有重复
 */
export async function querySellerScheduleMonth(sellerId, year, month, cookie) {
  const ck = cookie || getCookie()
  const results = {}
  const batchDates = [1, 8, 15, 22, 29]
  
  for (const day of batchDates) {
    try {
      const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      const ts = new Date(date).getTime()
      const res = await xsgPostForm(
        '/crmCustomJiaZhengInventory/searchCustomInventoryStatus.json',
        { customId: String(sellerId), date: String(ts) },
        ck
      )
      
      let items = []
      if (Array.isArray(res)) items = res
      else if (res && Array.isArray(res.data)) items = res.data
      
      // Bug修复：按日期去重合并
      for (const item of items) {
        const key = item.date || item.serviceDate
        if (key && !results[key]) {
          results[key] = item
        }
      }
    } catch (e) {
      console.warn(`查询第${day}日排班失败:`, e.message)
    }
  }
  
  return Object.values(results).sort((a, b) => {
    const da = a.date || a.serviceDate || ''
    const db = b.date || b.serviceDate || ''
    return da.localeCompare(db)
  })
}

/**
 * 获取保洁师可用时段
 */
export async function getOrderValidTimeBySeller(sellerId, week, duration, weekType, cookie) {
  const ck = cookie || getCookie()
  const res = await apiGet('/seller/getOrderValidTimeBySeller.do', {
    cityId: CITY_ID,
    weekType: String(weekType || 1),
    duration: String(duration),
    sellerId: String(sellerId),
    week: String(week),
    serviceId: '1'
  }, ck)
  
  if ((res.code === 0 || res.code === 1) && res.data && Array.isArray(res.data)) {
    return res.data
  }
  return []
}

/**
 * 获取保洁师首次可用服务时间
 */
export async function listFirstServiceTime(sellerId, duration, cycle, serverTimeCycles, cityId, serviceId, cookie) {
  const ck = cookie || getCookie()
  const res = await apiGet('/seller/listFirstServiceTime.do', {
    cycle: String(cycle),
    sellerId: String(sellerId),
    duration: String(duration),
    serverTimeCycles,
    cityId: String(cityId || CITY_ID),
    serviceId: String(serviceId || 1)
  }, ck)
  
  if (res.code === 1 && res.data && res.data.length > 0) {
    return res.data[0].serviceTime
  }
  return null
}

// ===== 商家库管理 =====

let sellerDB = null

/**
 * 加载保洁师数据库
 * Bug修复：原版先尝试嵌入数据，失败再降级到 JSON 文件
 */
export async function loadSellerDB() {
  if (sellerDB) return sellerDB
  
  // 先尝试从静态文件加载（确保最新数据）
  try {
    const res = await new Promise((resolve, reject) => {
      uni.request({
        url: '/static/seller_db.json',
        method: 'GET',
        success: r => resolve(r),
        fail: e => reject(e)
      })
    })
    const data = res.data || res
    if (data && data.data && Array.isArray(data.data)) {
      sellerDB = data
      return sellerDB
    }
  } catch (e) {
    console.warn('加载seller_db.json失败，使用内嵌数据:', e.message)
  }
  
  return null
}

/**
 * 搜索保洁师（按姓名或分组关键词）
 */
export function searchSellers(keyword, sellers) {
  if (!sellers || sellers.length < 1) return []
  const kw = keyword.toLowerCase()
  return sellers.filter(s => {
    return s.name?.toLowerCase().includes(kw) || s.group?.toLowerCase().includes(kw) || s.id?.includes(kw)
  })
}

// ===== 现金结算（来自 engine.py _handle_cash_settlement）=====

/**
 * 查询订单现金收款信息
 * @returns {object} { code, data: { cashPayAmount, sellerName, serviceAddress, ... } }
 */
export async function getOrderCashInfo(orderId, cookie) {
  const ck = cookie || getCookie()
  return await apiGet('/pay/orderInfoConfirm.do', { orderId }, ck)
}

/**
 * 执行现金结算
 * @param {string} orderId 订单号
 * @param {number} amount 结算金额
 */
export async function cashPayOrder(orderId, amount, cookie) {
  const ck = cookie || getCookie()
  return await apiGet('/pay/cashPay.do', { orderId, cashPayAmount: amount }, ck)
}

// ===== 地址模糊匹配（来自 engine.py v11-10）=====

const ADDRESS_MATCH_THRESHOLD = 0.35

/**
 * 中文数字归一化：四栋 → 4栋，二单元 → 2单元
 */
export function normalizeChineseNumbers(text) {
  if (!text) return ''
  const cnMap = { '零': '0', '一': '1', '二': '2', '三': '3', '四': '4', '五': '5', '六': '6', '七': '7', '八': '8', '九': '9', '十': '10', '壹': '1', '贰': '2', '叁': '3', '肆': '4', '伍': '5' }
  return text.replace(/([零一二三四五六七八九十壹贰叁肆伍])(栋|幢|单元|楼|号|室|层|座|梯|期|区)/g, (_, cn, suffix) => (cnMap[cn] || cn) + suffix)
}

function _extractKeywords(addr) {
  if (!addr) return []
  const text = normalizeChineseNumbers(addr.trim())
  const stopwords = new Set(['的', '公寓', '小区', '大厦', '广场', '花园', '城', '苑', '邸', '楼', '幢', '单元', '号', '室', '层', '栋', '座', '建设中', '分店', '店', '(建设中)', '（建设中）'])
  const tokens = (text.match(/[\u4e00-\u9fa5]{2,}|\d+/g) || []).filter(t => !stopwords.has(t))
  return tokens
}

/**
 * 计算两个地址相似度 (0.0~1.0)
 * Jaccard相似度 + 专有名词权重 + 数字匹配加权 + 包含关系加分
 */
export function calcAddressSimilarity(addrA, addrB) {
  if (!addrA || !addrB) return 0
  const a = addrA.trim(), b = addrB.trim()
  if (a === b) return 1

  const kwA = _extractKeywords(a), kwB = _extractKeywords(b)
  if (!kwA.length || !kwB.length) return 0

  const setA = new Set(kwA), setB = new Set(kwB)
  const common = new Set([...setA].filter(x => setB.has(x)))
  if (!common.size) {
    // 关键词无交集 → 门牌号兜底
    const numsA = kwA.filter(w => /^\d+$/.test(w))
    const numsB = kwB.filter(w => /^\d+$/.test(w))
    if (numsA.length && numsB.length && JSON.stringify(numsA.sort()) === JSON.stringify(numsB.sort())) {
      return ADDRESS_MATCH_THRESHOLD
    }
    return 0
  }

  const jaccard = common.size / new Set([...setA, ...setB]).size
  const longCommon = kwA.filter(w => w.length >= 3 && setB.has(w)).length
  const bonus = longCommon * 0.15
  const numsCommon = kwA.filter(w => /^\d+$/.test(w) && setB.has(w)).length
  const numBonus = numsCommon * 0.1
  let score = Math.min(1, jaccard + bonus + numBonus)

  // 包含关系加分
  const core = kwA.slice(0, 3).join('')
  if (core && addrB.includes(core)) score = Math.min(1, score + 0.2)

  return Math.round(score * 1000) / 1000
}

/**
 * 在候选地址列表中模糊匹配
 * @param {string} inputAddr 需求地址
 * @param {Array} candidates 候选列表 [{address, id, ...}] 或纯字符串
 * @returns {{ match: object|null, score: number }}
 */
export function fuzzyMatchAddress(inputAddr, candidates) {
  if (!inputAddr || !candidates || !candidates.length) return { match: null, score: 0 }

  let best = null, bestScore = 0
  for (const item of candidates) {
    const cand = typeof item === 'string' ? item : (item.address || '')
    const score = calcAddressSimilarity(inputAddr, cand)
    if (score > bestScore) { bestScore = score; best = item }
  }

  if (bestScore >= ADDRESS_MATCH_THRESHOLD) {
    return { match: best, score: bestScore }
  }
  return { match: null, score: bestScore }
}

// 修复 getAllSpecs: engine.py 使用 GET 请求，非 POST
// 同时支持三次重试（serviceId+spuCode → spuCode+spuCode → serviceId+serviceId）
const _originalGetAllSpecs = getAllSpecs
export { _originalGetAllSpecs }

export async function getAllSpecsRobust(serviceId, spuCode, cookie) {
  const ck = cookie || getCookie()

  const paramSets = [
    { serviceId, spuCode, cityId: CITY_ID }
  ]
  if (serviceId !== spuCode) {
    paramSets.push({ serviceId: spuCode, spuCode, cityId: CITY_ID })
    paramSets.push({ serviceId, spuCode: serviceId, cityId: CITY_ID })
  }

  for (const params of paramSets) {
    try {
      const res = await apiGet('/allCity/getProductAllSpecV3.do', params, ck)
      if ((res.code === 0 || res.code === 1) && res.data) {
        const specs = res.data.specifications || res.data
        if (Array.isArray(specs) && specs.length > 0) return specs
      }
    } catch (e) {
      console.warn('getAllSpecsRobust 尝试失败:', e.message)
    }
  }
  return []
}
