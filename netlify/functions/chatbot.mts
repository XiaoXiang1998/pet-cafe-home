const TIME_ZONE = 'Asia/Taipei';
const MAX_MENU_ITEMS = 8;
const MAX_KNOWLEDGE_ITEMS = 5;

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

type Intent =
  | 'reservation_availability'
  | 'menu'
  | 'store_knowledge'
  | 'general_chat'
  | 'high_risk';

type AvailabilityRow = {
  slot_time: string;
  booked_count: number;
  remaining_count: number;
  is_available: boolean;
};

type MenuItem = {
  labels?: Record<string, string>;
  price?: number;
  image?: string;
};

type KnowledgeItem = {
  category: string;
  title: string;
  content: string;
  keywords?: string[];
};

type DataResult<T> = {
  data?: T;
  error?: string;
};

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });

const getEnv = (key: string) => {
  const netlifyGlobal = globalThis as typeof globalThis & {
    Netlify?: { env?: { get?: (name: string) => string | undefined } };
    process?: { env?: Record<string, string | undefined> };
  };

  return netlifyGlobal.Netlify?.env?.get?.(key) || netlifyGlobal.process?.env?.[key] || '';
};

const getSupabaseConfig = () => {
  const url = getEnv('VITE_SUPABASE_URL') || getEnv('SUPABASE_URL');
  const anonKey = getEnv('VITE_SUPABASE_ANON_KEY') || getEnv('SUPABASE_ANON_KEY');

  if (!url || !anonKey) {
    return { error: 'Supabase URL 或 anon key 尚未設定，無法查詢可信店家資料。' };
  }

  return { url: url.replace(/\/$/, ''), anonKey };
};

