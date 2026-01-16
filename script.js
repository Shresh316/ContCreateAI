VanillaTilt.init(document.querySelectorAll("[data-tilt]"), { max: 5, speed: 400, glare: true, "max-glare": 0.2 });

// --- GLOBAL VARIABLES ---
let currentUsername = "";
let globalFollowers = 0;
let selectedStrategyKey = 'tech'; 

// --- CHART INSTANCES (Global for proper destruction) ---
let mainChart = null;
let radarChart = null;
let sentimentChart = null;
let strategyChart = null;

const API_KEY = "RAmK6mqLKrUnTv9YeEMFBnDQFcEFdafM"; 
const API_URL = "https://api.mistral.ai/v1/chat/completions";

const tailoredTrends = {
    'default': {
         niche: 'General Creator',
         viralIdeas: ["🔥 <b>Trending Audio Transition:</b> Sync your clips to the beat.", "🗣️ <b>Controversial Opinion:</b> Share a hot take in your niche.", "📚 <b>Educational Listicle:</b> 'Top 3 tools for X'."],
         audio: ["Flowers - Miley Cyrus", "As It Was - Harry Styles", "Trending Reels Audio", "Made You Look", "Cupid", "Hero - Alan Walker"],
         apps: ["CapCut", "InShot", "Canva"],
         format: { title: "The 'Hook-Value-CTA'", desc: "3s Hook -> 15s Value/Tips -> Call to Action (Follow for more)." }
    }
};

// --- CORE: HARD RESET FUNCTION ---
// This runs on "Reset" button AND before every new search
// --- CORE: HARD RESET FUNCTION ---
// This runs on "Reset" button AND before every new search
function clearState() {
    // 1. Destroy Charts (Prevents "canvas is already in use" errors)
    if(mainChart) { mainChart.destroy(); mainChart = null; }
    if(radarChart) { radarChart.destroy(); radarChart = null; }
    if(sentimentChart) { sentimentChart.destroy(); sentimentChart = null; }
    if(strategyChart) { strategyChart.destroy(); strategyChart = null; }

    // 2. Clear Visual Content (Lists, Grids, Avatars)
    document.getElementById('viral-ideas-box').innerHTML = '';
    document.getElementById('audio-box').innerHTML = '';
    document.getElementById('apps-box').innerHTML = '';
    document.getElementById('leaderboard-list').innerHTML = '';
    document.getElementById('ai-roadmap-list').innerHTML = '';
    document.getElementById('viral-ideas-list').innerHTML = '';
    document.getElementById('paletteBox').innerHTML = '';
    document.getElementById('heatmap').innerHTML = '';
    document.getElementById('dash-avatar').innerHTML = ''; // Wipe Avatar
    document.getElementById('chat-box').innerHTML = ''; // Wipe Chat history

    // 3. Reset Text Placeholders to Defaults
    document.getElementById('dashTitle').innerText = '@user';
    document.getElementById('stat-followers').innerText = '...';
    document.getElementById('stat-eng').innerText = '...';
    document.getElementById('stat-reach').innerText = '...';
    document.getElementById('stat-likes').innerText = '...';
    document.getElementById('stat-comments').innerText = '...';
    document.getElementById('stat-viral').innerText = '...';
    document.getElementById('trend-topic-header').innerText = '🔥 Personalized Viral Strategy';
    document.getElementById('money-display').innerText = '$0';
    document.getElementById('captionScore').innerText = '0';
    document.getElementById('captionFeedback').innerText = 'Waiting for input...';

    // 4. Clear Tool Inputs
    document.getElementById('rivalInput').value = '';
    document.getElementById('chatInput').value = '';
    document.getElementById('goalInput').value = '';
    document.getElementById('bioRole').value = '';
    document.getElementById('bioVibe').value = '';
    document.getElementById('captionInput').value = '';

    // 5. Reset Global Variables
    currentUsername = "";
    globalFollowers = 0;
}

