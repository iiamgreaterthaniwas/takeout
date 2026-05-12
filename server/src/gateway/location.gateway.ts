import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
@WebSocketGateway({ cors: true })
export class LocationGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private redis = new Redis(); // default localhost:6379

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('rider_location')
  async handleLocation(
    client: Socket,
    data: { orderId: number; lat: number; lng: number },
  ) {
    // 假设从 token 获取 riderId
    // const riderId = client.data.userId;
    const riderId = 'mock_rider_id';

    // 缓存到 Redis
    await this.redis.setex(
      `rider:${riderId}:loc`,
      30,
      JSON.stringify({ lat: data.lat, lng: data.lng }),
    );

    // 推送到对应订单的用户
    this.server.to(`room_order_${data.orderId}`).emit('location_update', {
      lat: data.lat,
      lng: data.lng,
    });
  }

  @SubscribeMessage('join_order')
  handleJoin(client: Socket, orderId: number) {
    client.join(`room_order_${orderId}`);
    console.log(`Client ${client.id} joined room: room_order_${orderId}`);
  }

  @SubscribeMessage('leave_order')
  handleLeave(client: Socket, orderId: number) {
    client.leave(`room_order_${orderId}`);
    console.log(`Client ${client.id} left room: room_order_${orderId}`);
  }
}
