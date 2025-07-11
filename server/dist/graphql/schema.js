"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.typeDefs = void 0;
const apollo_server_express_1 = require("apollo-server-express");
exports.typeDefs = (0, apollo_server_express_1.gql) `
  scalar DateTime
  scalar Upload
  scalar JSON

  # Model Types
  type DigitalTwinModel {
    id: ID!
    name: String!
    description: String
    type: ModelType!
    fileUrl: String!
    thumbnailUrl: String
    size: Float!
    uploadDate: DateTime!
    lastModified: DateTime!
    coordinates: GeospatialCoordinates
    metadata: ModelMetadata
    status: ModelStatus!
    tags: [String!]!
    createdBy: String!
  }

  type ModelMetadata {
    vertices: Int
    faces: Int
    materials: Int
    animations: Int
    boundingBox: BoundingBox
    fileFormat: String
    version: String
  }

  type BoundingBox {
    min: Vector3
    max: Vector3
  }

  type Vector3 {
    x: Float!
    y: Float!
    z: Float!
  }

  type GeospatialCoordinates {
    latitude: Float!
    longitude: Float!
    elevation: Float
  }

  enum ModelType {
    GLTF
    BIM
    IFC
    RVT
    OBJ
    FBX
  }

  enum ModelStatus {
    UPLOADING
    PROCESSING
    READY
    ERROR
    ARCHIVED
  }

  # Sensor and IoT Types
  type IoTDevice {
    id: ID!
    name: String!
    type: DeviceType!
    status: DeviceStatus!
    coordinates: GeospatialCoordinates
    modelId: String
    lastSeen: DateTime!
    batteryLevel: Int
    signalStrength: Int
    sensors: [Sensor!]!
    metadata: JSON
  }

  type Sensor {
    id: ID!
    type: SensorType!
    value: Float!
    unit: String!
    timestamp: DateTime!
    status: SensorStatus!
    thresholds: SensorThresholds
  }

  type SensorThresholds {
    min: Float
    max: Float
    warning: Float
    critical: Float
  }

  enum DeviceType {
    SENSOR
    ACTUATOR
    GATEWAY
    CAMERA
    WEATHER_STATION
  }

  enum DeviceStatus {
    ONLINE
    OFFLINE
    ERROR
    MAINTENANCE
  }

  enum SensorType {
    TEMPERATURE
    HUMIDITY
    PRESSURE
    VIBRATION
    FLOW
    POWER
    VOLTAGE
    CURRENT
    ACCELERATION
    GYROSCOPE
  }

  enum SensorStatus {
    NORMAL
    WARNING
    CRITICAL
    OFFLINE
  }

  # Fault Detection Types
  type DetectedFault {
    id: ID!
    modelId: String!
    deviceId: String
    title: String!
    description: String!
    severity: FaultSeverity!
    type: FaultType!
    status: FaultStatus!
    detectedAt: DateTime!
    resolvedAt: DateTime
    coordinates: GeospatialCoordinates
    affectedComponents: [String!]!
    diagnosticData: DiagnosticData
    recommendedActions: [String!]!
    assignedTo: String
  }

  type DiagnosticData {
    parameters: JSON
    trends: JSON
    correlations: [ParameterCorrelation!]!
    rootCause: RootCauseAnalysis
  }

  type ParameterCorrelation {
    parameter: String!
    correlation: Float!
    significance: String!
  }

  type RootCauseAnalysis {
    primaryCause: String!
    contributingFactors: [String!]!
    confidence: Float!
  }

  enum FaultSeverity {
    LOW
    MEDIUM
    HIGH
    CRITICAL
  }

  enum FaultType {
    PERFORMANCE
    STRUCTURAL
    ENVIRONMENTAL
    CONNECTIVITY
    DATA_QUALITY
  }

  enum FaultStatus {
    ACTIVE
    ACKNOWLEDGED
    RESOLVED
    FALSE_POSITIVE
  }

  # Analytics and Predictions
  type PredictiveAnalysis {
    id: ID!
    modelId: String!
    analysisType: AnalysisType!
    predictions: [Prediction!]!
    confidence: Float!
    timeframe: String!
    generatedAt: DateTime!
    parameters: JSON
  }

  type Prediction {
    parameter: String!
    predictedValue: Float!
    confidence: Float!
    timestamp: DateTime!
    trend: TrendDirection!
  }

  enum AnalysisType {
    ANOMALY_DETECTION
    FAILURE_PREDICTION
    PERFORMANCE_FORECAST
    MAINTENANCE_SCHEDULE
    ENERGY_OPTIMIZATION
  }

  enum TrendDirection {
    INCREASING
    DECREASING
    STABLE
    VOLATILE
  }

  # Notification Types
  type Notification {
    id: ID!
    type: NotificationType!
    title: String!
    message: String!
    severity: NotificationSeverity!
    timestamp: DateTime!
    read: Boolean!
    userId: String!
    metadata: JSON
    actions: [NotificationAction!]!
  }

  type NotificationAction {
    id: String!
    label: String!
    action: String!
    parameters: JSON
  }

  enum NotificationType {
    FAULT_DETECTED
    MAINTENANCE_DUE
    ANOMALY_DETECTED
    SYSTEM_ALERT
    MODEL_PROCESSED
    PREDICTION_READY
  }

  enum NotificationSeverity {
    INFO
    WARNING
    ERROR
    CRITICAL
  }

  # Dashboard Types
  type DashboardMetrics {
    totalModels: Int!
    activeDevices: Int!
    activeFaults: Int!
    systemHealth: Float!
    dataPoints: Int!
    lastUpdated: DateTime!
  }

  type SystemHealth {
    overall: Float!
    components: [ComponentHealth!]!
    trends: [HealthTrend!]!
  }

  type ComponentHealth {
    name: String!
    status: String!
    health: Float!
    lastChecked: DateTime!
  }

  type HealthTrend {
    timestamp: DateTime!
    value: Float!
  }

  # Input Types
  input ModelInput {
    name: String!
    description: String
    type: ModelType!
    coordinates: GeospatialCoordinatesInput
    tags: [String!]
  }

  input GeospatialCoordinatesInput {
    latitude: Float!
    longitude: Float!
    elevation: Float
  }

  input DeviceInput {
    name: String!
    type: DeviceType!
    coordinates: GeospatialCoordinatesInput
    modelId: String
    metadata: JSON
  }

  input SensorDataInput {
    deviceId: String!
    sensorType: SensorType!
    value: Float!
    unit: String!
    timestamp: DateTime
  }

  input FaultInput {
    modelId: String!
    deviceId: String
    title: String!
    description: String!
    severity: FaultSeverity!
    type: FaultType!
    coordinates: GeospatialCoordinatesInput
    affectedComponents: [String!]!
  }

  input PredictionRequest {
    modelId: String!
    analysisType: AnalysisType!
    timeframe: String!
    parameters: JSON
  }

  # Queries
  type Query {
    # Model Queries
    models(limit: Int, offset: Int, filter: String): [DigitalTwinModel!]!
    model(id: ID!): DigitalTwinModel
    modelsByType(type: ModelType!): [DigitalTwinModel!]!
    
    # Device and Sensor Queries
    devices(limit: Int, offset: Int): [IoTDevice!]!
    device(id: ID!): IoTDevice
    devicesByModel(modelId: String!): [IoTDevice!]!
    sensorData(deviceId: String!, from: DateTime, to: DateTime): [Sensor!]!
    
    # Fault Detection Queries
    faults(limit: Int, offset: Int, status: FaultStatus): [DetectedFault!]!
    fault(id: ID!): DetectedFault
    faultsByModel(modelId: String!): [DetectedFault!]!
    faultsByDevice(deviceId: String!): [DetectedFault!]!
    
    # Analytics Queries
    predictiveAnalysis(modelId: String!): [PredictiveAnalysis!]!
    anomalyDetection(deviceId: String!, timeframe: String!): JSON
    performanceMetrics(modelId: String!, timeframe: String!): JSON
    
    # Dashboard Queries
    dashboardMetrics: DashboardMetrics!
    systemHealth: SystemHealth!
    
    # Notification Queries
    notifications(limit: Int, offset: Int, unreadOnly: Boolean): [Notification!]!
    notification(id: ID!): Notification
  }

  # Mutations
  type Mutation {
    # Model Mutations
    uploadModel(file: Upload!, input: ModelInput!): DigitalTwinModel!
    updateModel(id: ID!, input: ModelInput!): DigitalTwinModel!
    deleteModel(id: ID!): Boolean!
    processModel(id: ID!): Boolean!
    
    # Device Mutations
    createDevice(input: DeviceInput!): IoTDevice!
    updateDevice(id: ID!, input: DeviceInput!): IoTDevice!
    deleteDevice(id: ID!): Boolean!
    
    # Sensor Data Mutations
    addSensorData(input: SensorDataInput!): Sensor!
    bulkAddSensorData(inputs: [SensorDataInput!]!): [Sensor!]!
    
    # Fault Detection Mutations
    createFault(input: FaultInput!): DetectedFault!
    acknowledgeFault(id: ID!): DetectedFault!
    resolveFault(id: ID!, resolution: String): DetectedFault!
    
    # Analytics Mutations
    requestPrediction(input: PredictionRequest!): PredictiveAnalysis!
    runAnomalyDetection(deviceId: String!, timeframe: String!): JSON
    
    # Notification Mutations
    markNotificationRead(id: ID!): Notification!
    markAllNotificationsRead: Boolean!
    deleteNotification(id: ID!): Boolean!
  }

  # Subscriptions
  type Subscription {
    # Real-time data subscriptions
    sensorDataUpdated(deviceId: String): Sensor!
    faultDetected: DetectedFault!
    deviceStatusChanged: IoTDevice!
    notificationReceived: Notification!
    modelProcessingStatus(modelId: String!): DigitalTwinModel!
    systemHealthUpdated: SystemHealth!
  }
`;
//# sourceMappingURL=schema.js.map