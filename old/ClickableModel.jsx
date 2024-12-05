import React, { useRef, useState, useEffect } from 'react';
import { useGLTF, useAnimations, Html } from '@react-three/drei';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import * as THREE from 'three';
import './ClickableModel.css';

const ClickableModel = ({
  src,
  scale,
  position,
  link,
  label,
  castShadow,
  receiveShadow,
  videoSrc, // Add a new prop for the video source
  videoMaterialName, // Add a new prop for identifying the material to apply the video texture
}) => {
  const group = useRef();
  const navigate = useNavigate();
  const [hoverState, setHoverState] = useState('idle'); // idle, hover-entry, hover-idle, hover-exit
  const hoverTimer = useRef(null); // Timer for hover transitions
  const hoverDelayTimer = useRef(null); // Timer for hover delay
  const meshRefs = useRef(new Set()); // Store references to all meshes

  // Load the GLB model and its animations
  const { scene, animations } = useGLTF(src);
  const { actions } = useAnimations(animations, group);

  // Preload the model for better performance
  useGLTF.preload(src);

  useEffect(() => {
    // Create video element if videoSrc is provided
    let videoTexture;
    if (videoSrc) {
      const video = document.createElement('video');
      video.src = videoSrc;
      video.crossOrigin = 'Anonymous';
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

    // Traverse the model to set shadows, ensure proper rendering, and apply video texture
    scene.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = castShadow;
        child.receiveShadow = receiveShadow;
        meshRefs.current.add(child); // Store mesh reference

        if (child.material) {
          child.material.shadowSide = THREE.DoubleSide;
          child.material.needsUpdate = true;

          // Apply video texture if this is the target material
          if (videoTexture && child.material.name === videoMaterialName) {
            child.material.map = videoTexture;
            child.material.needsUpdate = true;
          }
        }

        // Ensure pointer events work properly with shape keys
        child.frustumCulled = false;
        child.raycast = function (raycaster, intersects) {
          const threshold = 0.1; // Adjust this value based on your needs
          const boundingSphere = this.geometry.boundingSphere;

          if (!boundingSphere) {
            this.geometry.computeBoundingSphere();
          }

          // Use a slightly larger bounding sphere for intersection testing
          const scaledRadius = boundingSphere.radius * (1 + threshold);
          const tempSphere = new THREE.Sphere(boundingSphere.center, scaledRadius);

          if (raycaster.ray.intersectsSphere(tempSphere)) {
            THREE.Mesh.prototype.raycast.call(this, raycaster, intersects);
          }
        };
      }
    });

    group.current.traverse((node) => {
      if (node.isObject3D) {
        node.castShadow = castShadow;
        node.receiveShadow = receiveShadow;
      }
    });
  }, [scene, castShadow, receiveShadow, videoSrc, videoMaterialName]);

  const playAnimations = (stashName) => {
    if (!actions) return;

    // Stop any currently running animations immediately
    Object.keys(actions).forEach((key) => actions[key]?.stop());

    // Play all animations that match the stash name instantly
    let anyPlayed = false;
    Object.keys(actions).forEach((key) => {
      if (key.endsWith(stashName)) {
        const action = actions[key];
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
    });

    if (!anyPlayed) {
      console.warn(`No animations found ending with stashName: ${stashName}`);
    }
  };

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
  }, [hoverState, actions]);

  // Play the initial Idle animation when the component mounts
  useEffect(() => {
    if (actions) {
      playAnimations('Idle');
    }
  }, [actions]);

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

  const handlePointerOver = (event) => {
    event.stopPropagation();

    if (hoverState !== 'idle') return; // Only start the delay if in 'idle' state

    document.body.style.cursor = 'pointer'; // Change cursor immediately

    // Start the 0.2-second delay
    if (hoverDelayTimer.current) clearTimeout(hoverDelayTimer.current);

    hoverDelayTimer.current = setTimeout(() => {
      setHoverState('hover-entry'); // Start hover-entry animation

      // Start a timer to transition to hover-idle
      if (hoverTimer.current) clearTimeout(hoverTimer.current);

      // Use fixed duration of 1.5 seconds
      hoverTimer.current = setTimeout(() => {
        setHoverState('hover-idle');
      }, 1500); // Fixed to 1.5 seconds
    }, 200); // Delay of 0.2 seconds
  };

  const handlePointerOut = (event) => {
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
    setTimeout(() => {
      setHoverState('idle');
    }, 1600); // Fixed to 1.5 seconds
  };

  const handlePointerDown = (event) => {
    event.stopPropagation();

    if (event.pointerType === 'touch') {
      // For touch devices, start hover effect
      handlePointerOver(event);
    }
  };

  const handlePointerUp = (event) => {
    event.stopPropagation();

    if (event.pointerType === 'touch') {
      // For touch devices, treat touch release as click
      navigate(link);

      // End hover effect
      handlePointerOut(event);
    } else if (event.pointerType === 'mouse' || event.pointerType === 'pen') {
      if (event.button === 0) {
        // Removed hoverState dependency to allow click regardless of hover state
        navigate(link);
      }
    }
  };

  console.log(Object.keys(actions));


  return (
    <group
      ref={group}
      scale={scale}
      position={position}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      dispose={null}
    >
      <primitive object={scene} />
      {hoverState !== 'idle' && label && (
        <Html position={[0, 2, 0]}>
          <div className="label">{label}</div>
        </Html>
      )}
    </group>
  );
};

ClickableModel.propTypes = {
  src: PropTypes.string.isRequired,
  scale: PropTypes.arrayOf(PropTypes.number),
  position: PropTypes.arrayOf(PropTypes.number),
  link: PropTypes.string.isRequired,
  label: PropTypes.string,
  castShadow: PropTypes.bool,
  receiveShadow: PropTypes.bool,
  videoSrc: PropTypes.string, // New prop for video source
  videoMaterialName: PropTypes.string, // New prop for identifying the material
};

ClickableModel.defaultProps = {
  scale: [1, 1, 1],
  position: [0, 0, 0],
  label: '',
  castShadow: true,
  receiveShadow: true,
  videoSrc: '/models/Blogging1.mp4', // Default to empty string
  videoMaterialName: 'Material.001', // Default to empty string
};

export default ClickableModel;
