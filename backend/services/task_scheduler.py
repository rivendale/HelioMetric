"""
Task Scheduler Service: Automated Research Jobs

Implements scheduled task execution following the nanoclaw pattern:
- Cron-based scheduling with timezone support
- Interval-based recurring tasks
- One-time scheduled tasks
- Research agent integration for automated analysis

Example tasks:
- Daily zodiac forecasts
- Weekly compatibility reports
- Monthly pattern analysis
- K-index correlation tracking
"""

import asyncio
import json
import os
from datetime import datetime, timedelta
from typing import Any, Callable, Optional
from dataclasses import dataclass, field, asdict
from enum import Enum
import hashlib

try:
    from croniter import croniter
    HAS_CRONITER = True
except ImportError:
    HAS_CRONITER = False

from .research_agent import research_agent, SkillType


# ============================================================================
# Configuration
# ============================================================================

TASKS_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "scheduled_tasks")
TASK_RESULTS_DIR = os.path.join(TASKS_DIR, "results")
POLL_INTERVAL_SECONDS = 60  # Check for due tasks every minute


# ============================================================================
# Data Types
# ============================================================================

class ScheduleType(str, Enum):
    """Types of task scheduling"""
    CRON = "cron"           # Cron expression (e.g., "0 9 * * *" for 9 AM daily)
    INTERVAL = "interval"   # Repeat every N seconds
    ONCE = "once"           # Run once at specified time


class TaskStatus(str, Enum):
    """Task execution status"""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    DISABLED = "disabled"


@dataclass
class ScheduledTask:
    """A scheduled research task"""
    task_id: str
    name: str
    description: str

    # Scheduling
    schedule_type: ScheduleType
    schedule_value: str  # Cron expression, interval in seconds, or ISO datetime

    # Research configuration
    skill_type: SkillType
    context: dict = field(default_factory=dict)
    prompt: str = ""

    # State
    status: TaskStatus = TaskStatus.PENDING
    last_run: Optional[str] = None
    next_run: Optional[str] = None
    run_count: int = 0

    # Notification settings
    session_id: Optional[str] = None  # Session to store results
    notify_callback: Optional[str] = None  # URL to notify on completion

    # Metadata
    created_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())
    updated_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())
    timezone: str = "UTC"

    def to_dict(self) -> dict:
        return {
            **asdict(self),
            "schedule_type": self.schedule_type.value,
            "skill_type": self.skill_type.value,
            "status": self.status.value,
        }

    @classmethod
    def from_dict(cls, data: dict) -> "ScheduledTask":
        return cls(
            task_id=data["task_id"],
            name=data["name"],
            description=data["description"],
            schedule_type=ScheduleType(data["schedule_type"]),
            schedule_value=data["schedule_value"],
            skill_type=SkillType(data["skill_type"]),
            context=data.get("context", {}),
            prompt=data.get("prompt", ""),
            status=TaskStatus(data.get("status", "pending")),
            last_run=data.get("last_run"),
            next_run=data.get("next_run"),
            run_count=data.get("run_count", 0),
            session_id=data.get("session_id"),
            notify_callback=data.get("notify_callback"),
            created_at=data.get("created_at", datetime.utcnow().isoformat()),
            updated_at=data.get("updated_at", datetime.utcnow().isoformat()),
            timezone=data.get("timezone", "UTC"),
        )


@dataclass
class TaskResult:
    """Result of a task execution"""
    task_id: str
    execution_id: str
    started_at: str
    completed_at: str
    success: bool
    result_content: str
    error: Optional[str] = None
    duration_ms: int = 0


# ============================================================================
# Task Storage
# ============================================================================

