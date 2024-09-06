import numpy as np
import cv2

def run_main(video="test.mp4", output="output.mp4"):
    # Открываем веб-камеру (или видеопоток)
    # '0' для веб-камеры
    # rtsp://username:password@ip_address:port/stream
    cap = cv2.VideoCapture(video)  # Используйте  или замените на имя файла для видеофайла

    # Инициализация объекта VideoWriter для записи видео
    out = cv2.VideoWriter(output, cv2.VideoWriter_fourcc(*'mp4v'), 30, (int(cap.get(3)), int(cap.get(4))))

    # Инициализация переменных
    p0 = None
    old_gray = None

    while True:
        # Считываем текущий кадр
        ret, frame = cap.read()

        if not ret:
            break

        # Преобразуем текущий кадр в оттенки серого
        frame_gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

        if p0 is not None and len(p0) > 0:
            # Вычисляем оптический поток (KLT)
            p1, st, err = cv2.calcOpticalFlowPyrLK(old_gray, frame_gray, p0, None, **lk_params)

            # Выбираем только хорошие точки (статус 1)
            good_new = p1[st == 1]
            good_old = p0[st == 1]

            if len(good_new) > 0:
                # Рисуем траектории для отслеживаемых точек и собираем координаты для расчета центра
                center_x, center_y = 0, 0
                count = 0
                for i, (new, old) in enumerate(zip(good_new, good_old)):
                    a, b = new.ravel()
                    c, d = old.ravel()
                    # Преобразуем координаты к целым числам
                    frame = cv2.circle(frame, (int(a), int(b)), 5, (0, 255, 0), -1)
                    frame = cv2.line(frame, (int(a), int(b)), (int(c), int(d)), (0, 255, 0), 2)

                    # Накопление координат для расчета центра
                    center_x += a
                    center_y += b
                    count += 1

                if count > 0:
                    # Рассчитываем среднее значение для нахождения центра
                    center_x = int(center_x / count)
                    center_y = int(center_y / count)

                    # Рисуем центр объекта
                    frame = cv2.circle(frame, (center_x, center_y), 10, (0, 0, 255), -1)
                    frame = cv2.putText(frame, 'Center', (center_x - 25, center_y - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)

            # Обновляем предыдущий кадр и точки
            old_gray = frame_gray.copy()
            p0 = good_new.reshape(-1, 1, 2)
        else:
            # Если нет точек для отслеживания, выводим сообщение
            cv2.putText(frame, 'Object Lost', (30, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)

        # Показываем результат
        cv2.imshow('KLT Tracking', frame)

        # Записываем текущий кадр в видео
        out.write(frame)

        # Нажмите 'r', чтобы выбрать новый объект для отслеживания
        if cv2.waitKey(1) & 0xFF == ord('r'):
            track_window = cv2.selectROI('Select ROI', frame, fromCenter=False, showCrosshair=True)
            cv2.destroyWindow('Select ROI')
            x, y, w, h = int(track_window[0]), int(track_window[1]), int(track_window[2]), int(track_window[3])
            roi = frame[y:y+h, x:x+w]
            mask = np.zeros_like(frame_gray)
            mask[y:y+h, x:x+w] = 1
            p0 = cv2.goodFeaturesToTrack(frame_gray, mask=mask, maxCorners=100, qualityLevel=0.3, minDistance=7, blockSize=7)
            old_gray = frame_gray.copy()  # Обновляем старый кадр

        # Нажмите 'q' для выхода
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    # Закрываем записи
    cap.release()
    out.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    # Параметры для расчета оптического потока методом LK
    lk_params = dict(winSize=(15, 15),
                     maxLevel=2,
                     criteria=(cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, 10, 0.03))
    run_main()
