import {
  Controller, Post, Get, Patch, Body, Req,
  UseGuards, UploadedFile, UseInterceptors, Param, BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CollaborationService } from './collaboration.service';
import { isAdminUser } from '../admin/admin.controller';
import { ForbiddenException } from '@nestjs/common';
import * as path from 'path';
import { uploadDirectory } from '../../common/files/upload-path';

@Controller('collaboration')
export class CollaborationController {
  constructor(private svc: CollaborationService) {}

  /** ثبت درخواست تسهیلگر */
  @Post('facilitator')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('resume', {
    storage: diskStorage({
      destination: uploadDirectory('resumes'),
      filename: (req, file, cb) => {
        const safeName = path.basename(file.originalname).replace(/[^a-zA-Z0-9._-]/g, '_');
        cb(null, `${Date.now()}-${safeName}`);
      },
    }),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      const allowed = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/jpeg',
        'image/png',
      ];
      if (allowed.includes(file.mimetype)) cb(null, true);
      else cb(new BadRequestException('رزومه باید PDF، Word، JPG یا PNG باشد'), false);
    },
  }))
  async registerFacilitator(
    @Req() req: any,
    @Body() body: any,
    @UploadedFile() file?: any,
  ) {
    const userId = req.user.id || req.user.userId;
    const resumeUrl = file ? `/uploads/resumes/${file.filename}` : null;
    return this.svc.registerFacilitator(userId, body, resumeUrl);
  }

  /** پروفایل من (تسهیلگر) */
  @Get('facilitator/my-profile')
  @UseGuards(JwtAuthGuard)
  myProfile(@Req() req: any) {
    return this.svc.getMyFacilitatorProfile(req.user.id);
  }

  /** آپدیت پروفایل */
  @Patch('facilitator/my-profile')
  @UseGuards(JwtAuthGuard)
  updateProfile(@Req() req: any, @Body() body: any) {
    return this.svc.updateFacilitatorProfile(req.user.id, body);
  }

  /** ادمین — لیست تسهیلگران */
  @Get('facilitator/admin/all')
  @UseGuards(JwtAuthGuard)
  adminAll(@Req() req: any) {
    if (!isAdminUser(req.user)) throw new ForbiddenException('دسترسی ادمین لازم است');
    return this.svc.getAllFacilitators();
  }

  /** ادمین — تأیید */
  @Patch('facilitator/admin/approve/:id')
  @UseGuards(JwtAuthGuard)
  approve(@Param('id') id: string, @Body() body: { note?: string }, @Req() req: any) {
    if (!isAdminUser(req.user)) throw new ForbiddenException('دسترسی ادمین لازم است');
    return this.svc.approveFacilitator(id, body.note);
  }

  /** ادمین — رد */
  @Patch('facilitator/admin/reject/:id')
  @UseGuards(JwtAuthGuard)
  reject(@Param('id') id: string, @Body() body: { note: string }, @Req() req: any) {
    if (!isAdminUser(req.user)) throw new ForbiddenException('دسترسی ادمین لازم است');
    return this.svc.rejectFacilitator(id, body.note);
  }
}
