"""
Research Agent Service: Discussion and Analysis Engine

Implements a Claude-powered research agent with:
- Conversation memory (nanoclaw CLAUDE.md pattern)
- Skill-based dispatch system
- Context injection from HelioMetric data sources
- Scheduled task support

The agent can analyze zodiac profiles, compare compatibility,
forecast optimal periods, and conduct open-ended research discussions.
"""

import json
import os
import hashlib
from datetime import datetime, timedelta
from typing import Any, Callable, Optional
from dataclasses import dataclass, field, asdict
from enum import Enum
import httpx

# ============================================================================
# Configuration
# ============================================================================

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
RESEARCH_MEMORY_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "research_memory")
MAX_CONTEXT_MESSAGES = 20
DEFAULT_MODEL = "claude-sonnet-4-20250514"


# ============================================================================
# Data Types
# ============================================================================

class SkillType(str, Enum):
    """Available research skills"""
    ANALYZE_PROFILE = "analyze_profile"
    COMPARE_COMPATIBILITY = "compare_compatibility"
    FORECAST_PERIOD = "forecast_period"
    RESEARCH_PATTERNS = "research_patterns"
    EXPLAIN_CONCEPT = "explain_concept"
    GENERATE_REPORT = "generate_report"
    DISCUSS = "discuss"  # Free-form discussion


@dataclass
class ResearchMessage:
    """A single message in a research conversation"""
    role: str  # "user" or "assistant"
    content: str
    timestamp: str = field(default_factory=lambda: datetime.utcnow().isoformat())
    skill_used: Optional[str] = None
    context_summary: Optional[str] = None


@dataclass
class ResearchSession:
    """A research conversation session with memory"""
    session_id: str
    created_at: str
    updated_at: str
    messages: list[ResearchMessage] = field(default_factory=list)
    context: dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict:
        return {
            "session_id": self.session_id,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
            "messages": [asdict(m) for m in self.messages],
            "context": self.context,
        }

    @classmethod
    def from_dict(cls, data: dict) -> "ResearchSession":
        messages = [ResearchMessage(**m) for m in data.get("messages", [])]
        return cls(
            session_id=data["session_id"],
            created_at=data["created_at"],
            updated_at=data["updated_at"],
            messages=messages,
            context=data.get("context", {}),
        )


@dataclass
class SkillResult:
    """Result from executing a skill"""
    success: bool
    content: str
    data: Optional[dict] = None
    error: Optional[str] = None


# ============================================================================
# Skill Definitions
# ============================================================================

SKILL_DEFINITIONS = {
    SkillType.ANALYZE_PROFILE: {
        "name": "Analyze Profile",
        "description": "Generate a comprehensive personality and philosophical profile from zodiac data",
        "required_context": ["chinese_zodiac", "western_zodiac", "wu_xing_element"],
        "prompt_template": """Analyze this person's profile using the MTG Color Wheel framework integrated with their zodiac data:

Chinese Zodiac: {chinese_zodiac} ({wu_xing_element} element)
Western Zodiac: {western_zodiac}
Color Profile: {color_profile}

Provide:
1. Core philosophical alignment (which colors dominate and why)
2. Key strengths and natural strategies
3. Potential blind spots and growth areas
4. How the Eastern and Western systems reinforce or contrast each other
5. Practical recommendations for leveraging their natural tendencies"""
    },

    SkillType.COMPARE_COMPATIBILITY: {
        "name": "Compare Compatibility",
        "description": "Analyze relationship dynamics between two or more people",
        "required_context": ["profiles"],
        "prompt_template": """Analyze the compatibility between these profiles:

{profiles_description}

Consider:
1. Color wheel alignment (shared colors = philosophical harmony)
2. Wu Xing element interactions (generating vs overcoming cycles)
3. Zodiac compatibility (both Chinese and Western)
4. Potential friction points and how to navigate them
5. Strengths of the relationship and areas for collaboration
6. Specific recommendations for improving harmony"""
    },

    SkillType.FORECAST_PERIOD: {
        "name": "Forecast Period",
        "description": "Analyze upcoming time periods for optimal timing",
        "required_context": ["profile", "target_period", "temporal_state"],
        "prompt_template": """Forecast the upcoming period for this profile:

Profile: {profile_summary}
Target Period: {target_period}
Current Temporal State: {temporal_state}

Analyze:
1. How the current/upcoming year's energy interacts with their birth chart
2. Solar term influences on their element
3. Color wheel dynamics (which philosophical approaches will be favored)
4. Optimal activities and timing
5. Challenges to be aware of
6. Strategic recommendations"""
    },

    SkillType.RESEARCH_PATTERNS: {
        "name": "Research Patterns",
        "description": "Investigate historical patterns and correlations",
        "required_context": ["query", "data_sources"],
        "prompt_template": """Research the following pattern or question:

Query: {query}

Available Data:
{data_summary}

Investigate:
1. Historical patterns and correlations
2. Cross-system validation (do Eastern and Western systems agree?)
3. Color wheel philosophical insights
4. Practical applications of findings
5. Confidence level and caveats"""
    },

    SkillType.EXPLAIN_CONCEPT: {
        "name": "Explain Concept",
        "description": "Explain a concept from the HelioMetric system",
        "required_context": ["concept"],
        "prompt_template": """Explain this concept from the HelioMetric framework:

Concept: {concept}

Provide:
1. Core definition and meaning
2. How it connects to other concepts in the system
3. Practical examples
4. Common misconceptions
5. How to apply this understanding"""
    },

    SkillType.GENERATE_REPORT: {
        "name": "Generate Report",
        "description": "Generate a comprehensive analysis report",
        "required_context": ["report_type", "subjects"],
        "prompt_template": """Generate a comprehensive {report_type} report:

Subjects: {subjects_description}

Include:
1. Executive summary
2. Detailed analysis for each subject
3. Cross-subject patterns and dynamics
4. Recommendations
5. Appendix with raw data interpretations"""
    },

    SkillType.DISCUSS: {
        "name": "Open Discussion",
        "description": "Free-form research discussion",
        "required_context": [],
        "prompt_template": """{user_message}"""
    },
}


