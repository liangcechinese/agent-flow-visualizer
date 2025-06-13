declare module 'cytoscape-dagre' {
  import cytoscape from 'cytoscape';

  interface DagreLayoutOptions {
    name: 'dagre';
    nodeSep?: number;
    edgeSep?: number;
    rankSep?: number;
    rankDir?: 'TB' | 'BT' | 'LR' | 'RL';
    align?: 'UL' | 'UR' | 'DL' | 'DR';
    acyclicer?: 'greedy' | undefined;
    ranker?: 'network-simplex' | 'tight-tree' | 'longest-path';
    minLen?: (edge: any) => number;
    edgeWeight?: (edge: any) => number;
    fit?: boolean;
    padding?: number;
    spacingFactor?: number;
    nodeDimensionsIncludeLabels?: boolean;
    animate?: boolean;
    animateFilter?: (node: any, i: number) => boolean;
    animationDuration?: number;
    animationEasing?: string;
    boundingBox?: { x1: number; y1: number; x2: number; y2: number; w: number; h: number } | undefined;
    transform?: (node: any, pos: any) => any;
    ready?: () => void;
    stop?: () => void;
  }

  const dagreLayout: cytoscape.Ext;
  export = dagreLayout;
} 