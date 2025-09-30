import { NextRequest, NextResponse } from "next/server";
import Exa from "exa-js";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    const { messages, selectedProfile } = await request.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Invalid messages format" }, { status: 400 });
    }

    // Get the latest user message for search detection
    const latestUserMessage = messages[messages.length - 1].content;
    const needsSearch = /today|current|recent|2025|update|news/i.test(latestUserMessage);
    
    let context = "";
    if (needsSearch) {
      const exa = new Exa(process.env.EXA_API_KEY!);
      const searchResults = await exa.search(latestUserMessage, {
        numResults: 5,
        useAutoprompt: true,
        type: "ai",
      });
      
      context = searchResults.results.map((r: any) => 
        `- ${r.title}: ${r.snippet} (Source: ${r.url})`
      ).join("\n");
      
      // Append context to the last user message in the conversation
      messages[messages.length - 1].content = `${latestUserMessage}\n\nКонтекст из веб-поиска:\n${context}`;
    }

    // Generate UUID for RqUID
    const rqUID = crypto.randomUUID();

    // Get access token from GigaChat OAuth
    const tokenResponse = await fetch("https://ngw.devices.sberbank.ru:9443/api/v2/oauth", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "application/json",
        "RqUID": rqUID,
        "Authorization": `Basic ${process.env.GIGACHAT_API_KEY}`,
      },
      body: "scope=GIGACHAT_API_PERS",
    });

    if (!tokenResponse.ok) {
      throw new Error(`Token request failed: ${tokenResponse.status}`);
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    if (!accessToken) {
      throw new Error("No access token received");
    }

    // Proceed with GigaChat call using the access token
    const gigachatResponse = await fetch("https://gigachat.devices.sberbank.ru/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "RqUID": rqUID,
      },
      body: JSON.stringify({
        model: "GigaChat", // Default model; can adapt based on selectedProfile if needed
        messages,
        stream: false,
      }),
    });

    if (!gigachatResponse.ok) {
      throw new Error(`GigaChat API error: ${gigachatResponse.status}`);
    }

    const data = await gigachatResponse.json();
    const content = data.choices[0]?.message?.content || "No response from GigaChat";

    // If search was used, ensure sources are mentioned
    const finalContent = needsSearch ? `${content}\n\nИсточники:\n${context}` : content;

    return NextResponse.json({ content: finalContent });
  } catch (error) {
    console.error("GigaChat/Exa error:", error);
    return NextResponse.json({ content: "Извините, произошла ошибка. Попробуйте позже." }, { status: 500 });
  }
}