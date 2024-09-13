import cv2
import math
from onvif import ONVIFCamera

# Подключение к PTZ камере
def get_ptz_status():
    mycam = ONVIFCamera('CAMERA_IP', 80, 'LOGIN', 'PASSWORD')

    # Получение PTZ сервиса
    ptz = mycam.create_ptz_service()

    # Получение профиля
    media_service = mycam.create_media_service()
    profiles = media_service.GetProfiles()

    # Получение PTZ статуса
    status = ptz.GetStatus({'ProfileToken': profiles[0].token})

    return status, profiles[0], ptz

# Вычисление панорамирования и наклона
def calculate_pan_tilt(x_point, y_point, width, height, focal_length, sensor_width, sensor_height):
    # Вычисляем нормализованные координаты
    x_norm = (x_point - width / 2) / (width / 2)
    y_norm = (y_point - height / 2) / (height / 2)

    # Вычисляем углы обзора по горизонтали и вертикали
    fov_h = 2 * math.atan(sensor_width / (2 * focal_length))
    fov_v = 2 * math.atan(sensor_height / (2 * focal_length))

    # Панорамирование и наклон в диапазоне [-1, 1]
    pan = x_norm * (fov_h / math.pi)  # Преобразуем радианы в диапазон от -1 до 1
    tilt = y_norm * (fov_v / math.pi) # Преобразуем радианы в диапазон от -1 до 1

    return pan, tilt

# Функция для обработки клика мыши
def on_mouse_click(event, x, y, flags, param):
    if event == cv2.EVENT_LBUTTONDOWN:
        print(f"Клик по точке: X={x}, Y={y}")
        
        # Получаем размеры изображения
        frame = param['frame']
        height, width, _ = frame.shape
        
        # Получаем текущее положение камеры и параметры сенсора
        status, profile, ptz = get_ptz_status()
        focal_length = status.Position.Zoom.x  # Текущее фокусное расстояние (zoom)
        sensor_width = 6.3  # Ширина сенсора камеры в мм
        sensor_height = 4.2  # Высота сенсора камеры в мм

        # Рассчитываем поворот камеры
        pan, tilt = calculate_pan_tilt(x, y, width, height, focal_length, sensor_width, sensor_height)
        
        print(f"Панорамирование: {pan}, Наклон: {tilt}")
        
        # Отправляем команду PTZ на перемещение камеры
        ptz.AbsoluteMove({
            'ProfileToken': profile.token,
            'Position': {
                'PanTilt': {
                    'x': pan,
                    'y': tilt
                }
            }
        })

# Подключение к RTSP потоку
rtsp_url = 'rtsp://LOGIN:PASSWORD@CAMERA_IP:554/stream'
cap = cv2.VideoCapture(rtsp_url)

# Установка обработчика кликов
cv2.namedWindow("RTSP Stream")
cv2.setMouseCallback("RTSP Stream", on_mouse_click, param={'frame': None})

while True:
    ret, frame = cap.read()
    if not ret:
        print("Ошибка при получении кадра с RTSP потока")
        break
    
    # Показываем кадр
    cv2.imshow('RTSP Stream', frame)

    # Обновляем кадр для параметра обработчика
    cv2.setMouseCallback("RTSP Stream", on_mouse_click, param={'frame': frame})

    # Нажмите 'q' для выхода
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
