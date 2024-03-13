# Created by VNXLab
# Website: https://vnxlab.uk/
# Python guide: https://vnxlab.uk/how-to-run-python-on-windows-10-11/
# Tested on Windows 10
# =================================
# pip install requests

import requests

def check_website_headers(url):
    try:
        response = requests.head(url)
        print("URL:", response.url)
        print("Status Code:", response.status_code)
        print("Headers:")
        for header in response.headers:
            print(f"- {header}: {response.headers[header]}")
    except requests.RequestException as e:
        print("Error:", e)

if __name__ == "__main__":
    url = input("Enter the URL of the website to check headers: ")
    check_website_headers(url)
