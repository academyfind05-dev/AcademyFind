import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const input = searchParams.get('input');

  if (!input || input.trim().length === 0) {
    return NextResponse.json({ predictions: [] });
  }

  const query = input.trim();
  const predictions: any[] = [];
  const seenDescriptions = new Set<string>();

  // 1. Fetch live OpenStreetMap / Nominatim Location Autocomplete (Exact Google Parity for all Indian sectors/cities/areas)
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&countrycodes=in&format=json&addressdetails=1&limit=8`,
      {
        headers: {
          'User-Agent': 'AcademyFindApp/1.0 (contact@academyfind.com)',
          'Accept-Language': 'en-US,en;q=0.9'
        }
      }
    );

    if (res.ok) {
      const osmData = await res.json();
      if (Array.isArray(osmData)) {
        for (const place of osmData) {
          const mainText = place.name || place.address?.suburb || place.address?.city_district || place.address?.city || query;
          
          const secondaryParts = [
            place.address?.city || place.address?.town || place.address?.state_district,
            place.address?.state,
            'India'
          ].filter(Boolean);

          // Unique array values
          const uniqueSecParts = Array.from(new Set(secondaryParts));
          const secondaryText = uniqueSecParts.join(', ');
          const fullDesc = `${mainText}, ${secondaryText}`;

          if (!seenDescriptions.has(fullDesc.toLowerCase())) {
            seenDescriptions.add(fullDesc.toLowerCase());
            predictions.push({
              description: fullDesc,
              place_id: `osm_${place.place_id}`,
              lat: parseFloat(place.lat),
              lng: parseFloat(place.lon),
              structured_formatting: {
                main_text: mainText,
                secondary_text: secondaryText
              }
            });
          }
        }
      }
    }
  } catch (osmError) {
    console.error('OSM location fetch error:', osmError);
  }

  // 2. Query Database Cities (e.g. Delhi, Noida, Kota, Mumbai, Bangalore, Jaipur)
  try {
    const dbCities = await prisma.city.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { state: { contains: query, mode: 'insensitive' } }
        ]
      },
      take: 5
    });

    for (const c of dbCities) {
      const mainText = c.name;
      const secondaryText = `${c.state || 'India'}`;
      const fullDesc = `${mainText}, ${secondaryText}`;

      if (!seenDescriptions.has(fullDesc.toLowerCase())) {
        seenDescriptions.add(fullDesc.toLowerCase());
        predictions.push({
          description: fullDesc,
          place_id: `city_${c.id}`,
          lat: c.latitude || 28.6139,
          lng: c.longitude || 77.2090,
          structured_formatting: {
            main_text: mainText,
            secondary_text: secondaryText
          }
        });
      }
    }
  } catch (dbErr) {
    console.error('DB city fetch error:', dbErr);
  }

  // 3. Query Institute Addresses (e.g. Rohini Sector 13, Janakpuri, Lajpat Nagar)
  try {
    const dbInstitutes = await prisma.institute.findMany({
      where: {
        address: { contains: query, mode: 'insensitive' },
        isActive: true
      },
      take: 6,
      select: {
        id: true,
        name: true,
        address: true,
        latitude: true,
        longitude: true,
        city: { select: { name: true, state: true } }
      }
    });

    for (const inst of dbInstitutes) {
      const parts = inst.address.split(',').map(p => p.trim()).filter(Boolean);
      const mainArea = parts.find(p => p.toLowerCase().includes(query.toLowerCase())) || parts[0];
      const cityName = inst.city?.name || 'Delhi';
      const stateName = inst.city?.state || 'India';
      const fullDesc = `${mainArea}, ${cityName}, ${stateName}`;

      if (!seenDescriptions.has(fullDesc.toLowerCase())) {
        seenDescriptions.add(fullDesc.toLowerCase());
        predictions.push({
          description: fullDesc,
          place_id: `inst_${inst.id}`,
          lat: inst.latitude || 28.6139,
          lng: inst.longitude || 77.2090,
          structured_formatting: {
            main_text: mainArea,
            secondary_text: `${cityName}, ${stateName}`
          }
        });
      }
    }
  } catch (instErr) {
    console.error('DB institute location fetch error:', instErr);
  }

  return NextResponse.json({ predictions });
}
