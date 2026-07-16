import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from bookings.models import Booking

@database_sync_to_async
def is_authorized_for_booking(user, booking_id):
    try:
        booking = Booking.objects.get(id=booking_id)
        if user.is_staff or user.role == 'admin':
            return True
        if booking.customer_id == user.id or booking.worker_id == user.id:
            return True
    except Booking.DoesNotExist:
        pass
    return False

class BookingConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        user = self.scope.get("user")
        if not user or not user.is_authenticated:
            await self.close(code=4003)
            return

        self.booking_id = self.scope['url_route']['kwargs']['booking_id']  # type: ignore
        
        # Check security authorization
        authorized = await is_authorized_for_booking(user, self.booking_id)
        if not authorized:
            await self.close(code=4003)
            return

        self.group_name = f"booking_{self.booking_id}"

        # Join booking group
        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, code):
        # Leave booking group
        if hasattr(self, 'group_name'):
            await self.channel_layer.group_discard(
                self.group_name,
                self.channel_name
            )

    async def receive(self, text_data=None, bytes_data=None):
        if text_data is None:
            return
        try:
            data = json.loads(text_data)
            if data.get('type') == 'ping':
                await self.send(text_data=json.dumps({'type': 'pong'}))
        except Exception:
            pass

    async def booking_update(self, event):
        # Send update details to client
        await self.send(text_data=json.dumps(event["data"]))
