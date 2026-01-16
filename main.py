from fastapi import FastAPI, Request, Form
from fastapi.responses import HTMLResponse, FileResponse
from fastapi.templating import Jinja2Templates
import instaloader
import itertools
import os
import re

app = FastAPI()
templates = Jinja2Templates(directory=".")


# Serve the HTML page
@app.get("/", response_class=HTMLResponse)
async def home(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})


# Serve the CSS file
@app.get("/style.css")
async def styles():
    return FileResponse("style.css")


# Serve the JS file
@app.get("/script.js")
async def scripts():
    return FileResponse("script.js")


# --- Niche Detection Logic ---
def determine_niche(bio, captions_text):
    full_text = (bio or "").lower() + " " + (captions_text or "").lower()
    
    scores = {
        "Tech & Coding": ["code", "python", "developer", "tech", "ai", "software", "app", "web", "linux", "programming"],
        "Art & Design": ["art", "sketch", "design", "draw", "creative", "artist", "gallery", "illustration", "paint"],
        "Fitness & Health": ["gym", "fitness", "workout", "health", "diet", "muscle", "run", "yoga", "bodybuilding"],
        "Business & Marketing": ["business", "money", "entrepreneur", "marketing", "sales", "finance", "crypto", "invest"],
        "Travel & Lifestyle": ["travel", "explore", "world", "trip", "lifestyle", "adventure", "nature", "wanderlust"],
        "Food & Cooking": ["food", "cook", "recipe", "delicious", "eat", "kitchen", "dinner", "tasty", "chef"]
    }
    
    max_score = 0
    detected = "General Creator"
    
    for category, tags in scores.items():
        score = 0
        for t in tags:
            # \b matches word boundaries (start or end of a word)
            # This ensures "ai" matches "ai" but NOT "daily"
            matches = re.findall(r'\b' + re.escape(t) + r'\b', full_text)
            score += len(matches)
            
        if score > max_score:
            max_score = score
            detected = category
            
    return detected

# The Analysis Endpoint
@app.post("/analyze")
async def scrape_profile(username: str = Form(...)):
    L = instaloader.Instaloader()
    try:
        target_username = username.lstrip('@')
        profile = instaloader.Profile.from_username(L.context, target_username)

        posts = profile.get_posts()
        total_likes = 0
        total_comments = 0
        count = 0
        captions_text = ""

        # Slice the iterator to get only the first 10 posts
        for post in itertools.islice(posts, 10):
            total_likes += post.likes
            total_comments += post.comments
            if post.caption:
                captions_text += " " + post.caption
            count += 1

        avg_likes = int(total_likes / count) if count > 0 else 0
        avg_comments = int(total_comments / count) if count > 0 else 0

        # --- UPDATED: Check for Low Activity ---
        if count < 4:
            detected_niche = "Insufficient Data"
        else:
            detected_niche = determine_niche(profile.biography, captions_text)

        return {
            "success": True,
            "username": profile.username,
            "followers": profile.followers,
            "posts": profile.mediacount,
            "following": profile.followees,
            "avg_likes": avg_likes,
            "avg_comments": avg_comments,
            "niche": detected_niche
        }
    except Exception as e:
        print(f"Error scraping {username}: {e}")
        return {"success": False, "error": str(e)}