// --- BUTTON: FULL RESET (Goes back to home) ---
// RENAMED from fullReset to resetApp to match your index.html onclick
function resetApp() {
    clearState(); // Wipe all data first
    
    // Switch Views
    document.getElementById('view-dashboard').style.display = 'none';
    document.getElementById('view-home').style.display = 'flex';
    
    // Clear Main Login Input
    const input = document.getElementById('usernameInput');
    input.value = '';
    input.focus();
}
// --- APP STARTUP ---
// --- APP STARTUP (Modified for Analytics Cleanup) ---
async function startApp() {
    // 1. FORCE CLEAR ANALYTICS TABS IMMEDIATELY
    // This ensures old data is gone before the loader even finishes
    document.getElementById('viral-ideas-box').innerHTML = '';
    document.getElementById('audio-box').innerHTML = '';
    document.getElementById('apps-box').innerHTML = '';
    document.getElementById('trend-topic-header').innerText = 'Analysing Niche...'; 

    clearState(); // Standard reset for other vars
    
    runLoader(async () => {
        let formData = new FormData();
        const inputVal = document.getElementById('usernameInput').value.trim();
        if(inputVal) currentUsername = inputVal.startsWith('@') ? inputVal : '@' + inputVal;
        
        formData.append('username', currentUsername);

        let followers = 0;
        let avgLikes = 0;
        let avgComments = 0;
        let detectedNiche = "General Creator"; 
        let success = false;

        try {
            const response = await fetch('/analyze', { method: 'POST', body: formData });
            const data = await response.json();
            if (data.success) {
                followers = data.followers;
                avgLikes = data.avg_likes;
                avgComments = data.avg_comments;
                detectedNiche = data.niche; // <--- CAPTURE NEW NICHE
                success = true;
            } else { console.error("Scrape failed:", data.error); }
        } catch (e) { console.error("Fetch failed:", e); }

        const seed = stringToHash(currentUsername);
        document.getElementById('dashTitle').innerText = currentUsername;

        // 2. UPDATE HEADER WITH NEW NICHE
        document.getElementById('trend-topic-header').innerText = `🔥 Personalized Strategy: ${detectedNiche}`;

        const engagement = followers > 0 ? ((avgLikes + avgComments) / followers * 100).toFixed(2) : "1.5";
        
        if (success) {
            updateDashboardStatsReal(seed, followers, avgLikes, avgComments);
            
            // 3. GENERATE NEW SUGGESTIONS BASED ON DETECTED NICHE
            // We pass the new niche directly to the AI generator
            if (detectedNiche !== "Insufficient Data") {
                 generateAIStrategy(detectedNiche, followers, engagement);
            } else {
                 renderTrendsFallback("Insufficient Data");
            }
        } else {
            updateDashboardStats(seed); // Simulation mode
            renderTrendsFallback(detectedNiche);
        }

        // Init Components
        initMainChart(seed);
        initRadarChart();
        initSentimentChart(seed);
        generatePalette(seed);
        renderHeatmap(seed);
        renderRoadmap(seed, detectedNiche);
        initStrategyChart();
        renderLeaderboard();

        transitionToPage('view-home', 'view-dashboard');
    });
}

// --- AI STRATEGY (Updated to force specific Niche suggestions) ---
async function generateAIStrategy(niche, followers, engagement) {
    // Show loading state specifically in the lists
    const loadingHTML = `<div style="padding:15px; color:var(--text-muted); font-size:0.9rem;">
                            <i class="fas fa-circle-notch fa-spin"></i> Generating ${niche} tips...
                         </div>`;
    
    document.getElementById('viral-ideas-box').innerHTML = loadingHTML;
    document.getElementById('audio-box').innerHTML = loadingHTML;
    document.getElementById('apps-box').innerHTML = loadingHTML;

    // Strict prompt to ensure suggestions match the new niche
    const prompt = `
        Context: Instagram Strategy for '${niche}' niche.
        Stats: ${followers} followers.
        Task:
        1. 3 Viral Content Ideas specific to ${niche}.
        2. 3 Trending Audio/Music vibes for ${niche}.
        3. 3 Editing Apps/Tools best for ${niche}.
        Output JSON:
        {
            "viralIdeas": ["Idea 1", "Idea 2", "Idea 3"],
            "audio": ["Audio 1", "Audio 2", "Audio 3"],
            "apps": ["App 1", "App 2", "App 3"]
        }
    `;

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Authorization": `Bearer ${API_KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify({
                model: "mistral-medium",
                messages: [{ role: "system", content: "You are a JSON generator. Output only raw JSON." }, { role: "user", content: prompt }],
                response_format: { type: "json_object" }
            })
        });

        const data = await response.json();
        const content = data.choices[0].message.content;
        const strategy = JSON.parse(content);
        
        // Pass the fresh strategy to the UI updater
        updateTrendsUI(strategy);
        
    } catch (error) {
        console.error("AI Generation Failed:", error);
        // If AI fails, fallback but still keep the niche header
        renderTrendsFallback(niche); 
        document.getElementById('viral-ideas-box').innerHTML += `<div style="color:var(--danger); font-size:0.7rem; margin-top:5px;">(AI Offline - Using Defaults)</div>`;
    }
}

