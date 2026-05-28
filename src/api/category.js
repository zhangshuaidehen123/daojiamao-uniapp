// 品类配置数据 - 合并自 engine.py 正式版V1.0 完整规格匹配逻辑
// 最后更新: 2026-05-28

// ========== 品类配置 (28种) ==========
export const CATEGORY_CONFIG = {
  301: { spuCode: 301, name: '擦玻璃' },
  302: { spuCode: 302, name: '空调清洗' },
  303: { spuCode: 303, name: '冰箱清洗' },
  314: { spuCode: 314, name: '油烟机清洗' },
  315: { spuCode: 315, name: '洗衣机清洗' },
  9096: { spuCode: 109096001, name: '中央空调清洗' },
  9091: { spuCode: 9091, name: '全屋大扫除' },
  545: { spuCode: 545, name: '开荒保洁' },
  9093: { spuCode: 9093, name: '全屋除菌保洁' },
  9118: { spuCode: 9118, name: '养宠家庭保洁' },
  9115: { spuCode: 9115, name: '厨房保洁' },
  9116: { spuCode: 9116, name: '卫浴保洁' },
  9102: { spuCode: 9102, name: '热水器清洗' },
  9103: { spuCode: 9103, name: '布艺沙发清洗' },
  9105: { spuCode: 9105, name: '床垫清洗' },
  9104: { spuCode: 9104, name: '地毯清洗' },
  9106: { spuCode: 9106, name: '窗帘清洗' },
  12: { spuCode: 12, name: '皮沙发护理' },
  8: { spuCode: 8, name: '地板打蜡' },
  9107: { spuCode: 9107, name: '除霉保洁' },
  9108: { spuCode: 9108, name: '管道疏通' },
  9109: { spuCode: 9109, name: '整理收纳' },
  9110: { spuCode: 9110, name: '整理保洁' },
  9111: { spuCode: 9111, name: '除螨清洁' },
  9112: { spuCode: 9112, name: '全屋大扫除+玻璃' },
  9113: { spuCode: 9113, name: '全屋大扫除+玻璃+家电' },
  9114: { spuCode: 9114, name: '全屋除蟑' }
}

// serviceType 映射（用于优惠券查询 getListV3.do）
export const SERVICE_TYPE_MAP = {
  301: 38, 302: 302, 303: 303, 314: 314, 315: 315,
  9096: 9096, 9091: 9091, 545: 545, 9093: 9093, 9118: 9118,
  9115: 9115, 9116: 9116, 9102: 9102, 9103: 9103, 9105: 9105,
  9104: 9104, 9106: 9106, 12: 12, 8: 8, 9107: 9107, 9108: 9108,
  9109: 9109, 9110: 9110, 9111: 9111, 9112: 9112, 9113: 9113, 9114: 9114
}

// ========== 关键词品类识别（优先级从特殊到一般）==========
// engine.py L1457-1498 _kw_order
const KEYWORD_ORDER = [
  [9096, '中央空调'],
  [9113, '大扫除+玻璃+家电'],
  [9112, '大扫除+玻璃'],
  [9114, '除蟑'],
  [9111, '除螨'],
  [9107, '除霉'],
  [9108, '管道疏通'],
  [9109, '整理收纳'],
  [9110, '整理保洁'],
  [9106, '窗帘'],
  [9105, '床垫'],
  [9104, '地毯'],
  [9103, '布艺沙发'],
  [12, '皮沙发'],
  [9118, '养宠'],
  [9093, '除菌'],
  [9115, '厨房保洁'],
  [9116, '卫浴'],
  [545, '开荒'],
  [9091, '大扫除'],
  [9102, '热水器'],
  [8, '地板打蜡'],
  [301, '擦玻璃'],
  [301, '玻璃清洗'],
  [314, '油烟机'],
  [314, '烟机'],
  [302, '空调'],
  [303, '冰箱'],
  [315, '洗衣机']
]

/**
 * 从品类名/关键词推断 serviceId
 */
