'use client';

import { useRef, useState, Suspense } from 'react';
import { Canvas, useFrame, ThreeEvent } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { Box, Spinner, Center, Flex } from '@chakra-ui/react';

// =====================================================================
//  类型定义
// =====================================================================

export type HealthStatus = 'healthy' | 'attention' | 'problem';

/** 健康状态配色（医疗规范） */
const STATUS_COLORS: Record<HealthStatus, string> = {
  healthy: '#229955',
  attention: '#e6b020',
  problem: '#dd3333',
};

/** 状态中文标签 */
const STATUS_LABELS: Record<HealthStatus, string> = {
  healthy: '健康',
  attention: '观察中',
  problem: '异常',
};

/** 6 个简化身体部位 ID */
export const SIMPLE_BODY_PARTS = ['head', 'torso', 'leftArm', 'rightArm', 'leftLeg', 'rightLeg'] as const;
export type SimpleBodyPart = (typeof SIMPLE_BODY_PARTS)[number];

/** 部位中文名映射 */
export const PART_LABELS: Record<string, string> = {
  head: '头部', torso: '躯干',
  leftArm: '左臂', rightArm: '右臂',
  leftLeg: '左腿', rightLeg: '右腿',
  neck: '颈部', chest: '胸部', abdomen: '腹部',
  left_shoulder: '左肩', right_shoulder: '右肩',
  waist: '腰部',
};

interface BodyRegion {
  id: string;
  name: string;
  status: HealthStatus;
}

export interface BodyMap3DProps {
  regions: BodyRegion[];
  onRegionClick?: (regionId: string, regionName: string) => void;
  /** 模型变体：detailed(11区域,默认) | simple(6区域) */
  variant?: 'detailed' | 'simple';
}

// =====================================================================
//  医疗哑光材质
// =====================================================================

const MATTE_MATERIAL = {
  roughness: 0.85,
  metalness: 0.02,
};

// =====================================================================
//  场景光照 —— 柔和医疗风格
// =====================================================================

function SceneLighting() {
  return (
    <>
      <ambientLight intensity={1.6} color="#c8d6e5" />
      <directionalLight
        position={[2, 5, 3]} intensity={3.5} color="#ffffff"
        castShadow
        shadow-mapSize-width={1024} shadow-mapSize-height={1024}
        shadow-camera-left={-3} shadow-camera-right={3}
        shadow-camera-top={3} shadow-camera-bottom={-3}
        shadow-bias={-0.0001}
      />
      <directionalLight position={[-1, 1.2, 2]} intensity={1.2} color="#d4e0f0" />
      <directionalLight position={[0, 1.2, -2.5]} intensity={0.5} color="#ffffff" />
    </>
  );
}

function GroundPlane() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.55, 0]} receiveShadow>
      <planeGeometry args={[20, 20]} />
      <meshStandardMaterial color="#e8ecf1" roughness={0.95} metalness={0} />
    </mesh>
  );
}

// =====================================================================
//  简化的6部位模型组件 (variant="simple")
// =====================================================================

interface PartMeshProps {
  status: HealthStatus;
  onClick?: (e: ThreeEvent<MouseEvent>) => void;
  onPointerOver?: (e: ThreeEvent<MouseEvent>) => void;
  onPointerOut?: (e: ThreeEvent<MouseEvent>) => void;
  isHovered?: boolean;
}

function PartMaterial({ color, isHovered }: { color: string; isHovered?: boolean }) {
  return (
    <meshStandardMaterial
      color={color}
      roughness={MATTE_MATERIAL.roughness}
      metalness={MATTE_MATERIAL.metalness}
      emissive={isHovered ? color : '#000000'}
      emissiveIntensity={isHovered ? 0.2 : 0.04}
    />
  );
}

