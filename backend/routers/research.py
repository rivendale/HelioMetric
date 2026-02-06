"""
Research API Routes

Endpoints for the research agent and task scheduler:
- Discussion and analysis with Claude
- Skill execution
- Session management
- Scheduled task management
"""

from typing import Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from services.research_agent import (
    research_agent,
    SkillType,
)
from services.task_scheduler import (
    task_scheduler,
    ScheduleType,
    ScheduledTask,
    create_daily_forecast_task,
    create_weekly_report_task,
    create_solar_term_alert_task,
)


router = APIRouter(prefix="/api/research", tags=["research"])


# ============================================================================
# Request/Response Models
# ============================================================================

class DiscussRequest(BaseModel):
    """Request for free-form discussion"""
    session_id: str = Field(..., description="Session ID for conversation continuity")
    message: str = Field(..., description="User message")
    context: Optional[dict] = Field(None, description="Additional context data")


class SkillRequest(BaseModel):
    """Request to execute a specific skill"""
    session_id: str
    skill_type: str = Field(..., description="One of: analyze_profile, compare_compatibility, forecast_period, research_patterns, explain_concept, generate_report, discuss")
    message: str = Field("", description="Additional user message/prompt")
    context: dict = Field(default_factory=dict, description="Context data required by the skill")


class CreateTaskRequest(BaseModel):
    """Request to create a scheduled task"""
    task_id: str
    name: str
    description: str
    schedule_type: str = Field(..., description="One of: cron, interval, once")
    schedule_value: str = Field(..., description="Cron expression, interval in seconds, or ISO datetime")
    skill_type: str
    context: dict = Field(default_factory=dict)
    prompt: str = ""
    session_id: Optional[str] = None
    timezone: str = "UTC"


class ResearchResponse(BaseModel):
    """Response from research operations"""
    success: bool
    content: str = ""
    error: Optional[str] = None
    session_id: Optional[str] = None
    skill_used: Optional[str] = None


class SessionResponse(BaseModel):
    """Response with session info"""
    session_id: str
    created_at: str
    updated_at: str
    message_count: int
    context_keys: list[str]


class TaskResponse(BaseModel):
    """Response with task info"""
    task_id: str
    name: str
    description: str
    schedule_type: str
    schedule_value: str
    skill_type: str
    status: str
    last_run: Optional[str]
    next_run: Optional[str]
    run_count: int


class TaskResultResponse(BaseModel):
    """Response with task execution result"""
    task_id: str
    execution_id: str
    started_at: str
    completed_at: str
    success: bool
    result_preview: str
    error: Optional[str]
    duration_ms: int


# ============================================================================
# Discussion Endpoints
# ============================================================================

