import logging
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from app.tasks.end_shift_cron import run_end_shift_scan
from app.tasks.morning_queue_cron import run_morning_queue_scan

logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler()

def start_scheduler():
    """Start background scheduler tasks."""
    if not scheduler.running:
        # Job 1: Scan ended sessions every 60 seconds
        scheduler.add_job(
            run_end_shift_scan,
            "interval",
            seconds=60,
            id="end_shift_cron",
            replace_existing=True
        )

        # Job 2: Scan morning queued notifications (at 07:30 daily, or every 5 mins check)
        scheduler.add_job(
            run_morning_queue_scan,
            "interval",
            minutes=5,
            id="morning_queue_cron",
            replace_existing=True
        )

        scheduler.start()
        logger.info("APScheduler started successfully.")

def shutdown_scheduler():
    """Shutdown background scheduler."""
    if scheduler.running:
        scheduler.shutdown(wait=False)
        logger.info("APScheduler stopped.")

