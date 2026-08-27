import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const placeId = searchParams.get('place_id');

  if (!placeId) {
    return NextResponse.json({ error: 'place_id is required' }, { status: 400 });
  }

  // 0. Handle OSM place_id if passed
  if (placeId.startsWith('osm_')) {
    return NextResponse.json({
      result: {
        formatted_address: searchParams.get('address') || 'Selected Location',
        geometry: {
          location: {
            lat: parseFloat(searchParams.get('lat') || '28.6139'),
            lng: parseFloat(searchParams.get('lng') || '77.2090')
          }
        }
      }
    });
  }

  // 1. Handle DB City place_id
  if (placeId.startsWith('city_')) {
    const cityId = placeId.replace('city_', '');
    const city = await prisma.city.findUnique({ where: { id: cityId } });
    if (city) {
      return NextResponse.json({
        result: {
          formatted_address: `${city.name}, ${city.state || 'India'}`,
          geometry: {
            location: {
              lat: city.latitude || 28.6139,
              lng: city.longitude || 77.2090
            }
          }
        }
      });
    }
  }

  // 2. Handle DB Institute location place_id
  if (placeId.startsWith('inst_')) {
    const instId = placeId.replace('inst_', '');
    const inst = await prisma.institute.findUnique({
      where: { id: instId },
      include: { city: true }
    });
    if (inst) {
      return NextResponse.json({
        result: {
          formatted_address: inst.address,
          geometry: {
            location: {
              lat: inst.latitude || 28.6139,
              lng: inst.longitude || 77.2090
            }
          }
        }
      });
    }
  }

  // 3. Google Place Details API call
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY || 'AIzaSyCJVo2m1ic_xT4BLDELw6h63mOjO9PqquE';

  try {
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(placeId)}&fields=geometry,formatted_address,name&key=${apiKey}`
    );
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Location details error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
