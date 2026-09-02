import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Comprehensive dictionary of major Indian cities, districts, and education hubs
const INDIAN_CITIES = [
  { name: 'Meerut', state: 'Uttar Pradesh', lat: 28.9845, lng: 77.7064 },
  { name: 'Noida', state: 'Uttar Pradesh', lat: 28.5355, lng: 77.3910 },
  { name: 'Greater Noida', state: 'Uttar Pradesh', lat: 28.4744, lng: 77.5040 },
  { name: 'Ghaziabad', state: 'Uttar Pradesh', lat: 28.6692, lng: 77.4538 },
  { name: 'Delhi', state: 'Delhi', lat: 28.6139, lng: 77.2090 },
  { name: 'New Delhi', state: 'Delhi', lat: 28.6139, lng: 77.2090 },
  { name: 'Gurugram', state: 'Haryana', lat: 28.4595, lng: 77.0266 },
  { name: 'Faridabad', state: 'Haryana', lat: 28.4089, lng: 77.3178 },
  { name: 'Kota', state: 'Rajasthan', lat: 25.2138, lng: 75.8648 },
  { name: 'Jaipur', state: 'Rajasthan', lat: 26.9124, lng: 75.7873 },
  { name: 'Jodhpur', state: 'Rajasthan', lat: 26.2389, lng: 73.0243 },
  { name: 'Udaipur', state: 'Rajasthan', lat: 24.5854, lng: 73.7125 },
  { name: 'Sikar', state: 'Rajasthan', lat: 27.6094, lng: 75.1399 },
  { name: 'Ajmer', state: 'Rajasthan', lat: 26.4499, lng: 74.6399 },
  { name: 'Bikaner', state: 'Rajasthan', lat: 28.0229, lng: 73.3119 },
  { name: 'Lucknow', state: 'Uttar Pradesh', lat: 26.8467, lng: 80.9462 },
  { name: 'Kanpur', state: 'Uttar Pradesh', lat: 26.4499, lng: 80.3319 },
  { name: 'Agra', state: 'Uttar Pradesh', lat: 27.1767, lng: 78.0081 },
  { name: 'Varanasi', state: 'Uttar Pradesh', lat: 25.3176, lng: 82.9739 },
  { name: 'Prayagraj', state: 'Uttar Pradesh', lat: 25.4358, lng: 81.8463 },
  { name: 'Aligarh', state: 'Uttar Pradesh', lat: 27.8974, lng: 78.0880 },
  { name: 'Bareilly', state: 'Uttar Pradesh', lat: 28.3670, lng: 79.4304 },
  { name: 'Moradabad', state: 'Uttar Pradesh', lat: 28.8386, lng: 78.7733 },
  { name: 'Saharanpur', state: 'Uttar Pradesh', lat: 29.9640, lng: 77.5460 },
  { name: 'Muzaffarnagar', state: 'Uttar Pradesh', lat: 29.4727, lng: 77.7085 },
  { name: 'Gorakhpur', state: 'Uttar Pradesh', lat: 26.7606, lng: 83.3732 },
  { name: 'Mathura', state: 'Uttar Pradesh', lat: 27.4924, lng: 77.6737 },
  { name: 'Ayodhya', state: 'Uttar Pradesh', lat: 26.7922, lng: 82.1998 },
  { name: 'Hapur', state: 'Uttar Pradesh', lat: 28.7306, lng: 77.7759 },
  { name: 'Bulandshahr', state: 'Uttar Pradesh', lat: 28.4069, lng: 77.8498 },
  { name: 'Patna', state: 'Bihar', lat: 25.5941, lng: 85.1376 },
  { name: 'Gaya', state: 'Bihar', lat: 24.7914, lng: 85.0002 },
  { name: 'Muzaffarpur', state: 'Bihar', lat: 26.1209, lng: 85.3647 },
  { name: 'Bhagalpur', state: 'Bihar', lat: 25.2425, lng: 86.9842 },
  { name: 'Darbhanga', state: 'Bihar', lat: 26.1542, lng: 85.8918 },
  { name: 'Ranchi', state: 'Jharkhand', lat: 23.3441, lng: 85.3096 },
  { name: 'Jamshedpur', state: 'Jharkhand', lat: 22.8046, lng: 86.2029 },
  { name: 'Dhanbad', state: 'Jharkhand', lat: 23.7957, lng: 86.4304 },
  { name: 'Bokaro', state: 'Jharkhand', lat: 23.6693, lng: 86.1511 },
  { name: 'Bhopal', state: 'Madhya Pradesh', lat: 23.2599, lng: 77.4126 },
  { name: 'Indore', state: 'Madhya Pradesh', lat: 22.7196, lng: 75.8577 },
  { name: 'Gwalior', state: 'Madhya Pradesh', lat: 26.2183, lng: 78.1828 },
  { name: 'Jabalpur', state: 'Madhya Pradesh', lat: 23.1815, lng: 79.9864 },
  { name: 'Ujjain', state: 'Madhya Pradesh', lat: 23.1765, lng: 75.7885 },
  { name: 'Mumbai', state: 'Maharashtra', lat: 19.0760, lng: 72.8777 },
  { name: 'Pune', state: 'Maharashtra', lat: 18.5204, lng: 73.8567 },
  { name: 'Nagpur', state: 'Maharashtra', lat: 21.1458, lng: 79.0882 },
  { name: 'Thane', state: 'Maharashtra', lat: 19.2183, lng: 72.9781 },
  { name: 'Nashik', state: 'Maharashtra', lat: 19.9975, lng: 73.7898 },
  { name: 'Navi Mumbai', state: 'Maharashtra', lat: 19.0330, lng: 73.0297 },
  { name: 'Aurangabad', state: 'Maharashtra', lat: 19.8762, lng: 75.3433 },
  { name: 'Kolhapur', state: 'Maharashtra', lat: 16.7050, lng: 74.2433 },
  { name: 'Solapur', state: 'Maharashtra', lat: 17.6599, lng: 75.9064 },
  { name: 'Ahmedabad', state: 'Gujarat', lat: 23.0225, lng: 72.5714 },
  { name: 'Surat', state: 'Gujarat', lat: 21.1702, lng: 72.8311 },
  { name: 'Vadodara', state: 'Gujarat', lat: 22.3072, lng: 73.1812 },
  { name: 'Rajkot', state: 'Gujarat', lat: 22.3039, lng: 70.8022 },
  { name: 'Gandhinagar', state: 'Gujarat', lat: 23.2156, lng: 72.6369 },
  { name: 'Bhavnagar', state: 'Gujarat', lat: 21.7645, lng: 72.1519 },
  { name: 'Chandigarh', state: 'Chandigarh', lat: 30.7333, lng: 76.7794 },
  { name: 'Mohali', state: 'Punjab', lat: 30.7046, lng: 76.7179 },
  { name: 'Panchkula', state: 'Haryana', lat: 30.6942, lng: 76.8606 },
  { name: 'Ludhiana', state: 'Punjab', lat: 30.9010, lng: 75.8573 },
  { name: 'Amritsar', state: 'Punjab', lat: 31.6340, lng: 74.8723 },
  { name: 'Jalandhar', state: 'Punjab', lat: 31.3260, lng: 75.5762 },
  { name: 'Patiala', state: 'Punjab', lat: 30.3398, lng: 76.3869 },
  { name: 'Bathinda', state: 'Punjab', lat: 30.2110, lng: 74.9455 },
  { name: 'Dehradun', state: 'Uttarakhand', lat: 30.3165, lng: 78.0322 },
  { name: 'Haridwar', state: 'Uttarakhand', lat: 29.9457, lng: 78.1642 },
  { name: 'Rishikesh', state: 'Uttarakhand', lat: 30.0869, lng: 78.2676 },
  { name: 'Roorkee', state: 'Uttarakhand', lat: 29.8543, lng: 77.8880 },
  { name: 'Haldwani', state: 'Uttarakhand', lat: 29.2183, lng: 79.5130 },
  { name: 'Kolkata', state: 'West Bengal', lat: 22.5726, lng: 88.3639 },
  { name: 'Howrah', state: 'West Bengal', lat: 22.5958, lng: 88.2636 },
  { name: 'Durgapur', state: 'West Bengal', lat: 23.5204, lng: 87.3119 },
  { name: 'Siliguri', state: 'West Bengal', lat: 26.7271, lng: 88.3953 },
  { name: 'Asansol', state: 'West Bengal', lat: 23.6739, lng: 86.9524 },
  { name: 'Bhubaneswar', state: 'Odisha', lat: 20.2961, lng: 85.8245 },
  { name: 'Cuttack', state: 'Odisha', lat: 20.4625, lng: 85.8828 },
  { name: 'Rourkela', state: 'Odisha', lat: 22.2604, lng: 84.8536 },
  { name: 'Hyderabad', state: 'Telangana', lat: 17.3850, lng: 78.4867 },
  { name: 'Warangal', state: 'Telangana', lat: 17.9689, lng: 79.5941 },
  { name: 'Bengaluru', state: 'Karnataka', lat: 12.9716, lng: 77.5946 },
  { name: 'Bangalore', state: 'Karnataka', lat: 12.9716, lng: 77.5946 },
  { name: 'Mysuru', state: 'Karnataka', lat: 12.2958, lng: 76.6394 },
  { name: 'Mangalore', state: 'Karnataka', lat: 12.9141, lng: 74.8560 },
  { name: 'Hubli', state: 'Karnataka', lat: 15.3647, lng: 75.1240 },
  { name: 'Belgaum', state: 'Karnataka', lat: 15.8497, lng: 74.4977 },
  { name: 'Chennai', state: 'Tamil Nadu', lat: 13.0827, lng: 80.2707 },
  { name: 'Coimbatore', state: 'Tamil Nadu', lat: 11.0168, lng: 76.9558 },
  { name: 'Madurai', state: 'Tamil Nadu', lat: 9.9252, lng: 78.1198 },
  { name: 'Tiruchirappalli', state: 'Tamil Nadu', lat: 10.7905, lng: 78.7047 },
  { name: 'Salem', state: 'Tamil Nadu', lat: 11.6643, lng: 78.1460 },
  { name: 'Kochi', state: 'Kerala', lat: 9.9312, lng: 76.2673 },
  { name: 'Thiruvananthapuram', state: 'Kerala', lat: 8.5241, lng: 76.9366 },
  { name: 'Kozhikode', state: 'Kerala', lat: 11.2588, lng: 75.7804 },
  { name: 'Thrissur', state: 'Kerala', lat: 10.5276, lng: 76.2144 },
  { name: 'Visakhapatnam', state: 'Andhra Pradesh', lat: 17.6868, lng: 83.2185 },
  { name: 'Vijayawada', state: 'Andhra Pradesh', lat: 16.5062, lng: 80.6480 },
  { name: 'Guntur', state: 'Andhra Pradesh', lat: 16.3067, lng: 80.4365 },
  { name: 'Tirupati', state: 'Andhra Pradesh', lat: 13.6288, lng: 79.4192 },
  { name: 'Guwahati', state: 'Assam', lat: 26.1445, lng: 91.7362 },
  { name: 'Raipur', state: 'Chhattisgarh', lat: 21.2514, lng: 81.6296 },
  { name: 'Bilaspur', state: 'Chhattisgarh', lat: 22.0797, lng: 82.1409 },
  { name: 'Jammu', state: 'Jammu and Kashmir', lat: 32.7266, lng: 74.8570 },
  { name: 'Srinagar', state: 'Jammu and Kashmir', lat: 34.0837, lng: 74.7973 },
];

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const input = searchParams.get('input');

  if (!input || input.trim().length === 0) {
    return NextResponse.json({ predictions: [] });
  }

  const query = input.trim().toLowerCase();
  const predictions: any[] = [];
  const seenDescriptions = new Set<string>();

  // 1. Google Places Autocomplete API (Highest Accuracy)
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY || 'AIzaSyCJVo2m1ic_xT4BLDELw6h63mOjO9PqquE';
  if (apiKey) {
    try {
      const googleRes = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
          'Referer': 'https://www.academyfind.com'
        },
        body: JSON.stringify({
          input: query,
          includedRegionCodes: ['IN']
        })
      });
      
      if (googleRes.ok) {
        const googleData = await googleRes.json();
        if (googleData.suggestions && Array.isArray(googleData.suggestions)) {
          for (const s of googleData.suggestions) {
            if (s.placePrediction) {
              const p = s.placePrediction;
              const desc = p.text?.text;
              if (desc && !seenDescriptions.has(desc.toLowerCase())) {
                seenDescriptions.add(desc.toLowerCase());
                predictions.push({
                  description: desc,
                  place_id: p.placeId,
                  lat: null, // will be fetched on demand via details route
                  lng: null,
                  structured_formatting: {
                    main_text: p.structuredFormat?.mainText?.text || desc.split(',')[0],
                    secondary_text: p.structuredFormat?.secondaryText?.text || '',
                  },
                });
              }
            }
          }
        }
      }
    } catch (gErr) {
      console.error('Google Autocomplete API error:', gErr);
    }
  }

  // 2. Photon Geocoder API (Free, fast OSM geocoder with no Cloudflare/Vercel IP blocking)
  try {
    const photonRes = await fetch(
      `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=10`
    );
    if (photonRes.ok) {
      const photonData = await photonRes.json();
      if (photonData.features && Array.isArray(photonData.features)) {
        for (const feat of photonData.features) {
          const props = feat.properties || {};
          const coords = feat.geometry?.coordinates || [];
          const lng = coords[0];
          const lat = coords[1];

          // Prioritize Indian results or if country is India
          const country = props.country || '';
          if (country && country.toLowerCase() !== 'india') continue;

          const mainText = props.name || props.city || props.district || props.street || query;
          const secondaryParts = [props.city, props.state, 'India'].filter(Boolean);
          const secondaryText = Array.from(new Set(secondaryParts)).join(', ');
          const fullDesc = `${mainText}, ${secondaryText}`;

          if (!seenDescriptions.has(fullDesc.toLowerCase())) {
            seenDescriptions.add(fullDesc.toLowerCase());
            predictions.push({
              description: fullDesc,
              place_id: `photon_${props.osm_id || Math.random().toString(36).substring(7)}`,
              lat: lat || null,
              lng: lng || null,
              structured_formatting: {
                main_text: mainText,
                secondary_text: secondaryText,
              },
            });
          }
        }
      }
    }
  } catch (photonErr) {
    console.error('Photon geocoder error:', photonErr);
  }

  // 3. Static Indian Cities Matching (Guarantees instant results for all Indian cities like Meerut, Agra, etc.)
  const matchedStaticCities = INDIAN_CITIES.filter((c) =>
    c.name.toLowerCase().includes(query) ||
    c.state.toLowerCase().includes(query) ||
    `${c.name} ${c.state}`.toLowerCase().includes(query)
  );

  for (const c of matchedStaticCities) {
    const fullDesc = `${c.name}, ${c.state}, India`;
    if (!seenDescriptions.has(fullDesc.toLowerCase())) {
      seenDescriptions.add(fullDesc.toLowerCase());
      predictions.push({
        description: fullDesc,
        place_id: `static_city_${c.name.toLowerCase().replace(/\s+/g, '_')}`,
        lat: c.lat,
        lng: c.lng,
        structured_formatting: {
          main_text: c.name,
          secondary_text: `${c.state}, India`,
        },
      });
    }
  }

  // 4. Database Cities (`prisma.city`)
  try {
    const dbCities = await prisma.city.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { state: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: 6,
    });

    for (const c of dbCities) {
      const fullDesc = `${c.name}, ${c.state || 'India'}`;
      if (!seenDescriptions.has(fullDesc.toLowerCase())) {
        seenDescriptions.add(fullDesc.toLowerCase());
        predictions.push({
          description: fullDesc,
          place_id: `city_${c.id}`,
          lat: c.latitude || 28.6139,
          lng: c.longitude || 77.2090,
          structured_formatting: {
            main_text: c.name,
            secondary_text: `${c.state || 'India'}`,
          },
        });
      }
    }
  } catch (dbErr) {
    console.error('DB city fetch error:', dbErr);
  }

  // 5. Database Institute Addresses
  try {
    const dbInstitutes = await prisma.institute.findMany({
      where: {
        address: { contains: query, mode: 'insensitive' },
        isActive: true,
      },
      take: 6,
      select: {
        id: true,
        name: true,
        address: true,
        latitude: true,
        longitude: true,
        city: { select: { name: true, state: true } },
      },
    });

    for (const inst of dbInstitutes) {
      const parts = inst.address.split(',').map((p) => p.trim()).filter(Boolean);
      const mainArea = parts.find((p) => p.toLowerCase().includes(query)) || parts[0];
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
            secondary_text: `${cityName}, ${stateName}`,
          },
        });
      }
    }
  } catch (instErr) {
    console.error('DB institute location fetch error:', instErr);
  }

  return NextResponse.json({ predictions });
}
