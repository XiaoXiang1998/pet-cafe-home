import React, { useMemo, useState } from 'react';

const menuItems = [
  {
    id: 'salmon-bowl',
    price: 320,
    image:
      'https://images.unsplash.com/photo-1511690656952-34342bb7c2f2?auto=format&fit=crop&w=900&q=80',
    labels: {
      zh: {
        name: '鮭魚舒心早午餐',
        description: '炙烤鮭魚、溫沙拉、野菇歐姆蛋與寵物友善低鹽調味。',
      },
      en: {
        name: 'Salmon Brunch Plate',
        description: 'Seared salmon, warm greens, mushroom omelet, and pet-friendly low-sodium seasoning.',
      },
      ja: {
        name: 'サーモン癒しブランチ',
        description: '炙りサーモン、温野菜、きのこオムレツ、ペットにやさしい薄味仕立て。',
      },
    },
  },
  {
    id: 'paws-latte',
    price: 180,
    image:
      'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=900&q=80',
    labels: {
      zh: {
        name: '肉球拿鐵',
        description: '濃縮咖啡、綿密奶泡與手繪肉球拉花，可選燕麥奶。',
      },
      en: {
        name: 'Pawprint Latte',
        description: 'Espresso, silky foam, hand-drawn paw latte art, with oat milk available.',
      },
      ja: {
        name: '肉球ラテ',
        description: 'エスプレッソ、なめらかなフォーム、肉球ラテアート。オーツミルク対応。',
      },
    },
  },
  {
    id: 'pet-snack',
    price: 140,
    image:
      'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?auto=format&fit=crop&w=900&q=80',
    labels: {
      zh: {
        name: '毛孩雞胸小點',
        description: '無鹽舒肥雞胸、地瓜泥與少量新鮮蔬菜，適合犬貓分享。',
      },
      en: {
        name: 'Chicken Pet Bites',
        description: 'Unsalted sous-vide chicken breast, sweet potato mash, and fresh vegetables for cats and dogs.',
      },
      ja: {
        name: 'ペット用チキン小皿',
        description: '無塩の低温調理チキン、さつまいもピュレ、新鮮野菜を少量添えました。',
      },
    },
  },
];

const gallery = [
  {
    title: '午後的窗邊座位',
    alt: '坐在咖啡廳窗邊的狗',
    image:
      'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=1000&q=80',
  },
  {
    title: '貓咪陪伴區',
    alt: '在室內休息的貓',
    image:
      'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?auto=format&fit=crop&w=1000&q=80',
  },
  {
    title: '朋友聚會合照',
    alt: '人與狗在咖啡廳聚會',
    image:
      'https://images.unsplash.com/photo-1601758124510-52d02ddb7cbd?auto=format&fit=crop&w=1000&q=80',
  },
  {
    title: '暖光用餐角落',
    alt: '寵物友善餐廳桌面與咖啡',
    image:
      'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1000&q=80',
  },
];

const translations = {
  zh: '中文',
  en: 'English',
  ja: '日本語',
};

