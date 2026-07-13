'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Heading,
  Text,
  VStack,
  Card,
  CardBody,
  Button,
  Progress,
  Alert,
  AlertIcon,
  AlertDescription,
  useColorModeValue,
  useToast,
} from '@chakra-ui/react';
import { FileUploadZone } from '@medical/web/components/medical/FileUploadZone';
import { SUPPORTED_FILE_TYPES, MAX_FILE_SIZE } from '@medical/global';

export default function UploadPage() {
  const router = useRouter();
  const toast = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cardBg = useColorModeValue('white', 'gray.700');

  const handleFileDrop = (acceptedFile: File) => {
    setError(null);
    setSuccess(false);

    // 通过扩展名判断
    const ext = acceptedFile.name.split('.').pop()?.toLowerCase();
    if (!ext || !['pdf', 'jpg', 'jpeg', 'png', 'tiff', 'docx', 'txt'].includes(ext)) {
      setError('不支持的文件格式。请上传 PDF、JPG、PNG 或 DOCX 文件');
      return;
    }

    // 验证文件大小
    if (acceptedFile.size > MAX_FILE_SIZE) {
      setError(`文件大小超过限制 (最大 ${MAX_FILE_SIZE / 1024 / 1024}MB)`);
      return;
    }

    setFile(acceptedFile);
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setProgress(0);
    setError(null);
    setSuccess(false);

    try {
      const formData = new FormData();
      formData.append('file', file);

      // 获取 auth token
      const { useAuthStore } = await import('@medical/web/store/authStore');
      const token = useAuthStore.getState().token;

      // 使用 XMLHttpRequest 跟踪实际上传进度
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const pct = Math.round((e.loaded / e.total) * 100);
          setProgress(pct);
        }
      });

      const result = await new Promise<any>((resolve, reject) => {
        xhr.open('POST', '/api/medical-record/upload');
        if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(JSON.parse(xhr.responseText));
          } else {
            try {
              const err = JSON.parse(xhr.responseText);
              reject(new Error(err.error || '上传失败'));
            } catch {
              reject(new Error(`上传失败 (${xhr.status})`));
            }
          }
        };
        xhr.onerror = () => reject(new Error('网络连接失败，请重试'));
        xhr.send(formData);
      });

      setProgress(100);
      setSuccess(true);

      // 自动触发解析
      try {
        const parseRes = await fetch('/api/medical-record/parse', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ recordId: result.recordId }),
        });
        const parseData = await parseRes.json();
        if (parseData.success) {
          toast({
            title: '上传并解析成功 ✅',
            description: `文件「${result.fileName}」已自动解析，共提取 ${parseData.textLength} 字`,
            status: 'success',
            duration: 4000,
            isClosable: true,
          });
        } else {
          toast({
            title: '已上传，解析失败',
            description: '文件已保存，可在病历管理中手动重新解析',
            status: 'warning',
            duration: 4000,
            isClosable: true,
          });
        }
      } catch {
        toast({
          title: '上传成功 ✅',
          description: '文件已上传，请在病历管理中点击解析',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }

      // 2秒后跳转到病历列表
      setTimeout(() => {
        router.push('/records');
      }, 2000);

    } catch (err: any) {
      setError(err.message || '上传失败');
      toast({ title: '上传失败', description: err.message, status: 'error', duration: 4000 });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Box maxW="600px" mx="auto">
      <Heading size="md" mb={2}>上传病历文件</Heading>
      <Text fontSize="sm" color="gray.500" mb={6}>
        上传您的病历文件，系统将自动进行 OCR 识别和结构化提取
      </Text>

      {error && (
        <Alert status="error" mb={4} borderRadius="md">
          <AlertIcon />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert status="success" mb={4} borderRadius="md">
          <AlertIcon />
          <AlertDescription>上传成功！正在跳转到病历列表...</AlertDescription>
        </Alert>
      )}

      <Card bg={cardBg} mb={6}>
        <CardBody>
          <FileUploadZone
            onFileDrop={handleFileDrop}
            file={file}
            disabled={uploading}
          />
        </CardBody>
      </Card>

      {file && (
        <Card bg={cardBg} mb={6}>
          <CardBody>
            <VStack spacing={3} align="start">
              <Text fontWeight="medium">已选择文件: {file.name}</Text>
              <Text fontSize="sm" color="gray.500">
                大小: {(file.size / 1024).toFixed(1)} KB
              </Text>

              {uploading && (
                <Progress
                  value={progress}
                  size="sm"
                  colorScheme="brand"
                  width="100%"
                  borderRadius="md"
                  hasStripe
                  isAnimated
                />
              )}

              <Button
                colorScheme="brand"
                onClick={handleUpload}
                isLoading={uploading}
                loadingText="上传中..."
                width="100%"
              >
                开始上传和解析
              </Button>
            </VStack>
          </CardBody>
        </Card>
      )}

      <Card bg="blue.50" _dark={{ bg: 'blue.900' }}>
        <CardBody>
          <Heading size="xs" mb={2}>📋 支持的文件格式</Heading>
          <Text fontSize="sm">• PDF - 电子病历、检验报告</Text>
          <Text fontSize="sm">• JPG/PNG - 病历照片 (自动 OCR 识别)</Text>
          <Text fontSize="sm">• DOCX - Word 文档病历</Text>
          <Text fontSize="sm" mt={2} color="gray.500">
            ⚠️ 最大文件大小: 20MB | 仅供辅助诊断参考
          </Text>
        </CardBody>
      </Card>
    </Box>
  );
}
