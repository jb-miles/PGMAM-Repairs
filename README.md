# PGMA Repairs & Modernization

**Status:** Active Repair / Stopgap  
**Original Project:** Plex Gay Metadata Agents (PGMA)

This repository contains active repairs for the PGMA suite of Plex agents. The original project has not been updated in over 2 years, and recent changes to source websites (IAFD, AEBN, etc.) have rendered most agents non-functional.

## ⚠️ Project Status: Stopgap

**Note:** Plex is currently implementing replacement functionality for metadata agents. This project serves as a **critical stopgap** to restore functionality to existing libraries until the new Plex framework is fully viable and migrated to.

## Current Efforts

I am currently executing a 5-phase modernization strategy to fix the broken agents.

### Key Objectives
1.  **Fix IAFD Dependency:** IAFD.com is currently blocking requests (HTTP 403), which breaks enrichment for all agents. I am decoupling this dependency and replacing it with a robust Provider Framework.
2.  **Repair Broken Scrapers:** Website structure changes have broken metadata extraction for most agents (currently seeing ~94% failure rates). I am systematically updating scrapers to match current website HTML.
3.  **Better Enrichment:** I am implementing GEVI (Primary) and WayBig (Secondary) as superior alternatives to IAFD for cast and director metadata.

## Installation

Note: Changes are frequently made to Preferences. When you download and install a new release, you may need to reset preferences.

1.  Stop your Plex Media Server (PMS)
2.  Download the latest agents from this repository
3.  Delete the existing agents in your PMS `Plug-ins` folder
4.  Copy the updated agents to your PMS `Plug-ins` folder
5.  Restart your PMS
6.  Check the preferences for each agent in Plex Settings
7.  Stop and restart your PMS again to ensure clean loading

## Disclaimer

This project stores no images or metadata. All metadata is downloaded directly from publicly-available sources
