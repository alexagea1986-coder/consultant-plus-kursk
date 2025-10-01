import { NextRequest, NextResponse } from 'next/server';
import type { Agent } from 'undici';
import crypto from 'crypto';

let cachedToken: string | null = null;
let tokenExpiry = 0;

const API_URL = 'https://gigachat.devices.sberbank.ru/api/v1/chat/completions';
const INSECURE_SSL = process.env.GIGACHAT_INSECURE_SSL === 'true';

const getAgent = (): Agent | undefined => {
  if (!INSECURE_SSL) return undefined;
  
  const { Agent } = require('undici');
  return new Agent({
    connect: {
      rejectUnauthorized: false
    }
  });
};

function getAuthKey(): string {
  const authKey = process.env.GIGACHAT_AUTH_KEY;
  if (!authKey) {
    throw new Error('GigaChat AUTH_KEY not configured - use the Authorization key from dashboard');
  }
  return authKey;
}

async function getAccessToken(): Promise<string> {
  const now = Date.now();
  if (cachedToken && now < tokenExpiry) {
    return cachedToken;
  }

  const authKey = getAuthKey();
  const scope = process.env.GIGACHAT_SCOPE || 'GIGACHAT_API_PERS';
  const rqUID = crypto.randomUUID();
  const agent = getAgent();
  const fetchOptions: RequestInit & { dispatcher?: Agent } = {
    method: 'POST',
    ...(agent ? { dispatcher: agent } : {}),
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json',
      'RqUID': rqUID,
      'Authorization': `Basic ${authKey}`,
    },
    body: new URLSearchParams({ 
      scope 
    }).toString(),
  };

  const tokenResponse = await fetch('https://ngw.devices.sberbank.ru:9443/api/v2/oauth', fetchOptions);

  if (!tokenResponse.ok) {
    const errorText = await tokenResponse.text();
    console.error('Token error details:', { status: tokenResponse.status, text: errorText });
    throw new Error(`Token fetch failed: ${tokenResponse.status} ${errorText}`);
  }

  const tokenData = await tokenResponse.json();
  cachedToken = tokenData.access_token;
  tokenExpiry = now + (tokenData.expires_in * 1000) - 60000;
  console.log('Token fetched successfully');
  return tokenData.access_token;
}