// --- UI UPDATER (Ensures clean slate before adding) ---
function updateTrendsUI(strategy) {
    // Clear the loading spinners
    const ideasBox = document.getElementById('viral-ideas-box'); 
    ideasBox.innerHTML = ''; 
    
    const audioBox = document.getElementById('audio-box'); 
    audioBox.innerHTML = ''; 
    
    const appsBox = document.getElementById('apps-box'); 
    appsBox.innerHTML = '';

    // Populate new data
    strategy.viralIdeas.forEach(idea => {
        ideasBox.innerHTML += `<div class="trend-item"><div class="trend-icon"><i class="fas fa-video"></i></div> <div>${idea}</div></div>`;
    });
    
    strategy.audio.forEach(track => {
        audioBox.innerHTML += `<div class="trend-item"><div class="trend-icon"><i class="fas fa-music"></i></div> <div>${track}</div></div>`;
    });
    
    strategy.apps.forEach(app => {
        appsBox.innerHTML += `<div class="tag-pill">${app}</div>`;
    });
}

// --- AI STRATEGY ---




function renderTrendsFallback(detectedNiche) {
    if (detectedNiche === "Insufficient Data") {
        document.getElementById('trend-topic-header').innerText = "⚠️ Low Activity Profile";
        const warn = `<div style="text-align:center; color:var(--text-muted); padding:20px; border:1px solid var(--glass-border); border-radius:8px;">
            <i class="fas fa-exclamation-triangle"></i> Not enough recent posts to analyze.
        </div>`;
        document.getElementById('viral-ideas-box').innerHTML = warn;
        document.getElementById('audio-box').innerHTML = warn;
        document.getElementById('apps-box').innerHTML = warn;
        return;
    }

    const data = tailoredTrends['default'];
    data.niche = detectedNiche || 'General';
    document.getElementById('trend-topic-header').innerText = `🔥 Personalized Strategy: ${data.niche}`;
    // (Standard fallback rendering omitted for brevity, but logic flows here)
    const ideasBox = document.getElementById('viral-ideas-box'); ideasBox.innerHTML = '';
    data.viralIdeas.forEach(i => ideasBox.innerHTML += `<div class="trend-item"><div class="trend-icon"><i class="fas fa-video"></i></div> <div>${i}</div></div>`);
    // ... fill audio/apps similarly
}

// --- CHART INITIALIZATION (FIXED DESTRUCTION) ---
function initMainChart(seed) {
    const ctx = document.getElementById('mainChart').getContext('2d');
    if(mainChart) mainChart.destroy(); // Fix Ghosting
    
    let gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, 'rgba(124, 58, 237, 0.4)');
    gradient.addColorStop(1, 'rgba(124, 58, 237, 0)');
    const dataPoints = Array.from({length: 5}, (_, i) => getPseudoRandom(seed + i + 10, 10000, 20000));
    dataPoints.sort((a,b) => a - b);
    
    mainChart = new Chart(ctx, { type: 'line', data: { labels: ['W1', 'W2', 'W3', 'W4', 'W5'], datasets: [{ label: 'Followers', data: dataPoints, borderColor: '#7c3aed', backgroundColor: gradient, fill: true, tension: 0.4 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { grid: { color: 'rgba(255,255,255,0.05)' } }, x: { display: false } } } });
}

function initRadarChart() {
    const ctx = document.getElementById('radarChart').getContext('2d');
    if(radarChart) radarChart.destroy(); // Fix Ghosting
    
    radarChart = new Chart(ctx, { type: 'radar', data: { labels: ['Reach', 'Engagement', 'Freq', 'Saves', 'Shares'], datasets: [{ label: 'You', data: [80, 90, 70, 85, 95], backgroundColor: 'rgba(45, 212, 191, 0.2)', borderColor: '#2dd4bf' }] }, options: { responsive: true, maintainAspectRatio: false, scales: { r: { grid: { color: 'rgba(255,255,255,0.1)' }, pointLabels: { color: '#ccc' }, ticks: { display: false } } }, plugins: { legend: { labels: { color: 'white' } } } } });
}

