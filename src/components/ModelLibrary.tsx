import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Grid3X3,
  List,
  FileText,
  Box,
  Download,
  Eye,
  Trash2,
  SortAsc,
  SortDesc
} from 'lucide-react';
import { DigitalTwinModel } from '../types';
import { fileManagementService } from '../services/fileManagementService';
import { formatFileSize, formatDate } from '../utils/formatters';
import { palette, responsive } from '../styles/palette';

interface ModelLibraryProps {
  models: DigitalTwinModel[];
  onModelSelect: (model: DigitalTwinModel) => void;
  onModelDelete: (model: DigitalTwinModel) => void;
}

type SortField = 'name' | 'uploadDate' | 'size' | 'type';
type SortOrder = 'asc' | 'desc';
type ViewMode = 'grid' | 'list';

export const ModelLibrary: React.FC<ModelLibraryProps> = ({ models, onModelSelect, onModelDelete }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'gltf' | 'bim'>('all');
  const [sortField, setSortField] = useState<SortField>('uploadDate');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  const filteredAndSortedModels = useMemo(() => {
    let filtered = models.filter(model => {
      const matchesSearch = model.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filterType === 'all' || model.type === filterType;
      return matchesSearch && matchesFilter;
    });

    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortField) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'uploadDate':
          aValue = a.uploadDate.getTime();
          bValue = b.uploadDate.getTime();
          break;
        case 'size':
          aValue = a.size;
          bValue = b.size;
          break;
        case 'type':
          aValue = a.type;
          bValue = b.type;
          break;
        default:
          return 0;
      }

      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return filtered;
  }, [models, searchTerm, filterType, sortField, sortOrder]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleDownload = async (model: DigitalTwinModel) => {
    if (!fileManagementService.validateModel(model)) return;
    await fileManagementService.downloadModel(model);
  };

  const handleDelete = async (model: DigitalTwinModel) => {
    if (!fileManagementService.validateModel(model)) return;
    await fileManagementService.deleteModel(model, onModelDelete);
  };

  const ModelCard: React.FC<{ model: DigitalTwinModel }> = ({ model }) => (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 overflow-hidden group hover:border-blue-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10">
      {/* Model Preview */}
      <div className="aspect-video bg-gradient-to-br from-slate-700 to-slate-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-teal-500/10" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="p-3 md:p-4 bg-slate-700/50 rounded-xl">
            {model.type === 'gltf' ? (
              <Box className="w-6 h-6 md:w-8 md:h-8 text-blue-400" />
            ) : (
              <FileText className="w-6 h-6 md:w-8 md:h-8 text-teal-400" />
            )}
          </div>
        </div>

        {/* Overlay Actions */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center space-x-2">
          <button
            onClick={() => onModelSelect(model)}
            className="p-2 bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors"
            title="View Model"
          >
            <Eye className="w-4 h-4 text-white" />
          </button>
          <button
            onClick={() => handleDownload(model)}
            className="p-2 bg-slate-600 hover:bg-slate-700 rounded-lg transition-colors"
            title="Download"
          >
            <Download className="w-4 h-4 text-white" />
          </button>
          <button
            onClick={() => handleDelete(model)}
            className="p-2 bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
            title="Delete"
          >
            <Trash2 className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>

      {/* Model Info */}
      <div className="p-3 md:p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-white truncate flex-1 text-sm md:text-base">{model.name}</h3>
          <span className={`text-xs px-2 py-1 rounded-full ml-2 flex-shrink-0 ${model.type === 'gltf'
            ? 'bg-blue-500/20 text-blue-400'
            : 'bg-teal-500/20 text-teal-400'
            }`}>
            {model.type.toUpperCase()}
          </span>
        </div>

        <div className="space-y-1 text-xs md:text-sm text-slate-400">
          <div className="flex justify-between">
            <span>Size:</span>
            <span>{formatFileSize(model.size)}</span>
          </div>
          <div className="flex justify-between">
            <span>Uploaded:</span>
            <span>{formatDate(model.uploadDate)}</span>
          </div>
          {model.metadata && (
            <div className="flex justify-between">
              <span>Vertices:</span>
              <span>{model.metadata.vertices?.toLocaleString()}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const ModelRow: React.FC<{ model: DigitalTwinModel }> = ({ model }) => (
    <div className="flex items-center space-x-3 md:space-x-4 p-3 md:p-4 bg-slate-800/30 backdrop-blur-sm rounded-lg border border-slate-700/30 hover:border-blue-500/30 transition-all duration-200 group">
      <div className="flex-shrink-0">
        <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-slate-700 to-slate-800 rounded-lg flex items-center justify-center">
          {model.type === 'gltf' ? (
            <Box className="w-5 h-5 md:w-6 md:h-6 text-blue-400" />
          ) : (
            <FileText className="w-5 h-5 md:w-6 md:h-6 text-teal-400" />
          )}
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2 mb-1">
          <h3 className="font-medium text-white truncate text-sm md:text-base">{model.name}</h3>
          <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${model.type === 'gltf'
            ? 'bg-blue-500/20 text-blue-400'
            : 'bg-teal-500/20 text-teal-400'
            }`}>
            {model.type.toUpperCase()}
          </span>
        </div>
        <div className="flex items-center space-x-2 md:space-x-4 text-xs md:text-sm text-slate-400">
          <span>{formatFileSize(model.size)}</span>
          <span className="hidden sm:inline">{formatDate(model.uploadDate)}</span>
          {model.metadata && (
            <span className="hidden md:inline">{model.metadata.vertices?.toLocaleString()} vertices</span>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-1 md:space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onModelSelect(model)}
          className="p-1.5 md:p-2 bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors"
          title="View Model"
        >
          <Eye className="w-3 h-3 md:w-4 md:h-4 text-white" />
        </button>
        <button
          onClick={() => handleDownload(model)}
          className="p-1.5 md:p-2 bg-slate-600 hover:bg-slate-700 rounded-lg transition-colors"
          title="Download"
        >
          <Download className="w-3 h-3 md:w-4 md:h-4 text-white" />
        </button>
        <button
          onClick={() => handleDelete(model)}
          className="p-1.5 md:p-2 bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
          title="Delete"
        >
          <Trash2 className="w-3 h-3 md:w-4 md:h-4 text-white" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="h-full overflow-auto p-4 md:p-6 space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-400 to-teal-400 bg-clip-text text-transparent">
            Model Library
          </h1>
          <p className="text-slate-400 mt-1 text-sm md:text-base">{models.length} models available</p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg transition-colors ${viewMode === 'grid'
              ? 'bg-blue-500/20 text-blue-400'
              : 'bg-slate-700/50 text-slate-400 hover:text-white'
              }`}
          >
            <Grid3X3 className="w-4 h-4 md:w-5 md:h-5" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg transition-colors ${viewMode === 'list'
              ? 'bg-blue-500/20 text-blue-400'
              : 'bg-slate-700/50 text-slate-400 hover:text-white'
              }`}
          >
            <List className="w-4 h-4 md:w-5 md:h-5" />
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search models..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 md:pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-400 focus:border-blue-500/50 focus:outline-none text-sm md:text-base"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 md:w-5 md:h-5 text-slate-400 flex-shrink-0" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as 'all' | 'gltf' | 'bim')}
            className="bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-2 text-white focus:border-blue-500/50 focus:outline-none cursor-pointer text-sm md:text-base"
          >
            <option value="all">All Types</option>
            <option value="gltf">GLTF Models</option>
            <option value="bim">BIM Models</option>
          </select>
        </div>
      </div>

      {/* Sort Controls */}
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="text-slate-400">Sort by:</span>
        {(['name', 'uploadDate', 'size', 'type'] as SortField[]).map((field) => (
          <button
            key={field}
            onClick={() => handleSort(field)}
            className={`flex items-center space-x-1 px-3 py-1 rounded-lg transition-colors ${sortField === field
              ? 'bg-blue-500/20 text-blue-400'
              : 'text-slate-400 hover:text-white'
              }`}
          >
            <span className="capitalize">{field === 'uploadDate' ? 'Date' : field}</span>
            {sortField === field && (
              sortOrder === 'asc' ? <SortAsc className="w-3 h-3" /> : <SortDesc className="w-3 h-3" />
            )}
          </button>
        ))}
      </div>

      {/* Models Display */}
      {filteredAndSortedModels.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-4 bg-slate-700/50 rounded-xl flex items-center justify-center">
            <Box className="w-6 h-6 md:w-8 md:h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-medium text-white mb-2">No models found</h3>
          <p className="text-slate-400 text-sm md:text-base">
            {searchTerm || filterType !== 'all'
              ? 'Try adjusting your search or filters'
              : 'Upload your first 3D model to get started'
            }
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 md:gap-6">
          {filteredAndSortedModels.map((model) => (
            <ModelCard key={model.id} model={model} />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAndSortedModels.map((model) => (
            <ModelRow key={model.id} model={model} />
          ))}
        </div>
      )}
    </div>
  );
};