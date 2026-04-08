/**
 * Custom MarkerClusterGroup wrapper using leaflet.markercluster directly.
 * Replaces the broken react-leaflet-cluster package.
 */

import { createPathComponent, createElementObject, extendContext } from '@react-leaflet/core';
import L from 'leaflet';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';

interface MarkerClusterGroupProps extends L.MarkerClusterGroupOptions {
  children?: React.ReactNode;
}

const MarkerClusterGroup = createPathComponent<L.MarkerClusterGroup, MarkerClusterGroupProps>(
  function createMarkerClusterGroup(props, ctx) {
    const clusterGroup = new L.MarkerClusterGroup(props);
    return createElementObject(
      clusterGroup,
      extendContext(ctx, { layerContainer: clusterGroup }),
    );
  }
);

export default MarkerClusterGroup;
