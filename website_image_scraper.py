# Created by VNXLab
# Website: https://vnxlab.uk/
# Python guide: https://vnxlab.uk/how-to-run-python-on-windows-10-11/
# Tested on Windows 10
# =================================
# pip install BeautifulSoup

import os
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse

def download_images(url, folder_path):
    response = requests.get(url)
    soup = BeautifulSoup(response.text, 'html.parser')

    # Create the folder if it doesn't exist
    if not os.path.exists(folder_path):
        os.makedirs(folder_path)

    # Get all the img tags from the webpage
    img_tags = soup.find_all('img')

    for img_tag in img_tags:
        # Get the image URL
        img_url = img_tag.get('src')
        if not img_url:
            continue

        # Make the image URL absolute
        img_url = urljoin(url, img_url)

        # Download only images with extensions webp, jpeg, jpg, png
        if img_url.lower().endswith(('webp', 'jpeg', 'jpg', 'png')):
            # Get the file name from the URL
            img_filename = os.path.basename(urlparse(img_url).path)
            # Create the local path
            img_path = os.path.join(folder_path, img_filename)

            # Download and save the image locally
            with open(img_path, 'wb') as img_file:
                img_response = requests.get(img_url)
                img_file.write(img_response.content)
                print(f"Saved image: {img_filename}")

# Input the URL of the webpage
url = input("Enter the URL of the webpage: ")
# Input the folder path where you want to save the images
folder_path = input("Enter the folder path to save the images: ")

download_images(url, folder_path)
