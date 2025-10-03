import { NextResponse } from 'next/server'
import Parser from 'rss-parser'
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

// Cache for 10 minutes
let newsCache: { [key: string]: { data: any[]; timestamp: number } } = {}
const CACHE_DURATION = 10 * 60 * 1000 // 10 minutes

const parser = new Parser({
  customFields: {
    item: []
  }
})

async function scrapeNews(scopes = 'universal'): Promise<any[]> {
  const browser = await puppeteer.use(StealthPlugin()).launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.goto('https://www.consultant.ru/legalnews/', { waitUntil: 'networkidle2' });

  // Default to universal/all news; for profiles, simulate checkbox if selectors found (from search: e.g., input[name='profile'][value='jurist'])
  if (scopes !== 'universal') {
    // Example for jurist: await page.click('label:has-text("Юрист")'); await page.waitForTimeout(3000);
    // Add per-scope logic based on exact selectors
  }

  // Parse 5 news items (adjust selectors from page inspection: titles in h3/a, dates in .date, desc in .preview)
  const news = await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('.news-list li, .legalnews-item, article')) // Common selectors from structure
      .slice(0, 5)
      .map(el => {
        const titleEl = el.querySelector('h3 a, .title a, a');
        const dateEl = el.querySelector('.date, time');
        const descEl = el.querySelector('.description, .preview p');
        const linkEl = el.querySelector('a');
        return {
          title: titleEl?.textContent?.trim() || '',
          date: dateEl?.textContent?.trim() || new Date().toLocaleDateString('ru-RU'),
          description: descEl?.textContent?.trim() || '',
          link: linkEl?.href || ''
        };
      });
    return items.filter(item => item.title);
  });

  await browser.close();
  return news;
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const scopes = url.searchParams.get('scopes') || 'universal';
    const cacheKey = `legalnews_${scopes}`;
    
    if (newsCache[cacheKey] && (Date.now() - newsCache[cacheKey].timestamp) < CACHE_DURATION) {
      return NextResponse.json({ news: newsCache[cacheKey].data });
    }

    const news = await scrapeNews(scopes);
    newsCache[cacheKey] = { data: news, timestamp: Date.now() };
    return NextResponse.json({ news });
  } catch (err: unknown) {
    console.error('API Error:', err)
    return NextResponse.json({ news: [], error: 'Не удалось загрузить новости' }, { status: 500 })
  }
}