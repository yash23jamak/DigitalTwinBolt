import React, { Suspense, useRef, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import {
  OrbitControls,
  PerspectiveCamera,
  Environment,
  ContactShadows,
  useGLTF,
  Html,
  Stats
} from '@react-three/drei';
import {
  RotateCcw,
  Sun,
  Eye,
  Grid3X3,
  Info,
  MousePointer,
  Layers
} from 'lucide-react';
import { DigitalTwinModel, ModelViewerProps, SelectedPart, LightingPreset } from '../types';
import { LIGHTING_PRESETS, CAMERA_POSITIONS, GRID_SIZE, GRID_DIVISIONS, GRID_COLOR_PRIMARY, GRID_COLOR_SECONDARY } from '../utils/constants';
import { palette, responsive } from '../styles/palette';
import * as THREE from 'three';

const Model: React.FC<{
  url: string;
  onPartClick: (part: SelectedPart) => void;
  selectedPart: SelectedPart | null;
  wireframe: boolean;
  onModelLoaded?: (boundingBox: THREE.Box3) => void;
}> = ({ url, onPartClick, selectedPart, wireframe, onModelLoaded }) => {
  const { scene } = useGLTF(url);
  const meshRef = useRef<any>();
  const { camera, raycaster, pointer } = useThree();
  const originalMaterials = useRef<Map<string, THREE.Material>>(new Map());
  const modelLoadedRef = useRef(false);
  const highlightedMeshRef = useRef<THREE.Mesh | null>(null);

  React.useEffect(() => {
    modelLoadedRef.current = false;
  }, [url]);

  React.useEffect(() => {
    if (scene && !modelLoadedRef.current) {
      const box = new THREE.Box3().setFromObject(scene);
      const center = box.getCenter(new THREE.Vector3());

      scene.position.sub(center);

      originalMaterials.current.clear();

      scene.traverse((child: any) => {
        if (child.isMesh) {
          if (child.material) {
            const materials = Array.isArray(child.material) ? child.material : [child.material];
            materials.forEach((material: any, index: number) => {
              const key = `${child.uuid}_${index}`;
              originalMaterials.current.set(key, material.clone());

              if (child.geometry.attributes.color) {
                material.vertexColors = true;
              }

              if (material.map) {
                material.map.colorSpace = THREE.SRGBColorSpace;
              }
              if (material.emissiveMap) {
                material.emissiveMap.colorSpace = THREE.SRGBColorSpace;
              }

              material.needsUpdate = true;
            });
          }

          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      if (onModelLoaded) {
        onModelLoaded(box);
      }

      modelLoadedRef.current = true;
    }
  }, [scene, onModelLoaded]);

  React.useEffect(() => {
    if (meshRef.current) {
      meshRef.current.traverse((child: any) => {
        if (child.isMesh && child.material) {
          const materials = Array.isArray(child.material) ? child.material : [child.material];
          materials.forEach((material: any) => {
            material.wireframe = wireframe;
          });
        }
      });
    }
  }, [wireframe]);

  const handleClick = (event: any) => {
    event.stopPropagation();

    raycaster.setFromCamera(pointer, camera);

    const intersects = raycaster.intersectObject(meshRef.current, true);

    if (intersects.length > 0) {
      const intersection = intersects[0];
      const object = intersection.object as THREE.Mesh;

      console.log('Clicked object:', {
        name: object.name,
        uuid: object.uuid,
        type: object.type,
        material: object.material,
        hasEmissive: object.material && 'emissive' in object.material,
        hasColor: object.material && 'color' in object.material
      });

      highlightedMeshRef.current = object;

      const partInfo: SelectedPart = {
        name: object.name || object.parent?.name || `Part_${object.uuid.slice(0, 8)}`,
        type: object.type || 'Mesh',
        material: object.material ? (object.material as any).name || 'Default Material' : 'No Material',
        position: intersection.point,
        boundingBox: new THREE.Box3().setFromObject(object),
        userData: {
          ...object.userData,
          uuid: object.uuid,
          parentUuid: object.parent?.uuid
        }
      };

      console.log('Part selected:', partInfo);
      onPartClick(partInfo);
    }
  };

  React.useEffect(() => {
    if (meshRef.current) {
      meshRef.current.traverse((child: any) => {
        if (child.isMesh && child.material) {
          const materials = Array.isArray(child.material) ? child.material : [child.material];

          materials.forEach((material: any) => {

            if (selectedPart &&
              (child.uuid === selectedPart.userData?.uuid ||
                child.name === selectedPart.name ||
                (child.parent && child.parent.name === selectedPart.name))) {

              console.log('Highlighting part:', selectedPart.name, 'Material type:', material.type);

              if (!material.userData.isHighlighted) {
                material.userData.originalColor = material.color ? material.color.clone() : null;
                material.userData.originalEmissive = material.emissive ? material.emissive.clone() : null;
                material.userData.originalEmissiveIntensity = material.emissiveIntensity || 0;
                material.userData.originalOpacity = material.opacity || 1;
                material.userData.originalTransparent = material.transparent || false;
                material.userData.isHighlighted = true;
              }

              if (material.emissive) {
                material.emissive.setHex(0x0066ff);
                if ('emissiveIntensity' in material) {
                  material.emissiveIntensity = 0.8;
                }
              }

              if (material.color) {
                const originalColor = material.userData.originalColor;
                if (originalColor) {
                  material.color.setRGB(
                    Math.min(1, originalColor.r + 0.3),
                    Math.min(1, originalColor.g + 0.3),
                    Math.min(1, originalColor.b + 0.8)
                  );
                } else {
                  material.color.setHex(0x4488ff);
                }
              }

              if ('transparent' in material && 'opacity' in material) {
                material.transparent = true;
                material.opacity = 0.9;
              }

            } else {
              if (material.userData.isHighlighted) {

                if (material.emissive && material.userData.originalEmissive) {
                  material.emissive.copy(material.userData.originalEmissive);
                } else if (material.emissive) {
                  material.emissive.setHex(0x000000);
                }

                if ('emissiveIntensity' in material) {
                  material.emissiveIntensity = material.userData.originalEmissiveIntensity || 0;
                }

                if (material.color && material.userData.originalColor) {
                  material.color.copy(material.userData.originalColor);
                }

                if ('opacity' in material) {
                  material.opacity = material.userData.originalOpacity || 1;
                }
                if ('transparent' in material) {
                  material.transparent = material.userData.originalTransparent || false;
                }

                delete material.userData.isHighlighted;
                delete material.userData.originalColor;
                delete material.userData.originalEmissive;
                delete material.userData.originalEmissiveIntensity;
                delete material.userData.originalOpacity;
                delete material.userData.originalTransparent;
              }
            }

            material.needsUpdate = true;
          });
        }
      });
    }
  }, [selectedPart]);

  return (
    <primitive
      ref={meshRef}
      object={scene}
      scale={[1, 1, 1]}
      onClick={handleClick}
    />
  );
};

const LoadingScreen: React.FC = () => (
  <Html center>
    <div className="flex flex-col items-center space-y-4 p-6 md:p-8 bg-slate-800/90 backdrop-blur-sm rounded-xl border border-slate-700/50">
      <div className="w-10 h-10 md:w-12 md:h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      <div className="text-white font-medium text-sm md:text-base">Loading 3D Model...</div>
      <div className="text-slate-400 text-xs md:text-sm">Processing geometry and materials</div>
    </div>
  </Html>
);

export const ModelViewer: React.FC<ModelViewerProps> = ({ model, models, onModelSelect }) => {
  const [wireframe, setWireframe] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [lighting, setLighting] = useState<LightingPreset>('studio');
  const [selectedPart, setSelectedPart] = useState<SelectedPart | null>(null);
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  const cameraRef = useRef<any>();
  const orbitControlsRef = useRef<any>();

  const fitCameraToModel = (boundingBox: THREE.Box3) => {
    if (!cameraRef.current) return;

    const size = boundingBox.getSize(new THREE.Vector3());
    const center = boundingBox.getCenter(new THREE.Vector3());

    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = cameraRef.current.fov * (Math.PI / 180);
    const distance = Math.abs(maxDim / Math.sin(fov / 2)) * 1.2;

    const direction = new THREE.Vector3(1, 1, 1).normalize();
    const position = center.clone().add(direction.multiplyScalar(distance));

    cameraRef.current.position.copy(position);
    cameraRef.current.lookAt(center);

    if (orbitControlsRef.current) {
      orbitControlsRef.current.target.copy(center);
      orbitControlsRef.current.update();
    }
  };

  const resetCamera = () => {
    if (cameraRef.current) {
      cameraRef.current.position.set(...CAMERA_POSITIONS.DEFAULT);
      cameraRef.current.lookAt(0, 0, 0);

      if (orbitControlsRef.current) {
        orbitControlsRef.current.target.set(0, 0, 0);
        orbitControlsRef.current.update();
      }
    }
  };

  const handlePartClick = (part: SelectedPart) => {
    setSelectedPart(part);
  };

  const clearSelection = () => {
    setSelectedPart(null);
  };

  return (
    <div className="h-full relative">
      {/* Controls Bar */}
      <div className="absolute top-4 left-4 right-4 z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="flex items-center space-x-2 bg-slate-800/80 backdrop-blur-sm rounded-xl p-2 border border-slate-700/50">
          <button
            onClick={resetCamera}
            className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors text-slate-300 hover:text-white"
            title="Reset Camera"
          >
            <RotateCcw className="w-4 h-4 md:w-5 md:h-5" />
          </button>
          <div className="w-px h-6 bg-slate-600" />
          <button
            onClick={() => setWireframe(!wireframe)}
            className={`p-2 rounded-lg transition-colors ${wireframe
              ? 'bg-blue-500/20 text-blue-400'
              : 'hover:bg-slate-700/50 text-slate-300 hover:text-white'
              }`}
            title="Toggle Wireframe"
          >
            <Grid3X3 className="w-4 h-4 md:w-5 md:h-5" />
          </button>
          <button
            onClick={() => setShowGrid(!showGrid)}
            className={`p-2 rounded-lg transition-colors ${showGrid
              ? 'bg-blue-500/20 text-blue-400'
              : 'hover:bg-slate-700/50 text-slate-300 hover:text-white'
              }`}
            title="Toggle Grid"
          >
            <Eye className="w-4 h-4 md:w-5 md:h-5" />
          </button>
          <button
            onClick={() => setShowDebugInfo(!showDebugInfo)}
            className={`p-2 rounded-lg transition-colors ${showDebugInfo
              ? 'bg-blue-500/20 text-blue-400'
              : 'hover:bg-slate-700/50 text-slate-300 hover:text-white'
              }`}
            title="Toggle Debug Info"
          >
            <Info className="w-4 h-4 md:w-5 md:h-5" />
          </button>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
          <div className="flex items-center space-x-2 bg-slate-800/80 backdrop-blur-sm rounded-xl p-2 border border-slate-700/50">
            <select
              value={lighting}
              onChange={(e) => setLighting(e.target.value as LightingPreset)}
              className="bg-slate-700/50 text-white rounded-lg px-3 py-1 text-sm border border-slate-600/50 focus:border-blue-500/50 focus:outline-none"
            >
              {LIGHTING_PRESETS.map(preset => (
                <option key={preset} value={preset}>
                  {preset.charAt(0).toUpperCase() + preset.slice(1)}
                </option>
              ))}
            </select>
            <Sun className="w-4 h-4 text-slate-400" />
          </div>

          {model && !selectedPart && (
            <div className="flex items-center space-x-2 bg-blue-500/20 backdrop-blur-sm rounded-xl p-2 border border-blue-500/30">
              <MousePointer className="w-4 h-4 text-blue-400" />
              <span className="text-blue-400 text-xs md:text-sm">Click on model parts to view details</span>
            </div>
          )}
        </div>
      </div>

      {/* Responsive Info Panels */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Model Info Panel */}
        {model && (
          <div className="absolute top-4 right-4 mt-16 lg:mt-20 z-10 w-72 lg:w-80 pointer-events-auto">
            <div className="bg-slate-800/80 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50">
              <div className="flex items-center space-x-2 mb-3">
                <Info className="w-4 h-4 md:w-5 md:h-5 text-blue-400" />
                <h3 className="font-medium text-white text-sm md:text-base">Model Information</h3>
              </div>
              <div className="space-y-2 text-xs md:text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Name:</span>
                  <span className="text-white truncate ml-2">{model.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Type:</span>
                  <span className="text-white uppercase">{model.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Size:</span>
                  <span className="text-white">{(model.size / 1024 / 1024).toFixed(2)} MB</span>
                </div>
                {model.metadata && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Vertices:</span>
                      <span className="text-white">{model.metadata.vertices?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Faces:</span>
                      <span className="text-white">{model.metadata.faces?.toLocaleString()}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Debug Panel */}
        {showDebugInfo && model && (
          <div className="absolute bottom-4 left-4 z-10 w-72 lg:w-80 max-h-60 overflow-y-auto pointer-events-auto">
            <div className="bg-slate-800/80 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <Info className="w-4 h-4 md:w-5 md:h-5 text-yellow-400" />
                  <h3 className="font-medium text-white text-sm md:text-base">Debug Information</h3>
                </div>
                <button
                  onClick={() => setShowDebugInfo(false)}
                  className="p-1 hover:bg-slate-700/50 rounded transition-colors text-slate-400 hover:text-white"
                  title="Close Debug Panel"
                >
                  ×
                </button>
              </div>
              <div className="space-y-2 text-xs md:text-sm">
                <div className="text-yellow-400 font-medium">Rendering Settings:</div>
                <div className="text-slate-300 text-xs space-y-1 ml-2">
                  <div>• Tone Mapping: ACES Filmic</div>
                  <div>• Color Space: sRGB</div>
                  <div>• Shadows: Enabled</div>
                  <div>• Wireframe: {wireframe ? 'On' : 'Off'}</div>
                  <div>• Environment: {lighting}</div>
                </div>
                <div className="text-yellow-400 font-medium mt-3">Tips for Color Issues:</div>
                <div className="text-slate-300 text-xs space-y-1 ml-2">
                  <div>• Ensure GLTF includes embedded textures</div>
                  <div>• Check if model has vertex colors</div>
                  <div>• Try different lighting presets</div>
                  <div>• Toggle wireframe to see geometry</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Selected Part Details Panel */}
        {selectedPart && (
          <div className="absolute top-4 right-4 mt-80 lg:mt-96 z-10 w-72 lg:w-80 pointer-events-auto">
            <div className="bg-slate-800/80 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <Layers className="w-4 h-4 md:w-5 md:h-5 text-blue-400" />
                  <h3 className="font-medium text-white text-sm md:text-base">Selected Part</h3>
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" title="Part highlighted in blue"></div>
                </div>
                <button
                  onClick={clearSelection}
                  className="p-1 hover:bg-slate-700/50 rounded transition-colors text-slate-400 hover:text-white"
                  title="Clear Selection"
                >
                  ×
                </button>
              </div>
              <div className="space-y-2 text-xs md:text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Name:</span>
                  <span className="text-white truncate ml-2">{selectedPart.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Type:</span>
                  <span className="text-white">{selectedPart.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Material:</span>
                  <span className="text-white truncate ml-2">{selectedPart.material}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Position:</span>
                  <span className="text-white text-xs">
                    ({selectedPart.position.x.toFixed(2)}, {selectedPart.position.y.toFixed(2)}, {selectedPart.position.z.toFixed(2)})
                  </span>
                </div>
                {selectedPart.boundingBox && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Size:</span>
                    <span className="text-white text-xs">
                      {selectedPart.boundingBox.getSize(new THREE.Vector3()).x.toFixed(2)} × {' '}
                      {selectedPart.boundingBox.getSize(new THREE.Vector3()).y.toFixed(2)} × {' '}
                      {selectedPart.boundingBox.getSize(new THREE.Vector3()).z.toFixed(2)}
                    </span>
                  </div>
                )}
                {selectedPart.userData && Object.keys(selectedPart.userData).length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-600">
                    <span className="text-slate-400 text-xs">Custom Properties:</span>
                    <div className="mt-1 space-y-1">
                      {Object.entries(selectedPart.userData).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="text-slate-400 text-xs">{key}:</span>
                          <span className="text-white text-xs truncate ml-2">{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3D Canvas */}
      <div
        className="h-full bg-gradient-to-b from-slate-900 to-slate-800"
        role="region"
        aria-label="3D Model Viewer"
      >
        <Canvas
          aria-hidden="true" // Mark as hidden since it's not accessible
          shadows
          gl={{
            antialias: true,
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1,
            outputColorSpace: THREE.SRGBColorSpace
          }}
        >
          <PerspectiveCamera ref={cameraRef} makeDefault position={CAMERA_POSITIONS.DEFAULT} />

          <ambientLight intensity={0.6} />
          <directionalLight
            position={[10, 10, 5]}
            intensity={1.2}
            castShadow
          />
          <pointLight position={[-10, -10, -10]} intensity={0.3} />
          <hemisphereLight args={['#ffffff', '#60a5fa', 0.4]} />

          <Environment preset={lighting} />

          {showGrid && (
            <gridHelper args={[GRID_SIZE, GRID_DIVISIONS, GRID_COLOR_PRIMARY, GRID_COLOR_SECONDARY]} />
          )}

          {model ? (
            <Suspense fallback={<LoadingScreen />}>
              <Model
                url={model.url}
                onPartClick={handlePartClick}
                selectedPart={selectedPart}
                wireframe={wireframe}
                onModelLoaded={fitCameraToModel}
              />
              <ContactShadows
                position={[0, -1, 0]}
                opacity={0.4}
                scale={10}
                blur={2}
                far={4}
              />
            </Suspense>
          ) : (
            <Html center>
              <div className="text-center min-w-mc p-6 md:p-8 bg-slate-800/90 backdrop-blur-sm rounded-xl border border-slate-700/50">
                <div className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-4 bg-gradient-to-r from-blue-500 to-teal-500 rounded-xl flex items-center justify-center">
                  <Eye className="w-6 h-6 md:w-8 md:h-8 text-white" />
                </div>
                <h3 className="text-lg md:text-xl font-bold text-white mb-2">No Model Selected</h3>
                <p className="text-slate-400 mb-4 text-sm md:text-base">Upload a 3D model or select one from the library</p>

                <div className="text-left bg-slate-700/50 rounded-lg p-4 text-xs md:text-sm">
                  <div className="text-yellow-400 font-medium mb-2">Color Test Objects:</div>
                  <div className="space-y-1 text-slate-300">
                    <div>• Red Cube (Basic Material Test)</div>
                    <div>• Green Sphere (Lighting Test)</div>
                    <div>• Blue Cylinder (Shadow Test)</div>
                  </div>
                </div>
              </div>

              <mesh position={[-2, 0, 0]}>
                <boxGeometry args={[1, 1, 1]} />
                <meshStandardMaterial color="#ff4444" />
              </mesh>
              <mesh position={[0, 0, 0]}>
                <sphereGeometry args={[0.7, 32, 32]} />
                <meshStandardMaterial color="#44ff44" />
              </mesh>
              <mesh position={[2, 0, 0]}>
                <cylinderGeometry args={[0.5, 0.5, 1.5, 32]} />
                <meshStandardMaterial color="#4444ff" />
              </mesh>
            </Html>
          )}

          <OrbitControls
            ref={orbitControlsRef}
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            autoRotate={false}
            dampingFactor={0.05}
            enableDamping={true}
          />

          <Stats />
        </Canvas>

        {/* Add keyboard controls description for screen readers */}
        <div className="sr-only">
          Use arrow keys to rotate the camera. Use + and - keys to zoom in and out.
        </div>
      </div>
    </div>
  );
};
