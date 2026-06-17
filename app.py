from flask import Flask, jsonify, render_template
import urllib.request
import xml.etree.ElementTree as ET
from bs4 import BeautifulSoup
import re
import os

app = Flask(__name__, static_folder='static', template_folder='templates')

FEED_URL = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"

def fetch_and_parse_release_notes():
    req = urllib.request.Request(
        FEED_URL, 
        headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AntigravityReleaseNotesTracker/1.0'}
    )
    with urllib.request.urlopen(req, timeout=15) as response:
        xml_data = response.read()
    
    root = ET.fromstring(xml_data)
    
    # Atom feed namespace
    ns = {'atom': 'http://www.w3.org/2005/Atom'}
    
    entries = []
    item_id = 0
    
    for entry in root.findall('atom:entry', ns):
        title_elem = entry.find('atom:title', ns)
        updated_elem = entry.find('atom:updated', ns)
        link_elem = entry.find('atom:link', ns)
        content_elem = entry.find('atom:content', ns)
        
        date_str = title_elem.text.strip() if title_elem is not None else "Unknown Date"
        updated_str = updated_elem.text.strip() if updated_elem is not None else ""
        link_href = link_elem.attrib.get('href', '') if link_elem is not None else ""
        content_html = content_elem.text if content_elem is not None else ""
        
        soup = BeautifulSoup(content_html, 'html.parser')
        headers = soup.find_all('h3')
        
        if not headers:
            # Fallback if there are no h3 tags: treat the whole content as one Update
            text_content = soup.get_text().strip()
            text_content = re.sub(r'\s+', ' ', text_content)
            
            # Extract links for Twitter reference
            links_in_content = [a.get('href') for a in soup.find_all('a') if a.get('href')]
            
            entries.append({
                "id": f"update-{item_id}",
                "type": "Update",
                "date": date_str,
                "updated_iso": updated_str,
                "html": str(soup),
                "text": text_content,
                "link": link_href,
                "links_in_content": links_in_content
            })
            item_id += 1
        else:
            # Parse updates grouped by each h3 header
            for h3 in headers:
                item_type = h3.get_text().strip()
                item_html_parts = []
                item_text_parts = []
                
                # Iterate through siblings until the next h3 tag
                sibling = h3.next_sibling
                while sibling and sibling.name != 'h3':
                    if sibling.name:  # Tag node
                        item_html_parts.append(str(sibling))
                        item_text_parts.append(sibling.get_text())
                    elif isinstance(sibling, str) and sibling.strip():  # Text node
                        item_html_parts.append(sibling)
                        item_text_parts.append(sibling)
                    sibling = sibling.next_sibling
                
                html_content = "".join(item_html_parts).strip()
                text_content = " ".join(item_text_parts).strip()
                text_content = re.sub(r'\s+', ' ', text_content)
                
                # Extract links from this specific chunk
                chunk_soup = BeautifulSoup(html_content, 'html.parser')
                links_in_content = [a.get('href') for a in chunk_soup.find_all('a') if a.get('href')]
                
                # Make type uniform (e.g. capitalize)
                item_type = item_type.capitalize()
                
                entries.append({
                    "id": f"update-{item_id}",
                    "type": item_type,
                    "date": date_str,
                    "updated_iso": updated_str,
                    "html": html_content,
                    "text": text_content,
                    "link": link_href,
                    "links_in_content": links_in_content
                })
                item_id += 1
                
    return entries

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/release-notes')
def get_release_notes():
    try:
        notes = fetch_and_parse_release_notes()
        return jsonify(notes)
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"Failed to fetch or parse release notes: {str(e)}"}), 500

if __name__ == '__main__':
    # Run the app locally
    app.run(host='127.0.0.1', port=5000, debug=True)
