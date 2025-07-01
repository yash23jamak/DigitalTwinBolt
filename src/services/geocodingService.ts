// ArcGIS imports - using CDN loader
// import * as locator from '@arcgis/core/tasks/Locator';
// import AddressCandidate from '@arcgis/core/tasks/support/AddressCandidate';
// import Point from '@arcgis/core/geometry/Point';

export interface GeocodeResult {
  address: string;
  location: {
    latitude: number;
    longitude: number;
  };
  score: number;
  attributes: Record<string, any>;
}

export interface ReverseGeocodeResult {
  address: string;
  location: {
    latitude: number;
    longitude: number;
  };
  attributes: Record<string, any>;
}

export class GeocodingService {
  private static instance: GeocodingService;
  private locatorService: any;

  private constructor() {
    // Initialize ArcGIS World Geocoding Service
    this.locatorService = new locator({
      url: "https://geocode-api.arcgis.com/arcgis/rest/services/World/GeocodeServer"
    });
  }

  public static getInstance(): GeocodingService {
    if (!GeocodingService.instance) {
      GeocodingService.instance = new GeocodingService();
    }
    return GeocodingService.instance;
  }

  /**
   * Geocode an address to coordinates
   */
  public async geocodeAddress(address: string): Promise<GeocodeResult[]> {
    try {
      const response = await this.locatorService.addressToLocations({
        address: {
          SingleLine: address
        },
        maxLocations: 10,
        outFields: ["*"]
      });

      return response.map((candidate: AddressCandidate) => ({
        address: candidate.address,
        location: {
          latitude: candidate.location.latitude,
          longitude: candidate.location.longitude
        },
        score: candidate.score,
        attributes: candidate.attributes
      }));
    } catch (error) {
      console.error('Error geocoding address:', error);
      return [];
    }
  }

  /**
   * Reverse geocode coordinates to address
   */
  public async reverseGeocode(
    latitude: number,
    longitude: number
  ): Promise<ReverseGeocodeResult | null> {
    try {
      const point = new Point({
        latitude,
        longitude,
        spatialReference: { wkid: 4326 }
      });

      const response = await this.locatorService.locationToAddress({
        location: point,
        distance: 100,
        outFields: ["*"]
      });

      if (response) {
        return {
          address: response.address,
          location: { latitude, longitude },
          attributes: response.attributes
        };
      }

      return null;
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      return null;
    }
  }

  /**
   * Find places by category near a location
   */
  public async findPlaces(
    category: string,
    latitude: number,
    longitude: number,
    radiusMeters: number = 5000
  ): Promise<GeocodeResult[]> {
    try {
      const point = new Point({
        latitude,
        longitude,
        spatialReference: { wkid: 4326 }
      });

      const response = await this.locatorService.addressToLocations({
        address: {
          SingleLine: category
        },
        location: point,
        distance: radiusMeters,
        maxLocations: 20,
        outFields: ["*"]
      });

      return response.map((candidate: AddressCandidate) => ({
        address: candidate.address,
        location: {
          latitude: candidate.location.latitude,
          longitude: candidate.location.longitude
        },
        score: candidate.score,
        attributes: candidate.attributes
      }));
    } catch (error) {
      console.error('Error finding places:', error);
      return [];
    }
  }

  /**
   * Suggest addresses as user types
   */
  public async suggestAddresses(
    text: string,
    latitude?: number,
    longitude?: number
  ): Promise<string[]> {
    try {
      const params: any = {
        text,
        maxSuggestions: 10
      };

      if (latitude && longitude) {
        params.location = new Point({
          latitude,
          longitude,
          spatialReference: { wkid: 4326 }
        });
      }

      const response = await this.locatorService.suggest(params);
      return response.map((suggestion: any) => suggestion.text);
    } catch (error) {
      console.error('Error getting address suggestions:', error);
      return [];
    }
  }

  /**
   * Batch geocode multiple addresses
   */
  public async batchGeocode(addresses: string[]): Promise<GeocodeResult[]> {
    try {
      const addressObjects = addresses.map(address => ({
        SingleLine: address
      }));

      const response = await this.locatorService.addressesToLocations({
        addresses: addressObjects,
        outFields: ["*"]
      });

      return response.map((result: any) => ({
        address: result.address,
        location: {
          latitude: result.location.latitude,
          longitude: result.location.longitude
        },
        score: result.score,
        attributes: result.attributes
      }));
    } catch (error) {
      console.error('Error batch geocoding:', error);
      return [];
    }
  }
}

// Export singleton instance
export const geocodingService = GeocodingService.getInstance();
