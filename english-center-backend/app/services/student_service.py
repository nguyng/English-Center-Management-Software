from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.constants import StudentStatus, UserRole
from app.core.exceptions import (
    ForbiddenException,
    ResourceNotFoundException
)
from app.models.class_room import LopHoc
from app.models.student import HocSinh
from app.models.user import NguoiDung
from app.schemas.student import StudentCreate, StudentOut, StudentUpdate

class StudentService:
    @staticmethod
    async def get_all(
        db: AsyncSession,
        tenant_id: int,
        current_user: NguoiDung,
        class_id: Optional[int] = None,
        status: Optional[str] = None,
        search: Optional[str] = None
    ) -> List[StudentOut]:
        query = select(HocSinh).options(
            selectinload(HocSinh.class_room)
        ).where(HocSinh.trung_tam_id == tenant_id)

        # Scoped access for Teacher
        if current_user.vai_tro == UserRole.TEACHER.value:
            teacher_classes = select(LopHoc.id).where(
                LopHoc.trung_tam_id == tenant_id,
                LopHoc.giao_vien_id == current_user.id
            )
            query = query.where(HocSinh.lop_id.in_(teacher_classes))

        if class_id:
            query = query.where(HocSinh.lop_id == class_id)

        if status:
            query = query.where(HocSinh.trang_thai == status)

        if search:
            s = f"%{search.strip()}%"
            query = query.where(
                (HocSinh.ho_ten.ilike(s)) | (HocSinh.sdt_phu_huynh.ilike(s))
            )

        query = query.order_by(HocSinh.ho_ten.asc())
        result = await db.execute(query)
        students = result.scalars().all()

        return [
            StudentOut(
                id=s.id,
                ho_ten=s.ho_ten,
                sdt_phu_huynh=s.sdt_phu_huynh,
                lop_id=s.lop_id,
                lop=s.class_room.ten_lop if s.class_room else "Chưa xếp lớp",
                ngay_nhap_hoc=s.ngay_nhap_hoc,
                trang_thai=s.trang_thai
            )
            for s in students
        ]

    @staticmethod
    async def get_by_id(
        db: AsyncSession,
        tenant_id: int,
        current_user: NguoiDung,
        student_id: int
    ) -> StudentOut:
        query = select(HocSinh).options(
            selectinload(HocSinh.class_room)
        ).where(HocSinh.id == student_id, HocSinh.trung_tam_id == tenant_id)

        result = await db.execute(query)
        student = result.scalar_one_or_none()
        if not student:
            raise ResourceNotFoundException(f"Không tìm thấy học sinh có ID {student_id}")

        if current_user.vai_tro == UserRole.TEACHER.value:
            if student.class_room.giao_vien_id != current_user.id:
                raise ResourceNotFoundException(f"Không tìm thấy học sinh có ID {student_id}")

        return StudentOut(
            id=student.id,
            ho_ten=student.ho_ten,
            sdt_phu_huynh=student.sdt_phu_huynh,
            lop_id=student.lop_id,
            lop=student.class_room.ten_lop if student.class_room else "Chưa xếp lớp",
            ngay_nhap_hoc=student.ngay_nhap_hoc,
            trang_thai=student.trang_thai
        )

    @staticmethod
    async def create(db: AsyncSession, tenant_id: int, data: StudentCreate) -> StudentOut:
        # Check class belongs to tenant
        class_query = select(LopHoc).where(LopHoc.id == data.lop_id, LopHoc.trung_tam_id == tenant_id)
        c_res = await db.execute(class_query)
        class_room = c_res.scalar_one_or_none()
        if not class_room:
            raise ResourceNotFoundException(f"Lớp học ID {data.lop_id} không tồn tại trong trung tâm")

        student = HocSinh(
            trung_tam_id=tenant_id,
            lop_id=data.lop_id,
            ho_ten=data.ho_ten.strip(),
            sdt_phu_huynh=data.sdt_phu_huynh.strip(),
            ngay_nhap_hoc=data.ngay_nhap_hoc,
            trang_thai=StudentStatus.STUDYING.value
        )
        db.add(student)
        await db.commit()
        await db.refresh(student)

        return StudentOut(
            id=student.id,
            ho_ten=student.ho_ten,
            sdt_phu_huynh=student.sdt_phu_huynh,
            lop_id=student.lop_id,
            lop=class_room.ten_lop,
            ngay_nhap_hoc=student.ngay_nhap_hoc,
            trang_thai=student.trang_thai
        )

    @staticmethod
    async def update(db: AsyncSession, tenant_id: int, student_id: int, data: StudentUpdate) -> StudentOut:
        query = select(HocSinh).options(
            selectinload(HocSinh.class_room)
        ).where(HocSinh.id == student_id, HocSinh.trung_tam_id == tenant_id)
        result = await db.execute(query)
        student = result.scalar_one_or_none()
        if not student:
            raise ResourceNotFoundException(f"Không tìm thấy học sinh có ID {student_id}")

        if data.lop_id is not None and data.lop_id != student.lop_id:
            class_query = select(LopHoc).where(LopHoc.id == data.lop_id, LopHoc.trung_tam_id == tenant_id)
            c_res = await db.execute(class_query)
            if not c_res.scalar_one_or_none():
                raise ResourceNotFoundException(f"Lớp học ID {data.lop_id} không tồn tại trong trung tâm")
            student.lop_id = data.lop_id

        if data.ho_ten is not None:
            student.ho_ten = data.ho_ten.strip()
        if data.sdt_phu_huynh is not None:
            student.sdt_phu_huynh = data.sdt_phu_huynh.strip()
        if data.ngay_nhap_hoc is not None:
            student.ngay_nhap_hoc = data.ngay_nhap_hoc

        await db.commit()
        await db.refresh(student)

        return StudentOut(
            id=student.id,
            ho_ten=student.ho_ten,
            sdt_phu_huynh=student.sdt_phu_huynh,
            lop_id=student.lop_id,
            lop=student.class_room.ten_lop if student.class_room else "Chưa xếp lớp",
            ngay_nhap_hoc=student.ngay_nhap_hoc,
            trang_thai=student.trang_thai
        )

    @staticmethod
    async def update_status(db: AsyncSession, tenant_id: int, student_id: int, new_status: str) -> StudentOut:
        query = select(HocSinh).options(
            selectinload(HocSinh.class_room)
        ).where(HocSinh.id == student_id, HocSinh.trung_tam_id == tenant_id)
        result = await db.execute(query)
        student = result.scalar_one_or_none()
        if not student:
            raise ResourceNotFoundException(f"Không tìm thấy học sinh có ID {student_id}")

        student.trang_thai = new_status
        await db.commit()
        await db.refresh(student)

        return StudentOut(
            id=student.id,
            ho_ten=student.ho_ten,
            sdt_phu_huynh=student.sdt_phu_huynh,
            lop_id=student.lop_id,
            lop=student.class_room.ten_lop if student.class_room else "Chưa xếp lớp",
            ngay_nhap_hoc=student.ngay_nhap_hoc,
            trang_thai=student.trang_thai
        )

    @staticmethod
    async def delete(db: AsyncSession, tenant_id: int, student_id: int) -> None:
        query = select(HocSinh).where(HocSinh.id == student_id, HocSinh.trung_tam_id == tenant_id)
        result = await db.execute(query)
        student = result.scalar_one_or_none()
        if not student:
            raise ResourceNotFoundException(f"Không tìm thấy học sinh có ID {student_id}")

        await db.delete(student)
        await db.commit()

