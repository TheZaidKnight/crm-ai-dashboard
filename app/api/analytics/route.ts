import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:5001';

export async function POST(request: Request) {
  // Verify authentication
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();

    const response = await fetch(`${AI_SERVICE_URL}/api/forecast`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorBody.error || 'AI service error' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Analytics proxy error:', error);

    // If the AI service is unreachable, return mock data for demo purposes
    const body = await request
      .clone()
      .json()
      .catch(() => ({ data: [], periods: 6 }));
    const periods = body.periods || 6;
    const lastValue = body.data?.[body.data.length - 1] ?? 30000;

    const mockForecast = Array.from({ length: periods }, (_, i) => {
      const trend = lastValue * (1 + 0.03 * (i + 1));
      const noise = trend * (0.98 + Math.random() * 0.04);
      return Math.round(noise);
    });

    return NextResponse.json({
      historical: body.data ?? [],
      forecast: mockForecast,
      periods,
      model_summary:
        'Mock forecast (AI service unavailable). Start the Flask service with: cd ai-service && python app.py',
    });
  }
}
