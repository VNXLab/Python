import os
import shutil
import tkinter as tk
from tkinter import messagebox

def clean_temp_folder():
    temp_folder = os.environ.get('TEMP')
    if not temp_folder:
        messagebox.showerror("Błąd", "Nie można znaleźć folderu tymczasowego.")
        return

    root = tk.Tk()
    root.withdraw()  # Ukryj główne okno, pokazuj tylko messagebox

    choice = messagebox.askquestion("Potwierdzenie", f"Czy chcesz wyczyścić folder:\n{temp_folder}")

    if choice == 'yes':
        files_deleted = []
        files_failed = []

        for filename in os.listdir(temp_folder):
            file_path = os.path.join(temp_folder, filename)
            try:
                if os.path.isfile(file_path):
                    os.unlink(file_path)
                    files_deleted.append(filename)
            except Exception as e:
                files_failed.append((filename, str(e)))

        message = "Usunięte pliki:\n"
        for filename in files_deleted:
            message += f"{filename}\n"

        if files_failed:
            message += "\nPliki, których nie można usunąć:\n"
            for filename, error in files_failed:
                message += f"{filename}: {error}\n"

        messagebox.showinfo("Wyniki czyszczenia", message)

if __name__ == "__main__":
    clean_temp_folder()
