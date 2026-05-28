# 天鹅到家助手 (daojiamao-uniapp)

基于 UniApp 的天鹅到家保洁下单助手，支持品类单、套餐单次、套餐周期三种下单方式，集成排班查询、订单管理和数据看板功能。

## 功能特性

- **品类下单** — 28种保洁品类（擦玻璃、空调清洗、油烟机、全屋大扫除等），智能规格匹配
- **套餐下单** — 单次/周期套餐（日常保洁、做饭、养宠、除菌、大扫除），自动匹配用户套餐
- **排班查询** — 保洁师月度排班日历视图，支持时间段查看
- **订单管理** — 订单列表、状态筛选、搜索、订单详情
- **Cookie管理** — 自动验证、持久化存储

## 技术栈

- **框架**: UniApp (Vue3 Composition API)
- **语言**: JavaScript
- **编译**: HBuilderX / uni-app CLI

## 项目结构

```
src/
├── api/
│   ├── index.js      # API 封装（含 Bug 修复）
│   └── category.js   # 品类配置数据（28种品类）
├── pages/
│   ├── index/        # 首页仪表盘
│   ├── orders/       # 订单管理列表
│   ├── order/
│   │   ├── manual-order.vue  # 手动下单（核心）
│   │   ├── query.vue         # 订单查询
│   │   └── detail.vue        # 订单详情
│   ├── schedule/     # 排班查询
│   ├── logs/         # 运行日志
│   └── settings/     # 系统设置
├── static/
│   └── seller_db.json  # 保洁师数据库（1620人）
├── App.vue
├── manifest.json
└── pages.json
```

## 编译

### HBuilderX
直接用 HBuilderX 打开项目 → 发行 → 原生App-云打包

### GitHub Actions
推送到 GitHub 后自动触发 `.github/workflows/build.yml`

## 版本

v2.5.0

## 主要 Bug 修复

- `serviceTimeStr` 格式：空格替换为 `+`
- 保洁师匹配：优先精确手机号匹配
- 排班查询：按日期去重合并分批请求
- API 返回格式：兼容多种返回格式
- 订单查询：增加保洁师信息提取
- 套餐地址：模糊匹配 + 自动新建
