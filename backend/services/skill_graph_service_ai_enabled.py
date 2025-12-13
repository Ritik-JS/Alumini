"""
Skill Graph Service - Manage skill relationships and analytics with AI/ML
Auto-populates from alumni profiles and job postings
Phase 10.3: Enhanced with AI/ML embeddings and FAISS similarity (FULLY ENABLED)
"""
import logging
import json
import numpy as np
from typing import Dict, List, Optional, Set
from collections import Counter

logger = logging.getLogger(__name__)

# ============================================================================
# AI/ML ENABLED - Phase 10.3 Implementation
# ============================================================================
# This version has AI/ML features ENABLED with proper error handling
# to prevent application hangs during model loading
# ============================================================================

# Try to import AI/ML libraries with graceful fallback
EMBEDDINGS_AVAILABLE = False
sentence_transformers = None
faiss = None

try:
    from sentence_transformers import SentenceTransformer
    import faiss as faiss_lib
    faiss = faiss_lib
    EMBEDDINGS_AVAILABLE = True
    logger.info("✅ AI/ML libraries loaded successfully (sentence-transformers + FAISS)")
except ImportError as e:
    logger.warning(f"⚠️ AI/ML libraries not available: {e}")
    logger.warning("⚠️ Falling back to co-occurrence based relationships")
except Exception as e:
    logger.error(f"❌ Error loading AI/ML libraries: {e}")
    logger.warning("⚠️ Falling back to co-occurrence based relationships")


