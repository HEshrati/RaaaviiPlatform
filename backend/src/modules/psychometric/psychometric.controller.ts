import { Controller, Get, Post, Body, Param, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PsychometricService } from './psychometric.service';
import { CompatibilityService } from './compatibility.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TestResult } from '../test-results/entities/test-result.entity';

@Controller('psychometric')
@UseGuards(JwtAuthGuard)
export class PsychometricController {
  constructor(
    private readonly psychService: PsychometricService,
    private readonly compatService: CompatibilityService,
    @InjectRepository(TestResult)
    private readonly testRepo: Repository<TestResult>,
  ) {}

  /** پروفایل روان‌سنجی خودم */
  @Get('my-profile')
  async myProfile(@Req() req: any) {
    const tests = await this.testRepo.find({
      where: { user_id: req.user.id },
      order: { completed_at: 'DESC' },
    });
    return this.psychService.buildProfile(req.user.id, tests);
  }

  /** سازگاری من با کاربر دیگر */
  @Get('compatibility/:targetUserId')
  async compatibility(@Req() req: any, @Param('targetUserId') targetId: string) {
    const [myTests, theirTests] = await Promise.all([
      this.testRepo.find({ where: { user_id: req.user.id } }),
      this.testRepo.find({ where: { user_id: targetId } }),
    ]);

    const profileA = this.psychService.buildProfile(req.user.id, myTests);
    const profileB = this.psychService.buildProfile(targetId, theirTests);

    return {
      myProfile: profileA,
      theirProfile: profileB,
      compatibility: this.compatService.calculate(profileA, profileB),
    };
  }

  /** تحلیل cross-test خودم */
  @Get('cross-analysis')
  async crossAnalysis(@Req() req: any) {
    const tests = await this.testRepo.find({
      where: { user_id: req.user.id },
      order: { completed_at: 'DESC' },
    });
    const profile = this.psychService.buildProfile(req.user.id, tests);

    const insights: string[] = [];

    // تحلیل ترکیبی NEO + ECR
    if (profile.neo && profile.ecr) {
      if (profile.neo.N > 20 && profile.ecr.style === 'anxious')
        insights.push('🔍 روان‌رنجوری بالا + دلبستگی اضطرابی: در روابط به تأیید بیشتری نیاز دارید');
      if (profile.neo.E > 20 && profile.ecr.style === 'avoidant')
        insights.push('🔍 برون‌گرایی + اجتناب دلبستگی: در جمع انرژی می‌گیرید اما از صمیمیت می‌ترسید');
      if (profile.neo.A > 20 && profile.ecr.style === 'secure')
        insights.push('🌟 توافق‌پذیری بالا + دلبستگی ایمن: پتانسیل عالی برای روابط بلندمدت');
    }

    // تحلیل ERQ + IRI
    if (profile.erq && profile.iri) {
      if (profile.erq.reappraisal > 21 && profile.iri.empathy > 15)
        insights.push('🌟 تنظیم هیجان خوب + همدلی بالا: در مدیریت تعارضات عالی هستید');
      if (profile.erq.suppression > 14 && profile.iri.empathy < 10)
        insights.push('⚠️ سرکوب هیجان + همدلی پایین: ممکن است ارتباط عاطفی سطحی بماند');
    }

    // ریسک سلامت روان
    if (profile.phq9 !== null && profile.gad7 !== null) {
      if (profile.phq9 > 9 && profile.gad7 > 9)
        insights.push('🔴 افسردگی و اضطراب همزمان: مشاوره با متخصص توصیه می‌شود');
    }

    return { profile, insights, redFlags: profile.redFlags };
  }
}
