from abc import ABC, abstractmethod
from typing import Any, Dict
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.center import TrungTam
from app.models.student import HocSinh
from app.models.session import BuoiHoc

class BaseZaloProvider(ABC):
    @abstractmethod
    async def send_absent_notice(
        self,
        db: AsyncSession,
        center: TrungTam,
        student: HocSinh,
        session: BuoiHoc
    ) -> Dict[str, Any]:
        """Send absent notification to student's parent."""
        pass

    @abstractmethod
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
        """Send exam score notification to student's parent."""
        pass