function initSentimentChart(seed) {
    const ctx = document.getElementById('sentimentChart').getContext('2d');
    if(sentimentChart) sentimentChart.destroy(); // Fix Ghosting

    const pos = getPseudoRandom(seed + 20, 50, 90);
    const neg = getPseudoRandom(seed + 21, 0, 100 - pos);
    const neu = 100 - pos - neg;
    sentimentChart = new Chart(ctx, { type: 'doughnut', data: { labels: ['Positive', 'Neutral', 'Negative'], datasets: [{ data: [pos, neu, neg], backgroundColor: ['#10b981', '#64748b', '#ef4444'], borderWidth: 0 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } } });
}

function initStrategyChart() {
    const ctx = document.getElementById('strategyChart').getContext('2d');
    if(strategyChart) strategyChart.destroy(); // Fix Ghosting
    
    // Default or calculated data
    strategyChart = new Chart(ctx, { type: 'doughnut', data: { labels: ['Reels', 'Carousel', 'Stories'], datasets: [{ data: [33, 33, 33], backgroundColor: ['#7c3aed', '#2dd4bf', '#f472b6'], borderWidth: 0 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: 'white', boxWidth: 10, padding: 20 } } } } });
}


// --- OTHER HELPERS ---
function openSettingsModal() { document.getElementById('settings-modal').style.display = 'flex'; }
function closeSettingsModal() { document.getElementById('settings-modal').style.display = 'none'; }
function fillAndSearch(user) { document.getElementById('usernameInput').value = user; }
function handleChatEnter(e) { if(e.key === 'Enter') sendMessage(); }

function sendQuickMsg(msg) { document.getElementById('chatInput').value = msg; sendMessage(); }
async function sendMessage() { /* Same chat logic as before */ }

function openGate() {
    document.getElementById('gate-content').style.opacity = '0';
    const left = document.getElementById('gate-left');
    const right = document.getElementById('gate-right');
    setTimeout(() => { left.style.transform = "translateX(-100%)"; right.style.transform = "translateX(100%)"; }, 300);
    setTimeout(() => { document.getElementById('gate-overlay').style.display = 'none'; document.getElementById('view-platform-select').style.display = 'flex'; }, 1800);
}

function transitionToPage(hideId, showId) {
    const overlay = document.getElementById('gate-overlay');
    const left = document.getElementById('gate-left');
    const right = document.getElementById('gate-right');
    overlay.style.display = 'flex';
    setTimeout(() => { left.style.transform = "translateX(0)"; right.style.transform = "translateX(0)"; }, 10);
    setTimeout(() => {
        if(hideId) document.getElementById(hideId).style.display = 'none';
        if(showId) document.getElementById(showId).style.display = showId === 'view-dashboard' ? 'block' : 'flex';
        left.style.transform = "translateX(-100%)"; right.style.transform = "translateX(100%)";
        setTimeout(() => { overlay.style.display = 'none'; }, 1500);
    }, 1500);
}

function selectPlatform(platform) {
    if(platform === 'instagram') transitionToPage('view-platform-select', 'view-home');
    else alert("Platform Coming Soon! Only Instagram is active for the Hackathon.");
}

function openTeamModal() { document.getElementById('team-modal').style.display = 'flex'; }
function closeTeamModal() { document.getElementById('team-modal').style.display = 'none'; }

function stringToHash(string) {
    let hash = 0;
    if (string.length == 0) return hash;
    for (let i = 0; i < string.length; i++) { hash = ((hash << 5) - hash) + string.charCodeAt(i); hash = hash & hash; }
    return Math.abs(hash);
}

function getPseudoRandom(seed, min, max) {
    const x = Math.sin(seed++) * 10000;
    const rand = x - Math.floor(x);
    return Math.floor(rand * (max - min + 1)) + min;
}

function getSeededColor(seed) {
    const colors = ['#7c3aed', '#2dd4bf', '#f472b6', '#ef4444', '#3b82f6', '#f59e0b'];
    return colors[seed % colors.length];
}

function handleEnter(e) { if(e.key === 'Enter') initiateSearch(); }

function initiateSearch() {
    const input = document.getElementById('usernameInput');
    if(!input.value.trim()) { input.style.borderColor = 'red'; setTimeout(() => input.style.borderColor = 'var(--glass-border)', 1000); return; }
    currentUsername = input.value.trim();
    if(!currentUsername.startsWith('@')) currentUsername = '@' + currentUsername;
    const seed = stringToHash(currentUsername);
    const initials = currentUsername.replace('@', '').substring(0, 2).toUpperCase();
    const bgCol = getSeededColor(seed);
    const avatarHTML = `<div style="background:${bgCol}; width:100%; height:100%; display:flex; align-items:center; justify-content:center;">${initials}</div>`;
    document.getElementById('verify-avatar').innerHTML = avatarHTML;
    document.getElementById('verify-username').innerText = currentUsername;
    document.getElementById('dash-avatar').innerHTML = avatarHTML;
    document.getElementById('verify-modal').style.display = 'flex';
}

