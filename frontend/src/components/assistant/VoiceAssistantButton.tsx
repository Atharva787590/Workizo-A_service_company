import React from 'react';
import { UnnatiHelpButton, UnnatiHelpButtonProps } from './UnnatiHelpButton';

export interface VoiceAssistantButtonProps extends UnnatiHelpButtonProps {}

export const VoiceAssistantButton: React.FC<VoiceAssistantButtonProps> = (props) => {
  return <UnnatiHelpButton {...props} />;
};

export default VoiceAssistantButton;
