import React, { useEffect, useState, useRef } from 'react';
// Open layer Map css
import 'ol/ol.css';
//  Map class 
import Map from 'ol/Map';
// View class 
import View from 'ol/View';
// functions for longitude and latitude 
import { fromLonLat, toLonLat } from 'ol/proj';
// VectorSource class 
import VectorSource from 'ol/source/Vector';
// VectorLayer class 
import VectorLayer from 'ol/layer/Vector';
// Draw class for Polygon  
import Draw from 'ol/interaction/Draw';
// Translate class for changing from one polygon to place marker 
import Translate from 'ol/interaction/Translate';
// apply function from ol-mapbox-style
import { apply } from 'ol-mapbox-style';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import { Icon, Style } from 'ol/style'; // Import Icon and Style classes 
import * as ol from 'ol'; // Import OpenLayers as ol namespace
import Overlay from 'ol/Overlay'; // Add this import for Overlay class


// Define a functional component named MapComponent
const MapComponent = () => {
    // Define states using useState hook
    const [mapMode, setMapMode] = useState('draw'); // 'draw' or 'placeMarker'
    const [drawnPolygon, setDrawnPolygon] = useState(null); // State for the drawn polygon
    const [polygonArea, setPolygonArea] = useState(null); // State for the area of the drawn polygon
    const [markerCoordinates, setMarkerCoordinates] = useState(null); // State for marker coordinates

    // Define ref hooks for map, vector source, draw interaction, and translate interaction
    const map = useRef(null);
    const vectorSource = useRef(null);
    const draw = useRef(null);
    const translate = useRef(null);

    // useEffect hook to run side effects
    useEffect(() => {
        // Define the LocationIQ access token
        const key = 'pk.aa7f5d0539c5675b7f3429402939d8fa';
        // Define the style JSON URL
        const styleJson = `https://tiles-staging.locationiq.com/v3/streets/vector.json?key=${key}`;

        // Create a new map instance
        map.current = new Map({
            target: 'map', // Target element ID
            view: new View({
                center: fromLonLat([-122.42, 37.779]),
                zoom: 12
            })
        });

        // Create a new vector source
        vectorSource.current = new VectorSource({});
        // Create a new vector layer with the vector source
        const vectorLayer = new VectorLayer({
            source: vectorSource.current,
            zIndex: 1
        });

        // Add the vector layer to the map
        map.current.addLayer(vectorLayer);

        // Handle map click events
        const handleMapClick = (e) => {
            if (mapMode === 'placeMarker') {
                const coordinate = e.coordinate;
                const lngLat = toLonLat(coordinate);
                // Update marker coordinates state
                setMarkerCoordinates({ longitude: lngLat[0], latitude: lngLat[1] });

                // Create a new marker feature
                const marker = new Feature({
                    geometry: new Point(fromLonLat(lngLat)),
                });
                // Style the marker
                marker.setStyle(
                    new Style({
                        image: new Icon({
                            scale: 0.2,
                            src: 'https://tiles.locationiq.com/static/images/marker.png',
                        }),
                    })
                );
                // send the marker feature to the vector source
                vectorSource.current.addFeature(marker);
            }
        }

        map.current.on('click', handleMapClick);

        // Apply the Mapbox style to the map
        apply(map.current, styleJson);

        return () => {
            map.current.setTarget(null);
        };
    }, [mapMode]);

    // manage Polygon and translate interactions
    useEffect(() => {
        if (map.current && vectorSource.current) {
            if (mapMode === 'draw') {
                addDrawInteraction();
            } else if (mapMode === 'placeMarker') {
                addTranslateInteraction();
            }

            return () => {
                if (draw.current) {
                    map.current.removeInteraction(draw.current);
                }
                if (translate.current) {
                    map.current.removeInteraction(translate.current);
                }
            };
        }
    }, [mapMode]);

    // Function to add Polygon interaction
    const addDrawInteraction = () => {
        draw.current = new Draw({
            source: vectorSource.current,
            type: 'Polygon'
        });

        // when polygon is drawn calculate area and line lengths
        draw.current.on('drawend', (event) => {
            const polygon = event.feature.getGeometry();
            const coordinates = polygon.getCoordinates()[0]; // Get the coordinates of the polygon
            let totalLength = 0;

            // Calculate and display the length of each line segment
            coordinates.slice(1).forEach((coord, index) => {
                const prevCoord = coordinates[index];
                const lineLength = Math.sqrt(Math.pow(coord[0] - prevCoord[0], 2) + Math.pow(coord[1] - prevCoord[1], 2));
                totalLength += lineLength;

                // Calculate the midpoint of the line segment
                const midpoint = [(coord[0] + prevCoord[0]) / 2, (coord[1] + prevCoord[1]) / 2];

                // Create a new overlay with the line length
                const overlayElement = document.createElement('div');
                overlayElement.innerText = `${lineLength.toFixed(2)} m`;
                const overlay = new Overlay({
                    position: midpoint,
                    element: overlayElement,
                    positioning: 'center-center',
                    offset: [0, -15],
                });

                // Style the overlay
                overlayElement.style.cssText = `
                    font-weight: bold;
                    background: rgba(255, 255, 255, 0.8);
                    padding: 1px 1px;
                    border-radius: 1px;
                    border: 1px solid #333;
                    transform: translate(-50%, -50%);
                `;

                map.current.addOverlay(overlay);
            });

            // Log the total length of the polygon
            console.log('Total length:', totalLength.toFixed(2));

            // Calculate the area of the polygon
            const area = polygon.getArea();
            setPolygonArea(area);
            setDrawnPolygon(polygon);
        });

        map.current.addInteraction(draw.current);
    };


    const addTranslateInteraction = () => {
        if (translate.current) {
            map.current.removeInteraction(translate.current);
        }
        translate.current = new Translate({
            features: new ol.Collection(vectorSource.current.getFeatures())
        });
        map.current.addInteraction(translate.current);
    }

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', gap: '20px' }}>
            <div id="map" style={{ padding: '5px', width: '80%', height: '500px', position: 'relative', marginBottom: '20px', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', border: '1px solid #e0e0e0', backgroundColor: '#f9f9f9' }}>
                {polygonArea && (
                    <div style={{ position: 'absolute', top: '55px', right: '10px', background: 'rgba(255, 255, 255, 50%)', zIndex: 100, padding: '10px', borderRadius: '5px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', color: '#333', fontWeight: 'bold' }}>Area: {polygonArea.toFixed(2)} square meters
                    </div>
                )}
                {markerCoordinates && mapMode === 'placeMarker' && (
                    <div style={{ position: 'absolute', top: '55px', right: '10px', background: 'rgba(255, 255, 255, 50%)', zIndex: 100, padding: '10px', borderRadius: '5px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', color: '#333', fontWeight: 'bold' }}>Coordinates: {markerCoordinates.latitude.toFixed(5)}, {markerCoordinates.longitude.toFixed(5)}
                    </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'center', width: '80%', margin: '0 auto', marginTop: '10px', marginBottom: '10px' }}>
                    <button style={{ flex: 1, padding: '10px', background: '#007bff', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer', marginRight: '5px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} onClick={() => { setMapMode('draw') }}>Draw Polygon</button>
                    <button style={{ flex: 1, padding: '10px', background: '#28a745', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer', marginLeft: '5px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} onClick={() => { setMapMode('placeMarker'); setPolygonArea(null); }}>Place Marker</button>
                </div>
            </div>
        </div>
    );
};

// Export the component as the default export
export default MapComponent;
