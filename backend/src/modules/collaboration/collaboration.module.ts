import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { CollaborationService } from './collaboration.service';
import { CollaborationController } from './collaboration.controller';

@Module({
  imports: [MulterModule.register({})],
  providers: [CollaborationService],
  controllers: [CollaborationController],
  exports: [CollaborationService],
})
export class CollaborationModule {}
