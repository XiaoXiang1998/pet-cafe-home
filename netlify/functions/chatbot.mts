const DEFAULT_MODEL = 'gpt-5-nano';
const CAFE_ADDRESS = '地址尚未設定，請聯繫店家確認。';
const BUSINESS_HOURS = '10:00 - 21:00';
const TIME_ZONE = 'Asia/Taipei';

const jsonResponse = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });

const getEnv = (key) => {
  const netlifyGlobal = globalThis as typeof globalThis & {
    Netlify?: { env?: { get?: (name: string) => string | undefined } };
    process?: { env?: Record<string, string | undefined> };
  };

  return netlifyGlobal.Netlify?.env?.get?.(key) || netlifyGlobal.process?.env?.[key] || '';
};

const getTaipeiDate = (date = new Date()) =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);

const addDays = (dateText, days) => {
  const date = new Date(`${dateText}T00:00:00+08:00`);
  date.setUTCDate(date.getUTCDate() + days);
  return getTaipeiDate(date);
};

const isValidDate = (year, month, day) => {
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
};

const toDateText = (year, month, day) => {
  if (!isValidDate(year, month, day)) return null;
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
};

const parseRequestedDate = (message, today) => {
  if (/今天|今日/.test(message)) return today;
  if (/明天|明日/.test(message)) return addDays(today, 1);
  if (/後天/.test(message)) return addDays(today, 2);

  const fullDate = message.match(/(\d{4})[/-](\d{1,2})[/-](\d{1,2})/);
  if (fullDate) {
    return toDateText(Number(fullDate[1]), Number(fullDate[2]), Number(fullDate[3]));
  }

  const slashDate = message.match(/(?:^|[^\d])(\d{1,2})[/-](\d{1,2})(?:[^\d]|$)/);
  if (slashDate) {
    return toDateText(Number(today.slice(0, 4)), Number(slashDate[1]), Number(slashDate[2]));
  }

  const chineseDate = message.match(/(\d{1,2})\s*月\s*(\d{1,2})\s*[日號]?/);
  if (chineseDate) {
    return toDateText(Number(today.slice(0, 4)), Number(chineseDate[1]), Number(chineseDate[2]));
  }

  return null;
};

const hasAvailabilityIntent = (message) =>
  /預約|訂位|定位|空位|位置|位子|時段|時間|還有|available|reserve|booking|book/i.test(message);

const formatSlotTime = (slotTime) => String(slotTime || '').slice(0, 5);

