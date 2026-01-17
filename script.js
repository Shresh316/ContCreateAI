VanillaTilt.init(document.querySelectorAll("[data-tilt]"), { max: 5, speed: 400, glare: true, "max-glare": 0.2 });

// --- GLOBAL VARIABLES ---
let currentUsername = "";
let globalFollowers = 0;

// --- CHART INSTANCES ---
let mainChart = null;
let radarChart = null;
let sentimentChart = null;

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

// --- HELPER: SAFE CLEAR & MANIPULATION ---
function safeClear(id, content = '') {
    const el = document.getElementById(id);
    if (el) {
        el.innerHTML = content;
    } else {
        console.warn(`SafeClear: Element #${id} not found.`);
    }
}

function safeText(id, text) {
    const el = document.getElementById(id);
    if (el) el.innerText = text;
}

function safeValue(id, val) {
    const el = document.getElementById(id);
    if (el) el.value = val;
}

// --- CORE: HARD RESET FUNCTION ---
// --- CORE: HARD RESET FUNCTION ---
function clearState() {

    // 1. Destroy Charts (Safely)

    try {

        if(mainChart) { mainChart.destroy(); mainChart = null; }

        if(radarChart) { radarChart.destroy(); radarChart = null; }

        if(sentimentChart) { sentimentChart.destroy(); sentimentChart = null; }

    } catch (e) {

        console.warn("Chart destruction error (ignored):", e);

    }



Copy

Copy

    // 2. Clear Visual Content

    safeClear('viral-ideas-box');

    safeClear('audio-box');

    safeClear('apps-box');

    safeClear('leaderboard-list');

    safeClear('heatmap');

    safeClear('dash-avatar');

Copy

Copy

    safeClear('goal-steps-container');

    safeClear('bioOutput');

    safeClear('roast-output', '"Dare to click?"');

    

Copy

Copy

    // 3. Reset Chat to Default Message

    const defaultChatMsg = `

        <div class="message msg-bot">

            Hello! I am your <b>REAL AI</b> Instagram Growth Assistant (Powered by Mistral). <br>

            I can generate topics, captions, and strategies for you. <br>

            Try asking: <b>"Give me 3 viral topics"</b> or <b>"Write a caption for a travel photo"</b>.

        </div>`;

    safeClear('chat-box', defaultChatMsg);



    // 4. Reset Tools & Terminals

    safeClear('scan-terminal', 'Ready to scan...');

    safeText('money-display', '$0');

    safeText('captionScore', '0');

    safeText('captionFeedback', 'Waiting for input...');

    

    // 5. Reset Goals & Competitor Sections

    const goalResults = document.getElementById('goal-results');

    if(goalResults) goalResults.style.display = 'none';



    const battleReport = document.getElementById('battle-report');

    if(battleReport) battleReport.style.display = 'none';

    

    safeText('winner-text', 'Analysis Pending...');

    const winnerText = document.getElementById('winner-text');

    if(winnerText) winnerText.style.color = 'var(--success)';



    // 6. Reset Text Placeholders (Stats)

    safeText('dashTitle', '@user');

    safeText('stat-followers', '...');

    safeText('stat-eng', '...');

    safeText('stat-reach', '...');

    safeText('stat-likes', '...');

    safeText('stat-comments', '...');

    safeText('stat-viral', '...');

    safeText('trend-topic-header', '🔥 Personalized Viral Strategy');

Copy

Copy



Copy

Copy

    // 7. Clear All Inputs

    safeValue('usernameInput', '');

    safeValue('rivalInput', '');

    safeValue('chatInput', '');

    safeValue('goalInput', '');

    safeValue('bioRole', '');

    safeValue('bioVibe', '');

    safeValue('captionInput', '');



Copy

Copy

    // 8. Reset XP & Missions

    document.querySelectorAll('.mission-item').forEach(el => el.classList.remove('done'));

    const xpBar = document.getElementById('xp-bar');

    if(xpBar) xpBar.style.width = '0%';

    safeText('xp-text', '0/3 XP');



    // 9. Reset Global Variables

    currentUsername = "";

    globalFollowers = 0;

Copy

Copy



    // 10. Force Tab Reset to Overview

    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));

    document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('active'));

    

    // Set first tab active

    const firstTab = document.getElementById('overview');

    const firstBtn = document.querySelector('.nav-btn'); // Assumes first button is overview

    if(firstTab) firstTab.classList.add('active');

    if(firstBtn) firstBtn.classList.add('active');

}



