import time
from typing import Any, Awaitable, Callable
from aiogram import BaseMiddleware
from aiogram.types import TelegramObject, Message


class ThrottleMiddleware(BaseMiddleware):
    def __init__(self, rate: float = 1.0):
        self.rate = rate
        self._timestamps: dict[int, float] = {}

    async def __call__(
        self,
        handler: Callable[[TelegramObject, dict[str, Any]], Awaitable[Any]],
        event: TelegramObject,
        data: dict[str, Any],
    ) -> Any:
        if isinstance(event, Message) and event.from_user:
            user_id = event.from_user.id
            now = time.monotonic()
            last = self._timestamps.get(user_id, 0)
            if now - last < self.rate:
                return
            self._timestamps[user_id] = now
        return await handler(event, data)
