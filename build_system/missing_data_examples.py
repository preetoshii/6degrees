#!/usr/bin/env python3

import json

def show_missing_examples(file_path):
    with open(file_path, 'r') as f:
        data = json.load(f)
    
    master_words = data['master_words']
    
    print("=== SPECIFIC EXAMPLES OF MISSING DATA ===\n")
    
    # 1. Show complete vs incomplete entries
    print("1. COMPLETE ENTRY EXAMPLE (Animal):")
    animal = master_words['Animal']
    print(f"   - Has {len(animal['children'])} children: {', '.join(animal['children'][:5])}...")
    print(f"   - Has {len(animal['traits'])} traits: {', '.join(animal['traits'])}")
    print(f"   - Has {len(animal['acquaintances'])} acquaintances: {', '.join(animal['acquaintances'])}")
    print(f"   - Processing stages: {animal['stages']}")
    
    print("\n2. INCOMPLETE ENTRY EXAMPLE (Cat):")
    cat = master_words['Cat']
    print(f"   - Has {len(cat['children'])} children: {cat['children']}")
    print(f"   - Has {len(cat['traits'])} traits: {cat['traits']}")
    print(f"   - Has {len(cat['acquaintances'])} acquaintances: {cat['acquaintances']}")
    print(f"   - Processing stages: {cat['stages']}")
    print("   - MISSING: Should have breeds (Siamese, Persian, etc.), traits (furry, independent), acquaintances (litter, scratching post)")
    
    print("\n3. ORPHANED ENTRY EXAMPLE (pet):")
    pet = master_words['pet']
    print(f"   - Parent: {pet['parent']}")
    print(f"   - Has {len(pet['children'])} children: {pet['children']}")
    print(f"   - Has {len(pet['traits'])} traits: {pet['traits']}")
    print(f"   - Has {len(pet['acquaintances'])} acquaintances: {pet['acquaintances']}")
    print(f"   - Processing stages: {pet['stages']}")
    print("   - MISSING: Should have traits (domesticated, loyal), acquaintances (owner, leash, collar)")
    
    print("\n4. WORDS THAT SHOULD HAVE RICH METADATA BUT DON'T:")
    
    examples = {
        'Furniture': {
            'missing_children': ['Chair', 'Table', 'Desk', 'Sofa', 'Bed', 'Cabinet'],
            'missing_traits': ['functional', 'decorative', 'comfortable'],
            'missing_acquaintances': ['room', 'home', 'office', 'comfort', 'style']
        },
        'Vehicle': {
            'missing_children': ['Car', 'Bicycle', 'Train', 'Airplane', 'Boat', 'Motorcycle'],
            'missing_traits': ['mobile', 'mechanical', 'transportive'],
            'missing_acquaintances': ['road', 'passenger', 'driver', 'fuel', 'journey']
        },
        'Computer': {
            'missing_children': ['Desktop', 'Laptop', 'Server', 'Tablet', 'Smartphone'],
            'missing_traits': ['electronic', 'programmable', 'digital'],
            'missing_acquaintances': ['software', 'data', 'network', 'user', 'program']
        }
    }
    
    for word, missing in examples.items():
        info = master_words[word]
        print(f"\n   {word}:")
        print(f"   - Current state: {len(info['children'])} children, {len(info['traits'])} traits, {len(info['acquaintances'])} acquaintances")
        print(f"   - Should have children like: {', '.join(missing['missing_children'][:3])}...")
        print(f"   - Should have traits like: {', '.join(missing['missing_traits'])}")
        print(f"   - Should have acquaintances like: {', '.join(missing['missing_acquaintances'][:3])}...")
    
    print("\n5. STATISTICS SUMMARY:")
    
    # Count words by processing level
    fully_processed = 0
    partially_processed = 0
    unprocessed = 0
    orphaned = 0
    
    for word, info in master_words.items():
        stages = info.get('stages', {})
        if stages.get('orphanAdopted'):
            orphaned += 1
        elif all(stages.get(s, False) for s in ['childrenDone', 'rawLogged', 'traitsPromoted']):
            if stages.get('rolesPromoted', False):
                fully_processed += 1
            else:
                partially_processed += 1
        else:
            unprocessed += 1
    
    print(f"   - Fully processed: {fully_processed} words (0%)")
    print(f"   - Partially processed: {partially_processed} words (11.1%)")
    print(f"   - Unprocessed: {unprocessed} words (46.7%)")
    print(f"   - Orphan adopted: {orphaned} words (42.2%)")
    
    print("\n6. IMPACT ON GAMEPLAY:")
    print("   - Limited vocabulary: Only 45 words total (should be hundreds/thousands)")
    print("   - Poor connections: Most words have no acquaintances, limiting path options")
    print("   - Shallow hierarchy: Many categories have no subcategories")
    print("   - Missing traits: 88.9% of words have no traits, making puzzles less interesting")

if __name__ == "__main__":
    show_missing_examples("/Users/preetoshi/6degrees/data/processed/unified_master.json")