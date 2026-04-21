from __future__ import annotations
from redis.asyncio import Redis

_PREFIX = "user:"


class UserSettings:
    def __init__(self, redis: Redis):
        self._r = redis

    def _key(self, user_id: int) -> str:
        return f"{_PREFIX}{user_id}"

    async def get_lang(self, user_id: int) -> str:
        raw = await self._r.hget(self._key(user_id), "lang")
        return raw.decode() if raw else "uz"

    async def set_lang(self, user_id: int, lang: str) -> None:
        await self._r.hset(self._key(user_id), "lang", lang)

    async def get_phone(self, user_id: int) -> str | None:
        raw = await self._r.hget(self._key(user_id), "phone")
        return raw.decode() if raw else None

    async def set_phone(self, user_id: int, phone: str) -> None:
        await self._r.hset(self._key(user_id), "phone", phone)

    async def get(self, user_id: int) -> dict:
        data = await self._r.hgetall(self._key(user_id))
        return {k.decode(): v.decode() for k, v in data.items()}
