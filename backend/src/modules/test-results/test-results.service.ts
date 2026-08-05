import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Repository } from 'typeorm';
import { TestResult } from './entities/test-result.entity';
import { CreateTestResultDto } from './dto/create-test-result.dto';
import { SmartProfile, CommunicationType } from '../smart-profile/entities/smart-profile.entity';
import { derivedMainResult, hasValidTestAnswers, normalizeTestScores, smartProfileProjection } from './test-score-normalizer';

@Injectable()
export class TestResultsService {
  private readonly logger = new Logger(TestResultsService.name);

  constructor(
    @InjectDataSource() public readonly dataSource: DataSource,
    @InjectRepository(TestResult)
    private testResultsRepository: Repository<TestResult>,
    @InjectRepository(SmartProfile)
    private smartProfileRepo: Repository<SmartProfile>,
  ) {}

  async create(userId: string, createTestResultDto: CreateTestResultDto): Promise<TestResult> {
    const submittedScores = createTestResultDto.scores || { answers: (createTestResultDto as any).answers || {} };
    if (!hasValidTestAnswers(createTestResultDto.test_name, submittedScores)) {
      throw new BadRequestException('پاسخ همهٔ سؤال‌های این آزمون برای محاسبهٔ معتبر لازم است');
    }
    const normalizedScores = normalizeTestScores(
      createTestResultDto.test_name,
      submittedScores,
    );
    const mainResult = derivedMainResult(
      createTestResultDto.test_name,
      normalizedScores,
      createTestResultDto.main_result || 'completed',
    );
    const testResult = this.testResultsRepository.create({
      user_id: userId,
      test_id: createTestResultDto.test_id || createTestResultDto.test_name,
      test_name: createTestResultDto.test_name,
      main_result: mainResult,
      scores: normalizedScores,
      completed_at: new Date(),
    });

    const saved = await this.testResultsRepository.save(testResult);

    // هر نتیجهٔ ثبت‌شده، با همان مقادیر canonical به پروفایل هوشمند منتقل می‌شود.
    await this.syncToSmartProfile(userId, createTestResultDto.test_name, normalizedScores);

    return saved;
  }

  /**
   * نگاشت پاسخ‌های تست به فیلدهای smart_profile
   *
   * سوال ۴  → extroversion_score  (1=درون‌گرا … 5=برون‌گرا  → 0-100)
   * سوال ۵  → energy_level        (1=نیاز به جرقه … 5=خودانگیخته → 0-100)
   * سوال ۶  → (satisfaction — فعلاً در test_results نگه می‌داریم)
   * سوالات ۱-۳ → communication_type استنتاج می‌شود
   */
  private async syncToSmartProfile(userId: string, testName: string, scores: Record<string, any>): Promise<void> {
    try {
      let sp = await this.smartProfileRepo.findOne({ where: { user_id: userId } });
      if (!sp) {
        sp = this.smartProfileRepo.create({ user_id: userId });
      }

      // سوال‌های onboarding مستقیماً زیر answers نگه‌داری می‌شوند.
      const answers = scores.answers || scores;
      if (testName === 'onboarding_personality' && answers[4] !== undefined) {
        sp.extroversion_score = ((Number(answers[4]) - 1) / 4) * 100;
      }

      // سوال ۵: سطح انرژی و انگیزه — تبدیل مقیاس ۱-۵ به ۰-۱۰۰
      if (testName === 'onboarding_personality' && answers[5] !== undefined) {
        sp.energy_level = ((Number(answers[5]) - 1) / 4) * 100;
      }

      // تعیین communication_type از extroversion_score
      if (testName === 'onboarding_personality' && sp.extroversion_score >= 65) {
        sp.communication_type = CommunicationType.EXTROVERT;
      } else if (testName === 'onboarding_personality' && sp.extroversion_score <= 35) {
        sp.communication_type = CommunicationType.INTROVERT;
      } else if (testName === 'onboarding_personality') {
        sp.communication_type = CommunicationType.AMBIVERT;
      }

      // ذخیره خلاصه نتایج تست برای مراجعه بعدی
      Object.assign(sp, smartProfileProjection(testName, scores));
      sp.test_results_summary = { ...sp.test_results_summary, [testName]: scores };
      sp.last_ai_update = new Date();

      await this.smartProfileRepo.save(sp);
      this.logger.log(
        `SmartProfile synced for user ${userId}: extroversion=${sp.extroversion_score}, energy=${sp.energy_level}, type=${sp.communication_type}`,
      );
    } catch (e) {
      this.logger.error(`Failed to sync smart profile for user ${userId}: ${e.message}`);
    }
  }

  async findByUserId(userId: string): Promise<TestResult[]> {
    return await this.testResultsRepository.find({
      where: { user_id: userId },
      order: { completed_at: 'DESC' },
    });
  }
}
