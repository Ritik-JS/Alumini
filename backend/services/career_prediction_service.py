"""
Career Path Prediction Service
Provides ML-based and rule-based career path predictions with LLM enhancement
"""
import logging
import json
from typing import Dict, List, Optional
from collections import Counter
from datetime import datetime

from ml.model_loader import get_model_loader
from ml.llm_advisor import get_llm_advisor

logger = logging.getLogger(__name__)


class CareerPredictionService:
    """Service for career path predictions and analysis"""
    
    async def predict_career_path(
        self,
        db_conn,
        user_id: str
    ) -> Dict:
        """
        Predict career trajectory for a user based on current role and skills
        Uses ML model when available, falls back to rule-based logic
        Enhanced with LLM-generated personalized advice
        """
        try:
            # Get user's current profile
            async with db_conn.cursor() as cursor:
                await cursor.execute("""
                    SELECT 
                        current_role, current_company, skills, 
                        years_of_experience, batch_year, industry
                    FROM alumni_profiles
                    WHERE user_id = %s
                """, (user_id,))
                profile = await cursor.fetchone()
            
            if not profile:
                raise ValueError("User profile not found")
            
            current_role = profile[0] or "Unknown"
            current_company = profile[1]
            skills = profile[2]
            years_exp = profile[3] or 0
            batch_year = profile[4]
            industry = profile[5] or "Unknown"
            
            # Parse skills
            user_skills = []
            if skills:
                try:
                    user_skills = json.loads(skills) if isinstance(skills, str) else skills
                    if not isinstance(user_skills, list):
                        user_skills = []
                except (json.JSONDecodeError, TypeError):
                    user_skills = []
            
            # Try ML model prediction first
            ml_predictions = await self._get_ml_predictions(
                current_role, user_skills, years_exp, industry
            )
            
            # Get career transitions from database (rule-based or ML-enhanced)
            if ml_predictions:
                logger.info("Using ML model predictions")
                predicted_roles = await self._enhance_ml_predictions_with_db(
                    db_conn, ml_predictions, user_skills
                )
            else:
                logger.info("Using rule-based predictions")
                predicted_roles = await self._get_predicted_roles(
                    db_conn, current_role, user_skills, years_exp
                )
            
            # Get recommended skills
            recommended_skills = await self._get_recommended_skills(
                db_conn, current_role, predicted_roles
            )
            
            # Find similar alumni
            similar_alumni = await self._find_similar_alumni(
                db_conn, user_id, current_role, user_skills, years_exp
            )
            
            # Calculate confidence score
            confidence_score = await self._calculate_confidence(
                db_conn, current_role, len(user_skills), years_exp
            )
            
            # Generate LLM-based personalized advice
            user_profile_dict = {
                "current_role": current_role,
                "current_company": current_company,
                "skills": user_skills,
                "years_of_experience": years_exp,
                "industry": industry
            }
            
            personalized_advice = await self._generate_personalized_advice(
                user_profile_dict, predicted_roles, similar_alumni
            )
            
            # Store prediction
            prediction_id = await self._store_prediction(
                db_conn,
                user_id,
                current_role,
                predicted_roles,
                recommended_skills,
                similar_alumni,
                confidence_score
            )
            
            return {
                "prediction_id": prediction_id,
                "current_role": current_role,
                "current_company": current_company,
                "years_of_experience": years_exp,
                "industry": industry,
                "predicted_roles": predicted_roles,
                "recommended_skills": recommended_skills,
                "similar_alumni": similar_alumni,
                "confidence_score": confidence_score,
                "personalized_advice": personalized_advice,
                "prediction_method": "ml" if ml_predictions else "rule-based",
                "prediction_date": datetime.now().isoformat()
            }
        
        except Exception as e:
            logger.error(f"Error predicting career path: {str(e)}")
            raise
    
    async def _get_ml_predictions(
        self,
        current_role: str,
        user_skills: List[str],
        years_exp: int,
        industry: str
    ) -> Optional[List[Dict]]:
        """
        Get predictions from trained ML model
        
        Args:
            current_role: User's current job role
            user_skills: List of user's skills
            years_exp: Years of experience
            industry: User's industry
        
        Returns:
            List of ML predictions or None if model unavailable
        """
        try:
            # Get the model loader singleton
            model_loader = get_model_loader()
            
            if not model_loader.is_loaded():
                logger.info("ML model not loaded, will use rule-based predictions")
                return None
            
            # Prepare user profile for prediction
            user_profile = {
                "current_role": current_role,
                "skills": user_skills,
                "years_of_experience": years_exp,
                "industry": industry,
                "transition_duration": 24,  # Default estimate
                "success_rating": 3  # Neutral default
            }
            
            # Get ML predictions
            predictions = model_loader.predict(user_profile)
            
            if predictions and len(predictions) > 0:
                logger.info(f"ML model returned {len(predictions)} predictions")
                return predictions
            else:
                logger.info("ML model returned no predictions")
                return None
                
        except Exception as e:
            logger.error(f"Error getting ML predictions: {str(e)}")
            return None
    
    async def _enhance_ml_predictions_with_db(
        self,
        db_conn,
        ml_predictions: List[Dict],
        user_skills: List[str]
    ) -> List[Dict]:
        """
        Enhance ML predictions with database information (skills, timeframes, success rates)
        
        Args:
            db_conn: Database connection
            ml_predictions: Raw predictions from ML model
            user_skills: User's current skills
        
        Returns:
            Enhanced predictions with additional metadata
        """
        enhanced_predictions = []
        
        try:
            for pred in ml_predictions[:5]:  # Top 5 predictions
                role = pred.get('role', '')
                probability = pred.get('probability', 0.5)
                
                # Try to get additional info from career transition matrix
                async with db_conn.cursor() as cursor:
                    await cursor.execute("""
                        SELECT 
                            avg_duration_months,
                            required_skills,
                            success_rate
                        FROM career_transition_matrix
                        WHERE to_role = %s
                        ORDER BY transition_probability DESC
                        LIMIT 1
                    """, (role,))
                    db_info = await cursor.fetchone()
                
                # Extract database info or use defaults
                if db_info:
                    duration_months = db_info[0] or 24
                    required_skills_raw = db_info[1]
                    success_rate = float(db_info[2]) if db_info[2] else 0.7
                    
                    # Parse required skills
                    required_skills = []
                    if required_skills_raw:
                        try:
                            required_skills = json.loads(required_skills_raw) if isinstance(required_skills_raw, str) else required_skills_raw
                            if not isinstance(required_skills, list):
                                required_skills = []
                        except (json.JSONDecodeError, TypeError):
                            required_skills = []
                else:
                    duration_months = 24
                    required_skills = []
                    success_rate = 0.7
                
                # Calculate skill match percentage
                if required_skills and user_skills:
                    matching_skills = set(required_skills) & set(user_skills)
                    skill_match_ratio = len(matching_skills) / len(required_skills) if required_skills else 0.5
                else:
                    skill_match_ratio = 0.5
                
                # Build enhanced prediction
                enhanced_predictions.append({
                    "role": role,
                    "probability": round(probability, 3),
                    "timeframe_months": duration_months,
                    "required_skills": required_skills,
                    "skill_match_percentage": round(skill_match_ratio * 100, 1),
                    "success_rate": round(success_rate, 3),
                    "confidence": pred.get('confidence', 'medium'),
                    "source": "ml_model"
                })
            
            # Sort by probability
            enhanced_predictions.sort(key=lambda x: x['probability'], reverse=True)
            
            return enhanced_predictions
            
        except Exception as e:
            logger.error(f"Error enhancing ML predictions: {str(e)}")
            # Return basic predictions if enhancement fails
            return [
                {
                    "role": p.get('role', 'Unknown'),
                    "probability": p.get('probability', 0.5),
                    "timeframe_months": 24,
                    "required_skills": [],
                    "skill_match_percentage": 50.0,
                    "success_rate": 0.7,
                    "source": "ml_model"
                }
                for p in ml_predictions[:5]
            ]
    
    async def _generate_personalized_advice(
        self,
        user_profile: Dict,
        predicted_roles: List[Dict],
        similar_alumni: List[Dict]
    ) -> str:
        """
        Generate personalized career advice using LLM
        
        Args:
            user_profile: User's profile information
            predicted_roles: List of predicted career paths
            similar_alumni: List of similar alumni for reference
        
        Returns:
            Personalized advice string
        """
        try:
            # Get LLM advisor
            llm_advisor = get_llm_advisor()
            
            # Generate advice using LLM
            advice = await llm_advisor.generate_career_advice(
                user_profile=user_profile,
                predictions=predicted_roles,
                similar_alumni=similar_alumni
            )
            
            if advice:
                return advice
            else:
                # Return fallback advice if LLM fails
                return self._generate_fallback_advice(user_profile, predicted_roles)
                
        except Exception as e:
            logger.error(f"Error generating personalized advice: {str(e)}")
            return self._generate_fallback_advice(user_profile, predicted_roles)
    
    def _generate_fallback_advice(
        self,
        user_profile: Dict,
        predicted_roles: List[Dict]
    ) -> str:
        """
        Generate basic advice when LLM is unavailable
        """
        current_role = user_profile.get('current_role', 'your current role')
        years_exp = user_profile.get('years_of_experience', 0)
        skills = user_profile.get('skills', [])
        
        advice_parts = []
        
        # Introduction
        advice_parts.append(f"Based on your profile as a {current_role} with {years_exp} years of experience, here are your career insights:")
        
        # Top prediction advice
        if predicted_roles:
            top_role = predicted_roles[0]
            advice_parts.append(f"\n\n**Top Career Path:** {top_role.get('role', 'N/A')}")
            advice_parts.append(f"- Probability: {top_role.get('probability', 0)*100:.1f}%")
            advice_parts.append(f"- Typical timeframe: {top_role.get('timeframe_months', 24)} months")
            
            # Skills gap analysis
            required_skills = top_role.get('required_skills', [])
            if required_skills and skills:
                missing_skills = set(required_skills) - set(skills)
                if missing_skills:
                    advice_parts.append(f"\n**Skills to develop:** {', '.join(list(missing_skills)[:5])}")
        
        # General recommendations
        advice_parts.append("\n\n**Recommendations:**")
        advice_parts.append("1. Focus on building leadership and communication skills")
        advice_parts.append("2. Seek mentorship from senior professionals in your target role")
        advice_parts.append("3. Take on stretch projects that align with your career goals")
        advice_parts.append("4. Network with alumni who have made similar transitions")
        
        return "\n".join(advice_parts)
    
    async def _get_predicted_roles(
        self,
        db_conn,
        current_role: str,
        user_skills: List[str],
        years_exp: int
    ) -> List[Dict]:
        """
        Get predicted next roles based on career transition matrix
        Rule-based logic - can be replaced with ML model
        """
        # Query career transition matrix
        async with db_conn.cursor() as cursor:
            await cursor.execute("""
                SELECT 
                    to_role, 
                    transition_probability,
                    avg_duration_months,
                    required_skills,
                    success_rate
                FROM career_transition_matrix
                WHERE from_role = %s
                ORDER BY transition_probability DESC
                LIMIT 5
            """, (current_role,))
            transitions = await cursor.fetchall()
        
        predicted_roles = []
        
        if transitions:
            # Use database transitions
            for trans in transitions:
                to_role = trans[0]
                probability = float(trans[1]) if trans[1] else 0.5
                duration_months = trans[2] or 24
                required_skills = trans[3]
                success_rate = float(trans[4]) if trans[4] else 0.7
                
                # Parse required skills
                req_skills = []
                if required_skills:
                    try:
                        req_skills = json.loads(required_skills) if isinstance(required_skills, str) else required_skills
                        if not isinstance(req_skills, list):
                            req_skills = []
                    except (json.JSONDecodeError, TypeError):
                        req_skills = []
                
                # Calculate skill match
                if req_skills and user_skills:
                    matching_skills = set(req_skills) & set(user_skills)
                    skill_match_ratio = len(matching_skills) / len(req_skills)
                else:
                    skill_match_ratio = 0.5
                
                # Adjust probability based on skill match
                adjusted_probability = probability * (0.5 + 0.5 * skill_match_ratio)
                
                predicted_roles.append({
                    "role": to_role,
                    "probability": round(adjusted_probability, 3),
                    "timeframe_months": duration_months,
                    "required_skills": req_skills,
                    "skill_match_percentage": round(skill_match_ratio * 100, 1),
                    "success_rate": round(success_rate, 3)
                })
        else:
            # Fallback: Rule-based predictions
            predicted_roles = await self._rule_based_predictions(
                db_conn, current_role, user_skills, years_exp
            )
        
        return predicted_roles
    
    async def _rule_based_predictions(
        self,
        db_conn,
        current_role: str,
        user_skills: List[str],
        years_exp: int
    ) -> List[Dict]:
        """
        Fallback rule-based prediction when no historical data exists
        """
        # Common career progressions (rules)
        role_progressions = {
            "Software Engineer": ["Senior Software Engineer", "Tech Lead", "Engineering Manager"],
            "Senior Software Engineer": ["Tech Lead", "Engineering Manager", "Principal Engineer"],
            "Product Manager": ["Senior Product Manager", "Product Lead", "Director of Product"],
            "Data Analyst": ["Senior Data Analyst", "Data Scientist", "Analytics Manager"],
            "Marketing Manager": ["Senior Marketing Manager", "Marketing Director", "VP Marketing"],
        }
        
        # Get next roles
        next_roles = []
        for key in role_progressions:
            if key.lower() in current_role.lower():
                next_roles = role_progressions[key]
                break
        
        if not next_roles:
            # Generic progression based on seniority
            if "junior" in current_role.lower():
                next_roles = [current_role.replace("Junior", "Senior").replace("junior", "")]
            elif "senior" in current_role.lower():
                next_roles = [current_role.replace("Senior", "Lead").replace("senior", "")]
            else:
                next_roles = [f"Senior {current_role}", f"Lead {current_role}"]
        
        predicted = []
        base_probability = 0.6
        for i, role in enumerate(next_roles[:3]):
            predicted.append({
                "role": role,
                "probability": round(base_probability - (i * 0.15), 3),
                "timeframe_months": 24 + (i * 12),
                "required_skills": user_skills[:5],  # Use user's current skills
                "skill_match_percentage": 75.0 - (i * 10),
                "success_rate": 0.7 - (i * 0.1)
            })
        
        return predicted
    
    async def _get_recommended_skills(
        self,
        db_conn,
        current_role: str,
        predicted_roles: List[Dict]
    ) -> List[str]:
        """
        Get skills recommended for career growth
        """
        all_skills = set()
        
        # Collect skills from predicted roles
        for role in predicted_roles[:3]:
            if 'required_skills' in role:
                all_skills.update(role['required_skills'])
        
        # Also get skills from skill graph for current role context
        async with db_conn.cursor() as cursor:
            await cursor.execute("""
                SELECT DISTINCT skill_name
                FROM skill_graph
                WHERE job_count > 0
                ORDER BY popularity_score DESC
                LIMIT 10
            """)
            trending_skills = await cursor.fetchall()
        
        # Add some trending skills
        for skill in trending_skills[:5]:
            all_skills.add(skill[0])
        
        return list(all_skills)[:10]
    
    async def _find_similar_alumni(
        self,
        db_conn,
        user_id: str,
        current_role: str,
        user_skills: List[str],
        years_exp: int
    ) -> List[Dict]:
        """
        Find alumni with similar profiles who made successful transitions
        """
        try:
            # Find alumni with similar role and experience
            async with db_conn.cursor() as cursor:
                await cursor.execute("""
                    SELECT 
                        ap.user_id, ap.name, ap.current_role, 
                        ap.current_company, ap.years_of_experience,
                        ap.skills, ap.photo_url
                    FROM alumni_profiles ap
                    WHERE ap.user_id != %s
                    AND ap.current_role IS NOT NULL
                    AND ap.years_of_experience BETWEEN %s AND %s
                    LIMIT 10
                """, (user_id, max(0, years_exp - 3), years_exp + 3))
                similar = await cursor.fetchall()
            
            similar_alumni = []
            for alum in similar[:5]:
                alum_skills = []
                if alum[5]:
                    try:
                        alum_skills = json.loads(alum[5]) if isinstance(alum[5], str) else alum[5]
                        if not isinstance(alum_skills, list):
                            alum_skills = []
                    except (json.JSONDecodeError, TypeError):
                        alum_skills = []
                
                # Calculate similarity (Jaccard similarity)
                if user_skills and alum_skills:
                    intersection = len(set(user_skills) & set(alum_skills))
                    union = len(set(user_skills) | set(alum_skills))
                    similarity = (intersection / union) if union > 0 else 0
                else:
                    similarity = 0.5
                
                similar_alumni.append({
                    "user_id": alum[0],
                    "name": alum[1],
                    "current_role": alum[2],
                    "current_company": alum[3],
                    "years_of_experience": alum[4],
                    "photo_url": alum[6],
                    "similarity_score": round(similarity, 3)
                })
            
            return sorted(similar_alumni, key=lambda x: x['similarity_score'], reverse=True)
        
        except Exception as e:
            logger.error(f"Error finding similar alumni: {str(e)}")
            return []
    
    async def _calculate_confidence(
        self,
        db_conn,
        current_role: str,
        skills_count: int,
        years_exp: int
    ) -> float:
        """
        Calculate confidence score for prediction
        """
        # Base confidence
        confidence = 0.5
        
        # Boost based on data availability
        async with db_conn.cursor() as cursor:
            await cursor.execute("""
                SELECT COUNT(*) FROM career_transition_matrix
                WHERE from_role = %s
            """, (current_role,))
            result = await cursor.fetchone()
            transition_count = result[0] if result else 0
        
        # Adjust confidence
        if transition_count >= 5:
            confidence += 0.3
        elif transition_count >= 2:
            confidence += 0.2
        
        # Skills factor
        if skills_count >= 5:
            confidence += 0.1
        
        # Experience factor
        if years_exp >= 3:
            confidence += 0.1
        
        return min(confidence, 0.95)  # Cap at 95%
    
    async def _store_prediction(
        self,
        db_conn,
        user_id: str,
        current_role: str,
        predicted_roles: List[Dict],
        recommended_skills: List[str],
        similar_alumni: List[Dict],
        confidence_score: float
    ) -> str:
        """
        Store prediction in database
        """
        async with db_conn.cursor() as cursor:
            await cursor.execute("""
                INSERT INTO career_predictions 
                (user_id, current_role, predicted_roles, recommended_skills, 
                 similar_alumni, confidence_score)
                VALUES (%s, %s, %s, %s, %s, %s)
            """, (
                user_id,
                current_role,
                json.dumps(predicted_roles),
                json.dumps(recommended_skills),
                json.dumps([a['user_id'] for a in similar_alumni]),
                confidence_score
            ))
            
            await db_conn.commit()
            
            # Get the inserted ID
            await cursor.execute("SELECT LAST_INSERT_ID()")
            result = await cursor.fetchone()
            prediction_id = result[0] if result else None
            
            return str(prediction_id) if prediction_id else "unknown"
    
    async def get_common_career_paths(
        self,
        db_conn,
        limit: int = 20,
        starting_role: Optional[str] = None,
        target_role: Optional[str] = None
    ) -> List[Dict]:
        """
        Get most common career transitions across all alumni
        Returns data formatted for frontend consumption
        
        Args:
            db_conn: Database connection
            limit: Maximum number of paths to return
            starting_role: Filter by starting role (from_role)
            target_role: Filter by target role (to_role)
        """
        try:
            # Build dynamic query with filters
            query = """
                SELECT 
                    from_role, to_role, transition_count,
                    transition_probability, avg_duration_months, 
                    success_rate, required_skills
                FROM career_transition_matrix
                WHERE transition_count > 0
            """
            params = []
            
            # Add filters if provided
            if starting_role:
                query += " AND from_role = %s"
                params.append(starting_role)
            
            if target_role:
                query += " AND to_role = %s"
                params.append(target_role)
            
            query += " ORDER BY transition_count DESC, transition_probability DESC LIMIT %s"
            params.append(limit)
            
            async with db_conn.cursor() as cursor:
                await cursor.execute(query, tuple(params))
                paths = await cursor.fetchall()
            
            result = []
            for idx, p in enumerate(paths):
                # Parse required skills
                required_skills = []
                if p[6]:
                    try:
                        required_skills = json.loads(p[6]) if isinstance(p[6], str) else p[6]
                        if not isinstance(required_skills, list):
                            required_skills = []
                    except (json.JSONDecodeError, TypeError):
                        required_skills = []
                
                result.append({
                    "id": f"path-{idx}",
                    "starting_role": p[0],
                    "target_role": p[1],
                    "alumni_count": p[2] or 0,
                    "transition_percentage": round(float(p[3]) * 100, 1) if p[3] else 0,
                    "avg_years": round((p[4] or 24) / 12, 1),
                    "avg_duration_months": p[4] or 24,
                    "success_rate": float(p[5]) if p[5] else 0.7,
                    "common_skills": required_skills[:10],  # Frontend expects common_skills
                    "required_skills": required_skills,
                    "success_stories": [],  # Can be populated later with actual alumni stories
                    # Also include backend field names for compatibility
                    "from_role": p[0],
                    "to_role": p[1],
                    "transition_count": p[2],
                    "probability": float(p[3]) if p[3] else 0
                })
            
            return result
        
        except Exception as e:
            logger.error(f"Error getting common career paths: {str(e)}")
            raise
    
    async def get_career_transitions_by_skill(
        self,
        db_conn,
        skill: str,
        limit: int = 10
    ) -> List[Dict]:
        """
        Get career transitions where a specific skill is required
        """
        try:
            async with db_conn.cursor() as cursor:
                await cursor.execute("""
                    SELECT 
                        from_role, to_role, transition_probability,
                        avg_duration_months, required_skills, success_rate
                    FROM career_transition_matrix
                    WHERE JSON_CONTAINS(required_skills, %s)
                    ORDER BY transition_probability DESC
                    LIMIT %s
                """, (json.dumps(skill), limit))
                transitions = await cursor.fetchall()
            
            result = []
            for trans in transitions:
                req_skills = []
                if trans[4]:
                    try:
                        req_skills = json.loads(trans[4]) if isinstance(trans[4], str) else trans[4]
                    except (json.JSONDecodeError, TypeError):
                        req_skills = []
                
                result.append({
                    "from_role": trans[0],
                    "to_role": trans[1],
                    "probability": float(trans[2]) if trans[2] else 0,
                    "timeframe_months": trans[3] or 24,
                    "required_skills": req_skills,
                    "success_rate": float(trans[5]) if trans[5] else 0.7
                })
            
            return result
        
        except Exception as e:
            logger.error(f"Error getting career transitions by skill: {str(e)}")
            raise


# ML MODEL PLACEHOLDER
# This is where the actual ML model would be integrated
# See ML_MODEL_GUIDE.md for implementation details
class MLCareerPredictor:
    """
    Placeholder for ML-based career path prediction
    Replace this with actual ML model implementation
    """
    
    def __init__(self):
        self.model = None  # Load trained model here
        logger.info("ML Career Predictor placeholder initialized")
    
    async def predict(self, features: Dict) -> List[Dict]:
        """
        Predict career paths using ML model
        
        Args:
            features: Dict containing user profile features
                - current_role: str
                - skills: List[str]
                - years_experience: int
                - industry: str
                - education_level: str
        
        Returns:
            List of predicted roles with probabilities
        """
        # TODO: Implement actual ML prediction
        # This is a placeholder that returns empty results
        logger.warning("Using ML placeholder - implement actual model")
        return []
