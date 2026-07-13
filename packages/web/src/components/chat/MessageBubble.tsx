'use client';

import { Box, Text, useColorModeValue } from '@chakra-ui/react';
import { DISCLAIMER } from '@medical/global';
import type { ChatMessage } from '@medical/global';

interface MessageBubbleProps {
  role: ChatMessage['role'];
  content: string;
  isStreaming?: boolean;
}

export function MessageBubble({ role, content, isStreaming }: MessageBubbleProps) {
  const isUser = role === 'user';
  const isSystem = role === 'system';

  const userBg = useColorModeValue('brand.500', 'brand.600');
  const aiBg = useColorModeValue('white', 'gray.700');
  const systemBg = useColorModeValue('gray.100', 'gray.600');

  if (isSystem) {
    return (
      <Box
        bg={systemBg}
        px={4}
        py={2}
        borderRadius="md"
        mx="auto"
        maxW="80%"
      >
        <Text fontSize="sm" color="gray.500" textAlign="center">
          {content}
        </Text>
      </Box>
    );
  }

  return (
    <Box
      display="flex"
      justifyContent={isUser ? 'flex-end' : 'flex-start'}
    >
      <Box
        maxW="75%"
        bg={isUser ? userBg : aiBg}
        color={isUser ? 'white' : 'inherit'}
        px={4}
        py={3}
        borderRadius="lg"
        shadow="sm"
        borderWidth={isUser ? 0 : '1px'}
        borderColor={useColorModeValue('gray.100', 'gray.600')}
      >
        {/* 角色标签 */}
        <Text fontSize="xs" fontWeight="bold" mb={1} opacity={0.7}>
          {isUser ? '👤 您' : '🩺 AI 医疗助手'}
        </Text>

        {/* 消息内容 */}
        <Text fontSize="sm" whiteSpace="pre-wrap" lineHeight="tall">
          {content}
          {isStreaming && <StreamingCursor />}
        </Text>

        {/* AI 回复附免责声明 */}
        {!isUser && !isStreaming && (
          <Text fontSize="xs" color="red.400" mt={2} pt={2} borderTop="1px" borderColor="gray.100">
            ⚠️ {DISCLAIMER.substring(0, 50)}...
          </Text>
        )}
      </Box>
    </Box>
  );
}

function StreamingCursor() {
  return (
    <Box
      as="span"
      display="inline-block"
      w="2px"
      h="1em"
      bg="brand.500"
      ml="1px"
      animation="blink 1s infinite"
      sx={{
        '@keyframes blink': {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0 },
        },
      }}
    />
  );
}