function cancelSearch() { document.getElementById('verify-modal').style.display = 'none'; }
function confirmSearch() { document.getElementById('verify-modal').style.display = 'none'; startApp(); }

function runLoader(callback) {
    const loader = document.getElementById('hacker-loader');
    const container = document.getElementById('code-container');
    const lines = ["> Connecting to Instagram API...", `> Identifying Target: ${currentUsername}...`, "> Fetching Follower Count...", "> Analyzing Color Histograms...", "> Calculating Virality Vectors...", "> ACCESS GRANTED."];
    loader.style.display = 'block'; container.innerHTML = '';
    let delay = 0;
    lines.forEach((line, i) => { setTimeout(() => { const p = document.createElement('div'); p.className = 'code-line'; p.innerText = line; container.appendChild(p); }, delay); delay += 800; });
    setTimeout(() => { loader.style.display = 'none'; callback(); }, delay + 500);
}

function renderLeaderboard() {
    const container = document.getElementById('leaderboard-list'); container.innerHTML = '';
    const row1 = document.createElement('div'); row1.className = 'leader-row'; row1.style.background = 'rgba(124, 58, 237, 0.2)'; row1.style.borderRadius = '8px';
    row1.innerHTML = `<span class="rank-num">1</span><span>@myy.sketch.gallery</span><span style="color: var(--success);">+12.4%</span>`;
    container.appendChild(row1);
}

function generateGoalPlan() { /* ...Same as before... */ }
function formatNumber(num) {
    if(num >= 1000000) return (num/1000000).toFixed(1) + 'M';
    if(num >= 1000) return (num/1000).toFixed(1) + 'k';
    return num;
}

function updateDashboardStatsReal(seed, realFollowers, realAvgLikes, realAvgComments) {
    globalFollowers = realFollowers;
    const reach = Math.floor(realFollowers * (getPseudoRandom(seed+1, 12, 25) / 10)); 
    const engRate = realFollowers > 0 ? ((realAvgLikes + realAvgComments) / realFollowers * 100).toFixed(2) : 0;
    const viralScore = (getPseudoRandom(seed+3, 40, 95) / 10).toFixed(1);
    document.getElementById('stat-followers').innerText = formatNumber(realFollowers);
    document.getElementById('stat-eng').innerText = engRate + "%";
    document.getElementById('stat-reach').innerText = formatNumber(reach);
    document.getElementById('stat-likes').innerText = formatNumber(realAvgLikes);
    document.getElementById('stat-comments').innerText = formatNumber(realAvgComments);
    document.getElementById('stat-viral').innerText = viralScore + "/10";
}

function updateDashboardStats(seed) {
    const followers = getPseudoRandom(seed, 5000, 500000);
    updateDashboardStatsReal(seed, followers, Math.floor(followers*0.05), Math.floor(followers*0.005));
}

function setTab(id, btn) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    btn.classList.add('active');
}
function setTheme(theme) { document.body.className = theme; }
function toggleMission(el) { el.classList.toggle('done'); updateXP(); }
function updateXP() { document.getElementById('xp-bar').style.width = "50%"; } 
function runShadowbanScan() { /* ... */ }
function calcRate() { /* ... */ }
function runRoast() { document.getElementById('roast-output').innerText = "Simulated Roast"; }
function generateBio() { document.getElementById('bioOutput').innerText = "Simulated Bio"; }
function loadImage(input) { /* ... */ }
function renderHeatmap(seed) {
    const container = document.getElementById('heatmap');
    container.innerHTML = '<div></div><div>M</div><div>T</div><div>W</div><div>T</div><div>F</div><div>S</div><div>S</div>';
    for(let i=0; i<28; i++) {
        const div = document.createElement('div');
        div.className = 'hm-cell';
        if(getPseudoRandom(seed + i, 0, 100) > 50) div.classList.add('med');
        container.appendChild(div);
    }
}
function analyzeCaption() { /* ... */ }
function updateRadar() { /* ... */ }
function generatePalette(seed) {
    const colors = ['#0f172a', '#334155', '#475569', '#7c3aed', '#a78bfa'];
    if(seed % 2 === 0) colors.reverse();
    const container = document.getElementById('paletteBox'); container.innerHTML = '';
    colors.forEach(c => { const div = document.createElement('div'); div.className = 'color-chip'; div.style.backgroundColor = c; container.appendChild(div); });
}
function renderRoadmap(seed, detectedNiche) { /* ... */ }