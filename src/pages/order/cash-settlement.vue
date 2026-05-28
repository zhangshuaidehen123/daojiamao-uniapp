<template>
  <view class="page">
    <view class="card">
      <view class="card-title">现金结算</view>
      <view class="card-desc">输入订单号查询应收金额并执行结算</view>
    </view>

    <!-- 订单号输入 -->
    <view class="card">
      <text class="label">订单号</text>
      <input v-model="orderId" type="number" placeholder="输入16位以上订单号" class="input" @confirm="queryOrder" />
      <button class="btn-primary" @tap="queryOrder" :disabled="loading || !orderId">
        {{ loading ? '查询中...' : '查询订单' }}
      </button>
    </view>

    <!-- 订单信息 -->
    <view v-if="orderInfo" class="card">
      <view class="card-title">订单信息</view>
      <view class="info-row"><text class="info-label">保洁师</text><text class="info-value">{{ orderInfo.sellerName || '--' }}</text></view>
      <view class="info-row"><text class="info-label">服务地址</text><text class="info-value">{{ orderInfo.serviceAddress || '--' }}</text></view>
      <view class="info-row"><text class="info-label">应收金额</text><text class="info-value price">¥{{ orderInfo.cashPayAmount || 0 }}</text></view>
    </view>

    <!-- 结算金额 -->
    <view v-if="orderInfo" class="card">
      <text class="label">结算金额</text>
      <input v-model="amount" type="digit" placeholder="输入结算金额" class="input" />
      <view class="hint">系统应收: ¥{{ orderInfo.cashPayAmount || 0 }}</view>
      <button class="btn-primary" @tap="doSettle" :disabled="loading || !amount || orderInfo.cashPayAmount <= 0">
        {{ loading ? '结算中...' : '确认结算' }}
      </button>
    </view>

    <!-- 结果 -->
    <view v-if="resultMsg" class="card" :class="resultSuccess ? 'card-success' : 'card-error'">
      <text class="result-text">{{ resultMsg }}</text>
    </view>
  </view>
</template>

<script>
import { getOrderCashInfo, cashPayOrder, getCookie, getCrmHeaders } from '@/api/index.js'

export default {
  data() {
    return {
      orderId: '',
      amount: '',
      orderInfo: null,
      loading: false,
      resultMsg: '',
      resultSuccess: false
    }
  },

  methods: {
    async queryOrder() {
      if (!this.orderId || this.orderId.length < 16) {
        uni.showToast({ title: '请输入16位以上订单号', icon: 'none' })
        return
      }
      this.loading = true
      this.resultMsg = ''
      try {
        const res = await getOrderCashInfo(this.orderId)
        if (res.code === 1 && res.data) {
          this.orderInfo = res.data
          this.amount = String(res.data.cashPayAmount || '')
          if (!res.data.cashPayAmount || res.data.cashPayAmount <= 0) {
            this.resultMsg = '系统应收金额为0，无法结算'
            this.resultSuccess = false
          }
        } else {
          uni.showToast({ title: res.message || '查询失败', icon: 'none' })
        }
      } catch (e) {
        uni.showToast({ title: e.message, icon: 'none' })
      } finally {
        this.loading = false
      }
    },

    async doSettle() {
      const sysAmount = this.orderInfo?.cashPayAmount || 0
      const inputAmount = parseFloat(this.amount)

      // 金额校验（engine.py: 需求金额与系统金额一致性校验）
      if (Math.abs(inputAmount - sysAmount) > 0.01) {
        uni.showModal({
          title: '金额不一致',
          content: `系统应收¥${sysAmount}，你输入的是¥${inputAmount}，是否继续？`,
          success: async (r) => {
            if (r.confirm) await this._executeSettle()
          }
        })
        return
      }

      await this._executeSettle()
    },

    async _executeSettle() {
      this.loading = true
      this.resultMsg = ''
      try {
        const res = await cashPayOrder(this.orderId, parseFloat(this.amount))
        if (res.code === 1 && res.data === true) {
          this.resultMsg = `结算成功：订单号${this.orderId}，金额¥${this.amount}`
          this.resultSuccess = true
        } else {
          this.resultMsg = `结算失败：${res.message || '未知错误'}`
          this.resultSuccess = false
        }
      } catch (e) {
        this.resultMsg = `结算异常：${e.message}`
        this.resultSuccess = false
      } finally {
        this.loading = false
      }
    }
  }
}
</script>

<style scoped>
.page { padding: 12px; min-height: 100vh; background: #f5f5f5; }

.card {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.08);
}

.card-title { font-size: 16px; font-weight: 700; color: #333; margin-bottom: 4px; }
.card-desc { font-size: 13px; color: #999; }

.card-success { border-left: 4px solid #4CAF50; }
.card-error { border-left: 4px solid #F44336; }

.label { font-size: 14px; color: #666; margin-bottom: 6px; display: block; }

.input {
  width: 100%;
  height: 44px;
  background: #f5f5f5;
  border-radius: 8px;
  padding: 0 12px;
  font-size: 15px;
  box-sizing: border-box;
  margin-bottom: 10px;
}

.hint { font-size: 13px; color: #999; margin-bottom: 10px; }

.btn-primary {
  width: 100%;
  height: 44px;
  background: #2196F3;
  color: #fff;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  border: none;
  line-height: 44px;
  text-align: center;
}
.btn-primary[disabled] { background: #bdbdbd; }

.info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f0f0f0; }
.info-label { font-size: 14px; color: #999; }
.info-value { font-size: 14px; color: #333; }
.info-value.price { color: #F44336; font-weight: 700; font-size: 18px; }

.result-text { font-size: 15px; color: #333; }
</style>
