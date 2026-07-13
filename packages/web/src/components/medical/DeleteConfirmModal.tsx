'use client';

import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter,
  Button, Text, Icon, VStack,
} from '@chakra-ui/react';
import { FiAlertTriangle } from 'react-icons/fi';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemName?: string;
  isLoading?: boolean;
}

export function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  itemName = '该记录',
  isLoading = false,
}: DeleteConfirmModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="sm">
      <ModalOverlay />
      <ModalContent borderRadius="xl">
        <ModalHeader textAlign="center" pt={8} pb={0}>
          <Icon as={FiAlertTriangle} boxSize={12} color="red.400" mb={3} />
          <Text fontSize="lg" fontWeight="600">确认删除</Text>
        </ModalHeader>
        <ModalBody textAlign="center" pb={6}>
          <Text color="gray.600" fontSize="sm">
            确定要删除「<Text as="span" fontWeight="600" color="gray.800">{itemName}</Text>」吗？
          </Text>
          <Text color="red.400" fontSize="xs" mt={2}>
            此操作不可撤销，相关文件将被永久删除
          </Text>
        </ModalBody>
        <ModalFooter justifyContent="center" gap={3} pb={8}>
          <Button variant="outline" onClick={onClose} isDisabled={isLoading}>
            取消
          </Button>
          <Button
            colorScheme="red"
            onClick={onConfirm}
            isLoading={isLoading}
            loadingText="删除中..."
          >
            确认删除
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