function App() {
  const [user, setUser] = useState(null);
  const [loginName, setLoginName] = useState('');
  const [reservation, setReservation] = useState({
    date: '',
    time: '',
    people: '2',
    pet: 'dog',
  });
  const [reservationMessage, setReservationMessage] = useState('');
  const [language, setLanguage] = useState('zh');

  const minDate = useMemo(() => new Date().toISOString().split('T')[0], []);

  const handleLogin = (event) => {
    event.preventDefault();
    const trimmedName = loginName.trim();
    if (!trimmedName) return;
    setUser({ name: trimmedName });
    setLoginName('');
  };

  const handleReservation = (event) => {
    event.preventDefault();
    if (!reservation.date || !reservation.time) {
      setReservationMessage('請先選擇訂位日期與時間。');
      return;
    }

    const petLabel = {
      dog: '狗狗',
      cat: '貓貓',
      both: '貓貓與狗狗',
      none: '不攜帶寵物',
    }[reservation.pet];

    setReservationMessage(
      `${user?.name ?? '訪客'}，已收到 ${reservation.date} ${reservation.time}，${reservation.people} 位，${petLabel} 的預約需求。`,
    );
  };

  return (
    <main>
      <nav className="topbar" aria-label="主導覽">
        <a className="brand" href="#home" aria-label="回到首頁">
          <span className="brand-mark">翔</span>
          <span>
            小翔動物友善餐廳
            <small>Pet Cafe & Dining</small>
          </span>
        </a>
        <div className="nav-links">
          <a href="#intro">介紹</a>
          <a href="#gallery">環景與合照</a>
          <a href="#reserve">預約</a>
          <a href="#menu">菜單</a>
        </div>
        <div className="user-pill">{user ? `${user.name} 已登入` : '訪客模式'}</div>
      </nav>

      <section className="hero" id="home">
        <div className="hero-copy">
          <p className="eyebrow">Taipei pet friendly cafe</p>
          <h1>讓咖啡香、貓呼嚕和狗狗尾巴一起入座。</h1>
          <p className="hero-text">
            小翔動物友善餐廳提供寬敞座位、寵物推車停放區、低刺激清潔流程與毛孩專屬小點。
            這裡適合約會、朋友聚餐，也適合帶著家中的貓貓狗狗慢慢享受一餐。
          </p>
          <div className="hero-actions">
            <a className="primary-button" href="#reserve">
              立即預約
            </a>
            <a className="secondary-button" href="#menu">
              查看三語菜單
            </a>
          </div>
        </div>
        <div className="hero-card" aria-label="店內環景圖">
          <img
            src="https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=1200&q=80"
            alt="小翔動物友善餐廳店內環景座位"
          />
          <div className="panorama-badge">店內環景圖 360° Mood</div>
        </div>
      </section>

      <section className="intro-panel" id="intro">
        <div>
          <p className="section-kicker">HTML Intro & Navigation</p>
          <h2>第一次來也能快速知道怎麼玩。</h2>
        </div>
        <div className="intro-grid">
          <article>
            <span>01</span>
            <h3>先看空間</h3>
            <p>環景圖展示主要座位、採光與寵物活動距離，幫你判斷適合的位置。</p>
          </article>
          <article>
            <span>02</span>
            <h3>登入狀態</h3>
            <p>輸入暱稱後會綁定目前使用者狀態，預約結果會帶入你的名字。</p>
          </article>
          <article>
            <span>03</span>
            <h3>預約時間</h3>
            <p>選擇日期、時間、人數與攜帶寵物類型，即可送出訂位需求。</p>
          </article>
          <article>
            <span>04</span>
            <h3>三語菜單</h3>
            <p>中文、英文、日文切換，方便本地與旅客一起點餐。</p>
          </article>
        </div>
      </section>

      <section className="gallery-section" id="gallery">
        <div className="section-heading">
          <p className="section-kicker">Panorama & Friends</p>
          <h2>店內環景與貓貓狗狗合照牆</h2>
        </div>
        <div className="gallery">
          {gallery.map((photo) => (
            <figure key={photo.title}>
              <img src={photo.image} alt={photo.alt} />
              <figcaption>{photo.title}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className="forms-section">
        <article className="login-card">
          <p className="section-kicker">Login</p>
          <h2>會員登入</h2>
          {user ? (
            <div className="logged-in">
              <p>
                目前登入：
                <strong>{user.name}</strong>
              </p>
              <button type="button" onClick={() => setUser(null)}>
                登出
              </button>
            </div>
          ) : (
            <form onSubmit={handleLogin}>
              <label htmlFor="loginName">暱稱</label>
              <input
                id="loginName"
                value={loginName}
                onChange={(event) => setLoginName(event.target.value)}
                placeholder="例如：小翔"
              />
              <button type="submit">登入並綁定狀態</button>
            </form>
          )}
        </article>

        <article className="reservation-card" id="reserve">
          <p className="section-kicker">Reservation</p>
          <h2>預約訂位</h2>
          <form onSubmit={handleReservation}>
            <div className="field-row">
              <label>
                日期
                <input
                  type="date"
                  min={minDate}
                  value={reservation.date}
                  onChange={(event) =>
                    setReservation((current) => ({ ...current, date: event.target.value }))
                  }
                />
              </label>
              <label>
                時間
                <input
                  type="time"
                  min="10:00"
                  max="21:00"
                  value={reservation.time}
                  onChange={(event) =>
                    setReservation((current) => ({ ...current, time: event.target.value }))
                  }
                />
              </label>
            </div>
            <div className="field-row">
              <label>
                人數
                <select
                  value={reservation.people}
                  onChange={(event) =>
                    setReservation((current) => ({ ...current, people: event.target.value }))
                  }
                >
                  <option value="1">1 位</option>
                  <option value="2">2 位</option>
                  <option value="3">3 位</option>
                  <option value="4">4 位</option>
                  <option value="5">5 位以上</option>
                </select>
              </label>
              <label>
                攜帶寵物
                <select
                  value={reservation.pet}
                  onChange={(event) =>
                    setReservation((current) => ({ ...current, pet: event.target.value }))
                  }
                >
                  <option value="dog">狗狗</option>
                  <option value="cat">貓貓</option>
                  <option value="both">貓貓與狗狗</option>
                  <option value="none">不攜帶寵物</option>
                </select>
              </label>
            </div>
            <button type="submit">送出預約</button>
          </form>
          {reservationMessage && <p className="reservation-message">{reservationMessage}</p>}
        </article>
      </section>

      <section className="menu-section" id="menu">
        <div className="section-heading">
          <p className="section-kicker">Menu</p>
          <h2>菜單品項介紹</h2>
          <div className="language-switcher" aria-label="菜單語言切換">
            {Object.entries(translations).map(([code, label]) => (
              <button
                className={language === code ? 'active' : ''}
                key={code}
                type="button"
                onClick={() => setLanguage(code)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="menu-grid">
          {menuItems.map((item) => (
            <article className="menu-card" key={item.id}>
              <img src={item.image} alt={item.labels[language].name} />
              <div>
                <div className="menu-title-row">
                  <h3>{item.labels[language].name}</h3>
                  <span>NT$ {item.price}</span>
                </div>
                <p>{item.labels[language].description}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <footer>
        <strong>小翔動物友善餐廳</strong>
        <span>營業時間 10:00 - 21:00 / 歡迎貓貓狗狗同行</span>
      </footer>
    </main>
  );
}

export default App;
