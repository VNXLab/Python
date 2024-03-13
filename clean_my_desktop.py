import os
import shutil

# Ścieżka do pulpitu
desktop_path = os.path.expanduser("~/Desktop")

# Ścieżki do docelowych folderów
image_folder = os.path.join(desktop_path, "zdjecia")
video_folder = os.path.join(desktop_path, "wideo")
document_folder = os.path.join(desktop_path, "dokumenty")
other_folder = os.path.join(desktop_path, "inne")

# Sprawdzenie i utworzenie folderów, jeśli nie istnieją
for folder in [image_folder, video_folder, document_folder, other_folder]:
    if not os.path.exists(folder):
        os.makedirs(folder)

# Rozszerzenia plików dla każdego typu
image_extensions = [".jpg", ".jpeg", ".png", ".gif", ".bmp"]
video_extensions = [".mp4", ".mov", ".avi", ".mkv"]
document_extensions = [".doc", ".docx", ".xls", ".xlsx", ".pdf", ".ppt", ".pptx"]

# Przeglądanie plików na pulpicie i przenoszenie ich do odpowiednich folderów
for file_name in os.listdir(desktop_path):
    file_path = os.path.join(desktop_path, file_name)
    if os.path.isfile(file_path):
        _, file_extension = os.path.splitext(file_name)
        file_extension = file_extension.lower()

        if file_extension in image_extensions:
            shutil.move(file_path, image_folder)
            print(f"Przeniesiono {file_name} do folderu zdjecia.")
        elif file_extension in video_extensions:
            shutil.move(file_path, video_folder)
            print(f"Przeniesiono {file_name} do folderu wideo.")
        elif file_extension in document_extensions:
            shutil.move(file_path, document_folder)
            print(f"Przeniesiono {file_name} do folderu dokumenty.")
        else:
            shutil.move(file_path, other_folder)
            print(f"Przeniesiono {file_name} do folderu inne.")
