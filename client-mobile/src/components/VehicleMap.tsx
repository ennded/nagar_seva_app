import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import WebView from 'react-native-webview';
import { colors } from '../theme';

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  label: string;
  color: string;
}

interface Props {
  markers: MapMarker[];
  height?: number;
}

// Free OpenStreetMap tiles via Leaflet — no API key, works inside Expo Go since it's just a
// WebView (react-native-maps would need a Google Maps key on Android and a custom dev build,
// neither of which fit this project's Expo Go workflow). Marker positions are pushed into the
// already-loaded page via postMessage on every poll so the map doesn't reload/flicker.
const MAP_HTML = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    html, body, #map { height: 100%; margin: 0; padding: 0; background: #F5F7FA; }
    .veh-pin { display:flex; align-items:center; justify-content:center; width:30px; height:30px; border-radius:15px; border:3px solid #fff; box-shadow:0 2px 6px rgba(0,0,0,0.35); }
    .veh-label { font: 700 11px -apple-system, sans-serif; background:#14181C; color:#fff; padding:3px 7px; border-radius:6px; white-space:nowrap; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    const map = L.map('map', { zoomControl: false, attributionControl: false });
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);
    map.setView([20.5937, 78.9629], 5);

    let layer = L.layerGroup().addTo(map);
    let hasFit = false;

    function truckIcon(color) {
      return L.divIcon({
        className: '',
        html: '<div class="veh-pin" style="background:' + color + '">' +
          '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">' +
          '<path d="M10 17h4V5H2v12h3"/><path d="M20 17h2v-3.34a4 4 0 0 0-1.17-2.83L19 9h-5v8h1"/>' +
          '<circle cx="7.5" cy="17.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg></div>',
        iconSize: [30, 30],
        iconAnchor: [15, 15],
      });
    }

    function render(markers) {
      layer.clearLayers();
      if (!markers.length) return;
      const bounds = [];
      markers.forEach((m) => {
        const marker = L.marker([m.lat, m.lng], { icon: truckIcon(m.color) }).addTo(layer);
        marker.bindTooltip(m.label, { permanent: false, direction: 'top', offset: [0, -15], className: 'veh-label-wrap' });
        bounds.push([m.lat, m.lng]);
      });
      if (!hasFit || markers.length > 1) {
        if (bounds.length === 1) {
          map.setView(bounds[0], 17);
        } else {
          map.fitBounds(bounds, { padding: [40, 40] });
        }
        hasFit = true;
      }
    }

    function onMessage(raw) {
      try {
        render(JSON.parse(raw));
      } catch (e) {}
    }
    document.addEventListener('message', (e) => onMessage(e.data));
    window.addEventListener('message', (e) => onMessage(e.data));
  </script>
</body>
</html>
`;

export function VehicleMap({ markers, height = 220 }: Props) {
  const webRef = useRef<WebView>(null);
  const loaded = useRef(false);

  useEffect(() => {
    if (!loaded.current) return;
    webRef.current?.postMessage(JSON.stringify(markers));
  }, [markers]);

  return (
    <View style={[styles.wrap, { height }]}>
      <WebView
        ref={webRef}
        originWhitelist={['*']}
        source={{ html: MAP_HTML }}
        onLoadEnd={() => {
          loaded.current = true;
          webRef.current?.postMessage(JSON.stringify(markers));
        }}
        style={styles.web}
        javaScriptEnabled
        domStorageEnabled
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: colors.border },
  web: { flex: 1, backgroundColor: '#F5F7FA' },
});