const fetchAvailability = async (dateText) => {
  const supabaseUrl = getEnv('VITE_SUPABASE_URL') || getEnv('SUPABASE_URL');
  const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY') || getEnv('SUPABASE_ANON_KEY');

  if (!supabaseUrl || !supabaseAnonKey) {
    return { error: 'Supabase 環境變數尚未設定，無法查詢預約時段。' };
  }

  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/get_reservation_availability`, {
    method: 'POST',
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${supabaseAnonKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ check_date: dateText }),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    return { error: data?.message || '無法查詢預約時段，請稍後再試。' };
  }

  return { data: Array.isArray(data) ? data : [] };
};

const buildAvailabilitySummary = (dateText, availabilityResult) => {
  if (!dateText) {
    return '使用者想查詢預約時段但沒有提供明確日期，請請使用者補上日期。';
  }

  if (availabilityResult?.error) {
    return `使用者查詢 ${dateText} 的預約時段，但系統查詢失敗：${availabilityResult.error}`;
  }

  const rows = availabilityResult?.data ?? [];
  const availableRows = rows.filter((row) => row.is_available && Number(row.remaining_count) > 0);

  if (!availableRows.length) {
    return `${dateText} 目前沒有可預約時段。若此日期已經過去，請明確回答過去日期不可預約。`;
  }

  const availableText = availableRows
    .map(
      (row) =>
        `${formatSlotTime(row.slot_time)} 剩 ${Number(row.remaining_count)} 組` +
        `（已預約 ${Number(row.booked_count)} 組）`,
    )
    .join('、');

  return `${dateText} 可預約時段如下：${availableText}。每個時段最多 6 組，僅統計 pending 與 confirmed 預約。`;
};

const buildAvailabilityReply = (dateText, availabilityResult) => {
  if (!dateText) {
    return '可以，我需要先知道日期。請輸入像「5/14 還有哪些時間可以預約？」這樣的問題。';
  }

  if (availabilityResult?.error) {
    return `目前預約查詢尚未完成資料庫設定：${availabilityResult.error}`;
  }

  const rows = availabilityResult?.data ?? [];
  const availableRows = rows.filter((row) => row.is_available && Number(row.remaining_count) > 0);

  if (!availableRows.length) {
    return `${dateText} 目前沒有可預約時段，或該日期已不可預約。`;
  }

  const timeText = availableRows
    .slice(0, 12)
    .map((row) => `${formatSlotTime(row.slot_time)}（剩 ${Number(row.remaining_count)} 組）`)
    .join('、');

  return `${dateText} 目前可預約：${timeText}。要正式訂位請使用網站預約表單。`;
};

const buildFreeFallbackReply = (message, askedAvailability, requestedDate, availabilityResult) => {
  if (askedAvailability) {
    return buildAvailabilityReply(requestedDate, availabilityResult);
  }

  if (/地址|地點|在哪|位置|怎麼去|address/i.test(message)) {
    return CAFE_ADDRESS;
  }

  if (/特色|介紹|寵物友善|貓|狗|餐廳|咖啡廳|feature|about/i.test(message)) {
    return '小翔動物友善餐廳歡迎貓貓狗狗同行，提供線上預約、三語菜單、評論與客訴回饋，適合和毛孩一起放鬆用餐。';
  }

  if (/菜單|餐點|menu|吃什麼|飲料|咖啡/i.test(message)) {
    return '菜單有中英文日文介紹，包含早午餐、咖啡、甜點與毛孩友善小點。你可以到頁面上的「菜單」區查看完整品項。';
  }

  return '我在這裡陪你聊聊，也可以幫你查預約時段、餐廳特色與地址。想查時段的話，請直接告訴我日期。';
};

const normalizeMessages = (messages) =>
  (Array.isArray(messages) ? messages : [])
    .filter((message) => message && typeof message.content === 'string')
    .slice(-8)
    .map((message) => ({
      role: message.role === 'assistant' ? 'assistant' : 'user',
      content: message.content.trim().slice(0, 800),
    }))
    .filter((message) => message.content);

const extractOutputText = (data) => {
  if (typeof data?.output_text === 'string' && data.output_text.trim()) {
    return data.output_text.trim();
  }

  const text = data?.output
    ?.flatMap((item) => item.content ?? [])
    ?.map((content) => content.text)
    ?.filter(Boolean)
    ?.join('\n')
    ?.trim();

  return text || '';
};

export default async (req) => {
  if (req.method !== 'POST') {
    return jsonResponse({ error: '只支援 POST 請求。' }, 405);
  }

  const payload = await req.json().catch(() => null);
  const messages = normalizeMessages(payload?.messages);
  const latestUserMessage = [...messages].reverse().find((message) => message.role === 'user');

  if (!latestUserMessage) {
    return jsonResponse({ error: '請先輸入想詢問的內容。' }, 400);
  }

  const today = getTaipeiDate();
  const askedAvailability = hasAvailabilityIntent(latestUserMessage.content);
  const requestedDate = askedAvailability ? parseRequestedDate(latestUserMessage.content, today) : null;
  const availabilityResult = requestedDate ? await fetchAvailability(requestedDate) : null;
  const availabilitySummary = askedAvailability
    ? buildAvailabilitySummary(requestedDate, availabilityResult)
    : '這次沒有查詢特定日期的預約時段。';
  const openAiKey = getEnv('OPENAI_API_KEY');

  if (!openAiKey || !openAiKey.startsWith('sk-')) {
    return jsonResponse({
      reply: buildFreeFallbackReply(
        latestUserMessage.content,
        askedAvailability,
        requestedDate,
        availabilityResult,
      ),
      mode: 'free-fallback',
    });
  }

  const systemPrompt = [
    '你是「小翔動物友善餐廳」網站的 AI 小幫手，使用繁體中文回答。',
    '語氣溫暖、簡短、像餐廳服務人員。每次回答控制在 120 字以內，除非使用者要求詳細說明。',
    `目前日期：${today}，時區：${TIME_ZONE}。營業時間：${BUSINESS_HOURS}。`,
    `營業地址：${CAFE_ADDRESS}`,
    '餐廳特色：寵物友善、歡迎貓狗同行、可線上預約、提供中英文日文菜單、可以查看評論與客訴回饋。',
    '若使用者要你直接建立、修改或取消預約，請說明目前只能協助查詢，正式操作請使用網站預約與會員中心。',
    '不要編造未提供的地址、優惠、電話、付款方式、停車資訊或不存在的店家政策。',
    availabilitySummary,
  ].join('\n');

  const conversation = messages
    .map((message) => `${message.role === 'assistant' ? 'Assistant' : 'User'}: ${message.content}`)
    .join('\n');

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${openAiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: getEnv('OPENAI_MODEL') || DEFAULT_MODEL,
      instructions: systemPrompt,
      input: conversation,
      max_output_tokens: 450,
      store: false,
    }),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    return jsonResponse(
      { error: data?.error?.message || 'OpenAI 回覆失敗，請稍後再試。' },
      response.status,
    );
  }

  const reply = extractOutputText(data);
  if (!reply) {
    return jsonResponse({ error: 'OpenAI 沒有回傳文字內容，請稍後再試。' }, 502);
  }

  return jsonResponse({ reply });
};
