from celery import Celery
from celery.schedules import crontab

from .config import get_settings

settings = get_settings()

celery = Celery(
    "genclear",
    broker=settings.celery_broker_url,
    backend=settings.celery_result_backend,
    include=["app.tasks"],
)

celery.conf.update(
    worker_concurrency=1,
    worker_prefetch_multiplier=1,
    task_acks_late=True,
    task_reject_on_worker_lost=True,
    task_track_started=True,
    task_time_limit=settings.job_timeout_sec + 120,
    task_soft_time_limit=settings.job_timeout_sec,
    worker_max_tasks_per_child=20,
    broker_connection_retry_on_startup=True,
    broker_transport_options={
        "priority_steps": list(range(10)),
        "sep": ":",
        "queue_order_strategy": "priority",
    },
    beat_schedule={
        "cleanup-expired": {
            "task": "app.tasks.cleanup_expired",
            "schedule": crontab(minute="*/15"),
        },
        "reap-stuck-jobs": {
            "task": "app.tasks.reap_stuck_jobs",
            "schedule": crontab(minute="*/5"),
        },
    },
)
