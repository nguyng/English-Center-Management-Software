from typing import Optional
from app.models.center import TrungTam
from app.services.zalo.base import BaseZaloProvider
from app.services.zalo.mock_provider import MockZaloProvider
from app.services.zalo.zns_provider import ProductionZnsProvider

class ZaloProviderFactory:
    @staticmethod
    def get_provider(center: Optional[TrungTam] = None, force_demo: bool = False) -> BaseZaloProvider:
        """Return the appropriate Zalo provider based on center configuration."""
        if force_demo or not center:
            return MockZaloProvider()

        # If center has a configured access token and OA ID, use Production provider
        if center.zalo_access_token and center.zalo_oa_id:
            return ProductionZnsProvider()

        return MockZaloProvider()

