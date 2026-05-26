export interface CPMTask {
  id: string;
  duration: number;
  dependencies: string[];
  dependents: string[];
  status: string;
}

export interface CPMNode {
  id: string;
  duration: number;
  dependencies: string[];
  dependents: string[];
  earlyStart: number;
  earlyFinish: number;
  lateStart: number;
  lateFinish: number;
  float: number;
  isCriticalPath: boolean;
}

export interface CascadeImpact {
  sourceTaskId: string;
  directlyBlockedIds: string[];
  transitivelyBlockedIds: string[];
  estimatedDelayDays: number;
  criticalPathImpacted: boolean;
  cascadeChain: string[];
}

export interface CPMResult {
  nodes: Record<string, CPMNode>;
  criticalPath: string[];
  projectDuration: number;
  cascadeImpact?: CascadeImpact;
}
