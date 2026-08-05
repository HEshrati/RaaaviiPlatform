import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query, Req, UseGuards,
  UseInterceptors, UploadedFile, UploadedFiles, BadRequestException,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { PsychologistVerifyService } from './psychologist-verify.service';
import { uploadDirectory } from '../../common/files/upload-path';

const imageFileFilter = (req: any, file: any, cb: any) => {
  if (!file.mimetype.match(/\/(jpg|jpeg|png|webp)$/)) {
    return cb(new BadRequestException('فقط فایل تصویری (jpg, png, webp) مجاز است'), false);
  }
  cb(null, true);
};

const docFileFilter = (req: any, file: any, cb: any) => {
  if (!file.mimetype.match(/(jpg|jpeg|png|pdf)$/i)) {
    return cb(new BadRequestException('فقط فایل تصویری یا PDF مجاز است'), false);
  }
  cb(null, true);
};

// باگ بحرانی رفع‌شده: سایر کنترلرهای پروژه (facilitator, hamravan) پیشوند 'api/' را
// خودشان اضافه نمی‌کنند چون این پیشوند به‌صورت سراسری (global prefix) در main.ts تنظیم شده است.
// اینجا قبلاً 'api/psychologist-verify' نوشته شده بود که باعث می‌شد مسیر نهایی
// api/api/psychologist-verify/... شود؛ یعنی هیچ‌کدام از endpointهای این کنترلر
// (شامل کل پنل روانشناس: پروفایل، برنامه زمانی، رزروها، مصاحبه‌ها و...) با آدرس‌هایی
// که فرانت‌اند صدا می‌زند (/api/psychologist-verify/...) مچ نمی‌شدند.
@Controller('psychologist-verify')
export class PsychologistVerifyController {
  constructor(private readonly service: PsychologistVerifyService) {}

  // ── احراز هویت / تکمیل پروفایل ────────────────────────────────
  @UseGuards(JwtAuthGuard)
  @Post('license')
  async verifyLicense(@Req() req: any, @Body() body: { licenseNumber: string; mobileNumber: string }) {
    return this.service.verifyLicense(req.user.id, body.licenseNumber, body.mobileNumber);
  }

  @UseGuards(JwtAuthGuard)
  @Post('complete-profile')
  async completeProfile(@Req() req: any, @Body() body: any) {
    return this.service.completeProfile(req.user.id, body);
  }

  @UseGuards(JwtAuthGuard)
  @Get('status')
  async getStatus(@Req() req: any) {
    return this.service.getVerificationStatus(req.user.id);
  }