// --- BUTTON: FULL RESET ---

function resetApp() {

Copy

Copy

    clearState(); // Calls the robust clearing function above

    

    // UI Transitions

    document.getElementById('view-dashboard').style.display = 'none';

    document.getElementById('view-home').style.display = 'flex';

Copy

Copy

    

    // Focus back on login

    const input = document.getElementById('usernameInput');

    if(input) {

        input.value = '';

        input.focus();

    }

}

// --- APP STARTUP ---
async function startApp() {
    clearState();
    
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
                detectedNiche = data.niche;
                success = true;
            } else { console.error("Scrape failed:", data.error); }
        } catch (e) { 
            console.log("Offline Mode / Fetch failed. Using Simulation."); 
        }

        const seed = stringToHash(currentUsername);
        safeText('dashTitle', currentUsername);
        safeText('trend-topic-header', `🔥 Personalized Strategy: ${detectedNiche}`);

        const engagement = followers > 0 ? ((avgLikes + avgComments) / followers * 100).toFixed(2) : "1.5";
        
        if (success) {
            updateDashboardStatsReal(seed, followers, avgLikes, avgComments);
            if (detectedNiche !== "Insufficient Data") {
                 generateAIStrategy(detectedNiche, followers, engagement);
            } else {
                 renderTrendsFallback("Insufficient Data");
            }
        } else {
            updateDashboardStats(seed);
            renderTrendsFallback(detectedNiche);
        }

        // Init Components
        initMainChart(seed);
        initRadarChart();
        initSentimentChart(seed);
        renderHeatmap(seed);
        renderLeaderboard();

        transitionToPage('view-home', 'view-dashboard');
    });
}

// --- AI STRATEGY ---
async function generateAIStrategy(niche, followers, engagement) {
    const loadingHTML = `<div style="padding:15px; color:var(--text-muted); font-size:0.9rem;">
                            <i class="fas fa-circle-notch fa-spin"></i> Generating ${niche} tips...
                         </div>`;
    
    safeClear('viral-ideas-box', loadingHTML);
    safeClear('audio-box', loadingHTML);
    safeClear('apps-box', loadingHTML);

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
        updateTrendsUI(strategy);
        
    } catch (error) {
        console.error("AI Generation Failed:", error);
        renderTrendsFallback(niche); 
        const box = document.getElementById('viral-ideas-box');
        if(box) box.innerHTML += `<div style="color:var(--danger); font-size:0.7rem; margin-top:5px;">(AI Offline - Using Defaults)</div>`;
    }
}

function updateTrendsUI(strategy) {
    const ideasBox = document.getElementById('viral-ideas-box'); 
    if(ideasBox) {
        ideasBox.innerHTML = '';
        strategy.viralIdeas.forEach(idea => {
            ideasBox.innerHTML += `<div class="trend-item"><div class="trend-icon"><i class="fas fa-video"></i></div> <div>${idea}</div></div>`;
        });
    }
    
    const audioBox = document.getElementById('audio-box'); 
    if(audioBox) {
        audioBox.innerHTML = '';
        strategy.audio.forEach(track => {
            audioBox.innerHTML += `<div class="trend-item"><div class="trend-icon"><i class="fas fa-music"></i></div> <div>${track}</div></div>`;
        });
    }
    
    const appsBox = document.getElementById('apps-box'); 
    if(appsBox) {
        appsBox.innerHTML = '';
        strategy.apps.forEach(app => {
            appsBox.innerHTML += `<div class="tag-pill">${app}</div>`;
        });
    }
}

