// POST /api/chat/completions
// 递进式 AI 问诊 - 支持 SSE 流式 + 阶段推进

import { NextRequest } from 'next/server';
import {
  chatCompletionStream,
  advanceStage,
  isEmergency,
} from '@medical/service/chat';
import { chatRequestSchema } from '@medical/global';
import type { ChatMessage, ConsultationStage, ConsultationContext } from '@medical/global';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const parsed = chatRequestSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: '参数错误', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const {
      messages,
      model,
      stream = false,
      recordIds,
      maxTokens,
      temperature,
    } = parsed.data;

    // 提取问诊上下文（由前端维护，每次请求传来）
    const consultationContext: ConsultationContext = body.consultationContext || {
      conversationId: body.chatId || '',
      currentStage: 'greeting',
      collectedInfo: {},
      stageHistory: [],
    };

    // 获取病历上下文
    let recordContext: string | undefined;
    if (recordIds && recordIds.length > 0) {
      recordContext = `关联病历 ID: ${recordIds.join(', ')}`;
    }

    // 检查紧急情况
    const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user')?.content || '';
    if (isEmergency(lastUserMsg)) {
      consultationContext.currentStage = 'suggestion';
    }

    if (stream) {
      return handleStreamResponse(messages, consultationContext, model, recordContext);
    } else {
      return handleNormalResponse(messages, consultationContext, model, recordContext);
    }
  } catch (error: any) {
    console.error('[API] 对话接口错误:', error);
    return Response.json(
      { error: '服务器内部错误', message: error.message },
      { status: 500 }
    );
  }
}

/** 流式 SSE 响应（递进式） */
async function handleStreamResponse(
  messages: ChatMessage[],
  context: ConsultationContext,
  modelId?: string,
  recordContext?: string
) {
  const encoder = new TextEncoder();
  let isClosed = false;

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const generator = chatCompletionStream(messages, modelId, recordContext);

        for await (const event of generator) {
          if (isClosed) break;

          if (event.type === 'answer' && event.content) {
            const data = JSON.stringify({
              choices: [{ delta: { content: event.content }, index: 0 }],
            });
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          } else if (event.type === 'status') {
            // 发送阶段信息
            const data = JSON.stringify({
              type: 'status',
              status: event.status,
              stage: event.content,
            });
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          } else if (event.type === 'error') {
            const data = JSON.stringify({ error: event.error });
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          }
        }

        // 回答完成后，计算下一阶段
        const userMsg = messages[messages.length - 1]?.content || '';
        const history = messages.filter((m) => m.role !== 'system');

        const { nextStage, updatedInfo } = await advanceStage(
          history,
          context.currentStage,
          context.collectedInfo
        );

        // 发送阶段推进事件
        const stageData = JSON.stringify({
          type: 'stage_advance',
          nextStage,
          collectedInfo: updatedInfo,
          isEmergency: isEmergency(userMsg),
        });
        controller.enqueue(encoder.encode(`data: ${stageData}\n\n`));

        // 发送结束信号
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      } catch (error: any) {
        const data = JSON.stringify({ error: error.message });
        controller.enqueue(encoder.encode(`data: ${data}\n\n`));
        controller.close();
      }
    },
    cancel() {
      isClosed = true;
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}

/** 普通 JSON 响应 */
async function handleNormalResponse(
  messages: ChatMessage[],
  context: ConsultationContext,
  modelId?: string,
  recordContext?: string
) {
  // 非流式暂用旧的 chatCompletion
  const { chatCompletion } = await import('@medical/service/chat');
  const result = await chatCompletion(messages, modelId, recordContext);

  return Response.json({
    id: result.id,
    object: 'chat.completion',
    created: Math.floor(Date.now() / 1000),
    model: result.model,
    choices: [
      {
        index: 0,
        message: result.message,
        finish_reason: 'stop',
      },
    ],
    usage: result.usage,
  });
}
