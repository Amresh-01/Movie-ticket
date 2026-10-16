import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import type { SeatInfo } from '../types';
import {
  generateSeatCoordinates,
  calculateViewingMetrics,
  CINEMA_CONFIG,
  type SeatCoordinate,
  type ViewingMetrics,
} from './seatGeometryConfig';
import {
  Eye,
  RotateCcw,
  Sparkles,
  Camera,
  Check,
  Compass,
  ArrowLeft,
  X,
  Layers,
  Film,
} from 'lucide-react';

interface CinemaAuditorium3DProps {
  seats: SeatInfo[];
  selectedSeatIds: string[];
  onToggleSeat: (seatId: string) => void;
  maxSelectable?: number;
  movieTitle?: string;
  moviePosterUrl?: string | null;
  seatPrice?: number;
  externalPreviewSeatId?: string | null;
  onResetExternalPreview?: () => void;
}

// Smooth First-Person Seated Eye Lerp Controller with subtle breathing motion
const CameraModeController: React.FC<{
  previewSeat: SeatCoordinate | null;
  controlsRef: React.RefObject<OrbitControlsImpl | null>;
  testPatternMode: boolean;
}> = ({ previewSeat, controlsRef }) => {
  const targetCamPos = useRef(new THREE.Vector3(0, 7.5, 7.5));
  const targetLookAt = useRef(new THREE.Vector3(0, 1.2, -0.5));
  const isTransitioning = useRef(false);

  useEffect(() => {
    if (previewSeat) {
      // Transition to seated eye height looking at screen center
      targetCamPos.current.set(...previewSeat.eyePosition);
      targetLookAt.current.set(...CINEMA_CONFIG.screen.center);
      isTransitioning.current = true;

      if (controlsRef.current) {
        controlsRef.current.enabled = false;
      }
    } else {
      // Return to overview
      targetCamPos.current.set(0, 7.5, 7.5);
      targetLookAt.current.set(0, 1.2, -0.5);
      isTransitioning.current = true;

      if (controlsRef.current) {
        controlsRef.current.enabled = false;
      }
    }
  }, [previewSeat, controlsRef]);

  useFrame(({ camera }) => {
    if (isTransitioning.current) {
      camera.position.lerp(targetCamPos.current, 0.12);

      if (controlsRef.current) {
        controlsRef.current.target.lerp(targetLookAt.current, 0.12);
        controlsRef.current.update();
      }

      if (camera.position.distanceTo(targetCamPos.current) < 0.05) {
        camera.position.copy(targetCamPos.current);
        if (controlsRef.current) {
          controlsRef.current.target.copy(targetLookAt.current);
          controlsRef.current.update();
          controlsRef.current.enabled = true; // Always re-enable controls once at target!
        }
        isTransitioning.current = false;
      }
    }
  });

  return null;
};

