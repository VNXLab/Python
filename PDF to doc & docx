from pdf2docx import Converter

def pdf_to_docx(pdf_file, docx_file):
    cv = Converter(pdf_file)
    cv.convert(docx_file, start=0, end=None)
    cv.close()
    print(f"DOCX file saved as: {docx_file}")

def pdf_to_doc(pdf_file, doc_file):
    cv = Converter(pdf_file)
    cv.convert(doc_file, start=0, end=None)
    cv.close()
    print(f"DOC file saved as: {doc_file}")

if __name__ == "__main__":
    pdf_file_path = input("Enter the path to the PDF file: ")
    docx_file_path = input("Enter the path to save the DOCX file: ")
    doc_file_path = input("Enter the path to save the DOC file: ")

    pdf_to_docx(pdf_file_path, docx_file_path)
    pdf_to_doc(pdf_file_path, doc_file_path)
