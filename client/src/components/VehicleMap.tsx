import { useEffect } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import 'leaflet/dist/leaflet.css';
import type { Vehicle } from '../graphql/types';

// Vite bundles these as URLs, but Leaflet's default icon paths assume a plain
// static-file server, so the default marker is invisible unless we re-point it.
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const TRUCK_ICON_SVG = `
<div style="width:48px;height:48px;filter:drop-shadow(0 2px 3px rgba(11,61,102,0.35));">
  <svg width="48" height="48" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <rect x="6" y="27" width="52" height="39" rx="7" fill="#28323C" />
    <rect x="14" y="33" width="27" height="16" rx="3" fill="#57C15F" />
    <rect x="58" y="42" width="28" height="25" rx="5" fill="#28323C" />
    <rect x="63" y="21" width="19" height="23" rx="5" fill="#28323C" />
    <rect x="67" y="25" width="11" height="11" rx="2.5" fill="#57C15F" />
    <circle cx="24" cy="76" r="14" fill="#57C15F" />
    <circle cx="24" cy="76" r="6" fill="#12161B" />
    <circle cx="72" cy="76" r="14" fill="#57C15F" />
    <circle cx="72" cy="76" r="6" fill="#12161B" />
  </svg>
</div>
`;

const truckIcon = L.divIcon({
  html: TRUCK_ICON_SVG,
  className: 'vehicle-truck-icon',
  iconSize: [46, 46],
  iconAnchor: [23, 40],
  popupAnchor: [0, -36],
});

function Recenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng]);
  }, [lat, lng, map]);
  return null;
}

export function VehicleMap({ vehicle }: { vehicle: Vehicle }) {
  const hasLocation = vehicle.onDuty && vehicle.currentLat != null && vehicle.currentLng != null;

  if (!hasLocation) {
    return (
      <div
        style={{
          height: 280,
          borderRadius: 16,
          border: '1px dashed #C7D2DB',
          background: '#F5F7FA',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#5B6670',
          fontSize: 15,
          textAlign: 'center',
          padding: 16,
        }}
      >
        {vehicle.onDuty
          ? 'Vehicle is on duty but has not reported a location yet.'
          : 'The collection vehicle is not on duty right now.'}
      </div>
    );
  }

  const lat = vehicle.currentLat as number;
  const lng = vehicle.currentLng as number;

  return (
    <MapContainer center={[lat, lng]} zoom={15} style={{ height: 280, borderRadius: 16 }} scrollWheelZoom={false}>
      <TileLayer
        attribution='&copy; <a href="https://carto.com/attributions">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png"
      />
      <Marker position={[lat, lng]} icon={truckIcon}>
        <Popup>
          {vehicle.registrationNumber}
          {vehicle.locationUpdatedAt && (
            <>
              <br />
              Updated {new Date(vehicle.locationUpdatedAt).toLocaleTimeString()}
            </>
          )}
        </Popup>
      </Marker>
      <Recenter lat={lat} lng={lng} />
    </MapContainer>
  );
}
