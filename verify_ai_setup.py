#!/usr/bin/env python3
"""
Verify AI/ML Setup for Skill Graph
This script checks if all components are properly configured
"""
import sys
import asyncio
from pathlib import Path

# Add backend to path
backend_path = Path(__file__).parent / 'backend'
sys.path.insert(0, str(backend_path))

print("="*70)
print("🔍 AI/ML Skill Graph Setup Verification")
print("="*70)

# Test 1: Check dependencies
print("\n📦 Test 1: Checking Dependencies...")
try:
    import sentence_transformers
    print("   ✅ sentence-transformers installed")
    print(f"      Version: {sentence_transformers.__version__}")
except ImportError as e:
    print(f"   ❌ sentence-transformers NOT installed")
    print(f"      Install: pip install sentence-transformers>=2.3.1")
    sys.exit(1)

try:
    import faiss
    print("   ✅ faiss-cpu installed")
    print(f"      Version: {faiss.__version__}")
except ImportError:
    print(f"   ❌ faiss-cpu NOT installed")
    print(f"      Install: pip install faiss-cpu>=1.7.4")
    sys.exit(1)

try:
    import numpy as np
    print("   ✅ numpy installed")
    print(f"      Version: {np.__version__}")
except ImportError:
    print(f"   ❌ numpy NOT installed")
    sys.exit(1)

# Test 2: Check model loading
print("\n🤖 Test 2: Testing Model Loading...")
try:
    from sentence_transformers import SentenceTransformer
    print("   ⏳ Loading model 'all-MiniLM-L6-v2'...")
    print("      (First time: ~90MB download, may take 30-60 seconds)")
    model = SentenceTransformer('all-MiniLM-L6-v2')
    print("   ✅ Model loaded successfully")
    print(f"      Dimension: {model.get_sentence_embedding_dimension()}")
    
    # Test embedding generation
    test_text = ["Python", "JavaScript", "Machine Learning"]
    embeddings = model.encode(test_text)
    print(f"   ✅ Generated test embeddings: {embeddings.shape}")
except Exception as e:
    print(f"   ❌ Model loading failed: {e}")
    sys.exit(1)

# Test 3: Check FAISS
print("\n🔍 Test 3: Testing FAISS...")
try:
    import faiss
    import numpy as np
    
    # Create a simple FAISS index
    dimension = 384
    test_vectors = np.random.random((10, dimension)).astype('float32')
    
    # Normalize
    faiss.normalize_L2(test_vectors)
    
    # Create index
    index = faiss.IndexFlatIP(dimension)
    index.add(test_vectors)
    
    # Search
    distances, indices = index.search(test_vectors[:1], 5)
    
    print(f"   ✅ FAISS index created successfully")
    print(f"      Index type: IndexFlatIP")
    print(f"      Total vectors: {index.ntotal}")
    print(f"      Test search returned {len(indices[0])} results")
except Exception as e:
    print(f"   ❌ FAISS test failed: {e}")
    sys.exit(1)

# Test 4: Check service file
service_file = backend_path / 'services' / 'skill_graph_service.py'
if service_file.exists():
    try:
        content = service_file.read_text(encoding='utf-8')  # <- specify encoding
    except UnicodeDecodeError:
        print("   ❌ Could not read service file. Try opening it and saving in UTF-8 encoding.")
        sys.exit(1)
    
    # Check if AI is enabled
    if 'EMBEDDINGS_AVAILABLE = False' in content:
        print("   ⚠️  AI is DISABLED in skill_graph_service.py")
    elif 'EMBEDDINGS_AVAILABLE = True' in content or 'from sentence_transformers import SentenceTransformer' in content:
        print("   ✅ AI is ENABLED in skill_graph_service.py")
    else:
        print("   ⚠️  Cannot determine AI status in skill_graph_service.py")
else:
    print(f"   ❌ Service file not found: {service_file}")

# Test 5: Check database connection
print("\n🗄️  Test 5: Checking Database Connection...")
try:
    from database.connection import get_db_pool
    
    async def test_db():
        try:
            pool = await get_db_pool()
            async with pool.acquire() as conn:
                async with conn.cursor() as cursor:
                    # Check if tables exist
                    await cursor.execute("SHOW TABLES LIKE 'skill_graph'")
                    sg_exists = await cursor.fetchone()
                    
                    await cursor.execute("SHOW TABLES LIKE 'skill_embeddings'")
                    se_exists = await cursor.fetchone()
                    
                    await cursor.execute("SHOW TABLES LIKE 'skill_similarities'")
                    ss_exists = await cursor.fetchone()
                    
                    if sg_exists:
                        print("   ✅ Table 'skill_graph' exists")
                        
                        # Check popularity_score column
                        await cursor.execute("""
                            SELECT COLUMN_TYPE 
                            FROM INFORMATION_SCHEMA.COLUMNS 
                            WHERE TABLE_SCHEMA = 'alumni_network'
                              AND TABLE_NAME = 'skill_graph'
                              AND COLUMN_NAME = 'popularity_score'
                        """)
                        col_type = await cursor.fetchone()
                        if col_type:
                            col_type_str = col_type[0]
                            if 'decimal(6,2)' in col_type_str.lower():
                                print(f"      ✅ popularity_score: {col_type_str} (CORRECT)")
                            elif 'decimal(5,2)' in col_type_str.lower():
                                print(f"      ⚠️  popularity_score: {col_type_str} (TOO SMALL!)")
                                print("         Run: mysql -u root -p alumni_network < /app/fix_skill_graph_schema.sql")
                            else:
                                print(f"      ℹ️  popularity_score: {col_type_str}")
                    else:
                        print("   ❌ Table 'skill_graph' does NOT exist")
                    
                    if se_exists:
                        print("   ✅ Table 'skill_embeddings' exists")
                        
                        # Check if embeddings exist
                        await cursor.execute("SELECT COUNT(*) FROM skill_embeddings")
                        count = (await cursor.fetchone())[0]
                        if count > 0:
                            print(f"      ✅ Contains {count} embeddings")
                        else:
                            print(f"      ⚠️  Empty (run build_skill_graph_ai.py)")
                    else:
                        print("   ❌ Table 'skill_embeddings' does NOT exist")
                    
                    if ss_exists:
                        print("   ✅ Table 'skill_similarities' exists")
                        
                        # Check if similarities exist
                        await cursor.execute("SELECT COUNT(*) FROM skill_similarities")
                        count = (await cursor.fetchone())[0]
                        if count > 0:
                            print(f"      ✅ Contains {count} similarity pairs")
                        else:
                            print(f"      ⚠️  Empty (run build_skill_graph_ai.py)")
                    else:
                        print("   ❌ Table 'skill_similarities' does NOT exist")
            
            print("   ✅ Database connection successful")
        except Exception as e:
            print(f"   ❌ Database connection failed: {e}")
            return False
        return True
    
    success = asyncio.run(test_db())
    if not success:
        sys.exit(1)
except Exception as e:
    print(f"   ❌ Database test failed: {e}")
    sys.exit(1)

# Summary
print("\n" + "="*70)
print("📊 Verification Summary")
print("="*70)
print("✅ All dependencies installed")
print("✅ Model loading works")
print("✅ FAISS works")
print("✅ Database connection works")
print("\n📝 Next Steps:")
print("   1. If AI is disabled, enable it in skill_graph_service.py")
print("   2. Run: python backend/scripts/build_skill_graph_ai.py")
print("   3. Verify results in database")
print("   4. Restart backend when ready")
print("="*70)
print("✅ Setup verification complete!")
print("="*70)
