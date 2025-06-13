"""
测试API端点
"""

import requests
import json

BASE_URL = "http://localhost:8000"

def test_root():
    """测试根端点"""
    response = requests.get(f"{BASE_URL}/")
    print("测试根端点:")
    print(f"状态码: {response.status_code}")
    print(f"响应: {json.dumps(response.json(), indent=2, ensure_ascii=False)}")
    print()

def test_example_log():
    """测试示例日志端点"""
    response = requests.get(f"{BASE_URL}/example-log")
    print("测试示例日志端点:")
    print(f"状态码: {response.status_code}")
    data = response.json()
    print(f"示例日志前100个字符: {data['example_log'][:100]}...")
    print()

def test_parse_text():
    """测试文本解析端点"""
    test_log = """[START] 开始测试任务
[ACTION] search_files: 搜索测试文件
[RESULT] 找到2个文件
[DECISION] 选择第一个文件
[ERROR] 文件读取失败
[END] 任务结束"""
    
    response = requests.post(f"{BASE_URL}/parse-text", params={"text": test_log})
    print("测试文本解析端点:")
    print(f"状态码: {response.status_code}")
    data = response.json()
    print(f"解析的节点数: {len(data['nodes'])}")
    print(f"解析的边数: {len(data['edges'])}")
    print(f"元数据: {json.dumps(data['metadata'], indent=2, ensure_ascii=False)}")
    print()

if __name__ == "__main__":
    print("开始测试Agent执行流可视化API...\n")
    
    try:
        test_root()
        test_example_log()
        test_parse_text()
        print("✅ 所有测试通过!")
    except requests.exceptions.ConnectionError:
        print("❌ 无法连接到API服务器，请确保后端服务正在运行")
    except Exception as e:
        print(f"❌ 测试失败: {e}") 