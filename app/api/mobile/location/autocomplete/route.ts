import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const input = searchParams.get('input');

  if (!input || input.trim().length === 0) {
    return NextResponse.json({ predictions: [] });
  }

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY || 'AIzaSyCJVo2m1ic_xT4BLDELw6h63mOjO9PqquE';

  try {
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&key=${apiKey}&language=en&components=country:in`,
      {
        headers: {
          'Referer': 'https://academyfind.com/',
        },
      }
    );
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Location autocomplete error:', error);
    return NextResponse.json({ predictions: [], error: error.message }, { status: 500 });
  }
}
