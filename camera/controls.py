from onvif import ONVIFCamera

# Параметры подключения к камере
camera_ip = '192.168.1.68'  # IP адрес камеры
port = 80  # порт ONVIF (обычно 80)
username = 'admin'  # имя пользователя
password = 'password'  # пароль

# Подключение к камере через ONVIF
mycam = ONVIFCamera(camera_ip, port, username, password)

# Получение PTZ сервиса
ptz_service = mycam.create_ptz_service()
