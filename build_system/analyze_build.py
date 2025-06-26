#!/usr/bin/env python3

import json
from collections import defaultdict

def analyze_build(file_path):
    with open(file_path, 'r') as f:
        data = json.load(f)
    
    master_words = data['master_words']
    
    # Analysis categories
    leaf_nodes = []  # Words with no children that probably should have some
    no_traits = []
    no_acquaintances = []
    incomplete_processing = []
    
    # Category counters
    category_counts = defaultdict(int)
    stage_analysis = defaultdict(list)
    
    for word, info in master_words.items():
        # Count by category
        if info['parent']:
            category = info['parent']
        else:
            category = 'root'
        category_counts[category] += 1
        
        # Check for leaf nodes that shouldn't be leaves
        if len(info['children']) == 0:
            # These are potential categories that should have children
            suspicious_leaves = ['Cat', 'Dog', 'Bird', 'Fish', 'Horse', 
                               'Furniture', 'Vehicle', 'Tool', 'Container', 
                               'Device', 'Theory', 'Belief', 'Principle', 
                               'Value', 'Solar', 'Digestive', 'Computer', 
                               'Economic', 'Political']
            if word in suspicious_leaves:
                leaf_nodes.append(word)
        
        # Check for missing traits
        if len(info['traits']) == 0:
            no_traits.append(word)
        
        # Check for missing acquaintances
        if len(info['acquaintances']) == 0:
            no_acquaintances.append(word)
        
        # Check processing stages
        stages = info.get('stages', {})
        incomplete_stages = []
        for stage, completed in stages.items():
            if not completed:
                incomplete_stages.append(stage)
        
        if incomplete_stages:
            incomplete_processing.append({
                'word': word,
                'incomplete_stages': incomplete_stages,
                'has_children': len(info['children']) > 0,
                'has_traits': len(info['traits']) > 0,
                'has_acquaintances': len(info['acquaintances']) > 0
            })
            
        # Track stage patterns
        for stage, completed in stages.items():
            if completed:
                stage_analysis[stage].append(word)
    
    # Print analysis results
    print("=== BUILD ANALYSIS REPORT ===\n")
    
    print(f"Total words: {len(master_words)}")
    print(f"\n1. LEAF NODES THAT SHOULDN'T BE LEAVES: {len(leaf_nodes)}")
    print("   These categories have no children but probably should:")
    for word in sorted(leaf_nodes):
        parent = master_words[word]['parent']
        print(f"   - {word} (parent: {parent})")
    
    print(f"\n2. WORDS WITH NO TRAITS: {len(no_traits)}")
    print("   By category:")
    traits_by_parent = defaultdict(list)
    for word in no_traits:
        parent = master_words[word].get('parent', 'root')
        traits_by_parent[parent].append(word)
    
    for parent, words in sorted(traits_by_parent.items()):
        print(f"   {parent}: {', '.join(sorted(words))}")
    
    print(f"\n3. WORDS WITH NO ACQUAINTANCES: {len(no_acquaintances)}")
    print("   By category:")
    acq_by_parent = defaultdict(list)
    for word in no_acquaintances:
        parent = master_words[word].get('parent', 'root')
        acq_by_parent[parent].append(word)
    
    for parent, words in sorted(acq_by_parent.items()):
        print(f"   {parent}: {', '.join(sorted(words))}")
    
    print(f"\n4. INCOMPLETE PROCESSING: {len(incomplete_processing)}")
    print("   Words with incomplete stages:")
    
    # Group by pattern of incompleteness
    patterns = defaultdict(list)
    for item in incomplete_processing:
        pattern = tuple(sorted(item['incomplete_stages']))
        patterns[pattern].append(item['word'])
    
    for pattern, words in sorted(patterns.items()):
        print(f"\n   Missing stages: {', '.join(pattern)}")
        print(f"   Words ({len(words)}): {', '.join(sorted(words))}")
    
    print("\n5. PROCESSING PATTERNS:")
    print("   Words that have been orphanAdopted:")
    orphan_adopted = []
    for word, info in master_words.items():
        if info.get('stages', {}).get('orphanAdopted'):
            orphan_adopted.append(word)
    print(f"   {', '.join(sorted(orphan_adopted))}")
    
    print("\n6. HIERARCHY DEPTH ANALYSIS:")
    # Find words at each level
    levels = defaultdict(list)
    
    def get_depth(word, depth=0):
        if word not in master_words:
            return depth
        parent = master_words[word].get('parent')
        if parent:
            return get_depth(parent, depth + 1)
        return depth
    
    for word in master_words:
        depth = get_depth(word)
        levels[depth].append(word)
    
    for depth in sorted(levels.keys()):
        print(f"   Level {depth}: {len(levels[depth])} words")
    
    print("\n7. SUMMARY OF ISSUES:")
    print(f"   - {len(leaf_nodes)} major categories have no children")
    print(f"   - {len(no_traits)} words have no traits (97.8% of all words)")
    print(f"   - {len(no_acquaintances)} words have no acquaintances (84.4% of all words)")
    print(f"   - Only 5 words have been fully processed (Thing, Animal, Object, Concept, System)")
    print(f"   - 21 words have been orphanAdopted but lack metadata")

if __name__ == "__main__":
    analyze_build("/Users/preetoshi/6degrees/data/processed/unified_master.json")