# ============================================================================
# System Prompt
# ============================================================================

SYSTEM_PROMPT = """You are the HelioMetric Research Agent, an expert in integrating multiple philosophical and astrological frameworks for personality analysis and strategic guidance.

## Your Knowledge Base

### MTG Color Wheel (Five Colors)
- White (⚪ Plains): Peace through structure & community. Values order, protection, equality.
- Blue (🔵 Island): Perfection through knowledge & control. Values logic, patience, mastery.
- Black (⚫ Swamp): Power through ambition & pragmatism. Values self-interest, resourcefulness.
- Red (🔴 Mountain): Freedom through passion & impulse. Values emotion, spontaneity, action.
- Green (🟢 Forest): Harmony through growth & instinct. Values nature, acceptance, tradition.

Adjacent colors are allies (shared philosophies), opposite colors are enemies (conflicting worldviews).
No color is "good" or "evil" - they're lenses for understanding conflict and strategy.

### Wu Xing (Five Elements) Mapping to Colors
- Metal (金) → White: Structure, purity, law
- Water (水) → Blue: Wisdom, depth, adaptability
- Earth (土) → Black: Grounding, pragmatism, resources
- Fire (火) → Red: Passion, destruction, energy
- Wood (木) → Green: Growth, vitality, nature

### Chinese Zodiac Integration
12 archetypes (Rat through Pig), each with:
- A fixed element (from their position in the cycle)
- A year element (from the 10-year Heavenly Stems)
- Associated MTG colors based on personality traits

### Western Zodiac Integration
12 signs mapped to elements (Fire, Earth, Air, Water) and modalities (Cardinal, Fixed, Mutable).
Each sign has primary and secondary color associations.

### Guild Identities (Two-Color Combinations)
- Azorius (WU): Law through knowledge
- Dimir (UB): Power through secrets
- Rakdos (BR): Freedom through chaos
- Gruul (RG): Strength through instinct
- Selesnya (GW): Peace through community
- Orzhov (WB): Control through debt
- Izzet (UR): Progress through experimentation
- Golgari (BG): Life through death
- Boros (RW): Justice through action
- Simic (GU): Evolution through understanding

## Your Approach

1. **Integrate multiple systems** - Never rely on just one framework. Cross-reference Chinese zodiac, Western zodiac, Wu Xing elements, and MTG colors.

2. **Be nuanced** - Avoid black-and-white judgments. Every trait has contexts where it's a strength and contexts where it's a weakness.

3. **Be practical** - Always include actionable recommendations. Theory should lead to application.

4. **Acknowledge uncertainty** - These systems are tools for reflection, not deterministic predictions. Use language that empowers rather than constrains.

5. **Maintain scientific framing** - Reference resonance, interference patterns, phase coherence, and other physics metaphors from the HelioMetric framework.

## Response Style
- Clear, structured responses with headers when appropriate
- Use the color symbols (⚪🔵⚫🔴🟢) to make color references visual
- Include both Eastern and Western perspectives
- End with practical recommendations when relevant"""


