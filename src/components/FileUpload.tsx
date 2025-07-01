import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Upload,
  CheckCircle,
  AlertCircle,
  X,
  Cloud,
  Zap,
  File as FileIcon
} from 'lucide-react';
import { DigitalTwinModel, UploadFile, FileUploadProps } from '../types';
import { SUPPORTED_FILE_FORMATS, FILE_ACCEPT_TYPES, MAX_FILE_SIZE } from '../utils/constants';
import { generateId } from '../utils/helpers';



export const FileUpload: React.FC<FileUploadProps> = ({ onModelUpload }) => {
  const [files, setFiles] = useState<UploadFile[]>([]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: UploadFile[] = acceptedFiles.map(file => ({
      id: generateId(),
      file: file,
      progress: 0,
      status: 'uploading' as const
    }));

    setFiles(prev => [...prev, ...newFiles]);

    // Simulate file upload with progress
    newFiles.forEach(uploadFile => {
      simulateUpload(uploadFile);
    });
  }, []);

  const simulateUpload = (uploadFile: UploadFile) => {
    const interval = setInterval(() => {
      setFiles(prev => prev.map(f => {
        if (f.id === uploadFile.id) {
          const newProgress = f.progress + Math.random() * 15;
          if (newProgress >= 100) {
            clearInterval(interval);
            // Create model object using the original file
            const model: DigitalTwinModel = {
              id: f.id,
              name: f.file.name,
              url: URL.createObjectURL(f.file),
              type: f.file.name.toLowerCase().endsWith('.gltf') || f.file.name.toLowerCase().endsWith('.glb') ? 'gltf' : 'bim',
              uploadDate: new Date(),
              size: f.file.size,
              metadata: {
                vertices: Math.floor(Math.random() * 50000) + 10000,
                faces: Math.floor(Math.random() * 25000) + 5000,
                materials: Math.floor(Math.random() * 10) + 1,
                animations: Math.floor(Math.random() * 5)
              }
            };

            onModelUpload(model);

            return { ...f, progress: 100, status: 'success' as const };
          }
          return { ...f, progress: newProgress };
        }
        return f;
      }));
    }, 100);
  };

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: FILE_ACCEPT_TYPES,
    maxSize: MAX_FILE_SIZE,
    multiple: true
  });

  return (
    <div className="h-full overflow-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-teal-400 bg-clip-text text-transparent">
            Upload 3D Models
          </h1>
          <p className="text-slate-400 mt-1">Drag and drop your GLTF or BIM files to get started</p>
        </div>
        <div className="flex items-center space-x-2 text-slate-400">
          <Cloud className="w-5 h-5" />
          <span className="text-sm">Max file size: 100MB</span>
        </div>
      </div>

      {/* Upload Zone */}
      <div
        {...getRootProps()}
        className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 cursor-pointer ${isDragActive
          ? 'border-blue-500 bg-blue-500/10 scale-105'
          : 'border-slate-600 hover:border-slate-500 hover:bg-slate-800/30'
          }`}
      >
        <input {...getInputProps()} />

        <div className="relative z-10">
          <div className={`mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-6 transition-all duration-300 ${isDragActive
            ? 'bg-gradient-to-r from-blue-500 to-teal-500 scale-110'
            : 'bg-slate-700/50'
            }`}>
            {isDragActive ? (
              <Zap className="w-10 h-10 text-white" />
            ) : (
              <Upload className="w-10 h-10 text-slate-400" />
            )}
          </div>

          <h3 className="text-xl font-semibold text-white mb-2">
            {isDragActive ? 'Drop files here' : 'Upload your 3D models'}
          </h3>

          <p className="text-slate-400 mb-6">
            {isDragActive
              ? 'Release to upload your files'
              : 'Drag and drop files here, or click to browse'
            }
          </p>

          <div className="inline-flex items-center space-x-2 bg-slate-800/50 rounded-lg px-4 py-2">
            <FileIcon className="w-4 h-4 text-blue-400" />
            <span className="text-sm text-slate-300">GLTF, GLB, BIM, IFC, RVT</span>
          </div>
        </div>

        {/* Background Animation */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-teal-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      {/* Supported Formats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {SUPPORTED_FILE_FORMATS.map((format, index) => (
          <div key={index} className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50">
            <div className="flex items-center space-x-3 mb-2">
              <div className="p-2 bg-gradient-to-r from-blue-500/20 to-teal-500/20 rounded-lg">
                <format.icon className="w-5 h-5 text-blue-400" />
              </div>
              <span className="font-medium text-white">{format.ext}</span>
            </div>
            <p className="text-sm text-slate-400">{format.desc}</p>
          </div>
        ))}
      </div>

      {/* Upload Progress */}
      {files.length > 0 && (
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
          <h3 className="text-lg font-semibold text-white mb-4">Upload Progress</h3>
          <div className="space-y-3">
            {files.map((file) => (
              <div key={file.id} className="flex items-center space-x-4 p-3 bg-slate-700/30 rounded-lg">
                <div className="flex-shrink-0">
                  {file.status === 'success' ? (
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  ) : file.status === 'error' ? (
                    <AlertCircle className="w-5 h-5 text-red-400" />
                  ) : (
                    <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-white truncate">{file.file.name}</span>
                    <span className="text-xs text-slate-400">
                      {(file.file.size / 1024 / 1024).toFixed(1)} MB
                    </span>
                  </div>

                  <div className="w-full bg-slate-600/30 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${file.status === 'success'
                        ? 'bg-green-500'
                        : file.status === 'error'
                          ? 'bg-red-500'
                          : 'bg-gradient-to-r from-blue-500 to-teal-500'
                        }`}
                      style={{ width: `${file.progress}%` }}
                    />
                  </div>

                  {file.status === 'success' && (
                    <div className="text-xs text-green-400 mt-1">Upload complete</div>
                  )}
                  {file.status === 'error' && (
                    <div className="text-xs text-red-400 mt-1">{file.error || 'Upload failed'}</div>
                  )}
                </div>

                <button
                  onClick={() => removeFile(file.id)}
                  className="flex-shrink-0 p-1 hover:bg-slate-600/50 rounded transition-colors"
                >
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Tips */}
      <div className="bg-slate-800/30 backdrop-blur-sm rounded-xl p-6 border border-slate-700/30">
        <h3 className="text-lg font-semibold text-white mb-3">Upload Tips</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-400">
          <div className="space-y-2">
            <div className="flex items-start space-x-2">
              <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
              <span>Optimize models before upload to reduce file size</span>
            </div>
            <div className="flex items-start space-x-2">
              <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
              <span>Include textures and materials in GLTF files</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-start space-x-2">
              <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
              <span>Use descriptive filenames for easy identification</span>
            </div>
            <div className="flex items-start space-x-2">
              <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
              <span>Multiple files can be uploaded simultaneously</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};