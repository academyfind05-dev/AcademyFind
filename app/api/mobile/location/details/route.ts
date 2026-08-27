import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const placeId = searchParams.get('place_id');

  if (!placeId) {
    return NextResponse.json({ error: 'place_id is required' }, { status: 400 });
  }

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY

  try {
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(placeId)}&fields=geometry,formatted_address,name&key=${apiKey}`,
      {
        headers: {
          'Referer': 'https://academyfind.com/',
        },
      }
    );
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Location details error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
