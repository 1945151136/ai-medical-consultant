'use client';

import { Box, HStack, Text, Tooltip, VStack } from '@chakra-ui/react';
import type { ConsultationStage } from '@medical/global';

const STAGES: { key: ConsultationStage; label: string; icon: string }[] = [
  { key: 'greeting', label: '开始', icon: '👋' },
  { key: 'chief_complaint', label: '主诉', icon: '🗣️' },
  { key: 'symptom_detail', label: '症状', icon: '🔍' },
  { key: 'history_inquiry', label: '病史', icon: '📋' },
  { key: 'differential', label: '鉴别', icon: '🧠' },
  { key: 'preliminary_dx', label: '诊断', icon: '💊' },
  { key: 'suggestion', label: '建议', icon: '📝' },
  { key: 'completed', label: '完成', icon: '✅' },
];

interface ConsultationProgressProps {
  currentStage: ConsultationStage;
}

export function ConsultationProgress({ currentStage }: ConsultationProgressProps) {
  const currentIdx = STAGES.findIndex((s) => s.key === currentStage);

  return (
    <Box px={4} py={3} bg="white" borderRadius="lg" borderWidth="1px" borderColor="gray.200" mb={4}>
      <Text fontSize="xs" color="gray.500" mb={2} fontWeight="medium">
        问诊进度
      </Text>
      <HStack spacing={1} justify="space-between" overflowX="auto">
        {STAGES.map((stage, idx) => {
          const isActive = idx <= currentIdx;
          const isCurrent = idx === currentIdx;

          return (
            <Tooltip key={stage.key} label={stage.label} placement="top" hasArrow>
              <VStack spacing={1} minW="40px" cursor="default">
                <Box
                  fontSize={isActive ? 'md' : 'sm'}
                  opacity={isActive ? 1 : 0.35}
                  filter={isActive ? 'none' : 'grayscale(100%)'}
                  transition="all 0.3s"
                  transform={isCurrent ? 'scale(1.3)' : 'scale(1)'}
                >
                  {stage.icon}
                </Box>
                <Box
                  w="100%"
                  h="3px"
                  borderRadius="full"
                  bg={isActive ? (isCurrent ? 'brand.500' : 'brand.300') : 'gray.200'}
                  transition="all 0.3s"
                />
                <Text
                  fontSize="8px"
                  color={isCurrent ? 'brand.600' : isActive ? 'gray.600' : 'gray.300'}
                  fontWeight={isCurrent ? 'bold' : 'normal'}
                  whiteSpace="nowrap"
                >
                  {stage.label}
                </Text>
              </VStack>
            </Tooltip>
          );
        })}
      </HStack>
    </Box>
  );
}
