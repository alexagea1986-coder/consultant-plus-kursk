import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

const GIGACHAT_SCOPE = process.env.GIGACHAT_SCOPE || 'GIGACHAT_API_PERS';
const GIGACHAT_AUTH_KEY = process.env.GIGACHAT_AUTH_KEY || '';

async function getGigaChatToken() {
  const rqUID = uuidv4();
  const response = await fetch('https://ngw.devices.sberbank.ru:9443/api/v2/oauth', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json',
      'RqUID': rqUID,
      'Authorization': `Basic ${GIGACHAT_AUTH_KEY}`,
    },
    body: `scope=${GIGACHAT_SCOPE}`,
  });

  if (!response.ok) {
    throw new Error(`Failed to get GigaChat token: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.access_token; // Assuming the response has access_token
}

async function callGigaChat(messages: Array<{role: string; content: string}>, token: string) {
  const response = await fetch('https://gigachat.devices.sberbank.ru/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'GigaChat-2-Pro',
      messages,
      temperature: 0.7,
      max_tokens: 1000,
    }),
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`GigaChat API error: ${response.status} ${errorData}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, profile, history = [] } = body;

    if (!message || !profile) {
      return NextResponse.json({ error: 'Message and profile are required' }, { status: 400 });
    }

    // System prompt based on profile
    let systemPrompt = '';
    const profileMap: Record<string, string> = {
      'universal': 'You are a universal AI assistant for Consultant.ru. Provide clear, accurate, and helpful responses on legal, business, and professional topics. Do not reveal your name or that you are GigaChat.',
      'accounting': 'You are an expert in accounting and HR for Consultant.ru. Provide detailed, step-by-step explanations with examples, sources, and variants for specific questions. For broad questions, give general overviews until clarification.',
      'lawyer': 'You are a legal expert for Consultant.ru. Provide detailed, step-by-step explanations with examples, sources, and variants for specific legal questions. For broad questions, give general overviews until clarification.',
      // Add more profiles as needed: 'budget_accounting', 'procurement', 'hr', 'labor_safety', 'standards', etc.
    };

    systemPrompt = profileMap[profile.toLowerCase()] || profileMap['universal'];

    // Format messages for GigaChat
    const formattedMessages = [
      { role: 'system', content: systemPrompt },
      ...history.map((msg: { role: string; content: string }) => ({ role: msg.role, content: msg.content })),
      { role: 'user', content: message },
    ];

    const token = await getGigaChatToken();
    const response = await callGigaChat(formattedMessages, token);

    return NextResponse.json({ response });
  } catch (error) {
    console.error('GigaChat API error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}