from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.constants import UserRole, UserStatus
from app.core.exceptions import (
    DuplicateResourceException,
    ResourceNotFoundException
)
from app.core.security import hash_password
from app.models.user import NguoiDung
from app.models.class_room import LopHoc
from app.schemas.teacher import TeacherCreate, TeacherOut, TeacherUpdate

class TeacherService:
    @staticmethod
    async def get_all(
        db: AsyncSession,
        tenant_id: int,
        search: Optional[str] = None,
        status: Optional[str] = None
    ) -> List[TeacherOut]:
        query = select(NguoiDung).options(
            selectinload(NguoiDung.teaching_classes)
        ).where(
            NguoiDung.trung_tam_id == tenant_id,
            NguoiDung.vai_tro == UserRole.TEACHER.value
        )

        if search:
            s = f"%{search.strip()}%"
            query = query.where(
                (NguoiDung.ho_ten.ilike(s)) | (NguoiDung.email.ilike(s)) | (NguoiDung.sdt.ilike(s))
            )

        if status:
            query = query.where(NguoiDung.trang_thai == status)

        query = query.order_by(NguoiDung.ho_ten.asc())
        result = await db.execute(query)
        teachers = result.scalars().all()

        return [
            TeacherOut(
                id=t.id,
                ho_ten=t.ho_ten,
                email=t.email,
                sdt=t.sdt,
                vai_tro=t.vai_tro,
                trang_thai=t.trang_thai,
                classes=[c.ten_lop for c in t.teaching_classes]
            )
            for t in teachers
        ]

    @staticmethod
    async def get_by_id(db: AsyncSession, tenant_id: int, teacher_id: int) -> TeacherOut:
        query = select(NguoiDung).options(
            selectinload(NguoiDung.teaching_classes)
        ).where(
            NguoiDung.id == teacher_id,
            NguoiDung.trung_tam_id == tenant_id,
            NguoiDung.vai_tro == UserRole.TEACHER.value
        )
        result = await db.execute(query)
        teacher = result.scalar_one_or_none()
        if not teacher:
            raise ResourceNotFoundException(f"Không tìm thấy giáo viên có ID {teacher_id}")

        return TeacherOut(
            id=teacher.id,
            ho_ten=teacher.ho_ten,
            email=teacher.email,
            sdt=teacher.sdt,
            vai_tro=teacher.vai_tro,
            trang_thai=teacher.trang_thai,
            classes=[c.ten_lop for c in teacher.teaching_classes]
        )

    @staticmethod
    async def create(db: AsyncSession, tenant_id: int, data: TeacherCreate) -> TeacherOut:
        email_clean = data.email.lower().strip()
        existing = await db.execute(select(NguoiDung).where(NguoiDung.email == email_clean))
        if existing.scalar_one_or_none():
            raise DuplicateResourceException(f"Email '{email_clean}' đã được sử dụng")

        teacher = NguoiDung(
            trung_tam_id=tenant_id,
            ho_ten=data.ho_ten.strip(),
            email=email_clean,
            sdt=data.sdt.strip() if data.sdt else None,
            mat_khau_hash=hash_password(data.mat_khau),
            vai_tro=UserRole.TEACHER.value,
            trang_thai=UserStatus.ACTIVE.value
        )
        db.add(teacher)
        await db.commit()
        await db.refresh(teacher)

        return TeacherOut(
            id=teacher.id,
            ho_ten=teacher.ho_ten,
            email=teacher.email,
            sdt=teacher.sdt,
            vai_tro=teacher.vai_tro,
            trang_thai=teacher.trang_thai,
            classes=[]
        )

    @staticmethod
    async def update(db: AsyncSession, tenant_id: int, teacher_id: int, data: TeacherUpdate) -> TeacherOut:
        query = select(NguoiDung).options(
            selectinload(NguoiDung.teaching_classes)
        ).where(
            NguoiDung.id == teacher_id,
            NguoiDung.trung_tam_id == tenant_id,
            NguoiDung.vai_tro == UserRole.TEACHER.value
        )
        result = await db.execute(query)
        teacher = result.scalar_one_or_none()
        if not teacher:
            raise ResourceNotFoundException(f"Không tìm thấy giáo viên có ID {teacher_id}")

        if data.ho_ten is not None:
            teacher.ho_ten = data.ho_ten.strip()
        if data.sdt is not None:
            teacher.sdt = data.sdt.strip()

        await db.commit()
        await db.refresh(teacher)

        return TeacherOut(
            id=teacher.id,
            ho_ten=teacher.ho_ten,
            email=teacher.email,
            sdt=teacher.sdt,
            vai_tro=teacher.vai_tro,
            trang_thai=teacher.trang_thai,
            classes=[c.ten_lop for c in teacher.teaching_classes]
        )

    @staticmethod
    async def update_status(db: AsyncSession, tenant_id: int, teacher_id: int, new_status: str) -> TeacherOut:
        query = select(NguoiDung).options(
            selectinload(NguoiDung.teaching_classes)
        ).where(
            NguoiDung.id == teacher_id,
            NguoiDung.trung_tam_id == tenant_id,
            NguoiDung.vai_tro == UserRole.TEACHER.value
        )
        result = await db.execute(query)
        teacher = result.scalar_one_or_none()
        if not teacher:
            raise ResourceNotFoundException(f"Không tìm thấy giáo viên có ID {teacher_id}")

        teacher.trang_thai = new_status
        await db.commit()
        await db.refresh(teacher)

        return TeacherOut(
            id=teacher.id,
            ho_ten=teacher.ho_ten,
            email=teacher.email,
            sdt=teacher.sdt,
            vai_tro=teacher.vai_tro,
            trang_thai=teacher.trang_thai,
            classes=[c.ten_lop for c in teacher.teaching_classes]
        )

