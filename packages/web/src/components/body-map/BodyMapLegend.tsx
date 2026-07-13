'use client';

import { HStack, Box, Text } from '@chakra-ui/react';

const LEGEND_ITEMS = [
  { color: '#38A169', label: '🟢 健康', desc: '无活跃症状' },
  { color: '#D69E2E', label: '🟡 关注', desc: '有既往病史或观察中' },
  { color: '#E53E3E', label: '🔴 异常', desc: '有活跃症状待处理' },
];

export function BodyMapLegend() {
  return (
    <HStack spacing={4} justify="center" mb={4} flexWrap="wrap">
      {LEGEND_ITEMS.map((item) => (
        <HStack key={item.label} spacing={1.5}>
          <Box w="12px" h="12px" borderRadius="full" bg={item.color} />
          <Text fontSize="xs" fontWeight="medium">{item.label}</Text>
          <Text fontSize="10px" color="gray.400">({item.desc})</Text>
        </HStack>
      ))}
    </HStack>
  );
}