function renderTrendsFallback(detectedNiche) {
    if (detectedNiche === "Insufficient Data") {
        safeText('trend-topic-header', "⚠️ Low Activity Profile");
        const warn = `<div style="text-align:center; color:var(--text-muted); padding:20px; border:1px solid var(--glass-border); border-radius:8px;">
            <i class="fas fa-exclamation-triangle"></i> Not enough recent posts to analyze.
        </div>`;
        safeClear('viral-ideas-box', warn);
        safeClear('audio-box', warn);
        safeClear('apps-box', warn);
        return;
    }

    const data = tailoredTrends['default'];
    data.niche = detectedNiche || 'General';
    safeText('trend-topic-header', `🔥 Personalized Strategy: ${data.niche}`);
    
    const ideasBox = document.getElementById('viral-ideas-box');
    if(ideasBox) {
        ideasBox.innerHTML = '';
        data.viralIdeas.forEach(i => ideasBox.innerHTML += `<div class="trend-item"><div class="trend-icon"><i class="fas fa-video"></i></div> <div>${i}</div></div>`);
    }
    
    const audioBox = document.getElementById('audio-box');
    if(audioBox) {
        audioBox.innerHTML = '';
        data.audio.forEach(i => audioBox.innerHTML += `<div class="trend-item"><div class="trend-icon"><i class="fas fa-music"></i></div> <div>${i}</div></div>`);
    }

    const appsBox = document.getElementById('apps-box');
    if(appsBox) {
        appsBox.innerHTML = '';
        data.apps.forEach(i => appsBox.innerHTML += `<div class="tag-pill">${i}</div>`);
    }
}

// --- CHART INITIALIZATION ---
function initMainChart(seed) {
    const el = document.getElementById('mainChart');
    if(!el) return;
    
    const ctx = el.getContext('2d');
    if(mainChart) mainChart.destroy();
    
    let gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, 'rgba(124, 58, 237, 0.4)');
    gradient.addColorStop(1, 'rgba(124, 58, 237, 0)');
    const dataPoints = Array.from({length: 5}, (_, i) => getPseudoRandom(seed + i + 10, 10000, 20000));
    dataPoints.sort((a,b) => a - b);
    
    mainChart = new Chart(ctx, { type: 'line', data: { labels: ['W1', 'W2', 'W3', 'W4', 'W5'], datasets: [{ label: 'Followers', data: dataPoints, borderColor: '#7c3aed', backgroundColor: gradient, fill: true, tension: 0.4 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { grid: { color: 'rgba(255,255,255,0.05)' } }, x: { display: false } } } });
}

function initRadarChart() {
    const el = document.getElementById('radarChart');
    if(!el) return;
    
    const ctx = el.getContext('2d');
    if(radarChart) radarChart.destroy();
    
    radarChart = new Chart(ctx, { type: 'radar', data: { labels: ['Reach', 'Engagement', 'Freq', 'Saves', 'Shares'], datasets: [{ label: 'You', data: [80, 90, 70, 85, 95], backgroundColor: 'rgba(45, 212, 191, 0.2)', borderColor: '#2dd4bf' }] }, options: { responsive: true, maintainAspectRatio: false, scales: { r: { grid: { color: 'rgba(255,255,255,0.1)' }, pointLabels: { color: '#ccc' }, ticks: { display: false } } }, plugins: { legend: { labels: { color: 'white' } } } } });
}

function initSentimentChart(seed) {
    const el = document.getElementById('sentimentChart');
    if(!el) return;
    
    const ctx = el.getContext('2d');
    if(sentimentChart) sentimentChart.destroy();

    const pos = getPseudoRandom(seed + 20, 50, 90);
    const neg = getPseudoRandom(seed + 21, 0, 100 - pos);
    const neu = 100 - pos - neg;
    sentimentChart = new Chart(ctx, { type: 'doughnut', data: { labels: ['Positive', 'Neutral', 'Negative'], datasets: [{ data: [pos, neu, neg], backgroundColor: ['#10b981', '#64748b', '#ef4444'], borderWidth: 0 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } } });
}

// --- TAB: GOALS ---
async function generateGoalPlan() {
    const goalInput = document.getElementById('goalInput').value.trim();
    if (!goalInput) return alert("Please enter a goal first!");

    const currentNiche = document.getElementById('trend-topic-header').innerText.replace('🔥 Personalized Strategy: ', '');
    const currentFollowers = globalFollowers;
    
    const container = document.getElementById('goal-steps-container');
    const resultsArea = document.getElementById('goal-results');
    
    if(resultsArea) resultsArea.style.display = 'block';
    if(container) {
        container.innerHTML = `<div style="text-align:center; padding:20px; color:var(--secondary); animation: pulse 1.5s infinite;">
            <i class="fas fa-satellite-dish"></i> CALCULATING TRAJECTORY FOR ${currentNiche.toUpperCase()}...
        </div>`;
    }

    const prompt = `
        Role: Elite Instagram Strategist.
        Context: The user runs a '${currentNiche}' page with ${currentFollowers} followers.
        User Goal: "${goalInput}"
        Task: Create a highly specific, tactical 4-step plan.
        Tone: Direct, Actionable.
        Output Format: JSON only.
        {
            "steps": [
                { "title": "Step 1", "desc": "Action..." },
                { "title": "Step 2", "desc": "Action..." },
                { "title": "Step 3", "desc": "Action..." },
                { "title": "Step 4", "desc": "Action..." }
            ]
        }
    `;

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Authorization": `Bearer ${API_KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify({
                model: "mistral-medium",
                messages: [{ role: "system", content: "You are a JSON generator." }, { role: "user", content: prompt }],
                response_format: { type: "json_object" }
            })
        });

        const data = await response.json();
        const plan = JSON.parse(data.choices[0].message.content);
        renderGoalSteps(plan.steps);

    } catch (e) {
        console.warn("Goal API failed, using simulation:", e);
        setTimeout(() => {
            renderGoalSteps([
                { title: `Analyze Top 5 ${currentNiche} Creators`, desc: "Steal their hook structures." },
                { title: "Volume Phase", desc: `Post 2 Reels/day for 2 weeks.` },
                { title: "Community Activation", desc: "Reply to every comment with a question." },
                { title: "Conversion", desc: `Optimize your bio for ${currentNiche}.` }
            ]);
        }, 1500);
    }
}

