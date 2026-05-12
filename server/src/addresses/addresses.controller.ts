import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards';
import { AddressesService } from './addresses.service';

@Controller('addresses')
@UseGuards(JwtAuthGuard)
export class AddressesController {
  constructor(private readonly addressesService: AddressesService) {}

  @Get()
  getMyAddresses(@Request() req) {
    return this.addressesService.getMyAddresses(req.user.userId);
  }

  @Get('default')
  getDefaultAddress(@Request() req) {
    return this.addressesService.getDefaultAddress(req.user.userId);
  }

  @Get(':id')
  getAddressDetail(@Request() req, @Param('id') id: string) {
    return this.addressesService.getAddressDetail(req.user.userId, Number(id));
  }

  @Post()
  createAddress(@Request() req, @Body() data: any) {
    return this.addressesService.createAddress(req.user.userId, data);
  }

  @Put(':id')
  updateAddress(@Request() req, @Param('id') id: string, @Body() data: any) {
    return this.addressesService.updateAddress(req.user.userId, Number(id), data);
  }

  @Put(':id/default')
  setDefaultAddress(@Request() req, @Param('id') id: string) {
    return this.addressesService.setDefaultAddress(req.user.userId, Number(id));
  }

  @Delete(':id')
  deleteAddress(@Request() req, @Param('id') id: string) {
    return this.addressesService.deleteAddress(req.user.userId, Number(id));
  }
}
