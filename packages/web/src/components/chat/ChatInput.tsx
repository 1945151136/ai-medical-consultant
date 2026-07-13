'use client';

import { useState, useRef, type KeyboardEvent } from 'react';
import {
  Box,
  HStack,
  Textarea,
  IconButton,
  useColorModeValue,
} from '@chakra-ui/react';
import { FiSend } from 'react-icons/fi';

interface ChatInputProps {
  onSend: (content: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({
  onSend,
  disabled = false,
  placeholder = '输入您的问题...',
}: ChatInputProps) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue('');
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Box
      borderTop="1px"
      borderColor={borderColor}
      pt={3}
      bg={useColorModeValue('white', 'gray.800')}
    >
      <HStack spacing={2} align="flex-end">
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          size="sm"
          rows={3}
          resize="none"
          borderRadius="md"
          _focus={{ borderColor: 'brand.500' }}
        />
        <IconButton
          aria-label="发送"
          icon={<FiSend />}
          colorScheme="brand"
          onClick={handleSend}
          isDisabled={!value.trim() || disabled}
          size="md"
          flexShrink={0}
        />
      </HStack>
      <Box fontSize="xs" color="gray.400" mt={1} textAlign="center">
        Shift + Enter 换行 · 内容仅供参考，不构成医疗建议
      </Box>
    </Box>
  );
}
