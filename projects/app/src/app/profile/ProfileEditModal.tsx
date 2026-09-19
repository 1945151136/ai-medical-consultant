'use client';

import { useState } from 'react';
import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter,
  Button, FormControl, FormLabel, Select, Input, NumberInput,
  NumberInputField, NumberInputStepper, NumberIncrementStepper,
  NumberDecrementStepper, VStack, HStack, Text, useToast, Divider,
  Tag, TagLabel, TagCloseButton, Wrap, WrapItem,
} from '@chakra-ui/react';
import { FiPlus } from 'react-icons/fi';
import { useAuthStore } from '@medical/web/store/authStore';

interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const GENDER_OPTIONS = [
  { value: 'male', label: '男' },
  { value: 'female', label: '女' },
  { value: 'unknown', label: '未设置' },
];

const BLOOD_TYPE_OPTIONS = [
  { value: 'A', label: 'A 型' },
  { value: 'B', label: 'B 型' },
  { value: 'AB', label: 'AB 型' },
  { value: 'O', label: 'O 型' },
  { value: 'unknown', label: '未知' },
];

export function ProfileEditModal({ isOpen, onClose }: ProfileEditModalProps) {
  const toast = useToast();
  const user = useAuthStore((s) => s.user);
  const updateProfile = useAuthStore((s) => s.updateProfile);

  const [gender, setGender] = useState(user?.profile?.gender || 'unknown');
  const [bloodType, setBloodType] = useState(user?.profile?.bloodType || 'unknown');
  const [height, setHeight] = useState<number | undefined>(user?.profile?.height);
  const [weight, setWeight] = useState<number | undefined>(user?.profile?.weight);
  const [newAllergy, setNewAllergy] = useState('');
  const [allergies, setAllergies] = useState<string[]>(user?.profile?.allergies || []);
  const [newDisease, setNewDisease] = useState('');
  const [chronicDiseases, setChronicDiseases] = useState<string[]>(
    user?.profile?.chronicDiseases || [],
  );
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile({
        gender: gender as 'male' | 'female' | 'unknown',
        bloodType: bloodType as 'A' | 'B' | 'AB' | 'O' | 'unknown',
        height: height || undefined,
        weight: weight || undefined,
        allergies,
        chronicDiseases,
      });
      toast({ title: '个人档案已更新', status: 'success', duration: 3000 });
      onClose();
    } catch (err: any) {
      toast({ title: '更新失败', description: err.message, status: 'error', duration: 4000 });
    } finally {
      setSaving(false);
    }
  };

  const addAllergy = () => {
    const v = newAllergy.trim();
    if (v && !allergies.includes(v)) {
      setAllergies([...allergies, v]);
      setNewAllergy('');
    }
  };

  const addDisease = () => {
    const v = newDisease.trim();
    if (v && !chronicDiseases.includes(v)) {
      setChronicDiseases([...chronicDiseases, v]);
      setNewDisease('');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" isCentered scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent borderRadius="xl" maxH="85vh">
        <ModalHeader borderBottom="1px solid" borderColor="gray.100">
          编辑个人档案
          <Text fontSize="sm" fontWeight="normal" color="gray.500" mt={1}>
            完善档案信息有助于 AI 提供更精准的问诊建议
          </Text>
        </ModalHeader>
        <ModalBody py={6}>
          <VStack spacing={6}>
            {/* 性别 */}
            <FormControl>
              <FormLabel fontWeight="500" color="gray.700">性别</FormLabel>
              <Select
                value={gender}
                onChange={(e) => setGender(e.target.value as 'male' | 'female' | 'unknown')}
                borderRadius="lg"
              >
                {GENDER_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </Select>
            </FormControl>

            {/* 血型 */}
            <FormControl>
              <FormLabel fontWeight="500" color="gray.700">血型</FormLabel>
              <Select
                value={bloodType}
                onChange={(e) => setBloodType(e.target.value as 'A' | 'B' | 'AB' | 'O' | 'unknown')}
                borderRadius="lg"
              >
                {BLOOD_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </Select>
            </FormControl>

            <HStack spacing={4} w="100%">
              {/* 身高 */}
              <FormControl>
                <FormLabel fontWeight="500" color="gray.700">身高 (cm)</FormLabel>
                <NumberInput
                  value={height || ''}
                  onChange={(_, v) => setHeight(v || undefined)}
                  min={50} max={250}
                  borderRadius="lg"
                >
                  <NumberInputField placeholder="例如: 170" borderRadius="lg" />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </FormControl>

              {/* 体重 */}
              <FormControl>
                <FormLabel fontWeight="500" color="gray.700">体重 (kg)</FormLabel>
                <NumberInput
                  value={weight || ''}
                  onChange={(_, v) => setWeight(v || undefined)}
                  min={20} max={300}
                  borderRadius="lg"
                >
                  <NumberInputField placeholder="例如: 65" borderRadius="lg" />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </FormControl>
            </HStack>

            <Divider />

            {/* 过敏史 */}
            <FormControl>
              <FormLabel fontWeight="500" color="gray.700">过敏史</FormLabel>
              <HStack mb={2}>
                <Input
                  value={newAllergy}
                  onChange={(e) => setNewAllergy(e.target.value)}
                  placeholder="输入过敏原"
                  borderRadius="lg"
                  size="sm"
                  onKeyDown={(e) => e.key === 'Enter' && addAllergy()}
                />
                <Button size="sm" leftIcon={<FiPlus />} onClick={addAllergy} flexShrink={0}>
                  添加
                </Button>
              </HStack>
              <Wrap spacing={2}>
                {allergies.map((item) => (
                  <WrapItem key={item}>
                    <Tag size="md" colorScheme="orange" borderRadius="md">
                      <TagLabel>{item}</TagLabel>
                      <TagCloseButton onClick={() => setAllergies(allergies.filter((a) => a !== item))} />
                    </Tag>
                  </WrapItem>
                ))}
              </Wrap>
              {allergies.length === 0 && (
                <Text fontSize="xs" color="gray.400">无过敏史</Text>
              )}
            </FormControl>

            {/* 慢性病 */}
            <FormControl>
              <FormLabel fontWeight="500" color="gray.700">慢性病史</FormLabel>
              <HStack mb={2}>
                <Input
                  value={newDisease}
                  onChange={(e) => setNewDisease(e.target.value)}
                  placeholder="输入慢性病"
                  borderRadius="lg"
                  size="sm"
                  onKeyDown={(e) => e.key === 'Enter' && addDisease()}
                />
                <Button size="sm" leftIcon={<FiPlus />} onClick={addDisease} flexShrink={0}>
                  添加
                </Button>
              </HStack>
              <Wrap spacing={2}>
                {chronicDiseases.map((item) => (
                  <WrapItem key={item}>
                    <Tag size="md" colorScheme="red" borderRadius="md">
                      <TagLabel>{item}</TagLabel>
                      <TagCloseButton onClick={() => setChronicDiseases(chronicDiseases.filter((d) => d !== item))} />
                    </Tag>
                  </WrapItem>
                ))}
              </Wrap>
              {chronicDiseases.length === 0 && (
                <Text fontSize="xs" color="gray.400">无慢性病史</Text>
              )}
            </FormControl>
          </VStack>
        </ModalBody>
        <ModalFooter borderTop="1px solid" borderColor="gray.100" gap={3}>
          <Button variant="outline" onClick={onClose} isDisabled={saving}>
            取消
          </Button>
          <Button colorScheme="brand" onClick={handleSave} isLoading={saving} loadingText="保存中...">
            保存档案
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