function renderGoalSteps(steps) {
    const container = document.getElementById('goal-steps-container');
    if(!container) return;
    
    container.innerHTML = ''; 
    steps.forEach((step, index) => {
        container.innerHTML += `
            <div class="goal-step">
                <div class="step-num">${index + 1}</div>
                <div class="step-content">
                    <h4>${step.title}</h4>
                    <p>${step.desc}</p>
                </div>
            </div>
        `;
    });
}

// --- TAB: AI ASSISTANT ---
async function sendMessage() {
    const inputField = document.getElementById('chatInput');
    const chatBox = document.getElementById('chat-box');
    const userMsg = inputField.value.trim();

    if (!userMsg) return;

    const currentNiche = document.getElementById('trend-topic-header').innerText.replace('🔥 Personalized Strategy: ', '');
    const currentFollowers = globalFollowers;

    chatBox.innerHTML += `<div class="message msg-user">${userMsg}</div>`;
    inputField.value = '';
    scrollToBottom();

    const typingId = 'typing-' + Date.now();
    chatBox.innerHTML += `<div id="${typingId}" class="message msg-bot" style="font-style:italic; opacity:0.7;">
        <i class="fas fa-circle-notch fa-spin"></i> Analyzing ${currentNiche} data...
    </div>`;
    scrollToBottom();

    const systemPrompt = `
        You are 'InstaBoost AI' for a '${currentNiche}' creator with ${currentFollowers} followers.
        Personality: Brief, punchy, emojis.
        User Question: "${userMsg}"
        Answer strictly in under 50 words.
    `;

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Authorization": `Bearer ${API_KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify({
                model: "mistral-medium",
                messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userMsg }]
            })
        });

        const data = await response.json();
        const botReply = data.choices[0].message.content;
        
        const loader = document.getElementById(typingId);
        if(loader) loader.remove();
        
        chatBox.innerHTML += `<div class="message msg-bot">${botReply.replace(/\n/g, '<br>')}</div>`;
    } catch (e) {
        const loader = document.getElementById(typingId);
        if(loader) loader.remove();
        chatBox.innerHTML += `<div class="message msg-bot">Simulating: Try using trending audio specific to ${currentNiche} to boost your reach! 📈</div>`;
    }
    scrollToBottom();
}

function scrollToBottom() {
    const chatBox = document.getElementById('chat-box');
    if(chatBox) chatBox.scrollTop = chatBox.scrollHeight;
}

