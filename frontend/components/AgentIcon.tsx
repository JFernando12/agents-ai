import React from 'react';
import {
  CustomTradeIcon,
  BankIcon,
  ConvertionIcon,
  FacReviewIcon,
  NomReviewIcon,
  InboxIcon,
  RespondIcon,
  RiskIcon,
  CPATaxIcon,
  TravelIcon,
  ProcessIcon,
  DefaultIcon,
  CPAMemberIcon,
  RepseIcon,
} from './icons';
import type { IconName } from '@/types';

interface AgentIconProps {
  name: IconName;
  className?: string;
}

export const AgentIcon: React.FC<AgentIconProps> = ({ name, className }) => {
  const iconProps = { className };

  switch (name) {
    case 'CustomTrade':
      return <CustomTradeIcon {...iconProps} />;
    case 'Bank':
      return <BankIcon {...iconProps} />;
    case 'Convertion':
      return <ConvertionIcon {...iconProps} />;
    case 'FacReview':
      return <FacReviewIcon {...iconProps} />;
    case 'NomReview':
      return <NomReviewIcon {...iconProps} />;
    case 'Inbox':
      return <InboxIcon {...iconProps} />;
    case 'Respond':
      return <RespondIcon {...iconProps} />;
    case 'Risk':
      return <RiskIcon {...iconProps} />;
    case 'CPATax':
      return <CPATaxIcon {...iconProps} />;
    case 'Travel':
      return <TravelIcon {...iconProps} />;
    case 'Process':
      return <ProcessIcon {...iconProps} />;
    case 'CPAMember':
      return <CPAMemberIcon {...iconProps} />;
    case 'Repse':
      return <RepseIcon {...iconProps} />;
    default:
      return <DefaultIcon {...iconProps} />;
  }
};