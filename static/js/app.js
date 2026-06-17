// --- APPLICATION STATE ---
let allNotes = [];
let filteredNotes = [];
let activeFilter = 'all';
let searchQuery = '';
let selectedNoteId = null;

// --- DOM ELEMENTS ---
const btnRefresh = document.getElementById('btn-refresh');
const iconRefresh = document.getElementById('icon-refresh');
const searchInput = document.getElementById('search-input');
const searchClearBtn = document.getElementById('search-clear-btn');
const filterChips = document.getElementById('filter-chips');
const notesContainer = document.getElementById('notes-container');
const skeletonLoader = document.getElementById('skeleton-loader');
const emptyState = document.getElementById('empty-state');
const resultsHeading = document.getElementById('results-heading');
const resultsCountText = document.getElementById('results-count-text');
const btnExportCsv = document.getElementById('btn-export-csv');

// Dashboard Stats
const statsTotal = document.getElementById('stats-total');
const statsLastUpdated = document.getElementById('stats-last-updated');
const statusPulse = document.getElementById('status-pulse');
const statusText = document.getElementById('status-text');
const countAll = document.getElementById('count-all');
const countFeature = document.getElementById('count-feature');
const countAnnouncement = document.getElementById('count-announcement');
const countDeprecated = document.getElementById('count-deprecated');
const countOther = document.getElementById('count-other');

// Modal Elements
const tweetModal = document.getElementById('tweet-modal');
const btnCloseModal = document.getElementById('btn-close-modal');
const modalPreviewBadge = document.getElementById('modal-preview-badge');
const modalPreviewDate = document.getElementById('modal-preview-date');
const modalPreviewText = document.getElementById('modal-preview-text');
const tweetTextarea = document.getElementById('tweet-textarea');
const charCounter = document.getElementById('char-counter');
const progressIndicator = document.getElementById('progress-indicator');
const btnCopyTweet = document.getElementById('btn-copy-tweet');
const btnPublishTweet = document.getElementById('btn-publish-tweet');

// Progress Ring Configuration
const CIRCLE_RADIUS = 12;
const CIRCLE_CIRCUMFERENCE = 2 * Math.PI * CIRCLE_RADIUS;

// Initialize Progress Ring Stroke
if (progressIndicator) {
    progressIndicator.style.strokeDasharray = `${CIRCLE_CIRCUMFERENCE} ${CIRCLE_CIRCUMFERENCE}`;
    progressIndicator.style.strokeDashoffset = CIRCLE_CIRCUMFERENCE;
}

// --- INIT APP ---
document.addEventListener('DOMContentLoaded', () => {
    // Initial fetch
    fetchNotes();
    
    // Bind Event Listeners
    btnRefresh.addEventListener('click', fetchNotes);
    if (btnExportCsv) {
        btnExportCsv.addEventListener('click', exportToCsv);
    }
    
    // Search inputs
    searchInput.addEventListener('input', handleSearchInput);
    searchClearBtn.addEventListener('click', clearSearch);
    
    // Filter chips
    setupFilters();
    
    // Modal controls
    btnCloseModal.addEventListener('click', closeComposer);
    btnCopyTweet.addEventListener('click', copyTweetToClipboard);
    btnPublishTweet.addEventListener('click', publishTweet);
    tweetTextarea.addEventListener('input', handleTweetInput);
    
    // Close modal on clicking overlay
    tweetModal.addEventListener('click', (e) => {
        if (e.target === tweetModal) closeComposer();
    });
    
    // Close modal on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && tweetModal.style.display !== 'none') {
            closeComposer();
        }
    });
    
    // Initialize Lucide Icons
    lucide.createIcons();
});

// --- FETCH DATA ---
async function fetchNotes() {
    // Set loading UI
    btnRefresh.classList.add('loading');
    btnRefresh.disabled = true;
    skeletonLoader.style.display = 'grid';
    notesContainer.style.display = 'none';
    emptyState.style.display = 'none';
    
    statusPulse.className = 'pulse-indicator status-ok';
    statusText.textContent = 'Syncing...';
    
    try {
        const response = await fetch('/api/release-notes');
        if (!response.ok) {
            throw new Error(`Server returned HTTP ${response.status}`);
        }
        
        allNotes = await response.json();
        
        // Update stats and UI
        updateStats();
        renderNotes();
        
        // Success status
        statusPulse.className = 'pulse-indicator status-ok';
        statusText.textContent = 'Synced';
        statsLastUpdated.textContent = new Date().toLocaleTimeString();
    } catch (error) {
        console.error('Error syncing release notes:', error);
        
        // Show error status
        statusPulse.className = 'pulse-indicator status-error';
        statusText.textContent = 'Sync Error';
        
        // If we don't have notes, show empty state
        if (allNotes.length === 0) {
            emptyState.style.display = 'flex';
            emptyState.querySelector('h3').textContent = 'Sync Failed';
            emptyState.querySelector('p').textContent = 'Could not retrieve release notes. Please check your network connection and try again.';
        }
    } finally {
        btnRefresh.classList.remove('loading');
        btnRefresh.disabled = false;
        skeletonLoader.style.display = 'none';
    }
}