function HeadSimple({ status, onClick, onPointerOver, onPointerOut, isHovered }: PartMeshProps) {
  const color = STATUS_COLORS[status];
  return (
    <group onClick={onClick} onPointerOver={onPointerOver} onPointerOut={onPointerOut}>
      <mesh position={[0, 1.62, 0]} castShadow>
        <sphereGeometry args={[0.12, 32, 28]} />
        <PartMaterial color={color} isHovered={isHovered} />
      </mesh>
      <mesh position={[0, 1.46, 0]} castShadow>
        <cylinderGeometry args={[0.045, 0.055, 0.1, 20]} />
        <PartMaterial color={color} isHovered={isHovered} />
      </mesh>
    </group>
  );
}

function TorsoSimple({ status, onClick, onPointerOver, onPointerOut, isHovered }: PartMeshProps) {
  const color = STATUS_COLORS[status];
  return (
    <group onClick={onClick} onPointerOver={onPointerOver} onPointerOut={onPointerOut}>
      <mesh position={[0, 1.32, 0]} castShadow>
        <cylinderGeometry args={[0.17, 0.19, 0.22, 24]} />
        <PartMaterial color={color} isHovered={isHovered} />
      </mesh>
      <mesh position={[0, 1.10, 0]} castShadow>
        <cylinderGeometry args={[0.16, 0.18, 0.22, 24]} />
        <PartMaterial color={color} isHovered={isHovered} />
      </mesh>
      <mesh position={[0, 0.90, 0]} castShadow>
        <cylinderGeometry args={[0.17, 0.16, 0.16, 24]} />
        <PartMaterial color={color} isHovered={isHovered} />
      </mesh>
    </group>
  );
}

function LeftArmSimple({ status, onClick, onPointerOver, onPointerOut, isHovered }: PartMeshProps) {
  const color = STATUS_COLORS[status];
  return (
    <group onClick={onClick} onPointerOver={onPointerOver} onPointerOut={onPointerOut}>
      <mesh position={[-0.24, 1.32, 0.04]} castShadow>
        <capsuleGeometry args={[0.05, 0.24, 8, 12]} />
        <PartMaterial color={color} isHovered={isHovered} />
      </mesh>
      <mesh position={[-0.27, 1.02, 0.06]} castShadow>
        <capsuleGeometry args={[0.042, 0.22, 8, 12]} />
        <PartMaterial color={color} isHovered={isHovered} />
      </mesh>
      <mesh position={[-0.28, 0.78, 0.06]} castShadow>
        <sphereGeometry args={[0.05, 16, 12]} />
        <PartMaterial color={color} isHovered={isHovered} />
      </mesh>
    </group>
  );
}

function RightArmSimple({ status, onClick, onPointerOver, onPointerOut, isHovered }: PartMeshProps) {
  const color = STATUS_COLORS[status];
  return (
    <group onClick={onClick} onPointerOver={onPointerOver} onPointerOut={onPointerOut}>
      <mesh position={[0.24, 1.32, 0.04]} castShadow>
        <capsuleGeometry args={[0.05, 0.24, 8, 12]} />
        <PartMaterial color={color} isHovered={isHovered} />
      </mesh>
      <mesh position={[0.27, 1.02, 0.06]} castShadow>
        <capsuleGeometry args={[0.042, 0.22, 8, 12]} />
        <PartMaterial color={color} isHovered={isHovered} />
      </mesh>
      <mesh position={[0.28, 0.78, 0.06]} castShadow>
        <sphereGeometry args={[0.05, 16, 12]} />
        <PartMaterial color={color} isHovered={isHovered} />
      </mesh>
    </group>
  );
}

function LeftLegSimple({ status, onClick, onPointerOver, onPointerOut, isHovered }: PartMeshProps) {
  const color = STATUS_COLORS[status];
  return (
    <group onClick={onClick} onPointerOver={onPointerOver} onPointerOut={onPointerOut}>
      <mesh position={[-0.10, 0.66, 0]} castShadow>
        <capsuleGeometry args={[0.06, 0.30, 8, 12]} />
        <PartMaterial color={color} isHovered={isHovered} />
      </mesh>
      <mesh position={[-0.10, 0.33, 0]} castShadow>
        <capsuleGeometry args={[0.052, 0.30, 8, 12]} />
        <PartMaterial color={color} isHovered={isHovered} />
      </mesh>
      <mesh position={[-0.10, 0.03, 0.04]} castShadow>
        <boxGeometry args={[0.08, 0.05, 0.15]} />
        <PartMaterial color={color} isHovered={isHovered} />
      </mesh>
    </group>
  );
}

