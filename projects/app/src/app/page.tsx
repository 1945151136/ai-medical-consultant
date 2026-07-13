'use client';

import {
  Box,
  Heading,
  Text,
  SimpleGrid,
  Card,
  CardHeader,
  CardBody,
  Button,
  Icon,
  VStack,
  HStack,
  useColorModeValue,
} from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import { FiMessageSquare, FiUpload, FiUser } from 'react-icons/fi';

export default function HomePage() {
  const router = useRouter();
  const cardBg = useColorModeValue('white', 'gray.700');

  const features = [
    {
      title: 'AI 智能问诊',
      description: '递进式症状采集，多模型切换，流式输出诊断建议',
      icon: FiMessageSquare,
      path: '/consultation',
      color: 'brand.500',
    },
    {
      title: '病历上传解析',
      description: '支持 PDF / 图片 / DOCX 多格式病历上传，自动结构化提取',
      icon: FiUpload,
      path: '/records',
      color: 'medical.secondary',
    },
    {
      title: '个人健康档案',
      description: '专属病历档案管理，人体分区健康状态可视化',
      icon: FiUser,
      path: '/profile',
      color: 'medical.accent',
    },
  ];

  return (
    <Box>
      {/* 欢迎横幅 */}
      <Box
        bg="brand.500"
        color="white"
        borderRadius="xl"
        p={8}
        mb={8}
        textAlign="center"
      >
        <Heading size="xl" mb={2}>
          🏥 医疗智能问诊平台
        </Heading>
        <Text fontSize="lg" opacity={0.9}>
          基于大语言模型的 AI 辅助诊断与病历分析系统
        </Text>
        <Text fontSize="sm" mt={4} opacity={0.7}>
          ⚠️ 本平台提供的内容仅供参考，不构成医疗诊断或治疗建议
        </Text>
      </Box>

      {/* 功能入口卡片 */}
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
        {features.map((feature) => (
          <Card
            key={feature.path}
            bg={cardBg}
            cursor="pointer"
            onClick={() => router.push(feature.path)}
            _hover={{ shadow: 'md', transform: 'translateY(-2px)' }}
            transition="all 0.2s"
          >
            <CardHeader pb={0}>
              <HStack spacing={3}>
                <Box
                  w={10}
                  h={10}
                  borderRadius="md"
                  bg={feature.color}
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  <Icon as={feature.icon} color="white" boxSize={5} />
                </Box>
                <Heading size="sm">{feature.title}</Heading>
              </HStack>
            </CardHeader>
            <CardBody>
              <Text color="gray.500" fontSize="sm">
                {feature.description}
              </Text>
              <Button
                mt={4}
                size="sm"
                variant="outline"
                colorScheme="brand"
                width="full"
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(feature.path);
                }}
              >
                进入
              </Button>
            </CardBody>
          </Card>
        ))}
      </SimpleGrid>

      {/* 快速开始 */}
      <Card mt={8} bg={cardBg}>
        <CardHeader>
          <Heading size="md">🚀 快速开始</Heading>
        </CardHeader>
        <CardBody>
          <VStack align="start" spacing={2} pl={4}>
            <Text>1. 前往「AI 智能问诊」开始对话问诊</Text>
            <Text>2. 在「病历上传」页面上传您的病历文件进行 AI 分析</Text>
            <Text>3. 在「系统设置」中配置您的大模型 API Key
            </Text>
            <Text>4. 配置企业微信后，可在企微中直接使用问诊功能</Text>
          </VStack>
        </CardBody>
      </Card>
    </Box>
  );
}
