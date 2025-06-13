import React, { useEffect, useRef, useState, useCallback } from 'react';
import cytoscape from 'cytoscape';
import dagre from 'cytoscape-dagre';
import coseBilkent from 'cytoscape-cose-bilkent';
import { Card, Descriptions, Tag, Drawer, Button, Space, Tooltip, Select, Typography, Popover } from 'antd';
import { 
  ZoomInOutlined, 
  ZoomOutOutlined, 
  FullscreenOutlined, 
  FullscreenExitOutlined,
  ReloadOutlined,
  ColumnWidthOutlined,
  InfoCircleOutlined,
  QuestionCircleOutlined
} from '@ant-design/icons';
import './FlowVisualizer.css';

const { Title } = Typography;

// 注册布局
cytoscape.use(dagre);
cytoscape.use(coseBilkent);

interface Node {
  id: string;
  label: string;
  type: string;
  timestamp?: string;
  details?: {
    full_content: string;
    line_number: number;
    style?: {
      color: string;
      shape: string;
    };
  };
}

interface Edge {
  id: string;
  source: string;
  target: string;
  label?: string;
  type?: string;
}

interface FlowGraph {
  nodes: Node[];
  edges: Edge[];
  metadata?: {
    total_lines: number;
    parsed_nodes: number;
    detected_framework?: string;
  };
}

interface FlowVisualizerProps {
  data: FlowGraph | null;
}

