import logging
import os
import smtplib
from datetime import datetime, timedelta, timezone
from email.message import EmailMessage
from typing import Optional
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.dev_tester_models import (
    DailyCheckin,
    DailyCheckinAlert,
    DevNotification,
    DevProfile,
    SdkAppCheckin,
)
from app.models.user_models import AppUser
from app.services.economy_rules import UpzPointsReward
from app.services.gamification_service import add_points_and_level_up

logger = logging.getLogger(__name__)

DEFAULT_CHECKIN_REMINDER_HOUR = int(os.getenv("DAILY_CHECKIN_REMINDER_HOUR", "22"))
DEFAULT_CHECKIN_DEADLINE_HOUR = int(os.getenv("DAILY_CHECKIN_DEADLINE_HOUR", "23"))
DEFAULT_CHECKIN_TIMEZONE = os.getenv("DAILY_CHECKIN_DEFAULT_TIMEZONE", "America/Sao_Paulo")
EMAIL_RETRY_AFTER = timedelta(hours=1)


def _timezone(timezone_name: str) -> ZoneInfo:
    try:
        return ZoneInfo(timezone_name)
    except (ZoneInfoNotFoundError, ValueError) as exc:
        raise ValueError(f"Timezone inválido: {timezone_name}") from exc


def _local_now(timezone_name: str, now: Optional[datetime] = None) -> datetime:
    tz = _timezone(timezone_name)
    if now is None:
        return datetime.now(tz)
    if now.tzinfo is None:
        return now.replace(tzinfo=timezone.utc).astimezone(tz)
    return now.astimezone(tz)


def _utc_naive(value: datetime) -> datetime:
    return value.astimezone(timezone.utc).replace(tzinfo=None)


def _day_key(value: datetime) -> str:
    return value.strftime("%Y-%m-%d")


def _email_body(app_id: str, deadline: str) -> str:
    return (
        f"Você ainda não abriu o app {app_id} hoje. Abra o aplicativo até {deadline} "
        "no seu horário local para registrar o uso diário e receber os UpzPoints previstos."
    )


def get_daily_status(
    db: Session,
    dev_profile: DevProfile,
    app_id: str = "upzlab-community",
    timezone_name: Optional[str] = None,
) -> dict:
    if timezone_name:
        _timezone(timezone_name)
        dev_profile.timezone = timezone_name
        db.commit()

    user_timezone = dev_profile.timezone or DEFAULT_CHECKIN_TIMEZONE
    local_now = _local_now(user_timezone)
    day_key = _day_key(local_now)
    checkin = (
        db.query(SdkAppCheckin)
        .filter(
            SdkAppCheckin.dev_profile_id == dev_profile.id,
            SdkAppCheckin.app_id == app_id,
            SdkAppCheckin.opened_day == day_key,
        )
        .first()
    )
    alert = (
        db.query(DailyCheckinAlert)
        .filter(
            DailyCheckinAlert.dev_profile_id == dev_profile.id,
            DailyCheckinAlert.alert_day == day_key,
            DailyCheckinAlert.is_resolved.is_(False),
        )
        .first()
    )
    checkins = (
        db.query(SdkAppCheckin)
        .filter(
            SdkAppCheckin.dev_profile_id == dev_profile.id,
            SdkAppCheckin.app_id == app_id,
            SdkAppCheckin.opened_day <= day_key,
        )
        .order_by(SdkAppCheckin.opened_day.desc())
        .limit(7)
        .all()
    )
    checkin_by_day = {row.opened_day: row for row in checkins}
    history = []
    streak = 0
    for days_ago in range(7):
        day = _day_key(local_now - timedelta(days=days_ago))
        row = checkin_by_day.get(day)
        history.append({
            "date": day,
            "opened": row is not None,
            "points_awarded": row.points_awarded if row else 0,
        })
        if row is not None:
            streak += 1
        else:
            if days_ago == 0:
                streak = 0
            break

    return {
        "app_id": checkin.app_id if checkin else app_id,
        "opened_today": checkin is not None,
        "status": "approved" if checkin else "pending",
        "deadline": f"{DEFAULT_CHECKIN_DEADLINE_HOUR:02d}:00",
        "timezone": user_timezone,
        "reward": UpzPointsReward.DAILY_APP_OPEN,
        "points_awarded": checkin.points_awarded if checkin else 0,
        "last_seen_at": checkin.last_seen_at.isoformat() if checkin and checkin.last_seen_at else None,
        "alert_required": alert is not None,
        "alert_message": alert.message if alert else None,
        "email_sent": bool(alert and alert.email_sent_at),
        "history": history,
        "streak_days": streak,
    }


