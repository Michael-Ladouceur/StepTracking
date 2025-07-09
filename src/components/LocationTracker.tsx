import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  MapPin,
  Navigation,
  Clock,
  Activity,
  AlertCircle,
  CheckCircle,
  Loader2,
} from "lucide-react";

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
  address?: string;
}

interface LocationTrackerProps {
  onLocationUpdate?: (location: LocationData) => void;
  trackingEnabled?: boolean;
  gymLocation?: {
    latitude: number;
    longitude: number;
    name: string;
    radiusMeters: number;
  };
  onGymStatusChange?: (isAtGym: boolean, timeSpent: number) => void;
}

const LocationTracker: React.FC<LocationTrackerProps> = ({
  onLocationUpdate = () => {},
  trackingEnabled = false,
  gymLocation,
  onGymStatusChange = () => {},
}) => {
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(
    null,
  );
  const [isTracking, setIsTracking] = useState(trackingEnabled);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [watchId, setWatchId] = useState<number | null>(null);
  const [locationHistory, setLocationHistory] = useState<LocationData[]>([]);
  const [estimatedSteps, setEstimatedSteps] = useState(0);
  const [isAtGym, setIsAtGym] = useState(false);
  const [gymSessionStart, setGymSessionStart] = useState<Date | null>(null);
  const [totalGymTimeToday, setTotalGymTimeToday] = useState(0); // in minutes
  const [currentSessionTime, setCurrentSessionTime] = useState(0); // in minutes

  useEffect(() => {
    if (isTracking) {
      startTracking();
    } else {
      stopTracking();
    }

    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [isTracking]);

  useEffect(() => {
    // Load today's gym time from localStorage
    const today = new Date().toDateString();
    const storedGymTime = localStorage.getItem(`stepTracker_gymTime_${today}`);
    if (storedGymTime) {
      setTotalGymTimeToday(parseInt(storedGymTime, 10));
    }

    // Update current session time every minute when at gym
    let sessionInterval: NodeJS.Timeout;
    if (isAtGym && gymSessionStart) {
      sessionInterval = setInterval(() => {
        const now = new Date();
        const sessionMinutes = Math.floor(
          (now.getTime() - gymSessionStart.getTime()) / (1000 * 60),
        );
        setCurrentSessionTime(sessionMinutes);
      }, 60000); // Update every minute
    }

    return () => {
      if (sessionInterval) {
        clearInterval(sessionInterval);
      }
    };
  }, [isAtGym, gymSessionStart]);

  const startTracking = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by this browser.");
      return;
    }

    setIsLoading(true);
    setError(null);

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 60000,
    };

    const successCallback = (position: GeolocationPosition) => {
      const locationData: LocationData = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: position.timestamp,
      };

      setCurrentLocation(locationData);
      setLocationHistory((prev) => {
        const newHistory = [...prev, locationData];
        // Keep only last 50 locations
        return newHistory.slice(-50);
      });

      // Estimate steps based on location changes
      if (locationHistory.length > 0) {
        const lastLocation = locationHistory[locationHistory.length - 1];
        const distance = calculateDistance(
          lastLocation.latitude,
          lastLocation.longitude,
          locationData.latitude,
          locationData.longitude,
        );

        // Rough estimation: 1 meter ≈ 1.3 steps
        const additionalSteps = Math.round(distance * 1.3);
        setEstimatedSteps((prev) => prev + additionalSteps);
      }

      // Check if user is at gym location with enhanced accuracy
      if (gymLocation) {
        const distanceToGym = calculateDistance(
          locationData.latitude,
          locationData.longitude,
          gymLocation.latitude,
          gymLocation.longitude,
        );

        // Use GPS accuracy to adjust detection radius
        const effectiveRadius = Math.max(
          gymLocation.radiusMeters,
          locationData.accuracy * 1.5, // Account for GPS accuracy
        );

        const wasAtGym = isAtGym;
        const nowAtGym = distanceToGym <= effectiveRadius;

        if (nowAtGym && !wasAtGym) {
          // Just arrived at gym
          setIsAtGym(true);
          setGymSessionStart(new Date());
          setCurrentSessionTime(0);
        } else if (!nowAtGym && wasAtGym) {
          // Just left gym
          setIsAtGym(false);
          if (gymSessionStart) {
            const sessionEnd = new Date();
            const sessionMinutes = Math.floor(
              (sessionEnd.getTime() - gymSessionStart.getTime()) / (1000 * 60),
            );
            const newTotalTime = totalGymTimeToday + sessionMinutes;
            setTotalGymTimeToday(newTotalTime);

            // Save to localStorage
            const today = new Date().toDateString();
            localStorage.setItem(
              `stepTracker_gymTime_${today}`,
              newTotalTime.toString(),
            );

            // Notify parent component
            onGymStatusChange(false, newTotalTime);
          }
          setGymSessionStart(null);
          setCurrentSessionTime(0);
        } else if (nowAtGym && wasAtGym && gymSessionStart) {
          // Still at gym, update current session time
          const now = new Date();
          const sessionMinutes = Math.floor(
            (now.getTime() - gymSessionStart.getTime()) / (1000 * 60),
          );
          setCurrentSessionTime(sessionMinutes);

          // Notify parent component with current total + session time
          onGymStatusChange(true, totalGymTimeToday + sessionMinutes);
        }
      }

      onLocationUpdate(locationData);
      setIsLoading(false);
      setError(null);
    };

    const errorCallback = (error: GeolocationPositionError) => {
      setIsLoading(false);
      switch (error.code) {
        case error.PERMISSION_DENIED:
          setError("Location access denied by user.");
          break;
        case error.POSITION_UNAVAILABLE:
          setError("Location information is unavailable.");
          break;
        case error.TIMEOUT:
          setError("Location request timed out.");
          break;
        default:
          setError("An unknown error occurred while retrieving location.");
          break;
      }
    };

    const id = navigator.geolocation.watchPosition(
      successCallback,
      errorCallback,
      options,
    );
    setWatchId(id);
  };

  const stopTracking = () => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
    setIsLoading(false);
  };

  const toggleTracking = () => {
    setIsTracking(!isTracking);
  };

  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  };

  const getTotalDistance = (): number => {
    if (locationHistory.length < 2) return 0;

    let totalDistance = 0;
    for (let i = 1; i < locationHistory.length; i++) {
      const prev = locationHistory[i - 1];
      const curr = locationHistory[i];
      totalDistance += calculateDistance(
        prev.latitude,
        prev.longitude,
        curr.latitude,
        curr.longitude,
      );
    }
    return totalDistance;
  };

  return (
    <Card className="w-full bg-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Location Tracker
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant={isTracking ? "default" : "secondary"}>
              {isTracking ? (
                <>
                  <Activity className="h-3 w-3 mr-1" />
                  Tracking Active
                </>
              ) : (
                "Tracking Stopped"
              )}
            </Badge>
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          </div>
          <Button
            onClick={toggleTracking}
            variant={isTracking ? "destructive" : "default"}
            size="sm"
          >
            {isTracking ? "Stop Tracking" : "Start Tracking"}
          </Button>
        </div>

        {gymLocation && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-blue-800">
                {gymLocation.name}
              </span>
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-blue-700">Status:</span>
                <Badge variant={isAtGym ? "default" : "secondary"}>
                  {isAtGym ? "At Gym" : "Not at Gym"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-blue-700">Detection Radius:</span>
                <span className="font-medium">{gymLocation.radiusMeters}m</span>
              </div>
              {currentLocation && (
                <div className="flex items-center justify-between">
                  <span className="text-blue-700">Distance to Gym:</span>
                  <span className="font-medium">
                    {Math.round(
                      calculateDistance(
                        currentLocation.latitude,
                        currentLocation.longitude,
                        gymLocation.latitude,
                        gymLocation.longitude,
                      ),
                    )}
                    m
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-blue-700">Today's Gym Time:</span>
                <span className="font-medium">
                  {totalGymTimeToday + currentSessionTime} minutes
                </span>
              </div>
              {isAtGym && (
                <div className="flex items-center justify-between">
                  <span className="text-blue-700">Current Session:</span>
                  <span className="font-medium">
                    {currentSessionTime} minutes
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {currentLocation && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Latitude:</span>
                <p className="font-mono">
                  {currentLocation.latitude.toFixed(6)}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Longitude:</span>
                <p className="font-mono">
                  {currentLocation.longitude.toFixed(6)}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Accuracy:</span>
                <p>{Math.round(currentLocation.accuracy)}m</p>
              </div>
              <div>
                <span className="text-muted-foreground">Last Update:</span>
                <p>
                  {new Date(currentLocation.timestamp).toLocaleTimeString()}
                </p>
              </div>
            </div>

            <div className="pt-3 border-t space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Total Distance:
                </span>
                <span className="font-medium">
                  {(getTotalDistance() / 1000).toFixed(2)} km
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Estimated Steps:
                </span>
                <span className="font-medium">
                  {estimatedSteps.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Tracking Points:
                </span>
                <span className="font-medium">{locationHistory.length}</span>
              </div>
            </div>
          </div>
        )}

        {!currentLocation && !error && !isLoading && (
          <div className="text-center py-8 text-muted-foreground">
            <Navigation className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Start tracking to see your location data</p>
          </div>
        )}

        <div className="pt-3 border-t">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <CheckCircle className="h-3 w-3" />
            <span>
              Location data is processed locally and not stored on servers
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LocationTracker;
