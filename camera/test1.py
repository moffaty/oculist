import cv2
from onvif import ONVIFCamera

# Подключение к камере ONVIF
def connect_onvif_camera(camera_ip, username, password):
    camera = ONVIFCamera(camera_ip, 80, username, password)
    ptz = camera.create_ptz_service()
    media_service = camera.create_media_service()
    profiles = media_service.GetProfiles()
    return ptz, profiles[0]

# Перемещение камеры на указанные координаты PTZ
def move_camera_to_position(ptz, profile_token, pan, tilt, zoom=0.5):
    request = ptz.create_type('AbsoluteMove')
    request.ProfileToken = profile_token
    request.Position = {
        'PanTilt': {'x': pan, 'y': tilt},
        'Zoom': {'x': zoom}
    }
    ptz.AbsoluteMove(request)

# Конвертация координат с экрана в PTZ
def convert_to_ptz(x, y, frame_width, frame_height):
    pan = (x / frame_width) * 2 - 1  # Панорама от -1 до 1
    tilt = (y / frame_height) * 2 - 1  # Наклон от -1 до 1
    return pan, tilt

# Обработчик кликов по видеопотоку
def click_event(event, x, y, flags, param):
    if event == cv2.EVENT_LBUTTONDOWN:
        frame_width = param['frame_width']
        frame_height = param['frame_height']
        ptz = param['ptz']
        profile_token = param['profile_token']

        # Перевод координат в PTZ значения
        pan, tilt = convert_to_ptz(x, y, frame_width, frame_height)
        print(f"Moving camera to pan: {pan}, tilt: {tilt}")
        
        # Перемещение камеры
        move_camera_to_position(ptz, profile_token, pan, tilt)

def main():
    # IP и учетные данные камеры ONVIF
    camera_ip = '192.168.1.68'
    username = 'admin'
    password = 'password'
    
    # Подключение к камере
    ptz, profile = connect_onvif_camera(camera_ip, username, password)

    # Открытие видеопотока
    cap = cv2.VideoCapture(f"http://{camera_ip}/video_feed")
    if not cap.isOpened():
        print("Ошибка открытия видеопотока")
        return

    frame_width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    frame_height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            print("Ошибка чтения кадра")
            break

        cv2.imshow('Camera Feed', frame)
        
        # Назначение обработчика кликов с передачей параметров
        cv2.setMouseCallback('Camera Feed', click_event, {
            'frame_width': frame_width,
            'frame_height': frame_height,
            'ptz': ptz,
            'profile_token': profile.token
        })

        # Выход из цикла по нажатию клавиши 'q'
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    main()