const FlowVisualizer: React.FC<FlowVisualizerProps> = ({ data }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [layoutName, setLayoutName] = useState('grid');
  const [legendVisible, setLegendVisible] = useState(false);

  console.log('FlowVisualizer received data:', data);
  console.log('Data nodes:', data?.nodes);
  console.log('Data edges:', data?.edges);

  const handleFit = useCallback(() => {
    if (cyRef.current) {
      cyRef.current.fit(undefined, 50);
      const currentZoom = cyRef.current.zoom();
      cyRef.current.zoom(currentZoom * 0.8);
      cyRef.current.center();
    }
  }, []);

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(prev => !prev);
    setTimeout(() => {
      if (cyRef.current) {
        cyRef.current.resize();
        handleFit();
      }
    }, 100);
  }, [handleFit]);

  const handleZoomIn = useCallback(() => {
    if (cyRef.current) {
      const newZoom = cyRef.current.zoom() * 1.2;
      cyRef.current.zoom({
        level: newZoom,
        renderedPosition: { x: containerRef.current!.clientWidth / 2, y: containerRef.current!.clientHeight / 2 }
      });
    }
  }, []);

  const handleZoomOut = useCallback(() => {
    if (cyRef.current) {
      const newZoom = cyRef.current.zoom() * 0.8;
      cyRef.current.zoom({
        level: newZoom,
        renderedPosition: { x: containerRef.current!.clientWidth / 2, y: containerRef.current!.clientHeight / 2 }
      });
    }
  }, []);

  const handleReset = useCallback(() => {
    if (cyRef.current) {
      cyRef.current.zoom(1);
      cyRef.current.center();
    }
  }, []);

  // 键盘快捷键
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === '+' || e.key === '=') handleZoomIn();
      else if (e.key === '-' || e.key === '_') handleZoomOut();
      else if (e.key === 'f' || e.key === 'F') handleFit();
      else if (e.key === 'r' || e.key === 'R') handleReset();
      else if (e.key === 'F11' || (e.key === 'Enter' && e.altKey)) {
        e.preventDefault();
        toggleFullscreen();
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleFit, handleReset, handleZoomIn, handleZoomOut, toggleFullscreen]);

  const runLayout = useCallback((cyInstance: cytoscape.Core, name: string) => {
    if (!cyInstance || cyInstance.destroyed()) {
      console.warn('Cannot run layout: Cytoscape instance is null or destroyed');
      return;
    }

    console.log('Running layout:', name);
    try {
      // 自定义蛇形布局函数
      const runZigzagLayout = () => {
        const nodes = cyInstance.nodes();
        const containerWidth = containerRef.current?.clientWidth || 800;
        
        // 计算节点的实际尺寸（考虑不同类型节点的大小和文本行数）
        const getNodeDimensions = (node: any) => {
          const nodeType = node.data('type') || 'default';
          const label = node.data('label') || '';
          
          // 基础尺寸 - 匹配CSS中设置的尺寸
          let baseWidth = 320;
          let baseHeight = 180;
          
          switch (nodeType) {
            case 'decision':
            case 'thinking':
              baseWidth = 340;
              baseHeight = 200;
              break;
            case 'error':
            case 'tool':
            case 'info':
            case 'data':
            case 'metric':
            case 'other':
              baseWidth = 330;
              baseHeight = 190;
              break;
          }
          
          // 计算文本行数来调整高度
          const lines = label.split('\n');
          const lineCount = lines.length;
          
          // 如果有多行文本，适当增加高度
          if (lineCount > 1) {
            const extraHeight = (lineCount - 1) * 20; // 每额外行增加20px高度
            baseHeight = Math.min(baseHeight + extraHeight, 300); // 限制最大高度
          }
          
          return { 
            width: baseWidth,
            height: baseHeight
          };
        };
        
        // 计算所有节点的尺寸
        const nodeDimensions = nodes.map(node => getNodeDimensions(node));
        const maxNodeWidth = Math.max(...nodeDimensions.map(d => d.width));
        const maxNodeHeight = Math.max(...nodeDimensions.map(d => d.height));
        
        // 基于最大节点尺寸计算间距 - 进一步减少间距
        const horizontalPadding = Math.max(20, maxNodeWidth * 0.08); // 进一步减少水平间距
        const verticalPadding = Math.max(30, maxNodeHeight * 0.2);   // 进一步减少垂直间距
        
        const totalNodeWidth = maxNodeWidth + horizontalPadding;
        const nodesPerRow = Math.max(2, Math.floor(containerWidth / totalNodeWidth));
        const actualHorizontalSpacing = Math.max(totalNodeWidth, containerWidth / (nodesPerRow + 1));
        const verticalSpacing = maxNodeHeight + verticalPadding;
        
        console.log('Smart layout calculation:', {
          containerWidth,
          nodesPerRow,
          actualHorizontalSpacing,
          verticalSpacing,
          maxNodeWidth,
          maxNodeHeight,
          totalNodes: nodes.length
        });
        
        nodes.forEach((node, index) => {
          const row = Math.floor(index / nodesPerRow);
          const col = index % nodesPerRow;
          
          // 奇数行反向排列，形成蛇形
          const actualCol = row % 2 === 0 ? col : (nodesPerRow - 1 - col);
          
          const x = actualCol * actualHorizontalSpacing + actualHorizontalSpacing / 2;
          const y = row * verticalSpacing + 150; // 给工具栏留出更多空间
          
          node.position({ x, y });
        });
        
        // 适应视图
        setTimeout(() => {
          if (cyInstance && !cyInstance.destroyed()) {
            cyInstance.fit(undefined, 60); // 增加边距
            const currentZoom = cyInstance.zoom();
            // 限制最大缩放，确保文字清晰可读
            const zoomLevel = Math.min(Math.max(currentZoom, 0.3), 0.9);
            cyInstance.zoom(zoomLevel);
            cyInstance.center();
            setZoomLevel(cyInstance.zoom());
          }
        }, 100);
      };

      const layoutOptions = {
        zigzag: runZigzagLayout,
        smart: runZigzagLayout, // 使用相同的智能算法
        dagre: {
          name: 'dagre', 
          rankDir: 'TB', 
          padding: 50, // 增加内边距
          spacingFactor: 1.5, // 增加间距因子
          nodeSep: 120, // 增加节点间距
          rankSep: 150, // 增加层级间距
          animate: true, 
          animationDuration: 800, 
          fit: true,
        } as any,
        'cose-bilkent': {
          name: 'cose-bilkent', 
          animate: 'end', 
          animationEasing: 'ease-out',
          animationDuration: 1000, 
          nodeDimensionsIncludeLabels: true, 
          fit: true,
          nodeRepulsion: 6000, // 增加节点排斥力
          idealEdgeLength: 150, // 增加理想边长
          edgeElasticity: 0.1,
        } as any,
        grid: { 
          name: 'grid', 
          fit: true, 
          animate: true, 
          padding: 20, // 进一步减少内边距
          spacingFactor: 1.0, // 最小间距因子
          avoidOverlap: true, // 避免重叠
          nodeDimensionsIncludeLabels: true, // 考虑标签尺寸
          rows: undefined, // 让系统自动计算行数
          cols: undefined // 让系统自动计算列数
        },
        circle: { name: 'circle', fit: true, animate: true, padding: 50 },
        breadthfirst: { 
          name: 'breadthfirst', 
          fit: true, 
          animate: true, 
          directed: true, 
          padding: 50, // 增加内边距
          spacingFactor: 2.0 // 增加间距因子
        },
      };

      if (name === 'zigzag' || name === 'smart') {
        runZigzagLayout();
      } else {
        const layout = cyInstance.layout(layoutOptions[name as keyof typeof layoutOptions]);
        layout.run();
        const animationDuration = (layoutOptions[name as keyof typeof layoutOptions] as any).animationDuration || 0;
        setTimeout(() => {
          if (cyInstance && !cyInstance.destroyed() && cyInstance.nodes().length > 0) {
            console.log('Layout completed, fitting view...');
            console.log('Nodes positions before fit:', cyInstance.nodes().map(n => ({ id: n.id(), position: n.position() })));
            cyInstance.fit(undefined, 30);
            const currentZoom = cyInstance.zoom();
            // 确保缩放级别在合理范围内
            const zoomLevel = Math.min(Math.max(currentZoom, 0.3), 2.0);
            cyInstance.zoom(zoomLevel);
            cyInstance.center();
            setZoomLevel(cyInstance.zoom());
            console.log('Final zoom level:', cyInstance.zoom());
            console.log('Final pan position:', cyInstance.pan());
          }
        }, animationDuration + 100);
      }
    } catch (e) {
      console.error('Error running layout:', e);
    }
  }, []);

  useEffect(() => {
    if (!data || !containerRef.current) return;

    console.log('Starting Cytoscape initialization...');
    console.log('Container ref:', containerRef.current);
    console.log('Container dimensions:', {
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight
    });

    // 确保先清理之前的实例
    if (cyRef.current) {
      try {
        cyRef.current.destroy();
      } catch (e) {
        console.warn('Error destroying previous Cytoscape instance:', e);
      }
      cyRef.current = null;
    }

    // 处理长文本，添加换行符以支持多行显示
    const processTextForNode = (text: string, nodeType: string): string => {
      if (!text) return '';
      
      // 根据节点类型设置每行字符数限制
      let charsPerLine: number;
      switch (nodeType) {
        case 'decision':
        case 'thinking':
          charsPerLine = 18; // 菱形节点每行字符较少
          break;
        case 'error':
        case 'tool':
          charsPerLine = 20; // 特殊形状节点
          break;
        case 'info':
        case 'data':
        case 'metric':
        case 'other':
          charsPerLine = 19; // 椭圆形节点
          break;
        default:
          charsPerLine = 22; // 矩形和圆角矩形节点
          break;
      }
      
      // 将长文本分割成多行
      const words = text.split('');
      const lines: string[] = [];
      let currentLine = '';
      
      for (let i = 0; i < words.length; i++) {
        const char = words[i];
        
        // 如果当前行加上这个字符会超过限制
        if (currentLine.length + 1 > charsPerLine) {
          // 尝试在合适的位置断行
          const breakPoints = [' ', '，', '。', ',', '.', '、', ':', '：', ';', '；', ')', '）', '}', ']'];
          let breakIndex = currentLine.length - 1;
          
          // 从后往前找合适的断行点（最多回退5个字符）
          for (let j = Math.max(0, currentLine.length - 5); j < currentLine.length; j++) {
            if (breakPoints.includes(currentLine[j])) {
              breakIndex = j;
              break;
            }
          }
          
          // 如果找到了合适的断行点，调整当前行
          if (breakIndex < currentLine.length - 1) {
            const remainingChars = currentLine.substring(breakIndex + 1);
            currentLine = currentLine.substring(0, breakIndex + 1);
            lines.push(currentLine.trim());
            currentLine = remainingChars + char;
          } else {
            // 没找到合适的断行点，直接断行
            lines.push(currentLine.trim());
            currentLine = char;
          }
        } else {
          currentLine += char;
        }
      }
      
      // 添加最后一行
      if (currentLine.trim()) {
        lines.push(currentLine.trim());
      }
      
      // 用换行符连接所有行
      return lines.join('\n');
    };

    const elements = [
      ...data.nodes.map(node => ({ 
        data: { 
          ...node, 
          nodeType: node.type,
          label: processTextForNode(node.label, node.type) // 预处理标签
        }, 
        classes: node.type 
      })),
      ...data.edges.map(edge => ({ 
        data: { 
          ...edge, 
          label: edge.label // 保留完整的边标签，让CSS处理换行
        }, 
        classes: edge.type || 'default' 
      }))
    ];

    console.log('Created elements for Cytoscape:', elements);
    console.log('Elements count:', elements.length);

    try {
      const cy = cytoscape({
        container: containerRef.current,
        elements,
        minZoom: 0.1,
        maxZoom: 5,
        wheelSensitivity: 0.2,
        boxSelectionEnabled: false,
        style: [
          {
            selector: 'node',
            style: {
              'background-color': '#666', 
              'label': 'data(label)', 
              'text-valign': 'center', 
              'text-halign': 'center',
              'font-size': '12px', // 稍微增大字体以提高可读性
              'font-weight': 'normal',
              'color': '#fff',
              'text-outline-width': 1,
              'text-outline-color': '#000',
              'width': 320, // 增加节点宽度以容纳多行文本
              'height': 180, // 增加节点高度以容纳多行文本
              'border-width': 2,
              'border-color': '#333',
              'text-events': 'yes',
              'text-wrap': 'wrap', // 启用文本换行
              'text-max-width': '300px', // 设置文本最大宽度
              'text-justification': 'center', // 文本居中对齐
              'transition-property': 'background-color, border-color', 
              'transition-duration': 0.3
            }
          },
          { selector: '.start', style: { 
            'background-color': '#4CAF50', 
            'shape': 'round-rectangle', 
            'border-color': '#388E3C'
          } },
          { selector: '.end', style: { 
            'background-color': '#F44336', 
            'shape': 'round-rectangle', 
            'border-color': '#D32F2F'
          } },
          { selector: '.action', style: { 
            'background-color': '#2196F3', 
            'shape': 'rectangle', 
            'border-color': '#1976D2'
          } },
          { 
            selector: '.decision, .thinking', 
            style: { 
              'background-color': '#FF9800', 
              'shape': 'diamond', 
              'border-color': '#F57C00', 
              'width': 340, // 增加菱形节点宽度
              'height': 200, // 增加菱形节点高度
              'font-size': '11px', // 稍微增大字体
              'text-wrap': 'wrap',
              'text-max-width': '280px'
            } 
          },
          { selector: '.result', style: { 
            'background-color': '#9C27B0', 
            'shape': 'rectangle', 
            'border-color': '#7B1FA2'
          } },
          { 
            selector: '.error', 
            style: { 
              'background-color': '#FF5722', 
              'shape': 'octagon', 
              'border-color': '#E64A19',
              'font-size': '11px',
              'width': 330,
              'height': 190,
              'text-wrap': 'wrap',
              'text-max-width': '290px'
            } 
          },
          { 
            selector: '.tool', 
            style: { 
              'background-color': '#607D8B', 
              'shape': 'hexagon', 
              'border-color': '#455A64',
              'font-size': '11px',
              'width': 330,
              'height': 190,
              'text-wrap': 'wrap',
              'text-max-width': '290px'
            } 
          },
          { 
            selector: '.info, .data, .metric, .other', 
            style: { 
              'background-color': '#9E9E9E', 
              'shape': 'ellipse', 
              'border-color': '#757575',
              'font-size': '11px',
              'width': 330,
              'height': 190,
              'text-wrap': 'wrap',
              'text-max-width': '290px'
            } 
          },
          {
            selector: 'edge',
            style: {
              'width': 2,
              'line-color': '#ccc',
              'target-arrow-color': '#ccc',
              'target-arrow-shape': 'triangle',
              'curve-style': 'bezier',
              'label': 'data(label)',
              'font-size': '10px',
              'text-background-color': '#fff',
              'text-background-opacity': 0.8,
              'text-border-width': 1,
              'text-border-color': '#ccc',
              'color': '#333',
              'text-wrap': 'wrap',
              'text-max-width': '120px'
            }
          },
          // 用于层级关系的边
          {
            selector: 'edge[edgeType="hierarchy"]',
            style: {
              'line-color': '#aaa',
              'line-style': 'dashed',
              'width': 1,
            }
          },
          { selector: 'edge.error', style: { 'line-color': '#F44336', 'target-arrow-color': '#F44336', 'line-style': 'dashed' } },
          { selector: ':selected', style: { 'background-color': '#FFD700', 'line-color': '#FFD700', 'target-arrow-color': '#FFD700', 'source-arrow-color': '#FFD700', 'border-color': '#FFC107' } }
        ],
        layout: { name: 'preset' }
      });

      runLayout(cy, layoutName);

      console.log('Cytoscape initialized successfully');
      console.log('Cytoscape instance:', cy);
      console.log('Number of nodes in cy:', cy.nodes().length);
      console.log('Number of edges in cy:', cy.edges().length);

      cy.on('tap', 'node', (event) => {
        const node = event.target.data();
        setSelectedNode(node);
        setDrawerVisible(true);
      });

      cy.on('zoom', () => setZoomLevel(cy.zoom()));
      
      cyRef.current = cy;

    } catch (e) {
      console.error('Error initializing Cytoscape:', e);
      return;
    }

    return () => {
      if (cyRef.current) {
        try {
          cyRef.current.destroy();
        } catch (e) {
          console.warn('Error destroying Cytoscape instance on cleanup:', e);
        }
        cyRef.current = null;
      }
    };
  }, [data, layoutName, runLayout]);
  
  const handleLayoutChange = (value: string) => {
    setLayoutName(value);
  };

  const getNodeTypeColor = (type: string) => {
    const colorMap: { [key: string]: string } = {
      start: 'green', 
      end: 'red', 
      action: 'blue', 
      decision: 'orange',
      thinking: 'orange', 
      result: 'purple', 
      error: 'red', 
      tool: 'cyan',
      info: 'default', 
      data: 'volcano', 
      metric: 'geekblue',
      default: 'default',
      unknown: 'default'
    };
    return colorMap[type] || 'default';
  };

  return (
    <div className={`flow-visualizer ${isFullscreen ? 'fullscreen-container' : ''}`}>
      <div className="controls-toolbar">
        <Space>
          <Select value={layoutName} onChange={handleLayoutChange} style={{width: 120}}>
            <Select.Option value="zigzag">Zigzag</Select.Option>
            <Select.Option value="dagre">Dagre</Select.Option>
            <Select.Option value="cose-bilkent">Cose</Select.Option>
            <Select.Option value="breadthfirst">Breadthfirst</Select.Option>
            <Select.Option value="circle">Circle</Select.Option>
            <Select.Option value="grid">Grid</Select.Option>
            <Select.Option value="smart">Smart</Select.Option>
          </Select>
          <Tooltip title="Zoom In (+)">
            <Button icon={<ZoomInOutlined />} onClick={handleZoomIn} />
          </Tooltip>
          <Tooltip title="Zoom Out (-)">
            <Button icon={<ZoomOutOutlined />} onClick={handleZoomOut} />
          </Tooltip>
          <Tooltip title="Fit to View (F)">
            <Button icon={<ColumnWidthOutlined />} onClick={handleFit} />
          </Tooltip>
          <Tooltip title="Reset View (R)">
            <Button icon={<ReloadOutlined />} onClick={handleReset} />
          </Tooltip>
          <Tooltip title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen (F11)'}>
            <Button icon={isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />} onClick={toggleFullscreen} />
          </Tooltip>
          <Popover
            content={
              <div style={{ width: 240 }}>
                <div style={{ marginBottom: 8, fontWeight: 'bold' }}>Legend</div>
                <div style={{ marginBottom: 4 }}><Tag color="green">Start / End (开始/结束)</Tag></div>
                <div style={{ marginBottom: 4 }}><Tag color="blue">Action (动作)</Tag></div>
                <div style={{ marginBottom: 4 }}><Tag color="orange">Decision / Thinking (决策/思考)</Tag></div>
                <div style={{ marginBottom: 4 }}><Tag color="purple">Result (结果)</Tag></div>
                <div style={{ marginBottom: 4 }}><Tag color="cyan">Tool Call (工具调用)</Tag></div>
                <div style={{ marginBottom: 4 }}><Tag color="red">Error (错误)</Tag></div>
                <div style={{ marginBottom: 4 }}><Tag color="default">Info (信息)</Tag></div>
                <div style={{ marginBottom: 4 }}><Tag color="volcano">Data (数据)</Tag></div>
                <div style={{ marginBottom: 4 }}><Tag color="geekblue">Metric (指标)</Tag></div>
                <div style={{ marginBottom: 0 }}><Tag color="default">Other (其他/未知)</Tag></div>
              </div>
            }
            title="Node Types"
            trigger="click"
            open={legendVisible}
            onOpenChange={setLegendVisible}
          >
            <Tooltip title="Show Legend">
              <Button icon={<QuestionCircleOutlined />} />
            </Tooltip>
          </Popover>
        </Space>
      </div>

      <div ref={containerRef} className="cytoscape-container" />
      
      <Drawer
        title={selectedNode?.label}
        placement="right"
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        width={500}
      >
        {selectedNode && (
          <div>
            <Descriptions column={1}>
              <Descriptions.Item label="ID">{selectedNode.id}</Descriptions.Item>
              <Descriptions.Item label="类型"><Tag color={getNodeTypeColor(selectedNode.type)}>{selectedNode.type}</Tag></Descriptions.Item>
              <Descriptions.Item label="标签">{selectedNode.label}</Descriptions.Item>
              {selectedNode.timestamp && <Descriptions.Item label="时间戳">{selectedNode.timestamp}</Descriptions.Item>}
              <Descriptions.Item label="Line" span={3}>
                {selectedNode.details?.line_number}
              </Descriptions.Item>
            </Descriptions>
            <Descriptions.Item label="Full Content" span={3}>
              <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                {selectedNode.details?.full_content}
              </pre>
            </Descriptions.Item>
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default FlowVisualizer; 