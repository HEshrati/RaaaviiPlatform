import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  Req,
  ForbiddenException,
} from "@nestjs/common";
import { TestResultsService } from "./test-results.service";
import { CreateTestResultDto } from "./dto/create-test-result.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { isAdminUser } from "../admin/admin.controller";

@Controller("test-results")
@UseGuards(JwtAuthGuard)
export class TestResultsController {
  constructor(private testResultsService: TestResultsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Request() req,
    @Body() createTestResultDto: CreateTestResultDto,
  ) {
    return await this.testResultsService.create(
      req.user.id,
      createTestResultDto,
    );
  }

  @Get("my")
  async getMyTestResults(@Request() req) {
    const results = await this.testResultsService.findByUserId(req.user.id);
    const mapped = results.map((result) => ({
      id: result.id,
      test_name: result.test_name,
      test_id: result.test_id || result.test_name,
      main_result: result.main_result,
      completed_at: result.completed_at,
      scores: result.scores,
    }));
    return { results: mapped, data: mapped };
  }

  @Get("user/:userId")
  async getUserTestResults(
    @Param("userId") userId: string,
    @Req() req: any,
  ) {
    const requesterId = req.user?.id || req.user?.userId;
    if (requesterId !== userId && !isAdminUser(req.user)) {
      throw new ForbiddenException('دسترسی غیرمجاز');
    }
    const results = await this.testResultsService.findByUserId(userId);
    return {
      data: results.map((result) => ({
        id: result.id,
        test_name: result.test_name,
        main_result: result.main_result,
        completed_at: result.completed_at,
        scores: result.scores,
      })),
    };
  }

  @Get('history/:testId')
  async getTestHistory(@Param('testId') testId: string, @Req() req: any) {
    const userId = req.user?.userId || req.user?.id || req.user?.sub;
    const results = await this.testResultsService.dataSource.query(
      `SELECT id, test_name, main_result, scores, completed_at
       FROM test_results
       WHERE user_id=$1 AND test_name=$2
       ORDER BY completed_at DESC
       LIMIT 10`,
      [userId, testId]
    );
    return results;
  }
}