class TaskStorage:
    """Persistent storage for scheduled tasks"""

    def __init__(self, tasks_dir: str = TASKS_DIR, results_dir: str = TASK_RESULTS_DIR):
        self.tasks_dir = tasks_dir
        self.results_dir = results_dir
        os.makedirs(tasks_dir, exist_ok=True)
        os.makedirs(results_dir, exist_ok=True)

    def _get_task_path(self, task_id: str) -> str:
        safe_id = hashlib.sha256(task_id.encode()).hexdigest()[:16]
        return os.path.join(self.tasks_dir, f"task_{safe_id}.json")

    def _get_result_path(self, task_id: str, execution_id: str) -> str:
        safe_task_id = hashlib.sha256(task_id.encode()).hexdigest()[:16]
        return os.path.join(self.results_dir, f"result_{safe_task_id}_{execution_id}.json")

    def save_task(self, task: ScheduledTask) -> None:
        """Save a task to disk"""
        task.updated_at = datetime.utcnow().isoformat()
        path = self._get_task_path(task.task_id)
        with open(path, "w") as f:
            json.dump(task.to_dict(), f, indent=2)

    def load_task(self, task_id: str) -> Optional[ScheduledTask]:
        """Load a task from disk"""
        path = self._get_task_path(task_id)
        if not os.path.exists(path):
            return None
        try:
            with open(path, "r") as f:
                data = json.load(f)
                return ScheduledTask.from_dict(data)
        except (json.JSONDecodeError, KeyError):
            return None

    def delete_task(self, task_id: str) -> bool:
        """Delete a task"""
        path = self._get_task_path(task_id)
        if os.path.exists(path):
            os.remove(path)
            return True
        return False

    def list_tasks(self) -> list[ScheduledTask]:
        """List all tasks"""
        tasks = []
        for filename in os.listdir(self.tasks_dir):
            if filename.startswith("task_") and filename.endswith(".json"):
                path = os.path.join(self.tasks_dir, filename)
                try:
                    with open(path, "r") as f:
                        data = json.load(f)
                        tasks.append(ScheduledTask.from_dict(data))
                except (json.JSONDecodeError, KeyError):
                    continue
        return tasks

    def save_result(self, result: TaskResult) -> None:
        """Save a task execution result"""
        path = self._get_result_path(result.task_id, result.execution_id)
        with open(path, "w") as f:
            json.dump(asdict(result), f, indent=2)

    def get_task_results(self, task_id: str, limit: int = 10) -> list[TaskResult]:
        """Get recent results for a task"""
        results = []
        safe_task_id = hashlib.sha256(task_id.encode()).hexdigest()[:16]
        prefix = f"result_{safe_task_id}_"

        for filename in os.listdir(self.results_dir):
            if filename.startswith(prefix) and filename.endswith(".json"):
                path = os.path.join(self.results_dir, filename)
                try:
                    with open(path, "r") as f:
                        data = json.load(f)
                        results.append(TaskResult(**data))
                except (json.JSONDecodeError, KeyError, TypeError):
                    continue

        # Sort by completion time, newest first
        results.sort(key=lambda r: r.completed_at, reverse=True)
        return results[:limit]


# ============================================================================
# Schedule Calculator
# ============================================================================

class ScheduleCalculator:
    """Calculates next run times for tasks"""

    @staticmethod
    def calculate_next_run(task: ScheduledTask) -> Optional[datetime]:
        """Calculate the next run time for a task"""
        now = datetime.utcnow()

        if task.schedule_type == ScheduleType.CRON:
            if not HAS_CRONITER:
                # Fallback: run daily at the same time
                next_run = now + timedelta(days=1)
                return next_run.replace(hour=9, minute=0, second=0, microsecond=0)

            try:
                cron = croniter(task.schedule_value, now)
                return cron.get_next(datetime)
            except (ValueError, KeyError):
                return None

        elif task.schedule_type == ScheduleType.INTERVAL:
            try:
                interval_seconds = int(task.schedule_value)
                if task.last_run:
                    last = datetime.fromisoformat(task.last_run)
                    return last + timedelta(seconds=interval_seconds)
                else:
                    return now + timedelta(seconds=interval_seconds)
            except ValueError:
                return None

        elif task.schedule_type == ScheduleType.ONCE:
            try:
                scheduled_time = datetime.fromisoformat(task.schedule_value)
                if scheduled_time > now and task.run_count == 0:
                    return scheduled_time
                return None  # Already run or past
            except ValueError:
                return None

        return None

    @staticmethod
    def is_due(task: ScheduledTask) -> bool:
        """Check if a task is due to run"""
        if task.status == TaskStatus.DISABLED:
            return False

        if not task.next_run:
            return False

        try:
            next_run = datetime.fromisoformat(task.next_run)
            return datetime.utcnow() >= next_run
        except ValueError:
            return False