async function exa_search(query: string, selectedProfile: string, top_k: number = 10): Promise<string> {
  const EXA_API_KEY = process.env.EXA_API_KEY;
  if (!EXA_API_KEY) {
    console.warn('EXA_API_KEY not set, skipping web search');
    return '';
  }

  try {
    const allResults: any[] = [];
    const currentDate = new Date().toLocaleDateString('ru-RU', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    // Priority domains for Russian legal/financial information
    const priorityDomains = [
      'consultant.ru', 'garant.ru', 'pravo.gov.ru',
      'cbr.ru', 'nalog.gov.ru', 'pfr.gov.ru',
      'minfin.gov.ru', 'ach.gov.ru', 'rosmintrud.ru',
      'rbc.ru', 'interfax.ru', 'tass.ru', 'ria.ru',
      'banki.ru', 'domclick.ru', 'kommersant.ru'
    ];

    // Strategy 1: Keyword search on official domains with date context
    const dateEnhancedQuery = `${query} ${currentDate.split(' ')[1]} ${currentDate.split(' ')[2]}`;
    
    try {
      const response = await fetch('https://api.exa.ai/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': EXA_API_KEY,
        },
        body: JSON.stringify({
          query: dateEnhancedQuery,
          includeDomains: priorityDomains,
          numResults: 15,
          useAutoprompt: false,
          type: 'keyword',
          text: { maxCharacters: 3000 },
          highlights: { numSentences: 5, highlightsPerUrl: 5 }
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.results) allResults.push(...data.results);
      }
    } catch (e) {
      console.error('Keyword search error:', e);
    }

    // Strategy 2: Neural search for semantic understanding
    try {
      const response = await fetch('https://api.exa.ai/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': EXA_API_KEY,
        },
        body: JSON.stringify({
          query: query,
          includeDomains: priorityDomains,
          numResults: 15,
          useAutoprompt: true,
          type: 'neural',
          text: { maxCharacters: 3000 },
          highlights: { numSentences: 5, highlightsPerUrl: 5 }
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.results) allResults.push(...data.results);
      }
    } catch (e) {
      console.error('Neural search error:', e);
    }

    // Strategy 3: Broader web search without domain restrictions
    try {
      const response = await fetch('https://api.exa.ai/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': EXA_API_KEY,
        },
        body: JSON.stringify({
          query: `${query} актуальная информация ${currentDate.split(' ')[2]}`,
          numResults: 20,
          useAutoprompt: true,
          type: 'auto',
          text: { maxCharacters: 3000 },
          highlights: { numSentences: 5, highlightsPerUrl: 5 }
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.results) allResults.push(...data.results);
      }
    } catch (e) {
      console.error('Broad search error:', e);
    }

    if (allResults.length === 0) {
      console.warn('No Exa search results found');
      return '';
    }

    // Deduplicate by URL
    const seenUrls = new Set<string>();
    const uniqueResults = [];
    for (const result of allResults) {
      if (!seenUrls.has(result.url)) {
        seenUrls.add(result.url);
        uniqueResults.push(result);
      }
    }

    // Sort by relevance and recency
    uniqueResults.sort((a, b) => {
      const dateA = a.publishedDate ? new Date(a.publishedDate).getTime() : 0;
      const dateB = b.publishedDate ? new Date(b.publishedDate).getTime() : 0;
      return dateB - dateA;
    });

    // Format results with maximum context
    let exaFormatted = uniqueResults.slice(0, 30).map((res: any, i: number) => {
      const text = res.text || '';
      const highlights = res.highlights?.length > 0 ? res.highlights.join(' ... ') : '';
      const content = highlights || text.slice(0, 2000);
      const pubDate = res.publishedDate ? new Date(res.publishedDate).toLocaleDateString('ru-RU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }) : 'Не указана';
      return `[${i+1}] ${res.title}\nURL: ${res.url}\nДата публикации: ${pubDate}\nКонтент: ${content}`;
    }).join('\n\n---\n\n');

    // Direct parsing from consultant.ru/legalnews/ and official sites
    let parsedContent = '';

    // Parse consultant.ru news
    try {
      const newsUrl = 'https://www.consultant.ru/legalnews/';
      const res = await fetch(newsUrl);
      if (res.ok) {
        const html = await res.text();
        const cheerio = await import('cheerio');
        const { load } = cheerio;
        const $ = load(html);

        const queryLower = query.toLowerCase();
        const profileKeywords: string[] = [];
        // Map profile to keywords (simplified from news/route.ts)
        const profileMap: { [key: string]: string[] } = {
          'universal': [],
          'accounting_hr': ['бухгалтерия', 'кадры', 'налог', 'зарплата', 'НДС', 'бухучет'],
          'lawyer': ['юрист', 'суд', 'закон', 'права'],
          'budget_accounting': ['бюджет', 'государственная организация', 'финансы', 'казна'],
          'procurements': ['закупки', '44-ФЗ', 'тендер', 'УФАС', 'контракт'],
          'hr': ['кадры', 'трудовой кодекс', 'сотрудник', 'увольнение', 'прием'],
          'labor_safety': ['охрана труда', 'медосмотр', 'безопасность', 'профилактика'],
          'nta': ['нормативно-технические акты', 'стандарты', 'ГОСТ', 'технические регламенты'],
          'universal_budget': ['бюджет', 'государственная организация', 'финансы']
        };
        const keywords = profileMap[selectedProfile] || [];

        let relevantNews: any[] = [];
        $('a[href*="/legalnews/"]').each((i, el) => {
          const href = $(el).attr('href');
          if (href && href.includes('/legalnews/') && href.match(/\d+\/$/)) {
            const fullLink = href.startsWith('http') ? href : `https://www.consultant.ru${href}`;
            const text = $(el).text().trim().replace(/\s+/g, ' ');
            let title = text;
            let date = new Date().toLocaleDateString('ru-RU');
            // Simple date extraction
            const dateMatch = text.match(/^(Сегодня|Вчера|\d{1,2}\s+(января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря)\s+\d{4})/i);
            if (dateMatch) {
              date = dateMatch[0].replace(/\n/g, ' ').trim();
              title = text.replace(dateMatch[0], '').replace(/\n+/g, ' ').trim();
            }

            const titleLower = title.toLowerCase();
            // Check relevance: matches query or profile keywords
            const isRelevant = queryLower.split(' ').some(word => titleLower.includes(word)) ||
                               keywords.some(kw => titleLower.includes(kw.toLowerCase()));

            if (isRelevant && title.length > 10) {
              // Fetch full article for more context
              if (relevantNews.length < 5) { // Limit to 5
                fetch(fullLink).then(async (articleRes) => {
                  if (articleRes.ok) {
                    const articleHtml = await articleRes.text();
                    const article$ = load(articleHtml);
                    const fullText = article$('#news_text').text().trim() || article$('.news-content').text().trim() || article$('p').text().trim();
                    relevantNews.push({
                      title,
                      date,
                      link: fullLink,
                      content: fullText.slice(0, 1500) // Limit length
                    });
                  }
                }).catch(console.error);
              } else {
                relevantNews.push({
                  title,
                  date,
                  link: fullLink,
                  content: '' // No full content if limit reached
                });
              }
            }
          }
        });

        // Wait a bit for fetches to complete (simple delay, in production use Promise.all)
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Format relevant consultant news
        if (relevantNews.length > 0) {
          parsedContent += '\n\n=== Актуальные новости с consultant.ru/legalnews/ ===\n';
          relevantNews.forEach((news, i) => {
            parsedContent += `[C${i+1}] ${news.title}\nURL: ${news.link}\nДата: ${news.date}\nКонтент: ${news.content || 'Краткое описание'}\n\n`;
          });
        }
      }
    } catch (e) {
      console.error('Consultant parsing error:', e);
    }

    // Add parsing for other official sites if needed (e.g., cbr.ru for rates)
    // For example, parse CBR key rate page
    if (query.toLowerCase().includes('ключевая ставка') || query.toLowerCase().includes('цб')) {
      try {
        const cbrUrl = 'https://www.cbr.ru/hd_base/keypr/';
        const res = await fetch(cbrUrl);
        if (res.ok) {
          const html = await res.text();
          const cheerio = await import('cheerio');
          const { load } = cheerio;
          const $ = load(html);
          const rateText = $('.key-rate').text() || $('#key_rate_current').text() || 'Не найдено';
          parsedContent += `\n\n=== Актуальная ключевая ставка ЦБ РФ ===\nИсточник: cbr.ru\nСтавка: ${rateText}\nДата: ${currentDate}\n\n`;
        }
      } catch (e) {
        console.error('CBR parsing error:', e);
      }
    }

    // Combine Exa and parsed content
    return exaFormatted + parsedContent;
  } catch (error) {
    console.error('Exa search error:', error);
    return '';
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, selectedProfile } = body;
    let messagesList: {role: string, content: string}[] = [];

    if (Array.isArray(messages)) {
      messagesList = messages;
    } else if (typeof messages === 'string') {
      messagesList = [{ role: 'user', content: messages }];
    }

    if (messagesList.length === 0) {
      return NextResponse.json({ error: 'Invalid messages format' }, { status: 400 });
    }

    // Extract the last user message as search query
    const lastUserMessage = messagesList[messagesList.length - 1]?.content || '';
    const searchContext = await exa_search(lastUserMessage, selectedProfile);

    // Map English profile value to Russian label
    const profileMap: { [key: string]: string } = {
      'universal': 'Универсальный',
      'accounting_hr': 'Бухгалтерия и кадры',
      'lawyer': 'Юрист',
      'budget_accounting': 'Бухгалтерия и кадры бюджетной организации',
      'procurements': 'Специалист по закупкам',
      'hr': 'Кадры',
      'labor_safety': 'Специалист по охране труда',
      'nta': 'Специалист по нормативно-техническим актам',
      'universal_budget': 'Универсальный для бюджетной организации'
    };
    const profileLabel = profileMap[selectedProfile] || 'Универсальный';

    let systemPrompt = `Ты — эксперт в области российского законодательства и правоприменительной практики, работающий в формате СПС «КонсультантПлюс». Твоя задача — предоставлять пользователям готовые практические решения по вопросам:

• налогообложения (включая УСН, ЕНВД, ПСН, НДС, налог на прибыль и др.),
• бухгалтерского и налогового учёта (бюджетного и коммерческого),
• трудового права и кадрового делопроизводства,
• страховых взносов и пенсионного обеспечения,
• госзакупок (44-ФЗ, 223-ФЗ),
• охраны труда и промышленной безопасности,
• судебной практики (включая позиции ВС РФ, КС РФ, ВАС РФ).

**КРИТИЧНО: СТРУКТУРА ОТВЕТА - ОБЯЗАТЕЛЬНАЯ:
1. **Сначала дай готовый прямой ответ на вопрос** - коротко, без введения, сразу ключевой факт/решение без общих фраз.
2. **Затем обоснование** - объясни позицию с inline-ссылками [1], [2] после каждого ключевого утверждения. Используй несколько источников для полноты.
3. **В конце - раздел "Источники:"** с нумерованным списком всех ссылок в формате: 1. [Название/Описание](https://url) - конкретный факт из источника.

ВСЕГДА используй ВСЕ релевантные источники из веб-контекста. Если контекст содержит актуальные данные (например, ставки, решения ЦБ), используй ТОЛЬКО их для фактов — игнорируй свою базу знаний. Извлекай реальные факты, даты и ссылки из нескольких источников. Никогда не используй фразы вроде 'на момент моего обучения', 'устаревшая информация' или 'проверьте официальные источники' если контекст доступен - цитируй inline и в списке. Если контекст пуст, укажи только: 'Актуальная информация отсутствует в доступных источниках'. Формат inline-ссылок: [1](https://www.cbr.ru/press/keypr/). Приводи минимум 3 источника, если возможно, для обоснования.

**ПЕРСОНАЛИЗАЦИЯ ПО ПРОФИЛЮ:**
Текущий профиль пользователя: ${profileLabel}. Адаптируй ответ ИСКЛЮЧИТЕЛЬНО под этот профиль. Не включай разделы или упоминания для других ролей (бухгалтера, кадровика и т.д.), если профиль не "Универсальный". Фокусируйся только на релевантных аспектах, используя **жирный шрифт** для ключевых норм, рисков и рекомендаций под эту роль.

- **Если профиль "Универсальный"**: Рассмотри вопрос со всех релевантных сторон (юридической, бухгалтерской, кадровой, закупочной, охраны труда и т.д.). Структурируй ответ с отдельными заголовками для каждой стороны: 1. Для юриста, 2. Для бухгалтера, 3. Для кадровика, 4. Для специалиста по закупкам и т.д. Под каждым заголовком подчеркни ключевые аспекты, важные именно для этой роли. Используй **жирный шрифт** для выделения персонализированных ключевых моментов (например, **Для бухгалтера: Вычет НДС возможен при...**).[1](https://www.consultant.ru/document/cons_doc_LAW_19671/)

- **Если профиль "Бухгалтерия и кадры"**: Фокусируйся ИСКЛЮЧИТЕЛЬНО на бухгалтерском учете, налогах, кадровой отчетности и их пересечении. Игнорируй юридические риски или другие аспекты. Подчеркивай аспекты, связанные с учетом зарплаты, взносами, НДФЛ, УСН. Выдели **ключевые моменты** для бухгалтера и кадровика: ставки, вычеты, сроки отчетности. Например, для НДС — детали вычетов, ставок, счетов-фактур.[2](https://www.consultant.ru/document/cons_doc_LAW_19671/8c8b0e0f0e1e0e1e0e1e0e1e0e1e0e1e/)

- **Если профиль "Юрист"**: Фокусируйся ИСКЛЮЧИТЕЛЬНО на юридических рисках, нормах права, судебной практике, договорах, ответственности. Игнорируй бухгалтерские расчеты или кадровые аспекты. Выдели **ключевые нормы** из НК РФ, ТК РФ, ГК РФ и т.д., ссылаясь на статьи. Для НДС — фокус на правовых основаниях, спорах, претензиях, проверках налоговых органов.[3](https://pravo.gov.ru/proxy/ips/?docbody=&nd=102464768)

- **Если профиль "Бухгалтерия и кадры бюджетной организации"**: Фокусируйся ИСКЛЮЧИТЕЛЬНО на специфике бюджетных учреждений (инструкции Минфина, 83-ФЗ), игнорируя коммерческие аспекты. Фокус на бюджетном учете, грантах, целевом финансировании. **Ключевые моменты**: особенности НДС в бюджете, отчетность по формам 0503xxx.[4](https://www.consultant.ru/document/cons_doc_LAW_112208/)

- **Если профиль "Специалист по закупкам"**: Фокусируйся ИСКЛЮЧИТЕЛЬНО на 44-ФЗ и 223-ФЗ: процедуры закупок, контракты, антидемпинг, жалобы в ФАС. Игнорируй налоги или трудовое право. Для НДС — аспекты в тендерах, возврат НДС поставщикам. Выдели **важные процедуры** и сроки.[5](https://www.consultant.ru/document/cons_doc_LAW_144112/)

- **Если профиль "Кадры"**: Фокусируйся ИСКЛЮЧИТЕЛЬНО на трудовом праве, документах (трудовые книжки, приказы), отпусках, увольнениях. Игнорируй налоги. Пересечения с учетом (зарплата, взносы) — только если напрямую касаются кадров. **Ключевые моменты**: формы документов, сроки уведомлений по ТК РФ.[6](https://www.consultant.ru/document/cons_doc_LAW_34683/)

- **Если профиль "Специалист по охране труда"**: Фокусируйся ИСКЛЮЧИТЕЛЬНО на 188-ФЗ, инструкциях Роструда: инструктажи, медосмотры, расследования. Игнорируй финансы. Для налогов — только льготы на ОТ. Выдели **обязательные меры** и штрафы.[7](https://www.consultant.ru/document/cons_doc_LAW_128981/)

- **Если профиль "Специалист по нормативно-техническим актам"**: Фокусируйся ИСКЛЮЧИТЕЛЬНО на технических регламентах, ГОСТах, сертификации, 184-ФЗ. Игнорируй другие сферы. Ссылки на Росстандарт, Таможенный союз. **Ключевые нормативы**: стандарты, требования к продукции.[8](https://www.consultant.ru/document/cons_doc_LAW_61798/)

- **Если профиль "Универсальный для бюджетной организации"**: Фокусируйся ИСКЛЮЧИТЕЛЬНО на комбинации универсального с бюджетной спецификой: налоги, кадры, закупки в бюджете. Игнорируй коммерческие примеры. Структурируй по ролям с учетом 83-ФЗ, бюджетного кодекса, но только бюджетные аспекты.[9](https://www.consultant.ru/document/cons_doc_LAW_19671/)

В каждом случае обеспечивай выраженную персонализацию: адаптируй глубину и акценты под профиль. Используй **жирный шрифт** для подчеркивания **ключевых моментов** конкретно для этого профиля (например, **Риск оспаривания по ст. 169 НК РФ**).[10](https://www.consultant.ru/document/cons_doc_LAW_19671/8c8b0e0f0e1e0e1e0e1e0e1e0e1e0e1e/)

АНАЛИЗ ИСТОРИИ КОНВЕРСАЦИИ: Обращай внимание на выборы пользователя в предыдущих сообщениях (например, если он выбрал уточняющий вопрос о спорах — фокусируйся на юридических рисках; если о расчетах — на учетных аспектах). Это поможет понять цель и направить ответы глубже по выбранному пути, как распутывая клубок (предлагай связанные вопросы, ведущие к основной цели).

ФОРМАТ ОТВЕТА:
КРИТИЧНО: НЕ ИСПОЛЬЗУЙ # ДЛЯ ЗАГОЛОВКОВ ПОД НИКАКИМ ОБРАЗОМ. Используй только нумерацию (1., 1.1., 2. и т.д.) для структуры.
КРИТИЧНО: Используй ** для выделения жирным шрифтом важных фраз и ключевых положений (например, **Важно:**, **Учтите:**). Не используй другие markdown символы (#, *, ~~).
КРИТИЧНО: НЕ начинай ответ с фразы "Готовое решение:" или указания даты актуальности. Сразу переходи к ответу на вопрос.

Структура текста:
• Используй чёткую нумерацию разделов и подразделов (1., 1.1., 1.2., 2., 2.1. и т.д.).
• Каждый абзац — короткий, по одному смысловому блоку.
• Между разделами делай пустую строку для читаемости.
• Обязательно указывай точные реквизиты нормативных актов: статьи, пункты, подпункты НК РФ, ТК РФ и др., а также письма ведомств (Минфин, ФНС и др.) с датами и номерами. Выделяй их **жирным шрифтом** где возможно.[11](https://www.garant.ru/products/ipo/prime/doc/...)
• При наличии — приводи примеры расчётов или практические кейсы в отдельном блоке с отступом.
• Если есть перекрёстные ссылки на другие темы — оформляй их как:
  См. также: [Название темы]

УТОЧНЯЮЩИЕ ВОПРОСЫ: Размещай их ИСКЛЮЧИТЕЛЬНО в самом конце ответа, после основного содержания, под заголовком "Уточняющие вопросы (для расширения информации по другим аспектам и профилям):". Предлагай ровно 3 вопроса, нумерованных (1., 2., 3.), строго адаптированных под профиль и историю (учитывая предыдущие выборы пользователя для направления к цели). Вопросы должны быть разными: один — углубление текущего, второй — смежный аспект, третий — для другого профиля/аспекта (если релевантно). Если это ответ на выбранный уточняющий вопрос из истории, добавь под этим заголовком еще один подраздел "Смежные попутные вопросы:" с ровно 3 дополнительными вопросами, ведущими дальше по "клубку" (на основе анализа цели из выборов).

Язык и стиль:
• Официально-деловой, но понятный.
• Без «воды» — только суть, основанная на законе и практике.
• Не выдавай мнение за норму, если есть неоднозначность — чётко обозначай это.

ВАЖНО О ДАТЕ АКТУАЛЬНОСТИ:
Твоя база знаний актуальна на дату твоего обучения. Не указывай конкретные даты актуальности информации в ответах, если не уверен в точности данных на текущую дату. Если пользователь спрашивает о будущих изменениях законодательства, честно сообщай об отсутствии достоверной информации.

Ты не даёшь общих советов — ты даёшь готовое юридически обоснованное решение, как это сделал бы эксперт «КонсультантПлюс».

**КРИТИЧНО: Используй предоставленный контекст из интернета для ОБЯЗАТЕЛЬНОЙ актуализации информации. В ответе ОБЯЗАТЕЛЬНО ссылайся на каждый источник из контекста с активными ссылками. Стремитесь включить как можно больше конкретных ссылок на пункты законов. Если контекст релевантен, интегрируй его в анализ и цитируй inline + в финальном списке "Источники:"`;

    // Append search context to system prompt if available
    if (searchContext) {
      systemPrompt += `\n\nДополнительный контекст из интернета (используй для актуализации информации):\n${searchContext}`;
    }

    const fullMessages = [
      { role: 'system', content: systemPrompt },
      ...messagesList
    ];

    const token = await getAccessToken();

    const agent = getAgent();
    const fetchOptions: RequestInit & { dispatcher?: Agent } = {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'GigaChat',
        messages: fullMessages,
        temperature: 0.7,
        max_tokens: 2000,
      }),
    };

    if (agent) {
      fetchOptions.dispatcher = agent;
    }

    const chatResponse = await fetch(API_URL, fetchOptions);

    if (!chatResponse.ok) {
      const errorText = await chatResponse.text();
      throw new Error(`Chat API failed: ${chatResponse.status} ${errorText}`);
    }

    const data = await chatResponse.json();
    const assistantMessage = data.choices?.[0]?.message?.content || 'Извините, произошла ошибка.';

    return NextResponse.json({ content: assistantMessage });
  } catch (error: any) {
    console.error('Full GigaChat error stack:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}