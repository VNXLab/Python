#pip install beautifulsoup4

import requests
from bs4 import BeautifulSoup
from collections import Counter

def check_seo(url):
    # Pobierz zawartość strony
    response = requests.get(url)
    if response.status_code != 200:
        print("Failed to fetch the page.")
        return

    # Użyj BeautifulSoup do parsowania kodu HTML
    soup = BeautifulSoup(response.content, 'html.parser')

    # Sprawdź tytuł strony
    title = soup.find('title')
    if title:
        print("Title:", title.text.strip())
    else:
        print("No title found.")

    # Sprawdź meta tagi description i keywords
    meta_description = soup.find('meta', attrs={'name': 'description'})
    if meta_description:
        print("Meta Description:", meta_description['content'].strip())
    else:
        print("No meta description found.")
    meta_keywords = soup.find('meta', attrs={'name': 'keywords'})
    if meta_keywords:
        print("Meta Keywords:", meta_keywords['content'].strip())
    else:
        print("No meta keywords found.")

    # Zlicz długość tekstu na stronie
    text = soup.get_text()
    text_length = len(text.strip())
    print("Text Length:", text_length, "characters")

    # Sprawdź częstość występowania słów kluczowych w treści
    words = text.split()
    word_counts = Counter(words)
    print("Keyword Frequency:")
    for word, count in word_counts.most_common(10):
        print(f"- {word}: {count}")

if __name__ == "__main__":
    url = input("Enter the URL of the website to check SEO: ")
    check_seo(url)
