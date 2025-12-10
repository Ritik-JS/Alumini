"""
Master Test Runner
Runs all infrastructure and connectivity tests
"""
import sys
import os
import subprocess
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent))

def print_header(title):
    """Print a formatted header"""
    print("\n" + "=" * 80)
    print(f"  {title}")
    print("=" * 80 + "\n")


def run_test_script(script_name, description):
    """Run a test script and return success status"""
    print_header(description)
    
    try:
        # Run the script
        result = subprocess.run(
            [sys.executable, script_name],
            cwd=Path(__file__).parent,
            capture_output=False,
            text=True
        )
        
        success = result.returncode == 0
        
        if success:
            print(f"\n✅ {description} - PASSED\n")
        else:
            print(f"\n❌ {description} - FAILED\n")
        
        return success
        
    except Exception as e:
        print(f"\n❌ {description} - ERROR: {str(e)}\n")
        return False


def main():
    """Run all tests"""
    print("\n")
    print("╔" + "═" * 78 + "╗")
    print("║" + " " * 20 + "🧪 ALUMUNITY TEST SUITE" + " " * 35 + "║")
    print("║" + " " * 15 + "Infrastructure & Connectivity Tests" + " " * 28 + "║")
    print("╚" + "═" * 78 + "╝")
    print("\n")
    
    results = []
    
    # Test 1: Infrastructure Test
    test1_success = run_test_script(
        'test_infrastructure.py',
        '📦 TEST 1: Infrastructure Setup (Dependencies, Directories, Config)'
    )
    results.append(('Infrastructure Test', test1_success))
    
    # Test 2: Redis Connection Test
    test2_success = run_test_script(
        'test_redis_connection.py',
        '🔴 TEST 2: Redis Connection (Upstash Cloud)'
    )
    results.append(('Redis Connection Test', test2_success))
    
    # Final Summary
    print_header("📊 FINAL TEST SUMMARY")
    
    passed = sum(1 for _, success in results if success)
    total = len(results)
    
    for test_name, success in results:
        status = "✅ PASSED" if success else "❌ FAILED"
        print(f"  {test_name:40} {status}")
    
    print("\n" + "-" * 80 + "\n")
    print(f"  Total Tests: {total}")
    print(f"  Passed: {passed}")
    print(f"  Failed: {total - passed}")
    
    if passed == total:
        print("\n  🎉 ALL TESTS PASSED! Your AlumUnity backend is ready to rock!\n")
        print("=" * 80)
        print("\n✨ Next Steps:")
        print("  1. Start backend: python server.py")
        print("  2. Start frontend: cd ../frontend && yarn start")
        print("  3. Access app: http://localhost:3000")
        print("  4. API docs: http://localhost:8001/docs")
        print("\n" + "=" * 80 + "\n")
        return 0
    else:
        print("\n  ⚠️  Some tests failed. Please review the errors above.\n")
        print("=" * 80)
        print("\n💡 Common Issues:")
        print("  • Redis Failed: Check REDIS_URL in .env (must use rediss://)")
        print("  • Import Failed: Run 'pip install -r requirements.txt'")
        print("  • Directory Failed: Check file permissions")
        print("\n📖 See REDIS_SETUP_GUIDE.md for detailed troubleshooting")
        print("\n" + "=" * 80 + "\n")
        return 1


if __name__ == '__main__':
    exit_code = main()
    sys.exit(exit_code)
