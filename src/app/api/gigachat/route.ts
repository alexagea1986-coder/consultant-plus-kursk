import { NextRequest, NextResponse } from "next/server";
import Exa from "exa-js";
import { GigaChat } from 'gigachat-node';
import crypto from "crypto";
import https from "node:https";

const httpsAgent = new https.Agent({
  rejectUnauthorized: false
});

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

    const client = new GigaChat({
      clientSecretKey: process.env.GIGACHAT_CLIENT_SECRET!,
      isIgnoreTSL: true,
      isPersonal: true,
      autoRefreshToken: true
    });

    await client.createToken();

    // Proceed with GigaChat call using the library
    const completion = await client.chat.completions.create({
      model: "GigaChat-2-Pro",
      messages,
      stream: false,
    });

    const content = completion.choices[0]?.message?.content || "No response from GigaChat";

    // If search was used, ensure sources are mentioned
    const finalContent = needsSearch ? `${content}\n\nИсточники:\n${context}` : content;

    return NextResponse.json({ content: finalContent });
  } catch (error) {
    console.error("GigaChat/Exa error:", error);
    return NextResponse.json({ content: "Извините, произошла ошибка. Попробуйте позже." }, { status: 500 });
  }
}