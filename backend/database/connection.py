"""Database connection management"""

import pymysql
import os
from typing import Optional
import logging

logger = logging.getLogger(__name__)

db_pool: Optional[aiomysql.Pool] = None


async def get_db_pool() -> aiomysql.Pool:
    """Get or create database connection pool"""
    global db_pool
    if db_pool is None:
        db_pool = await aiomysql.create_pool(
            host=os.environ.get('DB_HOST', 'localhost'),
            port=int(os.environ.get('DB_PORT', 3306)),
            user=os.environ.get('DB_USER', 'alumni_user'),
            password=os.environ.get('DB_PASSWORD', 'alumni_pass_123'),
            db=os.environ.get('DB_NAME', 'AlumUnity'),
            charset='utf8mb4',
            autocommit=False,
            minsize=1,
            maxsize=10
        )
        logger.info("Database connection pool created")
    return db_pool


async def close_db_pool():
    """Close database connection pool"""
    global db_pool
    if db_pool:
        db_pool.close()
        await db_pool.wait_closed()
        db_pool = None
        logger.info("Database connection pool closed")


async def get_db_connection():
    """Get database connection from pool (context manager) - FOR ASYNC USE ONLY"""
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        yield conn


def get_sync_db_connection():
    """Get synchronous database connection - FOR SYNC ROUTES"""
    try:
        connection = pymysql.connect(
            host=os.environ.get('DB_HOST', 'localhost'),
            port=int(os.environ.get('DB_PORT', 3306)),
            user=os.environ.get('DB_USER', 'alumni_user'),
            password=os.environ.get('DB_PASSWORD', 'alumni_pass_123'),
            database=os.environ.get('DB_NAME', 'AlumUnity'),
            charset='utf8mb4',
            cursorclass=pymysql.cursors.DictCursor
        )
        return connection
    except Exception as e:
        logger.error(f"Failed to create sync database connection: {str(e)}")
        raise
