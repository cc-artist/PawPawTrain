import React, { useState, useRef, useEffect } from 'react';
import { t } from '../utils/i18n';

const AIGoodsDesigner = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [designProposals, setDesignProposals] = useState([]);
  const [petFeatures, setPetFeatures] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('accessories');
  const [myCreations, setMyCreations] = useState([]);
  const [myOrders, setMyOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('create');
  const [uploadedImage, setUploadedImage] = useState(null);
  const [petPosts, setPetPosts] = useState([]);
  const [showPosts, setShowPosts] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadPetPosts();
  }, []);

  const loadPetPosts = () => {
    try {
      const saved = localStorage.getItem('paw_train_all_posts');
      if (saved) {
        const allPosts = JSON.parse(saved);
        const myPosts = allPosts.filter(post => post.isMine && post.media);
        setPetPosts(myPosts);
      }
    } catch (e) {
      console.error('Error loading posts:', e);
    }
  };

  const selectFromPosts = (post) => {
    if (post.media) {
      setSelectedImage(post.media);
      if (post.media.startsWith('data:image')) {
        setImagePreview(post.media);
      } else {
        setImagePreview(post.media);
      }
      setShowPosts(false);
    }
  };

  const categories = [
    { id: 'accessories', name: t('aiDesigner.accessories'), icon: '🎀', description: t('aiDesigner.accessoriesDesc') },
    { id: 'home', name: t('aiDesigner.home'), icon: '🏠', description: t('aiDesigner.homeDesc') },
    { id: 'digital', name: t('aiDesigner.digital'), icon: '📱', description: t('aiDesigner.digitalDesc') },
    { id: 'medals', name: t('aiDesigner.medals'), icon: '🏅', description: t('aiDesigner.medalsDesc') },
    { id: 'album', name: t('aiDesigner.album'), icon: '📷', description: t('aiDesigner.albumDesc') }
  ];

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result;
        setSelectedImage(base64);
        setImagePreview(URL.createObjectURL(file));
      };
      reader.readAsDataURL(file);
    }
  };

  const generateMockProposals = () => {
    const mockFeatures = {
      breed: t('aiDesigner.breed'),
      colors: ['Orange', 'White'],
      patterns: ['Striped', 'Spotted']
    };

    const mockProposals = [
      {
        id: 'mock-1',
        name: t('aiDesigner.customAccessories'),
        template: t('aiDesigner.accessories'),
        description: t('aiDesigner.basedOnFeatures'),
        designElements: {
          primaryColor: '#FF9500',
          secondaryColor: '#FFFFFF',
          style: t('aiDesigner.cute')
        },
        estimatedPrice: { points: 500, rmb: 99 },
        crowdfundingGoal: 100,
        estimatedDelivery: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      },
      {
        id: 'mock-2',
        name: t('aiDesigner.homeGoods'),
        template: t('aiDesigner.home'),
        description: t('aiDesigner.integrateIntoLife'),
        designElements: {
          primaryColor: '#3B82F6',
          secondaryColor: '#F3F4F6',
          style: t('aiDesigner.minimalist')
        },
        estimatedPrice: { points: 800, rmb: 159 },
        crowdfundingGoal: 200,
        estimatedDelivery: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000)
      },
      {
        id: 'mock-3',
        name: t('aiDesigner.digitalAccessories'),
        template: t('aiDesigner.digital'),
        description: t('aiDesigner.uniqueDigital'),
        designElements: {
          primaryColor: '#EC4899',
          secondaryColor: '#1F2937',
          style: t('aiDesigner.trendy')
        },
        estimatedPrice: { points: 600, rmb: 129 },
        crowdfundingGoal: 150,
        estimatedDelivery: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000)
      }
    ];

    return { proposals: mockProposals, features: mockFeatures };
  };

  const handleGenerate = async () => {
    if (!selectedImage) {
      alert(t('aiDesigner.clickUpload'));
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch('http://localhost:8082/api/ai-goods/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_base64: selectedImage,
          preferences: { category: selectedCategory }
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setDesignProposals(data.proposals);
        setPetFeatures(data.petFeatures);
      } else {
        const mockData = generateMockProposals();
        setDesignProposals(mockData.proposals);
        setPetFeatures(mockData.features);
      }
    } catch (error) {
      console.error('生成失败:', error);
      const mockData = generateMockProposals();
      setDesignProposals(mockData.proposals);
      setPetFeatures(mockData.features);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectDesign = async (proposal) => {
    try {
      const response = await fetch('http://localhost:8082/api/ai-goods/list', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await response.json();
      if (data.success) {
        setMyCreations(data.goods.filter(g => g.creator_id === 'user-1'));
      }
    } catch (error) {
      console.error('获取我的创作失败:', error);
    }
  };

  const handlePreorder = async (goodsId) => {
    try {
      const response = await fetch('http://localhost:8082/api/ai-goods/preorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goods_id: goodsId, quantity: 1 })
      });
      const data = await response.json();
      if (data.success) {
        alert(`预售成功！订单金额：¥${data.order.amount}`);
        loadMyOrders();
      } else {
        alert('预售失败：' + data.error);
      }
    } catch (error) {
      console.error('预售失败:', error);
      alert('预售失败，请稍后重试');
    }
  };

  const loadMyOrders = async () => {
    try {
      const response = await fetch('http://localhost:8082/api/ai-goods/my-orders');
      const data = await response.json();
      if (data.success) {
        setMyOrders(data.orders);
      }
    } catch (error) {
      console.error('获取订单失败:', error);
    }
  };

  const handlePay = async (orderId) => {
    try {
      const response = await fetch(`http://localhost:8082/api/ai-goods/order/${orderId}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await response.json();
      if (data.success) {
        alert('支付成功！');
        loadMyOrders();
      } else {
        alert('支付失败：' + data.error);
      }
    } catch (error) {
      console.error('支付失败:', error);
      alert('支付失败，请稍后重试');
    }
  };

  const loadMyCreations = async () => {
    try {
      const response = await fetch('http://localhost:8082/api/ai-goods/my-creations');
      const data = await response.json();
      if (data.success) {
        setMyCreations(data.goods);
      }
    } catch (error) {
      console.error('获取创作失败:', error);
    }
  };

  React.useEffect(() => {
    loadMyOrders();
    loadMyCreations();
  }, []);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>🎨 {t('aiDesigner.title')}</h1>
        <p style={styles.subtitle}>{t('aiDesigner.subtitle')}</p>
      </div>

      <div style={styles.tabContainer}>
        <button
          style={{...styles.tab, ...(activeTab === 'create' ? styles.activeTab : {})}}
          onClick={() => setActiveTab('create')}
        >
          ✨ {t('aiDesigner.create')}
        </button>
        <button
          style={{...styles.tab, ...(activeTab === 'orders' ? styles.activeTab : {})}}
          onClick={() => setActiveTab('orders')}
        >
          📦 {t('aiDesigner.orders')}
        </button>
        <button
          style={{...styles.tab, ...(activeTab === 'creations' ? styles.activeTab : {})}}
          onClick={() => setActiveTab('creations')}
        >
          🎁 {t('aiDesigner.creations')}
        </button>
      </div>

      {activeTab === 'create' && (
        <div style={styles.createSection}>
          <div style={styles.uploadSection}>
            <div style={styles.uploadTabs}>
              <button
                style={{...styles.uploadTab, ...(!showPosts ? styles.activeUploadTab : {})}}
                onClick={() => setShowPosts(false)}
              >
                📷 {t('aiDesigner.uploadNew')}
              </button>
              <button
                style={{...styles.uploadTab, ...(showPosts ? styles.activeUploadTab : {})}}
                onClick={() => setShowPosts(true)}
              >
                📚 {t('aiDesigner.selectUploaded')}
                {petPosts.length > 0 && <span style={styles.tabBadge}>{petPosts.length}</span>}
              </button>
            </div>

            {!showPosts ? (
              <div>
                <div style={styles.imageUploadArea} onClick={() => fileInputRef.current?.click()}>
                  {imagePreview ? (
                    <img src={imagePreview} alt="预览" style={styles.imagePreview} />
                  ) : (
                    <div style={styles.uploadPlaceholder}>
                      <div style={styles.uploadIcon}>📷</div>
                      <p style={styles.uploadText}>{t('aiDesigner.clickUpload')}</p>
                      <p style={styles.uploadHint}>{t('aiDesigner.supportedFormat')}</p>
                    </div>
                  )}
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/*"
                  style={styles.fileInput}
                />
              </div>
            ) : (
              <div style={styles.postsGrid}>
                {petPosts.length > 0 ? (
                  petPosts.map((post, index) => (
                    <div
                      key={post.id || index}
                      style={styles.postCard}
                      onClick={() => selectFromPosts(post)}
                    >
                      {post.media.startsWith('data:image') ? (
                        <img src={post.media} alt="Pet" style={styles.postImage} />
                      ) : (
                        <div style={styles.postIcon}>{post.media}</div>
                      )}
                      <div style={styles.postInfo}>
                        <span style={styles.postDate}>{post.time || '未知时间'}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={styles.emptyPosts}>
                    <div style={styles.emptyIcon}>📭</div>
                    <p>{t('aiDesigner.noPosts')}</p>
                    <button
                      style={styles.emptyButton}
                      onClick={() => setShowPosts(false)}
                    >
                      {t('aiDesigner.goUpload')}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div style={styles.categorySection}>
            <h3 style={styles.sectionTitle}>{t('aiDesigner.selectCategory')}</h3>
            <div style={styles.categoryGrid}>
              {categories.map(cat => (
                <div
                  key={cat.id}
                  style={{
                    ...styles.categoryCard,
                    ...(selectedCategory === cat.id ? styles.categorySelected : {})
                  }}
                  onClick={() => setSelectedCategory(cat.id)}
                >
                  <div style={styles.categoryIcon}>{cat.icon}</div>
                  <div style={styles.categoryName}>{cat.name}</div>
                  <div style={styles.categoryDesc}>{cat.description}</div>
                </div>
              ))}
            </div>
          </div>

          <button
            style={styles.generateButton}
            onClick={handleGenerate}
            disabled={isGenerating || !selectedImage}
          >
            {isGenerating ? `🤖 ${t('aiDesigner.designing')}` : `✨ ${t('aiDesigner.startDesign')}`}
          </button>

          {designProposals.length > 0 && (
            <div style={styles.proposalsSection}>
              <h3 style={styles.sectionTitle}>🎉 {t('aiDesigner.designProposals')}</h3>
              <p style={styles.petFeaturesText}>
                {t('aiDesigner.petFeatures')}
                {petFeatures && (
                  <span>
                    {petFeatures.breed} | {t('aiDesigner.colors')}：{petFeatures.colors?.join(', ')} | {t('aiDesigner.patterns')}：{petFeatures.patterns?.join(', ')}
                  </span>
                )}
              </p>
              
              <div style={styles.proposalsGrid}>
                {designProposals.map((proposal, index) => (
                  <div key={proposal.id} style={styles.proposalCard}>
                    <div style={styles.proposalHeader}>
                      <h4 style={styles.proposalName}>{proposal.name}</h4>
                      <span style={styles.proposalCategory}>{proposal.template}</span>
                    </div>
                    
                    <p style={styles.proposalDesc}>{proposal.description}</p>
                    
                    <div style={styles.designElements}>
                      <div style={styles.elementItem}>
                        <span style={styles.elementLabel}>{t('aiDesigner.primaryColor')}：</span>
                        <span style={styles.elementValue}>{proposal.designElements.primaryColor}</span>
                      </div>
                      <div style={styles.elementItem}>
                        <span style={styles.elementLabel}>{t('aiDesigner.secondaryColor')}：</span>
                        <span style={styles.elementValue}>{proposal.designElements.secondaryColor}</span>
                      </div>
                      <div style={styles.elementItem}>
                        <span style={styles.elementLabel}>{t('aiDesigner.style')}：</span>
                        <span style={styles.elementValue}>{proposal.designElements.style}</span>
                      </div>
                    </div>

                    <div style={styles.crowdfundingInfo}>
                      <div style={styles.priceTag}>⭐ {proposal.estimatedPrice?.points || proposal.estimatedPrice} {t('shop.points')}</div>
                      <div style={styles.crowdfundingProgress}>
                        <div style={styles.goalInfo}>
                          {t('aiDesigner.crowdfundingGoal')}：{proposal.crowdfundingGoal}件
                        </div>
                        <div style={styles.deliveryInfo}>
                          {t('aiDesigner.estimatedDelivery')}：{proposal.estimatedDelivery ? new Date(proposal.estimatedDelivery).toLocaleDateString() : 'TBD'}
                        </div>
                      </div>
                    </div>

                    <button
                      style={styles.selectButton}
                      onClick={() => handleSelectDesign(proposal)}
                    >
                      {t('aiDesigner.selectDesign')}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'orders' && (
        <div style={styles.ordersSection}>
          <h3 style={styles.sectionTitle}>📦 {t('aiDesigner.myPreorders')}</h3>
          {myOrders.length === 0 ? (
            <div style={styles.emptyState}>{t('aiDesigner.noOrders')}</div>
          ) : (
            <div style={styles.ordersList}>
              {myOrders.map(order => (
                <div key={order.id} style={styles.orderCard}>
                  <div style={styles.orderInfo}>
                    <h4 style={styles.orderName}>{order.goods?.name}</h4>
                    <p style={styles.orderDesc}>{order.goods?.description}</p>
                    <div style={styles.orderMeta}>
                      <span>{t('aiDesigner.orderNumber')}：{order.id}</span>
                      <span>{t('aiDesigner.quantity')}：{order.quantity}</span>
                      <span>{t('aiDesigner.amount')}：¥{order.amount}</span>
                    </div>
                  </div>
                  <div style={styles.orderStatus}>
                    <span style={{
                      ...styles.statusBadge,
                      ...(order.status === 'paid' ? styles.statusPaid : styles.statusPending)
                    }}>
                      {order.status === 'paid' ? `✅ ${t('aiDesigner.paid')}` : `⏳ ${t('aiDesigner.pending')}`}
                    </span>
                    {order.status === 'pending' && (
                      <button
                        style={styles.payButton}
                        onClick={() => handlePay(order.id)}
                      >
                        {t('aiDesigner.payNow')}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'creations' && (
        <div style={styles.creationsSection}>
          <h3 style={styles.sectionTitle}>🎁 {t('aiDesigner.myGoods')}</h3>
          {myCreations.length === 0 ? (
            <div style={styles.emptyState}>{t('aiDesigner.noCreations')}</div>
          ) : (
            <div style={styles.creationsGrid}>
              {myCreations.map(goods => (
                <div key={goods.id} style={styles.goodsCard}>
                  <div style={styles.goodsPreview}>
                    <div style={styles.goodsIcon}>🎨</div>
                  </div>
                  <div style={styles.goodsInfo}>
                    <h4 style={styles.goodsName}>{goods.name}</h4>
                    <p style={styles.goodsDesc}>{goods.description}</p>
                    <div style={styles.goodsMeta}>
                      <span>¥{goods.price}</span>
                      <span style={{
                        ...styles.goodsStatus,
                        ...(goods.status === 'crowdfunding' ? styles.statusCrowdfunding : 
                            goods.status === 'production' ? styles.statusProduction : 
                            styles.statusDelivered)
                      }}>
                        {goods.status === 'crowdfunding' ? t('aiDesigner.crowdfunding') :
                         goods.status === 'production' ? t('aiDesigner.production') : t('aiDesigner.delivered')}
                      </span>
                    </div>
                    <div style={styles.crowdfundingBar}>
                      <div style={styles.progressBar}>
                        <div
                          style={{
                            ...styles.progressFill,
                            width: `${Math.min(goods.crowdfunding_progress, 100)}%`,
                            ...(goods.crowdfunding_progress >= 100 ? styles.progressSuccess : {})
                          }}
                        />
                      </div>
                      <div style={styles.progressText}>
                        {goods.crowdfunding_current}/{goods.crowdfunding_goal} ({goods.crowdfunding_progress}%)
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div style={styles.infoSection}>
        <h3 style={styles.infoTitle}>💡 {t('aiDesigner.tips')}</h3>
        <ul style={styles.infoList}>
          <li>{t('aiDesigner.tip1')}</li>
          <li>{t('aiDesigner.tip2')}</li>
          <li>{t('aiDesigner.tip3')}</li>
          <li>{t('aiDesigner.tip4')}</li>
        </ul>
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: '20px',
    maxWidth: '1200px',
    margin: '0 auto',
    backgroundColor: '#f8fafc'
  },
  header: {
    textAlign: 'center',
    marginBottom: '30px'
  },
  title: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: '10px'
  },
  subtitle: {
    fontSize: '16px',
    color: '#64748b'
  },
  tabContainer: {
    display: 'flex',
    justifyContent: 'center',
    gap: '10px',
    marginBottom: '30px'
  },
  tab: {
    padding: '12px 24px',
    fontSize: '16px',
    fontWeight: '500',
    color: '#64748b',
    backgroundColor: '#fff',
    border: '2px solid #e2e8f0',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.3s'
  },
  activeTab: {
    color: '#3b82f6',
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff'
  },
  createSection: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '30px',
    marginBottom: '30px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  },
  uploadSection: {
    marginBottom: '30px'
  },
  imageUploadArea: {
    width: '100%',
    height: '300px',
    border: '2px dashed #cbd5e1',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    overflow: 'hidden',
    transition: 'border-color 0.3s'
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  uploadPlaceholder: {
    textAlign: 'center',
    color: '#94a3b8'
  },
  uploadIcon: {
    fontSize: '64px',
    marginBottom: '10px'
  },
  uploadText: {
    fontSize: '18px',
    fontWeight: '500',
    marginBottom: '5px'
  },
  uploadHint: {
    fontSize: '14px'
  },
  fileInput: {
    display: 'none'
  },
  categorySection: {
    marginBottom: '30px'
  },
  sectionTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: '15px'
  },
  categoryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '15px'
  },
  categoryCard: {
    padding: '20px',
    backgroundColor: '#f8fafc',
    border: '2px solid #e2e8f0',
    borderRadius: '12px',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.3s'
  },
  categorySelected: {
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff'
  },
  categoryIcon: {
    fontSize: '48px',
    marginBottom: '10px'
  },
  categoryName: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: '5px'
  },
  categoryDesc: {
    fontSize: '14px',
    color: '#64748b'
  },
  generateButton: {
    width: '100%',
    padding: '16px',
    fontSize: '18px',
    fontWeight: '600',
    color: '#fff',
    backgroundColor: '#3b82f6',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.3s'
  },
  proposalsSection: {
    marginTop: '30px'
  },
  petFeaturesText: {
    fontSize: '14px',
    color: '#64748b',
    marginBottom: '20px',
    padding: '10px',
    backgroundColor: '#f8fafc',
    borderRadius: '8px'
  },
  proposalsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
    gap: '20px'
  },
  proposalCard: {
    padding: '20px',
    backgroundColor: '#fff',
    border: '2px solid #e2e8f0',
    borderRadius: '12px',
    transition: 'all 0.3s'
  },
  proposalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px'
  },
  proposalName: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#1e293b'
  },
  proposalCategory: {
    padding: '4px 12px',
    fontSize: '12px',
    color: '#3b82f6',
    backgroundColor: '#eff6ff',
    borderRadius: '12px'
  },
  proposalDesc: {
    fontSize: '14px',
    color: '#64748b',
    marginBottom: '15px'
  },
  designElements: {
    display: 'flex',
    gap: '15px',
    marginBottom: '15px',
    padding: '10px',
    backgroundColor: '#f8fafc',
    borderRadius: '8px'
  },
  elementItem: {
    fontSize: '14px'
  },
  elementLabel: {
    color: '#64748b'
  },
  elementValue: {
    color: '#1e293b',
    fontWeight: '500'
  },
  crowdfundingInfo: {
    marginBottom: '15px'
  },
  priceTag: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#ef4444',
    marginBottom: '5px'
  },
  crowdfundingProgress: {
    fontSize: '14px',
    color: '#64748b'
  },
  goalInfo: {
    marginBottom: '2px'
  },
  deliveryInfo: {},
  selectButton: {
    width: '100%',
    padding: '12px',
    fontSize: '16px',
    fontWeight: '600',
    color: '#fff',
    backgroundColor: '#10b981',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer'
  },
  ordersSection: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '30px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  },
  emptyState: {
    textAlign: 'center',
    padding: '40px',
    color: '#94a3b8',
    fontSize: '16px'
  },
  ordersList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px'
  },
  orderCard: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '20px',
    backgroundColor: '#f8fafc',
    borderRadius: '12px',
    border: '1px solid #e2e8f0'
  },
  orderInfo: {
    flex: 1
  },
  orderName: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: '5px'
  },
  orderDesc: {
    fontSize: '14px',
    color: '#64748b',
    marginBottom: '10px'
  },
  orderMeta: {
    display: 'flex',
    gap: '15px',
    fontSize: '12px',
    color: '#94a3b8'
  },
  orderStatus: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '10px'
  },
  statusBadge: {
    padding: '6px 12px',
    fontSize: '14px',
    borderRadius: '8px'
  },
  statusPending: {
    color: '#f59e0b',
    backgroundColor: '#fef3c7'
  },
  statusPaid: {
    color: '#10b981',
    backgroundColor: '#d1fae5'
  },
  payButton: {
    padding: '8px 16px',
    fontSize: '14px',
    fontWeight: '600',
    color: '#fff',
    backgroundColor: '#3b82f6',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer'
  },
  creationsSection: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '30px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  },
  creationsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '20px'
  },
  goodsCard: {
    backgroundColor: '#f8fafc',
    borderRadius: '12px',
    overflow: 'hidden',
    border: '1px solid #e2e8f0'
  },
  goodsPreview: {
    height: '150px',
    backgroundColor: '#e2e8f0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  goodsIcon: {
    fontSize: '64px'
  },
  goodsInfo: {
    padding: '15px'
  },
  goodsName: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: '5px'
  },
  goodsDesc: {
    fontSize: '14px',
    color: '#64748b',
    marginBottom: '10px'
  },
  goodsMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px',
    fontSize: '16px',
    fontWeight: '600',
    color: '#1e293b'
  },
  goodsStatus: {
    padding: '4px 8px',
    fontSize: '12px',
    borderRadius: '4px'
  },
  statusCrowdfunding: {
    color: '#f59e0b',
    backgroundColor: '#fef3c7'
  },
  statusProduction: {
    color: '#3b82f6',
    backgroundColor: '#dbeafe'
  },
  statusDelivered: {
    color: '#10b981',
    backgroundColor: '#d1fae5'
  },
  crowdfundingBar: {
    marginTop: '10px'
  },
  progressBar: {
    height: '8px',
    backgroundColor: '#e2e8f0',
    borderRadius: '4px',
    overflow: 'hidden',
    marginBottom: '5px'
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3b82f6',
    transition: 'width 0.3s'
  },
  progressSuccess: {
    backgroundColor: '#10b981'
  },
  progressText: {
    fontSize: '12px',
    color: '#64748b',
    textAlign: 'right'
  },
  infoSection: {
    marginTop: '30px',
    padding: '20px',
    backgroundColor: '#eff6ff',
    borderRadius: '12px',
    border: '1px solid #bfdbfe'
  },
  infoTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1e40af',
    marginBottom: '15px'
  },
  infoList: {
    listStyle: 'none',
    padding: 0,
    margin: 0
  },
  uploadTabs: {
    display: 'flex',
    gap: '10px',
    marginBottom: '15px'
  },
  uploadTab: {
    flex: 1,
    padding: '12px',
    fontSize: '16px',
    fontWeight: '500',
    color: '#64748b',
    backgroundColor: '#f8fafc',
    border: '2px solid #e2e8f0',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.3s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px'
  },
  activeUploadTab: {
    color: '#3b82f6',
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff'
  },
  tabBadge: {
    padding: '2px 8px',
    fontSize: '12px',
    color: '#fff',
    backgroundColor: '#ef4444',
    borderRadius: '10px',
    fontWeight: '600'
  },
  postsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '15px'
  },
  postCard: {
    backgroundColor: '#f8fafc',
    border: '2px solid #e2e8f0',
    borderRadius: '12px',
    overflow: 'hidden',
    cursor: 'pointer',
    transition: 'all 0.3s',
    hover: {
      borderColor: '#3b82f6',
      transform: 'scale(1.02)'
    }
  },
  postImage: {
    width: '100%',
    height: '120px',
    objectFit: 'cover'
  },
  postIcon: {
    width: '100%',
    height: '120px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '48px',
    backgroundColor: '#e2e8f0'
  },
  postInfo: {
    padding: '10px',
    textAlign: 'center'
  },
  postDate: {
    fontSize: '12px',
    color: '#64748b'
  },
  emptyPosts: {
    padding: '40px',
    textAlign: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: '12px'
  },
  emptyIcon: {
    fontSize: '48px',
    marginBottom: '10px'
  },
  emptyButton: {
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: '600',
    color: '#fff',
    backgroundColor: '#3b82f6',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    marginTop: '10px'
  }
};

export default AIGoodsDesigner;
