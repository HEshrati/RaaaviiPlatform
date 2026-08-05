import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'path';
import {
  Controller, UploadedFile, UseInterceptors,
  Get, Post, Patch, Delete,
  Body, Param, Query,
  UseGuards, Req,
  ForbiddenException, HttpCode, HttpStatus,
  BadRequestException, NotFoundException, Res,
} from "@nestjs/common";
import { OptionalJwtGuard } from "../auth/guards/optional-jwt.guard";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CreateEventDto } from "./dto/create-event.dto";
import { EventsService } from "./events.service";
import { EventMergeService } from "./event-merge.service";
import { isAdminUser } from "../admin/admin.controller";
import { uploadDirectory } from '../../common/files/upload-path';
import { SmsReminderService } from './sms-reminder.service';
export { isAdminUser };

function requireAdmin(user: any) {
  if (!isAdminUser(user)) throw new ForbiddenException("دسترسی ادمین لازم است");
}

// ── بررسی فرمت UUID ──────────────────────────────────────────────────
function isValidUUID(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value,
  );
}

@Controller("events")
export class EventsController {
  constructor(
    private eventsService: EventsService,
    private eventMergeService: EventMergeService,
    private smsReminderService: SmsReminderService,
  ) {}

  // -- serve AI generated image --
  @Get(":id/image")
  async serveEventImage(@Param("id") id: string, @Res() res: any) {
    const fs = require("fs");
    const filePath = path.join(uploadDirectory('event-images'), id + '.jpg');
    if (!fs.existsSync(filePath)) throw new NotFoundException("Image not found");
    res.setHeader("Content-Type", "image/jpeg");
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.sendFile(filePath);
  }

  // ── ادمین: آمار موفقیت همنشینی‌ها ──────────────────────────────────
  @Get("admin/stats")
  @UseGuards(JwtAuthGuard)
  async getAdminStats(@Req() req: any) {
    requireAdmin(req.user);
    return this.eventsService.getAdminStats(req.user.id);
  }

  // ── همنشینی‌های ادمین ────────────────────────────────────────────────
  @Get("my-events")
  @UseGuards(JwtAuthGuard)
  async getMyEvents(@Req() req: any) {
    requireAdmin(req.user);
    return this.eventsService.findByCreator(req.user.id);
  }

  @Get("admin/review")
  @UseGuards(JwtAuthGuard)
  async getAdminReviewEvents(@Req() req: any, @Query('status') status?: string) {
    requireAdmin(req.user);
    return this.eventsService.getAllForAdmin(status);
  }

  @Post("admin/review/:id/:action")
  @UseGuards(JwtAuthGuard)
  async reviewFacilitatorEvent(
    @Param('id') id: string,
    @Param('action') action: 'approve' | 'reject' | 'request-revision',
    @Body() body: { note?: string },
    @Req() req: any,
  ) {
    requireAdmin(req.user);
    if (!isValidUUID(id)) throw new BadRequestException('شناسه رویداد معتبر نیست');
    return this.eventsService.reviewFacilitatorEvent(id, req.user.id, action, body.note);
  }

  @Get("facilitator/mine")
  @UseGuards(JwtAuthGuard)
  async getFacilitatorEvents(@Req() req: any) {
    return this.eventsService.getFacilitatorEvents(req.user.id);
  }

  @Post("facilitator")
  @UseGuards(JwtAuthGuard)
  async createFacilitatorEvent(@Body() dto: CreateEventDto, @Req() req: any) {
    return this.eventsService.createFacilitatorRequest(dto, req.user.id);
  }

  @Patch("facilitator/:id")
  @UseGuards(JwtAuthGuard)
  async updateFacilitatorEvent(
    @Param('id') id: string,
    @Body() data: Partial<CreateEventDto>,
    @Req() req: any,
  ) {
    if (!isValidUUID(id)) throw new BadRequestException('شناسه رویداد معتبر نیست');
    return this.eventsService.updateByFacilitator(id, req.user.id, data);
  }

  // ── پیشنهادات ───────────────────────────────────────────────────────
  @Get("recommendations")
  @UseGuards(JwtAuthGuard)
  async getRecommendations(@Req() req: any) {
    return this.eventsService.getGroupRecommendations(req.user.id);
  }

