'use client';

import { useState } from 'react';
import { Box, HStack, Text, IconButton, Icon } from '@chakra-ui/react';
import { FiInfo, FiX } from 'react-icons/fi';

const DISMISS_KEY = 'demo-banner-dismissed';

/**
 * 在线演示环境提示条
 * 仅当构建时设置 NEXT_PUBLIC_DEMO_MODE=1 时显示，可关闭并记忆。
 * 用于 Vercel 等无数据库 / 对象存储的托管环境，向访客说明演示范围。
 */
export function DemoBanner() {
  const isDemo = process.env.NEXT_PUBLIC_DEMO_MODE === '1';
  const [hidden, setHidden] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    try {
      return localStorage.getItem(DISMISS_KEY) === '1';
    } catch {
      return false;
    }
  });

  if (!isDemo || hidden) return null;

  return (
    <Box
      bg="orange.50"
      borderBottom="1px solid"
      borderColor="orange.200"
      px={6}
      py={2}
    >
      <HStack spacing={2} align="flex-start" maxW="960px" mx="auto">
        <Icon as={FiInfo} color="orange.500" boxSize={4} mt="3px" flexShrink={0} />
        <Text fontSize="12.5px" lineHeight="1.5" color="orange.900" flex="1">
          <b>在线演示环境：</b>
          可直接体验「AI 智能问诊」与「3D 人体可视化」；病历上传、个人档案等依赖数据库 / 对象存储的功能，
          请按 README 在本地部署后使用。
        </Text>
        <IconButton
          aria-label="关闭演示提示"
          icon={<Icon as={FiX} />}
          size="xs"
          variant="ghost"
          colorScheme="orange"
          flexShrink={0}
          onClick={() => {
            try {
              localStorage.setItem(DISMISS_KEY, '1');
            } catch {
              /* 忽略存储异常 */
            }
            setHidden(true);
          }}
        />
      </HStack>
    </Box>
  );
}
