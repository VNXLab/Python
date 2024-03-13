# Tested on Windows 10

from pdf2image import convert_from_path
import os

def pdf_to_image(pdf_file_path, output_folder, image_format):
    try:
        # Convert PDF to images
        images = convert_from_path(pdf_file_path)

        # Create output folder if it doesn't exist
        if not os.path.exists(output_folder):
            os.makedirs(output_folder)

        # Save each page as an image
        for i, image in enumerate(images):
            image_path = os.path.join(output_folder, f"page_{i+1}.{image_format}")
            image.save(image_path, image_format.upper())
        print("Conversion completed successfully!")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    pdf_file_path = input("Enter the path to the PDF file: ")
    output_folder = input("Enter the path for the output folder to save images: ")
    print("Choose the image format:")
    print("1 - JPG")
    print("2 - PNG")
    print("3 - WEBP")
    choice = input("Enter your choice (1/2/3): ")

    image_format = None
    if choice == '1':
        image_format = 'jpg'
    elif choice == '2':
        image_format = 'png'
    elif choice == '3':
        image_format = 'webp'
    else:
        print("Invalid choice. Please choose 1, 2, or 3.")
        exit()

    pdf_to_image(pdf_file_path, output_folder, image_format)