  // ── ✅ FIX: Route برای category-interests که فرانت صدا می‌زد ─────────
  @Get("category-interests")
  @UseGuards(OptionalJwtGuard)
  async getCategoryInterests(@Req() req: any) {
    // اگر سرویس مربوطه داری اینجا صدا بزن
    // در غیر اینصورت یه آرایه خالی برگردون تا فرانت کرش نکنه
    return [];
  }

  // ── merge باید قبل از :id باشه ──────────────────────────────────────
  @Post("merge")
  @UseGuards(JwtAuthGuard)
  async mergeEvents(
    @Body() body: { sourceEventId: string; targetEventId: string },
    @Req() req: any,
  ) {
    requireAdmin(req.user);
    return this.eventMergeService.manualMerge(body.sourceEventId, body.targetEventId);
  }

  // ── لیست همنشینی‌ها (فقط شهر عمومی - بدون مکان دقیق) ─────────────

  @Post('upload-image')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('image', {
    storage: diskStorage({
      destination: uploadDirectory('events'),
      filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `event-${Date.now()}${ext}`);
      },
    }),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      if (['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.mimetype)) cb(null, true);
      else cb(new Error('فقط فایل تصویر مجاز است'), false);
    },
  }))
  async uploadImage(@UploadedFile() file: any, @Req() req: any) {
    if (!isAdminUser(req.user)) {
      await this.eventsService.assertApprovedFacilitator(req.user.id);
    }
    if (!file) throw new BadRequestException('فایلی آپلود نشد');
    return { url: `/uploads/events/${file.filename}` };
  }

  @Get()
  @UseGuards(OptionalJwtGuard)
  async findAll(
    @Query("page") page?: number,
    @Query("limit") limit?: number,
    @Query("city") city?: string,
    @Query("event_type") event_type?: string,
    @Query("category") category?: string,
    @Req() req?: any,
  ) {
    const userId = req?.user?.id;
    const result = await this.eventsService.findAll({
      page,
      limit,
      city,
      event_type,
      category,
      userId,
    });
    // حذف location دقیق از لیست عمومی
    return {
      ...result,
      events: result.events.map((e: any) => ({ ...e, location: undefined })),
    };
  }

  // ── مکان همنشینی: فقط برای رزروکنندگان در ۱۰ ساعت آخر ─────────────
  @Get(":id/location")
  @UseGuards(JwtAuthGuard)
  async getEventLocation(@Param("id") id: string, @Req() req: any) {
    if (!isValidUUID(id))
      throw new BadRequestException("شناسه رویداد معتبر نیست");
    const canManage = await this.eventsService.canManageEvent(id, req.user.id, isAdminUser(req.user));
    return this.eventsService.getLocationForUser(id, req.user.id, canManage);
  }

  // ── آپدیت مکان + اعلان SMS و سایت به رزروکنندگان ─────────────────
  @Post(":id/notify-location")
  @UseGuards(JwtAuthGuard)
  async notifyLocationChange(
    @Param("id") id: string,
    @Body() body: { location: string; city: string },
    @Req() req: any,
  ) {
    if (!isValidUUID(id))
      throw new BadRequestException("شناسه رویداد معتبر نیست");
    const canManage = await this.eventsService.canManageEvent(id, req.user.id, isAdminUser(req.user));
    if (!canManage) throw new ForbiddenException('اجازه مدیریت این رویداد را ندارید');
    return this.eventsService.updateLocationAndNotify(
      id,
      body.location,
      body.city,
    );
  }

  // ── رزروکنندگان یک همنشینی (فقط ادمین) ──────────────────────────
  @Get(":id/attendees")
  @UseGuards(JwtAuthGuard)
  async getEventAttendees(@Param("id") id: string, @Req() req: any) {
    if (!isValidUUID(id))
      throw new BadRequestException("شناسه رویداد معتبر نیست");
    const canManage = await this.eventsService.canManageEvent(id, req.user.id, isAdminUser(req.user));
    if (!canManage) throw new ForbiddenException('اجازه مشاهده شرکت‌کنندگان را ندارید');
    return this.eventsService.getEventAttendees(id);
  }

  // ── جزئیات یک همنشینی (بدون location دقیق در پاسخ عمومی) ────────
  @Get(":id")
  @UseGuards(OptionalJwtGuard)
  async findOne(@Param("id") id: string, @Req() req: any) {
    // ✅ FIX: جلوگیری از رسیدن رشته‌های غیر UUID به دیتابیس
    if (!isValidUUID(id))
      throw new NotFoundException(`رویداد با شناسه "${id}" پیدا نشد`);
    const event = await this.eventsService.findOne(id);
    const isAdmin = isAdminUser(req?.user);
    const canManage = req?.user?.id
      ? await this.eventsService.canManageEvent(id, req.user.id, isAdmin)
      : false;
    if ((!event.is_active || event.approval_status !== 'approved') && !canManage) {
      throw new NotFoundException('رویداد یافت نشد');
    }
    // location دقیق فقط برای ادمین‌ها
    if (!canManage) {
      return { ...event, location: undefined };
    }
    return event;
  }

  // ── ایجاد همنشینی (فقط ادمین) ─────────────────────────────────────
  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() createEventDto: CreateEventDto, @Req() req: any) {
    requireAdmin(req.user);
    return this.eventsService.create({
      ...createEventDto,
      created_by: req.user.id,
      submitted_by_role: 'admin',
      approval_status: 'approved',
      is_active: createEventDto.is_active ?? createEventDto.isActive ?? true,
      reviewed_by: req.user.id,
      reviewed_at: new Date(),
    });
  }

  // ── ویرایش همنشینی (فقط ادمین) ────────────────────────────────────
  @Patch(":id")
  @UseGuards(JwtAuthGuard)
  async update(
    @Param("id") id: string,
    @Body() data: Partial<CreateEventDto>,
    @Req() req: any,
  ) {
    requireAdmin(req.user);
    if (!isValidUUID(id))
      throw new BadRequestException("شناسه رویداد معتبر نیست");
    return this.eventsService.update(id, data as any);
  }

  // ── غیرفعال کردن همنشینی (فقط ادمین) ─────────────────────────────
  @Delete(":id")
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param("id") id: string, @Req() req: any) {
    requireAdmin(req.user);
    if (!isValidUUID(id))
      throw new BadRequestException("شناسه رویداد معتبر نیست");
    await this.eventsService.update(id, { is_active: false } as any);
  }

  @Post("send-reminder/:userId")
  @UseGuards(JwtAuthGuard)
  async sendManualReminder(@Param("userId") userId: string, @Req() req: any) {
    requireAdmin(req.user);
    if (!isValidUUID(userId)) throw new BadRequestException('شناسه کاربر معتبر نیست');
    return this.smsReminderService.sendManualReminder(userId);
  }
  @Post(':id/generate-image')
  @UseGuards(JwtAuthGuard)
  async generateImage(@Param('id') id: string, @Req() req: any) {
    if (!isValidUUID(id)) throw new BadRequestException('شناسه رویداد معتبر نیست');
    const canManage = await this.eventsService.canManageEvent(id, req.user.id, isAdminUser(req.user));
    if (!canManage) throw new ForbiddenException('اجازه مدیریت این رویداد را ندارید');
    return this.eventsService.generateImageForExistingEvent(id);
  }



  // ورود به لیست انتظار
  @Post(':id/waitlist')
  @UseGuards(JwtAuthGuard)
  async joinWaitlist(@Param('id') eventId: string, @Req() req: any) {
    if (!isValidUUID(eventId)) throw new BadRequestException('شناسه رویداد معتبر نیست');
    return this.eventsService.joinWaitlist(eventId, req.user.id);
  }

  // وضعیت رزرو کاربر برای رویداد
  @Get(':id/reservation-status')
  @UseGuards(JwtAuthGuard)
  async reservationStatus(@Param('id') eventId: string, @Req() req: any) {
    if (!isValidUUID(eventId)) throw new BadRequestException('شناسه رویداد معتبر نیست');
    return this.eventsService.getReservationStatus(eventId, req.user.id);
  }
}
