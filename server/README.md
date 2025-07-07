# Digital Twin Platform - Backend Server

A comprehensive Node.js backend server with Azure integration, GraphQL API, and real-time capabilities for the Digital Twin Platform.

## Features

### 🚀 Core Services
- **File Management**: Upload, process, and manage 3D models with Azure Blob Storage
- **Predictive Analytics**: AI-powered predictions using Azure Cognitive Services
- **Fault Detection**: Real-time fault detection and diagnostics
- **Real-time Data**: IoT sensor data processing and streaming
- **Notifications**: Comprehensive notification system with real-time updates

### 🔧 Technology Stack
- **Runtime**: Node.js with TypeScript
- **API**: GraphQL with Apollo Server
- **Database**: Azure Cosmos DB
- **Storage**: Azure Blob Storage
- **Messaging**: Azure Service Bus
- **AI Services**: Azure Anomaly Detector, Text Analytics
- **Real-time**: Socket.IO
- **Caching**: Redis
- **Authentication**: JWT

### 📊 Azure Integration
- **Cosmos DB**: Document storage for models, devices, faults, predictions
- **Blob Storage**: File storage for 3D models and assets
- **Service Bus**: Message queuing for real-time notifications
- **Anomaly Detector**: AI-powered anomaly detection
- **Text Analytics**: Sentiment analysis and text processing
- **Application Insights**: Monitoring and telemetry

## Quick Start

### Prerequisites
- Node.js 18+ and npm
- Azure subscription with required services
- Redis server (local or cloud)

### Installation

1. **Clone and install dependencies**:
```bash
cd server
npm install
```

2. **Environment setup**:
```bash
cp .env.example .env
# Edit .env with your Azure credentials and configuration
```

3. **Required Azure Services**:
   - Azure Storage Account
   - Azure Cosmos DB
   - Azure Service Bus
   - Azure Anomaly Detector
   - Azure Text Analytics
   - Redis Cache

4. **Start development server**:
```bash
npm run dev
```

5. **Build for production**:
```bash
npm run build
npm start
```

## API Endpoints

### GraphQL Endpoint
- **URL**: `http://localhost:4000/graphql`
- **Playground**: Available in development mode

### REST Endpoints
- **Health Check**: `GET /health`
- **File Upload**: `POST /api/upload`

### WebSocket
- **Real-time updates**: `ws://localhost:4000`

## GraphQL Schema

### Key Types
- `DigitalTwinModel`: 3D model management
- `IoTDevice`: IoT device and sensor data
- `DetectedFault`: Fault detection and diagnostics
- `PredictiveAnalysis`: AI predictions and forecasts
- `Notification`: System notifications

### Example Queries

**Get all models**:
```graphql
query GetModels {
  models(limit: 10) {
    id
    name
    type
    status
    uploadDate
    metadata {
      vertices
      faces
    }
  }
}
```

**Upload a model**:
```graphql
mutation UploadModel($file: Upload!, $input: ModelInput!) {
  uploadModel(file: $file, input: $input) {
    id
    name
    fileUrl
    status
  }
}
```

**Get fault detection data**:
```graphql
query GetFaults {
  faults(status: ACTIVE) {
    id
    title
    severity
    detectedAt
    affectedComponents
  }
}
```

**Request predictions**:
```graphql
mutation RequestPrediction($input: PredictionRequest!) {
  requestPrediction(input: $input) {
    id
    predictions {
      parameter
      predictedValue
      confidence
      trend
    }
  }
}
```

## Real-time Features

### Socket.IO Events
- `sensor-data`: Real-time sensor updates
- `fault-detected`: New fault notifications
- `device-status`: Device status changes
- `notification`: System notifications

### Subscriptions
```graphql
subscription OnFaultDetected {
  faultDetected {
    id
    title
    severity
    modelId
  }
}

subscription OnSensorData($deviceId: String!) {
  sensorDataUpdated(deviceId: $deviceId) {
    value
    timestamp
    status
  }
}
```

## Services Architecture

### File Service
- Multi-format 3D model support (GLTF, BIM, IFC, RVT)
- Automatic metadata extraction
- Thumbnail generation
- File validation and processing

### Prediction Service
- Anomaly detection using Azure AI
- Failure prediction algorithms
- Performance forecasting
- Maintenance scheduling
- Energy optimization

### Fault Detection Service
- Rule-based fault detection
- Real-time sensor monitoring
- Diagnostic data generation
- Automated notifications
- Root cause analysis

### Notification Service
- Multi-channel notifications
- Real-time delivery
- Action-based notifications
- User preference management

## Development

### Project Structure
```
server/
├── src/
│   ├── graphql/          # GraphQL schema and resolvers
│   ├── services/         # Business logic services
│   ├── middleware/       # Express middleware
│   ├── utils/           # Utility functions
│   └── types/           # TypeScript type definitions
├── logs/                # Application logs
└── dist/               # Compiled JavaScript
```

### Scripts
- `npm run dev`: Start development server with hot reload
- `npm run build`: Build for production
- `npm start`: Start production server
- `npm test`: Run tests
- `npm run lint`: Run ESLint
- `npm run lint:fix`: Fix ESLint issues

### Environment Variables
See `.env.example` for all required configuration options.

## Deployment

### Azure App Service
1. Build the application: `npm run build`
2. Deploy to Azure App Service
3. Configure environment variables
4. Set up Azure services integration

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 4000
CMD ["node", "dist/index.js"]
```

## Monitoring

### Application Insights
- Automatic telemetry collection
- Performance monitoring
- Error tracking
- Custom metrics

### Health Checks
- `/health` endpoint for load balancer checks
- Database connectivity verification
- Azure services status

## Security

### Authentication
- JWT-based authentication
- Token validation middleware
- User context in GraphQL resolvers

### Rate Limiting
- Redis-based rate limiting
- Configurable limits per endpoint
- IP-based throttling

### Data Protection
- Input validation with Joi
- SQL injection prevention
- XSS protection with Helmet

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License - see LICENSE file for details