# ============================================================================
# Task Executor
# ============================================================================

class TaskExecutor:
    """Executes scheduled tasks"""

    def __init__(self, storage: TaskStorage):
        self.storage = storage

    async def execute_task(self, task: ScheduledTask) -> TaskResult:
        """Execute a single task"""
        execution_id = hashlib.sha256(
            f"{task.task_id}_{datetime.utcnow().isoformat()}".encode()
        ).hexdigest()[:12]

        started_at = datetime.utcnow()

        # Update task status
        task.status = TaskStatus.RUNNING
        self.storage.save_task(task)

        try:
            # Execute the research skill
            session_id = task.session_id or f"scheduled_{task.task_id}"

            skill_result = await research_agent.execute_skill(
                skill_type=task.skill_type,
                session_id=session_id,
                user_message=task.prompt,
                context=task.context,
            )

            completed_at = datetime.utcnow()
            duration_ms = int((completed_at - started_at).total_seconds() * 1000)

            result = TaskResult(
                task_id=task.task_id,
                execution_id=execution_id,
                started_at=started_at.isoformat(),
                completed_at=completed_at.isoformat(),
                success=skill_result.success,
                result_content=skill_result.content[:10000],  # Truncate if very long
                error=skill_result.error,
                duration_ms=duration_ms,
            )

            # Update task state
            task.status = TaskStatus.COMPLETED
            task.last_run = completed_at.isoformat()
            task.run_count += 1
            task.next_run = None

            # Calculate next run time
            next_run = ScheduleCalculator.calculate_next_run(task)
            if next_run:
                task.next_run = next_run.isoformat()
                task.status = TaskStatus.PENDING
            elif task.schedule_type == ScheduleType.ONCE:
                task.status = TaskStatus.COMPLETED

            self.storage.save_task(task)
            self.storage.save_result(result)

            return result

        except Exception as e:
            completed_at = datetime.utcnow()
            duration_ms = int((completed_at - started_at).total_seconds() * 1000)

            result = TaskResult(
                task_id=task.task_id,
                execution_id=execution_id,
                started_at=started_at.isoformat(),
                completed_at=completed_at.isoformat(),
                success=False,
                result_content="",
                error=str(e),
                duration_ms=duration_ms,
            )

            # Update task state
            task.status = TaskStatus.FAILED
            task.last_run = completed_at.isoformat()
            self.storage.save_task(task)
            self.storage.save_result(result)

            return result


# ============================================================================
# Task Scheduler
# ============================================================================

