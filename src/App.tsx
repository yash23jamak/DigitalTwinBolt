import { useState, lazy, Suspense } from 'react';
import { Sidebar } from './components/Sidebar';
import { NotificationContainer } from './components/NotificationContainer';
import { ErrorBoundary } from './components/ErrorBoundary';
import { DigitalTwinModel, ViewType } from './types';
import './test/notificationTest';

// Lazy-loaded components
const ModelViewer = lazy(() => import('./components/ModelViewer').then(module => ({ default: module.ModelViewer })));
const Dashboard = lazy(() => import('./components/Dashboard').then(module => ({ default: module.Dashboard })));
const FaultDetectionDashboard = lazy(() => import('./components/FaultDetectionDashboard').then(module => ({ default: module.FaultDetectionDashboard })));
const FileUpload = lazy(() => import('./components/FileUpload').then(module => ({ default: module.FileUpload })));
const ModelLibrary = lazy(() => import('./components/ModelLibrary').then(module => ({ default: module.ModelLibrary })));
const ArcGISMap = lazy(() => import('./components/ArcGISMap').then(module => ({ default: module.ArcGISMap })));

// Loading component
const LoadingFallback = () => (
  <div className="flex items-center justify-center h-full w-full bg-slate-100">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
  </div>
);

function App() {
  const [currentView, setCurrentView] = useState<ViewType>('viewer');
  const [models, setModels] = useState<DigitalTwinModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<DigitalTwinModel | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleModelUpload = (model: DigitalTwinModel) => {
    // Check if model already exists to prevent duplicates
    const existingModel = models.find(m =>
      m.id === model.id ||
      (m.name === model.name && m.size === model.size)
    );

    if (existingModel) {
      console.log('Model already exists, skipping duplicate:', model.name);
      return;
    }

    setModels(prev => [...prev, model]);
    setSelectedModel(model);
    setCurrentView('viewer');
  };

  const handleModelSelect = (model: DigitalTwinModel) => {
    setSelectedModel(model);
    setCurrentView('viewer');
  };

  const handleLocationSelect = (coordinates: { latitude: number; longitude: number }) => {
    // Handle location selection from GIS map
    console.log('Location selected:', coordinates);
  };

  const handleModelUpdate = (updatedModel: DigitalTwinModel) => {
    setModels(prev => prev.map(model =>
      model.id === updatedModel.id ? updatedModel : model
    ));
    if (selectedModel?.id === updatedModel.id) {
      setSelectedModel(updatedModel);
    }
  };

  const handleModelDelete = (modelToDelete: DigitalTwinModel) => {
    setModels(prev => prev.filter(model => model.id !== modelToDelete.id));
    if (selectedModel?.id === modelToDelete.id) {
      setSelectedModel(null);
    }
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
        <div className="flex h-screen">
          <Sidebar
            currentView={currentView}
            onViewChange={setCurrentView}
            modelCount={models.length}
            isOpen={sidebarOpen}
            onToggle={toggleSidebar}
          />

          <main className="flex-1 overflow-hidden relative lg:ml-0">
            <Suspense fallback={<LoadingFallback />}>
              {currentView === 'viewer' && (
                <ModelViewer
                  model={selectedModel}
                  models={models}
                  onModelSelect={handleModelSelect}
                />
              )}
              {currentView === 'gis' && (
                <ArcGISMap
                  models={models}
                  selectedModel={selectedModel}
                  onModelSelect={handleModelSelect}
                  onLocationSelect={handleLocationSelect}
                  onModelUpdate={handleModelUpdate}
                  onModelDelete={handleModelDelete}
                />
              )}
              {currentView === 'dashboard' && (
                <Dashboard models={models} selectedModel={selectedModel} />
              )}
              {currentView === 'faults' && (
                <FaultDetectionDashboard models={models} selectedModel={selectedModel} />
              )}
              {currentView === 'upload' && (
                <FileUpload onModelUpload={handleModelUpload} />
              )}
              {currentView === 'library' && (
                <ModelLibrary
                  models={models}
                  onModelSelect={handleModelSelect}
                  onModelDelete={handleModelDelete}
                />
              )}
            </Suspense>
          </main>
        </div>

        {/* Global Notification Container */}
        <NotificationContainer />
      </div>
    </ErrorBoundary>
  );
}

export default App;

