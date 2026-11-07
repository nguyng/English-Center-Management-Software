import asyncio
from datetime import datetime, timezone
from typing import Any, Dict
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.constants import ZaloMessageStatus, ZaloMessageType
from app.models.center import TrungTam
from app.models.session import BuoiHoc
from app.models.student import HocSinh
from app.models.zalo_log import NhatKyZalo
from app.services.zalo.base import BaseZaloProvider

class MockZaloProvider(BaseZaloProvider):
    async def send_absent_notice(
        self,
        db: AsyncSession,
        center: TrungTam,
        student: HocSinh,
        session: BuoiHoc
    ) -> Dict[str, Any]:
        # Check idempotency
        existing_log_query = select(NhatKyZalo).where(
            NhatKyZalo.buoi_hoc_id == session.id,
            NhatKyZalo.hoc_sinh_id == student.id,
            NhatKyZalo.loai_tin == ZaloMessageType.ABSENT_NOTICE.value
        )
        res = await db.execute(existing_log_query)
        if res.scalar_one_or_none():
            return {"status": "skipped", "reason": "Already sent"}

        await asyncio.sleep(0.05)  # Simulate network latency

        date_str = session.ngay_hoc.strftime("%d/%m")
        content = (
            f"Kính gửi phụ huynh bé {student.ho_ten}, Trung tâm {center.ten_trung_tam} xin thông báo: "
            f"Hôm nay ngày {date_str}, bé vắng mặt trong buổi học ca {session.ca_hoc}. "
            f"Quý phụ huynh vui lòng liên hệ trung tâm nếu cần hỗ trợ sắp xếp lịch học bù. Trân trọng!"
        )

        log = NhatKyZalo(
            trung_tam_id=center.id,
            buoi_hoc_id=session.id,
            hoc_sinh_id=student.id,
            loai_tin=ZaloMessageType.ABSENT_NOTICE.value,
            sdt_nhan=student.sdt_phu_huynh,
            noi_dung=content,
            trang_thai=ZaloMessageStatus.DEMO.value,
            thoi_gian_gui=datetime.now(timezone.utc)
        )
        db.add(log)
        await db.flush()

        return {"status": "success", "mode": "demo", "log_id": log.id}

    async def send_score_notice(
        self,
        db: AsyncSession,
        center: TrungTam,
        student: HocSinh,
        session: BuoiHoc,
        exam_name: str,
        score: float,
        rank: str
    ) -> Dict[str, Any]:
        # Check idempotency
        existing_log_query = select(NhatKyZalo).where(
            NhatKyZalo.buoi_hoc_id == session.id,
            NhatKyZalo.hoc_sinh_id == student.id,
            NhatKyZalo.loai_tin == ZaloMessageType.SCORE_NOTICE.value
        )
        res = await db.execute(existing_log_query)
        if res.scalar_one_or_none():
            return {"status": "skipped", "reason": "Already sent"}

        await asyncio.sleep(0.05)  # Simulate network latency

        date_str = session.ngay_hoc.strftime("%d/%m/%Y")
        formatted_score = f"{score:.1f}"
        content = (
            f"Kính gửi phụ huynh bé {student.ho_ten}, Trung tâm {center.ten_trung_tam} xin gửi kết quả bài kiểm tra của bé trong buổi học ca {session.ca_hoc}:\n"
            f"- Chuyên cần: Có mặt đúng giờ.\n"
            f"- Bài kiểm tra: {exam_name} (Ngày kiểm tra: {date_str}).\n"
            f"- Điểm số: {formatted_score} / 10 - Xếp loại: {rank}.\n"
            f"Chi tiết bài làm phụ huynh có thể liên hệ giáo viên phụ trách. Trân trọng!"
        )

        log = NhatKyZalo(
            trung_tam_id=center.id,
            buoi_hoc_id=session.id,
            hoc_sinh_id=student.id,
            loai_tin=ZaloMessageType.SCORE_NOTICE.value,
            sdt_nhan=student.sdt_phu_huynh,
            noi_dung=content,
            trang_thai=ZaloMessageStatus.DEMO.value,
            thoi_gian_gui=datetime.now(timezone.utc)
        )
        db.add(log)
        await db.flush()

        return {"status": "success", "mode": "demo", "log_id": log.id}

