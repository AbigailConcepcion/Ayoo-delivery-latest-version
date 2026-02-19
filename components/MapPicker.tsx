
import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icon
const DefaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface MapPickerProps {
  initialLat?: number;
  initialLng?: number;
  onLocationSelect: (lat: number, lng: number) => void;
  readOnly?: boolean;
}

const LocationMarker = ({ position, setPosition, onLocationSelect, readOnly }: any) => {
  const map = useMap();

  useMapEvents({
    click(e) {
      if (!readOnly) {
        setPosition(e.latlng);
        onLocationSelect(e.latlng.lat, e.latlng.lng);
        map.flyTo(e.latlng, map.getZoom());
      }
    },
  });

  return position === null ? null : (
    <Marker position={position}></Marker>
  );
};

const RecenterMap = ({ position }: { position: L.LatLngExpression }) => {
    const map = useMap();
    useEffect(() => {
        map.setView(position);
    }, [position, map]);
    return null;
}

const MapPicker: React.FC<MapPickerProps> = ({ initialLat = 8.2285, initialLng = 124.2452, onLocationSelect, readOnly = false }) => {
  const [position, setPosition] = useState<L.LatLng | null>(
    initialLat && initialLng ? new L.LatLng(initialLat, initialLng) : null
  );

  return (
    <div className="h-64 w-full rounded-3xl overflow-hidden border-2 border-gray-100 shadow-inner relative z-0">
      <MapContainer 
        center={[initialLat, initialLng]} 
        zoom={15} 
        scrollWheelZoom={false}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocationMarker 
            position={position} 
            setPosition={setPosition} 
            onLocationSelect={onLocationSelect}
            readOnly={readOnly}
        />
        {position && <RecenterMap position={position} />}
      </MapContainer>
      {!readOnly && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-md px-4 py-2 rounded-full shadow-lg z-[1000] pointer-events-none">
            <p className="text-[10px] font-black text-[#FF00CC] uppercase tracking-widest">Tap map to pin location</p>
        </div>
      )}
    </div>
  );
};

export default MapPicker;
