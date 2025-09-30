import { NextRequest, NextResponse } from "next/server";
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

    // Get token
    const credentials = Buffer.from(
      `${process.env.GIGACHAT_CLIENT_ID}:${process.env.GIGACHAT_CLIENT_SECRET}`
    ).toString("base64");

    const tokenResponse = await fetch("https://ngw.devices.sberbank.ru:9443/api/v2/oauth", {
      method: "POST",
      headers: {
        "Authorization": `Basic ${credentials}`,
        "Accept": "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        scope: "gigaChat-api"
      }).toString(),
      agent: httpsAgent,
      dispatcher: httpsAgent  // For compatibility
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("Token error:", tokenResponse.status, errorText);
      throw new Error(`Token request failed: ${tokenResponse.status} - ${errorText}`);
    }

    const { access_token } = await tokenResponse.json();

    // Chat completion
    const completionResponse = await fetch("https://gigachat.devices.sber.ru/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "GigaChat-2-Pro",
        messages,
        stream: false,
      }),
      agent: httpsAgent,
      dispatcher: httpsAgent
    });

    if (!completionResponse.ok) {
      const errorText = await completionResponse.text();
      console.error("Completion error:", completionResponse.status, errorText);
      throw new Error(`Completion failed: ${completionResponse.status} - ${errorText}`);
    }

    const completion = await completionResponse.json();
    const content = completion.choices[0]?.message?.content || "No response from GigaChat";

    return NextResponse.json({ content });
  } catch (error) {
    console.error("GigaChat error:", error);
    return NextResponse.json({ content: error.message }, { status: 500 });
  }
}