# ============================================================================
# Memory Management (Nanoclaw Pattern)
# ============================================================================

class MemoryManager:
    """Manages research session persistence using the nanoclaw CLAUDE.md pattern"""

    def __init__(self, memory_dir: str = RESEARCH_MEMORY_DIR):
        self.memory_dir = memory_dir
        os.makedirs(memory_dir, exist_ok=True)

    def _get_session_path(self, session_id: str) -> str:
        """Get the file path for a session"""
        safe_id = hashlib.sha256(session_id.encode()).hexdigest()[:16]
        return os.path.join(self.memory_dir, f"session_{safe_id}.json")

    def load_session(self, session_id: str) -> Optional[ResearchSession]:
        """Load a session from disk"""
        path = self._get_session_path(session_id)
        if not os.path.exists(path):
            return None
        try:
            with open(path, "r") as f:
                data = json.load(f)
                return ResearchSession.from_dict(data)
        except (json.JSONDecodeError, KeyError):
            return None

    def save_session(self, session: ResearchSession) -> None:
        """Save a session to disk"""
        path = self._get_session_path(session.session_id)
        session.updated_at = datetime.utcnow().isoformat()
        with open(path, "w") as f:
            json.dump(session.to_dict(), f, indent=2)

    def create_session(self, session_id: str, initial_context: Optional[dict] = None) -> ResearchSession:
        """Create a new session"""
        now = datetime.utcnow().isoformat()
        session = ResearchSession(
            session_id=session_id,
            created_at=now,
            updated_at=now,
            context=initial_context or {},
        )
        self.save_session(session)
        return session

    def get_or_create_session(self, session_id: str, initial_context: Optional[dict] = None) -> ResearchSession:
        """Get existing session or create new one"""
        session = self.load_session(session_id)
        if session is None:
            session = self.create_session(session_id, initial_context)
        return session

    def list_sessions(self) -> list[dict]:
        """List all sessions with metadata"""
        sessions = []
        for filename in os.listdir(self.memory_dir):
            if filename.startswith("session_") and filename.endswith(".json"):
                path = os.path.join(self.memory_dir, filename)
                try:
                    with open(path, "r") as f:
                        data = json.load(f)
                        sessions.append({
                            "session_id": data["session_id"],
                            "created_at": data["created_at"],
                            "updated_at": data["updated_at"],
                            "message_count": len(data.get("messages", [])),
                        })
                except (json.JSONDecodeError, KeyError):
                    continue
        return sorted(sessions, key=lambda s: s["updated_at"], reverse=True)


# ============================================================================
# Research Agent
# ============================================================================

