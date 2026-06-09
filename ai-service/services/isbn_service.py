import httpx
import os
from models.schemas import ISBNResponse

GOOGLE_BOOKS_KEY = os.getenv("GOOGLE_BOOKS_API_KEY", "")

CATEGORY_MAP = {
    "Textbook": "textbooks",
    "Education": "textbooks",
    "Fiction": "fiction",
    "Novel": "fiction",
    "Science": "science-tech",
    "Technology": "science-tech",
    "Business": "business",
    "Self-help": "self-help",
    "History": "history",
    "Religion": "religion",
    "Juvenile": "children",
    "Art": "arts-design",
    "Language": "language",
}

def map_category(google_categories: list[str]) -> str:
    for cat in google_categories:
        for key, slug in CATEGORY_MAP.items():
            if key.lower() in cat.lower():
                return slug
    return "other"

async def lookup_isbn(isbn: str) -> ISBNResponse:
    isbn_clean = isbn.replace("-", "").replace(" ", "")

    # Try Google Books first
    url = f"https://www.googleapis.com/books/v1/volumes?q=isbn:{isbn_clean}"
    if GOOGLE_BOOKS_KEY:
        url += f"&key={GOOGLE_BOOKS_KEY}"

    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.get(url)
        data = resp.json()

    if data.get("totalItems", 0) > 0:
        item = data["items"][0]["volumeInfo"]
        cover = None
        if item.get("imageLinks"):
            cover = item["imageLinks"].get("thumbnail") or item["imageLinks"].get("smallThumbnail")
            if cover:
                cover = cover.replace("http://", "https://")

        authors = item.get("authors", [])
        isbn_ids = item.get("industryIdentifiers", [])
        isbn_10 = next((x["identifier"] for x in isbn_ids if x["type"] == "ISBN_10"), None)
        isbn_13 = next((x["identifier"] for x in isbn_ids if x["type"] == "ISBN_13"), None)

        return ISBNResponse(
            title=item.get("title"),
            author=", ".join(authors) if authors else None,
            publisher=item.get("publisher"),
            published_year=int(item.get("publishedDate", "0")[:4]) if item.get("publishedDate") else None,
            cover_image=cover,
            description=item.get("description"),
            category=map_category(item.get("categories", [])),
            language=item.get("language", "en"),
            isbn_10=isbn_10,
            isbn_13=isbn_13,
        )

    # Fallback: OpenLibrary
    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.get(f"https://openlibrary.org/api/books?bibkeys=ISBN:{isbn_clean}&format=json&jscmd=data")
        data = resp.json()

    key = f"ISBN:{isbn_clean}"
    if key in data:
        book = data[key]
        cover = book.get("cover", {}).get("medium") or book.get("cover", {}).get("small")
        authors = [a["name"] for a in book.get("authors", [])]
        return ISBNResponse(
            title=book.get("title"),
            author=", ".join(authors) if authors else None,
            publisher=book.get("publishers", [{}])[0].get("name") if book.get("publishers") else None,
            published_year=book.get("publish_date", "")[:4] or None,
            cover_image=cover,
            isbn_13=isbn_clean if len(isbn_clean) == 13 else None,
            isbn_10=isbn_clean if len(isbn_clean) == 10 else None,
        )

    return ISBNResponse()
