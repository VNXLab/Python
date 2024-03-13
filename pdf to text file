# Tested on Windows 10
# pip install PyPDF2

import PyPDF2

def pdf_to_text(pdf_file_path, text_file_path):
    try:
        with open(pdf_file_path, 'rb') as pdf_file:
            pdf_reader = PyPDF2.PdfFileReader(pdf_file)
            with open(text_file_path, 'w', encoding='utf-8') as text_file:
                num_pages = pdf_reader.numPages
                for page_number in range(num_pages):
                    page = pdf_reader.getPage(page_number)
                    text_file.write(page.extractText())
        print("Conversion completed successfully!")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    pdf_file_path = input("Enter the path to the PDF file: ")
    text_file_path = input("Enter the path for the output text file: ")
    pdf_to_text(pdf_file_path, text_file_path)