export function detectCategoryFromText(text) {
  if (!text) return null
  for (const [serviceId, keyword] of KEYWORD_ORDER) {
    if (text.includes(keyword)) return serviceId
  }
  // 兜底：打蜡
  if (text.includes('打蜡')) return 8
  return null
}

export function getCategoryList() {
  return Object.entries(CATEGORY_CONFIG).map(([id, cfg]) => ({
    value: Number(id),
    label: cfg.name,
    spuCode: cfg.spuCode
  }))
}

// ========== 完整规格匹配逻辑（来自 engine.py v11-7）==========

/**
 * 通用规格匹配辅助函数
 * 按顺序: 精确匹配 → 去括号匹配 → 关键词模糊匹配
 * @returns {{ specId, price, skuBarCode, specName } | null}
 */
function _matchSpecByKeywords(specs, keywordsPriority, specText, detailText) {
  // 1. 精确匹配
  for (const s of specs) {
    if (s.specName === specText) {
      return { specId: s.specId, price: s.price, skuBarCode: s.skuBarCode, specName: s.specName }
    }
  }
  // 2. 去括号匹配
  const specTextClean = (specText || '').replace(/[（(].*?[）)]/g, '').trim()
  for (const s of specs) {
    const snameClean = (s.specName || '').replace(/[（(].*?[）)]/g, '').trim()
    if (specTextClean && snameClean && specTextClean === snameClean) {
      return { specId: s.specId, price: s.price, skuBarCode: s.skuBarCode, specName: s.specName }
    }
  }
  // 3. 关键词模糊匹配
  const text = (specText || '') + (detailText || '')
  for (const kw of keywordsPriority) {
    if (text.includes(kw)) {
      const match = specs.find(s => (s.specName || '').includes(kw))
      if (match) {
        return { specId: match.specId, price: match.price, skuBarCode: match.skuBarCode, specName: match.specName }
      }
    }
  }
  return null
}

/**
 * 智能规格匹配 - 针对28种品类分别实现（engine.py 完整逻辑）
 * @param {Array} specs - getProductAllSpecV3.do 返回的规格列表
 * @param {number} categoryId - serviceId
 * @param {string} specText - 飞书字段"规格"内容
 * @param {string} detailText - 需求详情全文
 * @returns {{ specId, price, skuBarCode, specName }}
 */