def record_app_open(
    db: Session,
    dev_profile: DevProfile,
    app_id: str,
    platform: str,
    session_id: Optional[str] = None,
    timezone_name: str = DEFAULT_CHECKIN_TIMEZONE,
    now: Optional[datetime] = None,
) -> dict:
    if not app_id.strip() or len(app_id) > 120:
        raise ValueError("app_id deve ter entre 1 e 120 caracteres.")
    if not platform.strip() or len(platform) > 40:
        raise ValueError("platform deve ter entre 1 e 40 caracteres.")
    _timezone(timezone_name)
    local_now = _local_now(timezone_name, now)
    day_key = _day_key(local_now)
    utc_now = _utc_naive(local_now)

    dev_profile.timezone = timezone_name
    daily_reward = (
        db.query(DailyCheckin)
        .filter(
            DailyCheckin.dev_profile_id == dev_profile.id,
            DailyCheckin.opened_day == day_key,
        )
        .first()
    )
    app_checkin = (
        db.query(SdkAppCheckin)
        .filter(
            SdkAppCheckin.dev_profile_id == dev_profile.id,
            SdkAppCheckin.app_id == app_id.strip(),
            SdkAppCheckin.opened_day == day_key,
        )
        .first()
    )
    if app_checkin is None:
        app_checkin = SdkAppCheckin(
            dev_profile_id=dev_profile.id,
            app_id=app_id.strip(),
            platform=platform.strip(),
            session_id=session_id,
            timezone=timezone_name,
            opened_at=utc_now,
            opened_day=day_key,
            points_awarded=0,
            last_seen_at=utc_now,
        )
        db.add(app_checkin)
    else:
        app_checkin.platform = platform.strip()
        app_checkin.session_id = session_id
        app_checkin.timezone = timezone_name
        app_checkin.last_seen_at = utc_now

    points_awarded = app_checkin.points_awarded if app_checkin else 0
    if daily_reward is None:
        add_points_and_level_up(
            db,
            dev_profile,
            points_to_add=UpzPointsReward.DAILY_APP_OPEN,
            reason=f"Daily check-in do app {app_id.strip()}",
            commit=False,
        )
        daily_reward = DailyCheckin(
            dev_profile_id=dev_profile.id,
            app_id=app_id.strip(),
            platform=platform.strip(),
            session_id=session_id,
            timezone=timezone_name,
            opened_at=utc_now,
            opened_day=day_key,
            status="approved",
            points_awarded=UpzPointsReward.DAILY_APP_OPEN,
            alert_sent=False,
            last_seen_at=utc_now,
        )
        db.add(daily_reward)
        points_awarded = UpzPointsReward.DAILY_APP_OPEN
        app_checkin.points_awarded = points_awarded
    else:
        daily_reward.last_seen_at = utc_now

    alert = (
        db.query(DailyCheckinAlert)
        .filter(
            DailyCheckinAlert.dev_profile_id == dev_profile.id,
            DailyCheckinAlert.alert_day == day_key,
            DailyCheckinAlert.is_resolved.is_(False),
        )
        .first()
    )
    if alert:
        alert.is_resolved = True
        alert.resolved_at = utc_now
        (
            db.query(DevNotification)
            .filter(
                DevNotification.dev_id == dev_profile.id,
                DevNotification.title == "Daily check-in pendente",
                DevNotification.read.is_(False),
            )
            .update(
                {
                    DevNotification.read: True,
                    DevNotification.body: "Check-in diário confirmado. Seus pontos foram registrados.",
                },
                synchronize_session=False,
            )
        )

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        app_checkin = (
            db.query(SdkAppCheckin)
            .filter(
                SdkAppCheckin.dev_profile_id == dev_profile.id,
                SdkAppCheckin.app_id == app_id.strip(),
                SdkAppCheckin.opened_day == day_key,
            )
            .first()
        )
        if app_checkin is None:
            raise
        points_awarded = app_checkin.points_awarded
    else:
        db.refresh(app_checkin)

    return {
        "app_id": app_checkin.app_id,
        "opened_today": True,
        "status": "approved",
        "points_awarded": points_awarded,
        "reward": UpzPointsReward.DAILY_APP_OPEN,
        "timezone": app_checkin.timezone,
        "last_seen_at": app_checkin.last_seen_at.isoformat() if app_checkin.last_seen_at else None,
    }


