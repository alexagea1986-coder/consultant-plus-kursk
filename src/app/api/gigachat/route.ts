import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import fetch from "node-fetch";

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

    // Real token acquisition per docs
    const tokenBody = new URLSearchParams({ 
      scope: 'GIGACHAT_API_PERS'
    });
    const tokenResponse = await fetch("https://ngw.devices.sberbank.ru:9443/api/v2/oauth", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "application/json",
        "Authorization": `Basic ${clientSecretKey}`,
        "RqUID": randomUUID(),
      },
      body: tokenBody.toString(),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      throw new Error(`Token error: ${tokenResponse.status} - ${errorText}`);
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // System prompt based on profile
    const systemPrompt = `Ты эксперт в области ${selectedProfile}. Отвечай на вопросы пользователя на русском языке, предоставляя точную и полезную информацию. Если возможно, добавь в конце ответа раздел "Уточняющие вопросы" с 2-3 возможными следующими вопросами, нумерованными.`;

    const formattedMessages = [
      { role: "system", content: systemPrompt },
      ...messages.map((msg: any) => ({ role: msg.role, content: msg.content })),
    ];

    // Real chat completion with updated model
    const chatResponse = await fetch("https://gigachat.devices.sberbank.ru/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "RqUID": randomUUID(),
      },
      body: JSON.stringify({
        model: "GigaChat-2",
        messages: formattedMessages,
        stream: false,
        temperature: 0.7,
      }),
    });

    if (!chatResponse.ok) {
      const errorText = await chatResponse.text();
      throw new Error(`Chat error: ${chatResponse.status} - ${errorText}`);
    }

    const chatData = await chatResponse.json();
    const content = chatData.choices[0]?.message?.content || "Нет ответа от модели.";

    return NextResponse.json({ content });
  } catch (error: any) {
    console.error("GigaChat error:", error);
    // Keep fallback for env issues
    return NextResponse.json({
      content: "Извините, произошла ошибка при обращении к модели. Попробуйте позже.",
    }, { status: 500 });
  }
}