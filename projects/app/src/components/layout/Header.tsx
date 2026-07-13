'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box, HStack, Menu, MenuButton, MenuList, MenuItem,
  MenuDivider, Avatar, Text, Badge,
} from '@chakra-ui/react';
import { FiUser, FiLogOut, FiSettings } from 'react-icons/fi';
import { useAuthStore } from '@medical/web/store/authStore';

export function Header() {
  const router = useRouter();
  const { user, isAuthenticated, loadProfile, logout } = useAuthStore();

  useEffect(() => {
    loadProfile();
  }, []);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const roleBadge: Record<string, { label: string; color: string }> = {
    admin: { label: '管理员', color: 'brand' },
    doctor: { label: '医生', color: 'green' },
    patient: { label: '患者', color: 'gray' },
  };
  const role = roleBadge[user?.role || ''] || { label: '访客', color: 'gray' };

  return (
    <Box
      as="header"
      h="56px"
      bg="surface.card"
      borderBottom="1px solid"
      borderColor="border.default"
      display="flex"
      alignItems="center"
      justifyContent="space-between"
      px={6}
      flexShrink={0}
    >
      <HStack spacing={3}>
        <Box w="6px" h="6px" borderRadius="full" bg="medical.healthy" />
        <Text fontSize="12px" color="text.tertiary" fontWeight={500}>
          系统运行中
        </Text>
      </HStack>

      <HStack spacing={4}>
        <Menu>
          <MenuButton>
            <HStack spacing={2} cursor="pointer">
              <Avatar
                size="sm"
                name={isAuthenticated ? user?.name : '?'}
                bg={isAuthenticated ? 'brand.500' : 'gray.300'}
                borderRadius="lg"
              />
              <Box textAlign="left" display={{ base: 'none', md: 'block' }}>
                <Text fontSize="13px" fontWeight={600} color="text.primary" lineHeight="1.3">
                  {isAuthenticated ? user?.name : '未登录'}
                </Text>
                {isAuthenticated && (
                  <Badge colorScheme={role.color} variant="subtle" fontSize="10px" mt="1px">
                    {role.label}
                  </Badge>
                )}
              </Box>
            </HStack>
          </MenuButton>
          <MenuList borderRadius="xl" shadow="md" borderColor="border.default">
            {isAuthenticated ? (
              <>
                <MenuItem icon={<FiUser />} onClick={() => router.push('/profile')} borderRadius="md">
                  个人档案
                </MenuItem>
                <MenuItem icon={<FiSettings />} onClick={() => router.push('/profile')} borderRadius="md">
                  档案设置
                </MenuItem>
                <MenuDivider />
                <MenuItem icon={<FiLogOut />} onClick={handleLogout} borderRadius="md" color="medical.critical">
                  退出登录
                </MenuItem>
              </>
            ) : (
              <MenuItem icon={<FiUser />} onClick={() => router.push('/login')} borderRadius="md">
                立即登录
              </MenuItem>
            )}
          </MenuList>
        </Menu>
      </HStack>
    </Box>
  );
}
