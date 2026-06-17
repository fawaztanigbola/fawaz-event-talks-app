# BigQuery Release Notes Dashboard & X (Twitter) Broadcaster

A premium, modern web dashboard built with a **Python Flask** backend and a **vanilla HTML/CSS/JavaScript** frontend. It automatically parses the live Google Cloud BigQuery release notes Atom feed, formats the individual release items, and allows you to instantly draft and publish customized tweets with correct character counters and one-click X.com redirection.

---

## 🚀 Key Features

* **Granular Feed Decomposition:** Automatically splits compound daily releases (grouped under header boundaries in the XML feed) into distinct, category-mapped card records.
* **Modern Glowing Dark Theme:** Aesthetic glassmorphic dashboard styled with responsive grids, interactive element hover effects, and category-accented glows.
* **Smart Search & Filters:** Perform real-time full-text searches across updates or isolate entries by category (Features, Announcements, Deprecated, and others).
* **X/Twitter Broadcasting Composer:**
  * **Precision URL Metrics:** Auto-counts URLs as exactly 23 characters (conforming to X's real-time parser).
  * **Intelligent Truncation:** Truncates description texts to fit within the 280-character limit while preserving custom hashtags (`#BigQuery #GoogleCloud`) and the reference link.
  * **SVG Character Counter:** Dynamic circular progress ring that changes colors (Blue ➔ Amber ➔ Red) as you reach character limits.
  * **Actions:** Quick-copy text to your clipboard or redirect to `x.com` with pre-filled intent strings.
* **Feed Synchronization Monitor:** Showcases total items cached, connection status, and last refreshed timestamp.
* **High-Fidelity Skeleton Screen Loader:** Renders CSS animation shimmers during background requests for smoother transitions.

---

## 🛠️ Tech Stack

* **Backend:** Python 3, Flask, BeautifulSoup4 (HTML parser), ElementTree (XML parser), Urllib
* **Frontend:** Vanilla HTML5, Vanilla CSS3 (custom variables, keyframes, transitions), Vanilla JavaScript (ES6)
* **Icons:** Lucide Icons (CDN)
* **Fonts:** Google Fonts (Plus Jakarta Sans, Inter, JetBrains Mono)

---

## 📂 Project Structure

```text
bq_release_notes/
├── app.py                  # Flask backend server & XML feed scraper/parser
├── templates/
│   └── index.html          # Semantic HTML template container
├── static/
│   ├── css/
│   │   └── style.css       # Layout styles, glassmorphism, & animations
│   └── js/
│       └── app.js          # State handling, filtering, & Twitter formatting
├── .gitignore              # Files/folders excluded from Git tracking
└── README.md               # Project overview & running instructions
```

---

## ⚙️ Setup & Local Installation

### Prerequisites
Make sure you have **Python 3** installed on your system.

### 1. Clone the repository
```bash
git clone https://github.com/fawaztanigbola/fawaz-event-talks-app.git
cd fawaz-event-talks-app
```

### 2. Install dependencies
Install Flask and BeautifulSoup4 using pip:
```bash
pip install flask beautifulsoup4
```

### 3. Run the application
Run the Flask server:
```bash
python app.py
```

### 4. Open in browser
Navigate to the following URL in your web browser:
```text
http://127.0.0.1:5000
```

---

## 📜 License & Authors
Developed by **Fawaz Tanigbola** with the assistance of pair programmer **Antigravity**. Feel free to submit pull requests or open issues to contribute to this repository.
