import React, { useEffect, useMemo, useState } from 'react';
import { isSupabaseConfigured, supabase } from './supabaseClient';

const FEEDBACK_PAGE_SIZE = 5;

const menuItems = [
  {
    id: 'salmon-brunch',
    price: 320,
    image:
      'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=900&q=80',
    labels: {
      zh: {
        name: '香煎鮭魚早午餐',
        description: '香煎鮭魚、溫沙拉、野菇歐姆蛋與檸檬優格醬。',
      },
      en: {
        name: 'Pan-Seared Salmon Brunch',
        description: 'Pan-seared salmon, warm salad, mushroom omelet, and lemon yogurt sauce.',
      },
      ja: {
        name: 'サーモンブランチ',
        description: '香ばしく焼いたサーモン、温野菜、きのこオムレツ、レモンヨーグルトソース。',
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
    id: 'pet-chicken-bites',
    price: 140,
    image:
      'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=900&q=80',
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
  {
    id: 'garden-pasta',
    price: 280,
    image:
      'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=900&q=80',
    labels: {
      zh: {
        name: '花園野菇義大利麵',
        description: '野菇、甜椒、羅勒與橄欖油清炒，味道溫和不厚重。',
      },
      en: {
        name: 'Garden Mushroom Pasta',
        description: 'Mushrooms, bell peppers, basil, and olive oil in a light cafe-style pasta.',
      },
      ja: {
        name: 'ガーデンきのこパスタ',
        description: 'きのこ、パプリカ、バジル、オリーブオイルで軽やかに仕上げたパスタ。',
      },
    },
  },
  {
    id: 'pumpkin-soup',
    price: 160,
    image:
      'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=900&q=80',
    labels: {
      zh: {
        name: '南瓜暖暖濃湯',
        description: '南瓜、鮮奶油與烤堅果香氣，適合搭配早午餐。',
      },
      en: {
        name: 'Warm Pumpkin Soup',
        description: 'Pumpkin, cream, and roasted nut aroma, ideal with brunch plates.',
      },
      ja: {
        name: 'かぼちゃポタージュ',
        description: 'かぼちゃ、クリーム、ローストナッツの香りを合わせた温かいスープ。',
      },
    },
  },
  {
    id: 'berry-waffle',
    price: 220,
    image:
      'https://images.unsplash.com/photo-1562376552-0d160a2f238d?auto=format&fit=crop&w=900&q=80',
    labels: {
      zh: {
        name: '莓果鬆餅盤',
        description: '現烤鬆餅、莓果、蜂蜜奶油與季節水果。',
      },
      en: {
        name: 'Berry Waffle Plate',
        description: 'Fresh waffles, berries, honey butter, and seasonal fruit.',
      },
      ja: {
        name: 'ベリーワッフル',
        description: '焼きたてワッフル、ベリー、ハニーバター、季節のフルーツ。',
      },
    },
  },
];

const gallery = [
  {
    title: '午後的窗邊座位',
    alt: '咖啡廳窗邊的可愛狗狗',
    image:
      'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=1400&q=80',
  },
  {
    title: '巴哥的貴賓席',
    alt: '可愛巴哥狗望向鏡頭',
    image:
      'https://images.unsplash.com/photo-1517423440428-a5a00ad493e8?auto=format&fit=crop&w=1400&q=80',
  },
  {
    title: '貓咪午後小睡',
    alt: '可愛貓咪在室內休息',
    image:
      'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=1400&q=80',
  },
  {
    title: '柴柴朋友聚會',
    alt: '狗狗在戶外開心互動',
    image:
      'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=1400&q=80',
  },
  {
    title: '貓貓吧台巡邏',
    alt: '貓咪在咖啡廳桌邊探索',
    image:
      'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?auto=format&fit=crop&w=1400&q=80',
  },
  {
    title: '大狗也有寬敞座位',
    alt: '大型犬坐在明亮空間',
    image:
      'https://images.unsplash.com/photo-1537151625747-768eb6cf92b2?auto=format&fit=crop&w=1400&q=80',
  },
  {
    title: '暖光用餐角落',
    alt: '咖啡廳桌面與咖啡杯',
    image:
      'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1400&q=80',
  },
];

const translations = {
  zh: '中文',
  en: 'English',
  ja: '日本語',
};

const petLabels = {
  dog: '狗狗',
  cat: '貓貓',
  both: '貓貓與狗狗',
  none: '不攜帶寵物',
};

const heroScenes = [
  {
    title: '窗邊迎賓區',
    description: '狗狗坐在窗邊看著街景，是入店第一眼會看到的安靜座位。',
    image:
      'https://images.pexels.com/photos/30785130/pexels-photo-30785130.jpeg?auto=compress&cs=tinysrgb&w=1200&h=900&fit=crop',
    alt: '狗狗坐在寵物友善咖啡廳窗邊的店內景',
  },
  {
    title: '植物用餐角落',
    description: '桌椅之間保留毛孩活動空間，適合小型犬在座位旁休息。',
    image:
      'https://images.pexels.com/photos/19597985/pexels-photo-19597985.jpeg?auto=compress&cs=tinysrgb&w=1200&h=900&fit=crop',
    alt: '小狗坐在咖啡廳桌椅下方的植物用餐區',
  },
  {
    title: '木桌吧台視角',
    description: '木質桌面與暖色背景，呈現毛孩靠近吧台區的日常互動。',
    image:
      'https://images.pexels.com/photos/19327030/pexels-photo-19327030.jpeg?auto=compress&cs=tinysrgb&w=1200&h=900&fit=crop',
    alt: '狗狗在咖啡廳木桌旁看向店內的吧台視角',
  },
];

const isDuplicateSignupError = (error) => {
  const message = `${error?.code ?? ''} ${error?.message ?? ''}`.toLowerCase();
  return (
    message.includes('already registered') ||
    message.includes('already exists') ||
    message.includes('user already') ||
    message.includes('email_exists')
  );
};

const getSignInErrorMessage = (error) => {
  const message = `${error?.code ?? ''} ${error?.message ?? ''}`.toLowerCase();

  if (
    message.includes('invalid_credentials') ||
    message.includes('invalid login credentials') ||
    message.includes('invalid email or password')
  ) {
    return '登入失敗：無相關帳號資訊或密碼錯誤。';
  }

  if (message.includes('email_not_confirmed') || message.includes('email not confirmed')) {
    return '登入失敗：請先到信箱完成 Email 驗證。';
  }

  return `登入失敗：${error?.message ?? '請稍後再試。'}`;
};

const getAuthRedirectTo = () => {
  if (window.location.hostname.endsWith('github.io')) {
    return 'https://xiaoxiang1998.github.io/pet-cafe-home/';
  }

  return `${window.location.origin}/`;
};

function App() {
  const [user, setUser] = useState(null);
  const [authUser, setAuthUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [authMessage, setAuthMessage] = useState('');
  const [authMode, setAuthMode] = useState('signin');
  const [emailAuth, setEmailAuth] = useState({
    email: '',
    password: '',
    nickname: '',
  });
  const [loginName, setLoginName] = useState('');
  const [accountOpen, setAccountOpen] = useState(false);
  const [heroSceneIndex, setHeroSceneIndex] = useState(0);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [reservation, setReservation] = useState({
    date: '',
    time: '',
    phone: '',
    people: '2',
    pet: 'dog',
  });
  const [reservationMessage, setReservationMessage] = useState('');
  const [myReservations, setMyReservations] = useState([]);
  const [language, setLanguage] = useState('zh');
  const [feedbackForm, setFeedbackForm] = useState({
    type: 'review',
    rating: 5,
    message: '',
  });
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackPage, setFeedbackPage] = useState(1);
  const [feedbackEntries, setFeedbackEntries] = useState([
    {
      id: 1,
      type: 'review',
      rating: 5,
      name: 'Mika',
      message: '店內座位很寬，狗狗推車也放得下，餐點上桌速度穩定。',
    },
    {
      id: 2,
      type: 'complaint',
      rating: 3,
      name: '匿名訪客',
      message: '尖峰時段等候稍久，希望預約提醒可以再清楚一點。',
    },
  ]);

  const minDate = useMemo(() => new Date().toISOString().split('T')[0], []);
  const activeHeroScene = heroScenes[heroSceneIndex];
  const activePhoto = gallery[galleryIndex];
  const displayName =
    profile?.nickname || authUser?.user_metadata?.name || authUser?.email || user?.name || '匿名訪客';
  const isLoggedIn = Boolean(authUser || user);
  const feedbackPageCount = Math.max(1, Math.ceil(feedbackEntries.length / FEEDBACK_PAGE_SIZE));
  const currentFeedbackPage = Math.min(feedbackPage, feedbackPageCount);
  const feedbackStartIndex = (currentFeedbackPage - 1) * FEEDBACK_PAGE_SIZE;
  const paginatedFeedbackEntries = feedbackEntries.slice(
    feedbackStartIndex,
    feedbackStartIndex + FEEDBACK_PAGE_SIZE,
  );

  const loadProfile = async (currentUser) => {
    if (!isSupabaseConfigured || !currentUser) {
      setProfile(null);
      return;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, nickname')
      .eq('id', currentUser.id)
      .maybeSingle();

    if (error) {
      setAuthMessage(`讀取會員資料失敗：${error.message}`);
      return;
    }

    setProfile(data);
  };

  const loadReservations = async () => {
    if (!isSupabaseConfigured || !authUser) return;

    const { data, error } = await supabase
      .from('reservations')
      .select('id, reserve_date, reserve_time, phone, people, pet, status, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      setReservationMessage(`讀取預約失敗：${error.message}`);
      return;
    }

    setMyReservations(data ?? []);
  };

  const loadFeedbacks = async () => {
    if (!isSupabaseConfigured) return;

    const { data, error } = await supabase
      .from('feedbacks')
      .select('id, type, rating, user_name, message, created_at')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      setFeedbackMessage(`讀取評論失敗：${error.message}`);
      return;
    }

    setFeedbackEntries(
      (data ?? []).map((entry) => ({
        id: entry.id,
        type: entry.type,
        rating: entry.rating,
        name: entry.user_name,
        message: entry.message,
      })),
    );
  };

  useEffect(() => {
    const timer = window.setInterval(() => {
      setGalleryIndex((current) => (current + 1) % gallery.length);
    }, 4200);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) return undefined;

    let ignore = false;

    supabase.auth.getSession().then(({ data }) => {
      if (ignore) return;
      const currentUser = data.session?.user ?? null;
      setAuthUser(currentUser);
      loadProfile(currentUser);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setAuthUser(currentUser);
      loadProfile(currentUser);
      if (!currentUser) {
        setProfile(null);
        setMyReservations([]);
      }
    });

    return () => {
      ignore = true;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    loadFeedbacks();
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured || !authUser) return;
    loadReservations();
  }, [authUser]);

  useEffect(() => {
    setFeedbackPage((current) => (current > feedbackPageCount ? feedbackPageCount : current));
  }, [feedbackPageCount]);

  const handleLogin = (event) => {
    event.preventDefault();
    const trimmedName = loginName.trim();
    if (!trimmedName) return;
    setUser({ name: trimmedName });
    setLoginName('');
    setAccountOpen(false);
  };

  const handleGoogleLogin = async () => {
    if (!isSupabaseConfigured) {
      setAuthMessage('尚未設定 Supabase URL / anon key，先使用暫時登入模式。');
      return;
    }

    const redirectTo = getAuthRedirectTo();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    });

    if (error) setAuthMessage(`Google 登入失敗：${error.message}`);
  };

  const handleEmailAuth = async (event) => {
    event.preventDefault();
    if (!isSupabaseConfigured) {
      setAuthMessage('尚未設定 Supabase，請先使用暫時登入。');
      return;
    }

    const email = emailAuth.email.trim();
    const password = emailAuth.password;
    const nickname = emailAuth.nickname.trim();

    if (!email || !password) {
      setAuthMessage('請輸入 Email 和密碼。');
      return;
    }

    if (authMode === 'signup') {
      const { data: emailExists, error: emailLookupError } = await supabase.rpc('is_email_registered', {
        check_email: email,
      });

      if (emailLookupError) {
        setAuthMessage('目前無法檢查帳號是否重複，請稍後再試。');
        return;
      }

      if (emailExists) {
        setAuthMessage('此 Email 已被註冊，請直接登入或換一個 Email。');
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: getAuthRedirectTo(),
          data: {
            name: nickname || email.split('@')[0],
          },
        },
      });

      if (error) {
        setAuthMessage(
          isDuplicateSignupError(error)
            ? '此 Email 已被註冊，請直接登入或換一個 Email。'
            : `註冊失敗：${error.message}`,
        );
        return;
      }

      if (data.user?.identities && data.user.identities.length === 0) {
        setAuthMessage('此 Email 已被註冊，請直接登入或換一個 Email。');
        return;
      }

      if (data.user && !data.session) {
        setAuthMessage('註冊成功，請到信箱收認證信後再登入。');
      } else {
        setAuthMessage('註冊成功，已登入。');
        setAccountOpen(false);
      }
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setAuthMessage(getSignInErrorMessage(error));
      return;
    }

    setAuthMessage('');
    setAccountOpen(false);
  };

  const handleResendConfirmation = async () => {
    if (!isSupabaseConfigured) {
      setAuthMessage('尚未設定 Supabase，無法重寄驗證信。');
      return;
    }

    const email = emailAuth.email.trim();

    if (!email) {
      setAuthMessage('請先輸入 Email，再重寄驗證信。');
      return;
    }

    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: getAuthRedirectTo(),
      },
    });

    if (error) {
      setAuthMessage(`重寄驗證信失敗：${error.message}`);
      return;
    }

    setAuthMessage('已重寄驗證信，請到信箱點擊確認連結。');
  };

  const handleSignOut = async () => {
    if (isSupabaseConfigured && authUser) {
      await supabase.auth.signOut();
    }

    setUser(null);
    setAuthUser(null);
    setProfile(null);
    setAccountOpen(false);
  };

  const handleReservation = async (event) => {
    event.preventDefault();
    if (!reservation.date || !reservation.time) {
      setReservationMessage('請先選擇訂位日期與時間。');
      return;
    }

    const phone = reservation.phone.trim();

    if (!phone) {
      setReservationMessage('請留下聯絡電話，方便店內確認座位。');
      return;
    }

    if (isSupabaseConfigured) {
      if (!authUser) {
        setReservationMessage('請先使用右上角會員登入，再進行預約。');
        return;
      }

      const { error } = await supabase.from('reservations').insert({
        user_id: authUser.id,
        user_name: displayName,
        reserve_date: reservation.date,
        reserve_time: reservation.time,
        phone,
        people: reservation.people,
        pet: reservation.pet,
      });

      if (error) {
        setReservationMessage(`預約失敗：${error.message}`);
        return;
      }

      setReservationMessage('預約成功，已存入會員預約紀錄。');
      setReservation((current) => ({ ...current, date: '', time: '', phone: '' }));
      loadReservations();
      return;
    }

    setReservationMessage(
      `${displayName}，已收到 ${reservation.date} ${reservation.time}，電話 ${phone}，${reservation.people} 位，${petLabels[reservation.pet]} 的預約需求。`,
    );
  };

  const handleCancelReservation = async (reservationId) => {
    if (!isSupabaseConfigured || !authUser) {
      setReservationMessage('請先登入會員，再取消預約。');
      return;
    }

    const { data, error } = await supabase.rpc('cancel_own_reservation', {
      reservation_id: reservationId,
    });

    if (error) {
      setReservationMessage(`取消預約失敗：${error.message}`);
      return;
    }

    if (!data) {
      setReservationMessage('找不到可取消的預約，或此預約已取消。');
      return;
    }

    setReservationMessage('已取消預約。');
    loadReservations();
  };

  const goToPhoto = (direction) => {
    setGalleryIndex((current) => {
      const nextIndex = current + direction;
      if (nextIndex < 0) return gallery.length - 1;
      return nextIndex % gallery.length;
    });
  };

  const handleFeedbackSubmit = async (event) => {
    event.preventDefault();
    const trimmedMessage = feedbackForm.message.trim();
    if (!trimmedMessage) {
      setFeedbackMessage('請先輸入評論或客訴內容。');
      return;
    }

    if (isSupabaseConfigured) {
      if (!authUser) {
        setFeedbackMessage('請先使用右上角會員登入，再送出評論或客訴。');
        return;
      }

      const { error } = await supabase.from('feedbacks').insert({
        user_id: authUser.id,
        user_name: displayName,
        type: feedbackForm.type,
        rating: feedbackForm.rating,
        message: trimmedMessage,
      });

      if (error) {
        setFeedbackMessage(`送出回饋失敗：${error.message}`);
        return;
      }

      setFeedbackForm((current) => ({ ...current, message: '' }));
      setFeedbackMessage('');
      setFeedbackPage(1);
      loadFeedbacks();
      return;
    }

    setFeedbackEntries((current) => [
      {
        id: Date.now(),
        type: feedbackForm.type,
        rating: feedbackForm.rating,
        name: displayName,
        message: trimmedMessage,
      },
      ...current,
    ]);
    setFeedbackPage(1);
    setFeedbackForm((current) => ({ ...current, message: '' }));
    setFeedbackMessage('');
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
          <a href="#feedback">評論</a>
        </div>
        <div className="account-menu">
          <button
            className="account-button"
            type="button"
            aria-expanded={accountOpen}
            aria-label="會員選單"
            onClick={() => setAccountOpen((current) => !current)}
          >
            <span className="account-icon" aria-hidden="true">
              <span />
            </span>
            <strong>{isLoggedIn ? displayName : '登入'}</strong>
          </button>
          {accountOpen && (
            <div className="account-panel">
              {isLoggedIn ? (
                <>
                  <p>
                    目前登入：
                    <strong>{displayName}</strong>
                  </p>
                  <button type="button" onClick={handleSignOut}>
                    登出
                  </button>
                </>
              ) : (
                <>
                  <p className="panel-title">登入選項</p>
                  {isSupabaseConfigured && (
                    <>
                      <div className="auth-tabs" role="tablist" aria-label="登入或註冊">
                        <button
                          className={authMode === 'signin' ? 'active' : ''}
                          type="button"
                          onClick={() => setAuthMode('signin')}
                        >
                          登入
                        </button>
                        <button
                          className={authMode === 'signup' ? 'active' : ''}
                          type="button"
                          onClick={() => setAuthMode('signup')}
                        >
                          註冊
                        </button>
                      </div>
                      <form onSubmit={handleEmailAuth}>
                        <label htmlFor="authEmail">Email 帳號</label>
                        <input
                          id="authEmail"
                          type="email"
                          value={emailAuth.email}
                          onChange={(event) =>
                            setEmailAuth((current) => ({ ...current, email: event.target.value }))
                          }
                          placeholder="name@example.com"
                        />
                        <label htmlFor="authPassword">密碼</label>
                        <input
                          id="authPassword"
                          type="password"
                          value={emailAuth.password}
                          onChange={(event) =>
                            setEmailAuth((current) => ({
                              ...current,
                              password: event.target.value,
                            }))
                          }
                          placeholder="至少 6 碼"
                        />
                        {authMode === 'signup' && (
                          <>
                            <label htmlFor="authNickname">暱稱</label>
                            <input
                              id="authNickname"
                              value={emailAuth.nickname}
                              onChange={(event) =>
                                setEmailAuth((current) => ({
                                  ...current,
                                  nickname: event.target.value,
                                }))
                              }
                              placeholder="例如：小翔"
                            />
                          </>
                        )}
                        <button type="submit">{authMode === 'signup' ? '建立帳號' : '登入'}</button>
                      </form>
                      {authMode === 'signup' && (
                        <button
                          type="button"
                          className="resend-confirmation-button"
                          onClick={handleResendConfirmation}
                        >
                          重寄驗證信
                        </button>
                      )}
                      <div className="social-login">
                        <span>或使用 Google</span>
                        <button type="button" className="google-icon-button" aria-label="使用 Google 登入" onClick={handleGoogleLogin}>
                          <svg viewBox="0 0 24 24" aria-hidden="true">
                            <path
                              fill="#4285f4"
                              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            />
                            <path
                              fill="#34a853"
                              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            />
                            <path
                              fill="#fbbc05"
                              d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z"
                            />
                            <path
                              fill="#ea4335"
                              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06L5.84 9.9C6.71 7.3 9.14 5.38 12 5.38z"
                            />
                          </svg>
                        </button>
                      </div>
                    </>
                  )}
                  {!isSupabaseConfigured && (
                    <form onSubmit={handleLogin}>
                      <label htmlFor="loginName">暱稱</label>
                      <input
                        id="loginName"
                        value={loginName}
                        onChange={(event) => setLoginName(event.target.value)}
                        placeholder="例如：小翔"
                      />
                      <button type="submit">暫時登入</button>
                      <small>尚未設定 Supabase 時，暫時登入只存在目前瀏覽器頁面。</small>
                    </form>
                  )}
                </>
              )}
              {authMessage && <small className="auth-message">{authMessage}</small>}
            </div>
          )}
        </div>
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
        <div className="hero-card" aria-label="寵物友善店內場景切換">
          <img src={activeHeroScene.image} alt={activeHeroScene.alt} />
          <div className="panorama-badge">
            <span>{activeHeroScene.title}</span>
            <small>{activeHeroScene.description}</small>
          </div>
          <div className="hero-scene-switcher" aria-label="切換店內場景">
            {heroScenes.map((scene, index) => (
              <button
                className={heroSceneIndex === index ? 'active' : ''}
                key={scene.title}
                type="button"
                onClick={() => setHeroSceneIndex(index)}
              >
                <span>{String(index + 1).padStart(2, '0')}</span>
                {scene.title}
              </button>
            ))}
          </div>
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
            <h3>會員入口</h3>
            <p>右上角人頭 icon 保留登入入口，後續可串接正式資料庫與會員權限。</p>
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
        <div className="carousel-shell" aria-label="動物合照輪播">
          <button className="carousel-arrow prev" type="button" onClick={() => goToPhoto(-1)}>
            上一張
          </button>
          <figure className="carousel-stage">
            <img src={activePhoto.image} alt={activePhoto.alt} />
            <figcaption>
              <span>{String(galleryIndex + 1).padStart(2, '0')}</span>
              {activePhoto.title}
            </figcaption>
          </figure>
          <button className="carousel-arrow next" type="button" onClick={() => goToPhoto(1)}>
            下一張
          </button>
          <div className="carousel-dots" aria-label="輪播縮圖選擇">
            {gallery.map((photo, index) => (
              <button
                className={galleryIndex === index ? 'active' : ''}
                key={photo.title}
                type="button"
                aria-label={`切換到 ${photo.title}`}
                onClick={() => setGalleryIndex(index)}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="forms-section">
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
            <label>
              聯絡電話
              <input
                type="tel"
                inputMode="tel"
                value={reservation.phone}
                onChange={(event) =>
                  setReservation((current) => ({ ...current, phone: event.target.value }))
                }
                placeholder="例如：0912-345-678"
              />
            </label>
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
          {isSupabaseConfigured && authUser && (
            <div className="my-reservations">
              <h3>我的預約</h3>
              {myReservations.length === 0 ? (
                <p>目前沒有預約紀錄。</p>
              ) : (
                myReservations.map((item) => (
                  <article key={item.id}>
                    <div>
                      <strong>
                        {item.reserve_date} {item.reserve_time}
                      </strong>
                      <span>
                        {item.people} 位 / {petLabels[item.pet] ?? item.pet} / 電話 {item.phone || '未填'} /{' '}
                        {item.status === 'cancelled' ? '已取消' : item.status}
                      </span>
                    </div>
                    {item.status !== 'cancelled' && (
                      <button type="button" onClick={() => handleCancelReservation(item.id)}>
                        取消預約
                      </button>
                    )}
                  </article>
                ))
              )}
            </div>
          )}
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

      <section className="feedback-section" id="feedback">
        <div className="section-heading">
          <div>
            <p className="section-kicker">Reviews & Complaints</p>
            <h2>客訴與評論</h2>
          </div>
        </div>

        <div className="feedback-layout">
          <article className="feedback-card">
            <h3>留下你的回饋</h3>
            <form onSubmit={handleFeedbackSubmit}>
              <label>
                類型
                <select
                  value={feedbackForm.type}
                  onChange={(event) =>
                    setFeedbackForm((current) => ({ ...current, type: event.target.value }))
                  }
                >
                  <option value="review">評論</option>
                  <option value="complaint">客訴</option>
                </select>
              </label>

              <p className="feedback-author">
                顯示名稱：
                <strong>{displayName}</strong>
              </p>

              <label>
                評分
                <div className="rating-stars" role="radiogroup" aria-label="評分星等">
                  {[1, 2, 3, 4, 5].map((score) => (
                    <button
                      className={score <= feedbackForm.rating ? 'active' : ''}
                      key={score}
                      type="button"
                      role="radio"
                      aria-checked={feedbackForm.rating === score}
                      onClick={() =>
                        setFeedbackForm((current) => ({ ...current, rating: score }))
                      }
                    >
                      ★
                    </button>
                  ))}
                  <span>{feedbackForm.rating} / 5</span>
                </div>
              </label>

              <label>
                內容
                <textarea
                  rows="5"
                  value={feedbackForm.message}
                  onChange={(event) =>
                    setFeedbackForm((current) => ({ ...current, message: event.target.value }))
                  }
                  placeholder="請輸入評論或客訴內容"
                />
              </label>

              <button type="submit">送出回饋</button>
            </form>
            {feedbackMessage && <p className="feedback-message">{feedbackMessage}</p>}
          </article>

          <div className="feedback-list" aria-label="評論與客訴列表">
            {paginatedFeedbackEntries.map((entry) => (
              <article className="feedback-item" key={entry.id}>
                <div className="feedback-item-head">
                  <span className={entry.type === 'complaint' ? 'tag complaint' : 'tag'}>
                    {entry.type === 'complaint' ? '客訴' : '評論'}
                  </span>
                  <div className="readonly-stars" aria-label={`${entry.rating} 顆星`}>
                    {'★'.repeat(entry.rating)}
                  </div>
                </div>
                <h3>{entry.name}</h3>
                <p>{entry.message}</p>
              </article>
            ))}
            {feedbackPageCount > 1 && (
              <nav className="feedback-pagination" aria-label="評論分頁">
                <button
                  type="button"
                  onClick={() => setFeedbackPage((current) => Math.max(1, current - 1))}
                  disabled={currentFeedbackPage === 1}
                >
                  上一頁
                </button>
                <div className="feedback-page-numbers">
                  {Array.from({ length: feedbackPageCount }, (_, index) => {
                    const page = index + 1;

                    return (
                      <button
                        className={page === currentFeedbackPage ? 'active' : ''}
                        key={page}
                        type="button"
                        aria-label={`第 ${page} 頁`}
                        aria-current={page === currentFeedbackPage ? 'page' : undefined}
                        onClick={() => setFeedbackPage(page)}
                      >
                        {page}
                      </button>
                    );
                  })}
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setFeedbackPage((current) => Math.min(feedbackPageCount, current + 1))
                  }
                  disabled={currentFeedbackPage === feedbackPageCount}
                >
                  下一頁
                </button>
              </nav>
            )}
          </div>
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
