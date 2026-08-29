/** Xarita zoom chegaralari — faqat Esri (EPSG:3857) */
export const MAP_MAX_ZOOM = 19
export const MAP_MIN_ZOOM = 10

/**
 * Sputnik — faqat Esri:
 * 1) World Imagery (fon)
 * 2) Labels (joy / tuman nomlari)
 * 3) Transportation (yo'llar)
 */
function buildSatelliteLayers() {
  return [
    {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      options: {
        className: 'map-basemap-sat map-basemap-sat--esri',
        maxNativeZoom: 17,
        maxZoom: MAP_MAX_ZOOM,
        zIndex: 200,
      },
    },
    {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
      options: {
        opacity: 1,
        className: 'map-labels-sharp',
        zIndex: 450,
        maxNativeZoom: 17,
        maxZoom: MAP_MAX_ZOOM,
      },
    },
    {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}',
      options: {
        opacity: 0.8,
        zIndex: 440,
        maxNativeZoom: 17,
        maxZoom: MAP_MAX_ZOOM,
      },
    },
  ]
}

/** Xarita pastki qatlamlari */
export const BASEMAPS = {
  satellite: {
    id: 'satellite',
    layers: buildSatelliteLayers(),
  },
  schematic: {
    id: 'schematic',
    layers: [
      {
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
        options: { className: 'map-basemap-schematic', maxNativeZoom: 19, maxZoom: MAP_MAX_ZOOM },
      },
    ],
  },
  schematicDark: {
    id: 'schematicDark',
    layers: [
      {
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
        options: { className: 'map-basemap-schematic-dark', maxNativeZoom: 16, maxZoom: MAP_MAX_ZOOM },
      },
      {
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}',
        options: {
          className: 'map-basemap-schematic-dark-labels',
          zIndex: 450,
          opacity: 1,
          maxNativeZoom: 16,
          maxZoom: MAP_MAX_ZOOM,
        },
      },
    ],
  },
}

export const BASEMAP_IDS = ['satellite', 'schematic', 'schematicDark']
