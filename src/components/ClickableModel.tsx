import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useGLTF, useAnimations, Html } from '@react-three/drei';
import { useNavigate } from 'react-router-dom';
import * as THREE from 'three';
import { GLTF } from 'three-stdlib';
import { ThreeEvent } from '@react-three/fiber';
import './ClickableModel.css';

interface ClickableModelProps {
  src: string;
  scale?: [number, number, number];
  position?: [number, number, number];
  link: string;
  label?: string;
  castShadow?: boolean;
  receiveShadow?: boolean;
  videoSrc?: string;
  videoMaterialName?: string;
}

const ClickableModel: React.FC<ClickableModelProps> = (props) => {
  const {
    src,
    scale = [1, 1, 1],
    position = [0, 0, 0],
    link,
    label = '',
    castShadow = true,
    receiveShadow = true,
    videoSrc = '/models/Blogging1.mp4',
    videoMaterialName = 'Material.001',
  } = props;

  const group = useRef<THREE.Group>(null!);
  const navigate = useNavigate();
  const [hoverState, setHoverState] = useState<'idle' | 'hover-entry' | 'hover-idle' | 'hover-exit'>('idle');
  const hoverTimer = useRef<number | null>(null);
  const hoverDelayTimer = useRef<number | null>(null);
  const meshRefs = useRef<Set<THREE.Mesh>>(new Set());

  // Load the GLB model and its animations
  const gltf = useGLTF(src) as GLTF & {
    scene: THREE.Group;
    animations: THREE.AnimationClip[];
    materials: Record<string, THREE.Material>;
  };
  const { scene, animations } = gltf;
  const { actions } = useAnimations(animations, group);

  // Preload the model for better performance
  useGLTF.preload(src);

  useEffect(() => {
    // Create video element if videoSrc is provided
    let videoTexture: THREE.VideoTexture | undefined;
    if (videoSrc) {
      const video = document.createElement('video');
      video.src = videoSrc;
      video.crossOrigin = 'anonymous';
      video.loop = true;
      video.muted = true; // Auto-play requires the video to be muted
      video.playsInline = true;
      video.autoplay = true;
      video.play();

      // Create VideoTexture
      videoTexture = new THREE.VideoTexture(video);
      videoTexture.minFilter = THREE.LinearFilter;
      videoTexture.magFilter = THREE.LinearFilter;
      videoTexture.format = THREE.RGBFormat;
      videoTexture.flipY = false; // Correct the upside-down issue
    }

    // Traverse the model to set shadows, apply video texture, and custom raycast
    scene.traverse((child: THREE.Object3D) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = castShadow;
        mesh.receiveShadow = receiveShadow;
        meshRefs.current.add(mesh); // Store mesh reference

        if (mesh.material) {
          const material = mesh.material as THREE.Material & {
            name?: string;
            map?: THREE.Texture | null;
            shadowSide?: THREE.Side;
          };
          material.shadowSide = THREE.DoubleSide;
          material.needsUpdate = true;

          // Apply video texture if this is the target material
          if (videoTexture && material.name === videoMaterialName) {
            material.map = videoTexture;
            material.needsUpdate = true;

            // Apply custom raycast function only to meshes with video texture
            mesh.frustumCulled = false;
            mesh.raycast = function (raycaster: THREE.Raycaster, intersects: THREE.Intersection[]) {
              const threshold = 0.1; // Adjust this value based on your needs
              let boundingSphere = this.geometry.boundingSphere;

              if (!boundingSphere) {
                this.geometry.computeBoundingSphere();
                boundingSphere = this.geometry.boundingSphere!;
              }

              // Use a slightly larger bounding sphere for intersection testing
              const scaledRadius = boundingSphere.radius * (1 + threshold);
              const tempSphere = new THREE.Sphere(boundingSphere.center, scaledRadius);

              if (raycaster.ray.intersectsSphere(tempSphere)) {
                THREE.Mesh.prototype.raycast.call(this, raycaster, intersects);
              }
            };
          }
        }

        // For all meshes, ensure they are not frustum culled
        mesh.frustumCulled = false;
      }
    });

    if (group.current) {
      group.current.traverse((node: THREE.Object3D) => {
        node.castShadow = castShadow;
        node.receiveShadow = receiveShadow;
      });
    }
  }, [scene, castShadow, receiveShadow, videoSrc, videoMaterialName]);

  const playAnimations = useCallback(
    (stashName: string) => {
      if (!actions) return;
  
      // Stop any currently running animations immediately
      Object.keys(actions).forEach((key) => actions[key]?.stop());
  
      // Play all animations that match the stash name instantly
      let anyPlayed = false;
      Object.keys(actions).forEach((key) => {
        if (key.endsWith(stashName)) {
          const action = actions[key];
          if (action) {
            action.reset().fadeIn(0.005).play();
            anyPlayed = true;
  
            // Ensure morphTargetInfluences are properly updated
            if (action.getMixer()) {
              action.getMixer().addEventListener('finished', () => {
                meshRefs.current.forEach((mesh) => {
                  if (mesh.morphTargetInfluences) {
                    mesh.morphTargetInfluences = [...mesh.morphTargetInfluences];
                  }
                });
              });
            }
          }
        }
      });
  
      if (!anyPlayed) {
        console.warn(`No animations found ending with stashName: ${stashName}`);
      }
    },
    [actions] // Include 'actions' as a dependency
  );

  useEffect(() => {
    // Synchronize animations based on the current hover state
    switch (hoverState) {
      case 'hover-entry':
        playAnimations('Hover-entry');
        break;
      case 'hover-idle':
        playAnimations('Hover-idle');
        break;
      case 'hover-exit':
        playAnimations('Hover-exit');
        break;
      case 'idle':
      default:
        playAnimations('Idle');
        break;
    }
  }, [hoverState, playAnimations]); // Include 'playAnimations'
  
  useEffect(() => {
    // Play the initial Idle animation when the component mounts
    if (actions) {
      playAnimations('Idle');
    }
  }, [actions, playAnimations]); // Include 'playAnimations'
  

  // Clean up timers on component unmount
  useEffect(() => {
    return () => {
      if (hoverTimer.current) {
        clearTimeout(hoverTimer.current);
      }
      if (hoverDelayTimer.current) {
        clearTimeout(hoverDelayTimer.current);
      }
    };
  }, []);

  const handlePointerOver = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();

    if (hoverState !== 'idle') return; // Only start the delay if in 'idle' state

    document.body.style.cursor = 'pointer'; // Change cursor immediately

    // Start the 0.2-second delay
    if (hoverDelayTimer.current) clearTimeout(hoverDelayTimer.current);

    hoverDelayTimer.current = window.setTimeout(() => {
      setHoverState('hover-entry'); // Start hover-entry animation

      // Start a timer to transition to hover-idle
      if (hoverTimer.current) clearTimeout(hoverTimer.current);

      // Use fixed duration of 1.5 seconds
      hoverTimer.current = window.setTimeout(() => {
        setHoverState('hover-idle');
      }, 1500); // Fixed to 1.5 seconds
    }, 200); // Delay of 0.2 seconds
  };

  const handlePointerOut = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();

    document.body.style.cursor = 'auto'; // Reset cursor immediately

    // Clear hover delay timer if it exists
    if (hoverDelayTimer.current) {
      clearTimeout(hoverDelayTimer.current);
      hoverDelayTimer.current = null;
    }

    if (hoverState === 'idle') {
      // Do nothing more, since we haven't changed the hoverState yet
      return;
    }

    if (hoverState !== 'hover-idle' && hoverState !== 'hover-entry') return; // Prevent re-triggering

    setHoverState('hover-exit'); // Start hover-exit animation

    // Clear hover timer if it exists
    if (hoverTimer.current) {
      clearTimeout(hoverTimer.current);
      hoverTimer.current = null;
    }

    // Use fixed duration of 1.5 seconds
    window.setTimeout(() => {
      setHoverState('idle');
    }, 1600); // Fixed to 1.6 seconds
  };

  const handlePointerDown = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();

    if (event.pointerType === 'touch') {
      // For touch devices, start hover effect
      handlePointerOver(event);
    }
  };

  const handlePointerUp = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();

    if (event.pointerType === 'touch') {
      // For touch devices, treat touch release as click
      navigate(link);

      // End hover effect
      handlePointerOut(event);
    } else if (event.pointerType === 'mouse' || event.pointerType === 'pen') {
      if (event.button === 0) {
        // Allow click regardless of hover state
        navigate(link);
      }
    }
  };

  console.log(Object.keys(actions ?? {}));

  return (
    <group ref={group} scale={scale} position={position} dispose={null}>
      <primitive
        object={scene}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
      />
      {hoverState !== 'idle' && label && (
        <Html position={[0, 2, 0]}>
          <div className="label">{label}</div>
        </Html>
      )}
    </group>
  );
};

export default ClickableModel;