class SkillGraphService:
    """Service for skill graph network and analytics with AI/ML support"""
    
    def __init__(self):
        """Initialize service with AI/ML models (if available)"""
        self.embedding_model = None
        self.faiss_index = None
        self.dimension = 384  # all-MiniLM-L6-v2 embedding dimension
        self.model_name = 'all-MiniLM-L6-v2'
        
        # Try to initialize the model with error handling
        if EMBEDDINGS_AVAILABLE:
            try:
                logger.info(f"🔄 Loading sentence-transformer model: {self.model_name}")
                logger.info("   (First time: ~90MB download, may take 30-60 seconds)")
                
                # Load model with timeout protection
                self.embedding_model = SentenceTransformer(self.model_name)
                
                logger.info("✅ Sentence-transformer model loaded successfully")
                logger.info(f"   Model dimension: {self.dimension}")
                logger.info("✅ SkillGraphService initialized with AI features enabled")
            except Exception as e:
                logger.error(f"❌ Failed to load embedding model: {e}")
                logger.warning("⚠️ Falling back to co-occurrence based relationships")
                self.embedding_model = None
        else:
            logger.info("ℹ️ SkillGraphService initialized without AI features")
            logger.info("   Install: pip install sentence-transformers faiss-cpu")
    
    async def generate_embeddings(self, db_conn, skills: List[str]) -> Dict[str, List[float]]:
        """
        Generate 384-dimensional embeddings for skills using sentence-transformers
        Phase 10.3: Core embedding generation
        
        Args:
            db_conn: Database connection
            skills: List of skill names to generate embeddings for
            
        Returns:
            Dictionary mapping skill names to embedding vectors
        """
        if not self.embedding_model:
            logger.info("⚠️ Embedding generation skipped (model not available)")
            return {}
        
        if not skills:
            logger.warning("⚠️ No skills provided for embedding generation")
            return {}
        
        try:
            logger.info(f"🔄 Generating embeddings for {len(skills)} skills...")
            
            # Generate embeddings in batches for efficiency
            batch_size = 32
            all_embeddings = []
            
            for i in range(0, len(skills), batch_size):
                batch = skills[i:i+batch_size]
                logger.info(f"   Batch {i//batch_size + 1}/{(len(skills)-1)//batch_size + 1}: Processing {len(batch)} skills")
                
                # Generate embeddings
                batch_embeddings = self.embedding_model.encode(
                    batch,
                    convert_to_numpy=True,
                    show_progress_bar=False
                )
                all_embeddings.extend(batch_embeddings)
            
            # Convert to dictionary
            embeddings_map = {
                skill: embedding.tolist()
                for skill, embedding in zip(skills, all_embeddings)
            }
            
            logger.info(f"✅ Generated {len(embeddings_map)} embeddings")
            
            # Store embeddings in database
            for skill_name, embedding_vector in embeddings_map.items():
                async with db_conn.cursor() as cursor:
                    await cursor.execute("""
                        INSERT INTO skill_embeddings (skill_name, embedding_vector)
                        VALUES (%s, %s)
                        ON DUPLICATE KEY UPDATE
                            embedding_vector = VALUES(embedding_vector),
                            updated_at = NOW()
                    """, (
                        skill_name,
                        json.dumps(embedding_vector)
                    ))
            
            await db_conn.commit()
            logger.info(f"✅ Stored embeddings in database")
            
            return embeddings_map
        
        except Exception as e:
            logger.error(f"❌ Error generating embeddings: {str(e)}")
            return {}
    
    async def calculate_similarities_faiss(
        self, 
        db_conn, 
        skills: List[str], 
        embeddings_array: np.ndarray
    ) -> int:
        """
        Calculate pairwise similarities using FAISS for fast vector search
        Phase 10.3: FAISS-based similarity calculation
        
        Args:
            db_conn: Database connection
            skills: List of skill names (same order as embeddings)
            embeddings_array: Numpy array of embeddings (shape: [n_skills, 384])
            
        Returns:
            Number of similarity pairs calculated
        """
        if not faiss or embeddings_array is None or len(embeddings_array) == 0:
            logger.info("⚠️ FAISS similarity calculation skipped")
            return 0
        
        try:
            logger.info(f"🔄 Building FAISS index for {len(skills)} skills...")
            
            # Normalize embeddings for cosine similarity
            embeddings_normalized = embeddings_array / np.linalg.norm(
                embeddings_array, axis=1, keepdims=True
            )
            
            # Build FAISS index (IndexFlatIP for cosine similarity)
            index = faiss.IndexFlatIP(self.dimension)
            index.add(embeddings_normalized.astype('float32'))
            
            logger.info(f"✅ FAISS index built successfully")
            logger.info(f"   Index type: IndexFlatIP (cosine similarity)")
            logger.info(f"   Total vectors: {index.ntotal}")
            
            # Calculate top-10 similar skills for each skill
            logger.info(f"🔄 Calculating similarities...")
            k = 11  # Top 11 (includes self, which we'll skip)
            similarities_count = 0
            
            # Clear existing similarities (optional - for rebuild)
            async with db_conn.cursor() as cursor:
                await cursor.execute("DELETE FROM skill_similarities")
            await db_conn.commit()
            
            # Search for similar skills
            distances, indices = index.search(
                embeddings_normalized.astype('float32'), 
                k
            )
            
            # Store similarities in database
            for i, skill_name in enumerate(skills):
                similar_indices = indices[i][1:]  # Skip self (index 0)
                similar_scores = distances[i][1:]
                
                for similar_idx, score in zip(similar_indices, similar_scores):
                    if similar_idx < len(skills):
                        similar_skill = skills[similar_idx]
                        
                        # Only store if similarity is meaningful (> 0.5)
                        if score > 0.5:
                            async with db_conn.cursor() as cursor:
                                await cursor.execute("""
                                    INSERT INTO skill_similarities 
                                    (skill_1, skill_2, similarity_score)
                                    VALUES (%s, %s, %s)
                                """, (
                                    skill_name,
                                    similar_skill,
                                    float(score)
                                ))
                            similarities_count += 1
            
            await db_conn.commit()
            logger.info(f"✅ Calculated and stored {similarities_count} similarity pairs")
            
            return similarities_count
        
        except Exception as e:
            logger.error(f"❌ Error calculating similarities: {str(e)}")
            return 0
    
    async def build_skill_graph(self, db_conn) -> Dict:
        """
        Build skill graph from alumni profiles and job postings
        Updates skill_graph table with relationships
        Now includes AI/ML embeddings and similarities
        """
        try:
            # Extract all skills from alumni profiles
            async with db_conn.cursor() as cursor:
                await cursor.execute("""
                    SELECT skills FROM alumni_profiles
                    WHERE skills IS NOT NULL AND skills != 'null'
                """)
                profile_skills = await cursor.fetchall()
            
            # Extract all skills from job postings
            async with db_conn.cursor() as cursor:
                await cursor.execute("""
                    SELECT skills_required FROM jobs
                    WHERE skills_required IS NOT NULL 
                    AND skills_required != 'null'
                    AND status = 'active'
                """)
                job_skills = await cursor.fetchall()
            
            # Parse skills and build co-occurrence matrix
            all_skills = set()
            skill_pairs = []
            
            # Process alumni profiles
            for (skills_json,) in profile_skills:
                if skills_json:
                    try:
                        skills = json.loads(skills_json) if isinstance(skills_json, str) else skills_json
                        if isinstance(skills, list):
                            skills = [s.strip() for s in skills if s and s.strip()]
                            all_skills.update(skills)
                            # Create pairs for co-occurrence
                            for i, skill1 in enumerate(skills):
                                for skill2 in skills[i+1:]:
                                    skill_pairs.append((skill1, skill2))
                    except (json.JSONDecodeError, TypeError):
                        continue
            
            # Process job postings
            for (skills_json,) in job_skills:
                if skills_json:
                    try:
                        skills = json.loads(skills_json) if isinstance(skills_json, str) else skills_json
                        if isinstance(skills, list):
                            skills = [s.strip() for s in skills if s and s.strip()]
                            all_skills.update(skills)
                            for i, skill1 in enumerate(skills):
                                for skill2 in skills[i+1:]:
                                    skill_pairs.append((skill1, skill2))
                    except (json.JSONDecodeError, TypeError):
                        continue
            
            # Count co-occurrences
            pair_counts = Counter(skill_pairs)
            
            # Build skill relationships
            skill_relations = {}
            for skill in all_skills:
                related = {}
                for (s1, s2), count in pair_counts.items():
                    if s1 == skill:
                        related[s2] = count
                    elif s2 == skill:
                        related[s1] = count
                
                # Sort by frequency and take top 10
                top_related = sorted(related.items(), key=lambda x: x[1], reverse=True)[:10]
                skill_relations[skill] = [s for s, _ in top_related]
            
            # ====================================================================
            # Phase 10.3: Generate embeddings for all skills
            # ====================================================================
            skills_list = list(all_skills)
            embeddings_map = {}
            similarities_count = 0
            
            if self.embedding_model and len(skills_list) > 0:
                logger.info(f"🤖 AI/ML Processing: Generating embeddings for {len(skills_list)} skills...")
                embeddings_map = await self.generate_embeddings(db_conn, skills_list)
                
                # Calculate similarities using FAISS
                if embeddings_map:
                    embeddings_array = np.array([embeddings_map[s] for s in skills_list])
                    similarities_count = await self.calculate_similarities_faiss(
                        db_conn, 
                        skills_list, 
                        embeddings_array
                    )
            else:
                if not self.embedding_model:
                    logger.info("ℹ️ Skipping AI/ML processing (model not available)")
                else:
                    logger.info("ℹ️ No skills to process")
            
            # Update skill_graph table
            for skill, related_skills in skill_relations.items():
                # Count alumni with this skill
                async with db_conn.cursor() as cursor:
                    await cursor.execute("""
                        SELECT COUNT(*) FROM alumni_profiles
                        WHERE JSON_CONTAINS(skills, %s)
                    """, (json.dumps(skill),))
                    result = await cursor.fetchone()
                    alumni_count = result[0] if result else 0
                
                # Count jobs requiring this skill
                async with db_conn.cursor() as cursor:
                    await cursor.execute("""
                        SELECT COUNT(*) FROM jobs
                        WHERE JSON_CONTAINS(skills_required, %s)
                        AND status = 'active'
                    """, (json.dumps(skill),))
                    result = await cursor.fetchone()
                    job_count = result[0] if result else 0
                
                # Calculate popularity score (normalized)
                popularity = (alumni_count * 0.6 + job_count * 0.4) / 10.0
                popularity = min(popularity, 9999.99)  # Cap at 9999.99 (DECIMAL(6,2))
                
                # Insert or update skill in graph
                async with db_conn.cursor() as cursor:
                    await cursor.execute("""
                        INSERT INTO skill_graph 
                        (skill_name, related_skills, alumni_count, job_count, popularity_score)
                        VALUES (%s, %s, %s, %s, %s)
                        ON DUPLICATE KEY UPDATE
                            related_skills = %s,
                            alumni_count = %s,
                            job_count = %s,
                            popularity_score = %s,
                            updated_at = NOW()
                    """, (
                        skill,
                        json.dumps(related_skills),
                        alumni_count,
                        job_count,
                        popularity,
                        # For UPDATE clause:
                        json.dumps(related_skills),
                        alumni_count,
                        job_count,
                        popularity
                    ))
                
                await db_conn.commit()
            
            return {
                "total_skills": len(all_skills),
                "relationships_mapped": len(skill_relations),
                "embeddings_generated": len(embeddings_map),
                "similarities_calculated": similarities_count,
                "ai_enabled": self.embedding_model is not None,
                "message": "Skill graph built successfully" + (
                    " with AI/ML enhancements" if self.embedding_model else ""
                )
            }
        
        except Exception as e:
            logger.error(f"Error building skill graph: {str(e)}")
            raise
    
    async def get_skills_list(
        self,
        db_conn,
        min_popularity: float = 0.0,
        limit: int = 100
    ) -> List[Dict]:
        """
        Get skills as flat array for frontend display
        Returns list of skills with all properties
        """
        try:
            async with db_conn.cursor() as cursor:
                await cursor.execute("""
                    SELECT 
                        id, skill_name, related_skills, industry_connections,
                        alumni_count, job_count, popularity_score
                    FROM skill_graph
                    WHERE popularity_score >= %s
                    ORDER BY popularity_score DESC
                    LIMIT %s
                """, (min_popularity, limit))
                results = await cursor.fetchall()
            
            skills = []
            for row in results:
                skill_data = {
                    'id': row[0],
                    'skill_name': row[1],
                    'related_skills': json.loads(row[2]) if row[2] else [],
                    'industry_connections': json.loads(row[3]) if row[3] else [],
                    'alumni_count': row[4] or 0,
                    'job_count': row[5] or 0,
                    'popularity_score': float(row[6]) if row[6] else 0.0
                }
                skills.append(skill_data)
            
            return skills
        
        except Exception as e:
            logger.error(f"Error getting skills list: {str(e)}")
            raise
    
    async def get_skill_network(
        self,
        db_conn,
        min_popularity: float = 0.0,
        limit: int = 100
    ) -> Dict:
        """
        Get skill network data for visualization
        Returns nodes and edges for graph visualization
        """
        try:
            async with db_conn.cursor() as cursor:
                await cursor.execute("""
                    SELECT 
                        id, skill_name, related_skills, industry_connections,
                        alumni_count, job_count, popularity_score
                    FROM skill_graph
                    WHERE popularity_score >= %s
                    ORDER BY popularity_score DESC
                    LIMIT %s
                """, (min_popularity, limit))
                skills = await cursor.fetchall()
            
            nodes = []
            edges = []
            
            for skill in skills:
                # Add node
                nodes.append({
                    'id': skill[1],  # skill_name
                    'label': skill[1],
                    'alumni_count': skill[4],
                    'job_count': skill[5],
                    'popularity': float(skill[6]) if skill[6] else 0.0,
                    'size': float(skill[6]) * 2 if skill[6] else 1.0
                })
                
                # Add edges for relationships
                related_skills = skill[2]
                if related_skills:
                    try:
                        related = json.loads(related_skills) if isinstance(related_skills, str) else related_skills
                        if isinstance(related, list):
                            for related_skill in related[:5]:  # Top 5 relationships
                                edges.append({
                                    'source': skill[1],
                                    'target': related_skill,
                                    'weight': 1.0
                                })
                    except (json.JSONDecodeError, TypeError):
                        continue
            
            # Identify skill clusters (simple grouping by high connectivity)
            clusters = self._identify_clusters(nodes, edges)
            
            return {
                'nodes': nodes,
                'edges': edges,
                'clusters': clusters,
                'total_skills': len(nodes)
            }
        
        except Exception as e:
            logger.error(f"Error getting skill network: {str(e)}")
            raise
    
    def _identify_clusters(self, nodes: List[Dict], edges: List[Dict]) -> List[Dict]:
        """Simple clustering based on connectivity"""
        # Group skills with strong connections
        clusters = []
        skill_connections = {}
        
        for edge in edges:
            source = edge['source']
            target = edge['target']
            
            if source not in skill_connections:
                skill_connections[source] = set()
            if target not in skill_connections:
                skill_connections[target] = set()
            
            skill_connections[source].add(target)
            skill_connections[target].add(source)
        
        # Find highly connected groups
        processed = set()
        cluster_id = 0
        
        for skill, connections in sorted(
            skill_connections.items(),
            key=lambda x: len(x[1]),
            reverse=True
        ):
            if skill in processed:
                continue
            
            if len(connections) >= 3:  # Minimum 3 connections for cluster
                cluster_skills = [skill] + list(connections)[:5]
                clusters.append({
                    'cluster_id': cluster_id,
                    'name': f"{skill} Ecosystem",
                    'skills': cluster_skills,
                    'size': len(cluster_skills)
                })
                processed.update(cluster_skills)
                cluster_id += 1
        
        return clusters[:10]  # Top 10 clusters
    
    async def get_skill_details(
        self,
        db_conn,
        skill_name: str
    ) -> Optional[Dict]:
        """Get detailed information about a specific skill"""
        try:
            async with db_conn.cursor() as cursor:
                await cursor.execute("""
                    SELECT 
                        id, skill_name, related_skills, industry_connections,
                        alumni_count, job_count, popularity_score, created_at, updated_at
                    FROM skill_graph
                    WHERE skill_name = %s
                """, (skill_name,))
                skill = await cursor.fetchone()
            
            if not skill:
                return None
            
            related_skills = skill[2]
            if related_skills:
                try:
                    related_skills = json.loads(related_skills) if isinstance(related_skills, str) else related_skills
                except (json.JSONDecodeError, TypeError):
                    related_skills = []
            
            industry_connections = skill[3]
            if industry_connections:
                try:
                    industry_connections = json.loads(industry_connections) if isinstance(industry_connections, str) else industry_connections
                except (json.JSONDecodeError, TypeError):
                    industry_connections = []
            
            return {
                'skill_name': skill[1],
                'related_skills': related_skills if related_skills else [],
                'industry_connections': industry_connections if industry_connections else [],
                'alumni_count': skill[4],
                'job_count': skill[5],
                'popularity_score': float(skill[6]) if skill[6] else 0.0,
                'created_at': skill[7],
                'updated_at': skill[8]
            }
        
        except Exception as e:
            logger.error(f"Error getting skill details: {str(e)}")
            raise
    
    async def find_career_paths_by_skill(
        self,
        db_conn,
        skill_name: str,
        limit: int = 10
    ) -> List[Dict]:
        """
        Find common career paths for alumni with a specific skill
        """
        try:
            # Find alumni with this skill
            async with db_conn.cursor() as cursor:
                await cursor.execute("""
                    SELECT 
                        ap.user_id, ap.current_role, ap.current_company,
                        ap.batch_year, ap.years_of_experience
                    FROM alumni_profiles ap
                    WHERE JSON_CONTAINS(ap.skills, %s)
                    AND ap.current_role IS NOT NULL
                    ORDER BY ap.years_of_experience DESC
                    LIMIT %s
                """, (json.dumps(skill_name), limit * 2))
                alumni = await cursor.fetchall()
            
            # Group by role
            role_distribution = {}
            for alum in alumni:
                role = alum[1]
                if role:
                    if role not in role_distribution:
                        role_distribution[role] = {
                            'count': 0,
                            'companies': [],
                            'avg_experience': 0,
                            'total_experience': 0
                        }
                    role_distribution[role]['count'] += 1
                    if alum[2]:  # company
                        role_distribution[role]['companies'].append(alum[2])
                    if alum[4]:  # years_of_experience
                        role_distribution[role]['total_experience'] += alum[4]
            
            # Calculate averages and format response
            paths = []
            for role, data in sorted(
                role_distribution.items(),
                key=lambda x: x[1]['count'],
                reverse=True
            )[:limit]:
                avg_exp = data['total_experience'] / data['count'] if data['count'] > 0 else 0
                top_companies = Counter(data['companies']).most_common(5)
                
                paths.append({
                    'role': role,
                    'alumni_count': data['count'],
                    'average_experience_years': round(avg_exp, 1),
                    'top_companies': [comp for comp, _ in top_companies]
                })
            
            return paths
        
        except Exception as e:
            logger.error(f"Error finding career paths by skill: {str(e)}")
            raise
    
    async def get_trending_skills(
        self,
        db_conn,
        limit: int = 20
    ) -> List[Dict]:
        """Get trending skills based on recent job postings"""
        try:
            async with db_conn.cursor() as cursor:
                await cursor.execute("""
                    SELECT 
                        sg.skill_name, sg.alumni_count, sg.job_count,
                        sg.popularity_score
                    FROM skill_graph sg
                    WHERE sg.job_count > 0
                    ORDER BY sg.popularity_score DESC, sg.job_count DESC
                    LIMIT %s
                """, (limit,))
                skills = await cursor.fetchall()
            
            return [
                {
                    'skill_name': s[0],
                    'alumni_count': s[1],
                    'job_demand': s[2],
                    'popularity_score': float(s[3]) if s[3] else 0.0,
                    'trend': 'high' if s[2] > s[1] else 'stable'
                }
                for s in skills
            ]
        
        except Exception as e:
            logger.error(f"Error getting trending skills: {str(e)}")
            raise
    
    async def get_related_skills_ai(
        self,
        db_conn,
        skill_name: str,
        limit: int = 10
    ) -> List[Dict]:
        """
        Get related skills using AI-based similarity (FAISS embeddings)
        Phase 10.3: AI-powered skill recommendations
        """
        try:
            # Try to get from pre-computed similarities first
            async with db_conn.cursor() as cursor:
                await cursor.execute("""
                    SELECT skill_2, similarity_score
                    FROM skill_similarities
                    WHERE skill_1 = %s
                    ORDER BY similarity_score DESC
                    LIMIT %s
                """, (skill_name, limit))
                similarities = await cursor.fetchall()
            
            if similarities:
                result = []
                for similar_skill, score in similarities:
                    # Get additional info about related skill
                    async with db_conn.cursor() as cursor:
                        await cursor.execute("""
                            SELECT alumni_count, job_count, popularity_score
                            FROM skill_graph
                            WHERE skill_name = %s
                        """, (similar_skill,))
                        skill_info = await cursor.fetchone()
                    
                    result.append({
                        'skill': similar_skill,
                        'similarity_score': float(score),
                        'alumni_count': skill_info[0] if skill_info else 0,
                        'job_count': skill_info[1] if skill_info else 0,
                        'popularity': float(skill_info[2]) if skill_info and skill_info[2] else 0.0
                    })
                
                return result
            
            # Fallback to co-occurrence based relations if no AI similarities
            skill_details = await self.get_skill_details(db_conn, skill_name)
            if skill_details and skill_details.get('related_skills'):
                return [
                    {'skill': s, 'similarity_score': 0.0, 'source': 'co-occurrence'}
                    for s in skill_details['related_skills'][:limit]
                ]
            
            return []
        
        except Exception as e:
            logger.error(f"Error getting AI-based related skills: {str(e)}")
            raise
