import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
export declare class LocationGateway implements OnGatewayConnection, OnGatewayDisconnect {
    server: Server;
    private redis;
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): void;
    handleLocation(client: Socket, data: {
        orderId: number;
        lat: number;
        lng: number;
    }): Promise<void>;
    handleJoin(client: Socket, orderId: number): void;
    handleLeave(client: Socket, orderId: number): void;
}
