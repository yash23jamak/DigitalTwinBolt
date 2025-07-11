import { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { ModelViewer } from './components/ModelViewer';
import { Dashboard } from './components/Dashboard';
import { FaultDetectionDashboard } from './components/FaultDetectionDashboard';
import { FileUpload } from './components/FileUpload';
import { ModelLibrary } from './components/ModelLibrary';
import { ArcGISMap } from './components/ArcGISMap';
import { SensorManagement } from './components/SensorManagement';
import { UserManagement } from './components/UserManagement';
import { NotificationContainer } from './components/NotificationContainer';
import { DigitalTwinModel, ViewType } from './types';
import { palette, responsive } from './styles/palette';
import './test/notificationTest';

function App() {
  const [currentView, setCurrentView] = useState<ViewType>('sensors');
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
          {currentView === 'sensors' && (
            <SensorManagement models={models} />
          )}
          {currentView === 'users' && (
            <UserManagement />
          )}
        </main>
      </div>

      {/* Global Notification Container */}
      <NotificationContainer />
    </div>
  );
}

export default App;