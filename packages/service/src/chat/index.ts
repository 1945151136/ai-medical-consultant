export {
  chatCompletion,
  chatCompletionStream,
  progressiveChatStream,
  advanceStage,
  isEmergency,
  getConsultationContext,
} from './consultationEngine';

export {
  SYSTEM_PROMPT,
  STAGE_PROMPTS,
  RECORD_ANALYSIS_PROMPT,
  STRUCTURE_EXTRACTION_PROMPT,
  MEDICATION_MATCHING_PROMPT,
  STAGE_DETECTION_PROMPT,
} from './promptTemplates';
