import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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

@Injectable()
export class AddressesService {
  constructor(private prisma: PrismaService) {}

  async getMyAddresses(userId: number) {
    return this.prisma.address.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { updatedAt: 'desc' }],
    });
  }

  async getDefaultAddress(userId: number) {
    return this.prisma.address.findFirst({
      where: { userId, isDefault: true },
    });
  }

  async getAddressDetail(userId: number, id: number) {
    const address = await this.prisma.address.findFirst({
      where: { id, userId },
    });
    if (!address) throw new NotFoundException('地址不存在');
    return address;
  }

  async createAddress(userId: number, data: AddressInput) {
    this.validateAddress(data);

    const count = await this.prisma.address.count({ where: { userId } });
    const shouldSetDefault = Boolean(data.isDefault) || count === 0;

    return this.prisma.$transaction(async (tx) => {
      if (shouldSetDefault) {
        await tx.address.updateMany({
          where: { userId, isDefault: true },
          data: { isDefault: false },
        });
      }

      return tx.address.create({
        data: {
          userId,
          name: data.name.trim(),
          phone: data.phone.trim(),
          address: data.address.trim(),
          detail: data.detail.trim(),
          lat: Number(data.lat),
          lng: Number(data.lng),
          isDefault: shouldSetDefault,
        },
      });
    });
  }

  async updateAddress(userId: number, id: number, data: AddressInput) {
    this.validateAddress(data);

    const existing = await this.prisma.address.findFirst({
      where: { id, userId },
    });
    if (!existing) throw new NotFoundException('地址不存在');

    const shouldSetDefault = Boolean(data.isDefault);

    return this.prisma.$transaction(async (tx) => {
      if (shouldSetDefault) {
        await tx.address.updateMany({
          where: { userId, isDefault: true, id: { not: id } },
          data: { isDefault: false },
        });
      }

      return tx.address.update({
        where: { id },
        data: {
          name: data.name.trim(),
          phone: data.phone.trim(),
          address: data.address.trim(),
          detail: data.detail.trim(),
          lat: Number(data.lat),
          lng: Number(data.lng),
          isDefault: shouldSetDefault ? true : existing.isDefault,
        },
      });
    });
  }

  async setDefaultAddress(userId: number, id: number) {
    const existing = await this.prisma.address.findFirst({
      where: { id, userId },
    });
    if (!existing) throw new NotFoundException('地址不存在');

    return this.prisma.$transaction(async (tx) => {
      await tx.address.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });

      return tx.address.update({
        where: { id },
        data: { isDefault: true },
      });
    });
  }

  async deleteAddress(userId: number, id: number) {
    const existing = await this.prisma.address.findFirst({
      where: { id, userId },
    });
    if (!existing) throw new NotFoundException('地址不存在');

    return this.prisma.$transaction(async (tx) => {
      await tx.address.delete({ where: { id } });

      if (existing.isDefault) {
        const next = await tx.address.findFirst({
          where: { userId },
          orderBy: { updatedAt: 'desc' },
        });

        if (next) {
          await tx.address.update({
            where: { id: next.id },
            data: { isDefault: true },
          });
        }
      }

      return { success: true };
    });
  }

  private validateAddress(data: AddressInput) {
    if (!data.name?.trim()) throw new BadRequestException('请填写联系人');
    if (!data.phone?.trim()) throw new BadRequestException('请填写手机号');
    if (!/^1\d{10}$/.test(data.phone.trim())) {
      throw new BadRequestException('手机号格式不正确');
    }
    if (!data.address?.trim()) throw new BadRequestException('请选择地址');
    if (!data.detail?.trim()) throw new BadRequestException('请填写详细地址');
    if (data.lat === undefined || data.lng === undefined) {
      throw new BadRequestException('地址坐标缺失');
    }
  }
}
