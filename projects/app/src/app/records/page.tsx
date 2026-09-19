'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box, Heading, Text, SimpleGrid, Card, CardBody, CardHeader,
  Button, Icon, VStack, HStack, Badge, Spinner, Center,
  useColorModeValue, useToast,
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalCloseButton,
  useDisclosure, Divider, Alert, AlertIcon, AlertDescription, Textarea,
} from '@chakra-ui/react';
import { FiUpload, FiFileText, FiFile, FiRefreshCw, FiTrash2, FiExternalLink } from 'react-icons/fi';
import { DeleteConfirmModal } from '@medical/web/components/medical';
import { useAuthStore } from '@medical/web/store/authStore';

interface Medication { category: string; purpose: string; typicalDrugs: string; warnings: string; }
interface Analysis { summary: string; medications: Medication[]; disclaimer: string; }
interface DxyArticle { title: string; url: string; summary?: string; }
interface RecordItem {
  id: string; fileName: string; fileType: string; fileSize: number;
  parseStatus: string; extractedText?: string; analysis?: Analysis | null;
  dxyArticles?: DxyArticle[]; createdAt: string;
}

const IS_DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === '1';

export default function RecordsPage() {
  const router = useRouter();
  const toast = useToast();
  const cardBg = useColorModeValue('white', 'gray.700');
  const token = useAuthStore((s) => s.token);
  const authHeaders = (): Record<string, string> => (token ? { Authorization: `Bearer ${token}` } : {});
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<RecordItem | null>(null);
  const [parsing, setParsing] = useState<string | null>(null);
  const [parseResult, setParseResult] = useState<any>(null);
  const [manualText, setManualText] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<RecordItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();

  const fetchRecords = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch('/api/medical-record/list', { headers: authHeaders() });
      const data = await res.json();
      if (!res.ok && data.error) {
        // 在线演示环境无数据库：静默显示空状态，不弹错误提示
        if (!IS_DEMO) {
          setError(data.error);
          toast({ title: '加载失败', description: data.error, status: 'error', duration: 5000 });
        } else {
          setRecords([]);
        }
      } else {
        setRecords(data.records || []);
      }
    } catch (err: any) {
      if (!IS_DEMO) {
        const msg = '无法连接到服务器，请确认服务已启动';
        setError(msg);
        toast({ title: '加载失败', description: msg, status: 'error', duration: 5000 });
      } else {
        setRecords([]);
      }
    }
    finally { setLoading(false); }
  }, [toast]);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/medical-record/${deleteTarget.id}`, { method: 'DELETE', headers: authHeaders() });
      const data = await res.json();
      if (res.ok) {
        toast({ title: '已删除', description: data.message, status: 'success', duration: 3000 });
        setRecords((prev) => prev.filter((r) => r.id !== deleteTarget.id));
      } else {
        toast({ title: '删除失败', description: data.error, status: 'error', duration: 4000 });
      }
    } catch {
      toast({ title: '删除失败', description: '网络错误，请稍后重试', status: 'error', duration: 4000 });
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  const handleRecordClick = async (record: RecordItem) => {
    setSelectedRecord(record);
    setParseResult(null);
    setManualText('');
    onOpen();
    try {
      const res = await fetch('/api/medical-record/list', { headers: authHeaders() });
      const data = await res.json();
      const updated = (data.records || []).find((r: RecordItem) => r.id === record.id);
      if (updated) setSelectedRecord(updated);
    } catch {
      // 刷新失败不影响已有的记录显示
    }
  };

  const handleParse = async (recordId: string, withManualText?: string) => {
    setParsing(recordId);
    setParseResult(null);
    try {
      const body: any = { recordId };
      if (withManualText) body.manualText = withManualText;

      const res = await fetch('/api/medical-record/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      setParseResult(data);

      if (data.needsUserInput) {
        toast({ title: '📷 图片文件需手动输入', description: data.message, status: 'info', duration: 5000 });
      } else if (data.success) {
        toast({ title: '解析完成 ✅', status: 'success', duration: 2000 });
        fetchRecords();
        setSelectedRecord((prev: any) => prev ? {
          ...prev, parseStatus: 'completed', extractedText: data.extractedText, analysis: data.analysis,
        } : prev);
      }
    } catch (err: any) {
      toast({ title: '解析失败', description: err.message, status: 'error', duration: 3000 });
    } finally {
      setParsing(null);
    }
  };

  const statusLabel = (status: string) => {
    switch (status) {
      case 'pending': return { label: '待解析', color: 'yellow' };
      case 'processing': return { label: '解析中', color: 'blue' };
      case 'completed': return { label: '已完成', color: 'green' };
      case 'failed': return { label: '失败', color: 'red' };
      case 'needs_input': return { label: '需录入', color: 'orange' };
      default: return { label: status, color: 'gray' };
    }
  };

  const formatSize = (bytes: number) =>
    bytes < 1024 ? `${bytes} B` : bytes < 1048576 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / 1048576).toFixed(1)} MB`;

  const currentContent = parseResult?.extractedText || selectedRecord?.extractedText;
  const currentAnalysis = parseResult?.analysis || selectedRecord?.analysis;
  const needsInput = parseResult?.needsUserInput || selectedRecord?.parseStatus === 'needs_input';

  return (
    <Box>
      <HStack justify="space-between" mb={6}>
        <Box>
          <Heading size="md">病历管理</Heading>
          <Text fontSize="sm" color="gray.500">上传病历 → 自动/手动提取 → AI用药分析</Text>
        </Box>
        <HStack>
          <Button size="sm" variant="ghost" leftIcon={<FiRefreshCw />} onClick={fetchRecords}>刷新</Button>
          <Button colorScheme="brand" leftIcon={<FiUpload />} onClick={() => router.push('/records/upload')}>上传病历</Button>
        </HStack>
      </HStack>

      {error && (
        <Alert status="error" mb={4} borderRadius="md">
          <AlertIcon />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <Center py={12}><Spinner color="brand.500" /><Text ml={3} color="gray.500">加载中...</Text></Center>
      ) : records.length === 0 ? (
        <Card bg={cardBg}><CardBody><Center py={8}><VStack spacing={3}>
          <Icon as={FiFileText} boxSize={10} color="gray.300" />
          <Text color="gray.500">{IS_DEMO ? '在线演示未启用数据库，本地部署后可体验病历上传与 AI 解析' : '暂无病历记录'}</Text>
        </VStack></Center></CardBody></Card>
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
          {records.map((record) => {
            const st = statusLabel(record.parseStatus);
            return (
              <Card key={record.id} bg={cardBg} cursor="pointer" position="relative"
                _hover={{ shadow: 'md', transform: 'translateY(-2px)' }} transition="all 0.2s"
                onClick={() => handleRecordClick(record)}>
                {/* 删除按钮 */}
                <Box position="absolute" top={2} right={2} zIndex={2}
                  onClick={(e) => e.stopPropagation()}>
                  <Button
                    size="xs"
                    colorScheme="red"
                    variant="ghost"
                    leftIcon={<FiTrash2 />}
                    onClick={() => setDeleteTarget(record)}
                  >
                    删除
                  </Button>
                </Box>
                <CardHeader pb={1}>
                  <HStack>
                    <Icon as={FiFile} color="brand.500" />
                    <Heading size="xs" flex={1} noOfLines={1} pr={12}>{record.fileName}</Heading>
                    <Badge colorScheme={st.color} variant="subtle" fontSize="xs">{st.label}</Badge>
                  </HStack>
                </CardHeader>
                <CardBody pt={0}>
                  <HStack fontSize="xs" color="gray.500" spacing={4}>
                    <Text>{formatSize(record.fileSize)}</Text>
                    <Text>{record.createdAt ? new Date(record.createdAt).toLocaleDateString('zh-CN') : ''}</Text>
                  </HStack>
                </CardBody>
              </Card>
            );
          })}
        </SimpleGrid>
      )}

      {/* 详情弹窗 */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl" scrollBehavior="inside">
        <ModalOverlay />
        <ModalContent maxH="85vh">
          <ModalHeader fontSize="md">{selectedRecord?.fileName}</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {selectedRecord && (
              <VStack align="stretch" spacing={4}>
                <HStack spacing={6} fontSize="sm">
                  <Text color="gray.500">大小: <b>{formatSize(selectedRecord.fileSize)}</b></Text>
                  <Badge colorScheme={statusLabel(selectedRecord.parseStatus).color}>
                    {statusLabel(selectedRecord.parseStatus).label}
                  </Badge>
                </HStack>

                {/* 图片类：显示手动输入框 */}
                {needsInput && (
                  <Alert status="warning" borderRadius="md" flexDirection="column" alignItems="stretch">
                    <HStack mb={2}>
                      <AlertIcon /><AlertDescription fontWeight="bold">📷 图片文件需要手动录入病历文字</AlertDescription>
                    </HStack>
                    <Textarea
                      placeholder="请将病历中的文字内容（症状、诊断、检查结果等）粘贴到这里..."
                      value={manualText}
                      onChange={(e) => setManualText(e.target.value)}
                      rows={6}
                      fontSize="sm"
                      mb={3}
                    />
                    <Button colorScheme="brand" size="sm"
                      isLoading={parsing === selectedRecord.id}
                      onClick={() => handleParse(selectedRecord.id, manualText)}
                      isDisabled={!manualText.trim()}>
                      🔍 提交文字并开始分析
                    </Button>
                  </Alert>
                )}

                {/* 解析按钮（非图片类） */}
                {!needsInput && (
                  <Button colorScheme="brand" size="sm"
                    isLoading={parsing === selectedRecord.id} loadingText="解析中..."
                    onClick={() => handleParse(selectedRecord.id)}>
                    {selectedRecord.parseStatus === 'completed' ? '🔄 重新解析' : '🔍 开始解析'}
                  </Button>
                )}

                {/* 解析内容 */}
                {currentContent && (
                  <>
                    <Divider />
                    <Box>
                      <Text fontWeight="bold" fontSize="sm" mb={2}>📄 解析内容</Text>
                      <Box bg="gray.50" p={3} borderRadius="md" maxH="200px" overflowY="auto" fontSize="sm" whiteSpace="pre-wrap">
                        {currentContent}
                      </Box>
                    </Box>
                  </>
                )}

                {/* AI 用药分析 */}
                {currentAnalysis && (
                  <>
                    <Divider />
                    <Box>
                      <Text fontWeight="bold" fontSize="sm" mb={2}>💊 AI 用药建议</Text>
                      {currentAnalysis.summary && (
                        <Alert status="info" mb={3} borderRadius="md">
                          <AlertIcon /><AlertDescription fontSize="sm">{currentAnalysis.summary}</AlertDescription>
                        </Alert>
                      )}
                      {(currentAnalysis.medications || []).map((med: Medication, idx: number) => (
                        <Card key={idx} mb={3} borderLeft="4px solid" borderColor="brand.500">
                          <CardBody py={3}>
                            <Heading size="xs" color="brand.600" mb={1}>{med.category}</Heading>
                            <VStack align="stretch" spacing={1} fontSize="sm">
                              <HStack><Text color="gray.500" minW="70px">用途：</Text><Text>{med.purpose}</Text></HStack>
                              <HStack><Text color="gray.500" minW="70px">代表药物：</Text><Text fontWeight="medium">{med.typicalDrugs}</Text></HStack>
                              <HStack><Text color="gray.500" minW="70px">注意：</Text><Text color="orange.600">{med.warnings}</Text></HStack>
                            </VStack>
                          </CardBody>
                        </Card>
                      ))}
                      <Text fontSize="xs" color="red.400" mt={2}>⚠️ {currentAnalysis.disclaimer || '以上分析仅供参考，实际用药请遵医嘱'}</Text>
                    </Box>
                  </>
                )}

                {/* 丁香园相关文章推荐 */}
                {selectedRecord.dxyArticles && selectedRecord.dxyArticles.length > 0 && (
                  <Box mt={4}>
                    <Divider mb={3} />
                    <Text fontWeight="bold" fontSize="sm" mb={3}>📚 丁香园相关文章推荐</Text>
                    <VStack align="stretch" spacing={2}>
                      {selectedRecord.dxyArticles.map((article: DxyArticle, idx: number) => (
                        <Box
                          key={idx}
                          as="a"
                          href={article.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          p={3}
                          border="1px solid"
                          borderColor="border.default"
                          borderRadius="lg"
                          _hover={{ bg: 'surface.hover', textDecoration: 'none' }}
                          transition="all 0.15s"
                        >
                          <HStack spacing={2}>
                            <Text fontSize="xs" color="brand.500" fontWeight="600">[{idx + 1}]</Text>
                            <Text fontSize="sm" fontWeight="500" flex={1}>{article.title}</Text>
                            <Icon as={FiExternalLink} boxSize={3} color="gray.400" />
                          </HStack>
                          {article.summary && (
                            <Text fontSize="xs" color="gray.500" mt={1} ml={5}>{article.summary}</Text>
                          )}
                        </Box>
                      ))}
                    </VStack>
                  </Box>
                )}
              </VStack>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* 删除确认弹窗 */}
      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        itemName={deleteTarget?.fileName}
        isLoading={deleting}
      />
    </Box>
  );
}