// --- FILTER & RENDER PROCESS ---
function setupFilters() {
    const chips = filterChips.querySelectorAll('.filter-chip');
    chips.forEach(chip => {
        chip.addEventListener('click', () => {
            chips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            activeFilter = chip.getAttribute('data-filter');
            renderNotes();
        });
    });
}

function handleSearchInput() {
    searchQuery = searchInput.value.toLowerCase().trim();
    if (searchQuery.length > 0) {
        searchClearBtn.style.display = 'flex';
    } else {
        searchClearBtn.style.display = 'none';
    }
    renderNotes();
}

function clearSearch() {
    searchInput.value = '';
    searchClearBtn.style.display = 'none';
    searchQuery = '';
    renderNotes();
    searchInput.focus();
}

function updateStats() {
    const total = allNotes.length;
    statsTotal.textContent = total;
    countAll.textContent = total;
    
    let features = 0;
    let announcements = 0;
    let deprecated = 0;
    let others = 0;
    
    allNotes.forEach(note => {
        const type = note.type.toLowerCase();
        if (type.includes('feature')) features++;
        else if (type.includes('announcement')) announcements++;
        else if (type.includes('deprecat')) deprecated++;
        else others++;
    });
    
    countFeature.textContent = features;
    countAnnouncement.textContent = announcements;
    countDeprecated.textContent = deprecated;
    countOther.textContent = others;
}

function renderNotes() {
    notesContainer.innerHTML = '';
    
    // Filter logic
    filteredNotes = allNotes.filter(note => {
        // Category Filter
        const type = note.type.toLowerCase();
        let matchesCategory = false;
        
        if (activeFilter === 'all') {
            matchesCategory = true;
        } else if (activeFilter === 'feature') {
            matchesCategory = type.includes('feature');
        } else if (activeFilter === 'announcement') {
            matchesCategory = type.includes('announcement');
        } else if (activeFilter === 'deprecated') {
            matchesCategory = type.includes('deprecat');
        } else if (activeFilter === 'other') {
            matchesCategory = !type.includes('feature') && !type.includes('announcement') && !type.includes('deprecat');
        }
        
        // Search Filter
        let matchesSearch = true;
        if (searchQuery) {
            const inText = note.text.toLowerCase().includes(searchQuery);
            const inType = note.type.toLowerCase().includes(searchQuery);
            const inDate = note.date.toLowerCase().includes(searchQuery);
            matchesSearch = inText || inType || inDate;
        }
        
        return matchesCategory && matchesSearch;
    });
    
    // Update Heading and Count Info
    resultsCountText.textContent = `Showing ${filteredNotes.length} update${filteredNotes.length === 1 ? '' : 's'}`;
    
    const filterNames = {
        'all': 'All Releases',
        'feature': 'Feature Releases',
        'announcement': 'Announcements',
        'deprecated': 'Deprecated Features',
        'other': 'Other Releases'
    };
    resultsHeading.textContent = filterNames[activeFilter] || 'Releases';
    
    if (filteredNotes.length === 0) {
        notesContainer.style.display = 'none';
        emptyState.style.display = 'flex';
        return;
    }
    
    emptyState.style.display = 'none';
    notesContainer.style.display = 'grid';
    
    // Build and append cards
    filteredNotes.forEach(note => {
        const card = document.createElement('article');
        
        // Class mapping for card left-accent lines
        const typeLower = note.type.toLowerCase();
        let cardClass = 'card-other';
        let badgeClass = 'badge-other';
        
        if (typeLower.includes('feature')) {
            cardClass = 'card-feature';
            badgeClass = 'badge-feature';
        } else if (typeLower.includes('announcement')) {
            cardClass = 'card-announcement';
            badgeClass = 'badge-announcement';
        } else if (typeLower.includes('deprecat')) {
            cardClass = 'card-deprecated';
            badgeClass = 'badge-deprecated';
        }
        
        card.className = `card ${cardClass}`;
        card.id = note.id;
        
        if (selectedNoteId === note.id) {
            card.classList.add('card-selected');
        }
        
        // Make the body HTML safe and set inside
        card.innerHTML = `
            <div class="card-header">
                <span class="badge ${badgeClass}">${note.type}</span>
                <span class="card-date">
                    <i data-lucide="calendar"></i>
                    <span>${note.date}</span>
                </span>
            </div>
            <div class="card-body">
                ${note.html}
            </div>
            <div class="card-footer">
                <a href="${note.link}" target="_blank" rel="noopener noreferrer" class="source-link" onclick="event.stopPropagation();">
                    <span>Release Doc</span>
                    <i data-lucide="external-link"></i>
                </a>
                
                <div style="display: flex; gap: 8px; align-items: center;">
                    <button class="btn-copy-card" onclick="event.stopPropagation(); handleCopyCardClick('${note.id}')" title="Copy to Clipboard">
                        <i data-lucide="copy"></i>
                        <span>Copy</span>
                    </button>
                    <button class="btn-tweet-card" onclick="event.stopPropagation(); handleTweetClick('${note.id}')">
                        <i data-lucide="twitter"></i>
                        <span>Tweet</span>
                    </button>
                    <div class="card-selector">
                        <i data-lucide="check"></i>
                    </div>
                </div>
            </div>
        `;
        
        // Card click selection toggler
        card.addEventListener('click', () => {
            selectCard(note.id);
        });
        
        notesContainer.appendChild(card);
    });
    
    lucide.createIcons();
}

