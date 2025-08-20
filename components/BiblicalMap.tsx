import React from 'react';

interface BiblicalMapProps {
  latitude: number;
  longitude: number;
  placeName: string;
  locationCertainty?: 'certain' | 'uncertain' | 'disputed';
}

// Jerusalem coordinates for distance calculation
const ISRAEL_CENTER = { lat: 31.7683, lon: 35.2137 };

/**
 * Calculates the distance between two geo-coordinates in kilometers using the Haversine formula.
 */
function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the Earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Determines the appropriate map zoom level based on the distance from a central point.
 */
const calculateZoom = (distance: number): number => {
  if (distance < 50) return 12;
  if (distance < 150) return 10;
  if (distance < 400) return 8;
  if (distance < 800) return 7;
  if (distance < 1500) return 6;
  if (distance < 3000) return 5;
  return 4;
};

const BiblicalMap: React.FC<BiblicalMapProps> = ({ latitude, longitude, placeName, locationCertainty }) => {
  const distance = getDistanceFromLatLonInKm(latitude, longitude, ISRAEL_CENTER.lat, ISRAEL_CENTER.lon);
  const zoom = calculateZoom(distance);

  // Uses a keyless Google Maps embed URL with terrain view ('t=p')
  const mapSrc = `https://maps.google.com/maps?q=${latitude},${longitude}&z=${zoom}&output=embed&t=p`;

  return (
    <div className="mb-4">
      <div className="w-full h-64 rounded-lg overflow-hidden border border-slate-600 shadow-lg bg-slate-700">
        <iframe
          width="100%"
          height="100%"
          style={{ border: 0 }}
          loading="lazy"
          allowFullScreen
          src={mapSrc}
          title={`Map of ${placeName}`}
          aria-label={`Map of ${placeName}`}
        ></iframe>
      </div>
      {locationCertainty && locationCertainty !== 'certain' && (
        <p className="text-xs text-slate-500 text-center mt-2 italic px-2">
          Note: The exact location of this site is a matter of scholarly discussion; the coordinates provided are a common approximation.
        </p>
      )}
    </div>
  );
};

export default BiblicalMap;
