import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HamravanController } from './hamravan.controller';
import { HamravanService } from './hamravan.service';
import { HamravanSession } from './entities/hamravan-session.entity';
import { WalletModule } from '../wallet/wallet.module';
import { PaymentModule } from '../payment/payment.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([HamravanSession]),
    WalletModule,
    PaymentModule,
  ],
  controllers: [HamravanController],
  providers: [HamravanService],
  exports: [HamravanService],
})
export class HamravanModule {}



