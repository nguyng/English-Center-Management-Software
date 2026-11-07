from datetime import datetime, time, timedelta, timezone
from decimal import Decimal
from typing import Any, Dict, List
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.constants import (
    AttendanceState,
    ScheduleTaskStatus,
    ZaloMessageType
)
from app.core.exceptions import (
    BusinessRuleViolationException,
    ResourceNotFoundException
)
from app.models.attendance import DiemDanh
from app.models.center import TrungTam
from app.models.exam import BaiKiemTra
from app.models.result import KetQua
from app.models.schedule_task import HenGioGuiTin
from app.models.session import BuoiHoc
from app.models.student import HocSinh
from app.models.user import NguoiDung
from app.models.zalo_log import NhatKyZalo
from app.schemas.exam import ManualScoresIn
from app.schemas.result import ResultOut, StudentResultOut
from app.services.exam_service import calculate_rank
from app.services.zalo.factory import ZaloProviderFactory

class ResultService:
    @staticmethod
    async def get_results_by_exam(
        db: AsyncSession,
        tenant_id: int,
        exam_id: int
    ) -> List[ResultOut]:
        query = select(KetQua).options(
            selectinload(KetQua.student)
        ).where(
            KetQua.bai_kiem_tra_id == exam_id,
            KetQua.trung_tam_id == tenant_id
        ).order_by(KetQua.diem_so.desc())

        result = await db.execute(query)
        records = result.scalars().all()

        results = []
        for r in records:
            correct_count = 0
            if r.chi_tiet_tra_loi and isinstance(r.chi_tiet_tra_loi, dict):
                correct_count = sum(
                    1 for v in r.chi_tiet_tra_loi.values()
                    if isinstance(v, dict) and v.get("is_correct")
                )
            results.append(
                ResultOut(
                    id=r.id,
                    hoc_sinh_id=r.hoc_sinh_id,
                    ho_ten=r.student.ho_ten if r.student else "Chưa rõ",
                    diem_so=float(r.diem_so),
                    diem_thu_cong=float(r.diem_thu_cong) if r.diem_thu_cong is not None else None,
                    so_lan_roi_tab=r.so_lan_roi_tab,
                    thoi_gian_nop=r.thoi_gian_nop,
                    xep_loai=calculate_rank(float(r.diem_so)),
                    chi_tiet_tra_loi=r.chi_tiet_tra_loi,
                    so_cau_dung=correct_count
                )
            )
        return results

    @staticmethod
    async def get_results_by_student(
        db: AsyncSession,
        tenant_id: int,
        student_id: int
    ) -> List[StudentResultOut]:
        query = select(KetQua).options(
            selectinload(KetQua.exam)
        ).where(
            KetQua.hoc_sinh_id == student_id,
            KetQua.trung_tam_id == tenant_id
        ).order_by(KetQua.thoi_gian_nop.desc())

        result = await db.execute(query)
        records = result.scalars().all()

        return [
            StudentResultOut(
                id=r.id,
                bai_kiem_tra_id=r.bai_kiem_tra_id,
                ten_bai_kiem_tra=r.exam.ten_bai_kiem_tra if r.exam else "Bài kiểm tra",
                ngay_kiem_tra=r.exam.ngay_kiem_tra.strftime("%d/%m/%Y") if r.exam else "",
                diem_so=float(r.diem_so),
                xep_loai=calculate_rank(float(r.diem_so)),
                thoi_gian_nop=r.thoi_gian_nop
            )
            for r in records
        ]

    @staticmethod
    async def save_manual_scores(
        db: AsyncSession,
        tenant_id: int,
        current_user: NguoiDung,
        exam_id: int,
        data: ManualScoresIn
    ) -> Dict[str, Any]:
        # 1. Fetch exam & session
        query = select(BaiKiemTra).options(
            selectinload(BaiKiemTra.session)
        ).where(BaiKiemTra.id == exam_id, BaiKiemTra.trung_tam_id == tenant_id)
        result = await db.execute(query)
        exam = result.scalar_one_or_none()
        if not exam:
            raise ResourceNotFoundException(f"Không tìm thấy bài thi có ID {exam_id}")

        session_id = exam.buoi_hoc_id
        session = exam.session

        # 2. Check attendance records for the session if exists
        absent_student_ids = set()
        if session_id:
            att_res = await db.execute(
                select(DiemDanh).where(DiemDanh.buoi_hoc_id == session_id)
            )
            for a in att_res.scalars().all():
                if a.trang_thai == AttendanceState.ABSENT.value:
                    absent_student_ids.add(a.hoc_sinh_id)

        # 3. Existing results
        existing_res = await db.execute(
            select(KetQua).where(KetQua.bai_kiem_tra_id == exam_id)
        )
        existing_results = {r.hoc_sinh_id: r for r in existing_res.scalars().all()}

        # 4. Already sent Zalo notifications
        sent_zalo_student_ids = set()
        if session_id:
            sent_res = await db.execute(
                select(NhatKyZalo.hoc_sinh_id).where(
                    NhatKyZalo.buoi_hoc_id == session_id,
                    NhatKyZalo.loai_tin == ZaloMessageType.SCORE_NOTICE.value
                )
            )
            sent_zalo_student_ids = set(sent_res.scalars().all())

        center = await db.get(TrungTam, tenant_id)
        provider = ZaloProviderFactory.get_provider(center)

        updated_count = 0
        queued_count = 0
        sent_count = 0

        # Calculate morning schedule time (07:30 tomorrow)
        now_utc = datetime.now(timezone.utc)
        tomorrow = now_utc.date() + timedelta(days=1)
        morning_schedule_dt = datetime.combine(tomorrow, time(7, 30), tzinfo=timezone.utc)

        for sid_str, score_val in data.scores.items():
            if score_val is None:
                continue

            try:
                sid = int(sid_str)
            except ValueError:
                continue

            # Check: Block absent students
            if sid in absent_student_ids:
                raise BusinessRuleViolationException(
                    f"Học sinh ID {sid} vắng mặt trong buổi học này, không thể nhập điểm thi!"
                )

            clean_score = round(Decimal(str(score_val)), 1)
            if clean_score < Decimal("0.0") or clean_score > Decimal("10.0"):
                raise BusinessRuleViolationException(
                    f"Điểm số của học sinh ID {sid} phải nằm trong khoảng từ 0.0 đến 10.0"
                )

            # Upsert KetQua
            if sid in existing_results:
                existing_results[sid].diem_so = clean_score
                existing_results[sid].diem_thu_cong = clean_score
            else:
                new_res = KetQua(
                    trung_tam_id=tenant_id,
                    bai_kiem_tra_id=exam_id,
                    hoc_sinh_id=sid,
                    diem_so=clean_score,
                    diem_thu_cong=clean_score,
                    so_lan_roi_tab=0,
                    thoi_gian_nop=datetime.now(timezone.utc)
                )
                db.add(new_res)
            updated_count += 1

            # Check if notification should be sent
            if session and sid not in sent_zalo_student_ids:
                student = await db.get(HocSinh, sid)
                if not student:
                    continue

                if data.scheduleForMorning:
                    # Queue in HenGioGuiTin
                    queue_item = HenGioGuiTin(
                        trung_tam_id=tenant_id,
                        buoi_hoc_id=session.id,
                        hoc_sinh_id=sid,
                        loai_tin=ZaloMessageType.SCORE_NOTICE.value,
                        diem_so=clean_score,
                        thoi_gian_hen_gui=morning_schedule_dt,
                        trang_thai=ScheduleTaskStatus.PENDING.value
                    )
                    db.add(queue_item)
                    queued_count += 1
                else:
                    # Send immediately
                    rank = calculate_rank(float(clean_score))
                    await provider.send_score_notice(
                        db=db,
                        center=center,
                        student=student,
                        session=session,
                        exam_name=exam.ten_bai_kiem_tra,
                        score=float(clean_score),
                        rank=rank
                    )
                    sent_count += 1

        await db.commit()

        return {
            "success": True,
            "updated_count": updated_count,
            "queued_count": queued_count,
            "sent_count": sent_count
        }

