import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('bookings')
@UseGuards(JwtAuthGuard)
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  create(@Body() createBookingDto: CreateBookingDto, @Req() req: any) {
    return this.bookingsService.create(req.user?.userId || req.user?.id, createBookingDto);
  }

  @Get()
  findAll(@Req() req: any) {
    return this.bookingsService.findAll(req.user?.userId || req.user?.id);
  }

  @Get(['my', 'my-events'])
  myEvents(@Req() req: any) {
    return this.bookingsService.getMyEvents(req.user?.userId || req.user?.id);
  }

  @Get('plus-one-candidates')
  plusOneCandidates(@Req() req: any, @Query('eventId') eventId?: string) {
    return this.bookingsService.getPlusOneCandidates(req.user?.userId || req.user?.id, eventId);
  }

  @Post('plus-one-check')
  checkPlusOne(@Req() req: any, @Body() body: { phone?: string }) {
    return this.bookingsService.validatePlusOne(req.user?.userId || req.user?.id, body.phone || '');
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.bookingsService.findOne(id, req.user?.userId || req.user?.id);
  }

  @Patch(':id/cancel')
  cancel(@Param('id') id: string, @Req() req: any, @Body() body: { reason?: string }) {
    return this.bookingsService.cancelBooking(id, req.user?.userId || req.user?.id, body.reason);
  }
}
