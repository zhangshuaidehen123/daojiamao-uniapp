// 品类配置数据 - 从 APK 反编译提取
// spuCode -> { spuCode, name }
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

// serviceType 映射（用于优惠券查询）
export const SERVICE_TYPE_MAP = {
  301: 38, 302: 302, 303: 303, 314: 314, 315: 315,
  9096: 9096, 9091: 9091, 545: 545, 9093: 9093, 9118: 9118,
  9115: 9115, 9116: 9116, 9102: 9102, 9103: 9103, 9105: 9105,
  9104: 9104, 9106: 9106, 12: 12, 8: 8, 9107: 9107, 9108: 9108,
  9109: 9109, 9110: 9110, 9111: 9111, 9112: 9112, 9113: 9113, 9114: 9114
}

// 关键词到 serviceId 的映射（用于从需求文本识别品类）
export const KEYWORD_CATEGORY_MAP = [
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
 * @param {string} text 包含品类关键词的文本
 * @returns {number|null} serviceId
 */
export function detectCategoryFromText(text) {
  if (!text) return null
  for (const [serviceId, keyword] of KEYWORD_CATEGORY_MAP) {
    if (text.includes(keyword)) return serviceId
  }
  return null
}

/**
 * 获取品类列表（用于下拉选择）
 */
export function getCategoryList() {
  return Object.entries(CATEGORY_CONFIG).map(([id, cfg]) => ({
    value: Number(id),
    label: cfg.name,
    spuCode: cfg.spuCode
  }))
}

/**
 * 选择最优规格
 * Bug修复：原版已有逻辑，此处完整还原
 * 301=擦玻璃（按面积）、302=空调（按台数）、其他按规格名称关键词
 */
export function selectBestSpec(specs, categoryId, demandDetail, specText) {
  if (!specs || specs.length === 0) return null
  
  let keywords = []
  
  if (categoryId === 301) {
    // 擦玻璃 - 按平方面积匹配
    const areaMatch = (specText || demandDetail || '').match(/(\d+)\s*(?:平方|平米)/)
    const area = areaMatch ? parseInt(areaMatch[1]) : 80
    keywords = area <= 60 ? ['60平'] : area <= 80 ? ['80平'] : area <= 100 ? ['100平'] :
               area <= 120 ? ['120平'] : area <= 150 ? ['150平'] : ['200平']
  } else if (categoryId === 302 || categoryId === 9096) {
    // 空调清洗 - 按台数/规格匹配
    if (/任选|柜.*挂/.test(specText || '')) {
      keywords = ['任选']
    } else {
      const countMatch = (specText || demandDetail || '').match(/(\d+)\s*台/)
      const count = countMatch ? parseInt(countMatch[1]) : 1
      keywords = [`${count}台`]
    }
  } else {
    // 其他品类 - 优先用 specText 匹配
    if (specText) keywords = [specText]
  }
  
  // 按关键词匹配
  for (const kw of keywords) {
    const match = specs.find(s => (s.specName || '').includes(kw))
    if (match) return match
  }
  
  console.warn(`规格未精确匹配，使用默认: ${specs[0].specName}`)
  return specs[0]
}

/**
 * 计算空调下单数量
 */
export function calcOrderCount(categoryId, specName, demandDetail, specText) {
  if (categoryId === 301) {
    // 擦玻璃 - 按面积
    const match = (specText || demandDetail || '').match(/(\d+)\s*(?:平方|平米|平方米)/)
    return match ? parseInt(match[1]) : 10
  }
  if (categoryId === 302) {
    // 空调 - 判断套餐
    if (/任选|柜.*挂/.test(specName || '')) return 1
    const match = (specName || '').match(/(\d+)\s*台/) ||
                  (demandDetail || '').match(/(\d+)\s*台/) ||
                  (specText || '').match(/(\d+)\s*台/)
    return match ? parseInt(match[1]) : 1
  }
  return 1
}
