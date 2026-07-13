'use client';

import {
  Box, VStack, Icon, Text, Divider,
} from '@chakra-ui/react';
import { useRouter, usePathname } from 'next/navigation';
import {
  FiHome, FiMessageSquare, FiUpload, FiUser, FiActivity,
} from 'react-icons/fi';

const navItems = [
  { label: '首页', icon: FiHome, path: '/' },
  { label: 'AI 问诊', icon: FiMessageSquare, path: '/consultation' },
  { label: '病历管理', icon: FiUpload, path: '/records' },
  { label: '人体可视化', icon: FiActivity, path: '/body-viz' },
  { label: '个人档案', icon: FiUser, path: '/profile' },
];

export function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/';
    return pathname.startsWith(path);
  };

  return (
    <Box
      as="nav"
      w="220px"
      bg="surface.card"
      borderRight="1px solid"
      borderColor="border.default"
      h="100vh"
      position="sticky"
      top={0}
      py={5}
      px={3}
      display={{ base: 'none', md: 'flex' }}
      flexDirection="column"
    >
      {/* Logo */}
      <Box px={3} py={1} mb={6}>
        <Text fontSize="17px" fontWeight="700" color="brand.600" letterSpacing="-0.02em">
          🏥 医疗问诊
        </Text>
        <Text fontSize="11px" color="text.tertiary" mt={0.5} fontWeight="500" letterSpacing="0.04em">
          AI MEDICAL ASSISTANT
        </Text>
      </Box>

      {/* 导航菜单 */}
      <VStack spacing="2px" align="stretch" flex="1">
        {navItems.map((item) => {
          const active = isActive(item.path);
          return (
            <Box
              key={item.path}
              display="flex"
              alignItems="center"
              px={3}
              py={2.5}
              borderRadius="xl"
              cursor="pointer"
              bg={active ? 'brand.50' : 'transparent'}
              color={active ? 'brand.600' : 'text.secondary'}
              fontWeight={active ? 600 : 400}
              fontSize="14px"
              transition="all 0.12s ease"
              role="group"
              _hover={{
                bg: active ? 'brand.100' : 'surface.hover',
                color: active ? 'brand.700' : 'text.primary',
              }}
              onClick={() => router.push(item.path)}
            >
              {/* 激活态左侧色条 — 标志性元素 */}
              {active && (
                <Box
                  position="absolute"
                  left={0}
                  top="50%"
                  transform="translateY(-50%)"
                  w="3px"
                  h="20px"
                  bg="brand.500"
                  borderRadius="full"
                />
              )}
              <Icon as={item.icon} boxSize="18px" mr={3} />
              <Text>{item.label}</Text>
            </Box>
          );
        })}
      </VStack>

      {/* 底部 */}
      <Box mt="auto">
        <Divider borderColor="border.light" mb={3} />
        <Text fontSize="11px" color="text.tertiary" textAlign="center" letterSpacing="0.03em">
          v0.1.0 · 仅供辅助参考
        </Text>
      </Box>
    </Box>
  );
}