function selectCard(noteId) {
    const previousSelected = document.getElementById(selectedNoteId);
    if (previousSelected) {
        previousSelected.classList.remove('card-selected');
    }
    
    if (selectedNoteId === noteId) {
        // Toggle off
        selectedNoteId = null;
    } else {
        selectedNoteId = noteId;
        const currentSelected = document.getElementById(selectedNoteId);
        if (currentSelected) {
            currentSelected.classList.add('card-selected');
        }
    }
}

// --- TWEET COMPOSER LOGIC ---
function handleTweetClick(noteId) {
    const note = allNotes.find(n => n.id === noteId);
    if (note) {
        openComposer(note);
    }
}

function openComposer(note) {
    // Populate Preview
    modalPreviewBadge.textContent = note.type;
    modalPreviewBadge.className = 'badge';
    
    const typeLower = note.type.toLowerCase();
    if (typeLower.includes('feature')) modalPreviewBadge.classList.add('badge-feature');
    else if (typeLower.includes('announcement')) modalPreviewBadge.classList.add('badge-announcement');
    else if (typeLower.includes('deprecat')) modalPreviewBadge.classList.add('badge-deprecated');
    else modalPreviewBadge.classList.add('badge-other');
    
    modalPreviewDate.textContent = note.date;
    modalPreviewText.textContent = note.text;
    
    // Generate beautiful auto-draft text
    const defaultTweet = generateDefaultTweet(note);
    tweetTextarea.value = defaultTweet;
    
    // Trigger calculation
    handleTweetInput();
    
    // Display Modal
    tweetModal.style.display = 'flex';
    tweetTextarea.focus();
}

function closeComposer() {
    tweetModal.style.display = 'none';
}

/**
 * Generates a default tweet text that is pre-truncated to fit standard Twitter length limitations.
 * Under X/Twitter guidelines, URLs are counted as exactly 23 characters.
 */
function generateDefaultTweet(note) {
    const prefix = `📢 BigQuery ${note.type} (${note.date}): `;
    const suffix = `\n\n🔗 ${note.link}\n#BigQuery #GoogleCloud`;
    
    // X URL weight is 23 characters
    const urlLengthInTwitter = 23;
    
    // Calculate total layout length excluding the description
    // (Prefix length) + (Suffix length without actual URL + 23)
    const suffixForLength = `\n\n🔗 ${'x'.repeat(urlLengthInTwitter)}\n#BigQuery #GoogleCloud`;
    const staticLength = prefix.length + suffixForLength.length;
    
    const maxDescLength = 280 - staticLength - 4; // 4 extra buffer for ' ...'
    
    let description = note.text;
    if (description.length > maxDescLength) {
        // Truncate at nearest word
        let truncated = description.slice(0, maxDescLength);
        const lastSpace = truncated.lastIndexOf(' ');
        if (lastSpace > 0) {
            truncated = truncated.slice(0, lastSpace);
        }
        description = truncated + ' ...';
    }
    
    return `${prefix}${description}${suffix}`;
}