@router.post("/discuss", response_model=ResearchResponse)
async def discuss(request: DiscussRequest):
    """
    Free-form discussion with the research agent.

    Maintains conversation history in the session.
    """
    try:
        result = await research_agent.execute_skill(
            skill_type=SkillType.DISCUSS,
            session_id=request.session_id,
            user_message=request.message,
            context=request.context,
        )

        return ResearchResponse(
            success=result.success,
            content=result.content,
            error=result.error,
            session_id=request.session_id,
            skill_used="discuss",
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/skill", response_model=ResearchResponse)
async def execute_skill(request: SkillRequest):
    """
    Execute a specific research skill.

    Available skills:
    - analyze_profile: Generate personality profile from zodiac data
    - compare_compatibility: Analyze relationship dynamics
    - forecast_period: Forecast upcoming time periods
    - research_patterns: Investigate patterns and correlations
    - explain_concept: Explain a concept from the system
    - generate_report: Generate comprehensive analysis report
    - discuss: Free-form discussion
    """
    try:
        skill_type = SkillType(request.skill_type)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid skill type: {request.skill_type}. Valid types: {[s.value for s in SkillType]}"
        )

    try:
        result = await research_agent.execute_skill(
            skill_type=skill_type,
            session_id=request.session_id,
            user_message=request.message,
            context=request.context,
        )

        return ResearchResponse(
            success=result.success,
            content=result.content,
            error=result.error,
            session_id=request.session_id,
            skill_used=request.skill_type,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/skills")
async def list_skills():
    """Get list of available research skills"""
    return {
        "skills": research_agent.get_available_skills()
    }


# ============================================================================
# Session Management Endpoints
# ============================================================================

@router.get("/sessions", response_model=list[SessionResponse])
async def list_sessions():
    """List all research sessions"""
    sessions = research_agent.memory.list_sessions()
    return [
        SessionResponse(
            session_id=s["session_id"],
            created_at=s["created_at"],
            updated_at=s["updated_at"],
            message_count=s["message_count"],
            context_keys=[],  # Not included in list for brevity
        )
        for s in sessions
    ]


@router.get("/sessions/{session_id}")
async def get_session(session_id: str):
    """Get a specific session with full history"""
    session = research_agent.memory.load_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    return {
        "session_id": session.session_id,
        "created_at": session.created_at,
        "updated_at": session.updated_at,
        "message_count": len(session.messages),
        "context": session.context,
        "messages": [
            {
                "role": m.role,
                "content": m.content[:500] + "..." if len(m.content) > 500 else m.content,
                "timestamp": m.timestamp,
                "skill_used": m.skill_used,
            }
            for m in session.messages[-20:]  # Last 20 messages
        ],
    }


@router.post("/sessions/{session_id}/context")
async def update_session_context(session_id: str, context: dict):
    """Update the context for a session"""
    session = research_agent.memory.get_or_create_session(session_id)
    session.context.update(context)
    research_agent.memory.save_session(session)
    return {"success": True, "context_keys": list(session.context.keys())}


# ============================================================================
# Scheduled Task Endpoints
# ============================================================================

@router.get("/tasks", response_model=list[TaskResponse])
async def list_tasks():
    """List all scheduled tasks"""
    tasks = task_scheduler.list_tasks()
    return [
        TaskResponse(
            task_id=t.task_id,
            name=t.name,
            description=t.description,
            schedule_type=t.schedule_type.value,
            schedule_value=t.schedule_value,
            skill_type=t.skill_type.value,
            status=t.status.value,
            last_run=t.last_run,
            next_run=t.next_run,
            run_count=t.run_count,
        )
        for t in tasks
    ]


@router.post("/tasks", response_model=TaskResponse)
async def create_task(request: CreateTaskRequest):
    """Create a new scheduled task"""
    try:
        schedule_type = ScheduleType(request.schedule_type)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid schedule type: {request.schedule_type}"
        )

    try:
        skill_type = SkillType(request.skill_type)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid skill type: {request.skill_type}"
        )

    task = task_scheduler.create_task(
        task_id=request.task_id,
        name=request.name,
        description=request.description,
        schedule_type=schedule_type,
        schedule_value=request.schedule_value,
        skill_type=skill_type,
        context=request.context,
        prompt=request.prompt,
        session_id=request.session_id,
        timezone=request.timezone,
    )

    return TaskResponse(
        task_id=task.task_id,
        name=task.name,
        description=task.description,
        schedule_type=task.schedule_type.value,
        schedule_value=task.schedule_value,
        skill_type=task.skill_type.value,
        status=task.status.value,
        last_run=task.last_run,
        next_run=task.next_run,
        run_count=task.run_count,
    )