def _send_email(recipient: str, subject: str, body: str) -> None:
    from app.services.mail_service import send_email

    send_email(recipient, subject, body)


def _create_or_get_alert(
    db: Session,
    dev_profile: DevProfile,
    app_id: str,
    local_now: datetime,
) -> tuple[Optional[DailyCheckinAlert], bool]:
    day_key = _day_key(local_now)
    checkin = (
        db.query(DailyCheckin)
        .filter(
            DailyCheckin.dev_profile_id == dev_profile.id,
            DailyCheckin.opened_day == day_key,
        )
        .first()
    )
    if checkin:
        return None, False

    alert = (
        db.query(DailyCheckinAlert)
        .filter(
            DailyCheckinAlert.dev_profile_id == dev_profile.id,
            DailyCheckinAlert.alert_day == day_key,
        )
        .first()
    )
    if alert is not None:
        return alert, False

    deadline = f"{DEFAULT_CHECKIN_DEADLINE_HOUR:02d}:00"
    message = _email_body(app_id, deadline)
    alert = DailyCheckinAlert(
        dev_profile_id=dev_profile.id,
        app_id=app_id,
        alert_day=day_key,
        alert_type="warning",
        message=message,
        is_resolved=False,
    )
    db.add(alert)
    db.add(
        DevNotification(
            dev_id=dev_profile.id,
            title="Daily check-in pendente",
            body=message,
            icon="check",
            color="amber",
            read=False,
        )
    )
    try:
        db.commit()
        db.refresh(alert)
    except IntegrityError:
        db.rollback()
        alert = (
            db.query(DailyCheckinAlert)
            .filter(
                DailyCheckinAlert.dev_profile_id == dev_profile.id,
                DailyCheckinAlert.alert_day == day_key,
            )
            .first()
        )
        return alert, False
    return alert, True


def send_pending_alert_email(db: Session, alert: DailyCheckinAlert) -> bool:
    if alert.is_resolved or alert.email_sent_at:
        return False
    now_utc = datetime.now(timezone.utc).replace(tzinfo=None)
    if alert.email_last_attempt_at and now_utc - alert.email_last_attempt_at < EMAIL_RETRY_AFTER:
        return False

    alert.email_last_attempt_at = now_utc
    alert.email_error = None
    db.commit()

    profile = db.query(DevProfile).filter(DevProfile.id == alert.dev_profile_id).first()
    app_user = db.query(AppUser).filter(AppUser.id == profile.user_id).first() if profile else None
    if not app_user or not app_user.email:
        alert.email_error = "A conta não possui um endereço de e-mail configurado."
        db.commit()
        return False

    try:
        _send_email(
            recipient=app_user.email,
            subject="Lembrete: abra seu app hoje para registrar o uso diário",
            body=alert.message,
        )
    except (OSError, smtplib.SMTPException, RuntimeError, ValueError) as exc:
        alert.email_error = str(exc)[:500]
        db.commit()
        logger.exception("Falha ao enviar lembrete diário para o perfil %s", alert.dev_profile_id)
        return False

    alert.email_sent_at = datetime.now(timezone.utc).replace(tzinfo=None)
    alert.email_error = None
    db.commit()
    return True


def process_daily_reminders(db: Session, now: Optional[datetime] = None) -> dict:
    sent = 0
    created = 0
    skipped = 0
    profiles = db.query(DevProfile).filter(DevProfile.status == "ACTIVE").all()

    for profile in profiles:
        user_timezone = profile.timezone or DEFAULT_CHECKIN_TIMEZONE
        local_now = _local_now(user_timezone, now)
        if local_now.hour < DEFAULT_CHECKIN_REMINDER_HOUR:
            skipped += 1
            continue

        alert, was_created = _create_or_get_alert(db, profile, "upzlab-community", local_now)
        if alert is None:
            skipped += 1
            continue
        if was_created:
            created += 1
        if send_pending_alert_email(db, alert):
            sent += 1

    return {"checked_profiles": len(profiles), "alerts_created": created, "emails_sent": sent, "skipped": skipped}
