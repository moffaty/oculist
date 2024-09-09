import cv2
import numpy as np
from onvif import ONVIFCamera
from time import sleep

# Параметры подключения к камере через ONVIF
camera_ip = '192.168.1.68'
port = 80
username = 'admin'
password = 'password'

# Подключаемся к камере через ONVIF
mycam = ONVIFCamera(camera_ip, port, username, password)
ptz_service = mycam.create_ptz_service()

# Получаем профиль камеры для управления PTZ
media_service = mycam.create_media_service()
profiles = media_service.GetProfiles()
profile = profiles[0]

# Функция для управления PTZ
def move_ptz(ptz_service, profile, pan, tilt, zoom):
    request = ptz_service.create_type('ContinuousMove')
    request.ProfileToken = profile.token
    request.Velocity = {
        'PanTilt': {'x': pan, 'y': tilt},
        'Zoom': {'x': zoom}
    }
    
    ptz_service.ContinuousMove(request)
    sleep(1)  # Движение в течение 0.5 секунд
    ptz_service.Stop({'ProfileToken': profile.token})

# Функция для центрирования камеры на объекте
def move_camera_to_center(ptz_service, profile, offset_x, offset_y):
    pan_speed = 0
    tilt_speed = 0
    
    # Определяем направление движения камеры в зависимости от смещения
    if offset_x > 50:
        pan_speed = 0.1  # Поворот вправо
    elif offset_x < -50:
        pan_speed = -0.1  # Поворот влево

    if offset_y > 50:
        tilt_speed = -0.1  # Наклон вниз
    elif offset_y < -50:
        tilt_speed = 0.1  # Наклон вверх

    # Если требуется движение, отправляем команду
    if pan_speed != 0 or tilt_speed != 0:
        move_ptz(ptz_service, profile, pan_speed, tilt_speed, 0)

# Основная функция
def run_main(video="rtsp://admin:password@192.168.1.68:554/"):
    cap = cv2.VideoCapture(video)

    # Инициализация параметров
    p0 = None
    old_gray = None

    # Оптический поток - параметры LK
    lk_params = dict(winSize=(15, 15), maxLevel=2, 
                     criteria=(cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, 10, 0.03))

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        # Преобразуем текущий кадр в оттенки серого
        frame_gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

        if p0 is not None and len(p0) > 0:
            # Оптический поток LK
            p1, st, err = cv2.calcOpticalFlowPyrLK(old_gray, frame_gray, p0, None, **lk_params)

            good_new = p1[st == 1]
            good_old = p0[st == 1]

            if len(good_new) > 0:
                center_x, center_y = 0, 0
                count = 0
                for i, (new, old) in enumerate(zip(good_new, good_old)):
                    a, b = new.ravel()
                    c, d = old.ravel()
                    frame = cv2.circle(frame, (int(a), int(b)), 5, (0, 255, 0), -1)
                    frame = cv2.line(frame, (int(a), int(b)), (int(c), int(d)), (0, 255, 0), 2)
                    center_x += a
                    center_y += b
                    count += 1

                if count > 0:
                    center_x = int(center_x / count)
                    center_y = int(center_y / count)

                    # Рисуем центр объекта
                    frame = cv2.circle(frame, (center_x, center_y), 10, (0, 0, 255), -1)
                    frame = cv2.putText(frame, 'Center', (center_x - 25, center_y - 10),
                                        cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)

                    # Центр кадра
                    frame_center_x = frame.shape[1] // 2
                    frame_center_y = frame.shape[0] // 2

                    # Смещение объекта от центра кадра
                    offset_x = center_x - frame_center_x
                    offset_y = center_y - frame_center_y

                    # Двигаем камеру, если объект не в центре
                    move_camera_to_center(ptz_service, profile, offset_x, offset_y)

            old_gray = frame_gray.copy()
            p0 = good_new.reshape(-1, 1, 2)
        else:
            cv2.putText(frame, 'Object Lost', (30, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)

        # Показываем результат
        cv2.imshow('KLT Tracking', frame)

        # Нажмите 'r' для выбора новой области отслеживания
        if cv2.waitKey(1) & 0xFF == ord('r'):
            track_window = cv2.selectROI('Select ROI', frame, fromCenter=False, showCrosshair=True)
            cv2.destroyWindow('Select ROI')
            x, y, w, h = int(track_window[0]), int(track_window[1]), int(track_window[2]), int(track_window[3])
            roi = frame[y:y+h, x:x+w]
            mask = np.zeros_like(frame_gray)
            mask[y:y+h, x:x+w] = 1
            p0 = cv2.goodFeaturesToTrack(frame_gray, mask=mask, maxCorners=100, qualityLevel=0.3, minDistance=7, blockSize=7)
            old_gray = frame_gray.copy()

        # Нажмите 'q' для выхода
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    run_main()
