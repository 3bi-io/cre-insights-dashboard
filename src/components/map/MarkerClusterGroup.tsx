/**
 * Custom MarkerClusterGroup wrapper using leaflet.markercluster directly.
 * Replaces the broken react-leaflet-cluster package.
 */

import { createPathComponent } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';

interface MarkerClusterGroupProps extends L.MarkerClusterGroupOptions {
  children?: React.ReactNode;
}

const MarkerClusterGroup = createPathComponent<L.MarkerClusterGroup, MarkerClusterGroupProps>(
  ({ ...props }, ctx) => {
    const clusterGroup = new L.MarkerClusterGroup(props);
    return {
      instance: clusterGroup,
      context: { ...ctx, layerContainer: clusterGroup },
    };
  }
);

export default MarkerClusterGroup;
