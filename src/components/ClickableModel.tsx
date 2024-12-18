import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
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

type HoverState = 'idle' | 'hoverEntry' | 'hoverIdle' | 'hoverExit';

const HOVER_DELAY_MS = 200;
const HOVER_ENTRY_DURATION_MS = 1500;
const HOVER_EXIT_DURATION_MS = 1600;
const HOVER_EXIT_GRACE_MS = 1000; 

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
  const [hoverState, setHoverState] = useState<HoverState>('idle');
  const hoveredMeshes = useRef<Set<THREE.Object3D>>(new Set());
  const hoverTimer = useRef<number | null>(null);
  const hoverDelayTimer = useRef<number | null>(null);
  const exitGraceTimer = useRef<number | null>(null);
  const meshRefs = useRef<Set<THREE.Mesh>>(new Set());

  const memoedScale = useMemo(() => scale, [scale]);
  const memoedPosition = useMemo(() => position, [position]);

  const gltf = useGLTF(src) as GLTF & {
    scene: THREE.Group;
    animations: THREE.AnimationClip[];
    materials: Record<string, THREE.Material>;
  };
  const { scene, animations } = gltf;
  const { actions } = useAnimations(animations, group);

  useGLTF.preload(src);

  useEffect(() => {
    let video: HTMLVideoElement | null = null;
    let videoTexture: THREE.VideoTexture | undefined;

    if (videoSrc) {
      video = document.createElement('video');
      video.src = videoSrc;
      video.crossOrigin = 'anonymous';
      video.loop = true;
      video.muted = true; 
      video.playsInline = true;
      video.autoplay = true;

      video.play().catch(() => {
        console.warn('Video autoplay might be blocked by the browser.');
      });

      videoTexture = new THREE.VideoTexture(video);
      videoTexture.minFilter = THREE.LinearFilter;
      videoTexture.magFilter = THREE.LinearFilter;
      videoTexture.flipY = false;
    }

    scene.traverse((child: THREE.Object3D) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = castShadow;
        mesh.receiveShadow = receiveShadow;
        meshRefs.current.add(mesh);
        console.log(mesh.material);
        if (mesh.material) {
          const material = mesh.material as THREE.Material & {
            name?: string;
            map?: THREE.Texture | null;
            shadowSide?: THREE.Side;
          };
          // Check material type via 'instanceof'
        
          material.shadowSide = THREE.DoubleSide;
          material.needsUpdate = true;
        
          // Existing logic for video material, etc.
          if (videoTexture && material.name === videoMaterialName) {
            material.map = videoTexture;
            material.needsUpdate = true;
        
            mesh.frustumCulled = false;
            mesh.raycast = function (raycaster: THREE.Raycaster, intersects: THREE.Intersection[]) {
              const threshold = 0.1; 
              let boundingSphere = this.geometry.boundingSphere;
        
              if (!boundingSphere) {
                this.geometry.computeBoundingSphere();
                boundingSphere = this.geometry.boundingSphere!;
              }
        
              const scaledRadius = boundingSphere.radius * (1 + threshold);
              const tempSphere = new THREE.Sphere(boundingSphere.center, scaledRadius);
        
              if (raycaster.ray.intersectsSphere(tempSphere)) {
                THREE.Mesh.prototype.raycast.call(this, raycaster, intersects);
              }
            };
          } else if (material.name === 'MyMixedMaterial') {
            // Replace only this material with a glass-like material
            const glassMaterial = new THREE.MeshPhysicalMaterial({
              transmission: 1.0,
              transparent: true,
              opacity: 0.8,
              roughness: 0.1,
              metalness: 0.0,
              ior: 1.45,
              thickness: 0.1,
              reflectivity: 0.5,
              clearcoat: 1.0,
              clearcoatRoughness: 0.05,
            });
            mesh.material = glassMaterial;
            mesh.frustumCulled = false;
          } else {
            // Default handling for others
            mesh.frustumCulled = false;
          }
        }
      }
    });

    if (group.current) {
      group.current.traverse((node: THREE.Object3D) => {
        node.castShadow = castShadow;
        node.receiveShadow = receiveShadow;
      });
    }

    return () => {
      if (video) {
        video.pause();
        video.removeAttribute('src');
        video.load();
      }
    };
  }, [scene, castShadow, receiveShadow, videoSrc, videoMaterialName]);

  const playAnimations = useCallback(
    (stashName: string) => {
      if (!actions) return;
      Object.keys(actions).forEach((key) => actions[key]?.stop());

      let anyPlayed = false;
      Object.keys(actions).forEach((key) => {
        if (key.endsWith(stashName)) {
          const action = actions[key];
          if (action) {
            action.reset().fadeIn(0.005).play();
            anyPlayed = true;

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
    [actions]
  );

  useEffect(() => {
    switch (hoverState) {
      case 'hoverEntry':
        playAnimations('Hover-entry');
        break;
      case 'hoverIdle':
        playAnimations('Hover-idle');
        break;
      case 'hoverExit':
        playAnimations('Hover-exit');
        break;
      case 'idle':
      default:
        playAnimations('Idle');
        break;
    }
  }, [hoverState, playAnimations]);

  useEffect(() => {
    // On mount, start idle animation
    if (actions) {
      playAnimations('Idle');
    }
  }, [actions, playAnimations]);

  useEffect(() => {
    return () => {
      if (hoverTimer.current) clearTimeout(hoverTimer.current);
      if (hoverDelayTimer.current) clearTimeout(hoverDelayTimer.current);
      if (exitGraceTimer.current) clearTimeout(exitGraceTimer.current);
    };
  }, []);

  const startHoverEntrySequence = () => {
    if (hoverState === 'idle') {
      if (hoverDelayTimer.current) clearTimeout(hoverDelayTimer.current);
      hoverDelayTimer.current = window.setTimeout(() => {
        setHoverState('hoverEntry');
        if (hoverTimer.current) clearTimeout(hoverTimer.current);
        hoverTimer.current = window.setTimeout(() => {
          setHoverState('hoverIdle');
        }, HOVER_ENTRY_DURATION_MS);
      }, HOVER_DELAY_MS);
    }
  };

  const startHoverExitSequence = () => {
    if (hoverState === 'hoverEntry' || hoverState === 'hoverIdle') {
      setHoverState('hoverExit');
      window.setTimeout(() => {
        setHoverState('idle');
      }, HOVER_EXIT_DURATION_MS);
    }
  };

  const handlePointerOver = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    const object = event.object;
    const wasEmpty = hoveredMeshes.current.size === 0;

    hoveredMeshes.current.add(object);
    document.body.style.cursor = 'pointer';

    if (exitGraceTimer.current) {
      clearTimeout(exitGraceTimer.current);
      exitGraceTimer.current = null;
    }

    if (wasEmpty) {
      startHoverEntrySequence();
    }
  };

  const handlePointerOut = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    const object = event.object;
    hoveredMeshes.current.delete(object);

    if (hoveredMeshes.current.size === 0) {
      document.body.style.cursor = 'auto';

      if (hoverDelayTimer.current) {
        clearTimeout(hoverDelayTimer.current);
        hoverDelayTimer.current = null;
      }

      if (exitGraceTimer.current) clearTimeout(exitGraceTimer.current);
      exitGraceTimer.current = window.setTimeout(() => {
        if (hoveredMeshes.current.size === 0) {
          startHoverExitSequence();
        }
      }, HOVER_EXIT_GRACE_MS);
    }
  };

  const handlePointerDown = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    if (event.pointerType === 'touch') {
      handlePointerOver(event);
    }
  };

  const handlePointerUp = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
  
    // Check if this link is external
    const isExternal = link.startsWith('http');
  
    if (event.pointerType === 'touch') {
      if (isExternal) {
        window.location.href = link;
      } else {
        navigate(link);
      }
      handlePointerOut(event);
    } else if (event.pointerType === 'mouse' || event.pointerType === 'pen') {
      if (event.button === 0 && hoveredMeshes.current.size > 0) {
        if (isExternal) {
          window.location.href = link;
        } else {
          navigate(link);
        }
      }
    }
  };
  

  return (
    <group ref={group} scale={memoedScale} position={memoedPosition} dispose={null}>
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
