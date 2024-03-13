# Created by VNXLab
# Website: https://vnxlab.uk/
# Python guide: https://vnxlab.uk/how-to-run-python-on-windows-10-11/
# Tested on Windows 10
# =================================
# pip install requests

import requests

def check_directories(link):
    directories = ["wp-admin", "wp-plugins", "wp-content"]
    try:
        response = requests.get(link)
        if response.status_code == 200:
            content = response.text
            for directory in directories:
                if directory in content:
                    print(f"The page {link} contains the directory: {directory}")
                else:
                    print(f"The page {link} does not contain the directory: {directory}")
        else:
            print(f"Failed to retrieve content from {link}. Response code: {response.status_code}")
    except Exception as e:
        print(f"An error occurred while trying to connect to {link}: {e}")

# Example usage
link = input("Enter the link to check: ")
check_directories(link)