const supabaseFetch = async <T>(path: string, init: RequestInit = {}): Promise<DataResult<T>> => {
  const config = getSupabaseConfig();
  if ('error' in config) return { error: config.error };

  const response = await fetch(`${config.url}${path}`, {
    ...init,
    headers: {
      apikey: config.anonKey,
      Authorization: `Bearer ${config.anonKey}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    return { error: data?.message || 'Supabase 查詢失敗，請稍後再試。' };
  }

  return { data: data as T };
};

const getTaipeiDate = (date = new Date()) =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);

const addDays = (dateText: string, days: number) => {
  const date = new Date(`${dateText}T00:00:00+08:00`);
  date.setUTCDate(date.getUTCDate() + days);
  return getTaipeiDate(date);
};

const isValidDate = (year: number, month: number, day: number) => {
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
};

const toDateText = (year: number, month: number, day: number) => {
  if (!isValidDate(year, month, day)) return null;
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
};

const parseRequestedDate = (message: string, today: string) => {
  if (/今天|今日|today/i.test(message)) return today;
  if (/明天|明日|tomorrow/i.test(message)) return addDays(today, 1);
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

const keywordMatch = (message: string, keywords: RegExp[]) =>
  keywords.some((keyword) => keyword.test(message));

const classifyIntent = (message: string): Intent => {
  if (keywordMatch(message, [/醫療|生病|吐|吃藥|獸醫|診斷|法律|合約|投資|股票|借貸|保險/i])) {
    return 'high_risk';
  }

  if (keywordMatch(message, [/預約|訂位|空位|位子|時段|候位|available|reserve|booking|book/i])) {
    return 'reservation_availability';
  }

  if (keywordMatch(message, [/菜單|餐點|價格|多少錢|咖啡|甜點|寵物餐|menu|coffee|dessert|price/i])) {
    return 'menu';
  }

  if (
    keywordMatch(message, [
      /地址|在哪|營業時間|幾點|規則|大型犬|寵物|毛孩|狗|貓|可帶|可以帶|能帶|帶.*(寵物|毛孩|狗|貓|犬)|(寵物|毛孩|狗|貓|犬).*(同行|入內|限制|接受|可以|可不可以)|低消|取消|政策|停車|電話|FAQ|faq|address|hours|policy|rule/i,
    ])
  ) {
    return 'store_knowledge';
  }

  return 'general_chat';
};

const normalizeMessages = (messages: unknown): ChatMessage[] =>
  (Array.isArray(messages) ? messages : [])
    .filter((message) => message && typeof message.content === 'string')
    .slice(-8)
    .map((message) => ({
      role: message.role === 'assistant' ? 'assistant' : 'user',
      content: message.content.trim().slice(0, 800),
    }))
    .filter((message) => message.content);

const formatSlotTime = (slotTime: string) => String(slotTime || '').slice(0, 5);

const fetchAvailability = (dateText: string) =>
  supabaseFetch<AvailabilityRow[]>('/rest/v1/rpc/get_reservation_availability', {
    method: 'POST',
    body: JSON.stringify({ check_date: dateText }),
  });

const getMenuLabel = (item: MenuItem) =>
  item.labels?.zh || item.labels?.zh_TW || item.labels?.name || item.labels?.en || '未命名品項';

const getMenuDescription = (item: MenuItem) =>
  item.labels?.description_zh || item.labels?.description || item.labels?.desc || '';

const fetchMenuItems = async (message: string) => {
  const query = encodeURIComponent('labels,price,image');
  const result = await supabaseFetch<MenuItem[]>(
    `/rest/v1/menu_items?select=${query}&is_active=eq.true&order=sort_order.asc&limit=20`,
  );

  if (result.error || !result.data) return result;

  const normalizedMessage = message.toLowerCase();
  const filtered = result.data.filter((item) => {
    const searchable = [getMenuLabel(item), getMenuDescription(item), String(item.price ?? '')]
      .join(' ')
      .toLowerCase();
    return (
      !keywordMatch(message, [/多少錢|價格|price/i]) ||
      searchable
        .split(/\s+/)
        .some((token) => token.length > 1 && normalizedMessage.includes(token.toLowerCase())) ||
      normalizedMessage.includes(getMenuLabel(item).toLowerCase())
    );
  });

  return { data: filtered.length ? filtered : result.data };
};

const getKnowledgeCategories = (message: string) => {
  const categories = new Set<string>();

  if (/地址|在哪|停車|電話|address/i.test(message)) categories.add('address');
  if (/營業時間|幾點|hours|開到|開門/i.test(message)) categories.add('business_hours');
  if (
    /寵物|大型犬|毛孩|狗|貓|犬|可帶|可以帶|能帶|帶.*(寵物|毛孩|狗|貓|犬)|(寵物|毛孩|狗|貓|犬).*(同行|入內|限制|接受|可以|可不可以)|pet|dog|cat|規則/i.test(
      message,
    )
  ) {
    categories.add('pet_rules');
  }
  if (/預約|訂位|reservation|booking|候位/i.test(message)) categories.add('reservation_rules');
  if (/取消|改期|退訂|cancel/i.test(message)) categories.add('cancellation_rules');
  if (/低消|政策|規定|policy|rule/i.test(message)) categories.add('policy');
  if (!categories.size) categories.add('faq');

  return [...categories];
};

const fetchKnowledgeItems = async (message: string) => {
  const categories = getKnowledgeCategories(message);
  const categoryFilter = categories.map((category) => `"${category}"`).join(',');
  const query = encodeURIComponent('category,title,content,keywords');

  const result = await supabaseFetch<KnowledgeItem[]>(
    `/rest/v1/knowledge_items?select=${query}&is_active=eq.true&category=in.(${categoryFilter})&order=updated_at.desc&limit=12`,
  );

  if (result.error || !result.data) return result;

  const terms = message
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter((term) => term.length >= 2);

  const scored = result.data
    .map((item) => {
      const searchable = [item.category, item.title, item.content, ...(item.keywords || [])]
        .join(' ')
        .toLowerCase();
      const score = terms.reduce((total, term) => total + (searchable.includes(term) ? 1 : 0), 0);
      return { item, score };
    })
    .sort((a, b) => b.score - a.score)
    .map(({ item }) => item);

  return { data: scored.slice(0, MAX_KNOWLEDGE_ITEMS) };
};

const buildAvailabilityReply = (dateText: string | null, result: DataResult<AvailabilityRow[]> | null) => {
  if (!dateText) {
    return '可以幫你查預約可用時段，請提供日期，例如「明天晚上還有位子嗎？」或「5/14 有哪些時段可以預約？」';
  }

  if (result?.error) {
    return `目前無法查詢 ${dateText} 的預約可用時段：${result.error}`;
  }

  const rows = result?.data ?? [];
  const availableRows = rows.filter((row) => row.is_available && Number(row.remaining_count) > 0);

  if (!availableRows.length) {
    return `${dateText} 目前沒有可預約時段。客服不會直接建立或修改預約，請改選其他日期或使用網站預約表單確認。`;
  }

  const times = availableRows
    .map((row) => `${formatSlotTime(row.slot_time)} 剩 ${Number(row.remaining_count)} 組`)
    .join('、');

  return `${dateText} 目前可預約時段：${times}。每個時段最多 6 組，正式訂位請使用網站預約表單完成。`;
};

const buildMenuReply = (result: DataResult<MenuItem[]>) => {
  if (result.error) return `目前無法查詢菜單資料：${result.error}`;

  const items = result.data ?? [];
  if (!items.length) {
    return '目前沒有可公開查詢的啟用中菜單品項，店家尚未設定菜單資料。';
  }

  const itemText = items
    .slice(0, MAX_MENU_ITEMS)
    .map((item) => {
      const description = getMenuDescription(item);
      return `${getMenuLabel(item)}：NT$${item.price ?? 0}${description ? `，${description}` : ''}`;
    })
    .join('；');

  return `目前查到的啟用中菜單品項有：${itemText}。價格與品項以店家資料庫目前設定為準。`;
};

const buildKnowledgeReply = (result: DataResult<KnowledgeItem[]>) => {
  if (result.error) return `目前無法查詢店家知識資料：${result.error}`;

  const items = result.data ?? [];
  if (!items.length) {
    return '這項店家資料目前尚未設定，所以我不能自行猜測地址、營業時間、規則或政策。';
  }

  return items.map((item) => `${item.title}：${item.content}`).join('\n');
};

const buildHighRiskReply = () =>
  '這類問題可能涉及醫療、法律、金融或其他高風險判斷。我只能提供一般資訊，不能做診斷、用藥、法律或投資建議；請洽詢合格獸醫、律師、財務顧問或相關專業人士。';

const buildNoneProviderReply = () =>
  '我目前可以幫你查店家資料、菜單與可預約時段。你可以問我「今天有哪些時段能訂位？」、「有什麼餐點？」或「可以帶什麼寵物？」';

export default async (req: Request) => {
  if (req.method !== 'POST') {
    return jsonResponse({ error: '只接受 POST 請求。' }, 405);
  }

  const payload = await req.json().catch(() => null);
  const messages = normalizeMessages(payload?.messages);
  const latestUserMessage = [...messages].reverse().find((message) => message.role === 'user');

  if (!latestUserMessage) {
    return jsonResponse({ error: '請提供使用者訊息。' }, 400);
  }

  const intent = classifyIntent(latestUserMessage.content);
  const provider = (getEnv('AI_PROVIDER') || 'none').toLowerCase();

  if (intent === 'high_risk') {
    return jsonResponse({ reply: buildHighRiskReply(), intent, mode: 'grounded-fallback' });
  }

  if (intent === 'reservation_availability') {
    const requestedDate = parseRequestedDate(latestUserMessage.content, getTaipeiDate());
    const availabilityResult = requestedDate ? await fetchAvailability(requestedDate) : null;
    return jsonResponse({
      reply: buildAvailabilityReply(requestedDate, availabilityResult),
      intent,
      mode: 'grounded-supabase',
    });
  }

  if (intent === 'menu') {
    const menuResult = await fetchMenuItems(latestUserMessage.content);
    return jsonResponse({ reply: buildMenuReply(menuResult), intent, mode: 'grounded-supabase' });
  }

  if (intent === 'store_knowledge') {
    const knowledgeResult = await fetchKnowledgeItems(latestUserMessage.content);
    return jsonResponse({ reply: buildKnowledgeReply(knowledgeResult), intent, mode: 'grounded-supabase' });
  }

  if (provider === 'none') {
    return jsonResponse({ reply: buildNoneProviderReply(), intent, mode: 'free-fallback' });
  }

  return jsonResponse({
    reply: '我目前可以幫你查店家資料、菜單與可預約時段；其他閒聊功能暫時還沒有開放。',
    intent,
    mode: 'free-fallback',
  });
};