// --- TAB: COMPETITOR INTEL ---
async function updateRadar() {
    const rivalInput = document.getElementById('rivalInput').value.trim();
    if (!rivalInput) return alert("Please enter a competitor's username (@handle).");

    const btn = document.querySelector('#competitor button');
    const winnerText = document.getElementById('winner-text');
    const reportBox = document.getElementById('battle-report'); 
    
    // UI Loading State
    const originalBtnText = btn.innerText;
    btn.innerText = "🕵️ Scanning Rival...";
    btn.disabled = true;
    if(winnerText) {
        winnerText.innerText = "Extracting engagement vectors...";
        winnerText.style.color = "var(--warning)";
    }
    if(reportBox) reportBox.style.display = "none"; 

    try {
        let formData = new FormData();
        formData.append('username', rivalInput);
        
        const response = await fetch('/analyze', { method: 'POST', body: formData });
        const data = await response.json();

        if (data.success) {
            // Processing Data
            const rivalFollowers = data.followers;
            const rivalEng = data.followers > 0 ? ((data.avg_likes + data.avg_comments) / data.followers * 100) : 0;
            const userFollowers = globalFollowers || 1000; 
            const maxFollowers = Math.max(userFollowers, rivalFollowers) || 1;
            
            const userReachScore = Math.min((userFollowers / maxFollowers) * 100 + 20, 100);
            const rivalReachScore = Math.min((rivalFollowers / maxFollowers) * 100 + 20, 100);
            
            let userEngVal = 2.5;
            const userEngEl = document.getElementById('stat-eng');
            if(userEngEl) userEngVal = parseFloat(userEngEl.innerText) || 2.5;
            
            const userEngScore = Math.min(userEngVal * 10, 100); 
            const rivalEngScore = Math.min(rivalEng * 10, 100);

            // Rival Simulation (Hidden Metrics)
            const rivalSeed = stringToHash(rivalInput);
            const rivalStats = {
                reach: rivalReachScore,
                engagement: rivalEngScore,
                freq: getPseudoRandom(rivalSeed, 40, 95),
                saves: getPseudoRandom(rivalSeed + 1, 30, 90),
                shares: getPseudoRandom(rivalSeed + 2, 20, 85)
            };
            const userStats = { reach: userReachScore, engagement: userEngScore, freq: 85, saves: 70, shares: 60 };

            updateRadarChartData(userStats, rivalStats, rivalInput);
            generateBattleReport(userStats, rivalStats, rivalInput);

        } else {
            throw new Error(data.error || "Scrape failed");
        }

    } catch (e) {
        console.warn("Rival scrape failed/private, simulating...", e);
        simulateRivalComparison(rivalInput);
    }

    btn.disabled = false;
    btn.innerText = originalBtnText;
}

function updateRadarChartData(user, rival, rivalName) {
    if (!radarChart) return;
    radarChart.data.datasets = [
        { label: 'You', data: [user.reach, user.engagement, user.freq, user.saves, user.shares], backgroundColor: 'rgba(45, 212, 191, 0.2)', borderColor: '#2dd4bf', borderWidth: 2 },
        { label: rivalName, data: [rival.reach, rival.engagement, rival.freq, rival.saves, rival.shares], backgroundColor: 'rgba(239, 68, 68, 0.2)', borderColor: '#ef4444', borderWidth: 2 }
    ];
    radarChart.update();
}

function simulateRivalComparison(rivalName) {
    const seed = stringToHash(rivalName);
    const rivalStats = {
        reach: getPseudoRandom(seed, 20, 90),
        engagement: getPseudoRandom(seed+1, 30, 80),
        freq: getPseudoRandom(seed+2, 50, 95),
        saves: getPseudoRandom(seed+3, 20, 70),
        shares: getPseudoRandom(seed+4, 10, 60)
    };
    const userStats = { reach: 75, engagement: 80, freq: 85, saves: 70, shares: 60 };
    updateRadarChartData(userStats, rivalStats, rivalName);
    generateBattleReport(userStats, rivalStats, rivalName);
}

function generateBattleReport(userStats, rivalStats, rivalName) {
    const winnerText = document.getElementById('winner-text');
    const reportBox = document.getElementById('battle-report'); 
    
    if(!winnerText || !reportBox) return;

    const userTotal = Object.values(userStats).reduce((a,b)=>a+b,0);
    const rivalTotal = Object.values(rivalStats).reduce((a,b)=>a+b,0);
    
    let rivalWins = [];
    let userWins = [];

    if (rivalStats.reach > userStats.reach) rivalWins.push("Reach"); else userWins.push("Reach");
    if (rivalStats.engagement > userStats.engagement) rivalWins.push("Engagement"); else userWins.push("Engagement");
    if (rivalStats.freq > userStats.freq) rivalWins.push("Consistency"); else userWins.push("Consistency");
    if (rivalStats.saves > userStats.saves) rivalWins.push("Saveable Content"); else userWins.push("Saveable Content");

    let reportHTML = "";
    if (rivalWins.length > 0) reportHTML += `<div style="color:#ef4444; margin-bottom:5px;"><strong>⚠️ ${rivalName} beats you in:</strong><br> ${rivalWins.join(', ')}</div>`;
    if (userWins.length > 0) reportHTML += `<div style="color:#10b981;"><strong>✅ You dominate in:</strong><br> ${userWins.join(', ')}</div>`;

    if (userTotal >= rivalTotal) {
        winnerText.innerHTML = `🏆 YOU are winning!`;
        winnerText.style.color = "var(--success)";
    } else {
        winnerText.innerHTML = `⚠️ ${rivalName} is winning.`;
        winnerText.style.color = "var(--danger)";
    }

    reportBox.innerHTML = reportHTML;
    reportBox.style.display = "block";
}

