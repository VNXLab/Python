# Created by VNXLab
# Website: https://vnxlab.uk/
# Python guide: https://vnxlab.uk/how-to-run-python-on-windows-10-11/
# Tested on Windows 10
# =================================
# pip install shutil

import os
import shutil

# Desktop path
desktop_path = os.path.expanduser("~/Desktop")

# Paths to target folders
image_folder = os.path.join(desktop_path, "images")
video_folder = os.path.join(desktop_path, "videos")
document_folder = os.path.join(desktop_path, "documents")
other_folder = os.path.join(desktop_path, "others")

# Checking and creating folders if they don't exist
for folder in [image_folder, video_folder, document_folder, other_folder]:
    if not os.path.exists(folder):
        os.makedirs(folder)

# File extensions for each type
image_extensions = [".jpg", ".jpeg", ".png", ".gif", ".bmp"]
video_extensions = [".mp4", ".mov", ".avi", ".mkv"]
document_extensions = [".doc", ".docx", ".xls", ".xlsx", ".pdf", ".ppt", ".pptx"]

# Sorting files on the desktop into appropriate folders
for file_name in os.listdir(desktop_path):
    file_path = os.path.join(desktop_path, file_name)
    if os.path.isfile(file_path):
        _, file_extension = os.path.splitext(file_name)
        file_extension = file_extension.lower()

        if file_extension in image_extensions:
            shutil.move(file_path, image_folder)
            print(f"Moved {file_name} to the images folder.")
        elif file_extension in video_extensions:
            shutil.move(file_path, video_folder)
            print(f"Moved {file_name} to the videos folder.")
        elif file_extension in document_extensions:
            shutil.move(file_path, document_folder)
            print(f"Moved {file_name} to the documents folder.")
        else:
            shutil.move(file_path, other_folder)
            print(f"Moved {file_name} to the others folder.")