function RightLegSimple({ status, onClick, onPointerOver, onPointerOut, isHovered }: PartMeshProps) {
  const color = STATUS_COLORS[status];
  return (
    <group onClick={onClick} onPointerOver={onPointerOver} onPointerOut={onPointerOut}>
      <mesh position={[0.10, 0.66, 0]} castShadow>
        <capsuleGeometry args={[0.06, 0.30, 8, 12]} />
        <PartMaterial color={color} isHovered={isHovered} />
      </mesh>
      <mesh position={[0.10, 0.33, 0]} castShadow>
        <capsuleGeometry args={[0.052, 0.30, 8, 12]} />
        <PartMaterial color={color} isHovered={isHovered} />
      </mesh>
      <mesh position={[0.10, 0.03, 0.04]} castShadow>
        <boxGeometry args={[0.08, 0.05, 0.15]} />
        <PartMaterial color={color} isHovered={isHovered} />
      </mesh>
    </group>
  );
}

// =====================================================================
//  详细11部位模型组件 (variant="detailed") —— 兼容旧版 profile 页面
// =====================================================================

function HeadDetailed({ status, onClick, onPointerOver, onPointerOut, isHovered }: PartMeshProps) {
  const color = STATUS_COLORS[status];
  return (
    <mesh position={[0, 1.72, 0]} onClick={onClick} onPointerOver={onPointerOver} onPointerOut={onPointerOut} castShadow>
      <sphereGeometry args={[0.12, 32, 32, 0, Math.PI * 2, 0, Math.PI * 0.85]} />
      <PartMaterial color={color} isHovered={isHovered} />
    </mesh>
  );
}

function NeckDetailed({ status, onClick, onPointerOver, onPointerOut, isHovered }: PartMeshProps) {
  const color = STATUS_COLORS[status];
  return (
    <mesh position={[0, 1.55, 0]} onClick={onClick} onPointerOver={onPointerOver} onPointerOut={onPointerOut} castShadow>
      <cylinderGeometry args={[0.04, 0.05, 0.08, 16]} />
      <PartMaterial color={color} isHovered={isHovered} />
    </mesh>
  );
}

function ChestDetailed({ status, onClick, onPointerOver, onPointerOut, isHovered }: PartMeshProps) {
  const color = STATUS_COLORS[status];
  return (
    <group onClick={onClick} onPointerOver={onPointerOver} onPointerOut={onPointerOut}>
      <mesh position={[0, 1.4, 0]} castShadow>
        <capsuleGeometry args={[0.14, 0.25, 8, 16]} />
        <PartMaterial color={color} isHovered={isHovered} />
      </mesh>
      <mesh position={[0, 1.05, 0]} castShadow>
        <capsuleGeometry args={[0.13, 0.3, 8, 16]} />
        <PartMaterial color={color} isHovered={isHovered} />
      </mesh>
    </group>
  );
}

function AbdomenDetailed({ status, onClick, onPointerOver, onPointerOut, isHovered }: PartMeshProps) {
  const color = STATUS_COLORS[status];
  return (
    <mesh position={[0, 0.8, 0]} onClick={onClick} onPointerOver={onPointerOver} onPointerOut={onPointerOut} castShadow>
      <capsuleGeometry args={[0.12, 0.2, 8, 16]} />
      <PartMaterial color={color} isHovered={isHovered} />
    </mesh>
  );
}