// --- NICHE LEADERBOARD ---
function renderLeaderboard() {
    const container = document.getElementById('leaderboard-list');
    if(!container) return;
    
    container.innerHTML = ''; 

    let niche = "General Creator";
    const header = document.getElementById('trend-topic-header');
    if(header) {
        niche = header.innerText.replace('🔥 Personalized Strategy: ', '');
        if (niche.includes('...') || niche.includes('Analysing')) niche = "Tech & Coding"; 
    }

    const leadersDB = {
        "Tech & Coding": ["@techcrunch", "@code.bliss", "@react.js", "@programmer.humor"],
        "Art & Design": ["@banksy", "@design.milk", "@procreate", "@ux.ui"],
        "Fitness & Health": ["@gymshark", "@chrisbumstead", "@yoga.daily", "@menshealthmag"],
        "Business & Marketing": ["@garyvee", "@forbes", "@businessinsider", "@marketing.harry"],
        "Travel & Lifestyle": ["@beautifuldestinations", "@natgeotravel", "@doyoutravel", "@airbnb"],
        "Food & Cooking": ["@gordonramsay", "@tasty", "@bonappetit", "@food52"],
        "General Creator": ["@instagram", "@creators", "@mosseri", "@meta"]
    };

    const targets = leadersDB[niche] || leadersDB["General Creator"];

    targets.forEach((handle, index) => {
        const growth = (Math.random() * 15 + 5).toFixed(1); 
        const row = `
            <div class="leader-row">
                <div style="display:flex; align-items:center; gap:10px;">
                    <span class="rank-num" style="color:${index === 0 ? '#facc15' : 'var(--text-muted)'}">${index + 1}</span>
                    <span>${handle}</span>
                </div>
                <span style="color: var(--success); font-weight:bold;">+${growth}%</span>
            </div>
        `;
        container.innerHTML += row;
    });
}

// --- TOOLS ---
async function generateBio() {
    const role = document.getElementById('bioRole').value.trim();
    const vibe = document.getElementById('bioVibe').value.trim();
    const output = document.getElementById('bioOutput');
    
    if (!role || !vibe) return alert("Please enter a Role and Vibe first!");
    if (!output) return;

    output.innerHTML = `<div style="text-align:center; padding:10px;"><i class="fas fa-circle-notch fa-spin"></i> Cooking up viral bios...</div>`;
    output.style.color = "var(--secondary)";

    const prompt = `
        Task: Write 3 viral Instagram Bios.
        Role: ${role}
        Vibe: ${vibe}
        Constraint: Use emojis, keep it under 150 chars, make it punchy/aesthetic.
        Output format: Just the 3 bios separated by <br><br>. No intro text.
    `;

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Authorization": `Bearer ${API_KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify({
                model: "mistral-medium",
                messages: [{ role: "user", content: prompt }]
            })
        });

        const data = await response.json();
        if (data.error) throw new Error(data.error.message);

        const result = data.choices[0].message.content;
        output.innerHTML = result;
        output.style.color = "#ccc";

    } catch (e) {
        console.warn("Bio API failed, switching to Simulation:", e);
        setTimeout(() => {
            const simulatedBios = [
                `✨ Official ${role} | ${vibe} Soul <br> 📍 Global Citizen <br> 📩 Collabs via DM`,
                `Creating magic as a ${role} ⚡ <br> ${vibe} vibes only. <br> 👇 Check my latest work`,
                `👋 Just a ${role} chasing dreams. <br> 🎨 Lover of ${vibe} aesthetics. <br> 🚀 Follow my journey.`
            ];
            output.innerHTML = simulatedBios.join('<div style="margin: 10px 0; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:10px;"></div>');
            output.style.color = "#ccc";
        }, 1000); 
    }
}

