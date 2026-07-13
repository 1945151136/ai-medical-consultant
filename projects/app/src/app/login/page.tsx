'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Card,
  CardBody,
  Heading,
  Text,
  Button,
  VStack,
  Input,
  FormControl,
  FormLabel,
  useColorModeValue,
  useToast,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
} from '@chakra-ui/react';
import { useAuthStore } from '@medical/web/store/authStore';

export default function LoginPage() {
  const router = useRouter();
  const toast = useToast();
  const { login, register, isLoading } = useAuthStore();

  const [name, setName] = useState('');
  const [password, setPassword] = useState('');

  const cardBg = useColorModeValue('white', 'gray.700');

  const handleLogin = async () => {
    if (!name || !password) {
      toast({ title: '请填写姓名和密码', status: 'warning', duration: 2000 });
      return;
    }
    try {
      await login(name, password);
      toast({ title: '登录成功 🎉', status: 'success', duration: 2000 });
      router.push('/');
    } catch (err: any) {
      toast({ title: err.message || '登录失败', status: 'error', duration: 3000 });
    }
  };

  const handleRegister = async () => {
    if (!name || !password) {
      toast({ title: '请填写姓名和密码', status: 'warning', duration: 2000 });
      return;
    }
    if (password.length < 4) {
      toast({ title: '密码至少4位', status: 'warning', duration: 2000 });
      return;
    }
    try {
      await register(name, password);
      toast({ title: '注册成功 🎉', status: 'success', duration: 2000 });
      router.push('/');
    } catch (err: any) {
      toast({ title: err.message || '注册失败', status: 'error', duration: 3000 });
    }
  };

  return (
    <Box
      minH="100vh"
      display="flex"
      alignItems="center"
      justifyContent="center"
      bg="gray.50"
      _dark={{ bg: 'gray.900' }}
    >
      <Card bg={cardBg} w="400px" shadow="lg">
        <CardBody>
          <VStack spacing={5} py={4}>
            <Heading size="lg" color="brand.500">
              🏥 医疗智能问诊平台
            </Heading>
            <Text fontSize="sm" color="gray.500">
              AI 辅助诊断与病历分析系统
            </Text>

            <Tabs variant="soft-rounded" colorScheme="brand" width="100%" isFitted>
              <TabList mb={4}>
                <Tab fontSize="sm">登录</Tab>
                <Tab fontSize="sm">注册</Tab>
              </TabList>

              <TabPanels>
                {/* 登录 */}
                <TabPanel>
                  <VStack spacing={4}>
                    <FormControl>
                      <FormLabel fontSize="sm">姓名</FormLabel>
                      <Input
                        placeholder="请输入姓名"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                      />
                    </FormControl>
                    <FormControl>
                      <FormLabel fontSize="sm">密码</FormLabel>
                      <Input
                        type="password"
                        placeholder="请输入密码"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                      />
                    </FormControl>
                    <Button
                      colorScheme="brand"
                      width="100%"
                      onClick={handleLogin}
                      isLoading={isLoading}
                    >
                      登录
                    </Button>
                  </VStack>
                </TabPanel>

                {/* 注册 */}
                <TabPanel>
                  <VStack spacing={4}>
                    <FormControl>
                      <FormLabel fontSize="sm">姓名</FormLabel>
                      <Input
                        placeholder="请输入姓名"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </FormControl>
                    <FormControl>
                      <FormLabel fontSize="sm">密码</FormLabel>
                      <Input
                        type="password"
                        placeholder="请输入密码（至少4位）"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleRegister()}
                      />
                    </FormControl>
                    <Button
                      colorScheme="brand"
                      width="100%"
                      onClick={handleRegister}
                      isLoading={isLoading}
                    >
                      注册
                    </Button>
                  </VStack>
                </TabPanel>
              </TabPanels>
            </Tabs>

            <Text fontSize="xs" color="gray.400">
              首次使用请先注册账号
            </Text>
          </VStack>
        </CardBody>
      </Card>
    </Box>
  );
}
