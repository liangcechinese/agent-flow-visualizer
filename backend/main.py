from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import json
import re
from datetime import datetime
from log_patterns import LogPatternMatcher, NODE_TYPE_MAPPING, get_node_style

app = FastAPI(title="Agent Flow Visualizer API", version="1.0.0")

# 配置CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3456"],  # React开发服务器
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 数据模型
class Node(BaseModel):
    id: str
    label: str
    type: str  # 'start', 'action', 'decision', 'result', 'error', 'end'
    timestamp: Optional[str] = None
    details: Optional[Dict[str, Any]] = None
    level: Optional[int] = 0

class Edge(BaseModel):
    id: str
    source: str
    target: str
    label: Optional[str] = None
    type: Optional[str] = "default"  # 'default', 'success', 'error'

class FlowGraph(BaseModel):
    nodes: List[Node]
    edges: List[Edge]
    metadata: Optional[Dict[str, Any]] = None

class TextInput(BaseModel):
    text: str

class LogParser:
    """解析Agent执行日志并构建流程图"""
    
    def __init__(self, framework: str = None):
        self.nodes = []
        self.edges = []
        self.node_counter = 0
        self.node_map = {}
        self.framework = framework
        self.pattern_matcher = None
        self.parent_stack = []  # 用于跟踪层级关系的栈
        
    def generate_node_id(self):
        self.node_counter += 1
        return f"node_{self.node_counter}"
    
    def parse_log_line(self, line: str, line_num: int) -> Optional[Dict[str, Any]]:
        """解析单行日志，提取关键信息"""
        # 常见的Agent日志模式
        patterns = [
            # 开始/结束模式
            (r'\[START\]\s*(.*)', 'start'),
            (r'\[END\]\s*(.*)', 'end'),
            # 动作模式
            (r'\[ACTION\]\s*(\w+):\s*(.*)', 'action'),
            (r'Executing:\s*(.*)', 'action'),
            # 决策模式
            (r'\[DECISION\]\s*(.*)', 'decision'),
            (r'Deciding:\s*(.*)', 'decision'),
            # 结果模式
            (r'\[RESULT\]\s*(.*)', 'result'),
            (r'Result:\s*(.*)', 'result'),
            # 错误模式
            (r'\[ERROR\]\s*(.*)', 'error'),
            (r'Error:\s*(.*)', 'error'),
            # 思考/推理模式
            (r'\[THINKING\]\s*(.*)', 'thinking'),
            (r'Reasoning:\s*(.*)', 'thinking'),
            # 工具调用模式
            (r'\[TOOL\]\s*(\w+):\s*(.*)', 'tool'),
            (r'Calling tool:\s*(.*)', 'tool'),
        ]
        
        for pattern, node_type in patterns:
            match = re.match(pattern, line.strip())
            if match:
                return {
                    'type': node_type,
                    'content': match.groups(),
                    'line_num': line_num,
                    'raw': line.strip()
                }
        
        # 时间戳模式
        timestamp_match = re.match(r'(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})\s+(.*)', line.strip())
        if timestamp_match:
            return {
                'type': 'timestamped',
                'timestamp': timestamp_match.group(1),
                'content': timestamp_match.group(2),
                'line_num': line_num,
                'raw': line.strip()
            }
        
        return None
    
    def build_graph(self, log_content: str) -> FlowGraph:
        """从日志内容构建流程图"""
        # 自动检测框架（如果未指定）
        if not self.framework:
            matcher = LogPatternMatcher()
            self.framework = matcher.detect_framework(log_content)
        
        # 创建模式匹配器
        self.pattern_matcher = LogPatternMatcher(self.framework)
        
        lines = log_content.split('\n')
        self.parent_stack = []
        last_node_at_level = {}  # 跟踪每个层级的最后一个节点

        # 根节点
        root_node_id = self.generate_node_id()
        root_node = Node(id=root_node_id, label="Log Start", type="start", level=0)
        self.nodes.append(root_node)
        self.node_map[root_node_id] = root_node
        self.parent_stack.append(root_node_id)
        last_node_at_level[0] = root_node_id
        
        for i, line in enumerate(lines):
            if not line.strip():
                continue
            
            # 首先尝试使用框架特定的模式
            matched = self.pattern_matcher.match_line(line)
            
            # 如果没有匹配，使用原始解析方法
            if not matched:
                parsed = self.parse_log_line(line, i + 1)
                if not parsed:
                    continue
            else:
                parsed_type = NODE_TYPE_MAPPING.get(matched['type'], matched['type'])
                # 转换匹配结果为统一格式
                parsed = {
                    'type': parsed_type,
                    'content': matched['match'] if isinstance(matched['match'], str) else str(matched['match']),
                    'line_num': i + 1,
                    'raw': line.strip(),
                    'is_start': parsed_type in ['start', 'chain_start', 'task_start'],
                    'is_end': parsed_type in ['end', 'chain_end', 'terminate'],
                }
            
            # 创建节点
            node_id = self.generate_node_id()
            current_level = len(self.parent_stack)

            # 提取节点标签
            if parsed['type'] in ['action', 'tool', 'tool_call']:
                if isinstance(parsed['content'], tuple) and parsed['content']:
                    label = parsed['content'][0] if len(parsed['content']) == 1 else ' '.join(parsed['content'])
                else:
                    label = str(parsed['content'])
            else:
                if isinstance(parsed['content'], tuple) and parsed['content']:
                    label = parsed['content'][0] if len(parsed['content']) == 1 else ' '.join(parsed['content'])
                elif isinstance(parsed['content'], str):
                    label = parsed['content']
                else:
                    label = str(parsed['content'])
            
            # 获取节点样式
            node_style = get_node_style(parsed['type'])
            
            node = Node(
                id=node_id,
                label=label,  # 保留完整标签，让前端处理换行
                type=parsed['type'],
                timestamp=parsed.get('timestamp'),
                details={
                    'full_content': parsed['raw'],
                    'line_number': parsed['line_num'],
                    'style': node_style
                },
                level=current_level
            )
            
            self.nodes.append(node)
            self.node_map[node_id] = node
            
            # 创建边
            # 默认为父节点
            source_node_id = self.parent_stack[-1] if self.parent_stack else None
            edge_type = 'hierarchy' # 默认是层级边
            # 如果当前层级已有节点，则连接到同级的上一个节点
            if current_level in last_node_at_level:
                source_node_id = last_node_at_level[current_level]
                edge_type = 'default' # 同级边

            if source_node_id:
                edge = Edge(
                    id=f"edge_{len(self.edges) + 1}",
                    source=source_node_id,
                    target=node_id,
                    type=edge_type if parsed['type'] != 'error' else 'error'
                )
                self.edges.append(edge)

            # 更新当前层级的最后一个节点
            last_node_at_level[current_level] = node_id

            # 管理层级结构
            if parsed.get('is_start'):
                self.parent_stack.append(node_id)
            elif parsed.get('is_end'):
                if len(self.parent_stack) > 1:
                    # 弹出父节点，并用结束节点更新该层的最后一个节点
                    last_parent = self.parent_stack.pop()
                    last_node_at_level[len(self.parent_stack)] = node_id
        
        return FlowGraph(
            nodes=self.nodes,
            edges=self.edges,
            metadata={
                'total_lines': len(lines),
                'parsed_nodes': len(self.nodes),
                'detected_framework': self.framework
            }
        )

