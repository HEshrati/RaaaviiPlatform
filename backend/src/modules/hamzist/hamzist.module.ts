import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HamzistController } from './hamzist.controller';
import { HamzisteService } from './hamzist.service';
import { SupportGroup } from '../my-therapist/entities/support-group.entity';
import { GroupMembership } from './entities/group-membership.entity';
import { GroupSession } from './entities/group-session.entity';
import { GroupSessionAttendance } from './entities/group-session-attendance.entity';
import { PaymentModule } from '../payment/payment.module';
import { WalletModule } from '../wallet/wallet.module';


@Module({
  imports: [
    PaymentModule,
    WalletModule,
    TypeOrmModule.forFeature([
      SupportGroup,
      GroupMembership,
      GroupSession,
      GroupSessionAttendance,
    ]),
  ],
  controllers: [HamzistController],
  providers: [HamzisteService],
  exports: [HamzisteService],
})
export class HamzistModule {}