function LimbsDetailed({ position, rotation, scale, status, onClick, onPointerOver, onPointerOut, isHovered }: {
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
} & PartMeshProps) {
  const color = STATUS_COLORS[status];
  return (
    <mesh position={position} rotation={rotation} scale={scale}
      onClick={onClick} onPointerOver={onPointerOver} onPointerOut={onPointerOut} castShadow>
      <capsuleGeometry args={[0.05, 0.45, 8, 12]} />
      <PartMaterial color={color} isHovered={isHovered} />
    </mesh>
  );
}

function JointDetailed({ position, status }: { position: [number, number, number]; status: HealthStatus }) {
  const color = STATUS_COLORS[status];
  return (
    <mesh position={position} castShadow>
      <sphereGeometry args={[0.06, 16, 16]} />
      <meshStandardMaterial color={color} roughness={MATTE_MATERIAL.roughness} metalness={MATTE_MATERIAL.metalness} />
    </mesh>
  );
}

function FootDetailed({ position, rotation, status, onClick, onPointerOver, onPointerOut, isHovered }: {
  position: [number, number, number];
  rotation?: [number, number, number];
} & PartMeshProps) {
  const color = STATUS_COLORS[status];
  return (
    <mesh position={position} rotation={rotation}
      onClick={onClick} onPointerOver={onPointerOver} onPointerOut={onPointerOut}>
      <boxGeometry args={[0.07, 0.04, 0.13]} />
      <PartMaterial color={color} isHovered={isHovered} />
    </mesh>
  );
}

/**
 * 简化6部位人体模型
 */
function BodyModelSimple({
  regions, onRegionClick, hoveredPart, onHoverPart,
}: BodyMap3DProps & { hoveredPart: string | null; onHoverPart: (p: string | null) => void }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 1.2) * 0.003;
    }
  });

  const getStatus = (id: string): HealthStatus =>
    regions.find((r) => r.id === id)?.status || 'healthy';

  const mkHandlers = (id: string) => ({
    onClick: (e: ThreeEvent<MouseEvent>) => { e.stopPropagation(); onRegionClick?.(id, PART_LABELS[id] || id); },
    onPointerOver: (e: ThreeEvent<MouseEvent>) => { e.stopPropagation(); onHoverPart(id); },
    onPointerOut: () => onHoverPart(null),
  });

  return (
    <group ref={groupRef} position={[0, -0.6, 0]}>
      <HeadSimple status={getStatus('head')} isHovered={hoveredPart === 'head'} {...mkHandlers('head')} />
      <TorsoSimple status={getStatus('torso')} isHovered={hoveredPart === 'torso'} {...mkHandlers('torso')} />
      <LeftArmSimple status={getStatus('leftArm')} isHovered={hoveredPart === 'leftArm'} {...mkHandlers('leftArm')} />
      <RightArmSimple status={getStatus('rightArm')} isHovered={hoveredPart === 'rightArm'} {...mkHandlers('rightArm')} />
      <LeftLegSimple status={getStatus('leftLeg')} isHovered={hoveredPart === 'leftLeg'} {...mkHandlers('leftLeg')} />
      <RightLegSimple status={getStatus('rightLeg')} isHovered={hoveredPart === 'rightLeg'} {...mkHandlers('rightLeg')} />
    </group>
  );
}

/**
 * 详细11部位人体模型（兼容旧版 profile 页面）
 */
