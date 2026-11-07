from datetime import datetime, timezone
import logging
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import AsyncSessionLocal
from app.core.constants import ScheduleTaskStatus
from app.models.center import TrungTam
from app.models.schedule_task import HenGioGuiTin
from app.services.exam_service import calculate_rank
from app.services.zalo.factory import ZaloProviderFactory
from app.tasks.locks import release_advisory_lock, try_acquire_advisory_lock

logger = logging.getLogger(__name__)

async def run_morning_queue_scan():
    """Scans pending scheduled morning notifications at 07:30."""
    async with AsyncSessionLocal() as db:
        lock_acquired = await try_acquire_advisory_lock(db, lock_id=101002)
        if not lock_acquired:
            return

        try:
            now_utc = datetime.now(timezone.utc)
            query = select(HenGioGuiTin).options(
                selectinload(HenGioGuiTin.session),
                selectinload(HenGioGuiTin.student)
            ).where(
                HenGioGuiTin.trang_thai == ScheduleTaskStatus.PENDING.value,
                HenGioGuiTin.thoi_gian_hen_gui <= now_utc
            )

            result = await db.execute(query)
            pending_items = result.scalars().all()

            for item in pending_items:
                try:
                    center = await db.get(TrungTam, item.trung_tam_id)
                    provider = ZaloProviderFactory.get_provider(center)

                    exam_name = "Bài kiểm tra thi giấy"
                    rank = calculate_rank(float(item.diem_so))

                    await provider.send_score_notice(
                        db=db,
                        center=center,
                        student=item.student,
                        session=item.session,
                        exam_name=exam_name,
                        score=float(item.diem_so),
                        rank=rank
                    )
                    item.trang_thai = ScheduleTaskStatus.PROCESSED.value
                    await db.commit()
                except Exception as e:
                    logger.error(f"Error processing scheduled task {item.id}: {e}")
                    continue

        except Exception as e:
            logger.error(f"Error in morning queue scan: {e}")
        finally:
            await release_advisory_lock(db, lock_id=101002)

