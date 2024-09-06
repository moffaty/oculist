import numpy as np
import cv2

def run_main():
    # Открываем видеофайл
    cap = cv2.VideoCapture('test2.mp4')

    # Читаем первый кадр
    ret, frame = cap.read()

    if not ret:
        print("Ошибка при чтении видео.")
        return

    # Выбираем область интереса (ROI) вручную с помощью мыши
    track_window = cv2.selectROI('Select ROI', frame, fromCenter=False, showCrosshair=True)

    # Закрываем окно после выбора
    cv2.destroyWindow('Select ROI')

    # Преобразуем track_window в нужный формат для работы
    c, r, w, h = int(track_window[0]), int(track_window[1]), int(track_window[2]), int(track_window[3])
    print(c,r,w,h);
    roi = frame[r:r+h, c:c+w]

    # Преобразование ROI в HSV и создание маски
    hsv_roi = cv2.cvtColor(roi, cv2.COLOR_BGR2HSV)
    mask = cv2.inRange(hsv_roi, np.array((0., 30., 32.)), np.array((180., 255., 255.)))
    roi_hist = cv2.calcHist([hsv_roi], [0], mask, [180], [0, 180])
    cv2.normalize(roi_hist, roi_hist, 0, 255, cv2.NORM_MINMAX)

    # Критерии для остановки алгоритма MeanShift
    term_crit = (cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, 80, 1)

    while True:
        ret, frame = cap.read()

        if not ret:
            break

        # Преобразуем текущий кадр в HSV
        hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)

        # Создаем обратную проекцию по гистограмме ROI
        dst = cv2.calcBackProject([hsv], [0], roi_hist, [0, 180], 1)

        # Применяем MeanShift для поиска нового положения объекта
        ret, track_window = cv2.meanShift(dst, track_window, term_crit)

        # Отрисовываем прямоугольник вокруг отслеживаемого объекта
        x, y, w, h = track_window
        cv2.rectangle(frame, (x, y), (x+w, y+h), 255, 2)
        cv2.putText(frame, 'Tracked', (x-25, y-10), cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2, cv2.LINE_AA)

        # Отображаем результат
        cv2.imshow('Tracking', frame)

        # Нажмите 'r', чтобы выбрать новый объект для отслеживания
        if cv2.waitKey(1) & 0xFF == ord('r'):
            # Открываем окно для нового выбора объекта
            track_window = cv2.selectROI('Select ROI', frame, fromCenter=False, showCrosshair=True)
            cv2.destroyWindow('Select ROI')
            c, r, w, h = int(track_window[0]), int(track_window[1]), int(track_window[2]), int(track_window[3])
            roi = frame[r:r+h, c:c+w]
            hsv_roi = cv2.cvtColor(roi, cv2.COLOR_BGR2HSV)
            mask = cv2.inRange(hsv_roi, np.array((0., 30., 32.)), np.array((180., 255., 255.)))
            roi_hist = cv2.calcHist([hsv_roi], [0], mask, [180], [0, 180])
            cv2.normalize(roi_hist, roi_hist, 0, 255, cv2.NORM_MINMAX)

        # Нажмите 'q' для выхода
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    run_main()