function BodyModelDetailed({
  regions, onRegionClick, hoveredPart, onHoverPart,
}: BodyMap3DProps & { hoveredPart: string | null; onHoverPart: (p: string | null) => void }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.05;
    }
  });

  const getStatus = (id: string): HealthStatus =>
    regions.find((r) => r.id === id)?.status || 'healthy';

  const mkHandlers = (id: string) => ({
    onClick: (e: ThreeEvent<MouseEvent>) => { e.stopPropagation(); onRegionClick?.(id, PART_LABELS[id] || id); },
    onPointerOver: (e: ThreeEvent<MouseEvent>) => { e.stopPropagation(); onHoverPart(id); },
    onPointerOut: () => onHoverPart(null),
  });

  return (
    <group ref={groupRef} position={[0, -0.6, 0]}>
      <HeadDetailed status={getStatus('head')} isHovered={hoveredPart === 'head'} {...mkHandlers('head')} />
      <NeckDetailed status={getStatus('neck')} isHovered={hoveredPart === 'neck'} {...mkHandlers('neck')} />
      <ChestDetailed status={getStatus('chest')} isHovered={hoveredPart === 'chest'} {...mkHandlers('chest')} />
      <AbdomenDetailed status={getStatus('abdomen')} isHovered={hoveredPart === 'abdomen'} {...mkHandlers('abdomen')} />

      <JointDetailed position={[0.17, 1.5, 0]} status={getStatus('left_shoulder')} />
      <JointDetailed position={[-0.17, 1.5, 0]} status={getStatus('right_shoulder')} />

      <LimbsDetailed position={[0.17, 1.25, 0]} rotation={[0, 0, 0.15]}
        status={getStatus('left_arm')} isHovered={hoveredPart === 'left_arm'} {...mkHandlers('left_arm')} />
      <LimbsDetailed position={[-0.17, 1.25, 0]} rotation={[0, 0, -0.15]}
        status={getStatus('right_arm')} isHovered={hoveredPart === 'right_arm'} {...mkHandlers('right_arm')} />
      <LimbsDetailed position={[0.25, 0.95, 0]} rotation={[0, 0, 0.08]} scale={[1, 0.85, 1]}
        status={getStatus('left_arm')} isHovered={hoveredPart === 'left_arm'} {...mkHandlers('left_arm')} />
      <LimbsDetailed position={[-0.25, 0.95, 0]} rotation={[0, 0, -0.08]} scale={[1, 0.85, 1]}
        status={getStatus('right_arm')} isHovered={hoveredPart === 'right_arm'} {...mkHandlers('right_arm')} />

      <JointDetailed position={[0, 0.6, 0]} status={getStatus('waist')} />

      <LimbsDetailed position={[0.09, 0.3, 0]} rotation={[0.05, 0, 0]}
        status={getStatus('left_leg')} isHovered={hoveredPart === 'left_leg'} {...mkHandlers('left_leg')} />
      <LimbsDetailed position={[-0.09, 0.3, 0]} rotation={[-0.05, 0, 0]}
        status={getStatus('right_leg')} isHovered={hoveredPart === 'right_leg'} {...mkHandlers('right_leg')} />
      <LimbsDetailed position={[0.09, -0.08, 0]} rotation={[0.03, 0, 0]} scale={[1, 0.85, 1]}
        status={getStatus('left_leg')} isHovered={hoveredPart === 'left_leg'} {...mkHandlers('left_leg')} />
      <LimbsDetailed position={[-0.09, -0.08, 0]} rotation={[-0.03, 0, 0]} scale={[1, 0.85, 1]}
        status={getStatus('right_leg')} isHovered={hoveredPart === 'right_leg'} {...mkHandlers('right_leg')} />

      <FootDetailed position={[0.09, -0.35, 0.04]}
        status={getStatus('left_leg')} isHovered={hoveredPart === 'left_leg'} {...mkHandlers('left_leg')} />
      <FootDetailed position={[-0.09, -0.35, 0.04]}
        status={getStatus('right_leg')} isHovered={hoveredPart === 'right_leg'} {...mkHandlers('right_leg')} />

      {/* 手部球体 */}
      <mesh position={[0.32, 0.72, 0]} onClick={(e) => { e.stopPropagation(); onRegionClick?.('left_arm', '左手'); }} castShadow>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshStandardMaterial color={STATUS_COLORS[getStatus('left_arm')]} roughness={MATTE_MATERIAL.roughness} />
      </mesh>
      <mesh position={[-0.32, 0.72, 0]} onClick={(e) => { e.stopPropagation(); onRegionClick?.('right_arm', '右手'); }} castShadow>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshStandardMaterial color={STATUS_COLORS[getStatus('right_arm')]} roughness={MATTE_MATERIAL.roughness} />
      </mesh>
    </group>
  );
}

