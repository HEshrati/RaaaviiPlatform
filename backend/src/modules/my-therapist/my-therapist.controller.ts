import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { MyTherapistService } from "./my-therapist.service";
import { IntakeDto } from "./dto/intake.dto";
import { BookSessionDto } from "./dto/book-session.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
@Controller("my-therapist")
@UseGuards(JwtAuthGuard)
export class MyTherapistController {
  constructor(private readonly service: MyTherapistService) {}

  @Post("intake")
  submitIntake(@Req() req: any, @Body() dto: IntakeDto) {
    const userId = req.user?.id || req.user?.userId;
    return this.service.submitIntake(userId, dto);
  }

  @Get("sessions")
  @UseGuards(JwtAuthGuard)
  async getMySessions(@Req() req: any) {
    const ds = (this.service as any).dataSource ||
               (this.service as any).ds;
    if (!ds) return { sessions: [] };
    const sessions = await ds.query(`
      SELECT tsb.id, tsb.status, tsb.session_date, tsb.notes,
             tp.city, tp.price_per_session, tp.bio,
             u.name as therapist_name
      FROM therapy_session_bookings tsb
      LEFT JOIN therapist_profiles tp ON tp.id = tsb.therapist_profile_id
      LEFT JOIN users u ON u.id = tp.user_id
      WHERE tsb.user_id = $1
      ORDER BY tsb.created_at DESC
    `, [req.user.id]).catch(() => []);
    return { sessions };
  }

  @Get("intake/me")
  getMyIntake(@Req() req: any) {
    const userId = req.user?.id || req.user?.userId;
    return this.service.getMyIntake(userId);
  }

  @Get("therapists")
  getTherapists(@Req() req: any) {
    const userId = req.user?.id || req.user?.userId;
    return this.service.getTherapists(userId);
  }

  @Get("therapists/:id")
  getTherapist(@Req() req: any, @Param("id", new ParseUUIDPipe()) id: string) {
    const userId = req.user?.id || req.user?.userId;
    return this.service.getTherapistById(id, userId);
  }

  @Get("groups")
  getGroups(@Req() req: any) {
    const userId = req.user?.id || req.user?.userId;
    return this.service.getGroups(userId);
  }

  @Get("groups/:id")
  getGroup(@Req() req: any, @Param("id", new ParseUUIDPipe()) id: string) {
    const userId = req.user?.id || req.user?.userId;
    return this.service.getGroupById(id, userId);
  }

  @Post("book")
  bookSession(@Req() req: any, @Body() dto: BookSessionDto) {
    const userId = req.user?.id || req.user?.userId;
    return this.service.bookSession(userId, dto);
  }

  @Post("groups/:groupId/join")
  joinGroup(
    @Req() req: any,
    @Param("groupId", new ParseUUIDPipe()) groupId: string,
  ) {
    const userId = req.user?.id || req.user?.userId;
    return this.service.joinGroup(userId, groupId);
  }
}
