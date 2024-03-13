#pip install beautifulsoup4

import requests
from bs4 import BeautifulSoup

def extract_open_graph_metadata(url):
    # Pobierz zawartość strony
    response = requests.get(url)
    if response.status_code != 200:
        print("Failed to fetch the page.")
        return

    # Użyj BeautifulSoup do parsowania kodu HTML
    soup = BeautifulSoup(response.content, 'html.parser')

    # Znajdź wszystkie meta tagi Open Graph
    og_metadata = {}
    for tag in soup.find_all('meta', attrs={'property': 'og:title'}):
        og_metadata['title'] = tag['content']
    for tag in soup.find_all('meta', attrs={'property': 'og:description'}):
        og_metadata['description'] = tag['content']
    for tag in soup.find_all('meta', attrs={'property': 'og:image'}):
        og_metadata['image'] = tag['content']
    for tag in soup.find_all('meta', attrs={'property': 'og:url'}):
        og_metadata['url'] = tag['content']
    
    return og_metadata

if __name__ == "__main__":
    url = input("Enter the URL of the website to check Open Graph metadata: ")
    metadata = extract_open_graph_metadata(url)
    if metadata:
        print("Open Graph Metadata:")
        print("Title:", metadata.get('title', 'N/A'))
        print("Description:", metadata.get('description', 'N/A'))
        print("Image URL:", metadata.get('image', 'N/A'))
        print("URL:", metadata.get('url', 'N/A'))
    else:
        print("No Open Graph metadata found on the provided URL.")
