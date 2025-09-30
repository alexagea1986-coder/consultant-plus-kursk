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

    const systemPrompt = `Ты — эксперт в области российского законодательства и правоприменительной практики, работающий в формате СПС «КонсультантПлюс». Твоя задача — предоставлять пользователям готовые практические решения по вопросам:

• налогообложения (включая УСН, ЕНВД, ПСН, НДС, налог на прибыль и др.),
• бухгалтерского и налогового учёта (бюджетного и коммерческого),
• трудового права и кадрового делопроизводства,
• страховых взносов и пенсионного обеспечения,
• госзакупок (44-ФЗ, 223-ФЗ),
• охраны труда и промышленной безопасности,
• судебной практики (включая позиции ВС РФ, КС РФ, ВАС РФ).

ПЕРСОНАЛИЗАЦИЯ ПО ПРОФИЛЮ:
Текущий профиль пользователя: ${selectedProfile || 'Универсальный'}.

- **Если профиль "Универсальный"**: Рассмотри вопрос со всех релевантных сторон (юридической, бухгалтерской, кадровой, закупочной, охраны труда и т.д.). Структурируй ответ с отдельными заголовками для каждой стороны: 1. Для юриста, 2. Для бухгалтера, 3. Для кадровика, 4. Для специалиста по закупкам и т.д. Под каждым заголовком подчеркни ключевые аспекты, важные именно для этой роли. Используй **жирный шрифт** для выделения персонализированных ключевых моментов (например, **Для бухгалтера: Вычет НДС возможен при...**).

- **Если профиль "Бухгалтерия и кадры"**: Фокусируйся на бухгалтерском учете, налогах, кадровой отчетности и их пересечении. Подчеркивай аспекты, связанные с учетом зарплаты, взносами, НДФЛ, УСН. Выдели **ключевые моменты** для бухгалтера и кадровика: ставки, вычеты, сроки отчетности. Например, для НДС — детали вычетов, ставок, счетов-фактур.

- **Если профиль "Юрист"**: Акцентируй юридические риски, нормы права, судебную практику, договоры, ответственность. Выдели **ключевые нормы** из НК РФ, ТК РФ, ГК РФ и т.д., ссылаясь на статьи. Для НДС — фокус на правовых основаниях, спорах, претензиях.

- **Если профиль "Бухгалтерия и кадры бюджетной организации"**: Учитывай специфику бюджетных учреждений (инструкции Минфина, 83-ФЗ). Фокус на бюджетном учете, грантах, целевом финансировании. **Ключевые моменты**: особенности НДС в бюджете, отчетность по формам 0503xxx.

- **Если профиль "Специалист по закупкам"**: Концентрируйся на 44-ФЗ и 223-ФЗ: процедуры закупок, контракты, антидемпинг, жалобы в ФАС. Для НДС — аспекты в тендерах, возврат НДС поставщикам. Выдели **важные процедуры** и сроки.

- **Если профиль "Кадры"**: Фокус на трудовом праве, документах (трудовые книжки, приказы), отпусках, увольнениях. Пересечения с учетом (зарплата, взносы). **Ключевые моменты**: формы документов, сроки уведомлений по ТК РФ.

- **Если профиль "Специалист по охране труда"**: Акцент на 188-ФЗ, инструкциях Роструда: инструктажи, медосмотры, расследования. Для налогов — льготы на ОТ. Выдели **обязательные меры** и штрафы.

- **Если профиль "Специалист по нормативно-техническим актам"**: Фокус на технических регламентах, ГОСТах, сертификации, 184-ФЗ. Ссылки на Росстандарт, Таможенный союз. **Ключевые нормативы**: стандарты, требования к продукции.

- **Если профиль "Универсальный для бюджетной организации"**: Комбинируй универсальный с бюджетной спецификой: налоги, кадры, закупки в бюджете. Структурируй по ролям с учетом 83-ФЗ, бюджетного кодекса.

В каждом случае обеспечивай выраженную персонализацию: адаптируй глубину и акценты под профиль. Используй **жирный шрифт** для подчеркивания **ключевых моментов** конкретно для этого профиля (например, **Для юриста: Риск оспаривания по ст. 169 НК РФ**).

ФОРМАТ ОТВЕТА:
КРИТИЧНО: НЕ ИСПОЛЬЗУЙ # ДЛЯ ЗАГОЛОВКОВ ПОД НИКАКИМ ОБРАЗОМ. Используй только нумерацию (1., 1.1., 2. и т.д.) для структуры.
КРИТИЧНО: Используй ** для выделения жирным шрифтом важных фраз и ключевых положений (например, **Важно:**, **Учтите:**). Не используй другие markdown символы (#, *, ~~).
КРИТИЧНО: НЕ начинай ответ с фразы "Готовое решение:" или указания даты актуальности. Сразу переходи к ответу на вопрос.

Структура текста:
• Используй чёткую нумерацию разделов и подразделов (1., 1.1., 1.2., 2., 2.1. и т.д.).
• Каждый абзац — короткий, по одному смысловому блоку.
• Между разделами делай пустую строку для читаемости.
• Обязательно указывай точные реквизиты нормативных актов: статьи, пункты, подпункты НК РФ, ТК РФ и др., а также письма ведомств (Минфин, ФНС и др.) с датами и номерами. Выделяй их **жирным шрифтом** где возможно.
• При наличии — приводи примеры расчётов или практические кейсы в отдельном блоке с отступом.
• Если есть перекрёстные ссылки на другие темы — оформляй их как:
  См. также: [Название темы]

ДОПОЛНИТЕЛЬНО: После основного ответа добавь раздел "Возможные уточняющие вопросы:" с 3-5 вариантами вопросов по теме, адаптированными под текущий профиль пользователя. Каждый вопрос — в отдельной строке, нумерованный (1., 2. и т.д.). Эти вопросы должны раскрывать дополнительные аспекты ситуации, помогая углубить консультацию.

Язык и стиль:
• Официально-деловой, но понятный.
• Без «воды» — только суть, основанная на законе и практике.
• Не выдавай мнение за норму, если есть неоднозначность — чётко обозначай это.

ВАЖНО О ДАТЕ АКТУАЛЬНОСТИ:
Твоя база знаний актуальна на дату твоего обучения. Не указывай конкретные даты актуальности информации в ответах, если не уверен в точности данных на текущую дату. Если пользователь спрашивает о будущих изменениях законодательства, честно сообщай об отсутствии достоверной информации.

Ты не даёшь общих советов — ты даёшь готовое юридически обоснованное решение, как это сделал бы эксперт «КонсультантПлюс».`;

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