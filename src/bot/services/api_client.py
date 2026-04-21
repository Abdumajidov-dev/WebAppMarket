import aiohttp
import logging
from config import settings

logger = logging.getLogger(__name__)


class ApiClient:
    def __init__(self):
        self._session: aiohttp.ClientSession | None = None

    @property
    def session(self) -> aiohttp.ClientSession:
        if self._session is None or self._session.closed:
            self._session = aiohttp.ClientSession(
                base_url=settings.API_BASE_URL,
                headers={"X-Bot-Secret": settings.BOT_SECRET},
            )
        return self._session

    async def get_order(self, order_id: str) -> dict:
        async with self.session.get(f"/orders/{order_id}") as resp:
            resp.raise_for_status()
            data = await resp.json()
            return data["data"]

    async def update_order_status(self, order_id: str, status: str) -> None:
        async with self.session.patch(
            f"/orders/{order_id}/status", json={"status": status}
        ) as resp:
            resp.raise_for_status()

    async def approve_proof(self, order_id: str) -> None:
        async with self.session.patch(
            f"/orders/{order_id}/payment-proof/approve"
        ) as resp:
            resp.raise_for_status()

    async def reject_proof(self, order_id: str, note: str) -> None:
        async with self.session.patch(
            f"/orders/{order_id}/payment-proof/reject",
            json={"adminNote": note},
        ) as resp:
            resp.raise_for_status()

    async def get_customer_orders(self, phone: str, active_only: bool = False) -> list:
        params: dict = {"phone": phone, "pageSize": 20}
        if active_only:
            params["activeOnly"] = "true"
        async with self.session.get("/orders/customer", params=params) as resp:
            resp.raise_for_status()
            data = await resp.json()
            return data.get("data", {}).get("items", [])

    async def get_tenant_by_order(self, order_id: str) -> dict | None:
        try:
            async with self.session.get(f"/orders/{order_id}/tenant-contact") as resp:
                if resp.status == 200:
                    data = await resp.json()
                    return data.get("data")
        except Exception:
            pass
        return None

    async def get_product(self, product_id: str) -> dict:
        async with self.session.get(f"/products/{product_id}") as resp:
            resp.raise_for_status()
            data = await resp.json()
            return data["data"]

    async def close(self) -> None:
        if self._session and not self._session.closed:
            await self._session.close()


api_client = ApiClient()
