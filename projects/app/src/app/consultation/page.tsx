'use client';

import { useState, useRef, useCallback } from 'react';
import {
  Box,
  Heading,
  Text,
  useColorModeValue,
  useToast,
} from '@chakra-ui/react';
import { ChatContainer } from '@medical/web/components/chat/ChatContainer';
import { ConsultationProgress } from '@medical/web/components/consultation/ConsultationProgress';
import { CollectedInfoPanel } from '@medical/web/components/consultation/CollectedInfoPanel';
import { RecoveryConfirmModal } from '@medical/web/components/consultation/RecoveryConfirmModal';
import type { ChatMessage, ConsultationStage, ConsultationContext } from '@medical/global';

const STAGE_LABELS: Record<ConsultationStage, string> = {
  greeting: '开始问诊',
  chief_complaint: '采集主诉',
  symptom_detail: '症状细节',
  history_inquiry: '病史追问',
  differential: '鉴别诊断',
  preliminary_dx: '初步诊断',
  suggestion: '诊疗建议',
  completed: '问诊完成',
};

export default function ConsultationPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [consultationContext, setConsultationContext] = useState<ConsultationContext>({
    conversationId: '',
    currentStage: 'greeting',
    collectedInfo: {},
    stageHistory: [],
  });
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const toast = useToast();

  const handleSendMessage = useCallback(
    async (content: string) => {
      const userMessage: ChatMessage = { role: 'user', content };

      setMessages((prev) => [...prev, userMessage]);
      setIsStreaming(true);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const response = await fetch('/api/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [
              ...messages,
              userMessage,
            ].map(({ role, content }) => ({ role, content })),
            stream: true,
            consultationContext,
          }),
          signal: controller.signal,
        });

        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.error || '请求失败');
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error('无法读取响应流');

        const decoder = new TextDecoder();
        let aiContent = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const rawData = line.slice(6).trim();
              if (rawData === '[DONE]') continue;

              let parsed: any;
              try {
                parsed = JSON.parse(rawData);
              } catch {
                continue;
              }

              if (parsed.error) {
                throw new Error(parsed.error);
              }

              // 阶段推进事件
              if (parsed.type === 'stage_advance') {
                setConsultationContext((prev) => ({
                  ...prev,
                  currentStage: parsed.nextStage,
                  collectedInfo: parsed.collectedInfo || prev.collectedInfo,
                  stageHistory: [
                    ...prev.stageHistory,
                    { stage: parsed.nextStage, timestamp: new Date() },
                  ],
                }));

                // 到达 completed 阶段自动弹出痊愈确认
                if (parsed.nextStage === 'completed') {
                  setTimeout(() => setShowRecoveryModal(true), 1500);
                }
                continue;
              }

              // 状态事件
              if (parsed.type === 'status' && parsed.stage) {
                setConsultationContext((prev) => ({
                  ...prev,
                  currentStage: parsed.stage,
                }));
                continue;
              }

              // Delta token
              const delta = parsed.choices?.[0]?.delta?.content;
              if (delta) {
                aiContent += delta;
                setMessages((prev) => {
                  const updated = [...prev];
                  const lastMsg = updated[updated.length - 1];
                  if (lastMsg && lastMsg.role === 'assistant') {
                    updated[updated.length - 1] = { role: 'assistant', content: aiContent };
                  } else {
                    updated.push({ role: 'assistant', content: aiContent });
                  }
                  return updated;
                });
              }
            }
          }
        }
      } catch (error: any) {
        if (error.name === 'AbortError') return;
        const errorMsg: ChatMessage = {
          role: 'assistant',
          content: `❌ 请求失败：${error.message}`,
        };
        setMessages((prev) => [...prev, errorMsg]);
      } finally {
        setIsStreaming(false);
        abortRef.current = null;
      }
    },
    [messages, consultationContext]
  );

  const handleRecoveryConfirm = () => {
    setShowRecoveryModal(false);
    toast({
      title: '已标记痊愈 ✅',
      description: '该病症已在您的个人档案中更新为"已痊愈"',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };

  return (
    <Box h="calc(100vh - 120px)" display="flex" flexDirection="column">
      {/* 页面标题 */}
      <Box mb={3}>
        <Heading size="md">AI 智能问诊</Heading>
        <Text fontSize="sm" color="gray.500">
          {STAGE_LABELS[consultationContext.currentStage]} — 递进式问诊，逐步确认病情
        </Text>
      </Box>

      {/* 问诊进度条 */}
      <ConsultationProgress currentStage={consultationContext.currentStage} />

      {/* 已收集信息面板 */}
      <CollectedInfoPanel collectedInfo={consultationContext.collectedInfo} />

      {/* 聊天区域 */}
      <ChatContainer
        messages={messages}
        isStreaming={isStreaming}
        onSend={handleSendMessage}
        flex="1"
      />

      {/* 痊愈确认弹窗 */}
      <RecoveryConfirmModal
        isOpen={showRecoveryModal}
        onClose={() => setShowRecoveryModal(false)}
        onConfirm={handleRecoveryConfirm}
        diagnosis={
          consultationContext.collectedInfo.chiefComplaint || undefined
        }
      />
    </Box>
  );
}
