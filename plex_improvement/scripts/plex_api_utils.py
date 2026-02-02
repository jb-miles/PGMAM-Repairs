#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Plex API Utilities
Python 2.7 Compatible
"""

from __future__ import print_function
import requests
import re
import xml.etree.ElementTree as ET
from pathlib import Path

def get_plex_token():
    """
    Get Plex token from preferences or user input
    
    Returns:
        Plex API token string
    """
    # Try to read from Plex preferences
    prefs_path = Path.home() / "Library/Application Support/Plex Media Server/Preferences.xml"
    
    if prefs_path.exists():
        with open(prefs_path, 'r') as f:
            content = f.read()
            match = re.search(r'PlexOnlineToken="([^"]+)"', content)
            if match:
                return match.group(1)
    
    # If not found, ask user
    print("\nPlex token not found automatically.")
    print("To get your token:")
    print("  1. Open Plex Web (http://localhost:32400/web)")
    print("  2. Play any item and press Ctrl+Shift+I (or Cmd+Option+I on Mac)")
    print("  3. Go to Console tab")
    print("  4. Type: localStorage.getItem('myPlexAccessToken')")
    print("  5. Copy the token (without quotes)")
    
    return raw_input("\nEnter Plex token: ").strip()

def get_library_sections(plex_url, token):
    """
    Get all library sections
    
    Args:
        plex_url: Plex server URL
        token: Plex API token
        
    Returns:
        List of library sections
    """
    url = "{}/library/sections".format(plex_url)
    headers = {"X-Plex-Token": token}
    response = requests.get(url, headers=headers)
    
    if response.status_code != 200:
        raise Exception("Failed to get library sections: {}".format(response.status_code))
    
    root = ET.fromstring(response.content)
    
    sections = []
    for directory in root.findall('.//Directory'):
        sections.append({
            'key': directory.get('key'),
            'title': directory.get('title'),
            'type': directory.get('type')
        })
    
    return sections

def get_library_items(plex_url, token, section_key):
    """
    Get all items in a library section
    
    Args:
        plex_url: Plex server URL
        token: Plex API token
        section_key: Library section key
        
    Returns:
        List of library items
    """
    url = "{}/library/sections/{}/all".format(plex_url, section_key)
    headers = {"X-Plex-Token": token}
    response = requests.get(url, headers=headers)
    
    if response.status_code != 200:
        raise Exception("Failed to get library items: {}".format(response.status_code))
    
    root = ET.fromstring(response.content)
    
    items = []
    for video in root.findall('.//Video'):
        items.append({
            'key': video.get('key'),
            'title': video.get('title'),
            'ratingKey': video.get('ratingKey')
        })
    
    return items

def refresh_metadata(plex_url, token, rating_key):
    """
    Trigger metadata refresh for a specific item
    
    Args:
        plex_url: Plex server URL
        token: Plex API token
        ratingKey: Item rating key
        
    Returns:
        True if successful, False otherwise
    """
    url = "{}/library/metadata/{}/refresh".format(plex_url, rating_key)
    headers = {"X-Plex-Token": token}
    
    params = {'force': '1'}
    
    response = requests.put(url, headers=headers, params=params)
    
    return response.status_code == 200

def test_plex_connection(plex_url, token):
    """
    Test if Plex API is accessible
    
    Args:
        plex_url: Plex server URL
        token: Plex API token
        
    Returns:
        True if accessible, False otherwise
    """
    try:
        response = requests.get(plex_url, headers={"X-Plex-Token": token}, timeout=5)
        return response.status_code == 200
    except:
        return False

def main():
    import argparse
    parser = argparse.ArgumentParser(description='Plex API utilities')
    parser.add_argument('--token', action='store_true', help='Get Plex token')
    parser.add_argument('--sections', help='List library sections (requires --url and --token)')
    parser.add_argument('--items', help='List items in section (requires --url, --token, and --section)')
    parser.add_argument('--refresh', help='Refresh metadata for item (requires --url, --token, and --rating-key)')
    parser.add_argument('--url', default='http://127.0.0.1:32400', help='Plex server URL')
    parser.add_argument('--section', help='Library section key')
    parser.add_argument('--rating-key', help='Item rating key')
    args = parser.parse_args()
    
    if args.token:
        token = get_plex_token()
        print("Plex Token: {}".format(token))
    elif args.sections:
        token = get_plex_token()
        sections = get_library_sections(args.url, token)
        print("Library Sections:")
        for section in sections:
            print("  {}: {} ({})".format(section['key'], section['title'], section['type']))
    elif args.items and args.section:
        token = get_plex_token()
        items = get_library_items(args.url, token, args.section)
        print("Library Items:")
        for item in items[:20]:  # Limit to 20
            print("  {}: {}".format(item['ratingKey'], item['title']))
    elif args.refresh and args.rating_key:
        token = get_plex_token()
        success = refresh_metadata(args.url, token, args.rating_key)
        if success:
            print("Metadata refresh triggered successfully")
        else:
            print("Failed to trigger metadata refresh")

if __name__ == '__main__':
    main()
