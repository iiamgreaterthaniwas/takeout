import {
  Controller,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import * as fs from 'fs';
import { JwtAuthGuard } from '../auth/guards';

@Controller('upload')
export class UploadController {
  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const type = (req.query.type as string) || 'misc';
          const month = new Date().toISOString().slice(0, 7);
          const dir = path.join(process.cwd(), 'uploads', type, month);
          fs.mkdirSync(dir, { recursive: true });
          cb(null, dir);
        },
        filename: (req, file, cb) => {
          const ext = path.extname(file.originalname).toLowerCase();
          cb(null, `${uuidv4()}${ext}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        const allowed = ['image/jpeg', 'image/png', 'image/webp'];
        cb(null, allowed.includes(file.mimetype));
      },
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    }),
  )
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      return { error: '文件上传失败或类型不支持' };
    }
    const relativePath = file.path
      .replace(process.cwd() + path.sep + 'uploads' + path.sep, '')
      .replace(/\\/g, '/');
    const baseUrl = process.env.BASE_URL || 'http://127.0.0.1:3000';
    return { url: `${baseUrl}/uploads/${relativePath}` };
  }
}