class TaskScheduler:
    """Main scheduler that manages and executes scheduled tasks"""

    def __init__(self):
        self.storage = TaskStorage()
        self.executor = TaskExecutor(self.storage)
        self.running = False
        self._task: Optional[asyncio.Task] = None

    def create_task(
        self,
        task_id: str,
        name: str,
        description: str,
        schedule_type: ScheduleType,
        schedule_value: str,
        skill_type: SkillType,
        context: Optional[dict] = None,
        prompt: str = "",
        session_id: Optional[str] = None,
        timezone: str = "UTC",
    ) -> ScheduledTask:
        """Create a new scheduled task"""
        task = ScheduledTask(
            task_id=task_id,
            name=name,
            description=description,
            schedule_type=schedule_type,
            schedule_value=schedule_value,
            skill_type=skill_type,
            context=context or {},
            prompt=prompt,
            session_id=session_id,
            timezone=timezone,
        )

        # Calculate initial next run
        next_run = ScheduleCalculator.calculate_next_run(task)
        if next_run:
            task.next_run = next_run.isoformat()

        self.storage.save_task(task)
        return task

    def get_task(self, task_id: str) -> Optional[ScheduledTask]:
        """Get a task by ID"""
        return self.storage.load_task(task_id)

    def list_tasks(self) -> list[ScheduledTask]:
        """List all tasks"""
        return self.storage.list_tasks()

    def delete_task(self, task_id: str) -> bool:
        """Delete a task"""
        return self.storage.delete_task(task_id)

    def enable_task(self, task_id: str) -> bool:
        """Enable a disabled task"""
        task = self.storage.load_task(task_id)
        if task:
            task.status = TaskStatus.PENDING
            next_run = ScheduleCalculator.calculate_next_run(task)
            if next_run:
                task.next_run = next_run.isoformat()
            self.storage.save_task(task)
            return True
        return False

    def disable_task(self, task_id: str) -> bool:
        """Disable a task"""
        task = self.storage.load_task(task_id)
        if task:
            task.status = TaskStatus.DISABLED
            self.storage.save_task(task)
            return True
        return False

    def get_task_results(self, task_id: str, limit: int = 10) -> list[TaskResult]:
        """Get recent results for a task"""
        return self.storage.get_task_results(task_id, limit)

    async def run_task_now(self, task_id: str) -> Optional[TaskResult]:
        """Immediately execute a task"""
        task = self.storage.load_task(task_id)
        if not task:
            return None
        return await self.executor.execute_task(task)

    async def _scheduler_loop(self):
        """Main scheduler loop"""
        while self.running:
            try:
                tasks = self.storage.list_tasks()

                for task in tasks:
                    if ScheduleCalculator.is_due(task):
                        await self.executor.execute_task(task)

            except Exception as e:
                # Log error but continue running
                print(f"Scheduler error: {e}")

            await asyncio.sleep(POLL_INTERVAL_SECONDS)

    def start(self):
        """Start the scheduler"""
        if self.running:
            return

        self.running = True
        self._task = asyncio.create_task(self._scheduler_loop())

    def stop(self):
        """Stop the scheduler"""
        self.running = False
        if self._task:
            self._task.cancel()
            self._task = None


# ============================================================================
# Pre-defined Task Templates
# ============================================================================

def create_daily_forecast_task(
    scheduler: TaskScheduler,
    profile_context: dict,
    session_id: str,
    hour: int = 9,
) -> ScheduledTask:
    """Create a daily forecast task"""
    return scheduler.create_task(
        task_id=f"daily_forecast_{session_id}",
        name="Daily Forecast",
        description="Generate daily zodiac forecast based on current temporal state",
        schedule_type=ScheduleType.CRON,
        schedule_value=f"0 {hour} * * *",  # Run at specified hour daily
        skill_type=SkillType.FORECAST_PERIOD,
        context={
            "profile": profile_context,
            "target_period": "today",
        },
        prompt="Generate today's forecast considering the current solar term and year energy.",
        session_id=session_id,
    )


def create_weekly_report_task(
    scheduler: TaskScheduler,
    subjects: list[dict],
    session_id: str,
    day_of_week: int = 0,  # 0 = Monday
    hour: int = 8,
) -> ScheduledTask:
    """Create a weekly compatibility report task"""
    return scheduler.create_task(
        task_id=f"weekly_report_{session_id}",
        name="Weekly Family Report",
        description="Generate weekly family dynamics and compatibility report",
        schedule_type=ScheduleType.CRON,
        schedule_value=f"0 {hour} * * {day_of_week}",  # Run weekly
        skill_type=SkillType.GENERATE_REPORT,
        context={
            "report_type": "weekly family dynamics",
            "subjects": subjects,
        },
        prompt="Generate the weekly family dynamics report with focus on the upcoming week's energy.",
        session_id=session_id,
    )


def create_solar_term_alert_task(
    scheduler: TaskScheduler,
    session_id: str,
) -> ScheduledTask:
    """Create a task that alerts on solar term changes"""
    return scheduler.create_task(
        task_id=f"solar_term_alert_{session_id}",
        name="Solar Term Alert",
        description="Alert when entering a new solar term with analysis",
        schedule_type=ScheduleType.CRON,
        schedule_value="0 6 * * *",  # Check daily at 6 AM
        skill_type=SkillType.EXPLAIN_CONCEPT,
        context={
            "concept": "current_solar_term",
        },
        prompt="Check if we've entered a new solar term and provide analysis of its significance.",
        session_id=session_id,
    )


# ============================================================================
# Singleton Instance
# ============================================================================

task_scheduler = TaskScheduler()
