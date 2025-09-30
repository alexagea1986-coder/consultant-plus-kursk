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
• **Важно**: Выделяй ключевые положения жирным шрифтом с помощью ** ** вокруг фраз вроде «Учтите:», «Важно:», «Нельзя…», «Можно…».

Язык и стиль:
• Официально-деловой, но понятный.
• Без «воды» — только суть, основанная на законе и практике.
• Не выдавай мнение за норму, если есть неоднозначность — чётко обозначай это.

ВАЖНО О ДАТЕ АКТУАЛЬНОСТИ:
Твоя база знаний актуальна на дату твоего обучения. Не указывай конкретные даты актуальности информации в ответах, если не уверен в точности данных на текущую дату. Если пользователь спрашивает о будущих изменениях законодательства, честно сообщай об отсутствии достоверной информации.

Ты не даёшь общих советов — ты даёшь готовое юридически обоснованное решение, как это сделал бы эксперт «КонсультантПлюс».

Текущий профиль пользователя: ${selectedProfile || 'Универсальный'}`;

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