import React, { useState } from 'react';
import { Layout, Upload, Button, message, Tabs, Input, Space, Typography, Card, Spin } from 'antd';
import { UploadOutlined, PlayCircleOutlined, FileTextOutlined } from '@ant-design/icons';
import FlowVisualizer from './components/FlowVisualizer';
import axios from 'axios';
import 'antd/dist/reset.css';
import './App.css';

const { Header, Content } = Layout;
const { TextArea } = Input;
const { Title, Paragraph } = Typography;

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8765';

interface FlowGraph {
  nodes: any[];
  edges: any[];
  metadata?: any;
}

function App() {
  const [flowData, setFlowData] = useState<FlowGraph | null>(null);
  const [logText, setLogText] = useState('');
  const [loading, setLoading] = useState(false);

  // 处理文件上传
  const handleFileUpload = async (file: File) => {
    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post(`${API_BASE_URL}/parse-log`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setFlowData(response.data);
      message.success('日志解析成功！');
    } catch (error: any) {
      message.error('解析失败：' + (error.response?.data?.detail || error.message));
    } finally {
      setLoading(false);
    }
    
    return false; // 阻止默认上传行为
  };

  // 处理文本解析
  const handleTextParse = async () => {
    if (!logText.trim()) {
      message.warning('请输入日志内容');
      return;
    }
    console.log('Starting log parsing...');
    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/parse-text`, {
        text: logText
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      console.log('Received response from server:', response);
      setFlowData(response.data);
      message.success('日志解析成功！');
    } catch (error: any) {
      console.error('Error parsing log:', error);
      message.error('解析失败：' + (error.response?.data?.detail || error.message));
    } finally {
      setLoading(false);
    }
  };

  // 加载示例日志
  const loadExampleLog = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/example-log`);
      setLogText(response.data.example_log);
      message.success('示例日志已加载');
    } catch (error) {
      message.error('加载示例失败');
    }
  };

  // 测试用的长文本示例数据
  const loadTestData = () => {
    const testData = {
      nodes: [
        {
          id: "1",
          label: "Log Start - 开始执行代码分析任务，初始化系统环境和配置参数",
          type: "start"
        },
        {
          id: "2", 
          label: "深度分析代码库结构，发现项目包含150个Python文件，总计2万行代码，需要进行全面的架构分析以了解项目的模块依赖关系、设计模式使用情况以及潜在的性能瓶颈问题",
          type: "thinking"
        },
        {
          id: "3",
          label: "analyze_codebase - 执行代码库分析工具，扫描所有Python文件并提取函数定义、类结构、导入依赖关系、代码复杂度指标以及潜在的代码质量问题",
          type: "action"
        },
        {
          id: "4",
          label: "检测到复杂的循环依赖问题，需要深入分析模块间的相互引用关系，这可能严重影响代码的可维护性、扩展性和整体性能表现，建议进行重构优化",
          type: "decision"
        },
        {
          id: "5",
          label: "read_file - 读取核心配置文件config.py以了解项目的基础设置、环境变量配置、数据库连接参数以及其他重要的系统配置信息",
          type: "tool"
        },
        {
          id: "6",
          label: "配置文件包含复杂的数据库连接设置和重要计算参数，发现关键性能问题：在主要业务逻辑循环中重复进行相同的数据库查询和计算操作，占用了系统总执行时间的85%，严重影响用户体验",
          type: "result"
        },
        {
          id: "7",
          label: "run_profiler - 运行性能分析器来识别代码中的性能瓶颈、内存使用情况、CPU占用率以及其他关键的系统资源消耗热点",
          type: "action"
        },
        {
          id: "8",
          label: "性能分析完成，发现主要瓶颈集中在数据处理模块，特别是大数据集的处理逻辑存在严重的算法复杂度问题，建议优化数据结构设计、改进算法实现并考虑引入缓存机制以提升整体性能",
          type: "result"
        },
        {
          id: "9",
          label: "是否需要继续深入分析特定模块的性能问题？考虑到项目时间限制和分析深度的平衡，以及团队资源的合理分配，建议优先处理最关键的性能瓶颈问题",
          type: "decision"
        },
        {
          id: "10",
          label: "optimize_code - 应用代码优化建议，重构关键算法实现，改进数据结构设计，引入高效的缓存机制，并优化数据库查询逻辑以提升系统整体性能",
          type: "action"
        },
        {
          id: "11",
          label: "ERROR: 优化过程中遇到严重的兼容性问题，某些第三方库版本冲突导致单元测试失败，部分功能模块出现异常行为，需要回滚部分更改并重新评估优化策略",
          type: "error"
        },
        {
          id: "12",
          label: "代码分析和优化任务成功完成，生成详细的技术报告，包含性能改进建议、系统架构优化方案、代码质量提升指南以及后续维护和监控建议",
          type: "end"
        }
      ],
      edges: [
        { id: "e1", source: "1", target: "2", label: "开始深度分析流程" },
        { id: "e2", source: "2", target: "3", label: "执行自动化分析工具" },
        { id: "e3", source: "3", target: "4", label: "发现关键依赖问题" },
        { id: "e4", source: "4", target: "5", label: "需要读取配置信息" },
        { id: "e5", source: "5", target: "6", label: "配置分析完成，发现性能问题" },
        { id: "e6", source: "6", target: "7", label: "启动性能分析器" },
        { id: "e7", source: "7", target: "8", label: "获取详细分析结果" },
        { id: "e8", source: "8", target: "9", label: "评估下一步优化策略" },
        { id: "e9", source: "9", target: "10", label: "继续执行优化方案" },
        { id: "e10", source: "10", target: "11", label: "遇到兼容性错误" },
        { id: "e11", source: "11", target: "12", label: "完成任务并生成报告" }
      ],
      metadata: {
        total_lines: 12,
        parsed_nodes: 12,
        detected_framework: "test"
      }
    };
    
    setFlowData(testData);
    message.success('长文本测试数据加载成功！');
  };

  console.log('Current flowData state:', flowData);

  return (
    <Layout className="app-layout">
      <Header className="app-header">
        <Title level={2} style={{ color: 'white', margin: 0 }}>
          Agent执行流可视化工具
        </Title>
      </Header>
      
      <Content className="app-content">
        <div className="controls-section">
          <Card>
            <Tabs 
              defaultActiveKey="upload"
              items={[
                {
                  key: 'upload',
                  label: '上传日志文件',
                  icon: <UploadOutlined />,
                  children: (
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <Paragraph>
                        支持多种Agent框架的日志格式，包括LangChain、AutoGen、CrewAI等。
                        系统会自动识别日志格式并生成可视化流程图。
                      </Paragraph>
                      <Upload
                        beforeUpload={handleFileUpload}
                        accept=".txt,.log"
                        showUploadList={false}
                      >
                        <Button icon={<UploadOutlined />} type="primary" size="large">
                          选择日志文件
                        </Button>
                      </Upload>
                    </Space>
                  )
                },
                {
                  key: 'text',
                  label: '输入日志文本',
                  icon: <FileTextOutlined />,
                  children: (
                    <Space direction="vertical" style={{ width: '100%' }} size="middle">
                      <div>
                        <Button onClick={loadExampleLog} style={{ marginBottom: 10, marginRight: 10 }}>
                          加载示例日志
                        </Button>
                        <Button onClick={loadTestData} type="dashed" style={{ marginBottom: 10 }}>
                          加载测试数据 (长文本)
                        </Button>
                      </div>
                      <TextArea
                        rows={10}
                        value={logText}
                        onChange={(e) => setLogText(e.target.value)}
                        placeholder="粘贴Agent执行日志..."
                      />
                      <Button
                        type="primary"
                        icon={<PlayCircleOutlined />}
                        onClick={handleTextParse}
                        size="large"
                      >
                        解析日志
                      </Button>
                    </Space>
                  )
                }
              ]}
            />
          </Card>
        </div>

        <div className="visualization-section">
          <Spin spinning={loading} tip="正在解析日志..." size="large">
            {flowData ? (
              <FlowVisualizer data={flowData} />
            ) : (
              <div className="empty-state">
                <div>
                  <FileTextOutlined style={{ fontSize: '48px', color: '#ccc' }} />
                  <Typography.Title level={5} type="secondary" style={{marginTop: 16}}>
                    上传或粘贴日志
                  </Typography.Title>
                  <Typography.Text type="secondary">
                    在左侧选择日志文件或粘贴文本，即可在此处查看执行流程图。
                  </Typography.Text>
                </div>
              </div>
            )}
          </Spin>
        </div>
      </Content>
    </Layout>
  );
}

export default App;
