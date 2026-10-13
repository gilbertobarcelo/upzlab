"""Run once per minute from cron/systemd to create dashboard and e-mail reminders."""

import logging

from app.models import dev_tester_models  # noqa: F401 - register models with Base
from app.services.daily_checkin_service import process_daily_reminders
from database.database import SessionLocal

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s %(message)s",
)
logger = logging.getLogger(__name__)


def main() -> None:
    db = SessionLocal()
    try:
        result = process_daily_reminders(db)
        logger.info("Daily reminder run: %s", result)
    finally:
        db.close()


if __name__ == "__main__":
    main()