export function smartMatchSpec(specs, categoryId, specText = '', detailText = '') {
  if (!specs || specs.length === 0) return null

  const text = specText + ' ' + detailText
  const defaults = { specId: specs[0].specId, price: specs[0].price, skuBarCode: specs[0].skuBarCode, specName: specs[0].specName || '' }

  // 315 - 洗衣机清洗
  if (categoryId === 315) {
    if (text.includes('双滚筒')) return _matchSpecByKeywords(specs, ['双滚筒'], specText, detailText) || defaults
    if (text.includes('半拆')) return _matchSpecByKeywords(specs, ['半拆'], specText, detailText) || defaults
    if (text.includes('滚筒')) {
      const s = specs.find(s => (s.specName || '').includes('滚筒') && !s.specName.includes('双滚筒'))
      if (s) return { specId: s.specId, price: s.price, skuBarCode: s.skuBarCode, specName: s.specName }
    }
    return _matchSpecByKeywords(specs, ['波轮拆', '波轮半', '波轮'], specText, detailText) || defaults
  }

  // 302 - 空调清洗
  if (categoryId === 302) {
    return _matchSpecByKeywords(specs, ['柜机', '挂机', '任选', '柜', '挂'], specText, detailText) || defaults
  }

  // 9096 - 中央空调清洗（X组进出风口）
  if (categoryId === 9096) {
    const cnNums = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二']
    // 中文数字匹配
    for (let n = 0; n < 12; n++) {
      if (text.includes(`${n + 1}`) || text.includes(cnNums[n])) {
        const target = `${cnNums[n]}组进出风口`
        const s = specs.find(s => s.specName === target)
        if (s) return { specId: s.specId, price: s.price, skuBarCode: s.skuBarCode, specName: target }
      }
    }
    // 数字匹配 "3组"
    const grpMatch = text.match(/(\d+)\s*组/)
    if (grpMatch) {
      const n = parseInt(grpMatch[1])
      if (n >= 1 && n <= 12) {
        const target = `${cnNums[n - 1]}组进出风口`
        const s = specs.find(s => s.specName === target)
        if (s) return { specId: s.specId, price: s.price, skuBarCode: s.skuBarCode, specName: target }
      }
    }
    return defaults
  }

  // 301 - 擦玻璃
  if (categoryId === 301) {
    return _matchSpecByKeywords(specs, ['纱窗', '玻璃'], specText, detailText) || defaults
  }

  // 303 - 冰箱清洗
  if (categoryId === 303) {
    return _matchSpecByKeywords(specs, ['对开', '多开', '三开', '双门', '单开', '单/双'], specText, detailText) || defaults
  }

  // 314 - 油烟机清洗
  if (categoryId === 314) {
    if (text.includes('免拆')) return _matchSpecByKeywords(specs, ['免拆'], specText, detailText) || defaults
    if (text.includes('灶台')) return _matchSpecByKeywords(specs, ['拆洗+灶台'], specText, detailText) || defaults
    const s = specs.find(s => (s.specName || '').includes('拆洗') && !s.specName.includes('免拆'))
    if (s) return { specId: s.specId, price: s.price, skuBarCode: s.skuBarCode, specName: s.specName }
    return defaults
  }

  // 9091 - 全屋大扫除（按建筑面积）
  if (categoryId === 9091) {
    const area = _extractArea(text)
    if (area !== null) {
      if (area <= 60) return _matchSpecByKeywords(specs, ['60平', '60以下'], specText, detailText) || defaults
      if (area <= 80) return _matchSpecByKeywords(specs, ['61-80', '60-80', '80平'], specText, detailText) || defaults
      if (area <= 100) return _matchSpecByKeywords(specs, ['81-100', '80-100', '100平'], specText, detailText) || defaults
      if (area <= 120) return _matchSpecByKeywords(specs, ['101-120', '100-120', '120平'], specText, detailText) || defaults
      return _matchSpecByKeywords(specs, ['121-150', '120-150', '150平'], specText, detailText) || defaults
    }
    return _matchSpecByKeywords(specs, ['150平', '120平', '100平', '80平', '60平'], specText, detailText) || defaults
  }

  // 545 - 开荒保洁（初开荒/精细开荒 + 面积）
  if (categoryId === 545) {
    const isFine = /精细|含家具/.test(text)
    const area = _extractArea(text)
    if (area !== null) {
      if (isFine) {
        if (area <= 60) return _matchSpecByKeywords(specs, ['精细', '60平'], specText, detailText) || defaults
        if (area <= 80) return _matchSpecByKeywords(specs, ['精细', '80平'], specText, detailText) || defaults
        if (area <= 100) return _matchSpecByKeywords(specs, ['精细', '100平'], specText, detailText) || defaults
        if (area <= 120) return _matchSpecByKeywords(specs, ['精细', '120平'], specText, detailText) || defaults
        if (area <= 150) return _matchSpecByKeywords(specs, ['精细', '150平'], specText, detailText) || defaults
        if (area <= 180) return _matchSpecByKeywords(specs, ['精细', '180平'], specText, detailText) || defaults
        if (area <= 210) return _matchSpecByKeywords(specs, ['精细', '210平'], specText, detailText) || defaults
        return _matchSpecByKeywords(specs, ['精细', '240平'], specText, detailText) || defaults
      } else {
        if (area <= 60) return _matchSpecByKeywords(specs, ['初', '60平'], specText, detailText) || defaults
        if (area <= 80) return _matchSpecByKeywords(specs, ['初', '80平'], specText, detailText) || defaults
        if (area <= 100) return _matchSpecByKeywords(specs, ['初', '100平'], specText, detailText) || defaults
        if (area <= 120) return _matchSpecByKeywords(specs, ['初', '120平'], specText, detailText) || defaults
        if (area <= 150) return _matchSpecByKeywords(specs, ['初', '150平'], specText, detailText) || defaults
        if (area <= 180) return _matchSpecByKeywords(specs, ['初', '180平'], specText, detailText) || defaults
        if (area <= 210) return _matchSpecByKeywords(specs, ['初', '210平'], specText, detailText) || defaults
        return _matchSpecByKeywords(specs, ['初', '240平'], specText, detailText) || defaults
      }
    }
    if (isFine) return _matchSpecByKeywords(specs, ['精细', '含家具'], specText, detailText) || defaults
    return _matchSpecByKeywords(specs, ['初', '不含家具', '四居室', '三居室', '两居室', '一居室'], specText, detailText) || defaults
  }

  // 9093 - 全屋除菌保洁
  if (categoryId === 9093) {
    return _matchSpecByKeywords(specs, ['四居室', '三居室', '二居室', '一居室'], specText, detailText) || defaults
  }

  // 9118 - 养宠家庭保洁
  if (categoryId === 9118) {
    return _matchSpecByKeywords(specs, ['6小时', '4小时', '3小时'], specText, detailText) || defaults
  }

  // 9115 - 厨房保洁
  if (categoryId === 9115) {
    return _matchSpecByKeywords(specs, ['橱柜整理', '9项', '8项', '6项', '全域'], specText, detailText) || defaults
  }

  // 9116 - 卫浴保洁
  if (categoryId === 9116) {
    return _matchSpecByKeywords(specs, ['2间卫浴+洗衣机', '1间卫浴+洗衣机', '2间卫浴', '1间卫浴'], specText, detailText) || defaults
  }

  // 9102 - 热水器清洗
  if (categoryId === 9102) {
    return _matchSpecByKeywords(specs, ['燃气', '电热水器拆', '电热水器免', '拆洗', '免拆'], specText, detailText) || defaults
  }

  // 9103 - 布艺沙发清洗
  if (categoryId === 9103) {
    return _matchSpecByKeywords(specs, ['座椅', '沙发'], specText, detailText) || defaults
  }

  // 9105 - 床垫清洗
  if (categoryId === 9105) {
    return _matchSpecByKeywords(specs, ['双面', '双人', '单人'], specText, detailText) || defaults
  }

  // 9104 - 地毯清洗
  if (categoryId === 9104) {
    return _matchSpecByKeywords(specs, ['米', '起下', '平米'], specText, detailText) || defaults
  }

  // 9106 - 窗帘清洗
  if (categoryId === 9106) {
    return _matchSpecByKeywords(specs, ['5-8米', '纱帘5', '3-5米', '纱帘3', '窗帘', '纱帘'], specText, detailText) || defaults
  }

  // 12 - 皮沙发护理
  if (categoryId === 12) {
    return _matchSpecByKeywords(specs, ['座'], specText, detailText) || defaults
  }

  // 8 - 地板打蜡
  if (categoryId === 8) {
    return _matchSpecByKeywords(specs, ['平米', '平方米', '起下'], specText, detailText) || defaults
  }

  // 9107 - 除霉保洁
  if (categoryId === 9107) {
    return _matchSpecByKeywords(specs, ['5小时', '4小时', '3小时', '2小时'], specText, detailText) || defaults
  }

  // 9108 - 管道疏通
  if (categoryId === 9108) {
    return _matchSpecByKeywords(specs, ['复杂', '基础'], specText, detailText) || defaults
  }

  // 9109 - 整理收纳
  if (categoryId === 9109) {
    if (text.includes('新客')) return _matchSpecByKeywords(specs, ['新客体验', '2小时'], specText, detailText) || defaults
    return _matchSpecByKeywords(specs, ['4小时', '3小时', '2小时'], specText, detailText) || defaults
  }

  // 9110 - 整理保洁
  if (categoryId === 9110) {
    if (text.includes('新客')) return _matchSpecByKeywords(specs, ['新客体验', '2小时'], specText, detailText) || defaults
    return _matchSpecByKeywords(specs, ['4小时', '3小时', '2小时'], specText, detailText) || defaults
  }

  // 9111 - 除螨清洁
  if (categoryId === 9111) {
    return _matchSpecByKeywords(specs, ['5居室', '4居室', '3居室', '2居室', '1居室'], specText, detailText) || defaults
  }

  // 9112 - 全屋大扫除+玻璃
  if (categoryId === 9112) {
    const area = _extractArea(text)
    if (area !== null) {
      if (area <= 60) return _matchSpecByKeywords(specs, ['60平', '60以下', '擦窗'], specText, detailText) || defaults
      if (area <= 80) return _matchSpecByKeywords(specs, ['80平', '擦窗'], specText, detailText) || defaults
      if (area <= 100) return _matchSpecByKeywords(specs, ['100平', '擦窗'], specText, detailText) || defaults
      if (area <= 120) return _matchSpecByKeywords(specs, ['120平', '擦窗'], specText, detailText) || defaults
      return _matchSpecByKeywords(specs, ['150平', '擦窗'], specText, detailText) || defaults
    }
    return _matchSpecByKeywords(specs, ['擦窗', '150平', '120平', '100平', '80平', '60平'], specText, detailText) || defaults
  }

  // 9113 - 全屋大扫除+玻璃+家电
  if (categoryId === 9113) {
    const area = _extractArea(text)
    if (area !== null) {
      if (area <= 60) return _matchSpecByKeywords(specs, ['60平', '60以下', '家电'], specText, detailText) || defaults
      if (area <= 80) return _matchSpecByKeywords(specs, ['80平', '家电'], specText, detailText) || defaults
      if (area <= 100) return _matchSpecByKeywords(specs, ['100平', '家电'], specText, detailText) || defaults
      if (area <= 120) return _matchSpecByKeywords(specs, ['120平', '家电'], specText, detailText) || defaults
      return _matchSpecByKeywords(specs, ['150平', '家电'], specText, detailText) || defaults
    }
    return _matchSpecByKeywords(specs, ['家电', '150平', '120平', '100平', '80平', '60平'], specText, detailText) || defaults
  }

  // 9114 - 全屋除蟑
  if (categoryId === 9114) {
    const area = _extractArea(text)
    if (area !== null) {
      if (area <= 60) return _matchSpecByKeywords(specs, ['60平'], specText, detailText) || defaults
      if (area <= 80) return _matchSpecByKeywords(specs, ['80平'], specText, detailText) || defaults
      if (area <= 100) return _matchSpecByKeywords(specs, ['100平'], specText, detailText) || defaults
      if (area <= 120) return _matchSpecByKeywords(specs, ['120平'], specText, detailText) || defaults
      if (area <= 150) return _matchSpecByKeywords(specs, ['150平'], specText, detailText) || defaults
      return _matchSpecByKeywords(specs, ['200平'], specText, detailText) || defaults
    }
    return _matchSpecByKeywords(specs, ['200平', '150平', '120平', '100平', '80平', '60平'], specText, detailText) || defaults
  }

  return defaults
}

/**
 * 从文本中提取建筑面积（平方米）
 */
function _extractArea(text) {
  const m = text.match(/(\d+)\s*平/)
  return m ? parseInt(m[1]) : null
}

/**
 * 计算下单数量
 */
export function calcOrderCount(categoryId, specName, demandDetail, specText) {
  const text = (specText || '') + ' ' + (demandDetail || '') + ' ' + (specName || '')

  if (categoryId === 301) {
    // 擦玻璃 - 按面积，最小10
    const m = text.match(/(\d+)\s*(?:平方|平米|平方米|平方起)/)
    return m ? parseInt(m[1]) : 10
  }

  if (categoryId === 302) {
    // 空调清洗 - 所有规格count固定为1（engine.py Bug修复: 任选N台/1柜N挂都是套餐规格）
    return 1
  }

  if (categoryId === 9096) {
    // 中央空调 - 1组=1单
    return 1
  }

  return 1
}

// 保留旧接口兼容
export { KEYWORD_ORDER as KEYWORD_CATEGORY_MAP }
export const selectBestSpec = (specs, categoryId, demandDetail, specText) =>
  smartMatchSpec(specs, categoryId, specText, demandDetail)
