import http.server
import socketserver
import webbrowser
import os
import sys

# Порт, на котором будет работать сервер
PORT = 8000

# Переходим в директорию, где лежит этот скрипт, чтобы сервер отдавал правильные файлы
# даже если запущен из другого места
os.chdir(os.path.dirname(os.path.abspath(__file__)))

class ReusableTCPServer(socketserver.TCPServer):
    allow_reuse_address = True

Handler = http.server.SimpleHTTPRequestHandler

try:
    with ReusableTCPServer(("", PORT), Handler) as httpd:
        url = f"http://localhost:{PORT}"
        print(f"Сервер запущен! Откройте в браузере: {url}")
        print("Нажмите Ctrl+C в этом окне, чтобы остановить сервер.")
        
        # Автоматически открываем браузер
        webbrowser.open(url)
        
        httpd.serve_forever()
except KeyboardInterrupt:
    print("\nСервер остановлен.")
    sys.exit(0)
except OSError as e:
    if e.errno == 98 or e.errno == 10048: # Address already in use
        print(f"\nОшибка: Порт {PORT} уже занят. Возможно, сервер уже запущен?")
    else:
        print(f"\nОшибка запуска сервера: {e}")
    input("\nНажмите Enter, чтобы выйти...")