// =====================================================================
//  主组件
// =====================================================================

export function BodyMap3D({ regions, onRegionClick, variant = 'detailed' }: BodyMap3DProps) {
  const [hoveredPart, setHoveredPart] = useState<string | null>(null);

  return (
    <Box w="100%" h="420px" borderRadius="xl" overflow="hidden" bg="#e8ecf1" position="relative">
      <Suspense fallback={
        <Center h="100%"><Spinner color="brand.500" size="lg" /></Center>
      }>
        <Canvas
          camera={{ position: [0.6, 0.9, 3.8], fov: 42 }}
          gl={{ antialias: true, alpha: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.1 }}
          shadows
          style={{ background: 'linear-gradient(180deg, #f0f3f7 0%, #e2e8f0 100%)' }}
        >
          <SceneLighting />
          <GroundPlane />

          {variant === 'simple' ? (
            <BodyModelSimple
              regions={regions} onRegionClick={onRegionClick}
              hoveredPart={hoveredPart} onHoverPart={setHoveredPart}
            />
          ) : (
            <BodyModelDetailed
              regions={regions} onRegionClick={onRegionClick}
              hoveredPart={hoveredPart} onHoverPart={setHoveredPart}
            />
          )}

          <OrbitControls
            enablePan={true}
            enableDamping={true}
            dampingFactor={0.08}
            minDistance={1.2}
            maxDistance={7}
            minPolarAngle={0.3}
            maxPolarAngle={Math.PI * 0.72}
            target={[0, 0.78, 0]}
          />
        </Canvas>
      </Suspense>

      {/* 底部操作提示 */}
      <Flex
        position="absolute" bottom={2} left="50%" transform="translateX(-50%)"
        fontSize="10px" color="gray.400" bg="whiteAlpha.800" px={3} py={1}
        borderRadius="full" gap={3} alignItems="center"
      >
        <span>🖱️ 拖拽旋转</span>
        <span>🔍 滚轮缩放</span>
        <span>👆 点击部位切换状态</span>
      </Flex>
    </Box>
  );
}

// =====================================================================
//  工具函数：从病历数据映射区域状态（兼容 6 + 11 区域）
// =====================================================================

export function mapRecordsToRegionStatus(
  records: Array<{ analysis?: { medications?: Array<{ category?: string }> } }>,
): Record<string, HealthStatus> {
  const status: Record<string, HealthStatus> = {
    // 简化6部位
    head: 'healthy', torso: 'healthy',
    leftArm: 'healthy', rightArm: 'healthy',
    leftLeg: 'healthy', rightLeg: 'healthy',
    // 详细11部位（兼容旧版）
    neck: 'healthy', chest: 'healthy', abdomen: 'healthy',
    left_shoulder: 'healthy', right_shoulder: 'healthy',
    waist: 'healthy',
  };

  for (const record of records) {
    const meds = record.analysis?.medications || [];
    for (const med of meds) {
      const cat = (med.category || '').toLowerCase();
      if (/心|胸|肺|呼吸|血管/.test(cat)) {
        status.chest = 'attention';
        status.torso = status.torso === 'healthy' ? 'attention' : status.torso;
      }
      if (/头|神经|脑/.test(cat)) status.head = 'attention';
      if (/胃|肝|胆|肠|消化|胰腺/.test(cat)) {
        status.abdomen = 'attention';
        status.torso = status.torso === 'healthy' ? 'attention' : status.torso;
      }
      if (/关节|骨|四肢|臂|腿|肌肉/.test(cat)) {
        status.leftArm = 'attention'; status.rightArm = 'attention';
        status.leftLeg = 'attention'; status.rightLeg = 'attention';
      }
      if (/皮肤|过敏/.test(cat)) {
        status.head = status.head === 'healthy' ? 'attention' : status.head;
      }
    }
  }

  return status;
}
