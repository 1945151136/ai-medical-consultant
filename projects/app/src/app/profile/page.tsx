'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box, Heading, Text, SimpleGrid, Card, CardHeader, CardBody,
  VStack, HStack, Badge, Button, Stat, StatLabel, StatNumber, StatHelpText,
  useColorModeValue, useToast, useDisclosure, Tag, TagLabel, Wrap, WrapItem,
  Divider, Icon,
} from '@chakra-ui/react';
import { FiEdit3, FiActivity, FiUser } from 'react-icons/fi';
import { BodyMap3D, BodyMapLegend } from '@medical/web/components/body-map';
import type { HealthStatus } from '@medical/web/components/body-map';
import { useAuthStore } from '@medical/web/store/authStore';
import { ProfileEditModal } from './ProfileEditModal';

export default function ProfilePage() {
  const router = useRouter();
  const toast = useToast();
  const { user, isAuthenticated, loadProfile, isLoading } = useAuthStore();
  const authHeaders = (): Record<string, string> => {
    const token = useAuthStore.getState().token;
    return token ? { Authorization: `Bearer ${token}` } : {};
  };
  const cardBg = useColorModeValue('white', 'gray.700');
  const { isOpen, onOpen, onClose } = useDisclosure();

  const regionNames: Record<string, string> = {
    head: '头部', neck: '颈部', chest: '胸部', abdomen: '腹部',
    left_shoulder: '左肩', right_shoulder: '右肩',
    left_arm: '左臂', right_arm: '右臂',
    waist: '腰部', left_leg: '左腿', right_leg: '右腿',
  };

  const [symptoms, setSymptoms] = useState<Array<{ id: string; symptom: string; fileName: string; createdAt: string }>>([]);
  const [consultationCount, setConsultationCount] = useState(0);
  const [regionStatus, setRegionStatus] = useState<Record<string, HealthStatus>>({
    head: 'healthy', neck: 'healthy', chest: 'healthy', abdomen: 'healthy',
    left_shoulder: 'healthy', right_shoulder: 'healthy', left_arm: 'healthy',
    right_arm: 'healthy', waist: 'healthy', left_leg: 'healthy', right_leg: 'healthy',
  });

  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      loadProfile();
    }
  }, []);

  // 从病历和问诊记录中计算 BodyMap 状态
  const computeBodyMapFromData = useCallback(async () => {
    try {
      const [recordsRes, summaryRes] = await Promise.all([
        fetch('/api/medical-record/list', { headers: authHeaders() }),
        fetch('/api/consultation/summary', { headers: authHeaders() }),
      ]);
      const recordsData = await recordsRes.json();
      const summaryData = await summaryRes.json();

      setConsultationCount(summaryData?.totalRecords || summaryData?.totalConsultations || 0);
      setSymptoms(summaryData?.symptoms || []);

      const records = recordsData.records || [];
      const newStatus: Record<string, HealthStatus> = {
        head: 'healthy', neck: 'healthy', chest: 'healthy', abdomen: 'healthy',
        left_shoulder: 'healthy', right_shoulder: 'healthy', left_arm: 'healthy',
        right_arm: 'healthy', waist: 'healthy', left_leg: 'healthy', right_leg: 'healthy',
      };

      for (const record of records) {
        if (record.analysis?.medications) {
          for (const med of record.analysis.medications) {
            const category = med.category?.toLowerCase() || '';
            // 根据药物类别映射到身体区域
            if (/心|胸|血管/.test(category)) {
              newStatus.chest = newStatus.chest === 'healthy' ? 'attention' : newStatus.chest;
            }
            if (/头|神经/.test(category)) {
              newStatus.head = newStatus.head === 'healthy' ? 'attention' : newStatus.head;
            }
            if (/胃|消化|肝|胆/.test(category)) {
              newStatus.abdomen = newStatus.abdomen === 'healthy' ? 'attention' : newStatus.abdomen;
            }
            if (/呼吸|肺|咳嗽/.test(category)) {
              newStatus.chest = 'attention';
            }
          }
        }
      }

      // 活跃症状统计
      const attentionCount = Object.values(newStatus).filter((s) => s === 'attention').length;
      const problemCount = Object.values(newStatus).filter((s) => s === 'problem').length;
      if (attentionCount > 0 || problemCount > 0) {
        setRegionStatus(newStatus);
      }
    } catch {
      // BodyMap 数据获取失败时保持默认状态
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      computeBodyMapFromData();
    }
  }, [isAuthenticated, computeBodyMapFromData]);

  const handleRegionClick = (regionId: string, regionName: string) => {
    const nextStatus: HealthStatus =
      regionStatus[regionId] === 'healthy' ? 'attention'
      : regionStatus[regionId] === 'attention' ? 'problem'
      : 'healthy';
    setRegionStatus((prev) => ({ ...prev, [regionId]: nextStatus }));
    toast({
      title: `${regionName}：${nextStatus === 'healthy' ? '🟢 健康' : nextStatus === 'attention' ? '🟡 关注' : '🔴 异常'}`,
      status: nextStatus === 'problem' ? 'warning' : 'info',
      duration: 2000,
    });
  };

  if (!isAuthenticated && !isLoading) {
    return (
      <Box textAlign="center" py={20}>
        <Heading size="md" mb={4}>请先登录</Heading>
        <Button colorScheme="brand" onClick={() => router.push('/login')}>
          前往登录
        </Button>
      </Box>
    );
  }

  const genderLabel = user?.profile?.gender === 'male' ? '男' : user?.profile?.gender === 'female' ? '女' : '未设置';
  const bloodLabel = user?.profile?.bloodType === 'unknown' ? '未知' : (user?.profile?.bloodType || '未设置');
  const roleLabel = user?.role === 'patient' ? '患者' : user?.role === 'doctor' ? '医生' : '管理员';

  return (
    <Box>
      <Box mb={6}>
        <Heading size="md">个人健康档案</Heading>
        <Text fontSize="sm" color="gray.500">
          管理您的个人信息、病历档案和健康状态
        </Text>
      </Box>

      <SimpleGrid columns={{ base: 1, lg: 3 }} spacing={6}>
        {/* 左侧：3D 人体健康地图 */}
        <Card bg={cardBg} gridRow="span 2">
          <CardHeader pb={2}>
            <Heading size="sm">🫀 人体健康地图</Heading>
            <Text fontSize="xs" color="gray.400">3D 交互模型 · 数据源自病历分析</Text>
          </CardHeader>
          <CardBody p={0} overflow="hidden" borderBottomRadius="xl">
            <BodyMap3D
              regions={Object.entries(regionStatus).map(([id, status]) => ({
                id,
                name: id,
                status,
              }))}
              onRegionClick={handleRegionClick}
            />
            <Box px={4} pb={3}>
              <BodyMapLegend />
            </Box>
          </CardBody>
        </Card>

        {/* 中间：基本信息（只读模式） */}
        <Card bg={cardBg}>
          <CardHeader pb={2}>
            <HStack justify="space-between">
              <Heading size="sm">👤 基本信息</Heading>
              <Button
                size="xs"
                variant="outline"
                colorScheme="brand"
                leftIcon={<FiEdit3 />}
                onClick={onOpen}
              >
                编辑档案
              </Button>
            </HStack>
          </CardHeader>
          <CardBody>
            <VStack align="stretch" spacing={4}>
              <InfoRow label="姓名" value={user?.name || '—'} />
              <InfoRow label="角色" value={roleLabel} />
              <InfoRow label="性别" value={genderLabel} />
              <InfoRow label="血型" value={bloodLabel} />
              <InfoRow label="身高" value={user?.profile?.height ? `${user.profile.height} cm` : '未设置'} />
              <InfoRow label="体重" value={user?.profile?.weight ? `${user.profile.weight} kg` : '未设置'} />
            </VStack>
          </CardBody>
        </Card>

        {/* 右侧：健康统计 + 问诊记录 */}
        <Card bg={cardBg}>
          <CardHeader pb={2}>
            <Heading size="sm">📊 健康概览</Heading>
          </CardHeader>
          <CardBody>
            <SimpleGrid columns={2} spacing={4} mb={4}>
              <Stat>
                <StatLabel fontSize="xs">问诊次数</StatLabel>
                <StatNumber fontSize="2xl" color="brand.500">{consultationCount}</StatNumber>
                <StatHelpText fontSize="xs">累计</StatHelpText>
              </Stat>
              <Stat>
                <StatLabel fontSize="xs">病历记录</StatLabel>
                <StatNumber fontSize="2xl" color="brand.700">
                  {Object.values(regionStatus).filter((s) => s !== 'healthy').length}
                </StatNumber>
                <StatHelpText fontSize="xs">需关注</StatHelpText>
              </Stat>
            </SimpleGrid>

            <Divider mb={4} />

            {/* 过敏史 */}
            {user?.profile?.allergies && user.profile.allergies.length > 0 && (
              <Box mb={3}>
                <Text fontSize="xs" fontWeight="600" color="gray.500" mb={1}>过敏史</Text>
                <Wrap spacing={1}>
                  {user.profile.allergies.map((a, i) => (
                    <WrapItem key={i}>
                      <Tag colorScheme="orange" size="sm" borderRadius="md">{a}</Tag>
                    </WrapItem>
                  ))}
                </Wrap>
              </Box>
            )}

            {/* 慢性病史 */}
            {user?.profile?.chronicDiseases && user.profile.chronicDiseases.length > 0 && (
              <Box mb={3}>
                <Text fontSize="xs" fontWeight="600" color="gray.500" mb={1}>慢性病史</Text>
                <Wrap spacing={1}>
                  {user.profile.chronicDiseases.map((d, i) => (
                    <WrapItem key={i}>
                      <Tag colorScheme="red" size="sm" borderRadius="md">{d}</Tag>
                    </WrapItem>
                  ))}
                </Wrap>
              </Box>
            )}

            {(!user?.profile?.allergies || user.profile.allergies.length === 0) &&
              (!user?.profile?.chronicDiseases || user.profile.chronicDiseases.length === 0) && (
              <Text fontSize="sm" color="gray.400" textAlign="center" py={2}>
                暂无健康记录，点击「编辑档案」完善
              </Text>
            )}

            {/* 问诊症状摘要 */}
            {symptoms.length > 0 && (
              <Box mt={4}>
                <Text fontSize="xs" fontWeight="600" color="gray.500" mb={2}>问诊记录</Text>
                <VStack align="stretch" spacing={2}>
                  {symptoms.map((s) => (
                    <Box key={s.id} fontSize="xs" color="gray.600" lineHeight="1.5"
                      p={2} bg="gray.50" borderRadius="md" borderLeft="3px solid" borderColor="brand.400">
                      {s.symptom}
                    </Box>
                  ))}
                </VStack>
              </Box>
            )}

            <Button
              mt={4}
              size="sm"
              w="100%"
              leftIcon={<FiActivity />}
              colorScheme="brand"
              variant="outline"
              onClick={() => router.push('/consultation')}
            >
              前往AI问诊
            </Button>
          </CardBody>
        </Card>
      </SimpleGrid>

      {/* 编辑档案弹窗 */}
      <ProfileEditModal isOpen={isOpen} onClose={onClose} />
    </Box>
  );
}

/** 只读信息行 */
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <HStack fontSize="sm" spacing={3}>
      <Text color="gray.500" minW="50px" fontWeight="500">{label}</Text>
      <Text color="gray.800" fontWeight="medium">{value}</Text>
    </HStack>
  );
}
