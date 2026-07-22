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
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={[lat, lng]}>
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
