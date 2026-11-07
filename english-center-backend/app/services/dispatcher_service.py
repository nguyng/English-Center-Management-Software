import asyncio
from typing import Any, Dict, List
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.constants import (
    AttendanceState,
    ExamFormat,
    SessionAttendanceStatus,
    SessionStatus,
    StudentStatus,
    ZaloMessageType
)
from app.models.attendance import DiemDanh
from app.models.center import TrungTam
from app.models.exam import BaiKiemTra
from app.models.result import KetQua
from app.models.session import BuoiHoc
from app.models.student import HocSinh
from app.models.zalo_log import NhatKyZalo
from app.services.exam_service import calculate_rank
from app.services.zalo.factory import ZaloProviderFactory

class DispatcherService:
    @staticmethod
    async def dispatch_session_notifications(
        db: AsyncSession,
        session_id: int
    ) -> Dict[str, Any]:
        """Core Dispatcher executing the 4-scenario Decision Tree."""
        # 1. Fetch Session
        query = select(BuoiHoc).options(
            selectinload(BuoiHoc.class_room),
            selectinload(BuoiHoc.exams)
        ).where(BuoiHoc.id == session_id)

        result = await db.execute(query)
        session = result.scalar_one_or_none()
        if not session:
            return {"status": "error", "message": "Session not found"}

        # Safety Check 1: Normal shift only (not Holiday, not Cancelled)
        if session.trang_thai_buoi_hoc != SessionStatus.NORMAL.value:
            return {"status": "skipped", "message": "Session is cancelled or holiday"}

        # Safety Check 2: Must be confirmed attendance (Safety Net)
        if session.trang_thai_diem_danh != SessionAttendanceStatus.TAKEN.value:
            return {"status": "skipped", "message": "Teacher has not taken attendance yet"}

        # Fetch Center
        center = await db.get(TrungTam, session.trung_tam_id)
        if not center:
            return {"status": "error", "message": "Center not found"}

        provider = ZaloProviderFactory.get_provider(center)

        # Fetch all studying students
        stu_query = select(HocSinh).where(
            HocSinh.lop_id == session.lop_id,
            HocSinh.trung_tam_id == session.trung_tam_id,
            HocSinh.trang_thai == StudentStatus.STUDYING.value
        )
        stu_res = await db.execute(stu_query)
        students = stu_res.scalars().all()

        # Query attendances directly from DB to prevent stale identity map
        att_res = await db.execute(
            select(DiemDanh).where(DiemDanh.buoi_hoc_id == session_id)
        )
        att_map = {a.hoc_sinh_id: a.trang_thai for a in att_res.scalars().all()}

        # Check for exams in session
        online_exam = next((e for e in session.exams if e.hinh_thuc == ExamFormat.ONLINE.value), None)
        paper_exam = next((e for e in session.exams if e.hinh_thuc == ExamFormat.PAPER.value), None)

        # Pre-fetch results if any exam exists
        results_map = {}
        target_exam = online_exam or paper_exam
        if target_exam:
            res_query = select(KetQua).where(KetQua.bai_kiem_tra_id == target_exam.id)
            res_exec = await db.execute(res_query)
            for r in res_exec.scalars().all():
                results_map[r.hoc_sinh_id] = float(r.diem_so)

        sent_absent_count = 0
        sent_score_count = 0
        silent_count = 0

        for student in students:
            student_state = att_map.get(student.id, AttendanceState.PRESENT.value)

            try:
                if student_state == AttendanceState.ABSENT.value:
                    # SCENARIO 1: Absent student -> ALWAYS send absent notice
                    send_res = await provider.send_absent_notice(
                        db=db,
                        center=center,
                        student=student,
                        session=session
                    )
                    if send_res.get("status") in ("success", "demo"):
                        sent_absent_count += 1
                    await asyncio.sleep(0.01)  # Rate limiting in tests/async

                else:
                    # Present student
                    if target_exam and student.id in results_map:
                        # SCENARIO 2: Present + Exam graded -> send score notice
                        score = results_map[student.id]
                        rank = calculate_rank(score)
                        send_res = await provider.send_score_notice(
                            db=db,
                            center=center,
                            student=student,
                            session=session,
                            exam_name=target_exam.ten_bai_kiem_tra,
                            score=score,
                            rank=rank
                        )
                        if send_res.get("status") in ("success", "demo"):
                            sent_score_count += 1
                        await asyncio.sleep(0.01)  # Rate limiting
                    else:
                        # SCENARIO 3 & 4: Present but exam not graded yet or no exam -> SILENT
                        silent_count += 1

            except Exception:
                # Per-student isolation: One student's failure does not break the loop
                continue

        session.da_gui = True
        await db.commit()

        return {
            "status": "completed",
            "sent_absent": sent_absent_count,
            "sent_score": sent_score_count,
            "silent": silent_count
        }
