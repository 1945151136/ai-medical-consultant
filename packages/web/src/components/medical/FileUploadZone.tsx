'use client';

import { useCallback } from 'react';
import {
  Box,
  Text,
  VStack,
  Icon,
  useColorModeValue,
  List,
  ListItem,
  ListIcon,
} from '@chakra-ui/react';
import { useDropzone } from 'react-dropzone';
import { FiUploadCloud, FiFile, FiCheckCircle } from 'react-icons/fi';

interface FileUploadZoneProps {
  onFileDrop: (file: File) => void;
  file: File | null;
  disabled?: boolean;
}

export function FileUploadZone({ onFileDrop, file, disabled }: FileUploadZoneProps) {
  const borderColor = useColorModeValue('gray.300', 'gray.600');
  const activeBg = useColorModeValue('brand.50', 'brand.900');

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        onFileDrop(acceptedFiles[0]);
      }
    },
    [onFileDrop]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
    disabled,
    accept: {
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/tiff': ['.tiff'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [
        '.docx',
      ],
      'text/plain': ['.txt'],
    },
  });

  return (
    <Box
      {...getRootProps()}
      border="2px dashed"
      borderColor={isDragActive ? 'brand.500' : borderColor}
      borderRadius="xl"
      bg={isDragActive ? activeBg : 'transparent'}
      p={8}
      cursor={disabled ? 'not-allowed' : 'pointer'}
      opacity={disabled ? 0.6 : 1}
      transition="all 0.2s"
      _hover={{ borderColor: disabled ? borderColor : 'brand.400' }}
    >
      <input {...getInputProps()} />
      <VStack spacing={3} textAlign="center">
        {file ? (
          <>
            <Icon as={FiCheckCircle} boxSize={10} color="green.500" />
            <Text fontWeight="medium">{file.name}</Text>
            <Text fontSize="sm" color="gray.500">
              已选择文件，点击「开始上传和解析」继续
            </Text>
          </>
        ) : (
          <>
            <Icon
              as={FiUploadCloud}
              boxSize={12}
              color={isDragActive ? 'brand.500' : 'gray.400'}
            />
            <Text fontWeight="medium">
              {isDragActive ? '松开以添加文件' : '拖拽病历文件到此处'}
            </Text>
            <Text fontSize="sm" color="gray.400">
              或点击选择文件
            </Text>
            <List spacing={1}>
              <ListItem fontSize="xs" color="gray.400">
                <ListIcon as={FiFile} color="gray.400" />
                支持 PDF / JPG / PNG / DOCX / TXT
              </ListItem>
              <ListItem fontSize="xs" color="gray.400">
                最大文件大小: 20MB
              </ListItem>
            </List>
          </>
        )}
      </VStack>
    </Box>
  );
}
