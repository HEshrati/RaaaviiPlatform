import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Payment } from '../payments/entities/payment.entity';
import { PaymentService } from '../payment/payment.service';

@Injectable()
export class WalletService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Payment)
    private paymentsRepository: Repository<Payment>,
    @InjectDataSource() private readonly dataSource: DataSource,
    private paymentService: PaymentService,
  ) {}

  async getWallet(userId: string) {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('کاربر یافت نشد');

    return {
      balance: Number(user.credits_balance) || 0,
      currency: 'IRR',
    };
  }

  async getTransactions(userId: string) {
    const payments = await this.paymentsRepository.find({
      where: { user_id: userId },
      order: { created_at: 'DESC' },
      take: 50,
    });

    return payments.map((p) => ({
      id: p.id,
      type: p.refund_amount ? 'refund' : p.payment_method === 'wallet_debit' ? 'debit' : 'charge',
      amount: Number(p.refund_amount || p.amount),
      description: p.description || (p.payment_method === 'wallet_debit' ? 'پرداخت از کیف پول' : 'شارژ کیف پول'),
      status: p.status,
      createdAt: p.created_at,
      referenceId: p.gateway_reference,
    }));
  }

  async chargeWallet(
    userId: string,
    amount: number,
    callbackUrl: string,
    ipAddress?: string,
  ) {
    if (amount < 10000) {
      throw new BadRequestException('حداقل مبلغ شارژ ۱۰,۰۰۰ تومان است');
    }
    if (amount > 50_000_000) {
      throw new BadRequestException('حداکثر مبلغ شارژ ۵۰,۰۰۰,۰۰۰ تومان است');
    }

    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('کاربر یافت نشد');

    const { authority, paymentUrl } = await this.paymentService.requestPayment({
      userId,
      amount,
      description: `شارژ کیف پول به مبلغ ${amount.toLocaleString()} تومان`,
      mobile: (user as any).phone_number,
      paymentMethod: 'zarinpal',
      type: 'wallet_charge',
    });

    return {
      paymentId: authority,
      authority,
      paymentUrl,
      amount,
    };
  }

  async debitWallet(
    userId: string, amount: number, description: string, bookingId?: string,
    transactionalManager?: EntityManager,
  ) {
    if (!Number.isFinite(Number(amount)) || Number(amount) <= 0) {
      throw new BadRequestException('مبلغ پرداخت نامعتبر است');
    }
    const execute = async (manager: EntityManager) => {
      // کسر شرطی، مسابقهٔ دو پرداخت هم‌زمان و منفی‌شدن موجودی را حذف می‌کند.
      const updateResult = await manager.query(
        `UPDATE users
         SET credits_balance = COALESCE(credits_balance, 0) - $2, updated_at=NOW()
         WHERE id=$1 AND COALESCE(credits_balance, 0) >= $2
         RETURNING credits_balance`,
        [userId, Number(amount)],
      );
      const updated = Array.isArray(updateResult?.[0]) && typeof updateResult?.[1] === 'number'
        ? updateResult[0] : updateResult;
      if (!updated.length) {
        const exists = await manager.query(`SELECT 1 FROM users WHERE id=$1`, [userId]);
        if (!exists.length) throw new NotFoundException('کاربر یافت نشد');
        throw new BadRequestException('موجودی کافی نیست');
      }

      const payment = await manager.query(
        `INSERT INTO payments (
           user_id, booking_id, amount, currency, payment_method, description,
           status, paid_at, created_at, updated_at
         ) VALUES ($1,$2,$3,'IRR','wallet_debit',$4,'completed',NOW(),NOW(),NOW())
         RETURNING id`,
        [userId, bookingId || null, Number(amount), description],
      );
      return {
        success: true,
        paymentId: payment[0].id,
        newBalance: Number(updated[0].credits_balance),
      };
    };
    return transactionalManager
      ? execute(transactionalManager)
      : this.dataSource.transaction(execute);
  }
}