class ResearchAgent:
    """Main research agent with Claude integration and skill dispatch"""

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or ANTHROPIC_API_KEY
        self.memory = MemoryManager()
        self.skills = self._register_skills()

    def _register_skills(self) -> dict[SkillType, Callable]:
        """Register skill handlers"""
        return {
            SkillType.ANALYZE_PROFILE: self._skill_analyze_profile,
            SkillType.COMPARE_COMPATIBILITY: self._skill_compare_compatibility,
            SkillType.FORECAST_PERIOD: self._skill_forecast_period,
            SkillType.RESEARCH_PATTERNS: self._skill_research_patterns,
            SkillType.EXPLAIN_CONCEPT: self._skill_explain_concept,
            SkillType.GENERATE_REPORT: self._skill_generate_report,
            SkillType.DISCUSS: self._skill_discuss,
        }

    async def _call_claude(
        self,
        messages: list[dict],
        system: str = SYSTEM_PROMPT,
        max_tokens: int = 4096,
    ) -> str:
        """Make a call to the Claude API"""
        if not self.api_key:
            return "[Error: ANTHROPIC_API_KEY not configured]"

        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                "https://api.anthropic.com/v1/messages",
                headers={
                    "x-api-key": self.api_key,
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json",
                },
                json={
                    "model": DEFAULT_MODEL,
                    "max_tokens": max_tokens,
                    "system": system,
                    "messages": messages,
                },
            )

            if response.status_code != 200:
                return f"[Error: API call failed with status {response.status_code}]"

            data = response.json()
            if "content" in data and len(data["content"]) > 0:
                return data["content"][0].get("text", "[No response content]")
            return "[No response content]"

    def _build_context_prompt(self, context: dict) -> str:
        """Build a context summary for the prompt"""
        if not context:
            return ""

        parts = ["## Current Context"]

        if "family_members" in context:
            parts.append("\n### Family Members")
            for member in context["family_members"]:
                parts.append(f"- {member.get('name', 'Unknown')}: {member.get('chinese_zodiac', '?')} ({member.get('element', '?')})")

        if "temporal_state" in context:
            ts = context["temporal_state"]
            parts.append(f"\n### Current Time")
            parts.append(f"- Year: {ts.get('year_archetype', '?')} ({ts.get('year_element', '?')})")
            parts.append(f"- Solar Term: {ts.get('solar_term', '?')}")

        if "color_profiles" in context:
            parts.append("\n### Color Profiles")
            for name, profile in context["color_profiles"].items():
                colors = profile.get("dominant_colors", [])
                parts.append(f"- {name}: {', '.join(colors)}")

        return "\n".join(parts)

    async def execute_skill(
        self,
        skill_type: SkillType,
        session_id: str,
        user_message: str,
        context: Optional[dict] = None,
    ) -> SkillResult:
        """Execute a research skill"""
        # Get or create session
        session = self.memory.get_or_create_session(session_id)

        # Update context if provided
        if context:
            session.context.update(context)

        # Get the skill handler
        handler = self.skills.get(skill_type)
        if not handler:
            return SkillResult(
                success=False,
                content="",
                error=f"Unknown skill: {skill_type}",
            )

        # Execute the skill
        result = await handler(session, user_message, context or {})

        # Save the interaction to memory
        session.messages.append(ResearchMessage(
            role="user",
            content=user_message,
            skill_used=skill_type.value,
            context_summary=self._build_context_prompt(context)[:500] if context else None,
        ))

        if result.success:
            session.messages.append(ResearchMessage(
                role="assistant",
                content=result.content,
                skill_used=skill_type.value,
            ))

        # Trim old messages if needed
        if len(session.messages) > MAX_CONTEXT_MESSAGES * 2:
            session.messages = session.messages[-MAX_CONTEXT_MESSAGES * 2:]

        self.memory.save_session(session)

        return result

    async def _skill_analyze_profile(
        self,
        session: ResearchSession,
        user_message: str,
        context: dict,
    ) -> SkillResult:
        """Analyze a personality profile"""
        template = SKILL_DEFINITIONS[SkillType.ANALYZE_PROFILE]["prompt_template"]

        prompt = template.format(
            chinese_zodiac=context.get("chinese_zodiac", "Unknown"),
            wu_xing_element=context.get("wu_xing_element", "Unknown"),
            western_zodiac=context.get("western_zodiac", "Unknown"),
            color_profile=json.dumps(context.get("color_profile", {}), indent=2),
        )

        messages = self._build_message_history(session)
        messages.append({"role": "user", "content": prompt})

        response = await self._call_claude(messages)

        return SkillResult(success=True, content=response)

    async def _skill_compare_compatibility(
        self,
        session: ResearchSession,
        user_message: str,
        context: dict,
    ) -> SkillResult:
        """Compare compatibility between profiles"""
        profiles = context.get("profiles", [])

        profiles_desc = []
        for i, p in enumerate(profiles, 1):
            profiles_desc.append(f"""
Person {i}: {p.get('name', f'Person {i}')}
- Chinese: {p.get('chinese_zodiac', '?')} ({p.get('element', '?')})
- Western: {p.get('western_zodiac', '?')}
- Colors: {', '.join(p.get('dominant_colors', []))}
""")

        template = SKILL_DEFINITIONS[SkillType.COMPARE_COMPATIBILITY]["prompt_template"]
        prompt = template.format(profiles_description="\n".join(profiles_desc))

        if user_message:
            prompt += f"\n\nAdditional question: {user_message}"

        messages = self._build_message_history(session)
        messages.append({"role": "user", "content": prompt})

        response = await self._call_claude(messages)

        return SkillResult(success=True, content=response)

    async def _skill_forecast_period(
        self,
        session: ResearchSession,
        user_message: str,
        context: dict,
    ) -> SkillResult:
        """Forecast a time period"""
        template = SKILL_DEFINITIONS[SkillType.FORECAST_PERIOD]["prompt_template"]

        profile = context.get("profile", {})
        profile_summary = f"{profile.get('name', 'Subject')}: {profile.get('chinese_zodiac', '?')} ({profile.get('element', '?')}), Colors: {', '.join(profile.get('dominant_colors', []))}"

        prompt = template.format(
            profile_summary=profile_summary,
            target_period=context.get("target_period", "upcoming month"),
            temporal_state=json.dumps(context.get("temporal_state", {}), indent=2),
        )

        if user_message:
            prompt += f"\n\nSpecific focus: {user_message}"

        messages = self._build_message_history(session)
        messages.append({"role": "user", "content": prompt})

        response = await self._call_claude(messages)

        return SkillResult(success=True, content=response)

    async def _skill_research_patterns(
        self,
        session: ResearchSession,
        user_message: str,
        context: dict,
    ) -> SkillResult:
        """Research patterns in the data"""
        template = SKILL_DEFINITIONS[SkillType.RESEARCH_PATTERNS]["prompt_template"]

        data_summary = context.get("data_summary", "No additional data provided.")

        prompt = template.format(
            query=user_message,
            data_summary=data_summary,
        )

        messages = self._build_message_history(session)
        messages.append({"role": "user", "content": prompt})

        response = await self._call_claude(messages)

        return SkillResult(success=True, content=response)

    async def _skill_explain_concept(
        self,
        session: ResearchSession,
        user_message: str,
        context: dict,
    ) -> SkillResult:
        """Explain a concept"""
        template = SKILL_DEFINITIONS[SkillType.EXPLAIN_CONCEPT]["prompt_template"]

        concept = context.get("concept", user_message)
        prompt = template.format(concept=concept)

        messages = self._build_message_history(session)
        messages.append({"role": "user", "content": prompt})

        response = await self._call_claude(messages)

        return SkillResult(success=True, content=response)

    async def _skill_generate_report(
        self,
        session: ResearchSession,
        user_message: str,
        context: dict,
    ) -> SkillResult:
        """Generate a comprehensive report"""
        template = SKILL_DEFINITIONS[SkillType.GENERATE_REPORT]["prompt_template"]

        subjects = context.get("subjects", [])
        subjects_desc = "\n".join([
            f"- {s.get('name', 'Unknown')}: {s.get('chinese_zodiac', '?')} / {s.get('western_zodiac', '?')}"
            for s in subjects
        ])

        prompt = template.format(
            report_type=context.get("report_type", "family analysis"),
            subjects_description=subjects_desc,
        )

        if user_message:
            prompt += f"\n\nAdditional requirements: {user_message}"

        messages = self._build_message_history(session)
        messages.append({"role": "user", "content": prompt})

        response = await self._call_claude(messages, max_tokens=8192)

        return SkillResult(success=True, content=response)

    async def _skill_discuss(
        self,
        session: ResearchSession,
        user_message: str,
        context: dict,
    ) -> SkillResult:
        """Free-form discussion"""
        # Build context prompt if we have session context
        context_prompt = self._build_context_prompt(session.context)

        full_message = user_message
        if context_prompt:
            full_message = f"{context_prompt}\n\n---\n\n{user_message}"

        messages = self._build_message_history(session)
        messages.append({"role": "user", "content": full_message})

        response = await self._call_claude(messages)

        return SkillResult(success=True, content=response)

    def _build_message_history(self, session: ResearchSession) -> list[dict]:
        """Build message history for Claude from session"""
        messages = []
        for msg in session.messages[-MAX_CONTEXT_MESSAGES:]:
            messages.append({
                "role": msg.role,
                "content": msg.content,
            })
        return messages

    def get_available_skills(self) -> list[dict]:
        """Get list of available skills with descriptions"""
        return [
            {
                "type": skill_type.value,
                "name": SKILL_DEFINITIONS[skill_type]["name"],
                "description": SKILL_DEFINITIONS[skill_type]["description"],
                "required_context": SKILL_DEFINITIONS[skill_type]["required_context"],
            }
            for skill_type in SkillType
        ]


# ============================================================================
# Singleton Instance
# ============================================================================

research_agent = ResearchAgent()
