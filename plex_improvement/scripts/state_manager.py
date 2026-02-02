#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Simple State Manager for Resumption
Python 2.7 Compatible
"""

from __future__ import print_function
import json
import os
import datetime

class StateManager(object):
    """Simple state manager for resumption"""
    
    def __init__(self, state_file=None):
        """
        Initialize state manager
        
        Args:
            state_file: Optional path to state file
        """
        self.state_file = state_file or "Plug-ins/plex_improvement/state.json"
        self.state = {}
        
        if os.path.exists(self.state_file):
            self.load_state()
    
    def save_state(self, reason='checkpoint'):
        """
        Save state to file
        
        Args:
            reason: Reason for saving
        """
        state = {
            'saved_at': datetime.datetime.now().isoformat(),
            'reason': reason,
            'state': self.state
        }
        
        with open(self.state_file, 'w') as f:
            json.dump(state, f, indent=2)
        
        print("State saved: {}".format(self.state_file))
    
    def load_state(self):
        """Load state from file"""
        if os.path.exists(self.state_file):
            with open(self.state_file, 'r') as f:
                data = json.load(f)
                self.state = data.get('state', {})
            print("State loaded: {}".format(self.state_file))
    
    def update_state(self, key, value):
        """
        Update state value
        
        Args:
            key: State key
            value: State value
        """
        self.state[key] = value
    
    def get_state(self, key, default=None):
        """
        Get state value
        
        Args:
            key: State key
            default: Default value if key not found
            
        Returns:
            State value
        """
        return self.state.get(key, default)
    
    def clear_state(self):
        """Clear all state"""
        self.state = {}
        if os.path.exists(self.state_file):
            os.remove(self.state_file)
        print("State cleared")

def main():
    import argparse
    parser = argparse.ArgumentParser(description='Manage improvement loop state')
    parser.add_argument('--save', help='Save state with reason')
    parser.add_argument('--load', action='store_true', help='Load state')
    parser.add_argument('--get', help='Get state value')
    parser.add_argument('--set', nargs=2, metavar=('KEY', 'VALUE'), help='Set state value')
    parser.add_argument('--clear', action='store_true', help='Clear state')
    args = parser.parse_args()
    
    manager = StateManager()
    
    if args.save:
        manager.save_state(args.save)
    elif args.load:
        manager.load_state()
    elif args.get:
        value = manager.get_state(args.get)
        print("{}: {}".format(args.get, value))
    elif args.set:
        manager.update_state(args.set[0], args.set[1])
        manager.save_state()
    elif args.clear:
        manager.clear_state()

if __name__ == '__main__':
    main()
