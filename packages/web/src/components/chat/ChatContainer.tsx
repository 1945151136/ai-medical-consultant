'use client';

import { useRef, useEffect } from 'react';
import { Box, VStack, Text, Spinner, Center } from '@chakra-ui/react';
import { MessageBubble } from './MessageBubble';
import { ChatInput } from './ChatInput';
import { DISCLAIMER } from '@medical/global';
import type { ChatMessage } from '@medical/global';

interface ChatContainerProps {
  messages: ChatMessage[];
  isStreaming: boolean;
  onSend: (content: string) => void;
  placeholder?: string;
  flex?: string;
}

export function ChatContainer({
  messages,
  isStreaming,
  onSend,
  placeholder = '描述您的症状或健康问题...',
  flex,
}: ChatContainerProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  return (
    <Box display="flex" flexDirection="column" flex={flex} h="100%">
      {/* 消息列表 */}
      <Box flex="1" overflowY="auto" px={2} mb={4}>
        {messages.length === 0 ? (
          <Center h="100%" p={8}>
            <VStack spacing={4} textAlign="center">
              <Text fontSize="lg" fontWeight="medium" color="gray.500">
                🩺 AI 医疗助手
              </Text>
              <Text fontSize="sm" color="gray.400" maxW="400px">
                我是您的 AI 医疗问诊助手，可以帮您初步分析症状、解读病历报告。
                请描述您的症状或健康问题，我会进行多轮问诊。
              </Text>
              {RenderExampleQuestions()}
              <Text fontSize="xs" color="red.400" mt={4}>
                {DISCLAIMER}
              </Text>
            </VStack>
          </Center>
        ) : (
          <VStack spacing={4} align="stretch">
            {messages.map((msg, i) => (
              <MessageBubble
                key={i}
                role={msg.role}
                content={msg.content}
                isStreaming={i === messages.length - 1 && isStreaming && msg.role === 'assistant'}
              />
            ))}
            {isStreaming && messages[messages.length - 1]?.role === 'user' && (
              <Box display="flex" alignItems="center" py={2} px={4}>
                <Spinner size="sm" color="brand.500" mr={3} />
                <Text fontSize="sm" color="gray.500">
                  AI 正在分析中...
                </Text>
              </Box>
            )}
          </VStack>
        )}
        <div ref={bottomRef} />
      </Box>

      {/* 输入区域 */}
      <Box flexShrink={0}>
        <ChatInput onSend={onSend} disabled={isStreaming} placeholder={placeholder} />
      </Box>
    </Box>
  );
}

function RenderExampleQuestions() {
  const examples = [
    '头痛3天，伴有发热38°C',
    '最近总是胸闷、心悸',
    '帮我看看这份体检报告',
  ];

  return (
    <Box mt={4}>
      <Text fontSize="xs" color="gray.400" mb={2}>
        试试这些问题:
      </Text>
      {examples.map((q, i) => (
        <Text key={i} fontSize="xs" color="brand.500" mb={1}>
          "{q}"
        </Text>
      ))}
    </Box>
  );
}
