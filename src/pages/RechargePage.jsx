import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import useStore from '../store/useStore'
import api from '../services/api'
import PointsNotificationModal from '../components/PointsNotificationModal'

const RECHARGE_PACKAGES = [
  { id: 'pkg-1', name: 'Starter Pack', coins: 100, price: 10, popular: false, icon: '🌟' },
  { id: 'pkg-2', name: 'Growth Pack', coins: 500, price: 10, popular: false, icon: '✨' },
  { id: 'pkg-3', name: 'Premium Pack', coins: 1200, price: 10, popular: true, icon: '💎' },
  { id: 'pkg-4', name: 'Ultimate Pack', coins: 3000, price: 20, popular: false, icon: '👑' },
  { id: 'pkg-5', name: 'Unlimited Pack', coins: 8888, price: 50, popular: false, icon: '🏆' },
]

const RechargePage = () => {
  const { user, setUser } = useStore()
  const navigate = useNavigate()
  const [selectedPackage, setSelectedPackage] = useState(null)
  const [isRecharging, setIsRecharging] = useState(false)
  const [showPointsModal, setShowPointsModal] = useState(false)
  const [earnedCoins, setEarnedCoins] = useState(0)

  const handleRecharge = async () => {
    if (!selectedPackage) return
    
    setIsRecharging(true)
    
    try {
      const response = await api.post('/coins/recharge', {
        user_id: user?.id || 'user-1',
        amount: selectedPackage.coins,
        coin_type: 'diamond',
        payment_method: 'wechat'
      })
      
      if (response.data.success) {
        if (setUser && user) {
          setUser({ 
            ...user, 
            points: (user.points || 0) + selectedPackage.coins 
          })
        }
        setEarnedCoins(selectedPackage.coins)
        setShowPointsModal(true)
      }
    } catch (error) {
      console.error('Recharge failed:', error)
      alert('Recharge failed, please try again')
    } finally {
      setIsRecharging(false)
    }
  }

  return (
    <div className="h-screen gradient-bg overflow-y-auto">
      <div className="p-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-6"
        >
          <button 
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-white/80 flex items-center justify-center text-gray-700 hover:bg-white transition-all"
          >
            
          </button>
          <h1 className="text-xl font-bold text-gray-800">💰 Buy Points</h1>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-effect rounded-3xl p-6 mb-6 text-center"
        >
          <div className="text-sm text-gray-500 mb-2">Current Points Balance</div>
          <div className="text-4xl font-bold text-orange-500 flex items-center justify-center gap-2">
            💎 {user?.points || 0}
            <span className="text-lg text-gray-400">Points</span>
          </div>
        </motion.div>

        <div className="text-center mb-4">
          <h2 className="text-lg font-bold text-gray-700">Select Package</h2>
          <p className="text-sm text-gray-500 mt-1">All packages support PayPal payment</p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          {RECHARGE_PACKAGES.map((pkg, index) => (
            <motion.div
              key={pkg.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => setSelectedPackage(pkg)}
              className={`relative rounded-2xl p-4 cursor-pointer transition-all ${
                selectedPackage?.id === pkg.id
                  ? 'ring-4 ring-orange-400 scale-105'
                  : ''
              } ${pkg.popular ? 'bg-gradient-to-br from-orange-100 to-pink-100 border-2 border-orange-300' : 'bg-white'}`}
            >
              {pkg.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-orange-500 to-pink-500 text-white text-xs font-bold rounded-full">
                  Popular
                </div>
              )}
              
              <div className="text-center">
                <div className="text-3xl mb-2">{pkg.icon}</div>
                <div className="font-bold text-gray-800">{pkg.name}</div>
                <div className="text-2xl font-bold text-orange-500 mt-2">
                  {pkg.coins} <span className="text-sm text-gray-500">Points</span>
                </div>
                <div className="text-green-600 font-bold mt-1">${pkg.price}</div>
              </div>
              
              {selectedPackage?.id === pkg.id && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-2 right-2 w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center text-white text-sm"
                >
                  ✓
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>

        {/* PayPal Payment Section — for $10 packages */}
        {selectedPackage && selectedPackage.price === 10 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-6 mb-6 border-2 border-[#FFD140]/50"
          >
            <div className="text-center mb-4">
              <div className="text-lg font-bold text-gray-800 mb-1">
                PayPal Checkout — ${selectedPackage.price}.00 USD
              </div>
              <div className="text-sm text-gray-500">
                {selectedPackage.coins} Points will be added to your account after payment
              </div>
            </div>

            <div className="flex justify-center">
              <div>
                <style>{`.pp-btn-recharge{text-align:center;border:none;border-radius:0.25rem;min-width:11.625rem;padding:0 2rem;height:2.625rem;font-weight:bold;background-color:#FFD140;color:#000000;font-family:"Helvetica Neue",Arial,sans-serif;font-size:1rem;line-height:1.25rem;cursor:pointer;}`}</style>
                <form action="https://www.paypal.com/ncp/payment/T66CFEXS4JLGJ?locale.x=en_US" method="post" target="_blank" style={{display:'inline-grid',justifyItems:'center',alignContent:'start',gap:'0.5rem'}}>
                  <input type="hidden" name="lc" value="US" />
                  <input type="hidden" name="country.x" value="US" />
                  <input className="pp-btn-recharge" type="submit" value="Pay with PayPal" />
                  <img src="https://www.paypalobjects.com/images/Debit_Credit_APM.svg" alt="cards" />
                  <section style={{fontSize:'0.75rem',textAlign:'center'}}>
                    Pay securely with <img src="https://www.paypalobjects.com/paypal-ui/logos/svg/paypal-wordmark-color.svg" alt="PayPal" style={{height:'0.875rem',verticalAlign:'middle'}} />
                  </section>
                </form>
              </div>
            </div>

            <p className="text-xs text-gray-400 text-center mt-4">
              You will be redirected to PayPal to complete your payment securely.
              Points are credited automatically after successful payment.
            </p>
          </motion.div>
        )}

        {/* PayPal Payment Section — for $20 packages */}
        {selectedPackage && selectedPackage.price === 20 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-6 mb-6 border-2 border-[#FFD140]/50"
          >
            <div className="text-center mb-4">
              <div className="text-lg font-bold text-gray-800 mb-1">
                PayPal Checkout — ${selectedPackage.price}.00 USD
              </div>
              <div className="text-sm text-gray-500">
                {selectedPackage.coins} Points will be added to your account after payment
              </div>
            </div>

            <div className="flex justify-center">
              <div>
                <style>{`.pp-btn-recharge-20{text-align:center;border:none;border-radius:0.25rem;min-width:11.625rem;padding:0 2rem;height:2.625rem;font-weight:bold;background-color:#FFD140;color:#000000;font-family:"Helvetica Neue",Arial,sans-serif;font-size:1rem;line-height:1.25rem;cursor:pointer;}`}</style>
                <form action="https://www.paypal.com/ncp/payment/5X7WAVHXUMJC2?locale.x=en_US" method="post" target="_blank" style={{display:'inline-grid',justifyItems:'center',alignContent:'start',gap:'0.5rem'}}>
                  <input type="hidden" name="lc" value="US" />
                  <input type="hidden" name="country.x" value="US" />
                  <input className="pp-btn-recharge-20" type="submit" value="Pay with PayPal" />
                  <img src="https://www.paypalobjects.com/images/Debit_Credit_APM.svg" alt="cards" />
                  <section style={{fontSize:'0.75rem',textAlign:'center'}}>
                    Pay securely with <img src="https://www.paypalobjects.com/paypal-ui/logos/svg/paypal-wordmark-color.svg" alt="PayPal" style={{height:'0.875rem',verticalAlign:'middle'}} />
                  </section>
                </form>
              </div>
            </div>

            <p className="text-xs text-gray-400 text-center mt-4">
              You will be redirected to PayPal to complete your payment securely.
              Points are credited automatically after successful payment.
            </p>
          </motion.div>
        )}

        {/* PayPal Payment Section — for $50 packages */}
        {selectedPackage && selectedPackage.price === 50 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-6 mb-6 border-2 border-[#FFD140]/50"
          >
            <div className="text-center mb-4">
              <div className="text-lg font-bold text-gray-800 mb-1">
                PayPal Checkout — ${selectedPackage.price}.00 USD
              </div>
              <div className="text-sm text-gray-500">
                {selectedPackage.coins} Points will be added to your account after payment
              </div>
            </div>

            <div className="flex justify-center">
              <div>
                <style>{`.pp-btn-recharge-50{text-align:center;border:none;border-radius:0.25rem;min-width:11.625rem;padding:0 2rem;height:2.625rem;font-weight:bold;background-color:#FFD140;color:#000000;font-family:"Helvetica Neue",Arial,sans-serif;font-size:1rem;line-height:1.25rem;cursor:pointer;}`}</style>
                <form action="https://www.paypal.com/ncp/payment/MRUXQP3UQ3TML?locale.x=en_US" method="post" target="_blank" style={{display:'inline-grid',justifyItems:'center',alignContent:'start',gap:'0.5rem'}}>
                  <input type="hidden" name="lc" value="US" />
                  <input type="hidden" name="country.x" value="US" />
                  <input className="pp-btn-recharge-50" type="submit" value="Pay with PayPal" />
                  <img src="https://www.paypalobjects.com/images/Debit_Credit_APM.svg" alt="cards" />
                  <section style={{fontSize:'0.75rem',textAlign:'center'}}>
                    Pay securely with <img src="https://www.paypalobjects.com/paypal-ui/logos/svg/paypal-wordmark-color.svg" alt="PayPal" style={{height:'0.875rem',verticalAlign:'middle'}} />
                  </section>
                </form>
              </div>
            </div>

            <p className="text-xs text-gray-400 text-center mt-4">
              You will be redirected to PayPal to complete your payment securely.
              Points are credited automatically after successful payment.
            </p>
          </motion.div>
        )}

        {/* Non-PayPal packages fallback button */}
        {selectedPackage && selectedPackage.price !== 10 && selectedPackage.price !== 20 && selectedPackage.price !== 50 && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleRecharge}
            disabled={isRecharging}
            className={`w-full py-4 rounded-2xl font-bold text-lg transition-all ${
              !isRecharging
                ? 'gradient-bg text-white'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isRecharging ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Recharging...
              </span>
            ) : (
              `Recharge Now $${selectedPackage.price}`
            )}
          </motion.button>
        )}

        {!selectedPackage && (
          <div className="text-center py-6 text-gray-400 text-sm">
            Select a package above to continue
          </div>
        )}

        <div className="mt-6 space-y-3">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>💳 Supported Payment Methods</span>
            <div className="flex gap-2">
              <span className="px-2 py-1 bg-[#FFD140]/20 text-gray-700 rounded-lg text-xs font-medium">PayPal</span>
              <span className="px-2 py-1 bg-green-100 text-green-600 rounded-lg text-xs">WeChat</span>
              <span className="px-2 py-1 bg-blue-100 text-blue-600 rounded-lg text-xs">Alipay</span>
            </div>
          </div>
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>🔒 Payment Security</span>
            <span className="text-green-500">Encrypted Protection</span>
          </div>
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>⏱️ Delivery Time</span>
            <span className="text-green-500">Instant</span>
          </div>
        </div>
      </div>

      <PointsNotificationModal
        isOpen={showPointsModal}
        onClose={() => {
          setShowPointsModal(false)
          navigate('/profile')
        }}
        points={earnedCoins}
        source="purchase"
        onConfirm={() => {
          setShowPointsModal(false)
          navigate('/profile')
        }}
      />
    </div>
  )
}

export default RechargePage
