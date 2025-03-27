import { useState, useEffect } from 'react';
import { View, StyleSheet, Text, ActivityIndicator } from 'react-native';
import MapView, { Polyline, Marker } from 'react-native-maps';
import * as Location from 'expo-location';

// Coordinates for Munroe Island, Kollam


export default function NavigationScreen() {
  const [userLocation, setUserLocation] = useState(null);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        // Request location permission
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setError('Location permission denied');
          return;
        }

        // Get current location
        let location = await Location.getCurrentPositionAsync({});
        setUserLocation(location.coords);

        // Get route coordinates
        const coords = await fetchRoute(
          location.coords,
          MUNROE_ISLAND_COORDS
        );
        setRouteCoordinates(coords);
      } catch (err) {
        setError('Failed to calculate route');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const fetchRoute = async (start, end) => {
    try {
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/` +
          `${start.longitude},${start.latitude};` +
          `${end.longitude},${end.latitude}?` +
          `overview=full&geometries=geojson`
      );

      const json = await response.json();
      
      if (json.routes && json.routes[0]) {
        return json.routes[0].geometry.coordinates.map(coord => ({
          longitude: coord[0],
          latitude: coord[1],
        }));
      }
      throw new Error('No route found');
    } catch (error) {
      console.error('Routing error:', error);
      throw error;
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#3498db" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <MapView
      style={StyleSheet.absoluteFillObject}
      initialRegion={{
        ...userLocation,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      }}
    >
      {/* User Location Marker */}
      {userLocation && (
        <Marker coordinate={userLocation}>
          <View style={styles.userMarker} />
        </Marker>
      )}

      {/* Munroe Island Marker */}
      <Marker coordinate={MUNROE_ISLAND_COORDS}>
        <View style={styles.destinationMarker} />
      </Marker>

      {/* Route Polyline */}
      <Polyline
        coordinates={routeCoordinates}
        strokeColor="#3498db"
        strokeWidth={4}
      />
    </MapView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userMarker: {
    height: 20,
    width: 20,
    borderRadius: 10,
    backgroundColor: '#3498db',
    borderWidth: 2,
    borderColor: 'white',
  },
  destinationMarker: {
    height: 20,
    width: 20,
    borderRadius: 10,
    backgroundColor: '#e74c3c',
    borderWidth: 2,
    borderColor: 'white',
  },
  errorText: {
    color: 'red',
    fontSize: 18,
    textAlign: 'center',
    padding: 20,
  },
});