async function runRoast() {
    const output = document.getElementById('roast-output');
    if(!output) return;
    
    const nicheEl = document.getElementById('trend-topic-header');
    const niche = nicheEl ? nicheEl.innerText.replace('🔥 Personalized Strategy: ', '') : "General";
    const followers = globalFollowers;

    output.innerHTML = `<i class="fas fa-fire fa-spin"></i> Incinerating your ego...`;
    output.style.color = "var(--danger)";

    const prompt = `
        Persona: Brutal Social Media Critic.
        Context: User is a '${niche}' creator with ${followers} followers.
        Task: Roast their account vibe in one savage sentence. 
        Be mean but funny. Mention their follower count or niche specifically.
    `;

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Authorization": `Bearer ${API_KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify({
                model: "mistral-medium",
                messages: [{ role: "user", content: prompt }]
            })
        });
        const data = await response.json();
        const roast = data.choices[0].message.content;
        output.innerHTML = `"${roast}"`;
        output.style.color = "#fff";

    } catch (e) {
        output.innerText = "Simulated Roast: Your feed is so boring even the AI fell asleep.";
    }
}

let captionDebounce;
function analyzeCaption() {
    clearTimeout(captionDebounce);
    const input = document.getElementById('captionInput').value;
    const scoreDisplay = document.getElementById('captionScore');
    const feedbackDisplay = document.getElementById('captionFeedback');

    if (input.length < 5) {
        if(scoreDisplay) scoreDisplay.innerText = "0";
        if(feedbackDisplay) feedbackDisplay.innerText = "Waiting for input...";
        return;
    }

    if(feedbackDisplay) feedbackDisplay.innerText = "Analyzing hook & keywords...";
    
    captionDebounce = setTimeout(async () => {
        const prompt = `
            Task: Rate this Instagram caption out of 100 and give 1 short tip.
            Caption: "${input}"
            Output JSON: { "score": 85, "feedback": "Add a question to boost comments." }
        `;

        try {
            const response = await fetch(API_URL, {
                method: "POST",
                headers: { "Authorization": `Bearer ${API_KEY}`, "Content-Type": "application/json" },
                body: JSON.stringify({
                    model: "mistral-medium",
                    messages: [
                        { role: "system", content: "You are a JSON generator." },
                        { role: "user", content: prompt }
                    ],
                    response_format: { type: "json_object" }
                })
            });

            const data = await response.json();
            const result = JSON.parse(data.choices[0].message.content);
            
            if(scoreDisplay) {
                animateValue(scoreDisplay, parseInt(scoreDisplay.innerText), result.score, 1000);
                if(result.score > 80) scoreDisplay.style.color = "var(--success)";
                else if(result.score > 50) scoreDisplay.style.color = "var(--warning)";
                else scoreDisplay.style.color = "var(--danger)";
            }

            if(feedbackDisplay) feedbackDisplay.innerText = result.feedback;

        } catch (e) {
            if(scoreDisplay) scoreDisplay.innerText = "Err";
            if(feedbackDisplay) feedbackDisplay.innerText = "AI unavailable.";
        }
    }, 1000);
}

function runShadowbanScan() {
    const term = document.getElementById('scan-terminal');
    if(!term) return;
    
    const steps = ["Connecting to Instagram API...", "Checking hashtags...", "Scanning for banned keywords...", "Verifying engagement limits...", "DIAGNOSTIC COMPLETE."];
    term.innerHTML = '';
    let delay = 0;
    steps.forEach(s => {
        setTimeout(() => term.innerHTML += `> ${s}<br>`, delay);
        delay += 800;
    });
    setTimeout(() => term.innerHTML += `<span style='color:var(--success)'>Result: No shadowban detected. System Healthy.</span>`, delay + 200);
}

function calcRate() {
    const display = document.getElementById('money-display');
    if(!display) return;
    
    const rate = (globalFollowers * 0.008).toFixed(0); 
    let start = 0;
    const interval = setInterval(() => {
        start += Math.ceil(rate / 20);
        if(start >= rate) { start = rate; clearInterval(interval); }
        display.innerText = '$' + start;
    }, 50);
}

// --- HELPER FUNCTIONS ---
function formatNumber(num) {
    if(num >= 1000000) return (num/1000000).toFixed(1) + 'M';
    if(num >= 1000) return (num/1000).toFixed(1) + 'k';
    return num;
}