@app.get("/")
async def root():
    return {"message": "Agent Flow Visualizer API", "version": "1.0.0"}

@app.post("/parse-log", response_model=FlowGraph)
async def parse_log(file: UploadFile = File(...)):
    """上传并解析Agent日志文件"""
    try:
        # 读取文件内容
        content = await file.read()
        log_content = content.decode('utf-8')
        
        # 解析日志
        parser = LogParser()
        flow_graph = parser.build_graph(log_content)
        
        return flow_graph
    
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"解析日志失败: {str(e)}")

@app.post("/parse-text", response_model=FlowGraph)
async def parse_text(input_data: TextInput):
    """解析文本格式的Agent日志"""
    try:
        parser = LogParser()
        flow_graph = parser.build_graph(input_data.text)
        return flow_graph
    
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"解析日志失败: {str(e)}")

# 示例日志端点，用于测试
@app.get("/example-log")
async def get_example_log():
    """获取示例日志内容"""
    example_log = """[START] Agent任务开始执行
[THINKING] 分析用户需求：需要查找Python文件中的错误
[ACTION] search_files: 搜索包含'error'的Python文件
[RESULT] 找到3个相关文件
[DECISION] 选择最相关的文件进行分析
[ACTION] read_file: 读取error_handler.py
[RESULT] 成功读取文件内容
[THINKING] 发现潜在的空指针异常
[ACTION] fix_error: 修复空指针异常
[ERROR] 修复失败：权限不足
[ACTION] request_permission: 请求写入权限
[RESULT] 权限获取成功
[ACTION] fix_error: 重新尝试修复
[RESULT] 修复成功
[END] 任务完成"""
    
    return {"example_log": example_log}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8765)
