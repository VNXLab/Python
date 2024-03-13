import os
import requests
from bs4 import BeautifulSoup

def save_text(url, file_path):
    response = requests.get(url)
    soup = BeautifulSoup(response.text, 'html.parser')

    # Extracting text content from the webpage
    text_content = soup.get_text()

    # Saving the text content to a .txt file
    with open(file_path, 'w', encoding='utf-8') as file:
        file.write(text_content)
    
    print("Text content saved successfully!")

# Input the URL of the webpage
url = input("Enter the URL of the webpage: ")
# Input the file path where you want to save the text content
file_path = input("Enter the file path to save the text content (e.g., path/to/save/text.txt): ")

# Ensure that the file path ends with ".txt"
if not file_path.endswith('.txt'):
    file_path += '.txt'

save_text(url, file_path)
