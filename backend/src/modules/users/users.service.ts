import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
// نکته: مسیر ایمپورت بر اساس ساختار پوشه بندی ما تنظیم شده است
import { Booking } from '../bookings/entities/booking.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Booking)
    private bookingsRepository: Repository<Booking>,
  ) {}

  async updateMe(userId: string, data: { name?: string; phoneNumber?: string }) {
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.phoneNumber !== undefined) updateData.phone_number = data.phoneNumber;
    await this.usersRepository.update({ id: userId }, updateData);
    return this.usersRepository.findOne({ where: { id: userId } });
  }

  async findOne(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('کاربر یافت نشد');
    return user;
  }

  async getStats(userId: string) {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('کاربر یافت نشد');

    // ۱. محاسبه تعداد رزروهای موفق
    const bookingCount = await this.bookingsRepository
      .createQueryBuilder('booking')
      .where('booking.user_id=:userId', { userId })
      .andWhere("booking.status <> 'cancelled'")
      .getCount();

    // ۲. محاسبه درصد تکمیل پروفایل (منطق هوشمند برای جلوگیری از خطا)
    let score = 0;
    let totalCriteria = 4;

    // بررسی نام (حمایت از هر دو مدل fullName یا firstName/lastName)
    const hasName = (user as any).fullName || ((user as any).firstName && (user as any).lastName);
    if (hasName) score += 25;

    // بررسی ایمیل
    if (user.email && user.email.length > 5) score += 25;

    // بررسی موبایل
    if (user.mobileNumber && user.mobileNumber.length > 5) score += 25;

    // بررسی آواتار (نام فیلد ممکن است avatar یا avatarUrl باشد)
    const avatar = (user as any).avatar || (user as any).avatarUrl;
    if (avatar) score += 25;

    // محاسبه درصد نهایی
    const percentage = Math.round((score / (totalCriteria * 25)) * 100);

    // بازگرداندن نام نمایشی ایمن
    const displayName = user.name || (user as any).fullName || `${(user as any).firstName || ''} ${(user as any).lastName || ''}`.trim() || "کاربر گرامی";

    // رزروهای تکمیل‌شده و آینده
    const completedEvents = await this.bookingsRepository
      .createQueryBuilder('booking')
      .where('booking.user_id=:userId', { userId })
      .andWhere('booking.attended=true')
      .andWhere('booking.attendance_marked_at IS NOT NULL')
      .getCount();
    const upcomingEvents = await this.bookingsRepository
      .createQueryBuilder('booking')
      .innerJoin('booking.event', 'event')
      .where('booking.user_id=:userId', { userId })
      .andWhere("booking.status IN ('confirmed','matched')")
      .andWhere("booking.payment_status IN ('paid','free')")
      .andWhere('event.start_date > NOW()')
      .getCount();

    return {
      bookingCount,
      totalBookings: bookingCount,
      completedEvents,
      upcomingEvents,
      successfulMatches: completedEvents,
      completionPercentage: percentage,
      avatar: avatar,
      fullName: displayName,
      mobileNumber: user.mobileNumber
    };
  }
}
