import asyncio
import logging
import sys

from aiohttp import web
from aiogram import Bot, Dispatcher
from aiogram.client.default import DefaultBotProperties
from aiogram.enums import ParseMode
from aiogram.fsm.storage.redis import RedisStorage
from aiogram.webhook.aiohttp_server import SimpleRequestHandler, setup_application
from redis.asyncio import Redis

from config import settings
from services.api_client import api_client
from services.notification import notify_new_order, notify_payment_proof
from middlewares.throttle import ThrottleMiddleware
from routers import admin, orders, products, customer

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    stream=sys.stdout,
)
logger = logging.getLogger(__name__)


def create_bot() -> Bot:
    return Bot(
        token=settings.BOT_TOKEN,
        default=DefaultBotProperties(parse_mode=ParseMode.HTML),
    )


def create_dispatcher(redis: Redis) -> Dispatcher:
    storage = RedisStorage(redis=redis)
    dp = Dispatcher(storage=storage)

    # Redis ni handler'larga inject qilish
    dp["redis"] = redis

    dp.message.middleware(ThrottleMiddleware(rate=1.0))
    dp.include_router(customer.router)
    dp.include_router(admin.router)
    dp.include_router(orders.router)
    dp.include_router(products.router)
    return dp


# ── Internal webhook from ASP.NET ──────────────────────────────────────────

async def internal_notify_handler(request: web.Request) -> web.Response:
    secret = request.headers.get("X-Bot-Secret", "")
    if secret != settings.BOT_SECRET:
        return web.Response(status=403)

    try:
        body = await request.json()
    except Exception:
        return web.Response(status=400)

    event = body.get("event")
    order = body.get("order")
    chat_id = body.get("chatId")

    if not all([event, order, chat_id]):
        return web.Response(status=400)

    bot: Bot = request.app["bot"]

    if event == "new_order":
        asyncio.create_task(notify_new_order(bot, int(chat_id), order))
    elif event == "payment_proof":
        asyncio.create_task(notify_payment_proof(bot, int(chat_id), order))
    else:
        return web.Response(status=400)

    return web.Response(status=200)


# ── Polling mode (dev) ─────────────────────────────────────────────────────

async def run_polling() -> None:
    redis = Redis.from_url(settings.REDIS_URL)
    bot = create_bot()
    dp = create_dispatcher(redis)

    app = web.Application()
    app["bot"] = bot
    app.router.add_post("/internal/notify/order", internal_notify_handler)

    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner, settings.WEBAPP_HOST, settings.WEBAPP_PORT)
    await site.start()
    logger.info("Internal webhook listening on %s:%s", settings.WEBAPP_HOST, settings.WEBAPP_PORT)

    try:
        await dp.start_polling(bot, allowed_updates=dp.resolve_used_update_types())
    finally:
        await api_client.close()
        await bot.session.close()
        await redis.aclose()
        await runner.cleanup()


# ── Webhook mode (prod) ────────────────────────────────────────────────────

def create_app() -> web.Application:
    redis = Redis.from_url(settings.REDIS_URL)
    bot = create_bot()
    dp = create_dispatcher(redis)

    async def on_startup(app: web.Application) -> None:
        webhook_url = settings.WEBHOOK_HOST + settings.WEBHOOK_PATH
        await bot.set_webhook(webhook_url)
        logger.info("Webhook set: %s", webhook_url)

    async def on_shutdown(app: web.Application) -> None:
        await bot.delete_webhook()
        await api_client.close()
        await bot.session.close()
        await redis.aclose()

    app = web.Application()
    app["bot"] = bot
    app.on_startup.append(on_startup)
    app.on_shutdown.append(on_shutdown)
    app.router.add_post("/internal/notify/order", internal_notify_handler)

    SimpleRequestHandler(dispatcher=dp, bot=bot).register(app, path=settings.WEBHOOK_PATH)
    setup_application(app, dp, bot=bot)
    return app


if __name__ == "__main__":
    if settings.WEBHOOK_HOST:
        app = create_app()
        web.run_app(app, host=settings.WEBAPP_HOST, port=settings.WEBAPP_PORT)
    else:
        asyncio.run(run_polling())
