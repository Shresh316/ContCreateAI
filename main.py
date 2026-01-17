from fastapi import FastAPI, Request, Form
from fastapi.responses import HTMLResponse, FileResponse
from fastapi.templating import Jinja2Templates
import instaloader
import itertools
import os
import re
from collections import defaultdict

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
    
    # Initialize Score Counters
    category_scores = defaultdict(float)
    
    # 1. SIMPLE LISTS (Default Weight = 1.0)
    # We map keywords to their Category
    simple_keywords = {
        "Tech & Coding": ["code", "python", "developer", "tech", "ai", "software", "app", "web", "linux", "programming"],
        "Art & Design": ["art", "sketch", "design", "draw", "creative", "artist", "gallery", "illustration", "paint"],
        "Fitness & Health": ["gym", "fitness", "workout", "health", "diet", "muscle", "run", "yoga", "bodybuilding"],
        "Business & Marketing": ["business", "money", "entrepreneur", "marketing", "sales", "finance", "crypto", "invest"],
        "Travel & Lifestyle": ["travel", "explore", "world", "trip", "lifestyle", "adventure", "nature", "wanderlust"],
        "Food & Cooking": ["food", "cook", "recipe", "delicious", "eat", "kitchen", "dinner", "tasty", "chef"]
    }

    # Load simple keywords into our rules set
    # Format: "keyword": ("Category", weight)
    rules = {}
    for cat, tags in simple_keywords.items():
        for tag in tags:
            rules[tag] = (cat, 1.0)

    # 2. ADVANCED WEIGHTED RULES
    # Overwrites simple rules if duplicates exist
    weighted_rules = {
        # TECH & CODING
        "repo": ("Tech & Coding", 1.0),
        "commit": ("Tech & Coding", 0.9),
        "push": ("Tech & Coding", 0.8),
        "merge request": ("Tech & Coding", 1.0),
        "pull request": ("Tech & Coding", 1.0),
        "deploy": ("Tech & Coding", 1.0),
        "fullstack": ("Tech & Coding", 1.0),
        "backend": ("Tech & Coding", 1.0),
        "frontend": ("Tech & Coding", 1.0),
        "devops": ("Tech & Coding", 1.0),
        "sysadmin": ("Tech & Coding", 1.0),
        "ci/cd": ("Tech & Coding", 1.0),
        "docker": ("Tech & Coding", 1.0),
        "kubernetes": ("Tech & Coding", 1.0),
        "k8s": ("Tech & Coding", 1.0),
        "python": ("Tech & Coding", 0.6),
        "javascript": ("Tech & Coding", 1.0),
        "typescript": ("Tech & Coding", 1.0),
        "rust": ("Tech & Coding", 0.9),
        "rustacean": ("Tech & Coding", 1.0),
        "react": ("Tech & Coding", 0.8),
        "django": ("Tech & Coding", 0.9),
        "flutter": ("Tech & Coding", 1.0),
        "wasm": ("Tech & Coding", 1.0),
        "webassembly": ("Tech & Coding", 1.0),
        "aiops": ("Tech & Coding", 1.0),
        "arazzo": ("Tech & Coding", 1.0),
        "generative ai": ("Tech & Coding", 0.8),
        "bug": ("Tech & Coding", 0.7),
        "debugging": ("Tech & Coding", 1.0),
        "ship it": ("Tech & Coding", 0.8),
        "spaghetti code": ("Tech & Coding", 1.0),
        "mvp": ("Tech & Coding", 0.6),

        # ART & DESIGN
        "dtiys": ("Art & Design", 1.0),
        "draw this in your style": ("Art & Design", 1.0),
        "wip": ("Art & Design", 0.9),
        "commissions open": ("Art & Design", 1.0),
        "comms open": ("Art & Design", 1.0),
        "prints available": ("Art & Design", 0.9),
        "oc": ("Art & Design", 0.8),
        "fanart": ("Art & Design", 1.0),
        "gouache": ("Art & Design", 1.0),
        "acrylic": ("Art & Design", 0.9),
        "watercolor": ("Art & Design", 1.0),
        "plein air": ("Art & Design", 1.0),
        "procreate": ("Art & Design", 1.0),
        "cintiq": ("Art & Design", 1.0),
        "wacom": ("Art & Design", 1.0),
        "sketchbook": ("Art & Design", 1.0),
        "mural": ("Art & Design", 1.0),
        "sculpture": ("Art & Design", 1.0),
        "calligraphy": ("Art & Design", 1.0),
        "typography": ("Art & Design", 1.0),
        "kerning": ("Art & Design", 1.0),

        # FITNESS & HEALTH
        "amrap": ("Fitness & Health", 1.0),
        "hiit": ("Fitness & Health", 1.0),
        "doms": ("Fitness & Health", 1.0),
        "pr": ("Fitness & Health", 0.5),
        "pb": ("Fitness & Health", 0.5),
        "atg": ("Fitness & Health", 1.0),
        "1rm": ("Fitness & Health", 1.0),
        "macros": ("Fitness & Health", 0.9),
        "bulking": ("Fitness & Health", 1.0),
        "cutting": ("Fitness & Health", 0.8),
        "gains": ("Fitness & Health", 0.9),
        "shredded": ("Fitness & Health", 0.8),
        "natty": ("Fitness & Health", 1.0),
        "hypertrophy": ("Fitness & Health", 1.0),
        "calisthenics": ("Fitness & Health", 1.0),
        "glutes": ("Fitness & Health", 1.0),
        "quads": ("Fitness & Health", 0.9),
        "lats": ("Fitness & Health", 1.0),
        "preworkout": ("Fitness & Health", 1.0),
        "gym rat": ("Fitness & Health", 1.0),

        # BUSINESS & MARKETING
        "roi": ("Business & Marketing", 1.0),
        "kpi": ("Business & Marketing", 1.0),
        "b2b": ("Business & Marketing", 1.0),
        "b2c": ("Business & Marketing", 1.0),
        "saas": ("Business & Marketing", 0.9),
        "seo": ("Business & Marketing", 1.0),
        "lead gen": ("Business & Marketing", 1.0),
        "conversion rate": ("Business & Marketing", 1.0),
        "funnel": ("Business & Marketing", 0.7),
        "solopreneur": ("Business & Marketing", 1.0),
        "entrepreneur": ("Business & Marketing", 0.9),
        "dropshipping": ("Business & Marketing", 1.0),
        "affiliate marketing": ("Business & Marketing", 1.0),
        "growth hacking": ("Business & Marketing", 1.0),
        "zero-click": ("Business & Marketing", 1.0),
        "cookieless": ("Business & Marketing", 1.0),
        "copywriting": ("Business & Marketing", 1.0),

        # TRAVEL & LIFESTYLE
        "digital nomad": ("Travel & Lifestyle", 1.0),
        "visa run": ("Travel & Lifestyle", 1.0),
        "schengen shuffle": ("Travel & Lifestyle", 1.0),
        "coworking": ("Travel & Lifestyle", 0.9),
        "vanlife": ("Travel & Lifestyle", 1.0),
        "location independent": ("Travel & Lifestyle", 1.0),
        "wanderlust": ("Travel & Lifestyle", 0.9),
        "globetrotter": ("Travel & Lifestyle", 1.0),
        "itinerary": ("Travel & Lifestyle", 1.0),
        "passport": ("Travel & Lifestyle", 0.9),
        "jetsetter": ("Travel & Lifestyle", 1.0),
        "hidden gem": ("Travel & Lifestyle", 0.8),
        "staycation": ("Travel & Lifestyle", 1.0),
        "layover": ("Travel & Lifestyle", 1.0),
        "bucket list": ("Travel & Lifestyle", 0.8),

        # FOOD & COOKING
        "mise en place": ("Food & Cooking", 1.0),
        "sous vide": ("Food & Cooking", 1.0),
        "86d": ("Food & Cooking", 1.0),
        "heard": ("Food & Cooking", 0.6),
        "al dente": ("Food & Cooking", 1.0),
        "umami": ("Food & Cooking", 1.0),
        "julienne": ("Food & Cooking", 1.0),
        "keto": ("Food & Cooking", 0.9),
        "vegan": ("Food & Cooking", 0.9),
        "gluten free": ("Food & Cooking", 0.9),
        "plant based": ("Food & Cooking", 0.9),
        "home cook": ("Food & Cooking", 1.0),
        "foodporn": ("Food & Cooking", 1.0),
        "bussin": ("Food & Cooking", 0.7),
        "recipe": ("Food & Cooking", 1.0)
    }
    
    # Merge rules (Weighted rules overwrite simple ones)
    rules.update(weighted_rules)

    # 3. EXECUTE SCORING
    for keyword, (category, weight) in rules.items():
        # \b ensures we match "ai" but not "daily"
        pattern = r'\b' + re.escape(keyword) + r'\b'
        matches = re.findall(pattern, full_text)
        
        if matches:
            category_scores[category] += (len(matches) * weight)

    # 4. DETERMINE WINNER
    if not category_scores:
        return "General Creator"
        
    best_niche = max(category_scores, key=category_scores.get)
    
    # Optional: Threshold check. If score is too low, return General
    if category_scores[best_niche] < 1.0:
        return "General Creator"
        
    return best_niche


# The Analysis Endpoint
@app.post("/analyze")
async def scrape_profile(username: str = Form(...)):
    # Note: Using Instaloader without login often results in redirect errors.
    # For production, you must use L.login(user, pass) or load_session_from_file.
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

        # --- Check for Low Activity ---
        if count < 4:
            detected_niche = "Insufficient Data (Private or Empty)"
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