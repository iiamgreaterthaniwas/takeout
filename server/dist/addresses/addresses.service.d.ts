import { PrismaService } from '../prisma/prisma.service';
type AddressInput = {
    name: string;
    phone: string;
    address: string;
    detail: string;
    lat: number;
    lng: number;
    isDefault?: boolean;
};
export declare class AddressesService {
    private prisma;
    constructor(prisma: PrismaService);
    getMyAddresses(userId: number): Promise<{
        id: number;
        userId: number;
        name: string;
        phone: string;
        address: string;
        detail: string;
        lat: number;
        lng: number;
        isDefault: boolean;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    getDefaultAddress(userId: number): Promise<{
        id: number;
        userId: number;
        name: string;
        phone: string;
        address: string;
        detail: string;
        lat: number;
        lng: number;
        isDefault: boolean;
        createdAt: Date;
        updatedAt: Date;
    } | null>;
    getAddressDetail(userId: number, id: number): Promise<{
        id: number;
        userId: number;
        name: string;
        phone: string;
        address: string;
        detail: string;
        lat: number;
        lng: number;
        isDefault: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    createAddress(userId: number, data: AddressInput): Promise<{
        id: number;
        userId: number;
        name: string;
        phone: string;
        address: string;
        detail: string;
        lat: number;
        lng: number;
        isDefault: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    updateAddress(userId: number, id: number, data: AddressInput): Promise<{
        id: number;
        userId: number;
        name: string;
        phone: string;
        address: string;
        detail: string;
        lat: number;
        lng: number;
        isDefault: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    setDefaultAddress(userId: number, id: number): Promise<{
        id: number;
        userId: number;
        name: string;
        phone: string;
        address: string;
        detail: string;
        lat: number;
        lng: number;
        isDefault: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    deleteAddress(userId: number, id: number): Promise<{
        success: boolean;
    }>;
    private validateAddress;
}
export {};
