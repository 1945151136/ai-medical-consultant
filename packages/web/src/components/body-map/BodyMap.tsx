'use client';

import { Box, Tooltip } from '@chakra-ui/react';
import { BODY_REGIONS, type HealthStatus } from './bodyRegions';
import { BodyMapLegend } from './BodyMapLegend';

interface BodyMapProps {
  regionStatus: Record<string, HealthStatus>;
  onRegionClick?: (regionId: string, regionName: string) => void;
}

const STATUS_COLORS: Record<HealthStatus, string> = {
  healthy: '#38A169',   // 绿色
  attention: '#D69E2E',  // 黄色
  problem: '#E53E3E',    // 红色
};

export function BodyMap({ regionStatus, onRegionClick }: BodyMapProps) {
  return (
    <Box>
      <BodyMapLegend />
      <Box maxW="220px" mx="auto">
        <svg viewBox="0 0 200 460" style={{ width: '100%', height: 'auto' }}>
          {/* 背景轮廓（简化人体形状） */}
          <ellipse cx="100" cy="230" rx="65" ry="190" fill="none" stroke="gray.300" strokeWidth="0.5" opacity="0.3" />

          {BODY_REGIONS.map((region) => {
            const status = regionStatus[region.id] || 'healthy';
            const color = STATUS_COLORS[status];

            return (
              <Tooltip
                key={region.id}
                label={`${region.name} - ${status === 'healthy' ? '🟢 健康' : status === 'attention' ? '🟡 关注' : '🔴 异常'}`}
                placement="right"
                hasArrow
              >
                <g
                  onClick={() => onRegionClick?.(region.id, region.name)}
                  style={{ cursor: 'pointer' }}
                >
                  <path
                    d={region.path}
                    fill={color}
                    fillOpacity={0.65}
                    stroke={color}
                    strokeWidth="1.5"
                    style={{ transition: 'all 0.3s ease' }}
                  />
                  {/* 名称标注 */}
                  <text
                    x={region.labelX}
                    y={region.labelY}
                    textAnchor="middle"
                    fill="white"
                    fontSize="9"
                    fontWeight="bold"
                    style={{ pointerEvents: 'none', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
                  >
                    {region.name}
                  </text>
                </g>
              </Tooltip>
            );
          })}

          {/* 中心线 */}
          <line x1="100" y1="0" x2="100" y2="445" stroke="gray.200" strokeWidth="0.5" strokeDasharray="2,2" opacity="0.5" />
        </svg>
      </Box>
    </Box>
  );
}
