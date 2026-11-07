from datetime import date, datetime, timezone
import logging
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import AsyncSessionLocal
from app.core.constants import (
    LicenseStatus,
    SessionAttendanceStatus,
    SessionStatus
)
from app.models.center import TrungTam
from app.models.session import BuoiHoc
from app.services.dispatcher_service import DispatcherService
from app.tasks.locks import release_advisory_lock, try_acquire_advisory_lock

logger = logging.getLogger(__name__)

async def run_end_shift_scan():
    """Trigger 1: Periodic 60-second end-shift scanner.
    Scans sessions whose end time has passed today, verified attendance, and not yet sent.
    """
    async with AsyncSessionLocal() as db:
        lock_acquired = await try_acquire_advisory_lock(db, lock_id=101001)
        if not lock_acquired:
            logger.info("End shift job skipped: Another worker holds the advisory lock.")
            return

        try:
            today = date.today()
            current_time = datetime.now().time()

            # Query eligible sessions
            query = select(BuoiHoc).join(TrungTam, BuoiHoc.trung_tam_id == TrungTam.id).where(
                BuoiHoc.ngay_hoc == today,
                BuoiHoc.gio_ket_thuc <= current_time,
                BuoiHoc.da_gui.is_(False),
                BuoiHoc.trang_thai_buoi_hoc == SessionStatus.NORMAL.value,
                TrungTam.trang_thai_ban_quyen == LicenseStatus.ACTIVE.value,
                TrungTam.ngay_het_han_saas >= today
            )

            result = await db.execute(query)
            sessions = result.scalars().all()

            for s in sessions:
                # SAFETY NET: If teacher hasn't taken attendance yet, do NOT send false notices!
                if s.trang_thai_diem_danh != SessionAttendanceStatus.TAKEN.value:
                    logger.warning(
                        f"Safety Net: Session {s.id} ended at {s.gio_ket_thuc} but teacher has NOT taken attendance! Skipping notification."
                    )
                    continue

                logger.info(f"Triggering auto-notifications for Session {s.id} (Ca: {s.ca_hoc}).")
                await DispatcherService.dispatch_session_notifications(db, s.id)

        except Exception as e:
            logger.error(f"Error in end shift scan: {e}", exc_info=True)
        finally:
            await release_advisory_lock(db, lock_id=101001)

