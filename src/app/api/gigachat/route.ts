import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import fetch from "node-fetch";

export async function POST(request: NextRequest) {
  try {
    const { messages, selectedProfile } = await request.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Invalid messages format" }, { status: 400 });
    }

    // Simulate GigaChat response for sandbox environment (external calls blocked)
    const userMessage = messages[messages.length - 1]?.content || '';
    
    // Simple mock responses based on profile and query
    let mockContent = "GigaChat эксперт отвечает: ";
    
    if (selectedProfile === "Юрист") {
      mockContent += "Согласно законодательству РФ, ваш вопрос требует более детального анализа. Рекомендуем обратиться к КонсультантПлюс для точной информации.";
    } else if (selectedProfile === "Бухгалтерия и кадры") {
      mockContent += "В бухгалтерском учете это регулируется НК РФ. Проверьте актуальные формы отчетности.";
    } else {
      mockContent += "Информация по вашему запросу доступна в профессиональных базах данных. Уточните детали для более точного ответа.";
    }
    
    if (userMessage.toLowerCase().includes('что такое')) {
      mockContent += " Это базовое понятие, объясняемое в справочных материалах. Уточняющие вопросы: 1. Что именно вас интересует? 2. В каком контексте? 3. Нужны ли примеры?";
    } else {
      mockContent += " Подробный ответ требует специализированных источников. Уточняющие вопросы: 1. Дополнительные детали? 2. Актуальные изменения? 3. Практические примеры?";
    }

    return NextResponse.json({ content: mockContent });

  } catch (error: any) {
    console.error("GigaChat error:", error);
    return NextResponse.json({
      content: "Извините, произошла ошибка при обращении к модели. Попробуйте позже.",
    }, { status: 500 });
  }
}