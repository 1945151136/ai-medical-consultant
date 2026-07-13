'use client';

import {
  Box,
  VStack,
  HStack,
  Text,
  Tag,
  Wrap,
  WrapItem,
  Collapse,
  Button,
  useDisclosure,
} from '@chakra-ui/react';
import { FiChevronDown, FiChevronUp } from 'react-icons/fi';
import type { ConsultationContext } from '@medical/global';

interface CollectedInfoPanelProps {
  collectedInfo: ConsultationContext['collectedInfo'];
}

export function CollectedInfoPanel({ collectedInfo }: CollectedInfoPanelProps) {
  const { isOpen, onToggle } = useDisclosure({ defaultIsOpen: false });

  const hasInfo =
    collectedInfo.chiefComplaint ||
    collectedInfo.duration ||
    collectedInfo.severity ||
    (collectedInfo.symptoms && collectedInfo.symptoms.length > 0) ||
    collectedInfo.pastHistory ||
    (collectedInfo.medications && collectedInfo.medications.length > 0) ||
    (collectedInfo.allergies && collectedInfo.allergies.length > 0);

  if (!hasInfo) return null;

  return (
    <Box
      bg="white"
      borderRadius="lg"
      borderWidth="1px"
      borderColor="gray.200"
      mb={4}
      overflow="hidden"
    >
      <Button
        variant="ghost"
        width="100%"
        justifyContent="space-between"
        onClick={onToggle}
        size="sm"
        px={4}
        py={2}
        _hover={{ bg: 'gray.50' }}
      >
        <Text fontSize="xs" fontWeight="medium" color="gray.600">
          📋 已收集信息
        </Text>
        {isOpen ? <FiChevronUp /> : <FiChevronDown />}
      </Button>

      <Collapse in={isOpen}>
        <Box px={4} pb={3}>
          <VStack align="stretch" spacing={2}>
            {collectedInfo.chiefComplaint && (
              <InfoRow label="主诉" value={collectedInfo.chiefComplaint} />
            )}
            {collectedInfo.duration && (
              <InfoRow label="持续时间" value={collectedInfo.duration} />
            )}
            {collectedInfo.severity && (
              <InfoRow
                label="严重程度"
                value={
                  collectedInfo.severity === 'severe'
                    ? '🔴 重度'
                    : collectedInfo.severity === 'moderate'
                    ? '🟡 中度'
                    : '🟢 轻度'
                }
              />
            )}
            {collectedInfo.symptoms && collectedInfo.symptoms.length > 0 && (
              <TagRow label="症状" items={collectedInfo.symptoms} colorScheme="red" />
            )}
            {collectedInfo.pastHistory && (
              <InfoRow label="既往病史" value={collectedInfo.pastHistory} />
            )}
            {collectedInfo.medications && collectedInfo.medications.length > 0 && (
              <TagRow label="用药" items={collectedInfo.medications} colorScheme="blue" />
            )}
            {collectedInfo.allergies && collectedInfo.allergies.length > 0 && (
              <TagRow label="过敏" items={collectedInfo.allergies} colorScheme="orange" />
            )}
          </VStack>
        </Box>
      </Collapse>
    </Box>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <HStack spacing={2} fontSize="sm">
      <Text color="gray.500" fontWeight="medium" minW="70px">
        {label}：
      </Text>
      <Text color="gray.700">{value}</Text>
    </HStack>
  );
}

function TagRow({
  label,
  items,
  colorScheme,
}: {
  label: string;
  items: string[];
  colorScheme: string;
}) {
  return (
    <HStack spacing={2} fontSize="sm" align="flex-start">
      <Text color="gray.500" fontWeight="medium" minW="70px">
        {label}：
      </Text>
      <Wrap spacing={1}>
        {items.map((item, i) => (
          <WrapItem key={i}>
            <Tag size="sm" colorScheme={colorScheme} variant="subtle">
              {item}
            </Tag>
          </WrapItem>
        ))}
      </Wrap>
    </HStack>
  );
}
