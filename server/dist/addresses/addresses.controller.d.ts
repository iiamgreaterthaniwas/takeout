import { AddressesService } from './addresses.service';
export declare class AddressesController {
    private readonly addressesService;
    constructor(addressesService: AddressesService);
    getMyAddresses(req: any): Promise<{
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
    getDefaultAddress(req: any): Promise<{
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
    getAddressDetail(req: any, id: string): Promise<{
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
    createAddress(req: any, data: any): Promise<{
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
    updateAddress(req: any, id: string, data: any): Promise<{
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
    setDefaultAddress(req: any, id: string): Promise<{
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
    deleteAddress(req: any, id: string): Promise<{
        success: boolean;
    }>;
}
