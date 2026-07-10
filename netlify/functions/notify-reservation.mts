type ReservationRow = {
  id: string;
  user_name: string;
  reserve_date: string;
  reserve_time: string;
  phone: string;
  people: string;
  pet: string;
  status: string;
  created_at: string;
};

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });

const getEnv = (key: string) => {
  const netlifyGlobal = globalThis as typeof globalThis & {
    Netlify?: { env?: { get?: (name: string) => string | undefined } };
  };

  return netlifyGlobal.Netlify?.env?.get?.(key) ?? process.env[key];
};

const formatTime = (value: string) => String(value ?? '').slice(0, 5);

const petLabel = (value: string) =>
  ({
    dog: '狗狗',
    cat: '貓貓',
    both: '貓貓與狗狗',
    none: '不攜帶寵物',
  })[value] ?? value;

const fetchReservation = async (reservationId: string, userToken: string) => {
  const supabaseUrl = getEnv('VITE_SUPABASE_URL') || getEnv('SUPABASE_URL');
  const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY') || getEnv('SUPABASE_ANON_KEY');

  if (!supabaseUrl || !supabaseAnonKey) {
    return { error: 'Supabase 環境變數未設定。' };
  }

  const url = new URL('/rest/v1/reservations', supabaseUrl);
  url.searchParams.set('id', `eq.${reservationId}`);
  url.searchParams.set(
    'select',
    'id,user_name,reserve_date,reserve_time,phone,people,pet,status,created_at',
  );
  url.searchParams.set('limit', '1');

  const response = await fetch(url, {
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${userToken}`,
    },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    return { error: data?.message || '讀取預約資料失敗。' };
  }

  const reservation = Array.isArray(data) ? (data[0] as ReservationRow | undefined) : undefined;
  if (!reservation) {
    return { error: '找不到可通知的預約資料。' };
  }

  return { reservation };
};

const notifyViaAppsScript = async (reservation: ReservationRow) => {
  const webhookUrl = getEnv('GMAIL_NOTIFY_WEBHOOK_URL');
  const webhookSecret = getEnv('GMAIL_NOTIFY_SECRET');

  if (!webhookUrl || !webhookSecret) {
    return { status: 'skipped', reason: 'gmail_webhook_env_missing' };
  }

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({
      secret: webhookSecret,
      reservation: {
        id: reservation.id,
        name: reservation.user_name,
        date: reservation.reserve_date,
        time: formatTime(reservation.reserve_time),
        phone: reservation.phone || '未填寫',
        people: reservation.people,
        pet: petLabel(reservation.pet),
        status: reservation.status,
        createdAt: reservation.created_at,
      },
    }),
  });

  const text = await response.text();
  const data = (() => {
    try {
      return JSON.parse(text);
    } catch {
      return { raw: text };
    }
  })();

  if (!response.ok || data?.error) {
    return {
      status: 'failed',
      error: data?.error || data?.message || 'Google Apps Script notification failed.',
    };
  }

  if (data?.status !== 'sent') {
    return {
      status: 'failed',
      error: 'Google Apps Script returned an unexpected notification status.',
    };
  }

  return { status: 'sent' };
};

export default async (req: Request) => {
  const url = new URL(req.url);

  if (url.searchParams.get('health') === '1') {
    return jsonResponse({
      ok: true,
      hasSupabaseUrl: Boolean(getEnv('VITE_SUPABASE_URL') || getEnv('SUPABASE_URL')),
      hasSupabaseAnonKey: Boolean(getEnv('VITE_SUPABASE_ANON_KEY') || getEnv('SUPABASE_ANON_KEY')),
      hasGmailWebhookUrl: Boolean(getEnv('GMAIL_NOTIFY_WEBHOOK_URL')),
      hasGmailWebhookSecret: Boolean(getEnv('GMAIL_NOTIFY_SECRET')),
    });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();

  if (!token) {
    return jsonResponse({ error: '請先登入會員。' }, 401);
  }

  const payload = await req.json().catch(() => null);
  const reservationId = String(payload?.reservationId || '').trim();

  if (!reservationId) {
    return jsonResponse({ error: '缺少 reservationId。' }, 400);
  }

  const reservationResult = await fetchReservation(reservationId, token);
  if (reservationResult.error || !reservationResult.reservation) {
    return jsonResponse({ error: reservationResult.error }, 404);
  }

  const notifyResult = await notifyViaAppsScript(reservationResult.reservation);
  if (notifyResult.status === 'failed') {
    return jsonResponse({ error: notifyResult.error }, 502);
  }

  return jsonResponse(notifyResult);
};
