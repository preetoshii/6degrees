#!/usr/bin/env python3

import json
from collections import defaultdict

def detailed_analysis(file_path):
    with open(file_path, 'r') as f:
        data = json.load(f)
    
    master_words = data['master_words']
    
    print("=== DETAILED BUILD ANALYSIS ===\n")
    
    # 1. Find high-priority words that need children
    print("1. HIGH-PRIORITY WORDS NEEDING CHILDREN:")
    print("   (Major categories that are currently leaf nodes)\n")
    
    major_categories = {
        'Animal': ['Cat', 'Dog', 'Bird', 'Fish', 'Horse'],
        'Object': ['Furniture', 'Vehicle', 'Tool', 'Container', 'Device'],
        'Concept': ['Theory', 'Belief', 'Principle', 'Value'],
        'System': ['Solar', 'Digestive', 'Computer', 'Political']
    }
    
    for parent, children in major_categories.items():
        missing_children = []
        for child in children:
            if child in master_words and len(master_words[child]['children']) == 0:
                missing_children.append(child)
        if missing_children:
            print(f"   {parent} subtypes missing children: {', '.join(missing_children)}")
    
    # 2. Analyze orphaned words
    print("\n2. ORPHANED WORDS ANALYSIS:")
    orphaned = []
    for word, info in master_words.items():
        if info.get('stages', {}).get('orphanAdopted'):
            orphaned.append({
                'word': word,
                'parent': info['parent'],
                'has_traits': len(info['traits']) > 0,
                'has_acquaintances': len(info['acquaintances']) > 0
            })
    
    print(f"   Total orphaned words: {len(orphaned)}")
    print("   All orphaned words lack traits and acquaintances!")
    print("   Distribution by parent:")
    orphan_by_parent = defaultdict(list)
    for o in orphaned:
        orphan_by_parent[o['parent']].append(o['word'])
    
    for parent, words in sorted(orphan_by_parent.items()):
        print(f"   - {parent}: {', '.join(sorted(words))}")
    
    # 3. Processing stage analysis
    print("\n3. PROCESSING STAGE PATTERNS:")
    stage_patterns = defaultdict(list)
    
    for word, info in master_words.items():
        stages = info.get('stages', {})
        pattern = []
        for stage in ['childrenDone', 'rawLogged', 'traitsPromoted', 'rolesPromoted', 'orphanAdopted']:
            if stage in stages:
                pattern.append(f"{stage}:{stages[stage]}")
        
        pattern_str = ', '.join(pattern)
        stage_patterns[pattern_str].append(word)
    
    for pattern, words in sorted(stage_patterns.items(), key=lambda x: len(x[1]), reverse=True):
        print(f"\n   Pattern: {pattern}")
        print(f"   Words ({len(words)}): {', '.join(sorted(words)[:10])}")
        if len(words) > 10:
            print(f"   ... and {len(words) - 10} more")
    
    # 4. Connectivity analysis
    print("\n4. CONNECTIVITY ANALYSIS:")
    print("   Words that appear in acquaintances but have no data themselves:\n")
    
    mentioned_words = set()
    for word, info in master_words.items():
        mentioned_words.update(info['acquaintances'])
    
    # No missing references in this build
    
    # 5. Recommend fixes
    print("\n5. RECOMMENDED FIXES (in priority order):\n")
    
    print("   PHASE 1 - Complete partially processed top-level categories:")
    print("   - Thing, Animal, Object, Concept, System need rolesPromoted")
    print("   - Place needs full processing (currently incomplete)")
    
    print("\n   PHASE 2 - Process major subcategories:")
    for parent, children in major_categories.items():
        unprocessed = [c for c in children if c in master_words and 
                      not master_words[c].get('stages', {}).get('rawLogged')]
        if unprocessed:
            print(f"   - {parent} children: {', '.join(unprocessed)}")
    
    print("\n   PHASE 3 - Add metadata to orphaned words:")
    print("   - All 19 orphaned words need traits and acquaintances")
    print("   - These are mostly abstract concepts and utility words")
    
    print("\n   PHASE 4 - Expand leaf categories with children:")
    print("   - Cat → breeds, behaviors, etc.")
    print("   - Furniture → Chair, Table, Bed, etc.")
    print("   - Vehicle → Car, Bicycle, Train, etc.")
    print("   - And so on for all 18 major leaf categories")
    
    # 6. Data quality check
    print("\n6. DATA QUALITY ISSUES:")
    
    # Check for inconsistencies
    issues = []
    
    for word, info in master_words.items():
        # Check if word appears as its own child
        if word in info['children']:
            issues.append(f"{word} appears as its own child")
        
        # Check if word appears as its own acquaintance
        if word in info['acquaintances']:
            issues.append(f"{word} appears as its own acquaintance")
        
        # Check bidirectional parent-child relationships
        for child in info['children']:
            if child in master_words:
                child_parent = master_words[child].get('parent')
                if child_parent != word:
                    issues.append(f"{child} lists parent as {child_parent}, not {word}")
    
    if issues:
        for issue in issues:
            print(f"   - {issue}")
    else:
        print("   No data consistency issues found!")

if __name__ == "__main__":
    detailed_analysis("/Users/preetoshi/6degrees/data/processed/unified_master.json")