#!/usr/bin/env python3
"""Test semantic paths in Six Degrees game data"""

import json
from collections import deque
from typing import List, Optional, Dict, Tuple, Set

def load_data(filepath: str) -> dict:
    """Load the unified master data"""
    with open(filepath, 'r') as f:
        return json.load(f)

def find_all_connections(word: str, data: dict) -> Set[str]:
    """Find all words connected to a given word (parent, children, acquaintances)"""
    connections = set()
    word_data = data['master_words'].get(word, {})
    
    # Add parent
    if word_data.get('parent'):
        connections.add(word_data['parent'])
    
    # Add children
    connections.update(word_data.get('children', []))
    
    # Add acquaintances
    connections.update(word_data.get('acquaintances', []))
    
    return connections

def find_path_bfs(start: str, end: str, data: dict) -> Optional[List[str]]:
    """Find shortest path between two words using BFS"""
    if start not in data['master_words'] or end not in data['master_words']:
        return None
    
    if start == end:
        return [start]
    
    # BFS to find shortest path
    queue = deque([(start, [start])])
    visited = {start}
    
    while queue:
        current, path = queue.popleft()
        
        # Get all connections for current word
        connections = find_all_connections(current, data)
        
        for next_word in connections:
            if next_word not in visited:
                new_path = path + [next_word]
                
                if next_word == end:
                    return new_path
                
                visited.add(next_word)
                queue.append((next_word, new_path))
    
    return None

def analyze_connection(word1: str, word2: str, data: dict) -> str:
    """Analyze the semantic relationship between two connected words"""
    word1_data = data['master_words'].get(word1, {})
    word2_data = data['master_words'].get(word2, {})
    
    # Check parent-child relationship
    if word2_data.get('parent') == word1:
        return f"{word2} is a child/subtype of {word1}"
    elif word1_data.get('parent') == word2:
        return f"{word1} is a child/subtype of {word2}"
    
    # Check if they're siblings (same parent)
    if word1_data.get('parent') and word1_data.get('parent') == word2_data.get('parent'):
        return f"{word1} and {word2} are siblings (both children of {word1_data['parent']})"
    
    # Check acquaintance relationship
    if word2 in word1_data.get('acquaintances', []):
        return f"{word2} is an acquaintance of {word1}"
    elif word1 in word2_data.get('acquaintances', []):
        return f"{word1} is an acquaintance of {word2}"
    
    return "Unknown relationship"

def test_path(start: str, end: str, data: dict) -> Dict[str, any]:
    """Test a path and analyze its semantic sense"""
    path = find_path_bfs(start, end, data)
    
    if not path:
        return {
            'start': start,
            'end': end,
            'path_found': False,
            'path': None,
            'analysis': None,
            'issues': ['No path found between words']
        }
    
    # Analyze each step
    step_analysis = []
    issues = []
    
    for i in range(len(path) - 1):
        current = path[i]
        next_word = path[i + 1]
        relationship = analyze_connection(current, next_word, data)
        
        step_analysis.append({
            'step': i + 1,
            'from': current,
            'to': next_word,
            'relationship': relationship
        })
        
        # Check if connection makes semantic sense
        current_data = data['master_words'].get(current, {})
        next_data = data['master_words'].get(next_word, {})
        
        # Flag potentially illogical connections
        if current_data.get('type') == 'thing' and next_data.get('type') == 'thing':
            current_parent = current_data.get('parent', '')
            next_parent = next_data.get('parent', '')
            
            # Check for cross-category jumps that might not make sense
            if current_parent and next_parent:
                if (('Animal' in [current_parent, current] and 'System' in [next_parent, next_word]) or
                    ('Animal' in [current_parent, current] and 'Concept' in [next_parent, next_word]) or
                    ('Object' in [current_parent, current] and 'System' in [next_parent, next_word])):
                    if 'acquaintance' not in relationship.lower():
                        issues.append(f"Step {i+1}: Potentially illogical jump from {current} ({current_parent}) to {next_word} ({next_parent})")
    
    return {
        'start': start,
        'end': end,
        'path_found': True,
        'path': path,
        'path_length': len(path),
        'step_analysis': step_analysis,
        'issues': issues if issues else ['No semantic issues detected']
    }

def main():
    # Load data
    data = load_data('/Users/preetoshi/6degrees/data/processed/unified_master.json')
    
    # Test paths
    test_pairs = [
        ('Cat', 'Political'),
        ('Tool', 'Theory'),
        ('Fish', 'Furniture'),
        ('Horse', 'Economic'),
        ('Vehicle', 'Belief')
    ]
    
    print("Six Degrees Path Testing - Semantic Analysis")
    print("=" * 60)
    
    for start, end in test_pairs:
        print(f"\n\nPath {test_pairs.index((start, end)) + 1}: {start} → {end}")
        print("-" * 40)
        
        result = test_path(start, end, data)
        
        if result['path_found']:
            print(f"Path found: {' → '.join(result['path'])}")
            print(f"Path length: {result['path_length']} steps")
            print("\nStep-by-step analysis:")
            
            for step in result['step_analysis']:
                print(f"  Step {step['step']}: {step['from']} → {step['to']}")
                print(f"    Relationship: {step['relationship']}")
            
            print("\nSemantic evaluation:")
            for issue in result['issues']:
                print(f"  • {issue}")
        else:
            print("No path found between these words")
            for issue in result['issues']:
                print(f"  • {issue}")

if __name__ == "__main__":
    main()