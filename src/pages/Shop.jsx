import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { t } from '../utils/i18n'

const useStore = () => {
  const [user, setUser] = React.useState({
    id: 'user-1',
    name: 'Pet Lover',
    phone: '13800138000',
    points: 888,
    level: 5
  })

  return { user }
}

const PRODUCT_CATEGORIES = {
  virtual_accessory: { name: t('shop.virtualAccessory'), icon: '👗', color: '#EC4899' },
  pet_stage_upgrade: { name: t('shop.petStageUpgrade'), icon: '🌟', color: '#F59E0B' },
  real_product: { name: t('shop.realProduct'), icon: '🧸', color: '#3B82F6' },
  ai_generated_ip: { name: t('shop.aiGeneratedIp'), icon: '🤖', color: '#8B5CF6' },
  training_course: { name: t('shop.trainingCourse'), icon: '📚', color: '#10B981' }
}

const ProductCard = ({ product, onPurchase }) => {
  const { user } = useStore()
  const canAfford = product.price_type === 'points' ? user.points >= product.price : true

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100"
    >
      <div className="h-32 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-6xl relative">
        {product.image_url || '🎁'}
        <div className="absolute top-2 right-2 px-2 py-1 bg-white/90 rounded-full text-xs font-bold">
          {PRODUCT_CATEGORIES[product.product_type]?.name || 'Product'}
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-bold text-gray-800 mb-1">{product.name}</h3>
        <p className="text-sm text-gray-500 mb-3 line-clamp-2">{product.description}</p>

        <div className="flex items-center justify-between mb-3">
          <div>
            {product.price_type === 'points' ? (
              <span className="text-xl font-bold text-orange-500">{product.price}</span>
            ) : (
              <span className="text-xl font-bold text-green-500">¥{product.price}</span>
            )}
            <span className="text-sm text-gray-400 ml-1">
            {product.price_type === 'points' ? t('shop.points') : t('shop.rmb')}
          </span>
          </div>
          <div className="text-sm text-gray-400">
            {product.stock === -1 ? t('shop.infiniteStock') : `${t('shop.remaining')} ${product.stock}`}
          </div>
        </div>

        <motion.button
          whileHover={{ scale: canAfford ? 1.05 : 1 }}
          whileTap={{ scale: canAfford ? 0.95 : 1 }}
          onClick={() => canAfford && onPurchase && onPurchase(product)}
          disabled={!canAfford}
          className={`w-full py-3 rounded-xl font-bold text-sm ${
            canAfford
              ? 'gradient-bg text-white'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
        >
          {canAfford ? t('feed.buyNow') : t('feed.insufficientPoints')}
        </motion.button>
      </div>
    </motion.div>
  )
}

const PurchaseModal = ({ isOpen, onClose, product, onConfirm }) => {
  const { user } = useStore()
  const [isPurchasing, setIsPurchasing] = useState(false)
  const [purchaseSuccess, setPurchaseSuccess] = useState(false)

  const handlePurchase = async () => {
    setIsPurchasing(true)
    await new Promise(resolve => setTimeout(resolve, 2000))
    setIsPurchasing(false)
    setPurchaseSuccess(true)

    setTimeout(() => {
      onConfirm && onConfirm(product)
      onClose()
      setPurchaseSuccess(false)
    }, 1500)
  }

  if (!isOpen || !product) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-3xl w-full overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {!purchaseSuccess ? (
            <>
              <div className="h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-8xl relative">
                {product.image_url || '🎁'}
              </div>

              <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">{product.name}</h2>
                <p className="text-gray-500 mb-4">{product.description}</p>

                <div className="bg-gray-50 rounded-2xl p-4 mb-6">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-gray-600">{t('shop.allProducts')}</span>
                    <span className="font-medium" style={{ color: PRODUCT_CATEGORIES[product.product_type]?.color }}>
                      {PRODUCT_CATEGORIES[product.product_type]?.icon} {PRODUCT_CATEGORIES[product.product_type]?.name}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">{t('shop.currency')}</span>
                    <span className="font-medium">
                      {product.price_type === 'points' ? `💰 ${t('shop.points')}` : `💳 ${t('shop.currency')}`}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-6">
                  <div>
                    <div className="text-sm text-gray-500">{t('shop.amount')}</div>
                    <div className="text-3xl font-bold text-orange-500">
                      {product.price_type === 'points' ? `${product.price} ${t('shop.points')}` : `¥${product.price}`}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">{t('shop.balance')}</div>
                    <div className="text-xl font-bold text-gray-700">
                      {product.price_type === 'points' ? `${user.points} ${t('shop.points')}` : 'Sufficient'}
                    </div>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handlePurchase}
                  disabled={isPurchasing}
                  className="w-full py-4 gradient-bg text-white rounded-2xl font-bold text-lg"
                >
                  {isPurchasing ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      {t('feed.buying')}
                    </span>
                  ) : (
                    `${t('shop.purchase')} ${product.price_type === 'points' ? `${product.price}${t('shop.points')}` : `¥${product.price}`}`
                  )}
                </motion.button>
              </div>
            </>
          ) : (
            <div className="p-12 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', damping: 10 }}
                className="w-24 h-24 rounded-full gradient-bg mx-auto flex items-center justify-center text-6xl mb-6"
              >
                ✨
              </motion.div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">{t('feed.purchaseSuccess')}</h2>
              <p className="text-gray-500">{t('shop.thankYou')}, {t('feed.itemSent')}</p>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

const Shop = () => {
  const { user } = useStore()
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [selectedProduct, setSelectedProduct] = useState(null)
  
  const handlePurchaseConfirm = (product) => {
    if (product.product_type === 'training_course' && product.skill) {
      try {
        const savedPet = localStorage.getItem('paw_train_pet_state')
        if (savedPet) {
          const pet = JSON.parse(savedPet)
          const learnedSkills = pet.learnedSkills || []
          if (!learnedSkills.find(s => s.id === product.skill.id)) {
            learnedSkills.push(product.skill)
            pet.learnedSkills = learnedSkills
            localStorage.setItem('paw_train_pet_state', JSON.stringify(pet))
          }
        }
      } catch (e) {
        console.error('Failed to save skill:', e)
      }
    }
  }

  const products = [
    {
      id: 'prod-1',
      name: 'Cute Hat Set',
      description: 'Includes 10 cute pet hat accessories',
      product_type: 'virtual_accessory',
      price_type: 'points',
      price: 100,
      stock: -1,
      image_url: '🎩'
    },
    {
      id: 'prod-2',
      name: 'Cool Sunglasses',
      description: 'Make your pet look trendy with sunglasses',
      product_type: 'virtual_accessory',
      price_type: 'points',
      price: 150,
      stock: -1,
      image_url: '🕶️'
    },
    {
      id: 'prod-3',
      name: 'Upgrade to Anime',
      description: 'Unlock anime style pet, get 1000 points instantly',
      product_type: 'pet_stage_upgrade',
      price_type: 'points',
      price: 1000,
      stock: -1,
      image_url: '🎨'
    },
    {
      id: 'prod-4',
      name: 'Upgrade to Realistic',
      description: 'Unlock 3D realistic pet with exclusive skills',
      product_type: 'pet_stage_upgrade',
      price_type: 'points',
      price: 5000,
      stock: -1,
      image_url: '✨'
    },
    {
      id: 'prod-5',
      name: 'Pet Plush Toy',
      description: 'Real product - exclusive plush toy generated by AI',
      product_type: 'real_product',
      price_type: 'rmb',
      price: 99,
      stock: 50,
      image_url: '🧸'
    },
    {
      id: 'prod-6',
      name: 'AI Avatar',
      description: 'AI generates exclusive anime avatar for your pet',
      product_type: 'ai_generated_ip',
      price_type: 'points',
      price: 500,
      stock: -1,
      image_url: '🤖'
    },
    {
      id: 'prod-7',
      name: 'Exclusive Sticker Pack',
      description: '16 AI-generated pet sticker packs',
      product_type: 'ai_generated_ip',
      price_type: 'points',
      price: 300,
      stock: -1,
      image_url: '😺'
    },
    {
      id: 'prod-8',
      name: 'Limited Collar',
      description: 'Leather collar engraved with pet name',
      product_type: 'real_product',
      price_type: 'rmb',
      price: 59,
      stock: 100,
      image_url: '🎀'
    },
    {
      id: 'course-1',
      name: 'Handshake Training',
      description: 'Teach your pet to shake hands',
      product_type: 'training_course',
      price_type: 'points',
      price: 200,
      stock: -1,
      image_url: '🤝',
      skill: { id: 'shake_hands', name: 'Shake Hands', animation: 'shake_hands' }
    },
    {
      id: 'course-2',
      name: 'Sit Training',
      description: 'Teach your pet to sit on command',
      product_type: 'training_course',
      price_type: 'points',
      price: 180,
      stock: -1,
      image_url: '🧘',
      skill: { id: 'sit', name: 'Sit', animation: 'sit' }
    },
    {
      id: 'course-3',
      name: 'Roll Training',
      description: 'Teach your pet to roll over',
      product_type: 'training_course',
      price_type: 'points',
      price: 250,
      stock: -1,
      image_url: '🎯',
      skill: { id: 'roll', name: 'Roll', animation: 'roll' }
    },
    {
      id: 'course-4',
      name: 'Dance Performance',
      description: 'Learn to dance, make your pet a party star',
      product_type: 'training_course',
      price_type: 'points',
      price: 400,
      stock: -1,
      image_url: '💃',
      skill: { id: 'dance', name: 'Dance', animation: 'dance' }
    },
    {
      id: 'course-5',
      name: 'Play Dead Performance',
      description: 'Fun trick - play dead on command',
      product_type: 'training_course',
      price_type: 'points',
      price: 350,
      stock: -1,
      image_url: '💀',
      skill: { id: 'play_dead', name: 'Play Dead', animation: 'play_dead' }
    },
    {
      id: 'course-6',
      name: 'Greeting Training',
      description: 'Learn to bow and greet elders',
      product_type: 'training_course',
      price_type: 'points',
      price: 300,
      stock: -1,
      image_url: '🎊',
      skill: { id: 'greet', name: 'Greet', animation: 'greet' }
    }
  ]

  const filteredProducts = selectedCategory
    ? products.filter(p => p.product_type === selectedCategory)
    : products

  return (
    <div className="h-screen gradient-bg overflow-y-auto">
      <div>
        <div className="w-full">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-effect rounded-2xl p-4 mb-6"
          >
            <div className="flex items-center justify-between mb-2">
              <div>
                <div className="text-sm text-gray-600">{t('shop.myPoints')}</div>
                <div className="text-2xl font-bold text-orange-500">{user.points}</div>
              </div>
              <div className="text-4xl">💰</div>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => { window.location.href = '/recharge' }}
              className="w-full mt-2 py-2 bg-gradient-to-r from-orange-400 to-pink-400 text-white text-sm font-bold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
            >
              💎 Buy Points
            </motion.button>
          </motion.div>

          <div className="mb-6 overflow-x-auto">
            <div className="flex gap-2 pb-2">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  !selectedCategory
                    ? 'gradient-bg text-white'
                    : 'bg-white text-gray-600'
                }`}
              >
                {t('shop.allProducts')}
              </button>
              {Object.entries(PRODUCT_CATEGORIES).map(([key, config]) => (
                <button
                  key={key}
                  onClick={() => setSelectedCategory(key)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                    selectedCategory === key
                      ? 'text-white'
                      : 'bg-white text-gray-600'
                  }`}
                  style={{
                    backgroundColor: selectedCategory === key ? config.color : undefined
                  }}
                >
                  {config.icon} {config.name}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {filteredProducts.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                onPurchase={setSelectedProduct}
              />
            ))}
          </div>
        </div>
      </div>

      <PurchaseModal
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        product={selectedProduct}
        onConfirm={handlePurchaseConfirm}
      />
    </div>
  )
}

export { Shop, ProductCard, PurchaseModal, PRODUCT_CATEGORIES }
export default Shop
