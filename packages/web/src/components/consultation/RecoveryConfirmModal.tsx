'use client';

import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Text,
  VStack,
  Icon,
} from '@chakra-ui/react';
import { FiCheckCircle } from 'react-icons/fi';

interface RecoveryConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  diagnosis?: string;
}

export function RecoveryConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  diagnosis,
}: RecoveryConfirmModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="sm">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader textAlign="center">
          <VStack spacing={3}>
            <Icon as={FiCheckCircle} boxSize={12} color="green.400" />
            <Text fontSize="lg">问题已解决？</Text>
          </VStack>
        </ModalHeader>
        <ModalBody>
          <Text fontSize="sm" color="gray.600" textAlign="center">
            {diagnosis
              ? `确认「${diagnosis}」相关的症状已经缓解或痊愈？`
              : '确认本次问诊涉及的健康问题已经解决？'}
          </Text>
          <Text fontSize="xs" color="gray.400" textAlign="center" mt={2}>
            确认后，该病症将在您的个人档案中标记为"已痊愈"
          </Text>
        </ModalBody>
        <ModalFooter justifyContent="center" gap={3}>
          <Button variant="outline" size="sm" onClick={onClose}>
            还没好
          </Button>
          <Button colorScheme="green" size="sm" onClick={onConfirm}>
            已痊愈 ✅
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