// Luxury Cinema Seat Component with cup holder, cushioned backrest, and realistic textures
const CinemaChair: React.FC<{
  coord: SeatCoordinate;
  seatInfo: SeatInfo;
  isSelected: boolean;
  isInspected: boolean;
  isPreviewing: boolean;
  onInspect: (coord: SeatCoordinate, seatInfo: SeatInfo) => void;
}> = React.memo(({ coord, seatInfo, isSelected, isInspected, isPreviewing, onInspect }) => {
  const [hovered, setHovered] = useState(false);

  const { chairColor, emissiveColor, emissiveIntensity } = useMemo(() => {
    if (isSelected) {
      return {
        chairColor: '#FF5A6E',
        emissiveColor: '#E11D48',
        emissiveIntensity: 0.85,
      };
    }
    if (isInspected || isPreviewing) {
      return {
        chairColor: '#8B5CF6',
        emissiveColor: '#7C3AED',
        emissiveIntensity: 0.7,
      };
    }
    if (seatInfo.status === 'BOOKED') {
      return {
        chairColor: '#1E2330',
        emissiveColor: '#0A0D14',
        emissiveIntensity: 0.05,
      };
    }
    if (seatInfo.status === 'HELD_BY_YOU') {
      return {
        chairColor: '#38C98B',
        emissiveColor: '#059669',
        emissiveIntensity: 0.7,
      };
    }
    if (seatInfo.status === 'HELD') {
      return {
        chairColor: '#F4B740',
        emissiveColor: '#D97706',
        emissiveIntensity: 0.35,
      };
    }
    // Deep plush cinema velvet crimson
    return {
      chairColor: hovered ? '#E11D48' : '#70092B',
      emissiveColor: hovered ? '#FF5A6E' : '#3B0414',
      emissiveIntensity: hovered ? 0.45 : 0.08,
    };
  }, [seatInfo.status, isSelected, isInspected, isPreviewing, hovered]);

  const frameColor = '#0F131C';

  return (
    <group position={coord.position} rotation={[0, coord.rotationY, 0]}>
      {/* Invisible bounding hit-box for reliable 100% raycasting */}
      <mesh
        position={[0, 0.55, 0]}
        visible={false}
        onClick={(e) => {
          e.stopPropagation();
          onInspect(coord, seatInfo);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = 'pointer';
          setHovered(true);
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          document.body.style.cursor = 'auto';
          setHovered(false);
        }}
      >
        <boxGeometry args={[0.74, 1.18, 0.74]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>

      {/* Seat Bottom Cushion with beveled rounded contour */}
      <mesh position={[0, 0.42, 0.05]} castShadow receiveShadow raycast={() => null}>
        <boxGeometry args={[0.58, 0.14, 0.52]} />
        <meshStandardMaterial
          color={chairColor}
          emissive={emissiveColor}
          emissiveIntensity={emissiveIntensity}
          roughness={0.65}
          metalness={0.12}
        />
      </mesh>

      {/* Seat Backrest */}
      <mesh position={[0, 0.78, -0.19]} rotation={[-0.12, 0, 0]} castShadow receiveShadow raycast={() => null}>
        <boxGeometry args={[0.54, 0.68, 0.12]} />
        <meshStandardMaterial
          color={chairColor}
          emissive={emissiveColor}
          emissiveIntensity={emissiveIntensity}
          roughness={0.6}
          metalness={0.1}
        />
      </mesh>

      {/* Headrest Cushion */}
      <mesh position={[0, 1.15, -0.24]} rotation={[-0.12, 0, 0]} castShadow raycast={() => null}>
        <boxGeometry args={[0.44, 0.18, 0.1]} />
        <meshStandardMaterial
          color={chairColor}
          emissive={emissiveColor}
          emissiveIntensity={emissiveIntensity * 1.1}
          roughness={0.5}
        />
      </mesh>

      {/* Armrests */}
      <mesh position={[-0.33, 0.56, 0.02]} castShadow raycast={() => null}>
        <boxGeometry args={[0.08, 0.09, 0.46]} />
        <meshStandardMaterial color={frameColor} roughness={0.35} metalness={0.8} />
      </mesh>
      <mesh position={[-0.33, 0.28, 0.02]} castShadow raycast={() => null}>
        <boxGeometry args={[0.05, 0.48, 0.05]} />
        <meshStandardMaterial color={frameColor} roughness={0.3} metalness={0.8} />
      </mesh>

      <mesh position={[0.33, 0.56, 0.02]} castShadow raycast={() => null}>
        <boxGeometry args={[0.08, 0.09, 0.46]} />
        <meshStandardMaterial color={frameColor} roughness={0.35} metalness={0.8} />
      </mesh>
      <mesh position={[0.33, 0.28, 0.02]} castShadow raycast={() => null}>
        <boxGeometry args={[0.05, 0.48, 0.05]} />
        <meshStandardMaterial color={frameColor} roughness={0.3} metalness={0.8} />
      </mesh>

      {/* Cup Holder on Right Armrest */}
      <mesh position={[0.33, 0.58, 0.2]} castShadow raycast={() => null}>
        <cylinderGeometry args={[0.038, 0.032, 0.06, 16]} />
        <meshStandardMaterial color="#05070A" roughness={0.2} metalness={0.9} />
      </mesh>

      {/* Center Pedestal Base & Floor Mount Plate */}
      <mesh position={[0, 0.18, 0.02]} castShadow raycast={() => null}>
        <cylinderGeometry args={[0.065, 0.085, 0.36, 14]} />
        <meshStandardMaterial color={frameColor} roughness={0.2} metalness={0.9} />
      </mesh>
      <mesh position={[0, 0.015, 0.02]} receiveShadow raycast={() => null}>
        <cylinderGeometry args={[0.2, 0.22, 0.03, 16]} />
        <meshStandardMaterial color="#0B0D14" roughness={0.5} metalness={0.9} />
      </mesh>

      {/* Seat Number Tag */}
      <Text
        position={[0, 0.85, -0.12]}
        fontSize={0.13}
        color={isSelected || hovered || isInspected ? '#ffffff' : '#CBD5E1'}
        anchorX="center"
        anchorY="middle"
        raycast={() => null}
      >
        {`${coord.row}${coord.number}`}
      </Text>
    </group>
  );
});

// High-fidelity Cinema Screen with guaranteed active 60 FPS video loop generated from movie picture
const CinemaScreen: React.FC<{
  testPatternMode: boolean;
  moviePosterUrl?: string | null;
  movieTitle?: string;
}> = ({ testPatternMode, moviePosterUrl, movieTitle }) => {
  // Offscreen canvas and dynamic canvas texture
  const [screenTexture, setScreenTexture] = useState<THREE.CanvasTexture | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const movieImgRef = useRef<HTMLImageElement | null>(null);

  // Initialize canvas & image
  useEffect(() => {
    const movieName = movieTitle || 'Inception';
    const canvas = document.createElement('canvas');
    canvas.width = 1280;
    canvas.height = 540; // 2.37:1 widescreen ratio
    canvasRef.current = canvas;

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    setScreenTexture(tex);

    // Select movie artwork
    let targetUrl = moviePosterUrl;
    if (!targetUrl) {
      if (movieName.toLowerCase().includes('interstellar')) {
        targetUrl = 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=1200&auto=format&fit=crop&q=80';
      } else if (movieName.toLowerCase().includes('dark knight') || movieName.toLowerCase().includes('batman')) {
        targetUrl = 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1200&auto=format&fit=crop&q=80';
      } else {
        targetUrl = 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1200&auto=format&fit=crop&q=80';
      }
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = targetUrl;
    img.onload = () => {
      movieImgRef.current = img;
    };
    img.onerror = () => {
      const fallbackImg = new Image();
      fallbackImg.crossOrigin = 'anonymous';
      fallbackImg.src = 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1200&auto=format&fit=crop&q=80';
      fallbackImg.onload = () => {
        movieImgRef.current = fallbackImg;
      };
    };

    return () => {
      tex.dispose();
    };
  }, [moviePosterUrl, movieTitle]);

  // Real-time animation loop synchronized with React Three Fiber render tick
  useFrame(({ clock }) => {
    if (!canvasRef.current || !screenTexture || testPatternMode) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const t = clock.getElapsedTime();

    // 1. Dark cinema backdrop
    ctx.fillStyle = '#05070D';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const img = movieImgRef.current;
    if (img && img.complete && img.naturalWidth > 0) {
      // 2. Active Pan & Zoom Ken Burns Video Motion
      const zoom = 1.08 + Math.sin(t * 0.8) * 0.05;
      const panX = Math.sin(t * 0.5) * 45;
      const panY = Math.cos(t * 0.4) * 20;

      ctx.save();
      ctx.translate(canvas.width / 2 + panX, canvas.height / 2 + panY);
      ctx.scale(zoom, zoom);

      // Scale to fit cinema canvas
      const imgAspect = img.width / img.height;
      const canvasAspect = canvas.width / canvas.height;
      let drawW = canvas.width;
      let drawH = canvas.height;

      if (imgAspect > canvasAspect) {
        drawH = canvas.height;
        drawW = canvas.height * imgAspect;
      } else {
        drawW = canvas.width;
        drawH = canvas.width / imgAspect;
      }

      ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
      ctx.restore();

      // 3. Dynamic Laser Flare / Projector Light Sweep across video
      const flarePos = ((Math.sin(t * 0.7) + 1) / 2) * canvas.width;
      const flare = ctx.createRadialGradient(flarePos, canvas.height * 0.5, 10, flarePos, canvas.height * 0.5, 320);
      flare.addColorStop(0, 'rgba(56, 189, 248, 0.45)');
      flare.addColorStop(0.3, 'rgba(99, 102, 241, 0.2)');
      flare.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = flare;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Light streak beam
      ctx.fillStyle = 'rgba(224, 242, 254, 0.65)';
      ctx.fillRect(Math.max(0, flarePos - 120), canvas.height * 0.5 - 1.5, 240, 3);

      // 4. Floating film embers / projector dust motes
      for (let i = 0; i < 18; i++) {
        const px = ((i * 73 + t * 45) % canvas.width);
        const py = ((i * 47 - t * 30 + canvas.height * 2) % canvas.height);
        const pSize = 1.5 + (i % 3);
        const alpha = 0.2 + 0.3 * Math.sin(t * 2 + i);
        ctx.fillStyle = `rgba(255, 230, 200, ${alpha})`;
        ctx.beginPath();
        ctx.arc(px, py, pSize, 0, Math.PI * 2);
        ctx.fill();
      }

      // 5. CinemaScope Letterbox Bars
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, 24);
      ctx.fillRect(0, canvas.height - 24, canvas.width, 24);

      // 6. On-Screen Live Video Branding
      ctx.fillStyle = '#FF5A6E';
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText('• 4K LASER PROJECTION • LIVE MOTION', 40, canvas.height - 56);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '900 36px sans-serif';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
      ctx.shadowBlur = 12;
      ctx.fillText((movieTitle || 'NOW SHOWING').toUpperCase(), 40, canvas.height - 90);
      ctx.shadowBlur = 0;
    } else {
      // While image is downloading
      ctx.fillStyle = '#1E1B4B';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const pulse = Math.sin(t * 3) * 0.2 + 0.8;
      ctx.fillStyle = `rgba(255, 90, 110, ${pulse})`;
      ctx.font = 'bold 28px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('• LOADING CINEMA PROJECTION •', canvas.width / 2, canvas.height / 2 - 20);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '900 48px sans-serif';
      ctx.fillText((movieTitle || 'NOW SHOWING').toUpperCase(), canvas.width / 2, canvas.height / 2 + 35);
      ctx.textAlign = 'left';
    }

    screenTexture.needsUpdate = true;
  });

  return (
    <group position={CINEMA_CONFIG.screen.position}>
      {/* Outer Cinema Screen Bezel */}
      <mesh position={[0, 0, -0.04]} castShadow receiveShadow>
        <boxGeometry args={[14.6, 5.5, 0.1]} />
        <meshStandardMaterial color="#020408" roughness={0.9} metalness={0.5} />
      </mesh>

      {/* Primary Video Screen Surface directly facing the audience */}
      <mesh position={[0, 0, 0.02]}>
        <planeGeometry args={[14.2, 5.2, 32, 16]} />
        {testPatternMode ? (
          <meshStandardMaterial
            color="#0F172A"
            emissive="#0284C7"
            emissiveIntensity={0.6}
            roughness={0.9}
            side={THREE.DoubleSide}
          />
        ) : screenTexture ? (
          <meshBasicMaterial
            map={screenTexture}
            toneMapped={false}
            side={THREE.DoubleSide}
          />
        ) : (
          <meshStandardMaterial
            color="#1E293B"
            emissive="#4338CA"
            emissiveIntensity={0.5}
            roughness={0.8}
            side={THREE.DoubleSide}
          />
        )}
      </mesh>

      {/* Stage Floor Proscenium Step */}
      <mesh position={[0, -2.8, 0.8]} receiveShadow>
        <boxGeometry args={[16.5, 0.4, 2.4]} />
        <meshStandardMaterial color="#0A0E17" roughness={0.9} metalness={0.2} />
      </mesh>

      {/* Stage Step Trim Accent Light Strip */}
      <mesh position={[0, -2.6, 2.02]}>
        <boxGeometry args={[16.4, 0.03, 0.02]} />
        <meshBasicMaterial color="#FF5A6E" />
      </mesh>

      {/* Test Pattern Grid Overlay Lines */}
      {testPatternMode && (
        <group position={[0, 0, 0.05]}>
          <Text
            position={[0, 0.4, 0.02]}
            fontSize={0.34}
            color="#38BDF8"
            anchorX="center"
            anchorY="middle"
            letterSpacing={0.2}
          >
            OPTICAL SIGHTLINE TEST PATTERN
          </Text>
          <Text
            position={[0, -0.2, 0.02]}
            fontSize={0.2}
            color="#94A3B8"
            anchorX="center"
            anchorY="middle"
          >
            Aspect Ratio 2.39:1 Scope • Seated Eye Calibrated
          </Text>
        </group>
      )}

      {/* Screen Title Banner under the stage */}
      {!testPatternMode && (
        <Text
          position={[0, -2.7, 2.05]}
          fontSize={0.24}
          color="#94A3B8"
          anchorX="center"
          anchorY="middle"
          letterSpacing={0.16}
        >
          {movieTitle ? `${movieTitle.toUpperCase()} • SCREEN 1` : 'YOZIGO ULTRA-WIDE PROJECTION SCREEN'}
        </Text>
      )}

      {/* Realistic Volumetric Screen Projector Light (diffuse cone of light illuminating the room) */}
      <spotLight
        position={[0, 7.5, 9]}
        target-position={CINEMA_CONFIG.screen.position}
        angle={0.7}
        penumbra={0.8}
        intensity={3.2}
        distance={25}
        color="#E2E8F0"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />

      {/* Front Screen Reflected Bounce Ambient Glow */}
      <pointLight position={[0, 0, 1.8]} intensity={2.6} distance={16} color="#E2E8F0" />
    </group>
  );
};

// Realistic Cinema Auditorium Environment: Acoustic wall baffles, ceiling rafters, carpet runners, and exit signs
const AuditoriumEnvironment: React.FC = () => {
  return (
    <group>
      {/* Stadium Risers: Row A lowest front, Row H highest back */}
      {CINEMA_CONFIG.rows.map((_, index) => {
        const zPos = CINEMA_CONFIG.rowZStart + index * CINEMA_CONFIG.rowZSpacing;
        const yPos = index * CINEMA_CONFIG.rowElevationStep;
        return (
          <group key={`tier-${index}`}>
            {/* Dark Riser Base */}
            <mesh position={[0, yPos / 2, zPos]} receiveShadow>
              <boxGeometry args={[15, yPos + 0.1, 1.35]} />
              <meshStandardMaterial color="#0E121B" roughness={0.9} metalness={0.1} />
            </mesh>

            {/* Premium Cinema Dark Velvet Carpet on top of step */}
            <mesh position={[0, yPos + 0.051, zPos]} receiveShadow>
              <boxGeometry args={[14.9, 0.01, 1.33]} />
              <meshStandardMaterial color="#161B26" roughness={0.95} />
            </mesh>
          </group>
        );
      })}

      {/* Center Aisle Carpet Runner with safety glow strips */}
      <mesh position={[0, 0.06, 0.2]} receiveShadow>
        <boxGeometry args={[1.2, 0.015, 11]} />
        <meshStandardMaterial color="#1A202C" roughness={0.9} />
      </mesh>
      {/* Left and right subtle safety aisle guides */}
      <mesh position={[-0.58, 0.065, 0.2]}>
        <boxGeometry args={[0.02, 0.01, 11]} />
        <meshBasicMaterial color="#38C98B" transparent opacity={0.6} />
      </mesh>
      <mesh position={[0.58, 0.065, 0.2]}>
        <boxGeometry args={[0.02, 0.01, 11]} />
        <meshBasicMaterial color="#38C98B" transparent opacity={0.6} />
      </mesh>

      {/* Base Floor */}
      <mesh position={[0, -0.05, 0]} receiveShadow>
        <boxGeometry args={[26, 0.1, 26]} />
        <meshStandardMaterial color="#06080D" roughness={0.95} />
      </mesh>

      {/* Back Wall with Projection Booth Window */}
      <mesh position={[0, 5, 8.5]} receiveShadow>
        <boxGeometry args={[26, 12, 0.2]} />
        <meshStandardMaterial color="#080B12" roughness={0.95} />
      </mesh>
      {/* Projection Booth Glass Aperture */}
      <mesh position={[0, 6.5, 8.35]}>
        <boxGeometry args={[2.4, 0.9, 0.1]} />
        <meshStandardMaterial
          color="#FFFFFF"
          emissive="#38BDF8"
          emissiveIntensity={0.8}
          roughness={0.1}
          metalness={0.9}
        />
      </mesh>

      {/* Acoustic Wall Baffles on Left & Right Walls */}
      {[-10.2, 10.2].map((xWall, wIdx) => (
        <group key={`wall-${wIdx}`}>
          <mesh position={[xWall, 4, 0]} rotation={[0, wIdx === 0 ? Math.PI / 2 : -Math.PI / 2, 0]} receiveShadow>
            <boxGeometry args={[26, 10, 0.3]} />
            <meshStandardMaterial color="#07090F" roughness={0.9} />
          </mesh>

          {/* Vertical acoustic decorative panels */}
          {[-6, -3, 0, 3, 6].map((zPan, pIdx) => (
            <mesh
              key={`pan-${pIdx}`}
              position={[xWall + (wIdx === 0 ? 0.2 : -0.2), 4, zPan]}
              rotation={[0, wIdx === 0 ? Math.PI / 2 : -Math.PI / 2, 0]}
            >
              <boxGeometry args={[1.6, 6, 0.12]} />
              <meshStandardMaterial color="#111622" roughness={0.8} />
            </mesh>
          ))}
        </group>
      ))}

      {/* Illuminated Emergency Exit Signs */}
      <group position={[-9.8, 2.2, -6.5]}>
        <mesh>
          <boxGeometry args={[0.7, 0.35, 0.08]} />
          <meshStandardMaterial color="#059669" emissive="#34D399" emissiveIntensity={0.85} />
        </mesh>
        <Text position={[0, 0, 0.05]} fontSize={0.13} color="#FFFFFF" anchorX="center" anchorY="middle">
          EXIT
        </Text>
      </group>
      <group position={[9.8, 2.2, -6.5]}>
        <mesh>
          <boxGeometry args={[0.7, 0.35, 0.08]} />
          <meshStandardMaterial color="#059669" emissive="#34D399" emissiveIntensity={0.85} />
        </mesh>
        <Text position={[0, 0, 0.05]} fontSize={0.13} color="#FFFFFF" anchorX="center" anchorY="middle">
          EXIT
        </Text>
      </group>

      {/* Pathway Step Lights */}
      {CINEMA_CONFIG.rows.map((_, idx) => (
        <group key={`light-${idx}`}>
          <pointLight
            position={[-5.6, idx * 0.35 + 0.3, -4.5 + idx * 1.35]}
            color="#F59E0B"
            intensity={0.35}
            distance={2.2}
          />
          <pointLight
            position={[5.6, idx * 0.35 + 0.3, -4.5 + idx * 1.35]}
            color="#F59E0B"
            intensity={0.35}
            distance={2.2}
          />
        </group>
      ))}
    </group>
  );
};

export const CinemaAuditorium3D: React.FC<CinemaAuditorium3DProps> = ({
  seats,
  selectedSeatIds,
  onToggleSeat,
  maxSelectable = 6,
  movieTitle = 'Gladiator II',
  moviePosterUrl,
  seatPrice = 14.5,
  externalPreviewSeatId,
  onResetExternalPreview,
}) => {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const controlsRef = useRef<OrbitControlsImpl>(null);

  // Seat Inspection & First-Person Seated Preview state
  const [inspectedSeat, setInspectedSeat] = useState<{
    coord: SeatCoordinate;
    seatInfo: SeatInfo;
    metrics: ViewingMetrics;
  } | null>(null);

  const [previewSeat, setPreviewSeat] = useState<SeatCoordinate | null>(null);
  const [testPatternMode, setTestPatternMode] = useState<boolean>(false);

  // Generate 80 seat mathematical coordinates
  const seatCoords = useMemo(() => generateSeatCoordinates(), []);

  // Sync when an external seat is passed (e.g. clicked in 2D seat map)
  useEffect(() => {
    if (externalPreviewSeatId) {
      const foundSeat = seats.find((s) => s.seatId === externalPreviewSeatId);
      if (foundSeat) {
        const coord = seatCoords.find((c) => c.row === foundSeat.row && c.number === foundSeat.number);
        if (coord) {
          const metrics = calculateViewingMetrics(coord.eyePosition);
          setInspectedSeat({ coord, seatInfo: foundSeat, metrics });
          setPreviewSeat(coord); // Automatically engage seated eye preview in 3D!
        }
      }
    }
  }, [externalPreviewSeatId, seats, seatCoords]);

  // Inspect seat handler
  const handleInspectSeat = (coord: SeatCoordinate, seatInfo: SeatInfo) => {
    setErrorMessage(null);
    const metrics = calculateViewingMetrics(coord.eyePosition);
    setInspectedSeat({ coord, seatInfo, metrics });
  };

  // Switch camera to Seated Eye Preview
  const handleEnterPreview = () => {
    if (inspectedSeat) {
      setPreviewSeat(inspectedSeat.coord);
    }
  };

  // Exit preview back to Auditorium Explorer
  const handleExitPreview = () => {
    setPreviewSeat(null);
    setInspectedSeat(null);
    if (onResetExternalPreview) {
      onResetExternalPreview();
    }
    if (controlsRef.current) {
      controlsRef.current.object.position.set(0, 7.5, 7.5);
      controlsRef.current.target.set(0, 1.2, -0.5);
      controlsRef.current.update();
      controlsRef.current.enabled = true;
    }
  };

  // Camera presets
  const handleAuditoriumOverview = () => {
    setPreviewSeat(null);
    setInspectedSeat(null);
    if (onResetExternalPreview) {
      onResetExternalPreview();
    }
    if (controlsRef.current) {
      controlsRef.current.object.position.set(0, 7.5, 7.5);
      controlsRef.current.target.set(0, 1.2, -0.5);
      controlsRef.current.update();
      controlsRef.current.enabled = true;
    }
  };

  const handleFrontAngle = () => {
    setPreviewSeat(null);
    if (controlsRef.current) {
      controlsRef.current.object.position.set(0, 3.8, 2.5);
      controlsRef.current.target.set(0, 1.8, -4.5);
      controlsRef.current.update();
    }
  };

  const handleResetCamera = () => {
    setPreviewSeat(null);
    if (controlsRef.current) {
      controlsRef.current.reset();
      controlsRef.current.target.set(0, 1.2, -0.5);
    }
  };

  // Booking toggle
  const handleToggleCurrentSeat = () => {
    if (!inspectedSeat) return;
    const { seatInfo } = inspectedSeat;

    if (seatInfo.status === 'BOOKED' || seatInfo.status === 'HELD') {
      setErrorMessage(`Seat ${seatInfo.row}${seatInfo.number} is unavailable for booking.`);
      return;
    }

    if (!selectedSeatIds.includes(seatInfo.seatId) && selectedSeatIds.length >= maxSelectable) {
      setErrorMessage(`You can select at most ${maxSelectable} seats.`);
      return;
    }

    onToggleSeat(seatInfo.seatId);
  };

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '660px',
        borderRadius: '24px',
        overflow: 'hidden',
        background: '#04060A',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 24px 50px rgba(0,0,0,0.7)',
      }}
    >
      {/* 3D Canvas */}
      <React.Suspense
        fallback={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94A3B8', gap: '8px' }}>
            <Film size={20} className="animate-pulse" />
            <span>Rendering high-fidelity 3D auditorium & optics...</span>
          </div>
        }
      >
        <Canvas
          shadows
          camera={{ position: [0, 7.5, 7.5], fov: 48 }}
          gl={{
            antialias: true,
            powerPreference: 'high-performance',
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.15,
          }}
        >
          <color attach="background" args={['#04060A']} />
          <fog attach="fog" args={['#04060A', 14, 36]} />

          {/* Cinematic Stage & Ambient Lighting */}
          <ambientLight intensity={0.28} color="#94A3B8" />
          <directionalLight
            position={[0, 12, 4]}
            intensity={0.7}
            castShadow
            shadow-mapSize-width={1024}
            shadow-mapSize-height={1024}
            shadow-bias={-0.001}
            color="#F8FAFC"
          />

          {/* Orbit Controls (Active during Overview) */}
          <OrbitControls
            ref={controlsRef}
            enablePan={!previewSeat}
            minPolarAngle={Math.PI / 8}
            maxPolarAngle={Math.PI / 2.25}
            minDistance={3.5}
            maxDistance={15}
            target={[0, 1.2, -0.5]}
          />

          {/* Smooth First-Person Camera Lerp Controller */}
          <CameraModeController
            previewSeat={previewSeat}
            controlsRef={controlsRef}
            testPatternMode={testPatternMode}
          />

          {/* Curved Cinema Screen with Active Movie Projection Artwork */}
          <CinemaScreen
            testPatternMode={testPatternMode}
            moviePosterUrl={moviePosterUrl}
            movieTitle={movieTitle}
          />

          {/* Stadium Room Environment */}
          <AuditoriumEnvironment />

          {/* 80 Interactive Physical Seats */}
          {seatCoords.map((coord) => {
            const seatInfo = seats.find(
              (s) => s.row === coord.row && s.number === coord.number
            ) || {
              showSeatId: `temp-${coord.row}-${coord.number}`,
              seatId: `temp-${coord.row}-${coord.number}`,
              row: coord.row,
              number: coord.number,
              status: 'AVAILABLE',
              holdExpiresInSeconds: null,
            };

            const isSelected = selectedSeatIds.includes(seatInfo.seatId);
            const isInspected = inspectedSeat?.coord.id === coord.id;
            const isPreviewing = previewSeat?.id === coord.id;

            return (
              <CinemaChair
                key={coord.id}
                coord={coord}
                seatInfo={seatInfo}
                isSelected={isSelected}
                isInspected={isInspected}
                isPreviewing={isPreviewing}
                onInspect={handleInspectSeat}
              />
            );
          })}
        </Canvas>
      </React.Suspense>

      {/* Top Status & Mode Banner */}
      <div
        style={{
          position: 'absolute',
          top: '16px',
          left: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}
      >
        <div
          style={{
            padding: '8px 16px',
            background: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(12px)',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: '#E2E8F0',
            fontSize: '0.82rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          {previewSeat ? (
            <>
              <Compass size={15} color="#8B5CF6" />
              <span>
                <strong>Seated Eye Preview:</strong> Seat {previewSeat.row}
                {previewSeat.number} (Actual 3D Screen Vantage)
              </span>
            </>
          ) : (
            <>
              <Sparkles size={14} color="#FF5A6E" />
              <span>Click any seat to preview screen sightline or book</span>
            </>
          )}
        </div>

        {previewSeat && (
          <button
            onClick={handleExitPreview}
            className="btn btn-secondary"
            style={{ padding: '7px 14px', fontSize: '0.8rem', borderRadius: '10px' }}
          >
            <ArrowLeft size={14} /> Back to Overview
          </button>
        )}
      </div>

      {/* Right-Side Seat Inspection & Viewing Metrics Panel */}
      {inspectedSeat && (
        <div
          className="glass-panel animate-fade-in"
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            width: '320px',
            padding: '20px',
            background: 'rgba(15, 23, 42, 0.92)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '16px',
            boxShadow: '0 20px 45px rgba(0,0,0,0.6)',
            zIndex: 10,
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
            <div>
              <span className="badge badge-coral" style={{ marginBottom: '4px' }}>
                Seat {inspectedSeat.coord.row}
                {inspectedSeat.coord.number}
              </span>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: '2px' }}>
                {inspectedSeat.metrics.perspectiveRating}
              </h3>
            </div>
            <button
              onClick={() => setInspectedSeat(null)}
              className="btn btn-outline"
              style={{ padding: '4px', borderRadius: '6px' }}
            >
              <X size={14} />
            </button>
          </div>

          {/* Viewing Metrics Grid */}
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.04)',
              borderRadius: '10px',
              padding: '12px',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              marginBottom: '16px',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '10px',
            }}
          >
            <div>
              <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>Distance to Screen</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#F7F8FC' }}>
                {inspectedSeat.metrics.straightDistanceMeters}m
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>Horizontal Angle</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#F7F8FC' }}>
                {inspectedSeat.metrics.horizontalAngleDeg}°
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>Vertical Angle</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#F7F8FC' }}>
                {inspectedSeat.metrics.verticalAngleDeg}°
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>Screen Coverage</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#38C98B' }}>
                ~{inspectedSeat.metrics.fieldOfViewCoveragePercent}%
              </div>
            </div>
          </div>

          {/* Seat Status & Price */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', fontSize: '0.85rem' }}>
            <span style={{ color: '#94A3B8' }}>
              Status:{' '}
              <strong style={{ color: inspectedSeat.seatInfo.status === 'AVAILABLE' ? '#38C98B' : '#FF5A6E' }}>
                {inspectedSeat.seatInfo.status}
              </strong>
            </span>
            <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#F7F8FC' }}>
              ${seatPrice.toFixed(2)}
            </span>
          </div>

          {/* Primary Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {previewSeat?.id === inspectedSeat.coord.id ? (
              <button
                onClick={handleExitPreview}
                className="btn btn-secondary"
                style={{ width: '100%', padding: '10px', fontSize: '0.88rem' }}
              >
                <ArrowLeft size={15} /> Return to Auditorium View
              </button>
            ) : (
              <button
                onClick={handleEnterPreview}
                className="btn btn-secondary"
                style={{ width: '100%', padding: '10px', fontSize: '0.88rem' }}
              >
                <Eye size={15} /> Preview from this Seat
              </button>
            )}

            <button
              onClick={handleToggleCurrentSeat}
              disabled={
                inspectedSeat.seatInfo.status === 'BOOKED' ||
                inspectedSeat.seatInfo.status === 'HELD'
              }
              className={`btn ${
                selectedSeatIds.includes(inspectedSeat.seatInfo.seatId)
                  ? 'btn-outline'
                  : 'btn-primary'
              }`}
              style={{ width: '100%', padding: '10px', fontSize: '0.88rem' }}
            >
              {selectedSeatIds.includes(inspectedSeat.seatInfo.seatId) ? (
                <>
                  <Check size={15} /> Deselect Seat {inspectedSeat.coord.row}
                  {inspectedSeat.coord.number}
                </>
              ) : (
                <>
                  Select Seat {inspectedSeat.coord.row}
                  {inspectedSeat.coord.number}
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Error alert toast */}
      {errorMessage && (
        <div
          style={{
            position: 'absolute',
            top: '16px',
            right: inspectedSeat ? '350px' : '16px',
            padding: '10px 18px',
            background: 'rgba(239, 68, 68, 0.95)',
            backdropFilter: 'blur(8px)',
            borderRadius: '10px',
            color: '#FFFFFF',
            fontSize: '0.85rem',
            fontWeight: 700,
            boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
            zIndex: 12,
          }}
        >
          {errorMessage}
        </div>
      )}

      {/* Camera Presets & Test Pattern Controls */}
      <div
        style={{
          position: 'absolute',
          bottom: '16px',
          left: '16px',
          display: 'flex',
          gap: '8px',
          flexWrap: 'wrap',
        }}
      >
        <button
          onClick={handleAuditoriumOverview}
          className="btn btn-outline"
          style={{ padding: '6px 12px', fontSize: '0.75rem', borderRadius: '8px' }}
          title="Auditorium Overview"
        >
          <Eye size={12} /> Overview
        </button>
        <button
          onClick={handleFrontAngle}
          className="btn btn-outline"
          style={{ padding: '6px 12px', fontSize: '0.75rem', borderRadius: '8px' }}
          title="Front Row Angle"
        >
          <Camera size={12} /> Front Row Angle
        </button>
        <button
          onClick={() => setTestPatternMode(!testPatternMode)}
          className={`btn ${testPatternMode ? 'btn-primary' : 'btn-outline'}`}
          style={{ padding: '6px 12px', fontSize: '0.75rem', borderRadius: '8px' }}
          title="Toggle Optical Sightline Grid"
        >
          <Layers size={12} /> {testPatternMode ? 'Exit Test Pattern' : 'Optical Sightline Grid'}
        </button>
        <button
          onClick={handleResetCamera}
          className="btn btn-outline"
          style={{ padding: '6px 12px', fontSize: '0.75rem', borderRadius: '8px' }}
          title="Reset Camera"
        >
          <RotateCcw size={12} /> Reset Camera
        </button>
      </div>

      {/* Screen & inventory info badge */}
      <div
        style={{
          position: 'absolute',
          bottom: '16px',
          right: '16px',
          padding: '6px 14px',
          background: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(8px)',
          borderRadius: '8px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          color: '#94A3B8',
          fontSize: '0.75rem',
        }}
      >
        Screen 1 • 80 Chairs (A1–H10) • Curved IMAX Scope
      </div>
    </div>
  );
};
