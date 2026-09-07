import React from 'react';
import { UnnatiHelpModal, UnnatiHelpModalProps } from './UnnatiHelpModal';

export interface VoiceAssistantModalProps extends UnnatiHelpModalProps {}

/**
 * Backwards-compatible alias for UNNATI Help Modal.
 * Preserves existing component references without duplicating UI or running legacy voice code.
 */
export const VoiceAssistantModal: React.FC<VoiceAssistantModalProps> = (props) => {
  return <UnnatiHelpModal {...props} />;
};

export default VoiceAssistantModal;
