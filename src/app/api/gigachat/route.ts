import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";

export async function POST(request: NextRequest) {
  try {
    const { messages, selectedProfile } = await request.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Invalid messages format" }, { status: 400 });
    }

    const clientId = process.env.GIGACHAT_CLIENT_ID;
    const clientSecret = process.env.GIGACHAT_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return NextResponse.json({ content: "Конфигурация API не настроена." }, { status: 500 });
    }

    const clientSecretKey = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

    // Get token manually
    const tokenResponse = await fetch("https://ngw.devices.sberbank.ru:9443/api/v2/oauth", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "application/json",
        "RqUID": randomUUID(),
        "Authorization": `Basic ${clientSecretKey}`,
      },
      body: new URLSearchParams({
        scope: "GIGACHAT_API_PERS"  // or GIGACHAT_API_CORP if corporate
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("Token error:", tokenResponse.status, errorText);
      return NextResponse.json({ 
        content: "Ошибка авторизации. Проверьте credentials.", 
        error: errorText 
      }, { status: 500 });
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    if (!accessToken) {
      return NextResponse.json({ content: "Не удалось получить токен." }, { status: 500 });
    }

    // System prompt based on profile
    const systemPrompt = `Ты эксперт в области ${selectedProfile}. Отвечай на вопросы пользователя на русском языке, предоставляя точную и полезную информацию. Если возможно, добавь в конце ответа раздел "Уточняющие вопросы" с 2-3 возможными следующими вопросами, нумерованными.`;

    const formattedMessages = [
      { role: "system", content: systemPrompt },
      ...messages.map((msg: any) => ({ role: msg.role, content: msg.content })),
    ];

    // Chat completion
    const chatResponse = await fetch("https://gigachat.devices.sberbank.ru/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "GigaChat-2",
        messages: formattedMessages,
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!chatResponse.ok) {
      const errorText = await chatResponse.text();
      console.error("Chat error:", chatResponse.status, errorText);
      return NextResponse.json({ 
        content: "Ошибка при генерации ответа.", 
        error: errorText 
      }, { status: 500 });
    }

    const chatData = await chatResponse.json();
    const content = chatData.choices[0]?.message?.content || "Не удалось получить ответ от модели.";

    return NextResponse.json({ content });
  } catch (error: any) {
    console.error("GigaChat error:", error);
    return NextResponse.json({
      content: "Извините, произошла ошибка при обращении к модели. Попробуйте позже.",
      error: error.message || JSON.stringify(error),
    }, { status: 500 });
  }
}