@router.get("/tasks/{task_id}", response_model=TaskResponse)
async def get_task(task_id: str):
    """Get a specific task"""
    task = task_scheduler.get_task(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    return TaskResponse(
        task_id=task.task_id,
        name=task.name,
        description=task.description,
        schedule_type=task.schedule_type.value,
        schedule_value=task.schedule_value,
        skill_type=task.skill_type.value,
        status=task.status.value,
        last_run=task.last_run,
        next_run=task.next_run,
        run_count=task.run_count,
    )


@router.delete("/tasks/{task_id}")
async def delete_task(task_id: str):
    """Delete a task"""
    if task_scheduler.delete_task(task_id):
        return {"success": True}
    raise HTTPException(status_code=404, detail="Task not found")


@router.post("/tasks/{task_id}/enable")
async def enable_task(task_id: str):
    """Enable a disabled task"""
    if task_scheduler.enable_task(task_id):
        return {"success": True}
    raise HTTPException(status_code=404, detail="Task not found")


@router.post("/tasks/{task_id}/disable")
async def disable_task(task_id: str):
    """Disable a task"""
    if task_scheduler.disable_task(task_id):
        return {"success": True}
    raise HTTPException(status_code=404, detail="Task not found")


@router.post("/tasks/{task_id}/run", response_model=TaskResultResponse)
async def run_task_now(task_id: str):
    """Immediately execute a task"""
    result = await task_scheduler.run_task_now(task_id)
    if not result:
        raise HTTPException(status_code=404, detail="Task not found")

    return TaskResultResponse(
        task_id=result.task_id,
        execution_id=result.execution_id,
        started_at=result.started_at,
        completed_at=result.completed_at,
        success=result.success,
        result_preview=result.result_content[:500] + "..." if len(result.result_content) > 500 else result.result_content,
        error=result.error,
        duration_ms=result.duration_ms,
    )


@router.get("/tasks/{task_id}/results", response_model=list[TaskResultResponse])
async def get_task_results(task_id: str, limit: int = 10):
    """Get recent execution results for a task"""
    results = task_scheduler.get_task_results(task_id, limit)
    return [
        TaskResultResponse(
            task_id=r.task_id,
            execution_id=r.execution_id,
            started_at=r.started_at,
            completed_at=r.completed_at,
            success=r.success,
            result_preview=r.result_content[:500] + "..." if len(r.result_content) > 500 else r.result_content,
            error=r.error,
            duration_ms=r.duration_ms,
        )
        for r in results
    ]


# ============================================================================
# Task Template Endpoints
# ============================================================================

class DailyForecastRequest(BaseModel):
    """Request body for creating a daily forecast task"""
    session_id: str
    profile_context: dict
    hour: int = 9


class WeeklyReportRequest(BaseModel):
    """Request body for creating a weekly report task"""
    session_id: str
    subjects: list[dict]
    day_of_week: int = 0
    hour: int = 8


@router.post("/tasks/templates/daily-forecast", response_model=TaskResponse)
async def create_daily_forecast(request: DailyForecastRequest):
    """Create a daily forecast task from template"""
    task = create_daily_forecast_task(
        task_scheduler,
        request.profile_context,
        request.session_id,
        request.hour,
    )
    return TaskResponse(
        task_id=task.task_id,
        name=task.name,
        description=task.description,
        schedule_type=task.schedule_type.value,
        schedule_value=task.schedule_value,
        skill_type=task.skill_type.value,
        status=task.status.value,
        last_run=task.last_run,
        next_run=task.next_run,
        run_count=task.run_count,
    )


@router.post("/tasks/templates/weekly-report", response_model=TaskResponse)
async def create_weekly_report(request: WeeklyReportRequest):
    """Create a weekly report task from template"""
    task = create_weekly_report_task(
        task_scheduler,
        request.subjects,
        request.session_id,
        request.day_of_week,
        request.hour,
    )
    return TaskResponse(
        task_id=task.task_id,
        name=task.name,
        description=task.description,
        schedule_type=task.schedule_type.value,
        schedule_value=task.schedule_value,
        skill_type=task.skill_type.value,
        status=task.status.value,
        last_run=task.last_run,
        next_run=task.next_run,
        run_count=task.run_count,
    )


@router.post("/tasks/templates/solar-term-alert", response_model=TaskResponse)
async def create_solar_term(session_id: str):
    """Create a solar term alert task from template"""
    task = create_solar_term_alert_task(task_scheduler, session_id)
    return TaskResponse(
        task_id=task.task_id,
        name=task.name,
        description=task.description,
        schedule_type=task.schedule_type.value,
        schedule_value=task.schedule_value,
        skill_type=task.skill_type.value,
        status=task.status.value,
        last_run=task.last_run,
        next_run=task.next_run,
        run_count=task.run_count,
    )