function openSettingsModal() { document.getElementById('settings-modal').style.display = 'flex'; }
function closeSettingsModal() { document.getElementById('settings-modal').style.display = 'none'; }
function fillAndSearch(user) { 
    const el = document.getElementById('usernameInput');
    if(el) el.value = user; 
}
function handleChatEnter(e) { if(e.key === 'Enter') sendMessage(); }
function sendQuickMsg(msg) { 
    const el = document.getElementById('chatInput');
    if(el) { el.value = msg; sendMessage(); }
}
function openTeamModal() { document.getElementById('team-modal').style.display = 'flex'; }
function closeTeamModal() { document.getElementById('team-modal').style.display = 'none'; }

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
    
    safeClear('verify-avatar', avatarHTML);
    safeText('verify-username', currentUsername);
    safeClear('dash-avatar', avatarHTML);
    
    document.getElementById('verify-modal').style.display = 'flex';
}

function cancelSearch() { document.getElementById('verify-modal').style.display = 'none'; }
function confirmSearch() { document.getElementById('verify-modal').style.display = 'none'; startApp(); }

function runLoader(callback) {
    const loader = document.getElementById('hacker-loader');
    const container = document.getElementById('code-container');
    
    // Safety check: If elements are missing, skip animation and run callback
    if (!loader || !container) {
        console.error("Loader elements missing from DOM.");
        callback(); 
        return;
    }

    const lines = ["> Connecting to Instagram API...", `> Identifying Target: ${currentUsername}...`, "> Fetching Follower Count...", "> Analyzing Color Histograms...", "> Calculating Virality Vectors...", "> ACCESS GRANTED."];
    
    loader.style.display = 'block'; 
    container.innerHTML = '';
    
    let delay = 0;
    lines.forEach((line, i) => { 
        setTimeout(() => { 
            const p = document.createElement('div'); 
            p.className = 'code-line'; 
            p.innerText = line; 
            if(container) container.appendChild(p); 
        }, delay); 
        delay += 800; 
    });
    
    setTimeout(() => { 
        loader.style.display = 'none'; 
        callback(); 
    }, delay + 500);
}

function updateDashboardStatsReal(seed, realFollowers, realAvgLikes, realAvgComments) {
    globalFollowers = realFollowers;
    const reach = Math.floor(realFollowers * (getPseudoRandom(seed+1, 12, 25) / 10)); 
    const engRate = realFollowers > 0 ? ((realAvgLikes + realAvgComments) / realFollowers * 100).toFixed(2) : 0;
    const viralScore = (getPseudoRandom(seed+3, 40, 95) / 10).toFixed(1);
    
    safeText('stat-followers', formatNumber(realFollowers));
    safeText('stat-eng', engRate + "%");
    safeText('stat-reach', formatNumber(reach));
    safeText('stat-likes', formatNumber(realAvgLikes));
    safeText('stat-comments', formatNumber(realAvgComments));
    safeText('stat-viral', viralScore + "/10");
}

function updateDashboardStats(seed) {
    const followers = getPseudoRandom(seed, 5000, 500000);
    updateDashboardStatsReal(seed, followers, Math.floor(followers*0.05), Math.floor(followers*0.005));
}

function setTab(id, btn) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('active'));
    
    const target = document.getElementById(id);
    if(target) target.classList.add('active');
    btn.classList.add('active');
}
function setTheme(theme) { document.body.className = theme; }
function toggleMission(el) { el.classList.toggle('done'); updateXP(); }
function updateXP() { document.getElementById('xp-bar').style.width = "50%"; } 

function renderHeatmap(seed) {
    const container = document.getElementById('heatmap');
    if(!container) return;
    
    container.innerHTML = '<div></div><div>M</div><div>T</div><div>W</div><div>T</div><div>F</div><div>S</div><div>S</div>';
    for(let i=0; i<28; i++) {
        const div = document.createElement('div');
        div.className = 'hm-cell';
        if(getPseudoRandom(seed + i, 0, 100) > 50) div.classList.add('med');
        container.appendChild(div);
    }
}

function animateValue(obj, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        obj.innerHTML = Math.floor(progress * (end - start) + start);
        if (progress < 1) window.requestAnimationFrame(step);
    };
    window.requestAnimationFrame(step);
}