const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('开始插入模拟商家数据...');

  // 0. 清理旧数据
  await prisma.orderItem.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.merchant.deleteMany({});
  await prisma.user.deleteMany({
    where: {
      openid: {
        in: ['mock_merchant_1', 'mock_merchant_2']
      }
    }
  });

  // 1. 创建两个模拟的商家用户
  const user1 = await prisma.user.upsert({
    where: { openid: 'mock_merchant_1' },
    update: {},
    create: {
      openid: 'mock_merchant_1',
      nickname: '麦当劳老板',
      role: 'merchant',
    },
  });

  const user2 = await prisma.user.upsert({
    where: { openid: 'mock_merchant_2' },
    update: {},
    create: {
      openid: 'mock_merchant_2',
      nickname: '肯德基老板',
      role: 'merchant',
    },
  });

  // 2. 为他们创建店铺信息
  const shop1 = await prisma.merchant.create({
    data: {
      userId: user1.id,
      shopName: '麦当劳 (大学城店)',
      description: '金拱门，更多欢笑',
      address: '大学城西区商业街1号',
      lat: 39.90469,
      lng: 116.40717,
      isOpen: true,
      minOrder: 20.0,
      category: '快餐',
    },
  });

  const shop2 = await prisma.merchant.create({
    data: {
      userId: user2.id,
      shopName: '肯德基 (大学城店)',
      description: '生活如此多娇',
      address: '大学城东区商业街2号',
      lat: 39.90569,
      lng: 116.40817,
      isOpen: true,
      minOrder: 15.0,
      category: '快餐',
    },
  });

  // 3. 为店铺添加一些商品
  await prisma.product.createMany({
    data: [
      {
        merchantId: shop1.id,
        name: '巨无霸套餐',
        price: 35.0,
        description: '经典巨无霸汉堡+薯条+可乐',
        stock: 100,
        category: '主食',
        status: 'approved',
      },
      {
        merchantId: shop1.id,
        name: '麦辣鸡腿堡',
        price: 22.0,
        description: '香辣酥脆',
        stock: 50,
        category: '主食',
        status: 'approved',
      },
      {
        merchantId: shop1.id,
        name: '可口可乐',
        price: 9.0,
        description: '冰爽解渴',
        stock: 200,
        category: '饮料',
        status: 'approved',
      },
      {
        merchantId: shop2.id,
        name: '香辣鸡腿堡套餐',
        price: 32.0,
        description: '汉堡+薯条+可乐',
        stock: 80,
        category: '主食',
        status: 'approved',
      },
      {
        merchantId: shop2.id,
        name: '原味鸡',
        price: 14.0,
        description: '经典原味鸡块',
        stock: 60,
        category: '小吃',
        status: 'approved',
      },
    ],
  });

  console.log('模拟数据插入完成！');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });