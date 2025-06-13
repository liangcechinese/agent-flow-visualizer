"""
Agent日志模式配置
支持多种Agent框架的日志格式
"""

from typing import List, Tuple, Dict, Any
import re

# LangChain日志模式
LANGCHAIN_PATTERNS = [
    (r'> Entering new (\w+) chain...', 'chain_start'),
    (r'> Finished chain.', 'chain_end'),
    (r'Thought:\s*(.*)', 'thinking'),
    (r'Action:\s*(\w+)\[(.*?)\]', 'tool_call'),
    (r'Observation:\s*(.*)', 'observation'),
    (r'Final Answer:\s*(.*)', 'final_answer'),
]

# AutoGen日志模式
AUTOGEN_PATTERNS = [
    (r'(\w+) \(to (\w+)\):', 'agent_message'),
    (r'EXECUTING CODE BLOCK:', 'code_execution'),
    (r'exitcode:\s*(\d+)', 'execution_result'),
    (r'TERMINATE', 'terminate'),
]

# CrewAI日志模式
CREWAI_PATTERNS = [
    (r'Working Agent:\s*(.*)', 'agent_working'),
    (r'Starting Task:\s*(.*)', 'task_start'),
    (r'Task Output:\s*(.*)', 'task_output'),
    (r'Using tool:\s*(.*)', 'tool_usage'),
]

# 通用日志模式
GENERIC_PATTERNS = [
    # 日志级别
    (r'\[(DEBUG|INFO|WARNING|ERROR|CRITICAL)\]\s*(.*)', 'log_level'),
    # API调用
    (r'(GET|POST|PUT|DELETE)\s+(\S+)\s+(\d+)', 'api_call'),
    # JSON输出
    (r'\{.*\}', 'json_output'),
    # 异常堆栈
    (r'Traceback \(most recent call last\):', 'exception_start'),
    # 性能指标
    (r'Execution time:\s*(\d+\.?\d*)\s*(ms|s)', 'performance'),
    # 内存使用
    (r'Memory usage:\s*(\d+\.?\d*)\s*(MB|GB)', 'memory'),
]

class LogPatternMatcher:
    """日志模式匹配器"""
    
    def __init__(self, framework: str = "generic"):
        self.framework = framework
        self.patterns = self._load_patterns(framework)
        
    def _load_patterns(self, framework: str) -> List[Tuple[str, str]]:
        """根据框架加载相应的模式"""
        patterns_map = {
            "langchain": LANGCHAIN_PATTERNS + GENERIC_PATTERNS,
            "autogen": AUTOGEN_PATTERNS + GENERIC_PATTERNS,
            "crewai": CREWAI_PATTERNS + GENERIC_PATTERNS,
            "generic": GENERIC_PATTERNS,
        }
        return patterns_map.get(framework, GENERIC_PATTERNS)
    
    def match_line(self, line: str) -> Dict[str, Any]:
        """匹配单行日志"""
        for pattern, pattern_type in self.patterns:
            match = re.search(pattern, line)
            if match:
                return {
                    'type': pattern_type,
                    'match': match.groups() if match.groups() else match.group(0),
                    'pattern': pattern,
                    'raw': line
                }
        return None
    
    def detect_framework(self, log_content: str) -> str:
        """自动检测日志框架"""
        framework_indicators = {
            "langchain": ["Entering new", "chain", "Thought:", "Action:", "Observation:"],
            "autogen": ["(to", "):", "EXECUTING CODE BLOCK", "exitcode:"],
            "crewai": ["Working Agent:", "Starting Task:", "Using tool:"],
        }
        
        for framework, indicators in framework_indicators.items():
            matches = sum(1 for indicator in indicators if indicator in log_content)
            if matches >= 2:  # 至少匹配2个指标
                return framework
        
        return "generic"

# 节点类型映射
NODE_TYPE_MAPPING = {
    'chain_start': 'start',
    'chain_end': 'end',
    'thinking': 'decision',
    'tool_call': 'action',
    'observation': 'result',
    'final_answer': 'result',
    'agent_message': 'action',
    'code_execution': 'action',
    'execution_result': 'result',
    'terminate': 'end',
    'agent_working': 'action',
    'task_start': 'start',
    'task_output': 'result',
    'tool_usage': 'tool',
    'log_level': 'info',
    'api_call': 'action',
    'json_output': 'data',
    'exception_start': 'error',
    'performance': 'metric',
    'memory': 'metric',
}

def get_node_style(node_type: str) -> Dict[str, str]:
    """获取节点样式配置"""
    styles = {
        'start': {'color': '#4CAF50', 'shape': 'ellipse'},
        'end': {'color': '#F44336', 'shape': 'ellipse'},
        'action': {'color': '#2196F3', 'shape': 'box'},
        'decision': {'color': '#FF9800', 'shape': 'diamond'},
        'result': {'color': '#9C27B0', 'shape': 'box'},
        'error': {'color': '#F44336', 'shape': 'octagon'},
        'tool': {'color': '#00BCD4', 'shape': 'hexagon'},
        'info': {'color': '#607D8B', 'shape': 'box'},
        'data': {'color': '#795548', 'shape': 'box'},
        'metric': {'color': '#009688', 'shape': 'ellipse'},
    }
    return styles.get(node_type, {'color': '#757575', 'shape': 'box'}) 