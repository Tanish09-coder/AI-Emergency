"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Incident } from "@/types";

// Note: Replace this placeholder with a real token from Mapbox.
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "pk.eyJ1IjoiZHVtbXl0b2tlbiIsImEiOiJjbGR1bW15dG9rZW4ifQ.dummy_token_replace_me";

interface MapViewProps {
  incidents: Incident[];
  onMarkerClick: (incident: Incident) => void;
}

export default function MapView({ incidents, onMarkerClick }: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<{ [key: string]: mapboxgl.Marker }>({});

  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    // Initialize map
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: [-74.006, 40.7128], // Default to NYC, update based on target locale
      zoom: 11,
    });
    
    map.current.addControl(new mapboxgl.NavigationControl(), "top-right");

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  useEffect(() => {
    if (!map.current) return;

    // Update markers based on incidents
    
    // 1. Remove old markers that are no longer in the incidents list
    const currentIncidentIds = new Set(incidents.map(i => i._id));
    Object.keys(markersRef.current).forEach(id => {
      if (!currentIncidentIds.has(id)) {
        markersRef.current[id].remove();
        delete markersRef.current[id];
      }
    });

    // 2. Add or update markers
    incidents.forEach(incident => {
      if (!incident.location.coordinates) return;

      const { lng, lat } = incident.location.coordinates;
      
      // Determine marker color
      let color = "#3B82F6"; // LOW
      if (incident.severity === "CRITICAL") color = "#EF4444";
      if (incident.severity === "HIGH") color = "#F97316";
      if (incident.severity === "MEDIUM") color = "#EAB308";
      if (incident.status === "RESOLVED") color = "#22C55E";

      if (markersRef.current[incident._id]) {
        // Update existing marker (if position changed, though rare for incidents)
        markersRef.current[incident._id].setLngLat([lng, lat]);
        // Note: Changing color dynamically for default mapbox marker requires creating a new one, 
        // so for simplicity in MVP we'll just handle position updates.
      } else {
        // Create new marker
        const el = document.createElement('div');
        el.className = 'w-6 h-6 rounded-full border-2 border-white shadow-lg cursor-pointer transform hover:scale-110 transition-transform';
        el.style.backgroundColor = color;
        
        if (incident.severity === "CRITICAL" && incident.status !== "RESOLVED") {
          el.classList.add("animate-pulse");
          el.style.boxShadow = "0 0 15px rgba(239, 68, 68, 0.8)";
        }

        el.addEventListener("click", () => {
          onMarkerClick(incident);
        });

        const marker = new mapboxgl.Marker(el)
          .setLngLat([lng, lat])
          .addTo(map.current!);

        markersRef.current[incident._id] = marker;
      }
    });

  }, [incidents, onMarkerClick]);

  return (
    <div className="relative w-full h-[600px] rounded-xl overflow-hidden border border-slate-700 shadow-lg">
      <div ref={mapContainer} className="absolute inset-0" />
      {!process.env.NEXT_PUBLIC_MAPBOX_TOKEN && (
        <div className="absolute top-4 left-4 right-14 bg-yellow-900/90 text-yellow-200 p-3 rounded-lg border border-yellow-700/50 text-sm z-10 backdrop-blur-sm">
          <strong>Warning:</strong> Mapbox token not found. The map may fail to load. Please add <code className="bg-black/30 px-1 rounded">NEXT_PUBLIC_MAPBOX_TOKEN</code> to your .env file.
        </div>
      )}
    </div>
  );
}
