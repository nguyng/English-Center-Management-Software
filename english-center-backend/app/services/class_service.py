from typing import List, Optional
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.constants import StudentStatus, UserRole
from app.core.exceptions import (
    DuplicateResourceException,
    ForbiddenException,
    ResourceNotFoundException
)
from app.models.class_room import LopHoc
from app.models.student import HocSinh
from app.models.user import NguoiDung
from app.schemas.class_room import ClassCreate, ClassOut, ClassUpdate

class ClassService:
    @staticmethod
    async def get_all(
        db: AsyncSession,
        tenant_id: int,
        current_user: NguoiDung,
        teacher_id: Optional[int] = None,
        search: Optional[str] = None
    ) -> List[ClassOut]:
        query = select(LopHoc).options(
            selectinload(LopHoc.teacher),
            selectinload(LopHoc.students)
        ).where(LopHoc.trung_tam_id == tenant_id)

        # Scoped access: Teacher can only see their own classes
        if current_user.vai_tro == UserRole.TEACHER.value:
            query = query.where(LopHoc.giao_vien_id == current_user.id)
        elif teacher_id:
            query = query.where(LopHoc.giao_vien_id == teacher_id)

        if search:
            s = f"%{search.strip()}%"
            query = query.where(
                (LopHoc.ma_lop.ilike(s)) | (LopHoc.ten_lop.ilike(s))
            )

        query = query.order_by(LopHoc.ten_lop.asc())
        result = await db.execute(query)
        classes = result.scalars().all()

        class_list = []
        for c in classes:
            studying_count = sum(1 for s in c.students if s.trang_thai == StudentStatus.STUDYING.value)
            class_list.append(
                ClassOut(
                    id=c.id,
                    ma_lop=c.ma_lop,
                    ten_lop=c.ten_lop,
                    giao_vien_id=c.giao_vien_id,
                    giao_vien=c.teacher.ho_ten if c.teacher else "Chưa phân công",
                    so_hoc_sinh=studying_count
                )
            )

        return class_list

    @staticmethod
    async def get_by_id(
        db: AsyncSession,
        tenant_id: int,
        current_user: NguoiDung,
        class_id: int
    ) -> ClassOut:
        query = select(LopHoc).options(
            selectinload(LopHoc.teacher),
            selectinload(LopHoc.students)
        ).where(LopHoc.id == class_id, LopHoc.trung_tam_id == tenant_id)

        result = await db.execute(query)
        cls_obj = result.scalar_one_or_none()

        if not cls_obj:
            raise ResourceNotFoundException(f"Không tìm thấy lớp học có ID {class_id}")

        if current_user.vai_tro == UserRole.TEACHER.value and cls_obj.giao_vien_id != current_user.id:
            raise ResourceNotFoundException(f"Không tìm thấy lớp học có ID {class_id}")

        studying_count = sum(1 for s in cls_obj.students if s.trang_thai == StudentStatus.STUDYING.value)
        return ClassOut(
            id=cls_obj.id,
            ma_lop=cls_obj.ma_lop,
            ten_lop=cls_obj.ten_lop,
            giao_vien_id=cls_obj.giao_vien_id,
            giao_vien=cls_obj.teacher.ho_ten if cls_obj.teacher else "Chưa phân công",
            so_hoc_sinh=studying_count
        )

    @staticmethod
    async def create(db: AsyncSession, tenant_id: int, data: ClassCreate) -> ClassOut:
        # Check teacher exists in tenant
        teacher_query = select(NguoiDung).where(
            NguoiDung.id == data.giao_vien_id,
            NguoiDung.trung_tam_id == tenant_id
        )
        t_res = await db.execute(teacher_query)
        teacher = t_res.scalar_one_or_none()
        if not teacher:
            raise ResourceNotFoundException("Giáo viên được chọn không tồn tại trong trung tâm")

        # Check unique (trung_tam_id, ma_lop)
        existing = await db.execute(
            select(LopHoc).where(
                LopHoc.trung_tam_id == tenant_id,
                LopHoc.ma_lop == data.ma_lop.strip()
            )
        )
        if existing.scalar_one_or_none():
            raise DuplicateResourceException(f"Mã lớp '{data.ma_lop}' đã tồn tại trong trung tâm")

        new_class = LopHoc(
            trung_tam_id=tenant_id,
            ma_lop=data.ma_lop.strip(),
            ten_lop=data.ten_lop.strip(),
            giao_vien_id=data.giao_vien_id
        )
        db.add(new_class)
        await db.commit()
        await db.refresh(new_class)

        return ClassOut(
            id=new_class.id,
            ma_lop=new_class.ma_lop,
            ten_lop=new_class.ten_lop,
            giao_vien_id=new_class.giao_vien_id,
            giao_vien=teacher.ho_ten,
            so_hoc_sinh=0
        )

    @staticmethod
    async def update(db: AsyncSession, tenant_id: int, class_id: int, data: ClassUpdate) -> ClassOut:
        query = select(LopHoc).options(
            selectinload(LopHoc.teacher),
            selectinload(LopHoc.students)
        ).where(LopHoc.id == class_id, LopHoc.trung_tam_id == tenant_id)
        result = await db.execute(query)
        cls_obj = result.scalar_one_or_none()

        if not cls_obj:
            raise ResourceNotFoundException(f"Không tìm thấy lớp học có ID {class_id}")

        if data.giao_vien_id is not None and data.giao_vien_id != cls_obj.giao_vien_id:
            teacher_query = select(NguoiDung).where(
                NguoiDung.id == data.giao_vien_id,
                NguoiDung.trung_tam_id == tenant_id
            )
            t_res = await db.execute(teacher_query)
            new_teacher = t_res.scalar_one_or_none()
            if not new_teacher:
                raise ResourceNotFoundException("Giáo viên được chọn không tồn tại")
            cls_obj.giao_vien_id = data.giao_vien_id

        if data.ma_lop is not None and data.ma_lop.strip() != cls_obj.ma_lop:
            existing = await db.execute(
                select(LopHoc).where(
                    LopHoc.trung_tam_id == tenant_id,
                    LopHoc.ma_lop == data.ma_lop.strip(),
                    LopHoc.id != class_id
                )
            )
            if existing.scalar_one_or_none():
                raise DuplicateResourceException(f"Mã lớp '{data.ma_lop}' đã tồn tại trong trung tâm")
            cls_obj.ma_lop = data.ma_lop.strip()

        if data.ten_lop is not None:
            cls_obj.ten_lop = data.ten_lop.strip()

        await db.commit()
        await db.refresh(cls_obj)

        studying_count = sum(1 for s in cls_obj.students if s.trang_thai == StudentStatus.STUDYING.value)
        return ClassOut(
            id=cls_obj.id,
            ma_lop=cls_obj.ma_lop,
            ten_lop=cls_obj.ten_lop,
            giao_vien_id=cls_obj.giao_vien_id,
            giao_vien=cls_obj.teacher.ho_ten if cls_obj.teacher else "Chưa phân công",
            so_hoc_sinh=studying_count
        )

    @staticmethod
    async def delete(db: AsyncSession, tenant_id: int, class_id: int) -> None:
        query = select(LopHoc).where(LopHoc.id == class_id, LopHoc.trung_tam_id == tenant_id)
        result = await db.execute(query)
        cls_obj = result.scalar_one_or_none()
        if not cls_obj:
            raise ResourceNotFoundException(f"Không tìm thấy lớp học có ID {class_id}")

        await db.delete(cls_obj)
        await db.commit()

