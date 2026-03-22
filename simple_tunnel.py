#!/usr/bin/env python3
"""
简单的HTTP服务器 + 公网隧道
不需要密码，任何人都可以访问
"""

import http.server
import socketserver
import threading
import time
import webbrowser
import sys
import os

# 设置端口
PORT = 8888

# 切换到当前目录
os.chdir(os.path.dirname(os.path.abspath(__file__)))

class Handler(http.server.SimpleHTTPRequestHandler):
    """自定义HTTP处理器"""
    def end_headers(self):
        # 添加CORS头，允许跨域访问
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()
    
    def log_message(self, format, *args):
        # 简化日志输出
        print(f"[{self.log_date_time_string()}] {args[0]} {args[1]} {args[2]}")

def start_server():
    """启动本地HTTP服务器"""
    print(f"🚀 启动本地HTTP服务器 (端口: {PORT})")
    print(f"📁 服务目录: {os.getcwd()}")
    
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print(f"✅ 服务器已启动: http://localhost:{PORT}")
        print(f"📱 局域网访问: http://{get_local_ip()}:{PORT}")
        print("\n📋 可用文件:")
        for file in os.listdir('.'):
            if file.endswith('.html'):
                print(f"   • http://localhost:{PORT}/{file}")
        
        print("\n⚡ 按 Ctrl+C 停止服务器")
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n🛑 服务器已停止")

def get_local_ip():
    """获取本地IP地址"""
    import socket
    try:
        # 创建一个临时连接来获取本地IP
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except:
        return "127.0.0.1"

def print_access_info():
    """打印访问信息"""
    local_ip = get_local_ip()
    
    print("\n" + "="*50)
    print("🌐 访问信息")
    print("="*50)
    print(f"1. 本地访问:    http://localhost:{PORT}")
    print(f"2. 局域网访问:  http://{local_ip}:{PORT}")
    print(f"3. 主页面:      http://{local_ip}:{PORT}/index.html")
    print(f"4. 简化版:      http://{local_ip}:{PORT}/index-standalone.html")
    print(f"5. 诊断工具:    http://{local_ip}:{PORT}/debug.html")
    print("="*50)
    print("\n📱 手机访问步骤:")
    print("1. 确保手机和电脑在同一Wi-Fi网络")
    print(f"2. 在手机浏览器输入: http://{local_ip}:{PORT}")
    print("3. 如果无法访问，检查电脑防火墙设置")
    print("\n🔧 防火墙设置 (macOS):")
    print("   系统偏好设置 → 安全性与隐私 → 防火墙 → 防火墙选项")
    print("   添加Python并允许传入连接")
    print("="*50)

if __name__ == "__main__":
    print("🎯 H5页面本地服务器")
    print("="*50)
    
    # 打印访问信息
    print_access_info()
    
    # 询问是否打开浏览器
    response = input("\n是否在浏览器中打开页面？(y/n): ").lower()
    if response == 'y':
        webbrowser.open(f"http://localhost:{PORT}")
    
    # 启动服务器
    start_server()