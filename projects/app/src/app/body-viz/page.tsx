'use client';

import { useState, useCallback } from 'react';
import {
  Box, Heading, Text, SimpleGrid, Card, CardHeader, CardBody,
  VStack, HStack, useColorModeValue, useToast, Button, Icon,
  Divider, useDisclosure,
} from '@chakra-ui/react';
import { FiRefreshCw, FiDownload } from 'react-icons/fi';
import { BodyMap3D, BodyMapLegend } from '@medical/web/components/body-map';
import type { HealthStatus, SimpleBodyPart } from '@medical/web/components/body-map';
import { SIMPLE_BODY_PARTS, PART_LABELS } from '@medical/web/components/body-map';

// =====================================================================
//  健康状态配色（与 BodyMap3D 一致）
// =====================================================================

const STATUS_COLORS: Record<HealthStatus, string> = {
  healthy: '#229955',
  attention: '#e6b020',
  problem: '#dd3333',
};

const STATUS_LABELS: Record<HealthStatus, string> = {
  healthy: '健康',
  attention: '观察中',
  problem: '异常',
};

const STATUS_ICONS: Record<HealthStatus, string> = {
  healthy: '🟢',
  attention: '🟡',
  problem: '🔴',
};

// =====================================================================
//  页面组件
// =====================================================================

