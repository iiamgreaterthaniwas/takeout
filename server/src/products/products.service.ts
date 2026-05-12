import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async createProduct(
    userId: number,
    data: {
      name: string;
      price: number;
      imageUrl?: string;
      description?: string;
      stock: number;
      category?: string;
    },
  ) {
    const merchant = await this.prisma.merchant.findFirst({
      where: { userId },
    });
    if (!merchant) throw new BadRequestException('您还不是商户');

    return this.prisma.product.create({
      data: {
        merchantId: merchant.id,
        name: data.name,
        price: data.price,
        imageUrl: data.imageUrl,
        description: data.description,
        stock: data.stock,
        category: data.category || '默认分类',
        status: 'pending', // 默认待审核
      },
    });
  }

  async getMyProducts(userId: number) {
    const merchant = await this.prisma.merchant.findFirst({
      where: { userId },
    });
    if (!merchant) return [];

    return this.prisma.product.findMany({
      where: { merchantId: merchant.id },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateProduct(userId: number, productId: number, data: any) {
    const merchant = await this.prisma.merchant.findFirst({
      where: { userId },
    });
    if (!merchant) throw new BadRequestException('您还不是商户');

    const product = await this.prisma.product.findFirst({
      where: { id: productId, merchantId: merchant.id },
    });

    if (!product) throw new NotFoundException('商品不存在或无权修改');

    return this.prisma.product.update({
      where: { id: productId },
      data: { ...data, status: 'pending' }, // 修改后需重新审核
    });
  }

  async deleteProduct(userId: number, productId: number) {
    const merchant = await this.prisma.merchant.findFirst({
      where: { userId },
    });
    if (!merchant) throw new BadRequestException('您还不是商户');

    const product = await this.prisma.product.findFirst({
      where: { id: productId, merchantId: merchant.id },
    });

    if (!product) throw new NotFoundException('商品不存在或无权修改');

    return this.prisma.product.delete({
      where: { id: productId },
    });
  }

  // 获取审核通过的商品列表（用户端）
  async getShopProducts(merchantId: number) {
    return this.prisma.product.findMany({
      where: { merchantId, status: 'approved' },
      orderBy: { createdAt: 'desc' },
    });
  }

  // 管理端：获取所有商品
  async getAllProducts(status?: string) {
    return this.prisma.product.findMany({
      where: status ? { status: status as any } : undefined,
      include: { merchant: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  // 管理端：审核商品
  async reviewProduct(id: number, status: 'approved' | 'rejected' | 'off') {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('商品不存在');

    return this.prisma.product.update({
      where: { id },
      data: { status },
    });
  }
}
