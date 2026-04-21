import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ShoppingCart, Plus, Minus, X, ArrowRight, CheckCircle2, Search, Globe, User, Wallet, CreditCard, Banknote, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PRODUCTS, CATEGORIES } from './data/products';
import { translations } from './data/translations';

// Smart Map Component
function MapSelector({ onLocationSelect, initialLocation, t, lang }) {
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const [mapInstance, setMapInstance] = useState(null);
  const [loading, setLoading] = useState(false);

  const reverseGeocode = async (lat, lng) => {
    setLoading(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=${lang}`);
      const data = await response.json();
      if (data && data.display_name) {
        const addr = data.address;
        const cleanAddr = [addr.road, addr.suburb, addr.city || addr.town || addr.village].filter(Boolean).join(', ');
        onLocationSelect(lat, lng, cleanAddr || data.display_name);
      }
    } catch (error) {
      console.error("Geocoding error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!mapRef.current) return;

    const map = L.map(mapRef.current, { zoomControl: false }).setView([41.311081, 69.240562], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
    L.control.zoom({ position: 'topright' }).addTo(map);

    const marker = L.marker([41.311081, 69.240562], { draggable: true }).addTo(map);
    markerRef.current = marker;

    marker.on('dragend', () => {
      const pos = marker.getLatLng();
      reverseGeocode(pos.lat, pos.lng);
    });

    map.on('click', (e) => {
      marker.setLatLng(e.latlng);
      reverseGeocode(e.latlng.lat, e.latlng.lng);
    });

    setMapInstance(map);

    return () => map.remove();
  }, []);

  const findMe = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      const { latitude, longitude } = pos.coords;
      if (mapInstance && markerRef.current) {
        mapInstance.setView([latitude, longitude], 16);
        markerRef.current.setLatLng([latitude, longitude]);
        reverseGeocode(latitude, longitude);
      }
    });
  };

  return (
    <div style={{ marginBottom: '16px', position: 'relative' }}>
      <p style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '8px' }}>{t.cart.address} (Map)</p>
      <div ref={mapRef} style={{ height: '220px', borderRadius: '16px', overflow: 'hidden', border: '2px solid var(--bg-canvas)' }} />
      <button 
        onClick={findMe}
        style={{ 
          position: 'absolute', 
          bottom: '12px', 
          right: '12px', 
          zIndex: 1000, 
          background: 'white', 
          border: 'none', 
          width: '40px', 
          height: '40px', 
          borderRadius: '50%', 
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer'
        }}
      >
        <MapPin size={20} color="var(--primary)" />
      </button>
      {loading && (
        <div style={{ position: 'absolute', top: '40px', left: '50%', transform: 'translateX(-50%)', zIndex: 1000, background: 'rgba(255,255,255,0.9)', padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          Aniqlanmoqda...
        </div>
      )}
      <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>* {t.map_hint || 'Belgini manzil ustiga olib boring'}</p>
    </div>
  );
}

// Admin Dashboard Component
function AdminDashboard({ t, lang, onBack, products, categories, stats, orders, users, loading, fetchData }) {
  const [activeTab, setActiveTab] = useState('stats');
  const [isAdding, setIsAdding] = useState(false);
  const [isAddingCat, setIsAddingCat] = useState(false);
  const [newCat, setNewCat] = useState({ id: '', uz: '', ru: '' });
  const [newProduct, setNewProduct] = useState({ name_uz: '', name_ru: '', price: '', category: categories[0]?.id || 'bread', image: '', desc_uz: '', desc_ru: '' });

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewProduct({ ...newProduct, image: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddCategory = async () => {
    if (!newCat.id || !newCat.uz) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCat)
      });
      if (res.ok) {
        setIsAddingCat(false);
        setNewCat({ id: '', uz: '', ru: '' });
        fetchData();
      }
    } catch (err) { alert(err.message); }
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', fontWeight: '700' }}>{t.admin.loading}</div>;

  return (
    <div style={{ background: '#fdfaf7', minHeight: '100vh', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontWeight: '900', fontSize: '26px', color: 'var(--primary)' }}>{t.admin.dashboard}</h2>
        <button onClick={onBack} className="lang-btn" style={{ background: 'white', color: 'var(--primary)', borderColor: 'var(--primary)' }}>
          {t.admin.exit}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '24px' }}>
        <div style={{ background: 'white', padding: '14px', borderRadius: '20px', textAlign: 'center', boxShadow: 'var(--shadow-soft)' }}>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>{t.admin.users}</p>
          <p style={{ fontSize: '18px', fontWeight: '800' }}>{stats.totalUsers}</p>
        </div>
        <div style={{ background: 'white', padding: '14px', borderRadius: '20px', textAlign: 'center', boxShadow: 'var(--shadow-soft)' }}>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>{t.admin.stats}</p>
          <p style={{ fontSize: '18px', fontWeight: '800' }}>{stats.totalOrders}</p>
        </div>
        <div style={{ background: 'white', padding: '14px', borderRadius: '20px', textAlign: 'center', boxShadow: 'var(--shadow-soft)' }}>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>{t.admin.revenue}</p>
          <p style={{ fontSize: '14px', fontWeight: '900', color: '#10b981' }}>{stats.totalRevenue?.toLocaleString()}</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', overflowX: 'auto', paddingBottom: '8px' }}>
        <button onClick={() => setActiveTab('stats')} className={`cat-chip ${activeTab === 'stats' ? 'active' : ''}`}>{t.admin.stats}</button>
        <button onClick={() => setActiveTab('products')} className={`cat-chip ${activeTab === 'products' ? 'active' : ''}`}>{t.admin.menu}</button>
        <button onClick={() => setActiveTab('users')} className={`cat-chip ${activeTab === 'users' ? 'active' : ''}`}>{t.admin.users}</button>
      </div>

      {activeTab === 'stats' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          {orders.length === 0 ? <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>Hozircha buyurtmalar yo'q</p> : 
          orders.map(order => (
            <div key={order.id} style={{ background: 'white', padding: '16px', borderRadius: '24px', marginBottom: '12px', boxShadow: 'var(--shadow-soft)', border: '1px solid rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontWeight: '800', fontSize: '15px' }}>#{order.id} — {order.user_name}</span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>{new Date(order.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '10px' }}>{order.user_phone} | {order.user_address}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: '900', color: 'var(--primary)', fontSize: '16px' }}>{order.total_price?.toLocaleString()} so'm</span>
                <span style={{ fontSize: '10px', background: '#e6fff0', color: '#065f46', padding: '6px 12px', borderRadius: '14px', fontWeight: '800', textTransform: 'uppercase' }}>{order.status}</span>
              </div>
            </div>
          ))}
        </motion.div>
      )}

      {activeTab === 'products' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <button 
            onClick={() => setIsAdding(!isAdding)} 
            className="btn-yandex" 
            style={{ marginBottom: '20px', background: isAdding ? '#f5f0ed' : '#ffcc00', color: isAdding ? 'var(--text-main)' : 'black' }}
          >
            {isAdding ? t.admin.cancel : t.admin.add_new}
          </button>

          <AnimatePresence>
            {isAdding && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                style={{ overflow: 'hidden' }}
              >
                <div style={{ background: 'white', padding: '24px', borderRadius: '28px', marginBottom: '24px', boxShadow: 'var(--shadow-premium)' }}>
                  <h4 style={{ marginBottom: '20px', fontWeight: '800' }}>{t.admin.add_new}</h4>
                  <div className="form-group"><label>{t.admin.name_uz}</label><input className="form-input" placeholder="Somsa..." value={newProduct.name_uz} onChange={e => setNewProduct({...newProduct, name_uz: e.target.value})} /></div>
                  <div className="form-group"><label>{t.admin.name_ru}</label><input className="form-input" placeholder="Самса..." value={newProduct.name_ru} onChange={e => setNewProduct({...newProduct, name_ru: e.target.value})} /></div>
                  <div className="form-group"><label>{t.admin.price}</label><input className="form-input" type="number" placeholder="8000" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: parseInt(e.target.value)})} /></div>
                  
                  <div className="form-group">
                    <label>{t.admin.image_url} (Galereyadan tanlang)</label>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} id="file-upload" />
                      <label htmlFor="file-upload" className="cat-chip" style={{ background: '#f5f0ed', cursor: 'pointer', margin: 0 }}>📸 Rasm tanlash</label>
                      {newProduct.image && <img src={newProduct.image} style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover' }} />}
                    </div>
                  </div>

                  <div className="form-group">
                    <label>{t.admin.category}</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <select className="form-input" style={{ flex: 1 }} value={newProduct.category} onChange={e => setNewProduct({...newProduct, category: e.target.value})}>
                        {categories.filter(c => c.id !== 'all').map(c => (
                          <option key={c.id} value={c.id}>{lang === 'uz' ? c.uz : c.ru}</option>
                        ))}
                      </select>
                      <button onClick={() => setIsAddingCat(!isAddingCat)} className="qty-btn-mini" style={{ width: '48px', height: '48px', background: 'var(--bg-canvas)' }}>+</button>
                    </div>
                  </div>

                  {isAddingCat && (
                    <div style={{ background: '#fdfaf7', padding: '16px', borderRadius: '20px', marginBottom: '16px', border: '1px dashed #ccc' }}>
                      <p style={{ fontSize: '12px', fontWeight: '700', marginBottom: '10px' }}>Yangi kategoriya</p>
                      <input className="form-input" style={{ marginBottom: '8px' }} placeholder="ID (masalan: drinks)" value={newCat.id} onChange={e => setNewCat({...newCat, id: e.target.value})} />
                      <input className="form-input" style={{ marginBottom: '8px' }} placeholder="Nomi UZ" value={newCat.uz} onChange={e => setNewCat({...newCat, uz: e.target.value})} />
                      <input className="form-input" style={{ marginBottom: '12px' }} placeholder="Nomi RU" value={newCat.ru} onChange={e => setNewCat({...newCat, ru: e.target.value})} />
                      <button onClick={handleAddCategory} className="btn-primary" style={{ padding: '10px' }}>Kategoriyani saqlash</button>
                    </div>
                  )}

                  <button onClick={handleAddProduct} className="btn-yandex" style={{ marginTop: '10px' }}>{t.admin.save}</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {products.map(p => (
            <div key={p.id} style={{ display: 'flex', gap: '14px', background: 'white', padding: '14px', borderRadius: '20px', marginBottom: '12px', boxShadow: 'var(--shadow-soft)', alignItems: 'center' }}>
              <img src={p.image} style={{ width: '56px', height: '56px', borderRadius: '14px', objectFit: 'cover' }} onError={e => e.target.src='https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=400'} />
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: '800', fontSize: '15px' }}>{p[`name_${lang}`]}</p>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '600' }}>{p.price?.toLocaleString()} so'm</p>
              </div>
            </div>
          ))}
        </motion.div>
      )}

      {activeTab === 'users' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          {users.map(u => (
            <div key={u.telegram_id} style={{ background: 'white', padding: '16px', borderRadius: '24px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '14px', boxShadow: 'var(--shadow-soft)' }}>
              <div style={{ width: '44px', height: '44px', background: 'var(--primary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '800', fontSize: '18px' }}>{u.first_name[0]}</div>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: '800', fontSize: '15px' }}>{u.first_name} {u.last_name || ''}</p>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>@{u.username || 'n/a'}</p>
              </div>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '700' }}>{new Date(u.created_at).toLocaleDateString()}</span>
            </div>
          ))}
        </motion.div>
      )}
    </div>
  );
}

function App() {
  const [lang, setLang] = useState(localStorage.getItem('lang') || 'uz');
  const t = translations[lang];

  const [isAdmin, setIsAdmin] = useState(false);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [stats, setStats] = useState({ totalUsers: 0, totalOrders: 0, totalRevenue: 0 });
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  const fetchData = async () => {
    setLoading(true);
    try {
      const [sRes, oRes, uRes, pRes, cRes] = await Promise.all([
        fetch(`${API_URL}/api/admin/stats`),
        fetch(`${API_URL}/api/admin/orders`),
        fetch(`${API_URL}/api/admin/users`),
        fetch(`${API_URL}/api/products`),
        fetch(`${API_URL}/api/categories`)
      ]);
      
      if (sRes.ok) setStats(await sRes.json());
      if (oRes.ok) setOrders(await oRes.json());
      if (uRes.ok) setUsers(await uRes.json());
      if (pRes.ok) setProducts(await pRes.json());
      if (cRes.ok) setCategories(await cRes.json());
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (window.Telegram && window.Telegram.WebApp) {
      const wa = window.Telegram.WebApp;
      wa.ready();
      wa.expand();
      setWebapp(wa);
      
      const adminIds = [8793808077, 12345678, 6214470213];
      if (wa.initDataUnsafe?.user && adminIds.includes(wa.initDataUnsafe.user.id)) {
        // Option to switch to admin
      }
    }
    fetchData();
  }, []);

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
    localStorage.setItem('lang', lang);
  }, [cart, lang]);

  useEffect(() => {
    localStorage.setItem('userDetails', JSON.stringify(userDetails));
  }, [userDetails]);

  const toggleLang = () => setLang(prev => prev === 'uz' ? 'ru' : 'uz');

  const addToCart = (product) => {
    updateQuantity(product.id, 1, product);
    if (webapp?.HapticFeedback) webapp.HapticFeedback.impactOccurred('light');
  };

  const updateQuantity = (id, delta, product = null) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === id);
      if (existing) {
        const newQty = Math.max(0, existing.quantity + delta);
        if (newQty === 0) return prev.filter(item => item.id !== id);
        return prev.map(item => item.id === id ? { ...item, quantity: newQty } : item);
      }
      if (delta > 0 && product) return [...prev, { ...product, quantity: delta }];
      return prev;
    });
    if (webapp?.HapticFeedback) webapp.HapticFeedback.selectionChanged();
  };

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesCat = activeCategory === 'all' || p.category === activeCategory;
      const matchesSearch = 
        (p[`name_${lang}`] || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.name_uz || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.name_ru || '').toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCat && matchesSearch;
    });
  }, [activeCategory, searchQuery, products, lang]);

  const getItemQty = (id) => cart.find(i => i.id === id)?.quantity || 0;
  const subTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discount = useBonuses ? Math.min(subTotal, cashbackBalance) : 0;
  const totalPrice = subTotal - discount;

  const handleCheckout = async () => {
    if (!userDetails.name || !userDetails.phone || !userDetails.address) {
      webapp?.HapticFeedback?.notificationOccurred('error');
      alert(t.cart.checkout_error);
      return;
    }

    const orderData = {
      items: cart,
      subTotal,
      discount,
      totalPrice,
      paymentMethod,
      user: userDetails,
      location,
      initData: webapp?.initData || '',
      lang
    };

    try {
      webapp?.HapticFeedback?.impactOccurred('medium');
      
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const response = await fetch(`${API_URL}/api/order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...orderData,
          locationLink: location ? `https://www.google.com/maps?q=${location.lat},${location.lng}` : null
        })
      });

      if (response.ok) {
        webapp?.HapticFeedback?.notificationOccurred('success');
        setIsSuccess(true);
        setCart([]);
        localStorage.removeItem('cart');
        if (webapp) setTimeout(() => webapp.close(), 3000);
      } else {
        const err = await response.json();
        throw new Error(err.error || 'Server hatosi');
      }
    } catch (error) {
      alert(`${t.cart.error}: ${error.message}`);
      webapp?.HapticFeedback?.notificationOccurred('error');
    }
  };

  if (isSuccess) {
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-canvas)', padding: '24px', textAlign: 'center' }}>
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
          <CheckCircle2 size={80} color="var(--primary)" />
        </motion.div>
        <h1 style={{ marginTop: '24px', fontSize: '24px' }}>{t.cart.order_success}</h1>
        <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>{t.cart.thanks}</p>
      </div>
    );
  }

  if (isAdmin) {
    return <AdminDashboard 
      t={t} 
      lang={lang} 
      onBack={() => setIsAdmin(false)} 
      products={products}
      categories={categories}
      stats={stats}
      orders={orders}
      users={users}
      loading={loading}
      fetchData={fetchData}
    />;
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="brand">
          <h1>{t.shop}</h1>
          <p>{t.daily_fresh}</p>
        </div>
        <div className="header-actions">
          <button className="lang-btn" onClick={toggleLang}>
            <Globe size={14} style={{ marginRight: '6px' }} /> {lang.toUpperCase()}
          </button>
          <button className="cart-btn" style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)' }} onClick={() => setIsProfileOpen(true)}>
            <User size={22} />
          </button>
          <button className="cart-btn" onClick={() => setIsCartOpen(true)}>
            <ShoppingCart size={22} color="var(--primary)" />
            {cart.length > 0 && (
              <motion.span initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="cart-count">
                {cart.reduce((a, b) => a + b.quantity, 0)}
              </motion.span>
            )}
          </button>
        </div>
      </header>

      <div className="search-container">
        <div className="search-wrapper">
          <Search size={20} className="search-icon" />
          <input 
            type="text" 
            className="search-bar" 
            placeholder={t.search} 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <nav className="categories-nav">
        <div className="categories-scroll">
          {categories.map(cat => (
            <button key={cat.id} onClick={() => setActiveCategory(cat.id)} className={`cat-chip ${activeCategory === cat.id ? 'active' : ''}`}>
              {cat[lang]}
            </button>
          ))}
        </div>
      </nav>

      <main style={{ paddingBottom: '120px' }}>
        {categories.filter(c => activeCategory === 'all' || c.id === activeCategory).map(cat => {
          const catProducts = products.filter(p => p.category === cat.id && (
            (p.name_uz?.toLowerCase() || '').includes(searchQuery.toLowerCase()) || 
            (p.name_ru?.toLowerCase() || '').includes(searchQuery.toLowerCase())
          ));
          if (catProducts.length === 0) return null;

          return (
            <section key={cat.id} className="category-section" id={`cat-${cat.id}`}>
              <h2 className="category-title">{cat[lang]}</h2>
              <div className="product-grid" style={{ paddingBottom: '0' }}>
                {catProducts.map((product) => {
                  const qty = getItemQty(product.id);
                  return (
                    <motion.div 
                      whileTap={{ scale: 0.98 }}
                      key={product.id} 
                      className="card-v3"
                      onClick={() => setSelectedProduct(product)}
                    >
                      <div className="product-image-wrapper">
                        <img 
                          src={product.image} 
                          alt={product[`name_${lang}`]} 
                          className="card-img" 
                          onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=400&auto=format&fit=crop' }}
                        />
                        {qty > 0 ? (
                          <div className="qty-control-abs" onClick={(e) => e.stopPropagation()}>
                            <button className="qty-btn-mini" onClick={() => updateQuantity(product.id, -1, product)}><Minus size={14} /></button>
                            <span style={{ fontSize: '13px', fontWeight: '800' }}>{qty}</span>
                            <button className="qty-btn-mini" onClick={() => updateQuantity(product.id, 1, product)}><Plus size={14} /></button>
                          </div>
                        ) : (
                          <button className="add-btn-abs" onClick={(e) => { e.stopPropagation(); addToCart(product); }}>
                            <Plus size={20} />
                          </button>
                        )}
                      </div>
                      <div className="card-body">
                        <div className="card-price">{product.price?.toLocaleString()}</div>
                        <h3>{product[`name_${lang}`]}</h3>
                        <p className="desc">{product[`desc_${lang}`] || 'Sifatli va mazali'}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </main>

      <AnimatePresence>
        {cart.length > 0 && !isCartOpen && (
          <motion.button 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="floating-cart"
            onClick={() => setIsCartOpen(true)}
          >
            {totalPrice.toLocaleString()} so'm
            <ShoppingCart size={20} />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="overlay" onClick={() => setIsCartOpen(false)} />
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className="drawer">
              <div className="drawer-handler" />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: '800' }}>{t.cart.title}</h2>
                <button onClick={() => setIsCartOpen(false)} style={{ background: '#f5f0ed', border: 'none', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={20} /></button>
              </div>

              {cart.length === 0 ? (
                <div className="empty-cart-state">
                  <img src="https://cdn-icons-png.flaticon.com/512/11329/11329073.png" className="empty-img" alt="Empty" />
                  <h3 style={{ marginBottom: '12px' }}>{t.cart.empty_title}</h3>
                  <button className="btn-secondary-light" onClick={() => setIsCartOpen(false)}>{t.cart.go_to_menu}</button>
                </div>
              ) : (
                <>
                  {subTotal < FREE_DELIVERY_THRESHOLD ? (
                    <div style={{ marginBottom: '24px', background: '#fff9e6', padding: '16px', borderRadius: '20px' }}>
                      <p style={{ fontSize: '13px', fontWeight: '600' }}>{t.cart.free_delivery_reach} {(FREE_DELIVERY_THRESHOLD - subTotal).toLocaleString()} so'm</p>
                      <div className="delivery-progress">
                        <div className="progress-fill" style={{ width: `${(subTotal / FREE_DELIVERY_THRESHOLD) * 100}%` }} />
                      </div>
                    </div>
                  ) : (
                    <div style={{ marginBottom: '24px', background: '#e6fff0', padding: '16px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <CheckCircle2 size={18} color="#10b981" />
                      <p style={{ fontSize: '13px', fontWeight: '700', color: '#065f46' }}>{t.cart.free_delivery_ready}</p>
                    </div>
                  )}

                  <div style={{ marginBottom: '32px' }}>
                    {cart.map(item => (
                      <div key={item.id} className="cart-item">
                        <img src={item.image} alt={item[`name_${lang}`]} />
                        <div style={{ flex: 1 }}>
                          <h4 style={{ fontSize: '15px', fontWeight: '700' }}>{item[`name_${lang}`]}</h4>
                          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{item.price.toLocaleString()} so'm</p>
                        </div>
                        <div className="qty-control" style={{ background: '#f5f0ed', padding: '4px', borderRadius: '12px' }}>
                          <button className="qty-btn" onClick={() => updateQuantity(item.id, -1)}><Minus size={12} /></button>
                          <span style={{ minWidth: '24px', textAlign: 'center', fontWeight: '700' }}>{item.quantity}</span>
                          <button className="qty-btn" onClick={() => updateQuantity(item.id, 1)}><Plus size={12} /></button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{ marginBottom: '32px' }}>
                    <h4 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '16px' }}>{t.cart.need_more}</h4>
                    <div className="scroll-hide" style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '8px' }}>
                      {products.filter(p => !cart.find(ci => ci.id === p.id)).slice(0, 5).map(p => (
                        <div key={p.id} className="rec-item" onClick={() => addToCart(p)}>
                          <img src={p.image} className="rec-img" alt={p[`name_${lang}`]} />
                          <p className="rec-name">{p[`name_${lang}`]}</p>
                          <p className="rec-price">{p.price.toLocaleString()} so'm</p>
                          <button className="qty-btn" style={{ width: '100%', marginTop: '6px', background: 'white', border: '1px solid #eee' }}><Plus size={14} /></button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="y-form-section">
                    <h4 className="y-section-title">{t.cart.personal_info || "Ma'lumotlar"}</h4>
                    <div className="form-group">
                      <label>{t.cart.name}</label>
                      <input type="text" className="form-input" placeholder={t.cart.name_placeholder} value={userDetails.name} onChange={e => setUserDetails({...userDetails, name: e.target.value})} />
                    </div>
                    <div className="form-group">
                      <label>{t.cart.phone}</label>
                      <input type="tel" className="form-input" placeholder="+998" value={userDetails.phone} onChange={e => setUserDetails({...userDetails, phone: e.target.value})} />
                    </div>
                    <MapSelector t={t} lang={lang} onLocationSelect={(lat, lng, address) => {
                      setLocation({ lat, lng });
                      if (address) setUserDetails(prev => ({ ...prev, address }));
                    }} />
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label>{t.cart.address}</label>
                      <div style={{ position: 'relative' }}>
                        <MapPin size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input type="text" className="form-input" style={{ paddingLeft: '48px' }} placeholder={t.cart.address_placeholder} value={userDetails.address} onChange={e => setUserDetails({...userDetails, address: e.target.value})} />
                      </div>
                    </div>
                  </div>

                  <div className="y-form-section">
                    <h4 className="y-section-title">{t.cart.payment_method}</h4>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button 
                        className={`cat-chip ${paymentMethod === 'cash' ? 'active' : ''}`}
                        onClick={() => setPaymentMethod('cash')}
                        style={{ flex: 1, height: '54px', borderRadius: '18px' }}
                      >
                        <Banknote size={18} style={{ marginRight: '8px' }} /> {t.cart.cash}
                      </button>
                      <button 
                        className={`cat-chip ${paymentMethod === 'card' ? 'active' : ''}`}
                        onClick={() => setPaymentMethod('card')}
                        style={{ flex: 1, height: '54px', borderRadius: '18px' }}
                      >
                        <CreditCard size={18} style={{ marginRight: '8px' }} /> {t.cart.card}
                      </button>
                    </div>
                  </div>

                  <div className="y-form-section" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <p style={{ fontSize: '14px', fontWeight: '700' }}>{t.cart.use_bonuses}</p>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{t.cart.bonus_balance} {cashbackBalance.toLocaleString()} so'm</p>
                    </div>
                    <label className="switch">
                      <input type="checkbox" checked={useBonuses} onChange={e => setUseBonuses(e.target.checked)} />
                      <span className="slider"></span>
                    </label>
                  </div>

                  <div className="y-form-section">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <span style={{ color: 'var(--text-muted)', fontSize: '15px' }}>{t.cart.total}</span>
                      <span style={{ fontSize: '15px', fontWeight: '600', textDecoration: discount > 0 ? 'line-through' : 'none', opacity: discount > 0 ? 0.5 : 1 }}>{subTotal.toLocaleString()} so'm</span>
                    </div>
                    {discount > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', color: '#10b981' }}>
                        <span style={{ fontSize: '15px', fontWeight: '600' }}>{t.cart.discount}</span>
                        <span style={{ fontSize: '15px', fontWeight: '700' }}>-{discount.toLocaleString()} so'm</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', paddingTop: '16px', borderTop: '1.5px dashed #eee' }}>
                      <span style={{ fontWeight: '800', fontSize: '18px' }}>{t.cart.checkout_total}</span>
                      <span style={{ fontSize: '24px', fontWeight: '900', color: 'var(--primary)' }}>{totalPrice.toLocaleString()} so'm</span>
                    </div>
                  </div>

                  <button className="btn-yandex" onClick={handleCheckout}>
                    {t.cart.checkout} <ArrowRight size={22} />
                  </button>
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isProfileOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="overlay" onClick={() => setIsProfileOpen(false)} />
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className="drawer">
              <div className="drawer-handler" />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: '800' }}>{t.profile.title}</h2>
                <button onClick={() => setIsProfileOpen(false)} style={{ background: '#f5f0ed', border: 'none', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={20} /></button>
              </div>

              <div style={{ background: 'white', padding: '24px', borderRadius: '28px', marginBottom: '24px', textAlign: 'center', boxShadow: 'var(--shadow-soft)' }}>
                <div style={{ width: '80px', height: '80px', background: 'var(--primary)', borderRadius: '50%', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                  <User size={40} />
                </div>
                <h3 style={{ fontSize: '20px', fontWeight: '800' }}>{userDetails.name || (lang === 'uz' ? 'Mijoz' : 'Клиент')}</h3>
                <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '4px' }}>{userDetails.phone || '—'}</p>
              </div>

              <div style={{ background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%)', padding: '24px', borderRadius: '28px', marginBottom: '32px', color: 'white', boxShadow: '0 10px 30px rgba(74, 44, 42, 0.2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                  <div style={{ background: 'rgba(255,255,255,0.2)', padding: '8px', borderRadius: '10px' }}>
                    <Wallet size={18} />
                  </div>
                  <span style={{ fontSize: '13px', fontWeight: '600', opacity: 0.9 }}>{t.profile.cashback}</span>
                </div>
                <p style={{ fontSize: '28px', fontWeight: '900' }}>{cashbackBalance.toLocaleString()} <span style={{ fontSize: '16px', fontWeight: '600' }}>so'm</span></p>
              </div>

              {/* Secret Admin Button */}
              <div style={{ padding: '0 0 24px' }}>
                <button onClick={() => setIsAdmin(true)} style={{ width: '100%', background: '#f0f0f0', border: '1.5px dashed #ccc', padding: '12px', borderRadius: '16px', fontSize: '13px', color: '#666', fontWeight: '600' }}>
                  📊 Admin Panelga kirish
                </button>
              </div>

              <div style={{ background: 'white', padding: '24px', borderRadius: '28px', marginBottom: '24px' }}>
                <h4 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '20px' }}>{t.profile.personal_info}</h4>
                <div className="form-group">
                  <label>{t.cart.name}</label>
                  <input type="text" className="form-input" placeholder={t.cart.name_placeholder} value={userDetails.name} onChange={e => setUserDetails({...userDetails, name: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>{t.cart.phone}</label>
                  <input type="tel" className="form-input" placeholder="+998" value={userDetails.phone} onChange={e => setUserDetails({...userDetails, phone: e.target.value})} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>{t.cart.address}</label>
                  <input type="text" className="form-input" placeholder={t.cart.address_placeholder} value={userDetails.address} onChange={e => setUserDetails({...userDetails, address: e.target.value})} />
                </div>
              </div>

                  <button className="btn-yandex" onClick={() => setIsProfileOpen(false)}>
                {t.profile.save}
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {selectedProduct && (
          <motion.div 
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="product-modal"
          >
            <div className="modal-header">
              <button className="modal-close-btn" onClick={() => setSelectedProduct(null)}><X size={24} /></button>
            </div>
            <img 
              src={selectedProduct.image} 
              alt={selectedProduct[`name_${lang}`]} 
              className="modal-img" 
              onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=400&auto=format&fit=crop' }}
            />
            <div className="modal-body">
              <h2 className="modal-title">{selectedProduct[`name_${lang}`]}</h2>
              <div className="modal-price">{selectedProduct.price.toLocaleString()} so'm</div>
              <p className="modal-desc">{selectedProduct[`desc_${lang}`]}</p>
              <div style={{ marginTop: '32px' }}>
                <h4 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '12px' }}>{t.cart.details_title}</h4>
                <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>{t.cart.details_desc}</p>
              </div>
            </div>
            <div className="modal-footer">
              <div className="qty-control" style={{ background: '#f5f0ed', padding: '8px', borderRadius: '18px', height: '56px', flex: 1 }}>
                <button className="qty-btn" onClick={() => updateQuantity(selectedProduct.id, -1)}><Minus size={18} /></button>
                <span style={{ fontSize: '18px', fontWeight: '800', minWidth: '40px', textAlign: 'center' }}>{getItemQty(selectedProduct.id)}</span>
                <button className="qty-btn" onClick={() => updateQuantity(selectedProduct.id, 1, selectedProduct)}><Plus size={18} /></button>
              </div>
              <button className="btn-yandex" style={{ flex: 2 }} onClick={() => setSelectedProduct(null)}>
                {t.cart.ready_btn}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;