export default function BodyVizPage() {
  const toast = useToast();
  const cardBg = useColorModeValue('white', 'gray.700');

  const [regionStatus, setRegionStatus] = useState<Record<string, HealthStatus>>(() => {
    const initial: Record<string, HealthStatus> = {};
    for (const part of SIMPLE_BODY_PARTS) {
      initial[part] = 'healthy';
    }
    return initial;
  });

  const [lastClickedPart, setLastClickedPart] = useState<string | null>(null);

  /** 点击身体部位 → 循环切换状态 */
  const handleRegionClick = useCallback((regionId: string, regionName: string) => {
    setLastClickedPart(regionId);
    setRegionStatus((prev) => {
      const current = prev[regionId] || 'healthy';
      const order: HealthStatus[] = ['healthy', 'attention', 'problem'];
      const nextIdx = (order.indexOf(current) + 1) % order.length;
      const next = order[nextIdx];
      return { ...prev, [regionId]: next };
    });
    const newStatus: HealthStatus =
      regionStatus[regionId] === 'healthy' ? 'attention'
      : regionStatus[regionId] === 'attention' ? 'problem'
      : 'healthy';
    toast({
      title: `${regionName} → ${STATUS_ICONS[newStatus]} ${STATUS_LABELS[newStatus]}`,
      status: newStatus === 'problem' ? 'warning' : newStatus === 'attention' ? 'info' : 'success',
      duration: 2000,
      isClosable: true,
    });
  }, [regionStatus, toast]);

  /** 重置全部为健康 */
  const handleResetAll = () => {
    const reset: Record<string, HealthStatus> = {};
    for (const part of SIMPLE_BODY_PARTS) {
      reset[part] = 'healthy';
    }
    setRegionStatus(reset);
    setLastClickedPart(null);
    toast({ title: '✅ 全部部位已重置为健康', status: 'success', duration: 2000 });
  };

  /** 设置指定部位状态（供图例点击） */
  const handleLegendClick = (status: HealthStatus) => {
    if (!lastClickedPart) {
      toast({ title: '请先在人体模型上点击一个部位', status: 'info', duration: 2000 });
      return;
    }
    setRegionStatus((prev) => ({ ...prev, [lastClickedPart]: status }));
    const label = PART_LABELS[lastClickedPart] || lastClickedPart;
    toast({
      title: `${label} → ${STATUS_ICONS[status]} ${STATUS_LABELS[status]}`,
      status: status === 'problem' ? 'warning' : status === 'attention' ? 'info' : 'success',
      duration: 2000,
    });
  };

  /** 统计 */
  const healthyCount = Object.values(regionStatus).filter((s) => s === 'healthy').length;
  const attentionCount = Object.values(regionStatus).filter((s) => s === 'attention').length;
  const problemCount = Object.values(regionStatus).filter((s) => s === 'problem').length;

  return (
    <Box>
      {/* 页面标题 */}
      <Box mb={6}>
        <Heading size="md">🫀 人体健康三维可视化</Heading>
        <Text fontSize="sm" color="gray.500">
          交互式3D人体模型 · 点击部位切换健康状态 · 支持GLB模型导入
        </Text>
      </Box>

      <SimpleGrid columns={{ base: 1, xl: 3 }} spacing={6}>
        {/* 左侧：3D人体模型 */}
        <Card bg={cardBg} gridColumn={{ xl: 'span 2' }}>
          <CardHeader pb={2}>
            <HStack justify="space-between">
              <Box>
                <Heading size="sm">🧍 人体模型</Heading>
                <Text fontSize="xs" color="gray.400">拖拽旋转 · 滚轮缩放 · 点击部位</Text>
              </Box>
              <HStack spacing={2}>
                <Button
                  size="xs"
                  variant="outline"
                  colorScheme="brand"
                  leftIcon={<FiRefreshCw />}
                  onClick={handleResetAll}
                >
                  重置全部
                </Button>
              </HStack>
            </HStack>
          </CardHeader>
          <CardBody p={0} overflow="hidden" borderBottomRadius="xl">
            <BodyMap3D
              variant="simple"
              regions={Object.entries(regionStatus).map(([id, status]) => ({
                id,
                name: PART_LABELS[id] || id,
                status,
              }))}
              onRegionClick={handleRegionClick}
            />
          </CardBody>
        </Card>

        {/* 右侧：状态面板 + 图例 */}
        <VStack spacing={4} align="stretch">
          {/* 部位状态列表 */}
          <Card bg={cardBg}>
            <CardHeader pb={2}>
              <Heading size="sm">📍 部位状态</Heading>
              <Text fontSize="xs" color="gray.400">
                点击模型或下方列表切换
              </Text>
            </CardHeader>
            <CardBody>
              <VStack align="stretch" spacing={1}>
                {SIMPLE_BODY_PARTS.map((partId) => {
                  const status = regionStatus[partId] || 'healthy';
                  const isActive = lastClickedPart === partId;
                  return (
                    <HStack
                      key={partId}
                      px={3} py={2}
                      borderRadius="md"
                      cursor="pointer"
                      bg={isActive ? 'brand.50' : 'transparent'}
                      borderLeft={isActive ? '3px solid' : '3px solid transparent'}
                      borderColor={isActive ? 'brand.400' : 'transparent'}
                      _hover={{ bg: isActive ? 'brand.100' : 'gray.50' }}
                      onClick={() => {
                        setLastClickedPart(partId);
                        const current = regionStatus[partId] || 'healthy';
                        const order: HealthStatus[] = ['healthy', 'attention', 'problem'];
                        const next = order[(order.indexOf(current) + 1) % order.length];
                        setRegionStatus((prev) => ({ ...prev, [partId]: next }));
                      }}
                      justify="space-between"
                    >
                      <HStack spacing={2}>
                        <Box w="10px" h="10px" borderRadius="full" bg={STATUS_COLORS[status]} />
                        <Text fontSize="sm" fontWeight={isActive ? 600 : 400}>
                          {PART_LABELS[partId]}
                        </Text>
                      </HStack>
                      <Text fontSize="xs" color="gray.500">
                        {STATUS_LABELS[status]}
                      </Text>
                    </HStack>
                  );
                })}
              </VStack>
            </CardBody>
          </Card>

          {/* 图例 */}
          <Card bg={cardBg}>
            <CardHeader pb={2}>
              <Heading size="sm">🎨 健康状态图例</Heading>
              <Text fontSize="xs" color="gray.400">
                选中部位后点击图例设置状态
              </Text>
            </CardHeader>
            <CardBody>
              <VStack align="stretch" spacing={2}>
                {(['healthy', 'attention', 'problem'] as HealthStatus[]).map((status) => (
                  <HStack
                    key={status}
                    px={3} py={2.5}
                    borderRadius="md"
                    cursor="pointer"
                    bg="gray.50"
                    _hover={{ bg: 'gray.100', transform: 'translateX(3px)' }}
                    transition="all 0.15s"
                    onClick={() => handleLegendClick(status)}
                    justify="space-between"
                  >
                    <HStack spacing={3}>
                      <Box w="14px" h="14px" borderRadius="full" bg={STATUS_COLORS[status]} />
                      <Text fontSize="sm" fontWeight={500}>
                        {STATUS_LABELS[status]}
                      </Text>
                    </HStack>
                    <Text fontSize="xs" color="gray.400">
                      {status === 'healthy' ? '无活跃症状' : status === 'attention' ? '既往病史/观察中' : '活跃症状待处理'}
                    </Text>
                  </HStack>
                ))}
              </VStack>
            </CardBody>
          </Card>

          {/* 统计概览 */}
          <Card bg={cardBg}>
            <CardBody>
              <SimpleGrid columns={3} spacing={3}>
                <Box textAlign="center">
                  <Text fontSize="2xl" fontWeight="700" color="#229955">{healthyCount}</Text>
                  <Text fontSize="xs" color="gray.500">健康</Text>
                </Box>
                <Box textAlign="center">
                  <Text fontSize="2xl" fontWeight="700" color="#e6b020">{attentionCount}</Text>
                  <Text fontSize="xs" color="gray.500">观察中</Text>
                </Box>
                <Box textAlign="center">
                  <Text fontSize="2xl" fontWeight="700" color="#dd3333">{problemCount}</Text>
                  <Text fontSize="xs" color="gray.500">异常</Text>
                </Box>
              </SimpleGrid>
            </CardBody>
          </Card>
        </VStack>
      </SimpleGrid>

      {/* 底部说明 */}
      <Card bg={cardBg} mt={6}>
        <CardBody py={3}>
          <HStack spacing={6} justify="center" fontSize="sm" color="gray.500" flexWrap="wrap">
            <HStack spacing={1}><Text>🖱️</Text><Text>左键拖拽 = 旋转模型</Text></HStack>
            <HStack spacing={1}><Text>🔍</Text><Text>滚轮 = 缩放远近</Text></HStack>
            <HStack spacing={1}><Text>👆</Text><Text>点击部位 = 循环切换状态</Text></HStack>
            <HStack spacing={1}><Text>⌨️</Text><Text>快捷键 R = 重置全部 · F = 重置视角</Text></HStack>
          </HStack>
          <Divider my={2} />
          <HStack spacing={4} justify="center">
            <HStack spacing={1}><Box w="10px" h="10px" borderRadius="full" bg="#229955" /><Text fontSize="xs" color="gray.500">绿色 = 健康（无活跃症状）</Text></HStack>
            <HStack spacing={1}><Box w="10px" h="10px" borderRadius="full" bg="#e6b020" /><Text fontSize="xs" color="gray.500">黄色 = 关注（有既往病史/观察中）</Text></HStack>
            <HStack spacing={1}><Box w="10px" h="10px" borderRadius="full" bg="#dd3333" /><Text fontSize="xs" color="gray.500">红色 = 异常（有活跃症状待处理）</Text></HStack>
          </HStack>
        </CardBody>
      </Card>
    </Box>
  );
}
