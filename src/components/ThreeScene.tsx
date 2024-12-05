import React, { useState, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import ClickableModel from './ClickableModel';
import * as THREE from 'three';

interface CameraConfig {
  position: [number, number, number];
  fov: number;
}

interface CameraUpdaterProps {
  cameraConfig: CameraConfig;
}

const CameraUpdater: React.FC<CameraUpdaterProps> = ({ cameraConfig }) => {
  const { camera } = useThree();

  useEffect(() => {
    // Ensure the camera is a PerspectiveCamera
    if ((camera as THREE.PerspectiveCamera).isPerspectiveCamera) {
      const perspectiveCamera = camera as THREE.PerspectiveCamera;

      // Update the camera's position
      perspectiveCamera.position.set(...cameraConfig.position);

      // Update the camera's field of view
      perspectiveCamera.fov = cameraConfig.fov;
      perspectiveCamera.updateProjectionMatrix(); // Must be called after changing fov
    }
  }, [cameraConfig, camera]);

  return null; // This component doesn't render anything
};

interface Model {
  src: string;
  scale?: [number, number, number];
  position?: [number, number, number];
  link: string;
  label?: string;
}

interface ThreeSceneProps {
  models: Model[];
}

const ThreeScene: React.FC<ThreeSceneProps> = ({ models }) => {
  const [cameraConfig, setCameraConfig] = useState<CameraConfig>({
    position: [30, 45, 30],
    fov: 40,
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 420) {
        // Mobile devices
        console.log('Mobile device detected');
        setCameraConfig({
          position: [40, 60, 40],
          fov: 60,
        });
      } else if (width < 680) {
        // Tablets
        console.log('Tablet device detected');
        setCameraConfig({
          position: [33, 55, 33],
          fov: 50,
        });
      } else {
        // Desktops
        console.log('Desktop device detected');
        setCameraConfig({
          position: [30, 45, 30],
          fov: 40,
        });
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Initialize on mount

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <Canvas
      shadows={{ type: THREE.PCFSoftShadowMap }}
      camera={{
        position: cameraConfig.position,
        fov: cameraConfig.fov,
      }}
      style={{ width: '100%', height: '100vh' }}
    >
      {/* Camera Updater Component */}
      <CameraUpdater cameraConfig={cameraConfig} />

      {/* Ambient Light */}
      <ambientLight intensity={0.3} />

      {/* Directional Light */}
      <directionalLight
        position={[20, 40, -30]}
        intensity={2.5}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-near={1}
        shadow-camera-far={100}
        shadow-camera-left={-50}
        shadow-camera-right={50}
        shadow-camera-top={50}
        shadow-camera-bottom={-50}
        shadow-bias={-0.005}
      />

      {/* Shadow Receiver Plane */}
      <mesh
        receiveShadow
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.1, 0]}
      >
        <planeGeometry args={[200, 200]} />
        <shadowMaterial opacity={0.6} />
      </mesh>

      {/* Render Models */}
      {models.map((model, index) => (
        <ClickableModel
          key={index}
          src={model.src}
          scale={model.scale}
          position={model.position}
          link={model.link}
          label={model.label}
          castShadow
          receiveShadow
        />
      ))}
    </Canvas>
  );
};

export default ThreeScene;
