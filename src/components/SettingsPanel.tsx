import React, { useState, useEffect, useRef } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ChevronDown,
  ChevronUp,
  Clock,
  Target,
  Bell,
  Lock,
  Plus,
  X,
  Smartphone,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Shield,
  MapPin,
  Search,
} from "lucide-react";
import blockingService, { BlockingStatus } from "../services/blockingService";

interface SettingsPanelProps {
  isOpen?: boolean;
  onSave?: (settings: SettingsData) => void;
}

interface FavoriteGym {
  id: string;
  name: string;
  address: string;
  coordinates: { lat: number; lng: number };
  dateAdded: number;
}

interface SettingsData {
  trackingMode: "steps" | "location" | "both";
  dailyStepGoal: number;
  locationGoal: {
    gymName: string;
    latitude: number;
    longitude: number;
    radiusMeters: number;
    requiredMinutes: number;
  };
  favoriteGyms: FavoriteGym[];
  enableReminders: boolean;
  reminderFrequency: string;
  activeHoursStart: string;
  activeHoursEnd: string;
  enableAppBlocking: boolean;
  appsToBlock: string[];
  websitesToBlock: string[];
  strictMode: boolean;
  strictModeActivatedAt?: number;
  healthAppIntegration: {
    enabled: boolean;
    connectedApps: string[];
    autoSync: boolean;
    syncFrequency: string;
  };
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({
  isOpen = true,
  onSave = () => {},
}) => {
  const [isExpanded, setIsExpanded] = useState(isOpen);
  const [blockingStatus, setBlockingStatus] = useState<BlockingStatus | null>(
    null,
  );
  const [isConnecting, setIsConnecting] = useState<string | null>(null);
  const [mapSearchQuery, setMapSearchQuery] = useState("");
  const [mapSearchResults, setMapSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<any>(null);
  const [isGoogleMapsLoaded, setIsGoogleMapsLoaded] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [availableApps] = useState([
    { id: "apple_health", name: "Apple Health", icon: "🍎", connected: false },
    { id: "google_fit", name: "Google Fit", icon: "🏃", connected: false },
    { id: "fitbit", name: "Fitbit", icon: "⌚", connected: false },
    {
      id: "samsung_health",
      name: "Samsung Health",
      icon: "📱",
      connected: false,
    },
    { id: "garmin", name: "Garmin Connect", icon: "⌚", connected: false },
  ]);
  const [settings, setSettings] = useState<SettingsData>({
    trackingMode: "steps",
    dailyStepGoal: 10000,
    locationGoal: {
      gymName: "My Gym",
      latitude: 0,
      longitude: 0,
      radiusMeters: 150, // Default to 150m
      requiredMinutes: 60,
    },
    favoriteGyms: [],
    enableReminders: true,
    reminderFrequency: "60",
    activeHoursStart: "09:00",
    activeHoursEnd: "17:00",
    enableAppBlocking: true,
    appsToBlock: ["Social Media", "Games", "Video Streaming"],
    websitesToBlock: ["facebook.com", "twitter.com", "instagram.com"],
    strictMode: false, // TESTING: Disabled for testing
    strictModeActivatedAt: undefined,
    healthAppIntegration: {
      enabled: true,
      connectedApps: [],
      autoSync: true,
      syncFrequency: "15",
    },
  });

  useEffect(() => {
    // Load Google Maps API
    const loadGoogleMaps = () => {
      if (window.google && window.google.maps) {
        setIsGoogleMapsLoaded(true);
        return;
      }

      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyBOti4mM-6x9WDnZIjIeyEU21OpBXqWBgw&libraries=places&callback=initGoogleMaps`;
      script.async = true;
      script.defer = true;

      window.initGoogleMaps = () => {
        setIsGoogleMapsLoaded(true);
      };

      document.head.appendChild(script);
    };

    loadGoogleMaps();

    // Load blocking service settings
    const blockingSettings = blockingService.getSettings();

    // Load favorite gyms from localStorage
    const savedFavorites = localStorage.getItem("stepTracker_favoriteGyms");
    let favoriteGyms: FavoriteGym[] = [];
    if (savedFavorites) {
      try {
        favoriteGyms = JSON.parse(savedFavorites);
      } catch (error) {
        console.error("Error loading favorite gyms:", error);
      }
    }

    setSettings((prev) => ({
      ...prev,
      trackingMode: blockingSettings.trackingMode,
      dailyStepGoal: blockingSettings.dailyGoal,
      locationGoal: {
        gymName: blockingSettings.locationGoal?.gymName || "My Gym",
        latitude: blockingSettings.locationGoal?.latitude || 0,
        longitude: blockingSettings.locationGoal?.longitude || 0,
        radiusMeters: 150, // Always 150m
        requiredMinutes: blockingSettings.locationGoal?.requiredMinutes || 60,
      },
      favoriteGyms,
      enableAppBlocking: blockingSettings.enabled,
      strictMode: false, // TESTING: Always false for testing
      strictModeActivatedAt: undefined,
      appsToBlock: blockingSettings.blockedApps || [],
      websitesToBlock: blockingSettings.blockedWebsites || [],
    }));

    // Listen for blocking status updates
    const handleStatusUpdate = (status: BlockingStatus) => {
      setBlockingStatus(status);
    };

    blockingService.addListener(handleStatusUpdate);
    setBlockingStatus(blockingService.getBlockingStatus());

    return () => {
      blockingService.removeListener(handleStatusUpdate);
    };
  }, []);

  useEffect(() => {
    if (isGoogleMapsLoaded && mapRef.current && !mapInstanceRef.current) {
      initializeMap();
    }
  }, [isGoogleMapsLoaded]);

  const initializeMap = () => {
    if (!mapRef.current || !window.google) return;

    const map = new window.google.maps.Map(mapRef.current, {
      center: {
        lat: settings.locationGoal.latitude || 37.7749,
        lng: settings.locationGoal.longitude || -122.4194,
      },
      zoom: 15,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
    });

    mapInstanceRef.current = map;

    // Add marker if location is set
    if (settings.locationGoal.latitude && settings.locationGoal.longitude) {
      new window.google.maps.Marker({
        position: {
          lat: settings.locationGoal.latitude,
          lng: settings.locationGoal.longitude,
        },
        map: map,
        title: settings.locationGoal.gymName,
      });

      // Add radius circle
      new window.google.maps.Circle({
        strokeColor: "#FF0000",
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: "#FF0000",
        fillOpacity: 0.15,
        map: map,
        center: {
          lat: settings.locationGoal.latitude,
          lng: settings.locationGoal.longitude,
        },
        radius: settings.locationGoal.radiusMeters,
      });
    }
  };

  const searchGoogleMaps = async (query: string) => {
    if (!window.google || !query.trim()) return;

    setIsSearching(true);

    const service = new window.google.maps.places.PlacesService(
      document.createElement("div"),
    );

    const request = {
      query: query + " gym fitness",
      fields: ["name", "geometry", "formatted_address", "place_id", "types"],
    };

    service.textSearch(request, (results, status) => {
      setIsSearching(false);
      if (
        status === window.google.maps.places.PlacesServiceStatus.OK &&
        results
      ) {
        const gymResults = results.filter((place) =>
          place.types?.some((type) =>
            ["gym", "health", "establishment", "point_of_interest"].includes(
              type,
            ),
          ),
        );
        setMapSearchResults(gymResults.slice(0, 5));
      } else {
        setMapSearchResults([]);
      }
    });
  };

  const selectGymLocation = (place: any) => {
    if (!place.geometry?.location) return;

    const lat = place.geometry.location.lat();
    const lng = place.geometry.location.lng();

    setSelectedPlace(place);
    updateSettings("locationGoal", {
      ...settings.locationGoal,
      gymName: place.name,
      latitude: lat,
      longitude: lng,
      radiusMeters: 150, // Always 150m
    });

    setMapSearchResults([]);
    setMapSearchQuery("");

    // Update map
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setCenter({ lat, lng });
      mapInstanceRef.current.setZoom(16);

      // Clear existing markers and circles
      // Note: In a production app, you'd want to keep references to markers/circles to clear them

      // Add new marker
      new window.google.maps.Marker({
        position: { lat, lng },
        map: mapInstanceRef.current,
        title: place.name,
      });

      // Add radius circle with fixed 150m radius
      new window.google.maps.Circle({
        strokeColor: "#FF0000",
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: "#FF0000",
        fillOpacity: 0.15,
        map: mapInstanceRef.current,
        center: { lat, lng },
        radius: 150, // Fixed at 150m
      });
    }
  };

  const addToFavorites = (place: any) => {
    if (!place.geometry?.location) return;

    const newFavorite: FavoriteGym = {
      id: place.place_id || `${Date.now()}-${Math.random()}`,
      name: place.name,
      address: place.formatted_address,
      coordinates: {
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng(),
      },
      dateAdded: Date.now(),
    };

    // Check if already in favorites
    const isAlreadyFavorite = settings.favoriteGyms.some(
      (fav) => fav.id === newFavorite.id || fav.name === newFavorite.name,
    );

    if (!isAlreadyFavorite && settings.favoriteGyms.length < 15) {
      const updatedFavorites = [...settings.favoriteGyms, newFavorite];
      updateSettings("favoriteGyms", updatedFavorites);

      // Save to localStorage
      localStorage.setItem(
        "stepTracker_favoriteGyms",
        JSON.stringify(updatedFavorites),
      );
    }
  };

  const removeFromFavorites = (gymId: string) => {
    const updatedFavorites = settings.favoriteGyms.filter(
      (fav) => fav.id !== gymId,
    );
    updateSettings("favoriteGyms", updatedFavorites);

    // Save to localStorage
    localStorage.setItem(
      "stepTracker_favoriteGyms",
      JSON.stringify(updatedFavorites),
    );
  };

  const selectFavoriteGym = (favorite: FavoriteGym) => {
    updateSettings("locationGoal", {
      ...settings.locationGoal,
      gymName: favorite.name,
      latitude: favorite.coordinates.lat,
      longitude: favorite.coordinates.lng,
      radiusMeters: 150, // Always 150m
    });

    // Update map
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setCenter({
        lat: favorite.coordinates.lat,
        lng: favorite.coordinates.lng,
      });
      mapInstanceRef.current.setZoom(16);

      // Add new marker
      new window.google.maps.Marker({
        position: {
          lat: favorite.coordinates.lat,
          lng: favorite.coordinates.lng,
        },
        map: mapInstanceRef.current,
        title: favorite.name,
      });

      // Add radius circle
      new window.google.maps.Circle({
        strokeColor: "#FF0000",
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: "#FF0000",
        fillOpacity: 0.15,
        map: mapInstanceRef.current,
        center: {
          lat: favorite.coordinates.lat,
          lng: favorite.coordinates.lng,
        },
        radius: 150, // Fixed at 150m
      });
    }

    setSelectedPlace({
      name: favorite.name,
      formatted_address: favorite.address,
    });
  };

  const handleSave = () => {
    // Update blocking service settings
    blockingService.updateSettings({
      enabled: settings.enableAppBlocking,
      strictMode: settings.strictMode,
      strictModeActivatedAt: settings.strictModeActivatedAt,
      trackingMode: settings.trackingMode,
      dailyGoal: settings.dailyStepGoal,
      locationGoal: settings.locationGoal,
      blockedApps: settings.appsToBlock,
      blockedWebsites: settings.websitesToBlock,
    });

    onSave(settings);
  };

  const updateSettings = (key: keyof SettingsData, value: any) => {
    // TESTING: Strict mode disabled - allow all changes
    // Check if strict mode is locked before allowing changes
    // if (settings.strictMode && settings.strictModeActivatedAt) {
    //   const strictModeLockDuration = 21 * 24 * 60 * 60 * 1000; // 21 days
    //   const timeElapsed = Date.now() - settings.strictModeActivatedAt;
    //   if (
    //     timeElapsed < strictModeLockDuration &&
    //     (key === "strictMode" ||
    //       key === "dailyStepGoal" ||
    //       key === "locationGoal")
    //   ) {
    //     console.warn("Cannot modify goal settings while strict mode is locked");
    //     return;
    //   }
    // }

    // TESTING: Force strict mode to false
    if (key === "strictMode" && value === true) {
      console.log("TESTING: Strict mode is disabled for testing purposes");
      value = false;
    }

    // If enabling strict mode, record the timestamp
    // if (key === "strictMode" && value === true && !settings.strictMode) {
    //   setSettings((prev) => ({
    //     ...prev,
    //     [key]: value,
    //     strictModeActivatedAt: Date.now(),
    //   }));
    //   blockingService.updateSettings({
    //     strictMode: value,
    //     strictModeActivatedAt: Date.now(),
    //   });
    //   return;
    // }

    // If disabling strict mode, clear the timestamp
    if (key === "strictMode" && value === false) {
      setSettings((prev) => ({
        ...prev,
        [key]: value,
        strictModeActivatedAt: undefined,
      }));
      blockingService.updateSettings({
        strictMode: value,
        strictModeActivatedAt: undefined,
      });
      return;
    }

    // Ensure detection radius is always 150m for location goals
    if (key === "locationGoal" && value.radiusMeters !== undefined) {
      value.radiusMeters = 150;
    }

    setSettings((prev) => ({ ...prev, [key]: value }));

    // Update blocking service immediately for critical settings
    if (key === "enableAppBlocking") {
      blockingService.updateSettings({ enabled: value });
    } else if (key === "trackingMode") {
      blockingService.updateSettings({ trackingMode: value });
    } else if (key === "dailyStepGoal") {
      blockingService.updateSettings({ dailyGoal: value });
    } else if (key === "locationGoal") {
      blockingService.updateSettings({ locationGoal: value });
    }
  };

  const testBlocking = () => {
    // Open a blocked website in a new tab to test the blocking functionality
    const testUrl = "https://facebook.com";
    window.open(testUrl, "_blank");
  };

  const handleHealthAppConnect = async (appId: string) => {
    setIsConnecting(appId);

    // Simulate connection process
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const updatedApps = [...settings.healthAppIntegration.connectedApps];
    if (!updatedApps.includes(appId)) {
      updatedApps.push(appId);
    }

    updateSettings("healthAppIntegration", {
      ...settings.healthAppIntegration,
      connectedApps: updatedApps,
      enabled: true,
    });

    setIsConnecting(null);
  };

  const handleHealthAppDisconnect = (appId: string) => {
    const updatedApps = settings.healthAppIntegration.connectedApps.filter(
      (id) => id !== appId,
    );
    updateSettings("healthAppIntegration", {
      ...settings.healthAppIntegration,
      connectedApps: updatedApps,
      enabled: updatedApps.length > 0,
    });
  };

  const isAppConnected = (appId: string) => {
    return settings.healthAppIntegration.connectedApps.includes(appId);
  };

  return (
    <Card className="w-full max-w-md bg-white shadow-md">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold">Settings</CardTitle>
          <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-9 p-0">
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
                <span className="sr-only">{isExpanded ? "Close" : "Open"}</span>
              </Button>
            </CollapsibleTrigger>
          </Collapsible>
        </div>
        <CardDescription>
          Configure your step goals and reminders
        </CardDescription>
      </CardHeader>

      <Collapsible open={isExpanded}>
        <CollapsibleContent>
          <CardContent className="pt-4 space-y-6">
            {/* Tracking Mode Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-medium">Tracking Mode</h3>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="tracking-mode">Choose Tracking Method</Label>
                  <Select
                    value={settings.trackingMode}
                    onValueChange={(value: "steps" | "location" | "both") =>
                      updateSettings("trackingMode", value)
                    }
                  >
                    <SelectTrigger id="tracking-mode">
                      <SelectValue placeholder="Select tracking mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="steps">Step Count Only</SelectItem>
                      <SelectItem value="location">
                        Gym Location Only
                      </SelectItem>
                      <SelectItem value="both">
                        Both Steps & Gym (Dual Tracking)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {(settings.trackingMode === "steps" ||
                  settings.trackingMode === "both") && (
                  <div className="space-y-2 pl-2 border-l-2 border-muted">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="step-goal">Target Steps</Label>
                      <span className="text-sm font-medium">
                        {settings.dailyStepGoal.toLocaleString()}
                      </span>
                    </div>
                    <Slider
                      id="step-goal"
                      min={1000}
                      max={30000}
                      step={500}
                      value={[settings.dailyStepGoal]}
                      onValueChange={(value) =>
                        updateSettings("dailyStepGoal", value[0])
                      }
                      disabled={
                        settings.strictMode &&
                        settings.strictModeActivatedAt &&
                        Date.now() - settings.strictModeActivatedAt <
                          21 * 24 * 60 * 60 * 1000
                      }
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>1,000</span>
                      <span>30,000</span>
                    </div>
                  </div>
                )}

                {(settings.trackingMode === "location" ||
                  settings.trackingMode === "both") && (
                  <div className="space-y-4 pl-2 border-l-2 border-muted">
                    {/* Favorite Gyms Section */}
                    {settings.favoriteGyms.length > 0 && (
                      <div className="space-y-2">
                        <Label>Favorite Gyms</Label>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {settings.favoriteGyms.map((favorite) => (
                            <div
                              key={favorite.id}
                              className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-md"
                            >
                              <button
                                className="flex-1 text-left"
                                onClick={() => selectFavoriteGym(favorite)}
                              >
                                <div className="font-medium text-blue-900">
                                  {favorite.name}
                                </div>
                                <div className="text-sm text-blue-700 truncate">
                                  {favorite.address}
                                </div>
                              </button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeFromFavorites(favorite.id)}
                                className="text-red-600 hover:text-red-800 hover:bg-red-50"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="gym-search">Search for Your Gym</Label>
                      <div className="relative">
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="gym-search"
                              value={mapSearchQuery}
                              onChange={(e) =>
                                setMapSearchQuery(e.target.value)
                              }
                              placeholder="Search for gym (e.g., 'Planet Fitness near me')"
                              className="pl-10"
                              disabled={!isGoogleMapsLoaded}
                            />
                          </div>
                          <Button
                            type="button"
                            onClick={() => searchGoogleMaps(mapSearchQuery)}
                            disabled={
                              !isGoogleMapsLoaded ||
                              isSearching ||
                              !mapSearchQuery.trim()
                            }
                            size="sm"
                          >
                            {isSearching ? (
                              <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                              <Search className="h-4 w-4" />
                            )}
                          </Button>
                        </div>

                        {mapSearchResults.length > 0 && (
                          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                            {mapSearchResults.map((place, index) => (
                              <div
                                key={place.place_id || index}
                                className="flex items-center justify-between p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                              >
                                <button
                                  className="flex-1 text-left flex items-start gap-3"
                                  onClick={() => selectGymLocation(place)}
                                >
                                  <MapPin className="h-4 w-4 text-blue-600 mt-1 flex-shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <div className="font-medium text-gray-900 truncate">
                                      {place.name}
                                    </div>
                                    <div className="text-sm text-gray-500 truncate">
                                      {place.formatted_address}
                                    </div>
                                  </div>
                                </button>
                                {settings.favoriteGyms.length < 15 && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => addToFavorites(place)}
                                    className="text-yellow-600 hover:text-yellow-800 hover:bg-yellow-50"
                                    title="Add to favorites"
                                  >
                                    ⭐
                                  </Button>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {!isGoogleMapsLoaded && (
                        <p className="text-xs text-muted-foreground">
                          Loading Google Maps...
                        </p>
                      )}
                    </div>

                    {selectedPlace && (
                      <div className="bg-green-50 border border-green-200 rounded-md p-3">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium text-green-800">
                            Selected: {selectedPlace.name}
                          </span>
                        </div>
                        <p className="text-xs text-green-700 mt-1">
                          {selectedPlace.formatted_address}
                        </p>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="gym-name">Gym Name</Label>
                      <Input
                        id="gym-name"
                        value={settings.locationGoal.gymName}
                        onChange={(e) =>
                          updateSettings("locationGoal", {
                            ...settings.locationGoal,
                            gymName: e.target.value,
                          })
                        }
                        placeholder="Enter gym name"
                      />
                    </div>

                    {/* Location Coordinates - Hidden but functional */}
                    <div className="hidden">
                      <Label>Location Coordinates</Label>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <Label htmlFor="latitude" className="text-xs">
                            Latitude
                          </Label>
                          <Input
                            id="latitude"
                            type="number"
                            step="any"
                            value={settings.locationGoal.latitude}
                            onChange={(e) =>
                              updateSettings("locationGoal", {
                                ...settings.locationGoal,
                                latitude: parseFloat(e.target.value) || 0,
                              })
                            }
                            placeholder="0.000000"
                            className="text-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="longitude" className="text-xs">
                            Longitude
                          </Label>
                          <Input
                            id="longitude"
                            type="number"
                            step="any"
                            value={settings.locationGoal.longitude}
                            onChange={(e) =>
                              updateSettings("locationGoal", {
                                ...settings.locationGoal,
                                longitude: parseFloat(e.target.value) || 0,
                              })
                            }
                            placeholder="0.000000"
                            className="text-sm"
                          />
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Coordinates are automatically filled when you select a
                        gym from search results.
                      </p>
                    </div>

                    {isGoogleMapsLoaded && (
                      <div className="space-y-2">
                        <Label>Location Preview</Label>
                        <div
                          ref={mapRef}
                          className="w-full h-48 rounded-md border border-gray-200"
                        />
                      </div>
                    )}

                    {/* Detection Radius - Hidden but set to 150m default */}
                    <div className="hidden">
                      <Label htmlFor="radius">Detection Radius (meters)</Label>
                      <div className="flex items-center gap-2">
                        <Slider
                          id="radius"
                          min={50}
                          max={200}
                          step={10}
                          value={[150]} // Fixed at 150m
                          onValueChange={() => {
                            // No-op - radius is fixed at 150m
                          }}
                          className="flex-1"
                          disabled
                        />
                        <span className="text-sm font-medium w-12">150m</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Detection radius is set to 150 meters for optimal
                        accuracy.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="required-time">
                        Required Time (minutes)
                      </Label>
                      <div className="flex items-center gap-2">
                        <Slider
                          id="required-time"
                          min={15}
                          max={240}
                          step={15}
                          value={[settings.locationGoal.requiredMinutes]}
                          onValueChange={(value) =>
                            updateSettings("locationGoal", {
                              ...settings.locationGoal,
                              requiredMinutes: value[0],
                            })
                          }
                          disabled={false} // TESTING: Never disabled
                          className="flex-1"
                        />
                        <span className="text-sm font-medium w-16">
                          {settings.locationGoal.requiredMinutes}min
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Reminders Section */}

            {/* Reminders Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-medium">Movement Reminders</h3>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="reminder-toggle">Enable Reminders</Label>
                <Switch
                  id="reminder-toggle"
                  checked={settings.enableReminders}
                  onCheckedChange={(checked) =>
                    updateSettings("enableReminders", checked)
                  }
                />
              </div>

              {settings.enableReminders && (
                <div className="space-y-4 pl-2 border-l-2 border-muted">
                  <div className="space-y-2">
                    <Label htmlFor="reminder-frequency">
                      Reminder Frequency
                    </Label>
                    <Select
                      value={settings.reminderFrequency}
                      onValueChange={(value) =>
                        updateSettings("reminderFrequency", value)
                      }
                    >
                      <SelectTrigger id="reminder-frequency">
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30">Every 30 minutes</SelectItem>
                        <SelectItem value="60">Every hour</SelectItem>
                        <SelectItem value="90">Every 1.5 hours</SelectItem>
                        <SelectItem value="120">Every 2 hours</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <Label>Active Hours</Label>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label htmlFor="hours-start" className="text-xs">
                          Start
                        </Label>
                        <Input
                          id="hours-start"
                          type="time"
                          value={settings.activeHoursStart}
                          onChange={(e) =>
                            updateSettings("activeHoursStart", e.target.value)
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="hours-end" className="text-xs">
                          End
                        </Label>
                        <Input
                          id="hours-end"
                          type="time"
                          value={settings.activeHoursEnd}
                          onChange={(e) =>
                            updateSettings("activeHoursEnd", e.target.value)
                          }
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Health App Integration Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-medium">Health App Integration</h3>
              </div>

              <div className="space-y-4 pl-2 border-l-2 border-muted">
                <div className="space-y-3">
                  <Label>Available Health Apps</Label>
                  <div className="space-y-2">
                    {availableApps.map((app) => {
                      const connected = isAppConnected(app.id);
                      const connecting = isConnecting === app.id;

                      return (
                        <div
                          key={app.id}
                          className="flex items-center justify-between p-3 border rounded-lg bg-muted/20"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-lg">{app.icon}</span>
                            <div>
                              <span className="font-medium">{app.name}</span>
                              {connected && (
                                <div className="flex items-center gap-1 mt-1">
                                  <CheckCircle className="h-3 w-3 text-green-500" />
                                  <span className="text-xs text-green-600">
                                    Connected
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {connecting && (
                              <RefreshCw className="h-4 w-4 animate-spin text-primary" />
                            )}
                            {connected ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handleHealthAppDisconnect(app.id)
                                }
                                disabled={connecting}
                              >
                                Disconnect
                              </Button>
                            ) : (
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => handleHealthAppConnect(app.id)}
                                disabled={connecting}
                              >
                                {connecting ? "Connecting..." : "Connect"}
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {settings.healthAppIntegration.connectedApps.length > 0 && (
                  <>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="auto-sync-toggle">Auto Sync</Label>
                      <Switch
                        id="auto-sync-toggle"
                        checked={settings.healthAppIntegration.autoSync}
                        onCheckedChange={(checked) =>
                          updateSettings("healthAppIntegration", {
                            ...settings.healthAppIntegration,
                            autoSync: checked,
                          })
                        }
                      />
                    </div>

                    {settings.healthAppIntegration.autoSync && (
                      <div className="space-y-2">
                        <Label htmlFor="sync-frequency">Sync Frequency</Label>
                        <Select
                          value={settings.healthAppIntegration.syncFrequency}
                          onValueChange={(value) =>
                            updateSettings("healthAppIntegration", {
                              ...settings.healthAppIntegration,
                              syncFrequency: value,
                            })
                          }
                        >
                          <SelectTrigger id="sync-frequency">
                            <SelectValue placeholder="Select frequency" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="5">Every 5 minutes</SelectItem>
                            <SelectItem value="15">Every 15 minutes</SelectItem>
                            <SelectItem value="30">Every 30 minutes</SelectItem>
                            <SelectItem value="60">Every hour</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-800">
                          Integration Active
                        </span>
                      </div>
                      <p className="text-xs text-blue-700 mt-1">
                        Step data will be automatically synced from your
                        connected health apps.
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* App Blocking Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-medium">App & Website Blocking</h3>
              </div>

              {/* TESTING: Strict Mode Hidden */}
              <div className="hidden">
                <div className="space-y-1">
                  <Label htmlFor="strict-mode-toggle">
                    Strict Mode (Disabled for Testing)
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Strict mode is temporarily disabled for testing purposes
                  </p>
                </div>
                <Switch
                  id="strict-mode-toggle"
                  checked={false}
                  onCheckedChange={() => {}}
                  disabled={true}
                />
              </div>

              {/* Testing Notice */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-800">
                    Testing Mode Active
                  </span>
                </div>
                <p className="text-xs text-yellow-700 mt-1">
                  Strict mode is disabled for testing. All settings can be
                  modified freely.
                </p>
              </div>

              <div className="space-y-4 pl-2 border-l-2 border-muted">
                {/* TESTING: Strict mode status messages hidden */}

                <div className="space-y-2">
                  <Label>Apps to Block</Label>
                  <div className="space-y-2">
                    {settings.appsToBlock.map((app, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-muted/30 p-2 rounded-md"
                      >
                        <span>{app}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            const newApps = [...settings.appsToBlock];
                            newApps.splice(index, 1);
                            updateSettings("appsToBlock", newApps);
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <div className="flex gap-2 mt-2">
                      <Input
                        id="new-app"
                        placeholder="Add app to block"
                        className="flex-1"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && e.currentTarget.value) {
                            updateSettings("appsToBlock", [
                              ...settings.appsToBlock,
                              e.currentTarget.value,
                            ]);
                            e.currentTarget.value = "";
                          }
                        }}
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          const input = document.getElementById(
                            "new-app",
                          ) as HTMLInputElement;
                          if (input.value) {
                            updateSettings("appsToBlock", [
                              ...settings.appsToBlock,
                              input.value,
                            ]);
                            input.value = "";
                          }
                        }}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    These apps will be blocked until you reach your daily step
                    goal.
                  </p>
                </div>

                <div className="space-y-2 mt-4">
                  <Label>Websites to Block</Label>
                  <div className="space-y-2">
                    {settings.websitesToBlock.map((website, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-muted/30 p-2 rounded-md"
                      >
                        <span>{website}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            const newWebsites = [...settings.websitesToBlock];
                            newWebsites.splice(index, 1);
                            updateSettings("websitesToBlock", newWebsites);
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <div className="flex gap-2 mt-2">
                      <Input
                        id="new-website"
                        placeholder="Add website to block (e.g., example.com)"
                        className="flex-1"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && e.currentTarget.value) {
                            updateSettings("websitesToBlock", [
                              ...settings.websitesToBlock,
                              e.currentTarget.value,
                            ]);
                            e.currentTarget.value = "";
                          }
                        }}
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          const input = document.getElementById(
                            "new-website",
                          ) as HTMLInputElement;
                          if (input.value) {
                            updateSettings("websitesToBlock", [
                              ...settings.websitesToBlock,
                              input.value,
                            ]);
                            input.value = "";
                          }
                        }}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    These websites will be blocked until you reach your daily
                    step goal.
                  </p>
                </div>

                <div className="mt-4 pt-4 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={testBlocking}
                    className="w-full"
                  >
                    Test Blocking (Opens Facebook)
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2 text-center">
                    Click to test if website blocking is working correctly
                  </p>
                </div>
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex justify-end pt-2">
            <Button onClick={handleSave}>Save Settings</Button>
          </CardFooter>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

export default SettingsPanel;
