"""
Infrastructure Test Script
Verifies all Phase 10.1 components are properly configured
"""
import sys
import os
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent))

def test_imports():
    """Test all required imports"""
    print("=" * 80)
    print("TESTING PHASE 10.1 INFRASTRUCTURE")
    print("=" * 80)
    print()
    
    results = {
        'passed': [],
        'failed': []
    }
    
    # Core imports
    tests = [
        ("FastAPI", lambda: __import__('fastapi')),
        ("Uvicorn", lambda: __import__('uvicorn')),
        ("aiomysql", lambda: __import__('aiomysql')),
        ("Redis", lambda: __import__('redis')),
        ("Celery", lambda: __import__('celery')),
        ("Pandas", lambda: __import__('pandas')),
        ("NumPy", lambda: __import__('numpy')),
        ("Scikit-learn", lambda: __import__('sklearn')),
        ("Sentence Transformers", lambda: __import__('sentence_transformers')),
        ("FAISS", lambda: __import__('faiss')),
        ("Pillow", lambda: __import__('PIL')),
        ("QRCode", lambda: __import__('qrcode')),
        ("ReportLab", lambda: __import__('reportlab')),
        ("OpenAI", lambda: __import__('openai')),
        ("Python-Jose", lambda: __import__('jose')),
        ("BCrypt", lambda: __import__('bcrypt')),
    ]
    
    for name, test_func in tests:
        try:
            test_func()
            results['passed'].append(name)
            print(f"✅ {name:30} PASS")
        except ImportError as e:
            results['failed'].append((name, str(e)))
            print(f"❌ {name:30} FAIL: {str(e)}")
    
    print()
    print("=" * 80)
    print(f"IMPORT TESTS: {len(results['passed'])}/{len(tests)} PASSED")
    print("=" * 80)
    print()
    
    return results


def test_directories():
    """Test required directories exist"""
    print("=" * 80)
    print("TESTING DIRECTORIES")
    print("=" * 80)
    print()
    
    # Get base directory (parent of backend folder)
    backend_dir = Path(__file__).parent
    base_dir = backend_dir.parent
    
    required_dirs = [
        base_dir / 'storage',
        base_dir / 'storage' / 'datasets',
        base_dir / 'storage' / 'ml_models',
        base_dir / 'storage' / 'photos',
        base_dir / 'storage' / 'cvs',
        base_dir / 'storage' / 'documents',
        base_dir / 'storage' / 'qr_codes',
        base_dir / 'storage' / 'temp',
        backend_dir / 'ml_models',
    ]
    
    results = {'passed': [], 'failed': []}
    
    for dir_path in required_dirs:
        if dir_path.exists():
            results['passed'].append(str(dir_path))
            print(f"✅ {str(dir_path):50} EXISTS")
        else:
            try:
                dir_path.mkdir(parents=True, exist_ok=True)
                results['passed'].append(str(dir_path))
                print(f"✅ {str(dir_path):50} CREATED")
            except Exception as e:
                results['failed'].append((str(dir_path), str(e)))
                print(f"❌ {str(dir_path):50} FAILED: {str(e)}")
    
    print()
    print("=" * 80)
    print(f"DIRECTORY TESTS: {len(results['passed'])}/{len(required_dirs)} PASSED")
    print("=" * 80)
    print()
    
    return results


def test_configuration_files():
    """Test configuration files exist"""
    print("=" * 80)
    print("TESTING CONFIGURATION FILES")
    print("=" * 80)
    print()
    
    # Get backend directory
    backend_dir = Path(__file__).parent
    
    required_files = [
        backend_dir / '.env',
        backend_dir / 'celery_app.py',
        backend_dir / 'redis_client.py',
        backend_dir / 'storage.py',
        backend_dir / 'ai_utils.py',
        backend_dir / 'tasks' / '__init__.py',
        backend_dir / 'tasks' / 'upload_tasks.py',
        backend_dir / 'tasks' / 'ai_tasks.py',
        backend_dir / 'tasks' / 'notification_tasks.py',
    ]
    
    results = {'passed': [], 'failed': []}
    
    for file_path in required_files:
        if file_path.exists():
            results['passed'].append(str(file_path))
            print(f"✅ {str(file_path):60} EXISTS")
        else:
            results['failed'].append((str(file_path), 'Not found'))
            print(f"❌ {str(file_path):60} NOT FOUND")
    
    print()
    print("=" * 80)
    print(f"CONFIGURATION TESTS: {len(results['passed'])}/{len(required_files)} PASSED")
    print("=" * 80)
    print()
    
    return results


def test_environment_variables():
    """Test environment variables are set"""
    print("=" * 80)
    print("TESTING ENVIRONMENT VARIABLES")
    print("=" * 80)
    print()
    
    from dotenv import load_dotenv
    # Load .env from backend directory (platform independent)
    backend_dir = Path(__file__).parent
    env_file = backend_dir / '.env'
    load_dotenv(env_file)
    
    required_vars = [
        'DB_HOST',
        'DB_PORT',
        'DB_USER',
        'DB_NAME',
        'REDIS_HOST',
        'REDIS_PORT',
        'CELERY_BROKER_URL',
        'CELERY_RESULT_BACKEND',
        'STORAGE_TYPE',
    ]
    
    results = {'passed': [], 'failed': []}
    
    for var in required_vars:
        value = os.getenv(var)
        if value:
            results['passed'].append(var)
            print(f"✅ {var:30} = {value}")
        else:
            results['failed'].append((var, 'Not set'))
            print(f"❌ {var:30} NOT SET")
    
    print()
    print("=" * 80)
    print(f"ENVIRONMENT TESTS: {len(results['passed'])}/{len(required_vars)} PASSED")
    print("=" * 80)
    print()
    
    return results


def main():
    """Run all tests"""
    print()
    print("🚀 PHASE 10.1: INFRASTRUCTURE SETUP TEST")
    print()
    
    import_results = test_imports()
    dir_results = test_directories()
    file_results = test_configuration_files()
    env_results = test_environment_variables()
    
    # Summary
    print()
    print("=" * 80)
    print("FINAL SUMMARY")
    print("=" * 80)
    print()
    
    total_tests = (
        len(import_results['passed']) + len(import_results['failed']) +
        len(dir_results['passed']) + len(dir_results['failed']) +
        len(file_results['passed']) + len(file_results['failed']) +
        len(env_results['passed']) + len(env_results['failed'])
    )
    
    total_passed = (
        len(import_results['passed']) +
        len(dir_results['passed']) +
        len(file_results['passed']) +
        len(env_results['passed'])
    )
    
    print(f"Total Tests: {total_tests}")
    print(f"Passed: {total_passed}")
    print(f"Failed: {total_tests - total_passed}")
    print()
    
    if total_passed == total_tests:
        print("✅ ALL TESTS PASSED - Phase 10.1 Infrastructure Setup Complete!")
    else:
        print("⚠️ SOME TESTS FAILED - Please review failed tests above")
        print()
        print("Failed Tests:")
        for name, error in import_results['failed']:
            print(f"  - Import: {name}: {error}")
        for name, error in dir_results['failed']:
            print(f"  - Directory: {name}: {error}")
        for name, error in file_results['failed']:
            print(f"  - File: {name}: {error}")
        for name, error in env_results['failed']:
            print(f"  - Environment: {name}: {error}")
    
    print()
    print("=" * 80)
    print()
    
    return total_passed == total_tests


if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)