/**
 * Calculates character length based on X/Twitter specs (URLs = 23 chars).
 */
function calculateTwitterLength(text) {
    // Regex matching URLs
    const urlRegex = /https?:\/\/[^\s]+/g;
    let length = text.length;
    
    const urls = text.match(urlRegex) || [];
    urls.forEach(url => {
        // Subtract actual length and add standard 23 chars
        length = length - url.length + 23;
    });
    
    return length;
}

function handleTweetInput() {
    const text = tweetTextarea.value;
    const length = calculateTwitterLength(text);
    const remaining = 280 - length;
    
    // Update counter text
    charCounter.textContent = remaining;
    
    // Update Progress Ring
    const percentage = Math.min(Math.max((length / 280) * 100, 0), 100);
    const offset = CIRCLE_CIRCUMFERENCE - (percentage / 100) * CIRCLE_CIRCUMFERENCE;
    progressIndicator.style.strokeDashoffset = offset;
    
    // Classes and visual cues based on limits
    charCounter.className = '';
    progressIndicator.style.stroke = 'var(--color-tweet)';
    btnPublishTweet.disabled = false;
    
    if (remaining <= 20 && remaining > 0) {
        charCounter.classList.add('char-warning');
        progressIndicator.style.stroke = 'var(--color-announcement)';
    } else if (remaining <= 0) {
        charCounter.classList.add('char-danger');
        progressIndicator.style.stroke = 'var(--color-deprecated)';
        if (remaining < 0) {
            btnPublishTweet.disabled = true; // Exceeded limit
        }
    }
}

function copyTweetToClipboard() {
    const text = tweetTextarea.value;
    navigator.clipboard.writeText(text).then(() => {
        const btnText = btnCopyTweet.querySelector('span');
        const originalText = btnText.textContent;
        
        btnText.textContent = 'Copied!';
        btnCopyTweet.style.borderColor = 'var(--color-feature)';
        btnCopyTweet.style.color = 'var(--color-feature)';
        
        setTimeout(() => {
            btnText.textContent = originalText;
            btnCopyTweet.style.borderColor = '';
            btnCopyTweet.style.color = '';
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy text: ', err);
    });
}

function publishTweet() {
    const text = tweetTextarea.value;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(twitterUrl, '_blank', 'noopener,noreferrer');
    closeComposer();
}

function handleCopyCardClick(noteId) {
    const note = allNotes.find(n => n.id === noteId);
    if (!note) return;
    
    const copyText = `📢 BigQuery ${note.type} (${note.date}):\n${note.text}\n\n🔗 Read more: ${note.link}`;
    navigator.clipboard.writeText(copyText).then(() => {
        const cardEl = document.getElementById(noteId);
        if (cardEl) {
            const btn = cardEl.querySelector('.btn-copy-card');
            const btnSpan = btn.querySelector('span');
            const originalText = btnSpan.textContent;
            
            btnSpan.textContent = 'Copied!';
            btn.style.borderColor = 'var(--color-feature)';
            btn.style.color = 'var(--color-feature)';
            
            setTimeout(() => {
                btnSpan.textContent = originalText;
                btn.style.borderColor = '';
                btn.style.color = '';
            }, 2000);
        }
    }).catch(err => {
        console.error('Failed to copy card text: ', err);
    });
}

function exportToCsv() {
    if (filteredNotes.length === 0) {
        alert("No release notes to export.");
        return;
    }
    
    let csvRows = [];
    csvRows.push(['ID', 'Date', 'Type', 'Description', 'Link'].map(h => `"${h.replace(/"/g, '""')}"`).join(','));
    
    filteredNotes.forEach(note => {
        const row = [
            note.id,
            note.date,
            note.type,
            note.text,
            note.link
        ];
        csvRows.push(row.map(val => {
            const escaped = ('' + val).replace(/"/g, '""');
            return `"${escaped}"`;
        }).join(','));
    });
    
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    
    const dateStr = new Date().toISOString().slice(0, 10);
    const filterName = activeFilter.replace(/\s+/g, '_').toLowerCase();
    
    link.setAttribute("href", url);
    link.setAttribute("download", `bigquery_release_notes_${filterName}_${dateStr}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