  // ── آپلود مدارک تحصیلی/مجوز ────────────────────────────────────
  @UseGuards(JwtAuthGuard)
  @Post('credentials/upload')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: uploadDirectory('credentials'),
      filename: (req: any, file, cb) => {
        const unique = `${req.user.id}-${Date.now()}${extname(file.originalname)}`;
        cb(null, unique);
      },
    }),
    fileFilter: docFileFilter,
    limits: { fileSize: 8 * 1024 * 1024 }, // 8MB
  }))
  async uploadCredential(@Req() req: any, @UploadedFile() file: any) {
    if (!file) throw new BadRequestException('فایلی ارسال نشده است');
    return this.service.saveCredentialDocument(req.user.id, file);
  }

  // ── آپلود تصاویر فضا (Venue) ────────────────────────────────────
  @UseGuards(JwtAuthGuard)
  @Post('venues/:venueId/images')
  @UseInterceptors(FilesInterceptor('files', 6, {
    storage: diskStorage({
      destination: uploadDirectory('venues'),
      filename: (req: any, file, cb) => {
        const unique = `${req.params.venueId}-${Date.now()}-${Math.round(Math.random() * 1e6)}${extname(file.originalname)}`;
        cb(null, unique);
      },
    }),
    fileFilter: imageFileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB هر فایل
  }))
  async uploadVenueImages(@Req() req: any, @Param('venueId') venueId: string, @UploadedFiles() files: any[]) {
    if (!files?.length) throw new BadRequestException('هیچ فایلی ارسال نشده است');
    return this.service.saveVenueImages(req.user.id, venueId, files);
  }

  // ── اسلات‌ها و رزرو ──────────────────────────────────────────────
  @UseGuards(JwtAuthGuard)
  @Post('availability')
  async setAvailability(@Req() req: any, @Body() body: any) {
    return this.service.setAvailability(req.user.id, body);
  }

  @Get('slots')
  async getSlots(@Query('psychologistUserId') psychologistUserId?: string, @Query('city') city?: string) {
    return this.service.getAvailableSlots(psychologistUserId, city);
  }

  @UseGuards(JwtAuthGuard)
  @Post('slots/:slotId/book')
  async bookSlot(@Req() req: any, @Param('slotId') slotId: string, @Body() body: { userNeed?: string; notes?: string }) {
    return this.service.bookSlot(req.user.id, slotId, body.userNeed, body.notes);
  }

  @UseGuards(JwtAuthGuard)
  @Get('my-slots')
  async getMySlots(@Req() req: any, @Query('from') from?: string, @Query('to') to?: string) {
    return this.service.getMySlots(req.user.id, from, to);
  }

  @UseGuards(JwtAuthGuard)
  @Get('my-bookings')
  async getMyBookings(@Req() req: any) {
    return this.service.getMyBookings(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('my-bookings/:bookingId')
  async getMyBookingById(@Req() req: any, @Param('bookingId') bookingId: string) {
    return this.service.getMyBookingById(req.user.id, bookingId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('bookings/:bookingId/status')
  async updateBookingStatus(@Req() req: any, @Param('bookingId') bookingId: string, @Body() body: { status: string }) {
    return this.service.updateBookingStatus(req.user.id, bookingId, body.status);
  }

  // ── داشبورد روانشناس ─────────────────────────────────────────────
  @UseGuards(JwtAuthGuard)
  @Get('dashboard')
  async getDashboard(@Req() req: any) {
    return this.service.getDashboardStats(req.user.id);
  }

  // باگ رفع‌شده: در NestJS نمی‌توان دو دکوراتور @Get/@Patch جداگانه روی یک متد گذاشت
  // و انتظار داشت هر دو مسیر ثبت شوند؛ دکوراتور بالایی (نزدیک‌تر به کلاس) متادیتای
  // دکوراتور پایینی را بازنویسی می‌کند و فقط یکی از دو مسیر واقعاً کار می‌کند.
  // فرم صحیح، دادن آرایه‌ای از مسیرها به یک دکوراتور است.
  @UseGuards(JwtAuthGuard)
  @Get(['profile', 'my-profile'])
  async getMyProfile(@Req() req: any) {
    return this.service.getMyProfile(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(['profile', 'my-profile'])
  async updateMyProfile(@Req() req: any, @Body() body: any) {
    return this.service.updateMyProfile(req.user.id, body);
  }

  @UseGuards(JwtAuthGuard)
  @Get('patients')
  async getMyPatients(@Req() req: any) {
    return this.service.getMyPatients(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('patients/:patientUserId/tests')
  async getPatientTests(@Req() req: any, @Param('patientUserId') patientUserId: string) {
    return this.service.getPatientTests(req.user.id, patientUserId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('patients/:patientUserId/profile')
  async getPatientProfile(@Req() req: any, @Param('patientUserId') patientUserId: string) {
    return this.service.getPatientProfile(req.user.id, patientUserId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('slots/:slotId')
  async deleteSlot(@Req() req: any, @Param('slotId') slotId: string) {
    return this.service.deleteSlot(req.user.id, slotId);
  }

  // ── فرم مصاحبه بالینی ─────────────────────────────────────────────
  // ⚠️ توجه: منطق تشخیص ریسک در این فرم (مثلاً اینکه چه پاسخی high-risk
  // محسوب می‌شود) باید پیش از انتشار نهایی توسط یک متخصص بالینی بازبینی شود.
  @UseGuards(JwtAuthGuard)
  @Post('interviews')
  async createInterview(@Req() req: any, @Body() body: { patientUserId: string; bookingId?: string; sessionMode?: string; sessionDatetime?: string }) {
    return this.service.createInterview(req.user.id, body);
  }

  @UseGuards(JwtAuthGuard)
  @Post('interviews/:interviewId/sections')
  async saveInterviewSection(@Req() req: any, @Param('interviewId') interviewId: string, @Body() body: { sectionKey: string; items: any[] }) {
    return this.service.saveInterviewSection(req.user.id, interviewId, body);
  }

  @UseGuards(JwtAuthGuard)
  @Post('interviews/:interviewId/submit')
  async submitInterview(@Req() req: any, @Param('interviewId') interviewId: string, @Body() body: { clinicalNote: string }) {
    return this.service.submitInterview(req.user.id, interviewId, body.clinicalNote);
  }

  @UseGuards(JwtAuthGuard)
  @Get('interviews')
  async getMyInterviews(@Req() req: any) {
    return this.service.getMyInterviews(req.user.id);
  }

  // ── ادمین ────────────────────────────────────────────────────────
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get('admin/pending')
  async getPendingForAdmin() {
    return this.service.getPendingForAdmin();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Patch('admin/:licenseNumber/approve')
  async approve(@Req() req: any, @Param('licenseNumber') licenseNumber: string, @Body() body: { adminNote?: string }) {
    return this.service.approveByAdmin(licenseNumber, req.user.id, body.adminNote);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Patch('admin/:licenseNumber/reject')
  async reject(@Req() req: any, @Param('licenseNumber') licenseNumber: string, @Body() body: { reason: string }) {
    return this.service.rejectByAdmin(licenseNumber, req.user.id, body.reason);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Patch('admin/:licenseNumber/request-revision')
  async requestRevision(@Req() req: any, @Param('licenseNumber') licenseNumber: string, @Body() body: { reason: string }) {
    return this.service.requestRevision(licenseNumber, req.user.id, body.reason);
  }

  // ── لیست سیاه (ادمین) ───────────────────────────────────────────
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get('admin/blacklist')
  async getBlacklist() {
    return this.service.getBlacklist();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post('admin/blacklist')
  async addToBlacklist(@Req() req: any, @Body() body: { mobile: string; reason?: string }) {
    return this.service.addToBlacklist(req.user.id, body.mobile, body.reason || '');
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post('admin/blacklist/remove')
  async removeFromBlacklist(@Req() req: any, @Body() body: { mobile: string }) {
    return this.service.removeFromBlacklist(req.user.id, body.mobile);
  }

  // ── Audit Log (ادمین) ───────────────────────────────────────────
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get('admin/audit-logs')
  async getAuditLogs(
    @Query('targetType') targetType?: string,
    @Query('targetId') targetId?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.getAuditLogs(targetType, targetId, limit ? parseInt(limit, 10) : 100);
  }
}


