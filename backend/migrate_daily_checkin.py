"""Apply database changes required by the UpzLab daily-check-in feature."""

from sqlalchemy import inspect, text

from app.models import dev_tester_models  # noqa: F401 - register models with Base
from app.models import beta_product_models  # noqa: F401 - register product model with Base
from app.models import distribution_models  # noqa: F401 - register release model with Base
from database.database import Base, engine
from app.models import user_models  # noqa: F401 - register models with Base


def _add_missing_columns(connection, table_name: str, columns: dict[str, str]) -> None:
    inspector = inspect(connection)
    if table_name not in inspector.get_table_names():
        return
    existing = {column["name"] for column in inspector.get_columns(table_name)}
    for column_name, column_type in columns.items():
        if column_name not in existing:
            connection.execute(
                text(f'ALTER TABLE "{table_name}" ADD COLUMN "{column_name}" {column_type}')
            )


def migrate() -> None:
    Base.metadata.create_all(bind=engine)
    with engine.begin() as connection:
        _add_missing_columns(
            connection,
            "beta_products",
            {"package_id": "VARCHAR(255)"},
        )
        _add_missing_columns(
            connection,
            "dev_tester_profiles",
            {
                "timezone": "VARCHAR(80) NOT NULL DEFAULT 'America/Sao_Paulo'",
                "is_seed": "BOOLEAN NOT NULL DEFAULT FALSE",
            },
        )
        _add_missing_columns(
            connection,
            "app_users",
            {"is_seed": "BOOLEAN NOT NULL DEFAULT FALSE"},
        )
        _add_missing_columns(
            connection,
            "beta_products",
            {"is_seed": "BOOLEAN NOT NULL DEFAULT FALSE"},
        )
        _add_missing_columns(
            connection,
            "beta_feedbacks",
            {"is_seed": "BOOLEAN NOT NULL DEFAULT FALSE"},
        )
        _add_missing_columns(
            connection,
            "beta_feedback_comments",
            {"is_seed": "BOOLEAN NOT NULL DEFAULT FALSE"},
        )
        _add_missing_columns(
            connection,
            "dev_tester_email_invites",
            {
                "email_sent_at": "TIMESTAMP",
                "email_last_attempt_at": "TIMESTAMP",
                "email_error": "VARCHAR(500)",
            },
        )
        _add_missing_columns(
            connection,
            "dev_daily_checkin_alerts",
            {
                "alert_day": "VARCHAR(20)",
                "email_last_attempt_at": "TIMESTAMP",
                "email_sent_at": "TIMESTAMP",
                "email_error": "VARCHAR(500)",
            },
        )

        if "dev_daily_checkin_alerts" in inspect(connection).get_table_names():
            rows = connection.execute(
                text(
                    "SELECT id FROM dev_daily_checkin_alerts "
                    "WHERE alert_day IS NULL"
                )
            ).fetchall()
            for row in rows:
                connection.execute(
                    text(
                        "UPDATE dev_daily_checkin_alerts "
                        "SET alert_day = :alert_day WHERE id = :alert_id"
                    ),
                    {"alert_day": f"legacy-{row.id}", "alert_id": row.id},
                )

        connection.execute(
            text(
                "CREATE UNIQUE INDEX IF NOT EXISTS uq_daily_checkin_profile_day "
                "ON dev_daily_checkins (dev_profile_id, opened_day)"
            )
        )
        connection.execute(
            text(
                "CREATE UNIQUE INDEX IF NOT EXISTS uq_daily_alert_profile_day "
                "ON dev_daily_checkin_alerts (dev_profile_id, alert_day)"
            )
        )
        connection.execute(
            text(
                "CREATE UNIQUE INDEX IF NOT EXISTS uq_beta_products_package_id "
                "ON beta_products (package_id)"
            )
        )

        if {"dev_daily_checkins", "dev_sdk_app_checkins"}.issubset(
            set(inspect(connection).get_table_names())
        ):
            connection.execute(
                text(
                    "INSERT INTO dev_sdk_app_checkins "
                    "(dev_profile_id, app_id, platform, session_id, timezone, opened_at, "
                    "opened_day, points_awarded, last_seen_at, created_at) "
                    "SELECT old.dev_profile_id, old.app_id, old.platform, old.session_id, "
                    "old.timezone, old.opened_at, old.opened_day, old.points_awarded, "
                    "old.last_seen_at, old.created_at FROM dev_daily_checkins AS old "
                    "WHERE old.app_id IS NOT NULL AND NOT EXISTS ("
                    "SELECT 1 FROM dev_sdk_app_checkins AS current "
                    "WHERE current.dev_profile_id = old.dev_profile_id "
                    "AND current.app_id = old.app_id AND current.opened_day = old.opened_day)"
                )
            )

    print("Daily check-in schema migration completed.")


if __name__ == "__main__":
    migrate()
