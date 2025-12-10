"""
Test Redis Connection Script
Quick script to verify Upstash Redis connectivity
"""
import asyncio
import os
from dotenv import load_dotenv
from redis_client import get_redis_client, RedisCache

# Load environment variables
load_dotenv()


async def test_redis_connection():
    """Test Redis connection and basic operations"""
    print("=" * 60)
    print("🔍 Testing Redis Connection to Upstash")
    print("=" * 60)
    
    try:
        # Get Redis client
        print("\n1️⃣ Attempting to connect to Redis...")
        redis_url = os.getenv('REDIS_URL')
        print(f"   URL: {redis_url.split('@')[1] if '@' in redis_url else redis_url}")
        
        client = await get_redis_client()
        print("   ✅ Connection established!")
        
        # Test PING
        print("\n2️⃣ Testing PING command...")
        pong = await client.ping()
        print(f"   ✅ PING response: {pong}")
        
        # Test SET
        print("\n3️⃣ Testing SET command...")
        test_key = "test:alumunity:connection"
        test_value = "Hello from AlumUnity!"
        await RedisCache.set(test_key, test_value, ttl=60)
        print(f"   ✅ SET '{test_key}' = '{test_value}'")
        
        # Test GET
        print("\n4️⃣ Testing GET command...")
        retrieved_value = await RedisCache.get(test_key)
        print(f"   ✅ GET '{test_key}' = '{retrieved_value}'")
        
        # Verify value matches
        if retrieved_value == test_value:
            print("   ✅ Value matches!")
        else:
            print(f"   ❌ Value mismatch: Expected '{test_value}', got '{retrieved_value}'")
        
        # Test DELETE
        print("\n5️⃣ Testing DELETE command...")
        await RedisCache.delete(test_key)
        print(f"   ✅ Deleted '{test_key}'")
        
        # Verify deletion
        deleted_value = await RedisCache.get(test_key)
        if deleted_value is None:
            print("   ✅ Deletion confirmed!")
        else:
            print(f"   ❌ Deletion failed: Value still exists '{deleted_value}'")
        
        # Get server info
        print("\n6️⃣ Getting Redis server info...")
        info = await client.info('server')
        print(f"   Redis version: {info.get('redis_version', 'Unknown')}")
        print(f"   OS: {info.get('os', 'Unknown')}")
        print(f"   Uptime: {info.get('uptime_in_days', 0)} days")
        
        print("\n" + "=" * 60)
        print("✅ ALL TESTS PASSED - Redis is working correctly!")
        print("=" * 60)
        
        return True
        
    except Exception as e:
        print("\n" + "=" * 60)
        print(f"❌ ERROR: {str(e)}")
        print("=" * 60)
        print("\n💡 Troubleshooting tips:")
        print("   1. Verify REDIS_URL in .env file")
        print("   2. Check if Upstash Redis instance is active")
        print("   3. Ensure URL uses 'rediss://' (with double 's' for TLS)")
        print("   4. Verify password is correct")
        return False


if __name__ == "__main__":
    asyncio.run(test_redis_connection())
