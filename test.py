import cv2
import math
from onvif import ONVIFCamera
from ptz_control import ptzControl  # Используем твою библиотеку управления PTZ

camera_control = ptzControl()

# Подключение к PTZ камере и получение статуса
def get_ptz_status():
    mycam = ONVIFCamera('192.168.1.68', 80, 'admin', 'aa123456')

    # Получение PTZ сервиса
    ptz = mycam.create_ptz_service()

    # Получение профиля
    media_service = mycam.create_media_service()
    profiles = media_service.GetProfiles()

    # Получение PTZ статуса
    status = ptz.GetStatus({'ProfileToken': profiles[0].token})

    return status, profiles[0], ptz

# Получение разрешения потока
def get_stream_resolution(profile):
    video_source = profile.VideoSourceConfiguration
    resolution = video_source.Bounds
    return resolution.width, resolution.height

# Получение размеров сенсора в зависимости от разрешения
def get_sensor_size(width, height):
    if width == 1920 and height == 1080:  # Full HD
        return 5.27, 2.96
    elif width == 1280 and height == 960:  # Square
        return 4.84, 3.63
    else:
        return 4.64, 3.33  # По умолчанию

# Вычисление панорамирования и наклона
def calculate_pan_tilt(x_point, y_point, width, height, focal_length, sensor_width, sensor_height):
    x_norm = (x_point - width / 2) / (width / 2)
    y_norm = (y_point - height / 2) / (height / 2)

    fov_h = 2 * math.atan(sensor_width / (2 * focal_length))
    fov_v = 2 * math.atan(sensor_height / (2 * focal_length))

    pan = x_norm * (fov_h / math.pi)
    tilt = y_norm * (fov_v / math.pi)

    pan = max(min(pan, 1), -1)
    tilt = max(min(tilt, 1), -1)

    return pan, tilt

# Функция для обработки клика мыши
def image_on_mouse_click(event, x, y, flags, param):
    if event == cv2.EVENT_LBUTTONDOWN:
        print(f"Клик по точке: X={x}, Y={y}")
        frame = param['frame']
        height, width, _ = frame.shape
        
        status, profile, ptz = get_ptz_status()
        stream_width, stream_height = get_stream_resolution(profile)
        sensor_width, sensor_height = get_sensor_size(stream_width, stream_height)

        zoom_position = status.Position.Zoom.x
        min_focal_length = 6
        max_focal_length = 260
        focal_length = min_focal_length + zoom_position * (max_focal_length - min_focal_length)

        pan, tilt = calculate_pan_tilt(x, y, width, height, focal_length, sensor_width, sensor_height)
        print(f"Панорамирование: {pan}, Наклон: {tilt}, Фокусное расстояние: {focal_length}")
        
        # Используем твою библиотеку для перемещения камеры
        camera_control = ptzControl()
        camera_control.move_to_direction(pan, tilt)

# Функция для обработки клика мыши на видеопотоке
def video_on_mouse_click(event, x, y, flags, param):
    if event == cv2.EVENT_LBUTTONDOWN:
        print(f"Клик по точке: X={x}, Y={y}")
        
        # Получаем размеры изображения (кадра)
        frame = param['frame']
        height, width, _ = frame.shape
        
        # Получаем текущее положение камеры и параметры сенсора
        status, profile, ptz = get_ptz_status()

        # Получаем разрешение видеопотока
        stream_width, stream_height = get_stream_resolution(profile)

        # Определяем размеры сенсора в зависимости от разрешения
        sensor_width, sensor_height = get_sensor_size(stream_width, stream_height)

        # Динамически получаем текущее фокусное расстояние
        zoom_position = status.Position.Zoom.x  # Значение от 0 (минимум) до 1 (максимум)
        min_focal_length = 6  # Минимальное фокусное расстояние из спецификации
        max_focal_length = 260  # Максимальное фокусное расстояние из спецификации
        focal_length = min_focal_length + zoom_position * (max_focal_length - min_focal_length)

        # Рассчитываем поворот камеры
        pan, tilt = calculate_pan_tilt(x, y, width, height, focal_length, sensor_width, sensor_height)
        
        print(f"Панорамирование: {pan}, Наклон: {tilt}, Фокусное расстояние: {focal_length}")
        
        # Отправляем команду PTZ на перемещение камеры
        print(camera_control.get_current_orientation())
        # camera_control.move_relative(pan, tilt, 1)

# Функция для получения изображения с камеры
def process_image():
    # Загружаем изображение (можно заменить на поток с камеры)
    image_path = 'test.jpg'
    frame = cv2.imread(image_path)
    
    if frame is None:
        return

    cv2.namedWindow("Image")
    cv2.setMouseCallback("Image", image_on_mouse_click, param={'frame': frame})

    while True:
        cv2.imshow('Image', frame)
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    cv2.destroyAllWindows()

# Функция для работы с видеопотоком камеры
def process_video_stream():
    # Подключаемся к видеопотоку камеры
    cap = cv2.VideoCapture('rtsp://192.168.1.68:554')  # URL RTSP потока

    if not cap.isOpened():
        print("Ошибка подключения к видеопотоку.")
        return

    # Установка обработчика кликов с передачей кадра
    cv2.namedWindow("Camera Stream")

    while True:
        ret, frame = cap.read()

        if not ret:
            print("Ошибка получения кадра с камеры.")
            break

        # Передаем текущий кадр в функцию обработки кликов
        cv2.setMouseCallback("Camera Stream", video_on_mouse_click, param={'frame': frame})

        # Отображаем видеопоток
        cv2.imshow('Camera Stream', frame)

        # Нажмите 'q' для выхода
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()

# Основная программа
def main():
    # process_image()
    process_video_stream()

if __name__ == "__main__":
    main()
