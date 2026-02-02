#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Backup and Restore Utilities
Python 2.7 Compatible
"""

from __future__ import print_function
import os
import shutil
import datetime
from pathlib import Path

def create_backup(files_to_backup, backup_name, backup_dir="Plug-ins/_BACKUPS"):
    """
    Create timestamped backup of files
    
    Args:
        files_to_backup: List of file paths to backup
        backup_name: Name for this backup
        backup_dir: Directory to store backups
        
    Returns:
        Path to backup directory
    """
    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_path = os.path.join(backup_dir, "{}_{}".format(backup_name.replace(' ', '_'), timestamp))
    
    # Create backup directory
    if not os.path.exists(backup_path):
        os.makedirs(backup_path)
    
    # Copy files
    for file_path in files_to_backup:
        file_path = Path(file_path)
        if file_path.exists():
            dest = os.path.join(backup_path, file_path.name)
            shutil.copy2(str(file_path), dest)
            print("  Backed up: {}".format(file_path.name))
        else:
            print("  Warning: File not found: {}".format(file_path))
    
    print("Backup created: {}".format(backup_path))
    return backup_path

def restore_backup(backup_path, target_dir="Plug-ins"):
    """
    Restore files from backup
    
    Args:
        backup_path: Path to backup directory
        target_dir: Directory to restore files to
    """
    if not os.path.exists(backup_path):
        raise Exception("Backup not found: {}".format(backup_path))
    
    # Copy files from backup to target
    for filename in os.listdir(backup_path):
        src = os.path.join(backup_path, filename)
        dest = os.path.join(target_dir, filename)
        shutil.copy2(src, dest)
        print("  Restored: {}".format(filename))
    
    print("Restore complete from: {}".format(backup_path))

def list_backups(backup_dir="Plug-ins/_BACKUPS"):
    """
    List all available backups
    
    Args:
        backup_dir: Directory containing backups
        
    Returns:
        List of backup directories
    """
    if not os.path.exists(backup_dir):
        return []
    
    backups = []
    for item in os.listdir(backup_dir):
        item_path = os.path.join(backup_dir, item)
        if os.path.isdir(item_path):
            backups.append(item_path)
    
    return sorted(backups, reverse=True)

def delete_backup(backup_path):
    """
    Delete a backup directory
    
    Args:
        backup_path: Path to backup directory to delete
    """
    if not os.path.exists(backup_path):
        raise Exception("Backup not found: {}".format(backup_path))
    
    shutil.rmtree(backup_path)
    print("Backup deleted: {}".format(backup_path))

def main():
    import argparse
    parser = argparse.ArgumentParser(description='Backup and restore utilities')
    parser.add_argument('--create', nargs='+', help='Create backup of files')
    parser.add_argument('--name', help='Backup name')
    parser.add_argument('--restore', help='Restore from backup directory')
    parser.add_argument('--list', action='store_true', help='List all backups')
    parser.add_argument('--delete', help='Delete backup directory')
    args = parser.parse_args()
    
    if args.create and args.name:
        create_backup(args.create, args.name)
    elif args.restore:
        restore_backup(args.restore)
    elif args.list:
        backups = list_backups()
        print("Available backups:")
        for backup in backups:
            print("  {}".format(backup))
    elif args.delete:
        delete_backup(args.delete)

if __name__ == '__main__':
    main()