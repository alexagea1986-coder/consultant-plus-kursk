import { NextRequest, NextResponse } from "next/server";
import { Exa } from "@exalabs/exa-js";

export async function POST(request: NextRequest) {
  try {
    const { message, profile } = await request.json();

    // Determine if web search is needed (e.g., keywords indicating timeliness)
    const needsSearch = /today|current|recent|2025|update|news/i.test(message);
    
    let context = "";
    if (needsSearch) {
      const exa = new Exa(process.env.EXA_API_KEY!);
      const searchResults = await exa.search(message, {
        numResults: 5,
        useAutoprompt: true,
        type: "ai",
      });
      
      // Extract relevant snippets
      context = searchResults.results.map((r: any) => 
        `- ${r.title}: ${r.snippet} (Source: ${r.url})`
      ).join("\n");
      
      // Add to prompt
      messageWithContext = `${message}\n\nContext from web search:\n${context}`;
    } else {
      messageWithContext = message;
    }

    // Proceed with GigaChat call using messageWithContext
    const gigachatResponse = await fetch("https://gigachat.api.sber.ru/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GIGACHAT_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: profile || "GigaChat",  // Use selected profile
        messages: [{ role: "user", content: messageWithContext }],
        stream: false,
      }),
    });

    const data = await gigachatResponse.json();
    const response = data.choices[0].message.content;

    // If search was used, append sources to response
    const finalResponse = needsSearch ? `${response}\n\nИсточники: ${context}` : response;

    return NextResponse.json({ response: finalResponse });
  } catch (error) {
    console.error("GigaChat/Exa error:", error);
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
  }
}